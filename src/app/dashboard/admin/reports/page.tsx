"use client";

import * as React from "react";
import { Download, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnrollmentChart } from "@/components/charts/enrollment-chart";
import { CourseDistributionChart } from "@/components/charts/course-distribution-chart";

export default function ReportsPage() {
  const [status, setStatus] = React.useState<{ status: string; count: number }[]>([]);
  const [byCourse, setByCourse] = React.useState<{ course: string; students: number }[]>([]);
  const [workload, setWorkload] = React.useState<{ name: string; sections: number; students: number; units: number }[]>([]);

  React.useEffect(() => {
    fetch("/api/reports?kind=enrollment-status").then((r) => r.json()).then((d) => setStatus(d.data ?? []));
    fetch("/api/reports?kind=by-course").then((r) => r.json()).then((d) => setByCourse(d.data ?? []));
    fetch("/api/reports?kind=faculty-workload").then((r) => r.json()).then((d) => setWorkload(d.data ?? []));
  }, []);

  function exportCsv(kind: string) {
    window.location.href = `/api/reports/export?kind=${kind}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & analytics"
        description="Generate enrollment, student, and grade reports."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportCsv("enrollments")}>
              <Download className="mr-2 h-4 w-4" /> Enrollments CSV
            </Button>
            <Button variant="outline" onClick={() => exportCsv("students")}>
              <Download className="mr-2 h-4 w-4" /> Students CSV
            </Button>
            <Button variant="outline" onClick={() => exportCsv("grades")}>
              <Download className="mr-2 h-4 w-4" /> Grades CSV
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Enrollment status</CardTitle></CardHeader>
          <CardContent><EnrollmentChart data={status} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Students per course</CardTitle></CardHeader>
          <CardContent><CourseDistributionChart data={byCourse} /></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Faculty workload</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Faculty</th>
                  <th className="px-3 py-2 font-medium">Sections</th>
                  <th className="px-3 py-2 font-medium">Students</th>
                  <th className="px-3 py-2 font-medium">Units</th>
                </tr>
              </thead>
              <tbody>
                {workload.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No data</td></tr>
                ) : workload.map((w, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium">{w.name}</td>
                    <td className="px-3 py-2">{w.sections}</td>
                    <td className="px-3 py-2">{w.students}</td>
                    <td className="px-3 py-2">{w.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
