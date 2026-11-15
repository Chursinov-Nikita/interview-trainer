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

Для адреса `/blog/hello?page=2` получится `slug = "hello"`, `page = "2"`.

- **`params`** — части пути из папок в квадратных скобках: `[slug]`, `[id]`. Для `[...slug]` (catch-all) значение — массив: `/docs/a/b` → `["a", "b"]`.
- **`searchParams`** — параметры после `?`. Значение может быть массивом, если параметр повторяется (`?tag=a&tag=b`), или `undefined`, если его нет, — поэтому тип такой широкий.

Почему промисы: Next.js может начать рендерить страницу, ещё не зная параметров, и дождаться их только там, где они реально нужны. А чтение `searchParams` делает страницу **динамической** (рендер на каждый запрос) — асинхронный API делает этот момент явным.

В клиентском компоненте — хуки `useParams()` и `useSearchParams()` из `next/navigation`. В клиентском компоненте страницы промис можно развернуть хуком `use(params)`.

Для статической генерации всех вариантов `[slug]` при сборке есть функция `generateStaticParams`.

@@@ next-05 | streaming, loading
Как работает `loading.tsx` и стриминг?
???
**Проблема:** страница ждёт данные из медленного запроса 3 секунды. Без стриминга пользователь все 3 секунды видит белый экран — сервер отправит HTML, только когда будет готово всё.

**`loading.tsx`** в папке маршрута автоматически оборачивает страницу этого сегмента в `<Suspense fallback={<Loading />}>`:

```
app/dashboard/
  layout.tsx    ← шапка и меню
  loading.tsx   ← скелетон
  page.tsx      ← медленная страница
```

Что происходит при запросе:

1. Сервер **сразу** отправляет layout (шапку, меню) и скелетон из `loading.tsx`. Пользователь видит интерфейс почти мгновенно и может нажимать на навигацию.
2. Соединение остаётся открытым. Когда данные страницы готовы, сервер **дописывает** её HTML в тот же ответ, и React подставляет его на место скелетона.

Это и есть **стриминг** — HTML приходит частями в одном ответе.

Для более точного контроля оборачивают в `<Suspense>` отдельные медленные части страницы — тогда быстрые части видны сразу, а каждая медленная грузится независимо:

```tsx
export default function Dashboard() {
  return (
    <>
      <h1>Обзор</h1>                         {/* сразу */}
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />                     {/* придёт, когда готов график */}
      </Suspense>
      <Suspense fallback={<ListSkeleton />}>
        <LatestOrders />                     {/* независимо от графика */}
      </Suspense>
    </>
  );
}
```

`RevenueChart` и `LatestOrders` — async серверные компоненты, которые сами загружают свои данные. Медленный график не задерживает список заказов.

Бонус: при клиентской навигации `loading.tsx` показывается мгновенно, пока грузится новая страница.

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
Обычный `<img>` отдаёт картинку как есть: 4000×3000 пикселей и 5 МБ даже на телефоне шириной 390 пикселей. `next/image` решает несколько проблем автоматически.

**1. Правильный размер и формат.** Генерирует несколько вариантов картинки (`srcset`), и браузер скачивает подходящий под ширину экрана и плотность пикселей. Отдаёт современные форматы WebP или AVIF, если браузер их поддерживает. Вес может уменьшиться в разы.

**2. Нет сдвига вёрстки (CLS).** Пока картинка грузится, место под неё уже зарезервировано, и текст не «прыгает» вниз. Для этого нужны размеры:

```tsx
import Image from "next/image";
import hero from "./hero.jpg";

<Image src={hero} alt="Офис" />                         // размеры известны при сборке
<Image src={url} alt="Аватар" width={64} height={64} />  // внешняя — указать размеры
<div className="relative h-64">
  <Image src={url} alt="Обложка" fill sizes="100vw" className="object-cover" />
</div>
```

`fill` растягивает картинку по родителю (у родителя должен быть `position: relative`), а `sizes` подсказывает браузеру, какой ширины будет картинка, чтобы он выбрал нужный вариант из `srcset`.

**3. Ленивая загрузка** по умолчанию: картинки ниже экрана грузятся, только когда пользователь до них доскроллит. Можно добавить размытый плейсхолдер `placeholder="blur"`.

