// 스페인: 바르셀로나 사그라다 파밀리아 실내. 금빛 별 천장,
// 제단 쪽 벽의 장미창과 스테인드글라스, 흩날리는 유리 조각

import { seeded, fillSilhouette } from "./util.mjs";

const JEWEL = ["#2f6fd6", "#1aa3a0", "#3cbf6a", "#7fd0f0", "#f2b632", "#f06a2a", "#d8324a", "#ffd86a"];

// 신랑에서 제단 쪽 벽을 올려다본 구도:
// 금빛 별 천장 → 큰 장미창 → 두 쌍의 긴 창 → 성가대 회랑 → 아래 문과 작은 장미창
function paintBarcelona(g, globe, groundAt) {
  const rnd = seeded(1882);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 햇빛이 스며든 따뜻한 돌빛: 천장은 금빛, 아래는 크림색
  const base = g.createLinearGradient(0, top, 0, globe.y + globe.r);
  base.addColorStop(0, "#e8962e");
  base.addColorStop(0.2, "#f3b85a");
  base.addColorStop(0.38, "#f1d6a6");
  base.addColorStop(0.7, "#cfb48c");
  base.addColorStop(1, "#8e7556");
  g.fillStyle = base;
  g.fillRect(left, top, size, size);

  // 천장 원근: 가까운 위쪽은 크고 성글게, 제단 쪽(아래)으로 갈수록 작고 촘촘하게 모이는 잎사귀 볼트
  const rc = seeded(1926);
  for (let row = 0; row < 7; row++) {
    const t = row / 6;
    const y = 44 + 108 * Math.pow(t, 0.85);
    const spread = 170 - 120 * t;
    const n = 7 - Math.round(t * 3);
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      const x = 200 + (u - 0.5) * 2 * spread;
      const rr = (13 - 8 * t) * (0.85 + rc() * 0.3);
      leafVault(g, x, y + (rc() - 0.5) * 4, rr, rc);
    }
  }
  // 천장 가운데 줄을 따라 이어지는 갈비뼈 두 줄 (소실점으로 모임)
  g.strokeStyle = "rgba(150,110,60,0.35)";
  g.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(200 + side * 40, 40);
    g.quadraticCurveTo(200 + side * 22, 100, 200 + side * 8, 160);
    g.stroke();
  }

  // 천장: 가운데 줄로 이어지는 금빛 별 천창과 양옆의 작은 별들
  for (const [cx, cy, rr] of [
    [200, 56, 26],
    [200, 94, 20],
    [200, 126, 15],
    [146, 72, 17],
    [254, 72, 17],
    [160, 112, 12],
    [240, 112, 12],
    [104, 60, 14],
    [296, 60, 14],
  ]) {
    starVault(g, cx, cy, rr);
  }

  // 천장 전체에 쏟아지는 금빛: 가운데 줄을 따라 밝게 번지고 반짝이는 작은 빛점
  g.save();
  g.globalCompositeOperation = "lighter";
  const gold = g.createRadialGradient(200, 80, 0, 200, 80, 170);
  gold.addColorStop(0, "rgba(255,170,60,0.28)");
  gold.addColorStop(0.5, "rgba(255,160,50,0.1)");
  gold.addColorStop(1, "rgba(255,160,50,0)");
  g.fillStyle = gold;
  g.fillRect(left, top, size, 260);
  const rs = seeded(2010);
  for (let i = 0; i < 70; i++) {
    const x = 60 + rs() * 280;
    const y = 40 + rs() * 120;
    g.fillStyle = `rgba(255,240,190,${0.3 + rs() * 0.6})`;
    g.beginPath();
    g.arc(x, y, 0.4 + rs() * 1.1, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // 제단 쪽 벽: 크림색 돌, 세로 띠와 위쪽 아치
  const wall = g.createLinearGradient(0, 150, 0, 330);
  wall.addColorStop(0, "#f6ead6");
  wall.addColorStop(1, "#dcc6a4");
  g.fillStyle = wall;
  g.beginPath();
  g.moveTo(118, 330);
  g.lineTo(118, 168);
  g.quadraticCurveTo(200, 120, 282, 168);
  g.lineTo(282, 330);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(150,120,85,0.18)";
  for (const px of [130, 150, 250, 270]) g.fillRect(px, 170, 2, 160);
  // 장미창 위를 덮은 부채꼴 돌 차양 (가는 줄이 방사형으로 퍼짐)
  g.strokeStyle = "rgba(160,130,95,0.35)";
  g.lineWidth = 0.6;
  for (let k = -8; k <= 8; k++) {
    g.beginPath();
    g.moveTo(200, 168);
    g.lineTo(200 + k * 9, 132 + Math.abs(k) * 2.4);
    g.stroke();
  }

  // 큰 장미창: 파랑·초록·노랑 꽃잎이 방사형으로, 가운데는 노란 빛
  roseWindow(g, 200, 182, 28, ["#1f5fc9", "#2f86e0", "#3cbf6a", "#1aa3a0", "#9ad84a", "#f2c232"]);

  // 두 쌍의 긴 창과 그 위의 작은 장미창
  const mixed = ["#2f6fd6", "#3cbf6a", "#f2b632", "#f06a2a", "#d8324a", "#7fd0f0", "#ffd86a"];
  for (const [x0, x1] of [[159, 177], [223, 241]]) {
    roseWindow(g, (x0 + x1) / 2, 218, 9, ["#3cbf6a", "#f2b632", "#2f86e0", "#f06a2a", "#d8324a"]);
    stainedWindow(g, rnd, x0, 232, 11, 34, mixed, 1);
    stainedWindow(g, rnd, x1, 232, 11, 34, mixed, 1);
  }

  // 성가대 회랑: 따뜻한 불빛이 비치는 작은 아치가 줄지어 있음
  g.fillStyle = "#e9cfa3";
  g.fillRect(118, 270, 164, 16);
  for (let ax = 124; ax < 278; ax += 8) {
    const glow = g.createLinearGradient(0, 272, 0, 284);
    glow.addColorStop(0, "#ffd88a");
    glow.addColorStop(1, "#c98a3a");
    g.fillStyle = glow;
    g.beginPath();
    g.moveTo(ax, 284);
    g.lineTo(ax, 276);
    g.arc(ax + 2.5, 276, 2.5, Math.PI, 0);
    g.lineTo(ax + 5, 284);
    g.closePath();
    g.fill();
  }
  g.fillStyle = "rgba(120,85,50,0.35)";
  g.fillRect(118, 286, 164, 1.2);

  // 아래 아치문과 파란 작은 장미창
  g.fillStyle = "#cdb48e";
  g.beginPath();
  g.moveTo(172, 330);
  g.lineTo(172, 304);
  g.quadraticCurveTo(200, 286, 228, 304);
  g.lineTo(228, 330);
  g.closePath();
  g.fill();
  roseWindow(g, 200, 308, 11, ["#1f5fc9", "#2f86e0", "#7fd0f0", "#1aa3a0"]);

  // 양옆 벽의 색유리: 왼쪽(동쪽)은 파랑·초록, 오른쪽(서쪽)은 빨강·주황·노랑.
  // 양옆 벽에 곧게 선 창. 가운데(먼 쪽)로 갈수록 작아짐
  const coolGlass = ["#1f5fc9", "#2f86e0", "#1aa3a0", "#3cbf6a", "#7fd0f0", "#9ad84a"];
  const warmGlass = ["#d8324a", "#e0531f", "#f08a24", "#f2b632", "#ffd86a", "#c2185b"];
  for (const side of [-1, 1]) {
    const palette = side < 0 ? coolGlass : warmGlass;
    // 멀수록(가운데로 갈수록) 작고 높음. 기울이지 않고 곧게 세움
    for (const [gx, w, h, top] of [
      [96, 15, 62, 186],
      [132, 10, 46, 198],
      [157, 7, 32, 208],
    ]) {
      const x = side < 0 ? gx : 400 - gx;
      // 아래 큰 창, 그 위 작은 장미창, 맨 위 작은 창
      stainedWindow(g, rnd, x, top, w, h, palette, 1);
      roseWindow(g, x, top - w * 0.75, w * 0.38, palette);
      stainedWindow(g, rnd, x, top - w * 2.6 - h * 0.45, w * 0.7, h * 0.45, palette, 0.9);
      // 창 아래 회랑 턱
      g.fillStyle = "#e7d2ad";
      g.fillRect(x - w * 0.9, top + h, w * 1.8, 2 + w * 0.15);
      g.fillStyle = "rgba(110,80,50,0.4)";
      g.fillRect(x - w * 0.9, top + h + 2 + w * 0.15, w * 1.8, 0.8);
    }
    // 창 둘레로 번지는 색빛
    g.save();
    g.globalCompositeOperation = "lighter";
    const spill = g.createRadialGradient(200 + side * 120, 230, 0, 200 + side * 120, 230, 100);
    spill.addColorStop(0, side < 0 ? "rgba(60,140,230,0.28)" : "rgba(240,110,50,0.28)");
    spill.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = spill;
    g.fillRect(left, 120, size, 250);
    g.restore();
  }

  // 바닥: 따뜻한 돌. 창빛이 색 웅덩이로 비침
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop - 40, 0, globe.y + globe.r);
  floor.addColorStop(0, "#d9c4a2");
  floor.addColorStop(1, "#9c8566");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  g.save();
  g.globalCompositeOperation = "lighter";
  g.filter = "blur(6px)";
  for (let i = 0; i < 12; i++) {
    const x = r(left + 30, right - 30);
    const y = groundAt(x) + r(4, 30);
    g.fillStyle = JEWEL[Math.floor(rnd() * JEWEL.length)];
    g.globalAlpha = r(0.12, 0.22);
    g.beginPath();
    g.ellipse(x, y, r(14, 28), r(3, 6), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  g.restore();
}

// 잎사귀 볼트: 쌍곡면 천장 칸. 둘레는 크림색 돌 잎이 톱니처럼 둘러싸고, 가운데는 움푹 들어가 그늘,
// 맨 가운데 작은 금빛 등. 둘레에 아주 작은 금빛 점이 고리처럼 박힘
function leafVault(g, cx, cy, rr, rnd) {
  const leaves = 9;
  for (let k = 0; k < leaves; k++) {
    const a = (k / leaves) * Math.PI * 2 + rnd() * 0.2;
    const grad = g.createLinearGradient(cx, cy, cx + Math.cos(a) * rr * 1.3, cy + Math.sin(a) * rr);
    grad.addColorStop(0, "#c8781e");
    grad.addColorStop(0.5, "#eeb052");
    grad.addColorStop(1, "#fbe6bf");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(cx + Math.cos(a - 0.35) * rr * 0.45, cy + Math.sin(a - 0.35) * rr * 0.34);
    g.lineTo(cx + Math.cos(a - 0.12) * rr * 1.15, cy + Math.sin(a - 0.12) * rr * 0.86);
    g.lineTo(cx + Math.cos(a) * rr * 1.35, cy + Math.sin(a) * rr);
    g.lineTo(cx + Math.cos(a + 0.12) * rr * 1.15, cy + Math.sin(a + 0.12) * rr * 0.86);
    g.lineTo(cx + Math.cos(a + 0.35) * rr * 0.45, cy + Math.sin(a + 0.35) * rr * 0.34);
    g.closePath();
    g.fill();
  }
  const hole = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 0.55);
  hole.addColorStop(0, "#fff6c8");
  hole.addColorStop(0.3, "#ffc23a");
  hole.addColorStop(1, "#a85a14");
  g.fillStyle = hole;
  g.beginPath();
  g.ellipse(cx, cy, rr * 0.55, rr * 0.42, 0, 0, Math.PI * 2);
  g.fill();
  // 가운데에서 번지는 금빛
  g.save();
  g.globalCompositeOperation = "lighter";
  const halo = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.6);
  halo.addColorStop(0, "rgba(255,170,60,0.3)");
  halo.addColorStop(1, "rgba(255,170,60,0)");
  g.fillStyle = halo;
  g.fillRect(cx - rr * 1.6, cy - rr * 1.6, rr * 3.2, rr * 3.2);
  g.restore();
  g.fillStyle = "#fff3c4";
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    g.beginPath();
    g.arc(cx + Math.cos(a) * rr * 0.72, cy + Math.sin(a) * rr * 0.55, Math.max(0.5, rr * 0.07), 0, Math.PI * 2);
    g.fill();
  }
}

