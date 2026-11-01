"use client";

import { useEffect, useState } from "react";
import { Check, Flame } from "lucide-react";
import { addDays, WEEKDAYS, weekday } from "../lib/dates";
import type { DayLog } from "../lib/types";

export function Ring({
  value,
  size = 124,
  stroke = 6,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, shown)))}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.3, 0.64, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

const CONFETTI_COLORS = ["#ffffff", "#d1d1d6", "#8e8e93", "#636366"];

export function Confetti({ count = 46 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 140 + Math.random() * 220;
      return {
        "--x": `${Math.cos(angle) * distance}px`,
        "--y": `${Math.sin(angle) * distance * 0.8 + 120}px`,
        "--r": `${Math.random() * 720 - 360}deg`,
        "--c": CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        "--w": `${6 + Math.random() * 6}px`,
        "--h": `${8 + Math.random() * 10}px`,
        "--radius": Math.random() > 0.6 ? "999px" : "3px",
        "--d": `${1.1 + Math.random() * 0.9}s`,
        "--delay": `${Math.random() * 0.15}s`,
      } as React.CSSProperties;
    }),
  );
  return (
    <div className="confetti pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      {pieces.map((style, i) => (
        <i key={i} style={style} />
      ))}
    </div>
  );
}

export function StreakFlame({ lit, size = 22, className = "" }: { lit: boolean; size?: number; className?: string }) {
  return (
    <Flame
      size={size}
      strokeWidth={1.75}
      className={`${lit ? "text-flame" : "text-dim"} ${className}`}
      fill={lit ? "currentColor" : "none"}
      fillOpacity={lit ? 0.25 : 0}
    />
  );
}

export function WeekStrip({ log, today, ignite = false }: { log: Record<string, DayLog>; today: string; ignite?: boolean }) {
  const monday = addDays(today, -weekday(today));
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAYS.map((label, i) => {
        const day = addDays(monday, i);
        const active = (log[day]?.reviews ?? 0) > 0;
        const isToday = day === today;
        return (
          <div key={day} className="flex flex-col items-center gap-1.5">
            <span className={`text-[13px] ${isToday ? "text-text" : "text-dim"}`}>{label}</span>
            <span
              className={`grid size-8 place-items-center rounded-full ${
                active
                  ? `bg-accent text-[#0e1a24] ${isToday && ignite ? "ignite" : ""}`
                  : isToday
                    ? "bg-surface-2 text-text ring-1 ring-line-strong"
                    : "bg-surface-2 text-dim"
              }`}
              style={{ animationDelay: isToday && ignite ? "0.5s" : undefined }}
            >
              {active ? <Check size={14} strokeWidth={3} /> : <span className={`size-1 rounded-full bg-current ${day > today ? "opacity-40" : ""}`} />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function StateBar({
  learned,
  learning,
  total,
  className = "",
}: {
  learned: number;
  learning: number;
  total: number;
  className?: string;
}) {
  const share = (n: number) => `${(n / (total || 1)) * 100}%`;
  return (
    <div className={`flex h-1.5 gap-0.5 overflow-hidden rounded-full ${className}`}>
      {learned > 0 && <div className="rounded-full bg-accent" style={{ width: share(learned) }} />}
      {learning > 0 && <div className="rounded-full bg-chart-rest" style={{ width: share(learning) }} />}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-[14px]">
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="h-52" />
      <Skeleton className="h-60" />
    </div>
  );
}
