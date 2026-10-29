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

`increment`, `decrement`, `multiply` выполняются в БД атомарно — без гонки «прочитал → прибавил → записал». В `where` у `upsert` нужно уникальное поле.

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
После каждого изменения схемы: команда пересоздаёт клиент и типы.

В CI и на хостинге — при установке или сборке (`postinstall` или `"build": "prisma generate && next build"`). Иначе в рантайме окажется старый клиент без новых полей.

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
