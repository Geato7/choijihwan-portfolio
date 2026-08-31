// /admin/ 의 [방문 통계] 화면.
// src/analytics.js 가 사이트에서 모아 Firestore 에 쌓아 둔 기록을 읽어 보여준다.
//
// 읽기는 구글 로그인한 사람만 된다 (보안 규칙에서 이메일로 막는다).
// 사이트 방문자는 쓰기만 할 수 있고 남의 기록을 읽지 못한다.

const FB = "https://www.gstatic.com/firebasejs/10.12.2";
const OWNER_KEY = "pf_owner";          // 내 방문을 집계에서 뺄지 (사이트와 같은 도메인이라 통한다)
const RANGE_KEY = "pf_stats_range";

/* ===================== 잡다한 도구 ===================== */
const $$ = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
};

const dayKST = (d) => {
  try { return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(d); }
  catch (e) { return new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10); }
};
const timeKST = (d) => {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(d);
  } catch (e) { return "—"; }
};
const shiftDay = (n) => dayKST(new Date(Date.now() + n * 86400000));
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const weekdayOf = (day) => WEEKDAY[new Date(day + "T00:00:00+09:00").getDay()];

function dur(sec) {
  sec = Math.round(sec || 0);
  if (sec <= 0) return "—";
  if (sec < 60) return sec + "초";
  const m = Math.floor(sec / 60);
  if (m < 60) return m + "분 " + (sec % 60) + "초";
  return Math.floor(m / 60) + "시간 " + (m % 60) + "분";
}

