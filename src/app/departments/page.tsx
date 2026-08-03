import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock3, Ticket, Users } from "lucide-react";
import { CreateDepartmentForm } from "@/components/admin/create-department-form";
import { DepartmentCard } from "@/components/admin/department-card";
import { enumVariant } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const departments = await prisma.departamento.findMany({
    include: {
      atendentes: { where: { ativo: true } },
      politicasSla: true,
      _count: { select: { chamados: true } },
    },
    orderBy: { nome: "asc" },
  });

  const activeDepartments = departments.filter((dept) => dept.ativo).length;
  const totalAgents = departments.reduce((sum, dept) => sum + dept.atendentes.length, 0);
  const totalTickets = departments.reduce((sum, dept) => sum + dept._count.chamados, 0);

  return (
    <div className="p-8">
      <PageHeader
        title="Departamentos"
        description="Organize equipes, filas de atendimento e políticas de SLA"
        action={<Badge variant="resolvido">Operação Ativa</Badge>}
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
          value={departments.reduce((sum, dept) => sum + dept.politicasSla.filter((policy) => policy.ativo).length, 0)}
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
            <Card key={dept.id} className={!dept.ativo ? "border-slate-300 bg-slate-50/70" : ""}>
              <DepartmentCard dept={dept} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
