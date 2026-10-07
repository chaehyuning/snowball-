import { fuji } from "./scene-fuji.mjs";
import { namsan } from "./scene-namsan.mjs";
import { quebec } from "./scene-quebec.mjs";
import { sydney } from "./scene-sydney.mjs";
import { santa } from "./scene-santa.mjs";
import { forbidden } from "./scene-forbidden.mjs";
import { egypt } from "./scene-egypt.mjs";
import { paris } from "./scene-paris.mjs";
import { istanbul } from "./scene-istanbul.mjs";
import { barcelona } from "./scene-barcelona.mjs";
import { uyuni } from "./scene-uyuni.mjs";
import { hongkong } from "./scene-hongkong.mjs";
import { openPicker } from "./picker.mjs";
import * as sfx from "./sound.mjs";
import { showSceneInfo, fillTicker, setupMetaToggle } from "./editorial.mjs";
import { setupKeepsakes } from "./keepsake.mjs";
import { readLetter, setupLetters, showLetter } from "./letter.mjs";
import { startTutorial, tutorialDone, openHelp } from "./tutorial.mjs";

const SCENES = [fuji, namsan, quebec, sydney, santa, forbidden, egypt, paris, istanbul, barcelona, uyuni, hongkong];

const canvas = document.getElementById("globe");
let ctx = canvas.getContext("2d"); // 엽서를 고해상도로 뜰 때 잠시 다른 캔버스로 바꿔 끼움

const W = 400;
const H = 600;
const PAD = 50; // 위아래로 흔들 공간
// 화면 캔버스는 2배까지만: 고정 그림 층도 2배라 그 이상은 늘려 그리기만 하고 매 프레임 픽셀만 2.25배 늘어남
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = W * dpr;
canvas.height = H * dpr;
ctx.scale(dpr, dpr);

const globe = { x: 200, y: 210, r: 170 };
const mound = { x: 200, y: 360, rx: 190, ry: 50 };
const MAX_OFFSET = 50; // 흔들 수 있는 최대 거리
const PARTICLE_SCALE = 1.5; // 모든 나라의 입자를 이만큼 크게 그림
const FALL_SPEED = 2.2; // 장면 파일의 가라앉는 속도에 곱함. 클수록 빨리 쏟아짐
// 화면에서는 흔들림을 이만큼만 보여줌. 입자가 받는 힘은 그대로라 눈은 똑같이 날림
const VISUAL_SHAKE = 0.35;

// 흔들기 상태 (스노우볼은 손을 스프링처럼 따라감)
let dragging = false;
let startX = 0;
let startY = 0;
let target = 0;
let offset = 0;
let globeVel = 0;
let prevGlobeVel = 0;

// 물이 휘젓는 세기. 흔들면 커지고 시간이 지나면 잦아든다
let stir = 0;

// 끌어서 흔든 세기. 쌓일수록 바닥에 가라앉은 입자가 많이 떠오름
let shakeEnergy = 0;
let lastShakeDir = 0;
let lastShakeSound = 0;

// 누르면 말랑하게 눌리고, 떼면 누른 자리에서 입자가 팡 터지며 젤리처럼 출렁임
const AUTO_SHAKE_MS = 700;
const AUTO_SHAKE_PERIOD = 250; // 한 번 오르내리는 시간
const AUTO_SHAKE_HEIGHT = 60;
const SQUEEZE_MS = 600; // 이만큼 누르고 있으면 가장 세게 눌림
let autoShakeStart = -Infinity;
let autoShakePower = 1;
let pressing = false;
let pressStart = 0;
let pressPoint = { x: 200, y: 300 };
let squash = 0; // 음수면 납작하게 눌림, 양수면 위로 늘어남
let squashVel = 0;
let rings = []; // 누른 자리에서 퍼지는 충격파 고리
let sparks = []; // 터질 때 사방으로 튀는 불꽃 줄기
let flashStart = -Infinity; // 터지는 순간 유리구 안이 번쩍임

function startAutoShake(power = 1) {
  autoShakeStart = performance.now();
  autoShakePower = power;
}

// 누르고 떼면 누른 자리에서 가까운 입자부터 차례로 솟아올라 유리구 위쪽을 덮음.
// 입자마다 서로 다른 목적지를 받아서 줄지어 따라가지 않고 고르게 퍼진다.
const RIPPLE_SPEED = 0.6; // 솟아오르는 물결이 퍼지는 속도 (px/ms)

function randomSkyPoint() {
  for (;;) {
    const x = globe.x + rand(-1, 1) * (globe.r - 18);
    const y = globe.y - globe.r + 18 + Math.random() * (globe.r + 40);
    if (Math.hypot(x - globe.x, y - globe.y) < globe.r - 18 && y < groundAt(x) - 30) return { x, y };
  }
}

function burst(x, y, power) {
  const now = performance.now();
  for (const p of particles) {
    // 이번에 날아갈 입자 수는 누른 세기에 비례 (짧게 톡 치면 일부만)
    if (Math.random() > 0.55 + 0.45 * power) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    p.launchAt = now + d / RIPPLE_SPEED + rand(0, 90);
    p.target = randomSkyPoint();
  }
  stir = Math.min(stir + 3 * power, 5);
  rings.push({ x, y, start: now, power });
}

// 화면 좌표 → 스노우볼 그림 좌표. 유리구 밖을 누르면 유리구 안 가장 가까운 곳으로
function toGlobe(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  let x = ((clientX - rect.left) * W) / rect.width;
  let y = ((clientY - rect.top) * H) / rect.height - PAD - offset * VISUAL_SHAKE;
  const dx = x - globe.x;
  const dy = y - globe.y;
  const d = Math.hypot(dx, dy);
  const max = globe.r - 20;
  if (d > max) {
    x = globe.x + (dx / d) * max;
    y = globe.y + (dy / d) * max;
  }
  return { x, y };
}

// 손끝 햅틱: 입자가 팍 흩어지거나 흔들 때 폰이 짧게 "통" 울림 (진동을 지원하는 폰만, 너무 잦지 않게)
let lastBuzz = 0;
function buzz(pattern) {
  if (!navigator.vibrate) return;
  const now = performance.now();
  if (now - lastBuzz < 70) return;
  lastBuzz = now;
  try {
    navigator.vibrate(pattern);
  } catch {}
}

function pop(power) {
  burst(pressPoint.x, pressPoint.y, power);
  // 세게 터뜨리면 "통-톡" 두 번, 살짝 탭하면 짧게 한 번
  buzz(power > 0.8 ? [20, 40, 12] : Math.round(10 + power * 8));
  startAutoShake(power);
  squashVel += 0.16 * power;
  sfx.pop(power, scene.id);
  window.dispatchEvent(new CustomEvent("snowball:pop", { detail: { power } }));

  // 번쩍임, 두 번째 고리, 불꽃 줄기
  const now = performance.now();
  if (!reduceMotion.matches) flashStart = now;
  rings.push({ x: pressPoint.x, y: pressPoint.y, start: now + 90, power: power * 1.4 });
  const n = Math.round(14 + 22 * power);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-0.15, 0.15);
    const speed = rand(4, 9) * (0.6 + power * 0.6);
    sparks.push({
      x: pressPoint.x,
      y: pressPoint.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      start: now,
      life: rand(380, 620),
      color: Math.random() < 0.5 ? "#fff6dc" : "#ffffff",
    });
  }
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rand = (min, max) => min + Math.random() * (max - min);

