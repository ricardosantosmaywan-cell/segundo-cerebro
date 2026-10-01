"use client";

import { repo, type Task } from "@/lib/data";
import { today } from "@/lib/dates";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { Empty, LoadError, Loading, PageTitle, Section } from "@/components/section";
import { TaskItem } from "@/components/task-item";

const RECENT_DONE = 10;

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
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
    .slice(0, RECENT_DONE);

  return {
    context,
    groups: [
      { title: "Atrasadas", items: open.filter((t) => t.due_date !== null && t.due_date < day) },
      { title: "Hoje", items: open.filter((t) => t.due_date === day) },
      { title: "Próximas", items: open.filter((t) => t.due_date !== null && t.due_date > day) },
      { title: "Sem data", items: open.filter((t) => t.due_date === null) },
      { title: "Concluídas recentemente", items: done },
    ],
  };
}

export default function TarefasPage() {
  const q = useRepoQuery(loadTasks);

  return (
    <>
      <PageTitle>Tarefas</PageTitle>
      {q.status === "loading" && <Loading />}
      {q.status === "error" && <LoadError error={q.error} />}
      {q.status === "ready" &&
        (q.data.groups.every((g) => g.items.length === 0) ? (
          <Empty>Sem tarefas.</Empty>
        ) : (
          q.data.groups.map(
            (g) =>
              g.items.length > 0 && (
                <Section key={g.title} title={g.title} aside={<span className="text-xs text-muted-foreground">{g.items.length}</span>}>
                  <div className="divide-y">
                    {g.items.map((t) => (
                      <TaskItem key={t.id} task={t} context={q.data.context(t)} />
                    ))}
                  </div>
                </Section>
              ),
          )
        ))}
    </>
  );
}
