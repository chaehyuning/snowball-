// 디자인 포트폴리오처럼 화면 가장자리에 장면 정보를 싣는 부분
import { PLACES } from "./picker.mjs";

// 장면마다: 배경에 크게 깔리는 필기체 지명, 랜드마크, 지역, 흩날리는 것
const INFO = {
  japan: { word: "Fuji", landmark: "Mount Fuji", region: "Yamanashi, Japan", particle: "Cherry blossoms" },
  korea: { word: "Namsan", landmark: "N Seoul Tower", region: "Seoul, Korea", particle: "City lights" },
  canada: { word: "Québec", landmark: "Château Frontenac", region: "Québec City, Canada", particle: "Maple leaves" },
  australia: { word: "Sydney", landmark: "Sydney Opera House", region: "Sydney, Australia", particle: "Sea spray" },
  finland: { word: "Lapland", landmark: "Santa Claus Village", region: "Rovaniemi, Finland", particle: "Snowflakes" },
  china: { word: "Beijing", landmark: "Forbidden City", region: "Beijing, China", particle: "Ginkgo leaves" },
  egypt: { word: "Giza", landmark: "Pyramids of Giza", region: "Giza, Egypt", particle: "Desert sand" },
  france: { word: "Paris", landmark: "Tour Eiffel", region: "Paris, France", particle: "Rose petals" },
  turkey: { word: "Istanbul", landmark: "Blue Mosque", region: "Istanbul, Türkiye", particle: "Butterflies" },
};

const pad = (n) => String(n).padStart(2, "0");
const coord = (v, pos, neg) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;

export function showSceneInfo(id, index, total) {
  const info = INFO[id];
  const place = PLACES[id];
  if (!info || !place) return;
  const root = document.documentElement;
  root.style.setProperty("--accent", place.color);

  const lat = coord(place.lat, "N", "S");
  const lon = coord(place.lon, "E", "W");
  const set = (sel, text) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = text;
  };
  set(".edition-index", `N° ${pad(index + 1)} / ${pad(total)}`);
  set(".edition-coord", `${lat}, ${lon}`);
  set(".meta-index", pad(index + 1));
  set(".meta-total", `/ ${pad(total)}`);
  set(".meta-title", info.landmark);
  set(".meta-region", info.region);
  set(".meta-coord", `${lat}  ${lon}`);
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
