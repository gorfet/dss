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
  const semesterId = searchParams.get("semesterId") ?? undefined;
  const subjectId = searchParams.get("subjectId") ?? undefined;
  const facultyId = searchParams.get("facultyId") ?? undefined;

  const data = await prisma.section.findMany({
    where: {
      ...(semesterId ? { semesterId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(facultyId ? { facultyId } : {}),
    },
    include: {
      subject: true,
      faculty: { include: { user: { select: { firstName: true, lastName: true } } } },
      semester: { include: { schoolYear: true } },
      schedules: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ data });
}

const schema = z.object({
  code: z.string().min(1),
  subjectId: z.string().min(1),
  semesterId: z.string().min(1),
  facultyId: z.string().optional(),
  room: z.string().optional(),
  capacity: z.coerce.number().int().min(1).max(500).default(40),
  schedules: z
    .array(
      z.object({
        day: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
        startTime: z.string(),
        endTime: z.string(),
        room: z.string().optional(),
      }),
    )
    .optional(),
});

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN", "REGISTRAR"]);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { schedules, ...rest } = parsed.data;
  const data = await prisma.section.create({
    data: {
      ...rest,
      schedules: schedules?.length
        ? { create: schedules }
        : undefined,
    },
    include: { schedules: true },
  });
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "CREATE",
    entity: "Section",
    entityId: data.id,
  });
  return NextResponse.json({ data }, { status: 201 });
}
