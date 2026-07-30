"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatTicketNumber, STATUS_LABELS, PRIORITY_LABELS, SOURCE_LABELS } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock3, GripVertical, Sparkles } from "lucide-react";

interface TicketItem {
  id: string;
  ticketNumber: number;
  subject: string;
  status: string;
  priority: string;
  source: string;
  requesterName: string;
  createdAt: string | Date;
  department: { name: string } | null;
  assignedAgent: { name: string } | null;
}

interface KanbanBoardProps {
  initialTickets: TicketItem[];
}

const STATUS_ORDER = ["OPEN", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

function getColumnTone(status: string) {
  switch (status) {
    case "OPEN":
      return "border-sky-200 bg-sky-50";
    case "PENDING":
      return "border-amber-200 bg-amber-50";
    case "IN_PROGRESS":
      return "border-violet-200 bg-violet-50";
    case "RESOLVED":
      return "border-emerald-200 bg-emerald-50";
    case "CLOSED":
      return "border-slate-200 bg-slate-100";
    default:
      return "border-slate-200 bg-slate-100";
  }
}

export function KanbanBoard({ initialTickets }: KanbanBoardProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return STATUS_ORDER.reduce(
      (acc, status) => {
        acc[status] = tickets.filter((ticket) => ticket.status === status);
        return acc;
      },
      {} as Record<string, TicketItem[]>
    );
  }, [tickets]);

  const summary = useMemo(() => {
    const openCount = tickets.filter((ticket) => ticket.status === "OPEN" || ticket.status === "PENDING").length;
    const urgentCount = tickets.filter((ticket) => ticket.priority === "URGENT").length;
    return { openCount, urgentCount };
  }, [tickets]);

  async function moveTicket(ticketId: string, status: string) {
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
      console.error("Erro ao mover ticket", error);
    } finally {
      setUpdatingId(null);
      setDraggedTicketId(null);
      setActiveStatus(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-semibold">Painel de operação</p>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{tickets.length}</p>
          <p className="mt-1 text-sm text-slate-500">Tickets em andamento</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock3 className="h-4 w-4" />
            <p className="text-sm font-semibold">Pendentes</p>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.openCount}</p>
          <p className="mt-1 text-sm text-slate-500">Aguardando ação</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600">
            <Clock3 className="h-4 w-4" />
            <p className="text-sm font-semibold">Urgentes</p>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.urgentCount}</p>
          <p className="mt-1 text-sm text-slate-500">Alta prioridade</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">Quadro Kanban</p>
            <p className="text-xs text-slate-500">Arraste os cards para alterar o status</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Arraste e solte
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
                  setActiveStatus(status);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const ticketId = event.dataTransfer.getData("text/plain") || draggedTicketId;
                  if (ticketId) {
                    void moveTicket(ticketId, status);
                  }
                }}
                className={`min-h-[360px] rounded-2xl border p-2.5 transition-all ${getColumnTone(status)} ${isActive ? "ring-2 ring-brand-400" : ""}`}
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
                      Nenhum ticket aqui
                    </div>
                  ) : (
                    columnTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", ticket.id);
                          setDraggedTicketId(ticket.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTicketId(null);
                          setActiveStatus(null);
                        }}
                        onClick={() => router.push(`/tickets/${ticket.id}`)}
                        className="cursor-grab rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-xs font-semibold text-brand-600">{formatTicketNumber(ticket.ticketNumber)}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{ticket.subject}</p>
                          </div>
                          <div className="rounded-full bg-slate-100 p-1 text-slate-500">
                            <GripVertical className="h-3.5 w-3.5" />
                          </div>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge variant={ticket.priority.toLowerCase()}>{PRIORITY_LABELS[ticket.priority]}</Badge>
                          <Badge variant={ticket.source.toLowerCase()}>{SOURCE_LABELS[ticket.source]}</Badge>
                        </div>

                        <p className="text-xs text-slate-500">{ticket.requesterName}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {ticket.department?.name || "Sem departamento"}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{ticket.assignedAgent?.name || "Não atribuído"}</span>
                          <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ptBR })}</span>
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
