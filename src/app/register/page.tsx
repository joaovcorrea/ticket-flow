"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/badge";
import { UserPlus, Mail, Lock } from "lucide-react";
import { setStoredUser } from "@/lib/auth";

interface DepartmentOption {
  id: number;
  nome: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => setDepartments(data || []));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: name,
        email,
        senha: password,
        papel: "ATENDENTE",
        idDepartamento: departmentId ? Number(departmentId) : undefined,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Não foi possível criar sua conta.");
      setLoading(false);
      return;
    }

    setStoredUser(data);
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-slate-200">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Cadastrar</h1>
            <p className="text-sm text-slate-500">Crie seu acesso ao portal de suporte.</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
            <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
              <Mail className="mr-2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-0 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
            <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
              <Lock className="mr-2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border-0 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Departamento</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">Sem departamento</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.nome}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Já tem conta? <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">Entrar</Link>
        </div>
      </Card>
    </div>
  );
}
