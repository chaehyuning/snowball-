// 한국: 밤의 남산서울타워와 반짝이는 불빛

import { seeded, fillSilhouette } from "./util.mjs";

const SPARKLE_COLORS = ["#ffd27a", "#fff3c4", "#ffffff", "#ffb3d1", "#9fd0ff"];
const WINDOW_COLORS = ["#ffd98a", "#ffe9b8", "#fff6e0", "#cfe3ff"];

// paint에서 정해지고 animate에서 쓰는 위치
let antenna = { x: 200, y: 60 };
let twinkleStars = [];

function paintNamsan(g, globe, groundAt) {
  const rnd = seeded(1988);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 밤하늘: 위는 짙은 남색, 도시 불빛이 비치는 지평선은 보랏빛
  const sky = g.createLinearGradient(0, top, 0, 320);
  sky.addColorStop(0, "#070b24");
  sky.addColorStop(0.45, "#141b4a");
  sky.addColorStop(0.78, "#352f6c");
  sky.addColorStop(1, "#734a7c");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 별. 위로 갈수록 또렷함
  for (let i = 0; i < 120; i++) {
    const x = r(left, right);
    const y = r(top, 250);
    g.globalAlpha = r(0.2, 0.9) * (1 - (y - top) / 260);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(x, y, r(0.3, 1.1), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  twinkleStars = Array.from({ length: 18 }, () => ({
    x: r(left + 30, right - 30),
    y: r(top + 25, 200),
    phase: r(0, Math.PI * 2),
    speed: r(0.0015, 0.004),
  }));

  // 달
  const moonX = 118;
  const moonY = 110;
  const moonGlow = g.createRadialGradient(moonX, moonY, 0, moonX, moonY, 55);
  moonGlow.addColorStop(0, "rgba(255,244,214,0.35)");
  moonGlow.addColorStop(1, "rgba(255,244,214,0)");
  g.fillStyle = moonGlow;
  g.fillRect(moonX - 60, moonY - 60, 120, 120);
  g.fillStyle = "#fff4d6";
  g.beginPath();
  g.arc(moonX, moonY, 11, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(200,190,160,0.25)";
  for (const [dx, dy, cr] of [[-3, -2, 2.5], [3, 3, 1.8], [2, -4, 1.2]]) {
    g.beginPath();
    g.arc(moonX + dx, moonY + dy, cr, 0, Math.PI * 2);
    g.fill();
  }

  // 지평선에 번진 도시 불빛
  const cityGlow = g.createLinearGradient(0, 240, 0, 320);
  cityGlow.addColorStop(0, "rgba(255,160,120,0)");
  cityGlow.addColorStop(1, "rgba(255,160,120,0.3)");
  g.fillStyle = cityGlow;
  g.fillRect(left, 240, size, 90);

  // 먼 산줄기
  const farY = (x) => 262 + 10 * Math.sin(x * 0.02 + 1) + 5 * Math.sin(x * 0.06);
  g.fillStyle = "#1d1f4b";
  fillSilhouette(g, farY, left, right, 400);

  // 남산 양옆으로 보이는 서울 시내: 아파트·빌딩 숲과 오른쪽 멀리 롯데월드타워
  paintSkyline(g, r, rnd, left, right);

  // 남산: 숲 덮인 둥근 언덕
  const hillY = (x) => 238 + 0.0032 * (x - 200) ** 2 + 3 * Math.sin(x * 0.08);
  const hill = g.createLinearGradient(0, 235, 0, 320);
  hill.addColorStop(0, "#1b2d42");
  hill.addColorStop(1, "#0c1522");
  g.fillStyle = hill;
  fillSilhouette(g, hillY, left, right, 400);
  for (let i = 0; i < 300; i++) {
    const x = r(left, right);
    const y = r(hillY(x) + 2, 330);
    g.globalAlpha = 0.8;
    g.fillStyle = ["#16283a", "#1f3447", "#0f1c2b"][Math.floor(rnd() * 3)];
    g.beginPath();
    g.arc(x, y, r(1.5, 3.5), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // 남산 산책로 가로등
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 30; i++) {
    const x = r(125, 275);
    const y = hillY(x) + r(5, 32);
    const lamp = g.createRadialGradient(x, y, 0, x, y, 2.5);
    lamp.addColorStop(0, "rgba(255,214,140,0.75)");
    lamp.addColorStop(1, "rgba(255,214,140,0)");
    g.fillStyle = lamp;
    g.fillRect(x - 3, y - 3, 6, 6);
  }
  g.globalCompositeOperation = "source-over";

  // 능선을 따라 둥근 나무 꼭대기가 겹겹이: 매끈한 곡선 대신 숲의 울퉁불퉁한 윤곽
  for (let x = left; x < right; x += r(3, 6)) {
    const y = hillY(x) + r(0, 3);
    const rr = r(3, 6.5);
    g.fillStyle = ["#1b2e44", "#213a52", "#172638"][Math.floor(rnd() * 3)];
    g.beginPath();
    g.arc(x, y, rr, Math.PI, 0);
    g.fill();
    // 달빛이 닿는 왼쪽 위 테두리
    g.strokeStyle = "rgba(170,190,255,0.18)";
    g.lineWidth = 0.7;
    g.beginPath();
    g.arc(x, y, rr, Math.PI * 1.05, Math.PI * 1.5);
    g.stroke();
  }

  // 산을 감아 오르는 산책로: 가로등이 점선처럼 이어짐
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let t = 0; t <= 1; t += 0.05) {
    const x = 128 + t * 150 + Math.sin(t * 9) * 10;
    const y = hillY(x) + 30 - t * 22 + Math.cos(t * 9) * 4;
    const lampG = g.createRadialGradient(x, y, 0, x, y, 2.2);
    lampG.addColorStop(0, "rgba(255,226,160,0.75)");
    lampG.addColorStop(1, "rgba(255,226,160,0)");
    g.fillStyle = lampG;
    g.fillRect(x - 3, y - 3, 6, 6);
  }
  g.restore();

  // 남산 케이블카: 아래 정류장에서 타워 쪽으로 이어진 줄과 불 켜진 곤돌라
  const cableA = [96, 296];
  const cableB = [176, hillY(176) + 4];
  g.strokeStyle = "rgba(200,210,235,0.55)";
  g.lineWidth = 0.6;
  for (const off of [0, 2.2]) {
    g.beginPath();
    g.moveTo(cableA[0], cableA[1] + off);
    g.quadraticCurveTo((cableA[0] + cableB[0]) / 2, (cableA[1] + cableB[1]) / 2 + 6 + off, cableB[0], cableB[1] + off);
    g.stroke();
  }
  const gondola = (t) => {
    const x = cableA[0] + (cableB[0] - cableA[0]) * t;
    const y = cableA[1] + (cableB[1] - cableA[1]) * t + Math.sin(t * Math.PI) * 6 * 0.5;
    g.strokeStyle = "rgba(200,210,235,0.7)";
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y + 3);
    g.stroke();
    g.fillStyle = "#c94b4b";
    g.beginPath();
    g.roundRect(x - 4, y + 3, 8, 6, 1.5);
    g.fill();
    g.fillStyle = "#ffe2a0";
    g.fillRect(x - 3, y + 4.2, 6, 2.2);
  };
  gondola(0.3);
  gondola(0.72);

  paintTower(g, 200, hillY(200) + 2);

  paintCity(g, r, rnd, left, right);

  // 왼쪽 앞 팔각정과 맨 앞 사랑의 자물쇠 울타리 (가까워서 크고 또렷함)
  pavilion(g, 92, 302);
  loveLocks(g, rnd, left, right);

  // 바닥: 불빛이 비치는 광장
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#23284a");
  floor.addColorStop(1, "#0b0e1f");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 120; i++) {
    const x = r(left, right);
    const y = groundAt(x) + r(2, 45);
    g.globalAlpha = r(0.08, 0.3);
    g.fillStyle = WINDOW_COLORS[Math.floor(rnd() * WINDOW_COLORS.length)];
    g.beginPath();
    g.ellipse(x, y, r(1, 3), r(0.4, 1), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";

  g.restore();
}

// 남산서울타워: 받침 건물 → 원통 기둥 → 전망대 → 안테나
function paintTower(g, x, baseY) {
  // 타워를 감싸는 푸른 조명
  g.save();
  g.globalCompositeOperation = "lighter";
  const glow = g.createRadialGradient(x, baseY - 95, 0, x, baseY - 95, 95);
  glow.addColorStop(0, "rgba(120,150,255,0.35)");
  glow.addColorStop(1, "rgba(120,150,255,0)");
  g.fillStyle = glow;
  g.fillRect(x - 100, baseY - 200, 200, 210);
  g.restore();

  // 받침 건물
  g.fillStyle = "#cfd6e6";
  g.fillRect(x - 14, baseY - 14, 28, 14);
  g.fillStyle = "#ffd98a";
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 6; col++) {
      g.fillRect(x - 12 + col * 4.2, baseY - 12 + row * 6, 2.6, 3);
    }
  }

  // 원통 기둥. 가운데가 밝아 둥글게 보임
  const shaftBottom = baseY - 14;
  const shaftTop = baseY - 86;
  const shaft = g.createLinearGradient(x - 5, 0, x + 5, 0);
  shaft.addColorStop(0, "#7f93bd");
  shaft.addColorStop(0.45, "#f4f7ff");
  shaft.addColorStop(1, "#8ea2c9");
  g.fillStyle = shaft;
  g.beginPath();
  g.moveTo(x - 5, shaftBottom);
  g.lineTo(x - 3.5, shaftTop);
  g.lineTo(x + 3.5, shaftTop);
  g.lineTo(x + 5, shaftBottom);
  g.closePath();
  g.fill();

  // 기둥을 두른 조명 띠와 이음매
  for (let k = 1; k < 6; k++) {
    const yy = shaftBottom - (shaftBottom - shaftTop) * (k / 6);
    g.fillStyle = "rgba(90,110,160,0.35)";
    g.fillRect(x - 4.6 + k * 0.25, yy, 9.2 - k * 0.5, 0.6);
  }
  g.save();
  g.globalCompositeOperation = "lighter";
  for (const k of [0.25, 0.55]) {
    const yy = shaftBottom - (shaftBottom - shaftTop) * k;
    const led = g.createLinearGradient(x - 6, 0, x + 6, 0);
    led.addColorStop(0, "rgba(140,170,255,0)");
    led.addColorStop(0.5, "rgba(170,200,255,0.9)");
    led.addColorStop(1, "rgba(140,170,255,0)");
    g.fillStyle = led;
    g.fillRect(x - 6, yy - 0.8, 12, 1.6);
  }
  g.restore();

  // 전망대: 아래부터 [폭, 높이, 불 켜진 창 여부]
  let y = shaftTop;
  const decks = [
    [30, 5, false],
    [28, 7, true],
    [32, 4, false],
    [24, 6, true],
    [26, 3, false],
    [14, 4, false],
  ];
  for (const [w, h, lit] of decks) {
    y -= h;
    // 원반 아래쪽 그늘: 둥근 바닥면이 살짝 보임
    g.fillStyle = "rgba(40,50,90,0.55)";
    g.beginPath();
    g.ellipse(x, y + h, w / 2, 1.6, 0, 0, Math.PI);
    g.fill();
    if (lit) {
      const band = g.createLinearGradient(0, y, 0, y + h);
      band.addColorStop(0, "#ffe9b8");
      band.addColorStop(1, "#ffc56a");
      g.fillStyle = band;
      g.fillRect(x - w / 2, y, w, h);
      // 창틀: 가운데는 넓고 가장자리로 갈수록 촘촘 (둥근 원통이라)
      g.fillStyle = "rgba(60,40,70,0.45)";
      for (let k = -6; k <= 6; k++) {
        const a = (k / 6) * (Math.PI / 2);
        g.fillRect(x + Math.sin(a) * (w / 2 - 0.5) - 0.3, y, 0.6, h);
      }
      // 창 안 사람 그림자 대신 위쪽 밝은 띠
      g.fillStyle = "rgba(255,255,240,0.5)";
      g.fillRect(x - w / 2, y, w, 0.8);
    } else {
      const ring = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      ring.addColorStop(0, "#9aa8c6");
      ring.addColorStop(0.45, "#f1f4fb");
      ring.addColorStop(1, "#a3b0cc");
      g.fillStyle = ring;
      g.fillRect(x - w / 2, y, w, h);
      // 둥근 테 윗면
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.beginPath();
      g.ellipse(x, y, w / 2, 1.2, 0, Math.PI, 0);
      g.fill();
    }
  }

  // 흰색·빨간색이 번갈아 칠해진 안테나
  const segments = [
    [3.6, 26, "#f1f1f1"],
    [2.6, 18, "#e04b4b"],
    [2.0, 14, "#f1f1f1"],
    [1.2, 10, "#e04b4b"],
  ];
  for (const [w, h, color] of segments) {
    y -= h;
    g.fillStyle = color;
    g.fillRect(x - w / 2, y, w, h);
  }
  antenna = { x, y };
}

// 도시: 가운데는 낮고 가장자리로 갈수록 높은 빌딩, 창문마다 불빛
function paintCity(g, r, rnd, left, right) {
  const ground = 335;
  for (let x = left; x < right; ) {
    const w = r(7, 20);
    const edge = Math.abs(x + w / 2 - 200) / 170;
    const h = r(10, 25) + edge * r(20, 55);
    const top = ground - h;
    g.fillStyle = ["#0f1530", "#141b3a", "#19214a"][Math.floor(rnd() * 3)];
    g.fillRect(x, top, w - 1, h + 20);
    // 지붕 가장자리에 비친 빛
    g.fillStyle = "rgba(170,180,255,0.15)";
    g.fillRect(x, top, w - 1, 1);

    for (let wy = top + 3; wy < ground; wy += 4) {
      for (let wx = x + 2; wx < x + w - 3; wx += 3) {
        if (rnd() < 0.38) {
          g.globalAlpha = r(0.5, 1);
          g.fillStyle = WINDOW_COLORS[Math.floor(rnd() * WINDOW_COLORS.length)];
          g.fillRect(wx, wy, 1.4, 1.8);
        }
      }
    }
    g.globalAlpha = 1;
    x += w;
  }
}

// 남산 양옆 서울 시내: 앞줄 아파트(가로 창 줄), 뒷줄 빌딩, 오른쪽 멀리 롯데월드타워(끝이 가늘어지는 탑, 꼭대기 불빛)
function paintSkyline(g, r, rnd, left, right) {
  const base = 300;
  for (const [layer, color, hmin, hmax] of [
    [0, "#1a1f48", 18, 46],
    [1, "#12173a", 10, 30],
  ]) {
    for (let x = left; x < right; ) {
      const w = r(9, 18);
      const center = Math.abs(x + w / 2 - 200);
      if (center < 70 && layer === 1) {
        x += w;
        continue;
      }
      const h = r(hmin, hmax) * (0.6 + Math.min(1, center / 150) * 0.6);
      const top = base - h - (layer ? 0 : 6);
      g.fillStyle = color;
      g.fillRect(x, top, w - 1.5, h + 40);
      // 옥상 붉은 항공 장애등
      if (rnd() < 0.25) {
        g.fillStyle = "#ff6a6a";
        g.fillRect(x + w / 2 - 1, top - 1.2, 1.4, 1.2);
      }
      for (let wy = top + 3; wy < base; wy += 3.4) {
        if (rnd() < 0.55) continue;
        g.fillStyle = WINDOW_COLORS[Math.floor(rnd() * WINDOW_COLORS.length)];
        g.globalAlpha = layer ? 0.75 : 0.45;
        g.fillRect(x + 1.5, wy, w - 4.5, 1);
      }
      g.globalAlpha = 1;
      x += w;
    }
  }
  // 롯데월드타워: 오른쪽 멀리, 위로 갈수록 가늘어지는 매끈한 탑
  const lx = 330;
  const lb = 296;
  const lt = 196;
  const lotte = g.createLinearGradient(lx - 7, 0, lx + 7, 0);
  lotte.addColorStop(0, "#28305e");
  lotte.addColorStop(0.5, "#4a5590");
  lotte.addColorStop(1, "#202752");
  g.fillStyle = lotte;
  g.beginPath();
  g.moveTo(lx - 8, lb);
  g.quadraticCurveTo(lx - 6, lt + 30, lx - 1, lt);
  g.lineTo(lx + 1, lt);
  g.quadraticCurveTo(lx + 6, lt + 30, lx + 8, lb);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(255,230,170,0.35)";
  for (let y = lt + 8; y < lb; y += 5) g.fillRect(lx - 5 + (lb - y) * 0.0, y, 10 - (lb - y) * 0.06, 0.6);
  g.save();
  g.globalCompositeOperation = "lighter";
  const tip = g.createRadialGradient(lx, lt + 6, 0, lx, lt + 6, 8);
  tip.addColorStop(0, "rgba(255,240,200,0.55)");
  tip.addColorStop(1, "rgba(255,240,200,0)");
  g.fillStyle = tip;
  g.fillRect(lx - 12, lt - 6, 24, 24);
  g.restore();
}

// 팔각정: 붉은 기둥, 단청 띠, 끝이 들린 기와지붕, 처마 밑 초롱
function pavilion(g, x, baseY) {
  // 기단
  g.fillStyle = "#6b6a78";
  g.fillRect(x - 30, baseY - 5, 60, 5);
  // 기둥
  for (const dx of [-24, -12, 0, 12, 24]) {
    g.fillStyle = "#9a2a22";
    g.fillRect(x + dx - 1.6, baseY - 30, 3.2, 25);
  }
  // 난간
  g.strokeStyle = "#7a2a22";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x - 26, baseY - 12);
  g.lineTo(x + 26, baseY - 12);
  g.stroke();
  // 처마 밑 단청 띠 (초록·파랑)
  g.fillStyle = "#2f7a5a";
  g.fillRect(x - 28, baseY - 34, 56, 4);
  g.fillStyle = "#3d6fae";
  for (let dx = -27; dx < 27; dx += 5) g.fillRect(x + dx, baseY - 33, 2.5, 2);
  // 기와지붕: 처마 끝이 위로 들림
  g.fillStyle = "#2a2d3a";
  g.beginPath();
  g.moveTo(x - 40, baseY - 40);
  g.quadraticCurveTo(x - 28, baseY - 33, x, baseY - 34);
  g.quadraticCurveTo(x + 28, baseY - 33, x + 40, baseY - 40);
  g.quadraticCurveTo(x + 22, baseY - 46, x + 10, baseY - 56);
  g.lineTo(x - 10, baseY - 56);
  g.quadraticCurveTo(x - 22, baseY - 46, x - 40, baseY - 40);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(160,170,200,0.35)";
  g.lineWidth = 0.6;
  for (let k = -8; k <= 8; k++) {
    g.beginPath();
    g.moveTo(x + k * 1.2, baseY - 56);
    g.lineTo(x + k * 4.4, baseY - 35);
    g.stroke();
  }
  g.fillStyle = "#3a3d4a";
  g.fillRect(x - 11, baseY - 58, 22, 2.5);
  // 처마 밑 초롱
  for (const dx of [-20, 20]) {
    const glow = g.createRadialGradient(x + dx, baseY - 27, 0, x + dx, baseY - 27, 9);
    glow.addColorStop(0, "rgba(255,190,110,0.8)");
    glow.addColorStop(1, "rgba(255,190,110,0)");
    g.fillStyle = glow;
    g.fillRect(x + dx - 9, baseY - 36, 18, 18);
    g.fillStyle = "#ff9a5a";
    g.beginPath();
    g.ellipse(x + dx, baseY - 27, 2.5, 3.2, 0, 0, Math.PI * 2);
    g.fill();
  }
}

