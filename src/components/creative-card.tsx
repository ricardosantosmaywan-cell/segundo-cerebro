"use client";

import { ExternalLink, Pencil } from "lucide-react";
import { repo, CREATIVE_STATUSES, type Creative, type CreativeStatus } from "@/lib/data";
import { relativeDay, today } from "@/lib/dates";
import { creativeStatusLabel } from "@/lib/labels";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Creative card with a pencil to edit and a quick state selector. */
export function CreativeCard({
  creative: c,
  campaign,
  hideCampaign = false,
  onEdit,
}: {
  creative: Creative;
  /** Campaign name shown in the details line. */
  campaign?: string;
  /** Leave the campaign out (e.g. inside the campaign's own page). */
  hideCampaign?: boolean;
  onEdit: () => void;
}) {
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
          {[c.format, hideCampaign ? null : (campaign ?? "Sem campanha")].filter(Boolean).join(" · ")}
          {c.due_date && (
            <span className={cn(late && "font-medium text-destructive")}>
              {(c.format || !hideCampaign) && " · "}
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
