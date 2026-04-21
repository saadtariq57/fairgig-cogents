"use client";

import * as React from "react";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { FadeIn } from "@/components/motion";
import {
  earningsApi,
  analyticsApi,
  anomalyApi,
  type NarrateAnomaliesResponse,
  ApiError,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SEVERITY_STYLES: Record<string, string> = {
  high:   "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-amber-500/10 text-amber-600 border-amber-400/30",
  low:    "bg-muted text-muted-foreground border-border",
};

const FLAG_TYPE_LABELS: Record<string, string> = {
  unusual_deduction:  "Unusual deduction",
  sudden_income_drop: "Income drop",
  below_median_hourly:"Below zone median",
};

export default function AnomaliesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<NarrateAnomaliesResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function findAnomalies() {
    if (!user) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const from90 = ninetyDaysAgo.toISOString().slice(0, 10);

      const [shiftsRes, summaryRes] = await Promise.allSettled([
        earningsApi.listShifts({ from: from90, page_size: 200 }),
        analyticsApi.workerSummary(user.id),
      ]);

      if (shiftsRes.status !== "fulfilled") {
        throw new Error("Couldn't load your shifts. Try again in a moment.");
      }
      const shifts = shiftsRes.value.items;
      if (shifts.length === 0) {
        throw new Error("You don't have any shifts logged yet. Log a shift first, then run this again.");
      }

      const cityMedian =
        summaryRes.status === "fulfilled"
          ? summaryRes.value.city_median?.median_hourly_rate ?? undefined
          : undefined;

      const res = await anomalyApi.narrate({
        worker_id: user.id,
        city_median_hourly_rate: cityMedian,
        shifts: shifts.map((s) => ({
          date: s.date,
          platform: s.platform,
          hours_worked: s.hours_worked,
          gross_earned: s.gross_earned,
          platform_deductions: s.platform_deductions,
          net_received: s.net_received,
        })),
      });
      setResult(res);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const hasFlags = result !== null && result.flags.length > 0;
  const allClear = result !== null && result.flags.length === 0;

  return (
    <div>
      <PageHeader
        title="Anomalies"
        description="Run an AI-assisted check on your last 90 days of shifts. We combine statistical detection with a plain-English explanation of what it means and what to do next."
        actions={
          <Button onClick={findAnomalies} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Analysing…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Find anomalies
              </>
            )}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* AI statement — primary card */}
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4" />
                What we found
              </CardTitle>
              <CardDescription>
                {result?.ai_source === "ai"
                  ? "Powered by AI"
                  : result?.ai_source === "fallback"
                  ? "Plain-English summary"
                  : "Click \"Find anomalies\" to run the analysis."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState />
              ) : error ? (
                <p className="text-sm text-destructive flex items-start gap-2">
                  <Info className="size-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </p>
              ) : !result ? (
                <EmptyState />
              ) : (
                <div className="space-y-4">
                  {allClear ? (
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">All clear.</p>
                        <p className="text-muted-foreground">{result.summary}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="size-5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="font-medium">{result.summary}</p>
                    </div>
                  )}

                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    {result.statement.split(/\n{2,}/).map((para, i) => (
                      <p
                        key={i}
                        className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap [&:not(:last-child)]:mb-3"
                      >
                        {para.trim()}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Detected flags – the raw statistical findings */}
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4" />
                Detected flags
              </CardTitle>
              <CardDescription>
                {hasFlags
                  ? `${result!.flags.length} statistical signal${result!.flags.length === 1 ? "" : "s"}`
                  : "Raw signals from the statistical engine"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              ) : !result ? (
                <p className="text-xs text-muted-foreground">
                  No analysis yet. Click the button above to scan your last 90 days.
                </p>
              ) : !hasFlags ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-green-600" />
                  No anomalies detected.
                </p>
              ) : (
                <div className="space-y-2">
                  {result.flags.map((f, i) => (
                    <div
                      key={i}
                      className={`rounded-md border px-3 py-2 text-xs ${SEVERITY_STYLES[f.severity]}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium">
                          {FLAG_TYPE_LABELS[f.type] ?? f.type}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 ${SEVERITY_STYLES[f.severity]}`}
                        >
                          {f.severity}
                        </Badge>
                      </div>
                      <p className="text-[11px] leading-snug opacity-90">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {result && (
        <FadeIn delay={0.1} className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How we detect things</CardTitle>
              <CardDescription>
                Three independent statistical checks run on your shift log.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {Object.entries(result.method).map(([k, v]) => (
                  <li key={k}>
                    <span className="font-medium text-foreground">
                      {FLAG_TYPE_LABELS[k] ?? k}:
                    </span>{" "}
                    {v}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <p>Crunching your shifts and asking the AI to summarise…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Sparkles className="size-8 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground max-w-sm">
        Click <span className="font-medium text-foreground">Find anomalies</span> to scan the last 90 days of your shifts and get a clear, AI-written explanation.
      </p>
    </div>
  );
}
