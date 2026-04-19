"use client";

import * as React from "react";
import { Send, Heart, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { toast } from "sonner";
import { grievanceApi, type Grievance } from "@/lib/api";

function grievanceToPost(g: Grievance) {
  return {
    id: g.id,
    worker: g.author_display,
    body: g.description,
    ago: relativeTime(g.posted_at),
    likes: g.upvotes,
    platform: g.platform,
  };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommunityPage() {
  const [posts, setPosts] = React.useState<ReturnType<typeof grievanceToPost>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [body, setBody] = React.useState("");
  const [posting, setPosting] = React.useState(false);

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
      const res = await grievanceApi.list({
        category: "community_post",
        page_size: 100,
      });
      setPosts(res.items.map(grievanceToPost));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadPosts();
  }, []);

  async function post() {
    if (!body.trim()) return;
    setPosting(true);
    try {
      const g = await grievanceApi.create({
        platform: "General",
        category: "community_post",
        description: body.trim(),
        anonymous: true,
      });
      setPosts((prev) => [grievanceToPost(g), ...prev]);
      setBody("");
      toast.success("Posted to the community.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post.");
    } finally {
      setPosting(false);
    }
  }

  async function like(id: string) {
    try {
      const res = await grievanceApi.upvote(id);
      setPosts((arr) =>
        arr.map((p) => (p.id === id ? { ...p, likes: res.upvotes } : p))
      );
    } catch {
      setPosts((arr) =>
        arr.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
      );
    }
  }

  const trending = React.useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (p.platform && p.platform !== "General") {
        counts[p.platform] = (counts[p.platform] ?? 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([platform, count]) => ({ platform, count }));
  }, [posts]);

  return (
    <div>
      <PageHeader
        title="Community"
        description="Anonymous bulletin board for rate intel, complaints and mutual support. Moderated by advocates."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="size-3" /> {posts.length} posts
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
        <div className="space-y-3">
          {/* Compose */}
          <FadeIn>
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-[10px] bg-foreground text-background">
                      AN
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
                        as <span className="font-medium">Anonymous</span>
                      </p>
                      <Button
                        onClick={post}
                        size="sm"
                        disabled={posting || !body.trim()}
                      >
                        {posting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send />
                        )}
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Feed */}
          {loading && (
            <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading posts…
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 py-12 justify-center text-destructive">
              <AlertCircle className="size-4" /> {error}
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No posts yet. Share something with the community!
            </div>
          )}

          {!loading && !error && (
            <Stagger className="space-y-3">
              {posts.map((p) => (
                <StaggerItem key={p.id}>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="text-[10px]">
                            {p.worker.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {p.worker}
                            </span>
                            {p.platform && p.platform !== "General" && (
                              <Badge variant="outline" className="text-xs">
                                {p.platform}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              · {p.ago}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed">
                            {p.body}
                          </p>
                          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <button
                              onClick={() => like(p.id)}
                              className="inline-flex items-center gap-1.5 hover:text-foreground transition"
                            >
                              <Heart className="size-3.5" /> {p.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>

        {/* Sidebar */}
        <FadeIn delay={0.05}>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Active platforms</CardTitle>
              <CardDescription>
                Most discussed platforms this session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {trending.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
              {trending.map((t) => (
                <div
                  key={t.platform}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 hover:bg-muted transition cursor-pointer"
                >
                  <span className="text-sm">#{t.platform}</span>
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
