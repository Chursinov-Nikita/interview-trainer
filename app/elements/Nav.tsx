"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Flame, House, Layers, Search, Settings2 } from "lucide-react";
import Logo from "./Logo";
import { plu } from "../lib/dates";
import { useReady, useToday } from "../lib/hooks";
import { streakOf } from "../lib/queue";
import { useStore } from "../lib/store";

const LINKS = [
  { href: "/", label: "Главная", icon: House },
  { href: "/decks/", label: "Колоды", icon: Layers },
  { href: "/settings/", label: "Настройки", icon: Settings2 },
];

const isActive = (pathname: string, href: string) =>
  href === "/"
    ? pathname === "/"
    : pathname.startsWith(href.slice(0, -1)) || (href === "/decks/" && pathname.startsWith("/deck"));

export default function Nav() {
  const pathname = usePathname();
  if (pathname.startsWith("/review")) return null;

  const current = LINKS.findIndex(({ href }) => isActive(pathname, href));
  const direction = (index: number) =>
    current < 0 || index === current ? undefined : [index > current ? "nav-forward" : "nav-back"];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg" style={{ viewTransitionName: "site-header" }}>
        <div className="mx-auto flex h-14 max-w-[calc(1100px+4rem)] items-center gap-6 px-4 sm:px-6 lg:h-16 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" transitionTypes={direction(0)}>
            <Logo className="size-7" />
            <span className="text-[15px] font-semibold">Синапс</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Разделы">
            {LINKS.map(({ href, label }, index) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  transitionTypes={direction(index)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3.5 py-1.5 transition-colors ${
                    active ? "bg-surface text-text" : "text-mute hover:text-text"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-5">
            <SearchBox />
            <StreakBadge />
          </div>
        </div>
      </header>

      <nav
        className="tab-bar fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
        style={{ viewTransitionName: "tab-bar" }}
        aria-label="Разделы"
      >
        <div className="relative mx-auto grid max-w-md grid-cols-3 px-3 py-1.5">
          {current >= 0 && <span aria-hidden className="tab-pill" style={{ "--tab": current } as React.CSSProperties} />}
          {LINKS.map(({ href, label, icon: Icon }, index) => {
            const active = index === current;
            return (
              <Link
                key={href}
                href={href}
                transitionTypes={direction(index)}
                aria-current={active ? "page" : undefined}
                className={`tab-link relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  active ? "text-text" : "text-dim"
                }`}
              >
                <Icon size={21} strokeWidth={active ? 2.1 : 1.7} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const total = useStore((s) => Object.keys(s.cards).length);
  return (
    <form
      role="search"
      className="relative hidden w-64 lg:block"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/decks/?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-dim" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={total ? `Поиск по ${plu(total, ["вопросу", "вопросам", "вопросам"])}` : "Поиск по карточкам"}
        aria-label="Поиск по карточкам"
        className="h-9 w-full rounded-full bg-surface pr-4 pl-10 text-sm text-text outline-none placeholder:text-dim focus:ring-1 focus:ring-accent"
      />
    </form>
  );
}

function StreakBadge() {
  const ready = useReady();
  const today = useToday();
  const log = useStore((s) => s.log);
  if (!ready || !today) return <span className="h-5 w-20" />;
  const streak = streakOf(log, today);
  return (
    <Link
      href="/"
      className={`flex items-center gap-1.5 text-sm ${streak.today ? "text-text" : "text-mute"}`}
      title={streak.today ? "Сегодня занятие уже было" : "Повтори хотя бы одну карточку, чтобы продлить серию"}
    >
      <Flame size={16} strokeWidth={1.8} fill={streak.today ? "currentColor" : "none"} />
      <span className="num">{plu(streak.current, ["день", "дня", "дней"])}</span>
      <span className="text-mute">подряд</span>
    </Link>
  );
}
