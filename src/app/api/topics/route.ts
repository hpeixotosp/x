import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TopicSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET() {
  const topics = await prisma.topic.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(topics);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const parsed = TopicSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { name, description } = parsed.data;
  const created = await prisma.topic.create({
    data: { name, description },
  });

  // Auto-criar conteúdo padrão
  const baseText = `Assunto: ${name}\n\n${description ?? "Atualizações e insights."}`;
  await prisma.content.create({
    data: { topicId: created.id, text: baseText, active: true },
  });

  return NextResponse.json(created, { status: 201 });
}