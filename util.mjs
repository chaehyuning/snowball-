// 장면 파일들이 함께 쓰는 도구

// 새로고침해도 같은 풍경이 나오도록 고정된 난수
export function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// yAt(x) 곡선 아래를 bottom까지 채움 (산줄기, 언덕, 바닥)
export function fillSilhouette(g, yAt, left, right, bottom) {
  g.beginPath();
  g.moveTo(left, bottom);
  for (let x = left; x <= right; x += 2) g.lineTo(x, yAt(x));
  g.lineTo(right, bottom);
  g.closePath();
  g.fill();
}

// 가지를 재귀로 뻗고, 가지 끝마다 꽃이나 잎 덩어리를 겹겹이 찍는다.
// look: { trunk: 가지 색, shade: 뒤쪽 그늘 색, colors: 앞쪽 밝은 색들 }
export function paintTree(g, rnd, x, y, len, angle, width, depth, look) {
  const r = (a, b) => a + rnd() * (b - a);
  const clusters = [];

  function branch(x, y, len, angle, width, depth) {
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    const mx = (x + ex) / 2 + r(-0.15, 0.15) * len;
    const my = (y + ey) / 2 + r(-0.15, 0.15) * len;
    g.strokeStyle = look.trunk;
    g.lineWidth = width;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(mx, my, ex, ey);
    g.stroke();

    if (depth === 0) {
      clusters.push([ex, ey, r(10, 17)]);
      return;
    }
    if (depth <= 2) clusters.push([ex, ey, r(8, 13)]);
    const n = rnd() < 0.4 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      branch(ex, ey, len * r(0.62, 0.8), angle + r(-0.7, 0.7), width * 0.66, depth - 1);
    }
  }
  branch(x, y, len, angle, width, depth);

  // 뒤쪽 그늘진 덩어리 → 앞쪽 밝은 덩어리 순서로 찍어 입체감을 냄
  for (const pass of [0, 1]) {
    for (const [cx, cy, cr] of clusters) {
      const count = Math.round(cr * (pass ? 2.2 : 1.4));
      for (let i = 0; i < count; i++) {
        const a = r(0, Math.PI * 2);
        const d = Math.sqrt(rnd()) * cr;
        const shift = pass ? -1.2 : 1.5;
        g.globalAlpha = pass ? r(0.65, 0.95) : 0.6;
        g.fillStyle = pass ? look.colors[Math.floor(rnd() * look.colors.length)] : look.shade;
        g.beginPath();
        g.arc(cx + Math.cos(a) * d + shift, cy + Math.sin(a) * d + shift, r(1.2, 3), 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  g.globalAlpha = 1;
}

// 분수 물줄기 하나: 뿜는 곳은 굵고 진하며 끝으로 갈수록 가늘고 투명해지는 곡선,
// 겉에 옅은 물안개, 끝에 흩어지는 물방울, 떨어지는 자리에 하얀 물보라 고리
export function waterJet(g, rnd, x0, y0, cx, cy, x1, y1, w0, splashY = y1, jets = null) {
  jets?.push({ x0, y0, cx, cy, x1, y1, w0, splashY, phase: rnd() });
  const pt = (t) => {
    const u = 1 - t;
    return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
  };
  g.save();
  g.lineCap = "round";
  const N = 14;
  // 겉 물안개
  for (let i = 0; i < N; i++) {
    const t0 = i / N;
    const t1 = (i + 1) / N;
    const [ax, ay] = pt(t0);
    const [bx, by] = pt(t1);
    g.strokeStyle = `rgba(220,235,255,${0.12 * (1 - t0 * 0.6)})`;
    g.lineWidth = w0 * 2.6 * (1 - t0 * 0.5);
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
    g.stroke();
  }
  // 물줄기 몸통과 가운데 밝은 심
  for (let i = 0; i < N; i++) {
    const t0 = i / N;
    const t1 = (i + 1) / N;
    const [ax, ay] = pt(t0);
    const [bx, by] = pt(t1);
    g.strokeStyle = `rgba(235,245,255,${0.85 - t0 * 0.55})`;
    g.lineWidth = Math.max(0.35, w0 * (1 - t0 * 0.75));
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
    g.stroke();
    g.strokeStyle = `rgba(255,255,255,${0.9 - t0 * 0.7})`;
    g.lineWidth = Math.max(0.2, w0 * 0.35 * (1 - t0));
    g.stroke();
  }
  // 끝에서 흩어지는 물방울
  for (let i = 0; i < 9; i++) {
    const t = 0.78 + rnd() * 0.3;
    const [px, py] = pt(Math.min(1, t));
    g.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.5})`;
    g.beginPath();
    g.arc(px + (rnd() - 0.5) * w0 * 4, py + (rnd() - 0.3) * w0 * 4, 0.3 + rnd() * w0 * 0.35, 0, Math.PI * 2);
    g.fill();
  }
  // 떨어지는 자리의 물보라
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 0.6;
  g.beginPath();
  g.ellipse(x1, splashY, w0 * 2.2, w0 * 0.6, 0, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.35)";
  g.beginPath();
  g.ellipse(x1, splashY - w0 * 0.4, w0 * 1.2, w0 * 0.9, 0, Math.PI, 0);
  g.fill();
  g.restore();
}

// 물줄기를 따라 흘러가는 빛 방울과 떨어지는 자리에서 퍼지는 물결 고리 (매 프레임)
export function animateJets(ctx, t, jets) {
  if (!jets.length) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const j of jets) {
    const pt = (s) => {
      const u = 1 - s;
      return [u * u * j.x0 + 2 * u * s * j.cx + s * s * j.x1, u * u * j.y0 + 2 * u * s * j.cy + s * s * j.y1];
    };
    // 흘러가는 물방울 세 개: 뿜는 곳에서 끝으로
    for (let k = 0; k < 3; k++) {
      const s = (t * 0.0011 + j.phase + k / 3) % 1;
      const [x, y] = pt(s);
      const rr = Math.max(0.4, j.w0 * (0.7 - s * 0.4));
      ctx.globalAlpha = 0.85 * (1 - s * 0.6);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
    }
    // 물줄기 전체가 가볍게 일렁이는 밝은 결
    const s2 = (t * 0.0007 + j.phase) % 1;
    const [ax, ay] = pt(s2);
    const [bx, by] = pt(Math.min(1, s2 + 0.15));
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#e8f6ff";
    ctx.lineWidth = j.w0 * 0.9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    // 떨어지는 자리의 물결 고리가 퍼지며 사라짐
    const ring = (t * 0.0012 + j.phase) % 1;
    ctx.globalAlpha = 0.3 * (1 - ring);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(j.x1, j.splashY, j.w0 * (1.5 + ring * 4), j.w0 * (0.4 + ring * 1.1), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 흐림(filter)을 도형마다 걸면 그릴 때마다 흐림 계산을 따로 해서 매우 느림.
// box(x, y, w, h) 안의 도형을 흐림 없이 따로 그린 뒤, 그 한 장에만 흐림을 한 번 걸어 옮김
export function softly(g, filter, [x, y, w, h], draw) {
  const m = g.getTransform();
  const k = Math.hypot(m.a, m.b) || 1;
  const pad = 16;
  const bx = x - pad;
  const by = y - pad;
  const bw = w + pad * 2;
  const bh = h + pad * 2;
  const c = document.createElement("canvas");
  c.width = Math.ceil(bw * k);
  c.height = Math.ceil(bh * k);
  const t = c.getContext("2d");
  t.scale(c.width / bw, c.height / bh);
  t.translate(-bx, -by);
  draw(t);
  g.save();
  g.filter = filter;
  g.drawImage(c, bx, by, bw, bh);
  g.restore();
}
