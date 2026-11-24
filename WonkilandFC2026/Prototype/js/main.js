// 원기랜드의 FC 2026 — 프로토타입 메인: 렌더링, 화면 흐름, 연출, HUD, 리플레이
(function () {
  'use strict';
  THREE.ColorManagement.legacyMode = false; // 16진 색상을 sRGB로 해석 (색이 바래 보이는 문제 방지)
  const T = THREE, M = WFCModels, A = WFCAudio, I = WFCInput, PH = WFCPhysics.PITCH;
  const DATA = window.WFC_DATA;
  const $ = id => document.getElementById(id);
  const ORIGINAL_SQUADS = JSON.parse(JSON.stringify(DATA.squads));
  const TOUR = DATA.tournaments[1930];
  const teamInfo = id => TOUR.teams.find(t => t.team_id === id) || { name_ko: id };
  const kitOf = id => DATA.kits[`kit-${id}-1930-home`];

  // ---------------- 렌더러/씬 ----------------
  const canvas = $('view');
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(40, 1, 0.1, 800);
  const hemi = new T.HemisphereLight(0xdfeaff, 0x3a5a2a, 0.65); scene.add(hemi);
  const sun = new T.DirectionalLight(0xfff2dd, 1.25); sun.position.set(-40, 80, 30); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 50, bottom: -50, near: 10, far: 220 }); scene.add(sun);
  const nightLights = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new T.SpotLight(0xf4f6ff, 0, 220, 0.6, 0.5); l.position.set(sx * (PH.halfLength + 14), 31, sz * (PH.halfWidth + 20)); l.target.position.set(sx * 20, 0, 0); scene.add(l, l.target); nightLights.push(l); }
  const stadium = M.buildStadium(scene, { teamColors: [['#7fb8e6', '#ffffff'], ['#75aadb', '#ffffff']] });
  const weather = M.buildWeather(scene);
  const ballMesh = M.buildBall(); scene.add(ballMesh);
  // 개최자: 단 하나의 인스턴스를 모든 장면에서 재사용 (외형 일관성)
  const host = M.buildHost(DATA.host); scene.add(host);
  const hostAnim = { state: 'wave', phase: 0, speed: 0, t: 0 };
  const podium = new T.Mesh(new T.CylinderGeometry(1.4, 1.6, 0.5, 32), M.mat('#1d2a44', { roughness: 0.4 })); podium.receiveShadow = true; scene.add(podium);
  const trophy = M.buildTrophy(); trophy.visible = false; scene.add(trophy);
  const vipBox = new T.Mesh(new T.BoxGeometry(6, 0.4, 3), M.mat('#3b2a1a')); vipBox.position.set(0, 3.2, PH.halfWidth + 10.5); scene.add(vipBox);
  // 불꽃놀이
  const fireworks = [];
  function firework(x, y, z, color) {
    const N = 160, pos = new Float32Array(N * 3), vel = [];
    for (let i = 0; i < N; i++) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1), s = 8 + Math.random() * 6; vel.push([Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s, Math.sin(b) * Math.sin(a) * s]); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    const p = new T.Points(g, new T.PointsMaterial({ color, size: 0.6, transparent: true, opacity: 1, depthWrite: false })); scene.add(p);
    fireworks.push({ p, vel, life: 0 }); A.sfx.firework();
  }
  function updateFireworks(dt) {
    for (let k = fireworks.length - 1; k >= 0; k--) {
      const f = fireworks[k]; f.life += dt; const a = f.p.geometry.attributes.position.array;
      f.vel.forEach((v, i) => { v[1] -= 6 * dt; a[i * 3] += v[0] * dt; a[i * 3 + 1] += v[1] * dt; a[i * 3 + 2] += v[2] * dt; });
      f.p.geometry.attributes.position.needsUpdate = true; f.p.material.opacity = Math.max(0, 1 - f.life / 2.2);
      if (f.life > 2.2) { scene.remove(f.p); f.p.geometry.dispose(); fireworks.splice(k, 1); }
    }
  }

  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  // ---------------- 환경 (시간대/날씨) ----------------
  function setEnvironment(time, wx) {
    const sky = { day: 0x87b5e8, dusk: 0xe08a5a, night: 0x070b1a }[time];
    scene.background = new T.Color(sky);
    scene.fog = new T.Fog(sky, 140, wx === 'clear' ? 420 : 200);
    sun.intensity = time === 'day' ? 1.25 : time === 'dusk' ? 0.7 : 0.08;
    sun.color.set(time === 'dusk' ? 0xffb27a : 0xfff2dd);
    hemi.intensity = time === 'night' ? 0.12 : 0.65;
    renderer.toneMappingExposure = time === 'night' ? 0.8 : 1.0;
    nightLights.forEach(l => { l.intensity = time === 'night' ? 1.6 : time === 'dusk' ? 0.4 : 0; l.decay = 0; });
    stadium.lightTowers.forEach(t => t.head.material.emissive.set(time === 'day' ? 0x000000 : 0xffffff));
    if (wx !== 'clear') { sun.intensity *= 0.55; scene.background.multiplyScalar(0.7); }
    weather.set(wx);
    // 날씨가 공 물리에 영향: 젖은 잔디는 공이 더 미끄러지고, 눈은 더 빨리 멈춤
    WFCPhysics.BALL.rollFriction = wx === 'rain' ? 1.2 : wx === 'snow' ? 2.6 : 1.6;
    S.env = { time, wx };
  }

  // ---------------- 상태 ----------------
  const S = { screen: 'title', match: null, models: [], camMode: 0, camPos: new T.Vector3(0, 30, 60), camLook: new T.Vector3(), seq: null, replay: null, replayBuf: [], paused: false, setup: null, excitement: [0, 0, 0], ticker: [], quality: 'high', env: null, lastFrame: performance.now(), t: 0 };
  window.WFC = { S, DATA }; // 디버그/테스트 접근용

  function show(id) {
    ['title', 'modes', 'setup', 'settings', 'editor', 'draw', 'help', 'pause', 'results'].forEach(s => $(s).classList.toggle('hidden', s !== id));
    S.screen = id;
  }
  function caption(text) { const c = $('caption'); if (!text) { c.classList.add('hidden'); return; } c.textContent = text; c.classList.remove('hidden'); }

  // ---------------- 메인 타이틀 ----------------
  function toTitle() {
    clearMatch(); S.seq = null; caption(null); $('skipHint').classList.add('hidden'); $('hud').classList.add('hidden');
    document.querySelectorAll('.lineup').forEach(e => e.remove());
    setEnvironment('dusk', 'clear');
    placeHost('center', 'wave'); trophy.visible = false; ballMesh.visible = false;
    show('title'); A.init(); A.crowd(0.15);
    if (!A.playCategory('menu')) { /* 음악 파일이 없으면 무음 */ }
  }
  function placeHost(where, state) {
    host.visible = true; hostAnim.state = state;
    if (where === 'center') { podium.visible = true; podium.position.set(0, 0.25, 0); host.position.set(0, 0.5, 0); host.rotation.y = 0; }
    else if (where === 'vip') { podium.visible = false; host.position.set(0, 3.4 - 0.0, PH.halfWidth + 11); host.rotation.y = Math.PI; }
    else if (where === 'ceremony') { podium.visible = true; podium.position.set(0, 0.25, PH.halfWidth - 6); host.position.set(-0.9, 0.5, PH.halfWidth - 6); host.rotation.y = 0; }
  }

  // ---------------- 메뉴 연결 ----------------
  document.body.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    A.init(); A.sfx.ui();
    const act = b.dataset.act;
    if (act === 'title') toTitle();
    else if (act === 'final1930') openSetup('final');
    else if (act === 'modes') { buildModes(); show('modes'); }
    else if (act === 'settings') { show('settings'); refreshPlaylistInfo(); }
    else if (act === 'editor') { buildEditor(); show('editor'); }
    else if (act === 'help') show('help');
    else if (act === 'draw') startDraw();
  });

  const MODES = [
    { id: 'history', name: '① 역대 월드컵 재현', st: 'part', desc: '1930 대회 결승만 플레이 가능. 대회 전체 일정/조별리그는 미구현.', run: () => openSetup('final') },
    { id: 'era', name: '② 시대 초월 대전', st: 'no', desc: '1930 이외 시대 선수 데이터 미구축 → 비활성.' },
    { id: 'gauntlet', name: '③ 역대 월드컵 도장깨기', st: 'no', desc: '다수 대회 데이터 필요 → 미구현.' },
    { id: 'nation', name: '④ 국가별 역대 올스타', st: 'no', desc: '다수 대회 데이터 필요 → 미구현.' },
    { id: 'world', name: '⑤ 세계 올스타', st: 'no', desc: '선수 선택 UI 미구현.' },
    { id: 'friendly', name: '⑥ 친선경기', st: 'ok', desc: '우루과이 vs 아르헨티나(1930). 규칙/날씨/시간대 선택.', run: () => openSetup('friendly') },
    { id: 'pk', name: '⑦ 승부차기', st: 'ok', desc: '5명씩 + 서든데스.', run: () => openSetup('shootout') },
    { id: 'practice', name: '⑧ 연습모드', st: 'ok', desc: '상대 골키퍼만 있는 자유 연습. 시간 제한 없음.', run: () => openSetup('practice') },
    { id: 'versus', name: '⑨ 2인 대전', st: 'ok', desc: '키보드 2인(WASD vs 방향키) 또는 게임패드 2개.', run: () => openSetup('versus') },
    { id: 'edit', name: '⑩ 선수 및 팀 편집', st: 'part', desc: '능력치 편집 + JSON 내보내기. 외형/유니폼 편집은 미구현.', run: () => { buildEditor(); show('editor'); } }
  ];
  function buildModes() {
    const g = $('modeGrid'); g.innerHTML = '';
    for (const m of MODES) {
      const b = document.createElement('button'); b.className = 'mode'; b.disabled = !m.run;
      b.innerHTML = `<b>${m.name}<span class="tag ${m.st}">${{ ok: '플레이 가능', part: '일부 구현', no: '미구현' }[m.st]}</span></b><span>${m.desc}</span>`;
      if (m.run) b.onclick = () => { A.sfx.ui(); m.run(); };
      g.appendChild(b);
    }
  }
  // 포메이션 선택지
  for (const id of ['optF0', 'optF1', 'pF']) $(id).innerHTML = Object.keys(WFCMatch.FORMATIONS).map(f => `<option>${f}</option>`).join('');
  function openSetup(kind) {
    S.setupKind = kind;
    $('setupTitle').textContent = { final: '1930 월드컵 결승 — 우루과이 vs 아르헨티나 (에스타디오 센테나리오)', friendly: '친선경기', shootout: '승부차기', practice: '연습모드', versus: '2인 대전' }[kind];
    $('optSide').disabled = kind === 'versus';
    $('optRules').value = kind === 'final' ? 'historical_1930' : $('optRules').value;
    $('optIntro').value = kind === 'final' ? '1' : '0';
    show('setup');
  }
  $('btnStart').onclick = () => {
    A.sfx.ui();
    startMatch({ kind: S.setupKind, side: +$('optSide').value, rules: $('optRules').value, half: +$('optHalf').value, time: $('optTime').value, wx: $('optWeather').value, f: [$('optF0').value, $('optF1').value], intro: $('optIntro').value === '1' });
  };

  // 설정
  $('volMusic').oninput = e => { A.state.musicVolume = +e.target.value; };
  $('volSfx').oninput = e => { A.state.sfxVolume = +e.target.value; };
  $('optShuffle').onchange = e => { A.state.shuffle = e.target.value === '1'; };
  $('optVoice').onchange = e => { A.state.voice = e.target.value === '1'; };
  $('optQuality').onchange = e => { S.quality = e.target.value; renderer.shadowMap.enabled = S.quality === 'high'; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); };
  document.querySelectorAll('#settings input[type=file]').forEach(inp => inp.onchange = () => { A.init(); A.addFiles(inp.dataset.cat, inp.files); refreshPlaylistInfo(); if (inp.dataset.cat === 'menu') A.playCategory('menu'); });
  function refreshPlaylistInfo() {
    const p = A.state.playlists;
    $('playlistInfo').innerHTML = `재생목록 — 메뉴 ${p.menu.length}곡 · 입장 ${p.entrance.length}곡 · 시상식 ${p.ceremony.length}곡` + (A.state.current ? ` · 재생 중: ${A.state.current.name}` : ' · (등록된 음악 없음: 무음)');
  }

  // ---------------- 편집 모드 ----------------
  const RK = ['overall', 'speed', 'acceleration', 'shooting', 'finishing', 'long_shots', 'passing', 'dribbling', 'ball_control', 'skill_moves', 'heading', 'defending', 'tackling', 'physical', 'stamina', 'jumping', 'free_kick', 'penalty', 'goalkeeping'];
  const RK_KO = ['종합', '스피드', '가속', '슈팅', '결정력', '중거리', '패스', '드리블', '볼컨트롤', '개인기', '헤딩', '수비', '태클', '몸싸움', '체력', '점프', '프리킥', '페널티', 'GK'];
  function buildEditor() {
    const sel = $('edSquad'); sel.innerHTML = Object.keys(DATA.squads).map(k => `<option value="${k}">${teamInfo(DATA.squads[k].team_id).name_ko} ${DATA.squads[k].tournament_year}</option>`).join('');
    sel.onchange = renderEditor; renderEditor();
  }
  function renderEditor() {
    const sq = DATA.squads[$('edSquad').value];
    let h = '<tr><th>선수</th><th>포지션</th><th>등번호</th><th>생년월일/신장</th>' + RK_KO.map(k => `<th>${k}</th>`).join('') + '</tr>';
    sq.players.forEach((p, i) => {
      h += `<tr><td>${p.name_ko}${p.captain ? ' (C)' : ''}<br><small class="note">${p.name_en}</small></td><td>${p.position_group}<br><small class="note">${p.position_role_1930}</small></td><td><small class="note">1930 미사용</small></td><td><small class="note">${p.birth_date || '미확인'} / ${p.height_cm || '미확인'}</small></td>` +
        RK.map(k => `<td><input type="number" min="1" max="99" data-i="${i}" data-k="${k}" value="${p.ratings[k]}"></td>`).join('') + '</tr>';
    });
    $('edTable').innerHTML = h;
    $('edTable').querySelectorAll('input').forEach(inp => inp.onchange = () => { const v = Math.max(1, Math.min(99, Math.round(+inp.value || 1))); inp.value = v; sq.players[+inp.dataset.i].ratings[inp.dataset.k] = v; sq.players[+inp.dataset.i].ratings_meta.edited_by_user = true; });
  }
  $('edExport').onclick = () => {
    const sq = DATA.squads[$('edSquad').value];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sq, null, 1)], { type: 'application/json' }));
    a.download = `${sq.team_id}.json`; a.click();
  };
  $('edReset').onclick = () => { const k = $('edSquad').value; DATA.squads[k] = JSON.parse(JSON.stringify(ORIGINAL_SQUADS[k])); renderEditor(); };

  // ---------------- 조 추첨식 ----------------
  function startDraw() {
    show('draw'); setEnvironment('night', 'clear'); placeHost('center', 'present');
    const groups = {}; TOUR.teams.forEach(t => (groups[t.group] = groups[t.group] || []).push(t));
    const board = $('drawBoard'); board.innerHTML = '';
    const order = [];
    Object.keys(groups).sort().forEach(g => {
      const pot = document.createElement('div'); pot.className = 'pot'; pot.innerHTML = `<h4>${g}조</h4>`;
      groups[g].forEach(t => { const d = document.createElement('div'); d.textContent = `${t.name_ko} (${t.name_en})`; pot.appendChild(d); order.push(d); });
      board.appendChild(pot);
    });
    order.sort(() => Math.random() - 0.5).forEach((d, i) => setTimeout(() => { if (S.screen === 'draw') { d.classList.add('in'); A.sfx.ui(); hostAnim.state = i % 2 ? 'present' : 'declare'; } }, 700 + i * 650));
    S.drawCam = 0;
  }

  // ---------------- 경기 시작 ----------------
  function clearMatch() {
    S.models.forEach(m => scene.remove(m)); S.models = []; S.match = null; S.replay = null; S.replayBuf = []; S.ticker = [];
    $('ticker').innerHTML = '';
  }
  function startMatch(cfg) {
    clearMatch(); A.stopMusic();
    S.cfg = cfg;
    const rules = DATA.rules[cfg.rules];
    const m = new WFCMatch.Match({ homeSquad: DATA.squads['URU-1930'], awaySquad: DATA.squads['ARG-1930'], rules, halfSeconds: cfg.half, seed: (Math.random() * 1e9) | 0, knockout: cfg.kind === 'final' || cfg.kind === 'shootout', formation: cfg.f });
    S.match = m;
    // 컨트롤러 배정
    if (cfg.kind === 'versus') { m.teams[0].controller = { scheme: 'p1', pad: 0 }; m.teams[1].controller = { scheme: 'p2', pad: 1 }; }
    else if (cfg.side >= 0) m.teams[cfg.side].controller = { scheme: 'p1solo', pad: 0 };
    // 모델 생성 (공통 리그 + 선수 데이터 + 킷 데이터)
    m.teams.forEach(t => t.players.forEach(p => { const mdl = M.buildPlayer(p.data, kitOf(t.id), p.gk); p.model = mdl; scene.add(mdl); S.models.push(mdl); }));
    // 컨트롤 표시 링
    S.rings = [0, 1].map(i => { const r = new T.Mesh(new T.RingGeometry(0.5, 0.65, 24), new T.MeshBasicMaterial({ color: i ? 0xff7043 : 0xffd34d, side: T.DoubleSide, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.visible = false; scene.add(r); S.models.push(r); return r; });
    const commentary = WFCCommentary.make(id => teamInfo(id).name_ko);
    m.on(e => onMatchEvent(e, commentary));
    if (cfg.kind === 'practice') {
      m.teams[1].players.forEach(p => { if (!p.gk) { p.sentOff = true; p.p.x = 0; p.p.z = 60; } });
      m.o.halfSeconds = 1e9;
    }
    setEnvironment(cfg.time, cfg.wx);
    $('t0').textContent = m.teams[0].id; $('t1').textContent = m.teams[1].id;
    $('sw0').style.background = kitOf(m.teams[0].id).shirt.colors[0];
    $('sw1').style.background = `linear-gradient(90deg, ${kitOf('ARG').shirt.colors.join(',')}, ${kitOf('ARG').shirt.colors[0]})`;
    ballMesh.visible = true; trophy.visible = false;
    show(null); $('hud').classList.remove('hidden');
    if (cfg.kind === 'final') placeHost('vip', 'sit'); else host.visible = podium.visible = false;
    A.crowd(0.4);
    const go = () => {
      if (cfg.kind === 'shootout') { m.phase = 'kickoff'; m.beginShootout(); }
      else m.phase = 'kickoff';
      S.seq = null; caption(null); $('skipHint').classList.add('hidden');
      if (cfg.kind === 'final') placeHost('vip', 'sit'); else host.visible = podium.visible = false;
    };
    if (cfg.intro) runSequence(openingSequence(m), go); else go();
  }

  // ---------------- 연출 시퀀스 (오프닝/선언/선수소개/시상식/폐막) ----------------
  function runSequence(steps, done) {
    S.seq = { steps, i: -1, t: 0, done };
    $('skipHint').classList.remove('hidden');
    nextStep();
  }
  function nextStep() {
    const q = S.seq; if (!q) return;
    if (q.cur && q.cur.exit) q.cur.exit();
    q.i++; q.t = 0;
    if (q.i >= q.steps.length) { const d = q.done; S.seq = null; caption(null); $('skipHint').classList.add('hidden'); d && d(); return; }
    q.cur = q.steps[q.i]; q.cur.enter && q.cur.enter(); caption(q.cur.caption || null);
  }
  function lineupPanel(team, side) {
    const el = document.createElement('div'); el.className = 'lineup'; el.style[side] = '3vw';
    const sq = team.squad;
    el.innerHTML = `<h3>${teamInfo(team.id).name_ko} — ${team.formation}</h3><table>` + team.players.map(p => `<tr><td>${p.data.position_group}</td><td>${p.name}${p.data.captain ? ' (C)' : ''}</td><td class="ovr">${p.r.overall}</td><td class="est">추정</td></tr>`).join('') +
      `</table><div class="note">감독: ${sq.coaches_ko.join(', ')} · 등번호: 1930 대회 미사용</div>`;
    document.body.appendChild(el); return el;
  }
  function openingSequence(m) {
    const els = [];
    return [
      { dur: 4, caption: 'WONKILAND FC 2026\n1930 제1회 월드컵 결승 · 에스타디오 센테나리오, 몬테비데오', enter() { placeHost('center', 'wave'); ballMesh.visible = false; A.playCategory('entrance'); A.crowd(0.6); tunnel(m); },
        cam(t) { const a = t * 0.35; return [new T.Vector3(Math.cos(a) * 95, 38 - t * 3, Math.sin(a) * 75), new T.Vector3(0, 2, 0)]; } },
      { dur: 5, caption: '대회 개최자 장원기\n"원기랜드 월드컵 결승전의 개최를 선언합니다!"', enter() { hostAnim.state = 'declare'; A.speak('대회 개최자 장원기. 원기랜드 월드컵 결승전의 개최를 선언합니다!', true); },
        update(t) { if (t > 1.2 && !this.fw) { this.fw = 1; for (let i = 0; i < 4; i++) setTimeout(() => firework((Math.random() - 0.5) * 60, 30 + Math.random() * 10, (Math.random() - 0.5) * 40, [0xffd34d, 0x7fb8e6, 0xffffff][i % 3]), i * 400); } },
        cam(t) { return [new T.Vector3(0.6, 2.3, 3.6 - t * 0.12), new T.Vector3(0, 2.1, 0)]; } },
      { dur: 3, caption: '개막식 — 양 팀 선수 입장', enter() { hostAnim.state = 'clap'; lineUp(m); },
        cam(t) { return [new T.Vector3(-20 + t * 6, 4, 18), new T.Vector3(-8 + t * 6, 1.4, 3)]; } },
      { dur: 5, caption: null, enter() { els.push(lineupPanel(m.teams[0], 'left')); A.speak('우루과이 선발 명단', true); },
        cam(t) { return [new T.Vector3(-14 + t * 2.4, 2.2, 11), new T.Vector3(-14 + t * 2.4, 1.5, 3)]; }, exit() { els.forEach(e => e.remove()); } },
      { dur: 5, caption: null, enter() { els.push(lineupPanel(m.teams[1], 'right')); A.speak('아르헨티나 선발 명단', true); },
        cam(t) { return [new T.Vector3(2 + t * 2.4, 2.2, 11), new T.Vector3(2 + t * 2.4, 1.5, 3)]; }, exit() { els.forEach(e => e.remove()); } },
      { dur: 3, caption: `주심: ${TOUR.matches[0].referee.name_en} (벨기에)\n※ 역사 기록은 출처 확인 전 단계(needs_citation)`, enter() { m.resetKickoff(0); placeHost('vip', 'sit'); ballMesh.visible = true; },
        cam(t) { return [new T.Vector3(0, 40 - t * 4, 62), new T.Vector3(0, 0, 0)]; } }
    ];
  }
  function lineUp(m) { // 개최자 단상 앞에 양 팀 정렬 (카메라 쪽 +z를 바라봄)
    m.teams.forEach((t, ti) => t.players.forEach((p, k) => { p.p.x = (ti ? 2 : -14) + k * 1.1; p.p.z = 4; p.facing = Math.PI / 2; p.state = 'idle'; p.v.x = p.v.z = 0; }));
  }
  function tunnel(m) { // 입장 전: 터치라인 밖 대기
    m.teams.forEach((t, ti) => t.players.forEach((p, k) => { p.p.x = (ti ? 3 : -15) + k * 1.0; p.p.z = -PH.halfWidth - 2; p.facing = Math.PI / 2; p.state = 'idle'; p.v.x = p.v.z = 0; }));
  }
  function ceremonySequence(m) {
    const res = m.result, winner = res.winner ? m.teams.find(t => t.id === res.winner) : null;
    const cap = winner ? winner.players.find(p => p.data.captain) || winner.players[0] : null;
    return [
      { dur: 5, caption: winner ? `시상식 — 우승: ${teamInfo(winner.id).name_ko}\n개최자 장원기가 우승 트로피를 전달합니다.` : '경기 종료 — 무승부 (1930 규정: 재경기)', enter() {
          placeHost('ceremony', 'present'); A.stopMusic(); if (!A.playCategory('ceremony')) A.sfx.ceremony();
          trophy.visible = !!winner; trophy.position.set(-0.3, 1.6, PH.halfWidth - 6 + -0.55); trophy.scale.setScalar(1.6);
          m.allPlayers().forEach(p => { p.state = 'idle'; });
          if (cap) { cap.p.x = 0.6; cap.p.z = PH.halfWidth - 7; cap.facing = Math.PI / 2; cap.v.x = cap.v.z = 0; }
          if (winner) winner.players.forEach((p, k) => { if (p !== cap) { p.p.x = -6.5 + k * 1.3; p.p.z = PH.halfWidth - 11; p.facing = Math.PI / 2; } });
          ballMesh.visible = false;
        }, update(t) { if (t > 2.5 && cap && trophy.visible) { trophy.position.set(cap.p.x, 2.2 * cap.model.scale.y, cap.p.z); cap.state = 'celebrate'; } },
        cam(t) { return [new T.Vector3(0.2 + Math.sin(t * 0.3) * 1.5, 2.6, PH.halfWidth + 2.5), new T.Vector3(0, 1.6, PH.halfWidth - 7)]; } },
      { dur: 5, caption: winner ? `${teamInfo(winner.id).name_ko}, 원기랜드 월드컵 우승!` : '', enter() {
          for (let i = 0; i < 8; i++) setTimeout(() => firework((Math.random() - 0.5) * 70, 28 + Math.random() * 12, (Math.random() - 0.5) * 50, [0xffd34d, 0xff5a5a, 0x7fb8e6, 0xffffff][i % 4]), i * 500);
          if (cap) cap.anim.state = 'hold_trophy'; hostAnim.state = 'clap';
        }, update() { if (cap) { cap.state = 'celebrate'; } },
        cam(t) { return [new T.Vector3(Math.sin(t * 0.4) * 8, 3 + t * 0.5, PH.halfWidth - 6 + 9), new T.Vector3(0, 2, PH.halfWidth - 6.5)]; } },
      { dur: 5, caption: '폐막식\n개최자 장원기: "1930년부터 2026년까지, 원기랜드의 FC 2026은 계속됩니다!"', enter() { hostAnim.state = 'wave'; A.speak('원기랜드의 FC 2026은 계속됩니다!', true); for (let i = 0; i < 10; i++) setTimeout(() => firework((Math.random() - 0.5) * 90, 30 + Math.random() * 15, (Math.random() - 0.5) * 60, 0xffffff * Math.random()), i * 400); },
        cam(t) { return [new T.Vector3(0, 30 + t * 4, PH.halfWidth + 40 + t * 4), new T.Vector3(0, 0, PH.halfWidth - 6)]; } }
    ];
  }

  // ---------------- 경기 이벤트 → 연출/사운드/해설 ----------------
  function onMatchEvent(e, commentary) {
    const m = S.match;
    if (e.type === 'shot' || e.type === 'pass' || e.type === 'cross' || e.type === 'throw_in_taken' || e.type === 'gk_throw') A.sfx.kick(e.type === 'shot' ? 0.9 : 0.4);
    if (e.type === 'woodwork') A.sfx.post();
    if (e.type === 'net') A.sfx.net();
    if (e.type === 'bounce' && m && m.ball.v.y > 2) A.sfx.bounce();
    if (e.type === 'whistle' || e.type === 'foul' || e.type === 'offside') A.sfx.whistle(e.kind || 'foul');
    if (e.type === 'goal' || e.type === 'goal_shootout') {
      A.sfx.goal(); toast(e.type === 'goal' ? 'GOAL!' : '성공!');
      const ti = m.teams.findIndex(t => t.id === e.team); S.excitement[ti] = 1; S.excitement[2] = 1;
      if (S.cfg.kind === 'final') hostAnim.state = 'clap';
      if (e.type === 'goal') S.pendingReplay = 2.2; // 세리머니 후 슬로모션 리플레이
    }
    if (e.type === 'save') S.excitement[2] = Math.max(S.excitement[2], 0.6);
    if (e.type === 'full_time') { setTimeout(() => showResults(), 2500); }
    const c = commentary(e);
    if (c) { pushTicker(c.text); if (c.speak) A.speak(c.text, c.prio); }
  }
  function pushTicker(text) {
    const el = document.createElement('div'); el.textContent = text; $('ticker').appendChild(el);
    while ($('ticker').children.length > 4) $('ticker').firstChild.remove();
    setTimeout(() => el.remove(), 7000);
  }
  let toastTimer;
  function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200); }

  // ---------------- 결과 화면 ----------------
  function showResults() {
    const m = S.match; if (!m || S.screen === 'results') return;
    const sum = m.summary(), [a, b] = sum.teams, r = m.result;
    $('resTitle').textContent = `경기 결과 — ${teamInfo(a.id).name_ko} ${a.score} : ${b.score} ${teamInfo(b.id).name_ko}` + (r.shootout ? ` (승부차기 ${r.shootout.join(':')})` : '') + (r.kind === 'replay_required' ? ' · 재경기 필요 (1930 규정)' : '');
    const poss = a.stats.possession + b.stats.possession || 1;
    const rows = [['점유율', Math.round(a.stats.possession / poss * 100) + '%', Math.round(b.stats.possession / poss * 100) + '%'], ['슈팅', a.stats.shots, b.stats.shots], ['유효슈팅', a.stats.onTarget, b.stats.onTarget], ['패스(성공)', `${a.stats.passes} (${a.stats.passesOk})`, `${b.stats.passes} (${b.stats.passesOk})`], ['코너킥', a.stats.corners, b.stats.corners], ['오프사이드', a.stats.offsides, b.stats.offsides], ['파울', a.stats.fouls, b.stats.fouls], ['경고/퇴장', `${a.stats.yellow}/${a.stats.red}`, `${b.stats.yellow}/${b.stats.red}`], ['선방', a.stats.saves, b.stats.saves]];
    let h = `<div class="statgrid">${rows.map(r => `<div>${r[1]}</div><div>${r[0]}</div><div>${r[2]}</div>`).join('')}</div>`;
    h += `<h3>득점 기록</h3><p>${(sum.goals.length ? sum.goals.map(g => `${g.minute}' ${g.scorer}${g.own ? ' (자책)' : ''} [${teamInfo(g.team).name_ko}]${g.assist ? ' · 도움 ' + g.assist : ''}`).join('<br>') : '득점 없음')}</p>`;
    h += '<div class="res-cols">' + sum.teams.map(t => `<div><h3>${teamInfo(t.id).name_ko} 선수 평점</h3><table><tr><th>선수</th><th>평점</th><th>골</th><th>도움</th><th>슈팅</th><th>패스</th><th>태클</th><th>선방</th></tr>${t.players.map(p => `<tr><td>${p.name}</td><td><b>${p.rating}</b></td><td>${p.goals}</td><td>${p.assists}</td><td>${p.shots}</td><td>${p.passes}</td><td>${p.tackles}</td><td>${p.saves}</td></tr>`).join('')}</table></div>`).join('') + '</div>';
    h += `<p class="note">참고: 실제 1930 결승 결과 — 우루과이 4 : 2 아르헨티나 (득점: 도라도 12', 페우셀레 20', 스타빌레 37', 세아 57', 이리아르테 68', 카스트로 89') · 출처 첨부 필요</p>`;
    $('resBody').innerHTML = h;
    $('btnCeremony').disabled = !(S.cfg.kind === 'final' || S.cfg.kind === 'shootout' || S.cfg.kind === 'friendly' || S.cfg.kind === 'versus');
    show('results'); $('hud').classList.add('hidden');
  }
  $('btnCeremony').onclick = () => { show(null); runSequence(ceremonySequence(S.match), () => toTitle()); };
  $('btnToTitle').onclick = () => toTitle();

  // ---------------- 일시정지 ----------------
  function pause(on) {
    const m = S.match; if (!m) return;
    S.paused = on;
    if (on) {
      const t = m.teams.find(t => t.controller) || m.teams[0];
      $('pF').value = t.formation; $('pM').value = t.mentality; $('pCam').value = S.camMode; $('pWeather').value = S.env.wx; $('pTime').value = S.env.time;
      $('subInfo').textContent = m.rules.substitutions === 0 ? '선수 교체: 1930 규칙에서는 교체가 허용되지 않습니다.' : '선수 교체: 현대 규칙은 5명까지 가능하지만, 1930 등록 명단 중 교체 선수 데이터가 아직 수록되지 않아 교체할 수 없습니다.';
      show('pause');
    } else { show(null); $('hud').classList.remove('hidden'); }
  }
  $('btnResume').onclick = () => pause(false);
  $('btnQuit').onclick = () => { S.paused = false; toTitle(); };
  $('pF').onchange = e => { const t = S.match.teams.find(t => t.controller) || S.match.teams[0]; t.formation = e.target.value; pushTicker(`포메이션 변경: ${t.formation}`); };
  $('pM').onchange = e => { const t = S.match.teams.find(t => t.controller) || S.match.teams[0]; t.mentality = e.target.value; pushTicker('전술 변경: ' + e.target.selectedOptions[0].text); };
  $('pCam').onchange = e => { S.camMode = +e.target.value; };
  $('pWeather').onchange = $('pTime').onchange = () => setEnvironment($('pTime').value, $('pWeather').value);

  // ---------------- 리플레이 ----------------
  function snapshot(m) {
    return { b: [m.ball.p.x, m.ball.p.y, m.ball.p.z], p: m.teams.flatMap(t => t.players.map(p => [p.p.x, p.p.z, p.facing, p.anim.state, p.anim.t, p.anim.phase, p.anim.speed, p.anim.dir || 1, p.anim.high, p.sentOff])) };
  }
  function startReplay() {
    if (S.replayBuf.length < 30) return;
    S.replay = { frames: S.replayBuf.slice(-270), i: 0, f: 0 };
    caption('리플레이 (슬로모션)'); $('skipHint').classList.remove('hidden');
  }

  // ---------------- 카메라 ----------------
  function matchCamera(m, dt) {
    const b = m.ball.p; let pos, look;
    const ctrl = m.teams.map(t => t.controlled).find(Boolean);
    switch (S.camMode) {
      case 0: pos = new T.Vector3(b.x * 0.82, 26, 50 + Math.abs(b.z) * 0.15); look = new T.Vector3(b.x * 0.9, 0, b.z * 0.45); break;
      case 1: pos = new T.Vector3(b.x * 0.6, 48, 80); look = new T.Vector3(b.x * 0.75, 0, b.z * 0.3); break;
      case 2: { const pl = ctrl || m.possessor || m.teams[0].players[8]; const side = pl.team.side; pos = new T.Vector3(pl.p.x - side * 13, 6.5, pl.p.z * 0.9); look = new T.Vector3(pl.p.x + side * 10, 0.5, pl.p.z); break; }
      case 3: pos = new T.Vector3(b.x, 75, b.z + 8); look = new T.Vector3(b.x, 0, b.z); break;
    }
    if (m.phase === 'setpiece' && m.setPiece && m.setPiece.type === 'penalty') { const gx = m.goalX(m.setPiece.team); pos = new T.Vector3(gx - Math.sign(gx) * 22, 4, 0.01); look = new T.Vector3(gx, 1, 0); }
    if (m.phase === 'goal' && !m.shootout) { const sc = m.lastTouch || m.teams[0].players[8]; pos = new T.Vector3(sc.p.x + 4, 2.2, sc.p.z + 5); look = new T.Vector3(sc.p.x, 1.4, sc.p.z); }
    return [pos, look];
  }
  function applyCam(pos, look, dt, snap) {
    const k = snap ? 1 : 1 - Math.exp(-dt * 3.5);
    S.camPos.lerp(pos, k); S.camLook.lerp(look, k);
    camera.position.copy(S.camPos); camera.lookAt(S.camLook);
  }

  // ---------------- 렌더 동기화 ----------------
  const tmpQ = new T.Quaternion(), axis = new T.Vector3();
  function syncModels(m, dt) {
    for (const t of m.teams) for (const p of t.players) {
      const mdl = p.model; mdl.visible = !p.sentOff;
      mdl.position.set(p.p.x, 0, p.p.z); mdl.rotation.y = Math.PI / 2 - p.facing;
      M.animate(mdl, p.anim, dt);
    }
    const b = m.ball;
    ballMesh.position.set(b.p.x, b.p.y, b.p.z);
    const sp = Math.hypot(b.v.x, b.v.z);
    if (sp > 0.05) { axis.set(b.v.z, 0, -b.v.x).normalize(); tmpQ.setFromAxisAngle(axis, sp * dt / WFCPhysics.BALL.radius); ballMesh.quaternion.premultiply(tmpQ); }
    m.teams.forEach((t, i) => { const r = S.rings[i]; const c = t.controller && t.controlled; r.visible = !!c && m.phase !== 'fulltime'; if (c) r.position.set(c.p.x, 0.03, c.p.z); });
  }
  function syncReplayFrame(m, fr, dt) {
    let k = 0;
    for (const t of m.teams) for (const p of t.players) {
      const s = fr.p[k++]; const mdl = p.model; mdl.visible = !s[9];
      mdl.position.set(s[0], 0, s[1]); mdl.rotation.y = Math.PI / 2 - s[2];
      M.animate(mdl, { state: s[3], t: s[4], phase: s[5], speed: s[6], dir: s[7], high: s[8], power: 0.8 }, dt);
    }
    ballMesh.position.set(fr.b[0], fr.b[1], fr.b[2]);
  }

  // ---------------- HUD ----------------
  const radar = $('radar').getContext('2d');
  function drawHUD(m, inputs) {
    $('s0').textContent = m.teams[0].score; $('s1').textContent = m.teams[1].score;
    const add = m.clockSec > m.halfLen() ? `+${Math.ceil((m.clockSec - m.halfLen()) / m.halfLen() * (m.half <= 2 ? 45 : 15))}` : '';
    $('clock').textContent = m.shootout ? `PK ${m.shootout.score[0]}-${m.shootout.score[1]}` : S.cfg.kind === 'practice' ? '연습' : `${Math.min(m.minute(), [0, 45, 90, 105, 120][m.half])}'${add}`;
    const ctrls = m.teams.filter(t => t.controller && t.controlled).map(t => `${t.id}: ${t.controlled.name} (${t.controlled.data.position_group})`);
    const sp = m.setPiece && m.phase !== 'play' ? ` · ${{ kickoff: '킥오프', throw_in: '스로인', corner: '코너킥', goal_kick: '골킥', free_kick: '프리킥', penalty: '페널티킥' }[m.setPiece.type]}` : '';
    $('hudInfo').textContent = ctrls.join(' | ') + sp + (m.rules.id === 'historical_1930' ? ' · 1930 규칙' : ' · 현대 규칙');
    const charge = Math.max(...inputs.map(i => (i && i.charging) || 0), 0);
    $('powerBar').style.width = (charge * 100) + '%';
    // 레이더 (미니맵)
    const W = 210, H = 136; radar.clearRect(0, 0, W, H);
    radar.strokeStyle = '#ffffff66'; radar.strokeRect(4, 4, W - 8, H - 8); radar.beginPath(); radar.moveTo(W / 2, 4); radar.lineTo(W / 2, H - 4); radar.stroke();
    const X = x => W / 2 + x / PH.halfLength * (W / 2 - 4), Z = z => H / 2 + z / PH.halfWidth * (H / 2 - 4);
    m.teams.forEach((t, i) => { radar.fillStyle = i ? '#e8f1ff' : '#7fb8e6'; t.players.forEach(p => { if (p.sentOff) return; radar.beginPath(); radar.arc(X(p.p.x), Z(p.p.z), t.controlled === p && t.controller ? 4 : 2.6, 0, 7); radar.fill(); }); });
    radar.fillStyle = '#ffd34d'; radar.beginPath(); radar.arc(X(m.ball.p.x), Z(m.ball.p.z), 2.4, 0, 7); radar.fill();
  }

  // ---------------- 입력 → 경기 좌표 변환 ----------------
  function toWorldMove(inp) {
    // 화면 기준 입력을 카메라 방향 기준 지면 벡터로 변환
    const fwd = new T.Vector3(); camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    const right = new T.Vector3(-fwd.z, 0, fwd.x);
    const x = inp.sx, y = -inp.sy;
    const v = { x: right.x * x + fwd.x * y, z: right.z * x + fwd.z * y };
    const l = Math.hypot(v.x, v.z); if (l > 1) { v.x /= l; v.z /= l; }
    return v;
  }

  // ---------------- 메인 루프 ----------------
  function skipPressed() { return I.keyPressed('Enter') || I.keyPressed('Space') || I.keyPressed('Escape') || S.clickSkip || I.padStart(); }
  canvas.addEventListener('click', () => { S.clickSkip = true; });
  function frame(now) {
    const dt = Math.min(0.25, (now - S.lastFrame) / 1000); S.lastFrame = now; S.t += dt;
    try { tick(dt); } catch (err) { console.error(err); }
    S.clickSkip = false; I.endFrame();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function tick(dt) {
    const m = S.match;
    hostAnim.phase += dt; M.animate(host, hostAnim, dt);
    weather.update(dt); updateFireworks(dt);
    S.excitement = S.excitement.map(e => Math.max(0, e - dt * 0.12));
    if (m) { const bx = m.ball.p.x; S.excitement[2] = Math.max(S.excitement[2], Math.max(0, (Math.abs(bx) - 30) / 22) * 0.5); }
    M.updateCrowd(stadium, S.t, S.excitement);
    if (I.keyPressed('KeyH') && S.screen !== 'help' && m) { /* HUD 도움말 토글은 메뉴에서 */ }

    // 연출 시퀀스
    if (S.seq) {
      const q = S.seq, st = q.cur; q.t += dt;
      st.update && st.update.call(st, q.t);
      if (m) { m.allPlayers().forEach(p => { if (!S.replay) { m.tickPlayer(p, dt, false); p.desired = { x: 0, z: 0 }; } }); syncModels(m, dt); }
      if (st.cam) { const [p, l] = st.cam(q.t); applyCam(p, l, dt, q.t < dt * 1.5); }
      if (q.t >= st.dur || skipPressed()) nextStep();
      return;
    }
    if (S.screen === 'title' || S.screen === 'modes' || S.screen === 'setup' || S.screen === 'settings' || S.screen === 'editor' || S.screen === 'help') {
      const a = S.t * 0.12; applyCam(new T.Vector3(Math.sin(a) * 5.5, 2.4, Math.cos(a) * 5.5), new T.Vector3(0, 1.9, 0), dt);
      host.rotation.y = 0; $('padInfo').textContent = I.padsConnected().length ? '게임패드 연결됨: ' + I.padsConnected().length + '개' : '게임패드 미연결 (키보드 사용)';
      return;
    }
    if (S.screen === 'draw') { const a = S.t * 0.08; applyCam(new T.Vector3(3 + Math.sin(a) * 1.5, 2.3, 5.5), new T.Vector3(1.8, 1.8, 0), dt); return; }
    if (!m) return;
    if (S.screen === 'results') { applyCam(new T.Vector3(0, 60, 70), new T.Vector3(0, 0, 0), dt); return; }

    // 일시정지
    if ((I.keyPressed('Escape') || I.keyPressed('KeyP') || I.padStart()) && !S.replay) { pause(!S.paused); return; }
    if (S.paused) return;
    // 카메라 전환
    ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach((k, i) => { if (I.keyPressed(k)) S.camMode = i; });
    if (I.keyPressed('KeyR') && !S.replay) startReplay();

    // 리플레이 재생
    if (S.replay) {
      const r = S.replay; r.f += dt * 30 * 0.4; // 0.4배속 슬로모션
      const fr = r.frames[Math.min(r.frames.length - 1, Math.floor(r.f))];
      syncReplayFrame(m, fr, dt * 0.4);
      const ang = S.t * 0.2; applyCam(new T.Vector3(fr.b[0] + Math.cos(ang) * 9, 3.2, fr.b[2] + Math.sin(ang) * 9 + 4), new T.Vector3(fr.b[0], 0.8, fr.b[2]), dt);
      if (r.f >= r.frames.length - 1 || skipPressed()) { S.replay = null; caption(null); $('skipHint').classList.add('hidden'); syncModels(m, 0); }
      return;
    }
    if (S.pendingReplay !== undefined && S.pendingReplay !== null) { S.pendingReplay -= dt; if (S.pendingReplay <= 0) { S.pendingReplay = null; startReplay(); } }

    // 입력
    const inputs = [null, null];
    m.teams.forEach((t, i) => {
      if (!t.controller) return;
      const raw = I.poll(i, t.controller.scheme, t.controller.pad, dt);
      const mv = toWorldMove(raw);
      inputs[i] = Object.assign(raw, { move: mv });
    });
    // 고정 시간 간격 서브스텝: 프레임레이트가 낮은 PC에서도 경기 속도가 실제 시간과 같게 유지됨
    let acc = dt, first = true;
    while (acc > 1e-4) {
      const h = Math.min(acc, 1 / 60); acc -= h;
      m.update(h, inputs);
      if (first) { first = false; inputs.forEach(i => { if (i) { i.passPressed = i.throughPressed = i.lobPressed = i.switchPressed = i.shootPressed = i.shootReleased = false; } }); }
    }
    if (m.phase !== 'goal' && m.phase !== 'fulltime') { S.replayBuf.push(snapshot(m)); if (S.replayBuf.length > 300) S.replayBuf.shift(); }
    syncModels(m, dt);
    if (S.cfg.kind === 'final' && host.visible) { if (hostAnim.state === 'clap' && S.excitement[2] < 0.3) hostAnim.state = 'sit'; }
    A.crowd(0.3 + Math.max(...S.excitement) * 0.6);
    const [p, l] = matchCamera(m, dt); applyCam(p, l, dt);
    drawHUD(m, inputs);
  }

  toTitle();
  requestAnimationFrame(frame);
  // 테스트 훅
  window.WFC.startMatch = startMatch; window.WFC.toTitle = toTitle; window.WFC.showResults = showResults; window.WFC.startDraw = startDraw;
  window.WFC.runCeremony = () => { show(null); runSequence(ceremonySequence(S.match), () => toTitle()); };
})();
