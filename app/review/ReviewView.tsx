"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Clock, Dumbbell, Flame, Pencil, Play, Target, Trophy, X } from "lucide-react";
import CardEditor from "../elements/CardEditor";
import DeckIcon from "../elements/DeckIcon";
import Markdown from "../elements/Markdown";
import { Confetti, Skeleton, StreakFlame, WeekStrip } from "../elements/Visuals";
import { duration, intervalLabel, plu, today as todayIso } from "../lib/dates";
import { useCountUp, useReady, useToday } from "../lib/hooks";
import { buildCram, buildSession, plan, streakOf } from "../lib/queue";
import { sound } from "../lib/sound";
import { nextInterval } from "../lib/srs";
import { useStore } from "../lib/store";
import { GRADES, type Grade } from "../lib/types";

export default function ReviewView() {
  const ready = useReady();
  const today = useToday();
  const params = useSearchParams();
  const deckId = params.get("deck");
  const cram = params.get("mode") === "cram";
  // каждая новая «порция» — новый экземпляр сессии с чистым состоянием
  const [round, setRound] = useState(0);

  if (!ready || !today) return <ReviewSkeleton />;
  return (
    <Session
      key={`${round}-${params.toString()}`}
      deckId={deckId}
      wantCram={cram}
      onMore={() => setRound((r) => r + 1)}
    />
  );
}

export function ReviewSkeleton() {
  return (
    <div className="fixed inset-0 mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
      <Skeleton className="h-4" />
      <Skeleton className="flex-1" />
      <Skeleton className="h-14" />
    </div>
  );
}

type Item = { id: string; repeat: boolean };
type Anim = "enter" | "flip-out" | "flip-in" | Grade | null;
type Tally = Record<Grade, number>;

const GRADE_UI: Record<Grade, { label: string; key: string }> = {
  again: { label: "Не помню", key: "1" },
  hard: { label: "С трудом", key: "2" },
  easy: { label: "Легко", key: "3" },
};

const isGrade = (anim: Anim): anim is Grade => GRADES.includes(anim as Grade);
const SWIPE = 110;



type SessionProps = { deckId: string | null; wantCram: boolean; onMore: () => void };

