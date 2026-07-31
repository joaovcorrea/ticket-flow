import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6).optional(),
  papel: z.enum(["ADMIN", "SUPERVISOR", "ATENDENTE"]).default("ATENDENTE"),
  idDepartamento: z.coerce.number().nullable().optional().transform((value) => (value === 0 ? undefined : value)),
  ativo: z.boolean().optional(),
});

export async function GET() {
  const agents = await prisma.atendente.findMany({
    include: {
      departamento: true,
      _count: { select: { chamadosAtribuidos: true, registrosPontos: true } },
    },
    orderBy: { pontosTotais: "desc" },
  });

  const sanitized = agents.map(({ senhaHash, ...agent }) => agent);
  return NextResponse.json(sanitized);
}

export async function POST(request: NextRequest) {
  const data = schema.parse(await request.json());
  const idDepartamento = data.idDepartamento ? data.idDepartamento : undefined;
  const senhaHash = await bcrypt.hash(data.senha || "123456", 10);

  if (idDepartamento) {
    const departmentExists = await prisma.departamento.findUnique({ where: { id: idDepartamento } });
    if (!departmentExists) {
      return NextResponse.json({ error: "Departamento inválido." }, { status: 400 });
    }
  }

  const agent = await prisma.atendente.create({
    data: {
      nome: data.nome,
      email: data.email,
      senhaHash,
      papel: data.papel,
      idDepartamento,
      ativo: data.ativo ?? true,
    },
    include: { departamento: true },
  });

  const { senhaHash: _, ...sanitized } = agent;
  return NextResponse.json(sanitized, { status: 201 });
}
