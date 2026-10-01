"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { repo, CAMPAIGN_STATUSES, type Campaign, type Creative } from "@/lib/data";
import { formatShort } from "@/lib/dates";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { campaignStatusLabel, creativeStatusLabel, formatMoney } from "@/lib/labels";
import { CampaignForm } from "@/components/campaign-form";
import { Empty, LoadError, Loading, PageHeader } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

async function loadCampaigns() {
  const [campaigns, creatives, channels] = await Promise.all([
    repo.listCampaigns(),
    repo.listCreatives(),
    repo.listChannels(),
  ]);
  // Active first, then the order of the status enum.
  const order = (c: Campaign) => CAMPAIGN_STATUSES.indexOf(c.status) + (c.status === "ativa" ? -10 : 0);
  return {
    campaigns: [...campaigns].sort((a, b) => order(a) - order(b)),
    creatives,
    channelName: new Map(channels.map((c) => [c.id, c.name])),
  };
}

export default function CampanhasPage() {
  const q = useRepoQuery(loadCampaigns);
  // undefined = closed, null = new campaign, Campaign = editing it
  const [editing, setEditing] = useState<Campaign | null | undefined>(undefined);

  return (
    <>
      <PageHeader
        title="Campanhas"
        action={
          <Button className="h-11 px-4" onClick={() => setEditing(null)}>
            <Plus /> Nova
          </Button>
        }
      />
      {editing !== undefined && (
        <CampaignForm key={editing?.id ?? "new"} campaign={editing ?? undefined} onClose={() => setEditing(undefined)} />
      )}
      {q.status === "loading" && <Loading />}
      {q.status === "error" && <LoadError error={q.error} />}
      {q.status === "ready" &&
        (q.data.campaigns.length === 0 ? (
          <Empty>Sem campanhas.</Empty>
        ) : (
          <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
            {q.data.campaigns.map((c) => (
              <li key={c.id}>
                <CampaignCard
                  campaign={c}
                  channel={c.channel_id ? q.data.channelName.get(c.channel_id) : undefined}
                  creatives={q.data.creatives.filter((cr) => cr.campaign_id === c.id)}
                  onEdit={() => setEditing(c)}
                />
              </li>
            ))}
          </ul>
        ))}
    </>
  );
}

function CampaignCard({
  campaign: c,
  channel,
  creatives,
  onEdit,
}: {
  campaign: Campaign;
  channel?: string;
  creatives: Creative[];
  onEdit: () => void;
}) {
  const dates = [c.start_date && `início ${formatShort(c.start_date)}`, c.end_date && `fim ${formatShort(c.end_date)}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card size="sm" className="gap-2 px-4">
      <div className="flex items-start gap-2">
        <Link
          href={`/campanhas/${c.id}`}
          className="min-w-0 flex-1 rounded font-medium leading-snug underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {c.name}
        </Link>
        <Badge variant={c.status === "ativa" ? "default" : "secondary"}>{campaignStatusLabel[c.status]}</Badge>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${c.name}`}
          className="-mt-3 -mr-3 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="size-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {[channel, c.objective, c.daily_budget !== null && `${formatMoney(c.daily_budget)}/dia`, dates]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {c.audience && <p className="text-sm">Público: {c.audience}</p>}
      {c.notes && <p className="text-sm text-muted-foreground">{c.notes}</p>}
      <div className="flex flex-wrap gap-1.5">
        {creatives.length === 0 ? (
          <span className="text-xs text-muted-foreground">Sem criativos</span>
        ) : (
          creatives.map((cr) => (
            <Badge key={cr.id} variant="outline" className="h-auto max-w-full py-1 whitespace-normal">
              {cr.title} · {creativeStatusLabel[cr.status]}
            </Badge>
          ))
        )}
      </div>
    </Card>
  );
}
