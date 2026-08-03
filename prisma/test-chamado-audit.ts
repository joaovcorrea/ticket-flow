import { PrismaClient, StatusChamado, PrioridadeChamado, OrigemChamado, StatusSla } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando teste de auditoria de Chamado...");

  const chamado = await prisma.chamado.create({
    data: {
      numeroChamado: Math.floor(Math.random() * 1000000) + 1000000,
      assunto: "Teste de auditoria",
      descricao: "Criando chamado para validar trigger e auditoria",
      status: StatusChamado.ABERTO,
      prioridade: PrioridadeChamado.MEDIA,
      origem: OrigemChamado.WEB,
      statusSla: StatusSla.NO_PRAZO,
      nomeSolicitante: "Teste User",
      emailSolicitante: "teste@example.com",
    },
  });

  console.log("Chamado criado:", chamado);

  const auditAfterCreate = await prisma.chamadoAuditoria.findMany({
    where: { chamadoId: chamado.id },
    orderBy: { criadoEm: "asc" },
  });
  console.log(`Registros de auditoria após criação: ${auditAfterCreate.length}`);
  console.log(auditAfterCreate);

  const chamadoAtualizado = await prisma.chamado.update({
    where: { id: chamado.id },
    data: {
      status: StatusChamado.REABERTO,
      descricao: "Chamado atualizado para reaberto",
    },
  });

  console.log("Chamado atualizado:", chamadoAtualizado);

  const auditAfterUpdate = await prisma.chamadoAuditoria.findMany({
    where: { chamadoId: chamado.id },
    orderBy: { criadoEm: "asc" },
  });
  console.log(`Registros de auditoria após atualização: ${auditAfterUpdate.length}`);
  console.log(auditAfterUpdate);

  // Limpa os dados de teste
  await prisma.chamado.delete({ where: { id: chamado.id } });
  await prisma.chamadoAuditoria.deleteMany({ where: { chamadoId: chamado.id } });

  console.log("Teste concluído e dados de teste removidos.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
