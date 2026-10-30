"use client";

import Link from "next/link";
import { Dumbbell, Play } from "lucide-react";
import DeckIcon from "../elements/DeckIcon";
import MemoryCurve from "../elements/MemoryCurve";
import { PageSkeleton, WeekStrip } from "../elements/Visuals";
import { longDate, plu } from "../lib/dates";
import { useHour, useReady, useToday } from "../lib/hooks";
import { cardsOf, countStates, deckOrder, plan, streakOf, todayByDeck } from "../lib/queue";
import { useStore } from "../lib/store";

export default function TodayView() {
  const ready = useReady();
  const today = useToday();
  if (!ready || !today) return <PageSkeleton />;
  return <Today today={today} />;
}

const greeting = (hour: number) =>
  hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

function Today({ today }: { today: string }) {
  const hour = useHour();
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const log = useStore((s) => s.log);
  const settings = useStore((s) => s.settings);
  const scope = { decks, cards, log, settings };

  const ordered = deckOrder(decks);
  const { due, fresh, total } = plan(scope, today);
  const doneToday = log[today]?.reviews ?? 0;
  const streak = streakOf(log, today);
  const minutes = Math.max(1, Math.round((Math.min(total, settings.sessionSize) * 20) / 60));

  const perDeck = todayByDeck(scope, today);
  const top = ordered
    .map((d) => ({ deck: d, due: plan(scope, today, d.id).due.length }))
    .sort((a, b) => b.due - a.due)[0];

  const finding =
    total === 0
      ? doneToday > 0
        ? `Сегодня ${plu(doneToday, ["повторение", "повторения", "повторений"])} — всё по плану`
        : "Ничего не ждёт: можно потренироваться без влияния на расписание"
      : top && top.due > 0
        ? `Дольше всего ждёт ${top.deck.title}: ${plu(top.due, ["карточка", "карточки", "карточек"])}`
        : `${plu(fresh.length, ["новая карточка", "новые карточки", "новых карточек"])} на сегодня`;

  return (
    <div className="space-y-[14px]">
      <header className="pb-4">
        <h1 className="text-2xl font-medium">{greeting(hour)}</h1>
        <p className="mt-1 text-mute">
          {longDate(today)} · {finding}
        </p>
      </header>

      <div className="grid gap-[14px] lg:grid-cols-12">
        <section className="tile flex flex-col p-[22px] lg:col-span-8" aria-labelledby="session-title">
          <h2 id="session-title" className="text-base font-semibold">
            Сессия на сегодня
          </h2>
          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <div className="num text-4xl leading-none font-semibold">{total}</div>
              <div className="mt-2 text-mute">{total ? "к повторению" : "на сегодня всё"}</div>
            </div>
            <dl className="flex gap-8 pb-0.5">
              <div>
                <dt className="text-[13px] text-dim">по расписанию</dt>
                <dd className="num mt-1 text-2xl leading-none">{due.length}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-dim">новых</dt>
                <dd className="num mt-1 text-2xl leading-none">{fresh.length}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-dim">уже сегодня</dt>
                <dd className="num mt-1 text-2xl leading-none">{doneToday}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
            {total > 0 && (
              <Link href="/review/" className="btn btn-primary min-h-11 px-6">
                <Play size={16} fill="currentColor" />
                Начать · ≈ {minutes} мин
              </Link>
            )}
            <Link href="/review/?mode=cram" className={`btn min-h-11 ${total > 0 ? "" : "btn-primary px-6"}`}>
              <Dumbbell size={16} />
              {total > 0 ? "Тренировка" : "Свободная тренировка"}
            </Link>
          </div>
        </section>

        <section className="tile p-[22px] lg:col-span-4" aria-labelledby="streak-title">
          <div className="flex items-baseline justify-between">
            <h2 id="streak-title" className="text-base font-semibold">
              Серия
            </h2>
            <span className="text-[13px] text-dim">рекорд {plu(streak.best, ["день", "дня", "дней"])}</span>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="num text-2xl leading-none">{streak.current}</span>
            <span className="text-mute">
              {plu(streak.current, ["день", "дня", "дней"]).replace(/^\d+ /, "")} подряд
              {!streak.today && streak.current > 0 ? " · продли сегодня" : ""}
            </span>
          </div>
          <div className="mt-6">
            <WeekStrip log={log} today={today} />
          </div>
        </section>
      </div>

      <MemoryCurve cards={Object.values(cards)} today={today} />

      <section className="tile p-[22px]" aria-labelledby="decks-title">
        <div className="flex items-baseline justify-between">
          <h2 id="decks-title" className="text-base font-semibold">
            Колоды
          </h2>
          <Link href="/decks/" className="text-sm text-mute hover:text-text">
            Все {ordered.length}
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((deck) => {
            const deckCards = cardsOf(cards, deck.id);
            const states = countStates(deckCards);
            const deckDue = perDeck[deck.id] ?? 0;
            const learned = deckCards.length ? states.learned / deckCards.length : 0;
            return (
              <Link
                key={deck.id}
                href={`/deck/?id=${encodeURIComponent(deck.id)}`}
                className="flex items-center gap-3 rounded-2xl bg-surface-2 px-3.5 py-3 transition-[filter] hover:brightness-110"
              >
                <DeckIcon icon={deck.icon} size="sm" className="bg-bg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">{deck.title}</span>
                    <span className="num shrink-0 text-[13px] text-mute">
                      {deckDue > 0 ? `${deckDue} сегодня` : "—"}
                    </span>
                  </div>
                  <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-bg">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${learned * 100}%` }} />
                  </div>
                  <div className="num mt-1.5 text-[13px] text-dim">
                    выучено {states.learned} из {deckCards.length}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
