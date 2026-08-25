// content.json + src/styles.css -> index.html
// 실행: node build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderPage } from "./src/template.js";

const root = dirname(fileURLToPath(import.meta.url));

const content = JSON.parse(readFileSync(join(root, "content.json"), "utf8"));
const css = readFileSync(join(root, "src/styles.css"), "utf8").trimEnd();

const html = renderPage(content, css);
writeFileSync(join(root, "index.html"), html, "utf8");

const projects = content.projects.map((p) => p.id).join(", ");
console.log(`index.html 생성 완료 — ${html.length.toLocaleString()}자 / 프로젝트: ${projects}`);
