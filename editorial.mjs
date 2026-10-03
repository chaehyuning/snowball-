// 디자인 포트폴리오처럼 화면 가장자리에 장면 정보를 싣는 부분
import { PLACES } from "./picker.mjs";

// 장면마다: 배경 필기체 지명, 도시와 지역, 관광 홍보 문구, 도시 소개,
// 랜드마크 실제 좌표(위키백과 기준), 흩날리는 것
const INFO = {
  japan: {
    word: "Japan", city: "Fujiyoshida", region: "Yamanashi, Japan", landmark: "Mount Fuji",
    coord: "35°21′39″N  138°43′39″E", particle: "Cherry blossoms",
    tagline: "Where the mountain fills the sky",
    text: "후지산 북쪽 기슭의 도시. 해발 3,776m 후지산이 마을 어디서나 보이고, 4월 초에는 아라쿠라야마 공원의 벚꽃과 5층탑 너머로 산이 한 화면에 담긴다. 후지산은 2013년 유네스코 세계유산이 됐다.",
  },
  korea: {
    word: "Korea", city: "Seoul", region: "Yongsan-gu, Korea", landmark: "N Seoul Tower",
    coord: "37°33′04″N  126°59′18″E", particle: "City lights",
    tagline: "The city lights up from the hilltop",
    text: "서울 한가운데 남산 꼭대기에 선 높이 236m 타워. 1980년 일반에 처음 열렸고, 전망대에서 도심과 한강을 360도로 내려다본다. 난간에는 연인들이 건 사랑의 자물쇠가 빼곡하다.",
  },
  canada: {
    word: "Canada", city: "Québec City", region: "Québec, Canada", landmark: "Château Frontenac",
    coord: "46°48′43″N  71°12′18″W", particle: "Maple leaves",
    tagline: "The walled city on the St. Lawrence",
    text: "멕시코 북쪽 북미에서 유일하게 성벽이 남은 도시로, 구시가지는 1985년 유네스코 세계유산이 됐다. 1893년 문을 연 샤토 프롱트낙 호텔이 세인트로렌스강 위 언덕에 서 있고, 드라마 〈도깨비〉 촬영지로 알려졌다.",
  },
  australia: {
    word: "Australia", city: "Sydney", region: "New South Wales, Australia", landmark: "Sydney Opera House",
    coord: "33°51′25″S  151°12′55″E", particle: "Sea spray",
    tagline: "Sails on the harbour",
    text: "덴마크 건축가 예른 웃손이 설계해 1973년 문을 연 오페라하우스. 조개껍데기 같은 지붕을 타일 100만 장 넘게 덮었고, 2007년 유네스코 세계유산이 됐다. 뒤로 하버 브리지가 항구를 가로지른다.",
  },
  finland: {
    word: "Finland", city: "Rovaniemi", region: "Lapland, Finland", landmark: "Santa Claus Village",
    coord: "66°32′37″N  25°50′51″E", particle: "Snowflakes",
    tagline: "Cross the Arctic Circle on foot",
    text: "라플란드의 주도. 산타클로스 마을 한가운데로 북극권 경계선(북위 66°33′)이 지나가서 걸어서 넘을 수 있고, 산타 우체국에서 편지를 부치면 산타 우체국 소인이 찍혀 나간다.",
  },
  china: {
    word: "China", city: "Beijing", region: "Dongcheng, Beijing, China", landmark: "Forbidden City",
    coord: "39°54′57″N  116°23′27″E", particle: "Ginkgo leaves",
    tagline: "Five centuries behind red walls",
    text: "1420년 완공된 명·청 황궁. 황제 24명이 살았고 건물 980여 채가 남아 있다. 1987년 유네스코 세계유산이 됐고, 지금은 고궁박물원으로 공개된다.",
  },
  egypt: {
    word: "Egypt", city: "Giza", region: "Greater Cairo, Egypt", landmark: "Pyramids of Giza",
    coord: "29°58′45″N  31°08′03″E", particle: "Desert sand",
    tagline: "The last wonder still standing",
    text: "카이로 서쪽 사막 가장자리. 약 4,500년 전 세운 쿠푸왕 대피라미드(원래 높이 146.6m)는 고대 7대 불가사의 가운데 지금까지 남은 유일한 건축물이고, 그 앞을 스핑크스가 지킨다.",
  },
  france: {
    word: "France", city: "Paris", region: "Île-de-France, France", landmark: "Tour Eiffel",
    coord: "48°51′30″N  2°17′40″E", particle: "Rose petals",
    tagline: "Sparkling on the hour",
    text: "1889년 파리 만국박람회에 맞춰 세운 높이 330m 철탑. 7년마다 새로 칠하고, 해가 지면 매시 정각 5분 동안 전구 2만 개가 반짝인다.",
  },
  turkey: {
    word: "Türkiye", city: "Istanbul", region: "Fatih, Istanbul, Türkiye", landmark: "Blue Mosque",
    coord: "41°00′19″N  28°58′37″E", particle: "Butterflies",
    tagline: "Blue light under six minarets",
    text: "1617년 완공된 술탄 아흐메트 모스크. 안쪽 벽을 덮은 이즈니크 타일 2만여 장의 푸른빛 때문에 블루 모스크라 불리고, 첨탑 6개가 서 있다. 지금도 예배가 열린다.",
  },
  spain: {
    word: "Spain", city: "Barcelona", region: "Catalonia, Spain", landmark: "Sagrada Família",
    coord: "41°24′13″N  2°10′28″E", particle: "Stained glass",
    tagline: "Light through a forest of stone",
    text: "안토니 가우디가 1883년부터 설계를 맡은 성당. 2010년 축성됐고 지금도 공사 중이다. 동쪽 창은 파랑·초록, 서쪽 창은 주황·빨강 스테인드글라스라 해가 움직이면 실내 빛깔이 바뀌고, 나무처럼 갈라지는 기둥이 천장을 받친다.",
  },
};

