import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const schema = z.object({
  schoolYearId: z.string().min(1),
  term: z.enum(["FIRST", "SECOND", "SUMMER"]),
  startDate: z.string(),
  endDate: z.string(),
  enrollmentStart: z.string().optional(),
  enrollmentEnd: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN"]);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;
  const data = await prisma.semester.create({
    data: {
      schoolYearId: d.schoolYearId,
      term: d.term,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      enrollmentStart: d.enrollmentStart ? new Date(d.enrollmentStart) : null,
      enrollmentEnd: d.enrollmentEnd ? new Date(d.enrollmentEnd) : null,
      isActive: d.isActive ?? false,
    },
  });
  if (d.isActive) {
    await prisma.semester.updateMany({
      where: { id: { not: data.id } },
      data: { isActive: false },
    });
  }
  await audit({
    userId: guard.session?.user.id ?? null,
    action: "CREATE",
    entity: "Semester",
    entityId: data.id,
  });
  return NextResponse.json({ data }, { status: 201 });
}
