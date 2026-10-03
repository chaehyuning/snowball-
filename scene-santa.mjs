// 핀란드: 로바니에미 산타마을. 눈 덮인 가문비나무 숲, 통나무집, 북극선, 순록, 흩날리는 눈꽃

import { seeded, fillSilhouette } from "./util.mjs";

const WINDOW = "#ffcf7a";

function paintSanta(g, globe, groundAt) {
  const rnd = seeded(1950);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 북극의 푸른 한낮: 위는 옅은 청회색, 지평선은 거의 흰색
  const sky = g.createLinearGradient(0, top, 0, 260);
  sky.addColorStop(0, "#9db3d4");
  sky.addColorStop(0.55, "#d9e3f0");
  sky.addColorStop(1, "#f6f4f2");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 아주 옅은 오로라
  g.filter = "blur(8px)";
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = `rgba(150,230,210,${0.12 + i * 0.04})`;
    g.lineWidth = 10 - i * 2;
    g.beginPath();
    for (let x = left; x <= right; x += 6) {
      g.lineTo(x, 95 + i * 8 + 14 * Math.sin(x * 0.02 + i));
    }
    g.stroke();
  }
  g.filter = "none";

  // 멀리 눈 덮인 언덕
  const farY = (x) => 238 + 8 * Math.sin(x * 0.02 + 1) + 4 * Math.sin(x * 0.07);
  g.fillStyle = "#e3e9f2";
  fillSilhouette(g, farY, left, right, 400);

  // 뒷줄 가문비나무 숲
  for (let x = left; x < right; x += r(5, 10)) {
    spruce(g, x, farY(x) + r(4, 12), r(14, 26), 0.75);
  }

  // 마을이 있는 눈밭
  const fieldY = (x) => 272 + 4 * Math.sin(x * 0.03);
  const field = g.createLinearGradient(0, 265, 0, 330);
  field.addColorStop(0, "#f7f9fc");
  field.addColorStop(1, "#dbe4ef");
  g.fillStyle = field;
  fillSilhouette(g, fieldY, left, right, 400);

  // 통나무집들과 가운데 산타 집무실
  cabin(g, 110, 282, 40, 22, 20);
  cabin(g, 296, 284, 44, 22, 22);
  santaOffice(g, 200, 278);

  // 굴뚝 연기
  g.filter = "blur(3px)";
  for (const [sx, sy] of [[124, 240], [310, 241]]) {
    for (let i = 0; i < 5; i++) {
      g.fillStyle = `rgba(200,205,215,${0.5 - i * 0.08})`;
      g.beginPath();
      g.arc(sx + i * 3, sy - i * 9, 4 + i * 1.5, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.filter = "none";

  // 북극선: 눈밭을 가로지르는 선과 표지판
  g.strokeStyle = "rgba(60,90,140,0.55)";
  g.lineWidth = 1.2;
  g.setLineDash([5, 3]);
  g.beginPath();
  g.moveTo(left, 300);
  g.quadraticCurveTo(200, 292, right, 300);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = "#5a3a24";
  g.fillRect(253, 276, 2, 22);
  g.fillStyle = "#2e4f7a";
  g.fillRect(234, 271, 40, 10);
  g.fillStyle = "#ffffff";
  g.font = "bold 4.5px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("ARCTIC CIRCLE", 254, 275);
  g.fillText("66°33′07″", 254, 279);

  reindeer(g, 318, 306);

  // 앞쪽 큰 가문비나무
  spruce(g, 32, 330, 90, 1);
  spruce(g, 62, 335, 60, 1);
  spruce(g, 372, 332, 85, 1);

  // 바닥: 깨끗한 눈, 그늘은 푸르게
  const floorTop = groundAt(globe.x);
  const snow = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  snow.addColorStop(0, "#ffffff");
  snow.addColorStop(1, "#d3deec");
  g.fillStyle = snow;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  for (let i = 0; i < 160; i++) {
    const x = r(left, right);
    const y = groundAt(x) + r(4, 45);
    g.fillStyle = `rgba(150,175,210,${r(0.1, 0.3)})`;
    g.beginPath();
    g.ellipse(x, y, r(3, 9), r(0.6, 1.5), 0, 0, Math.PI * 2);
    g.fill();
  }

  g.restore();
}

// 가문비나무: 층층이 쌓인 짙은 초록 가지 위에 눈이 얹힘
function spruce(g, x, baseY, h, alpha) {
  g.globalAlpha = alpha;
  const layers = 5;
  for (let i = 0; i < layers; i++) {
    const y = baseY - (h * i) / layers;
    const w = (h * 0.42 * (layers - i)) / layers;
    g.fillStyle = "#28453a";
    g.beginPath();
    g.moveTo(x - w, y);
    g.lineTo(x, y - h * 0.32);
    g.lineTo(x + w, y);
    g.closePath();
    g.fill();
    g.fillStyle = "#f4f7fb";
    g.beginPath();
    g.moveTo(x - w * 0.8, y - h * 0.05);
    g.lineTo(x, y - h * 0.32);
    g.lineTo(x + w * 0.5, y - h * 0.1);
    g.quadraticCurveTo(x, y - h * 0.14, x - w * 0.8, y - h * 0.05);
    g.fill();
  }
  g.globalAlpha = 1;
}

// 통나무집: 짙은 갈색 통나무 벽, 눈 덮인 지붕, 불 켜진 창
function cabin(g, x, baseY, w, h, roofH) {
  const left = x - w / 2;
  g.fillStyle = "#5c3a28";
  g.fillRect(left, baseY - h, w, h);
  g.strokeStyle = "rgba(30,15,10,0.45)";
  g.lineWidth = 0.6;
  for (let y = baseY - h + 3; y < baseY; y += 3) {
    g.beginPath();
    g.moveTo(left, y);
    g.lineTo(left + w, y);
    g.stroke();
  }
  for (const wx of [left + w * 0.22, left + w * 0.62]) {
    g.fillStyle = WINDOW;
    g.fillRect(wx, baseY - h + 6, w * 0.16, 7);
    g.fillStyle = "#5c3a28";
    g.fillRect(wx + w * 0.075, baseY - h + 6, 0.8, 7);
  }
  // 눈 덮인 지붕
  g.fillStyle = "#3d2a20";
  g.beginPath();
  g.moveTo(left - 4, baseY - h);
  g.lineTo(x, baseY - h - roofH);
  g.lineTo(left + w + 4, baseY - h);
  g.closePath();
  g.fill();
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.moveTo(left - 5, baseY - h + 1);
  g.lineTo(x, baseY - h - roofH - 2);
  g.lineTo(left + w + 5, baseY - h + 1);
  g.lineTo(left + w + 2, baseY - h - 2);
  g.lineTo(x, baseY - h - roofH + 3);
  g.lineTo(left - 2, baseY - h - 2);
  g.closePath();
  g.fill();
  // 굴뚝
  g.fillStyle = "#6b4a36";
  g.fillRect(x + w * 0.2, baseY - h - roofH * 0.9, 4, 10);
  g.fillStyle = "#ffffff";
  g.fillRect(x + w * 0.2 - 0.5, baseY - h - roofH * 0.9 - 1.5, 5, 2);
}

// 산타 집무실: 가운데 뾰족탑이 있는 큰 통나무 건물과 빨간 문
function santaOffice(g, x, baseY) {
  cabin(g, x, baseY, 70, 28, 26);
  // 가운데 탑
  g.fillStyle = "#5c3a28";
  g.fillRect(x - 7, baseY - 62, 14, 14);
  g.fillStyle = WINDOW;
  g.fillRect(x - 3, baseY - 58, 6, 7);
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.moveTo(x - 10, baseY - 62);
  g.lineTo(x, baseY - 84);
  g.lineTo(x + 10, baseY - 62);
  g.closePath();
  g.fill();
  g.strokeStyle = "#3d2a20";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x, baseY - 84);
  g.lineTo(x, baseY - 92);
  g.stroke();
  g.fillStyle = "#e0b040";
  g.beginPath();
  g.arc(x, baseY - 93, 1.8, 0, Math.PI * 2);
  g.fill();
  // 빨간 문과 화환
  g.fillStyle = "#b52a2a";
  g.fillRect(x - 5, baseY - 13, 10, 13);
  g.strokeStyle = "#2f5a3a";
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(x, baseY - 19, 3, 0, Math.PI * 2);
  g.stroke();
}

// 순록 실루엣
function reindeer(g, x, y) {
  g.fillStyle = "#6a4a34";
  g.strokeStyle = "#6a4a34";
  g.beginPath();
  g.ellipse(x, y - 9, 9, 4.5, 0, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 1.4;
  for (const lx of [x - 6, x - 3, x + 4, x + 7]) {
    g.beginPath();
    g.moveTo(lx, y - 7);
    g.lineTo(lx, y);
    g.stroke();
  }
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(x + 7, y - 11);
  g.lineTo(x + 11, y - 17);
  g.stroke();
  g.beginPath();
  g.ellipse(x + 13, y - 17, 3, 2, 0.3, 0, Math.PI * 2);
  g.fill();
  // 뿔
  g.strokeStyle = "#8a6a4c";
  g.lineWidth = 0.8;
  for (const dir of [-1, 1]) {
    g.beginPath();
    g.moveTo(x + 11, y - 19);
    g.lineTo(x + 9 + dir * 2, y - 25);
    g.lineTo(x + 7 + dir * 3, y - 28);
    g.moveTo(x + 9 + dir * 2, y - 25);
    g.lineTo(x + 13 + dir * 2, y - 26);
    g.stroke();
  }
  // 흰 꼬리
  g.fillStyle = "#f4f4f4";
  g.beginPath();
  g.arc(x - 9, y - 10, 1.6, 0, Math.PI * 2);
  g.fill();
}

// 눈꽃 결정: 여섯 갈래 가지. 작은 것은 동그란 눈송이
function drawFlake(ctx, p) {
  const s = p.size;
  ctx.globalAlpha = p.settled ? 0.7 : 0.95;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  if (s < 2.6) {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.lineWidth = 0.7;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const cx = Math.cos(a);
      const cy = Math.sin(a);
      ctx.moveTo(0, 0);
      ctx.lineTo(cx * s, cy * s);
      // 가지 끝 쪽 작은 곁가지
      const bx = cx * s * 0.6;
      const by = cy * s * 0.6;
      for (const side of [-1, 1]) {
        const b = a + side * 0.7;
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(b) * s * 0.3, by + Math.sin(b) * s * 0.3);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

export const santa = {
  id: "finland",
  label: "핀란드 · 산타마을",
  title: "Santa Claus Village",
  paint: paintSanta,
  glare: 0.8,
  base: {
    body: ["#8b96a3", "#dde4ec", "#f7f9fb", "#c4ced9", "#7f8b98"],
    collar: "#aab4c0",
    trim: ["#7a1c1c", "#e25555", "#b52a2a", "#6a1515"],
    plate: "SANTA CLAUS VILLAGE · ROVANIEMI",
    plateFont: "600 10px 'Helvetica Neue', Arial, sans-serif",
    plateInk: "#ffffff",
  },
  // 눈꽃은 가볍고 천천히 돌며 내림
  particles: {
    count: 210,
    blend: "source-over",
    make(rand) {
      const size = rand(1.4, 5);
      return {
        size,
        sink: 0.1 + size * 0.025 + rand(-0.03, 0.03),
        drag: rand(0.09, 0.14),
        inertia: rand(0.3, 0.6),
        grip: rand(0.4, 1.7),
        angle: rand(0, Math.PI),
        spin: rand(-0.02, 0.02),
        flipSpeed: 0,
        flutter: 0,
      };
    },
    draw: drawFlake,
  },
};
