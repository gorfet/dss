"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Enrollment {
  id: string; status: string; createdAt: string;
  student: { studentNo: string; user: { firstName: string; lastName: string; email: string } };
  section: { code: string; subject: { code: string; name: string; units: number } };
  semester: { term: string; schoolYear: { name: string } };
}

export default function RegistrarEnrollmentsPage() {
  const [items, setItems] = React.useState<Enrollment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState("PENDING");

  const load = React.useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/enrollments?status=${status}`);
    setItems((await r.json()).data ?? []);
    setLoading(false);
  }, [status]);

  React.useEffect(() => { load(); }, [load]);

  async function update(id: string, next: "APPROVED" | "REJECTED") {
    setBusyId(id);
    const res = await fetch(`/api/enrollments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusyId(null);
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success(`Enrollment ${next.toLowerCase()}`);
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Approve, reject, and track student enrollment requests."
        actions={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <Card>
        <CardContent className="p-6">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                  </TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No enrollments in this status
                  </TableCell></TableRow>
                ) : items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="font-medium">{e.student.user.firstName} {e.student.user.lastName}</div>
                      <div className="text-xs text-muted-foreground">{e.student.studentNo} · {e.student.user.email}</div>
                    </TableCell>
                    <TableCell>{e.section.subject.code} <span className="text-muted-foreground">— {e.section.subject.name}</span></TableCell>
                    <TableCell className="font-mono">{e.section.code}</TableCell>
                    <TableCell>{e.semester.schoolYear.name} {e.semester.term}</TableCell>
                    <TableCell><Badge variant="info">{e.status}</Badge></TableCell>
                    <TableCell>
                      {e.status === "PENDING" ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => update(e.id, "APPROVED")} disabled={busyId === e.id}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive"
                            onClick={() => update(e.id, "REJECTED")} disabled={busyId === e.id}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