// 바닥 언덕 표면의 y 좌표
function groundAt(x) {
  const t = (x - mound.x) / mound.rx;
  if (Math.abs(t) >= 1) return mound.y;
  return mound.y - mound.ry * Math.sqrt(1 - t * t);
}

// 움직이지 않는 그림은 한 번만 그려 두고 매 프레임 복사해서 씀
// 고정 그림 층은 해상도를 2배까지만: 3배 화면(최신 폰)에서 픽셀 수가 절반 아래로 줄어 나라 전환이 빨라짐
const LAYER_DPR = Math.min(dpr, 2);
function paintLayer(paint, grade, scale = LAYER_DPR) {
  const layer = document.createElement("canvas");
  layer.width = W * scale;
  layer.height = H * scale;
  const g = layer.getContext("2d", { willReadFrequently: grade });
  g.scale(scale, scale);
  paint(g);
  return layer;
}
function makeLayer(paint, grade = false) {
  const layer = paintLayer(paint, grade);
  if (grade) gradeLayer(layer.getContext("2d"), layer.width, layer.height, scene?.grade);
  return layer;
}

// 모든 나라 그림에 같은 색 보정을 거쳐 한 사람이 그린 일러스트처럼 맞춤
//  - 튀는 채도를 눌러 비슷한 수준으로
//  - 그늘은 짙은 남색, 밝은 곳은 따뜻한 크림색 쪽으로 살짝 물들임
//  - 완전한 검정·흰색을 피해 부드러운 톤
//  - 아주 옅은 종이 질감
const GRADE = {
  saturation: 0.8,
  shadow: [34, 40, 78],
  highlight: [255, 241, 222],
  tint: 0.14,
  floor: 14,
  ceiling: 248,
  grain: 5,
};

// y0~y1 줄만 보정할 수 있어서, 미리 만들기를 여러 조각으로 나눠 쉬는 틈마다 조금씩 처리함
function gradeLayer(g, w, h, look, y0 = 0, y1 = h) {
  const img = g.getImageData(0, y0, w, y1 - y0);
  const d = img.data;
  // 장면마다 grade로 일부 값을 바꿀 수 있음 (예: 후지산은 채도를 살리고, 퀘벡은 따뜻한 골든아워 필터)
  const { saturation, shadow, highlight, tint, floor, ceiling, grain } = { ...GRADE, ...(look || {}) };
  const range = (ceiling - floor) / 255;
  // 종이 질감 잡음: 빠른 정수 난수(LCG). 표를 되풀이해 쓰면 일정한 간격의 점무늬가 생겨서 쓰지 않음
  let seed = (Math.random() * 4294967296) >>> 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    let r = d[i];
    let gg = d[i + 1];
    let b = d[i + 2];
    const lum = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
    r = lum + (r - lum) * saturation;
    gg = lum + (gg - lum) * saturation;
    b = lum + (b - lum) * saturation;
    const t = lum / 255;
    const k = t * t * (3 - 2 * t);
    r += (shadow[0] + (highlight[0] - shadow[0]) * k - r) * tint;
    gg += (shadow[1] + (highlight[1] - shadow[1]) * k - gg) * tint;
    b += (shadow[2] + (highlight[2] - shadow[2]) * k - b) * tint;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const n = (seed / 4294967296 - 0.5) * grain;
    d[i] = floor + r * range + n;
    d[i + 1] = floor + gg * range + n;
    d[i + 2] = floor + b * range + n;
  }
  g.putImageData(img, 0, y0);
}

function makeParticle() {
  const p = {
    x: globe.x + rand(-120, 120),
    angle: 0,
    spin: 0,
    flip: 0,
    flipSpeed: 0,
  };
  Object.assign(p, scene.particles.make(rand));
  p.size *= PARTICLE_SCALE;
  p.swayFreq = rand(0.0015, 0.004); // 좌우로 살랑이는 박자
  p.swayPhase = rand(0, Math.PI * 2);
  p.swayAmp = rand(0.2, 0.6) * (1 + p.flutter * 15);
  return p;
}

// Let it snow: 유리구 전체가 크게 흔들리며 입자가 평소의 3배로 터졌다가, 슬로우모션으로 천천히 가라앉음.
// 덤으로 생긴 입자는 바닥에 닿으면 작아지며 스며들듯 사라짐
const SLOW_MS = 6000;
let slowStart = -Infinity;
function fallScale(now) {
  const k = (now - slowStart) / SLOW_MS;
  if (k >= 1) return 1;
  return 0.28 + 0.72 * k * k;
}
export function letItSnow() {
  const now = performance.now();
  const extra = scene.particles.count * 2;
  for (let i = 0; i < extra; i++) {
    const p = makeParticle();
    p.temp = true;
    p.x = globe.x + rand(-60, 60);
    p.y = groundAt(p.x) - rand(2, 20);
    p.vx = 0;
    p.vy = 0;
    p.settled = true;
    particles.push(p);
  }
  pressPoint = { x: globe.x, y: globe.y + 70 };
  burst(pressPoint.x, pressPoint.y, 1);
  for (const p of particles) if (p.temp) p.launchAt = now + rand(0, 260);
  startAutoShake(1.5);
  squashVel += 0.3;
  slowStart = now + 500;
  stir = 5;
  sfx.pop(1, scene.id);
  if (!reduceMotion.matches) flashStart = now;
  rings.push({ x: pressPoint.x, y: pressPoint.y, start: now, power: 1.6 });
  rings.push({ x: pressPoint.x, y: pressPoint.y, start: now + 120, power: 2.2 });
  window.dispatchEvent(new CustomEvent("snowball:pop", { detail: { power: 1 } }));
}

