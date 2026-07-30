import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { applySlaToTicket, processTicketResolution, awardPoints, POINT_VALUES } from "@/lib/sla";
import { sendWhatsAppReply } from "@/lib/whatsapp";
import { PointReason } from "@prisma/client";

const updateSchema = z.object({
  subject: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["OPEN", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  departmentId: z.string().nullable().optional(),
  assignedAgentId: z.string().nullable().optional(),
  message: z.string().optional(),
  agentId: z.string().optional(),
  isInternal: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      department: true,
      assignedAgent: true,
      messages: {
        include: { agent: true },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: { agent: true },
        orderBy: { createdAt: "desc" },
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
  const body = await request.json();
  const data = updateSchema.parse(body);

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  const auditChanges: string[] = [];

  if (data.subject) updateData.subject = data.subject;
  if (data.description) updateData.description = data.description;
  if (data.status) {
    updateData.status = data.status;
    if (data.status === "RESOLVED" && !existing.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (data.status === "CLOSED" && !existing.closedAt) {
      updateData.closedAt = new Date();
    }
    auditChanges.push(`status:${data.status}`);
  }
  if (data.priority && data.priority !== existing.priority) {
    updateData.priority = data.priority;
    await applySlaToTicket(id, data.priority, data.departmentId ?? existing.departmentId);
    auditChanges.push(`priority:${data.priority}`);
  }
  if (data.departmentId !== undefined && data.departmentId !== existing.departmentId) {
    updateData.departmentId = data.departmentId;
    auditChanges.push(`department:${data.departmentId || "none"}`);
  }
  if (data.assignedAgentId !== undefined && data.assignedAgentId !== existing.assignedAgentId) {
    updateData.assignedAgentId = data.assignedAgentId;
    auditChanges.push(`agent:${data.assignedAgentId || "none"}`);
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: updateData,
    include: { department: true, assignedAgent: true },
  });

  if (data.status === "RESOLVED" && data.agentId) {
    await processTicketResolution(id, data.agentId);
  }

  if (data.message) {
    await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        content: data.message,
        isFromAgent: true,
        isInternal: data.isInternal ?? false,
        agentId: data.agentId,
      },
    });

    await prisma.ticketActivity.create({
      data: {
        ticketId: id,
        agentId: data.agentId,
        action: data.isInternal ? "Nota Interna Adicionada" : "Resposta Enviada",
        details: data.message,
      },
    });

    if (!data.isInternal && existing.requesterPhone && data.message) {
      try {
        await sendWhatsAppReply(existing.requesterPhone, data.message);
      } catch (e) {
        console.error("[WhatsApp] Falha ao enviar resposta:", e);
      }
    }

    if (data.agentId && !existing.firstResponseAt) {
      await prisma.ticket.update({
        where: { id },
        data: { firstResponseAt: new Date() },
      });
      await awardPoints(
        data.agentId,
        POINT_VALUES.FIRST_RESPONSE,
        PointReason.FIRST_RESPONSE,
        id
      );
    }
  }

  if (auditChanges.length > 0) {
    await prisma.ticketActivity.create({
      data: {
        ticketId: id,
        agentId: data.agentId,
        action: "Auditoria de Ticket",
        details: JSON.stringify({ changes: auditChanges }),
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
  await prisma.ticket.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
