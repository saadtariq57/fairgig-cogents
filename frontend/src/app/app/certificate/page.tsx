"use client";

import * as React from "react";
import { Printer, Download, Share2, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion";
import { mockShifts, currentUser } from "@/lib/mock-data";

export default function CertificatePage() {
  const [from, setFrom] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = React.useState(new Date().toISOString().slice(0, 10));
  const [verifiedOnly, setVerifiedOnly] = React.useState(true);

  const inRange = mockShifts.filter((s) => {
    const d = s.date;
    if (d < from || d > to) return false;
    if (verifiedOnly && s.verification !== "verified") return false;
    return true;
  });

  const totals = inRange.reduce(
    (acc, s) => ({
      gross: acc.gross + s.gross,
      deductions: acc.deductions + s.deductions,
      net: acc.net + s.net,
      hours: acc.hours + s.hours,
    }),
    { gross: 0, deductions: 0, net: 0, hours: 0 }
  );
  const hourly = totals.hours ? Math.round(totals.net / totals.hours) : 0;

  return (
    <div>
      <PageHeader
        title="Income certificate"
        description="A clean, printable income proof for landlords, banks, or family. Uses verified earnings only by default."
        actions={
          <>
            <Button variant="outline">
              <Share2 /> Copy link
            </Button>
            <Button variant="outline">
              <Download /> Save as PDF
            </Button>
            <Button onClick={() => window.print()}>
              <Printer /> Print
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3">
        <FadeIn className="no-print">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Pick a date range and what to include.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="from">From</Label>
                  <Input
                    id="from"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 accent-foreground"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                />
                <span>
                  <span className="block text-sm font-medium">
                    Verified earnings only
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Recommended for formal use. Excludes pending or unverifiable
                    entries.
                  </span>
                </span>
              </label>
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5">
                <p>This certificate includes:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>{inRange.length} shifts</li>
                  <li>Across {new Set(inRange.map((s) => s.platform)).size} platforms</li>
                  <li>Total {totals.hours} hours worked</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="print-page bg-white text-black rounded-xl ring-1 ring-foreground/10 overflow-hidden">
            <div className="p-8 lg:p-12">
              <div className="flex items-start justify-between gap-6 border-b border-black/15 pb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-black/60">
                    FairGig — Income certificate
                  </p>
                  <h2 className="font-heading text-3xl tracking-tight mt-2">
                    {currentUser.name}
                  </h2>
                  <p className="text-sm text-black/60 mt-1">
                    Worker ID #FG-2841 · {currentUser.city}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 rounded-md bg-black text-white px-3 py-1.5 text-xs font-medium">
                    <FileText className="size-3.5" /> Certified
                  </div>
                  <p className="text-xs text-black/60 mt-2">
                    Issued {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <CertStat label="Period" value={`${from} → ${to}`} />
                <CertStat label="Shifts" value={inRange.length} />
                <CertStat
                  label="Hours worked"
                  value={`${totals.hours} h`}
                />
                <CertStat
                  label="Effective hourly"
                  value={`Rs. ${hourly.toLocaleString()}`}
                />
              </div>

              <div className="mt-6 rounded-lg border border-black/15 overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-black/15 bg-black/5">
                  <CertBigStat
                    label="Gross earned"
                    value={`Rs. ${totals.gross.toLocaleString()}`}
                  />
                  <CertBigStat
                    label="Net received"
                    value={`Rs. ${totals.net.toLocaleString()}`}
                    accent
                  />
                </div>
              </div>

              <h3 className="font-heading text-base mt-8 mb-3">
                Verified shifts in this period
              </h3>
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-black/60 border-b border-black/15">
                  <tr>
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Platform</th>
                    <th className="py-2 font-medium">Hours</th>
                    <th className="py-2 font-medium text-right">Gross</th>
                    <th className="py-2 font-medium text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {inRange.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 tabular-nums">{s.date}</td>
                      <td className="py-2">{s.platform}</td>
                      <td className="py-2">{s.hours}h</td>
                      <td className="py-2 text-right tabular-nums">
                        Rs. {s.gross.toLocaleString()}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        Rs. {s.net.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 border-t border-black/15 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-xs text-black/60 max-w-md leading-relaxed">
                  This certificate is generated by FairGig from worker-logged
                  shifts that have been verified by community reviewers. It is
                  intended as supporting evidence of income, not a payslip.
                </p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-black text-white border-transparent">
                    Verified
                  </Badge>
                  <span className="text-xs text-black/60">
                    fairgig.app/c/FG-2841
                  </span>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function CertStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-black/50">{label}</p>
      <p className="font-heading text-base mt-1.5 tracking-tight">{value}</p>
    </div>
  );
}

function CertBigStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`p-5 ${accent ? "bg-black text-white" : ""}`}>
      <p
        className={`text-xs uppercase tracking-widest ${
          accent ? "text-white/60" : "text-black/60"
        }`}
      >
        {label}
      </p>
      <p className="font-heading text-3xl tracking-tight mt-2 tabular-nums">
        {value}
      </p>
    </div>
  );
}
