// 스페인: 바르셀로나 사그라다 파밀리아 실내. 금빛 별 천장과 나무처럼 갈라지는 기둥,
// 제단 쪽 벽의 장미창과 스테인드글라스, 흩날리는 유리 조각

import { seeded, fillSilhouette } from "./util.mjs";

const JEWEL = ["#2f6fd6", "#1aa3a0", "#3cbf6a", "#7fd0f0", "#f2b632", "#f06a2a", "#d8324a", "#ffd86a"];

// 신랑에서 제단 쪽 벽을 올려다본 구도:
// 위로 모이는 나무 기둥 → 금빛 별 천장 → 큰 장미창 → 두 쌍의 긴 창 → 성가대 회랑 → 아래 문과 작은 장미창
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
  base.addColorStop(0, "#efbf78");
  base.addColorStop(0.35, "#efd9b4");
  base.addColorStop(0.7, "#cfb48c");
  base.addColorStop(1, "#8e7556");
  g.fillStyle = base;
  g.fillRect(left, top, size, size);

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

  // 제단 쪽 벽: 크림색 돌, 세로 기둥띠와 위쪽 아치
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

  // 양옆 벽의 색유리: 왼쪽(동쪽)은 파랑·초록, 오른쪽(서쪽)은 빨강·주황·노랑. 올려다봐서 위로 갈수록 가운데로 기울어짐
  const coolGlass = ["#1f5fc9", "#2f86e0", "#1aa3a0", "#3cbf6a", "#7fd0f0", "#9ad84a"];
  const warmGlass = ["#d8324a", "#e0531f", "#f08a24", "#f2b632", "#ffd86a", "#c2185b"];
  for (const side of [-1, 1]) {
    for (const [cx, cy, w, h] of [
      [200 + side * 66, 222, 12, 54],
      [200 + side * 98, 236, 16, 70],
      [200 + side * 136, 248, 20, 84],
    ]) {
      g.save();
      g.translate(cx, cy + h / 2);
      g.rotate(side * 0.12);
      g.translate(-cx, -(cy + h / 2));
      stainedWindow(g, rnd, cx, cy, w, h, side < 0 ? coolGlass : warmGlass, 1);
      g.restore();
    }
    // 창 둘레로 번지는 색빛
    g.save();
    g.globalCompositeOperation = "lighter";
    const spill = g.createRadialGradient(200 + side * 110, 260, 0, 200 + side * 110, 260, 90);
    spill.addColorStop(0, side < 0 ? "rgba(60,140,230,0.25)" : "rgba(240,110,50,0.25)");
    spill.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = spill;
    g.fillRect(left, 150, size, 220);
    g.restore();
  }

  // 나무 기둥: 아래에서 올려다봐서 위로 갈수록 가운데로 모임. 먼 것부터
  for (const [bx, tx, w, d] of [
    [130, 166, 8, 0.35],
    [100, 146, 11, 0.6],
    [64, 124, 16, 1],
  ]) {
    leaningColumn(g, bx, tx, 336, 104, w, -1, d);
    leaningColumn(g, 400 - bx, 400 - tx, 336, 104, w, 1, d);
  }
  // 기둥 위쪽의 타원 메달: 초록·노랑 유리
  for (const [mx, my] of [[96, 122], [304, 122]]) {
    const medal = g.createRadialGradient(mx - 3, my - 3, 0, mx, my, 12);
    medal.addColorStop(0, "#fff3a0");
    medal.addColorStop(0.55, "#d8d040");
    medal.addColorStop(1, "#3a9a4a");
    g.fillStyle = medal;
    g.beginPath();
    g.ellipse(mx, my, 9, 12, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(120,95,60,0.7)";
    g.lineWidth = 1.2;
    g.stroke();
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

// 금빛 별 천창: 주황 꽃잎이 뾰족하게 퍼지고 가운데는 노란 빛. 둘레로 크림색 돌 갈비뼈
function starVault(g, cx, cy, rr) {
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.8);
  glow.addColorStop(0, "rgba(255,210,110,0.7)");
  glow.addColorStop(1, "rgba(255,210,110,0)");
  g.fillStyle = glow;
  g.fillRect(cx - rr * 1.8, cy - rr * 1.8, rr * 3.6, rr * 3.6);
  const spikes = 12;
  for (let k = 0; k < spikes; k++) {
    const a = (k / spikes) * Math.PI * 2;
    const len = rr * (k % 2 ? 1.25 : 0.95);
    const grad = g.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.75);
    grad.addColorStop(0, "#f39a2e");
    grad.addColorStop(1, "#efd9b4");
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

// 올려다본 나무 기둥: 곧은 막대가 아니라 아래가 불룩하고 위로 갈수록 가늘어지며 살짝 휘는 몸통.
// 여러 면으로 깎인 기둥이라 면마다 밝기가 다르고, 가운데(제단 빛) 쪽이 밝고 바깥쪽은 깊은 그늘.
// 아래는 짙은 회색 반암, 마디 위는 크림색 사암. 마디에서 굵은 가지가 천장으로 퍼지고, 가지 사이 천장엔 그늘이 짐
function leaningColumn(g, bx, tx, baseY, topY, w, side, d) {
  const knotY = topY + (baseY - topY) * 0.42;
  const bend = -side * w * 0.35;
  const xAt = (y) => {
    const t = (baseY - y) / (baseY - topY);
    return bx + (tx - bx) * t + Math.sin(t * Math.PI) * bend;
  };
  const wAt = (y) => {
    const t = (baseY - y) / (baseY - topY);
    return w * (1.05 - 0.3 * t + 0.06 * Math.sin(t * Math.PI * 2));
  };
  const outline = (y0, y1) => {
    g.beginPath();
    for (let y = y1; y >= y0; y -= 3) g.lineTo(xAt(y) - wAt(y) / 2, y);
    for (let y = y0; y <= y1; y += 3) g.lineTo(xAt(y) + wAt(y) / 2, y);
    g.closePath();
  };

  g.save();
  // 뒤 벽에 드리운 그림자: 바깥쪽으로 번진 어두운 띠
  g.save();
  g.filter = `blur(${3 + 4 * d}px)`;
  g.fillStyle = `rgba(50,30,15,${0.22 + 0.15 * d})`;
  g.translate(-side * w * 0.7, 4);
  outline(topY, baseY);
  g.fill();
  g.restore();

  g.globalAlpha = 0.85 + 0.15 * d;
  const facets = 7;
  const paintPart = (y0, y1, light, mid, dark) => {
    g.save();
    outline(y0, y1);
    g.clip();
    for (let f = 0; f < facets; f++) {
      const t = f / (facets - 1);
      const towardCenter = side < 0 ? t : 1 - t;
      const shade = Math.pow(towardCenter, 1.3);
      g.fillStyle = shade > 0.66 ? light : shade > 0.33 ? mid : dark;
      g.beginPath();
      for (let y = y1; y >= y0 - 3; y -= 3) g.lineTo(xAt(y) - wAt(y) / 2 + (wAt(y) * f) / facets, y);
      for (let y = y0 - 3; y <= y1; y += 3) g.lineTo(xAt(y) - wAt(y) / 2 + (wAt(y) * (f + 1)) / facets, y);
      g.closePath();
      g.fill();
    }
    // 바깥쪽 깊은 그늘
    const gx = xAt((y0 + y1) / 2);
    const gw = wAt((y0 + y1) / 2);
    const occ = g.createLinearGradient(gx - (side * gw) / 2, 0, gx + (side * gw) / 2, 0);
    occ.addColorStop(0, "rgba(20,15,15,0.5)");
    occ.addColorStop(0.55, "rgba(20,15,15,0)");
    g.fillStyle = occ;
    g.fillRect(gx - gw, y0 - 3, gw * 2, y1 - y0 + 6);
    // 창 쪽 면에 비친 색빛
    const tint = g.createLinearGradient(gx + (side * gw) / 2, 0, gx - (side * gw) / 2, 0);
    tint.addColorStop(0, side < 0 ? "rgba(70,150,230,0.18)" : "rgba(240,120,60,0.18)");
    tint.addColorStop(0.5, "rgba(0,0,0,0)");
    g.fillStyle = tint;
    g.fillRect(gx - gw, y0 - 3, gw * 2, y1 - y0 + 6);
    g.restore();
  };
  paintPart(knotY, baseY, "#8d8f96", "#5f6168", "#383a41");
  paintPart(topY, knotY, "#f6ecdc", "#d9c6a6", "#a48a66");
  // 면 사이 모서리: 아주 가는 밝은 선
  g.strokeStyle = "rgba(255,250,240,0.18)";
  g.lineWidth = Math.max(0.3, w * 0.03);
  for (let f = 1; f < facets; f++) {
    g.beginPath();
    for (let y = baseY; y >= topY; y -= 4) g.lineTo(xAt(y) - wAt(y) / 2 + (wAt(y) * f) / facets, y);
    g.stroke();
  }
  // 마디: 꽃받침처럼 겹친 둥근 덩어리, 아래는 그늘
  const kx = xAt(knotY);
  const kw = wAt(knotY);
  for (let k = -2; k <= 2; k++) {
    const nx = kx + k * kw * 0.24;
    const knot = g.createRadialGradient(nx + side * kw * 0.1, knotY - kw * 0.15, 0, nx, knotY, kw * 0.45);
    knot.addColorStop(0, "#b9bcc4");
    knot.addColorStop(1, "#45474f");
    g.fillStyle = knot;
    g.beginPath();
    g.ellipse(nx, knotY, kw * 0.3, kw * 0.42, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "rgba(20,18,22,0.35)";
  g.beginPath();
  g.ellipse(kx, knotY + kw * 0.38, kw * 0.75, kw * 0.12, 0, 0, Math.PI * 2);
  g.fill();

  // 가지: 굵게 시작해 휘면서 가늘어짐. 아랫면은 그늘, 윗면은 밝음
  g.globalAlpha = 1;
  const tX = xAt(topY);
  const tW = wAt(topY);
  const ao = g.createRadialGradient(tX, topY - 20, 0, tX, topY - 20, 50);
  ao.addColorStop(0, "rgba(90,60,30,0.28)");
  ao.addColorStop(1, "rgba(90,60,30,0)");
  g.fillStyle = ao;
  g.fillRect(tX - 50, topY - 70, 100, 100);
  for (const [dx, lift, curl] of [[-1.7, 0.65, -0.3], [-0.6, 1, 0.15], [0.6, 1, -0.15], [1.7, 0.65, 0.3]]) {
    const ex = tX + dx * tW * 2.6;
    const ey = topY - 62 * lift;
    const cx = tX + dx * tW * 1.1 + curl * tW;
    const cy = topY - 24 * lift;
    const pt = (t) => {
      const u = 1 - t;
      return [u * u * tX + 2 * u * t * cx + t * t * ex, u * u * topY + 2 * u * t * cy + t * t * ey];
    };
    for (const [color, extra, off] of [["#9f875f", 1.4, 0.9], ["#f2e6cf", 0, 0], ["#fffaf0", -0.55, -0.4]]) {
      g.strokeStyle = color;
      g.lineCap = "round";
      for (let k = 0; k < 8; k++) {
        const [x0, y0] = pt(k / 8);
        const [x1, y1] = pt((k + 1) / 8);
        g.lineWidth = Math.max(0.6, tW * 0.45 * (1 - (k / 8) * 0.7) + extra * (1 - k / 10));
        g.beginPath();
        g.moveTo(x0 - off * side, y0 + Math.abs(off));
        g.lineTo(x1 - off * side, y1 + Math.abs(off));
        g.stroke();
      }
    }
  }
  g.restore();
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

// 가우디의 나무 기둥: 위로 갈수록 가늘어지는 몸통에 세로 홈, 갈라지는 자리의 마디,
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
