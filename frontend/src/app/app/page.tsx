"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import {
  Banknote,
  Clock,
  TrendingUp,
  Percent,
  Upload,
  ArrowRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { VerificationPill } from "@/components/verification-pill";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import {
  earningsApi,
  workerApi,
  analyticsApi,
  anomalyApi,
  type Shift,
  type WorkerProfile,
  type WorkerSummaryResponse,
  type AnomalyFlag,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/* ── severity badge colours ──────────────────────────────── */
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

/* ── helpers ─────────────────────────────────────────────── */

/**
 * Convert the analytics worker summary weekly series into the shape the
 * recharts AreaChart expects (with a cityMedian key matching what we fetch
 * from the median-hourly endpoint, converted to weekly net equivalent).
 */
function buildChartSeries(
  summary: WorkerSummaryResponse | null,
  cityMedianHourly: number | null
) {
  if (!summary || summary.weekly.length === 0) return null;

  return summary.weekly.slice(-10).map((w) => ({
    week: w.week,
    net: w.net,
    hours: w.hours,
    // City median expressed as expected weekly net (median hourly × avg hours)
    cityMedian: cityMedianHourly && w.hours > 0
      ? Math.round(cityMedianHourly * w.hours)
      : null,
  }));
}

export default function OverviewPage() {
  const { user } = useAuth();

  /* ── state ── */
  const [recent, setRecent] = React.useState<Shift[]>([]);        // display: last 5
  const [allShifts, setAllShifts] = React.useState<Shift[]>([]);  // anomaly: last 90 days
  const [shiftsLoading, setShiftsLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<WorkerProfile | null>(null);
  const [summary, setSummary] = React.useState<WorkerSummaryResponse | null>(null);
  const [cityMedianHourly, setCityMedianHourly] = React.useState<number | null>(null);
  const [anomalyFlags, setAnomalyFlags] = React.useState<AnomalyFlag[] | null>(null);
  const [anomalySummary, setAnomalySummary] = React.useState<string | null>(null);
  const [anomalyLoading, setAnomalyLoading] = React.useState(false);

  /* ── data loading ── */
  React.useEffect(() => {
    if (!user) return;

    async function load() {
      setShiftsLoading(true);

      // Compute 90-day window for anomaly detection
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const from90 = ninetyDaysAgo.toISOString().slice(0, 10);

      try {
        const [shiftsRes, allShiftsRes, profileRes, summaryRes] = await Promise.allSettled([
          earningsApi.listShifts({ page_size: 5 }),
          earningsApi.listShifts({ from: from90, page_size: 200 }),
          workerApi.getProfile(user!.id),
          analyticsApi.workerSummary(user!.id),
        ]);

        if (shiftsRes.status === "fulfilled") setRecent(shiftsRes.value.items);
        if (allShiftsRes.status === "fulfilled") setAllShifts(allShiftsRes.value.items);
        if (profileRes.status === "fulfilled") setProfile(profileRes.value);
        if (summaryRes.status === "fulfilled") {
          const s = summaryRes.value;
          setSummary(s);

          // Fetch city median hourly if we have zone + category
          if (s.city_zone && s.category) {
            try {
              const median = await analyticsApi.medianHourly(s.category, s.city_zone);
              if (median.median_hourly_rate !== null) {
                setCityMedianHourly(median.median_hourly_rate);
              }
            } catch {
              // Non-fatal
            }
          }
        }
      } catch {
        // Non-fatal; show whatever partial data we have
      } finally {
        setShiftsLoading(false);
      }
    }

    load();
  }, [user]);

  /* ── anomaly detection: run when 90-day shift window or city median is ready ── */
  React.useEffect(() => {
    if (!user || allShifts.length === 0) return;

    async function runAnomalyDetection() {
      setAnomalyLoading(true);
      try {
        const result = await anomalyApi.detect({
          worker_id: user!.id,
          city_median_hourly_rate: cityMedianHourly ?? undefined,
          shifts: allShifts.map((s) => ({
            date: s.date,
            platform: s.platform,
            hours_worked: s.hours_worked,
            gross_earned: s.gross_earned,
            platform_deductions: s.platform_deductions,
            net_received: s.net_received,
          })),
        });
        setAnomalyFlags(result.flags);
        setAnomalySummary(result.summary);
      } catch {
        // Anomaly service unavailable – fail silently
      } finally {
        setAnomalyLoading(false);
      }
    }

    runAnomalyDetection();
  }, [allShifts, cityMedianHourly, user]);

  /* ── derived stats ── */
  const chartSeries = buildChartSeries(summary, cityMedianHourly);

  // Monthly net: prefer analytics summary, then profile API, then chart data
  const monthNet = (() => {
    if (summary && summary.monthly.length > 0) {
      return summary.monthly[summary.monthly.length - 1].net;
    }
    if (profile) return profile.totals.net_earned_last_30d;
    if (chartSeries) return chartSeries.slice(-4).reduce((s, p) => s + p.net, 0);
    return 0;
  })();

  // WoW delta from analytics weekly series
  const weekDelta = (() => {
    if (chartSeries && chartSeries.length >= 2) {
      const last = chartSeries[chartSeries.length - 1].net;
      const prev = chartSeries[chartSeries.length - 2].net;
      if (prev > 0) return Number((((last - prev) / prev) * 100).toFixed(1));
    }
    return 0;
  })();

  // Avg commission from analytics platform_commission series
  const avgCommission = (() => {
    if (summary && summary.platform_commission.length > 0) {
      const valid = summary.platform_commission.filter(
        (p) => p.avg_commission_pct !== null
      );
      if (valid.length > 0) {
        const avg = valid.reduce((s, p) => s + (p.avg_commission_pct ?? 0), 0) / valid.length;
        return `${avg.toFixed(1)}%`;
      }
    }
    return "—";
  })();

  return (
    <div>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}.`}
        description="Here is what your last 30 days look like across every platform you work on."
        actions={
          <>
            <Button variant="outline" render={<Link href="/app/verify" />}>
              <Upload /> Upload screenshot
            </Button>
            <Button render={<Link href="/app/earnings" />}>
              Log a shift <ArrowRight />
            </Button>
          </>
        }
      />

      <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StaggerItem>
          <StatCard
            label="Net (last 30 days)"
            value={`Rs. ${monthNet.toLocaleString()}`}
            delta={weekDelta}
            hint="vs prior week"
            icon={<Banknote className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Total shifts"
            value={profile ? profile.totals.shifts : (summary ? summary.weekly.length : "—")}
            hint={profile ? `${profile.totals.verified_shifts} verified` : "all time"}
            icon={<Clock className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Verified shifts"
            value={profile ? profile.totals.verified_shifts : "—"}
            hint={
              profile && profile.totals.shifts > 0
                ? `${Math.round((profile.totals.verified_shifts / profile.totals.shifts) * 100)}% of total`
                : "confirmed by verifiers"
            }
            icon={<TrendingUp className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Avg commission"
            value={avgCommission}
            hint="across platforms · analytics"
            icon={<Percent className="size-4" />}
          />
        </StaggerItem>
      </Stagger>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Net earnings vs zone median – live from analytics */}
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Net earnings vs zone median</CardTitle>
                  <CardDescription>
                    Last 10 weeks · anonymised aggregate from your zone
                  </CardDescription>
                </div>
                {summary?.city_zone && (
                  <Badge variant="outline">{summary.city_zone}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="h-[300px] -ml-4">
              {shiftsLoading ? (
                <SkeletonChart />
              ) : !chartSeries ? (
                <EmptyChart message="No weekly data yet. Log shifts to see trends." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartSeries}
                    margin={{ left: 8, right: 8, top: 12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="net" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={48} />
                    <Tooltip
                      cursor={{ stroke: "var(--border)" }}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="net" stroke="var(--foreground)" strokeWidth={2} fill="url(#net)" name="Your net" />
                    {cityMedianHourly && (
                      <Line type="monotone" dataKey="cityMedian" stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Zone median" />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Hours per week from analytics summary */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Hours per week</CardTitle>
              <CardDescription>How hard you&apos;ve been working</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] -ml-4">
              {shiftsLoading ? (
                <SkeletonChart />
              ) : !chartSeries ? (
                <EmptyChart message="Log shifts to see weekly hours." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartSeries} margin={{ left: 8, right: 8, top: 12 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={28} />
                    <Tooltip
                      cursor={{ fill: "var(--muted)" }}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="hours" fill="var(--foreground)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Recent shifts – live from earnings API */}
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent shifts</CardTitle>
                  <CardDescription>
                    Latest 5 entries · Rs. {monthNet.toLocaleString()} net (30 days)
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" render={<Link href="/app/earnings" />}>
                  View all <ArrowRight />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {shiftsLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4 items-center animate-pulse py-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                      <div className="h-3 bg-muted rounded w-16" />
                      <div className="h-3 bg-muted rounded w-20" />
                      <div className="h-5 bg-muted rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No shifts logged yet.{" "}
                  <Link href="/app/earnings" className="underline underline-offset-4">
                    Log your first shift.
                  </Link>
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {recent.map((s) => (
                    <div
                      key={s.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-3 items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">{s.platform}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.date} · {s.hours_worked}h
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        –Rs. {s.platform_deductions.toLocaleString()}
                      </p>
                      <p className="text-sm font-medium tabular-nums">
                        Rs. {s.net_received.toLocaleString()}
                      </p>
                      <VerificationPill status={s.verification_status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Right column: anomaly flags + quick actions */}
        <div className="flex flex-col gap-3">
          {/* Anomaly detection panel */}
          <FadeIn delay={0.05}>
            <AnomalyPanel
              loading={anomalyLoading || shiftsLoading}
              flags={anomalyFlags}
              summary={anomalySummary}
              hasShifts={allShifts.length > 0}
            />
          </FadeIn>

          {/* Quick actions */}
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Most-used in your role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <ActionRow href="/app/earnings"     title="Log a shift"               desc="Add today's earnings" />
                <ActionRow href="/app/verify"       title="Upload screenshot"         desc="Get a shift verified" />
                <ActionRow href="/app/certificate"  title="Generate income certificate" desc="Print-friendly proof for landlord / bank" Icon={FileText} />
                <ActionRow href="/app/grievances"   title="File a grievance"          desc="Report unfair commissions or deactivation" />
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

/* ── Anomaly panel ───────────────────────────────────────── */

function AnomalyPanel({
  loading,
  flags,
  summary,
  hasShifts,
}: {
  loading: boolean;
  flags: AnomalyFlag[] | null;
  summary: string | null;
  hasShifts: boolean;
}) {
  const hasFlags = flags !== null && flags.length > 0;
  const allClear  = flags !== null && flags.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Anomaly detection
        </CardTitle>
        <CardDescription>Statistical analysis of your recent shifts</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ) : !hasShifts ? (
          <p className="text-xs text-muted-foreground">
            Log at least one shift to run anomaly detection.
          </p>
        ) : flags === null ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="size-3.5" />
            Anomaly service unavailable right now.
          </p>
        ) : allClear ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-green-600" />
            {summary ?? "No anomalies detected in your recent shifts."}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">{summary}</p>
            {flags.map((f, i) => (
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
  );
}

/* ── misc helpers ────────────────────────────────────────── */

function SkeletonChart() {
  return (
    <div className="h-full w-full animate-pulse flex items-end gap-2 px-4 pb-4">
      {[60, 80, 50, 90, 70, 85, 65, 75, 55, 88].map((h, i) => (
        <div key={i} className="flex-1 bg-muted rounded-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center px-8">
      {message}
    </div>
  );
}

function ActionRow({
  href,
  title,
  desc,
  Icon = ArrowRight,
}: {
  href: string;
  title: string;
  desc: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-md border border-border p-3 transition hover:bg-muted"
    >
      <div className="size-8 inline-flex items-center justify-center rounded-md bg-foreground text-background">
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
    </Link>
  );
}
