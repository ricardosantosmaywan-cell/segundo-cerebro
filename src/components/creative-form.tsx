"use client";

import { useState } from "react";
import { repo, CREATIVE_STATUSES, type Creative, type CreativeStatus, type NewCreative } from "@/lib/data";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { creativeStatusLabel } from "@/lib/labels";
import { FormDialog } from "@/components/form-dialog";
import { SelectField, TextArea, TextField } from "@/components/form-fields";

const loadCampaigns = () => repo.listCampaigns();
const FORMATS = ["video", "imagem", "carrossel", "texto"];

const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

/**
 * Create (no `creative`) or edit a creative. Mount it only while it should be open;
 * `defaults` pre-fills a new one (e.g. the campaign).
 */
export function CreativeForm({
  creative,
  defaults,
  onClose,
}: {
  creative?: Creative;
  defaults?: Partial<NewCreative>;
  onClose: () => void;
}) {
  const campaigns = useRepoQuery(loadCampaigns);
  const start = creative ?? defaults;
  const [title, setTitle] = useState(start?.title ?? "");
  const [format, setFormat] = useState(start?.format ?? "");
  const [hypothesis, setHypothesis] = useState(start?.hypothesis ?? "");
  const [status, setStatus] = useState<CreativeStatus>(start?.status ?? "ideia");
  const [dueDate, setDueDate] = useState(start?.due_date ?? "");
  const [campaignId, setCampaignId] = useState(start?.campaign_id ?? "");
  const [fileUrl, setFileUrl] = useState(start?.file_url ?? "");
  const [resultNotes, setResultNotes] = useState(start?.result_notes ?? "");
  const [errors, setErrors] = useState<{ title?: string; fileUrl?: string }>({});

  async function submit() {
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Escreve um título.";
    if (fileUrl.trim() && !/^https?:\/\/\S+$/i.test(fileUrl.trim())) {
      next.fileUrl = "O link tem de começar por http:// ou https://";
    }
    setErrors(next);
    if (Object.keys(next).length) return "Verifica os campos assinalados.";

    const data = {
      title: title.trim(),
      format: orNull(format),
      hypothesis: orNull(hypothesis),
      status,
      due_date: dueDate || null,
      campaign_id: campaignId || null,
      file_url: orNull(fileUrl),
      result_notes: orNull(resultNotes),
    };
    if (creative) await repo.updateCreative(creative.id, data);
    else await repo.createCreative(data);
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      title={creative ? "Editar criativo" : "Novo criativo"}
      onSubmit={submit}
      onDelete={creative ? () => repo.deleteCreative(creative.id) : undefined}
      deleteWhat="este criativo"
    >
      <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} autoComplete="off" />
      <SelectField
        label="Estado"
        value={status}
        onChange={(e) => setStatus(e.target.value as CreativeStatus)}
        options={CREATIVE_STATUSES.map((s) => ({ value: s, label: creativeStatusLabel[s] }))}
      />
      <SelectField
        label="Campanha"
        value={campaignId}
        onChange={(e) => setCampaignId(e.target.value)}
        options={[
          { value: "", label: "Sem campanha" },
          ...(campaigns.data ?? []).map((c) => ({ value: c.id, label: c.name })),
        ]}
      />
      <TextField label="Data limite" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <TextField
        label="Formato"
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        list="creative-formats"
        hint="video, imagem, carrossel…"
        autoComplete="off"
      />
      <datalist id="creative-formats">
        {FORMATS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
      <TextArea label="Hipótese" value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} hint="O que queres testar com este criativo?" />
      <TextField
        label="Link do ficheiro"
        type="url"
        inputMode="url"
        value={fileUrl}
        onChange={(e) => setFileUrl(e.target.value)}
        error={errors.fileUrl}
        placeholder="https://…"
        autoComplete="off"
      />
      <TextArea label="Notas de resultado" value={resultNotes} onChange={(e) => setResultNotes(e.target.value)} />
    </FormDialog>
  );
}