/* ===================== 화면 ===================== */
const STYLE = `
#statsPane{display:none;}
body.show-stats .main{display:none;}
body.show-stats #statsPane{display:block; flex:1; min-height:0; overflow-y:auto; padding-bottom:60px;}
.st-wrap{max-width:1080px; margin:0 auto; padding:22px 20px;}
.st-bar{display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:20px;}
.st-bar .grow{margin-right:auto;}
.st-seg{display:flex; border:1px solid var(--border); border-radius:7px; overflow:hidden;}
.st-seg button{background:var(--card); color:var(--dim); border:none; padding:7px 13px; font-size:12.5px;}
.st-seg button+button{border-left:1px solid var(--border);}
.st-seg button.on{background:#fff; color:#0a0a0a; font-weight:700;}
.st-check{display:flex; align-items:center; gap:6px; font-size:12px; color:var(--dim);}

.st-kpis{display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; margin-bottom:26px;}
.kpi{background:var(--card); border:1px solid var(--border); border-radius:10px; padding:14px 15px;}
.kpi .k{font-size:11.5px; color:var(--faint); margin-bottom:6px;}
.kpi .v{font-size:26px; font-weight:700; line-height:1.15; letter-spacing:-.5px;}
.kpi .s{font-size:11.5px; color:var(--dim); margin-top:4px;}
.kpi .s.up{color:var(--ok);} .kpi .s.down{color:var(--err);}

.st-card{background:var(--panel); border:1px solid var(--border); border-radius:11px; margin-bottom:16px;}
.st-card > h3{font-size:13px; font-weight:700; padding:13px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px;}
.st-card > h3 .note{margin-left:auto; font-size:11.5px; color:var(--faint); font-weight:400;}
.st-card .pad{padding:15px 16px;}
.st-two{display:grid; grid-template-columns:1fr 1fr; gap:16px;}
@media (max-width:820px){ .st-two{grid-template-columns:1fr;} }

/* 날짜별 막대 */
.chart{display:flex; align-items:flex-end; gap:3px; height:170px; padding:15px 16px 0;}
.chart .col{flex:1; min-width:0; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:2px; height:100%; cursor:pointer;}
.chart .bars{display:flex; align-items:flex-end; gap:2px; width:100%; justify-content:center; height:100%;}
.chart .b{width:44%; max-width:16px; border-radius:2px 2px 0 0; min-height:2px; background:var(--accent);}
.chart .b.v2{background:#2f4f7a;}
.chart .col.sel .b{outline:1px solid #fff; outline-offset:1px;}
.chart .col:hover .b{filter:brightness(1.25);}
.chart-x{display:flex; gap:3px; padding:6px 16px 14px; font-size:10px; color:var(--faint);}
.chart-x span{flex:1; min-width:0; text-align:center; overflow:hidden; white-space:nowrap;}
.legend{display:flex; gap:14px; font-size:11.5px; color:var(--dim); padding:0 16px 12px;}
.legend i{display:inline-block; width:9px; height:9px; border-radius:2px; margin-right:5px; vertical-align:middle;}

table.st{width:100%; border-collapse:collapse; font-size:12.5px;}
table.st th{font-size:11.5px; color:var(--faint); font-weight:500; text-align:left; padding:9px 14px; border-bottom:1px solid var(--border); white-space:nowrap;}
table.st td{padding:9px 14px; border-bottom:1px solid #202020; vertical-align:top;}
table.st tr:last-child td{border-bottom:none;}
table.st td.num{text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap;}
table.st th.num{text-align:right;}
table.st tbody tr.click{cursor:pointer;}
table.st tbody tr.click:hover{background:#1b1b1b;}
table.st tbody tr.sel{background:#1d2430;}
.tag{display:inline-block; background:var(--card); border:1px solid var(--border); border-radius:5px; padding:1px 7px; font-size:11px; color:var(--dim); margin:1px 3px 1px 0;}
.tag.new{color:#7ee08a; border-color:#23402a;}
.tag.re{color:#8ab4f8; border-color:#22344f;}

.rank{display:flex; flex-direction:column; gap:9px; padding:15px 16px;}
.rank .r{display:grid; grid-template-columns:1fr auto; gap:4px 10px; font-size:12.5px;}
.rank .r .lbl{overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.rank .r .n{color:var(--dim); font-variant-numeric:tabular-nums;}
.rank .track{grid-column:1/-1; height:5px; background:#202020; border-radius:3px; overflow:hidden;}
.rank .fill{height:100%; background:var(--accent); border-radius:3px;}

.st-empty{padding:34px 16px; text-align:center; color:var(--faint); font-size:13px;}
.st-setup{background:var(--panel); border:1px solid var(--border); border-radius:11px; padding:24px; max-width:760px; margin:0 auto;}
.st-setup h2{font-size:17px; margin-bottom:8px;}
.st-setup > p{font-size:13px; color:var(--dim); margin-bottom:18px; line-height:1.7;}
.st-setup ol{margin:0 0 18px 19px; font-size:13px; color:var(--dim); line-height:2;}
.st-setup ol ul{margin:2px 0 6px 16px; line-height:1.85;}
.st-setup code{background:var(--card); border:1px solid var(--border); padding:1px 6px; border-radius:4px; font-size:12px; color:var(--text);}
.st-setup a{color:var(--accent);}
.st-setup pre{background:#0d0d0d; border:1px solid var(--border); border-radius:8px; padding:13px 14px; font-size:11.5px; line-height:1.65; overflow-x:auto; color:#cfd6dd; margin-bottom:10px;}
.st-setup .cfg{display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:16px 0;}
@media (max-width:640px){ .st-setup .cfg{grid-template-columns:1fr;} }
.st-err{background:#241615; border:1px solid #40201f; color:#f7a19b; border-radius:8px; padding:12px 14px; font-size:12.5px; line-height:1.7; margin-bottom:16px;}
`;

