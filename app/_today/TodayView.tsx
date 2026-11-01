"use client";

import Link from "next/link";
import { useState } from "react";
import { Dumbbell, Play } from "lucide-react";
import CardEditor from "../elements/CardEditor";
import CardRow from "../elements/CardRow";
import DeckIcon from "../elements/DeckIcon";
import { PageSkeleton, StateBar, WeekStrip } from "../elements/Visuals";
import { longDate, plu } from "../lib/dates";
import { useHour, useReady, useToday } from "../lib/hooks";
import { cardsOf, countStates, deckOrder, hardest, plan, streakOf, todayByDeck } from "../lib/queue";
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
  const hard = hardest(Object.values(cards));
  const [editCard, setEditCard] = useState<string | null>(null);

  const perDeck = todayByDeck(scope, today);

  return (
    <div className="space-y-[14px]">
      <header className="pb-4">
        <h1 className="text-2xl font-medium">{greeting(hour)}</h1>
        <p className="mt-1 text-mute">{longDate(today)}</p>
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
            <dl className="grid w-full grid-cols-3 items-end gap-4 pb-0.5 sm:flex sm:w-auto sm:gap-8">
              {[
                { label: "повторить", value: due.length },
                { label: "новых", value: fresh.length },
                { label: "сделано", value: doneToday },
              ].map(({ label, value }) => (
                <div key={label} className="flex min-w-0 flex-col">
                  <dt className="text-[13px] leading-tight text-dim">{label}</dt>
                  <dd className="num mt-1.5 text-2xl leading-none">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-auto grid auto-cols-fr grid-flow-col gap-2.5 pt-6">
            {total > 0 && (
              <Link href="/review/" className="btn btn-primary min-h-11">
                <Play size={16} fill="currentColor" />
                Начать
              </Link>
            )}
            <Link href="/review/?mode=cram" className={`btn min-h-11 ${total > 0 ? "" : "btn-primary"}`}>
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
                  <StateBar learned={states.learned} learning={states.learning} total={deckCards.length} className="mt-2 bg-bg" />
                  <div className="num mt-1.5 text-[13px] text-dim">
                    <span className="text-text">{states.learning + states.learned}</span> из {deckCards.length}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-4 flex justify-between text-[13px] text-dim">
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-3 rounded-full bg-accent" /> выучено
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-3 rounded-full bg-chart-rest" /> учу
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-3 rounded-full bg-bg" /> новые
          </span>
        </div>
      </section>

      <section className="space-y-2" aria-labelledby="hard-title">
        <div className="px-1 pt-4">
          <h2 id="hard-title" className="text-base font-semibold">
            Самые трудные
          </h2>
          <p className="mt-0.5 text-mute">Чаще всего вызывают «Не знаю» — стоит перечитать перед собесом</p>
        </div>
        {hard.length ? (
          hard.map((card) => (
            <CardRow key={card.id} card={card} today={today} onEdit={setEditCard} extra={<span>{decks[card.deckId]?.title}</span>} />
          ))
        ) : (
          <p className="tile px-[22px] py-5 text-mute">
            Пока трудных карточек нет. Здесь появятся те, на которых чаще всего нажимаешь «Не знаю» или «Почти».
          </p>
        )}
      </section>

      <CardEditor open={!!editCard} onClose={() => setEditCard(null)} cardId={editCard} />
    </div>
  );
}
