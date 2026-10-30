import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter/wght.css";
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
  appleWebApp: { capable: true, title: "Синапс", statusBarStyle: "black" },
  icons: { apple: asset("/icons/icon-192.png") },
};

export const viewport: Viewport = {
  themeColor: "#111215",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} suppressHydrationWarning />
      </head>
      <body className="min-h-dvh antialiased">
        <ServiceWorker />
        <Nav />
        <main className="px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-9 lg:pb-16">
          <div className="mx-auto max-w-[1100px]">{children}</div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
