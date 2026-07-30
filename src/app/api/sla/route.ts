import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  firstResponseMinutes: z.number().int().positive(),
  resolutionMinutes: z.number().int().positive(),
  departmentId: z.string().nullable().optional(),
});

export async function GET() {
  const policies = await prisma.slaPolicy.findMany({
    include: { department: true },
    orderBy: [{ departmentId: "asc" }, { priority: "asc" }],
  });
  return NextResponse.json(policies);
}

export async function POST(request: NextRequest) {
  const data = schema.parse(await request.json());
  const policy = await prisma.slaPolicy.create({ data });
  return NextResponse.json(policy, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...rest } = body;
  const data = schema.partial().parse(rest);

  const policy = await prisma.slaPolicy.update({
    where: { id },
    data,
    include: { department: true },
  });
  return NextResponse.json(policy);
}
