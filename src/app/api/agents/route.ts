import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "SUPERVISOR", "AGENT"]).default("AGENT"),
  departmentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const agents = await prisma.agent.findMany({
    include: {
      department: true,
      _count: { select: { assignedTickets: true, pointLogs: true } },
    },
    orderBy: { totalPoints: "desc" },
  });

  const sanitized = agents.map(({ passwordHash, ...agent }) => agent);
  return NextResponse.json(sanitized);
}

export async function POST(request: NextRequest) {
  const data = schema.parse(await request.json());
  const passwordHash = await bcrypt.hash(data.password || "123456", 10);

  const agent = await prisma.agent.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      departmentId: data.departmentId,
      isActive: data.isActive ?? true,
    },
    include: { department: true },
  });

  const { passwordHash: _, ...sanitized } = agent;
  return NextResponse.json(sanitized, { status: 201 });
}
