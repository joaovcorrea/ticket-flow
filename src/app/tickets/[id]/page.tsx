"use client";

import { useEffect, useRef, useState } from "react";
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
import { Send, ArrowLeft, MessageCircle, User, Clock3, RefreshCw, Building2, CheckCircle2 } from "lucide-react";
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

function getActivityMeta(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes("status") || normalized.includes("atualiz")) {
    return { icon: RefreshCw, tone: "border-blue-200 bg-blue-50 text-blue-700" };
  }

  if (normalized.includes("nota") || normalized.includes("interna")) {
    return { icon: MessageCircle, tone: "border-amber-200 bg-amber-50 text-amber-700" };
  }

  if (normalized.includes("depart") || normalized.includes("transfer")) {
    return { icon: Building2, tone: "border-violet-200 bg-violet-50 text-violet-700" };
  }

  if (normalized.includes("agente") || normalized.includes("respons")) {
    return { icon: User, tone: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }

  return { icon: CheckCircle2, tone: "border-slate-200 bg-slate-50 text-slate-700" };
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
  const [activeTab, setActiveTab] = useState<"conversation" | "audit">("conversation");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  function openInternalNote() {
    setIsInternal(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
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

      <Card className="mb-6 border-slate-200 bg-gradient-to-r from-brand-50 via-white to-slate-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant={ticket.priority.toLowerCase()}>{PRIORITY_LABELS[ticket.priority]}</Badge>
              <Badge variant={ticket.slaStatus.toLowerCase()}>{SLA_LABELS[ticket.slaStatus]}</Badge>
              <Badge variant={ticket.source.toLowerCase()}>{SOURCE_LABELS[ticket.source]}</Badge>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{ticket.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Departamento</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                {ticket.department?.name || "Sem departamento"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Responsável</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {ticket.assignedAgent?.name || "Não atribuído"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_0.9fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Conversa</h3>
                    <p className="text-sm text-slate-500">{ticket.messages.length} mensagens · {ticket.requesterName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {ticket.assignedAgent?.name || "Sem agente"}
                </div>
              </div>
            </div>

            <div className="flex border-b border-slate-200 bg-white px-3 py-2">
              <button
                type="button"
                onClick={() => setActiveTab("conversation")}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${activeTab === "conversation" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Conversa
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${activeTab === "audit" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Auditoria
              </button>
            </div>

            {activeTab === "conversation" ? (
              <>
                <div className="max-h-[640px] space-y-4 overflow-y-auto bg-slate-50/70 p-5">
                  {ticket.messages.length > 0 ? (
                    ticket.messages.map((msg) => {
                      const isCustomer = !msg.isFromAgent && !msg.isInternal;
                      const bubbleClass = msg.isInternal
                        ? "border-amber-200 bg-amber-50"
                        : msg.isFromAgent
                          ? "border-brand-200 bg-brand-50"
                          : "border-slate-200 bg-white";

                      return (
                        <div key={msg.id} className={`flex ${msg.isFromAgent ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${bubbleClass}`}>
                            <div className="mb-2 flex items-center gap-2 text-xs">
                              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${msg.isFromAgent ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                                <User className="h-3.5 w-3.5" />
                              </span>
                              <span className="font-semibold text-slate-700">
                                {msg.isFromAgent ? msg.agent?.name || "Agente" : ticket.requesterName}
                              </span>
                              {msg.isInternal && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                  Interna
                                </span>
                              )}
                              <span className="ml-auto text-[11px] text-slate-400">
                                {format(new Date(msg.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{msg.content}</p>
                            {isCustomer && (
                              <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">Cliente</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                      Ainda não há mensagens nesta conversa.
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1.5 text-sm font-medium ${!isInternal ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}
                      onClick={() => setIsInternal(false)}
                    >
                      Resposta
                    </button>
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1.5 text-sm font-medium ${isInternal ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"}`}
                      onClick={() => setIsInternal(true)}
                    >
                      Nota interna
                    </button>
                    <button
                      type="button"
                      onClick={openInternalNote}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                    >
                      + Nota interna
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isInternal ? "Escreva uma nota interna..." : "Escreva uma resposta ao cliente..."}
                    rows={4}
                    className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      {isInternal ? "Visível apenas para a equipe" : "Envia para o canal do cliente"}
                    </p>
                    <Button onClick={sendMessage} disabled={loading}>
                      <Send className="mr-1 h-4 w-4" /> Enviar
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="max-h-[640px] overflow-y-auto bg-slate-50/70 p-5">
                <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Linha do tempo do ticket</p>
                    <p className="text-xs text-slate-500">{ticket.activities.length} eventos registrados</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                    Em tempo real
                  </span>
                </div>

                <div className="relative space-y-4 border-l border-slate-200 pl-5">
                  {ticket.activities.map((act) => {
                    const meta = getActivityMeta(act.action);
                    const Icon = meta.icon;

                    return (
                      <div key={act.id} className="relative">
                        <span className={`absolute -left-[1.55rem] top-2 flex h-8 w-8 items-center justify-center rounded-full border ${meta.tone}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-slate-800">{act.action}</p>
                            <span className="text-[11px] text-slate-400">
                              {format(new Date(act.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {act.details && <p className="mt-2 text-sm text-slate-600">{act.details}</p>}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {act.agent ? (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                Por {act.agent.name}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-600">
                              Registro de atendimento
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 font-semibold">Propriedades</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => updateTicket({ status: e.target.value, agentId: agents[0]?.id })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Prioridade</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => updateTicket({ priority: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                >
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Departamento</label>
                <select
                  value={ticket.department?.id || ""}
                  onChange={(e) => updateTicket({ departmentId: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                >
                  <option value="">Sem departamento</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Agente responsável</label>
                <select
                  value={ticket.assignedAgent?.id || ""}
                  onChange={(e) => updateTicket({ assignedAgentId: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
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
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Clock3 className="h-4 w-4 text-brand-600" /> SLA
            </h3>
            <div className="space-y-2 text-sm">
              {ticket.firstResponseDueAt && (
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">1ª resposta até</p>
                  <p className="mt-1 text-slate-700">{format(new Date(ticket.firstResponseDueAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
              )}
              {ticket.slaDueAt && (
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Resolução até</p>
                  <p className="mt-1 text-slate-700">{format(new Date(ticket.slaDueAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold">Auditoria</h3>
            <div className="max-h-64 space-y-2 overflow-y-auto text-xs">
              {ticket.activities.map((act) => (
                <div key={act.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="font-medium text-slate-700">{act.action}</p>
                  {act.details && (
                    <p className="mt-1 text-slate-500">{act.details}</p>
                  )}
                  <p className="mt-1 text-slate-400">
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