**Картинка первого экрана (LCP)** — главная картинка, которую пользователь видит сразу. Её ленивая загрузка только навредит. В Next.js 16 для неё обычно ставят `loading="eager"` или `fetchPriority="high"`; есть и `preload`, который вставляет `<link rel="preload">` в `<head>`. Старый проп `priority` в Next.js 16 устарел.

Для внешних картинок домен нужно разрешить в `next.config.ts` через `images.remotePatterns` — это защита от использования вашего сервера как бесплатного оптимизатора чужих картинок.

@@@ next-16 | оптимизация, шрифты
Зачем `next/font`?
???
Подключение шрифта обычным `<link>` на Google Fonts создаёт три проблемы:

1. **Лишние запросы на чужой домен** — браузер сначала идёт за CSS на `fonts.googleapis.com`, потом за файлами на `fonts.gstatic.com`. Это задерживает отрисовку текста.
2. **Утечка данных** — Google видит IP каждого посетителя (в Европе это проблема с GDPR).
3. **Скачок вёрстки** — пока шрифт не загрузился, текст показывается запасным шрифтом другой ширины, а потом «прыгает».

`next/font` решает всё сразу:

- шрифты **скачиваются при сборке** и раздаются с твоего домена как обычная статика — никаких запросов к Google у пользователя;
- для запасного шрифта Next.js подбирает **метрики** (`size-adjust` и др.), чтобы он занимал столько же места, — подмена шрифта почти незаметна;
- загружаются только нужные начертания и наборы символов (`subsets`);
- по умолчанию `display: "swap"` — текст виден сразу, ещё до загрузки шрифта.

```tsx
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

`variable` создаёт CSS-переменную `--font-inter`, которую можно использовать в CSS или Tailwind (`font-family: var(--font-inter)`). Для кириллицы обязательно указать `subsets: ["cyrillic"]`.

Минус: сборке нужен доступ к Google Fonts. Без сети используют `next/font/local` с файлами шрифта в проекте или npm-пакеты шрифтов (`@fontsource`) — так сделано в этом приложении.

@@@ next-17 | metadata, seo
Как задать title, description и Open Graph в App Router?
???
**Метаданные** — то, что попадает в `<head>`: заголовок вкладки, описание для поисковиков и превью ссылки в мессенджерах и соцсетях (Open Graph).

**Статические** — экспорт объекта `metadata` из `layout.tsx` или `page.tsx`:

```tsx
export const metadata = { title: "Блог", description: "Статьи о фронтенде" };
```

**Динамические**, зависящие от данных, — функция `generateMetadata`:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [post.cover] },
  };
}
```

Работает **только в серверных компонентах**: метаданные должны оказаться в HTML ещё до загрузки JS, иначе поисковики и боты мессенджеров их не увидят.

Если `getPost` вызывается и в `generateMetadata`, и в самой странице, запрос не выполнится дважды — `fetch` с одинаковыми параметрами дедуплицируется, а для своих функций используют `cache` из React.

**Наследование.** Метаданные вложенных сегментов сливаются с родительскими: корневой layout задаёт общее, страница переопределяет нужное.

Шаблон заголовка — чтобы не дописывать название сайта на каждой странице:

```tsx
// app/layout.tsx
export const metadata = {
  title: { template: "%s · Блог", default: "Блог" },
};
// страница с title: "Мой пост" → вкладка «Мой пост · Блог»
```

Картинку для превью можно сгенерировать кодом — файл `opengraph-image.tsx` в папке маршрута.

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
**Проблема.** В Next.js клиентские компоненты тоже рендерятся на сервере (SSR) для первой загрузки. А на сервере нет `window`, `document` и `localStorage`. Библиотека карт или графиков, которая обращается к `window` прямо при импорте, уронит рендер ошибкой `window is not defined`.

**Решение** — `next/dynamic` с `ssr: false`, причём **внутри клиентского компонента** — в серверном эта опция не работает и вызывает ошибку:

```tsx
"use client";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <p>Загружаем карту…</p>,
});

export function Location() {
  return <Map center={[55.75, 37.62]} />;
}
```

Что происходит:

- на сервере вместо карты рендерится `loading` — плейсхолдер;
- код карты выносится в **отдельный чанк** и скачивается только в браузере;
- после гидратации чанк загружается, и карта появляется.

