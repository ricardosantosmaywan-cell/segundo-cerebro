"use client";

import { useState } from "react";
import { repo, CAMPAIGN_STATUSES, type Campaign, type CampaignStatus } from "@/lib/data";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { campaignStatusLabel } from "@/lib/labels";
import { FormDialog } from "@/components/form-dialog";
import { SelectField, TextArea, TextField } from "@/components/form-fields";

const loadChannels = () => repo.listChannels();
const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

/** Create (no `campaign`) or edit a campaign. Mount it only while it should be open. */
export function CampaignForm({
  campaign,
  onClose,
  onDeleted,
}: {
  campaign?: Campaign;
  onClose: () => void;
  /** Called after the campaign was deleted (before onClose). */
  onDeleted?: () => void;
}) {
  const channels = useRepoQuery(loadChannels);
  const [name, setName] = useState(campaign?.name ?? "");
  const [channelId, setChannelId] = useState(campaign?.channel_id ?? "");
  const [objective, setObjective] = useState(campaign?.objective ?? "");
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status ?? "planeada");
  const [budget, setBudget] = useState(campaign?.daily_budget?.toString() ?? "");
  const [startDate, setStartDate] = useState(campaign?.start_date ?? "");
  const [endDate, setEndDate] = useState(campaign?.end_date ?? "");
  const [audience, setAudience] = useState(campaign?.audience ?? "");
  const [notes, setNotes] = useState(campaign?.notes ?? "");
  const [errors, setErrors] = useState<{ name?: string; budget?: string; endDate?: string }>({});

  async function submit() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Escreve um nome.";
    const dailyBudget = budget.trim() === "" ? null : Number(budget.replace(",", "."));
    if (dailyBudget !== null && (!Number.isFinite(dailyBudget) || dailyBudget < 0)) {
      next.budget = "Indica um valor igual ou superior a 0.";
    }
    if (startDate && endDate && endDate < startDate) next.endDate = "A data de fim não pode ser antes do início.";
    setErrors(next);
    if (Object.keys(next).length) return "Verifica os campos assinalados.";

    const data = {
      name: name.trim(),
      channel_id: channelId || null,
      objective: orNull(objective),
      status,
      daily_budget: dailyBudget,
      start_date: startDate || null,
      end_date: endDate || null,
      audience: orNull(audience),
      notes: orNull(notes),
    };
    if (campaign) await repo.updateCampaign(campaign.id, data);
    else await repo.createCampaign(data);
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      title={campaign ? "Editar campanha" : "Nova campanha"}
      onSubmit={submit}
      onDelete={
        campaign
          ? async () => {
              await repo.deleteCampaign(campaign.id);
              onDeleted?.();
            }
          : undefined
      }
      deleteWhat="esta campanha (os criativos e tarefas ligados ficam sem campanha)"
    >
      <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="off" />
      <SelectField
        label="Canal"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
        options={[
          { value: "", label: "Sem canal" },
          ...(channels.data ?? []).map((c) => ({ value: c.id, label: c.name })),
        ]}
      />
      <SelectField
        label="Estado"
        value={status}
        onChange={(e) => setStatus(e.target.value as CampaignStatus)}
        options={CAMPAIGN_STATUSES.map((s) => ({ value: s, label: campaignStatusLabel[s] }))}
      />
      <TextField
        label="Objetivo"
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        hint="leads, mensagens, remarketing…"
        autoComplete="off"
      />
      <TextField
        label="Orçamento diário (€)"
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        error={errors.budget}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Início" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextField label="Fim" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={errors.endDate} />
      </div>
      <TextArea label="Público" value={audience} onChange={(e) => setAudience(e.target.value)} />
      <TextArea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </FormDialog>
  );
}
