"use client";

import { useState } from "react";
import { CheckSquare, Image as ImageIcon, Trash2 } from "lucide-react";
import { repo, type InboxItem } from "@/lib/data";
import { relativeDay, toDateOnly } from "@/lib/dates";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { sourceLabel } from "@/lib/labels";
import { QuickCapture } from "@/components/quick-capture";
import { Empty, LoadError, Loading, PageTitle, Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const loadInbox = () => repo.listInboxItems();

export default function InboxPage() {
  const q = useRepoQuery(loadInbox);
  const [lastAction, setLastAction] = useState("");

  return (
    <>
      <PageTitle>Inbox</PageTitle>
      <QuickCapture />
      <p className="h-5 text-sm text-muted-foreground" aria-live="polite">
        {lastAction}
      </p>

      <Section
        title="Por triar"
        className="mt-2"
        aside={q.status === "ready" && <span className="text-xs text-muted-foreground">{q.data.length}</span>}
      >
        {q.status === "loading" && <Loading />}
        {q.status === "error" && <LoadError error={q.error} />}
        {q.status === "ready" &&
          (q.data.length === 0 ? (
            <Empty>Inbox vazia. Tudo triado.</Empty>
          ) : (
            <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
              {q.data.map((item) => (
                <li key={item.id}>
                  <InboxCard item={item} onDone={setLastAction} />
                </li>
              ))}
            </ul>
          ))}
      </Section>
    </>
  );
}

function InboxCard({ item, onDone }: { item: InboxItem; onDone: (msg: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try {
      await action();
      onDone(msg);
    } catch {
      onDone("Algo correu mal. Tenta outra vez.");
      setBusy(false);
    }
  }

  return (
    <Card size="sm" className="gap-3 px-4">
      <div>
        <p className="leading-snug">{item.content}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {relativeDay(toDateOnly(new Date(item.created_at)))}
          {item.source && ` · ${sourceLabel(item.source)}`}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="secondary"
          className="h-11"
          disabled={busy}
          onClick={() => run(() => repo.processInboxItem(item.id, { kind: "task" }), "Transformado em tarefa ✓")}
        >
          <CheckSquare /> Tarefa
        </Button>
        <Button
          variant="secondary"
          className="h-11"
          disabled={busy}
          onClick={() => run(() => repo.processInboxItem(item.id, { kind: "creative" }), "Transformado em criativo ✓")}
        >
          <ImageIcon /> Criativo
        </Button>
        {confirmDelete ? (
          <Button
            variant="destructive"
            className="h-11"
            disabled={busy}
            onClick={() => run(() => repo.deleteInboxItem(item.id), "Item apagado")}
            onBlur={() => setConfirmDelete(false)}
            autoFocus
          >
            Confirmar
          </Button>
        ) : (
          <Button variant="ghost" className="h-11 text-destructive" disabled={busy} onClick={() => setConfirmDelete(true)}>
            <Trash2 /> Apagar
          </Button>
        )}
      </div>
    </Card>
  );
}