// 엽서용 한 장면: 명판에 원하는 글을 새기고, 화면 해상도와 상관없이 3배(1200×1800)로 다시 그려 떠 옴.
// 보통 화면(1배) PC에서도 글자와 입자가 깨지지 않음
const POSTCARD_SCALE = 3;
// scale: 엽서 사진은 3배, 영상은 프레임마다 다시 그려야 해서 2배.
// 돌려주는 frame()을 부르면 지금 움직이는 입자 그대로 snap에 다시 그림 (영상 엽서용)
export async function capturePostcard(text, scale = POSTCARD_SCALE) {
  // "만드는 중" 글이 먼저 화면에 보이도록 한 프레임 쉬고 시작
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  const original = scene.base;
  if (text) scene.base = { ...original, plate: text, plateFont: PLATE_FONT };
  const hiLayers = {};
  for (const _ of buildSteps(scene, hiLayers, scale));
  scene.base = original;
  const snap = document.createElement("canvas");
  snap.width = W * scale;
  snap.height = H * scale;
  const hctx = snap.getContext("2d");
  hctx.scale(scale, scale);
  const frame = () => {
    const keepCtx = ctx;
    const keepLayers = layers;
    ctx = hctx;
    layers = hiLayers;
    try {
      draw(performance.now());
    } finally {
      ctx = keepCtx;
      layers = keepLayers;
    }
  };
  frame();
  return { snap, id: scene.id, frame };
}

export const currentSceneId = () => scene.id;

// 편지에 꽂아 줄 폴라로이드 사진: 지금 스노우볼의 유리구 부분만 정사각형으로 떠 옴 (이미 만든 그림 층을 그대로 씀)
function sceneSnapshot(size = 320) {
  const shot = document.createElement("canvas");
  shot.width = shot.height = size;
  const g = shot.getContext("2d");
  const bg = g.createRadialGradient(size / 2, size * 0.45, 0, size / 2, size / 2, size * 0.75);
  bg.addColorStop(0, "#34343c");
  bg.addColorStop(1, "#141418");
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);
  // draw()가 먼저 화면을 지우므로 따로 그린 뒤 배경 위에 얹음
  const ball = document.createElement("canvas");
  ball.width = ball.height = size;
  const bg2 = ball.getContext("2d");
  const side = (globe.r + 14) * 2;
  const k = size / side;
  bg2.scale(k, k);
  bg2.translate(-(globe.x - side / 2), -(PAD + globe.y - side / 2));
  const keepCtx = ctx;
  ctx = bg2;
  try {
    draw(performance.now());
  } finally {
    ctx = keepCtx;
  }
  g.drawImage(ball, 0, 0);
  return shot;
}

// 폰을 손으로 흔들면: 바닥의 입자가 거세게 떠오르고 유리구가 출렁임
// 폰을 손으로 흔든 순간: 바닥의 입자가 폰이 움직인 반대 방향(dirX, dirY)으로 튀어 오르고,
// 떠 있던 입자도 그쪽으로 쏠림. 입자마다 각도를 조금씩 흩뜨려 사방으로 난분분하게
export function motionShake(power, dirX = 0, dirY = 0) {
  const k = Math.min(1, power);
  const len = Math.hypot(dirX, dirY) || 1;
  const ux = dirX / len;
  const uy = dirY / len;
  const hasDir = dirX !== 0 || dirY !== 0;
  for (const p of particles) {
    const spread = rand(-0.9, 0.9);
    const cx = hasDir ? ux * Math.cos(spread) - uy * Math.sin(spread) : rand(-1, 1);
    const cy = hasDir ? ux * Math.sin(spread) + uy * Math.cos(spread) : -1;
    const kick = rand(3, 8) * (0.6 + k) * (1.2 - p.inertia * 0.5);
    if (p.settled && Math.random() < 0.3 + 0.5 * k) {
      p.settled = false;
      p.vx = cx * kick + rand(-1.5, 1.5);
      // 바닥에 있던 입자는 아래로는 못 가니 늘 위로 들림
      p.vy = -Math.abs(cy * kick) - rand(1, 3) * (0.6 + k);
    } else if (!p.settled) {
      p.vx += cx * kick * 0.6;
      p.vy += cy * kick * 0.6;
    }
  }
  stir = Math.min(5, stir + 2 * k);
  startAutoShake(0.4 + 0.4 * k);
  sfx.shake(k, scene.id);
  buzz(Math.round(10 + 12 * k));
}

function settle(p) {
  p.y = groundAt(p.x) - 1 + rand(0, 3);
  p.vx = 0;
  p.vy = 0;
  p.settled = true;
  p.flip = rand(-0.6, 0.6); // 바닥에 누운 꽃잎은 넓은 면이 보이게
}

let scene;
let particles = [];
let layers = {};

// 장면을 바꾸면 고정 그림을 다시 그리고 입자를 새로 만든다.
// 입자마다 무게·저항·떠오르기 쉬운 정도는 장면 파일이 정한다.
// 나라마다 고정 그림 층(받침·장면·유리)을 한 번 만들면 기억해 둠. 최근 4곳까지만 들고 있음
const layerCache = new Map();
const CACHE_SIZE = 4;
// 한 나라의 고정 그림 층을 만드는 단계들: 먼저 네 층을 그리고, 색 보정은 띠(STRIP 줄)로 나눠 한 단계씩
const STRIP = 400;
// 받은 편지에 명판 문구가 있으면 그 나라 받침 명판에 새김
let platePin = null;
const PLATE_FONT = "600 14px Pretendard, 'Apple SD Gothic Neo', sans-serif";
function* buildSteps(target, out, scale = LAYER_DPR) {
  // 받침 색·명판이 지금 장면 값을 읽으므로 그리는 동안만 잠시 바꿔 둠 (층마다 한 단계)
  const paintAs = (fn, grade) => {
    const prev = scene;
    const prevBase = target.base;
    if (platePin && platePin.id === target.id) target.base = { ...prevBase, plate: platePin.text, plateFont: PLATE_FONT };
    scene = target;
    try {
      return paintLayer(fn, grade, scale);
    } finally {
      target.base = prevBase;
      scene = prev;
    }
  };
  out.baseBack = paintAs(paintBaseBack, true);
  yield;
  out.scene = paintAs((g) => target.paint(g, globe, groundAt), true);
  yield;
  out.glass = paintAs(paintGlass, false);
  out.baseFront = paintAs(paintBaseFront, true);
  yield;
  for (const key of ["baseBack", "scene", "baseFront"]) {
    const layer = out[key];
    const g = layer.getContext("2d");
    for (let y = 0; y < layer.height; y += STRIP) {
      gradeLayer(g, layer.width, layer.height, target.grade, y, Math.min(layer.height, y + STRIP));
      yield;
    }
  }
}
function buildLayers(target) {
  const out = {};
  for (const _ of buildSteps(target, out));
  return out;
}
function layersFor(target) {
  let built = layerCache.get(target.id);
  if (built) layerCache.delete(target.id);
  else if (warming && warming.target === target) {
    // 미리 만들던 중이면 남은 단계만 마저 처리
    for (const _ of warming.steps);
    built = warming.out;
  } else built = buildLayers(target);
  warming = null;
  layerCache.set(target.id, built);
  while (layerCache.size > CACHE_SIZE) layerCache.delete(layerCache.keys().next().value);
  return built;
}
// 지금 나라를 보는 동안 쉬는 틈에 앞뒤 나라 그림을 미리 만들어 둠 → 화살표·옆 버튼으로 넘길 때 바로 바뀜.
// 프레임 사이에 10ms씩 조각내 처리하고, 화면을 만지거나 스크롤하는 중·설명 시트가 열린 동안에는 미룸
let warmTimer = 0;
let warming = null;
let lastInput = 0;
for (const type of ["pointerdown", "pointermove", "touchmove", "wheel", "scroll", "keydown"]) {
  window.addEventListener(type, () => (lastInput = performance.now()), { passive: true, capture: true });
}
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 60));
const busy = () =>
  performance.now() - lastInput < 1200 ||
  document.body.classList.contains("sheet-open") ||
  document.body.classList.contains("picker-open");
