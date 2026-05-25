import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const data = await prisma.course.findMany({
    include: { department: true, _count: { select: { students: true, curriculum: true } } },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ data });
}

const schema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  description: z.string().optional(),
  totalUnits: z.coerce.number().int().min(0).max(400).default(0),
  departmentId: z.string().min(1),
});

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN"]);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = await prisma.course.create({ data: parsed.data });
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "CREATE",
    entity: "Course",
    entityId: data.id,
  });
  return NextResponse.json({ data }, { status: 201 });
}
