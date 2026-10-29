---
id: sql
title: SQL и PostgreSQL
description: Запросы, индексы, транзакции и то, что спрашивают про PostgreSQL
color: green
icon: database
---

@@@ sql-01 | join
Какие бывают JOIN?
???
- `INNER JOIN` — только строки с совпадением в обеих таблицах.
- `LEFT JOIN` — все строки левой + совпадения справа (иначе `NULL`).
- `RIGHT JOIN` — наоборот.
- `FULL JOIN` — все строки обеих.
- `CROSS JOIN` — декартово произведение.

```sql
-- пользователи без заказов
SELECT u.*
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;
```

@@@ sql-02 | группировка
Чем `WHERE` отличается от `HAVING`?
???
`WHERE` фильтрует **строки до** группировки. `HAVING` — **группы после** `GROUP BY` и умеет работать с агрегатами:

```sql
SELECT user_id, count(*) AS orders
FROM orders
WHERE created_at > now() - interval '30 days'
GROUP BY user_id
HAVING count(*) >= 5;
```

@@@ sql-03 | основы
В каком порядке логически выполняется `SELECT`?
???
`FROM / JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT / OFFSET`.

Поэтому алиас из `SELECT` нельзя использовать в `WHERE`, но можно в `ORDER BY` (в PostgreSQL ещё и в `GROUP BY`).

@@@ sql-04 | индексы
Что такое индекс и как работает B-tree?
???
Отдельная структура данных, которая ускоряет поиск ценой места на диске и замедления записи.

