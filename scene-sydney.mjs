// 호주: 한낮의 시드니 항구, 오페라하우스와 하버브리지, 흩날리는 물방울

import { seeded, fillSilhouette } from "./util.mjs";

const DROP_COLORS = ["#ffffff", "#c8ecff", "#8fd3f7", "#4fb0e8", "#2b8fd6"];

function paintSydney(g, globe, groundAt) {
  const rnd = seeded(1973);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 쨍한 한낮 하늘
  const sky = g.createLinearGradient(0, top, 0, 250);
  sky.addColorStop(0, "#2f86d6");
  sky.addColorStop(0.6, "#7cc3ef");
  sky.addColorStop(1, "#d3eefa");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  const sun = g.createRadialGradient(300, 85, 0, 300, 85, 110);
  sun.addColorStop(0, "rgba(255,255,245,0.9)");
  sun.addColorStop(0.15, "rgba(255,255,240,0.45)");
  sun.addColorStop(1, "rgba(255,255,240,0)");
  g.fillStyle = sun;
  g.fillRect(left, top, size, size);

  // 뭉게구름
  g.filter = "blur(3px)";
  for (let c = 0; c < 4; c++) {
    const cx = r(60, 340);
    const cy = r(90, 170);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = `rgba(255,255,255,${r(0.55, 0.85)})`;
      g.beginPath();
      g.ellipse(cx + r(-22, 22), cy + r(-5, 4), r(10, 20), r(6, 11), 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.filter = "none";

  // 건너편 도심 빌딩
  for (let x = left; x < 170; x += r(6, 12)) {
    const h = r(6, 26);
    g.fillStyle = ["#8fb0c9", "#9dbbd2", "#a9c4d8"][Math.floor(rnd() * 3)];
    g.fillRect(x, 244 - h, r(5, 10), h + 4);
  }

  paintBridge(g);

  // 바다
  const sea = g.createLinearGradient(0, 244, 0, 330);
  sea.addColorStop(0, "#3a93d0");
  sea.addColorStop(1, "#0b4f8c");
  g.fillStyle = sea;
  g.fillRect(left, 244, size, 100);

  // 물결: 멀리는 가늘고 촘촘하게, 가까이는 굵고 성기게
  for (let i = 0; i < 260; i++) {
    const y = r(246, 330);
    const near = (y - 246) / 84;
    const x = r(left, right);
    const w = 3 + near * r(6, 16);
    g.strokeStyle = rnd() < 0.6 ? `rgba(190,232,255,${0.25 + near * 0.3})` : `rgba(8,52,100,${0.25 + near * 0.2})`;
    g.lineWidth = 0.5 + near;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + w / 2, y - 1 - near * 2, x + w, y);
    g.stroke();
  }

  // 햇빛 반사
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 60; i++) {
    const y = r(246, 300);
    g.fillStyle = `rgba(255,255,230,${r(0.15, 0.45)})`;
    g.fillRect(300 + r(-25, 25) * (1 + (y - 246) / 40), y, r(2, 7), 0.8);
  }
  g.globalCompositeOperation = "source-over";

  paintOperaHouse(g);

  // 돛단배 두 척
  for (const [bx, by, s] of [[110, 262, 1], [150, 252, 0.7]]) {
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(bx, by - 2);
    g.lineTo(bx, by - 18 * s);
    g.lineTo(bx + 9 * s, by - 2);
    g.closePath();
    g.fill();
    g.fillStyle = "#1d3550";
    g.beginPath();
    g.moveTo(bx - 7 * s, by - 1);
    g.lineTo(bx + 10 * s, by - 1);
    g.lineTo(bx + 7 * s, by + 2 * s);
    g.lineTo(bx - 5 * s, by + 2 * s);
    g.closePath();
    g.fill();
  }

  paintPalm(g, r, 30, 356, 1);

  // 모래사장과 파도 거품
  const floorTop = groundAt(globe.x);
  const sand = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  sand.addColorStop(0, "#f1dfb4");
  sand.addColorStop(1, "#c9a774");
  g.fillStyle = sand;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  g.strokeStyle = "rgba(255,255,255,0.85)";
  g.lineWidth = 2.5;
  g.beginPath();
  for (let x = left; x <= right; x += 3) g.lineTo(x, groundAt(x) + 2 + Math.sin(x * 0.2) * 1.2);
  g.stroke();
  for (let i = 0; i < 300; i++) {
    const x = r(left, right);
    const y = groundAt(x) + r(5, 45);
    g.globalAlpha = r(0.3, 0.7);
    g.fillStyle = ["#fff6e0", "#b89462", "#e9cfa0"][Math.floor(rnd() * 3)];
    g.beginPath();
    g.arc(x, y, r(0.4, 1.3), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  g.restore();
}

// 하버브리지: 강철 아치와 양끝 돌 기둥
function paintBridge(g) {
  const x0 = 38;
  const x1 = 178;
  const deck = 234;
  const arch = (x) => deck - 34 * (1 - ((2 * (x - x0)) / (x1 - x0) - 1) ** 2);

  g.strokeStyle = "rgba(70,90,110,0.85)";
  g.lineWidth = 0.6;
  for (let x = x0 + 6; x < x1 - 4; x += 5) {
    g.beginPath();
    g.moveTo(x, arch(x));
    g.lineTo(x, deck);
    g.stroke();
  }
  for (const [off, w] of [[0, 2.6], [5, 1.4]]) {
    g.lineWidth = w;
    g.beginPath();
    for (let x = x0; x <= x1; x += 2) g.lineTo(x, arch(x) + off);
    g.stroke();
  }
  g.fillStyle = "#56697c";
  g.fillRect(x0 - 20, deck - 1, x1 - x0 + 40, 2.4);
  g.fillStyle = "#c9b79a";
  for (const px of [x0 - 4, x1 - 6]) g.fillRect(px, deck - 16, 10, 22);
}

// 오페라하우스: 기단 위에 겹겹이 선 흰 조개껍데기 지붕
function paintOperaHouse(g) {
  // 베넬롱 곶 기단
  const podium = g.createLinearGradient(0, 262, 0, 284);
  podium.addColorStop(0, "#e6c99c");
  podium.addColorStop(1, "#b8946a");
  g.fillStyle = podium;
  g.beginPath();
  g.moveTo(168, 284);
  g.lineTo(176, 264);
  g.lineTo(350, 264);
  g.lineTo(356, 284);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(120,90,60,0.35)";
  g.lineWidth = 0.6;
  for (let y = 268; y < 284; y += 3) {
    g.beginPath();
    g.moveTo(172, y);
    g.lineTo(353, y);
    g.stroke();
  }

  // 지붕 아래 유리벽
  g.fillStyle = "#5b5a63";
  g.fillRect(188, 252, 150, 12);

  // [밑변 왼쪽 x, 밑변 y, 폭, 높이]. 뒤(작은 것)부터 그림
  const shells = [
    [300, 264, 30, 30],
    [272, 264, 34, 48],
    [246, 264, 36, 64],
    [218, 264, 38, 74],
    [262, 266, 24, 26],
    [196, 266, 30, 44],
    [180, 268, 24, 30],
  ];
  for (const [x, y, w, h] of shells) shell(g, x, y, w, h);
}

function shell(g, x, y, w, h) {
  const ax = x + w * 0.18;
  const ay = y - h;
  const grad = g.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.55, "#f1f4f6");
  grad.addColorStop(1, "#c3ccd5");
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x - w * 0.12, y - h * 0.55, ax, ay);
  g.quadraticCurveTo(x + w * 0.9, y - h * 0.72, x + w, y);
  g.closePath();
  g.fill();

  // 타일 결: 꼭짓점에서 부채꼴로 퍼짐
  g.strokeStyle = "rgba(120,135,150,0.18)";
  g.lineWidth = 0.5;
  for (let i = 1; i < 6; i++) {
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(x + (w * i) / 6, y);
    g.stroke();
  }
  g.strokeStyle = "rgba(90,105,120,0.35)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(ax, ay);
  g.quadraticCurveTo(x + w * 0.9, y - h * 0.72, x + w, y);
  g.stroke();
}

