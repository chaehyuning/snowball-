// 핀란드: 로바니에미 산타마을. 산타 집무실 본관과 중앙우체국, 북극선과 이정표, 유리 이글루,
// 크리스마스트리, 순록 썰매, 오로라, 흩날리는 눈꽃

import { seeded, fillSilhouette } from "./util.mjs";

const WINDOW = "#ffcf7a";

let aurora = null;
const AURORA_H = 200; // 유리구 위쪽에서 이 높이까지만 그림

// 오로라 커튼: 물결치는 띠에서 아래로 빛줄기가 내려오고, 위 가장자리는 분홍빛
function paintAurora(left, top, size, rnd) {
  const scale = 2;
  const c = document.createElement("canvas");
  c.width = size * scale;
  c.height = AURORA_H * scale;
  const g = c.getContext("2d");
  g.scale(scale, scale);
  g.translate(-left, -top);
  g.globalCompositeOperation = "lighter";
  g.filter = "blur(2px)";

  const ribbons = [
    { base: 92, amp: 16, freq: 0.018, phase: 0.4, len: 60, color: [80, 255, 170] },
    { base: 118, amp: 12, freq: 0.024, phase: 2.1, len: 46, color: [60, 230, 210] },
    { base: 74, amp: 10, freq: 0.03, phase: 4.0, len: 34, color: [150, 255, 160] },
  ];
  for (const rb of ribbons) {
    for (let x = left; x <= left + size; x += 1.5) {
      const y = rb.base + rb.amp * Math.sin(x * rb.freq + rb.phase) + 4 * Math.sin(x * 0.11 + rb.phase);
      const fade = Math.sin(((x - left) / size) * Math.PI); // 가장자리로 갈수록 옅게
      const len = rb.len * (0.6 + rnd() * 0.6);
      const [cr, cg, cb] = rb.color;
      const ray = g.createLinearGradient(0, y - 8, 0, y + len);
      ray.addColorStop(0, "rgba(255,120,200,0)");
      ray.addColorStop(0.12, `rgba(255,120,200,${0.25 * fade})`);
      ray.addColorStop(0.3, `rgba(${cr},${cg},${cb},${0.55 * fade})`);
      ray.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      g.strokeStyle = ray;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(x, y - 8);
      g.lineTo(x, y + len);
      g.stroke();
    }
  }
  return c;
}

