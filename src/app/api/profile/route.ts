import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const schema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  password: z.string().min(8).optional(),
});

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const guard = await requireAuth();
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { password, ...rest } = parsed.data;
  const data = await prisma.user.update({
    where: { id: guard.session!.user.id },
    data: {
      ...rest,
      ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
    },
  });
  await audit({
    userId: guard.session!.user.id,
    action: "UPDATE",
    entity: "User",
    entityId: guard.session!.user.id,
  });
  return NextResponse.json({ data });
}
