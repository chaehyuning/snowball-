import { fuji } from "./scene-fuji.mjs";
import { namsan } from "./scene-namsan.mjs";
import { quebec } from "./scene-quebec.mjs";
import { sydney } from "./scene-sydney.mjs";
import { santa } from "./scene-santa.mjs";
import { forbidden } from "./scene-forbidden.mjs";
import { egypt } from "./scene-egypt.mjs";
import { paris } from "./scene-paris.mjs";
import { istanbul } from "./scene-istanbul.mjs";
import { openPicker } from "./picker.mjs";
import * as sfx from "./sound.mjs";
import { startTutorial, tutorialDone, openHelp } from "./tutorial.mjs";

const SCENES = [fuji, namsan, quebec, sydney, santa, forbidden, egypt, paris, istanbul];

const canvas = document.getElementById("globe");
const ctx = canvas.getContext("2d");

const W = 400;
const H = 600;
const PAD = 50; // 위아래로 흔들 공간
const dpr = window.devicePixelRatio || 1;
canvas.width = W * dpr;
canvas.height = H * dpr;
ctx.scale(dpr, dpr);

const globe = { x: 200, y: 210, r: 170 };
const mound = { x: 200, y: 360, rx: 190, ry: 50 };
const MAX_OFFSET = 50; // 흔들 수 있는 최대 거리
const PARTICLE_SCALE = 1.5; // 모든 나라의 입자를 이만큼 크게 그림
const FALL_SPEED = 2.2; // 장면 파일의 가라앉는 속도에 곱함. 클수록 빨리 쏟아짐
// 화면에서는 흔들림을 이만큼만 보여줌. 입자가 받는 힘은 그대로라 눈은 똑같이 날림
const VISUAL_SHAKE = 0.35;

// 흔들기 상태 (스노우볼은 손을 스프링처럼 따라감)
let dragging = false;
let startX = 0;
let startY = 0;
let target = 0;
let offset = 0;
let globeVel = 0;
let prevGlobeVel = 0;

// 물이 휘젓는 세기. 흔들면 커지고 시간이 지나면 잦아든다
let stir = 0;

// 누르면 말랑하게 눌리고, 떼면 누른 자리에서 입자가 팡 터지며 젤리처럼 출렁임
const AUTO_SHAKE_MS = 700;
const AUTO_SHAKE_PERIOD = 250; // 한 번 오르내리는 시간
const AUTO_SHAKE_HEIGHT = 60;
const SQUEEZE_MS = 600; // 이만큼 누르고 있으면 가장 세게 눌림
let autoShakeStart = -Infinity;
let autoShakePower = 1;
let pressing = false;
let pressStart = 0;
let pressPoint = { x: 200, y: 300 };
let squash = 0; // 음수면 납작하게 눌림, 양수면 위로 늘어남
let squashVel = 0;
let rings = []; // 누른 자리에서 퍼지는 충격파 고리
let sparks = []; // 터질 때 사방으로 튀는 불꽃 줄기
let flashStart = -Infinity; // 터지는 순간 유리구 안이 번쩍임

function startAutoShake(power = 1) {
  autoShakeStart = performance.now();
  autoShakePower = power;
}

// 누르고 떼면 누른 자리에서 가까운 입자부터 차례로 솟아올라 유리구 위쪽을 덮음.
// 입자마다 서로 다른 목적지를 받아서 줄지어 따라가지 않고 고르게 퍼진다.
const RIPPLE_SPEED = 0.6; // 솟아오르는 물결이 퍼지는 속도 (px/ms)

function randomSkyPoint() {
  for (;;) {
    const x = globe.x + rand(-1, 1) * (globe.r - 18);
    const y = globe.y - globe.r + 18 + Math.random() * (globe.r + 40);
    if (Math.hypot(x - globe.x, y - globe.y) < globe.r - 18 && y < groundAt(x) - 30) return { x, y };
  }
}

