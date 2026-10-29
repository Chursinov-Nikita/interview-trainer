"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import CardEditor from "../elements/CardEditor";
import CardRow from "../elements/CardRow";
import DeckEditor from "../elements/DeckEditor";
import DeckIcon from "../elements/DeckIcon";
import { PageSkeleton } from "../elements/Visuals";
import { plu } from "../lib/dates";
import { useReady, useToday } from "../lib/hooks";
import { cardsOf, countStates, deckOrder, plan } from "../lib/queue";
import { useStore } from "../lib/store";

export default function DecksView() {
  const ready = useReady();
  const today = useToday();
  if (!ready || !today) return <PageSkeleton />;
  return <Decks today={today} />;
}

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, "е");

function Decks({ today }: { today: string }) {
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const log = useStore((s) => s.log);
  const settings = useStore((s) => s.settings);
  const [query, setQuery] = useState("");
  // поиск по сотням карточек не должен тормозить ввод
  const deferred = useDeferredValue(query);
  const [creating, setCreating] = useState(false);
  const [editCard, setEditCard] = useState<string | null>(null);

  const q = normalize(deferred.trim());
  const found = q
    ? Object.values(cards).filter((c) =>
        normalize(`${c.front} ${c.back} ${c.tags.join(" ")}`).includes(q),
      )
    : [];

  return (
    <div className="space-y-5">
      <header className="flex animate-rise items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{plu(Object.keys(cards).length, ["карточка", "карточки", "карточек"])}</p>
          <h1 className="font-display mt-1 text-3xl">Колоды</h1>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary min-h-11 px-4">
          <Plus size={20} strokeWidth={2.6} /> Колода
        </button>
      </header>

      <label className="relative block animate-rise [animation-delay:50ms]">
        <Search size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по всем карточкам"
          className="input pl-12"
          type="search"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-dim hover:bg-surface-2"
            aria-label="Очистить"
          >
            <X size={18} />
          </button>
        )}
      </label>

      {q ? (
        <div className="space-y-3">
          <p className="text-sm text-mute">
            {found.length ? `Найдено: ${found.length}` : "Ничего не нашлось — попробуй другое слово"}
          </p>
          {found.slice(0, 50).map((card) => (
            <CardRow
              key={card.id}
              card={card}
              today={today}
              onEdit={setEditCard}
              extra={<span>{decks[card.deckId]?.title}</span>}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {deckOrder(decks).map((deck, i) => {
            const deckCards = cardsOf(cards, deck.id);
            const states = countStates(deckCards);
            const total = deckCards.length || 1;
            const due = plan({ decks, cards, log, settings }, today, deck.id).total;
            return (
              <Link
                key={deck.id}
                href={`/deck/?id=${deck.id}`}
                className="tile group flex animate-rise flex-col gap-4 p-5 transition-transform hover:-translate-y-0.5"
                style={{ animationDelay: `${80 + i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <DeckIcon icon={deck.icon} color={deck.color} className="transition-transform duration-300 group-hover:-rotate-6" />
                  {due > 0 && (
                    <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-on-primary">{due} сегодня</span>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg leading-tight">{deck.title}</h2>
                  {deck.description && <p className="mt-1 line-clamp-2 text-sm text-mute">{deck.description}</p>}
                </div>
                <div className="mt-auto space-y-2">
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="bg-primary" style={{ width: `${(states.learned / total) * 100}%` }} />
                    <div className="bg-hard" style={{ width: `${(states.learning / total) * 100}%` }} />
                  </div>
                  <p className="text-xs font-semibold text-dim">
                    {deckCards.length} карт. · выучено {states.learned} · учу {states.learning}
                  </p>
                </div>
              </Link>
            );
          })}
          {Object.keys(decks).length === 0 && (
            <p className="py-10 text-center text-mute">Колод пока нет — создай первую.</p>
          )}
        </div>
      )}

      <DeckEditor open={creating} onClose={() => setCreating(false)} />
      <CardEditor open={!!editCard} onClose={() => setEditCard(null)} cardId={editCard} />
    </div>
  );
}
