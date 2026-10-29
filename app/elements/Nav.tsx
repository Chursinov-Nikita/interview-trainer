"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, House, Layers, Settings2 } from "lucide-react";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "Сегодня", icon: House },
  { href: "/decks/", label: "Колоды", icon: Layers },
  { href: "/stats/", label: "Прогресс", icon: ChartColumn },
  { href: "/settings/", label: "Ещё", icon: Settings2 },
];

const isActive = (pathname: string, href: string) =>
  href === "/"
    ? pathname === "/"
    : pathname.startsWith(href.slice(0, -1)) || (href === "/decks/" && pathname.startsWith("/deck"));

export default function Nav() {
  const pathname = usePathname();
  // в сессии повторения ничего не отвлекает
  if (pathname.startsWith("/review")) return null;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-2 border-r border-line bg-bg px-4 py-6 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-3 px-3">
          <Logo className="size-8" />
          <span className="font-display text-xl">Синапс</span>
        </Link>
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                active ? "bg-surface text-text" : "text-mute hover:bg-surface"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.6} />
              {label}
            </Link>
          );
        })}
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-1.5">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition-colors ${
                  active ? "text-text" : "text-dim"
                }`}
              >
                <span
                  className={`grid h-8 w-14 place-items-center rounded-full transition-colors duration-300 ${
                    active ? "bg-surface" : ""
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2 : 1.6} />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
