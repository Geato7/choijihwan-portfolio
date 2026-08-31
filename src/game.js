// 미니게임 「너구리」 — 1982년 오락실 게임에서 영감을 받아 직접 만든 것.
//
// 원작(Sigma Enterprises, Ponpoko)의 ROM·스프라이트·코드는 저작권이 있어 쓰지 않았다.
// 사다리를 타고 층을 오르내리며 과일을 다 먹으면 판이 넘어가고 뱀에 닿으면 죽는다는
// '규칙'만 같고, 그림과 코드는 전부 이 파일에서 새로 만든다. 외부 라이브러리 없음.
//
// content.json 의 site.miniGame 이 false 면 통째로 빠진다.

export function gameCss() {
  return `
  /* ---------- 미니게임 ---------- */
  .play-cta{
    display:flex; align-items:center; gap:16px; flex-wrap:wrap;
    margin:0 0 54px; padding-top:34px; border-top:1px solid var(--border);
  }
  .play-cta .play-note{font-size:13px; color:var(--text-faint); line-height:1.6;}
  #gameOpen{display:inline-flex; align-items:center; gap:9px;}
  #gameOpen .pad{
    width:15px; height:11px; border-radius:2px; border:1.5px solid currentColor;
    position:relative; flex:0 0 auto;
  }
  #gameOpen .pad::before, #gameOpen .pad::after{
    content:""; position:absolute; background:currentColor;
  }
  #gameOpen .pad::before{left:2px; top:4px; width:5px; height:1.5px;}
  #gameOpen .pad::after{left:3.75px; top:2.25px; width:1.5px; height:5px;}

  .game-modal{
    position:fixed; inset:0; z-index:200; display:none;
    align-items:center; justify-content:center; padding:16px;
    background:rgba(0,0,0,.82); backdrop-filter:blur(3px);
  }
  .game-modal.on{display:flex;}
  .game-box{
    background:#0d0f14; border:1px solid #262a33; border-radius:14px;
    width:100%; max-width:640px; overflow:hidden;
    box-shadow:0 24px 70px rgba(0,0,0,.6);
  }
  .game-top{
    display:flex; align-items:center; gap:10px;
    padding:11px 14px; border-bottom:1px solid #262a33; color:#e8ebf0;
  }
  .game-top b{font-size:14px; font-weight:700; letter-spacing:.02em;}
  .game-top .sub{font-size:11.5px; color:#79808e; margin-right:auto;}
  .game-top button{
    background:none; border:1px solid #333844; color:#c3c9d4;
    border-radius:6px; padding:4px 9px; font-size:12px; font-family:inherit; cursor:pointer;
  }
  .game-top button:hover{border-color:#5a6272; color:#fff;}
  .game-screen{display:block; width:100%; height:auto; background:#05070b; image-rendering:pixelated;}
  .game-pad{
    display:none; grid-template-columns:repeat(3,1fr); gap:7px;
    padding:12px 14px 14px; border-top:1px solid #262a33;
  }
  .game-pad button{
    background:#171b23; border:1px solid #2f3540; color:#dfe4ec;
    border-radius:9px; padding:15px 0; font-size:17px; font-family:inherit;
    cursor:pointer; touch-action:manipulation; user-select:none;
  }
  .game-pad button:active{background:#2a3140;}
  .game-pad .sp{visibility:hidden;}
  .game-foot{
    padding:9px 14px 12px; font-size:11.5px; color:#6d7482; line-height:1.7;
    border-top:1px solid #262a33;
  }
  @media (hover:none), (max-width:700px){ .game-pad{display:grid;} }
  @media (max-width:520px){ .play-cta{gap:11px;} }`;
}

