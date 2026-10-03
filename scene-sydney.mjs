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
  for (let c = 0; c < 2; c++) {
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

  // 다리 너머 도심 빌딩과 시드니 타워 (멀어서 흐릿한 푸른빛)
  for (let x = left + 20; x < right - 20; x += r(12, 22)) {
    const h = r(5, 14) + (x < 200 ? r(0, 10) : 0);
    g.fillStyle = ["#9cbad0", "#a8c4d8", "#b3cce0"][Math.floor(rnd() * 3)];
    g.fillRect(x, 244 - h, r(5, 10), h + 4);
  }
  g.fillStyle = "#94b2c8";
  g.fillRect(105, 172, 2, 72);
  g.fillStyle = "#c9a85a";
  g.beginPath();
  g.ellipse(106, 175, 5, 4, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#94b2c8";
  g.fillRect(105.5, 162, 1, 9);

  paintBridge(g);

  // 바다
  const sea = g.createLinearGradient(0, 244, 0, 330);
  sea.addColorStop(0, "#3a93d0");
  sea.addColorStop(1, "#0b4f8c");
  g.fillStyle = sea;
  g.fillRect(left, 244, size, 100);

  // 물결: 멀리는 가늘고 촘촘하게, 가까이는 굵고 성기게
  for (let i = 0; i < 140; i++) {
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
  paintFerry(g, 262, 298, 1.1);

  // 바닥: 물가의 사암 테라스
  const floorTop = groundAt(globe.x);
  const stone = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  stone.addColorStop(0, "#e2c08e");
  stone.addColorStop(1, "#a97c4e");
  g.fillStyle = stone;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  g.strokeStyle = "rgba(120,80,40,0.3)";
  g.lineWidth = 0.7;
  for (let y = floorTop + 8; y < floorTop + 55; y += 7) {
    g.beginPath();
    for (let x = left; x <= right; x += 6) g.lineTo(x, Math.max(groundAt(x) + 3, y + Math.sin(x * 0.07 + y) * 1.5));
    g.stroke();
  }
  g.strokeStyle = "rgba(255,255,255,0.6)";
  g.lineWidth = 1.5;
  g.beginPath();
  for (let x = left; x <= right; x += 3) g.lineTo(x, groundAt(x) + 1 + Math.sin(x * 0.2) * 1);
  g.stroke();

  g.restore();
}

// 하버브리지: 강철 아치와 양끝 화강암 기둥, 꼭대기 국기
// 미세스 매쿼리스 체어에서 보면 다리가 오페라하우스 뒤를 크게 감쌈
function paintBridge(g) {
  const x0 = 58;
  const x1 = 318;
  const deck = 236;
  const arch = (x) => deck - 54 * (1 - ((2 * (x - x0)) / (x1 - x0) - 1) ** 2);

  g.strokeStyle = "rgba(70,90,110,0.85)";
  g.lineWidth = 0.6;
  for (let x = x0 + 6; x < x1 - 4; x += 5) {
    g.beginPath();
    g.moveTo(x, arch(x));
    g.lineTo(x, deck);
    g.stroke();
  }
  // 아치 위아래 두 줄 사이 트러스
  g.lineWidth = 0.5;
  for (let x = x0 + 4; x < x1 - 4; x += 6) {
    g.beginPath();
    g.moveTo(x, arch(x));
    g.lineTo(x + 6, arch(x + 6) + 5);
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

  // 화강암 기둥: 아치형 구멍이 뚫린 탑
  for (const px of [x0 - 5, x1 - 5]) {
    g.fillStyle = "#cdb995";
    g.fillRect(px, deck - 18, 11, 24);
    g.fillStyle = "#b39f7c";
    g.fillRect(px, deck - 18, 11, 2);
    g.fillStyle = "#7d8fa0";
    g.beginPath();
    g.moveTo(px + 3, deck + 2);
    g.lineTo(px + 3, deck - 6);
    g.quadraticCurveTo(px + 5.5, deck - 10, px + 8, deck - 6);
    g.lineTo(px + 8, deck + 2);
    g.closePath();
    g.fill();
  }

  // 아치 꼭대기의 호주 국기
  const fx = (x0 + x1) / 2;
  const fy = arch(fx);
  g.strokeStyle = "#3d4a57";
  g.lineWidth = 0.6;
  g.beginPath();
  g.moveTo(fx, fy);
  g.lineTo(fx, fy - 9);
  g.stroke();
  g.fillStyle = "#1f3a8a";
  g.fillRect(fx, fy - 9, 7, 4.5);
  g.fillStyle = "#ffffff";
  g.fillRect(fx + 1.5, fy - 7.4, 1.2, 1.2);
  g.fillRect(fx + 5, fy - 8.2, 0.8, 0.8);
  g.fillRect(fx + 4.4, fy - 6.2, 0.8, 0.8);
  g.fillStyle = "#c8102e";
  g.fillRect(fx, fy - 9, 3, 0.6);
}

// 오페라하우스: 분홍 화강암 기단과 대계단, 구릿빛 유리벽,
// 흰색·크림색 타일 껍데기 두 무리(콘서트홀·오페라 극장)와 작은 레스토랑 껍데기
function paintOperaHouse(g) {
  const rnd = seeded(1973);
  const r = (a, b) => a + rnd() * (b - a);
  // 기단: 분홍 화강암 블록. 줄을 긋지 않고 단마다 밝기를 조금씩 달리 칠하고,
  // 블록 이음매는 짧게 끊긴 그늘로만 보임. 물가로 내려갈수록 어두움
  function podiumShape() {
    g.beginPath();
    g.moveTo(160, 286);
    g.lineTo(170, 263);
    g.lineTo(352, 263);
    g.lineTo(358, 286);
    g.closePath();
  }
  const podium = g.createLinearGradient(0, 262, 0, 286);
  podium.addColorStop(0, "#e8cab4");
  podium.addColorStop(0.6, "#c9a38c");
  podium.addColorStop(1, "#9c7764");
  g.fillStyle = podium;
  podiumShape();
  g.fill();
  g.save();
  podiumShape();
  g.clip();
  for (let y = 265; y < 286; y += 3.2) {
    let x = 160;
    while (x < 358) {
      const w = r(8, 18);
      g.fillStyle = rnd() < 0.5 ? "rgba(255,236,220,0.12)" : "rgba(120,80,62,0.1)";
      g.fillRect(x, y, w, 3.2);
      if (rnd() < 0.6) {
        g.fillStyle = "rgba(100,66,52,0.12)";
        g.fillRect(x + w - 0.4, y + 0.4, 0.5, 2.6);
      }
      x += w;
    }
    g.fillStyle = `rgba(100,66,52,${r(0.1, 0.2)})`;
    g.fillRect(160, y + 3, 200, 0.5);
  }
  // 윗면 테두리에 받은 햇빛, 물에 닿는 아래쪽 젖은 그늘
  g.fillStyle = "rgba(255,244,230,0.6)";
  g.fillRect(160, 263, 200, 1);
  const wet = g.createLinearGradient(0, 281, 0, 286);
  wet.addColorStop(0, "rgba(60,50,60,0)");
  wet.addColorStop(1, "rgba(60,50,60,0.35)");
  g.fillStyle = wet;
  g.fillRect(160, 281, 200, 5);
  g.restore();

  // 대계단: 디딤판은 밝고 챌판은 그늘. 계단 폭이 아래로 갈수록 넓어짐
  const steps = 12;
  for (let k = 0; k < steps; k++) {
    const y0 = 263 + (k * 23) / steps;
    const y1 = 263 + ((k + 1) * 23) / steps;
    const l0 = 170 - (k * 10) / steps;
    const r0 = 206 - (k * 6) / steps;
    const l1 = 170 - ((k + 1) * 10) / steps;
    const r1 = 206 - ((k + 1) * 6) / steps;
    const mid = y0 + (y1 - y0) * 0.45;
    g.fillStyle = "#f1dccb";
    g.beginPath();
    g.moveTo(l0, y0);
    g.lineTo(r0, y0);
    g.lineTo(r0 - 0.3, mid);
    g.lineTo(l0 - 0.4, mid);
    g.closePath();
    g.fill();
    g.fillStyle = "#c9a690";
    g.beginPath();
    g.moveTo(l0 - 0.4, mid);
    g.lineTo(r0 - 0.3, mid);
    g.lineTo(r1, y1);
    g.lineTo(l1, y1);
    g.closePath();
    g.fill();
  }
  // 계단 오른쪽 옆면 그늘
  g.fillStyle = "rgba(90,60,50,0.25)";
  g.beginPath();
  g.moveTo(206, 263);
  g.lineTo(209, 263);
  g.lineTo(203, 286);
  g.lineTo(200, 286);
  g.closePath();
  g.fill();

  // 물에 비친 기단과 껍데기: 물결에 끊긴 흰 가로 획
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let y = 288; y < 306; y += 1.6) {
    const fade = 1 - (y - 288) / 18;
    let x = 176;
    while (x < 350) {
      const w = r(3, 12);
      if (rnd() < 0.55) {
        g.fillStyle = `rgba(230,230,220,${0.16 * fade})`;
        g.fillRect(x + r(-1.5, 1.5), y, w, 0.8);
      }
      x += w + r(1, 5);
    }
  }
  g.restore();

  // 껍데기 아래 구릿빛 유리 커튼월
  const glass = g.createLinearGradient(0, 250, 0, 264);
  glass.addColorStop(0, "#8a6a4e");
  glass.addColorStop(1, "#4e3a2c");
  g.fillStyle = glass;
  g.fillRect(214, 250, 114, 14);
  g.strokeStyle = "rgba(230,200,160,0.35)";
  g.lineWidth = 0.5;
  for (let x = 216; x < 328; x += 4) {
    g.beginPath();
    g.moveTo(x, 250);
    g.lineTo(x, 264);
    g.stroke();
  }
  g.fillStyle = "rgba(255,240,210,0.25)";
  g.fillRect(214, 255, 114, 1);

  // [밑변 왼쪽 x, 밑변 y, 폭, 높이]. 뒤(작은 것)부터 그림
  const concertHall = [
    [312, 262, 28, 30],
    [286, 262, 32, 48],
    [258, 262, 34, 66],
    [228, 262, 36, 78],
  ];
  const operaTheatre = [
    [318, 266, 22, 22],
    [296, 266, 26, 36],
    [272, 266, 28, 50],
    [246, 266, 30, 60],
  ];
  const restaurant = [
    [188, 262, 16, 18],
    [176, 263, 16, 24],
  ];
  for (const group of [concertHall, operaTheatre, restaurant]) {
    for (const [x, y, w, h] of group) shell(g, x, y, w, h);
  }
}

// 껍데기 하나: 흰색·크림색 타일 줄무늬와 꼭짓점에서 퍼지는 갈비뼈
function shell(g, x, y, w, h) {
  const ax = x + w * 0.18;
  const ay = y - h;
  g.save();
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x - w * 0.12, y - h * 0.55, ax, ay);
  g.quadraticCurveTo(x + w * 0.9, y - h * 0.72, x + w, y);
  g.closePath();
  const grad = g.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.55, "#f3f1ea");
  grad.addColorStop(1, "#c9c8c0");
  g.fillStyle = grad;
  // 앞 껍데기가 뒤 껍데기 위로 드리우는 부드러운 그림자
  g.shadowColor = "rgba(70,85,110,0.35)";
  g.shadowBlur = 6;
  g.shadowOffsetX = 3;
  g.fill();
  g.shadowColor = "transparent";
  g.shadowBlur = 0;
  g.shadowOffsetX = 0;
  g.clip();

  // 타일: 꼭짓점에서 부채꼴로 퍼지는 띠를 광택 흰색과 무광 크림색으로 번갈아 칠함
  const bands = 9;
  for (let i = 0; i < bands; i++) {
    if (i % 2) continue;
    g.fillStyle = "rgba(232,222,196,0.45)";
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(x - w * 0.2 + (w * 1.4 * i) / bands, y + 2);
    g.lineTo(x - w * 0.2 + (w * 1.4 * (i + 1)) / bands, y + 2);
    g.closePath();
    g.fill();
  }
  // 셰브론 결: 띠를 가로지르는 V자 줄. 아래로 갈수록 간격이 넓고 조금 진해짐 (가까울수록 또렷)
  for (let k = 1; k < 10; k++) {
    const t = Math.pow(k / 10, 1.3);
    const ty = ay + h * t;
    g.strokeStyle = `rgba(140,140,130,${0.08 + t * 0.16})`;
    g.lineWidth = 0.25 + t * 0.35;
    g.beginPath();
    g.moveTo(x - w * 0.2, ty + 2);
    g.lineTo(x + w * 0.35, ty - 1);
    g.lineTo(x + w * 1.1, ty + 2);
    g.stroke();
  }
  // 해를 받는 왼쪽 가장자리의 반짝임
  const sheen = g.createLinearGradient(x - w * 0.1, 0, x + w * 0.35, 0);
  sheen.addColorStop(0, "rgba(255,255,255,0.55)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sheen;
  g.fillRect(x - w * 0.15, ay, w * 0.5, h);
  // 그늘진 오른쪽 면
  const shade = g.createLinearGradient(x + w * 0.4, 0, x + w, 0);
  shade.addColorStop(0, "rgba(90,100,120,0)");
  shade.addColorStop(1, "rgba(90,100,120,0.28)");
  g.fillStyle = shade;
  g.fillRect(x - 5, ay - 2, w + 10, h + 4);
  g.restore();

  // 등뼈 모서리: 꼭짓점 쪽은 가늘고 밑동으로 갈수록 굵고 진해짐
  for (let k = 0; k < 6; k++) {
    const t0 = k / 6;
    const t1 = (k + 1) / 6;
    const pt = (t) => {
      const u = 1 - t;
      return [u * u * ax + 2 * u * t * (x + w * 0.9) + t * t * (x + w), u * u * ay + 2 * u * t * (y - h * 0.72) + t * t * y];
    };
    const [x0, y0] = pt(t0);
    const [x1, y1] = pt(t1);
    g.strokeStyle = `rgba(80,95,115,${0.25 + t1 * 0.3})`;
    g.lineWidth = 0.4 + t1 * 0.8;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  }
}

// 시드니 페리: 초록 선체에 크림색 선실, 노란 굴뚝
function paintFerry(g, x, y, s) {
  g.fillStyle = "#1f6b3a";
  g.beginPath();
  g.moveTo(x - 16 * s, y);
  g.lineTo(x + 18 * s, y);
  g.lineTo(x + 14 * s, y + 4 * s);
  g.lineTo(x - 13 * s, y + 4 * s);
  g.closePath();
  g.fill();
  g.fillStyle = "#f3ead2";
  g.fillRect(x - 11 * s, y - 6 * s, 24 * s, 6 * s);
  g.fillStyle = "#3b4b5a";
  for (let i = 0; i < 6; i++) g.fillRect(x - 9 * s + i * 3.8 * s, y - 4.5 * s, 2.2 * s, 2 * s);
  g.fillStyle = "#e9c23a";
  g.fillRect(x - 1 * s, y - 10 * s, 3 * s, 4 * s);
  g.strokeStyle = "rgba(255,255,255,0.7)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(x - 22 * s, y + 4 * s);
  g.quadraticCurveTo(x - 30 * s, y + 3 * s, x - 38 * s, y + 5 * s);
  g.stroke();
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
      x: 210 + rnd() * 150,
      y: 289 + rnd() * 12,
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
    trim: ["#8a9aa8", "#ffffff", "#c9d4dd", "#7d8c99"],
    plate: "Sydney Opera House",
    plateFont: "600 14px 'Helvetica Neue', Arial, sans-serif",
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
