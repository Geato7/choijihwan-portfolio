// content.json -> 사이트 HTML 로 바꾸는 템플릿.
// Node(build.mjs)와 브라우저(admin 에디터 미리보기)에서 똑같이 쓰인다.
// 이 파일을 고치면 사이트의 "구조"가 바뀐다. 글 내용만 바꿀 거라면 content.json을 고칠 것.
//
// 사이트는 여러 장으로 나뉜다. 헤더 메뉴는 이 네 갈래만 보여준다.
//   index.html            소개
//   projects.html         프로젝트 목차(카드)
//   projects/<id>.html    프로젝트 하나
//   notes.html            기획 노트
//   contact.html          연락처

import { analyticsScript } from "./analytics.js";
import { gameCss, gameMarkup, gameScript } from "./game.js";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const attr = (v) => esc(v);

// 비어 있는 항목은 렌더하지 않는다 (에디터에서 지우면 사이트에서도 사라지도록)
const has = (v) => Array.isArray(v) ? v.length > 0 : !!v;

// projects/ 안의 페이지는 한 단계 깊으므로 상대 경로 앞에 ../ 가 붙는다.
// 절대 주소·앵커·mailto·tel 은 그대로 둔다.
function resolve(href, prefix) {
  const v = String(href ?? "");
  if (!prefix || !v) return v;
  if (/^(https?:)?\/\//i.test(v) || /^(#|mailto:|tel:|\/)/.test(v)) return v;
  return prefix + v;
}

function btn(b, prefix) {
  const cls = b.style === "primary" ? "btn btn-primary" : "btn btn-outline";
  const target = b.newTab ? ' target="_blank" rel="noopener"' : "";
  return `<a class="${cls}" href="${attr(resolve(b.href, prefix))}"${target}>${esc(b.label)}</a>`;
}

function buttonRow(buttons, prefix) {
  if (!has(buttons)) return "";
  return `      <div class="cta-row">
${buttons.map((b) => "        " + btn(b, prefix)).join("\n")}
      </div>`;
}

function myPart(mp) {
  if (!mp || !has(mp.heading)) return "";
  const bullets = (mp.bullets || [])
    .filter((b) => has(b.strong) || has(b.text))
    .map((b) => `          <li>${has(b.strong) ? `<b>${esc(b.strong)}</b>` : ""}${esc(b.text)}</li>`)
    .join("\n");
  return `      <div class="my-part">
        <div class="mp-label">MY PART</div>
        <h3>${esc(mp.heading)}</h3>
${has(mp.intro) ? `        <p>${esc(mp.intro)}</p>\n` : ""}${bullets ? `        <ul>\n${bullets}\n        </ul>\n` : ""}      </div>`;
}

function gallery(items, fit, prefix) {
  if (!has(items)) return "";
  // 와이어프레임처럼 잘리면 안 되는 문서형 이미지는 fit="contain" 으로 통째로 보여준다
  // contain = 정해진 칸 안에 통째로, natural = 이미지 원본 비율 그대로
  const cls = fit === "contain" ? "gallery gallery-fit"
    : fit === "natural" ? "gallery gallery-natural"
    : "gallery";
  const figs = items
    .map(
      (g) => `        <figure>
          <img src="${attr(resolve(g.src, prefix))}" alt="${attr(g.alt)}" loading="lazy">
${has(g.caption) ? `          <figcaption>${esc(g.caption)}</figcaption>\n` : ""}        </figure>`
    )
    .join("\n");
  return `      <div class="${cls}">
${figs}
      </div>`;
}

function wideShot(w, prefix) {
  if (!w || !has(w.src)) return "";
  return `      <figure class="wide-shot">
        <img src="${attr(resolve(w.src, prefix))}" alt="${attr(w.alt)}" loading="lazy">
${has(w.caption) ? `        <figcaption>${esc(w.caption)}</figcaption>\n` : ""}      </figure>`;
}

function stats(items) {
  if (!has(items)) return "";
  const cells = items
    .map((s) => `        <div class="stat"><div class="num">${esc(s.num)}</div><div class="lbl">${esc(s.label)}</div></div>`)
    .join("\n");
  return `      <div class="stat-row">
${cells}
      </div>`;
}

function videos(items) {
  if (!has(items)) return "";
  const boxes = items
    .map(
      (v) => `        <div class="video-box">
          <div class="ratio"><iframe src="https://www.youtube-nocookie.com/embed/${attr(v.youtubeId)}" title="${attr(v.title || v.label)}" allowfullscreen loading="lazy"></iframe></div>
          <div class="video-label">${esc(v.label)}</div>
        </div>`
    )
    .join("\n");
  return `      <div class="video-row">
${boxes}
      </div>`;
}

function details(items) {
  if (!has(items)) return "";
  const rows = items
    .map(
      (d) => `        <div class="detail-row">
          <dt>${esc(d.term)}</dt>
          <dd>${esc(d.desc)}</dd>
        </div>`
    )
    .join("\n");
  return `      <div class="detail-list">
${rows}
      </div>`;
}

function table(t) {
  if (!t || !has(t.headers)) return "";
  const head = t.headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = (t.rows || [])
    .map((r) => `          <tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("\n");
  // 좁은 화면에서 열이 뭉개지지 않도록 스크롤 컨테이너로 감싼다
  return `      <div class="table-wrap">
        <table class="price-table">
          <thead>
            <tr>${head}</tr>
          </thead>
          <tbody>
${body}
          </tbody>
        </table>
      </div>`;
}

const DEFAULT_BLOCKS = ["myPart", "gallery", "wideShot", "stats", "videos", "details", "table", "buttons"];

function project(p, featuredLabel, prefix) {
  const renderers = {
    myPart: () => myPart(p.myPart),
    gallery: () => gallery(p.gallery, p.galleryFit, prefix),
    wideShot: () => wideShot(p.wideShot, prefix),
    stats: () => stats(p.stats),
    videos: () => videos(p.videos),
    details: () => details(p.details),
    table: () => table(p.table),
    buttons: () => buttonRow(p.buttons, prefix),
  };
  const order = has(p.blocks) ? p.blocks : DEFAULT_BLOCKS;
  const body = order
    .map((key) => (renderers[key] ? renderers[key]() : ""))
    .filter(Boolean)
    .join("\n\n");

  const subtitle = has(p.titleSub)
    ? ` <span style="color:var(--text-faint); font-weight:400; font-size:0.55em;">${esc(p.titleSub)}</span>`
    : "";

  const numLine = has(p.num) || has(p.date)
    ? `        <div class="section-num">${esc(p.num)}${has(p.num) && has(p.date) ? " · " : ""}${has(p.date) ? `<span class="section-date">${esc(p.date)}</span>` : ""}</div>\n`
    : "";
  // featured 로 지정한 프로젝트에는 배지와 외곽선이 붙는다
  const badge = p.featured && has(featuredLabel)
    ? `        <div class="featured-badge">${esc(featuredLabel)}</div>\n`
    : "";

  return `  <!-- ${esc(p.id).toUpperCase()} -->
  <section class="project reveal${p.featured ? " project--featured" : ""}" id="${attr(p.id)}">
    <div class="wrap">
      <div class="section-head">
${badge}${numLine}        <h2>${esc(p.title)}${subtitle}</h2>
${has(p.role) ? `        <div class="role">${esc(p.role)}</div>\n` : ""}${has(p.lead) ? `        <p class="section-lead">${esc(p.lead)}</p>\n` : ""}      </div>

${body}
    </div>
  </section>`;
}

// 프로젝트 상세 페이지 맨 아래 — 목록으로 돌아가거나 앞뒤 프로젝트로 넘어간다
function pager(projects, idx, indexLabel) {
  const prev = projects[idx - 1];
  const next = projects[idx + 1];
  const link = (p, dir, label) =>
    `        <a class="pager-link pager-${dir}" href="${attr(p.id)}.html">
          <span class="pager-dir">${esc(label)}</span>
          <span class="pager-title">${esc(p.title)}</span>
        </a>`;
  return `  <nav class="pager-sec reveal" aria-label="프로젝트 이동">
    <div class="wrap">
      <a class="pager-index" href="../projects.html">← ${esc(indexLabel)} 전체 보기</a>
      <div class="pager-row">
${prev ? link(prev, "prev", "이전") : `        <span class="pager-link pager-empty"></span>`}
${next ? link(next, "next", "다음") : `        <span class="pager-link pager-empty"></span>`}
      </div>
    </div>
  </nav>`;
}

// 기획 노트 — 월별로 묶은 타임라인. 위쪽 칩으로 분류를 걸러 볼 수 있다.
function devlogEntry(e, prefix) {
  return `        <article class="devlog-entry" data-tag="${attr(e.project || "")}">
          <div class="devlog-meta">
${has(e.date) ? `            <span class="devlog-date">${esc(e.date)}</span>\n` : ""}${has(e.project) ? `            <span class="devlog-tag">${esc(e.project)}</span>\n` : ""}          </div>
          <h3 class="devlog-title">${esc(e.title)}</h3>
${has(e.retro) ? `          <p class="devlog-retro">${esc(e.retro)}</p>\n` : ""}${has(e.fileHref) ? `          <a class="devlog-file" href="${attr(resolve(e.fileHref, prefix))}" target="_blank" rel="noopener">${esc(e.fileLabel || "파일 보기")} ↗</a>\n` : ""}        </article>`;
}

// "2026-06-22" -> "2026.06". 날짜가 없으면 빈 문자열.
const devlogMonth = (v) => (/^\d{4}-\d{2}/.test(String(v || "")) ? String(v).slice(0, 7).replace("-", ".") : "");

function devlogSection(dl, prefix) {
  const entries = ((dl && dl.entries) || []).filter((e) => has(e.title));
  if (!entries.length) return "";
  // 최신 글이 위로 오도록 날짜 내림차순 정렬 (에디터에서 순서를 따로 관리할 필요 없게)
  const sorted = entries.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  // 요약 — 몇 편을, 언제부터 언제까지, 몇 갈래로
  const dated = sorted.map((e) => e.date).filter((v) => devlogMonth(v));
  const span = dated.length
    ? (devlogMonth(dated[dated.length - 1]) === devlogMonth(dated[0])
        ? devlogMonth(dated[0])
        : `${devlogMonth(dated[dated.length - 1])} – ${devlogMonth(dated[0]).slice(5)}`)
    : "—";
  const counts = new Map();
  for (const e of sorted) if (has(e.project)) counts.set(e.project, (counts.get(e.project) || 0) + 1);
  const summary = stats([
    { num: String(sorted.length), label: "기록" },
    { num: span, label: "기간" },
    { num: String(counts.size), label: "분류" },
  ]);

  // 분류 칩 — 많이 쓴 분류가 앞에 온다
  const chips = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const filter = chips.length > 1
    ? `      <div class="devlog-filter" id="devlogFilter">
        <button type="button" class="dl-chip is-on" data-tag="">전체 <b>${sorted.length}</b></button>
${chips.map(([tag, n]) => `        <button type="button" class="dl-chip" data-tag="${attr(tag)}">${esc(tag)} <b>${n}</b></button>`).join("\n")}
      </div>`
    : "";

  // 월이 바뀌는 자리에 표시를 하나 끼워 넣는다
  let last = null;
  const items = [];
  for (const e of sorted) {
    const m = devlogMonth(e.date) || "날짜 미상";
    if (m !== last) {
      items.push(`        <div class="devlog-month" data-month="${attr(m)}"><span>${esc(m)}</span></div>`);
      last = m;
    }
    items.push(devlogEntry(e, prefix));
  }

  return `  <section class="project reveal" id="notes">
    <div class="wrap">
      <div class="section-head">
        <h1>${esc(dl.heading || "기획 노트")}</h1>
${has(dl.lead) ? `        <p class="section-lead">${esc(dl.lead)}</p>\n` : ""}      </div>

${summary}

${filter}
      <div class="devlog-list" id="devlogList">
${items.join("\n")}
      </div>
      <p class="devlog-empty" id="devlogEmpty" hidden>이 분류에는 아직 글이 없습니다.</p>
    </div>
  </section>`;
}

// 분류 칩 동작 — 고른 분류만 남기고, 남는 글이 없는 월 표시는 함께 감춘다
function devlogScript() {
  return `<script>
(function(){
  var bar = document.getElementById('devlogFilter');
  if (!bar) return;
  var list = document.getElementById('devlogList');
  var empty = document.getElementById('devlogEmpty');
  bar.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.dl-chip');
    if (!btn) return;
    var tag = btn.getAttribute('data-tag');
    bar.querySelectorAll('.dl-chip').forEach(function (b) { b.classList.toggle('is-on', b === btn); });
    var shown = 0;
    list.querySelectorAll('.devlog-entry').forEach(function (el) {
      var on = !tag || el.getAttribute('data-tag') === tag;
      el.hidden = !on;
      if (on) shown++;
    });
    // 뒤따르는 글이 하나도 없는 월 표시는 숨긴다
    list.querySelectorAll('.devlog-month').forEach(function (h) {
      var n = h.nextElementSibling, any = false;
      while (n && !n.classList.contains('devlog-month')) {
        if (n.classList.contains('devlog-entry') && !n.hidden) { any = true; break; }
        n = n.nextElementSibling;
      }
      h.hidden = !any;
    });
    if (empty) empty.hidden = shown > 0;
  });
})();
</script>`;
}

// 게임 경험 — 플레이 이력 한 장. 숫자 줄 + 표만 쓴다.
function playSection(ph) {
  if (!ph || !has((ph.table || {}).rows)) return "";
  const blocks = [stats(ph.stats), table(ph.table)].filter(Boolean).join("\n\n");
  return `  <section class="project reveal" id="play">
    <div class="wrap">
      <div class="section-head">
        <h1>${esc(ph.heading || "게임 경험")}</h1>
${has(ph.role) ? `        <div class="role">${esc(ph.role)}</div>\n` : ""}${has(ph.lead) ? `        <p class="section-lead">${esc(ph.lead)}</p>\n` : ""}      </div>

${blocks}
    </div>
  </section>`;
}

// 프로젝트 카드 목차 — projects.html 의 본문. 카드를 누르면 그 프로젝트 페이지로 간다.
function projectIndex(projects, title, lead, prefix) {
  const cards = projects
    .map((p) => {
      // 썸네일은 따로 지정하지 않으면 큰 이미지 → 갤러리 첫 장 순으로 자동 선택
      // thumb 를 명시하면 그 값을 그대로 쓴다. 빈 문자열이면 "이미지 없음" 카드가 된다.
      const thumb = p.thumb !== undefined ? p.thumb
        : (p.wideShot && p.wideShot.src) || (p.gallery && p.gallery[0] && p.gallery[0].src) || "";
      // "05 — TEAM PROJECT" 에서 분류만 떼어낸다 (이미지 없는 카드에 쓴다)
      const kind = String(p.num || "").split("—").pop().trim();
      const inner = thumb
        ? `<img src="${attr(resolve(thumb, prefix))}" alt="" loading="lazy">`
        : `<span class="pcard-noimg">${esc(kind || p.title)}</span>`;
      return `        <a class="pcard" href="${attr(prefix)}projects/${attr(p.id)}.html">
          <span class="pcard-thumb">${inner}</span>
          <span class="pcard-body">
${has(p.num) || has(p.date) ? `            <span class="pcard-num">${esc(p.num)}${has(p.num) && has(p.date) ? " · " : ""}${esc(p.date)}</span>\n` : ""}            <span class="pcard-title">${esc(p.title)}</span>
            <span class="pcard-sum">${esc(p.cardSummary || p.role)}</span>
          </span>
        </a>`;
    })
    .join("\n");

  return `  <section class="index-sec reveal" id="projects">
    <div class="wrap">
      <h1 class="index-title">${esc(title)}</h1>
${has(lead) ? `      <p class="index-lead">${esc(lead)}</p>\n` : ""}      <div class="index-grid">
${cards}
      </div>
    </div>
  </section>`;
}

function hero(h, prefix) {
  const tags = (h.tags || []).filter(has).map((t) => `        <span class="tag">${esc(t)}</span>`).join("\n");
  // 옛 앵커 주소를 새 페이지로 옮겨준다 (content.json 을 고치지 않아도 동작하도록)
  const MAP = { "#projects": "projects.html", "#contact": "contact.html", "#belief": "projects.html", "#home": "index.html", "#devlog": "notes.html", "devlog.html": "notes.html" };
  const buttons = (h.buttons || []).map((b) => (MAP[b.href] ? { ...b, href: MAP[b.href] } : b));
  const meta = (h.meta || [])
    .map(
      (m) => `        <div>
          <div class="meta-label">${esc(m.label)}</div>
          <div class="meta-value">${(m.lines || []).map(esc).join("<br>")}</div>
        </div>`
    )
    .join("\n");

  return `  <section class="hero" id="home">
    <div class="wrap">
      <div class="eyebrow">${esc(h.eyebrow)}</div>
      <h1>${esc(h.name)}${has(h.subtitle) ? ` <span>${esc(h.subtitle)}</span>` : ""}</h1>
${has(h.lead) ? `      <p class="lead">${esc(h.lead)}</p>\n` : ""}${tags ? `      <div class="tags">\n${tags}\n      </div>\n` : ""}${
    has(buttons) ? `      <div class="cta-row">\n${buttons.map((b) => "        " + btn(b, prefix)).join("\n")}\n      </div>\n` : ""
  }
${meta ? `      <div class="meta-grid">\n${meta}\n      </div>\n` : ""}    </div>
  </section>`;
}

// 연락처 — contact.html 의 본문
function contactSection(c, gameCta) {
  const links = [];
  if (has(c.phone)) links.push(`        <a class="btn btn-primary" href="tel:${attr(String(c.phone).replace(/[^0-9+]/g, ""))}">${esc(c.phone)}</a>`);
  if (has(c.email)) links.push(`        <a class="btn btn-outline" href="mailto:${attr(c.email)}">${esc(c.email)}</a>`);

  return `  <section class="contact-sec reveal" id="contact">
    <div class="wrap">
      <h1>${esc(c.heading)}</h1>
${has(c.text) ? `      <p>${esc(c.text)}</p>\n` : ""}${links.length ? `      <div class="contact-links">\n${links.join("\n")}\n      </div>\n` : ""}${gameCta ? gameCta + "\n" : ""}    </div>
  </section>`;
}

// 모든 페이지 맨 아래에 붙는 한 줄
function siteFooter(c) {
  return `  <footer class="site-foot">
    <div class="wrap">
      <div class="foot-bottom">
        <span>${esc(c.copyright)}</span>
        <span><a href="#top">${esc(c.backToTop || "맨 위로 ↑")}</a></span>
      </div>
    </div>
  </footer>`;
}


// 404 — GitHub Pages 가 없는 주소에 이 파일을 그대로 내준다.
// 이때 주소는 /projects/오타.html 같은 깊은 경로일 수 있으므로,
// 링크를 상대 경로로 두면 깨진다. 사이트 루트부터의 절대 경로를 쓴다.
function notFoundSection(site, root) {
  return `  <section class="notfound reveal">
    <div class="wrap">
      <div class="nf-code">404</div>
      <h1>이 주소에는 아무것도 없습니다</h1>
      <p>주소가 바뀌었거나 잘못 입력됐을 수 있습니다. 아래에서 찾아가 주세요.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${attr(root)}index.html">소개</a>
        <a class="btn btn-outline" href="${attr(root)}projects.html">프로젝트</a>
        <a class="btn btn-outline" href="${attr(root)}notes.html">기획 노트</a>
        <a class="btn btn-outline" href="${attr(root)}contact.html">연락처</a>
      </div>
    </div>
  </section>`;
}

/* ── 페이지 목록 ─────────────────────────────────────────────── */

function devlogCount(content) {
  return (((content.devlog || {}).entries) || []).filter((e) => has(e.title)).length;
}

function playCount(content) {
  return ((((content.playHistory || {}).table) || {}).rows || []).length;
}

export function sitePages(content) {
  const { projects = [] } = content;
  const pages = [
    { key: "index", path: "index.html", label: "소개" },
    { key: "projects", path: "projects.html", label: "프로젝트 목차" },
  ];
  for (const p of projects) {
    pages.push({ key: `project:${p.id}`, path: `projects/${p.id}.html`, label: `프로젝트 — ${p.title}` });
  }
  // 코드 안의 이름은 devlog 로 두고, 화면에 보이는 이름과 주소만 기획 노트/notes 로 쓴다
  if (devlogCount(content)) pages.push({ key: "devlog", path: "notes.html", label: "기획 노트" });
  if (playCount(content)) pages.push({ key: "play", path: "play.html", label: "게임 경험" });
  pages.push({ key: "contact", path: "contact.html", label: "연락처" });
  return pages;
}

function navBar(content, prefix, current) {
  const { site, devlog } = content;
  const items = [
    ["index", site.homeNavLabel || "소개", "index.html"],
    ["projects", site.projectsNavLabel || "프로젝트", "projects.html"],
  ];
  if (devlogCount(content)) items.push(["devlog", (devlog && devlog.navLabel) || "기획 노트", "notes.html"]);
  if (playCount(content)) items.push(["play", (content.playHistory && content.playHistory.navLabel) || "게임 경험", "play.html"]);
  items.push(["contact", site.contactNavLabel || "연락처", "contact.html"]);

  return items
    .map(([key, label, href]) =>
      `      <a href="${attr(prefix + href)}"${key === current ? ' class="current" aria-current="page"' : ""}>${esc(label)}</a>`)
    .join("\n");
}

/* ── 페이지 한 장 ────────────────────────────────────────────── */

function shell(content, css, o) {
  const { site, contact } = content;
  const prefix = o.prefix;
  const base = String(site.url || "").replace(/\/*$/, "/");
  const game = o.withGame ? gameMarkup(site) : null;
  const ogImg = base && site.ogImage ? base + site.ogImage + (site.ogImageVersion ? "?v=" + site.ogImageVersion : "") : "";
  const pageUrl = base ? base + (o.canonicalPath === "index.html" ? "" : o.canonicalPath) : "";

  return `<!DOCTYPE html>
<!--
  ⚠ 이 파일은 자동 생성됩니다. 직접 고치지 마세요 — 다음 배포 때 덮어써집니다.
  글을 고치려면 content.json 을 수정하세요 (웹 에디터: /admin/).
-->
<html lang="${attr(site.lang || "ko")}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(o.title)}</title>
<meta name="description" content="${attr(o.description)}">
${pageUrl ? `<link rel="canonical" href="${attr(pageUrl)}">` : ""}
<meta name="theme-color" content="${attr(site.themeColor || "#0a0a0a")}">

<link rel="icon" href="${attr(prefix)}favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="${attr(prefix)}apple-touch-icon.png">

<meta property="og:type" content="website">
<meta property="og:site_name" content="${attr(site.title)}">
<meta property="og:title" content="${attr(o.title)}">
<meta property="og:description" content="${attr(o.description)}">
<meta property="og:locale" content="ko_KR">${pageUrl ? `
<meta property="og:url" content="${attr(pageUrl)}">` : ""}${ogImg ? `
<meta property="og:image" content="${attr(ogImg)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(site.title)}">` : ""}

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(o.title)}">
<meta name="twitter:description" content="${attr(o.description)}">${ogImg ? `
<meta name="twitter:image" content="${attr(ogImg)}">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
<script>
  // 첫 페인트 전에 테마를 정한다 (새로고침 때 흰 화면이 번쩍이는 것 방지)
  (function(){
    var el = document.documentElement;
    try{
      var saved = localStorage.getItem('theme');
      el.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
    }catch(e){
      el.setAttribute('data-theme','dark');
    }
    // 등장 애니메이션의 '숨김' 상태는 이 클래스가 있을 때만 걸린다.
    // 스크립트가 아예 실행되지 못하면 클래스가 없으니 내용이 그대로 보인다.
    el.className += (el.className ? ' ' : '') + 'js';

    // 아래쪽 스크립트가 오류로 죽어 관찰자가 안 붙는 경우를 대비한 안전장치.
    setTimeout(function(){
      if (window.__revealReady) return;
      var items = document.querySelectorAll('.reveal');
      for (var i = 0; i < items.length; i++) items[i].classList.add('in');
    }, 2000);
  })();
</script>
<style>
${css}
${o.withGame ? gameCss() : ""}
</style>
</head>
<body>

<header class="nav" id="top">
  <div class="nav-inner">
    <a class="logo" href="${attr(prefix)}index.html">${esc(site.logo)}</a>
    <nav class="nav-links" id="navLinks">
${navBar(content, prefix, o.nav)}
    </nav>
    <div class="nav-actions">
      <button class="theme-toggle" id="themeToggle" type="button" aria-label="밝은 화면 / 어두운 화면 전환" title="밝게 / 어둡게">
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2"></circle>
          <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"></path>
        </svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"></path>
        </svg>
      </button>
      <button class="nav-toggle" id="navToggle" aria-label="메뉴 열기">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<main>

${o.body}

${siteFooter(contact)}

</main>

<script>
  // mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  // 테마 전환 — 선택은 이 브라우저에 기억된다
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // scroll reveal — 실패하면 애니메이션을 포기하고 전부 보여준다
  try {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      // threshold 를 비율로 주면 화면보다 큰 섹션은 영영 조건을 못 채운다.
      // (기획 노트처럼 6,000px 짜리 섹션이 720px 화면에서 12% 를 넘길 수 없다)
      // 그래서 '한 픽셀이라도 들어오면' 으로 두고 아래쪽 여백으로 타이밍만 잡는다.
    }, { threshold: 0, rootMargin: "0px 0px -80px 0px" });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    window.__revealReady = true;
  } catch (err) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    window.__revealReady = true;
  }
</script>
${o.script || ""}
${o.withGame ? game.modal + "\n" + gameScript() : ""}
${analyticsScript(site.analytics)}
</body>
</html>
`;
}

