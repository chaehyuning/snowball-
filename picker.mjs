// 지구본 선택창: 지구본을 돌려 나라를 고르는 캐릭터 선택 화면
// 육지 윤곽은 Natural Earth 1:110m (world-atlas, 퍼블릭 도메인)을 0.5도 단위로 줄인 land.json

// 각 나라 핀의 위치(위도, 경도)와 카드에 보여줄 내용.
// 핀 머리는 실제 위치에서 위로 stem, 옆으로 dx만큼 떨어져 있음. stem이 음수면 아래로 내려감.
// 한중일은 서로 가까워서 중국은 왼쪽 위, 한국은 바로 위로 높게, 일본은 오른쪽 위로 벌려 둠
export const PLACES = {
  japan: { lat: 35.36, lon: 138.73, landmark: "후지산", particle: "벚꽃잎", color: "#f6a3ba", stem: 24, dx: 30 },
  korea: { lat: 37.55, lon: 126.99, landmark: "N서울타워", particle: "반짝이는 불빛", color: "#ffd27a", stem: 42, dx: 0 },
  canada: { lat: 46.81, lon: -71.21, landmark: "샤토 프롱트낙", particle: "단풍잎", color: "#e0531f", stem: 22, dx: 0 },
  australia: { lat: -33.86, lon: 151.21, landmark: "오페라하우스", particle: "물방울", color: "#4fb0e8", stem: 22, dx: 0 },
  finland: { lat: 66.54, lon: 25.85, landmark: "산타마을", particle: "눈꽃", color: "#e8f2ff", stem: 26, dx: 0 },
  china: { lat: 39.92, lon: 116.39, landmark: "자금성", particle: "은행잎", color: "#f2c230", stem: 24, dx: -30 },
  egypt: { lat: 29.98, lon: 31.13, landmark: "기자 피라미드", particle: "모래알", color: "#d48a52", stem: -30, dx: -8 },
  france: { lat: 48.86, lon: 2.29, landmark: "에펠탑", particle: "장미 꽃잎", color: "#d81b4a", stem: 22, dx: -24 },
  turkey: { lat: 41.01, lon: 28.98, landmark: "블루 모스크", particle: "나비", color: "#2ec4c9", stem: -14, dx: 36 },
  spain: { lat: 41.4, lon: 2.17, landmark: "사그라다 파밀리아", particle: "스테인드글라스 조각", color: "#3cbf6a", stem: 12, dx: -34 },
};

const RAD = Math.PI / 180;
const MAX_TILT = 50;

let landMask = null; // 경도 720 × 위도 360 칸마다 육지면 1
let ui = null;
let state = null;

async function loadLand() {
  if (landMask) return;
  const rings = await (await fetch("./land.json")).json();
  const c = document.createElement("canvas");
  c.width = 720;
  c.height = 360;
  const g = c.getContext("2d");
  g.fillStyle = "#fff";
  for (const ring of rings) {
    g.beginPath();
    for (let i = 0; i < ring.length; i += 2) g.lineTo((ring[i] + 180) * 2, (90 - ring[i + 1]) * 2);
    g.closePath();
    g.fill();
  }
  const data = g.getImageData(0, 0, 720, 360).data;
  landMask = new Uint8Array(720 * 360);
  for (let i = 0; i < landMask.length; i++) landMask[i] = data[i * 4 + 3] > 127 ? 1 : 0;
}

// 기호 버튼의 SVG를 그대로 가져와 핀 그림으로 씀
function iconImage(id) {
  const svg = document.querySelector(`.scenes [data-scene="${id}"] svg`);
  const img = new Image();
  if (!svg) return img;
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "48");
  clone.setAttribute("height", "48");
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(clone.outerHTML);
  return img;
}

function buildUI() {
  const root = document.createElement("div");
  root.className = "picker";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "지구본에서 나라 고르기");
  root.innerHTML = `
    <button type="button" class="picker-close" aria-label="닫기">×</button>
    <p class="picker-title">SELECT YOUR SNOWBALL</p>
    <p class="picker-sub">지구본을 돌려 나라를 고르세요</p>
    <canvas class="picker-globe"></canvas>
    <div class="picker-card">
      <button type="button" class="picker-step" data-step="-1" aria-label="이전 나라">‹</button>
      <div class="picker-info">
        <div class="picker-icon" aria-hidden="true"></div>
        <div>
          <p class="picker-name"></p>
          <p class="picker-detail"></p>
        </div>
      </div>
      <button type="button" class="picker-step" data-step="1" aria-label="다음 나라">›</button>
    </div>
    <button type="button" class="picker-go">이 나라로</button>
  `;
  document.body.append(root);
  return {
    root,
    canvas: root.querySelector(".picker-globe"),
    icon: root.querySelector(".picker-icon"),
    name: root.querySelector(".picker-name"),
    detail: root.querySelector(".picker-detail"),
    go: root.querySelector(".picker-go"),
    close: root.querySelector(".picker-close"),
  };
}

