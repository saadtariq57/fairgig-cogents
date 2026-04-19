"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  ChevronUp,
  Tag,
  Flame,
  CheckCircle2,
  Plus,
  Loader2,
  AlertCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FadeIn } from "@/components/motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  grievanceApi,
  type Grievance,
  type GrievanceCategory,
  type GrievanceStatus,
  type GrievanceComment,
} from "@/lib/api";

const PLATFORMS = [
  "Careem",
  "InDrive",
  "Foodpanda",
  "Bykea",
  "Uber",
  "Other",
];

const CATEGORIES: { value: GrievanceCategory; label: string }[] = [
  { value: "commission_change", label: "Commission Hike" },
  { value: "sudden_deactivation", label: "Deactivation" },
  { value: "unpaid_earnings", label: "Unpaid Earnings" },
  { value: "rate_drop", label: "Rate Drop" },
  { value: "other", label: "Other" },
];

const STATUS_STYLES: Record<GrievanceStatus, string> = {
  open: "bg-muted text-foreground border-border",
  escalated: "bg-foreground text-background border-transparent",
  resolved: "bg-secondary text-muted-foreground border-border",
};

const CATEGORY_LABELS: Record<GrievanceCategory, string> = {
  commission_change: "Commission Change",
  sudden_deactivation: "Deactivation",
  unpaid_earnings: "Unpaid Earnings",
  rate_drop: "Rate Drop",
  other: "Other",
  community_post: "Community Post",
};

