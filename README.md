# Синапс — тренажёр к собеседованиям

Карточки по JavaScript, TypeScript, React, Redux/Zustand, SQL/PostgreSQL и Prisma с интервальными повторениями (SM-2). PWA: ставится на телефон и работает без сети.

## Запуск

```bash
npm install
npm run dev     # http://localhost:3000 (service worker в dev выключен)
npm run build   # статика в out/
npm start       # раздать out/ локально
```

## Как устроено

- **Next.js 16, static export** → GitHub Pages (`.github/workflows/pages.yml`, `basePath` = имя репозитория).
- **Данные** — только на устройстве: Zustand + `persist` в IndexedDB (`app/lib/store.ts`). Перенос между устройствами — экспорт/импорт JSON в «Ещё».
- **Алгоритм** — `app/lib/srs.ts`: SM-2 в варианте Anki, три оценки. Очередь дня и лимит новых — `app/lib/queue.ts`.
- **Офлайн** — `public/sw.js` заранее кэширует все экраны и их скрипты.
- **Стартовые карточки** — Markdown-файлы в `content/`. `npm run seed` (запускается и в dev/build) собирает их в `app/data/seed.ts`. Нетронутые карточки обновляются у пользователя автоматически, отредактированные и удалённые — нет.

Формат карточки в `content/*.md`:

```
@@@ ts-33 | generics, infer
Вопрос в Markdown
???
Ответ в Markdown с блоками кода
```

Иконки PWA пересобираются из `public/logo.svg`: `npm run icons`.
