// 스노우볼 배송 시뮬레이션 (PC 전용): 스노우볼 도시에서 출발해, 보내는 사람이 적은 받는 나라까지 항공 물류 경로를 만들고
// 운송장(번호·경로·거리·리드타임)과 항로 지도를 그림.
// 실제 항공사 운항표가 아니라 "가까운 공항 → 관문 허브 → 관문 허브 → 가까운 공항" 규칙과
// 대권 거리로 계산한 시뮬레이션. 육지 윤곽은 지구본과 같은 land.json(Natural Earth 1:110m)

// 공항: IATA 코드, 이름, 위도·경도
export const AIRPORTS = {
  HND: { name: "Tokyo Haneda", lat: 35.549, lon: 139.78 },
  ICN: { name: "Seoul Incheon", lat: 37.46, lon: 126.441 },
  YQB: { name: "Québec City", lat: 46.791, lon: -71.393 },
  YUL: { name: "Montréal", lat: 45.471, lon: -73.741 },
  SYD: { name: "Sydney", lat: -33.94, lon: 151.175 },
  RVN: { name: "Rovaniemi", lat: 66.565, lon: 25.83 },
  HEL: { name: "Helsinki", lat: 60.317, lon: 24.963 },
  PEK: { name: "Beijing Capital", lat: 40.08, lon: 116.603 },
  CAI: { name: "Cairo", lat: 30.122, lon: 31.406 },
  CDG: { name: "Paris Charles de Gaulle", lat: 49.01, lon: 2.548 },
  IST: { name: "Istanbul", lat: 41.275, lon: 28.752 },
  BCN: { name: "Barcelona", lat: 41.297, lon: 2.083 },
  MAD: { name: "Madrid", lat: 40.498, lon: -3.568 },
  UYU: { name: "Uyuni", lat: -20.446, lon: -66.848 },
  LPB: { name: "La Paz", lat: -16.513, lon: -68.192 },
  TPE: { name: "Taipei Taoyuan", lat: 25.08, lon: 121.234 },
};

// 스노우볼 도시: 랜드마크 좌표, 나라, 가까운 공항, 국제선 관문 허브
export const CITIES = {
  japan: {
    city: "Fujiyoshida",
    country: "JP",
    lat: 35.487,
    lon: 138.808,
    local: "HND",
    gateway: "HND",
  },
  korea: {
    city: "Seoul",
    country: "KR",
    lat: 37.551,
    lon: 126.988,
    local: "ICN",
    gateway: "ICN",
  },
  canada: {
    city: "Québec City",
    country: "CA",
    lat: 46.812,
    lon: -71.205,
    local: "YQB",
    gateway: "YUL",
  },
  australia: {
    city: "Sydney",
    country: "AU",
    lat: -33.857,
    lon: 151.215,
    local: "SYD",
    gateway: "SYD",
  },
  finland: {
    city: "Rovaniemi",
    country: "FI",
    lat: 66.543,
    lon: 25.847,
    local: "RVN",
    gateway: "HEL",
  },
  china: {
    city: "Beijing",
    country: "CN",
    lat: 39.916,
    lon: 116.397,
    local: "PEK",
    gateway: "PEK",
  },
  egypt: {
    city: "Giza",
    country: "EG",
    lat: 29.979,
    lon: 31.134,
    local: "CAI",
    gateway: "CAI",
  },
  france: {
    city: "Paris",
    country: "FR",
    lat: 48.858,
    lon: 2.294,
    local: "CDG",
    gateway: "CDG",
  },
  turkey: {
    city: "Istanbul",
    country: "TR",
    lat: 41.005,
    lon: 28.977,
    local: "IST",
    gateway: "IST",
  },
  spain: {
    city: "Barcelona",
    country: "ES",
    lat: 41.404,
    lon: 2.174,
    local: "BCN",
    gateway: "MAD",
  },
  bolivia: {
    city: "Uyuni",
    country: "BO",
    lat: -20.46,
    lon: -66.825,
    local: "UYU",
    gateway: "LPB",
  },
  taiwan: {
    city: "Taipei",
    country: "TW",
    lat: 25.042,
    lon: 121.508,
    local: "TPE",
    gateway: "TPE",
  },
};

