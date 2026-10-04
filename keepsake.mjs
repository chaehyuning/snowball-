// 랜선 여행 기념품: 엽서 저장
import { sceneInfo } from "./editorial.mjs";

let capture = null;


// ── 엽서 ─────────────────────────────────────────────────────

let postcard = null;
let lastBlob = null;
let shake = null;

// 엽서는 인스타 스토리 크기(1080×1920). 스토리는 위 약 250px(프로필)과 아래 약 340px(답장 칸·링크 스티커)이
// 가려지므로, 읽어야 할 것은 모두 그 사이(SAFE_TOP ~ SAFE_BOTTOM)에 둠
const CW = 1080;
const CH = 1920;
const SAFE_TOP = 250;
const SAFE_BOTTOM = 1580;

// 소인: 둥근 도장(도시·날짜)과 물결 줄
function drawPostmark(g, x, y, info) {
  g.save();
  g.translate(x, y);
  g.rotate(-0.18);
  g.strokeStyle = "rgba(236,235,232,0.6)";
  g.fillStyle = "rgba(236,235,232,0.7)";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 0, 66, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(0, 0, 54, 0, Math.PI * 2);
  g.stroke();
  g.textAlign = "center";
  g.font = "700 20px Pretendard, sans-serif";
  g.fillText((info.city || "").toUpperCase().slice(0, 12), 0, -6);
  g.font = "600 16px Pretendard, sans-serif";
  g.fillText(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(), 0, 20);
  g.lineWidth = 3;
  for (const dy of [-26, 0, 26]) {
    g.beginPath();
    for (let k = 0; k <= 40; k++) {
      const px = -200 + k * 3.2;
      const py = dy + Math.sin(k * 0.55) * 5;
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke();
  }
  g.restore();
}

// 엽서 한 장(또는 영상 한 프레임)을 그림
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

  // 소인: 스노우볼 오른쪽 위
  drawPostmark(g, 850, 560, info);

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

// 영상 엽서: 크게 흔들어 입자가 쏟아졌다 가라앉는 4.5초를 그대로 녹화
const VIDEO_MS = 4500;
function pickVideoType() {
  const types = ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return types.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || "";
}
async function recordPostcard(text, from, onProgress) {
  const type = pickVideoType();
  if (!type || !HTMLCanvasElement.prototype.captureStream) throw new Error("no-video");
  const cap = await capture(text.trim(), 2);
  const info = sceneInfo(cap.id);
  const c = document.createElement("canvas");
  c.width = CW;
  c.height = CH;
  const g = c.getContext("2d");
  drawCard(g, cap.snap, info, { from: from.trim() });
  const stream = c.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((resolve) => (rec.onstop = resolve));
  rec.start(250);
  const start = performance.now();
  let shaken = false;
  await new Promise((resolve) => {
    const tick = () => {
      const t = performance.now() - start;
      if (!shaken && t > 350) {
        shaken = true;
        shake?.();
      }
      cap.frame();
      drawCard(g, cap.snap, info, { from: from.trim() });
      onProgress?.(Math.min(1, t / VIDEO_MS));
      if (t < VIDEO_MS) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  await done;
  return new Blob(chunks, { type: type.split(";")[0] });
}

const extOf = (blob) => (blob.type.includes("mp4") ? "mp4" : blob.type.includes("webm") ? "webm" : "png");

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
        <p class="postcard-sub">인스타 스토리 크기로 만들어요. 영상 엽서는 스노우볼을 크게 흔든 4초를 담아요.</p>
        <label class="postcard-field">
          <span>명판 문구</span>
          <input name="plate" type="text" maxlength="20" placeholder="예: 지은의 첫 겨울" />
        </label>
        <label class="postcard-field">
          <span>서명</span>
          <input name="from" type="text" maxlength="16" placeholder="예: 채현" />
        </label>
        <div class="postcard-kind" role="radiogroup" aria-label="엽서 종류">
          <button type="button" data-kind="video" aria-pressed="true">🎞 영상 엽서</button>
          <button type="button" data-kind="photo" aria-pressed="false">🖼 사진 엽서</button>
        </div>
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
    let kind = pickVideoType() ? "video" : "photo";
    const kinds = postcard.querySelectorAll(".postcard-kind button");
    const showKind = () => kinds.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === kind)));
    if (!pickVideoType()) postcard.querySelector('[data-kind="video"]').hidden = true;
    kinds.forEach((b) =>
      b.addEventListener("click", () => {
        kind = b.dataset.kind;
        showKind();
        resetPostcard();
      }),
    );
    showKind();
    let busy = false;
    const make = async () => {
      if (busy) return;
      busy = true;
      save.disabled = true;
      makeBtn.disabled = true;
      try {
        if (kind === "video") {
          // 녹화하는 동안 창을 반투명하게 걷어 스노우볼이 흔들리는 걸 함께 봄
          postcard.classList.add("recording");
          preview.textContent = "영상 엽서를 만드는 중… 0%";
          try {
            lastBlob = await recordPostcard(plate.value, from.value, (k) => (preview.textContent = `영상 엽서를 만드는 중… ${Math.round(k * 100)}%`));
          } catch {
            kind = "photo";
            showKind();
            lastBlob = await composePostcard(plate.value, from.value);
          } finally {
            postcard.classList.remove("recording");
          }
        } else {
          preview.textContent = "엽서를 만드는 중…";
          lastBlob = await composePostcard(plate.value, from.value);
        }
        const url = URL.createObjectURL(lastBlob);
        preview.innerHTML = "";
        if (lastBlob.type.startsWith("video")) {
          const v = document.createElement("video");
          Object.assign(v, { src: url, autoplay: true, loop: true, muted: true, playsInline: true });
          v.setAttribute("playsinline", "");
          preview.append(v);
        } else {
          const img = document.createElement("img");
          img.src = url;
          img.alt = "만든 엽서 미리 보기";
          preview.append(img);
        }
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
  shake = opts.shake;
  document.querySelector(".postcard-toggle")?.addEventListener("click", openPostcard);
  window.addEventListener("snowball:scene", resetPostcard);
}
