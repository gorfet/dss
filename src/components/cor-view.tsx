"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Schedule { day: string; start: string; end: string; room: string }
interface EnrollmentRow {
  subjectCode: string; subjectName: string; units: number;
  section: string; faculty: string;
  schedules: Schedule[]; status: string;
}

export function CorView({
  student,
  semester,
  enrollments,
}: {
  student: { studentNo: string; name: string; course: string; department: string } | null;
  semester: string | null;
  enrollments: EnrollmentRow[];
}) {
  const totalUnits = enrollments.reduce((s, e) => s + e.units, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <h2 className="text-2xl font-semibold tracking-tight">Certificate of Registration</h2>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
        </Button>
      </div>
      <Card>
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">DSS University</p>
            <h1 className="text-2xl font-bold tracking-tight">Certificate of Registration</h1>
            <p className="text-sm text-muted-foreground">{semester ?? "—"}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Student name" value={student?.name ?? "—"} />
            <Info label="Student number" value={student?.studentNo ?? "—"} />
            <Info label="Course" value={student?.course ?? "—"} />
            <Info label="Department" value={student?.department ?? "—"} />
          </div>

          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Subject</th>
                  <th className="px-3 py-2 font-medium">Section</th>
                  <th className="px-3 py-2 font-medium">Schedule</th>
                  <th className="px-3 py-2 font-medium">Faculty</th>
                  <th className="px-3 py-2 font-medium text-right">Units</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      No active enrollments. Enroll in subjects first.
                    </td>
                  </tr>
                ) : enrollments.map((e, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-mono">{e.subjectCode}</td>
                    <td className="px-3 py-2">{e.subjectName}</td>
                    <td className="px-3 py-2">{e.section}</td>
                    <td className="px-3 py-2">
                      {e.schedules.map((s) => `${s.day} ${s.start}–${s.end}${s.room ? ` (${s.room})` : ""}`).join(", ")}
                    </td>
                    <td className="px-3 py-2">{e.faculty}</td>
                    <td className="px-3 py-2 text-right">{e.units}</td>
                    <td className="px-3 py-2">
                      <Badge variant={e.status === "APPROVED" ? "success" : "warning"}>{e.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30">
                  <td colSpan={5} className="px-3 py-2 text-right font-medium">Total units</td>
                  <td className="px-3 py-2 text-right font-semibold">{totalUnits}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid gap-6 pt-8 sm:grid-cols-2">
            <Signature label="Registrar" />
            <Signature label="Student" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div className="space-y-1">
      <div className="h-12 border-b" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
