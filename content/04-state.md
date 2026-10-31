---
id: state
title: Redux и Zustand
description: Стейт-менеджеры с самых основ — зачем, как устроены, что выбрать
color: fuchsia
icon: boxes
---

@@@ state-01 | основы
Зачем нужен стейт-менеджер, если есть `useState` и Context?
???
`useState` — локальное состояние компонента. Когда одни данные нужны многим далёким компонентам, приходится пробрасывать пропсы или класть всё в Context. Но Context ререндерит всех потребителей при любом изменении.

Стейт-менеджер хранит состояние **вне React**. Компоненты подписываются на нужные кусочки через селекторы и перерисовываются только при их изменении.

Ещё плюсы: логика отделена от UI, есть devtools и persist.

@@@ state-02 | основы, server state
Чем серверное состояние отличается от клиентского? Где хранить данные из API?
???
**Клиентское** принадлежит UI: открыта ли модалка, тема, черновик формы.

**Серверное** — копия данных с сервера. Оно может устареть и требует кэша, повторных запросов и инвалидации. Его лучше отдать TanStack Query, RTK Query или SWR, а не хранить вручную в Redux/Zustand.

В сторе остаётся только по-настоящему клиентское состояние.

@@@ state-03 | redux, основы
Три принципа Redux.
???
1. **Единый источник правды** — всё состояние в одном сторе.
2. **Состояние только для чтения** — изменить его можно только отправкой action (объект `{ type, payload }`).
3. **Изменения — чистыми функциями**: reducer `(state, action) => newState` без мутаций и побочных эффектов.

Поток: UI → `dispatch(action)` → reducer → новый state → подписчики перерисовываются.

@@@ state-04 | redux, основы
Что такое action, reducer, dispatch и store?
???
- **Action** — описание события: `{ type: "todos/added", payload: "Купить молоко" }`.
- **Reducer** — чистая функция, которая возвращает новое состояние.
- **Dispatch** — метод стора, отправляющий action в reducer.
- **Store** — объект, который хранит state и даёт `getState`, `dispatch`, `subscribe`.

```ts
function todos(state: string[] = [], action: { type: string; payload: string }) {
  switch (action.type) {
    case "todos/added":
      return [...state, action.payload];
    default:
      return state;
  }
}
```

@@@ state-05 | redux, rtk
Что такое Redux Toolkit и `createSlice`?
???
RTK — официальный способ писать Redux без бойлерплейта. `createSlice` генерирует reducer и action creators из одного объекта:

```ts
const todosSlice = createSlice({
  name: "todos",
  initialState: [] as Todo[],
  reducers: {
    added(state, action: PayloadAction<string>) {
      // «мутация» разрешена — внутри Immer
      state.push({ id: nanoid(), text: action.payload, done: false });
    },
    toggled(state, action: PayloadAction<string>) {
      const todo = state.find((t) => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
  },
});

export const { added, toggled } = todosSlice.actions;
```

@@@ state-06 | redux, immer
Почему в `createSlice` можно «мутировать» state?
???
RTK оборачивает редьюсеры в **Immer**. Ты меняешь черновик (Proxy), Immer записывает изменения и создаёт новый неизменяемый объект. Неизменённые ветки сохраняют прежние ссылки.

Правило: либо мутируй черновик, либо **возвращай** новое значение — но не то и другое сразу. Вне Immer мутации по-прежнему ломают Redux.

@@@ state-07 | redux, rtk, typescript
Как подключить Redux Toolkit к React с типизацией?
???
```ts
export const store = configureStore({
  reducer: { todos: todosSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
```

В корне — `<Provider store={store}>`. В компоненте: `useAppSelector((s) => s.todos)` и `dispatch(added("…"))`. `configureStore` сам подключает devtools и thunk.

@@@ state-08 | redux, селекторы
Что такое селектор и зачем мемоизировать селекторы?
???
Селектор — функция `state => часть`. `useSelector` ререндерит компонент, когда результат селектора изменился **по ссылке**.

Если селектор каждый раз создаёт новый массив (`state.todos.filter(…)`), компонент перерисовывается при любом изменении стора. `createSelector` (Reselect) кэширует результат, пока входные данные те же:

```ts
const selectDone = createSelector(
  [(s: RootState) => s.todos],
  (todos) => todos.filter((t) => t.done),
);
```

