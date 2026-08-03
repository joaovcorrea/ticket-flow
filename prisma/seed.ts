import {
  PrismaClient,
  PrioridadeChamado,
  StatusChamado,
  OrigemChamado,
  StatusSla,
  MotivoPontos,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { subHours, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("Enviando Ticket Flow...");

  const ti = await prisma.departamento.create({
    data: { nome: "TI / Suporte", descricao: "Infraestrutura, sistemas e acessos", cor: "#3B82F6" },
  });
  const financeiro = await prisma.departamento.create({
    data: { nome: "Financeiro", descricao: "Cobranças, notas fiscais e pagamentos", cor: "#10B981" },
  });
  const comercial = await prisma.departamento.create({
    data: { nome: "Comercial", descricao: "Vendas, contratos e propostas", cor: "#F59E0B" },
  });

  const slaDefaults = [
    { prioridade: PrioridadeChamado.BAIXA, minutosPrimeiraResposta: 480, minutosResolucao: 2880 },
    { prioridade: PrioridadeChamado.MEDIA, minutosPrimeiraResposta: 240, minutosResolucao: 1440 },
    { prioridade: PrioridadeChamado.ALTA, minutosPrimeiraResposta: 60, minutosResolucao: 480 },
    { prioridade: PrioridadeChamado.URGENTE, minutosPrimeiraResposta: 15, minutosResolucao: 120 },
  ];

  for (const sla of slaDefaults) {
    await prisma.politicaSla.create({ data: { nome: `SLA Global ${sla.prioridade}`, ...sla } });
  }

  const senhaHash = await bcrypt.hash("123456", 10);
  await prisma.atendente.create({
    data: {
      nome: "Admin Sistema",
      email: "admin@ticketflow.local",
      senhaHash,
      papel: "ADMIN",
      idDepartamento: ti.id,
      pontosTotais: 45,
    },
  });
  const ana = await prisma.atendente.create({
    data: {
      nome: "Ana Silva",
      email: "ana@ticketflow.local",
      senhaHash,
      papel: "ATENDENTE",
      idDepartamento: ti.id,
      pontosTotais: 128,
    },
  });
  const carlos = await prisma.atendente.create({
    data: {
      nome: "Carlos Mendes",
      email: "carlos@ticketflow.local",
      senhaHash,
      papel: "ATENDENTE",
      idDepartamento: financeiro.id,
      pontosTotais: 95,
    },
  });
  const beatriz = await prisma.atendente.create({
    data: {
      nome: "Beatriz Costa",
      email: "beatriz@ticketflow.local",
      senhaHash,
      papel: "SUPERVISOR",
      idDepartamento: comercial.id,
      pontosTotais: 72,
    },
  });

  const now = new Date();

  const tickets = [
    {
      assunto: "Não consigo acessar o sistema ERP",
      descricao:
        "Bom dia, estou tentando entrar no ERP desde cedo e aparece erro de senha. Já tentei resetar mas não recebi o e-mail.",
      status: StatusChamado.EM_ANDAMENTO,
      prioridade: PrioridadeChamado.ALTA,
      origem: OrigemChamado.WHATSAPP,
      nomeSolicitante: "João Pereira",
      telefoneSolicitante: "5511999887766",
      idDepartamento: ti.id,
      idAgenteResponsavel: ana.id,
      statusSla: StatusSla.NO_PRAZO,
      slaVencimentoEm: subHours(now, -4),
      primeiraRespostaVencimentoEm: subHours(now, -1),
      primeiraRespostaEm: subHours(now, 2),
    },
    {
      assunto: "Segunda via de boleto - Março",
      descricao: "Preciso da segunda via do boleto de março, vence amanhã.",
      status: StatusChamado.ABERTO,
      prioridade: PrioridadeChamado.MEDIA,
      origem: OrigemChamado.WHATSAPP,
      nomeSolicitante: "Maria Santos",
      telefoneSolicitante: "5511988776655",
      idDepartamento: financeiro.id,
      statusSla: StatusSla.NO_PRAZO,
      slaVencimentoEm: subHours(now, -20),
      primeiraRespostaVencimentoEm: subHours(now, -3),
    },
    {
      assunto: "Proposta comercial - Plano Enterprise",
      descricao: "Gostaria de receber uma proposta para 50 licenças do plano enterprise.",
      status: StatusChamado.RESOLVIDO,
      prioridade: PrioridadeChamado.MEDIA,
      origem: OrigemChamado.WEB,
      nomeSolicitante: "Empresa ABC Ltda",
      emailSolicitante: "contato@abc.com.br",
      idDepartamento: comercial.id,
      idAgenteResponsavel: beatriz.id,
      statusSla: StatusSla.CUMPRIDO,
      resolvidoEm: subDays(now, 1),
      slaVencimentoEm: subDays(now, -2),
      primeiraRespostaEm: subDays(now, 2),
      primeiraRespostaVencimentoEm: subDays(now, 1),
    },
    {
      assunto: "VPN não conecta após atualização",
      descricao: "Depois da atualização do Windows, a VPN parou de funcionar.",
      status: StatusChamado.RESOLVIDO,
      prioridade: PrioridadeChamado.URGENTE,
      origem: OrigemChamado.WHATSAPP,
      nomeSolicitante: "Pedro Lima",
      telefoneSolicitante: "5511977665544",
      idDepartamento: ti.id,
      idAgenteResponsavel: ana.id,
      statusSla: StatusSla.CUMPRIDO,
      resolvidoEm: subHours(now, 5),
      slaVencimentoEm: subHours(now, -1),
      primeiraRespostaEm: subHours(now, 3),
      primeiraRespostaVencimentoEm: subHours(now, 2),
    },
    {
      assunto: "Dúvida sobre nota fiscal de serviço",
      descricao: "A NF do mês passado veio com valor diferente do contrato.",
      status: StatusChamado.PENDENTE,
      prioridade: PrioridadeChamado.BAIXA,
      origem: OrigemChamado.EMAIL,
      nomeSolicitante: "Lucia Ferreira",
      emailSolicitante: "lucia@empresa.com",
      idDepartamento: financeiro.id,
      idAgenteResponsavel: carlos.id,
      statusSla: StatusSla.NO_PRAZO,
      slaVencimentoEm: subDays(now, -3),
      primeiraRespostaVencimentoEm: subDays(now, -1),
      primeiraRespostaEm: subDays(now, 1),
    },
  ];

  const existingCount = await prisma.chamado.count();

  for (const [index, t] of tickets.entries()) {
    const chamado = await prisma.chamado.create({
      data: {
        ...t,
        numeroChamado: existingCount + index + 1,
        historico: { create: { acao: "Ticket Criado", detalhes: "Ticket de demonstração" } },
      },
    });

    if (t.origem === OrigemChamado.WHATSAPP && t.telefoneSolicitante) {
      await prisma.mensagemTicket.create({
        data: { idChamado: chamado.id, conteudo: t.descricao, doAgente: false },
      });
      if (t.primeiraRespostaEm) {
        await prisma.mensagemTicket.create({
          data: {
            idChamado: chamado.id,
            conteudo: "Olá! Recebemos sua solicitação e já estamos analisando.",
            doAgente: true,
            idAgente: t.idAgenteResponsavel,
          },
        });
      }
    }
  }

  await prisma.registroPontos.createMany({
    data: [
      { idAgente: ana.id, pontos: 10, motivo: MotivoPontos.CHAMADO_RESOLVIDO },
      { idAgente: ana.id, pontos: 5, motivo: MotivoPontos.SLA_CUMPRIDO },
      { idAgente: ana.id, pontos: 3, motivo: MotivoPontos.PRIMEIRA_RESPOSTA },
      { idAgente: carlos.id, pontos: 10, motivo: MotivoPontos.CHAMADO_RESOLVIDO },
      { idAgente: beatriz.id, pontos: 10, motivo: MotivoPontos.CHAMADO_RESOLVIDO },
      { idAgente: beatriz.id, pontos: 5, motivo: MotivoPontos.SLA_CUMPRIDO },
    ],
  });

  console.log("✅ Envio concluído!");
  console.log("   Departamentos: 3");
  console.log("   Agentes: 4 (senha padrão: 123456)");
  console.log("   Tickets: 5");
  console.log("   Políticas SLA: 4");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
