---
id: prisma
title: Prisma
description: Схема, связи, запросы, транзакции и что нового в Prisma 7
color: indigo
icon: triangle
---

@@@ prisma-01 | основы
Что такое Prisma и из чего она состоит?
???
**Prisma** — ORM для Node.js и TypeScript. ORM (Object-Relational Mapping) позволяет работать с базой данных через обычные вызовы функций и объекты в коде, а не писать SQL руками.

```ts
const user = await prisma.user.findUnique({ where: { email: "ann@mail.ru" } });
// вместо: SELECT * FROM "User" WHERE email = $1
```

Состоит из нескольких частей:

- **Prisma Schema** (`schema.prisma`) — единый файл, где описаны модели (таблицы), их поля, связи и подключение к базе. Это источник правды о структуре данных.
- **Prisma Client** — библиотека для запросов, которая **генерируется** по схеме командой `prisma generate`. Поэтому у неё точные типы: `prisma.user` знает все поля модели `User`.
- **Prisma Migrate** — превращает изменения схемы в SQL-миграции и применяет их к базе.
- **Prisma Studio** — визуальный просмотр и редактирование данных в браузере.

**Главный плюс — типобезопасность.** Тип результата выводится прямо из запроса:

```ts
const u = await prisma.user.findUnique({
  where: { id },
  select: { email: true, posts: { select: { title: true } } },
});
// тип u: { email: string; posts: { title: string }[] } | null
```

Опечатка в имени поля, неверный тип в фильтре или обращение к полю, которое не выбрали, — ошибка компиляции, а не падение в продакшене. Плюс автодополнение в редакторе.

Цена — абстракция: не всё из SQL выражается через API, и важно понимать, какие запросы Prisma генерирует под капотом.

@@@ prisma-02 | схема, связи
Как описать модель со связью один-ко-многим?
???
Пример: у пользователя много привычек, у привычки один владелец.

```prisma
model User {
  id     String  @id @default(cuid())
  email  String  @unique
  habits Habit[]
}

model Habit {
  id     String @id @default(cuid())
  title  String
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Разберём поля связи:

- **`userId String`** — настоящая колонка в таблице `Habit`, **внешний ключ**. В ней хранится id владельца.
- **`user User @relation(...)`** — **виртуальное** поле связи. В таблице его нет; оно нужно Prisma Client, чтобы можно было написать `include: { user: true }`. В `@relation` указано: «колонка `userId` ссылается на `id` в `User`».
- **`habits Habit[]`** в `User` — обратная сторона связи, тоже виртуальная. Позволяет получить `user.habits`.
- **`onDelete: Cascade`** — при удалении пользователя удалятся и его привычки.
- **`@@index([userId])`** — индекс по внешнему ключу. PostgreSQL не создаёт его автоматически, а без него запрос «привычки пользователя» будет сканировать всю таблицу.

Правило: внешний ключ (`fields` и `references`) всегда на стороне «многих» — у привычки, а не у пользователя.

Использование:

```ts
const user = await prisma.user.findUnique({ where: { id }, include: { habits: true } });

