"use client";

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
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import {
  advocateKpis,
  commissionTrend,
  complaintsByCategory,
  vulnerabilityList,
  zoneMedians,
} from "@/lib/mock-data";

const PLATFORM_COLORS = ["#000000", "#404040", "#737373", "#a3a3a3"];

export default function InsightsPage() {
  return (
    <div>
      <PageHeader
        title="Advocate insights"
        description="Aggregate, anonymised view of platform behaviour and worker vulnerability across cities."
        actions={
          <Button variant="outline">
            <Download /> Export weekly brief
          </Button>
        }
      />

      <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StaggerItem>
          <StatCard
            label="Active workers"
            value={advocateKpis.totalWorkers.toLocaleString()}
            delta={4.1}
            hint="this month"
            icon={<Users className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Flagged submissions"
            value={advocateKpis.flaggedThisWeek}
            delta={12}
            invertDelta
            hint="this week"
            icon={<AlertTriangle className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Vulnerable workers"
            value={advocateKpis.vulnerableWorkers}
            delta={-6}
            hint=">20% MoM income drop"
            icon={<ShieldAlert className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Open grievances"
            value={advocateKpis.openGrievances}
            delta={9}
            invertDelta
            hint="this week"
            icon={<MessagesSquare className="size-4" />}
          />
        </StaggerItem>
      </Stagger>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Platform commission rates</CardTitle>
                  <CardDescription>
                    Reported by workers · last 6 months · % of gross
                  </CardDescription>
                </div>
                <Badge variant="outline">Foodpanda +6pp</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[320px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={commissionTrend} margin={{ left: 8, right: 8, top: 12 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} unit="%" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={40} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Foodpanda" stroke="#000" fill="#000" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="Careem"    stroke="#404040" fill="#404040" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="Bykea"     stroke="#737373" fill="#737373" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="Indrive"   stroke="#a3a3a3" fill="#a3a3a3" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Top complaint categories</CardTitle>
              <CardDescription>This week</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintsByCategory} layout="vertical" margin={{ left: 8, right: 16, top: 8 }}>
                  <CartesianGrid stroke="var(--border)" horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={92} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {complaintsByCategory.map((_, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability flag list</CardTitle>
              <CardDescription>
                Workers whose income dropped &gt; 20% month-on-month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left py-2 font-medium">Worker</th>
                    <th className="text-left py-2 font-medium">Zone</th>
                    <th className="text-left py-2 font-medium">Platform</th>
                    <th className="text-right py-2 font-medium">MoM drop</th>
                    <th className="text-right py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vulnerabilityList.map((v) => (
                    <tr key={v.worker}>
                      <td className="py-2.5">
                        <span className="font-medium">{v.worker}</span>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{v.zone}</td>
                      <td className="py-2.5">
                        <Badge variant="outline">{v.platform}</Badge>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span className="inline-flex items-center gap-0.5 text-destructive">
                          <ArrowDownRight className="size-3.5" /> {v.drop}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <Button variant="outline" size="sm">
                          Reach out
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Income distribution by zone</CardTitle>
              <CardDescription>Median monthly net (Rs.)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {zoneMedians.map((z) => {
                const max = Math.max(...zoneMedians.map((x) => x.median));
                const pct = (z.median / max) * 100;
                return (
                  <div key={z.zone}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{z.zone}</span>
                      <span className="tabular-nums font-medium">
                        Rs. {z.median.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-foreground"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
