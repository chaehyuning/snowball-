// 중국: 가을 자금성 태화전과 은행나무, 흩날리는 은행잎

import { seeded, fillSilhouette, paintTree } from "./util.mjs";

const GINKGO = ["#ffd84a", "#f5c000", "#ffe682", "#eaa800", "#fff0a8"];
const GOLD_ROOF = ["#f6c838", "#d9a21c", "#a87410"];
const RED = ["#b8261c", "#962018", "#7a1810"];

function paintForbidden(g, globe, groundAt) {
  const rnd = seeded(1420);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 금빛 해 질 녘: 위는 푸르고 지붕 뒤로 갈수록 황금빛·주황빛
  const sky = g.createLinearGradient(0, top, 0, 270);
  sky.addColorStop(0, "#3f6fb5");
  sky.addColorStop(0.45, "#e9c372");
  sky.addColorStop(0.8, "#f6a845");
  sky.addColorStop(1, "#f58a32");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 태화전 뒤로 지는 해
  const sun = g.createRadialGradient(200, 200, 0, 200, 200, 150);
  sun.addColorStop(0, "rgba(255,244,200,0.95)");
  sun.addColorStop(0.2, "rgba(255,214,120,0.5)");
  sun.addColorStop(1, "rgba(255,190,90,0)");
  g.fillStyle = sun;
  g.fillRect(left, top, size, size);

  // 멀리 징산 언덕과 정자
  const hillY = (x) => 232 + 0.004 * (x - 200) ** 2;
  g.fillStyle = "#a9b79a";
  fillSilhouette(g, hillY, left, right, 400);
  g.fillStyle = GOLD_ROOF[1];
  g.beginPath();
  g.moveTo(190, 230);
  g.lineTo(200, 220);
  g.lineTo(210, 230);
  g.closePath();
  g.fill();
  g.fillStyle = RED[1];
  g.fillRect(194, 230, 12, 4);

  // 궁궐 담장: 붉은 벽에 노란 기와
  for (const [x0, x1] of [[left, 120], [280, right]]) {
    g.fillStyle = RED[0];
    g.fillRect(x0, 270, x1 - x0, 26);
    g.fillStyle = GOLD_ROOF[0];
    g.beginPath();
    g.moveTo(x0, 272);
    g.lineTo(x0, 266);
    g.lineTo(x1, 266);
    g.lineTo(x1 + 3, 272);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(0,0,0,0.12)";
    g.fillRect(x0, 272, x1 - x0, 2);
  }

  // 담장 뒤 은행나무 숲
  const ginkgo = { trunk: "#4a3622", shade: "#b07800", colors: GINKGO.slice(0, 4) };
  for (const tx of [70, 105, 300, 335]) paintTree(g, rnd, tx, 270, 22, -Math.PI / 2 + r(-0.25, 0.25), 3, 4, ginkgo);

  paintHall(g, 200, 300);

  // 앞쪽 큰 은행나무 두 그루
  paintTree(g, rnd, 24, 356, 48, -1.2, 8, 5, ginkgo);
  paintTree(g, rnd, 378, 358, 48, -1.95, 8, 5, ginkgo);

  // 맨 앞 흰 대리석 난간: 연꽃 머리 기둥 사이로 판이 이어짐 (가까워서 크고 또렷함)
  const railTop = 298;
  g.fillStyle = "#f4f1e8";
  g.fillRect(left, railTop + 4, size, 3);
  g.fillRect(left, railTop + 14, size, 4);
  for (let x = left + 4; x < right; x += 26) {
    g.fillStyle = "#ebe6da";
    g.fillRect(x + 4, railTop + 7, 18, 7);
    g.strokeStyle = "rgba(150,140,120,0.5)";
    g.lineWidth = 0.6;
    g.strokeRect(x + 6, railTop + 8.5, 14, 4);
    g.fillStyle = "#f8f6ef";
    g.fillRect(x - 2, railTop, 5, 20);
    g.beginPath();
    g.ellipse(x + 0.5, railTop - 1, 3.4, 3, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(140,130,110,0.35)";
    g.fillRect(x + 1.5, railTop + 1, 1.5, 19);
  }

  // 위에서 늘어진 버드나무 가지가 화면을 액자처럼 감쌈
  willow(g, rnd, left + 10, top + 40, 1);
  willow(g, rnd, right - 10, top + 40, -1);

  // 바닥: 은행잎이 깔린 돌마당
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#e9cf6e");
  floor.addColorStop(1, "#b48c2c");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  for (let i = 0; i < 420; i++) {
    const x = r(left, right);
    const y = groundAt(x) + r(1, 45);
    g.globalAlpha = r(0.55, 0.95);
    g.fillStyle = GINKGO[Math.floor(rnd() * GINKGO.length)];
    g.beginPath();
    g.ellipse(x, y, r(1.5, 3), r(0.8, 1.6), r(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  g.restore();
}

// 버드나무 가지: 위에서 아래로 늘어진 가는 줄기와 연둣빛 잎
function willow(g, rnd, x, y, dir) {
  for (let i = 0; i < 9; i++) {
    const sx = x + dir * i * 7;
    const len = 60 + rnd() * 70;
    const sway = dir * (8 + rnd() * 14);
    g.strokeStyle = "rgba(90,80,40,0.8)";
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(sx, y - 20);
    g.quadraticCurveTo(sx + sway, y + len * 0.4, sx + sway * 0.6, y + len);
    g.stroke();
    for (let t = 0.1; t < 1; t += 0.06) {
      const px = (1 - t) ** 2 * sx + 2 * (1 - t) * t * (sx + sway) + t * t * (sx + sway * 0.6);
      const py = (1 - t) ** 2 * (y - 20) + 2 * (1 - t) * t * (y + len * 0.4) + t * t * (y + len);
      g.fillStyle = ["#b8c44a", "#cfd35a", "#a9b440", "#e0d070"][Math.floor(rnd() * 4)];
      g.beginPath();
      g.ellipse(px + dir * 1.5, py, 1, 3, dir * 0.4, 0, Math.PI * 2);
      g.fill();
    }
  }
}

// 태화전: 3단 흰 대리석 기단, 붉은 기둥과 벽, 처마가 들린 2층 황금 지붕
function paintHall(g, cx, ground) {
  // 기단: 흰 대리석 세 단. 단마다 앞으로 튀어나온 턱 밑에 그늘, 난간 기둥은 둥근 머리
  const tiers = [
    [280, 9],
    [250, 8],
    [222, 8],
  ];
  let y = ground;
  for (const [w, h] of tiers) {
    const marble = g.createLinearGradient(0, y - h, 0, y);
    marble.addColorStop(0, "#fbfaf5");
    marble.addColorStop(0.7, "#e6e2d6");
    marble.addColorStop(1, "#c9c4b4");
    g.fillStyle = marble;
    g.fillRect(cx - w / 2, y - h, w, h);
    // 턱 밑 그늘
    const lip = g.createLinearGradient(0, y - h + 1, 0, y - h + 4);
    lip.addColorStop(0, "rgba(90,80,60,0.35)");
    lip.addColorStop(1, "rgba(90,80,60,0)");
    g.fillStyle = lip;
    g.fillRect(cx - w / 2, y - h + 1, w, 3);
    // 빗물 빼는 이무기 머리 자리
    g.fillStyle = "rgba(110,100,80,0.55)";
    for (let x = cx - w / 2 + 6; x < cx + w / 2; x += 12) g.fillRect(x, y - h + 2, 1.6, 1);
    // 난간: 가는 손잡이 + 둥근 머리 기둥
    g.fillStyle = "#d9d4c6";
    g.fillRect(cx - w / 2, y - h - 1.2, w, 0.9);
    for (let x = cx - w / 2 + 2; x < cx + w / 2; x += 4) {
      g.fillStyle = "#cfc9b9";
      g.fillRect(x, y - h - 2.6, 1.1, 2.6);
      g.fillStyle = "#f6f3ea";
      g.beginPath();
      g.arc(x + 0.55, y - h - 2.8, 0.75, 0, Math.PI * 2);
      g.fill();
    }
    y -= h + 1;
  }
  // 가운데 계단: 디딤판은 밝고 챌판은 그늘. 가운데는 용을 새긴 경사로
  for (let sy = y; sy < ground; sy += 2) {
    g.fillStyle = "#f3f0e8";
    g.fillRect(cx - 14, sy, 28, 1);
    g.fillStyle = "#d3cdbd";
    g.fillRect(cx - 14, sy + 1, 28, 1);
  }
  const ramp = g.createLinearGradient(cx - 5, 0, cx + 5, 0);
  ramp.addColorStop(0, "#d8d2c2");
  ramp.addColorStop(0.5, "#f7f4ec");
  ramp.addColorStop(1, "#c7c0ae");
  g.fillStyle = ramp;
  g.fillRect(cx - 5, y, 10, ground - y);
  g.fillStyle = "rgba(150,135,105,0.35)";
  for (let sy = y + 3; sy < ground - 2; sy += 5) {
    g.beginPath();
    g.ellipse(cx + (sy % 10 < 5 ? -1.5 : 1.5), sy, 2.2, 1.2, 0, 0, Math.PI * 2);
    g.fill();
  }

  // 1층 몸체: 붉은 기둥과 금빛 격자문
  const bodyTop = y - 30;
  const wall = g.createLinearGradient(0, bodyTop, 0, bodyTop + 30);
  wall.addColorStop(0, RED[2]);
  wall.addColorStop(0.35, RED[0]);
  wall.addColorStop(1, RED[1]);
  g.fillStyle = wall;
  g.fillRect(cx - 82, bodyTop, 164, 30);
  const bay = 164 / 11;
  for (let i = 0; i <= 11; i++) {
    const x = cx - 82 + i * bay;
    // 둥근 기둥: 왼쪽에 빛, 오른쪽에 그늘
    const col = g.createLinearGradient(x - 1.4, 0, x + 1.4, 0);
    col.addColorStop(0, "#d24434");
    col.addColorStop(0.5, RED[1]);
    col.addColorStop(1, RED[2]);
    g.fillStyle = col;
    g.fillRect(x - 1.4, bodyTop, 2.8, 30);
    if (i < 11) {
      // 문짝: 안쪽으로 들어가 위가 어둡고, 위는 마름모 격자 창살, 아래는 판문
      const dx = x + 2.4;
      const dw = bay - 4.8;
      const door = g.createLinearGradient(0, bodyTop + 7, 0, bodyTop + 29);
      door.addColorStop(0, "#8a5a18");
      door.addColorStop(0.5, "#c58a2a");
      door.addColorStop(1, "#a8701e");
      g.fillStyle = door;
      g.fillRect(dx, bodyTop + 7, dw, 22);
      g.save();
      g.beginPath();
      g.rect(dx + 0.6, bodyTop + 8, dw - 1.2, 13);
      g.clip();
      g.strokeStyle = "rgba(255,226,150,0.55)";
      g.lineWidth = 0.35;
      for (let d = -14; d < dw + 14; d += 2.2) {
        g.beginPath();
        g.moveTo(dx + d, bodyTop + 8);
        g.lineTo(dx + d + 13, bodyTop + 21);
        g.moveTo(dx + d, bodyTop + 21);
        g.lineTo(dx + d + 13, bodyTop + 8);
        g.stroke();
      }
      g.restore();
      g.fillStyle = "rgba(70,35,5,0.45)";
      g.fillRect(dx, bodyTop + 21.5, dw, 0.8);
      g.fillRect(dx + dw / 2 - 0.3, bodyTop + 7, 0.6, 22);
    }
  }
  // 처마가 드리운 깊은 그늘
  const eaveShadow = g.createLinearGradient(0, bodyTop, 0, bodyTop + 12);
  eaveShadow.addColorStop(0, "rgba(40,10,5,0.55)");
  eaveShadow.addColorStop(1, "rgba(40,10,5,0)");
  g.fillStyle = eaveShadow;
  g.fillRect(cx - 82, bodyTop, 164, 12);

  // 처마 밑 단청 띠: 청록 바탕에 가는 금선과 작은 무늬
  g.fillStyle = "#24584a";
  g.fillRect(cx - 84, bodyTop - 4, 168, 4);
  g.fillStyle = "#3d7fa0";
  for (let x = cx - 84; x < cx + 84; x += 6) {
    g.beginPath();
    g.ellipse(x + 3, bodyTop - 2, 2, 1, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "rgba(240,200,110,0.7)";
  g.fillRect(cx - 84, bodyTop - 4, 168, 0.5);
  g.fillRect(cx - 84, bodyTop - 0.5, 168, 0.5);

  // 아래 지붕
  roof(g, cx, bodyTop - 2, 210, 168, 16);
  // 2층 몸체
  const upper = bodyTop - 18 - 10;
  g.fillStyle = RED[0];
  g.fillRect(cx - 66, upper, 132, 10);
  const upShadow = g.createLinearGradient(0, upper, 0, upper + 6);
  upShadow.addColorStop(0, "rgba(40,10,5,0.5)");
  upShadow.addColorStop(1, "rgba(40,10,5,0)");
  g.fillStyle = upShadow;
  g.fillRect(cx - 66, upper, 132, 6);
  g.fillStyle = "#24584a";
  g.fillRect(cx - 68, upper - 3, 136, 3);
  g.fillStyle = "rgba(240,200,110,0.7)";
  g.fillRect(cx - 68, upper - 3, 136, 0.5);
  // 위 지붕(우진각 지붕): 처마 끝이 들림, 용마루와 양끝 장식
  roof(g, cx, upper - 1, 186, 96, 34);
  const ridgeY = upper - 1 - 34;
  const ridge = g.createLinearGradient(0, ridgeY - 3.5, 0, ridgeY);
  ridge.addColorStop(0, GOLD_ROOF[0]);
  ridge.addColorStop(1, GOLD_ROOF[2]);
  g.fillStyle = ridge;
  g.fillRect(cx - 48, ridgeY - 3.5, 96, 3.5);
  // 용마루 끝의 치문: 꼬리를 말아 올린 짐승 머리
  for (const dir of [-1, 1]) {
    const ex = cx + dir * 48;
    g.fillStyle = GOLD_ROOF[2];
    g.beginPath();
    g.moveTo(ex, ridgeY);
    g.lineTo(ex, ridgeY - 4);
    g.quadraticCurveTo(ex + dir * 1, ridgeY - 11, ex + dir * 5, ridgeY - 10);
    g.quadraticCurveTo(ex + dir * 2.5, ridgeY - 8, ex + dir * 3.5, ridgeY - 5);
    g.quadraticCurveTo(ex + dir * 5, ridgeY - 2, ex + dir * 3, ridgeY);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(255,236,170,0.6)";
    g.fillRect(ex - (dir > 0 ? 0 : 1), ridgeY - 9, 1, 6);
  }
}

// 황금 기와 지붕: 아래 폭 bottomW, 위 폭 topW, 높이 h. 처마 양끝이 위로 휨.
// 기와는 볼록한 수키와(밝고 굵게)와 오목한 암키와 골(어둡고 가늘게)이 번갈아 내려옴
function roof(g, cx, baseY, bottomW, topW, h) {
  const grad = g.createLinearGradient(0, baseY - h, 0, baseY);
  grad.addColorStop(0, GOLD_ROOF[0]);
  grad.addColorStop(1, GOLD_ROOF[1]);
  g.fillStyle = grad;
  const bl = cx - bottomW / 2;
  const br = cx + bottomW / 2;
  function shape() {
    g.beginPath();
    g.moveTo(bl - 6, baseY - 8);
    g.quadraticCurveTo(bl + 16, baseY + 2, cx, baseY + 1);
    g.quadraticCurveTo(br - 16, baseY + 2, br + 6, baseY - 8);
    g.quadraticCurveTo(br - 14, baseY - h * 0.45, cx + topW / 2, baseY - h);
    g.lineTo(cx - topW / 2, baseY - h);
    g.quadraticCurveTo(bl + 14, baseY - h * 0.45, bl - 6, baseY - 8);
    g.closePath();
  }
  // 처마 밑으로 떨어지는 그림자
  g.save();
  g.shadowColor = "rgba(40,15,0,0.45)";
  g.shadowBlur = 5;
  g.shadowOffsetY = 3;
  shape();
  g.fill();
  g.restore();

  g.save();
  shape();
  g.clip();
  for (let x = bl - 10, i = 0; x < br + 10; x += 2.2, i++) {
    const tx = cx + (x - cx) * (topW / bottomW);
    if (i % 2 === 0) {
      g.strokeStyle = "rgba(255,236,160,0.45)";
      g.lineWidth = 0.9;
    } else {
      g.strokeStyle = "rgba(120,70,0,0.45)";
      g.lineWidth = 0.45;
    }
    g.beginPath();
    g.moveTo(tx, baseY - h);
    g.quadraticCurveTo(tx + (x - tx) * 0.4, baseY - h * 0.4, x, baseY + 2);
    g.stroke();
  }
  // 내림마루: 용마루 끝에서 처마 귀퉁이로 내려오는 굵은 마루와 잡상 줄
  for (const dir of [-1, 1]) {
    const sx = cx + (dir * topW) / 2;
    const ex = dir > 0 ? br + 6 : bl - 6;
    g.strokeStyle = GOLD_ROOF[2];
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(sx, baseY - h);
    g.quadraticCurveTo(cx + dir * (bottomW / 2 - 14), baseY - h * 0.45, ex, baseY - 8);
    g.stroke();
    g.fillStyle = GOLD_ROOF[2];
    for (let k = 0.72; k < 0.95; k += 0.05) {
      const px = sx + (ex - sx) * k;
      const py = baseY - h + (h - 8) * Math.pow(k, 1.4);
      g.beginPath();
      g.arc(px, py - 1.2, 0.8, 0, Math.PI * 2);
      g.fill();
    }
  }
  // 햇빛을 받는 왼쪽 면
  const light = g.createLinearGradient(bl, 0, br, 0);
  light.addColorStop(0, "rgba(255,245,200,0.25)");
  light.addColorStop(1, "rgba(80,40,0,0.2)");
  g.fillStyle = light;
  g.fillRect(bl - 10, baseY - h - 2, bottomW + 20, h + 12);
  g.restore();
  // 처마 끝 막새: 둥근 기와 끝이 한 줄로 반짝임
  g.fillStyle = "rgba(255,230,150,0.75)";
  for (let x = bl + 2; x < br - 2; x += 2.6) {
    const t = (x - bl) / bottomW;
    const ey = baseY + 1 - 9 * Math.pow(Math.abs(t - 0.5) * 2, 3);
    g.beginPath();
    g.arc(x, ey, 0.6, 0, Math.PI * 2);
    g.fill();
  }
}

// 붉은 등: 처마 밑 여섯 개와, 앞쪽 은행나무 사이 줄에 매단 일곱 개
const EAVE_LANTERNS = [-90, -58, -26, 26, 58, 90].map((dx) => ({ x: 200 + dx, y: 241, len: 7, s: 0.8 }));
const STRING = { x0: 62, x1: 338, y: 262, sag: 22 };
const STRING_LANTERNS = Array.from({ length: 7 }, (_, i) => {
  const k = (i + 1) / 8;
  const x = STRING.x0 + (STRING.x1 - STRING.x0) * k;
  return { x, y: STRING.y + STRING.sag * 4 * k * (1 - k), len: 8, s: 1.1 };
});

let lanternGlow = null;
function glowSprite() {
  if (!lanternGlow) {
    lanternGlow = document.createElement("canvas");
    lanternGlow.width = lanternGlow.height = 64;
    const g = lanternGlow.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,170,90,0.9)");
    grad.addColorStop(0.35, "rgba(255,80,40,0.35)");
    grad.addColorStop(1, "rgba(255,60,30,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  }
  return lanternGlow;
}

function lantern(ctx, x, y, len, s, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = "#3a2a1a";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, len);
  ctx.stroke();
  ctx.translate(0, len + 7.5 * s);

  // 빛 번짐
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(glowSprite(), -18 * s, -18 * s, 36 * s, 36 * s);
  ctx.globalCompositeOperation = "source-over";

  // 둥근 몸통과 세로 살
  const body = ctx.createRadialGradient(-2 * s, -2 * s, 1, 0, 0, 8 * s);
  body.addColorStop(0, "#ff7a4a");
  body.addColorStop(0.6, "#e0281c");
  body.addColorStop(1, "#9a100a");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.5 * s, 7.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(120,10,5,0.6)";
  ctx.lineWidth = 0.5;
  for (const k of [-0.55, 0, 0.55]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 6.5 * s * Math.abs(k) + 0.01, 7.5 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 금색 위아래 마개와 술
  ctx.fillStyle = "#e8b030";
  ctx.fillRect(-3.5 * s, -8.3 * s, 7 * s, 1.8 * s);
  ctx.fillRect(-3.5 * s, 6.5 * s, 7 * s, 1.8 * s);
  ctx.strokeStyle = "#e8b030";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (const dx of [-1, 0, 1]) {
    ctx.moveTo(dx * s, 8.3 * s);
    ctx.lineTo(dx * 1.3 * s, 13 * s);
  }
  ctx.stroke();
  ctx.restore();
}

// 등은 늘 조금씩 흔들리고, 스노우볼을 터뜨려 물이 휘저어지면 크게 흔들림
function animateLanterns(ctx, t, globe, stir) {
  const swing = (phase) => Math.sin(t * 0.0025 + phase) * (0.06 + Math.min(stir, 5) * 0.09);

  ctx.save();
  // 은행나무 사이를 잇는 줄
  ctx.strokeStyle = "#3a2a1a";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(STRING.x0, STRING.y);
  ctx.quadraticCurveTo(200, STRING.y + STRING.sag * 2, STRING.x1, STRING.y);
  ctx.stroke();
  EAVE_LANTERNS.forEach((l, i) => lantern(ctx, l.x, l.y, l.len, l.s, swing(i * 1.7)));
  STRING_LANTERNS.forEach((l, i) => lantern(ctx, l.x, l.y, l.len, l.s, swing(i * 1.3 + 0.5)));
  ctx.restore();
}

// 금박 둘레 빛: 한 번 그려 두고 크기·밝기만 바꿔 붙임 (잎마다 매 프레임 그러데이션을 만들지 않게)
let haloSprite = null;
function foilHalo() {
  if (haloSprite) return haloSprite;
  haloSprite = document.createElement("canvas");
  haloSprite.width = haloSprite.height = 32;
  const g = haloSprite.getContext("2d");
  const halo = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  halo.addColorStop(0, "rgba(255,226,120,0.55)");
  halo.addColorStop(1, "rgba(255,200,60,0)");
  g.fillStyle = halo;
  g.fillRect(0, 0, 32, 32);
  return haloSprite;
}

// 은행잎: 가운데가 살짝 갈라진 부채꼴 잎과 잎자루
function drawGinkgo(ctx, p, t = 0) {
  const s = p.size;
  ctx.globalAlpha = p.settled ? 0.95 : 0.92;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(Math.max(0.2, Math.abs(Math.cos(p.flip))), 1);
  ctx.fillStyle = p.color;
  const a0 = -Math.PI * 0.82;
  const a1 = -Math.PI * 0.18;
  const mid = -Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, s, a0, mid - 0.09);
  ctx.lineTo(0, -s * 0.68);
  ctx.lineTo(Math.cos(mid + 0.09) * s, Math.sin(mid + 0.09) * s);
  ctx.arc(0, 0, s, mid + 0.09, a1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(150,100,0,0.6)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, s * 0.7);
  ctx.stroke();
  ctx.restore();
  // 금박 가루: 날리는 잎 둘레로 작은 금빛 조각이 찰랑이며 번쩍임 (바닥에 내려앉으면 은은하게만)
  const n = p.settled ? 1 : 3;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const ph = p.foil + i * 2.1;
    const glint = Math.max(0, Math.sin(t * 0.006 + ph));
    if (glint < 0.35) continue;
    const ang = t * 0.002 * (i % 2 ? 1 : -1) + ph;
    const dist = s * (0.9 + 0.5 * Math.sin(ph * 1.7));
    const gx = p.x + Math.cos(ang) * dist;
    const gy = p.y + Math.sin(ang) * dist;
    const a = (glint - 0.35) / 0.65;
    ctx.globalAlpha = a;
    ctx.drawImage(foilHalo(), gx - s * 0.6, gy - s * 0.6, s * 1.2, s * 1.2);
    // 네모난 금박 조각이 회전하며 빛을 받음
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(ang * 3);
    ctx.globalAlpha = 0.9 * a;
    ctx.fillStyle = i % 2 ? "#fff3b0" : "#ffd24a";
    const f = Math.max(0.6, s * 0.16);
    ctx.fillRect(-f, -f * 0.6, f * 2, f * 1.2);
    // 가장 밝을 때 십자 빛
    if (a > 0.8) {
      ctx.globalAlpha = (a - 0.8) * 4;
      ctx.fillStyle = "#fffbe8";
      ctx.fillRect(-f * 3, -0.25, f * 6, 0.5);
      ctx.fillRect(-0.25, -f * 3, 0.5, f * 6);
    }
    ctx.restore();
  }
  ctx.restore();
}

export const forbidden = {
  id: "china",
  label: "중국 · 자금성",
  title: "Forbidden City",
  paint: paintForbidden,
  animate: animateLanterns,
  glare: 0.9,
  base: {
    trim: ["#7a5a1c", "#f2d17a", "#c99a35", "#6b4d16"],
    plate: "故宫",
    plateFont: "600 17px 'Songti SC', 'STSong', 'SimSun', serif",
    plateInk: "#2b1d10",
  },
  // 은행잎은 단풍잎보다 작고 가벼워서 팔랑이며 천천히 내림
  particles: {
    count: 150,
    blend: "source-over",
    make(rand) {
      const size = rand(4, 6.5);
      return {
        size,
        color: GINKGO[Math.floor(rand(0, GINKGO.length))],
        foil: rand(0, Math.PI * 2),
        sink: 0.13 + size * 0.03 + rand(-0.03, 0.03),
        drag: rand(0.08, 0.12),
        inertia: rand(0.3, 0.6),
        grip: rand(0.45, 1.7),
        angle: rand(0, Math.PI * 2),
        spin: rand(-0.05, 0.05),
        flipSpeed: rand(0.03, 0.07),
        flutter: 0.03,
      };
    },
    draw: drawGinkgo,
  },
};
