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
ORM для Node.js и TypeScript:

- **Prisma Schema** (`schema.prisma`) — модели, связи, источник данных, генератор.
- **Prisma Client** — сгенерированный по схеме типобезопасный клиент.
- **Prisma Migrate** — миграции БД из изменений схемы.
- **Prisma Studio** — GUI для просмотра данных.

Главный плюс — тип результата выводится из запроса: `select` и `include` меняют тип ответа.

@@@ prisma-02 | схема, связи
Как описать модель со связью один-ко-многим?
???
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

Внешний ключ — `userId`. Поля `user` и `habits` — виртуальные поля связи для клиента, в таблице их нет.

@@@ prisma-03 | схема, связи
Как сделать связь многие-ко-многим?
???
**Неявная** — Prisma сама создаёт связующую таблицу:

```prisma
model Post {
  id   Int   @id @default(autoincrement())
  tags Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  posts Post[]
}
```

**Явная** — своя модель-связка, если нужны дополнительные поля (роль, дата):

```prisma
model Membership {
  userId String
  teamId String
  role   String
  user   User   @relation(fields: [userId], references: [id])
  team   Team   @relation(fields: [teamId], references: [id])

  @@id([userId, teamId])
}
```

@@@ prisma-04 | миграции
Чем отличаются `prisma migrate dev`, `migrate deploy` и `db push`?
???
- `migrate dev` — для разработки: создаёт SQL-миграцию из изменений схемы и применяет её. При расхождении может предложить сбросить БД.
- `migrate deploy` — для CI и продакшена: только применяет готовые миграции, ничего не генерирует и не сбрасывает.
- `db push` — синхронизирует БД со схемой **без файлов миграций**. Для прототипов: истории нет, данные можно потерять.

Папку с миграциями коммитят в git.

@@@ prisma-05 | запросы
Чем `include` отличается от `select`?
???
`include` — все скалярные поля модели + указанные связи. `select` — **только** перечисленные поля, по сети уходит меньше данных.

На одном уровне их вместе использовать нельзя, но можно вкладывать:

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

@@@ prisma-06 | typescript
Как получить TS-тип результата запроса с `include`?
???
Через сгенерированный помощник `Prisma.<Model>GetPayload`:

```ts
import { Prisma } from "../generated/prisma/client";

const withHabits = {
  include: { habits: true },
} satisfies Prisma.UserDefaultArgs;

type UserWithHabits = Prisma.UserGetPayload<typeof withHabits>;
```

Базовые типы моделей (`User`, `Habit`) тоже экспортируются из клиента — без связей.

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

@@@ prisma-10 | sql, безопасность
Как безопасно выполнить сырой SQL в Prisma?
???
Шаблонный тег `$queryRaw` сам превращает подстановки в параметры:

```ts
const users = await prisma.$queryRaw<User[]>`
  SELECT * FROM "User" WHERE email = ${email}
`;
```

`$queryRawUnsafe(str)` и склейка строк — путь к SQL-инъекции. Для изменений — `$executeRaw`. Есть ещё TypedSQL: запросы в `.sql`-файлах с генерацией типов.

@@@ prisma-11 | next, соединения
Почему в Next.js PrismaClient делают синглтоном?
???
Каждый `new PrismaClient()` открывает свой пул соединений. В dev hot reload пересоздаёт модули, соединения копятся — и БД отвечает «too many connections». Экземпляр хранят в `globalThis`:

```ts
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

В serverless нужен пулер соединений: PgBouncer, pooled-URL у Neon, Prisma Accelerate.

@@@ prisma-12 | prisma 7
Что изменилось в Prisma 7?
???
- Клиент без Rust-движка: запросы идут через **driver adapter** (`@prisma/adapter-pg` и другие). Бандл меньше, работает в edge и serverless.
- Генератор `prisma-client` с обязательным `output` — клиент генерируется в код проекта, а не в `node_modules`.
- Настройки CLI и URL базы переехали в `prisma.config.ts`. `.env` автоматически не подгружается.
- ESM по умолчанию.

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
```

@@@ prisma-13 | cli
Когда нужно запускать `prisma generate`?
???
После каждого изменения `schema.prisma`: команда пересоздаёт клиент и типы. Без неё TypeScript не знает о новых полях и моделях, а в рантайме клиент ничего не знает о новых колонках.

- Локально — после правки схемы и после `git pull`, если схему поменял коллега.
- В CI и на хостинге — при установке или сборке: `"postinstall": "prisma generate"` или `"build": "prisma generate && next build"`. Иначе соберётся старый клиент.

В Prisma 7 клиент генерируется в папку проекта (`output` в генераторе), поэтому её обычно добавляют в `.gitignore` и всегда генерируют при сборке, а не коммитят.

@@@ prisma-14 | запросы, связи
Как фильтровать по связям: `some`, `every`, `none`?
???
```ts
// есть хотя бы одна активная привычка
prisma.user.findMany({ where: { habits: { some: { archived: false } } } });

// все привычки в архиве
prisma.user.findMany({ where: { habits: { every: { archived: true } } } });

// без привычек
prisma.user.findMany({ where: { habits: { none: {} } } });
```

Для связи один-к-одному — `is` / `isNot`.

@@@ prisma-15 | пагинация
Как сделать пагинацию в Prisma?
???
Offset: `skip` + `take` — просто, но медленно на дальних страницах.

Курсорная (keyset):

```ts
const page = await prisma.post.findMany({
  take: 20,
  skip: cursor ? 1 : 0, // пропустить сам курсор
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { id: "desc" },
});

const nextCursor = page.at(-1)?.id;
```

@@@ prisma-16 | архитектура
Плюсы и минусы ORM вроде Prisma по сравнению с чистым SQL?
???
**Плюсы**: типобезопасность от БД до UI, автодополнение, миграции, защита от инъекций, меньше бойлерплейта.

**Минусы**: не всё из SQL выражается через API (оконные функции, сложные отчёты → raw SQL или TypedSQL); лишние запросы при неаккуратном использовании; абстракция прячет реальные запросы — включай `log: ["query"]`.

Альтернативы: Drizzle (ближе к SQL), Kysely (query builder).

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

@@@ prisma-18 | схема, enum
Как описать enum в схеме Prisma?
???
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

В PostgreSQL создаётся настоящий тип `ENUM`, а в TypeScript — объект и тип `Role`, которые можно импортировать из сгенерированного клиента: `if (user.role === Role.ADMIN)`. Добавление нового значения требует миграции.

@@@ prisma-19 | запросы
Чем отличаются `findUnique`, `findFirst` и `findUniqueOrThrow`?
???
- `findUnique` — поиск только по **уникальному** полю или составному уникальному ключу (`id`, `email` с `@unique`). Возвращает запись или `null`. Параллельные вызовы Prisma батчит.
- `findFirst` — первая запись по **любому** фильтру, обычно с `orderBy`.
- `findUniqueOrThrow` / `findFirstOrThrow` — вместо `null` бросают ошибку. Удобно, когда отсутствие записи — исключительная ситуация, и не хочется проверять `null` вручную.

```ts
const user = await prisma.user.findUnique({ where: { email } });       // User | null
const last = await prisma.post.findFirst({ where: { authorId }, orderBy: { createdAt: "desc" } });
```

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
