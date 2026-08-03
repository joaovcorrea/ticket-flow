import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { applySlaToTicket, processTicketResolution, awardPoints, POINT_VALUES } from "@/lib/sla";
import { sendWhatsAppReply } from "@/lib/whatsapp";
import { MotivoPontos } from "@prisma/client";

const updateSchema = z.object({
  assunto: z.string().optional(),
  descricao: z.string().optional(),
  status: z.enum(["ABERTO", "PENDENTE", "EM_ANDAMENTO", "REABERTO", "RESOLVIDO", "FECHADO"]).optional(),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  idDepartamento: z.coerce.number().nullable().optional(),
  idAgenteResponsavel: z.coerce.number().nullable().optional(),
  mensagem: z.string().optional(),
  idAgente: z.coerce.number().optional(),
  interno: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await prisma.chamado.findUnique({
    where: { id: Number(id) },
    include: {
      departamento: true,
      atendenteResponsavel: true,
      mensagens: {
        include: { atendente: true },
        orderBy: { criadoEm: "asc" },
      },
      historico: {
        include: { atendente: true },
        orderBy: { criadoEm: "desc" },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idChamado = Number(id);
  const body = await request.json();
  const data = updateSchema.parse(body);

  const existing = await prisma.chamado.findUnique({ where: { id: idChamado } });
  if (!existing) return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  const auditChanges: string[] = [];

  if (data.assunto) updateData.assunto = data.assunto;
  if (data.descricao) updateData.descricao = data.descricao;
  if (data.status) {
    updateData.status = data.status;
    if (data.status === "RESOLVIDO" && !existing.resolvidoEm) {
      updateData.resolvidoEm = new Date();
    }
    if (data.status === "FECHADO" && !existing.fechadoEm) {
      updateData.fechadoEm = new Date();
    }
    if (data.status === "REABERTO" && !existing.reabertoEm) {
      updateData.reabertoEm = new Date();
    }
    auditChanges.push(`status:${data.status}`);
  }
  if (data.prioridade && data.prioridade !== existing.prioridade) {
    updateData.prioridade = data.prioridade;
    await applySlaToTicket(idChamado, data.prioridade, data.idDepartamento ?? existing.idDepartamento);
    auditChanges.push(`prioridade:${data.prioridade}`);
  }
  if (data.idDepartamento !== undefined && data.idDepartamento !== existing.idDepartamento) {
    updateData.idDepartamento = data.idDepartamento;
    auditChanges.push(`departamento:${data.idDepartamento || "none"}`);
  }
  if (data.idAgenteResponsavel !== undefined && data.idAgenteResponsavel !== existing.idAgenteResponsavel) {
    updateData.idAgenteResponsavel = data.idAgenteResponsavel;
    auditChanges.push(`agente:${data.idAgenteResponsavel || "none"}`);
  }

  const ticket = await prisma.chamado.update({
    where: { id: idChamado },
    data: updateData,
    include: { departamento: true, atendenteResponsavel: true },
  });

  if (data.status === "RESOLVIDO" && data.idAgente) {
    await processTicketResolution(idChamado, data.idAgente);
  }

  if (data.mensagem) {
    await prisma.mensagemTicket.create({
      data: {
        idChamado,
        conteudo: data.mensagem,
        doAgente: true,
        interno: data.interno ?? false,
        idAgente: data.idAgente,
      },
    });

    await prisma.ticketHistorico.create({
      data: {
        idChamado,
        idAgente: data.idAgente,
        acao: data.interno ? "Nota Interna Adicionada" : "Resposta Enviada",
        detalhes: data.mensagem,
      },
    });

    if (!data.interno && existing.telefoneSolicitante && data.mensagem) {
      try {
        await sendWhatsAppReply(existing.telefoneSolicitante, data.mensagem);
      } catch (e) {
        console.error("[WhatsApp] Falha ao enviar resposta:", e);
      }
    }

    if (data.idAgente && !existing.primeiraRespostaEm) {
      await prisma.chamado.update({
        where: { id: idChamado },
        data: { primeiraRespostaEm: new Date() },
      });
      await awardPoints(
        data.idAgente,
        POINT_VALUES.PRIMEIRA_RESPOSTA,
        MotivoPontos.PRIMEIRA_RESPOSTA,
        idChamado
      );
    }
  }

  if (auditChanges.length > 0) {
    await prisma.ticketHistorico.create({
      data: {
        idChamado,
        idAgente: data.idAgente,
        acao: "Auditoria de Ticket",
        detalhes: JSON.stringify({ changes: auditChanges }),
      },
    });
  }

  return NextResponse.json(ticket);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.chamado.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
