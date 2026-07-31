import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, formatDuration, enumVariant } from "@/lib/utils";
import { Clock3, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function SlaPage() {
  const policies = await prisma.politicaSla.findMany({
    include: { departamento: true },
    orderBy: [{ idDepartamento: "asc" }, { prioridade: "asc" }],
  });

  const globalPolicies = policies.filter((p) => !p.idDepartamento);
  const deptPolicies = policies.filter((p) => p.idDepartamento);

  const since = subDays(new Date(), 30);
  const departments = await prisma.departamento.findMany({
    orderBy: { nome: "asc" },
  });

  const resolvedTickets = await prisma.chamado.findMany({
    where: {
      resolvidoEm: { gte: since },
      idDepartamento: { not: null },
    },
  });

  const deptMetrics = departments.map((department) => {
    const tickets = resolvedTickets.filter((ticket) => ticket.idDepartamento === department.id);
    const total = tickets.length;
    const met = tickets.filter((ticket) => ticket.statusSla === "CUMPRIDO").length;
    const breached = tickets.filter((ticket) => ticket.statusSla === "ESTOURADO").length;
    const compliance = total > 0 ? Math.round((met / total) * 100) : 100;

    return { ...department, total, met, breached, compliance };
  });

  const overallCompliance = deptMetrics.length > 0
    ? Math.round(deptMetrics.reduce((sum, item) => sum + item.compliance, 0) / deptMetrics.length)
    : 100;

  return (
    <div className="p-8">
      <PageHeader
        title="Políticas de SLA"
        description="Monitore tempos de resposta, resolução e conformidade por prioridade"
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard
          title="SLA global"
          value={globalPolicies.length}
          subtitle="Políticas padrão"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Por departamento"
          value={deptPolicies.length}
          subtitle="Regras específicas"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          title="Conformidade"
          value={`${overallCompliance}%`}
          subtitle="Últimos 30 dias"
          icon={<CheckCircle2 className="h-5 w-5" />}
          trend="up"
        />
      </div>

      <Card className="mb-6 border-slate-200 bg-gradient-to-r from-brand-50 via-white to-slate-50">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">SLA global padrão</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4 font-medium">Prioridade</th>
                <th className="pb-3 pr-4 font-medium">1ª Resposta</th>
                <th className="pb-3 pr-4 font-medium">Resolução</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {globalPolicies.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4">
                    <Badge variant={enumVariant(p.prioridade)}>{PRIORITY_LABELS[p.prioridade]}</Badge>
                  </td>
                  <td className="py-3 pr-4">{formatDuration(p.minutosPrimeiraResposta)}</td>
                  <td className="py-3 pr-4">{formatDuration(p.minutosResolucao)}</td>
                  <td className="py-3">
                    <Badge variant={p.ativo ? "resolvido" : "fechado"}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {deptPolicies.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">SLA por departamento</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Departamento</th>
                  <th className="pb-3 pr-4 font-medium">Prioridade</th>
                  <th className="pb-3 pr-4 font-medium">1ª Resposta</th>
                  <th className="pb-3 font-medium">Resolução</th>
                  <th className="pb-3 font-medium">Últimos 30 dias</th>
                </tr>
              </thead>
              <tbody>
                {deptPolicies.map((p) => {
                  const metric = deptMetrics.find((item) => item.id === p.idDepartamento);
                  return (
                    <tr key={p.id} className="border-b border-slate-50">
                      <td className="py-3 pr-4">{p.departamento?.nome}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={enumVariant(p.prioridade)}>{PRIORITY_LABELS[p.prioridade]}</Badge>
                      </td>
                      <td className="py-3 pr-4">{formatDuration(p.minutosPrimeiraResposta)}</td>
                      <td className="py-3">{formatDuration(p.minutosResolucao)}</td>
                      <td className="py-3">
                        {metric ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-700">{metric.compliance}%</span>
                            <span className="text-xs text-slate-500">({metric.met}/{metric.total})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Sem dados</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="bg-slate-50">
        <h3 className="mb-3 font-semibold">Como funciona</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">1. Definição automática</p>
            <p className="mt-1 text-sm text-slate-600">Ao criar um ticket, o SLA é calculado automaticamente com base na prioridade.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">2. Sobrescrita por fila</p>
            <p className="mt-1 text-sm text-slate-600">Políticas por departamento sobrescrevem as globais quando aplicáveis.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">3. Estado de risco</p>
            <p className="mt-1 text-sm text-slate-600">No prazo → Em risco (25% restante) → Violado.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">4. Performance da equipe</p>
            <p className="mt-1 text-sm text-slate-600">Agentes ganham pontos quando resolvem dentro do SLA.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
