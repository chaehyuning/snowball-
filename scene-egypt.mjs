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

  // 먼지 낀 해 질 녘 하늘: 위는 탁한 보랏빛, 지평선은 살구색
  const sky = g.createLinearGradient(0, top, 0, 275);
  sky.addColorStop(0, "#5e4f7a");
  sky.addColorStop(0.45, "#b8806e");
  sky.addColorStop(0.8, "#eaa877");
  sky.addColorStop(1, "#f5cf9e");
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

  // 먼 모래 언덕
  const farY = (x) => 262 + 5 * Math.sin(x * 0.03 + 1) + 3 * Math.sin(x * 0.08);
  g.fillStyle = "#d99a6c";
  fillSilhouette(g, farY, left, right, 400);

  // 피라미드 세 개: 멘카우레(작은 것) → 카프레(꼭대기에 흰 외장석이 남은 것) → 쿠푸
  // 피라미드 세 개. 멀수록 작고 하늘빛 먼지에 묻혀 흐릿함
  // 멘카우레(가장 멀고 작음) → 쿠푸 → 카프레(스핑크스 바로 뒤, 꼭대기에 흰 외장석)
  pyramid(g, 330, 262, 26, 38, false, 0.4);
  pyramid(g, 285, 266, 58, 86, false, 0.2);
  pyramid(g, 222, 270, 70, 108, true, 0);

  // 앞쪽 사막
  const duneY = (x) => 286 + 6 * Math.sin(x * 0.025 + 2) + 2 * Math.sin(x * 0.09);
  const dune = g.createLinearGradient(0, 280, 0, 335);
  dune.addColorStop(0, "#d58b55");
  dune.addColorStop(1, "#a65c32");
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

  sphinx(g);
  camel(g, 318, 300);

  // 바닥: 고운 모래
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#e2a46e");
  floor.addColorStop(1, "#b06636");
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
  g.fillStyle = "#e3a66e";
  g.beginPath();
  g.moveTo(cx - half, baseY);
  g.lineTo(cx, apexY);
  g.lineTo(cx + half * 0.25, baseY);
  g.closePath();
  g.fill();
  g.fillStyle = "#a9623a";
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
  g.fillStyle = "#e3a66e";
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
    g.fillStyle = `rgba(236,180,140,${fade})`;
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

  // 뒤쪽 앞발 (그늘져서 어둡게, 조금 위)
  g.fillStyle = "#9c5a30";
  g.beginPath();
  g.moveTo(168, 282);
  g.lineTo(224, 284);
  g.quadraticCurveTo(230, 285, 229, 289);
  g.lineTo(170, 289);
  g.closePath();
  g.fill();

  // 몸통: 엉덩이 → 등 → 어깨 → 가슴 → 앞쪽 앞발
  const body = g.createLinearGradient(50, 258, 120, 300);
  body.addColorStop(0, "#efb57a");
  body.addColorStop(0.5, "#cf8c56");
  body.addColorStop(1, "#9a5630");
  g.fillStyle = body;
  g.shadowColor = "rgba(50,20,5,0.5)";
  g.shadowBlur = 8;
  g.shadowOffsetX = 3;
  g.shadowOffsetY = 2;
  g.beginPath();
  g.moveTo(52, 300);
  g.quadraticCurveTo(46, 272, 70, 266);
  g.quadraticCurveTo(110, 260, 150, 260);
  g.lineTo(158, 256);
  g.lineTo(172, 258);
  g.quadraticCurveTo(178, 270, 176, 286);
  g.lineTo(232, 290);
  g.quadraticCurveTo(242, 292, 238, 299);
  g.lineTo(52, 300);
  g.closePath();
  g.fill();
  g.shadowColor = "transparent";
  g.shadowBlur = 0;
  g.shadowOffsetX = 0;
  g.shadowOffsetY = 0;

  // 엉덩이 둥근 근육과 꼬리
  const haunch = g.createRadialGradient(72, 278, 2, 76, 284, 24);
  haunch.addColorStop(0, "rgba(255,210,160,0.35)");
  haunch.addColorStop(1, "rgba(255,210,160,0)");
  g.fillStyle = haunch;
  g.beginPath();
  g.ellipse(78, 284, 24, 16, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#8a4c28";
  g.lineWidth = 2;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(58, 294);
  g.quadraticCurveTo(76, 300, 98, 297);
  g.stroke();

  // 풍화로 생긴 가로 균열과 세로 틈 (몸통 안에서만)
  g.save();
  g.beginPath();
  g.moveTo(52, 300);
  g.quadraticCurveTo(46, 272, 70, 266);
  g.quadraticCurveTo(110, 260, 150, 260);
  g.lineTo(172, 258);
  g.quadraticCurveTo(178, 270, 176, 286);
  g.lineTo(52, 300);
  g.closePath();
  g.clip();
  // 몸통은 여러 시대에 덧댄 석회암 층이라 가로로 켜켜이 보이고, 위쪽은 많이 닳아 둥글게 패임
  strata(g, rnd, 44, 182, 262, 300, { light: "#ffd2a0", dark: "#5a2810", minH: 5, maxH: 8, shade: 0.2, tone: [0.04, 0.12] });
  mottle(g, rnd, 50, 178, 262, 300, 18, ["#6a3014", "#ffd8a8"]);
  // 군데군데 세로로 갈라진 틈: 짧고 굵기가 들쭉날쭉
  g.fillStyle = "rgba(70,30,10,0.35)";
  for (const x of [88, 112, 131, 150]) {
    const len = 4 + rnd() * 5;
    g.beginPath();
    g.moveTo(x, 262);
    g.lineTo(x + 1.2, 262 + len * 0.5);
    g.lineTo(x + 0.6, 262 + len);
    g.lineTo(x - 0.3, 262 + len * 0.4);
    g.closePath();
    g.fill();
  }
  // 등 위로 비친 노을빛
  const rim = g.createLinearGradient(0, 258, 0, 270);
  rim.addColorStop(0, "rgba(255,214,160,0.35)");
  rim.addColorStop(1, "rgba(255,214,160,0)");
  g.fillStyle = rim;
  g.fillRect(44, 256, 140, 14);
  g.restore();

  // 앞쪽 앞발 발가락
  g.strokeStyle = "rgba(80,35,12,0.5)";
  g.lineWidth = 0.6;
  for (const x of [226, 230, 234]) {
    g.beginPath();
    g.moveTo(x, 292);
    g.lineTo(x + 1, 298);
    g.stroke();
  }
  g.fillStyle = "rgba(80,35,12,0.3)";
  g.fillRect(176, 296, 60, 3);

  // 두건(네메스): 뒤에서 앞으로 둥글게, 양옆 자락은 어깨까지
  const nemes = g.createLinearGradient(156, 0, 192, 0);
  nemes.addColorStop(0, "#d6955c");
  nemes.addColorStop(1, "#b77442");
  g.fillStyle = nemes;
  g.beginPath();
  g.moveTo(156, 258);
  g.lineTo(158, 228);
  g.quadraticCurveTo(162, 212, 176, 211);
  g.quadraticCurveTo(188, 212, 190, 222);
  g.lineTo(191, 238);
  g.lineTo(186, 254);
  g.lineTo(180, 262);
  g.lineTo(170, 262);
  g.closePath();
  g.fill();
  // 두건 줄무늬: 머리 곡면을 따라 휘는 넓은 띠. 오랜 풍화로 흐려지고 군데군데 지워짐
  g.save();
  g.beginPath();
  g.moveTo(156, 258);
  g.lineTo(158, 228);
  g.quadraticCurveTo(162, 212, 176, 211);
  g.quadraticCurveTo(188, 212, 190, 222);
  g.lineTo(191, 238);
  g.lineTo(186, 254);
  g.lineTo(180, 262);
  g.lineTo(170, 262);
  g.closePath();
  g.clip();
  for (let k = 0; k < 10; k++) {
    const y = 214 + k * 4.6;
    // 띠 하나를 몇 조각으로 나눠, 조각마다 진하기를 달리하고 일부는 건너뜀
    for (let seg = 0; seg < 4; seg++) {
      if (rnd() < 0.2) continue;
      const x0 = 156 + seg * 6.5;
      const x1 = x0 + 6.5;
      const bend = (x) => y + 2 - Math.sin(((x - 156) / 26) * Math.PI) * 2.6;
      g.fillStyle = `rgba(110,52,22,${0.12 + rnd() * 0.16})`;
      g.beginPath();
      g.moveTo(x0, bend(x0));
      g.lineTo(x1, bend(x1));
      g.lineTo(x1, bend(x1) + 2);
      g.lineTo(x0, bend(x0) + 2);
      g.closePath();
      g.fill();
    }
  }
  // 두건 왼쪽 위로 받은 빛, 오른쪽 아래 그늘
  const nemesLight = g.createLinearGradient(156, 212, 190, 260);
  nemesLight.addColorStop(0, "rgba(255,220,170,0.3)");
  nemesLight.addColorStop(0.5, "rgba(255,220,170,0)");
  nemesLight.addColorStop(1, "rgba(60,25,8,0.25)");
  g.fillStyle = nemesLight;
  g.fillRect(150, 208, 45, 56);
  mottle(g, rnd, 156, 192, 212, 262, 14, ["#6a3014", "#ffd8a8"]);
  g.restore();

  // 얼굴: 해가 왼쪽 뒤에 있어 조금 그늘짐. 붉은 안료 흔적
  g.fillStyle = "#c27c4c";
  g.beginPath();
  g.moveTo(180, 223);
  g.lineTo(191, 224);
  g.lineTo(193, 238);
  g.lineTo(191, 246);
  g.lineTo(185, 252);
  g.lineTo(179, 248);
  g.closePath();
  g.fill();
  // 이마의 코브라 장식이 떨어져 나간 자리
  g.fillStyle = "#6a3012";
  g.beginPath();
  g.ellipse(188, 224.5, 1.3, 1, 0, 0, Math.PI * 2);
  g.fill();
  // 눈썹과 눈
  g.strokeStyle = "#5a2810";
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(182, 229);
  g.lineTo(189, 228.5);
  g.stroke();
  g.fillStyle = "#4a200a";
  g.beginPath();
  g.ellipse(186, 231.5, 2.2, 1, -0.1, 0, Math.PI * 2);
  g.fill();
  // 떨어져 나간 코: 거칠게 깨진 평평한 자리
  g.fillStyle = "#dca070";
  g.beginPath();
  g.moveTo(190, 234);
  g.lineTo(193.5, 236);
  g.lineTo(193, 240);
  g.lineTo(190.5, 241);
  g.lineTo(189.5, 237);
  g.closePath();
  g.fill();
  // 입
  g.strokeStyle = "#5a2810";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(186, 244.5);
  g.quadraticCurveTo(189, 245.5, 191.5, 244.5);
  g.stroke();
  // 두건과 얼굴 경계 그늘
  g.fillStyle = "rgba(70,30,10,0.35)";
  g.beginPath();
  g.moveTo(179, 222);
  g.lineTo(181, 223);
  g.lineTo(180, 250);
  g.lineTo(177, 252);
  g.closePath();
  g.fill();
}

