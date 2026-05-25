import { redirect } from "next/navigation";
import { BookOpen, Users, ClipboardList, Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function FacultyOverview() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = await prisma.facultyProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      sections: {
        include: {
          subject: true,
          schedules: true,
          semester: { include: { schoolYear: true } },
          _count: { select: { enrollments: true } },
        },
      },
    },
  });

  const sections = profile?.sections ?? [];
  const totalStudents = sections.reduce((s, sec) => s + sec._count.enrollments, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Faculty Overview" description={`Welcome, ${session.user.name}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My sections" value={sections.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Students" value={totalStudents} icon={<Users className="h-5 w-5" />} />
        <StatCard label="To grade" value={sections.length} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Announcements" value={"—"} icon={<Megaphone className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>My classes</CardTitle></CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sections assigned yet.</p>
          ) : (
            <ul className="space-y-3">
              {sections.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{s.subject.code} — {s.subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.code} · {s.semester.schoolYear.name} {s.semester.term}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.schedules.map((sch, i) => (
                        <Badge key={i} variant="outline">{sch.day} {sch.startTime}–{sch.endTime}</Badge>
                      ))}
                    </div>
                  </div>
                  <Badge variant="info">{s._count.enrollments} enrolled</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
