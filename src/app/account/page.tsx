"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, Card } from "@/components/ui/card";
import { Badge, Button } from "@/components/ui/badge";
import { UserCircle2, Mail, ShieldCheck, Save } from "lucide-react";

interface AgentOption {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

export default function AccountPage() {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [agentId, setAgentId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgents() {
      const response = await fetch("/api/agents");
      const data = await response.json();
      setAgents(data);

      const storedId = window.localStorage.getItem("ticketflow-account-agent-id");
      const fallbackId = data[0]?.id || "";
      const selectedId = storedId && data.some((item: AgentOption) => item.id === storedId) ? storedId : fallbackId;

      if (selectedId) {
        setAgentId(selectedId);
        const selected = data.find((item: AgentOption) => item.id === selectedId);
        if (selected) {
          setName(selected.name);
          setEmail(selected.email);
          setAvatar(selected.avatar || null);
        }
      }
    }

    loadAgents();
  }, []);

  const selectedAgent = useMemo(() => agents.find((item) => item.id === agentId), [agents, agentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        name,
        email,
        password: password || undefined,
        avatar: avatar || null,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data?.error || "Não foi possível atualizar sua conta.");
      setLoading(false);
      return;
    }

    if (agentId) {
      window.localStorage.setItem("ticketflow-account-agent-id", agentId);
    }

    setMessage("Informações atualizadas com sucesso.");
    setPassword("");
    setLoading(false);
  }

  function handleAvatarSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Minha conta"
        description="Gerencie seus dados pessoais e preferências de acesso"
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 bg-gradient-to-br from-brand-50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-brand-100 text-brand-700">
              {avatar ? (
                <img src={avatar} alt={name || "Avatar"} className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 className="h-8 w-8" />
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{selectedAgent?.name || "Seu perfil"}</p>
              <p className="text-sm text-slate-500">{selectedAgent?.email || "Selecione um agente para editar"}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="resolved">Conta ativa</Badge>
            <Badge>{selectedAgent?.role || "Agente"}</Badge>
          </div>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Agente</label>
              <select
                value={agentId}
                onChange={(e) => {
                  const selected = agents.find((item) => item.id === e.target.value);
                  setAgentId(e.target.value);
                  if (selected) {
                    setName(selected.name);
                    setEmail(selected.email);
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                {agents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Foto de perfil</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-50">
                  Escolher imagem
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelection} />
                </label>
                <button
                  type="button"
                  onClick={() => setAvatar(null)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Remover foto
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">PNG, JPG ou WebP. A imagem será salva diretamente na sua conta.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nova senha</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full border-0 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div>
                {message && <p className="text-sm text-emerald-600">{message}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <Button type="submit" variant="primary" disabled={loading}>
                <Save className="mr-1 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
