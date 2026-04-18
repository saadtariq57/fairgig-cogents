"use client";

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
  Legend,
} from "recharts";
import {
  Banknote,
  Clock,
  TrendingUp,
  Percent,
  Upload,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { VerificationPill } from "@/components/verification-pill";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { mockShifts, weeklySeries } from "@/lib/mock-data";

export default function OverviewPage() {
  const recent = mockShifts.slice(0, 5);
  const last = weeklySeries[weeklySeries.length - 1];
  const prev = weeklySeries[weeklySeries.length - 2];
  const diff = ((last.net - prev.net) / prev.net) * 100;
  const monthNet = weeklySeries.slice(-4).reduce((s, p) => s + p.net, 0);

  return (
    <div>
      <PageHeader
        title="Welcome back, Asif."
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
            label="Net (this week)"
            value={`Rs. ${last.net.toLocaleString()}`}
            delta={Number(diff.toFixed(1))}
            hint="vs last week"
            icon={<Banknote className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Hours logged"
            value={`${last.hours}h`}
            delta={2.4}
            hint="vs last week"
            icon={<Clock className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Effective hourly"
            value={`Rs. ${last.hourlyRate}`}
            delta={3.2}
            hint={`zone median Rs. ${last.cityMedian}`}
            icon={<TrendingUp className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Avg commission"
            value="22.4%"
            delta={1.8}
            invertDelta
            hint="across platforms"
            icon={<Percent className="size-4" />}
          />
        </StaggerItem>
      </Stagger>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
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
                <Badge variant="outline">Lahore — Gulberg</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklySeries}
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
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="net" stroke="var(--foreground)" strokeWidth={2} fill="url(#net)" />
                  <Line type="monotone" dataKey="cityMedian" stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Hours per week</CardTitle>
              <CardDescription>How hard you’ve been working</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySeries} margin={{ left: 8, right: 8, top: 12 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={28} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="hours" fill="var(--foreground)" radius={[6, 6, 0, 0]} />
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent shifts</CardTitle>
                  <CardDescription>
                    Latest 5 entries · {monthNet.toLocaleString()} Rs. net this month
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" render={<Link href="/app/earnings" />}>
                  View all <ArrowRight />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {recent.map((s) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-3 items-center"
                  >
                    <div>
                      <p className="text-sm font-medium">{s.platform}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.date} · {s.hours}h · {s.zone}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      –Rs. {s.deductions.toLocaleString()}
                    </p>
                    <p className="text-sm font-medium tabular-nums">
                      Rs. {s.net.toLocaleString()}
                    </p>
                    <VerificationPill status={s.verification} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Most-used in your role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ActionRow
                href="/app/earnings"
                title="Log a shift"
                desc="Add today’s earnings"
              />
              <ActionRow
                href="/app/verify"
                title="Upload screenshot"
                desc="Get a shift verified"
              />
              <ActionRow
                href="/app/certificate"
                title="Generate income certificate"
                desc="Print-friendly proof for landlord / bank"
                Icon={FileText}
              />
              <ActionRow
                href="/app/grievances"
                title="File a grievance"
                desc="Report unfair commissions or deactivation"
              />
            </CardContent>
          </Card>
        </FadeIn>
      </div>
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
