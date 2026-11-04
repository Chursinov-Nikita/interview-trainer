"use client";

import { useEffect, useRef, useState } from "react";
import Sheet from "./Sheet";
import { useStore } from "../lib/store";
import { toast } from "../lib/toast";

type Props = {
  open: boolean;
  onClose: () => void;
  cardId?: string | null;
  deckId?: string | null;
};

export default function CardEditor({ open, onClose, cardId, deckId }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={cardId ? "Карточка" : "Новая карточка"} wide>
      <Form key={cardId ?? "new"} cardId={cardId} deckId={deckId} onDone={onClose} />
    </Sheet>
  );
}

const parseTags = (raw: string) =>
  [...new Set(raw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];

function Form({ cardId, deckId, onDone }: { cardId?: string | null; deckId?: string | null; onDone: () => void }) {
  const card = useStore((s) => (cardId ? s.cards[cardId] : undefined));
  const addCard = useStore((s) => s.addCard);
  const updateCard = useStore((s) => s.updateCard);

  const deck = card?.deckId ?? deckId;
  const isNew = !cardId;
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [tags, setTags] = useState(card?.tags.join(", ") ?? "");
  const question = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isNew && window.matchMedia("(pointer: fine)").matches) question.current?.focus({ preventScroll: true });
  }, [isNew]);

  const valid = deck && front.trim() && back.trim();

  const save = () => {
    if (!valid) return;
    const data = { deckId: deck, front: front.trim(), back: back.trim(), tags: parseTags(tags) };
    if (card) updateCard(card.id, data);
    else addCard(data);
    toast(card ? "Карточка сохранена" : "Карточка добавлена");
    onDone();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
    }
  };

  return (
    <form
      className="space-y-4"
      onKeyDown={onKeyDown}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="block space-y-1.5">
        <span className="eyebrow">Вопрос</span>
        <textarea
          ref={question}
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Что могут спросить?"
          className="input min-h-20 resize-y field-sizing-content"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="eyebrow">Ответ · Markdown</span>
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Как на это ответить"
          className="input min-h-40 resize-y font-mono text-base field-sizing-content lg:text-sm"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="eyebrow">Теги через запятую</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="основы, важное" className="input" />
      </label>

      <div className="sticky bottom-0 -mx-5 flex gap-3 bg-surface-solid px-5 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={onDone} className="btn btn-outline flex-1">
          Отмена
        </button>
        <button type="submit" disabled={!valid} className="btn btn-primary flex-2">
          Сохранить
          <span className="kbd hidden sm:inline">Ctrl+Enter</span>
        </button>
      </div>
    </form>
  );
}
