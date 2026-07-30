import { PrismaClient, TicketPriority, TicketStatus, TicketSource, SlaStatus, PointReason } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subHours, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TicketFlow...");

  // Departments
  const ti = await prisma.department.create({
    data: { name: "TI / Suporte", description: "Infraestrutura, sistemas e acessos", color: "#3B82F6" },
  });
  const financeiro = await prisma.department.create({
    data: { name: "Financeiro", description: "Cobranças, notas fiscais e pagamentos", color: "#10B981" },
  });
  const comercial = await prisma.department.create({
    data: { name: "Comercial", description: "Vendas, contratos e propostas", color: "#F59E0B" },
  });

  // Global SLA policies
  const slaDefaults = [
    { priority: TicketPriority.LOW, firstResponseMinutes: 480, resolutionMinutes: 2880 },
    { priority: TicketPriority.MEDIUM, firstResponseMinutes: 240, resolutionMinutes: 1440 },
    { priority: TicketPriority.HIGH, firstResponseMinutes: 60, resolutionMinutes: 480 },
    { priority: TicketPriority.URGENT, firstResponseMinutes: 15, resolutionMinutes: 120 },
  ];

  for (const sla of slaDefaults) {
    await prisma.slaPolicy.create({ data: { name: `SLA Global ${sla.priority}`, ...sla } });
  }

  // Agents
  const passwordHash = await bcrypt.hash("123456", 10);
  const admin = await prisma.agent.create({
    data: { name: "Admin Sistema", email: "admin@ticketflow.local", passwordHash, role: "ADMIN", departmentId: ti.id, totalPoints: 45 },
  });
  const ana = await prisma.agent.create({
    data: { name: "Ana Silva", email: "ana@ticketflow.local", passwordHash, role: "AGENT", departmentId: ti.id, totalPoints: 128 },
  });
  const carlos = await prisma.agent.create({
    data: { name: "Carlos Mendes", email: "carlos@ticketflow.local", passwordHash, role: "AGENT", departmentId: financeiro.id, totalPoints: 95 },
  });
  const beatriz = await prisma.agent.create({
    data: { name: "Beatriz Costa", email: "beatriz@ticketflow.local", passwordHash, role: "SUPERVISOR", departmentId: comercial.id, totalPoints: 72 },
  });

  // Sample tickets
  const now = new Date();

  const tickets = [
    {
      subject: "Não consigo acessar o sistema ERP",
      description: "Bom dia, estou tentando entrar no ERP desde cedo e aparece erro de senha. Já tentei resetar mas não recebi o e-mail.",
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
      source: TicketSource.WHATSAPP,
      requesterName: "João Pereira",
      requesterPhone: "5511999887766",
      departmentId: ti.id,
      assignedAgentId: ana.id,
      slaStatus: SlaStatus.ON_TRACK,
      slaDueAt: subHours(now, -4),
      firstResponseDueAt: subHours(now, -1),
      firstResponseAt: subHours(now, 2),
    },
    {
      subject: "Segunda via de boleto - Março",
      description: "Preciso da segunda via do boleto de março, vence amanhã.",
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      source: TicketSource.WHATSAPP,
      requesterName: "Maria Santos",
      requesterPhone: "5511988776655",
      departmentId: financeiro.id,
      slaStatus: SlaStatus.ON_TRACK,
      slaDueAt: subHours(now, -20),
      firstResponseDueAt: subHours(now, -3),
    },
    {
      subject: "Proposta comercial - Plano Enterprise",
      description: "Gostaria de receber uma proposta para 50 licenças do plano enterprise.",
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.MEDIUM,
      source: TicketSource.WEB,
      requesterName: "Empresa ABC Ltda",
      requesterEmail: "contato@abc.com.br",
      departmentId: comercial.id,
      assignedAgentId: beatriz.id,
      slaStatus: SlaStatus.MET,
      resolvedAt: subDays(now, 1),
      slaDueAt: subDays(now, -2),
      firstResponseAt: subDays(now, 2),
      firstResponseDueAt: subDays(now, 1),
    },
    {
      subject: "VPN não conecta após atualização",
      description: "Depois da atualização do Windows, a VPN parou de funcionar.",
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.URGENT,
      source: TicketSource.WHATSAPP,
      requesterName: "Pedro Lima",
      requesterPhone: "5511977665544",
      departmentId: ti.id,
      assignedAgentId: ana.id,
      slaStatus: SlaStatus.MET,
      resolvedAt: subHours(now, 5),
      slaDueAt: subHours(now, -1),
      firstResponseAt: subHours(now, 3),
      firstResponseDueAt: subHours(now, 2),
    },
    {
      subject: "Dúvida sobre nota fiscal de serviço",
      description: "A NF do mês passado veio com valor diferente do contrato.",
      status: TicketStatus.PENDING,
      priority: TicketPriority.LOW,
      source: TicketSource.EMAIL,
      requesterName: "Lucia Ferreira",
      requesterEmail: "lucia@empresa.com",
      departmentId: financeiro.id,
      assignedAgentId: carlos.id,
      slaStatus: SlaStatus.ON_TRACK,
      slaDueAt: subDays(now, -3),
      firstResponseDueAt: subDays(now, -1),
      firstResponseAt: subDays(now, 1),
    },
  ];

  const existingCount = await prisma.ticket.count();

  for (const [index, t] of tickets.entries()) {
    const ticket = await prisma.ticket.create({
      data: {
        ...t,
        ticketNumber: existingCount + index + 1,
        activities: { create: { action: "Ticket Criado", details: "Ticket de demonstração" } },
      },
    });

    if (t.source === TicketSource.WHATSAPP && t.requesterPhone) {
      await prisma.ticketMessage.create({
        data: { ticketId: ticket.id, content: t.description, isFromAgent: false },
      });
      if (t.firstResponseAt) {
        await prisma.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            content: "Olá! Recebemos sua solicitação e já estamos analisando.",
            isFromAgent: true,
            agentId: t.assignedAgentId,
          },
        });
      }
    }
  }

  // Point logs
  await prisma.agentPointLog.createMany({
    data: [
      { agentId: ana.id, points: 10, reason: PointReason.TICKET_RESOLVED },
      { agentId: ana.id, points: 5, reason: PointReason.SLA_MET },
      { agentId: ana.id, points: 3, reason: PointReason.FIRST_RESPONSE },
      { agentId: carlos.id, points: 10, reason: PointReason.TICKET_RESOLVED },
      { agentId: beatriz.id, points: 10, reason: PointReason.TICKET_RESOLVED },
      { agentId: beatriz.id, points: 5, reason: PointReason.SLA_MET },
    ],
  });

  console.log("✅ Seed concluído!");
  console.log("   Departamentos: 3");
  console.log("   Agentes: 4 (senha padrão: 123456)");
  console.log("   Tickets: 5");
  console.log("   Políticas SLA: 4");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
