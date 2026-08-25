// content.json -> index.html 로 바꾸는 템플릿.
// Node(build.mjs)와 브라우저(admin 에디터 미리보기)에서 똑같이 쓰인다.
// 이 파일을 고치면 사이트의 "구조"가 바뀐다. 글 내용만 바꿀 거라면 content.json을 고칠 것.

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

function gallery(items) {
  if (!has(items)) return "";
  const figs = items
    .map(
      (g) => `        <figure>
          <img src="${attr(g.src)}" alt="${attr(g.alt)}" loading="lazy">
${has(g.caption) ? `          <figcaption>${esc(g.caption)}</figcaption>\n` : ""}        </figure>`
    )
    .join("\n");
  return `      <div class="gallery">
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

function project(p) {
  const renderers = {
    myPart: () => myPart(p.myPart),
    gallery: () => gallery(p.gallery),
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

  return `  <!-- ${esc(p.id).toUpperCase()} -->
  <section class="project reveal" id="${attr(p.id)}">
    <div class="wrap">
      <div class="section-head">
${has(p.num) ? `        <div class="section-num">${esc(p.num)}</div>\n` : ""}        <h2>${esc(p.title)}${subtitle}</h2>
${has(p.role) ? `        <div class="role">${esc(p.role)}</div>\n` : ""}${has(p.lead) ? `        <p class="section-lead">${esc(p.lead)}</p>\n` : ""}      </div>

${body}
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

function footer(c) {
  const links = [];
  if (has(c.phone)) links.push(`        <a class="btn btn-primary" href="tel:${attr(String(c.phone).replace(/[^0-9+]/g, ""))}">${esc(c.phone)}</a>`);
  if (has(c.email)) links.push(`        <a class="btn btn-outline" href="mailto:${attr(c.email)}">${esc(c.email)}</a>`);

  return `  <!-- CONTACT -->
  <footer id="contact">
    <div class="wrap">
      <h2>${esc(c.heading)}</h2>
${has(c.text) ? `      <p>${esc(c.text)}</p>\n` : ""}${links.length ? `      <div class="contact-links">\n${links.join("\n")}\n      </div>\n` : ""}      <div class="foot-bottom">
        <span>${esc(c.copyright)}</span>
        <span><a href="#home">${esc(c.backToTop || "맨 위로 ↑")}</a></span>
      </div>
    </div>
  </footer>`;
}

export function renderPage(content, css) {
  const { site, hero: h, projects = [], contact } = content;
  const navLinks = [
    `      <a href="#home">${esc(site.homeNavLabel || "소개")}</a>`,
    ...projects.map((p) => `      <a href="#${attr(p.id)}">${esc(p.navLabel || p.title)}</a>`),
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>

<header class="nav">
  <div class="nav-inner">
    <a class="logo" href="#home">${esc(site.logo)}</a>
    <nav class="nav-links" id="navLinks">
${navLinks}
    </nav>
    <button class="nav-toggle" id="navToggle" aria-label="메뉴 열기">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<main>

${hero(h, projects[0]?.id)}

${projects.map(project).join("\n\n")}

${footer(contact)}

</main>

<script>
  // mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  // scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
</script>

</body>
</html>
`;
}