// 금빛 별 천창: 주황 꽃잎이 뾰족하게 퍼지고 가운데는 노란 빛. 둘레로 크림색 돌 갈비뼈
function starVault(g, cx, cy, rr) {
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.8);
  glow.addColorStop(0, "rgba(255,220,120,0.95)");
  glow.addColorStop(1, "rgba(255,210,110,0)");
  g.fillStyle = glow;
  g.fillRect(cx - rr * 1.8, cy - rr * 1.8, rr * 3.6, rr * 3.6);
  const spikes = 12;
  for (let k = 0; k < spikes; k++) {
    const a = (k / spikes) * Math.PI * 2;
    const len = rr * (k % 2 ? 1.25 : 0.95);
    const grad = g.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.75);
    grad.addColorStop(0, "#ffb83a");
    grad.addColorStop(1, "#fff0c8");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(cx + Math.cos(a - 0.22) * rr * 0.35, cy + Math.sin(a - 0.22) * rr * 0.26);
    g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.75);
    g.lineTo(cx + Math.cos(a + 0.22) * rr * 0.35, cy + Math.sin(a + 0.22) * rr * 0.26);
    g.closePath();
    g.fill();
  }
  const core = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 0.42);
  core.addColorStop(0, "#fff4c0");
  core.addColorStop(0.6, "#ffcf4a");
  core.addColorStop(1, "#d98a2a");
  g.fillStyle = core;
  g.beginPath();
  g.ellipse(cx, cy, rr * 0.42, rr * 0.32, 0, 0, Math.PI * 2);
  g.fill();
}

