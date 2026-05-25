"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Section {
  id: string; code: string; subject: { code: string; name: string };
}

interface Enrollment {
  id: string; status: string;
  student: { studentNo: string; user: { firstName: string; lastName: string } };
  grade: { prelim: number | null; midterm: number | null; finals: number | null; finalGrade: number | null } | null;
}

export default function FacultyGradesPage() {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [rows, setRows] = React.useState<Enrollment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/sections").then((r) => r.json()).then((d) => setSections(d.data ?? []));
  }, []);

  const loadRows = React.useCallback(async (sectionId: string) => {
    if (!sectionId) return;
    setLoading(true);
    const r = await fetch(`/api/enrollments?status=APPROVED`);
    const data = (await r.json()).data as Enrollment[] & { sectionId: string }[];
    // narrow by section
    const filtered = (data as unknown as { id: string; section: { id: string }; status: string;
      student: Enrollment["student"]; grade: Enrollment["grade"] }[])
      .filter((e) => e.section.id === sectionId)
      .map((e) => ({ id: e.id, status: e.status, student: e.student, grade: e.grade }));
    setRows(filtered);
    setLoading(false);
  }, []);

  async function save(enrollmentId: string, field: "prelim" | "midterm" | "finals", value: number) {
    setBusy(enrollmentId);
    const row = rows.find((r) => r.id === enrollmentId);
    const payload: Record<string, unknown> = {
      enrollmentId,
      prelim: row?.grade?.prelim ?? null,
      midterm: row?.grade?.midterm ?? null,
      finals: row?.grade?.finals ?? null,
    };
    payload[field] = value;
    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(null);
    if (!res.ok) { toast.error("Failed to save"); return; }
    toast.success("Saved");
    loadRows(selectedId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grade encoding"
        description="Encode prelim/midterm/final grades."
        actions={
          <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); loadRows(v); }}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Pick section" /></SelectTrigger>
            <SelectContent>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.subject.code} · {s.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <Card>
        <CardContent className="p-6">
          {!selectedId ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Pick a section to start encoding.</p>
          ) : loading ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No approved enrollments yet.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Prelim</TableHead>
                    <TableHead>Midterm</TableHead>
                    <TableHead>Finals</TableHead>
                    <TableHead>Final grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <GradeRow key={r.id} row={r} onSave={save} busy={busy === r.id} />
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

function GradeRow({
  row, onSave, busy,
}: {
  row: Enrollment;
  onSave: (id: string, f: "prelim" | "midterm" | "finals", v: number) => void;
  busy: boolean;
}) {
  const [p, setP] = React.useState<number | "">(row.grade?.prelim ?? "");
  const [m, setM] = React.useState<number | "">(row.grade?.midterm ?? "");
  const [f, setF] = React.useState<number | "">(row.grade?.finals ?? "");

  function commit(field: "prelim" | "midterm" | "finals", value: number | "") {
    if (value === "" || isNaN(Number(value))) return;
    onSave(row.id, field, Number(value));
  }

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{row.student.user.firstName} {row.student.user.lastName}</div>
        <div className="text-xs text-muted-foreground">{row.student.studentNo}</div>
      </TableCell>
      <TableCell>
        <Input
          type="number" min={0} max={100}
          value={p}
          onChange={(e) => setP(e.target.value === "" ? "" : Number(e.target.value))}
          onBlur={() => commit("prelim", p)}
          className="w-24" disabled={busy}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number" min={0} max={100}
          value={m}
          onChange={(e) => setM(e.target.value === "" ? "" : Number(e.target.value))}
          onBlur={() => commit("midterm", m)}
          className="w-24" disabled={busy}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number" min={0} max={100}
          value={f}
          onChange={(e) => setF(e.target.value === "" ? "" : Number(e.target.value))}
          onBlur={() => commit("finals", f)}
          className="w-24" disabled={busy}
        />
      </TableCell>
      <TableCell>
        <Badge variant={
          row.grade?.finalGrade == null ? "outline"
          : row.grade.finalGrade >= 75 ? "success" : "destructive"
        }>
          {row.grade?.finalGrade == null ? "—" : row.grade.finalGrade.toFixed(2)}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
