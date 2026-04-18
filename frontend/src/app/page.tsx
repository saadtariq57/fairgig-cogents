"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  LineChart,
  FileText,
  Megaphone,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: LineChart,
    title: "Earnings, in one place",
    body: "Log shifts across every platform — Careem, inDrive, Bykea, Foodpanda and more. See your real hourly rate, weekly trends, and how you compare to your zone — without spreadsheets.",
    points: [
      "Cross-platform weekly ledger",
      "Effective hourly rate after fuel & commission",
      "Zone-level anonymised comparisons",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Honest verification",
    body: "Workers upload screenshots; community verifiers confirm or flag them. Your profile shows what is verified and what isn't — no smoke, no mirrors.",
    points: [
      "Per-shift verification badge",
      "Plain-language flag reasons",
      "Re-submit anytime",
    ],
  },
  {
    icon: FileText,
    title: "Printable income proof",
    body: "Generate a clean income certificate for any date range — designed for landlords, banks, and family. Verified-only earnings by default.",
    points: [
      "One-page printable certificate",
      "Custom date range",
      "Shareable verification link",
    ],
  },
  {
    icon: Megaphone,
    title: "Collective voice",
    body: "Anonymous bulletin board for rate intel and grievances. Advocates cluster patterns into action, so a hundred quiet complaints become one loud signal.",
    points: [
      "Anonymous grievance filing",
      "Advocate-side pattern clustering",
      "City-level rate intelligence",
    ],
  },
];

