import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!allowed.includes(session.user.role)) {
    return {
      session,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, response: null as NextResponse | null };
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, response: null as NextResponse | null };
}

export function roleHome(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "REGISTRAR":
      return "/dashboard/registrar";
    case "FACULTY":
      return "/dashboard/faculty";
    case "STUDENT":
      return "/dashboard/student";
    default:
      return "/dashboard";
  }
}
