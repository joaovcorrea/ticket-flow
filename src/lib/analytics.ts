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
    prisma.ticket.count({
      where: { status: { in: ["OPEN", "PENDING"] } },
    }),
    prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.ticket.count({
      where: {
        resolvedAt: { gte: startOfDay(today), lte: endOfDay(today) },
      },
    }),
    prisma.ticket.count({
      where: { resolvedAt: { gte: weekAgo } },
    }),
    prisma.ticket.count({ where: { slaStatus: "BREACHED" } }),
    prisma.ticket.count({ where: { slaStatus: "MET" } }),
    prisma.agent.count({ where: { isActive: true } }),
    prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { totalPoints: "desc" },
      take: 5,
      include: { department: true },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { tickets: true, agents: true } },
      },
    }),
    prisma.ticket.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { department: true, assignedAgent: true },
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
      prisma.agent.findMany({
        where: { isActive: true },
        include: {
          assignedTickets: {
            where: { resolvedAt: { gte: since } },
            select: { id: true },
          },
          department: true,
        },
        orderBy: { totalPoints: "desc" },
      }),
      prisma.department.findMany({
        where: { isActive: true },
        include: {
          tickets: {
            where: { resolvedAt: { gte: since } },
            select: { id: true, slaStatus: true },
          },
        },
      }),
      prisma.ticket.groupBy({
        by: ["priority"],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      prisma.ticket.groupBy({
        by: ["source"],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      prisma.ticket.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, resolvedAt: true, status: true },
        orderBy: { createdAt: "asc" },
      }).then((items) =>
        items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          resolvedAt: item.resolvedAt ? item.resolvedAt.toISOString() : null,
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
