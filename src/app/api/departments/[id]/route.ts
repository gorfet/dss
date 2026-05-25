import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const schema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(120).optional(),
  description: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["ADMIN"]);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = await prisma.department.update({ where: { id: params.id }, data: parsed.data });
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "UPDATE",
    entity: "Department",
    entityId: params.id,
  });
  return NextResponse.json({ data });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["ADMIN"]);
  if (guard.response) return guard.response;
  await prisma.department.delete({ where: { id: params.id } });
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "DELETE",
    entity: "Department",
    entityId: params.id,
  });
  return NextResponse.json({ ok: true });
}
