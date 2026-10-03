// 효과음: 소리 파일 없이 Web Audio로 직접 만든다.
// 브라우저는 사용자가 화면을 처음 누른 뒤에만 소리를 낼 수 있어서, 첫 누름에서 준비함.

let ac = null;
let comp = null;
let master = null; // 효과음 버스
let charge = null;
let muted = false;
let musicOn = true;
try {
  muted = localStorage.getItem("snowball-muted") === "1";
  musicOn = localStorage.getItem("snowball-music") !== "0";
} catch {}

function ensure() {
  if (ac) {
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  ac = new Ctx();
  comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master = ac.createGain();
  master.gain.value = muted ? 0 : 0.6;
  master.connect(comp).connect(ac.destination);
  return ac;
}

function noiseBuffer(seconds) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem("snowball-muted", value ? "1" : "0");
  } catch {}
  if (master) master.gain.setTargetAtTime(value ? 0 : 0.6, ac.currentTime, 0.02);
}

// 누르는 동안: 고무줄을 당기듯 음이 점점 올라감
export function chargeStart() {
  if (!ensure() || muted) return;
  chargeStop();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(320, t + 0.6);
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(400, t);
  filter.frequency.exponentialRampToValueAtTime(2200, t + 0.6);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.12, t + 0.08);
  osc.connect(filter).connect(gain).connect(master);
  osc.start(t);
  charge = { osc, gain };
}

export function chargeStop() {
  if (!charge) return;
  const t = ac.currentTime;
  charge.gain.gain.cancelScheduledValues(t);
  charge.gain.gain.setTargetAtTime(0, t, 0.02);
  charge.osc.stop(t + 0.15);
  charge = null;
}

// ── 소리 재료 ───────────────────────────────────────────────

const rand = (a, b) => a + Math.random() * (b - a);
const note = (root, semis) => root * Math.pow(2, semis / 12);

// 좌우 위치(-1 왼쪽 ~ 1 오른쪽)를 정해 마스터로 보냄
function out(pan) {
  if (ac.createStereoPanner) {
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    p.connect(master);
    return p;
  }
  return master;
}

// 걸러낸 잡음 한 덩어리: 바람, 파도, 모래, 바스락 알갱이 등
function noise(start, { dur, type = "bandpass", freq = 1000, freqEnd, q = 1, level = 0.2, attack = 0.01, pan = 0 }) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(dur + 0.05);
  const f = ac.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, start);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(level, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0008, start + dur);
  src.connect(f).connect(g).connect(out(pan));
  src.start(start);
  src.stop(start + dur + 0.05);
  return g;
}

// 현을 뜯는 소리: 밝게 시작해서 빠르게 어두워지며 사라짐
function pluck(freq, start, { level = 0.12, decay = 0.9, bright = 3000, wave = "sawtooth", pan = 0 } = {}) {
  const o = ac.createOscillator();
  o.type = wave;
  o.frequency.value = freq;
  const f = ac.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(bright, start);
  f.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.2), start + decay * 0.6);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(level, start + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0008, start + decay);
  o.connect(f).connect(g).connect(out(pan));
  o.start(start);
  o.stop(start + decay + 0.05);
}

// 종소리: 기본음 + 살짝 어긋난 배음, 빠르게 울리고 길게 사라짐
function bell(freq, start, { level = 0.08, decay = 1.4, pan = 0 } = {}) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(level, start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0008, start + decay);
  g.connect(out(pan));
  for (const [mult, amp, type] of [[1, 1, "sine"], [2.01, 0.35, "sine"], [3.02, 0.15, "triangle"]]) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = freq * mult;
    const og = ac.createGain();
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(start);
    o.stop(start + decay + 0.1);
  }
}

// 물방울: 낮은 음에서 위로 휙 올라가는 짧은 "똑"
function drop(freq, start, { level = 0.14, pan = 0 } = {}) {
  const o = ac.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, start);
  o.frequency.exponentialRampToValueAtTime(freq * 2.2, start + 0.06);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(level, start + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0008, start + 0.12);
  o.connect(g).connect(out(pan));
  o.start(start);
  o.stop(start + 0.15);
}

