// 편지 링크: 스노우볼과 짧은 편지를 링크 하나에 담아 보냄.
// 서버 없이 편지 내용을 주소의 letter= 뒤에 담음 (UTF-8 → base64url).
// 받는 사람이 링크를 열면 봉투가 먼저 나오고, 열면 편지 → 보낸 사람이 고른 스노우볼(명판 문구 포함)

import { sceneInfo } from "./editorial.mjs";
import { PLACES } from "./picker.mjs";
import { sealCrack } from "./sound.mjs";
import { CITIES, DESTINATIONS, findDestination, logText, planRoute, trackingId, waybillHTML, drawRouteMap, progressAt, legSpans, formatHours } from "./logistics.mjs";

// 편지에 쓰는 도시 이름 (예: Paris)과 우표 그림(나라 버튼의 아이콘)
const cityName = (id) => sceneInfo(id).city || PLACES[id]?.landmark || "";
const stampIcon = (id) => document.querySelector(`[data-scene="${id}"] svg`)?.outerHTML || "";
// 소인 날짜: 04 OCT 2026
const postDate = (iso) => {
  const d = iso ? new Date(`${iso}T12:00:00`) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};

const MAX_MESSAGE = 200;
const MAX_HOPS = 10; // 링크가 너무 길어지지 않게 지난 구간은 최근 10개만 들고 감

// 받은 편지에 답장할 때 이어 갈 펜팔 기록: 받은 편지의 구간을 기록 끝에 붙이고 거리·편지 수를 더함
function threadAfter(letter, id) {
  const hop = letter.route && planRoute(id, letter.route);
  return {
    h: hop ? [...letter.history, [id, letter.route]].slice(-MAX_HOPS) : letter.history,
    k: Math.round(letter.km + (hop ? hop.km : 0)),
    n: letter.count + 1,
  };
}
// 기록 구간들을 경로로 (지도에 옅게 그림)
const trailRoutes = (h) => h.map(([a, b]) => planRoute(a, b)).filter(Boolean);

