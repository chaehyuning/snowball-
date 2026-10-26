import { CITIES, DESTINATIONS, SERVICES, TZ, dispatchWaves, formatHours, phaseAt, planRoute } from "./logistics.mjs";

const KEY = "snowball-shipments";
const CLOCK_KEY = "snowball-sim-clock";

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
  }
}

export function recordShipment(rec) {
  const list = load();
  if (list.some((r) => r.id === rec.id && r.dir === rec.dir)) return;
  list.unshift(rec);
  save(list);
}

export const shipmentCount = () => load().length;

const GOAL_KEY = "snowball-goal-level";
const CONTINENT = {
  KR: "아시아", JP: "아시아", CN: "아시아", TW: "아시아", HK: "아시아", SG: "아시아", TH: "아시아", VN: "아시아", PH: "아시아", ID: "아시아", MY: "아시아", IN: "아시아", AE: "아시아",
  TR: "유럽", GB: "유럽", FR: "유럽", DE: "유럽", NL: "유럽", ES: "유럽", IT: "유럽", CH: "유럽", FI: "유럽", SE: "유럽", NO: "유럽", DK: "유럽", PL: "유럽",
  EG: "아프리카", ZA: "아프리카", KE: "아프리카",
  US: "북미", CA: "북미", MX: "북미",
  BR: "남미", AR: "남미", CL: "남미", PE: "남미", BO: "남미",
  AU: "오세아니아", NZ: "오세아니아",
};
export const GOALS = [
  { title: "첫 스노우볼 보내기", hint: "편지를 쓰고 받는 나라를 골라 보내 보세요", goal: 1, key: "sent" },
  { title: "배송 1건 도착시키기", hint: "내 배송에서 '다음 도착까지'를 눌러 보세요", goal: 1, key: "delivered" },
  { title: "친환경으로 1건 보내기", hint: "배송 방식에서 친환경을 골라 보세요", goal: 1, key: "eco" },
  { title: "3개 대륙에 보내기", hint: "아시아 · 유럽 · 북미 · 남미 · 아프리카 · 오세아니아", goal: 3, key: "continents" },
  { title: "운임 $10 이하로 3건 보내기", hint: "가까운 나라나 친환경이 싸요", goal: 3, key: "cheap" },
  { title: "특급보다 탄소 5kg 아끼기", hint: "먼 나라일수록 친환경 효과가 커요", goal: 5, key: "saved", unit: "kg" },
  { title: "함께 지구 한 바퀴", hint: "보낸 거리 40,075km 채우기", goal: 40075, key: "km", unit: "km" },
];

function metrics(now) {
  const sent = load()
    .filter((r) => r.dir === "sent")
    .map((r) => stateOf(r, now))
    .filter(Boolean);
  const express = (s) => planRoute(s.rec.from, s.rec.to, "x", { wait: 0, now: s.rec.at })?.co2 || 0;
  return {
    sent: sent.length,
    delivered: sent.filter((s) => s.phase === "delivered").length,
    eco: sent.filter((s) => s.rec.s === "e").length,
    continents: new Set(sent.map((s) => CONTINENT[s.rec.to])).size,
    cheap: sent.filter((s) => s.route.cost <= 10).length,
    saved: sent.reduce((a, s) => a + Math.max(0, express(s) - s.route.co2), 0),
    km: sent.reduce((a, s) => a + s.route.km, 0),
  };
}

export function goalStatus(mode = null) {
  let level = 0;
  try {
    level = Number(localStorage.getItem(GOAL_KEY)) || 0;
  } catch {
    level = 0;
  }
  const m = metrics(simNow());
  const done = [];
  const can = (g) => mode === "seal" || (mode === "turn" && g.key === "delivered");
  while (level < GOALS.length && can(GOALS[level]) && m[GOALS[level].key] >= GOALS[level].goal) {
    done.push(GOALS[level].title);
    level += 1;
  }
  if (done.length)
    try {
      localStorage.setItem(GOAL_KEY, String(level));
    } catch {
    }
  const goal = GOALS[level] || null;
  return { level, total: GOALS.length, goal, value: goal ? m[goal.key] : 0, done };
}

export function goalProgressText(st) {
  const g = st.goal;
  const v = Math.min(st.value, g.goal);
  const num = (x) => (g.unit === "kg" ? x.toFixed(1) : Math.round(x).toLocaleString("en-US"));
  return `${num(v)} / ${num(g.goal)}${g.unit || ""}`;
}

function stateOf(rec, now) {
  const route = planRoute(rec.from, rec.to, rec.s, { wait: rec.w, now: rec.at });
  if (!route) return null;
  const elapsed = (now - rec.at) / 3600e3;
  const p = rec.dir === "received" ? { phase: "delivered", label: `받음 · ${route.stops.at(-1).name}`, t: 1 } : phaseAt(route, elapsed);
  return { rec, route, elapsed, ...p, progress: rec.dir === "received" ? 1 : Math.min(1, Math.max(0, elapsed / route.hours)) };
}

