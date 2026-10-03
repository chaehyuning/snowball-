// 랜선 여행 기념품: 엽서 저장
import { sceneInfo } from "./editorial.mjs";

let capture = null;

const today = () => new Date().toISOString().slice(0, 10).replaceAll("-", ".");

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
        <p class="postcard-kicker">POSTCARD</p>
        <p class="help-title">랜선 여행 엽서</p>
        <p class="postcard-sub">받침대 명판에 새길 이름이나 짧은 문구를 적어 주세요. 비워 두면 랜드마크 이름이 들어가요.</p>
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
  resetPostcard();
  postcard.hidden = false;
  postcard.querySelector("input").focus();
}

// 엽서 창을 열 때마다, 그리고 나라를 바꿀 때마다 전에 만든 미리 보기를 지움 → 늘 지금 나라로 새로 만듦
function resetPostcard() {
  if (!postcard) return;
  lastBlob = null;
  postcard.querySelector(".postcard-preview").innerHTML = "";
  postcard.querySelector(".postcard-save").disabled = true;
  postcard.querySelector(".postcard-share").hidden = true;
}

export function setupKeepsakes(opts) {
  capture = opts.capture;
  document.querySelector(".postcard-toggle")?.addEventListener("click", openPostcard);
  window.addEventListener("snowball:scene", resetPostcard);
}