function burst(x, y, power) {
  const now = performance.now();
  for (const p of particles) {
    // 이번에 날아갈 입자 수는 누른 세기에 비례 (짧게 톡 치면 일부만)
    if (Math.random() > 0.55 + 0.45 * power) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    p.launchAt = now + d / RIPPLE_SPEED + rand(0, 90);
    p.target = randomSkyPoint();
  }
  stir = Math.min(stir + 3 * power, 5);
  rings.push({ x, y, start: now, power });
  try {
    navigator.vibrate?.(power > 0.75 ? 30 : 15);
  } catch {}
}

// 화면 좌표 → 스노우볼 그림 좌표. 유리구 밖을 누르면 유리구 안 가장 가까운 곳으로
function toGlobe(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  let x = ((clientX - rect.left) * W) / rect.width;
  let y = ((clientY - rect.top) * H) / rect.height - PAD - offset * VISUAL_SHAKE;
  const dx = x - globe.x;
  const dy = y - globe.y;
  const d = Math.hypot(dx, dy);
  const max = globe.r - 20;
  if (d > max) {
    x = globe.x + (dx / d) * max;
    y = globe.y + (dy / d) * max;
  }
  return { x, y };
}

function pop(power) {
  burst(pressPoint.x, pressPoint.y, power);
  startAutoShake(power);
  squashVel += 0.16 * power;
  sfx.pop(power, scene.id);
  window.dispatchEvent(new CustomEvent("snowball:pop", { detail: { power } }));

  // 번쩍임, 두 번째 고리, 불꽃 줄기
  const now = performance.now();
  if (!reduceMotion.matches) flashStart = now;
  rings.push({ x: pressPoint.x, y: pressPoint.y, start: now + 90, power: power * 1.4 });
  const n = Math.round(14 + 22 * power);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-0.15, 0.15);
    const speed = rand(4, 9) * (0.6 + power * 0.6);
    sparks.push({
      x: pressPoint.x,
      y: pressPoint.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      start: now,
      life: rand(380, 620),
      color: Math.random() < 0.5 ? "#fff6dc" : "#ffffff",
    });
  }
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rand = (min, max) => min + Math.random() * (max - min);

// 바닥 언덕 표면의 y 좌표
function groundAt(x) {
  const t = (x - mound.x) / mound.rx;
  if (Math.abs(t) >= 1) return mound.y;
  return mound.y - mound.ry * Math.sqrt(1 - t * t);
}

// 움직이지 않는 그림은 한 번만 그려 두고 매 프레임 복사해서 씀
function makeLayer(paint, grade = false) {
  const layer = document.createElement("canvas");
  layer.width = W * dpr;
  layer.height = H * dpr;
  const g = layer.getContext("2d", { willReadFrequently: grade });
  g.scale(dpr, dpr);
  paint(g);
  if (grade) gradeLayer(g, layer.width, layer.height);
  return layer;
}

// 모든 나라 그림에 같은 색 보정을 거쳐 한 사람이 그린 일러스트처럼 맞춤
//  - 튀는 채도를 눌러 비슷한 수준으로
//  - 그늘은 짙은 남색, 밝은 곳은 따뜻한 크림색 쪽으로 살짝 물들임
//  - 완전한 검정·흰색을 피해 부드러운 톤
//  - 아주 옅은 종이 질감
const GRADE = {
  saturation: 0.8,
  shadow: [34, 40, 78],
  highlight: [255, 241, 222],
  tint: 0.14,
  floor: 14,
  ceiling: 248,
  grain: 5,
};

