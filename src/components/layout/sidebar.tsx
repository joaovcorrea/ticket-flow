"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Users,
  Clock,
  BarChart3,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/departments", label: "Departamentos", icon: Building2 },
  { href: "/agents", label: "Agentes", icon: Users },
  { href: "/sla", label: "SLA", icon: Clock },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn("flex flex-col bg-sidebar text-white transition-all duration-200", collapsed ? "w-20" : "w-64")}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}> 
          <MessageCircle className="h-7 w-7 text-brand-500" />
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold tracking-tight">Ticket Flow</h1>
              <p className="text-xs text-slate-400">Suporte interno</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? "Abrir sidebar" : "Fechar sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xs font-medium text-slate-300">WhatsApp conectado</p>
            <p className="mt-1 text-xs text-slate-500">Webhook: /api/webhooks/whatsapp</p>
          </div>
        </div>
      )}
    </aside>
  );
}
