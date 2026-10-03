// 중국: 가을 자금성 태화전과 은행나무, 흩날리는 은행잎

import { seeded, fillSilhouette, paintTree } from "./util.mjs";

const GINKGO = ["#ffd84a", "#f5c000", "#ffe682", "#eaa800", "#fff0a8"];
const GOLD_ROOF = ["#f6c838", "#d9a21c", "#a87410"];
const RED = ["#b8261c", "#962018", "#7a1810"];

function paintForbidden(g, globe, groundAt) {
  const rnd = seeded(1420);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 금빛 해 질 녘: 위는 푸르고 지붕 뒤로 갈수록 황금빛·주황빛
  const sky = g.createLinearGradient(0, top, 0, 270);
  sky.addColorStop(0, "#3f6fb5");
  sky.addColorStop(0.45, "#e9c372");
  sky.addColorStop(0.8, "#f6a845");
  sky.addColorStop(1, "#f58a32");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 태화전 뒤로 지는 해
  const sun = g.createRadialGradient(200, 200, 0, 200, 200, 150);
  sun.addColorStop(0, "rgba(255,244,200,0.95)");
  sun.addColorStop(0.2, "rgba(255,214,120,0.5)");
  sun.addColorStop(1, "rgba(255,190,90,0)");
  g.fillStyle = sun;
  g.fillRect(left, top, size, size);

  // 멀리 징산 언덕과 정자
  const hillY = (x) => 232 + 0.004 * (x - 200) ** 2;
  g.fillStyle = "#a9b79a";
  fillSilhouette(g, hillY, left, right, 400);
  g.fillStyle = GOLD_ROOF[1];
  g.beginPath();
  g.moveTo(190, 230);
  g.lineTo(200, 220);
  g.lineTo(210, 230);
  g.closePath();
  g.fill();
  g.fillStyle = RED[1];
  g.fillRect(194, 230, 12, 4);

  // 궁궐 담장: 붉은 벽에 노란 기와
  for (const [x0, x1] of [[left, 120], [280, right]]) {
    g.fillStyle = RED[0];
    g.fillRect(x0, 270, x1 - x0, 26);
    g.fillStyle = GOLD_ROOF[0];
    g.beginPath();
    g.moveTo(x0, 272);
    g.lineTo(x0, 266);
    g.lineTo(x1, 266);
    g.lineTo(x1 + 3, 272);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(0,0,0,0.12)";
    g.fillRect(x0, 272, x1 - x0, 2);
  }

  // 담장 뒤 은행나무 숲
  const ginkgo = { trunk: "#4a3622", shade: "#b07800", colors: GINKGO.slice(0, 4) };
  for (const tx of [70, 105, 300, 335]) paintTree(g, rnd, tx, 270, 22, -Math.PI / 2 + r(-0.25, 0.25), 3, 4, ginkgo);

  paintHall(g, 200, 300);

  // 앞쪽 큰 은행나무 두 그루
  paintTree(g, rnd, 24, 356, 48, -1.2, 8, 5, ginkgo);
  paintTree(g, rnd, 378, 358, 48, -1.95, 8, 5, ginkgo);

  // 맨 앞 흰 대리석 난간: 연꽃 머리 기둥 사이로 판이 이어짐 (가까워서 크고 또렷함)
  const railTop = 298;
  g.fillStyle = "#f4f1e8";
  g.fillRect(left, railTop + 4, size, 3);
  g.fillRect(left, railTop + 14, size, 4);
  for (let x = left + 4; x < right; x += 26) {
    g.fillStyle = "#ebe6da";
    g.fillRect(x + 4, railTop + 7, 18, 7);
    g.strokeStyle = "rgba(150,140,120,0.5)";
    g.lineWidth = 0.6;
    g.strokeRect(x + 6, railTop + 8.5, 14, 4);
    g.fillStyle = "#f8f6ef";
    g.fillRect(x - 2, railTop, 5, 20);
    g.beginPath();
    g.ellipse(x + 0.5, railTop - 1, 3.4, 3, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(140,130,110,0.35)";
    g.fillRect(x + 1.5, railTop + 1, 1.5, 19);
  }

  // 위에서 늘어진 버드나무 가지가 화면을 액자처럼 감쌈
  willow(g, rnd, left + 10, top + 40, 1);
  willow(g, rnd, right - 10, top + 40, -1);

  // 바닥: 은행잎이 깔린 돌마당
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#e9cf6e");
  floor.addColorStop(1, "#b48c2c");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  for (let i = 0; i < 420; i++) {
    const x = r(left, right);
    const y = groundAt(x) + r(1, 45);
    g.globalAlpha = r(0.55, 0.95);
    g.fillStyle = GINKGO[Math.floor(rnd() * GINKGO.length)];
    g.beginPath();
    g.ellipse(x, y, r(1.5, 3), r(0.8, 1.6), r(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  g.restore();
}

// 버드나무 가지: 위에서 아래로 늘어진 가는 줄기와 연둣빛 잎
function willow(g, rnd, x, y, dir) {
  for (let i = 0; i < 9; i++) {
    const sx = x + dir * i * 7;
    const len = 60 + rnd() * 70;
    const sway = dir * (8 + rnd() * 14);
    g.strokeStyle = "rgba(90,80,40,0.8)";
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(sx, y - 20);
    g.quadraticCurveTo(sx + sway, y + len * 0.4, sx + sway * 0.6, y + len);
    g.stroke();
    for (let t = 0.1; t < 1; t += 0.06) {
      const px = (1 - t) ** 2 * sx + 2 * (1 - t) * t * (sx + sway) + t * t * (sx + sway * 0.6);
      const py = (1 - t) ** 2 * (y - 20) + 2 * (1 - t) * t * (y + len * 0.4) + t * t * (y + len);
      g.fillStyle = ["#b8c44a", "#cfd35a", "#a9b440", "#e0d070"][Math.floor(rnd() * 4)];
      g.beginPath();
      g.ellipse(px + dir * 1.5, py, 1, 3, dir * 0.4, 0, Math.PI * 2);
      g.fill();
    }
  }
}

// 태화전: 3단 흰 대리석 기단, 붉은 기둥과 벽, 처마가 들린 2층 황금 지붕
function paintHall(g, cx, ground) {
  // 기단
  const tiers = [
    [280, 9],
    [250, 8],
    [222, 8],
  ];
  let y = ground;
  for (const [w, h] of tiers) {
    const marble = g.createLinearGradient(0, y - h, 0, y);
    marble.addColorStop(0, "#fbfaf5");
    marble.addColorStop(1, "#d8d4c8");
    g.fillStyle = marble;
    g.fillRect(cx - w / 2, y - h, w, h);
    // 난간 기둥
    g.fillStyle = "#c9c4b6";
    for (let x = cx - w / 2 + 2; x < cx + w / 2; x += 4) g.fillRect(x, y - h - 2, 1.2, 2.5);
    g.fillRect(cx - w / 2, y - h - 0.6, w, 0.8);
    y -= h + 1;
  }
  // 가운데 계단
  g.fillStyle = "#ece8de";
  g.fillRect(cx - 14, y, 28, ground - y);
  g.strokeStyle = "rgba(150,140,120,0.5)";
  g.lineWidth = 0.5;
  for (let sy = y + 2; sy < ground; sy += 2) {
    g.beginPath();
    g.moveTo(cx - 14, sy);
    g.lineTo(cx + 14, sy);
    g.stroke();
  }

  // 1층 몸체: 붉은 기둥과 금빛 격자문
  const bodyTop = y - 30;
  g.fillStyle = RED[0];
  g.fillRect(cx - 82, bodyTop, 164, 30);
  for (let i = 0; i <= 11; i++) {
    const x = cx - 82 + (i * 164) / 11;
    g.fillStyle = RED[2];
    g.fillRect(x - 1.2, bodyTop, 2.4, 30);
    if (i < 11) {
      g.fillStyle = "#c58a2a";
      g.fillRect(x + 2.5, bodyTop + 8, 164 / 11 - 5, 20);
      g.strokeStyle = "rgba(90,50,10,0.5)";
      g.lineWidth = 0.4;
      for (let k = 1; k < 4; k++) {
        g.beginPath();
        g.moveTo(x + 2.5, bodyTop + 8 + k * 5);
        g.lineTo(x + 164 / 11 - 2.5, bodyTop + 8 + k * 5);
        g.stroke();
      }
    }
  }
  // 처마 밑 단청 띠
  g.fillStyle = "#2f6b5a";
  g.fillRect(cx - 84, bodyTop - 4, 168, 4);
  g.fillStyle = "#3d7fa0";
  for (let x = cx - 84; x < cx + 84; x += 6) g.fillRect(x, bodyTop - 4, 3, 2);

  // 아래 지붕
  roof(g, cx, bodyTop - 2, 210, 168, 16);
  // 2층 몸체
  const upper = bodyTop - 18 - 10;
  g.fillStyle = RED[0];
  g.fillRect(cx - 66, upper, 132, 10);
  g.fillStyle = "#2f6b5a";
  g.fillRect(cx - 68, upper - 3, 136, 3);
  // 위 지붕(우진각 지붕): 처마 끝이 들림, 용마루와 양끝 장식
  roof(g, cx, upper - 1, 186, 96, 34);
  const ridgeY = upper - 1 - 34;
  g.fillStyle = GOLD_ROOF[2];
  g.fillRect(cx - 48, ridgeY - 3, 96, 3);
  for (const dir of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + dir * 48, ridgeY);
    g.lineTo(cx + dir * 52, ridgeY - 9);
    g.lineTo(cx + dir * 45, ridgeY - 5);
    g.closePath();
    g.fill();
  }
}

// 황금 기와 지붕: 아래 폭 bottomW, 위 폭 topW, 높이 h. 처마 양끝이 위로 휨
function roof(g, cx, baseY, bottomW, topW, h) {
  const grad = g.createLinearGradient(0, baseY - h, 0, baseY);
  grad.addColorStop(0, GOLD_ROOF[0]);
  grad.addColorStop(1, GOLD_ROOF[1]);
  g.fillStyle = grad;
  const bl = cx - bottomW / 2;
  const br = cx + bottomW / 2;
  g.beginPath();
  g.moveTo(bl - 4, baseY - 6);
  g.quadraticCurveTo(bl + 16, baseY + 2, cx, baseY + 1);
  g.quadraticCurveTo(br - 16, baseY + 2, br + 4, baseY - 6);
  g.quadraticCurveTo(br - 14, baseY - h * 0.45, cx + topW / 2, baseY - h);
  g.lineTo(cx - topW / 2, baseY - h);
  g.quadraticCurveTo(bl + 14, baseY - h * 0.45, bl - 4, baseY - 6);
  g.closePath();
  g.fill();
  // 기와 골
  g.save();
  g.clip();
  g.strokeStyle = "rgba(140,90,10,0.35)";
  g.lineWidth = 0.6;
  for (let x = bl - 10; x < br + 10; x += 3) {
    g.beginPath();
    g.moveTo(cx + (x - cx) * (topW / bottomW), baseY - h);
    g.lineTo(x, baseY + 2);
    g.stroke();
  }
  // 햇빛을 받는 왼쪽 면
  const light = g.createLinearGradient(bl, 0, br, 0);
  light.addColorStop(0, "rgba(255,245,200,0.25)");
  light.addColorStop(1, "rgba(80,40,0,0.18)");
  g.fillStyle = light;
  g.fillRect(bl - 10, baseY - h - 2, bottomW + 20, h + 6);
  g.restore();
}

// 붉은 등: 처마 밑 여섯 개와, 앞쪽 은행나무 사이 줄에 매단 일곱 개
const EAVE_LANTERNS = [-90, -58, -26, 26, 58, 90].map((dx) => ({ x: 200 + dx, y: 241, len: 7, s: 0.8 }));
const STRING = { x0: 62, x1: 338, y: 262, sag: 22 };
const STRING_LANTERNS = Array.from({ length: 7 }, (_, i) => {
  const k = (i + 1) / 8;
  const x = STRING.x0 + (STRING.x1 - STRING.x0) * k;
  return { x, y: STRING.y + STRING.sag * 4 * k * (1 - k), len: 8, s: 1.1 };
});

let lanternGlow = null;
function glowSprite() {
  if (!lanternGlow) {
    lanternGlow = document.createElement("canvas");
    lanternGlow.width = lanternGlow.height = 64;
    const g = lanternGlow.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,170,90,0.9)");
    grad.addColorStop(0.35, "rgba(255,80,40,0.35)");
    grad.addColorStop(1, "rgba(255,60,30,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  }
  return lanternGlow;
}

function lantern(ctx, x, y, len, s, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = "#3a2a1a";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, len);
  ctx.stroke();
  ctx.translate(0, len + 7.5 * s);

  // 빛 번짐
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(glowSprite(), -18 * s, -18 * s, 36 * s, 36 * s);
  ctx.globalCompositeOperation = "source-over";

  // 둥근 몸통과 세로 살
  const body = ctx.createRadialGradient(-2 * s, -2 * s, 1, 0, 0, 8 * s);
  body.addColorStop(0, "#ff7a4a");
  body.addColorStop(0.6, "#e0281c");
  body.addColorStop(1, "#9a100a");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.5 * s, 7.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(120,10,5,0.6)";
  ctx.lineWidth = 0.5;
  for (const k of [-0.55, 0, 0.55]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 6.5 * s * Math.abs(k) + 0.01, 7.5 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 금색 위아래 마개와 술
  ctx.fillStyle = "#e8b030";
  ctx.fillRect(-3.5 * s, -8.3 * s, 7 * s, 1.8 * s);
  ctx.fillRect(-3.5 * s, 6.5 * s, 7 * s, 1.8 * s);
  ctx.strokeStyle = "#e8b030";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (const dx of [-1, 0, 1]) {
    ctx.moveTo(dx * s, 8.3 * s);
    ctx.lineTo(dx * 1.3 * s, 13 * s);
  }
  ctx.stroke();
  ctx.restore();
}

// 등은 늘 조금씩 흔들리고, 스노우볼을 터뜨려 물이 휘저어지면 크게 흔들림
function animateLanterns(ctx, t, globe, stir) {
  const swing = (phase) => Math.sin(t * 0.0025 + phase) * (0.06 + Math.min(stir, 5) * 0.09);

  ctx.save();
  // 은행나무 사이를 잇는 줄
  ctx.strokeStyle = "#3a2a1a";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(STRING.x0, STRING.y);
  ctx.quadraticCurveTo(200, STRING.y + STRING.sag * 2, STRING.x1, STRING.y);
  ctx.stroke();
  EAVE_LANTERNS.forEach((l, i) => lantern(ctx, l.x, l.y, l.len, l.s, swing(i * 1.7)));
  STRING_LANTERNS.forEach((l, i) => lantern(ctx, l.x, l.y, l.len, l.s, swing(i * 1.3 + 0.5)));
  ctx.restore();
}

// 은행잎: 가운데가 살짝 갈라진 부채꼴 잎과 잎자루
function drawGinkgo(ctx, p) {
  const s = p.size;
  ctx.globalAlpha = p.settled ? 0.95 : 0.92;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(Math.max(0.2, Math.abs(Math.cos(p.flip))), 1);
  ctx.fillStyle = p.color;
  const a0 = -Math.PI * 0.82;
  const a1 = -Math.PI * 0.18;
  const mid = -Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, s, a0, mid - 0.09);
  ctx.lineTo(0, -s * 0.68);
  ctx.lineTo(Math.cos(mid + 0.09) * s, Math.sin(mid + 0.09) * s);
  ctx.arc(0, 0, s, mid + 0.09, a1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(150,100,0,0.6)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, s * 0.7);
  ctx.stroke();
  ctx.restore();
}

export const forbidden = {
  id: "china",
  label: "중국 · 자금성",
  title: "Forbidden City",
  paint: paintForbidden,
  animate: animateLanterns,
  glare: 0.9,
  base: {
    trim: ["#7a5a1c", "#f2d17a", "#c99a35", "#6b4d16"],
    plate: "故宫",
    plateFont: "600 17px 'Songti SC', 'STSong', 'SimSun', serif",
    plateInk: "#2b1d10",
  },
  // 은행잎은 단풍잎보다 작고 가벼워서 팔랑이며 천천히 내림
  particles: {
    count: 150,
    blend: "source-over",
    make(rand) {
      const size = rand(4, 6.5);
      return {
        size,
        color: GINKGO[Math.floor(rand(0, GINKGO.length))],
        sink: 0.13 + size * 0.03 + rand(-0.03, 0.03),
        drag: rand(0.08, 0.12),
        inertia: rand(0.3, 0.6),
        grip: rand(0.45, 1.7),
        angle: rand(0, Math.PI * 2),
        spin: rand(-0.05, 0.05),
        flipSpeed: rand(0.03, 0.07),
        flutter: 0.03,
      };
    },
    draw: drawGinkgo,
  },
};
