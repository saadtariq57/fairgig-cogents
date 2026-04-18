import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
  invertDelta = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number; // percentage
  hint?: string;
  icon?: React.ReactNode;
  invertDelta?: boolean;
  className?: string;
}) {
  const positive = delta != null && (invertDelta ? delta < 0 : delta > 0);
  const negative = delta != null && (invertDelta ? delta > 0 : delta < 0);
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && (
          <div className="inline-flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-3 font-heading text-3xl tracking-tight tabular-nums">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              positive && "bg-foreground text-background",
              negative && "bg-muted text-foreground",
              !positive && !negative && "bg-muted text-muted-foreground"
            )}
          >
            {delta > 0 ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}