// soon: 곧 고를 것 같은 나라(지구본에서 가운데 온 나라)를 가장 먼저. 이건 지구본이 열려 있어도 만듦
function warmNeighbours(soon = null) {
  clearTimeout(warmTimer);
  const i = SCENES.indexOf(scene);
  const queue = [soon, SCENES[(i + 1) % SCENES.length], SCENES[(i - 1 + SCENES.length) % SCENES.length]].filter(
    (t, k, all) => t && t !== scene && !layerCache.has(t.id) && all.indexOf(t) === k,
  );
  const current = scene.id;
  let target = null;
  let steps = null;
  let out = null;
  // 만들다 만 나라가 다시 맨 앞이면 이어서 만듦
  if (warming && warming.target === queue[0]) ({ target, steps, out } = warming);
  else warming = null;
  if (target) queue.shift();
  const step = (deadline) => {
    if (scene.id !== current) return;
    if (busy() && !(soon && (target === soon || queue[0] === soon))) {
      warmTimer = setTimeout(step, 400);
      return;
    }
    // 한 번 깨어날 때 프레임을 놓치지 않을 만큼(약 10ms)만 여러 조각을 처리
    const until = performance.now() + Math.min(10, deadline?.timeRemaining?.() || 10);
    do {
      if (!steps) {
        target = queue.shift();
        if (!target) return;
        out = {};
        steps = buildSteps(target, out);
        warming = { target, steps, out };
      }
      if (steps.next().done) {
        layerCache.set(target.id, out);
        // 지금 장면이 가장 최근 것으로 남도록 다시 맨 뒤로
        const mine = layerCache.get(current);
        layerCache.delete(current);
        layerCache.set(current, mine);
        while (layerCache.size > CACHE_SIZE) layerCache.delete(layerCache.keys().next().value);
        steps = null;
        warming = null;
      }
    } while (performance.now() < until);
    // 그림이 매 프레임 돌아서 쉬는 틈이 거의 없음 → 오래 기다리지 않고 프레임 사이에 조금씩
    warmTimer = setTimeout(() => idle(step, { timeout: 120 }), 16);
  };
  warmTimer = setTimeout(() => idle(step, { timeout: 120 }), soon ? 60 : 700);
}
// 지구본에서 가운데로 온 나라
window.addEventListener("snowball:focus", (e) => {
  const target = SCENES.find((s) => s.id === e.detail);
  if (target && scene && !layerCache.has(target.id)) warmNeighbours(target);
});

function loadScene(id) {
  scene = SCENES.find((s) => s.id === id) || SCENES[0];
  layers = layersFor(scene);
  warmNeighbours();
  particles = Array.from({ length: scene.particles.count }, () => {
    const p = makeParticle();
    settle(p);
    return p;
  });
  stir = 0;
  document.title = `Snowball · ${scene.title}`;
  for (const button of document.querySelectorAll("[data-scene]")) {
    button.setAttribute("aria-pressed", String(button.dataset.scene === scene.id));
  }
  showSceneInfo(scene.id, SCENES.indexOf(scene), SCENES.length);
}

// 장면이 바뀔 때 직전 화면을 잠깐 겹쳐 그려 부드럽게 넘어가게 함
const FADE_MS = 350;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let fadeFrom = null;
let fadeStart = 0;

// 공유 주소: ?landmark=paris 처럼 도시 이름으로 지금 보는 스노우볼을 가리킴.
// 예전 주소(#france)나 나라 이름(?landmark=france)도 알아들음
const SLUGS = {
  japan: "fuji",
  korea: "namsan",
  canada: "quebec",
  australia: "sydney",
  finland: "rovaniemi",
  china: "beijing",
  egypt: "giza",
  france: "paris",
  turkey: "istanbul",
  spain: "barcelona",
  bolivia: "uyuni",
  taiwan: "ximending",
};
function idFromUrl(hashFirst = false) {
  const query = new URLSearchParams(location.search).get("landmark") || "";
  const hash = location.hash.slice(1);
  const want = (hashFirst ? hash || query : query || hash).toLowerCase();
  if (!want) return null;
  // 예전에 홍콩으로 공유된 링크는 같은 장면인 대만으로
  if (want === "hongkong" || want === "hong-kong") return "taiwan";
  if (SLUGS[want]) return want;
  return Object.keys(SLUGS).find((id) => SLUGS[id] === want) || null;
}
function showInUrl(id) {
  history.replaceState(null, "", `${location.pathname}?landmark=${SLUGS[id] || id}`);
}

function switchScene(id, { fade = true } = {}) {
  if (id === scene.id) return;
  sfx.whoosh();
  if (fade && !reduceMotion.matches) {
    fadeFrom = document.createElement("canvas");
    fadeFrom.width = canvas.width;
    fadeFrom.height = canvas.height;
    fadeFrom.getContext("2d").drawImage(canvas, 0, 0);
    fadeStart = performance.now();
  }
  showInUrl(id);
  loadScene(id);
  window.dispatchEvent(new Event("snowball:scene"));
}

// 멍때리기 모드: 버튼·글자·스노우볼이 아닌 빈 곳을 톡 치면 UI를 모두 숨기고, 다시 치면 보여 줌
const UI_PARTS = "button, a, input, textarea, canvas, label, .meta, .tools, .scenes, .picker, .help, .letter-view, .keep-modal, .tour-bubble, .tour-spot, .sheet-backdrop, .reply-float";
document.addEventListener("click", (e) => {
  if (document.body.classList.contains("zen")) {
    // 스노우볼을 톡톡 치며 노는 건 그대로 두고, 그 밖을 치면 돌아옴
    const onBall = e.target === canvas && onSnowball(e.clientX, e.clientY);
    if (!onBall && !e.target.closest(".picker, .help, .letter-view, .keep-modal")) document.body.classList.remove("zen");
    return;
  }
  const emptyCanvas = e.target === canvas && !onSnowball(e.clientX, e.clientY);
  if (!emptyCanvas && e.target.closest(UI_PARTS)) return;
  if (document.body.classList.contains("sheet-open") || document.body.classList.contains("picker-open")) return;
  document.body.classList.add("zen");
});
window.addEventListener("keydown", (e) => e.key === "Escape" && document.body.classList.remove("zen"));

