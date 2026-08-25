import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

await import("./verify.mjs");

const output = new URL("../dist/", import.meta.url);
const root = new URL("../", import.meta.url);
const files = ["index.html", "styles.css", "script.js", "assets"];
const sourceFontFiles = [
  "assets/fonts/InstrumentSerif-Regular.ttf",
  "assets/fonts/InstrumentSerif-Italic.ttf",
  "assets/fonts/Inter-Variable.ttf"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of files) {
  const source = new URL(file, root);
  if (!existsSync(source)) throw new Error(`Missing build input: ${file}`);
  await cp(source, new URL(file, output), { recursive: true });
}

for (const file of sourceFontFiles) {
  await rm(new URL(file, output), { force: true });
}

console.log("Built static site to dist/");
