// 편지 링크(/?letter=...)를 카톡·인스타 DM에 붙였을 때 보이는 미리보기 카드를 편지마다 바꿔 줌.
// 미리보기 봇은 자바스크립트를 실행하지 않아서, 서버에서 index.html의 제목·설명 태그만 바꿔 돌려줌.
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
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function readLetter(code) {
  try {
    const json = Buffer.from(String(code).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const d = JSON.parse(json);
    const clip = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
    return { from: clip(d.f, 20), to: clip(d.t, 20) };
  } catch {
    return {};
  }
}

let page = null;
module.exports = (req, res) => {
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
  const letter = readLetter(q.get("letter") || "");
  const from = q.get("from") || letter.from;
  const to = q.get("to") || letter.to;
  const place = PLACES[(q.get("landmark") || "").toLowerCase()];
  const title = `📬 ${from ? `${from}님이 보낸 ` : ""}${place ? `${place} ` : ""}스노우볼 편지가 도착했어요`;
  const desc = `${to ? `To. ${to} · ` : ""}봉투의 밀랍 도장을 떼고 편지를 열어 보세요 ✉️`;
  const origin = `https://${req.headers.host}`;
  const html = page
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${origin}/icons/icon-512.png$2`)
    .replace("</head>", `    <meta property="og:url" content="${esc(origin + url.pathname + url.search)}" />\n    <meta name="twitter:card" content="summary" />\n  </head>`);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
  res.end(html);
};