await prisma.habit.create({ data: { title: "Бег", userId: user.id } });
```

@@@ prisma-03 | схема, связи
Как сделать связь многие-ко-многим?
???
Пример: у поста много тегов, у тега много постов. В базе для этого всегда нужна **связующая таблица** с парами `(postId, tagId)`. В Prisma есть два способа её описать.

**Неявная связь** — просто указываешь списки с обеих сторон, Prisma сама создаёт и обслуживает связующую таблицу:

```prisma
model Post {
  id   Int   @id @default(autoincrement())
  tags Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

```ts
await prisma.post.update({
  where: { id: 1 },
  data: { tags: { connect: [{ id: 3 }, { id: 4 }] } },
});
const post = await prisma.post.findUnique({ where: { id: 1 }, include: { tags: true } });
```

Удобно, но в связующую таблицу нельзя добавить свои поля.

**Явная связь** — своя модель-связка. Нужна, когда у связи есть **данные**: роль участника в команде, дата вступления, порядок:

```prisma
model Membership {
  userId   String
  teamId   String
  role     String
  joinedAt DateTime @default(now())
  user     User     @relation(fields: [userId], references: [id])
  team     Team     @relation(fields: [teamId], references: [id])

  @@id([userId, teamId])
}
```

`@@id([userId, teamId])` — составной первичный ключ: одна и та же пара не может встретиться дважды.

При явной связи запросы идут через промежуточную модель: `include: { memberships: { include: { team: true } } }`.

Выбор: если у связи нет своих данных — неявная. Если есть или скоро появятся — сразу явная: переделывать потом сложнее.

@@@ prisma-04 | миграции
Чем отличаются `prisma migrate dev`, `migrate deploy` и `db push`?
???
**Миграция** — SQL-файл, который переводит базу из одного состояния в другое («добавить колонку `phone`»). Миграции хранятся в `prisma/migrations` и применяются по порядку, поэтому любую базу можно привести к актуальной структуре.

**`prisma migrate dev`** — для разработки:

1. сравнивает схему с базой;
2. **генерирует** новый SQL-файл миграции;
3. применяет его к локальной базе.

Если обнаружит расхождение (базу меняли руками), предложит сбросить её — для локальной базы это нормально.

**`prisma migrate deploy`** — для CI и продакшена:

- **только применяет** уже готовые миграции, которых ещё нет в базе;
- ничего не генерирует и никогда не сбрасывает базу — безопасно для боевых данных.

**`prisma db push`** — синхронизирует базу со схемой **без файлов миграций**:

- быстро для прототипов и экспериментов;
- истории изменений нет — нельзя повторить на другой базе;
- при конфликте может удалить колонки вместе с данными.

Типичный процесс:

```
поменял schema.prisma → migrate dev --name add_phone → закоммитил миграцию
→ CI на деплое: migrate deploy
```

Папку `prisma/migrations` обязательно коммитят в git: это история структуры базы, по которой продакшен и коллеги получают те же изменения.

@@@ prisma-05 | запросы
Чем `include` отличается от `select`?
???
Оба управляют тем, **какие данные** вернёт запрос.

**`include`** — «все обычные поля модели **плюс** указанные связи»:

```ts
const user = await prisma.user.findUnique({
  where: { id },
  include: { posts: true },
});
// все поля User (id, email, name, password…) + posts
```

**`select`** — «**только** перечисленные поля», ничего лишнего:

```ts
const user = await prisma.user.findUnique({
  where: { id },
  select: { email: true, name: true },
});
// только { email, name }
```

Зачем `select`:

- по сети и в память уходит меньше данных — важно для больших таблиц и списков;
- не утекают лишние поля (пароль, служебные данные) — например, в ответ API;
- тип результата точно отражает, что выбрано.

На одном уровне `select` и `include` вместе использовать нельзя. Но их можно **вкладывать**, и внутри связей доступны фильтры, сортировка и лимиты:

```ts
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    email: true,
    habits: { select: { title: true }, where: { archived: false } },
  },
});
// тип: { email: string; habits: { title: string }[] } | null
```

Правило: для отдачи данных клиенту или в UI — `select` с нужными полями. `include` удобен во внутренней логике, когда нужна запись целиком вместе со связью.

@@@ prisma-06 | typescript
Как получить TS-тип результата запроса с `include`?
???
Prisma экспортирует **базовые типы моделей** — `User`, `Habit` — но они содержат только поля самой модели, без связей. Если функция возвращает пользователя вместе с привычками, нужен другой тип.

Для этого есть генерируемый помощник `Prisma.<Model>GetPayload` — он вычисляет тип результата по аргументам запроса:

```ts
import { Prisma } from "../generated/prisma/client";

const withHabits = {
  include: { habits: true },
} satisfies Prisma.UserDefaultArgs;

type UserWithHabits = Prisma.UserGetPayload<typeof withHabits>;
// User & { habits: Habit[] }

async function getUser(id: string): Promise<UserWithHabits | null> {
  return prisma.user.findUnique({ where: { id }, ...withHabits });
}

function HabitList({ user }: { user: UserWithHabits }) {
  return user.habits.map((h) => <li key={h.id}>{h.title}</li>);
}
```

Что здесь важно:

- аргументы запроса вынесены в константу и **переиспользуются** — и в запросе, и в типе. Изменишь `include` — тип обновится сам;
- `satisfies Prisma.UserDefaultArgs` проверяет, что объект — допустимые аргументы для модели `User`, но сохраняет точный тип для `GetPayload`.

Альтернатива — вывести тип из функции: `type UserWithHabits = NonNullable<Awaited<ReturnType<typeof getUser>>>`. Удобно, когда запрос уже написан.

Так не приходится вручную описывать интерфейсы, которые рано или поздно разойдутся со схемой.

@@@ prisma-07 | производительность, n+1
Как в Prisma избежать проблемы N+1?
???
Загружать связи через `include` / `select`, а не отдельными запросами в цикле. Prisma сама соберёт связанные записи **одним запросом на уровень связи** (`WHERE id IN (…)`), а не по запросу на каждую запись.

```ts
// ✗ N+1: запрос автора для каждого поста
for (const post of posts) {
  post.author = await prisma.user.findUnique({ where: { id: post.authorId } });
}

// ✓ два запроса на всё
const posts = await prisma.post.findMany({ include: { author: true } });
```

Получить связи одним SQL-запросом с JOIN можно опцией `relationLoadStrategy: "join"` — в Prisma 7 она доступна за preview-флагом `relationJoins` в генераторе. Параллельные вызовы `findUnique` в одном тике Prisma объединяет в один запрос сама.

Во втором варианте Prisma делает запрос за постами, собирает все `authorId` и одним запросом загружает нужных пользователей. 100 постов — 2 запроса вместо 101.

Как заметить N+1: включить `log: ["query"]` и посмотреть, нет ли десятков одинаковых запросов подряд.

@@@ prisma-08 | транзакции
Как сделать транзакцию в Prisma?
???
Два варианта:

```ts
// последовательные операции: всё или ничего
await prisma.$transaction([
  prisma.account.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } }),
  prisma.account.update({ where: { id: 2 }, data: { balance: { increment: 100 } } }),
]);

// интерактивная: логика между запросами
await prisma.$transaction(async (tx) => {
  const from = await tx.account.findUniqueOrThrow({ where: { id: 1 } });
  if (from.balance < 100) throw new Error("Недостаточно средств"); // откат
  await tx.account.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } });
});
```

Вложенные записи (`create` с вложенным `create`) тоже выполняются атомарно.

Когда что: массив — когда запросы известны заранее и не зависят от результатов друг друга. Интерактивная — когда нужно что-то прочитать, проверить и решить, что делать дальше.

Важно в интерактивной транзакции: все запросы внутри — через `tx`, а не `prisma`. Запрос через `prisma` выполнится **вне** транзакции и не откатится. И держи её короткой: внутри не должно быть HTTP-запросов и долгих вычислений — транзакция держит соединение и блокировки (по умолчанию таймаут 5 секунд).

@@@ prisma-09 | запросы, upsert
Как создать запись, если её нет, и атомарно увеличить счётчик?
???
```ts
await prisma.stat.upsert({
  where: { userId },
  update: { views: { increment: 1 } },
  create: { userId, views: 1 },
});
```

- `increment`, `decrement`, `multiply`, `divide` выполняются **в БД** одним `UPDATE … SET views = views + 1` — без гонки «прочитал → прибавил → записал».
- В `where` у `upsert` нужно уникальное поле (`@id` или `@unique`).
- Если запрос подходит под условия, Prisma превращает `upsert` в нативный `INSERT … ON CONFLICT` — тогда он атомарный и не падает при параллельных вызовах. Иначе возможна ошибка уникальности P2002 при гонке, и запрос стоит повторить.

Неправильно: `const s = await findUnique(); await update({ data: { views: s.views + 1 } })` — два параллельных запроса потеряют одно увеличение.

Почему теряется: оба запроса прочитали `views = 10`, оба записали `11`. Должно быть 12. С `increment` база сама прибавляет к текущему значению в момент записи, поэтому каждый запрос учитывается.

@@@ prisma-10 | sql, безопасность
Как безопасно выполнить сырой SQL в Prisma?
???
Иногда API Prisma не хватает: оконные функции, рекурсивные CTE, полнотекстовый поиск, сложные отчёты. Тогда пишут SQL вручную.

**Безопасный способ — шаблонный тег `$queryRaw`:**

```ts
const users = await prisma.$queryRaw<User[]>`
  SELECT * FROM "User" WHERE email = ${email}
`;
```

Выглядит как обычная шаблонная строка, но это **тегированный шаблон**: Prisma получает текст SQL и значения **раздельно** и превращает каждую подстановку `${…}` в параметр `$1`, `$2`. База получает значения отдельно от кода запроса, поэтому SQL-инъекция невозможна.

**Опасно:**

```ts
prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE email = '${email}'`); // ✗
prisma.$queryRaw(Prisma.raw(`… '${email}'`));                             // ✗
```

Здесь строка склеивается **до** передачи в Prisma, и `email = "' OR 1=1 --"` изменит смысл запроса.

Ещё нюансы:

- `$queryRaw` — для `SELECT`, возвращает строки; `$executeRaw` — для `INSERT`/`UPDATE`/`DELETE`, возвращает число затронутых строк;
- имена таблиц и колонок параметром передать нельзя — их выбирают из белого списка и вставляют через `Prisma.sql` и `Prisma.raw` осторожно;
- тип результата `<User[]>` — только обещание, Prisma его не проверяет.

**TypedSQL** — более удобный вариант: запросы лежат в `.sql`-файлах, а Prisma генерирует для них функции с точными типами параметров и результата.

@@@ prisma-11 | next, соединения
Почему в Next.js PrismaClient делают синглтоном?
???
**Синглтон** — один-единственный экземпляр на всё приложение.

Каждый вызов `new PrismaClient()` создаёт **свой пул соединений** с базой. Если создавать клиент в каждом модуле или запросе, соединений становится всё больше.

Особенно это заметно в разработке: при каждом сохранении файла hot reload **перезагружает модули**. Модуль с `new PrismaClient()` выполняется заново, старый клиент остаётся висеть со своими соединениями. После нескольких десятков правок PostgreSQL отвечает `too many connections`.

Решение — хранить экземпляр в `globalThis`, который переживает перезагрузку модулей:

```ts
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Как работает: при первой загрузке `globalForPrisma.prisma` пустой — создаём клиент и сохраняем. При перезагрузке модуля берём уже готовый из `globalThis`.

