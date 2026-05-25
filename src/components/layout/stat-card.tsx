import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-center gap-4 p-5">
        {icon && (
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
