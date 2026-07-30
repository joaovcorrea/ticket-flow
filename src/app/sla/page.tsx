import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SlaPage() {
  const policies = await prisma.slaPolicy.findMany({
    include: { department: true },
    orderBy: [{ departmentId: "asc" }, { priority: "asc" }],
  });

  const globalPolicies = policies.filter((p) => !p.departmentId);
  const deptPolicies = policies.filter((p) => p.departmentId);

  return (
    <div className="p-8">
      <PageHeader
        title="Políticas de SLA"
        description="Defina prazos de primeira resposta e resolução por prioridade"
      />

      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-semibold">SLA Global (padrão)</h2>
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
                    <Badge variant={p.priority.toLowerCase()}>{PRIORITY_LABELS[p.priority]}</Badge>
                  </td>
                  <td className="py-3 pr-4">{formatDuration(p.firstResponseMinutes)}</td>
                  <td className="py-3 pr-4">{formatDuration(p.resolutionMinutes)}</td>
                  <td className="py-3">
                    <Badge variant={p.isActive ? "resolved" : "closed"}>
                      {p.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {deptPolicies.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold">SLA por departamento</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Departamento</th>
                  <th className="pb-3 pr-4 font-medium">Prioridade</th>
                  <th className="pb-3 pr-4 font-medium">1ª Resposta</th>
                  <th className="pb-3 font-medium">Resolução</th>
                </tr>
              </thead>
              <tbody>
                {deptPolicies.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-3 pr-4">{p.department?.name}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={p.priority.toLowerCase()}>{PRIORITY_LABELS[p.priority]}</Badge>
                    </td>
                    <td className="py-3 pr-4">{formatDuration(p.firstResponseMinutes)}</td>
                    <td className="py-3">{formatDuration(p.resolutionMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="mt-6 bg-brand-50/50">
        <h3 className="mb-2 font-semibold">Como funciona</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Ao criar um ticket, o SLA é calculado automaticamente com base na prioridade</li>
          <li>Políticas por departamento sobrescrevem as globais</li>
          <li>Status: No prazo → Em risco (25% restante) → Violado</li>
          <li>Agentes ganham +5 pontos quando resolvem dentro do SLA</li>
        </ul>
      </Card>
    </div>
  );
}
