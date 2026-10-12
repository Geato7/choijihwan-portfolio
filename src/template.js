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

// 케이스 스터디 맨 위 3줄 요약 — 문제 → 결정 → 결과. 훑어보는 사람용.
function caseSummary(cs) {
  if (!cs || !(has(cs.problem) || has(cs.decision) || has(cs.result))) return "";
  const row = (label, text) => (has(text)
    ? `        <div class="case-row"><span class="case-label">${esc(label)}</span><p>${esc(text)}</p></div>`
    : "");
  return `      <div class="case-summary">
${[row("문제", cs.problem), row("결정", cs.decision), row("결과", cs.result)].filter(Boolean).join("\n")}
      </div>`;
}

// 프로젝트가 어떤 역량 카테고리에 드는지 칩으로 보인다 (콘텐츠 기획·시스템 기획 등).
// 채용 담당자가 상세 첫 화면에서 역량을 바로 잡게 하려는 것. 첫 화면 태그와 같은 .tag 를 쓴다.
function capTags(tags) {
  const list = (tags || []).filter(has);
  if (!list.length) return "";
  return `        <div class="tags section-tags">\n` +
    list.map((t) => `          <span class="tag">${esc(t)}</span>`).join("\n") +
    `\n        </div>\n`;
}

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
${has(p.role) ? `        <div class="role">${esc(p.role)}</div>\n` : ""}${has(p.lead) ? `        <p class="section-lead">${esc(p.lead)}</p>\n` : ""}${capTags(p.capTags)}      </div>

${caseSummary(p.caseSummary)}

