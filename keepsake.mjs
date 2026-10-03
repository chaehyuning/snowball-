// 랜선 여행 기념품: 스노우볼 여권(입국 도장 모으기)과 엽서 저장
import { sceneInfo } from "./editorial.mjs";

const PASS_KEY = "snowball-passport";
const DWELL_MS = 4000; // 한 나라를 이만큼 보거나 한 번 터뜨리면 도장을 찍음

let ids = [];
let capture = null;
let stamps = {};
let dwellTimer = null;
let currentId = null;

function loadStamps() {
  try {
    stamps = JSON.parse(localStorage.getItem(PASS_KEY) || "{}") || {};
  } catch {
    stamps = {};
  }
}

function saveStamps() {
  try {
    localStorage.setItem(PASS_KEY, JSON.stringify(stamps));
  } catch {}
}

const sceneLabel = (id) => document.querySelector(`[data-scene="${id}"]`)?.getAttribute("aria-label") || id;
const sceneIcon = (id) => document.querySelector(`[data-scene="${id}"] svg`)?.outerHTML || "";
const today = () => new Date().toISOString().slice(0, 10).replaceAll("-", ".");

// ── 입국 도장 ─────────────────────────────────────────────────

function stamp(id) {
  if (!id || stamps[id]) return;
  stamps[id] = today();
  saveStamps();
  const count = Object.keys(stamps).length;
  updateBadge();
  const done = count === ids.length;
  toast(
    done
      ? `🎉 스노우볼 여권 완성! ${ids.length}개 나라 입국 도장을 모두 모았어요`
      : `입국 도장 쾅! ${sceneLabel(id).split("·")[0].trim()} (${count}/${ids.length})`,
    id,
  );
  if (passport && !passport.hidden) renderPassport();
}

export function stampVisit(id) {
  currentId = id;
  clearTimeout(dwellTimer);
  dwellTimer = setTimeout(() => currentId === id && stamp(id), DWELL_MS);
}

let toastEl = null;
let toastTimer = null;
function toast(text, id) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "stamp-toast";
    toastEl.setAttribute("role", "status");
    document.body.append(toastEl);
  }
  toastEl.innerHTML = `<span class="stamp-toast-icon">${sceneIcon(id)}</span><span></span>`;
  toastEl.lastChild.textContent = text;
  toastEl.classList.remove("show");
  void toastEl.offsetWidth;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2800);
}

function updateBadge() {
  const badge = document.querySelector(".passport-count");
  if (badge) badge.textContent = `${Object.keys(stamps).length}/${ids.length}`;
}

let passport = null;
function renderPassport() {
  const count = Object.keys(stamps).length;
  const grid = passport.querySelector(".passport-grid");
  grid.innerHTML = "";
  ids.forEach((id, i) => {
    const info = sceneInfo(id);
    const cell = document.createElement("div");
    const got = Boolean(stamps[id]);
    cell.className = `passport-stamp${got ? " got" : ""}`;
    cell.style.setProperty("--stamp", info.color || "#cfd8ea");
    cell.style.setProperty("--tilt", `${((i * 37) % 17) - 8}deg`);
    cell.innerHTML = `<span class="stamp-ring">${sceneIcon(id)}</span><span class="stamp-name"></span><span class="stamp-date"></span>`;
    cell.querySelector(".stamp-name").textContent = info.city || id;
    cell.querySelector(".stamp-date").textContent = got ? stamps[id] : "미방문";
    grid.append(cell);
  });
  passport.querySelector(".passport-progress").textContent =
    count === ids.length ? `${count}/${ids.length} · 모든 나라에 다녀왔어요!` : `${count}/${ids.length} 도장`;
  passport.querySelector(".passport-bar span").style.width = `${(count / ids.length) * 100}%`;
}

function openPassport() {
  if (!passport) {
    passport = document.createElement("div");
    passport.className = "help keep-modal";
    passport.hidden = true;
    passport.setAttribute("role", "dialog");
    passport.setAttribute("aria-modal", "true");
    passport.setAttribute("aria-label", "스노우볼 여권");
    passport.innerHTML = `
      <div class="help-card passport-card">
        <p class="passport-kicker">SNOWBALL PASSPORT</p>
        <p class="help-title">스노우볼 여권</p>
        <p class="passport-sub">나라를 둘러보면 입국 도장이 찍혀요. 10개를 모두 모아 보세요.</p>
        <div class="passport-bar"><span></span></div>
        <p class="passport-progress"></p>
        <div class="passport-grid"></div>
        <div class="help-actions"><button type="button" class="help-close">닫기</button></div>
      </div>`;
    document.body.append(passport);
    const close = () => (passport.hidden = true);
    passport.querySelector(".help-close").addEventListener("click", close);
    passport.addEventListener("click", (e) => e.target === passport && close());
    passport.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      e.stopPropagation();
    });
  }
  renderPassport();
  passport.hidden = false;
  passport.querySelector(".help-close").focus();
}

// ── 엽서 ─────────────────────────────────────────────────────

let postcard = null;
let lastBlob = null;

