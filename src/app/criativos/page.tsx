"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { repo, CREATIVE_STATUSES, type Creative, type CreativeStatus } from "@/lib/data";
import { relativeDay, today } from "@/lib/dates";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { creativeStatusLabel } from "@/lib/labels";
import { CreativeForm } from "@/components/creative-form";
import { Empty, LoadError, Loading, PageHeader, Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

async function loadCreatives() {
  const [creatives, campaigns] = await Promise.all([repo.listCreatives(), repo.listCampaigns()]);
  return { creatives, campaignName: new Map(campaigns.map((c) => [c.id, c.name])) };
}

export default function CriativosPage() {
  const q = useRepoQuery(loadCreatives);
  // undefined = closed, null = new creative, Creative = editing it
  const [editing, setEditing] = useState<Creative | null | undefined>(undefined);

  return (
    <>
      <PageHeader
        title="Criativos"
        action={
          <Button className="h-11 px-4" onClick={() => setEditing(null)}>
            <Plus /> Novo
          </Button>
        }
      />
      {editing !== undefined && (
        <CreativeForm key={editing?.id ?? "new"} creative={editing ?? undefined} onClose={() => setEditing(undefined)} />
      )}
      {q.status === "loading" && <Loading />}
      {q.status === "error" && <LoadError error={q.error} />}
      {q.status === "ready" &&
        (q.data.creatives.length === 0 ? (
          <Empty>Sem criativos. Usa a inbox para capturar ideias.</Empty>
        ) : (
          // Mobile: grouped list, empty states hidden. lg+: board with all 5 state columns
          // side by side (scrolls sideways if the window is too narrow for 10.5rem columns).
          <div className="lg:grid lg:auto-cols-[minmax(10.5rem,1fr)] lg:grid-flow-col lg:gap-4 lg:overflow-x-auto lg:pb-2">
            {CREATIVE_STATUSES.map((status) => {
              const items = q.data.creatives.filter((c) => c.status === status);
              return (
                <Section
                  key={status}
                  title={creativeStatusLabel[status]}
                  aside={<Count n={items.length} />}
                  className={cn(
                    "lg:mt-0 lg:rounded-xl lg:bg-muted/40 lg:p-2.5",
                    items.length === 0 && "hidden lg:block",
                  )}
                >
                  {items.length === 0 ? (
                    <p className="py-3 text-center text-sm text-muted-foreground">Vazio</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((c) => (
                        <li key={c.id}>
                          <CreativeRow
                            creative={c}
                            campaign={c.campaign_id ? q.data.campaignName.get(c.campaign_id) : undefined}
                            onEdit={() => setEditing(c)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              );
            })}
          </div>
        ))}
    </>
  );
}

function Count({ n }: { n: number }) {
  return <span className="text-xs text-muted-foreground">{n}</span>;
}

function CreativeRow({ creative: c, campaign, onEdit }: { creative: Creative; campaign?: string; onEdit: () => void }) {
  const late = c.due_date !== null && c.due_date < today() && (c.status === "ideia" || c.status === "em_producao");

  return (
    <Card size="sm" className="gap-2 px-4">
      <div className="relative pr-10">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${c.title}`}
          className="absolute -top-2 -right-2 flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="size-4" />
        </button>
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
        {c.result_notes && <p className="mt-1 text-sm">Resultado: {c.result_notes}</p>}
        {c.file_url && (
          <a
            href={c.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex min-h-8 items-center gap-1 text-sm underline underline-offset-2"
          >
            Ficheiro <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm lg:flex-col lg:items-stretch lg:gap-1">
        <span className="text-muted-foreground">Estado</span>
        <select
          value={c.status}
          onChange={(e) => void repo.updateCreativeStatus(c.id, e.target.value as CreativeStatus)}
          className="h-10 flex-1 rounded-lg border bg-background px-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex-none lg:text-sm"
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
