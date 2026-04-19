"use client";

import * as React from "react";
import { Plus, Upload, Trash2, Filter, RefreshCw, AlertCircle } from "lucide-react";
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
import { PLATFORMS } from "@/lib/mock-data";
import {
  earningsApi,
  type Shift,
  type CreateShiftInput,
  ApiError,
} from "@/lib/api";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Pagination config                                                   */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 50;

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function EarningsPage() {
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [filter, setFilter] = React.useState<string>("all");
  const [addOpen, setAddOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  /* ---- Load shifts ---- */
  const loadShifts = React.useCallback(
    async (p = page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await earningsApi.listShifts({
          platform: filter === "all" ? undefined : filter,
          page: p,
          page_size: PAGE_SIZE,
        });
        setShifts(res.items);
        setTotal(res.total);
        setPage(res.page);
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "Failed to load shifts.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [filter, page]
  );

  React.useEffect(() => {
    // Reset to page 1 when filter changes
    setPage(1);
    loadShifts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  /* ---- Totals from current page ---- */
  const totals = React.useMemo(
    () =>
      shifts.reduce(
        (acc, s) => ({
          gross: acc.gross + s.gross_earned,
          net: acc.net + s.net_received,
          hours: acc.hours + s.hours_worked,
          deductions: acc.deductions + s.platform_deductions,
        }),
        { gross: 0, net: 0, hours: 0, deductions: 0 }
      ),
    [shifts]
  );

  /* ---- Handlers ---- */
  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Remove this shift? This cannot be undone if verification has already started."
    );
    if (!confirmed) return;
    try {
      await earningsApi.deleteShift(id);
      toast("Shift removed.");
      loadShifts(page);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not delete shift.";
      toast.error(msg);
    }
  }

  function handleShiftAdded() {
    setAddOpen(false);
    loadShifts(1);
  }

  function handleImportDone() {
    setImportOpen(false);
    loadShifts(1);
  }

  /* ---- Total pages ---- */
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Earnings"
        description="Every shift, every platform. Build a record nobody can deny."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload /> Import CSV
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger render={<Button><Plus /> Log shift</Button>} />
              <ShiftDialog
                onClose={() => setAddOpen(false)}
                onAdded={handleShiftAdded}
              />
            </Dialog>
          </>
        }
      />

      {/* CSV import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <ImportDialog onClose={() => setImportOpen(false)} onDone={handleImportDone} />
      </Dialog>

      {/* Summary stats */}
      <FadeIn className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SmallStat label="Shifts (this page)" value={shifts.length} />
        <SmallStat label="Hours" value={`${totals.hours.toFixed(1)}h`} />
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
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>All shifts</CardTitle>
                <CardDescription>
                  Sorted newest first · {total} total
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => loadShifts(page)}
                  aria-label="Refresh"
                  disabled={loading}
                >
                  <RefreshCw className={loading ? "animate-spin" : ""} />
                </Button>
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
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/5">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-auto py-0.5 px-2"
                  onClick={() => loadShifts(page)}
                >
                  Retry
                </Button>
              </div>
            )}

            {loading && shifts.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading shifts…
              </div>
            ) : shifts.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No shifts yet. Log your first shift to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((s) => (
                    <ShiftRow
                      key={s.id}
                      shift={s}
                      onDelete={() => handleDelete(s.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => {
                      const prev = page - 1;
                      setPage(prev);
                      loadShifts(prev);
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => {
                      const next = page + 1;
                      setPage(next);
                      loadShifts(next);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

function ShiftRow({
  shift: s,
  onDelete,
}: {
  shift: Shift;
  onDelete: () => void;
}) {
  const canDelete = s.verification_status === "unverified";

  return (
    <TableRow>
      <TableCell className="text-muted-foreground tabular-nums">{s.date}</TableCell>
      <TableCell className="font-medium">
        <Badge variant="outline">{s.platform}</Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">{s.hours_worked}</TableCell>
      <TableCell className="text-right tabular-nums">
        Rs. {s.gross_earned.toLocaleString()}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        –Rs. {s.platform_deductions.toLocaleString()}
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium">
        Rs. {s.net_received.toLocaleString()}
      </TableCell>
      <TableCell>
        <VerificationPill status={s.verification_status} />
      </TableCell>
      <TableCell>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Remove shift"
          >
            <Trash2 />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/* SmallStat                                                           */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* ShiftDialog — log a single shift                                    */
/* ------------------------------------------------------------------ */

function ShiftDialog({
  onAdded,
  onClose,
}: {
  onAdded: () => void;
  onClose: () => void;
}) {
  const [platform, setPlatform] = React.useState<string>("Careem");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = React.useState<number>(6);
  const [gross, setGross] = React.useState<number>(2400);
  const [deductions, setDeductions] = React.useState<number>(420);
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const net = Math.max(gross - deductions, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const input: CreateShiftInput = {
      platform,
      date,
      hours_worked: hours,
      gross_earned: gross,
      platform_deductions: deductions,
      net_received: net,
      notes: notes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await earningsApi.createShift(input);
      toast.success("Shift logged. Awaiting verification.");
      onAdded();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to save shift.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              step="0.25"
              min={0}
              max={24}
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

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input
            id="notes"
            placeholder="e.g. surge pricing, rain bonus…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Net you&apos;ll receive</p>
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
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save shift"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/* ------------------------------------------------------------------ */
/* ImportDialog — CSV upload                                           */
/* ------------------------------------------------------------------ */

function ImportDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<{
    imported: number;
    skipped: { row: number; reason: string }[];
  } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    try {
      const res = await earningsApi.importCsv(file);
      setResult(res);
      if (res.imported > 0) {
        toast.success(`Imported ${res.imported} shift${res.imported !== 1 ? "s" : ""}.`);
      }
      if (res.skipped.length > 0) {
        toast.warning(`${res.skipped.length} row${res.skipped.length !== 1 ? "s" : ""} could not be imported.`);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Import failed.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Import CSV</DialogTitle>
        <DialogDescription>
          Required columns:{" "}
          <code className="text-xs bg-muted px-1 rounded">
            platform, date, hours_worked, gross_earned, platform_deductions, net_received
          </code>
          . An optional <code className="text-xs bg-muted px-1 rounded">notes</code> column is
          also accepted.
        </DialogDescription>
      </DialogHeader>

      {result ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            {result.imported} shift{result.imported !== 1 ? "s" : ""} imported
          </p>
          {result.skipped.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Skipped rows
              </p>
              <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                {result.skipped.map((sk) => (
                  <div key={sk.row} className="flex gap-2">
                    <span className="text-muted-foreground shrink-0">Row {sk.row}:</span>
                    <span className="text-destructive">{sk.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={onDone}>Done</Button>
          </DialogFooter>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="csvfile">CSV file</Label>
            <Input
              id="csvfile"
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={submitting || !file}>
              {submitting ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  );
}