// 지구본에서 고를 때는 지구본이 줌인되며 걷히는 동안 그 뒤에서 바로 바뀜 (스노우볼끼리 겹쳐 보이는 디졸브는 생략)
const pickFromGlobe = (id) => switchScene(id, { fade: false });

// 1이면 다음 나라, -1이면 이전 나라. 끝에서는 처음으로 돌아감
function stepScene(dir) {
  const i = SCENES.indexOf(scene);
  switchScene(SCENES[(i + dir + SCENES.length) % SCENES.length].id);
}

for (const button of document.querySelectorAll("[data-scene]")) {
  button.addEventListener("click", () => switchScene(button.dataset.scene));
}

// 지구본 선택창
document.querySelector(".globe-open").addEventListener("click", () => openPicker(SCENES, scene.id, pickFromGlobe));

// 처음 방문이면 튜토리얼 (지구본 선택창이 떠 있으면 닫힌 뒤에)
function maybeTutorial() {
  if (!tutorialDone()) setTimeout(startTutorial, 300);
}

document.querySelector(".help-toggle").addEventListener("click", openHelp);

// 폰 가속도 센서: 손으로 흔들면 입자가 소용돌이침. iOS는 첫 탭에서 권한을 물음
let lastMotion = 0;
// 폰의 가속도(중력 뺀 값)를 화면 방향으로 옮겨 둠. 유리구 속 물과 입자는 관성 때문에
// 폰이 움직인 반대쪽으로 쏠림 → 좌우로 흔들면 좌우로, 위아래로 흔들면 위아래로 출렁임
const phoneAccel = { x: 0, y: 0 };
let gravity = null;
function onMotion(e) {
  let ax;
  let ay;
  let az;
  if (e.acceleration && e.acceleration.x != null) {
    ({ x: ax, y: ay, z: az } = e.acceleration);
  } else if (e.accelerationIncludingGravity && e.accelerationIncludingGravity.x != null) {
    // 중력이 섞인 값만 오면, 천천히 따라가는 평균(중력)을 빼서 움직임만 남김
    const a = e.accelerationIncludingGravity;
    gravity = gravity ? { x: gravity.x * 0.9 + a.x * 0.1, y: gravity.y * 0.9 + a.y * 0.1, z: gravity.z * 0.9 + a.z * 0.1 } : { ...a };
    ax = a.x - gravity.x;
    ay = a.y - gravity.y;
    az = a.z - gravity.z;
  } else return;
  // 기기 좌표(x 오른쪽, y 위쪽) → 화면 좌표. 가로 화면이면 돌려서 맞춤
  const angle = ((screen.orientation?.angle ?? window.orientation ?? 0) * Math.PI) / 180;
  const sx = ax * Math.cos(angle) + ay * Math.sin(angle);
  const sy = -(-ax * Math.sin(angle) + ay * Math.cos(angle));
  // 아주 작은 떨림은 무시하고, 값이 튀지 않게 살짝 부드럽게
  const dead = (v) => (Math.abs(v) < 1.2 ? 0 : v - Math.sign(v) * 1.2);
  phoneAccel.x = phoneAccel.x * 0.4 + dead(sx) * 0.6;
  phoneAccel.y = phoneAccel.y * 0.4 + dead(sy) * 0.6;

  const mag = Math.hypot(ax || 0, ay || 0, az || 0);
  const now = performance.now();
  if (mag > 6 && now - lastMotion > 160) {
    lastMotion = now;
    motionShake(Math.min(1.4, (mag - 6) / 12 + 0.3), -sx, -sy);
  }
}
function enableMotion() {
  const D = window.DeviceMotionEvent;
  if (!D) return;
  if (typeof D.requestPermission === "function") {
    D.requestPermission()
      .then((state) => state === "granted" && window.addEventListener("devicemotion", onMotion))
      .catch(() => {});
  } else {
    window.addEventListener("devicemotion", onMotion);
  }
}

// 배경음악은 화면을 처음 누르거나 키를 누른 뒤 시작 (브라우저 정책)
function firstGesture() {
  sfx.startMusic();
  enableMotion();
  window.removeEventListener("pointerdown", firstGesture);
  window.removeEventListener("keydown", firstGesture);
}
window.addEventListener("pointerdown", firstGesture);
window.addEventListener("keydown", firstGesture);

// 예전 주소처럼 # 뒤를 직접 바꿔도 그 나라로 넘어감
window.addEventListener("hashchange", () => {
  const id = idFromUrl(true);
  if (id) switchScene(id);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") stepScene(1);
  if (e.key === "ArrowLeft") stepScene(-1);
  if (e.key === " " && e.target === document.body) {
    e.preventDefault();
    pressPoint = { x: globe.x, y: globe.y + 80 };
    pop(0.8);
  }
});

// 위아래로 끌면 흔들기, 좌우로 밀면 나라 바꾸기
// 캔버스 안에서도 유리구·받침이 아닌 투명한 빈 자리인지 (빈 자리를 톡 치면 멍때리기 모드)
function onSnowball(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) * W) / rect.width;
  const y = ((clientY - rect.top) * H) / rect.height - PAD;
  if (Math.hypot(x - globe.x, y - globe.y) < globe.r + 8) return true;
  return y > globe.y && y < base.bottom + 6 && Math.abs(x - globe.x) < 160;
}

canvas.addEventListener("pointerdown", (e) => {
  if (!onSnowball(e.clientX, e.clientY)) return;
  dragging = true;
  pressing = true;
  pressStart = performance.now();
  pressPoint = toGlobe(e.clientX, e.clientY);
  startX = e.clientX;
  startY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
  sfx.chargeStart();
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  // 손가락이 움직이면 누르기가 아니라 밀기·끌기로 봄
  if (pressing && Math.hypot(e.clientX - startX, e.clientY - startY) > 10) {
    pressing = false;
    sfx.chargeStop();
  }
  const scale = H / canvas.getBoundingClientRect().height;
  const next = clamp((e.clientY - startY) * scale, -MAX_OFFSET, MAX_OFFSET);
  // 방향이 바뀔 때마다(흔드는 한 박자마다) 사르르 소리
  const dir = Math.sign(next - target);
  const now = performance.now();
  if (dir && dir !== lastShakeDir && Math.abs(next - target) > 2 && now - lastShakeSound > 140) {
    sfx.shake(Math.min(1, Math.abs(next - target) / 12), scene.id);
    buzz(8);
    lastShakeSound = now;
  }
  if (dir) lastShakeDir = dir;
  target = next;
});

function release() {
  dragging = false;
  pressing = false;
  target = 0;
}
canvas.addEventListener("pointerup", (e) => {
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const held = Math.min(1, (performance.now() - pressStart) / SQUEEZE_MS);
  const wasPress = pressing;
  release();
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) stepScene(dx < 0 ? 1 : -1);
  else if (wasPress) pop(0.45 + 0.55 * held); // 오래 눌렀다 뗄수록 세게 터짐
  else sfx.chargeStop();
});
canvas.addEventListener("pointercancel", () => {
  release();
  sfx.chargeStop();
});

