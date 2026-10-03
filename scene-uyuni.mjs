// 볼리비아: 우유니 소금사막. 우기에 얕은 물이 고여 하늘을 그대로 비추는 거울,
// 해 뜰 무렵의 민트·복숭아빛 하늘, 흩날리는 정육면체 소금 결정

import { seeded, fillSilhouette } from "./util.mjs";

// 소금 결정은 투명한데 빛을 받는 면만 은은한 무지갯빛 (민트·복숭아·하늘·라일락)
const PRISM = ["#bff3e4", "#ffd9c2", "#c9e6ff", "#e6dcff", "#fff4cf"];
const HORIZON = 222; // 하늘과 거울이 만나는 지평선

function paintUyuni(g, globe, groundAt) {
  const rnd = seeded(3656);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;
  const bottom = globe.y + globe.r;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 해 뜰 무렵 하늘: 위는 맑은 하늘색, 지평선으로 갈수록 민트를 지나 복숭아빛
  const skyStops = [
    [0, "#5f9fd8"],
    [0.45, "#9fd3e6"],
    [0.75, "#c8eedf"],
    [1, "#ffd6b6"],
  ];
  const sky = g.createLinearGradient(0, top, 0, HORIZON);
  for (const [k, c] of skyStops) sky.addColorStop(k, c);
  g.fillStyle = sky;
  g.fillRect(left, top, size, HORIZON - top);

  // 거울: 하늘을 위아래로 뒤집어 비춤. 물빛이라 조금 더 짙고 푸름
  const mirror = g.createLinearGradient(0, HORIZON, 0, HORIZON + (HORIZON - top));
  for (const [k, c] of skyStops) mirror.addColorStop(1 - k, c);
  g.fillStyle = mirror;
  g.fillRect(left, HORIZON, size, bottom - HORIZON);
  g.fillStyle = "rgba(40,90,120,0.12)";
  g.fillRect(left, HORIZON, size, bottom - HORIZON);

  // 막 떠오르는 해와 거울 속 해
  const sunX = 262;
  for (const [sy, a] of [[HORIZON - 6, 1], [HORIZON + 6, 0.7]]) {
    const halo = g.createRadialGradient(sunX, sy, 0, sunX, sy, 90);
    halo.addColorStop(0, `rgba(255,236,200,${0.85 * a})`);
    halo.addColorStop(0.25, `rgba(255,214,170,${0.35 * a})`);
    halo.addColorStop(1, "rgba(255,214,170,0)");
    g.fillStyle = halo;
    g.fillRect(left, sy - 90, size, 180);
  }
  g.fillStyle = "#fff1da";
  g.beginPath();
  g.arc(sunX, HORIZON, 11, Math.PI, 0);
  g.fill();
  g.globalAlpha = 0.7;
  g.beginPath();
  g.arc(sunX, HORIZON, 11, 0, Math.PI);
  g.fill();
  g.globalAlpha = 1;

  // 뭉게구름: 아래는 평평하고 위로 몽글몽글 부푼 적운. 해(오른쪽 아래) 쪽 면은 복숭아빛으로 물들고
  // 아랫면은 라일락 그늘. 같은 구름을 지평선 기준으로 뒤집어 거울에도 찍음
  const clouds = [
    [96, 116, 1],
    [214, 108, 1.1],
    [322, 132, 0.9],
    [150, 170, 0.62],
    [292, 186, 0.5],
  ];
  // 구름 한 덩이: 둥근 솜뭉치를 돔 모양으로 모아 한 덩어리 실루엣을 만든 뒤(따로 그린 캔버스),
  // 그 실루엣 안에만 위는 희고 아래는 라일락 그늘인 빛을 칠함 → 공이 줄지은 모양이 아니라 한 몸의 구름.
  // 꼭대기 몽글몽글한 부분만 아주 옅게 밝혀 결을 남기고, 가장자리는 살짝 흐리게 풀어 줌
  const cloud = (cx, baseY, s, flip, alpha) => {
    const rc = seeded(Math.round(cx * 13 + baseY));
    const W = 92 * s;
    const H = 36 * s;
    const puffs = [];
    // 바닥 줄: 납작하고 넓게 깔린 솜
    for (let i = 0; i < 9; i++) {
      const t = (i / 8) * 2 - 1;
      puffs.push({ x: (t * W) / 2.5, y: -5 * s, r: (7 + rc() * 4) * s * (1 - Math.abs(t) * 0.4) });
    }
    // 허리: 봉우리 사이 골이 깊게 패지 않도록 중간 높이를 큰 솜으로 메움
    for (let i = 0; i < 6; i++) {
      const t = (i / 5) * 2 - 1;
      puffs.push({ x: (t * W) / 3.2, y: -H * (0.32 + rc() * 0.1), r: (11 + rc() * 4) * s * (1 - Math.abs(t) * 0.35) });
    }
    // 위로 솟은 봉우리: 가운데가 가장 높고, 봉우리 2~3개가 겹침
    const peaks = [[-0.28, 0.75], [0.05, 1], [0.32, 0.7]];
    for (const [px, ph] of peaks) {
      for (let i = 0; i < 8; i++) {
        const k = i / 7;
        puffs.push({
          x: px * W + (rc() - 0.5) * 26 * s * (1 - k * 0.6),
          y: -5 * s - k * H * ph * (0.85 + rc() * 0.25),
          r: (12 - k * 5 + rc() * 3) * s,
        });
      }
    }
    const SC = 2;
    const pad = 30 * s;
    const cw = Math.ceil((W + pad * 2) * SC);
    const ch = Math.ceil((H + pad * 2 + 10 * s) * SC);
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const cg = c.getContext("2d");
    cg.scale(SC, SC);
    cg.translate(W / 2 + pad, H + pad);
    // 실루엣
    cg.fillStyle = "#fff";
    for (const p of puffs) {
      cg.beginPath();
      cg.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      cg.fill();
    }
    // 바닥은 평평하게 자름
    cg.clearRect(-W, 0, W * 2, pad + 10 * s);
    // 실루엣 안에만 빛을 칠함: 위는 흰빛, 아래는 라일락 그늘, 해(오른쪽) 쪽은 복숭아빛
    cg.globalCompositeOperation = "source-atop";
    const shade = cg.createLinearGradient(0, -H - 6 * s, 0, 0);
    shade.addColorStop(0, "#ffffff");
    shade.addColorStop(0.55, "#f7f1f2");
    shade.addColorStop(1, "#c8bfdf");
    cg.fillStyle = shade;
    cg.fillRect(-W, -H - pad, W * 2, H + pad * 2);
    const warm = cg.createLinearGradient(-W / 2, 0, W / 2, 0);
    warm.addColorStop(0, "rgba(255,214,190,0)");
    warm.addColorStop(1, "rgba(255,200,170,0.45)");
    cg.fillStyle = warm;
    cg.fillRect(-W, -H - pad, W * 2, H + pad * 2);
    // 봉우리 윗면마다 아주 옅은 밝은 결
    for (const p of puffs) {
      if (p.y > -H * 0.35) continue;
      const hi = cg.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.4, 0, p.x, p.y, p.r);
      hi.addColorStop(0, "rgba(255,255,255,0.55)");
      hi.addColorStop(1, "rgba(255,255,255,0)");
      cg.fillStyle = hi;
      cg.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    // 바닥 그늘 띠
    const under = cg.createLinearGradient(0, -8 * s, 0, 0);
    under.addColorStop(0, "rgba(170,160,205,0)");
    under.addColorStop(1, "rgba(170,160,205,0.5)");
    cg.fillStyle = under;
    cg.fillRect(-W, -8 * s, W * 2, 8 * s);

    g.save();
    g.globalAlpha = alpha;
    g.filter = `blur(${0.9 * s}px)`;
    g.translate(cx, baseY);
    if (flip < 0) g.scale(1, -1);
    g.drawImage(c, -(W / 2 + pad), -(H + pad), cw / SC, ch / SC);
    g.restore();
  };
  for (const [cx, cy, s] of clouds) {
    cloud(cx, cy, s, 1, 1);
    cloud(cx, 2 * HORIZON - cy, s, -1, 0.7);
  }

  // 먼 산(투누파 화산 쪽): 낮은 라일락빛 능선과 거울 속 능선
  const ridge = [];
  for (let x = left; x <= right; x += 6) {
    const h = 6 + Math.max(0, 14 - Math.abs(x - 96) * 0.22) + Math.sin(x * 0.05) * 2 + Math.sin(x * 0.13) * 1.2;
    ridge.push([x, h]);
  }
  for (const [flip, color] of [[-1, "rgba(150,140,190,0.75)"], [1, "rgba(150,140,190,0.4)"]]) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(left, HORIZON);
    for (const [x, h] of ridge) g.lineTo(x, HORIZON + flip * h);
    g.lineTo(right, HORIZON);
    g.closePath();
    g.fill();
  }
  // 지평선: 아주 가는 밝은 선
  g.fillStyle = "rgba(255,248,236,0.8)";
  g.fillRect(left, HORIZON - 0.4, size, 0.8);

  // 선인장 섬(잉카와시)의 작은 실루엣과 거울 속 그림자
  const island = (flip, a) => {
    g.fillStyle = `rgba(110,100,130,${a})`;
    g.beginPath();
    g.moveTo(312, HORIZON);
    g.quadraticCurveTo(326, HORIZON + flip * 9, 346, HORIZON + flip * 7);
    g.quadraticCurveTo(358, HORIZON + flip * 4, 366, HORIZON);
    g.closePath();
    g.fill();
    for (const [cx, h] of [[322, 7], [331, 10], [339, 8], [350, 6]]) {
      g.fillRect(cx, HORIZON + flip * 5, 1.4, flip * h);
      g.fillRect(cx - 2.2, HORIZON + flip * (5 + h * 0.5), 2.2, flip * 0.9);
      g.fillRect(cx - 2.2, HORIZON + flip * (5 + h * 0.5), 0.9, flip * h * 0.3);
    }
  };
  island(-1, 0.8);
  island(1, 0.45);

  // 소금 껍질 무늬: 땅 위의 벌집(육각) 그물을 원근으로 옮김. 꼭짓점마다 조금씩 흔들어 손으로 그린 듯
  // 불규칙하게. 평면 좌표 (U 가로, D 거리) → 화면 (200 + U·90/D, 지평선 + 90/D)
  const FOCAL = 90;
  const toScreen = (U, D) => [200 + (U * FOCAL) / D, HORIZON + FOCAL / D];
  let HEX = 0.42; // 육각 한 칸 반지름(평면 단위). 바닥 언덕은 더 촘촘하게 바꿔 씀
  const jitter = (i, j) => {
    const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    const k = Math.sin(i * 269.5 + j * 183.3) * 43758.5453;
    return [(h - Math.floor(h) - 0.5) * HEX * 0.5, (k - Math.floor(k) - 0.5) * HEX * 0.5];
  };
  // 육각 칸 (col, row)의 꼭짓점: 이웃 칸과 같은 점을 쓰도록 꼭짓점 좌표로 흔듦
  const hexCorners = (col, row) => {
    const cxU = col * HEX * Math.sqrt(3) + (row % 2) * HEX * (Math.sqrt(3) / 2);
    const cyD = row * HEX * 1.5;
    const pts = [];
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k + Math.PI / 6;
      const u = cxU + HEX * Math.cos(a);
      const d = cyD + HEX * Math.sin(a);
      const [ju, jd] = jitter(Math.round(u * 100), Math.round(d * 100));
      pts.push([u + ju, d + jd]);
    }
    return pts;
  };
  const saltNet = (dNear, dFar, style) => {
    for (let row = Math.floor(dNear / (HEX * 1.5)) - 1; row * HEX * 1.5 < dFar; row++) {
      const dRow = Math.max(dNear, row * HEX * 1.5);
      const halfU = (200 * dRow) / FOCAL + 1;
      const cols = Math.ceil(halfU / (HEX * Math.sqrt(3))) + 1;
      for (let col = -cols; col <= cols; col++) {
        const pts = hexCorners(col, row);
        if (pts.some(([, d]) => d < dNear * 0.98)) continue;
        const screen = pts.map(([u, d]) => toScreen(u, d));
        style(screen, dRow);
      }
    }
  };
  // 거울 앞쪽: 물 밑으로 아주 옅게 비치는 그물
  saltNet(1.25, 5, (pts, d) => {
    const k = Math.max(0, 1 - (d - 1.25) / 3.75);
    g.strokeStyle = `rgba(255,255,255,${0.05 + 0.13 * k})`;
    g.lineWidth = 0.4 + 0.5 * k;
    g.beginPath();
    pts.forEach((pt, i) => (i ? g.lineTo(...pt) : g.moveTo(...pt)));
    g.closePath();
    g.stroke();
  });

  // 바닥: 마른 소금 언덕. 흰 소금 위로 육각 테두리가 낮은 둑처럼 솟음 (밝은 윗선 + 옅은 그늘)
  const floorTop = groundAt(globe.x);
  const salt = g.createLinearGradient(0, floorTop - 10, 0, bottom);
  salt.addColorStop(0, "#fbf8f2");
  salt.addColorStop(1, "#dfe3e8");
  g.fillStyle = salt;
  fillSilhouette(g, groundAt, left, right, bottom);
  g.save();
  g.beginPath();
  for (let x = left; x <= right; x += 4) g.lineTo(x, groundAt(x));
  g.lineTo(right, bottom);
  g.lineTo(left, bottom);
  g.closePath();
  g.clip();
  HEX = 0.15;
  saltNet(0.4, 1.3, (pts, d) => {
    const k = Math.min(1, 0.7 / d);
    g.beginPath();
    pts.forEach((pt, i) => (i ? g.lineTo(...pt) : g.moveTo(...pt)));
    g.closePath();
    g.strokeStyle = "rgba(140,152,175,0.45)";
    g.lineWidth = 1.6 * k;
    g.save();
    g.translate(0, 0.8 * k);
    g.stroke();
    g.restore();
    g.strokeStyle = "rgba(255,255,255,0.95)";
    g.lineWidth = 0.9 * k;
    g.stroke();
  });
  g.restore();
  // 물가: 소금 언덕과 거울이 만나는 가장자리에 고인 물빛
  g.strokeStyle = "rgba(160,215,230,0.7)";
  g.lineWidth = 1.4;
  g.beginPath();
  for (let x = left; x <= right; x += 3) g.lineTo(x, groundAt(x) + 0.5);
  g.stroke();

  g.restore();
}

