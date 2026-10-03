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
  pyramid(g, 150, 268, 32, 46, false);
  pyramid(g, 238, 270, 72, 108, true);
  pyramid(g, 312, 274, 60, 88, false);

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

  g.save();
  g.translate(128, 306);
  g.scale(1.6, 1.6);
  sphinx(g, 0, 0);
  g.restore();
  camel(g, 300, 304);

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

// 피라미드: 해를 받는 왼쪽 면은 밝고 오른쪽 면은 그늘. 돌단 줄무늬
function pyramid(g, cx, baseY, half, h, cap) {
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
}

// 스핑크스: 엎드린 사자 몸, 앞발, 두건(네메스)을 쓴 머리. 오른쪽을 바라봄
function sphinx(g, x, baseY) {
  const body = g.createLinearGradient(0, baseY - 30, 0, baseY);
  body.addColorStop(0, "#e2a468");
  body.addColorStop(1, "#8f4e28");
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(x - 46, baseY);
  g.quadraticCurveTo(x - 50, baseY - 14, x - 36, baseY - 18);
  g.lineTo(x + 12, baseY - 20);
  // 두건과 머리
  g.lineTo(x + 14, baseY - 34);
  g.quadraticCurveTo(x + 22, baseY - 42, x + 30, baseY - 34);
  g.lineTo(x + 31, baseY - 24);
  g.lineTo(x + 26, baseY - 18);
  // 앞발
  g.lineTo(x + 30, baseY - 8);
  g.lineTo(x + 54, baseY - 7);
  g.lineTo(x + 56, baseY);
  g.closePath();
  g.fill();

  // 두건 줄무늬와 얼굴 그늘
  g.strokeStyle = "rgba(110,55,25,0.45)";
  g.lineWidth = 0.6;
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    g.moveTo(x + 14 + k, baseY - 33 + k * 3);
    g.lineTo(x + 16 + k, baseY - 22 + k);
    g.stroke();
  }
  // 얼굴: 해가 왼쪽 뒤에 있어 얼굴은 그늘지고 눈매만 보임
  g.fillStyle = "rgba(80,35,12,0.5)";
  g.fillRect(x + 24, baseY - 33, 6.5, 12);
  g.fillStyle = "rgba(40,15,5,0.7)";
  g.fillRect(x + 26, baseY - 29, 3, 1);
  // 몸통 그림자
  g.fillStyle = "rgba(60,25,8,0.35)";
  g.beginPath();
  g.ellipse(x + 2, baseY, 52, 3, 0, 0, Math.PI * 2);
  g.fill();
  // 몸통 돌결
  g.strokeStyle = "rgba(110,55,25,0.3)";
  for (let y = baseY - 15; y < baseY; y += 4) {
    g.beginPath();
    g.moveTo(x - 44, y);
    g.lineTo(x + 12, y);
    g.stroke();
  }
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
