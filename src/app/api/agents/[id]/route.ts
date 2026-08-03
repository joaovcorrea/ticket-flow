import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  idDepartamento: z.number().nullable().optional(),
  ativo: z.boolean().optional(),
  papel: z.enum(["ADMIN", "SUPERVISOR", "ATENDENTE"]).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = schema.parse(await request.json().catch(() => ({})));
  const updated = await prisma.atendente.update({ where: { id: Number(id) }, data });
  const { senhaHash, ...sanitized } = updated as any;
  return NextResponse.json(sanitized);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.atendente.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