${body}
    </div>
  </section>`;
}

// 프로젝트 상세 페이지 맨 아래 — 목록으로 돌아가거나 앞뒤 프로젝트로 넘어간다.
// 앞뒤는 목록에 보이는 프로젝트끼리만 잇는다. 목록에서 뺀 프로젝트(unlisted)는
// 이 줄에 끼지 않으므로 앞뒤 칸이 비고 '전체 보기' 만 남는다.
function pager(projects, current, indexLabel) {
  const row = listed(projects);
  const idx = row.findIndex((p) => p.id === current.id);
  const prev = idx < 0 ? undefined : row[idx - 1];
  const next = idx < 0 ? undefined : row[idx + 1];
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
function devlogEntry(e, prefix, id) {
  const excerpt = String(e.retro || "").split("\n")[0];
  return `<article class="devlog-entry note-card" id="${attr(id)}" data-tag="${attr(e.project || "")}" data-genre="${attr(e.genre || "공통 기획 · 제작")}">
    <div class="note-card-top"><span class="note-genre">${esc(e.genre || "공통 기획 · 제작")}</span><time>${esc(e.date)}</time></div>
    <span class="note-project">${esc(e.project)}</span><h3 class="devlog-title">${esc(e.title)}</h3><p class="note-excerpt">${esc(excerpt)}</p>
    ${has(e.retro) ? `<details class="note-details"><summary>기획 과정 읽기 <span>＋</span></summary><p class="devlog-retro">${esc(e.retro)}</p></details>` : ""}
    ${has(e.fileHref) ? `<a class="devlog-file" href="${attr(resolve(e.fileHref, prefix))}" target="_blank" rel="noopener">${esc(e.fileLabel || "자료 보기")} ↗</a>` : ""}
  </article>`.replace(/^[ \t]+$/gm, "");
}

// "2026-06-22" -> "2026.06". 날짜가 없으면 빈 문자열.
const devlogMonth = (v) => (/^\d{4}-\d{2}/.test(String(v || "")) ? String(v).slice(0, 7).replace("-", ".") : "");

// 최신 글이 위로 오도록 날짜 내림차순 정렬 — devlogSection과 playTable이
// 같은 순서를 써야 note-<i> 앵커가 서로 어긋나지 않는다.
function sortedDevlogEntries(dl) {
  return ((dl && dl.entries) || [])
    .filter((e) => has(e.title))
    .slice()
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function devlogSection(dl, prefix) {
  const sorted = sortedDevlogEntries(dl);
  if (!sorted.length) return "";
  const genres = new Map(), projects = new Map();
  sorted.forEach(e => { const g=e.genre || "공통 기획 · 제작"; genres.set(g,(genres.get(g)||0)+1); if(e.project) projects.set(e.project,(projects.get(e.project)||0)+1); });
  const genreChips=[...genres].sort((a,b)=>b[1]-a[1]);
  return `<section class="project notes-studio" id="notes"><div class="wrap">
    <div class="notes-heading"><div><div class="eyebrow">DESIGN JOURNAL</div><h1>${esc(dl.heading || "기획 노트")}</h1><p class="section-lead">${esc(dl.lead)}</p></div><div class="notes-count"><strong>${sorted.length}</strong><span>개의 작업 기록</span></div></div>
    <div class="notes-controls"><span class="filter-caption">장르로 찾아보기</span><div class="devlog-filter" id="devlogFilter"><button type="button" class="dl-chip is-on" data-genre="" aria-pressed="true">전체 <b>${sorted.length}</b></button>${genreChips.map(([g,n])=>`<button type="button" class="dl-chip" data-genre="${attr(g)}" aria-pressed="false">${esc(g)} <b>${n}</b></button>`).join("")}</div><div class="notes-search-row"><label>프로젝트<select id="noteProject"><option value="">전체 프로젝트</option>${[...projects].map(([p,n])=>`<option value="${attr(p)}">${esc(p)} (${n})</option>`).join("")}</select></label><label class="note-search">글 검색<input type="search" id="noteSearch" placeholder="제목, 게임 이름, 기획 내용 검색"></label><button type="button" id="noteReset">필터 초기화</button></div></div>
    <p id="noteResult" class="note-result" role="status">전체 ${sorted.length}개의 기록</p><div class="devlog-list note-grid" id="devlogList">${sorted.map((e,i)=>devlogEntry(e,prefix,`note-${i}`)).join("\n")}</div><p class="devlog-empty" id="devlogEmpty" hidden>조건에 맞는 글이 없습니다. 다른 장르를 고르거나 필터를 초기화해 보세요.</p>
  </div></section>`;
}
function devlogScript() {
 return `<script>(function(){
 const bar=document.getElementById('devlogFilter'); if(!bar)return;
 const project=document.getElementById('noteProject'), search=document.getElementById('noteSearch'), cards=[...document.querySelectorAll('.note-card')];let genre='';
 function apply(){let shown=0;const q=search.value.trim().toLocaleLowerCase();cards.forEach(el=>{const on=(!genre||el.dataset.genre===genre)&&(!project.value||el.dataset.tag===project.value)&&(!q||el.textContent.toLocaleLowerCase().includes(q));el.hidden=!on;if(on)shown++;});document.getElementById('devlogEmpty').hidden=shown>0;document.getElementById('noteResult').textContent=shown+'개의 기록'+(genre?' · '+genre:'');bar.querySelectorAll('button').forEach(b=>{const on=b.dataset.genre===genre;b.classList.toggle('is-on',on);b.setAttribute('aria-pressed',String(on));});}
 bar.addEventListener('click',ev=>{const b=ev.target.closest('button');if(b){genre=b.dataset.genre;apply();}});project.addEventListener('change',apply);search.addEventListener('input',apply);document.getElementById('noteReset').addEventListener('click',()=>{genre='';project.value='';search.value='';apply();});
 function openHash(){const el=document.getElementById(location.hash.slice(1));if(el&&el.classList.contains('note-card')){genre='';project.value='';search.value='';apply();const d=el.querySelector('details');if(d)d.open=true;el.scrollIntoView();}}window.addEventListener('hashchange',openHash);if(location.hash)setTimeout(openHash,100);
 })();</script>`;
}

// 게임 이름이 기획 노트 글의 제목·회고에 나오면 그 글로 바로 가는 열을 붙인다.
// 데이터에 링크를 따로 적어두지 않아도, 새 노트가 그 게임을 언급하는 순간 자동으로 이어진다.
function playTable(t, dl) {
  if (!t || !has(t.headers)) return "";
  const notes = sortedDevlogEntries(dl);
  const head = t.headers.map((h) => `<th>${esc(h)}</th>`).join("") + "<th></th>";
  const body = (t.rows || [])
    .map((r) => {
      const game = String(r[1] || "").trim();
      const hit = game.length >= 2
        ? notes.findIndex((e) =>
            e.title.includes(game) || (e.retro || "").includes(game) ||
            (e.project && e.project.length >= 2 && game.includes(e.project)))
        : -1;
      const link = hit >= 0
        ? `<td><a class="devlog-jump" href="notes.html#note-${hit}" title="기획 노트로 이동" aria-label="기획 노트로 이동">🔗</a></td>`
        : "<td></td>";
      return `          <tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}${link}</tr>`;
    })
    .join("\n");
  return `      <div class="table-wrap">
        <table class="price-table play-table">
          <thead>
            <tr>${head}</tr>
          </thead>
          <tbody>