const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /visits/{doc} {
      // 사이트 방문자: 기록을 새로 남기는 것만 가능
      allow create: if request.resource.data.day is string
                    && request.resource.data.vid is string
                    && request.resource.data.size() <= 24;

      // 머문 시간 / 본 구역만 나중에 갱신 가능
      allow update: if request.resource.data.diff(resource.data)
                       .affectedKeys().hasOnly(['secs', 'views'])
                    && request.resource.data.secs is int
                    && request.resource.data.secs <= 3600;

      // 읽기·삭제는 나만
      allow read, delete: if request.auth != null
                          && request.auth.token.email == '__EMAIL__';
    }
  }
}`;

/* ===================== 진입점 ===================== */
export function mountStats({ pane, getContent, isDirty, save }) {
  document.head.append($$("style", { html: STYLE }));

  let state = { range: Number(localStorage.getItem(RANGE_KEY)) || 30, rows: null, day: null, err: "" };
  let ctx = null;   // { db, auth, user, sdk }

  const render = () => { pane.textContent = ""; pane.append(draw()); };

  function cfgOf() {
    const a = getContent()?.site?.analytics || {};
    const projectId = String(a.projectId || "").trim();
    const apiKey = String(a.apiKey || "").trim();
    return projectId && apiKey ? { projectId, apiKey } : null;
  }

  function labelOf(id) {
    if (id === "home") return "소개";
    if (id === "projects") return "프로젝트 한눈에 보기";
    if (id === "contact") return "연락처";
    const p = (getContent()?.projects || []).find((x) => x.id === id);
    return p ? p.title : id;
  }

  /* ---------- Firebase ---------- */
  async function connect() {
    if (ctx) return ctx;
    const cfg = cfgOf();
    const [appM, authM, dbM] = await Promise.all([
      import(`${FB}/firebase-app.js`),
      import(`${FB}/firebase-auth.js`),
      import(`${FB}/firebase-firestore-lite.js`),
    ]);
    const app = appM.initializeApp({
      apiKey: cfg.apiKey,
      authDomain: `${cfg.projectId}.firebaseapp.com`,
      projectId: cfg.projectId,
    }, "stats");
    const auth = authM.getAuth(app);
    await authM.setPersistence(auth, authM.browserLocalPersistence).catch(() => {});
    ctx = { app, auth, db: dbM.getFirestore(app), A: authM, D: dbM, user: auth.currentUser };
    // onAuthStateChanged 가 곧바로 한 번 부르는 경우가 있어 off 를 나중에 떼도 되게 둔다
    await new Promise((res) => {
      let off, fired = false;
      off = authM.onAuthStateChanged(auth, (u) => {
        ctx.user = u; fired = true;
        if (off) off();
        res();
      });
      if (fired && off) off();
    });
    return ctx;
  }

  async function signIn() {
    const c = await connect();
    const provider = new c.A.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await c.A.signInWithPopup(c.auth, provider);
    c.user = cred.user;
  }

  async function loadRows() {
    const c = await connect();
    const { collection, query, where, orderBy, limit, getDocs } = c.D;
    const start = state.range === 0 ? "0000-00-00" : shiftDay(-(state.range - 1));
    const snap = await getDocs(query(
      collection(c.db, "visits"),
      where("day", ">=", start),
      orderBy("day", "desc"),
      limit(6000)
    ));
    state.rows = snap.docs.map((d) => {
      const v = d.data() || {};
      let ts = null;
      try { ts = v.ts?.toDate ? v.ts.toDate() : v.ts ? new Date(v.ts) : null; } catch (e) {}
      return {
        id: d.id, day: v.day || "", ts,
        vid: v.vid || "", sid: v.sid || v.vid || d.id,
        newVisitor: !!v.newVisitor,
        device: v.device || "기타", os: v.os || "기타", browser: v.browser || "기타",
        refType: v.refType || "직접 방문", refHost: v.refHost || "",
        region: v.region || "알 수 없음",
        secs: Number(v.secs || 0),
        views: Array.isArray(v.views) ? v.views : [],
      };
    });
  }

  async function refresh() {
    state.err = "";
    try {
      await loadRows();
      const today = dayKST(new Date());
      if (!state.day || !state.rows.some((r) => r.day === state.day)) {
        state.day = state.rows.some((r) => r.day === today) ? today : (state.rows[0]?.day || today);
      }
    } catch (e) {
      state.err = String(e?.message || e);
    }
    render();
  }

  async function purge() {
    const keep = 180;
    if (!confirm(`${keep}일보다 오래된 방문 기록을 지웁니다. 계속할까요?`)) return;
    const c = await connect();
    const { collection, query, where, orderBy, limit, getDocs, doc, deleteDoc } = c.D;
    const cutoff = shiftDay(-keep);
    let total = 0;
    for (let round = 0; round < 12; round++) {
      const snap = await getDocs(query(
        collection(c.db, "visits"), where("day", "<", cutoff), orderBy("day"), limit(200)
      ));
      if (snap.empty) break;
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(c.db, "visits", d.id))));
      total += snap.size;
      if (snap.size < 200) break;
    }
    alert(`${total.toLocaleString()}건을 정리했습니다.`);
    refresh();
  }

  /* ---------- 집계 ---------- */
  function summarize(rows) {
    const byDay = new Map();
    const firstDayOf = new Map();     // vid -> 처음 본 날
    const daysOf = new Map();         // vid -> 방문한 날 수

    for (const r of [...rows].sort((a, b) => (a.day < b.day ? -1 : 1))) {
      if (!byDay.has(r.day)) {
        byDay.set(r.day, { day: r.day, views: 0, vids: new Set(), sids: new Set(), newV: new Set(), secs: [] });
      }
      const d = byDay.get(r.day);
      d.views++;
      d.vids.add(r.vid);
      d.sids.add(r.sid);
      if (r.secs > 0) d.secs.push(r.secs);
      if (!firstDayOf.has(r.vid)) { firstDayOf.set(r.vid, r.day); daysOf.set(r.vid, new Set()); }
      daysOf.get(r.vid).add(r.day);
      if (firstDayOf.get(r.vid) === r.day) d.newV.add(r.vid);
    }
    return { byDay, firstDayOf, daysOf };
  }

  // 같은 사람이 한 번 앉아서 본 것을 하나로 묶는다
  function sessions(rows, agg) {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.sid)) {
        map.set(r.sid, {
          sid: r.sid, vid: r.vid, day: r.day, first: r.ts, last: r.ts, pages: 0,
          secs: 0, views: new Set(), device: r.device, os: r.os,
          browser: r.browser, refType: r.refType, refHost: r.refHost, region: r.region,
        });
      }
      const s = map.get(r.sid);
      s.pages++;
      s.secs = Math.max(s.secs, r.secs);
      r.views.forEach((v) => s.views.add(v));
      if (r.ts && (!s.first || r.ts < s.first)) s.first = r.ts;
      if (r.ts && (!s.last || r.ts > s.last)) s.last = r.ts;
    }
    return [...map.values()]
      .map((s) => ({ ...s, visitNo: agg.daysOf.get(s.vid)?.size || 1, isNew: agg.firstDayOf.get(s.vid) === s.day }))
      .sort((a, b) => (b.first?.getTime() || 0) - (a.first?.getTime() || 0));
  }

  const countBy = (rows, key) => {
    const m = new Map();
    for (const r of rows) m.set(r[key], (m.get(r[key]) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  /* ---------- 조각들 ---------- */
  function kpi(k, v, sub, cls) {
    return $$("div", { class: "kpi" },
      $$("div", { class: "k" }, k),
      $$("div", { class: "v" }, v),
      sub ? $$("div", { class: "s " + (cls || "") }, sub) : null);
  }

  function rankCard(title, pairs, note) {
    const max = Math.max(1, ...pairs.map((p) => p[1]));
    const total = pairs.reduce((s, p) => s + p[1], 0) || 1;
    return $$("div", { class: "st-card" },
      $$("h3", {}, title, note ? $$("span", { class: "note" }, note) : null),
      pairs.length
        ? $$("div", { class: "rank" }, pairs.slice(0, 10).map(([lbl, n]) =>
            $$("div", { class: "r" },
              $$("div", { class: "lbl" }, lbl || "(없음)"),
              $$("div", { class: "n" }, n.toLocaleString() + " · " + Math.round(n / total * 100) + "%"),
              $$("div", { class: "track" }, $$("div", { class: "fill", style: `width:${n / max * 100}%` })))))
        : $$("div", { class: "st-empty" }, "기록이 없습니다"));
  }

  /* ---------- 안내 화면 ---------- */
  function setupView(msg) {
    const email = getContent()?.contact?.email || "내구글계정@gmail.com";
    const rules = RULES.replace("__EMAIL__", email);
    const box = $$("pre", {}, rules);
    return $$("div", { class: "st-wrap" }, $$("div", { class: "st-setup" },
      $$("h2", {}, "방문 통계 켜기 — 5분 설정"),
      msg ? $$("div", { class: "st-err" }, msg) : null,
      $$("p", {}, "GitHub Pages 는 서버가 없어서 방문 기록을 담아 둘 곳이 하나 필요합니다. " +
        "구글의 Firebase 를 쓰면 무료 한도(하루 2만 건 쓰기) 안에서 충분히 돌아갑니다. " +
        "아래를 한 번만 해 두면 그다음부터는 이 화면에서 바로 보입니다."),
      $$("ol", {},
        $$("li", {}, $$("a", { href: "https://console.firebase.google.com/", target: "_blank", rel: "noopener" }, "Firebase 콘솔"),
          " 에서 ", $$("b", {}, "프로젝트 만들기"), " — 이름은 아무거나(예: ", $$("code", {}, "choijihwan-portfolio"), "). 애널리틱스는 꺼도 됩니다."),
        $$("li", {}, $$("b", {}, "빌드 → Firestore Database → 데이터베이스 만들기"), " — 위치는 ", $$("code", {}, "asia-northeast3 (서울)"), ", 모드는 ", $$("b", {}, "프로덕션 모드"), "."),
        $$("li", {}, $$("b", {}, "Firestore → 규칙"), " 탭에 아래를 통째로 붙여넣고 ", $$("b", {}, "게시"), ".",
          box,
          $$("button", { class: "btn btn-sm", onclick: (e) => {
            navigator.clipboard.writeText(rules).then(() => { e.target.textContent = "복사됨"; setTimeout(() => (e.target.textContent = "규칙 복사"), 1500); });
          } }, "규칙 복사"),
          $$("div", { class: "hint", style: "font-size:11.5px; color:var(--faint); margin-top:8px" },
            `이메일은 통계를 볼 구글 계정으로 맞추세요 (지금은 ${email}).`)),
        $$("li", {}, $$("b", {}, "빌드 → Authentication → 시작하기 → Google"), " 사용 설정. 그리고 ",
          $$("b", {}, "설정 → 승인된 도메인"), " 에 ", $$("code", {}, "geato7.github.io"), " 를 추가."),
        $$("li", {}, $$("b", {}, "프로젝트 설정(⚙) → 내 앱 → 웹 앱(</>) 추가"), " 후 나오는 ",
          $$("code", {}, "firebaseConfig"), " 에서 ", $$("code", {}, "projectId"), " 와 ", $$("code", {}, "apiKey"), " 두 개만 아래에 넣습니다."),
        $$("li", {}, "넣고 ", $$("b", {}, "[사이트에 반영]"), " 을 누르면 끝. 20초쯤 뒤부터 방문이 쌓입니다.")),
      cfgFields(),
      $$("p", { style: "font-size:12px; color:var(--faint); margin:14px 0 0" },
        "apiKey 는 비밀번호가 아니라 프로젝트를 가리키는 주소에 가깝습니다. 사이트에 그대로 실려도 됩니다 — " +
        "실제 접근 권한은 위의 보안 규칙이 정합니다.")));
  }

  // 설정 입력칸 + 저장 버튼.
  // 저장을 안 하면 값이 이 브라우저 안에만 있다가 새로고침 때 사라지므로,
  // 저장 버튼을 입력칸 바로 아래에 둔다 (상단 [사이트에 반영] 과 같은 동작).
  function cfgFields() {
    const a = getContent().site.analytics || (getContent().site.analytics = { projectId: "", apiKey: "" });
    const mk = (label, key, ph) => {
      const inp = $$("input", { type: "text", placeholder: ph });
      inp.value = a[key] || "";
      inp.addEventListener("input", () => {
        a[key] = inp.value.trim();
        window.__statsCfgChanged?.();
        warn.style.display = cfgOf() ? "" : "none";
      });
      return $$("div", { class: "field" }, $$("label", {}, label), inp);
    };

    const warn = $$("div", { class: "notice", style: "margin:0 0 12px" },
      "아직 저장 전입니다 — 아래 버튼을 눌러야 사이트에 반영됩니다. 그냥 새로고침하면 입력한 값이 사라집니다.");
    warn.style.display = cfgOf() && isDirty?.() ? "" : "none";

    const btn = $$("button", { class: "btn btn-primary", onclick: async () => {
      if (!cfgOf()) { state.err = "projectId 와 apiKey 를 둘 다 넣어야 저장됩니다."; render(); return; }
      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = "저장 중…";
      try { await save?.(); } catch (e) { /* save() 가 상단 상태줄에 이유를 띄운다 */ }
      btn.disabled = false;
      btn.textContent = label;
      state.err = isDirty?.()
        ? "저장이 안 됐습니다. 상단 상태 글씨를 눌러 GitHub 토큰을 등록한 뒤 다시 눌러주세요."
        : "";
      if (!state.err) alert("저장했습니다. 사이트에 수집 스크립트가 붙는 데 20~30초 걸립니다.");
      render();
    } }, "설정 저장하고 통계 열기");

    return $$("div", {},
      $$("div", { class: "cfg" },
        mk("projectId", "projectId", "choijihwan-portfolio"),
        mk("apiKey", "apiKey", "AIza…")),
      warn,
      $$("div", { style: "display:flex; gap:8px; align-items:center; flex-wrap:wrap" },
        btn,
        $$("span", { style: "font-size:12px; color:var(--faint)" },
          "상단 [사이트에 반영] 을 눌러도 똑같습니다")));
  }

  /* ---------- 본 화면 ---------- */
  function draw() {
    if (!cfgOf()) return setupView(state.err);
    if (!ctx || !ctx.user) {
      return $$("div", { class: "st-wrap" }, $$("div", { class: "st-setup" },
        $$("h2", {}, "방문 통계"),
        state.err ? $$("div", { class: "st-err" }, state.err) : null,
        $$("p", {}, "기록은 나만 볼 수 있게 막혀 있습니다. 보안 규칙에 적어 둔 구글 계정으로 로그인하세요."),
        $$("button", { class: "btn btn-primary", onclick: async (e) => {
          e.target.disabled = true;
          try { await signIn(); await refresh(); }
          catch (err) {
            state.err = "로그인 실패: " + (err?.message || err) +
              "  (팝업 차단 / Authentication 의 승인된 도메인에 geato7.github.io 를 넣었는지 확인하세요)";
            render();
          }
        } }, "구글 계정으로 로그인"),
        $$("div", { style: "margin-top:18px" },
          $$("details", {}, $$("summary", { style: "cursor:pointer; font-size:12.5px; color:var(--faint)" }, "설정을 다시 보려면"),
            $$("div", { style: "margin-top:12px" }, cfgFields())))));
    }

    const rows = state.rows || [];
    const agg = summarize(rows);
    const days = [...agg.byDay.values()].sort((a, b) => (a.day < b.day ? -1 : 1));
    const today = dayKST(new Date());
    const yest = shiftDay(-1);
    const d0 = agg.byDay.get(today);
    const d1 = agg.byDay.get(yest);

    const totVisitors = new Set(rows.map((r) => r.vid)).size;
    const allSecs = rows.filter((r) => r.secs > 0).map((r) => r.secs);
    const avgSecs = allSecs.length ? allSecs.reduce((a, b) => a + b, 0) / allSecs.length : 0;
    const newCount = [...agg.firstDayOf.values()].length
      ? [...agg.daysOf.keys()].filter((v) => agg.daysOf.get(v).size === 1).length : 0;

    const t0 = d0 ? d0.vids.size : 0;
    const t1 = d1 ? d1.vids.size : 0;
    const diff = t0 - t1;

    const rangeLabel = state.range === 0 ? "전체 기간" : `최근 ${state.range}일`;

    /* --- 상단 바 --- */
    const seg = $$("div", { class: "st-seg" }, [[7, "7일"], [30, "30일"], [90, "90일"], [0, "전체"]].map(([v, l]) =>
      $$("button", { class: state.range === v ? "on" : "", onclick: () => {
        state.range = v; localStorage.setItem(RANGE_KEY, String(v)); refresh();
      } }, l)));

    const ownerCb = $$("input", { type: "checkbox" });
    ownerCb.checked = localStorage.getItem(OWNER_KEY) === "1";
    ownerCb.addEventListener("change", () => {
      if (ownerCb.checked) localStorage.setItem(OWNER_KEY, "1");
      else localStorage.removeItem(OWNER_KEY);
    });

    const bar = $$("div", { class: "st-bar" },
      $$("div", { class: "grow", style: "font-size:13px; color:var(--dim)" },
        `${rangeLabel} · ${rows.length.toLocaleString()}건 · ${ctx.user.email}`),
      seg,
      $$("label", { class: "st-check", title: "이 브라우저에서 내가 사이트를 열어도 통계에 안 잡힙니다" }, ownerCb, "내 방문 제외"),
      $$("button", { class: "btn btn-sm", onclick: refresh }, "새로고침"),
      $$("button", { class: "btn btn-sm", onclick: purge, title: "180일 지난 기록 삭제" }, "오래된 기록 정리"),
      $$("button", { class: "btn btn-sm", onclick: () => downloadCsv(rows) }, "CSV"),
      $$("button", { class: "btn btn-sm btn-danger", onclick: async () => {
        await ctx.A.signOut(ctx.auth); ctx.user = null; state.rows = null; render();
      } }, "로그아웃"));

    /* --- KPI --- */
    const kpis = $$("div", { class: "st-kpis" },
      kpi("오늘 방문자", t0.toLocaleString() + "명",
        t1 || t0 ? (diff === 0 ? "어제와 같음" : (diff > 0 ? "▲ " : "▼ ") + Math.abs(diff) + "명 (어제 " + t1 + ")") : "어제 기록 없음",
        diff > 0 ? "up" : diff < 0 ? "down" : ""),
      kpi("오늘 조회수", (d0 ? d0.views : 0).toLocaleString() + "회",
        d0 ? (d0.newV.size ? `${d0.newV.size}명은 첫 방문` : "모두 다시 온 사람") : null),
      kpi(rangeLabel + " 방문자", totVisitors.toLocaleString() + "명", `조회 ${rows.length.toLocaleString()}회`),
      kpi("평균 체류 시간", dur(avgSecs), allSecs.length ? `${allSecs.length}건 기준` : "측정된 기록 없음"),
      kpi("다시 찾아온 사람", (totVisitors - newCount).toLocaleString() + "명",
        totVisitors ? `${rangeLabel} 방문자 ${totVisitors}명 중` : null));

    /* --- 날짜별 막대 --- */
    const maxV = Math.max(1, ...days.map((d) => Math.max(d.vids.size, d.views)));
    const chartDays = days.slice(-Math.min(days.length, state.range === 0 ? 60 : state.range));
    const chart = $$("div", { class: "st-card" },
      $$("h3", {}, "날짜별 방문", $$("span", { class: "note" }, "막대를 누르면 그날 접속자를 봅니다")),
      chartDays.length ? [
        $$("div", { class: "chart" }, chartDays.map((d) =>
          $$("div", {
            class: "col" + (d.day === state.day ? " sel" : ""),
            title: `${d.day} (${weekdayOf(d.day)}) — 방문자 ${d.vids.size}명 / 조회 ${d.views}회`,
            onclick: () => { state.day = d.day; render(); },
          },
            $$("div", { class: "bars" },
              $$("div", { class: "b", style: `height:${d.vids.size / maxV * 100}%` }),
              $$("div", { class: "b v2", style: `height:${d.views / maxV * 100}%` }))))),
        $$("div", { class: "chart-x" }, chartDays.map((d, i) =>
          $$("span", {}, chartDays.length <= 14 || i % Math.ceil(chartDays.length / 12) === 0 ? d.day.slice(5) : ""))),
        $$("div", { class: "legend" },
          $$("span", {}, $$("i", { style: "background:var(--accent)" }), "방문자(사람 수)"),
          $$("span", {}, $$("i", { style: "background:#2f4f7a" }), "조회수(페이지 열람)")),
      ] : $$("div", { class: "st-empty" }, "아직 기록이 없습니다"));

    /* --- 날짜별 표 --- */
    const dayTable = $$("div", { class: "st-card" },
      $$("h3", {}, "날짜별 집계"),
      $$("div", { style: "overflow-x:auto" },
        $$("table", { class: "st" },
          $$("thead", {}, $$("tr", {},
            $$("th", {}, "날짜"),
            $$("th", { class: "num" }, "방문자"),
            $$("th", { class: "num" }, "조회수"),
            $$("th", { class: "num" }, "첫 방문"),
            $$("th", { class: "num" }, "평균 체류"))),
          $$("tbody", {}, days.length ? [...days].reverse().map((d) => {
            const avg = d.secs.length ? d.secs.reduce((a, b) => a + b, 0) / d.secs.length : 0;
            return $$("tr", { class: "click" + (d.day === state.day ? " sel" : ""), onclick: () => { state.day = d.day; render(); } },
              $$("td", {}, `${d.day} (${weekdayOf(d.day)})`, d.day === today ? $$("span", { class: "tag new", style: "margin-left:6px" }, "오늘") : null),
              $$("td", { class: "num" }, d.vids.size),
              $$("td", { class: "num" }, d.views),
              $$("td", { class: "num" }, d.newV.size),
              $$("td", { class: "num" }, dur(avg)));
          }) : $$("tr", {}, $$("td", { colspan: "5", class: "st-empty" }, "기록 없음"))))));

    /* --- 선택한 날의 접속자 --- */
    const dayRows = rows.filter((r) => r.day === state.day);
    const ss = sessions(dayRows, agg);
    const visitors = $$("div", { class: "st-card" },
      $$("h3", {}, `${state.day || "—"} 접속자`,
        $$("span", { class: "note" }, `${ss.length}명(세션) · 조회 ${dayRows.length}회`)),
      $$("div", { style: "overflow-x:auto" },
        $$("table", { class: "st" },
          $$("thead", {}, $$("tr", {},
            $$("th", {}, "시각"), $$("th", {}, "구분"), $$("th", {}, "유입"),
            $$("th", {}, "기기"), $$("th", {}, "지역"),
            $$("th", { class: "num" }, "머문 시간"), $$("th", {}, "본 곳"))),
          $$("tbody", {}, ss.length ? ss.map((s) =>
            $$("tr", {},
              $$("td", {}, s.first ? timeKST(s.first) : "—"),
              $$("td", {}, s.isNew
                ? $$("span", { class: "tag new" }, "첫 방문")
                : $$("span", { class: "tag re" }, `재방문 ${s.visitNo}일째`)),
              $$("td", {}, s.refType, s.refHost ? $$("div", { style: "font-size:11px; color:var(--faint)" }, s.refHost) : null),
              $$("td", {}, `${s.device} · ${s.os}`, $$("div", { style: "font-size:11px; color:var(--faint)" }, s.browser)),
              $$("td", {}, s.region),
              $$("td", { class: "num" }, dur(s.secs)),
              $$("td", {}, s.views.size
                ? [...s.views].map((v) => $$("span", { class: "tag" }, labelOf(v)))
                : $$("span", { style: "color:var(--faint)" }, "—")))
          ) : $$("tr", {}, $$("td", { colspan: "7", class: "st-empty" }, "이 날은 접속 기록이 없습니다"))))));

    /* --- 프로젝트별 조회 --- */
    const secCount = new Map();
    for (const r of rows) for (const v of new Set(r.views)) secCount.set(v, (secCount.get(v) || 0) + 1);
    const secPairs = [...secCount.entries()].map(([k, n]) => [labelOf(k), n]).sort((a, b) => b[1] - a[1]);

    return $$("div", { class: "st-wrap" },
      bar,
      state.err ? $$("div", { class: "st-err" }, state.err) : null,
      kpis,
      chart,
      dayTable,
      visitors,
      rankCard("프로젝트별 열람", secPairs, "실제로 화면에 보인 것만"),
      $$("div", { class: "st-two" },
        rankCard("유입 경로", countBy(rows, "refType")),
        rankCard("기기", countBy(rows, "device"))),
      $$("div", { class: "st-two" },
        rankCard("브라우저", countBy(rows, "browser")),
        rankCard("지역 (표준시간대 기준)", countBy(rows, "region"))));
  }

  function downloadCsv(rows) {
    const head = ["날짜", "시각", "방문자ID", "세션ID", "첫방문", "유입", "유입출처", "기기", "OS", "브라우저", "지역", "머문초", "본곳"];
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = rows.map((r) => [
      r.day, r.ts ? timeKST(r.ts) : "", r.vid, r.sid, r.newVisitor ? "Y" : "N",
      r.refType, r.refHost, r.device, r.os, r.browser, r.region, r.secs,
      r.views.map(labelOf).join(" / "),
    ].map(q).join(","));
    const blob = new Blob(["﻿" + [head.map(q).join(","), ...body].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = $$("a", { href: URL.createObjectURL(blob), download: `방문통계_${dayKST(new Date())}.csv` });
    document.body.append(a); a.click(); a.remove();
  }

  /* ---------- 시작 ---------- */
  render();
  return {
    open() {
      render();
      if (cfgOf() && !state.rows && !state.err) {
        connect().then(() => (ctx.user ? refresh() : render())).catch((e) => { state.err = String(e?.message || e); render(); });
      }
    },
    redraw: render,
  };
}