// 받는 나라: 보내는 사람이 적는 나라. 나라마다 국제선 관문 공항 하나와 배송 도착 도시 하나
// [코드, 나라, 도착 도시, 도시 위도, 도시 경도, IATA, 공항 이름, 공항 위도, 공항 경도]
const DEST_ROWS = [
  ["KR", "South Korea", "Seoul", 37.5665, 126.978, "ICN", "Seoul Incheon", 37.46, 126.441],
  ["JP", "Japan", "Tokyo", 35.6762, 139.6503, "HND", "Tokyo Haneda", 35.549, 139.78],
  ["CN", "China", "Beijing", 39.9042, 116.4074, "PEK", "Beijing Capital", 40.08, 116.603],
  ["TW", "Taiwan", "Taipei", 25.033, 121.5654, "TPE", "Taipei Taoyuan", 25.08, 121.234],
  ["HK", "Hong Kong", "Hong Kong", 22.3193, 114.1694, "HKG", "Hong Kong", 22.308, 113.918],
  ["SG", "Singapore", "Singapore", 1.2903, 103.852, "SIN", "Singapore Changi", 1.364, 103.991],
  ["TH", "Thailand", "Bangkok", 13.7563, 100.5018, "BKK", "Bangkok Suvarnabhumi", 13.69, 100.75],
  ["VN", "Vietnam", "Hanoi", 21.0285, 105.8542, "HAN", "Hanoi Noi Bai", 21.221, 105.807],
  ["PH", "Philippines", "Manila", 14.5995, 120.9842, "MNL", "Manila", 14.508, 121.02],
  ["ID", "Indonesia", "Jakarta", -6.2088, 106.8456, "CGK", "Jakarta Soekarno-Hatta", -6.126, 106.656],
  ["MY", "Malaysia", "Kuala Lumpur", 3.139, 101.6869, "KUL", "Kuala Lumpur", 2.746, 101.71],
  ["IN", "India", "New Delhi", 28.6139, 77.209, "DEL", "Delhi", 28.556, 77.1],
  ["AE", "United Arab Emirates", "Dubai", 25.2048, 55.2708, "DXB", "Dubai", 25.253, 55.365],
  ["TR", "Türkiye", "Istanbul", 41.0082, 28.9784, "IST", "Istanbul", 41.275, 28.752],
  ["EG", "Egypt", "Cairo", 30.0444, 31.2357, "CAI", "Cairo", 30.122, 31.406],
  ["ZA", "South Africa", "Johannesburg", -26.2041, 28.0473, "JNB", "Johannesburg", -26.139, 28.246],
  ["KE", "Kenya", "Nairobi", -1.2921, 36.8219, "NBO", "Nairobi", -1.319, 36.928],
  ["GB", "United Kingdom", "London", 51.5074, -0.1278, "LHR", "London Heathrow", 51.47, -0.454],
  ["FR", "France", "Paris", 48.8566, 2.3522, "CDG", "Paris Charles de Gaulle", 49.01, 2.548],
  ["DE", "Germany", "Berlin", 52.52, 13.405, "BER", "Berlin Brandenburg", 52.366, 13.503],
  ["NL", "Netherlands", "Amsterdam", 52.3676, 4.9041, "AMS", "Amsterdam Schiphol", 52.31, 4.768],
  ["ES", "Spain", "Madrid", 40.4168, -3.7038, "MAD", "Madrid", 40.498, -3.568],
  ["IT", "Italy", "Rome", 41.9028, 12.4964, "FCO", "Rome Fiumicino", 41.8, 12.239],
  ["CH", "Switzerland", "Zurich", 47.3769, 8.5417, "ZRH", "Zurich", 47.458, 8.555],
  ["FI", "Finland", "Helsinki", 60.1699, 24.9384, "HEL", "Helsinki", 60.317, 24.963],
  ["SE", "Sweden", "Stockholm", 59.3293, 18.0686, "ARN", "Stockholm Arlanda", 59.652, 17.919],
  ["NO", "Norway", "Oslo", 59.9139, 10.7522, "OSL", "Oslo", 60.194, 11.1],
  ["DK", "Denmark", "Copenhagen", 55.6761, 12.5683, "CPH", "Copenhagen", 55.618, 12.656],
  ["PL", "Poland", "Warsaw", 52.2297, 21.0122, "WAW", "Warsaw Chopin", 52.166, 20.967],
  ["US", "United States", "New York", 40.7128, -74.006, "JFK", "New York JFK", 40.641, -73.778],
  ["CA", "Canada", "Toronto", 43.6532, -79.3832, "YYZ", "Toronto Pearson", 43.677, -79.624],
  ["MX", "Mexico", "Mexico City", 19.4326, -99.1332, "MEX", "Mexico City", 19.436, -99.072],
  ["BR", "Brazil", "São Paulo", -23.5505, -46.6333, "GRU", "São Paulo Guarulhos", -23.435, -46.473],
  ["AR", "Argentina", "Buenos Aires", -34.6037, -58.3816, "EZE", "Buenos Aires Ezeiza", -34.822, -58.536],
  ["CL", "Chile", "Santiago", -33.4489, -70.6693, "SCL", "Santiago", -33.393, -70.786],
  ["PE", "Peru", "Lima", -12.0464, -77.0428, "LIM", "Lima", -12.022, -77.114],
  ["BO", "Bolivia", "La Paz", -16.4897, -68.1193, "LPB", "La Paz", -16.513, -68.192],
  ["AU", "Australia", "Sydney", -33.8688, 151.2093, "SYD", "Sydney", -33.94, 151.175],
  ["NZ", "New Zealand", "Auckland", -36.8485, 174.7633, "AKL", "Auckland", -37.008, 174.785],
];
export const DESTINATIONS = Object.fromEntries(
  DEST_ROWS.map(([code, country, city, lat, lon, iata, airport, alat, alon]) => {
    AIRPORTS[iata] ||= { name: airport, lat: alat, lon: alon };
    return [code, { country, city, lat, lon, hub: iata }];
  }),
);

