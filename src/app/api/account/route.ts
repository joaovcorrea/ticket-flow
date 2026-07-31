import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  idAgente: z.coerce.number().min(1),
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6).optional(),
  avatar: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  const data = schema.parse(await request.json());

  const existing = await prisma.atendente.findUnique({ where: { id: data.idAgente } });
  if (!existing) {
    return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {
    nome: data.nome,
    email: data.email,
  };

  if (data.senha) {
    updateData.senhaHash = await bcrypt.hash(data.senha, 10);
  }

  if (data.avatar !== undefined) {
    updateData.avatar = data.avatar || null;
  }

  const agent = await prisma.atendente.update({
    where: { id: data.idAgente },
    data: updateData,
  });

  return NextResponse.json({ id: agent.id, nome: agent.nome, email: agent.email, avatar: agent.avatar });
}
