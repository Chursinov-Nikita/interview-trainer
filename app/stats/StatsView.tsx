"use client";

import Link from "next/link";
import { useState } from "react";
import CardEditor from "../elements/CardEditor";
import CardRow from "../elements/CardRow";
import DeckIcon from "../elements/DeckIcon";
import { PageSkeleton } from "../elements/Visuals";
import { addDays, parse, plu, weekday } from "../lib/dates";
import { useReady, useToday } from "../lib/hooks";
import { cardsOf, countStates, deckOrder, hardest, streakOf } from "../lib/queue";
import { useStore } from "../lib/store";
import type { DayLog } from "../lib/types";

export default function StatsView() {
  const ready = useReady();
  const today = useToday();
  if (!ready || !today) return <PageSkeleton />;
  return <Stats today={today} />;
}

function Stats({ today }: { today: string }) {
  const decks = useStore((s) => s.decks);
  const cardMap = useStore((s) => s.cards);
  const log = useStore((s) => s.log);
  const [editCard, setEditCard] = useState<string | null>(null);

  const cards = Object.values(cardMap);
  const states = countStates(cards);
  const streak = streakOf(log, today);
  const week = Array.from({ length: 7 }, (_, i) => log[addDays(today, -i)]).filter(Boolean) as DayLog[];
  const weekReviews = week.reduce((sum, d) => sum + d.reviews, 0);
  const weekRecalled = week.reduce((sum, d) => sum + d.hard + d.easy, 0);
  const accuracy = weekReviews ? Math.round((weekRecalled / weekReviews) * 100) : null;
  const minutes = Math.round(Object.values(log).reduce((sum, d) => sum + d.ms, 0) / 60000);
  const hard = hardest(cards);

  const finding = weekReviews
    ? `За 7 дней — ${plu(weekReviews, ["повторение", "повторения", "повторений"])}, вспоминаешь ${accuracy}%`
    : "За последние 7 дней повторений не было";

  const kpis = [
    { label: "Серия", value: plu(streak.current, ["день", "дня", "дней"]), note: `рекорд ${streak.best}` },
    { label: "Выучено", value: String(states.learned), note: `из ${cards.length}` },
    { label: "Повторений за неделю", value: String(weekReviews), note: `${minutes} мин всего` },
    { label: "Помню за неделю", value: accuracy === null ? "—" : `${accuracy}%`, note: "с трудом + легко" },
  ];

  return (
    <div className="space-y-[14px]">
      <header className="pb-4">
        <h1 className="text-2xl font-medium">Прогресс</h1>
        <p className="mt-1 text-mute">{finding}</p>
      </header>

      <dl className="tile grid grid-cols-2 gap-y-5 p-[22px] lg:grid-cols-4 lg:divide-x lg:divide-line">
        {kpis.map((k, i) => (
          <div key={k.label} className={i ? "lg:pl-5" : ""}>
            <dt className="text-[13px] text-dim">{k.label}</dt>
            <dd className="num mt-1 text-2xl">{k.value}</dd>
            <dd className="num mt-0.5 text-[13px] text-dim">{k.note}</dd>
          </div>
        ))}
      </dl>

      <section className="tile p-[22px]" aria-labelledby="activity-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 id="activity-title" className="text-base font-semibold">
            Активность
          </h2>
          <span className="text-[13px] text-dim">повторений в день</span>
        </div>
        <Heatmap log={log} today={today} />
      </section>

      <section className="tile p-[22px]" aria-labelledby="by-deck-title">
        <h2 id="by-deck-title" className="text-base font-semibold">
          По колодам
        </h2>
        <ul className="mt-3">
          {deckOrder(decks).map((deck) => {
            const deckCards = cardsOf(cardMap, deck.id);
            const s = countStates(deckCards);
            const total = deckCards.length || 1;
            return (
              <li key={deck.id} className="border-t border-line first:border-t-0">
                <Link
                  href={`/deck/?id=${encodeURIComponent(deck.id)}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 py-3 md:grid-cols-[220px_minmax(0,1fr)_120px]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <DeckIcon icon={deck.icon} size="sm" />
                    <span className="truncate font-medium">{deck.title}</span>
                  </span>
                  <span className="col-span-2 row-start-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-surface-2 md:col-span-1 md:row-start-auto">
                    <span className="bg-accent" style={{ width: `${(s.learned / total) * 100}%` }} />
                    <span className="bg-chart-rest" style={{ width: `${(s.learning / total) * 100}%` }} />
                  </span>
                  <span className="num text-right text-mute">
                    <span className="text-text">{s.learned}</span> / {deckCards.length}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex gap-5 text-[13px] text-dim">
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-3 rounded-full bg-accent" /> выучено
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-3 rounded-full bg-chart-rest" /> учу
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-3 rounded-full bg-surface-2" /> новые
          </span>
        </div>
      </section>

      <section className="space-y-2" aria-labelledby="hard-title">
        <div className="px-1 pt-4">
          <h2 id="hard-title" className="text-base font-semibold">
            Самые трудные
          </h2>
          <p className="mt-0.5 text-mute">Чаще всего забываются — стоит перечитать перед собесом</p>
        </div>
        {hard.length ? (
          hard.map((card) => (
            <CardRow key={card.id} card={card} today={today} onEdit={setEditCard} extra={<span>{decks[card.deckId]?.title}</span>} />
          ))
        ) : (
          <p className="tile px-[22px] py-5 text-mute">
            Пока ни одна карточка не далась с трудом. Здесь появятся те, что забываешь чаще всего.
          </p>
        )}
      </section>

      <CardEditor open={!!editCard} onClose={() => setEditCard(null)} cardId={editCard} />
    </div>
  );
}

const WEEKS = 52;
const TABLET_WEEKS = 26;
const PHONE_WEEKS = 17;

const level = (d: DayLog | undefined) => {
  const n = d?.reviews ?? 0;
  if (!n) return 0;
  if (n < 10) return 1;
  if (n < 25) return 2;
  if (n < 50) return 3;
  return 4;
};

const LEVELS = ["bg-surface-2", "bg-accent/30", "bg-accent/55", "bg-accent/80", "bg-accent"];

function Heatmap({ log, today }: { log: Record<string, DayLog>; today: string }) {
  const start = addDays(today, -weekday(today) - (WEEKS - 1) * 7);
  return (
    <div className="mt-5">
      <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
        {Array.from({ length: WEEKS * 7 }, (_, i) => {
          const day = addDays(start, i);
          const week = Math.floor(i / 7);
          const future = day > today;
          return (
            <div
              key={day}
              title={`${parse(day).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}: ${log[day]?.reviews ?? 0}`}
              className={`aspect-square rounded-sm ${future ? "opacity-0" : LEVELS[level(log[day])]} ${
                day === today ? "ring-1 ring-text" : ""
              } ${week < WEEKS - PHONE_WEEKS ? "max-md:hidden" : ""} ${week < WEEKS - TABLET_WEEKS ? "md:max-lg:hidden" : ""}`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[13px] text-dim">
        меньше
        {LEVELS.map((c) => (
          <i key={c} className={`size-3 rounded-[3px] ${c}`} />
        ))}
        больше
      </div>
    </div>
  );
}
