export const GRADES = ["again", "hard", "easy"] as const;
// Тип выводится из массива: добавишь оценку в GRADES — тип обновится сам
export type Grade = (typeof GRADES)[number];

export type Srs = {
  /** день следующего показа, YYYY-MM-DD */
  due: string;
  /** текущий интервал в днях */
  interval: number;
  /** коэффициент лёгкости SM-2, не ниже 1.3 */
  ease: number;
  /** сколько раз подряд вспомнил */
  reps: number;
  /** сколько раз забыл за всё время */
  lapses: number;
  last: string;
};

export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  created: number;
  /** нет srs — карточка новая */
  srs?: Srs;
  /** карточка из стартового набора */
  seed?: boolean;
  /** стартовую карточку правили руками — не перезаписываем при обновлении набора */
  edited?: boolean;
};

export const DECK_COLORS = {
  amber: "#F2B705",
  blue: "#3178C6",
  cyan: "#0FB5D4",
  fuchsia: "#C946EF",
  green: "#22A06B",
  indigo: "#5A67D8",
  rose: "#F0567A",
  slate: "#64748B",
} as const;

export type DeckColor = keyof typeof DECK_COLORS;

export const DECK_ICONS = ["braces", "type", "atom", "boxes", "database", "triangle", "code", "brain", "globe", "terminal"] as const;
export type DeckIcon = (typeof DECK_ICONS)[number];

export type Deck = {
  id: string;
  title: string;
  description: string;
  color: DeckColor;
  icon: DeckIcon;
  created: number;
  seed?: boolean;
};

export type DayLog = {
  reviews: number;
  again: number;
  hard: number;
  easy: number;
  /** сколько новых карточек увидел впервые */
  fresh: number;
  /** время в сессиях, мс */
  ms: number;
};

export type Settings = {
  newPerDay: number;
  sessionSize: number;
};

export type SeedDeck = Omit<Deck, "created" | "seed"> & {
  cards: { id: string; front: string; back: string; tags: string[] }[];
};
