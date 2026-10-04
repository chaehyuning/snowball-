// 대만: 비 갠 밤 타이베이 시먼딩 거리. 양옆으로 빽빽한 고층 건물이 소실점으로 모이고,
// 길 위로 겹겹이 튀어나온 네온 간판, 젖은 길에 번지는 간판 빛, 노란 택시, 거리를 가로지르는 빨간 등, 네온빛 빗방울

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

// 간판 색 짝: 테두리와 글자가 서로 받쳐 주는 두 색
const PAIRS = [
  ["#ff3fa4", "#3ff0ff"],
  ["#ffb03a", "#ff4b4b"],
  ["#3ff0ff", "#4dff8a"],
  ["#b46bff", "#ff3fa4"],
  ["#4dff8a", "#ffb03a"],
  ["#ff4b4b", "#ffd36a"],
];
// 가로 간판 아래 영문 상호
const WORDS = ["HOTEL", "KARAOKE", "NOODLES", "JEWELLERY", "PAWN", "BAR", "SAUNA", "TEA HOUSE", "MAHJONG", "OPTICAL"];

// 네온관 글자 한 자: 칸 (x, y, size) 안에 획을 긋고 빛을 입힘
function drawGlyph(g, key, x, y, size, color, width, k) {
  g.beginPath();
  for (const stroke of GLYPHS[key]) {
    stroke.forEach(([u, v], j) => (j ? g.lineTo(x + u * size, y + v * size) : g.moveTo(x + u * size, y + v * size)));
  }
  g.lineCap = "round";
  g.lineJoin = "round";
  neonStroke(g, color, width, 9 * k);
}

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
      // 높이 칸 두 개(위·아래)에 하나씩: 몽콕처럼 간판이 위아래로 겹겹이
      for (const [lo, hi] of [[-110, -10], [40, 170]]) {
        if (rnd() < 0.25) continue;
        const vertical = rnd() < 0.55;
        const w = vertical ? r(26, 36) : r(64, 100);
        const h = vertical ? r(100, 150) : r(42, 58);
        const y0 = r(lo, hi - (vertical ? 60 : 10));
        const x0 = s < 0 ? -WALL_X + r(0, 8) : WALL_X - r(0, 8) - w;
        const [color, color2] = pick(PAIRS);
        const style = pick(["double", "double", "bulbs", "single"]);
        const words = !vertical && rnd() < 0.7 ? pick(WORDS) : "";
        const logo = !vertical && rnd() < 0.5;
        const n = vertical ? Math.max(2, Math.round(h / w) - 1) : logo ? 2 : 3;
        const chars = Array.from({ length: n }, () => pick(GLYPH_KEYS));
        signs.push({ x0, y0, w, h, z, vertical, color, color2, style, words, logo, chars, side: s });
      }
    }
  }
  for (const sg of signs) {
    const [ax, ay] = P(sg.x0, sg.y0, sg.z);
    const [bx, by] = P(sg.x0 + sg.w, sg.y0 + sg.h, sg.z);
    const w = bx - ax;
    const h = by - ay;
    sg.rect = [ax, ay, w, h];
    const k = 1 / sg.z; // 가까울수록 굵게
    const wallX = sg.side < 0 ? -WALL_X : WALL_X;

    // 간판 빛이 둘레 벽과 옆 간판에 번짐
    g.save();
    g.globalCompositeOperation = "lighter";
    const cx = ax + w / 2;
    const cy = ay + h / 2;
    const reach = Math.max(w, h) * 0.9 + 10 * k;
    const halo = g.createRadialGradient(cx, cy, 0, cx, cy, reach);
    halo.addColorStop(0, sg.color + "40");
    halo.addColorStop(1, sg.color + "00");
    g.fillStyle = halo;
    g.fillRect(cx - reach, cy - reach, reach * 2, reach * 2);
    g.restore();

    // 벽에서 뻗은 쇠 받침 두 개
    g.strokeStyle = "rgba(70,66,80,0.9)";
    g.lineWidth = Math.max(0.6, 1.4 * k);
    for (const yy of [sg.y0 + sg.h * 0.12, sg.y0 + sg.h * 0.88]) {
      g.beginPath();
      g.moveTo(...P(wallX, yy - 8, sg.z));
      g.lineTo(...P(sg.side < 0 ? sg.x0 + sg.w : sg.x0, yy, sg.z));
      g.stroke();
    }

    // 간판 두께: 길 가운데 쪽 옆면이 소실점 방향으로 살짝 보임
    const edgeX = sg.side < 0 ? sg.x0 + sg.w : sg.x0;
    const dz = 0.06;
    g.fillStyle = "#0b0710";
    g.beginPath();
    g.moveTo(...P(edgeX, sg.y0, sg.z));
    g.lineTo(...P(edgeX, sg.y0, sg.z + dz));
    g.lineTo(...P(edgeX, sg.y0 + sg.h, sg.z + dz));
    g.lineTo(...P(edgeX, sg.y0 + sg.h, sg.z));
    g.closePath();
    g.fill();

    // 바탕: 어두운 철판, 모서리는 살짝 둥글고 안쪽에 철골 격자가 비침
    const radius = Math.min(w, h) * 0.08;
    const plate = g.createLinearGradient(0, ay, 0, by);
    plate.addColorStop(0, "#1d1028");
    plate.addColorStop(1, "#0e0716");
    g.fillStyle = plate;
    g.beginPath();
    g.roundRect(ax, ay, w, h, radius);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.05)";
    g.lineWidth = 0.5;
    const step = Math.max(4, 9 * k);
    for (let gx = ax + step; gx < bx; gx += step) {
      g.beginPath();
      g.moveTo(gx, ay + 1);
      g.lineTo(gx, by - 1);
      g.stroke();
    }

    // 테두리: 두 겹 네온관 / 전구가 줄지은 테 / 한 겹
    const lw = Math.max(0.7, 2 * k);
    const inset = lw * 1.6;
    if (sg.style === "bulbs") {
      g.save();
      g.globalCompositeOperation = "lighter";
      const gap = Math.max(2.4, 5 * k);
      const dot = (x, y) => {
        const bulb = g.createRadialGradient(x, y, 0, x, y, lw * 1.6);
        bulb.addColorStop(0, "#fff6d8");
        bulb.addColorStop(0.4, "#ffc34a");
        bulb.addColorStop(1, "rgba(255,170,40,0)");
        g.fillStyle = bulb;
        g.fillRect(x - lw * 1.6, y - lw * 1.6, lw * 3.2, lw * 3.2);
      };
      for (let x = ax + inset; x <= bx - inset; x += gap) {
        dot(x, ay + inset);
        dot(x, by - inset);
      }
      for (let y = ay + inset + gap; y <= by - inset - gap; y += gap) {
        dot(ax + inset, y);
        dot(bx - inset, y);
      }
      g.restore();
    } else {
      g.beginPath();
      g.roundRect(ax + inset, ay + inset, w - inset * 2, h - inset * 2, radius);
      neonStroke(g, sg.color, lw, 12 * k);
      if (sg.style === "double") {
        const in2 = inset + lw * 2.4;
        g.beginPath();
        g.roundRect(ax + in2, ay + in2, w - in2 * 2, h - in2 * 2, radius * 0.6);
        neonStroke(g, sg.color2, lw * 0.6, 8 * k);
      }
    }

    // 글자 영역: 가로 간판은 위쪽에 한자, 아래쪽에 영문 상호. 왼쪽에 둥근 로고가 붙기도 함
    const pad = inset + lw * (sg.style === "double" ? 3.4 : 1.8);
    let gx0 = ax + pad;
    let gy0 = ay + pad;
    let gw = w - pad * 2;
    let gh = h - pad * 2;
    if (sg.logo) {
      const lr = gh * (sg.words ? 0.42 : 0.46);
      const lx = gx0 + lr;
      const ly = gy0 + gh / 2;
      g.beginPath();
      g.arc(lx, ly, lr, 0, Math.PI * 2);
      neonStroke(g, sg.color2, lw * 0.8, 8 * k);
      drawGlyph(g, pick(GLYPH_KEYS), lx - lr * 0.6, ly - lr * 0.6, lr * 1.2, sg.color, lw * 0.7, k);
      gx0 += lr * 2 + lw * 3;
      gw -= lr * 2 + lw * 3;
    }
    if (sg.words) {
      const th = gh * 0.32;
      g.save();
      g.font = `700 ${th}px 'Helvetica Neue', Arial, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      let fs = th;
      while (g.measureText(sg.words).width > gw && fs > 3) {
        fs -= 0.5;
        g.font = `700 ${fs}px 'Helvetica Neue', Arial, sans-serif`;
      }
      g.shadowColor = sg.color2;
      g.shadowBlur = 8 * k;
      g.fillStyle = sg.color2;
      g.fillText(sg.words, gx0 + gw / 2, gy0 + gh - th / 2);
      g.shadowBlur = 0;
      g.globalAlpha = 0.6;
      g.fillStyle = "#ffffff";
      g.fillText(sg.words, gx0 + gw / 2, gy0 + gh - th / 2);
      g.restore();
      gh -= th + lw * 2;
    }
    const n = sg.chars.length;
    const cell = sg.vertical ? Math.min(gw * 1.05, (gh / n) * 0.95) : Math.min(gh, gw / n) * 0.92;
    sg.chars.forEach((key, i) => {
      const cxg = sg.vertical ? gx0 + gw / 2 : gx0 + gw * ((i + 0.5) / n);
      const cyg = sg.vertical ? gy0 + gh * ((i + 0.5) / n) : gy0 + gh / 2;
      // 한 간판 안에서 글자 색을 번갈아
      const color = sg.style === "double" && i % 2 ? sg.color2 : sg.color;
      drawGlyph(g, key, cxg - cell / 2, cyg - cell / 2, cell, color, Math.max(0.8, cell * 0.1), k);
    });

    // 젖은 길에 비친 간판 빛: 간판 아래 길바닥에서 아래로 길게 번지는 세로 띠
    const [rx, ry] = P(sg.x0 + sg.w / 2, STREET_Y, sg.z);
    // 젖은 길에 비친 빛: 아래로 갈수록 가늘어지고 옅어지는 부드러운 빛기둥 (가로 줄 없이 흐리게)
    g.save();
    g.globalCompositeOperation = "lighter";
    g.filter = `blur(${Math.max(2, 4.5 / sg.z)}px)`;
    const len = 80 / sg.z;
    const rw = Math.max(2, (bx - ax) * 0.45);
    const refl = g.createLinearGradient(0, ry, 0, ry + len);
    refl.addColorStop(0, sg.color + "70");
    refl.addColorStop(1, sg.color + "00");
    g.fillStyle = refl;
    g.beginPath();
    g.moveTo(rx - rw / 2, ry);
    g.lineTo(rx + rw / 2, ry);
    g.lineTo(rx + rw * 0.18, ry + len);
    g.lineTo(rx - rw * 0.18, ry + len);
    g.closePath();
    g.fill();
    g.restore();
  }

  // 거리를 가로지르는 빨간 등: 양옆 건물 사이 줄에 둥근 등이 줄지어 매달림. 가까울수록 크고 줄이 처짐
  for (const z of [4.4, 3.1, 2.2, 1.55, 1.12]) {
    const y0 = -40 + (z - 1) * 18;
    const sag = 26;
    const N = 9;
    const at = (t) => {
      const X = -WALL_X + t * WALL_X * 2;
      const Y = y0 + sag * 4 * t * (1 - t);
      return P(X, Y, z);
    };
    g.strokeStyle = "rgba(40,30,40,0.8)";
    g.lineWidth = Math.max(0.4, 0.8 / z);
    g.beginPath();
    for (let k = 0; k <= 20; k++) {
      const [x, y] = at(k / 20);
      k ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
    const rr = 7 / z;
    for (let k = 1; k < N; k++) {
      const [x, y] = at(k / N);
      const cy = y + rr * 1.4;
      // 은은한 빛무리
      g.save();
      g.globalCompositeOperation = "lighter";
      const glow = g.createRadialGradient(x, cy, 0, x, cy, rr * 3.2);
      glow.addColorStop(0, "rgba(255,90,60,0.4)");
      glow.addColorStop(1, "rgba(255,60,40,0)");
      g.fillStyle = glow;
      g.fillRect(x - rr * 3.2, cy - rr * 3.2, rr * 6.4, rr * 6.4);
      g.restore();
      // 줄과 몸통: 위아래가 살짝 눌린 둥근 등, 가운데가 밝게 빛남
      g.strokeStyle = "rgba(40,30,40,0.8)";
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, cy - rr);
      g.stroke();
      const body = g.createRadialGradient(x - rr * 0.3, cy - rr * 0.2, rr * 0.1, x, cy, rr * 1.1);
      body.addColorStop(0, "#ffd08a");
      body.addColorStop(0.45, "#f0442e");
      body.addColorStop(1, "#8e1418");
      g.fillStyle = body;
      g.beginPath();
      g.ellipse(x, cy, rr * 0.95, rr, 0, 0, Math.PI * 2);
      g.fill();
      // 대나무 살 결
      g.strokeStyle = "rgba(120,20,20,0.5)";
      g.lineWidth = Math.max(0.3, 0.5 / z);
      for (const f of [-0.5, 0.5]) {
        g.beginPath();
        g.ellipse(x, cy, rr * 0.95 * Math.abs(f), rr, 0, f < 0 ? Math.PI / 2 : -Math.PI / 2, f < 0 ? Math.PI * 1.5 : Math.PI / 2);
        g.stroke();
      }
      // 금빛 위·아래 테와 술
      g.fillStyle = "#d9a83a";
      g.fillRect(x - rr * 0.45, cy - rr - rr * 0.2, rr * 0.9, rr * 0.25);
      g.fillRect(x - rr * 0.45, cy + rr - rr * 0.05, rr * 0.9, rr * 0.25);
      g.strokeStyle = "#e0b040";
      g.beginPath();
      g.moveTo(x, cy + rr * 1.2);
      g.lineTo(x, cy + rr * 1.9);
      g.stroke();
    }
  }

  // 노란 택시(타이베이 택시는 노랑): 은색 지붕에 TAXI 표지, 켜진 전조등이 젖은 길에 비침
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
  g.fillStyle = "#f2c230";
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

// 네온 빗방울: 동그란 물방울. 둘레로 간판 빛이 번지고, 속은 맑고, 왼쪽 위에 하얀 반사점.
// 바닥에 닿으면 살짝 눌린 물방울로 남음
// 방울 그림은 색·크기별로 한 번만 그려 두고(스프라이트) 매 프레임엔 붙이기만 함
const DROP_RES = 4;
const dropSprites = new Map();
function dropSprite(color, s, settled) {
  const q = Math.round(s * 8) / 8;
  const key = color + (settled ? "_" : "") + q;
  let sprite = dropSprites.get(key);
  if (sprite) return sprite;
  const half = q * 2.4;
  sprite = document.createElement("canvas");
  sprite.width = sprite.height = Math.ceil(half * 2 * DROP_RES);
  const g = sprite.getContext("2d");
  g.scale(DROP_RES, DROP_RES);
  g.translate(half, half);
  const glow = g.createRadialGradient(0, 0, 0, 0, 0, half);
  glow.addColorStop(0, color + "55");
  glow.addColorStop(1, color + "00");
  g.fillStyle = glow;
  g.fillRect(-half, -half, half * 2, half * 2);
  const body = g.createRadialGradient(-q * 0.3, -q * 0.35, q * 0.1, 0, 0, q);
  body.addColorStop(0, "rgba(255,255,255,0.9)");
  body.addColorStop(0.35, color + "cc");
  body.addColorStop(1, color + "55");
  g.fillStyle = body;
  g.beginPath();
  g.arc(0, 0, q, 0, Math.PI * 2);
  g.fill();
  if (!settled) {
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(-q * 0.35, -q * 0.4, q * 0.22, 0, Math.PI * 2);
    g.fill();
  }
  sprite.half = half;
  dropSprites.set(key, sprite);
  return sprite;
}

function drawRain(ctx, p) {
  const s = p.size * 1.25;
  if (s < 0.05) return;
  // 바닥에 내려앉은 방울은 납작하고 옅게: 땅 위에 점이 줄지어 박힌 듯 보이지 않고 젖은 빛으로만 남음
  const squash = p.settled ? 0.4 : 1;
  const sprite = dropSprite(p.color, s, p.settled);
  const h = sprite.half;
  const prev = ctx.globalAlpha;
  if (p.settled) ctx.globalAlpha = prev * 0.35;
  ctx.drawImage(sprite, p.x - h, p.y - h * squash, h * 2, h * 2 * squash);
  ctx.globalAlpha = prev;
}

export const hongkong = {
  id: "taiwan",
  label: "대만 · 시먼딩 거리",
  title: "Ximending",
  paint: paintHongKong,
  animate: animateHongKong,
  glare: 0.5,
  grade: { saturation: 1.05, tint: 0.05, floor: 6 },
  base: {
    trim: ["#3a2d4d", "#ff7ad1", "#7a5cff", "#2a2238"],
    plate: "Ximending",
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
