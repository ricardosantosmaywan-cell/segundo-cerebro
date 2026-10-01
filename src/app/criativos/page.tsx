"use client";

import { repo, CREATIVE_STATUSES, type Creative, type CreativeStatus } from "@/lib/data";
import { relativeDay, today } from "@/lib/dates";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { creativeStatusLabel } from "@/lib/labels";
import { Empty, LoadError, Loading, PageTitle, Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

async function loadCreatives() {
  const [creatives, campaigns] = await Promise.all([repo.listCreatives(), repo.listCampaigns()]);
  return { creatives, campaignName: new Map(campaigns.map((c) => [c.id, c.name])) };
}

export default function CriativosPage() {
  const q = useRepoQuery(loadCreatives);

  return (
    <>
      <PageTitle>Criativos</PageTitle>
      {q.status === "loading" && <Loading />}
      {q.status === "error" && <LoadError error={q.error} />}
      {q.status === "ready" &&
        (q.data.creatives.length === 0 ? (
          <Empty>Sem criativos. Usa a inbox para capturar ideias.</Empty>
        ) : (
          CREATIVE_STATUSES.map((status) => {
            const items = q.data.creatives.filter((c) => c.status === status);
            if (items.length === 0) return null;
            return (
              <Section key={status} title={creativeStatusLabel[status]} aside={<Count n={items.length} />}>
                <ul className="space-y-2">
                  {items.map((c) => (
                    <li key={c.id}>
                      <CreativeRow creative={c} campaign={c.campaign_id ? q.data.campaignName.get(c.campaign_id) : undefined} />
                    </li>
                  ))}
                </ul>
              </Section>
            );
          })
        ))}
    </>
  );
}

function Count({ n }: { n: number }) {
  return <span className="text-xs text-muted-foreground">{n}</span>;
}

function CreativeRow({ creative: c, campaign }: { creative: Creative; campaign?: string }) {
  const late = c.due_date !== null && c.due_date < today() && (c.status === "ideia" || c.status === "em_producao");

  return (
    <Card size="sm" className="gap-2 px-4">
      <div>
        <p className="font-medium leading-snug">{c.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[c.format, campaign ?? "Sem campanha"].filter(Boolean).join(" · ")}
          {c.due_date && (
            <span className={cn(late && "font-medium text-destructive")}>
              {" · "}
              {late ? "atrasado " : "entrega "}
              {relativeDay(c.due_date)}
            </span>
          )}
        </p>
        {c.hypothesis && <p className="mt-1 text-sm text-muted-foreground italic">“{c.hypothesis}”</p>}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Estado</span>
        <select
          value={c.status}
          onChange={(e) => void repo.updateCreativeStatus(c.id, e.target.value as CreativeStatus)}
          className="h-10 flex-1 rounded-lg border bg-background px-2 text-base"
        >
          {CREATIVE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {creativeStatusLabel[s]}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}
