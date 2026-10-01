"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import { repo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function detectSource() {
  return window.matchMedia("(pointer: coarse)").matches ? "telemovel" : "web";
}

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Shortcut hint for the placeholder: only on desktop widths, "" on the server and on mobile. */
function shortcutHint() {
  if (!window.matchMedia(DESKTOP_QUERY).matches) return "";
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return mac ? "⌘K ou c" : "Ctrl+K ou c";
}

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** Type + Enter → saved to the inbox. Clears immediately and keeps focus for the next one. */
export function QuickCapture({ autoFocus = false }: { autoFocus?: boolean }) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<"" | "ok" | "erro">("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hint = useSyncExternalStore(subscribeDesktop, shortcutHint, () => "");

  // Cmd/Ctrl+K always focuses the field; plain "c" does it only when no field has focus.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.isComposing || e.defaultPrevented) return;
      const isCmdK = (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k";
      const isPlainC = !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.repeat && e.key === "c";
      if (!isCmdK && !(isPlainC && !isEditable(e.target))) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
          onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
          placeholder={hint ? `Capturar ideia, tarefa, lembrete… (${hint})` : "Capturar ideia, tarefa, lembrete…"}
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
