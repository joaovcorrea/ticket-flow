import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { agents: true, tickets: true } },
      slaPolicies: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(departments);
}

export async function POST(request: NextRequest) {
  const data = schema.parse(await request.json());
  const department = await prisma.department.create({
    data: {
      name: data.name,
      description: data.description,
      color: data.color || "#3B82F6",
      isActive: data.isActive ?? true,
    },
  });
  return NextResponse.json(department, { status: 201 });
}
