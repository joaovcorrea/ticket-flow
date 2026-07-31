import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { subDays } from "date-fns";

const schema = z.object({
  nome: z.string().min(1),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]),
  minutosPrimeiraResposta: z.number().int().positive(),
  minutosResolucao: z.number().int().positive(),
  idDepartamento: z.coerce.number().nullable().optional(),
});

export async function GET() {
  const policies = await prisma.politicaSla.findMany({
    include: { departamento: true },
    orderBy: [{ idDepartamento: "asc" }, { prioridade: "asc" }],
  });

  const since = subDays(new Date(), 30);
  const departments = await prisma.departamento.findMany({
    include: { _count: { select: { chamados: true } } },
    orderBy: { nome: "asc" },
  });

  const resolvedTickets = await prisma.chamado.findMany({
    where: {
      resolvidoEm: { gte: since },
      idDepartamento: { not: null },
    },
    include: { departamento: true },
  });

  const metrics = departments.map((department) => {
    const tickets = resolvedTickets.filter((ticket) => ticket.idDepartamento === department.id);
    const total = tickets.length;
    const met = tickets.filter((ticket) => ticket.statusSla === "CUMPRIDO").length;
    const breached = tickets.filter((ticket) => ticket.statusSla === "ESTOURADO").length;
    const compliance = total > 0 ? Math.round((met / total) * 100) : 100;

    return {
      id: department.id,
      nome: department.nome,
      total,
      met,
      breached,
      compliance,
    };
  });

  return NextResponse.json({ policies, metrics, since });
}

export async function POST(request: NextRequest) {
  const data = schema.parse(await request.json());
  const policy = await prisma.politicaSla.create({ data });
  return NextResponse.json(policy, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...rest } = body;
  const data = schema.partial().parse(rest);

  const policy = await prisma.politicaSla.update({
    where: { id: Number(id) },
    data,
    include: { departamento: true },
  });
  return NextResponse.json(policy);
}
