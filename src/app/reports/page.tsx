import { getReportData } from "@/lib/analytics";
import { PageHeader, Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, SOURCE_LABELS, enumVariant } from "@/lib/utils";
import { ReportsChart } from "@/components/reports/chart";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getReportData(30);

  const totalResolved = data.resolvedByDepartment.reduce(
    (acc, d) => acc + d.chamados.length,
    0
  );

  const slaMetCount = data.resolvedByDepartment.reduce(
    (acc, d) => acc + d.chamados.filter((t) => t.statusSla === "CUMPRIDO").length,
    0
  );

  return (
    <div className="p-8">
      <PageHeader
        title="Relatórios"
        description={`Análise dos últimos ${data.periodDays} dias`}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600">{totalResolved}</p>
          <p className="text-sm text-slate-500">Tickets resolvidos</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-emerald-600">
            {totalResolved > 0 ? Math.round((slaMetCount / totalResolved) * 100) : 0}%
          </p>
          <p className="text-sm text-slate-500">SLA cumprido</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600">{data.resolvedByAgent.length}</p>
          <p className="text-sm text-slate-500">Agentes ativos</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600">{data.resolvedByDepartment.length}</p>
          <p className="text-sm text-slate-500">Departamentos</p>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Resolvidos por agente</h2>
          <div className="space-y-3">
            {data.resolvedByAgent
              .filter((a) => a.chamadosAtribuidos.length > 0)
              .slice(0, 10)
              .map((agent) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{agent.nome}</p>
                    <p className="text-xs text-slate-500">{agent.departamento?.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-600">{agent.chamadosAtribuidos.length}</p>
                    <p className="text-xs text-slate-500">{agent.pontosTotais} pts</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Resolvidos por departamento</h2>
          <div className="space-y-3">
            {data.resolvedByDepartment.map((dept) => {
              const met = dept.chamados.filter((t) => t.statusSla === "CUMPRIDO").length;
              return (
                <div key={dept.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dept.cor }} />
                    <span className="text-sm font-medium">{dept.nome}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{dept.chamados.length} resolvidos</p>
                    <p className="text-xs text-emerald-600">{met} com SLA ok</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Por prioridade</h2>
          <div className="flex flex-wrap gap-3">
            {data.byPriority.map((p) => (
              <div key={p.prioridade} className="rounded-lg bg-slate-50 px-4 py-3 text-center">
                <Badge variant={enumVariant(p.prioridade)}>{PRIORITY_LABELS[p.prioridade]}</Badge>
                <p className="mt-2 text-2xl font-bold">{p._count.id}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Por origem (canal)</h2>
          <div className="flex flex-wrap gap-3">
            {data.bySource.map((s) => (
              <div key={s.origem} className="rounded-lg bg-slate-50 px-4 py-3 text-center">
                <Badge variant={enumVariant(s.origem)}>{SOURCE_LABELS[s.origem]}</Badge>
                <p className="mt-2 text-2xl font-bold">{s._count.id}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ReportsChart timeline={data.timeline} />
    </div>
  );
}
