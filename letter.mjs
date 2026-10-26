import { sceneInfo } from "./editorial.mjs";
import { PLACES } from "./picker.mjs";
import { sealCrack } from "./sound.mjs";
import { goalProgressText, goalStatus, openShipments, recordShipment, simNow } from "./shipments.mjs";
import { CITIES, DESTINATIONS, SERVICES, compareServices, findDestination, logText, planRoute, trackingId, waybillHTML, drawRouteMap, progressAt, legSpans, formatHours, phaseAt, MOVING } from "./logistics.mjs";

const cityName = (id) => sceneInfo(id).city || PLACES[id]?.landmark || "";
const stampIcon = (id) => document.querySelector(`[data-scene="${id}"] svg`)?.outerHTML || "";
const postDate = (iso) => {
  const d = iso ? new Date(`${iso}T12:00:00`) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};

const MAX_MESSAGE = 200;
const MAX_HOPS = 10;

function threadAfter(letter, id) {
  const hop = letter.route && routeOf(letter, id);
  return {
    h: hop ? [...letter.history, [id, letter.route]].slice(-MAX_HOPS) : letter.history,
    k: Math.round(letter.km + (hop ? hop.km : 0)),
    c: Math.round((letter.co2 + (hop ? hop.co2 : 0)) * 100) / 100,
    n: letter.count + 1,
  };
}
const routeOf = (letter, id) => planRoute(id, letter.route, letter.service, { wait: letter.wait });
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
      history: (Array.isArray(data.h) ? data.h : [])
        .filter((hop) => Array.isArray(hop) && CITIES[hop[0]] && DESTINATIONS[hop[1]])
        .slice(-MAX_HOPS)
        .map(([a, b]) => [a, b]),
      km: Number.isFinite(data.k) ? Math.min(Math.max(data.k, 0), 1e7) : 0,
      count: Number.isInteger(data.n) ? Math.min(Math.max(data.n, 1), 9999) : 1,
      co2: Number.isFinite(data.c) ? Math.min(Math.max(data.c, 0), 1e5) : 0,
      service: SERVICES[data.s] ? data.s : "s",
      wait: Number.isFinite(data.w) ? Math.min(Math.max(data.w, 0), 168) : null,
    };
  } catch {
    return null;
  }
}

export function readLetter() {
  const code = new URLSearchParams(location.search).get("letter");
  return code ? decode(code) : null;
}

let opts = null;
export function setupLetters(options) {
  opts = options;
  document.querySelector(".shipments-toggle")?.addEventListener("click", openMyShipments);
  document.querySelector(".letter-toggle")?.addEventListener("click", () => openWriter());
}

export function openMyShipments() {
  if (writer) writer.hidden = true;
  openShipments(opts.currentId(), (rec, back) => showShipment(rec, back));
}

let writer = null;
let thread = null;
let service = "s";
let shownDest = null;

function destError(text) {
  if (!String(text).trim()) return "받는 나라를 적어 주세요.";
  const dest = findDestination(text);
  if (!dest) return "아직 못 가는 나라예요. 목록에서 골라 주세요.";
  const home = CITIES[opts.currentId()];
  if (home && dest === home.country) return "이 스노우볼이 있는 나라예요. 다른 나라를 골라 주세요.";
  return "";
}

function showGoal(mode = null) {
  const line = writer.querySelector(".letter-goal");
  const st = goalStatus(mode);
  line.hidden = false;
  line.classList.toggle("won", st.done.length > 0);
  const next = st.goal ? `목표 ${st.level + 1}/${st.total} · ${st.goal.title} (${goalProgressText(st)})` : "모든 목표 달성!";
  line.textContent = st.done.length ? `달성! ${st.done.join(" · ")} · 다음: ${st.goal ? st.goal.title : "없음"}` : next;
}