function gradeLayer(g, w, h) {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const { saturation, shadow, highlight, tint, floor, ceiling, grain } = GRADE;
  const range = (ceiling - floor) / 255;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    let r = d[i];
    let gg = d[i + 1];
    let b = d[i + 2];
    const lum = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
    r = lum + (r - lum) * saturation;
    gg = lum + (gg - lum) * saturation;
    b = lum + (b - lum) * saturation;
    const t = lum / 255;
    const k = t * t * (3 - 2 * t);
    r += (shadow[0] + (highlight[0] - shadow[0]) * k - r) * tint;
    gg += (shadow[1] + (highlight[1] - shadow[1]) * k - gg) * tint;
    b += (shadow[2] + (highlight[2] - shadow[2]) * k - b) * tint;
    const n = (Math.random() - 0.5) * grain;
    d[i] = floor + r * range + n;
    d[i + 1] = floor + gg * range + n;
    d[i + 2] = floor + b * range + n;
  }
  g.putImageData(img, 0, 0);
}

function settle(p) {
  p.y = groundAt(p.x) - 1 + rand(0, 3);
  p.vx = 0;
  p.vy = 0;
  p.settled = true;
  p.flip = rand(-0.6, 0.6); // 바닥에 누운 꽃잎은 넓은 면이 보이게
}

let scene;
let particles = [];
let layers = {};

// 장면을 바꾸면 고정 그림을 다시 그리고 입자를 새로 만든다.
// 입자마다 무게·저항·떠오르기 쉬운 정도는 장면 파일이 정한다.
function loadScene(id) {
  scene = SCENES.find((s) => s.id === id) || SCENES[0];
  layers = {
    baseBack: makeLayer(paintBaseBack, true),
    scene: makeLayer((g) => scene.paint(g, globe, groundAt), true),
    glass: makeLayer(paintGlass),
    baseFront: makeLayer(paintBaseFront, true),
  };
  particles = Array.from({ length: scene.particles.count }, () => {
    const p = {
      x: globe.x + rand(-120, 120),
      angle: 0,
      spin: 0,
      flip: 0,
      flipSpeed: 0,
    };
    Object.assign(p, scene.particles.make(rand));
    p.size *= PARTICLE_SCALE;
    p.swayFreq = rand(0.0015, 0.004); // 좌우로 살랑이는 박자
    p.swayPhase = rand(0, Math.PI * 2);
    p.swayAmp = rand(0.2, 0.6) * (1 + p.flutter * 15);
    settle(p);
    return p;
  });
  stir = 0;
  document.title = `Snowball · ${scene.title}`;
  for (const button of document.querySelectorAll("[data-scene]")) {
    button.setAttribute("aria-pressed", String(button.dataset.scene === scene.id));
  }
  document.getElementById("scene-name").textContent = scene.label;
}

// 장면이 바뀔 때 직전 화면을 잠깐 겹쳐 그려 부드럽게 넘어가게 함
const FADE_MS = 350;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let fadeFrom = null;
let fadeStart = 0;

function switchScene(id) {
  if (id === scene.id) return;
  sfx.whoosh();
  if (!reduceMotion.matches) {
    fadeFrom = document.createElement("canvas");
    fadeFrom.width = canvas.width;
    fadeFrom.height = canvas.height;
    fadeFrom.getContext("2d").drawImage(canvas, 0, 0);
    fadeStart = performance.now();
  }
  history.replaceState(null, "", `#${id}`);
  loadScene(id);
  window.dispatchEvent(new Event("snowball:scene"));
}

// 1이면 다음 나라, -1이면 이전 나라. 끝에서는 처음으로 돌아감
function stepScene(dir) {
  const i = SCENES.indexOf(scene);
  switchScene(SCENES[(i + dir + SCENES.length) % SCENES.length].id);
}

for (const button of document.querySelectorAll("[data-scene]")) {
  button.addEventListener("click", () => switchScene(button.dataset.scene));
}

// 지구본 선택창
document.querySelector(".globe-open").addEventListener("click", () => openPicker(SCENES, scene.id, switchScene));

// 처음 방문이면 튜토리얼 (지구본 선택창이 떠 있으면 닫힌 뒤에)
function maybeTutorial() {
  if (!tutorialDone()) setTimeout(startTutorial, 300);
}

