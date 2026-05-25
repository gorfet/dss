"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Subject { id: string; code: string; name: string; units: number }
interface Faculty { id: string; user: { firstName: string; lastName: string } }
interface Semester { id: string; term: string; schoolYear: { name: string }; isActive: boolean }
interface Schedule { day: string; startTime: string; endTime: string; room?: string | null }
interface Section {
  id: string; code: string; room?: string | null; capacity: number; enrolled: number;
  subject: Subject; faculty?: Faculty | null;
  semester: Semester;
  schedules: Schedule[];
  _count: { enrollments: number };
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function SectionsPage() {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [faculty, setFaculty] = React.useState<{ id: string; firstName: string; lastName: string; facultyProfile: { id: string } | null }[]>([]);
  const [semesters, setSemesters] = React.useState<{ id: string; term: string; schoolYear: { name: string }; isActive: boolean }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    code: "", subjectId: "", semesterId: "", facultyId: "", room: "", capacity: 40,
    schedules: [{ day: "MON", startTime: "08:00", endTime: "09:30", room: "" }] as Schedule[],
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const [s, subj, fac, cal] = await Promise.all([
      fetch("/api/sections").then((r) => r.json()),
      fetch("/api/subjects").then((r) => r.json()),
      fetch("/api/users?role=FACULTY&pageSize=100").then((r) => r.json()),
      fetch("/api/calendar").then((r) => r.json()),
    ]);
    setSections(s.data ?? []);
    setSubjects(subj.data ?? []);
    setFaculty(fac.data ?? []);
    const sems = (cal.data ?? []).flatMap((y: { semesters: { id: string; term: string; isActive: boolean }[]; name: string }) =>
      y.semesters.map((sem) => ({ ...sem, schoolYear: { name: y.name } }))
    );
    setSemesters(sems);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    const payload = {
      ...form,
      facultyId: form.facultyId || undefined,
      schedules: form.schedules.filter((s) => s.startTime && s.endTime),
    };
    const res = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) { toast.error((await res.json()).error ?? "Failed"); return; }
    toast.success("Section created");
    setOpen(false);
    setForm({ code: "", subjectId: "", semesterId: "", facultyId: "", room: "", capacity: 40,
      schedules: [{ day: "MON", startTime: "08:00", endTime: "09:30", room: "" }] });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Class sections with schedules and assigned faculty."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New section</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>New section</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Section code</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="CS101-A" />
                </div>
                <div className="space-y-1.5">
                  <Label>Capacity</Label>
                  <Input type="number" value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Semester</Label>
                  <Select value={form.semesterId} onValueChange={(v) => setForm({ ...form, semesterId: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick semester" /></SelectTrigger>
                    <SelectContent>
                      {semesters.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.schoolYear.name} {s.term} {s.isActive ? "•" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Faculty (optional)</Label>
                  <Select value={form.facultyId} onValueChange={(v) => setForm({ ...form, facultyId: v })}>
                    <SelectTrigger><SelectValue placeholder="Assign later" /></SelectTrigger>
                    <SelectContent>
                      {faculty
                        .filter((f) => f.facultyProfile)
                        .map((f) => (
                          <SelectItem key={f.facultyProfile!.id} value={f.facultyProfile!.id}>
                            {f.firstName} {f.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Room (default)</Label>
                  <Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                    placeholder="Rm 401" />
                </div>
                <div className="sm:col-span-2 space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">Schedules</p>
                  {form.schedules.map((s, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-12 items-end">
                      <div className="sm:col-span-3">
                        <Label className="text-xs">Day</Label>
                        <Select value={s.day} onValueChange={(v) => {
                          const c = [...form.schedules]; c[i] = { ...c[i], day: v }; setForm({ ...form, schedules: c });
                        }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-3">
                        <Label className="text-xs">Start</Label>
                        <Input type="time" value={s.startTime} onChange={(e) => {
                          const c = [...form.schedules]; c[i] = { ...c[i], startTime: e.target.value }; setForm({ ...form, schedules: c });
                        }} />
                      </div>
                      <div className="sm:col-span-3">
                        <Label className="text-xs">End</Label>
                        <Input type="time" value={s.endTime} onChange={(e) => {
                          const c = [...form.schedules]; c[i] = { ...c[i], endTime: e.target.value }; setForm({ ...form, schedules: c });
                        }} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Room</Label>
                        <Input value={s.room ?? ""} onChange={(e) => {
                          const c = [...form.schedules]; c[i] = { ...c[i], room: e.target.value }; setForm({ ...form, schedules: c });
                        }} />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" type="button"
                          onClick={() => setForm({ ...form, schedules: form.schedules.filter((_, j) => j !== i) })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" type="button"
                    onClick={() => setForm({ ...form, schedules: [...form.schedules, { day: "MON", startTime: "08:00", endTime: "09:30", room: "" }] })}>
                    Add schedule
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Enrolled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                  </TableCell></TableRow>
                ) : sections.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No sections yet</TableCell></TableRow>
                ) : sections.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.code}</TableCell>
                    <TableCell>{s.subject.code} <span className="text-muted-foreground">— {s.subject.name}</span></TableCell>
                    <TableCell>{s.faculty ? `${s.faculty.user.firstName} ${s.faculty.user.lastName}` : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.schedules.map((sch, i) => (
                          <Badge key={i} variant="outline">{sch.day} {sch.startTime}–{sch.endTime}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{s._count.enrollments}/{s.capacity}</TableCell>
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