async function composePostcard(text) {
  const { snap, id } = await capture(text.trim());
  const info = sceneInfo(id);
  const W = 1080;
  const H = 1920;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#141418");
  bg.addColorStop(1, "#0a0a0c");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H * 0.48, W * 0.7);
  glow.addColorStop(0, `${info.color || "#ffffff"}55`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  // 테두리와 머리글
  g.strokeStyle = "rgba(236,235,232,0.25)";
  g.lineWidth = 2;
  g.strokeRect(48, 48, W - 96, H - 96);
  g.fillStyle = "#ecebe8";
  g.font = "700 30px Pretendard, sans-serif";
  g.textBaseline = "top";
  g.fillText("❄  SNOWBALL", 96, 96);
  g.textAlign = "right";
  g.fillStyle = "rgba(236,235,232,0.55)";
  g.font = "500 26px Pretendard, sans-serif";
  g.fillText(today(), W - 96, 100);

  // 배경 필기체 지명
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.font = "200px 'Pinyon Script', cursive";
  g.fillStyle = "rgba(236,235,232,0.12)";
  g.fillText(info.word || "", W / 2, 420);

  // 스노우볼 장면
  const sw = 860;
  const sh = (sw * snap.height) / snap.width;
  g.drawImage(snap, (W - sw) / 2, 300, sw, sh);

  // 아래 글
  const by = 300 + sh + 40;
  g.fillStyle = "#ecebe8";
  g.font = "500 40px 'Playfair Display', Georgia, serif";
  g.fillText("Greetings from", W / 2, by);
  const title = info.title || info.city || "";
  let size = 84;
  g.font = `600 ${size}px 'Playfair Display', Georgia, serif`;
  while (g.measureText(title).width > W - 220 && size > 40) {
    size -= 4;
    g.font = `600 ${size}px 'Playfair Display', Georgia, serif`;
  }
  g.fillText(title, W / 2, by + 96);
  g.fillStyle = info.color || "#ffd27a";
  g.font = "italic 38px 'Playfair Display', Georgia, serif";
  g.fillText(info.tagline || "", W / 2, by + 156);
  g.fillStyle = "rgba(236,235,232,0.55)";
  g.font = "500 26px Pretendard, sans-serif";
  g.fillText(info.coord || "", W / 2, by + 210);

  // 우표 자리: 모은 도장 수
  const count = Object.keys(stamps).length;
  g.save();
  g.translate(W - 190, 250);
  g.rotate(-0.12);
  g.strokeStyle = info.color || "#ffd27a";
  g.lineWidth = 5;
  g.setLineDash([10, 8]);
  g.beginPath();
  g.arc(0, 0, 88, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = info.color || "#ffd27a";
  g.font = "700 24px Pretendard, sans-serif";
  g.fillText("PASSPORT", 0, -14);
  g.font = "700 46px Pretendard, sans-serif";
  g.fillText(`${count}/${ids.length}`, 0, 38);
  g.restore();

  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

function openPostcard() {
  if (!postcard) {
    postcard = document.createElement("div");
    postcard.className = "help keep-modal";
    postcard.hidden = true;
    postcard.setAttribute("role", "dialog");
    postcard.setAttribute("aria-modal", "true");
    postcard.setAttribute("aria-label", "랜선 여행 엽서");
    postcard.innerHTML = `
      <div class="help-card postcard-card">
        <p class="passport-kicker">POSTCARD</p>
        <p class="help-title">랜선 여행 엽서</p>
        <p class="passport-sub">받침대 명판에 새길 이름이나 짧은 문구를 적어 주세요. 비워 두면 랜드마크 이름이 들어가요.</p>
        <label class="postcard-field">
          <span>명판 문구</span>
          <input type="text" maxlength="20" placeholder="예: 지은의 첫 겨울" />
        </label>
        <div class="postcard-preview"></div>
        <div class="help-actions">
          <button type="button" class="help-replay postcard-make">미리 보기</button>
          <button type="button" class="help-replay postcard-share" hidden>공유</button>
          <button type="button" class="help-close postcard-save" disabled>저장</button>
        </div>
      </div>`;
    document.body.append(postcard);
    const input = postcard.querySelector("input");
    const preview = postcard.querySelector(".postcard-preview");
    const save = postcard.querySelector(".postcard-save");
    const share = postcard.querySelector(".postcard-share");
    const make = async () => {
      save.disabled = true;
      preview.textContent = "엽서를 만드는 중…";
      lastBlob = await composePostcard(input.value);
      const url = URL.createObjectURL(lastBlob);
      preview.innerHTML = "";
      const img = document.createElement("img");
      img.src = url;
      img.alt = "만든 엽서 미리 보기";
      preview.append(img);
      save.disabled = false;
      const file = new File([lastBlob], "snowball-postcard.png", { type: "image/png" });
      share.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
    };
    postcard.querySelector(".postcard-make").addEventListener("click", make);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") make();
      e.stopPropagation();
    });
    save.addEventListener("click", () => {
      if (!lastBlob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(lastBlob);
      a.download = `snowball-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    });
    share.addEventListener("click", () => {
      if (!lastBlob) return;
      const file = new File([lastBlob], "snowball-postcard.png", { type: "image/png" });
      navigator.share({ files: [file], title: "Snowball 엽서" }).catch(() => {});
    });
    const close = () => (postcard.hidden = true);
    postcard.addEventListener("click", (e) => e.target === postcard && close());
    postcard.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      e.stopPropagation();
    });
  }
  postcard.hidden = false;
  postcard.querySelector("input").focus();
}

export function setupKeepsakes(opts) {
  ids = opts.ids;
  capture = opts.capture;
  loadStamps();
  updateBadge();
  document.querySelector(".passport-toggle")?.addEventListener("click", openPassport);
  document.querySelector(".postcard-toggle")?.addEventListener("click", openPostcard);
  // 직접 터뜨리거나 흔들어 보면 바로 도장
  window.addEventListener("snowball:pop", () => stamp(currentId));
}
