"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isoOf, parse, plu, WEEKDAYS } from "../lib/dates";
import type { DayLog } from "../lib/types";

const monthDays = (year: number, month: number) => {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const size = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: size }, (_, i) => isoOf(new Date(year, month, i + 1))),
  ];
};

export default function MonthCalendar({ log, today }: { log: Record<string, DayLog>; today: string }) {
  const [shift, setShift] = useState(0);
  const studied = (day: string) => (log[day]?.reviews ?? 0) > 0;
  const firstDay = Object.keys(log).filter(studied).sort()[0] ?? today;

  const current = parse(today);
  const shown = new Date(current.getFullYear(), current.getMonth() + shift, 1);
  const year = shown.getFullYear();
  const days = monthDays(year, shown.getMonth());
  const studiedCount = days.filter((d) => d && studied(d)).length;
  const monthName = shown.toLocaleDateString("ru-RU", { month: "long" });
  const canGoBack = isoOf(shown) > firstDay;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {monthName[0].toUpperCase() + monthName.slice(1)} {year !== current.getFullYear() ? year : ""}
          </p>
          <p className="text-[13px] text-dim">
            {studiedCount ? `${plu(studiedCount, ["день", "дня", "дней"])} с занятиями` : "Занятий не было"}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShift((s) => s - 1)}
            disabled={!canGoBack}
            className="btn btn-ghost size-9 min-h-0 p-0"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setShift((s) => s + 1)}
            disabled={shift === 0}
            className="btn btn-ghost size-9 min-h-0 p-0"
            aria-label="Следующий месяц"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div key={shift} className="mt-4 grid animate-fade grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAYS.map((label) => (
          <span key={label} className="pb-1 text-[13px] text-dim">
            {label}
          </span>
        ))}
        {days.map((day, i) => {
          if (!day) return <span key={`empty-${i}`} />;
          const active = studied(day);
          return (
            <span
              key={day}
              title={active ? plu(log[day].reviews, ["повторение", "повторения", "повторений"]) : undefined}
              className={`num mx-auto grid size-9 place-items-center rounded-full text-sm ${
                active ? "bg-accent font-semibold text-white" : day > today ? "text-dim opacity-50" : "text-mute"
              } ${day === today ? "ring-2 ring-text ring-offset-2 ring-offset-surface" : ""}`}
            >
              {parse(day).getDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
}
