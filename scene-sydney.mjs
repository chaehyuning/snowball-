// 호주: 한낮의 시드니 항구, 오페라하우스와 하버브리지, 흩날리는 물방울

import { seeded, fillSilhouette } from "./util.mjs";

const DROP_COLORS = ["rgba(255,214,236,0.55)", "rgba(200,236,255,0.55)", "rgba(190,250,236,0.55)", "rgba(143,211,247,0.55)", "rgba(230,220,255,0.55)"];

function paintSydney(g, globe, groundAt) {
  const rnd = seeded(1973);
  const r = (a, b) => a + rnd() * (b - a);
  const left = globe.x - globe.r;
  const right = globe.x + globe.r;
  const top = globe.y - globe.r;
  const size = globe.r * 2;

  g.save();
  g.beginPath();
  g.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  g.clip();

  // 쨍한 한낮 하늘
  const sky = g.createLinearGradient(0, top, 0, 250);
  sky.addColorStop(0, "#2f86d6");
  sky.addColorStop(0.6, "#7cc3ef");
  sky.addColorStop(1, "#d3eefa");
  g.fillStyle = sky;
  g.fillRect(left, top, size, size);

  const sun = g.createRadialGradient(300, 85, 0, 300, 85, 110);
  sun.addColorStop(0, "rgba(255,255,245,0.9)");
  sun.addColorStop(0.15, "rgba(255,255,240,0.45)");
  sun.addColorStop(1, "rgba(255,255,240,0)");
  g.fillStyle = sun;
  g.fillRect(left, top, size, size);

  // 뭉게구름
  g.filter = "blur(3px)";
  for (let c = 0; c < 2; c++) {
    const cx = r(60, 340);
    const cy = r(90, 170);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = `rgba(255,255,255,${r(0.55, 0.85)})`;
      g.beginPath();
      g.ellipse(cx + r(-22, 22), cy + r(-5, 4), r(10, 20), r(6, 11), 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.filter = "none";

  // 다리 너머 도심 빌딩과 시드니 타워 (멀어서 흐릿한 푸른빛)
  // 빌딩마다 햇빛 받는 왼쪽 면과 그늘진 오른쪽 면, 옅은 창 줄. 도심(왼쪽)은 높은 빌딩이 몰려 있음
  const rc = seeded(1788);
  const towers = [];
  for (let x = left + 20; x < right - 20; x += r(12, 22)) {
    const h = r(5, 14) + (x < 200 ? r(0, 10) : 0);
    const color = ["#9cbad0", "#a8c4d8", "#b3cce0"][Math.floor(rnd() * 3)];
    const w = r(5, 10);
    towers.push([x, h + (x > 60 && x < 190 ? rc() * 16 : 0), w, color]);
  }
  for (const [x, h, w, color] of towers) {
    g.fillStyle = color;
    g.fillRect(x, 244 - h, w, h + 4);
    g.fillStyle = "rgba(255,255,255,0.22)";
    g.fillRect(x, 244 - h, w * 0.4, h + 4);
    g.fillStyle = "rgba(60,90,120,0.12)";
    g.fillRect(x + w * 0.7, 244 - h, w * 0.3, h + 4);
    g.fillStyle = "rgba(70,100,130,0.18)";
    for (let wy = 244 - h + 2; wy < 244; wy += 2.2) g.fillRect(x + 0.8, wy, w - 1.6, 0.5);
  }
  // 물가에 낀 옅은 해무
  const seaHaze = g.createLinearGradient(0, 228, 0, 246);
  seaHaze.addColorStop(0, "rgba(220,238,250,0)");
  seaHaze.addColorStop(1, "rgba(220,238,250,0.6)");
  g.fillStyle = seaHaze;
  g.fillRect(left, 228, size, 18);
  g.fillStyle = "#94b2c8";
  g.fillRect(105, 172, 2, 72);
  g.fillStyle = "#c9a85a";
  g.beginPath();
  g.ellipse(106, 175, 5, 4, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#94b2c8";
  g.fillRect(105.5, 162, 1, 9);

  paintBridge(g);

  // 바다: 잔잔한 항구의 청록빛. 수평선 쪽은 하늘을 비춰 옅고, 앞으로 올수록 깊은 청록
  const sea = g.createLinearGradient(0, 244, 0, 332);
  sea.addColorStop(0, "#7cc0cf");
  sea.addColorStop(0.15, "#3f9ab6");
  sea.addColorStop(0.6, "#23779c");
  sea.addColorStop(1, "#175d82");
  g.fillStyle = sea;
  g.fillRect(left, 244, size, 100);
  g.fillStyle = "rgba(235,248,255,0.45)";
  g.fillRect(left, 244, size, 1);

  // 바다 깊이: 얕은 곳은 밝은 청록, 깊은 곳은 짙은 청색이 넓고 흐리게 번짐
  const rw = seeded(2000);
  g.save();
  g.filter = "blur(10px)";
  for (let i = 0; i < 12; i++) {
    const wx = left + rw() * size;
    const wy = 254 + rw() * 70;
    g.fillStyle = i % 2 ? "rgba(70,190,200,0.16)" : "rgba(10,60,95,0.18)";
    g.beginPath();
    g.ellipse(wx, wy, 40 + rw() * 50, 5 + rw() * 7, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // 도심 빌딩이 비친 흐린 세로 그림자
  g.fillStyle = "rgba(60,95,130,0.16)";
  for (let y = 245; y < 264; y += 1.4) {
    for (let x = left + 20; x < 200; x += 3 + rw() * 5) {
      if (rw() < 0.5 - (y - 245) * 0.02) g.fillRect(x, y, 1 + rw() * 3, 0.7);
    }
  }

  // 잔물결: 짧고 옅은 밝은 결과 그 아래 그늘이 촘촘히 깔린 결. 멀리는 가늘고 빽빽하게, 가까이는 조금 길게
  const rv = seeded(4242);
  for (let y = 246; y < 334; ) {
    const near = (y - 246) / 88;
    for (let x = left - rv() * 6; x < right; x += 2 + near * 7 + rv() * (3 + near * 8)) {
      const l = 1.5 + near * 6 * (0.5 + rv());
      g.fillStyle = `rgba(8,55,85,${0.1 + near * 0.12})`;
      g.fillRect(x + l * 0.2, y + 0.6 + near * 0.8, l, 0.5 + near * 0.6);
      g.fillStyle = `rgba(200,240,245,${0.1 + near * 0.16})`;
      g.fillRect(x, y, l, 0.4 + near * 0.5);
    }
    y += 0.9 + near * 2.4 + rv() * 0.6;
  }

  // 바람이 스친 물결 띠: 가로로 길게 옅게 밝은 결
  g.strokeStyle = "rgba(200,235,255,0.16)";
  g.lineWidth = 0.6;
  for (let i = 0; i < 6; i++) {
    const y = 252 + i * 9 + rw() * 4;
    g.beginPath();
    g.moveTo(left, y);
    for (let x = left; x <= right; x += 10) g.lineTo(x, y + Math.sin(x * 0.04 + i) * 1.2);
    g.stroke();
  }

  // 햇빛 윤슬: 해 아래로 길게 뻗는 반짝이는 길. 앞으로 올수록 넓게 퍼짐
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 90; i++) {
    const y = 246 + Math.pow(rv(), 1.3) * 82;
    const near = (y - 246) / 82;
    const spread = 12 + near * 58;
    const dx = (rv() - 0.5) * 2 * spread * rv();
    const w = 1 + near * 5 * rv();
    g.fillStyle = `rgba(255,252,228,${(0.12 + 0.3 * rv()) * (1 - (Math.abs(dx) / spread) * 0.7)})`;
    g.fillRect(300 + dx - w / 2, y, w, 0.5 + near * 0.7);
  }
  g.globalCompositeOperation = "source-over";


  // 멀리 떠 있는 작은 요트 두 척: 햇빛 받는 돛과 그늘진 돛
  for (const [bx, by, bs] of [[96, 252, 0.8], [132, 256, 1]]) {
    g.fillStyle = "#f8fbff";
    g.beginPath();
    g.moveTo(bx, by - 1);
    g.lineTo(bx, by - 12 * bs);
    g.lineTo(bx + 6 * bs, by - 1);
    g.closePath();
    g.fill();
    g.fillStyle = "#d9e3ee";
    g.beginPath();
    g.moveTo(bx - 0.5, by - 1);
    g.lineTo(bx - 0.5, by - 9 * bs);
    g.lineTo(bx - 4 * bs, by - 1);
    g.closePath();
    g.fill();
    g.fillStyle = "#33465a";
    g.beginPath();
    g.moveTo(bx - 5 * bs, by - 1);
    g.lineTo(bx + 7 * bs, by - 1);
    g.lineTo(bx + 5.5 * bs, by + 0.8);
    g.lineTo(bx - 4 * bs, by + 0.8);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.fillRect(bx - 4 * bs, by + 1.4, 10 * bs, 0.5);
  }

  paintOperaHouse(g);
  harbourReflection(g, rnd);
  paintFerry(g, 262, 298, 1.1);

  // 바닥: 물가의 사암 테라스
  const floorTop = groundAt(globe.x);
  const stone = g.createLinearGradient(0, floorTop, 0, floorTop + 60);
  stone.addColorStop(0, "#e2c08e");
  stone.addColorStop(1, "#a97c4e");
  g.fillStyle = stone;
  fillSilhouette(g, groundAt, left, right, globe.y + globe.r);
  g.strokeStyle = "rgba(120,80,40,0.3)";
  g.lineWidth = 0.7;
  for (let y = floorTop + 8; y < floorTop + 55; y += 7) {
    g.beginPath();
    for (let x = left; x <= right; x += 6) g.lineTo(x, Math.max(groundAt(x) + 3, y + Math.sin(x * 0.07 + y) * 1.5));
    g.stroke();
  }
  g.strokeStyle = "rgba(255,255,255,0.6)";
  g.lineWidth = 1.5;
  g.beginPath();
  for (let x = left; x <= right; x += 3) g.lineTo(x, groundAt(x) + 1 + Math.sin(x * 0.2) * 1);
  g.stroke();

  g.restore();
}

// 하버브리지: 강철 아치와 양끝 화강암 기둥, 꼭대기 국기
// 미세스 매쿼리스 체어에서 보면 다리가 오페라하우스 뒤를 크게 감쌈
// 물에 비친 오페라하우스와 다리: 물가 선(y 287)을 기준으로 위 그림을 뒤집어, 줄마다 물결만큼 좌우로 흔들어 찍음.
// 아래로 갈수록 흐리고 물빛에 잠김
function harbourReflection(g, rnd) {
  const WATERLINE = 287;
  const x0 = 150;
  const x1 = 372;
  const depth = 60;
  const m = g.getTransform();
  const k = m.a;
  // 지금까지 그린 그림에서 물가 위쪽 띠를 떠 옴 (자기 캔버스를 직접 읽으면 겹쳐 그려져서 복사본을 씀)
  const src = document.createElement("canvas");
  src.width = Math.ceil((x1 - x0) * k);
  src.height = Math.ceil(depth * k);
  src.getContext("2d").drawImage(g.canvas, x0 * k + m.e, (WATERLINE - depth) * k + m.f, src.width, src.height, 0, 0, src.width, src.height);
  g.save();
  for (let row = 0; row < depth; row += 1) {
    const fade = 1 - row / depth;
    const wobble = Math.sin(row * 1.7) * (0.6 + row * 0.08) + (rnd() - 0.5) * 0.8;
    g.globalAlpha = 0.5 * fade;
    // 물가에서 row만큼 아래 = 원래 그림에서 물가 row만큼 위 (거울)
    const sy = (depth - row - 1) * k;
    g.drawImage(src, 0, sy, src.width, k, x0 + wobble, WATERLINE + row, x1 - x0, 1.05);
  }
  g.globalAlpha = 1;
  // 물빛으로 살짝 덮어 반사가 물 아래 있는 느낌
  const tint = g.createLinearGradient(0, WATERLINE, 0, WATERLINE + depth);
  tint.addColorStop(0, "rgba(40,120,150,0.12)");
  tint.addColorStop(1, "rgba(40,120,150,0.3)");
  g.fillStyle = tint;
  g.fillRect(x0, WATERLINE, x1 - x0, depth);
  g.restore();
}

function paintBridge(g) {
  const x0 = 58;
  const x1 = 318;
  const deck = 236;
  const arch = (x) => deck - 54 * (1 - ((2 * (x - x0)) / (x1 - x0) - 1) ** 2);
  const lower = (x) => arch(x) + 5 + 3 * (1 - ((2 * (x - x0)) / (x1 - x0) - 1) ** 2);

  // 다리 밑 물 위로 떨어진 그늘
  g.fillStyle = "rgba(40,70,100,0.12)";
  g.fillRect(x0 - 20, deck + 1.4, x1 - x0 + 40, 3);

  // 위·아래 현 사이 트러스 판: 강철 회청색, 위 가장자리는 하늘빛을 받아 밝음
  g.fillStyle = "rgba(96,116,136,0.55)";
  g.beginPath();
  for (let x = x0; x <= x1; x += 2) g.lineTo(x, arch(x));
  for (let x = x1; x >= x0; x -= 2) g.lineTo(x, lower(x));
  g.closePath();
  g.fill();
  // X자 가새: 칸마다 두 줄
  g.strokeStyle = "rgba(60,78,98,0.85)";
  g.lineWidth = 0.45;
  for (let x = x0 + 2; x < x1 - 5; x += 5.2) {
    g.beginPath();
    g.moveTo(x, arch(x));
    g.lineTo(x + 5.2, lower(x + 5.2));
    g.moveTo(x, lower(x));
    g.lineTo(x + 5.2, arch(x + 5.2));
    g.stroke();
  }
  // 상판을 매다는 수직 행어: 아치 아래 현에서 상판까지, 가운데로 갈수록 김
  g.strokeStyle = "rgba(70,90,110,0.8)";
  g.lineWidth = 0.5;
  for (let x = x0 + 8; x < x1 - 6; x += 5.2) {
    if (lower(x) > deck - 1) continue;
    g.beginPath();
    g.moveTo(x, lower(x));
    g.lineTo(x, deck);
    g.stroke();
  }
  // 위·아래 현: 위는 굵고 밝은 테, 아래는 가늘게
  g.strokeStyle = "#4e6276";
  g.lineWidth = 2.4;
  g.beginPath();
  for (let x = x0; x <= x1; x += 2) g.lineTo(x, arch(x));
  g.stroke();
  g.strokeStyle = "rgba(220,235,248,0.7)";
  g.lineWidth = 0.6;
  g.beginPath();
  for (let x = x0; x <= x1; x += 2) g.lineTo(x, arch(x) - 0.9);
  g.stroke();
  g.strokeStyle = "#5a6e82";
  g.lineWidth = 1.2;
  g.beginPath();
  for (let x = x0; x <= x1; x += 2) g.lineTo(x, lower(x));
  g.stroke();

  // 상판: 도로 가장자리, 가운데 차들(작은 색 점), 철길 난간
  const road = g.createLinearGradient(0, deck - 1.5, 0, deck + 1.6);
  road.addColorStop(0, "#7d90a2");
  road.addColorStop(1, "#46596b");
  g.fillStyle = road;
  g.fillRect(x0 - 20, deck - 1.5, x1 - x0 + 40, 3.1);
  g.fillStyle = "rgba(230,240,250,0.6)";
  g.fillRect(x0 - 20, deck - 1.5, x1 - x0 + 40, 0.4);
  const rcars = seeded(1932);
  for (let x = x0 - 10; x < x1 + 14; x += 3 + rcars() * 7) {
    g.fillStyle = ["#e04b4b", "#f3f1ea", "#2f5f9a", "#e9c23a", "#3a3a3a"][Math.floor(rcars() * 5)];
    g.fillRect(x, deck - 1.1, 1.4, 0.8);
  }

  // 화강암 탑문: 돌단 결, 왼쪽은 밝고 오른쪽은 그늘, 위 난간과 아치 구멍
  for (const px of [x0 - 5, x1 - 5]) {
    const stone = g.createLinearGradient(px, 0, px + 11, 0);
    stone.addColorStop(0, "#e2cfaa");
    stone.addColorStop(0.6, "#cdb995");
    stone.addColorStop(1, "#a8936f");
    g.fillStyle = stone;
    g.fillRect(px, deck - 18, 11, 24);
    g.fillStyle = "rgba(120,100,70,0.25)";
    for (let by = deck - 15; by < deck + 6; by += 2.4) g.fillRect(px, by, 11, 0.4);
    g.fillStyle = "#b39f7c";
    g.fillRect(px - 0.6, deck - 18.5, 12.2, 1.6);
    g.fillStyle = "#f0e2c4";
    g.fillRect(px - 0.6, deck - 18.5, 12.2, 0.4);
    g.fillStyle = "#6f8396";
    g.beginPath();
    g.moveTo(px + 3, deck + 2);
    g.lineTo(px + 3, deck - 6);
    g.quadraticCurveTo(px + 5.5, deck - 10, px + 8, deck - 6);
    g.lineTo(px + 8, deck + 2);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.25)";
    g.fillRect(px + 3, deck - 6, 0.6, 8);
  }

  // 아치 꼭대기의 호주 국기
  const fx = (x0 + x1) / 2;
  const fy = arch(fx);
  g.strokeStyle = "#3d4a57";
  g.lineWidth = 0.6;
  g.beginPath();
  g.moveTo(fx, fy);
  g.lineTo(fx, fy - 9);
  g.stroke();
  g.fillStyle = "#1f3a8a";
  g.fillRect(fx, fy - 9, 7, 4.5);
  g.fillStyle = "#ffffff";
  g.fillRect(fx + 1.5, fy - 7.4, 1.2, 1.2);
  g.fillRect(fx + 5, fy - 8.2, 0.8, 0.8);
  g.fillRect(fx + 4.4, fy - 6.2, 0.8, 0.8);
  g.fillStyle = "#c8102e";
  g.fillRect(fx, fy - 9, 3, 0.6);
}

// 오페라하우스: 옆에서 본 전형적인 모습을 참고 그림 좌표 그대로 옮겨 그림.
// 참고 그림 좌표(가로 약 1000) → 장면 좌표: x = 148 + (rx − 30)·0.22, y = 286 − (970 − ry)·0.22
const OX = (rx) => 148 + (rx - 30) * 0.22;
const OY = (ry) => 286 - (970 - ry) * 0.22;
const OP = (p) => [OX(p[0]), OY(p[1])];

// 조가비: 끝(tip)에서 등 곡선(c1, c2)을 따라 밑동(end)까지 내려오는 흰 겉면과,
// 끝에서 앞 모서리를 따라 내려오는 입구(앞 밑동 front → 안쪽 밑동 inner). 입구 안은 끝 쪽이 짙은 그늘, 아래는 연한 안쪽 면
const OPERA_SHELLS = [
  // 오른쪽을 향해 누운 큰 조가비 (가장 뒤)
  { tip: [775, 732], c1: [690, 712], c2: [600, 760], end: [585, 880], front: [770, 880], inner: [690, 880] },
  // 왼쪽을 향한 조가비 셋: 가장 큰 것부터 (뒤에서 앞으로)
  { tip: [378, 572], c1: [490, 585], c2: [585, 700], end: [605, 880], front: [400, 862], inner: [505, 880] },
  { tip: [280, 648], c1: [385, 640], c2: [480, 720], end: [505, 880], front: [300, 862], inner: [410, 876] },
  { tip: [145, 698], c1: [250, 688], c2: [365, 735], end: [392, 842], front: [168, 840], inner: [292, 842] },
  // 레스토랑 한 쌍
  { tip: [962, 795], c1: [905, 788], c2: [855, 815], end: [838, 885], front: [952, 885], inner: [900, 885] },
  { tip: [750, 795], c1: [795, 788], c2: [835, 815], end: [848, 885], front: [765, 885], inner: [806, 885] },
];

function paintOperaHouse(g) {
  const line = "#8f7454";
  const poly = (pts) => {
    g.beginPath();
    g.moveTo(...OP(pts[0]));
    for (const q of pts.slice(1)) g.lineTo(...OP(q));
    g.closePath();
  };
  // 정면은 위가 밝고 아래로 갈수록 어두워 서 있는 벽처럼 보임
  const block = (pts, fill) => {
    poly(pts);
    const ys = pts.map((q) => OY(q[1]));
    const vg = g.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
    vg.addColorStop(0, fill);
    vg.addColorStop(1, "#8a6c4c");
    g.fillStyle = vg;
    g.fill();
    g.strokeStyle = line;
    g.lineWidth = 0.5;
    g.stroke();
  };
  // 맨 아래 바닥판
  block([[30, 940], [1030, 940], [1030, 970], [30, 970]], "#dcc49c");
  // 기단 몸체: 왼쪽 위로 한 단 높은 테라스, 오른쪽은 낮게 물러남
  block([[110, 940], [110, 898], [128, 880], [1000, 880], [1000, 900], [1030, 905], [1030, 940]], "#c9a87c");
  block([[128, 880], [128, 848], [470, 848], [470, 880]], "#d4b488");
  block([[470, 880], [470, 862], [880, 862], [880, 880]], "#cdae82");
  // 단마다 위에서 내려다보이는 윗면: 뒤로 살짝 물러나는 밝은 판 (턱 앞 모서리에 햇빛)
  for (const [x0, x1, y] of [[128, 470, 848], [470, 880, 862], [110, 1030, 940], [880, 1000, 880], [30, 110, 940]]) {
    g.fillStyle = "#efe0c2";
    g.beginPath();
    g.moveTo(OX(x0), OY(y));
    g.lineTo(OX(x1), OY(y));
    g.lineTo(OX(x1) - 1.2, OY(y) - 1.6);
    g.lineTo(OX(x0) + 1.2, OY(y) - 1.6);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(255,250,236,0.9)";
    g.fillRect(OX(x0), OY(y) - 0.3, OX(x1) - OX(x0), 0.6);
  }
  // 어두운 가로 창 띠
  g.fillStyle = "#4a3828";
  for (const [x, y, w, h] of [
    [150, 912, 90, 6],
    [250, 900, 70, 5],
    [330, 914, 120, 6],
    [160, 860, 120, 5],
    [300, 868, 140, 4],
    [500, 900, 250, 5],
    [520, 920, 240, 8],
    [770, 904, 90, 5],
    [890, 914, 110, 6],
    [500, 868, 120, 4],
    [700, 868, 150, 4],
  ]) {
    g.fillRect(OX(x), OY(y), w * 0.22, h * 0.22);
  }
  g.fillStyle = "rgba(255,226,180,0.4)";
  for (let x = 522; x < 760; x += 14) g.fillRect(OX(x), OY(920), 0.4, 8 * 0.22);
  // 창 띠 깊이: 위 처마 그늘과 아래 밝은 턱
  for (const [x, y, w, h] of [[150, 912, 90, 6], [330, 914, 120, 6], [500, 900, 250, 5], [520, 920, 240, 8], [890, 914, 110, 6]]) {
    g.fillStyle = "rgba(40,28,20,0.35)";
    g.fillRect(OX(x) - 0.5, OY(y) - 0.8, w * 0.22 + 1, 0.8);
    g.fillStyle = "rgba(250,236,210,0.7)";
    g.fillRect(OX(x) - 0.5, OY(y + h), w * 0.22 + 1, 0.5);
  }

  // 조가비가 기단 위에 드리운 그림자: 왼쪽 위에서 해가 드니 밑동 오른쪽으로 비스듬히
  g.save();
  g.filter = "blur(1.5px)";
  g.fillStyle = "rgba(70,50,35,0.35)";
  for (const sh of OPERA_SHELLS) {
    const [fx, fy] = OP(sh.front);
    const [ex, ey] = OP(sh.end);
    g.beginPath();
    g.ellipse((Math.min(fx, ex) + Math.max(fx, ex)) / 2 + 3, Math.max(fy, ey) + 1, Math.abs(ex - fx) / 2 + 2, 2.2, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // 조가비들
  for (const sh of OPERA_SHELLS) {
    const tip = OP(sh.tip);
    const c1 = OP(sh.c1);
    const c2 = OP(sh.c2);
    const end = OP(sh.end);
    const front = OP(sh.front);
    const inner = OP(sh.inner);
    // 앞 모서리는 끝에서 거의 곧게, 살짝 바깥으로 휘며 내려옴
    const frontCtl = [tip[0] + (front[0] - tip[0]) * 0.15, tip[1] + (front[1] - tip[1]) * 0.6];
    // 겉면과 입구의 경계: 끝에서 안쪽 밑동까지 살짝 오목한 곡선
    const innerCtl = [tip[0] + (inner[0] - tip[0]) * 0.45, tip[1] + (inner[1] - tip[1]) * 0.42];
    // 입구 바탕 (연한 안쪽 면)
    g.beginPath();
    g.moveTo(...tip);
    g.quadraticCurveTo(frontCtl[0], frontCtl[1], front[0], front[1]);
    g.lineTo(...inner);
    g.quadraticCurveTo(innerCtl[0], innerCtl[1], tip[0], tip[1]);
    g.closePath();
    g.fillStyle = "#d2bf9e";
    g.fill();
    g.strokeStyle = line;
    g.lineWidth = 0.5;
    g.stroke();
    // 끝 쪽 짙은 그늘 삼각형
    const mid = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    const fA = mid(tip, front, 0.55);
    const iA = mid(tip, inner, 0.5);
    g.beginPath();
    g.moveTo(...tip);
    g.lineTo(...fA);
    g.lineTo(...iA);
    g.closePath();
    g.fillStyle = "#6a5440";
    g.fill();
    // 아래쪽 연한 면을 가르는 갈비뼈 선
    g.strokeStyle = "rgba(130,105,78,0.6)";
    g.lineWidth = 0.4;
    g.beginPath();
    g.moveTo(...fA);
    g.lineTo(...mid(front, inner, 0.5));
    g.moveTo(...iA);
    g.lineTo(...mid(front, inner, 0.5));
    g.stroke();
    // 흰 겉면
    g.beginPath();
    g.moveTo(...tip);
    g.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], end[0], end[1]);
    g.lineTo(...inner);
    g.quadraticCurveTo(innerCtl[0], innerCtl[1], tip[0], tip[1]);
    g.closePath();
    // 둥근 겉면: 해를 받는 끝 쪽은 하얗게 빛나고, 등 곡선을 따라 내려갈수록 그늘
    const skin = g.createLinearGradient(tip[0], tip[1], end[0], end[1]);
    skin.addColorStop(0, "#ffffff");
    skin.addColorStop(0.4, "#f4ede0");
    skin.addColorStop(0.8, "#d9ccb2");
    skin.addColorStop(1, "#c2b294");
    g.fillStyle = skin;
    // 앞 조가비가 뒤 조가비 위에 드리우는 옅은 그림자: 겹친 면의 앞뒤가 갈림
    g.save();
    g.shadowColor = "rgba(70,55,40,0.4)";
    g.shadowBlur = 4;
    g.shadowOffsetX = 2;
    g.shadowOffsetY = 1;
    g.fill();
    g.restore();
    // 등 곡선 안쪽을 따라 도는 그늘 띠: 껍데기가 둥글게 넘어가는 면
    g.save();
    g.clip();
    g.strokeStyle = "rgba(150,128,96,0.35)";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(...tip);
    g.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], end[0], end[1]);
    g.stroke();
    // 겉면과 입구 경계 바로 옆은 빛을 받는 모서리
    g.strokeStyle = "rgba(255,255,255,0.8)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(...inner);
    g.quadraticCurveTo(innerCtl[0], innerCtl[1], tip[0], tip[1]);
    g.stroke();
    g.restore();
    // 겉면 안 옅은 면 나눔: 끝에서 밑동으로 퍼지는 가는 선 두 줄 (참고 그림의 면 경계)
    g.save();
    g.clip();
    g.strokeStyle = "rgba(190,175,150,0.55)";
    g.lineWidth = 0.4;
    for (const t of [0.35, 0.7]) {
      g.beginPath();
      g.moveTo(...tip);
      g.lineTo(...mid(inner, end, t));
      g.stroke();
    }
    g.restore();
    g.beginPath();
    g.moveTo(...tip);
    g.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], end[0], end[1]);
    g.lineTo(...inner);
    g.quadraticCurveTo(innerCtl[0], innerCtl[1], tip[0], tip[1]);
    g.closePath();
    g.strokeStyle = line;
    g.lineWidth = 0.6;
    g.stroke();
  }
}

