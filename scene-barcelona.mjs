// 스페인: 바르셀로나 사그라다 파밀리아 실내. 나무처럼 갈라지는 돌기둥 숲과
// 동쪽(왼쪽)은 파랑·초록, 서쪽(오른쪽)은 주황·빨강인 스테인드글라스, 흩날리는 유리 조각

import { seeded, fillSilhouette } from "./util.mjs";

const COOL = ["#1f5fc9", "#2f86e0", "#1aa3a0", "#3cbf6a", "#7fd0f0", "#9ad84a", "#2a4fa8"];
const WARM = ["#f2b632", "#f08a24", "#e0531f", "#d8324a", "#ffd86a", "#c2185b", "#f5a05a"];
const JEWEL = ["#2f6fd6", "#1aa3a0", "#3cbf6a", "#7fd0f0", "#f2b632", "#f06a2a", "#d8324a", "#ffd86a"];
const STONE = ["#f3ece0", "#d6cbb8", "#9f917b"];
const VP = { x: 200, y: 214 }; // 소실점: 신랑(가운데 통로) 끝 제단

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

  // 실내 바탕: 위는 빛이 드는 밝은 돌, 아래로 갈수록 그늘. 왼쪽은 푸른 빛, 오른쪽은 노을빛이 번짐
  const base = g.createLinearGradient(0, top, 0, globe.y + globe.r);
  base.addColorStop(0, "#f6f0e4");
  base.addColorStop(0.5, "#ddd4c6");
  base.addColorStop(1, "#a99d8c");
  g.fillStyle = base;
  g.fillRect(left, top, size, size);
  const cool = g.createRadialGradient(left + 20, 200, 0, left + 20, 200, 220);
  cool.addColorStop(0, "rgba(60,140,220,0.35)");
  cool.addColorStop(1, "rgba(60,140,220,0)");
  g.fillStyle = cool;
  g.fillRect(left, top, size, size);
  const warm = g.createRadialGradient(right - 20, 200, 0, right - 20, 200, 220);
  warm.addColorStop(0, "rgba(245,140,60,0.38)");
  warm.addColorStop(1, "rgba(245,140,60,0)");
  g.fillStyle = warm;
  g.fillRect(left, top, size, size);

  // 원근 상자: 소실점으로 모이는 양쪽 벽, 천장, 바닥. 벽은 바닥 쪽이 어둡고 천장은 밝음
  const box = (pts, c0, c1, y0, y1) => {
    const grad = g.createLinearGradient(0, y0, 0, y1);
    grad.addColorStop(0, c0);
    grad.addColorStop(1, c1);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(...pts[0]);
    for (const pt of pts.slice(1)) g.lineTo(...pt);
    g.closePath();
    g.fill();
  };
  const back = { l: VP.x - 30, r: VP.x + 30, t: VP.y - 110, b: VP.y + 20 };
  box([[left, top], [back.l, back.t], [back.l, back.b], [left, 400]], "rgba(205,195,178,0.55)", "rgba(120,108,92,0.55)", top, 400);
  box([[right, top], [back.r, back.t], [back.r, back.b], [right, 400]], "rgba(205,195,178,0.55)", "rgba(120,108,92,0.55)", top, 400);
  box([[left, 400], [back.l, back.b], [back.r, back.b], [right, 400]], "rgba(190,178,160,0.6)", "rgba(110,98,84,0.7)", back.b, 400);
  // 바닥 판석 줄: 소실점으로 모임
  g.strokeStyle = "rgba(90,80,65,0.22)";
  g.lineWidth = 0.6;
  for (let k = -6; k <= 6; k++) {
    g.beginPath();
    g.moveTo(VP.x + k * 5, back.b);
    g.lineTo(VP.x + k * 60, 400);
    g.stroke();
  }
  for (let k = 1; k < 9; k++) {
    const t = Math.pow(k / 9, 1.8);
    const y = back.b + (400 - back.b) * t;
    g.beginPath();
    g.moveTo(left, y);
    g.lineTo(right, y);
    g.stroke();
  }

  // 제단 뒤 높은 창에서 쏟아지는 금빛
  const apse = g.createRadialGradient(VP.x, VP.y - 30, 0, VP.x, VP.y - 30, 90);
  apse.addColorStop(0, "rgba(255,236,190,0.95)");
  apse.addColorStop(0.4, "rgba(255,220,160,0.4)");
  apse.addColorStop(1, "rgba(255,220,160,0)");
  g.fillStyle = apse;
  g.fillRect(left, top, size, size);
  stainedWindow(g, rnd, VP.x, VP.y - 78, 16, 58, [...WARM.slice(0, 3), ...COOL.slice(0, 3)], 1);

  // 천장: 별처럼 갈라진 둥근 천창들. 가까울수록 크고, 가운데로 모이며 작아짐
  for (const [cx, cy, rr] of [
    [200, 70, 26],
    [128, 92, 20],
    [272, 92, 20],
    [160, 128, 13],
    [240, 128, 13],
    [200, 150, 9],
    [70, 66, 24],
    [330, 66, 24],
  ]) {
    vault(g, cx, cy, rr);
  }

  // 양쪽 벽 스테인드글라스: 먼 것부터. 왼쪽(동쪽)은 차가운 색, 오른쪽(서쪽)은 따뜻한 색
  for (const d of [0.15, 0.4, 0.7]) {
    for (const side of [-1, 1]) {
      const x = VP.x + side * (34 + 150 * d);
      const w = 8 + 26 * d;
      const h = 34 + 120 * d;
      const y = VP.y - 30 - 90 * d;
      stainedWindow(g, rnd, x, y, w, h, side < 0 ? COOL : WARM, 0.75 + d * 0.25);
    }
  }

  // 창에서 비스듬히 내려오는 색 빛줄기 (흐리게 번짐)
  g.save();
  g.globalCompositeOperation = "lighter";
  g.filter = "blur(4px)";
  for (const [x0, y0, x1, y1, color] of [
    [62, 150, 150, 320, "rgba(60,150,230,0.16)"],
    [100, 175, 180, 310, "rgba(60,200,150,0.13)"],
    [338, 150, 250, 320, "rgba(245,150,60,0.17)"],
    [300, 175, 220, 310, "rgba(230,70,80,0.13)"],
  ]) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x0 - 8, y0);
    g.lineTo(x0 + 8, y0);
    g.lineTo(x1 + 22, y1);
    g.lineTo(x1 - 22, y1);
    g.closePath();
    g.fill();
  }
  g.restore();

  // 나무 기둥: 먼 것부터 가까운 것 순서로 (먼 기둥은 가늘고 흐림)
  for (const d of [0.1, 0.3, 0.55, 0.9]) {
    for (const side of [-1, 1]) {
      const x = VP.x + side * (16 + 132 * d);
      const baseY = VP.y + 18 + 112 * d;
      const topY = VP.y - 40 - 70 * d;
      const w = 4 + 17 * d;
      treeColumn(g, x, baseY, topY, w, side, d);
    }
  }

  // 바닥: 윤이 나는 돌. 창빛이 색 웅덩이로 비침
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop - 40, 0, globe.y + globe.r);
  floor.addColorStop(0, "#cfc5b5");
  floor.addColorStop(1, "#8f8473");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  g.save();
  g.globalCompositeOperation = "lighter";
  g.filter = "blur(6px)";
  for (let i = 0; i < 12; i++) {
    const x = r(left + 30, right - 30);
    const y = groundAt(x) + r(4, 30);
    const color = x < 200 ? COOL[Math.floor(rnd() * COOL.length)] : WARM[Math.floor(rnd() * WARM.length)];
    g.fillStyle = color;
    g.globalAlpha = r(0.12, 0.25);
    g.beginPath();
    g.ellipse(x, y, r(14, 28), r(3, 6), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  g.restore();
}

// 천창: 가운데가 밝게 열린 별 모양. 둘레로 꽃잎처럼 갈라진 돌 결
function vault(g, cx, cy, rr) {
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.6);
  glow.addColorStop(0, "rgba(255,248,225,0.9)");
  glow.addColorStop(0.4, "rgba(255,240,205,0.35)");
  glow.addColorStop(1, "rgba(255,240,205,0)");
  g.fillStyle = glow;
  g.fillRect(cx - rr * 1.6, cy - rr * 1.6, rr * 3.2, rr * 3.2);
  // 꽃잎 같은 돌 갈래: 가운데 쪽은 밝고 바깥은 그늘
  const petals = 10;
  for (let k = 0; k < petals; k++) {
    const a = (k / petals) * Math.PI * 2;
    const grad = g.createLinearGradient(cx, cy, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.6);
    grad.addColorStop(0, "rgba(255,250,236,0.95)");
    grad.addColorStop(1, "rgba(150,135,112,0.85)");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(cx + Math.cos(a - 0.12) * rr * 0.3, cy + Math.sin(a - 0.12) * rr * 0.18);
    g.quadraticCurveTo(
      cx + Math.cos(a) * rr * 1.15,
      cy + Math.sin(a) * rr * 0.7,
      cx + Math.cos(a + 0.12) * rr * 0.3,
      cy + Math.sin(a + 0.12) * rr * 0.18,
    );
    g.closePath();
    g.fill();
  }
  g.fillStyle = "rgba(255,252,240,0.95)";
  g.beginPath();
  g.ellipse(cx, cy, rr * 0.28, rr * 0.17, 0, 0, Math.PI * 2);
  g.fill();
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
// 마디에서 네 갈래 가지가 천장으로 뻗음. 빛을 받는 쪽은 창 색이 살짝 물듦
function treeColumn(g, x, baseY, topY, w, side, d) {
  const tint = side < 0 ? "rgba(70,150,230,0.22)" : "rgba(245,140,60,0.22)";
  const fade = 0.75 + 0.25 * d; // 먼 기둥은 실내 공기에 묻혀 조금 흐림
  g.save();
  g.globalAlpha = fade;
  const trunk = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  trunk.addColorStop(0, side < 0 ? STONE[0] : STONE[2]);
  trunk.addColorStop(0.5, STONE[1]);
  trunk.addColorStop(1, side < 0 ? STONE[2] : STONE[0]);
  g.fillStyle = trunk;
  g.beginPath();
  g.moveTo(x - w / 2, baseY);
  g.lineTo(x - w * 0.34, topY);
  g.lineTo(x + w * 0.34, topY);
  g.lineTo(x + w / 2, baseY);
  g.closePath();
  g.fill();
  // 창 쪽 면에 물든 색빛
  g.fillStyle = tint;
  g.beginPath();
  const lit = side < 0 ? -1 : 1;
  g.moveTo(x + lit * w * 0.5, baseY);
  g.lineTo(x + lit * w * 0.34, topY);
  g.lineTo(x, topY);
  g.lineTo(x, baseY);
  g.closePath();
  g.fill();
  // 세로 홈
  g.strokeStyle = "rgba(120,105,85,0.25)";
  g.lineWidth = Math.max(0.3, w * 0.05);
  for (let k = -1; k <= 1; k++) {
    g.beginPath();
    g.moveTo(x + k * w * 0.22, baseY);
    g.lineTo(x + k * w * 0.15, topY);
    g.stroke();
  }
  // 가지: 마디에서 바깥·위로 휘며 가늘어짐 (밑은 굵고 끝은 가늘게).
  // 반투명으로 겹쳐 그리면 이음매가 점처럼 보여서 가지는 불투명하게 그림
  g.globalAlpha = 1;
  const ceilY = topY - (topY - 40) * 0.75;
  for (const [dx, lift] of [
    [-1.6, 0.9],
    [-0.6, 1],
    [0.6, 1],
    [1.6, 0.9],
  ]) {
    const ex = x + dx * w * 2.2;
    const ey = topY - (topY - ceilY) * lift;
    const segs = 6;
    const px = (t) => x + (ex - x) * t + Math.sin(t * Math.PI) * dx * w * 0.2;
    const py = (t) => topY + (ey - topY) * Math.pow(t, 0.8);
    // 아래쪽 그늘 한 번, 위쪽 밝은 면 한 번. 같은 색으로 이어 그려 마디가 끊겨 보이지 않게
    for (const [color, extra, off] of [["#b3a58e", 0.9, 0.6], [STONE[0], 0, 0]]) {
      g.strokeStyle = color;
      g.lineCap = "round";
      for (let k = 0; k < segs; k++) {
        const t0 = k / segs;
        const t1 = (k + 1) / segs;
        g.lineWidth = Math.max(0.8, w * 0.6 * (1 - t0 * 0.65)) + extra;
        g.beginPath();
        g.moveTo(px(t0) + off, py(t0) + off);
        g.lineTo(px(t1) + off, py(t1) + off);
        g.stroke();
      }
    }
  }
  // 갈라지는 마디: 둥근 옹이
  const knot = g.createRadialGradient(x - w * 0.2, topY - w * 0.2, 0, x, topY, w * 0.7);
  knot.addColorStop(0, "#fbf6ec");
  knot.addColorStop(1, STONE[2]);
  g.fillStyle = knot;
  g.beginPath();
  g.ellipse(x, topY, w * 0.62, w * 0.5, 0, 0, Math.PI * 2);
  g.fill();
  // 바닥 받침
  g.fillStyle = "rgba(90,80,65,0.35)";
  g.beginPath();
  g.ellipse(x, baseY, w * 0.7, w * 0.16, 0, 0, Math.PI * 2);
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
