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

Тело async-функции до первого `await` выполняется **синхронно**, как у обычной функции, поэтому `1` печатается сразу после `3`. На `await` функция приостанавливается и возвращает промис, а продолжение (`console.log(2)`) уходит в очередь микрозадач. Она выполнится, когда опустеет стек вызовов, — то есть после `4`.

`await null` ведёт себя как `await Promise.resolve(null)`: даже если значение не промис, продолжение всё равно асинхронное.

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

- Функция-исполнитель `new Promise(...)` вызывается **синхронно**, прямо в конструкторе.
- `resolve` не прерывает её, как `return`, — `3` всё равно печатается. Повторный `resolve` или `reject` после первого игнорируется.
- Колбэк `.then` всегда асинхронный (микрозадача), даже если промис уже выполнен, поэтому `2` идёт после синхронного `4`.

Из-за синхронного исполнителя исключение внутри него не вылетает наружу, а превращается в reject промиса.

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

- Объекты хранятся по ссылке: `b = a` копирует ссылку, а не объект. Изменение через `b` видно в `a`.
- Spread создаёт **новый** объект, поэтому `c` уже независим.
- Но копия поверхностная: вложенные объекты остаются общими. Если бы было `a = { x: { y: 1 } }`, то `c.x.y = 3` изменило бы и `a.x.y`.

Глубокую копию даёт `structuredClone(a)`. А `const` запрещает переприсвоить переменную, но не менять объект, на который она указывает.

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
- `arr`: `(string | number)[]` — массив можно менять, поэтому TS берёт общий тип элементов
- `tup`: `readonly [1, "a"]` — `as const` фиксирует длину, порядок и литералы
- `s`: `string` — `let` можно переприсвоить, поэтому тип расширяется (widening)
- `c`: `"hi"` — `const` не изменится, остаётся литерал

Расширение работает и в объектах: у `const o = { method: "GET" }` поле получит тип `string`, потому что его можно поменять. Поэтому передать `o` в функцию, которая ждёт `{ method: "GET" | "POST" }`, не получится. Лечится `as const` или `satisfies`.

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

@@@ out-19 | массивы, ловушка
Что выведет код?

```js
console.log(["1", "2", "3"].map(parseInt));
```
???
`[ 1, NaN, NaN ]`

`map` передаёт колбэку три аргумента: элемент, **индекс** и массив. А `parseInt` принимает второй аргумент — основание системы счисления:

- `parseInt("1", 0)` — основание 0 значит «по умолчанию», получается `1`;
- `parseInt("2", 1)` — основание 1 недопустимо → `NaN`;
- `parseInt("3", 2)` — в двоичной системе нет цифры 3 → `NaN`.

Правильно: `.map(Number)` или `.map((s) => parseInt(s, 10))`. Тот же подвох с любой функцией, у которой есть необязательный второй параметр.

@@@ out-20 | приведение типов, null
Что выведет код?

```js
console.log(null == 0);
console.log(null >= 0);
console.log(null == undefined);
console.log(undefined == 0);
```
???
`false`, `true`, `true`, `false`

- `==` для `null` работает по особому правилу: `null` равен только `undefined` (и сам себе), поэтому `null == 0` — `false`.
- Операторы сравнения `>`, `<`, `>=` приводят `null` к числу `0`, поэтому `null >= 0` → `0 >= 0` → `true`.
- `undefined` при приведении к числу даёт `NaN`, а любое сравнение с `NaN` ложно.

Получается, что `null` не больше нуля, не равен нулю, но «больше или равен». Поэтому со значениями, которые могут быть `null`, используют `===` и явные проверки.

@@@ out-21 | типы, typeof
Что выведет код?

```js
console.log(typeof NaN);
console.log(typeof []);
console.log(typeof null);
console.log(typeof function () {});
console.log(typeof class {});
console.log(Array.isArray([]));
```
???
`number`, `object`, `object`, `function`, `function`, `true`

- `NaN` — специальное значение **числового** типа («не число» в смысле результата операции).
- Массив — это объект, `typeof` его не отличает. Для проверки есть `Array.isArray`.
- `typeof null === "object"` — историческая ошибка первой версии JavaScript, которую не исправили ради совместимости. Проверяют так: `value === null`.
- Класс — это функция-конструктор.