${body}
          </tbody>
        </table>
      </div>`;
}

// 게임 경험 — 플레이 이력 한 장. 숫자 줄 + 표만 쓴다.
function playSection(ph, dl) {
  if (!ph || !has((ph.table || {}).rows)) return "";
  const rows=ph.table.rows, groups=ph.genreGroups || [], mapping=ph.gameGenres || {};
  const count=rows.length, timed=rows.filter(r=>/^[\d,.]+시간$/.test(r[3]));
  const total=timed.reduce((n,r)=>n+Number(r[3].replace(/[^\d.]/g,'')),0);
  const data=groups.map(g=>({...g,rows:rows.filter(r=>mapping[r[1]]===g.id)})).filter(g=>g.rows.length);
  const largest=Math.max(...data.map(g=>g.rows.length),1);
  const withHours=data.map(g=>({...g,hours:g.rows.filter(r=>r[3].endsWith('시간')).reduce((n,r)=>n+parseFloat(r[3]),0)}));
  const maxHours=Math.max(...withHours.map(g=>g.hours),1);
  const chart=data.map(g=>`<button class="genre-chart-row" type="button" data-choose-genre="${attr(g.id)}"><span>${esc(g.label)}</span><b>${g.rows.length}개</b><div class="genre-bar-track"><i style="width:${g.rows.length/largest*100}%;background:${attr(g.color)}"></i></div></button>`).join("");
  const hourChart=[...withHours].sort((a,b)=>b.hours-a.hours).map(g=>`<div class="hour-chart-row"><span>${esc(g.label)}</span><b>${Math.round(g.hours*10)/10}시간</b><div class="genre-bar-track"><i style="width:${g.hours/maxHours*100}%;background:${attr(g.color)}"></i></div></div>`).join("");
  const notes=sortedDevlogEntries(dl);
  function gameCard(r){const game=r[1],hit=game.length>=2?notes.findIndex(e=>e.title.includes(game)||(e.retro||'').includes(game)||(e.project&&e.project.length>=2&&game.includes(e.project))):-1;
    return `<article class="game-record" data-genre="${attr(mapping[game]||'')}" data-platform="${attr(r[0])}"><div class="game-record-top"><span>${esc(r[0])}</span><strong>${esc(r[3])}</strong></div><h3>${esc(game)}</h3><p>${esc(r[2])}</p><div class="game-record-bottom"><span>과금 ${esc(r[4])}</span>${hit>=0?`<a href="notes.html#note-${hit}">관련 기획 노트 ↗</a>`:''}</div></article>`;
  }
  return `<section class="play-library" id="play"><div class="wrap"><div class="play-heading"><div class="eyebrow">PLAYER'S LIBRARY</div><h1>${esc(ph.heading || '게임 경험')}</h1><p>${esc(ph.lead)}</p></div>
  <div class="play-summary">${[{n:count+'개',l:'플레이 타이틀'},{n:Math.round(total).toLocaleString()+'시간',l:'시간 기록이 있는 '+timed.length+'개 타이틀'},{n:data.length+'개',l:'장르 분류'},{n:'6년',l:'최장 플레이 · 리그오브레전드'}].map(x=>`<div><strong>${esc(x.n)}</strong><span>${esc(x.l)}</span></div>`).join('')}</div>
  <div class="play-visual-grid"><figure class="genre-overview"><figcaption><span class="eyebrow">BREADTH OF PLAY</span><h2>어떤 장르를 경험했을까?</h2><p>타이틀 수로 보는 장르별 분포 · 막대를 누르면 해당 이력으로 이동합니다.</p></figcaption>${chart}</figure><figure class="genre-hours"><figcaption><span class="eyebrow">DEPTH OF PLAY</span><h2>시간을 들여 깊게 즐긴 장르</h2><p>누적 시간이 기록된 게임만 합산했습니다.</p></figcaption>${hourChart}</figure></div>
  <p class="play-data-note">복합 장르는 대표 플레이 특성에 따라 한 분류에만 배치했습니다. 장르별 타이틀 수의 합계는 ${count}개이며, 기간 기록(년·개월)은 시간으로 환산하지 않았습니다.</p>
  ${experienceVisuals({playHistory:ph})}
  <div class="play-highlights"><div><span class="eyebrow">LONG-TERM PLAY</span><h2>오래 즐긴 게임의 기록</h2></div>${['리그오브레전드','TFT 모바일','좀비고등학교'].map(name=>{const r=rows.find(r=>r[1]===name);return r?`<article><strong>${esc(r[3])}</strong><h3>${esc(r[1])}</h3><span>${esc(r[2])}</span></article>`:''}).join('')}</div>
  <section class="game-collection" id="game-collection"><div class="collection-heading"><div><div class="eyebrow">EXPLORE THE COLLECTION</div><h2>장르별 플레이 이력</h2></div><button id="gameReset" type="button">필터 초기화</button></div><div id="gameGenreFilter" class="game-genre-filter"><button type="button" data-genre="" class="is-on" aria-pressed="true">전체 <b>${count}</b></button>${data.map(g=>`<button type="button" data-genre="${attr(g.id)}" aria-pressed="false">${esc(g.label)} <b>${g.rows.length}</b></button>`).join('')}</div><div class="game-search-row"><label>플랫폼<select id="gamePlatform"><option value="">전체 플랫폼</option>${[...new Set(rows.map(r=>r[0]))].map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>게임 검색<input type="search" id="gameSearch" placeholder="게임 이름이나 세부 장르 검색"></label></div><p class="game-result" id="gameResult" role="status">전체 ${count}개 타이틀</p>
  ${data.map(g=>`<section class="game-genre-group" data-group="${attr(g.id)}"><div class="genre-group-heading"><span class="genre-color-mark" style="background:${attr(g.color)}"></span><div><h2>${esc(g.label)} <span class="group-count">${g.rows.length}개</span></h2><p>${esc(g.description)}</p></div></div><div class="game-record-grid">${g.rows.map(gameCard).join('')}</div></section>`).join('')}<p id="gameEmpty" hidden>조건에 맞는 게임이 없습니다. 검색어나 필터를 바꿔보세요.</p></section></div></section>`;
}
function playScript(){return `<script>(function(){const bar=document.getElementById('gameGenreFilter');if(!bar)return;let genre='';const platform=document.getElementById('gamePlatform'),search=document.getElementById('gameSearch'),cards=[...document.querySelectorAll('.game-record')];function apply(){let shown=0;const q=search.value.trim().toLocaleLowerCase();cards.forEach(el=>{const on=(!genre||el.dataset.genre===genre)&&(!platform.value||el.dataset.platform===platform.value)&&(!q||el.textContent.toLocaleLowerCase().includes(q));el.hidden=!on;if(on)shown++;});document.querySelectorAll('.game-genre-group').forEach(group=>{const n=group.querySelectorAll('.game-record:not([hidden])').length;group.hidden=n===0;group.querySelector('.group-count').textContent=n+'개';});bar.querySelectorAll('button').forEach(b=>{const on=b.dataset.genre===genre;b.classList.toggle('is-on',on);b.setAttribute('aria-pressed',String(on));});document.getElementById('gameResult').textContent=shown+'개 타이틀';document.getElementById('gameEmpty').hidden=shown>0;}bar.addEventListener('click',e=>{const b=e.target.closest('button');if(b){genre=b.dataset.genre;apply();}});platform.addEventListener('change',apply);search.addEventListener('input',apply);document.getElementById('gameReset').addEventListener('click',()=>{genre='';platform.value='';search.value='';apply();});document.querySelectorAll('[data-choose-genre]').forEach(b=>b.addEventListener('click',()=>{genre=b.dataset.chooseGenre;platform.value='';search.value='';apply();document.getElementById('game-collection').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));})();</script>`;}

// unlisted 를 켠 프로젝트는 카드 목록·앞뒤 이동·사이트맵에서 빠진다.
// 페이지는 그대로 만들어지므로 주소를 아는 사람은 볼 수 있다 (기획 노트에서 링크한다).
function listed(projects) {
  return (projects || []).filter((p) => !p.unlisted);
}

// 프로젝트 카드 목차 — projects.html 의 본문이자 소개 페이지의 '대표 프로젝트' 구역.
// opts.tag  : 소개 페이지에는 h1(이름)이 이미 있으므로 h2 로 낮춰 넣는다.
// opts.more : 카드 아래 '전체 보기' 링크 { href, label }.
function projectIndex(projects, title, lead, prefix, opts) {
  const { tag = "h1", more = null } = opts || {};
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

  const moreLink = more && has(more.href)
    ? `\n      <a class="index-more" href="${attr(resolve(more.href, prefix))}">${esc(more.label)} →</a>`
    : "";
  return `  <section class="index-sec reveal" id="projects">
    <div class="wrap">
      <${tag} class="index-title">${esc(title)}</${tag}>
${has(lead) ? `      <p class="index-lead">${esc(lead)}</p>\n` : ""}      <div class="index-grid">
${cards}
      </div>${moreLink}
    </div>
  </section>`;
}

// 첫 화면 본문 순서 — 머리말/이름/소개 문장은 늘 위에 고정, 그 아래 세 칸만
// 에디터에서 순서를 바꿀 수 있다 (프로젝트 페이지의 blocks 와 같은 방식).
const DEFAULT_HERO_BLOCKS = ["tags", "buttons", "meta"];

// 첫 화면(소개)만 필드마다 좌/중앙/우 정렬을 고를 수 있다 — 다른 페이지는 손대지 않는다.
const textAlignStyle = (v) => (v === "center" || v === "right" ? ` style="text-align:${v}"` : "");
const rowAlignStyle = (v) => (v === "center" ? ` style="justify-content:center"` : v === "right" ? ` style="justify-content:flex-end"` : "");

// 요약 정보 4칸의 정렬 + 위아래·좌우 여백(px) — 안 정하면 CSS 기본값 그대로.
// 좌우 값을 직접 정하면 첫/끝 칸을 컨테이너 끝에 맞추던 CSS 기본 동작(양끝 0)은 덮어써진다 —
// 사용자가 직접 값을 넣은 것이므로 의도된 동작.
function metaBoxStyle(m) {
  const parts = [];
  if (m.align === "center" || m.align === "right") parts.push(`text-align:${m.align}`);
  if (Number(m.padding) >= 0) parts.push(`padding-top:${m.padding}px`, `padding-bottom:${m.padding}px`);
  if (Number(m.paddingX) >= 0) parts.push(`padding-left:${m.paddingX}px`, `padding-right:${m.paddingX}px`);
  return parts.length ? ` style="${parts.join(";")}"` : "";
}

// 칸 안 "내용(줄바꿈 단위)" 텍스트 자체의 위아래·좌우 여백 — 칸 전체 여백(metaBoxStyle)과는 별개.
function metaLinesStyle(m) {
  const parts = [];
  if (Number(m.linesPadding) >= 0) parts.push(`padding-top:${m.linesPadding}px`, `padding-bottom:${m.linesPadding}px`);
  if (Number(m.linesPaddingX) >= 0) parts.push(`padding-left:${m.linesPaddingX}px`, `padding-right:${m.linesPaddingX}px`);
  return parts.length ? ` style="${parts.join(";")}"` : "";
}

function hero(h, prefix) {
  const tags = (h.tags || []).filter(has).map((t) => `        <span class="tag">${esc(t)}</span>`).join("\n");
  // 옛 앵커 주소를 새 페이지로 옮겨준다 (content.json 을 고치지 않아도 동작하도록)
  // #projects 는 이제 소개 페이지 안의 '대표 프로젝트' 구역을 가리키므로 되돌리지 않는다
  const MAP = { "#contact": "contact.html", "#belief": "projects.html", "#home": "index.html", "#devlog": "notes.html", "devlog.html": "notes.html" };
  const buttons = (h.buttons || []).map((b) => (MAP[b.href] ? { ...b, href: MAP[b.href] } : b));
  const meta = (h.meta || [])
    .map(
      (m) => `        <div${metaBoxStyle(m)}>
          <div class="meta-label">${esc(m.label)}</div>
          <div class="meta-value"${metaLinesStyle(m)}>${(m.lines || []).map(esc).join("<br>")}</div>
        </div>`
    )
    .join("\n");

  // 칸마다 폭 비율(width, 기본 1)을 적어두면 그 값대로 fr 을 배분한다 —
  // 에디터에서 숫자만 바꾸면 폭이 바뀌도록.
  const metaCols = (h.meta || []).map((m) => `${Number(m.width) > 0 ? m.width : 1}fr`).join(" ");
  const renderers = {
    tags: () => (tags ? `      <div class="tags"${rowAlignStyle(h.tagsAlign)}>\n${tags}\n      </div>` : ""),
    buttons: () => (has(buttons) ? `      <div class="cta-row"${rowAlignStyle(h.buttonsAlign)}>\n${buttons.map((b) => "        " + btn(b, prefix)).join("\n")}\n      </div>` : ""),
    meta: () => (meta ? `      <div class="meta-grid" style="grid-template-columns:${attr(metaCols)}">\n${meta}\n      </div>` : ""),
  };
  const order = has(h.blocks) ? h.blocks : DEFAULT_HERO_BLOCKS;
  const body = order.map((key) => (renderers[key] ? renderers[key]() : "")).filter(Boolean).join("\n");

  return `  <section class="hero" id="home">
    <div class="wrap">
      <div class="eyebrow"${textAlignStyle(h.eyebrowAlign)}>${esc(h.eyebrow)}</div>
      <h1${textAlignStyle(h.nameAlign)}>${esc(h.name)}${has(h.subtitle) ? ` <span>${esc(h.subtitle)}</span>` : ""}</h1>
${has(h.lead) ? `      <p class="lead"${textAlignStyle(h.leadAlign)}>${esc(h.lead)}</p>\n` : ""}${body}
    </div>
  </section>`;
}

function skillSection(p) {
  return `<section class="skills-section"><div class="wrap"><div class="profile-section-top"><div><div class="eyebrow">TOOLKIT</div><h2>아이디어를 실현하는 도구들.</h2></div><p class="skills-caption">만들고, 협업하고, 검증할 때 활용합니다.</p></div><div class="skill-grid">${(p.skills||[]).map((g,i)=>`<article class="skill-group skill-${i}"><span class="skill-index">0${i+1}</span><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p><div class="tool-icons">${g.tools.map(t=>`<div class="tool-item"><span class="tool-icon-wrap"><img src="assets/tools/${attr(p.toolIcons[t])}.svg" width="28" height="28" alt="" loading="lazy"></span><span>${esc(t)}</span></div>`).join("")}</div></article>`).join("")}</div></div></section>`;
}
function experienceVisuals(content) {
  const rows=content.playHistory.table.rows, counts=new Map();rows.forEach(r=>counts.set(r[0],(counts.get(r[0])||0)+1));
  const timed=rows.filter(r=>/^[\d,.]+시간$/.test(r[3])).map(r=>({name:r[1],hours:Number(r[3].replace(/[^\d.]/g,''))})).sort((a,b)=>b.hours-a.hours).slice(0,5);
  const max=timed[0]?.hours||1;
  return `<div class="experience-visuals"><figure class="platform-chart"><figcaption><span class="eyebrow">PLAY LIBRARY</span><h3>플랫폼을 넘나든 66개의 경험</h3></figcaption><div class="platform-donut" role="img" aria-label="온라인 27개, 모바일 7개, 그 외 32개"><span><strong>66</strong>타이틀</span></div><ul>${[...counts].map(([name,n],i)=>`<li><i class="platform-dot dot-${i}"></i>${esc(name)}<strong>${n}개</strong></li>`).join("")}</ul></figure><figure class="time-chart"><figcaption><span class="eyebrow">TIME WELL PLAYED</span><h3>시간을 쌓으며 깊게 경험한 게임</h3></figcaption><div class="time-bars">${timed.map(r=>`<div><span>${esc(r.name)}</span><strong>${r.hours}시간</strong><div class="bar-track"><i style="width:${r.hours/max*100}%"></i></div></div>`).join("")}</div><p>시간 기록이 있는 타이틀 중 상위 5개 · 기간으로 기록한 게임 제외</p></figure></div>`;
}

function profileHome(content) {
  const h = content.hero, p = content.profile;
  if (!p) return hero(h, "");
  return `<section class="hero profile-hero" id="home"><div class="wrap profile-grid">
    <div><div class="eyebrow">${esc(h.eyebrow)}</div><h1>${esc(h.name)} <span>${esc(h.subtitle)}</span></h1><h2 class="profile-statement">${esc(h.headline || "풍부한 프로젝트 경험을 갖춘 게임 기획자").replace(/\n/g, "<br>")}</h2><p class="lead">${esc(h.lead)}</p>${buttonRow(h.buttons, "")}</div>
    <aside class="profile-side"><figure class="portrait-frame"><img src="${attr(p.portrait)}" alt="게임 기획자 최지환의 프로필 사진" width="1086" height="1448"><figcaption>최지환 <span>GAME DESIGNER</span></figcaption></figure><div class="residence-card" aria-label="거주 경험과 언어 역량"><div class="eyebrow">LIFE & LANGUAGE</div><span class="residence-years">5<span>년</span></span><h2>${esc(p.residence)}</h2><p>${esc(p.duration)}</p><div class="language-list">${p.languages.map(x=>`<span>${esc(x)}</span>`).join("")}</div></div></aside>
  </div></section>
  <section class="profile-play"><div class="wrap"><div class="profile-section-top"><div><div class="eyebrow">PLAYER BEFORE DESIGNER</div><h2>오래 플레이한 경험이,<br>기획의 출발점입니다.</h2></div><a class="btn btn-outline" href="play.html">플레이 이력 전체 보기 ↗</a></div><div class="profile-stats">${content.playHistory.stats.slice(0,3).map(x=>`<div><strong>${esc(x.num)}</strong><span>${esc(x.label)}</span></div>`).join("")}</div><div class="play-insights">${p.playNotes.map(x=>`<article><h3>${esc(x.title)}</h3><p class="play-record">${esc(x.record)}</p><p>${esc(x.text)}</p></article>`).join("")}</div>${experienceVisuals(content)}<p class="profile-footnote">누적 시간은 시간 기록이 있는 47개 타이틀의 합계입니다. 플레이 기간과 누적 시간은 구분해 기록했습니다.</p></div></section>
  ${skillSection(p)}<section class="profile-about" id="about-me"><div class="wrap"><div class="eyebrow">ABOUT JIHWAN</div><h2>${esc(p.heading)}</h2><p class="profile-intro">${esc(p.intro)}</p><div class="life-chapters">${p.chapters.map(x=>`<article><span class="chapter-label">${esc(x.label)}</span><div><h3>${esc(x.title)}</h3>${x.date?`<span class="chapter-date">${esc(x.date)}</span>`:""}<p>${esc(x.text)}</p></div></article>`).join("")}</div><div class="resume-panel"><div><h3>이력과 작업 방식까지 더 자세히.</h3><p>프로젝트별 역할과 결과, 게임 경험, 출시 후 개선 과정을 통합 이력서와 자기소개서에 담았습니다.</p></div><a class="btn btn-primary" href="${attr(p.resume)}" target="_blank" rel="noopener">이력서 · 자기소개서 PDF ↗</a></div></div></section>`;
}

// 연락처 — contact.html 의 본문
function contactSection(c, gameCta) {
  const links = [];
  if (has(c.phone)) links.push(`        <a class="btn btn-primary" href="tel:${attr(String(c.phone).replace(/[^0-9+]/g, ""))}">${esc(c.phone)}</a>`);
  if (has(c.email)) {
    links.push(`        <a class="btn btn-outline" href="mailto:${attr(c.email)}">${esc(c.email)}</a>`);
    // mailto 가 열리지 않는 환경(웹메일만 쓰는 PC 등)에서 막다른 길이 되지 않도록 복사 버튼을 함께 둔다
    links.push(`        <button type="button" class="btn btn-outline btn-copy" id="copyMail" aria-live="polite" data-email="${attr(c.email)}">${esc(c.copyLabel || "주소 복사")}</button>`);
  }

  return `  <section class="contact-sec reveal" id="contact">
    <div class="wrap">
      <h1>${esc(c.heading)}</h1>
${has(c.text) ? `      <p>${esc(c.text)}</p>\n` : ""}${links.length ? `      <div class="contact-links">\n${links.join("\n")}\n      </div>\n` : ""}${gameCta ? gameCta + "\n" : ""}    </div>
  </section>`;
}

// 이메일 주소 복사 — 성공하면 버튼 글자가 잠깐 바뀐다
function copyMailScript() {
  return `<script>
(function(){
  var b = document.getElementById('copyMail');
  if (!b) return;
  var label = b.textContent, timer;
  function done(ok){
    clearTimeout(timer);
    b.textContent = ok ? '복사됨' : '복사 실패';
    b.classList.toggle('is-done', ok);
    timer = setTimeout(function(){ b.textContent = label; b.classList.remove('is-done'); }, 1600);
  }
  function fallback(v){
    try {
      var t = document.createElement('textarea');
      t.value = v;
      t.setAttribute('readonly', '');
      t.style.position = 'fixed';
      t.style.top = '-1000px';
      document.body.appendChild(t);
      t.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(t);
      done(ok);
    } catch (e) { done(false); }
  }
  b.addEventListener('click', function(){
    var v = b.getAttribute('data-email') || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).then(function(){ done(true); }, function(){ fallback(v); });
    } else {
      fallback(v);
    }
  });
})();
</script>`;
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
    pages.push({
      key: `project:${p.id}`, path: `projects/${p.id}.html`,
      label: `프로젝트 — ${p.title}`,
      // 목록에서 뺀 프로젝트는 검색엔진 색인에서도 뺀다. 페이지는 그대로 만들어진다.
      noIndex: !!p.unlisted,
    });
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
      el.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');
    }catch(e){
      el.setAttribute('data-theme','light');
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
      body: projectIndex(listed(projects), t, site.projectsIndexLead, ""),
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
      body: playSection(ph, content.devlog),
      script: playScript(),
    });
  }

  if (key === "contact") {
    const game = gameOn ? gameMarkup(site) : null;
    return shell(content, css, {
      prefix: "", nav: "contact", canonicalPath: "contact.html",
      title: `${site.contactNavLabel || "연락처"} — ${siteName}`,
      description: contact.text || site.description,
      body: contactSection(contact, gameOn ? game.cta : ""),
      script: copyMailScript(),
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
             pager(projects, p, site.projectsIndexTitle || "프로젝트")].join("\n\n"),
    });
  }

  // 기본값: 소개.
  // 첫 화면 바로 아래에 대표 프로젝트 카드를 붙인다 — 방문자가 '무엇을 만들었나' 를
  // 클릭 없이 보게 하려는 것. 몇 장을 보일지는 site.homeProjectCount (기본 3).
  const row = listed(projects);
  const shown = Number(site.homeProjectCount) > 0 ? Number(site.homeProjectCount) : 3;
  const cards = row.length
    ? projectIndex(row.slice(0, shown), site.homeProjectsTitle || "대표 프로젝트",
        site.homeProjectsLead, "", {
          tag: "h2",
          more: row.length > shown
            ? { href: "projects.html", label: site.homeProjectsMore || "프로젝트 전체 보기" }
            : null,
        })
    : "";
  return shell(content, css, {
    prefix: "", nav: "index", canonicalPath: "index.html",
    title: site.title, description: site.description,
    body: [profileHome(content), cards].filter(Boolean).join("\n\n"),
  });
}

// build.mjs 가 쓰는 진입점 — [{ path, html }, ...]
export function renderSite(content, css) {
  const pages = sitePages(content).map((pg) => ({
    path: pg.path,
    noIndex: !!pg.noIndex,
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