@@@ state-09 | redux, async
Как делать асинхронные операции в Redux? Что такое thunk?
???
Редьюсеры синхронные и чистые, поэтому асинхронность выносят в middleware. **Thunk** — функция, которую можно отправить в `dispatch`; она получает `dispatch` и `getState`.

В RTK есть `createAsyncThunk` — он генерирует экшены `pending`, `fulfilled`, `rejected`:

```ts
export const fetchTodos = createAsyncThunk("todos/fetch", async () => {
  const res = await fetch("/api/todos");
  return (await res.json()) as Todo[];
});

// в extraReducers:
// builder.addCase(fetchTodos.fulfilled, (state, action) => action.payload)
```

@@@ state-10 | redux, middleware
Что такое middleware в Redux?
???
Прослойка между `dispatch` и редьюсером. Экшен проходит через цепочку middleware, и каждая может его пропустить, изменить, задержать или остановить:

```ts
const logger: Middleware = (store) => (next) => (action) => {
  console.log("до", store.getState());
  const result = next(action); // передать дальше по цепочке
  console.log("после", store.getState());
  return result;
};
```

Именно здесь живут побочные эффекты, ведь редьюсеры обязаны быть чистыми. Примеры: thunk (разрешает диспатчить функции), логгер, аналитика, `listenerMiddleware` в RTK, RTK Query.

`configureStore` уже подключает thunk и dev-проверки; свои добавляют так: `middleware: (getDefault) => getDefault().concat(logger)`.

@@@ state-11 | redux, rtk query
Что такое RTK Query?
???
Слой загрузки данных в Redux Toolkit, аналог TanStack Query. Описываешь эндпоинты — получаешь хуки с кэшем, дедупликацией, статусами загрузки и инвалидацией по тегам:

```ts
const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Todo"],
  endpoints: (b) => ({
    getTodos: b.query<Todo[], void>({
      query: () => "todos",
      providesTags: ["Todo"],
    }),
    addTodo: b.mutation<Todo, string>({
      query: (text) => ({ url: "todos", method: "POST", body: { text } }),
      invalidatesTags: ["Todo"], // после добавления список перезапросится
    }),
  }),
});

export const { useGetTodosQuery, useAddTodoMutation } = api;
```

@@@ state-12 | zustand, основы
Как создать стор в Zustand?
???
Стор — это хук. Состояние и экшены лежат вместе, Provider не нужен:

```ts
import { create } from "zustand";

type Bears = { bears: number; add: () => void; reset: () => void };

export const useBears = create<Bears>()((set) => ({
  bears: 0,
  add: () => set((s) => ({ bears: s.bears + 1 })),
  reset: () => set({ bears: 0 }),
}));

// в компоненте
const bears = useBears((s) => s.bears);
const add = useBears((s) => s.add);
```

Двойные скобки `create<T>()(…)` нужны, чтобы TS вывел типы для middleware.

@@@ state-13 | zustand, основы
Как работает `set` в Zustand? Нужно ли копировать всё состояние?
???
`set` делает **поверхностное слияние** верхнего уровня: `set({ bears: 1 })` не трогает остальные поля. Вложенные объекты сливают вручную:

```ts
set((s) => ({ user: { ...s.user, name } }));
```

- `set(state, true)` — полная замена состояния;
- `get()` внутри экшена читает текущее состояние без подписки;
- мутировать нельзя, если не подключён middleware `immer`.

@@@ state-14 | zustand, селекторы
Почему в Zustand важны селекторы? Что такое `useShallow`?
???
`useStore()` без селектора подписывает компонент на **всё** состояние — ререндер при любом изменении. Селектор `useStore((s) => s.bears)` подписывает только на нужное.

Если селектор возвращает новый объект или массив, сравнение по ссылке всегда видит изменение. Тогда нужен `useShallow`:

```ts
import { useShallow } from "zustand/react/shallow";

const { bears, add } = useBears(
  useShallow((s) => ({ bears: s.bears, add: s.add })),
);
```

В Zustand 5 новый объект из селектора без `useShallow` может вызвать бесконечный цикл ререндеров.

@@@ state-15 | zustand, persist
Как сохранить Zustand-стор между перезагрузками?
???
Middleware `persist`:

```ts
export const useSettings = create<Settings>()(
  persist(
    (set) => ({ theme: "dark", setTheme: (theme) => set({ theme }) }),
    {
      name: "settings",                                // ключ в хранилище
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme }),        // что сохранять
      version: 1,                                      // + migrate при смене формата
    },
  ),
);
```