function update(t, accel) {
  stir *= 0.985;
  phoneAccel.x *= 0.85;
  phoneAccel.y *= 0.85;
  const now = performance.now();

  // 손으로 끌어 흔들 때만: 흔든 만큼 바닥의 입자를 띄움 (누르기 팡과 섞이지 않게)
  const shaking = dragging && !pressing;
  if (shaking) {
    shakeEnergy = Math.min(shakeEnergy + Math.abs(accel) * 0.06, 1.5);
    stir = Math.min(stir + Math.abs(accel) * 0.02, 5);
  }
  shakeEnergy *= 0.94;

  for (const p of particles) {
    // 흔들면 바닥에 누운 입자가 하나씩 들썩이며 떠오름. 입자마다 다른 세기로
    if (p.settled && shaking && Math.random() < shakeEnergy * 0.12) {
      p.settled = false;
      p.vy = -rand(2, 6) * (0.5 + shakeEnergy) * (1.2 - p.inertia * 0.4);
      p.vx = rand(-2.5, 2.5);
    }
    // 출발 시각이 되면 목적지를 향해 솟아오름
    if (p.target && now >= p.launchAt) {
      p.settled = false;
      p.rising = true;
      p.riseFrames = 0;
      p.goal = p.target;
      p.target = null;
    }
    if (p.settled) {
      // 덤으로 생긴 입자는 바닥에 닿은 뒤 작아지며 사라짐
      if (p.temp && !p.target && p.launched) p.size *= 0.93;
      continue;
    }
    if (p.temp) p.launched = true;

    if (p.rising) {
      // 목적지로 날아가며 물속처럼 감속. 무거운 입자(drag가 작은)일수록 느긋하게 도착
      const k = 0.05 + p.drag * 0.4;
      p.vx += ((p.goal.x - p.x) * k - p.vx) * 0.25;
      p.vy += ((p.goal.y - p.y) * k - p.vy) * 0.25;
      p.riseFrames++;
      if (Math.hypot(p.goal.x - p.x, p.goal.y - p.y) < 6 || p.riseFrames > 70) p.rising = false;
    } else {
      // 천천히 떨어지며 입자마다 자기 박자로 좌우로 살랑임 (떨어지는 눈송이·꽃잎의 진자 운동)
      const slow = fallScale(now);
      let sway = Math.sin(t * p.swayFreq + p.swayPhase) * p.swayAmp * slow;
      let lift = 0;
      if (scene.wind) {
        // 바람 방향으로 흐르다가, 위치마다 다른 소용돌이 장에 휘감김
        const w = scene.wind;
        const a = Math.sin(p.x * 0.03 + t * 0.0012) + Math.cos(p.y * 0.035 - t * 0.001);
        sway += w.x * slow + Math.cos(a * 2.2) * w.swirl * 1.6;
        lift = Math.sin(a * 2.2) * w.swirl;
      }
      p.vx += (sway - p.vx) * p.drag;
      p.vy += lift * p.drag;
      p.vy += (p.sink * FALL_SPEED * slow - p.vy) * p.drag;
    }

    // 유리구를 흔들면 입자가 물을 따라 출렁임. 무거울수록 뒤처지고, 입자마다 옆으로 조금씩 다르게 튐
    const jolt = shaking ? 1.6 : 0.5;
    p.vy -= accel * p.inertia * jolt;
    if (shaking && Math.abs(accel) > 1) p.vx += rand(-1, 1) * Math.abs(accel) * 0.15;

    // 폰을 직접 흔드는 동안: 떠 있는 입자가 폰 움직임 반대쪽으로 계속 쏠림 (물속 관성). 무거울수록 덜 밀림
    if (phoneAccel.x || phoneAccel.y) {
      const push = 0.16 * (1.3 - p.inertia * 0.6);
      p.vx -= phoneAccel.x * push;
      p.vy -= phoneAccel.y * push;
    }

    p.x += p.vx;
    p.y += p.vy;

    // 빨리 움직일수록 빨리 돌고 뒤집힘
    const speed = Math.hypot(p.vx, p.vy);
    p.angle += p.spin * (1 + speed * 2);
    p.flip += p.flipSpeed * (1 + speed);

    // 유리 벽에 닿으면 벽을 따라 미끄러짐
    const dx = p.x - globe.x;
    const dy = p.y - globe.y;
    const d = Math.hypot(dx, dy);
    const max = globe.r - p.size - 3;
    if (d > max) {
      const nx = dx / d;
      const ny = dy / d;
      const out = p.vx * nx + p.vy * ny;
      if (out > 0) {
        p.vx -= out * nx;
        p.vy -= out * ny;
      }
      p.x = globe.x + nx * max;
      p.y = globe.y + ny * max;
    }

    // 바닥에 닿으면 내려앉음
    if (!p.rising && p.y >= groundAt(p.x) - 1 && p.vy >= 0) settle(p);
  }
  if (particles.some((p) => p.temp && p.size < 0.4)) particles = particles.filter((p) => !(p.temp && p.size < 0.4));
}

