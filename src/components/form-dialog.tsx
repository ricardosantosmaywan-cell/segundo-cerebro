"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Modal } from "@/components/modal";

/**
 * Form in a Modal with Cancelar / Guardar and an optional Apagar (asks for confirmation).
 * `onSubmit` returns an error message to show, or nothing when it worked (the modal then closes).
 * Validation is done by the caller before saving; keep it in Portuguese.
 */
export function FormDialog({
  open,
  onClose,
  title,
  onSubmit,
  onDelete,
  deleteWhat,
  submitLabel = "Guardar",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => Promise<string | void> | string | void;
  /** Shown only when editing. */
  onDelete?: () => Promise<void>;
  /** Used in the confirmation text, e.g. "este criativo". */
  deleteWhat?: string;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function run(action: () => Promise<string | void> | string | void) {
    setBusy(true);
    setError("");
    try {
      const message = await action();
      if (message) setError(message);
      else onClose();
    } catch {
      setError("Algo correu mal. Tenta outra vez.");
    }
    setBusy(false);
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={title}>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void run(onSubmit);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">{children}</div>
          <div className="space-y-2 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  className="h-12 px-4"
                  disabled={busy}
                  onClick={() => setConfirming(true)}
                >
                  Apagar
                </Button>
              )}
              <Button type="button" variant="outline" className="ml-auto h-12 px-4" disabled={busy} onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="h-12 px-6" disabled={busy}>
                {submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
      {onDelete && (
        <ConfirmDialog
          open={confirming}
          onCancel={() => setConfirming(false)}
          title="Apagar?"
          message={`Queres mesmo apagar ${deleteWhat ?? "este item"}? Não dá para desfazer.`}
          confirmLabel="Apagar"
          onConfirm={() => {
            setConfirming(false);
            void run(async () => {
              await onDelete();
            });
          }}
        />
      )}
    </>
  );
}