С асинхронным хранилищем (IndexedDB) стор восстанавливается не сразу, поэтому нужен флаг готовности. Так сделано в этом приложении.

@@@ state-16 | zustand
Как читать и менять Zustand-стор вне компонентов?
???
Хук, который возвращает `create`, — это ещё и объект стора с API:

```ts
useBears.getState().add();        // прочитать состояние или вызвать экшен
useBears.setState({ bears: 10 }); // записать (поверхностное слияние)

const unsubscribe = useBears.subscribe((state, prev) => {
  if (state.bears !== prev.bears) console.log(state.bears);
});
```

Удобно в утилитах, тестах, обработчиках WebSocket, интерцепторах axios (например, достать токен).

Ловушка: `getState()` в теле компонента не подписывает его на изменения — компонент не перерисуется. В компонентах читай через хук с селектором, а `getState()` используй в обработчиках событий и вне React.

@@@ state-17 | zustand, архитектура
Как организовать большой Zustand-стор и подключить devtools?
???
Два пути: делить на **слайсы** (функции, возвращающие часть состояния) и собирать их в одном `create` — или заводить несколько независимых сторов по доменам. Второе обычно проще.

Devtools — middleware `devtools`, работает с расширением Redux DevTools:

```ts
const useApp = create<State>()(
  devtools(
    persist(
      (...a) => ({ ...createUserSlice(...a), ...createCartSlice(...a) }),
      { name: "app" },
    ),
  ),
);
```

@@@ state-18 | сравнение
Redux Toolkit, Zustand или Context — что выбрать?
???
- **Context** — редко меняющиеся данные (тема, локаль, текущий пользователь), без библиотек.
- **Zustand** — простой глобальный клиентский стейт: минимум кода, без Provider, точечные подписки.
- **Redux Toolkit** — большие команды и приложения: строгий однонаправленный поток, devtools с time-travel, middleware, RTK Query, устоявшиеся паттерны.

Серверные данные в любом случае — в TanStack Query или RTK Query.

@@@ state-19 | иммутабельность
Как Redux и Zustand понимают, что состояние изменилось?
???
Сравнением **по ссылке** (`Object.is`) — это дёшево, не нужно обходить объект целиком. Поэтому изменение должно создавать новые объекты на всём пути к изменённому полю, а неизменённые части — сохранять старые ссылки:

```ts
// новый state, новый user, но settings — та же ссылка
set((s) => ({ user: { ...s.user, name } }));
```

Тогда селектор `s => s.settings` вернёт прежнюю ссылку, и подписанные на него компоненты не перерисуются.

Мутация «на месте» (`s.user.name = name`) ссылку не меняет — подписчики не узнают об изменении, и UI не обновится. Immer внутри `createSlice` позволяет писать «мутирующий» код, но под капотом создаёт новые объекты.

@@@ state-20 | архитектура
Что такое однонаправленный поток данных?
???
Данные движутся по кругу в одну сторону: **state → view → action → новый state**. Представление не меняет состояние напрямую, а только сообщает о событиях. Поэтому изменения предсказуемы и их легко отследить.

Это архитектура Flux, из которой вырос Redux. В самом React так же: пропсы идут вниз, события — вверх через колбэки.

@@@ state-21 | zustand, производные данные
Нужно ли хранить в сторе вычисляемые данные (сумму корзины, отфильтрованный список)?
???
Обычно **нет**. Хранят минимальное исходное состояние, а производное вычисляют в селекторе:

```ts
const useCart = create<Cart>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
}));

// в компоненте
const total = useCart((s) => s.items.reduce((sum, i) => sum + i.price * i.qty, 0));
```

Иначе придётся синхронизировать `items` и `total` при каждом изменении, и рано или поздно они разъедутся. Число — примитив, поэтому такой селектор не вызывает лишних ререндеров. Если селектор возвращает новый массив, нужен `useShallow` или мемоизация.

@@@ state-22 | zustand, immer
Как писать «мутирующие» обновления в Zustand, как в Redux Toolkit?
???
Подключить middleware `immer` (нужен пакет `immer`):

```ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const useTodos = create<State>()(
  immer((set) => ({
    todos: [],
    toggle: (id) =>
      set((s) => {
        const todo = s.todos.find((t) => t.id === id);
        if (todo) todo.done = !todo.done; // мутируем черновик
      }),
  })),
);
```

Без него для вложенных изменений приходится вручную копировать каждый уровень через spread.

