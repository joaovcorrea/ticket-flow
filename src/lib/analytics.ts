import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";

export async function getDashboardStats() {
  const today = new Date();
  const weekAgo = subDays(today, 7);

  const [
    openTickets,
    inProgressTickets,
    resolvedToday,
    resolvedWeek,
    slaBreached,
    slaMet,
    totalAgents,
    topAgents,
    byDepartment,
    byStatus,
    recentTickets,
  ] = await Promise.all([
    prisma.chamado.count({
      where: { status: { in: ["ABERTO", "PENDENTE"] } },
    }),
    prisma.chamado.count({ where: { status: "EM_ANDAMENTO" } }),
    prisma.chamado.count({
      where: {
        resolvidoEm: { gte: startOfDay(today), lte: endOfDay(today) },
      },
    }),
    prisma.chamado.count({
      where: { resolvidoEm: { gte: weekAgo } },
    }),
    prisma.chamado.count({ where: { statusSla: "ESTOURADO" } }),
    prisma.chamado.count({ where: { statusSla: "CUMPRIDO" } }),
    prisma.atendente.count({ where: { ativo: true } }),
    prisma.atendente.findMany({
      where: { ativo: true },
      orderBy: { pontosTotais: "desc" },
      take: 5,
      include: { departamento: true },
    }),
    prisma.departamento.findMany({
      where: { ativo: true },
      include: {
        _count: { select: { chamados: true, atendentes: true } },
      },
    }),
    prisma.chamado.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.chamado.findMany({
      orderBy: { criadoEm: "desc" },
      take: 8,
      include: { departamento: true, atendenteResponsavel: true },
    }),
  ]);

  const slaTotal = slaBreached + slaMet;
  const slaCompliance = slaTotal > 0 ? Math.round((slaMet / slaTotal) * 100) : 100;

  return {
    openTickets,
    inProgressTickets,
    resolvedToday,
    resolvedWeek,
    slaBreached,
    slaCompliance,
    totalAgents,
    topAgents,
    byDepartment,
    byStatus,
    recentTickets,
  };
}

export async function getReportData(days = 30) {
  const since = subDays(new Date(), days);

  const [resolvedByAgent, resolvedByDepartment, byPriority, bySource, timeline] =
    await Promise.all([
      prisma.atendente.findMany({
        where: { ativo: true },
        include: {
          chamadosAtribuidos: {
            where: { resolvidoEm: { gte: since } },
            select: { id: true },
          },
          departamento: true,
        },
        orderBy: { pontosTotais: "desc" },
      }),
      prisma.departamento.findMany({
        where: { ativo: true },
        include: {
          chamados: {
            where: { resolvidoEm: { gte: since } },
            select: { id: true, statusSla: true },
          },
        },
      }),
      prisma.chamado.groupBy({
        by: ["prioridade"],
        where: { criadoEm: { gte: since } },
        _count: { id: true },
      }),
      prisma.chamado.groupBy({
        by: ["origem"],
        where: { criadoEm: { gte: since } },
        _count: { id: true },
      }),
      prisma.chamado.findMany({
        where: { criadoEm: { gte: since } },
        select: { criadoEm: true, resolvidoEm: true, status: true },
        orderBy: { criadoEm: "asc" },
      }).then((items) =>
        items.map((item) => ({
          ...item,
          criadoEm: item.criadoEm.toISOString(),
          resolvidoEm: item.resolvidoEm ? item.resolvidoEm.toISOString() : null,
          status: item.status,
        }))
      ),
    ]);

  return {
    resolvedByAgent,
    resolvedByDepartment,
    byPriority,
    bySource,
    timeline,
    periodDays: days,
  };
}