В продакшене модули не перезагружаются, поэтому сохранять в `globalThis` не нужно — модуль и так выполнится один раз на процесс.

В serverless (Vercel) у каждой функции свой процесс со своим клиентом, и при нагрузке процессов много. Там нужен пулер соединений: PgBouncer, pooled-URL у Neon или Supabase, Prisma Accelerate.

@@@ prisma-12 | prisma 7
Что изменилось в Prisma 7?
???
- **Клиент без Rust-движка.** Раньше запросы проходили через отдельный бинарный движок на Rust. Теперь клиент написан на TypeScript, а к базе подключается через **driver adapter** — обычный Node-драйвер (`@prisma/adapter-pg` для PostgreSQL и другие). Бандл меньше, быстрее холодный старт, работает в edge и serverless.
- **Генератор `prisma-client` с обязательным `output`.** Клиент генерируется в папку проекта, а не прячется в `node_modules`. Импорт идёт из своего пути: `../generated/prisma/client`.
- **`prisma.config.ts`.** Настройки CLI — путь к схеме, миграции, сид, URL базы — переехали в TypeScript-файл конфигурации.
- **`.env` не подгружается автоматически.** Переменные окружения загружают явно, например `import "dotenv/config"` в конфиге.
- **ESM по умолчанию.**
- **Удалён middleware `$use`** — вместо него Client Extensions (`$extends`).

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
```

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: env("DATABASE_URL") },
});
```

При переходе с Prisma 6 нужно: поменять генератор, указать `output`, поправить импорты клиента, подключить адаптер и перенести URL базы в конфиг.

@@@ prisma-13 | cli
Когда нужно запускать `prisma generate`?
???
`prisma generate` читает `schema.prisma` и **генерирует Prisma Client** — код и TypeScript-типы для твоих моделей. Клиент не универсальный: он создаётся именно под твою схему, поэтому знает, что у `User` есть `email`, а у `Post` — `title`.

Отсюда правило: запускать после **каждого изменения схемы**. Без этого:

- TypeScript не знает о новых полях и моделях — ошибки компиляции «свойство не существует»;
- в рантайме клиент ничего не знает о новых колонках.

