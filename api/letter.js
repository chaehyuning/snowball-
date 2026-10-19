// 편지 링크(/?letter=...)·스노우볼 링크(/?landmark=...)를 카톡·인스타 DM에 붙였을 때 보이는 미리보기 카드를 바꿔 줌.
// 미리보기 봇은 자바스크립트를 실행하지 않아서, 서버에서 index.html의 제목·설명·썸네일 태그만 바꿔 돌려줌.
// 썸네일은 도시마다 미리 그려 둔 스노우볼 그림(og/<도시>.jpg, 1200×630). 편지에 배송 경로가 있으면 설명에 경로를 적음.
// 화면 자체는 그대로 index.html이 그림
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
  hongkong: "시먼딩 거리", // 예전 링크
};
// 주소의 도시 이름 → 장면 id (배송 경로 계산용, logistics.mjs의 CITIES 키)
const SCENE = {
  fuji: "japan", namsan: "korea", quebec: "canada", sydney: "australia", rovaniemi: "finland", beijing: "china",
  giza: "egypt", paris: "france", istanbul: "turkey", barcelona: "spain", uyuni: "bolivia", ximending: "taiwan", hongkong: "taiwan",
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function readLetter(code) {
  try {
    const json = Buffer.from(String(code).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const d = JSON.parse(json);
    const clip = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
    return { from: clip(d.f, 20), to: clip(d.t, 20), route: clip(d.r, 2) };
  } catch {
    return {};
  }
}

// 배송 경로 한 줄: "✈ Paris → Seoul · 9,001km · 20h" (못 만들면 빈 문자열)
let logistics = null;
async function routeLine(slug, dest) {
  if (!dest || !SCENE[slug]) return "";
  try {
    logistics ??= await import("../logistics.mjs");
    const r = logistics.planRoute(SCENE[slug], dest);
    if (!r) return "";
    return `✈ ${r.stops[0].name} → ${r.stops.at(-1).name} · ${Math.round(r.km).toLocaleString("en-US")}km · ${logistics.formatHours(r.hours)}`;
  } catch {
    return "";
  }
}

let page = null;
module.exports = async (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const q = url.searchParams;
  try {
    page ??= fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
  } catch {
    // index.html을 못 읽으면 정적 페이지로 그대로 보냄 (미리보기만 기본값)
    res.statusCode = 302;
    res.setHeader("Location", `/index.html${url.search}`);
    return res.end();
  }
  const code = q.get("letter");
  const slug = (q.get("landmark") || "").toLowerCase();
  const place = PLACES[slug];
  const origin = `https://${req.headers.host}`;
  const image = SCENE[slug] ? `${origin}/og/${slug === "hongkong" ? "ximending" : slug}.jpg` : `${origin}/og/paris.jpg`;
  let html = page;
  if (code) {
    const letter = readLetter(code);
    const from = q.get("from") || letter.from;
    const to = q.get("to") || letter.to;
    const route = await routeLine(slug, letter.route);
    const title = `📬 ${from ? `${from}님이 보낸 ` : ""}${place ? `${place} ` : ""}스노우볼 편지가 도착했어요`;
    const desc = `${route ? `${route} · ` : ""}${to ? `To. ${to} · ` : ""}봉투의 밀랍 도장을 떼고 편지를 열어 보세요 ✉️`;
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  } else if (place) {
    const title = `${place} 스노우볼 — Snowball`;
    html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  }
  html = html
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(
      "</head>",
      `    <meta property="og:url" content="${esc(origin + url.pathname + url.search)}" />\n` +
        `    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n` +
        `    <meta name="twitter:card" content="summary_large_image" />\n  </head>`,
    );
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
  res.end(html);
};
