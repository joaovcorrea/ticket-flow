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
        assunto: form.get("assunto"),
        descricao: form.get("descricao"),
        prioridade: form.get("prioridade"),
        origem: form.get("origem"),
        nomeSolicitante: form.get("nomeSolicitante"),
        telefoneSolicitante: form.get("telefoneSolicitante"),
        emailSolicitante: form.get("emailSolicitante"),
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
      <PageHeader title="Novo Ticket" description="Criar solicitação manualmente" />
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Assunto</label>
            <input name="assunto" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea name="descricao" required rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Prioridade</label>
              <select name="prioridade" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Origem</label>
              <select name="origem" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="WEB">Web</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">E-Mail</option>
                <option value="TELEFONE">Telefone</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Nome Do Solicitante</label>
            <input name="nomeSolicitante" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <input name="telefoneSolicitante" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <input name="emailSolicitante" type="email" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>
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
