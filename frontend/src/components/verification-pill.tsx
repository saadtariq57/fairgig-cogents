import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock3, AlertTriangle, EyeOff, Circle } from "lucide-react";
import type { VerificationStatus } from "@/lib/api";

const STYLES: Record<
  VerificationStatus,
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  unverified:    { label: "Unverified",   className: "bg-muted text-muted-foreground border-border",           Icon: Circle },
  pending_review:{ label: "Pending",      className: "bg-muted text-foreground border-border",                 Icon: Clock3 },
  confirmed:     { label: "Verified",     className: "bg-foreground text-background border-transparent",       Icon: CheckCircle2 },
  flagged:       { label: "Flagged",      className: "bg-destructive/10 text-destructive border-transparent",  Icon: AlertTriangle },
  unverifiable:  { label: "Unverifiable", className: "bg-secondary text-muted-foreground border-border",       Icon: EyeOff },
};

export function VerificationPill({ status }: { status: VerificationStatus }) {
  const s = STYLES[status] ?? STYLES.unverified;
  return (
    <Badge className={s.className} variant="outline">
      <s.Icon className="size-3" /> {s.label}
    </Badge>
  );
}
