import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requireRole(["ADMIN", "REGISTRAR"]);
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") ?? "summary";

  if (kind === "enrollment-status") {
    const grouped = await prisma.enrollment.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    return NextResponse.json({
      data: grouped.map((g) => ({ status: g.status, count: g._count._all })),
    });
  }

  if (kind === "by-course") {
    const courses = await prisma.course.findMany({
      include: { _count: { select: { students: true } } },
    });
    return NextResponse.json({
      data: courses.map((c) => ({
        course: c.code,
        students: c._count.students,
      })),
    });
  }

  if (kind === "by-department") {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { courses: true, faculty: true } } },
    });
    return NextResponse.json({
      data: departments.map((d) => ({
        department: d.code,
        courses: d._count.courses,
        faculty: d._count.faculty,
      })),
    });
  }

  if (kind === "faculty-workload") {
    const facs = await prisma.facultyProfile.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        sections: { include: { _count: { select: { enrollments: true } }, subject: true } },
      },
    });
    return NextResponse.json({
      data: facs.map((f) => ({
        name: `${f.user.firstName} ${f.user.lastName}`,
        sections: f.sections.length,
        students: f.sections.reduce((s, sec) => s + sec._count.enrollments, 0),
        units: f.sections.reduce((s, sec) => s + (sec.subject.units ?? 0), 0),
      })),
    });
  }

  // summary
  const [students, faculty, registrar, admins, sections, pending, semesters] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "FACULTY" } }),
      prisma.user.count({ where: { role: "REGISTRAR" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.section.count(),
      prisma.enrollment.count({ where: { status: "PENDING" } }),
      prisma.semester.count({ where: { isActive: true } }),
    ]);

  return NextResponse.json({
    data: {
      students,
      faculty,
      registrar,
      admins,
      sections,
      pendingEnrollments: pending,
      activeSemesters: semesters,
    },
  });
}