// 흔히 쓰는 다른 이름 (영어 약칭, 한국어 나라 이름)
const ALIASES = {
  usa: "US", america: "US", uk: "GB", england: "GB", britain: "GB", uae: "AE", turkey: "TR", holland: "NL", korea: "KR",
  한국: "KR", 대한민국: "KR", 미국: "US", 일본: "JP", 중국: "CN", 대만: "TW", 홍콩: "HK", 싱가포르: "SG", 태국: "TH",
  베트남: "VN", 필리핀: "PH", 인도네시아: "ID", 말레이시아: "MY", 인도: "IN", 아랍에미리트: "AE", 튀르키예: "TR", 터키: "TR",
  이집트: "EG", 남아공: "ZA", 남아프리카공화국: "ZA", 케냐: "KE", 영국: "GB", 프랑스: "FR", 독일: "DE", 네덜란드: "NL",
  스페인: "ES", 이탈리아: "IT", 스위스: "CH", 핀란드: "FI", 스웨덴: "SE", 노르웨이: "NO", 덴마크: "DK", 폴란드: "PL",
  캐나다: "CA", 멕시코: "MX", 브라질: "BR", 아르헨티나: "AR", 칠레: "CL", 페루: "PE", 볼리비아: "BO", 호주: "AU", 뉴질랜드: "NZ",
};

// 적은 글자로 나라 찾기: 코드(KR), 이름(South Korea), 다른 이름(USA, 미국), 이름 일부(zealand), 도시(Tokyo)
export function findDestination(text) {
  const q = String(text || "").trim().toLowerCase();
  if (!q) return "";
  if (ALIASES[q]) return ALIASES[q];
  for (const [code, d] of Object.entries(DESTINATIONS)) if (code.toLowerCase() === q || d.country.toLowerCase() === q) return code;
  const hit = Object.entries(DESTINATIONS).find(([, d]) => d.country.toLowerCase().includes(q) || d.city.toLowerCase() === q);
  return hit ? hit[0] : "";
}

// 시뮬레이션 상수
const CRUISE_KMH = 850; // 평균 순항 속도
const TAXI_H = 0.5; // 이착륙·지상 이동
const ROAD_KMH = 50; // 첫·마지막 구간 육로
const HUB_HANDLING_H = 3; // 큰 허브 환적 처리
const LOCAL_HANDLING_H = 1.5; // 작은 공항 처리
const CUSTOMS_H = 2; // 국경을 넘으면 도착국 통관

