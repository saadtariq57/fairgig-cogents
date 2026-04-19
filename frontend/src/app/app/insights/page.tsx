"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  AlertTriangle,
  ShieldAlert,
  MessagesSquare,
  Download,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import {
  analyticsApi,
  grievanceApi,
  type CommissionTrendPoint,
  type VulnerabilityWorker,
  type TopComplaintItem,
  type IncomeDistributionBucket,
} from "@/lib/api";

const PLATFORM_COLORS = ["#000000", "#404040", "#737373", "#a3a3a3"];

/* ── helpers ─────────────────────────────────────────────── */

/**
 * The analytics commission-trends API returns a flat series
 * (one row per week+platform). The chart wants pivoted objects
 * { week, Careem: 22, Foodpanda: 28, ... }.
 */
function pivotCommissionSeries(series: CommissionTrendPoint[]) {
  const byWeek = new Map<string, Record<string, string | number | null>>();
  for (const row of series) {
    if (!byWeek.has(row.week)) byWeek.set(row.week, { week: row.week });
    byWeek.get(row.week)![row.platform] = row.avg_commission_pct;
  }
  return Array.from(byWeek.values()).sort((a, b) =>
    String(a.week).localeCompare(String(b.week))
  );
}

/** Derive the unique set of platforms from the pivoted series. */
function platformsFromPivoted(pivoted: Record<string, string | number | null>[]) {
  const keys = new Set<string>();
  for (const row of pivoted) {
    for (const k of Object.keys(row)) {
      if (k !== "week") keys.add(k);
    }
  }
  return Array.from(keys);
}

/* ── component ───────────────────────────────────────────── */

