import { isExportData, type ExportData } from "./store";
import { DECK_COLORS, DECK_ICONS, type Card, type DayLog, type Deck, type DeckIcon, type Srs } from "./types";

export const downloadJson = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "") || "deck";

// Файл пришёл извне — типы TS тут ничего не гарантируют, проверяем каждое поле
type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const cleanDeck = (d: Raw): Deck | null => {
  if (!str(d.id) || !str(d.title)) return null;
  return {
    id: str(d.id),
    title: str(d.title),
    description: str(d.description),
    color: str(d.color) in DECK_COLORS ? (d.color as Deck["color"]) : "slate",
    icon: DECK_ICONS.includes(d.icon as DeckIcon) ? (d.icon as DeckIcon) : "code",
    created: num(d.created, Date.now()),
    ...(d.seed === true && { seed: true }),
  };
};

const cleanSrs = (s: unknown): Srs | undefined => {
  if (!s || typeof s !== "object") return undefined;
  const r = s as Raw;
  if (!DAY.test(str(r.due))) return undefined;
  return {
    due: str(r.due),
    interval: num(r.interval, 1),
    ease: Math.max(1.3, num(r.ease, 2.5)),
    reps: num(r.reps, 0),
    lapses: num(r.lapses, 0),
    last: DAY.test(str(r.last)) ? str(r.last) : str(r.due),
  };
};

const cleanCard = (c: Raw): Card | null => {
  if (!str(c.id) || !str(c.deckId) || !str(c.front) || !str(c.back)) return null;
  return {
    id: str(c.id),
    deckId: str(c.deckId),
    front: str(c.front),
    back: str(c.back),
    tags: Array.isArray(c.tags) ? c.tags.filter((t): t is string => typeof t === "string") : [],
    created: num(c.created, Date.now()),
    srs: cleanSrs(c.srs),
    ...(c.seed === true && { seed: true }),
    ...(c.edited === true && { edited: true }),
  };
};

const cleanLog = (log: unknown): Record<string, DayLog> => {
  if (!log || typeof log !== "object") return {};
  return Object.fromEntries(
    Object.entries(log as Raw)
      .filter(([day, v]) => DAY.test(day) && v && typeof v === "object")
      .map(([day, v]) => {
        const r = v as Raw;
        return [
          day,
          {
            reviews: num(r.reviews, 0),
            again: num(r.again, 0),
            hard: num(r.hard, 0),
            easy: num(r.easy, 0),
            fresh: num(r.fresh, 0),
            ms: num(r.ms, 0),
          },
        ];
      }),
  );
};

const notNull = <T,>(v: T | null): v is T => v !== null;

export const readExport = async (file: File): Promise<ExportData> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("Это не JSON");
  }
  if (!isExportData(parsed)) throw new Error("Файл не похож на экспорт Синапса");
  return {
    ...parsed,
    decks: (parsed.decks as unknown as Raw[]).map(cleanDeck).filter(notNull),
    cards: (parsed.cards as unknown as Raw[]).map(cleanCard).filter(notNull),
    log: cleanLog(parsed.log),
  };
};
