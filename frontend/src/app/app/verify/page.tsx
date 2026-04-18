"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  UploadCloud,
  CheckCircle2,
  Clock3,
  ImageIcon,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLATFORMS, mockShifts } from "@/lib/mock-data";
import { VerificationPill } from "@/components/verification-pill";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function VerifyPage() {
  const [drag, setDrag] = React.useState(false);
  const [file, setFile] = React.useState<{ name: string; size: number } | null>(
    null
  );
  const [platform, setPlatform] = React.useState("Careem");
  const [shift, setShift] = React.useState(mockShifts[0].id);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please attach a screenshot first.");
      return;
    }
    toast.success("Submitted for verification", {
      description: "A community verifier will review it shortly.",
    });
    setFile(null);
  }

  return (
    <div>
      <PageHeader
        title="Verification"
        description="Upload a platform screenshot and we'll match it to a logged shift. Verifiers approve, flag, or mark unverifiable."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Upload a screenshot</CardTitle>
              <CardDescription>
                Crop to the earnings panel. Don’t cover personal info — verifiers
                will redact it before storing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5">
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) setFile({ name: f.name, size: f.size });
                  }}
                  className={cn(
                    "relative block rounded-xl border-2 border-dashed transition cursor-pointer text-center px-6 py-12",
                    drag
                      ? "border-foreground bg-muted"
                      : "border-border hover:border-foreground/40 hover:bg-muted/40"
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFile({ name: f.name, size: f.size });
                    }}
                  />
                  <motion.div
                    animate={{ y: drag ? -4 : 0 }}
                    className="inline-flex size-12 items-center justify-center rounded-full bg-foreground text-background"
                  >
                    <UploadCloud className="size-5" />
                  </motion.div>
                  <p className="mt-4 font-heading text-base">
                    Drop your screenshot here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG up to 8MB · or click to browse
                  </p>
                </label>

                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="size-10 rounded-md bg-muted inline-flex items-center justify-center">
                      <ImageIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB · ready to submit
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      onClick={() => setFile(null)}
                      aria-label="Remove"
                    >
                      <X />
                    </Button>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={(v) => setPlatform(v ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Match to a logged shift</Label>
                    <Select value={shift} onValueChange={(v) => setShift(v ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockShifts.slice(0, 8).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.date} · {s.platform} · Rs. {s.net.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="note">Note for verifier (optional)</Label>
                  <Input id="note" placeholder="e.g. screenshot covers 8h shift, evening rush" />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Submit for verification</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Verification timeline</CardTitle>
              <CardDescription>
                Last actions across your submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stagger className="space-y-4">
                {mockShifts.slice(0, 6).map((s, i) => (
                  <StaggerItem
                    key={s.id}
                    className="grid grid-cols-[auto_1fr_auto] items-start gap-3"
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={cn(
                          "size-7 rounded-full inline-flex items-center justify-center",
                          s.verification === "verified"
                            ? "bg-foreground text-background"
                            : s.verification === "flagged"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {s.verification === "verified" ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <Clock3 className="size-3.5" />
                        )}
                      </div>
                      {i < 5 && (
                        <span className="w-px flex-1 mt-1 bg-border h-8" />
                      )}
                    </div>
                    <div className="min-w-0 pb-3">
                      <p className="text-sm font-medium truncate">
                        {s.platform} — Rs. {s.net.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.date} · {s.zone}
                      </p>
                    </div>
                    <VerificationPill status={s.verification} />
                  </StaggerItem>
                ))}
              </Stagger>
              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  Tip: shifts verified within 24h boost your trust score on the
                  income certificate.
                </p>
                <Badge variant="outline" className="mt-2">
                  Trust score: 87 / 100
                </Badge>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