export const isDesktop = () =>
  typeof matchMedia === "function" &&
  matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)")
    .matches;

const RAD = Math.PI / 180;
// 대권 거리 (km)
export function greatCircleKm(a, b) {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// 경로 계산: 랜드마크 → 가까운 공항 → 관문 허브 → 받는 나라 관문 공항 → 받는 도시
// 같은 나라 안이면 국내선(관문 허브를 거치지 않음), 같은 공항이면 육로만
export function planRoute(fromId, destCode) {
  const A = CITIES[fromId];
  const D = DESTINATIONS[destCode];
  if (!A || !D) return null;
  const customs = A.country !== destCode;
  const chain = customs ? [A.local, A.gateway, D.hub] : [A.local, D.hub];
  const codes = chain.filter((c, i, all) => i === 0 || c !== all[i - 1]);
  if (!customs && codes.length === 1) codes.length = 0;
  const stops = [
    { kind: "origin", code: A.city, name: A.city, lat: A.lat, lon: A.lon },
    ...codes.map((code) => ({ kind: "airport", code, ...AIRPORTS[code] })),
    { kind: "destination", code: D.city, name: D.city, lat: D.lat, lon: D.lon },
  ];
  const legs = [];
  let hours = 0;
  stops[0].at = stops[0].out = 0;
  // 공항을 거치지 않는 같은 도시 배송은 집하 처리 시간만
  if (!codes.length) stops[0].out = hours = LOCAL_HANDLING_H;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const km = greatCircleKm(a, b);
    const ground = a.kind !== "airport" || b.kind !== "airport";
    const h = ground ? km / ROAD_KMH : km / CRUISE_KMH + TAXI_H;
    legs.push({ from: a, to: b, km, hours: h, mode: ground ? "road" : "air" });
    hours += h;
    b.at = hours;
    // 공항에서의 처리 시간 (받는 나라 관문 공항에서는 통관 시간도 더함). at: 도착, out: 출발
    if (b.kind === "airport") {
      const hub = customs && (b.code === A.gateway || b.code === D.hub);
      hours += hub ? HUB_HANDLING_H : LOCAL_HANDLING_H;
      if (customs && b.code === D.hub) hours += CUSTOMS_H;
    }
    b.out = hours;
  }
  const km = legs.reduce((s, l) => s + l.km, 0);
  return { from: fromId, to: destCode, hub: D.hub, stops, legs, km, hours, customs };
}

// 운송장 번호: 출발·도착 공항과 편지 내용에서 만든 고정 번호 (같은 편지는 늘 같은 번호)
export function trackingId(route, seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const num = String((h >>> 0) % 1000000).padStart(6, "0");
  const a = CITIES[route.from].local;
  const b = route.hub;
  return `SB-${a}-${b}-${num}`;
}

export const formatHours = (h) => {
  // 이틀 미만은 시간으로만 (예: 26h), 그 이상은 일·시간 (예: 2d 5h)
  const total = Math.round(h);
  return total < 48 ? `${total}h` : `${Math.floor(total / 24)}d ${total % 24}h`;
};

// ── 항로 지도 ─────────────────────────────────────────────

let land = null;
async function loadLand() {
  if (!land) {
    const rings = await (await fetch("./land.json")).json();
    // 날짜변경선을 넘는 고리는 경도를 이어 붙여야 지도에 가로줄이 생기지 않음
    land = rings.map((ring) => {
      const r = ring.slice();
      for (let i = 2; i < r.length; i += 2) {
        while (r[i] - r[i - 2] > 180) r[i] -= 360;
        while (r[i] - r[i - 2] < -180) r[i] += 360;
      }
      return r;
    });
  }
  return land;
}

