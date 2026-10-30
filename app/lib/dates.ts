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

export const intervalLabel = (days: number) => {
  if (days < 1) return "сейчас";
  if (days < 7) return `${days} д`;
  if (days < 30) return `${Math.round(days / 7)} нед`;
  if (days < 365) return `${Math.round(days / 30)} мес`;
  return `${(days / 365).toFixed(1).replace(".0", "").replace(".", ",")} г`;
};

export const longDate = (iso: string) =>
  parse(iso).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

export const duration = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};