export default function GrievancesPage() {
  const { user } = useAuth();
  const isAdvocate = user?.role === "advocate";

  const [tab, setTab] = React.useState("all");
  const [items, setItems] = React.useState<Grievance[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  const statusFilter: GrievanceStatus | undefined =
    tab === "all" ? undefined : (tab as GrievanceStatus);

  async function loadGrievances() {
    setLoading(true);
    setError(null);
    try {
      const res = await grievanceApi.list({
        status: statusFilter,
        page_size: 100,
      });
      // Exclude community posts from this page
      const filtered = res.items.filter((g) => g.category !== "community_post");
      setItems(filtered);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load grievances");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadGrievances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleUpvote(id: string) {
    try {
      const res = await grievanceApi.upvote(id);
      setItems((arr) =>
        arr.map((g) => (g.id === id ? { ...g, upvotes: res.upvotes } : g))
      );
    } catch {
      toast.error("Could not upvote. Please try again.");
    }
  }

  async function handlePatch(id: string, status: "escalated" | "resolved") {
    try {
      const updated = await grievanceApi.patch(id, { status });
      setItems((arr) => arr.map((g) => (g.id === id ? { ...g, ...updated } : g)));
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error("Update failed. Please try again.");
    }
  }

  function handleAdded(g: Grievance) {
    setItems((arr) => [g, ...arr]);
    setDialogOpen(false);
    toast.success("Grievance posted anonymously.");
  }

  const byStatus = (s: GrievanceStatus) => items.filter((g) => g.status === s);

  return (
    <div>
      <PageHeader
        title="Grievances"
        description={
          isAdvocate
            ? "Cluster, tag, and escalate complaints across platforms and zones."
            : "Speak up — and let advocates cluster patterns across the community."
        }
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus /> New grievance
                </Button>
              }
            />
            <NewGrievanceDialog
              onClose={() => setDialogOpen(false)}
              onAdd={handleAdded}
            />
          </Dialog>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="open">
            Open ({byStatus("open").length})
          </TabsTrigger>
          <TabsTrigger value="escalated">
            Escalated ({byStatus("escalated").length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({byStatus("resolved").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading && (
            <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading grievances…
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 py-12 justify-center text-destructive">
              <AlertCircle className="size-4" /> {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No grievances yet. Be the first to speak up.
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-3">
              {items.map((g, i) => (
                <FadeIn key={g.id} delay={i * 0.04}>
                  <Card>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-[auto_1fr_auto] gap-4">
                        <button
                          onClick={() => handleUpvote(g.id)}
                          className="flex flex-col items-center justify-start gap-1 rounded-md border border-border px-2.5 py-2 hover:bg-muted transition w-12"
                        >
                          <ChevronUp className="size-4" />
                          <span className="text-sm font-medium tabular-nums">
                            {g.upvotes}
                          </span>
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline">
                              {CATEGORY_LABELS[g.category] ?? g.category}
                            </Badge>
                            <Badge variant="outline">{g.platform}</Badge>
                            <Badge
                              variant="outline"
                              className={cn(STATUS_STYLES[g.status])}
                            >
                              {g.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              · {g.author_display} ·{" "}
                              {new Date(g.posted_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                            {g.description}
                          </p>
                          {g.tags.length > 0 && (
                            <div className="mt-2 flex gap-1 flex-wrap">
                              {g.tags.map((t) => (
                                <Badge
                                  key={t}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  #{t}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() =>
                              setDetailId(detailId === g.id ? null : g.id)
                            }
                            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                          >
                            <MessageSquare className="size-3" /> Comments
                          </button>
                        </div>
                        {isAdvocate && (
                          <div className="flex flex-col gap-2 items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePatch(g.id, "escalated")}
                              disabled={g.status === "escalated"}
                            >
                              <Flame /> Escalate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePatch(g.id, "resolved")}
                              disabled={g.status === "resolved"}
                            >
                              <CheckCircle2 /> Resolve
                            </Button>
                            <TagClusterButton
                              grievanceId={g.id}
                              currentTags={g.tags}
                              onTagged={(updated) =>
                                setItems((arr) =>
                                  arr.map((x) =>
                                    x.id === updated.id ? { ...x, ...updated } : x
                                  )
                                )
                              }
                            />
                          </div>
                        )}
                      </div>

                      {detailId === g.id && (
                        <GrievanceComments
                          grievanceId={g.id}
                          isAdvocate={isAdvocate}
                        />
                      )}
                    </CardContent>
                  </Card>
                </FadeIn>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {isAdvocate && <ClusterPanel />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New grievance dialog                                                */
/* ------------------------------------------------------------------ */

function NewGrievanceDialog({
  onAdd,
  onClose,
}: {
  onAdd: (g: Grievance) => void;
  onClose: () => void;
}) {
  const [platform, setPlatform] = React.useState("Careem");
  const [category, setCategory] =
    React.useState<GrievanceCategory>("commission_change");
  const [description, setDescription] = React.useState("");
  const [anonymous, setAnonymous] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const g = await grievanceApi.create({
        platform,
        category,
        description,
        anonymous,
      });
      onAdd(g);
      setDescription("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post grievance");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>File a grievance</DialogTitle>
        <DialogDescription>
          Posted anonymously by default. Advocates can cluster similar
          complaints to escalate them.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select
              value={platform}
              onValueChange={(v) => setPlatform(v ?? "")}
            >
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
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => v && setCategory(v as GrievanceCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            rows={5}
            placeholder="What happened, when, and how it affected your earnings."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="anon"
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="size-4"
          />
          <Label htmlFor="anon" className="cursor-pointer font-normal">
            Post anonymously
          </Label>
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
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Megaphone />
            )}
            Post
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/* ------------------------------------------------------------------ */
/* Tag / cluster button (advocate only)                               */
/* ------------------------------------------------------------------ */

function TagClusterButton({
  grievanceId,
  currentTags,
  onTagged,
}: {
  grievanceId: string;
  currentTags: string[];
  onTagged: (g: Grievance) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [tagInput, setTagInput] = React.useState(currentTags.join(", "));
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      const tags = tagInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const updated = await grievanceApi.patch(grievanceId, { tags });
      onTagged(updated);
      setOpen(false);
      toast.success("Tags saved.");
    } catch {
      toast.error("Failed to save tags.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm"><Tag /> Tag</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tag cluster</DialogTitle>
          <DialogDescription>
            Comma-separated tags, e.g. commission_spike, jan-2026
          </DialogDescription>
        </DialogHeader>
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="tag1, tag2"
        />
        <DialogFooter>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Tag />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Comments panel                                                      */
/* ------------------------------------------------------------------ */

function GrievanceComments({
  grievanceId,
  isAdvocate,
}: {
  grievanceId: string;
  isAdvocate: boolean;
}) {
  const [comments, setComments] = React.useState<GrievanceComment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    grievanceApi
      .get(grievanceId)
      .then((g) => setComments(g.comments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [grievanceId]);

  async function sendComment() {
    if (!body.trim()) return;
    setSending(true);
    try {
      const c = await grievanceApi.addComment(grievanceId, body.trim());
      setComments((cs) => [...cs, c]);
      setBody("");
    } catch {
      toast.error("Failed to post comment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-3">
      {loading && (
        <p className="text-xs text-muted-foreground">Loading comments…</p>
      )}
      {!loading && comments.length === 0 && (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2 text-sm">
          <span className="font-medium shrink-0">Advocate</span>
          <span className="text-muted-foreground">{c.body}</span>
        </div>
      ))}
      {isAdvocate && (
        <div className="flex gap-2 mt-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add an advocate note…"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendComment();
              }
            }}
          />
          <Button size="sm" onClick={sendComment} disabled={sending}>
            {sending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cluster panel (advocate only)                                       */
/* ------------------------------------------------------------------ */

function ClusterPanel() {
  const [clusters, setClusters] = React.useState<
    { cluster_id: string; platform: string; category: GrievanceCategory; count: number }[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    grievanceApi
      .getClusters()
      .then((res) => setClusters(res.clusters))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (clusters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Complaint clusters</CardTitle>
          <CardDescription>
            Grouped by platform + category with keyword overlap ≥ 0.3
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {clusters.map((cl) => (
            <div
              key={cl.cluster_id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline">{cl.platform}</Badge>
                <Badge variant="outline">
                  {CATEGORY_LABELS[cl.category] ?? cl.category}
                </Badge>
              </div>
              <Badge>{cl.count} complaints</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
