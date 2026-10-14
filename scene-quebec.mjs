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
  paintChateauPhoto(g, rnd);
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
    brick.addColorStop(0, shade ? "#6a2c1c" : "#a04a2c");
    brick.addColorStop(1, shade ? "#7a3622" : "#cf7446");
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
  function block(x0, w, h, d, rh, back = 0, opts = {}) {
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

    roofOn(x, top, w, d, rh, opts);
    // 벽에서 솟아 지붕을 뚫고 올라가는 뾰족한 돌 박공 (이 성의 상징)
    if (opts.gables) {
      for (const gx of opts.gables) {
        const px = x + gx;
        const gh = Math.min(14, rh * 0.5);
        g.fillStyle = "#c06a40";
        g.beginPath();
        g.moveTo(px - 5, top + 1);
        g.lineTo(px - 5, top - gh * 0.45);
        g.lineTo(px, top - gh);
        g.lineTo(px + 5, top - gh * 0.45);
        g.lineTo(px + 5, top + 1);
        g.closePath();
        g.fill();
        g.strokeStyle = "#ecdcc0";
        g.lineWidth = 0.8;
        g.beginPath();
        g.moveTo(px - 5.4, top - gh * 0.45);
        g.lineTo(px, top - gh);
        g.lineTo(px + 5.4, top - gh * 0.45);
        g.stroke();
        g.fillStyle = RIM;
        g.fillRect(px + 4.4, top - gh * 0.45, 0.6, gh * 0.45);
        archWindow(px - 1.1, top - gh * 0.5, rnd() < 0.5);
        g.strokeStyle = "#1f2524";
        g.lineWidth = 0.5;
        g.beginPath();
        g.moveTo(px, top - gh);
        g.lineTo(px, top - gh - 3);
        g.stroke();
      }
    }
  }

  // 네 경사면 지붕 (실제처럼 짙은 회녹색 슬레이트·구리).
  // 폭이 깊이보다 길면 용마루가 좌우로, 깊이가 더 길면 앞뒤로 놓임 → 앞면·왼쪽 면 모양이 그에 맞게 바뀜
  function roofOn(x, top, w, d, rh, opts) {
    const o = 1.2;
    const D = d + o;
    const T = top + o * 0.6;
    const at = (u, v, z) => P(x, T, u, v, z);
    let R1;
    let R2;
    if (w >= D) {
      const k = D / 2;
      R1 = [k, D / 2];
      R2 = [w - k, D / 2];
    } else {
      const k = w / 2;
      R1 = [w / 2, k];
      R2 = [w / 2, D - k];
    }
    const a = at(0, 0, 0);
    const b = at(w, 0, 0);
    const f = at(0, D, 0);
    const r1 = at(R1[0], R1[1], rh);
    const r2 = at(R2[0], R2[1], rh);
    const front = w >= D ? [a, b, r2, r1] : [a, b, r1];
    const side = w >= D ? [a, r1, f] : [a, r1, r2, f];
    const poly = (pts) => {
      g.beginPath();
      g.moveTo(...pts[0]);
      for (const q of pts.slice(1)) g.lineTo(...q);
      g.closePath();
    };
    // 왼쪽 면: 그늘
    poly(side);
    g.fillStyle = "#1b2322";
    g.fill();
    // 앞면: 역광이라 짙고, 해 쪽 끝만 살짝 밝음
    poly(front);
    const slate = g.createLinearGradient(a[0], 0, b[0], 0);
    slate.addColorStop(0, "#27302f");
    slate.addColorStop(0.7, "#3a4a46");
    slate.addColorStop(1, "#5e746c");
    g.fillStyle = slate;
    g.fill();
    // 판 이음매
    g.save();
    g.clip();
    g.strokeStyle = "rgba(120,150,140,0.16)";
    g.lineWidth = 0.4;
    for (let k = 0; k <= 1.001; k += 2.2 / w) {
      g.beginPath();
      g.moveTo(a[0] + (b[0] - a[0]) * k, a[1]);
      const tx = front.length === 4 ? r1[0] + (r2[0] - r1[0]) * k : r1[0];
      const ty = front.length === 4 ? r1[1] : r1[1];
      g.lineTo(tx, ty);
      g.stroke();
    }
    g.restore();
    // 능선: 해 쪽 모서리와 용마루에 금빛
    g.lineWidth = 0.7;
    g.strokeStyle = RIM;
    g.beginPath();
    g.moveTo(...b);
    g.lineTo(...(front.length === 4 ? r2 : r1));
    if (front.length === 4) g.lineTo(...r1);
    else g.lineTo(...r2);
    g.stroke();
    g.strokeStyle = "rgba(10,14,14,0.85)";
    g.beginPath();
    g.moveTo(...f);
    g.lineTo(...a);
    g.lineTo(...b);
    g.moveTo(...a);
    g.lineTo(...r1);
    g.stroke();
    // 지붕창: 크림색 틀에 뾰족한 박공 모자, 경사면을 따라 여러 줄
    const dormer = (dx, dy, scale = 1, dim = false) => {
      g.fillStyle = dim ? "#a89880" : "#efe3cc";
      g.fillRect(dx - 1.8 * scale, dy - 4.6 * scale, 3.6 * scale, 4.6 * scale);
      g.fillStyle = dim ? "#151b1a" : "#222a29";
      g.beginPath();
      g.moveTo(dx - 2.5 * scale, dy - 4.6 * scale);
      g.lineTo(dx, dy - 7.6 * scale);
      g.lineTo(dx + 2.5 * scale, dy - 4.6 * scale);
      g.closePath();
      g.fill();
      g.fillStyle = rnd() < (dim ? 0.3 : 0.5) ? "#ffcf7a" : "#1a2120";
      g.fillRect(dx - 1 * scale, dy - 3.6 * scale, 2 * scale, 2.8 * scale);
    };
    const rows = rh > 40 ? [0.18, 0.42, 0.66] : rh > 24 ? [0.25, 0.55] : [0.38];
    for (const t of rows) {
      // 앞면 줄
      const vv = (front.length === 4 ? R1[1] : R1[1]) * t;
      const half = (w / 2) * (1 - t * (front.length === 4 ? (w - (R2[0] - R1[0])) / w : 1));
      for (let u = w / 2 - half + 4; u <= w / 2 + half - 4; u += 6.5) {
        const [dx, dy] = at(u, vv, rh * t);
        dormer(dx, dy, rh > 40 ? 1.1 : 1);
      }
      // 깊이가 긴 지붕은 왼쪽 면에도 지붕창이 줄지어 보임
      if (front.length === 3) {
        for (let v = R1[1] + 2; v < D - R1[1] - 1; v += 7) {
          const [dx, dy] = at((w / 2) * t, v, rh * t);
          dormer(dx, dy, 0.9, true);
        }
      }
    }
    // 모서리와 용마루 끝의 가는 첨탑
    if (opts.pinnacles) {
      for (const q of [a, b, r1, r2]) {
        g.strokeStyle = "#141a19";
        g.lineWidth = 0.7;
        g.beginPath();
        g.moveTo(q[0], q[1]);
        g.lineTo(q[0], q[1] - (q === a || q === b ? 7 : 9));
        g.stroke();
      }
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
    copper.addColorStop(0, "#1b2322");
    copper.addColorStop(0.65, "#34423f");
    copper.addColorStop(1, "#6a8078");
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
  // 1) 뒤에 선 가운데 탑: 성의 주인공. 굵은 몸통 위에 지붕창이 세 줄 박힌 가파른 지붕, 모서리마다 가는 첨탑
  block(cx - 25, 50, 58, 36, 6, 14);
  block(cx - 23, 46, 102, 34, 58, 16, { pinnacles: true });
  // 2) 앞줄 오른쪽 날개: 강 쪽으로 계단처럼 낮아짐 (오른쪽부터)
  block(cx + 66, 18, 38, 16, 22);
  block(cx + 42, 24, 42, 18, 24, 0, { gables: [12] });
  block(cx + 18, 24, 46, 20, 26, 0, { gables: [12] });
  chimney(cx + 28, ground - 46 - 26 * 0.5);
  chimney(cx + 56, ground - 42 - 24 * 0.5);
  // 3) 앞줄 왼쪽 날개: 왼쪽 끝 덩어리는 뒤로 길게 뻗어, 옆 지붕에 지붕창이 줄지어 보임
  block(cx - 42, 24, 46, 20, 26, 0, { gables: [12] });
  block(cx - 86, 44, 52, 50, 32, 0, { gables: [11, 33] });
  chimney(cx - 34, ground - 46 - 26 * 0.5);
  chimney(cx - 64, ground - 52 - 32 * 0.45);

  // 4) 모서리 망루: 덩어리가 만나는 자리에 서서 이음매를 감춤 (오른쪽부터)
  turret(cx + 86, 11, 46, 22);
  turret(cx + 18, 10, 58, 22);
  turret(cx - 18, 10, 58, 22);
  turret(cx - 88, 12, 60, 26);

  // 탑 꼭대기 깃발
  const flagX = cx + 16 * DEPTH.x;
  const flagY = ground + 16 * DEPTH.y - 102 - 58 + 3;
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

// 샤토 프롱트낙: 언덕(테라스 피에르뒤과드몽) 위에서 찍은 사진의 윤곽을 좌표 그대로 옮겨 그림.
// 사진 좌표(1080×1350) → 장면 좌표: x = 172 + (px − 160)·0.33, y = 274 − (620 − py)·0.33
const QS = 0.33;
const QX = (px) => 172 + (px - 160) * QS;
const QY = (py) => 274 - (620 - py) * QS;
function paintChateauPhoto(g, rnd) {
  const poly = (pts, fill, stroke = "rgba(30,20,20,0.5)") => {
    g.beginPath();
    g.moveTo(QX(pts[0][0]), QY(pts[0][1]));
    for (const [x, y] of pts.slice(1)) g.lineTo(QX(x), QY(y));
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    if (stroke) {
      g.strokeStyle = stroke;
      g.lineWidth = 0.4;
      g.stroke();
    }
  };
  const grad = (x0, x1, a, b) => {
    const gr = g.createLinearGradient(QX(x0), 0, QX(x1), 0);
    gr.addColorStop(0, a);
    gr.addColorStop(1, b);
    return gr;
  };
  const RIM = "rgba(255,210,150,0.8)";
  // 창: 사진 좌표 기준 격자로 찍음
  const windows = (x0, x1, y0, y1, dx, dy, dark = "#2a1c1c", litRate = 0.35) => {
    for (let y = y0; y < y1; y += dy) {
      for (let x = x0; x < x1; x += dx) {
        g.fillStyle = rnd() < litRate ? "#ffd38a" : dark;
        g.fillRect(QX(x), QY(y), 0.9, 1.6);
      }
    }
  };
  const spire = (x, y0, y1) => {
    g.strokeStyle = "#1c1f1e";
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(QX(x), QY(y0));
    g.lineTo(QX(x), QY(y1));
    g.stroke();
  };
  const cone = (xl, xr, yb, apx, apy, light) => {
    poly([[xl, yb], [apx, apy], [xr, yb]], grad(xl, xr, light ? "#2c3f38" : "#1e2a27", light ? "#5f8070" : "#3c524a"));
  };

  // 1) 맨 왼쪽 뒤 초록 지붕 덩어리
  poly([[165, 625], [165, 548], [192, 512], [222, 540], [252, 518], [292, 546], [292, 625]], grad(165, 292, "#22382f", "#3b5c4c"));
  // 그 아래 돌벽과 창
  poly([[165, 580], [292, 580], [292, 625], [165, 625]], grad(165, 292, "#7e7466", "#a39886"));
  windows(172, 288, 588, 620, 14, 12, "#2a2a2c", 0.25);
  spire(192, 512, 496);
  // 2) 가운데 아래 초록 지붕 줄 (탑 앞으로 낮게 이어짐) + 박공 지붕창
  poly([[392, 562], [612, 556], [612, 625], [392, 625]], grad(392, 612, "#2f4d40", "#5a7c6a"));
  // 지붕이 아래로 꺾이는 처마 쪽은 어둡게
  const midShade = g.createLinearGradient(0, QY(590), 0, QY(625));
  midShade.addColorStop(0, "rgba(10,20,15,0)");
  midShade.addColorStop(1, "rgba(10,20,15,0.45)");
  g.fillStyle = midShade;
  g.fillRect(QX(392), QY(590), QX(612) - QX(392), QY(625) - QY(590));
  for (let x = 410; x < 600; x += 22) {
    poly([[x - 7, 590], [x, 568], [x + 7, 590]], "#c8b89c");
    g.fillStyle = rnd() < 0.5 ? "#ffd38a" : "#2a2a2a";
    g.fillRect(QX(x - 2), QY(586), 1, 1.5);
  }
  // 3) 탑: 왼쪽 옆면(그늘) + 앞면(벽돌) + 가파른 슬레이트 지붕(왼쪽 면 어둡게, 앞면 지붕창 세 줄) + 모서리 망루
  poly([[428, 456], [470, 463], [470, 625], [428, 625]], grad(428, 470, "#5a2a1c", "#7a3a26"));
  poly([[470, 463], [606, 456], [606, 625], [470, 625]], grad(470, 606, "#a14a30", "#c9734a"));
  // 벽돌 탑의 돌 띠와 창
  g.fillStyle = "rgba(230,205,170,0.55)";
  for (const y of [478, 500, 522, 544, 566, 588]) g.fillRect(QX(470), QY(y), QX(606) - QX(470), 0.6);
  g.fillStyle = "rgba(200,175,145,0.4)";
  for (const y of [478, 500, 522, 544, 566, 588]) g.fillRect(QX(428), QY(y) + 0.3, QX(470) - QX(428), 0.5);
  windows(480, 600, 468, 615, 11, 11, "#2a1a1c", 0.3);
  windows(434, 466, 468, 615, 12, 11, "#1e1414", 0.15);
  // 세로 벽기둥: 벽면이 들고 나는 마디 (밝은 모서리 + 오른쪽 그늘)
  for (const x of [505, 540, 575]) {
    g.fillStyle = "rgba(255,220,180,0.18)";
    g.fillRect(QX(x), QY(463), 0.7, QY(625) - QY(463));
    g.fillStyle = "rgba(60,20,12,0.22)";
    g.fillRect(QX(x) + 0.7, QY(463), 1.1, QY(625) - QY(463));
  }
  // 모서리 돌: 앞면 양끝에 번갈아 길고 짧은 밝은 돌
  for (let y = 465; y < 620; y += 9) {
    const long = Math.round((y - 465) / 9) % 2 === 0;
    g.fillStyle = "rgba(226,206,176,0.7)";
    g.fillRect(QX(470), QY(y), long ? 1.6 : 1, 1.4);
    g.fillRect(QX(606) - (long ? 1.6 : 1), QY(y), long ? 1.6 : 1, 1.4);
  }
  // 처마 바로 아래 그늘과, 아래로 갈수록 짙어지는 그늘 (나무와 집들에 묻히는 쪽)
  const under = g.createLinearGradient(0, QY(458), 0, QY(472));
  under.addColorStop(0, "rgba(30,12,10,0.55)");
  under.addColorStop(1, "rgba(30,12,10,0)");
  g.fillStyle = under;
  g.fillRect(QX(428), QY(458), QX(606) - QX(428), QY(472) - QY(458));
  const low = g.createLinearGradient(0, QY(560), 0, QY(625));
  low.addColorStop(0, "rgba(30,15,20,0)");
  low.addColorStop(1, "rgba(30,15,20,0.35)");
  g.fillStyle = low;
  g.fillRect(QX(428), QY(560), QX(606) - QX(428), QY(625) - QY(560));
  g.fillStyle = RIM;
  g.fillRect(QX(606) - 0.6, QY(456), 0.6, QY(625) - QY(456));
  // 지붕
  // 사진처럼 높고 가파른 지붕: 처마에서 거의 세 배 높이로 솟아 짧은 용마루에서 만남
  // 아랫단은 거의 수직으로 서다가(망사르드) 위에서 급하게 좁아져 짧은 용마루에서 만남
  poly([[428, 456], [470, 463], [482, 410], [518, 345], [500, 350], [438, 414]], "#1b2120");
  poly([[470, 463], [606, 456], [598, 412], [552, 345], [518, 345], [482, 410]], grad(470, 606, "#2a3230", "#55605c"));
  // 꺾이는 선
  g.strokeStyle = "rgba(10,14,14,0.6)";
  g.lineWidth = 0.4;
  g.beginPath();
  g.moveTo(QX(482), QY(410));
  g.lineTo(QX(598), QY(412));
  g.stroke();
  g.strokeStyle = RIM;
  g.lineWidth = 0.6;
  g.beginPath();
  g.moveTo(QX(606), QY(456));
  g.lineTo(QX(598), QY(412));
  g.lineTo(QX(552), QY(345));
  g.stroke();
  // 슬레이트 결: 가로 줄이 촘촘하고, 위쪽은 하늘빛을 받아 살짝 밝음
  g.save();
  g.beginPath();
  for (const [x, y] of [[470, 463], [606, 456], [598, 412], [552, 345], [518, 345], [482, 410]]) g.lineTo(QX(x), QY(y));
  g.closePath();
  g.clip();
  g.strokeStyle = "rgba(140,160,160,0.18)";
  g.lineWidth = 0.3;
  for (let y = 350; y < 462; y += 4) {
    g.beginPath();
    g.moveTo(QX(470), QY(y));
    g.lineTo(QX(606), QY(y));
    g.stroke();
  }
  const sky = g.createLinearGradient(0, QY(345), 0, QY(460));
  sky.addColorStop(0, "rgba(255,210,170,0.22)");
  sky.addColorStop(1, "rgba(255,210,170,0)");
  g.fillStyle = sky;
  g.fillRect(QX(470), QY(345), QX(606) - QX(470), QY(460) - QY(345));
  g.restore();
  // 처마 돌 띠
  g.fillStyle = "#d9c8a8";
  g.fillRect(QX(428), QY(458), QX(606) - QX(428), 0.9);
  // 지붕창: 크림색 틀에 뾰족한 모자
  for (const [y, x0, x1] of [[446, 484, 596], [414, 494, 576], [384, 506, 560], [360, 520, 548]]) {
    for (let x = x0; x <= x1; x += 18) {
      // 지붕창이 지붕 위에 드리운 그림자 (오른쪽 아래로)
      g.fillStyle = "rgba(10,12,12,0.45)";
      g.beginPath();
      g.moveTo(QX(x + 5), QY(y - 6));
      g.lineTo(QX(x + 8), QY(y - 4));
      g.lineTo(QX(x + 8), QY(y + 4));
      g.lineTo(QX(x - 4), QY(y + 4));
      g.lineTo(QX(x - 5), QY(y + 2));
      g.closePath();
      g.fill();
      poly([[x - 5, y + 2], [x - 5, y - 6], [x, y - 13], [x + 5, y - 6], [x + 5, y + 2]], "#e6d8bc", "rgba(40,30,20,0.6)");
      // 지붕창 오른쪽 옆면
      poly([[x + 5, y + 2], [x + 5, y - 6], [x + 7, y - 5], [x + 7, y + 3]], "#a8987c", null);
      g.fillStyle = rnd() < 0.45 ? "#ffd38a" : "#2a2e2c";
      g.fillRect(QX(x - 2), QY(y - 4), 1, 1.4);
    }
  }
  spire(535, 345, 300);
  // 탑 모서리 원뿔 망루
  cone(428, 446, 458, 437, 412, false);
  spire(437, 412, 402);
  cone(588, 608, 458, 598, 400, true);
  spire(598, 400, 390);

  // 4) 왼쪽 돌 박공 건물: 회색 돌벽 위로 가파른 초록 지붕, 가운데 돌 박공이 지붕을 뚫고 솟음
  // 오른쪽 옆면 (뒤로 물러나는 그늘진 벽)과 지붕 옆면: 상자 모양 부피
  poly([[398, 528], [414, 520], [414, 618], [398, 625]], "#6e665a");
  poly([[402, 530], [346, 455], [360, 452], [416, 522]], "#1f342b");
  poly([[285, 528], [398, 528], [398, 625], [285, 625]], grad(285, 398, "#8e8474", "#b4a994"));
  // 돌 쌓은 결
  g.fillStyle = "rgba(70,60,50,0.18)";
  for (let y = 534; y < 622; y += 6) g.fillRect(QX(285), QY(y), QX(398) - QX(285), 0.35);
  windows(292, 392, 540, 615, 13, 12, "#2a2a2c", 0.25);
  // 처마 밑 그늘
  const eave = g.createLinearGradient(0, QY(528), 0, QY(542));
  eave.addColorStop(0, "rgba(30,25,20,0.5)");
  eave.addColorStop(1, "rgba(30,25,20,0)");
  g.fillStyle = eave;
  g.fillRect(QX(285), QY(528), QX(398) - QX(285), QY(542) - QY(528));
  poly([[280, 530], [402, 530], [346, 455], [326, 455]], grad(280, 402, "#2a4438", "#5c826e"));
  // 지붕 결
  g.strokeStyle = "rgba(150,200,175,0.15)";
  g.lineWidth = 0.3;
  for (let y = 465; y < 528; y += 5) {
    const k = (y - 455) / 75;
    g.beginPath();
    g.moveTo(QX(326 - 46 * k), QY(y));
    g.lineTo(QX(346 + 56 * k), QY(y));
    g.stroke();
  }
  // 돌 박공: 빛을 받는 왼쪽 반과 그늘진 오른쪽 반
  poly([[305, 530], [335, 530], [335, 470]], "#cdbfa6");
  poly([[335, 530], [365, 530], [335, 470]], "#9c907c");
  g.strokeStyle = "#ecdcc0";
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(QX(303), QY(531));
  g.lineTo(QX(335), QY(468));
  g.lineTo(QX(367), QY(531));
  g.stroke();
  g.fillStyle = "#ffd38a";
  g.fillRect(QX(332), QY(505), 1.2, 2);
  spire(336, 455, 432);
  poly([[350, 470], [362, 470], [362, 528], [350, 528]], "#8a4a32");

  // 5) 탑 오른쪽 아래 작은 원뿔 망루와, 오른쪽 끝 원뿔 망루 두 개
  cone(548, 576, 560, 562, 526, true);
  poly([[648, 600], [742, 600], [742, 640], [648, 640]], grad(648, 742, "#8a3e28", "#b55a38"));
  cone(648, 692, 602, 670, 552, true);
  spire(670, 552, 540);
  cone(694, 742, 610, 718, 564, true);
  spire(718, 564, 550);

  // 6) 앞을 가리는 나무들: 성의 아랫부분을 둥근 잎 덩어리가 덮음 (가을이라 초록에 주황이 섞임)
  const tree = (cx, cy, rad) => {
    for (let i = 0; i < 26; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * rad;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d * 0.7;
      // 잎 덩어리 위쪽·오른쪽(해 쪽)은 밝은 잎, 아래·왼쪽은 그늘진 잎
      const lit = (x - cx) / rad - (y - cy) / rad > 0.2;
      g.fillStyle = lit ? ["#6e8a44", "#d8892e", "#e8a040"][Math.floor(rnd() * 3)] : ["#24381f", "#2e4a2c", "#8a4a22"][Math.floor(rnd() * 3)];
      g.beginPath();
      g.arc(QX(x), QY(y), rad * QS * 0.28 * (0.6 + rnd() * 0.6), 0, Math.PI * 2);
      g.fill();
    }
  };
  tree(410, 640, 70);
  tree(300, 650, 60);
  tree(680, 650, 55);
  tree(540, 660, 50);
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
