"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeckIcon, { ICONS } from "./DeckIcon";
import Sheet from "./Sheet";
import { useStore } from "../lib/store";
import { toast } from "../lib/toast";
import { DECK_ICONS, type DeckColor, type DeckIcon as IconName } from "../lib/types";

export default function DeckEditor({ open, onClose, deckId }: { open: boolean; onClose: () => void; deckId?: string | null }) {
  return (
    <Sheet open={open} onClose={onClose} title={deckId ? "Колода" : "Новая колода"}>
      <Form key={deckId ?? "new"} deckId={deckId} onDone={onClose} />
    </Sheet>
  );
}

function Form({ deckId, onDone }: { deckId?: string | null; onDone: () => void }) {
  const router = useRouter();
  const deck = useStore((s) => (deckId ? s.decks[deckId] : undefined));
  const addDeck = useStore((s) => s.addDeck);
  const updateDeck = useStore((s) => s.updateDeck);

  const [title, setTitle] = useState(deck?.title ?? "");
  const [description, setDescription] = useState(deck?.description ?? "");
  const color: DeckColor = deck?.color ?? "slate";
  const [icon, setIcon] = useState<IconName>(deck?.icon ?? "brain");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data = { title: title.trim(), description: description.trim(), color, icon };
    if (deck) {
      updateDeck(deck.id, data);
      toast("Колода сохранена");
      onDone();
    } else {
      const id = addDeck(data);
      toast("Колода создана");
      onDone();
      router.push(`/deck/?id=${encodeURIComponent(id)}`);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center gap-4">
        <DeckIcon icon={icon} size="lg" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название"
          className="input text-base font-medium"
          autoFocus={!deck}
        />
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Описание (необязательно)"
        className="input"
      />
      <div className="space-y-2">
        <p className="eyebrow">Значок</p>
        <div className="grid grid-cols-5 gap-2">
          {DECK_ICONS.map((name) => {
            const Icon = ICONS[name];
            return (
              <button
                key={name}
                type="button"
                onClick={() => setIcon(name)}
                aria-label={name}
                className={`grid h-11 place-items-center rounded-full transition-colors ${
                  icon === name ? "bg-text text-bg" : "bg-surface-2 text-mute hover:text-text"
                }`}
              >
                <Icon size={22} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onDone} className="btn btn-outline flex-1">
          Отмена
        </button>
        <button type="submit" disabled={!title.trim()} className="btn btn-primary flex-2">
          {deck ? "Сохранить" : "Создать"}
        </button>
      </div>
    </form>
  );
}