function encode(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decode(code) {
  try {
    const bin = atob(code.replaceAll("-", "+").replaceAll("_", "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== "object") return null;
    const clip = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
    return {
      to: clip(data.t, 20),
      from: clip(data.f, 20),
      message: clip(data.m, MAX_MESSAGE),
      plate: clip(data.p, 20),
      date: /^\d{4}-\d{2}-\d{2}$/.test(data.d) ? data.d : "",
      route: typeof data.r === "string" && DESTINATIONS[data.r] ? data.r : "",
      // 펜팔 기록: 지난 구간들 [스노우볼 장면, 받는 나라], 지난 구간 누적 거리(km), 몇 번째 편지인지
      history: (Array.isArray(data.h) ? data.h : [])
        .filter((hop) => Array.isArray(hop) && CITIES[hop[0]] && DESTINATIONS[hop[1]])
        .slice(-MAX_HOPS)
        .map(([a, b]) => [a, b]),
      km: Number.isFinite(data.k) ? Math.min(Math.max(data.k, 0), 1e7) : 0,
      count: Number.isInteger(data.n) ? Math.min(Math.max(data.n, 1), 9999) : 1,
    };
  } catch {
    return null;
  }
}

// 주소에 담긴 편지 (없으면 null)
export function readLetter() {
  const code = new URLSearchParams(location.search).get("letter");
  return code ? decode(code) : null;
}

let opts = null;
export function setupLetters(options) {
  opts = options;
  document.querySelector(".letter-toggle")?.addEventListener("click", () => openWriter());
}

// ── 편지 쓰기 ────────────────────────────────────────────────

let writer = null;
let thread = null; // 답장 중이면 이어 갈 펜팔 기록
function openWriter(prefill = {}, chain = null) {
  thread = chain;
  if (!writer) {
    writer = document.createElement("div");
    writer.className = "help keep-modal";
    writer.hidden = true;
    writer.setAttribute("role", "dialog");
    writer.setAttribute("aria-modal", "true");
    writer.setAttribute("aria-label", "Send a snowball letter");
    writer.innerHTML = `
      <div class="help-card postcard-card letter-card">
        <p class="airmail-strip" aria-hidden="true"></p>
        <p class="postcard-kicker">A LETTER FOR YOU</p>
        <p class="help-title">Send a snowball letter</p>
        <p class="postcard-sub letter-where"></p>
        <p class="letter-thread" hidden></p>
        <label class="postcard-field"><span>To</span><input name="to" type="text" maxlength="20" placeholder="Jieun" /></label>
        <label class="postcard-field"><span>Your note</span><textarea name="message" rows="5" maxlength="${MAX_MESSAGE}" placeholder="Write something warm…"></textarea><small class="letter-count"></small></label>
        <label class="postcard-field"><span>From</span><input name="from" type="text" maxlength="20" placeholder="Minji" /></label>
        <label class="postcard-field letter-dest"><span>Ship to <em>(their country — the snowball ships from this city)</em></span><input name="dest" type="text" list="dest-countries" autocomplete="off" placeholder="South Korea" /><small class="letter-dest-hint"></small><datalist id="dest-countries"></datalist></label>
        <label class="postcard-field"><span>Nameplate <em>(optional — engraved on the snowball)</em></span><input name="plate" type="text" maxlength="20" placeholder="Our first trip" /></label>
        <p class="letter-done" hidden></p>
        <div class="waybill" hidden></div>
        <div class="help-actions">
          <button type="button" class="help-replay letter-cancel">Close</button>
          <button type="button" class="help-close letter-send">Seal &amp; send ✉</button>
          <button type="button" class="help-close letter-share" hidden>Send the link ✉</button>
        </div>
      </div>`;
    document.body.append(writer);
    const field = (name) => writer.querySelector(`[name="${name}"]`);
    const count = writer.querySelector(".letter-count");
    const showCount = () => (count.textContent = `${field("message").value.length} / ${MAX_MESSAGE}`);
    field("message").addEventListener("input", showCount);
    const close = () => (writer.hidden = true);
    writer.querySelector(".letter-cancel").addEventListener("click", close);
    writer.addEventListener("click", (e) => e.target === writer && close());
    writer.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      e.stopPropagation();
    });
    writer.querySelector(".letter-send").addEventListener("click", async () => {
      const data = {
        t: field("to").value.trim(),
        m: field("message").value.trim(),
        f: field("from").value.trim(),
        p: field("plate").value.trim(),
        d: new Date().toISOString().slice(0, 10),
      };
      // 받는 나라를 적으면 스노우볼이 거쳐 갈 물류 경로를 편지에 함께 담음
      writer.querySelector(".letter-dest-hint").textContent = "";
      if (field("dest").value.trim()) {
        const dest = findDestination(field("dest").value);
        if (!dest) {
          writer.querySelector(".letter-dest-hint").textContent = "We don't ship there yet — pick a country from the list.";
          field("dest").focus();
          return;
        }
        data.r = dest;
      }
      if (!data.m) {
        field("message").focus();
        return;
      }
      const id = opts.currentId();
      if (thread) Object.assign(data, thread); // 답장이면 펜팔 기록을 이어 담음
      const url = `${location.origin}${location.pathname}?landmark=${opts.slugOf(id)}&letter=${encode(data)}`;
      // 메신저는 제목·문장·주소를 이어 붙여 보여 주므로 문장은 짧게 한 줄만 (자세한 건 미리보기 카드가 보여 줌)
      const text = `✉️ A snowball letter from ${data.f || "a friend"}`;
      const done = writer.querySelector(".letter-done");
      const share = async () => {
        if (navigator.share) {
          try {
            await navigator.share({ text, url });
            done.textContent = "Your letter is on its way ✈";
            done.hidden = false;
            return;
          } catch (e) {
            if (e.name === "AbortError") return;
          }
        }
        try {
          await navigator.clipboard.writeText(`${text}\n${url}`);
          done.textContent = "Letter link copied — paste it into an Instagram DM or KakaoTalk.";
        } catch {
          done.textContent = url;
        }
        done.hidden = false;
      };
      const route = data.r && planRoute(id, data.r);
      if (!route) return share();
      if (thread) route.trail = trailRoutes(thread.h);
      // 받는 나라가 있으면: 편지 칸을 접고 운송장에서 스노우볼이 출발하는 장면을 먼저 보여 준 뒤,
      // 도장이 찍히면 링크 보내기 버튼을 띄움 (휴대폰 공유 창이 운송장을 가리지 않게)
      writer.querySelector(".letter-card").classList.add("sealed");
      writer.querySelector(".letter-where").textContent = `Sealed. Your ${cityName(id)} snowball is leaving for ${DESTINATIONS[data.r].city} — send the link when it ships.`;
      const sendBtn = writer.querySelector(".letter-send");
      const shareBtn = writer.querySelector(".letter-share");
      sendBtn.hidden = true;
      shareBtn.onclick = share;
      const log = thread ? { n: thread.n, km: thread.k + route.km } : null;
      showWaybill(route, trackingId(route, `${data.d}|${data.m}|${data.f}`), cityName(id), log, () => {
        shareBtn.hidden = false;
        shareBtn.focus({ preventScroll: true });
      });
    });
  }
  // 받는 나라 적기. 목록에서 고르거나 직접 적음. 비워 두면 운송장 없이 편지만
  const list = writer.querySelector("#dest-countries");
  if (!list.children.length)
    list.innerHTML = Object.values(DESTINATIONS)
      .map((d) => `<option value="${d.country}">${d.city}</option>`)
      .join("");
  writer.querySelector(".letter-dest-hint").textContent = "";
  const bill = writer.querySelector(".waybill");
  bill.hidden = true;
  bill.innerHTML = "";
  writer.querySelector(".letter-card").classList.remove("sealed");
  writer.querySelector(".letter-send").hidden = false;
  writer.querySelector(".letter-share").hidden = true;
  writer.querySelector(".letter-where").textContent = `Tuck a note into this ${cityName(opts.currentId())} snowball. They'll peel the wax seal before they read it.`;
  // 답장이면 지금까지의 펜팔 기록을 보여 주고, 받는 나라를 적으면 그 항로가 기록에 이어짐
  const threadLine = writer.querySelector(".letter-thread");
  threadLine.hidden = !thread;
  if (thread)
    threadLine.textContent = `Reply · letter #${thread.n} between you two · ${thread.k.toLocaleString("en-US")} km so far. Add "Ship to" to extend your route.`;
  for (const [name, value] of Object.entries(prefill)) writer.querySelector(`[name="${name}"]`).value = value;
  writer.querySelector(".letter-count").textContent = `${writer.querySelector('[name="message"]').value.length} / ${MAX_MESSAGE}`;
  writer.querySelector(".letter-done").hidden = true;
  writer.hidden = false;
  writer.querySelector(prefill.to ? '[name="message"]' : '[name="to"]').focus();
}

// 공항마다 하는 일: 출발 공항 적재 → 수출 허브 분류 → 받는 나라 관문 공항 통관
function hubTask(route, k) {
  const s = route.stops[k];
  const A = CITIES[route.from];
  if (s.code === route.hub) return route.customs ? "Customs clearance · import hub" : "Arrived at destination airport";
  if (s.code === A.gateway && route.customs) return "Sorting at export hub";
  return "Loading at origin airport";
}

// 운송장(root) 위에서 스노우볼이 경로를 따라 이동하는 장면을 재생.
// 구간은 거리에 비례해 움직이고, 공항마다 잠깐 멈춰 분류·통관 고리가 퍼짐. 시계는 시뮬레이션 시간.
// 끝나면 지도 위에 도장(data-stamp)이 찍힘. 반환값 skip()은 바로 끝 장면으로
function playRoute(root, route, { status, onDone, endText } = {}) {
  const canvas = root.querySelector(".wb-map");
  const stops = [...root.querySelectorAll(".wb-stop")];
  const name = (s) => (s.kind === "airport" ? s.code : s.name);
  const spans = legSpans(route);
  const DWELL = 750;
  const MOVE = 3600;
  const plan = [];
  spans.forEach(([a, b], i) => {
    plan.push({ kind: "move", leg: i, a, b, ms: Math.max(300, (b - a) * MOVE) });
    if (route.stops[i + 1].kind === "airport") plan.push({ kind: "dwell", k: i + 1, at: b, ms: DWELL });
  });
  const say = (text) => status && (status.textContent = text);
  const setStops = (k) =>
    stops.forEach((li, i) => {
      li.classList.toggle("passed", i < k);
      li.classList.toggle("current", i === k);
    });
  root.classList.remove("stamped");
  root.querySelector(".wb-stamp").textContent = root.dataset.stamp || "";
  let done = false;
  let raf = 0;
  let t0 = null;
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    drawRouteMap(canvas, route, 1).catch(() => {});
    setStops(route.stops.length - 1);
    stops.forEach((li) => li.classList.add("passed"));
    say(endText || `Delivered · ${route.stops.at(-1).name} — lead time ${formatHours(route.hours)}`);
    root.classList.add("stamped");
    onDone?.();
  };
  const frame = (now) => {
    if (done || !root.isConnected) return;
    if (t0 == null) t0 = now;
    let left = now - t0;
    const step = plan.find((p) => (left < p.ms ? true : ((left -= p.ms), false)));
    if (!step) return finish();
    const f = left / step.ms;
    if (step.kind === "move") {
      const e = f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2; // 구간마다 천천히 출발·도착
      const t = step.a + (step.b - step.a) * e;
      const leg = route.legs[step.leg];
      drawRouteMap(canvas, route, t).catch(() => {});
      setStops(step.leg);
      say(`${leg.mode === "air" ? "In flight" : "On the road"} · ${name(leg.from)} → ${name(leg.to)} — T+${formatHours(progressAt(route, t).hours)}`);
    } else {
      const s = route.stops[step.k];
      drawRouteMap(canvas, route, step.at, { pulse: { k: step.k, phase: (f * 2) % 1 } }).catch(() => {});
      setStops(step.k);
      say(`${hubTask(route, step.k)} · ${s.code} ${s.name} — T+${formatHours(s.at + f * (s.out - s.at))}`);
    }
    raf = requestAnimationFrame(frame);
  };
  // 육지 윤곽을 먼저 받아 둔 뒤 출발 (움직임을 줄인 설정이면 바로 끝 장면)
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  drawRouteMap(canvas, route, 0)
    .catch(() => {})
    .then(() => (reduce ? finish() : (raf = requestAnimationFrame(frame))));
  return { skip: finish };
}

