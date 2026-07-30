"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/badge";

const initialState = {
  name: "",
  email: "",
  password: "",
  role: "AGENT" as "ADMIN" | "SUPERVISOR" | "AGENT",
  departmentId: "",
  isActive: true,
};

export function CreateAgentForm({ departments }: { departments: Array<{ id: string; name: string }> }) {
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

    const response = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        departmentId: form.departmentId || undefined,
        isActive: form.isActive,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data?.error || "Não foi possível criar o agente.");
      setLoading(false);
      return;
    }

    setMessage("Agente cadastrado com sucesso!");
    setForm(initialState);
    router.refresh();
    setLoading(false);
  }

  return (
    <Card className="mb-8 border-dashed border-slate-300 bg-slate-50/70">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Adicionar agente</h2>
          <p className="text-sm text-slate-500">Cadastre colaboradores e associe ao departamento correto.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            placeholder="Ex: Caroline Vidal"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            placeholder="caroline@empresa.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Função</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "SUPERVISOR" | "AGENT" })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="AGENT">Agente</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Departamento</label>
          <select
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Sem departamento</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select
            value={form.isActive ? "true" : "false"}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}
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
            {loading ? "Salvando..." : "Salvar agente"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
