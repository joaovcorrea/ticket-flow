"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/modal";

interface DepartmentSlaPolicy {
  id: number;
  prioridade: string;
  minutosResolucao: number;
}

interface Department {
  id: number;
  nome: string;
  descricao?: string | null;
  cor: string;
  ativo: boolean;
  politicasSla: DepartmentSlaPolicy[];
  atendentes: Array<{ id: number; nome: string }>;
  _count: { chamados: number };
}

export function DepartmentCard({ dept }: { dept: Department }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nome: dept.nome, descricao: dept.descricao || "", cor: dept.cor || "#3B82F6", ativo: dept.ativo });
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  useEffect(() => {
    setForm({ nome: dept.nome, descricao: dept.descricao || "", cor: dept.cor || "#3B82F6", ativo: dept.ativo });
  }, [dept]);

  async function fetchAgents() {
    setLoadingAgents(true);
    const res = await fetch("/api/agents");
    const data = await res.json();
    setAgents(data);
    setLoadingAgents(false);
  }

  async function save() {
    await fetch(`/api/departments/${dept.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowModal(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Confirma exclusão do departamento?")) return;
    await fetch(`/api/departments/${dept.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function toggleActive() {
    await fetch(`/api/departments/${dept.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !form.ativo }) });
    router.refresh();
  }

  async function toggleAgentAssignment(agentId: number, assign: boolean) {
    await fetch(`/api/agents/${agentId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idDepartamento: assign ? dept.id : null }) });
    await fetchAgents();
    router.refresh();
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: dept.cor }} />
        <h3 className="text-lg font-semibold">{dept.nome}</h3>
        {!dept.ativo ? <Badge variant="fechado">Inativo</Badge> : <Badge variant="resolvido">Ativo</Badge>}
      </div>

      <div>
        {dept.descricao && <p className="mb-4 text-sm text-slate-500">{dept.descricao}</p>}

        <div className="mb-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-2xl font-bold text-brand-600">{dept.atendentes.length}</p>
            <p className="text-xs text-slate-500">Agentes</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-2xl font-bold text-brand-600">{dept._count.chamados}</p>
            <p className="text-xs text-slate-500">Tickets</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">Políticas SLA</p>
          <div className="flex flex-wrap gap-1">
            {dept.politicasSla.map((p) => (
              <Badge key={p.id} variant={p.prioridade.toLowerCase()}>
                {p.prioridade}: {p.minutosResolucao}min
              </Badge>
            ))}
            {dept.politicasSla.length === 0 && (
              <span className="text-xs text-slate-400">Usando SLA global</span>
            )}
          </div>
        </div>

        <div className="mt-4 border-t pt-3">
          <p className="mb-2 text-xs font-medium text-slate-500">Equipe</p>
          <div className="flex flex-wrap gap-2">
            {dept.atendentes.length > 0 ? (
              dept.atendentes.map((a: any) => (
                <span key={a.id} className="rounded-full bg-slate-100 px-2 py-1 text-xs">{a.nome}</span>
              ))
            ) : (
              <span className="text-xs text-slate-400">Nenhum agente ativo</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={() => { setForm({ nome: dept.nome, descricao: dept.descricao || "", cor: dept.cor || "#3B82F6", ativo: dept.ativo }); setShowModal(true); }}>Gerenciar</Button>
          <Button variant="danger" onClick={remove}>Excluir</Button>
          <Button variant="ghost" onClick={toggleActive}>{form.ativo ? "Inativar" : "Ativar"}</Button>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Gerenciar: ${dept.nome}`}>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
            <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div className="flex items-center gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cor</label>
              <input type="color" value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} className="h-10 w-16 cursor-pointer rounded" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm">Ativo</label>
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">Atribuir agentes</p>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={fetchAgents} className="mb-2">Carregar agentes</Button>
              {loadingAgents && <div>Carregando agentes...</div>}
              {agents.map((a) => (
                <label key={a.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={a.idDepartamento === dept.id} onChange={(e) => toggleAgentAssignment(a.id, e.target.checked)} />
                  <span className="text-sm">{a.nome} <span className="text-xs text-slate-400">{a.email}</span></span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
