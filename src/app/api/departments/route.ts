import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, requireAuth } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const data = await prisma.department.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { courses: true, faculty: true } } },
  });
  return NextResponse.json({ data });
}

const schema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN"]);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const created = await prisma.department.create({ data: parsed.data });
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "CREATE",
    entity: "Department",
    entityId: created.id,
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
