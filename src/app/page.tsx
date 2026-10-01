"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Plus } from "lucide-react";
import { repo, type Campaign, type Creative, type CreativeStatus } from "@/lib/data";
import { addDays, relativeDay, toDateOnly, today } from "@/lib/dates";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { creativeStatusLabel, formatMoney } from "@/lib/labels";
import { QuickCapture } from "@/components/quick-capture";
import { Empty, LoadError, Loading, Section } from "@/components/section";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ALERT_WINDOW_DAYS = 3;
/** Statuses that still need work before the creative can go live. */
const NOT_READY: CreativeStatus[] = ["ideia", "em_producao"];
const LIVE_OR_READY: CreativeStatus[] = ["pronto", "no_ar"];

async function loadToday() {
  const day = today();
  const [openTasks, doneTasks, creatives, campaigns, channels, inboxCount] = await Promise.all([
    repo.listTasks({ status: ["a_fazer", "em_curso"], due_on_or_before: day }),
    repo.listTasks({ status: "feito" }),
    repo.listCreatives(),
    repo.listCampaigns(),
    repo.listChannels(),
    repo.countInboxItems(),
  ]);

  const activeCampaigns = campaigns.filter((c) => c.status === "ativa");
  const campaignName = new Map(campaigns.map((c) => [c.id, c.name]));
  const channelName = new Map(channels.map((c) => [c.id, c.name]));

  // Creatives due within the next days (or already late) that are not ready yet.
  const limit = addDays(day, ALERT_WINDOW_DAYS);
  const creativeAlerts = creatives.filter(
    (c) => c.due_date !== null && c.due_date <= limit && NOT_READY.includes(c.status),
  );

  const byCampaign = new Map<string, Creative[]>();
  for (const c of creatives) {
    if (!c.campaign_id) continue;
    byCampaign.set(c.campaign_id, [...(byCampaign.get(c.campaign_id) ?? []), c]);
  }
  const campaignAlerts = activeCampaigns.filter(
    (c) => !(byCampaign.get(c.id) ?? []).some((cr) => LIVE_OR_READY.includes(cr.status)),
  );

  const doneToday = doneTasks.filter((t) => t.completed_at && toDateOnly(new Date(t.completed_at)) === day);

  return {
    day,
    tasks: [...openTasks, ...doneToday],
    creativeAlerts,
    campaignAlerts,
    inboxCount,
    activeCampaigns,
    byCampaign,
    campaignName,
    channelName,
  };
}

type TodayData = Awaited<ReturnType<typeof loadToday>>;

