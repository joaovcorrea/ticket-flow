import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { subDays } from "date-fns";

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

  const since = subDays(new Date(), 30);
  const departments = await prisma.department.findMany({
    include: { _count: { select: { tickets: true } } },
    orderBy: { name: "asc" },
  });

  const resolvedTickets = await prisma.ticket.findMany({
    where: {
      resolvedAt: { gte: since },
      departmentId: { not: null },
    },
    include: { department: true },
  });

  const metrics = departments.map((department) => {
    const tickets = resolvedTickets.filter((ticket) => ticket.departmentId === department.id);
    const total = tickets.length;
    const met = tickets.filter((ticket) => ticket.slaStatus === "MET").length;
    const breached = tickets.filter((ticket) => ticket.slaStatus === "BREACHED").length;
    const compliance = total > 0 ? Math.round((met / total) * 100) : 100;

    return {
      id: department.id,
      name: department.name,
      total,
      met,
      breached,
      compliance,
    };
  });

  return NextResponse.json({ policies, metrics, since });
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
