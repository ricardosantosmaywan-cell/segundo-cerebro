import type { CampaignStatus, CreativeStatus, TaskPriority, TaskStatus } from "@/lib/data";

export const campaignStatusLabel: Record<CampaignStatus, string> = {
  planeada: "Planeada",
  em_teste: "Em teste",
  ativa: "Ativa",
  pausada: "Pausada",
  encerrada: "Encerrada",
};

export const creativeStatusLabel: Record<CreativeStatus, string> = {
  ideia: "Ideia",
  em_producao: "Em produção",
  pronto: "Pronto",
  no_ar: "No ar",
  esgotado: "Esgotado",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  a_fazer: "A fazer",
  em_curso: "Em curso",
  feito: "Feito",
};

export const taskPriorityLabel: Record<TaskPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

const eur = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

export function formatMoney(value: number): string {
  return eur.format(value);
}
