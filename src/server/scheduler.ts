import "server-only";
import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { TwitterApi } from "twitter-api-v2";

// Keep track of scheduled jobs to avoid duplicates
const jobs = new Map<number, cron.ScheduledTask>();

async function runSchedule(schedule: {
  id: number;
  topicId: number;
  mentionHandle: string | null;
}) {
  // Select an active, most recent content for the topic
  const content = await prisma.content.findFirst({
    where: { topicId: schedule.topicId, active: true },
    orderBy: { createdAt: "desc" },
  });
  if (!content) return;

  const mention = schedule.mentionHandle?.trim() || "";
  const text = `${content.text}${mention ? `\n\n${mention}` : ""}`;

  const APP_KEY = process.env.X_APP_KEY || "";
  const APP_SECRET = process.env.X_APP_SECRET || "";
  const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN || "";
  const ACCESS_SECRET = process.env.X_ACCESS_SECRET || "";

  // If credentials are missing, don't attempt to post, just log FAILED
  const missingCreds = [APP_KEY, APP_SECRET, ACCESS_TOKEN, ACCESS_SECRET].some(
    (v) => !v
  );

  if (missingCreds) {
    await prisma.post.create({
      data: {
        scheduleId: schedule.id,
        contentId: content.id,
        status: "FAILED",
        error: "Missing X credentials",
      },
    });
    return;
  }

  const client = new TwitterApi({
    appKey: APP_KEY,
    appSecret: APP_SECRET,
    accessToken: ACCESS_TOKEN,
    accessSecret: ACCESS_SECRET,
  });

  try {
    const r = await client.v2.tweet(text);
    await prisma.post.create({
      data: {
        scheduleId: schedule.id,
        contentId: content.id,
        status: "SUCCESS",
        postedAt: new Date(),
      },
    });
  } catch (error: any) {
    await prisma.post.create({
      data: {
        scheduleId: schedule.id,
        contentId: content.id,
        status: "FAILED",
        error: String(error?.message ?? error),
      },
    });
  }
}

export async function registerScheduler() {
  // Load active schedules and register a cron job for each using its frequencyCron
  const schedules = await prisma.schedule.findMany({
    where: { isActive: true },
    select: { id: true, topicId: true, frequencyCron: true, mentionHandle: true },
  });

  for (const schedule of schedules) {
    if (jobs.has(schedule.id)) continue;

    // Validate cron expression; if invalid, skip and record failure once
    const isValid = cron.validate(schedule.frequencyCron);
    if (!isValid) {
      await prisma.post.create({
        data: {
          scheduleId: schedule.id,
          contentId: (await prisma.content.findFirst({
            where: { topicId: schedule.topicId, active: true },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          }))?.id ?? undefined,
          status: "FAILED",
          error: `Invalid cron expression: ${schedule.frequencyCron}`,
        },
      });
      continue;
    }

    const task = cron.schedule(schedule.frequencyCron, () => runSchedule(schedule));
    jobs.set(schedule.id, task);
  }
}