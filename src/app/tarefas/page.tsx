"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { repo, type Task } from "@/lib/data";
import { today } from "@/lib/dates";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { Empty, LoadError, Loading, PageHeader, Section } from "@/components/section";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RECENT_DONE = 10;

type Filter = "todas" | "hoje" | "atrasadas" | "sem_data" | "concluidas";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "hoje", label: "Hoje" },
  { id: "atrasadas", label: "Atrasadas" },
  { id: "sem_data", label: "Sem data" },
  { id: "concluidas", label: "Concluídas" },
];

const EMPTY_TEXT: Record<Filter, string> = {
  todas: "Sem tarefas.",
  hoje: "Nada para hoje.",
  atrasadas: "Nenhuma tarefa atrasada.",
  sem_data: "Todas as tarefas por fazer têm data.",
  concluidas: "Ainda não concluíste nenhuma tarefa.",
};

async function loadTasks() {
  const [tasks, campaigns, creatives, channels] = await Promise.all([
    repo.listTasks(),
    repo.listCampaigns(),
    repo.listCreatives(),
    repo.listChannels(),
  ]);
  const names = new Map<string, string>([
    ...campaigns.map((c) => [c.id, c.name] as const),
    ...creatives.map((c) => [c.id, c.title] as const),
    ...channels.map((c) => [c.id, c.name] as const),
  ]);
  const context = (t: Task) => {
    const id = t.creative_id ?? t.campaign_id ?? t.channel_id;
    return id ? names.get(id) : undefined;
  };

  const day = today();
  const open = tasks.filter((t) => t.status !== "feito");
  const done = tasks
    .filter((t) => t.status === "feito")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  const lists: Record<Exclude<Filter, "todas">, Task[]> = {
    hoje: open.filter((t) => t.due_date === day),
    atrasadas: open.filter((t) => t.due_date !== null && t.due_date < day),
    sem_data: open.filter((t) => t.due_date === null),
    concluidas: done,
  };

  return {
    context,
    lists,
    total: tasks.length,
    groups: [
      { title: "Atrasadas", items: lists.atrasadas },
      { title: "Hoje", items: lists.hoje },
      { title: "Próximas", items: open.filter((t) => t.due_date !== null && t.due_date > day) },
      { title: "Sem data", items: lists.sem_data },
      { title: "Concluídas recentemente", items: done.slice(0, RECENT_DONE) },
    ],
  };
}

export default function TarefasPage() {
  const q = useRepoQuery(loadTasks);
  const [filter, setFilter] = useState<Filter>("todas");
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Tarefas"
        action={
          <Button className="h-11 px-4" onClick={() => setCreating(true)}>
            <Plus /> Nova
          </Button>
        }
      />
      {creating && <TaskForm onClose={() => setCreating(false)} />}

      <div role="group" aria-label="Filtros" className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {FILTERS.map((f) => {
          const count = q.status === "ready" && f.id !== "todas" ? q.data.lists[f.id].length : null;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-11 shrink-0 rounded-full border px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {f.label}
              {count !== null && count > 0 && <span className="ml-1.5 opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {q.status === "loading" && <Loading />}
      {q.status === "error" && <LoadError error={q.error} />}
      {q.status === "ready" &&
        (filter === "todas" ? (
          q.data.total === 0 ? (
            <Empty>{EMPTY_TEXT.todas}</Empty>
          ) : (
            <div className="lg:columns-2 lg:gap-x-10">
              {q.data.groups.map(
                (g) =>
                  g.items.length > 0 && (
                    <Section
                      key={g.title}
                      title={g.title}
                      className="break-inside-avoid lg:first:mt-0"
                      aside={<span className="text-xs text-muted-foreground">{g.items.length}</span>}
                    >
                      <div className="divide-y">
                        {g.items.map((t) => (
                          <TaskItem key={t.id} task={t} context={q.data.context(t)} />
                        ))}
                      </div>
                    </Section>
                  ),
              )}
            </div>
          )
        ) : q.data.lists[filter].length === 0 ? (
          <Empty>{EMPTY_TEXT[filter]}</Empty>
        ) : (
          <div className="divide-y lg:max-w-2xl">
            {q.data.lists[filter].map((t) => (
              <TaskItem key={t.id} task={t} context={q.data.context(t)} />
            ))}
          </div>
        ))}
    </>
  );
}
