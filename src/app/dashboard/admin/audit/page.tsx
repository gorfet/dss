"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AuditEntry {
  id: string; action: string; entity: string; entityId?: string | null;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
  metadata?: Record<string, unknown> | null;
}

export default function AuditPage() {
  const [items, setItems] = React.useState<AuditEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/audit").then((r) => r.json()).then((d) => { setItems(d.data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit logs" description="Track admin & system actions." />
      <Card>
        <CardContent className="p-6">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                  </TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No audit entries yet
                  </TableCell></TableRow>
                ) : items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {a.user ? `${a.user.firstName} ${a.user.lastName}` : <span className="text-muted-foreground">system</span>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{a.action}</Badge></TableCell>
                    <TableCell><span className="font-mono text-xs">{a.entity}{a.entityId ? `:${a.entityId.slice(0, 6)}` : ""}</span></TableCell>
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