export function gameMarkup(site) {
  const label = site?.gameLabel || "잠깐 쉬어가기 — 너구리";
  const note = site?.gameNote || "1982년 오락실 게임에서 영감을 받아 직접 만든 미니게임입니다.";
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return {
    cta: `      <div class="play-cta">
        <button type="button" class="btn btn-outline" id="gameOpen"><span class="pad" aria-hidden="true"></span>${esc(label)}</button>
        <span class="play-note">${esc(note)}</span>
      </div>`,
    modal: `<div class="game-modal" id="gameModal" role="dialog" aria-modal="true" aria-label="미니게임 너구리">
  <div class="game-box">
    <div class="game-top">
      <b>너구리</b>
      <span class="sub">오락실 오마주 · 직접 구현</span>
      <button type="button" id="gameSound" aria-label="소리 켜기 / 끄기">소리 ON</button>
      <button type="button" id="gameClose" aria-label="닫기">닫기 ✕</button>
    </div>
    <canvas class="game-screen" id="gameCanvas" width="320" height="224" aria-label="게임 화면"></canvas>
    <div class="game-pad">
      <button class="sp" type="button" tabindex="-1"></button>
      <button type="button" data-k="up" aria-label="위">▲</button>
      <button class="sp" type="button" tabindex="-1"></button>
      <button type="button" data-k="left" aria-label="왼쪽">◀</button>
      <button type="button" data-k="down" aria-label="아래">▼</button>
      <button type="button" data-k="right" aria-label="오른쪽">▶</button>
    </div>
    <div class="game-foot">방향키로 움직이고 사다리를 오르내립니다. 과일을 다 먹으면 다음 판. 뱀에 닿으면 죽습니다. ESC 로 닫기.</div>
  </div>
</div>`,
  };
}

