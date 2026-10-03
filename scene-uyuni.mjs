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

  // 뭉게구름: 하늘에 그린 구름을 지평선 기준으로 뒤집어 거울에도 똑같이 찍음
  const clouds = [
    [92, 112, 1],
    [210, 86, 1.25],
    [318, 128, 0.9],
    [150, 168, 0.7],
    [300, 182, 0.55],
  ];
  const puff = (cx, cy, s, flip, alpha) => {
    const rc = seeded(Math.round(cx * 7 + cy));
    for (let i = 0; i < 9; i++) {
      const px = cx + (rc() - 0.5) * 60 * s;
      const py = cy + (rc() - 0.6) * 14 * s * flip;
      const rr = (8 + rc() * 12) * s;
      const shade = g.createRadialGradient(px, py - 4 * s * flip, 0, px, py, rr);
      shade.addColorStop(0, `rgba(255,255,255,${0.95 * alpha})`);
      shade.addColorStop(0.7, `rgba(250,244,240,${0.85 * alpha})`);
      shade.addColorStop(1, `rgba(214,222,236,${0.0})`);
      g.fillStyle = shade;
      g.beginPath();
      g.ellipse(px, py, rr * 1.4, rr, 0, 0, Math.PI * 2);
      g.fill();
    }
  };
  for (const [cx, cy, s] of clouds) {
    // 원근: 지평선에 가까운 구름일수록 작고 납작
    puff(cx, cy, s, 1, 1);
    puff(cx, 2 * HORIZON - cy, s, -1, 0.75);
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

  // 거울 위 아주 얕은 물결: 지평선 가까이는 촘촘하고 가늘게, 앞으로 올수록 성기게
  for (let y = HORIZON + 3; y < 310; ) {
    const near = (y - HORIZON) / 90;
    for (let x = left + r(0, 40); x < right; x += 30 + near * 60 + r(0, 50)) {
      const len = 8 + near * 30 + r(0, 20);
      g.fillStyle = `rgba(255,255,255,${0.12 + near * 0.12})`;
      g.fillRect(x, y, len, 0.5 + near * 0.4);
    }
    y += 2 + near * 9;
  }

  // 물이 얕아진 앞쪽: 소금 껍질의 육각 무늬가 물 밑으로 비쳐 보임 (원근으로 납작하게)
  const hexRow = (y0, rows) => {
    for (let row = 0; row < rows; row++) {
      const y = y0 + row * (4 + row * 2.2);
      const sx = 1 + row * 0.6; // 가까울수록 크게
      const w = 16 * sx;
      const h = 3 + row * 1.4;
      for (let x = left - 20 + (row % 2) * (w / 2); x < right + 20; x += w) {
        g.strokeStyle = `rgba(255,255,255,${0.18 + row * 0.06})`;
        g.lineWidth = 0.5 + row * 0.15;
        g.beginPath();
        g.moveTo(x - w / 2, y);
        g.lineTo(x - w / 4, y - h / 2);
        g.lineTo(x + w / 4, y - h / 2);
        g.lineTo(x + w / 2, y);
        g.lineTo(x + w / 4, y + h / 2);
        g.lineTo(x - w / 4, y + h / 2);
        g.closePath();
        g.stroke();
      }
    }
  };
  hexRow(276, 4);

  // 바닥: 마른 소금 언덕. 흰 소금에 육각 테두리가 도드라짐
  const floorTop = groundAt(globe.x);
  const salt = g.createLinearGradient(0, floorTop - 10, 0, bottom);
  salt.addColorStop(0, "#fbf8f2");
  salt.addColorStop(1, "#d9dfe4");
  g.fillStyle = salt;
  fillSilhouette(g, groundAt, left, right, bottom);
  g.save();
  g.beginPath();
  for (let x = left; x <= right; x += 4) g.lineTo(x, groundAt(x));
  g.lineTo(right, bottom);
  g.lineTo(left, bottom);
  g.closePath();
  g.clip();
  for (let row = 0; row < 7; row++) {
    const y = floorTop + 4 + row * (6 + row * 1.6);
    const w = 22 + row * 6;
    const h = 5 + row * 1.6;
    for (let x = left - 20 + (row % 2) * (w / 2); x < right + 20; x += w) {
      g.strokeStyle = "rgba(170,182,196,0.55)";
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(x - w / 2, y);
      g.lineTo(x - w / 4, y - h / 2);
      g.lineTo(x + w / 4, y - h / 2);
      g.lineTo(x + w / 2, y);
      g.lineTo(x + w / 4, y + h / 2);
      g.lineTo(x - w / 4, y + h / 2);
      g.closePath();
      g.stroke();
      // 육각 테두리 위로 소금이 솟아 밝은 선
      g.strokeStyle = "rgba(255,255,255,0.8)";
      g.lineWidth = 0.6;
      g.beginPath();
      g.moveTo(x - w / 4, y - h / 2 - 0.6);
      g.lineTo(x + w / 4, y - h / 2 - 0.6);
      g.stroke();
    }
  }
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
