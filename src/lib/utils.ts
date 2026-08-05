import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTicketNumber(num: number) {
  return `#${String(num).padStart(5, "0")}`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export const STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em Andamento",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
};

export const PRIORITY_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const SLA_LABELS: Record<string, string> = {
  NO_PRAZO: "No prazo",
  EM_RISCO: "Em risco",
  ESTOURADO: "Violado",
  CUMPRIDO: "Cumprido",
};

export const SOURCE_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  WEB: "Web",
  EMAIL: "E-mail",
  TELEFONE: "Telefone",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  ATENDENTE: "Agente",
};

export const POINT_REASON_LABELS: Record<string, string> = {
  CHAMADO_RESOLVIDO: "Ticket resolvido",
  SLA_CUMPRIDO: "SLA cumprido",
  PRIMEIRA_RESPOSTA: "Primeira resposta",
  SATISFACAO_CLIENTE: "Satisfação do cliente",
  BONUS: "Bônus",
  PENALIDADE: "Penalidade",
};

export function enumVariant(value: string) {
  return value.toLowerCase();
}
