import { prisma } from "./prisma";
import { OrigemChamado, StatusChamado, PrioridadeChamado } from "@prisma/client";
import { applySlaToTicket } from "./sla";
import { createWithUniqueNumeroChamado } from "./tickets";

interface IncomingWhatsAppMessage {
  from: string;
  name?: string;
  text: string;
  messageId?: string;
}

export async function handleWhatsAppMessage(msg: IncomingWhatsAppMessage) {
  const phone = msg.from.replace(/\D/g, "");
  const session = await prisma.sessaoWhatsapp.findUnique({
    where: { telefone: phone },
  });

  let chamado = session?.idChamado
    ? await prisma.chamado.findFirst({
        where: {
          id: session.idChamado,
          status: { in: [StatusChamado.ABERTO, StatusChamado.PENDENTE, StatusChamado.EM_ANDAMENTO] },
        },
      })
    : null;

  if (!chamado) {
    chamado = await prisma.chamado.findFirst({
      where: { telefoneSolicitante: phone },
      orderBy: { criadoEm: "desc" },
    });

    if (chamado && (chamado.status === StatusChamado.FECHADO || chamado.status === StatusChamado.RESOLVIDO)) {
      chamado = await prisma.chamado.update({
        where: { id: chamado.id },
        data: { status: StatusChamado.REABERTO, reabertoEm: new Date() },
      });

      await prisma.ticketHistorico.create({
        data: {
          idChamado: chamado.id,
          acao: "REABERTO",
          detalhes: "Ticket reaberto pelo cliente via WhatsApp",
        },
      });
    } else if (chamado && !(chamado.status === StatusChamado.ABERTO || chamado.status === StatusChamado.PENDENTE || chamado.status === StatusChamado.EM_ANDAMENTO)) {
      chamado = null as any;
    }
  }

  if (!chamado) {
    chamado = await createWithUniqueNumeroChamado(async (numeroChamado) =>
      prisma.chamado.create({
        data: {
          numeroChamado,
          assunto: msg.text.slice(0, 80) || "Nova solicitação via WhatsApp",
          descricao: msg.text,
          origem: OrigemChamado.WHATSAPP,
          prioridade: PrioridadeChamado.MEDIA,
          nomeSolicitante: msg.name || phone,
          telefoneSolicitante: phone,
          idChatWhatsapp: phone,
          historico: {
            create: {
              acao: "TICKET_CREATED",
              detalhes: "Ticket criado automaticamente via WhatsApp",
            },
          },
        },
      })
    );

    await applySlaToTicket(chamado.id, chamado.prioridade, chamado.idDepartamento);

    await prisma.sessaoWhatsapp.upsert({
      where: { telefone: phone },
      create: { telefone: phone, nome: msg.name, idChamado: chamado.id },
      update: { idChamado: chamado.id, nome: msg.name, ultimaMensagemEm: new Date() },
    });
  } else {
    await prisma.sessaoWhatsapp.upsert({
      where: { telefone: phone },
      create: { telefone: phone, nome: msg.name, idChamado: chamado.id },
      update: { ultimaMensagemEm: new Date() },
    });
  }

  await prisma.mensagemTicket.create({
    data: {
      idChamado: chamado.id,
      conteudo: msg.text,
      doAgente: false,
      idMensagemWhatsapp: msg.messageId,
    },
  });

  await prisma.ticketHistorico.create({
    data: {
      idChamado: chamado.id,
      acao: "MESSAGE_RECEIVED",
      detalhes: "Mensagem recebida via WhatsApp",
    },
  });

  return chamado;
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
