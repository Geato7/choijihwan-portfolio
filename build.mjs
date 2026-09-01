// content.json + src/styles.css -> 사이트 페이지 여러 장
// 실행: node build.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderSite } from "./src/template.js";

const root = dirname(fileURLToPath(import.meta.url));

const content = JSON.parse(readFileSync(join(root, "content.json"), "utf8"));
const css = readFileSync(join(root, "src/styles.css"), "utf8").trimEnd();

const pages = renderSite(content, css);
let total = 0;
for (const { path, html } of pages) {
  const out = join(root, path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html, "utf8");
  total += html.length;
  console.log(`  ${path.padEnd(30)} ${html.length.toLocaleString().padStart(9)}자`);
}
console.log(`페이지 ${pages.length}장 생성 완료 — 합계 ${total.toLocaleString()}자`);