Надёжная проверка «простого объекта»: `value !== null && typeof value === "object" && !Array.isArray(value)`.

@@@ out-22 | hoisting, функции
Что выведет код?

```js
console.log(sum(2, 3));
console.log(typeof multiply);

function sum(a, b) {
  return a + b;
}

var multiply = function (a, b) {
  return a * b;
};
```
???
`5`, затем `undefined`

- **Function declaration** всплывает целиком вместе с телом — её можно вызвать до объявления.
- **Function expression**, присвоенное через `var`, ведёт себя как переменная: всплывает только объявление `multiply` со значением `undefined`. Вызов `multiply(2, 3)` в этом месте упал бы с `TypeError: multiply is not a function`.
- Если бы было `const multiply = …`, обращение к переменной до объявления дало бы `ReferenceError` (временная мёртвая зона), и даже `typeof` не спас бы.

@@@ out-23 | async, промисы
Что выведет код?

```js
async function getValue() {
  return 1;
}

const result = getValue();
console.log(result instanceof Promise);
result.then((v) => console.log("then", v));
console.log("sync");
```
???
`true`, `sync`, `then 1`

`async`-функция **всегда** возвращает промис, даже если внутри `return 1`, — значение оборачивается в `Promise.resolve(1)`. Если внутри бросить ошибку, промис будет отклонён.

Колбэк `.then` — микрозадача: он выполнится только после текущего синхронного кода, поэтому `sync` печатается раньше.

Частая ошибка: `if (isAdmin())` для async-функции. Промис — объект, а значит, всегда truthy, и проверка проходит у всех пользователей. Нужно `if (await isAdmin())`.

@@@ out-24 | ошибки, event-loop
Что выведет код?

```js
try {
  setTimeout(() => {
    throw new Error("boom");
  }, 0);
} catch (e) {
  console.log("caught", e.message);
}
console.log("after");
```
???
`after`, затем **непойманная** ошибка `Error: boom`.

`try/catch` ловит только ошибки, которые произошли, пока выполнялся код внутри `try`. `setTimeout` лишь регистрирует колбэк и сразу возвращает управление. К моменту, когда колбэк выполнится, `try/catch` давно завершён — у ошибки другой стек вызовов.

Как правильно: `try/catch` внутри самого колбэка или промис с `await`:

```js
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  await wait(0);
  throw new Error("boom");
} catch (e) {
  console.log("caught", e.message); // поймается
}
```

@@@ out-25 | async, ошибки, ловушка
Что выведет код?

```js
async function withoutAwait() {
  try {
    return Promise.reject(new Error("fail"));
  } catch {
    return "caught";
  }
}

async function withAwait() {
  try {
    return await Promise.reject(new Error("fail"));
  } catch {
    return "caught";
  }
}

withoutAwait().then(console.log, (e) => console.log("rejected:", e.message));
withAwait().then(console.log, (e) => console.log("rejected:", e.message));
```
???
```
caught
rejected: fail
```

- В `withoutAwait` функция просто **возвращает** отклонённый промис. Внутри `try` ошибки не происходит, `catch` не срабатывает, и наружу уходит reject.
- В `withAwait` `await` дожидается промиса **внутри** `try`, ошибка выбрасывается там же и попадает в `catch`.

Порядок вывода: `caught` раньше, потому что возврат промиса из async-функции требует нескольких дополнительных микрозадач.

Правило: внутри `try` пиши `return await`, если хочешь, чтобы `catch` и `finally` обработали ошибку промиса.

@@@ out-26 | объекты, ключи
Что выведет код?

```js
const cache = {};
const a = { id: 1 };
const b = { id: 2 };

cache[a] = "first";
cache[b] = "second";

console.log(cache[a]);
console.log(Object.keys(cache));
```
???
`second`, затем `[ '[object Object]' ]`

Ключи обычного объекта — только строки (и символы). Объект в роли ключа приводится к строке через `toString()`, и **любой** простой объект превращается в `"[object Object]"`. Поэтому `a` и `b` дают один и тот же ключ, и второе присваивание перезаписывает первое.

Если ключами должны быть объекты, используй `Map` (или `WeakMap`, чтобы не мешать сборке мусора):

