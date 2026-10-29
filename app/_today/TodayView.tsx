"use client";

import Link from "next/link";
import { ChevronRight, Dumbbell, Play, Sparkles } from "lucide-react";
import DeckIcon from "../elements/DeckIcon";
import { PageSkeleton, Ring, StreakFlame, WeekStrip } from "../elements/Visuals";
import { addDays, longDate, plu } from "../lib/dates";
import { useCountUp, useReady, useToday } from "../lib/hooks";
import { cardsOf, countStates, deckOrder, plan, streakOf } from "../lib/queue";
import { useStore } from "../lib/store";

export default function TodayView() {
  const ready = useReady();
  const today = useToday();
  if (!ready || !today) return <PageSkeleton />;
  return <Today today={today} />;
}

function Today({ today }: { today: string }) {
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const log = useStore((s) => s.log);
  const settings = useStore((s) => s.settings);
  const scope = { decks, cards, log, settings };

  const { due, fresh, total } = plan(scope, today);
  const doneToday = log[today]?.reviews ?? 0;
  const streak = streakOf(log, today);
  const tomorrow = plan(scope, addDays(today, 1)).due.length;
  const shown = useCountUp(total, 900, 150);
  const minutes = Math.max(1, Math.round((Math.min(total, settings.sessionSize) * 20) / 60));

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="animate-rise">
          <p className="eyebrow">{longDate(today)}</p>
          <h1 className="font-display mt-1 text-3xl">Сегодня</h1>
        </div>
        <div
          className="flex animate-pop items-center gap-1.5 rounded-2xl border-2 border-line bg-surface px-3 py-2 font-display text-lg"
          title={streak.today ? "Стрик продлён сегодня" : "Повтори хотя бы одну карточку, чтобы продлить стрик"}
        >
          <StreakFlame lit={streak.today} />
          <span className={streak.today ? "text-flame" : "text-dim"}>{streak.current}</span>
        </div>
      </header>

      <section className="tile animate-rise overflow-hidden p-5 [animation-delay:60ms] sm:p-6">
        {total > 0 ? (
          <>
            <div className="flex items-center gap-5 sm:gap-7">
              <Ring value={doneToday / Math.max(1, doneToday + total)}>
                <div className="text-center">
                  <div className="font-display text-4xl leading-none tabular-nums">{shown}</div>
                  <div className="mt-1 text-xs font-semibold text-mute">к повторению</div>
                </div>
              </Ring>
              <div className="min-w-0 space-y-2.5">
                <p className="font-display text-lg leading-tight sm:text-xl">
                  {doneToday > 0 ? "Ещё немного" : "Пора освежить память"}
                </p>
                <div className="flex flex-wrap gap-1.5 text-sm font-semibold">
                  {due.length > 0 && (
                    <span className="rounded-full bg-sky-soft px-2.5 py-1 text-sky-ink">
                      {plu(due.length, ["повтор", "повтора", "повторов"])}
                    </span>
                  )}
                  {fresh.length > 0 && (
                    <span className="rounded-full bg-easy-soft px-2.5 py-1 text-easy">
                      {plu(fresh.length, ["новая", "новые", "новых"])}
                    </span>
                  )}
                </div>
                <p className="text-sm text-mute">≈ {minutes} мин на сессию</p>
              </div>
            </div>
            <Link href="/review/" className="btn btn-primary mt-6 w-full text-lg">
              <Play size={20} fill="currentColor" />
              Начать
            </Link>
          </>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="grid size-20 animate-float place-items-center rounded-2xl bg-surface-2 text-text">
              <Sparkles size={32} strokeWidth={1.5} />
            </div>
            <p className="font-display mt-4 text-2xl">На сегодня всё</p>
            <p className="mt-1.5 max-w-xs text-mute">
              {doneToday > 0 ? `${plu(doneToday, ["повторение", "повторения", "повторений"])} сегодня. ` : ""}
              Завтра ждут {plu(tomorrow, ["карточка", "карточки", "карточек"])}.
            </p>
            <Link href="/review/?mode=cram" className="btn btn-soft mt-5 w-full">
              <Dumbbell size={20} />
              Свободная тренировка
            </Link>
          </div>
        )}
      </section>

      <section className="tile animate-rise p-5 [animation-delay:120ms]">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-base">Неделя</h2>
          <span className="text-sm text-mute">
            рекорд: {plu(streak.best, ["день", "дня", "дней"])}
          </span>
        </div>
        <WeekStrip log={log} today={today} />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">Колоды</h2>
          <Link href="/decks/" className="text-sm text-mute">
            Все
          </Link>
        </div>
        {deckOrder(decks).map((deck, i) => {
          const deckCards = cardsOf(cards, deck.id);
          const deckPlan = plan(scope, today, deck.id);
          const states = countStates(deckCards);
          const pct = deckCards.length ? Math.round(((states.learned + states.learning * 0.4) / deckCards.length) * 100) : 0;
          return (
            <div
              key={deck.id}
              className="tile flex animate-rise items-center gap-4 p-3.5 pr-3"
              style={{ animationDelay: `${180 + i * 50}ms` }}
            >
              <Link href={`/deck/?id=${deck.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <DeckIcon icon={deck.icon} color={deck.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{deck.title}</span>
                    {deckPlan.total > 0 && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-on-primary">
                        {deckPlan.total}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2.5">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs font-semibold text-mute tabular-nums">{pct}%</span>
                  </div>
                </div>
              </Link>
              {deckPlan.total > 0 ? (
                <Link
                  href={`/review/?deck=${deck.id}`}
                  className="btn btn-primary size-11 min-h-0 rounded-full p-0"
                  aria-label={`Повторить ${deck.title}`}
                >
                  <Play size={18} fill="currentColor" />
                </Link>
              ) : (
                <Link href={`/deck/?id=${deck.id}`} className="grid size-11 place-items-center text-dim" aria-label="Открыть">
                  <ChevronRight size={22} />
                </Link>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