const stats = [
  { kpi: "4,231", label: "active workers" },
  { kpi: "87%", label: "of submissions verified" },
  { kpi: "23", label: "platforms tracked" },
  { kpi: "Rs. 12.4M", label: "income documented" },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-5 lg:px-8">
          <Logo />
          <nav className="ml-10 hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Product</a>
            <a href="#personas" className="hover:text-foreground transition">For whom</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#trust" className="hover:text-foreground transition">Trust</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button size="sm" render={<Link href="/signup" />}>
              Get started <ArrowRight />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-dots opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-5 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02]"
          >
            Income transparency
            <br />
            <span className="text-muted-foreground">for every gig worker.</span>
          </motion.h1>

          <FadeIn delay={0.15} className="mt-6 max-w-xl text-base lg:text-lg text-muted-foreground leading-relaxed">
            FairGig is a unified ledger and rights platform for ride-hailing,
            delivery and freelance workers — log your earnings, prove your
            income, and surface platform unfairness with a community at your
            back.
          </FadeIn>

          <FadeIn delay={0.25} className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" render={<Link href="/signup" />}>
              Start logging earnings
              <ArrowRight />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/app" />}
            >
              View live dashboard
              <ArrowUpRight />
            </Button>
          </FadeIn>

          <Stagger className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl">
            {stats.map((s) => (
              <StaggerItem key={s.label} className="border-l border-border pl-4">
                <p className="font-heading text-2xl lg:text-3xl tracking-tight">
                  {s.kpi}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 lg:px-8 py-20 lg:py-28">
          <FadeIn className="max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              What FairGig does
            </p>
            <h2 className="mt-3 font-heading text-3xl lg:text-5xl tracking-tight">
              The unfair gig isn’t the work.
              <br />
              <span className="text-muted-foreground">
                It’s the silence around it.
              </span>
            </h2>
          </FadeIn>

          <Stagger className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <StaggerItem key={f.title}>
                  <Card className="h-full transition hover:border-foreground/30 hover:ring-foreground/30">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="inline-flex size-9 items-center justify-center rounded-md bg-foreground text-background mb-5">
                        <Icon className="size-4" />
                      </div>
                      <h3 className="font-heading text-lg font-medium tracking-tight">
                        {f.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {f.body}
                      </p>
                      <ul className="mt-5 pt-4 border-t border-border space-y-2">
                        {f.points.map((pt) => (
                          <li
                            key={pt}
                            className="flex items-start gap-2 text-xs text-foreground/80"
                          >
                            <CheckCircle2 className="size-3.5 mt-0.5 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Personas */}
      <section id="personas" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 lg:px-8 py-20 lg:py-28">
          <FadeIn className="max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Built for four roles
            </p>
            <h2 className="mt-3 font-heading text-3xl lg:text-5xl tracking-tight">
              One platform. Four perspectives.
            </h2>
          </FadeIn>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {[
              {
                title: "Worker",
                body: "Log shifts, upload screenshots, view your real income, generate a printable certificate.",
                stat: "Rs. 312 / hr",
                statLabel: "Median real hourly rate",
              },
              {
                title: "Verifier",
                body: "Review screenshots, approve or flag earnings — keep submissions honest.",
                stat: "1.4 min",
                statLabel: "Median time per review",
              },
              {
                title: "Advocate",
                body: "Spot commission hikes, deactivation patterns and vulnerable workers across cities.",
                stat: "12 cities",
                statLabel: "Active worker communities",
              },
              {
                title: "Community",
                body: "Anonymous bulletin board for rate intel, complaints and mutual support.",
                stat: "100% anon",
                statLabel: "No identity ever exposed",
              },
            ].map((p, i) => (
              <FadeIn
                key={p.title}
                delay={i * 0.08}
                className="bg-background p-6 lg:p-7 flex flex-col"
              >
                <p className="text-xs text-muted-foreground">0{i + 1}</p>
                <h3 className="mt-4 font-heading text-xl tracking-tight">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {p.body}
                </p>
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="font-heading text-lg tracking-tight tabular-nums">
                    {p.stat}
                  </p>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
                    {p.statLabel}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-[1fr_1.2fr] gap-16">
          <FadeIn>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 font-heading text-3xl lg:text-5xl tracking-tight">
              From a shift entry to a verified, printable income record — in
              under a minute.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
              Workers stay in control of their data. Verifiers vouch for
              authenticity. Advocates see the patterns no individual could spot.
            </p>
          </FadeIn>

          <Stagger className="space-y-6">
            {[
              {
                step: "01",
                t: "Log your shift",
                d: "Add platform, hours, gross, deductions and net — or import a CSV from your platform export.",
                meta: "≈ 20 seconds",
              },
              {
                step: "02",
                t: "Upload a screenshot",
                d: "Attach the platform's earnings screen. A community verifier reviews and stamps it.",
                meta: "Verified in ≈ 1.4 min",
              },
              {
                step: "03",
                t: "Watch your real numbers",
                d: "Effective hourly rate, commission rate over time, comparison to your zone's anonymised median.",
                meta: "Updated live",
              },
              {
                step: "04",
                t: "Prove it. Or escalate it.",
                d: "Print an income certificate, or file a grievance for advocates to cluster and escalate.",
                meta: "One-click export",
              },
            ].map((s) => (
              <StaggerItem
                key={s.step}
                className="flex gap-5 border-t border-border pt-6"
              >
                <p className="font-heading text-lg text-muted-foreground tabular-nums w-10">
                  {s.step}
                </p>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-heading text-lg">{s.t}</h3>
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">
                      {s.meta}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {s.d}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Honest by design
              </p>
              <h2 className="mt-3 font-heading text-3xl lg:text-4xl tracking-tight">
                Be honest about what we can and cannot verify.
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Verification status is shown on every shift. Aggregate medians
                use real data — never hardcoded. Every flag explains its
                reasoning in plain language.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { k: "0", l: "Platform sponsorships" },
                  { k: "100%", l: "Worker-owned data" },
                  { k: "Free", l: "Forever, for workers" },
                ].map((b) => (
                  <div
                    key={b.l}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="font-heading text-xl tracking-tight">{b.k}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                      {b.l}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
            <Stagger className="space-y-3">
              {[
                "Per-shift verification badge: verified · pending · flagged · unverifiable",
                "Anonymised aggregates — workers are never re-identifiable",
                "Plain-language reasons attached to every flagged entry",
                "Print-friendly income certificate with verified-only earnings",
                "Open data export — your ledger belongs to you, leave any time",
              ].map((line) => (
                <StaggerItem
                  key={line}
                  className="flex gap-3 items-start text-sm border border-border rounded-lg p-4"
                >
                  <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
                  <span>{line}</span>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 lg:px-8 py-20 lg:py-28">
          <FadeIn className="bg-foreground text-background rounded-2xl p-10 lg:p-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-dots [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
            <div className="relative max-w-2xl">
              <h2 className="font-heading text-3xl lg:text-5xl tracking-tight">
                Your earnings deserve a record. Your work deserves a voice.
              </h2>
              <p className="mt-5 text-background/70">
                Join FairGig — built with workers, for workers.
              </p>
              <div className="mt-8 flex gap-3 flex-wrap">
                <Button
                  size="lg"
                  variant="secondary"
                  render={<Link href="/signup" />}
                >
                  Create your account
                  <ArrowRight />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-background/30 text-background bg-transparent hover:bg-background/15 hover:text-background hover:border-background/60 dark:bg-transparent dark:hover:bg-background/15 dark:hover:text-background"
                  render={<Link href="/app" />}
                >
                  Tour the dashboard
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-5 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between text-sm text-muted-foreground">
        <Logo size="sm" />
        <p>© 2026 FairGig.</p>
        <div className="flex gap-5">
          <a className="hover:text-foreground" href="#">Privacy</a>
          <a className="hover:text-foreground" href="#">API docs</a>
          <a className="hover:text-foreground" href="#">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