// 껍데기 하나. 뾰족한 끝이 왼쪽 위로 튀어나오고, 등 곡선은 오른쪽으로 둥글게 내려옴.
// 끝에서 아래로 떨어지는 앞 모서리 안쪽이 어두운 입구(내부와 구릿빛 유리)
function shell(g, ax, ay, w, by) {
  const h = by - ay;
  const x0 = ax + w * 0.16; // 입구 밑동 왼쪽: 끝보다 오른쪽이라 끝이 앞으로 튀어나옴
  const innerX = ax + w * 0.38; // 흰 겉면과 입구가 만나는 밑동 (입구는 조가비의 3분의 1 남짓)
  const x1 = ax + w;
  // 등 곡선: 구의 한 조각이라 끝에서 거의 수평으로 나가다 둥글게 부풀어 밑동으로 떨어짐 (3차 곡선)
  const outerCtl = [x1 - w * 0.02, ay - h * 0.04];
  const back1 = [ax + w * 0.42, ay - h * 0.1];
  const back2 = [x1 + w * 0.04, ay + h * 0.3];
  const backTo = () => g.bezierCurveTo(back1[0], back1[1], back2[0], back2[1], x1, by);
  const innerCtl = [ax + w * 0.36, ay + h * 0.42]; // 흰 겉면 아래 경계: 살짝 오목하게 파인 곡선
  const edgeCtl = [ax + w * 0.06, ay + h * 0.62];

  // 입구: 꼭짓점에서 왼쪽 가장자리를 따라 내려왔다가 안쪽 곡선으로 올라감
  g.beginPath();
  g.moveTo(ax, ay);
  g.quadraticCurveTo(edgeCtl[0], edgeCtl[1], x0, by);
  g.lineTo(innerX, by);
  g.quadraticCurveTo(innerCtl[0], innerCtl[1], ax, ay);
  g.closePath();
  // 입구: 위는 조가비 안쪽 콘크리트 갈비뼈의 그늘, 아래로 내려올수록 하늘과 햇빛을 비추는 구릿빛 유리벽
  const mouth = g.createLinearGradient(0, ay, 0, by);
  mouth.addColorStop(0, "#4a3e3a");
  mouth.addColorStop(0.45, "#7a5638");
  mouth.addColorStop(0.8, "#b9824a");
  mouth.addColorStop(1, "#d8a46a");
  g.fillStyle = mouth;
  g.fill();
  g.save();
  g.clip();
  // 아래쪽 유리벽의 세로 살과 위쪽 콘크리트 갈비뼈
  g.strokeStyle = "rgba(70,45,30,0.45)";
  g.lineWidth = 0.4;
  for (let x = x0; x < innerX; x += 2.2) {
    g.beginPath();
    g.moveTo(x, by);
    g.lineTo(x + 1, by - h * 0.35);
    g.stroke();
  }
  g.strokeStyle = "rgba(200,190,180,0.12)";
  for (let k = 1; k < 5; k++) {
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(x0 + ((innerX - x0) * k) / 5, by);
    g.stroke();
  }
  g.restore();

  // 흰 겉면
  function surface() {
    g.beginPath();
    g.moveTo(ax, ay);
    backTo();
    g.lineTo(innerX, by);
    g.quadraticCurveTo(innerCtl[0], innerCtl[1], ax, ay);
    g.closePath();
  }
  const skin = g.createLinearGradient(innerX - w * 0.05, 0, x1, 0);
  skin.addColorStop(0, "#fffaf0");
  skin.addColorStop(0.45, "#f1eadb");
  skin.addColorStop(1, "#cfc7b6");
  g.fillStyle = skin;
  g.save();
  g.shadowColor = "rgba(60,70,90,0.35)";
  g.shadowBlur = 6;
  g.shadowOffsetX = 3;
  surface();
  g.fill();
  g.restore();
  // 조가비 윤곽: 가는 테두리로 면을 또렷하게
  surface();
  g.strokeStyle = "rgba(140,120,92,0.75)";
  g.lineWidth = 0.6;
  g.stroke();
  // 타일 결: 바깥 곡선과 나란히 흐르는 아주 옅은 줄
  g.save();
  surface();
  g.clip();
  for (let k = 1; k < 7; k++) {
    const t = k / 7;
    g.strokeStyle = `rgba(150,140,120,${0.06 + t * 0.08})`;
    g.lineWidth = 0.3 + t * 0.2;
    g.beginPath();
    g.moveTo(ax, ay);
    g.quadraticCurveTo(
      outerCtl[0] + (innerCtl[0] - outerCtl[0]) * t,
      outerCtl[1] + (innerCtl[1] - outerCtl[1]) * t,
      x1 + (innerX - x1) * t,
      by,
    );
    g.stroke();
  }
  g.restore();
  // V자 타일 결: 등 곡선 쪽으로 열린 아주 옅은 갈매기 무늬 (실제 지붕의 타일 판)
  g.save();
  surface();
  g.clip();
  g.strokeStyle = "rgba(170,160,140,0.16)";
  g.lineWidth = 0.35;
  for (let k = 0; k < 9; k++) {
    const t = (k + 0.5) / 9;
    const px = ax + (x1 - ax) * t;
    const py = ay + (by - ay) * t * 0.9;
    g.beginPath();
    g.moveTo(px - 3, py - 3);
    g.lineTo(px, py);
    g.lineTo(px + 3.2, py - 2.4);
    g.stroke();
  }
  g.restore();
  // 입구 가장자리: 껍데기 두께가 햇빛을 받아 반짝임 (위는 가늘고 아래로 굵게)
  for (let k = 0; k < 6; k++) {
    const p = (t) => {
      const u = 1 - t;
      return [u * u * ax + 2 * u * t * innerCtl[0] + t * t * innerX, u * u * ay + 2 * u * t * innerCtl[1] + t * t * by];
    };
    const [px0, py0] = p(k / 6);
    const [px1, py1] = p((k + 1) / 6);
    g.strokeStyle = "#fffdf6";
    g.lineWidth = 0.5 + (k / 6) * 1.1;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(px0, py0);
    g.lineTo(px1, py1);
    g.stroke();
  }
  // 바깥 곡선의 가는 그늘
  g.strokeStyle = "rgba(90,95,110,0.35)";
  g.lineWidth = 0.6;
  g.beginPath();
  g.moveTo(ax, ay);
  backTo();
  g.stroke();
}

