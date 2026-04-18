"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  ImageIcon,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FadeIn } from "@/components/motion";
import { verificationQueue } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function QueuePage() {
  const [items, setItems] = React.useState(verificationQueue);
  const [active, setActive] = React.useState(items[0]?.id);
  const current = items.find((i) => i.id === active) ?? items[0];

  function decide(action: "verified" | "flagged" | "unverifiable") {
    if (!current) return;
    const labels = {
      verified: "Approved",
      flagged: "Flagged for discrepancy",
      unverifiable: "Marked unverifiable",
    };
    toast.success(labels[action], { description: `${current.worker} · ${current.platform}` });
    const idx = items.findIndex((i) => i.id === current.id);
    const remaining = items.filter((i) => i.id !== current.id);
    setItems(remaining);
    setActive(remaining[idx]?.id ?? remaining[0]?.id);
  }

  return (
    <div>
      <PageHeader
        title="Review queue"
        description="Help your community keep earnings honest. Review screenshots and stamp them."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-foreground" />
            {items.length} pending
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-3">
        <FadeIn>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Pending</CardTitle>
              <CardDescription>Newest first</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                <AnimatePresence initial={false}>
                  {items.map((it) => (
                    <motion.li
                      key={it.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => setActive(it.id)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 px-4 py-3 transition",
                          active === it.id
                            ? "bg-muted"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Avatar className="size-9">
                          <AvatarFallback className="text-[10px]">
                            {it.worker
                              .split(" ")
                              .map((s) => s[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {it.worker}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {it.platform} · Rs. {it.reportedNet.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {it.uploadedAt}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <li className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Queue cleared. Good work.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.05}>
          {current ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{current.worker}</CardTitle>
                    <CardDescription>
                      Submitted {current.uploadedAt} · Shift dated {current.date}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{current.platform}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-[1.4fr_1fr] gap-4">
                  {/* Mock screenshot frame */}
                  <div className="relative rounded-lg overflow-hidden border border-border bg-muted aspect-[4/3]">
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="size-10 mx-auto opacity-40" />
                        <p className="mt-2 text-xs">Worker-uploaded screenshot</p>
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                      <span className="size-1.5 rounded-full bg-foreground" />
                      EXIF intact
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Field label="Reported net" value={`Rs. ${current.reportedNet.toLocaleString()}`} />
                    <Field label="Expected band" value="Rs. 2,300 – Rs. 2,700" sub="based on zone & hours" />
                    <Field label="Risk score" value="0.18 (low)" />
                    <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                      Cross-check the platform name, total earnings, date and
                      number of trips on the screenshot. Flag if anything
                      doesn’t line up — workers can re-submit.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border">
                  <Button variant="outline" onClick={() => decide("unverifiable")}>
                    <EyeOff /> Unverifiable
                  </Button>
                  <Button variant="outline" onClick={() => decide("flagged")}>
                    <AlertTriangle /> Flag discrepancy
                  </Button>
                  <Button onClick={() => decide("verified")}>
                    <CheckCircle2 /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Nothing left to review. Take a break.
              </CardContent>
            </Card>
          )}
        </FadeIn>
      </div>
    </div>
  );
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-heading text-lg tabular-nums mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
