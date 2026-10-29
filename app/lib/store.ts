import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { del, get, set as put } from "idb-keyval";
import { SEED } from "../data";
import { today } from "./dates";
import { schedule } from "./srs";
import type { Card, DayLog, Deck, DeckColor, DeckIcon, Grade, Settings } from "./types";

// IndexedDB вместо localStorage: лимит в сотни мегабайт и запись не блокирует поток.
// На сервере (при сборке статики) базы нет — отдаём пустоту.
const idb: StateStorage = {
  getItem: async (name) => (typeof indexedDB === "undefined" ? null : ((await get<string>(name)) ?? null)),
  setItem: (name, value) => (typeof indexedDB === "undefined" ? undefined : put(name, value)),
  removeItem: (name) => (typeof indexedDB === "undefined" ? undefined : del(name)),
};

export const EMPTY_LOG: DayLog = { reviews: 0, again: 0, hard: 0, easy: 0, fresh: 0, ms: 0 };

// "kesh" — прежнее название приложения: ключ оставлен, чтобы открывались старые бэкапы и сохранился прогресс
export type ExportData = {
  app: "kesh";
  version: 1;
  exported: string;
  decks: Deck[];
  cards: Card[];
  log?: Record<string, DayLog>;
};

type Data = {
  decks: Record<string, Deck>;
  cards: Record<string, Card>;
  log: Record<string, DayLog>;
  settings: Settings;
  /** id стартовых колод и карточек, которые удалил пользователь */
  removed: string[];
};

type Actions = {
  review: (id: string, grade: Grade, ms: number, scheduleIt: boolean) => void;
  addCard: (card: Pick<Card, "deckId" | "front" | "back" | "tags">) => string;
  updateCard: (id: string, patch: Partial<Pick<Card, "deckId" | "front" | "back" | "tags">>) => void;
  deleteCard: (id: string) => void;
  resetCard: (id: string) => void;
  addDeck: (deck: { title: string; description: string; color: DeckColor; icon: DeckIcon }) => string;
  updateDeck: (id: string, patch: Partial<Pick<Deck, "title" | "description" | "color" | "icon">>) => void;
  deleteDeck: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void;
  importData: (data: ExportData, mode: "merge" | "replace") => { decks: number; cards: number };
};

type State = Data & Actions & { hydrated: boolean };

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const without = <T,>(record: Record<string, T>, ids: Set<string>) =>
  Object.fromEntries(Object.entries(record).filter(([id]) => !ids.has(id)));

