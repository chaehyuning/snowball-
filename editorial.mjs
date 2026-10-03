// 디자인 포트폴리오처럼 화면 가장자리에 장면 정보를 싣는 부분
import { PLACES } from "./picker.mjs";

// 장면마다: 배경 필기체 지명, 도시와 지역, 관광 홍보 문구, 도시 소개,
// 랜드마크 실제 좌표(위키백과 기준), 흩날리는 것
const INFO = {
  japan: {
    word: "Fuji", city: "Fujiyoshida", region: "Yamanashi, Japan", landmark: "Mount Fuji",
    coord: "35°21′38″N  138°43′39″E", particle: "Cherry blossoms",
    tagline: "Where the mountain fills the sky",
    text: "후지산 북쪽 기슭의 도시. 해발 3,776m 후지산이 마을 어디서나 보이고, 4월 초에는 아라쿠라야마 공원의 벚꽃과 5층탑 너머로 산이 한 화면에 담긴다. 후지산은 2013년 유네스코 세계유산이 됐다.",
  },
  korea: {
    word: "Namsan", city: "Seoul", region: "Yongsan-gu, Korea", landmark: "N Seoul Tower",
    coord: "37°33′05″N  126°59′17″E", particle: "City lights",
    tagline: "The city lights up from the hilltop",
    text: "서울 한가운데 남산 꼭대기에 선 높이 236m 타워. 1980년 일반에 처음 열렸고, 전망대에서 도심과 한강을 360도로 내려다본다. 난간에는 연인들이 건 사랑의 자물쇠가 빼곡하다.",
  },
  canada: {
    word: "Québec", city: "Québec City", region: "Québec, Canada", landmark: "Château Frontenac",
    coord: "46°48′43″N  71°12′18″W", particle: "Maple leaves",
    tagline: "The walled city on the St. Lawrence",
    text: "멕시코 북쪽 북미에서 유일하게 성벽이 남은 도시로, 구시가지는 1985년 유네스코 세계유산이 됐다. 1893년 문을 연 샤토 프롱트낙 호텔이 세인트로렌스강 위 언덕에 서 있고, 드라마 〈도깨비〉 촬영지로 알려졌다.",
  },
  australia: {
    word: "Sydney", city: "Sydney", region: "New South Wales, Australia", landmark: "Sydney Opera House",
    coord: "33°51′25″S  151°12′55″E", particle: "Sea spray",
    tagline: "Sails on the harbour",
    text: "덴마크 건축가 예른 웃손이 설계해 1973년 문을 연 오페라하우스. 조개껍데기 같은 지붕을 타일 100만 장 넘게 덮었고, 2007년 유네스코 세계유산이 됐다. 뒤로 하버 브리지가 항구를 가로지른다.",
  },
  finland: {
    word: "Lapland", city: "Rovaniemi", region: "Lapland, Finland", landmark: "Santa Claus Village",
    coord: "66°32′37″N  25°50′51″E", particle: "Snowflakes",
    tagline: "Cross the Arctic Circle on foot",
    text: "라플란드의 주도. 산타클로스 마을 한가운데로 북극권 경계선(북위 66°33′)이 지나가서 걸어서 넘을 수 있고, 산타 우체국에서 편지를 부치면 산타 우체국 소인이 찍혀 나간다.",
  },
  china: {
    word: "Beijing", city: "Beijing", region: "Dongcheng, Beijing, China", landmark: "Forbidden City",
    coord: "39°54′57″N  116°23′27″E", particle: "Ginkgo leaves",
    tagline: "Five centuries behind red walls",
    text: "1420년 완공된 명·청 황궁. 황제 24명이 살았고 건물 980여 채가 남아 있다. 1987년 유네스코 세계유산이 됐고, 지금은 고궁박물원으로 공개된다.",
  },
  egypt: {
    word: "Giza", city: "Giza", region: "Greater Cairo, Egypt", landmark: "Pyramids of Giza",
    coord: "29°58′45″N  31°08′03″E", particle: "Desert sand",
    tagline: "The last wonder still standing",
    text: "카이로 서쪽 사막 가장자리. 약 4,500년 전 세운 쿠푸왕 대피라미드(원래 높이 146.6m)는 고대 7대 불가사의 가운데 지금까지 남은 유일한 건축물이고, 그 앞을 스핑크스가 지킨다.",
  },
  france: {
    word: "Paris", city: "Paris", region: "Île-de-France, France", landmark: "Tour Eiffel",
    coord: "48°51′30″N  2°17′40″E", particle: "Rose petals",
    tagline: "Sparkling on the hour",
    text: "1889년 파리 만국박람회에 맞춰 세운 높이 330m 철탑. 7년마다 새로 칠하고, 해가 지면 매시 정각 5분 동안 전구 2만 개가 반짝인다.",
  },
  turkey: {
    word: "Istanbul", city: "Istanbul", region: "Fatih, Istanbul, Türkiye", landmark: "Blue Mosque",
    coord: "41°00′19″N  28°58′37″E", particle: "Butterflies",
    tagline: "Blue light under six minarets",
    text: "1617년 완공된 술탄 아흐메트 모스크. 안쪽 벽을 덮은 이즈니크 타일 2만여 장의 푸른빛 때문에 블루 모스크라 불리고, 첨탑 6개가 서 있다. 지금도 예배가 열린다.",
  },
};

const pad = (n) => String(n).padStart(2, "0");

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
  set(".meta-visit", `Visit ${info.city}`);
  set(".meta-tagline", info.tagline);
  set(".meta-text", info.text);
  set(".meta-landmark", info.landmark);
  set(".meta-region", info.region);
  set(".meta-coord", info.coord);
  set(".meta-particle", info.particle);

  // 배경 필기체 지명은 살짝 사라졌다 바뀌어 나타남
  const ghost = document.querySelector(".ghost");
  if (ghost && ghost.textContent !== info.word) {
    ghost.classList.remove("ghost-in");
    void ghost.offsetWidth;
    ghost.textContent = info.word;
    ghost.classList.add("ghost-in");
  }
}

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
