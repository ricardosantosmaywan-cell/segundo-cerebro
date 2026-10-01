"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type Toast = { id: number; message: string; onUndo: () => void };

const DURATION_MS = 6000;
let current: Toast | null = null;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(toast: Toast | null) {
  current = toast;
  for (const l of listeners) l();
}

/** Shows one "message · Desfazer" bar for a few seconds. A new one replaces the previous. */
export function showUndo(message: string, onUndo: () => void) {
  clearTimeout(timer);
  const id = nextId++;
  set({ id, message, onUndo });
  timer = setTimeout(() => current?.id === id && set(null), DURATION_MS);
}

function dismiss() {
  clearTimeout(timer);
  set(null);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/**
 * Mounted once in the root layout. On mobile it sits above the bottom nav (h-16 plus the
 * safe area); from lg it sits at the bottom of the content area, right of the sidebar (w-56).
 */
export function UndoToastHost() {
  const toast = useSyncExternalStore(subscribe, () => current, () => null);
  if (!toast) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-50 mx-auto flex w-[calc(100%-2rem)] max-w-sm items-center justify-between gap-3 rounded-xl bg-foreground py-1.5 pr-1.5 pl-4 text-background shadow-lg lg:bottom-6 lg:left-56"
    >
      <span className="min-w-0 truncate text-sm">{toast.message}</span>
      <Button
        variant="secondary"
        className="h-11 shrink-0 px-4"
        onClick={() => {
          toast.onUndo();
          dismiss();
        }}
      >
        Desfazer
      </Button>
    </div>
  );
}
