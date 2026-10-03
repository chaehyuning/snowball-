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

  // 천장: 양옆 벽 윗선과 같은 소실점(200, 230)으로 모이는 평면. 높이(worldY)는 벽 꼭대기와 같음.
  // 가로 s(-1 왼쪽 벽 ~ 1 오른쪽 벽), 깊이 z(작을수록 가까움)로 놓고 화면에 옮김
  const CEIL_Y = 64 + 0.15 * 373;
  const ceil = (sx, z) => [200 + (sx * 170) / z, 230 + (CEIL_Y - 230) / z];
  const zs = [0.5, 0.62, 0.78, 1, 1.3, 1.7, 2.07];
  // 세로 갈비뼈: 벽과 나란히 소실점으로 모이는 선
  g.strokeStyle = "rgba(160,110,50,0.35)";
  g.lineCap = "round";
  for (const sx of [-1, -0.5, 0, 0.5, 1]) {
    g.lineWidth = sx === 0 ? 1.4 : 1;
    g.beginPath();
    g.moveTo(...ceil(sx, 0.45));
    g.lineTo(...ceil(sx, 2.07));
    g.stroke();
  }
  // 가로 갈비뼈: 깊이마다 한 줄, 멀수록 촘촘
  for (const z of zs) {
    g.lineWidth = 1.4 / z;
    g.beginPath();
    g.moveTo(...ceil(-1, z));
    g.lineTo(...ceil(1, z));
    g.stroke();
  }
  // 격자 칸마다 움푹한 금빛 판(코퍼)을 채워 빈 곳이 없게: 가운데는 밝고 가장자리는 그늘
  const sxs = [-1, -0.5, 0, 0.5, 1];
  for (let k = 0; k < zs.length - 1; k++) {
    for (let i = 0; i < sxs.length - 1; i++) {
      const pts = [ceil(sxs[i], zs[k]), ceil(sxs[i + 1], zs[k]), ceil(sxs[i + 1], zs[k + 1]), ceil(sxs[i], zs[k + 1])];
      const [mx, my] = ceil((sxs[i] + sxs[i + 1]) / 2, (zs[k] + zs[k + 1]) / 2);
      const panel = g.createRadialGradient(mx, my, 0, mx, my, 40 / zs[k]);
      panel.addColorStop(0, "rgba(255,226,150,0.55)");
      panel.addColorStop(1, "rgba(190,130,60,0.35)");
      g.fillStyle = panel;
      g.beginPath();
      pts.forEach((pt, j) => (j ? g.lineTo(...pt) : g.moveTo(...pt)));
      g.closePath();
      g.fill();
      // 칸 안쪽 테두리: 한 단 들어간 금빛 테
      const inset = pts.map(([x, y]) => [mx + (x - mx) * 0.82, my + (y - my) * 0.82]);
      g.strokeStyle = "rgba(255,236,180,0.6)";
      g.lineWidth = 0.8 / zs[k];
      g.beginPath();
      inset.forEach((pt, j) => (j ? g.lineTo(...pt) : g.moveTo(...pt)));
      g.closePath();
      g.stroke();
    }
  }
  // 금빛 갈비뼈를 한 번 더 굵게
  g.strokeStyle = "rgba(200,140,50,0.55)";
  for (const sx of sxs) {
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(...ceil(sx, 0.45));
    g.lineTo(...ceil(sx, 2.07));
    g.stroke();
  }
  for (const z of zs) {
    g.lineWidth = 1.8 / z;
    g.beginPath();
    g.moveTo(...ceil(-1, z));
    g.lineTo(...ceil(1, z));
    g.stroke();
  }
  // 칸마다 잎사귀 볼트 하나. 가운데 줄은 금빛 별 천창
  const rc = seeded(1926);
  for (let k = 0; k < zs.length - 1; k++) {
    const z = (zs[k] + zs[k + 1]) / 2;
    for (const sx of [-0.75, -0.25, 0.25, 0.75]) {
      const [x, y] = ceil(sx, z);
      leafVault(g, x, y, 11 / z, rc);
    }
    const [cx, cy] = ceil(0, zs[k]);
    starVault(g, cx, cy, 16 / zs[k]);
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

  // 제단 쪽 벽: 천장 맨 끝 갈비뼈(z = 2.07) 바로 아래에서 시작해 천장과 벽이 한 선에서 만남
  const [, wallTop] = ceil(0, 2.07);
  const wall = g.createLinearGradient(0, wallTop, 0, 330);
  wall.addColorStop(0, "#f3e2c4");
  wall.addColorStop(0.3, "#f6ead6");
  wall.addColorStop(1, "#dcc6a4");
  g.fillStyle = wall;
  g.fillRect(118, wallTop, 164, 330 - wallTop);
  // 천장 끝을 받치는 금빛 쇠시리와 그 아래 그늘
  g.fillStyle = "#c8913e";
  g.fillRect(118, wallTop - 1, 164, 3);
  g.fillStyle = "#f2d08a";
  g.fillRect(118, wallTop - 1, 164, 1);
  const lip = g.createLinearGradient(0, wallTop + 2, 0, wallTop + 10);
  lip.addColorStop(0, "rgba(140,100,55,0.35)");
  lip.addColorStop(1, "rgba(140,100,55,0)");
  g.fillStyle = lip;
  g.fillRect(118, wallTop + 2, 164, 8);
  // 세로 띠(벽기둥): 창 사이에만
  g.fillStyle = "rgba(150,120,85,0.18)";
  for (const px of [121, 172, 226, 277]) g.fillRect(px, wallTop + 2, 2, 330 - wallTop - 2);

  // 큰 장미창: 둘레에 돌 테두리와 방사형 돌살 테를 두르고, 꽃잎은 파랑·초록·노랑
  const RC = [200, wallTop + 33];
  const ring = 34;
  for (let k = 0; k < 24; k++) {
    const a0 = (k / 24) * Math.PI * 2;
    const a1 = ((k + 1) / 24) * Math.PI * 2;
    g.fillStyle = k % 2 ? "rgba(236,214,176,0.95)" : "rgba(214,184,140,0.95)";
    g.beginPath();
    g.moveTo(RC[0], RC[1]);
    g.arc(RC[0], RC[1], ring, a0, a1);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = "rgba(150,110,70,0.5)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.arc(RC[0], RC[1], ring, 0, Math.PI * 2);
  g.stroke();
  roseWindow(g, RC[0], RC[1], 26, ["#1f5fc9", "#2f86e0", "#3cbf6a", "#1aa3a0", "#9ad84a", "#f2c232"]);

  // 장미창 양옆: 작은 장미창과 그 아래 긴 창 한 쌍. 가운데 아래에는 짧은 창 셋
  const mixed = ["#2f6fd6", "#3cbf6a", "#f2b632", "#f06a2a", "#d8324a", "#7fd0f0", "#ffd86a"];
  for (const cx of [147, 253]) {
    roseWindow(g, cx, wallTop + 22, 9, ["#3cbf6a", "#f2b632", "#2f86e0", "#f06a2a", "#d8324a"]);
    stainedWindow(g, rnd, cx - 9, wallTop + 36, 11, 44, mixed, 1);
    stainedWindow(g, rnd, cx + 9, wallTop + 36, 11, 44, mixed, 1);
  }
  for (const cx of [186, 200, 214]) stainedWindow(g, rnd, cx, RC[1] + ring + 4, 9, 20, mixed, 1);

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

  // 양옆 벽: 소실점(200, 230)으로 모이는 원근 벽면. 그 위에 창을 벽 평면에 맞춰 사다리꼴로 그림.
  // 가까운 창은 크고 높으며, 제단 쪽으로 갈수록 작아지고 소실점 쪽으로 몰림
  const coolGlass = ["#1f5fc9", "#2f86e0", "#1aa3a0", "#3cbf6a", "#7fd0f0", "#9ad84a"];
  const warmGlass = ["#d8324a", "#e0531f", "#f08a24", "#f2b632", "#ffd86a", "#c2185b"];
  const VPX = 200;
  const VPY = 230;
  const FAR_Z = 170 / 82; // 가까운 벽 끝(x=30)에서 제단 벽 모서리(x=118)까지의 깊이 비율
  for (const side of [-1, 1]) {
    const palette = side < 0 ? coolGlass : warmGlass;
    // (u: 0 가까움 → 1 제단 쪽, v: 0 위 → 1 아래) → 화면 좌표
    const map = (u, v) => {
      const z = 1 + u * (FAR_Z - 1);
      const worldY = 64 + v * 373;
      return [VPX + (side * 170) / z, VPY + (worldY - VPY) / z];
    };
    const at = map;
    const quad = (u0, v0, u1, v1) => {
      g.beginPath();
      g.moveTo(...at(u0, v0));
      g.lineTo(...at(u1, v0));
      g.lineTo(...at(u1, v1));
      g.lineTo(...at(u0, v1));
      g.closePath();
    };
    // 벽면: 가까운 쪽은 그늘, 제단 쪽은 밝음
    const [nx] = at(0, 0.5);
    const [fx] = at(1, 0.5);
    const wallGrad = g.createLinearGradient(nx, 0, fx, 0);
    wallGrad.addColorStop(0, "#c9ad84");
    wallGrad.addColorStop(1, "#f2e2c4");
    g.fillStyle = wallGrad;
    quad(0, 0.15, 1, 1);
    g.fill();
    // 벽의 가로 띠(회랑 턱)와 세로 기둥띠: 모두 소실점으로 모임
    for (const v of [0.34, 0.66]) {
      g.fillStyle = "#ecd8b2";
      quad(0, v, 1, v + 0.012);
      g.fill();
      g.fillStyle = "rgba(110,80,50,0.35)";
      quad(0, v + 0.012, 1, v + 0.018);
      g.fill();
    }
    for (const u of [0.08, 0.36, 0.62, 0.84]) {
      g.fillStyle = "rgba(150,120,85,0.22)";
      quad(u, 0.15, u + 0.025, 1);
      g.fill();
    }
    // 창: 아래 큰 창 + 위 작은 창 + 그 사이 장미창
    for (const [u0, u1] of [[0.13, 0.31], [0.42, 0.56], [0.68, 0.79]]) {
      perspWindow(g, rnd, at, u0, 0.4, u1, 0.63, palette);
      perspWindow(g, rnd, at, u0 + (u1 - u0) * 0.2, 0.19, u1 - (u1 - u0) * 0.2, 0.31, palette);
      const [rx, ry] = at((u0 + u1) / 2, 0.375);
      const [rx2] = at(u1, 0.375);
      roseWindow(g, rx, ry, Math.abs(rx2 - rx) * 0.5, palette);
    }
    // 창 둘레로 번지는 색빛
    g.save();
    g.globalCompositeOperation = "lighter";
    const [gx, gy] = at(0.35, 0.5);
    const spill = g.createRadialGradient(gx, gy, 0, gx, gy, 110);
    spill.addColorStop(0, side < 0 ? "rgba(60,140,230,0.25)" : "rgba(240,110,50,0.25)");
    spill.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = spill;
    g.fillRect(left, 120, size, 250);
    g.restore();
  }

  // 숲 기둥 두 그루: 소실점(200, 230)을 사이에 두고 좌우 같은 깊이에 섬. 세로선은 그대로 곧고,
  // 위에서 가지가 갈라져 천장을 받침
  for (const side of [-1, 1]) forestColumn(g, side, 0.56, 1.18, CEIL_Y, groundAt);

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

// 숲 기둥: 짙은 반암 밑동 → 타원 마디 → 크림색 몸통 → 네 갈래 가지가 천장으로 퍼짐.
// 제단 쪽(안쪽) 면이 밝고 바깥 면은 그늘. 벽과 같은 원근(가로 sx, 깊이 z)으로 놓음
function forestColumn(g, side, sx, z, ceilY, groundAt) {
  const cx = 200 + (side * sx * 170) / z;
  const baseY = groundAt(cx) + 4; // 바닥(입자가 쌓이는 선)에 밑동이 닿음
  const topY = 230 + (ceilY - 230) / z;
  const w = 15 / z;
  const knotY = baseY - (baseY - topY) * 0.3;
  const splitY = baseY - (baseY - topY) * 0.6;
  const wAt = (y) => w * (1 - 0.3 * ((baseY - y) / (baseY - splitY)));
  const trunk = (y0, y1) => {
    g.beginPath();
    for (let y = y1; y >= y0; y -= 2) g.lineTo(cx - wAt(y) / 2, y);
    for (let y = y0; y <= y1; y += 2) g.lineTo(cx + wAt(y) / 2, y);
    g.closePath();
  };

  g.save();
  // 바닥에 떨어진 그림자: 밑동에서 바깥 앞쪽으로 번짐
  g.save();
  g.filter = "blur(4px)";
  g.fillStyle = "rgba(70,45,20,0.35)";
  g.beginPath();
  g.ellipse(cx - side * w * 0.6, baseY - 2, w * 1.3, w * 0.28, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // 몸통 한 토막: 안쪽은 밝고 바깥쪽으로 둥글게 어두워짐
  const paint = (y0, y1, hi, mid, lo) => {
    g.save();
    trunk(y0, y1);
    g.clip();
    const half = wAt(y1) / 2 + 2;
    const inner = cx - side * half;
    const outer = cx + side * half;
    const round = g.createLinearGradient(inner, 0, outer, 0);
    round.addColorStop(0, mid);
    round.addColorStop(0.22, hi);
    round.addColorStop(0.55, mid);
    round.addColorStop(1, lo);
    g.fillStyle = round;
    g.fillRect(cx - half - 2, y0 - 2, half * 2 + 4, y1 - y0 + 4);
    // 세로 홈: 몸통을 따라 옅게
    g.lineWidth = 0.5;
    for (const f of [-0.28, 0, 0.28]) {
      g.strokeStyle = f * side < 0 ? "rgba(255,250,240,0.16)" : "rgba(40,30,20,0.12)";
      g.beginPath();
      for (let y = y1; y >= y0; y -= 4) g.lineTo(cx + f * wAt(y), y);
      g.stroke();
    }
    g.restore();
  };
  paint(knotY, baseY, "#efe3cc", "#cbb896", "#8e7a5e");
  paint(splitY, knotY, "#fff6e6", "#ddcaa6", "#9a8160");

  // 마디: 몸통이 부풀어 오른 둥근 띠
  const kw = wAt(knotY);
  const knot = g.createLinearGradient(0, knotY - kw * 0.22, 0, knotY + kw * 0.22);
  knot.addColorStop(0, "#fbf1dc");
  knot.addColorStop(0.5, "#d8c6a4");
  knot.addColorStop(1, "#9a8466");
  g.fillStyle = knot;
  g.beginPath();
  g.ellipse(cx, knotY, kw * 0.6, kw * 0.18, 0, 0, Math.PI * 2);
  g.fill();

  // 가지: 몸통 끝에서 네 갈래. 바깥 가지는 옆으로 눕고, 안쪽 가지는 소실점 쪽으로 기움
  const sw = wAt(splitY);
  const limb = (x0, y0, kx, ky, ex, ey, w0, w1) => {
    const pt = (t) => {
      const u = 1 - t;
      return [u * u * x0 + 2 * u * t * kx + t * t * ex, u * u * y0 + 2 * u * t * ky + t * t * ey];
    };
    const L = [];
    const R = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      const [px, py] = pt(t);
      const [qx, qy] = pt(Math.min(1, t + 0.01));
      const a = Math.atan2(qy - py, qx - px) + Math.PI / 2;
      const h = (w0 + (w1 - w0) * t) / 2;
      L.push([px + Math.cos(a) * h, py + Math.sin(a) * h]);
      R.push([px - Math.cos(a) * h, py - Math.sin(a) * h]);
    }
    g.beginPath();
    L.forEach((q, i) => (i ? g.lineTo(...q) : g.moveTo(...q)));
    for (let i = R.length - 1; i >= 0; i--) g.lineTo(...R[i]);
    g.closePath();
    const body = g.createLinearGradient(cx - side * sw, 0, cx + side * sw, 0);
    body.addColorStop(0, "#fff6e6");
    body.addColorStop(0.5, "#e2d0ae");
    body.addColorStop(1, "#a88f6c");
    g.fillStyle = body;
    g.fill();
    g.strokeStyle = "rgba(110,85,55,0.3)";
    g.lineWidth = 0.5;
    g.stroke();
    return pt(1);
  };
  const ends = [];
  for (const [dx, reach] of [[-1.5, 0.96], [-0.45, 1], [0.45, 1], [1.5, 0.96]]) {
    const ex = cx + dx * sw * 2.6;
    const ey = splitY - (splitY - topY) * reach;
    ends.push(limb(cx + dx * sw * 0.2, splitY + 4, cx + dx * sw * 0.35, splitY - (splitY - ey) * 0.5, ex, ey, sw * 0.42, sw * 0.18));
  }
  // 가지 끝: 천장에 닿는 작은 꽃받침 원반 (아랫면 그늘)
  for (const [ex, ey] of ends) {
    g.fillStyle = "#f3e4c4";
    g.beginPath();
    g.ellipse(ex, ey, sw * 0.42, sw * 0.12, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(120,90,50,0.35)";
    g.beginPath();
    g.ellipse(ex, ey + sw * 0.08, sw * 0.36, sw * 0.06, 0, 0, Math.PI * 2);
    g.fill();
  }
  // 가지가 갈라지는 자리를 덮는 매끈한 어깨
  g.fillStyle = "#e9d9bb";
  g.beginPath();
  g.ellipse(cx, splitY + 3, sw * 0.62, sw * 0.2, 0, 0, Math.PI * 2);
  g.fill();
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

// 원근 창: 벽 평면 좌표 (u, v)를 화면으로 옮기는 at()을 받아 창틀·색유리·납선을 모두 사다리꼴로 그림.
// 위쪽은 반원 아치. 가까운 쪽 세로선이 길고 먼 쪽은 짧아 벽에 붙어 보임
function perspWindow(g, rnd, at, u0, v0, u1, v1, palette) {
  const um = (u0 + u1) / 2;
  const hu = (u1 - u0) / 2;
  const archV = Math.min((v1 - v0) * 0.35, hu * 1.4);
  const outline = (pad) => {
    g.beginPath();
    g.moveTo(...at(u0 - pad, v1 + pad));
    g.lineTo(...at(u0 - pad, v0 + archV));
    for (let k = 0; k <= 16; k++) {
      const a = Math.PI + (k / 16) * Math.PI;
      g.lineTo(...at(um + Math.cos(a) * (hu + pad), v0 + archV + Math.sin(a) * (archV + pad)));
    }
    g.lineTo(...at(u1 + pad, v1 + pad));
    g.closePath();
  };
  // 돌 창틀과 창틀 안쪽 그늘(두께)
  g.fillStyle = "#cdb48e";
  outline(hu * 0.25);
  g.fill();
  g.save();
  outline(0);
  g.clip();
  const cols = 3;
  const rows = 7;
  const grid = [];
  for (let j = 0; j <= rows; j++) {
    grid.push([]);
    for (let i = 0; i <= cols; i++) {
      const edge = i === 0 || i === cols || j === 0 || j === rows;
      const ju = edge ? 0 : (rnd() - 0.5) * 0.3;
      const jv = edge ? 0 : (rnd() - 0.5) * 0.3;
      grid[j].push(at(u0 + ((i + ju) / cols) * (u1 - u0), v0 + ((j + jv) / rows) * (v1 - v0)));
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      g.fillStyle = palette[Math.floor(rnd() * palette.length)];
      g.beginPath();
      g.moveTo(...grid[j][i]);
      g.lineTo(...grid[j][i + 1]);
      g.lineTo(...grid[j + 1][i + 1]);
      g.lineTo(...grid[j + 1][i]);
      g.closePath();
      g.fill();
      if (rnd() < 0.3) {
        g.fillStyle = "rgba(255,255,240,0.3)";
        g.fill();
      }
    }
  }
  g.strokeStyle = "rgba(35,28,40,0.65)";
  g.lineWidth = 0.5;
  for (let j = 0; j <= rows; j++) {
    g.beginPath();
    grid[j].forEach((pt, i) => (i ? g.lineTo(...pt) : g.moveTo(...pt)));
    g.stroke();
  }
  for (let i = 0; i <= cols; i++) {
    g.beginPath();
    for (let j = 0; j <= rows; j++) (j ? g.lineTo : g.moveTo).call(g, ...grid[j][i]);
    g.stroke();
  }
  // 창틀 두께: 가까운 쪽 안쪽 벽면의 그늘
  g.fillStyle = "rgba(60,40,25,0.35)";
  g.beginPath();
  g.moveTo(...at(u0, v1));
  g.lineTo(...at(u0, v0 + archV));
  g.lineTo(...at(u0 + hu * 0.25, v0 + archV));
  g.lineTo(...at(u0 + hu * 0.25, v1));
  g.closePath();
  g.fill();
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
  const cols = Math.max(3, Math.round(w / 4));
  const rows = Math.max(6, Math.round(h / 4.5));
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
    trim: ["#2a7a50", "#c6f0d2", "#5cc987", "#1f5e3d"],
    plate: "Sagrada Família",
    plateFont: "italic 600 15px Georgia, 'Times New Roman', serif",
    plateInk: "#0f2e1d",
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