// 여행자에게 와닿는 정보: 현지 시간대, 가장 아름다운 순간, 스노우볼 속 상징물, 장면처럼 읽히는 이야기
const TRAVEL = {
  "japan": {
    "tz": "Asia/Tokyo",
    "best": "3월 말~4월 중순 이른 아침 · 오후엔 구름에 가리기 쉬움",
    "symbol": "벚꽃잎 — 짧게 피고 지는 봄",
    "story": "벚꽃이 피는 4월 초 이른 아침, 아라쿠라야마 공원의 398개 계단을 오르면 숨이 찰 즈음 시야가 확 열립니다. 분홍 벚꽃과 붉은 5층탑 너머로 눈 덮인 후지산이 한 장의 엽서처럼 겹쳐 서요. 바람이 한 번 불면 꽃잎이 산을 가로질러 흩날립니다."
  },
  "korea": {
    "tz": "Asia/Seoul",
    "best": "해 진 직후 블루아워 · 도시 불빛이 하나둘 켜질 때",
    "symbol": "반짝이는 불빛 — 잠들지 않는 서울",
    "story": "해가 넘어가면 서울 한가운데 남산 위 타워에 불이 들어옵니다. 산책로를 따라 천천히 오르면 발아래로 도심과 한강의 불빛이 번져 가고, 난간마다 걸린 사랑의 자물쇠가 바람에 달그락거려요."
  },
  "canada": {
    "tz": "America/Toronto",
    "best": "10월 초중순 해 질 녘 · 단풍이 가장 붉을 때",
    "symbol": "단풍잎 — 캐나다 국기의 잎",
    "story": "10월의 퀘벡은 도시 전체가 붉고 노랗게 물듭니다. 언덕 위 단풍나무 아래 앉아 강 쪽을 내려다보면, 금빛 노을 속에 샤토 프롱트낙의 녹색 지붕이 동화처럼 서 있어요. 드라마 〈도깨비〉의 그 언덕이 바로 이 풍경입니다."
  },
  "australia": {
    "tz": "Australia/Sydney",
    "best": "해 질 녘 · 서큘러 키에서 지붕이 분홍빛으로 물들 때",
    "symbol": "물방울 — 항구를 가르는 물보라",
    "title": "Sydney – Opera House",
    "story": "1957년, 덴마크 건축가 예른 웃손의 스케치가 국제 공모에서 뽑혔습니다. 조가비 같기도, 바람을 품은 돛 같기도 한 지붕은 너무 어려워 열두 번 넘게 설계를 고친 끝에, 1962년 모든 곡면을 지름 75m짜리 구 하나에서 잘라내는 방법으로 풀었어요. 그 위를 105만 장이 넘는 흰 타일이 덮습니다. 바로 뒤 강철 아치의 하버 브리지와 나란히 서면, 곧은 다리와 둥근 돛이 항구를 함께 완성해요."
  },
  "finland": {
    "tz": "Europe/Helsinki",
    "best": "9월 말~10월, 2월 말~3월의 맑은 밤 · 오로라가 자주 뜨는 때",
    "symbol": "눈꽃 — 북극권의 겨울",
    "story": "산타클로스 마을 한가운데 그어진 흰 선을 한 발로 넘으면, 그 순간 북극권 안에 들어섭니다. 산타 우체국에서 엽서를 부치고 나오면 하늘에서 초록빛 오로라가 커튼처럼 흔들리고, 발밑에서 눈이 뽀드득 울려요."
  },
  "china": {
    "tz": "Asia/Shanghai",
    "best": "10월 20일~11월 10일 무렵 오후 · 은행잎이 노랗게 물들 때",
    "symbol": "은행잎과 붉은 등 — 가을의 궁궐",
    "story": "늦은 오후 북쪽 징산 공원 언덕에 오르면, 자금성의 노란 기와지붕이 끝없이 이어진 금빛 바다처럼 펼쳐집니다. 500년 가까이 황제의 궁궐이던 붉은 담장 사이로 은행잎이 쏟아지고, 처마 밑 붉은 등이 하나둘 켜져요."
  },
  "egypt": {
    "tz": "Africa/Cairo",
    "best": "해 뜰 무렵과 해 질 녘 · 한낮 더위를 피해",
    "symbol": "모래알 — 4,500년의 시간",
    "story": "해가 지평선에 닿을 무렵 기자 고원에 서면, 4,500년 된 돌이 분홍빛에서 금빛으로 천천히 색을 바꿉니다. 사막 바람에 모래가 사르르 흩날리고, 스핑크스는 오늘도 같은 쪽을 바라보고 있어요."
  },
  "france": {
    "tz": "Europe/Paris",
    "best": "해 진 뒤 매시 정각 · 5분 동안 반짝임",
    "symbol": "장미 꽃잎 — 사랑의 도시",
    "story": "해가 지고 정각이 되면 철탑 전체가 5분 동안 2만 개의 전구로 반짝입니다. 트로카데로 광장 계단에 앉아 분수 너머로 그 순간을 기다리면, 주위 사람들이 동시에 작은 탄성을 지르는 소리가 들려요."
  },
  "turkey": {
    "tz": "Europe/Istanbul",
    "best": "저녁 기도 뒤 조명이 켜질 때 · 예배 시간에는 입장 제한",
    "symbol": "나비 — 푸른 타일 정원의 날개",
    "story": "여섯 첨탑에서 기도 시간을 알리는 소리가 울려 퍼지면, 광장의 공기가 잠시 고요해집니다. 안으로 들어서면 2만여 장의 푸른 이즈니크 타일이 둥근 천장 아래서 은은하게 빛나고, 정원의 튤립 위로 나비가 날아올라요."
  },
  "spain": {
    "tz": "Europe/Madrid",
    "best": "늦은 오후 · 서쪽 창의 붉은 빛이 가득할 때",
    "symbol": "스테인드글라스 조각 — 빛으로 그린 그림",
    "story": "오전에는 차분한 푸른빛이, 늦은 오후에는 타오르는 붉은 노을빛이 성당 안을 가득 채웁니다. 가우디가 왜 숲을 닮은 기둥을 세웠는지, 그 빛 아래 서면 온몸으로 느끼게 돼요. 2035년 완공을 목표로 지금도 공사 중인, 시간이 함께 짓는 성당입니다."
  }
};

