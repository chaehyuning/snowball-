// 내 배송 화면: 이 기기에서 보내고 받은 스노우볼을 모아 운영 대시보드처럼 보여 줌.
// 서버가 없어서 기록은 이 브라우저에만 남음 (localStorage, 최근 60건).
// 보낸 배송은 보낸 시각부터 실제 시간으로 시뮬레이션 시계가 흘러 운송 중 → 통관 → 도착으로 바뀜.
// (받는 사람에게 실제 지연을 걸지는 않음. 이 화면은 보낸 사람이 보는 시뮬레이션)

import { CITIES, DESTINATIONS, SERVICES, dispatchWaves, formatHours, phaseAt, planRoute } from "./logistics.mjs";

const KEY = "snowball-shipments";
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
  const p = rec.dir === "received" ? { phase: "delivered", label: `Received · ${route.stops.at(-1).name}`, t: 1 } : phaseAt(route, elapsed);
  return { rec, route, elapsed, ...p, progress: rec.dir === "received" ? 1 : Math.min(1, Math.max(0, elapsed / route.hours)) };
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
const leftText = (h) => (h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : formatHours(h));

// 칩: 전체 / 운송 중 / 통관 / 도착 / 받은 것
const CHIPS = [
  ["all", "All"],
  ["transit", "In transit"],
  ["customs", "Customs"],
  ["delivered", "Delivered"],
  ["received", "Received"],
];
const inChip = (st, chip) =>
  chip === "all" ||
  (chip === "received" ? st.rec.dir === "received" : st.rec.dir === "sent" && st.phase === chip);

let board = null;

// 화면 열기. homeId: 지금 보고 있는 스노우볼(오늘 출고 차수를 그 도시 시각으로), onOpen: 한 건을 눌렀을 때
export function openShipments(homeId, onOpen) {
  if (board) return;
  board = document.createElement("div");
  board.className = "board";
  board.setAttribute("role", "dialog");
  board.setAttribute("aria-modal", "true");
  board.setAttribute("aria-label", "My shipments");
  document.body.append(board);
  document.body.classList.add("letter-open");
  let chip = "all";
  const render = () => {
    const now = Date.now();
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
          <button type="button" class="board-back" aria-label="Close">←</button>
          <p class="tracking-kicker">SNOWBALL LOGISTICS</p>
        </div>
        <h2 class="board-title">My shipments</h2>
        <p class="board-big"><b>${all.length}</b> shipment${all.length === 1 ? "" : "s"} <span>${inTransit} in transit · ${delivered} delivered</span></p>
        <div class="board-rings">
          ${ring(sent.length ? sentDone / sent.length : 0, "Delivered", `${sentDone} of ${sent.length} sent`, "#ffd27a")}
          ${ring(all.length ? eco / all.length : 0, "Eco share", `${eco} by sea / rail`, "#5fd3c6")}
          ${ring(co2Express ? 1 - co2 / co2Express : 0, "CO₂ saved", "vs all-Express", "#8fe0a6")}
        </div>
        <dl class="board-tiles">
          <div><dt>Distance</dt><dd>${Math.round(km).toLocaleString("en-US")} km</dd></div>
          <div><dt>Freight spent</dt><dd>$${spend.toFixed(2)}</dd></div>
          <div><dt>CO₂</dt><dd>${co2.toFixed(1)} kg</dd></div>
        </dl>
        <section class="board-waves">
          <p class="board-h">Today's dispatch waves <span>${esc(city)} · ${waves.time}</span></p>
          <ol>${waves.waves.map((w) => `<li class="wave-${w.state}"><i></i><b>${w.label}</b><span>${{ done: "Departed", next: "Next", later: "Later" }[w.state]}</span></li>`).join("")}</ol>
          <p class="board-note">Standard letters wait for the next wave. Express leaves hourly; Eco on Monday 09:00.</p>
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
                    const line = s.rec.dir === "received" ? s.label : s.phase === "delivered" ? `Delivered · ${s.route.stops.at(-1).name}` : `${s.label} · arrives in ${leftText(left)}`;
                    return `
            <li><button type="button" class="board-item" data-i="${i}">
              ${ring(s.progress, "", "", s.phase === "delivered" ? "#ffd27a" : s.phase === "customs" ? "#ff9a8a" : "#5fd3c6").replace("board-ring", "board-ring item-ring")}
              <span class="item-main">
                <b>${esc(s.route.stops[0].name)} → ${esc(s.route.stops.at(-1).name)}</b>
                <span class="item-meta"><em data-service="${s.rec.s}">${SERVICES[s.rec.s].name}</em> ${s.rec.dir === "received" ? "Received" : "Sent"}${s.rec.who ? ` ${s.rec.dir === "received" ? "from" : "to"} ${esc(s.rec.who)}` : ""} · ${esc(s.rec.id)}</span>
                <span class="item-status">${esc(line)}</span>
              </span>
              <span class="item-go" aria-hidden="true">›</span>
            </button></li>`;
                  })
                  .join("")
              : `<li class="board-empty">${all.length ? "Nothing here right now." : "No shipments yet. Send a snowball letter and it shows up here."}</li>`
          }
        </ul>
        <p class="board-note">Simulated on this device only. Status follows the lead time from the moment you sent it.</p>
      </div>`;
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
  // 열어 둔 동안 30초마다 상태를 새로 계산
  const timer = setInterval(render, 30000);
  const onKey = (e) => {
    if (e.key === "Escape" && !document.body.classList.contains("tracking-open")) close();
  };
  function close() {
    clearInterval(timer);
    document.removeEventListener("keydown", onKey);
    board.remove();
    board = null;
    document.body.classList.remove("letter-open");
  }
  document.addEventListener("keydown", onKey);
  render();
  board.querySelector(".board-back").focus();
}
