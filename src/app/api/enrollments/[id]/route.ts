import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

const patchSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "WITHDRAWN", "COMPLETED"]).optional(),
  notes: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["ADMIN", "REGISTRAR"]);
  if (guard.response) return guard.response;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: params.id },
    include: { section: { include: { subject: true } }, student: { include: { user: true } } },
  });
  if (!enrollment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update = {
    ...parsed.data,
    approvedById: guard.session!.user.id,
    approvedAt: new Date(),
  };

  const data = await prisma.enrollment.update({
    where: { id: params.id },
    data: update,
  });

  await audit({
    userId: guard.session!.user.id,
    action: "APPROVE",
    entity: "Enrollment",
    entityId: params.id,
    metadata: { status: parsed.data.status },
  });

  if (parsed.data.status) {
    await notify({
      userId: enrollment.student.userId,
      type: "ENROLLMENT",
      title: `Enrollment ${parsed.data.status.toLowerCase()}`,
      body: `${enrollment.section.subject.code} — ${enrollment.section.code}`,
      link: "/dashboard/student",
    });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const role = guard.session!.user.role;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: params.id },
    include: { student: true },
  });
  if (!enrollment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (role === "STUDENT" && enrollment.student.userId !== guard.session!.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.enrollment.update({
      where: { id: params.id },
      data: { status: "WITHDRAWN" },
    });
    if (enrollment.status === "APPROVED" || enrollment.status === "PENDING") {
      await tx.section.update({
        where: { id: enrollment.sectionId },
        data: { enrolled: { decrement: 1 } },
      });
    }
  });

  await audit({
    userId: guard.session!.user.id,
    action: "WITHDRAW",
    entity: "Enrollment",
    entityId: params.id,
  });

  return NextResponse.json({ ok: true });
}
