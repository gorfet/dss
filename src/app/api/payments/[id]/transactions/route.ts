import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

const schema = z.object({
  amount: z.number().positive(),
  method: z.enum(["CASH", "BANK", "ONLINE"]).default("CASH"),
  reference: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["ADMIN", "REGISTRAR"]);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: { student: true },
  });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newPaid = payment.amountPaid + parsed.data.amount;
  const status =
    newPaid >= payment.totalDue ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

  await prisma.$transaction([
    prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        amount: parsed.data.amount,
        method: parsed.data.method,
        reference: parsed.data.reference,
      },
    }),
    prisma.payment.update({
      where: { id: payment.id },
      data: { amountPaid: newPaid, status },
    }),
  ]);

  await audit({
    userId: guard.session!.user.id,
    action: "PAYMENT",
    entity: "Payment",
    entityId: payment.id,
    metadata: { amount: parsed.data.amount, method: parsed.data.method },
  });

  await notify({
    userId: payment.student.userId,
    type: "PAYMENT",
    title: "Payment recorded",
    body: `+${parsed.data.amount.toFixed(2)} — balance: ${(payment.totalDue - newPaid).toFixed(2)}`,
    link: "/dashboard/student/balance",
  });

  return NextResponse.json({ ok: true });
}