// 봉한 뒤 편지 쓰기 창에 운송장을 펼치고, 스노우볼이 허브를 거쳐 가는 장면을 재생. 끝나면 onShipped
function showWaybill(route, id, cargo, log, onShipped) {
  if (!route) return;
  const bill = writer.querySelector(".waybill");
  bill.dataset.stamp = "SHIPPED";
  bill.innerHTML = `${waybillHTML(route, id, cargo, log)}
    <div class="wb-play"><p class="tracking-status" aria-live="polite"></p><button type="button" class="wb-replay">Replay ↻</button></div>`;
  bill.hidden = false;
  const status = bill.querySelector(".tracking-status");
  const endText = `Est. delivery · ${route.stops.at(-1).name} — lead time ${formatHours(route.hours)}`;
  const play = () => playRoute(bill, route, { status, onDone: onShipped, endText });
  bill.querySelector(".wb-replay").addEventListener("click", play);
  bill.scrollIntoView({ block: "nearest", behavior: "smooth" });
  play();
}

// 받은 편지의 "어떻게 왔는지" 배송 추적 화면. first: 편지를 받자마자 봉투보다 먼저 (닫으면 우편함으로),
// 아니면 편지를 읽은 뒤 다시 보기 (닫으면 편지로 돌아감)
function showTracking(letter, id, onClose, { first = false } = {}) {
  const route = planRoute(id, letter.route);
  if (!route) return;
  route.trail = trailRoutes(letter.history);
  const log = letter.count > 1 ? { n: letter.count, km: letter.km + route.km } : null;
  const el = document.createElement("div");
  el.className = "tracking-view";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "How your snowball got here");
  el.innerHTML = `
    <p class="tracking-kicker">SNOWBALL LOGISTICS · TRACKING</p>
    <p class="tracking-title">${first ? "A snowball is on its way to you" : "How your snowball got here"}</p>
    <div class="waybill" data-stamp="DELIVERED">${waybillHTML(route, trackingId(route, `${letter.date}|${letter.message}|${letter.from}`), cityName(id), log)}</div>
    <p class="tracking-status" aria-live="polite"></p>
    <div class="tracking-actions">
      <button type="button" class="tracking-skip">Skip</button>
      <button type="button" class="tracking-replay" hidden>Replay ↻</button>
      <button type="button" class="tracking-go" hidden>${first ? "Open the mailbox ✉" : "Back to the letter ✉"}</button>
    </div>`;
  document.body.append(el);
  document.body.classList.add("tracking-open");
  if (first) document.body.classList.add("letter-open");
  const $ = (sel) => el.querySelector(sel);
  const arrived = () => {
    $(".tracking-skip").hidden = true;
    $(".tracking-replay").hidden = false;
    $(".tracking-go").hidden = false;
    $(".tracking-go").focus();
    navigator.vibrate?.(12);
  };
  const run = () => {
    $(".tracking-skip").hidden = false;
    $(".tracking-replay").hidden = true;
    $(".tracking-go").hidden = true;
    return playRoute($(".waybill"), route, { status: $(".tracking-status"), onDone: arrived });
  };
  let player = run();
  const close = () => {
    player.skip();
    el.remove();
    document.body.classList.remove("tracking-open");
    onClose?.();
  };
  $(".tracking-skip").addEventListener("click", () => player.skip());
  $(".tracking-replay").addEventListener("click", () => (player = run()));
  $(".tracking-go").addEventListener("click", close);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    e.stopPropagation();
  });
}

