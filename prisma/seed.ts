import { PrismaClient, DayOfWeek } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // -----------------------------------------------------------------------
  // Departments
  // -----------------------------------------------------------------------
  const cs = await prisma.department.upsert({
    where: { code: "CS" },
    update: {},
    create: { code: "CS", name: "College of Computer Science", description: "Computing & IT programs" },
  });
  const eng = await prisma.department.upsert({
    where: { code: "ENG" },
    update: {},
    create: { code: "ENG", name: "College of Engineering" },
  });

  // -----------------------------------------------------------------------
  // Courses
  // -----------------------------------------------------------------------
  const bscs = await prisma.course.upsert({
    where: { code: "BSCS" },
    update: {},
    create: {
      code: "BSCS",
      name: "BS Computer Science",
      totalUnits: 144,
      departmentId: cs.id,
    },
  });
  const bsit = await prisma.course.upsert({
    where: { code: "BSIT" },
    update: {},
    create: {
      code: "BSIT",
      name: "BS Information Technology",
      totalUnits: 138,
      departmentId: cs.id,
    },
  });
  await prisma.course.upsert({
    where: { code: "BSCE" },
    update: {},
    create: { code: "BSCE", name: "BS Civil Engineering", totalUnits: 168, departmentId: eng.id },
  });

  // -----------------------------------------------------------------------
  // Subjects + prerequisites
  // -----------------------------------------------------------------------
  const cs101 = await prisma.subject.upsert({
    where: { code: "CS101" },
    update: {},
    create: { code: "CS101", name: "Intro to Computing", units: 3 },
  });
  const cs102 = await prisma.subject.upsert({
    where: { code: "CS102" },
    update: {},
    create: { code: "CS102", name: "Programming Fundamentals", units: 3 },
  });
  const cs201 = await prisma.subject.upsert({
    where: { code: "CS201" },
    update: {},
    create: { code: "CS201", name: "Data Structures", units: 3 },
  });
  const cs202 = await prisma.subject.upsert({
    where: { code: "CS202" },
    update: {},
    create: { code: "CS202", name: "Algorithms", units: 3 },
  });
  const math101 = await prisma.subject.upsert({
    where: { code: "MATH101" },
    update: {},
    create: { code: "MATH101", name: "College Algebra", units: 3 },
  });
  const math201 = await prisma.subject.upsert({
    where: { code: "MATH201" },
    update: {},
    create: { code: "MATH201", name: "Calculus I", units: 3 },
  });
  const eng101 = await prisma.subject.upsert({
    where: { code: "ENG101" },
    update: {},
    create: { code: "ENG101", name: "English Composition", units: 3 },
  });

  // CS102 requires CS101
  await prisma.subjectPrerequisite.upsert({
    where: { subjectId_prerequisiteId: { subjectId: cs102.id, prerequisiteId: cs101.id } },
    update: {},
    create: { subjectId: cs102.id, prerequisiteId: cs101.id },
  });
  // CS201 requires CS102
  await prisma.subjectPrerequisite.upsert({
    where: { subjectId_prerequisiteId: { subjectId: cs201.id, prerequisiteId: cs102.id } },
    update: {},
    create: { subjectId: cs201.id, prerequisiteId: cs102.id },
  });
  // CS202 requires CS201
  await prisma.subjectPrerequisite.upsert({
    where: { subjectId_prerequisiteId: { subjectId: cs202.id, prerequisiteId: cs201.id } },
    update: {},
    create: { subjectId: cs202.id, prerequisiteId: cs201.id },
  });
  // MATH201 requires MATH101
  await prisma.subjectPrerequisite.upsert({
    where: { subjectId_prerequisiteId: { subjectId: math201.id, prerequisiteId: math101.id } },
    update: {},
    create: { subjectId: math201.id, prerequisiteId: math101.id },
  });

  // Curriculum entries for BSCS
  const curriculumPlan: { subjectId: string; yearLevel: number; term: number }[] = [
    { subjectId: cs101.id, yearLevel: 1, term: 1 },
    { subjectId: math101.id, yearLevel: 1, term: 1 },
    { subjectId: eng101.id, yearLevel: 1, term: 1 },
    { subjectId: cs102.id, yearLevel: 1, term: 2 },
    { subjectId: math201.id, yearLevel: 1, term: 2 },
    { subjectId: cs201.id, yearLevel: 2, term: 1 },
    { subjectId: cs202.id, yearLevel: 2, term: 2 },
  ];
  for (const c of curriculumPlan) {
    await prisma.curriculumEntry.upsert({
      where: { courseId_subjectId: { courseId: bscs.id, subjectId: c.subjectId } },
      update: { yearLevel: c.yearLevel, term: c.term },
      create: { courseId: bscs.id, ...c },
    });
  }

  // -----------------------------------------------------------------------
  // School year + semester
  // -----------------------------------------------------------------------
  const sy = await prisma.schoolYear.upsert({
    where: { name: "2025-2026" },
    update: { isActive: true },
    create: {
      name: "2025-2026",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-05-31"),
      isActive: true,
    },
  });
  const sem = await prisma.semester.upsert({
    where: { schoolYearId_term: { schoolYearId: sy.id, term: "FIRST" } },
    update: { isActive: true },
    create: {
      schoolYearId: sy.id,
      term: "FIRST",
      startDate: new Date("2025-08-15"),
      endDate: new Date("2025-12-20"),
      enrollmentStart: new Date("2025-07-15"),
      enrollmentEnd: new Date("2025-08-20"),
      isActive: true,
    },
  });

  // -----------------------------------------------------------------------
  // Users — admin / registrar / faculty / students
  // -----------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@dss.local" },
    update: {},
    create: {
      email: "admin@dss.local", firstName: "System", lastName: "Admin",
      role: "ADMIN", status: "ACTIVE", passwordHash,
    },
  });
  const registrar = await prisma.user.upsert({
    where: { email: "registrar@dss.local" },
    update: {},
    create: {
      email: "registrar@dss.local", firstName: "Reggie", lastName: "Strar",
      role: "REGISTRAR", status: "ACTIVE", passwordHash,
    },
  });

  const facultyUser = await prisma.user.upsert({
    where: { email: "faculty@dss.local" },
    update: {},
    create: {
      email: "faculty@dss.local", firstName: "Faye", lastName: "Cultry",
      role: "FACULTY", status: "ACTIVE", passwordHash,
      facultyProfile: { create: { employeeNo: "EMP-001", rank: "Asst. Prof.", departmentId: cs.id } },
    },
    include: { facultyProfile: true },
  });
  const facultyUser2 = await prisma.user.upsert({
    where: { email: "prof2@dss.local" },
    update: {},
    create: {
      email: "prof2@dss.local", firstName: "Pete", lastName: "Trofessor",
      role: "FACULTY", status: "ACTIVE", passwordHash,
      facultyProfile: { create: { employeeNo: "EMP-002", rank: "Instructor", departmentId: cs.id } },
    },
    include: { facultyProfile: true },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@dss.local" },
    update: {},
    create: {
      email: "student@dss.local", firstName: "Stu", lastName: "Dent",
      role: "STUDENT", status: "ACTIVE", passwordHash,
      studentProfile: { create: { studentNo: "2025-00001", courseId: bscs.id, yearLevel: "FIRST_YEAR" } },
    },
    include: { studentProfile: true },
  });
  const studentUser2 = await prisma.user.upsert({
    where: { email: "student2@dss.local" },
    update: {},
    create: {
      email: "student2@dss.local", firstName: "Sam", lastName: "Sample",
      role: "STUDENT", status: "ACTIVE", passwordHash,
      studentProfile: { create: { studentNo: "2025-00002", courseId: bsit.id, yearLevel: "FIRST_YEAR" } },
    },
    include: { studentProfile: true },
  });

  // -----------------------------------------------------------------------
  // Sections + schedules
  // -----------------------------------------------------------------------
  const sectionsToCreate: Array<{
    code: string;
    subjectId: string;
    facultyId: string;
    capacity: number;
    schedules: { day: DayOfWeek; startTime: string; endTime: string; room: string }[];
  }> = [
    {
      code: "CS101-A", subjectId: cs101.id, facultyId: facultyUser.facultyProfile!.id, capacity: 30,
      schedules: [{ day: DayOfWeek.MON, startTime: "08:00", endTime: "09:30", room: "Rm 401" },
                  { day: DayOfWeek.WED, startTime: "08:00", endTime: "09:30", room: "Rm 401" }],
    },
    {
      code: "CS102-A", subjectId: cs102.id, facultyId: facultyUser.facultyProfile!.id, capacity: 30,
      schedules: [{ day: DayOfWeek.TUE, startTime: "10:00", endTime: "11:30", room: "Rm 402" },
                  { day: DayOfWeek.THU, startTime: "10:00", endTime: "11:30", room: "Rm 402" }],
    },
    {
      code: "MATH101-A", subjectId: math101.id, facultyId: facultyUser2.facultyProfile!.id, capacity: 40,
      schedules: [{ day: DayOfWeek.MON, startTime: "10:00", endTime: "11:30", room: "Rm 201" },
                  { day: DayOfWeek.WED, startTime: "10:00", endTime: "11:30", room: "Rm 201" }],
    },
    {
      code: "ENG101-A", subjectId: eng101.id, facultyId: facultyUser2.facultyProfile!.id, capacity: 40,
      schedules: [{ day: DayOfWeek.FRI, startTime: "13:00", endTime: "16:00", room: "Rm 305" }],
    },
  ];
  for (const s of sectionsToCreate) {
    await prisma.section.upsert({
      where: { code_semesterId: { code: s.code, semesterId: sem.id } },
      update: {},
      create: {
        code: s.code,
        subjectId: s.subjectId,
        semesterId: sem.id,
        facultyId: s.facultyId,
        capacity: s.capacity,
        schedules: { create: s.schedules },
      },
    });
  }

  // -----------------------------------------------------------------------
  // Sample assessment for primary student
  // -----------------------------------------------------------------------
  if (studentUser.studentProfile) {
    await prisma.payment.upsert({
      where: {
        studentId_semesterId: { studentId: studentUser.studentProfile.id, semesterId: sem.id },
      },
      update: {},
      create: {
        studentId: studentUser.studentProfile.id,
        semesterId: sem.id,
        tuition: 30000,
        miscFees: 5000,
        discount: 0,
        totalDue: 35000,
        amountPaid: 10000,
        status: "PARTIAL",
      },
    });
  }

  // -----------------------------------------------------------------------
  // Announcement
  // -----------------------------------------------------------------------
  await prisma.announcement.create({
    data: {
      title: "Welcome to DSS Enrollment",
      body: "Enrollment for First Semester SY 2025-2026 is now open. Please complete your enrollment by Aug 20.",
      audience: "ALL",
      pinned: true,
      authorId: admin.id,
    },
  });

  console.log("Seed complete. Login with any of:");
  console.log("  admin@dss.local / password123");
  console.log("  registrar@dss.local / password123");
  console.log("  faculty@dss.local / password123");
  console.log("  student@dss.local / password123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