@@@ state-23 | zustand, next, ssr
Почему глобальный Zustand-стор опасен в Next.js с SSR и как быть?
???
Модуль со стором загружается на сервере **один раз** и живёт между запросами. Если записать в него данные пользователя при рендере, следующий запрос другого пользователя увидит чужое состояние.

Решение — создавать стор **на каждый запрос** через фабрику и раздавать его через контекст:

```tsx
import { createStore, useStore } from "zustand";

const createCounterStore = (init = 0) =>
  createStore<{ count: number; inc: () => void }>()((set) => ({
    count: init,
    inc: () => set((s) => ({ count: s.count + 1 })),
  }));

const StoreContext = createContext<ReturnType<typeof createCounterStore> | null>(null);

export function CounterProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createCounterStore());
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
```

В компоненте: `useStore(store, (s) => s.count)`. Клиентские SPA без SSR этой проблемы не имеют.

@@@ state-24 | redux, сериализуемость
Почему в Redux нельзя класть в state и actions несериализуемые значения?
???
Функции, промисы, `Map`, `Set`, экземпляры классов, DOM-узлы ломают:

- devtools и time-travel — их нельзя показать и восстановить;
- сохранение state (persist) и SSR-гидратацию;
- сравнение по ссылке и предсказуемость обновлений.

Redux Toolkit по умолчанию включает в dev-режиме `serializableCheck` middleware: он предупреждает о таких значениях. Даты обычно хранят как ISO-строки или timestamp.

@@@ state-25 | redux, нормализация
Что такое нормализация state и `createEntityAdapter`?
???
Вместо вложенных массивов хранят сущности как **таблицу**: `{ ids: [...], entities: { [id]: item } }`. Поиск по id становится O(1), обновление одной сущности не требует обхода массива, а дубликатов в разных местах дерева нет.

RTK даёт готовый адаптер:

```ts
const postsAdapter = createEntityAdapter<Post>();

const postsSlice = createSlice({
  name: "posts",
  initialState: postsAdapter.getInitialState(),
  reducers: {
    added: postsAdapter.addOne,
    updated: postsAdapter.updateOne,
    removed: postsAdapter.removeOne,
  },
});

export const { selectAll, selectById } = postsAdapter.getSelectors((s: RootState) => s.posts);
```

@@@ state-26 | tanstack query
Как устроен TanStack Query? Чем `staleTime` отличается от `gcTime`?
???
Кэш серверных данных по ключу запроса:

```tsx
const { data, isPending, error } = useQuery({
  queryKey: ["todos", { page }], // при смене ключа — новый запрос
  queryFn: () => fetchTodos(page),
  staleTime: 60_000,
});
```

- `staleTime` (по умолчанию **0**) — сколько данные считаются свежими. Пока свежие, повторного запроса нет. Устаревшие показываются мгновенно из кэша, но перезапрашиваются в фоне: при монтировании, фокусе окна, восстановлении сети.
- `gcTime` (по умолчанию **5 минут**; в v4 назывался `cacheTime`) — сколько хранить в памяти данные, на которые никто не подписан.

Дедупликация: несколько компонентов с одним ключом делают один запрос.

@@@ state-27 | tanstack query, мутации
Как обновить данные после мутации в TanStack Query?
???
Чаще всего — **инвалидировать** связанные запросы, чтобы они перезапросились:

```tsx
const queryClient = useQueryClient();

const addTodo = useMutation({
  mutationFn: (text: string) => api.post("/todos", { text }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
});
```

`invalidateQueries` по префиксу ключа задевает и `["todos", { page: 2 }]`.

Если ответ мутации уже содержит новые данные — `queryClient.setQueryData(key, …)` без лишнего запроса. Для мгновенного UI — оптимистичное обновление в `onMutate` с откатом в `onError`.

@@@ state-28 | атомы, jotai
Что такое атомарный стейт-менеджмент (Jotai) и чем он отличается от стора?
???
Вместо одного большого стора — множество маленьких независимых **атомов**, которые можно комбинировать:

```ts
const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2); // производный атом

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubled = useAtomValue(doubledAtom);
}
```

Подписка точечная: компонент перерисуется, только если изменился его атом. Модель похожа на `useState`, но общий для всего приложения.

Сравнение: **Zustand** и **Redux** — «сверху вниз» (один стор, селекторы), **Jotai** — «снизу вверх» (атомы и зависимости между ними).

@@@ state-29 | redux toolkit, store
Что `configureStore` настраивает по умолчанию?
???
По сравнению со старым `createStore` он сразу включает разумные настройки:

