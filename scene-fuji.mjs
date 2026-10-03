// 일본: 후지산과 벚꽃

import { seeded, fillSilhouette, paintTree } from "./util.mjs";

const SAKURA_COLORS = ["#fff0f4", "#ffe3ea", "#ffd0dc", "#fbb9cb", "#f6a3ba"];

function paintFuji(g, globe, groundAt) {
  const rnd = seeded(2026);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 하늘: 위는 푸르고 지평선으로 갈수록 분홍빛
  const sky = g.createLinearGradient(0, top, 0, 300);
  sky.addColorStop(0, "#7ea3d3");
  sky.addColorStop(0.5, "#c3cfe8");
  sky.addColorStop(0.82, "#f3d6e0");
  sky.addColorStop(1, "#fbe7e6");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  // 오른쪽 위 햇빛
  const sun = g.createRadialGradient(285, 105, 0, 285, 105, 130);
  sun.addColorStop(0, "rgba(255,250,236,0.95)");
  sun.addColorStop(0.12, "rgba(255,242,224,0.55)");
  sun.addColorStop(1, "rgba(255,242,224,0)");
  g.fillStyle = sun;
  g.fillRect(left, top, size, size);

  // 옅은 구름
  g.filter = "blur(6px)";
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `rgba(255,255,255,${r(0.25, 0.5)})`;
    g.beginPath();
    g.ellipse(r(50, 350), r(75, 165), r(30, 75), r(5, 11), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.filter = "none";

  paintMountain(g, r, left, right, size);

  // 산기슭 안개
  const mist = g.createLinearGradient(0, 235, 0, 295);
  mist.addColorStop(0, "rgba(250,232,237,0)");
  mist.addColorStop(1, "rgba(250,232,237,0.95)");
  g.fillStyle = mist;
  g.fillRect(left, 235, size, 90);

  // 먼 산줄기
  const farY = (x) => 280 + 7 * Math.sin(x * 0.03 + 1) + 3 * Math.sin(x * 0.09);
  g.fillStyle = "rgba(128,146,172,0.8)";
  fillSilhouette(g, farY, left, right, 400);

  const mist2 = g.createLinearGradient(0, 275, 0, 305);
  mist2.addColorStop(0, "rgba(248,228,234,0)");
  mist2.addColorStop(1, "rgba(248,228,234,0.7)");
  g.fillStyle = mist2;
  g.fillRect(left, 270, size, 50);

  // 가까운 언덕과 숲, 군데군데 핀 벚나무
  const nearY = (x) => 300 + 9 * Math.sin(x * 0.025 + 2) + 3 * Math.sin(x * 0.11);
  g.fillStyle = "#62806a";
  fillSilhouette(g, nearY, left, right, 400);
  paintPagoda(g, 258, nearY(258) + 4, 0.85);

  // 숲: 작은 나무 덩어리를 뒷줄(어둡게)과 앞줄(밝게)로 겹쳐 찍음
  for (const row of [0, 1]) {
    for (let x = left; x < right; x += r(2, 5)) {
      if (Math.abs(x - 258) < 10 && row === 0) continue; // 탑 앞은 비워 둠
      const pink = rnd() < 0.25;
      const greens = row ? ["#5f7f66", "#6d8d72", "#7b9a7c"] : ["#46644f", "#4f6e58", "#58775f"];
      g.fillStyle = pink ? SAKURA_COLORS[2 + Math.floor(rnd() * 3)] : greens[Math.floor(rnd() * 3)];
      g.beginPath();
      g.arc(x, nearY(x) + 2 + row * 6 + r(-1, 1), r(2.5, 5.5), 0, Math.PI * 2);
      g.fill();
    }
  }

  // 앞쪽 벚나무 두 그루가 양옆에서 풍경을 감쌈
  const cherry = { trunk: "#3e2c2c", shade: "#d97f9c", colors: SAKURA_COLORS.slice(0, 4) };
  paintTree(g, rnd, 34, 352, 50, -1.3, 7, 5, cherry);
  paintTree(g, rnd, 368, 354, 50, -1.85, 7, 5, cherry);

  // 꽃잎이 깔린 바닥
  const floorTop = groundAt(globe.x);
  const floor = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  floor.addColorStop(0, "#f9e6ec");
  floor.addColorStop(1, "#e7c3cf");
  g.fillStyle = floor;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  for (let i = 0; i < 500; i++) {
    const x = r(left, right);
    const y = groundAt(x) + r(1, 45);
    g.globalAlpha = r(0.5, 0.9);
    g.fillStyle = SAKURA_COLORS[1 + Math.floor(rnd() * 4)];
    g.beginPath();
    g.ellipse(x, y, r(1, 2.4), r(0.6, 1.4), r(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  g.restore();
}

// 후지산: 정상은 평평하고, 위는 가파르고 아래로 갈수록 완만한 오목한 경사
function paintMountain(g, r, left, right, size) {
  const cx = 200;
  const peak = 138;
  const foot = 310;
  const flat = 13;
  const s = 100;
  const norm = 1 - Math.exp(-(190 - flat) / s);
  const fujiY = (x) => {
    const dx = Math.abs(x - cx);
    if (dx <= flat) return peak + Math.sin(x * 1.3) * 0.7;
    return peak + ((foot - peak) * (1 - Math.exp(-(dx - flat) / s))) / norm;
  };

  g.save();
  g.beginPath();
  g.moveTo(left, foot + 20);
  for (let x = left; x <= right; x += 2) g.lineTo(x, fujiY(x) + r(-0.5, 0.5));
  g.lineTo(right, foot + 20);
  g.closePath();
  g.clip();

  const body = g.createLinearGradient(0, peak, 0, foot);
  body.addColorStop(0, "#4b5e8c");
  body.addColorStop(0.55, "#7184ae");
  body.addColorStop(1, "#bcc5dd");
  g.fillStyle = body;
  g.fillRect(left, peak - 5, size, foot - peak + 30);

  // 눈 덮인 정상. 골짜기를 따라 눈이 아래로 흘러내린 모양
  const snowY = (x) =>
    196 +
    26 * Math.pow(Math.max(0, Math.sin(x * 0.42 + 0.8)), 6) +
    18 * Math.pow(Math.max(0, Math.sin(x * 0.27 + 2)), 5) +
    10 * Math.pow(Math.max(0, Math.sin(x * 0.11 + 1)), 2) +
    4 * Math.sin(x * 0.05);
  const snow = g.createLinearGradient(0, peak, 0, 250);
  snow.addColorStop(0, "#ffffff");
  snow.addColorStop(1, "#dde4f2");
  g.fillStyle = snow;
  g.beginPath();
  g.moveTo(left, peak - 10);
  for (let x = left; x <= right; x += 2) g.lineTo(x, snowY(x));
  g.lineTo(right, peak - 10);
  g.closePath();
  g.fill();

  // 정상에서 흘러내리는 능선 결. 흐리게 번지게 그려 실선처럼 보이지 않게 함
  g.filter = "blur(1.2px)";
  for (let i = 0; i < 40; i++) {
    const sx = cx + r(-flat, flat);
    const ex = cx + r(-180, 180);
    const ey = fujiY(ex) + 40;
    g.strokeStyle = i % 2 ? "rgba(255,255,255,0.1)" : "rgba(40,52,100,0.09)";
    g.lineWidth = r(1, 3);
    g.beginPath();
    g.moveTo(sx, peak + 6);
    g.quadraticCurveTo((sx + ex) / 2, fujiY((sx + ex) / 2) + r(3, 10), ex, ey);
    g.stroke();
  }
  g.filter = "none";

  // 햇빛이 오른쪽에서 들어오므로 왼쪽 면은 그늘
  const side = g.createLinearGradient(cx - 160, 0, cx + 160, 0);
  side.addColorStop(0, "rgba(22,30,70,0.28)");
  side.addColorStop(0.5, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(255,236,226,0.2)");
  g.fillStyle = side;
  g.fillRect(left, peak - 5, size, foot - peak + 30);

  g.restore();
}

// 오층탑 (주레이토 탑을 본뜬 모양)
function paintPagoda(g, x, baseY, scale) {
  g.save();
  g.translate(x, baseY);
  g.scale(scale, scale);

  g.fillStyle = "#d8d0c6";
  g.fillRect(-15, -4, 30, 4);

  let y = -4;
  for (let i = 0; i < 5; i++) {
    const w = 24 - i * 2.8;
    const h = 7;
    g.fillStyle = "#c4422b";
    g.fillRect(-w * 0.32, y - h, w * 0.64, h);
    g.fillStyle = "rgba(255,240,220,0.5)";
    g.fillRect(-w * 0.32, y - h, 1.2, h);
    y -= h;

    // 끝이 살짝 들린 지붕
    g.fillStyle = "#2c2327";
    g.beginPath();
    g.moveTo(-w / 2 - 3, y - 2);
    g.quadraticCurveTo(-w * 0.3, y + 1.5, 0, y + 1.5);
    g.quadraticCurveTo(w * 0.3, y + 1.5, w / 2 + 3, y - 2);
    g.lineTo(w * 0.28, y - 4.5);
    g.lineTo(-w * 0.28, y - 4.5);
    g.closePath();
    g.fill();
    y -= 4.5;
  }

  g.strokeStyle = "#2c2327";
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(0, y);
  g.lineTo(0, y - 15);
  g.stroke();
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.moveTo(-2, y - 3 - i * 3);
    g.lineTo(2, y - 3 - i * 3);
    g.stroke();
  }
  g.restore();
}

// 벚꽃잎: 끝이 V자로 살짝 갈라진 둥근 잎
function drawPetal(ctx, p) {
  const s = p.size;
  ctx.globalAlpha = p.settled ? 0.95 : 0.75 + s * 0.05;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // 뒤집히는 각도에 따라 폭이 줄었다 늘었다 해서 회전하는 것처럼 보임
  ctx.scale(Math.max(0.2, Math.abs(Math.cos(p.flip))), 1);
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.bezierCurveTo(-s * 0.95, s * 0.25, -s * 0.75, -s * 0.9, -s * 0.22, -s);
  ctx.lineTo(0, -s * 0.72);
  ctx.lineTo(s * 0.22, -s);
  ctx.bezierCurveTo(s * 0.75, -s * 0.9, s * 0.95, s * 0.25, 0, s);
  ctx.fill();
  ctx.restore();
}

export const fuji = {
  id: "japan",
  label: "일본 · 후지산",
  title: "富士山",
  paint: paintFuji,
  glare: 1,
  base: {
    body: ["#0e0809", "#3a2426", "#4a2f30", "#24161a", "#0b0607"],
    collar: "#1d1214",
    trim: ["#7a5a1c", "#f2d17a", "#c99a35", "#6b4d16"],
    plate: "富士山 · MT. FUJI",
    plateFont: "600 13px 'Hiragino Mincho ProN', 'Yu Mincho', serif",
    plateInk: "#2b1d10",
  },
  // 꽃잎은 눈보다 가볍고 넓어서 천천히 가라앉고 물살을 잘 탄다
  particles: {
    count: 220,
    blend: "source-over",
    make(rand) {
      const size = rand(2.6, 4.6);
      return {
        size,
        color: SAKURA_COLORS[Math.floor(rand(0, SAKURA_COLORS.length))],
        sink: 0.1 + size * 0.03 + rand(-0.03, 0.03),
        drag: rand(0.08, 0.13),
        inertia: rand(0.3, 0.6),
        grip: rand(0.4, 1.8),
        angle: rand(0, Math.PI * 2),
        spin: rand(-0.04, 0.04),
        flipSpeed: rand(0.03, 0.08),
        flutter: 0.025, // 뒤집힐 때 옆으로 미끄러지는 정도
      };
    },
    draw: drawPetal,
  },
};
