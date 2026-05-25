import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const body = rows
    .map((r) => headers.map((h) => escape(r[h])).join(","))
    .join("\n");
  return `${headers.join(",")}\n${body}`;
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requireRole(["ADMIN", "REGISTRAR"]);
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") ?? "enrollments";

  let rows: Record<string, unknown>[] = [];
  let filename = `${kind}.csv`;

  if (kind === "enrollments") {
    const data = await prisma.enrollment.findMany({
      include: {
        student: { include: { user: true } },
        section: { include: { subject: true } },
        semester: { include: { schoolYear: true } },
      },
    });
    rows = data.map((e) => ({
      studentNo: e.student.studentNo,
      studentName: `${e.student.user.firstName} ${e.student.user.lastName}`,
      email: e.student.user.email,
      subjectCode: e.section.subject.code,
      subjectName: e.section.subject.name,
      sectionCode: e.section.code,
      semester: `${e.semester.schoolYear.name} ${e.semester.term}`,
      status: e.status,
      enrolledAt: e.createdAt.toISOString(),
    }));
  } else if (kind === "students") {
    const data = await prisma.studentProfile.findMany({
      include: { user: true, course: true },
    });
    rows = data.map((s) => ({
      studentNo: s.studentNo,
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      email: s.user.email,
      course: s.course?.code ?? "",
      yearLevel: s.yearLevel,
      status: s.user.status,
    }));
  } else if (kind === "grades") {
    const data = await prisma.grade.findMany({
      include: {
        enrollment: {
          include: {
            student: { include: { user: true } },
            section: { include: { subject: true } },
          },
        },
      },
    });
    rows = data.map((g) => ({
      studentNo: g.enrollment.student.studentNo,
      studentName: `${g.enrollment.student.user.firstName} ${g.enrollment.student.user.lastName}`,
      subject: g.enrollment.section.subject.code,
      prelim: g.prelim ?? "",
      midterm: g.midterm ?? "",
      finals: g.finals ?? "",
      finalGrade: g.finalGrade ?? "",
    }));
  }

  const csv = toCSV(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