function renderShipping() {
  const box = writer.querySelector(".ship");
  const dest = findDestination(writer.querySelector('[name="dest"]').value);
  const id = opts.currentId();
  shownDest = dest;
  const value = writer.querySelector('[name="dest"]').value;
  writer.querySelector(".letter-dest-hint").textContent = dest ? destError(value) : "";
  const all = dest && !destError(value) ? compareServices(id, dest, simNow()) : null;
  box.hidden = !all || !all.s || !all.s.legs.some((leg) => leg.mode !== "road");
  if (box.hidden) return;
  const max = (key) => Math.max(...Object.values(all).map((r) => r[key]));
  const bar = (v, m) => `<span class="ship-bar"><span style="width:${Math.max(6, (v / m) * 100).toFixed(1)}%"></span></span>`;
  const kg = (v) => (v < 0.1 ? v.toFixed(2) : v.toFixed(1));
  writer.querySelector(".ship-cards").innerHTML = Object.entries(all)
    .map(
      ([k, r]) => `
      <button type="button" role="radio" class="ship-card" data-service="${k}" aria-checked="${k === service}">
        <span class="ship-name">${SERVICES[k].name}</span>
        <span class="ship-desc">${SERVICES[k].desc}</span>
        <span class="ship-kpi"><i>시간</i><b>${formatHours(r.hours)}</b>${bar(r.hours, max("hours"))}</span>
        <span class="ship-kpi"><i>운임</i><b>$${r.cost.toFixed(2)}</b>${bar(r.cost, max("cost"))}</span>
        <span class="ship-kpi"><i>탄소</i><b>${kg(r.co2)}kg</b>${bar(r.co2, max("co2"))}</span>
      </button>`,
    )
    .join("");
  const r = all[service];
  const base = all.s;
  const dep = r.departure ? `${r.departure.label} · ${formatHours(r.departure.wait)} 뒤` : "";
  if (service === "s") {
    writer.querySelector(".ship-compare").textContent = dep;
    return;
  }
  const dh = base.hours - r.hours;
  const time = dh >= 0 ? `${formatHours(dh)} 빠름` : `${formatHours(-dh)} 느림`;
  const cost = r.cost >= base.cost ? `운임 ${(r.cost / base.cost).toFixed(1)}배` : `운임 ${Math.round((1 - r.cost / base.cost) * 100)}% 싸게`;
  const co2 = r.co2 >= base.co2 ? `탄소 +${kg(r.co2 - base.co2)}kg` : `탄소 ${Math.round((1 - r.co2 / base.co2) * 100)}% 적게`;
  writer.querySelector(".ship-compare").textContent = `일반보다 ${time} · ${cost} · ${co2}\n${dep}`;
}
function openWriter(prefill = {}, chain = null) {
  thread = chain;
  if (!writer) {
    writer = document.createElement("div");
    writer.className = "help keep-modal";
    writer.hidden = true;
    writer.setAttribute("role", "dialog");
    writer.setAttribute("aria-modal", "true");
    writer.setAttribute("aria-label", "스노우볼 편지 보내기");
    writer.innerHTML = `
      <div class="help-card postcard-card letter-card">
        <p class="airmail-strip" aria-hidden="true"></p>
        <p class="postcard-kicker">A LETTER FOR YOU</p>
        <p class="help-title">스노우볼 편지 보내기</p>
        <p class="postcard-sub letter-where"></p>
        <p class="letter-thread" hidden></p>
        <p class="letter-goal" hidden></p>
        <label class="postcard-field"><span>받는 사람</span><input name="to" type="text" maxlength="20" placeholder="지은" /></label>
        <label class="postcard-field"><span>편지</span><textarea name="message" rows="5" maxlength="${MAX_MESSAGE}" placeholder="따뜻한 한마디를 적어 보세요"></textarea><small class="letter-count"></small></label>
        <label class="postcard-field"><span>보내는 사람</span><input name="from" type="text" maxlength="20" placeholder="민지" /></label>
        <label class="postcard-field letter-dest"><span>받는 나라</span><input name="dest" type="text" list="dest-countries" autocomplete="off" placeholder="예: 일본" required aria-required="true" /><small class="letter-dest-hint"></small><datalist id="dest-countries"></datalist></label>
        <div class="ship" hidden>
          <p class="ship-title">배송 방식</p>
          <div class="ship-cards" role="radiogroup" aria-label="배송 방식"></div>
          <p class="ship-compare" aria-live="polite"></p>
        </div>
        <label class="postcard-field"><span>명판 <em>(선택)</em></span><input name="plate" type="text" maxlength="20" placeholder="우리의 첫 여행" /></label>
        <p class="letter-done" hidden></p>
        <div class="waybill" hidden></div>
        <div class="help-actions">
          <button type="button" class="help-replay letter-cancel">닫기</button>
          <button type="button" class="help-close letter-send">봉하고 보내기</button>
          <button type="button" class="help-close letter-share" hidden>링크 보내기</button>
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
      const destProblem = destError(field("dest").value);
      if (destProblem) {
        writer.querySelector(".letter-dest-hint").textContent = destProblem;
        field("dest").focus();
        return;
      }
      data.r = findDestination(field("dest").value);
      if (!data.m) {
        field("message").focus();
        return;
      }
      const id = opts.currentId();
      if (thread) Object.assign(data, thread);
      const route = data.r && planRoute(id, data.r, service, { now: simNow() });
      if (route) {
        data.s = service;
        if (route.departure) data.w = Math.round(route.departure.wait * 100) / 100;
      }
      const url = `${location.origin}${location.pathname}?landmark=${opts.slugOf(id)}&letter=${encode(data)}`;
      const text = `A snowball letter from ${data.f || "a friend"}`;
      const done = writer.querySelector(".letter-done");
      const share = async () => {
        if (navigator.share) {
          try {
            await navigator.share({ text, url });
            done.textContent = "편지를 보냈어요";
            done.hidden = false;
            return;
          } catch (e) {
            if (e.name === "AbortError") return;
          }
        }
        try {
          await navigator.clipboard.writeText(`${text}\n${url}`);
          done.textContent = "링크를 복사했어요. 카톡이나 DM에 붙여 넣으세요.";
        } catch {
          done.textContent = url;
        }
        done.hidden = false;
      };
      if (!route) return share();
      if (thread) route.trail = trailRoutes(thread.h);
      writer.querySelector(".letter-card").classList.add("sealed");
      writer.querySelector(".letter-where").textContent = `봉했어요. ${DESTINATIONS[data.r].city}행 출발!`;
      const sendBtn = writer.querySelector(".letter-send");
      const shareBtn = writer.querySelector(".letter-share");
      sendBtn.hidden = true;
      shareBtn.onclick = share;
      const log = thread ? { n: thread.n, km: thread.k + route.km, co2: (thread.c || 0) + route.co2 } : null;
      const trackId = trackingId(route, `${data.d}|${data.m}|${data.f}`);
      recordShipment({ id: trackId, dir: "sent", from: id, to: data.r, s: service, w: data.w ?? 0, at: simNow(), who: data.t });
      showGoal("seal");
      showWaybill(route, trackId, cityName(id), log, () => {
        shareBtn.hidden = false;
        shareBtn.focus({ preventScroll: true });
      });
    });
  }
  if (!writer.dataset.ship) {
    writer.dataset.ship = "1";
    const destInput = writer.querySelector('[name="dest"]');
    const onDest = () => findDestination(destInput.value) !== shownDest && renderShipping();
    destInput.addEventListener("input", onDest);
    destInput.addEventListener("change", onDest);
    writer.querySelector(".ship-cards").addEventListener("click", (e) => {
      const card = e.target.closest(".ship-card");
      if (!card) return;
      service = card.dataset.service;
      renderShipping();
    });
  }
  service = "s";
  const home = CITIES[opts.currentId()]?.country;
  writer.querySelector("#dest-countries").innerHTML = Object.entries(DESTINATIONS)
    .filter(([code]) => code !== home)
    .map(([, d]) => `<option value="${d.country}">${d.city}</option>`)
    .join("");
  renderShipping();
  writer.querySelector(".letter-dest-hint").textContent = "";
  const bill = writer.querySelector(".waybill");
  bill.hidden = true;
  bill.innerHTML = "";
  writer.querySelector(".letter-card").classList.remove("sealed");
  writer.querySelector(".letter-send").hidden = false;
  writer.querySelector(".letter-share").hidden = true;
  writer.querySelector(".letter-where").textContent = `${cityName(opts.currentId())} 스노우볼에 편지를 담아 보내요.`;
  showGoal();
  const threadLine = writer.querySelector(".letter-thread");
  threadLine.hidden = !thread;
  if (thread)
    threadLine.textContent = `답장 · ${thread.n}번째 편지 · 지금까지 함께 ${thread.k.toLocaleString("en-US")}km`;
  for (const [name, value] of Object.entries(prefill)) writer.querySelector(`[name="${name}"]`).value = value;
  writer.querySelector(".letter-count").textContent = `${writer.querySelector('[name="message"]').value.length} / ${MAX_MESSAGE}`;
  writer.querySelector(".letter-done").hidden = true;
  writer.hidden = false;
  writer.querySelector(prefill.to ? '[name="message"]' : '[name="to"]').focus();
}

function hubTask(route, k) {
  const s = route.stops[k];
  const A = CITIES[route.from];
  if (s.code === route.hub) return route.customs ? "통관 중" : "도착 공항";
  if (s.code === A.gateway && route.customs) return "분류 중";
  return "싣는 중";
}

function playRoute(root, route, { status, onDone, endText, until = null } = {}) {
  const canvas = root.querySelector(".wb-map");
  const stops = [...root.querySelectorAll(".wb-stop")];
  const name = (s) => (s.kind === "airport" ? s.code : s.name);
  const spans = legSpans(route);
  const DWELL = 750;
  const MOVE = 3600;
  const now = until != null && until < route.hours ? phaseAt(route, until) : null;
  const plan = [];
  for (const [i, [a, b]] of spans.entries()) {
    if (now && now.t < b) {
      if (now.t > a) plan.push({ kind: "move", leg: i, a, b: now.t, ms: Math.max(300, (now.t - a) * MOVE) });
      break;
    }
    plan.push({ kind: "move", leg: i, a, b, ms: Math.max(300, (b - a) * MOVE) });
    if (now && now.t <= b && now.k === i + 1) {
      plan.push({ kind: "dwell", k: i + 1, at: b, ms: DWELL });
      break;
    }
    if (route.stops[i + 1].kind === "airport") plan.push({ kind: "dwell", k: i + 1, at: b, ms: DWELL });
  }
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
    if (now) {
      drawRouteMap(canvas, route, Math.min(now.t, 0.9999)).catch(() => {});
      setStops(now.k);
      say(endText || now.label);
    } else {
      drawRouteMap(canvas, route, 1).catch(() => {});
      setStops(route.stops.length - 1);
      stops.forEach((li) => li.classList.add("passed"));
      say(endText || `도착 · ${route.stops.at(-1).name} (${formatHours(route.hours)} 걸림)`);
    }
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
      const e = f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
      const t = step.a + (step.b - step.a) * e;
      const leg = route.legs[step.leg];
      drawRouteMap(canvas, route, t).catch(() => {});
      setStops(step.leg);
      say(`${MOVING[leg.mode]} · ${name(leg.from)} → ${name(leg.to)} · +${formatHours(progressAt(route, t).hours)}`);
    } else {
      const s = route.stops[step.k];
      drawRouteMap(canvas, route, step.at, { pulse: { k: step.k, phase: (f * 2) % 1 } }).catch(() => {});
      setStops(step.k);
      const waiting = step.k === 1 && route.departure && route.departure.wait > 0.25 && f > 0.4;
      const task = waiting ? `${route.departure.label} 기다리는 중` : hubTask(route, step.k);
      say(`${task} · ${s.code} · +${formatHours(s.at + f * (s.out - s.at))}`);
    }
    raf = requestAnimationFrame(frame);
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  drawRouteMap(canvas, route, 0)
    .catch(() => {})
    .then(() => (reduce ? finish() : (raf = requestAnimationFrame(frame))));
  return { skip: finish };
}

function showWaybill(route, id, cargo, log, onShipped) {
  if (!route) return;
  const bill = writer.querySelector(".waybill");
  bill.dataset.stamp = "발송";
  bill.innerHTML = `${waybillHTML(route, id, cargo, log)}
    <div class="wb-play"><p class="tracking-status" aria-live="polite"></p><button type="button" class="wb-replay">다시 보기</button></div>
    <button type="button" class="wb-mine" hidden>내 배송에서 보기 →</button>`;
  bill.querySelector(".wb-mine").addEventListener("click", openMyShipments);
  bill.hidden = false;
  const status = bill.querySelector(".tracking-status");
  const endText = `${route.stops.at(-1).name}까지 ${formatHours(route.hours)} 예상`;
  const play = () =>
    playRoute(bill, route, {
      status,
      endText,
      onDone: () => {
        bill.querySelector(".wb-mine").hidden = false;
        onShipped?.();
      },
    });
  bill.querySelector(".wb-replay").addEventListener("click", play);
  bill.scrollIntoView({ block: "nearest", behavior: "smooth" });
  play();
}

function showTracking(letter, id, onClose, { first = false } = {}) {
  const route = routeOf(letter, id);
  if (!route) return;
  route.trail = trailRoutes(letter.history);
  const log = letter.count > 1 ? { n: letter.count, km: letter.km + route.km, co2: letter.co2 + route.co2 } : null;
  if (first) document.body.classList.add("letter-open");
  trackingOverlay({
    route,
    trackId: trackingId(route, `${letter.date}|${letter.message}|${letter.from}`),
    cargo: cityName(id),
    log,
    title: first ? "스노우볼이 오고 있어요" : "이렇게 왔어요",
    goLabel: first ? "우편함 열기" : "편지로 돌아가기",
    onClose,
  });
}

export function showShipment(rec, onClose) {
  const route = planRoute(rec.from, rec.to, rec.s, { wait: rec.w, now: rec.at });
  if (!route) return;
  const elapsed = (simNow() - rec.at) / 3600e3;
  const moving = rec.dir === "sent" && elapsed < route.hours;
  const left = route.hours - elapsed;
  trackingOverlay({
    route,
    trackId: rec.id,
    cargo: cityName(rec.from),
    title: moving ? "지금 어디쯤?" : rec.dir === "sent" ? "도착했어요" : "이렇게 왔어요",
    goLabel: "목록으로",
    stamp: moving ? "배송 중" : "배송 완료",
    until: moving ? elapsed : null,
    endText: moving ? `${phaseAt(route, elapsed).label} · ${formatHours(left)} 뒤 도착` : null,
    onClose,
  });
}

function trackingOverlay({ route, trackId, cargo, log = null, title, goLabel, stamp = "배송 완료", until = null, endText = null, onClose }) {
  const el = document.createElement("div");
  el.className = "tracking-view";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", title);
  el.innerHTML = `
    <p class="tracking-kicker">스노우볼 배송 조회</p>
    <p class="tracking-title"></p>
    <div class="waybill" data-stamp="${stamp}">${waybillHTML(route, trackId, cargo, log)}</div>
    <p class="tracking-status" aria-live="polite"></p>
    <div class="tracking-actions">
      <button type="button" class="tracking-skip">건너뛰기</button>
      <button type="button" class="tracking-replay" hidden>다시 보기</button>
      <button type="button" class="tracking-go" hidden></button>
    </div>`;
  el.querySelector(".tracking-title").textContent = title;
  el.querySelector(".tracking-go").textContent = goLabel;
  document.body.append(el);
  document.body.classList.add("tracking-open");
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
    return playRoute($(".waybill"), route, { status: $(".tracking-status"), onDone: arrived, until, endText });
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

export function showLetter(letter, id, onDone, options = {}) {
  const got = letter.route && routeOf(letter, id);
  if (got)
    recordShipment({
      id: trackingId(got, `${letter.date}|${letter.message}|${letter.from}`),
      dir: "received",
      from: id,
      to: letter.route,
      s: letter.service,
      w: letter.wait ?? 0,
      at: simNow() - got.hours * 3600e3,
      who: letter.from,
    });
  if (got) showTracking(letter, id, () => openEnvelope(letter, id, onDone, options), { first: true });
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
      <button type="button" class="letter-track" hidden>어떻게 왔는지 보기</button>
      <button type="button" class="letter-go">Shake the snowball</button>
      <button type="button" class="letter-reply">Write back</button>
    </div>`;
  const $ = (sel) => el.querySelector(sel);
  $(".letter-sub").textContent = `from ${letter.from || "a friend"} · a snowball from ${city}`;
  $(".envelope-addr").textContent = `To. ${letter.to || "you"}`;
  $(".stamp-art").innerHTML = stampIcon(id);
  $(".pm-city").textContent = city.toUpperCase().slice(0, 12);
  $(".pm-date").textContent = date;
  $(".sheet-date").textContent = `${date} · ${city}`;
  if (snapshot) {
    try {
      const shot = snapshot();
      shot.setAttribute("role", "img");
      shot.setAttribute("aria-label", `A snowball from ${city}`);
      $(".polaroid-photo").append(shot);
      $(".polaroid-caption").textContent = `${city}, ${new Date(letter.date || Date.now()).getFullYear() || ""}`;
      $(".polaroid").hidden = false;
    } catch {
    }
  }
  $(".paper-to").textContent = `Dear ${letter.to || "you"},`;
  $(".paper-message").textContent = letter.message;
  $(".paper-from").textContent = letter.from ? `With love, ${letter.from}` : "With love";
  document.body.append(el);
  document.body.classList.add("letter-open");

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
    peel();
  };
  seal.addEventListener("pointerup", release);
  seal.addEventListener("pointercancel", () => {
    start = null;
    seal.classList.remove("lifting");
    seal.style.transform = "";
  });
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
  $(".envelope").addEventListener("click", (e) => delivered && e.target !== seal && !seal.contains(e.target) && peel());

  const open = () => {
    el.classList.add("opened");
    $(".letter-hint").hidden = true;
    $(".letter-open-btn").hidden = true;
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
  if (letter.route && routeOf(letter, id)) {
    $(".letter-track").hidden = false;
    $(".letter-track").addEventListener("click", () => showTracking(letter, id, () => $(".letter-track").focus()));
  }
  $(".letter-reply").addEventListener("click", () => {
    finish();
    openWriter({ to: letter.from || "" }, threadAfter(letter, id));
  });
}

function showReplyFloat(from, chain) {
  if (document.querySelector(".reply-float")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "reply-float";
  btn.textContent = from ? `Write back to ${from}` : "Send a snowball back";
  btn.addEventListener("click", () => {
    btn.remove();
    openWriter({ to: from || "" }, chain);
  });
  document.body.append(btn);
}
