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
import { Badge } from "@/components/ui/badge";

interface Subject {
  id: string; code: string; name: string; units: number;
  prerequisites: { prerequisite: { id: string; code: string } }[];
}

export default function SubjectsPage() {
  const [items, setItems] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    code: "", name: "", units: 3, lectureHours: 3, labHours: 0,
    prerequisiteIds: [] as string[],
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/subjects");
    setItems((await res.json()).data ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/subjects", {
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
    toast.success("Subject created");
    setOpen(false);
    setForm({ code: "", name: "", units: 3, lectureHours: 3, labHours: 0, prerequisiteIds: [] });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Subjects (courses inside a curriculum) with prerequisites."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New subject</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New subject</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="CS101" />
                </div>
                <div className="space-y-1.5">
                  <Label>Units</Label>
                  <Input type="number" value={form.units}
                    onChange={(e) => setForm({ ...form, units: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Name</Label>
                  <Input value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Intro to Programming" />
                </div>
                <div className="space-y-1.5">
                  <Label>Lecture hrs</Label>
                  <Input type="number" value={form.lectureHours}
                    onChange={(e) => setForm({ ...form, lectureHours: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Lab hrs</Label>
                  <Input type="number" value={form.labHours}
                    onChange={(e) => setForm({ ...form, labHours: Number(e.target.value) })} />
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
                  <TableHead>Units</TableHead>
                  <TableHead>Prerequisites</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                  </TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No subjects yet
                  </TableCell></TableRow>
                ) : items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.code}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.units}</TableCell>
                    <TableCell>
                      {s.prerequisites.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {s.prerequisites.map((p) => (
                            <Badge key={p.prerequisite.id} variant="outline">
                              {p.prerequisite.code}
                            </Badge>
                          ))}
                        </div>
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
