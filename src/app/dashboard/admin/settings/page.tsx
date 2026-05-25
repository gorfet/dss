"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System settings"
        description="Toggle features, configure branding and integrations."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>App name: <span className="font-medium">DSS Enrollment</span></p>
            <p>Primary palette: HSL-based, light & dark themes.</p>
            <Badge variant="info">Configurable via Tailwind tokens</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Email: <span className="font-mono">{process.env.NEXT_PUBLIC_EMAIL_PROVIDER ?? "console (dev)"}</span></p>
            <p>Database: <span className="font-mono">PostgreSQL (Prisma)</span></p>
            <p>Auth: <span className="font-mono">NextAuth (JWT)</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Enrollment policies</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Max units per semester: <span className="font-medium">24</span></p>
            <p>Passing grade: <span className="font-medium">75</span></p>
            <p>Prerequisite check: <span className="font-medium">Enabled</span></p>
            <p>Schedule conflict check: <span className="font-medium">Enabled</span></p>
            <p>Waitlisting: <span className="font-medium">Enabled (when capacity exceeded)</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Security</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Password hashing: bcrypt (12 rounds)</p>
            <p>Session: JWT cookies via NextAuth</p>
            <p>Audit logging: enabled for create/update/delete/login</p>
            <p>RBAC middleware: enforced at routes + API guards</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