// 오로라가 천천히 밝아졌다 어두워지며 옆으로 일렁임
function animateSanta(ctx, t, globe) {
  if (!aurora) return;
  const left = globe.x - globe.r;
  const top = globe.y - globe.r;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 0.0009);
  ctx.drawImage(aurora, left + 6 * Math.sin(t * 0.0004), top, globe.r * 2, AURORA_H);
  ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 0.0013 + 1);
  ctx.drawImage(aurora, left - 8 * Math.sin(t * 0.0006), top + 4, globe.r * 2, AURORA_H);

  // 크리스마스트리와 줄전구가 하나씩 다른 박자로 반짝임
  for (const l of lights) {
    const on = 0.5 + 0.5 * Math.sin(t * 0.004 + l.phase);
    ctx.globalAlpha = 0.35 + 0.65 * on;
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 0.9 + on * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.25 * on;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

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

  // 북극의 해 질 녘: 위는 짙은 남보라, 지평선은 눈빛을 받아 밝음
  const sky = g.createLinearGradient(0, top, 0, 260);
  sky.addColorStop(0, "#1c2550");
  sky.addColorStop(0.45, "#3d4f86");
  sky.addColorStop(0.8, "#a9b8d6");
  sky.addColorStop(1, "#eef1f6");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 별
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(255,255,255,${r(0.3, 0.9)})`;
    g.beginPath();
    g.arc(r(left, right), r(top, 170), r(0.3, 1), 0, Math.PI * 2);
    g.fill();
  }

  // 오로라는 따로 그려 두고 animate에서 일렁이게 함
  aurora = paintAurora(left, top, size, rnd);

  // 멀리 눈 덮인 언덕
  const farY = (x) => 238 + 8 * Math.sin(x * 0.02 + 1) + 4 * Math.sin(x * 0.07);
  g.fillStyle = "#e3e9f2";
  fillSilhouette(g, farY, left, right, 400);

  // 뒷줄 가문비나무 숲
  for (let x = left; x < right; x += r(5, 10)) {
    spruce(g, x, farY(x) + r(4, 12), r(14, 26), 0.75);
  }

  // 숲과 마을 사이에 낀 옅은 눈안개: 뒤 숲이 멀어 보이게
  const haze = g.createLinearGradient(0, 240, 0, 278);
  haze.addColorStop(0, "rgba(236,241,248,0)");
  haze.addColorStop(1, "rgba(236,241,248,0.75)");
  g.fillStyle = haze;
  g.fillRect(left, 240, size, 40);

  // 마을이 있는 눈밭
  const fieldY = (x) => 272 + 4 * Math.sin(x * 0.03);
  const field = g.createLinearGradient(0, 265, 0, 330);
  field.addColorStop(0, "#f7f9fc");
  field.addColorStop(1, "#dbe4ef");
  g.fillStyle = field;
  fillSilhouette(g, fieldY, left, right, 400);
  // 눈 언덕의 부드러운 굴곡: 밝은 등성이와 푸른 골
  const rd = seeded(66);
  g.save();
  g.filter = "blur(6px)";
  for (let i = 0; i < 14; i++) {
    const dx = left + rd() * size;
    const dy = 280 + rd() * 45;
    g.fillStyle = i % 2 ? "rgba(255,255,255,0.7)" : "rgba(150,172,210,0.28)";
    g.beginPath();
    g.ellipse(dx, dy, 22 + rd() * 30, 3 + rd() * 4, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // 물체들이 눈 위에 드리우는 푸른 그림자. 오로라와 하늘빛이 뒤에서 비추므로 앞쪽 오른편으로 늘어짐
  g.save();
  g.filter = "blur(2.5px)";
  g.fillStyle = "rgba(85,110,165,0.34)";
  const shadow = (x0, x1, y, len) => {
    g.beginPath();
    g.moveTo(x0, y);
    g.lineTo(x1, y);
    g.lineTo(x1 + len * 0.6, y + len * 0.45);
    g.lineTo(x0 + len * 0.6, y + len * 0.45);
    g.closePath();
    g.fill();
  };
  shadow(81, 123, 282, 18); // 우체국
  shadow(165, 235, 278, 22); // 집무실
  shadow(140, 160, 296, 14); // 트리
  shadow(277, 305, 290, 12); // 이글루
  shadow(311, 335, 294, 10);
  shadow(252, 256, 298, 16); // 이정표 기둥
  shadow(288, 342, 312, 14); // 썰매와 순록
  g.restore();

  lights = [];

  // 앞에서 본관 문까지 좁아지며 이어지는 눈길과 썰매 자국 (원근감)
  const path = g.createLinearGradient(0, 278, 0, 330);
  path.addColorStop(0, "#e6ecf4");
  path.addColorStop(1, "#cbd7e6");
  g.fillStyle = path;
  g.beginPath();
  g.moveTo(194, 278);
  g.lineTo(206, 278);
  g.lineTo(262, 330);
  g.lineTo(138, 330);
  g.closePath();
  g.fill();
  // 썰매 자국: 앞쪽일수록 진하고 굵음. 살짝 휘어짐
  for (const k of [-0.35, -0.25, 0.25, 0.35]) {
    for (let seg = 0; seg < 6; seg++) {
      const t0 = seg / 6;
      const t1 = (seg + 1) / 6;
      const px = (t) => 200 + k * (12 + 112 * t) + Math.sin(t * 3) * 2;
      g.strokeStyle = `rgba(110,135,180,${0.2 + t1 * 0.4})`;
      g.lineWidth = 0.4 + t1 * 0.9;
      g.beginPath();
      g.moveTo(px(t0), 279 + 51 * t0);
      g.lineTo(px(t1), 279 + 51 * t1);
      g.stroke();
    }
  }
  // 길 양옆으로 치워 쌓은 눈둑: 밝은 등과 바깥쪽 푸른 그늘
  for (const side of [-1, 1]) {
    for (let seg = 0; seg < 8; seg++) {
      const t0 = seg / 8;
      const t1 = (seg + 1) / 8;
      const ex = (t) => 200 + side * (6 + 56 * t + 2);
      const ey = (t) => 278 + 52 * t;
      g.strokeStyle = "rgba(120,145,190,0.35)";
      g.lineWidth = 1 + t1 * 2.5;
      g.beginPath();
      g.moveTo(ex(t0) + side * 1.2, ey(t0) + 0.6);
      g.lineTo(ex(t1) + side * 1.2, ey(t1) + 0.6);
      g.stroke();
      g.strokeStyle = "#ffffff";
      g.lineWidth = 0.8 + t1 * 2;
      g.beginPath();
      g.moveTo(ex(t0), ey(t0));
      g.lineTo(ex(t1), ey(t1));
      g.stroke();
    }
  }

  // 왼쪽: 산타클로스 중앙우체국과 빨간 우체통
  cabin(g, 102, 282, 42, 22, 20);
  sign(g, 102, 256, 22, 6, "#b52a2a", "POST", 4.5);
  mailbox(g, 130, 296);

  // 가운데: 산타 집무실 본관 ("SANTA IS HERE" 탑)과 지붕 줄전구
  santaOffice(g, 200, 278);
  stringLights(165, 250, 235, 250, 8);

  // 크리스마스트리
  xmasTree(g, 150, 296, 34);

  // 굴뚝 연기
  g.filter = "blur(3px)";
  for (const [sx, sy] of [[116, 240], [214, 236]]) {
    for (let i = 0; i < 5; i++) {
      g.fillStyle = `rgba(200,205,215,${0.5 - i * 0.08})`;
      g.beginPath();
      g.arc(sx + i * 3, sy - i * 9, 4 + i * 1.5, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.filter = "none";

  // 오른쪽: 유리 이글루
  igloo(g, 290, 290, 15);
  igloo(g, 322, 294, 13);

  // 북극선: 눈밭에 칠한 흰 선 (눈 위에서 보이도록 옅은 그림자를 깔아 둠)
  g.strokeStyle = "rgba(90,120,170,0.45)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(left, 301);
  g.quadraticCurveTo(200, 293, right, 301);
  g.stroke();
  g.strokeStyle = "#ffffff";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(left, 300);
  g.quadraticCurveTo(200, 292, right, 300);
  g.stroke();

  // 북극선 이정표: 나뭇결이 보이는 기둥에 두께가 있는 화살표 판, 판마다 위에 눈이 얹힘
  const pole = g.createLinearGradient(252, 0, 256, 0);
  pole.addColorStop(0, "#7a5236");
  pole.addColorStop(0.5, "#5a3a24");
  pole.addColorStop(1, "#3a2416");
  g.fillStyle = pole;
  g.fillRect(252.5, 258, 3, 40);
  g.fillStyle = "rgba(30,15,8,0.35)";
  for (let gy = 262; gy < 296; gy += 5) g.fillRect(253.2, gy, 0.4, 2.5);
  const arrows = [
    [267, -1, "#2e4f7a"],
    [273.5, 1, "#b52a2a"],
    [280, -1, "#2f6b4a"],
    [286.5, 1, "#c9952a"],
  ];
  const board = (ay, dir, color) => {
    const len = 17;
    const path = () => {
      g.beginPath();
      g.moveTo(254, ay - 2.4);
      g.lineTo(254 + dir * (len - 3), ay - 2.4);
      g.lineTo(254 + dir * len, ay);
      g.lineTo(254 + dir * (len - 3), ay + 2.4);
      g.lineTo(254, ay + 2.4);
      g.closePath();
    };
    // 판 두께(아래쪽 어두운 옆면)
    g.save();
    g.translate(0, 0.9);
    g.fillStyle = "rgba(20,15,10,0.55)";
    path();
    g.fill();
    g.restore();
    g.fillStyle = color;
    path();
    g.fill();
    // 위는 밝고 아래는 어두운 나무판
    const shade = g.createLinearGradient(0, ay - 2.4, 0, ay + 2.4);
    shade.addColorStop(0, "rgba(255,255,255,0.22)");
    shade.addColorStop(1, "rgba(0,0,0,0.22)");
    g.fillStyle = shade;
    path();
    g.fill();
    // 글씨 자리: 작은 흰 획 (도시 이름과 거리)
    g.fillStyle = "rgba(255,255,255,0.75)";
    const x0 = dir > 0 ? 256.5 : 254 - (len - 3.5);
    for (let k = 0; k < 4; k++) g.fillRect(x0 + k * 2.6, ay - 0.6, 1.8 - (k % 2) * 0.6, 1.1);
    // 판 위 눈
    g.fillStyle = "#f6f9fd";
    g.beginPath();
    g.moveTo(254, ay - 2.4);
    g.quadraticCurveTo(254 + dir * len * 0.4, ay - 4, 254 + dir * (len - 4), ay - 2.6);
    g.lineTo(254, ay - 2.2);
    g.closePath();
    g.fill();
  };
  for (const [ay, dir, color] of arrows) board(ay, dir, color);
  // 위쪽 표지판: 테두리, 그늘, 눈
  g.fillStyle = "rgba(20,15,10,0.5)";
  g.fillRect(238, 254, 34, 9.2);
  g.fillStyle = "#2e4f7a";
  g.fillRect(238, 253, 34, 9);
  const plate = g.createLinearGradient(0, 253, 0, 262);
  plate.addColorStop(0, "rgba(255,255,255,0.2)");
  plate.addColorStop(1, "rgba(0,0,0,0.2)");
  g.fillStyle = plate;
  g.fillRect(238, 253, 34, 9);
  g.strokeStyle = "rgba(240,230,210,0.8)";
  g.lineWidth = 0.4;
  g.strokeRect(238.8, 253.8, 32.4, 7.4);
  g.fillStyle = "#ffffff";
  g.font = "bold 4px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("ARCTIC CIRCLE", 255, 256);
  g.fillText("66°33′07″", 255, 260);
  g.fillStyle = "#f6f9fd";
  g.beginPath();
  g.moveTo(237.5, 253);
  g.quadraticCurveTo(255, 250.5, 272.5, 253);
  g.lineTo(272.5, 253.6);
  g.lineTo(237.5, 253.6);
  g.closePath();
  g.fill();

  // 가로등 아래 눈에 번진 불빛
  g.save();
  g.globalCompositeOperation = "lighter";
  for (const k of [0.25, 0.55, 0.9]) {
    const y = 278 + 52 * k;
    const half = 6 + 56 * k;
    const sc = 0.35 + 0.65 * k;
    for (const side of [-1, 1]) {
      const lx = 200 + side * (half + 6 * sc);
      const pool = g.createRadialGradient(lx, y, 0, lx, y, 14 * sc);
      pool.addColorStop(0, "rgba(255,200,130,0.35)");
      pool.addColorStop(1, "rgba(255,200,130,0)");
      g.fillStyle = pool;
      g.save();
      g.translate(lx, y);
      g.scale(1, 0.35);
      g.translate(-lx, -y);
      g.fillRect(lx - 14 * sc, y - 14 * sc, 28 * sc, 28 * sc);
      g.restore();
    }
  }
  g.restore();

  // 길가 가로등: 멀수록 작게
  for (const k of [0.25, 0.55, 0.9]) {
    const y = 278 + 52 * k;
    const half = 6 + 56 * k;
    const sc = 0.35 + 0.65 * k;
    for (const side of [-1, 1]) streetLamp(g, 200 + side * (half + 6 * sc), y, sc);
  }

  // 순록이 끄는 빨간 썰매
  sleigh(g, 300, 312);
  reindeer(g, 330, 312);

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
  // 가지 끝이 들쭉날쭉한 층. 같은 나무는 늘 같은 모양이 되도록 위치로 정한 물결을 씀
  const jag = (k) => Math.sin(x * 1.7 + k * 2.3) * 0.5 + Math.sin(x * 0.6 + k * 5.1) * 0.5;
  const layers = 5;
  // 줄기
  g.fillStyle = "#3a2a22";
  g.fillRect(x - h * 0.02, baseY - h * 0.12, h * 0.04, h * 0.12);
  for (let i = 0; i < layers; i++) {
    const y = baseY - h * 0.08 - (h * i) / layers;
    const w = (h * 0.42 * (layers - i)) / layers;
    const tip = y - h * 0.32;
    // 가지 층: 아래 가장자리를 톱니처럼 늘어진 잔가지로
    function tier() {
      g.beginPath();
      g.moveTo(x, tip);
      const n = 7;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const ex = x + w * (t * 2 - 1);
        const droop = (1 - Math.abs(t * 2 - 1)) * h * 0.035;
        g.lineTo(ex, y + droop + jag(i * 10 + k) * h * 0.015);
        if (k < n) g.lineTo(ex + w / n, y - h * 0.03 + droop * 0.6);
      }
      g.closePath();
    }
    const needles = g.createLinearGradient(x - w, 0, x + w, 0);
    needles.addColorStop(0, "#1f3a30");
    needles.addColorStop(0.55, "#2e5244");
    needles.addColorStop(1, "#1a3028");
    g.fillStyle = needles;
    tier();
    g.fill();
    // 층 아래쪽 그늘
    g.fillStyle = "rgba(10,25,20,0.35)";
    g.beginPath();
    g.moveTo(x - w * 0.9, y);
    g.lineTo(x, y - h * 0.08);
    g.lineTo(x + w * 0.9, y);
    g.closePath();
    g.fill();
    // 가지 위에 얹힌 눈: 덩어리마다 크기가 다르고, 아랫면은 푸르스름한 그늘
    for (let k = 0; k < 4; k++) {
      const t = (k + 0.5) / 4;
      const cx = x + w * (t * 2 - 1) * 0.75;
      const cy = tip + (y - tip) * (0.35 + Math.abs(t * 2 - 1) * 0.5);
      const rw = w * (0.18 + 0.06 * jag(i * 7 + k));
      g.fillStyle = "#c9d6ea";
      g.beginPath();
      g.ellipse(cx, cy + 0.6, rw, rw * 0.38, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#f6f9fd";
      g.beginPath();
      g.ellipse(cx - rw * 0.08, cy, rw * 0.9, rw * 0.3, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  // 꼭대기 눈
  g.fillStyle = "#f6f9fd";
  g.beginPath();
  g.ellipse(x, baseY - h * 0.08 - h * ((layers - 1) / layers) - h * 0.3, h * 0.03, h * 0.025, 0, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
}

// 통나무집 옆면과 옆 지붕: 오른쪽 뒤로 물러나며 비스듬히 올라가 집이 입체로 보임.
// 옆면은 정면보다 어둡고, 통나무 줄이 같은 기울기로 뒤로 모임
function cabinSide(g, apexX, R, baseY, h, roofH, d) {
  const k = d * 0.35;
  const wall = g.createLinearGradient(R, 0, R + d, 0);
  wall.addColorStop(0, "#4a2e20");
  wall.addColorStop(1, "#2e1c14");
  g.fillStyle = wall;
  g.beginPath();
  g.moveTo(R, baseY);
  g.lineTo(R + d, baseY - k);
  g.lineTo(R + d, baseY - h - k);
  g.lineTo(R, baseY - h);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(15,8,5,0.55)";
  g.lineWidth = 0.5;
  for (let y = baseY - h + 3; y < baseY; y += 3) {
    g.beginPath();
    g.moveTo(R, y);
    g.lineTo(R + d, y - k);
    g.stroke();
  }
  // 옆면 창: 비스듬히 줄어든 사다리꼴, 안쪽 불빛
  const wx0 = R + d * 0.3;
  const wx1 = R + d * 0.62;
  const wy = baseY - h * 0.62;
  g.fillStyle = WINDOW;
  g.globalAlpha = 0.85;
  g.beginPath();
  g.moveTo(wx0, wy - (wx0 - R) * (k / d));
  g.lineTo(wx1, wy - (wx1 - R) * (k / d));
  g.lineTo(wx1, wy + 6 - (wx1 - R) * (k / d));
  g.lineTo(wx0, wy + 6 - (wx0 - R) * (k / d));
  g.closePath();
  g.fill();
  g.globalAlpha = 1;
  // 옆 지붕: 두껍게 쌓인 눈. 처마 쪽으로 갈수록 푸른 그늘
  const eaveX = R + 4;
  const eaveY = baseY - h;
  const apexY = baseY - h - roofH;
  g.fillStyle = "#3d2a20";
  g.beginPath();
  g.moveTo(eaveX, eaveY + 1);
  g.lineTo(eaveX + d, eaveY + 1 - k);
  g.lineTo(apexX + d, apexY - k);
  g.lineTo(apexX, apexY);
  g.closePath();
  g.fill();
  const snow = g.createLinearGradient(apexX, apexY, eaveX, eaveY);
  snow.addColorStop(0, "#ffffff");
  snow.addColorStop(0.75, "#e8eef8");
  snow.addColorStop(1, "#bccbe2");
  g.fillStyle = snow;
  g.beginPath();
  g.moveTo(eaveX + 1, eaveY - 1.5);
  g.lineTo(eaveX + 1 + d, eaveY - 1.5 - k);
  g.lineTo(apexX + d, apexY - 2.5 - k);
  g.lineTo(apexX, apexY - 2.5);
  g.closePath();
  g.fill();
  // 처마 끝으로 둥글게 처진 눈
  g.strokeStyle = "#f4f7fc";
  g.lineWidth = 2.2;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(eaveX + 1, eaveY - 0.5);
  g.lineTo(eaveX + 1 + d, eaveY - 0.5 - k);
  g.stroke();
  g.strokeStyle = "rgba(120,145,190,0.45)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(eaveX + 1, eaveY + 0.9);
  g.lineTo(eaveX + 1 + d, eaveY + 0.9 - k);
  g.stroke();
}

// 통나무집: 둥근 통나무를 쌓은 벽(위는 밝고 아래 이음매는 그늘), 모서리로 삐져나온 통나무 끝,
// 따뜻한 불빛이 새는 창, 두껍게 쌓인 지붕 눈과 고드름
function cabin(g, x, baseY, w, h, roofH) {
  const left = x - w / 2;
  const logH = 3;
  cabinSide(g, x, left + w, baseY, h, roofH, w * 0.32);
  for (let y = baseY - h, i = 0; y < baseY; y += logH, i++) {
    const log = g.createLinearGradient(0, y, 0, y + logH);
    log.addColorStop(0, "#7a5038");
    log.addColorStop(0.45, "#5c3a28");
    log.addColorStop(1, "#3a2318");
    g.fillStyle = log;
    g.fillRect(left, y, w, logH);
    // 모서리로 삐져나온 통나무 끝: 엇갈려 쌓여 한 줄씩 번갈아 보임
    if (i % 2 === 0) {
      for (const ex of [left - 1.4, left + w + 1.4]) {
        g.fillStyle = "#8a6244";
        g.beginPath();
        g.ellipse(ex, y + logH / 2, 1.5, logH / 2, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "rgba(60,35,20,0.6)";
        g.beginPath();
        g.ellipse(ex, y + logH / 2, 0.6, 0.6, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  // 처마 밑 그늘
  const eave = g.createLinearGradient(0, baseY - h, 0, baseY - h + 5);
  eave.addColorStop(0, "rgba(20,10,5,0.5)");
  eave.addColorStop(1, "rgba(20,10,5,0)");
  g.fillStyle = eave;
  g.fillRect(left, baseY - h, w, 5);
  for (const wx of [left + w * 0.22, left + w * 0.62]) {
    const ww = w * 0.16;
    const wy = baseY - h + 6;
    // 창에서 새어 나온 빛
    const spill = g.createRadialGradient(wx + ww / 2, wy + 4, 0, wx + ww / 2, wy + 4, 12);
    spill.addColorStop(0, "rgba(255,200,120,0.35)");
    spill.addColorStop(1, "rgba(255,200,120,0)");
    g.fillStyle = spill;
    g.fillRect(wx - 10, wy - 8, ww + 20, 26);
    g.fillStyle = "#3a2318";
    g.fillRect(wx - 0.8, wy - 0.8, ww + 1.6, 8.6);
    const glass = g.createLinearGradient(0, wy, 0, wy + 7);
    glass.addColorStop(0, "#ffe2a8");
    glass.addColorStop(1, WINDOW);
    g.fillStyle = glass;
    g.fillRect(wx, wy, ww, 7);
    g.fillStyle = "#3a2318";
    g.fillRect(wx + ww / 2 - 0.4, wy, 0.8, 7);
    g.fillRect(wx, wy + 3.2, ww, 0.6);
    // 창턱에 쌓인 눈
    g.fillStyle = "#f4f7fb";
    g.beginPath();
    g.ellipse(wx + ww / 2, wy + 7.6, ww / 2 + 1.2, 1, 0, Math.PI, 0);
    g.fill();
  }
  // 지붕: 어두운 처마 판 위로 눈이 두껍게 쌓이고, 끝은 둥글게 처지며 아랫면은 푸른 그늘
  g.fillStyle = "#3d2a20";
  g.beginPath();
  g.moveTo(left - 4, baseY - h);
  g.lineTo(x, baseY - h - roofH);
  g.lineTo(left + w + 4, baseY - h);
  g.closePath();
  g.fill();
  const snowRoof = () => {
    g.beginPath();
    g.moveTo(left - 6, baseY - h + 1.5);
    g.quadraticCurveTo(left - 7, baseY - h - 1.5, left - 4, baseY - h - 2.5);
    g.lineTo(x, baseY - h - roofH - 2.5);
    g.lineTo(left + w + 4, baseY - h - 2.5);
    g.quadraticCurveTo(left + w + 7, baseY - h - 1.5, left + w + 6, baseY - h + 1.5);
    g.quadraticCurveTo(left + w + 2, baseY - h + 0.5, x, baseY - h + 1);
    g.quadraticCurveTo(left - 2, baseY - h + 0.5, left - 6, baseY - h + 1.5);
    g.closePath();
  };
  g.fillStyle = "#c6d3e8";
  g.save();
  g.translate(0, 1.2);
  snowRoof();
  g.fill();
  g.restore();
  const snowTop = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  snowTop.addColorStop(0, "#ffffff");
  snowTop.addColorStop(1, "#e4ecf7");
  g.fillStyle = snowTop;
  snowRoof();
  g.fill();
  // 처마 끝 고드름: 길이가 제각각
  g.fillStyle = "rgba(225,240,255,0.85)";
  for (let k = 0; k < 9; k++) {
    const ix = left - 3 + ((w + 6) * (k + 0.5)) / 9;
    const len = 1.5 + ((k * 37) % 5) * 0.6;
    g.beginPath();
    g.moveTo(ix - 0.6, baseY - h + 1.2);
    g.lineTo(ix + 0.6, baseY - h + 1.2);
    g.lineTo(ix, baseY - h + 1.2 + len);
    g.closePath();
    g.fill();
  }
  // 굴뚝
  const chim = g.createLinearGradient(x + w * 0.2, 0, x + w * 0.2 + 4, 0);
  chim.addColorStop(0, "#7d5a44");
  chim.addColorStop(1, "#523726");
  g.fillStyle = chim;
  g.fillRect(x + w * 0.2, baseY - h - roofH * 0.9, 4, 10);
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.ellipse(x + w * 0.2 + 2, baseY - h - roofH * 0.9 - 0.5, 3, 1.2, 0, 0, Math.PI * 2);
  g.fill();
}

// 산타 집무실: 가운데 뾰족탑이 있는 큰 통나무 건물과 빨간 문
function santaOffice(g, x, baseY) {
  cabin(g, x, baseY, 70, 28, 26);
  // 가운데 탑: 정면과 오른쪽 옆면, 뾰족 지붕도 옆면이 보임
  g.fillStyle = "#3a2418";
  g.beginPath();
  g.moveTo(x + 7, baseY - 48);
  g.lineTo(x + 12, baseY - 50);
  g.lineTo(x + 12, baseY - 64);
  g.lineTo(x + 7, baseY - 62);
  g.closePath();
  g.fill();
  g.fillStyle = "#c9d6ea";
  g.beginPath();
  g.moveTo(x + 10, baseY - 62);
  g.lineTo(x + 15, baseY - 64);
  g.lineTo(x + 1.5, baseY - 85);
  g.lineTo(x, baseY - 84);
  g.closePath();
  g.fill();
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
  // 탑의 "SANTA IS HERE" 표시
  sign(g, x, baseY - 46, 30, 6, "#b52a2a", "SANTA IS HERE", 3.6);
  // 현관: 문 앞으로 퍼지는 불빛 → 나무 문틀 → 아치형 두 짝 문(세로 널판, 쇠띠) → 문 위 화환
  const spill = g.createRadialGradient(x, baseY, 0, x, baseY, 18);
  spill.addColorStop(0, "rgba(255,200,130,0.45)");
  spill.addColorStop(1, "rgba(255,200,130,0)");
  g.fillStyle = spill;
  g.fillRect(x - 18, baseY - 6, 36, 12);
  const doorPath = (inset) => {
    g.beginPath();
    g.moveTo(x - 6 + inset, baseY);
    g.lineTo(x - 6 + inset, baseY - 11);
    g.quadraticCurveTo(x, baseY - 17 + inset * 1.4, x + 6 - inset, baseY - 11);
    g.lineTo(x + 6 - inset, baseY);
    g.closePath();
  };
  g.fillStyle = "#3a2318";
  doorPath(-0.9);
  g.fill();
  const door = g.createLinearGradient(x - 6, 0, x + 6, 0);
  door.addColorStop(0, "#c8392f");
  door.addColorStop(0.5, "#a82a22");
  door.addColorStop(1, "#7e1d18");
  g.fillStyle = door;
  doorPath(0);
  g.fill();
  g.save();
  doorPath(0);
  g.clip();
  g.fillStyle = "rgba(60,10,8,0.35)";
  for (let px = x - 6; px < x + 6; px += 2) g.fillRect(px, baseY - 17, 0.35, 17);
  g.fillStyle = "rgba(40,10,5,0.6)";
  g.fillRect(x - 0.4, baseY - 17, 0.8, 17);
  g.fillStyle = "#2a2220";
  g.fillRect(x - 6, baseY - 9.5, 12, 0.7);
  g.fillRect(x - 6, baseY - 3.5, 12, 0.7);
  const shadeTop = g.createLinearGradient(0, baseY - 17, 0, baseY - 9);
  shadeTop.addColorStop(0, "rgba(20,5,5,0.45)");
  shadeTop.addColorStop(1, "rgba(20,5,5,0)");
  g.fillStyle = shadeTop;
  g.fillRect(x - 6, baseY - 17, 12, 8);
  g.restore();
  g.fillStyle = "#e0b040";
  g.beginPath();
  g.arc(x - 1.4, baseY - 6, 0.5, 0, Math.PI * 2);
  g.arc(x + 1.4, baseY - 6, 0.5, 0, Math.PI * 2);
  g.fill();
  // 문 앞 눈 밟힌 디딤돌
  g.fillStyle = "#c9d3e2";
  g.fillRect(x - 8, baseY - 0.6, 16, 1.4);
  // 화환: 짙은 잎 위에 밝은 잎, 빨간 열매와 리본
  const wy = baseY - 20.5;
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2;
    g.fillStyle = k % 3 ? "#2f5a3a" : "#4a7a52";
    g.beginPath();
    g.arc(x + Math.cos(a) * 2.6, wy + Math.sin(a) * 2.6, 1.1, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#d8322a";
  for (const a of [0.6, 2.2, 3.9, 5.2]) {
    g.beginPath();
    g.arc(x + Math.cos(a) * 2.6, wy + Math.sin(a) * 2.6, 0.5, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.moveTo(x, wy + 2.6);
  g.lineTo(x - 1.6, wy + 4.6);
  g.lineTo(x - 0.6, wy + 4.8);
  g.lineTo(x, wy + 3.2);
  g.lineTo(x + 0.6, wy + 4.8);
  g.lineTo(x + 1.6, wy + 4.6);
  g.closePath();
  g.fill();
}

// 위치를 저장해 두었다가 animate에서 반짝이게 하는 전구들
let lights = [];
const BULBS = ["#ff5a5a", "#ffd34a", "#6ad16a", "#5ab8ff", "#ffffff"];

function stringLights(x0, y0, x1, y1, sag) {
  for (let i = 0; i <= 10; i++) {
    const k = i / 10;
    lights.push({
      x: x0 + (x1 - x0) * k,
      y: y0 + (y1 - y0) * k + sag * 4 * k * (1 - k),
      color: BULBS[i % BULBS.length],
      phase: i * 1.3,
    });
  }
}

// 간판: 가운데 (x, y), 폭 w, 높이 h
function sign(g, x, y, w, h, color, text, fontSize) {
  g.fillStyle = color;
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.fillStyle = "#ffffff";
  g.font = `bold ${fontSize}px sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, x, y + 0.3);
}

