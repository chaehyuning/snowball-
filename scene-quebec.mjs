// 캐나다: 가을 노을 속 퀘벡 샤토 프롱트낙(드라마 「도깨비」 촬영지)과 흩날리는 단풍잎

import { seeded, fillSilhouette, paintTree } from "./util.mjs";

const LEAF_COLORS = ["#c8321e", "#e0601a", "#f0901a", "#f6b81e", "#a8231a"];
const COPPER = ["#5fae94", "#3f8a74", "#2c6655"]; // 녹청이 슨 구리 지붕
const BRICK = ["#b8502e", "#9a3e24", "#7a2e1a"];
const SLATE = ["#5a4a52", "#43363f", "#2e252c"]; // 가운데 탑의 짙은 슬레이트 지붕

// 「도깨비」에 나온 구도: 단풍나무가 선 언덕 위에서
// 아래쪽 샤토 프롱트낙과 구시가지, 그 뒤 세인트로렌스강을 내려다봄
function paintQuebec(g, globe, groundAt) {
  const rnd = seeded(1608);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 가을 노을 하늘
  const sky = g.createLinearGradient(0, top, 0, 235);
  // 가을 골든아워: 위는 따뜻한 보랏빛 청색, 아래로 앰버와 골드
  sky.addColorStop(0, "#4a5fa8");
  sky.addColorStop(0.4, "#d98a6a");
  sky.addColorStop(0.75, "#f6b04a");
  sky.addColorStop(1, "#ffcf62");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 강 건너편 너머로 지는 해
  const sunX = 300;
  const sunY = 222;
  const sun = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120);
  sun.addColorStop(0, "rgba(255,240,200,1)");
  sun.addColorStop(0.08, "rgba(255,220,160,0.7)");
  sun.addColorStop(1, "rgba(255,200,140,0)");
  g.fillStyle = sun;
  g.fillRect(left, top, size, size);

  // 노을빛 구름
  g.filter = "blur(5px)";
  for (let i = 0; i < 9; i++) {
    g.fillStyle = `rgba(255,${Math.round(r(170, 215))},${Math.round(r(150, 190))},${r(0.3, 0.55)})`;
    g.beginPath();
    g.ellipse(r(60, 350), r(75, 190), r(30, 80), r(4, 10), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.filter = "none";

  // 강 건너편 레비 기슭
  const shoreY = (x) => 229 + 3 * Math.sin(x * 0.04 + 1) + 2 * Math.sin(x * 0.13);
  g.fillStyle = "#9a6a6a";
  fillSilhouette(g, shoreY, left, right, 400);

  // 세인트로렌스강과 해 반사
  const river = g.createLinearGradient(0, 234, 0, 310);
  river.addColorStop(0, "#f2b060");
  river.addColorStop(0.5, "#c47850");
  river.addColorStop(1, "#5a4a6a");
  g.fillStyle = river;
  g.fillRect(left, 234, size, 90);
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 50; i++) {
    const y = r(236, 300);
    const w = r(8, 34) * (1 - (y - 236) / 90);
    g.fillStyle = `rgba(255,205,120,${r(0.2, 0.5)})`;
    g.fillRect(sunX - w / 2 + r(-12, 12), y, w, 0.8);
  }
  g.globalCompositeOperation = "source-over";

  // 호텔이 올라앉은 강가 절벽(디아망 곶)과 단풍 든 숲
  const bluffY = (x) => {
    const d = Math.abs(x - 275) / 95;
    return d >= 1 ? 400 : 264 + 30 * d ** 3 + 1.5 * Math.sin(x * 0.3);
  };
  const bluff = g.createLinearGradient(0, 262, 0, 305);
  bluff.addColorStop(0, "#7a5d44");
  bluff.addColorStop(1, "#4a382c");
  g.fillStyle = bluff;
  fillSilhouette(g, bluffY, 178, 372, 400);
  for (let i = 0; i < 160; i++) {
    const x = r(185, 365);
    const y = r(bluffY(x) + 2, 304);
    g.globalAlpha = r(0.6, 0.95);
    g.fillStyle = [...LEAF_COLORS, "#6b5a2a"][Math.floor(rnd() * 6)];
    g.beginPath();
    g.arc(x, y, r(0.8, 1.8), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // 언덕 아래 강가 절벽 위의 샤토 프롱트낙: 장면의 주인공이라 크게
  g.save();
  g.translate(272, 270);
  g.scale(0.8, 0.8);
  paintChateau(g, r, rnd, 0, 0);
  g.restore();
  // 성 앞 뒤프랭 테라스
  dufferin(g, 196, 352, 272);

  // 성 아래 구시가지 지붕들
  for (let i = 0; i < 46; i++) {
    const x = r(178, 372);
    const base = r(278, 302);
    const w = r(6, 12);
    const h = r(6, 13);
    g.fillStyle = ["#cbb79a", "#b49c80", "#9c8670", "#d8c6aa"][Math.floor(rnd() * 4)];
    g.fillRect(x, base - h, w, h);
    g.fillStyle = rnd() < 0.3 ? COPPER[1] : ["#3d3a3e", "#5a4a44"][Math.floor(rnd() * 2)];
    g.beginPath();
    g.moveTo(x - 1, base - h);
    g.lineTo(x + w / 2, base - h - r(3, 6));
    g.lineTo(x + w + 1, base - h);
    g.closePath();
    g.fill();
    for (let k = 0; k < 2; k++) {
      g.fillStyle = rnd() < 0.5 ? "#ffd38a" : "#4a3a34";
      g.fillRect(x + 1.5 + k * (w / 2), base - h + 3, 1.3, 1.8);
    }
  }

  // 성과 강 건너편을 덮는 옅은 노을 안개 (멀어서 흐릿함)
  const farMist = g.createLinearGradient(0, 220, 0, 290);
  farMist.addColorStop(0, "rgba(246,190,150,0)");
  farMist.addColorStop(0.5, "rgba(246,190,150,0.18)");
  farMist.addColorStop(1, "rgba(246,190,150,0.05)");
  g.fillStyle = farMist;
  g.fillRect(left, 220, size, 70);

  // 앞쪽 잔디 언덕: 왼쪽이 높고 오른쪽 아래로 내려감
  const hillY = (x) => 212 + 95 / (1 + Math.exp(-(x - 170) / 45)) + 1.5 * Math.sin(x * 0.17);
  const grass = g.createLinearGradient(0, 212, 0, 335);
  grass.addColorStop(0, "#a3a04a");
  grass.addColorStop(0.5, "#7d883a");
  grass.addColorStop(1, "#4d5828");
  g.fillStyle = grass;
  fillSilhouette(g, hillY, left, right, 400);

  // 해를 받는 언덕 능선
  g.strokeStyle = "rgba(255,210,140,0.55)";
  g.lineWidth = 1.5;
  g.beginPath();
  for (let x = left; x <= right; x += 2) g.lineTo(x, hillY(x) + 0.5);
  g.stroke();

  // 잔디 결과 떨어진 단풍잎
  for (let i = 0; i < 500; i++) {
    const x = r(left, right);
    const y = r(hillY(x) + 2, 335);
    g.strokeStyle = ["rgba(70,80,30,0.5)", "rgba(200,190,90,0.45)", "rgba(190,110,40,0.4)"][Math.floor(rnd() * 3)];
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + r(-1, 1), y - r(1.5, 3.5));
    g.stroke();
  }
  for (let i = 0; i < 120; i++) {
    const x = r(left, 260);
    const y = r(hillY(x) + 3, 330);
    g.globalAlpha = r(0.6, 0.95);
    g.fillStyle = LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)];
    g.beginPath();
    g.ellipse(x, y, r(1.2, 2.4), r(0.7, 1.3), r(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // 언덕 그늘: 해가 뒤에 있어 앞쪽 비탈은 차분하게 어둡고, 능선 쪽만 따뜻함
  const hillShade = g.createLinearGradient(0, 230, 0, 335);
  hillShade.addColorStop(0, "rgba(60,30,40,0)");
  hillShade.addColorStop(1, "rgba(60,30,40,0.28)");
  g.fillStyle = hillShade;
  fillSilhouette(g, hillY, left, right, 400);

  // 벤치에서 언덕 아래로 굽이쳐 내려가는 자갈길: 가까울수록 넓어짐
  g.fillStyle = "rgba(214,184,140,0.75)";
  g.beginPath();
  const path = (t) => {
    const x = 165 + 70 * t + 22 * Math.sin(t * 5.2);
    return [x, hillY(x) + 6 + t * 26];
  };
  for (let t = 0; t <= 1.001; t += 0.05) {
    const [x, y] = path(t);
    g.lineTo(x - (1.5 + t * 5), y);
  }
  for (let t = 1; t >= -0.001; t -= 0.05) {
    const [x, y] = path(t);
    g.lineTo(x + (1.5 + t * 5), y);
  }
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(120,90,60,0.35)";
  for (let i = 0; i < 40; i++) {
    const [x, y] = path(rnd());
    g.fillRect(x + r(-3, 3), y + r(-1, 1), 0.8, 0.6);
  }

  // 언덕 위 뒤쪽 작은 단풍나무들 (멀어서 작고 노을빛에 옅음)
  const farMaple = { trunk: "#4a3024", shade: "#8e3a22", colors: ["#e07a3a", "#f0a040", "#d85a2a", "#f6c060"] };
  g.globalAlpha = 0.85;
  paintTree(g, rnd, 38, hillY(38) + 3, 20, -1.62, 3.2, 4, farMaple);
  paintTree(g, rnd, 132, hillY(132) + 3, 16, -1.5, 2.6, 4, farMaple);
  g.globalAlpha = 1;

  // 언덕 위 벤치와 가로등
  const benchX = 158;
  const benchY = hillY(benchX) + 4;
  g.fillStyle = "#3a2a20";
  g.fillRect(benchX - 11, benchY - 6, 22, 2);
  g.fillRect(benchX - 11, benchY - 11, 22, 1.6);
  g.fillRect(benchX - 9, benchY - 6, 1.4, 6);
  g.fillRect(benchX + 8, benchY - 6, 1.4, 6);
  const lampX = 196;
  const lampY = hillY(lampX) + 3;
  g.strokeStyle = "#2c2622";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(lampX, lampY);
  g.lineTo(lampX, lampY - 26);
  g.stroke();
  const lamp = g.createRadialGradient(lampX, lampY - 27, 0, lampX, lampY - 27, 7);
  lamp.addColorStop(0, "rgba(255,222,150,0.95)");
  lamp.addColorStop(1, "rgba(255,222,150,0)");
  g.fillStyle = lamp;
  g.fillRect(lampX - 7, lampY - 34, 14, 14);

  // 언덕 위 큰 단풍나무와 오른쪽 가장자리 작은 나무
  const maple = { trunk: "#3a2418", shade: "#7e2414", colors: LEAF_COLORS.slice(0, 4) };
  paintTree(g, rnd, 92, hillY(92) + 6, 42, -1.5, 7, 5, maple);
  paintTree(g, rnd, 378, 352, 32, -1.95, 5, 4, maple);

  // 낙엽이 깔린 바닥
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#b8642c");
  floor.addColorStop(1, "#6e3518");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  for (let i = 0; i < 450; i++) {
    const x = r(left, right);
    const y = groundAt(x) + r(1, 45);
    g.globalAlpha = r(0.5, 0.95);
    g.fillStyle = LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)];
    g.beginPath();
    g.ellipse(x, y, r(1.4, 3), r(0.8, 1.6), r(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  g.restore();
}

// 샤토 프롱트낙을 상자 모양 덩어리들로 입체적으로 그림.
// 언덕(왼쪽 위)에서 내려다보므로 덩어리마다 앞면 + 왼쪽으로 물러나는 옆면 + 네 경사면 지붕(앞·왼쪽 면이 보임)이 보임.
// 해는 성 뒤 오른쪽 강 위로 지므로 앞면은 역광으로 차분하고, 옆면은 더 어둡고, 지붕 오른쪽 능선과 모서리에 금빛이 맺힘
const DEPTH = { x: -0.5, y: -0.3 }; // 깊이 1만큼 뒤로 가면 화면에서 왼쪽 위로 이동
const RIM = "rgba(255,206,130,0.85)";

// 불 켜진 창의 빛 번짐: 한 번 그려 두고 붙여 씀 (창마다 그러데이션을 만들면 처음 그릴 때 0.5초 넘게 멈춤)
let windowGlow = null;
function glow() {
  if (windowGlow) return windowGlow;
  windowGlow = document.createElement("canvas");
  windowGlow.width = windowGlow.height = 24;
  const g = windowGlow.getContext("2d");
  const gr = g.createRadialGradient(12, 12, 0, 12, 12, 12);
  gr.addColorStop(0, "rgba(255,200,110,0.32)");
  gr.addColorStop(1, "rgba(255,200,110,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 24, 24);
  return windowGlow;
}

function paintChateau(g, r, rnd, cx, ground) {
  const P = (x0, top, u, v, z) => [x0 + u + v * DEPTH.x, top + v * DEPTH.y - z];

  // 아치 창 하나 (s, t 좌표: 면 위의 가로·세로)
  function archWindow(wx, wy, lit) {
    g.fillStyle = lit ? "#ffcf7a" : "#2a1a1e";
    g.beginPath();
    g.moveTo(wx, wy + 5);
    g.lineTo(wx, wy + 1.1);
    g.arc(wx + 1.1, wy + 1.1, 1.1, Math.PI, 0);
    g.lineTo(wx + 2.2, wy + 5);
    g.closePath();
    g.fill();
    if (lit) g.drawImage(glow(), wx - 4, wy - 3, 10, 10);
  }

  // 벽돌 면: 층 띠, 모서리 돌, 세로 열 창. shade: 0(앞면)~1(그늘진 옆면)
  function brickFace(w, h, shade) {
    const brick = g.createLinearGradient(0, 0, w, 0);
    brick.addColorStop(0, shade ? "#4e1f15" : "#743020");
    brick.addColorStop(1, shade ? "#5e2618" : "#a24a2a");
    g.fillStyle = brick;
    g.fillRect(0, 0, w, h);
    const dusk = g.createLinearGradient(0, 0, 0, h);
    dusk.addColorStop(0, "rgba(40,20,30,0)");
    dusk.addColorStop(1, "rgba(40,20,30,0.35)");
    g.fillStyle = dusk;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(60,20,12,0.22)";
    for (let by = 2; by < h; by += 2.2) g.fillRect(0, by, w, 0.35);
    g.fillStyle = shade ? "rgba(200,170,140,0.3)" : "rgba(226,200,166,0.55)";
    for (let by = 9; by < h - 2; by += 12) g.fillRect(0, by, w, 1);
    for (let qy = 0; qy < h; qy += 4) {
      const long = Math.round(qy / 4) % 2 === 0;
      g.fillStyle = shade ? "rgba(180,150,120,0.45)" : "rgba(214,188,152,0.7)";
      g.fillRect(0, qy, long ? 3 : 2, 3.2);
      g.fillRect(w - (long ? 3 : 2), qy, long ? 3 : 2, 3.2);
    }
    const cols = Math.max(1, Math.floor((w - 6) / 7));
    const gap = (w - cols * 7) / 2;
    for (let c = 0; c < cols; c++) {
      for (let wy = 5; wy < h - 7; wy += 9) {
        if (rnd() < 0.12) continue;
        archWindow(gap + c * 7 + 2.4, wy, rnd() < (shade ? 0.25 : 0.4));
      }
    }
  }

  // 상자 덩어리: 앞면 왼쪽 아래 (x, ground), 폭 w, 높이 h, 깊이 d, 지붕 높이 rh.
  // back: 앞줄에서 뒤로 물러난 깊이 (탑처럼 뒤에 선 덩어리)
  function block(x0, w, h, d, rh, back = 0) {
    const x = x0 + back * DEPTH.x;
    const base = ground + back * DEPTH.y;
    const top = base - h;
    // 왼쪽 옆면: 면 좌표 (s=깊이, t=아래로)를 화면에 비스듬히 옮겨 그림
    g.save();
    g.transform(DEPTH.x, DEPTH.y, 0, 1, x, top);
    brickFace(d, h, 1);
    g.restore();
    // 앞면
    g.save();
    g.translate(x, top);
    brickFace(w, h, 0);
    g.restore();
    g.fillStyle = RIM;
    g.fillRect(x + w - 0.9, top, 0.9, h);
    // 면 경계선: 옆면 윤곽과 앞면 윤곽을 가는 선으로 또렷하게
    g.strokeStyle = "rgba(30,10,8,0.6)";
    g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(x, base);
    g.lineTo(x, top);
    g.lineTo(x + d * DEPTH.x, top + d * DEPTH.y);
    g.lineTo(x + d * DEPTH.x, base + d * DEPTH.y);
    g.stroke();
    g.strokeRect(x, top, w, h);

    // 네 경사면 지붕: 처마는 앞으로만 살짝 내밀어, 옆 덩어리와는 벽 폭 그대로 맞닿음 (서로 파고들지 않게)
    const o = 1.2;
    const inset = Math.min(w, d) / 2 - 1;
    const X0 = x;
    const W = w;
    const D = d + o;
    const T = top + o * 0.6;
    const a = P(X0, T, 0, 0, 0);
    const b = P(X0, T, W, 0, 0);
    const c = P(X0, T, W - inset, D / 2, rh);
    const e = P(X0, T, inset, D / 2, rh);
    const f = P(X0, T, 0, D, 0);
    // 왼쪽 경사면 (그늘)
    g.fillStyle = "#1f463c";
    g.beginPath();
    g.moveTo(...a);
    g.lineTo(...e);
    g.lineTo(...f);
    g.closePath();
    g.fill();
    // 앞 경사면: 왼쪽은 어둡고 해 쪽(오른쪽)으로 갈수록 밝은 녹청
    const copper = g.createLinearGradient(a[0], 0, b[0], 0);
    copper.addColorStop(0, "#2c5f50");
    copper.addColorStop(0.6, "#438f78");
    copper.addColorStop(1, "#86c9ad");
    g.fillStyle = copper;
    g.beginPath();
    g.moveTo(...a);
    g.lineTo(...b);
    g.lineTo(...c);
    g.lineTo(...e);
    g.closePath();
    g.fill();
    // 구리판 이음매
    g.save();
    g.clip();
    g.strokeStyle = "rgba(20,50,40,0.3)";
    g.lineWidth = 0.4;
    for (let k = 0; k <= 1; k += 2.2 / W) {
      g.beginPath();
      g.moveTo(a[0] + (b[0] - a[0]) * k, a[1]);
      g.lineTo(e[0] + (c[0] - e[0]) * k, e[1]);
      g.stroke();
    }
    g.restore();
    // 능선: 왼쪽 모서리는 어둡게, 오른쪽 모서리와 용마루는 빛
    g.lineWidth = 0.7;
    g.strokeStyle = "rgba(15,35,30,0.9)";
    g.beginPath();
    g.moveTo(...a);
    g.lineTo(...e);
    g.stroke();
    g.strokeStyle = RIM;
    g.beginPath();
    g.moveTo(...b);
    g.lineTo(...c);
    g.lineTo(...e);
    g.stroke();
    // 지붕 윤곽
    g.strokeStyle = "rgba(15,35,30,0.7)";
    g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(...f);
    g.lineTo(...a);
    g.lineTo(...b);
    g.stroke();
    // 앞 경사면 지붕창: 박공을 쓴 작은 창이 경사면 위에 솟음
    const rows = rh > 26 ? [0.25, 0.55] : [0.38];
    for (const k of rows) {
      const zz = rh * k;
      const vv = (D / 2) * k;
      const uFrom = inset * k + 4;
      const uTo = W - inset * k - 4;
      for (let u = uFrom; u <= uTo; u += 7) {
        const [dx, dy] = P(X0, T, u, vv, zz);
        g.fillStyle = "#e6d6bc";
        g.fillRect(dx - 1.8, dy - 4.4, 3.6, 4.4);
        g.fillStyle = "#2c6655";
        g.beginPath();
        g.moveTo(dx - 2.4, dy - 4.4);
        g.lineTo(dx, dy - 7);
        g.lineTo(dx + 2.4, dy - 4.4);
        g.closePath();
        g.fill();
        g.fillStyle = rnd() < 0.45 ? "#ffcf7a" : "#203430";
        g.fillRect(dx - 1, dy - 3.4, 2, 2.8);
      }
    }
    // 용마루 장식 난간
    g.fillStyle = "#1f3a33";
    for (let k = 0; k <= 1; k += 0.08) {
      const px = e[0] + (c[0] - e[0]) * k;
      const py = e[1] + (c[1] - e[1]) * k;
      g.fillRect(px, py - 1.6, 0.5, 1.6);
    }
  }

  // 원뿔 지붕 망루: 둥근 벽(양끝이 어두움) + 원뿔 + 처마 타원
  function turret(x, w, h, rh) {
    const top = ground - h;
    g.save();
    g.translate(x - w / 2, top);
    brickFace(w, h, 0);
    g.restore();
    const round = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    round.addColorStop(0, "rgba(25,8,8,0.55)");
    round.addColorStop(0.45, "rgba(25,8,8,0)");
    round.addColorStop(0.85, "rgba(255,190,120,0.12)");
    round.addColorStop(1, "rgba(25,8,8,0.35)");
    g.fillStyle = round;
    g.fillRect(x - w / 2, top, w, h);
    const copper = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    copper.addColorStop(0, "#1f463c");
    copper.addColorStop(0.65, "#4a9a80");
    copper.addColorStop(1, "#9ad8bc");
    g.fillStyle = copper;
    g.beginPath();
    g.ellipse(x, top, w / 2 + 1.8, 1.6, 0, 0, Math.PI);
    g.lineTo(x - w / 2 - 1.8, top);
    g.quadraticCurveTo(x - w * 0.12, top - rh * 0.55, x, top - rh);
    g.quadraticCurveTo(x + w * 0.12, top - rh * 0.55, x + w / 2 + 1.8, top);
    g.closePath();
    g.fill();
    g.strokeStyle = "#1c2a26";
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(x, top - rh);
    g.lineTo(x, top - rh - 6);
    g.stroke();
    g.fillStyle = "#c9a35a";
    g.beginPath();
    g.arc(x, top - rh - 2.5, 0.9, 0, Math.PI * 2);
    g.fill();
  }

  function chimney(x, y) {
    g.fillStyle = "#7a3220";
    g.fillRect(x, y - 10, 3.5, 10);
    g.fillStyle = RIM;
    g.fillRect(x + 2.8, y - 10, 0.7, 10);
    g.fillStyle = "#d9c7ae";
    g.fillRect(x - 0.6, y - 11, 4.7, 1.5);
  }

  // 먼 것부터 가까운 것 순서로 그림. 같은 줄에서는 오른쪽부터 (왼쪽 덩어리의 앞면이 오른쪽 덩어리의 옆면을 가림)
  // 1) 뒤에 선 가운데 탑: 아래 넓은 단 위에 좁은 단
  block(cx - 18, 36, 74, 26, 6, 16);
  block(cx - 15, 30, 116, 22, 44, 18);
  // 2) 앞줄 오른쪽 날개
  block(cx + 66, 16, 42, 14, 22);
  block(cx + 46, 20, 38, 18, 22);
  block(cx + 18, 28, 46, 22, 27);
  chimney(cx + 31, ground - 46 - 27 * 0.55);
  chimney(cx + 55, ground - 38 - 22 * 0.55);
  // 3) 앞줄 왼쪽 날개: 가장 왼쪽 덩어리는 뒤로 길게 뻗어 옆면 창들이 줄지어 보임
  block(cx - 18, 36, 34, 12, 14);
  block(cx - 40, 22, 46, 22, 26);
  block(cx - 62, 22, 40, 22, 22);
  block(cx - 86, 24, 50, 44, 30);
  chimney(cx - 31, ground - 46 - 26 * 0.55);
  chimney(cx - 52, ground - 40 - 22 * 0.55);
  chimney(cx - 76, ground - 50 - 30 * 0.55);

  // 4) 모서리 망루: 덩어리가 만나는 자리에 서서 이음매를 감춤 (오른쪽부터)
  turret(cx + 82, 12, 50, 24);
  turret(cx + 18, 10, 62, 22);
  turret(cx - 18, 10, 64, 22);
  turret(cx - 86, 12, 58, 26);

  // 탑 꼭대기 깃발
  const flagX = cx + 18 * DEPTH.x;
  const flagY = ground + 18 * DEPTH.y - 116 - 44 - 1;
  g.strokeStyle = "#1c2a26";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(flagX, flagY);
  g.lineTo(flagX, flagY - 10);
  g.stroke();
  g.fillStyle = "#e8e2d6";
  g.beginPath();
  g.moveTo(flagX, flagY - 10);
  g.lineTo(flagX + 7, flagY - 7.5);
  g.lineTo(flagX, flagY - 5);
  g.closePath();
  g.fill();
}

// 성 앞 강가 절벽 위 산책로(뒤프랭 테라스): 나무 데크와 녹색 지붕 정자, 가로등
function dufferin(g, x0, x1, y) {
  g.fillStyle = "#6a5040";
  g.fillRect(x0, y, x1 - x0, 2.4);
  g.fillStyle = "rgba(255,210,150,0.5)";
  g.fillRect(x0, y, x1 - x0, 0.6);
  // 난간
  g.fillStyle = "#2a2226";
  g.fillRect(x0, y - 2.2, x1 - x0, 0.5);
  for (let x = x0; x < x1; x += 2.4) g.fillRect(x, y - 2.2, 0.35, 2.2);
  // 정자 세 채
  for (const kx of [x0 + 18, (x0 + x1) / 2, x1 - 18]) {
    g.fillStyle = "#e9e2d4";
    g.fillRect(kx - 3, y - 6, 0.6, 6);
    g.fillRect(kx + 2.4, y - 6, 0.6, 6);
    g.fillStyle = "#3f8a74";
    g.beginPath();
    g.moveTo(kx - 4.6, y - 6);
    g.quadraticCurveTo(kx, y - 11, kx, y - 11.5);
    g.quadraticCurveTo(kx, y - 11, kx + 4.6, y - 6);
    g.closePath();
    g.fill();
  }
  // 가로등
  for (let x = x0 + 8; x < x1; x += 14) {
    g.fillStyle = "#2a2226";
    g.fillRect(x, y - 6, 0.5, 6);
    const lamp = g.createRadialGradient(x + 0.25, y - 6.5, 0, x + 0.25, y - 6.5, 3.2);
    lamp.addColorStop(0, "rgba(255,226,160,0.95)");
    lamp.addColorStop(1, "rgba(255,226,160,0)");
    g.fillStyle = lamp;
    g.fillRect(x - 3, y - 10, 6.5, 7);
  }
}

// 단풍잎: 다섯 갈래로 갈라진 잎과 잎자루
const LEAF_SHAPE = [
  [0, -1], [0.12, -0.62], [0.38, -0.75], [0.3, -0.38], [0.8, -0.5], [0.62, -0.2],
  [0.92, 0.04], [0.46, 0.12], [0.52, 0.4], [0.12, 0.3], [0.03, 0.5],
];

function drawLeaf(ctx, p) {
  const s = p.size;
  ctx.globalAlpha = p.settled ? 0.95 : 0.9;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(Math.max(0.2, Math.abs(Math.cos(p.flip))), 1);
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(LEAF_SHAPE[0][0] * s, LEAF_SHAPE[0][1] * s);
  for (const [x, y] of LEAF_SHAPE) ctx.lineTo(x * s, y * s);
  for (let i = LEAF_SHAPE.length - 1; i >= 0; i--) ctx.lineTo(-LEAF_SHAPE[i][0] * s, LEAF_SHAPE[i][1] * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(70,25,10,0.7)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, 0.3 * s);
  ctx.lineTo(0, 0.95 * s);
  ctx.stroke();
  ctx.restore();
}

export const quebec = {
  // 따뜻한 골든아워 필터: 그늘은 와인빛, 밝은 곳은 금빛
  grade: { saturation: 1.0, shadow: [70, 30, 40], highlight: [255, 214, 150], tint: 0.18 },
  id: "canada",
  label: "캐나다 · 샤토 프롱트낙",
  title: "Château Frontenac",
  paint: paintQuebec,
  glare: 0.9,
  base: {
    trim: ["#6b3e1f", "#e8a86a", "#b8703a", "#5a3218"],
    plate: "Château Frontenac",
    plateFont: "italic 600 15px 'Baskerville', 'Times New Roman', serif",
    plateInk: "#2a160a",
  },
  // 단풍잎은 꽃잎보다 크고 조금 무거워서 더 크게 뒤집히며 떨어짐
  particles: {
    count: 150,
    blend: "source-over",
    make(rand) {
      const size = rand(3.5, 6);
      return {
        size,
        color: LEAF_COLORS[Math.floor(rand(0, LEAF_COLORS.length))],
        sink: 0.16 + size * 0.03 + rand(-0.03, 0.03),
        drag: rand(0.07, 0.11),
        inertia: rand(0.35, 0.65),
        grip: rand(0.5, 1.8),
        angle: rand(0, Math.PI * 2),
        spin: rand(-0.05, 0.05),
        flipSpeed: rand(0.03, 0.07),
        flutter: 0.035,
      };
    },
    draw: drawLeaf,
  },
};
