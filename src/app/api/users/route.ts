import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const listQuery = z.object({
  q: z.string().optional(),
  role: z.enum(["ADMIN", "REGISTRAR", "FACULTY", "STUDENT"]).optional(),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requireRole(["ADMIN", "REGISTRAR"]);
  if (guard.response) return guard.response;

  const { searchParams } = new URL(req.url);
  const parsed = listQuery.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  const { q, role, status, page, pageSize } = parsed.data;

  const where = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        studentProfile: { select: { studentNo: true, courseId: true } },
        facultyProfile: { select: { employeeNo: true, departmentId: true } },
      },
    }),
  ]);

  return NextResponse.json({ data: items, total, page, pageSize });
}

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "REGISTRAR", "FACULTY", "STUDENT"]),
  studentNo: z.string().optional(),
  courseId: z.string().optional(),
  employeeNo: z.string().optional(),
  departmentId: z.string().optional(),
});

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN"]);
  if (guard.response) return guard.response;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, password, firstName, lastName, role, studentNo, courseId, employeeNo, departmentId } =
    parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "Email already used" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role,
      status: "ACTIVE",
      ...(role === "STUDENT" && studentNo
        ? { studentProfile: { create: { studentNo, courseId: courseId || null } } }
        : {}),
      ...(role === "FACULTY" && employeeNo
        ? { facultyProfile: { create: { employeeNo, departmentId: departmentId || null } } }
        : {}),
    },
  });

  await audit({
    userId: guard.session?.user.id ?? null,
    action: "CREATE",
    entity: "User",
    entityId: user.id,
    metadata: { role },
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
