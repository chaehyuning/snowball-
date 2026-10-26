const fs = require("fs");
const path = require("path");

const PLACES = {
  fuji: "후지산",
  namsan: "N서울타워",
  quebec: "샤토 프롱트낙",
  sydney: "시드니 오페라하우스",
  rovaniemi: "산타클로스 마을",
  beijing: "자금성",
  giza: "기자 피라미드",
  paris: "에펠탑",
  istanbul: "블루 모스크",
  barcelona: "사그라다 파밀리아",
  uyuni: "우유니 소금사막",
  ximending: "시먼딩 거리",
  hongkong: "시먼딩 거리",
};
const SCENE = {
  fuji: "japan", namsan: "korea", quebec: "canada", sydney: "australia", rovaniemi: "finland", beijing: "china",
  giza: "egypt", paris: "france", istanbul: "turkey", barcelona: "spain", uyuni: "bolivia", ximending: "taiwan", hongkong: "taiwan",
};

const PROD = "https://weatherball.vercel.app";
const MAX_CODE = 4000;
const SECURITY = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://api.open-meteo.com; media-src 'self' data: blob:; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(self), gyroscope=(self)",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "Cross-Origin-Opener-Policy": "same-origin",
};

const originOf = (host) => {
  const h = String(host || "").toLowerCase();
  return /^weatherball\.vercel\.app$|^[a-z0-9-]+\.vercel\.app$/.test(h) ? `https://${h}` : PROD;
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function readLetter(code) {
  if (String(code).length > MAX_CODE) return {};
  try {
    const json = Buffer.from(String(code).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const d = JSON.parse(json);
    const clip = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
    const num = (v, max) => (Number.isFinite(v) ? Math.min(Math.max(v, 0), max) : 0);
    return {
      from: clip(d.f, 20),
      to: clip(d.t, 20),
      route: clip(d.r, 2),
      service: ["x", "s", "e"].includes(d.s) ? d.s : "s",
      wait: Number.isFinite(d.w) ? num(d.w, 168) : null,
      km: num(d.k, 1e7),
      count: Math.round(num(d.n, 9999)) || 1,
    };
  } catch {
    return {};
  }
}

let logistics = null;
async function routeLine(slug, dest, service, wait) {
  if (!dest || !SCENE[slug]) return null;
  try {
    logistics ??= await import("../logistics.mjs");
    const r = logistics.planRoute(SCENE[slug], dest, service, { wait });
    if (!r) return null;
    return { km: r.km, text: `${r.stops[0].name} → ${r.stops.at(-1).name} · ${logistics.SERVICES[service].name} · ${Math.round(r.km).toLocaleString("en-US")}km · ${logistics.formatHours(r.hours)}` };
  } catch {
    return null;
  }
}

let page = null;
module.exports = async (req, res) => {
  for (const [k, v] of Object.entries(SECURITY)) res.setHeader(k, v);
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    return res.end();
  }
  const origin = originOf(req.headers.host);
  const url = new URL(req.url, origin);
  const q = url.searchParams;
  try {
    page ??= fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
  } catch {
    res.statusCode = 302;
    res.setHeader("Location", "/index.html");
    return res.end();
  }
  const code = q.get("letter");
  const slug = (q.get("landmark") || "").toLowerCase();
  const place = PLACES[slug];
  const image = SCENE[slug] ? `${origin}/og/${slug === "hongkong" ? "ximending" : slug}.jpg` : `${origin}/og/paris.jpg`;
  let html = page;
  if (code) {
    const letter = readLetter(code);
    const from = (q.get("from") || letter.from || "").slice(0, 20);
    const to = (q.get("to") || letter.to || "").slice(0, 20);
    const route = await routeLine(slug, letter.route, letter.service, letter.wait);
    const title = `${from ? `${from}님이 보낸 ` : ""}${place ? `${place} ` : ""}스노우볼 편지가 도착했어요`;
    const total = letter.km + (route ? route.km : 0);
    const thread = letter.count > 1 ? `${letter.count}번째 편지 · 함께 ${Math.round(total).toLocaleString("en-US")}km · ` : "";
    const desc = `${thread}${route ? `${route.text} · ` : ""}${to ? `To. ${to} · ` : ""}봉투의 밀랍 도장을 떼고 편지를 열어 보세요`;
    html = html
      .replace(/<title>[^<]*<\/title>/, () => `<title>${esc(title)}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, (_, a, b) => a + esc(title) + b)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, (_, a, b) => a + esc(desc) + b);
  } else if (place) {
    const title = `${place} 스노우볼 — Snowball`;
    html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, (_, a, b) => a + esc(title) + b);
  }
  html = html
    .replace(/(<meta property="og:image" content=")[^"]*(")/, (_, a, b) => a + esc(image) + b)
    .replace(
      "</head>",
      () =>
        `    <meta property="og:url" content="${esc(origin + url.pathname + url.search)}" />\n` +
        `    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n` +
        `    <meta name="twitter:card" content="summary_large_image" />\n  </head>`,
    );
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
  res.end(html);
};
