import type { Metadata, Viewport } from "next";
// Интерфейс — системным шрифтом, код — JetBrains Mono из пакета: сеть для шрифтов не нужна
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./globals.css";
import Nav from "./elements/Nav";
import ServiceWorker from "./elements/ServiceWorker";
import Toaster from "./elements/Toaster";
import { asset } from "./lib/asset";
import { THEME_SCRIPT } from "./lib/theme";

export const metadata: Metadata = {
  title: "Синапс — тренажёр к собеседованиям",
  description:
    "Карточки по TypeScript, React, Redux/Zustand, SQL и Prisma с интервальными повторениями SM-2. Работает офлайн.",
  appleWebApp: { capable: true, title: "Синапс", statusBarStyle: "default" },
  icons: { apple: asset("/icons/icon-192.png") },
};

export const viewport: Viewport = {
  themeColor: "#141417",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* расширения браузера любят дописывать скрипты в head — не считаем это расхождением */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} suppressHydrationWarning />
      </head>
      <body className="min-h-dvh antialiased">
        <ServiceWorker />
        <Nav />
        <main className="mx-auto max-w-2xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32 sm:px-6 md:pb-16 lg:ml-[max(17rem,calc(50%-21rem))]">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