// dir: 1이면 오른쪽으로, -1이면 왼쪽으로 기울어짐
function paintPalm(g, r, x, y, dir) {
  const topX = x + dir * 30;
  const topY = y - 95;
  g.strokeStyle = "#6b5236";
  g.lineWidth = 5;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + dir * 4, y - 50, topX, topY);
  g.stroke();
  g.strokeStyle = "rgba(60,40,25,0.5)";
  g.lineWidth = 0.8;
  for (let t = 0.1; t < 1; t += 0.08) {
    const px = (1 - t) ** 2 * x + 2 * (1 - t) * t * (x + dir * 4) + t * t * topX;
    const py = (1 - t) ** 2 * y + 2 * (1 - t) * t * (y - 50) + t * t * topY;
    g.beginPath();
    g.moveTo(px - 2.5, py);
    g.lineTo(px + 2.5, py - 1);
    g.stroke();
  }
  // 잎: 휘어진 줄기에 작은 잎을 빗살처럼 붙임
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI + (i / 8) * Math.PI + r(-0.1, 0.1);
    const len = r(32, 44);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.6 + len * 0.35;
    const cx = topX + Math.cos(a) * len * 0.5;
    const cy = topY + Math.sin(a) * len * 0.5 - 6;
    g.strokeStyle = "#2f6b3a";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(topX, topY);
    g.quadraticCurveTo(cx, cy, ex, ey);
    g.stroke();
    for (let t = 0.15; t < 1; t += 0.09) {
      const px = (1 - t) ** 2 * topX + 2 * (1 - t) * t * cx + t * t * ex;
      const py = (1 - t) ** 2 * topY + 2 * (1 - t) * t * cy + t * t * ey;
      g.strokeStyle = t < 0.5 ? "#3f8a48" : "#5aa55a";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + 4, py + 6);
      g.moveTo(px, py);
      g.lineTo(px - 4, py + 6);
      g.stroke();
    }
  }
}

