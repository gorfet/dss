import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { checkEnrollmentRules } from "@/lib/enrollment";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const role = guard.session!.user.role;
  const userId = guard.session!.user.id;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const semesterId = searchParams.get("semesterId") ?? undefined;

  const where: Record<string, unknown> = {
    ...(status ? { status } : {}),
    ...(semesterId ? { semesterId } : {}),
  };

  if (role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ data: [] });
    where.studentId = profile.id;
  }

  if (role === "FACULTY") {
    const profile = await prisma.facultyProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ data: [] });
    where.section = { facultyId: profile.id };
  }

  const data = await prisma.enrollment.findMany({
    where,
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      section: {
        include: {
          subject: true,
          schedules: true,
          faculty: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      },
      semester: { include: { schoolYear: true } },
      grade: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ data });
}

const schema = z.object({ sectionId: z.string().min(1) });

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const role = guard.session!.user.role;
  if (role !== "STUDENT") return NextResponse.json({ error: "Students only" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const student = await prisma.studentProfile.findUnique({
    where: { userId: guard.session!.user.id },
  });
  if (!student) return NextResponse.json({ error: "Student profile missing" }, { status: 400 });

  const check = await checkEnrollmentRules({
    studentId: student.id,
    sectionId: parsed.data.sectionId,
  });
  if (!check.ok) {
    return NextResponse.json({ error: check.reason ?? "Cannot enroll" }, { status: 400 });
  }
  const section = check.section!;

  const created = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: section.id,
        semesterId: section.semesterId,
        status: check.waitlist ? "WAITLISTED" : "PENDING",
      },
    });
    if (!check.waitlist) {
      await tx.section.update({
        where: { id: section.id },
        data: { enrolled: { increment: 1 } },
      });
    }
    return enrollment;
  });

  await audit({
    userId: guard.session!.user.id,
    action: "CREATE",
    entity: "Enrollment",
    entityId: created.id,
  });

  await notify({
    userId: guard.session!.user.id,
    type: "ENROLLMENT",
    title: check.waitlist ? "Added to waitlist" : "Enrollment submitted",
    body: `Subject: ${section.subject.code} (${section.code})`,
    link: "/dashboard/student/enroll",
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
