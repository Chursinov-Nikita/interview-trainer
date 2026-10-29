---
id: next
title: Next.js
description: App Router, серверные компоненты, кэширование и Server Actions — по Next.js 16
color: slate
icon: globe
---

@@@ next-01 | app router, основы
Какие специальные файлы есть в App Router и что делает каждый?
???
Папки в `app/` — это сегменты URL, а файлы внутри задают роли:

- `page.tsx` — страница, делает сегмент доступным по адресу;
- `layout.tsx` — общая обёртка, **сохраняется** между переходами;
- `template.tsx` — как layout, но пересоздаётся при каждом переходе;
- `loading.tsx` — fallback для Suspense, пока сегмент грузится;
- `error.tsx` — граница ошибок сегмента (клиентский компонент);
- `not-found.tsx` — UI для `notFound()` и несуществующих адресов;
- `route.ts` — Route Handler: API-эндпоинт вместо страницы.

Папки: `[slug]` — динамический сегмент, `(group)` — группа без влияния на URL, `_private` — исключена из роутинга.

@@@ next-02 | app router, layout
Чем `layout.tsx` отличается от `template.tsx`?
???
**Layout** живёт между переходами: не перемонтируется, состояние клиентских компонентов внутри сохраняется, эффекты не перезапускаются.

**Template** получает уникальный key на каждый переход — дочерние клиентские компоненты пересоздаются, состояние сбрасывается, эффекты запускаются заново.

Template нужен, когда при каждой навигации надо: перезапустить `useEffect` (например, аналитику), сбросить форму, показывать Suspense-fallback каждый раз, а не только при первой загрузке.

@@@ next-03 | rsc, основы
Какие компоненты в App Router серверные, а какие клиентские по умолчанию?
???
По умолчанию **все серверные**. Они рендерятся на сервере, могут быть `async`, ходить в БД и читать секреты, а их код не попадает в бандл браузера.

Клиентским модуль делает директива `"use client"` в начале файла — она отмечает границу: этот модуль и всё, что он импортирует, уходит в клиентский бандл. Клиентский компонент нужен для state, эффектов, обработчиков событий и браузерных API.

Серверный компонент можно передать в клиентский через `children` или другие пропсы — он отрендерится на сервере.

@@@ next-04 | app router, params
Как получить параметры динамического маршрута в `page.tsx` в Next.js 15+?
???
`params` и `searchParams` — это **промисы**, их нужно дождаться:

```tsx
// app/blog/[slug]/page.tsx
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { page = "1" } = await searchParams;
  return <h1>{slug}, страница {page}</h1>;
}
```

В клиентском компоненте — хуки `useParams()` и `useSearchParams()` из `next/navigation`.

@@@ next-05 | streaming, loading
Как работает `loading.tsx` и стриминг?
???
`loading.tsx` автоматически оборачивает страницу сегмента в `<Suspense fallback={<Loading />}>`. Сервер сразу отправляет layout и fallback, а содержимое страницы приходит **потоком** в том же ответе, когда данные готовы.

Для более точного контроля оборачивают в `<Suspense>` отдельные медленные части страницы — тогда быстрые части видны сразу, а каждая медленная грузится независимо.

@@@ next-06 | ошибки
Как устроен `error.tsx`?
???
Это граница ошибок для сегмента и его потомков. Он **обязан быть клиентским** (`"use client"`).

```tsx
"use client";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div>
      <p>Что-то пошло не так</p>
      <button onClick={() => retry()}>Повторить</button>
    </div>
  );
}
```

- `retry()` (стабилен с 16.3) заново запрашивает и рендерит содержимое; `reset()` только сбрасывает состояние ошибки без перезапроса.
- В продакшене ошибки серверных компонентов приходят с общим сообщением и `digest`, чтобы не утекали детали.
- Ошибки в корневом layout ловит `global-error.tsx`.

@@@ next-07 | route handlers, api
Что такое Route Handlers?
???
Файл `route.ts` экспортирует функции по HTTP-методам и работает с Web API `Request`/`Response`:

```ts
// app/api/users/route.ts
export async function GET(request: Request) {
  const users = await db.user.findMany();
  return Response.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return Response.json(user, { status: 201 });
}
```

