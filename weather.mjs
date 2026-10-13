// 지금 그 도시의 날씨: Open-Meteo(무료, 키 없음)에서 12곳의 현재 날씨를 한 번에 받아
// 유리구 안에 비·눈·안개·흐림·밤을 덧그리고, 아래 띠에 "비 · 14°"처럼 적음.
// 못 받으면 아무것도 덧그리지 않음 (원래 그림 그대로)

const CACHE_KEY = "snowball-weather";
const FRESH_MS = 15 * 60 * 1000;

// 원래 그림이 밤·해 질 녘인 곳은 현지가 밤이어도 더 어둡게 하지 않음. 실내(성당)는 비·눈을 내리지 않음
const NIGHT_ART = new Set(["korea", "finland", "france", "turkey", "taiwan", "egypt"]);
const INDOOR = new Set(["spain"]);

let now = {}; // id → { kind, temp, isDay }

// WMO 날씨 코드 → 종류
function kindOf(code) {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code === 3) return "cloud";
  return "clear";
}
const WORD = { clear: "맑음", cloud: "흐림", fog: "안개", rain: "비", snow: "눈", storm: "뇌우" };

function readCache() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (saved && Date.now() - saved.at < FRESH_MS) return saved.now;
  } catch {
    // 저장소를 못 쓰면 새로 받음
  }
  return null;
}

// places: { id: { lat, lon } }
export async function loadWeather(places, onReady) {
  const cached = readCache();
  if (cached) {
    now = cached;
    onReady?.();
  } else {
    const ids = Object.keys(places);
    const url =
      "https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code,is_day&timezone=auto" +
      `&latitude=${ids.map((id) => places[id].lat).join(",")}` +
      `&longitude=${ids.map((id) => places[id].lon).join(",")}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [data];
      const next = {};
      list.forEach((d, i) => {
        const c = d?.current;
        if (!c || ids[i] == null) return;
        next[ids[i]] = { kind: kindOf(c.weather_code), temp: Math.round(c.temperature_2m), isDay: c.is_day === 1 };
      });
      now = next;
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), now }));
      } catch {
        // 저장 못 해도 이번 화면에는 씀
      }
      onReady?.();
    } catch {
      // 날씨를 못 받으면 원래 그림 그대로
    }
  }
  // 열어 둔 동안 15분마다 새로
  setTimeout(() => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      // 무시
    }
    loadWeather(places, onReady);
  }, FRESH_MS);
}

export const weatherFor = (id) => now[id] || null;

// 아래 띠에 붙는 한 줄: "비 · 14°"
export function weatherLabel(id) {
  const w = now[id];
  if (!w) return "";
  return `${w.isDay ? "" : "밤 · "}${WORD[w.kind]} ${w.temp}°`;
}

// 비·눈 알갱이는 따로 기억하지 않고 시간과 번호로 자리를 정함 (매 프레임 계산만, 메모리 없음)
const frac = (n) => n - Math.floor(n);
const hash = (i, k) => frac(Math.sin(i * 127.1 + k * 311.7) * 43758.5453);

// 유리구 안, 장면 그림 바로 위에 덧그림. 입자(꽃잎·눈꽃 등)는 이 위에 그려져 밝게 남음
export function drawWeather(ctx, t, globe, id) {
  const w = now[id];
  if (!w) return;
  const indoor = INDOOR.has(id);
  const { x: cx, y: cy, r } = globe;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // 밤: 낮 그림을 푸르스름하게 어둡게 (원래 밤 그림인 곳은 그대로)
  if (!w.isDay && !NIGHT_ART.has(id)) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = indoor ? "rgb(150,150,185)" : "rgb(96,108,168)";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.globalCompositeOperation = "source-over";
  }
  // 흐림·비·눈·뇌우: 하늘이 회색빛으로 가라앉음
  if (!indoor && w.kind !== "clear" && w.kind !== "fog") {
    const veil = ctx.createLinearGradient(0, cy - r, 0, cy + r * 0.3);
    veil.addColorStop(0, `rgba(104,112,128,${w.kind === "cloud" ? 0.3 : 0.45})`);
    veil.addColorStop(1, "rgba(110,118,132,0)");
    ctx.fillStyle = veil;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 1.3);
  }
  // 안개: 아래부터 하얗게 번짐
  if (!indoor && w.kind === "fog") {
    const fog = ctx.createLinearGradient(0, cy + r * 0.7, 0, cy - r * 0.4);
    fog.addColorStop(0, "rgba(232,236,242,0.6)");
    fog.addColorStop(1, "rgba(232,236,242,0)");
    ctx.fillStyle = fog;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  // 뇌우: 몇 초에 한 번 하늘이 번쩍
  if (!indoor && w.kind === "storm") {
    const p = (t % 6400) / 6400;
    if (p < 0.05) {
      ctx.fillStyle = `rgba(235,240,255,${0.35 * (1 - p / 0.05)})`;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }
  if (!indoor && (w.kind === "rain" || w.kind === "storm")) {
    const n = w.kind === "storm" ? 90 : 60;
    // 밝은 하늘에서도 어두운 하늘에서도 보이는 회청색 빗줄기
    ctx.strokeStyle = "rgba(168,188,220,0.62)";
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const speed = 0.32 + hash(i, 1) * 0.18;
      const y = cy - r + frac(hash(i, 2) + (t * speed) / 1000 / 1.6) * r * 1.75;
      const x = cx - r + hash(i, 3) * r * 2 - (y - cy) * 0.12;
      const len = 7 + hash(i, 4) * 6;
      ctx.moveTo(x, y);
      ctx.lineTo(x - len * 0.12, y + len);
    }
    ctx.stroke();
  }
  if (!indoor && w.kind === "snow") {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    for (let i = 0; i < 80; i++) {
      const speed = 0.05 + hash(i, 1) * 0.05;
      const y = cy - r + frac(hash(i, 2) + (t * speed) / 1000 / 1.6) * r * 1.75;
      const x = cx - r + hash(i, 3) * r * 2 + Math.sin(t * 0.0012 + i) * 4;
      const s = 0.7 + hash(i, 4) * 1.3;
      ctx.moveTo(x + s, y);
      ctx.arc(x, y, s, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.restore();
}
