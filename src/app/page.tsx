import Link from "next/link";
import { Ticket, Clock, CheckCircle, AlertTriangle, Users } from "lucide-react";
import { getDashboardStats } from "@/lib/analytics";
import { Card, StatCard, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTicketNumber, STATUS_LABELS, PRIORITY_LABELS, enumVariant } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        description="Visão Geral Do Suporte Interno"
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tickets Abertos"
          value={stats.openTickets}
          subtitle={`${stats.inProgressTickets} Em Andamento`}
          icon={<Ticket className="h-5 w-5" />}
        />
        <StatCard
          title="Resolvidos Hoje"
          value={stats.resolvedToday}
          subtitle={`${stats.resolvedWeek} Na Última Semana`}
          icon={<CheckCircle className="h-5 w-5" />}
          trend="up"
        />
        <StatCard
          title="Conformidade SLA"
          value={`${stats.slaCompliance}%`}
          subtitle={`${stats.slaBreached} Violados`}
          icon={<Clock className="h-5 w-5" />}
          trend={stats.slaCompliance >= 90 ? "up" : "down"}
        />
        <StatCard
          title="Agentes Ativos"
          value={stats.totalAgents}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Tickets Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-3 pr-4 font-medium">#</th>
                  <th className="pb-3 pr-4 font-medium">Assunto</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Prioridade</th>
                  <th className="pb-3 font-medium">Criado</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 pr-4">
                      <Link href={`/tickets/${ticket.id}`} className="font-mono text-brand-600 hover:underline">
                        {formatTicketNumber(ticket.numeroChamado)}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate py-3 pr-4">{ticket.assunto}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={enumVariant(ticket.status)}>
                        {STATUS_LABELS[ticket.status]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={enumVariant(ticket.prioridade)}>
                        {PRIORITY_LABELS[ticket.prioridade]}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-500">
                      {formatDistanceToNow(ticket.criadoEm, { addSuffix: true, locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Ranking De Agentes
            </h2>
            <div className="space-y-3">
              {stats.topAgents.map((agent, i) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{agent.nome}</p>
                      <p className="text-xs text-slate-500">{agent.departamento?.nome || "Sem dept."}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-brand-600">{agent.pontosTotais} pts</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Por Departamento</h2>
            <div className="space-y-2">
              {stats.byDepartment.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dept.cor }} />
                    <span className="text-sm font-medium">{dept.nome}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {dept._count.chamados} Tickets · {dept._count.atendentes} Agentes
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
