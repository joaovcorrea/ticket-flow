import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock3, Ticket, Users } from "lucide-react";
import { CreateDepartmentForm } from "@/components/admin/create-department-form";

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

  const activeDepartments = departments.filter((dept) => dept.isActive).length;
  const totalAgents = departments.reduce((sum, dept) => sum + dept.agents.length, 0);
  const totalTickets = departments.reduce((sum, dept) => sum + dept._count.tickets, 0);

  return (
    <div className="p-8">
      <PageHeader
        title="Departamentos"
        description="Organize equipes, filas de atendimento e políticas de SLA"
        action={<Badge variant="resolved">Operação ativa</Badge>}
      />

      <CreateDepartmentForm />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Departamentos"
          value={departments.length}
          subtitle={`${activeDepartments} ativos`}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          title="Agentes"
          value={totalAgents}
          subtitle="Em atividade"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Tickets"
          value={totalTickets}
          subtitle="Distribuídos pelas filas"
          icon={<Ticket className="h-5 w-5" />}
        />
        <StatCard
          title="SLA ativo"
          value={departments.reduce((sum, dept) => sum + dept.slaPolicies.filter((policy) => policy.isActive).length, 0)}
          subtitle="Políticas configuradas"
          icon={<Clock3 className="h-5 w-5" />}
        />
      </div>

      {departments.length === 0 ? (
        <Card className="text-center">
          <h2 className="text-lg font-semibold">Nenhum departamento cadastrado</h2>
          <p className="mt-2 text-sm text-slate-500">
            Cadastre uma nova fila para começar a organizar sua operação.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className={!dept.isActive ? "border-slate-300 bg-slate-50/70" : ""}>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: dept.color }} />
                <h3 className="text-lg font-semibold">{dept.name}</h3>
                {!dept.isActive ? <Badge variant="closed">Inativo</Badge> : <Badge variant="resolved">Ativo</Badge>}
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
                  {dept.agents.length > 0 ? (
                    dept.agents.map((a) => (
                      <span key={a.id} className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                        {a.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Nenhum agente ativo</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
