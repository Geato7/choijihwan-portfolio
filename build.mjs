// content.json + src/styles.css -> 사이트 페이지 여러 장
// 실행: node build.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderSite } from "./src/template.js";
import { trackerFile, TRACKER_VERSION } from "./src/analytics.js";

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
// 검색엔진용 — 사이트맵에는 404 를 빼고 넣는다
const base = String(content.site.url || "").replace(/[/]*$/, "/");
if (base) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages
    .filter((p) => !p.noIndex)
    .map((p) => base + (p.path === "index.html" ? "" : p.path))
    .map((u) => `  <url><loc>${encodeURI(u)}</loc><lastmod>${today}</lastmod></url>`)
    .join("\n");
  writeFileSync(join(root, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "utf8");
  writeFileSync(join(root, "robots.txt"),
    `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${base}sitemap.xml\n`, "utf8");
  console.log("  sitemap.xml / robots.txt");
}

// 다른 사이트에 붙일 수 있는 독립 수집기. 이 사이트는 안 쓰지만(페이지에 직접 심는다)
// 다른 사이트가 script src 로 불러가도록 항상 만들어 둔다.
mkdirSync(join(root, "analytics"), { recursive: true });
const tracker = trackerFile();
writeFileSync(join(root, "analytics/tracker.js"), tracker, "utf8");
console.log(`  analytics/tracker.js           ${tracker.length.toLocaleString().padStart(9)}자  (v${TRACKER_VERSION})`);

console.log(`페이지 ${pages.length}장 생성 완료 — 합계 ${total.toLocaleString()}자`);
