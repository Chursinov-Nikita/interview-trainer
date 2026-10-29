"use client";

import { useState } from "react";
import { BookOpen, Brain, Clock, Repeat, Sprout } from "lucide-react";
import CardEditor from "../elements/CardEditor";
import CardRow from "../elements/CardRow";
import DeckIcon from "../elements/DeckIcon";
import { PageSkeleton, StreakFlame } from "../elements/Visuals";
import { addDays, parse, plu, weekday } from "../lib/dates";
import { useCountUp, useReady, useToday } from "../lib/hooks";
import { cardsOf, countStates, deckOrder, forecast, hardest, streakOf } from "../lib/queue";
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
  const days = Object.values(log);
  const reviews = days.reduce((sum, d) => sum + d.reviews, 0);
  const minutes = Math.round(days.reduce((sum, d) => sum + d.ms, 0) / 60000);
  const next = forecast(cards, today);
  const maxNext = Math.max(1, ...next.map((d) => d.count));
  const hard = hardest(cards);

  const shownStreak = useCountUp(streak.current, 800, 100);
  const shownLearned = useCountUp(states.learned, 900, 200);

  return (
    <div className="space-y-5">
      <header className="animate-rise">
        <p className="eyebrow">статистика</p>
        <h1 className="font-display mt-1 text-3xl">Прогресс</h1>
      </header>

      <section className="grid animate-rise grid-cols-2 gap-3 [animation-delay:50ms]">
        <div className="tile flex flex-col items-center p-5 text-center">
          <StreakFlame lit={streak.today} size={40} className={streak.current ? "ignite" : ""} />
          <div className="font-display mt-2 text-4xl text-flame tabular-nums">{shownStreak}</div>
          <div className="text-sm font-semibold text-mute">
            {plu(streak.current, ["день", "дня", "дней"]).replace(/^\d+ /, "")} подряд
          </div>
          <div className="mt-2 text-xs text-dim">рекорд {streak.best}</div>
        </div>
        <div className="tile flex flex-col items-center p-5 text-center">
          <div className="grid size-10 place-items-center rounded-2xl bg-sky-soft text-sky-ink">
            <Brain size={24} />
          </div>
          <div className="font-display mt-2 text-4xl text-sky-ink tabular-nums">{shownLearned}</div>
          <div className="text-sm font-semibold text-mute">выучено</div>
          <div className="mt-2 text-xs text-dim">интервал от 3 недель</div>
        </div>
      </section>

      <section className="grid animate-rise grid-cols-3 gap-3 [animation-delay:100ms]">
        {[
          { icon: Sprout, label: "в процессе", value: states.learning, color: "text-hard", bg: "bg-hard-soft" },
          { icon: Repeat, label: "повторений", value: reviews, color: "text-easy", bg: "bg-easy-soft" },
          { icon: Clock, label: "минут", value: minutes, color: "text-again", bg: "bg-again-soft" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="tile p-3.5">
            <div className={`grid size-8 place-items-center rounded-xl ${bg} ${color}`}>
              <Icon size={17} strokeWidth={2.4} />
            </div>
            <div className="font-display mt-2 text-xl tabular-nums">{value}</div>
            <div className="text-xs font-semibold text-mute">{label}</div>
          </div>
        ))}
      </section>

      <section className="tile animate-rise p-5 [animation-delay:150ms]">
        <h2 className="font-display mb-4 text-base">Активность</h2>
        <Heatmap log={log} today={today} />
      </section>

      <section className="tile animate-rise p-5 [animation-delay:200ms]">
        <h2 className="font-display mb-4 text-base">Ближайшие 7 дней</h2>
        <div className="flex h-36 items-end gap-2">
          {next.map((d, i) => (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-xs font-bold text-mute tabular-nums">{d.count || ""}</span>
              <div className="flex min-h-0 w-full flex-1 items-end">
                <div
                  className={`w-full origin-bottom animate-[grow_0.7s_var(--ease-spring)_both] rounded-t-lg rounded-b-sm ${i === 0 ? "bg-primary" : "bg-primary/35"}`}
                  style={{ height: `${Math.max(4, (d.count / maxNext) * 100)}%`, animationDelay: `${300 + i * 60}ms` }}
                />
              </div>
              <span className={`text-[11px] font-bold ${i === 0 ? "text-primary-ink" : "text-dim"}`}>
                {i === 0 ? "сег" : parse(d.day).toLocaleDateString("ru-RU", { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="tile animate-rise space-y-4 p-5 [animation-delay:250ms]">
        <h2 className="font-display text-base">По колодам</h2>
        {deckOrder(decks).map((deck) => {
          const deckCards = cardsOf(cardMap, deck.id);
          const s = countStates(deckCards);
          const total = deckCards.length || 1;
          return (
            <div key={deck.id} className="flex items-center gap-3">
              <DeckIcon icon={deck.icon} color={deck.color} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate font-semibold">{deck.title}</span>
                  <span className="shrink-0 text-mute tabular-nums">
                    {s.learned}/{deckCards.length}
                  </span>
                </div>
                <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="bg-primary" style={{ width: `${(s.learned / total) * 100}%` }} />
                  <div className="bg-hard" style={{ width: `${(s.learning / total) * 100}%` }} />
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex gap-4 pt-1 text-xs font-semibold text-mute">
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-full bg-primary" /> выучено
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-full bg-hard" /> учу
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-full bg-surface-2" /> новые
          </span>
        </div>
      </section>

      <section className="animate-rise space-y-3 [animation-delay:300ms]">
        <div>
          <h2 className="font-display text-lg">Самые трудные</h2>
          <p className="text-sm text-mute">Чаще всего забываются — стоит перечитать</p>
        </div>
        {hard.length ? (
          hard.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              today={today}
              onEdit={setEditCard}
              extra={<span>{decks[card.deckId]?.title}</span>}
            />
          ))
        ) : (
          <div className="tile flex items-center gap-4 p-5 text-mute">
            <BookOpen size={28} className="shrink-0 text-dim" />
            Пока ни одна карточка не далась с трудом. Здесь появятся те, что забываешь чаще всего.
          </div>
        )}
      </section>

      <CardEditor open={!!editCard} onClose={() => setEditCard(null)} cardId={editCard} />
    </div>
  );
}

const WEEKS = 17;

const level = (d: DayLog | undefined) => {
  const n = d?.reviews ?? 0;
  if (!n) return 0;
  if (n < 10) return 1;
  if (n < 25) return 2;
  if (n < 50) return 3;
  return 4;
};

const LEVELS = ["bg-surface-2", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"];

// Тепловая карта: колонки — недели, строки — дни недели с понедельника
function Heatmap({ log, today }: { log: Record<string, DayLog>; today: string }) {
  const start = addDays(today, -weekday(today) - (WEEKS - 1) * 7);
  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {Array.from({ length: WEEKS * 7 }, (_, i) => {
          const day = addDays(start, i);
          const future = day > today;
          return (
            <div
              key={day}
              title={`${parse(day).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}: ${log[day]?.reviews ?? 0}`}
              className={`aspect-square animate-pop rounded-[4px] ${future ? "opacity-0" : LEVELS[level(log[day])]} ${day === today ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : ""}`}
              style={{ animationDelay: `${Math.floor(i / 7) * 25}ms` }}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-dim">
        меньше
        {LEVELS.map((c) => (
          <i key={c} className={`size-3 rounded-[3px] ${c}`} />
        ))}
        больше
      </div>
    </div>
  );
}