// 사랑의 자물쇠 울타리: 화면 맨 앞을 가로지르는 난간에 알록달록한 자물쇠가 빼곡함
function loveLocks(g, rnd, left, right) {
  const LOCK = ["#e8a0b0", "#e8c870", "#9cc0e0", "#d8d8e0"];
  const railY = [300, 310];
  g.strokeStyle = "#7c8496";
  g.lineWidth = 1.6;
  for (const y of railY) {
    g.beginPath();
    g.moveTo(left, y);
    g.lineTo(right, y);
    g.stroke();
  }
  g.fillStyle = "#5c6476";
  for (let x = left + 10; x < right; x += 40) g.fillRect(x - 1.6, 290, 3.2, 30);
  for (const y of railY) {
    for (let x = left; x < right; x += 4 + rnd() * 5) {
      const w = 2.6 + rnd() * 1.8;
      const h = 3 + rnd() * 1.6;
      const dy = rnd() * 1.5;
      g.fillStyle = LOCK[Math.floor(rnd() * LOCK.length)];
      g.fillRect(x - w / 2, y + 1.5 + dy, w, h);
      g.strokeStyle = "rgba(200,205,215,0.8)";
      g.lineWidth = 0.6;
      g.beginPath();
      g.arc(x, y + 1.5 + dy, w * 0.32, Math.PI, 0);
      g.stroke();
    }
  }
}

