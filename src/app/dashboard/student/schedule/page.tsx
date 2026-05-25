import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  const enrollments = sp
    ? await prisma.enrollment.findMany({
        where: { studentId: sp.id, status: { in: ["APPROVED", "PENDING"] } },
        include: {
          section: { include: { subject: true, schedules: true, faculty: { include: { user: true } } } },
        },
      })
    : [];

  // Bucket schedules by day
  const byDay: Record<string, { code: string; name: string; start: string; end: string; room?: string | null; faculty?: string }[]> = {};
  for (const e of enrollments) {
    for (const s of e.section.schedules) {
      (byDay[s.day] ??= []).push({
        code: e.section.subject.code,
        name: e.section.subject.name,
        start: s.startTime,
        end: s.endTime,
        room: s.room ?? null,
        faculty: e.section.faculty ? `${e.section.faculty.user.firstName} ${e.section.faculty.user.lastName}` : undefined,
      });
    }
  }
  for (const day of Object.keys(byDay)) byDay[day].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="space-y-6">
      <PageHeader title="My schedule" description="Weekly view of approved (and pending) classes." />
      <div className="grid gap-3 lg:grid-cols-6">
        {DAYS.map((d) => (
          <Card key={d}>
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d}</p>
              {(byDay[d] ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                byDay[d].map((s, i) => (
                  <div key={i} className="rounded-md border p-2">
                    <p className="text-xs font-mono">{s.start}–{s.end}</p>
                    <p className="text-sm font-medium">{s.code}</p>
                    <p className="text-xs text-muted-foreground">{s.name}</p>
                    {s.room && <Badge variant="outline" className="mt-1">Rm {s.room}</Badge>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
