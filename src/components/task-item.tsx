"use client";

import { repo, type Task } from "@/lib/data";
import { relativeDay, today } from "@/lib/dates";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/** One tappable row: tapping anywhere toggles between done and to-do. */
export function TaskItem({ task, context }: { task: Task; context?: string }) {
  const done = task.status === "feito";
  const overdue = !done && task.due_date !== null && task.due_date < today();

  function toggle(checked: boolean) {
    void repo.updateTask(task.id, { status: checked ? "feito" : "a_fazer" });
  }

  return (
    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg px-1 py-2.5 focus-within:bg-muted active:bg-muted lg:hover:bg-muted">
      <Checkbox
        checked={done}
        onCheckedChange={toggle}
        className="mt-0.5 size-6 rounded-md"
        aria-label={done ? "Marcar como por fazer" : "Marcar como feita"}
      />
      <span className="min-w-0 flex-1">
        <span className={cn("block leading-snug", done && "text-muted-foreground line-through")}>
          {task.title}
        </span>
        <span className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {task.due_date && (
            <span className={cn(overdue && "font-medium text-destructive")}>
              {overdue ? `Atrasada · ${relativeDay(task.due_date)}` : relativeDay(task.due_date)}
            </span>
          )}
          {task.status === "em_curso" && <span>Em curso</span>}
          {task.priority === "alta" && !done && <span className="font-medium text-foreground">Prioridade alta</span>}
          {context && <span className="truncate">{context}</span>}
        </span>
      </span>
    </label>
  );
}
