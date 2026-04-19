"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  UploadCloud,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  EyeOff,
  ImageIcon,
  X,
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
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerificationPill } from "@/components/verification-pill";
import {
  earningsApi,
  verificationsApi,
  EARNINGS_BASE_URL,
  type Shift,
  type Verification,
  ApiError,
} from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function VerifyPage() {
  /* ---- Upload form state ---- */
  const [drag, setDrag] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [shiftId, setShiftId] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  /* ---- Shift selector data ---- */
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [shiftsLoading, setShiftsLoading] = React.useState(true);

  /* ---- Verification timeline ---- */
  const [timeline, setTimeline] = React.useState<Verification[]>([]);
  const [timelineLoading, setTimelineLoading] = React.useState(true);
  const [timelineError, setTimelineError] = React.useState<string | null>(null);

  /* ---- Load eligible shifts for the selector ---- */
  async function loadEligibleShifts(selectFirst = false) {
    setShiftsLoading(true);
    try {
      // Fetch all shifts and filter client-side for the three eligible statuses.
      // The backend doesn't support multi-value status filter, so we fetch all
      // and filter locally (page_size 200 covers any realistic worker history).
      const res = await earningsApi.listShifts({ page_size: 200 });
      const eligible = res.items.filter(
        (s) =>
          s.verification_status === "unverified" ||
          s.verification_status === "pending_review" ||
          s.verification_status === "flagged"
      );
      setShifts(eligible);
      if (selectFirst || !shiftId) setShiftId(eligible[0]?.id ?? "");
    } catch {
      // Non-fatal — leaves selector empty
    } finally {
      setShiftsLoading(false);
    }
  }

  React.useEffect(() => {
    loadEligibleShifts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Load timeline: all statuses for current worker ---- */
  const loadTimeline = React.useCallback(async () => {
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      // We load our own shifts and infer timeline from verification_status
      const res = await earningsApi.listShifts({ page_size: 10 });
      // Map shifts → lightweight timeline items using shift data directly
      setTimeline(res.items.slice(0, 8) as unknown as Verification[]);
    } catch (err) {
      setTimelineError(
        err instanceof ApiError ? err.message : "Could not load timeline."
      );
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  /* ---- Submit screenshot ---- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please attach a screenshot first.");
      return;
    }
    if (!shiftId) {
      toast.error("Please select a shift.");
      return;
    }
    setSubmitting(true);
    try {
      await verificationsApi.submit(shiftId, file);
      toast.success("Submitted for verification", {
        description: "A community verifier will review it shortly.",
      });
      setFile(null);
      loadTimeline();
      loadEligibleShifts(true);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Submission failed.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  /* ---- File drop / select ---- */
  function acceptFile(f: File | undefined | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Only image files are accepted.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error("File exceeds 8 MB limit.");
      return;
    }
    setFile(f);
  }

  return (
    <div>
      <PageHeader
        title="Verification"
        description="Upload a platform screenshot and we'll match it to a logged shift. Verifiers approve, flag, or mark unverifiable."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Upload a screenshot</CardTitle>
              <CardDescription>
                Crop to the earnings panel. Don&apos;t cover personal info — verifiers
                will redact it before storing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Drop zone */}
                <label
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    acceptFile(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "relative block rounded-xl border-2 border-dashed transition cursor-pointer text-center px-6 py-12",
                    drag
                      ? "border-foreground bg-muted"
                      : "border-border hover:border-foreground/40 hover:bg-muted/40"
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => acceptFile(e.target.files?.[0])}
                  />
                  <motion.div
                    animate={{ y: drag ? -4 : 0 }}
                    className="inline-flex size-12 items-center justify-center rounded-full bg-foreground text-background"
                  >
                    <UploadCloud className="size-5" />
                  </motion.div>
                  <p className="mt-4 font-heading text-base">
                    Drop your screenshot here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG up to 8 MB · or click to browse
                  </p>
                </label>

                {/* File preview */}
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="size-10 rounded-md bg-muted inline-flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB · ready to submit
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      onClick={() => setFile(null)}
                      aria-label="Remove"
                    >
                      <X />
                    </Button>
                  </motion.div>
                )}

                {/* Shift selector */}
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Match to a logged shift</p>
                  {shiftsLoading ? (
                    <div className="h-9 rounded-md border border-border bg-muted/40 animate-pulse" />
                  ) : shifts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No eligible shifts found. Log a shift first, or all shifts
                      are already confirmed.
                    </p>
                  ) : (
                    <Select
                      value={shiftId}
                      onValueChange={(v) => setShiftId(v ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a shift…">
                          {(value: string | null) => {
                            if (!value) return "Select a shift…";
                            const s = shifts.find((x) => x.id === value);
                            return s
                              ? `${s.date} · ${s.platform} · Rs. ${s.net_received.toLocaleString()}`
                              : value;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {shifts.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.date} · {s.platform} · Rs.{" "}
                            {s.net_received.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={submitting || !file || !shiftId}
                  >
                    {submitting ? "Submitting…" : "Submit for verification"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Timeline */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Verification timeline</CardTitle>
                  <CardDescription>
                    Status of your last shifts
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={loadTimeline}
                  disabled={timelineLoading}
                  aria-label="Refresh"
                >
                  <RefreshCw className={timelineLoading ? "animate-spin" : ""} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {timelineError && (
                <div className="flex items-center gap-2 text-sm text-destructive mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/5">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{timelineError}</span>
                </div>
              )}

              {timelineLoading && timeline.length === 0 ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 items-start animate-pulse">
                      <div className="size-7 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No shifts logged yet.
                </p>
              ) : (
                <Stagger className="space-y-4">
                  {(timeline as unknown as Shift[]).map((s, i) => (
                    <StaggerItem
                      key={s.id}
                      className="grid grid-cols-[auto_1fr_auto] items-start gap-3"
                    >
                      <div className="relative flex flex-col items-center">
                        <div
                          className={cn(
                            "size-7 rounded-full inline-flex items-center justify-center shrink-0",
                            s.verification_status === "confirmed"
                              ? "bg-foreground text-background"
                              : s.verification_status === "flagged"
                              ? "bg-destructive/10 text-destructive"
                              : s.verification_status === "unverifiable"
                              ? "bg-secondary text-muted-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {s.verification_status === "confirmed" ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : s.verification_status === "flagged" ? (
                            <AlertTriangle className="size-3.5" />
                          ) : s.verification_status === "unverifiable" ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Clock3 className="size-3.5" />
                          )}
                        </div>
                        {i < timeline.length - 1 && (
                          <span className="w-px flex-1 mt-1 bg-border h-8" />
                        )}
                      </div>
                      <div className="min-w-0 pb-3">
                        <p className="text-sm font-medium truncate">
                          {s.platform} — Rs.{" "}
                          {s.net_received.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.date} · {s.hours_worked}h
                        </p>
                      </div>
                      <VerificationPill status={s.verification_status} />
                    </StaggerItem>
                  ))}
                </Stagger>
              )}

              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  Shifts verified within 24h boost your trust score on the
                  income certificate.
                </p>
                {!timelineLoading && timeline.length > 0 && (
                  <Badge variant="outline" className="mt-2">
                    {(timeline as unknown as Shift[]).filter(
                      (s) => s.verification_status === "confirmed"
                    ).length}{" "}
                    of {timeline.length} shifts verified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