// 나무 실로폰: 둥글고 짧은 음
function marimba(freq, start, { level = 0.16, pan = 0 } = {}) {
  for (const [mult, amp, dec] of [[1, 1, 0.5], [4, 0.25, 0.12]]) {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = freq * mult;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(level * amp, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0008, start + dec);
    o.connect(g).connect(out(pan));
    o.start(start);
    o.stop(start + dec + 0.05);
  }
}

// 썰매 방울 한 번: 높은 금속성 배음 여러 개가 짧게 겹침
function jingle(start, { level = 0.05, pan = 0 } = {}) {
  for (let i = 0; i < 6; i++) {
    const o = ac.createOscillator();
    o.type = "square";
    o.frequency.value = rand(2600, 6200);
    const g = ac.createGain();
    const t = start + rand(0, 0.03);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0005, t + rand(0.12, 0.25));
    const f = ac.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 2000;
    o.connect(f).connect(g).connect(out(pan));
    o.start(t);
    o.stop(t + 0.3);
  }
}

// 날갯짓: 빠르게 떨리는 잡음
function flutter(start, { dur = 0.35, level = 0.12, pan = 0 } = {}) {
  const g = noise(start, { dur, type: "bandpass", freq: 900, q: 0.8, level, attack: 0.02, pan });
  const lfo = ac.createOscillator();
  lfo.frequency.value = rand(18, 26);
  const depth = ac.createGain();
  depth.gain.value = level * 0.9;
  lfo.connect(depth).connect(g.gain);
  lfo.start(start);
  lfo.stop(start + dur);
}

// 잡음 알갱이를 흩뿌림: 낙엽 바스락, 눈 뽀드득, 모래 사르르
function grains(start, { count, spread, lo, hi, dur = [0.01, 0.03], level = 0.12, q = 2 }) {
  for (let i = 0; i < count; i++) {
    const t = start + spread * Math.pow(Math.random(), 1.6);
    noise(t, { dur: rand(dur[0], dur[1]), freq: rand(lo, hi), q, level: level * rand(0.4, 1), attack: 0.002, pan: rand(-0.8, 0.8) });
  }
}

// ── 나라별 "떼는 순간" 소리 ───────────────────────────────────────
// 활로 긋는 현: 천천히 부풀었다 사라지는 낮은 음
function bow(freq, start, { dur = 2, level = 0.06, pan = 0 } = {}) {
  const o = ac.createOscillator();
  o.type = "sawtooth";
  o.frequency.value = freq;
  const vib = ac.createOscillator();
  vib.frequency.value = 5;
  const vg = ac.createGain();
  vg.gain.value = freq * 0.006;
  vib.connect(vg).connect(o.frequency);
  const f = ac.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = freq * 4;
  f.Q.value = 0.7;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(level, start + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0008, start + dur);
  o.connect(f).connect(g).connect(out(pan));
  o.start(start);
  vib.start(start);
  o.stop(start + dur + 0.05);
  vib.stop(start + dur + 0.05);
}

// 음계(반음 단위): 일본 인음계, 5음계, 중동 히자즈, 장음계
const IN_SEN = [0, 1, 5, 7, 10, 12, 13, 17, 19];
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const HIJAZ = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16];
const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];