**B-tree** (по умолчанию в PostgreSQL) — сбалансированное дерево отсортированных ключей. Поиск за O(log n); подходит для `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, `LIKE 'abc%'`.

Другие типы: Hash (только `=`), GIN (массивы, JSONB, полнотекстовый поиск), GiST (геоданные), BRIN (огромные упорядоченные таблицы).

@@@ sql-05 | индексы, производительность
Почему запрос не использует индекс?
???
- Функция над колонкой: `WHERE lower(email) = …` — нужен индекс по выражению.
- `LIKE '%abc'` — начало шаблона неизвестно.
- Несовпадение типов, неявное приведение.
- Низкая селективность: выбирается большая часть таблицы, и seq scan дешевле.
- Индекс `(a, b)`, а фильтр только по `b`.
- Устаревшая статистика — поможет `ANALYZE`.

Проверяй через `EXPLAIN ANALYZE`.

@@@ sql-06 | индексы
Как порядок колонок влияет на составной индекс?
???
Индекс `(a, b, c)` отсортирован сначала по `a`, потом по `b` — как телефонный справочник по фамилии и имени. Он работает для фильтров по `a`, `a + b`, `a + b + c` (левый префикс), но не по одному `b`.

Сначала ставят колонки с равенством, потом — с диапазоном и сортировкой:

```sql
CREATE INDEX ON orders (user_id, created_at DESC);
-- быстро: WHERE user_id = 1 ORDER BY created_at DESC LIMIT 20
```

@@@ sql-07 | производительность, explain
Как читать `EXPLAIN ANALYZE`?
???
Показывает план и **реальное** время каждого узла. На что смотреть:

- `Seq Scan` по большой таблице там, где ждёшь `Index Scan`;
- большая разница между `rows` (оценка) и `actual rows` — устаревшая статистика;
- `Nested Loop` на больших входах;
- `Sort` с записью на диск (`external merge`);
- самый дорогой узел по `actual time`.

`EXPLAIN` без `ANALYZE` запрос не выполняет.

@@@ sql-08 | ключи, основы
Что такое первичный и внешний ключ?
???
**Primary key** уникально идентифицирует строку: `UNIQUE + NOT NULL`, индексируется автоматически.

**Foreign key** ссылается на ключ другой таблицы и гарантирует целостность: нельзя сослаться на несуществующую строку. Поведение при удалении: `ON DELETE CASCADE | SET NULL | RESTRICT`.

Внешний ключ в PostgreSQL **не индексируется сам** — индекс по `user_id` обычно нужно создать вручную.

@@@ sql-09 | проектирование
Что такое нормализация? Кратко про 1НФ, 2НФ, 3НФ.
???
Устранение дублирования и аномалий обновления.

- **1НФ** — атомарные значения, без повторяющихся групп (никаких «тегов через запятую»).
- **2НФ** — 1НФ + каждый неключевой атрибут зависит от **всего** составного ключа.
- **3НФ** — 2НФ + нет транзитивных зависимостей: неключевые поля не зависят от других неключевых.

Денормализация — осознанное дублирование ради скорости чтения.

@@@ sql-10 | транзакции
Что такое транзакция и ACID?
???
Транзакция — группа операций по принципу «всё или ничего».

- **Atomicity** — применяются либо все изменения, либо ни одного.
- **Consistency** — переход между корректными состояниями, ограничения соблюдены.
- **Isolation** — параллельные транзакции не мешают друг другу (в рамках уровня изоляции).
- **Durability** — после `COMMIT` данные переживут сбой (WAL).

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

@@@ sql-11 | транзакции, изоляция
Какие уровни изоляции транзакций есть и какие аномалии они допускают?
???
Аномалии: dirty read, non-repeatable read, phantom read, serialization anomaly.

- **Read Uncommitted** — в PostgreSQL работает как Read Committed.
- **Read Committed** (по умолчанию в PG) — каждый запрос видит данные, закоммиченные на момент **его** начала.
- **Repeatable Read** — снимок на начало транзакции; в PG фантомов тоже нет.
- **Serializable** — как будто транзакции шли по очереди. Возможны ошибки сериализации, транзакцию нужно повторить.

@@@ sql-12 | postgres, mvcc
Что такое MVCC в PostgreSQL и зачем нужен `VACUUM`?
???
**Multi-Version Concurrency Control**: `UPDATE` не перезаписывает строку, а создаёт новую версию. Старая остаётся для транзакций, которые её ещё видят. Читатели не блокируют писателей, и наоборот.

Мёртвые версии копятся (bloat). `VACUUM` (обычно autovacuum) освобождает место для повторного использования, обновляет статистику и не даёт переполниться счётчику транзакций.

@@@ sql-13 | производительность, orm
Что такое проблема N+1?
???
Один запрос за списком + по запросу на каждый элемент:

```ts
const posts = await db.post.findMany(); // 1 запрос
for (const p of posts) {
  // + N запросов
  p.author = await db.user.findUnique({ where: { id: p.authorId } });
}
```

Решение: JOIN, один запрос `WHERE id IN (…)`, `include` в ORM, DataLoader (батчинг) в GraphQL.

@@@ sql-14 | оконные функции
Что такое оконные функции? Приведи пример.
???
Считают по набору строк, связанных с текущей, **не схлопывая** строки — в отличие от `GROUP BY`:

```sql
-- три последних заказа каждого пользователя
SELECT *
FROM (
  SELECT o.*,
         row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM orders o
) t
WHERE rn <= 3;
```

Ещё: `rank`, `dense_rank`, `lag` / `lead`, `sum(…) OVER (ORDER BY …)` — накопительный итог.

@@@ sql-15 | оконные функции
Чем отличаются `ROW_NUMBER`, `RANK` и `DENSE_RANK`?
???
Для значений 100, 90, 90, 80:

- `row_number` → 1, 2, 3, 4 — всегда уникальный
- `rank` → 1, 2, 2, 4 — пропуск после равных
- `dense_rank` → 1, 2, 2, 3 — без пропусков

@@@ sql-16 | cte
Что такое CTE (`WITH`)? А рекурсивный CTE?
???
Именованный подзапрос для читаемости:

```sql
WITH active AS (
  SELECT * FROM users WHERE last_seen > now() - interval '7 days'
)
SELECT count(*) FROM active;
```

Рекурсивный — для деревьев (категории, комментарии, оргструктура):

```sql
WITH RECURSIVE tree AS (
  SELECT id, parent_id, name FROM categories WHERE id = 1
  UNION ALL
  SELECT c.id, c.parent_id, c.name
  FROM categories c
  JOIN tree t ON c.parent_id = t.id
)
SELECT * FROM tree;
```

@@@ sql-17 | основы
`UNION` против `UNION ALL`?
???
`UNION` объединяет результаты и **убирает дубликаты** — это лишняя сортировка или хеширование, дороже.

`UNION ALL` просто склеивает. Если дублей быть не может или они нужны — бери `UNION ALL`. Число и типы колонок должны совпадать.

@@@ sql-18 | основы
`DELETE`, `TRUNCATE` и `DROP` — в чём разница?
???
- `DELETE` удаляет строки (можно с `WHERE`), построчно, с триггерами. Медленно на больших объёмах.
- `TRUNCATE` мгновенно очищает всю таблицу без построчной обработки, может сбросить счётчики (`RESTART IDENTITY`).
- `DROP` удаляет саму таблицу вместе со структурой.

В PostgreSQL все три транзакционны — их можно откатить.

@@@ sql-19 | null, ловушка
Какие подводные камни у `NULL`?
???
`NULL` — это «неизвестно». Любое сравнение с ним даёт `NULL`, а не true/false.

- `WHERE x = NULL` ничего не найдёт → нужно `IS NULL`.
- `NOT IN (подзапрос с NULL)` вернёт пустоту.
- Агрегаты (`sum`, `avg`, `count(col)`) пропускают `NULL`.

Помогают `COALESCE(x, 0)` и `IS DISTINCT FROM`.

@@@ sql-20 | агрегаты
`COUNT(*)`, `COUNT(column)` и `COUNT(DISTINCT column)`?
???
- `count(*)` — число строк;
- `count(col)` — число строк, где `col` **не** `NULL`;
- `count(DISTINCT col)` — число уникальных непустых значений.

Ловушка с `LEFT JOIN`: считать надо `count(o.id)`, иначе пользователи без заказов получат 1 вместо 0.

@@@ sql-21 | подзапросы
`EXISTS` или `IN`? Подзапрос или `JOIN`?
???
`EXISTS` проверяет наличие хотя бы одной строки и останавливается на первой, корректно работает с `NULL`. `NOT IN` ломается, если в подзапросе есть `NULL` — используй `NOT EXISTS`.

Планировщик PostgreSQL часто превращает `IN` и `EXISTS` в одинаковый semi-join.

`JOIN` нужен, если требуются колонки второй таблицы. Если нужна только проверка наличия — `EXISTS`: `JOIN` может размножить строки.

@@@ sql-22 | пагинация, производительность
OFFSET-пагинация или keyset (курсорная)?
???
`LIMIT 20 OFFSET 10000` заставляет БД прочитать и выбросить 10 000 строк: медленно на дальних страницах, а при вставках строки «съезжают».

Keyset продолжает от последнего ключа:

```sql
SELECT * FROM posts
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

