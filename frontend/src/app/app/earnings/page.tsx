"use client";

import * as React from "react";
import { Plus, Upload, Download, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { VerificationPill } from "@/components/verification-pill";
import { FadeIn } from "@/components/motion";
import { mockShifts, PLATFORMS, CITY_ZONES, type ShiftLog } from "@/lib/mock-data";
import { toast } from "sonner";

export default function EarningsPage() {
  const [shifts, setShifts] = React.useState<ShiftLog[]>(mockShifts);
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<string>("all");

  const filtered = React.useMemo(() => {
    if (filter === "all") return shifts;
    return shifts.filter((s) => s.platform === filter);
  }, [shifts, filter]);

  const totals = filtered.reduce(
    (acc, s) => ({
      gross: acc.gross + s.gross,
      net: acc.net + s.net,
      hours: acc.hours + s.hours,
      deductions: acc.deductions + s.deductions,
    }),
    { gross: 0, net: 0, hours: 0, deductions: 0 }
  );

  function addShift(s: ShiftLog) {
    setShifts([s, ...shifts]);
    toast.success("Shift logged. Awaiting verification.");
  }

  function removeShift(id: string) {
    setShifts(shifts.filter((s) => s.id !== id));
    toast("Shift removed", { description: "You can re-add it any time." });
  }

  return (
    <div>
      <PageHeader
        title="Earnings"
        description="Every shift, every platform. Build a record nobody can deny."
        actions={
          <>
            <Button variant="outline">
              <Upload /> Import CSV
            </Button>
            <Button variant="outline">
              <Download /> Export
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button><Plus /> Log shift</Button>} />
              <ShiftDialog
                onClose={() => setOpen(false)}
                onAdd={(s) => {
                  addShift(s);
                  setOpen(false);
                }}
              />
            </Dialog>
          </>
        }
      />

      <FadeIn className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SmallStat label="Shifts" value={filtered.length} />
        <SmallStat label="Hours" value={`${totals.hours}h`} />
        <SmallStat
          label="Gross"
          value={`Rs. ${totals.gross.toLocaleString()}`}
        />
        <SmallStat
          label="Net (after deductions)"
          value={`Rs. ${totals.net.toLocaleString()}`}
          sub={`–Rs. ${totals.deductions.toLocaleString()} deducted`}
        />
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>All shifts</CardTitle>
                <CardDescription>
                  Sorted newest first · {filtered.length} entries
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
                  <SelectTrigger size="sm" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All platforms</SelectItem>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {s.date}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{s.platform}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.zone}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.hours}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      Rs. {s.gross.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      –Rs. {s.deductions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      Rs. {s.net.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <VerificationPill status={s.verification} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeShift(s.id)}
                        aria-label="Remove"
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

function SmallStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-heading text-2xl tracking-tight tabular-nums mt-1.5">
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

function ShiftDialog({
  onAdd,
  onClose,
}: {
  onAdd: (s: ShiftLog) => void;
  onClose: () => void;
}) {
  const [platform, setPlatform] = React.useState<string>("Careem");
  const [zone, setZone] = React.useState<string>("Lahore — Gulberg");
  const [date, setDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [hours, setHours] = React.useState<number>(6);
  const [gross, setGross] = React.useState<number>(2400);
  const [deductions, setDeductions] = React.useState<number>(420);

  const net = Math.max(gross - deductions, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      id: `s_${Date.now()}`,
      date,
      platform: platform as ShiftLog["platform"],
      zone,
      hours,
      gross,
      deductions,
      net,
      verification: "pending",
    });
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Log a shift</DialogTitle>
        <DialogDescription>
          Be honest with the numbers — you can attach a screenshot for
          verification right after.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
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
        </div>
        <div className="space-y-1.5">
          <Label>City zone</Label>
          <Select value={zone} onValueChange={(v) => setZone(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CITY_ZONES.map((z) => (
                <SelectItem key={z} value={z}>
                  {z}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              step="0.25"
              min={0}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gross">Gross (Rs.)</Label>
            <Input
              id="gross"
              type="number"
              min={0}
              value={gross}
              onChange={(e) => setGross(Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deductions">Deductions</Label>
            <Input
              id="deductions"
              type="number"
              min={0}
              value={deductions}
              onChange={(e) => setDeductions(Number(e.target.value))}
              required
            />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Net you’ll receive</p>
          <p className="font-heading text-xl tabular-nums">
            Rs. {net.toLocaleString()}
          </p>
        </div>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
            }
          />
          <Button type="submit">Save shift</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
