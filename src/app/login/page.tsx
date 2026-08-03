"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/badge";
import { UserCircle2, Lock } from "lucide-react";
import { setStoredUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Não foi possível fazer login.");
      setLoading(false);
      return;
    }

    setStoredUser(data);
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_25%)]" />
        <div className="relative flex w-full flex-col gap-10 lg:flex-row lg:items-stretch">
          <section className="flex-1 rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <span className="inline-flex rounded-full bg-brand-600/10 px-3 py-1 text-sm font-semibold text-brand-200 ring-1 ring-brand-500/20">
              Portal de atendimento
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              O suporte que sua operação merece.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Entre para a plataforma e comece a controlar tickets, monitorar SLA e alinhar os agentes por departamento com muito mais velocidade.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-brand-400/30 hover:bg-brand-500/5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Organização</p>
                <p className="mt-3 text-lg font-semibold text-white">Todas as filas centralizadas</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-brand-400/30 hover:bg-brand-500/5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Visão</p>
                <p className="mt-3 text-lg font-semibold text-white">Painel de tickets em tempo real</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-brand-400/30 hover:bg-brand-500/5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Desempenho</p>
                <p className="mt-3 text-lg font-semibold text-white">SLA sob controle</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-brand-400/30 hover:bg-brand-500/5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Equipe</p>
                <p className="mt-3 text-lg font-semibold text-white">Atendimento colaborativo</p>
              </div>
            </div>
          </section>

          <section className="w-full max-w-md rounded-[2rem] bg-white/95 px-8 py-10 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:px-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Bem-vindo</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">Conecte seu acesso</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-600 text-white shadow-brand-500/20 shadow-lg">
                <UserCircle2 className="h-6 w-6" />
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@exemplo.com"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Senha</label>
                <div className="flex items-center rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                  <Lock className="mr-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full rounded-3xl px-5 py-3 text-sm font-semibold shadow-lg shadow-brand-400/10">
                {loading ? "Entrando..." : "Entrar agora"}
              </Button>
            </form>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Dicas para início rápido</p>
              <ul className="mt-3 space-y-2">
                <li>• Use o e-mail cadastrado para entrar.</li>
                <li>• Se ainda não tiver cadastro, crie uma conta agora.</li>
              </ul>
            </div>

            <div className="mt-6 text-center text-sm text-slate-500">
              Não tem conta? <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">Cadastre-se</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