// 소금 결정: 작은 정육면체. 윗면은 밝고 두 옆면은 서로 다른 파스텔빛, 돌 때마다 모서리가 반짝임
function drawCube(ctx, p, t) {
  const s = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle * 0.3);
  ctx.globalAlpha = p.settled ? 0.8 : 0.95;
  const turn = Math.cos(p.flip);
  const sx = s * (0.7 + 0.3 * Math.abs(turn));
  // 윗면
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.9);
  ctx.lineTo(sx, -s * 0.45);
  ctx.lineTo(0, 0);
  ctx.lineTo(-sx, -s * 0.45);
  ctx.closePath();
  ctx.fill();
  // 왼쪽 옆면
  ctx.fillStyle = turn > 0 ? p.color : p.color2;
  ctx.beginPath();
  ctx.moveTo(-sx, -s * 0.45);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, s * 0.9);
  ctx.lineTo(-sx, s * 0.45);
  ctx.closePath();
  ctx.fill();
  // 오른쪽 옆면
  ctx.fillStyle = turn > 0 ? p.color2 : p.color;
  ctx.beginPath();
  ctx.moveTo(sx, -s * 0.45);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, s * 0.9);
  ctx.lineTo(sx, s * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 0.4;
  ctx.stroke();
  // 빛이 모서리에 닿는 순간 반짝임
  const glint = Math.max(0, Math.sin(t * p.twinkle + p.phase));
  if (!p.settled && glint > 0.9) {
    ctx.globalAlpha = (glint - 0.9) * 10;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-s * 1.4, -s * 0.47, s * 2.8, 0.5);
    ctx.fillRect(-0.25, -s * 1.6, 0.5, s * 2.4);
  }
  ctx.restore();
}