// 사람을 태운 낙타 실루엣
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
  // 꼬리
  g.strokeStyle = "#42241a";
  g.lineWidth = 0.9;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x - 12.3, baseY - 15);
  g.quadraticCurveTo(x - 14.5, baseY - 11, x - 13.5, baseY - 8);
  g.stroke();

  // 탄 사람: 펄럭이는 옷자락, 머리를 감싼 천
  g.fillStyle = "#2e1a12";
  g.beginPath();
  g.moveTo(x - 4, baseY - 21);
  g.quadraticCurveTo(x - 3.5, baseY - 27, x - 1, baseY - 28.5);
  g.quadraticCurveTo(x + 1.6, baseY - 27, x + 2, baseY - 21);
  g.quadraticCurveTo(x + 3.5, baseY - 17, x + 2.5, baseY - 15);
  g.lineTo(x - 5, baseY - 15.5);
  g.closePath();
  g.fill();
  g.beginPath();
  g.ellipse(x - 0.8, baseY - 30, 1.8, 2.1, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#2e1a12";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(x - 2.2, baseY - 30);
  g.quadraticCurveTo(x - 4.5, baseY - 29, x - 5.5, baseY - 26);
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
  g.strokeStyle = "rgba(255,190,120,0.5)";
  g.lineWidth = 0.5;
  g.beginPath();
  g.moveTo(x - 1, baseY - 28.5);
  g.quadraticCurveTo(x - 3.5, baseY - 27, x - 4, baseY - 21);
  g.stroke();
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

export const egypt = {
  id: "egypt",
  label: "이집트 · 피라미드",
  title: "Pyramids of Giza",
  paint: paintEgypt,
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
