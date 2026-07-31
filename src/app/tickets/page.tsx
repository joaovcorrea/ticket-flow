import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/card";
import { KanbanBoard } from "@/components/tickets/kanban-board";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const tickets = await prisma.chamado.findMany({
    include: { departamento: true, atendenteResponsavel: true },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Tickets"
        description="Organize a fila por status com um quadro visual tipo Kanban"
        action={
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Novo Ticket
          </Link>
        }
      />

      <KanbanBoard initialTickets={tickets.map((ticket) => ({
        id: ticket.id,
        numeroChamado: ticket.numeroChamado,
        assunto: ticket.assunto,
        status: ticket.status,
        prioridade: ticket.prioridade,
        origem: ticket.origem,
        nomeSolicitante: ticket.nomeSolicitante,
        criadoEm: ticket.criadoEm,
        departamento: ticket.departamento,
        atendenteResponsavel: ticket.atendenteResponsavel,
      }))} />
    </div>
  );
}
