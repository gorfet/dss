"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Department { id: string; code: string; name: string }
interface Course {
  id: string; code: string; name: string; totalUnits: number; department: Department;
  _count?: { students: number };
}

export default function CoursesPage() {
  const [items, setItems] = React.useState<Course[]>([]);
  const [depts, setDepts] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    code: "", name: "", totalUnits: 120, departmentId: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const [c, d] = await Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ]);
    setItems(c.data ?? []);
    setDepts(d.data ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success("Course created");
    setOpen(false);
    setForm({ code: "", name: "", totalUnits: 120, departmentId: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Degree programs and curricula."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New course</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New course</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="BSCS" />
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="BS Computer Science" />
                </div>
                <div className="space-y-1.5">
                  <Label>Total units</Label>
                  <Input type="number" value={form.totalUnits}
                    onChange={(e) => setForm({ ...form, totalUnits: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={form.departmentId}
                    onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick department" /></SelectTrigger>
                    <SelectContent>
                      {depts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.code} — {d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Total units</TableHead>
                  <TableHead>Students</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                  </TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No courses yet
                  </TableCell></TableRow>
                ) : items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.code}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.department?.code}</TableCell>
                    <TableCell>{c.totalUnits}</TableCell>
                    <TableCell>{c._count?.students ?? 0}</TableCell>
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
