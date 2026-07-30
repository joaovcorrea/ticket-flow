import { TicketPriority, SlaStatus, PointReason } from "@prisma/client";
import { prisma } from "./prisma";
import { addMinutes, isBefore } from "date-fns";

export async function getSlaPolicy(
  priority: TicketPriority,
  departmentId?: string | null
) {
  if (departmentId) {
    const deptPolicy = await prisma.slaPolicy.findUnique({
      where: { departmentId_priority: { departmentId, priority } },
    });
    if (deptPolicy) return deptPolicy;
  }

  return prisma.slaPolicy.findFirst({
    where: { departmentId: null, priority, isActive: true },
  });
}

export async function applySlaToTicket(
  ticketId: string,
  priority: TicketPriority,
  departmentId?: string | null
) {
  const policy = await getSlaPolicy(priority, departmentId);
  if (!policy) return;

  const now = new Date();
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      firstResponseDueAt: addMinutes(now, policy.firstResponseMinutes),
      slaDueAt: addMinutes(now, policy.resolutionMinutes),
      slaStatus: SlaStatus.ON_TRACK,
    },
  });
}

export function computeSlaStatus(
  slaDueAt: Date | null,
  resolvedAt: Date | null,
  currentStatus: SlaStatus
): SlaStatus {
  if (resolvedAt && slaDueAt) {
    return isBefore(resolvedAt, slaDueAt) ? SlaStatus.MET : SlaStatus.BREACHED;
  }
  if (!slaDueAt) return currentStatus;

  const now = new Date();
  if (isBefore(now, slaDueAt)) {
    const remaining = slaDueAt.getTime() - now.getTime();
    const total = slaDueAt.getTime() - (slaDueAt.getTime() - remaining);
    const percentRemaining = remaining / (total || 1);
    return percentRemaining < 0.25 ? SlaStatus.AT_RISK : SlaStatus.ON_TRACK;
  }
  return SlaStatus.BREACHED;
}

export async function awardPoints(
  agentId: string,
  points: number,
  reason: PointReason,
  ticketId?: string,
  note?: string
) {
  await prisma.$transaction([
    prisma.agentPointLog.create({
      data: { agentId, points, reason, ticketId, note },
    }),
    prisma.agent.update({
      where: { id: agentId },
      data: { totalPoints: { increment: points } },
    }),
  ]);
}

export const POINT_VALUES: Record<PointReason, number> = {
  TICKET_RESOLVED: 10,
  SLA_MET: 5,
  FIRST_RESPONSE: 3,
  CUSTOMER_SATISFACTION: 8,
  BONUS: 0,
  PENALTY: 0,
};

export async function processTicketResolution(ticketId: string, agentId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || !ticket.resolvedAt) return;

  await awardPoints(
    agentId,
    POINT_VALUES.TICKET_RESOLVED,
    PointReason.TICKET_RESOLVED,
    ticketId
  );

  if (
    ticket.slaDueAt &&
    isBefore(ticket.resolvedAt, ticket.slaDueAt)
  ) {
    await awardPoints(
      agentId,
      POINT_VALUES.SLA_MET,
      PointReason.SLA_MET,
      ticketId
    );
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { slaStatus: SlaStatus.MET },
    });
  } else if (ticket.slaDueAt) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { slaStatus: SlaStatus.BREACHED },
    });
  }
}
