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

  // 돌단
  g.strokeStyle = "rgba(110,55,25,0.25)";
  g.lineWidth = 0.5;
  for (let k = 1; k < 18; k++) {
    const y = apexY + (h * k) / 18;
    const w = (half * k) / 18;
    g.beginPath();
    g.moveTo(cx - w, y);
    g.lineTo(cx + w, y);
    g.stroke();
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
  g.strokeStyle = "rgba(90,40,15,0.35)";
  g.lineWidth = 0.7;
  for (let y = 272; y < 304; y += 5) {
    g.beginPath();
    g.moveTo(34, y);
    g.lineTo(255, y + 2);
    g.stroke();
  }

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
  g.strokeStyle = "rgba(80,35,12,0.45)";
  g.lineWidth = 0.9;
  for (const y of [268, 274, 280, 287, 294]) {
    g.beginPath();
    g.moveTo(44, y);
    for (let x = 44; x < 180; x += 6) g.lineTo(x, y + Math.sin(x * 0.3 + y) * 0.8);
    g.stroke();
  }
  g.lineWidth = 0.5;
  for (const x of [88, 112, 131, 150]) {
    g.beginPath();
    g.moveTo(x, 262);
    g.lineTo(x + 1.5, 270);
    g.stroke();
  }
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
  // 두건 줄무늬
  g.strokeStyle = "rgba(90,40,15,0.45)";
  g.lineWidth = 0.8;
  for (let k = 0; k < 9; k++) {
    const y = 216 + k * 4.5;
    g.beginPath();
    g.moveTo(158, y + 2);
    g.quadraticCurveTo(170, y - 1, 180, y + 1);
    g.stroke();
  }

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
  g.fillStyle = "#5c3420";
  g.strokeStyle = "#5c3420";
  g.beginPath();
  g.moveTo(x - 12, baseY - 12);
  g.quadraticCurveTo(x - 8, baseY - 24, x - 2, baseY - 14);
  g.quadraticCurveTo(x + 4, baseY - 22, x + 10, baseY - 13);
  g.lineTo(x + 14, baseY - 18);
  g.lineTo(x + 17, baseY - 24);
  g.lineTo(x + 21, baseY - 23);
  g.lineTo(x + 16, baseY - 14);
  g.lineTo(x + 10, baseY - 9);
  g.lineTo(x - 12, baseY - 9);
  g.closePath();
  g.fill();
  g.lineWidth = 1.3;
  for (const lx of [x - 9, x - 6, x + 6, x + 9]) {
    g.beginPath();
    g.moveTo(lx, baseY - 9);
    g.lineTo(lx + (lx > x ? 1 : -1), baseY);
    g.stroke();
  }
  // 탄 사람
  g.fillStyle = "#3a2216";
  g.fillRect(x - 3, baseY - 26, 4, 8);
  g.beginPath();
  g.arc(x - 1, baseY - 28, 2, 0, Math.PI * 2);
  g.fill();
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
    body: ["#1e0d05", "#6e3519", "#8a4a26", "#4e2510", "#160903"],
    collar: "#2a1308",
    trim: ["#7a5a1c", "#f2d17a", "#c99a35", "#6b4d16"],
    plate: "PYRAMIDS OF GIZA · EGYPT",
    plateFont: "600 11px 'Optima', 'Candara', sans-serif",
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