```js
const cache = new Map();
cache.set(a, "first");
cache.set(b, "second");
cache.get(a); // "first"
```

@@@ out-27 | массивы
Что выведет код?

```js
const arr = [1, 2, 3, 4];
arr.length = 2;
console.log(arr);

arr[4] = 5;
console.log(arr.length);

delete arr[0];
console.log(arr.length, arr[0]);
```
???
```
[ 1, 2 ]
5
5 undefined
```

- `length` можно записывать: уменьшение обрезает массив, лишние элементы удаляются.
- Запись по индексу 4 растягивает массив до длины 5. Индексы 2 и 3 становятся **дырами** (empty) — элементов там нет совсем.
- `delete arr[0]` удаляет элемент, но **не сдвигает** массив и не меняет длину — на месте остаётся дыра.

Дыры ведут себя по-разному: `forEach` и `map` их пропускают, а `for...of` и spread дают `undefined`. Удалять элементы нужно через `splice` или `filter`.

@@@ out-28 | сравнение, приведение типов
Что выведет код?

```js
console.log({} === {});
console.log([1] == 1);
console.log([1, 2] == "1,2");
console.log([] == false);
```
???
`false`, `true`, `true`, `true`

- Объекты сравниваются **по ссылке**: два литерала `{}` — два разных объекта, даже если они одинаковые внутри.
- При `==` между объектом и примитивом объект приводится к примитиву. Массив превращается в строку через `join(",")`: `[1]` → `"1"`, `[1, 2]` → `"1,2"`.
- `[] == false`: массив → `""`, `false` → `0`, `""` → `0`, получается `0 == 0`.

При этом `if ([])` выполнится — пустой массив **truthy**. Отсюда правило: всегда `===`. А для сравнения объектов по содержимому нужна своя функция или библиотека (`isEqual` из lodash).

@@@ out-29 | this, классы
Что выведет код?

```js
class User {
  name = "Аня";

  getNameArrow = () => this.name;

  getName() {
    return this.name;
  }
}

const user = new User();
const { getNameArrow, getName } = user;

console.log(getNameArrow());
try {
  console.log(getName());
} catch (e) {
  console.log(e.constructor.name);
}
```
???
`Аня`, затем `TypeError`

- `getNameArrow` — **поле класса** со стрелочной функцией. Оно создаётся в конструкторе, и `this` в стрелке навсегда указывает на экземпляр. Деструктуризация ему не мешает.
- `getName` — обычный метод из прототипа. После деструктуризации он вызывается без объекта, `this` равен `undefined` (тело класса всегда в строгом режиме), и чтение `this.name` бросает `TypeError`.

Отсюда классический совет для обработчиков событий в классовых компонентах: стрелки в полях или `bind` в конструкторе. Минус стрелок-полей: у каждого экземпляра своя копия функции, а не одна общая в прототипе.

@@@ out-30 | async, event-loop
Что выведет код?

```js
async function first() {
  console.log("first start");
  await second();
  console.log("first end");
}

async function second() {
  console.log("second");
}

console.log("script start");
setTimeout(() => console.log("timeout"), 0);
first();
new Promise((resolve) => {
  console.log("promise");
  resolve();
}).then(() => console.log("then"));
console.log("script end");
```
???
```
script start
first start
second
promise
script end
first end
then
timeout
```

1. Синхронно: `script start`, вызов `first` печатает `first start` и синхронно вызывает `second` → `second`.
2. `await` приостанавливает `first`; продолжение (`first end`) встаёт в очередь микрозадач **первым**.
3. Исполнитель `new Promise` синхронный → `promise`, а `.then` встаёт в очередь **вторым**.
4. `script end`, затем микрозадачи по порядку: `first end`, `then`.
5. Макрозадача `setTimeout` — последней.

