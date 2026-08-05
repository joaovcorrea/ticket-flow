"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatTicketNumber, STATUS_LABELS, PRIORITY_LABELS, SOURCE_LABELS, enumVariant } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock3, GripVertical, Sparkles, Search } from "lucide-react";

interface TicketItem {
  id: number;
  numeroChamado: number;
  assunto: string;
  status: string;
  prioridade: string;
  origem: string;
  nomeSolicitante: string;
  criadoEm: string | Date;
  departamento: { nome: string } | null;
  atendenteResponsavel: { nome: string } | null;
}

interface KanbanBoardProps {
  initialTickets: TicketItem[];
}

const STATUS_ORDER = ["ABERTO", "PENDENTE", "EM_ANDAMENTO", "RESOLVIDO", "FECHADO"] as const;

function getColumnTone(status: string) {
  switch (status) {
    case "ABERTO":
      return "border-sky-200 bg-sky-50";
    case "PENDENTE":
      return "border-amber-200 bg-amber-50";
    case "EM_ANDAMENTO":
      return "border-violet-200 bg-violet-50";
    case "RESOLVIDO":
      return "border-emerald-200 bg-emerald-50";
    case "FECHADO":
      return "border-slate-200 bg-slate-100";
    default:
      return "border-slate-200 bg-slate-100";
  }
}

export function KanbanBoard({ initialTickets }: KanbanBoardProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [draggedTicketId, setDraggedTicketId] = useState<number | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const filteredTickets = useMemo(() => {
  const term = search.trim().toLowerCase();

  if (!term) return tickets;

  return tickets.filter((ticket) => {
    return (
      String(ticket.numeroChamado).includes(term) ||
      ticket.assunto.toLowerCase().includes(term) ||
      ticket.nomeSolicitante.toLowerCase().includes(term) ||
      ticket.departamento?.nome.toLowerCase().includes(term) ||
      ticket.atendenteResponsavel?.nome.toLowerCase().includes(term) ||
      ticket.status.toLowerCase().includes(term)
    );
  });
}, [tickets, search]);

const grouped = useMemo(() => {
  return STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = filteredTickets.filter(
        (ticket) => ticket.status === status
      );

      return acc;
    },
    {} as Record<string, TicketItem[]>
  );
}, [filteredTickets]);

const summary = useMemo(() => {
  const openCount = filteredTickets.filter(
    (ticket) =>
      ticket.status === "ABERTO" ||
      ticket.status === "PENDENTE"
  ).length;

  const urgentCount = filteredTickets.filter(
    (ticket) => ticket.prioridade === "URGENTE"
  ).length;

  return { openCount, urgentCount };
}, [filteredTickets]);

  async function moveTicket(ticketId: number, status: string) {
    if (!ticketId || !status) return;

    try {
      setUpdatingId(ticketId);
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error(`Falha ao atualizar status: ${res.status}`);
      }

      const updated = await res.json();
      setTickets((current) =>
        current.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: updated.status } : ticket))
      );
    } catch (error) {
      console.error("Erro Ao Mover Ticket", error);
    } finally {
      setUpdatingId(null);
      setDraggedTicketId(null);
      setActiveStatus(null);
    }
  }

return (
  <div className="space-y-6">

    {/* Barra de pesquisa */}
    <div className="flex justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 transition focus-within:border-brand-500">
          <Search className="h-4 w-4 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por número, assunto, solicitante..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
            >
              Limpar
            </button>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {filteredTickets.length} ticket(s) encontrado(s)
        </p>
      </div>
    </div>


    {/* Cards de resumo */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-brand-700">
          <Sparkles className="h-4 w-4" />
          <p className="text-sm font-semibold">Painel De Operação</p>
        </div>

        <p className="mt-3 text-3xl font-bold text-slate-900">
          {tickets.length}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Tickets Em Andamento
        </p>
      </div>


      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-amber-600">
          <Clock3 className="h-4 w-4" />
          <p className="text-sm font-semibold">Pendentes</p>
        </div>

        <p className="mt-3 text-3xl font-bold text-slate-900">
          {summary.openCount}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Aguardando Ação
        </p>
      </div>


      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-rose-600">
          <Clock3 className="h-4 w-4" />
          <p className="text-sm font-semibold">Urgentes</p>
        </div>

        <p className="mt-3 text-3xl font-bold text-slate-900">
          {summary.urgentCount}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Alta Prioridade
        </p>
      </div>

    </div>


    {/* Kanban */}
    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">Quadro Kanban</p>
            <p className="text-xs text-slate-500">Arraste Os Cards Para Alterar O Status</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Arraste E Solte
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          {STATUS_ORDER.map((status) => {
            const columnTickets = grouped[status] || [];
            const isActive = activeStatus === status;

            return (
              <div
                key={status}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setActiveStatus(status);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const ticketId = Number(event.dataTransfer.getData("text/plain") || draggedTicketId);
                  if (ticketId) {
                    void moveTicket(ticketId, status);
                  }
                }}
                className={`min-h-[360px] rounded-2xl border p-2.5 transition-all ${getColumnTone(status)} ${isActive ? "border-brand-400 bg-brand-50/80 ring-2 ring-brand-300" : ""}`}
              >
                <div className="mb-2.5 flex items-center justify-between rounded-xl border border-white/70 bg-white/70 px-2.5 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{STATUS_LABELS[status]}</p>
                    <p className="text-xs text-slate-500">{columnTickets.length} tickets</p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                    {columnTickets.length}
                  </div>
                </div>

                <div className="space-y-2">
                  {columnTickets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 text-center text-xs text-slate-400">
                      Nenhum Ticket Aqui
                    </div>
                  ) : (
                    columnTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", String(ticket.id));
                          setDraggedTicketId(ticket.id);
                          setActiveStatus(null);
                        }}
                        onDragEnd={() => {
                          setDraggedTicketId(null);
                          setActiveStatus(null);
                        }}
                        onClick={() => router.push(`/tickets/${ticket.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/tickets/${ticket.id}`);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={`cursor-grab rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${updatingId === ticket.id ? "opacity-70" : ""}`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-xs font-semibold text-brand-600">{formatTicketNumber(ticket.numeroChamado)}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{ticket.assunto}</p>
                          </div>
                          <div className="rounded-full bg-slate-100 p-1 text-slate-500">
                            <GripVertical className="h-3.5 w-3.5" />
                          </div>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge variant={enumVariant(ticket.prioridade)}>{PRIORITY_LABELS[ticket.prioridade]}</Badge>
                          <Badge variant={enumVariant(ticket.origem)}>{SOURCE_LABELS[ticket.origem]}</Badge>
                        </div>

                        <p className="text-xs text-slate-500">{ticket.nomeSolicitante}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {ticket.departamento?.nome || "Sem Departamento"}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{ticket.atendenteResponsavel?.nome || "Não Atribuído"}</span>
                          <span>{formatDistanceToNow(new Date(ticket.criadoEm), { addSuffix: true, locale: ptBR })}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`/tickets/${ticket.id}`);
                            }}
                            className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-100"
                          >
                            Abrir Ticket
                          </button>
                        </div>

                        {updatingId === ticket.id && (
                          <div className="mt-2 text-[11px] font-medium text-brand-600">Atualizando...</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
