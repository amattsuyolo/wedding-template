import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const css = await readFile(new URL("styles.css", root), "utf8");
const failures = [];

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) failures.push(`Duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`);

for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) {
  if (!ids.includes(match[1])) failures.push(`Missing fragment target: #${match[1]}`);
}

const assetPaths = new Set();
for (const match of html.matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
  const path = match[1].split("?")[0];
  if (!/^(?:https?:|data:|mailto:|tel:)/.test(path)) assetPaths.add(path);
}
for (const match of html.matchAll(/\bsrcset="([^"]+)"/g)) {
  match[1].split(",").forEach((candidate) => assetPaths.add(candidate.trim().split(/\s+/)[0]));
}
for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  if (!match[1].startsWith("data:")) assetPaths.add(match[1]);
}
for (const path of assetPaths) {
  if (!existsSync(new URL(path, root))) failures.push(`Missing local asset: ${path}`);
}

for (const match of html.matchAll(/<img\b[^>]*>/g)) {
  const tag = match[0];
  if (!/\balt="[^"]*"/.test(tag)) failures.push(`Image missing alt: ${tag.slice(0, 100)}`);
  if (!/\bwidth="\d+"/.test(tag) || !/\bheight="\d+"/.test(tag)) failures.push(`Image missing dimensions: ${tag.slice(0, 100)}`);
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
  throw new Error(`Static verification failed with ${failures.length} issue(s).`);
}

console.log(`Verified ${assetPaths.size} local assets, ${ids.length} IDs, and image metadata.`);