/* ── 페이지별 본문 ───────────────────────────────────────────── */

export function renderPage(content, css, key = "index") {
  const { site, hero: h, projects = [], contact, devlog } = content;
  const siteName = site.logo || site.title || "";
  const gameOn = site.miniGame !== false;

  if (key === "404") {
    let root = "/";
    try { root = new URL(site.url).pathname.replace(/\/*$/, "/"); } catch (e) { root = "/"; }
    return shell(content, css, {
      prefix: root, nav: "", canonicalPath: "404.html",
      title: `페이지를 찾을 수 없습니다 — ${siteName}`,
      description: "요청한 주소를 찾을 수 없습니다.",
      body: notFoundSection(site, root),
    });
  }

  if (key === "projects") {
    const t = site.projectsIndexTitle || "프로젝트";
    return shell(content, css, {
      prefix: "", nav: "projects", canonicalPath: "projects.html",
      title: `${t} — ${siteName}`, description: site.description,
      body: projectIndex(projects, t, site.projectsIndexLead, ""),
    });
  }

  if (key === "devlog") {
    const dl = devlog || {};
    return shell(content, css, {
      prefix: "", nav: "devlog", canonicalPath: "notes.html",
      title: `${dl.heading || "기획 노트"} — ${siteName}`,
      description: dl.lead || site.description,
      body: devlogSection(dl, ""),
      script: devlogScript(),
    });
  }

  if (key === "play") {
    const ph = content.playHistory || {};
    return shell(content, css, {
      prefix: "", nav: "play", canonicalPath: "play.html",
      title: `${ph.heading || "게임 경험"} — ${siteName}`,
      description: ph.lead || site.description,
      body: playSection(ph),
    });
  }

  if (key === "contact") {
    const game = gameOn ? gameMarkup(site) : null;
    return shell(content, css, {
      prefix: "", nav: "contact", canonicalPath: "contact.html",
      title: `${site.contactNavLabel || "연락처"} — ${siteName}`,
      description: contact.text || site.description,
      body: contactSection(contact, gameOn ? game.cta : ""),
      withGame: gameOn,
    });
  }

  if (key.startsWith("project:")) {
    const id = key.slice("project:".length);
    const idx = projects.findIndex((p) => p.id === id);
    if (idx < 0) return "";
    const p = projects[idx];
    return shell(content, css, {
      prefix: "../", nav: "projects", canonicalPath: `projects/${id}.html`,
      title: `${p.title} — ${siteName}`,
      description: p.cardSummary || p.role || site.description,
      body: [project(p, site.featuredLabel, "../"),
             pager(projects, idx, site.projectsIndexTitle || "프로젝트")].join("\n\n"),
    });
  }

  // 기본값: 소개
  return shell(content, css, {
    prefix: "", nav: "index", canonicalPath: "index.html",
    title: site.title, description: site.description,
    body: hero(h, ""),
  });
}

// build.mjs 가 쓰는 진입점 — [{ path, html }, ...]
export function renderSite(content, css) {
  const pages = sitePages(content).map((pg) => ({
    path: pg.path,
    html: renderPage(content, css, pg.key),
  }));
  // 404 와 옛 주소 안내는 목록/사이트맵에 넣지 않는다
  pages.push({ path: "404.html", html: renderPage(content, css, "404"), noIndex: true });
  if (devlogCount(content)) {
    // devlog.html -> notes.html. 이름을 바꾸기 전에 색인됐을 수 있어 남겨 둔다.
    pages.push({ path: "devlog.html", noIndex: true, html:
`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex">
<link rel="canonical" href="notes.html">
<meta http-equiv="refresh" content="0; url=notes.html">
<title>기획 노트로 이동합니다</title>
</head>
<body>
<p><a href="notes.html">기획 노트로 이동합니다.</a></p>
<script>location.replace("notes.html");</script>
</body>
</html>
` });
  }
  return pages;
}