// 시드니 페리: 초록 선체에 크림색 선실, 노란 굴뚝
function paintFerry(g, x, y, s) {
  // 뒤로 퍼지는 물살: V자 흰 거품과 배 밑 그림자
  g.fillStyle = "rgba(10,40,80,0.35)";
  g.beginPath();
  g.ellipse(x + 1 * s, y + 4.8 * s, 18 * s, 1.6 * s, 0, 0, Math.PI * 2);
  g.fill();
  for (const [dy, a] of [[0, 0.75], [2.2, 0.45]]) {
    g.strokeStyle = `rgba(255,255,255,${a})`;
    g.lineWidth = 0.9 - dy * 0.15;
    g.beginPath();
    g.moveTo(x - 14 * s, y + (3.5 + dy) * s);
    g.quadraticCurveTo(x - 28 * s, y + (2.5 + dy * 1.6) * s, x - 44 * s, y + (5 + dy * 2.4) * s);
    g.stroke();
  }
  g.fillStyle = "rgba(255,255,255,0.8)";
  g.beginPath();
  g.ellipse(x + 17 * s, y + 3.6 * s, 3 * s, 0.8 * s, 0, 0, Math.PI * 2);
  g.fill();

  // 초록 선체: 위는 밝고 아래는 어두움, 흰 흘수선과 노란 띠
  const hull = g.createLinearGradient(0, y, 0, y + 4 * s);
  hull.addColorStop(0, "#2a8a4c");
  hull.addColorStop(1, "#14502c");
  g.fillStyle = hull;
  g.beginPath();
  g.moveTo(x - 16 * s, y);
  g.lineTo(x + 18 * s, y);
  g.lineTo(x + 14.5 * s, y + 4 * s);
  g.lineTo(x - 13 * s, y + 4 * s);
  g.closePath();
  g.fill();
  g.fillStyle = "#e9c23a";
  g.fillRect(x - 15.5 * s, y + 0.2 * s, 33 * s, 0.6 * s);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.fillRect(x - 13 * s, y + 3.6 * s, 27.5 * s, 0.4 * s);

  // 크림색 2층 선실: 아래층은 넓고 위층은 짧음. 창 띠는 어두운 유리
  const deck = (dx, dy, w, h) => {
    const cabin = g.createLinearGradient(0, y + dy, 0, y + dy + h);
    cabin.addColorStop(0, "#fffaf0");
    cabin.addColorStop(1, "#e2d7bd");
    g.fillStyle = cabin;
    g.fillRect(x + dx, y + dy, w, h);
    g.fillStyle = "#2e3e4e";
    g.fillRect(x + dx + 0.8 * s, y + dy + h * 0.25, w - 1.6 * s, h * 0.42);
    g.fillStyle = "rgba(255,255,255,0.35)";
    for (let wx = x + dx + 1.6 * s; wx < x + dx + w - 1.6 * s; wx += 2.6 * s) g.fillRect(wx, y + dy + h * 0.25, 0.4 * s, h * 0.42);
    g.fillStyle = "rgba(90,80,60,0.35)";
    g.fillRect(x + dx, y + dy + h - 0.5, w, 0.5);
  };
  deck(-12 * s, -5.5 * s, 25 * s, 5.5 * s);
  deck(-7 * s, -9.5 * s, 14 * s, 4 * s);
  // 조타실과 노란 굴뚝
  g.fillStyle = "#fffaf0";
  g.fillRect(x + 7 * s, -11.5 * s + y, 4 * s, 2.2 * s);
  g.fillStyle = "#2e3e4e";
  g.fillRect(x + 7.5 * s, -11 * s + y, 3 * s, 1 * s);
  const funnel = g.createLinearGradient(x - 1 * s, 0, x + 2 * s, 0);
  funnel.addColorStop(0, "#f5d65a");
  funnel.addColorStop(1, "#c99a1e");
  g.fillStyle = funnel;
  g.fillRect(x - 1 * s, y - 13 * s, 3 * s, 3.6 * s);
  g.fillStyle = "#2a2a2a";
  g.fillRect(x - 1 * s, y - 13 * s, 3 * s, 0.6 * s);
  // 난간
  g.fillStyle = "rgba(255,255,255,0.8)";
  g.fillRect(x - 12 * s, y - 6 * s, 25 * s, 0.4 * s);
}

