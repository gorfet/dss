import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CorView } from "@/components/cor-view";

export const dynamic = "force-dynamic";

export default async function CORPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true, course: { include: { department: true } } },
  });
  const activeSem = await prisma.semester.findFirst({
    where: { isActive: true },
    include: { schoolYear: true },
  });
  const enrollments = sp && activeSem
    ? await prisma.enrollment.findMany({
        where: { studentId: sp.id, semesterId: activeSem.id, status: { in: ["APPROVED", "PENDING"] } },
        include: {
          section: { include: { subject: true, schedules: true, faculty: { include: { user: true } } } },
        },
      })
    : [];

  return (
    <CorView
      student={sp ? {
        studentNo: sp.studentNo,
        name: `${sp.user.firstName} ${sp.user.lastName}`,
        course: sp.course?.code ?? "—",
        department: sp.course?.department?.name ?? "—",
      } : null}
      semester={activeSem ? `${activeSem.schoolYear.name} — ${activeSem.term}` : null}
      enrollments={enrollments.map((e) => ({
        subjectCode: e.section.subject.code,
        subjectName: e.section.subject.name,
        units: e.section.subject.units,
        section: e.section.code,
        faculty: e.section.faculty ? `${e.section.faculty.user.firstName} ${e.section.faculty.user.lastName}` : "TBA",
        schedules: e.section.schedules.map((s) => ({ day: s.day, start: s.startTime, end: s.endTime, room: s.room ?? "" })),
        status: e.status,
      }))}
    />
  );
}
