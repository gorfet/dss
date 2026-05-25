"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Semester {
  id: string; term: string; startDate: string; endDate: string;
  enrollmentStart?: string | null; enrollmentEnd?: string | null;
  isActive: boolean;
}
interface SchoolYear {
  id: string; name: string; startDate: string; endDate: string;
  isActive: boolean; semesters: Semester[];
}

export default function CalendarPage() {
  const [items, setItems] = React.useState<SchoolYear[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openSy, setOpenSy] = React.useState(false);
  const [openSem, setOpenSem] = React.useState(false);
  const [sy, setSy] = React.useState({ name: "", startDate: "", endDate: "", isActive: false });
  const [sem, setSem] = React.useState({
    schoolYearId: "", term: "FIRST", startDate: "", endDate: "",
    enrollmentStart: "", enrollmentEnd: "", isActive: false,
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/calendar");
    setItems((await r.json()).data ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function saveSy() {
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sy),
    });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("School year added");
    setOpenSy(false);
    setSy({ name: "", startDate: "", endDate: "", isActive: false });
    load();
  }
  async function saveSem() {
    const res = await fetch("/api/calendar/semesters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sem),
    });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Semester added");
    setOpenSem(false);
    setSem({ schoolYearId: "", term: "FIRST", startDate: "", endDate: "", enrollmentStart: "", enrollmentEnd: "", isActive: false });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="School calendar"
        description="School years, semesters, and enrollment windows."
        actions={
          <div className="flex gap-2">
            <Dialog open={openSy} onOpenChange={setOpenSy}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="mr-2 h-4 w-4" />School year</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New school year</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input value={sy.name} onChange={(e) => setSy({ ...sy, name: e.target.value })}
                      placeholder="2025-2026" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Start</Label>
                      <Input type="date" value={sy.startDate} onChange={(e) => setSy({ ...sy, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>End</Label>
                      <Input type="date" value={sy.endDate} onChange={(e) => setSy({ ...sy, endDate: e.target.value })} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={sy.isActive}
                      onChange={(e) => setSy({ ...sy, isActive: e.target.checked })} />
                    Mark active
                  </label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenSy(false)}>Cancel</Button>
                  <Button onClick={saveSy}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={openSem} onOpenChange={setOpenSem}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Semester</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New semester</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>School year</Label>
                    <Select value={sem.schoolYearId} onValueChange={(v) => setSem({ ...sem, schoolYearId: v })}>
                      <SelectTrigger><SelectValue placeholder="Pick year" /></SelectTrigger>
                      <SelectContent>
                        {items.map((y) => (
                          <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Term</Label>
                    <Select value={sem.term} onValueChange={(v) => setSem({ ...sem, term: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIRST">First</SelectItem>
                        <SelectItem value="SECOND">Second</SelectItem>
                        <SelectItem value="SUMMER">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Start</Label>
                      <Input type="date" value={sem.startDate}
                        onChange={(e) => setSem({ ...sem, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>End</Label>
                      <Input type="date" value={sem.endDate}
                        onChange={(e) => setSem({ ...sem, endDate: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Enrollment opens</Label>
                      <Input type="date" value={sem.enrollmentStart}
                        onChange={(e) => setSem({ ...sem, enrollmentStart: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Enrollment closes</Label>
                      <Input type="date" value={sem.enrollmentEnd}
                        onChange={(e) => setSem({ ...sem, enrollmentEnd: e.target.value })} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={sem.isActive}
                      onChange={(e) => setSem({ ...sem, isActive: e.target.checked })} />
                    Make this the active semester
                  </label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenSem(false)}>Cancel</Button>
                  <Button onClick={saveSem}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      {loading ? (
        <div className="py-8 text-center">
          <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">
          No school years yet.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((y) => (
            <Card key={y.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{y.name}</span>
                  {y.isActive && <Badge variant="success">Active</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {y.semesters.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{s.term}</p>
                        <p className="text-muted-foreground">
                          {new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      {s.isActive && <Badge variant="success">Active</Badge>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
