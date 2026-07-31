import { prisma } from "@/lib/prisma";

export async function getNextNumeroChamado() {
  const last = await prisma.chamado.findFirst({
    orderBy: { numeroChamado: "desc" },
    select: { numeroChamado: true },
  });
  return (last?.numeroChamado ?? 0) + 1;
}
