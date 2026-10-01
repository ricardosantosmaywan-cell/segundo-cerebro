// Fictional sample data for the first run. No real names, clients or companies.
// Dates are relative to "now" so the Hoje screen always has something to show.

import { addDays, toDateOnly } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { CURRENT_USER_ID } from "./current-user";
import type { Campaign, Channel, Creative, InboxItem, Task } from "./types";

export interface Seed {
  channels: Channel[];
  campaigns: Campaign[];
  creatives: Creative[];
  tasks: Task[];
  inbox_items: InboxItem[];
}

export function buildSeed(now: Date): Seed {
  const ts = now.toISOString();
  const day = toDateOnly(now);
  const d = (n: number) => addDays(day, n);
  const base = { user_id: CURRENT_USER_ID, created_at: ts, updated_at: ts };

  const channel = (name: string, objective: string, routine: string): Channel => ({
    ...base,
    id: newId(),
    name,
    area: "marketing",
    objective,
    routine,
    active: true,
  });

  const fb = channel("Facebook Ads", "Gerar contactos/orçamentos", "Ver métricas todos os dias; substituir criativos esgotados");
  const ig = channel("Instagram", "Presença e prova social", "3 publicações por semana");
  const gmn = channel("Google Meu Negócio", "Avaliações e contactos locais", "Responder a avaliações; 1 publicação por semana");
  const site = channel("Site", "Converter visitas em pedidos", "Rever formulários e páginas de entrada uma vez por mês");
  const sys = channel("Sistema", "Gestão interna e dados", "Atualizar a lista de contactos todas as semanas");
  const rmk = channel("Remarketing", "Recuperar contactos que não fecharam", "Rever públicos todas as semanas");

  const campaign = (c: Partial<Campaign> & Pick<Campaign, "name" | "status">): Campaign => ({
    ...base,
    id: newId(),
    channel_id: null,
    objective: null,
    daily_budget: null,
    start_date: null,
    end_date: null,
    audience: null,
    notes: null,
    ...c,
  });

  const captacao = campaign({
    name: "Captação de contactos (outono)",
    channel_id: fb.id,
    objective: "leads",
    status: "ativa",
    daily_budget: 15,
    start_date: d(-10),
    audience: "Região local, 25–55 anos",
  });
  const remarketing = campaign({
    name: "Remarketing a visitantes do site",
    channel_id: rmk.id,
    objective: "remarketing",
    status: "ativa",
    daily_budget: 8,
    start_date: d(-5),
    audience: "Visitantes do site nos últimos 30 dias",
  });
  const lancamento = campaign({
    name: "Lançamento de serviço novo",
    channel_id: ig.id,
    objective: "mensagens",
    status: "planeada",
    daily_budget: 10,
    start_date: d(14),
    notes: "Esperar pelos criativos antes de definir o orçamento final",
  });

  const creative = (c: Partial<Creative> & Pick<Creative, "title" | "status">): Creative => ({
    ...base,
    id: newId(),
    campaign_id: null,
    format: null,
    hypothesis: null,
    due_date: null,
    file_url: null,
    result_notes: null,
    ...c,
  });

  const ofertaImg = creative({
    title: "Imagem de oferta limitada",
    campaign_id: captacao.id,
    format: "imagem",
    hypothesis: "Um prazo visível aumenta a taxa de contacto",
    status: "em_producao",
    due_date: d(1),
  });
  const guiaoReel = creative({
    title: "Reel de apresentação do serviço",
    campaign_id: lancamento.id,
    format: "video",
    hypothesis: "Mostrar o serviço em 15 segundos gera mais mensagens",
    status: "ideia",
    due_date: d(10),
  });

  const creatives: Creative[] = [
    creative({
      title: "Vídeo curto com testemunho",
      campaign_id: captacao.id,
      format: "video",
      hypothesis: "Prova social gera mais contactos do que imagem de produto",
      status: "no_ar",
      due_date: d(-7),
    }),
    creative({
      title: "Carrossel antes/depois",
      campaign_id: captacao.id,
      format: "carrossel",
      status: "pronto",
      due_date: d(-2),
    }),
    ofertaImg,
    creative({
      title: "Vídeo de bastidores",
      campaign_id: captacao.id,
      format: "video",
      status: "esgotado",
      due_date: d(-20),
      result_notes: "Custo por contacto subiu muito ao fim de duas semanas",
    }),
    creative({
      title: "Anúncio lembrete com desconto",
      campaign_id: remarketing.id,
      format: "imagem",
      hypothesis: "Um incentivo pequeno recupera quem já pediu informação",
      status: "em_producao",
      due_date: d(2),
    }),
    creative({
      title: "Carrossel de perguntas frequentes",
      campaign_id: remarketing.id,
      format: "carrossel",
      hypothesis: "Responder às objeções comuns reduz a hesitação",
      status: "ideia",
      due_date: d(3),
    }),
    guiaoReel,
    creative({
      title: "Imagem de anúncio de lançamento",
      campaign_id: lancamento.id,
      format: "imagem",
      status: "em_producao",
      due_date: d(6),
    }),
  ];

  const task = (t: Partial<Task> & Pick<Task, "title">): Task => ({
    ...base,
    id: newId(),
    status: "a_fazer",
    priority: "media",
    due_date: null,
    recurrence: null,
    channel_id: null,
    campaign_id: null,
    creative_id: null,
    inbox_item_id: null,
    completed_at: null,
    ...t,
  });

  const tasks: Task[] = [
    task({ title: "Rever métricas da campanha de captação", priority: "alta", due_date: d(0), channel_id: fb.id, campaign_id: captacao.id }),
    task({ title: "Responder às avaliações novas", due_date: d(0), channel_id: gmn.id }),
    task({ title: "Pedir fotografias para a imagem de oferta", status: "em_curso", due_date: d(0), creative_id: ofertaImg.id, campaign_id: captacao.id }),
    task({ title: "Escrever guião do reel de lançamento", priority: "alta", due_date: d(-1), creative_id: guiaoReel.id, campaign_id: lancamento.id }),
    task({ title: "Atualizar página de contactos do site", priority: "baixa", due_date: d(-3), channel_id: site.id }),
    task({ title: "Publicar carrossel no Instagram", due_date: d(1), channel_id: ig.id }),
    task({ title: "Definir público da campanha de lançamento", due_date: d(2), campaign_id: lancamento.id }),
    task({ title: "Exportar lista de contactos do mês", priority: "baixa", status: "feito", due_date: d(-2), channel_id: sys.id, completed_at: ts }),
  ];

  const inbox = (content: string, source: string): InboxItem => ({
    ...base,
    id: newId(),
    content,
    source,
    processed: false,
  });

  return {
    channels: [fb, ig, gmn, site, sys, rmk],
    campaigns: [captacao, remarketing, lancamento],
    creatives,
    tasks,
    inbox_items: [
      inbox("Ideia: vídeo a mostrar o processo do início ao fim", "telemovel"),
      inbox("Ver porque o formulário do site recebe menos pedidos", "web"),
      inbox("Testar público semelhante aos clientes atuais", "telemovel"),
    ],
  };
}
