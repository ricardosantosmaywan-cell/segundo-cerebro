"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { repo, CREATIVE_STATUSES, type Creative } from "@/lib/data";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { creativeStatusLabel } from "@/lib/labels";
import { CreativeCard } from "@/components/creative-card";
import { CreativeForm } from "@/components/creative-form";
import { Empty, LoadError, Loading, PageHeader, Section } from "@/components/section";
import { Button } from "@/components/ui/button";
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
                          <CreativeCard
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
