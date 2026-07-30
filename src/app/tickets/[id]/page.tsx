"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/card";
import { Badge, Button } from "@/components/ui/badge";
import {
  formatTicketNumber,
  STATUS_LABELS,
  PRIORITY_LABELS,
  SLA_LABELS,
  SOURCE_LABELS,
  formatDuration,
} from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TicketDetail {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  source: string;
  slaStatus: string;
  requesterName: string;
  requesterPhone: string | null;
  slaDueAt: string | null;
  firstResponseDueAt: string | null;
  department: { id: string; name: string } | null;
  assignedAgent: { id: string; name: string } | null;
  messages: Array<{
    id: string;
    content: string;
    isFromAgent: boolean;
    isInternal: boolean;
    createdAt: string;
    agent: { name: string } | null;
  }>;
  activities: Array<{
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
    agent: { name: string } | null;
  }>;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setTicketId(id);
      fetch(`/api/tickets/${id}`).then((r) => r.json()).then(setTicket);
      fetch("/api/agents").then((r) => r.json()).then(setAgents);
      fetch("/api/departments").then((r) => r.json()).then(setDepartments);
    });
  }, [params]);

  async function updateTicket(data: Record<string, unknown>) {
    setLoading(true);
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await fetch(`/api/tickets/${ticketId}`).then((r) => r.json());
      setTicket(updated);
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!message.trim()) return;
    await updateTicket({ message, isInternal, agentId: agents[0]?.id });
    setMessage("");
  }

  if (!ticket) {
    return <div className="flex h-full items-center justify-center p-8 text-slate-400">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/tickets" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Voltar aos tickets
        </Link>
        <PageHeader
          title={`${formatTicketNumber(ticket.ticketNumber)} — ${ticket.subject}`}
          description={`Solicitante: ${ticket.requesterName}${ticket.requesterPhone ? ` · ${ticket.requesterPhone}` : ""}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <h3 className="mb-2 font-semibold">Descrição</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-600">{ticket.description}</p>
          </Card>

          <Card>
            <h3 className="mb-4 font-semibold">Conversas</h3>
            <div className="mb-4 max-h-96 space-y-3 overflow-y-auto">
              {ticket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 text-sm ${
                    msg.isInternal
                      ? "border border-amber-200 bg-amber-50"
                      : msg.isFromAgent
                        ? "ml-8 bg-brand-50"
                        : "mr-8 bg-slate-100"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{msg.isFromAgent ? msg.agent?.name || "Agente" : ticket.requesterName}</span>
                    <span>{format(new Date(msg.createdAt), "dd/MM HH:mm", { locale: ptBR })}</span>
                  </div>
                  <p>{msg.content}</p>
                  {msg.isInternal && <span className="mt-1 inline-block text-xs text-amber-600">Nota interna</span>}
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva uma resposta..."
                rows={3}
                className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                  Nota interna (não envia ao WhatsApp)
                </label>
                <Button onClick={sendMessage} disabled={loading}>
                  <Send className="mr-1 h-4 w-4" /> Enviar
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 font-semibold">Propriedades</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-500">Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => updateTicket({ status: e.target.value, agentId: agents[0]?.id })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Prioridade</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => updateTicket({ priority: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                >
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Departamento</label>
                <select
                  value={ticket.department?.id || ""}
                  onChange={(e) => updateTicket({ departmentId: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                >
                  <option value="">Sem departamento</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Agente responsável</label>
                <select
                  value={ticket.assignedAgent?.id || ""}
                  onChange={(e) => updateTicket({ assignedAgentId: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                >
                  <option value="">Não atribuído</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant={ticket.source.toLowerCase()}>{SOURCE_LABELS[ticket.source]}</Badge>
                <Badge variant={ticket.slaStatus.toLowerCase()}>{SLA_LABELS[ticket.slaStatus]}</Badge>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold">SLA</h3>
            <div className="space-y-2 text-sm">
              {ticket.firstResponseDueAt && (
                <div>
                  <p className="text-xs text-slate-500">1ª resposta até</p>
                  <p>{format(new Date(ticket.firstResponseDueAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
              )}
              {ticket.slaDueAt && (
                <div>
                  <p className="text-xs text-slate-500">Resolução até</p>
                  <p>{format(new Date(ticket.slaDueAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold">Atividades</h3>
            <div className="max-h-48 space-y-2 overflow-y-auto text-xs">
              {ticket.activities.map((act) => (
                <div key={act.id} className="border-b border-slate-50 pb-2">
                  <p className="font-medium">{act.action}</p>
                  <p className="text-slate-500">
                    {format(new Date(act.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                    {act.agent && ` · ${act.agent.name}`}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
