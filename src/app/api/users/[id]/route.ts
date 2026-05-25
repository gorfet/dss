import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED"]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["ADMIN", "REGISTRAR"]);
  if (guard.response) return guard.response;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: parsed.data,
  });
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "UPDATE",
    entity: "User",
    entityId: params.id,
    metadata: parsed.data as Record<string, unknown>,
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["ADMIN"]);
  if (guard.response) return guard.response;
  await prisma.user.delete({ where: { id: params.id } });
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "DELETE",
    entity: "User",
    entityId: params.id,
  });
  return NextResponse.json({ ok: true });
}
