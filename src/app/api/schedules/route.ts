import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { registerScheduler } from "@/server/scheduler";

const ScheduleSchema = z.object({
  topicId: z.number().int(),
  frequencyCron: z.string(),
  mentionHandle: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  const schedules = await prisma.schedule.findMany({
    include: { topic: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const parsed = ScheduleSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { topicId, frequencyCron } = parsed.data;
  const envMention = (process.env.X_DEFAULT_MENTION || process.env.X_MENTION_HANDLE || "").trim();
  const mentionHandle = (parsed.data.mentionHandle || "").trim() || envMention;
  const isActive = parsed.data.isActive;

  const created = await prisma.schedule.create({
    data: { topicId, frequencyCron, mentionHandle, isActive },
  });

  // Auto-gerar conteúdo se não existir um conteúdo ativo para o tópico
  const existing = await prisma.content.findFirst({
    where: { topicId, active: true },
    orderBy: { createdAt: "desc" },
  });
  if (!existing) {
    const now = new Date();
    const text = `Assunto: ${await prisma.topic.findUnique({ where: { id: topicId }, select: { name: true } })
      .then(r => r?.name || "Tópico")}\n\nAtualizações e insights. (${now.toLocaleDateString()} ${now.toLocaleTimeString()})`;
    await prisma.content.create({
      data: { topicId, text, active: true },
    });
  }

  // Registrar o novo agendamento
  await registerScheduler();

  return NextResponse.json(created, { status: 201 });
}