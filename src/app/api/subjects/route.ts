import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const data = await prisma.subject.findMany({
    where: q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      prerequisites: { include: { prerequisite: { select: { id: true, code: true, name: true } } } },
    },
    orderBy: { code: "asc" },
    take: 100,
  });
  return NextResponse.json({ data });
}

const schema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  description: z.string().optional(),
  units: z.coerce.number().int().min(0).max(12).default(3),
  lectureHours: z.coerce.number().int().min(0).max(20).default(3),
  labHours: z.coerce.number().int().min(0).max(20).default(0),
  prerequisiteIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN"]);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { prerequisiteIds, ...rest } = parsed.data;
  const data = await prisma.subject.create({
    data: {
      ...rest,
      prerequisites: prerequisiteIds?.length
        ? { create: prerequisiteIds.map((id) => ({ prerequisiteId: id })) }
        : undefined,
    },
  });
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "CREATE",
    entity: "Subject",
    entityId: data.id,
  });
  return NextResponse.json({ data }, { status: 201 });
}