function drawParticles(t) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(globe.x, globe.y, globe.r, 0, Math.PI * 2);
  ctx.clip();
  scene.animate?.(ctx, t, globe, stir);
  ctx.globalCompositeOperation = scene.particles.blend;
  const lensStart = globe.r * 0.7;
  for (const p of particles) {
    const dx = p.x - globe.x;
    const dy = p.y - globe.y;
    const d = Math.hypot(dx, dy);
    if (d <= lensStart || d === 0) {
      scene.particles.draw(ctx, p, t);
      continue;
    }
    // 유리 곡면 가까이에서는 굴절로 바깥쪽으로 살짝 당겨지고 납작·작게 보임
    const k = Math.min(1, (d - lensStart) / (globe.r - lensStart));
    const ox = p.x;
    const oy = p.y;
    const os = p.size;
    const push = 1 + 0.06 * k * k;
    p.x = globe.x + dx * push;
    p.y = globe.y + dy * push;
    p.size = os * (1 - 0.35 * k * k);
    scene.particles.draw(ctx, p, t);
    p.x = ox;
    p.y = oy;
    p.size = os;
  }

  const now = performance.now();

  // 누르는 동안 누른 자리에 빛이 모이며 점점 커짐
  if (pressing) {
    const held = Math.min(1, (now - pressStart) / SQUEEZE_MS);
    const pulse = 0.85 + 0.15 * Math.sin(now * 0.02);
    const radius = (14 + 46 * held) * pulse;
    const charge = ctx.createRadialGradient(pressPoint.x, pressPoint.y, 0, pressPoint.x, pressPoint.y, radius);
    charge.addColorStop(0, `rgba(255,250,235,${0.35 + 0.4 * held})`);
    charge.addColorStop(1, "rgba(255,250,235,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1;
    ctx.fillStyle = charge;
    ctx.fillRect(pressPoint.x - radius, pressPoint.y - radius, radius * 2, radius * 2);
  }

  // 터지는 순간 유리구 안 전체가 0.25초 동안 번쩍임
  const fk = (now - flashStart) / 250;
  if (fk >= 0 && fk < 1) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = (1 - fk) * 0.35;
    ctx.fillStyle = "#fff6e6";
    ctx.fillRect(globe.x - globe.r, globe.y - globe.r, globe.r * 2, globe.r * 2);
  }

  // 불꽃 줄기: 빠르게 튀어 나가며 느려지고 사라짐
  sparks = sparks.filter((sp) => now - sp.start < sp.life);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const sp of sparks) {
    const k = (now - sp.start) / sp.life;
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vx *= 0.9;
    sp.vy = sp.vy * 0.9 + 0.08;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = sp.color;
    ctx.lineWidth = 2 * (1 - k) + 0.4;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y);
    ctx.lineTo(sp.x - sp.vx * 2.2, sp.y - sp.vy * 2.2);
    ctx.stroke();
  }

  // 충격파 고리: 0.6초 동안 커지며 사라짐
  rings = rings.filter((ring) => now - ring.start < 600);
  ctx.globalCompositeOperation = "source-over";
  for (const ring of rings) {
    const k = (now - ring.start) / 600;
    if (k < 0) continue;
    ctx.globalAlpha = (1 - k) * 0.6;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3 * (1 - k) + 0.5;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, 10 + k * 120 * ring.power, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 유리: 가장자리는 어둡고 왼쪽 위에 반사광이 있는 구
function paintGlass(g) {
  const { x, y, r } = globe;

  const edge = g.createRadialGradient(x, y, r * 0.55, x, y, r);
  edge.addColorStop(0, "rgba(10,20,45,0)");
  edge.addColorStop(0.85, "rgba(10,20,45,0.12)");
  edge.addColorStop(1, "rgba(10,20,45,0.38)");
  g.fillStyle = edge;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();

  // 넓고 부드러운 반사광
  g.save();
  g.translate(x - 62, y - 78);
  g.rotate(-0.7);
  const soft = g.createRadialGradient(0, 0, 0, 0, 0, 70);
  soft.addColorStop(0, `rgba(255,255,255,${0.45 * scene.glare})`);
  soft.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = soft;
  g.beginPath();
  g.ellipse(0, 0, 70, 38, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // 또렷한 작은 반사점
  g.fillStyle = `rgba(255,255,255,${0.85 * scene.glare})`;
  g.beginPath();
  g.ellipse(x - 95, y - 85, 9, 5, -0.8, 0, Math.PI * 2);
  g.fill();

  // 오른쪽 아래 가는 반사선
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 3;
  g.lineCap = "round";
  g.beginPath();
  g.arc(x, y, r - 14, Math.PI * 0.08, Math.PI * 0.32);
  g.stroke();

  // 유리 테두리
  g.strokeStyle = "rgba(255,255,255,0.4)";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.12)";
  g.lineWidth = 6;
  g.beginPath();
  g.arc(x, y, r - 4, 0, Math.PI * 2);
  g.stroke();
  // 배경 밝기와 상관없이 늘 보이는 앰비언트 반사: 위쪽은 밝은 테, 아래쪽은 은은한 테, 바깥으로 번지는 빛
  const rim = g.createLinearGradient(0, y - r, 0, y + r);
  rim.addColorStop(0, "rgba(255,255,255,0.75)");
  rim.addColorStop(0.5, "rgba(255,255,255,0.18)");
  rim.addColorStop(1, "rgba(255,255,255,0.45)");
  g.strokeStyle = rim;
  g.lineWidth = 1.4;
  g.beginPath();
  g.arc(x, y, r - 1.5, 0, Math.PI * 2);
  g.stroke();
  g.save();
  g.shadowColor = "rgba(255,255,255,0.35)";
  g.shadowBlur = 10;
  g.strokeStyle = "rgba(255,255,255,0.18)";
  g.lineWidth = 1;
  g.beginPath();
  g.arc(x, y, r + 0.5, 0, Math.PI * 2);
  g.stroke();
  g.restore();
  // 아래쪽 안쪽 가장자리에 받침대에서 올라온 반사
  g.strokeStyle = "rgba(255,240,220,0.22)";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(x, y, r - 6, Math.PI * 0.62, Math.PI * 0.95);
  g.stroke();
}

// 받침대: 유리구가 꽂히는 윗면(뒤쪽)과 몸통(앞쪽)을 나눠 그린다
const base = { top: 352, bottom: 452, topRx: 100, bottomRx: 128, ry: 14 };

// 받침대 몸통은 모든 나라가 같은 짙은 호두나무. 나라별 색은 테두리와 이름판에만
const BASE_BODY = ["#0f0a09", "#33241f", "#43302a", "#22171a", "#0a0606"];
const BASE_COLLAR = "#1a1210";

function paintBaseBack(g) {
  g.fillStyle = BASE_COLLAR;
  g.beginPath();
  g.ellipse(globe.x, base.top, base.topRx, base.ry, 0, 0, Math.PI * 2);
  g.fill();
}

function paintBaseFront(g) {
  const cx = globe.x;
  const { top, bottom, topRx, bottomRx, ry } = base;
  const look = scene.base;

  // 옻칠 몸통. 가운데가 밝아 둥근 원통처럼 보임
  const body = g.createLinearGradient(cx - bottomRx, 0, cx + bottomRx, 0);
  [0, 0.35, 0.5, 0.7, 1].forEach((stop, i) => body.addColorStop(stop, BASE_BODY[i]));
  g.fillStyle = body;
  g.beginPath();
  g.ellipse(cx, top, topRx, ry, 0, 0, Math.PI);
  g.lineTo(cx - bottomRx, bottom);
  g.ellipse(cx, bottom, bottomRx, ry, 0, Math.PI, 0, true);
  g.closePath();
  g.fill();

  // 위에서 비치는 빛
  const sheen = g.createLinearGradient(0, top, 0, bottom);
  sheen.addColorStop(0, "rgba(255,255,255,0.12)");
  sheen.addColorStop(0.3, "rgba(255,255,255,0)");
  g.fillStyle = sheen;
  g.fill();

  // 금속 테두리 두 줄
  const gold = g.createLinearGradient(cx - bottomRx, 0, cx + bottomRx, 0);
  [0, 0.45, 0.6, 1].forEach((stop, i) => gold.addColorStop(stop, look.trim[i]));
  g.strokeStyle = gold;
  for (const [yy, rx, w] of [
    [top + 3, topRx + 2, 3],
    [bottom - 6, bottomRx - 4, 2],
  ]) {
    g.lineWidth = w;
    g.beginPath();
    g.ellipse(cx, yy, rx, ry, 0, 0, Math.PI);
    g.stroke();
  }

  // 이름판. 글자 길이에 맞춰 폭을 정함
  // 긴 문구는 받침 윗면 폭(80%)을 넘지 않게 글자를 줄이고, 그래도 넘치면 가로로 살짝 눌러 담음
  const plateY = top + 50;
  const maxW = topRx * 2 * 0.8;
  let size = parseFloat(look.plateFont.match(/(\d+(?:\.\d+)?)px/)?.[1] || 14);
  const fontAt = (px) => look.plateFont.replace(/\d+(?:\.\d+)?px/, `${px}px`);
  g.font = fontAt(size);
  while (g.measureText(look.plate).width + 24 > maxW && size > 9) {
    size -= 0.5;
    g.font = fontAt(size);
  }
  const textW = g.measureText(look.plate).width;
  const squeeze = Math.min(1, (maxW - 24) / textW);
  const plateW = Math.min(maxW, textW + 24);
  g.fillStyle = gold;
  g.beginPath();
  g.roundRect(cx - plateW / 2, plateY - 13, plateW, 26, 4);
  g.fill();
  g.fillStyle = look.plateInk;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.save();
  g.translate(cx, plateY + 1);
  g.scale(squeeze, 1);
  g.fillText(look.plate, 0, 0);
  g.restore();
}

// 주소에 나라가 없으면 한국부터. 있으면 주소를 ?landmark= 꼴로 맞춰 둠
fillTicker(SCENES.map((s) => s.id));
setupMetaToggle();
setupKeepsakes({ capture: capturePostcard });
const startId = idFromUrl();
const letter = readLetter();
if (letter?.plate && startId) platePin = { id: startId, text: letter.plate };
loadScene(startId || "korea");
// 편지 링크는 새로고침해도 다시 열리게 주소를 그대로 둠
if (startId && !letter) showInUrl(startId);
setupLetters({ currentId: () => scene.id, slugOf: (id) => SLUGS[id] || id });

// 소리 켜기/끄기
const soundButton = document.querySelector(".sound-toggle");
function showSound() {
  const off = sfx.isMuted();
  soundButton.dataset.muted = String(off);
  soundButton.setAttribute("aria-label", off ? "소리 켜기" : "소리 끄기");
  soundButton.title = off ? "소리 켜기" : "소리 끄기";
}
soundButton.addEventListener("click", () => {
  sfx.setMuted(!sfx.isMuted());
  showSound();
});
showSound();

const musicButton = document.querySelector(".music-toggle");
function showMusic() {
  const on = sfx.isMusicOn();
  musicButton.dataset.off = String(!on);
  musicButton.setAttribute("aria-label", on ? "배경음악 끄기" : "배경음악 켜기");
  musicButton.title = on ? "배경음악 끄기" : "배경음악 켜기";
}
musicButton.addEventListener("click", () => {
  sfx.setMusic(!sfx.isMusicOn());
  showMusic();
});
showMusic();

// 나라가 지정되지 않은 주소로 들어오면 지구본 선택창부터 보여줌
// 편지를 받은 사람에게는 조작법 안내를 띄우지 않음. 안내는 링크로 처음 들어와 지구본에서 고른 뒤에만
if (letter && startId) showLetter(letter, scene.id, undefined, { snapshot: sceneSnapshot });
else if (!startId) openPicker(SCENES, scene.id, pickFromGlobe, maybeTutorial);
else maybeTutorial();

// 홈 화면에 추가해 앱처럼 쓰고, 한 번 연 뒤에는 오프라인에서도 열리게
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

// 스노우볼이 안 보일 때는 그리지 않음: 설명 시트나 지구본 창이 덮었을 때, 화면 밖으로 스크롤됐을 때.
// 그 사이 시트가 오르내리거나 페이지를 스크롤하는 움직임이 끊기지 않음
let globeOnScreen = true;
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => (globeOnScreen = entry.isIntersecting)).observe(canvas);
}
const covered = () =>
  !globeOnScreen ||
  document.body.classList.contains("sheet-open") ||
  document.body.classList.contains("picker-open") ||
  document.body.classList.contains("letter-open");

