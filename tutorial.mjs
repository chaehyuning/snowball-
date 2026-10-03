// 처음 방문할 때만 나오는 단계별 튜토리얼과, ? 버튼으로 여는 도움말 창

const DONE_KEY = "snowball-tutorial-done";

// 각 단계: 비출 대상, 말풍선 문구, 사용자가 실제로 해 보면 넘어가는 이벤트
const STEPS = [
  {
    target: "#globe",
    title: "스노우볼을 눌러 보세요",
    text: "한 번 누르면 입자가 흩날려요.",
    waitFor: "snowball:pop",
  },
  {
    target: "#globe",
    title: "이번엔 꾸욱 눌렀다 떼 보세요",
    text: "오래 누를수록 세게 튕겨 나가요.",
    waitFor: "snowball:pop",
    // 충분히 오래 눌러서 세게 터졌을 때만 다음 단계로
    accept: (e) => (e.detail?.power ?? 0) >= 0.85,
  },
  {
    target: ".scenes",
    title: "여기서 나라를 골라요",
    text: "기호를 누르면 바로, 지구본을 누르면 돌려 가며 고를 수 있어요.",
  },
  {
    target: ".help-toggle",
    title: "설명은 언제든 여기서",
    text: "?를 누르면 조작법을 다시 볼 수 있어요.",
  },
];

let ui = null;
let index = 0;
let cleanup = null;

export function tutorialDone() {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}

function markDone() {
  try {
    localStorage.setItem(DONE_KEY, "1");
  } catch {}
}

function build() {
  const spot = document.createElement("div");
  spot.className = "tour-spot";
  const bubble = document.createElement("div");
  bubble.className = "tour-bubble";
  bubble.setAttribute("role", "dialog");
  bubble.setAttribute("aria-live", "polite");
  bubble.innerHTML = `
    <p class="tour-step"></p>
    <p class="tour-title"></p>
    <p class="tour-text"></p>
    <div class="tour-actions">
      <button type="button" class="tour-skip">건너뛰기</button>
      <button type="button" class="tour-next">다음</button>
    </div>
  `;
  document.body.append(spot, bubble);
  bubble.querySelector(".tour-skip").addEventListener("click", finish);
  bubble.querySelector(".tour-next").addEventListener("click", next);
  window.addEventListener("resize", place);
  return {
    spot,
    bubble,
    step: bubble.querySelector(".tour-step"),
    title: bubble.querySelector(".tour-title"),
    text: bubble.querySelector(".tour-text"),
    next: bubble.querySelector(".tour-next"),
  };
}

export function startTutorial() {
  if (!ui) ui = build();
  index = 0;
  ui.spot.hidden = false;
  ui.bubble.hidden = false;
  show();
}

function show() {
  cleanup?.();
  cleanup = null;
  const s = STEPS[index];
  ui.step.textContent = `${index + 1} / ${STEPS.length}`;
  ui.title.textContent = s.title;
  ui.text.textContent = s.text;
  ui.next.textContent = index === STEPS.length - 1 ? "시작하기" : "다음";
  if (s.waitFor) {
    // 직접 해 보면 잠깐 뒤 다음 단계로
    const handler = (e) => {
      if (s.accept && !s.accept(e)) return;
      window.removeEventListener(s.waitFor, handler);
      setTimeout(next, 700);
    };
    window.addEventListener(s.waitFor, handler);
    cleanup = () => window.removeEventListener(s.waitFor, handler);
  }
  place();
}

function next() {
  if (!ui || ui.bubble.hidden) return;
  if (index >= STEPS.length - 1) finish();
  else {
    index++;
    show();
  }
}

function finish() {
  cleanup?.();
  cleanup = null;
  markDone();
  if (!ui) return;
  ui.spot.hidden = true;
  ui.bubble.hidden = true;
}

// 대상 둘레를 밝게 비추고, 말풍선을 대상 옆이나 아래 빈 곳에 둠
function place() {
  if (!ui || ui.bubble.hidden) return;
  const target = document.querySelector(STEPS[index].target);
  if (!target) return;
  const r = target.getBoundingClientRect();
  const pad = 8;
  Object.assign(ui.spot.style, {
    left: `${r.left - pad}px`,
    top: `${r.top - pad}px`,
    width: `${r.width + pad * 2}px`,
    height: `${r.height + pad * 2}px`,
  });
  const b = ui.bubble.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let x;
  let y;
  if (r.left - b.width - 16 > 8) {
    // 대상 왼쪽에 자리가 있으면 왼쪽
    x = r.left - b.width - 16;
    y = r.top + r.height / 2 - b.height / 2;
  } else if (r.bottom + 12 + b.height < vh - 8) {
    // 대상 아래에 자리가 있으면 아래
    x = r.left + r.width / 2 - b.width / 2;
    y = r.bottom + 12;
  } else {
    // 아니면 화면 아래쪽 가운데 (대상 아래쪽을 조금 가림)
    x = (vw - b.width) / 2;
    y = vh - b.height - 16;
  }
  x = Math.max(12, Math.min(vw - b.width - 12, x));
  y = Math.max(12, Math.min(vh - b.height - 12, y));
  ui.bubble.style.left = `${x}px`;
  ui.bubble.style.top = `${y}px`;
}

// ── 도움말 창 ───────────────────────────────────────────────

let help = null;

export function openHelp() {
  if (!help) {
    help = document.createElement("div");
    help.className = "help";
    help.hidden = true;
    help.setAttribute("role", "dialog");
    help.setAttribute("aria-modal", "true");
    help.setAttribute("aria-label", "조작법");
    help.innerHTML = `
      <div class="help-card">
        <p class="help-title">이렇게 즐겨요</p>
        <dl class="help-list">
          <dt>누르기</dt><dd>입자가 솟아올라 흩날려요.</dd>
          <dt>꾸욱 눌렀다 떼기</dt><dd>오래 누를수록 세게 튕겨 나가요.</dd>
          <dt>위아래로 끌기</dt><dd>스노우볼을 흔들어 가라앉은 입자를 띄워요.</dd>
          <dt>폰 흔들기</dt><dd>휴대폰을 직접 흔들면 입자가 소용돌이쳐요.</dd>
          <dt>여권</dt><dd>나라를 둘러보면 입국 도장이 찍혀요. 10개를 모아 보세요.</dd>
          <dt>엽서</dt><dd>명판에 문구를 새겨 지금 장면을 이미지로 저장하거나 공유해요.</dd>
          <dt>좌우로 밀기</dt><dd>이전·다음 나라로 넘어가요.</dd>
          <dt>오른쪽 기호</dt><dd>나라를 바로 골라요. 지구본을 누르면 돌려 가며 고르기.</dd>
          <dt>🔊 · ♪</dt><dd>효과음과 배경음악을 따로 켜고 꺼요.</dd>
          <dt>키보드</dt><dd>← → 나라 바꾸기, Space 팡.</dd>
        </dl>
        <div class="help-actions">
          <button type="button" class="help-replay">튜토리얼 다시 보기</button>
          <button type="button" class="help-close">닫기</button>
        </div>
      </div>
    `;
    document.body.append(help);
    const close = () => (help.hidden = true);
    help.querySelector(".help-close").addEventListener("click", close);
    help.querySelector(".help-replay").addEventListener("click", () => {
      close();
      startTutorial();
    });
    help.addEventListener("click", (e) => e.target === help && close());
    help.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      e.stopPropagation();
    });
  }
  help.hidden = false;
  help.querySelector(".help-close").focus();
}