export default function InsightsPage() {
  const [commissionPivoted, setCommissionPivoted] = React.useState<Record<string, string | number | null>[]>([]);
  const [platforms, setPlatforms] = React.useState<string[]>([]);
  const [complaints, setComplaints] = React.useState<TopComplaintItem[]>([]);
  const [vulnerability, setVulnerability] = React.useState<VulnerabilityWorker[]>([]);
  const [incomeBuckets, setIncomeBuckets] = React.useState<IncomeDistributionBucket[]>([]);
  const [openGrievances, setOpenGrievances] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [commRes, complaintsRes, vulnRes, incomeRes, grievancesRes] =
        await Promise.allSettled([
          analyticsApi.commissionTrends(),
          analyticsApi.topComplaints("7d"),
          analyticsApi.vulnerabilityFlags(),
          analyticsApi.incomeDistribution(),
          grievanceApi.list({ status: "open", page_size: 1 }),
        ]);

      if (commRes.status === "fulfilled") {
        const pivoted = pivotCommissionSeries(commRes.value.series);
        setCommissionPivoted(pivoted);
        setPlatforms(platformsFromPivoted(pivoted));
      }
      if (complaintsRes.status === "fulfilled") {
        setComplaints(complaintsRes.value.items);
      }
      if (vulnRes.status === "fulfilled") {
        setVulnerability(vulnRes.value.workers);
      }
      if (incomeRes.status === "fulfilled" && incomeRes.value.buckets.length > 0) {
        setIncomeBuckets(incomeRes.value.buckets);
      }
      if (grievancesRes.status === "fulfilled") {
        setOpenGrievances(grievancesRes.value.total);
      }
    } catch (e) {
      setError("Failed to load analytics data. Services may be unavailable.");
      console.error("[insights]", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  /* KPI tiles derived from live data */
  const kpiTiles = [
    {
      label: "Vulnerable workers",
      value: loading ? "—" : vulnerability.length,
      hint: ">20% MoM income drop",
      icon: <ShieldAlert className="size-4" />,
      delta: undefined as number | undefined,
    },
    {
      label: "Open grievances",
      value: loading ? "—" : openGrievances ?? "—",
      hint: "status: open",
      icon: <MessagesSquare className="size-4" />,
      delta: undefined as number | undefined,
    },
    {
      label: "Income buckets",
      value: loading ? "—" : incomeBuckets.length > 0 ? `${incomeBuckets.length} ranges` : "—",
      hint: "distribution across workers",
      icon: <Users className="size-4" />,
      delta: undefined as number | undefined,
    },
    {
      label: "Top complaint",
      value: loading ? "—" : complaints[0]?.category ?? "—",
      hint: complaints[0] ? `${complaints[0].count} reports this week` : "this week",
      icon: <AlertTriangle className="size-4" />,
      delta: undefined as number | undefined,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Advocate insights"
        description="Aggregate, anonymised view of platform behaviour and worker vulnerability across cities."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin size-4" : "size-4"} />
              {loading ? "Loading…" : "Refresh"}
            </Button>
            <Button variant="outline">
              <Download /> Export weekly brief
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiTiles.map((t, i) => (
          <StaggerItem key={i}>
            <StatCard
              label={t.label}
              value={t.value}
              hint={t.hint}
              icon={t.icon}
              {...(t.delta !== undefined ? { delta: t.delta } : {})}
            />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Commission trends – pivoted from analytics service */}
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Platform commission rates</CardTitle>
                  <CardDescription>
                    Weekly avg % of gross · last 6 months · live from analytics
                  </CardDescription>
                </div>
                {commissionPivoted.length === 0 && !loading && (
                  <Badge variant="outline">No data</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="h-[320px] -ml-4">
              {loading ? (
                <SkeletonChart />
              ) : commissionPivoted.length === 0 ? (
                <EmptyState message="No commission trend data available yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={commissionPivoted} margin={{ left: 8, right: 8, top: 12 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} unit="%" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={40} />
                    <Tooltip
                      formatter={(v) => [v != null ? `${Number(v).toFixed(1)}%` : "—"]}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {platforms.map((p, i) => (
                      <Area
                        key={p}
                        type="monotone"
                        dataKey={p}
                        stroke={PLATFORM_COLORS[i % PLATFORM_COLORS.length]}
                        fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]}
                        fillOpacity={i === 0 ? 0.15 : 0.08}
                        connectNulls
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Top complaints from analytics → grievance proxy */}
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Top complaint categories</CardTitle>
              <CardDescription>This week · live from grievance service</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] -ml-4">
              {loading ? (
                <SkeletonChart />
              ) : complaints.length === 0 ? (
                <EmptyState message="No complaint data for this window." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complaints} layout="vertical" margin={{ left: 8, right: 16, top: 8 }}>
                    <CartesianGrid stroke="var(--border)" horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={110} />
                    <Tooltip
                      cursor={{ fill: "var(--muted)" }}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {complaints.map((_, i) => (
                        <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Vulnerability flag list from analytics service */}
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability flag list</CardTitle>
              <CardDescription>
                Workers whose income dropped &gt; 20% month-on-month · live data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable rows={4} />
              ) : vulnerability.length === 0 ? (
                <EmptyState message="No vulnerable workers flagged this period." />
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b border-border">
                    <tr>
                      <th className="text-left py-2 font-medium">Worker</th>
                      <th className="text-left py-2 font-medium">Zone</th>
                      <th className="text-left py-2 font-medium">Category</th>
                      <th className="text-right py-2 font-medium">MoM drop</th>
                      <th className="text-right py-2 font-medium">Last month net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vulnerability.map((v) => (
                      <tr key={v.worker_id_masked}>
                        <td className="py-2.5">
                          <span className="font-medium font-mono text-xs">{v.worker_id_masked}</span>
                        </td>
                        <td className="py-2.5 text-muted-foreground text-xs">{v.city_zone}</td>
                        <td className="py-2.5">
                          <Badge variant="outline" className="text-xs">{v.category}</Badge>
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          <span className="inline-flex items-center gap-0.5 text-destructive">
                            <ArrowDownRight className="size-3.5" /> {v.drop_pct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-xs text-muted-foreground">
                          Rs. {v.last_month_net.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Income distribution from analytics service */}
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Income distribution</CardTitle>
              <CardDescription>Workers per monthly net bracket (k-anon enforced)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <SkeletonBars rows={5} />
              ) : incomeBuckets.length === 0 ? (
                <EmptyState message="Insufficient data to show distribution (k-anonymity floor)." />
              ) : (
                (() => {
                  const maxCount = Math.max(...incomeBuckets.map((b) => b.count), 1);
                  return incomeBuckets.map((b) => (
                    <div key={b.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{b.label}</span>
                        <span className="tabular-nums font-medium">{b.count} workers</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-foreground transition-all duration-700"
                          style={{ width: `${(b.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}

/* ── skeleton / empty helpers ─────────────────────────────── */

function SkeletonChart() {
  return (
    <div className="h-full w-full animate-pulse flex items-end gap-2 px-4 pb-4">
      {[60, 80, 50, 90, 70, 85, 65, 75].map((h, i) => (
        <div key={i} className="flex-1 bg-muted rounded-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

function SkeletonTable({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse py-2">
          <div className="h-3 bg-muted rounded w-1/4" />
          <div className="h-3 bg-muted rounded w-1/4" />
          <div className="h-3 bg-muted rounded w-1/6" />
          <div className="h-3 bg-muted rounded w-1/6 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function SkeletonBars({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex justify-between mb-1">
            <div className="h-2.5 bg-muted rounded w-20" />
            <div className="h-2.5 bg-muted rounded w-12" />
          </div>
          <div className="h-1.5 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center px-4">
      {message}
    </div>
  );
}