- **объединяет редьюсеры**: можно передать объект `{ todos, user }` вместо ручного `combineReducers`;
- **подключает middleware**: `thunk` для асинхронной логики;
- **в dev-режиме добавляет проверки**: ругается, если state мутируют вне Immer или кладут в него несериализуемые значения (`Date`, `Map`, функции);
- **включает Redux DevTools**.

```ts
export const store = configureStore({
  reducer: { todos: todosReducer, user: userReducer },
  middleware: (getDefault) => getDefault().concat(logger),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

Важно: в RTK 2 `middleware` принимает только функцию, а свои middleware добавляют через `getDefault().concat(...)`. Если вернуть только свой массив (`() => [logger]`), стандартные — thunk и проверки — пропадут.

@@@ state-30 | redux toolkit, async
Как обработать загрузку и ошибку `createAsyncThunk` в слайсе?
???
Thunk сам диспатчит три экшена, а слайс ловит их в `extraReducers`:

```ts
export const fetchUser = createAsyncThunk(
  "user/fetch",
  async (id: string, { rejectWithValue }) => {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) return rejectWithValue(`Ошибка ${res.status}`);
    return (await res.json()) as User;
  },
);

const userSlice = createSlice({
  name: "user",
  initialState: { data: null as User | null, status: "idle", error: null as string | null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(fetchUser.fulfilled, (state, action) => { state.status = "succeeded"; state.data = action.payload; })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? action.error.message ?? "Ошибка";
      });
  },
});
```

`rejectWithValue` кладёт свою ошибку в `action.payload`; обычное исключение попадает в `action.error`. Статус лучше хранить строкой (`"idle" | "loading" | …`), а не набором флагов `isLoading` + `isError`. В RTK 2 `extraReducers` принимает только функцию с `builder`.

@@@ state-31 | redux toolkit, side effects
Что такое `listenerMiddleware` и когда он нужен?
???
Способ реагировать на экшены побочными эффектами — замена redux-saga и redux-observable для большинства задач:

```ts
const listener = createListenerMiddleware();

listener.startListening({
  actionCreator: cartItemAdded,
  effect: async (action, api) => {
    api.cancelActiveListeners(); // как debounce: отменить прошлый запуск
    await api.delay(500);
    await saveCart(api.getState().cart);
  },
});

const store = configureStore({
  reducer,
  middleware: (getDefault) => getDefault().prepend(listener.middleware),
});
```

Чем отличается от thunk: thunk вызывают явно (`dispatch(fetchX())`), а слушатель срабатывает **сам**, когда произошло событие. Это удобно для реакций «когда X — сделать Y»: автосохранение, аналитика, синхронизация с `localStorage`, показ тоста после успешного запроса.

Есть `api.condition(...)` (подождать нужного состояния) и `api.fork(...)` (дочерняя задача) — этого хватает для сложных сценариев без генераторов saga.

@@@ state-32 | redux, селекторы, ловушка
Почему `useSelector((s) => ({ a: s.a, b: s.b }))` вызывает лишние ререндеры?
???
`useSelector` вызывает селектор после **каждого** экшена в сторе и сравнивает результат с прошлым через `===`. Селектор, который возвращает новый объект, всегда даёт новую ссылку — компонент перерисовывается при любом изменении в сторе, даже чужом.

Решения:

```ts
// 1. Несколько селекторов — по одному на значение
const a = useSelector((s: RootState) => s.a);
const b = useSelector((s: RootState) => s.b);

// 2. Поверхностное сравнение
import { shallowEqual } from "react-redux";
const { a, b } = useSelector((s: RootState) => ({ a: s.a, b: s.b }), shallowEqual);

// 3. Мемоизированный селектор для вычислений
const selectDone = createSelector([(s: RootState) => s.todos], (todos) => todos.filter((t) => t.done));
```

`filter`, `map` и spread внутри селектора — тот же случай. В dev-режиме React-Redux предупреждает, если селектор возвращает разные ссылки для одного и того же состояния. В Zustand аналог — `useShallow`.

@@@ state-33 | redux toolkit, actions
Что такое `prepare` в `createSlice` и зачем он нужен?
???
Функция, которая формирует `payload` **до** того, как экшен попадёт в редьюсер. Туда выносят генерацию id, даты и преобразование аргументов:

```ts
const todosSlice = createSlice({
  name: "todos",
  initialState: [] as Todo[],
  reducers: {
    todoAdded: {
      reducer(state, action: PayloadAction<Todo>) {
        state.push(action.payload);
      },
      prepare(text: string) {
        return { payload: { id: nanoid(), text, createdAt: new Date().toISOString() } };
      },
    },
  },
});