// 매 프레임 그리는 것: 깜빡이는 항공 장애등과 반짝이는 별
function animateNamsan(ctx, t) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const s of twinkleStars) {
    const a = Math.max(0, Math.sin(t * s.speed + s.phase));
    ctx.globalAlpha = a * 0.9;
    ctx.drawImage(sprite("#ffffff"), s.x - 3, s.y - 3, 6, 6);
  }

  const on = Math.sin(t * 0.004) > 0.2;
  ctx.globalAlpha = on ? 1 : 0.15;
  ctx.drawImage(sprite("#ff5a5a"), antenna.x - 6, antenna.y - 7, 12, 12);

  ctx.restore();
}

// 색마다 한 번만 만드는 빛 번짐 이미지
const sprites = new Map();
function sprite(color) {
  if (!sprites.has(color)) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.2, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    sprites.set(color, c);
  }
  return sprites.get(color);
}

// 반짝이는 불빛 입자: 밝기가 저마다 다른 박자로 오르내리고, 가장 밝을 때 십자 빛이 퍼짐
function drawSparkle(ctx, p, t) {
  const tw = 0.5 + 0.5 * Math.sin(t * p.twinkle + p.phase);
  // 바닥에 가라앉은 불빛은 겹쳐도 타지 않게 작고 은은하게
  // 겹쳐도 하얗게 타지 않게 번지는 범위와 밝기를 눌러 둠
  ctx.globalAlpha = p.settled ? 0.1 + 0.2 * tw : 0.3 + 0.45 * tw;
  const r = p.size * (p.settled ? 1 + tw * 0.4 : 1.4 + tw * 0.9);
  ctx.drawImage(sprite(p.color), p.x - r, p.y - r, r * 2, r * 2);

  if (!p.settled && tw > 0.9 && p.size > 2) {
    const len = p.size * 4 * ((tw - 0.9) / 0.1);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(p.x - len, p.y);
    ctx.lineTo(p.x + len, p.y);
    ctx.moveTo(p.x, p.y - len);
    ctx.lineTo(p.x, p.y + len);
    ctx.stroke();
  }
}

export const namsan = {
  id: "korea",
  label: "한국 · 남산타워",
  title: "N서울타워",
  paint: paintNamsan,
  animate: animateNamsan,
  glare: 0.45, // 밤이라 유리 반사광을 약하게
  base: {
    trim: ["#5d6475", "#e9edf5", "#a7afc0", "#4f5666"],
    plate: "N서울타워",
    plateFont: "700 15px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
    plateInk: "#1a1f2e",
  },
  // 반짝이 가루는 아주 가벼워서 오래 떠다님
  particles: {
    count: 200,
    blend: "lighter",
    make(rand) {
      const size = rand(1.2, 3);
      return {
        size,
        color: SPARKLE_COLORS[Math.floor(rand(0, SPARKLE_COLORS.length))],
        sink: 0.06 + size * 0.03 + rand(-0.02, 0.02),
        drag: rand(0.1, 0.15),
        inertia: rand(0.3, 0.6),
        grip: rand(0.4, 1.6),
        twinkle: rand(0.002, 0.006),
        phase: rand(0, Math.PI * 2),
        flutter: 0,
      };
    },
    draw: drawSparkle,
  },
};
