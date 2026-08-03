import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { applySlaToTicket } from "@/lib/sla";
import { createWithUniqueNumeroChamado } from "@/lib/tickets";

const createTicketSchema = z.object({
  assunto: z.string().min(1),
  descricao: z.string().min(1),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).default("MEDIA"),
  origem: z.enum(["WHATSAPP", "WEB", "EMAIL", "TELEFONE"]).default("WEB"),
  nomeSolicitante: z.string().min(1),
  telefoneSolicitante: z.string().optional(),
  emailSolicitante: z.string().email().optional().or(z.literal("")),
  idDepartamento: z.coerce.number().optional(),
  idAgenteResponsavel: z.coerce.number().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const idDepartamento = searchParams.get("idDepartamento");
  const idAgenteResponsavel = searchParams.get("idAgenteResponsavel");
  const search = searchParams.get("search");

  const tickets = await prisma.chamado.findMany({
    where: {
      ...(status && { status: status as never }),
      ...(idDepartamento && { idDepartamento: Number(idDepartamento) }),
      ...(idAgenteResponsavel && { idAgenteResponsavel: Number(idAgenteResponsavel) }),
      ...(search && {
        OR: [
          { assunto: { contains: search } },
          { nomeSolicitante: { contains: search } },
          { telefoneSolicitante: { contains: search } },
        ],
      }),
    },
    include: {
      departamento: true,
      atendenteResponsavel: true,
      _count: { select: { mensagens: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = createTicketSchema.parse(body);

  const ticket = await createWithUniqueNumeroChamado(async (numeroChamado) =>
    prisma.chamado.create({
      data: {
        ...data,
        numeroChamado,
        emailSolicitante: data.emailSolicitante || undefined,
        historico: {
          create: { acao: "Ticket Criado", detalhes: "Ticket criado manualmente" },
        },
      },
      include: { departamento: true, atendenteResponsavel: true },
    })
  );

  await applySlaToTicket(ticket.id, ticket.prioridade, ticket.idDepartamento);

  return NextResponse.json(ticket, { status: 201 });
}
