// 편지 링크: 스노우볼과 짧은 편지를 링크 하나에 담아 보냄.
// 서버 없이 편지 내용을 주소의 letter= 뒤에 담음 (UTF-8 → base64url).
// 받는 사람이 링크를 열면 봉투가 먼저 나오고, 열면 편지 → 보낸 사람이 고른 스노우볼(명판 문구 포함)

import { sceneInfo } from "./editorial.mjs";
import { PLACES } from "./picker.mjs";

// 편지 문장에 쓰는 한국어 랜드마크 이름 (예: 에펠탑)
const placeName = (id) => PLACES[id]?.landmark || sceneInfo(id).city || "";

const MAX_MESSAGE = 200;

function encode(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decode(code) {
  try {
    const bin = atob(code.replaceAll("-", "+").replaceAll("_", "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== "object") return null;
    const clip = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
    return { to: clip(data.t, 20), from: clip(data.f, 20), message: clip(data.m, MAX_MESSAGE), plate: clip(data.p, 20) };
  } catch {
    return null;
  }
}

// 주소에 담긴 편지 (없으면 null)
export function readLetter() {
  const code = new URLSearchParams(location.search).get("letter");
  return code ? decode(code) : null;
}

let opts = null;
export function setupLetters(options) {
  opts = options;
  document.querySelector(".letter-toggle")?.addEventListener("click", () => openWriter());
}

// ── 편지 쓰기 ────────────────────────────────────────────────

let writer = null;
function openWriter(prefill = {}) {
  if (!writer) {
    writer = document.createElement("div");
    writer.className = "help keep-modal";
    writer.hidden = true;
    writer.setAttribute("role", "dialog");
    writer.setAttribute("aria-modal", "true");
    writer.setAttribute("aria-label", "스노우볼 편지 쓰기");
    writer.innerHTML = `
      <div class="help-card postcard-card letter-card">
        <p class="postcard-kicker">LETTER</p>
        <p class="help-title">스노우볼 편지</p>
        <p class="postcard-sub letter-where"></p>
        <label class="postcard-field"><span>받는 사람</span><input name="to" type="text" maxlength="20" placeholder="예: 지은" /></label>
        <label class="postcard-field"><span>편지</span><textarea name="message" rows="5" maxlength="${MAX_MESSAGE}" placeholder="스노우볼과 함께 보낼 말을 적어 주세요"></textarea><small class="letter-count"></small></label>
        <label class="postcard-field"><span>보내는 사람</span><input name="from" type="text" maxlength="20" placeholder="예: 민지" /></label>
        <label class="postcard-field"><span>명판 문구 <em>(비우면 랜드마크 이름)</em></span><input name="plate" type="text" maxlength="20" placeholder="예: 우리의 첫 여행" /></label>
        <p class="letter-done" hidden></p>
        <div class="help-actions">
          <button type="button" class="help-replay letter-cancel">닫기</button>
          <button type="button" class="help-close letter-send">편지 보내기</button>
        </div>
      </div>`;
    document.body.append(writer);
    const field = (name) => writer.querySelector(`[name="${name}"]`);
    const count = writer.querySelector(".letter-count");
    const showCount = () => (count.textContent = `${field("message").value.length} / ${MAX_MESSAGE}`);
    field("message").addEventListener("input", showCount);
    const close = () => (writer.hidden = true);
    writer.querySelector(".letter-cancel").addEventListener("click", close);
    writer.addEventListener("click", (e) => e.target === writer && close());
    writer.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      e.stopPropagation();
    });
    writer.querySelector(".letter-send").addEventListener("click", async () => {
      const data = { t: field("to").value.trim(), m: field("message").value.trim(), f: field("from").value.trim(), p: field("plate").value.trim() };
      if (!data.m) {
        field("message").focus();
        return;
      }
      const id = opts.currentId();
      const url = `${location.origin}${location.pathname}?landmark=${opts.slugOf(id)}&letter=${encode(data)}`;
      const text = `${data.f ? `${data.f}님이 ` : ""}${placeName(id)} 스노우볼 편지를 보냈어요 ✉️`;
      const done = writer.querySelector(".letter-done");
      if (navigator.share) {
        try {
          await navigator.share({ title: "스노우볼 편지가 도착했어요", text, url });
          done.textContent = "편지를 보냈어요.";
          done.hidden = false;
          return;
        } catch (e) {
          if (e.name === "AbortError") return;
        }
      }
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        done.textContent = "편지 링크를 복사했어요. 인스타그램 DM이나 카톡에 붙여 넣어 보내 주세요.";
      } catch {
        done.textContent = url;
      }
      done.hidden = false;
    });
  }
  writer.querySelector(".letter-where").textContent = `지금 고른 ${placeName(opts.currentId())} 스노우볼에 편지를 담아 보내요. 받는 사람이 링크를 열면 봉투부터 열려요.`;
  for (const [name, value] of Object.entries(prefill)) writer.querySelector(`[name="${name}"]`).value = value;
  writer.querySelector(".letter-count").textContent = `${writer.querySelector('[name="message"]').value.length} / ${MAX_MESSAGE}`;
  writer.querySelector(".letter-done").hidden = true;
  writer.hidden = false;
  writer.querySelector(prefill.to ? '[name="message"]' : '[name="to"]').focus();
}

