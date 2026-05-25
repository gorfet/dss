"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Announcement {
  id: string; title: string; body: string; audience: string; pinned: boolean;
  publishedAt: string;
  author: { firstName: string; lastName: string; role: string };
}

export default function StudentAnnouncementsPage() {
  const [items, setItems] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/announcements").then((r) => r.json()).then((d) => {
      setItems(d.data ?? []); setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Latest updates from your school." />
      {loading ? (
        <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
      ) : items.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No announcements.</CardContent></Card>
      ) : (
        items.map((a) => (
          <Card key={a.id}>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold">{a.title}</h3>
                <div className="flex gap-1">
                  {a.pinned && <Badge variant="warning">Pinned</Badge>}
                  <Badge variant="info">{a.audience}</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {a.author.firstName} {a.author.lastName} · {new Date(a.publishedAt).toLocaleString()}
              </p>
              <p className="whitespace-pre-wrap text-sm">{a.body}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