Бонус: тяжёлая библиотека не попадает в основной бандл — страница грузится быстрее.

Если серверному компоненту (странице) нужна такая карта, делают маленькую клиентскую обёртку с `dynamic` и импортируют её в страницу.

**Альтернатива для мелочей** — читать `window` в `useEffect`: он выполняется только в браузере. Например, ширину экрана или значение из `localStorage`. Но если сама **библиотека** обращается к `window` при импорте, `useEffect` не поможет — модуль упадёт раньше, и нужен `dynamic`.

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

@@@ next-22 | next 16, обновление
Что главное изменилось в Next.js 16?
???
- **Turbopack по умолчанию** для `next dev` и `next build` — флаг `--turbopack` больше не нужен. Если в проекте свой `webpack`-конфиг, сборка упадёт: нужно перенести настройки или запускать с `--webpack`.
- **`middleware.ts` переименован в `proxy.ts`**, функция — `proxy`.
- **Только асинхронные API запроса**: `params`, `searchParams`, `cookies()`, `headers()` нужно `await`-ить; синхронный доступ из переходного периода Next.js 15 удалён.
- **Cache Components** (`cacheComponents: true`): директива `"use cache"`, стабильные `cacheLife` и `cacheTag`. Через неё включается Partial Prerendering.
- **Новые API кэша**: `revalidateTag(tag, profile)` требует второй аргумент, появились `updateTag` и `refresh` для Server Actions.
- **React 19.2**: `<Activity>`, `useEffectEvent`, View Transitions.
- `next lint` удалён — ESLint запускают напрямую. Минимальные версии: Node.js 20.9 и TypeScript 5.1.

Обновляться удобно codemod-ом: `npx @next/codemod@canary upgrade latest`.

@@@ next-23 | кэширование, cache components
Как задать срок жизни кэша через `cacheLife`?
???
В модели Cache Components кэшируемая функция помечается `"use cache"`, а `cacheLife` описывает три времени:

- **`stale`** — сколько клиент показывает кэш без запроса к серверу;
- **`revalidate`** — после этого следующий запрос получит старые данные, а свежие обновятся в фоне;
- **`expire`** — если запросов не было дольше этого срока, следующий запрос **ждёт** свежие данные.

```ts
import { cacheLife, cacheTag } from "next/cache";

export async function getProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return db.product.findMany();
}

cacheLife({ stale: 60, revalidate: 300, expire: 3600 }); // свой профиль в секундах
```

Готовые профили: `seconds`, `minutes`, `hours`, `days`, `weeks`, `max`. Без вызова применяется `default` (revalidate 15 минут, без истечения) — но лучше указывать явно, чтобы поведение было видно в коде.

Обновить раньше срока — `updateTag("products")` или `revalidateTag("products", "max")` после изменения данных.

@@@ next-24 | навигация, ошибки
Чем отличаются `redirect`, `permanentRedirect`, `notFound`, `forbidden` и `unauthorized`?
???
Все они **бросают** специальное исключение и прерывают рендер сегмента:

- `redirect("/login")` — временный редирект: 307, а в Server Action — клиентская навигация (или 303 без JS);
- `permanentRedirect("/new-url")` — постоянный, 308: страница переехала навсегда, поисковики обновят ссылку;
- `notFound()` — 404 и показ ближайшего `not-found.tsx`;
- `forbidden()` — 403 (`forbidden.tsx`), `unauthorized()` — 401 (`unauthorized.tsx`). Пока экспериментальные, включаются флагом `experimental.authInterrupts`.

```tsx
export default async function PostPage({ params }: PageProps<"/posts/[id]">) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  return <Post post={post} />;
}
```

Ловушка: раз они работают через исключение, их нельзя вызывать **внутри `try`** — `catch` перехватит редирект. Вызывай после блока `try/catch`.

@@@ next-25 | cookies, server
Как читать и устанавливать cookies в App Router?
???
Через асинхронную функцию `cookies()` из `next/headers`:

```ts
import { cookies } from "next/headers";

// чтение — в серверном компоненте, Server Action, Route Handler
const theme = (await cookies()).get("theme")?.value ?? "light";
```

