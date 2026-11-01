import { addDays, diffDays } from "./dates";
import { stateOf, type CardState } from "./srs";
import type { Card, DayLog, Deck, Settings } from "./types";

export type Scope = { cards: Record<string, Card>; decks: Record<string, Deck>; log: Record<string, DayLog>; settings: Settings };

const shuffle = <T,>(items: T[]) => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const deckOrder = (decks: Record<string, Deck>) => Object.values(decks).sort((a, b) => a.created - b.created);

export const cardsOf = (cards: Record<string, Card>, deckId?: string | null) =>
  Object.values(cards)
    .filter((c) => !deckId || c.deckId === deckId)
    .sort((a, b) => a.created - b.created);

export const normalize = (s: string) => s.toLowerCase().replace(/ё/g, "е");

export const matches = (card: Card, query: string) =>
  normalize(`${card.front} ${card.back} ${card.tags.join(" ")}`).includes(query);

export const isDue = (card: Card, day: string) => !!card.srs && card.srs.due <= day;

export const newLeftToday = (s: Scope, day: string) => Math.max(0, s.settings.newPerDay - (s.log[day]?.fresh ?? 0));

const freshQueue = (s: Scope, deckId?: string | null) => {
  const decks = deckOrder(s.decks).filter((d) => !deckId || d.id === deckId);
  const lanes = decks.map((d) => cardsOf(s.cards, d.id).filter((c) => !c.srs));
  const out: Card[] = [];
  for (let i = 0; lanes.some((lane) => i < lane.length); i++) {
    lanes.forEach((lane) => lane[i] && out.push(lane[i]));
  }
  return out;
};

export const plan = (s: Scope, day: string, deckId?: string | null) => {
  const due = cardsOf(s.cards, deckId)
    .filter((c) => isDue(c, day))
    .sort((a, b) => a.srs!.due.localeCompare(b.srs!.due));
  const fresh = freshQueue(s, deckId).slice(0, newLeftToday(s, day));
  return { due, fresh, total: due.length + fresh.length };
};

export const buildSession = (s: Scope, day: string, deckId?: string | null) => {
  const { due, fresh } = plan(s, day, deckId);
  const size = s.settings.sessionSize;
  const takeDue = due.slice(0, size);
  const takeFresh = fresh.slice(0, size - takeDue.length);
  return shuffle([...takeDue, ...takeFresh]).map((c) => c.id);
};

export const buildCram = (s: Scope, deckId?: string | null) => {
  const scored = cardsOf(s.cards, deckId).map((c) => ({
    id: c.id,
    score: c.srs ? c.srs.lapses * 1.5 + (2.6 - c.srs.ease) * 2 + Math.random() * 2 : Math.random() * 1.2,
  }));
  return shuffle(
    scored
      .sort((a, b) => b.score - a.score)
      .slice(0, s.settings.sessionSize)
      .map((c) => c.id),
  );
};

export const countStates = (cards: Card[]) => {
  const out: Record<CardState, number> = { new: 0, learning: 0, learned: 0 };
  cards.forEach((c) => out[stateOf(c.srs)]++);
  return out;
};

export const streakOf = (log: Record<string, DayLog>, day: string) => {
  const active = (d: string) => (log[d]?.reviews ?? 0) > 0;
  let current = 0;
  let cursor = active(day) ? day : addDays(day, -1);
  while (active(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  const days = Object.keys(log).filter(active).sort();
  let best = 0;
  let run = 0;
  days.forEach((d, i) => {
    run = i > 0 && diffDays(days[i - 1], d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return { current, best, today: active(day) };
};

export const hardest = (cards: Card[], limit = 8) =>
  cards
    .filter((c) => c.srs && stateOf(c.srs) !== "learned" && (c.srs.lapses > 0 || c.srs.ease < 2.3))
    .sort((a, b) => b.srs!.lapses - a.srs!.lapses || a.srs!.ease - b.srs!.ease)
    .slice(0, limit);

export const todayByDeck = (s: Scope, day: string) => {
  const { due, fresh } = plan(s, day);
  const counts: Record<string, number> = {};
  [...due, ...fresh].forEach((c) => {
    counts[c.deckId] = (counts[c.deckId] ?? 0) + 1;
  });
  return counts;
};