С индексом быстро на любой глубине, но перейти на произвольную страницу нельзя. Идеально для бесконечной ленты.

@@@ sql-23 | postgres, upsert
Как сделать «вставить или обновить» (upsert) в PostgreSQL?
???
```sql
INSERT INTO stats (user_id, views)
VALUES (1, 1)
ON CONFLICT (user_id)
DO UPDATE SET views = stats.views + EXCLUDED.views;
```

Нужен уникальный индекс или ограничение на колонке конфликта. `EXCLUDED` — строка, которую пытались вставить. `ON CONFLICT DO NOTHING` — просто пропустить.

@@@ sql-24 | postgres, jsonb
`json` или `jsonb` в PostgreSQL? Когда их использовать?
???
`json` хранит текст как есть: с пробелами, порядком ключей и дублями. `jsonb` — разобранный бинарный формат: быстрее запросы, GIN-индексы, операторы `@>`, `?`, `->>`. Почти всегда выбирают `jsonb`.

Подходит для гибких и редко запрашиваемых атрибутов. Поля, по которым часто фильтруют и джойнят, лучше держать в обычных колонках.

```sql
SELECT * FROM products WHERE attrs @> '{"color": "red"}';
```

@@@ sql-25 | транзакции, блокировки
Что такое deadlock и как его избежать?
???
Две транзакции ждут друг друга: T1 заблокировала строку A и ждёт B, а T2 заблокировала B и ждёт A. PostgreSQL обнаружит взаимоблокировку и отменит одну транзакцию с ошибкой.

Как избегать:

- блокировать ресурсы в одном порядке (например, по возрастанию id);
- держать транзакции короткими;
- повторять транзакцию при ошибке.

