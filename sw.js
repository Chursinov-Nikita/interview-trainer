const CACHE = "kesh-mvxlpayk";
const BASE = new URL(self.registration.scope).pathname;
const ROUTES = ["", "review/", "decks/", "deck/", "settings/"];
const FILES = [
  "manifest.webmanifest",
  "logo.svg",
  "icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
];
const ASSET = /(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g;

const savePage = async (cache, assets, route) => {
  const url = BASE + route;
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) return;
  const html = await response.clone().text();
  await cache.put(url, response);
  for (const match of html.matchAll(ASSET)) assets.add(match[1]);
  const rsc = await fetch(url + "index.txt", { cache: "no-cache" }).catch(() => null);
  if (rsc && rsc.ok) await cache.put(url + "index.txt", rsc);
};

const precache = async () => {
  const cache = await caches.open(CACHE);
  const assets = new Set();
  await Promise.allSettled(ROUTES.map((route) => savePage(cache, assets, route)));
  await Promise.allSettled(
    [...assets, ...FILES.map((file) => BASE + file)].map((url) => cache.add(url).catch(() => {})),
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

const networkFirst = async (request) => {
  const cache = await caches.open(CACHE);
  try {
    const response = await withTimeout(fetch(request, { cache: "no-cache" }), 4000);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const exact = await cache.match(request);
    if (exact) return exact;
    const loose =
      (await cache.match(request, { ignoreSearch: true })) ||
      (request.mode === "navigate" && (await cache.match(BASE)));
    if (!loose) throw new Error("offline");
    return new Response(loose.body, { status: loose.status, statusText: loose.statusText, headers: loose.headers });
  }
};

const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE)) return;
  if (url.pathname.includes("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(networkFirst(request));
});
