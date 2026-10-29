"use client";

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import Markdown from "./Markdown";
import Sheet from "./Sheet";
import { deckOrder } from "../lib/queue";
import { useStore } from "../lib/store";
import { toast } from "../lib/toast";

type Props = {
  open: boolean;
  onClose: () => void;
  /** нет id — создаём новую карточку */
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
  const decks = useStore((s) => s.decks);
  const card = useStore((s) => (cardId ? s.cards[cardId] : undefined));
  const addCard = useStore((s) => s.addCard);
  const updateCard = useStore((s) => s.updateCard);

  const ordered = deckOrder(decks);
  const [deck, setDeck] = useState(card?.deckId ?? deckId ?? ordered[0]?.id ?? "");
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [tags, setTags] = useState(card?.tags.join(", ") ?? "");
  const [preview, setPreview] = useState(false);

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

  if (!ordered.length) return <p className="pb-4 text-mute">Сначала создай колоду.</p>;

  return (
    <form
      className="space-y-4"
      onKeyDown={onKeyDown}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex items-center gap-2">
        <select value={deck} onChange={(e) => setDeck(e.target.value)} className="input flex-1 font-semibold">
          {ordered.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
        <div className="flex shrink-0 rounded-2xl border-2 border-line p-1">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`grid size-9 place-items-center rounded-xl ${!preview ? "bg-primary-soft text-primary-ink" : "text-dim"}`}
            aria-label="Редактор"
          >
            <Pencil size={17} />
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`grid size-9 place-items-center rounded-xl ${preview ? "bg-primary-soft text-primary-ink" : "text-dim"}`}
            aria-label="Превью"
          >
            <Eye size={17} />
          </button>
        </div>
      </div>

      {preview ? (
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-line p-4">
            <p className="eyebrow mb-2">Вопрос</p>
            <Markdown className="text-lg font-medium">{front || "_пусто_"}</Markdown>
          </div>
          <div className="rounded-2xl border-2 border-line p-4">
            <p className="eyebrow mb-2">Ответ</p>
            <Markdown>{back || "_пусто_"}</Markdown>
          </div>
        </div>
      ) : (
        <>
          <label className="block space-y-1.5">
            <span className="eyebrow">Вопрос</span>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Чем type отличается от interface?"
              className="input min-h-20 resize-y field-sizing-content"
              autoFocus={!card}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="eyebrow">Ответ · Markdown</span>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder={"Кратко и по делу.\n\n```ts\nconst x = 1;\n```"}
              className="input min-h-40 resize-y font-mono text-sm field-sizing-content"
            />
          </label>
        </>
      )}

      <label className="block space-y-1.5">
        <span className="eyebrow">Теги через запятую</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="generics, infer" className="input" />
      </label>

      <div className="flex gap-3 pt-1">
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
