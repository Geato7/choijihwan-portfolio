// 방문 통계 수집기 — content.json 의 site.analytics 에 projectId / apiKey 가
// 들어 있을 때만 index.html 에 심어진다. 값이 비어 있으면 아무것도 안 넣는다.
//
// 무엇을 남기나: 날짜, 브라우저마다 무작위로 만든 익명 ID, 기기/브라우저/OS,
// 유입 경로(어느 사이트에서 왔는지), 표준시간대로 짐작한 지역, 머문 시간,
// 어떤 프로젝트를 봤는지.
// 무엇을 안 남기나: IP 주소, 이름, 이메일 등 사람을 특정할 수 있는 값.
//
// 저장 위치는 Firebase Firestore 의 visits 컬렉션. 보는 곳은 /admin/ 의 [방문 통계].

// 표준시간대 -> 사람이 읽는 지역 이름. 목록에 없으면 표준시간대 앞부분을 쓴다.
const TZ_REGIONS = {
  "Asia/Seoul": "대한민국",
  "Asia/Tokyo": "일본",
  "Asia/Shanghai": "중국",
  "Asia/Chongqing": "중국",
  "Asia/Hong_Kong": "홍콩",
  "Asia/Taipei": "대만",
  "Asia/Singapore": "싱가포르",
  "Asia/Bangkok": "태국",
  "Asia/Jakarta": "인도네시아",
  "Asia/Manila": "필리핀",
  "Asia/Ho_Chi_Minh": "베트남",
  "Asia/Kolkata": "인도",
  "Asia/Calcutta": "인도",
  "Asia/Dubai": "UAE",
  "Australia/Sydney": "호주",
  "Australia/Melbourne": "호주",
  "Pacific/Auckland": "뉴질랜드",
  "America/New_York": "미국(동부)",
  "America/Chicago": "미국(중부)",
  "America/Denver": "미국(산악)",
  "America/Phoenix": "미국(애리조나)",
  "America/Los_Angeles": "미국(서부)",
  "America/Anchorage": "미국(알래스카)",
  "Pacific/Honolulu": "미국(하와이)",
  "America/Toronto": "캐나다",
  "America/Vancouver": "캐나다",
  "America/Sao_Paulo": "브라질",
  "America/Mexico_City": "멕시코",
  "Europe/London": "영국",
  "Europe/Dublin": "아일랜드",
  "Europe/Paris": "프랑스",
  "Europe/Berlin": "독일",
  "Europe/Madrid": "스페인",
  "Europe/Rome": "이탈리아",
  "Europe/Amsterdam": "네덜란드",
  "Europe/Stockholm": "스웨덴",
  "Europe/Warsaw": "폴란드",
  "Europe/Moscow": "러시아",
  "Europe/Istanbul": "튀르키예",
  "Africa/Cairo": "이집트",
  "Africa/Johannesburg": "남아공",
};

