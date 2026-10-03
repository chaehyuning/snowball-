// 홍콩: 비 갠 밤 몽콕 거리. 양옆으로 빽빽한 고층 건물이 소실점으로 모이고,
// 길 위로 겹겹이 튀어나온 네온 간판, 젖은 길에 번지는 간판 빛, 빨간 택시, 네온빛 빗방울

import { seeded, fillSilhouette } from "./util.mjs";

const NEON = ["#ff3fa4", "#3ff0ff", "#ffb03a", "#4dff8a", "#ff4b4b", "#b46bff"];
const DROP_NEON = ["#ff7ac4", "#7ff6ff", "#ffd07a", "#9dffbf", "#d6a8ff"];

// 원근: 점 (X, Y, z) → 화면. 소실점 (200, 196), 길바닥 높이 Y=330, 건물 벽은 X=±120
const VX = 200;
const VY = 196;
const STREET_Y = 330;
const WALL_X = 120;
const P = (X, Y, z) => [VX + X / z, VY + (Y - VY) / z];

// 간판 글자: 0~1 칸 안의 획 목록 (네온관처럼 선으로만 그림)
const GLYPHS = {
  中: [[[0.15, 0.3], [0.85, 0.3], [0.85, 0.68], [0.15, 0.68], [0.15, 0.3]], [[0.5, 0.06], [0.5, 0.94]]],
  大: [[[0.1, 0.36], [0.9, 0.36]], [[0.5, 0.08], [0.5, 0.42], [0.14, 0.92]], [[0.5, 0.42], [0.86, 0.92]]],
  王: [[[0.2, 0.15], [0.8, 0.15]], [[0.26, 0.5], [0.74, 0.5]], [[0.1, 0.86], [0.9, 0.86]], [[0.5, 0.15], [0.5, 0.86]]],
  田: [[[0.15, 0.15], [0.85, 0.15], [0.85, 0.85], [0.15, 0.85], [0.15, 0.15]], [[0.5, 0.15], [0.5, 0.85]], [[0.15, 0.5], [0.85, 0.5]]],
  山: [[[0.5, 0.08], [0.5, 0.86]], [[0.14, 0.36], [0.14, 0.86], [0.86, 0.86], [0.86, 0.36]]],
  日: [[[0.25, 0.1], [0.75, 0.1], [0.75, 0.9], [0.25, 0.9], [0.25, 0.1]], [[0.25, 0.5], [0.75, 0.5]]],
  工: [[[0.2, 0.15], [0.8, 0.15]], [[0.5, 0.15], [0.5, 0.85]], [[0.1, 0.85], [0.9, 0.85]]],
  口: [[[0.18, 0.2], [0.82, 0.2], [0.82, 0.8], [0.18, 0.8], [0.18, 0.2]]],
  人: [[[0.5, 0.1], [0.5, 0.35], [0.12, 0.9]], [[0.5, 0.35], [0.88, 0.9]]],
  十: [[[0.12, 0.5], [0.88, 0.5]], [[0.5, 0.1], [0.5, 0.9]]],
};
const GLYPH_KEYS = Object.keys(GLYPHS);

// 그려 둔 간판 자리: animate에서 깜빡임을 덧그릴 때 씀
let signs = [];

function neonStroke(g, color, width, glow) {
  g.shadowColor = color;
  g.shadowBlur = glow;
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
  g.shadowBlur = 0;
  // 관 가운데 하얗게 달아오른 심
  g.strokeStyle = "rgba(255,255,255,0.75)";
  g.lineWidth = width * 0.35;
  g.stroke();
}