dispatch(todoAdded("Купить молоко"));
```

Почему не генерировать id в самом редьюсере: редьюсер должен быть **чистым и детерминированным**. Тот же экшен при повторном проигрывании (time travel в DevTools, тесты) обязан давать тот же результат, а `nanoid()` и `Date.now()` каждый раз разные.

Дата хранится строкой, потому что `Date` — несериализуемое значение.

@@@ state-34 | redux, редьюсеры
Что нельзя делать в редьюсере?
???
Редьюсер — чистая функция `(state, action) => newState`. Поэтому в нём **нельзя**:

- делать запросы, писать в `localStorage`, менять URL, показывать тосты — всё это побочные эффекты (их место в thunk, listener или компоненте);
- вызывать `dispatch` — другой экшен должен быть результатом логики снаружи;
- использовать случайные значения и текущее время (`Math.random()`, `Date.now()`) — выносим в `prepare` или в аргументы экшена;
- мутировать state вне Immer (в обычном Redux) и мутировать `action.payload`;
- быть асинхронным.

Можно и нужно: вычислять новое состояние только из `state` и `action`.

Зачем такие строгости: предсказуемость (одинаковый вход → одинаковый результат), простые тесты без моков, time travel в DevTools и уверенность, что повтор экшена ничего не сломает.

@@@ state-35 | redux toolkit, слайсы
Может ли слайс реагировать на экшены другого слайса?
???
Да, через `extraReducers`. Так один экшен меняет несколько частей состояния, и не нужно диспатчить два экшена подряд:

```ts
// authSlice
export const loggedOut = createAction("auth/loggedOut");

// cartSlice
const cartSlice = createSlice({
  name: "cart",
  initialState: [] as CartItem[],
  reducers: { /* ... */ },
  extraReducers: (builder) => {
    builder.addCase(loggedOut, () => []); // при выходе очистить корзину
  },
});
```

`reducers` создаёт **свои** экшены слайса, `extraReducers` — только слушает чужие (или экшены `createAsyncThunk`).

Это основной принцип Redux: экшен описывает **событие** («пользователь вышел»), а не команду («очистить корзину»). Какие слайсы и как на него реагируют, решают сами слайсы. Благодаря этому одно событие легко подхватить в новом месте, не меняя код отправителя.

@@@ state-36 | zustand, архитектура
Где хранить экшены в Zustand: внутри стора или отдельно?
???
Обычно экшены кладут в стор рядом с данными:

```ts
const useCart = create<CartState>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
}));

const add = useCart((s) => s.add);
```

Документация Zustand предлагает и альтернативу — экшены как обычные функции модуля:

```ts
export const useCart = create(() => ({ items: [] as Item[] }));

export const addItem = (item: Item) =>
  useCart.setState((s) => ({ items: [...s.items, item] }));
```

Плюсы второго варианта: экшен вызывается откуда угодно без хука и селектора, его проще тестировать и разбивать по файлам, в сторе остаются только данные (удобно для `persist` и сброса).

Минус — нет одного места, где видно всё API стора. Оба подхода нормальные, главное — единообразие в проекте.

@@@ state-37 | zustand, persist, миграции
Как обновить сохранённый Zustand-стор, если поменялась структура данных?
???
У `persist` есть номер версии и функция миграции. Если версия в хранилище меньше текущей, перед гидратацией вызовется `migrate`:

```ts
const useSettings = create<Settings>()(
  persist(
    (set) => ({ theme: "light", setTheme: (theme) => set({ theme }) }),
    {
      name: "settings",
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          const old = persisted as { dark: boolean };
          return { theme: old.dark ? "dark" : "light" };
        }
        return persisted as Settings;
      },
      partialize: (s) => ({ theme: s.theme }), // сохранять только данные
    },
  ),
);
```

Без миграции у пользователей со старыми данными приложение может упасть на поле, которого раньше не было.

Ещё полезное: `partialize` — не сохранять функции и временные поля; `onRehydrateStorage` — узнать, когда данные загрузились; `skipHydration` — запустить гидратацию вручную (например, после монтирования в Next.js).

@@@ state-38 | zustand, тесты
Как сбросить Zustand-стор (при выходе из аккаунта или между тестами)?
???
Вынести начальное состояние в константу и добавить экшен `reset`:

```ts
const initialState = { items: [] as Item[], coupon: null as string | null };