const VOICES = {
  // 벚꽃잎: 산들바람 + 고토처럼 뜯는 음
  japan(t, p) {
    noise(t, { dur: 1.3, type: "lowpass", freq: 700, freqEnd: 1800, level: 0.06, attack: 0.35 });
    const n = Math.round(4 + p * 4);
    for (let i = 0; i < n; i++) {
      pluck(note(293.66, IN_SEN[i + Math.floor(rand(0, 2))] || 12), t + 0.06 + i * rand(0.08, 0.13), {
        level: 0.1, decay: 1.1, bright: 2400, wave: "triangle", pan: rand(-0.6, 0.6),
      });
    }
  },
  // 반짝이는 불빛: 흩뿌려지는 높은 반짝임 + 맑은 종
  korea(t, p) {
    const n = Math.round(10 + p * 12);
    for (let i = 0; i < n; i++) {
      bell(rand(1800, 4200), t + 0.04 + rand(0, 0.9), { level: 0.025, decay: 0.25, pan: rand(-0.9, 0.9) });
    }
    for (let i = 0; i < 4; i++) bell(note(523.25, PENTA[i * 2]), t + 0.05 + i * 0.09, { level: 0.06, pan: rand(-0.4, 0.4) });
  },
  // 도깨비 소환: 촛불을 "후" 불면 불꽃이 꺼지고, 문 너머 퀘벡에서 바람이 밀려오며
  // 단풍잎이 쏟아짐. 드라마 장면을 떠올리게 만든 소리이고 원곡을 옮긴 것은 아님.
  canada(t, p) {
    // 촛불 부는 숨
    noise(t, { dur: 0.45, type: "bandpass", freq: 1100, freqEnd: 450, q: 0.8, level: 0.14, attack: 0.06 });
    // 불꽃이 꺼지는 작은 "툭"
    noise(t + 0.38, { dur: 0.08, type: "lowpass", freq: 600, level: 0.12, attack: 0.002 });
    // 문이 열리며 밀려오는 바람
    noise(t + 0.35, { dur: 1.6, type: "lowpass", freq: 300, freqEnd: 2400, level: 0.09 + 0.04 * p, attack: 0.7 });
    // 첼로처럼 낮게 부풀었다 사라지는 음
    bow(note(146.83, 0), t + 0.4, { dur: 2.2, level: 0.07 });
    bow(note(146.83, 7), t + 0.55, { dur: 2.0, level: 0.04 });
    // 마법처럼 반짝이며 올라가는 종 (D 단조)
    const MINOR = [0, 3, 7, 10, 14, 15, 19];
    const n = Math.round(4 + p * 3);
    for (let i = 0; i < n; i++) {
      bell(note(587.33, MINOR[i]), t + 0.5 + i * 0.1, { level: 0.045, decay: 1.6, pan: -0.5 + (1.0 * i) / n });
    }
    // 마른 단풍잎 바스락
    grains(t + 0.7, { count: Math.round(25 + p * 30), spread: 1.0, lo: 1800, hi: 5200, level: 0.1 });
  },
  // 물방울: 똑 또록 + 밀려오는 파도
  australia(t, p) {
    noise(t + 0.05, { dur: 1.5, type: "lowpass", freq: 400, freqEnd: 1400, level: 0.12, attack: 0.5 });
    const n = Math.round(6 + p * 8);
    for (let i = 0; i < n; i++) drop(rand(500, 1300), t + 0.04 + rand(0, 0.9), { level: 0.12, pan: rand(-0.8, 0.8) });
  },
  // 눈꽃: 썰매 방울 + 눈 밟는 뽀드득
  finland(t, p) {
    const hits = Math.round(3 + p * 2);
    for (let i = 0; i < hits; i++) jingle(t + 0.04 + i * 0.13, { level: 0.04, pan: i % 2 ? 0.3 : -0.3 });
    grains(t + 0.02, { count: Math.round(14 + p * 12), spread: 0.6, lo: 600, hi: 1600, dur: [0.02, 0.05], level: 0.1, q: 1.2 });
  },
  // 은행잎: 고쟁을 쓸어 올리는 빠른 음 + 가벼운 잎 소리
  china(t, p) {
    const n = Math.round(7 + p * 5);
    for (let i = 0; i < n; i++) {
      pluck(note(277.18, PENTA[i % PENTA.length] + (i >= PENTA.length ? 12 : 0)), t + 0.04 + i * 0.045, {
        level: 0.09, decay: 1.2, bright: 3200, wave: "sawtooth", pan: -0.6 + (1.2 * i) / n,
      });
    }
    grains(t + 0.1, { count: 18, spread: 0.7, lo: 2500, hi: 6000, level: 0.06 });
  },
  // 모래알: 사르르 쏟아지는 모래 + 우드처럼 낮게 뜯는 중동 음계
  egypt(t, p) {
    noise(t + 0.02, { dur: 1.4, type: "highpass", freq: 3500, level: 0.08 + 0.04 * p, attack: 0.08 });
    grains(t + 0.05, { count: 30, spread: 1.0, lo: 4000, hi: 8000, dur: [0.005, 0.012], level: 0.05 });
    const n = Math.round(3 + p * 3);
    for (let i = 0; i < n; i++) {
      pluck(note(220, HIJAZ[i + 1]), t + 0.08 + i * 0.14, { level: 0.12, decay: 0.9, bright: 1600, wave: "sawtooth", pan: rand(-0.4, 0.4) });
    }
  },
  // 장미 꽃잎: 하프 글리산도 + 부드러운 바람
  france(t, p) {
    noise(t, { dur: 1.1, type: "lowpass", freq: 900, freqEnd: 2200, level: 0.05, attack: 0.3 });
    const n = Math.round(10 + p * 5);
    for (let i = 0; i < n; i++) {
      pluck(note(311.13, MAJOR[i]), t + 0.04 + i * 0.035, { level: 0.08, decay: 1.4, bright: 4000, wave: "triangle", pan: -0.7 + (1.4 * i) / n });
    }
  },
  // 유리 조각: 높은 유리 종이 흩어지듯 짤랑이고, 기타를 빠르게 훑는 스페인 음계
  spain(t, p) {
    const n = Math.round(8 + p * 10);
    for (let i = 0; i < n; i++) bell(rand(2200, 5200), t + 0.03 + rand(0, 0.7), { level: 0.03, decay: 0.4, pan: rand(-0.8, 0.8) });
    const strum = [0, 4, 7, 8, 12, 13];
    for (let i = 0; i < strum.length; i++) {
      pluck(note(164.81, strum[i] + 12), t + 0.05 + i * 0.022, { level: 0.08, decay: 1.2, bright: 2600, wave: "triangle", pan: -0.3 + i * 0.12 });
    }
  },
  // 소금 결정: 안데스 팬파이프(시쿠)처럼 숨이 섞인 5음계 + 맑은 유리 결정 소리
  bolivia(t, p) {
    noise(t, { dur: 1.4, type: "lowpass", freq: 500, freqEnd: 1200, level: 0.05, attack: 0.4 });
    const n = Math.round(4 + p * 3);
    for (let i = 0; i < n; i++) {
      const f = note(392, PENTA[(i * 2) % PENTA.length]);
      const s = t + 0.05 + i * 0.16;
      pluck(f, s, { level: 0.07, decay: 0.9, bright: 1500, wave: "sine", pan: rand(-0.4, 0.4) });
      noise(s, { dur: 0.25, type: "bandpass", freq: f * 2, q: 6, level: 0.05, attack: 0.03 });
    }
    for (let i = 0; i < 6; i++) bell(rand(3000, 5600), t + 0.1 + rand(0, 0.8), { level: 0.02, decay: 0.3, pan: rand(-0.8, 0.8) });
  },
  // 네온 빗방울: 간판 형광등의 낮은 웅 소리 + 후드득 빗소리 + 트램 "땡땡"
  hongkong(t, p) {
    const o = ac.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = 100;
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 700;
    const gg = ac.createGain();
    gg.gain.setValueAtTime(0.0001, t);
    gg.gain.linearRampToValueAtTime(0.03, t + 0.08);
    gg.gain.exponentialRampToValueAtTime(0.0005, t + 1.1);
    o.connect(f).connect(gg).connect(out(0));
    o.start(t);
    o.stop(t + 1.2);
    grains(t + 0.05, { count: Math.round(30 + p * 30), spread: 1.1, lo: 2500, hi: 7000, dur: [0.004, 0.012], level: 0.07, q: 1.5 });
    bell(1318.5, t + 0.2, { level: 0.05, decay: 0.6 });
    bell(1318.5, t + 0.42, { level: 0.05, decay: 0.8 });
  },
  // 나비: 파르르 날갯짓 + 카눈처럼 반짝이는 중동 음계
  turkey(t, p) {
    const flaps = Math.round(2 + p * 2);
    for (let i = 0; i < flaps; i++) flutter(t + 0.03 + i * 0.22, { level: 0.08, pan: rand(-0.7, 0.7) });
    const n = Math.round(5 + p * 4);
    for (let i = 0; i < n; i++) {
      pluck(note(466.16, HIJAZ[i]), t + 0.06 + i * 0.07, { level: 0.08, decay: 0.8, bright: 5000, wave: "sawtooth", pan: rand(-0.5, 0.5) });
    }
  },
};

