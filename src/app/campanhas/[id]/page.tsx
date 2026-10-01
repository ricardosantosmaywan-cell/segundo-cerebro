"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { repo, type Creative } from "@/lib/data";
import { formatShort } from "@/lib/dates";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { campaignStatusLabel, formatMoney } from "@/lib/labels";
import { CampaignForm } from "@/components/campaign-form";
import { CreativeCard } from "@/components/creative-card";
import { CreativeForm } from "@/components/creative-form";
import { Empty, LoadError, Loading, Section } from "@/components/section";
import { TaskItem } from "@/components/task-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CampanhaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const load = useCallback(async () => {
    const campaign = await repo.getCampaign(id);
    if (!campaign) return null;
    const [creatives, tasks, channels] = await Promise.all([
      repo.listCreatives({ campaign_id: id }),
      repo.listTasks({ campaign_id: id }),
      repo.listChannels(),
    ]);
    const open = tasks.filter((t) => t.status !== "feito");
    const done = tasks.filter((t) => t.status === "feito");
    return {
      campaign,
      creatives,
      tasks: [...open, ...done],
      channel: channels.find((c) => c.id === campaign.channel_id)?.name,
    };
  }, [id]);
  const q = useRepoQuery(load);

  const [editingCampaign, setEditingCampaign] = useState(false);
  // undefined = closed, null = new creative for this campaign, Creative = editing it
  const [editingCreative, setEditingCreative] = useState<Creative | null | undefined>(undefined);

  const back = (
    <Link
      href="/campanhas"
      className="mb-3 inline-flex min-h-11 items-center gap-1 rounded text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-4" /> Campanhas
    </Link>
  );

  if (q.status === "loading") return <Loading />;
  if (q.status === "error") return <LoadError error={q.error} />;
  if (q.data === null) {
    return (
      <>
        {back}
        <Empty>Campanha não encontrada. Pode ter sido apagada.</Empty>
      </>
    );
  }

  const { campaign: c, creatives, tasks, channel } = q.data;
  const dates = [c.start_date && `início ${formatShort(c.start_date)}`, c.end_date && `fim ${formatShort(c.end_date)}`]
    .filter(Boolean)
    .join(" · ");
  const meta = [channel, c.objective, c.daily_budget !== null && `${formatMoney(c.daily_budget)}/dia`, dates]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {back}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={c.status === "ativa" ? "default" : "secondary"}>{campaignStatusLabel[c.status]}</Badge>
            {meta && <span>{meta}</span>}
          </div>
        </div>
        <Button variant="outline" className="h-11 px-4" onClick={() => setEditingCampaign(true)}>
          <Pencil /> Editar
        </Button>
      </div>
      {(c.audience || c.notes) && (
        <div className="mt-3 space-y-1 text-sm">
          {c.audience && <p>Público: {c.audience}</p>}
          {c.notes && <p className="text-muted-foreground">{c.notes}</p>}
        </div>
      )}

      {editingCampaign && (
        <CampaignForm
          campaign={c}
          onClose={() => setEditingCampaign(false)}
          onDeleted={() => router.replace("/campanhas")}
        />
      )}
      {editingCreative !== undefined && (
        <CreativeForm
          key={editingCreative?.id ?? "new"}
          creative={editingCreative ?? undefined}
          defaults={{ campaign_id: c.id }}
          onClose={() => setEditingCreative(undefined)}
        />
      )}

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-10">
        <Section
          title="Criativos"
          aside={
            <Button variant="outline" className="h-11 px-3" onClick={() => setEditingCreative(null)}>
              <Plus /> Novo criativo
            </Button>
          }
        >
          {creatives.length === 0 ? (
            <Empty>Esta campanha ainda não tem criativos.</Empty>
          ) : (
            <ul className="space-y-2">
              {creatives.map((cr) => (
                <li key={cr.id}>
                  <CreativeCard creative={cr} hideCampaign onEdit={() => setEditingCreative(cr)} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Tarefas" aside={<span className="text-xs text-muted-foreground">{tasks.length}</span>}>
          {tasks.length === 0 ? (
            <Empty>Sem tarefas ligadas a esta campanha.</Empty>
          ) : (
            <div className="divide-y">
              {tasks.map((t) => (
                <TaskItem key={t.id} task={t} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
