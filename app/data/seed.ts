// Сгенерировано scripts/seed.mjs из content/*.md — не редактируй руками
import type { SeedDeck } from "../lib/types";

export const SEED: SeedDeck[] = [
  {
    "id": "js",
    "title": "JavaScript",
    "description": "База, о которой спрашивают на любом фронтенд-собесе",
    "color": "amber",
    "icon": "braces",
    "cards": [
      {
        "id": "js-01",
        "front": "Как работает Event Loop? В каком порядке выполнятся синхронный код, промисы и `setTimeout`?",
        "back": "JS однопоточный. Есть **стек вызовов**, очередь **микрозадач** (промисы, `queueMicrotask`, `MutationObserver`) и очередь **макрозадач** (`setTimeout`, события, I/O).\n\nЦикл: выполнить синхронный код до опустошения стека → **все** микрозадачи → отрисовка (если нужна) → **одна** макрозадача → снова все микрозадачи…\n\n```js\nconsole.log(1);\nsetTimeout(() => console.log(2));\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);\n// 1 4 3 2\n```",
        "tags": [
          "event-loop",
          "async"
        ]
      },
      {
        "id": "js-02",
        "front": "Что такое замыкание? Приведи практический пример.",
        "back": "Функция + лексическое окружение, в котором она создана. Функция «помнит» переменные внешней области, даже когда внешняя функция уже завершилась.\n\n```js\nfunction counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst next = counter();\nnext(); // 1\nnext(); // 2\n```\n\nПрименение: приватное состояние, фабрики функций, debounce/throttle, мемоизация, хуки React (и их ловушка — устаревшее замыкание).",
        "tags": [
          "замыкания",
          "функции"
        ]
      },
      {
        "id": "js-03",
        "front": "Как определяется `this`?",
        "back": "Зависит от **способа вызова**, а не от места объявления:\n\n- `obj.method()` → `obj`\n- обычный вызов `fn()` → `undefined` в strict mode (иначе `globalThis`)\n- `new Fn()` → новый объект\n- `fn.call(ctx)`, `apply`, `bind` → `ctx`\n- стрелочная функция своего `this` не имеет — берёт из внешней области\n\nЛовушка: `const m = obj.method; m()` — контекст потерян.",
        "tags": [
          "this",
          "функции"
        ]
      },
      {
        "id": "js-04",
        "front": "Чем отличаются `var`, `let` и `const`? Что такое TDZ?",
        "back": "- `var` — область видимости функции, всплывает со значением `undefined`, можно переобъявить.\n- `let`/`const` — блочная область. Тоже всплывают, но до строки объявления находятся во **временной мёртвой зоне** (TDZ): обращение → `ReferenceError`.\n- `const` запрещает переприсваивание, но не делает объект неизменяемым.\n\n```js\nfor (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3\nfor (let j = 0; j < 3; j++) setTimeout(() => console.log(j)); // 0 1 2\n```",
        "tags": [
          "переменные",
          "tdz"
        ]
      },
      {
        "id": "js-05",
        "front": "Что такое hoisting (всплытие)?",
        "back": "При создании контекста объявления «поднимаются»:\n\n- **Function Declaration** — целиком, можно вызвать до объявления;\n- `var` — со значением `undefined`;\n- `let`, `const`, `class` — без инициализации (TDZ).\n\nFunction Expression ведёт себя как переменная:\n\n```js\nhi(); // работает\nfunction hi() {}\n\nbye(); // TypeError: bye is not a function\nvar bye = () => {};\n```",
        "tags": [
          "hoisting",
          "переменные"
        ]
      },
      {
        "id": "js-06",
        "front": "Разница между `==` и `===`? Чему равно `NaN === NaN`?",
        "back": "`===` сравнивает без приведения типов, `==` приводит: `'1' == 1`, `0 == ''`, `null == undefined` — всё `true`. Используй `===`. Исключение — `x == null` как короткая проверка на `null`/`undefined`.\n\n`NaN === NaN` → `false`. Проверка: `Number.isNaN(x)` или `Object.is(x, NaN)`. А ещё `Object.is(0, -0)` → `false`.",
        "tags": [
          "сравнение",
          "типы"
        ]
      },
      {
        "id": "js-07",
        "front": "Как работает прототипное наследование?",
        "back": "У каждого объекта есть скрытая ссылка `[[Prototype]]` (`Object.getPrototypeOf(obj)`). При чтении свойства JS идёт по **цепочке прототипов**, пока не найдёт его или не дойдёт до `null`.\n\n`class` — синтаксический сахар над прототипами: методы лежат в `Class.prototype`.\n\n```js\nconst animal = { eat() { return \"ест\"; } };\nconst cat = Object.create(animal);\ncat.eat(); // \"ест\" — найдено в прототипе\n```",
        "tags": [
          "прототипы",
          "ооп"
        ]
      },
      {
        "id": "js-08",
        "front": "Чем отличаются `Promise.all`, `allSettled`, `race` и `any`?",
        "back": "- `all` — ждёт все; падает при **первом** reject.\n- `allSettled` — ждёт все и никогда не падает: `[{ status, value | reason }]`.\n- `race` — результат первого завершившегося (успех или ошибка).\n- `any` — первый **успешный**; если упали все — `AggregateError`.\n\n`all` — для независимых запросов, которые нужны все. `allSettled` — когда устраивает частичный успех.",
        "tags": [
          "промисы",
          "async"
        ]
      },
      {
        "id": "js-09",
        "front": "Как обрабатывать ошибки в async/await? Что будет, если забыть `await`?",
        "back": "`try/catch` вокруг `await` или `.catch()` у промиса. Без `await` функция сразу вернёт промис, ошибка уйдёт в unhandled rejection, и `try/catch` её не поймает.\n\nПоследовательно или параллельно:\n\n```js\n// медленно: запросы по очереди\nconst a = await getA();\nconst b = await getB();\n\n// быстро: параллельно\nconst [a2, b2] = await Promise.all([getA(), getB()]);\n```",
        "tags": [
          "async",
          "промисы"
        ]
      },
      {
        "id": "js-10",
        "front": "Чем debounce отличается от throttle? Напиши debounce.",
        "back": "**debounce** — вызвать один раз после паузы (поиск при вводе). **throttle** — не чаще раза в N мс (scroll, resize).\n\n```ts\nfunction debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {\n  let t: ReturnType<typeof setTimeout>;\n  return (...args: A) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), ms);\n  };\n}\n```",
        "tags": [
          "debounce",
          "задачи"
        ]
      },
      {
        "id": "js-11",
        "front": "`call`, `apply`, `bind` — в чём разница?",
        "back": "Все три задают `this`:\n\n- `call(ctx, a, b)` — вызывает сразу, аргументы списком;\n- `apply(ctx, [a, b])` — вызывает сразу, аргументы массивом;\n- `bind(ctx, a)` — **возвращает новую функцию** с привязанным контекстом (и частично применёнными аргументами).\n\nПовторный `bind` контекст не меняет. На стрелочные функции не действуют.",
        "tags": [
          "this",
          "функции"
        ]
      },
      {
        "id": "js-12",
        "front": "Поверхностное и глубокое копирование. Как скопировать объект глубоко?",
        "back": "Spread `{...obj}` и `Object.assign` копируют только верхний уровень — вложенные объекты остаются общими.\n\nГлубоко: `structuredClone(obj)` — поддерживает `Date`, `Map`, `Set`, циклические ссылки; не копирует функции и DOM-узлы.\n\n`JSON.parse(JSON.stringify(obj))` теряет `undefined` и функции, а `Date` превращает в строку.",
        "tags": [
          "объекты",
          "копирование"
        ]
      },
      {
        "id": "js-13",
        "front": "`Map` против `Object`, `Set`, `WeakMap` — когда что?",
        "back": "- **Map** — ключи любого типа, порядок вставки, есть `size`, быстрые частые добавления и удаления.\n- **Object** — записи с заранее известными строковыми ключами.\n- **Set** — уникальные значения: `[...new Set(arr)]`.\n- **WeakMap / WeakSet** — ключи только объекты, держатся слабо и не мешают сборке мусора. Подходят для кэша и метаданных к объектам, не итерируются.",
        "tags": [
          "коллекции"
        ]
      },
      {
        "id": "js-14",
        "front": "Что такое всплытие и делегирование событий?",
        "back": "Событие проходит фазы: **погружение** (от `window` к цели) → цель → **всплытие** (обратно вверх).\n\nДелегирование — один обработчик на родителе вместо сотни на детях:\n\n```js\nlist.addEventListener(\"click\", (e) => {\n  const item = e.target.closest(\"li\");\n  if (item) select(item.dataset.id);\n});\n```\n\n`e.target` — где кликнули, `e.currentTarget` — где висит обработчик. `stopPropagation()` останавливает всплытие.",
        "tags": [
          "dom",
          "события"
        ]
      },
      {
        "id": "js-15",
        "front": "Какие методы массива мутируют исходный массив? Какие есть иммутабельные аналоги?",
        "back": "Мутируют: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`.\n\nES2023 добавил копирующие версии: `toSorted()`, `toReversed()`, `toSpliced()`, `with(i, v)`. В React и Redux состояние мутировать нельзя — используй их или spread.\n\nЛовушка: `[10, 9, 1].sort()` → `[1, 10, 9]`, потому что сортирует как строки. Нужно `sort((a, b) => a - b)`.",
        "tags": [
          "массивы",
          "иммутабельность"
        ]
      },
      {
        "id": "js-16",
        "front": "Какие типы данных есть в JS? Что вернёт `typeof null`?",
        "back": "7 примитивов: `string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, `null` — и `object` (включая массивы и функции). Примитивы передаются по значению, объекты — по ссылке.\n\n`typeof null === \"object\"` — историческая ошибка языка. `typeof function () {}` → `\"function\"`. Массив проверяй через `Array.isArray`.",
        "tags": [
          "типы"
        ]
      },
      {
        "id": "js-17",
        "front": "Чем ES-модули отличаются от CommonJS?",
        "back": "**ESM** (`import`/`export`) — статические: импорты известны до выполнения, поэтому работают tree-shaking и top-level `await`. Экспорт — **живая привязка**, загрузка асинхронная.\n\n**CommonJS** (`require`/`module.exports`) — динамический и синхронный, экспортирует копию значения.\n\nВ браузере и современных бандлерах стандарт — ESM.",
        "tags": [
          "модули"
        ]
      },
      {
        "id": "js-18",
        "front": "Что делают `?.` и `??`? Чем `??` отличается от `||`?",
        "back": "`a?.b?.()` — безопасный доступ: вернёт `undefined`, если `a` — `null` или `undefined`.\n\n`??` подставляет значение только для `null`/`undefined`, а `||` — для **любого** falsy (`0`, `''`, `false`):\n\n```js\nconst count = 0;\ncount || 10; // 10 — неожиданно\ncount ?? 10; // 0\n```",
        "tags": [
          "операторы"
        ]
      },
      {
        "id": "js-19",
        "front": "Как работает сборщик мусора и откуда берутся утечки памяти?",
        "back": "Алгоритм **mark-and-sweep**: от корней (глобальный объект, стек) помечается всё достижимое, остальное удаляется.\n\nУтечка — объект, который остался достижимым по ошибке:\n\n- забытые таймеры и подписки (`addEventListener` без удаления);\n- замыкания на большие данные;\n- растущие глобальные кэши;\n- ссылки на удалённые DOM-узлы.\n\nВ React — эффекты без cleanup.",
        "tags": [
          "память"
        ]
      },
      {
        "id": "js-20",
        "front": "Что происходит, когда браузер рисует страницу (critical rendering path)?",
        "back": "HTML → **DOM**, CSS → **CSSOM** → Render Tree → **Layout** (геометрия) → **Paint** (пиксели) → **Composite** (слои).\n\n- изменение `width` или `top` → layout (дорого);\n- `color` → paint;\n- `transform` и `opacity` → только composite, на GPU. Поэтому анимируют их.\n\nЧтение `offsetHeight` сразу после записи стилей вызывает принудительный layout (layout thrashing).",
        "tags": [
          "браузер",
          "производительность"
        ]
      },
      {
        "id": "js-21",
        "front": "Как отменить fetch-запрос?",
        "back": "Через `AbortController`:\n\n```ts\nconst controller = new AbortController();\n\nfetch(url, { signal: controller.signal }).catch((e) => {\n  if (e.name === \"AbortError\") return;\n  throw e;\n});\n\ncontroller.abort();\n```\n\nВ React отменяют в cleanup эффекта, чтобы не было гонок при смене параметров. Для таймаута: `AbortSignal.timeout(5000)`.",
        "tags": [
          "сеть",
          "async"
        ]
      },
      {
        "id": "js-22",
        "front": "Что такое CORS и почему возникает ошибка?",
        "back": "Браузер блокирует ответы на запросы к другому **origin** (протокол + домен + порт), если сервер не разрешил это заголовком `Access-Control-Allow-Origin`.\n\nДля «непростых» запросов (PUT, JSON, свои заголовки) сначала уходит preflight `OPTIONS`.\n\nЧинится на **сервере** или через прокси, не на клиенте. Это защита браузера: curl и запросы сервер → сервер CORS не касается.",
        "tags": [
          "сеть",
          "безопасность"
        ]
      },
      {
        "id": "js-23",
        "front": "`cookie`, `localStorage`, `sessionStorage`, IndexedDB — в чём разница?",
        "back": "- **cookie** — ~4 КБ, уходит на сервер с каждым запросом. Может быть `HttpOnly` — тогда недоступна JS (так хранят сессию).\n- **localStorage** — ~5 МБ, синхронный, бессрочный, только строки.\n- **sessionStorage** — то же, но живёт до закрытия вкладки.\n- **IndexedDB** — асинхронная БД на сотни МБ: объекты, индексы, транзакции.\n\nЭто приложение хранит карточки в IndexedDB.",
        "tags": [
          "браузер",
          "хранилища"
        ]
      },
      {
        "id": "js-24",
        "front": "Что такое чистая функция и иммутабельность? Почему это важно в React?",
        "back": "**Чистая функция** — результат зависит только от аргументов, побочных эффектов нет. **Иммутабельность** — данные не меняем, а создаём новые.\n\nReact и Redux сравнивают состояние **по ссылке** (`Object.is`). Мутация не меняет ссылку → ререндера не будет:\n\n```js\nsetItems([...items, x]);       // ✓ новый массив\nitems.push(x); setItems(items); // ✗ та же ссылка\n```",
        "tags": [
          "иммутабельность",
          "функции"
        ]
      },
      {
        "id": "js-25",
        "front": "Что такое XSS и как от него защититься?",
        "back": "Внедрение чужого скрипта через пользовательские данные.\n\nReact экранирует текст в JSX, но опасны `dangerouslySetInnerHTML`, `href=\"javascript:…\"`, `innerHTML` и `eval`.\n\nЗащита: не вставлять сырой HTML (или чистить через DOMPurify), Content-Security-Policy, токены в `HttpOnly` cookie, а не в localStorage.",
        "tags": [
          "безопасность"
        ]
      },
      {
        "id": "js-26",
        "front": "Что такое итераторы и генераторы?",
        "back": "**Итератор** — объект с методом `next()`, который возвращает `{ value, done }`. Объект **итерируемый**, если у него есть метод `[Symbol.iterator]`: тогда работают `for...of`, spread и деструктуризация.\n\n**Генератор** (`function*`) — функция, которая умеет приостанавливаться на `yield` и продолжать с того же места. Она возвращает итератор.\n\n```js\nfunction* ids() {\n  let id = 1;\n  while (true) yield id++; // бесконечная, но ленивая последовательность\n}\nconst gen = ids();\ngen.next().value; // 1\ngen.next().value; // 2\n\nconst range = {\n  from: 1,\n  to: 3,\n  *[Symbol.iterator]() {\n    for (let i = this.from; i <= this.to; i++) yield i;\n  },\n};\n[...range]; // [1, 2, 3]\n```",
        "tags": [
          "итераторы",
          "генераторы"
        ]
      },
      {
        "id": "js-27",
        "front": "Что такое `Proxy` и где он применяется?",
        "back": "Обёртка над объектом, которая перехватывает операции: чтение, запись, удаление, `in` и другие. `Reflect` выполняет операцию по умолчанию.\n\n```js\nconst user = { name: \"Ann\", age: 30 };\nconst watched = new Proxy(user, {\n  set(target, key, value) {\n    console.log(`${String(key)}: ${target[key]} → ${value}`);\n    return Reflect.set(target, key, value);\n  },\n});\nwatched.age = 31; // \"age: 30 → 31\"\n```\n\nНа Proxy построены реактивность Vue 3, черновики Immer (их использует Redux Toolkit), MobX. Также — валидация, логирование, значения по умолчанию.",
        "tags": [
          "proxy",
          "метапрограммирование"
        ]
      },
      {
        "id": "js-28",
        "front": "Чем `for...in` отличается от `for...of`?",
        "back": "- `for...in` перебирает **ключи** (строки) объекта, включая унаследованные перечисляемые свойства.\n- `for...of` перебирает **значения** итерируемого объекта: массива, строки, `Map`, `Set`.\n\n```js\nconst arr = [\"a\", \"b\"];\narr.extra = \"!\";\n\nfor (const i in arr) console.log(i); // \"0\", \"1\", \"extra\"\nfor (const v of arr) console.log(v); // \"a\", \"b\"\n```\n\nДля массивов — `for...of` (или методы массива). Для объектов — `Object.keys/values/entries` + `for...of`.",
        "tags": [
          "циклы",
          "ловушка"
        ]
      },
      {
        "id": "js-29",
        "front": "Как сгруппировать массив объектов по полю?",
        "back": "Современный способ (ES2024) — `Object.groupBy`:\n\n```js\nconst people = [\n  { name: \"Ann\", dept: \"dev\" },\n  { name: \"Bob\", dept: \"qa\" },\n  { name: \"Kim\", dept: \"dev\" },\n];\n\nObject.groupBy(people, (p) => p.dept);\n// { dev: [Ann, Kim], qa: [Bob] } — объект без прототипа\n\nMap.groupBy(people, (p) => p.dept); // то же, но в Map\n```\n\nКлассика для собеса — через `reduce`:\n\n```js\nconst byDept = people.reduce((acc, p) => {\n  (acc[p.dept] ??= []).push(p.name);\n  return acc;\n}, {});\n// { dev: [\"Ann\", \"Kim\"], qa: [\"Bob\"] }\n```",
        "tags": [
          "массивы",
          "группировка"
        ]
      }
    ]
  },
  {
    "id": "ts",
    "title": "TypeScript",
    "description": "Система типов от базы до infer и mapped types",
    "color": "blue",
    "icon": "type",
    "cards": [
      {
        "id": "ts-01",
        "front": "Чем `type` отличается от `interface`?",
        "back": "Оба описывают форму объекта. Отличия:\n\n- `interface` можно **дополнять** повторным объявлением (declaration merging) и расширять через `extends`.\n- `type` умеет больше: union, пересечения, кортежи, mapped и conditional types, примитивы.\n- `extends` у интерфейсов даёт понятную ошибку при конфликте полей, а `&` молча превращает поле в `never`.\n\nНа практике: `interface` — для объектных контрактов, `type` — для остального. Главное — единообразие в проекте.",
        "tags": [
          "основы"
        ]
      },
      {
        "id": "ts-02",
        "front": "`any`, `unknown` и `never` — в чём разница?",
        "back": "- `any` — отключает проверку и «заражает» всё, к чему прикасается.\n- `unknown` — «что угодно, но сначала проверь»: без сужения типа использовать нельзя.\n- `never` — значения не бывает: функция, которая всегда бросает исключение, пустой union, исчерпанная проверка.\n\n```ts\nfunction parse(raw: unknown) {\n  if (typeof raw === \"string\") return raw.trim(); // здесь raw: string\n  throw new Error(\"not a string\");                // тип never\n}\n```",
        "tags": [
          "основы",
          "unknown",
          "never"
        ]
      },
      {
        "id": "ts-03",
        "front": "Что такое дженерики? Приведи пример с ограничением.",
        "back": "Параметры типов: функция или тип работает с разными типами и сохраняет связь между входом и выходом.\n\n```ts\nfunction first<T>(items: T[]): T | undefined {\n  return items[0];\n}\n\n// ограничение через extends\nfunction byId<T extends { id: string }>(items: T[], id: string) {\n  return items.find((i) => i.id === id);\n}\n```\n\nБез `extends` обращаться к `.id` нельзя: `T` может быть чем угодно.",
        "tags": [
          "generics"
        ]
      },
      {
        "id": "ts-04",
        "front": "Что делают `keyof` и `typeof` на уровне типов?",
        "back": "`typeof value` — берёт тип из значения. `keyof T` — union ключей типа.\n\n```ts\nconst config = { theme: \"dark\", lang: \"ru\" };\ntype Config = typeof config; // { theme: string; lang: string }\ntype Key = keyof Config;     // \"theme\" | \"lang\"\n\nfunction get<T, K extends keyof T>(obj: T, key: K): T[K] {\n  return obj[key];\n}\n```",
        "tags": [
          "keyof",
          "typeof"
        ]
      },
      {
        "id": "ts-05",
        "front": "Что такое indexed access types? Как получить тип элемента массива?",
        "back": "`T[K]` — тип свойства по ключу.\n\n```ts\ntype User = { id: number; roles: (\"admin\" | \"user\")[] };\ntype Id = User[\"id\"];              // number\ntype Role = User[\"roles\"][number]; // \"admin\" | \"user\"\n\nconst SIZES = [\"s\", \"m\", \"l\"] as const;\ntype Size = (typeof SIZES)[number]; // \"s\" | \"m\" | \"l\"\n```\n\nПриём `(typeof ARR)[number]` + `as const` держит источник правды в одном месте. Так сделаны оценки в этом приложении.",
        "tags": [
          "indexed access",
          "as const"
        ]
      },
      {
        "id": "ts-06",
        "front": "Назови основные utility types.",
        "back": "- `Partial<T>` / `Required<T>` — все поля необязательные / обязательные\n- `Readonly<T>` — только чтение\n- `Pick<T, K>` / `Omit<T, K>` — оставить / убрать поля\n- `Record<K, V>` — объект с ключами `K` и значениями `V`\n- `Exclude<U, X>` / `Extract<U, X>` — убрать / оставить члены union\n- `NonNullable<T>` — убрать `null` и `undefined`\n- `ReturnType<F>`, `Parameters<F>`, `Awaited<T>` — результат, аргументы, значение промиса",
        "tags": [
          "utility types"
        ]
      },
      {
        "id": "ts-07",
        "front": "Что такое mapped types? Напиши свой `Partial`.",
        "back": "Тип, который проходит по ключам другого типа:\n\n```ts\ntype MyPartial<T> = { [K in keyof T]?: T[K] };\ntype MyReadonly<T> = { readonly [K in keyof T]: T[K] };\n\n// модификаторы можно снимать: -? и -readonly\ntype Mutable<T> = { -readonly [K in keyof T]: T[K] };\n\n// переименование ключей через as\ntype Getters<T> = {\n  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];\n};\n```",
        "tags": [
          "mapped types"
        ]
      },
      {
        "id": "ts-08",
        "front": "Что такое условные типы? Что значит «дистрибутивность»?",
        "back": "Тернарник на уровне типов: `T extends U ? X : Y`.\n\n```ts\ntype IsString<T> = T extends string ? true : false;\ntype A = IsString<\"hi\">; // true\n```\n\nНа union-типе они **дистрибутивны** — применяются к каждому члену отдельно:\n\n```ts\ntype ToArray<T> = T extends unknown ? T[] : never;\ntype B = ToArray<string | number>; // string[] | number[]\n```\n\nОтключить: `[T] extends [unknown] ? T[] : never` → `(string | number)[]`.",
        "tags": [
          "conditional types"
        ]
      },
      {
        "id": "ts-09",
        "front": "Для чего нужно ключевое слово `infer`?",
        "back": "Внутри conditional type «вытаскивает» тип из структуры:\n\n```ts\ntype MyReturnType<F> = F extends (...args: any[]) => infer R ? R : never;\ntype Unwrap<T> = T extends Promise<infer V> ? V : T;\ntype ElementOf<T> = T extends (infer E)[] ? E : never;\n\ntype R = MyReturnType<() => Promise<number>>; // Promise<number>\ntype V = Unwrap<R>;                            // number\n```",
        "tags": [
          "infer",
          "conditional types"
        ]
      },
      {
        "id": "ts-10",
        "front": "Как сужать типы? Что такое type guard?",
        "back": "TS сужает тип после проверок: `typeof`, `instanceof`, `in`, сравнения с литералом, проверки на truthy.\n\nСвой предикат:\n\n```ts\ntype Fish = { swim(): void };\ntype Bird = { fly(): void };\n\nfunction isFish(pet: Fish | Bird): pet is Fish {\n  return \"swim\" in pet;\n}\n\nif (isFish(pet)) pet.swim(); // pet: Fish\n```\n\nЕсть ещё assertion-функции: `function assert(x: unknown): asserts x is string`.",
        "tags": [
          "narrowing",
          "type guards"
        ]
      },
      {
        "id": "ts-11",
        "front": "Что такое discriminated union и exhaustive check?",
        "back": "Union объектов с общим полем-литералом (дискриминантом). По нему TS сужает тип в `switch`, а `never` в `default` ловит забытые варианты при компиляции:\n\n```ts\ntype State =\n  | { status: \"loading\" }\n  | { status: \"error\"; error: string }\n  | { status: \"ok\"; data: string[] };\n\nfunction render(s: State) {\n  switch (s.status) {\n    case \"loading\": return \"…\";\n    case \"error\": return s.error;\n    case \"ok\": return s.data.join();\n    default: {\n      const never: never = s; // новый статус → ошибка компиляции здесь\n      return never;\n    }\n  }\n}\n```",
        "tags": [
          "union",
          "never"
        ]
      },
      {
        "id": "ts-12",
        "front": "Что делает оператор `satisfies` и чем он лучше аннотации?",
        "back": "Проверяет, что значение подходит под тип, но **не расширяет** выведенный тип:\n\n```ts\ntype Colors = Record<string, string | [number, number, number]>;\n\nconst a: Colors = { red: [255, 0, 0] };\na.red.map; // ошибка: string | tuple\n\nconst b = { red: [255, 0, 0] } satisfies Colors;\nb.red.map; // ок: TS помнит, что это кортеж\n```\n\nПлюс ловит опечатки в ключах и сохраняет литеральные типы.",
        "tags": [
          "satisfies"
        ]
      },
      {
        "id": "ts-13",
        "front": "Что делает `as const`?",
        "back": "Делает выражение максимально узким и неизменяемым: строки → литералы, массивы → readonly-кортежи, поля → `readonly`.\n\n```ts\nconst a = [\"get\", \"post\"];          // string[]\nconst b = [\"get\", \"post\"] as const; // readonly [\"get\", \"post\"]\ntype Method = (typeof b)[number];   // \"get\" | \"post\"\n```\n\nЧасто заменяет `enum`.",
        "tags": [
          "as const"
        ]
      },
      {
        "id": "ts-14",
        "front": "`enum` или union строковых литералов?",
        "back": "`enum` генерирует настоящий JS-объект, то есть код в бандле. Числовые enum небезопасны: им можно присвоить любое число. Enum не совместимы с флагом `erasableSyntaxOnly` и запуском TS в Node без сборки.\n\nUnion литералов (`\"up\" | \"down\"`) или объект `as const` не оставляют кода в рантайме и лучше тришейкаются. Поэтому сейчас чаще выбирают их.",
        "tags": [
          "enum",
          "union"
        ]
      },
      {
        "id": "ts-15",
        "front": "Что значит «структурная типизация»?",
        "back": "Совместимость определяется **формой**, а не именем типа: если у объекта есть все нужные поля, он подходит.\n\n```ts\ntype Point = { x: number; y: number };\n\nconst p = { x: 1, y: 2, z: 3 };\nconst ok: Point = p; // ок: лишние поля разрешены\n\nconst bad: Point = { x: 1, y: 2, z: 3 }; // ошибка: excess property check — только для литералов\n```\n\nЧтобы различать одинаковые по форме типы (`UserId` и `OrderId`), используют branded types.",
        "tags": [
          "основы"
        ]
      },
      {
        "id": "ts-16",
        "front": "Что такое branded (номинальные) типы?",
        "back": "Приём, который имитирует номинальную типизацию:\n\n```ts\ntype UserId = string & { readonly __brand: \"UserId\" };\ntype OrderId = string & { readonly __brand: \"OrderId\" };\n\nconst toUserId = (s: string) => s as UserId;\n\nfunction getUser(id: UserId) {}\n\ngetUser(toUserId(\"42\")); // ок\ngetUser(\"42\");           // ошибка\ngetUser(orderId);        // ошибка, хотя оба — string\n```",
        "tags": [
          "branded types"
        ]
      },
      {
        "id": "ts-17",
        "front": "Что такое template literal types?",
        "back": "Строковые шаблоны на уровне типов:\n\n```ts\ntype Size = \"sm\" | \"lg\";\ntype Color = \"red\" | \"blue\";\ntype Cls = `${Color}-${Size}`; // \"red-sm\" | \"red-lg\" | \"blue-sm\" | \"blue-lg\"\n\ntype EventName<T extends string> = `on${Capitalize<T>}`;\ntype E = EventName<\"click\">; // \"onClick\"\n```\n\nВстроенные помощники: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`.",
        "tags": [
          "template literal types"
        ]
      },
      {
        "id": "ts-18",
        "front": "Как описать перегрузки функций?",
        "back": "Несколько сигнатур + одна реализация, совместимая со всеми:\n\n```ts\nfunction parse(x: string): number;\nfunction parse(x: number): string;\nfunction parse(x: string | number) {\n  return typeof x === \"string\" ? Number(x) : String(x);\n}\n\nconst n = parse(\"1\"); // number\n```\n\nСигнатура реализации снаружи не видна. Часто перегрузки можно заменить дженериком с conditional type.",
        "tags": [
          "функции"
        ]
      },
      {
        "id": "ts-19",
        "front": "Чем `as` отличается от аннотации типа? Что делает `!`?",
        "back": "Аннотация `const u: User = data` **проверяет** значение.\n\nУтверждение `data as User` говорит компилятору «поверь мне» — проверки почти нет, соврать легко.\n\n`x!` (non-null assertion) убирает `null | undefined` без всякой проверки.\n\nОба приёма — источники багов. Лучше сужать типы проверками или валидировать данные схемой (zod).",
        "tags": [
          "основы",
          "assertion"
        ]
      },
      {
        "id": "ts-20",
        "front": "Как сделать данные неизменяемыми на уровне типов?",
        "back": "`readonly` у полей, `Readonly<T>`, `readonly T[]`, `as const`.\n\nЭто только проверка компилятора — в рантайме объект можно изменить (для этого есть `Object.freeze`). `Readonly` поверхностный, глубокий пишут рекурсивно:\n\n```ts\ntype DeepReadonly<T> = {\n  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];\n};\n```",
        "tags": [
          "readonly",
          "mapped types"
        ]
      },
      {
        "id": "ts-21",
        "front": "Почему `Omit` на union-типе ломает discriminated union?",
        "back": "`Omit<A | B, \"id\">` работает с `keyof (A | B)` — а это только **общие** ключи. Результат схлопывается в один объект, уникальные поля теряются.\n\nРешение — дистрибутивный `Omit`:\n\n```ts\ntype DistributiveOmit<T, K extends PropertyKey> =\n  T extends unknown ? Omit<T, K> : never;\n```",
        "tags": [
          "union",
          "utility types",
          "ловушка"
        ]
      },
      {
        "id": "ts-22",
        "front": "Как типизировать пропсы React-компонента и `children`?",
        "back": "```tsx\ntype ButtonProps = React.ComponentProps<\"button\"> & {\n  variant?: \"primary\" | \"ghost\";\n};\n\nfunction Button({ variant = \"primary\", ...rest }: ButtonProps) {\n  return <button data-variant={variant} {...rest} />;\n}\n```\n\n- `React.ReactNode` — для `children` (всё, что можно отрендерить);\n- `React.FC` сейчас используют редко;\n- события: `React.ChangeEvent<HTMLInputElement>`.",
        "tags": [
          "react"
        ]
      },
      {
        "id": "ts-23",
        "front": "Как сделать дженерик-компонент в React?",
        "back": "```tsx\ntype ListProps<T> = {\n  items: T[];\n  render: (item: T) => React.ReactNode;\n  getKey: (item: T) => string;\n};\n\nfunction List<T>({ items, render, getKey }: ListProps<T>) {\n  return <ul>{items.map((i) => <li key={getKey(i)}>{render(i)}</li>)}</ul>;\n}\n```\n\n`T` выводится из `items`, и `render` получает правильный тип. Стрелочную функцию в `.tsx` пишут как `<T,>(props) => …` — запятая, чтобы не спутать с JSX.",
        "tags": [
          "react",
          "generics"
        ]
      },
      {
        "id": "ts-24",
        "front": "Что такое `.d.ts` и declaration merging? Как расширить чужой тип?",
        "back": "`.d.ts` содержит только типы. Интерфейсы с одним именем сливаются — так расширяют библиотеки:\n\n```ts\ndeclare module \"next-auth\" {\n  interface Session {\n    user: { id: string; role: \"admin\" | \"user\" };\n  }\n}\n\ndeclare global {\n  interface Window {\n    analytics: Analytics;\n  }\n}\n```",
        "tags": [
          "d.ts",
          "модули"
        ]
      },
      {
        "id": "ts-25",
        "front": "Что включает `strict: true` в tsconfig?",
        "back": "Набор флагов: `strictNullChecks` (самый важный: `null`/`undefined` — отдельные типы), `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `useUnknownInCatchVariables`, `alwaysStrict`.\n\nПолезно добавить сверху: `noUncheckedIndexedAccess` (`arr[i]` → `T | undefined`) и `exactOptionalPropertyTypes`.",
        "tags": [
          "tsconfig"
        ]
      },
      {
        "id": "ts-26",
        "front": "Какой тип у ошибки в `catch` и как с ней работать?",
        "back": "При `strict` — `unknown`: бросить можно что угодно, не только `Error`. Сужай:\n\n```ts\ntry {\n  await save();\n} catch (e) {\n  const message = e instanceof Error ? e.message : String(e);\n  toast(message);\n}\n```",
        "tags": [
          "unknown",
          "ошибки"
        ]
      },
      {
        "id": "ts-27",
        "front": "Как получить тип данных, которые возвращает async-функция?",
        "back": "```ts\nasync function getUser() {\n  return { id: 1, name: \"Ann\" };\n}\n\ntype User = Awaited<ReturnType<typeof getUser>>;\n// { id: number; name: string }\n```\n\n`Awaited` разворачивает промисы рекурсивно, даже вложенные.",
        "tags": [
          "utility types",
          "async"
        ]
      },
      {
        "id": "ts-28",
        "front": "`Record<string, T>` против `Record<\"a\" | \"b\", T>`. Какая ловушка у индексных сигнатур?",
        "back": "С union-ключами `Record` требует **все** ключи. Со `string` подходят любые ключи, но TS считает, что значение есть всегда:\n\n```ts\nconst prices: Record<string, number> = {};\nprices.apple.toFixed(); // компилируется, а в рантайме падает\n```\n\nЛечится флагом `noUncheckedIndexedAccess`, `Partial<Record<…>>` или `Map`.",
        "tags": [
          "record",
          "ловушка"
        ]
      },
      {
        "id": "ts-29",
        "front": "Что такое ковариантность и контравариантность?",
        "back": "- **Ковариантность**: массивы и возвращаемые значения. `Dog[]` можно передать туда, где ждут `Animal[]`.\n- **Контравариантность**: параметры функций. Где ждут `(d: Dog) => void`, можно передать `(a: Animal) => void`, но не наоборот: функция, которая умеет только с кошками, не справится с любым `Animal`.\n\nС `strictFunctionTypes` это проверяется для свойств-функций, но не для методов — они бивариантны.",
        "tags": [
          "вариантность",
          "функции"
        ]
      },
      {
        "id": "ts-30",
        "front": "Что делает `NoInfer<T>`?",
        "back": "(TS 5.4) Запрещает выводить дженерик из этого места:\n\n```ts\nfunction createFSM<S extends string>(states: S[], initial: NoInfer<S>) {}\n\ncreateFSM([\"idle\", \"run\"], \"jump\"); // ошибка: S выводится только из states\n```\n\nБез `NoInfer` TS расширил бы `S` до `\"idle\" | \"run\" | \"jump\"`.",
        "tags": [
          "generics",
          "новое"
        ]
      },
      {
        "id": "ts-31",
        "front": "Чем отличаются `A | B` и `A & B`?",
        "back": "`A | B` — значение **одного** из типов: до сужения доступны только общие поля.\n\n`A & B` — значение **обоих** сразу: доступны все поля. Для примитивов `string & number` → `never`.\n\nИнтуиция: у union больше значений и меньше гарантий, у пересечения — наоборот.",
        "tags": [
          "union",
          "основы"
        ]
      },
      {
        "id": "ts-32",
        "front": "Почему типы TS не защищают от неверных данных с сервера? Как быть?",
        "back": "Типы стираются при компиляции: `res.json() as User` — просто обещание.\n\nДанные извне (API, localStorage, формы) валидируют в рантайме схемами (zod, valibot) и выводят тип из схемы:\n\n```ts\nconst User = z.object({ id: z.number(), name: z.string() });\ntype User = z.infer<typeof User>;\n\nconst user = User.parse(await res.json()); // бросит, если формат не тот\n```",
        "tags": [
          "валидация",
          "zod"
        ]
      },
      {
        "id": "ts-33",
        "front": "Чем `private` в TypeScript отличается от `#private` в JavaScript?",
        "back": "- `private` — проверка **только при компиляции**. В JS-коде поле обычное: его видно в консоли, и даже TS разрешает доступ через скобки `obj[\"secret\"]`.\n- `#secret` — настоящая приватность **в рантайме**: снаружи класса поле недоступно никак.\n\n```ts\nclass Account {\n  private secret = 1;\n  #real = 2;\n}\nconst acc = new Account();\nacc.secret;    // ошибка компиляции\nacc[\"secret\"]; // компилируется — лазейка\n// acc.#real   — синтаксическая ошибка вне класса\n```\n\n`protected` доступен в наследниках, `public` — везде (по умолчанию).",
        "tags": [
          "классы",
          "private"
        ]
      },
      {
        "id": "ts-34",
        "front": "Чем отличаются типы `{}`, `object` и `unknown`?",
        "back": "- `unknown` — вообще любое значение, включая `null` и `undefined`.\n- `{}` — любое значение, **кроме** `null` и `undefined`: подходят и примитивы (`42`, `\"str\"`).\n- `object` — только непримитивы: объекты, массивы, функции.\n\n```ts\nconst a: {} = 42;       // ок\nconst b: {} = null;     // ошибка\nconst c: object = 42;   // ошибка\nconst d: object = [];   // ок\n```\n\nЧастая ошибка — писать `{}` в значении «любой объект». Для «объект с любыми ключами» есть `Record<string, unknown>`.",
        "tags": [
          "основы",
          "unknown"
        ]
      },
      {
        "id": "ts-35",
        "front": "Почему функцию с меньшим числом параметров можно передать туда, где ждут больше?",
        "back": "Это безопасно: функция просто проигнорирует лишние аргументы. Так устроены колбэки в JS:\n\n```ts\nconst cb: (value: number, index: number) => void = (v) => {};\n\n[1, 2, 3].forEach((n) => console.log(n)); // index и array не нужны\n```\n\nОбратное запрещено: функция, которой нужны два аргумента, может получить только один.",
        "tags": [
          "функции",
          "совместимость"
        ]
      },
      {
        "id": "ts-36",
        "front": "Как сделать «enum» из обычного объекта?",
        "back": "```ts\nconst ROLE = {\n  Admin: \"admin\",\n  User: \"user\",\n} as const;\n\ntype Role = (typeof ROLE)[keyof typeof ROLE]; // \"admin\" | \"user\"\n\nfunction can(role: Role) {}\ncan(ROLE.Admin); // ок\ncan(\"user\");     // тоже ок — это просто строка\n```\n\nПлюсы перед `enum`: обычный JS-объект без особого синтаксиса, литеральные типы, можно перебрать через `Object.values`.",
        "tags": [
          "as const",
          "enum"
        ]
      },
      {
        "id": "ts-37",
        "front": "Как правильно отфильтровать `undefined` из массива, чтобы TypeScript понял тип?",
        "back": "С TS 5.5 тип-предикат **выводится автоматически** для простых проверок:\n\n```ts\nconst mixed = [1, undefined, 2];\nconst nums = mixed.filter((x) => x !== undefined); // number[]\n```\n\nДля сложных условий предикат пишут явно:\n\n```ts\nconst strs = [\"a\", 1, \"b\"].filter((x): x is string => typeof x === \"string\"); // string[]\n```\n\nДо 5.5 первый пример давал `(number | undefined)[]`, и часто встречалось `filter(Boolean)` — оно тоже не сужает тип и вдобавок выкидывает `0` и `\"\"`.",
        "tags": [
          "type guards",
          "массивы"
        ]
      },
      {
        "id": "ts-38",
        "front": "Напиши тип `PartialBy<T, K>`, который делает необязательными только указанные поля.",
        "back": "```ts\ntype PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;\n\ntype User = { id: number; name: string; email: string };\n\nconst u: PartialBy<User, \"email\"> = { id: 1, name: \"Ann\" }; // ок\n```\n\nИдея: отрезать поля `K` через `Omit`, взять их отдельно через `Pick`, сделать необязательными и склеить пересечением. Так же собирают `RequiredBy`, `ReadonlyBy` и другие.",
        "tags": [
          "utility types",
          "задача"
        ]
      },
      {
        "id": "ts-39",
        "front": "Как типизировать функцию-обёртку, чтобы она сохраняла аргументы и результат исходной функции?",
        "back": "```ts\nfunction withLog<F extends (...args: any[]) => any>(fn: F) {\n  return (...args: Parameters<F>): ReturnType<F> => {\n    console.log(fn.name, args);\n    return fn(...args);\n  };\n}\n\nconst add = (x: number, y: number) => x + y;\nconst loggedAdd = withLog(add); // (x: number, y: number) => number\nloggedAdd(\"1\", 2);              // ошибка типа\n```\n\n`Parameters<F>` и `ReturnType<F>` достают типы из переданной функции — обёртка не теряет типизацию. Так пишут декораторы, `debounce`, `memoize`.",
        "tags": [
          "generics",
          "функции"
        ]
      },
      {
        "id": "ts-40",
        "front": "Что такое `const`-параметры типа (`<const T>`)?",
        "back": "(TS 5.0) Просят TypeScript выводить для аргумента максимально узкий тип, как будто вызывающий написал `as const`:\n\n```ts\nfunction routes<const T extends readonly string[]>(paths: T) {\n  return paths;\n}\nconst r = routes([\"/\", \"/about\"]); // readonly [\"/\", \"/about\"]\n\nfunction plain<T extends readonly string[]>(paths: T) {\n  return paths;\n}\nconst p = plain([\"/\", \"/about\"]); // string[]\n```\n\nУдобно для конфигов, роутов, ключей — тип API строится из переданных литералов без `as const` у пользователя.",
        "tags": [
          "generics",
          "const"
        ]
      },
      {
        "id": "ts-41",
        "front": "Как типизировать event emitter, чтобы данные события зависели от его имени?",
        "back": "Через карту событий и дженерик по её ключу:\n\n```ts\ntype Events = {\n  login: { userId: string };\n  logout: undefined;\n};\n\nfunction on<K extends keyof Events>(name: K, cb: (payload: Events[K]) => void) {}\n\non(\"login\", (p) => p.userId); // p: { userId: string }\non(\"signup\", () => {});       // ошибка: нет такого события\n```\n\n`K` выводится из первого аргумента, а `Events[K]` подставляет нужный тип во второй. Тот же приём — для типизированных `fetch`-клиентов и роутеров.",
        "tags": [
          "generics",
          "события"
        ]
      },
      {
        "id": "ts-42",
        "front": "Как получить union ключей объекта, значения которых — функции?",
        "back": "```ts\ntype FunctionKeys<T> = {\n  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;\n}[keyof T];\n\ntype Service = { id: number; load(): void; save(x: number): boolean };\ntype M = FunctionKeys<Service>; // \"load\" | \"save\"\n```\n\n1. Mapped type превращает каждое поле в его имя или `never`.\n2. Индексирование `[keyof T]` собирает значения в union.\n3. `never` из union исчезает.\n\nАльтернатива — ремаппинг ключей через `as`: `{ [K in keyof T as T[K] extends Function ? K : never]: T[K] }`.",
        "tags": [
          "mapped types",
          "задача"
        ]
      },
      {
        "id": "ts-43",
        "front": "Чем `Exclude` отличается от `Omit`?",
        "back": "- `Exclude<Union, Members>` работает с **union-типами**: убирает члены объединения.\n- `Omit<Object, Keys>` работает с **объектами**: убирает поля.\n\n```ts\ntype Status = \"idle\" | \"loading\" | \"error\";\ntype Busy = Exclude<Status, \"idle\">; // \"loading\" | \"error\"\n\ntype User = { id: number; name: string; email: string };\ntype Public = Omit<User, \"email\">;   // { id: number; name: string }\n```\n\nВнутри `Omit<T, K>` как раз использует `Exclude`: `Pick<T, Exclude<keyof T, K>>`.",
        "tags": [
          "utility types"
        ]
      },
      {
        "id": "ts-44",
        "front": "Что будет при пересечении типов с конфликтующими полями?",
        "back": "Зависит от того, что конфликтует:\n\n```ts\ntype P = { v: string } & { v: number };\n// объект остаётся, но поле v: string & number = never\n\ntype X = { kind: \"x\" } & { kind: \"y\" };\n// never целиком: литеральные поля-дискриминанты несовместимы\n```\n\nTypeScript сворачивает в `never` весь объект, если конфликтуют литеральные типы (как у дискриминанта в union). Отсюда и разница между `interface extends` (сразу понятная ошибка при конфликте) и `&` (тихий `never`).",
        "tags": [
          "пересечения",
          "never"
        ]
      }
    ]
  },
  {
    "id": "react",
    "title": "React",
    "description": "Рендер, хуки, concurrent-фичи, React 19 и серверные компоненты",
    "color": "cyan",
    "icon": "atom",
    "cards": [
      {
        "id": "react-01",
        "front": "Как работает reconciliation и зачем нужен `key`?",
        "back": "При ререндере React сравнивает новое дерево элементов со старым:\n\n- другой тип элемента → поддерево пересоздаётся;\n- тот же тип → обновляются пропсы.\n\nВ списках `key` сопоставляет элементы между рендерами. Индекс в роли key ломается при вставке, удалении и сортировке: состояние (инпуты, фокус) «переезжает» на чужие элементы. Key должен быть стабильным и уникальным среди соседей.",
        "tags": [
          "reconciliation",
          "key"
        ]
      },
      {
        "id": "react-02",
        "front": "Как сбросить состояние компонента при смене пропса?",
        "back": "Сменить `key` — React размонтирует старый экземпляр и создаст новый с чистым состоянием:\n\n```tsx\n<ProfileForm key={userId} userId={userId} />\n```\n\nЭто лучше, чем `useEffect(() => setForm(initial), [userId])`: эффект сначала покажет устаревшие данные, а потом перерисует.",
        "tags": [
          "key",
          "state"
        ]
      },
      {
        "id": "react-03",
        "front": "Из каких фаз состоит обновление в React? Что вызывает ререндер?",
        "back": "- **Render** — вызов компонентов и построение нового дерева. Чистая фаза, в concurrent-режиме может прерываться.\n- **Commit** — изменения применяются к DOM, затем layout-эффекты, а после отрисовки — обычные эффекты.\n\nРерендер компонента вызывают: изменение его state, **ререндер родителя** (даже если пропсы те же!), изменение используемого контекста.",
        "tags": [
          "рендер"
        ]
      },
      {
        "id": "react-04",
        "front": "`useEffect` против `useLayoutEffect`?",
        "back": "`useEffect` выполняется **после** отрисовки и не блокирует браузер — для запросов, подписок, логирования.\n\n`useLayoutEffect` — синхронно после изменения DOM, но **до** отрисовки: для измерения размеров и позиционирования (тултипы), чтобы не было мигания.\n\nЗлоупотребление `useLayoutEffect` тормозит отрисовку. На сервере он не выполняется.",
        "tags": [
          "хуки",
          "эффекты"
        ]
      },
      {
        "id": "react-05",
        "front": "Что такое устаревшее замыкание (stale closure) в хуках?",
        "back": "Колбэк захватил значения из рендера, в котором был создан:\n\n```tsx\nconst [count, setCount] = useState(0);\n\nuseEffect(() => {\n  const id = setInterval(() => setCount(count + 1), 1000); // count всегда 0\n  return () => clearInterval(id);\n}, []);\n```\n\nРешения: функциональное обновление `setCount((c) => c + 1)`, честные зависимости, `useRef` с последним значением, `useEffectEvent`.",
        "tags": [
          "хуки",
          "замыкания"
        ]
      },
      {
        "id": "react-06",
        "front": "Когда нужны `useMemo`, `useCallback` и `React.memo`?",
        "back": "- `React.memo(Component)` пропускает ререндер, если пропсы поверхностно равны.\n- `useCallback` и `useMemo` сохраняют ссылку на функцию или значение между рендерами.\n\nСсылки нужно сохранять, чтобы memo-компонент не перерисовывался, чтобы эффекты не перезапускались из-за зависимостей и чтобы не пересчитывать дорогие вычисления.\n\nМемоизация не бесплатна, без замеров часто бесполезна. React Compiler делает её автоматически — этот проект собран с ним.",
        "tags": [
          "производительность",
          "memo"
        ]
      },
      {
        "id": "react-07",
        "front": "Что делает React Compiler?",
        "back": "Плагин сборки: анализирует компоненты и **автоматически мемоизирует** значения, колбэки и JSX вместо ручных `useMemo`, `useCallback`, `memo`.\n\nТребует соблюдать правила React: чистые компоненты, никаких мутаций пропсов и state, хуки по правилам. Код, нарушающий правила, компилятор пропускает без оптимизации.",
        "tags": [
          "производительность",
          "compiler"
        ]
      },
      {
        "id": "react-08",
        "front": "Правила хуков. Почему они такие?",
        "back": "Хуки вызываются только на верхнем уровне компонента или своего хука — не в условиях, циклах и не после раннего `return`.\n\nReact хранит состояние хуков **по порядку вызова** в списке у fiber-узла. Если порядок изменится между рендерами, состояния перепутаются.\n\nИсключение — `use()`: его можно вызывать в условиях.",
        "tags": [
          "хуки"
        ]
      },
      {
        "id": "react-09",
        "front": "Для чего нужен `useRef`, кроме доступа к DOM?",
        "back": "Хранить изменяемое значение между рендерами **без ререндера**: id таймера, предыдущее значение, флаг, последний колбэк.\n\nИзменение `ref.current` не вызывает перерисовку, поэтому в ref нельзя держать то, что показываешь на экране. Не читай и не пиши `ref.current` во время рендера (кроме ленивой инициализации).",
        "tags": [
          "хуки",
          "ref"
        ]
      },
      {
        "id": "react-10",
        "front": "Контролируемые и неконтролируемые компоненты?",
        "back": "**Контролируемый** — значение в state React (`value` + `onChange`). Удобно валидировать и преобразовывать на лету.\n\n**Неконтролируемый** — значение хранит DOM (`defaultValue`, чтение через ref или `FormData`). Меньше ререндеров.\n\nReact 19 с `<form action={fn}>` снова сделал неконтролируемые формы удобными. Частая ошибка — `value` меняется с `undefined` на строку, и React предупреждает о смене режима.",
        "tags": [
          "формы"
        ]
      },
      {
        "id": "react-11",
        "front": "Почему не стоит копировать пропсы в state и синхронизировать их через `useEffect`?",
        "back": "Это лишний рендер с устаревшими данными и источник рассинхронизации. Вычисляй прямо в рендере:\n\n```tsx\n// ✗\nconst [full, setFull] = useState(\"\");\nuseEffect(() => setFull(`${first} ${last}`), [first, last]);\n\n// ✓\nconst full = `${first} ${last}`;\n```\n\nДорогое вычисление — в `useMemo`. Нужно сбросить state при смене пропса — меняй `key`.",
        "tags": [
          "state",
          "антипаттерн"
        ]
      },
      {
        "id": "react-12",
        "front": "Какая проблема производительности у Context и как её решить?",
        "back": "Все потребители контекста ререндерятся при **любом** изменении `value`. Если `value` — новый объект на каждом рендере провайдера, они ререндерятся всегда.\n\nРешения:\n\n- мемоизировать `value`;\n- разделить контексты: данные отдельно от экшенов, частые изменения отдельно;\n- держать провайдер ниже в дереве;\n- для часто меняющегося глобального состояния взять стор с селекторами (Zustand, Redux).",
        "tags": [
          "context",
          "производительность"
        ]
      },
      {
        "id": "react-13",
        "front": "Когда `useReducer` лучше `useState`?",
        "back": "Когда следующее состояние сложно зависит от предыдущего, много связанных полей или переходов: формы, мастер шагов, конечный автомат. Логика переходов живёт в чистой функции — её легко тестировать. `dispatch` стабилен, его можно передавать вниз без `useCallback`.\n\n```ts\ntype Action = { type: \"inc\" } | { type: \"set\"; value: number };\n\nfunction reducer(state: number, action: Action) {\n  switch (action.type) {\n    case \"inc\": return state + 1;\n    case \"set\": return action.value;\n  }\n}\n```",
        "tags": [
          "хуки",
          "state"
        ]
      },
      {
        "id": "react-14",
        "front": "Почему state не обновляется сразу после `setState`? Что такое batching?",
        "back": "`setState` только планирует ререндер — в текущем замыкании остаётся старое значение. Несколько вызовов объединяются в один рендер (automatic batching — с React 18 везде: в промисах, таймерах, обработчиках).\n\n```tsx\nsetCount(count + 1);\nsetCount(count + 1); // итог: +1\n\nsetCount((c) => c + 1);\nsetCount((c) => c + 1); // итог: +2\n```",
        "tags": [
          "state",
          "batching"
        ]
      },
      {
        "id": "react-15",
        "front": "Что делают `useTransition` и `useDeferredValue`?",
        "back": "Помечают обновление как **несрочное**: React может прервать его рендер ради срочного ввода.\n\n- `useTransition` — когда ты сам вызываешь setState: `startTransition(() => setTab(next))`, плюс флаг `isPending`.\n- `useDeferredValue(value)` — когда значение пришло извне: отдаёт «отстающую» копию. Тяжёлый список рендерится по ней, а инпут остаётся отзывчивым.\n\nЭто не замена debounce для сетевых запросов.",
        "tags": [
          "concurrent"
        ]
      },
      {
        "id": "react-16",
        "front": "Как работает Suspense?",
        "back": "Компонент «приостанавливается», пока данные или код не готовы (`use()`, `lazy`, фреймворк), и React показывает ближайший `fallback`. Когда всё готово, рендерит снова.\n\nSuspense позволяет декларативно описывать загрузку и стримить HTML с сервера частями. Связка `useEffect` + fetch с Suspense не работает — нужен `use()` или библиотека с поддержкой.",
        "tags": [
          "suspense"
        ]
      },
      {
        "id": "react-17",
        "front": "Как разделить бандл на чанки в React?",
        "back": "Динамический `import()` + `React.lazy` + `Suspense`:\n\n```tsx\nconst Chart = lazy(() => import(\"./Chart\"));\n\n<Suspense fallback={<Spinner />}>\n  <Chart />\n</Suspense>\n```\n\nВ Next.js — `next/dynamic` и автоматическое разделение по маршрутам. Подходит для тяжёлых и редко видимых частей: модалки, графики, редакторы.",
        "tags": [
          "производительность",
          "lazy"
        ]
      },
      {
        "id": "react-18",
        "front": "Что такое Error Boundary и что он **не** ловит?",
        "back": "Классовый компонент с `static getDerivedStateFromError` / `componentDidCatch`: показывает запасной UI при ошибке рендера потомков.\n\n**Не ловит**: ошибки в обработчиках событий, асинхронном коде (таймеры, промисы вне рендера), при SSR и в самом себе.\n\nВ Next.js — файл `error.tsx`. Функциональной версии нет, есть библиотека react-error-boundary.",
        "tags": [
          "ошибки"
        ]
      },
      {
        "id": "react-19",
        "front": "Зачем нужны порталы?",
        "back": "`createPortal(children, domNode)` рендерит в другой DOM-узел (обычно `body`), но в дереве React элемент остаётся на месте: работает контекст, а события **всплывают по React-дереву**.\n\nНужны модалкам, тултипам, тостам — чтобы вырваться из `overflow: hidden` и `z-index` родителя.",
        "tags": [
          "dom",
          "portals"
        ]
      },
      {
        "id": "react-20",
        "front": "Почему в StrictMode эффекты срабатывают дважды?",
        "back": "Только в dev React монтирует, размонтирует и снова монтирует компонент, а рендер вызывает дважды. Так он выявляет нечистые компоненты и эффекты без cleanup.\n\nЕсли двойной вызов что-то ломает (два запроса, двойная подписка) — значит, нет правильной очистки. В продакшене этого нет.",
        "tags": [
          "strict mode",
          "эффекты"
        ]
      },
      {
        "id": "react-21",
        "front": "Как правильно загружать данные в `useEffect`? Что такое race condition?",
        "back": "Ответы могут прийти не по порядку: ответ на старый запрос перезапишет новый.\n\n```tsx\nuseEffect(() => {\n  const controller = new AbortController();\n  fetch(`/api/user/${id}`, { signal: controller.signal })\n    .then((r) => r.json())\n    .then(setUser)\n    .catch(() => {});\n  return () => controller.abort();\n}, [id]);\n```\n\nВ продакшене обычно берут TanStack Query или SWR (кэш, дедупликация, повторы) либо серверные компоненты.",
        "tags": [
          "эффекты",
          "данные"
        ]
      },
      {
        "id": "react-22",
        "front": "Для чего нужен `useSyncExternalStore`?",
        "back": "Подписка на внешний источник данных (стор, `matchMedia`, `navigator.onLine`, localStorage) без «разрывов» (tearing) в concurrent-режиме.\n\n```ts\nconst online = useSyncExternalStore(\n  (cb) => {\n    addEventListener(\"online\", cb);\n    addEventListener(\"offline\", cb);\n    return () => {\n      removeEventListener(\"online\", cb);\n      removeEventListener(\"offline\", cb);\n    };\n  },\n  () => navigator.onLine, // снимок на клиенте\n  () => true,             // снимок на сервере\n);\n```\n\nНа нём построены Zustand и react-redux.",
        "tags": [
          "хуки",
          "store"
        ]
      },
      {
        "id": "react-23",
        "front": "Что такое React Server Components? Чем они отличаются от SSR?",
        "back": "**Серверные компоненты** выполняются только на сервере: могут быть `async`, ходить в БД, их код не попадает в бандл. **Клиентские** (`\"use client\"`) интерактивны: state, эффекты, обработчики.\n\n**SSR** — рендер **любых** компонентов в HTML для первой загрузки с последующей гидратацией. RSC — модель, где часть дерева **никогда** не гидратируется.\n\nСерверный компонент может рендерить клиентский. Клиентский импортировать серверный не может — только получить его через `children`.",
        "tags": [
          "rsc",
          "next"
        ]
      },
      {
        "id": "react-24",
        "front": "Что означает `\"use client\"` и где проводить границу?",
        "back": "Директива помечает **точку входа** в клиентский бандл: этот модуль и всё, что он импортирует, становится клиентским.\n\nДержи границу как можно ниже — на интерактивных «листьях» (кнопка, форма), а страницы и разметку оставляй серверными. Пропсы через границу должны сериализоваться: функции передавать нельзя (кроме Server Actions).",
        "tags": [
          "rsc",
          "next"
        ]
      },
      {
        "id": "react-25",
        "front": "Что такое гидратация и откуда берётся hydration mismatch?",
        "back": "**Гидратация** — React «оживляет» HTML с сервера: навешивает обработчики, сверяя дерево.\n\n**Mismatch** — клиент отрисовал не то, что сервер: `Date.now()`, `Math.random()`, `window` или `localStorage` в рендере, разная локаль дат, неверная вложенность тегов (`<div>` внутри `<p>`).\n\nРешения: одинаковые данные, браузерные API — в эффекте или в `useSyncExternalStore` с серверным снимком, точечно — `suppressHydrationWarning`.",
        "tags": [
          "ssr",
          "гидратация"
        ]
      },
      {
        "id": "react-26",
        "front": "Что нового в React 19 для форм (Actions)?",
        "back": "- `<form action={fn}>` принимает функцию (в том числе async), которая получает `FormData`.\n- `useActionState(action, initial)` → `[state, formAction, isPending]`.\n- `useFormStatus()` — статус ближайшей формы, удобно для кнопки.\n- `useOptimistic` — показывает результат до ответа сервера и откатывает при ошибке.\n\nВ Next.js эти функции могут быть Server Actions (`\"use server\"`).",
        "tags": [
          "react 19",
          "формы"
        ]
      },
      {
        "id": "react-27",
        "front": "Что делает хук `use()` в React 19?",
        "back": "Читает значение промиса (через Suspense) или контекста. В отличие от других хуков, его можно вызывать в условиях и циклах.\n\n```tsx\nfunction Comments({ promise }: { promise: Promise<Comment[]> }) {\n  const comments = use(promise); // приостановит рендер до резолва\n  return comments.map((c) => <p key={c.id}>{c.text}</p>);\n}\n```\n\nПромис нельзя создавать прямо в рендере клиентского компонента — он будет новым каждый раз. Его передают с сервера или берут из кэша.",
        "tags": [
          "react 19",
          "хуки"
        ]
      },
      {
        "id": "react-28",
        "front": "Как передать ref в свой компонент в React 19?",
        "back": "`ref` теперь обычный проп у функциональных компонентов — `forwardRef` не нужен:\n\n```tsx\nfunction Input({ ref, ...props }: React.ComponentProps<\"input\">) {\n  return <input ref={ref} {...props} />;\n}\n```\n\nRef-колбэк теперь может вернуть функцию очистки. `useImperativeHandle` — если наружу нужно отдать не DOM-узел, а свой API (`focus`, `reset`).",
        "tags": [
          "react 19",
          "ref"
        ]
      },
      {
        "id": "react-29",
        "front": "Что такое кастомный хук? Делят ли компоненты его состояние?",
        "back": "Функция с именем `use…`, которая вызывает другие хуки. Это способ переиспользовать **логику**, а не состояние: каждый вызов хука получает своё независимое состояние.\n\nЧтобы делить данные, нужно поднять state выше, использовать контекст или внешний стор.",
        "tags": [
          "хуки"
        ]
      },
      {
        "id": "react-30",
        "front": "Как избежать prop drilling без контекста?",
        "back": "Композицией: передавать готовые элементы через `children` или слоты, чтобы промежуточные компоненты ничего не знали о данных.\n\n```tsx\n<Layout sidebar={<UserMenu user={user} />}>\n  <Feed user={user} />\n</Layout>\n```\n\nЕщё помогает перенос состояния ближе к месту использования. Контекст оставь для действительно глобального: тема, пользователь, локаль.",
        "tags": [
          "архитектура",
          "композиция"
        ]
      },
      {
        "id": "react-31",
        "front": "Как отрендерить список из 10 000 элементов без тормозов?",
        "back": "**Виртуализация** — рендерить только видимые строки с небольшим запасом, остальное заменять отступами (TanStack Virtual, react-window).\n\nПлюс стабильные `key`, `memo` для строк, пагинация или бесконечная подгрузка. В простых случаях хватает CSS `content-visibility: auto` — браузер пропускает отрисовку невидимого.",
        "tags": [
          "производительность",
          "списки"
        ]
      },
      {
        "id": "react-32",
        "front": "Что такое Fiber?",
        "back": "Внутренняя архитектура React с 16-й версии. Каждый компонент — узел fiber: тип, пропсы, state, ссылки на родителя, ребёнка и соседа.\n\nРабота рендера разбита на единицы, которые можно **прерывать, приоритизировать и возобновлять** — на этом построены transitions и Suspense. Деревьев два: текущее и рабочее (double buffering).",
        "tags": [
          "fiber",
          "внутренности"
        ]
      },
      {
        "id": "react-33",
        "front": "Что такое `useEffectEvent`?",
        "back": "(React 19.2) Хук для «событий» внутри эффекта. Функция всегда видит свежие пропсы и state, но **не является зависимостью** эффекта.\n\n```tsx\nconst onConnected = useEffectEvent(() => showToast(theme));\n\nuseEffect(() => {\n  const conn = connect(roomId);\n  conn.on(\"connected\", onConnected);\n  return () => conn.disconnect();\n}, [roomId]); // смена theme не переподключает чат\n```",
        "tags": [
          "хуки",
          "эффекты",
          "react 19"
        ]
      },
      {
        "id": "react-34",
        "front": "В каком порядке вызываются рендер и эффекты у родителя и ребёнка?",
        "back": "- **Рендер** — сверху вниз: сначала родитель, потом дети.\n- **Эффекты** — снизу вверх: сначала у детей, потом у родителя. Сначала все `useLayoutEffect` (до отрисовки), потом все `useEffect`.\n\n```\nparent render → child render →\nchild layout → parent layout →\nchild effect → parent effect\n```\n\nПоэтому в эффекте родителя DOM детей уже готов, а ref на дочерний элемент заполнен.",
        "tags": [
          "эффекты",
          "порядок"
        ]
      },
      {
        "id": "react-35",
        "front": "Что отрендерит `{count && <Badge />}`, если `count = 0`?",
        "back": "Отрендерит **`0`** прямо на странице. `&&` возвращает первый falsy-операнд, а React рисует числа (в отличие от `false`, `null` и `undefined`).\n\n```tsx\n{count && <Badge />}       // при 0 покажет «0»\n{count > 0 && <Badge />}   // ✓\n{!!count && <Badge />}     // ✓\n{count ? <Badge /> : null} // ✓\n```\n\nВ React Native это ещё и падение: текст вне `<Text>`.",
        "tags": [
          "рендер",
          "ловушка"
        ]
      },
      {
        "id": "react-36",
        "front": "Чем отличаются `useState(compute())` и `useState(() => compute())`?",
        "back": "Начальное значение нужно только при первом рендере, но выражение в скобках вычисляется **при каждом** рендере:\n\n```tsx\nuseState(expensive());       // expensive вызывается на каждом рендере\nuseState(() => expensive()); // только при монтировании — ленивая инициализация\nuseState(expensive);         // то же самое: передаём саму функцию\n```\n\nЭто важно для тяжёлых вычислений и чтения из `localStorage`. С `useRef` ленивой формы нет — там инициализируют через `if (ref.current === null)`.",
        "tags": [
          "state",
          "производительность"
        ]
      },
      {
        "id": "react-37",
        "front": "Почему `React.memo` не помогает компоненту, который принимает `children`?",
        "back": "JSX `<Box><span>hi</span></Box>` при каждом рендере родителя создаёт **новый объект** элемента в `children`. Поверхностное сравнение пропсов видит новую ссылку — memo каждый раз пропускает рендер дальше.\n\nТо же с инлайн-объектами и функциями в пропсах: `style={{…}}`, `onClick={() => …}`.\n\nЧто делать: мемоизировать передаваемые значения (`useMemo`, `useCallback`) — или вовсе не полагаться на memo, а перестроить дерево (см. «перенос состояния вниз»).",
        "tags": [
          "memo",
          "ловушка"
        ]
      },
      {
        "id": "react-38",
        "front": "Как избежать лишних ререндеров без `memo`?",
        "back": "Два приёма композиции:\n\n**1. Перенести состояние вниз** — в компонент, которому оно реально нужно:\n\n```tsx\n// ✗ ввод в поле ререндерит всю страницу\nfunction Page() {\n  const [q, setQ] = useState(\"\");\n  return <><input value={q} onChange={(e) => setQ(e.target.value)} /><HeavyList /></>;\n}\n// ✓ состояние живёт в SearchBox, HeavyList не трогается\n```\n\n**2. Поднять содержимое через `children`**:\n\n```tsx\nfunction ScrollTracker({ children }: { children: React.ReactNode }) {\n  const [y, setY] = useState(0);\n  // … слушаем скролл и обновляем y\n  return <div data-y={y}>{children}</div>;\n}\n// <ScrollTracker><HeavyList /></ScrollTracker>\n```\n\n`children` создан родителем выше, поэтому при изменении `y` React его не перерисовывает.",
        "tags": [
          "производительность",
          "композиция"
        ]
      },
      {
        "id": "react-39",
        "front": "Почему эффект с объектом в зависимостях срабатывает на каждом рендере?",
        "back": "Зависимости сравниваются через `Object.is`, то есть **по ссылке**. Объект или массив, созданный в рендере, — новый каждый раз:\n\n```tsx\nconst options = { roomId, serverUrl }; // новый объект на каждом рендере\nuseEffect(() => {\n  const conn = connect(options);\n  return () => conn.disconnect();\n}, [options]); // переподключение после каждого рендера\n```\n\nРешения: класть в зависимости примитивы (`[roomId, serverUrl]`) и создавать объект внутри эффекта, вынести константу из компонента или мемоизировать её через `useMemo`.",
        "tags": [
          "эффекты",
          "зависимости"
        ]
      },
      {
        "id": "react-40",
        "front": "Для чего нужен `useId`?",
        "back": "Генерирует **стабильный уникальный id**, одинаковый на сервере и клиенте — без расхождений при гидратации. Нужен для связки элементов через атрибуты доступности:\n\n```tsx\nfunction Field({ label }: { label: string }) {\n  const id = useId();\n  return (\n    <>\n      <label htmlFor={id}>{label}</label>\n      <input id={id} aria-describedby={`${id}-hint`} />\n      <p id={`${id}-hint`}>Подсказка</p>\n    </>\n  );\n}\n```\n\nНе для `key` в списках — ключи берут из данных.",
        "tags": [
          "хуки",
          "доступность"
        ]
      },
      {
        "id": "react-41",
        "front": "Как сделать отложенный поиск (debounce) при вводе?",
        "back": "Кастомный хук, который возвращает значение с задержкой:\n\n```tsx\nfunction useDebounce<T>(value: T, ms = 300) {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), ms);\n    return () => clearTimeout(id); // новое значение сбрасывает таймер\n  }, [value, ms]);\n  return debounced;\n}\n\nconst [query, setQuery] = useState(\"\");\nconst debouncedQuery = useDebounce(query);\n// запрос делаем по debouncedQuery\n```\n\n`useDeferredValue` — про другое: он не уменьшает число запросов, а откладывает тяжёлый **рендер** ради отзывчивости ввода.",
        "tags": [
          "хуки",
          "debounce"
        ]
      },
      {
        "id": "react-42",
        "front": "Что такое HOC и render props? Почему их почти вытеснили хуки?",
        "back": "- **HOC** — функция, которая принимает компонент и возвращает новый с добавленной логикой: `withAuth(Profile)`.\n- **Render props** — компонент вызывает функцию из пропса, передавая ей данные: `<Mouse>{(pos) => <Cursor {...pos} />}</Mouse>`.\n\nОба способа переиспользуют логику, но порождают «ад обёрток» в дереве, конфликты имён пропсов и неявные зависимости. Хуки делают то же короче и явно: `const pos = useMouse()`.\n\nHOC ещё встречаются в библиотеках (`connect` в старом Redux, `observer` в MobX).",
        "tags": [
          "паттерны"
        ]
      },
      {
        "id": "react-43",
        "front": "Как тестировать React-компоненты? Принципы Testing Library.",
        "back": "Тестировать **поведение**, а не реализацию: что видит и делает пользователь, а не state и внутренние методы.\n\n```tsx\nrender(<LoginForm onSubmit={onSubmit} />);\nawait userEvent.type(screen.getByLabelText(\"Email\"), \"a@b.c\");\nawait userEvent.click(screen.getByRole(\"button\", { name: \"Войти\" }));\nexpect(onSubmit).toHaveBeenCalledWith({ email: \"a@b.c\" });\n```\n\n- Искать элементы как пользователь: `getByRole`, `getByLabelText`, `getByText`; `data-testid` — крайний случай.\n- `userEvent` реалистичнее, чем `fireEvent`.\n- Асинхронное ждать через `findBy…` и `waitFor`.\n- Сеть мокать на уровне запросов (MSW), а не подменять модули.",
        "tags": [
          "тестирование"
        ]
      },
      {
        "id": "react-44",
        "front": "Почему нельзя вызывать `setState` прямо в теле компонента?",
        "back": "Обновление state во время рендера запускает новый рендер, в котором снова вызывается `setState`, — бесконечный цикл (React остановит его ошибкой «Too many re-renders»).\n\n```tsx\nfunction Bad() {\n  const [n, setN] = useState(0);\n  setN(n + 1); // ✗ бесконечный цикл\n  return <p>{n}</p>;\n}\n```\n\n`setState` вызывают в обработчиках событий и эффектах. Исключение — подстройка state под изменившийся проп с условием, которое перестанет выполняться, но обычно лучше вычислить значение в рендере или сменить `key`.",
        "tags": [
          "state",
          "антипаттерн"
        ]
      },
      {
        "id": "react-45",
        "front": "Должны ли ключи быть уникальны глобально? Как задать key для Fragment?",
        "back": "Ключ должен быть уникален только **среди соседей** в одном списке — в разных списках ключи могут совпадать.\n\nЕсли элемент списка — это несколько узлов без обёртки, используют полную форму `Fragment` (короткая `<>` ключ не принимает):\n\n```tsx\nimport { Fragment } from \"react\";\n\n{terms.map((t) => (\n  <Fragment key={t.id}>\n    <dt>{t.word}</dt>\n    <dd>{t.meaning}</dd>\n  </Fragment>\n))}\n```\n\nКлюч не передаётся в компонент как проп: если id нужен внутри, передай его отдельно.",
        "tags": [
          "списки",
          "key"
        ]
      }
    ]
  },
  {
    "id": "state",
    "title": "Redux и Zustand",
    "description": "Стейт-менеджеры с самых основ — зачем, как устроены, что выбрать",
    "color": "fuchsia",
    "icon": "boxes",
    "cards": [
      {
        "id": "state-01",
        "front": "Зачем нужен стейт-менеджер, если есть `useState` и Context?",
        "back": "`useState` — локальное состояние компонента. Когда одни данные нужны многим далёким компонентам, приходится пробрасывать пропсы или класть всё в Context. Но Context ререндерит всех потребителей при любом изменении.\n\nСтейт-менеджер хранит состояние **вне React**. Компоненты подписываются на нужные кусочки через селекторы и перерисовываются только при их изменении.\n\nЕщё плюсы: логика отделена от UI, есть devtools и persist.",
        "tags": [
          "основы"
        ]
      },
      {
        "id": "state-02",
        "front": "Чем серверное состояние отличается от клиентского? Где хранить данные из API?",
        "back": "**Клиентское** принадлежит UI: открыта ли модалка, тема, черновик формы.\n\n**Серверное** — копия данных с сервера. Оно может устареть и требует кэша, повторных запросов и инвалидации. Его лучше отдать TanStack Query, RTK Query или SWR, а не хранить вручную в Redux/Zustand.\n\nВ сторе остаётся только по-настоящему клиентское состояние.",
        "tags": [
          "основы",
          "server state"
        ]
      },
      {
        "id": "state-03",
        "front": "Три принципа Redux.",
        "back": "1. **Единый источник правды** — всё состояние в одном сторе.\n2. **Состояние только для чтения** — изменить его можно только отправкой action (объект `{ type, payload }`).\n3. **Изменения — чистыми функциями**: reducer `(state, action) => newState` без мутаций и побочных эффектов.\n\nПоток: UI → `dispatch(action)` → reducer → новый state → подписчики перерисовываются.",
        "tags": [
          "redux",
          "основы"
        ]
      },
      {
        "id": "state-04",
        "front": "Что такое action, reducer, dispatch и store?",
        "back": "- **Action** — описание события: `{ type: \"todos/added\", payload: \"Купить молоко\" }`.\n- **Reducer** — чистая функция, которая возвращает новое состояние.\n- **Dispatch** — метод стора, отправляющий action в reducer.\n- **Store** — объект, который хранит state и даёт `getState`, `dispatch`, `subscribe`.\n\n```ts\nfunction todos(state: string[] = [], action: { type: string; payload: string }) {\n  switch (action.type) {\n    case \"todos/added\":\n      return [...state, action.payload];\n    default:\n      return state;\n  }\n}\n```",
        "tags": [
          "redux",
          "основы"
        ]
      },
      {
        "id": "state-05",
        "front": "Что такое Redux Toolkit и `createSlice`?",
        "back": "RTK — официальный способ писать Redux без бойлерплейта. `createSlice` генерирует reducer и action creators из одного объекта:\n\n```ts\nconst todosSlice = createSlice({\n  name: \"todos\",\n  initialState: [] as Todo[],\n  reducers: {\n    added(state, action: PayloadAction<string>) {\n      // «мутация» разрешена — внутри Immer\n      state.push({ id: nanoid(), text: action.payload, done: false });\n    },\n    toggled(state, action: PayloadAction<string>) {\n      const todo = state.find((t) => t.id === action.payload);\n      if (todo) todo.done = !todo.done;\n    },\n  },\n});\n\nexport const { added, toggled } = todosSlice.actions;\n```",
        "tags": [
          "redux",
          "rtk"
        ]
      },
      {
        "id": "state-06",
        "front": "Почему в `createSlice` можно «мутировать» state?",
        "back": "RTK оборачивает редьюсеры в **Immer**. Ты меняешь черновик (Proxy), Immer записывает изменения и создаёт новый неизменяемый объект. Неизменённые ветки сохраняют прежние ссылки.\n\nПравило: либо мутируй черновик, либо **возвращай** новое значение — но не то и другое сразу. Вне Immer мутации по-прежнему ломают Redux.",
        "tags": [
          "redux",
          "immer"
        ]
      },
      {
        "id": "state-07",
        "front": "Как подключить Redux Toolkit к React с типизацией?",
        "back": "```ts\nexport const store = configureStore({\n  reducer: { todos: todosSlice.reducer },\n});\n\nexport type RootState = ReturnType<typeof store.getState>;\nexport type AppDispatch = typeof store.dispatch;\n\nexport const useAppSelector = useSelector.withTypes<RootState>();\nexport const useAppDispatch = useDispatch.withTypes<AppDispatch>();\n```\n\nВ корне — `<Provider store={store}>`. В компоненте: `useAppSelector((s) => s.todos)` и `dispatch(added(\"…\"))`. `configureStore` сам подключает devtools и thunk.",
        "tags": [
          "redux",
          "rtk",
          "typescript"
        ]
      },
      {
        "id": "state-08",
        "front": "Что такое селектор и зачем мемоизировать селекторы?",
        "back": "Селектор — функция `state => часть`. `useSelector` ререндерит компонент, когда результат селектора изменился **по ссылке**.\n\nЕсли селектор каждый раз создаёт новый массив (`state.todos.filter(…)`), компонент перерисовывается при любом изменении стора. `createSelector` (Reselect) кэширует результат, пока входные данные те же:\n\n```ts\nconst selectDone = createSelector(\n  [(s: RootState) => s.todos],\n  (todos) => todos.filter((t) => t.done),\n);\n```",
        "tags": [
          "redux",
          "селекторы"
        ]
      },
      {
        "id": "state-09",
        "front": "Как делать асинхронные операции в Redux? Что такое thunk?",
        "back": "Редьюсеры синхронные и чистые, поэтому асинхронность выносят в middleware. **Thunk** — функция, которую можно отправить в `dispatch`; она получает `dispatch` и `getState`.\n\nВ RTK есть `createAsyncThunk` — он генерирует экшены `pending`, `fulfilled`, `rejected`:\n\n```ts\nexport const fetchTodos = createAsyncThunk(\"todos/fetch\", async () => {\n  const res = await fetch(\"/api/todos\");\n  return (await res.json()) as Todo[];\n});\n\n// в extraReducers:\n// builder.addCase(fetchTodos.fulfilled, (state, action) => action.payload)\n```",
        "tags": [
          "redux",
          "async"
        ]
      },
      {
        "id": "state-10",
        "front": "Что такое middleware в Redux?",
        "back": "Прослойка между `dispatch` и редьюсером: `store => next => action => { … }`.\n\nМожет логировать, менять, задерживать или отменять экшены и выполнять побочные эффекты. Примеры: thunk, логгер, аналитика, `listenerMiddleware` в RTK, RTK Query.",
        "tags": [
          "redux",
          "middleware"
        ]
      },
      {
        "id": "state-11",
        "front": "Что такое RTK Query?",
        "back": "Слой загрузки данных в Redux Toolkit, аналог TanStack Query. Описываешь эндпоинты — получаешь хуки с кэшем, дедупликацией, статусами загрузки и инвалидацией по тегам:\n\n```ts\nconst api = createApi({\n  baseQuery: fetchBaseQuery({ baseUrl: \"/api\" }),\n  tagTypes: [\"Todo\"],\n  endpoints: (b) => ({\n    getTodos: b.query<Todo[], void>({\n      query: () => \"todos\",\n      providesTags: [\"Todo\"],\n    }),\n    addTodo: b.mutation<Todo, string>({\n      query: (text) => ({ url: \"todos\", method: \"POST\", body: { text } }),\n      invalidatesTags: [\"Todo\"], // после добавления список перезапросится\n    }),\n  }),\n});\n\nexport const { useGetTodosQuery, useAddTodoMutation } = api;\n```",
        "tags": [
          "redux",
          "rtk query"
        ]
      },
      {
        "id": "state-12",
        "front": "Как создать стор в Zustand?",
        "back": "Стор — это хук. Состояние и экшены лежат вместе, Provider не нужен:\n\n```ts\nimport { create } from \"zustand\";\n\ntype Bears = { bears: number; add: () => void; reset: () => void };\n\nexport const useBears = create<Bears>()((set) => ({\n  bears: 0,\n  add: () => set((s) => ({ bears: s.bears + 1 })),\n  reset: () => set({ bears: 0 }),\n}));\n\n// в компоненте\nconst bears = useBears((s) => s.bears);\nconst add = useBears((s) => s.add);\n```\n\nДвойные скобки `create<T>()(…)` нужны, чтобы TS вывел типы для middleware.",
        "tags": [
          "zustand",
          "основы"
        ]
      },
      {
        "id": "state-13",
        "front": "Как работает `set` в Zustand? Нужно ли копировать всё состояние?",
        "back": "`set` делает **поверхностное слияние** верхнего уровня: `set({ bears: 1 })` не трогает остальные поля. Вложенные объекты сливают вручную:\n\n```ts\nset((s) => ({ user: { ...s.user, name } }));\n```\n\n- `set(state, true)` — полная замена состояния;\n- `get()` внутри экшена читает текущее состояние без подписки;\n- мутировать нельзя, если не подключён middleware `immer`.",
        "tags": [
          "zustand",
          "основы"
        ]
      },
      {
        "id": "state-14",
        "front": "Почему в Zustand важны селекторы? Что такое `useShallow`?",
        "back": "`useStore()` без селектора подписывает компонент на **всё** состояние — ререндер при любом изменении. Селектор `useStore((s) => s.bears)` подписывает только на нужное.\n\nЕсли селектор возвращает новый объект или массив, сравнение по ссылке всегда видит изменение. Тогда нужен `useShallow`:\n\n```ts\nimport { useShallow } from \"zustand/react/shallow\";\n\nconst { bears, add } = useBears(\n  useShallow((s) => ({ bears: s.bears, add: s.add })),\n);\n```\n\nВ Zustand 5 новый объект из селектора без `useShallow` может вызвать бесконечный цикл ререндеров.",
        "tags": [
          "zustand",
          "селекторы"
        ]
      },
      {
        "id": "state-15",
        "front": "Как сохранить Zustand-стор между перезагрузками?",
        "back": "Middleware `persist`:\n\n```ts\nexport const useSettings = create<Settings>()(\n  persist(\n    (set) => ({ theme: \"dark\", setTheme: (theme) => set({ theme }) }),\n    {\n      name: \"settings\",                                // ключ в хранилище\n      storage: createJSONStorage(() => localStorage),\n      partialize: (s) => ({ theme: s.theme }),        // что сохранять\n      version: 1,                                      // + migrate при смене формата\n    },\n  ),\n);\n```\n\nС асинхронным хранилищем (IndexedDB) стор восстанавливается не сразу, поэтому нужен флаг готовности. Так сделано в этом приложении.",
        "tags": [
          "zustand",
          "persist"
        ]
      },
      {
        "id": "state-16",
        "front": "Как читать и менять Zustand-стор вне компонентов?",
        "back": "Хук — это ещё и объект стора с API:\n\n```ts\nuseBears.getState().add();        // вызвать экшен\nuseBears.setState({ bears: 10 }); // записать\n\nconst unsubscribe = useBears.subscribe((s) => console.log(s.bears));\n```\n\nУдобно в утилитах, тестах, обработчиках WebSocket.",
        "tags": [
          "zustand"
        ]
      },
      {
        "id": "state-17",
        "front": "Как организовать большой Zustand-стор и подключить devtools?",
        "back": "Два пути: делить на **слайсы** (функции, возвращающие часть состояния) и собирать их в одном `create` — или заводить несколько независимых сторов по доменам. Второе обычно проще.\n\nDevtools — middleware `devtools`, работает с расширением Redux DevTools:\n\n```ts\nconst useApp = create<State>()(\n  devtools(\n    persist(\n      (...a) => ({ ...createUserSlice(...a), ...createCartSlice(...a) }),\n      { name: \"app\" },\n    ),\n  ),\n);\n```",
        "tags": [
          "zustand",
          "архитектура"
        ]
      },
      {
        "id": "state-18",
        "front": "Redux Toolkit, Zustand или Context — что выбрать?",
        "back": "- **Context** — редко меняющиеся данные (тема, локаль, текущий пользователь), без библиотек.\n- **Zustand** — простой глобальный клиентский стейт: минимум кода, без Provider, точечные подписки.\n- **Redux Toolkit** — большие команды и приложения: строгий однонаправленный поток, devtools с time-travel, middleware, RTK Query, устоявшиеся паттерны.\n\nСерверные данные в любом случае — в TanStack Query или RTK Query.",
        "tags": [
          "сравнение"
        ]
      },
      {
        "id": "state-19",
        "front": "Как Redux и Zustand понимают, что состояние изменилось?",
        "back": "Сравнением **по ссылке** (`Object.is`) — это дёшево. Поэтому изменение должно создавать новые объекты на пути к изменённому полю, а неизменённые части — сохранять старые ссылки, чтобы их селекторы не срабатывали.\n\nМутация «на месте» ссылку не меняет — подписчики не узнают об изменении.",
        "tags": [
          "иммутабельность"
        ]
      },
      {
        "id": "state-20",
        "front": "Что такое однонаправленный поток данных?",
        "back": "Данные движутся по кругу в одну сторону: **state → view → action → новый state**. Представление не меняет состояние напрямую, а только сообщает о событиях. Поэтому изменения предсказуемы и их легко отследить.\n\nЭто архитектура Flux, из которой вырос Redux. В самом React так же: пропсы идут вниз, события — вверх через колбэки.",
        "tags": [
          "архитектура"
        ]
      },
      {
        "id": "state-21",
        "front": "Нужно ли хранить в сторе вычисляемые данные (сумму корзины, отфильтрованный список)?",
        "back": "Обычно **нет**. Хранят минимальное исходное состояние, а производное вычисляют в селекторе:\n\n```ts\nconst useCart = create<Cart>()((set) => ({\n  items: [],\n  add: (item) => set((s) => ({ items: [...s.items, item] })),\n}));\n\n// в компоненте\nconst total = useCart((s) => s.items.reduce((sum, i) => sum + i.price * i.qty, 0));\n```\n\nИначе придётся синхронизировать `items` и `total` при каждом изменении, и рано или поздно они разъедутся. Число — примитив, поэтому такой селектор не вызывает лишних ререндеров. Если селектор возвращает новый массив, нужен `useShallow` или мемоизация.",
        "tags": [
          "zustand",
          "производные данные"
        ]
      },
      {
        "id": "state-22",
        "front": "Как писать «мутирующие» обновления в Zustand, как в Redux Toolkit?",
        "back": "Подключить middleware `immer` (нужен пакет `immer`):\n\n```ts\nimport { create } from \"zustand\";\nimport { immer } from \"zustand/middleware/immer\";\n\nconst useTodos = create<State>()(\n  immer((set) => ({\n    todos: [],\n    toggle: (id) =>\n      set((s) => {\n        const todo = s.todos.find((t) => t.id === id);\n        if (todo) todo.done = !todo.done; // мутируем черновик\n      }),\n  })),\n);\n```\n\nБез него для вложенных изменений приходится вручную копировать каждый уровень через spread.",
        "tags": [
          "zustand",
          "immer"
        ]
      },
      {
        "id": "state-23",
        "front": "Почему глобальный Zustand-стор опасен в Next.js с SSR и как быть?",
        "back": "Модуль со стором загружается на сервере **один раз** и живёт между запросами. Если записать в него данные пользователя при рендере, следующий запрос другого пользователя увидит чужое состояние.\n\nРешение — создавать стор **на каждый запрос** через фабрику и раздавать его через контекст:\n\n```tsx\nimport { createStore, useStore } from \"zustand\";\n\nconst createCounterStore = (init = 0) =>\n  createStore<{ count: number; inc: () => void }>()((set) => ({\n    count: init,\n    inc: () => set((s) => ({ count: s.count + 1 })),\n  }));\n\nconst StoreContext = createContext<ReturnType<typeof createCounterStore> | null>(null);\n\nexport function CounterProvider({ children }: { children: React.ReactNode }) {\n  const [store] = useState(() => createCounterStore());\n  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;\n}\n```\n\nВ компоненте: `useStore(store, (s) => s.count)`. Клиентские SPA без SSR этой проблемы не имеют.",
        "tags": [
          "zustand",
          "next",
          "ssr"
        ]
      },
      {
        "id": "state-24",
        "front": "Почему в Redux нельзя класть в state и actions несериализуемые значения?",
        "back": "Функции, промисы, `Map`, `Set`, экземпляры классов, DOM-узлы ломают:\n\n- devtools и time-travel — их нельзя показать и восстановить;\n- сохранение state (persist) и SSR-гидратацию;\n- сравнение по ссылке и предсказуемость обновлений.\n\nRedux Toolkit по умолчанию включает в dev-режиме `serializableCheck` middleware: он предупреждает о таких значениях. Даты обычно хранят как ISO-строки или timestamp.",
        "tags": [
          "redux",
          "сериализуемость"
        ]
      },
      {
        "id": "state-25",
        "front": "Что такое нормализация state и `createEntityAdapter`?",
        "back": "Вместо вложенных массивов хранят сущности как **таблицу**: `{ ids: [...], entities: { [id]: item } }`. Поиск по id становится O(1), обновление одной сущности не требует обхода массива, а дубликатов в разных местах дерева нет.\n\nRTK даёт готовый адаптер:\n\n```ts\nconst postsAdapter = createEntityAdapter<Post>();\n\nconst postsSlice = createSlice({\n  name: \"posts\",\n  initialState: postsAdapter.getInitialState(),\n  reducers: {\n    added: postsAdapter.addOne,\n    updated: postsAdapter.updateOne,\n    removed: postsAdapter.removeOne,\n  },\n});\n\nexport const { selectAll, selectById } = postsAdapter.getSelectors((s: RootState) => s.posts);\n```",
        "tags": [
          "redux",
          "нормализация"
        ]
      },
      {
        "id": "state-26",
        "front": "Как устроен TanStack Query? Чем `staleTime` отличается от `gcTime`?",
        "back": "Кэш серверных данных по ключу запроса:\n\n```tsx\nconst { data, isPending, error } = useQuery({\n  queryKey: [\"todos\", { page }], // при смене ключа — новый запрос\n  queryFn: () => fetchTodos(page),\n  staleTime: 60_000,\n});\n```\n\n- `staleTime` (по умолчанию **0**) — сколько данные считаются свежими. Пока свежие, повторного запроса нет. Устаревшие показываются мгновенно из кэша, но перезапрашиваются в фоне: при монтировании, фокусе окна, восстановлении сети.\n- `gcTime` (по умолчанию **5 минут**; в v4 назывался `cacheTime`) — сколько хранить в памяти данные, на которые никто не подписан.\n\nДедупликация: несколько компонентов с одним ключом делают один запрос.",
        "tags": [
          "tanstack query"
        ]
      },
      {
        "id": "state-27",
        "front": "Как обновить данные после мутации в TanStack Query?",
        "back": "Чаще всего — **инвалидировать** связанные запросы, чтобы они перезапросились:\n\n```tsx\nconst queryClient = useQueryClient();\n\nconst addTodo = useMutation({\n  mutationFn: (text: string) => api.post(\"/todos\", { text }),\n  onSuccess: () => queryClient.invalidateQueries({ queryKey: [\"todos\"] }),\n});\n```\n\n`invalidateQueries` по префиксу ключа задевает и `[\"todos\", { page: 2 }]`.\n\nЕсли ответ мутации уже содержит новые данные — `queryClient.setQueryData(key, …)` без лишнего запроса. Для мгновенного UI — оптимистичное обновление в `onMutate` с откатом в `onError`.",
        "tags": [
          "tanstack query",
          "мутации"
        ]
      },
      {
        "id": "state-28",
        "front": "Что такое атомарный стейт-менеджмент (Jotai) и чем он отличается от стора?",
        "back": "Вместо одного большого стора — множество маленьких независимых **атомов**, которые можно комбинировать:\n\n```ts\nconst countAtom = atom(0);\nconst doubledAtom = atom((get) => get(countAtom) * 2); // производный атом\n\nfunction Counter() {\n  const [count, setCount] = useAtom(countAtom);\n  const doubled = useAtomValue(doubledAtom);\n}\n```\n\nПодписка точечная: компонент перерисуется, только если изменился его атом. Модель похожа на `useState`, но общий для всего приложения.\n\nСравнение: **Zustand** и **Redux** — «сверху вниз» (один стор, селекторы), **Jotai** — «снизу вверх» (атомы и зависимости между ними).",
        "tags": [
          "атомы",
          "jotai"
        ]
      }
    ]
  },
  {
    "id": "sql",
    "title": "SQL и PostgreSQL",
    "description": "Запросы, индексы, транзакции и то, что спрашивают про PostgreSQL",
    "color": "green",
    "icon": "database",
    "cards": [
      {
        "id": "sql-01",
        "front": "Какие бывают JOIN?",
        "back": "- `INNER JOIN` — только строки с совпадением в обеих таблицах.\n- `LEFT JOIN` — все строки левой + совпадения справа (иначе `NULL`).\n- `RIGHT JOIN` — наоборот.\n- `FULL JOIN` — все строки обеих.\n- `CROSS JOIN` — декартово произведение.\n\n```sql\n-- пользователи без заказов\nSELECT u.*\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nWHERE o.id IS NULL;\n```",
        "tags": [
          "join"
        ]
      },
      {
        "id": "sql-02",
        "front": "Чем `WHERE` отличается от `HAVING`?",
        "back": "`WHERE` фильтрует **строки до** группировки. `HAVING` — **группы после** `GROUP BY` и умеет работать с агрегатами:\n\n```sql\nSELECT user_id, count(*) AS orders\nFROM orders\nWHERE created_at > now() - interval '30 days'\nGROUP BY user_id\nHAVING count(*) >= 5;\n```",
        "tags": [
          "группировка"
        ]
      },
      {
        "id": "sql-03",
        "front": "В каком порядке логически выполняется `SELECT`?",
        "back": "`FROM / JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT / OFFSET`.\n\nПоэтому алиас из `SELECT` нельзя использовать в `WHERE`, но можно в `ORDER BY` (в PostgreSQL ещё и в `GROUP BY`).",
        "tags": [
          "основы"
        ]
      },
      {
        "id": "sql-04",
        "front": "Что такое индекс и как работает B-tree?",
        "back": "Отдельная структура данных, которая ускоряет поиск ценой места на диске и замедления записи.\n\n**B-tree** (по умолчанию в PostgreSQL) — сбалансированное дерево отсортированных ключей. Поиск за O(log n); подходит для `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, `LIKE 'abc%'`.\n\nДругие типы: Hash (только `=`), GIN (массивы, JSONB, полнотекстовый поиск), GiST (геоданные), BRIN (огромные упорядоченные таблицы).",
        "tags": [
          "индексы"
        ]
      },
      {
        "id": "sql-05",
        "front": "Почему запрос не использует индекс?",
        "back": "- Функция над колонкой: `WHERE lower(email) = …` — нужен индекс по выражению.\n- `LIKE '%abc'` — начало шаблона неизвестно.\n- Несовпадение типов, неявное приведение.\n- Низкая селективность: выбирается большая часть таблицы, и seq scan дешевле.\n- Индекс `(a, b)`, а фильтр только по `b`.\n- Устаревшая статистика — поможет `ANALYZE`.\n\nПроверяй через `EXPLAIN ANALYZE`.",
        "tags": [
          "индексы",
          "производительность"
        ]
      },
      {
        "id": "sql-06",
        "front": "Как порядок колонок влияет на составной индекс?",
        "back": "Индекс `(a, b, c)` отсортирован сначала по `a`, потом по `b` — как телефонный справочник по фамилии и имени. Он работает для фильтров по `a`, `a + b`, `a + b + c` (левый префикс), но не по одному `b`.\n\nСначала ставят колонки с равенством, потом — с диапазоном и сортировкой:\n\n```sql\nCREATE INDEX ON orders (user_id, created_at DESC);\n-- быстро: WHERE user_id = 1 ORDER BY created_at DESC LIMIT 20\n```",
        "tags": [
          "индексы"
        ]
      },
      {
        "id": "sql-07",
        "front": "Как читать `EXPLAIN ANALYZE`?",
        "back": "Показывает план и **реальное** время каждого узла. На что смотреть:\n\n- `Seq Scan` по большой таблице там, где ждёшь `Index Scan`;\n- большая разница между `rows` (оценка) и `actual rows` — устаревшая статистика;\n- `Nested Loop` на больших входах;\n- `Sort` с записью на диск (`external merge`);\n- самый дорогой узел по `actual time`.\n\n`EXPLAIN` без `ANALYZE` запрос не выполняет.",
        "tags": [
          "производительность",
          "explain"
        ]
      },
      {
        "id": "sql-08",
        "front": "Что такое первичный и внешний ключ?",
        "back": "**Primary key** уникально идентифицирует строку: `UNIQUE + NOT NULL`, индексируется автоматически.\n\n**Foreign key** ссылается на ключ другой таблицы и гарантирует целостность: нельзя сослаться на несуществующую строку. Поведение при удалении: `ON DELETE CASCADE | SET NULL | RESTRICT`.\n\nВнешний ключ в PostgreSQL **не индексируется сам** — индекс по `user_id` обычно нужно создать вручную.",
        "tags": [
          "ключи",
          "основы"
        ]
      },
      {
        "id": "sql-09",
        "front": "Что такое нормализация? Кратко про 1НФ, 2НФ, 3НФ.",
        "back": "Устранение дублирования и аномалий обновления.\n\n- **1НФ** — атомарные значения, без повторяющихся групп (никаких «тегов через запятую»).\n- **2НФ** — 1НФ + каждый неключевой атрибут зависит от **всего** составного ключа.\n- **3НФ** — 2НФ + нет транзитивных зависимостей: неключевые поля не зависят от других неключевых.\n\nДенормализация — осознанное дублирование ради скорости чтения.",
        "tags": [
          "проектирование"
        ]
      },
      {
        "id": "sql-10",
        "front": "Что такое транзакция и ACID?",
        "back": "Транзакция — группа операций по принципу «всё или ничего».\n\n- **Atomicity** — применяются либо все изменения, либо ни одного.\n- **Consistency** — переход между корректными состояниями, ограничения соблюдены.\n- **Isolation** — параллельные транзакции не мешают друг другу (в рамках уровня изоляции).\n- **Durability** — после `COMMIT` данные переживут сбой (WAL).\n\n```sql\nBEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;\n```",
        "tags": [
          "транзакции"
        ]
      },
      {
        "id": "sql-11",
        "front": "Какие уровни изоляции транзакций есть и какие аномалии они допускают?",
        "back": "Аномалии: dirty read, non-repeatable read, phantom read, serialization anomaly.\n\n- **Read Uncommitted** — в PostgreSQL работает как Read Committed.\n- **Read Committed** (по умолчанию в PG) — каждый запрос видит данные, закоммиченные на момент **его** начала.\n- **Repeatable Read** — снимок на начало транзакции; в PG фантомов тоже нет.\n- **Serializable** — как будто транзакции шли по очереди. Возможны ошибки сериализации, транзакцию нужно повторить.",
        "tags": [
          "транзакции",
          "изоляция"
        ]
      },
      {
        "id": "sql-12",
        "front": "Что такое MVCC в PostgreSQL и зачем нужен `VACUUM`?",
        "back": "**Multi-Version Concurrency Control**: `UPDATE` не перезаписывает строку, а создаёт новую версию. Старая остаётся для транзакций, которые её ещё видят. Читатели не блокируют писателей, и наоборот.\n\nМёртвые версии копятся (bloat). `VACUUM` (обычно autovacuum) освобождает место для повторного использования, обновляет статистику и не даёт переполниться счётчику транзакций.",
        "tags": [
          "postgres",
          "mvcc"
        ]
      },
      {
        "id": "sql-13",
        "front": "Что такое проблема N+1?",
        "back": "Один запрос за списком + по запросу на каждый элемент:\n\n```ts\nconst posts = await db.post.findMany(); // 1 запрос\nfor (const p of posts) {\n  // + N запросов\n  p.author = await db.user.findUnique({ where: { id: p.authorId } });\n}\n```\n\nРешение: JOIN, один запрос `WHERE id IN (…)`, `include` в ORM, DataLoader (батчинг) в GraphQL.",
        "tags": [
          "производительность",
          "orm"
        ]
      },
      {
        "id": "sql-14",
        "front": "Что такое оконные функции? Приведи пример.",
        "back": "Считают по набору строк, связанных с текущей, **не схлопывая** строки — в отличие от `GROUP BY`:\n\n```sql\n-- три последних заказа каждого пользователя\nSELECT *\nFROM (\n  SELECT o.*,\n         row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn\n  FROM orders o\n) t\nWHERE rn <= 3;\n```\n\nЕщё: `rank`, `dense_rank`, `lag` / `lead`, `sum(…) OVER (ORDER BY …)` — накопительный итог.",
        "tags": [
          "оконные функции"
        ]
      },
      {
        "id": "sql-15",
        "front": "Чем отличаются `ROW_NUMBER`, `RANK` и `DENSE_RANK`?",
        "back": "Для значений 100, 90, 90, 80:\n\n- `row_number` → 1, 2, 3, 4 — всегда уникальный\n- `rank` → 1, 2, 2, 4 — пропуск после равных\n- `dense_rank` → 1, 2, 2, 3 — без пропусков",
        "tags": [
          "оконные функции"
        ]
      },
      {
        "id": "sql-16",
        "front": "Что такое CTE (`WITH`)? А рекурсивный CTE?",
        "back": "Именованный подзапрос для читаемости:\n\n```sql\nWITH active AS (\n  SELECT * FROM users WHERE last_seen > now() - interval '7 days'\n)\nSELECT count(*) FROM active;\n```\n\nРекурсивный — для деревьев (категории, комментарии, оргструктура):\n\n```sql\nWITH RECURSIVE tree AS (\n  SELECT id, parent_id, name FROM categories WHERE id = 1\n  UNION ALL\n  SELECT c.id, c.parent_id, c.name\n  FROM categories c\n  JOIN tree t ON c.parent_id = t.id\n)\nSELECT * FROM tree;\n```",
        "tags": [
          "cte"
        ]
      },
      {
        "id": "sql-17",
        "front": "`UNION` против `UNION ALL`?",
        "back": "`UNION` объединяет результаты и **убирает дубликаты** — это лишняя сортировка или хеширование, дороже.\n\n`UNION ALL` просто склеивает. Если дублей быть не может или они нужны — бери `UNION ALL`. Число и типы колонок должны совпадать.",
        "tags": [
          "основы"
        ]
      },
      {
        "id": "sql-18",
        "front": "`DELETE`, `TRUNCATE` и `DROP` — в чём разница?",
        "back": "- `DELETE` удаляет строки (можно с `WHERE`), построчно, с триггерами. Медленно на больших объёмах.\n- `TRUNCATE` мгновенно очищает всю таблицу без построчной обработки, может сбросить счётчики (`RESTART IDENTITY`).\n- `DROP` удаляет саму таблицу вместе со структурой.\n\nВ PostgreSQL все три транзакционны — их можно откатить.",
        "tags": [
          "основы"
        ]
      },
      {
        "id": "sql-19",
        "front": "Какие подводные камни у `NULL`?",
        "back": "`NULL` — это «неизвестно». Любое сравнение с ним даёт `NULL`, а не true/false.\n\n- `WHERE x = NULL` ничего не найдёт → нужно `IS NULL`.\n- `NOT IN (подзапрос с NULL)` вернёт пустоту.\n- Агрегаты (`sum`, `avg`, `count(col)`) пропускают `NULL`.\n\nПомогают `COALESCE(x, 0)` и `IS DISTINCT FROM`.",
        "tags": [
          "null",
          "ловушка"
        ]
      },
      {
        "id": "sql-20",
        "front": "`COUNT(*)`, `COUNT(column)` и `COUNT(DISTINCT column)`?",
        "back": "- `count(*)` — число строк;\n- `count(col)` — число строк, где `col` **не** `NULL`;\n- `count(DISTINCT col)` — число уникальных непустых значений.\n\nЛовушка с `LEFT JOIN`: считать надо `count(o.id)`, иначе пользователи без заказов получат 1 вместо 0.",
        "tags": [
          "агрегаты"
        ]
      },
      {
        "id": "sql-21",
        "front": "`EXISTS` или `IN`? Подзапрос или `JOIN`?",
        "back": "`EXISTS` проверяет наличие хотя бы одной строки и останавливается на первой, корректно работает с `NULL`. `NOT IN` ломается, если в подзапросе есть `NULL` — используй `NOT EXISTS`.\n\nПланировщик PostgreSQL часто превращает `IN` и `EXISTS` в одинаковый semi-join.\n\n`JOIN` нужен, если требуются колонки второй таблицы. Если нужна только проверка наличия — `EXISTS`: `JOIN` может размножить строки.",
        "tags": [
          "подзапросы"
        ]
      },
      {
        "id": "sql-22",
        "front": "OFFSET-пагинация или keyset (курсорная)?",
        "back": "`LIMIT 20 OFFSET 10000` заставляет БД прочитать и выбросить 10 000 строк: медленно на дальних страницах, а при вставках строки «съезжают».\n\nKeyset продолжает от последнего ключа:\n\n```sql\nSELECT * FROM posts\nWHERE (created_at, id) < ($1, $2)\nORDER BY created_at DESC, id DESC\nLIMIT 20;\n```\n\nС индексом быстро на любой глубине, но перейти на произвольную страницу нельзя. Идеально для бесконечной ленты.",
        "tags": [
          "пагинация",
          "производительность"
        ]
      },
      {
        "id": "sql-23",
        "front": "Как сделать «вставить или обновить» (upsert) в PostgreSQL?",
        "back": "```sql\nINSERT INTO stats (user_id, views)\nVALUES (1, 1)\nON CONFLICT (user_id)\nDO UPDATE SET views = stats.views + EXCLUDED.views;\n```\n\nНужен уникальный индекс или ограничение на колонке конфликта. `EXCLUDED` — строка, которую пытались вставить. `ON CONFLICT DO NOTHING` — просто пропустить.",
        "tags": [
          "postgres",
          "upsert"
        ]
      },
      {
        "id": "sql-24",
        "front": "`json` или `jsonb` в PostgreSQL? Когда их использовать?",
        "back": "`json` хранит текст как есть: с пробелами, порядком ключей и дублями. `jsonb` — разобранный бинарный формат: быстрее запросы, GIN-индексы, операторы `@>`, `?`, `->>`. Почти всегда выбирают `jsonb`.\n\nПодходит для гибких и редко запрашиваемых атрибутов. Поля, по которым часто фильтруют и джойнят, лучше держать в обычных колонках.\n\n```sql\nSELECT * FROM products WHERE attrs @> '{\"color\": \"red\"}';\n```",
        "tags": [
          "postgres",
          "jsonb"
        ]
      },
      {
        "id": "sql-25",
        "front": "Что такое deadlock и как его избежать?",
        "back": "Две транзакции ждут друг друга: T1 заблокировала строку A и ждёт B, а T2 заблокировала B и ждёт A. PostgreSQL обнаружит взаимоблокировку и отменит одну транзакцию с ошибкой.\n\nКак избегать:\n\n- блокировать ресурсы в одном порядке (например, по возрастанию id);\n- держать транзакции короткими;\n- повторять транзакцию при ошибке.\n\n`SELECT … FOR UPDATE` — явная блокировка строк перед изменением.",
        "tags": [
          "транзакции",
          "блокировки"
        ]
      },
      {
        "id": "sql-26",
        "front": "Что такое SQL-инъекция и как защититься?",
        "back": "Подстановка пользовательского ввода прямо в текст запроса: `\"… WHERE name = '\" + name + \"'\"` с `name = \"' OR 1=1 --\"`.\n\nЗащита — **параметризованные запросы**: значения передаются отдельно от SQL (`WHERE name = $1`). ORM делают это сами, опасны сырые запросы со строковой интерполяцией. Плюс минимальные права у пользователя БД.",
        "tags": [
          "безопасность"
        ]
      },
      {
        "id": "sql-27",
        "front": "Почему `LEFT JOIN` превращается во `INNER JOIN`, если добавить условие в `WHERE`?",
        "back": "```sql\n-- ✗ пользователи без оплаченных заказов пропадут\nSELECT u.name, o.id\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nWHERE o.status = 'paid';\n\n-- ✓ условие на правую таблицу — в ON\nSELECT u.name, o.id\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid';\n```\n\nУ пользователей без подходящих заказов все поля `o` равны `NULL`, а `NULL = 'paid'` не даёт true — `WHERE` выбрасывает эти строки. Условие в `ON` только решает, какие заказы присоединить, и сохраняет всех пользователей.",
        "tags": [
          "join",
          "ловушка"
        ]
      },
      {
        "id": "sql-28",
        "front": "Что такое self join? Пример.",
        "back": "Соединение таблицы **с самой собой** — для иерархий и сравнения строк одной таблицы:\n\n```sql\n-- сотрудник и его руководитель\nSELECT e.name AS employee, m.name AS manager\nFROM users e\nLEFT JOIN users m ON m.id = e.manager_id;\n```\n\nАлиасы (`e`, `m`) обязательны, чтобы различать две копии. `LEFT` нужен, чтобы не потерять верхнего руководителя, у которого `manager_id IS NULL`.",
        "tags": [
          "join"
        ]
      },
      {
        "id": "sql-29",
        "front": "Как в PostgreSQL выбрать последний заказ каждого пользователя?",
        "back": "`DISTINCT ON` оставляет первую строку в каждой группе согласно `ORDER BY`:\n\n```sql\nSELECT DISTINCT ON (user_id) user_id, id, created_at\nFROM orders\nORDER BY user_id, created_at DESC;\n```\n\n`ORDER BY` должен начинаться с тех же выражений, что в `DISTINCT ON`. Переносимый вариант для любой СУБД — `row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC)` и фильтр `rn = 1`.",
        "tags": [
          "postgres",
          "distinct on"
        ]
      },
      {
        "id": "sql-30",
        "front": "Как найти вторую по величине зарплату?",
        "back": "```sql\n-- 1) через DISTINCT + OFFSET\nSELECT DISTINCT salary\nFROM salaries\nORDER BY salary DESC\nOFFSET 1 LIMIT 1;\n\n-- 2) через dense_rank — заодно видно, у кого она\nSELECT emp, salary\nFROM (\n  SELECT emp, salary, dense_rank() OVER (ORDER BY salary DESC) AS r\n  FROM salaries\n) t\nWHERE r = 2;\n```\n\nЛовушка: без `DISTINCT` (или с `row_number` вместо `dense_rank`) при двух одинаковых максимальных зарплатах «второй» окажется та же максимальная.",
        "tags": [
          "задача",
          "оконные функции"
        ]
      },
      {
        "id": "sql-31",
        "front": "Как найти и удалить дубликаты, оставив одну запись?",
        "back": "Найти:\n\n```sql\nSELECT email, count(*)\nFROM emails\nGROUP BY email\nHAVING count(*) > 1;\n```\n\nУдалить, оставив строку с наименьшим `id` (PostgreSQL):\n\n```sql\nDELETE FROM emails a\nUSING emails b\nWHERE a.email = b.email\n  AND a.id > b.id;\n```\n\nПосле чистки — уникальный индекс `CREATE UNIQUE INDEX ON emails (email)`, чтобы дубли не появились снова.",
        "tags": [
          "задача",
          "дубликаты"
        ]
      },
      {
        "id": "sql-32",
        "front": "Что делают `COALESCE`, `NULLIF` и `CASE`?",
        "back": "- `COALESCE(a, b, c)` — первое не-`NULL` значение: `COALESCE(nickname, name, 'Аноним')`.\n- `NULLIF(a, b)` — `NULL`, если `a = b`, иначе `a`. Классика — защита от деления на ноль: `total / NULLIF(count, 0)` вернёт `NULL` вместо ошибки.\n- `CASE` — условие внутри запроса:\n\n```sql\nSELECT name,\n       CASE WHEN manager_id IS NULL THEN 'boss' ELSE 'staff' END AS role\nFROM users;\n```",
        "tags": [
          "null",
          "выражения"
        ]
      },
      {
        "id": "sql-33",
        "front": "Что такое частичный индекс, индекс по выражению и покрывающий индекс?",
        "back": "```sql\n-- частичный: индексирует только нужные строки — меньше и быстрее\nCREATE INDEX ON orders (user_id) WHERE status = 'new';\n\n-- по выражению: для поиска без учёта регистра\nCREATE INDEX ON users (lower(email));\n-- используется запросом WHERE lower(email) = lower($1)\n\n-- покрывающий: INCLUDE хранит доп. колонки в индексе,\n-- запрос может обойтись без чтения таблицы (index-only scan)\nCREATE INDEX ON orders (user_id) INCLUDE (total);\n```\n\nЧастичный индекс используется, только если условие запроса совпадает с условием индекса или следует из него.",
        "tags": [
          "индексы",
          "postgres"
        ]
      },
      {
        "id": "sql-34",
        "front": "`SERIAL` или `GENERATED AS IDENTITY`? Что выбрать для первичного ключа?",
        "back": "`GENERATED ... AS IDENTITY` — стандарт SQL, рекомендуемый в современном PostgreSQL. `SERIAL` — старый способ: это обычный `int` + отдельная последовательность, с ней проще ошибиться при правах и копировании таблиц.\n\n```sql\nCREATE TABLE users (\n  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  name text\n);\nINSERT INTO users (id, name) VALUES (5, 'x');\n-- ошибка: cannot insert a non-DEFAULT value into column \"id\"\n```\n\n`ALWAYS` защищает от ручной вставки id, `BY DEFAULT` разрешает её. Для распределённых систем и публичных идентификаторов часто берут `uuid`.",
        "tags": [
          "postgres",
          "типы"
        ]
      },
      {
        "id": "sql-35",
        "front": "Чем обычное представление (VIEW) отличается от материализованного?",
        "back": "- **VIEW** — сохранённый запрос. Данные не хранит, при каждом обращении выполняет запрос заново: всегда актуально, но не быстрее исходного запроса.\n- **MATERIALIZED VIEW** — результат запроса **сохранён на диск**: читается быстро, можно индексировать, но устаревает, пока его не обновят.\n\n```sql\nCREATE MATERIALIZED VIEW sales_by_user AS\nSELECT user_id, sum(total) AS total FROM orders GROUP BY user_id;\n\nREFRESH MATERIALIZED VIEW sales_by_user;\n-- без блокировки чтения, но нужен уникальный индекс:\nCREATE UNIQUE INDEX ON sales_by_user (user_id);\nREFRESH MATERIALIZED VIEW CONCURRENTLY sales_by_user;\n```\n\nПодходит для отчётов и дашбордов, где допустимо небольшое отставание.",
        "tags": [
          "postgres",
          "представления"
        ]
      },
      {
        "id": "sql-36",
        "front": "Оптимистичная или пессимистичная блокировка — в чём разница?",
        "back": "**Пессимистичная** — заблокировать строку заранее, другие ждут:\n\n```sql\nBEGIN;\nSELECT * FROM accounts WHERE id = 1 FOR UPDATE;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nCOMMIT;\n```\n\n**Оптимистичная** — не блокировать, а при записи проверить, что строку никто не изменил (колонка `version`):\n\n```sql\nUPDATE accounts\nSET balance = 50, version = version + 1\nWHERE id = 1 AND version = 1;\n-- 0 обновлённых строк = кто-то успел раньше → перечитать и повторить\n```\n\nПессимистичная — при частых конфликтах и коротких транзакциях. Оптимистичная — когда конфликты редки, а держать блокировку долго нельзя (например, пока пользователь редактирует форму).",
        "tags": [
          "транзакции",
          "блокировки"
        ]
      },
      {
        "id": "sql-37",
        "front": "`text`, `varchar(n)` или `char(n)` в PostgreSQL?",
        "back": "В PostgreSQL между ними **нет разницы в скорости**. `text` и `varchar` без ограничения — одно и то же по сути, `varchar(n)` лишь добавляет проверку длины.\n\n`char(n)` дополняет строку пробелами до `n` и ведёт себя неочевидно (хвостовые пробелы игнорируются в сравнениях) — его почти не используют.\n\nПрактика: `text`, а ограничение длины, если нужно, — через `CHECK (char_length(name) <= 100)` или `varchar(n)`.",
        "tags": [
          "postgres",
          "типы"
        ]
      },
      {
        "id": "sql-38",
        "front": "`timestamp` или `timestamptz`?",
        "back": "Почти всегда `timestamptz` (`timestamp with time zone`). Он хранит **момент времени** (внутри — UTC) и при выводе переводит в часовой пояс сессии.\n\n`timestamp` хранит «время на стенных часах» без пояса и **молча отбрасывает** смещение:\n\n```sql\nSET TIME ZONE 'Europe/Moscow';\nSELECT '2026-01-01 12:00:00+00'::timestamptz; -- 2026-01-01 15:00:00+03\nSELECT '2026-01-01 12:00:00+00'::timestamp;   -- 2026-01-01 12:00:00 (пояс потерян)\n```\n\nС `timestamp` события из разных часовых поясов становится невозможно корректно сравнить.",
        "tags": [
          "postgres",
          "даты"
        ]
      }
    ]
  },
  {
    "id": "prisma",
    "title": "Prisma",
    "description": "Схема, связи, запросы, транзакции и что нового в Prisma 7",
    "color": "indigo",
    "icon": "triangle",
    "cards": [
      {
        "id": "prisma-01",
        "front": "Что такое Prisma и из чего она состоит?",
        "back": "ORM для Node.js и TypeScript:\n\n- **Prisma Schema** (`schema.prisma`) — модели, связи, источник данных, генератор.\n- **Prisma Client** — сгенерированный по схеме типобезопасный клиент.\n- **Prisma Migrate** — миграции БД из изменений схемы.\n- **Prisma Studio** — GUI для просмотра данных.\n\nГлавный плюс — тип результата выводится из запроса: `select` и `include` меняют тип ответа.",
        "tags": [
          "основы"
        ]
      },
      {
        "id": "prisma-02",
        "front": "Как описать модель со связью один-ко-многим?",
        "back": "```prisma\nmodel User {\n  id     String  @id @default(cuid())\n  email  String  @unique\n  habits Habit[]\n}\n\nmodel Habit {\n  id     String @id @default(cuid())\n  title  String\n  userId String\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n}\n```\n\nВнешний ключ — `userId`. Поля `user` и `habits` — виртуальные поля связи для клиента, в таблице их нет.",
        "tags": [
          "схема",
          "связи"
        ]
      },
      {
        "id": "prisma-03",
        "front": "Как сделать связь многие-ко-многим?",
        "back": "**Неявная** — Prisma сама создаёт связующую таблицу:\n\n```prisma\nmodel Post {\n  id   Int   @id @default(autoincrement())\n  tags Tag[]\n}\n\nmodel Tag {\n  id    Int    @id @default(autoincrement())\n  posts Post[]\n}\n```\n\n**Явная** — своя модель-связка, если нужны дополнительные поля (роль, дата):\n\n```prisma\nmodel Membership {\n  userId String\n  teamId String\n  role   String\n  user   User   @relation(fields: [userId], references: [id])\n  team   Team   @relation(fields: [teamId], references: [id])\n\n  @@id([userId, teamId])\n}\n```",
        "tags": [
          "схема",
          "связи"
        ]
      },
      {
        "id": "prisma-04",
        "front": "Чем отличаются `prisma migrate dev`, `migrate deploy` и `db push`?",
        "back": "- `migrate dev` — для разработки: создаёт SQL-миграцию из изменений схемы и применяет её. При расхождении может предложить сбросить БД.\n- `migrate deploy` — для CI и продакшена: только применяет готовые миграции, ничего не генерирует и не сбрасывает.\n- `db push` — синхронизирует БД со схемой **без файлов миграций**. Для прототипов: истории нет, данные можно потерять.\n\nПапку с миграциями коммитят в git.",
        "tags": [
          "миграции"
        ]
      },
      {
        "id": "prisma-05",
        "front": "Чем `include` отличается от `select`?",
        "back": "`include` — все скалярные поля модели + указанные связи. `select` — **только** перечисленные поля, по сети уходит меньше данных.\n\nНа одном уровне их вместе использовать нельзя, но можно вкладывать:\n\n```ts\nconst user = await prisma.user.findUnique({\n  where: { id },\n  select: {\n    email: true,\n    habits: { select: { title: true }, where: { archived: false } },\n  },\n});\n// тип: { email: string; habits: { title: string }[] } | null\n```",
        "tags": [
          "запросы"
        ]
      },
      {
        "id": "prisma-06",
        "front": "Как получить TS-тип результата запроса с `include`?",
        "back": "Через сгенерированный помощник `Prisma.<Model>GetPayload`:\n\n```ts\nimport { Prisma } from \"../generated/prisma/client\";\n\nconst withHabits = {\n  include: { habits: true },\n} satisfies Prisma.UserDefaultArgs;\n\ntype UserWithHabits = Prisma.UserGetPayload<typeof withHabits>;\n```\n\nБазовые типы моделей (`User`, `Habit`) тоже экспортируются из клиента — без связей.",
        "tags": [
          "typescript"
        ]
      },
      {
        "id": "prisma-07",
        "front": "Как в Prisma избежать проблемы N+1?",
        "back": "Загружать связи через `include` / `select`, а не отдельными запросами в цикле. Prisma сама соберёт связанные записи **одним запросом на уровень связи** (`WHERE id IN (…)`), а не по запросу на каждую запись.\n\n```ts\n// ✗ N+1: запрос автора для каждого поста\nfor (const post of posts) {\n  post.author = await prisma.user.findUnique({ where: { id: post.authorId } });\n}\n\n// ✓ два запроса на всё\nconst posts = await prisma.post.findMany({ include: { author: true } });\n```\n\nПолучить связи одним SQL-запросом с JOIN можно опцией `relationLoadStrategy: \"join\"` — в Prisma 7 она доступна за preview-флагом `relationJoins` в генераторе. Параллельные вызовы `findUnique` в одном тике Prisma объединяет в один запрос сама.",
        "tags": [
          "производительность",
          "n+1"
        ]
      },
      {
        "id": "prisma-08",
        "front": "Как сделать транзакцию в Prisma?",
        "back": "Два варианта:\n\n```ts\n// последовательные операции: всё или ничего\nawait prisma.$transaction([\n  prisma.account.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } }),\n  prisma.account.update({ where: { id: 2 }, data: { balance: { increment: 100 } } }),\n]);\n\n// интерактивная: логика между запросами\nawait prisma.$transaction(async (tx) => {\n  const from = await tx.account.findUniqueOrThrow({ where: { id: 1 } });\n  if (from.balance < 100) throw new Error(\"Недостаточно средств\"); // откат\n  await tx.account.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } });\n});\n```\n\nВложенные записи (`create` с вложенным `create`) тоже выполняются атомарно.",
        "tags": [
          "транзакции"
        ]
      },
      {
        "id": "prisma-09",
        "front": "Как создать запись, если её нет, и атомарно увеличить счётчик?",
        "back": "```ts\nawait prisma.stat.upsert({\n  where: { userId },\n  update: { views: { increment: 1 } },\n  create: { userId, views: 1 },\n});\n```\n\n`increment`, `decrement`, `multiply` выполняются в БД атомарно — без гонки «прочитал → прибавил → записал». В `where` у `upsert` нужно уникальное поле.",
        "tags": [
          "запросы",
          "upsert"
        ]
      },
      {
        "id": "prisma-10",
        "front": "Как безопасно выполнить сырой SQL в Prisma?",
        "back": "Шаблонный тег `$queryRaw` сам превращает подстановки в параметры:\n\n```ts\nconst users = await prisma.$queryRaw<User[]>`\n  SELECT * FROM \"User\" WHERE email = ${email}\n`;\n```\n\n`$queryRawUnsafe(str)` и склейка строк — путь к SQL-инъекции. Для изменений — `$executeRaw`. Есть ещё TypedSQL: запросы в `.sql`-файлах с генерацией типов.",
        "tags": [
          "sql",
          "безопасность"
        ]
      },
      {
        "id": "prisma-11",
        "front": "Почему в Next.js PrismaClient делают синглтоном?",
        "back": "Каждый `new PrismaClient()` открывает свой пул соединений. В dev hot reload пересоздаёт модули, соединения копятся — и БД отвечает «too many connections». Экземпляр хранят в `globalThis`:\n\n```ts\nconst globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };\n\nexport const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });\n\nif (process.env.NODE_ENV !== \"production\") globalForPrisma.prisma = prisma;\n```\n\nВ serverless нужен пулер соединений: PgBouncer, pooled-URL у Neon, Prisma Accelerate.",
        "tags": [
          "next",
          "соединения"
        ]
      },
      {
        "id": "prisma-12",
        "front": "Что изменилось в Prisma 7?",
        "back": "- Клиент без Rust-движка: запросы идут через **driver adapter** (`@prisma/adapter-pg` и другие). Бандл меньше, работает в edge и serverless.\n- Генератор `prisma-client` с обязательным `output` — клиент генерируется в код проекта, а не в `node_modules`.\n- Настройки CLI и URL базы переехали в `prisma.config.ts`. `.env` автоматически не подгружается.\n- ESM по умолчанию.\n\n```ts\nimport { PrismaPg } from \"@prisma/adapter-pg\";\nimport { PrismaClient } from \"../generated/prisma/client\";\n\nconst adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });\nexport const prisma = new PrismaClient({ adapter });\n```",
        "tags": [
          "prisma 7"
        ]
      },
      {
        "id": "prisma-13",
        "front": "Когда нужно запускать `prisma generate`?",
        "back": "После каждого изменения схемы: команда пересоздаёт клиент и типы.\n\nВ CI и на хостинге — при установке или сборке (`postinstall` или `\"build\": \"prisma generate && next build\"`). Иначе в рантайме окажется старый клиент без новых полей.",
        "tags": [
          "cli"
        ]
      },
      {
        "id": "prisma-14",
        "front": "Как фильтровать по связям: `some`, `every`, `none`?",
        "back": "```ts\n// есть хотя бы одна активная привычка\nprisma.user.findMany({ where: { habits: { some: { archived: false } } } });\n\n// все привычки в архиве\nprisma.user.findMany({ where: { habits: { every: { archived: true } } } });\n\n// без привычек\nprisma.user.findMany({ where: { habits: { none: {} } } });\n```\n\nДля связи один-к-одному — `is` / `isNot`.",
        "tags": [
          "запросы",
          "связи"
        ]
      },
      {
        "id": "prisma-15",
        "front": "Как сделать пагинацию в Prisma?",
        "back": "Offset: `skip` + `take` — просто, но медленно на дальних страницах.\n\nКурсорная (keyset):\n\n```ts\nconst page = await prisma.post.findMany({\n  take: 20,\n  skip: cursor ? 1 : 0, // пропустить сам курсор\n  cursor: cursor ? { id: cursor } : undefined,\n  orderBy: { id: \"desc\" },\n});\n\nconst nextCursor = page.at(-1)?.id;\n```",
        "tags": [
          "пагинация"
        ]
      },
      {
        "id": "prisma-16",
        "front": "Плюсы и минусы ORM вроде Prisma по сравнению с чистым SQL?",
        "back": "**Плюсы**: типобезопасность от БД до UI, автодополнение, миграции, защита от инъекций, меньше бойлерплейта.\n\n**Минусы**: не всё из SQL выражается через API (оконные функции, сложные отчёты → raw SQL или TypedSQL); лишние запросы при неаккуратном использовании; абстракция прячет реальные запросы — включай `log: [\"query\"]`.\n\nАльтернативы: Drizzle (ближе к SQL), Kysely (query builder).",
        "tags": [
          "архитектура"
        ]
      },
      {
        "id": "prisma-17",
        "front": "Что значат атрибуты `@id`, `@default`, `@unique`, `@updatedAt` и `@@index`?",
        "back": "```prisma\nmodel Post {\n  id        String   @id @default(cuid())  // первичный ключ с генерацией\n  slug      String   @unique               // уникальный индекс\n  published Boolean  @default(false)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt            // обновится сам при каждой записи\n  authorId  String\n\n  @@index([authorId, createdAt])           // составной индекс\n  @@unique([authorId, slug])               // уникальность пары\n}\n```\n\nАтрибуты с одной `@` относятся к полю, с двумя `@@` — ко всей модели.",
        "tags": [
          "схема"
        ]
      },
      {
        "id": "prisma-18",
        "front": "Как описать enum в схеме Prisma?",
        "back": "```prisma\nenum Role {\n  USER\n  ADMIN\n}\n\nmodel User {\n  id   String @id @default(cuid())\n  role Role   @default(USER)\n}\n```\n\nВ PostgreSQL создаётся настоящий тип `ENUM`, а в TypeScript — объект и тип `Role`, которые можно импортировать из сгенерированного клиента: `if (user.role === Role.ADMIN)`. Добавление нового значения требует миграции.",
        "tags": [
          "схема",
          "enum"
        ]
      },
      {
        "id": "prisma-19",
        "front": "Чем отличаются `findUnique`, `findFirst` и `findUniqueOrThrow`?",
        "back": "- `findUnique` — поиск только по **уникальному** полю или составному уникальному ключу (`id`, `email` с `@unique`). Возвращает запись или `null`. Параллельные вызовы Prisma батчит.\n- `findFirst` — первая запись по **любому** фильтру, обычно с `orderBy`.\n- `findUniqueOrThrow` / `findFirstOrThrow` — вместо `null` бросают ошибку. Удобно, когда отсутствие записи — исключительная ситуация, и не хочется проверять `null` вручную.\n\n```ts\nconst user = await prisma.user.findUnique({ where: { email } });       // User | null\nconst last = await prisma.post.findFirst({ where: { authorId }, orderBy: { createdAt: \"desc\" } });\n```",
        "tags": [
          "запросы"
        ]
      },
      {
        "id": "prisma-20",
        "front": "Как не отдавать на клиент поле `password`?",
        "back": "Опция `omit` убирает поля из результата — и из типа:\n\n```ts\nconst user = await prisma.user.findUnique({\n  where: { id },\n  omit: { password: true },\n});\n// user.password — ошибка типа\n\n// глобально для всего клиента\nconst prisma = new PrismaClient({\n  adapter,\n  omit: { user: { password: true } },\n});\n```\n\nС глобальным `omit` пароль нужно явно запросить там, где он нужен (например, при логине): `omit: { password: false }`. Безопаснее, чем помнить про `select` в каждом запросе.",
        "tags": [
          "безопасность",
          "select"
        ]
      },
      {
        "id": "prisma-21",
        "front": "Как сделать «мягкое удаление» (soft delete) в Prisma?",
        "back": "Колонка `deletedAt DateTime?` и Client Extension, которая добавляет фильтр ко всем чтениям:\n\n```ts\nconst prisma = new PrismaClient({ adapter }).$extends({\n  query: {\n    post: {\n      async findMany({ args, query }) {\n        args.where = { ...args.where, deletedAt: null };\n        return query(args);\n      },\n    },\n  },\n});\n\n// «удаление» — это update\nawait prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });\n```\n\n`$extends` заменил старый middleware `$use`, которого в Prisma 7 больше нет. Через расширения также добавляют свои методы моделям и вычисляемые поля в результатах.",
        "tags": [
          "extensions",
          "soft delete"
        ]
      },
      {
        "id": "prisma-22",
        "front": "Как вставить много записей разом? Чем `createMany` отличается от `createManyAndReturn`?",
        "back": "```ts\n// одна INSERT-команда вместо тысячи\nconst { count } = await prisma.tag.createMany({\n  data: [{ name: \"ts\" }, { name: \"react\" }],\n  skipDuplicates: true, // пропустить конфликты по уникальным полям\n});\n\n// то же, но возвращает созданные записи\nconst tags = await prisma.tag.createManyAndReturn({\n  data: [{ name: \"sql\" }],\n});\n```\n\n`createMany` возвращает только количество. Ни один из них не умеет вложенные записи связей — для этого `create` с вложенным `create` или транзакция. `createManyAndReturn` поддерживается не во всех БД (в PostgreSQL — да).",
        "tags": [
          "запросы",
          "производительность"
        ]
      },
      {
        "id": "prisma-23",
        "front": "Какие правила работы с миграциями Prisma в команде?",
        "back": "- Миграции — часть кода: коммитить папку `prisma/migrations` вместе с изменением схемы.\n- **Не редактировать** уже применённые миграции: Prisma хранит их контрольные суммы и заметит расхождение (drift).\n- Разработка — `migrate dev`, продакшен и CI — только `migrate deploy`.\n- Если БД изменили руками, `migrate dev` предложит сбросить базу — на общей или боевой базе так нельзя. Расхождения на проде чинят новой миграцией или `migrate resolve`.\n- Опасные изменения (переименование колонки, `NOT NULL` без дефолта) разбивают на шаги: добавить → перенести данные → удалить старое.",
        "tags": [
          "миграции",
          "команда"
        ]
      }
    ]
  },
  {
    "id": "output",
    "title": "Что выведет код?",
    "description": "Задачи-ловушки с собесов: event loop, this, приведение типов, замыкания, типы TS",
    "color": "slate",
    "icon": "brain",
    "cards": [
      {
        "id": "out-01",
        "front": "Что выведет код?\n\n```js\nconsole.log(\"A\");\nsetTimeout(() => console.log(\"B\"), 0);\nPromise.resolve()\n  .then(() => console.log(\"C\"))\n  .then(() => console.log(\"D\"));\nqueueMicrotask(() => console.log(\"E\"));\nconsole.log(\"F\");\n```",
        "back": "`A F C E D B`\n\n1. Синхронно: `A`, `F`.\n2. Микрозадачи по очереди постановки: `C` (первый `.then` встал в очередь сразу), затем `E`. Выполнение `C` ставит в очередь следующий `.then` — поэтому `D` идёт после `E`.\n3. Макрозадача `setTimeout` — последней: `B`.",
        "tags": [
          "event-loop",
          "промисы"
        ]
      },
      {
        "id": "out-02",
        "front": "Что выведет код?\n\n```js\nasync function f() {\n  console.log(1);\n  await null;\n  console.log(2);\n}\nconsole.log(3);\nf();\nconsole.log(4);\n```",
        "back": "`3 1 4 2`\n\nТело async-функции до первого `await` выполняется **синхронно**, поэтому `1` печатается сразу после `3`. Всё после `await` уходит в микрозадачу и выполняется, когда опустеет стек, — после `4`.",
        "tags": [
          "async",
          "event-loop"
        ]
      },
      {
        "id": "out-03",
        "front": "Что выведет код?\n\n```js\nsetTimeout(() => console.log(1));\nPromise.resolve().then(() => {\n  console.log(2);\n  setTimeout(() => console.log(3));\n  Promise.resolve().then(() => console.log(4));\n});\nconsole.log(5);\n```",
        "back": "`5 2 4 1 3`\n\n- синхронно: `5`;\n- микрозадача: `2`; внутри неё ставятся новая микрозадача (`4`) и новый таймер (`3`);\n- очередь микрозадач выполняется до конца, поэтому `4` идёт сразу;\n- таймеры по порядку постановки: сначала `1`, потом `3`.",
        "tags": [
          "event-loop"
        ]
      },
      {
        "id": "out-04",
        "front": "Что выведет код?\n\n```js\nconst p = new Promise((resolve) => {\n  console.log(1);\n  resolve(2);\n  console.log(3);\n});\np.then((v) => console.log(v));\nconsole.log(4);\n```",
        "back": "`1 3 4 2`\n\nФункция-исполнитель `new Promise(...)` вызывается **синхронно**. `resolve` не прерывает её — `3` всё равно печатается. Колбэк `.then` всегда асинхронный (микрозадача), даже если промис уже выполнен.",
        "tags": [
          "промисы"
        ]
      },
      {
        "id": "out-05",
        "front": "Что выведет код?\n\n```js\nPromise.reject(new Error(\"boom\"))\n  .then(() => console.log(\"then\"))\n  .catch((e) => {\n    console.log(\"catch\", e.message);\n    return \"ok\";\n  })\n  .then((v) => console.log(\"after\", v))\n  .finally(() => console.log(\"finally\"));\n```",
        "back": "```\ncatch boom\nafter ok\nfinally\n```\n\n`.then` без обработчика ошибки пропускает reject дальше. `.catch` обрабатывает ошибку и возвращает обычное значение — цепочка снова становится успешной. `finally` вызывается в любом случае и не получает значение.",
        "tags": [
          "промисы",
          "ошибки"
        ]
      },
      {
        "id": "out-06",
        "front": "Что выведет код?\n\n```js\nconst sleep = (ms) => new Promise((r) => setTimeout(r, ms));\n\nasync function run() {\n  [3, 1, 2].forEach(async (n) => {\n    await sleep(n * 10);\n    console.log(n);\n  });\n  console.log(\"done\");\n}\nrun();\n```",
        "back": "`done 1 2 3`\n\n`forEach` не ждёт промисы, которые возвращает async-колбэк: он просто запускает три задачи и идёт дальше. Поэтому `done` печатается сразу, а числа — по мере срабатывания таймеров.\n\nЧтобы дождаться всех: `await Promise.all(arr.map(async (n) => …))`. По очереди — `for...of` с `await`.",
        "tags": [
          "async",
          "ловушка"
        ]
      },
      {
        "id": "out-07",
        "front": "Что выведет код? (ES-модуль, то есть строгий режим)\n\n```js\nconst counter = {\n  count: 0,\n  inc() {\n    this.count++;\n    return this.count;\n  },\n};\nconst inc = counter.inc;\nconsole.log(counter.inc());\ntry {\n  inc();\n} catch (e) {\n  console.log(e instanceof TypeError);\n}\n```",
        "back": "`1`, затем `true`\n\n`counter.inc()` вызван как метод — `this` это `counter`. `inc()` вызван отдельно — контекст потерян, в строгом режиме `this === undefined`, и `this.count++` бросает `TypeError`.\n\nВ нестрогом скрипте `this` был бы `globalThis`: ошибки нет, функция вернула бы `NaN`.",
        "tags": [
          "this",
          "strict"
        ]
      },
      {
        "id": "out-08",
        "front": "Что выведет код?\n\n```js\nconsole.log(typeof a, typeof b);\nvar a = 1;\nlet b = 2;\n```",
        "back": "`ReferenceError` — ничего не напечатается.\n\n`var a` всплывает со значением `undefined`, а `b` до своей строки находится во временной мёртвой зоне. Ловушка в том, что `typeof` от TDZ **не защищает**: он безопасен только для необъявленных переменных (`typeof neverDeclared === \"undefined\"`).",
        "tags": [
          "hoisting",
          "tdz"
        ]
      },
      {
        "id": "out-09",
        "front": "Что выведет код?\n\n```js\nconsole.log([] + []);\nconsole.log([] + {});\nconsole.log(1 + \"2\" - 1);\nconsole.log(\"5\" * \"2\");\nconsole.log(null + 1, undefined + 1);\nconsole.log([] == false);\n```",
        "back": "```\n                      ← пустая строка\n[object Object]\n11\n10\n1 NaN\ntrue\n```\n\n- `+` с объектом приводит его к строке: `[]` → `\"\"`, `{}` → `\"[object Object]\"`.\n- `1 + \"2\"` — конкатенация `\"12\"`, затем `-` приводит к числу: `11`.\n- `*` всегда числовой: `10`.\n- `null` → `0`, `undefined` → `NaN`.\n- `[] == false`: обе стороны приводятся к числу, `0 == 0`.",
        "tags": [
          "приведение типов"
        ]
      },
      {
        "id": "out-10",
        "front": "Что выведет код?\n\n```js\nconsole.log(0.1 + 0.2 === 0.3);\nconsole.log((0.1 + 0.2).toFixed(2));\nconsole.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON);\n```",
        "back": "`false`, `\"0.30\"`, `true`\n\nЧисла — это двоичные float64 (IEEE 754): `0.1` и `0.2` нельзя записать точно, сумма равна `0.30000000000000004`. Дробные числа сравнивают с допуском. Деньги хранят в целых копейках или используют библиотеки вроде decimal.js.",
        "tags": [
          "числа"
        ]
      },
      {
        "id": "out-11",
        "front": "Что выведет код?\n\n```js\nconsole.log([1, 10, 2, 21].sort());\nconsole.log([\"b\", \"a\", \"C\"].sort());\nconsole.log([1, 2, 3].map(parseInt));\n```",
        "back": "```\n[ 1, 10, 2, 21 ]\n[ 'C', 'a', 'b' ]\n[ 1, NaN, NaN ]\n```\n\n- `sort()` без компаратора сравнивает **строки** по кодам UTF-16: `\"10\" < \"2\"`, а заглавные буквы идут раньше строчных. Для чисел нужно `sort((a, b) => a - b)`, для слов — `localeCompare`.\n- `map` передаёт `(value, index)`, а `parseInt` понимает второй аргумент как систему счисления: `parseInt(\"2\", 1)` и `parseInt(\"3\", 2)` дают `NaN`.",
        "tags": [
          "массивы",
          "ловушка"
        ]
      },
      {
        "id": "out-12",
        "front": "Что выведет код?\n\n```js\nconst a = { x: 1 };\nconst b = a;\nb.x = 2;\nconst c = { ...a };\nc.x = 3;\nconsole.log(a.x, b.x, c.x);\n```",
        "back": "`2 2 3`\n\n`b` — та же ссылка, что и `a`, поэтому изменение через `b` видно в `a`. Spread создаёт **новый** объект, и `c` уже независим (но только на верхнем уровне — вложенные объекты остались бы общими).",
        "tags": [
          "объекты",
          "ссылки"
        ]
      },
      {
        "id": "out-13",
        "front": "Что выведет код?\n\n```js\nconst o = { b: 1, 2: \"x\", a: 2, 1: \"y\" };\nconsole.log(Object.keys(o));\n```",
        "back": "`[ '1', '2', 'b', 'a' ]`\n\nПорядок ключей объекта определён спецификацией: сначала ключи-целые числа по возрастанию, затем строковые — в порядке добавления, затем символы. Если важен порядок вставки для любых ключей, используй `Map`.",
        "tags": [
          "объекты"
        ]
      },
      {
        "id": "out-14",
        "front": "Что выведет код?\n\n```js\nfunction makeGetters() {\n  const fns = [];\n  for (var i = 0; i < 3; i++) fns.push(() => i);\n  return fns.map((f) => f());\n}\nconsole.log(makeGetters());\n\nconst x = 10;\nfunction show() {\n  console.log(x);\n}\nfunction run() {\n  const x = 20;\n  show();\n}\nrun();\n```",
        "back": "`[ 3, 3, 3 ]`, затем `10`\n\n- `var` — одна переменная на всю функцию: к моменту вызова стрелок цикл закончился и `i === 3`. С `let` было бы `[0, 1, 2]` — у каждой итерации своя копия.\n- Область видимости **лексическая**: `show` видит `x` там, где объявлена, а не там, где вызвана.",
        "tags": [
          "замыкания",
          "scope"
        ]
      },
      {
        "id": "out-15",
        "front": "Что выведет код?\n\n```js\nconsole.log(\n  JSON.stringify({ a: undefined, b: () => 1, c: NaN, d: new Date(0), e: [undefined] }),\n);\nJSON.stringify({ n: 1n });\n```",
        "back": "```\n{\"c\":null,\"d\":\"1970-01-01T00:00:00.000Z\",\"e\":[null]}\nTypeError: Do not know how to serialize a BigInt\n```\n\n- свойства со значением `undefined` и функции **пропадают**;\n- `NaN` и `Infinity` становятся `null`;\n- `Date` превращается в ISO-строку (у неё есть `toJSON`);\n- в массиве `undefined` заменяется на `null`, чтобы не сбить индексы;\n- `BigInt` сериализовать нельзя — нужно своё преобразование.",
        "tags": [
          "json"
        ]
      },
      {
        "id": "out-16",
        "front": "На какой строке TypeScript покажет ошибку?\n\n```ts\ntype Animal = { name: string };\ntype Dog = Animal & { bark(): void };\n\nconst d: Dog = { name: \"Rex\", bark() {} };\nconst a1: Animal = d;                          // 1\nconst a2: Animal = { name: \"Rex\", bark() {} }; // 2\n```",
        "back": "Только на строке **2**.\n\nСтруктурная типизация разрешает лишние поля, поэтому `Dog` можно присвоить в `Animal` (строка 1). Но для **объектного литерала**, присваиваемого прямо в переменную с типом, работает excess property check: лишнее поле в литерале — скорее всего опечатка.",
        "tags": [
          "typescript",
          "excess property"
        ]
      },
      {
        "id": "out-17",
        "front": "Какие типы выведет TypeScript?\n\n```ts\nconst arr = [1, \"a\"];\nconst tup = [1, \"a\"] as const;\nlet s = \"hi\";\nconst c = \"hi\";\n```",
        "back": "- `arr`: `(string | number)[]`\n- `tup`: `readonly [1, \"a\"]`\n- `s`: `string` — `let` можно переприсвоить, поэтому тип расширяется (widening)\n- `c`: `\"hi\"` — `const` не изменится, остаётся литерал",
        "tags": [
          "typescript",
          "вывод типов"
        ]
      },
      {
        "id": "out-18",
        "front": "Чему равны типы?\n\n```ts\ntype A = { a: string; c: number };\ntype B = { b: string; c: number };\n\ntype K1 = keyof (A | B);\ntype K2 = keyof (A & B);\n\ntype X = { kind: \"x\" };\ntype Y = { kind: \"y\" };\ntype Z = X & Y;\n```",
        "back": "- `K1 = \"c\"` — у union доступны только **общие** ключи;\n- `K2 = \"a\" | \"b\" | \"c\"` — у пересечения есть **все** ключи;\n- `Z = never` — у `kind` несовместимые литералы `\"x\" & \"y\"`, и TypeScript сворачивает такое пересечение объектов целиком в `never`.\n\nЕсли конфликтуют не литералы (например, `{ v: string } & { v: number }`), объект остаётся, но поле `v` получает тип `never`.",
        "tags": [
          "typescript",
          "union",
          "ловушка"
        ]
      }
    ]
  },
  {
    "id": "next",
    "title": "Next.js",
    "description": "App Router, серверные компоненты, кэширование и Server Actions — по Next.js 16",
    "color": "slate",
    "icon": "globe",
    "cards": [
      {
        "id": "next-01",
        "front": "Какие специальные файлы есть в App Router и что делает каждый?",
        "back": "Папки в `app/` — это сегменты URL, а файлы внутри задают роли:\n\n- `page.tsx` — страница, делает сегмент доступным по адресу;\n- `layout.tsx` — общая обёртка, **сохраняется** между переходами;\n- `template.tsx` — как layout, но пересоздаётся при каждом переходе;\n- `loading.tsx` — fallback для Suspense, пока сегмент грузится;\n- `error.tsx` — граница ошибок сегмента (клиентский компонент);\n- `not-found.tsx` — UI для `notFound()` и несуществующих адресов;\n- `route.ts` — Route Handler: API-эндпоинт вместо страницы.\n\nПапки: `[slug]` — динамический сегмент, `(group)` — группа без влияния на URL, `_private` — исключена из роутинга.",
        "tags": [
          "app router",
          "основы"
        ]
      },
      {
        "id": "next-02",
        "front": "Чем `layout.tsx` отличается от `template.tsx`?",
        "back": "**Layout** живёт между переходами: не перемонтируется, состояние клиентских компонентов внутри сохраняется, эффекты не перезапускаются.\n\n**Template** получает уникальный key на каждый переход — дочерние клиентские компоненты пересоздаются, состояние сбрасывается, эффекты запускаются заново.\n\nTemplate нужен, когда при каждой навигации надо: перезапустить `useEffect` (например, аналитику), сбросить форму, показывать Suspense-fallback каждый раз, а не только при первой загрузке.",
        "tags": [
          "app router",
          "layout"
        ]
      },
      {
        "id": "next-03",
        "front": "Какие компоненты в App Router серверные, а какие клиентские по умолчанию?",
        "back": "По умолчанию **все серверные**. Они рендерятся на сервере, могут быть `async`, ходить в БД и читать секреты, а их код не попадает в бандл браузера.\n\nКлиентским модуль делает директива `\"use client\"` в начале файла — она отмечает границу: этот модуль и всё, что он импортирует, уходит в клиентский бандл. Клиентский компонент нужен для state, эффектов, обработчиков событий и браузерных API.\n\nСерверный компонент можно передать в клиентский через `children` или другие пропсы — он отрендерится на сервере.",
        "tags": [
          "rsc",
          "основы"
        ]
      },
      {
        "id": "next-04",
        "front": "Как получить параметры динамического маршрута в `page.tsx` в Next.js 15+?",
        "back": "`params` и `searchParams` — это **промисы**, их нужно дождаться:\n\n```tsx\n// app/blog/[slug]/page.tsx\nexport default async function Page({\n  params,\n  searchParams,\n}: {\n  params: Promise<{ slug: string }>;\n  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;\n}) {\n  const { slug } = await params;\n  const { page = \"1\" } = await searchParams;\n  return <h1>{slug}, страница {page}</h1>;\n}\n```\n\nВ клиентском компоненте — хуки `useParams()` и `useSearchParams()` из `next/navigation`.",
        "tags": [
          "app router",
          "params"
        ]
      },
      {
        "id": "next-05",
        "front": "Как работает `loading.tsx` и стриминг?",
        "back": "`loading.tsx` автоматически оборачивает страницу сегмента в `<Suspense fallback={<Loading />}>`. Сервер сразу отправляет layout и fallback, а содержимое страницы приходит **потоком** в том же ответе, когда данные готовы.\n\nДля более точного контроля оборачивают в `<Suspense>` отдельные медленные части страницы — тогда быстрые части видны сразу, а каждая медленная грузится независимо.",
        "tags": [
          "streaming",
          "loading"
        ]
      },
      {
        "id": "next-06",
        "front": "Как устроен `error.tsx`?",
        "back": "Это граница ошибок для сегмента и его потомков. Он **обязан быть клиентским** (`\"use client\"`).\n\n```tsx\n\"use client\";\n\nexport default function Error({ error, retry }: { error: unknown; retry: () => void }) {\n  return (\n    <div>\n      <p>Что-то пошло не так</p>\n      <button onClick={() => retry()}>Повторить</button>\n    </div>\n  );\n}\n```\n\n- `retry()` (стабилен с 16.3) заново запрашивает и рендерит содержимое; `reset()` только сбрасывает состояние ошибки без перезапроса.\n- В продакшене ошибки серверных компонентов приходят с общим сообщением и `digest`, чтобы не утекали детали.\n- Ошибки в корневом layout ловит `global-error.tsx`.",
        "tags": [
          "ошибки"
        ]
      },
      {
        "id": "next-07",
        "front": "Что такое Route Handlers?",
        "back": "Файл `route.ts` экспортирует функции по HTTP-методам и работает с Web API `Request`/`Response`:\n\n```ts\n// app/api/users/route.ts\nexport async function GET(request: Request) {\n  const users = await db.user.findMany();\n  return Response.json(users);\n}\n\nexport async function POST(request: Request) {\n  const body = await request.json();\n  const user = await db.user.create({ data: body });\n  return Response.json(user, { status: 201 });\n}\n```\n\n`route.ts` не может лежать в одном сегменте с `page.tsx` — оба отвечают на один URL. Для мутаций из своих форм обычно удобнее Server Actions. Route Handlers нужны для внешних клиентов, вебхуков и публичного API.",
        "tags": [
          "route handlers",
          "api"
        ]
      },
      {
        "id": "next-08",
        "front": "Что такое Server Actions и как их защищать?",
        "back": "Асинхронные функции с директивой `\"use server\"`, которые выполняются на сервере, а вызываются из формы или клиентского компонента:\n\n```tsx\n// app/actions.ts\n\"use server\";\n\nexport async function createPost(formData: FormData) {\n  const session = await auth();\n  if (!session?.user) throw new Error(\"Unauthorized\");\n  await db.post.create({ data: { title: String(formData.get(\"title\")) } });\n  revalidatePath(\"/posts\");\n}\n\n// <form action={createPost}>…</form>\n```\n\n**Безопасность**: экспортированный Server Action доступен прямым POST-запросом, а не только через твой UI. Поэтому проверяй аутентификацию, права и валидируй входные данные **внутри каждого** action — то, что форма скрыта от гостей, защитой не является.",
        "tags": [
          "server actions"
        ]
      },
      {
        "id": "next-09",
        "front": "Чем статический рендеринг отличается от динамического? Что делает маршрут динамическим?",
        "back": "**Статический** — HTML готовится при сборке (или ревалидации) и отдаётся из кэша/CDN всем одинаково. **Динамический** — рендер на каждый запрос.\n\nМаршрут становится динамическим, когда использует данные запроса: `cookies()`, `headers()`, `searchParams`, `connection()`, `draftMode()`, а в старой модели кэширования ещё и `fetch` с `cache: \"no-store\"` или `export const dynamic = \"force-dynamic\"`.\n\nС включёнными Cache Components (`cacheComponents: true`) по умолчанию работает **Partial Prerendering**: статическая оболочка страницы готовится заранее, а динамические части приходят потоком внутри `<Suspense>`.",
        "tags": [
          "rendering",
          "static",
          "dynamic"
        ]
      },
      {
        "id": "next-10",
        "front": "Кэшируется ли `fetch` в Next.js 15+ по умолчанию? Как включить кэш?",
        "back": "**Нет**, кэширование стало явным (в Next.js 14 было наоборот).\n\nСтарая модель (без Cache Components):\n\n```ts\nfetch(url, { cache: \"force-cache\" });           // кэшировать\nfetch(url, { next: { revalidate: 3600 } });     // кэш на час\nfetch(url, { next: { tags: [\"posts\"] } });      // тег для ревалидации\n```\n\nМодель Cache Components (`cacheComponents: true`) — директива `\"use cache\"` на функции, компоненте или файле, срок жизни через `cacheLife`, теги через `cacheTag`:\n\n```ts\nexport async function getPosts() {\n  \"use cache\";\n  cacheLife(\"hours\");\n  cacheTag(\"posts\");\n  return db.post.findMany();\n}\n```",
        "tags": [
          "кэширование",
          "fetch"
        ]
      },
      {
        "id": "next-11",
        "front": "Чем отличаются `revalidatePath`, `revalidateTag` и `updateTag`?",
        "back": "- `revalidatePath(\"/posts\")` — сбрасывает кэш конкретного маршрута, когда неизвестно, какие теги на нём.\n- `revalidateTag(\"posts\", \"max\")` — помечает данные с тегом устаревшими: следующий запрос получит **старые** данные, пока свежие обновляются в фоне (stale-while-revalidate). Подходит для блогов и каталогов. Работает в Server Actions и Route Handlers.\n- `updateTag(\"posts\")` — сразу удаляет кэш тега, следующий запрос **ждёт** свежие данные. Только в Server Actions: для сценария «создал пост — сразу вижу его в списке» (read-your-own-writes).",
        "tags": [
          "кэширование",
          "ревалидация"
        ]
      },
      {
        "id": "next-12",
        "front": "Как заранее сгенерировать страницы для динамических маршрутов?",
        "back": "`generateStaticParams` возвращает список параметров, страницы для них собираются при билде:\n\n```tsx\n// app/blog/[slug]/page.tsx\nexport async function generateStaticParams() {\n  const posts = await getPosts();\n  return posts.map((post) => ({ slug: post.slug }));\n}\n```\n\nЧто делать с адресами не из списка, решает `export const dynamicParams`:\n\n- `true` (по умолчанию) — сгенерировать страницу при первом запросе;\n- `false` — отдать 404.\n\nДля `output: \"export\"` (чистая статика без сервера) все пути обязаны быть известны при сборке.",
        "tags": [
          "статика",
          "generateStaticParams"
        ]
      },
      {
        "id": "next-13",
        "front": "Что такое `proxy.ts` и чем он стал в Next.js 16?",
        "back": "Это бывший `middleware.ts`: в Next.js 16 соглашение **переименовано** в `proxy` (функциональность та же, есть codemod). Код выполняется **до** рендера маршрута и может сделать redirect, rewrite, поменять заголовки и cookies или сразу ответить.\n\n```ts\n// proxy.ts в корне проекта\nimport { NextResponse, type NextRequest } from \"next/server\";\n\nexport function proxy(request: NextRequest) {\n  if (!request.cookies.has(\"session\")) {\n    return NextResponse.redirect(new URL(\"/login\", request.url));\n  }\n}\n\nexport const config = { matcher: [\"/dashboard/:path*\"] };\n```\n\nПо умолчанию работает в Node.js runtime. Подходит для быстрых проверок и редиректов; полноценную авторизацию всё равно повторяют рядом с данными.",
        "tags": [
          "proxy",
          "middleware"
        ]
      },
      {
        "id": "next-14",
        "front": "Как работают `<Link>` и prefetch в Next.js?",
        "back": "`<Link>` делает клиентский переход без перезагрузки: layout сохраняется, подгружается только нужный RSC-payload.\n\nNext.js **автоматически предзагружает** маршруты ссылок, которые попали в видимую область экрана, поэтому переход ощущается мгновенным. Prefetch включён **только в продакшене** — в `next dev` его нет. Для программной навигации — `useRouter()` из `next/navigation` (`router.push`, `router.refresh`).\n\nЧастая ошибка в App Router — импорт `useRouter` из `next/router`: он остался только для Pages Router.",
        "tags": [
          "навигация",
          "prefetch"
        ]
      },
      {
        "id": "next-15",
        "front": "Что даёт компонент `next/image` по сравнению с `<img>`?",
        "back": "- Автоматически отдаёт картинку нужного размера под устройство и в современных форматах (WebP, AVIF).\n- **Нет сдвига вёрстки (CLS)**: у статически импортированных картинок размеры известны при сборке, для внешних нужно указать `width`/`height` или `fill`.\n- Ленивая загрузка (native lazy loading) и опциональный blur-плейсхолдер.\n\nДля картинки первого экрана (LCP) её лучше загружать с приоритетом, а не лениво.",
        "tags": [
          "оптимизация",
          "изображения"
        ]
      },
      {
        "id": "next-16",
        "front": "Зачем `next/font`?",
        "back": "Шрифты **скачиваются при сборке и раздаются с твоего домена** — браузер пользователя не ходит на Google Fonts (быстрее и без утечки данных третьей стороне). Next.js подбирает fallback-шрифт с похожими метриками, поэтому при загрузке нет скачка вёрстки.\n\n```tsx\nimport { Inter } from \"next/font/google\";\n\nconst inter = Inter({ subsets: [\"latin\", \"cyrillic\"], variable: \"--font-inter\" });\n// <html className={inter.variable}>\n```\n\nМинус: сборке нужен доступ к Google Fonts. Без сети используют `next/font/local` или npm-пакеты шрифтов.",
        "tags": [
          "оптимизация",
          "шрифты"
        ]
      },
      {
        "id": "next-17",
        "front": "Как задать title, description и Open Graph в App Router?",
        "back": "Экспортом объекта `metadata` или функции `generateMetadata` из `layout.tsx`/`page.tsx` (только в серверных компонентах):\n\n```tsx\nexport const metadata = { title: \"Блог\", description: \"Статьи о фронтенде\" };\n\nexport async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {\n  const { slug } = await params;\n  const post = await getPost(slug);\n  return { title: post.title, openGraph: { images: [post.cover] } };\n}\n```\n\nМетаданные вложенных сегментов сливаются с родительскими. Для `<title>` удобен шаблон `title: { template: \"%s · Блог\", default: \"Блог\" }`.",
        "tags": [
          "metadata",
          "seo"
        ]
      },
      {
        "id": "next-18",
        "front": "Что такое параллельные и перехватывающие маршруты?",
        "back": "**Параллельные** (`@slot`) — несколько страниц в одном layout одновременно: `app/@feed/page.tsx` и `app/@stats/page.tsx` приходят в layout как пропсы `feed` и `stats`. Для слотов без совпадения нужен `default.tsx`.\n\n**Перехватывающие** (`(.)photo`, `(..)photo`, `(...)photo`) — показывают другой маршрут в текущем контексте при клиентском переходе.\n\nКлассика — модалка: клик по фото в ленте открывает его в модалке поверх ленты, а прямой заход на `/photo/1` или обновление страницы показывают полноценную страницу фото.",
        "tags": [
          "роутинг",
          "модалки"
        ]
      },
      {
        "id": "next-19",
        "front": "Как подключить Context-провайдер (тема, Redux, React Query), если layout серверный?",
        "back": "Context работает только в клиентских компонентах. Провайдер выносят в отдельный клиентский компонент и оборачивают им `children`:\n\n```tsx\n// app/providers.tsx\n\"use client\";\n\nexport function Providers({ children }: { children: React.ReactNode }) {\n  const [queryClient] = useState(() => new QueryClient());\n  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;\n}\n\n// app/layout.tsx (серверный)\n<body><Providers>{children}</Providers></body>\n```\n\nСтраницы, переданные через `children`, остаются серверными. Провайдер ставят как можно глубже в дереве.",
        "tags": [
          "rsc",
          "провайдеры"
        ]
      },
      {
        "id": "next-20",
        "front": "Как отключить SSR для компонента (например, для карты, которая требует `window`)?",
        "back": "Через `next/dynamic` с `ssr: false`, причём **внутри клиентского компонента** — в серверном эта опция не работает:\n\n```tsx\n\"use client\";\nimport dynamic from \"next/dynamic\";\n\nconst Map = dynamic(() => import(\"./Map\"), {\n  ssr: false,\n  loading: () => <p>Загружаем карту…</p>,\n});\n```\n\nКомпонент загрузится отдельным чанком только в браузере. Альтернатива для мелочей — читать `window` в `useEffect`.",
        "tags": [
          "ленивая загрузка"
        ]
      },
      {
        "id": "next-21",
        "front": "Как передавать данные из серверного компонента в клиентский и что нельзя передать?",
        "back": "Через пропсы, но они должны **сериализоваться**: примитивы, простые объекты и массивы, `Date`, `Map`, `Set`, промисы (их можно прочитать через `use()`), JSX, Server Actions.\n\nНельзя: обычные функции и обработчики, экземпляры классов, символы (кроме созданных через `Symbol.for`).\n\n```tsx\n// серверный\nconst post = await getPost(id);\nreturn <LikeButton postId={post.id} initialLikes={post.likes} />;\n```\n\nХорошая практика — передавать минимум данных: только то, что нужно клиентскому компоненту.",
        "tags": [
          "rsc",
          "данные"
        ]
      }
    ]
  },
  {
    "id": "css",
    "title": "CSS и вёрстка",
    "description": "Каскад, flex и grid, позиционирование, слои наложения, адаптивность",
    "color": "slate",
    "icon": "code",
    "cards": [
      {
        "id": "css-01",
        "front": "Как считается специфичность селектора?",
        "back": "Тройка `(id, класс, тег)`, сравнивается слева направо:\n\n- **id**: `#header` → `(1, 0, 0)`\n- **классы, атрибуты, псевдоклассы**: `.btn`, `[type=\"text\"]`, `:hover` → `(0, 1, 0)`\n- **теги и псевдоэлементы**: `div`, `::before` → `(0, 0, 1)`\n\n`#nav .link:hover` = `(1, 2, 0)` — победит любое число классов без id. Инлайн-стиль `style=\"\"` сильнее селекторов, `!important` — сильнее инлайна. `*` и комбинаторы (`>`, `+`, `~`) специфичности не добавляют.",
        "tags": [
          "специфичность"
        ]
      },
      {
        "id": "css-02",
        "front": "Чем отличаются `:is()` и `:where()`?",
        "back": "Оба принимают список селекторов и сокращают запись:\n\n```css\n:is(header, footer) a:hover { … }\n```\n\nРазница в специфичности:\n\n- `:is()` берёт специфичность **самого сильного** селектора из списка: `:is(#id, .cls)` весит как id;\n- `:where()` всегда даёт **ноль**.\n\nПоэтому `:where()` удобен для базовых стилей в библиотеках и ресетах — их легко перебить любым классом.",
        "tags": [
          "специфичность",
          "селекторы"
        ]
      },
      {
        "id": "css-03",
        "front": "В каком порядке каскад решает, какое правило победит? Как работают `@layer`?",
        "back": "1. Происхождение и важность (стили браузера → автора; `!important` переворачивает порядок).\n2. **Каскадные слои** `@layer`.\n3. Специфичность.\n4. Порядок в коде: при равенстве побеждает последнее правило.\n\n```css\n@layer reset, base, components;\n@layer components { .btn { color: blue; } }\n.btn { color: red; } /* без слоя — победит, даже при меньшей специфичности */\n```\n\nОбычные стили **без слоя сильнее любых слоёв**, а слои между собой — в порядке объявления. С `!important` всё наоборот: важное правило из слоя бьёт важное без слоя. Так устроен Tailwind v4: утилиты в `@layer utilities`.",
        "tags": [
          "каскад",
          "layers"
        ]
      },
      {
        "id": "css-04",
        "front": "Что такое box model и `box-sizing`?",
        "back": "Элемент состоит из content → padding → border → margin.\n\n- `content-box` (по умолчанию): `width` — это только контент. `width: 100px; padding: 10px; border: 5px` даёт ширину **130px**.\n- `border-box`: `width` включает padding и border — ровно 100px, контент сжимается.\n\nПочти все проекты делают `*, *::before, *::after { box-sizing: border-box; }` — размеры становятся предсказуемыми.",
        "tags": [
          "box model"
        ]
      },
      {
        "id": "css-05",
        "front": "Что такое схлопывание отступов (margin collapse)?",
        "back": "Вертикальные margin соседних блоков **не складываются**, берётся больший: `margin-bottom: 20px` + `margin-top: 30px` = **30px** между блоками.\n\nЕщё случай: margin первого ребёнка «вытекает» наружу родителя, если у родителя нет padding, border или своего контекста форматирования.\n\nНе схлопываются: горизонтальные отступы, элементы flex и grid, абсолютно позиционированные и float-элементы.",
        "tags": [
          "margin"
        ]
      },
      {
        "id": "css-06",
        "front": "Чем отличаются `position: relative`, `absolute`, `fixed` и `sticky`?",
        "back": "- `relative` — остаётся в потоке, сдвигается `top/left` относительно своего места; становится опорой для `absolute`-детей.\n- `absolute` — вынут из потока, позиционируется относительно ближайшего предка с `position` не `static`.\n- `fixed` — относительно окна (viewport), не двигается при прокрутке.\n- `sticky` — ведёт себя как `relative`, пока не достигнет порога `top`, затем «прилипает» в пределах родителя.\n\nЛовушки: `fixed` внутри предка с `transform`, `filter` или `perspective` позиционируется относительно **этого предка**, а не окна. `sticky` не работает, если у предка `overflow: hidden` или не задан порог `top`.",
        "tags": [
          "позиционирование"
        ]
      },
      {
        "id": "css-07",
        "front": "Почему `z-index: 9999` не поднимает элемент над соседним блоком?",
        "back": "`z-index` работает только внутри своего **контекста наложения** (stacking context). Если родитель создал контекст с `z-index: 1`, то всё его содержимое — даже с `z-index: 9999` — лежит ниже соседнего блока с `z-index: 2`.\n\nКонтекст создают: `position` + `z-index` (не `auto`), `opacity < 1`, `transform`, `filter`, `will-change`, `isolation: isolate`, flex- и grid-дети с `z-index`, `position: fixed/sticky`.\n\nРешение: поднимать сам родительский контекст или вынести элемент через портал в `body`.",
        "tags": [
          "z-index",
          "stacking context"
        ]
      },
      {
        "id": "css-08",
        "front": "Что означает `flex: 1`? Почему flex-элемент с длинным текстом вылезает за контейнер?",
        "back": "`flex: 1` = `flex-grow: 1; flex-shrink: 1; flex-basis: 0%` — элементы делят свободное место поровну.\n\nУ flex-элементов по умолчанию `min-width: auto` — они **не сжимаются меньше своего содержимого**. Длинное слово, `white-space: nowrap` или широкий `<pre>` распирают элемент и ломают вёрстку.\n\nЛечится `min-width: 0` (или `overflow: hidden`) на flex-элементе — тогда сработает `text-overflow: ellipsis` или переносы. В grid то же самое: `minmax(0, 1fr)` вместо `1fr`.",
        "tags": [
          "flexbox"
        ]
      },
      {
        "id": "css-09",
        "front": "Чем `auto-fill` отличается от `auto-fit` в `repeat()`?",
        "back": "```css\ngrid-template-columns: repeat(auto-fill, minmax(200px, 1fr));\n```\n\nОба создают столько колонок, сколько поместится. Разница, когда элементов **мало**:\n\n- `auto-fill` оставляет пустые дорожки — элементы сохраняют ширину, справа пустое место;\n- `auto-fit` схлопывает пустые дорожки до нуля — элементы **растягиваются** на всю ширину.\n\nЭто самый короткий способ сделать адаптивную сетку карточек без медиазапросов.",
        "tags": [
          "grid"
        ]
      },
      {
        "id": "css-10",
        "front": "Когда использовать flex, а когда grid?",
        "back": "- **Flex** — одномерный: раскладка в строку **или** колонку, размеры идут от содержимого. Навбары, кнопки с иконкой, выравнивание в ряд.\n- **Grid** — двумерный: строки **и** колонки сразу, размеры задаёт контейнер. Макеты страниц, сетки карточек, формы с выравниванием по колонкам.\n\nОни отлично комбинируются: grid задаёт каркас, а внутри ячеек — flex.",
        "tags": [
          "flex",
          "grid"
        ]
      },
      {
        "id": "css-11",
        "front": "Какие есть способы отцентрировать блок по горизонтали и вертикали?",
        "back": "```css\n/* grid — короче всего */\n.parent { display: grid; place-items: center; }\n\n/* flex */\n.parent { display: flex; justify-content: center; align-items: center; }\n\n/* абсолютное позиционирование */\n.child { position: absolute; inset: 0; margin: auto; width: 200px; height: 100px; }\n/* или когда размеры неизвестны */\n.child { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }\n```\n\nТолько по горизонтали блочный элемент с шириной: `margin-inline: auto`.",
        "tags": [
          "выравнивание"
        ]
      },
      {
        "id": "css-12",
        "front": "Чем отличаются `px`, `em`, `rem`, `%`, `vh` и `dvh`?",
        "back": "- `px` — абсолютные пиксели CSS.\n- `em` — от размера шрифта **текущего элемента** (для `font-size` — родителя); вложенные `em` накапливаются.\n- `rem` — от размера шрифта корня `html`; масштабируется вместе с настройкой шрифта браузера — хорошо для доступности.\n- `%` — от размера родителя (по-разному для разных свойств).\n- `vh` — 1% высоты окна. На мобильных `100vh` выше видимой области из-за панелей браузера.\n- `dvh` — динамическая высота, учитывает появление и скрытие панелей; `svh` и `lvh` — минимальная и максимальная.",
        "tags": [
          "единицы"
        ]
      },
      {
        "id": "css-13",
        "front": "Чем container queries отличаются от media queries?",
        "back": "**Media queries** реагируют на размер **окна**. **Container queries** — на размер **родителя-контейнера**, поэтому компонент адаптируется к месту, куда его поставили: узкая колонка или широкий блок.\n\n```css\n.card-wrap { container-type: inline-size; }\n\n@container (min-width: 400px) {\n  .card { display: grid; grid-template-columns: 120px 1fr; }\n}\n```\n\nОдна и та же карточка будет горизонтальной в широком блоке и вертикальной в сайдбаре — без знания о макете страницы.",
        "tags": [
          "адаптивность"
        ]
      },
      {
        "id": "css-14",
        "front": "Чем CSS-переменные отличаются от переменных Sass?",
        "back": "Sass-переменные заменяются **при компиляции** и в браузере не существуют.\n\nCSS custom properties живут **в рантайме**:\n\n- наследуются по DOM-дереву;\n- переопределяются в любом селекторе и медиазапросе;\n- меняются из JS: `el.style.setProperty(\"--x\", \"10px\")`.\n\n```css\n:root { --bg: #fff; }\n[data-theme=\"dark\"] { --bg: #141417; }\nbody { background: var(--bg, white); } /* второй аргумент — запасное значение */\n```\n\nНа этом построены темы без перезагрузки и дизайн-токены.",
        "tags": [
          "переменные",
          "темизация"
        ]
      },
      {
        "id": "css-15",
        "front": "Что такое псевдокласс `:has()`?",
        "back": "«Родительский селектор»: выбирает элемент, **если внутри** (или после него) есть подходящий элемент.\n\n```css\n/* карточка, в которой есть картинка */\n.card:has(img) { padding: 0; }\n\n/* поле формы с невалидным инпутом */\n.field:has(input:invalid) label { color: red; }\n\n/* заблокировать прокрутку, когда открыт диалог */\nbody:has(dialog[open]) { overflow: hidden; }\n```\n\nРаньше такое делали только через JS. Поддерживается всеми современными браузерами.",
        "tags": [
          "селекторы",
          "has"
        ]
      },
      {
        "id": "css-16",
        "front": "Чем отличаются `display: none`, `visibility: hidden` и `opacity: 0`?",
        "back": "| | Место | Клики | Скринридер |\n|---|---|---|---|\n| `display: none` | нет | нет | не читает |\n| `visibility: hidden` | занимает | нет | не читает |\n| `opacity: 0` | занимает | **да** | читает |\n\nЕщё отличие: ребёнок с `visibility: visible` внутри `visibility: hidden` родителя **будет виден**, а у `opacity` так не выйдет. Для «скрыть визуально, но оставить скринридерам» используют класс `sr-only`.",
        "tags": [
          "скрытие",
          "доступность"
        ]
      },
      {
        "id": "css-17",
        "front": "Какие свойства наследуются? Что делают `inherit`, `initial`, `unset`, `revert`?",
        "back": "Наследуются в основном **текстовые** свойства: `color`, `font-*`, `line-height`, `text-align`, `visibility`, `cursor`. Не наследуются блочные: `margin`, `padding`, `border`, `background`, `width`, `display`.\n\n- `inherit` — взять значение родителя;\n- `initial` — начальное значение из спецификации (для `display` это `inline`, даже у `div`);\n- `unset` — `inherit` для наследуемых, `initial` для остальных;\n- `revert` — вернуть стиль браузера по умолчанию (у `div` снова будет `block`).",
        "tags": [
          "наследование"
        ]
      },
      {
        "id": "css-18",
        "front": "Что такое контекст форматирования блока (BFC) и зачем он нужен?",
        "back": "Изолированная область вёрстки: то, что внутри, не влияет на то, что снаружи.\n\nBFC:\n\n- **содержит float-детей** — родитель не схлопывается до нуля по высоте;\n- не даёт margin детей схлопываться с margin родителя;\n- не заходит под соседний float.\n\nСоздают его: `display: flow-root` (специально для этого), `overflow: hidden/auto/scroll` (но не `clip`!), `position: absolute/fixed`, `float`, `display: inline-block`. Flex- и grid-контейнеры создают свои контексты форматирования с тем же эффектом изоляции.",
        "tags": [
          "bfc"
        ]
      },
      {
        "id": "css-19",
        "front": "Как сделать адаптивные изображения?",
        "back": "```html\n<img\n  src=\"photo-800.jpg\"\n  srcset=\"photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w\"\n  sizes=\"(max-width: 600px) 100vw, 50vw\"\n  width=\"800\" height=\"600\"\n  loading=\"lazy\"\n  alt=\"Описание\"\n/>\n```\n\n- `srcset` + `sizes` — браузер сам выберет файл под ширину экрана и плотность пикселей;\n- `<picture>` с `<source>` — разные форматы (AVIF, WebP) или разная обрезка (art direction);\n- `width`/`height` или `aspect-ratio` резервируют место и предотвращают сдвиг вёрстки (CLS);\n- `object-fit: cover` — заполнить блок без искажения пропорций.",
        "tags": [
          "изображения",
          "адаптивность"
        ]
      },
      {
        "id": "css-20",
        "front": "Что в CSS важно для доступности?",
        "back": "- **Не убирать фокус**: вместо `outline: none` использовать `:focus-visible` — обводка видна при навигации с клавиатуры, но не при клике мышью.\n- **Контраст** текста к фону — не ниже 4.5:1 для обычного текста (WCAG AA).\n- `prefers-reduced-motion` — отключать или ослаблять анимации для тех, у кого включено «уменьшить движение».\n- Размер шрифта в `rem`, чтобы работало увеличение шрифта в браузере.\n- Цвет не должен быть единственным носителем смысла: ошибку обозначают ещё иконкой или текстом.\n- Крупные области нажатия на мобильных (около 44×44px).",
        "tags": [
          "доступность"
        ]
      }
    ]
  }
];