// 떼는 순간: 공통 "딸깍 + 뽁" 뒤에 나라별 소리
export function pop(power, sceneId) {
  if (!ensure() || muted) return;
  chargeStop();
  const t = ac.currentTime;

  noise(t, { dur: 0.05, freq: 1800, q: 1.2, level: 0.45 * power, attack: 0.001 });
  const bloop = ac.createOscillator();
  bloop.type = "sine";
  bloop.frequency.setValueAtTime(700 + 300 * power, t);
  bloop.frequency.exponentialRampToValueAtTime(90, t + 0.2);
  const bg = ac.createGain();
  bg.gain.setValueAtTime(0.45 * power, t);
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  bloop.connect(bg).connect(master);
  bloop.start(t);
  bloop.stop(t + 0.3);

  (VOICES[sceneId] || VOICES.korea)(t, power);
}

// 끌어서 흔드는 한 박자마다: 유리구 안 물이 출렁이며 입자가 사르르 쓸리는 소리
const SHAKE_TONE = {
  japan: 1800, korea: 3200, canada: 2600, australia: 900, finland: 2200,
  china: 2800, egypt: 4200, france: 2000, turkey: 2400, spain: 3600, bolivia: 3000, hongkong: 1500,
};
export function shake(level, sceneId) {
  if (!ensure() || muted) return;
  const t = ac.currentTime;
  const f = SHAKE_TONE[sceneId] || 2400;
  noise(t, { dur: 0.22, type: "bandpass", freq: f * 0.6, freqEnd: f, q: 0.9, level: 0.05 + 0.07 * level, attack: 0.04, pan: rand(-0.3, 0.3) });
  noise(t, { dur: 0.3, type: "lowpass", freq: 500, freqEnd: 260, level: 0.04 * level, attack: 0.03 });
}

