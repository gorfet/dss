import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const data = await prisma.notification.findMany({
    where: { userId: guard.session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ data });
}
