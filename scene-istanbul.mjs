// 터키: 해 질 녘 이스탄불 블루 모스크(술탄 아흐메트 모스크), 초승달, 튤립, 날아다니는 나비

import { seeded, fillSilhouette, paintTree } from "./util.mjs";

const WING = ["#2ec4c9", "#1f8fd6", "#7fe3d6", "#0fa3a3", "#bff3ff"];
const STONE = "#e8dcc4";
const LEAD = ["#9fb4c8", "#6f87a0", "#4d6680"]; // 납판 돔: 밝은 쪽 → 그늘

let mahya = []; // 첨탑 사이에 건 등불 줄 (animate에서 깜빡임)

function paintIstanbul(g, globe, groundAt) {
  const rnd = seeded(1616);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 해 질 녘: 위는 짙은 남청, 가운데는 청록, 지평선은 모래빛
  const sky = g.createLinearGradient(0, top, 0, 275);
  sky.addColorStop(0, "#0f2a4a");
  sky.addColorStop(0.45, "#1d6a7a");
  sky.addColorStop(0.8, "#86cdbf");
  sky.addColorStop(1, "#f1e0bc");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(255,255,255,${r(0.3, 0.8)})`;
    g.beginPath();
    g.arc(r(left, right), r(top, 140), r(0.3, 0.9), 0, Math.PI * 2);
    g.fill();
  }

  // 초승달과 별
  g.fillStyle = "#fff6d8";
  g.beginPath();
  g.arc(300, 92, 13, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  g.arc(305, 89, 11, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = "source-over";
  star(g, 318, 92, 4, "#fff6d8");

  // 멀리 아시아 쪽 기슭과 보스포루스 해협 (멀어서 흐릿함)
  g.fillStyle = "rgba(70,120,130,0.7)";
  fillSilhouette(g, (x) => 236 + 4 * Math.sin(x * 0.04), left, right, 400);
  const sea = g.createLinearGradient(0, 240, 0, 258);
  sea.addColorStop(0, "#7cc4bc");
  sea.addColorStop(1, "#3f8f94");
  g.fillStyle = sea;
  g.fillRect(left, 240, size, 18);

  // 갈매기
  g.strokeStyle = "rgba(255,255,255,0.8)";
  g.lineWidth = 1;
  for (const [bx, by, s] of [[110, 150, 1], [128, 162, 0.8], [262, 132, 0.7], [90, 172, 0.6]]) {
    g.beginPath();
    g.moveTo(bx - 5 * s, by);
    g.quadraticCurveTo(bx - 2 * s, by - 3 * s, bx, by);
    g.quadraticCurveTo(bx + 2 * s, by - 3 * s, bx + 5 * s, by);
    g.stroke();
  }

  // 언덕 위 모스크: 공원 너머에 있어서 작게 그림
  const MOSQUE = { x: 200, y: 262, s: 0.78 };
  g.save();
  g.translate(MOSQUE.x, MOSQUE.y);
  g.scale(MOSQUE.s, MOSQUE.s);
  paintMosque(g, 0, 0);
  g.restore();
  mahya = mahya.map((l) => ({ ...l, x: MOSQUE.x + l.x * MOSQUE.s, y: MOSQUE.y + l.y * MOSQUE.s }));

  // 모스크와 공원 사이 옅은 저녁 안개
  const mist = g.createLinearGradient(0, 248, 0, 272);
  mist.addColorStop(0, "rgba(200,235,225,0)");
  mist.addColorStop(1, "rgba(200,235,225,0.35)");
  g.fillStyle = mist;
  g.fillRect(left, 248, size, 24);

  // 술탄아흐메트 공원: 잔디와 돌길
  const lawn = g.createLinearGradient(0, 262, 0, 335);
  lawn.addColorStop(0, "#5f9a74");
  lawn.addColorStop(1, "#2f5e46");
  g.fillStyle = lawn;
  g.fillRect(left, 262, size, 80);
  g.fillStyle = "#d9cdb4";
  g.beginPath();
  g.moveTo(186, 262);
  g.lineTo(214, 262);
  g.lineTo(250, 335);
  g.lineTo(150, 335);
  g.closePath();
  g.fill();

  // 공원 분수: 원근이 잡힌 둥근 연못, 가운데 물기둥과 둘레 물줄기
  g.fillStyle = "#cfc3aa";
  g.beginPath();
  g.ellipse(200, 292, 66, 12, 0, 0, Math.PI * 2);
  g.fill();
  const water = g.createLinearGradient(0, 282, 0, 302);
  water.addColorStop(0, "#7fd6cf");
  water.addColorStop(1, "#2e9aa0");
  g.fillStyle = water;
  g.beginPath();
  g.ellipse(200, 292, 60, 9.5, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(240,255,255,0.75)";
  g.lineCap = "round";
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const bx = 200 + Math.cos(a) * 46;
    const by = 292 + Math.sin(a) * 7;
    g.lineWidth = Math.sin(a) > 0 ? 1.4 : 0.9;
    g.beginPath();
    g.moveTo(bx, by);
    g.quadraticCurveTo(200 + Math.cos(a) * 30, by - 14, 200 + Math.cos(a) * 16, 292 + Math.sin(a) * 2.5);
    g.stroke();
  }
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(200, 292);
  g.lineTo(200, 266);
  g.stroke();

  // 튤립 화단 (원근이 잡힌 타원 꽃밭)
  tulips(g, rnd, 112, 314, 30);
  tulips(g, rnd, 288, 314, 30);

  // 앞쪽 큰 플라타너스와 오스만식 가로등 (가까워서 크고 진하게)
  const plane = { trunk: "#4a3a2a", shade: "#2a5236", colors: ["#3f7a4a", "#4f8f56", "#5fa060", "#356a40"] };
  paintTree(g, rnd, 22, 352, 50, -1.3, 8, 5, plane);
  paintTree(g, rnd, 378, 354, 50, -1.85, 8, 5, plane);
  lamp(g, 86, 330, 78);
  lamp(g, 314, 330, 78);

  // 바닥: 터키 블루 타일 무늬가 있는 마당
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#e6dccb");
  floor.addColorStop(1, "#a99b84");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  g.strokeStyle = "rgba(31,143,170,0.35)";
  g.lineWidth = 0.8;
  for (let x = left; x < right; x += 14) {
    for (let y = floorTop + 6; y < floorTop + 60; y += 10) {
      if (y < groundAt(x) + 3) continue;
      g.beginPath();
      g.moveTo(x, y - 3);
      g.lineTo(x + 3, y);
      g.lineTo(x, y + 3);
      g.lineTo(x - 3, y);
      g.closePath();
      g.stroke();
    }
  }

  g.restore();
}

// 오스만식 가로등: 검은 기둥 위 초롱
function lamp(g, x, baseY, h) {
  const topY = baseY - h;
  g.fillStyle = "#1f2a2c";
  g.fillRect(x - 2.5, baseY - 8, 5, 8);
  g.fillRect(x - 1.2, topY + 12, 2.4, h - 20);
  const glow = g.createRadialGradient(x, topY + 6, 0, x, topY + 6, 22);
  glow.addColorStop(0, "rgba(255,220,150,0.7)");
  glow.addColorStop(1, "rgba(255,220,150,0)");
  g.fillStyle = glow;
  g.fillRect(x - 22, topY - 16, 44, 44);
  g.fillStyle = "#ffe0a0";
  g.beginPath();
  g.ellipse(x, topY + 6, 4, 6, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#1f2a2c";
  g.beginPath();
  g.moveTo(x - 5, topY);
  g.quadraticCurveTo(x, topY - 8, x + 5, topY);
  g.closePath();
  g.fill();
  g.fillRect(x - 0.5, topY - 11, 1, 4);
}

function star(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

// 반구형 돔: 납판 결과 꼭대기 초승달 장식
function dome(g, x, baseY, rx, ry, finial) {
  const grad = g.createRadialGradient(x - rx * 0.4, baseY - ry * 0.8, 1, x, baseY, rx * 1.2);
  grad.addColorStop(0, LEAD[0]);
  grad.addColorStop(0.6, LEAD[1]);
  grad.addColorStop(1, LEAD[2]);
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(x, baseY, rx, ry, 0, Math.PI, 0);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(40,60,80,0.3)";
  g.lineWidth = 0.5;
  for (let k = -3; k <= 3; k++) {
    g.beginPath();
    g.moveTo(x, baseY - ry);
    g.quadraticCurveTo(x + (k * rx) / 3.2, baseY - ry * 0.6, x + (k * rx) / 3.5, baseY);
    g.stroke();
  }
  if (finial) {
    g.fillStyle = "#e0b040";
    g.fillRect(x - 0.6, baseY - ry - 7, 1.2, 7);
    g.beginPath();
    g.arc(x, baseY - ry - 9, 2.2, 0.3, Math.PI * 2 - 0.3);
    g.lineWidth = 1;
    g.strokeStyle = "#e0b040";
    g.stroke();
  }
}

// 첨탑: 가는 원기둥, 발코니 고리, 뾰족한 납 지붕
// far: 뒤쪽 첨탑일수록 1에 가까움. 저녁 공기에 묻혀 흐리게 그림
function minaret(g, x, baseY, h, balconies, far = 0) {
  g.save();
  g.globalAlpha = 1 - far * 0.45;
  const w = 5 - far * 1.5;
  const grad = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  grad.addColorStop(0, "#c9bba2");
  grad.addColorStop(0.5, "#f4ead8");
  grad.addColorStop(1, "#bfae94");
  g.fillStyle = grad;
  g.fillRect(x - w / 2, baseY - h, w, h);
  for (let i = 0; i < balconies; i++) {
    const y = baseY - h * (0.45 + i * 0.18);
    g.fillStyle = "#d8ccb4";
    g.fillRect(x - w / 2 - 1.8, y, w + 3.6, 2);
    g.fillStyle = "rgba(60,50,40,0.4)";
    g.fillRect(x - w / 2 - 1.8, y + 2, w + 3.6, 0.6);
  }
  g.fillStyle = LEAD[1];
  g.beginPath();
  g.moveTo(x - w / 2 - 0.5, baseY - h);
  g.lineTo(x, baseY - h - 22);
  g.lineTo(x + w / 2 + 0.5, baseY - h);
  g.closePath();
  g.fill();
  g.fillStyle = "#e0b040";
  g.fillRect(x - 0.4, baseY - h - 27, 0.8, 5);
  g.restore();
}

// 블루 모스크: 작은 돔 → 반돔 → 큰 돔이 층층이 쌓이고, 첨탑 여섯 개가 둘러섬
function paintMosque(g, cx, baseY) {
  // 바깥 첨탑 두 개(뒤쪽, 조금 낮게)
  // 마당 바깥쪽 첨탑 두 개 (가장 멀어서 흐리게)
  minaret(g, cx - 128, baseY, 118, 2, 0.8);
  minaret(g, cx + 128, baseY, 118, 2, 0.8);

  // 아래 벽과 아치 창
  g.fillStyle = STONE;
  g.fillRect(cx - 84, baseY - 34, 168, 34);
  g.fillStyle = "rgba(120,100,80,0.25)";
  g.fillRect(cx - 84, baseY - 34, 168, 2);
  for (const [row, n, wy] of [[0, 14, baseY - 26], [1, 12, baseY - 14]]) {
    for (let i = 0; i < n; i++) {
      const wx = cx - 78 + (i * 156) / (n - 1);
      g.fillStyle = "#3b5870";
      g.beginPath();
      g.moveTo(wx - 2, wy + 6);
      g.lineTo(wx - 2, wy + 1);
      g.quadraticCurveTo(wx, wy - 2, wx + 2, wy + 1);
      g.lineTo(wx + 2, wy + 6);
      g.closePath();
      g.fill();
    }
  }

  // 모서리 작은 돔들
  for (const dx of [-70, -46, 46, 70]) dome(g, cx + dx, baseY - 34, 11, 10, true);
  // 반돔 두 개와 그 아래 벽
  g.fillStyle = STONE;
  g.fillRect(cx - 58, baseY - 46, 116, 12);
  dome(g, cx - 34, baseY - 46, 24, 20, false);
  dome(g, cx + 34, baseY - 46, 24, 20, false);
  // 큰 돔의 드럼(창이 둘린 원통)
  g.fillStyle = STONE;
  g.fillRect(cx - 34, baseY - 64, 68, 16);
  g.fillStyle = "#3b5870";
  for (let i = 0; i < 11; i++) {
    const wx = cx - 30 + i * 6;
    g.fillRect(wx, baseY - 60, 2.4, 6);
  }
  // 가운데 큰 돔
  dome(g, cx, baseY - 64, 38, 32, true);

  // 안쪽 첨탑 네 개
  // 안쪽 첨탑 네 개: 뒤쪽 두 개는 조금 작고 흐리게, 앞쪽 두 개는 크고 진하게
  minaret(g, cx - 82, baseY, 126, 3, 0.5);
  minaret(g, cx + 82, baseY, 126, 3, 0.5);
  minaret(g, cx - 98, baseY, 142, 3, 0);
  minaret(g, cx + 98, baseY, 142, 3, 0);

  // 첨탑 사이 등불 줄(마흐야)
  mahya = [];
  for (const [x0, x1] of [[cx - 96, cx - 128], [cx + 96, cx + 128]]) {
    for (let i = 1; i < 8; i++) {
      const k = i / 8;
      mahya.push({ x: x0 + (x1 - x0) * k, y: baseY - 104 + 10 * 4 * k * (1 - k), phase: i * 0.9 });
    }
  }
  g.strokeStyle = "rgba(60,50,40,0.6)";
  g.lineWidth = 0.4;
  for (const [x0, x1] of [[cx - 96, cx - 128], [cx + 96, cx + 128]]) {
    g.beginPath();
    g.moveTo(x0, baseY - 104);
    g.quadraticCurveTo((x0 + x1) / 2, baseY - 84, x1, baseY - 104);
    g.stroke();
  }
}

// 튤립 화단: 빨강·노랑·보라 튤립
function tulips(g, rnd, x, baseY, w) {
  const r = (a, b) => a + rnd() * (b - a);
  for (let i = 0; i < 22; i++) {
    const tx = x + r(-w, w);
    const h = r(10, 18);
    const ty = baseY - h + r(-2, 4);
    g.strokeStyle = "#2f6b3a";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(tx, ty + h);
    g.lineTo(tx, ty);
    g.stroke();
    g.fillStyle = "#3f8a48";
    g.beginPath();
    g.ellipse(tx + 2, ty + h * 0.6, 1.4, 4, 0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = ["#d8263a", "#f2b632", "#9b4dca", "#ff6a8a"][Math.floor(rnd() * 4)];
    g.beginPath();
    g.moveTo(tx - 3, ty);
    g.lineTo(tx - 3, ty - 4);
    g.lineTo(tx - 1.5, ty - 2.5);
    g.lineTo(tx, ty - 5);
    g.lineTo(tx + 1.5, ty - 2.5);
    g.lineTo(tx + 3, ty - 4);
    g.lineTo(tx + 3, ty);
    g.quadraticCurveTo(tx, ty + 3, tx - 3, ty);
    g.fill();
  }
}

function animateIstanbul(ctx, t) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const l of mahya) {
    const on = 0.5 + 0.5 * Math.sin(t * 0.003 + l.phase);
    ctx.globalAlpha = 0.4 + 0.6 * on;
    ctx.fillStyle = "#ffd98a";
    ctx.beginPath();
    ctx.arc(l.x, l.y, 1.2 + on * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 나비: 몸통과 두 쌍의 날개. 날 때는 날개를 접었다 폈다 하고, 앉으면 반쯤 편 채로 쉼
function drawButterfly(ctx, p, t) {
  const s = p.size;
  const open = p.settled ? 0.55 : 0.2 + 0.8 * Math.abs(Math.sin(t * p.flap + p.phase));
  ctx.globalAlpha = 0.95;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.settled ? p.angle * 0.2 : Math.sin(t * 0.002 + p.phase) * 0.4);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side * open, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(s * 0.55, -s * 0.35, s * 0.6, s * 0.48, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(s * 0.45, s * 0.35, s * 0.42, s * 0.34, 0.5, 0, Math.PI * 2);
    ctx.fill();
    // 날개 끝 무늬
    ctx.fillStyle = "rgba(10,40,60,0.55)";
    ctx.beginPath();
    ctx.ellipse(s * 0.85, -s * 0.5, s * 0.18, s * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#1a2a33";
  ctx.fillRect(-s * 0.08, -s * 0.55, s * 0.16, s * 1.1);
  ctx.restore();
}

export const istanbul = {
  id: "turkey",
  label: "터키 · 블루 모스크",
  title: "Blue Mosque",
  paint: paintIstanbul,
  animate: animateIstanbul,
  glare: 0.6,
  base: {
    trim: ["#1b6f73", "#9ff0ea", "#2ec4c9", "#145a5e"],
    plate: "Sultanahmet Camii",
    plateFont: "600 14px 'Gill Sans', 'Trebuchet MS', sans-serif",
    plateInk: "#04282c",
  },
  // 나비는 가볍게 떠다니며 천천히 내려앉음
  particles: {
    count: 60,
    blend: "source-over",
    make(rand) {
      const size = rand(3.5, 5.5);
      return {
        size,
        color: WING[Math.floor(rand(0, WING.length))],
        sink: 0.05 + size * 0.015,
        drag: rand(0.06, 0.1),
        inertia: rand(0.2, 0.4),
        grip: rand(0.4, 1.6),
        angle: rand(-1, 1),
        spin: 0,
        flipSpeed: 0,
        flutter: 0.05,
        flap: rand(0.012, 0.02),
        phase: rand(0, Math.PI * 2),
      };
    },
    draw: drawButterfly,
  },
};