const useCart = create<typeof initialState & Actions>()((set) => ({
  ...initialState,
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  reset: () => set(initialState),
}));
```

`set` по умолчанию **сливает** объект с текущим состоянием, поэтому экшены сохранятся.

Ловушка: `set(initialState, true)` (режим replace) заменит состояние целиком — и экшены пропадут.

Для тестов есть встроенный способ — вернуть стор к начальному состоянию, включая экшены:

```ts
beforeEach(() => {
  useCart.setState(useCart.getInitialState(), true);
});
```

Если используется `persist`, после выхода стоит ещё очистить хранилище: `useCart.persist.clearStorage()`.

@@@ state-39 | zustand, внутреннее устройство
Как Zustand устроен внутри и почему ему не нужен провайдер?
???
Ядро — маленькая функция `createStore`: состояние хранится в замыкании, подписчики — в `Set`:

```ts
const createStore = (init) => {
  let state;
  const listeners = new Set();
  const setState = (partial) => {
    const next = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(next, state)) {
      const prev = state;
      state = Object.assign({}, state, next);
      listeners.forEach((l) => l(state, prev));
    }
  };
  const getState = () => state;
  const subscribe = (l) => (listeners.add(l), () => listeners.delete(l));
  state = init(setState, getState);
  return { getState, setState, subscribe };
};
```

Хук подключает этот стор к React через `useSyncExternalStore` и перерисовывает компонент, только если изменился результат селектора.

Провайдер не нужен, потому что стор — обычный объект на уровне модуля: любой файл, который его импортирует, получает тот же экземпляр. Обратная сторона — на сервере такой стор общий для всех запросов, поэтому в SSR его создают на запрос и передают через контекст.

@@@ state-40 | react, context, useReducer
Можно ли заменить Redux связкой `useReducer` + Context? Где предел?
???
Для небольших задач — да:

```tsx
const StateContext = createContext<State | null>(null);
const DispatchContext = createContext<Dispatch<Action> | null>(null);

function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  return (
    <DispatchContext value={dispatch}>
      <StateContext value={state}>{children}</StateContext>
    </DispatchContext>
  );
}
```

`dispatch` вынесен в отдельный контекст: его ссылка стабильна, и компоненты, которые только отправляют экшены, не перерисовываются при изменении state.

Пределы:

- **нет селекторов** — каждый потребитель `StateContext` перерисовывается при любом изменении state;
- нет middleware и DevTools;
- асинхронную логику придётся писать самому.

Подходит для состояния, которое меняется редко и нужно небольшой части дерева: форма-мастер, состояние виджета. Для глобального, часто меняющегося состояния лучше Zustand или Redux Toolkit.

@@@ state-41 | tanstack query, ключи
Как устроены ключи запросов в TanStack Query? Что такое зависимые запросы?
???
`queryKey` — массив, который однозначно описывает данные. В него входит **всё**, от чего зависит запрос:

```ts
useQuery({
  queryKey: ["todos", { status, page }],
  queryFn: () => fetchTodos({ status, page }),
});
```

- Поменялся `page` — это новый ключ, будет новый запрос и отдельная запись в кэше.
- Порядок полей в объекте не важен — ключ хешируется детерминированно.
- Инвалидация работает по префиксу: `invalidateQueries({ queryKey: ["todos"] })` обновит все списки задач.

Ключи удобно собирать в одном месте (query key factory): `todoKeys.list(filters)`, `todoKeys.detail(id)`.

**Зависимый запрос** ждёт данных другого — через `enabled`:

```ts
const { data: user } = useQuery({ queryKey: ["user", email], queryFn: () => getUser(email) });
const { data: projects } = useQuery({
  queryKey: ["projects", user?.id],
  queryFn: () => getProjects(user!.id),
  enabled: !!user?.id,
});
```

@@@ state-42 | url, архитектура
Когда хранить состояние в URL?
???
В `searchParams` стоит хранить то, что описывает **вид страницы**: фильтры, сортировку, номер страницы, поисковый запрос, открытую вкладку, выбранный товар.

Что это даёт:

- ссылкой можно поделиться — коллега увидит то же самое;
- работают кнопки «назад» и «вперёд»;
- состояние переживает перезагрузку;
- в Next.js сервер получает фильтры в `searchParams` и сразу рендерит нужные данные.

```tsx
const params = useSearchParams();
const router = useRouter();

