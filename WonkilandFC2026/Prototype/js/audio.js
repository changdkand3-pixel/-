// 사운드: 효과음은 WebAudio로 실시간 합성(저작권 문제 없는 자체 생성음).
// 음악: Assets/Music/* 폴더에 사용자가 권리를 확보한 파일을 넣고 Tools/build_playlist.js 실행 → 자동/랜덤 재생.
//       또는 메뉴의 "음악 파일 추가"로 즉석 추가.
(function () {
  'use strict';
  let ctx = null, master, crowdGain, crowdSrc, sfxGain, musicEl = null;
  const state = { musicVolume: 0.5, sfxVolume: 0.8, shuffle: true, voice: true, playlists: { menu: [], entrance: [], ceremony: [] }, current: null, idx: {} };
  function init() {
    if (ctx) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = state.sfxVolume; sfxGain.connect(master);
    // 관중 소리: 필터링된 노이즈 루프
    const len = ctx.sampleRate * 3, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); let last = 0; for (let i = 0; i < len; i++) { last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = last * 6 + (Math.random() * 2 - 1) * 0.02; } }
    crowdSrc = ctx.createBufferSource(); crowdSrc.buffer = buf; crowdSrc.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.5;
    crowdGain = ctx.createGain(); crowdGain.gain.value = 0;
    crowdSrc.connect(bp); bp.connect(crowdGain); crowdGain.connect(sfxGain); crowdSrc.start();
    const pl = window.WFC_PLAYLIST; if (pl) for (const k of Object.keys(state.playlists)) state.playlists[k] = (pl[k] || []).map(f => ({ name: f.split('/').pop(), url: f }));
  }
  function noiseBurst(dur, freq, q, gain, type) {
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); g.connect(sfxGain); s.start();
  }
  function tone(freq, dur, gain, type, when, slide) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(sfxGain); o.start(t0); o.stop(t0 + dur + 0.05);
    return o;
  }
  const sfx = {
    kick(power) { noiseBurst(0.09, 900, 1, 0.5 + power * 0.6); tone(120, 0.12, 0.4 + power * 0.3, 'sine', 0, 60); },
    bounce() { tone(90, 0.08, 0.15, 'sine'); },
    post() { [523, 1046, 1568, 2350].forEach((f, i) => tone(f * 0.62, 1.2 - i * 0.2, 0.18 / (i + 1), 'sine')); noiseBurst(0.05, 3000, 2, 0.3, 'highpass'); },
    net() { noiseBurst(0.25, 1800, 0.6, 0.25, 'bandpass'); },
    whistle(kind) {
      if (!ctx) return;
      const n = kind === 'period_end' ? 3 : kind === 'foul' ? 1 : 1;
      for (let i = 0; i < n; i++) {
        const dur = kind === 'period_end' && i === 2 ? 0.9 : 0.32;
        const o = tone(2900, dur, 0.22, 'square', i * 0.45);
        if (o) { const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 38; lg.gain.value = 90; lfo.connect(lg); lg.connect(o.frequency); lfo.start(ctx.currentTime + i * 0.45); lfo.stop(ctx.currentTime + i * 0.45 + dur); }
      }
    },
    goal() { // 골 세리머니 효과음: 함성 + 팡파르
      if (!ctx) return;
      crowdGain.gain.cancelScheduledValues(ctx.currentTime);
      crowdGain.gain.setValueAtTime(1.6, ctx.currentTime); crowdGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 6);
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.5, 0.12, 'triangle', i * 0.12));
      tone(1046, 1.2, 0.1, 'triangle', 0.5);
    },
    ceremony() { [392, 523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, 0.6, 0.1, 'triangle', i * 0.22)); },
    ui() { tone(880, 0.06, 0.08, 'sine'); },
    firework() { noiseBurst(0.6, 1200, 0.4, 0.4, 'lowpass'); tone(200, 0.3, 0.2, 'sine', 0, 40); }
  };
  function crowd(level) { if (ctx && crowdGain) crowdGain.gain.setTargetAtTime(0.15 + level * 0.9, ctx.currentTime, 0.6); }

  // ---- 음악 ----
  function playCategory(cat) {
    const list = state.playlists[cat] || [];
    stopMusic();
    if (!list.length) { state.current = null; return false; }
    let i = state.idx[cat] === undefined ? -1 : state.idx[cat];
    i = state.shuffle ? Math.floor(Math.random() * list.length) : (i + 1) % list.length;
    state.idx[cat] = i;
    musicEl = new Audio(list[i].url); musicEl.volume = state.musicVolume;
    musicEl.onended = () => playCategory(cat); // 자동 연속 재생
    musicEl.play().catch(() => {});
    state.current = { cat, name: list[i].name };
    return true;
  }
  function stopMusic() { if (musicEl) { musicEl.onended = null; musicEl.pause(); musicEl = null; } }
  function addFiles(cat, files) { for (const f of files) state.playlists[cat].push({ name: f.name, url: URL.createObjectURL(f) }); }

  // ---- 해설 (텍스트 + 선택적 음성합성) ----
  let lastSpeak = 0;
  function speak(text, priority) {
    if (!state.voice || !window.speechSynthesis) return;
    const now = performance.now();
    if (!priority && now - lastSpeak < 2500) return;
    lastSpeak = now;
    try { if (priority) speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = 1.15; speechSynthesis.speak(u); } catch (e) { /* 음성 미지원 */ }
  }
  window.WFCAudio = { init, sfx, crowd, playCategory, stopMusic, addFiles, speak, state, get ctx() { return ctx; } };
})();