document.querySelector(".help-toggle").addEventListener("click", openHelp);

// 배경음악은 화면을 처음 누르거나 키를 누른 뒤 시작 (브라우저 정책)
function firstGesture() {
  sfx.startMusic();
  window.removeEventListener("pointerdown", firstGesture);
  window.removeEventListener("keydown", firstGesture);
}
window.addEventListener("pointerdown", firstGesture);
window.addEventListener("keydown", firstGesture);

// 주소의 # 뒤를 직접 바꿔도 그 나라로 넘어감
window.addEventListener("hashchange", () => switchScene(location.hash.slice(1)));

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") stepScene(1);
  if (e.key === "ArrowLeft") stepScene(-1);
  if (e.key === " " && e.target === document.body) {
    e.preventDefault();
    pressPoint = { x: globe.x, y: globe.y + 80 };
    pop(0.8);
  }
});

// 위아래로 끌면 흔들기, 좌우로 밀면 나라 바꾸기
canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  pressing = true;
  pressStart = performance.now();
  pressPoint = toGlobe(e.clientX, e.clientY);
  startX = e.clientX;
  startY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
  sfx.chargeStart();
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  // 손가락이 움직이면 누르기가 아니라 밀기·끌기로 봄
  if (pressing && Math.hypot(e.clientX - startX, e.clientY - startY) > 10) {
    pressing = false;
    sfx.chargeStop();
  }
  const scale = H / canvas.getBoundingClientRect().height;
  target = clamp((e.clientY - startY) * scale, -MAX_OFFSET, MAX_OFFSET);
});

function release() {
  dragging = false;
  pressing = false;
  target = 0;
}
canvas.addEventListener("pointerup", (e) => {
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const held = Math.min(1, (performance.now() - pressStart) / SQUEEZE_MS);
  const wasPress = pressing;
  release();
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) stepScene(dx < 0 ? 1 : -1);
  else if (wasPress) pop(0.45 + 0.55 * held); // 오래 눌렀다 뗄수록 세게 터짐
  else sfx.chargeStop();
});
canvas.addEventListener("pointercancel", () => {
  release();
  sfx.chargeStop();
});

function update(t, accel) {
  stir *= 0.985;
  const now = performance.now();

  for (const p of particles) {
    // 출발 시각이 되면 목적지를 향해 솟아오름
    if (p.target && now >= p.launchAt) {
      p.settled = false;
      p.rising = true;
      p.riseFrames = 0;
      p.goal = p.target;
      p.target = null;
    }
    if (p.settled) continue;

    if (p.rising) {
      // 목적지로 날아가며 물속처럼 감속. 무거운 입자(drag가 작은)일수록 느긋하게 도착
      const k = 0.05 + p.drag * 0.4;
      p.vx += ((p.goal.x - p.x) * k - p.vx) * 0.25;
      p.vy += ((p.goal.y - p.y) * k - p.vy) * 0.25;
      p.riseFrames++;
      if (Math.hypot(p.goal.x - p.x, p.goal.y - p.y) < 6 || p.riseFrames > 70) p.rising = false;
    } else {
      // 천천히 떨어지며 입자마다 자기 박자로 좌우로 살랑임 (떨어지는 눈송이·꽃잎의 진자 운동)
      const sway = Math.sin(t * p.swayFreq + p.swayPhase) * p.swayAmp;
      p.vx += (sway - p.vx) * p.drag;
      p.vy += (p.sink * FALL_SPEED - p.vy) * p.drag;
    }

    // 유리구를 흔들면 무거운 입자가 살짝 뒤처짐
    p.vy -= accel * p.inertia * 0.5;

    p.x += p.vx;
    p.y += p.vy;

    // 빨리 움직일수록 빨리 돌고 뒤집힘
    const speed = Math.hypot(p.vx, p.vy);
    p.angle += p.spin * (1 + speed * 2);
    p.flip += p.flipSpeed * (1 + speed);

    // 유리 벽에 닿으면 벽을 따라 미끄러짐
    const dx = p.x - globe.x;
    const dy = p.y - globe.y;
    const d = Math.hypot(dx, dy);
    const max = globe.r - p.size - 3;
    if (d > max) {
      const nx = dx / d;
      const ny = dy / d;
      const out = p.vx * nx + p.vy * ny;
      if (out > 0) {
        p.vx -= out * nx;
        p.vy -= out * ny;
      }
      p.x = globe.x + nx * max;
      p.y = globe.y + ny * max;
    }

    // 바닥에 닿으면 내려앉음
    if (!p.rising && p.y >= groundAt(p.x) - 1 && p.vy >= 0) settle(p);
  }
}