// 장미창: 바깥 돌 테, 방사형 색유리 꽃잎, 가운데 노란 빛, 납선
function roseWindow(g, cx, cy, rr, palette) {
  g.save();
  g.globalCompositeOperation = "lighter";
  const halo = g.createRadialGradient(cx, cy, rr * 0.5, cx, cy, rr * 1.8);
  halo.addColorStop(0, `${palette[0]}44`);
  halo.addColorStop(1, `${palette[0]}00`);
  g.fillStyle = halo;
  g.fillRect(cx - rr * 2, cy - rr * 2, rr * 4, rr * 4);
  g.restore();
  g.fillStyle = "#cdb48e";
  g.beginPath();
  g.arc(cx, cy, rr * 1.12, 0, Math.PI * 2);
  g.fill();
  const petals = Math.max(8, Math.round(rr * 0.8));
  for (let k = 0; k < petals; k++) {
    const a0 = (k / petals) * Math.PI * 2;
    const a1 = ((k + 1) / petals) * Math.PI * 2;
    for (const [r0, r1, shift] of [[0.35, 0.7, 0], [0.7, 1, 1]]) {
      g.fillStyle = palette[(k + shift * 2) % palette.length];
      g.beginPath();
      g.arc(cx, cy, rr * r1, a0, a1);
      g.arc(cx, cy, rr * r0, a1, a0, true);
      g.closePath();
      g.fill();
    }
  }
  g.strokeStyle = "rgba(40,30,35,0.6)";
  g.lineWidth = Math.max(0.3, rr * 0.03);
  for (let k = 0; k < petals; k++) {
    const a = (k / petals) * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * rr * 0.35, cy + Math.sin(a) * rr * 0.35);
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    g.stroke();
  }
  for (const k of [0.35, 0.7, 1]) {
    g.beginPath();
    g.arc(cx, cy, rr * k, 0, Math.PI * 2);
    g.stroke();
  }
  const core = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 0.35);
  core.addColorStop(0, "#fffbe0");
  core.addColorStop(1, "#f2c232");
  g.fillStyle = core;
  g.beginPath();
  g.arc(cx, cy, rr * 0.35, 0, Math.PI * 2);
  g.fill();
}