export const uyuni = {
  id: "bolivia",
  label: "볼리비아 · 우유니 소금사막",
  title: "Salar de Uyuni",
  paint: paintUyuni,
  glare: 0.7,
  grade: { saturation: 0.95, tint: 0.08 },
  base: {
    trim: ["#5f9c94", "#f2fff9", "#ffd6b8", "#4e857d"],
    plate: "Salar de Uyuni",
    plateFont: "italic 600 15px Georgia, 'Times New Roman', serif",
    plateInk: "#21403b",
  },
  // 소금 결정은 작고 단단해서 눈보다 조금 빨리 떨어지고, 천천히 굴러 떨어지며 면이 바뀜
  particles: {
    count: 170,
    blend: "source-over",
    make(rand) {
      const size = rand(1.6, 3.4);
      const i = Math.floor(rand(0, PRISM.length));
      return {
        size,
        color: PRISM[i],
        color2: PRISM[(i + 2) % PRISM.length],
        sink: 0.14 + size * 0.03 + rand(-0.02, 0.02),
        drag: rand(0.1, 0.14),
        inertia: rand(0.35, 0.6),
        grip: rand(0.5, 1.6),
        angle: rand(-0.5, 0.5),
        spin: rand(-0.02, 0.02),
        flip: rand(0, Math.PI * 2),
        flipSpeed: rand(0.02, 0.05),
        flutter: 0,
        twinkle: rand(0.003, 0.007),
        phase: rand(0, Math.PI * 2),
      };
    },
    draw: drawCube,
  },
};
