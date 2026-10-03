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

  // 예전 숲 그리기가 쓰던 난수를 똑같이 소비해서 뒤에 오는 벚나무 모양을 그대로 유지
  for (const row of [0, 1]) {
    for (let x = left; x < right; x += r(2, 5)) {
      if (Math.abs(x - 258) < 10 && row === 0) continue;
      rnd();
      rnd();
      r(-1, 1);
      r(2.5, 5.5);
    }
  }
  const rb = seeded(1907);
  const rbr = (a, b) => a + rb() * (b - a);
  // 숲: 작은 나무 덩어리를 뒷줄(어둡게)과 앞줄(밝게)로 겹쳐 찍음.
  // 덩어리마다 그늘 쪽 큰 잎뭉치 위에 햇빛 쪽(오른쪽 위) 작은 잎뭉치를 겹쳐 둥근 부피를 냄
  for (const row of [0, 1]) {
    for (let x = left; x < right; x += rbr(3, 6)) {
      if (Math.abs(x - 258) < 10 && row === 0) continue; // 탑 앞은 비워 둠
      const pink = rb() < 0.25;
      const y = nearY(x) + 2 + row * 6 + rbr(-1, 1);
      const size = rbr(2.5, 5.5);
      const palette = pink
        ? [SAKURA_COLORS[4], SAKURA_COLORS[3], SAKURA_COLORS[2]]
        : row
          ? ["#4f6e58", "#6d8d72", "#8aa98a"]
          : ["#3c5846", "#4f6e58", "#62806a"];
      for (let k = 0; k < 3; k++) {
        const spread = size * (1 - k * 0.3);
        for (let j = 0; j < 4 - k; j++) {
          g.fillStyle = palette[k];
          g.beginPath();
          g.arc(x + k * size * 0.22 + rbr(-spread, spread) * 0.5, y - k * size * 0.25 + rbr(-spread, spread) * 0.35, spread * rbr(0.45, 0.7), 0, Math.PI * 2);
          g.fill();
        }
      }
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

  // 아래 세부 묘사는 따로 난수를 씀. 예전 능선 결이 쓰던 160번을 건너뛰어 나무 모양을 그대로 유지
  for (let i = 0; i < 160; i++) r(0, 1);
  const rr = seeded(3776);
  const rs = (a, b) => a + rr() * (b - a);
  // 눈 덮인 정상. 골짜기를 따라 눈이 가늘고 길게 흘러내림.
  // 눈 경계는 손가락처럼 끝이 뾰족해지는 줄기 수십 개가 겹친 모양 (가운데일수록 길게)
  const fingers = Array.from({ length: 80 }, () => {
    const x = cx + rs(-140, 140);
    const near = 1 - Math.min(1, Math.abs(x - cx) / 140);
    return { x, w: rs(1, 3.5), len: rs(3, 14) + near * rs(6, 30) };
  });
  const snowBase = (x) => 186 + Math.abs(x - cx) * 0.1 + 2.5 * Math.sin(x * 0.07) + 1.5 * Math.sin(x * 0.23);
  const snowY = (x) => {
    let y = snowBase(x);
    for (const f of fingers) {
      const d = Math.abs(x - f.x) / f.w;
      if (d < 1) y = Math.max(y, snowBase(x) + f.len * (1 - d));
    }
    return y;
  };
  const snow = g.createLinearGradient(cx - 90, 0, cx + 90, 0);
  snow.addColorStop(0, "#d3dcee");
  snow.addColorStop(0.55, "#f7f9ff");
  snow.addColorStop(1, "#ffffff");
  g.fillStyle = snow;
  g.beginPath();
  g.moveTo(left, peak - 10);
  for (let x = left; x <= right; x += 1) g.lineTo(x, snowY(x));
  g.lineTo(right, peak - 10);
  g.closePath();
  g.fill();
  // 눈 경계 아래로 옅게 번진 잔설
  g.fillStyle = "rgba(235,240,252,0.35)";
  g.beginPath();
  g.moveTo(left, peak - 10);
  for (let x = left; x <= right; x += 1) g.lineTo(x, snowY(x) + 3 + 2 * Math.sin(x * 0.7));
  g.lineTo(right, peak - 10);
  g.closePath();
  g.fill();

  // 골짜기 그늘: 줄기마다 정상 쪽으로 가늘어지는 옅은 파란 그늘 (눈 속에서만)
  g.save();
  g.beginPath();
  g.moveTo(left, peak - 10);
  for (let x = left; x <= right; x += 1) g.lineTo(x, snowY(x));
  g.lineTo(right, peak - 10);
  g.closePath();
  g.clip();
  for (const f of fingers) {
    const tipY = snowBase(f.x) + f.len;
    const topX = cx + (f.x - cx) * 0.12;
    g.strokeStyle = `rgba(90,110,160,${rs(0.04, 0.1)})`;
    g.lineCap = "round";
    // 아래쪽은 굵고 위로 갈수록 가늘게: 세 토막으로 나눠 굵기를 줄임
    for (let k = 0; k < 3; k++) {
      const t0 = k / 3;
      const t1 = (k + 1) / 3;
      g.lineWidth = f.w * 0.5 * (1 - t0 * 0.8);
      g.beginPath();
      g.moveTo(f.x + (topX - f.x) * t0, tipY + (peak + 8 - tipY) * t0);
      g.lineTo(f.x + (topX - f.x) * t1, tipY + (peak + 8 - tipY) * t1);
      g.stroke();
    }
  }
  g.restore();

  // 눈 아래 바위 면의 능선 결: 산기슭으로 퍼지는 아주 옅은 밝은 줄
  for (let i = 0; i < 24; i++) {
    const sx = cx + rs(-60, 60);
    const ex = cx + (sx - cx) * rs(2.2, 3.2);
    g.strokeStyle = "rgba(200,212,240,0.08)";
    g.lineWidth = rs(0.6, 1.6);
    g.beginPath();
    g.moveTo(sx, snowY(sx) + 2);
    g.lineTo(ex, fujiY(ex) + 30);
    g.stroke();
  }

  // 햇빛이 오른쪽에서 들어오므로 왼쪽 면은 그늘
  const side = g.createLinearGradient(cx - 160, 0, cx + 160, 0);
  side.addColorStop(0, "rgba(22,30,70,0.28)");
  side.addColorStop(0.5, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(255,236,226,0.2)");
  g.fillStyle = side;
  g.fillRect(left, peak - 5, size, foot - peak + 30);

  g.restore();
}

// 오층탑 (주레이토 탑을 본뜬 모양): 층마다 붉은 벽, 흰 난간, 끝이 들린 검은 지붕.
// 지붕 아래는 그늘, 지붕 윗면은 하늘빛을 받아 살짝 밝음
function paintPagoda(g, x, baseY, scale) {
  g.save();
  g.translate(x, baseY);
  g.scale(scale, scale);

  const base = g.createLinearGradient(0, -4, 0, 0);
  base.addColorStop(0, "#e8e1d6");
  base.addColorStop(1, "#b9b0a3");
  g.fillStyle = base;
  g.fillRect(-15, -4, 30, 4);

  let y = -4;
  for (let i = 0; i < 5; i++) {
    const w = 24 - i * 2.8;
    const h = 7;
    // 붉은 벽: 왼쪽(햇빛 반대)은 어둡고 오른쪽은 밝음
    const wall = g.createLinearGradient(-w * 0.32, 0, w * 0.32, 0);
    wall.addColorStop(0, "#8e2a1c");
    wall.addColorStop(0.6, "#c4422b");
    wall.addColorStop(1, "#d8604a");
    g.fillStyle = wall;
    g.fillRect(-w * 0.32, y - h, w * 0.64, h);
    // 처마 밑 그늘
    g.fillStyle = "rgba(30,10,10,0.45)";
    g.fillRect(-w * 0.32, y - h, w * 0.64, 2);
    // 기둥 사이 문살
    g.fillStyle = "rgba(255,220,190,0.35)";
    for (let k = -1; k <= 1; k++) g.fillRect(k * w * 0.16 - 0.3, y - h + 2.5, 0.6, h - 3);
    // 흰 난간
    g.fillStyle = "#efe6d8";
    g.fillRect(-w * 0.36, y - 1.4, w * 0.72, 0.9);
    y -= h;

    // 끝이 들린 지붕: 아랫면(처마 두께)은 가늘게 밝고, 윗면은 어두운 기와
    g.fillStyle = "#2c2327";
    g.beginPath();
    g.moveTo(-w / 2 - 3.5, y - 2.6);
    g.quadraticCurveTo(-w * 0.3, y + 1.5, 0, y + 1.5);
    g.quadraticCurveTo(w * 0.3, y + 1.5, w / 2 + 3.5, y - 2.6);
    g.lineTo(w * 0.28, y - 4.5);
    g.lineTo(-w * 0.28, y - 4.5);
    g.closePath();
    g.fill();
    const top = g.createLinearGradient(0, y - 4.5, 0, y + 1);
    top.addColorStop(0, "rgba(160,170,200,0.35)");
    top.addColorStop(1, "rgba(160,170,200,0)");
    g.fillStyle = top;
    g.fill();
    g.strokeStyle = "rgba(220,200,190,0.55)";
    g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(-w / 2 - 3.5, y - 2.6);
    g.quadraticCurveTo(-w * 0.3, y + 1.5, 0, y + 1.5);
    g.quadraticCurveTo(w * 0.3, y + 1.5, w / 2 + 3.5, y - 2.6);
    g.stroke();
    y -= 4.5;
  }

  // 꼭대기 상륜: 굵은 기둥에 가늘어지는 고리
  g.strokeStyle = "#2c2327";
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(0, y);
  g.lineTo(0, y - 15);
  g.stroke();
  for (let i = 0; i < 5; i++) {
    g.lineWidth = 0.9 - i * 0.12;
    const hw = 2.4 - i * 0.3;
    g.beginPath();
    g.moveTo(-hw, y - 2.5 - i * 2.6);
    g.lineTo(hw, y - 2.5 - i * 2.6);
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
    trim: ["#7a5a1c", "#f2d17a", "#c99a35", "#6b4d16"],
    plate: "富士山",
    plateFont: "600 17px 'Hiragino Mincho ProN', 'Yu Mincho', serif",
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
