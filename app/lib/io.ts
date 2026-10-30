import { isoOf, parse } from "./dates";
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

type Raw = Record<string, unknown>;

const MAX_FILE = 20 * 1024 * 1024;
const MAX_TEXT = 20_000;
const MAX_ID = 64;
const MAX_TAGS = 20;
const MAX_DECKS = 200;
const MAX_CARDS = 10_000;
const RESERVED = new Set(["__proto__", "constructor", "prototype"]);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const str = (v: unknown, max = MAX_TEXT) => (typeof v === "string" ? v.slice(0, max) : "");

const id = (v: unknown) => {
  const value = typeof v === "string" ? v.trim() : "";
  return value && value.length <= MAX_ID && !RESERVED.has(value) ? value : "";
};

const num = (v: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

const int = (v: unknown, fallback: number, max: number) => Math.round(num(v, fallback, 0, max));

const isDay = (v: unknown): v is string => typeof v === "string" && DAY.test(v) && isoOf(parse(v)) === v;

const isRaw = (v: unknown): v is Raw => !!v && typeof v === "object" && !Array.isArray(v);

const cleanDeck = (d: Raw): Deck | null => {
  const title = str(d.title, 200).trim();
  if (!id(d.id) || !title) return null;
  return {
    id: id(d.id),
    title,
    description: str(d.description, 500),
    color: typeof d.color === "string" && Object.hasOwn(DECK_COLORS, d.color) ? (d.color as Deck["color"]) : "slate",
    icon: DECK_ICONS.includes(d.icon as DeckIcon) ? (d.icon as DeckIcon) : "code",
    created: num(d.created, Date.now()),
    ...(d.seed === true && { seed: true }),
  };
};

const cleanSrs = (s: unknown): Srs | undefined => {
  if (!isRaw(s) || !isDay(s.due)) return undefined;
  return {
    due: s.due,
    interval: int(s.interval, 1, 36_500),
    ease: num(s.ease, 2.5, 1.3, 5),
    reps: int(s.reps, 0, 10_000),
    lapses: int(s.lapses, 0, 10_000),
    last: isDay(s.last) ? s.last : s.due,
  };
};

const cleanCard = (c: Raw): Card | null => {
  if (!id(c.id) || !id(c.deckId) || !str(c.front).trim() || !str(c.back).trim()) return null;
  return {
    id: id(c.id),
    deckId: id(c.deckId),
    front: str(c.front),
    back: str(c.back),
    tags: Array.isArray(c.tags)
      ? c.tags
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.slice(0, 40))
          .slice(0, MAX_TAGS)
      : [],
    created: num(c.created, Date.now()),
    srs: cleanSrs(c.srs),
    ...(c.seed === true && { seed: true }),
    ...(c.edited === true && { edited: true }),
  };
};

const cleanLog = (log: unknown): Record<string, DayLog> => {
  if (!isRaw(log)) return {};
  return Object.fromEntries(
    Object.entries(log)
      .filter(([day, v]) => isDay(day) && isRaw(v))
      .map(([day, v]) => {
        const r = v as Raw;
        return [
          day,
          {
            reviews: int(r.reviews, 0, 100_000),
            again: int(r.again, 0, 100_000),
            hard: int(r.hard, 0, 100_000),
            easy: int(r.easy, 0, 100_000),
            fresh: int(r.fresh, 0, 100_000),
            ms: int(r.ms, 0, 86_400_000),
          },
        ];
      }),
  );
};

const notNull = <T,>(v: T | null): v is T => v !== null;

export const readExport = async (file: File): Promise<ExportData> => {
  if (file.size > MAX_FILE) throw new Error("Файл слишком большой");
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("Это не JSON");
  }
  if (!isExportData(parsed)) throw new Error("Файл не похож на экспорт Синапса");
  return {
    ...parsed,
    decks: (parsed.decks as unknown[]).slice(0, MAX_DECKS).filter(isRaw).map(cleanDeck).filter(notNull),
    cards: (parsed.cards as unknown[]).slice(0, MAX_CARDS).filter(isRaw).map(cleanCard).filter(notNull),
    log: cleanLog(parsed.log),
  };
};
