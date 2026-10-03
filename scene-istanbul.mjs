// 터키: 해 질 녘 이스탄불 블루 모스크(술탄 아흐메트 모스크), 초승달, 튤립, 날아다니는 나비

import { seeded, fillSilhouette, paintTree } from "./util.mjs";

const WING = ["#2ec4c9", "#1f8fd6", "#7fe3d6", "#0fa3a3", "#bff3ff"];
const STONE = "#e8dcc4";
const LEAD = ["#9fb4c8", "#6f87a0", "#4d6680"]; // 납판 돔: 밝은 쪽 → 그늘

let mahya = []; // 첨탑 사이에 건 등불 줄 (animate에서 깜빡임)

function paintIstanbul(g, globe, groundAt) {
  const rnd = seeded(1616);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 해 질 녘: 위는 짙은 남청, 가운데는 청록, 지평선은 모래빛
  const sky = g.createLinearGradient(0, top, 0, 275);
  sky.addColorStop(0, "#0f2a4a");
  sky.addColorStop(0.45, "#1d6a7a");
  sky.addColorStop(0.8, "#86cdbf");
  sky.addColorStop(1, "#f1e0bc");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(255,255,255,${r(0.3, 0.8)})`;
    g.beginPath();
    g.arc(r(left, right), r(top, 140), r(0.3, 0.9), 0, Math.PI * 2);
    g.fill();
  }

  // 초승달과 별
  g.fillStyle = "#fff6d8";
  g.beginPath();
  g.arc(300, 92, 13, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  g.arc(305, 89, 11, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = "source-over";
  star(g, 318, 92, 4, "#fff6d8");

  // 멀리 아시아 쪽 기슭과 보스포루스 해협 (멀어서 흐릿함)
  g.fillStyle = "rgba(70,120,130,0.7)";
  fillSilhouette(g, (x) => 236 + 4 * Math.sin(x * 0.04), left, right, 400);
  const sea = g.createLinearGradient(0, 240, 0, 258);
  sea.addColorStop(0, "#7cc4bc");
  sea.addColorStop(1, "#3f8f94");
  g.fillStyle = sea;
  g.fillRect(left, 240, size, 18);

  // 갈매기
  g.strokeStyle = "rgba(255,255,255,0.8)";
  g.lineWidth = 1;
  for (const [bx, by, s] of [[110, 150, 1], [128, 162, 0.8], [262, 132, 0.7], [90, 172, 0.6]]) {
    g.beginPath();
    g.moveTo(bx - 5 * s, by);
    g.quadraticCurveTo(bx - 2 * s, by - 3 * s, bx, by);
    g.quadraticCurveTo(bx + 2 * s, by - 3 * s, bx + 5 * s, by);
    g.stroke();
  }

  // 언덕 위 모스크: 공원 너머에 있어서 작게 그림
  const MOSQUE = { x: 200, y: 262, s: 0.78 };
  g.save();
  g.translate(MOSQUE.x, MOSQUE.y);
  g.scale(MOSQUE.s, MOSQUE.s);
  paintMosque(g, 0, 0);
  g.restore();
  mahya = mahya.map((l) => ({ ...l, x: MOSQUE.x + l.x * MOSQUE.s, y: MOSQUE.y + l.y * MOSQUE.s }));

  // 모스크와 공원 사이 옅은 저녁 안개
  const mist = g.createLinearGradient(0, 248, 0, 272);
  mist.addColorStop(0, "rgba(200,235,225,0)");
  mist.addColorStop(1, "rgba(200,235,225,0.35)");
  g.fillStyle = mist;
  g.fillRect(left, 248, size, 24);

  // 술탄아흐메트 공원: 잔디와 돌길
  const lawn = g.createLinearGradient(0, 262, 0, 335);
  lawn.addColorStop(0, "#5f9a74");
  lawn.addColorStop(1, "#2f5e46");
  g.fillStyle = lawn;
  g.fillRect(left, 262, size, 80);
  g.fillStyle = "#d9cdb4";
  g.beginPath();
  g.moveTo(186, 262);
  g.lineTo(214, 262);
  g.lineTo(250, 335);
  g.lineTo(150, 335);
  g.closePath();
  g.fill();

  // 공원 분수: 원근이 잡힌 둥근 연못, 가운데 물기둥과 둘레 물줄기
  g.fillStyle = "#cfc3aa";
  g.beginPath();
  g.ellipse(200, 292, 66, 12, 0, 0, Math.PI * 2);
  g.fill();
  const water = g.createLinearGradient(0, 282, 0, 302);
  water.addColorStop(0, "#7fd6cf");
  water.addColorStop(1, "#2e9aa0");
  g.fillStyle = water;
  g.beginPath();
  g.ellipse(200, 292, 60, 9.5, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(240,255,255,0.75)";
  g.lineCap = "round";
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const bx = 200 + Math.cos(a) * 46;
    const by = 292 + Math.sin(a) * 7;
    g.lineWidth = Math.sin(a) > 0 ? 1.4 : 0.9;
    g.beginPath();
    g.moveTo(bx, by);
    g.quadraticCurveTo(200 + Math.cos(a) * 30, by - 14, 200 + Math.cos(a) * 16, 292 + Math.sin(a) * 2.5);
    g.stroke();
  }
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(200, 292);
  g.lineTo(200, 266);
  g.stroke();

  // 튤립 화단 (원근이 잡힌 타원 꽃밭)
  tulips(g, rnd, 112, 314, 30);
  tulips(g, rnd, 288, 314, 30);

  // 앞쪽 큰 플라타너스와 오스만식 가로등 (가까워서 크고 진하게)
  const plane = { trunk: "#4a3a2a", shade: "#2a5236", colors: ["#3f7a4a", "#4f8f56", "#5fa060", "#356a40"] };
  paintTree(g, rnd, 22, 352, 50, -1.3, 8, 5, plane);
  paintTree(g, rnd, 378, 354, 50, -1.85, 8, 5, plane);
  lamp(g, 86, 330, 78);
  lamp(g, 314, 330, 78);

  // 바닥: 터키 블루 타일 무늬가 있는 마당
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#e6dccb");
  floor.addColorStop(1, "#a99b84");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  g.strokeStyle = "rgba(31,143,170,0.35)";
  g.lineWidth = 0.8;
  for (let x = left; x < right; x += 14) {
    for (let y = floorTop + 6; y < floorTop + 60; y += 10) {
      if (y < groundAt(x) + 3) continue;
      g.beginPath();
      g.moveTo(x, y - 3);
      g.lineTo(x + 3, y);
      g.lineTo(x, y + 3);
      g.lineTo(x - 3, y);
      g.closePath();
      g.stroke();
    }
  }

  g.restore();
}

// 오스만식 가로등: 검은 기둥 위 초롱
function lamp(g, x, baseY, h) {
  const topY = baseY - h;
  g.fillStyle = "#1f2a2c";
  g.fillRect(x - 2.5, baseY - 8, 5, 8);
  g.fillRect(x - 1.2, topY + 12, 2.4, h - 20);
  const glow = g.createRadialGradient(x, topY + 6, 0, x, topY + 6, 22);
  glow.addColorStop(0, "rgba(255,220,150,0.7)");
  glow.addColorStop(1, "rgba(255,220,150,0)");
  g.fillStyle = glow;
  g.fillRect(x - 22, topY - 16, 44, 44);
  g.fillStyle = "#ffe0a0";
  g.beginPath();
  g.ellipse(x, topY + 6, 4, 6, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#1f2a2c";
  g.beginPath();
  g.moveTo(x - 5, topY);
  g.quadraticCurveTo(x, topY - 8, x + 5, topY);
  g.closePath();
  g.fill();
  g.fillRect(x - 0.5, topY - 11, 1, 4);
}

function star(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

// 반구형 돔: 납판 결과 꼭대기 초승달 장식
function dome(g, x, baseY, rx, ry, finial) {
  const grad = g.createRadialGradient(x - rx * 0.4, baseY - ry * 0.8, 1, x, baseY, rx * 1.2);
  grad.addColorStop(0, LEAD[0]);
  grad.addColorStop(0.6, LEAD[1]);
  grad.addColorStop(1, LEAD[2]);
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(x, baseY, rx, ry, 0, Math.PI, 0);
  g.closePath();
  g.fill();
  // 납판 이음매: 꼭대기 쪽은 가늘고 흐리게, 아래로 갈수록 굵고 또렷하게
  g.save();
  g.clip();
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue;
    const ex = x + (k * rx) / 4.4;
    for (let seg = 0; seg < 3; seg++) {
      const t0 = seg / 3;
      const t1 = (seg + 1) / 3;
      const px = (t) => x + (ex - x) * Math.sin((t * Math.PI) / 2);
      const py = (t) => baseY - ry + ry * t;
      g.strokeStyle = `rgba(40,60,85,${0.12 + t1 * 0.2})`;
      g.lineWidth = 0.25 + t1 * 0.45;
      g.beginPath();
      g.moveTo(px(t0), py(t0));
      g.lineTo(px(t1), py(t1));
      g.stroke();
    }
  }
  // 노을이 비친 왼쪽 위 반짝임
  const sheen = g.createRadialGradient(x - rx * 0.45, baseY - ry * 0.75, 0, x - rx * 0.45, baseY - ry * 0.75, rx * 0.6);
  sheen.addColorStop(0, "rgba(255,236,210,0.35)");
  sheen.addColorStop(1, "rgba(255,236,210,0)");
  g.fillStyle = sheen;
  g.fillRect(x - rx, baseY - ry, rx * 2, ry);
  g.restore();
  // 돔 아래 밝은 돌 테
  g.fillStyle = "#efe4cf";
  g.fillRect(x - rx - 0.5, baseY - 1.2, rx * 2 + 1, 1.4);
  if (finial) {
    g.fillStyle = "#e0b040";
    g.fillRect(x - 0.6, baseY - ry - 7, 1.2, 7);
    g.beginPath();
    g.arc(x, baseY - ry - 9, 2.2, 0.3, Math.PI * 2 - 0.3);
    g.lineWidth = 1;
    g.strokeStyle = "#e0b040";
    g.stroke();
  }
}

// 첨탑: 세로 홈이 파인 가는 원기둥, 그늘이 진 발코니, 뾰족한 납 지붕
// far: 뒤쪽 첨탑일수록 1에 가까움. 저녁 공기에 묻혀 흐리게 그림
function minaret(g, x, baseY, h, balconies, far = 0) {
  g.save();
  g.globalAlpha = 1 - far * 0.45;
  const w = 5 - far * 1.5;
  const grad = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  grad.addColorStop(0, "#f7eedd");
  grad.addColorStop(0.35, "#efe3cc");
  grad.addColorStop(1, "#ad9a80");
  g.fillStyle = grad;
  g.fillRect(x - w / 2, baseY - h, w, h);
  // 세로 홈
  g.fillStyle = "rgba(120,100,80,0.18)";
  for (let k = 1; k < 4; k++) g.fillRect(x - w / 2 + (w * k) / 4 - 0.15, baseY - h, 0.3, h);
  // 바닥 쪽 굵은 받침
  g.fillStyle = "rgba(120,100,80,0.25)";
  g.fillRect(x - w / 2 - 0.6, baseY - 10, w + 1.2, 10);
  for (let i = 0; i < balconies; i++) {
    const y = baseY - h * (0.45 + i * 0.18);
    // 발코니 밑 받침의 그늘 → 발코니 판 → 난간
    const under = g.createLinearGradient(0, y + 2, 0, y + 5);
    under.addColorStop(0, "rgba(70,55,40,0.5)");
    under.addColorStop(1, "rgba(70,55,40,0)");
    g.fillStyle = under;
    g.beginPath();
    g.moveTo(x - w / 2 - 1.8, y + 2);
    g.lineTo(x + w / 2 + 1.8, y + 2);
    g.lineTo(x + w / 2, y + 5);
    g.lineTo(x - w / 2, y + 5);
    g.closePath();
    g.fill();
    g.fillStyle = "#e6dac2";
    g.fillRect(x - w / 2 - 1.8, y, w + 3.6, 2);
    g.fillStyle = "rgba(255,248,235,0.7)";
    g.fillRect(x - w / 2 - 1.8, y, w + 3.6, 0.5);
    g.fillStyle = "rgba(90,75,60,0.45)";
    for (let px = x - w / 2 - 1.4; px < x + w / 2 + 1.6; px += 1.2) g.fillRect(px, y - 1.2, 0.35, 1.2);
    g.fillRect(x - w / 2 - 1.8, y - 1.4, w + 3.6, 0.35);
  }
  const cone = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  cone.addColorStop(0, LEAD[0]);
  cone.addColorStop(0.45, LEAD[1]);
  cone.addColorStop(1, LEAD[2]);
  g.fillStyle = cone;
  g.beginPath();
  g.moveTo(x - w / 2 - 0.5, baseY - h);
  g.lineTo(x, baseY - h - 22);
  g.lineTo(x + w / 2 + 0.5, baseY - h);
  g.closePath();
  g.fill();
  g.fillStyle = "#e0b040";
  g.fillRect(x - 0.4, baseY - h - 27, 0.8, 5);
  g.restore();
}

// 돌벽: 노을을 받는 왼쪽이 따뜻하게 밝고, 위 처마 밑은 그늘, 가로 돌단은 밝기 차이로만 보임
function stoneWall(g, x, y, w, h) {
  const wall = g.createLinearGradient(x, 0, x + w, 0);
  wall.addColorStop(0, "#f3e6cb");
  wall.addColorStop(0.5, STONE);
  wall.addColorStop(1, "#cbbb9e");
  g.fillStyle = wall;
  g.fillRect(x, y, w, h);
  let odd = false;
  for (let by = y + 3; by < y + h; by += 3.4) {
    g.fillStyle = odd ? "rgba(255,250,235,0.12)" : "rgba(120,100,75,0.08)";
    g.fillRect(x, by, w, 1.7);
    odd = !odd;
  }
  const eave = g.createLinearGradient(0, y, 0, y + 4);
  eave.addColorStop(0, "rgba(80,60,40,0.4)");
  eave.addColorStop(1, "rgba(80,60,40,0)");
  g.fillStyle = eave;
  g.fillRect(x, y, w, 4);
}

// 아치 창: 밝은 돌 테두리 안에 깊게 들어간 어두운 유리. lit이면 안쪽 등불이 비침
function archWindow(g, wx, wy, ww, wh, lit) {
  g.fillStyle = "#f6ecd8";
  g.beginPath();
  g.moveTo(wx - ww / 2 - 0.7, wy + wh);
  g.lineTo(wx - ww / 2 - 0.7, wy + ww * 0.5);
  g.quadraticCurveTo(wx, wy - ww * 0.6, wx + ww / 2 + 0.7, wy + ww * 0.5);
  g.lineTo(wx + ww / 2 + 0.7, wy + wh);
  g.closePath();
  g.fill();
  const glass = g.createLinearGradient(0, wy, 0, wy + wh);
  glass.addColorStop(0, lit ? "#f2c27a" : "#24394d");
  glass.addColorStop(1, lit ? "#b8743a" : "#3e5d78");
  g.fillStyle = glass;
  g.beginPath();
  g.moveTo(wx - ww / 2, wy + wh);
  g.lineTo(wx - ww / 2, wy + ww * 0.5);
  g.quadraticCurveTo(wx, wy - ww * 0.4, wx + ww / 2, wy + ww * 0.5);
  g.lineTo(wx + ww / 2, wy + wh);
  g.closePath();
  g.fill();
  // 깊이: 왼쪽 안쪽 벽의 그늘
  g.fillStyle = "rgba(20,25,35,0.35)";
  g.fillRect(wx - ww / 2, wy + ww * 0.4, ww * 0.25, wh - ww * 0.4);
}

// 블루 모스크: 작은 돔 → 반돔 → 큰 돔이 층층이 쌓이고, 첨탑 여섯 개가 둘러섬
function paintMosque(g, cx, baseY) {
  // 마당 바깥쪽 첨탑 두 개 (가장 멀어서 흐리게)
  minaret(g, cx - 128, baseY, 118, 2, 0.8);
  minaret(g, cx + 128, baseY, 118, 2, 0.8);

  // 아래 벽: 돌단, 벽기둥, 두 줄 아치 창
  stoneWall(g, cx - 84, baseY - 34, 168, 34);
  for (let i = 0; i <= 7; i++) {
    const px = cx - 84 + (i * 168) / 7;
    g.fillStyle = "rgba(255,250,235,0.35)";
    g.fillRect(px - 1.6, baseY - 32, 1, 32);
    g.fillStyle = "rgba(110,90,65,0.22)";
    g.fillRect(px - 0.6, baseY - 32, 1.4, 32);
  }
  for (const [n, wy, wh] of [[14, baseY - 27, 7], [12, baseY - 15, 9]]) {
    for (let i = 0; i < n; i++) {
      const wx = cx - 78 + (i * 156) / (n - 1);
      archWindow(g, wx, wy, 3.6, wh, (i * 7 + n) % 5 === 0);
    }
  }
  // 처마 돌림띠
  g.fillStyle = "#f4ead6";
  g.fillRect(cx - 85, baseY - 35, 170, 1.4);

  // 모서리 작은 돔들
  for (const dx of [-70, -46, 46, 70]) dome(g, cx + dx, baseY - 34, 11, 10, true);
  // 반돔 두 개와 그 아래 벽
  stoneWall(g, cx - 58, baseY - 46, 116, 12);
  for (let i = 0; i < 9; i++) archWindow(g, cx - 48 + i * 12, baseY - 43, 2.6, 6, i % 4 === 1);
  dome(g, cx - 34, baseY - 46, 24, 20, false);
  dome(g, cx + 34, baseY - 46, 24, 20, false);
  // 큰 돔의 드럼: 아치 창이 빙 둘리고, 가장자리 창은 비스듬해서 좁게 보임
  stoneWall(g, cx - 34, baseY - 64, 68, 16);
  for (let i = 0; i < 11; i++) {
    const a = ((i + 0.5) / 11) * Math.PI;
    const wx = cx - Math.cos(a) * 31;
    archWindow(g, wx, baseY - 61, 2.6 * Math.sin(a) + 0.6, 8, i === 5);
  }
  // 드럼을 받치는 작은 탑(버팀벽 위 뾰족 지붕)
  for (const dx of [-36, 36]) {
    g.fillStyle = "#e6d9bf";
    g.fillRect(cx + dx - 2, baseY - 70, 4, 10);
    g.fillStyle = LEAD[1];
    g.beginPath();
    g.moveTo(cx + dx - 2.6, baseY - 70);
    g.lineTo(cx + dx, baseY - 76);
    g.lineTo(cx + dx + 2.6, baseY - 70);
    g.closePath();
    g.fill();
  }
  // 가운데 큰 돔
  dome(g, cx, baseY - 64, 38, 32, true);

  // 안쪽 첨탑 네 개: 뒤쪽 두 개는 조금 작고 흐리게, 앞쪽 두 개는 크고 진하게
  minaret(g, cx - 82, baseY, 126, 3, 0.5);
  minaret(g, cx + 82, baseY, 126, 3, 0.5);
  minaret(g, cx - 98, baseY, 142, 3, 0);
  minaret(g, cx + 98, baseY, 142, 3, 0);

  // 첨탑 사이 등불 줄(마흐야)
  mahya = [];
  for (const [x0, x1] of [[cx - 96, cx - 128], [cx + 96, cx + 128]]) {
    for (let i = 1; i < 8; i++) {
      const k = i / 8;
      mahya.push({ x: x0 + (x1 - x0) * k, y: baseY - 104 + 10 * 4 * k * (1 - k), phase: i * 0.9 });
    }
  }
  g.strokeStyle = "rgba(60,50,40,0.6)";
  g.lineWidth = 0.4;
  for (const [x0, x1] of [[cx - 96, cx - 128], [cx + 96, cx + 128]]) {
    g.beginPath();
    g.moveTo(x0, baseY - 104);
    g.quadraticCurveTo((x0 + x1) / 2, baseY - 84, x1, baseY - 104);
    g.stroke();
  }
}

// 튤립 화단: 빨강·노랑·보라 튤립
function tulips(g, rnd, x, baseY, w) {
  const r = (a, b) => a + rnd() * (b - a);
  for (let i = 0; i < 22; i++) {
    const tx = x + r(-w, w);
    const h = r(10, 18);
    const ty = baseY - h + r(-2, 4);
    g.strokeStyle = "#2f6b3a";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(tx, ty + h);
    g.lineTo(tx, ty);
    g.stroke();
    g.fillStyle = "#3f8a48";
    g.beginPath();
    g.ellipse(tx + 2, ty + h * 0.6, 1.4, 4, 0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = ["#d8263a", "#f2b632", "#9b4dca", "#ff6a8a"][Math.floor(rnd() * 4)];
    g.beginPath();
    g.moveTo(tx - 3, ty);
    g.lineTo(tx - 3, ty - 4);
    g.lineTo(tx - 1.5, ty - 2.5);
    g.lineTo(tx, ty - 5);
    g.lineTo(tx + 1.5, ty - 2.5);
    g.lineTo(tx + 3, ty - 4);
    g.lineTo(tx + 3, ty);
    g.quadraticCurveTo(tx, ty + 3, tx - 3, ty);
    g.fill();
  }
}

function animateIstanbul(ctx, t) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const l of mahya) {
    const on = 0.5 + 0.5 * Math.sin(t * 0.003 + l.phase);
    ctx.globalAlpha = 0.4 + 0.6 * on;
    ctx.fillStyle = "#ffd98a";
    ctx.beginPath();
    ctx.arc(l.x, l.y, 1.2 + on * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 나비: 몸통과 두 쌍의 날개. 날 때는 날개를 접었다 폈다 하고, 앉으면 반쯤 편 채로 쉼
// 날개 한 쪽(앞날개+뒷날개)을 색마다 한 번만 그려 둠.
// 몸 쪽은 짙고 가운데는 선명한 색, 바깥 가장자리는 검은 띠에 흰 점, 잎맥은 가는 짙은 선
const WING_U = 40;
const wingSprites = new Map();
function wingSprite(color) {
  if (wingSprites.has(color)) return wingSprites.get(color);
  const U = WING_U;
  const c = document.createElement("canvas");
  c.width = Math.ceil(U * 1.4);
  c.height = Math.ceil(U * 1.9);
  const w = c.getContext("2d");
  w.translate(0, U);
  const fore = () => {
    w.beginPath();
    w.moveTo(0, -0.05 * U);
    w.bezierCurveTo(0.2 * U, -0.75 * U, 0.9 * U, -1.0 * U, 1.25 * U, -0.8 * U);
    w.bezierCurveTo(1.3 * U, -0.45 * U, 1.0 * U, -0.1 * U, 0.55 * U, 0.02 * U);
    w.closePath();
  };
  const hind = () => {
    w.beginPath();
    w.moveTo(0, 0.02 * U);
    w.bezierCurveTo(0.45 * U, -0.02 * U, 0.95 * U, 0.15 * U, 0.85 * U, 0.5 * U);
    w.bezierCurveTo(0.75 * U, 0.75 * U, 0.4 * U, 0.85 * U, 0.15 * U, 0.75 * U);
    w.bezierCurveTo(0.05 * U, 0.55 * U, 0, 0.3 * U, 0, 0.02 * U);
    w.closePath();
  };
  for (const [shape, cx, cy] of [[hind, 0.1, 0.25], [fore, 0.15, -0.3]]) {
    const grad = w.createRadialGradient(cx * U, cy * U, 0, cx * U, cy * U, 1.2 * U);
    grad.addColorStop(0, "#0c2230");
    grad.addColorStop(0.28, color);
    grad.addColorStop(0.62, color);
    grad.addColorStop(0.78, "#14202a");
    grad.addColorStop(1, "#0b141b");
    w.fillStyle = grad;
    shape();
    w.fill();
    w.save();
    shape();
    w.clip();
    // 가운데 밝은 광택
    const sheen = w.createRadialGradient(0.55 * U, (cy - 0.05) * U, 0, 0.55 * U, (cy - 0.05) * U, 0.45 * U);
    sheen.addColorStop(0, "rgba(255,255,255,0.45)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    w.fillStyle = sheen;
    w.fillRect(0, -U, 1.4 * U, 1.9 * U);
    // 잎맥
    w.strokeStyle = "rgba(8,25,35,0.45)";
    w.lineWidth = U * 0.018;
    for (let k = 0; k < 6; k++) {
      const a = shape === fore ? -1.25 + k * 0.17 : -0.1 + k * 0.28;
      w.beginPath();
      w.moveTo(0.04 * U, 0);
      w.quadraticCurveTo(0.5 * U * Math.cos(a), 0.5 * U * Math.sin(a) - 0.05 * U, 1.3 * U * Math.cos(a), 1.3 * U * Math.sin(a));
      w.stroke();
    }
    w.restore();
  }
  // 가장자리 검은 띠 위 흰 점
  w.fillStyle = "rgba(255,255,255,0.85)";
  for (const [px, py, pr] of [
    [1.12, -0.78, 0.045],
    [1.17, -0.62, 0.04],
    [1.1, -0.45, 0.035],
    [0.95, -0.3, 0.03],
    [0.78, 0.48, 0.035],
    [0.6, 0.68, 0.035],
    [0.38, 0.74, 0.03],
  ]) {
    w.beginPath();
    w.arc(px * U, py * U, pr * U, 0, Math.PI * 2);
    w.fill();
  }
  wingSprites.set(color, c);
  return c;
}

function drawButterfly(ctx, p, t) {
  const s = p.size;
  const open = p.settled ? 0.55 : 0.2 + 0.8 * Math.abs(Math.sin(t * p.flap + p.phase));
  const sprite = wingSprite(p.color);
  const k = s / (WING_U * 1.1); // 날개 한 쪽 폭이 예전과 같은 s * 1.2 정도
  ctx.globalAlpha = 0.97;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.settled ? p.angle * 0.2 : Math.sin(t * 0.002 + p.phase) * 0.4);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side * open * k, k);
    ctx.drawImage(sprite, 0, -WING_U);
    ctx.restore();
  }
  // 몸통: 가슴은 굵고 배는 가늘게 마디진 모양, 끝이 둥근 더듬이
  ctx.fillStyle = "#14222b";
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.18, s * 0.09, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, s * 0.22, s * 0.06, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#14222b";
  ctx.lineWidth = Math.max(0.5, s * 0.04);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.36);
  ctx.quadraticCurveTo(-s * 0.1, -s * 0.6, -s * 0.22, -s * 0.72);
  ctx.moveTo(0, -s * 0.36);
  ctx.quadraticCurveTo(s * 0.1, -s * 0.6, s * 0.22, -s * 0.72);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-s * 0.22, -s * 0.72, s * 0.04, 0, Math.PI * 2);
  ctx.arc(s * 0.22, -s * 0.72, s * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const istanbul = {
  id: "turkey",
  label: "터키 · 블루 모스크",
  title: "Blue Mosque",
  paint: paintIstanbul,
  animate: animateIstanbul,
  glare: 0.6,
  base: {
    trim: ["#1b6f73", "#9ff0ea", "#2ec4c9", "#145a5e"],
    plate: "Sultanahmet Camii",
    plateFont: "600 14px 'Gill Sans', 'Trebuchet MS', sans-serif",
    plateInk: "#04282c",
  },
  // 나비는 가볍게 떠다니며 천천히 내려앉음
  particles: {
    count: 60,
    blend: "source-over",
    make(rand) {
      const size = rand(3.5, 5.5);
      return {
        size,
        color: WING[Math.floor(rand(0, WING.length))],
        sink: 0.05 + size * 0.015,
        drag: rand(0.06, 0.1),
        inertia: rand(0.2, 0.4),
        grip: rand(0.4, 1.6),
        angle: rand(-1, 1),
        spin: 0,
        flipSpeed: 0,
        flutter: 0.05,
        flap: rand(0.012, 0.02),
        phase: rand(0, Math.PI * 2),
      };
    },
    draw: drawButterfly,
  },
};