// 밀랍 도장 SVG: 녹아 퍼진 울퉁불퉁한 가장자리(각도마다 반지름을 조금씩 달리한 매끈한 곡선),
// 눌려 들어간 안쪽 원과 그 둘레의 볼록한 테, 양각으로 찍힌 눈꽃(그늘 획 + 빛 획 + 바탕 획), 윤기
function waxSealSVG() {
  const C = 50;
  const N = 18;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wobble = Math.sin(i * 2.7) * 2.4 + Math.sin(i * 5.3 + 1) * 1.6 + (i % 3 === 0 ? 2.2 : 0);
    const r = 43 + wobble;
    pts.push([C + Math.cos(a) * r, C + Math.sin(a) * r]);
  }
  // 점들을 지나는 매끈한 닫힌 곡선 (캣멀-롬 → 베지어)
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  // 눈꽃 문양: 여섯 갈래와 곁가지
  let flake = "";
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 - Math.PI / 2;
    const x = (r) => (C + Math.cos(a) * r).toFixed(1);
    const y = (r) => (C + Math.sin(a) * r).toFixed(1);
    flake += `M${C} ${C}L${x(19)} ${y(19)}`;
    for (const side of [-1, 1]) {
      const b = a + side * 0.75;
      const bx = C + Math.cos(a) * 11;
      const by = C + Math.sin(a) * 11;
      flake += `M${bx.toFixed(1)} ${by.toFixed(1)}L${(bx + Math.cos(b) * 6).toFixed(1)} ${(by + Math.sin(b) * 6).toFixed(1)}`;
    }
  }
  return `
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <radialGradient id="wax-body" cx="42%" cy="38%" r="65%">
        <stop offset="0" stop-color="#e9cf86" />
        <stop offset="0.45" stop-color="#c9a24e" />
        <stop offset="0.85" stop-color="#9c7530" />
        <stop offset="1" stop-color="#6e5020" />
      </radialGradient>
      <radialGradient id="wax-well" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#c39a48" />
        <stop offset="1" stop-color="#a98235" />
      </radialGradient>
      <linearGradient id="wax-rim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff0c2" stop-opacity="0.9" />
        <stop offset="0.5" stop-color="#d4ae5c" stop-opacity="0.2" />
        <stop offset="1" stop-color="#5e4114" stop-opacity="0.8" />
      </linearGradient>
      <linearGradient id="wax-well-edge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5e4114" stop-opacity="0.75" />
        <stop offset="1" stop-color="#fff0c2" stop-opacity="0.8" />
      </linearGradient>
      <radialGradient id="wax-shine" cx="34%" cy="28%" r="30%">
        <stop offset="0" stop-color="#fffbe8" stop-opacity="0.75" />
        <stop offset="1" stop-color="#fffbe8" stop-opacity="0" />
      </radialGradient>
    </defs>
    <path d="${d}" fill="url(#wax-body)" />
    <path d="${d}" fill="none" stroke="#6e5020" stroke-opacity="0.5" stroke-width="1" />
    <circle cx="${C}" cy="${C}" r="31" fill="none" stroke="url(#wax-rim)" stroke-width="5" />
    <circle cx="${C}" cy="${C}" r="27.5" fill="url(#wax-well)" />
    <circle cx="${C}" cy="${C}" r="27.5" fill="none" stroke="url(#wax-well-edge)" stroke-width="1.6" />
    <circle cx="${C}" cy="${C}" r="23.5" fill="none" stroke="#7a5a22" stroke-opacity="0.35" stroke-width="0.8" stroke-dasharray="1.5 2" />
    <g fill="none" stroke-linecap="round" stroke-width="2.6">
      <path d="${flake}" stroke="#5e4114" stroke-opacity="0.55" transform="translate(0.7 0.9)" />
      <path d="${flake}" stroke="#fff3cc" stroke-opacity="0.85" transform="translate(-0.6 -0.7)" />
      <path d="${flake}" stroke="#c9a24e" />
    </g>
    <path d="${d}" fill="url(#wax-shine)" />
  </svg>`;
}

