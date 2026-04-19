"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  FileText,
  Inbox,
  MessagesSquare,
  Megaphone,
  Search,
  LogOut,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

const NAV: NavItem[] = [
  { href: "/app",            label: "Overview",     icon: LayoutDashboard, roles: ["worker"] },
  { href: "/app/earnings",   label: "Earnings",     icon: Receipt,         roles: ["worker"] },
  { href: "/app/verify",     label: "Verification", icon: ShieldCheck,     roles: ["worker"] },
  { href: "/app/certificate",label: "Certificate",  icon: FileText,        roles: ["worker"] },
  { href: "/app/queue",      label: "Review Queue", icon: Inbox,           roles: ["verifier"] },
  { href: "/app/grievances", label: "Grievances",   icon: Megaphone,       roles: ["worker", "advocate"] },
  { href: "/app/community",  label: "Community",    icon: MessagesSquare,  roles: ["worker", "verifier", "advocate"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, logout } = useAuth();

  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  const role = user.role as Role;
  const visibleNav = NAV.filter((n) => n.roles.includes(role));
  const displayName = user.name?.trim() || user.email;
  const initials = getInitials(displayName);

  function handleSignOut() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex h-16 items-center px-5 border-b border-border">
          <Logo />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Workspace
          </p>
          {visibleNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/app" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-md bg-foreground"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-background" : "text-foreground/60 group-hover:text-foreground"
                  )}
                />
                <span className={active ? "text-background" : ""}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-[10px] bg-foreground text-background">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 lg:px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search shifts, grievances, workers…"
                className="h-9 pl-8 bg-muted/50 border-border"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium">
              <span className="size-1.5 rounded-full bg-foreground" />
              Role <span className="capitalize text-foreground">{role}</span>
            </div>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-border pr-2 pl-0.5 py-0.5 hover:bg-accent transition"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px] bg-foreground text-background">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate">{displayName}</span>
                  <span className="text-xs font-normal text-muted-foreground truncate">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

function getInitials(source: string): string {
  const cleaned = source.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  const token = parts[0];
  return (token.length >= 2 ? token.slice(0, 2) : token[0]).toUpperCase();
}
