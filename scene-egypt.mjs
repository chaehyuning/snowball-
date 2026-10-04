// 이집트: 해 질 녘 기자의 피라미드와 스핑크스, 흩날리는 모래알

import { seeded, fillSilhouette } from "./util.mjs";

const SAND = ["#e9b07a", "#d48a52", "#b8683a", "#f3cf9c", "#9c5530"];

function paintEgypt(g, globe, groundAt) {
  const rnd = seeded(2560);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 사막의 해 질 녘 하늘: 위는 짙은 남보라, 가운데 장밋빛, 지평선 가까이 주황과 금빛
  const sky = g.createLinearGradient(0, top, 0, 275);
  sky.addColorStop(0, "#2c2f6b");
  sky.addColorStop(0.35, "#6e4f8e");
  sky.addColorStop(0.6, "#d7748a");
  sky.addColorStop(0.82, "#f6a25a");
  sky.addColorStop(1, "#ffd890");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 지평선에 걸린 큰 해
  const sunX = 118;
  const sunY = 232;
  const halo = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, 110);
  halo.addColorStop(0, "rgba(255,226,170,0.9)");
  halo.addColorStop(0.2, "rgba(255,190,120,0.45)");
  halo.addColorStop(1, "rgba(255,170,110,0)");
  g.fillStyle = halo;
  g.fillRect(left, top, size, size);
  g.fillStyle = "#ffe0a8";
  g.beginPath();
  g.arc(sunX, sunY, 16, 0, Math.PI * 2);
  g.fill();

  // 먼지 띠
  g.filter = "blur(6px)";
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(240,180,130,${r(0.2, 0.4)})`;
    g.beginPath();
    g.ellipse(r(60, 340), r(150, 230), r(50, 100), r(4, 8), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.filter = "none";

  // 먼 모래 언덕: 저녁 하늘빛을 받아 보랏빛이 도는 분홍
  const farY = (x) => 262 + 5 * Math.sin(x * 0.03 + 1) + 3 * Math.sin(x * 0.08);
  g.fillStyle = "#c98a7a";
  fillSilhouette(g, farY, left, right, 400);

  // 왼쪽 지평선의 나일강과 야자수 숲: 청록 물줄기에 해가 금빛으로 비침
  const rn = seeded(3100);
  const nile = g.createLinearGradient(0, 260, 0, 270);
  nile.addColorStop(0, "#3f9aa6");
  nile.addColorStop(1, "#1f6a7a");
  g.fillStyle = nile;
  g.beginPath();
  g.moveTo(left, 264);
  g.quadraticCurveTo(90, 258, 170, 266);
  g.lineTo(170, 268);
  g.quadraticCurveTo(90, 264, left, 272);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(255,220,150,0.8)";
  for (let i = 0; i < 10; i++) g.fillRect(100 + rn() * 36, 262 + rn() * 4, 2 + rn() * 4, 0.6);
  for (let i = 0; i < 9; i++) {
    const px = 40 + i * 13 + rn() * 6;
    const py = 262 - (i % 3) * 0.5;
    const ph = 10 + rn() * 7;
    g.strokeStyle = "#3a3a2a";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(px, py);
    g.quadraticCurveTo(px + 1.5, py - ph * 0.5, px + (rn() - 0.5) * 2, py - ph);
    g.stroke();
    g.strokeStyle = i % 2 ? "#2f5a3a" : "#3c6e44";
    g.lineWidth = 1.3;
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k - 2.5) * 0.55;
      g.beginPath();
      g.moveTo(px, py - ph);
      g.quadraticCurveTo(px + Math.cos(a) * 4, py - ph + Math.sin(a) * 4 - 1, px + Math.cos(a) * 7, py - ph + Math.sin(a) * 5 + 3);
      g.stroke();
    }
  }

  // 피라미드 세 개: 멘카우레(작은 것) → 카프레(꼭대기에 흰 외장석이 남은 것) → 쿠푸
  // 피라미드 세 개. 멀수록 작고 하늘빛 먼지에 묻혀 흐릿함
  // 멘카우레(가장 멀고 작음) → 쿠푸 → 카프레(스핑크스 바로 뒤, 꼭대기에 흰 외장석)
  pyramid(g, 330, 262, 26, 38, false, 0.4);
  pyramid(g, 285, 266, 58, 86, false, 0.2);
  pyramid(g, 222, 270, 70, 108, true, 0);

  // 앞쪽 사막
  const duneY = (x) => 286 + 6 * Math.sin(x * 0.025 + 2) + 2 * Math.sin(x * 0.09);
  const dune = g.createLinearGradient(0, 280, 0, 335);
  dune.addColorStop(0, "#e8a05e");
  dune.addColorStop(0.6, "#c47a58");
  dune.addColorStop(1, "#8e5a62");
  g.fillStyle = dune;
  fillSilhouette(g, duneY, left, right, 400);
  // 모래 물결
  g.strokeStyle = "rgba(255,210,160,0.35)";
  g.lineWidth = 0.7;
  for (let i = 0; i < 40; i++) {
    const x = r(left, right);
    const y = r(duneY(x) + 4, 330);
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + 8, y - 2, x + 18, y);
    g.stroke();
  }

  // 모래 물결 뒤쪽 그늘은 보랏빛
  g.strokeStyle = "rgba(110,80,140,0.25)";
  g.lineWidth = 0.9;
  for (let i = 0; i < 30; i++) {
    const x = left + rn() * size;
    const y = duneY(x) + 6 + rn() * 40;
    g.beginPath();
    g.moveTo(x, y + 1);
    g.quadraticCurveTo(x + 9, y - 1, x + 20, y + 1);
    g.stroke();
  }

  sphinx(g);
  camel(g, 318, 300);

  // 바닥: 고운 모래
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#f0b878");
  floor.addColorStop(0.6, "#cf8a5a");
  floor.addColorStop(1, "#9a5a52");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  for (let i = 0; i < 380; i++) {
    const x = r(left, right);
    const y = groundAt(x) + r(2, 45);
    g.globalAlpha = r(0.3, 0.8);
    g.fillStyle = SAND[Math.floor(rnd() * SAND.length)];
    g.fillRect(x, y, r(0.6, 1.6), r(0.6, 1.2));
  }
  g.globalAlpha = 1;

  g.restore();
}

// 풍화된 석회암 층: 선을 긋는 대신 층마다 밝기를 조금씩 달리 칠하고,
// 층 아래 움푹 들어간 곳에만 끊어진 그늘을 둠. 경계는 울퉁불퉁하고 군데군데 닳아 없어짐
function strata(g, rnd, x0, x1, y0, y1, { light, dark, minH = 3, maxH = 6, shade = 0.22, tilt = 0, tone = [0.05, 0.16] }) {
  const r = (a, b) => a + rnd() * (b - a);
  let y = y0;
  while (y < y1) {
    const h = r(minH, maxH);
    // 층 자체의 밝기: 밝은 층과 어두운 층이 불규칙하게 섞임
    g.fillStyle = rnd() < 0.5 ? light : dark;
    g.globalAlpha = r(tone[0], tone[1]);
    g.beginPath();
    g.moveTo(x0, y + tilt * 0);
    for (let x = x0; x <= x1; x += 4) g.lineTo(x, y + (x - x0) * tilt + r(-0.6, 0.6));
    for (let x = x1; x >= x0; x -= 4) g.lineTo(x, y + h + (x - x0) * tilt + r(-0.6, 0.6));
    g.closePath();
    g.fill();
    // 층 아래 그늘: 짧게 끊기고 굵기가 들쭉날쭉
    g.fillStyle = dark;
    let x = x0;
    while (x < x1) {
      const len = r(6, 22);
      if (rnd() < 0.72) {
        g.globalAlpha = shade * r(0.5, 1);
        const yy = y + h + (x - x0) * tilt;
        g.beginPath();
        g.moveTo(x, yy);
        g.lineTo(x + len, yy + len * tilt + r(-0.4, 0.4));
        g.lineTo(x + len, yy + len * tilt + r(0.5, 1.3));
        g.lineTo(x, yy + r(0.5, 1.3));
        g.closePath();
        g.fill();
      }
      x += len + r(2, 8);
    }
    y += h;
  }
  g.globalAlpha = 1;
}

// 돌 표면의 얼룩: 부드러운 반점을 흩뿌려 매끈한 그라데이션을 깸
function mottle(g, rnd, x0, x1, y0, y1, count, colors) {
  const r = (a, b) => a + rnd() * (b - a);
  for (let i = 0; i < count; i++) {
    const x = r(x0, x1);
    const y = r(y0, y1);
    const rad = r(2, 7);
    const spot = g.createRadialGradient(x, y, 0, x, y, rad);
    const c = colors[Math.floor(rnd() * colors.length)];
    spot.addColorStop(0, c);
    spot.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = r(0.08, 0.2);
    g.fillStyle = spot;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.globalAlpha = 1;
}

// 피라미드: 해를 받는 왼쪽 면은 밝고 오른쪽 면은 그늘. 돌단 줄무늬.
// fade: 멀리 있을수록 하늘빛 먼지에 묻혀 흐려지는 정도
function pyramid(g, cx, baseY, half, h, cap, fade) {
  const apexY = baseY - h;
  g.fillStyle = "#efae6c";
  g.beginPath();
  g.moveTo(cx - half, baseY);
  g.lineTo(cx, apexY);
  g.lineTo(cx + half * 0.25, baseY);
  g.closePath();
  g.fill();
  g.fillStyle = "#8a5866";
  g.beginPath();
  g.moveTo(cx + half * 0.25, baseY);
  g.lineTo(cx, apexY);
  g.lineTo(cx + half, baseY);
  g.closePath();
  g.fill();

  // 돌단: 면 안에서만 층마다 밝기를 달리하고 끊어진 그늘을 둠
  const rnd = seeded(Math.round(cx * 7 + h));
  g.save();
  g.beginPath();
  g.moveTo(cx - half, baseY);
  g.lineTo(cx, apexY);
  g.lineTo(cx + half, baseY);
  g.closePath();
  g.clip();
  const course = Math.max(2.2, h / 26);
  strata(g, rnd, cx - half, cx + half, apexY, baseY, {
    light: "#ffd9a8",
    dark: "#6e3518",
    minH: course * 0.8,
    maxH: course * 1.2,
    shade: 0.12,
    tone: [0.03, 0.1],
  });
  mottle(g, rnd, cx - half, cx + half, apexY + h * 0.2, baseY, Math.round(h / 3), ["#7a3c1c", "#f2c08c"]);
  // 해를 받는 쪽 모서리를 따라 가는 빛
  g.strokeStyle = "rgba(255,226,180,0.45)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(cx, apexY);
  g.lineTo(cx + half * 0.25, baseY);
  g.stroke();
  g.restore();
  // 바깥 모서리는 돌단이 깨져 살짝 들쭉날쭉
  g.fillStyle = "#efae6c";
  for (let k = 3; k < 24; k++) {
    const t = k / 24;
    const ex = cx - half * t;
    const ey = apexY + h * t;
    if (rnd() < 0.5) g.fillRect(ex - 0.8, ey - 0.6, 0.9, 0.9);
  }

  if (cap) {
    const capH = h * 0.16;
    const capW = half * 0.16;
    g.fillStyle = "#f4e2c4";
    g.beginPath();
    g.moveTo(cx - capW, apexY + capH);
    g.lineTo(cx, apexY);
    g.lineTo(cx + capW * 0.25, apexY + capH);
    g.closePath();
    g.fill();
    g.fillStyle = "#cdb08a";
    g.beginPath();
    g.moveTo(cx + capW * 0.25, apexY + capH);
    g.lineTo(cx, apexY);
    g.lineTo(cx + capW, apexY + capH);
    g.closePath();
    g.fill();
  }

  if (fade > 0) {
    g.fillStyle = `rgba(214,150,160,${fade})`;
    g.beginPath();
    g.moveTo(cx - half, baseY);
    g.lineTo(cx, apexY);
    g.lineTo(cx + half, baseY);
    g.closePath();
    g.fill();
  }
}

// 스핑크스: 오른쪽 앞을 바라보는 3/4 각도.
// 석회암 구덩이 안에 엎드린 사자 몸, 길게 뻗은 앞발 두 개, 엉덩이와 꼬리,
// 줄무늬 두건(네메스)과 늘어진 자락, 코가 떨어져 나간 얼굴과 이마의 코브라 장식 자리
function sphinx(g) {
  // 스핑크스를 둘러싼 암반 구덩이 벽 (층층이 쌓인 석회암)
  const pit = g.createLinearGradient(0, 262, 0, 304);
  pit.addColorStop(0, "#c98a58");
  pit.addColorStop(1, "#8a4c28");
  g.fillStyle = pit;
  g.beginPath();
  g.moveTo(30, 304);
  g.lineTo(34, 268);
  g.lineTo(120, 264);
  g.lineTo(250, 270);
  g.lineTo(262, 304);
  g.closePath();
  g.fill();
  const rnd = seeded(4500);
  g.save();
  g.clip();
  strata(g, rnd, 30, 262, 266, 304, { light: "#f0b47c", dark: "#5e2a10", minH: 3, maxH: 6, shade: 0.14, tilt: 0.008, tone: [0.03, 0.08] });
  g.restore();

  // 스핑크스 전체를 하나의 윤곽으로: 엉덩이 → 등 → 어깨 → 두건 뒤 → 정수리 → 얼굴 옆선 → 앞 자락 → 가슴 → 앞발 → 바닥.
  // 한 번에 칠하고 같은 돌결을 입혀, 몸통·다리·머리가 한 바위를 깎은 것처럼 보이게 함
  const outline = () => {
    g.beginPath();
    g.moveTo(52, 300);
    g.quadraticCurveTo(45, 276, 66, 266); // 엉덩이
    g.quadraticCurveTo(108, 257, 150, 259); // 등
    g.quadraticCurveTo(153, 258, 154.5, 255); // 어깨에서 두건 뒤 자락으로
    g.quadraticCurveTo(153, 238, 157, 226);
    g.quadraticCurveTo(162, 210, 177, 208); // 정수리
    g.quadraticCurveTo(191, 209, 194, 222); // 이마 위 두건 테
    g.quadraticCurveTo(195, 228, 194.6, 232); // 미간
    g.lineTo(196.6, 237.5); // 깨진 코
    g.lineTo(195, 239.5);
    g.quadraticCurveTo(196, 242, 195.4, 244); // 입술
    g.quadraticCurveTo(194.5, 249, 191.5, 251.5); // 턱
    g.lineTo(199, 262); // 앞 자락이 가슴으로 퍼짐
    g.quadraticCurveTo(205, 272, 202, 283); // 가슴
    g.lineTo(240, 285); // 앞발 윗선
    g.quadraticCurveTo(248, 286, 247, 292); // 발끝
    g.quadraticCurveTo(247, 300, 240, 300);
    g.closePath();
  };
  const rnd2 = seeded(4502);
  // 바닥에 떨어진 그림자
  g.fillStyle = "rgba(60,24,6,0.35)";
  g.beginPath();
  g.ellipse(150, 301, 104, 4, 0, 0, Math.PI * 2);
  g.fill();
  const stone = g.createLinearGradient(60, 208, 140, 300);
  stone.addColorStop(0, "#e2a66e");
  stone.addColorStop(0.5, "#cc8a54");
  stone.addColorStop(1, "#a96636");
  g.fillStyle = stone;
  outline();
  g.fill();

  g.save();
  outline();
  g.clip();
  // 하나로 이어진 가로 돌결 (몸통·다리·머리 모두 같은 층)
  strata(g, rnd2, 40, 250, 206, 302, { light: "#ffd2a0", dark: "#5a2810", minH: 4, maxH: 6, shade: 0.3, tone: [0.07, 0.16] });
  mottle(g, rnd2, 44, 250, 206, 302, 30, ["#6a3014", "#ffd8a8"]);
  // 빛: 왼쪽 위에서. 등과 정수리 위가 밝고, 아래와 오른쪽 가슴은 그늘
  const light = g.createLinearGradient(0, 205, 0, 302);
  light.addColorStop(0, "rgba(255,226,180,0.3)");
  light.addColorStop(0.45, "rgba(255,226,180,0)");
  light.addColorStop(1, "rgba(60,24,6,0.32)");
  g.fillStyle = light;
  g.fillRect(40, 205, 212, 98);

  // 두건 부분: 같은 돌 위에 머리 곡면을 따라 휜 줄무늬만 더함
  const nemesPath = () => {
    g.beginPath();
    g.moveTo(152, 266);
    g.quadraticCurveTo(153, 238, 157, 226);
    g.quadraticCurveTo(162, 210, 177, 208);
    g.quadraticCurveTo(191, 209, 194, 222);
    g.lineTo(184, 222);
    g.quadraticCurveTo(182.2, 236, 183.6, 249);
    g.lineTo(200, 266);
    g.closePath();
  };
  g.save();
  nemesPath();
  g.clip();
  for (let k = 0; k < 14; k++) {
    const y = 211 + k * 4;
    for (let seg = 0; seg < 6; seg++) {
      if (rnd2() < 0.15) continue;
      const x0 = 150 + seg * 8;
      const x1 = x0 + 8;
      const bend = (x) => y + 1.5 - Math.sin(((x - 150) / 50) * Math.PI) * 3;
      g.fillStyle = `rgba(100,44,16,${0.16 + rnd2() * 0.16})`;
      g.beginPath();
      g.moveTo(x0, bend(x0));
      g.lineTo(x1, bend(x1));
      g.lineTo(x1, bend(x1) + 1.8);
      g.lineTo(x0, bend(x0) + 1.8);
      g.closePath();
      g.fill();
    }
  }
  g.restore();
  g.restore();

  // 안쪽 윤곽: 바깥선과 같은 색·굵기의 가는 선으로 덩어리를 나눔
  g.lineCap = "round";
  const line = (fn, a = 0.5, w = 0.8) => {
    g.strokeStyle = `rgba(90,40,14,${a})`;
    g.lineWidth = w;
    g.beginPath();
    fn();
    g.stroke();
  };
  const hi = (fn) => {
    g.strokeStyle = "rgba(255,222,176,0.45)";
    g.lineWidth = 0.8;
    g.beginPath();
    fn();
    g.stroke();
  };
  // 접힌 뒷다리: 엉덩이에서 허벅지가 둥글게 내려와 앞으로 놓인 발
  line(() => {
    g.moveTo(64, 274);
    g.quadraticCurveTo(96, 262, 104, 286);
    g.quadraticCurveTo(108, 296, 128, 297);
  });
  hi(() => {
    g.moveTo(66, 272);
    g.quadraticCurveTo(90, 263, 99, 276);
  });
  // 꼬리: 엉덩이 아래에서 허리 쪽으로 감김
  line(() => {
    g.moveTo(56, 293);
    g.quadraticCurveTo(74, 299, 96, 297);
  }, 0.6, 1.4);
  // 갈비뼈
  for (const x of [124, 133, 142]) line(() => {
    g.moveTo(x, 266);
    g.quadraticCurveTo(x - 3, 275, x + 1, 283);
  }, 0.28, 0.7);
  // 어깨에서 내려오는 앞다리와 팔꿈치, 앞발로 이어지는 선
  line(() => {
    g.moveTo(160, 266);
    g.quadraticCurveTo(170, 274, 168, 286);
    g.quadraticCurveTo(167, 292, 176, 292);
    g.lineTo(240, 292.5);
  });
  hi(() => {
    g.moveTo(162, 265);
    g.quadraticCurveTo(170, 270, 170, 280);
  });
  // 뒤쪽 앞발 윗선 (앞발 두 개가 겹쳐 보임)
  line(() => {
    g.moveTo(203, 285);
    g.lineTo(238, 286.5);
  }, 0.35, 0.6);
  // 발가락
  for (const [y0, y1] of [[287, 289.5], [293.5, 296], [296.5, 299]]) line(() => {
    g.moveTo(240, y0);
    g.quadraticCurveTo(244, (y0 + y1) / 2, 246, y1 - 0.5);
  }, 0.45, 0.6);
  // 두건 경계와 앞 자락
  line(() => {
    g.moveTo(184, 222);
    g.quadraticCurveTo(182.2, 236, 183.6, 249);
    g.lineTo(200, 266);
  });
  line(() => {
    g.moveTo(152, 266);
    g.quadraticCurveTo(153, 252, 154.5, 255);
  }, 0.45, 0.7);
  // 두건 이마 테
  g.strokeStyle = "#e8b37c";
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(181, 221);
  g.quadraticCurveTo(187, 218, 194, 221);
  g.stroke();
  // 아래쪽 복원 벽돌 몇 줄 (아주 옅게)
  g.strokeStyle = "rgba(90,40,14,0.16)";
  g.lineWidth = 0.4;
  for (let x = 62; x < 160; x += 6) g.strokeRect(x, 296, 5.4, 2.6);
  // 두 앞발 사이 꿈의 비석
  g.fillStyle = "#8e4a3a";
  g.beginPath();
  g.moveTo(206, 292);
  g.lineTo(206, 285);
  g.quadraticCurveTo(211, 280.5, 216, 285);
  g.lineTo(216, 292);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(255,210,180,0.35)";
  for (const y of [286, 288, 290]) g.fillRect(207.5, y, 7, 0.5);

  // 얼굴: 두건 안쪽으로 살짝 들어간 면. 같은 돌빛에 그늘만 조금 더함
  g.save();
  g.beginPath();
  g.moveTo(184, 222);
  g.lineTo(194, 222);
  g.quadraticCurveTo(195, 228, 194.6, 232);
  g.lineTo(196.6, 237.5);
  g.lineTo(195, 239.5);
  g.quadraticCurveTo(196, 242, 195.4, 244);
  g.quadraticCurveTo(194.5, 249, 191.5, 251.5);
  g.quadraticCurveTo(186, 252.5, 183.6, 249);
  g.quadraticCurveTo(182.2, 236, 184, 222);
  g.closePath();
  g.clip();
  const faceShade = g.createLinearGradient(183, 0, 197, 0);
  faceShade.addColorStop(0, "rgba(70,28,8,0.22)");
  faceShade.addColorStop(0.5, "rgba(255,220,170,0.08)");
  faceShade.addColorStop(1, "rgba(70,28,8,0.12)");
  g.fillStyle = faceShade;
  g.fillRect(182, 220, 16, 34);
  const jaw = g.createLinearGradient(0, 241, 0, 253);
  jaw.addColorStop(0, "rgba(70,28,8,0)");
  jaw.addColorStop(1, "rgba(70,28,8,0.3)");
  g.fillStyle = jaw;
  g.fillRect(182, 241, 16, 13);
  g.restore();
  // 귀
  g.fillStyle = "rgba(90,40,14,0.25)";
  g.beginPath();
  g.ellipse(180.6, 235, 2.3, 4.4, -0.15, 0, Math.PI * 2);
  g.fill();
  line(() => g.ellipse(180.6, 235, 2.3, 4.4, -0.15, 0, Math.PI * 2), 0.5, 0.6);
  // 눈두덩 그늘, 이마 뼈, 아몬드 눈
  g.fillStyle = "rgba(70,28,8,0.4)";
  g.beginPath();
  g.ellipse(189.6, 229.6, 3.6, 1.9, -0.08, 0, Math.PI * 2);
  g.fill();
  hi(() => {
    g.moveTo(185.5, 227);
    g.quadraticCurveTo(189.5, 225.6, 193.6, 226.8);
  });
  g.fillStyle = "#3e1a08";
  g.beginPath();
  g.moveTo(186.8, 229.8);
  g.quadraticCurveTo(189.6, 228.2, 192.6, 229.6);
  g.quadraticCurveTo(189.8, 231, 186.8, 229.8);
  g.closePath();
  g.fill();
  // 콧등 빛과 깨진 자리
  hi(() => {
    g.moveTo(194.4, 231.5);
    g.lineTo(195.8, 236.6);
  });
  g.fillStyle = "rgba(255,220,170,0.4)";
  g.beginPath();
  g.moveTo(194.6, 236);
  g.lineTo(196.6, 237.5);
  g.lineTo(195.2, 239.4);
  g.lineTo(193.4, 238.6);
  g.closePath();
  g.fill();
  // 입술
  line(() => {
    g.moveTo(190, 242.6);
    g.quadraticCurveTo(193, 243.6, 195.3, 242.8);
  }, 0.7, 0.6);
  g.fillStyle = "rgba(120,50,20,0.35)";
  g.beginPath();
  g.moveTo(190.8, 243);
  g.quadraticCurveTo(193.4, 245.2, 195.2, 243.2);
  g.closePath();
  g.fill();
  // 코브라 장식이 떨어져 나간 자리
  g.fillStyle = "rgba(90,40,14,0.55)";
  g.beginPath();
  g.ellipse(190.4, 223.6, 1.1, 0.8, 0, 0, Math.PI * 2);
  g.fill();

  // 바깥 윤곽선: 머리·몸·발 모두 같은 선 하나
  g.strokeStyle = "rgba(90,40,14,0.6)";
  g.lineWidth = 0.9;
  g.lineJoin = "round";
  outline();
  g.stroke();
}

// 낙타 실루엣
function camel(g, x, baseY) {
  // 해가 왼쪽 뒤에 있어 모래 위로 오른쪽으로 긴 그림자가 늘어짐
  g.fillStyle = "rgba(70,30,15,0.28)";
  g.beginPath();
  g.ellipse(x + 16, baseY + 0.8, 22, 1.6, 0, 0, Math.PI * 2);
  g.fill();

  function body() {
    g.beginPath();
    // 꼬리 쪽 엉덩이 → 혹 → 어깨 → 목 → 머리 → 턱 → 목 아래 → 가슴 → 배
    g.moveTo(x - 12, baseY - 12);
    g.quadraticCurveTo(x - 13, baseY - 17, x - 8, baseY - 18);
    g.quadraticCurveTo(x - 3, baseY - 26, x + 3, baseY - 18);
    g.quadraticCurveTo(x + 8, baseY - 16, x + 11, baseY - 15);
    g.quadraticCurveTo(x + 14, baseY - 17, x + 15, baseY - 22);
    g.quadraticCurveTo(x + 16, baseY - 25, x + 19, baseY - 25);
    g.quadraticCurveTo(x + 22, baseY - 24.5, x + 22.5, baseY - 22.5);
    g.lineTo(x + 19.5, baseY - 21.8);
    g.quadraticCurveTo(x + 17.5, baseY - 18, x + 15, baseY - 13.5);
    g.quadraticCurveTo(x + 12, baseY - 9.5, x + 8, baseY - 9.5);
    g.quadraticCurveTo(x - 2, baseY - 8, x - 10, baseY - 9.5);
    g.closePath();
  }
  const fur = g.createLinearGradient(x - 12, 0, x + 22, 0);
  fur.addColorStop(0, "#6a3c22");
  fur.addColorStop(1, "#42241a");
  g.fillStyle = fur;
  body();
  g.fill();

  // 다리: 허벅지는 굵고 무릎 아래로 가늘어짐. 먼 쪽 다리는 더 어둡게
  function leg(x0, back, dark) {
    g.fillStyle = dark ? "#3a1f14" : "#4e2a1a";
    g.beginPath();
    g.moveTo(x0 - 1.6, baseY - 11);
    g.quadraticCurveTo(x0 - 1.2 + back, baseY - 6, x0 - 0.6 + back * 1.4, baseY - 4.5);
    g.lineTo(x0 - 0.5 + back * 0.6, baseY - 0.4);
    g.lineTo(x0 + 1.2 + back * 0.6, baseY - 0.4);
    g.lineTo(x0 + 0.5 + back * 1.4, baseY - 4.5);
    g.quadraticCurveTo(x0 + 1.4 + back, baseY - 6, x0 + 1.8, baseY - 11);
    g.closePath();
    g.fill();
  }
  leg(x - 6.5, -0.8, true);
  leg(x + 9, 0.6, true);
  leg(x - 9, -1, false);
  leg(x + 11.5, 0.8, false);
  // 혹 위 안장 담요: 빨강·남색 줄무늬와 술
  g.fillStyle = "#b8283a";
  g.beginPath();
  g.moveTo(x - 6, baseY - 19);
  g.quadraticCurveTo(x - 2, baseY - 24.5, x + 2.5, baseY - 18.5);
  g.lineTo(x + 3, baseY - 14);
  g.lineTo(x - 6.5, baseY - 14.5);
  g.closePath();
  g.fill();
  g.fillStyle = "#2a3f8a";
  g.fillRect(x - 6.3, baseY - 16.5, 9.2, 1);
  g.fillStyle = "#f2c232";
  for (let k = 0; k < 5; k++) g.fillRect(x - 6 + k * 2.2, baseY - 14, 0.6, 1.4);

  // 꼬리
  g.strokeStyle = "#42241a";
  g.lineWidth = 0.9;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x - 12.3, baseY - 15);
  g.quadraticCurveTo(x - 14.5, baseY - 11, x - 13.5, baseY - 8);
  g.stroke();

  // 등 뒤에서 비치는 노을빛: 위쪽 윤곽을 따라 가늘고 밝은 테
  g.save();
  body();
  g.clip();
  g.strokeStyle = "rgba(255,190,120,0.55)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(x - 13, baseY - 14);
  g.quadraticCurveTo(x - 13, baseY - 17, x - 8, baseY - 18);
  g.quadraticCurveTo(x - 3, baseY - 26, x + 3, baseY - 18);
  g.stroke();
  g.restore();
}

// 모래알: 작은 알갱이. 가끔 햇빛을 받아 반짝임
function drawGrain(ctx, p, t) {
  const glint = Math.max(0, Math.sin(t * p.twinkle + p.phase));
  ctx.globalAlpha = p.settled ? 0.75 : 0.9;
  ctx.fillStyle = p.color;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
  ctx.restore();
  if (!p.settled && glint > 0.85) {
    ctx.globalAlpha = (glint - 0.85) * 5;
    ctx.fillStyle = "#fff4d8";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 모래 폭풍: 흐린 모래 장막 몇 겹이 바람을 타고 오른쪽으로 천천히 흘러감.
// 장막은 한 번만 그려 두고(가로로 이어지게) 매 프레임 옮겨 그림. 세기는 20초쯤 주기로 일었다 잦아듦
let veils = null;
let grains = null;
function makeVeil(seed, w, h, tint) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  const rnd = seeded(seed);
  // 흐린 덩어리: 블러 필터 대신 가장자리가 투명해지는 둥근 그라데이션을 납작하게 눌러 찍음 (훨씬 빠름)
  for (let i = 0; i < 46; i++) {
    const x = rnd() * w;
    const y = h * (0.3 + rnd() * 0.45);
    const rx = 30 + rnd() * 70;
    const ry = 6 + rnd() * 14;
    const a = 0.18 + rnd() * 0.3;
    for (const off of [-w, 0, w]) {
      g.save();
      g.translate(x + off, y);
      g.scale(rx / ry, 1);
      const puff = g.createRadialGradient(0, 0, 0, 0, 0, ry);
      puff.addColorStop(0, `rgba(${tint},${a})`);
      puff.addColorStop(1, `rgba(${tint},0)`);
      g.fillStyle = puff;
      g.fillRect(-ry, -ry, ry * 2, ry * 2);
      g.restore();
    }
  }
  return { c, w, h };
}

function animateEgypt(ctx, t, globe) {
  if (!veils) {
    veils = [
      { ...makeVeil(31, 520, 90, "236,176,120"), y: 196, speed: 0.006, alpha: 0.22 },
      { ...makeVeil(57, 520, 110, "226,160,105"), y: 248, speed: 0.011, alpha: 0.26 },
      { ...makeVeil(83, 520, 120, "214,146,92"), y: 288, speed: 0.018, alpha: 0.22 },
    ];
  }
  // 20초쯤 주기로 일었다 잦아드는 바람
  const gust = 0.55 + 0.45 * Math.sin(t * 0.0003) * Math.sin(t * 0.00017 + 1);
  const left = globe.x - globe.r;
  ctx.save();
  for (const v of veils) {
    const shift = (t * v.speed * (0.7 + gust * 0.6)) % v.w;
    const bob = Math.sin(t * 0.0005 + v.y) * 3;
    ctx.globalAlpha = v.alpha * (0.3 + gust * 0.7);
    for (let x = left - v.w + shift; x < globe.x + globe.r; x += v.w) {
      ctx.drawImage(v.c, x, v.y - v.h / 2 + bob, v.w, v.h);
    }
  }
  // 흩날리는 모래 알갱이: 크기와 빠르기가 제각각이고, 바람에 출렁이며 오른쪽으로 날아감.
  // 땅 가까이일수록 많고 굵으며, 위로 갈수록 드물고 가늘게
  if (!grains) {
    const rnd = seeded(4711);
    grains = Array.from({ length: 150 }, () => {
      const h = Math.pow(rnd(), 1.8); // 0 땅 가까이 → 1 높이
      return {
        y: 322 - h * 130,
        off: rnd() * 1000,
        speed: 0.035 + rnd() * 0.05 + (1 - h) * 0.02,
        size: 0.5 + rnd() * 1.1 * (1 - h * 0.6),
        wave: 2 + rnd() * 6,
        freq: 0.0015 + rnd() * 0.003,
        phase: rnd() * Math.PI * 2,
        color: SAND[Math.floor(rnd() * SAND.length)],
        alpha: 0.45 + rnd() * 0.5,
      };
    });
  }
  const span = globe.r * 2 + 40;
  for (const s of grains) {
    const x = left - 20 + ((t * s.speed * (0.6 + gust * 0.8) + s.off) % span);
    const y = s.y + Math.sin(t * s.freq + s.phase) * s.wave + Math.sin(x * 0.03 + s.phase) * 2;
    ctx.globalAlpha = s.alpha * (0.3 + gust * 0.7);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(x, y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const egypt = {
  id: "egypt",
  label: "이집트 · 기자 피라미드",
  title: "Pyramids of Giza",
  paint: paintEgypt,
  animate: animateEgypt,
  glare: 0.8,
  base: {
    trim: ["#7a5a1c", "#f2d17a", "#c99a35", "#6b4d16"],
    plate: "أهرامات الجيزة",
    plateFont: "600 15px 'Geeza Pro', 'Noto Naskh Arabic', 'Segoe UI', sans-serif",
    plateInk: "#2b1d10",
  },
  // 모래알은 작고 무거워서 꽃잎보다 빨리 떨어짐
  particles: {
    count: 280,
    blend: "source-over",
    make(rand) {
      const size = rand(1.2, 2.4);
      return {
        size,
        color: SAND[Math.floor(rand(0, SAND.length))],
        sink: 0.22 + size * 0.05,
        drag: rand(0.1, 0.15),
        inertia: rand(0.4, 0.7),
        grip: rand(0.5, 1.8),
        angle: rand(0, Math.PI),
        spin: rand(-0.06, 0.06),
        flipSpeed: 0,
        flutter: 0,
        twinkle: rand(0.002, 0.005),
        phase: rand(0, Math.PI * 2),
      };
    },
    draw: drawGrain,
  },
};
