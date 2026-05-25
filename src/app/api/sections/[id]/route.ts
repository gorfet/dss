import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const schema = z.object({
  facultyId: z.string().nullable().optional(),
  room: z.string().nullable().optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
});

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["ADMIN", "REGISTRAR"]);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = await prisma.section.update({
    where: { id: params.id },
    data: parsed.data,
  });
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "UPDATE",
    entity: "Section",
    entityId: params.id,
  });
  return NextResponse.json({ data });
}