**Записывать и удалять** можно только в Server Action (Server Function) или Route Handler:

```ts
"use server";
export async function setTheme(theme: "light" | "dark") {
  (await cookies()).set("theme", theme, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
```

Почему не в серверном компоненте: cookie ставится заголовком `Set-Cookie`, а при стриминге заголовки ответа уже отправлены.

Вызов `cookies()` делает маршрут **динамическим** — он рендерится на каждый запрос. Для сессии ставь `httpOnly: true`, `secure: true`, `sameSite: "lax"`.

@@@ next-26 | env, безопасность
Как работают переменные окружения в Next.js? Что значит `NEXT_PUBLIC_`?
???
- Переменные **без префикса** доступны только на сервере: в серверных компонентах, Route Handlers, Server Actions. В браузер они не попадают.
- Переменные с префиксом **`NEXT_PUBLIC_`** при сборке **подставляются в JS-бандл** как обычные строки и видны любому пользователю.

```ts
process.env.DATABASE_URL;           // только сервер
process.env.NEXT_PUBLIC_API_URL;    // и клиент, вшито при next build
```

Что из этого следует:

- секреты (ключи API, пароли от БД) — **никогда** с `NEXT_PUBLIC_`;
- значение `NEXT_PUBLIC_` фиксируется в момент `next build`. Если собрать один Docker-образ и запустить с другими переменными, на клиенте останутся старые значения;
- файлы: `.env`, `.env.local` (не коммитится), `.env.development`, `.env.production`.

Для защиты от случайного импорта серверного кода на клиент: `import "server-only"` в модуле — сборка упадёт, если его подключит клиентский компонент.

@@@ next-27 | seo, метаданные
Как сделать `sitemap.xml`, `robots.txt` и картинку для соцсетей в App Router?
???
Специальными файлами в `app/` — Next.js сам отдаст их по нужным адресам:

```ts
// app/sitemap.ts → /sitemap.xml
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  return [
    { url: "https://site.ru", lastModified: new Date() },
    ...posts.map((p) => ({ url: `https://site.ru/blog/${p.slug}`, lastModified: p.updatedAt })),
  ];
}

// app/robots.ts → /robots.txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin/" },
    sitemap: "https://site.ru/sitemap.xml",
  };
}
```

**Картинка для превью ссылки**: файл `opengraph-image.png` рядом со страницей или `opengraph-image.tsx`, который генерирует изображение из JSX через `ImageResponse` из `next/og` — например, с заголовком статьи.

Плюсы перед статическими файлами: данные берутся из базы и всегда актуальны, а типы `MetadataRoute` защищают от опечаток.

@@@ next-28 | роутинг, структура
Что такое группы маршрутов `(folder)` и приватные папки `_folder`?
???
**Группа маршрутов** — папка в скобках. Она **не попадает в URL**, но может иметь свой `layout.tsx`:

```
app/
  (marketing)/
    layout.tsx        ← шапка лендинга
    page.tsx          → /
    pricing/page.tsx  → /pricing
  (dashboard)/
    layout.tsx        ← сайдбар кабинета
    settings/page.tsx → /settings