`route.ts` не может лежать в одном сегменте с `page.tsx` — оба отвечают на один URL. Для мутаций из своих форм обычно удобнее Server Actions. Route Handlers нужны для внешних клиентов, вебхуков и публичного API.

@@@ next-08 | server actions
Что такое Server Actions и как их защищать?
???
Асинхронные функции с директивой `"use server"`, которые выполняются на сервере, а вызываются из формы или клиентского компонента:

```tsx
// app/actions.ts
"use server";

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  await db.post.create({ data: { title: String(formData.get("title")) } });
  revalidatePath("/posts");
}

// <form action={createPost}>…</form>
```

**Безопасность**: экспортированный Server Action доступен прямым POST-запросом, а не только через твой UI. Поэтому проверяй аутентификацию, права и валидируй входные данные **внутри каждого** action — то, что форма скрыта от гостей, защитой не является.

@@@ next-09 | rendering, static, dynamic
Чем статический рендеринг отличается от динамического? Что делает маршрут динамическим?
???
**Статический** — HTML готовится при сборке (или ревалидации) и отдаётся из кэша/CDN всем одинаково. **Динамический** — рендер на каждый запрос.

Маршрут становится динамическим, когда использует данные запроса: `cookies()`, `headers()`, `searchParams`, `connection()`, `draftMode()`, а в старой модели кэширования ещё и `fetch` с `cache: "no-store"` или `export const dynamic = "force-dynamic"`.

С включёнными Cache Components (`cacheComponents: true`) по умолчанию работает **Partial Prerendering**: статическая оболочка страницы готовится заранее, а динамические части приходят потоком внутри `<Suspense>`.

@@@ next-10 | кэширование, fetch
Кэшируется ли `fetch` в Next.js 15+ по умолчанию? Как включить кэш?
???
**Нет**, кэширование стало явным (в Next.js 14 было наоборот).

Старая модель (без Cache Components):

```ts
fetch(url, { cache: "force-cache" });           // кэшировать
fetch(url, { next: { revalidate: 3600 } });     // кэш на час
fetch(url, { next: { tags: ["posts"] } });      // тег для ревалидации
```

Модель Cache Components (`cacheComponents: true`) — директива `"use cache"` на функции, компоненте или файле, срок жизни через `cacheLife`, теги через `cacheTag`:

```ts
export async function getPosts() {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  return db.post.findMany();
}
```

@@@ next-11 | кэширование, ревалидация
Чем отличаются `revalidatePath`, `revalidateTag` и `updateTag`?
???
- `revalidatePath("/posts")` — сбрасывает кэш конкретного маршрута, когда неизвестно, какие теги на нём.
- `revalidateTag("posts", "max")` — помечает данные с тегом устаревшими: следующий запрос получит **старые** данные, пока свежие обновляются в фоне (stale-while-revalidate). Подходит для блогов и каталогов. Работает в Server Actions и Route Handlers.
- `updateTag("posts")` — сразу удаляет кэш тега, следующий запрос **ждёт** свежие данные. Только в Server Actions: для сценария «создал пост — сразу вижу его в списке» (read-your-own-writes).