`SELECT … FOR UPDATE` — явная блокировка строк перед изменением.

@@@ sql-26 | безопасность
Что такое SQL-инъекция и как защититься?
???
Подстановка пользовательского ввода прямо в текст запроса: `"… WHERE name = '" + name + "'"` с `name = "' OR 1=1 --"`.

Защита — **параметризованные запросы**: значения передаются отдельно от SQL (`WHERE name = $1`). ORM делают это сами, опасны сырые запросы со строковой интерполяцией. Плюс минимальные права у пользователя БД.

@@@ sql-27 | join, ловушка
Почему `LEFT JOIN` превращается во `INNER JOIN`, если добавить условие в `WHERE`?
???
```sql
-- ✗ пользователи без оплаченных заказов пропадут
SELECT u.name, o.id
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.status = 'paid';

-- ✓ условие на правую таблицу — в ON
SELECT u.name, o.id
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid';
```

У пользователей без подходящих заказов все поля `o` равны `NULL`, а `NULL = 'paid'` не даёт true — `WHERE` выбрасывает эти строки. Условие в `ON` только решает, какие заказы присоединить, и сохраняет всех пользователей.

@@@ sql-28 | join
Что такое self join? Пример.
???
Соединение таблицы **с самой собой** — для иерархий и сравнения строк одной таблицы:

```sql
-- сотрудник и его руководитель
SELECT e.name AS employee, m.name AS manager
FROM users e
LEFT JOIN users m ON m.id = e.manager_id;
```

Алиасы (`e`, `m`) обязательны, чтобы различать две копии. `LEFT` нужен, чтобы не потерять верхнего руководителя, у которого `manager_id IS NULL`.

@@@ sql-29 | postgres, distinct on
Как в PostgreSQL выбрать последний заказ каждого пользователя?
???
`DISTINCT ON` оставляет первую строку в каждой группе согласно `ORDER BY`:

```sql
SELECT DISTINCT ON (user_id) user_id, id, created_at
FROM orders
ORDER BY user_id, created_at DESC;
```

`ORDER BY` должен начинаться с тех же выражений, что в `DISTINCT ON`. Переносимый вариант для любой СУБД — `row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC)` и фильтр `rn = 1`.

@@@ sql-30 | задача, оконные функции
Как найти вторую по величине зарплату?
???
```sql
-- 1) через DISTINCT + OFFSET
SELECT DISTINCT salary
FROM salaries
ORDER BY salary DESC
OFFSET 1 LIMIT 1;

-- 2) через dense_rank — заодно видно, у кого она
SELECT emp, salary
FROM (
  SELECT emp, salary, dense_rank() OVER (ORDER BY salary DESC) AS r
  FROM salaries
) t
WHERE r = 2;
```

Ловушка: без `DISTINCT` (или с `row_number` вместо `dense_rank`) при двух одинаковых максимальных зарплатах «второй» окажется та же максимальная.

@@@ sql-31 | задача, дубликаты
Как найти и удалить дубликаты, оставив одну запись?
???
Найти:

```sql
SELECT email, count(*)
FROM emails
GROUP BY email
HAVING count(*) > 1;
```

Удалить, оставив строку с наименьшим `id` (PostgreSQL):

```sql
DELETE FROM emails a
USING emails b
WHERE a.email = b.email
  AND a.id > b.id;
```

После чистки — уникальный индекс `CREATE UNIQUE INDEX ON emails (email)`, чтобы дубли не появились снова.

@@@ sql-32 | null, выражения
Что делают `COALESCE`, `NULLIF` и `CASE`?
???
- `COALESCE(a, b, c)` — первое не-`NULL` значение: `COALESCE(nickname, name, 'Аноним')`.
- `NULLIF(a, b)` — `NULL`, если `a = b`, иначе `a`. Классика — защита от деления на ноль: `total / NULLIF(count, 0)` вернёт `NULL` вместо ошибки.
- `CASE` — условие внутри запроса:

```sql
SELECT name,
       CASE WHEN manager_id IS NULL THEN 'boss' ELSE 'staff' END AS role
FROM users;
```

