import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notifyMany } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const role = guard.session!.user.role;
  const { searchParams } = new URL(req.url);
  const audience = searchParams.get("audience") ?? undefined;

  const where: Record<string, unknown> = {};
  if (audience) where.audience = audience;
  else {
    // Show ALL + role-specific
    where.OR = [{ audience: "ALL" }, { audience: role + "S" }, { audience: role }];
  }

  const data = await prisma.announcement.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    include: {
      author: { select: { firstName: true, lastName: true, role: true } },
    },
    take: 100,
  });
  return NextResponse.json({ data });
}

const schema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().min(1),
  audience: z.enum(["ALL", "STUDENTS", "FACULTY", "REGISTRAR", "ADMIN", "SECTION"]).default("ALL"),
  sectionId: z.string().optional(),
  pinned: z.boolean().default(false),
});

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN", "REGISTRAR", "FACULTY"]);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data = await prisma.announcement.create({
    data: {
      ...parsed.data,
      authorId: guard.session!.user.id,
    },
  });

  await audit({
    userId: guard.session!.user.id,
    action: "CREATE",
    entity: "Announcement",
    entityId: data.id,
  });

  // Fan-out notifications based on audience
  const audience = parsed.data.audience;
  let targetUsers: { id: string }[] = [];
  if (audience === "ALL") {
    targetUsers = await prisma.user.findMany({ select: { id: true } });
  } else if (audience === "SECTION" && parsed.data.sectionId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: parsed.data.sectionId },
      include: { student: { select: { userId: true } } },
    });
    targetUsers = enrollments.map((e) => ({ id: e.student.userId }));
  } else {
    const role = audience === "STUDENTS" ? "STUDENT" : audience;
    targetUsers = await prisma.user.findMany({
      where: { role: role as "STUDENT" | "FACULTY" | "REGISTRAR" | "ADMIN" },
      select: { id: true },
    });
  }
  if (targetUsers.length) {
    await notifyMany(
      targetUsers.map((u) => ({
        userId: u.id,
        type: "ANNOUNCEMENT" as const,
        title: parsed.data.title,
        body: parsed.data.body.slice(0, 200),
        link: "/dashboard",
      })),
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
