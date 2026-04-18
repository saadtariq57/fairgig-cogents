"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  FileText,
  Inbox,
  BarChart3,
  MessagesSquare,
  Megaphone,
  Search,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

const NAV: NavItem[] = [
  { href: "/app",            label: "Overview",     icon: LayoutDashboard, roles: ["worker", "verifier", "advocate"] },
  { href: "/app/earnings",   label: "Earnings",     icon: Receipt,         roles: ["worker"] },
  { href: "/app/verify",     label: "Verification", icon: ShieldCheck,     roles: ["worker"] },
  { href: "/app/certificate",label: "Certificate",  icon: FileText,        roles: ["worker"] },
  { href: "/app/queue",      label: "Review Queue", icon: Inbox,           roles: ["verifier"] },
  { href: "/app/insights",   label: "Insights",     icon: BarChart3,       roles: ["advocate"] },
  { href: "/app/grievances", label: "Grievances",   icon: Megaphone,       roles: ["worker", "advocate"] },
  { href: "/app/community",  label: "Community",    icon: MessagesSquare,  roles: ["worker", "verifier", "advocate"] },
];

const RoleContext = React.createContext<{
  role: Role;
  setRole: (r: Role) => void;
}>({ role: "worker", setRole: () => {} });

export function useRole() {
  return React.useContext(RoleContext);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<Role>("worker");
  const pathname = usePathname();

  const visibleNav = NAV.filter((n) => n.roles.includes(role));

  return (
    <RoleContext.Provider value={{ role, setRole }}>
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
                    AR
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">
                    Asif Rehman
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
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 lg:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
              <RoleSwitcher role={role} setRole={setRole} />
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
                          AR
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    </button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My account</DropdownMenuLabel>
                  <DropdownMenuItem
                    render={<Link href="/" />}
                  >
                    <LogOut className="mr-2 size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 px-4 lg:px-6 py-6">{children}</main>
        </div>
      </div>
    </RoleContext.Provider>
  );
}

function RoleSwitcher({
  role,
  setRole,
}: {
  role: Role;
  setRole: (r: Role) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="hidden md:inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-accent transition"
          >
            <span className="size-1.5 rounded-full bg-foreground" />
            Viewing as{" "}
            <span className="capitalize text-foreground">{role}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Switch persona</DropdownMenuLabel>
        {(["worker", "verifier", "advocate"] as Role[]).map((r) => (
          <DropdownMenuItem
            key={r}
            onClick={() => setRole(r)}
            className="capitalize"
          >
            {r}
            {role === r && (
              <Badge className="ml-auto" variant="secondary">
                active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
