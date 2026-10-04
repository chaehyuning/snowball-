// 편지 링크: 스노우볼과 짧은 편지를 링크 하나에 담아 보냄.
// 서버 없이 편지 내용을 주소의 letter= 뒤에 담음 (UTF-8 → base64url).
// 받는 사람이 링크를 열면 봉투가 먼저 나오고, 열면 편지 → 보낸 사람이 고른 스노우볼(명판 문구 포함)

import { sceneInfo } from "./editorial.mjs";
import { PLACES } from "./picker.mjs";

// 편지에 쓰는 도시 이름 (예: Paris)과 우표 그림(나라 버튼의 아이콘)
const cityName = (id) => sceneInfo(id).city || PLACES[id]?.landmark || "";
const stampIcon = (id) => document.querySelector(`[data-scene="${id}"] svg`)?.outerHTML || "";
// 소인 날짜: 04 OCT 2026
const postDate = (iso) => {
  const d = iso ? new Date(`${iso}T12:00:00`) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};

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
    return {
      to: clip(data.t, 20),
      from: clip(data.f, 20),
      message: clip(data.m, MAX_MESSAGE),
      plate: clip(data.p, 20),
      date: /^\d{4}-\d{2}-\d{2}$/.test(data.d) ? data.d : "",
    };
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
    writer.setAttribute("aria-label", "Send a snowball letter");
    writer.innerHTML = `
      <div class="help-card postcard-card letter-card">
        <p class="airmail-strip" aria-hidden="true"></p>
        <p class="postcard-kicker">A LETTER FOR YOU</p>
        <p class="help-title">Send a snowball letter</p>
        <p class="postcard-sub letter-where"></p>
        <label class="postcard-field"><span>To</span><input name="to" type="text" maxlength="20" placeholder="Jieun" /></label>
        <label class="postcard-field"><span>Your note</span><textarea name="message" rows="5" maxlength="${MAX_MESSAGE}" placeholder="Write something warm…"></textarea><small class="letter-count"></small></label>
        <label class="postcard-field"><span>From</span><input name="from" type="text" maxlength="20" placeholder="Minji" /></label>
        <label class="postcard-field"><span>Nameplate <em>(optional — engraved on the snowball)</em></span><input name="plate" type="text" maxlength="20" placeholder="Our first trip" /></label>
        <p class="letter-done" hidden></p>
        <div class="help-actions">
          <button type="button" class="help-replay letter-cancel">Close</button>
          <button type="button" class="help-close letter-send">Seal &amp; send ✉</button>
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
      const data = {
        t: field("to").value.trim(),
        m: field("message").value.trim(),
        f: field("from").value.trim(),
        p: field("plate").value.trim(),
        d: new Date().toISOString().slice(0, 10),
      };
      if (!data.m) {
        field("message").focus();
        return;
      }
      const id = opts.currentId();
      const url = `${location.origin}${location.pathname}?landmark=${opts.slugOf(id)}&letter=${encode(data)}`;
      const text = `${data.f || "Someone"} sent you a snowball letter from ${cityName(id)} ✉️`;
      const done = writer.querySelector(".letter-done");
      if (navigator.share) {
        try {
          await navigator.share({ title: "You've got a snowball letter", text, url });
          done.textContent = "Your letter is on its way ✈";
          done.hidden = false;
          return;
        } catch (e) {
          if (e.name === "AbortError") return;
        }
      }
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        done.textContent = "Letter link copied — paste it into an Instagram DM or KakaoTalk.";
      } catch {
        done.textContent = url;
      }
      done.hidden = false;
    });
  }
  writer.querySelector(".letter-where").textContent = `Tuck a note into this ${cityName(opts.currentId())} snowball. They'll peel the wax seal before they read it.`;
  for (const [name, value] of Object.entries(prefill)) writer.querySelector(`[name="${name}"]`).value = value;
  writer.querySelector(".letter-count").textContent = `${writer.querySelector('[name="message"]').value.length} / ${MAX_MESSAGE}`;
  writer.querySelector(".letter-done").hidden = true;
  writer.hidden = false;
  writer.querySelector(prefill.to ? '[name="message"]' : '[name="to"]').focus();
}

// ── 받은 편지: 봉투 → 편지 → 스노우볼 ─────────────────────────

