"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Payment {
  id: string; tuition: number; miscFees: number; discount: number; totalDue: number; amountPaid: number;
  status: string; scholarship?: string | null;
  student: { studentNo: string; user: { firstName: string; lastName: string } };
  semester: { term: string; schoolYear: { name: string } };
}

export default function PaymentsPage() {
  const [items, setItems] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState<string | null>(null);
  const [tx, setTx] = React.useState({ amount: 0, method: "CASH", reference: "" });

  const load = React.useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/payments");
    setItems((await r.json()).data ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function record(paymentId: string) {
    const res = await fetch(`/api/payments/${paymentId}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Payment recorded");
    setOpen(null);
    setTx({ amount: 0, method: "CASH", reference: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Track tuition assessments and record payments." />
      <Card>
        <CardContent className="p-6">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Total due</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                  </TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No assessments yet
                  </TableCell></TableRow>
                ) : items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.student.user.firstName} {p.student.user.lastName}</div>
                      <div className="text-xs text-muted-foreground">{p.student.studentNo}</div>
                    </TableCell>
                    <TableCell>{p.semester.schoolYear.name} {p.semester.term}</TableCell>
                    <TableCell>{formatCurrency(p.totalDue)}</TableCell>
                    <TableCell>{formatCurrency(p.amountPaid)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        p.status === "PAID" ? "success"
                        : p.status === "PARTIAL" ? "warning"
                        : p.status === "WAIVED" ? "info"
                        : "destructive"
                      }>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog open={open === p.id} onOpenChange={(v) => setOpen(v ? p.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="mr-1 h-3 w-3" /> Record payment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label>Amount</Label>
                              <Input type="number" value={tx.amount} onChange={(e) => setTx({ ...tx, amount: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Method</Label>
                              <Select value={tx.method} onValueChange={(v) => setTx({ ...tx, method: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CASH">Cash</SelectItem>
                                  <SelectItem value="BANK">Bank</SelectItem>
                                  <SelectItem value="ONLINE">Online</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label>Reference (optional)</Label>
                              <Input value={tx.reference} onChange={(e) => setTx({ ...tx, reference: e.target.value })} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                            <Button onClick={() => record(p.id)}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