export function analyticsScript(analytics) {
  const projectId = String(analytics?.projectId || "").trim();
  const apiKey = String(analytics?.apiKey || "").trim();
  if (!projectId || !apiKey) return "";

  // 문자열 안에 </script> 가 있으면 브라우저가 스크립트를 거기서 끊는다
  const lit = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

  return `<script>
/* 방문 통계 — 개인정보(IP·이름·이메일)는 저장하지 않습니다.
   끄려면 content.json 의 site.analytics 를 비우면 됩니다. */
(function () {
  var PID = ${lit(projectId)}, KEY = ${lit(apiKey)};
  var TZ = ${lit(TZ_REGIONS)};

  try {
    if (window.top !== window.self) return;                 // 편집기 미리보기(iframe)
    var host = location.hostname;
    if (!host || host === "localhost" || host === "127.0.0.1") return;
    if (navigator.webdriver) return;                        // 자동화 브라우저
    if (localStorage.getItem("pf_owner") === "1") return;   // 내 방문은 집계 제외
  } catch (e) { return; }

  var BASE = "https://firestore.googleapis.com/v1/projects/" + PID + "/databases/(default)/documents/visits";
  var ua = navigator.userAgent || "";

  function rid(n) {
    var s = "", c = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < n; i++) s += c.charAt(Math.floor(Math.random() * c.length));
    return s;
  }
  function get(kind, k) { try { return window[kind].getItem(k); } catch (e) { return null; } }
  function set(kind, k, v) { try { window[kind].setItem(k, v); } catch (e) {} }
  function S(v) { return { stringValue: String(v == null ? "" : v).slice(0, 200) }; }

  // 하루의 경계는 한국 시간으로 자른다 (sv-SE 로케일이 YYYY-MM-DD 형태를 준다)
  function dayKST(d) {
    try { return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(d); }
    catch (e) { return new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10); }
  }

  var vid = get("localStorage", "pf_vid");
  var isNew = !vid;
  if (!vid) { vid = rid(12); set("localStorage", "pf_vid", vid); }
  var sid = get("sessionStorage", "pf_sid");
  var isNewSession = !sid;
  if (!sid) { sid = rid(10); set("sessionStorage", "pf_sid", sid); }

  var isTablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  var isPhone = /Android|iPhone|iPod|Windows Phone/i.test(ua);
  var device = isTablet ? "태블릿" : isPhone ? "모바일" : "PC";

  var os = /Windows NT/.test(ua) ? "Windows"
    : /iPhone|iPad|iPod/.test(ua) ? "iOS"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Android/.test(ua) ? "Android"
    : /Linux|X11/.test(ua) ? "Linux" : "기타";

  // 인앱 브라우저를 먼저 걸러야 한다 — 대개 UA 에 Chrome/Safari 를 같이 달고 온다
  var browser = /KAKAOTALK/i.test(ua) ? "카카오톡 인앱"
    : /NAVER\\(inapp/i.test(ua) ? "네이버 인앱"
    : /Whale/i.test(ua) ? "웨일"
    : /FBAN|FBAV|Instagram|Line\\//i.test(ua) ? "SNS 인앱"
    : /Edg\\//.test(ua) ? "Edge"
    : /OPR\\/|Opera/.test(ua) ? "Opera"
    : /SamsungBrowser/.test(ua) ? "삼성 인터넷"
    : /Firefox\\//.test(ua) ? "Firefox"
    : /Chrome\\//.test(ua) ? "Chrome"
    : /Safari\\//.test(ua) ? "Safari" : "기타";

  var refHost = "";
  try {
    if (document.referrer) refHost = new URL(document.referrer).hostname.replace(/^www\\./, "");
  } catch (e) {}
  if (refHost === location.hostname) refHost = "";          // 사이트 안에서의 이동

  var refType = !refHost ? (browser.indexOf("인앱") > -1 ? "메신저·SNS 링크" : "직접 방문")
    : /(^|\\.)google\\./.test(refHost) ? "구글 검색"
    : /naver\\./.test(refHost) ? "네이버"
    : /daum\\.|kakao|kko\\./.test(refHost) ? "다음·카카오"
    : /bing\\.|duckduckgo|yandex|yahoo/.test(refHost) ? "기타 검색엔진"
    : /linkedin/.test(refHost) ? "링크드인"
    : /facebook|instagram|threads|t\\.co$|twitter|x\\.com|discord|reddit/.test(refHost) ? "SNS"
    : /jobkorea|saramin|wanted|jumpit|programmers|rocketpunch|catch\\.|incruit|albamon/.test(refHost) ? "채용 사이트"
    : /github/.test(refHost) ? "GitHub"
    : /mail\\.|outlook|gmail|notion/.test(refHost) ? "메일·문서 링크"
    : "기타 사이트";

  var tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var region = TZ[tz] || (tz ? tz.split("/")[0] : "알 수 없음");

  var docId = rid(20);
  var now = new Date();
  var payload = {
    day: S(dayKST(now)),
    ts: { timestampValue: now.toISOString() },
    vid: S(vid), sid: S(sid),
    newVisitor: { booleanValue: !!isNew },
    newSession: { booleanValue: !!isNewSession },
    device: S(device), os: S(os), browser: S(browser),
    refHost: S(refHost), refType: S(refType),
    region: S(region), tz: S(tz),
    lang: S(navigator.language || ""),
    screen: S((screen.width || 0) + "×" + (screen.height || 0)),
    path: S(location.pathname),
    secs: { integerValue: "0" },
    views: { arrayValue: { values: [] } }
  };

  var alive = false;
  try {
    fetch(BASE + "?documentId=" + docId + "&key=" + KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: payload })
    }).then(function (r) { alive = r.ok; }).catch(function () {});
  } catch (e) { return; }

  /* ---- 어떤 구역을 실제로 봤는지 ---- */
  var seen = [];
  try {
    var io = new IntersectionObserver(function (es) {
      for (var i = 0; i < es.length; i++) {
        if (!es[i].isIntersecting) continue;
        var id = es[i].target.id;
        if (id && seen.indexOf(id) === -1 && seen.length < 40) seen.push(id);
      }
    }, { threshold: 0.35 });
    var nodes = document.querySelectorAll("main section[id], main footer[id]");
    for (var i = 0; i < nodes.length; i++) io.observe(nodes[i]);
  } catch (e) {}

  /* ---- 머문 시간 — 탭이 화면에 보이는 동안만 센다 ---- */
  var acc = 0, mark = Date.now(), lastSent = -1, sends = 0;
  function tick() {
    if (document.visibilityState === "visible") acc += Date.now() - mark;
    mark = Date.now();
  }
  function flush(force) {
    tick();
    if (!alive || sends > 30) return;
    var secs = Math.min(3600, Math.round(acc / 1000));
    if (secs <= lastSent) return;
    if (!force && secs - Math.max(lastSent, 0) < 20) return;
    lastSent = secs; sends++;

    var vals = [];
    for (var i = 0; i < seen.length; i++) vals.push({ stringValue: seen[i] });
    try {
      fetch(BASE + "/" + docId + "?key=" + KEY +
            "&updateMask.fieldPaths=secs&updateMask.fieldPaths=views", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: {
          secs: { integerValue: String(secs) },
          views: { arrayValue: { values: vals } }
        } }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  // 사이트 안의 사건(미니게임을 열었다 같은 것)도 '본 곳' 으로 남길 수 있게 열어 둔다
  window.__pfTrack = function (tag) {
    if (!tag || seen.indexOf(tag) > -1 || seen.length >= 40) return;
    seen.push(String(tag).slice(0, 40));
    flush(true);
  };

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush(true); else mark = Date.now();
  });
  window.addEventListener("pagehide", function () { flush(true); });
  setInterval(function () { if (document.visibilityState === "visible") flush(false); }, 30000);
})();
</script>`;
}