// 스테인드글라스 창: 위가 둥근 긴 창. 칸마다 색유리, 사이사이 짙은 납선, 창 둘레로 색빛이 번짐
function stainedWindow(g, rnd, cx, y, w, h, palette, alpha) {
  const shape = () => {
    g.beginPath();
    g.moveTo(cx - w / 2, y + h);
    g.lineTo(cx - w / 2, y + w / 2);
    g.arc(cx, y + w / 2, w / 2, Math.PI, 0);
    g.lineTo(cx + w / 2, y + h);
    g.closePath();
  };
  // 번지는 빛
  g.save();
  g.globalCompositeOperation = "lighter";
  const glow = g.createRadialGradient(cx, y + h / 2, 0, cx, y + h / 2, Math.max(w, h) * 0.8);
  glow.addColorStop(0, `${palette[0]}55`);
  glow.addColorStop(1, `${palette[0]}00`);
  g.fillStyle = glow;
  g.fillRect(cx - h, y - h * 0.3, h * 2, h * 1.6);
  g.restore();

  // 돌 창틀
  g.fillStyle = "#cdbfa8";
  g.save();
  g.translate(cx, y + h / 2);
  g.scale(1.14, 1.04);
  g.translate(-cx, -(y + h / 2));
  shape();
  g.fill();
  g.restore();

  g.save();
  shape();
  g.clip();
  g.globalAlpha = alpha;
  // 칸: 들쭉날쭉한 격자. 칸마다 다른 색, 가운데는 조금 밝게
  const cols = Math.max(2, Math.round(w / 6));
  const rows = Math.max(4, Math.round(h / 7));
  const cw = w / cols;
  const ch = h / rows;
  const jitter = (v) => v + (rnd() - 0.5) * Math.min(cw, ch) * 0.5;
  const pts = [];
  for (let j = 0; j <= rows; j++) {
    pts.push([]);
    for (let i = 0; i <= cols; i++) {
      const edge = i === 0 || i === cols || j === 0 || j === rows;
      const px = cx - w / 2 + i * cw;
      const py = y + j * ch;
      pts[j].push(edge ? [px, py] : [jitter(px), jitter(py)]);
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const color = palette[Math.floor(rnd() * palette.length)];
      const grad = g.createLinearGradient(0, pts[j][i][1], 0, pts[j + 1][i][1]);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(...pts[j][i]);
      g.lineTo(...pts[j][i + 1]);
      g.lineTo(...pts[j + 1][i + 1]);
      g.lineTo(...pts[j + 1][i]);
      g.closePath();
      g.fill();
      // 유리 안의 밝은 결
      if (rnd() < 0.35) {
        g.fillStyle = "rgba(255,255,240,0.35)";
        g.fill();
      }
    }
  }
  // 납선: 굵기를 거리에 맞춰
  g.strokeStyle = "rgba(35,28,40,0.7)";
  g.lineWidth = Math.max(0.3, w * 0.025);
  for (let j = 0; j <= rows; j++) {
    g.beginPath();
    for (let i = 0; i <= cols; i++) g.lineTo(...pts[j][i]);
    g.stroke();
  }
  for (let i = 0; i <= cols; i++) {
    g.beginPath();
    for (let j = 0; j <= rows; j++) g.lineTo(...pts[j][i]);
    g.stroke();
  }
  // 창 가운데 위쪽 둥근 장미창
  g.fillStyle = "rgba(255,250,220,0.7)";
  g.beginPath();
  g.arc(cx, y + w * 0.55, w * 0.22, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

// 유리 조각: 3~5각의 날카로운 조각. 색유리 위에 한쪽 모서리만 하얗게 반짝임
function drawShard(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  const k = p.size / p.base; // 엔진이 키운 크기만큼 조각 모양도 키움
  ctx.scale(Math.max(0.25, Math.abs(Math.cos(p.flip))) * k, k);
  ctx.globalAlpha = p.settled ? 0.9 : 0.85;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(p.shape[0][0], p.shape[0][1]);
  for (let i = 1; i < p.shape.length; i++) ctx.lineTo(p.shape[i][0], p.shape[i][1]);
  ctx.closePath();
  ctx.fill();
  // 유리 안쪽 밝은 결
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(p.shape[0][0] * 0.6, p.shape[0][1] * 0.6);
  ctx.lineTo(p.shape[1][0] * 0.6, p.shape[1][1] * 0.6);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  // 뒤집히며 빛을 받을 때 모서리가 반짝임
  const glint = Math.max(0, Math.cos(p.flip * 2));
  ctx.globalAlpha = 0.4 + 0.5 * glint;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.7 / k;
  ctx.beginPath();
  ctx.moveTo(p.shape[0][0], p.shape[0][1]);
  ctx.lineTo(p.shape[1][0], p.shape[1][1]);
  ctx.stroke();
  ctx.restore();
}

export const barcelona = {
  id: "spain",
  label: "스페인 · 사그라다 파밀리아",
  title: "Sagrada Família",
  paint: paintBarcelona,
  glare: 0.7,
  base: {
    trim: ["#6a5a46", "#f3e8d2", "#c9b48f", "#55473a"],
    plate: "Sagrada Família",
    plateFont: "italic 600 15px Georgia, 'Times New Roman', serif",
    plateInk: "#2c2418",
  },
  // 유리 조각은 꽃잎보다 무거워 조금 빨리 떨어지고, 뒤집힐 때마다 반짝임
  particles: {
    count: 140,
    blend: "source-over",
    make(rand) {
      const size = rand(3.5, 6);
      const n = Math.floor(rand(3, 6));
      const shape = Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + rand(-0.4, 0.4);
        const d = size * rand(0.55, 1.1);
        return [Math.cos(a) * d, Math.sin(a) * d];
      });
      return {
        size,
        base: size,
        shape,
        color: JEWEL[Math.floor(rand(0, JEWEL.length))],
        sink: 0.18 + size * 0.03 + rand(-0.03, 0.03),
        drag: rand(0.08, 0.12),
        inertia: rand(0.4, 0.7),
        grip: rand(0.45, 1.7),
        angle: rand(0, Math.PI * 2),
        spin: rand(-0.06, 0.06),
        flipSpeed: rand(0.04, 0.09),
        flutter: 0.01,
      };
    },
    draw: drawShard,
  },
};