const pad = (n) => String(n).padStart(2, "0");

// 현지 시각: 1분마다 다시 씀
let clockId = null;
let clockTz = null;
function tickClock() {
  const el = document.querySelector(".meta-time");
  if (!el || !clockTz) return;
  try {
    el.textContent = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: clockTz }).format(new Date());
  } catch {
    el.textContent = "";
  }
}

export function showSceneInfo(id, index, total) {
  const info = INFO[id];
  const place = PLACES[id];
  if (!info || !place) return;
  const root = document.documentElement;
  root.style.setProperty("--accent", place.color);

  const set = (sel, text) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = text;
  };
  set(".edition-index", `N° ${pad(index + 1)} / ${pad(total)}`);
  set(".edition-coord", info.coord);
  set(".meta-index", pad(index + 1));
  set(".meta-total", `/ ${pad(total)}`);
  const travel = TRAVEL[id] || {};
  set(".meta-city", travel.title || info.city);
  set(".sheet-title", travel.title || info.landmark);
  set(".meta-tagline", info.tagline);
  set(".meta-text", travel.story || info.text);
  set(".meta-landmark", info.landmark);
  set(".meta-region", info.region);
  set(".meta-best", travel.best || "");
  set(".meta-symbol", travel.symbol || info.particle);
  set(".meta-place", info.city);
  clockTz = travel.tz;
  tickClock();
  clearInterval(clockId);
  clockId = setInterval(tickClock, 30000);

  // 배경 필기체 지명은 살짝 사라졌다 바뀌어 나타남
  const ghost = document.querySelector(".ghost");
  if (ghost && ghost.textContent !== info.word) {
    ghost.classList.remove("ghost-in");
    void ghost.offsetWidth;
    ghost.textContent = info.word;
    ghost.classList.add("ghost-in");
  }
  fitGhost();
}

