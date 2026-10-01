"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { repo, type Task } from "@/lib/data";
import { relativeDay, today } from "@/lib/dates";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskForm } from "@/components/task-form";
import { showUndo } from "@/components/undo-toast";
import { cn } from "@/lib/utils";

/** One row: tap the text or the box to complete (with undo); the pencil opens the editor. */
export function TaskItem({ task, context }: { task: Task; context?: string }) {
  const [editing, setEditing] = useState(false);
  const done = task.status === "feito";
  const overdue = !done && task.due_date !== null && task.due_date < today();

  function toggle(checked: boolean) {
    const previous = task.status;
    void repo.updateTask(task.id, { status: checked ? "feito" : "a_fazer" });
    if (checked) {
      showUndo(`Concluída: ${task.title}`, () => void repo.updateTask(task.id, { status: previous }));
    }
  }

  return (
    <div className="flex items-start rounded-lg focus-within:bg-muted lg:hover:bg-muted">
      <label className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg px-1 py-2.5 active:bg-muted">
        <Checkbox
          checked={done}
          onCheckedChange={toggle}
          className="mt-0.5 size-6 rounded-md"
          aria-label={done ? "Marcar como por fazer" : "Marcar como feita"}
        />
        <span className="min-w-0 flex-1">
          <span className={cn("block leading-snug", done && "text-muted-foreground line-through")}>{task.title}</span>
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
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Editar ${task.title}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Pencil className="size-4" />
      </button>
      {editing && <TaskForm task={task} onClose={() => setEditing(false)} />}
    </div>
  );
}
