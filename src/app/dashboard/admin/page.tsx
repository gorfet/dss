import { Users, GraduationCap, BookOpen, CheckSquare, CalendarDays, Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentChart } from "@/components/charts/enrollment-chart";
import { CourseDistributionChart } from "@/components/charts/course-distribution-chart";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [studentCount, facultyCount, courseCount, sectionCount, pending, semester, recentAnnouncements] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "FACULTY" } }),
      prisma.course.count(),
      prisma.section.count(),
      prisma.enrollment.count({ where: { status: "PENDING" } }),
      prisma.semester.findFirst({
        where: { isActive: true },
        include: { schoolYear: true },
      }),
      prisma.announcement.findMany({
        take: 5,
        orderBy: { publishedAt: "desc" },
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
    ]);

  const statusBuckets = await prisma.enrollment.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const courseStats = await prisma.course.findMany({
    take: 6,
    include: { _count: { select: { students: true } } },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Overview"
        description="Health and activity across the enrollment system."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={studentCount} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Faculty" value={facultyCount} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Courses" value={courseCount} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard
          label="Active sections"
          value={sectionCount}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          label="Pending enrollments"
          value={pending}
          icon={<CheckSquare className="h-5 w-5" />}
        />
        <StatCard
          label="Current term"
          value={semester ? `${semester.schoolYear.name} ${semester.term}` : "—"}
          hint={semester ? `${formatDate(semester.startDate)} → ${formatDate(semester.endDate)}` : "Not set"}
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment status</CardTitle>
          </CardHeader>
          <CardContent>
            <EnrollmentChart
              data={statusBuckets.map((b) => ({ status: b.status, count: b._count._all }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Students per course</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseDistributionChart
              data={courseStats.map((c) => ({ course: c.code, students: c._count.students }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Recent announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            <ul className="divide-y">
              {recentAnnouncements.map((a) => (
                <li key={a.id} className="py-3">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.author.firstName} {a.author.lastName} · {formatDate(a.publishedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
