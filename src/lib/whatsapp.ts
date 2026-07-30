import { prisma } from "./prisma";
import { TicketSource, TicketStatus, TicketPriority } from "@prisma/client";
import { applySlaToTicket } from "./sla";

interface IncomingWhatsAppMessage {
  from: string;
  name?: string;
  text: string;
  messageId?: string;
}

export async function handleWhatsAppMessage(msg: IncomingWhatsAppMessage) {
  const phone = msg.from.replace(/\D/g, "");
  const session = await prisma.whatsAppSession.findUnique({
    where: { phone },
  });

  // Active ticket for this phone (open/pending/in_progress)
  let ticket = session?.ticketId
    ? await prisma.ticket.findFirst({
        where: {
          id: session.ticketId,
          status: { in: [TicketStatus.OPEN, TicketStatus.PENDING, TicketStatus.IN_PROGRESS] },
        },
      })
    : null;

  if (!ticket) {
    ticket = await prisma.ticket.findFirst({
      where: {
        requesterPhone: phone,
        status: { in: [TicketStatus.OPEN, TicketStatus.PENDING, TicketStatus.IN_PROGRESS] },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!ticket) {
    const ticketNumber = (await prisma.ticket.count()) + 1;

    ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: msg.text.slice(0, 80) || "Nova solicitação via WhatsApp",
        description: msg.text,
        source: TicketSource.WHATSAPP,
        priority: TicketPriority.MEDIUM,
        requesterName: msg.name || phone,
        requesterPhone: phone,
        whatsappChatId: phone,
        activities: {
          create: {
            action: "Ticket Criado",
            details: "Ticket criado automaticamente via WhatsApp",
          },
        },
      },
    });

    await applySlaToTicket(ticket.id, ticket.priority, ticket.departmentId);

    await prisma.whatsAppSession.upsert({
      where: { phone },
      create: { phone, name: msg.name, ticketId: ticket.id },
      update: { ticketId: ticket.id, name: msg.name, lastMessageAt: new Date() },
    });
  } else {
    await prisma.whatsAppSession.upsert({
      where: { phone },
      create: { phone, name: msg.name, ticketId: ticket.id },
      update: { lastMessageAt: new Date() },
    });
  }

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      content: msg.text,
      isFromAgent: false,
      whatsappMessageId: msg.messageId,
    },
  });

  await prisma.ticketActivity.create({
    data: {
      ticketId: ticket.id,
      action: "MESSAGE_RECEIVED",
      details: "Mensagem recebida via WhatsApp",
    },
  });

  return ticket;
}

export async function sendWhatsAppReply(to: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiUrl = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v21.0";

  if (!token || !phoneId) {
    console.warn("[WhatsApp] Tokens não configurados — mensagem simulada:", { to, text });
    return { simulated: true };
  }

  const phone = to.replace(/\D/g, "");
  const response = await fetch(`${apiUrl}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API error: ${error}`);
  }

  return response.json();
}
