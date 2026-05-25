import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const role = guard.session!.user.role;
  const { searchParams } = new URL(req.url);
  const semesterId = searchParams.get("semesterId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const where: Record<string, unknown> = {
    ...(semesterId ? { semesterId } : {}),
    ...(status ? { status } : {}),
  };

  if (role === "STUDENT") {
    const sp = await prisma.studentProfile.findUnique({ where: { userId: guard.session!.user.id } });
    if (!sp) return NextResponse.json({ data: [] });
    where.studentId = sp.id;
  }

  const data = await prisma.payment.findMany({
    where,
    include: {
      student: { include: { user: true } },
      semester: { include: { schoolYear: true } },
      transactions: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ data });
}

const upsertSchema = z.object({
  studentId: z.string().min(1),
  semesterId: z.string().min(1),
  tuition: z.number().min(0),
  miscFees: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  scholarship: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN", "REGISTRAR"]);
  if (guard.response) return guard.response;
  const parsed = upsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;
  const totalDue = Math.max(0, d.tuition + d.miscFees - d.discount);
  const data = await prisma.payment.upsert({
    where: { studentId_semesterId: { studentId: d.studentId, semesterId: d.semesterId } },
    create: {
      studentId: d.studentId,
      semesterId: d.semesterId,
      tuition: d.tuition,
      miscFees: d.miscFees,
      discount: d.discount,
      scholarship: d.scholarship,
      notes: d.notes,
      totalDue,
    },
    update: {
      tuition: d.tuition,
      miscFees: d.miscFees,
      discount: d.discount,
      scholarship: d.scholarship,
      notes: d.notes,
      totalDue,
    },
    include: { student: true },
  });
  await audit({
    userId: guard.session!.user.id,
    action: "UPSERT",
    entity: "Payment",
    entityId: data.id,
  });
  await notify({
    userId: data.student.userId,
    type: "PAYMENT",
    title: "Assessment updated",
    body: `Total due: ${totalDue.toFixed(2)}`,
    link: "/dashboard/student/balance",
  });
  return NextResponse.json({ data });
}
