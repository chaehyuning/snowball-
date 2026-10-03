import { paintFuji, SAKURA_COLORS } from "./scene-fuji.mjs";

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
const PETAL_COUNT = 220;
const MAX_OFFSET = 50; // 흔들 수 있는 최대 거리

// 흔들기 상태 (스노우볼은 손을 스프링처럼 따라감)
let dragging = false;
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

// 꽃잎마다 무게·저항·떠오르기 쉬운 정도를 다르게 준다.
// 꽃잎은 눈보다 가볍고 넓어서 천천히 가라앉고 물살을 잘 탄다.
const petals = Array.from({ length: PETAL_COUNT }, () => {
  const size = rand(2.6, 4.6);
  const p = {
    x: globe.x + rand(-120, 120),
    size,
    color: SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)],
    sink: 0.1 + size * 0.03 + rand(-0.03, 0.03), // 가라앉는 속도
    drag: rand(0.08, 0.13), // 물 흐름을 따라가는 정도
    inertia: rand(0.3, 0.6), // 흔들림에 반응하는 정도
    grip: rand(0.4, 1.8), // 바닥에서 떠오르기 어려운 정도
    angle: rand(0, Math.PI * 2),
    spin: rand(-0.04, 0.04),
    flip: 0, // 뒤집히는 각도
    flipSpeed: rand(0.03, 0.08),
  };
  settle(p);
  return p;
});

// 드래그로 위아래 흔들기
canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
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
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);

function update(t, accel) {
  // 흔든 만큼 물이 휘저어지고, 몇 초에 걸쳐 잦아든다
  stir = Math.min(stir + Math.abs(accel) * 0.12, 3);
  stir *= 0.99;

  for (const p of petals) {
    const flow = flowAt(p.x, p.y, t);

    if (p.settled) {
      // 스노우볼이 아래로 가속하는 힘 + 바닥 근처 물살이 꽃잎마다 다른 기준을 넘으면 떠오름
      const lift = accel * p.inertia - flow.y + Math.hypot(flow.x, flow.y) * 0.3;
      if (lift > p.grip) {
        p.settled = false;
        p.vy = -Math.min(lift * rand(0.5, 1), 4);
        p.vx = flow.x + rand(-0.6, 0.6) * Math.min(lift, 3);
      }
      continue;
    }

    // 유리가 움직이면 물보다 무거운 꽃잎은 뒤처진다
    p.vy -= accel * p.inertia;

    // 물 흐름 쪽으로 서서히 끌려가고, 물이 잔잔하면 제 무게만큼 가라앉는다
    p.vx += (flow.x - p.vx) * p.drag;
    p.vy += (flow.y + p.sink - p.vy) * p.drag;

    // 꽃잎이 뒤집힐 때마다 옆으로 미끄러지며 팔랑임
    p.vx += Math.cos(p.flip) * 0.025;

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

// 벚꽃잎: 끝이 V자로 살짝 갈라진 둥근 잎
function drawPetal(p) {
  const s = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // 뒤집히는 각도에 따라 폭이 줄었다 늘었다 해서 회전하는 것처럼 보임
  ctx.scale(Math.max(0.2, Math.abs(Math.cos(p.flip))), 1);
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.bezierCurveTo(-s * 0.95, s * 0.25, -s * 0.75, -s * 0.9, -s * 0.22, -s);
  ctx.lineTo(0, -s * 0.72);
  ctx.lineTo(s * 0.22, -s);
  ctx.bezierCurveTo(s * 0.75, -s * 0.9, s * 0.95, s * 0.25, 0, s);
  ctx.fill();
  ctx.restore();
}

function drawPetals() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  ctx.clip();
  for (const p of petals) {
    ctx.globalAlpha = p.settled ? 0.95 : 0.75 + p.size * 0.05;
    drawPetal(p);
  }
  ctx.globalAlpha = 1;
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
  soft.addColorStop(0, "rgba(255,255,255,0.45)");
  soft.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = soft;
  g.beginPath();
  g.ellipse(0, 0, 70, 38, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // 또렷한 작은 반사점
  g.fillStyle = "rgba(255,255,255,0.85)";
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
  g.fillStyle = "#1d1214";
  g.beginPath();
  g.ellipse(globe.x, base.top, base.topRx, base.ry, 0, 0, Math.PI * 2);
  g.fill();
}

function paintBaseFront(g) {
  const cx = globe.x;
  const { top, bottom, topRx, bottomRx, ry } = base;

  // 검은 옻칠 몸통. 가운데가 밝아 둥근 원통처럼 보임
  const body = g.createLinearGradient(cx - bottomRx, 0, cx + bottomRx, 0);
  body.addColorStop(0, "#0e0809");
  body.addColorStop(0.35, "#3a2426");
  body.addColorStop(0.5, "#4a2f30");
  body.addColorStop(0.7, "#24161a");
  body.addColorStop(1, "#0b0607");
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

  // 금색 테두리 두 줄
  const gold = g.createLinearGradient(cx - bottomRx, 0, cx + bottomRx, 0);
  gold.addColorStop(0, "#7a5a1c");
  gold.addColorStop(0.45, "#f2d17a");
  gold.addColorStop(0.6, "#c99a35");
  gold.addColorStop(1, "#6b4d16");
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

  // 이름판
  const plateY = top + 50;
  g.fillStyle = gold;
  g.beginPath();
  g.roundRect(cx - 58, plateY - 13, 116, 26, 4);
  g.fill();
  g.fillStyle = "#2b1d10";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "600 13px 'Hiragino Mincho ProN', 'Yu Mincho', serif";
  g.fillText("富士山 · MT. FUJI", cx, plateY + 1);
}

const baseBackLayer = makeLayer(paintBaseBack);
const sceneLayer = makeLayer((g) => paintFuji(g, globe, groundAt));
const glassLayer = makeLayer(paintGlass);
const baseFrontLayer = makeLayer(paintBaseFront);

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
  ctx.drawImage(baseBackLayer, 0, 0, W, H);
  ctx.drawImage(sceneLayer, 0, 0, W, H);
  drawPetals();
  ctx.drawImage(glassLayer, 0, 0, W, H);
  ctx.drawImage(baseFrontLayer, 0, 0, W, H);
  ctx.restore();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
