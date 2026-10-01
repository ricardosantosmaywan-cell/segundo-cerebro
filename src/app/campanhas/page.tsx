"use client";

import { repo, CAMPAIGN_STATUSES, type Campaign, type Creative } from "@/lib/data";
import { formatShort } from "@/lib/dates";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { campaignStatusLabel, creativeStatusLabel, formatMoney } from "@/lib/labels";
import { Empty, LoadError, Loading, PageTitle } from "@/components/section";
import { Badge } from "@/components/ui/badge";
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

  return (
    <>
      <PageTitle>Campanhas</PageTitle>
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
                />
              </li>
            ))}
          </ul>
        ))}
    </>
  );
}

function CampaignCard({ campaign: c, channel, creatives }: { campaign: Campaign; channel?: string; creatives: Creative[] }) {
  const dates = [c.start_date && `início ${formatShort(c.start_date)}`, c.end_date && `fim ${formatShort(c.end_date)}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card size="sm" className="gap-2 px-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-snug">{c.name}</p>
        <Badge variant={c.status === "ativa" ? "default" : "secondary"}>{campaignStatusLabel[c.status]}</Badge>
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
