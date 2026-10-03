// 캐나다: 가을 노을 속 퀘벡 샤토 프롱트낙(드라마 「도깨비」 촬영지)과 흩날리는 단풍잎

import { seeded, fillSilhouette, paintTree } from "./util.mjs";

const LEAF_COLORS = ["#c8321e", "#e0531f", "#f08a24", "#f2b233", "#a8231a"];
const COPPER = ["#5fae94", "#3f8a74", "#2c6655"]; // 녹청이 슨 구리 지붕
const BRICK = ["#a4543c", "#8c4330", "#743524"];

// 「도깨비」에 나온 구도: 단풍나무가 선 언덕 위에서
// 아래쪽 샤토 프롱트낙과 구시가지, 그 뒤 세인트로렌스강을 내려다봄
function paintQuebec(g, globe, groundAt) {
  const rnd = seeded(1608);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 가을 노을 하늘
  const sky = g.createLinearGradient(0, top, 0, 235);
  sky.addColorStop(0, "#5f7fb8");
  sky.addColorStop(0.45, "#c9a7b4");
  sky.addColorStop(0.8, "#f2bf8c");
  sky.addColorStop(1, "#f6a368");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 강 건너편 너머로 지는 해
  const sunX = 300;
  const sunY = 222;
  const sun = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120);
  sun.addColorStop(0, "rgba(255,240,200,1)");
  sun.addColorStop(0.08, "rgba(255,220,160,0.7)");
  sun.addColorStop(1, "rgba(255,200,140,0)");
  g.fillStyle = sun;
  g.fillRect(left, top, size, size);

  // 노을빛 구름
  g.filter = "blur(5px)";
  for (let i = 0; i < 9; i++) {
    g.fillStyle = `rgba(255,${Math.round(r(170, 215))},${Math.round(r(150, 190))},${r(0.3, 0.55)})`;
    g.beginPath();
    g.ellipse(r(60, 350), r(75, 190), r(30, 80), r(4, 10), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.filter = "none";

  // 강 건너편 레비 기슭
  const shoreY = (x) => 229 + 3 * Math.sin(x * 0.04 + 1) + 2 * Math.sin(x * 0.13);
  g.fillStyle = "#857a9c";
  fillSilhouette(g, shoreY, left, right, 400);

  // 세인트로렌스강과 해 반사
  const river = g.createLinearGradient(0, 234, 0, 310);
  river.addColorStop(0, "#e0ad90");
  river.addColorStop(1, "#66708f");
  g.fillStyle = river;
  g.fillRect(left, 234, size, 90);
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 50; i++) {
    const y = r(236, 300);
    const w = r(8, 34) * (1 - (y - 236) / 90);
    g.fillStyle = `rgba(255,215,165,${r(0.12, 0.35)})`;
    g.fillRect(sunX - w / 2 + r(-12, 12), y, w, 0.8);
  }
  g.globalCompositeOperation = "source-over";

  // 호텔이 올라앉은 강가 절벽(디아망 곶)과 단풍 든 숲
  const bluffY = (x) => {
    const d = Math.abs(x - 275) / 95;
    return d >= 1 ? 400 : 264 + 30 * d ** 3 + 1.5 * Math.sin(x * 0.3);
  };
  const bluff = g.createLinearGradient(0, 262, 0, 305);
  bluff.addColorStop(0, "#7a5d44");
  bluff.addColorStop(1, "#4a382c");
  g.fillStyle = bluff;
  fillSilhouette(g, bluffY, 178, 372, 400);
  for (let i = 0; i < 160; i++) {
    const x = r(185, 365);
    const y = r(bluffY(x) + 2, 304);
    g.globalAlpha = r(0.6, 0.95);
    g.fillStyle = [...LEAF_COLORS, "#6b5a2a"][Math.floor(rnd() * 6)];
    g.beginPath();
    g.arc(x, y, r(0.8, 1.8), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // 언덕 아래 강가 절벽 위의 샤토 프롱트낙 (멀리 있어서 작게)
  g.save();
  g.translate(262, 270);
  g.scale(0.7, 0.7);
  paintChateau(g, r, seeded(1893), 0, 0);
  // 호텔은 따로 난수를 쓰고, 예전 호텔이 쓰던 만큼 건너뛰어 나무·벤치 모양을 그대로 유지
  for (let i = 0; i < 508; i++) rnd();
  g.restore();

  // 성 아래 구시가지 지붕들
  for (let i = 0; i < 46; i++) {
    const x = r(178, 372);
    const base = r(278, 302);
    const w = r(6, 12);
    const h = r(6, 13);
    g.fillStyle = ["#cbb79a", "#b49c80", "#9c8670", "#d8c6aa"][Math.floor(rnd() * 4)];
    g.fillRect(x, base - h, w, h);
    g.fillStyle = rnd() < 0.3 ? COPPER[1] : ["#3d3a3e", "#5a4a44"][Math.floor(rnd() * 2)];
    g.beginPath();
    g.moveTo(x - 1, base - h);
    g.lineTo(x + w / 2, base - h - r(3, 6));
    g.lineTo(x + w + 1, base - h);
    g.closePath();
    g.fill();
    for (let k = 0; k < 2; k++) {
      g.fillStyle = rnd() < 0.5 ? "#ffd38a" : "#4a3a34";
      g.fillRect(x + 1.5 + k * (w / 2), base - h + 3, 1.3, 1.8);
    }
  }

  // 퀘벡–레비 페리: 흰 배에 파란 띠
  g.fillStyle = "#f2f2f2";
  g.fillRect(318, 245, 24, 4);
  g.fillStyle = "#2f5aa0";
  g.fillRect(318, 248, 24, 1.4);
  g.fillStyle = "#f2f2f2";
  g.fillRect(324, 241, 12, 4);
  g.fillStyle = "#2a2a3a";
  g.fillRect(328, 238, 2, 3);
  g.strokeStyle = "rgba(255,240,220,0.7)";
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(342, 250);
  g.quadraticCurveTo(352, 249, 362, 251);
  g.stroke();

  // 성과 강 건너편을 덮는 옅은 노을 안개 (멀어서 흐릿함)
  const farMist = g.createLinearGradient(0, 220, 0, 290);
  farMist.addColorStop(0, "rgba(246,190,150,0)");
  farMist.addColorStop(0.5, "rgba(246,190,150,0.18)");
  farMist.addColorStop(1, "rgba(246,190,150,0.05)");
  g.fillStyle = farMist;
  g.fillRect(left, 220, size, 70);

  // 앞쪽 잔디 언덕: 왼쪽이 높고 오른쪽 아래로 내려감
  const hillY = (x) => 212 + 95 / (1 + Math.exp(-(x - 170) / 45)) + 1.5 * Math.sin(x * 0.17);
  const grass = g.createLinearGradient(0, 212, 0, 335);
  grass.addColorStop(0, "#a3a04a");
  grass.addColorStop(0.5, "#7d883a");
  grass.addColorStop(1, "#4d5828");
  g.fillStyle = grass;
  fillSilhouette(g, hillY, left, right, 400);

  // 해를 받는 언덕 능선
  g.strokeStyle = "rgba(255,210,140,0.55)";
  g.lineWidth = 1.5;
  g.beginPath();
  for (let x = left; x <= right; x += 2) g.lineTo(x, hillY(x) + 0.5);
  g.stroke();

  // 잔디 결과 떨어진 단풍잎
  for (let i = 0; i < 500; i++) {
    const x = r(left, right);
    const y = r(hillY(x) + 2, 335);
    g.strokeStyle = ["rgba(70,80,30,0.5)", "rgba(200,190,90,0.45)", "rgba(190,110,40,0.4)"][Math.floor(rnd() * 3)];
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + r(-1, 1), y - r(1.5, 3.5));
    g.stroke();
  }
  for (let i = 0; i < 120; i++) {
    const x = r(left, 260);
    const y = r(hillY(x) + 3, 330);
    g.globalAlpha = r(0.6, 0.95);
    g.fillStyle = LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)];
    g.beginPath();
    g.ellipse(x, y, r(1.2, 2.4), r(0.7, 1.3), r(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // 언덕 위 벤치와 가로등
  const benchX = 158;
  const benchY = hillY(benchX) + 4;
  g.fillStyle = "#3a2a20";
  g.fillRect(benchX - 11, benchY - 6, 22, 2);
  g.fillRect(benchX - 11, benchY - 11, 22, 1.6);
  g.fillRect(benchX - 9, benchY - 6, 1.4, 6);
  g.fillRect(benchX + 8, benchY - 6, 1.4, 6);
  const lampX = 196;
  const lampY = hillY(lampX) + 3;
  g.strokeStyle = "#2c2622";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(lampX, lampY);
  g.lineTo(lampX, lampY - 26);
  g.stroke();
  const lamp = g.createRadialGradient(lampX, lampY - 27, 0, lampX, lampY - 27, 7);
  lamp.addColorStop(0, "rgba(255,222,150,0.95)");
  lamp.addColorStop(1, "rgba(255,222,150,0)");
  g.fillStyle = lamp;
  g.fillRect(lampX - 7, lampY - 34, 14, 14);

  // 언덕 위 큰 단풍나무와 오른쪽 가장자리 작은 나무
  const maple = { trunk: "#3a2418", shade: "#7e2414", colors: LEAF_COLORS.slice(0, 4) };
  paintTree(g, rnd, 92, hillY(92) + 6, 42, -1.5, 7, 5, maple);
  paintTree(g, rnd, 378, 352, 32, -1.95, 5, 4, maple);

  // 낙엽이 깔린 바닥
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#b8642c");
  floor.addColorStop(1, "#6e3518");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  for (let i = 0; i < 450; i++) {
    const x = r(left, right);
    const y = groundAt(x) + r(1, 45);
    g.globalAlpha = r(0.5, 0.95);
    g.fillStyle = LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)];
    g.beginPath();
    g.ellipse(x, y, r(1.4, 3), r(0.8, 1.6), r(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  g.restore();
}

// 샤토 프롱트낙: 가운데 높이 솟은 벽돌 탑에 짙은 슬레이트빛 가파른 지붕,
// 네 귀퉁이에 뾰족한 작은 망루. 양옆 낮은 날개는 녹청 구리 지붕에 뾰족탑이 줄지어 있어 성처럼 보임
const SLATE = ["#5a4a52", "#43363f", "#2e252c"];

function paintChateau(g, r, rnd, cx, ground) {
  // 벽돌 벽 + 창문. light는 왼쪽에서 드는 노을빛 세기
  function wall(x, y, w, h, light = 0) {
    const brick = g.createLinearGradient(x, 0, x + w, 0);
    brick.addColorStop(0, BRICK[2]);
    brick.addColorStop(0.35, BRICK[0]);
    brick.addColorStop(1, BRICK[1]);
    g.fillStyle = brick;
    g.fillRect(x, y, w, h);
    if (light) {
      g.fillStyle = `rgba(255,190,120,${light})`;
      g.fillRect(x, y, w, h);
    }
    // 밝은 석재 띠
    g.fillStyle = "rgba(235,215,185,0.4)";
    for (let by = y + 9; by < y + h; by += 13) g.fillRect(x, by, w, 0.9);
    // 창문: 노을 시간이라 일부만 불이 켜짐
    for (let wy = y + 4; wy < y + h - 4; wy += 6) {
      for (let wx = x + 2.2; wx < x + w - 2.5; wx += 4) {
        g.fillStyle = rnd() < 0.28 ? "#ffd38a" : "#3b2522";
        g.fillRect(wx, wy, 1.7, 2.8);
      }
    }
  }

  function gradient(colors, x, w) {
    const grad = g.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, colors[2]);
    grad.addColorStop(0.4, colors[0]);
    grad.addColorStop(1, colors[1]);
    return grad;
  }

  // 지붕창: 밝은 석재 틀에 뾰족한 머리
  function dormer(x, y, s = 1) {
    g.fillStyle = "#e6d6bc";
    g.beginPath();
    g.moveTo(x - 2 * s, y + 4 * s);
    g.lineTo(x - 2 * s, y);
    g.lineTo(x, y - 2.6 * s);
    g.lineTo(x + 2 * s, y);
    g.lineTo(x + 2 * s, y + 4 * s);
    g.closePath();
    g.fill();
    g.fillStyle = rnd() < 0.35 ? "#ffd38a" : "#2c2a2e";
    g.fillRect(x - 0.9 * s, y + 0.3 * s, 1.8 * s, 3 * s);
  }

  // 가파른 지붕(사다리꼴). 지붕창을 rows 줄로 늘어놓음
  function roof(x, y, w, topW, h, colors, rows = 1) {
    g.fillStyle = gradient(colors, x, w);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (w - topW) / 2, y - h);
    g.lineTo(x + (w + topW) / 2, y - h);
    g.lineTo(x + w, y);
    g.closePath();
    g.fill();
    // 지붕 능선의 밝은 테
    g.strokeStyle = "rgba(255,225,190,0.25)";
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(x + (w - topW) / 2, y - h);
    g.lineTo(x + (w + topW) / 2, y - h);
    g.stroke();
    for (let row = 0; row < rows; row++) {
      const k = (row + 1) / (rows + 1);
      const ry = y - h * k;
      const inset = ((w - topW) / 2) * k;
      for (let dx = x + inset + 4; dx < x + w - inset - 3; dx += 6) dormer(dx, ry - 1, 0.9);
    }
  }

  // 뾰족 망루: 둥근 벽 + 긴 원뿔 지붕 + 꼭대기 장식
  function spire(x, y, w, h, roofH, colors, light = 0) {
    if (h > 0) wall(x - w / 2, y - h, w, h, light);
    g.fillStyle = gradient(colors, x - w / 2, w);
    g.beginPath();
    g.moveTo(x - w / 2 - 1.2, y - h);
    g.quadraticCurveTo(x - w * 0.18, y - h - roofH * 0.55, x, y - h - roofH);
    g.quadraticCurveTo(x + w * 0.18, y - h - roofH * 0.55, x + w / 2 + 1.2, y - h);
    g.closePath();
    g.fill();
    g.strokeStyle = "#2c2a26";
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(x, y - h - roofH);
    g.lineTo(x, y - h - roofH - 5);
    g.stroke();
  }

  function chimney(x, y) {
    g.fillStyle = BRICK[1];
    g.fillRect(x, y - 9, 3.5, 9);
    g.fillStyle = "#d9c7ae";
    g.fillRect(x - 0.5, y - 10, 4.5, 1.4);
  }

  // 뒤쪽 왼편 높은 녹청 지붕 건물 (사진 왼쪽의 뾰족한 녹색 지붕)
  wall(cx - 92, ground - 58, 40, 58, 0.18);
  roof(cx - 95, ground - 58, 46, 6, 46, COPPER, 2);
  spire(cx - 95, ground - 58, 6, 0, 22, COPPER);
  spire(cx - 49, ground - 58, 6, 0, 20, COPPER);

  // 왼쪽 날개
  wall(cx - 54, ground - 46, 36, 46, 0.12);
  roof(cx - 56, ground - 46, 40, 26, 18, COPPER, 1);
  chimney(cx - 44, ground - 64);

  // 오른쪽 날개: 낮고 길게, 녹청 지붕 위로 뾰족탑이 줄지어 섬
  wall(cx + 18, ground - 40, 74, 40);
  roof(cx + 16, ground - 40, 78, 62, 17, COPPER, 1);
  chimney(cx + 60, ground - 57);
  spire(cx + 40, ground - 40, 8, 10, 22, COPPER);
  spire(cx + 92, ground, 12, 48, 26, COPPER);

  // 가운데 탑 앞을 받치는 둥근 망루 둘
  spire(cx - 27, ground, 11, 64, 20, COPPER, 0.1);
  spire(cx + 27, ground, 11, 60, 20, COPPER);

  // 가운데 높은 탑: 위쪽은 밝은 석재 띠를 두르고 짙은 슬레이트 지붕을 얹음
  const towerTop = ground - 124;
  wall(cx - 22, towerTop, 44, 124, 0.08);
  g.fillStyle = "#e3d2b6";
  g.fillRect(cx - 23, towerTop, 46, 2.2);
  g.fillRect(cx - 23, towerTop + 8, 46, 1.2);
  roof(cx - 25, towerTop, 50, 16, 54, SLATE, 3);
  // 지붕 꼭대기 두 장식 기둥
  g.strokeStyle = "#2c2a26";
  g.lineWidth = 0.9;
  for (const fx of [cx - 5, cx + 5]) {
    g.beginPath();
    g.moveTo(fx, towerTop - 54);
    g.lineTo(fx, towerTop - 62);
    g.stroke();
  }
  // 탑 지붕 네 귀퉁이의 작은 뾰족 망루
  spire(cx - 25, towerTop, 7, 8, 20, SLATE, 0.08);
  spire(cx + 25, towerTop, 7, 8, 20, SLATE);
  spire(cx - 11, towerTop - 2, 4.5, 0, 12, SLATE);
  spire(cx + 11, towerTop - 2, 4.5, 0, 12, SLATE);
}

// 단풍잎: 다섯 갈래로 갈라진 잎과 잎자루
const LEAF_SHAPE = [
  [0, -1], [0.12, -0.62], [0.38, -0.75], [0.3, -0.38], [0.8, -0.5], [0.62, -0.2],
  [0.92, 0.04], [0.46, 0.12], [0.52, 0.4], [0.12, 0.3], [0.03, 0.5],
];

function drawLeaf(ctx, p) {
  const s = p.size;
  ctx.globalAlpha = p.settled ? 0.95 : 0.9;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(Math.max(0.2, Math.abs(Math.cos(p.flip))), 1);
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(LEAF_SHAPE[0][0] * s, LEAF_SHAPE[0][1] * s);
  for (const [x, y] of LEAF_SHAPE) ctx.lineTo(x * s, y * s);
  for (let i = LEAF_SHAPE.length - 1; i >= 0; i--) ctx.lineTo(-LEAF_SHAPE[i][0] * s, LEAF_SHAPE[i][1] * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(70,25,10,0.7)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, 0.3 * s);
  ctx.lineTo(0, 0.95 * s);
  ctx.stroke();
  ctx.restore();
}

export const quebec = {
  id: "canada",
  label: "캐나다 · 퀘벡",
  title: "Château Frontenac",
  paint: paintQuebec,
  glare: 0.9,
  base: {
    trim: ["#6b3e1f", "#e8a86a", "#b8703a", "#5a3218"],
    plate: "Château Frontenac",
    plateFont: "italic 600 15px 'Baskerville', 'Times New Roman', serif",
    plateInk: "#2a160a",
  },
  // 단풍잎은 꽃잎보다 크고 조금 무거워서 더 크게 뒤집히며 떨어짐
  particles: {
    count: 150,
    blend: "source-over",
    make(rand) {
      const size = rand(3.5, 6);
      return {
        size,
        color: LEAF_COLORS[Math.floor(rand(0, LEAF_COLORS.length))],
        sink: 0.16 + size * 0.03 + rand(-0.03, 0.03),
        drag: rand(0.07, 0.11),
        inertia: rand(0.35, 0.65),
        grip: rand(0.5, 1.8),
        angle: rand(0, Math.PI * 2),
        spin: rand(-0.05, 0.05),
        flipSpeed: rand(0.03, 0.07),
        flutter: 0.035,
      };
    },
    draw: drawLeaf,
  },
};
