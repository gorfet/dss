import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

const schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  studentNo: z.string().min(3).max(40),
  courseId: z.string().optional().or(z.literal("")),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { firstName, lastName, email, password, studentNo, courseId } =
    parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 },
    );
  }
  const existingStudent = await prisma.studentProfile.findUnique({
    where: { studentNo },
  });
  if (existingStudent) {
    return NextResponse.json(
      { error: "Student number already in use" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      role: "STUDENT",
      status: "PENDING",
      passwordHash,
      studentProfile: {
        create: {
          studentNo,
          courseId: courseId || null,
        },
      },
    },
    include: { studentProfile: true },
  });

  await audit({
    userId: user.id,
    action: "CREATE",
    entity: "User",
    entityId: user.id,
    metadata: { role: "STUDENT" },
  });

  return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
}
