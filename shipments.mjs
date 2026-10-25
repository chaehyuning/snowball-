// 내 배송 화면: 이 기기에서 보내고 받은 스노우볼을 모아 운영 대시보드처럼 보여 줌.
// 서버가 없어서 기록은 이 브라우저에만 남음 (localStorage, 최근 60건).
// 시간은 실제로 흐르지 않음: 시뮬레이션 시계는 사용자가 턴을 넘길 때만 움직임 (+6h · 하루 · 다음 도착까지).
// 턴을 넘기면 그 사이 출고·통관·도착이 턴 리포트로 나옴. 기다릴 필요 없이 간접 체험만.

import { CITIES, DESTINATIONS, SERVICES, TZ, dispatchWaves, formatHours, phaseAt, planRoute } from "./logistics.mjs";

const KEY = "snowball-shipments";
const CLOCK_KEY = "snowball-sim-clock";

// 시뮬레이션 시계(ms). 처음엔 지금 실제 시각에서 시작하고, 그 뒤로는 턴을 넘길 때만 앞으로 감
let clock = null;
export function simNow() {
  if (clock == null) {
    try {
      clock = Number(localStorage.getItem(CLOCK_KEY)) || null;
    } catch {
      clock = null;
    }
    if (!clock) setClock(Date.now());
  }
  return clock;
}
function setClock(t) {
  clock = t;
  try {
    localStorage.setItem(CLOCK_KEY, String(Math.round(t)));
  } catch {
    // 이번 화면에서만
  }
}
const MAX = 60;

function load() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list.filter((r) => r && CITIES[r.from] && DESTINATIONS[r.to] && SERVICES[r.s]) : [];
  } catch {
    return [];
  }
}

function save(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만
  }
}

// 한 건 기록. rec: { id 운송장 번호, dir "sent"|"received", from 스노우볼 장면, to 받는 나라, s 방식, w 출고 대기, at 보낸 시각(ms), who 상대 이름 }
// 같은 운송장 번호는 한 번만 (받은 편지를 여러 번 열어도)
export function recordShipment(rec) {
  const list = load();
  if (list.some((r) => r.id === rec.id && r.dir === rec.dir)) return;
  list.unshift(rec);
  save(list);
}

export const shipmentCount = () => load().length;

// 한 건의 지금 상태: 경로, 지난 시간, 단계
function stateOf(rec, now) {
  const route = planRoute(rec.from, rec.to, rec.s, { wait: rec.w, now: rec.at });
  if (!route) return null;
  const elapsed = (now - rec.at) / 3600e3;
  const p = rec.dir === "received" ? { phase: "delivered", label: `받음 · ${route.stops.at(-1).name}`, t: 1 } : phaseAt(route, elapsed);
  return { rec, route, elapsed, ...p, progress: rec.dir === "received" ? 1 : Math.min(1, Math.max(0, elapsed / route.hours)) };
}

// 두 시점(경과 시간 h0 → h1) 사이에 이 배송에 일어난 일: 출고, 허브 도착, 통관 완료, 배송 완료
function eventsBetween(st, h0, h1) {
  const { route, rec } = st;
  if (rec.dir !== "sent") return [];
  const out = [];
  const add = (h, text) => h > h0 && h <= h1 && out.push({ h, text, rec, route });
  route.stops.forEach((s, k) => {
    if (k === 0) return;
    const last = k === route.stops.length - 1;
    if (last) return add(s.at, `${s.name} 도착 🎉`);
    add(s.at, `${s.code} 도착`);
    if (k === 1 && route.departure) add(s.out, `${s.code} 출발`);
    else if (route.customs && s.code === route.hub) add(s.out, `${s.code} 통관 완료`);
  });
  return out;
}

// 원형 지표 (SVG). value 0~1
function ring(value, label, sub, color) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  return `
    <figure class="board-ring">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="${r}" class="ring-track" />
        <circle cx="32" cy="32" r="${r}" class="ring-value" style="stroke:${color};stroke-dasharray:${(v * c).toFixed(1)} ${c.toFixed(1)}" />
        <text x="32" y="36" text-anchor="middle">${Math.round(v * 100)}%</text>
      </svg>
      <figcaption><b>${label}</b><span>${sub}</span></figcaption>
    </figure>`;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const leftText = formatHours;

// 칩: 전체 / 운송 중 / 통관 / 도착 / 받은 것
const CHIPS = [
  ["all", "전체"],
  ["transit", "배송 중"],
  ["customs", "통관"],
  ["delivered", "도착"],
  ["received", "받은 것"],
];
const inChip = (st, chip) =>
  chip === "all" ||
  (chip === "received" ? st.rec.dir === "received" : st.rec.dir === "sent" && st.phase === chip);

