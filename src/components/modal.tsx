"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE = "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])";

/**
 * Native <dialog> (focus trap and Esc come for free). Bottom sheet below lg, centered dialog from lg.
 * Children are only mounted while open, so forms start fresh each time.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Focus the first field (showModal would otherwise focus the close button).
      dialog.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("overflow-hidden");
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself (the panel inside has the padding).
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label={title}
      className={cn(
        "fixed inset-x-0 top-auto bottom-0 m-0 h-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-2xl bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50",
        "lg:inset-0 lg:m-auto lg:max-h-[90dvh] lg:max-w-lg lg:rounded-2xl",
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col lg:max-h-[90dvh]">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Fechar"
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
