import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().nullable().optional(),
  cor: z.string().optional(),
  ativo: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = schema.parse(await request.json().catch(() => ({})));
  const updated = await prisma.departamento.update({ where: { id: Number(id) }, data });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.departamento.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
