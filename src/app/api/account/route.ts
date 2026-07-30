import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  agentId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  avatar: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  const data = schema.parse(await request.json());

  const existing = await prisma.agent.findUnique({ where: { id: data.agentId } });
  if (!existing) {
    return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {
    name: data.name,
    email: data.email,
  };

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  if (data.avatar !== undefined) {
    updateData.avatar = data.avatar || null;
  }

  const agent = await prisma.agent.update({
    where: { id: data.agentId },
    data: updateData,
  });

  return NextResponse.json({ id: agent.id, name: agent.name, email: agent.email, avatar: agent.avatar });
}
