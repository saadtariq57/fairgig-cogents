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
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { FadeIn } from "@/components/motion";
import { mockGrievances, PLATFORMS, type Grievance } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRole } from "@/components/app-shell";

const STATUS_STYLES: Record<Grievance["status"], string> = {
  open: "bg-muted text-foreground border-border",
  escalated: "bg-foreground text-background border-transparent",
  resolved: "bg-secondary text-muted-foreground border-border",
};

export default function GrievancesPage() {
  const [items, setItems] = React.useState<Grievance[]>(mockGrievances);
  const [tab, setTab] = React.useState("all");
  const [open, setOpen] = React.useState(false);
  const { role } = useRole();
  const isAdvocate = role === "advocate";

  const filtered =
    tab === "all" ? items : items.filter((g) => g.status === tab);

  function upvote(id: string) {
    setItems((arr) =>
      arr.map((g) => (g.id === id ? { ...g, upvotes: g.upvotes + 1 } : g))
    );
  }

  function setStatus(id: string, status: Grievance["status"]) {
    setItems((arr) => arr.map((g) => (g.id === id ? { ...g, status } : g)));
    toast.success(`Marked ${status}`);
  }

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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus /> New grievance
                </Button>
              }
            />
            <NewGrievanceDialog
              onClose={() => setOpen(false)}
              onAdd={(g) => {
                setItems([g, ...items]);
                setOpen(false);
                toast.success("Grievance posted anonymously.");
              }}
            />
          </Dialog>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="open">
            Open ({items.filter((g) => g.status === "open").length})
          </TabsTrigger>
          <TabsTrigger value="escalated">
            Escalated ({items.filter((g) => g.status === "escalated").length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({items.filter((g) => g.status === "resolved").length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <div className="grid gap-3">
            {filtered.map((g, i) => (
              <FadeIn key={g.id} delay={i * 0.04}>
                <Card>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-4">
                      <button
                        onClick={() => upvote(g.id)}
                        className="flex flex-col items-center justify-start gap-1 rounded-md border border-border px-2.5 py-2 hover:bg-muted transition w-12"
                      >
                        <ChevronUp className="size-4" />
                        <span className="text-sm font-medium tabular-nums">
                          {g.upvotes}
                        </span>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline">{g.category}</Badge>
                          <Badge variant="outline">{g.platform}</Badge>
                          <Badge
                            variant="outline"
                            className={cn(STATUS_STYLES[g.status])}
                          >
                            {g.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            · posted by {g.worker} · {g.date}
                          </span>
                        </div>
                        <h3 className="font-heading text-base lg:text-lg tracking-tight">
                          {g.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                          {g.description}
                        </p>
                      </div>
                      {isAdvocate && (
                        <div className="flex flex-col gap-2 items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStatus(g.id, "escalated")}
                          >
                            <Flame /> Escalate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStatus(g.id, "resolved")}
                          >
                            <CheckCircle2 /> Resolve
                          </Button>
                          <Button variant="outline" size="sm">
                            <Tag /> Tag cluster
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NewGrievanceDialog({
  onAdd,
  onClose,
}: {
  onAdd: (g: Grievance) => void;
  onClose: () => void;
}) {
  const [platform, setPlatform] = React.useState("Careem");
  const [category, setCategory] = React.useState<Grievance["category"]>("Commission Hike");
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      id: `g_${Date.now()}`,
      worker: `anon-${Math.floor(Math.random() * 9000 + 1000)}`,
      platform: platform as Grievance["platform"],
      category,
      title,
      description: desc,
      date: new Date().toISOString().slice(0, 10),
      status: "open",
      upvotes: 1,
    });
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>File a grievance</DialogTitle>
        <DialogDescription>
          Posted anonymously. Advocates can cluster similar complaints to
          escalate them.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
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
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Grievance["category"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Commission Hike",
                  "Deactivation",
                  "Late Payout",
                  "Safety",
                  "Other",
                ].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t">Title</Label>
          <Input
            id="t"
            placeholder="e.g. Commission jumped 4% with no notice"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d">Description</Label>
          <Textarea
            id="d"
            rows={5}
            placeholder="What happened, when, and how it affected your earnings."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
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
          <Button type="submit">
            <Megaphone /> Post anonymously
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
