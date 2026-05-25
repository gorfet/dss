import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, BookOpen, ClipboardList, Wallet, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, gpa } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentOverview() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { course: true },
  });

  const activeSem = await prisma.semester.findFirst({ where: { isActive: true }, include: { schoolYear: true } });

  const [enrollments, grades, payments] = profile
    ? await Promise.all([
        prisma.enrollment.findMany({
          where: { studentId: profile.id },
          include: { section: { include: { subject: true } } },
        }),
        prisma.grade.findMany({
          where: { enrollment: { studentId: profile.id }, finalGrade: { not: null } },
        }),
        prisma.payment.findMany({
          where: { studentId: profile.id },
        }),
      ])
    : [[], [], []];

  const approved = enrollments.filter((e) => e.status === "APPROVED" || e.status === "COMPLETED");
  const units = approved.reduce((s, e) => s + e.section.subject.units, 0);

  const gwa = grades.length
    ? grades.reduce((s, g) => s + (g.finalGrade ?? 0), 0) / grades.length
    : null;

  const balance = payments.reduce(
    (s, p) => s + (p.totalDue - p.amountPaid),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${session.user.name.split(" ")[0]}`}
        description={`${profile?.course?.code ?? "—"} · Student #${profile?.studentNo ?? "—"} · ${activeSem ? `${activeSem.schoolYear.name} ${activeSem.term}` : "No active term"}`}
        actions={
          <Button asChild>
            <Link href="/dashboard/student/enroll">
              Enroll now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled subjects" value={approved.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Total units" value={units} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="GWA" value={gwa != null ? gpa(gwa) : "—"} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Balance" value={formatCurrency(balance)} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent enrollments</CardTitle></CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrollments yet — head to the Enroll page to start.</p>
          ) : (
            <ul className="space-y-2">
              {enrollments.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{e.section.subject.code} — {e.section.subject.name}</p>
                    <p className="text-xs text-muted-foreground">Section {e.section.code}</p>
                  </div>
                  <Badge variant={
                    e.status === "APPROVED" || e.status === "COMPLETED" ? "success"
                    : e.status === "PENDING" ? "warning"
                    : e.status === "WAITLISTED" ? "info"
                    : "destructive"
                  }>{e.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