// 한 장면 그리기: 받침 그림자 → 받침 뒤 → 장면 → 입자 → 유리 → 받침 앞
function draw(t) {
  ctx.clearRect(0, 0, W, H);

  // 바닥 그림자. 들어 올리면 옅어짐
  ctx.save();
  ctx.globalAlpha = clamp(0.5 + (offset * VISUAL_SHAKE) / 120, 0.15, 0.7);
  const shadow = ctx.createRadialGradient(200, PAD + 462, 0, 200, PAD + 462, 150);
  shadow.addColorStop(0, "rgba(0,0,0,0.6)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(200, PAD + 462, 150, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(0, PAD + offset * VISUAL_SHAKE);
  // 받침대 바닥을 기준으로 위아래는 줄고 옆으로는 퍼짐
  ctx.translate(globe.x, base.bottom);
  ctx.scale(1 - squash * 0.7, 1 + squash);
  ctx.translate(-globe.x, -base.bottom);
  ctx.drawImage(layers.baseBack, 0, 0, W, H);
  ctx.drawImage(layers.scene, 0, 0, W, H);
  drawParticles(t);
  ctx.drawImage(layers.glass, 0, 0, W, H);
  ctx.drawImage(layers.baseFront, 0, 0, W, H);
  ctx.restore();
}

function frame(t) {
  if (covered()) {
    requestAnimationFrame(frame);
    return;
  }
  // 스노우볼이 손을 스프링처럼 따라가고, 놓으면 살짝 출렁이며 제자리로 돌아감
  // 클릭 흔들기 중에는 정해진 박자로 오르내리며 점점 약해짐
  const now = performance.now();
  const shakeT = now - autoShakeStart;
  if (shakeT < AUTO_SHAKE_MS) {
    target =
      AUTO_SHAKE_HEIGHT * autoShakePower * Math.sin((2 * Math.PI * shakeT) / AUTO_SHAKE_PERIOD) * (1 - shakeT / AUTO_SHAKE_MS);
  } else if (!dragging) {
    target = 0;
  }

  // 누르는 동안 납작해지고, 떼면 젤리처럼 늘어났다 출렁이며 돌아옴
  const squeezeTarget = pressing ? -0.13 * Math.min(1, (now - pressStart) / SQUEEZE_MS) : 0;
  squashVel += (squeezeTarget - squash) * 0.22;
  squashVel *= 0.8;
  squash += squashVel;

  globeVel += (target - offset) * 0.2;
  globeVel *= 0.75;
  offset += globeVel;
  const accel = globeVel - prevGlobeVel;
  prevGlobeVel = globeVel;

  update(t, accel);
  draw(t);

  if (fadeFrom) {
    const k = (performance.now() - fadeStart) / FADE_MS;
    if (k >= 1) {
      fadeFrom = null;
    } else {
      ctx.globalAlpha = 1 - k;
      ctx.drawImage(fadeFrom, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