// ── 받은 편지: 봉투 → 편지 → 스노우볼 ─────────────────────────

export function showLetter(letter, id, onDone) {
  const info = sceneInfo(id);
  const color = info.color || "#e8b45a";
  const el = document.createElement("div");
  el.className = "letter-view";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "도착한 스노우볼 편지");
  el.style.setProperty("--seal", color);
  el.innerHTML = `
    <p class="letter-arrive"></p>
    <button type="button" class="envelope" aria-label="봉투 열기">
      <span class="envelope-back"></span>
      <span class="letter-paper"></span>
      <span class="envelope-front"><span class="envelope-addr"></span></span>
      <span class="envelope-flap"></span>
      <span class="envelope-seal">❄</span>
    </button>
    <div class="letter-sheet" hidden>
      <p class="paper-to"></p>
      <p class="paper-message"></p>
      <p class="paper-from"></p>
    </div>
    <p class="letter-hint">봉투를 눌러 열어 보세요</p>
    <div class="letter-actions" hidden>
      <button type="button" class="letter-go">스노우볼 흔들어 보기</button>
      <button type="button" class="letter-reply">답장 쓰기</button>
    </div>`;
  el.querySelector(".letter-arrive").textContent = `${letter.from ? `${letter.from}님이 보낸 ` : ""}${placeName(id)} 스노우볼 편지`;
  el.querySelector(".envelope-addr").textContent = letter.to ? `To. ${letter.to}` : "To. you";
  el.querySelector(".paper-to").textContent = letter.to ? `${letter.to}에게` : "";
  el.querySelector(".paper-message").textContent = letter.message;
  el.querySelector(".paper-from").textContent = letter.from ? `— ${letter.from}` : "";
  document.body.append(el);
  document.body.classList.add("letter-open");
  const envelope = el.querySelector(".envelope");
  const open = () => {
    if (el.classList.contains("opened")) return;
    el.classList.add("opened");
    envelope.setAttribute("aria-label", "편지");
    el.querySelector(".letter-hint").hidden = true;
    // 봉투 뚜껑이 열리고 종이가 올라온 뒤 편지지를 펼침
    setTimeout(() => {
      el.querySelector(".letter-sheet").hidden = false;
      el.querySelector(".letter-actions").hidden = false;
      el.classList.add("unfolded");
    }, 900);
    navigator.vibrate?.(12);
  };
  envelope.addEventListener("click", open);
  const finish = () => {
    el.remove();
    document.body.classList.remove("letter-open");
    onDone?.();
  };
  el.querySelector(".letter-go").addEventListener("click", finish);
  el.querySelector(".letter-reply").addEventListener("click", () => {
    finish();
    openWriter({ to: letter.from || "" });
  });
  envelope.focus();
}