// 시뮬레이션 시각을 그 도시 시각으로: "10/26(월) 14:00"
function clockText(t, homeId) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("ko-KR", { timeZone: TZ[homeId], weekday: "short", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(t))
      .map((x) => [x.type, x.value]),
  );
  return `${p.month}/${p.day}(${p.weekday}) ${p.hour}:${p.minute}`;
}

// 운송 중인 배송 중 가장 먼저 도착하는 것까지 남은 시간 (없으면 null)
function nextArrival(all) {
  const left = all.filter((s) => s.rec.dir === "sent" && s.phase !== "delivered").map((s) => s.route.hours - s.elapsed);
  return left.length ? Math.min(...left) : null;
}

let board = null;

// 화면 열기. homeId: 지금 보고 있는 스노우볼(오늘 출고 차수를 그 도시 시각으로), onOpen: 한 건을 눌렀을 때
export function openShipments(homeId, onOpen) {
  if (board) return;
  board = document.createElement("div");
  board.className = "board";
  board.setAttribute("role", "dialog");
  board.setAttribute("aria-modal", "true");
  board.setAttribute("aria-label", "내 배송");
  document.body.append(board);
  document.body.classList.add("letter-open");
  let chip = "all";
  let report = null; // 마지막 턴에 일어난 일
  const render = () => {
    const now = simNow();
    const all = load()
      .map((r) => stateOf(r, now))
      .filter(Boolean);
    const sent = all.filter((s) => s.rec.dir === "sent");
    const delivered = all.filter((s) => s.phase === "delivered").length;
    const eco = all.filter((s) => s.rec.s === "e").length;
    const co2 = all.reduce((a, s) => a + s.route.co2, 0);
    // Express로 보냈다면 나왔을 CO₂와 비교한 절감률
    const co2Express = all.reduce((a, s) => a + (planRoute(s.rec.from, s.rec.to, "x", { wait: 0, now: s.rec.at })?.co2 || 0), 0);
    const km = all.reduce((a, s) => a + s.route.km, 0);
    const spend = sent.reduce((a, s) => a + s.route.cost, 0);
    const counts = Object.fromEntries(CHIPS.map(([k]) => [k, all.filter((s) => inChip(s, k)).length]));
    const sentDone = sent.filter((s) => s.phase === "delivered").length;
    const inTransit = sent.length - sentDone;
    const waves = dispatchWaves(homeId, now);
    const city = CITIES[homeId]?.city || "";
    const shown = all.filter((s) => inChip(s, chip));
    board.innerHTML = `
      <div class="board-inner">
        <div class="board-top">
          <button type="button" class="board-back" aria-label="닫기">←</button>
        </div>
        <h2 class="board-title">내 배송</h2>
        <p class="board-big"><b>${all.length}</b>건 <span>배송 중 ${inTransit} · 도착 ${delivered}</span></p>
        ${
          report
            ? `<section class="board-report" aria-live="polite">
          <p class="board-h">이번 턴에 생긴 일 <span>${esc(report.title)}</span></p>
          ${
            report.events.length
              ? `<ol>${report.events
                  .slice(0, 8)
                  .map((e) => `<li><time>${esc(clockText(e.at, homeId))}</time><span><b>${esc(e.route.stops[0].name)} → ${esc(e.route.stops.at(-1).name)}</b> ${esc(e.text)}</span></li>`)
                  .join("")}${report.events.length > 8 ? `<li class="more">외 ${report.events.length - 8}건</li>` : ""}</ol>`
              : `<p class="board-note">아무 일도 없었어요.</p>`
          }
        </section>`
            : ""
        }
        <div class="board-rings">
          ${ring(sent.length ? sentDone / sent.length : 0, "도착", `보낸 ${sent.length}건 중 ${sentDone}`, "#ffd27a")}
          ${ring(all.length ? eco / all.length : 0, "친환경", `${eco}건`, "#5fd3c6")}
          ${ring(co2Express ? 1 - co2 / co2Express : 0, "탄소 절감", "특급 대비", "#8fe0a6")}
        </div>
        <dl class="board-tiles">
          <div><dt>거리</dt><dd>${Math.round(km).toLocaleString("en-US")}km</dd></div>
          <div><dt>운임</dt><dd>$${spend.toFixed(2)}</dd></div>
          <div><dt>탄소</dt><dd>${co2.toFixed(1)}kg</dd></div>
        </dl>
        <section class="board-waves">
          <p class="board-h">오늘 일반 배송 출발 <span>${esc(city)} ${waves.time}</span></p>
          <ol>${waves.waves.map((w) => `<li class="wave-${w.state}"><i></i><b>${w.label}</b><span>${{ done: "출발함", next: "다음", later: "" }[w.state]}</span></li>`).join("")}</ol>
        </section>
        <div class="board-chips" role="tablist">
          ${CHIPS.map(([k, name]) => `<button type="button" role="tab" data-chip="${k}" aria-selected="${k === chip}">${name} <span>${counts[k]}</span></button>`).join("")}
        </div>
        <ul class="board-list">
          ${
            shown.length
              ? shown
                  .map((s, i) => {
                    const left = s.route.hours - s.elapsed;
                    const line = s.rec.dir === "received" ? "받음" : s.phase === "delivered" ? s.label : `${s.label} · ${leftText(left)} 뒤 도착`;
                    return `
            <li><button type="button" class="board-item" data-i="${i}">
              ${ring(s.progress, "", "", s.phase === "delivered" ? "#ffd27a" : s.phase === "customs" ? "#ff9a8a" : "#5fd3c6").replace("board-ring", "board-ring item-ring")}
              <span class="item-main">
                <b>${esc(s.route.stops[0].name)} → ${esc(s.route.stops.at(-1).name)}</b>
                <span class="item-meta"><em data-service="${s.rec.s}">${SERVICES[s.rec.s].name}</em>${s.rec.who ? ` · ${esc(s.rec.who)}${s.rec.dir === "received" ? "에게서" : "에게"}` : ""}</span>
                <span class="item-status">${esc(line)}</span>
              </span>
              <span class="item-go" aria-hidden="true">›</span>
            </button></li>`;
                  })
                  .join("")
              : `<li class="board-empty">${all.length ? "없어요" : "아직 배송이 없어요. 편지를 보내면 여기 쌓여요."}</li>`
          }
        </ul>
      </div>
      <div class="board-turn">
        <p class="turn-clock"><span>시뮬레이션 시각</span> ${esc(clockText(now, homeId))} <em>${esc(city)}</em></p>
        <div class="turn-buttons">
          <button type="button" data-skip="6">+6시간</button>
          <button type="button" data-skip="24">하루 넘기기</button>
          <button type="button" data-skip="next" ${nextArrival(all) == null ? "disabled" : ""}>다음 도착까지 ▸</button>
        </div>
      </div>`;
    for (const btn of board.querySelectorAll("[data-skip]")) btn.addEventListener("click", () => endTurn(btn.dataset.skip));
    board.querySelector(".board-back").addEventListener("click", close);
    for (const b of board.querySelectorAll("[data-chip]"))
      b.addEventListener("click", () => {
        chip = b.dataset.chip;
        render();
        board.querySelector(`[data-chip="${chip}"]`)?.focus();
      });
    for (const b of board.querySelectorAll(".board-item"))
      b.addEventListener("click", () => {
        const s = shown[Number(b.dataset.i)];
        onOpen?.(s.rec, () => board?.querySelector(`.board-item[data-i="${b.dataset.i}"]`)?.focus());
      });
  };
  // 턴 넘기기: 시계를 앞으로 돌리고, 그 사이 일어난 일을 모아 리포트로
  const endTurn = (skip) => {
    const before = simNow();
    const states = load()
      .map((r) => stateOf(r, before))
      .filter(Boolean);
    const hours = skip === "next" ? Math.ceil((nextArrival(states) ?? 0) * 60) / 60 : Number(skip);
    if (!(hours > 0)) return;
    const after = before + hours * 3600e3;
    setClock(after);
    const events = states
      .flatMap((st) => eventsBetween(st, st.elapsed, st.elapsed + hours))
      .map((e) => ({ ...e, at: e.rec.at + e.h * 3600e3 }))
      .sort((a, b) => a.at - b.at);
    report = { title: `+${formatHours(hours)}`, events };
    render();
    board.scrollTo({ top: 0, behavior: "smooth" });
    navigator.vibrate?.(8);
  };
  const onKey = (e) => {
    if (e.key === "Escape" && !document.body.classList.contains("tracking-open")) close();
  };
  function close() {
    document.removeEventListener("keydown", onKey);
    board.remove();
    board = null;
    document.body.classList.remove("letter-open");
  }
  document.addEventListener("keydown", onKey);
  render();
  board.querySelector(".board-back").focus();
}