// 두 지점 사이 대권 위의 점들 (경도는 연속되게 펴서, 날짜변경선을 넘어도 선이 끊기지 않게)
function arcPoints(a, b, n = 48) {
  const toV = (p) => [
    Math.cos(p.lat * RAD) * Math.cos(p.lon * RAD),
    Math.cos(p.lat * RAD) * Math.sin(p.lon * RAD),
    Math.sin(p.lat * RAD),
  ];
  const va = toV(a);
  const vb = toV(b);
  const dot = Math.max(
    -1,
    Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]),
  );
  const om = Math.acos(dot);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s1 = om < 1e-6 ? 1 - t : Math.sin((1 - t) * om) / Math.sin(om);
    const s2 = om < 1e-6 ? t : Math.sin(t * om) / Math.sin(om);
    const v = [
      va[0] * s1 + vb[0] * s2,
      va[1] * s1 + vb[1] * s2,
      va[2] * s1 + vb[2] * s2,
    ];
    pts.push({
      lat: Math.atan2(v[2], Math.hypot(v[0], v[1])) / RAD,
      lon: Math.atan2(v[1], v[0]) / RAD,
    });
  }
  return pts;
}

// 경로 전체를 하나의 연속된 점 목록으로 (구간 경계 인덱스 포함)
function routePath(route) {
  const pts = [];
  const marks = [0];
  for (const leg of route.legs) {
    // 점 개수를 거리에 비례시켜 비행기가 긴 구간을 오래 날게 함
    const seg =
      leg.mode === "air"
        ? arcPoints(leg.from, leg.to, Math.max(6, Math.round(leg.km / 120)))
        : [leg.from, leg.to];
    if (pts.length) seg.shift();
    pts.push(...seg.map((p) => ({ lat: p.lat, lon: p.lon })));
    marks.push(pts.length - 1);
  }
  for (let i = 1; i < pts.length; i++) {
    while (pts[i].lon - pts[i - 1].lon > 180) pts[i].lon -= 360;
    while (pts[i].lon - pts[i - 1].lon < -180) pts[i].lon += 360;
  }
  return { pts, marks };
}

// 바탕 지도: 바다, 30도 간격 경위선, 육지
function paintBase(g, rings, { cw, ch, minLon, maxLon, minLat, maxLat, X, Y }) {
  // 바다
  const sea = g.createLinearGradient(0, 0, 0, ch);
  sea.addColorStop(0, "#14223a");
  sea.addColorStop(1, "#0d1626");
  g.fillStyle = sea;
  g.fillRect(0, 0, cw, ch);
  // 경위선
  g.strokeStyle = "rgba(160,190,230,0.08)";
  g.lineWidth = 1;
  for (let lon = Math.ceil(minLon / 30) * 30; lon < maxLon; lon += 30) {
    g.beginPath();
    g.moveTo(X(lon), 0);
    g.lineTo(X(lon), ch);
    g.stroke();
  }
  for (let lat = Math.ceil(minLat / 30) * 30; lat < maxLat; lat += 30) {
    g.beginPath();
    g.moveTo(0, Y(lat));
    g.lineTo(cw, Y(lat));
    g.stroke();
  }
  // 육지: 경도를 360도씩 밀어 세 번 그려 날짜변경선 너머도 이어지게
  g.fillStyle = "#2b3a52";
  g.strokeStyle = "rgba(200,220,255,0.12)";
  g.lineWidth = 0.6;
  for (const shift of [-360, 0, 360]) {
    for (const ring of rings) {
      g.beginPath();
      for (let i = 0; i < ring.length; i += 2)
        g.lineTo(X(ring[i] + shift), Y(ring[i + 1]));
      g.closePath();
      g.fill();
      g.stroke();
    }
  }
}

