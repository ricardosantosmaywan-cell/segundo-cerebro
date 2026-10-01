"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { repo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function detectSource() {
  return window.matchMedia("(pointer: coarse)").matches ? "telemovel" : "web";
}

/** Type + Enter → saved to the inbox. Clears immediately and keeps focus for the next one. */
export function QuickCapture({ autoFocus = false }: { autoFocus?: boolean }) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<"" | "ok" | "erro">("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const content = value.trim();
    if (!content) return;
    setValue("");
    clearTimeout(timer.current);
    try {
      await repo.createInboxItem({ content, source: detectSource() });
      setFeedback("ok");
    } catch {
      setValue(content);
      setFeedback("erro");
    }
    timer.current = setTimeout(() => setFeedback(""), 2000);
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={save} className="space-y-1">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Capturar ideia, tarefa, lembrete…"
          aria-label="Captura rápida"
          autoComplete="off"
          enterKeyHint="send"
          autoFocus={autoFocus}
          className="h-12 text-base"
        />
        <Button type="submit" size="icon-lg" className="size-12" aria-label="Guardar na inbox">
          <Plus className="size-5" />
        </Button>
      </div>
      <p className="h-4 px-1 text-xs" aria-live="polite">
        {feedback === "ok" && <span className="text-muted-foreground">Guardado na inbox ✓</span>}
        {feedback === "erro" && <span className="text-destructive">Não foi possível guardar. Tenta outra vez.</span>}
      </p>
    </form>
  );
}
