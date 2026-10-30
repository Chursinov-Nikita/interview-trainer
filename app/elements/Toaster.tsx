"use client";

import { useSyncExternalStore } from "react";
import { Check, CircleAlert } from "lucide-react";
import { getServerToasts, getToasts, subscribeToasts } from "../lib/toast";

export default function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex animate-pop items-center gap-2.5 rounded-full bg-text px-4 py-2.5 text-sm font-medium text-bg shadow-lg"
        >
          {t.tone === "ok" ? (
            <Check size={18} className="text-easy" strokeWidth={3} />
          ) : (
            <CircleAlert size={18} className="text-again" />
          )}
          {t.text}
        </div>
      ))}
    </div>
  );
}