// 지도 그리기. progress 0~1: 비행기가 경로 어디쯤 있는지 (null이면 비행기 없이 전체 경로만)
// pulse: { k, phase } — 허브에서 처리 중인 정류장 k에 퍼지는 고리 (phase 0~1)
export async function drawRouteMap(canvas, route, progress = null, { pulse } = {}) {
  const rings = await loadLand();
  const g = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = canvas.clientWidth || 520;
  const ch = canvas.clientHeight || 240;
  if (canvas.width !== Math.round(cw * dpr)) {
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { pts, marks } = route._path || (route._path = routePath(route));
  // 경로가 들어오는 범위에 여백을 두고 화면 비율에 맞춤
  let minLon = Math.min(...pts.map((p) => p.lon));
  let maxLon = Math.max(...pts.map((p) => p.lon));
  let minLat = Math.min(...pts.map((p) => p.lat));
  let maxLat = Math.max(...pts.map((p) => p.lat));
  const padLon = Math.max(12, (maxLon - minLon) * 0.18);
  const padLat = Math.max(10, (maxLat - minLat) * 0.25);
  minLon -= padLon;
  maxLon += padLon;
  minLat -= padLat;
  maxLat += padLat;
  const aspect = cw / ch;
  if ((maxLon - minLon) / (maxLat - minLat) < aspect) {
    const need = (maxLat - minLat) * aspect - (maxLon - minLon);
    minLon -= need / 2;
    maxLon += need / 2;
  } else {
    const need = (maxLon - minLon) / aspect - (maxLat - minLat);
    minLat -= need / 2;
    maxLat += need / 2;
  }
  const X = (lon) => ((lon - minLon) / (maxLon - minLon)) * cw;
  const Y = (lat) => ((maxLat - lat) / (maxLat - minLat)) * ch;

  // 바다·경위선·육지는 경로와 크기가 같으면 한 번만 그려 두고 매 프레임 복사
  const key = `${cw}x${ch}@${dpr}`;
  if (!route._base || route._base.key !== key) {
    const base = document.createElement("canvas");
    base.width = canvas.width;
    base.height = canvas.height;
    const bg = base.getContext("2d");
    bg.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintBase(bg, rings, { cw, ch, minLon, maxLon, minLat, maxLat, X, Y });
    route._base = { key, canvas: base };
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(route._base.canvas, 0, 0);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 경로: 전체는 옅은 점선, 지나온 부분은 금빛 실선
  const upto =
    progress == null
      ? pts.length - 1
      : Math.max(0, Math.min(pts.length - 1, progress * (pts.length - 1)));
  g.setLineDash([3, 4]);
  g.strokeStyle = "rgba(255,214,140,0.45)";
  g.lineWidth = 1.4;
  g.beginPath();
  pts.forEach((p, i) =>
    i ? g.lineTo(X(p.lon), Y(p.lat)) : g.moveTo(X(p.lon), Y(p.lat)),
  );
  g.stroke();
  g.setLineDash([]);
  if (progress != null) {
    g.strokeStyle = "#ffd27a";
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i <= Math.floor(upto); i++)
      i
        ? g.lineTo(X(pts[i].lon), Y(pts[i].lat))
        : g.moveTo(X(pts[i].lon), Y(pts[i].lat));
    g.stroke();
  }

  // 정류장 표시: 출발·도착 도시는 큰 점, 공항은 작은 점과 코드
  g.font = "600 10px Pretendard, sans-serif";
  g.textAlign = "center";
  const labelled = [];
  route.stops.forEach((s, i) => {
    const p = pts[marks[i]];
    const x = X(p.lon);
    const y = Y(p.lat);
    const reached = progress == null || marks[i] <= upto + 0.01;
    const city = s.kind !== "airport";
    g.fillStyle = reached
      ? city
        ? "#ffd27a"
        : "#f4f1ea"
      : "rgba(244,241,234,0.4)";
    g.beginPath();
    g.arc(x, y, city ? 4 : 2.6, 0, Math.PI * 2);
    g.fill();
    if (city) {
      g.strokeStyle = "rgba(255,210,122,0.35)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x, y, 7, 0, Math.PI * 2);
      g.stroke();
    }
    // 공항 코드: 가까운 공항끼리 겹치면 다음 것은 점 아래에 적음
    if (!city) {
      const near = labelled.some(
        (q) => Math.abs(q.x - x) < 26 && Math.abs(q.y - (y - 7)) < 11,
      );
      const ly = near ? y + 15 : y - 7;
      labelled.push({ x, y: ly });
      g.fillStyle = "rgba(244,241,234,0.85)";
      g.fillText(s.code, x, ly);
    }
  });

  // 허브 처리 중: 정류장에서 금빛 고리가 퍼져 나감
  if (pulse) {
    const p = pts[marks[pulse.k]];
    g.strokeStyle = `rgba(255,210,122,${0.8 * (1 - pulse.phase)})`;
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(X(p.lon), Y(p.lat), 4 + pulse.phase * 14, 0, Math.PI * 2);
    g.stroke();
  }

  // 비행기
  if (progress != null && progress > 0 && progress < 1) {
    const i = Math.floor(upto);
    const a = pts[i];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const f = upto - i;
    const x = X(a.lon + (b.lon - a.lon) * f);
    const y = Y(a.lat + (b.lat - a.lat) * f);
    const ang = Math.atan2(Y(b.lat) - Y(a.lat), X(b.lon) - X(a.lon));
    g.save();
    g.translate(x, y);
    g.rotate(ang + Math.PI / 2);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(0, -7);
    g.lineTo(1.4, -2);
    g.lineTo(7, 1.5);
    g.lineTo(7, 3);
    g.lineTo(1.4, 1.2);
    g.lineTo(1, 5);
    g.lineTo(3, 6.5);
    g.lineTo(3, 7.5);
    g.lineTo(0, 6.6);
    g.lineTo(-3, 7.5);
    g.lineTo(-3, 6.5);
    g.lineTo(-1, 5);
    g.lineTo(-1.4, 1.2);
    g.lineTo(-7, 3);
    g.lineTo(-7, 1.5);
    g.lineTo(-1.4, -2);
    g.closePath();
    g.fill();
    g.restore();
  }
}

// 구간마다 경로 진행률의 시작·끝 [t0, t1]
export function legSpans(route) {
  const { pts, marks } = route._path || (route._path = routePath(route));
  return route.legs.map((_, i) => [marks[i] / (pts.length - 1), marks[i + 1] / (pts.length - 1)]);
}

// 경로가 진행률 t에서 몇 번째 정류장까지 왔는지
export function stopIndexAt(route, t) {
  const { pts, marks } = route._path || (route._path = routePath(route));
  const at = t * (pts.length - 1);
  let k = 0;
  marks.forEach((m, i) => {
    if (m <= at + 0.01) k = i;
  });
  return k;
}

// 진행률 t에서의 위치: 마지막으로 지난 정류장 k, 다음 구간에서 간 비율 f, 시뮬레이션 경과 시간
export function progressAt(route, t) {
  const { pts, marks } = route._path || (route._path = routePath(route));
  const at = t * (pts.length - 1);
  const k = stopIndexAt(route, t);
  if (k >= route.stops.length - 1)
    return { k, f: 0, hours: route.hours, leg: null };
  const f = Math.max(
    0,
    Math.min(1, (at - marks[k]) / (marks[k + 1] - marks[k] || 1)),
  );
  const leg = route.legs[k];
  return { k, f, hours: route.stops[k].out + f * leg.hours, leg };
}

// 운송장 본문 HTML (정류장 목록, 거리, 리드타임)
export function waybillHTML(route, id, cargo = "") {
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const stops = route.stops
    .map(
      (s, i) =>
        `<li class="wb-stop" data-i="${i}"><span class="wb-code">${esc(s.kind === "airport" ? s.code : "●")}</span><span class="wb-name">${esc(s.name)}</span></li>`,
    )
    .join("");
  return `
    <div class="wb-head">
      <span class="wb-label">WAYBILL</span>
      <span class="wb-id">${esc(id)}</span>
    </div>
    ${cargo ? `<p class="wb-cargo"><span>CARGO</span> 1 × snowball · ${esc(cargo)} <em>FRAGILE ❄</em></p>` : ""}
    <canvas class="wb-map" aria-label="Simulated route map"></canvas>
    <ol class="wb-stops">${stops}</ol>
    <dl class="wb-facts">
      <div><dt>Distance</dt><dd>${Math.round(route.km).toLocaleString("en-US")} km</dd></div>
      <div><dt>Lead time</dt><dd>${formatHours(route.hours)}</dd></div>
      <div><dt>Hubs</dt><dd>${route.stops.filter((st) => st.kind === "airport").length} · ${route.legs.filter((l) => l.mode === "air").length} flight${route.legs.filter((l) => l.mode === "air").length > 1 ? "s" : ""}</dd></div>
      <div><dt>Customs</dt><dd>${route.customs ? "Yes" : "Domestic"}</dd></div>
    </dl>
    <p class="wb-note">Simulated route · hub-and-spoke model, great-circle distances</p>`;
}
