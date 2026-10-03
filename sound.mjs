// 효과음: 소리 파일 없이 Web Audio로 직접 만든다.
// 브라우저는 사용자가 화면을 처음 누른 뒤에만 소리를 낼 수 있어서, 첫 누름에서 준비함.

let ac = null;
let master = null;
let charge = null;
let muted = false;
try {
  muted = localStorage.getItem("snowball-muted") === "1";
} catch {}

// 나라마다 "샤랄라" 화음의 기준음 (Hz). 같은 장조 5음계를 이 음에서 시작함
const ROOTS = {
  korea: 523.25, // C5
  japan: 587.33, // D5
  canada: 493.88, // B4
  australia: 659.25, // E5
  finland: 698.46, // F5
  china: 554.37, // C#5
  egypt: 440, // A4
  france: 622.25, // D#5
  turkey: 466.16, // A#4
};
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

function ensure() {
  if (ac) {
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  ac = new Ctx();
  const comp = ac.createDynamicsCompressor();
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

// 떼는 순간: "뽁" 하는 팝 + 유리 종소리 같은 "샤랄라"
export function pop(power, sceneId) {
  if (!ensure() || muted) return;
  chargeStop();
  const t = ac.currentTime;

  // 짧은 딸깍 (필터 거친 잡음)
  const click = ac.createBufferSource();
  click.buffer = noiseBuffer(0.05);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  bp.Q.value = 1.2;
  const cg = ac.createGain();
  cg.gain.setValueAtTime(0.5 * power, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  click.connect(bp).connect(cg).connect(master);
  click.start(t);

  // 뽁: 높은 음에서 낮은 음으로 빠르게 떨어짐
  const bloop = ac.createOscillator();
  bloop.type = "sine";
  bloop.frequency.setValueAtTime(700 + 300 * power, t);
  bloop.frequency.exponentialRampToValueAtTime(90, t + 0.2);
  const bg = ac.createGain();
  bg.gain.setValueAtTime(0.55 * power, t);
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  bloop.connect(bg).connect(master);
  bloop.start(t);
  bloop.stop(t + 0.3);

  // 샤랄라: 5음계를 아래에서 위로 빠르게 훑는 종소리. 세게 누를수록 높고 많이
  const root = ROOTS[sceneId] || 523.25;
  const count = Math.round(5 + power * 6);
  for (let i = 0; i < count; i++) {
    const step = PENTATONIC[Math.min(PENTATONIC.length - 1, i + Math.floor(Math.random() * 2))];
    const freq = root * Math.pow(2, step / 12);
    const start = t + 0.05 + i * (0.045 + Math.random() * 0.03);
    bell(freq, start, 0.16 / Math.sqrt(count) + 0.04);
  }
}

// 종소리 한 음: 기본음 + 살짝 어긋난 배음, 빠르게 울리고 길게 사라짐
function bell(freq, start, level) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(level, start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0008, start + 1.4);
  g.connect(master);
  for (const [mult, amp, type] of [[1, 1, "sine"], [2.01, 0.35, "sine"], [3.02, 0.15, "triangle"]]) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = freq * mult;
    const og = ac.createGain();
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(start);
    o.stop(start + 1.5);
  }
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
