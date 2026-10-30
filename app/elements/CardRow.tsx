"use client";

import { useState } from "react";
import { ChevronDown, Pencil, RotateCcw, Trash } from "lucide-react";
import Markdown from "./Markdown";
import { diffDays, intervalLabel } from "../lib/dates";
import { stateOf } from "../lib/srs";
import { useStore } from "../lib/store";
import { toast } from "../lib/toast";
import type { Card } from "../lib/types";

const STATE_DOT = { new: "bg-easy", learning: "bg-hard", learned: "bg-accent" } as const;

export const dueLabel = (card: Card, today: string) => {
  if (!card.srs) return "новая";
  const days = diffDays(today, card.srs.due);
  return days <= 0 ? "пора повторить" : `через ${intervalLabel(days)}`;
};

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
    <div className="tile overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 px-[22px] py-4 text-left transition-colors hover:bg-surface-2" aria-expanded={open}>
        <span className={`mt-[7px] size-2 shrink-0 rounded-full ${STATE_DOT[state]}`} />
        <div className="min-w-0 flex-1">
          <Markdown className={`font-medium ${open ? "" : "line-clamp-3"}`}>{card.front}</Markdown>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-dim">
            <span>{dueLabel(card, today)}</span>
            {card.srs && card.srs.lapses > 0 && <span className="text-again">забыта {card.srs.lapses}×</span>}
            {extra}
          </div>
        </div>
        <ChevronDown size={18} className={`mt-0.5 shrink-0 text-dim transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-fade border-t border-line px-[22px] pt-4 pb-5">
          <Markdown>{card.back}</Markdown>
          {card.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {card.tags.map((t) => (
                <span key={t} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-mute">
                  #{t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => onEdit(card.id)} className="btn min-h-9 px-3.5 text-sm">
              <Pencil size={16} /> Изменить
            </button>
            {card.srs && (
              <button
                onClick={() => {
                  resetCard(card.id);
                  toast("Прогресс карточки сброшен");
                }}
                className="btn min-h-9 px-3.5 text-sm"
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
              className={`btn min-h-9 px-3.5 text-sm ${confirm ? "btn-again" : "btn-ghost text-again"}`}
            >
              <Trash size={16} /> {confirm ? "Точно удалить?" : "Удалить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
