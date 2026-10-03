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