function Session({ deckId, wantCram, onMore }: SessionProps) {
  const router = useRouter();
  const [{ ids: initial, cram }] = useState(() => {
    const state = useStore.getState();
    return wantCram
      ? { ids: buildCram(state, deckId), cram: true }
      : { ids: buildSession(state, todayIso(), deckId), cram: false };
  });
  const [queue, setQueue] = useState<Item[]>(() => initial.map((id) => ({ id, repeat: false })));
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(0);
  const [face, setFace] = useState<"front" | "back">("front");
  const [anim, setAnim] = useState<Anim>("enter");
  const [combo, setCombo] = useState(0);
  const [comboBurst, setComboBurst] = useState(0);
  const [first, setFirst] = useState<Tally>({ again: 0, hard: 0, easy: 0 });
  const [spent, setSpent] = useState(0);
  const [float, setFloat] = useState<{ grade: Grade; text: string; key: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [drag, setDrag] = useState(0);
  const dragRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const cardStart = useRef(0);
  // оценку пишем в базу, когда карточка улетела: иначе кнопки успеют показать следующие интервалы
  const pending = useRef<{ ms: number; scheduleIt: boolean } | null>(null);
  const [shake, setShake] = useState(0);

  const current = queue[0];
  const card = useStore((s) => (current ? s.cards[current.id] : undefined));
  const deck = useStore((s) => (card ? s.decks[card.deckId] : undefined));
  const review = useStore((s) => s.review);
  const total = initial.length;
  const finished = total > 0 && queue.length === 0;
  const exitHref = deckId ? `/deck/?id=${deckId}` : "/";

  useEffect(() => {
    cardStart.current = performance.now();
  }, [step]);

  useEffect(() => {
    if (finished) sound.finish();
  }, [finished]);

  const flip = () => {
    if (!current || face !== "front" || (anim && anim !== "enter")) return;
    sound.flip();
    setAnim("flip-out");
  };

  const grade = (g: Grade) => {
    if (!current || !card || face !== "back" || isGrade(anim)) return;
    const ms = Math.min(60_000, performance.now() - cardStart.current);
    const scheduleIt = !cram && !current.repeat;
    const text = scheduleIt
      ? `через ${intervalLabel(nextInterval(card.srs, g))}`
      : g === "again"
        ? "ещё раз"
        : "+1";
    pending.current = { ms, scheduleIt };
    sound[g]();
    if (g === "again") setShake(performance.now());
    if (!current.repeat) setFirst((f) => ({ ...f, [g]: f[g] + 1 }));
    setSpent((s) => s + ms);
    const nextCombo = g === "again" ? 0 : combo + 1;
    setCombo(nextCombo);
    if (nextCombo >= 5 && nextCombo % 5 === 0) {
      setComboBurst(nextCombo);
      setTimeout(sound.combo, 160);
    }
    setFloat({ grade: g, text, key: Date.now() });
    setAnim(g);
  };

  const advance = (g: Grade) => {
    if (current && pending.current) review(current.id, g, pending.current.ms, pending.current.scheduleIt);
    pending.current = null;
    setQueue(([head, ...rest]) => {
      // забытая карточка вернётся через пару других, пока не вспомнишь
      if (g === "again") rest.splice(Math.min(rest.length, 3), 0, { id: head.id, repeat: true });
      return rest;
    });
    if (g !== "again") setDone((d) => d + 1);
    setFace("front");
    setDrag(0);
    setStep((s) => s + 1);
    setAnim("enter");
  };

  const onAnimationEnd = (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return;
    if (anim === "flip-out") {
      setFace("back");
      setAnim("flip-in");
    } else if (isGrade(anim)) advance(anim);
    else setAnim(null);
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (editing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof Element && e.target.closest("input, textarea, select")) return;
    if (e.key === "Escape") return router.push(exitHref);
    if (face === "front" && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      return flip();
    }
    if (face === "back") {
      const map: Record<string, Grade> = { "1": "again", "2": "hard", "3": "easy", ArrowLeft: "again", ArrowDown: "hard", ArrowRight: "easy" };
      if (map[e.key]) {
        e.preventDefault();
        grade(map[e.key]);
      }
    }
    if (e.key === "e" || e.key === "у") setEditing(true);
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // Свайп по открытой карточке: влево — «не помню», вправо — «легко»
  const onPointerDown = (e: React.PointerEvent) => {
    if (face !== "back" || anim) return;
    dragRef.current = { x: e.clientX, y: e.clientY, active: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        d.active = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      } else if (Math.abs(dy) > 10) dragRef.current = null;
      return;
    }
    setDrag(dx);
  };
  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d?.active) return;
    if (drag > SWIPE) grade("easy");
    else if (drag < -SWIPE) grade("again");
    else setDrag(0);
  };

  if (total === 0) return <Empty cram={wantCram} deckId={deckId} exitHref={exitHref} />;
  if (finished)
    return <Finish total={total} first={first} spent={spent} cram={cram} deckId={deckId} onMore={onMore} />;
  if (!card) return null;

  const dragging = drag !== 0 && !anim;
  const tilt = Math.min(1, Math.abs(drag) / SWIPE);

  return (
    <div
      onAnimationEnd={(e) => e.target === e.currentTarget && setShake(0)}
      className={`fixed inset-0 mx-auto flex max-w-2xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 ${
        shake ? "shake-hard" : ""
      }`}
    >
      <header className="flex items-center gap-3 sm:gap-4">
        <Link href={exitHref} className="grid size-10 shrink-0 place-items-center rounded-full text-dim hover:bg-surface-2" aria-label="Выйти">
          <X size={26} strokeWidth={2.5} />
        </Link>
        <div className="bar flex-1">
          <i style={{ width: `${Math.max(4, (done / total) * 100)}%` }} />
        </div>
        <span className="font-display w-14 text-right text-sm text-mute tabular-nums">
          <span key={done} className="inline-block animate-pop">
            {done}
          </span>
          /{total}
        </span>
      </header>

      <div className="stage relative flex min-h-0 flex-1 flex-col justify-center py-5">
        {comboBurst > 0 && (
          <div
            key={comboBurst}
            className="combo-pill absolute top-2 left-1/2 z-20 flex items-center gap-1.5 rounded-full bg-surface-2 px-4 py-1.5 font-display text-sm text-text"
          >
            <Flame size={16} fill="currentColor" />
            {comboBurst} подряд!
          </div>
        )}
        {cram && (
          <div className="mb-3 flex justify-center">
            <span className="flex items-center gap-1.5 rounded-full bg-sky-soft px-3 py-1 text-xs font-bold text-sky-ink">
              <Dumbbell size={14} /> Тренировка · прогресс не меняется
            </span>
          </div>
        )}

        <div className="relative flex max-h-full min-h-[min(26rem,100%)] flex-col">
          {queue.length > 2 && (
            <div className="absolute inset-x-6 top-3 -bottom-4 rounded-2xl bg-surface opacity-40" />
          )}
          {queue.length > 1 && (
            <div className="absolute inset-x-3 top-1.5 -bottom-2 rounded-2xl bg-surface opacity-70" />
          )}

          <article
            key={step}
            data-anim={anim ?? undefined}
            onAnimationEnd={onAnimationEnd}
            onClick={face === "front" ? flip : undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`flashcard relative flex min-h-0 flex-1 touch-pan-y flex-col overflow-hidden rounded-2xl bg-surface ${
              face === "front" ? "cursor-pointer" : ""
            }`}
            style={{
              transform: drag ? `translateX(${drag}px) rotate(${drag / 18}deg)` : undefined,
              transition: dragging ? "none" : "transform 0.35s var(--ease-spring)",
            }}
          >
            <div className="flex shrink-0 items-center gap-2.5 px-5 pt-4">
              {deck && <DeckIcon icon={deck.icon} color={deck.color} size="sm" />}
              <span className="truncate text-sm font-semibold text-mute">{deck?.title}</span>
              {!card.srs && !current.repeat && (
                <span className="rounded-full bg-easy-soft px-2 py-0.5 text-[11px] font-bold text-easy">новая</span>
              )}
              {current.repeat && (
                <span className="rounded-full bg-again-soft px-2 py-0.5 text-[11px] font-bold text-again">ещё раз</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="ml-auto grid size-9 shrink-0 place-items-center rounded-full text-dim hover:bg-surface-2"
                aria-label="Редактировать карточку"
              >
                <Pencil size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-6 sm:px-7">
              {face === "front" ? (
                <div className="flex min-h-full flex-col justify-center py-6">
                  <Markdown className="text-xl leading-snug font-medium sm:text-2xl">{card.front}</Markdown>
                  {card.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {card.tags.map((t) => (
                        <span key={t} className="rounded-lg bg-surface-2 px-2 py-0.5 font-mono text-xs text-mute">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Markdown className="text-sm text-mute">{card.front}</Markdown>
                  <div className="my-4 border-t-2 border-dashed border-line" />
                  <Markdown className="text-[1.02rem]">{card.back}</Markdown>
                </>
              )}
            </div>
            {face === "front" && (
              <p className="shrink-0 animate-pulse pb-4 text-center text-xs font-semibold text-dim">Нажми, чтобы перевернуть</p>
            )}
            <div className="gloss" />
            {drag !== 0 && (
              <div
                className={`pointer-events-none absolute top-6 rounded-xl border-[3px] px-3 py-1 font-display text-lg ${
                  drag > 0 ? "left-6 -rotate-12 border-easy text-easy" : "right-6 rotate-12 border-again text-again"
                }`}
                style={{ opacity: tilt }}
              >
                {drag > 0 ? "ЛЕГКО" : "НЕ ПОМНЮ"}
              </div>
            )}
          </article>
        </div>
      </div>

      <footer className="relative shrink-0">
        {face === "front" ? (
          <button onClick={flip} className="btn btn-primary h-14 w-full text-lg">
            Показать ответ <span className="kbd hidden sm:inline">Пробел</span>
          </button>
        ) : (
          <div className="grid animate-rise grid-cols-3 gap-2.5 sm:gap-3">
            {GRADES.map((g) => {
              const ui = GRADE_UI[g];
              const scheduleIt = !cram && !current.repeat;
              const pressed = isGrade(anim) && anim === g;
              return (
                <button
                  key={g}
                  onClick={() => grade(g)}
                  data-pressed={pressed}
                  className="btn h-16 flex-col gap-0.5 px-2 leading-tight"
                  style={{
                    transform: drag && ((g === "easy" && drag > 0) || (g === "again" && drag < 0)) ? `scale(${1 + tilt * 0.06})` : undefined,
                  }}
                >
                  <span className="flex items-center gap-2 text-[0.95rem]">
                    <i className="size-1.5 rounded-full" style={{ background: `var(--${g})` }} />
                    {ui.label}
                  </span>
                  <span className="text-xs text-mute">
                    {scheduleIt ? intervalLabel(nextInterval(card.srs, g)) : g === "again" ? "повтор" : "ок"}
                    <span className="kbd ml-1.5 hidden sm:inline">{ui.key}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {float && (
          <span
            key={float.key}
            className="float-up pointer-events-none absolute -top-2 z-10 rounded-full bg-surface-2 px-3 py-1 text-sm whitespace-nowrap text-text"
            style={{
              left: float.grade === "again" ? "16.6%" : float.grade === "hard" ? "50%" : "83.3%",
            }}
          >
            {float.text}
          </span>
        )}
      </footer>

      <CardEditor open={editing} onClose={() => setEditing(false)} cardId={card.id} />
    </div>
  );
}

function Empty({ cram, deckId, exitHref }: { cram: boolean; deckId: string | null; exitHref: string }) {
  return (
    <div className="fixed inset-0 mx-auto flex max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="grid size-24 animate-float place-items-center rounded-4xl bg-easy-soft text-easy">
        <Trophy size={44} />
      </div>
      <h1 className="font-display mt-6 text-2xl">{cram ? "Здесь пока пусто" : "Повторять нечего"}</h1>
      <p className="mt-2 text-mute">
        {cram ? "В колоде нет карточек — добавь первую." : "Все карточки повторены вовремя. Можно потренироваться без влияния на расписание."}
      </p>
      <div className="mt-8 flex w-full flex-col gap-3">
        {!cram && (
          <Link href={`/review/?mode=cram${deckId ? `&deck=${deckId}` : ""}`} className="btn btn-primary w-full">
            <Dumbbell size={20} /> Свободная тренировка
          </Link>
        )}
        <Link href={exitHref} className="btn btn-outline w-full">
          Назад
        </Link>
      </div>
    </div>
  );
}

function Finish({
  total,
  first,
  spent,
  cram,
  deckId,
  onMore,
}: {
  total: number;
  first: Tally;
  spent: number;
  cram: boolean;
  deckId: string | null;
  onMore: () => void;
}) {
  const today = useToday();
  const log = useStore((s) => s.log);
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const settings = useStore((s) => s.settings);
  const left = cram ? 0 : plan({ decks, cards, log, settings }, today, deckId).total;
  const streak = streakOf(log, today);
  const graded = first.again + first.hard + first.easy;
  const accuracy = graded ? Math.round(((first.hard + first.easy) / graded) * 100) : 0;
  const shownTotal = useCountUp(total, 800, 300);
  const shownAcc = useCountUp(accuracy, 1000, 450);
  const shownStreak = useCountUp(streak.current, 700, 900);
  const exitHref = deckId ? `/deck/?id=${deckId}` : "/";

  const title = accuracy >= 90 ? "Блестяще!" : accuracy >= 70 ? "Отличная работа!" : accuracy >= 40 ? "Хороший прогресс" : "Главное — регулярность";

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
        <Confetti />
        <p className="eyebrow animate-rise">
          {cram ? "Тренировка завершена" : "Сессия завершена"}
        </p>
        <h1 className="font-display mt-2 animate-pop text-4xl [animation-delay:100ms]">{title}</h1>

        <div className="mt-8 grid w-full grid-cols-3 gap-3">
          {[
            { icon: Target, label: "Карточек", value: shownTotal, color: "text-sky-ink", bg: "bg-sky-soft" },
            { icon: Trophy, label: "Помню", value: `${shownAcc}%`, color: "text-easy", bg: "bg-easy-soft" },
            { icon: Clock, label: "Время", value: duration(spent), color: "text-hard", bg: "bg-hard-soft" },
          ].map(({ icon: Icon, label, value, color, bg }, i) => (
            <div key={label} className="tile animate-pop p-3" style={{ animationDelay: `${250 + i * 120}ms` }}>
              <div className={`mx-auto grid size-9 place-items-center rounded-xl ${bg} ${color}`}>
                <Icon size={19} strokeWidth={2.4} />
              </div>
              <div className={`font-display mt-2 text-xl tabular-nums ${color}`}>{value}</div>
              <div className="text-xs font-semibold text-mute">{label}</div>
            </div>
          ))}
        </div>

        <div className="tile mt-4 w-full animate-rise p-5 [animation-delay:650ms]">
          <div className="mb-4 flex items-center justify-center gap-2">
            <StreakFlame lit size={30} className="ignite" />
            <span className="font-display text-2xl text-flame tabular-nums">{shownStreak}</span>
            <span className="font-semibold text-mute">
              {plu(streak.current, ["день", "дня", "дней"]).replace(/^\d+ /, "")} подряд
            </span>
          </div>
          <WeekStrip log={log} today={today} ignite />
        </div>

        <div className="mt-8 flex w-full animate-rise flex-col gap-3 [animation-delay:800ms]">
          {(left > 0 || cram) && (
            <button onClick={onMore} className="btn btn-primary w-full text-lg">
              {cram ? <Dumbbell size={20} /> : <Play size={20} fill="currentColor" />}
              {cram ? "Ещё тренировку" : `Продолжить · ${left}`}
            </button>
          )}
          <Link href={exitHref} className={`btn w-full ${left > 0 || cram ? "btn-outline" : "btn-primary"}`}>
            {deckId ? "К колоде" : "На главную"}
          </Link>
        </div>
      </div>
    </div>
  );
}
