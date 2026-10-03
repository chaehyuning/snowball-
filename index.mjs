import { fuji } from "./scene-fuji.mjs";
import { namsan } from "./scene-namsan.mjs";
import { quebec } from "./scene-quebec.mjs";
import { sydney } from "./scene-sydney.mjs";
import { santa } from "./scene-santa.mjs";
import { forbidden } from "./scene-forbidden.mjs";

const SCENES = [fuji, namsan, quebec, sydney, santa, forbidden];

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

function startAutoShake(power = 1) {
  autoShakeStart = performance.now();
  autoShakePower = power;
}

// 누르고 떼면 누른 자리에서 물이 유리구 안쪽으로 밀려 들어감.
// 물리적으로는 서로 반대로 도는 소용돌이 한 쌍이 생겨, 가운데로는 물이 뿜어져 나가고
// 양옆으로는 말려 돌아오는 버섯 모양 흐름이 된다. 입자는 이 물에 실려 움직인다.
const vortices = [];

function burst(x, y, power) {
  let nx = globe.x - x;
  let ny = globe.y - 20 - y;
  const n = Math.hypot(nx, ny);
  if (n < 20) {
    nx = 0;
    ny = -1;
  } else {
    nx /= n;
    ny /= n;
  }
  const px = -ny;
  const py = nx;
  const qx = x + nx * 25;
  const qy = y + ny * 25;
  const g = 1300 * power;
  vortices.push({ x: qx + px * 28, y: qy + py * 28, g, rc: 25 }, { x: qx - px * 28, y: qy - py * 28, g: -g, rc: 25 });
  stir = Math.min(stir + 0.8 * power, 5);
  rings.push({ x, y, start: performance.now(), power });
  try {
    navigator.vibrate?.(power > 0.75 ? 30 : 15);
  } catch {}
}

// 소용돌이 하나가 (x, y)에 만드는 물의 속도 (중심 가까이는 부드럽게 0으로)
function vortexAt(w, x, y) {
  const dx = x - w.x;
  const dy = y - w.y;
  const r2 = dx * dx + dy * dy + 1;
  const f = (w.g / (2 * Math.PI * r2)) * (1 - Math.exp(-r2 / (w.rc * w.rc)));
  return { u: -f * dy, v: f * dx };
}

// 소용돌이는 서로를 밀며 함께 흘러가고, 물의 끈적임 때문에 약해지며 넓게 퍼짐
function updateVortices() {
  for (const w of vortices) {
    let u = 0;
    let v = 0;
    for (const o of vortices) {
      if (o === w) continue;
      const vel = vortexAt(o, w.x, w.y);
      u += vel.u;
      v += vel.v;
    }
    w.x += u * 0.5;
    w.y += v * 0.5;
  }
  for (const w of vortices) {
    w.g *= 0.986;
    w.rc += 0.25;
  }
  for (let i = vortices.length - 1; i >= 0; i--) {
    const w = vortices[i];
    if (Math.abs(w.g) < 30 || Math.hypot(w.x - globe.x, w.y - globe.y) > globe.r) vortices.splice(i, 1);
  }
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
function makeLayer(paint) {
  const layer = document.createElement("canvas");
  layer.width = W * dpr;
  layer.height = H * dpr;
  const g = layer.getContext("2d");
  g.scale(dpr, dpr);
  paint(g);
  return layer;
}

// 물속 소용돌이. 방향이 다른 물결 몇 개를 겹친 흐름 함수(psi)로 만든다.
// psi에 유리 경계에서 0이 되는 값을 곱해서, 물이 벽을 뚫지 않고 벽을 따라 돈다.
// 흔들어서 생기는 물살은 유리구 크기만 한 큰 소용돌이 몇 개로 둠
const waves = Array.from({ length: 3 }, () => {
  const angle = rand(0, Math.PI * 2);
  const k = rand(0.008, 0.015);
  return {
    kx: Math.cos(angle) * k,
    ky: Math.sin(angle) * k,
    speed: rand(0.0004, 0.0012),
    phase: rand(0, Math.PI * 2),
  };
});

function streamAt(x, y, t) {
  let psi = 0;
  for (const w of waves) {
    const k = Math.hypot(w.kx, w.ky);
    psi += Math.sin(w.kx * x + w.ky * y + w.speed * t + w.phase) / k;
  }
  const dx = (x - globe.x) / globe.r;
  const dy = (y - globe.y) / globe.r;
  return psi * Math.max(0, 1 - dx * dx - dy * dy);
}

function flowAt(x, y, t) {
  const h = 1;
  const u = (streamAt(x, y + h, t) - streamAt(x, y - h, t)) / (2 * h);
  const v = -(streamAt(x + h, y, t) - streamAt(x - h, y, t)) / (2 * h);
  let x2 = u * stir * 0.8;
  let y2 = v * stir * 0.8;
  for (const w of vortices) {
    const vel = vortexAt(w, x, y);
    x2 += vel.u;
    y2 += vel.v;
  }
  return { x: x2, y: y2 };
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
    baseBack: makeLayer(paintBaseBack),
    scene: makeLayer((g) => scene.paint(g, globe, groundAt)),
    glass: makeLayer(paintGlass),
    baseFront: makeLayer(paintBaseFront),
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
    settle(p);
    return p;
  });
  stir = 0;
  document.title = `Snowball · ${scene.title}`;
  for (const button of document.querySelectorAll("[data-scene]")) {
    button.setAttribute("aria-pressed", String(button.dataset.scene === scene.id));
  }
}