function eventsBetween(st, h0, h1) {
  const { route, rec } = st;
  if (rec.dir !== "sent") return [];
  const out = [];
  const add = (h, text) => h > h0 && h <= h1 && out.push({ h, text, rec, route });
  route.stops.forEach((s, k) => {
    if (k === 0) return;
    const last = k === route.stops.length - 1;
    if (last) return add(s.at, `${s.name} 도착`);
    add(s.at, `${s.code} 도착`);
    if (k === 1 && route.departure) add(s.out, `${s.code} 출발`);
    else if (route.customs && s.code === route.hub) add(s.out, `${s.code} 통관 완료`);
  });
  return out;
}

function ring(value, label, sub, color) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  return `
    <figure class="board-ring">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="${r}" class="ring-track" />
        ${v > 0 ? `<circle cx="32" cy="32" r="${r}" class="ring-value" style="stroke:${color};stroke-dasharray:${(v * c).toFixed(1)} ${c.toFixed(1)}" />` : ""}
        <text x="32" y="36" text-anchor="middle">${Math.round(v * 100)}%</text>
      </svg>
      <figcaption><b>${label}</b><span>${sub}</span></figcaption>
    </figure>`;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const leftText = formatHours;

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

function clockText(t, homeId) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("ko-KR", { timeZone: TZ[homeId], weekday: "short", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(t))
      .map((x) => [x.type, x.value]),
  );
  return `${p.month}/${p.day}(${p.weekday}) ${p.hour}:${p.minute}`;
}

function nextArrival(all) {
  const left = all.filter((s) => s.rec.dir === "sent" && s.phase !== "delivered").map((s) => s.route.hours - s.elapsed);
  return left.length ? Math.min(...left) : null;
}

let board = null;

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
  let report = null;
  let cheer = [];
  const render = () => {
    const now = simNow();
    const all = load()
      .map((r) => stateOf(r, now))
      .filter(Boolean);
    const sent = all.filter((s) => s.rec.dir === "sent");
    const delivered = all.filter((s) => s.phase === "delivered").length;
    const eco = all.filter((s) => s.rec.s === "e").length;
    const co2 = all.reduce((a, s) => a + s.route.co2, 0);
    const co2Express = all.reduce((a, s) => a + (planRoute(s.rec.from, s.rec.to, "x", { wait: 0, now: s.rec.at })?.co2 || 0), 0);
    const km = all.reduce((a, s) => a + s.route.km, 0);
    const spend = sent.reduce((a, s) => a + s.route.cost, 0);
    const counts = Object.fromEntries(CHIPS.map(([k]) => [k, all.filter((s) => inChip(s, k)).length]));
    const sentDone = sent.filter((s) => s.phase === "delivered").length;
    const inTransit = sent.length - sentDone;
    const waves = dispatchWaves(homeId, now);
    const city = CITIES[homeId]?.city || "";
    const shown = all.filter((s) => inChip(s, chip));
    const goal = goalStatus();
    board.innerHTML = `
      <div class="board-inner">
        <div class="board-top">
          <button type="button" class="board-back" aria-label="닫기">←</button>
        </div>
        <h2 class="board-title">내 배송</h2>
        <p class="board-big"><b>${all.length}</b>건 <span>배송 중 ${inTransit} · 도착 ${delivered}</span></p>
        <section class="goal">
          ${cheer.length ? `<p class="goal-done">달성! ${esc(cheer.join(" · "))}</p>` : ""}
          ${
            goal.goal
              ? `<p class="goal-step">목표 ${goal.level + 1} / ${goal.total}</p>
          <p class="goal-title">${esc(goal.goal.title)}</p>
          <div class="goal-bar"><span style="width:${Math.min(100, (goal.value / goal.goal.goal) * 100).toFixed(1)}%"></span></div>
          <p class="goal-meta"><b>${goalProgressText(goal)}</b> ${esc(goal.goal.hint)}</p>`
              : `<p class="goal-title">모든 목표 달성!</p><p class="goal-meta">스노우볼 물류왕이에요.</p>`
          }
        </section>
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
          <button type="button" data-skip="next" ${nextArrival(all) == null ? "disabled" : ""}>${nextArrival(all) == null ? "배송 중인 게 없어요" : "다음 도착까지 ▸"}</button>
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
  const endTurn = (skip) => {
    const before = simNow();
    const states = load()
      .map((r) => stateOf(r, before))
      .filter(Boolean);
    const hours = Math.ceil((nextArrival(states) ?? 0) * 60) / 60;
    if (!(hours > 0)) return;
    const after = before + hours * 3600e3;
    setClock(after);
    cheer = goalStatus("turn").done;
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