// 물방울: 가장자리가 밝고 속이 비치는 방울. 색마다 한 번만 그려 둠
// 진주 같은 기포: 투명한 몸통, 가장자리에 무지갯빛 테(분홍·민트·하늘), 왼쪽 위 또렷한 반사점
const sprites = new Map();
function pearlSprite(color) {
  if (!sprites.has(color)) {
    const c = document.createElement("canvas");
    c.width = c.height = 48;
    const g = c.getContext("2d");
    const body = g.createRadialGradient(20, 18, 2, 24, 24, 23);
    body.addColorStop(0, "rgba(255,255,255,0.55)");
    body.addColorStop(0.55, "rgba(255,255,255,0.08)");
    body.addColorStop(0.82, color);
    body.addColorStop(1, "rgba(255,255,255,0.95)");
    g.fillStyle = body;
    g.beginPath();
    g.arc(24, 24, 23, 0, Math.PI * 2);
    g.fill();
    // 무지갯빛 테
    const rim = g.createLinearGradient(0, 0, 48, 48);
    rim.addColorStop(0, "rgba(255,190,230,0.75)");
    rim.addColorStop(0.5, "rgba(180,255,235,0.6)");
    rim.addColorStop(1, "rgba(170,200,255,0.75)");
    g.strokeStyle = rim;
    g.lineWidth = 2.4;
    g.beginPath();
    g.arc(24, 24, 21.5, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "rgba(255,255,255,0.95)";
    g.beginPath();
    g.ellipse(16, 14, 6, 3.4, -0.6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.6)";
    g.beginPath();
    g.arc(32, 33, 2, 0, Math.PI * 2);
    g.fill();
    sprites.set(color, c);
  }
  return sprites.get(color);
}

function drawDrop(ctx, p, t) {
  // 물속에서 살짝 찰랑이며 크기가 숨 쉬듯 변함
  const wob = 1 + 0.06 * Math.sin((t || 0) * 0.01 + p.swayPhase * 3);
  ctx.globalAlpha = p.settled ? 0.6 : 0.95;
  const r = p.size * wob;
  ctx.drawImage(pearlSprite(p.color), p.x - r, p.y - r * (2 - wob), r * 2, r * 2);
}

// 바닥 수면에서 끊임없이 피어오르는 진주 기포: 흔들리며 올라가다 커지고, 수면 위쪽에서 터지듯 사라짐
let rising = [];
function drawRisingBubbles(ctx, t, globe) {
  if (!rising.length) {
    const rnd = seeded(31);
    rising = Array.from({ length: 34 }, () => ({
      x: globe.x + (rnd() * 2 - 1) * (globe.r - 40),
      speed: 0.012 + rnd() * 0.02,
      phase: rnd() * 1000,
      size: 1.6 + rnd() * 3.2,
      wobble: 2 + rnd() * 4,
      color: DROP_COLORS[Math.floor(rnd() * DROP_COLORS.length)],
    }));
  }
  const bottom = globe.y + globe.r * 0.82;
  const range = globe.r * 1.25;
  ctx.save();
  for (const b of rising) {
    const k = ((t * b.speed + b.phase) % range) / range; // 0 바닥 → 1 위
    const y = bottom - k * range;
    const x = b.x + Math.sin(t * 0.003 + b.phase) * b.wobble * (0.4 + k);
    const r = b.size * (0.6 + k * 0.7);
    ctx.globalAlpha = Math.min(1, k * 6) * (1 - Math.max(0, (k - 0.85) / 0.15));
    ctx.drawImage(pearlSprite(b.color), x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

// 바다 위 반짝임: 물결 위 몇 곳이 번갈아 빛남
let glints = [];
function animateSydney(ctx, t, globe) {
  drawRisingBubbles(ctx, t, globe);
  if (!glints.length) {
    const rnd = seeded(7);
    glints = Array.from({ length: 24 }, () => ({
      x: 210 + rnd() * 150,
      y: 289 + rnd() * 12,
      phase: rnd() * Math.PI * 2,
      speed: 0.002 + rnd() * 0.004,
    }));
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "#fffbe8";
  for (const s of glints) {
    ctx.globalAlpha = Math.max(0, Math.sin(t * s.speed + s.phase)) * 0.8;
    ctx.fillRect(s.x - 2, s.y, 4, 0.9);
  }
  ctx.restore();
}

export const sydney = {
  id: "australia",
  label: "호주 · 시드니 오페라하우스",
  title: "Sydney Opera House",
  paint: paintSydney,
  animate: animateSydney,
  glare: 0.8,
  base: {
    trim: ["#8a9aa8", "#ffffff", "#c9d4dd", "#7d8c99"],
    plate: "Sydney Opera House",
    plateFont: "600 14px 'Helvetica Neue', Arial, sans-serif",
    plateInk: "#0b2a44",
  },
  // 물방울은 작고 가벼워서 오래 떠다님
  particles: {
    count: 170,
    blend: "source-over",
    make(rand) {
      const size = rand(1.8, 4.2);
      return {
        size,
        color: DROP_COLORS[Math.floor(rand(0, DROP_COLORS.length))],
        sink: 0.08 + size * 0.03 + rand(-0.02, 0.02),
        drag: rand(0.09, 0.14),
        inertia: rand(0.35, 0.65),
        grip: rand(0.4, 1.6),
        flutter: 0,
      };
    },
    draw: drawDrop,
  },
};
