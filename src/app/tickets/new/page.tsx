"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/badge";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: form.get("subject"),
        description: form.get("description"),
        priority: form.get("priority"),
        source: form.get("source"),
        requesterName: form.get("requesterName"),
        requesterPhone: form.get("requesterPhone"),
        requesterEmail: form.get("requesterEmail"),
      }),
    });

    if (res.ok) {
      const ticket = await res.json();
      router.push(`/tickets/${ticket.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="p-8">
      <PageHeader title="Novo ticket" description="Criar solicitação manualmente" />
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Assunto</label>
            <input name="subject" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea name="description" required rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Prioridade</label>
              <select name="priority" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Origem</label>
              <select name="source" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="WEB">Web</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">E-mail</option>
                <option value="PHONE">Telefone</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Nome do solicitante</label>
            <input name="requesterName" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <input name="requesterPhone" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <input name="requesterEmail" type="email" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>
          {/* <div>
            <label className="mb-1 block text-sm font-medium">ID do solicitante</label>
            <input name="requesterId" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div> */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar ticket"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
