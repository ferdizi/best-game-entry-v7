// MOSS & MORTAR audio: tiny WebAudio blips, no files. One clear job: sound.
let ctx = null;
let muted = false;
function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }
function blip(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const c = ac(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
  g.gain.setValueAtTime(vol || 0.08, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g); g.connect(c.destination);
  o.start(); o.stop(c.currentTime + dur);
}
export function sndMold() { blip(220, 0.07, 'triangle', 0.05, 180); }
export function sndWater() { blip(660, 0.18, 'sine', 0.09, 990); }
export function sndWhisper() { blip(880, 0.12, 'sine', 0.06, 1170); }
export function sndStar() { blip(523, 0.12, 'sine', 0.09); setTimeout(() => blip(784, 0.16, 'sine', 0.09), 90); }
export function sndFail() { blip(196, 0.3, 'sawtooth', 0.05, 130); }
export function sndWarden() { blip(82, 0.5, 'sawtooth', 0.08, 55); }
export function sndWin() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.2, 'sine', 0.09), i * 120)); }