// 눈 덮인 갓이 달린 가로등. sc는 원근에 따른 크기
function streetLamp(g, x, baseY, sc) {
  const h = 34 * sc;
  g.fillStyle = "#2a2f3a";
  g.fillRect(x - 0.8 * sc, baseY - h, 1.6 * sc, h);
  const glow = g.createRadialGradient(x, baseY - h, 0, x, baseY - h, 10 * sc);
  glow.addColorStop(0, "rgba(255,214,140,0.85)");
  glow.addColorStop(1, "rgba(255,214,140,0)");
  g.fillStyle = glow;
  g.fillRect(x - 10 * sc, baseY - h - 10 * sc, 20 * sc, 20 * sc);
  g.fillStyle = "#ffe0a0";
  g.beginPath();
  g.arc(x, baseY - h, 2.2 * sc, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.ellipse(x, baseY - h - 2.4 * sc, 3.2 * sc, 1.4 * sc, 0, Math.PI, 0);
  g.fill();
}

// 편지를 넣는 빨간 우체통
function mailbox(g, x, y) {
  g.fillStyle = "#3a2a20";
  g.fillRect(x - 0.8, y - 10, 1.6, 10);
  g.fillStyle = "#d42a2a";
  g.beginPath();
  g.roundRect(x - 5, y - 18, 10, 9, 2);
  g.fill();
  g.fillStyle = "#3a1010";
  g.fillRect(x - 3, y - 15.5, 6, 1);
  g.fillStyle = "#ffffff";
  g.fillRect(x - 5, y - 18.5, 10, 1.4);
}

// 장식 전구와 별이 달린 크리스마스트리
function xmasTree(g, x, baseY, h) {
  spruce(g, x, baseY, h, 1);
  const rnd = seeded(25);
  for (let i = 0; i < 16; i++) {
    const k = 0.15 + rnd() * 0.8;
    const half = h * 0.42 * (1 - k) * 0.85;
    lights.push({
      x: x + (rnd() * 2 - 1) * half,
      y: baseY - h * k * 0.95 + 2,
      color: BULBS[i % BULBS.length],
      phase: rnd() * 6.28,
    });
  }
  g.fillStyle = "#ffd34a";
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? 1.6 : 3.8;
    g.lineTo(x + Math.cos(a) * rr, baseY - h * 1.0 - 2 + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

// 유리 이글루: 눈 위에 놓인 유리 돔, 안에서 따뜻한 불빛
function igloo(g, x, baseY, r) {
  const glow = g.createRadialGradient(x, baseY - r * 0.4, 0, x, baseY - r * 0.4, r * 1.6);
  glow.addColorStop(0, "rgba(255,210,140,0.55)");
  glow.addColorStop(1, "rgba(255,210,140,0)");
  g.fillStyle = glow;
  g.fillRect(x - r * 2, baseY - r * 2.2, r * 4, r * 3);
  const dome = g.createLinearGradient(x - r, baseY - r, x + r, baseY);
  dome.addColorStop(0, "rgba(200,225,255,0.85)");
  dome.addColorStop(1, "rgba(80,110,160,0.85)");
  g.fillStyle = dome;
  g.beginPath();
  g.arc(x, baseY, r, Math.PI, 0);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(255,200,120,0.75)";
  g.beginPath();
  g.arc(x, baseY, r * 0.55, Math.PI, 0);
  g.closePath();
  g.fill();
  // 유리 창살
  g.strokeStyle = "rgba(255,255,255,0.6)";
  g.lineWidth = 0.5;
  for (const a of [0.25, 0.5, 0.75]) {
    g.beginPath();
    g.moveTo(x, baseY - r);
    g.quadraticCurveTo(x + (a - 0.5) * r * 2.4, baseY - r * 0.5, x + (a - 0.5) * r * 2, baseY);
    g.stroke();
  }
  g.beginPath();
  g.arc(x, baseY, r * 0.62, Math.PI, 0);
  g.stroke();
  // 눈 덮인 위쪽
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(x, baseY, r, Math.PI * 1.25, Math.PI * 1.75);
  g.lineTo(x, baseY - r * 0.75);
  g.closePath();
  g.fill();
}

// 금빛 활주부가 말려 올라간 빨간 썰매
function sleigh(g, x, y) {
  g.strokeStyle = "#e0b040";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(x - 12, y);
  g.lineTo(x + 10, y);
  g.quadraticCurveTo(x + 16, y, x + 14, y - 5);
  g.stroke();
  g.beginPath();
  g.moveTo(x - 6, y);
  g.lineTo(x - 6, y - 3);
  g.moveTo(x + 6, y);
  g.lineTo(x + 6, y - 3);
  g.stroke();
  g.fillStyle = "#c22626";
  g.beginPath();
  g.moveTo(x - 13, y - 3);
  g.lineTo(x + 9, y - 3);
  g.quadraticCurveTo(x + 11, y - 8, x + 7, y - 10);
  g.lineTo(x - 9, y - 10);
  g.quadraticCurveTo(x - 14, y - 14, x - 13, y - 3);
  g.closePath();
  g.fill();
  g.strokeStyle = "#e0b040";
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(x - 10, y - 6);
  g.lineTo(x + 8, y - 6);
  g.stroke();
  // 선물 꾸러미
  g.fillStyle = "#2f6b4a";
  g.fillRect(x - 8, y - 15, 6, 5);
  g.fillStyle = "#e0b040";
  g.fillRect(x - 5.4, y - 15, 0.8, 5);
  // 썰매와 순록을 잇는 끈
  g.strokeStyle = "#5a3a24";
  g.lineWidth = 0.6;
  g.beginPath();
  g.moveTo(x + 9, y - 6);
  g.lineTo(x + 22, y - 9);
  g.stroke();
}

// 순록 실루엣
function reindeer(g, x, y) {
  // 옆에서 본 순록: 어깨가 높고 엉덩이 쪽으로 낮아지는 등, 깊은 가슴, 가는 다리와 큰 발굽,
  // 목 아래 흰 갈기, 긴 주둥이, 뒤로 휘며 가지를 친 큰 뿔
  const legs = [
    // [허벅지 x, 앞다리?, 먼 쪽?]
    [x - 6.5, false, true],
    [x + 5.5, true, true],
    [x - 8, false, false],
    [x + 7, true, false],
  ];
  for (const [lx, front, far] of legs) {
    g.fillStyle = far ? "#4a382c" : "#5e4636";
    g.beginPath();
    if (front) {
      g.moveTo(lx - 1.5, y - 9);
      g.lineTo(lx + 1.5, y - 9);
      g.lineTo(lx + 0.8, y - 4);
      g.lineTo(lx + 0.6, y - 1);
      g.lineTo(lx - 0.4, y - 1);
      g.lineTo(lx - 0.6, y - 4);
    } else {
      // 뒷다리: 허벅지가 굵고 뒤꿈치(비절)가 뒤로 꺾임
      g.moveTo(lx - 2, y - 10);
      g.quadraticCurveTo(lx + 2.5, y - 9, lx + 1.2, y - 5);
      g.lineTo(lx + 0.4, y - 1);
      g.lineTo(lx - 0.6, y - 1);
      g.lineTo(lx - 0.4, y - 5);
      g.quadraticCurveTo(lx - 2.4, y - 6, lx - 2, y - 10);
    }
    g.closePath();
    g.fill();
    // 넓은 발굽
    g.fillStyle = "#2a201a";
    g.beginPath();
    g.ellipse(lx + 0.1, y - 0.5, 1.1, 0.6, 0, 0, Math.PI * 2);
    g.fill();
  }
  // 몸통
  const body = () => {
    g.beginPath();
    g.moveTo(x - 10, y - 9);
    g.quadraticCurveTo(x - 11.5, y - 13, x - 8.5, y - 14);
    g.quadraticCurveTo(x - 1, y - 15, x + 5, y - 16.5);
    g.quadraticCurveTo(x + 8.5, y - 17, x + 9, y - 14);
    g.quadraticCurveTo(x + 9.5, y - 9, x + 7, y - 8);
    g.quadraticCurveTo(x - 1, y - 7.5, x - 10, y - 9);
    g.closePath();
  };
  const coat = g.createLinearGradient(0, y - 17, 0, y - 7);
  coat.addColorStop(0, "#8a6e58");
  coat.addColorStop(0.6, "#6a5040");
  coat.addColorStop(1, "#c9b8a2");
  g.fillStyle = coat;
  body();
  g.fill();
  // 목과 머리
  g.fillStyle = "#6a5040";
  g.beginPath();
  g.moveTo(x + 5, y - 16);
  g.quadraticCurveTo(x + 9, y - 21, x + 12, y - 22.5);
  g.lineTo(x + 16.5, y - 21);
  g.quadraticCurveTo(x + 17.5, y - 20, x + 16.2, y - 19.3);
  g.lineTo(x + 13, y - 19.5);
  g.quadraticCurveTo(x + 11, y - 16, x + 9, y - 12);
  g.closePath();
  g.fill();
  // 목 아래 흰 갈기
  g.fillStyle = "#ece6da";
  g.beginPath();
  g.moveTo(x + 9, y - 12.5);
  g.quadraticCurveTo(x + 11.5, y - 15, x + 12.4, y - 19);
  g.quadraticCurveTo(x + 10.5, y - 14.5, x + 10.5, y - 11.5);
  g.closePath();
  g.fill();
  // 귀, 눈, 코
  g.fillStyle = "#5a4232";
  g.beginPath();
  g.ellipse(x + 11.2, y - 23, 1.6, 0.6, -0.6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#1e1612";
  g.beginPath();
  g.arc(x + 13.6, y - 21.6, 0.45, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#3a2a22";
  g.beginPath();
  g.arc(x + 16.6, y - 20.2, 0.6, 0, Math.PI * 2);
  g.fill();
  // 뿔: 머리에서 뒤로 크게 휘는 줄기, 앞쪽 눈가지와 끝가지. 밑동이 굵고 끝으로 가늘어짐
  const antler = (dx, alpha) => {
    g.globalAlpha = alpha;
    g.strokeStyle = "#a88a68";
    g.lineCap = "round";
    const beam = [
      [x + 12.5 + dx, y - 23.5],
      [x + 10 + dx, y - 30],
      [x + 13 + dx, y - 35.5],
      [x + 17 + dx, y - 36],
    ];
    for (let k = 0; k < 3; k++) {
      g.lineWidth = 1.3 - k * 0.35;
      g.beginPath();
      g.moveTo(beam[k][0], beam[k][1]);
      g.lineTo(beam[k + 1][0], beam[k + 1][1]);
      g.stroke();
    }
    g.lineWidth = 0.55;
    g.beginPath();
    g.moveTo(x + 11.6 + dx, y - 26);
    g.quadraticCurveTo(x + 14 + dx, y - 26.5, x + 15 + dx, y - 25);
    g.moveTo(x + 10.6 + dx, y - 31);
    g.lineTo(x + 8 + dx, y - 33);
    g.moveTo(x + 13 + dx, y - 35.5);
    g.lineTo(x + 12.5 + dx, y - 38.5);
    g.moveTo(x + 15 + dx, y - 35.8);
    g.lineTo(x + 16 + dx, y - 38.8);
    g.stroke();
    g.globalAlpha = 1;
  };
  antler(-1.6, 0.6);
  antler(0, 1);
  // 등에 비친 달빛과 짧은 흰 꼬리
  g.save();
  body();
  g.clip();
  g.strokeStyle = "rgba(230,235,255,0.45)";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x - 9, y - 14);
  g.quadraticCurveTo(x - 1, y - 15, x + 5, y - 16.5);
  g.stroke();
  g.restore();
  g.fillStyle = "#f4f2ec";
  g.beginPath();
  g.ellipse(x - 10.6, y - 12.5, 1.1, 1.6, 0.3, 0, Math.PI * 2);
  g.fill();
}

// 눈꽃 결정: 여섯 갈래 가지. 작은 것은 동그란 눈송이
// 가지 모양은 크기별로 한 번만 그려 두고(스프라이트) 매 프레임엔 돌려 붙이기만 함
const FLAKE_RES = 4;
const flakeSprites = new Map();
function flakeSprite(s) {
  const key = Math.round(s * 4) / 4;
  let sprite = flakeSprites.get(key);
  if (sprite) return sprite;
  const half = key + 1;
  sprite = document.createElement("canvas");
  sprite.width = sprite.height = Math.ceil(half * 2 * FLAKE_RES);
  const g = sprite.getContext("2d");
  g.scale(FLAKE_RES, FLAKE_RES);
  g.translate(half, half);
  g.strokeStyle = "#ffffff";
  g.lineWidth = 0.7;
  g.lineCap = "round";
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    g.moveTo(0, 0);
    g.lineTo(cx * key, cy * key);
    // 가지 끝 쪽 작은 곁가지
    const bx = cx * key * 0.6;
    const by = cy * key * 0.6;
    for (const side of [-1, 1]) {
      const b = a + side * 0.7;
      g.moveTo(bx, by);
      g.lineTo(bx + Math.cos(b) * key * 0.3, by + Math.sin(b) * key * 0.3);
    }
  }
  g.stroke();
  sprite.half = half;
  flakeSprites.set(key, sprite);
  return sprite;
}

function drawFlake(ctx, p) {
  const s = p.size;
  ctx.globalAlpha = p.settled ? 0.7 : 0.95;
  if (s < 2.6) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, s * 0.55, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const sprite = flakeSprite(s);
  const k = s / (sprite.half - 1);
  const h = sprite.half * k;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.drawImage(sprite, -h, -h, h * 2, h * 2);
  ctx.restore();
}

export const santa = {
  id: "finland",
  label: "핀란드 · 산타클로스 마을",
  title: "Santa Claus Village",
  paint: paintSanta,
  animate: animateSanta,
  glare: 0.6,
  base: {
    trim: ["#7a1c1c", "#e25555", "#b52a2a", "#6a1515"],
    plate: "Joulupukin Pajakylä",
    plateFont: "600 13px 'Helvetica Neue', Arial, sans-serif",
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