@@@ out-31 | react, state, batching
Сколько будет `count` после одного клика и что напечатается в консоли?

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    console.log(count);
  };

  return <button onClick={handleClick}>{count}</button>;
}
```
???
В консоли `0`, а `count` станет `1`.

- `count` — константа **этого рендера**, она равна `0` до конца обработчика. Все три вызова — это `setCount(0 + 1)`.
- `setCount` не меняет переменную сразу, а ставит обновление в очередь. Новое значение появится только в **следующем** рендере, поэтому `console.log` печатает старое.
- React объединяет (batching) три обновления в один ререндер.

Чтобы прибавить три, нужна функция-обновление — она получает актуальное значение из очереди:

```jsx
setCount((c) => c + 1);
setCount((c) => c + 1);
setCount((c) => c + 1); // итог: 3
```

@@@ out-32 | react, state, ловушка
Каким будет `count` после одного клика?

```jsx
const [count, setCount] = useState(0);

const handleClick = () => {
  setCount((c) => c + 1);
  setCount(count + 5);
  setCount((c) => c * 2);
};
```
???
`10`

React обрабатывает очередь обновлений по порядку, начиная с текущего значения `0`:

1. `(c) => c + 1` → `0 + 1 = 1`;
2. `count + 5` — это **обычное значение**, вычисленное заранее из `count` этого рендера: `0 + 5 = 5`. Оно просто заменяет результат, предыдущий шаг теряется;
3. `(c) => c * 2` → `5 * 2 = 10`.

Вывод: функция-обновление опирается на результат предыдущих обновлений, а значение — на «снимок» state текущего рендера. Если новое состояние зависит от старого, всегда используй функцию.

@@@ out-33 | typescript, conditional types
Какие типы получатся?

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type NoDistribute<T> = [T] extends [unknown] ? T[] : never;

type A = ToArray<string | number>;
type B = NoDistribute<string | number>;
type C = ToArray<never>;
```
???
- `A`: `string[] | number[]`
- `B`: `(string | number)[]`
- `C`: `never`

Условный тип над «голым» параметром **дистрибутивен**: для union он применяется к каждому члену отдельно, а результаты объединяются. Поэтому `A` — union массивов: массив строк **или** массив чисел, но не смешанный.

В `B` параметр обёрнут в кортеж `[T]`, дистрибутивность отключается, и union обрабатывается целиком — получается один массив со смешанными элементами.

`never` — пустой union: дистрибутивному типу не к чему применяться, результат тоже `never`.

@@@ out-34 | приведение типов, числа
Что выведет код?

```js
console.log(+"");
console.log(+" 42 ");
console.log(+"1e3");
console.log(+[]);
console.log(+{});
console.log(+null, +undefined);
console.log(+"12px");
```
???
```
0
42
1000
0
NaN
0 NaN
NaN
```

Унарный `+` работает как `Number()`:

- пустая строка и строка из пробелов → `0`; пробелы по краям обрезаются;
- поддерживается экспоненциальная запись;
- `[]` → `""` → `0`; `{}` → `"[object Object]"` → `NaN`;
- `null` → `0`, а `undefined` → `NaN`;
- строка с лишними символами → `NaN`.

Для разбора CSS-значений нужен `parseFloat("12px")` → `12`: он читает число с начала строки и останавливается на первом неподходящем символе. Ловушка `Number("") === 0`: пустое поле формы молча превращается в ноль.

@@@ out-35 | приведение типов, строки
Что выведет код?

```js
console.log("b" + "a" + +"a" + "a");
console.log("5" * "2");
console.log("5" + 2);
console.log("5" - 2);
console.log(true + 1);
```
???
```
baNaNa
10
52
3
2
```

- `+"a"` — унарный плюс превращает `"a"` в `NaN`, а дальше `"ba" + NaN + "a"` склеивается в строку `"baNaNa"`.
- `*`, `-`, `/` работают только с числами и приводят строки к числу.
- Бинарный `+` особенный: если хотя бы один операнд — строка, он склеивает строки.
- `true` → `1`.

Из-за двойного смысла `+` значения из инпутов (всегда строки) нужно явно приводить к числу перед сложением: `Number(a) + Number(b)`.

@@@ out-36 | массивы, ловушка
Что выведет код?

```js
console.log(Array(3).map((_, i) => i));
console.log(Array.from({ length: 3 }, (_, i) => i));
console.log([...Array(3)].map((_, i) => i));
console.log(Array(3).fill(0));
```
???
```
[ <3 empty items> ]
[ 0, 1, 2 ]
[ 0, 1, 2 ]
[ 0, 0, 0 ]
```