// 좁은 화면에서는 배경 필기체 지명이 화면 폭 안에 다 들어오도록 글씨 크기를 줄임
function fitGhost() {
  const ghost = document.querySelector(".ghost");
  if (!ghost) return;
  ghost.style.fontSize = "";
  const room = window.innerWidth - 24;
  const width = ghost.scrollWidth;
  if (width > room) {
    const size = parseFloat(getComputedStyle(ghost).fontSize);
    ghost.style.fontSize = `${Math.floor((size * room) / width)}px`;
  }
}
window.addEventListener("resize", fitGhost);
document.fonts?.ready.then(fitGhost);

// 아래쪽에 천천히 흐르는 랜드마크 이름 띠. 끊김 없이 돌도록 같은 줄을 두 번 이어 붙임
export function fillTicker(ids) {
  const track = document.querySelector(".ticker-track");
  if (!track) return;
  const line = ids
    .map((id) => INFO[id]?.landmark)
    .filter(Boolean)
    .map((name) => `<span>${name}</span><i aria-hidden="true">✦</i>`)
    .join("");
  track.innerHTML = line + line;
}

// 기본은 한 줄 카피와 현지 시각만. '자세히 보기'를 누르면 이야기와 여행 정보가 펼쳐짐.
// 좁은 화면에서는 현재 장면 카드 하나만 바텀 시트로 올라오고, 닫으면 스노우볼로 돌아옴
export function setupMetaToggle() {
  const meta = document.querySelector(".meta");
  const button = document.querySelector(".meta-toggle");
  const more = document.querySelector(".meta-more");
  if (!meta || !button || !more) return;
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.hidden = true;
  document.body.append(backdrop);
  const narrow = () => window.matchMedia("(max-width: 1180px)").matches;
  let open = false;
  const apply = () => {
    meta.dataset.open = String(open);
    button.setAttribute("aria-expanded", String(open));
    button.querySelector(".meta-toggle-label").textContent = open ? "접기" : "자세히 보기";
    const sheet = open && narrow();
    document.body.classList.toggle("sheet-open", sheet);
    backdrop.hidden = !sheet;
  };
  const close = () => {
    open = false;
    apply();
  };
  button.addEventListener("click", () => {
    open = !open;
    apply();
  });
  backdrop.addEventListener("click", close);
  more.querySelector(".sheet-close")?.addEventListener("click", close);
  window.addEventListener("keydown", (e) => e.key === "Escape" && open && close());
  window.addEventListener("snowball:scene", () => narrow() && open && close());
  window.addEventListener("resize", apply);
  apply();
}

// 엽서·여권에서 쓰는 장면 정보
export function sceneInfo(id) {
  const info = INFO[id] || {};
  const travel = TRAVEL[id] || {};
  return { ...info, ...travel, color: PLACES[id]?.color };
}
