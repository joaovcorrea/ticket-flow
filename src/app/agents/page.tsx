import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/utils";
import { Trophy, Star } from "lucide-react";
import { CreateAgentForm } from "@/components/admin/create-agent-form";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const [agents, departments] = await Promise.all([
    prisma.atendente.findMany({
      include: {
        departamento: true,
        registrosPontos: { orderBy: { criadoEm: "desc" }, take: 5 },
        _count: { select: { chamadosAtribuidos: true } },
      },
      orderBy: { pontosTotais: "desc" },
    }),
    prisma.departamento.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="p-8">
      <PageHeader
        title="Agentes"
        description="Equipe de suporte e ranking de pontos"
      />

      <CreateAgentForm departments={departments} />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {agents.slice(0, 3).map((agent, i) => (
          <Card key={agent.id} className={i === 0 ? "border-amber-300 bg-amber-50/50" : ""}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${i === 0 ? "bg-amber-200 text-amber-800" : "bg-brand-100 text-brand-700"}`}>
                {i === 0 ? <Trophy className="h-5 w-5" /> : <Star className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold">{agent.nome}</p>
                <p className="text-xs text-slate-500">{agent.departamento?.nome || "Sem departamento"}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xl font-bold text-brand-600">{agent.pontosTotais}</p>
                <p className="text-xs text-slate-500">pontos</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Agente</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Departamento</th>
              <th className="px-4 py-3 font-medium">Função</th>
              <th className="px-4 py-3 font-medium">Tickets</th>
              <th className="px-4 py-3 font-medium">Pontos</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, i) => (
              <tr key={agent.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{agent.nome}</td>
                <td className="px-4 py-3 text-slate-500">{agent.email}</td>
                <td className="px-4 py-3">{agent.departamento?.nome || "—"}</td>
                <td className="px-4 py-3">
                  <Badge>{ROLE_LABELS[agent.papel]}</Badge>
                </td>
                <td className="px-4 py-3">{agent._count.chamadosAtribuidos}</td>
                <td className="px-4 py-3 font-bold text-brand-600">{agent.pontosTotais}</td>
                <td className="px-4 py-3">
                  <Badge variant={agent.ativo ? "resolvido" : "fechado"}>
                    {agent.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Sistema de pontos</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Ticket resolvido", pts: 10 },
            { label: "SLA cumprido", pts: 5 },
            { label: "Primeira resposta", pts: 3 },
            { label: "Satisfação do cliente", pts: 8 },
          ].map((item) => (
            <Card key={item.label} className="text-center">
              <p className="text-2xl font-bold text-brand-600">+{item.pts}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
