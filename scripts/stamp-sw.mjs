import { readFile, writeFile } from "node:fs/promises";

const file = "out/sw.js";
const sw = await readFile(file, "utf8");
const version = `kesh-${Date.now().toString(36)}`;
if (!sw.includes('const CACHE = "kesh-v2";')) throw new Error("sw.js: не найдена строка версии кэша");
await writeFile(file, sw.replace('const CACHE = "kesh-v2";', `const CACHE = "${version}";`));
console.log(`sw: ${version}`);
