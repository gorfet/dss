import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function POST() {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  await prisma.notification.updateMany({
    where: { userId: guard.session!.user.id, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
