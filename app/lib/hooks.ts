"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { today } from "./dates";
import { isSoundOn, subscribeSound } from "./sound";
import { getServerTheme, getTheme, subscribeTheme } from "./theme";
import { useStore } from "./store";

export const useSound = () => useSyncExternalStore(subscribeSound, isSoundOn, () => true);

export const useTheme = () => useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);

/** Дата нужна только после загрузки базы — до этого показываем скелет */
export const useReady = () => useStore((s) => s.hydrated);

const subscribeDay = (listener: () => void) => {
  // смена дня в открытом приложении: проверяем при возврате на вкладку и раз в минуту
  const id = setInterval(listener, 60_000);
  document.addEventListener("visibilitychange", listener);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", listener);
  };
};

export const useToday = () => useSyncExternalStore(subscribeDay, today, () => "");

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Плавно докручивает число до target */
export const useCountUp = (target: number, duration = 900, delay = 0) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    // без анимаций — сразу финальное число на первом кадре
    const ms = prefersReduced() ? 0 : duration;
    let frame = 0;
    const start = performance.now() + (ms ? delay : 0);
    const tick = (now: number) => {
      const t = ms ? Math.min(1, Math.max(0, (now - start) / ms)) : 1;
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, delay]);
  return value;
};

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let installEvent: InstallEvent | null = null;
const installListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installEvent = event as InstallEvent;
    installListeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    installEvent = null;
    installListeners.forEach((l) => l());
  });
}

const subscribeInstall = (listener: () => void) => {
  installListeners.add(listener);
  return () => {
    installListeners.delete(listener);
  };
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const useInstall = () => {
  const canPrompt = useSyncExternalStore(subscribeInstall, () => !!installEvent, () => false);
  const installed = useSyncExternalStore(subscribeInstall, isStandalone, () => false);
  const ios = useSyncExternalStore(
    subscribeInstall,
    () => /iphone|ipad|ipod/i.test(navigator.userAgent),
    () => false,
  );
  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    installEvent = null;
    installListeners.forEach((l) => l());
  };
  return { canPrompt, installed, ios, install };
};