function paintHongKong(g, globe, groundAt) {
  const rnd = seeded(1997);
  const r = (a, b) => a + rnd() * (b - a);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;
  const bottom = globe.y + globe.r;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 밤하늘: 도시 불빛에 물든 짙은 남보라, 건물 사이로 아래쪽이 자줏빛으로 번짐
  const sky = g.createLinearGradient(0, top, 0, VY);
  sky.addColorStop(0, "#0d0b24");
  sky.addColorStop(0.6, "#2a1446");
  sky.addColorStop(1, "#5a2160");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 거리 끝(소실점 쪽): 안개 속 불빛
  const far = g.createRadialGradient(VX, VY + 10, 0, VX, VY + 10, 60);
  far.addColorStop(0, "rgba(255,150,210,0.55)");
  far.addColorStop(1, "rgba(255,120,200,0)");
  g.fillStyle = far;
  g.fillRect(VX - 60, VY - 50, 120, 120);

  // 길바닥: 젖은 아스팔트. 가운데 차도, 양옆 인도
  const Z_FAR = 7;
  const quad = (a, b, c, d) => {
    g.beginPath();
    g.moveTo(...a);
    g.lineTo(...b);
    g.lineTo(...c);
    g.lineTo(...d);
    g.closePath();
  };
  const road = g.createLinearGradient(0, VY, 0, STREET_Y + 40);
  road.addColorStop(0, "#3a2440");
  road.addColorStop(1, "#141020");
  g.fillStyle = road;
  quad(P(-WALL_X, STREET_Y, 0.6), P(-WALL_X, STREET_Y, Z_FAR), P(WALL_X, STREET_Y, Z_FAR), P(WALL_X, STREET_Y, 0.6));
  g.fill();
  g.fillStyle = "rgba(90,70,100,0.5)";
  for (const s of [-1, 1]) {
    quad(P(s * WALL_X, STREET_Y, 0.6), P(s * WALL_X, STREET_Y, Z_FAR), P(s * 92, STREET_Y, Z_FAR), P(s * 92, STREET_Y, 0.6));
    g.fill();
  }
  // 차선: 가운데 흰 점선
  g.fillStyle = "rgba(230,230,240,0.55)";
  for (let z = 0.8; z < Z_FAR; z *= 1.32) {
    quad(P(-1.5, STREET_Y, z), P(-1.5, STREET_Y, z * 1.12), P(1.5, STREET_Y, z * 1.12), P(1.5, STREET_Y, z));
    g.fill();
  }

  // 건물: 양옆 벽면을 깊이별로 나눠 건물마다 색과 높이를 달리함. 창은 벽 평면 위의 사다리꼴
  const ZS = [0.6, 1.05, 1.45, 1.95, 2.6, 3.5, 4.7, Z_FAR];
  const WALLS = ["#2b2a3a", "#3a2d38", "#26323a", "#3a3530", "#2e2440", "#33303a", "#283038"];
  for (const s of [-1, 1]) {
    // 먼 건물부터 그려 가까운 건물이 덮게
    for (let k = ZS.length - 2; k >= 0; k--) {
      const z0 = ZS[k];
      const z1 = ZS[k + 1];
      const roof = -r(160, 520); // 건물 꼭대기 높이(위로 음수)
      const X = s * WALL_X;
      g.fillStyle = WALLS[(k + (s > 0 ? 3 : 0)) % WALLS.length];
      quad(P(X, roof, z0), P(X, roof, z1), P(X, STREET_Y, z1), P(X, STREET_Y, z0));
      g.fill();
      // 건물 사이 경계 그늘
      g.strokeStyle = "rgba(0,0,0,0.45)";
      g.lineWidth = 1.2 / z0;
      g.beginPath();
      g.moveTo(...P(X, roof, z0));
      g.lineTo(...P(X, STREET_Y, z0));
      g.stroke();
      // 옥상 테두리
      g.strokeStyle = "rgba(180,150,200,0.35)";
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(...P(X, roof, z0));
      g.lineTo(...P(X, roof, z1));
      g.stroke();
      // 창: 층마다 한 줄, 칸마다 켜진 창(따뜻한 노랑·차가운 흰빛)과 꺼진 창
      const cols = 4;
      for (let floor = 250; floor > roof + 10; floor -= 20) {
        for (let c = 0; c < cols; c++) {
          const za = z0 + ((z1 - z0) * (c + 0.18)) / cols;
          const zb = z0 + ((z1 - z0) * (c + 0.82)) / cols;
          const lit = rnd();
          g.fillStyle =
            lit < 0.3 ? "rgba(255,214,140,0.85)" : lit < 0.45 ? "rgba(190,225,255,0.75)" : "rgba(10,10,20,0.55)";
          quad(P(X, floor - 11, za), P(X, floor - 11, zb), P(X, floor, zb), P(X, floor, za));
          g.fill();
        }
      }
      // 에어컨 실외기: 벽에 붙은 작은 상자들
      for (let i = 0; i < 3; i++) {
        const zz = z0 + (z1 - z0) * r(0.1, 0.8);
        const yy = r(60, 240);
        g.fillStyle = "rgba(160,160,170,0.5)";
        const [ax, ay] = P(X, yy, zz);
        const w = 7 / zz;
        g.fillRect(s < 0 ? ax : ax - w, ay, w, 5 / zz);
      }
    }
  }

  // 네온 간판: 벽에서 길 쪽으로 직각으로 튀어나와 있어, 정면이 화면과 나란한 직사각형으로 보임
  signs = [];
  const SIGN_Z = [5.6, 4.6, 3.8, 3.1, 2.55, 2.1, 1.72, 1.4, 1.15];
  for (const z of SIGN_Z) {
    for (const s of [-1, 1]) {
      if (rnd() < 0.15) continue;
      const vertical = rnd() < 0.6;
      const w = vertical ? r(26, 38) : r(60, 100);
      const h = vertical ? r(90, 160) : r(30, 46);
      const y0 = r(-60, 170);
      const x0 = s < 0 ? -WALL_X + r(0, 8) : WALL_X - r(0, 8) - w;
      signs.push({ x0, y0, w, h, z, vertical, color: pick(NEON), color2: pick(NEON), n: vertical ? Math.max(2, Math.round(h / w) - 1) : 3 });
    }
  }
  for (const sg of signs) {
    const [ax, ay] = P(sg.x0, sg.y0, sg.z);
    const [bx, by] = P(sg.x0 + sg.w, sg.y0 + sg.h, sg.z);
    sg.rect = [ax, ay, bx - ax, by - ay];
    // 매다는 쇠막대
    g.strokeStyle = "rgba(60,60,70,0.8)";
    g.lineWidth = 1 / sg.z;
    g.beginPath();
    const wallX = sg.x0 < 0 ? -WALL_X : WALL_X;
    g.moveTo(...P(wallX, sg.y0 - 6, sg.z));
    g.lineTo(...P(sg.x0 + sg.w / 2, sg.y0, sg.z));
    g.stroke();
    // 간판 바탕
    g.fillStyle = "rgba(18,8,26,0.88)";
    g.fillRect(ax, ay, bx - ax, by - ay);
    // 테두리 네온관
    const lw = Math.max(0.7, 2.2 / sg.z);
    g.beginPath();
    g.rect(ax + lw * 1.5, ay + lw * 1.5, bx - ax - lw * 3, by - ay - lw * 3);
    neonStroke(g, sg.color, lw, 10 / sg.z);
    // 글자
    const cell = sg.vertical ? (bx - ax) * 0.72 : (by - ay) * 0.62;
    for (let i = 0; i < sg.n; i++) {
      const key = pick(GLYPH_KEYS);
      const gx = sg.vertical ? ax + (bx - ax - cell) / 2 : ax + (bx - ax) * ((i + 0.5) / sg.n) - cell / 2;
      const gy = sg.vertical ? ay + (by - ay) * ((i + 0.5) / sg.n) - cell / 2 : ay + (by - ay - cell) / 2;
      g.beginPath();
      for (const stroke of GLYPHS[key]) {
        stroke.forEach(([u, v], j) => (j ? g.lineTo(gx + u * cell, gy + v * cell) : g.moveTo(gx + u * cell, gy + v * cell)));
      }
      g.lineCap = "round";
      g.lineJoin = "round";
      neonStroke(g, sg.color2, Math.max(0.6, 1.8 / sg.z), 8 / sg.z);
    }
    // 젖은 길에 비친 간판 빛: 간판 아래 길바닥에서 아래로 길게 번지는 세로 띠
    const [rx, ry] = P(sg.x0 + sg.w / 2, STREET_Y, sg.z);
    // 물결에 끊긴 가로 획을 아래로 쌓아, 흐릿하게 일렁이는 빛기둥처럼 보이게 함
    g.save();
    g.globalCompositeOperation = "lighter";
    g.filter = `blur(${Math.max(0.6, 2 / sg.z)}px)`;
    g.fillStyle = sg.color;
    const len = 80 / sg.z;
    const rw = Math.max(2, (bx - ax) * 0.4);
    for (let dy = 0; dy < len; dy += 1.6) {
      const k = 1 - dy / len;
      if (rnd() < 0.3) continue;
      g.globalAlpha = 0.45 * k * k;
      const w = rw * (0.5 + rnd() * 0.7) * (0.6 + k * 0.4);
      g.fillRect(rx - w / 2 + (rnd() - 0.5) * 3, ry + dy, w, 0.9);
    }
    g.restore();
  }

  // 빨간 택시: 은색 지붕에 TAXI 표지, 켜진 전조등이 젖은 길에 비침
  const tz = 1.9;
  const T = (X, Y) => P(X, Y, tz);
  const [t0x, t0y] = T(18, 300);
  const [t1x, t1y] = T(78, STREET_Y);
  const tw = t1x - t0x;
  const th = t1y - t0y;
  g.fillStyle = "rgba(0,0,0,0.5)";
  g.beginPath();
  g.ellipse(t0x + tw / 2, t1y + 1, tw * 0.6, 2.5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#c81e2a";
  g.beginPath();
  g.roundRect(t0x, t0y + th * 0.35, tw, th * 0.6, 2);
  g.fill();
  g.fillStyle = "#d9d9de";
  g.beginPath();
  g.roundRect(t0x + tw * 0.14, t0y, tw * 0.72, th * 0.42, 2);
  g.fill();
  g.fillStyle = "#22263a";
  g.fillRect(t0x + tw * 0.2, t0y + th * 0.12, tw * 0.6, th * 0.26);
  g.fillStyle = "#ffe36a";
  g.fillRect(t0x + tw * 0.4, t0y - th * 0.12, tw * 0.2, th * 0.12);
  g.save();
  g.globalCompositeOperation = "lighter";
  for (const hx of [t0x + tw * 0.14, t0x + tw * 0.86]) {
    const lamp = g.createRadialGradient(hx, t0y + th * 0.62, 0, hx, t0y + th * 0.62, 7);
    lamp.addColorStop(0, "rgba(255,255,235,1)");
    lamp.addColorStop(1, "rgba(255,250,220,0)");
    g.fillStyle = lamp;
    g.fillRect(hx - 7, t0y + th * 0.62 - 7, 14, 14);
    const beam = g.createLinearGradient(0, t1y, 0, t1y + 30);
    beam.addColorStop(0, "rgba(255,250,220,0.35)");
    beam.addColorStop(1, "rgba(255,250,220,0)");
    g.fillStyle = beam;
    g.fillRect(hx - 2, t1y, 4, 30);
  }
  g.restore();

  // 바닥 언덕: 젖은 보도블록. 네온 빛이 웅덩이에 고임
  const floorTop = groundAt(globe.x);
  const wet = g.createLinearGradient(0, floorTop - 10, 0, bottom);
  wet.addColorStop(0, "#2a2034");
  wet.addColorStop(1, "#120e1a");
  g.fillStyle = wet;
  fillSilhouette(g, groundAt, left, right, bottom);
  g.save();
  g.globalCompositeOperation = "lighter";
  g.filter = "blur(5px)";
  for (let i = 0; i < 10; i++) {
    const x = r(left + 30, right - 30);
    const y = groundAt(x) + r(6, 34);
    g.fillStyle = pick(NEON);
    g.globalAlpha = r(0.18, 0.32);
    g.beginPath();
    g.ellipse(x, y, r(14, 30), r(2.5, 5), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  // 보도블록 줄눈
  g.strokeStyle = "rgba(255,255,255,0.06)";
  g.lineWidth = 0.6;
  for (let y = floorTop + 8; y < bottom; y += 9) {
    g.beginPath();
    for (let x = left; x <= right; x += 6) g.lineTo(x, Math.max(groundAt(x) + 3, y));
    g.stroke();
  }

  g.restore();
}

// 간판 몇 개가 네온관처럼 가끔 지직거리며 깜빡임
function animateHongKong(ctx, t) {
  if (!signs.length) return;
  ctx.save();
  for (let i = 0; i < signs.length; i += 3) {
    const sg = signs[i];
    if (!sg.rect) continue;
    const [x, y, w, h] = sg.rect;
    const phase = (t * 0.001 + i * 1.7) % 7;
    // 7초에 한 번, 0.4초 동안 지직
    if (phase < 0.4) {
      const off = Math.sin(t * 0.09 + i) > 0.2;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = off ? 0.75 : 0;
      ctx.fillStyle = "#12081a";
      ctx.fillRect(x, y, w, h);
    } else {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.12 + 0.08 * Math.sin(t * 0.004 + i);
      ctx.fillStyle = sg.color;
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    }
  }
  ctx.restore();
}

// 네온 빗방울: 떨어질 때는 가는 빛줄기, 바닥에 닿으면 납작한 빛 웅덩이
function drawRain(ctx, p) {
  ctx.save();
  if (p.settled) {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.size * 1.6, p.size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const len = p.size * 5 + Math.min(10, Math.abs(p.vy || 0) * 1.5);
    const dx = (p.vx || 0) * 0.6;
    const streak = ctx.createLinearGradient(p.x - dx, p.y - len, p.x, p.y);
    streak.addColorStop(0, p.color + "00");
    streak.addColorStop(1, p.color);
    ctx.strokeStyle = streak;
    ctx.lineWidth = p.size * 0.7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x - dx, p.y - len);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const hongkong = {
  id: "hongkong",
  label: "홍콩 · 몽콕 네온 거리",
  title: "Mong Kok",
  paint: paintHongKong,
  animate: animateHongKong,
  glare: 0.5,
  grade: { saturation: 1.05, tint: 0.05, floor: 6 },
  base: {
    trim: ["#3a2d4d", "#ff7ad1", "#7a5cff", "#2a2238"],
    plate: "Hong Kong",
    plateFont: "700 15px 'Helvetica Neue', Arial, sans-serif",
    plateInk: "#1a0f24",
  },
  // 빗방울은 무겁고 빨리 떨어짐
  particles: {
    count: 190,
    blend: "lighter",
    make(rand) {
      const size = rand(0.8, 1.7);
      return {
        size,
        color: DROP_NEON[Math.floor(rand(0, DROP_NEON.length))],
        sink: 0.32 + size * 0.06,
        drag: rand(0.12, 0.18),
        inertia: rand(0.5, 0.8),
        grip: rand(0.6, 1.8),
        flutter: 0,
      };
    },
    draw: drawRain,
  },
};
