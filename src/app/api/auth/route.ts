import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});

export async function POST(request: NextRequest) {
  const data = loginSchema.parse(await request.json());

  const agent = await prisma.atendente.findUnique({ where: { email: data.email } });
  if (!agent) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const isValid = await bcrypt.compare(data.senha, agent.senhaHash);
  if (!isValid) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const { senhaHash, ...sanitized } = agent;
  return NextResponse.json(sanitized);
}