export function showLetter(letter, id, onDone) {
  const info = sceneInfo(id);
  const color = info.color || "#c8343a";
  const city = cityName(id);
  const date = postDate(letter.date);
  const el = document.createElement("div");
  el.className = "letter-view";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "A snowball letter for you");
  el.style.setProperty("--seal", color);
  el.innerHTML = `
    <p class="letter-arrive">A Letter For You!</p>
    <p class="letter-sub"></p>
    <div class="envelope">
      <span class="envelope-back"></span>
      <span class="letter-paper"></span>
      <span class="envelope-front">
        <span class="envelope-addr"></span>
        <span class="stamp"><span class="stamp-art"></span><span class="stamp-label">SNOWBALL POST</span></span>
        <svg class="postmark" viewBox="0 0 120 70" aria-hidden="true">
          <circle cx="40" cy="35" r="26" fill="none" stroke="currentColor" stroke-width="2" />
          <circle cx="40" cy="35" r="20" fill="none" stroke="currentColor" stroke-width="1" />
          <text x="40" y="32" text-anchor="middle" class="pm-city"></text>
          <text x="40" y="44" text-anchor="middle" class="pm-date"></text>
          <path d="M70 22q6-4 12 0t12 0t12 0t12 0M70 35q6-4 12 0t12 0t12 0t12 0M70 48q6-4 12 0t12 0t12 0t12 0" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      </span>
      <span class="envelope-flap-shadow"></span>
      <span class="envelope-flap"></span>
      <button type="button" class="wax-seal" aria-label="Peel the wax seal to open"><span>❄</span></button>
    </div>
    <p class="letter-hint">(peel the wax seal to open)</p>
    <div class="letter-sheet" hidden>
      <p class="sheet-date"></p>
      <p class="paper-to"></p>
      <p class="paper-message"></p>
      <p class="paper-from"></p>
    </div>
    <div class="letter-actions" hidden>
      <button type="button" class="letter-go">Shake the snowball ❄</button>
      <button type="button" class="letter-reply">Write back ✉</button>
    </div>`;
  const $ = (sel) => el.querySelector(sel);
  $(".letter-sub").textContent = `from ${letter.from || "a friend"} · a snowball from ${city}`;
  $(".envelope-addr").textContent = `To. ${letter.to || "you"}`;
  $(".stamp-art").innerHTML = stampIcon(id);
  $(".pm-city").textContent = city.toUpperCase().slice(0, 12);
  $(".pm-date").textContent = date;
  $(".sheet-date").textContent = `${date} · ${city}`;
  $(".paper-to").textContent = `Dear ${letter.to || "you"},`;
  $(".paper-message").textContent = letter.message;
  $(".paper-from").textContent = letter.from ? `With love, ${letter.from}` : "With love";
  document.body.append(el);
  document.body.classList.add("letter-open");

  // 밀랍 도장 떼기: 손가락으로 끌면 도장이 들리며 따라오고, 충분히 끌거나 톡 누르면 떨어져 나가며 봉투가 열림
  const seal = $(".wax-seal");
  let start = null;
  let peeled = false;
  const peel = () => {
    if (peeled) return;
    peeled = true;
    seal.style.transform = "";
    seal.classList.add("peeled");
    navigator.vibrate?.([14, 30, 8]);
    setTimeout(open, 380);
  };
  seal.addEventListener("pointerdown", (e) => {
    if (peeled) return;
    start = { x: e.clientX, y: e.clientY };
    seal.setPointerCapture(e.pointerId);
    seal.classList.add("lifting");
  });
  seal.addEventListener("pointermove", (e) => {
    if (!start || peeled) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const d = Math.hypot(dx, dy);
    seal.style.transform = `translate(calc(-50% + ${dx * 0.6}px), calc(-50% + ${dy * 0.6}px)) rotate(${dx * 0.4}deg) scale(${1 + Math.min(d, 60) / 300})`;
    if (d > 70) peel();
  });
  const release = () => {
    if (!start || peeled) return;
    start = null;
    peel(); // 짧게 누르기만 해도 떼어짐
  };
  seal.addEventListener("pointerup", release);
  seal.addEventListener("pointercancel", () => {
    start = null;
    seal.classList.remove("lifting");
    seal.style.transform = "";
  });
  // 봉투 다른 곳을 눌러도 도장부터 떼어짐
  $(".envelope").addEventListener("click", (e) => e.target !== seal && !seal.contains(e.target) && peel());

  const open = () => {
    el.classList.add("opened");
    $(".letter-hint").hidden = true;
    // 봉투 뚜껑이 열리고 종이가 올라온 뒤 편지지를 펼침
    setTimeout(() => {
      $(".letter-sheet").hidden = false;
      $(".letter-actions").hidden = false;
      el.classList.add("unfolded");
    }, 900);
  };
  const finish = () => {
    el.remove();
    document.body.classList.remove("letter-open");
    onDone?.();
  };
  $(".letter-go").addEventListener("click", finish);
  $(".letter-reply").addEventListener("click", () => {
    finish();
    openWriter({ to: letter.from || "" });
  });
}
