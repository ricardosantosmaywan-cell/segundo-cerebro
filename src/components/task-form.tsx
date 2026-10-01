"use client";

import { useState } from "react";
import {
  repo,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type NewTask,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/data";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { taskPriorityLabel, taskStatusLabel } from "@/lib/labels";
import { FormDialog } from "@/components/form-dialog";
import { SelectField, TextField } from "@/components/form-fields";

async function loadLinks() {
  const [channels, campaigns, creatives] = await Promise.all([
    repo.listChannels(),
    repo.listCampaigns(),
    repo.listCreatives(),
  ]);
  return { channels, campaigns, creatives };
}

/**
 * Create (no `task`) or edit a task. Mount it only while it should be open;
 * `defaults` pre-fills a new one (e.g. the campaign).
 */
export function TaskForm({
  task,
  defaults,
  onClose,
}: {
  task?: Task;
  defaults?: Partial<NewTask>;
  onClose: () => void;
}) {
  const links = useRepoQuery(loadLinks);
  const start = task ?? defaults;
  const [title, setTitle] = useState(start?.title ?? "");
  const [status, setStatus] = useState<TaskStatus>(start?.status ?? "a_fazer");
  const [priority, setPriority] = useState<TaskPriority>(start?.priority ?? "media");
  const [dueDate, setDueDate] = useState(start?.due_date ?? "");
  const [channelId, setChannelId] = useState(start?.channel_id ?? "");
  const [campaignId, setCampaignId] = useState(start?.campaign_id ?? "");
  const [creativeId, setCreativeId] = useState(start?.creative_id ?? "");
  const [titleError, setTitleError] = useState("");

  async function submit() {
    if (!title.trim()) {
      setTitleError("Escreve um título.");
      return "Verifica os campos assinalados.";
    }
    const data = {
      title: title.trim(),
      status,
      priority,
      due_date: dueDate || null,
      channel_id: channelId || null,
      campaign_id: campaignId || null,
      creative_id: creativeId || null,
    };
    if (task) await repo.updateTask(task.id, data);
    else await repo.createTask(data);
  }

  const none = (label: string) => ({ value: "", label });

  return (
    <FormDialog
      open
      onClose={onClose}
      title={task ? "Editar tarefa" : "Nova tarefa"}
      onSubmit={submit}
      onDelete={task ? () => repo.deleteTask(task.id) : undefined}
      deleteWhat="esta tarefa"
    >
      <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={titleError} autoComplete="off" />
      <TextField label="Data limite" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Estado"
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          options={TASK_STATUSES.map((s) => ({ value: s, label: taskStatusLabel[s] }))}
        />
        <SelectField
          label="Prioridade"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          options={TASK_PRIORITIES.map((p) => ({ value: p, label: taskPriorityLabel[p] }))}
        />
      </div>
      <SelectField
        label="Canal"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
        options={[none("Sem canal"), ...(links.data?.channels ?? []).map((c) => ({ value: c.id, label: c.name }))]}
      />
      <SelectField
        label="Campanha"
        value={campaignId}
        onChange={(e) => setCampaignId(e.target.value)}
        options={[none("Sem campanha"), ...(links.data?.campaigns ?? []).map((c) => ({ value: c.id, label: c.name }))]}
      />
      <SelectField
        label="Criativo"
        value={creativeId}
        onChange={(e) => setCreativeId(e.target.value)}
        options={[none("Sem criativo"), ...(links.data?.creatives ?? []).map((c) => ({ value: c.id, label: c.title }))]}
      />
    </FormDialog>
  );
}
