import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const data = await prisma.schoolYear.findMany({
    include: { semesters: true },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({ data });
}

const schema = z.object({
  name: z.string().min(1).max(20),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().optional(),
});

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN"]);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = await prisma.schoolYear.create({
    data: {
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      isActive: parsed.data.isActive ?? false,
    },
  });
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "CREATE",
    entity: "SchoolYear",
    entityId: data.id,
  });
  return NextResponse.json({ data }, { status: 201 });
}