const shortest = (a) => ((((a + 180) % 360) + 360) % 360) - 180;

export async function openPicker(scenes, currentId, onSelect, onClose) {
  if (!ui) ui = buildUI();
  const ids = scenes.map((s) => s.id).filter((id) => PLACES[id]);
  const focusId = ids.includes(currentId) ? currentId : ids[0];
  const start = PLACES[focusId];
  state = {
    scenes,
    ids,
    onSelect,
    onClose,
    focus: focusId,
    lon: start.lon - 40,
    lat: 0,
    target: { lon: start.lon, lat: start.lat * 0.6 },
    vel: 0,
    dragging: false,
    moved: 0,
    pins: [],
    icons: Object.fromEntries(ids.map((id) => [id, iconImage(id)])),
    raf: 0,
  };
  ui.root.hidden = false;
  document.body.style.overflow = "hidden";
  setFocus(focusId);
  await loadLand();
  wire();
  ui.go.focus();
  const loop = () => {
    if (!state || ui.root.hidden) return;
    tick();
    draw();
    state.raf = requestAnimationFrame(loop);
  };
  loop();
}

function closePicker() {
  ui.root.hidden = true;
  document.body.style.overflow = "";
  cancelAnimationFrame(state.raf);
  state.onClose?.();
}

function choose(id) {
  const onSelect = state.onSelect;
  closePicker();
  onSelect(id);
}

function setFocus(id) {
  state.focus = id;
  const place = PLACES[id];
  state.target = { lon: place.lon, lat: Math.max(-MAX_TILT, Math.min(MAX_TILT, place.lat * 0.6)) };
  const scene = state.scenes.find((s) => s.id === id);
  ui.name.textContent = scene.label;
  ui.detail.textContent = `${place.landmark} · 흩날리는 것: ${place.particle}`;
  const svg = document.querySelector(`.scenes [data-scene="${id}"] svg`);
  ui.icon.innerHTML = svg ? svg.outerHTML : "";
  ui.icon.style.setProperty("--accent", place.color);
}

function step(dir) {
  const i = state.ids.indexOf(state.focus);
  setFocus(state.ids[(i + dir + state.ids.length) % state.ids.length]);
}

// 화면 가운데에 가장 가까운 나라
function nearestToCenter() {
  let best = state.focus;
  let bestD = Infinity;
  for (const id of state.ids) {
    const p = PLACES[id];
    const d = Math.abs(shortest(p.lon - state.lon)) + Math.abs(p.lat * 0.6 - state.lat) * 0.5;
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  const { canvas } = ui;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    state.dragging = true;
    state.target = null;
    state.moved = 0;
    state.vel = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    const r = canvas.getBoundingClientRect().width / 2;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    state.moved += Math.hypot(dx, dy);
    const dLon = -(dx / r) * 60;
    state.lon += dLon;
    state.vel = dLon;
    state.lat = Math.max(-MAX_TILT, Math.min(MAX_TILT, state.lat + (dy / r) * 60));
  });
  canvas.addEventListener("pointerup", (e) => {
    state.dragging = false;
    if (state.moved < 6) {
      // 핀을 누르면 그 나라로 돌아가고, 이미 고른 핀을 한 번 더 누르면 선택
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const hit = state.pins.find((p) => Math.hypot(p.x - x, p.y - y) < p.r + 4);
      if (hit) {
        if (hit.id === state.focus) choose(hit.id);
        else setFocus(hit.id);
      } else {
        setFocus(state.focus);
      }
    }
  });
  canvas.addEventListener("pointercancel", () => (state.dragging = false));

  ui.root.querySelectorAll(".picker-step").forEach((b) => b.addEventListener("click", () => step(Number(b.dataset.step))));
  ui.go.addEventListener("click", () => choose(state.focus));
  ui.close.addEventListener("click", closePicker);
  ui.root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePicker();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "Enter" && e.target === ui.root) choose(state.focus);
    e.stopPropagation();
  });
}

function tick() {
  if (state.dragging) return;
  if (state.target) {
    state.lon += shortest(state.target.lon - state.lon) * 0.1;
    state.lat += (state.target.lat - state.lat) * 0.1;
    return;
  }
  // 손을 떼면 관성으로 돌다가, 느려지면 가운데에 가장 가까운 나라에 맞춰짐
  state.lon += state.vel;
  state.vel *= 0.93;
  if (Math.abs(state.vel) < 0.15) setFocus(nearestToCenter());
}