Когда это нужно:

- **локально** — после правки схемы и после `git pull`, если схему поменял коллега;
- **в CI и на хостинге** — при установке или сборке. Иначе на сервере соберётся старый клиент или его не будет вовсе:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

`postinstall` запускается автоматически после `npm install` — удобно, чтобы клиент всегда был актуален.

В Prisma 7 клиент генерируется в папку проекта (`output` в генераторе), поэтому её обычно добавляют в `.gitignore` и всегда генерируют при сборке, а не коммитят.

Частая ситуация на собесе: «на Vercel сборка падает с ошибкой, что `PrismaClient` не найден» — забыли `prisma generate` в сборке.

@@@ prisma-14 | запросы, связи
Как фильтровать по связям: `some`, `every`, `none`?
???
Для связей «один-ко-многим» и «многие-ко-многим» (списков) есть три фильтра. Пример: пользователи и их привычки.

```ts
// есть ХОТЯ БЫ ОДНА активная привычка
prisma.user.findMany({ where: { habits: { some: { archived: false } } } });

// ВСЕ привычки в архиве
prisma.user.findMany({ where: { habits: { every: { archived: true } } } });

// НЕТ ни одной привычки
prisma.user.findMany({ where: { habits: { none: {} } } });

// нет ни одной активной (все в архиве или привычек нет вовсе)
prisma.user.findMany({ where: { habits: { none: { archived: false } } } });
```

- **`some`** — «существует хотя бы один связанный элемент, подходящий под условие» (в SQL — `EXISTS`);
- **`every`** — «все связанные элементы подходят под условие»;
- **`none`** — «ни один связанный элемент не подходит» (`NOT EXISTS`). С пустым условием `{}` — «связанных элементов нет вообще».

Ловушка `every`: пользователь **без привычек** тоже попадёт в результат. Формально «все его привычки в архиве» — истина, ведь привычек нет. Если нужны только те, у кого привычки есть и все в архиве, добавь `some: {}`:

```ts
where: { habits: { every: { archived: true }, some: {} } }
```

Для связи «один-к-одному» и «многие-к-одному» (одиночный объект) вместо этого используют `is` и `isNot`:

```ts
prisma.post.findMany({ where: { author: { is: { role: "ADMIN" } } } });
```

@@@ prisma-15 | пагинация
Как сделать пагинацию в Prisma?
???
**Offset-пагинация** — через `skip` и `take`:

```ts
const page = await prisma.post.findMany({
  skip: (pageNumber - 1) * 20,
  take: 20,
  orderBy: { createdAt: "desc" },
});
```

Просто, позволяет перейти на любую страницу. Но на дальних страницах медленно: база читает и выбрасывает все пропущенные строки. И при добавлении новых записей выдача «съезжает».

**Курсорная (keyset) пагинация** — продолжить от последней записи предыдущей страницы:

```ts
const page = await prisma.post.findMany({
  take: 20,
  skip: cursor ? 1 : 0, // пропустить сам курсор
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { id: "desc" },
});

const nextCursor = page.at(-1)?.id; // отдать клиенту для следующего запроса
```

Как работает: `cursor` указывает запись, **начиная с которой** брать данные. Сама эта запись уже была на прошлой странице, поэтому её пропускают через `skip: 1`. На первой странице курсора нет — берём с начала.

Требования:

- курсор — уникальное поле (`id`);
- сортировка — стабильная и по тому же полю (или с ним в конце для разрешения ничьих).

Курсорная быстрая на любой глубине — идеальна для бесконечной ленты и чатов. Минус — нельзя перейти сразу на страницу 57.

Узнать, есть ли следующая страница: запросить `take: 21` и проверить, вернулась ли 21-я запись (её не показывать).

@@@ prisma-16 | архитектура
Плюсы и минусы ORM вроде Prisma по сравнению с чистым SQL?
???
**Плюсы:**

- **типобезопасность от базы до UI** — тип результата выводится из запроса, переименование поля сразу подсвечивает все места, где оно используется;
- **автодополнение** — не нужно помнить имена колонок;
- **миграции** из коробки — история структуры базы в git;
- **защита от SQL-инъекций** — все значения передаются параметрами;
- **меньше шаблонного кода** — связи, вложенные создания, пагинация в пару строк;
- единый API для разных баз.

**Минусы:**

- **не всё выражается через API.** Оконные функции, рекурсивные CTE, сложные отчёты и `GROUP BY` по связям — через `$queryRaw` или TypedSQL;
- **абстракция прячет SQL.** Легко написать код, который генерирует неэффективные или лишние запросы (N+1, загрузка всех полей). Включай `log: ["query"]`, чтобы видеть, что происходит;
- **дополнительный слой** — генерация клиента, своя схема, свои правила миграций;
- нужно знать SQL всё равно: индексы, планы запросов и блокировки ORM за тебя не продумает.

**Альтернативы:**

- **Drizzle** — ORM, где запросы выглядят почти как SQL, схема описывается на TypeScript, без генерации;
- **Kysely** — типизированный query builder: пишешь SQL-подобные цепочки с полной типизацией;
- чистый драйвер `pg` — максимум контроля и минимум магии.

Взвешенный ответ на собесе: «ORM ускоряет типичную работу с данными и даёт типы, но SQL нужно знать — для сложных запросов, оптимизации и понимания того, что ORM делает под капотом».

