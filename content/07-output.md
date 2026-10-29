---
id: output
title: Что выведет код?
description: Задачи-ловушки с собесов: event loop, this, приведение типов, замыкания, типы TS
color: slate
icon: brain
---

@@@ out-01 | event-loop, промисы
Что выведет код?

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve()
  .then(() => console.log("C"))
  .then(() => console.log("D"));
queueMicrotask(() => console.log("E"));
console.log("F");
```
???
`A F C E D B`

1. Синхронно: `A`, `F`.
2. Микрозадачи по очереди постановки: `C` (первый `.then` встал в очередь сразу), затем `E`. Выполнение `C` ставит в очередь следующий `.then` — поэтому `D` идёт после `E`.
3. Макрозадача `setTimeout` — последней: `B`.

@@@ out-02 | async, event-loop
Что выведет код?

```js
async function f() {
  console.log(1);
  await null;
  console.log(2);
}
console.log(3);
f();
console.log(4);
```
???
`3 1 4 2`

Тело async-функции до первого `await` выполняется **синхронно**, поэтому `1` печатается сразу после `3`. Всё после `await` уходит в микрозадачу и выполняется, когда опустеет стек, — после `4`.

@@@ out-03 | event-loop
Что выведет код?

```js
setTimeout(() => console.log(1));
Promise.resolve().then(() => {
  console.log(2);
  setTimeout(() => console.log(3));
  Promise.resolve().then(() => console.log(4));
});
console.log(5);
```
???
`5 2 4 1 3`

- синхронно: `5`;
- микрозадача: `2`; внутри неё ставятся новая микрозадача (`4`) и новый таймер (`3`);
- очередь микрозадач выполняется до конца, поэтому `4` идёт сразу;
- таймеры по порядку постановки: сначала `1`, потом `3`.

@@@ out-04 | промисы
Что выведет код?

```js
const p = new Promise((resolve) => {
  console.log(1);
  resolve(2);
  console.log(3);
});
p.then((v) => console.log(v));
console.log(4);
```
???
`1 3 4 2`

Функция-исполнитель `new Promise(...)` вызывается **синхронно**. `resolve` не прерывает её — `3` всё равно печатается. Колбэк `.then` всегда асинхронный (микрозадача), даже если промис уже выполнен.

@@@ out-05 | промисы, ошибки
Что выведет код?

```js
Promise.reject(new Error("boom"))
  .then(() => console.log("then"))
  .catch((e) => {
    console.log("catch", e.message);
    return "ok";
  })
  .then((v) => console.log("after", v))
  .finally(() => console.log("finally"));
```
???
```
catch boom
after ok
finally
```

`.then` без обработчика ошибки пропускает reject дальше. `.catch` обрабатывает ошибку и возвращает обычное значение — цепочка снова становится успешной. `finally` вызывается в любом случае и не получает значение.

@@@ out-06 | async, ловушка
Что выведет код?

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  [3, 1, 2].forEach(async (n) => {
    await sleep(n * 10);
    console.log(n);
  });
  console.log("done");
}
run();
```
???
`done 1 2 3`

`forEach` не ждёт промисы, которые возвращает async-колбэк: он просто запускает три задачи и идёт дальше. Поэтому `done` печатается сразу, а числа — по мере срабатывания таймеров.

Чтобы дождаться всех: `await Promise.all(arr.map(async (n) => …))`. По очереди — `for...of` с `await`.

@@@ out-07 | this, strict
Что выведет код? (ES-модуль, то есть строгий режим)

```js
const counter = {
  count: 0,
  inc() {
    this.count++;
    return this.count;
  },
};
const inc = counter.inc;
console.log(counter.inc());
try {
  inc();
} catch (e) {
  console.log(e instanceof TypeError);
}
```
???
`1`, затем `true`

`counter.inc()` вызван как метод — `this` это `counter`. `inc()` вызван отдельно — контекст потерян, в строгом режиме `this === undefined`, и `this.count++` бросает `TypeError`.

В нестрогом скрипте `this` был бы `globalThis`: ошибки нет, функция вернула бы `NaN`.

@@@ out-08 | hoisting, tdz
Что выведет код?

```js
console.log(typeof a, typeof b);
var a = 1;
let b = 2;
```
???
`ReferenceError` — ничего не напечатается.

`var a` всплывает со значением `undefined`, а `b` до своей строки находится во временной мёртвой зоне. Ловушка в том, что `typeof` от TDZ **не защищает**: он безопасен только для необъявленных переменных (`typeof neverDeclared === "undefined"`).

@@@ out-09 | приведение типов
Что выведет код?

```js
console.log([] + []);
console.log([] + {});
console.log(1 + "2" - 1);
console.log("5" * "2");
console.log(null + 1, undefined + 1);
console.log([] == false);
```
???
```
                      ← пустая строка
[object Object]
11
10
1 NaN
true
```

- `+` с объектом приводит его к строке: `[]` → `""`, `{}` → `"[object Object]"`.
- `1 + "2"` — конкатенация `"12"`, затем `-` приводит к числу: `11`.
- `*` всегда числовой: `10`.
- `null` → `0`, `undefined` → `NaN`.
- `[] == false`: обе стороны приводятся к числу, `0 == 0`.

@@@ out-10 | числа
Что выведет код?

