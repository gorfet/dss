import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function FacultyClassesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = await prisma.facultyProfile.findUnique({
    where: { userId: session.user.id },
  });

  const sections = profile
    ? await prisma.section.findMany({
        where: { facultyId: profile.id },
        include: {
          subject: true,
          schedules: true,
          semester: { include: { schoolYear: true } },
          enrollments: {
            where: { status: { in: ["APPROVED", "COMPLETED"] } },
            include: { student: { include: { user: true } } },
          },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="My classes" description="Class lists and schedules." />
      {sections.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No sections assigned.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {sections.map((s) => (
            <Card key={s.id}>
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {s.subject.code} — {s.subject.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Section {s.code} · {s.semester.schoolYear.name} {s.semester.term}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.schedules.map((sch, i) => (
                      <Badge key={i} variant="outline">{sch.day} {sch.startTime}–{sch.endTime}{sch.room ? ` · ${sch.room}` : ""}</Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {s.enrollments.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">No enrolled students yet</TableCell></TableRow>
                      ) : s.enrollments.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono">{e.student.studentNo}</TableCell>
                          <TableCell>{e.student.user.firstName} {e.student.user.lastName}</TableCell>
                          <TableCell>{e.student.user.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
