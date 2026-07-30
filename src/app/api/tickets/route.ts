import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { applySlaToTicket } from "@/lib/sla";

const createTicketSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  source: z.enum(["WHATSAPP", "WEB", "EMAIL", "PHONE"]).default("WEB"),
  requesterName: z.string().min(1),
  requesterPhone: z.string().optional(),
  requesterEmail: z.string().email().optional().or(z.literal("")),
  departmentId: z.string().optional(),
  assignedAgentId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const departmentId = searchParams.get("departmentId");
  const assignedAgentId = searchParams.get("assignedAgentId");
  const search = searchParams.get("search");

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(status && { status: status as never }),
      ...(departmentId && { departmentId }),
      ...(assignedAgentId && { assignedAgentId }),
      ...(search && {
        OR: [
          { subject: { contains: search } },
          { requesterName: { contains: search } },
          { requesterPhone: { contains: search } },
        ],
      }),
    },
    include: {
      department: true,
      assignedAgent: true,
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = createTicketSchema.parse(body);

  const ticketNumber = (await prisma.ticket.count()) + 1;

  const ticket = await prisma.ticket.create({
    data: {
      ...data,
      ticketNumber,
      requesterEmail: data.requesterEmail || undefined,
      activities: {
        create: { action: "Ticket Criado", details: "Ticket criado manualmente" },
      },
    },
    include: { department: true, assignedAgent: true },
  });

  await applySlaToTicket(ticket.id, ticket.priority, ticket.departmentId);

  return NextResponse.json(ticket, { status: 201 });
}
