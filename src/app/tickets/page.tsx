import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTicketNumber, STATUS_LABELS, PRIORITY_LABELS, SOURCE_LABELS } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const tickets = await prisma.ticket.findMany({
    where: status ? { status: status as never } : undefined,
    include: { department: true, assignedAgent: true },
    orderBy: { createdAt: "desc" },
  });

  const statuses = ["OPEN", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  return (
    <div className="p-8">
      <PageHeader
        title="Tickets"
        description="Gerencie todas as solicitações de clientes"
        action={
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Novo ticket
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/tickets"
          className={`rounded-full px-3 py-1 text-xs font-medium ${!status ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Todos
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/tickets?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${status === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Assunto</th>
              <th className="px-4 py-3 font-medium">Solicitante</th>
              <th className="px-4 py-3 font-medium">Departamento</th>
              <th className="px-4 py-3 font-medium">Agente</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Prioridade</th>
              <th className="px-4 py-3 font-medium">Origem</th>
              <th className="px-4 py-3 font-medium">Criado</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/tickets/${ticket.id}`} className="font-mono font-medium text-brand-600 hover:underline">
                    {formatTicketNumber(ticket.ticketNumber)}
                  </Link>
                </td>
                <td className="max-w-xs truncate px-4 py-3">{ticket.subject}</td>
                <td className="px-4 py-3">{ticket.requesterName}</td>
                <td className="px-4 py-3">{ticket.department?.name || "—"}</td>
                <td className="px-4 py-3">{ticket.assignedAgent?.name || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={ticket.status.toLowerCase()}>{STATUS_LABELS[ticket.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ticket.priority.toLowerCase()}>{PRIORITY_LABELS[ticket.priority]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ticket.source.toLowerCase()}>{SOURCE_LABELS[ticket.source]}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDistanceToNow(ticket.createdAt, { addSuffix: true, locale: ptBR })}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  Nenhum ticket encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
