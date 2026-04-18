import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { text: "text-base", mark: "size-6", glyph: "text-[11px]" },
    md: { text: "text-lg", mark: "size-7", glyph: "text-[12px]" },
    lg: { text: "text-2xl", mark: "size-9", glyph: "text-[15px]" },
  } as const;
  const s = sizes[size];

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 font-semibold tracking-tight",
        s.text,
        className
      )}
    >
      {/*
        Tile uses currentColor as the fill, so it always picks up the parent's
        text color (black on light surfaces, white on dark surfaces, etc.).
        The glyph uses `mix-blend-mode: difference` so it is automatically the
        opposite of the tile, guaranteeing contrast on any background.
        A subtle outline ring further separates the mark from the surface.
      */}
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-md",
          "bg-current",
          "ring-1 ring-current/20",
          "shadow-[0_1px_0_rgba(0,0,0,0.06)]",
          "transition-transform group-hover:scale-[1.04]",
          s.mark
        )}
      >
        <span
          className={cn(
            "font-black leading-none -tracking-wider text-white",
            "mix-blend-difference",
            s.glyph
          )}
        >
          F
        </span>
        <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-current ring-2 ring-background" />
      </span>
      <span className="leading-none">
        Fair<span className="font-light opacity-60">Gig</span>
      </span>
    </Link>
  );
}
