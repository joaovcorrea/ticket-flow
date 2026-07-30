import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    include: {
      agents: { where: { isActive: true } },
      slaPolicies: true,
      _count: { select: { tickets: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Departamentos"
        description="Organize equipes e filas de atendimento"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id}>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-4 w-4 rounded-full" style={{ backgroundColor: dept.color }} />
              <h3 className="text-lg font-semibold">{dept.name}</h3>
              {!dept.isActive && <Badge>Inativo</Badge>}
            </div>
            {dept.description && (
              <p className="mb-4 text-sm text-slate-500">{dept.description}</p>
            )}
            <div className="mb-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-2xl font-bold text-brand-600">{dept.agents.length}</p>
                <p className="text-xs text-slate-500">Agentes</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-2xl font-bold text-brand-600">{dept._count.tickets}</p>
                <p className="text-xs text-slate-500">Tickets</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Políticas SLA</p>
              <div className="flex flex-wrap gap-1">
                {dept.slaPolicies.map((p) => (
                  <Badge key={p.id} variant={p.priority.toLowerCase()}>
                    {p.priority}: {p.resolutionMinutes}min
                  </Badge>
                ))}
                {dept.slaPolicies.length === 0 && (
                  <span className="text-xs text-slate-400">Usando SLA global</span>
                )}
              </div>
            </div>
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-xs font-medium text-slate-500">Equipe</p>
              <div className="flex flex-wrap gap-2">
                {dept.agents.map((a) => (
                  <span key={a.id} className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
