"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { ChevronLeft, Download, Dumbbell, Pencil, Play, Plus, Search, Trash } from "lucide-react";
import CardEditor from "../elements/CardEditor";
import CardRow from "../elements/CardRow";
import DeckEditor from "../elements/DeckEditor";
import DeckIcon from "../elements/DeckIcon";
import Sheet from "../elements/Sheet";
import { PageSkeleton } from "../elements/Visuals";
import { useReady, useToday } from "../lib/hooks";
import { downloadJson, slug } from "../lib/io";
import { cardsOf, countStates, plan } from "../lib/queue";
import { stateOf, type CardState } from "../lib/srs";
import { exportData, useStore } from "../lib/store";
import { toast } from "../lib/toast";

export default function DeckView() {
  const ready = useReady();
  const today = useToday();
  const id = useSearchParams().get("id");
  const exists = useStore((s) => (id ? !!s.decks[id] : false));
  if (!ready || !today) return <PageSkeleton />;
  if (!id || !exists) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl">Колода не найдена</p>
        <Link href="/decks/" className="btn btn-primary mt-6">
          К колодам
        </Link>
      </div>
    );
  }
  return <Deck id={id} today={today} />;
}

const FILTERS: { id: CardState | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "learning", label: "Учу" },
  { id: "learned", label: "Выучено" },
];

function Deck({ id, today }: { id: string; today: string }) {
  const router = useRouter();
  const deck = useStore((s) => s.decks[id]);
  const decks = useStore((s) => s.decks);
  const allCards = useStore((s) => s.cards);
  const log = useStore((s) => s.log);
  const settings = useStore((s) => s.settings);
  const deleteDeck = useStore((s) => s.deleteDeck);

  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const [filter, setFilter] = useState<CardState | "all">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [editCard, setEditCard] = useState<string | null | "new">(null);
  const [editDeck, setEditDeck] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cards = cardsOf(allCards, id);
  const states = countStates(cards);
  const due = plan({ decks, cards: allCards, log, settings }, today, id).total;
  const total = cards.length || 1;

  const tagCounts = new Map<string, number>();
  cards.forEach((c) => c.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)));
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);

  const visible = cards.filter(
    (c) =>
      (filter === "all" || stateOf(c.srs) === filter) &&
      (!tag || c.tags.includes(tag)) &&
      (!deferred || `${c.front} ${c.back}`.toLowerCase().includes(deferred)),
  );

  return (
    <div className="space-y-5">
      <Link href="/decks/" className="-ml-2 inline-flex animate-fade items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-mute hover:bg-surface-2">
        <ChevronLeft size={18} /> Колоды
      </Link>

      <section className="tile animate-rise p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <DeckIcon icon={deck.icon} color={deck.color} size="lg" className="animate-pop" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl leading-tight">{deck.title}</h1>
            {deck.description && <p className="mt-1 text-sm text-mute">{deck.description}</p>}
          </div>
          <button onClick={() => setEditDeck(true)} className="grid size-10 shrink-0 place-items-center rounded-full text-dim hover:bg-surface-2" aria-label="Изменить колоду">
            <Pencil size={18} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "новые", value: states.new, color: "text-easy" },
            { label: "учу", value: states.learning, color: "text-hard" },
            { label: "выучено", value: states.learned, color: "text-primary-ink" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-surface-2 py-2.5">
              <div className={`font-display text-xl tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-xs font-semibold text-mute">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div className="bg-primary transition-[width] duration-700" style={{ width: `${(states.learned / total) * 100}%` }} />
          <div className="bg-hard transition-[width] duration-700" style={{ width: `${(states.learning / total) * 100}%` }} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {due > 0 && (
            <Link href={`/review/?deck=${id}`} className="btn btn-primary px-3 whitespace-nowrap">
              <Play size={18} fill="currentColor" /> Учить · {due}
            </Link>
          )}
          <Link href={`/review/?mode=cram&deck=${id}`} className={`btn px-3 whitespace-nowrap ${due > 0 ? "btn-soft" : "btn-soft col-span-2"}`}>
            <Dumbbell size={18} /> {due > 0 ? "Тренировка" : "На сегодня всё · тренировка"}
          </Link>
        </div>
      </section>

      <div className="flex animate-rise items-center gap-2 [animation-delay:60ms]">
        <label className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-dim" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск в колоде" className="input py-2.5 pl-10" type="search" />
        </label>
        <button onClick={() => setEditCard("new")} className="btn btn-primary min-h-11 shrink-0 px-4" aria-label="Добавить карточку">
          <Plus size={20} strokeWidth={2.6} />
          <span className="hidden sm:inline">Карточка</span>
        </button>
      </div>

      <div className="no-scrollbar -mx-4 flex animate-rise gap-2 overflow-x-auto px-4 [animation-delay:90ms] sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition ${
              filter === f.id ? "border-primary bg-primary text-on-primary" : "border-line text-mute"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 w-0.5 shrink-0 rounded bg-line" />
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setTag(tag === t ? null : t)}
            className={`shrink-0 rounded-full border-2 px-3 py-1.5 font-mono text-xs font-semibold transition ${
              tag === t ? "border-primary bg-primary-soft text-primary-ink" : "border-line text-mute"
            }`}
          >
            #{t}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {visible.map((card, i) => (
          <div key={card.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 12) * 30 + 120}ms` }}>
            <CardRow card={card} today={today} onEdit={setEditCard} />
          </div>
        ))}
        {visible.length === 0 && (
          <p className="py-10 text-center text-mute">{cards.length ? "Под фильтр ничего не подходит" : "Пока пусто — добавь первую карточку"}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-4">
        <button
          onClick={() => {
            downloadJson(exportData(id, false), `synapse-${slug(deck.title)}.json`);
            toast("Колода выгружена");
          }}
          className="btn btn-outline min-h-10 px-3.5 text-sm"
        >
          <Download size={16} /> Экспорт колоды
        </button>
        <button onClick={() => setConfirmDelete(true)} className="btn btn-ghost min-h-10 px-3.5 text-sm text-again">
          <Trash size={16} /> Удалить колоду
        </button>
      </div>

      <CardEditor open={editCard !== null} onClose={() => setEditCard(null)} cardId={editCard === "new" ? null : editCard} deckId={id} />
      <DeckEditor open={editDeck} onClose={() => setEditDeck(false)} deckId={id} />
      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Удалить колоду?">
        <p className="text-mute">
          «{deck.title}» и все её карточки ({cards.length}) вместе с прогрессом будут удалены. Отменить нельзя.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setConfirmDelete(false)} className="btn btn-outline flex-1">
            Отмена
          </button>
          <button
            onClick={() => {
              router.push("/decks/");
              deleteDeck(id);
              toast("Колода удалена");
            }}
            className="btn btn-again flex-1"
          >
            Удалить
          </button>
        </div>
      </Sheet>
    </div>
  );
}