@@@ prisma-17 | схема
Что значат атрибуты `@id`, `@default`, `@unique`, `@updatedAt` и `@@index`?
???
```prisma
model Post {
  id        String   @id @default(cuid())  // первичный ключ с генерацией
  slug      String   @unique               // уникальный индекс
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt            // обновится сам при каждой записи
  authorId  String

  @@index([authorId, createdAt])           // составной индекс
  @@unique([authorId, slug])               // уникальность пары
}
```

Атрибуты с одной `@` относятся к полю, с двумя `@@` — ко всей модели.

Подробнее:

- **`@id`** — первичный ключ. Составной ключ задают на уровне модели: `@@id([userId, postId])`;
- **`@default(...)`** — значение по умолчанию: `autoincrement()`, `cuid()`, `uuid()`, `now()` или константа;
- **`@unique`** — значения не повторяются, в базе создаётся уникальный индекс. По такому полю можно искать через `findUnique`;
- **`@updatedAt`** — Prisma сама подставляет текущее время при каждом `update` через клиент (в базе это обычная колонка, триггера нет — при изменении данных SQL-запросом напрямую она не обновится);
- **`@@index`** — обычный индекс для ускорения запросов. Порядок полей важен, как в SQL;
- **`@@unique`** — уникальность сочетания полей: у одного автора не может быть двух постов с одинаковым `slug`.

Ещё пригодятся `@map("created_at")` и `@@map("posts")` — имя колонки и таблицы в базе, если оно отличается от имени в коде.

@@@ prisma-18 | схема, enum
Как описать enum в схеме Prisma?
???
**Enum** — поле, которое может принимать только значения из фиксированного списка.

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id   String @id @default(cuid())
  role Role   @default(USER)
}
```

Что получается:

- в PostgreSQL создаётся настоящий тип `ENUM` — база сама не даст записать в колонку `"SUPERUSER"`;
- в TypeScript Prisma генерирует объект и union-тип `Role`, которые можно импортировать из сгенерированного клиента:

```ts
import { Role } from "../generated/prisma/client";

if (user.role === Role.ADMIN) { … }
await prisma.user.update({ where: { id }, data: { role: "ADMIN" } }); // строка тоже подходит
```

Плюсы перед обычной строкой: опечатка `"admn"` — ошибка и в TypeScript, и в базе.

Минусы:

- добавление нового значения требует **миграции**;
- удалить или переименовать значение в PostgreSQL сложнее, чем добавить;
- если список значений часто меняется или управляется из админки, лучше отдельная таблица-справочник со связью.

Хорошо подходит для стабильных наборов: роли, статусы заказа, тип уведомления.

@@@ prisma-19 | запросы
Чем отличаются `findUnique`, `findFirst` и `findUniqueOrThrow`?
???
- **`findUnique`** — поиск **только по уникальному** полю или составному уникальному ключу (`id`, `email` с `@unique`). Возвращает запись или `null`. Параллельные вызовы `findUnique` в одном тике Prisma объединяет в один запрос (батчинг) — это спасает от N+1.
- **`findFirst`** — первая запись по **любому** фильтру. Почти всегда используется с `orderBy`, иначе «первая» — случайная.
- **`findUniqueOrThrow`** / **`findFirstOrThrow`** — то же, но вместо `null` бросают ошибку P2025.

```ts
const user = await prisma.user.findUnique({ where: { email } });       // User | null
const last = await prisma.post.findFirst({ where: { authorId }, orderBy: { createdAt: "desc" } });
const post = await prisma.post.findUniqueOrThrow({ where: { id } });   // Post — без null
```

Почему `findUnique` ограничен уникальными полями: так Prisma и TypeScript гарантируют, что запись **не больше одной**. Если передать в `where` неуникальное поле, будет ошибка компиляции — ищи через `findFirst`.

Когда что выбирать:

- есть id или другой уникальный ключ — `findUnique`;
- «последний заказ пользователя», «первая непрочитанная запись» — `findFirst` + `orderBy`;
- запись **обязана** существовать (страница поста по id, внутри транзакции) — `OrThrow`. Код короче без проверок `if (!post)`, а TypeScript знает, что `null` не будет.

В Next.js для страницы «не найдено» удобнее `findUnique` + `notFound()`, чтобы показать 404, а не ошибку 500.

@@@ prisma-20 | безопасность, select
Как не отдавать на клиент поле `password`?
???
Опция `omit` убирает поля из результата — и из типа:

```ts
const user = await prisma.user.findUnique({
  where: { id },
  omit: { password: true },
});
// user.password — ошибка типа

// глобально для всего клиента
const prisma = new PrismaClient({
  adapter,
  omit: { user: { password: true } },
});
```

С глобальным `omit` пароль нужно явно запросить там, где он нужен (например, при логине): `omit: { password: false }`. Безопаснее, чем помнить про `select` в каждом запросе.

Почему это важно: хеш пароля в ответе API — частая утечка. Разработчик пишет `return prisma.user.findUnique(...)` в Route Handler, и в JSON уходят все поля модели, включая `password`. Глобальный `omit` защищает по умолчанию: чтобы получить пароль, нужно явно попросить.

Альтернатива — `select` только нужных полей или отдельный тип DTO для ответа, но их легко забыть в новом запросе.

@@@ prisma-21 | extensions, soft delete
Как сделать «мягкое удаление» (soft delete) в Prisma?
???
Колонка `deletedAt DateTime?` и Client Extension, которая добавляет фильтр ко всем чтениям:

```ts
const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    post: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});

// «удаление» — это update
await prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });
```

`$extends` заменил старый middleware `$use`, которого в Prisma 7 больше нет. Через расширения также добавляют свои методы моделям и вычисляемые поля в результатах.

@@@ prisma-22 | запросы, производительность
Как вставить много записей разом? Чем `createMany` отличается от `createManyAndReturn`?
???
```ts
// одна INSERT-команда вместо тысячи
const { count } = await prisma.tag.createMany({
  data: [{ name: "ts" }, { name: "react" }],
  skipDuplicates: true, // пропустить конфликты по уникальным полям
});

