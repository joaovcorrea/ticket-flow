import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_NUMERO_CHAMADO_ATTEMPTS = 6;

export async function getNextNumeroChamado() {
  const last = await prisma.chamado.findFirst({
    orderBy: { numeroChamado: "desc" },
    select: { numeroChamado: true },
  });
  return (last?.numeroChamado ?? 0) + 1;
}

function isNumeroChamadoUniqueError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("numeroChamado")
  );
}

export async function createWithUniqueNumeroChamado<T>(createFn: (numeroChamado: number) => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_NUMERO_CHAMADO_ATTEMPTS; attempt++) {
    const numeroChamado = await getNextNumeroChamado();
    try {
      return await createFn(numeroChamado);
    } catch (error) {
      if (isNumeroChamadoUniqueError(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Não foi possível gerar um número de chamado único.");
}
