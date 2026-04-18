import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock3, AlertTriangle, EyeOff } from "lucide-react";
import type { ShiftLog } from "@/lib/mock-data";

const STYLES: Record<
  ShiftLog["verification"],
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  verified:    { label: "Verified",    className: "bg-foreground text-background border-transparent", Icon: CheckCircle2 },
  pending:     { label: "Pending",     className: "bg-muted text-foreground border-border",           Icon: Clock3 },
  flagged:     { label: "Flagged",     className: "bg-destructive/10 text-destructive border-transparent", Icon: AlertTriangle },
  unverifiable:{ label: "Unverifiable",className: "bg-secondary text-muted-foreground border-border", Icon: EyeOff },
};

export function VerificationPill({
  status,
}: {
  status: ShiftLog["verification"];
}) {
  const s = STYLES[status];
  return (
    <Badge className={s.className} variant="outline">
      <s.Icon className="size-3" /> {s.label}
    </Badge>
  );
}