export function gameScript() {
  return `<script>
/* 미니게임 「너구리」 — 그림과 코드 모두 자체 제작. 외부 라이브러리 없음. */
(function () {
  var modal = document.getElementById("gameModal");
  var cv = document.getElementById("gameCanvas");
  var openBtn = document.getElementById("gameOpen");
  if (!modal || !cv || !openBtn) return;
  var ctx = cv.getContext("2d");
  if (!ctx) return;

  var W = 320, H = 224;
  var BEST_KEY = "pf_neoguri_best";
  var SOUND_KEY = "pf_neoguri_sound";

  /* ================= 도트 그림 ================= */
  var PAL = {
    K: "#191b21", G: "#9aa3b2", D: "#3a3f4b", W: "#ffffff", P: "#f0a3b0",
    S: "#63c162", E: "#2f7d34", R: "#e2585c", Y: "#e8c357", V: "#a877e0",
    B: "#6b4a2f", L: "#3a4150", M: "#525c70"
  };

  // 너구리 — 눈을 가로지르는 검은 띠가 이 그림의 전부다. 흐리면 고양이로 보인다.
  var RACCOON = [
    "...KK......KK...",
    "..KGGK....KGGK..",
    "..KGGKKKKKKGGK..",
    ".KGGGGGGGGGGGGK.",
    ".KGDDDDDDDDDDGK.",
    ".KGDWKDDDDKWDGK.",
    ".KGGDDDWWDDDGGK.",
    "..KGGGDKPPKDGGK.",
    "..KGGGGGGGGGGK..",
    ".DKKGGGGGGGGGGK.",
    "DDKKGGGGGGGGGK..",
    ".DDKGGGGGGGGKK..",
    "..KGGKKKKKKGGK..",
    "..KKK......KKK.."
  ];

  var SNAKE = [
    "................",
    "..SSS.....SSSS..",
    ".SEEES...SEEEEES",
    "SEEEEESSSEEWKEES",
    "SEEEEEEEEEEEEEER",
    ".SEEES...SEEEEES",
    "..SSS.....SSSS..",
    "................"
  ];

  var FRUIT = [
    "...KK...",
    "..KBK...",
    ".KKFFKK.",
    "KFFFFFFK",
    "KFFFFFFK",
    "KFFFFFFK",
    ".KFFFFK.",
    "..KKKK.."
  ];
  var FRUIT_COLORS = ["R", "Y", "V"];

  // 도트맵을 그대로 찍는다. flip 이면 좌우 반전, sc 는 확대 배율.
  function blit(map, x, y, flip, sub, sc) {
    var h = map.length, w = map[0].length, r, c, ch, col;
    sc = sc || 1;
    for (r = 0; r < h; r++) {
      for (c = 0; c < w; c++) {
        ch = map[r].charAt(c);
        if (ch === ".") continue;
        col = PAL[ch === "F" ? sub : ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x + (flip ? w - 1 - c : c) * sc, y + r * sc, sc, sc);
      }
    }
  }

  /* ================= 스테이지 ================= */
  // 층 0 이 맨 아래. 값은 바닥 윗면의 y.
  var FLOOR_Y = [200, 162, 124, 86, 48];
  var FLOOR_T = 5;                 // 바닥 두께
  var PW = 16, PH = 14;            // 너구리 크기
  var EW = 16, EH = 8;             // 뱀 크기

  // ladders: [x, 아래층, 위층]  /  gaps: 층별 [시작x, 끝x] 목록 (뚫린 구간)
  var LAYOUTS = [
    { ladders: [[36,0,1],[160,0,1],[286,0,1],[86,1,2],[236,1,2],[46,2,3],[276,2,3],[120,3,4],[204,3,4]],
      gaps: [[], [[196,222]], [[104,130]], [[236,262]], []] },
    { ladders: [[52,0,1],[268,0,1],[128,1,2],[196,1,2],[36,2,3],[286,2,3],[92,3,4],[232,3,4]],
      gaps: [[], [[92,116]], [[220,246]], [[132,158]], []] },
    { ladders: [[40,0,1],[112,0,1],[208,0,1],[280,0,1],[72,1,2],[248,1,2],[160,2,3],[56,3,4],[264,3,4]],
      gaps: [[], [[150,176]], [[56,80]], [[196,222]], []] }
  ];

  /* ================= 상태 ================= */
  var keys = { left: 0, right: 0, up: 0, down: 0 };
  var running = false, raf = 0, lastT = 0;
  var mode = "title";              // title | play | dead | clear | over
  var stage, score, lives, best, timer, layout, fruits, snakes, hero;

  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { best = 0; }
  var soundOn = true;
  try { soundOn = localStorage.getItem(SOUND_KEY) !== "0"; } catch (e) {}

  /* ================= 소리 ================= */
  var actx = null;
  function beep(freq, dur, type, vol) {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || "square";
      o.frequency.value = freq;
      g.gain.value = vol == null ? 0.05 : vol;
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + dur);
    } catch (e) {}
  }
  function melody(list) {
    if (!soundOn) return;
    for (var i = 0; i < list.length; i++) {
      (function (n, d) { setTimeout(function () { beep(n, 0.12); }, d); })(list[i][0], list[i][1]);
    }
  }

  /* ================= 판 만들기 ================= */
  function inGap(f, x) {
    var g = layout.gaps[f], i;
    for (i = 0; i < g.length; i++) if (x > g[i][0] && x < g[i][1]) return true;
    return false;
  }
  function ladderAt(f, x, dir) {
    var L = layout.ladders, i, l;
    for (i = 0; i < L.length; i++) {
      l = L[i];
      if (Math.abs(l[0] - x) > 6) continue;
      if (dir > 0 && l[1] === f) return l;      // 위로
      if (dir < 0 && l[2] === f) return l;      // 아래로
    }
    return null;
  }

  function buildStage(n) {
    layout = LAYOUTS[(n - 1) % LAYOUTS.length];
    fruits = [];
    var f, i, x, kind = 0;
    for (f = 0; f < 5; f++) {
      for (i = 0; i < 5; i++) {
        x = 30 + i * 65 + (f % 2) * 14;
        if (x > W - 26) continue;
        if (inGap(f, x + 4) || inGap(f, x - 4)) continue;
        if (ladderAt(f, x + 4, 1) || ladderAt(f, x + 4, -1)) continue;
        fruits.push({ x: x, y: FLOOR_Y[f] - 9, kind: FRUIT_COLORS[kind++ % 3], got: false });
      }
    }
    snakes = [];
    var count = Math.min(2 + Math.floor(n / 2), 6);
    var spd = 0.42 + n * 0.06;
    for (i = 0; i < count; i++) {
      snakes.push({
        f: 1 + (i % 4), x: 40 + (i * 71) % (W - 90),
        dir: i % 2 ? 1 : -1, spd: spd, state: "walk", y: 0, target: 0, cool: 60 + i * 30
      });
    }
    for (i = 0; i < snakes.length; i++) snakes[i].y = FLOOR_Y[snakes[i].f] - EH;
    hero = { x: 150, f: 0, y: FLOOR_Y[0] - PH, state: "walk", dir: 1, target: 0, anim: 0, vy: 0 };
    timer = 0;
  }

  function resetPositions() {
    var i;
    hero.x = 150; hero.f = 0; hero.y = FLOOR_Y[0] - PH; hero.state = "walk"; hero.vy = 0;
    for (i = 0; i < snakes.length; i++) {
      snakes[i].f = 1 + (i % 4);
      snakes[i].x = 40 + (i * 71) % (W - 90);
      snakes[i].state = "walk";
      snakes[i].y = FLOOR_Y[snakes[i].f] - EH;
      snakes[i].cool = 90 + i * 40;
    }
  }

  function newGame() {
    stage = 1; score = 0; lives = 3;
    buildStage(stage);
    mode = "play";
  }

  /* ================= 진행 ================= */
  function stepHero() {
    var h = hero, l;
    if (h.state === "walk") {
      if (keys.left) { h.x -= 1.15; h.dir = -1; h.anim++; }
      else if (keys.right) { h.x += 1.15; h.dir = 1; h.anim++; }
      if (h.x < 8) h.x = 8;
      if (h.x > W - 8) h.x = W - 8;

      if (keys.up) {
        l = ladderAt(h.f, h.x, 1);
        if (l) { h.state = "climb"; h.x = l[0]; h.target = l[2]; }
      } else if (keys.down) {
        l = ladderAt(h.f, h.x, -1);
        if (l) { h.state = "climb"; h.x = l[0]; h.target = l[1]; }
      }
      // 뚫린 곳이면 떨어진다
      if (h.state === "walk" && h.f > 0 && inGap(h.f, h.x)) { h.state = "fall"; h.vy = 0; }
      if (h.state === "walk") h.y = FLOOR_Y[h.f] - PH;
    } else if (h.state === "climb") {
      var ty = FLOOR_Y[h.target] - PH;
      var dy = ty - h.y;
      var step = 0.95;
      if (Math.abs(dy) <= step) { h.y = ty; h.f = h.target; h.state = "walk"; }
      else {
        // 도중에 방향을 되돌릴 수 있게 한다
        if (dy < 0 && keys.down) { h.target = h.target === h.f ? h.f : h.f; }
        h.y += dy > 0 ? step : -step;
        h.anim++;
      }
    } else if (h.state === "fall") {
      h.vy += 0.22;
      if (h.vy > 3.4) h.vy = 3.4;
      h.y += h.vy;
      var below = h.f - 1;
      var landY = FLOOR_Y[below] - PH;
      if (h.y >= landY) { h.y = landY; h.f = below; h.state = "walk"; h.vy = 0; beep(180, 0.05, "sine"); }
    }
  }

  function stepSnake(s) {
    if (s.state === "walk") {
      s.x += s.dir * s.spd;
      if (s.x < 10) { s.x = 10; s.dir = 1; }
      if (s.x > W - 26) { s.x = W - 26; s.dir = -1; }
      s.y = FLOOR_Y[s.f] - EH;
      s.cool--;
      if (s.cool <= 0) {
        var up = ladderAt(s.f, s.x + EW / 2, 1);
        var dn = ladderAt(s.f, s.x + EW / 2, -1);
        var pick = null;
        if (up && dn) pick = Math.random() < 0.5 ? up : dn;
        else pick = up || dn;
        if (pick) {
          s.state = "climb";
          s.x = pick[0] - EW / 2;
          s.target = pick[1] === s.f ? pick[2] : pick[1];
          s.cool = 150 + Math.floor(Math.random() * 150);
        }
      }
    } else {
      var ty = FLOOR_Y[s.target] - EH;
      var dy = ty - s.y;
      if (Math.abs(dy) <= 0.7) { s.y = ty; s.f = s.target; s.state = "walk"; }
      else s.y += dy > 0 ? 0.7 : -0.7;
    }
  }

  function hits() {
    var hx = hero.x - PW / 2 + 3, hy = hero.y + 2, hw = PW - 6, hh = PH - 3, i, s;
    for (i = 0; i < snakes.length; i++) {
      s = snakes[i];
      if (hx < s.x + EW - 2 && hx + hw > s.x + 2 && hy < s.y + EH - 1 && hy + hh > s.y + 1) return true;
    }
    return false;
  }

  function update() {
    if (mode !== "play") return;
    timer++;
    stepHero();
    var i;
    for (i = 0; i < snakes.length; i++) stepSnake(snakes[i]);

    // 과일
    var left = 0;
    for (i = 0; i < fruits.length; i++) {
      var f = fruits[i];
      if (f.got) continue;
      left++;
      if (hero.state !== "climb" && hero.f === floorOfY(f.y) &&
          Math.abs((hero.x) - (f.x + 4)) < 9 && Math.abs(hero.y - (f.y - 5)) < 14) {
        f.got = true; score += 100; left--;
        beep(880 + (i % 4) * 110, 0.07);
      }
    }
    if (left === 0) {
      mode = "clear";
      score += 1000;
      melody([[523, 0], [659, 110], [784, 220], [1046, 330]]);
      setTimeout(function () {
        if (mode !== "clear") return;
        stage++; buildStage(stage); mode = "play";
      }, 1100);
      return;
    }

    if (hits()) {
      lives--;
      beep(300, 0.16, "sawtooth", 0.07);
      setTimeout(function () { beep(140, 0.3, "sawtooth", 0.07); }, 130);
      if (lives <= 0) {
        mode = "over";
        if (score > best) {
          best = score;
          try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
        }
      } else {
        mode = "dead";
        setTimeout(function () {
          if (mode !== "dead") return;
          resetPositions(); mode = "play";
        }, 900);
      }
    }
  }

  function floorOfY(y) {
    var i, bestI = 0, bd = 1e9, d;
    for (i = 0; i < 5; i++) { d = Math.abs((FLOOR_Y[i] - 9) - y); if (d < bd) { bd = d; bestI = i; } }
    return bestI;
  }

  /* ================= 그리기 ================= */
  function drawStage() {
    var i, f, g, x;
    // 배경 — 위로 갈수록 살짝 밝은 밤하늘
    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#141a2b");
    grd.addColorStop(1, "#05070b");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // 별
    ctx.fillStyle = "#2b3550";
    for (i = 0; i < 26; i++) ctx.fillRect((i * 79) % W, (i * 43) % 40 + 4, 1, 1);

    // 사다리
    for (i = 0; i < layout.ladders.length; i++) {
      var l = layout.ladders[i];
      var y1 = FLOOR_Y[l[2]], y2 = FLOOR_Y[l[1]];
      ctx.fillStyle = PAL.M;
      ctx.fillRect(l[0] - 6, y1, 2, y2 - y1);
      ctx.fillRect(l[0] + 4, y1, 2, y2 - y1);
      ctx.fillStyle = PAL.L;
      for (var yy = y1 + 4; yy < y2 - 2; yy += 7) ctx.fillRect(l[0] - 6, yy, 12, 2);
    }

    // 바닥
    for (f = 0; f < 5; f++) {
      g = layout.gaps[f];
      var segs = [[0, W]], j, k;
      for (j = 0; j < g.length; j++) {
        var next = [];
        for (k = 0; k < segs.length; k++) {
          var s = segs[k];
          if (g[j][1] <= s[0] || g[j][0] >= s[1]) { next.push(s); continue; }
          if (g[j][0] > s[0]) next.push([s[0], g[j][0]]);
          if (g[j][1] < s[1]) next.push([g[j][1], s[1]]);
        }
        segs = next;
      }
      for (k = 0; k < segs.length; k++) {
        x = segs[k][0];
        var w = segs[k][1] - segs[k][0];
        ctx.fillStyle = "#3b4457";
        ctx.fillRect(x, FLOOR_Y[f], w, FLOOR_T);
        ctx.fillStyle = "#5d6a84";
        ctx.fillRect(x, FLOOR_Y[f], w, 1);
      }
    }

    // 과일
    for (i = 0; i < fruits.length; i++) if (!fruits[i].got) blit(FRUIT, fruits[i].x, fruits[i].y, false, fruits[i].kind);

    // 뱀
    for (i = 0; i < snakes.length; i++) blit(SNAKE, Math.round(snakes[i].x), Math.round(snakes[i].y), snakes[i].dir < 0);

    // 너구리 — 걸을 때 한 칸 들썩인다
    var bob = (hero.state !== "walk" || (keys.left || keys.right)) && Math.floor(hero.anim / 7) % 2 ? 1 : 0;
    if (mode !== "dead") blit(RACCOON, Math.round(hero.x - PW / 2), Math.round(hero.y) - bob, hero.dir < 0);
    else if (Math.floor(timer / 4) % 2) blit(RACCOON, Math.round(hero.x - PW / 2), Math.round(hero.y), hero.dir < 0);
  }

  function text(str, x, y, color, align) {
    ctx.font = "bold 11px 'Noto Sans KR', system-ui, sans-serif";
    ctx.textAlign = align || "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function drawHud() {
    ctx.fillStyle = "rgba(5,7,11,.72)";
    ctx.fillRect(0, 0, W, 16);
    text("점수 " + score, 6, 3, "#e8ebf0");
    text("최고 " + best, W / 2, 3, "#8d95a4", "center");
    text(stage + "판   " + (lives > 0 ? new Array(lives + 1).join("♥") : ""), W - 6, 3, "#e2585c", "right");
  }

  function panel(lines) {
    ctx.fillStyle = "rgba(5,7,11,.84)";
    ctx.fillRect(0, 0, W, H);
    var i, y = H / 2 - lines.length * 11;
    for (i = 0; i < lines.length; i++) {
      ctx.font = (i === 0 ? "bold 17px" : "bold 12px") + " 'Noto Sans KR', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = i === 0 ? "#ffffff" : "#a9b1c0";
      ctx.fillText(lines[i], W / 2, y);
      y += i === 0 ? 30 : 19;
    }
  }

  function draw() {
    if (mode === "title") {
      ctx.fillStyle = "#05070b";
      ctx.fillRect(0, 0, W, H);
      // 패널을 먼저 깔고 그 위에 너구리를 올린다 (반대로 하면 반투명 막에 가린다)
      panel(["너구리", "사다리를 타고 과일을 모두 먹으세요", "뱀에 닿으면 죽습니다",
             "최고 점수 " + best, "", "SPACE 또는 화면을 눌러 시작"]);
      blit(RACCOON, W / 2 - 16, 6, false, null, 2);
      return;
    }
    drawStage();
    drawHud();
    if (mode === "clear") panel([stage + "판 통과!", "+1000점", "", "다음 판 준비 중…"]);
    if (mode === "over") panel(["게임 오버", "점수 " + score, "최고 점수 " + best, "", "SPACE 또는 화면을 눌러 다시"]);
  }

  /* ================= 루프 =================
     속도를 프레임 수가 아니라 '흐른 시간' 에 묶는다. 그래야 120Hz 화면에서
     두 배로 빨라지거나, 화면이 가려져 프레임이 조여질 때 슬로모션이 되지 않는다. */
  var STEP = 1000 / 60, acc = 0;
  function loop(t) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (!lastT) lastT = t;
    var dt = t - lastT;
    lastT = t;
    if (dt > 250) dt = 250;        // 탭에 돌아왔을 때 한꺼번에 밀리지 않게
    acc += dt;
    var guard = 0;
    while (acc >= STEP && guard < 8) { update(); acc -= STEP; guard++; }
    if (guard >= 8) acc = 0;       // 너무 밀렸으면 따라잡기를 포기한다
    draw();
  }

  /* ================= 입력 ================= */
  function press() {
    if (mode === "title" || mode === "over") { newGame(); beep(660, 0.09); }
  }

  function keyName(e) {
    var k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") return "left";
    if (k === "ArrowRight" || k === "d" || k === "D") return "right";
    if (k === "ArrowUp" || k === "w" || k === "W") return "up";
    if (k === "ArrowDown" || k === "s" || k === "S") return "down";
    return null;
  }

  function onKeyDown(e) {
    if (!running) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); press(); return; }
    var n = keyName(e);
    if (n) { keys[n] = 1; e.preventDefault(); }
  }
  function onKeyUp(e) {
    var n = keyName(e);
    if (n) { keys[n] = 0; e.preventDefault(); }
  }

  var padBtns = modal.querySelectorAll(".game-pad button[data-k]");
  for (var pi = 0; pi < padBtns.length; pi++) {
    (function (b) {
      var k = b.getAttribute("data-k");
      var on = function (e) { e.preventDefault(); keys[k] = 1; press(); };
      var off = function (e) { e.preventDefault(); keys[k] = 0; };
      b.addEventListener("pointerdown", on);
      b.addEventListener("pointerup", off);
      b.addEventListener("pointerleave", off);
      b.addEventListener("pointercancel", off);
      b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    })(padBtns[pi]);
  }

  cv.addEventListener("pointerdown", function (e) { e.preventDefault(); press(); });

  /* ================= 열기 / 닫기 ================= */
  function open() {
    modal.classList.add("on");
    document.body.style.overflow = "hidden";
    if (!layout) { stage = 1; score = 0; lives = 3; buildStage(1); }
    mode = "title";
    running = true; lastT = 0; acc = 0;
    cancelAnimationFrame(raf);
    draw();                        // 첫 프레임을 기다리며 빈 화면이 보이지 않게
    raf = requestAnimationFrame(loop);
    document.getElementById("gameClose").focus();
    // 방문 통계를 켜 뒀다면 '미니게임을 열어 봤다'까지 남는다
    try { if (window.__pfTrack) window.__pfTrack("minigame"); } catch (e) {}
  }
  function close() {
    modal.classList.remove("on");
    document.body.style.overflow = "";
    running = false;
    cancelAnimationFrame(raf);
    keys.left = keys.right = keys.up = keys.down = 0;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  document.getElementById("gameClose").addEventListener("click", close);
  modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { keys.left = keys.right = keys.up = keys.down = 0; }
    lastT = 0; acc = 0;
  });

  var sBtn = document.getElementById("gameSound");
  function paintSound() { sBtn.textContent = soundOn ? "소리 ON" : "소리 OFF"; }
  sBtn.addEventListener("click", function () {
    soundOn = !soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? "1" : "0"); } catch (e) {}
    paintSound();
    if (soundOn) beep(720, 0.08);
  });
  paintSound();
})();
</script>`;
}
