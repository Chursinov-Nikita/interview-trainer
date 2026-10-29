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
Прослойка между `dispatch` и редьюсером: `store => next => action => { … }`.

Может логировать, менять, задерживать или отменять экшены и выполнять побочные эффекты. Примеры: thunk, логгер, аналитика, `listenerMiddleware` в RTK, RTK Query.

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
Хук — это ещё и объект стора с API:

```ts
useBears.getState().add();        // вызвать экшен
useBears.setState({ bears: 10 }); // записать

const unsubscribe = useBears.subscribe((s) => console.log(s.bears));
```

Удобно в утилитах, тестах, обработчиках WebSocket.

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
Сравнением **по ссылке** (`Object.is`) — это дёшево. Поэтому изменение должно создавать новые объекты на пути к изменённому полю, а неизменённые части — сохранять старые ссылки, чтобы их селекторы не срабатывали.

Мутация «на месте» ссылку не меняет — подписчики не узнают об изменении.

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