function draw() {
  const { canvas } = ui;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const cssSize = canvas.getBoundingClientRect().width;
  const size = Math.round(cssSize * dpr);
  if (canvas.width !== size) {
    canvas.width = canvas.height = size;
    state.image = null;
  }
  const g = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.4;

  if (!state.image) state.image = g.createImageData(size, size);
  const img = state.image;
  const px = img.data;
  px.fill(0);

  const phi0 = state.lat * RAD;
  const sinP = Math.sin(phi0);
  const cosP = Math.cos(phi0);
  const lam0 = state.lon;
  // 왼쪽 위에서 비추는 빛
  const lx = -0.45;
  const ly = 0.5;
  const lz = 0.74;

  const y0 = Math.floor(cy - R);
  const y1 = Math.ceil(cy + R);
  for (let py = y0; py <= y1; py++) {
    const y = (cy - py) / R;
    for (let pxi = Math.floor(cx - R); pxi <= Math.ceil(cx + R); pxi++) {
      const x = (pxi - cx) / R;
      const rr = x * x + y * y;
      if (rr > 1) continue;
      const z = Math.sqrt(1 - rr);
      // 정사영 역변환: 화면의 점 → 위도·경도
      const lat = Math.asin(y * cosP + z * sinP) / RAD;
      const lon = lam0 + Math.atan2(x, z * cosP - y * sinP) / RAD;
      const mx = (((Math.floor((lon + 180) * 2) % 720) + 720) % 720);
      const my = Math.min(359, Math.max(0, Math.floor((90 - lat) * 2)));
      const land = landMask[my * 720 + mx];

      const light = 0.3 + 0.75 * Math.max(0, x * lx + y * ly + z * lz);
      let r;
      let gg;
      let b;
      if (land) {
        const a = Math.abs(lat);
        if (a > 62) [r, gg, b] = [228, 236, 244];
        else if (a < 32 && a > 12) [r, gg, b] = [196, 170, 110];
        else [r, gg, b] = [92, 152, 96];
      } else {
        [r, gg, b] = [28, 84, 160];
      }
      // 경위선: 30도마다 옅은 선
      const grid = Math.abs(((lat + 90) % 30) - 15) > 14.4 || Math.abs((((lon % 30) + 30) % 30) - 15) > 14.5;
      const k = grid ? 1.25 : 1;
      const i = (py * size + pxi) * 4;
      px[i] = Math.min(255, r * light * k);
      px[i + 1] = Math.min(255, gg * light * k);
      px[i + 2] = Math.min(255, b * light * k);
      // 가장자리는 부드럽게
      px[i + 3] = rr > 0.985 ? 255 * (1 - (rr - 0.985) / 0.015) : 255;
    }
  }
  g.putImageData(img, 0, 0);

  // 대기권 빛
  const atmo = g.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.15);
  atmo.addColorStop(0, "rgba(120,190,255,0)");
  atmo.addColorStop(0.35, "rgba(120,190,255,0.35)");
  atmo.addColorStop(1, "rgba(120,190,255,0)");
  g.fillStyle = atmo;
  g.fillRect(0, 0, size, size);

  // 핀: 앞면에 있는 나라만. 고른 나라는 크게, 맨 위에
  state.pins = [];
  const t = performance.now();
  const order = [...state.ids].sort((a, b) => (a === state.focus) - (b === state.focus));
  for (const id of order) {
    const p = PLACES[id];
    const phi = p.lat * RAD;
    const dl = (p.lon - lam0) * RAD;
    const cosc = sinP * Math.sin(phi) + cosP * Math.cos(phi) * Math.cos(dl);
    if (cosc < 0.08) continue;
    const x = cx + R * Math.cos(phi) * Math.sin(dl);
    const y = cy - R * (cosP * Math.sin(phi) - sinP * Math.cos(phi) * Math.cos(dl));
    const focused = id === state.focus;
    const s = size / 340;
    const pr = (focused ? 17 : 12) * s;
    const bx = x + p.dx * s;
    const by = y - p.stem * s;

    g.globalAlpha = Math.min(1, cosc * 3);
    g.fillStyle = "rgba(0,0,0,0.35)";
    g.beginPath();
    g.ellipse(x, y, 3 * s, 1.5 * s, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.8)";
    g.lineWidth = 1.5 * s;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(bx, by);
    g.stroke();
    // 실제 위치 표시점
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(x, y, 1.8 * s, 0, Math.PI * 2);
    g.fill();

    if (focused) {
      // 고른 핀 둘레에서 퍼지는 고리
      const k = (t % 1200) / 1200;
      g.strokeStyle = p.color;
      g.globalAlpha = (1 - k) * 0.8;
      g.lineWidth = 2 * s;
      g.beginPath();
      g.arc(bx, by, pr + k * 14 * s, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = Math.min(1, cosc * 3);
    }
    g.fillStyle = focused ? "#0d1730" : "rgba(13,23,48,0.85)";
    g.strokeStyle = focused ? p.color : "rgba(207,216,234,0.6)";
    g.lineWidth = (focused ? 2.5 : 1.2) * s;
    g.beginPath();
    g.arc(bx, by, pr, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    const icon = state.icons[id];
    if (icon.complete && icon.naturalWidth) g.drawImage(icon, bx - pr * 0.72, by - pr * 0.72, pr * 1.44, pr * 1.44);
    g.globalAlpha = 1;
    state.pins.push({ id, x: bx, y: by, r: pr });
  }
}