function drawParticles(t) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  ctx.clip();
  scene.animate?.(ctx, t, globe, stir);
  ctx.globalCompositeOperation = scene.particles.blend;
  for (const p of particles) scene.particles.draw(ctx, p, t);

  const now = performance.now();

  // 누르는 동안 누른 자리에 빛이 모이며 점점 커짐
  if (pressing) {
    const held = Math.min(1, (now - pressStart) / SQUEEZE_MS);
    const pulse = 0.85 + 0.15 * Math.sin(now * 0.02);
    const radius = (14 + 46 * held) * pulse;
    const charge = ctx.createRadialGradient(pressPoint.x, pressPoint.y, 0, pressPoint.x, pressPoint.y, radius);
    charge.addColorStop(0, `rgba(255,250,235,${0.35 + 0.4 * held})`);
    charge.addColorStop(1, "rgba(255,250,235,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1;
    ctx.fillStyle = charge;
    ctx.fillRect(pressPoint.x - radius, pressPoint.y - radius, radius * 2, radius * 2);
  }

  // 터지는 순간 유리구 안 전체가 0.25초 동안 번쩍임
  const fk = (now - flashStart) / 250;
  if (fk >= 0 && fk < 1) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = (1 - fk) * 0.35;
    ctx.fillStyle = "#fff6e6";
    ctx.fillRect(globe.x - globe.r, globe.y - globe.r, globe.r * 2, globe.r * 2);
  }

  // 불꽃 줄기: 빠르게 튀어 나가며 느려지고 사라짐
  sparks = sparks.filter((sp) => now - sp.start < sp.life);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const sp of sparks) {
    const k = (now - sp.start) / sp.life;
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vx *= 0.9;
    sp.vy = sp.vy * 0.9 + 0.08;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = sp.color;
    ctx.lineWidth = 2 * (1 - k) + 0.4;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y);
    ctx.lineTo(sp.x - sp.vx * 2.2, sp.y - sp.vy * 2.2);
    ctx.stroke();
  }

  // 충격파 고리: 0.6초 동안 커지며 사라짐
  rings = rings.filter((ring) => now - ring.start < 600);
  ctx.globalCompositeOperation = "source-over";
  for (const ring of rings) {
    const k = (now - ring.start) / 600;
    if (k < 0) continue;
    ctx.globalAlpha = (1 - k) * 0.6;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3 * (1 - k) + 0.5;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, 10 + k * 120 * ring.power, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 유리: 가장자리는 어둡고 왼쪽 위에 반사광이 있는 구
function paintGlass(g) {
  const { x, y, r } = globe;

  const edge = g.createRadialGradient(x, y, r * 0.55, x, y, r);
  edge.addColorStop(0, "rgba(10,20,45,0)");
  edge.addColorStop(0.85, "rgba(10,20,45,0.12)");
  edge.addColorStop(1, "rgba(10,20,45,0.38)");
  g.fillStyle = edge;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();

  // 넓고 부드러운 반사광
  g.save();
  g.translate(x - 62, y - 78);
  g.rotate(-0.7);
  const soft = g.createRadialGradient(0, 0, 0, 0, 0, 70);
  soft.addColorStop(0, `rgba(255,255,255,${0.45 * scene.glare})`);
  soft.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = soft;
  g.beginPath();
  g.ellipse(0, 0, 70, 38, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // 또렷한 작은 반사점
  g.fillStyle = `rgba(255,255,255,${0.85 * scene.glare})`;
  g.beginPath();
  g.ellipse(x - 95, y - 85, 9, 5, -0.8, 0, Math.PI * 2);
  g.fill();

  // 오른쪽 아래 가는 반사선
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 3;
  g.lineCap = "round";
  g.beginPath();
  g.arc(x, y, r - 14, Math.PI * 0.08, Math.PI * 0.32);
  g.stroke();

  // 유리 테두리
  g.strokeStyle = "rgba(255,255,255,0.4)";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.12)";
  g.lineWidth = 6;
  g.beginPath();
  g.arc(x, y, r - 4, 0, Math.PI * 2);
  g.stroke();
}

// 받침대: 유리구가 꽂히는 윗면(뒤쪽)과 몸통(앞쪽)을 나눠 그린다
const base = { top: 352, bottom: 452, topRx: 100, bottomRx: 128, ry: 14 };

// 받침대 몸통은 모든 나라가 같은 짙은 호두나무. 나라별 색은 테두리와 이름판에만
const BASE_BODY = ["#0f0a09", "#33241f", "#43302a", "#22171a", "#0a0606"];
const BASE_COLLAR = "#1a1210";

function paintBaseBack(g) {
  g.fillStyle = BASE_COLLAR;
  g.beginPath();
  g.ellipse(globe.x, base.top, base.topRx, base.ry, 0, 0, Math.PI * 2);
  g.fill();
}

function paintBaseFront(g) {
  const cx = globe.x;
  const { top, bottom, topRx, bottomRx, ry } = base;
  const look = scene.base;

  // 옻칠 몸통. 가운데가 밝아 둥근 원통처럼 보임
  const body = g.createLinearGradient(cx - bottomRx, 0, cx + bottomRx, 0);
  [0, 0.35, 0.5, 0.7, 1].forEach((stop, i) => body.addColorStop(stop, BASE_BODY[i]));
  g.fillStyle = body;
  g.beginPath();
  g.ellipse(cx, top, topRx, ry, 0, 0, Math.PI);
  g.lineTo(cx - bottomRx, bottom);
  g.ellipse(cx, bottom, bottomRx, ry, 0, Math.PI, 0, true);
  g.closePath();
  g.fill();

  // 위에서 비치는 빛
  const sheen = g.createLinearGradient(0, top, 0, bottom);
  sheen.addColorStop(0, "rgba(255,255,255,0.12)");
  sheen.addColorStop(0.3, "rgba(255,255,255,0)");
  g.fillStyle = sheen;
  g.fill();

  // 금속 테두리 두 줄
  const gold = g.createLinearGradient(cx - bottomRx, 0, cx + bottomRx, 0);
  [0, 0.45, 0.6, 1].forEach((stop, i) => gold.addColorStop(stop, look.trim[i]));
  g.strokeStyle = gold;
  for (const [yy, rx, w] of [
    [top + 3, topRx + 2, 3],
    [bottom - 6, bottomRx - 4, 2],
  ]) {
    g.lineWidth = w;
    g.beginPath();
    g.ellipse(cx, yy, rx, ry, 0, 0, Math.PI);
    g.stroke();
  }

  // 이름판. 글자 길이에 맞춰 폭을 정함
  const plateY = top + 50;
  g.font = look.plateFont;
  const plateW = g.measureText(look.plate).width + 24;
  g.fillStyle = gold;
  g.beginPath();
  g.roundRect(cx - plateW / 2, plateY - 13, plateW, 26, 4);
  g.fill();
  g.fillStyle = look.plateInk;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(look.plate, cx, plateY + 1);
}

// 주소에 나라가 없으면 한국부터
loadScene(location.hash.slice(1) || "korea");

// 소리 켜기/끄기
const soundButton = document.querySelector(".sound-toggle");
function showSound() {
  const off = sfx.isMuted();
  soundButton.dataset.muted = String(off);
  soundButton.setAttribute("aria-label", off ? "소리 켜기" : "소리 끄기");
  soundButton.title = off ? "소리 켜기" : "소리 끄기";
}
soundButton.addEventListener("click", () => {
  sfx.setMuted(!sfx.isMuted());
  showSound();
});
showSound();

const musicButton = document.querySelector(".music-toggle");
function showMusic() {
  const on = sfx.isMusicOn();
  musicButton.dataset.off = String(!on);
  musicButton.setAttribute("aria-label", on ? "배경음악 끄기" : "배경음악 켜기");
  musicButton.title = on ? "배경음악 끄기" : "배경음악 켜기";
}
musicButton.addEventListener("click", () => {
  sfx.setMusic(!sfx.isMusicOn());
  showMusic();
});
showMusic();

// 나라가 지정되지 않은 주소로 들어오면 지구본 선택창부터 보여줌
if (!location.hash) openPicker(SCENES, scene.id, switchScene, maybeTutorial);
else maybeTutorial();

function frame(t) {
  // 스노우볼이 손을 스프링처럼 따라가고, 놓으면 살짝 출렁이며 제자리로 돌아감
  // 클릭 흔들기 중에는 정해진 박자로 오르내리며 점점 약해짐
  const now = performance.now();
  const shakeT = now - autoShakeStart;
  if (shakeT < AUTO_SHAKE_MS) {
    target =
      AUTO_SHAKE_HEIGHT * autoShakePower * Math.sin((2 * Math.PI * shakeT) / AUTO_SHAKE_PERIOD) * (1 - shakeT / AUTO_SHAKE_MS);
  } else if (!dragging) {
    target = 0;
  }

  // 누르는 동안 납작해지고, 떼면 젤리처럼 늘어났다 출렁이며 돌아옴
  const squeezeTarget = pressing ? -0.13 * Math.min(1, (now - pressStart) / SQUEEZE_MS) : 0;
  squashVel += (squeezeTarget - squash) * 0.22;
  squashVel *= 0.8;
  squash += squashVel;

  globeVel += (target - offset) * 0.2;
  globeVel *= 0.75;
  offset += globeVel;
  const accel = globeVel - prevGlobeVel;
  prevGlobeVel = globeVel;

  update(t, accel);

  ctx.clearRect(0, 0, W, H);

  // 바닥 그림자. 들어 올리면 옅어짐
  ctx.save();
  ctx.globalAlpha = clamp(0.5 + (offset * VISUAL_SHAKE) / 120, 0.15, 0.7);
  const shadow = ctx.createRadialGradient(200, PAD + 462, 0, 200, PAD + 462, 150);
  shadow.addColorStop(0, "rgba(0,0,0,0.6)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(200, PAD + 462, 150, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(0, PAD + offset * VISUAL_SHAKE);
  // 받침대 바닥을 기준으로 위아래는 줄고 옆으로는 퍼짐
  ctx.translate(globe.x, base.bottom);
  ctx.scale(1 - squash * 0.7, 1 + squash);
  ctx.translate(-globe.x, -base.bottom);
  ctx.drawImage(layers.baseBack, 0, 0, W, H);
  ctx.drawImage(layers.scene, 0, 0, W, H);
  drawParticles(t);
  ctx.drawImage(layers.glass, 0, 0, W, H);
  ctx.drawImage(layers.baseFront, 0, 0, W, H);
  ctx.restore();

  if (fadeFrom) {
    const k = (performance.now() - fadeStart) / FADE_MS;
    if (k >= 1) {
      fadeFrom = null;
    } else {
      ctx.globalAlpha = 1 - k;
      ctx.drawImage(fadeFrom, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
