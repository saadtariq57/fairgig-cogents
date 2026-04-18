"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Variant = "icon" | "icon-sm";

export function ThemeToggle({ size = "icon" }: { size?: Variant }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? resolvedTheme : undefined;
  const isDark = current === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size={size}
            aria-label="Toggle theme"
            suppressHydrationWarning
          >
            {/* Sun visible in light mode, Moon in dark — both rendered for smooth crossfade */}
            <Sun
              className={
                "size-4 transition-all " +
                (isDark ? "scale-0 -rotate-90 absolute" : "scale-100 rotate-0")
              }
            />
            <Moon
              className={
                "size-4 transition-all " +
                (isDark ? "scale-100 rotate-0" : "scale-0 rotate-90 absolute")
              }
            />
            <span className="sr-only">Toggle theme</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemeItem
          label="Light"
          value="light"
          icon={<Sun className="size-4" />}
          active={theme === "light"}
          onSelect={() => setTheme("light")}
        />
        <ThemeItem
          label="Dark"
          value="dark"
          icon={<Moon className="size-4" />}
          active={theme === "dark"}
          onSelect={() => setTheme("dark")}
        />
        <ThemeItem
          label="System"
          value="system"
          icon={<Monitor className="size-4" />}
          active={theme === "system"}
          onSelect={() => setTheme("system")}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeItem({
  label,
  icon,
  active,
  onSelect,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem onClick={onSelect}>
      {icon}
      <span>{label}</span>
      {active && <Check className="ml-auto size-3.5" />}
    </DropdownMenuItem>
  );
}