const setSort = (sort: string) => {
  const next = new URLSearchParams(params);
  next.set("sort", sort);
  router.replace(`?${next}`, { scroll: false });
};
```

Что **не** класть в URL: секреты и личные данные, большие объекты, значения, которые меняются на каждый символ без debounce, временное UI-состояние (открыт ли дропдаун).

Для удобной работы есть библиотека `nuqs`: типизированные параметры как `useState`.

@@@ state-43 | rtk query, оптимистичные обновления
Как сделать оптимистичное обновление в RTK Query?
???
В мутации используют `onQueryStarted`: сразу меняют кэш, а при ошибке откатывают изменения:

```ts
toggleTodo: build.mutation<Todo, { id: string; done: boolean }>({
  query: ({ id, done }) => ({ url: `todos/${id}`, method: "PATCH", body: { done } }),
  async onQueryStarted({ id, done }, { dispatch, queryFulfilled }) {
    const patch = dispatch(
      api.util.updateQueryData("getTodos", undefined, (draft) => {
        const todo = draft.find((t) => t.id === id);
        if (todo) todo.done = done;
      }),
    );
    try {
      await queryFulfilled;
    } catch {
      patch.undo(); // сервер ответил ошибкой — вернуть как было
    }
  },
}),
```

- `updateQueryData(endpoint, args, recipe)` меняет закэшированный ответ через Immer — можно «мутировать» `draft`.
- `args` должны совпадать с аргументами, с которыми вызывался запрос (здесь `undefined`).
- `patch.undo()` возвращает кэш в прошлое состояние.

Когда оправдано: частые и почти всегда успешные действия — лайки, чекбоксы, перетаскивание. Для оплаты и необратимых операций лучше честно показать загрузку.

@@@ state-44 | формы, архитектура
Где хранить состояние формы: локально или в глобальном сторе?
???
По умолчанию — **локально**: в `useState`, `useReducer` или react-hook-form внутри компонента формы. Ввод пользователя нужен только этой форме до отправки, а глобальный стор добавил бы лишние ререндеры и код.

В стор или другое долговременное место состояние формы переносят, когда:

- это **многошаговый мастер**, и шаги — разные маршруты;
- нужно сохранять **черновик** между перезагрузками (стор с `persist`, `sessionStorage`);
- данные формы одновременно показываются в другом месте (живое превью);
- параметры формы — это фильтры, которыми хочется делиться (URL).

После отправки результат — это уже **серверные данные**: их место в кэше TanStack Query, RTK Query или в серверных компонентах, а не в клиентском сторе.

@@@ state-45 | сигналы, реактивность
Что такое сигналы и чем они отличаются от `useState`?
???
Сигнал — контейнер значения, который сам отслеживает, кто его читает. При изменении обновляются только эти места, а не весь компонент:

```ts
import { signal, computed, effect } from "@preact/signals";

const count = signal(0);
const double = computed(() => count.value * 2);

effect(() => console.log(double.value)); // перезапустится при смене count
count.value++;
```

Отличия от React-модели:

- `useState` перерисовывает **компонент целиком**, и React сравнивает результат;
- сигнал обновляет **точечно** (fine-grained) — конкретный текстовый узел или эффект, без повторного вызова компонента;
- зависимости собираются автоматически, массивов зависимостей нет.

Сигналы — основа Solid, Preact Signals, Angular, Qwik, похожая модель у `ref` во Vue; для JavaScript есть предложение в TC39. React идёт другим путём: вместо сигналов — React Compiler, который автоматически убирает лишние ререндеры.

@@@ state-46 | zustand, производительность
Как подписаться на частые изменения Zustand-стора без ререндеров?
???
Для значений, которые меняются десятки раз в секунду (координаты мыши, прогресс анимации, позиция скролла), ререндер на каждое изменение — слишком дорого. Можно подписаться на стор **вручную** и обновлять DOM напрямую через `ref`:

```tsx
function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      usePointer.subscribe((state) => {
        if (dotRef.current) {
          dotRef.current.style.transform = `translate(${state.x}px, ${state.y}px)`;
        }
      }),
    [],
  );

  return <div ref={dotRef} className="dot" />;
}
```

`subscribe` возвращает функцию отписки — её удобно вернуть из эффекта как cleanup.

В документации Zustand это называется transient updates. Компонент отрисовывается один раз, а дальше значение меняется без участия React. Этот приём стоит применять точечно: обычные данные лучше читать хуком с селектором.
