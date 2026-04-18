"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { FadeIn } from "@/components/motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { ApiError, type RegisterInput } from "@/lib/api";
import { CITY_ZONES } from "@/lib/mock-data";

const ROLES = [
  { id: "worker",   t: "Gig Worker",          d: "Log earnings & generate income proof." },
  { id: "verifier", t: "Verifier",            d: "Review submissions from your community." },
  { id: "advocate", t: "Advocate / Analyst",  d: "Spot platform-wide unfairness at scale." },
] as const;

const CATEGORIES = [
  { id: "ride_hailing", label: "Ride hailing" },
  { id: "delivery",     label: "Delivery" },
  { id: "freelance",    label: "Freelance" },
  { id: "domestic",     label: "Domestic work" },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

export default function SignupPage() {
  const router = useRouter();
  const { signup, status } = useAuth();

  const [role, setRole] = React.useState<RoleId>("worker");
  const [name, setName] = React.useState("");
  const [cityZone, setCityZone] = React.useState<string>(CITY_ZONES[0]);
  const [category, setCategory] = React.useState<string>(CATEGORIES[0].id);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/app");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    const payload: RegisterInput = {
      email: email.trim(),
      password,
      name: name.trim() || undefined,
      role,
    };
    if (role === "worker") {
      payload.city_zone = cityZone;
      payload.category = category;
    }

    setSubmitting(true);
    try {
      await signup(payload);
      toast.success("Account created. Welcome to FairGig.");
      router.push("/app");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not create your account. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
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
                <Input
                  id="name"
                  placeholder="Asif Rehman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              {role === "worker" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="city">City / Zone</Label>
                  <select
                    id="city"
                    value={cityZone}
                    onChange={(e) => setCityZone(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
                    required
                  >
                    {CITY_ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Lahore" />
                </div>
              )}
            </div>

            {role === "worker" && (
              <div className="space-y-1.5">
                <Label htmlFor="category">Primary work category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@fairgig.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                At least 6 characters.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight />
                </>
              )}
            </Button>
           
          </form>
        </FadeIn>
      </main>
    </div>
  );
}
