"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Removed shadcn Select and using native <select> to ensure form submissions include values

type Topic = { id: number; name: string; description?: string };

type Content = { id: number; text: string; topicId: number; active: boolean };

type Schedule = {
  id: number;
  topicId: number;
  frequencyCron: string;
  mentionHandle: string;
  isActive: boolean;
};

export default function Page() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [t, c, s, p] = await Promise.all([
      fetch("/api/topics").then((r) => r.json()),
      fetch("/api/contents").then((r) => r.json()),
      fetch("/api/schedules").then((r) => r.json()),
      fetch("/api/posts").then((r) => r.json()),
    ]);
    setTopics(t);
    setContents(c);
    setSchedules(s);
    setPosts(p);
  }

  async function createTopic(formData: FormData) {
    const name = String(formData.get("name") || "");
    const description = String(formData.get("description") || "");
    await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    await loadAll();
  }

  async function createContent(formData: FormData) {
    const topicId = Number(formData.get("topicId"));
    const text = String(formData.get("text") || "");
    await fetch("/api/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, text, active: true }),
    });
    await loadAll();
  }

  async function createSchedule(formData: FormData) {
    const topicId = Number(formData.get("topicId"));
    const frequencyCron = String(formData.get("frequencyCron") || "");
    const mentionHandle = String(formData.get("mentionHandle") || "");
    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, frequencyCron, mentionHandle, isActive: true }),
    });
    await loadAll();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action={createTopic}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. AI News" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Optional" />
            </div>
            <Button type="submit">Create Topic</Button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topics.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action={createContent}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
          >
            <div>
              <Label htmlFor="topicId">Topic</Label>
              <select
                id="topicId"
                name="topicId"
                className="border h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="text">Text</Label>
              <Textarea id="text" name="text" placeholder="Write the tweet body..." />
            </div>
            <Button type="submit">Create Content</Button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contents.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-sm">Content #{c.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs whitespace-pre-wrap">{c.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action={createSchedule}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          >
            <div>
              <Label htmlFor="topicId">Topic</Label>
              <select
                id="topicId"
                name="topicId"
                className="border h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="frequencyCron">Cron</Label>
              <Input id="frequencyCron" name="frequencyCron" placeholder="*/30 * * * *" />
            </div>
            <div>
              <Label htmlFor="mentionHandle">@Mention</Label>
              <Input id="mentionHandle" name="mentionHandle" placeholder="@yourfriend" />
            </div>
            <Button type="submit">Create Schedule</Button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {schedules.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="text-sm">Schedule #{s.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs">Topic: {topics.find((t) => t.id === s.topicId)?.name}</p>
                  <p className="text-xs">Cron: {s.frequencyCron}</p>
                  <p className="text-xs">Mention: {s.mentionHandle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {posts.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-sm">Post #{p.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs">Status: {p.status}</p>
                  <p className="text-xs">Created: {new Date(p.createdAt).toLocaleString()}</p>
                  {p.postedAt && (
                    <p className="text-xs">Posted: {new Date(p.postedAt).toLocaleString()}</p>
                  )}
                  {p.error && <p className="text-xs text-red-500">Error: {p.error}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