// ── 받은 편지: 봉투 → 편지 → 스노우볼 ─────────────────────────

// 받은 편지: 배송 경로가 담겨 있으면 추적 화면 먼저, 그다음 봉투 → 편지 → 스노우볼
export function showLetter(letter, id, onDone, options = {}) {
  if (letter.route && planRoute(id, letter.route)) showTracking(letter, id, () => openEnvelope(letter, id, onDone, options), { first: true });
  else openEnvelope(letter, id, onDone, options);
}

function openEnvelope(letter, id, onDone, { snapshot } = {}) {
  const info = sceneInfo(id);
  const color = info.color || "#c8343a";
  const city = cityName(id);
  const date = postDate(letter.date);
  const el = document.createElement("div");
  el.className = "letter-view";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "A snowball letter for you");
  el.style.setProperty("--seal", color);
  el.innerHTML = `
    <p class="letter-arrive">YOU GOT A MAIL!</p>
    <p class="letter-sub"></p>
    <div class="mail-slot" aria-hidden="true"><span></span></div>
    <div class="envelope">
      <span class="envelope-back"></span>
      <span class="letter-paper"></span>
      <span class="envelope-front">
        <span class="envelope-addr"></span>
        <span class="stamp"><span class="stamp-art"></span><span class="stamp-label">SNOWBALL POST</span></span>
        <svg class="postmark" viewBox="0 0 120 70" aria-hidden="true">
          <circle cx="40" cy="35" r="26" fill="none" stroke="currentColor" stroke-width="2" />
          <circle cx="40" cy="35" r="20" fill="none" stroke="currentColor" stroke-width="1" />
          <text x="40" y="32" text-anchor="middle" class="pm-city"></text>
          <text x="40" y="44" text-anchor="middle" class="pm-date"></text>
          <path d="M70 22q6-4 12 0t12 0t12 0t12 0M70 35q6-4 12 0t12 0t12 0t12 0M70 48q6-4 12 0t12 0t12 0t12 0" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      </span>
      <span class="envelope-flap-shadow"></span>
      <span class="envelope-flap"></span>
      <button type="button" class="wax-seal" aria-label="Peel the wax seal to open">${waxSealSVG()}</button>
    </div>
    <button type="button" class="letter-open-btn">click here to claim your mail</button>
    <p class="letter-hint" hidden>(or peel the wax seal)</p>
    <div class="letter-sheet" hidden>
      <p class="sheet-date"></p>
      <figure class="polaroid" hidden>
        <svg class="polaroid-clip" viewBox="0 0 20 52" aria-hidden="true"><path d="M6 46V10a4 4 0 0 1 8 0v30a6 6 0 0 1-12 0V8a8 8 0 0 1 16 0v34" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
        <div class="polaroid-photo"></div>
        <figcaption class="polaroid-caption"></figcaption>
      </figure>
      <p class="paper-to"></p>
      <p class="paper-message"></p>
      <p class="paper-from"></p>
    </div>
    <div class="letter-actions" hidden>
      <button type="button" class="letter-track" hidden>How it got here ✈</button>
      <button type="button" class="letter-go">Shake the snowball ❄</button>
      <button type="button" class="letter-reply">Write back ✉</button>
    </div>`;
  const $ = (sel) => el.querySelector(sel);
  $(".letter-sub").textContent = `from ${letter.from || "a friend"} · a snowball from ${city}`;
  $(".envelope-addr").textContent = `To. ${letter.to || "you"}`;
  $(".stamp-art").innerHTML = stampIcon(id);
  $(".pm-city").textContent = city.toUpperCase().slice(0, 12);
  $(".pm-date").textContent = date;
  $(".sheet-date").textContent = `${date} · ${city}`;
  // 보낸 사람이 고른 스노우볼의 한 장면을 폴라로이드로 편지지 귀퉁이에 꽂아 둠
  if (snapshot) {
    try {
      const shot = snapshot();
      shot.setAttribute("role", "img");
      shot.setAttribute("aria-label", `A snowball from ${city}`);
      $(".polaroid-photo").append(shot);
      $(".polaroid-caption").textContent = `${city}, ${new Date(letter.date || Date.now()).getFullYear() || ""}`;
      $(".polaroid").hidden = false;
    } catch {
      // 사진을 못 떠도 편지는 그대로 보여 줌
    }
  }
  $(".paper-to").textContent = `Dear ${letter.to || "you"},`;
  $(".paper-message").textContent = letter.message;
  $(".paper-from").textContent = letter.from ? `With love, ${letter.from}` : "With love";
  document.body.append(el);
  document.body.classList.add("letter-open");

  // 밀랍 도장 떼기: 손가락으로 끌면 도장이 들리며 따라오고, 충분히 끌거나 톡 누르면 떨어져 나가며 봉투가 열림
  const seal = $(".wax-seal");
  let start = null;
  let peeled = false;
  const peel = () => {
    if (peeled) return;
    peeled = true;
    seal.style.transform = "";
    seal.classList.add("peeled");
    sealCrack();
    navigator.vibrate?.([18, 24, 10]);
    setTimeout(open, 180);
  };
  seal.addEventListener("pointerdown", (e) => {
    if (peeled || !delivered) return;
    start = { x: e.clientX, y: e.clientY };
    seal.setPointerCapture(e.pointerId);
    seal.classList.add("lifting");
  });
  seal.addEventListener("pointermove", (e) => {
    if (!start || peeled) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const d = Math.hypot(dx, dy);
    seal.style.transform = `translate(calc(-50% + ${dx * 0.6}px), calc(-50% + ${dy * 0.6}px)) rotate(${dx * 0.4}deg) scale(${1 + Math.min(d, 60) / 300})`;
    if (d > 70) peel();
  });
  const release = () => {
    if (!start || peeled || !delivered) return;
    start = null;
    peel(); // 짧게 누르기만 해도 떼어짐
  };
  seal.addEventListener("pointerup", release);
  seal.addEventListener("pointercancel", () => {
    start = null;
    seal.classList.remove("lifting");
    seal.style.transform = "";
  });
  // 처음엔 투입구만 보이고, 버튼을 누르면 봉투가 투입구에서 떨어져 나옴. 그 뒤 버튼은 "열기"가 됨
  const btn = $(".letter-open-btn");
  let delivered = false;
  const deliver = () => {
    if (delivered) return;
    delivered = true;
    el.classList.add("delivered");
    navigator.vibrate?.(10);
    btn.textContent = "tap the envelope to open it";
    $(".envelope").addEventListener("animationend", () => el.classList.add("landed"), { once: true });
    setTimeout(() => ($(".letter-hint").hidden = false), 2400);
  };
  btn.addEventListener("click", () => (delivered ? peel() : deliver()));
  // 봉투 다른 곳을 눌러도 도장부터 떼어짐
  $(".envelope").addEventListener("click", (e) => delivered && e.target !== seal && !seal.contains(e.target) && peel());

  const open = () => {
    el.classList.add("opened");
    $(".letter-hint").hidden = true;
    $(".letter-open-btn").hidden = true;
    // 봉투 뚜껑이 열리고 종이가 올라온 뒤 편지지를 펼침
    setTimeout(() => {
      $(".letter-sheet").hidden = false;
      $(".letter-actions").hidden = false;
      el.classList.add("unfolded");
    }, 480);
  };
  const finish = () => {
    el.remove();
    document.body.classList.remove("letter-open");
    showReplyFloat(letter.from, threadAfter(letter, id));
    onDone?.();
  };
  $(".letter-go").addEventListener("click", finish);
  // 배송 경로가 담긴 편지면, 다 읽은 뒤에도 어떻게 왔는지 다시 볼 수 있음
  if (letter.route && planRoute(id, letter.route)) {
    $(".letter-track").hidden = false;
    $(".letter-track").addEventListener("click", () => showTracking(letter, id, () => $(".letter-track").focus()));
  }
  $(".letter-reply").addEventListener("click", () => {
    finish();
    openWriter({ to: letter.from || "" }, threadAfter(letter, id));
  });
}

// 편지를 받은 사람의 스노우볼 화면에 계속 떠 있는 답장 버튼 → 자기가 고른 나라로 답장 스노우볼을 보내는 펜팔 루프
function showReplyFloat(from, chain) {
  if (document.querySelector(".reply-float")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "reply-float";
  btn.textContent = from ? `✉️ Write back to ${from}` : "✉️ Send a snowball back";
  // 한 번 누르면 사라짐 (편지 쓰기 창의 보내기 버튼을 가리지 않게)
  btn.addEventListener("click", () => {
    btn.remove();
    openWriter({ to: from || "" }, chain);
  });
  document.body.append(btn);
}