// Подмешиваем стартовый набор: новые карточки добавляются, нетронутые обновляются,
// отредактированные и удалённые пользователем остаются как есть.
const withSeed = (data: Data): Pick<Data, "decks" | "cards"> => {
  const removed = new Set(data.removed);
  const decks = { ...data.decks };
  const cards = { ...data.cards };
  SEED.forEach(({ cards: seedCards, ...deck }, deckIndex) => {
    if (removed.has(deck.id)) return;
    decks[deck.id] = decks[deck.id] ?? { ...deck, created: deckIndex, seed: true };
    seedCards.forEach((seed, i) => {
      if (removed.has(seed.id)) return;
      const current = cards[seed.id];
      if (current?.edited) return;
      cards[seed.id] = { ...current, ...seed, deckId: deck.id, created: current?.created ?? i, seed: true };
    });
  });
  return { decks, cards };
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      decks: {},
      cards: {},
      log: {},
      settings: { newPerDay: 15, sessionSize: 20 },
      removed: [],
      hydrated: false,

      review: (id, grade, ms, scheduleIt) =>
        set((s) => {
          const card = s.cards[id];
          if (!card) return {};
          const day = today();
          const log = s.log[day] ?? EMPTY_LOG;
          return {
            cards: scheduleIt ? { ...s.cards, [id]: { ...card, srs: schedule(card.srs, grade, day) } } : s.cards,
            log: {
              ...s.log,
              [day]: {
                ...log,
                reviews: log.reviews + 1,
                [grade]: log[grade] + 1,
                fresh: log.fresh + (scheduleIt && !card.srs ? 1 : 0),
                ms: log.ms + ms,
              },
            },
          };
        }),

      addCard: (card) => {
        const id = uid();
        set((s) => ({ cards: { ...s.cards, [id]: { ...card, id, created: Date.now() } } }));
        return id;
      },

      updateCard: (id, patch) =>
        set((s) => {
          const card = s.cards[id];
          return card ? { cards: { ...s.cards, [id]: { ...card, ...patch, edited: card.seed || undefined } } } : {};
        }),

      deleteCard: (id) =>
        set((s) => ({
          cards: without(s.cards, new Set([id])),
          removed: s.cards[id]?.seed ? [...s.removed, id] : s.removed,
        })),

      resetCard: (id) =>
        set((s) => {
          const card = s.cards[id];
          return card ? { cards: { ...s.cards, [id]: { ...card, srs: undefined } } } : {};
        }),

      addDeck: (deck) => {
        const id = uid();
        set((s) => ({ decks: { ...s.decks, [id]: { ...deck, id, created: Date.now() } } }));
        return id;
      },

      updateDeck: (id, patch) =>
        set((s) => (s.decks[id] ? { decks: { ...s.decks, [id]: { ...s.decks[id], ...patch } } } : {})),

      deleteDeck: (id) =>
        set((s) => {
          const ids = Object.values(s.cards).filter((c) => c.deckId === id);
          const seedIds = ids.filter((c) => c.seed).map((c) => c.id);
          return {
            decks: without(s.decks, new Set([id])),
            cards: without(s.cards, new Set(ids.map((c) => c.id))),
            removed: [...s.removed, ...(s.decks[id]?.seed ? [id] : []), ...seedIds],
          };
        }),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetProgress: () =>
        set((s) => ({
          cards: Object.fromEntries(Object.entries(s.cards).map(([id, c]) => [id, { ...c, srs: undefined }])),
          log: {},
        })),

      importData: (data, mode) => {
        const base: Data =
          mode === "replace"
            ? { ...get(), decks: {}, cards: {}, log: {}, removed: SEED.flatMap((d) => [d.id, ...d.cards.map((c) => c.id)]) }
            : get();
        const decks = { ...base.decks, ...Object.fromEntries(data.decks.map((d) => [d.id, d])) };
        const cards = { ...base.cards };
        data.cards.forEach((card) => {
          if (!decks[card.deckId]) return;
          // при слиянии не затираем прогресс, если в файле его нет
          cards[card.id] = { ...card, srs: card.srs ?? cards[card.id]?.srs };
        });
        const log = { ...base.log };
        Object.entries(data.log ?? {}).forEach(([day, entry]) => {
          log[day] = mode === "replace" || !log[day] || entry.reviews > log[day].reviews ? entry : log[day];
        });
        // импортированное больше не считается удалённым
        const imported = new Set([...data.decks.map((d) => d.id), ...data.cards.map((c) => c.id)]);
        set({ decks, cards, log, removed: base.removed.filter((id) => !imported.has(id)) });
        return { decks: data.decks.length, cards: data.cards.filter((c) => decks[c.deckId]).length };
      },
    }),
    {
      name: "kesh",
      version: 1,
      storage: createJSONStorage(() => idb),
      partialize: ({ decks, cards, log, settings, removed }) => ({ decks, cards, log, settings, removed }),
      onRehydrateStorage: () => () => {
        useStore.setState((s) => ({ ...withSeed(s), hydrated: true }));
      },
    },
  ),
);

export const exportData = (deckId?: string, withProgress = true): ExportData => {
  const { decks, cards, log } = useStore.getState();
  const pick = (c: Card): Card => (withProgress ? c : { ...c, srs: undefined });
  return {
    app: "kesh",
    version: 1,
    exported: new Date().toISOString(),
    decks: Object.values(decks).filter((d) => !deckId || d.id === deckId),
    cards: Object.values(cards)
      .filter((c) => !deckId || c.deckId === deckId)
      .map(pick),
    log: deckId ? undefined : log,
  };
};

export const isExportData = (value: unknown): value is ExportData => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<ExportData>;
  return v.app === "kesh" && Array.isArray(v.decks) && Array.isArray(v.cards);
};
