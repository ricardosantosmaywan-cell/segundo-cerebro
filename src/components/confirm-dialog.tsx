"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/modal";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} className="lg:max-w-sm">
      <div className="space-y-4 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <p>{message}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-12 px-4" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" className="h-12 px-4" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
