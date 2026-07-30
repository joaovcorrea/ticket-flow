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
  OPEN: "Aberto",
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const SLA_LABELS: Record<string, string> = {
  ON_TRACK: "No prazo",
  AT_RISK: "Em risco",
  BREACHED: "Violado",
  MET: "Cumprido",
};

export const SOURCE_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  WEB: "Web",
  EMAIL: "E-mail",
  PHONE: "Telefone",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  AGENT: "Agente",
};

export const POINT_REASON_LABELS: Record<string, string> = {
  TICKET_RESOLVED: "Ticket resolvido",
  SLA_MET: "SLA cumprido",
  FIRST_RESPONSE: "Primeira resposta",
  CUSTOMER_SATISFACTION: "Satisfação do cliente",
  BONUS: "Bônus",
  PENALTY: "Penalidade",
};
