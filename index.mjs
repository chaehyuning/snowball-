import { fuji } from "./scene-fuji.mjs";
import { namsan } from "./scene-namsan.mjs";
import { quebec } from "./scene-quebec.mjs";

const SCENES = [fuji, namsan, quebec];

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
const waves = Array.from({ length: 5 }, () => {
  const angle = rand(0, Math.PI * 2);
  const k = rand(0.012, 0.03);
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
  return { x: u * stir * 0.5, y: v * stir * 0.5 };
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
    const p = { x: globe.x + rand(-120, 120), angle: 0, spin: 0, flip: 0, flipSpeed: 0 };
    Object.assign(p, scene.particles.make(rand));
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

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") stepScene(1);
  if (e.key === "ArrowLeft") stepScene(-1);
});

// 위아래로 끌면 흔들기, 좌우로 밀면 나라 바꾸기
canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const scale = H / canvas.getBoundingClientRect().height;
  target = clamp((e.clientY - startY) * scale, -MAX_OFFSET, MAX_OFFSET);
});

function release() {
  dragging = false;
  target = 0;
  canvas.style.cursor = "grab";
}
canvas.addEventListener("pointerup", (e) => {
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  release();
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) stepScene(dx < 0 ? 1 : -1);
});
canvas.addEventListener("pointercancel", release);

function update(t, accel) {
  // 흔든 만큼 물이 휘저어지고, 몇 초에 걸쳐 잦아든다
  stir = Math.min(stir + Math.abs(accel) * 0.12, 3);
  stir *= 0.99;

  for (const p of particles) {
    const flow = flowAt(p.x, p.y, t);

    if (p.settled) {
      // 스노우볼이 아래로 가속하는 힘 + 바닥 근처 물살이 입자마다 다른 기준을 넘으면 떠오름
      const lift = accel * p.inertia - flow.y + Math.hypot(flow.x, flow.y) * 0.3;
      if (lift > p.grip) {
        p.settled = false;
        p.vy = -Math.min(lift * rand(0.5, 1), 4);
        p.vx = flow.x + rand(-0.6, 0.6) * Math.min(lift, 3);
      }
      continue;
    }

    // 유리가 움직이면 물보다 무거운 입자는 뒤처진다
    p.vy -= accel * p.inertia;

    // 물 흐름 쪽으로 서서히 끌려가고, 물이 잔잔하면 제 무게만큼 가라앉는다
    p.vx += (flow.x - p.vx) * p.drag;
    p.vy += (flow.y + p.sink - p.vy) * p.drag;

    // 꽃잎처럼 납작한 입자는 뒤집힐 때마다 옆으로 미끄러지며 팔랑임
    p.vx += Math.cos(p.flip) * p.flutter;

    // 미세하게 흔들려서 한 줄로 뭉치지 않게 함
    const jitter = 0.03 + stir * 0.05;
    p.vx += rand(-jitter, jitter);
    p.vy += rand(-jitter, jitter);

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
  scene.animate?.(ctx, t);
  ctx.globalCompositeOperation = scene.particles.blend;
  for (const p of particles) scene.particles.draw(ctx, p, t);
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
  globeVel += (target - offset) * 0.2;
  globeVel *= 0.75;
  offset += globeVel;
  const accel = globeVel - prevGlobeVel;
  prevGlobeVel = globeVel;

  update(t, accel);

  ctx.clearRect(0, 0, W, H);

  // 바닥 그림자. 들어 올리면 옅어짐
  ctx.save();
  ctx.globalAlpha = clamp(0.5 + offset / 120, 0.15, 0.7);
  const shadow = ctx.createRadialGradient(200, PAD + 462, 0, 200, PAD + 462, 150);
  shadow.addColorStop(0, "rgba(0,0,0,0.6)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(200, PAD + 462, 150, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(0, PAD + offset);
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