```js
console.log(0.1 + 0.2 === 0.3);
console.log((0.1 + 0.2).toFixed(2));
console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON);
```
???
`false`, `"0.30"`, `true`

Числа — это двоичные float64 (IEEE 754): `0.1` и `0.2` нельзя записать точно, сумма равна `0.30000000000000004`. Дробные числа сравнивают с допуском. Деньги хранят в целых копейках или используют библиотеки вроде decimal.js.

@@@ out-11 | массивы, ловушка
Что выведет код?

```js
console.log([1, 10, 2, 21].sort());
console.log(["b", "a", "C"].sort());
console.log([1, 2, 3].map(parseInt));
```
???
```
[ 1, 10, 2, 21 ]
[ 'C', 'a', 'b' ]
[ 1, NaN, NaN ]
```

- `sort()` без компаратора сравнивает **строки** по кодам UTF-16: `"10" < "2"`, а заглавные буквы идут раньше строчных. Для чисел нужно `sort((a, b) => a - b)`, для слов — `localeCompare`.
- `map` передаёт `(value, index)`, а `parseInt` понимает второй аргумент как систему счисления: `parseInt("2", 1)` и `parseInt("3", 2)` дают `NaN`.

@@@ out-12 | объекты, ссылки
Что выведет код?

```js
const a = { x: 1 };
const b = a;
b.x = 2;
const c = { ...a };
c.x = 3;
console.log(a.x, b.x, c.x);
```
???
`2 2 3`

`b` — та же ссылка, что и `a`, поэтому изменение через `b` видно в `a`. Spread создаёт **новый** объект, и `c` уже независим (но только на верхнем уровне — вложенные объекты остались бы общими).

@@@ out-13 | объекты
Что выведет код?

```js
const o = { b: 1, 2: "x", a: 2, 1: "y" };
console.log(Object.keys(o));
```
???
`[ '1', '2', 'b', 'a' ]`

Порядок ключей объекта определён спецификацией: сначала ключи-целые числа по возрастанию, затем строковые — в порядке добавления, затем символы. Если важен порядок вставки для любых ключей, используй `Map`.

@@@ out-14 | замыкания, scope
Что выведет код?

```js
function makeGetters() {
  const fns = [];
  for (var i = 0; i < 3; i++) fns.push(() => i);
  return fns.map((f) => f());
}
console.log(makeGetters());

const x = 10;
function show() {
  console.log(x);
}
function run() {
  const x = 20;
  show();
}
run();
```
???
`[ 3, 3, 3 ]`, затем `10`

- `var` — одна переменная на всю функцию: к моменту вызова стрелок цикл закончился и `i === 3`. С `let` было бы `[0, 1, 2]` — у каждой итерации своя копия.
- Область видимости **лексическая**: `show` видит `x` там, где объявлена, а не там, где вызвана.

@@@ out-15 | json
Что выведет код?

```js
console.log(
  JSON.stringify({ a: undefined, b: () => 1, c: NaN, d: new Date(0), e: [undefined] }),
);
JSON.stringify({ n: 1n });
```
???
```
{"c":null,"d":"1970-01-01T00:00:00.000Z","e":[null]}
TypeError: Do not know how to serialize a BigInt
```

- свойства со значением `undefined` и функции **пропадают**;
- `NaN` и `Infinity` становятся `null`;
- `Date` превращается в ISO-строку (у неё есть `toJSON`);
- в массиве `undefined` заменяется на `null`, чтобы не сбить индексы;
- `BigInt` сериализовать нельзя — нужно своё преобразование.

@@@ out-16 | typescript, excess property
На какой строке TypeScript покажет ошибку?

```ts
type Animal = { name: string };
type Dog = Animal & { bark(): void };

const d: Dog = { name: "Rex", bark() {} };
const a1: Animal = d;                          // 1
const a2: Animal = { name: "Rex", bark() {} }; // 2
```
???
Только на строке **2**.

Структурная типизация разрешает лишние поля, поэтому `Dog` можно присвоить в `Animal` (строка 1). Но для **объектного литерала**, присваиваемого прямо в переменную с типом, работает excess property check: лишнее поле в литерале — скорее всего опечатка.

@@@ out-17 | typescript, вывод типов
Какие типы выведет TypeScript?

```ts
const arr = [1, "a"];
const tup = [1, "a"] as const;
let s = "hi";
const c = "hi";
```
???
- `arr`: `(string | number)[]`
- `tup`: `readonly [1, "a"]`
- `s`: `string` — `let` можно переприсвоить, поэтому тип расширяется (widening)
- `c`: `"hi"` — `const` не изменится, остаётся литерал

@@@ out-18 | typescript, union, ловушка
Чему равны типы?

```ts
type A = { a: string; c: number };
type B = { b: string; c: number };

type K1 = keyof (A | B);
type K2 = keyof (A & B);

type X = { kind: "x" };
type Y = { kind: "y" };
type Z = X & Y;
```
???
- `K1 = "c"` — у union доступны только **общие** ключи;
- `K2 = "a" | "b" | "c"` — у пересечения есть **все** ключи;
- `Z = never` — у `kind` несовместимые литералы `"x" & "y"`, и TypeScript сворачивает такое пересечение объектов целиком в `never`.

Если конфликтуют не литералы (например, `{ v: string } & { v: number }`), объект остаётся, но поле `v` получает тип `never`.
