// content.json -> index.html 로 바꾸는 템플릿.
// Node(build.mjs)와 브라우저(admin 에디터 미리보기)에서 똑같이 쓰인다.
// 이 파일을 고치면 사이트의 "구조"가 바뀐다. 글 내용만 바꿀 거라면 content.json을 고칠 것.

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

function btn(b) {
  const cls = b.style === "primary" ? "btn btn-primary" : "btn btn-outline";
  const target = b.newTab ? ' target="_blank" rel="noopener"' : "";
  return `<a class="${cls}" href="${attr(b.href)}"${target}>${esc(b.label)}</a>`;
}

function buttonRow(buttons) {
  if (!has(buttons)) return "";
  return `      <div class="cta-row">
${buttons.map((b) => "        " + btn(b)).join("\n")}
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

function gallery(items, fit) {
  if (!has(items)) return "";
  // 와이어프레임처럼 잘리면 안 되는 문서형 이미지는 fit="contain" 으로 통째로 보여준다
  // contain = 정해진 칸 안에 통째로, natural = 이미지 원본 비율 그대로
  const cls = fit === "contain" ? "gallery gallery-fit"
    : fit === "natural" ? "gallery gallery-natural"
    : "gallery";
  const figs = items
    .map(
      (g) => `        <figure>
          <img src="${attr(g.src)}" alt="${attr(g.alt)}" loading="lazy">
${has(g.caption) ? `          <figcaption>${esc(g.caption)}</figcaption>\n` : ""}        </figure>`
    )
    .join("\n");
  return `      <div class="${cls}">
${figs}
      </div>`;
}

function wideShot(w) {
  if (!w || !has(w.src)) return "";
  return `      <figure class="wide-shot">
        <img src="${attr(w.src)}" alt="${attr(w.alt)}" loading="lazy">
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

function project(p, featuredLabel) {
  const renderers = {
    myPart: () => myPart(p.myPart),
    gallery: () => gallery(p.gallery, p.galleryFit),
    wideShot: () => wideShot(p.wideShot),
    stats: () => stats(p.stats),
    videos: () => videos(p.videos),
    details: () => details(p.details),
    table: () => table(p.table),
    buttons: () => buttonRow(p.buttons),
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

// 프로젝트 카드 인덱스 — 히어로 바로 아래. 긴 페이지의 목차 역할을 한다.
function projectIndex(projects, title) {
  if (projects.length < 2) return "";
  const cards = projects
    .map((p) => {
      // 썸네일은 따로 지정하지 않으면 큰 이미지 → 갤러리 첫 장 순으로 자동 선택
      // thumb 를 명시하면 그 값을 그대로 쓴다. 빈 문자열이면 "이미지 없음" 카드가 된다.
      const thumb = p.thumb !== undefined ? p.thumb
        : (p.wideShot && p.wideShot.src) || (p.gallery && p.gallery[0] && p.gallery[0].src) || "";
      // "05 — TEAM PROJECT" 에서 분류만 떼어낸다 (이미지 없는 카드에 쓴다)
      const kind = String(p.num || "").split("—").pop().trim();
      const inner = thumb
        ? `<img src="${attr(thumb)}" alt="" loading="lazy">`
        : `<span class="pcard-noimg">${esc(kind || p.title)}</span>`;
      return `        <a class="pcard" href="#${attr(p.id)}">
          <span class="pcard-thumb">${inner}</span>
          <span class="pcard-body">
${has(p.num) || has(p.date) ? `            <span class="pcard-num">${esc(p.num)}${has(p.num) && has(p.date) ? " · " : ""}${esc(p.date)}</span>\n` : ""}            <span class="pcard-title">${esc(p.title)}</span>
            <span class="pcard-sum">${esc(p.cardSummary || p.role)}</span>
          </span>
        </a>`;
    })
    .join("\n");

  return `  <!-- PROJECT INDEX -->
  <section class="index-sec reveal" id="projects">
    <div class="wrap">
      <h2 class="index-title">${esc(title)}</h2>
      <div class="index-grid">
${cards}
      </div>
    </div>
  </section>`;
}

function hero(h, firstProjectId) {
  const tags = (h.tags || []).filter(has).map((t) => `        <span class="tag">${esc(t)}</span>`).join("\n");
  const buttons = (h.buttons || []).map((b) => {
    // "프로젝트 보기" 버튼이 사라진 프로젝트를 가리키지 않도록 보정
    if (b.href === "#belief" && firstProjectId) return { ...b, href: `#${firstProjectId}` };
    return b;
  });
  const meta = (h.meta || [])
    .map(
      (m) => `        <div>
          <div class="meta-label">${esc(m.label)}</div>
          <div class="meta-value">${(m.lines || []).map(esc).join("<br>")}</div>
        </div>`
    )
    .join("\n");

  return `  <!-- HERO / PROFILE -->
  <section class="hero" id="home">
    <div class="wrap">
      <div class="eyebrow">${esc(h.eyebrow)}</div>
      <h1>${esc(h.name)}${has(h.subtitle) ? ` <span>${esc(h.subtitle)}</span>` : ""}</h1>
${has(h.lead) ? `      <p class="lead">${esc(h.lead)}</p>\n` : ""}${tags ? `      <div class="tags">\n${tags}\n      </div>\n` : ""}${
    has(buttons) ? `      <div class="cta-row">\n${buttons.map((b) => "        " + btn(b)).join("\n")}\n      </div>\n` : ""
  }
${meta ? `      <div class="meta-grid">\n${meta}\n      </div>\n` : ""}    </div>
  </section>`;
}

// 데브로그 — 날짜순 기록 한 줄. 별도 페이지 없이 한 섹션 안에 리스트로 쌓인다.
function devlogEntry(e) {
  return `        <div class="devlog-entry">
          <div class="devlog-meta">
${has(e.date) ? `            <span class="devlog-date">${esc(e.date)}</span>\n` : ""}${has(e.project) ? `            <span class="devlog-tag">${esc(e.project)}</span>\n` : ""}          </div>
          <h3 class="devlog-title">${esc(e.title)}</h3>
${has(e.retro) ? `          <p class="devlog-retro">${esc(e.retro)}</p>\n` : ""}${has(e.fileHref) ? `          <a class="devlog-file" href="${attr(e.fileHref)}" target="_blank" rel="noopener">${esc(e.fileLabel || "파일 보기")} ↗</a>\n` : ""}        </div>`;
}

function devlogSection(dl) {
  const entries = ((dl && dl.entries) || []).filter((e) => has(e.title));
  if (!entries.length) return "";
  // 최신 글이 위로 오도록 날짜 내림차순 정렬 (에디터에서 순서를 따로 관리할 필요 없게)
  const sorted = entries
    .slice()
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const items = sorted.map(devlogEntry).join("\n");
  return `  <!-- DEVLOG -->
  <section class="project reveal" id="devlog">
    <div class="wrap">
      <div class="section-head">
        <h2>${esc(dl.heading || "데브로그")}</h2>
${has(dl.lead) ? `        <p class="section-lead">${esc(dl.lead)}</p>\n` : ""}      </div>
      <div class="devlog-list">
${items}
      </div>
    </div>
  </section>`;
}

function footer(c, gameCta) {
  const links = [];
  if (has(c.phone)) links.push(`        <a class="btn btn-primary" href="tel:${attr(String(c.phone).replace(/[^0-9+]/g, ""))}">${esc(c.phone)}</a>`);
  if (has(c.email)) links.push(`        <a class="btn btn-outline" href="mailto:${attr(c.email)}">${esc(c.email)}</a>`);

  return `  <!-- CONTACT -->
  <footer id="contact">
    <div class="wrap">
      <h2>${esc(c.heading)}</h2>
${has(c.text) ? `      <p>${esc(c.text)}</p>\n` : ""}${links.length ? `      <div class="contact-links">\n${links.join("\n")}\n      </div>\n` : ""}${gameCta ? gameCta + "\n" : ""}      <div class="foot-bottom">
        <span>${esc(c.copyright)}</span>
        <span><a href="#home">${esc(c.backToTop || "맨 위로 ↑")}</a></span>
      </div>
    </div>
  </footer>`;
}

export function renderPage(content, css) {
  const { site, hero: h, projects = [], contact, devlog } = content;
  const devlogEntries = ((devlog && devlog.entries) || []).filter((e) => has(e.title));
  // 공유 미리보기(og)용 절대 주소 — 상대 경로를 쓰면 카카오톡/슬랙이 이미지를 못 찾는다
  const base = String(site.url || "").replace(/\/*$/, "/");
  // 미니게임 — content.json 의 site.miniGame 이 false 면 통째로 빠진다
  const gameOn = site.miniGame !== false;
  const game = gameOn ? gameMarkup(site) : null;

  const ogImg = base && site.ogImage ? base + site.ogImage + (site.ogImageVersion ? "?v=" + site.ogImageVersion : "") : "";

  const navLinks = [
    `      <a href="#home">${esc(site.homeNavLabel || "소개")}</a>`,
    ...projects.map((p) => `      <a href="#${attr(p.id)}">${esc(p.navLabel || p.title)}</a>`),
    ...(devlogEntries.length ? [`      <a href="#devlog">${esc((devlog && devlog.navLabel) || "데브로그")}</a>`] : []),
    `      <a href="#contact">${esc(site.contactNavLabel || "연락처")}</a>`,
  ].join("\n");

  return `<!DOCTYPE html>
<!--
  ⚠ 이 파일은 자동 생성됩니다. 직접 고치지 마세요 — 다음 배포 때 덮어써집니다.
  글을 고치려면 content.json 을 수정하세요 (웹 에디터: /admin/).
-->
<html lang="${attr(site.lang || "ko")}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(site.title)}</title>
<meta name="description" content="${attr(site.description)}">
${base ? `<link rel="canonical" href="${attr(base)}">` : ""}
<meta name="theme-color" content="${attr(site.themeColor || "#0a0a0a")}">

<link rel="icon" href="favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="apple-touch-icon.png">

<meta property="og:type" content="website">
<meta property="og:site_name" content="${attr(site.title)}">
<meta property="og:title" content="${attr(site.title)}">
<meta property="og:description" content="${attr(site.description)}">
<meta property="og:locale" content="ko_KR">${base ? `
<meta property="og:url" content="${attr(base)}">` : ""}${ogImg ? `
<meta property="og:image" content="${attr(ogImg)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(site.title)}">` : ""}

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(site.title)}">
<meta name="twitter:description" content="${attr(site.description)}">${ogImg ? `
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
    // 정상 동작하면 __revealReady 가 true 라서 아무 일도 하지 않는다.
    setTimeout(function(){
      if (window.__revealReady) return;
      var items = document.querySelectorAll('.reveal');
      for (var i = 0; i < items.length; i++) items[i].classList.add('in');
    }, 2000);
  })();
</script>
<style>
${css}
${gameOn ? gameCss() : ""}
</style>
</head>
<body>

<header class="nav">
  <div class="nav-inner">
    <a class="logo" href="#home">${esc(site.logo)}</a>
    <nav class="nav-links" id="navLinks">
${navLinks}
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

${hero(h, projects[0]?.id)}

${projectIndex(projects, site.projectsIndexTitle || "프로젝트")}

${projects.map((pr) => project(pr, site.featuredLabel)).join("\n\n")}

${devlogSection(devlog)}

${footer(contact, gameOn ? game.cta : "")}

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
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    window.__revealReady = true;
  } catch (err) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    window.__revealReady = true;
  }
</script>
${gameOn ? game.modal + "\n" + gameScript() : ""}
${analyticsScript(site.analytics)}
</body>
</html>
`;
}
