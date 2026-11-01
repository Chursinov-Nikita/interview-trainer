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
import { PageSkeleton, StateBar } from "../elements/Visuals";
import { plu } from "../lib/dates";
import { useReady, useToday } from "../lib/hooks";
import { downloadJson, slug } from "../lib/io";
import { cardsOf, countStates, matches, normalize, plan } from "../lib/queue";
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
        <p className="text-xl font-semibold">Колода не найдена</p>
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
  const deferred = useDeferredValue(normalize(query.trim()));
  const [filter, setFilter] = useState<CardState | "all">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [editCard, setEditCard] = useState<string | null | "new">(null);
  const [editDeck, setEditDeck] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cards = cardsOf(allCards, id);
  const states = countStates(cards);
  const due = plan({ decks, cards: allCards, log, settings }, today, id).total;

  const tagCounts = new Map<string, number>();
  cards.forEach((c) => c.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)));
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);

  const visible = cards.filter(
    (c) =>
      (filter === "all" || stateOf(c.srs) === filter) &&
      (!tag || c.tags.includes(tag)) &&
      (!deferred || matches(c, deferred)),
  );

  return (
    <div className="space-y-[14px]">
      <Link href="/decks/" className="inline-flex items-center gap-1 text-sm text-mute hover:text-text">
        <ChevronLeft size={16} /> Колоды
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 pb-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <DeckIcon icon={deck.icon} />
          <div className="min-w-0">
            <h1 className="text-2xl font-medium">{deck.title}</h1>
            {deck.description && <p className="mt-1 text-mute">{deck.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditDeck(true)} className="btn btn-ghost size-9 min-h-0 p-0" aria-label="Изменить колоду">
            <Pencil size={16} />
          </button>
          <Link href={`/review/?mode=cram&deck=${encodeURIComponent(id)}`} className="btn min-h-9 px-4 text-sm">
            <Dumbbell size={16} /> Тренировка
          </Link>
          {due > 0 && (
            <Link href={`/review/?deck=${encodeURIComponent(id)}`} className="btn btn-primary min-h-9 px-4 text-sm">
              <Play size={14} fill="currentColor" /> Учить · {due}
            </Link>
          )}
        </div>
      </header>

      <section className="tile p-[22px]" aria-label="Прогресс колоды">
        <dl className="grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:divide-x sm:divide-line">
          {[
            { label: "Всего", value: cards.length },
            { label: "Новые", value: states.new },
            { label: "Учу", value: states.learning },
            { label: "Выучено", value: states.learned },
          ].map((s, i) => (
            <div key={s.label} className={i ? "sm:pl-5" : ""}>
              <dt className="text-[13px] text-dim">{s.label}</dt>
              <dd className="num mt-1 text-2xl">{s.value}</dd>
            </div>
          ))}
        </dl>
        <StateBar learned={states.learned} learning={states.learning} total={cards.length} className="mt-5 bg-surface-2" />
        <p className="mt-2 text-[13px] text-dim">
          <span className="text-mute">Выучено</span> — интервал от трёх недель · <span className="text-mute">Учу</span> — уже
          видел, но интервал короче
        </p>
      </section>

      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-dim" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск в колоде" className="input rounded-full pl-10" type="search" />
        </label>
        <button onClick={() => setEditCard("new")} className="btn btn-primary min-h-10 shrink-0 px-4 text-sm" aria-label="Добавить карточку">
          <Plus size={16} strokeWidth={2.2} />
          <span className="hidden sm:inline">Карточка</span>
        </button>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              filter === f.id ? "bg-surface-2 text-text" : "text-mute hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1.5 w-px shrink-0 bg-line" />
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setTag(tag === t ? null : t)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] transition-colors ${
              tag === t ? "bg-surface-2 text-text" : "text-dim hover:text-text"
            }`}
          >
            #{t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="px-1 text-[13px] text-dim">
          {visible.length === cards.length ? plu(cards.length, ["карточка", "карточки", "карточек"]) : `${visible.length} из ${cards.length}`}
        </p>
        {visible.map((card) => (
          <CardRow key={card.id} card={card} today={today} onEdit={setEditCard} />
        ))}
        {visible.length === 0 && (
          <p className="tile px-[22px] py-5 text-mute">{cards.length ? "Под фильтр ничего не подходит" : "Пока пусто — добавь первую карточку"}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-6">
        <button
          onClick={() => {
            downloadJson(exportData(id, false), `synapse-${slug(deck.title)}.json`);
            toast("Колода выгружена");
          }}
          className="btn min-h-9 px-4 text-sm"
        >
          <Download size={16} /> Экспорт колоды
        </button>
        <button onClick={() => setConfirmDelete(true)} className="btn btn-ghost min-h-9 px-4 text-sm text-again">
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
