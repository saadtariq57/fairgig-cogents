"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  ImageIcon,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/motion";
import {
  verificationsApi,
  EARNINGS_BASE_URL,
  type Verification,
  type Shift,
  ApiError,
} from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type QueueItem = Verification & { shift: Shift | null };

export default function QueuePage() {
  const [items, setItems] = React.useState<QueueItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [reviewerNote, setReviewerNote] = React.useState("");
  const [deciding, setDeciding] = React.useState(false);

  const current = items.find((i) => i.id === activeId) ?? items[0] ?? null;

  /* ---- Load pending queue ---- */
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verificationsApi.list("pending_review");
      setItems(res.items);
      // Keep selection valid
      setActiveId((prev) => {
        if (res.items.find((i) => i.id === prev)) return prev;
        return res.items[0]?.id ?? null;
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load verification queue."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  /* ---- Review action ---- */
  async function decide(action: "confirmed" | "flagged" | "unverifiable") {
    if (!current) return;
    const labels: Record<string, string> = {
      confirmed: "Approved",
      flagged: "Flagged for discrepancy",
      unverifiable: "Marked unverifiable",
    };

    setDeciding(true);
    try {
      await verificationsApi.review(current.id, {
        status: action,
        reviewer_note: reviewerNote.trim() || undefined,
      });
      toast.success(labels[action], {
        description: `${current.shift?.platform ?? "Shift"} · Rs. ${
          current.shift?.net_received?.toLocaleString() ?? "—"
        }`,
      });
      setReviewerNote("");
      // Remove from list optimistically
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== current.id);
        const idx = prev.findIndex((i) => i.id === current.id);
        setActiveId(next[idx]?.id ?? next[0]?.id ?? null);
        return next;
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Review failed.";
      toast.error(msg);
    } finally {
      setDeciding(false);
    }
  }

  /* ---- Screenshot URL ---- */
  function screenshotUrl(v: QueueItem) {
    if (!v.screenshot_url) return null;
    return `${EARNINGS_BASE_URL}${v.screenshot_url}`;
  }

  /* ---- Worker initials from masked id ---- */
  function workerLabel(v: QueueItem) {
    return v.worker_id?.slice(0, 8) ?? "—";
  }

  return (
    <div>
      <PageHeader
        title="Review queue"
        description="Help your community keep earnings honest. Review screenshots and stamp them."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-foreground" />
              {items.length} pending
            </Badge>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={load}
              disabled={loading}
              aria-label="Refresh queue"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/5">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-auto py-0.5 px-2"
            onClick={load}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-3">
        {/* Pending list */}
        <FadeIn>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Pending</CardTitle>
              <CardDescription>Newest first</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading && items.length === 0 ? (
                <div className="space-y-2 p-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 items-center animate-pulse py-2">
                      <div className="size-9 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {items.map((it) => (
                      <motion.li
                        key={it.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          onClick={() => setActiveId(it.id)}
                          className={cn(
                            "w-full text-left flex items-center gap-3 px-4 py-3 transition",
                            activeId === it.id ? "bg-muted" : "hover:bg-muted/50"
                          )}
                        >
                          <Avatar className="size-9 shrink-0">
                            <AvatarFallback className="text-[10px]">
                              {workerLabel(it).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {it.shift?.platform ?? "Unknown platform"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {it.shift
                                ? `Rs. ${it.shift.net_received.toLocaleString()} · ${it.shift.date}`
                                : it.worker_id?.slice(0, 12)}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {it.submitted_at
                              ? new Date(it.submitted_at).toLocaleDateString()
                              : "—"}
                          </span>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  {!loading && items.length === 0 && (
                    <li className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Queue cleared. Good work.
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Review panel */}
        <FadeIn delay={0.05}>
          {current ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      Worker{" "}
                      <span className="font-mono text-base">
                        {workerLabel(current)}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Submitted{" "}
                      {current.submitted_at
                        ? new Date(current.submitted_at).toLocaleString()
                        : "—"}
                      {current.shift && ` · Shift dated ${current.shift.date}`}
                    </CardDescription>
                  </div>
                  {current.shift && (
                    <Badge variant="outline">{current.shift.platform}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-[1.4fr_1fr] gap-4">
                  {/* Screenshot */}
                  <div className="relative rounded-lg overflow-hidden border border-border bg-muted aspect-4/3">
                    {screenshotUrl(current) ? (
                      <img
                        src={screenshotUrl(current)!}
                        alt="Worker-uploaded screenshot"
                        className="absolute inset-0 size-full object-contain bg-muted"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center text-muted-foreground">
                          <ImageIcon className="size-10 mx-auto opacity-40" />
                          <p className="mt-2 text-xs">
                            Worker-uploaded screenshot
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                      <span className="size-1.5 rounded-full bg-foreground" />
                      EXIF intact
                    </div>
                  </div>

                  {/* Shift details */}
                  <div className="space-y-3">
                    {current.shift ? (
                      <>
                        <Field
                          label="Reported net"
                          value={`Rs. ${current.shift.net_received.toLocaleString()}`}
                        />
                        <Field
                          label="Gross / deductions"
                          value={`Rs. ${current.shift.gross_earned.toLocaleString()} / Rs. ${current.shift.platform_deductions.toLocaleString()}`}
                        />
                        <Field
                          label="Hours worked"
                          value={`${current.shift.hours_worked}h`}
                        />
                        <Field
                          label="Platform"
                          value={current.shift.platform}
                        />
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Shift details unavailable.
                      </p>
                    )}
                    <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                      Cross-check platform name, total earnings, date and trip
                      count. Flag if anything doesn&apos;t line up — workers can
                      re-submit.
                    </div>
                  </div>
                </div>

                {/* Reviewer note */}
                <div className="space-y-1.5">
                  <Label htmlFor="reviewer-note">
                    Note for worker (optional)
                  </Label>
                  <Input
                    id="reviewer-note"
                    placeholder="e.g. earnings total doesn't match shift hours"
                    value={reviewerNote}
                    onChange={(e) => setReviewerNote(e.target.value)}
                    disabled={deciding}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => decide("unverifiable")}
                    disabled={deciding}
                  >
                    <EyeOff /> Unverifiable
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => decide("flagged")}
                    disabled={deciding}
                  >
                    <AlertTriangle /> Flag discrepancy
                  </Button>
                  <Button
                    onClick={() => decide("confirmed")}
                    disabled={deciding}
                  >
                    <CheckCircle2 />{" "}
                    {deciding ? "Saving…" : "Approve"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : !loading ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Nothing left to review. Take a break.
              </CardContent>
            </Card>
          ) : null}
        </FadeIn>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-heading text-lg tabular-nums mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
