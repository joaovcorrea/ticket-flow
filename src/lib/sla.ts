import { PrioridadeChamado, StatusSla, MotivoPontos } from "@prisma/client";
import { prisma } from "./prisma";
import { addMinutes, isBefore } from "date-fns";

export async function getSlaPolicy(
  prioridade: PrioridadeChamado,
  idDepartamento?: number | null
) {
  if (idDepartamento) {
    const deptPolicy = await prisma.politicaSla.findUnique({
      where: { idDepartamento_prioridade: { idDepartamento, prioridade } },
    });
    if (deptPolicy) return deptPolicy;
  }

  return prisma.politicaSla.findFirst({
    where: { idDepartamento: null, prioridade, ativo: true },
  });
}

export async function applySlaToTicket(
  idChamado: number,
  prioridade: PrioridadeChamado,
  idDepartamento?: number | null
) {
  const policy = await getSlaPolicy(prioridade, idDepartamento);
  if (!policy) return;

  const now = new Date();
  await prisma.chamado.update({
    where: { id: idChamado },
    data: {
      primeiraRespostaVencimentoEm: addMinutes(now, policy.minutosPrimeiraResposta),
      slaVencimentoEm: addMinutes(now, policy.minutosResolucao),
      statusSla: StatusSla.NO_PRAZO,
    },
  });
}

export function computeSlaStatus(
  slaVencimentoEm: Date | null,
  resolvidoEm: Date | null,
  statusSlaAtual: StatusSla
): StatusSla {
  if (resolvidoEm && slaVencimentoEm) {
    return isBefore(resolvidoEm, slaVencimentoEm) ? StatusSla.CUMPRIDO : StatusSla.ESTOURADO;
  }
  if (!slaVencimentoEm) return statusSlaAtual;

  const now = new Date();
  if (isBefore(now, slaVencimentoEm)) {
    const remaining = slaVencimentoEm.getTime() - now.getTime();
    const total = slaVencimentoEm.getTime() - (slaVencimentoEm.getTime() - remaining);
    const percentRemaining = remaining / (total || 1);
    return percentRemaining < 0.25 ? StatusSla.EM_RISCO : StatusSla.NO_PRAZO;
  }
  return StatusSla.ESTOURADO;
}

export async function awardPoints(
  idAgente: number,
  pontos: number,
  motivo: MotivoPontos,
  idChamado?: number,
  observacao?: string
) {
  await prisma.$transaction([
    prisma.registroPontos.create({
      data: { idAgente, pontos, motivo, idChamado, observacao },
    }),
    prisma.atendente.update({
      where: { id: idAgente },
      data: { pontosTotais: { increment: pontos } },
    }),
  ]);
}

export const POINT_VALUES: Record<MotivoPontos, number> = {
  CHAMADO_RESOLVIDO: 10,
  SLA_CUMPRIDO: 5,
  PRIMEIRA_RESPOSTA: 3,
  SATISFACAO_CLIENTE: 8,
  BONUS: 0,
  PENALIDADE: 0,
};

export async function processTicketResolution(idChamado: number, idAgente: number) {
  const chamado = await prisma.chamado.findUnique({ where: { id: idChamado } });
  if (!chamado || !chamado.resolvidoEm) return;

  await awardPoints(
    idAgente,
    POINT_VALUES.CHAMADO_RESOLVIDO,
    MotivoPontos.CHAMADO_RESOLVIDO,
    idChamado
  );

  if (chamado.slaVencimentoEm && isBefore(chamado.resolvidoEm, chamado.slaVencimentoEm)) {
    await awardPoints(
      idAgente,
      POINT_VALUES.SLA_CUMPRIDO,
      MotivoPontos.SLA_CUMPRIDO,
      idChamado
    );
    await prisma.chamado.update({
      where: { id: idChamado },
      data: { statusSla: StatusSla.CUMPRIDO },
    });
  } else if (chamado.slaVencimentoEm) {
    await prisma.chamado.update({
      where: { id: idChamado },
      data: { statusSla: StatusSla.ESTOURADO },
    });
  }
}