// то же, но возвращает созданные записи
const tags = await prisma.tag.createManyAndReturn({
  data: [{ name: "sql" }],
});
```

`createMany` возвращает только количество. Ни один из них не умеет вложенные записи связей — для этого `create` с вложенным `create` или транзакция. `createManyAndReturn` поддерживается не во всех БД (в PostgreSQL — да).

@@@ prisma-23 | миграции, команда
Какие правила работы с миграциями Prisma в команде?
???
- Миграции — часть кода: коммитить папку `prisma/migrations` вместе с изменением схемы.
- **Не редактировать** уже применённые миграции: Prisma хранит их контрольные суммы и заметит расхождение (drift).
- Разработка — `migrate dev`, продакшен и CI — только `migrate deploy`.
- Если БД изменили руками, `migrate dev` предложит сбросить базу — на общей или боевой базе так нельзя. Расхождения на проде чинят новой миграцией или `migrate resolve`.
- Опасные изменения (переименование колонки, `NOT NULL` без дефолта) разбивают на шаги: добавить → перенести данные → удалить старое.

@@@ prisma-24 | схема, связи
Как описать связь один-к-одному?
???
Внешний ключ на одной стороне и `@unique` на нём — чтобы на одного пользователя был максимум один профиль:

```prisma
model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  profile Profile?
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String
  userId Int    @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- Сторона с `fields` и `references` хранит внешний ключ в таблице (`Profile.userId`).
- На другой стороне поле `profile Profile?` существует только в Prisma Client — колонки в `User` нет.
- `Profile?` — у пользователя профиля может не быть. Обязательным его на стороне без ключа сделать нельзя.

Какую сторону выбрать для ключа: ту, которая не может существовать без другой. Профиль без пользователя не нужен — ключ в профиле.

@@@ prisma-25 | схема, связи
Как описать связь модели с самой собой (дерево категорий, подписчики)?
???
Self-relation — связь, где обе стороны — одна и та же модель. Её нужно **назвать** в `@relation`, чтобы Prisma поняла, какие поля составляют пару:

```prisma
model Category {
  id       Int        @id @default(autoincrement())
  name     String
  parentId Int?
  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
}
```

Запрос дерева на два уровня:

```ts
const roots = await prisma.category.findMany({
  where: { parentId: null },
  include: { children: { include: { children: true } } },
});
```

Подписчики — это многие-ко-многим на себя:

```prisma
model User {
  id        Int    @id @default(autoincrement())
  followers User[] @relation("Follows")
  following User[] @relation("Follows")
}
```

Глубокое дерево неизвестной глубины Prisma за один запрос не загрузит — для этого нужен рекурсивный CTE через `$queryRaw`.

@@@ prisma-26 | схема, удаление
Как настроить, что происходит со связанными записями при удалении?
???
Через `onDelete` в `@relation` — Prisma создаст соответствующий внешний ключ в базе:

```prisma
model Comment {
  id       Int   @id @default(autoincrement())
  postId   Int
  post     Post  @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId Int?
  author   User? @relation(fields: [authorId], references: [id], onDelete: SetNull)
}
```

Варианты: `Cascade` (удалить вместе с родителем), `SetNull` (обнулить ссылку, поле должно быть необязательным), `Restrict` и `NoAction` (запретить удаление, пока есть дети), `SetDefault`.

По умолчанию для обязательной связи — `Restrict`, для необязательной — `SetNull`.

Частая ошибка: удаляют пользователя и получают ошибку внешнего ключа, потому что у него остались посты, а `onDelete` не указан. Решение — явно выбрать поведение в схеме и сделать миграцию, а не удалять детей вручную перед каждым удалением.

@@@ prisma-27 | запросы, nested writes
Как создать запись вместе со связанными одним запросом?
???
Вложенные записи (nested writes) — Prisma выполнит всё в **одной транзакции**:

```ts
const user = await prisma.user.create({
  data: {
    email: "ann@example.com",
    profile: { create: { bio: "Фронтенд" } },
    posts: {
      create: [{ title: "Первый пост" }, { title: "Второй пост" }],
    },
    tags: {
      connectOrCreate: {
        where: { name: "react" },
        create: { name: "react" },
      },
    },
  },
  include: { posts: true, profile: true },
});
```

- `create` — создать связанную запись;
- `connect` — привязать существующую по уникальному полю: `{ connect: { id: 5 } }`;
- `connectOrCreate` — привязать, если есть, иначе создать.

Если любая часть упадёт (например, email уже занят), не сохранится ничего. Это проще и надёжнее, чем создавать записи по очереди и передавать id вручную.

@@@ prisma-28 | запросы, many-to-many
Как изменить связи многие-ко-многим: добавить, убрать, заменить?
???
В `update` у поля-связи есть операции `connect`, `disconnect` и `set`:

```ts
// добавить теги 3 и 4, убрать тег 1
await prisma.post.update({
  where: { id: postId },
  data: {
    tags: {
      connect: [{ id: 3 }, { id: 4 }],
      disconnect: [{ id: 1 }],
    },
  },
});

// заменить все теги поста на переданный список
await prisma.post.update({
  where: { id: postId },
  data: { tags: { set: tagIds.map((id) => ({ id })) } },
});

// убрать все теги
await prisma.post.update({ where: { id: postId }, data: { tags: { set: [] } } });
```