// 장면이 바뀔 때 직전 화면을 잠깐 겹쳐 그려 부드럽게 넘어가게 함
const FADE_MS = 350;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let fadeFrom = null;
let fadeStart = 0;

function switchScene(id) {
  if (id === scene.id) return;
  if (!reduceMotion.matches) {
    fadeFrom = document.createElement("canvas");
    fadeFrom.width = canvas.width;
    fadeFrom.height = canvas.height;
    fadeFrom.getContext("2d").drawImage(canvas, 0, 0);
    fadeStart = performance.now();
  }
  history.replaceState(null, "", `#${id}`);
  loadScene(id);
}

// 1이면 다음 나라, -1이면 이전 나라. 끝에서는 처음으로 돌아감
function stepScene(dir) {
  const i = SCENES.indexOf(scene);
  switchScene(SCENES[(i + dir + SCENES.length) % SCENES.length].id);
}

for (const button of document.querySelectorAll("[data-scene]")) {
  button.addEventListener("click", () => switchScene(button.dataset.scene));
}

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
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  // 손가락이 움직이면 누르기가 아니라 밀기·끌기로 봄
  if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) pressing = false;
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
});
canvas.addEventListener("pointercancel", release);

function update(t, accel) {
  // 흔든 만큼 물이 휘저어지고, 몇 초에 걸쳐 잦아든다
  stir = Math.min(stir + Math.abs(accel) * 0.25, 5);
  stir *= 0.993;
  updateVortices();

  for (const p of particles) {
    const flow = flowAt(p.x, p.y, t);

    if (p.settled) {
      // 스노우볼이 아래로 가속하는 힘 + 바닥 근처 물살이 입자마다 다른 기준을 넘으면 떠오름
      const lift = accel * p.inertia - flow.y + Math.hypot(flow.x, flow.y) * 0.3;
      if (lift > p.grip) {
        // 물에 들려 올라감. 가벼운 입자일수록(inertia가 작을수록) 물을 더 잘 따라감
        p.settled = false;
        p.vy = Math.min(flow.y, 0) - Math.min(lift, 7) * (0.5 + p.inertia);
        p.vx = flow.x;
      }
      continue;
    }

    // 유리가 움직이면 물보다 무거운 입자는 뒤처진다
    p.vy -= accel * p.inertia;

    // 점성 저항: 입자 속도는 (물의 속도 + 제 무게로 가라앉는 속도)를 향해 서서히 맞춰짐.
    // 크고 무거운 입자일수록 drag가 작아 늦게 맞춰지고 sink가 커서 빨리 가라앉음
    p.vx += (flow.x - p.vx) * p.drag;
    p.vy += (flow.y + p.sink - p.vy) * p.drag;

    // 꽃잎처럼 납작한 입자는 뒤집힐 때마다 옆으로 미끄러지며 팔랑임
    p.vx += Math.cos(p.flip) * p.flutter;

    p.x += p.vx;
    p.y += p.vy;

    // 빨리 움직일수록 빨리 돌고 뒤집힘
    const speed = Math.hypot(p.vx, p.vy);
    p.angle += p.spin * (1 + speed * 2);
    p.flip += p.flipSpeed * (1 + speed);

    // 유리 벽에 닿으면 벽을 따라 미끄러짐. 물속이라 거의 튕기지 않음
    const dx = p.x - globe.x;
    const dy = p.y - globe.y;
    const d = Math.hypot(dx, dy);
    const max = globe.r - p.size - 3;
    if (d > max) {
      const nx = dx / d;
      const ny = dy / d;
      const out = p.vx * nx + p.vy * ny;
      if (out > 0) {
        p.vx -= 1.2 * out * nx;
        p.vy -= 1.2 * out * ny;
      }
      p.x = globe.x + nx * max;
      p.y = globe.y + ny * max;
    }

    // 바닥에 닿았을 때 물살이 약하면 내려앉고, 세면 바닥을 따라 쓸려감
    const ground = groundAt(p.x) - 1;
    if (p.y >= ground && p.vy >= 0) {
      if (Math.hypot(flow.x, flow.y) < p.grip) {
        settle(p);
      } else {
        p.y = ground;
        p.vy = 0;
      }
    }
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

  // 충격파 고리: 0.6초 동안 커지며 사라짐
  const now = performance.now();
  rings = rings.filter((ring) => now - ring.start < 600);
  ctx.globalCompositeOperation = "source-over";
  for (const ring of rings) {
    const k = (now - ring.start) / 600;
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

function paintBaseBack(g) {
  g.fillStyle = scene.base.collar;
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
  [0, 0.35, 0.5, 0.7, 1].forEach((stop, i) => body.addColorStop(stop, look.body[i]));
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

loadScene(location.hash.slice(1));

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