// 물방울: 가장자리가 밝고 속이 비치는 방울. 색마다 한 번만 그려 둠
const sprites = new Map();
function dropSprite(color) {
  if (!sprites.has(color)) {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d");
    const body = g.createRadialGradient(16, 16, 4, 16, 16, 15);
    body.addColorStop(0, "rgba(255,255,255,0.15)");
    body.addColorStop(0.75, color);
    body.addColorStop(1, "rgba(255,255,255,0.9)");
    g.fillStyle = body;
    g.beginPath();
    g.arc(16, 16, 15, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.95)";
    g.beginPath();
    g.ellipse(11, 10, 4, 2.5, -0.6, 0, Math.PI * 2);
    g.fill();
    sprites.set(color, c);
  }
  return sprites.get(color);
}

function drawDrop(ctx, p) {
  ctx.globalAlpha = p.settled ? 0.55 : 0.9;
  const r = p.size;
  ctx.drawImage(dropSprite(p.color), p.x - r, p.y - r, r * 2, r * 2);
}

// 바다 위 반짝임: 물결 위 몇 곳이 번갈아 빛남
let glints = [];
function animateSydney(ctx, t) {
  if (!glints.length) {
    const rnd = seeded(7);
    glints = Array.from({ length: 24 }, () => ({
      x: 240 + rnd() * 120,
      y: 248 + rnd() * 50,
      phase: rnd() * Math.PI * 2,
      speed: 0.002 + rnd() * 0.004,
    }));
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "#fffbe8";
  for (const s of glints) {
    ctx.globalAlpha = Math.max(0, Math.sin(t * s.speed + s.phase)) * 0.8;
    ctx.fillRect(s.x - 2, s.y, 4, 0.9);
  }
  ctx.restore();
}

export const sydney = {
  id: "australia",
  label: "호주 · 오페라하우스",
  title: "Sydney Opera House",
  paint: paintSydney,
  animate: animateSydney,
  glare: 0.8,
  base: {
    body: ["#06213a", "#0f4c78", "#1a6aa0", "#0b3a5e", "#041a2e"],
    collar: "#062038",
    trim: ["#8a9aa8", "#ffffff", "#c9d4dd", "#7d8c99"],
    plate: "SYDNEY OPERA HOUSE",
    plateFont: "600 12px 'Helvetica Neue', Arial, sans-serif",
    plateInk: "#0b2a44",
  },
  // 물방울은 작고 가벼워서 오래 떠다님
  particles: {
    count: 170,
    blend: "source-over",
    make(rand) {
      const size = rand(1.5, 4);
      return {
        size,
        color: DROP_COLORS[Math.floor(rand(0, DROP_COLORS.length))],
        sink: 0.08 + size * 0.03 + rand(-0.02, 0.02),
        drag: rand(0.09, 0.14),
        inertia: rand(0.35, 0.65),
        grip: rand(0.4, 1.6),
        flutter: 0,
      };
    },
    draw: drawDrop,
  },
};
