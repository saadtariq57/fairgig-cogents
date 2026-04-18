"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { FadeIn } from "@/components/motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Signed in. Welcome back.");
    router.push("/app");
  }
  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      {/* Left — black panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-foreground text-background p-12 overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-10" />
        <div className="relative flex items-center justify-between">
          <Logo href="/" className="text-background" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-sm"
        >
          <p className="text-sm text-background/60 uppercase tracking-widest">
            FairGig
          </p>
          <h2 className="mt-4 font-heading text-3xl xl:text-4xl tracking-tight leading-tight">
            “For the first time, my income is something I can show — not just
            something I remember.”
          </h2>
         
        </motion.div>
        <div className="relative flex items-center justify-between text-xs text-background/40">
          
          <p className="hidden xl:block italic">
           
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-col px-6 lg:px-16 py-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex-1 flex items-center">
          <FadeIn className="w-full max-w-sm mx-auto">
            <h1 className="font-heading text-3xl tracking-tight">Welcome back.</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to continue tracking your earnings — your ledger is
              waiting.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email or phone</Label>
                <Input id="email" placeholder="you@fairgig.app" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="flex justify-between">
                  Password
                  <Link
                    href="#"
                    className="text-xs font-normal text-muted-foreground hover:text-foreground"
                  >
                    Forgot?
                  </Link>
                </Label>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full mt-2" size="lg">
                Sign in
                <ArrowRight />
              </Button>
            </form>

            <div className="mt-8 text-sm text-muted-foreground">
              New to FairGig?{" "}
              <Link
                href="/signup"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