// 나라를 바꿀 때: 바람이 지나가는 "슉"
export function whoosh() {
  if (!ensure() || muted) return;
  const t = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(0.45);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(2400, t + 0.35);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.35, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
  src.connect(bp).connect(g).connect(master);
  src.start(t);
}

// ── 배경음악: 잔잔한 피아노 ─────────────────────────────────────
// 느린 템포로 네 코드를 돌며 낮은 베이스, 부드러운 아르페지오, 가끔 떨어지는 멜로디 음을 만듦.
// 매번 조금씩 다르게 치도록 세기와 멜로디를 무작위로 고름.

const BPM = 66;
const BEAT = 60 / BPM;
const MUSIC_LEVEL = 0.22;
// 코드: [베이스 근음(MIDI), 아르페지오 음들(MIDI)]
const CHORDS = [
  [48, [60, 64, 67, 71, 74]], // Cmaj9
  [45, [57, 60, 64, 67, 71]], // Am9
  [41, [57, 60, 64, 65, 69]], // Fmaj9
  [43, [55, 60, 62, 67, 69]], // G6/9sus
];
const MELODY = [72, 74, 76, 79, 81, 84]; // C 5음계, 높은 음역
const ARP = [0, 2, 1, 3, 2, 4, 3, 1]; // 한 마디 8분음표 순서

let musicBus = null;
let musicTimer = null;
let nextTime = 0;
let step = 0;

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

function reverbBuffer(seconds) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return buf;
}

