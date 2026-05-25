import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const schema = z.object({
  sectionId: z.string().min(1),
  date: z.string(),
  entries: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      remarks: z.string().optional(),
    }),
  ),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const role = guard.session!.user.role;
  if (role !== "FACULTY" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { sectionId, date, entries } = parsed.data;

  if (role === "FACULTY") {
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    const profile = await prisma.facultyProfile.findUnique({
      where: { userId: guard.session!.user.id },
    });
    if (!section || !profile || section.facultyId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const dt = new Date(date);
  await prisma.$transaction(
    entries.map((e) =>
      prisma.attendance.upsert({
        where: {
          studentId_sectionId_date: {
            studentId: e.studentId,
            sectionId,
            date: dt,
          },
        },
        create: { ...e, sectionId, date: dt },
        update: { status: e.status, remarks: e.remarks },
      }),
    ),
  );

  await audit({
    userId: guard.session!.user.id,
    action: "UPDATE",
    entity: "Attendance",
    entityId: sectionId,
    metadata: { date, count: entries.length },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId") ?? undefined;
  if (!sectionId) return NextResponse.json({ data: [] });
  const data = await prisma.attendance.findMany({
    where: { sectionId },
    orderBy: { date: "desc" },
    include: { student: { include: { user: true } } },
    take: 500,
  });
  return NextResponse.json({ data });
}