@@@ next-12 | статика, generateStaticParams
Как заранее сгенерировать страницы для динамических маршрутов?
???
`generateStaticParams` возвращает список параметров, страницы для них собираются при билде:

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}
```

Что делать с адресами не из списка, решает `export const dynamicParams`:

- `true` (по умолчанию) — сгенерировать страницу при первом запросе;
- `false` — отдать 404.

Для `output: "export"` (чистая статика без сервера) все пути обязаны быть известны при сборке.

@@@ next-13 | proxy, middleware
Что такое `proxy.ts` и чем он стал в Next.js 16?
???
Это бывший `middleware.ts`: в Next.js 16 соглашение **переименовано** в `proxy` (функциональность та же, есть codemod). Код выполняется **до** рендера маршрута и может сделать redirect, rewrite, поменять заголовки и cookies или сразу ответить.

```ts
// proxy.ts в корне проекта
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.cookies.has("session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = { matcher: ["/dashboard/:path*"] };
```

По умолчанию работает в Node.js runtime. Подходит для быстрых проверок и редиректов; полноценную авторизацию всё равно повторяют рядом с данными.

@@@ next-14 | навигация, prefetch
Как работают `<Link>` и prefetch в Next.js?
???
`<Link>` делает клиентский переход без перезагрузки: layout сохраняется, подгружается только нужный RSC-payload.

Next.js **автоматически предзагружает** маршруты ссылок, которые попали в видимую область экрана, поэтому переход ощущается мгновенным. Prefetch включён **только в продакшене** — в `next dev` его нет. Для программной навигации — `useRouter()` из `next/navigation` (`router.push`, `router.refresh`).

Частая ошибка в App Router — импорт `useRouter` из `next/router`: он остался только для Pages Router.

@@@ next-15 | оптимизация, изображения
Что даёт компонент `next/image` по сравнению с `<img>`?
???
- Автоматически отдаёт картинку нужного размера под устройство и в современных форматах (WebP, AVIF).
- **Нет сдвига вёрстки (CLS)**: у статически импортированных картинок размеры известны при сборке, для внешних нужно указать `width`/`height` или `fill`.
- Ленивая загрузка (native lazy loading) и опциональный blur-плейсхолдер.

Для картинки первого экрана (LCP) её лучше загружать с приоритетом, а не лениво.

@@@ next-16 | оптимизация, шрифты
Зачем `next/font`?
???
Шрифты **скачиваются при сборке и раздаются с твоего домена** — браузер пользователя не ходит на Google Fonts (быстрее и без утечки данных третьей стороне). Next.js подбирает fallback-шрифт с похожими метриками, поэтому при загрузке нет скачка вёрстки.

```tsx
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
// <html className={inter.variable}>
```

Минус: сборке нужен доступ к Google Fonts. Без сети используют `next/font/local` или npm-пакеты шрифтов.

@@@ next-17 | metadata, seo
Как задать title, description и Open Graph в App Router?
???
Экспортом объекта `metadata` или функции `generateMetadata` из `layout.tsx`/`page.tsx` (только в серверных компонентах):

```tsx
export const metadata = { title: "Блог", description: "Статьи о фронтенде" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post.title, openGraph: { images: [post.cover] } };
}
```

Метаданные вложенных сегментов сливаются с родительскими. Для `<title>` удобен шаблон `title: { template: "%s · Блог", default: "Блог" }`.

@@@ next-18 | роутинг, модалки
Что такое параллельные и перехватывающие маршруты?
???
**Параллельные** (`@slot`) — несколько страниц в одном layout одновременно: `app/@feed/page.tsx` и `app/@stats/page.tsx` приходят в layout как пропсы `feed` и `stats`. Для слотов без совпадения нужен `default.tsx`.

**Перехватывающие** (`(.)photo`, `(..)photo`, `(...)photo`) — показывают другой маршрут в текущем контексте при клиентском переходе.

Классика — модалка: клик по фото в ленте открывает его в модалке поверх ленты, а прямой заход на `/photo/1` или обновление страницы показывают полноценную страницу фото.

@@@ next-19 | rsc, провайдеры
Как подключить Context-провайдер (тема, Redux, React Query), если layout серверный?
???
Context работает только в клиентских компонентах. Провайдер выносят в отдельный клиентский компонент и оборачивают им `children`:

```tsx
// app/providers.tsx
"use client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// app/layout.tsx (серверный)
<body><Providers>{children}</Providers></body>
```

Страницы, переданные через `children`, остаются серверными. Провайдер ставят как можно глубже в дереве.

@@@ next-20 | ленивая загрузка
Как отключить SSR для компонента (например, для карты, которая требует `window`)?
???
Через `next/dynamic` с `ssr: false`, причём **внутри клиентского компонента** — в серверном эта опция не работает:

```tsx
"use client";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <p>Загружаем карту…</p>,
});
```

Компонент загрузится отдельным чанком только в браузере. Альтернатива для мелочей — читать `window` в `useEffect`.

@@@ next-21 | rsc, данные
Как передавать данные из серверного компонента в клиентский и что нельзя передать?
???
Через пропсы, но они должны **сериализоваться**: примитивы, простые объекты и массивы, `Date`, `Map`, `Set`, промисы (их можно прочитать через `use()`), JSX, Server Actions.

Нельзя: обычные функции и обработчики, экземпляры классов, символы (кроме созданных через `Symbol.for`).

```tsx
// серверный
const post = await getPost(id);
return <LikeButton postId={post.id} initialLikes={post.likes} />;
```

Хорошая практика — передавать минимум данных: только то, что нужно клиентскому компоненту.
