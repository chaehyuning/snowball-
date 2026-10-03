// 스페인: 바르셀로나 사그라다 파밀리아 실내. 금빛 별 천장,
// 제단 쪽 벽의 장미창과 스테인드글라스, 흩날리는 유리 조각

import { seeded, fillSilhouette } from "./util.mjs";

const JEWEL = ["#2f6fd6", "#1aa3a0", "#3cbf6a", "#7fd0f0", "#f2b632", "#f06a2a", "#d8324a", "#ffd86a"];

// 신랑에서 제단 쪽 벽을 올려다본 구도:
// 별 그물 천장과 숲 기둥(같은 3차원 좌표) → 뾰족 아치 속 장미창과 창 → 성가대 회랑 → 아래 문
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

  // ── 3차원 뼈대 ──────────────────────────────────────────────
  // 점 (X, Y, z) → 화면 (200 + X/z, 230 + (Y-230)/z). X는 z=1에서의 가로 px, Y는 높이(아래로 +),
  // z는 깊이(1 = 가까운 벽 끝, 2.07 = 제단 벽). 깊이 1은 가로 400px 만큼의 거리(DEPTH)
  const DEPTH = 400;
  const P = (X, Y, z) => [200 + X / z, 230 + (Y - 230) / z];
  const onCeil = (X, z) => P(X, CEIL_Y, z);
  // 천장 마디: 가운데 줄(큰 별 볼트), 기둥 바로 위 줄(X=±95, 작은 별), 벽 줄(X=±170).
  // 가운데 줄과 기둥 줄은 깊이가 반 칸씩 엇갈려, 이으면 별 그물(지그재그 삼각형)이 됨
  const COL_X = 95;
  const COL_Z = 1.18;
  const SIDE_Z = [0.72, COL_Z, 1.72];
  const MID_Z = [0.5, 0.94, 1.45, 2.0];
  const tri = (a, b, c) => {
    g.beginPath();
    g.moveTo(...a);
    g.lineTo(...b);
    g.lineTo(...c);
    g.closePath();
  };
  // 삼각 면: 마디(기둥 위 별)에서 가장 밝고 멀어질수록 금빛 그늘. 면마다 밝기를 번갈아 깎인 느낌
  let facet = 0;
  const panel = (hub, a, b) => {
    const [hx, hy] = hub;
    const reach = Math.hypot(a[0] - hx, a[1] - hy) + 10;
    const grad = g.createRadialGradient(hx, hy, 0, hx, hy, reach);
    const light = facet++ % 2 === 0;
    grad.addColorStop(0, "#ffe6a6");
    grad.addColorStop(0.5, light ? "#efbf72" : "#e4b062");
    grad.addColorStop(1, light ? "#c98c45" : "#b97b3a");
    g.fillStyle = grad;
    tri(hub, a, b);
    g.fill();
  };
  for (const s of [-1, 1]) {
    for (let k = 0; k < SIDE_Z.length; k++) {
      const S = onCeil(s * COL_X, SIDE_Z[k]);
      const C0 = onCeil(0, MID_Z[k]);
      const C1 = onCeil(0, MID_Z[k + 1]);
      const W0 = onCeil(s * 170, MID_Z[k]);
      const W1 = onCeil(s * 170, MID_Z[k + 1]);
      panel(S, C0, C1);
      panel(S, W0, W1);
      panel(S, C0, W0);
      panel(S, C1, W1);
    }
    // 앞뒤 끝: 첫 마디 앞과 마지막 마디 뒤를 같은 결로 메움
    const first = onCeil(s * COL_X, SIDE_Z[0]);
    panel(first, onCeil(0, 0.3), onCeil(0, MID_Z[0]));
    panel(first, onCeil(s * 170, 0.3), onCeil(s * 170, MID_Z[0]));
    panel(first, onCeil(0, 0.3), onCeil(s * 170, 0.3));
    const last = onCeil(s * COL_X, SIDE_Z[SIDE_Z.length - 1]);
    panel(last, onCeil(0, MID_Z[3]), onCeil(0, 2.07));
    panel(last, onCeil(s * 170, MID_Z[3]), onCeil(s * 170, 2.07));
    panel(last, onCeil(0, 2.07), onCeil(s * 170, 2.07));
  }
  // 갈비뼈: 삼각 면의 모서리. 가까울수록 굵게
  const rib = (X0, z0, X1, z1) => {
    g.lineWidth = 1.6 / Math.min(z0, z1);
    g.beginPath();
    g.moveTo(...onCeil(X0, z0));
    g.lineTo(...onCeil(X1, z1));
    g.stroke();
  };
  g.lineCap = "round";
  g.strokeStyle = "rgba(140,88,34,0.6)";
  for (const s of [-1, 1]) {
    for (let k = 0; k < SIDE_Z.length; k++) {
      const z = SIDE_Z[k];
      rib(s * COL_X, z, 0, MID_Z[k]);
      rib(s * COL_X, z, 0, MID_Z[k + 1]);
      rib(s * COL_X, z, s * 170, MID_Z[k]);
      rib(s * COL_X, z, s * 170, MID_Z[k + 1]);
    }
  }
  // 별 볼트: 천장 평면 위의 별(바깥 끝 R, 안쪽 r)을 원근으로 옮겨 그림. 가운데는 빛이 들어오는 둥근 구멍
  const star = (X0, z0, n, R, r) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i * Math.PI) / n - Math.PI / 2;
      const rad = i % 2 ? r : R;
      pts.push(onCeil(X0 + rad * Math.cos(a), z0 + (rad * Math.sin(a)) / DEPTH));
    }
    const [cx, cy] = onCeil(X0, z0);
    const body = g.createRadialGradient(cx, cy, 0, cx, cy, R / z0);
    body.addColorStop(0, "#fff6d2");
    body.addColorStop(0.45, "#f7cd6a");
    body.addColorStop(1, "#d9963c");
    g.fillStyle = body;
    g.beginPath();
    pts.forEach((pt, i) => (i ? g.lineTo(...pt) : g.moveTo(...pt)));
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(150,95,35,0.55)";
    g.lineWidth = 0.8 / z0;
    g.stroke();
    // 별 가지마다 가운데 결: 밝은 선이 끝으로 뻗음
    g.strokeStyle = "rgba(255,246,214,0.7)";
    g.lineWidth = 0.6 / z0;
    for (let i = 0; i < n * 2; i += 2) {
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(...pts[i]);
      g.stroke();
    }
    // 둥근 빛 구멍: 테는 어둡고 속은 하얗게 빛남
    const hole = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      hole.push(onCeil(X0 + r * 0.62 * Math.cos(a), z0 + (r * 0.62 * Math.sin(a)) / DEPTH));
    }
    const light = g.createRadialGradient(cx, cy, 0, cx, cy, (r * 0.62) / z0);
    light.addColorStop(0, "#ffffff");
    light.addColorStop(0.6, "#ffe9a6");
    light.addColorStop(1, "#e3a040");
    g.fillStyle = light;
    g.beginPath();
    hole.forEach((pt, i) => (i ? g.lineTo(...pt) : g.moveTo(...pt)));
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(120,72,24,0.6)";
    g.lineWidth = 1 / z0;
    g.stroke();
    g.save();
    g.globalCompositeOperation = "lighter";
    const gr = (r * 1.2) / z0;
    const glow = g.createRadialGradient(cx, cy, 0, cx, cy, gr);
    glow.addColorStop(0, "rgba(255,230,160,0.5)");
    glow.addColorStop(1, "rgba(255,200,120,0)");
    g.fillStyle = glow;
    g.fillRect(cx - gr, cy - gr, gr * 2, gr * 2);
    g.restore();
  };
  for (const z of MID_Z) star(0, z, 8, 58, 24);
  for (const s of [-1, 1]) for (const z of SIDE_Z) star(s * COL_X, z, 6, 38, 15);

  // 천장 전체에 쏟아지는 금빛: 가운데 줄을 따라 밝게 번지고 반짝이는 작은 빛점
  g.save();
  g.globalCompositeOperation = "lighter";
  const gold = g.createRadialGradient(200, 80, 0, 200, 80, 170);
  gold.addColorStop(0, "rgba(255,170,60,0.12)");
  gold.addColorStop(0.5, "rgba(255,160,50,0.04)");
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
  // 세로 띠(벽기둥): 양끝에만
  g.fillStyle = "rgba(150,120,85,0.18)";
  for (const px of [121, 277]) g.fillRect(px, wallTop + 2, 2, 330 - wallTop - 2);

  // 뾰족 아치: 돌 테 안쪽은 살짝 움푹한 그늘, 테는 밝은 윗선과 그늘진 아랫선 두 겹
  const arch = (x0, x1, base, spring, apex) => {
    const mid = (x0 + x1) / 2;
    const ctl = spring - (spring - apex) * 0.62;
    g.beginPath();
    g.moveTo(x0, base);
    g.lineTo(x0, spring);
    g.quadraticCurveTo(x0, ctl, mid, apex);
    g.quadraticCurveTo(x1, ctl, x1, spring);
    g.lineTo(x1, base);
  };
  const archFrame = (x0, x1, base, spring, apex, lw) => {
    arch(x0, x1, base, spring, apex);
    g.closePath();
    g.fillStyle = "rgba(160,125,85,0.12)";
    g.fill();
    arch(x0, x1, base, spring, apex);
    g.lineJoin = "round";
    g.strokeStyle = "rgba(150,112,72,0.6)";
    g.lineWidth = lw + 1.2;
    g.stroke();
    g.strokeStyle = "#fbf2e0";
    g.lineWidth = lw;
    g.stroke();
    arch(x0 + lw, x1 - lw, base, spring + lw * 0.5, apex + lw * 1.6);
    g.strokeStyle = "rgba(150,112,72,0.35)";
    g.lineWidth = 0.6;
    g.stroke();
  };

  // 큰 뾰족 아치 하나가 장미창과 아래 두 창 묶음을 감쌈 (사진처럼)
  archFrame(134, 266, 268, 226, wallTop + 3, 2.6);

  // 큰 장미창: 둘레에 돌 테두리와 방사형 돌살 테를 두르고, 꽃잎은 파랑·초록·노랑
  const RC = [200, wallTop + 30];
  const ring = 25;
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
  roseWindow(g, RC[0], RC[1], 20, ["#1f5fc9", "#2f86e0", "#3cbf6a", "#1aa3a0", "#9ad84a", "#f2c232"]);

  // 장미창 아래 두 묶음: 묶음마다 작은 뾰족 아치 안에 작은 장미창 하나와 긴 창 둘
  const mixed = ["#2f6fd6", "#3cbf6a", "#f2b632", "#f06a2a", "#d8324a", "#7fd0f0", "#ffd86a"];
  for (const [x0, x1] of [[143, 197], [203, 257]]) {
    const mid = (x0 + x1) / 2;
    archFrame(x0, x1, 268, 247, RC[1] + ring + 2, 1.6);
    roseWindow(g, mid, 244, 7, ["#3cbf6a", "#f2b632", "#2f86e0", "#f06a2a", "#d8324a"]);
    stainedWindow(g, rnd, mid - 10, 251, 13, 17, mixed, 1);
    stainedWindow(g, rnd, mid + 10, 251, 13, 17, mixed, 1);
  }
  // 큰 아치 바깥 양옆: 가늘고 긴 창 하나씩
  for (const cx of [127, 273]) stainedWindow(g, rnd, cx, wallTop + 26, 7, 56, mixed, 1);

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

  // 숲 기둥 두 그루: 소실점을 사이에 두고 좌우 같은 깊이(COL_Z)에 섬. 몸통은 곧게 오르다
  // 가지 다섯 갈래로 나뉘어, 각 가지 끝이 천장 별 그물의 마디에 정확히 닿음 (같은 3차원 좌표로 계산)
  for (const side of [-1, 1]) {
    forestColumn(g, P, groundAt, side * COL_X, COL_Z, CEIL_Y, [
      [side * COL_X, COL_Z], // 바로 위 작은 별
      [0, MID_Z[1]], // 안쪽 앞 큰 별
      [0, MID_Z[2]], // 안쪽 뒤 큰 별
      [side * 170, MID_Z[1]], // 벽 쪽 앞
      [side * 170, MID_Z[2]], // 벽 쪽 뒤
    ]);
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

// 숲 기둥: 크림색 몸통이 곧게 오르다 마디를 지나 가지가 갈라짐.
// 가지는 3차원 2차 곡선(처음엔 거의 수직, 위로 갈수록 마디 쪽으로 기움)을 원근으로 옮겨 그림.
// 굵기도 깊이에 맞춰 줄어듦. 소실점(가운데) 쪽 면이 밝음
function forestColumn(g, P, groundAt, X, z, ceilY, targets) {
  const RHO = 6; // 몸통 반지름(가로 px, z=1 기준)
  const SPLIT_Y = 205; // 가지가 갈라지는 높이
  const [cx, splitY] = P(X, SPLIT_Y, z);
  const baseY = groundAt(cx) + 4;
  const half = RHO / z;
  const lightSide = X < 0 ? 1 : -1; // 가운데 쪽(+1이면 오른쪽)이 밝음

  g.save();
  // 몸통
  const trunk = g.createLinearGradient(cx - half * lightSide, 0, cx + half * lightSide, 0);
  trunk.addColorStop(0, "#a8957a");
  trunk.addColorStop(0.55, "#e6d6b8");
  trunk.addColorStop(0.8, "#fff6e4");
  trunk.addColorStop(1, "#d9c6a4");
  g.fillStyle = trunk;
  g.beginPath();
  g.moveTo(cx - half, baseY);
  g.lineTo(cx - half * 0.86, splitY);
  g.lineTo(cx + half * 0.86, splitY);
  g.lineTo(cx + half, baseY);
  g.closePath();
  g.fill();
  // 마디: 몸통 3분의 1 높이의 둥근 띠
  const knotY = baseY - (baseY - splitY) * 0.38;
  g.fillStyle = "#f4e6c8";
  g.beginPath();
  g.ellipse(cx, knotY, half * 1.15, half * 0.32, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(110,85,55,0.35)";
  g.beginPath();
  g.ellipse(cx, knotY + half * 0.3, half * 0.95, half * 0.14, 0, 0, Math.PI * 2);
  g.fill();

  // 가지: 몸통 끝 B에서 천장 마디 T까지. 조절점은 B 바로 위(수평으로 15%만 기움, 높이는 55% 올라감)
  for (const [TX, Tz] of targets) {
    const B = [X, SPLIT_Y, z];
    const T = [TX, ceilY, Tz];
    const C = [X + (TX - X) * 0.15, SPLIT_Y - (SPLIT_Y - ceilY) * 0.55, z + (Tz - z) * 0.15];
    const at = (t) => {
      const u = 1 - t;
      return [0, 1, 2].map((i) => u * u * B[i] + 2 * u * t * C[i] + t * t * T[i]);
    };
    const L = [];
    const R = [];
    const steps = 18;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const [x3, y3, z3] = at(t);
      const [px, py] = P(x3, y3, z3);
      const [qx, qy] = P(...at(Math.min(1, t + 0.02)));
      const [ox, oy] = P(...at(Math.max(0, t - 0.02)));
      const ang = Math.atan2(qy - oy, qx - ox) + Math.PI / 2;
      const w = ((RHO * 0.62) * (1 - 0.45 * t)) / z3;
      L.push([px + Math.cos(ang) * w, py + Math.sin(ang) * w]);
      R.push([px - Math.cos(ang) * w, py - Math.sin(ang) * w]);
    }
    g.beginPath();
    L.forEach((pt, i) => (i ? g.lineTo(...pt) : g.moveTo(...pt)));
    for (let i = R.length - 1; i >= 0; i--) g.lineTo(...R[i]);
    g.closePath();
    g.fillStyle = "#eadbbd";
    g.fill();
    g.strokeStyle = "rgba(120,92,60,0.4)";
    g.lineWidth = 0.6;
    g.stroke();
    // 빛 받는 결: 가운데 쪽 가장자리를 따라 밝은 줄
    const lit = lightSide * (L[0][0] - R[0][0]) > 0 ? L : R;
    g.strokeStyle = "rgba(255,250,236,0.85)";
    g.lineWidth = 0.9;
    g.beginPath();
    lit.forEach((pt, i) => (i ? g.lineTo(...pt) : g.moveTo(...pt)));
    g.stroke();
    // 가지 끝이 천장에 닿는 자리: 천장 평면 위의 작은 원판
    const cap = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      cap.push(P(TX + 5 * Math.cos(a), ceilY, Tz + (5 * Math.sin(a)) / 400));
    }
    g.fillStyle = "#f6e9cc";
    g.beginPath();
    cap.forEach((pt, i) => (i ? g.lineTo(...pt) : g.moveTo(...pt)));
    g.closePath();
    g.fill();
  }
  // 가지가 갈라지는 어깨
  g.fillStyle = "#efe1c4";
  g.beginPath();
  g.ellipse(cx, splitY, half * 1.05, half * 0.3, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
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
