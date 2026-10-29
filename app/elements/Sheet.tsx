"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
};

export default function Sheet({ open, onClose, title, children, wide }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal>
      <div className="absolute inset-0 animate-fade bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`sheet-panel relative flex max-h-[92dvh] w-full flex-col rounded-t-[1.75rem] bg-surface-solid sm:rounded-[1.75rem] ${
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-center justify-between gap-4 px-5 pt-3 pb-2 sm:pt-5">
          <h2 className="font-display text-lg">{title}</h2>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full text-mute hover:bg-surface-2" aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
