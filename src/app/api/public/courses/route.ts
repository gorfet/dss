import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await prisma.course.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ data });
}
