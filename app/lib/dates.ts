const pad = (n: number) => String(n).padStart(2, "0");

export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const today = () => isoOf(new Date());

export const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (iso: string, n: number) => {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return isoOf(d);
};

export const diffDays = (from: string, to: string) =>
  Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);

export const weekday = (iso: string) => (parse(iso).getDay() + 6) % 7;

export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

export const plu = (n: number, forms: [string, string, string]) => `${n} ${plural(n, ...forms)}`;

const spell = (n: number, forms: [string, string, string]) => (n === 1 ? forms[0] : plu(n, forms));

export const inDays = (days: number) => {
  if (days < 1) return "сегодня";
  if (days === 1) return "завтра";
  if (days < 7) return `через ${plu(days, ["день", "дня", "дней"])}`;
  if (days < 30) return `через ${spell(Math.round(days / 7), ["неделю", "недели", "недель"])}`;
  if (days < 365) return `через ${spell(Math.round(days / 30), ["месяц", "месяца", "месяцев"])}`;
  const years = Math.round(days / 182.5) / 2;
  return Number.isInteger(years)
    ? `через ${spell(years, ["год", "года", "лет"])}`
    : `через ${String(years).replace(".", ",")} года`;
};

export const longDate = (iso: string) =>
  parse(iso).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

export const duration = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};
