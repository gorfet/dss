"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string; firstName: string; lastName: string; email: string; status: string;
  studentProfile?: { studentNo: string; courseId?: string | null } | null;
}

export default function RegistrarStudentsPage() {
  const [items, setItems] = React.useState<Student[]>([]);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ role: "STUDENT" });
    if (q) params.set("q", q);
    const r = await fetch(`/api/users?${params.toString()}`);
    setItems((await r.json()).data ?? []);
    setLoading(false);
  }, [q]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Search and verify student records." />
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9"
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                  </TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No students found</TableCell></TableRow>
                ) : items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.studentProfile?.studentNo ?? "—"}</TableCell>
                    <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "ACTIVE" ? "success" : s.status === "PENDING" ? "warning" : "destructive"}>
                        {s.status}
                      </Badge>
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
