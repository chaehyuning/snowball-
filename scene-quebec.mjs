// 캐나다: 가을 노을 속 언덕 위 퀘벡 샤토 프롱트낙(드라마 「도깨비」 촬영지)과 흩날리는 단풍잎

import { seeded, fillSilhouette, paintTree } from "./util.mjs";

const LEAF_COLORS = ["#c8321e", "#e0531f", "#f08a24", "#f2b233", "#a8231a"];
const COPPER = ["#5fae94", "#3f8a74", "#2c6655"]; // 녹청이 슨 구리 지붕
const BRICK = ["#a4543c", "#8c4330", "#743524"];

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
  const sky = g.createLinearGradient(0, top, 0, 290);
  sky.addColorStop(0, "#5f7fb8");
  sky.addColorStop(0.45, "#c9a7b4");
  sky.addColorStop(0.75, "#f2bf8c");
  sky.addColorStop(1, "#f6a368");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 왼쪽 아래로 지는 해
  const sun = g.createRadialGradient(95, 245, 0, 95, 245, 120);
  sun.addColorStop(0, "rgba(255,236,190,0.95)");
  sun.addColorStop(0.1, "rgba(255,214,150,0.6)");
  sun.addColorStop(1, "rgba(255,200,140,0)");
  g.fillStyle = sun;
  g.fillRect(left, top, size, size);

  // 노을빛 구름
  g.filter = "blur(5px)";
  for (let i = 0; i < 9; i++) {
    g.fillStyle = `rgba(255,${Math.round(r(170, 215))},${Math.round(r(150, 190))},${r(0.3, 0.55)})`;
    g.beginPath();
    g.ellipse(r(50, 350), r(80, 190), r(30, 80), r(4, 10), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.filter = "none";

  // 멀리 보이는 언덕
  const farY = (x) => 258 + 6 * Math.sin(x * 0.025 + 2) + 3 * Math.sin(x * 0.09);
  g.fillStyle = "#9a8aa0";
  fillSilhouette(g, farY, left, right, 400);

  // 호텔이 올라앉은 잔디 언덕: 꼭대기는 평평하고 양옆으로 둥글게 내려감
  const hillY = (x) => {
    const dx = Math.abs(x - 205);
    const rough = 1.2 * Math.sin(x * 0.13) + 0.8 * Math.sin(x * 0.41);
    if (dx < 90) return 241 + rough * 0.3;
    return 241 + 0.008 * (dx - 90) ** 2 + 0.3 * (dx - 90) + rough;
  };
  const grass = g.createLinearGradient(0, 241, 0, 335);
  grass.addColorStop(0, "#a8a24c");
  grass.addColorStop(0.5, "#7f8a3c");
  grass.addColorStop(1, "#4f5a2a");
  g.fillStyle = grass;
  fillSilhouette(g, hillY, left, right, 400);

  // 노을이 왼쪽 비탈을 비춤
  const slopeLight = g.createLinearGradient(left, 0, right, 0);
  slopeLight.addColorStop(0, "rgba(255,190,110,0.3)");
  slopeLight.addColorStop(0.6, "rgba(255,190,110,0)");
  g.fillStyle = slopeLight;
  fillSilhouette(g, hillY, left, right, 400);

  // 잔디 결
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

  paintChateau(g, r, rnd, 205, 243);

  // 호텔로 올라가는 언덕길
  g.strokeStyle = "#d9c3a0";
  g.lineCap = "round";
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(110, 345);
  g.bezierCurveTo(165, 320, 125, 285, 182, 260);
  g.quadraticCurveTo(200, 252, 205, 244);
  g.stroke();
  g.strokeStyle = "rgba(120,90,60,0.35)";
  g.lineWidth = 1;
  g.stroke();

  // 비탈의 작은 단풍나무와 가로등
  const maple = { trunk: "#3a2418", shade: "#7e2414", colors: LEAF_COLORS.slice(0, 4) };
  for (const [tx, len] of [[112, 16], [138, 13], [268, 14], [296, 17], [322, 15]]) {
    paintTree(g, rnd, tx, hillY(tx) + 3, len, -Math.PI / 2 + r(-0.2, 0.2), 2.5, 3, maple);
  }
  for (const lx of [150, 176]) {
    const ly = lx === 150 ? 300 : 262;
    g.strokeStyle = "#2c2622";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(lx, ly);
    g.lineTo(lx, ly - 12);
    g.stroke();
    const lamp = g.createRadialGradient(lx, ly - 13, 0, lx, ly - 13, 5);
    lamp.addColorStop(0, "rgba(255,220,150,0.95)");
    lamp.addColorStop(1, "rgba(255,220,150,0)");
    g.fillStyle = lamp;
    g.fillRect(lx - 5, ly - 18, 10, 10);
  }

  // 앞쪽 단풍나무 두 그루
  paintTree(g, rnd, 26, 356, 36, -1.2, 6, 4, maple);
  paintTree(g, rnd, 376, 358, 36, -1.95, 6, 4, maple);

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

// 샤토 프롱트낙: 가운데 높은 탑, 양옆 날개 건물, 원뿔 지붕 망루, 모두 녹청 구리 지붕
function paintChateau(g, r, rnd, cx, ground) {
  // 벽돌 벽 + 창문
  function wall(x, y, w, h) {
    const brick = g.createLinearGradient(x, 0, x + w, 0);
    brick.addColorStop(0, BRICK[2]);
    brick.addColorStop(0.4, BRICK[0]);
    brick.addColorStop(1, BRICK[1]);
    g.fillStyle = brick;
    g.fillRect(x, y, w, h);
    // 왼쪽에서 지는 해의 빛: 왼쪽 건물일수록 밝음
    g.fillStyle = `rgba(255,190,120,${Math.max(0, (cx - x) / 400)})`;
    g.fillRect(x, y, w, h);
    // 석재 띠
    g.fillStyle = "rgba(230,210,180,0.35)";
    for (let by = y + 8; by < y + h; by += 11) g.fillRect(x, by, w, 0.8);
    // 창문: 노을 시간이라 일부만 불이 켜짐
    for (let wy = y + 3; wy < y + h - 3; wy += 5.5) {
      for (let wx = x + 2; wx < x + w - 2; wx += 3.6) {
        g.fillStyle = rnd() < 0.3 ? "#ffd38a" : "#3b2522";
        g.fillRect(wx, wy, 1.6, 2.6);
      }
    }
  }

  // 가파른 구리 지붕: 아래 폭 w, 위 폭 topW, 높이 h
  function roof(x, y, w, topW, h) {
    const copper = g.createLinearGradient(x, 0, x + w, 0);
    copper.addColorStop(0, COPPER[2]);
    copper.addColorStop(0.45, COPPER[0]);
    copper.addColorStop(1, COPPER[1]);
    g.fillStyle = copper;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (w - topW) / 2, y - h);
    g.lineTo(x + (w + topW) / 2, y - h);
    g.lineTo(x + w, y);
    g.closePath();
    g.fill();
    // 지붕창
    for (let dx = x + 5; dx < x + w - 5; dx += 7) {
      g.fillStyle = "#e9dcc6";
      g.fillRect(dx, y - h * 0.45, 3, 3.4);
      g.fillStyle = rnd() < 0.4 ? "#ffd38a" : "#2c3a36";
      g.fillRect(dx + 0.7, y - h * 0.45 + 0.8, 1.6, 2.2);
    }
  }

  // 원뿔 지붕 망루
  function turret(x, y, w, h, roofH) {
    wall(x - w / 2, y - h, w, h);
    const copper = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    copper.addColorStop(0, COPPER[2]);
    copper.addColorStop(0.5, COPPER[0]);
    copper.addColorStop(1, COPPER[1]);
    g.fillStyle = copper;
    g.beginPath();
    g.moveTo(x - w / 2 - 1.5, y - h);
    g.lineTo(x, y - h - roofH);
    g.lineTo(x + w / 2 + 1.5, y - h);
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

  // 왼쪽·오른쪽 날개 건물
  wall(cx - 82, ground - 46, 62, 46);
  roof(cx - 84, ground - 46, 66, 50, 20);
  chimney(cx - 70, ground - 64);
  chimney(cx - 40, ground - 64);
  wall(cx + 20, ground - 42, 58, 42);
  roof(cx + 18, ground - 42, 62, 46, 19);
  chimney(cx + 50, ground - 59);

  // 망루
  turret(cx - 84, ground, 13, 54, 22);
  turret(cx + 79, ground, 12, 48, 20);
  turret(cx - 22, ground, 10, 66, 18);
  turret(cx + 22, ground, 10, 62, 18);

  // 가운데 높은 탑
  wall(cx - 16, ground - 108, 32, 108);
  roof(cx - 19, ground - 108, 38, 10, 34);
  g.strokeStyle = "#2c2a26";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(cx, ground - 142);
  g.lineTo(cx, ground - 152);
  g.stroke();

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
    body: ["#140904", "#40241a", "#553222", "#2a170e", "#0e0603"],
    collar: "#1a0d07",
    trim: ["#6b3e1f", "#e8a86a", "#b8703a", "#5a3218"],
    plate: "CHÂTEAU FRONTENAC · QUÉBEC",
    plateFont: "600 11px 'Baskerville', 'Times New Roman', serif",
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
