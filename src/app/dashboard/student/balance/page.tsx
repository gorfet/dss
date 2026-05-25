import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BalancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  const payments = sp
    ? await prisma.payment.findMany({
        where: { studentId: sp.id },
        include: { semester: { include: { schoolYear: true } }, transactions: true },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="My balance" description="Assessment and payment history." />
      {payments.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No assessments yet.</CardContent></Card>
      ) : (
        payments.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{p.semester.schoolYear.name} — {p.semester.term}</span>
                <Badge variant={
                  p.status === "PAID" ? "success"
                  : p.status === "PARTIAL" ? "warning"
                  : p.status === "WAIVED" ? "info"
                  : "destructive"
                }>{p.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Tuition" value={formatCurrency(p.tuition)} />
                <Field label="Misc fees" value={formatCurrency(p.miscFees)} />
                <Field label="Discount / Scholarship" value={formatCurrency(p.discount)} hint={p.scholarship ?? undefined} />
                <Field label="Total due" value={formatCurrency(p.totalDue)} accent />
                <Field label="Amount paid" value={formatCurrency(p.amountPaid)} />
                <Field label="Balance" value={formatCurrency(Math.max(0, p.totalDue - p.amountPaid))} accent />
              </div>
              {p.transactions.length > 0 && (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Method</th>
                        <th className="px-3 py-2 font-medium">Reference</th>
                        <th className="px-3 py-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.transactions.map((t) => (
                        <tr key={t.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2">{formatDate(t.paidAt)}</td>
                          <td className="px-3 py-2">{t.method}</td>
                          <td className="px-3 py-2">{t.reference ?? "—"}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(t.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function Field({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={"rounded-md border p-3 " + (accent ? "bg-primary/5" : "")}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
