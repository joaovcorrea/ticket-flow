"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/badge";

const initialState = {
  nome: "",
  descricao: "",
  cor: "#3B82F6",
  ativo: true,
};

export function CreateDepartmentForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        ativo: form.ativo,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data?.error || "Não foi possível criar o departamento.");
      setLoading(false);
      return;
    }

    setMessage("Departamento cadastrado com sucesso!");
    setForm(initialState);
    router.refresh();
    setLoading(false);
  }

  return (
    <Card className="mb-8 border-dashed border-slate-300 bg-slate-50/70">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Adicionar departamento</h2>
          <p className="text-sm text-slate-500">Crie novas filas para organizar o atendimento.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
          <input
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            placeholder="Ex: Suporte Técnico"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            placeholder="Descreva o escopo do departamento"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cor</label>
          <input
            type="color"
            value={form.cor}
            onChange={(e) => setForm({ ...form, cor: e.target.value })}
            className="h-10 w-full cursor-pointer rounded-lg border border-slate-300"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select
            value={form.ativo ? "true" : "false"}
            onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <div>
            {message && <p className="text-sm text-emerald-600">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Salvando..." : "Salvar departamento"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