`set` удобен для формы с мультиселектом: не нужно вычислять, что добавили и что убрали.

Для связи один-ко-многим `disconnect` работает только если поле-ссылка необязательное — иначе запись без родителя существовать не может.

@@@ prisma-29 | запросы, ошибки
Что будет, если `update` или `delete` не найдут запись? Чем отличаются `updateMany` и `deleteMany`?
???
- `update` и `delete` работают с **одной** записью по уникальному полю. Если её нет — бросают ошибку с кодом **P2025** («Record not found»).
- `updateMany` и `deleteMany` работают с **набором** по любому фильтру и не падают, если ничего не нашлось, — возвращают `{ count: 0 }`.

```ts
const { count } = await prisma.post.updateMany({
  where: { id: postId, authorId: userId }, // заодно проверка владельца
  data: { title },
});
if (count === 0) throw new Error("Пост не найден или нет доступа");
```

Этот приём удобен для проверки прав: условие на владельца в `where` выполняется атомарно, без отдельного `findFirst`.

Минус `updateMany`: он не возвращает сами записи. Для PostgreSQL есть `updateManyAndReturn` — он вернёт обновлённые строки.

@@@ prisma-30 | ошибки, обработка
Как обрабатывать ошибки Prisma: дубль email, запись не найдена?
???
Ошибки базы приходят как `PrismaClientKnownRequestError` с кодом:

```ts
import { Prisma } from "@/generated/prisma/client";

try {
  await prisma.user.create({ data: { email } });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return { error: "Этот email уже зарегистрирован" };
    if (e.code === "P2025") return { error: "Запись не найдена" };
  }
  throw e; // неизвестную ошибку не глотаем
}
```

Частые коды:

- **P2002** — нарушено уникальное ограничение;
- **P2025** — нужная для операции запись не найдена;
- **P2003** — нарушен внешний ключ (например, удаление родителя, у которого есть дети).

Лучше ловить P2002, чем заранее проверять `findUnique`: между проверкой и вставкой другой запрос может успеть создать такую же запись. Уникальный индекс в базе — единственная надёжная гарантия.

@@@ prisma-31 | запросы, агрегаты
Как посчитать связанные записи и отсортировать по их количеству?
???
Через специальное поле `_count`:

```ts
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    _count: { select: { posts: true, comments: true } },
  },
  orderBy: { posts: { _count: "desc" } },
  take: 10,
});
// [{ id: 1, name: "Аня", _count: { posts: 12, comments: 40 } }, ...]
```

Можно считать с условием:

```ts
_count: { select: { posts: { where: { published: true } } } }
```

Prisma посчитает всё на стороне базы, без загрузки самих постов. Неправильный вариант — `include: { posts: true }` и `posts.length` в коде: загрузятся все посты всех пользователей только ради числа.

@@@ prisma-32 | запросы, агрегаты
Как сделать `GROUP BY` и агрегаты в Prisma?
???
`aggregate` — агрегаты по всей выборке:

```ts
const stats = await prisma.order.aggregate({
  where: { status: "PAID" },
  _sum: { total: true },
  _avg: { total: true },
  _count: true,
});
// { _sum: { total: 15000 }, _avg: { total: 500 }, _count: 30 }
```

`groupBy` — агрегаты по группам, с `having` и сортировкой:

```ts
const byUser = await prisma.order.groupBy({
  by: ["userId"],
  where: { status: "PAID" },
  _sum: { total: true },
  _count: { _all: true },
  having: { total: { _sum: { gt: 1000 } } },
  orderBy: { _sum: { total: "desc" } },
});
```

Ограничение: `groupBy` группирует только по полям самой модели, без связей. Для отчётов с `JOIN`, оконными функциями и группировкой по месяцу используют `$queryRaw` или представление в базе.

@@@ prisma-33 | запросы, поиск
Как искать без учёта регистра в Prisma?
???
В фильтрах строк добавляют `mode: "insensitive"`:

```ts
const products = await prisma.product.findMany({
  where: {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ],
  },
});
```

В PostgreSQL это превращается в `ILIKE '%query%'`. Есть также `startsWith`, `endsWith`, `equals`.

Что важно знать:

- `mode` поддерживается для PostgreSQL и MongoDB; в MySQL регистр обычно и так не учитывается из-за collation;
- `contains` даёт `LIKE` с `%` в начале — обычный индекс не работает, на большой таблице нужен GIN-индекс с `pg_trgm` (через миграцию с SQL);
- значение передаётся параметром, поэтому SQL-инъекции здесь нет.

Для настоящего полнотекстового поиска с морфологией лучше `$queryRaw` с `to_tsvector` или внешний поисковый движок.

@@@ prisma-34 | типы, сериализация
Какие проблемы с `Decimal`, `BigInt` и `DateTime` при отдаче данных клиенту?
???
Prisma возвращает не только примитивы:

- `Decimal` → объект `Prisma.Decimal` (decimal.js) — для денег, без ошибок float;
- `BigInt` → JS `bigint`;
- `DateTime` → `Date`.

Проблемы:

```ts
JSON.stringify({ id: 1n });   // TypeError: Do not know how to serialize a BigInt
```

- `bigint` не сериализуется в JSON — в Route Handler ответ упадёт;
- `Decimal` — экземпляр класса, а в клиентский компонент Next.js можно передать только простые объекты; при `JSON.stringify` он превратится в строку;
- `Date` в Server → Client Components передаётся нормально, но в JSON становится строкой ISO — на клиенте её нужно снова превратить в дату.

Решение — явно преобразовать данные на границе (DTO):

```ts
const dto = { ...product, price: product.price.toString(), id: product.id.toString() };
```

