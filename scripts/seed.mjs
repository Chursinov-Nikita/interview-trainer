// Собирает стартовые колоды из content/*.md в app/data/seed.ts: npm run seed
//
// Формат файла:
// ---
// id: ts
// title: TypeScript
// ...
// ---
// @@@ ts-01 | generics, infer      ← id карточки и теги
// Вопрос в Markdown
// ???
// Ответ в Markdown
import { readFile, readdir, writeFile } from "node:fs/promises";

const COLORS = ["amber", "blue", "cyan", "fuchsia", "green", "indigo", "rose", "slate"];
const ICONS = ["braces", "type", "atom", "boxes", "database", "triangle", "code", "brain", "globe", "terminal"];

const files = (await readdir("content")).filter((f) => f.endsWith(".md")).sort();
const ids = new Set();

const decks = await Promise.all(
  files.map(async (file) => {
    const text = (await readFile(`content/${file}`, "utf8")).replace(/\r\n/g, "\n");
    const [, head, body] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
    if (!head) throw new Error(`${file}: нет шапки ---`);
    const meta = Object.fromEntries(
      head.split("\n").map((line) => {
        const i = line.indexOf(":");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      }),
    );
    if (!COLORS.includes(meta.color)) throw new Error(`${file}: цвет ${meta.color}`);
    if (!ICONS.includes(meta.icon)) throw new Error(`${file}: иконка ${meta.icon}`);

    const cards = body
      .split(/^@@@ /m)
      .slice(1)
      .map((chunk) => {
        const [header, ...rest] = chunk.split("\n");
        const [id, tagLine = ""] = header.split("|").map((s) => s.trim());
        const [front, back] = rest.join("\n").split(/^\?\?\?$/m).map((s) => s.trim());
        if (!front || !back) throw new Error(`${file}: у карточки ${id} нет вопроса или ответа`);
        if (ids.has(id)) throw new Error(`${file}: повтор id ${id}`);
        ids.add(id);
        const tags = tagLine.split(",").map((t) => t.trim()).filter(Boolean);
        return { id, front, back, tags };
      });

    return { id: meta.id, title: meta.title, description: meta.description, color: meta.color, icon: meta.icon, cards };
  }),
);

const out = `// Сгенерировано scripts/seed.mjs из content/*.md — не редактируй руками
import type { SeedDeck } from "../lib/types";

export const SEED: SeedDeck[] = ${JSON.stringify(decks, null, 2)};
`;
await writeFile("app/data/seed.ts", out);
console.log(`seed: ${decks.length} колод, ${ids.size} карточек`);
