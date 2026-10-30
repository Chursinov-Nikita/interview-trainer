"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { ChevronRight, Plus, Search, X } from "lucide-react";
import CardEditor from "../elements/CardEditor";
import CardRow from "../elements/CardRow";
import DeckEditor from "../elements/DeckEditor";
import DeckIcon from "../elements/DeckIcon";
import { PageSkeleton } from "../elements/Visuals";
import { plu } from "../lib/dates";
import { useReady, useToday } from "../lib/hooks";
import { cardsOf, countStates, deckOrder, plan, todayByDeck } from "../lib/queue";
import { useStore } from "../lib/store";

export default function DecksView() {
  const ready = useReady();
  const today = useToday();
  const initial = useSearchParams().get("q") ?? "";
  if (!ready || !today) return <PageSkeleton />;
  return <Decks key={initial} today={today} initialQuery={initial} />;
}

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, "е");

function Decks({ today, initialQuery }: { today: string; initialQuery: string }) {
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const log = useStore((s) => s.log);
  const settings = useStore((s) => s.settings);
  const [query, setQuery] = useState(initialQuery);
  const deferred = useDeferredValue(query);
  const [creating, setCreating] = useState(false);
  const [editCard, setEditCard] = useState<string | null>(null);

  const total = Object.keys(cards).length;
  const ordered = deckOrder(decks);
  const q = normalize(deferred.trim());
  const found = q
    ? Object.values(cards).filter((c) => normalize(`${c.front} ${c.back} ${c.tags.join(" ")}`).includes(q))
    : [];
  const dueTotal = plan({ decks, cards, log, settings }, today).total;
  const perDeck = todayByDeck({ decks, cards, log, settings }, today);

  return (
    <div className="space-y-[14px]">
      <header className="flex flex-wrap items-start justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-medium">Колоды</h1>
          <p className="mt-1 text-mute">
            {plu(ordered.length, ["колода", "колоды", "колод"])} · {plu(total, ["вопрос", "вопроса", "вопросов"])}
            {dueTotal > 0 ? ` · ${dueTotal} ждут сегодня` : ""}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary min-h-9 px-4 text-sm">
          <Plus size={16} strokeWidth={2.2} /> Колода
        </button>
      </header>

      <label className="relative block">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по вопросам, ответам и тегам"
          className="input rounded-full pl-10"
          type="search"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-dim hover:text-text"
            aria-label="Очистить поиск"
          >
            <X size={16} />
          </button>
        )}
      </label>

      {q ? (
        <section className="space-y-2" aria-label="Результаты поиска">
          <p className="px-1 text-mute">
            {found.length ? `Нашлось ${plu(found.length, ["вопрос", "вопроса", "вопросов"])}` : "Ничего не нашлось — попробуй другое слово"}
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
        </section>
      ) : (
        <ul className="space-y-2.5" aria-label="Все колоды">
          {ordered.map((deck) => {
            const deckCards = cardsOf(cards, deck.id);
            const s = countStates(deckCards);
            const size = deckCards.length || 1;
            const due = perDeck[deck.id] ?? 0;
            return (
              <li key={deck.id}>
                <Link
                  href={`/deck/?id=${encodeURIComponent(deck.id)}`}
                  className="tile flex items-start gap-4 p-[18px] transition-[filter] hover:brightness-110 sm:p-[22px]"
                >
                  <DeckIcon icon={deck.icon} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-medium">{deck.title}</span>
                          {due > 0 && (
                            <span className="num rounded-full bg-surface-2 px-2.5 py-0.5 text-xs">{due} сегодня</span>
                          )}
                        </div>
                        <p className="mt-1 text-mute">
                          {deck.description || plu(deckCards.length, ["вопрос", "вопроса", "вопросов"])}
                        </p>
                      </div>
                      <dl className="flex shrink-0 gap-6">
                        {[
                          { label: "новые", value: s.new },
                          { label: "учу", value: s.learning },
                          { label: "выучено", value: s.learned },
                        ].map((stat) => (
                          <div key={stat.label} className="min-w-12 sm:text-right">
                            <dd className="num text-lg leading-none">{stat.value}</dd>
                            <dt className="mt-1.5 text-[13px] text-dim">{stat.label}</dt>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div className="mt-4 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="bg-accent" style={{ width: `${(s.learned / size) * 100}%` }} />
                      <div className="bg-chart-rest" style={{ width: `${(s.learning / size) * 100}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={18} className="mt-2.5 shrink-0 text-dim max-sm:hidden" />
                </Link>
              </li>
            );
          })}
          {ordered.length === 0 && <li className="tile px-[22px] py-6 text-mute">Колод пока нет — создай первую.</li>}
        </ul>
      )}

      <DeckEditor open={creating} onClose={() => setCreating(false)} />
      <CardEditor open={!!editCard} onClose={() => setEditCard(null)} cardId={editCard} />
    </div>
  );
}
