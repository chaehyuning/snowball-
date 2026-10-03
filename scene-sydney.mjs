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

  // 바다
  const sea = g.createLinearGradient(0, 244, 0, 330);
  sea.addColorStop(0, "#3a93d0");
  sea.addColorStop(1, "#0b4f8c");
  g.fillStyle = sea;
  g.fillRect(left, 244, size, 100);

  // 물결: 멀리는 가늘고 촘촘하게, 가까이는 굵고 성기게
  for (let i = 0; i < 140; i++) {
    const y = r(246, 330);
    const near = (y - 246) / 84;
    const x = r(left, right);
    const w = 3 + near * r(6, 16);
    g.strokeStyle = rnd() < 0.6 ? `rgba(190,232,255,${0.25 + near * 0.3})` : `rgba(8,52,100,${0.25 + near * 0.2})`;
    g.lineWidth = 0.5 + near;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + w / 2, y - 1 - near * 2, x + w, y);
    g.stroke();
  }

  // 바다 깊이: 기슭 가까운 얕은 곳은 청록, 가운데 깊은 곳은 짙은 남색 얼룩
  const rw = seeded(2000);
  g.save();
  g.filter = "blur(8px)";
  for (let i = 0; i < 10; i++) {
    const wx = left + rw() * size;
    const wy = 250 + rw() * 70;
    g.fillStyle = i % 2 ? "rgba(40,170,190,0.18)" : "rgba(5,40,90,0.22)";
    g.beginPath();
    g.ellipse(wx, wy, 30 + rw() * 40, 4 + rw() * 5, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  // 다리와 빌딩이 물에 비친 흐린 세로 그림자: 물결에 끊김
  g.fillStyle = "rgba(30,60,95,0.18)";
  for (let y = 245; y < 262; y += 1.5) {
    for (let x = 60; x < 320; x += 3 + rw() * 5) {
      if (rw() < 0.5) g.fillRect(x, y, 1 + rw() * 3, 0.7);
    }
  }
  // 바람이 스친 물결 띠: 가로로 길게 옅게 밝은 결
  g.strokeStyle = "rgba(200,235,255,0.18)";
  g.lineWidth = 0.6;
  for (let i = 0; i < 6; i++) {
    const y = 250 + i * 8 + rw() * 4;
    g.beginPath();
    g.moveTo(left, y);
    for (let x = left; x <= right; x += 10) g.lineTo(x, y + Math.sin(x * 0.04 + i) * 1.2);
    g.stroke();
  }

  // 햇빛 반사
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 60; i++) {
    const y = r(246, 300);
    g.fillStyle = `rgba(255,255,230,${r(0.15, 0.45)})`;
    g.fillRect(300 + r(-25, 25) * (1 + (y - 246) / 40), y, r(2, 7), 0.8);
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

// 오페라하우스: 분홍 화강암 기단과 대계단, 구릿빛 유리벽,
// 흰색·크림색 타일 껍데기 두 무리(콘서트홀·오페라 극장)와 작은 레스토랑 껍데기
function paintOperaHouse(g) {
  const rnd = seeded(1973);
  const r = (a, b) => a + rnd() * (b - a);
  // 기단: 분홍 화강암 블록. 줄을 긋지 않고 단마다 밝기를 조금씩 달리 칠하고,
  // 블록 이음매는 짧게 끊긴 그늘로만 보임. 물가로 내려갈수록 어두움
  function podiumShape() {
    g.beginPath();
    g.moveTo(160, 286);
    g.lineTo(170, 263);
    g.lineTo(352, 263);
    g.lineTo(358, 286);
    g.closePath();
  }
  const podium = g.createLinearGradient(0, 262, 0, 286);
  podium.addColorStop(0, "#e8cab4");
  podium.addColorStop(0.6, "#c9a38c");
  podium.addColorStop(1, "#9c7764");
  g.fillStyle = podium;
  podiumShape();
  g.fill();
  g.save();
  podiumShape();
  g.clip();
  for (let y = 265; y < 286; y += 3.2) {
    let x = 160;
    while (x < 358) {
      const w = r(8, 18);
      g.fillStyle = rnd() < 0.5 ? "rgba(255,236,220,0.12)" : "rgba(120,80,62,0.1)";
      g.fillRect(x, y, w, 3.2);
      if (rnd() < 0.6) {
        g.fillStyle = "rgba(100,66,52,0.12)";
        g.fillRect(x + w - 0.4, y + 0.4, 0.5, 2.6);
      }
      x += w;
    }
    g.fillStyle = `rgba(100,66,52,${r(0.1, 0.2)})`;
    g.fillRect(160, y + 3, 200, 0.5);
  }
  // 윗면 테두리에 받은 햇빛, 물에 닿는 아래쪽 젖은 그늘
  g.fillStyle = "rgba(255,244,230,0.6)";
  g.fillRect(160, 263, 200, 1);
  const wet = g.createLinearGradient(0, 281, 0, 286);
  wet.addColorStop(0, "rgba(60,50,60,0)");
  wet.addColorStop(1, "rgba(60,50,60,0.35)");
  g.fillStyle = wet;
  g.fillRect(160, 281, 200, 5);
  g.restore();

  // 대계단: 디딤판은 밝고 챌판은 그늘. 계단 폭이 아래로 갈수록 넓어짐
  const steps = 12;
  for (let k = 0; k < steps; k++) {
    const y0 = 263 + (k * 23) / steps;
    const y1 = 263 + ((k + 1) * 23) / steps;
    const l0 = 170 - (k * 10) / steps;
    const r0 = 206 - (k * 6) / steps;
    const l1 = 170 - ((k + 1) * 10) / steps;
    const r1 = 206 - ((k + 1) * 6) / steps;
    const mid = y0 + (y1 - y0) * 0.45;
    g.fillStyle = "#f1dccb";
    g.beginPath();
    g.moveTo(l0, y0);
    g.lineTo(r0, y0);
    g.lineTo(r0 - 0.3, mid);
    g.lineTo(l0 - 0.4, mid);
    g.closePath();
    g.fill();
    g.fillStyle = "#c9a690";
    g.beginPath();
    g.moveTo(l0 - 0.4, mid);
    g.lineTo(r0 - 0.3, mid);
    g.lineTo(r1, y1);
    g.lineTo(l1, y1);
    g.closePath();
    g.fill();
  }
  // 계단 오른쪽 옆면 그늘
  g.fillStyle = "rgba(90,60,50,0.25)";
  g.beginPath();
  g.moveTo(206, 263);
  g.lineTo(209, 263);
  g.lineTo(203, 286);
  g.lineTo(200, 286);
  g.closePath();
  g.fill();

  // 물에 비친 기단과 껍데기: 물결에 끊긴 흰 가로 획
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let y = 288; y < 306; y += 1.6) {
    const fade = 1 - (y - 288) / 18;
    let x = 176;
    while (x < 350) {
      const w = r(3, 12);
      if (rnd() < 0.55) {
        g.fillStyle = `rgba(230,230,220,${0.16 * fade})`;
        g.fillRect(x + r(-1.5, 1.5), y, w, 0.8);
      }
      x += w + r(1, 5);
    }
  }
  g.restore();

  // 껍데기를 받치는 윗단: 베이지 콘크리트 띠와 어두운 창 띠
  const tier = g.createLinearGradient(0, 254, 0, 263);
  tier.addColorStop(0, "#efdcc4");
  tier.addColorStop(1, "#cdb193");
  g.fillStyle = tier;
  g.fillRect(208, 254, 144, 9);
  g.fillStyle = "#3a2e2a";
  g.fillRect(208, 258.5, 144, 2.2);
  g.fillStyle = "rgba(255,230,190,0.35)";
  for (let x = 210; x < 350; x += 3.5) g.fillRect(x, 258.7, 0.5, 1.8);
  g.fillStyle = "rgba(255,248,235,0.6)";
  g.fillRect(208, 254, 144, 0.8);

  // 껍데기: 꼭짓점이 왼쪽 위에 있고, 바깥 곡선이 오른쪽 아래로 크게 휘어 내려옴.
  // 왼쪽으로 열린 입구 안은 어두운 내부와 구릿빛 유리. 뒤(오른쪽)부터 그려서 앞 껍데기가 겹침
  // [꼭짓점 x, 꼭짓점 y, 밑변 폭, 밑변 y]. 꼭짓점이 밑동보다 왼쪽으로 튀어나와 앞으로 기운 모양
  // 맨 오른쪽 껍데기는 뒤로 맞붙어 반대쪽(오른쪽)을 보고 있어 좌우를 뒤집어 그림
  const shells = [
    [346, 210, 56, 256, true],
    [262, 186, 56, 256, false],
    [233, 204, 48, 256, false],
    [210, 226, 38, 256, false],
    [176, 242, 26, 263, false],
  ];
  for (const [ax, ay, w, by, flip] of shells) {
    g.save();
    if (flip) {
      g.translate(ax * 2, 0);
      g.scale(-1, 1);
    }
    shell(g, ax, ay, w, by);
    g.restore();
  }
}

// 껍데기 하나. 뾰족한 끝이 왼쪽 위로 튀어나오고, 등 곡선은 오른쪽으로 둥글게 내려옴.
// 끝에서 아래로 떨어지는 앞 모서리 안쪽이 어두운 입구(내부와 구릿빛 유리)
function shell(g, ax, ay, w, by) {
  const h = by - ay;
  const x0 = ax + w * 0.16; // 입구 밑동 왼쪽: 끝보다 오른쪽이라 끝이 앞으로 튀어나옴
  const innerX = ax + w * 0.5; // 흰 겉면과 입구가 만나는 밑동
  const x1 = ax + w;
  // 등 곡선: 구의 한 조각이라 끝에서 거의 수평으로 나가다 둥글게 부풀어 밑동으로 떨어짐 (3차 곡선)
  const outerCtl = [x1 - w * 0.02, ay - h * 0.04];
  const back1 = [ax + w * 0.42, ay - h * 0.1];
  const back2 = [x1 + w * 0.04, ay + h * 0.3];
  const backTo = () => g.bezierCurveTo(back1[0], back1[1], back2[0], back2[1], x1, by);
  const innerCtl = [ax + w * 0.5, ay + h * 0.3]; // 흰 겉면 아래 경계는 오른쪽 위로 오목하게 파여 입구가 크게 보임
  const edgeCtl = [ax + w * 0.06, ay + h * 0.62];

  // 입구: 꼭짓점에서 왼쪽 가장자리를 따라 내려왔다가 안쪽 곡선으로 올라감
  g.beginPath();
  g.moveTo(ax, ay);
  g.quadraticCurveTo(edgeCtl[0], edgeCtl[1], x0, by);
  g.lineTo(innerX, by);
  g.quadraticCurveTo(innerCtl[0], innerCtl[1], ax, ay);
  g.closePath();
  const mouth = g.createLinearGradient(0, ay, 0, by);
  mouth.addColorStop(0, "#2c2a32");
  mouth.addColorStop(0.55, "#3e3434");
  mouth.addColorStop(1, "#7a5a3e");
  g.fillStyle = mouth;
  g.fill();
  g.save();
  g.clip();
  // 아래쪽 유리벽의 세로 살과 위쪽 콘크리트 갈비뼈
  g.strokeStyle = "rgba(230,190,140,0.3)";
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
  label: "호주 · 오페라하우스",
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