```

Зачем: разные лейауты для разных разделов без лишнего сегмента в адресе, логическая группировка, несколько корневых лейаутов. Нельзя делать так, чтобы страницы в разных группах давали один и тот же URL — будет ошибка.

**Приватная папка** — с подчёркиванием: `app/_components/`, `app/blog/_lib/`. Next.js исключает её из маршрутизации целиком, даже если внутри окажется `page.tsx`. Удобно держать компоненты и утилиты рядом с маршрутом.

Кстати, в этом приложении главный экран лежит в `app/_today/`.

@@@ next-29 | client, search params
Как читать `searchParams` в странице и в клиентском компоненте?
???
**В серверной странице** — через проп `searchParams`, это промис:

```tsx
export default async function Page({ searchParams }: PageProps<"/products">) {
  const { sort = "new", page = "1" } = await searchParams;
  const products = await getProducts({ sort, page: Number(page) });
  return <List products={products} />;
}
```

Использование `searchParams` делает страницу динамической.

**В клиентском компоненте** — хук `useSearchParams` (только чтение):

```tsx
"use client";
const params = useSearchParams();
const sort = params.get("sort") ?? "new";
```

Ловушка: если страница пререндерится статически, компонент с `useSearchParams` и всё дерево до ближайшего `<Suspense>` будут отрендерены **только на клиенте**. Поэтому такой компонент оборачивают в `<Suspense>` — тогда остальная страница попадёт в статический HTML. Так сделано и в этом приложении: экраны колоды и сессии обёрнуты в `Suspense`.

@@@ next-30 | данные, производительность
Что такое водопад запросов в серверных компонентах и как его избежать?
???
Водопад — запросы идут **последовательно**, хотя друг от друга не зависят:

```tsx
const user = await getUser(id);       // 300 мс
const posts = await getPosts(id);     // +300 мс
const stats = await getStats(id);     // +300 мс → 900 мс
```

**Параллельно** — запустить все сразу и дождаться вместе:

```tsx
const [user, posts, stats] = await Promise.all([getUser(id), getPosts(id), getStats(id)]);
// ≈ 300 мс
```

Ещё лучше — разбить страницу на части и отдавать их **потоком**: каждый компонент сам загружает свои данные, а медленный блок не задерживает остальные.

```tsx
<UserHeader id={id} />
<Suspense fallback={<StatsSkeleton />}>
  <Stats id={id} />
</Suspense>
```

Последовательные запросы оправданы, только когда второму нужны данные первого (например, `posts` зависят от `user.teamId`). Водопады встречаются и между вложенными лейаутами — если лейаут и страница ждут своих данных по очереди.

@@@ next-31 | данные, react cache
Как не делать один и тот же запрос к БД дважды за один рендер?
???
Пользователь нужен и в лейауте (аватар), и в странице, и в `generateMetadata`. Чтобы не ходить в базу трижды, функцию оборачивают в `cache` из React:

```ts
import { cache } from "react";

export const getUser = cache(async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
});
```

Все вызовы `getUser("42")` в рамках **одного запроса** получат один и тот же результат, а запрос к БД выполнится один раз.

Что важно:

- `cache` живёт только в пределах одного серверного запроса — это не кэш между пользователями;
- аргументы сравниваются по ссылке, поэтому передавай примитивы (`id`), а не новый объект `{ id }`;
- для `fetch` Next.js делает такую дедупликацию автоматически, а для ORM и SDK нужен `cache`.

Для кэша **между** запросами используют `"use cache"` с `cacheLife`.

@@@ next-32 | server, after
Как выполнить работу после отправки ответа (логи, аналитика)?
???
Функцией `after` из `next/server`. Колбэк выполнится **после** того, как ответ отправлен пользователю, и не замедлит его:

```ts
"use server";
import { after } from "next/server";

