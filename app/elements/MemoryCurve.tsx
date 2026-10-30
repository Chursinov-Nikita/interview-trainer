import { addDays, parse, plu } from "../lib/dates";
import { forecast } from "../lib/queue";
import type { Card } from "../lib/types";

const DAYS = 14;

const shortDay = (iso: string) => parse(iso).toLocaleDateString("ru-RU", { weekday: "short" });
const longDay = (iso: string) => parse(iso).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

export default function MemoryCurve({ cards, today }: { cards: Card[]; today: string }) {
  const days = forecast(cards, today, DAYS);
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const top = Math.max(1, ...days.map((d) => d.count));
  const peak = days.slice(1).reduce((best, d) => (d.count > best.count ? d : best), { day: addDays(today, 1), count: 0 });

  const subline =
    total === 0
      ? "Пока по расписанию ничего не вернётся — кривая наполнится после первых сессий"
      : peak.count > 0
        ? `За две недели вернутся ${plu(total, ["карточка", "карточки", "карточек"])}. Пик — ${longDay(peak.day)}: ${peak.count}`
        : `За две недели вернутся ${plu(total, ["карточка", "карточки", "карточек"])}, всё — сегодня`;

  return (
    <section className="tile p-[22px]" aria-labelledby="curve-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="curve-title" className="text-base font-semibold">
          Кривая памяти
        </h2>
        <span className="text-xs text-dim">повторы по расписанию, {DAYS} дней</span>
      </div>
      <p className="mt-1 text-mute">{subline}</p>

      <div
        className={`mt-6 flex items-end gap-1 border-b border-line-strong sm:gap-2 ${total ? "h-36" : "h-3"}`}
        role="img"
        aria-label={subline}
      >
        {days.map((d, i) => (
          <div key={d.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <span className={`num mb-1 text-xs ${i === 0 ? "text-accent" : "text-mute"} ${d.count ? "" : "hidden"}`}>
              {d.count}
            </span>
            <div
              className={`w-full max-w-9 rounded-t-[4px] ${i === 0 ? "bg-accent" : "bg-accent/40"}`}
              style={{ height: d.count ? `${Math.max(3, (d.count / top) * 82)}%` : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-2" aria-hidden>
        {days.map((d, i) => (
          <span
            key={d.day}
            className={`num min-w-0 flex-1 text-center text-[13px] ${i === 0 ? "text-text" : "text-dim"} ${
              i % 2 ? "max-sm:invisible" : ""
            }`}
            title={shortDay(d.day)}
          >
            {i === 0 ? "сег" : parse(d.day).getDate()}
          </span>
        ))}
      </div>
    </section>
  );
}
