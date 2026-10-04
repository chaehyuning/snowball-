// 랜선 여행 기념품: 엽서 저장
import { sceneInfo } from "./editorial.mjs";

let capture = null;


// ── 엽서 ─────────────────────────────────────────────────────

let postcard = null;
let lastBlob = null;

// 엽서는 인스타 스토리 크기(1080×1920). 스토리는 위 약 250px(프로필)과 아래 약 340px(답장 칸·링크 스티커)이
// 가려지므로, 읽어야 할 것은 모두 그 사이(SAFE_TOP ~ SAFE_BOTTOM)에 둠
const CW = 1080;
const CH = 1920;
const SAFE_TOP = 250;
const SAFE_BOTTOM = 1580;

// 엽서 한 장을 그림
function drawCard(g, snap, info, { from }) {
  const W = CW;
  const H = CH;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#141418");
  bg.addColorStop(1, "#0a0a0c");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, 820, 0, W / 2, 820, W * 0.7);
  glow.addColorStop(0, `${info.color || "#ffffff"}55`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(236,235,232,0.22)";
  g.lineWidth = 2;
  g.strokeRect(48, 48, W - 96, H - 96);

  // 머리글: 스토리 위쪽 가림 영역 바로 아래
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  g.fillStyle = "#ecebe8";
  g.font = "700 30px Pretendard, sans-serif";
  g.fillText("❄  SNOWBALL", 110, SAFE_TOP + 40);
  g.textAlign = "right";
  g.fillStyle = "rgba(236,235,232,0.55)";
  g.font = "500 24px Pretendard, sans-serif";
  g.fillText(info.coord || "", W - 110, SAFE_TOP + 38);

  // 배경 필기체 지명
  g.textAlign = "center";
  g.font = "180px 'Pinyon Script', cursive";
  g.fillStyle = "rgba(236,235,232,0.12)";
  g.fillText(info.word || "", W / 2, 500);

  // 스노우볼
  const sw = 640;
  const sh = (sw * snap.height) / snap.width;
  const sy = 320;
  g.drawImage(snap, (W - sw) / 2, sy, sw, sh);


  // 아래 글
  const by = sy + sh + 56;
  g.textAlign = "center";
  g.fillStyle = "#ecebe8";
  g.font = "500 38px 'Playfair Display', Georgia, serif";
  g.fillText("Greetings from", W / 2, by);
  const title = info.title || info.city || "";
  let size = 80;
  g.font = `600 ${size}px 'Playfair Display', Georgia, serif`;
  while (g.measureText(title).width > W - 220 && size > 40) {
    size -= 4;
    g.font = `600 ${size}px 'Playfair Display', Georgia, serif`;
  }
  g.fillText(title, W / 2, by + 84);
  g.fillStyle = info.color || "#ffd27a";
  g.font = "italic 34px 'Playfair Display', Georgia, serif";
  g.fillText(info.tagline || "", W / 2, by + 136);
  // 보내는 사람 서명
  if (from) {
    g.textAlign = "center";
    g.fillStyle = "#ecebe8";
    g.font = "60px 'Pinyon Script', 'Playfair Display', cursive";
    g.fillText(`from ${from}`, W / 2, Math.min(SAFE_BOTTOM - 6, by + 214));
  }

  // 스토리 아래 가림 영역: 링크 안내 (링크 스티커를 붙일 자리)
  g.textAlign = "center";
  g.fillStyle = "rgba(236,235,232,0.45)";
  g.font = "500 26px Pretendard, sans-serif";
  g.fillText(`shake it yourself → ${location.host}`, W / 2, SAFE_BOTTOM + 110);
}

async function composePostcard(text, from) {
  const { snap, id } = await capture(text.trim());
  const info = sceneInfo(id);
  const c = document.createElement("canvas");
  c.width = CW;
  c.height = CH;
  drawCard(c.getContext("2d"), snap, info, { from: from.trim() });
  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

const extOf = () => "png";

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
        <p class="postcard-sub">인스타 스토리 크기로 만들어요. 명판 문구와 서명을 적어 보세요.</p>
        <label class="postcard-field">
          <span>명판 문구</span>
          <input name="plate" type="text" maxlength="20" placeholder="예: 지은의 첫 겨울" />
        </label>
        <label class="postcard-field">
          <span>서명</span>
          <input name="from" type="text" maxlength="16" placeholder="예: 채현" />
        </label>
        <div class="postcard-preview"></div>
        <div class="help-actions">
          <button type="button" class="help-replay postcard-make">미리 보기</button>
          <button type="button" class="help-replay postcard-share">공유</button>
          <button type="button" class="help-close postcard-save" disabled>저장</button>
        </div>
      </div>`;
    document.body.append(postcard);
    const plate = postcard.querySelector('[name="plate"]');
    const from = postcard.querySelector('[name="from"]');
    const preview = postcard.querySelector(".postcard-preview");
    const save = postcard.querySelector(".postcard-save");
    const share = postcard.querySelector(".postcard-share");
    const makeBtn = postcard.querySelector(".postcard-make");
    let busy = false;
    const make = async () => {
      if (busy) return;
      busy = true;
      save.disabled = true;
      makeBtn.disabled = true;
      try {
        preview.textContent = "엽서를 만드는 중…";
        lastBlob = await composePostcard(plate.value, from.value);
        const url = URL.createObjectURL(lastBlob);
        preview.innerHTML = "";
        const img = document.createElement("img");
        img.src = url;
        img.alt = "만든 엽서 미리 보기";
        preview.append(img);
        save.disabled = false;
      } finally {
        busy = false;
        makeBtn.disabled = false;
      }
    };
    makeBtn.addEventListener("click", make);
    for (const input of [plate, from]) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") make();
        e.stopPropagation();
      });
    }
    const fileName = () => `snowball-${new Date().toISOString().slice(0, 10)}.${extOf(lastBlob)}`;
    save.addEventListener("click", () => {
      if (!lastBlob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(lastBlob);
      a.download = fileName();
      a.click();
    });
    // 공유: 폰 기본 공유 시트로 엽서(사진·영상)를 바로 보냄(인스타그램 스토리·카카오톡·에어드롭 등).
    // 파일 공유를 못 하는 브라우저는 링크만 공유하고, 공유 시트가 아예 없으면 링크를 복사함
    share.addEventListener("click", async () => {
      if (!lastBlob) await make();
      if (!lastBlob) return;
      const link = location.href;
      const file = new File([lastBlob], fileName(), { type: lastBlob.type });
      const tries = [];
      if (navigator.canShare?.({ files: [file] })) tries.push({ files: [file] });
      if (navigator.share) tries.push({ text: "내 스노우볼 엽서 ❄", url: link });
      for (const data of tries) {
        try {
          await navigator.share(data);
          return;
        } catch (e) {
          if (e.name === "AbortError") return; // 사용자가 닫음
        }
      }
      try {
        await navigator.clipboard.writeText(link);
        share.textContent = "링크 복사됨";
        setTimeout(() => (share.textContent = "공유"), 1600);
      } catch {
        window.prompt("이 주소를 복사하세요", link);
      }
    });
    const close = () => !busy && (postcard.hidden = true);
    // 만드는 동안 버튼이 잠기면 포커스가 창 밖으로 빠지므로, Esc는 창 밖에서도 받음
    window.addEventListener("keydown", (e) => e.key === "Escape" && !postcard.hidden && close());
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
}

export function setupKeepsakes(opts) {
  capture = opts.capture;
  document.querySelector(".postcard-toggle")?.addEventListener("click", openPostcard);
  window.addEventListener("snowball:scene", resetPostcard);
}