export async function createOrder(data: OrderInput) {
  const order = await db.order.create({ data });

  after(async () => {
    await analytics.track("order_created", { id: order.id });
    await sendSlackNotification(order);
  });

  return order;
}
```

Где работает: серверные компоненты, Server Actions, Route Handlers и Proxy.

Особенности:

- выполняется, даже если ответ завершился ошибкой, `notFound` или `redirect`;
- сам `after` не делает маршрут динамическим; в статической странице колбэк выполнится при сборке или ревалидации;
- время ограничено лимитом функции на платформе (`maxDuration`).

Раньше для такого делали `fetch` без `await` — на serverless-платформах функция могла завершиться раньше, и задача терялась.

@@@ next-33 | static export, деплой
Что не работает при статическом экспорте (`output: "export"`)?
???
Статический экспорт собирает сайт в папку `out/` из HTML, CSS и JS — его можно разместить на любом хостинге без Node.js (GitHub Pages, S3, CDN). Это приложение собрано именно так.

Не поддерживается всё, что требует сервера во время запроса:

- динамические маршруты без `generateStaticParams`;
- Route Handlers, которые читают запрос;
- `cookies()`, `headers()`, Server Actions;
- Proxy (бывший middleware), а также `rewrites`, `redirects` и `headers` в `next.config`;
- ISR и ревалидация;
- оптимизация изображений стандартным загрузчиком (`images: { unoptimized: true }` или свой загрузчик);
- Draft Mode и перехватывающие маршруты.

Как жить: данные с параметрами брать на клиенте (`useSearchParams`, `fetch`), а вместо `/deck/[id]` использовать `/deck/?id=…` — так и сделано в этом приложении.

@@@ next-34 | безопасность, авторизация
Где проверять авторизацию в App Router?
???
**Рядом с данными**, а не только в одном месте на входе.

- **Proxy** удобен для быстрых редиректов («нет cookie — на /login»), но его недостаточно: matcher легко настроить неточно, и он не знает, какие данные запрашивает страница.
- **Лейаут** не подходит как единственная защита: при клиентской навигации лейауты не перерендериваются, а страница может загрузить данные сама.
- **Server Actions и Route Handlers** — это публичные эндпоинты. Их можно вызвать напрямую, минуя интерфейс, поэтому проверка нужна **внутри каждого**.

Рекомендуемый подход — **слой доступа к данным** (Data Access Layer): функции, которые сами проверяют сессию и права и возвращают только безопасные поля.

```ts
import "server-only";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const session = await verifySession(); // нет сессии → redirect("/login")
  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, role: true }, // без password
  });
});
```

@@@ next-35 | server actions, route handlers
Server Action или Route Handler — что выбрать?
???
**Server Action** (`"use server"`) — для мутаций из **своего** интерфейса:

- вызывается как функция из формы или обработчика, без ручного `fetch`;
- работает с `<form action>` и `useActionState`, формы работают даже без JS;
- после изменения можно сразу обновить кэш (`updateTag`, `refresh`) и вернуть новый UI за один запрос;
- Next.js проверяет, что запрос пришёл с того же сайта (`Origin`).

**Route Handler** (`app/api/.../route.ts`) — когда нужен **обычный HTTP-эндпоинт**:

- вебхуки (Stripe, Telegram), которые вызывает внешний сервис;
- API для мобильного приложения или других сайтов;
- GET-запросы с кэшированием, отдача файлов, RSS, SSE-стримы;
- нужны свои статус-коды и заголовки.

Для **чтения** данных в серверных компонентах не нужно ни то, ни другое — компонент может обратиться к БД напрямую. Делать в серверном компоненте `fetch` к собственному Route Handler — лишний сетевой круг.

@@@ next-36 | i18n, роутинг
Как сделать мультиязычный сайт в App Router?
???
Встроенной i18n-маршрутизации, как в Pages Router, в App Router нет. Стандартная схема:

1. Все страницы кладут в динамический сегмент `app/[lang]/…`, и язык приходит в `params`.
2. **Proxy** определяет язык по заголовку `Accept-Language` (или cookie) и редиректит `/about` → `/ru/about`.
3. Словари грузят на сервере — переводы не попадают в клиентский бандл целиком.
4. `generateStaticParams` возвращает список языков, чтобы страницы пререндерились.

```tsx
// app/[lang]/page.tsx
const dictionaries = {
  ru: () => import("./dictionaries/ru.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const t = await dictionaries[lang as "ru" | "en"]();
  return <h1>{t.title}</h1>;
}
```

На практике часто берут библиотеку `next-intl`: она закрывает плюрализацию, форматирование дат и чисел и переводы в клиентских компонентах.

@@@ next-37 | скрипты, производительность
Как подключать сторонние скрипты через `next/script`?
???
Компонент `<Script>` управляет тем, **когда** загрузится скрипт, чтобы аналитика и виджеты не тормозили страницу:

```tsx
import Script from "next/script";

<Script src="https://widget.example.com/chat.js" strategy="lazyOnload" />
<Script id="analytics" strategy="afterInteractive">
  {`window.dataLayer = window.dataLayer || [];`}
</Script>
```

Стратегии:

- `beforeInteractive` — до гидратации и любого кода Next.js (только для критичного: проверка ботов, согласие на cookies);
- `afterInteractive` (по умолчанию) — сразу после гидратации: аналитика, теги;
- `lazyOnload` — когда браузер простаивает: чаты, виджеты соцсетей;
- `worker` — в Web Worker через Partytown (экспериментально).

Плюсы перед обычным `<script>`: скрипт подключается один раз, даже если компонент рендерится на нескольких страницах, есть колбэки `onLoad`/`onReady`. Для Google Analytics и Tag Manager есть готовые компоненты в `@next/third-parties`.
