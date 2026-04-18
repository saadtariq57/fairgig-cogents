"use client";

import * as React from "react";
import { Send, Heart, MessageCircle, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { toast } from "sonner";

type Post = {
  id: string;
  worker: string;
  tag: "rate intel" | "support" | "complaint" | "tip";
  body: string;
  ago: string;
  likes: number;
  comments: number;
};

const SEED: Post[] = [
  {
    id: "p1",
    worker: "anon-7421",
    tag: "rate intel",
    body: "Foodpanda Lahore — peak hour bonus has been quietly removed for the 2-4pm window starting this week. Watch your effective hourly.",
    ago: "1h ago",
    likes: 32,
    comments: 8,
  },
  {
    id: "p2",
    worker: "anon-3110",
    tag: "support",
    body: "Anyone else’s Careem account showing as ‘under review’ today? Going on day 2 — losing income.",
    ago: "3h ago",
    likes: 14,
    comments: 21,
  },
  {
    id: "p3",
    worker: "anon-9988",
    tag: "tip",
    body: "Pro tip: log the trip number from the in-app screen — verifiers approve faster when the screenshot has it.",
    ago: "5h ago",
    likes: 87,
    comments: 4,
  },
  {
    id: "p4",
    worker: "anon-2210",
    tag: "complaint",
    body: "DHA night shifts feel less safe this month. Two riders I know reported being stopped. Stay aware.",
    ago: "yesterday",
    likes: 64,
    comments: 18,
  },
];

const TAG_STYLES: Record<Post["tag"], string> = {
  "rate intel": "bg-foreground text-background border-transparent",
  support: "bg-muted text-foreground border-border",
  complaint: "bg-destructive/10 text-destructive border-transparent",
  tip: "bg-secondary text-foreground border-border",
};

export default function CommunityPage() {
  const [posts, setPosts] = React.useState<Post[]>(SEED);
  const [body, setBody] = React.useState("");

  function post() {
    if (!body.trim()) return;
    setPosts([
      {
        id: `p_${Date.now()}`,
        worker: `anon-${Math.floor(Math.random() * 9000 + 1000)}`,
        tag: "tip",
        body,
        ago: "just now",
        likes: 1,
        comments: 0,
      },
      ...posts,
    ]);
    setBody("");
    toast.success("Posted to the community.");
  }

  function like(id: string) {
    setPosts((arr) =>
      arr.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  }

  return (
    <div>
      <PageHeader
        title="Community"
        description="Anonymous bulletin board for rate intel, complaints and mutual support. Moderated by advocates."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="size-3" /> 2,184 active this week
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
        <div className="space-y-3">
          <FadeIn>
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-[10px] bg-foreground text-background">
                      AR
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    <Textarea
                      placeholder="Share rate intel, ask for help, or post a tip…"
                      rows={3}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Posted as <span className="font-medium">anon-7821</span>
                      </p>
                      <Button onClick={post} size="sm">
                        <Send /> Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <Stagger className="space-y-3">
            {posts.map((p) => (
              <StaggerItem key={p.id}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-[10px]">
                          {p.worker.slice(-2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {p.worker}
                          </span>
                          <Badge
                            variant="outline"
                            className={TAG_STYLES[p.tag]}
                          >
                            {p.tag}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            · {p.ago}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed">{p.body}</p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <button
                            onClick={() => like(p.id)}
                            className="inline-flex items-center gap-1.5 hover:text-foreground transition"
                          >
                            <Heart className="size-3.5" /> {p.likes}
                          </button>
                          <span className="inline-flex items-center gap-1.5">
                            <MessageCircle className="size-3.5" /> {p.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <FadeIn delay={0.05}>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Trending tags</CardTitle>
              <CardDescription>What the community is talking about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { tag: "Foodpanda commission", count: 47 },
                { tag: "Careem deactivation",  count: 31 },
                { tag: "Bykea late payout",    count: 22 },
                { tag: "Night shift safety",   count: 18 },
                { tag: "Indrive base fare",    count: 12 },
              ].map((t) => (
                <div
                  key={t.tag}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 hover:bg-muted transition cursor-pointer"
                >
                  <span className="text-sm">#{t.tag}</span>
                  <Badge variant="secondary">{t.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
