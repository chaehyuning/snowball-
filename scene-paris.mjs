// 프랑스: 푸른 저녁의 파리, 불 켜진 에펠탑과 장미 덤불, 흩날리는 장미 꽃잎

import { seeded, fillSilhouette } from "./util.mjs";

const ROSE = ["#b3123a", "#d81b4a", "#8e0f2e", "#e0405f", "#c2185b"];
const IRON = ["#f2c66a", "#d9a441", "#9a6a24"]; // 조명을 받은 철골

// 에펠탑 윤곽: 바닥에서 위로 갈수록 오목하게 좁아짐
const TOWER = { cx: 200, base: 300, top: 78 };
function towerHalf(y) {
  const t = (TOWER.base - y) / (TOWER.base - TOWER.top);
  return 62 * Math.pow(1 - t, 2.2) + 2.5;
}

let sparkles = [];

function paintParis(g, globe, groundAt) {
  const rnd = seeded(1889);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 푸른 저녁: 위는 남보라, 지평선은 장밋빛
  const sky = g.createLinearGradient(0, top, 0, 280);
  sky.addColorStop(0, "#1b2452");
  sky.addColorStop(0.45, "#3f4385");
  sky.addColorStop(0.78, "#a36a98");
  sky.addColorStop(1, "#eba3a0");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(255,255,255,${r(0.3, 0.8)})`;
    g.beginPath();
    g.arc(r(left, right), r(top, 150), r(0.3, 0.9), 0, Math.PI * 2);
    g.fill();
  }

  // 파리 지붕들: 회청색 함석지붕, 굴뚝, 불 켜진 창
  for (let x = left; x < right; ) {
    const w = r(14, 26);
    const h = r(14, 30) * (0.6 + Math.abs(x + w / 2 - 200) / 200);
    const roofTop = 282 - h;
    g.fillStyle = ["#d9c7b4", "#cbb6a2", "#e2d2c0"][Math.floor(rnd() * 3)];
    g.globalAlpha = 0.9;
    g.fillRect(x, roofTop + 6, w - 1, h + 20);
    g.fillStyle = "#5d6680";
    g.beginPath();
    g.moveTo(x - 1, roofTop + 7);
    g.lineTo(x + 3, roofTop);
    g.lineTo(x + w - 4, roofTop);
    g.lineTo(x + w, roofTop + 7);
    g.closePath();
    g.fill();
    g.fillStyle = "#8a6a5a";
    g.fillRect(x + w * 0.3, roofTop - 5, 3, 5);
    g.globalAlpha = 1;
    for (let wy = roofTop + 10; wy < 300; wy += 6) {
      for (let wx = x + 3; wx < x + w - 4; wx += 5) {
        g.fillStyle = rnd() < 0.45 ? "#ffd58a" : "#6b6a80";
        g.fillRect(wx, wy, 2, 3);
      }
    }
    x += w;
  }

  // 탑 뒤로 번지는 조명
  const glow = g.createRadialGradient(200, 200, 0, 200, 200, 130);
  glow.addColorStop(0, "rgba(255,200,120,0.35)");
  glow.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = glow;
  g.fillRect(left, top, size, size);

  paintTower(g);

  // 샹드마르스 공원 나무들
  for (const [tx, ty, tr] of [[118, 300, 18], [92, 304, 15], [282, 300, 18], [308, 304, 15]]) {
    g.fillStyle = "#1f3b3a";
    g.beginPath();
    g.ellipse(tx, ty - tr, tr, tr * 1.1, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,200,140,0.15)";
    g.beginPath();
    g.ellipse(tx + tr * 0.3, ty - tr * 1.3, tr * 0.5, tr * 0.5, 0, 0, Math.PI * 2);
    g.fill();
  }

  // 앞쪽 장미 덤불
  roseBush(g, rnd, 52, 336, 46);
  roseBush(g, rnd, 348, 338, 46);

  // 바닥: 장미 꽃잎이 흩어진 산책로
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#d8c6b8");
  floor.addColorStop(1, "#9c8478");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  for (let i = 0; i < 260; i++) {
    const x = r(left, right);
    const y = groundAt(x) + r(2, 45);
    g.globalAlpha = r(0.5, 0.9);
    g.fillStyle = ROSE[Math.floor(rnd() * ROSE.length)];
    g.beginPath();
    g.ellipse(x, y, r(1.4, 2.8), r(0.9, 1.6), r(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  g.restore();
}

// 에펠탑: 아치가 뚫린 네 다리, 두 층 전망대, 꼭대기 안테나. 철골은 X자 격자
function paintTower(g) {
  const { cx, base, top } = TOWER;
  const archTop = 262;
  const legInner = 36;

  g.save();
  g.beginPath();
  g.moveTo(cx - towerHalf(base), base);
  for (let y = base; y >= top; y -= 2) g.lineTo(cx - towerHalf(y), y);
  for (let y = top; y <= base; y += 2) g.lineTo(cx + towerHalf(y), y);
  g.lineTo(cx + legInner, base);
  g.quadraticCurveTo(cx + legInner * 0.8, archTop, cx, archTop);
  g.quadraticCurveTo(cx - legInner * 0.8, archTop, cx - legInner, base);
  g.closePath();
  const iron = g.createLinearGradient(cx - 60, 0, cx + 60, 0);
  iron.addColorStop(0, IRON[2]);
  iron.addColorStop(0.45, IRON[0]);
  iron.addColorStop(1, IRON[1]);
  g.fillStyle = iron;
  g.fill();
  g.clip();

  // X자 철골 격자
  g.strokeStyle = "rgba(70,40,10,0.55)";
  g.lineWidth = 0.6;
  for (let y = top; y < base; y += 6) {
    const w1 = towerHalf(y);
    const w2 = towerHalf(y + 6);
    g.beginPath();
    g.moveTo(cx - w1, y);
    g.lineTo(cx + w2, y + 6);
    g.moveTo(cx + w1, y);
    g.lineTo(cx - w2, y + 6);
    g.stroke();
  }
  g.restore();

  // 전망대 두 층
  for (const [y, h] of [[245, 5], [195, 4]]) {
    const w = towerHalf(y) + 6;
    g.fillStyle = "#7a4e1a";
    g.fillRect(cx - w, y - h, w * 2, h);
    g.fillStyle = "#ffe2a0";
    for (let x = cx - w + 2; x < cx + w - 1; x += 3) g.fillRect(x, y - h + 1, 1.4, 1.6);
  }
  // 꼭대기 전망대와 안테나
  g.fillStyle = "#c58f3a";
  g.fillRect(cx - 5, top - 4, 10, 5);
  g.fillStyle = "#9a6a24";
  g.fillRect(cx - 1, top - 18, 2, 14);
  g.fillRect(cx - 0.5, top - 26, 1, 8);

  // 반짝임 조명이 켜지는 자리 (animate에서 사용)
  const rnd = seeded(20);
  sparkles = Array.from({ length: 70 }, () => {
    const y = top + rnd() * (base - top - 10);
    const w = towerHalf(y);
    return { x: cx + (rnd() * 2 - 1) * w, y, phase: rnd() * 6.28, speed: 0.006 + rnd() * 0.01 };
  });
}

// 장미 덤불: 짙은 잎 덩어리 위에 겹꽃 장미
function roseBush(g, rnd, x, y, w) {
  const r = (a, b) => a + rnd() * (b - a);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = ["#1e3d2a", "#2a5236", "#183223"][Math.floor(rnd() * 3)];
    g.beginPath();
    g.ellipse(x + r(-w, w), y - r(0, w * 0.9), r(4, 8), r(3, 5), r(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 18; i++) {
    const bx = x + r(-w * 0.85, w * 0.85);
    const by = y - r(4, w * 0.85);
    const br = r(3.5, 6);
    const color = ROSE[Math.floor(rnd() * ROSE.length)];
    for (let k = 0; k < 3; k++) {
      g.fillStyle = color;
      g.globalAlpha = 1 - k * 0.15;
      g.beginPath();
      g.arc(bx, by, br * (1 - k * 0.3), 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(60,0,15,0.5)";
      g.lineWidth = 0.6;
      g.beginPath();
      g.arc(bx + k * 0.4, by - k * 0.3, br * (1 - k * 0.3) * 0.75, 0.4 + k, 3.6 + k);
      g.stroke();
    }
    g.globalAlpha = 1;
  }
}

// 매 시 정각처럼 탑 전체에 흰 조명이 반짝이고, 꼭대기 서치라이트가 돎
function animateParis(ctx, t) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const s of sparkles) {
    const a = Math.max(0, Math.sin(t * s.speed + s.phase));
    if (a < 0.7) continue;
    ctx.globalAlpha = (a - 0.7) * 3;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  const angle = Math.sin(t * 0.0006) * 0.9;
  const beam = ctx.createLinearGradient(TOWER.cx, TOWER.top - 20, TOWER.cx + Math.cos(angle) * 160, TOWER.top - 20);
  beam.addColorStop(0, "rgba(255,240,200,0.35)");
  beam.addColorStop(1, "rgba(255,240,200,0)");
  ctx.globalAlpha = 1;
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(TOWER.cx, TOWER.top - 18);
  ctx.lineTo(TOWER.cx + Math.cos(angle) * 170, TOWER.top - 18 + Math.sin(angle) * 40 - 10);
  ctx.lineTo(TOWER.cx + Math.cos(angle) * 170, TOWER.top - 18 + Math.sin(angle) * 40 + 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 장미 꽃잎: 끝이 갈라지지 않은 둥근 꽃잎, 안쪽은 짙고 가장자리는 밝음
function drawRosePetal(ctx, p) {
  const s = p.size;
  ctx.globalAlpha = p.settled ? 0.95 : 0.92;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(Math.max(0.2, Math.abs(Math.cos(p.flip))), 1);
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.bezierCurveTo(-s * 1.1, s * 0.4, -s * 1.0, -s * 1.0, 0, -s * 0.85);
  ctx.bezierCurveTo(s * 1.0, -s * 1.0, s * 1.1, s * 0.4, 0, s);
  ctx.fill();
  ctx.fillStyle = "rgba(60,0,15,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.45, s * 0.3, s * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const paris = {
  id: "france",
  label: "프랑스 · 에펠탑",
  title: "Tour Eiffel",
  paint: paintParis,
  animate: animateParis,
  glare: 0.55,
  base: {
    body: ["#0a0608", "#2a1a22", "#3a2430", "#1c1016", "#060304"],
    collar: "#140a0e",
    trim: ["#7a3a3a", "#f2b8a8", "#c97c74", "#6b3030"],
    plate: "TOUR EIFFEL · PARIS",
    plateFont: "italic 600 13px 'Didot', 'Bodoni 72', Georgia, serif",
    plateInk: "#3a0d18",
  },
  // 장미 꽃잎은 벚꽃잎보다 크고 도톰해서 조금 더 빨리 떨어짐
  particles: {
    count: 150,
    blend: "source-over",
    make(rand) {
      const size = rand(3.2, 5);
      return {
        size,
        color: ROSE[Math.floor(rand(0, ROSE.length))],
        sink: 0.12 + size * 0.03 + rand(-0.03, 0.03),
        drag: rand(0.08, 0.12),
        inertia: rand(0.3, 0.6),
        grip: rand(0.4, 1.8),
        angle: rand(0, Math.PI * 2),
        spin: rand(-0.04, 0.04),
        flipSpeed: rand(0.03, 0.07),
        flutter: 0.025,
      };
    },
    draw: drawRosePetal,
  },
};
