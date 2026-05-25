import { CheckSquare, Users, ListChecks, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentChart } from "@/components/charts/enrollment-chart";

export const dynamic = "force-dynamic";

export default async function RegistrarOverview() {
  const [pending, approved, sections, unpaid, statusBuckets] = await Promise.all([
    prisma.enrollment.count({ where: { status: "PENDING" } }),
    prisma.enrollment.count({ where: { status: "APPROVED" } }),
    prisma.section.count(),
    prisma.payment.count({ where: { status: { in: ["UNPAID", "PARTIAL"] } } }),
    prisma.enrollment.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrar Overview"
        description="Approve enrollments, manage sections, and monitor payments."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending approvals" value={pending} icon={<CheckSquare className="h-5 w-5" />} />
        <StatCard label="Approved" value={approved} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active sections" value={sections} icon={<ListChecks className="h-5 w-5" />} />
        <StatCard label="Outstanding payments" value={unpaid} icon={<Wallet className="h-5 w-5" />} />
      </div>
      <Card>
        <CardHeader><CardTitle>Enrollment status distribution</CardTitle></CardHeader>
        <CardContent>
          <EnrollmentChart data={statusBuckets.map((b) => ({ status: b.status, count: b._count._all }))} />
        </CardContent>
      </Card>
    </div>
  );
}