`Array(3)` создаёт массив длиной 3, но **без элементов** — только дыры. `map`, `forEach` и `filter` пропускают дыры, поэтому колбэк не вызывается ни разу.

Spread и `Array.from` превращают дыры в настоящие элементы со значением `undefined`, и `map` уже работает. `fill` заполняет все позиции.

Ловушка с `fill` и объектами: `Array(3).fill([])` положит **один и тот же** массив в три ячейки. Для независимых объектов нужно `Array.from({ length: 3 }, () => [])`.

@@@ out-37 | генераторы
Что выведет код?

```js
function* dialog() {
  const name = yield "Как тебя зовут?";
  const age = yield `Привет, ${name}! Сколько тебе лет?`;
  return `${name}, ${age}`;
}

const it = dialog();
console.log(it.next().value);
console.log(it.next("Аня").value);
console.log(it.next(25));
console.log(it.next());
```
???
```
Как тебя зовут?
Привет, Аня! Сколько тебе лет?
{ value: 'Аня, 25', done: true }
{ value: undefined, done: true }
```

- Первый `next()` запускает генератор до первого `yield` и возвращает его значение. Аргумент первого `next` никуда не попадает — его некому принять.
- `next("Аня")` возобновляет работу: выражение `yield` внутри **возвращает** `"Аня"`, и оно записывается в `name`.
- `next(25)` доходит до `return` — его значение приходит с `done: true`.
- После завершения генератор всегда отдаёт `{ value: undefined, done: true }`.

Двусторонний обмен через `yield` — основа redux-saga и того, как async/await реализовывали до появления в языке.

@@@ out-38 | промисы, порядок
Что выведет код?

```js
const wait = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

Promise.all([wait(30, "a"), wait(10, "b"), "c"]).then(console.log);
Promise.race([wait(30, "a"), wait(10, "b")]).then(console.log);
```
???
```
b
[ 'a', 'b', 'c' ]
```

- `Promise.race` выполняется значением **первого** завершившегося промиса — `"b"` через 10 мс.
- `Promise.all` ждёт всех (30 мс) и возвращает результаты **в порядке исходного массива**, а не в порядке завершения. Обычные значения вроде `"c"` считаются уже выполненными промисами.

Поэтому `race` печатается раньше, хотя вызван вторым.

Если хотя бы один промис в `Promise.all` отклонится, весь результат сразу отклонится с этой ошибкой. Чтобы получить результаты всех, даже упавших, нужен `Promise.allSettled`.

@@@ out-39 | объекты, иммутабельность
Что выведет код? (ES-модуль, строгий режим)

```js
const user = { name: "Аня", tags: [] };
user.name = "Боб";

Object.freeze(user);
user.tags.push("admin");
console.log(user.name, user.tags);

try {
  user.name = "Вера";
} catch (e) {
  console.log(e.constructor.name);
}
console.log(user.name);
```
???
```
Боб [ 'admin' ]
TypeError
Боб
```

- `const` запрещает **переприсвоить переменную**, но объект менять можно — поэтому `"Боб"` записался.
- `Object.freeze` **поверхностный**: свойства самого объекта заморожены, а вложенный массив `tags` — нет, `push` сработал.
- В строгом режиме запись в замороженный объект бросает `TypeError`. В нестрогом скрипте присваивание молча проигнорировалось бы, без ошибки.

Глубокую неизменяемость дают рекурсивная заморозка, Immer или неизменяемые структуры данных.

@@@ out-40 | try, finally
Что выведет код?

```js
function first() {
  try {
    return "try";
  } finally {
    console.log("finally");
  }
}

function second() {
  try {
    return 1;
  } finally {
    return 2;
  }
}

console.log(first());
console.log(second());
```
???
```
finally
try
2
```

- `finally` выполняется **всегда** — даже после `return` в `try`. Значение `"try"` уже вычислено и «отложено», затем выполняется `finally`, и только потом функция возвращает результат.
- Если в `finally` есть свой `return`, он **перекрывает** результат `try` (и даже проглатывает брошенную в `try` ошибку).

Поэтому `return` и `throw` внутри `finally` считают плохой практикой: линтер ругается правилом `no-unsafe-finally`. В `finally` оставляют только очистку — закрыть соединение, снять флаг загрузки, убрать таймер.