@@@ sql-33 | индексы, postgres
Что такое частичный индекс, индекс по выражению и покрывающий индекс?
???
```sql
-- частичный: индексирует только нужные строки — меньше и быстрее
CREATE INDEX ON orders (user_id) WHERE status = 'new';

-- по выражению: для поиска без учёта регистра
CREATE INDEX ON users (lower(email));
-- используется запросом WHERE lower(email) = lower($1)

-- покрывающий: INCLUDE хранит доп. колонки в индексе,
-- запрос может обойтись без чтения таблицы (index-only scan)
CREATE INDEX ON orders (user_id) INCLUDE (total);
```

Частичный индекс используется, только если условие запроса совпадает с условием индекса или следует из него.

@@@ sql-34 | postgres, типы
`SERIAL` или `GENERATED AS IDENTITY`? Что выбрать для первичного ключа?
???
`GENERATED ... AS IDENTITY` — стандарт SQL, рекомендуемый в современном PostgreSQL. `SERIAL` — старый способ: это обычный `int` + отдельная последовательность, с ней проще ошибиться при правах и копировании таблиц.

```sql
CREATE TABLE users (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text
);
INSERT INTO users (id, name) VALUES (5, 'x');
-- ошибка: cannot insert a non-DEFAULT value into column "id"
```

`ALWAYS` защищает от ручной вставки id, `BY DEFAULT` разрешает её. Для распределённых систем и публичных идентификаторов часто берут `uuid`.

@@@ sql-35 | postgres, представления
Чем обычное представление (VIEW) отличается от материализованного?
???
- **VIEW** — сохранённый запрос. Данные не хранит, при каждом обращении выполняет запрос заново: всегда актуально, но не быстрее исходного запроса.
- **MATERIALIZED VIEW** — результат запроса **сохранён на диск**: читается быстро, можно индексировать, но устаревает, пока его не обновят.

```sql
CREATE MATERIALIZED VIEW sales_by_user AS
SELECT user_id, sum(total) AS total FROM orders GROUP BY user_id;

REFRESH MATERIALIZED VIEW sales_by_user;
-- без блокировки чтения, но нужен уникальный индекс:
CREATE UNIQUE INDEX ON sales_by_user (user_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY sales_by_user;
```

Подходит для отчётов и дашбордов, где допустимо небольшое отставание.

@@@ sql-36 | транзакции, блокировки
Оптимистичная или пессимистичная блокировка — в чём разница?
???
**Пессимистичная** — заблокировать строку заранее, другие ждут:

```sql
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;
```

**Оптимистичная** — не блокировать, а при записи проверить, что строку никто не изменил (колонка `version`):

```sql
UPDATE accounts
SET balance = 50, version = version + 1
WHERE id = 1 AND version = 1;
-- 0 обновлённых строк = кто-то успел раньше → перечитать и повторить
```

Пессимистичная — при частых конфликтах и коротких транзакциях. Оптимистичная — когда конфликты редки, а держать блокировку долго нельзя (например, пока пользователь редактирует форму).

@@@ sql-37 | postgres, типы
`text`, `varchar(n)` или `char(n)` в PostgreSQL?
???
В PostgreSQL между ними **нет разницы в скорости**. `text` и `varchar` без ограничения — одно и то же по сути, `varchar(n)` лишь добавляет проверку длины.

`char(n)` дополняет строку пробелами до `n` и ведёт себя неочевидно (хвостовые пробелы игнорируются в сравнениях) — его почти не используют.

Практика: `text`, а ограничение длины, если нужно, — через `CHECK (char_length(name) <= 100)` или `varchar(n)`.

@@@ sql-38 | postgres, даты
`timestamp` или `timestamptz`?
???
Почти всегда `timestamptz` (`timestamp with time zone`). Он хранит **момент времени** (внутри — UTC) и при выводе переводит в часовой пояс сессии.

`timestamp` хранит «время на стенных часах» без пояса и **молча отбрасывает** смещение:

```sql
SET TIME ZONE 'Europe/Moscow';
SELECT '2026-01-01 12:00:00+00'::timestamptz; -- 2026-01-01 15:00:00+03
SELECT '2026-01-01 12:00:00+00'::timestamp;   -- 2026-01-01 12:00:00 (пояс потерян)
```

С `timestamp` события из разных часовых поясов становится невозможно корректно сравнить.
