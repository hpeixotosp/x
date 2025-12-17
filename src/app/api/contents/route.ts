import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ContentSchema = z.object({
  topicId: z.number().int(),
  text: z.string().min(1),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  const contents = await prisma.content.findMany({
    include: { topic: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contents);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const parsed = ContentSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { topicId, text, active } = parsed.data;

  const created = await prisma.content.create({
    data: { topicId, text, active },
  });
  return NextResponse.json(created, { status: 201 });
}