// Mobile: one column in this order: capture, alerts, tasks, inbox, campaigns.
// lg+: two columns. The column wrappers are `display: contents` on mobile so their children
// join the parent flex column, where `order-*` restores the mobile order.
// Left: alerts + tasks. Right: capture + inbox + campaigns.
export default function HojePage() {
  const q = useRepoQuery(loadToday);

  return (
    <>
      <h1 className="sr-only">Hoje</h1>
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-10">
        <div className="contents lg:col-start-1 lg:row-start-1 lg:block">
          {q.status === "loading" && <Loading />}
          {q.status === "error" && <LoadError error={q.error} />}
          {q.status === "ready" && (
            <>
              <AlertsSection data={q.data} />
              <TasksSection data={q.data} />
            </>
          )}
        </div>
        <div className="contents lg:col-start-2 lg:row-start-1 lg:block">
          <div className="order-1 lg:order-none">
            <QuickCapture />
          </div>
          {q.status === "ready" && (
            <>
              <InboxSection data={q.data} />
              <CampaignsSection data={q.data} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function AlertsSection({ data }: { data: TodayData }) {
  const { creativeAlerts, campaignAlerts } = data;
  const alertCount = creativeAlerts.length + campaignAlerts.length;

  return (
    <Section title="Alertas" className="order-2 mt-2 lg:order-none lg:mt-0">
      {alertCount === 0 ? (
        <Empty>Sem alertas. Criativos e campanhas em dia.</Empty>
      ) : (
        <ul className="space-y-2">
          {creativeAlerts.map((c) => (
            <AlertRow key={c.id} href="/criativos">
              <strong className="font-medium">{c.title}</strong>
              <span className="block text-xs">
                {c.due_date! < data.day ? "Atrasado" : "Entrega"} {relativeDay(c.due_date!, data.day)} ·{" "}
                {creativeStatusLabel[c.status]}
                {c.campaign_id && ` · ${data.campaignName.get(c.campaign_id) ?? ""}`}
              </span>
            </AlertRow>
          ))}
          {campaignAlerts.map((c) => (
            <AlertRow key={c.id} href="/campanhas">
              <strong className="font-medium">{c.name}</strong>
              <span className="block text-xs">Campanha ativa sem criativos prontos ou no ar</span>
            </AlertRow>
          ))}
        </ul>
      )}
    </Section>
  );
}

function TasksSection({ data }: { data: TodayData }) {
  const openCount = data.tasks.filter((t) => t.status !== "feito").length;
  const [creating, setCreating] = useState(false);

  return (
    <Section
      title="Tarefas de hoje"
      className="order-3 lg:order-none"
      aside={
        <span className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{openCount} por fazer</span>
          <Button variant="outline" className="h-11 px-3" onClick={() => setCreating(true)}>
            <Plus /> Nova tarefa
          </Button>
        </span>
      }
    >
      {creating && <TaskForm defaults={{ due_date: data.day }} onClose={() => setCreating(false)} />}
      {data.tasks.length === 0 ? (
        <Empty>Nada para hoje nem em atraso.</Empty>
      ) : (
        <div className="divide-y">
          {data.tasks.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
        </div>
      )}
    </Section>
  );
}

function InboxSection({ data }: { data: TodayData }) {
  const { inboxCount } = data;

  return (
    <Section title="Inbox" className="order-4 lg:order-none">
      <Link href="/inbox" className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Card size="sm" className="flex-row items-center justify-between px-4 active:bg-muted lg:hover:bg-muted">
          <span>
            {inboxCount === 0 ? (
              "Inbox vazia"
            ) : (
              <>
                <strong className="text-lg font-semibold">{inboxCount}</strong>{" "}
                {inboxCount === 1 ? "item por triar" : "itens por triar"}
              </>
            )}
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Card>
      </Link>
    </Section>
  );
}

function CampaignsSection({ data }: { data: TodayData }) {
  const { activeCampaigns } = data;

  return (
    <Section title="Campanhas ativas" className="order-5 lg:order-none">
      {activeCampaigns.length === 0 ? (
        <Empty>Nenhuma campanha ativa.</Empty>
      ) : (
        <ul className="space-y-2">
          {activeCampaigns.map((c) => (
            <li key={c.id}>
              <CampaignSummary
                campaign={c}
                creatives={data.byCampaign.get(c.id) ?? []}
                channel={c.channel_id ? data.channelName.get(c.channel_id) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function AlertRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-amber-950 outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-amber-500/20 dark:text-amber-100 lg:hover:bg-amber-500/20"
      >
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="min-w-0 flex-1">{children}</span>
      </Link>
    </li>
  );
}

function CampaignSummary({
  campaign,
  creatives,
  channel,
}: {
  campaign: Campaign;
  creatives: Creative[];
  channel?: string;
}) {
  const count = (s: CreativeStatus) => creatives.filter((c) => c.status === s).length;
  const parts = [
    [count("no_ar"), "no ar"],
    [count("pronto"), count("pronto") === 1 ? "pronto" : "prontos"],
    [count("em_producao") + count("ideia"), "por produzir"],
  ].filter(([n]) => (n as number) > 0);

  return (
    <Link href="/campanhas" className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card size="sm" className="gap-1 px-4 active:bg-muted lg:hover:bg-muted">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">{campaign.name}</span>
          {campaign.daily_budget !== null && (
            <span className="shrink-0 text-xs text-muted-foreground">{formatMoney(campaign.daily_budget)}/dia</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {[channel, parts.length ? parts.map(([n, l]) => `${n} ${l}`).join(" · ") : "sem criativos"]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </Card>
    </Link>
  );
}
