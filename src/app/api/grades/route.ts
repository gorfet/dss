import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

const schema = z.object({
  enrollmentId: z.string().min(1),
  prelim: z.number().nullable().optional(),
  midterm: z.number().nullable().optional(),
  finals: z.number().nullable().optional(),
  finalGrade: z.number().nullable().optional(),
  remarks: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const role = guard.session!.user.role;
  if (role !== "FACULTY" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: parsed.data.enrollmentId },
    include: {
      section: { include: { subject: true, faculty: true } },
      student: true,
    },
  });
  if (!enrollment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (role === "FACULTY") {
    const profile = await prisma.facultyProfile.findUnique({
      where: { userId: guard.session!.user.id },
    });
    if (!profile || enrollment.section.facultyId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { enrollmentId, ...rest } = parsed.data;
  const computedFinal =
    rest.finalGrade ??
    (rest.prelim != null && rest.midterm != null && rest.finals != null
      ? Number(
          (
            (rest.prelim * 0.3 + rest.midterm * 0.3 + rest.finals * 0.4)
          ).toFixed(2),
        )
      : null);

  const data = await prisma.grade.upsert({
    where: { enrollmentId },
    create: {
      enrollmentId,
      ...rest,
      finalGrade: computedFinal,
      postedAt: computedFinal != null ? new Date() : null,
      postedById: computedFinal != null ? guard.session!.user.id : null,
    },
    update: {
      ...rest,
      finalGrade: computedFinal,
      postedAt: computedFinal != null ? new Date() : null,
      postedById: computedFinal != null ? guard.session!.user.id : null,
    },
  });

  // If a final grade is posted, mark enrollment COMPLETED
  if (computedFinal != null && enrollment.status === "APPROVED") {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "COMPLETED" },
    });
  }

  await audit({
    userId: guard.session!.user.id,
    action: "UPDATE",
    entity: "Grade",
    entityId: data.id,
  });

  if (computedFinal != null) {
    await notify({
      userId: enrollment.student.userId,
      type: "GRADE",
      title: "Grade posted",
      body: `${enrollment.section.subject.code}: ${computedFinal.toFixed(2)}`,
      link: "/dashboard/student/grades",
    });
  }

  return NextResponse.json({ data });
}
