"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { FadeIn } from "@/components/motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

const ROLES = [
  { id: "worker",   t: "Gig Worker",       d: "Log earnings & generate income proof." },
  { id: "verifier", t: "Verifier",          d: "Review submissions from your community." },
  { id: "advocate", t: "Advocate / Analyst", d: "Spot platform-wide unfairness at scale." },
] as const;

export default function SignupPage() {
  const [role, setRole] = React.useState<(typeof ROLES)[number]["id"]>("worker");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Account created. Welcome to FairGig.");
    router.push("/app");
  }
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-6">
          <Logo />
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Already have an account?
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <FadeIn className="w-full max-w-xl">
          <h1 className="font-heading text-3xl lg:text-4xl tracking-tight">
            Create your FairGig account.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            One account. Choose your role — you can collaborate across
            communities later. <span className="text-foreground/80">No card. No spam. Ever.</span>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            <div>
              <Label className="mb-2 block">I am a…</Label>
              <div className="grid sm:grid-cols-3 gap-2">
                {ROLES.map((r) => {
                  const active = role === r.id;
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`text-left rounded-lg border p-3 transition ${
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <p className="text-sm font-medium">{r.t}</p>
                      <p
                        className={`mt-1 text-xs leading-snug ${
                          active ? "text-background/70" : "text-muted-foreground"
                        }`}
                      >
                        {r.d}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Asif Rehman" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Lahore" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email or phone</Label>
              <Input id="email" placeholder="you@fairgig.app" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" required />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Create account
              <ArrowRight />
            </Button>
           
          </form>
        </FadeIn>
      </main>
    </div>
  );
}
