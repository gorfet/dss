import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { gpa, gradeRemark } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GradesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  const enrollments = sp
    ? await prisma.enrollment.findMany({
        where: { studentId: sp.id },
        include: {
          section: { include: { subject: true } },
          grade: true,
          semester: { include: { schoolYear: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const posted = enrollments.filter((e) => e.grade?.finalGrade != null);
  const gwa = posted.length
    ? posted.reduce((s, e) => s + (e.grade!.finalGrade ?? 0), 0) / posted.length
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My grades"
        description={posted.length ? `${posted.length} subjects graded · GWA ${gpa(gwa)}` : "No grades posted yet."}
      />
      <Card>
        <CardContent className="p-6">
          {enrollments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No enrollment history yet.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Prelim</TableHead>
                    <TableHead>Midterm</TableHead>
                    <TableHead>Finals</TableHead>
                    <TableHead>Final</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.semester.schoolYear.name} {e.semester.term}</TableCell>
                      <TableCell>
                        <div className="font-medium">{e.section.subject.code}</div>
                        <div className="text-xs text-muted-foreground">{e.section.subject.name}</div>
                      </TableCell>
                      <TableCell>{e.grade?.prelim?.toFixed(2) ?? "—"}</TableCell>
                      <TableCell>{e.grade?.midterm?.toFixed(2) ?? "—"}</TableCell>
                      <TableCell>{e.grade?.finals?.toFixed(2) ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={
                          e.grade?.finalGrade == null ? "outline"
                          : e.grade.finalGrade >= 75 ? "success" : "destructive"
                        }>
                          {e.grade?.finalGrade?.toFixed(2) ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{gradeRemark(e.grade?.finalGrade)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