function ensureMusicBus() {
  if (musicBus) return;
  musicBus = ac.createGain();
  musicBus.gain.value = 0;
  const dry = ac.createGain();
  dry.gain.value = 0.75;
  const wet = ac.createGain();
  wet.gain.value = 0.45;
  const verb = ac.createConvolver();
  verb.buffer = reverbBuffer(2.8);
  musicBus.connect(dry).connect(comp);
  musicBus.connect(verb).connect(wet).connect(comp);
}

// 피아노 한 음: 망치로 친 듯 빠르게 울리고, 높은 배음부터 먼저 사라짐
function piano(m, t, vel, { pan = 0 } = {}) {
  const f = midi(m);
  const length = 1.6 + (84 - m) * 0.05; // 낮은 음일수록 길게 울림
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + 0.006);
  g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0005, t + length);
  const tone = ac.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.setValueAtTime(1200 + vel * 9000, t);
  tone.frequency.exponentialRampToValueAtTime(600, t + length * 0.7);
  let node = g;
  if (ac.createStereoPanner) {
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    g.connect(p);
    node = p;
  }
  node.connect(musicBus);
  tone.connect(g);
  for (const [mult, amp, detune] of [[1, 1, 0], [1, 0.5, 4], [2, 0.35, 0], [3, 0.12, 0], [4.02, 0.06, 0]]) {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = f * mult;
    o.detune.value = detune;
    const og = ac.createGain();
    og.gain.value = amp;
    o.connect(og).connect(tone);
    o.start(t);
    o.stop(t + length + 0.1);
  }
}

// 8분음표 하나만큼 연주를 예약
function playStep(t) {
  const bar = Math.floor(step / 8);
  const pos = step % 8;
  const [bass, tones] = CHORDS[bar % CHORDS.length];
  if (pos === 0) {
    piano(bass, t, 0.16, { pan: -0.2 });
    piano(bass + 7, t + 0.02, 0.09, { pan: -0.2 });
  }
  if (pos === 4 && Math.random() < 0.5) piano(bass + 12, t, 0.07, { pan: -0.1 });
  // 아르페지오: 가끔 한 음을 쉬어서 기계적으로 들리지 않게
  if (Math.random() < 0.85) {
    const m = tones[ARP[pos] % tones.length];
    piano(m, t + Math.random() * 0.015, 0.05 + Math.random() * 0.04, { pan: 0.15 });
  }
  // 멜로디: 박자 앞에서 가끔 높은 음 하나
  if (pos % 2 === 0 && Math.random() < 0.28) {
    const m = MELODY[Math.floor(Math.random() * MELODY.length)];
    piano(m, t + 0.01, 0.06 + Math.random() * 0.04, { pan: 0.35 });
  }
  step++;
}

function scheduler() {
  while (nextTime < ac.currentTime + 0.6) {
    playStep(nextTime);
    nextTime += BEAT / 2;
  }
}

export function isMusicOn() {
  return musicOn;
}

// 첫 누름 이후 호출. 음악이 켜져 있으면 천천히 소리를 키우며 시작
export function startMusic() {
  if (!ensure() || !musicOn) return;
  ensureMusicBus();
  if (musicTimer) return;
  nextTime = ac.currentTime + 0.1;
  musicTimer = setInterval(scheduler, 150);
  musicBus.gain.cancelScheduledValues(ac.currentTime);
  musicBus.gain.setTargetAtTime(MUSIC_LEVEL, ac.currentTime, 1.2);
}

export function setMusic(on) {
  musicOn = on;
  try {
    localStorage.setItem("snowball-music", on ? "1" : "0");
  } catch {}
  if (!ac) return;
  if (on) {
    startMusic();
  } else if (musicBus) {
    musicBus.gain.setTargetAtTime(0, ac.currentTime, 0.3);
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

// 다른 탭으로 가면 음악을 멈추고, 돌아오면 이어서 침
document.addEventListener("visibilitychange", () => {
  if (!ac) return;
  if (document.hidden) {
    clearInterval(musicTimer);
    musicTimer = null;
    ac.suspend();
  } else {
    ac.resume();
    if (musicOn && musicBus) {
      nextTime = ac.currentTime + 0.1;
      musicTimer = setInterval(scheduler, 150);
    }
  }
});
