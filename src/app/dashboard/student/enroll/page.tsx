"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Section {
  id: string; code: string; capacity: number; enrolled: number;
  subject: { code: string; name: string; units: number };
  faculty?: { user: { firstName: string; lastName: string } } | null;
  schedules: { day: string; startTime: string; endTime: string; room?: string | null }[];
  semester: { term: string; schoolYear: { name: string }; isActive: boolean };
}

export default function EnrollPage() {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/sections");
    setSections((await r.json()).data ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function enroll(sectionId: string) {
    setBusy(sectionId);
    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not enroll");
      return;
    }
    toast.success("Enrollment submitted");
    load();
  }

  const filtered = q
    ? sections.filter((s) =>
        s.subject.code.toLowerCase().includes(q.toLowerCase())
        || s.subject.name.toLowerCase().includes(q.toLowerCase())
        || s.code.toLowerCase().includes(q.toLowerCase())
      )
    : sections;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enroll in subjects"
        description="Pick from open sections. Prereq, schedule, and unit checks run automatically."
      />
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search subjects or section codes..."
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {loading ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">No sections available.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => {
                    const full = s.enrolled >= s.capacity;
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-medium">{s.subject.code}</div>
                          <div className="text-xs text-muted-foreground">{s.subject.name}</div>
                        </TableCell>
                        <TableCell className="font-mono">{s.code}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {s.schedules.map((sch, i) => (
                              <Badge key={i} variant="outline">{sch.day} {sch.startTime}–{sch.endTime}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.faculty ? `${s.faculty.user.firstName} ${s.faculty.user.lastName}` : <span className="text-muted-foreground">TBA</span>}
                        </TableCell>
                        <TableCell>{s.subject.units}</TableCell>
                        <TableCell>
                          <Badge variant={full ? "warning" : "info"}>{s.enrolled}/{s.capacity}{full ? " · Waitlist" : ""}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => enroll(s.id)} disabled={busy === s.id}>
                            {busy === s.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {full ? "Join waitlist" : "Enroll"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
