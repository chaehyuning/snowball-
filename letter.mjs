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


// 밀랍 도장 SVG: 녹아 퍼진 울퉁불퉁한 가장자리(각도마다 반지름을 조금씩 달리한 매끈한 곡선),
// 눌려 들어간 안쪽 원과 그 둘레의 볼록한 테, 양각으로 찍힌 눈꽃(그늘 획 + 빛 획 + 바탕 획), 윤기
function waxSealSVG() {
  const C = 50;
  const N = 18;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wobble = Math.sin(i * 2.7) * 2.4 + Math.sin(i * 5.3 + 1) * 1.6 + (i % 3 === 0 ? 2.2 : 0);
    const r = 43 + wobble;
    pts.push([C + Math.cos(a) * r, C + Math.sin(a) * r]);
  }
  // 점들을 지나는 매끈한 닫힌 곡선 (캣멀-롬 → 베지어)
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  // 눈꽃 문양: 여섯 갈래와 곁가지
  let flake = "";
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 - Math.PI / 2;
    const x = (r) => (C + Math.cos(a) * r).toFixed(1);
    const y = (r) => (C + Math.sin(a) * r).toFixed(1);
    flake += `M${C} ${C}L${x(19)} ${y(19)}`;
    for (const side of [-1, 1]) {
      const b = a + side * 0.75;
      const bx = C + Math.cos(a) * 11;
      const by = C + Math.sin(a) * 11;
      flake += `M${bx.toFixed(1)} ${by.toFixed(1)}L${(bx + Math.cos(b) * 6).toFixed(1)} ${(by + Math.sin(b) * 6).toFixed(1)}`;
    }
  }
  return `
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <radialGradient id="wax-body" cx="42%" cy="38%" r="65%">
        <stop offset="0" stop-color="#e9cf86" />
        <stop offset="0.45" stop-color="#c9a24e" />
        <stop offset="0.85" stop-color="#9c7530" />
        <stop offset="1" stop-color="#6e5020" />
      </radialGradient>
      <radialGradient id="wax-well" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#c39a48" />
        <stop offset="1" stop-color="#a98235" />
      </radialGradient>
      <linearGradient id="wax-rim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff0c2" stop-opacity="0.9" />
        <stop offset="0.5" stop-color="#d4ae5c" stop-opacity="0.2" />
        <stop offset="1" stop-color="#5e4114" stop-opacity="0.8" />
      </linearGradient>
      <linearGradient id="wax-well-edge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5e4114" stop-opacity="0.75" />
        <stop offset="1" stop-color="#fff0c2" stop-opacity="0.8" />
      </linearGradient>
      <radialGradient id="wax-shine" cx="34%" cy="28%" r="30%">
        <stop offset="0" stop-color="#fffbe8" stop-opacity="0.75" />
        <stop offset="1" stop-color="#fffbe8" stop-opacity="0" />
      </radialGradient>
    </defs>
    <path d="${d}" fill="url(#wax-body)" />
    <path d="${d}" fill="none" stroke="#6e5020" stroke-opacity="0.5" stroke-width="1" />
    <circle cx="${C}" cy="${C}" r="31" fill="none" stroke="url(#wax-rim)" stroke-width="5" />
    <circle cx="${C}" cy="${C}" r="27.5" fill="url(#wax-well)" />
    <circle cx="${C}" cy="${C}" r="27.5" fill="none" stroke="url(#wax-well-edge)" stroke-width="1.6" />
    <circle cx="${C}" cy="${C}" r="23.5" fill="none" stroke="#7a5a22" stroke-opacity="0.35" stroke-width="0.8" stroke-dasharray="1.5 2" />
    <g fill="none" stroke-linecap="round" stroke-width="2.6">
      <path d="${flake}" stroke="#5e4114" stroke-opacity="0.55" transform="translate(0.7 0.9)" />
      <path d="${flake}" stroke="#fff3cc" stroke-opacity="0.85" transform="translate(-0.6 -0.7)" />
      <path d="${flake}" stroke="#c9a24e" />
    </g>
    <path d="${d}" fill="url(#wax-shine)" />
  </svg>`;
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
    <p class="letter-arrive">YOU GOT A MAIL!</p>
    <p class="letter-sub"></p>
    <div class="mail-slot" aria-hidden="true"><span></span></div>
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
      <button type="button" class="wax-seal" aria-label="Peel the wax seal to open">${waxSealSVG()}</button>
    </div>
    <button type="button" class="letter-open-btn">click here to claim your mail</button>
    <p class="letter-hint" hidden>(or peel the wax seal)</p>
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
    setTimeout(open, 180);
  };
  seal.addEventListener("pointerdown", (e) => {
    if (peeled || !delivered) return;
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
    if (!start || peeled || !delivered) return;
    start = null;
    peel(); // 짧게 누르기만 해도 떼어짐
  };
  seal.addEventListener("pointerup", release);
  seal.addEventListener("pointercancel", () => {
    start = null;
    seal.classList.remove("lifting");
    seal.style.transform = "";
  });
  // 처음엔 투입구만 보이고, 버튼을 누르면 봉투가 투입구에서 떨어져 나옴. 그 뒤 버튼은 "열기"가 됨
  const btn = $(".letter-open-btn");
  let delivered = false;
  const deliver = () => {
    if (delivered) return;
    delivered = true;
    el.classList.add("delivered");
    navigator.vibrate?.(10);
    btn.textContent = "tap the envelope to open it";
    $(".envelope").addEventListener("animationend", () => el.classList.add("landed"), { once: true });
    setTimeout(() => ($(".letter-hint").hidden = false), 2400);
  };
  btn.addEventListener("click", () => (delivered ? peel() : deliver()));
  // 봉투 다른 곳을 눌러도 도장부터 떼어짐
  $(".envelope").addEventListener("click", (e) => delivered && e.target !== seal && !seal.contains(e.target) && peel());

  const open = () => {
    el.classList.add("opened");
    $(".letter-hint").hidden = true;
    $(".letter-open-btn").hidden = true;
    // 봉투 뚜껑이 열리고 종이가 올라온 뒤 편지지를 펼침
    setTimeout(() => {
      $(".letter-sheet").hidden = false;
      $(".letter-actions").hidden = false;
      el.classList.add("unfolded");
    }, 480);
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
