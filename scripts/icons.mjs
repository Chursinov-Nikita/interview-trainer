import sharp from "sharp";
import { copyFile, readFile } from "node:fs/promises";

const svg = await readFile("public/logo.svg", "utf8");
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}
const maskable = svg
  .replace('rx="116"', 'rx="0"')
  .replace(/<g (id="art" )?(fill|stroke)/g, (m) => m.replace("<g ", '<g transform="translate(51.2 51.2) scale(0.8)" '));
await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile("public/icons/icon-maskable-512.png");
await copyFile("public/logo.svg", "app/icon.svg");
