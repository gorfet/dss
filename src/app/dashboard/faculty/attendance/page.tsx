"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Section { id: string; code: string; subject: { code: string } }
interface Row {
  studentProfileId: string; studentNo: string; name: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
}

export default function AttendancePage() {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/sections").then((r) => r.json()).then((d) => setSections(d.data ?? []));
  }, []);

  React.useEffect(() => {
    async function load() {
      if (!selectedId) return;
      setLoading(true);
      const r = await fetch(`/api/enrollments?status=APPROVED`);
      const data = (await r.json()).data as { id: string; section: { id: string };
        student: { id: string; studentNo: string; user: { firstName: string; lastName: string } } }[];
      const filtered = data
        .filter((e) => e.section.id === selectedId)
        .map<Row>((e) => ({
          studentProfileId: e.student.id,
          studentNo: e.student.studentNo,
          name: `${e.student.user.firstName} ${e.student.user.lastName}`,
          status: "PRESENT",
        }));
      setRows(filtered);
      setLoading(false);
    }
    load();
  }, [selectedId]);

  async function save() {
    if (!selectedId || rows.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId: selectedId,
        date,
        entries: rows.map((r) => ({ studentId: r.studentProfileId, status: r.status })),
      }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Attendance saved");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Mark per-class attendance." actions={
        <Button onClick={save} disabled={saving || !selectedId}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
      } />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full sm:w-[260px]"><SelectValue placeholder="Pick section" /></SelectTrigger>
          <SelectContent>
            {sections.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.subject.code} · {s.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:w-[200px]" />
      </div>
      <Card>
        <CardContent className="p-6">
          {!selectedId ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Pick a section.</p>
          ) : loading ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No approved students.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={r.studentProfileId}>
                      <TableCell>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.studentNo}</div>
                      </TableCell>
                      <TableCell>
                        <Select value={r.status} onValueChange={(v) => {
                          const c = [...rows]; c[i] = { ...c[i], status: v as Row["status"] }; setRows(c);
                        }}>
                          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRESENT">Present</SelectItem>
                            <SelectItem value="ABSENT">Absent</SelectItem>
                            <SelectItem value="LATE">Late</SelectItem>
                            <SelectItem value="EXCUSED">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
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