Цену удобно хранить в копейках как `Int` — тогда `Decimal` вообще не нужен.

@@@ prisma-35 | cli, seed
Как заполнить базу начальными данными (seed) в Prisma 7?
???
Пишут скрипт и указывают команду его запуска в `prisma.config.ts`:

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url: env("DATABASE_URL") },
});
```

```ts
// prisma/seed.ts
import { prisma } from "../src/lib/prisma";

await prisma.category.createMany({
  data: [{ name: "Еда" }, { name: "Транспорт" }],
  skipDuplicates: true,
});
```

Запуск — `npx prisma db seed`. В Prisma 7 `migrate dev` и `migrate reset` больше не запускают сид сами — его вызывают явно.

Хороший сид **идемпотентный**: повторный запуск не создаёт дубли (`upsert`, `skipDuplicates`). Сиды — для справочников и тестовых данных разработки; в продакшен-базу справочники обычно добавляют миграцией.

@@@ prisma-36 | схема, связи
Как описать две связи между одними и теми же моделями (автор и редактор поста)?
???
Если между двумя моделями больше одной связи, Prisma не может сама понять, какие поля образуют пару. Каждой связи дают имя:

```prisma
model User {
  id           Int    @id @default(autoincrement())
  writtenPosts Post[] @relation("WrittenPosts")
  editedPosts  Post[] @relation("EditedPosts")
}

model Post {
  id       Int   @id @default(autoincrement())
  title    String
  authorId Int
  author   User  @relation("WrittenPosts", fields: [authorId], references: [id])
  editorId Int?
  editor   User? @relation("EditedPosts", fields: [editorId], references: [id])
}
```

Имя в `@relation("…")` должно совпадать на обеих сторонах. Без имён `prisma validate` выдаст ошибку о неоднозначной связи.

Запрос:

```ts
const post = await prisma.post.findUnique({
  where: { id },
  include: { author: true, editor: true },
});
```

@@@ prisma-37 | схема, unique
Как сделать уникальность по нескольким полям и искать по ней?
???
Атрибут `@@unique` на уровне модели:

```prisma
model Like {
  id     Int @id @default(autoincrement())
  userId Int
  postId Int

  @@unique([userId, postId])
}
```

Теперь пользователь не сможет лайкнуть пост дважды — это гарантирует уникальный индекс в базе.

Искать по составному ключу через `findUnique` — Prisma склеивает имена полей через `_`:

```ts
const like = await prisma.like.findUnique({
  where: { userId_postId: { userId, postId } },
});

await prisma.like.upsert({
  where: { userId_postId: { userId, postId } },
  create: { userId, postId },
  update: {},
});
```

Имя можно задать самому: `@@unique([userId, postId], name: "userPost")`. Для связующих таблиц часто вместо `id` делают составной первичный ключ `@@id([userId, postId])` — он работает так же.

@@@ prisma-38 | cli, интроспекция
Что делают `prisma db pull` и Prisma Studio?
???
**`prisma db pull`** (интроспекция) читает структуру существующей базы и генерирует по ней `schema.prisma`. Нужен, когда:

- подключаешь Prisma к базе, которую создали без неё;
- кто-то поменял базу вручную, и нужно синхронизировать схему.

После `db pull` модели обычно переименовывают в PascalCase через `@@map("users")` и `@map("created_at")`, чтобы в коде были привычные имена, а в базе остались прежние.

**Prisma Studio** (`npx prisma studio`) — визуальный редактор данных в браузере: посмотреть таблицы, отфильтровать, поправить запись, проверить связи. Удобно при разработке вместо SQL-клиента.

Важно: `db pull` перезаписывает схему. Если в проекте есть миграции, ручные изменения в базе лучше оформить миграцией, а не подтягивать в схему, — иначе история миграций разойдётся с реальной базой (drift).

@@@ prisma-39 | отладка, логи
Как увидеть SQL, который генерирует Prisma?
???
Включить логирование при создании клиента:

```ts
export const prisma = new PrismaClient({
  adapter,
  log: ["query", "warn", "error"],
});
```

Чтобы видеть ещё параметры и длительность — логирование через события:

```ts
const prisma = new PrismaClient({
  adapter,
  log: [{ emit: "event", level: "query" }],
});

prisma.$on("query", (e) => {
  console.log(e.query, e.params, `${e.duration} мс`);
});
```

Зачем: найти N+1 (десятки одинаковых запросов подряд), посмотреть, какой SQL получился из сложного `include`, и взять медленный запрос для `EXPLAIN ANALYZE`.

В продакшене логирование всех запросов включают осторожно: это много записей, а в параметрах могут оказаться личные данные.

@@@ prisma-40 | конкурентность, блокировки
Как сделать оптимистичную блокировку в Prisma?
???
Добавить в модель поле версии и обновлять запись только если версия не изменилась:

```prisma
model Product {
  id      Int @id @default(autoincrement())
  stock   Int
  version Int @default(0)
}
```

```ts
const product = await prisma.product.findUniqueOrThrow({ where: { id } });

const { count } = await prisma.product.updateMany({
  where: { id, version: product.version },
  data: { stock: product.stock - qty, version: { increment: 1 } },
});

if (count === 0) {
  throw new Error("Товар только что изменили — обновите страницу");
}
```

Используется `updateMany`, потому что в его `where` можно добавить не только уникальное поле. Если кто-то успел обновить запись между чтением и записью, версия уже другая, `count` будет `0`, и чужое изменение не перезапишется.

Подходит для форм редактирования, где два менеджера могут одновременно править одну карточку. Для простых счётчиков достаточно атомарного `{ decrement: qty }`.
