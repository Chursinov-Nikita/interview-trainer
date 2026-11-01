"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { asset } from "@/app/lib/asset";

const inSession = (path: string) => path.startsWith("/review");

export default function ServiceWorker() {
  const pathname = usePathname();
  const currentPath = useRef(pathname);
  const updateReady = useRef(false);

  useEffect(() => {
    currentPath.current = pathname;
    if (updateReady.current && !inSession(pathname)) window.location.reload();
  }, [pathname]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const hadController = !!navigator.serviceWorker.controller;

    const checkForUpdate = () => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.update())
        .catch(() => {});
    };

    const onControllerChange = () => {
      if (!hadController || updateReady.current) return;
      updateReady.current = true;
      if (!inSession(currentPath.current)) window.location.reload();
    };

    navigator.serviceWorker.register(asset("/sw.js")).catch(() => {});
    navigator.storage?.persist?.().catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", checkForUpdate);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
    };
  }, []);

  return null;
}
