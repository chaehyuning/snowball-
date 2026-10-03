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
const FLAKE_COUNT = 260;
const MAX_OFFSET = 50; // 흔들 수 있는 최대 거리
const LIFT = 0.6; // 이 값보다 세게 흔들어야 눈이 떠오름
const MAX_SPEED = 7;

// 흔들기 상태
let dragging = false;
let startY = 0;
let target = 0;
let offset = 0;
let prevOffset = 0;
let prevVel = 0;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// 눈 언덕 표면의 y 좌표
function groundAt(x) {
  const t = (x - mound.x) / mound.rx;
  if (Math.abs(t) >= 1) return mound.y;
  return mound.y - mound.ry * Math.sqrt(1 - t * t);
}

function settle(f) {
  f.y = groundAt(f.x) - f.size * 0.5;
  f.vx = 0;
  f.vy = 0;
  f.settled = true;
}

// 처음에는 모든 눈이 바닥에 가라앉은 상태
const flakes = Array.from({ length: FLAKE_COUNT }, () => {
  const f = {
    x: globe.x + (Math.random() * 2 - 1) * 115,
    size: 1 + Math.random() * 2.5,
    phase: Math.random() * Math.PI * 2,
  };
  settle(f);
  return f;
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
  for (const f of flakes) {
    if (f.settled) {
      // 스노우볼이 아래로 가속하면 눈이 상대적으로 위로 떠오름
      if (accel > LIFT && Math.random() < Math.min(1, 0.2 + (accel - LIFT) * 0.5)) {
        f.settled = false;
        f.vy = -accel * (0.8 + Math.random() * 1.5);
        f.vx = (Math.random() - 0.5) * accel * 2;
      }
      continue;
    }

    // 떠 있는 눈은 흔드는 반대 방향으로 밀림
    f.vy -= accel * 0.9;
    f.vx += (Math.random() - 0.5) * Math.abs(accel) * 0.3;
    f.vx = clamp(f.vx * 0.97, -MAX_SPEED, MAX_SPEED);
    f.vy = clamp(f.vy * 0.97, -MAX_SPEED, MAX_SPEED);

    f.x += f.vx + Math.sin(t * 0.0015 + f.phase) * 0.3;
    f.y += f.vy + 0.15 + f.size * 0.08;

    // 유리 벽에 부딪히면 안쪽으로 되돌림
    const dx = f.x - globe.x;
    const dy = f.y - globe.y;
    const d = Math.hypot(dx, dy);
    const max = globe.r - f.size - 3;
    if (d > max) {
      f.x = globe.x + (dx / d) * max;
      f.y = globe.y + (dy / d) * max;
      f.vx *= -0.4;
      f.vy *= -0.4;
    }

    // 언덕에 닿으면 쌓임
    if (f.y >= groundAt(f.x) - f.size && f.vy >= -0.5) {
      settle(f);
    }
  }
}

function drawTree(x, baseY) {
  ctx.fillStyle = "#5b3a1e";
  ctx.fillRect(x - 6, baseY - 20, 12, 22);

  ctx.fillStyle = "#1f6b45";
  for (let i = 0; i < 3; i++) {
    const w = 60 - i * 14;
    const y = baseY - 20 - i * 30;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x, y - 55);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#ffd54a";
  ctx.beginPath();
  ctx.arc(x, baseY - 135, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawScene() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  ctx.clip();

  const sky = ctx.createLinearGradient(0, globe.y - globe.r, 0, globe.y + globe.r);
  sky.addColorStop(0, "#1b2f5c");
  sky.addColorStop(1, "#4a6fa5");
  ctx.fillStyle = sky;
  ctx.fillRect(globe.x - globe.r, globe.y - globe.r, globe.r * 2, globe.r * 2);

  drawTree(200, 315);

  ctx.fillStyle = "#eef4ff";
  ctx.beginPath();
  ctx.ellipse(mound.x, mound.y, mound.rx, mound.ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  for (const f of flakes) {
    ctx.globalAlpha = f.settled ? 0.95 : 0.85;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawGlass() {
  const g = ctx.createRadialGradient(
    globe.x - 60, globe.y - 70, 10,
    globe.x, globe.y, globe.r
  );
  g.addColorStop(0, "rgba(255,255,255,0.35)");
  g.addColorStop(0.4, "rgba(255,255,255,0.05)");
  g.addColorStop(1, "rgba(255,255,255,0.2)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(globe.x, globe.y, globe.r - 22, Math.PI * 1.1, Math.PI * 1.35);
  ctx.stroke();
}

function drawBase() {
  const wood = ctx.createLinearGradient(0, 350, 0, 460);
  wood.addColorStop(0, "#8b5a2b");
  wood.addColorStop(1, "#4a2c12");
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(95, 350);
  ctx.lineTo(305, 350);
  ctx.lineTo(340, 460);
  ctx.lineTo(60, 460);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#c9a227";
  ctx.fillRect(81, 395, 238, 8);
}

function frame(t) {
  // 스노우볼 위치를 부드럽게 따라가게 하고 가속도 계산
  offset += (target - offset) * 0.35;
  const vel = offset - prevOffset;
  const accel = vel - prevVel;
  prevOffset = offset;
  prevVel = vel;

  update(t, accel);

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(0, PAD + offset);
  drawScene();
  drawGlass();
  drawBase();
  ctx.restore();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
