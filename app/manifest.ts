import type { MetadataRoute } from "next";
import { asset } from "@/app/lib/asset";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Синапс — тренажёр к собеседованиям",
    short_name: "Синапс",
    description: "Карточки для подготовки к собеседованиям с интервальными повторениями.",
    lang: "ru",
    id: asset("/?app=kesh"),
    start_url: asset("/?app=kesh"),
    scope: asset("/"),
    display: "standalone",
    orientation: "portrait",
    background_color: "#111215",
    theme_color: "#111215",
    icons: [
      { src: asset("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: asset("/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
      { src: asset("/icons/icon-maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
