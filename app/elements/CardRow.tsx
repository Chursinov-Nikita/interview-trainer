"use client";

import { useState } from "react";
import { ChevronDown, Pencil, RotateCcw, Trash } from "lucide-react";
import Markdown from "./Markdown";
import { diffDays, intervalLabel } from "../lib/dates";
import { stateOf } from "../lib/srs";
import { useStore } from "../lib/store";
import { toast } from "../lib/toast";
import type { Card } from "../lib/types";

const STATE_DOT = { new: "bg-easy", learning: "bg-hard", learned: "bg-sky" } as const;

export const dueLabel = (card: Card, today: string) => {
  if (!card.srs) return "новая";
  const days = diffDays(today, card.srs.due);
  return days <= 0 ? "пора повторить" : `через ${intervalLabel(days)}`;
};

/** Строка карточки: вопрос, по нажатию раскрывается ответ и действия */
export default function CardRow({
  card,
  today,
  onEdit,
  extra,
}: {
  card: Card;
  today: string;
  onEdit: (id: string) => void;
  extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const deleteCard = useStore((s) => s.deleteCard);
  const resetCard = useStore((s) => s.resetCard);
  const state = stateOf(card.srs);

  return (
    <div className={`tile overflow-hidden transition-colors ${open ? "border-primary/40" : ""}`}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 p-4 text-left" aria-expanded={open}>
        <span className={`mt-2 size-2.5 shrink-0 rounded-full ${STATE_DOT[state]}`} />
        <div className="min-w-0 flex-1">
          <Markdown className={`font-medium ${open ? "" : "line-clamp-3"}`}>{card.front}</Markdown>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dim">
            <span>{dueLabel(card, today)}</span>
            {card.srs && card.srs.lapses > 0 && <span className="text-again">забыта {card.srs.lapses}×</span>}
            {extra}
          </div>
        </div>
        <ChevronDown size={20} className={`mt-1 shrink-0 text-dim transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-fade border-t-2 border-dashed border-line px-4 pt-4 pb-4">
          <Markdown>{card.back}</Markdown>
          {card.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {card.tags.map((t) => (
                <span key={t} className="rounded-lg bg-surface-2 px-2 py-0.5 font-mono text-xs text-mute">
                  #{t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => onEdit(card.id)} className="btn btn-soft min-h-10 px-3.5 text-sm">
              <Pencil size={16} /> Изменить
            </button>
            {card.srs && (
              <button
                onClick={() => {
                  resetCard(card.id);
                  toast("Прогресс карточки сброшен");
                }}
                className="btn btn-outline min-h-10 px-3.5 text-sm"
              >
                <RotateCcw size={16} /> Заново
              </button>
            )}
            <button
              onClick={() => {
                if (!confirm) return setConfirm(true);
                deleteCard(card.id);
                toast("Карточка удалена");
              }}
              onBlur={() => setConfirm(false)}
              className={`btn min-h-10 px-3.5 text-sm ${confirm ? "btn-again" : "btn-ghost text-again"}`}
            >
              <Trash size={16} /> {confirm ? "Точно удалить?" : "Удалить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
