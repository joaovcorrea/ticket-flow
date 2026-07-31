import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  cor: z.string().optional(),
  ativo: z.boolean().optional(),
});

export async function GET() {
  const departments = await prisma.departamento.findMany({
    include: {
      _count: { select: { atendentes: true, chamados: true } },
      politicasSla: true,
    },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(departments);
}

export async function POST(request: NextRequest) {
  const data = schema.parse(await request.json());
  const department = await prisma.departamento.create({
    data: {
      nome: data.nome,
      descricao: data.descricao,
      cor: data.cor || "#3B82F6",
      ativo: data.ativo ?? true,
    },
  });
  return NextResponse.json(department, { status: 201 });
}
