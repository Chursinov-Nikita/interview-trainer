"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CardEditor from "../elements/CardEditor";
import CardRow from "../elements/CardRow";
import DeckIcon from "../elements/DeckIcon";
import { PageSkeleton } from "../elements/Visuals";
import { addDays, isoOf, parse, plu, WEEKDAYS } from "../lib/dates";
import { useReady, useToday } from "../lib/hooks";
import { cardsOf, countStates, deckOrder, hardest } from "../lib/queue";
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
  const week = Array.from({ length: 7 }, (_, i) => log[addDays(today, -i)]).filter(Boolean) as DayLog[];
  const weekReviews = week.reduce((sum, d) => sum + d.reviews, 0);
  const weekRecalled = week.reduce((sum, d) => sum + d.hard + d.easy, 0);
  const accuracy = weekReviews ? Math.round((weekRecalled / weekReviews) * 100) : null;
  const hard = hardest(cards);

  const finding = weekReviews
    ? `За 7 дней — ${plu(weekReviews, ["повторение", "повторения", "повторений"])}, вспоминаешь ${accuracy}%`
    : "За последние 7 дней повторений не было";

  return (
    <div className="space-y-[14px]">
      <header className="pb-4">
        <h1 className="text-2xl font-medium">Прогресс</h1>
        <p className="mt-1 text-mute">{finding}</p>
      </header>

      <Calendar log={log} today={today} />

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
                  <span className="num text-right text-mute" title={`начато ${s.learning + s.learned}, из них выучено ${s.learned}`}>
                    <span className="text-text">{s.learning + s.learned}</span> / {deckCards.length}
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

const monthDays = (year: number, month: number) => {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const size = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: size }, (_, i) => isoOf(new Date(year, month, i + 1))),
  ];
};

function Calendar({ log, today }: { log: Record<string, DayLog>; today: string }) {
  const [shift, setShift] = useState(0);
  const studied = (day: string) => (log[day]?.reviews ?? 0) > 0;
  const firstDay = Object.keys(log).filter(studied).sort()[0] ?? today;

  const current = parse(today);
  const shown = new Date(current.getFullYear(), current.getMonth() + shift, 1);
  const year = shown.getFullYear();
  const month = shown.getMonth();
  const days = monthDays(year, month);
  const studiedCount = days.filter((d) => d && studied(d)).length;
  const monthName = shown.toLocaleDateString("ru-RU", { month: "long" });
  const canGoBack = isoOf(shown) > firstDay;

  return (
    <section className="tile p-[22px]" aria-labelledby="calendar-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="calendar-title" className="text-base font-semibold">
          {monthName[0].toUpperCase() + monthName.slice(1)} {year !== current.getFullYear() ? year : ""}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setShift((s) => s - 1)}
            disabled={!canGoBack}
            className="btn btn-ghost size-9 min-h-0 p-0"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setShift((s) => s + 1)}
            disabled={shift === 0}
            className="btn btn-ghost size-9 min-h-0 p-0"
            aria-label="Следующий месяц"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <p className="mt-1 text-mute">
        {studiedCount
          ? `${plu(studiedCount, ["день", "дня", "дней"])} с занятиями`
          : shift === 0
            ? "В этом месяце занятий пока не было"
            : "В этом месяце занятий не было"}
      </p>

      <div className="mt-5 grid grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAYS.map((label) => (
          <span key={label} className="pb-1 text-[13px] text-dim">
            {label}
          </span>
        ))}
        {days.map((day, i) => {
          if (!day) return <span key={`empty-${i}`} />;
          const active = studied(day);
          const isToday = day === today;
          return (
            <span
              key={day}
              title={active ? plu(log[day].reviews, ["повторение", "повторения", "повторений"]) : undefined}
              className={`num mx-auto grid size-9 place-items-center rounded-full text-sm sm:size-10 ${
                active
                  ? "bg-accent font-semibold text-[#0e1a24]"
                  : day > today
                    ? "text-dim opacity-50"
                    : "text-mute"
              } ${isToday ? "ring-2 ring-text ring-offset-2 ring-offset-surface" : ""}`}
            >
              {parse(day).getDate()}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex gap-5 text-[13px] text-dim">
        <span className="flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-accent" /> были занятия
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2.5 rounded-full ring-2 ring-text" /> сегодня
        </span>
      </div>
    </section>
  );
}
