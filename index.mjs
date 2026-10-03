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

// 눈 언덕 표면의 y 좌표
function groundAt(x) {
  const t = (x - mound.x) / mound.rx;
  if (Math.abs(t) >= 1) return mound.y;
  return mound.y - mound.ry * Math.sqrt(1 - t * t);
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

function settle(f) {
  f.y = groundAt(f.x) - f.size * 0.5 + rand(0, 3);
  f.vx = 0;
  f.vy = 0;
  f.settled = true;
}

// 입자마다 무게·저항·떠오르기 쉬운 정도를 다르게 준다
const flakes = Array.from({ length: FLAKE_COUNT }, () => {
  const size = rand(1, 3.5);
  const f = {
    x: globe.x + rand(-115, 115),
    size,
    sink: 0.15 + size * 0.09 + rand(-0.05, 0.05), // 가라앉는 속도
    drag: 0.1 - size * 0.015 + rand(-0.01, 0.01), // 물 흐름을 따라가는 정도 (작을수록 둔함)
    inertia: rand(0.3, 0.7), // 흔들림에 반응하는 정도
    grip: rand(0.5, 2.2), // 바닥에서 떠오르기 어려운 정도
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
  // 흔든 만큼 물이 휘저어지고, 몇 초에 걸쳐 잦아든다
  stir = Math.min(stir + Math.abs(accel) * 0.12, 3);
  stir *= 0.99;

  for (const f of flakes) {
    const flow = flowAt(f.x, f.y, t);

    if (f.settled) {
      // 스노우볼이 아래로 가속하는 힘 + 바닥 근처 물살이 입자마다 다른 기준을 넘으면 떠오름
      const lift = accel * f.inertia - flow.y + Math.hypot(flow.x, flow.y) * 0.3;
      if (lift > f.grip) {
        f.settled = false;
        f.vy = -Math.min(lift * rand(0.5, 1), 4);
        f.vx = flow.x + rand(-0.6, 0.6) * Math.min(lift, 3);
      }
      continue;
    }

    // 유리가 움직이면 물보다 무거운 눈은 뒤처진다
    f.vy -= accel * f.inertia;

    // 물 흐름 쪽으로 서서히 끌려가고, 물이 잔잔하면 제 무게만큼 가라앉는다
    f.vx += (flow.x - f.vx) * f.drag;
    f.vy += (flow.y + f.sink - f.vy) * f.drag;

    // 입자마다 미세하게 흔들려서 한 줄로 뭉치지 않게 함
    const jitter = 0.04 + stir * 0.05;
    f.vx += rand(-jitter, jitter);
    f.vy += rand(-jitter, jitter);

    f.x += f.vx;
    f.y += f.vy;

    // 유리 벽에 닿으면 벽을 따라 미끄러짐
    const dx = f.x - globe.x;
    const dy = f.y - globe.y;
    const d = Math.hypot(dx, dy);
    const max = globe.r - f.size - 3;
    if (d > max) {
      const nx = dx / d;
      const ny = dy / d;
      const out = f.vx * nx + f.vy * ny;
      if (out > 0) {
        f.vx -= out * nx;
        f.vy -= out * ny;
      }
      f.x = globe.x + nx * max;
      f.y = globe.y + ny * max;
    }

    // 언덕에 닿았을 때 물살이 약하면 쌓이고, 세면 바닥을 따라 쓸려감
    const ground = groundAt(f.x) - f.size * 0.5;
    if (f.y >= ground && f.vy >= 0) {
      if (Math.hypot(flow.x, flow.y) < f.grip) {
        settle(f);
      } else {
        f.y = ground;
        f.vy = 0;
      }
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
    // 작은 입자는 흐리게 그려서 앞뒤 깊이감을 줌
    ctx.globalAlpha = f.settled ? 0.95 : 0.55 + f.size * 0.12;
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
  // 스노우볼이 손을 스프링처럼 따라가고, 놓으면 살짝 출렁이며 제자리로 돌아감
  globeVel += (target - offset) * 0.2;
  globeVel *= 0.75;
  offset += globeVel;
  const accel = globeVel - prevGlobeVel;
  prevGlobeVel = globeVel;

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
