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

  // 마을이 있는 눈밭
  const fieldY = (x) => 272 + 4 * Math.sin(x * 0.03);
  const field = g.createLinearGradient(0, 265, 0, 330);
  field.addColorStop(0, "#f7f9fc");
  field.addColorStop(1, "#dbe4ef");
  g.fillStyle = field;
  fillSilhouette(g, fieldY, left, right, 400);

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
  g.strokeStyle = "rgba(120,145,185,0.55)";
  g.lineWidth = 0.8;
  for (const k of [-0.35, -0.25, 0.25, 0.35]) {
    g.beginPath();
    g.moveTo(200 + k * 12, 279);
    g.lineTo(200 + k * 124, 330);
    g.stroke();
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

  // 북극선 이정표: 세계 도시 방향을 가리키는 화살표 판
  g.fillStyle = "#5a3a24";
  g.fillRect(253, 262, 2, 36);
  const arrows = [
    [266, -1, "#2e4f7a"],
    [272, 1, "#b52a2a"],
    [278, -1, "#2f6b4a"],
    [284, 1, "#c9952a"],
  ];
  for (const [ay, dir, color] of arrows) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(254, ay - 2.5);
    g.lineTo(254 + dir * 14, ay - 2.5);
    g.lineTo(254 + dir * 17, ay);
    g.lineTo(254 + dir * 14, ay + 2.5);
    g.lineTo(254, ay + 2.5);
    g.closePath();
    g.fill();
  }
  g.fillStyle = "#2e4f7a";
  g.fillRect(238, 253, 34, 9);
  g.fillStyle = "#ffffff";
  g.font = "bold 4px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("ARCTIC CIRCLE", 255, 256);
  g.fillText("66°33′07″", 255, 260);

  // 길가 가로등: 멀수록 작게
  for (const k of [0.25, 0.55, 0.9]) {
    const y = 278 + 52 * k;
    const half = 6 + 56 * k;
    const sc = 0.35 + 0.65 * k;
    for (const side of [-1, 1]) streetLamp(g, 200 + side * (half + 6 * sc), y, sc);
  }

  snowman(g, 228, 304);

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

// 통나무집: 둥근 통나무를 쌓은 벽(위는 밝고 아래 이음매는 그늘), 모서리로 삐져나온 통나무 끝,
// 따뜻한 불빛이 새는 창, 두껍게 쌓인 지붕 눈과 고드름
function cabin(g, x, baseY, w, h, roofH) {
  const left = x - w / 2;
  const logH = 3;
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
  // 탑의 "SANTA IS HERE" 표시
  sign(g, x, baseY - 46, 30, 6, "#b52a2a", "SANTA IS HERE", 3.6);
  // 빨간 문과 화환
  g.fillStyle = "#b52a2a";
  g.fillRect(x - 5, baseY - 13, 10, 13);
  g.strokeStyle = "#2f5a3a";
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(x, baseY - 19, 3, 0, Math.PI * 2);
  g.stroke();
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

function snowman(g, x, baseY) {
  g.fillStyle = "#ffffff";
  for (const [dy, rr] of [[-5, 5.5], [-13.5, 4], [-20, 3]]) {
    g.beginPath();
    g.arc(x, baseY + dy, rr, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "rgba(150,170,200,0.4)";
  g.beginPath();
  g.arc(x + 1.5, baseY - 5, 5.5, -0.6, 1.4);
  g.fill();
  g.fillStyle = "#b52a2a";
  g.fillRect(x - 3.5, baseY - 17.5, 7, 1.6);
  g.fillStyle = "#222";
  g.fillRect(x - 3, baseY - 26, 6, 3.5);
  g.fillRect(x - 4.2, baseY - 23, 8.4, 1);
  g.fillStyle = "#f08a24";
  g.beginPath();
  g.moveTo(x + 0.5, baseY - 20.5);
  g.lineTo(x + 4, baseY - 20);
  g.lineTo(x + 0.5, baseY - 19.5);
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
