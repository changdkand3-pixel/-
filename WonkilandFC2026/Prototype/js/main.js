// 원기랜드의 FC 2026 — 프로토타입 메인: 렌더링, 화면 흐름, 연출, HUD, 리플레이
(function () {
  'use strict';
  THREE.ColorManagement.legacyMode = false; // 16진 색상을 sRGB로 해석 (색이 바래 보이는 문제 방지)
  const T = THREE, M = WFCModels, A = WFCAudio, I = WFCInput, PH = WFCPhysics.PITCH;
  const DATA = window.WFC_DATA;
  const $ = id => document.getElementById(id);
  const W = WFCDataAPI.create(DATA); // 10,973명 선수 데이터 계층
  const label = id => (S.labels && S.labels[id]) || id;

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
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 50, bottom: -50, near: 10, far: 220 }); scene.add(sun);
  const nightLights = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new T.SpotLight(0xf4f6ff, 0, 220, 0.6, 0.5); l.position.set(sx * (PH.halfLength + 14), 31, sz * (PH.halfWidth + 20)); l.target.position.set(sx * 20, 0, 0); scene.add(l, l.target); nightLights.push(l); }
  scene.add(sun.target);
  // ---- 실사풍 렌더링: 환경광(반사) + 대기 산란 하늘 + 밤하늘 별 + 후처리 ----
  const AD = T.Addons;
  const pmrem = new T.PMREMGenerator(renderer);
  const dayEnv = pmrem.fromScene(new AD.RoomEnvironment(), 0.04).texture;
  scene.environment = dayEnv;
  const sky = new AD.Sky(); sky.scale.setScalar(700); scene.add(sky);
  const stars = (() => { const n = 1500, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 1.3 + 0.12, r = 650; p[i * 3] = Math.cos(a) * Math.cos(e) * r; p[i * 3 + 1] = Math.sin(e) * r; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3)); const pts = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })); pts.visible = false; scene.add(pts); return pts; })();
  const post = { composer: null };
  function setupPost(quality) {
    post.quality = quality;
    renderer.shadowMap.enabled = quality !== 'low';
    if (quality === 'low') { post.composer = null; return; }
    const c = new AD.EffectComposer(renderer);
    c.addPass(new AD.RenderPass(scene, camera));
    if (quality === 'high') {
      const sao = new AD.SAOPass(scene, camera, false, true);
      Object.assign(sao.params, { saoIntensity: 0.012, saoScale: 6, saoKernelRadius: 30, saoBlurRadius: 6, saoMinResolution: 0, saoBias: 0.5 });
      c.addPass(sao); post.sao = sao;
    }
    post.bloom = new AD.UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), 0.25, 0.6, 0.86); c.addPass(post.bloom);
    c.addPass(new AD.ShaderPass(AD.GammaCorrectionShader));
    post.fxaa = new AD.ShaderPass(AD.FXAAShader); c.addPass(post.fxaa);
    post.composer = c; resizePost();
  }
  function resizePost() {
    if (!post.composer) return;
    const pr = renderer.getPixelRatio(); post.composer.setSize(innerWidth, innerHeight);
    post.fxaa.material.uniforms.resolution.value.set(1 / (innerWidth * pr), 1 / (innerHeight * pr));
  }
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

  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); resizePost(); }
  addEventListener('resize', resize); resize();

  // ---------------- 환경 (시간대/날씨) ----------------
  function setEnvironment(time, wx) {
    const fogCol = wx !== 'clear' && time !== 'night' ? 0x8f99a5 : { day: 0xb9cde4, dusk: 0xd9a27c, night: 0x070b1a }[time];
    scene.environment = time === 'night' ? null : dayEnv; // 밤에는 주간 환경광 반사 제거
    // 대기 산란 하늘: 태양 고도에 따라 낮/해질녘 색이 물리적으로 계산됨
    const elev = time === 'day' ? 48 : time === 'dusk' ? 4 : -10, azim = 200;
    const sunDir = new T.Vector3().setFromSphericalCoords(1, T.MathUtils.degToRad(90 - elev), T.MathUtils.degToRad(azim));
    const u = sky.material.uniforms;
    u.sunPosition.value.copy(sunDir); u.turbidity.value = wx === 'clear' ? 4 : 14; u.rayleigh.value = time === 'dusk' ? 2.5 : 1.2; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.8;
    sky.visible = time !== 'night'; stars.visible = time === 'night' && wx === 'clear';
    scene.background = time === 'night' ? new T.Color(0x05070f) : null;
    scene.fog = new T.Fog(fogCol, 160, wx === 'clear' ? 600 : 220);
    S.sunOffset = sunDir.clone().multiplyScalar(110); if (S.sunOffset.y < 25) S.sunOffset.y = 25;
    sun.intensity = time === 'day' ? 2.2 : time === 'dusk' ? 1.1 : 0.05;
    sun.color.set(time === 'dusk' ? 0xffa060 : 0xfff4e6);
    hemi.intensity = time === 'night' ? 0.35 : 0.25;
    renderer.toneMappingExposure = time === 'night' ? 0.9 : time === 'dusk' ? 0.55 : 0.5;
    if (post.bloom) { post.bloom.strength = time === 'night' ? 0.3 : 0.16; post.bloom.threshold = time === 'night' ? 0.92 : 0.86; }
    M.setWet(wx === 'rain');
    nightLights.forEach(l => { l.intensity = time === 'night' ? 1.6 : time === 'dusk' ? 0.4 : 0; l.decay = 0; });
    stadium.lightTowers.forEach(t => t.head.material.emissive.set(time === 'day' ? 0x000000 : 0xffffff));
    if (wx !== 'clear') { sun.intensity *= 0.45; hemi.intensity *= 1.4; }
    weather.set(wx);
    // 날씨가 공 물리에 영향: 젖은 잔디는 공이 더 미끄러지고, 눈은 더 빨리 멈춤
    WFCPhysics.BALL.rollFriction = wx === 'rain' ? 1.2 : wx === 'snow' ? 2.6 : 1.6;
    S.env = { time, wx };
  }

  // ---------------- 상태 ----------------
  const S = { screen: 'title', match: null, models: [], camMode: 0, camPos: new T.Vector3(0, 30, 60), camLook: new T.Vector3(), seq: null, replay: null, replayBuf: [], paused: false, setup: null, excitement: [0, 0, 0], ticker: [], quality: 'high', env: null, lastFrame: performance.now(), t: 0 };
  window.WFC = { S, DATA, get W() { return W; } }; // 디버그/테스트 접근용

  function show(id) {
    ['title', 'modes', 'setup', 'settings', 'editor', 'draw', 'help', 'pause', 'results', 'builder', 'history', 'gauntlet'].forEach(s => $(s).classList.toggle('hidden', s !== id));
    S.screen = id;
  }
  function caption(text) { const c = $('caption'); if (!text) { c.classList.add('hidden'); return; } c.textContent = text; c.classList.remove('hidden'); }

  // ---------------- 메인 타이틀 ----------------
  function toTitle() {
    clearMatch(); S.seq = null; caption(null); $('skipHint').classList.add('hidden'); $('hud').classList.add('hidden');
    document.querySelectorAll('.lineup').forEach(e => e.remove());
    setEnvironment('dusk', 'clear');
    placeHost('center', 'wave'); trophy.visible = false; ballMesh.visible = false; followShadow({ x: 0, z: 0 });
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
    else if (act === 'final1930') openSetup('final', { home: { type: 'national', key: 'URY-1930' }, away: { type: 'national', key: 'ARG-1930' } });
    else if (act === 'modes') { buildModes(); show('modes'); }
    else if (act === 'builder') openBuilder();
    else if (act === 'history') openHistory();
    else if (act === 'settings') { show('settings'); refreshPlaylistInfo(); }
    else if (act === 'editor') { buildEditor(); show('editor'); }
    else if (act === 'help') show('help');
    else if (act === 'draw') startDraw();
  });

  const MODES = [
    { id: 'history', name: '① 역대 월드컵 재현', st: 'part', desc: '1930–2022 실제 경기 964개 중 선택. 실제 대진·선발(1970~)·시대 규칙. 대회 전체 일정 진행은 미구현.', run: () => openHistory() },
    { id: 'era', name: '② 시대 초월 대전', st: 'ok', desc: '아무 연도·아무 나라끼리 대결 (예: 1970 브라질 vs 2002 대한민국).', run: () => openSetup('era', { home: { type: 'national', key: 'BRA-1970' }, away: { type: 'national', key: 'KOR-2002' } }) },
    { id: 'gauntlet', name: '③ 역대 월드컵 도장깨기', st: 'ok', desc: '역대 우승팀 22개를 1930년부터 순서대로 격파.', run: () => openGauntlet() },
    { id: 'nation', name: '④ 국가별 역대 올스타', st: 'ok', desc: '나라를 고르면 그 나라 역대 월드컵 최고 선수로 자동 구성 → 수정 가능.', run: () => openBuilder({ nationAuto: true }) },
    { id: 'world', name: '⑤ 세계 올스타 (드림팀)', st: 'ok', desc: '국적·시대 상관없이 10,973명 중 직접 선택.', run: () => openBuilder() },
    { id: 'friendly', name: '⑥ 친선경기', st: 'ok', desc: '팀·규칙·날씨·시간대 자유 선택.', run: () => openSetup('friendly') },
    { id: 'pk', name: '⑦ 승부차기', st: 'ok', desc: '5명씩 + 서든데스.', run: () => openSetup('shootout') },
    { id: 'practice', name: '⑧ 연습모드', st: 'ok', desc: '상대 골키퍼만 있는 자유 연습. 시간 제한 없음.', run: () => openSetup('practice') },
    { id: 'versus', name: '⑨ 2인 대전', st: 'ok', desc: '키보드 2인(WASD vs 방향키) 또는 게임패드 2개.', run: () => openSetup('versus') },
    { id: 'edit', name: '⑩ 선수 및 팀 편집', st: 'part', desc: '한글 이름·능력치 편집 + 보정 파일 내보내기. 외형/유니폼 편집은 미구현.', run: () => { buildEditor(); show('editor'); } }
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

  // ---------------- 공통: 팀 선택기 ----------------
  const FORMS = Object.keys(WFCMatch.FORMATIONS);
  const RULE_LABEL = id => { const r = DATA.rules[id]; return r ? `${{ historical_1930: '역사 규칙', historical_1970: '역사 규칙', historical_1982: '역사 규칙', historical_1990: '역사 규칙', historical_1998: '역사 규칙', modern: '현대 규칙' }[id]} (${r.era || ''})` : id; };
  $('optRules').innerHTML = '<option value="auto">자동 (홈 팀 시대 규칙)</option>' + Object.keys(DATA.rules).sort().map(id => `<option value="${id}">${RULE_LABEL(id)}</option>`).join('');
  for (const id of ['optF0', 'optF1']) $(id).innerHTML = '<option value="">자동 (시대별 대표 포메이션)</option>' + FORMS.map(f => `<option>${f}</option>`).join('');
  $('pF').innerHTML = FORMS.map(f => `<option>${f}</option>`).join('');
  const YEARS = W.years();
  function loadDreams() { try { return JSON.parse(localStorage.getItem('wfc.dreamteams.v1') || '[]'); } catch (e) { return S.dreamsMem || []; } }
  function saveDreams(list) { S.dreamsMem = list; try { localStorage.setItem('wfc.dreamteams.v1', JSON.stringify(list)); } catch (e) { /* 저장 불가 환경: 메모리에만 유지 */ } }
  function makePicker(root, initial) {
    const q = c => root.querySelector(c);
    const type = q('.pkType'), year = q('.pkYear'), team = q('.pkTeam'), dream = q('.pkDream'), info = q('.pkInfo');
    year.innerHTML = YEARS.slice().reverse().map(y => `<option value="${y}">${y} 월드컵</option>`).join('');
    const fillTeams = () => { team.innerHTML = W.teamsOf(+year.value).map(t => `<option value="${t.team_id}-${year.value}">${t.name_ko || t.name_en}${t.finish === 1 ? ' 🏆' : ''}</option>`).join(''); };
    const fillDreams = () => { const ds = loadDreams(); dream.innerHTML = ds.length ? ds.map(d => `<option value="${d.id}">${d.name}</option>`).join('') : '<option value="">(저장된 드림팀 없음)</option>'; };
    const refresh = () => {
      const nat = type.value === 'national';
      year.classList.toggle('hidden', !nat); team.classList.toggle('hidden', !nat); dream.classList.toggle('hidden', nat);
      const src = get();
      if (!src) { info.textContent = '드림팀 만들기에서 팀을 먼저 저장하세요.'; return; }
      const t = W.matchTeam(src);
      const avg = Math.round(t.players.slice(0, 11).reduce((a, p) => a + p.ratings.overall, 0) / 11);
      info.textContent = `평균 능력치 ${avg} · ${t.formation} · 선발 ${t.lineup_source || '능력치 기준 자동'}`;
    };
    const get = () => {
      if (type.value === 'national') return { type: 'national', key: team.value };
      const d = loadDreams().find(x => x.id === dream.value); return d ? Object.assign({ type: 'custom' }, d) : null;
    };
    const set = src => {
      if (!src) return;
      if (src.type === 'national') { type.value = 'national'; year.value = src.key.split('-')[1]; fillTeams(); team.value = src.key; }
      else { type.value = 'dream'; fillDreams(); dream.value = src.id; }
      refresh();
    };
    type.onchange = () => { fillDreams(); refresh(); }; year.onchange = () => { fillTeams(); refresh(); }; team.onchange = dream.onchange = refresh;
    fillTeams(); fillDreams();
    set(initial || { type: 'national', key: `${W.teamsOf(2022)[0].team_id}-2022` });
    return { get, set, refresh: () => { fillDreams(); refresh(); } };
  }
  const pk0 = makePicker($('pk0'), { type: 'national', key: 'URY-1930' });
  const pk1 = makePicker($('pk1'), { type: 'national', key: 'ARG-1930' });
  function openSetup(kind, preset) {
    S.setupKind = kind;
    $('setupTitle').textContent = { final: '테스트 경기: 1930 월드컵 결승 — 우루과이 vs 아르헨티나', era: '② 시대 초월 대전', friendly: '⑥ 친선경기', shootout: '⑦ 승부차기', practice: '⑧ 연습모드', versus: '⑨ 2인 대전', dream: '드림팀 경기' }[kind] || '경기 설정';
    pk0.refresh(); pk1.refresh();
    if (preset && preset.home) pk0.set(preset.home);
    if (preset && preset.away) pk1.set(preset.away);
    $('optSide').disabled = kind === 'versus';
    $('optRules').value = kind === 'final' ? 'historical_1930' : kind === 'era' || kind === 'dream' ? 'modern' : 'auto';
    $('optIntro').value = kind === 'final' || kind === 'dream' ? '1' : '0';
    show('setup');
  }
  function resolveRules(sel, home) { if (sel !== 'auto') return sel; return home.type === 'national' ? DATA.tournaments[home.key.split('-')[1]].rules_profile : 'modern'; }
  $('btnStart').onclick = () => {
    A.sfx.ui();
    const home = pk0.get(), away = pk1.get();
    if (!home || !away) { alert('팀을 선택하세요.'); return; }
    startMatch({ kind: S.setupKind, home, away, side: +$('optSide').value, rules: resolveRules($('optRules').value, home), half: +$('optHalf').value, time: $('optTime').value, wx: $('optWeather').value, f: [$('optF0').value || null, $('optF1').value || null], intro: $('optIntro').value === '1' });
  };

  // ---------------- 역대 경기 재현 ----------------
  function openHistory() {
    $('hYear').innerHTML = YEARS.slice().reverse().map(y => `<option value="${y}">${y} ${DATA.tournaments[y].host} 월드컵</option>`).join('');
    const STAGE = { 'group stage': '조별리그', 'second group stage': '2차 조별리그', 'round of 16': '16강', 'quarter-finals': '8강', 'semi-finals': '4강', 'third-place match': '3·4위전', final: '결승', 'final round': '결승 리그' };
    const fill = () => {
      const t = DATA.tournaments[$('hYear').value];
      $('hMatch').innerHTML = t.matches.slice().reverse().map(m => `<option value="${m.id}">${STAGE[m.stage] || m.stage}${m.group ? ' ' + m.group : ''} · ${W.teamLabel(m.home, t.year).replace(/ \d+$/, '')} ${m.score[0]}-${m.score[1]} ${W.teamLabel(m.away, t.year).replace(/ \d+$/, '')}${m.pens ? ` (PK ${m.pens.join('-')})` : ''}</option>`).join('');
      info();
    };
    const info = () => {
      const t = DATA.tournaments[$('hYear').value], m = t.matches.find(x => x.id === $('hMatch').value);
      const gl = m.goals.map(g => `${g[3]} ${g[2]}${g[4] ? '(자책)' : ''}${g[5] ? '(PK)' : ''}`).join(', ');
      $('hInfo').innerHTML = `${m.date} · ${m.stadium || ''}, ${m.city || ''} · 실제 결과 <b>${m.score[0]}-${m.score[1]}</b>${m.et ? ' (연장)' : ''}${m.pens ? ` · 승부차기 ${m.pens.join('-')}` : ''}<br>득점: ${gl || '없음'}<br>규칙: ${RULE_LABEL(t.rules_profile)} · 선발: ${t.year >= 1970 ? '해당 대회 마지막 경기 실제 선발' : '1970년 이전은 선발 기록 없음 → 능력치 기준 자동 (1930 우루과이·아르헨티나는 결승 선발)'}`;
    };
    $('hYear').onchange = fill; $('hMatch').onchange = info;
    $('hYear').value = '2022'; fill();
    show('history');
  }
  $('hStart').onclick = () => {
    const y = +$('hYear').value, t = DATA.tournaments[y], m = t.matches.find(x => x.id === $('hMatch').value);
    startMatch({ kind: 'history', real: Object.assign({ year: y }, m), home: { type: 'national', key: `${m.home}-${y}` }, away: { type: 'national', key: `${m.away}-${y}` }, side: +$('hSide').value, rules: t.rules_profile,
      half: +$('hHalf').value, time: m.date && /-0[67]-/.test(m.date) && y >= 1954 ? 'day' : 'day', wx: 'clear', f: [null, null], intro: $('hIntro').value === '1', knockout: m.stage !== 'group stage' && m.stage !== 'second group stage' && m.stage !== 'final round' });
  };

  // ---------------- 도장깨기 ----------------
  const champions = () => YEARS.map(y => { const st = DATA.tournaments[y].standings.find(s => s.position === 1); return st ? `${st.team}-${y}` : null; }).filter(Boolean);
  let pkG = null;
  function gState() { try { return JSON.parse(localStorage.getItem('wfc.gauntlet.v1') || '{"index":0}'); } catch (e) { return S.gMem || { index: 0 }; } }
  function gSave(st) { S.gMem = st; try { localStorage.setItem('wfc.gauntlet.v1', JSON.stringify(st)); } catch (e) { /* 메모리만 */ } }
  function openGauntlet() {
    if (!pkG) pkG = makePicker($('pkG'), { type: 'national', key: 'KOR-2002' }); else pkG.refresh();
    const st = gState(), ch = champions();
    $('gList').innerHTML = ch.map((k, i) => `<div class="${i < st.index ? 'done' : i === st.index ? 'next' : ''}">${i < st.index ? '✔ ' : i === st.index ? '▶ ' : ''}${W.teamLabel(k.split('-')[0], +k.split('-')[1])}</div>`).join('') + (st.index >= ch.length ? '<div class="done">🏆 전원 격파!</div>' : '');
    show('gauntlet');
  }
  $('gNext').onclick = () => {
    const st = gState(), ch = champions(); if (st.index >= ch.length) return;
    startMatch({ kind: 'gauntlet', home: pkG.get(), away: { type: 'national', key: ch[st.index] }, side: 0, rules: 'modern', half: 180, time: 'night', wx: 'clear', f: [null, null], intro: false });
  };
  $('gReset').onclick = () => { gSave({ index: 0 }); openGauntlet(); };

  // ---------------- 드림팀 빌더 ----------------
  const B = { slots: Array(11).fill(null), bench: [], sel: null, id: null };
  $('bFormation').innerHTML = FORMS.map(f => `<option>${f}</option>`).join(''); $('bFormation').value = '4-3-3';
  $('bNation').innerHTML = '<option value="">전체 국가</option>' + Object.entries(DATA.nations).map(([c, n]) => [c, Object.values(n.names_ko).join('/')]).sort((a, b) => a[1].localeCompare(b[1], 'ko')).map(([c, n]) => `<option value="${c}">${n}</option>`).join('');
  $('bYear').innerHTML = '<option value="">전체 대회</option>' + YEARS.slice().reverse().map(y => `<option>${y}</option>`).join('');
  const ROLE_KO = { GK: 'GK', DF: 'DF', MF: 'MF', FW: 'FW' };
  function openBuilder(opt) {
    show('builder'); renderBuilder(); bSearch();
    if (opt && opt.nationAuto) { $('bHint').textContent = '국가를 고른 뒤 "자동 구성"을 누르면 그 나라 역대 올스타가 만들어집니다.'; $('bNation').focus(); }
    refreshSaved();
  }
  let bTimer;
  ['bQ', 'bNation', 'bYear', 'bPos', 'bOne'].forEach(id => { $(id).oninput = $(id).onchange = () => { clearTimeout(bTimer); bTimer = setTimeout(bSearch, 120); }; });
  function bQuery(limit) { return { q: $('bQ').value, team: $('bNation').value, year: $('bYear').value, pos: $('bPos').value, onePerPerson: $('bOne').checked, limit }; }
  function bSearch() {
    const res = W.search(bQuery(150));
    $('bResults').innerHTML = '<tr><th>선수</th><th>국가</th><th>대회</th><th>포지션</th><th>OVR</th><th>골</th><th>나이</th></tr>' +
      res.map(p => `<tr data-v="${p.version_id}"><td>${p.display_name}${p.name_ko ? `<br><small class="note">${p.name_en}</small>` : ''}</td><td>${p.team_name}</td><td>${p.tournament_year}</td><td>${p.position_group}</td><td><b>${p.ratings.overall}</b></td><td>${p.record.goals}</td><td>${p.age_at_tournament || '-'}</td></tr>`).join('') +
      (res.length >= 150 ? '<tr><td colspan="7" class="note">상위 150명만 표시 — 검색 조건을 좁혀 보세요.</td></tr>' : '') + (res.length === 0 ? '<tr><td colspan="7" class="note">검색 결과 없음</td></tr>' : '');
    $('bResults').querySelectorAll('tr[data-v]').forEach(tr => tr.onclick = () => bAdd(tr.dataset.v));
  }
  const inTeam = pid => B.slots.concat(B.bench).some(v => v && W.player(v).person_id === pid);
  function bAdd(vid) {
    const p = W.player(vid);
    if (inTeam(p.person_id)) { toastNote('같은 선수(다른 연도 버전 포함)는 한 번만 넣을 수 있습니다.'); return; }
    const roles = W.ROLES[$('bFormation').value];
    let i = B.sel !== null ? B.sel : B.slots.findIndex((v, k) => !v && roles[k] === p.position_group);
    if (i < 0) i = B.slots.findIndex((v, k) => !v && (roles[k] === 'GK') === (p.position_group === 'GK'));
    if (i >= 0) { B.slots[i] = vid; B.sel = null; }
    else if (B.bench.length < 12) B.bench.push(vid);
    else { toastNote('후보 12명이 가득 찼습니다.'); return; }
    A.sfx.ui(); renderBuilder();
  }
  function toastNote(t) { $('bHint').textContent = t; }
  function renderBuilder() {
    const f = $('bFormation').value, coords = WFCMatch.FORMATIONS[f], roles = W.ROLES[f];
    $('bPitch').innerHTML = coords.map((c, i) => {
      const v = B.slots[i], p = v && W.player(v);
      const left = 50 + c[1] * 44, top = 92 - c[0] * 108; // 아래쪽이 우리 골문
      return `<div class="slot ${p ? '' : 'empty'} ${B.sel === i ? 'sel' : ''}" data-i="${i}" style="left:${left}%;top:${Math.max(7, top)}%">${p ? `<b>${p.ratings.overall}</b> ${p.display_name.length > 16 ? p.display_name.split(' ').pop() : p.display_name}<br><small>${p.team_name.slice(0, 6)} ${p.tournament_year}${p.position_group !== roles[i] ? ' ⚠' + p.position_group : ''}</small>` : `${roles[i]}<br><small>빈자리</small>`}</div>`;
    }).join('');
    $('bPitch').querySelectorAll('.slot').forEach(el => el.onclick = () => { const i = +el.dataset.i; if (B.slots[i] && B.sel === i) { B.slots[i] = null; B.sel = null; } else B.sel = B.sel === i ? null : i; renderBuilder(); });
    $('bBench').innerHTML = B.bench.map((v, i) => { const p = W.player(v); return `<span data-i="${i}">${p.position_group} ${p.display_name} ${p.tournament_year} (${p.ratings.overall}) ✕</span>`; }).join('') || '<small class="note">없음</small>';
    $('bBench').querySelectorAll('span').forEach(el => el.onclick = () => { B.bench.splice(+el.dataset.i, 1); renderBuilder(); });
    const xi = B.slots.filter(Boolean).map(W.player);
    $('bAvg').textContent = `선발 ${xi.length}/11 · 평균 능력치 ${xi.length ? Math.round(xi.reduce((a, p) => a + p.ratings.overall, 0) / xi.length) : '-'} · 슬롯을 클릭해 선택(다시 클릭하면 제거) 후 왼쪽 목록에서 선수 클릭`;
  }
  $('bFormation').onchange = () => {
    // 포메이션 변경 시 선수 재배치
    const pool = B.slots.filter(Boolean).map(W.player); const { xi, bench } = W.arrange(pool, $('bFormation').value);
    B.slots = xi.map(p => p ? p.version_id : null); B.bench = bench.map(p => p.version_id).concat(B.bench).slice(0, 12); renderBuilder();
  };
  $('bAuto').onclick = () => {
    const nation = $('bNation').value;
    const pool = W.search(Object.assign(bQuery(500), { q: $('bQ').value, onePerPerson: true, pos: '' }));
    const { xi, bench } = W.arrange(pool, $('bFormation').value);
    B.slots = xi.map(p => p ? p.version_id : null); B.bench = bench.slice(0, 12).map(p => p.version_id); B.sel = null;
    if (nation && !$('bYear').value) $('bName').value = `${Object.values(DATA.nations[nation].names_ko)[0]} 역대 올스타`;
    renderBuilder();
  };
  $('bClear').onclick = () => { B.slots = Array(11).fill(null); B.bench = []; B.sel = null; B.id = null; renderBuilder(); };
  function currentDream() {
    if (B.slots.some(v => !v)) { toastNote('11명을 모두 채워야 합니다.'); return null; }
    if (W.player(B.slots[0]).position_group !== 'GK') toastNote('주의: 첫 자리(GK)에 골키퍼가 아닌 선수가 있습니다.');
    return { id: B.id || ('d' + Date.now().toString(36)), name: $('bName').value.trim() || '나의 드림팀', formation: $('bFormation').value, slots: B.slots.slice(), bench: B.bench.slice(), ids: B.slots.concat(B.bench), kitColor: $('bKit').value };
  }
  function refreshSaved() { const ds = loadDreams(); $('bSaved').innerHTML = ds.length ? ds.map(d => `<option value="${d.id}">${d.name}</option>`).join('') : '<option value="">(저장된 팀 없음)</option>'; }
  $('bSave').onclick = () => { const d = currentDream(); if (!d) return; B.id = d.id; const ds = loadDreams().filter(x => x.id !== d.id); ds.push(d); saveDreams(ds); refreshSaved(); $('bSaved').value = d.id; toastNote(`"${d.name}" 저장됨 (이 브라우저에 저장 — 다른 PC로 옮기려면 파일로 내보내기)`); };
  function loadDream(d) { B.id = d.id; $('bName').value = d.name; $('bFormation').value = d.formation; $('bKit').value = d.kitColor || '#d4af37'; B.slots = d.slots.slice(); B.bench = (d.bench || []).slice(); B.sel = null; renderBuilder(); }
  $('bLoad').onclick = () => { const d = loadDreams().find(x => x.id === $('bSaved').value); if (d) loadDream(d); };
  $('bDelete').onclick = () => { saveDreams(loadDreams().filter(x => x.id !== $('bSaved').value)); refreshSaved(); };
  $('bExport').onclick = () => { const d = currentDream(); if (!d) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Object.assign({ schema: 'wfc.dreamteam.v1' }, d), null, 1)], { type: 'application/json' })); a.download = `${d.name}.wfcteam.json`; a.click(); };
  $('bImport').onchange = async e => {
    try { const d = JSON.parse(await e.target.files[0].text()); if (d.schema !== 'wfc.dreamteam.v1' || d.slots.some(v => !W.player(v))) throw new Error('형식 오류'); d.id = 'd' + Date.now().toString(36); loadDream(d); toastNote('불러왔습니다. 저장을 누르면 목록에 추가됩니다.'); }
    catch (err) { toastNote('파일을 읽을 수 없습니다: ' + err.message); }
  };
  $('bPlay').onclick = () => {
    const d = currentDream(); if (!d) return;
    B.id = d.id; const ds = loadDreams().filter(x => x.id !== d.id); ds.push(d); saveDreams(ds);
    openSetup('dream', { home: Object.assign({ type: 'custom' }, d), away: { type: 'national', key: 'BRA-1970' } });
  };

  // 설정
  $('volMusic').oninput = e => { A.state.musicVolume = +e.target.value; };
  $('volSfx').oninput = e => { A.state.sfxVolume = +e.target.value; };
  $('optShuffle').onchange = e => { A.state.shuffle = e.target.value === '1'; };
  $('optVoice').onchange = e => { A.state.voice = e.target.value === '1'; };
  $('optQuality').onchange = e => { S.quality = e.target.value; setupPost(S.quality); scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); try { localStorage.setItem('wfc.quality', S.quality); } catch (err) { /* 무시 */ } };
  document.querySelectorAll('#settings input[type=file]').forEach(inp => inp.onchange = () => { A.init(); A.addFiles(inp.dataset.cat, inp.files); refreshPlaylistInfo(); if (inp.dataset.cat === 'menu') A.playCategory('menu'); });
  function refreshPlaylistInfo() {
    const p = A.state.playlists;
    $('playlistInfo').innerHTML = `재생목록 — 메뉴 ${p.menu.length}곡 · 입장 ${p.entrance.length}곡 · 시상식 ${p.ceremony.length}곡` + (A.state.current ? ` · 재생 중: ${A.state.current.name}` : ' · (등록된 음악 없음: 무음)');
  }

  // ---------------- 편집 모드 ----------------
  const RK = DATA.rating_keys;
  const RK_KO = ['종합', '스피드', '가속', '슈팅', '결정력', '중거리', '패스', '드리블', '볼컨트롤', '개인기', '헤딩', '수비', '태클', '몸싸움', '체력', '점프', '프리킥', '페널티', 'GK'];
  const ORIG = {};
  function buildEditor() {
    $('edYear').innerHTML = YEARS.slice().reverse().map(y => `<option>${y}</option>`).join('');
    const fillTeams = () => { $('edTeam').innerHTML = W.teamsOf(+$('edYear').value).map(t => `<option value="${t.team_id}-${$('edYear').value}">${t.name_ko || t.name_en}</option>`).join(''); renderEditor(); };
    $('edYear').onchange = fillTeams; $('edTeam').onchange = renderEditor;
    if (!$('edYear').dataset.init) { $('edYear').value = '1930'; $('edYear').dataset.init = 1; }
    fillTeams();
  }
  function renderEditor() {
    const sq = W.squad($('edTeam').value); if (!sq) return;
    sq.players.forEach(p => { if (!ORIG[p.version_id]) ORIG[p.version_id] = JSON.stringify({ r: p.ratings, k: p.name_ko }); });
    let h = '<tr><th>선수 (영문)</th><th>한글 이름</th><th>포지션</th><th>등번호</th><th>생년월일(나이)</th><th>기록</th>' + RK_KO.map(k => `<th>${k}</th>`).join('') + '</tr>';
    sq.players.forEach((p, i) => {
      h += `<tr><td>${p.name_en}${p.captain ? ' (C)' : ''}${p.name_note ? `<br><small class="est">${p.name_note}</small>` : ''}</td><td><input class="ko" data-i="${i}" data-k="name_ko" value="${p.name_ko || ''}" placeholder="입력"></td><td>${p.position_group}</td><td>${p.shirt_number || (sq.meta.year < 1950 ? '미사용' : '-')}</td><td><small>${p.birth_date || '미확인'}${p.age_at_tournament ? ` (${p.age_at_tournament})` : ''}</small></td><td><small>${p.record.apps === null ? '' : `출전 ${p.record.apps} · `}골 ${p.record.goals}${p.record.awards.length ? '<br>' + p.record.awards.join(', ') : ''}</small></td>` +
        RK.map(k => `<td><input type="number" min="1" max="99" data-i="${i}" data-k="${k}" value="${p.ratings[k]}"></td>`).join('') + '</tr>';
    });
    $('edTable').innerHTML = h;
    $('edTable').querySelectorAll('input').forEach(inp => inp.onchange = () => {
      const p = sq.players[+inp.dataset.i];
      if (inp.dataset.k === 'name_ko') { p.name_ko = inp.value.trim() || null; p.display_name = p.name_ko || p.name_en; p.edited = true; return; }
      const v = Math.max(1, Math.min(99, Math.round(+inp.value || 1))); inp.value = v; p.ratings[inp.dataset.k] = v; p.edited = true;
    });
  }
  $('edExport').onclick = () => {
    const sq = W.squad($('edTeam').value);
    const edited = sq.players.filter(p => p.edited);
    const out = { schema: 'wfc.curated.v1', note: '편집 모드에서 내보낸 보정값 (능력치는 추정치)', squads: [{ team_id: sq.meta.team_id, tournament_year: sq.meta.year, players: edited.map(p => ({ match: { version_id: p.version_id }, name_en: p.name_en, name_ko: p.name_ko, ratings: p.ratings })) }] };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
    a.download = `edit_${sq.meta.team_id}_${sq.meta.year}.json`; a.click();
  };
  $('edReset').onclick = () => { W.squad($('edTeam').value).players.forEach(p => { const o = ORIG[p.version_id]; if (o) { const j = JSON.parse(o); Object.assign(p.ratings, j.r); p.name_ko = j.k; p.display_name = p.name_ko || p.name_en; p.edited = false; } }); renderEditor(); };

  // ---------------- 조 추첨식 ----------------
  $('drawYear').innerHTML = YEARS.slice().reverse().map(y => `<option>${y}</option>`).join('');
  $('drawYear').onchange = () => startDraw(+$('drawYear').value);
  function startDraw(year) {
    year = year || +$('drawYear').value || 1930; $('drawYear').value = year;
    show('draw'); setEnvironment('night', 'clear'); placeHost('center', 'present');
    $('drawCaption').textContent = `개최자 장원기의 ${year} 월드컵 조 추첨식 (연출 재현 · 실제 조 편성)`;
    const groups = {}; DATA.tournaments[year].teams.forEach(t => { const g = (t.group || '결선').replace('Group ', ''); (groups[g] = groups[g] || []).push(t); });
    const board = $('drawBoard'); board.innerHTML = ''; board.style.gridTemplateColumns = `repeat(${Object.keys(groups).length > 4 ? 4 : 2}, minmax(150px, 1fr))`;
    const order = [];
    Object.keys(groups).sort().forEach(g => {
      const pot = document.createElement('div'); pot.className = 'pot'; pot.innerHTML = `<h4>${g}조</h4>`;
      groups[g].forEach(t => { const d = document.createElement('div'); d.textContent = t.name_ko || t.name_en; pot.appendChild(d); order.push(d); });
      board.appendChild(pot);
    });
    const token = S.drawToken = {};
    order.sort(() => Math.random() - 0.5).forEach((d, i) => setTimeout(() => { if (S.screen === 'draw' && S.drawToken === token) { d.classList.add('in'); A.sfx.ui(); hostAnim.state = i % 2 ? 'present' : 'declare'; } }, 600 + i * 420));
  }

  // ---------------- 경기 시작 ----------------
  function clearMatch() {
    S.models.forEach(m => scene.remove(m)); S.models = []; S.match = null; S.replay = null; S.replayBuf = []; S.ticker = [];
    $('ticker').innerHTML = '';
  }
  function startMatch(cfg) {
    clearMatch(); A.stopMusic();
    S.cfg = cfg;
    // 팀 구성 (데이터 → 포메이션별 선발/후보)
    const tA = W.matchTeam(cfg.home, cfg.f && cfg.f[0]), tB = W.matchTeam(cfg.away, cfg.f && cfg.f[1]);
    if (tA.team_id === tB.team_id) tB.team_id += '-B';
    // 유니폼 충돌 시 원정팀은 원정 유니폼
    tA.kit = tA.kitHome; tB.kit = W.clash(tA.kitHome, tB.kitHome) ? tB.kitAway : tB.kitHome;
    if (W.clash(tA.kit, tB.kit)) tB.kit = W.customKit('alt', tA.kit.shirt.colors[0] === '#111111' ? '#ffffff' : '#111111', '#555555');
    S.teamsMeta = [tA, tB];
    S.labels = { [tA.team_id]: tA.label, [tB.team_id]: tB.label };
    const rules = DATA.rules[cfg.rules] || DATA.rules.modern;
    const knockout = cfg.knockout !== undefined ? cfg.knockout : (cfg.kind === 'final' || cfg.kind === 'shootout' || cfg.kind === 'gauntlet' || cfg.kind === 'dream');
    const m = new WFCMatch.Match({ homeSquad: { team_id: tA.team_id, players: tA.players }, awaySquad: { team_id: tB.team_id, players: tB.players }, rules, halfSeconds: cfg.half, seed: (Math.random() * 1e9) | 0, knockout, formation: [tA.formation, tB.formation] });
    S.match = m;
    if (cfg.kind === 'versus') { m.teams[0].controller = { scheme: 'p1', pad: 0 }; m.teams[1].controller = { scheme: 'p2', pad: 1 }; }
    else if (cfg.side >= 0) m.teams[cfg.side].controller = { scheme: 'p1solo', pad: 0 };
    // 모델 생성 (공통 인체 리그 + 선수 데이터 + 유니폼)
    const gkCols = ['#f5d000', '#21a35b'];
    m.teams.forEach((t, ti) => t.players.forEach(p => { p.model = M.buildPlayer(p.data, S.teamsMeta[ti].kit, p.gk, (S.teamsMeta[ti].year || 2022) < 1970 ? null : gkCols[ti]); scene.add(p.model); S.models.push(p.model); }));
    S.rings = [0, 1].map(i => { const r = new T.Mesh(new T.RingGeometry(0.5, 0.65, 24), new T.MeshBasicMaterial({ color: i ? 0xff7043 : 0xffd34d, side: T.DoubleSide, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.visible = false; scene.add(r); S.models.push(r); return r; });
    const commentary = WFCCommentary.make(id => label(id));
    m.on(e => onMatchEvent(e, commentary));
    if (cfg.kind === 'practice') { m.teams[1].players.forEach(p => { if (!p.gk) { p.sentOff = true; p.p.x = 0; p.p.z = 60; } }); m.o.halfSeconds = 1e9; }
    setEnvironment(cfg.time, cfg.wx);
    M.recolorCrowd(stadium, [tA.kit, tB.kit].map(k => [k.shirt.colors[0], k.shirt.colors[1] || k.shorts.colors[0]]));
    $('t0').textContent = tA.short; $('t1').textContent = tB.short;
    [0, 1].forEach(i => { const k = S.teamsMeta[i].kit.shirt.colors; $('sw' + i).style.background = k.length > 1 ? `linear-gradient(90deg, ${k.join(',')})` : k[0]; });
    ballMesh.visible = true; trophy.visible = false; ballMesh.userData.setEra(tA.year && tB.year ? Math.max(tA.year, tB.year) : 2022);
    show(null); $('hud').classList.remove('hidden');
    const hostWatch = cfg.kind === 'final' || cfg.kind === 'history' || cfg.kind === 'dream';
    if (hostWatch) placeHost('vip', 'sit'); else host.visible = podium.visible = false;
    A.crowd(0.4);
    const go = () => {
      if (cfg.kind === 'shootout') { m.phase = 'kickoff'; m.beginShootout(); }
      else m.phase = 'kickoff';
      S.seq = null; caption(null); $('skipHint').classList.add('hidden');
      if (hostWatch) placeHost('vip', 'sit'); else host.visible = podium.visible = false;
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
    const meta = S.teamsMeta[team.i];
    el.innerHTML = `<h3>${label(team.id)} — ${team.formation}</h3><table>` + team.players.map(p => `<tr><td>${p.data.shirt_number || ''}</td><td>${p.data.position_group}</td><td>${p.name}${p.data.captain ? ' (C)' : ''}${meta.code === 'DRM' ? ` <small class="note">${p.data.team_name} ${p.data.tournament_year}</small>` : ''}</td><td class="ovr">${p.r.overall}</td><td class="est">추정</td></tr>`).join('') +
      `</table><div class="note">${meta.coaches_ko ? '감독: ' + meta.coaches_ko.join(', ') + ' · ' : ''}선발: ${meta.lineup_source || '능력치 기준 자동'}${meta.year && meta.year < 1950 ? ' · 등번호: 1950년 이전 미사용' : ''}</div>`;
    document.body.appendChild(el); return el;
  }
  function openingSequence(m) {
    const els = [];
    return [
      { dur: 4, caption: introCaption(m), enter() { placeHost('center', 'wave'); ballMesh.visible = false; A.playCategory('entrance'); A.crowd(0.6); tunnel(m); },
        cam(t) { const a = t * 0.35; return [new T.Vector3(Math.cos(a) * 95, 38 - t * 3, Math.sin(a) * 75), new T.Vector3(0, 2, 0)]; } },
      { dur: 5, caption: '대회 개최자 장원기\n"원기랜드 월드컵 결승전의 개최를 선언합니다!"', enter() { hostAnim.state = 'declare'; A.speak('대회 개최자 장원기. 원기랜드 월드컵 결승전의 개최를 선언합니다!', true); },
        update(t) { if (t > 1.2 && !this.fw) { this.fw = 1; for (let i = 0; i < 4; i++) setTimeout(() => firework((Math.random() - 0.5) * 60, 30 + Math.random() * 10, (Math.random() - 0.5) * 40, [0xffd34d, 0x7fb8e6, 0xffffff][i % 3]), i * 400); } },
        cam(t) { return [new T.Vector3(0.6, 2.3, 3.6 - t * 0.12), new T.Vector3(0, 2.1, 0)]; } },
      { dur: 3, caption: '개막식 — 양 팀 선수 입장', enter() { hostAnim.state = 'clap'; lineUp(m); },
        cam(t) { return [new T.Vector3(-20 + t * 6, 4, 18), new T.Vector3(-8 + t * 6, 1.4, 3)]; } },
      { dur: 5, caption: null, enter() { els.push(lineupPanel(m.teams[0], 'left')); A.speak(label(m.teams[0].id) + ' 선발 명단', true); },
        cam(t) { return [new T.Vector3(-14 + t * 2.4, 2.2, 11), new T.Vector3(-14 + t * 2.4, 1.5, 3)]; }, exit() { els.forEach(e => e.remove()); } },
      { dur: 5, caption: null, enter() { els.push(lineupPanel(m.teams[1], 'right')); A.speak(label(m.teams[1].id) + ' 선발 명단', true); },
        cam(t) { return [new T.Vector3(2 + t * 2.4, 2.2, 11), new T.Vector3(2 + t * 2.4, 1.5, 3)]; }, exit() { els.forEach(e => e.remove()); } },
      { dur: 3, caption: refereeCaption(), enter() { m.resetKickoff(0); placeHost('vip', 'sit'); ballMesh.visible = true; },
        cam(t) { return [new T.Vector3(0, 40 - t * 4, 62), new T.Vector3(0, 0, 0)]; } }
    ];
  }
  function introCaption(m) {
    const r = S.cfg.real;
    if (r) return `WONKILAND FC 2026\n${r.year} 월드컵 · ${r.stadium || ''}${r.city ? ', ' + r.city : ''} · ${r.date}`;
    return `WONKILAND FC 2026\n${label(m.teams[0].id)} vs ${label(m.teams[1].id)} · 원기랜드 스타디움`;
  }
  function refereeCaption() {
    const n = DATA.notes['1930_final_match_notes'], r = S.cfg.real;
    if (r && r.year === 1930 && r.stage === 'final' && n) return `주심: ${n.referee.name_en} (벨기에) · 관중 ${n.attendance.toLocaleString()}명\n※ 출처 첨부 필요(needs_citation)`;
    return r ? `실제 결과는 ${r.score[0]}-${r.score[1]} — 역사를 바꿔 보세요!` : '킥오프!';
  }
  function lineUp(m) { // 개최자 단상 앞에 양 팀 정렬 (카메라 쪽 +z를 바라봄)
    m.teams.forEach((t, ti) => t.players.forEach((p, k) => { p.p.x = (ti ? 2 : -14) + k * 1.1; p.p.z = 4; p.facing = Math.PI / 2; p.state = 'idle'; p.v.x = p.v.z = 0; }));
  }
  function tunnel(m) { // 입장 전: 터치라인 밖 대기
    m.teams.forEach((t, ti) => t.players.forEach((p, k) => { p.p.x = (ti ? 3 : -15) + k * 1.0; p.p.z = -PH.halfWidth - 2; p.facing = Math.PI / 2; p.state = 'idle'; p.v.x = p.v.z = 0; }));
  }
  function ceremonySequence(m) {
    const res = m.result, winner = res.winner ? m.teams.find(t => t.id === res.winner) : null;
    const cap = winner ? winner.players.find(p => p.data.captain && !p.sentOff) || winner.players.filter(p => !p.gk && !p.sentOff).sort((a, b) => b.r.overall - a.r.overall)[0] : null;
    return [
      { dur: 5, caption: winner ? `시상식 — 우승: ${label(winner.id)}\n개최자 장원기가 우승 트로피를 전달합니다.` : '경기 종료 — 무승부', enter() {
          placeHost('ceremony', 'present'); A.stopMusic(); if (!A.playCategory('ceremony')) A.sfx.ceremony();
          trophy.visible = !!winner; trophy.position.set(-0.3, 1.6, PH.halfWidth - 6 + -0.55); trophy.scale.setScalar(1.6);
          m.allPlayers().forEach(p => { p.state = 'idle'; });
          if (cap) { cap.p.x = 0.6; cap.p.z = PH.halfWidth - 7; cap.facing = Math.PI / 2; cap.v.x = cap.v.z = 0; }
          if (winner) winner.players.slice(0, 11).forEach((p, k) => { if (p !== cap) { p.p.x = -6.5 + k * 1.3; p.p.z = PH.halfWidth - 11; p.facing = Math.PI / 2; } });
          ballMesh.visible = false;
        }, update(t) { if (t > 2.5 && cap && trophy.visible) { trophy.position.set(cap.p.x, 2.2 * cap.model.scale.y, cap.p.z); cap.state = 'celebrate'; } },
        cam(t) { return [new T.Vector3(0.2 + Math.sin(t * 0.3) * 1.5, 2.6, PH.halfWidth + 2.5), new T.Vector3(0, 1.6, PH.halfWidth - 7)]; } },
      { dur: 5, caption: winner ? `${label(winner.id)}, 원기랜드 월드컵 우승!` : '', enter() {
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
      if (host.visible) hostAnim.state = 'clap';
      if (e.type === 'goal') S.pendingReplay = 2.2; // 세리머니 후 슬로모션 리플레이
    }
    if (e.type === 'save') S.excitement[2] = Math.max(S.excitement[2], 0.6);
    if (e.type === 'full_time') {
      if (S.cfg.kind === 'gauntlet') { const st = gState(); if (m.result.winner === m.teams[0].id) { st.index++; gSave(st); S.gauntletMsg = `도장깨기 성공! (${st.index}/${champions().length})`; } else S.gauntletMsg = '도장깨기 실패 — 다시 도전하세요.'; }
      setTimeout(() => showResults(), 2500);
    }
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
    $('resTitle').textContent = `경기 결과 — ${label(a.id)} ${a.score} : ${b.score} ${label(b.id)}` + (r.shootout ? ` (승부차기 ${r.shootout.join(':')})` : '') + (r.kind === 'replay_required' ? ' · 재경기 필요 (당시 규정)' : '');
    const poss = a.stats.possession + b.stats.possession || 1;
    const rows = [['점유율', Math.round(a.stats.possession / poss * 100) + '%', Math.round(b.stats.possession / poss * 100) + '%'], ['슈팅', a.stats.shots, b.stats.shots], ['유효슈팅', a.stats.onTarget, b.stats.onTarget], ['패스(성공)', `${a.stats.passes} (${a.stats.passesOk})`, `${b.stats.passes} (${b.stats.passesOk})`], ['코너킥', a.stats.corners, b.stats.corners], ['오프사이드', a.stats.offsides, b.stats.offsides], ['파울', a.stats.fouls, b.stats.fouls], ['경고/퇴장', `${a.stats.yellow}/${a.stats.red}`, `${b.stats.yellow}/${b.stats.red}`], ['선방', a.stats.saves, b.stats.saves]];
    let h = `<div class="statgrid">${rows.map(r => `<div>${r[1]}</div><div>${r[0]}</div><div>${r[2]}</div>`).join('')}</div>`;
    h += `<h3>득점 기록</h3><p>${(sum.goals.length ? sum.goals.map(g => `${g.minute}' ${g.scorer}${g.own ? ' (자책)' : ''} [${label(g.team)}]${g.assist ? ' · 도움 ' + g.assist : ''}`).join('<br>') : '득점 없음')}</p>`;
    h += '<div class="res-cols">' + sum.teams.map(t => `<div><h3>${label(t.id)} 선수 평점</h3><table><tr><th>선수</th><th>평점</th><th>골</th><th>도움</th><th>슈팅</th><th>패스</th><th>태클</th><th>선방</th></tr>${t.players.map(p => `<tr><td>${p.name}</td><td><b>${p.rating}</b></td><td>${p.goals}</td><td>${p.assists}</td><td>${p.shots}</td><td>${p.passes}</td><td>${p.tackles}</td><td>${p.saves}</td></tr>`).join('')}</table></div>`).join('') + '</div>';
    const real = S.cfg.real;
    if (real) h += `<p class="note">실제 경기 결과 (${real.date}): ${label(a.id)} ${real.score[0]} : ${real.score[1]} ${label(b.id)}${real.pens ? ` · 승부차기 ${real.pens.join(':')}` : ''} — 득점: ${real.goals.map(g => `${g[3]} ${g[2]}${g[4] ? '(자책)' : ''}`).join(', ') || '없음'} · 출처: Fjelstul World Cup Database</p>`;
    if (S.gauntletMsg) { h = `<h3>${S.gauntletMsg}</h3>` + h; S.gauntletMsg = null; }
    $('resBody').innerHTML = h;
    $('btnCeremony').disabled = S.cfg.kind === 'practice' || !r.winner;
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
      fillSubs(t);
      show('pause');
    } else { show(null); $('hud').classList.remove('hidden'); }
  }
  function fillSubs(t) {
    const m = S.match, used = t.subsUsed || 0, max = m.rules.substitutions || 0;
    $('subOut').innerHTML = t.players.map((p, i) => p.sentOff ? '' : `<option value="${i}">${p.data.position_group} ${p.name}${p.injured ? ' (부상)' : ''}</option>`).join('');
    $('subIn').innerHTML = t.bench.map((d, i) => `<option value="${i}">${d.position_group} ${d.display_name || d.name_en} (${d.ratings.overall})</option>`).join('');
    const ok = m.subsAllowed(t);
    $('btnSub').disabled = !ok;
    $('subInfo').textContent = max === 0 ? `${RULE_LABEL(m.rules.id)}: 이 시대에는 월드컵 선수 교체가 허용되지 않았습니다.` : `교체 ${used}/${max}명 사용` + (t.bench.length ? '' : ' · 후보 선수 없음');
  }
  $('btnSub').onclick = () => {
    const m = S.match, t = m.teams.find(t => t.controller) || m.teams[0], ti = t.i;
    const outIdx = +$('subOut').value, r = m.substitute(t, outIdx, +$('subIn').value);
    if (!r.ok) return;
    const p = t.players[outIdx]; scene.remove(p.model);
    p.model = M.buildPlayer(p.data, S.teamsMeta[ti].kit, p.gk, (S.teamsMeta[ti].year || 2022) < 1970 ? null : ['#f5d000', '#21a35b'][ti]); scene.add(p.model); S.models.push(p.model);
    pushTicker(`교체: ${p.name} 투입`); fillSubs(t);
  };
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

  // 그림자 카메라가 공 주변을 따라가며 좁은 범위만 렌더링 → 선명한 그림자
  function followShadow(c) {
    const o = S.sunOffset || new T.Vector3(-40, 80, 30);
    sun.target.position.set(c.x * 0.9, 0, c.z * 0.5); sun.position.copy(sun.target.position).add(o);
    const sc = sun.shadow.camera; if (sc.right !== 42) { Object.assign(sc, { left: -42, right: 42, top: 30, bottom: -30, near: 20, far: 260 }); sc.updateProjectionMatrix(); }
  }
  // ---------------- HUD ----------------
  const radar = $('radar').getContext('2d');
  function drawHUD(m, inputs) {
    $('s0').textContent = m.teams[0].score; $('s1').textContent = m.teams[1].score;
    const add = m.clockSec > m.halfLen() ? `+${Math.ceil((m.clockSec - m.halfLen()) / m.halfLen() * (m.half <= 2 ? 45 : 15))}` : '';
    $('clock').textContent = m.shootout ? `PK ${m.shootout.score[0]}-${m.shootout.score[1]}` : S.cfg.kind === 'practice' ? '연습' : `${Math.min(m.minute(), [0, 45, 90, 105, 120][m.half])}'${add}`;
    const ctrls = m.teams.filter(t => t.controller && t.controlled).map(t => `${S.teamsMeta[t.i].short}: ${t.controlled.name} (${t.controlled.data.position_group})`);
    const sp = m.setPiece && m.phase !== 'play' ? ` · ${{ kickoff: '킥오프', throw_in: '스로인', corner: '코너킥', goal_kick: '골킥', free_kick: '프리킥', penalty: '페널티킥' }[m.setPiece.type]}` : '';
    $('hudInfo').textContent = ctrls.join(' | ') + sp + ' · ' + RULE_LABEL(m.rules.id);
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
    if (post.composer) post.composer.render(); else renderer.render(scene, camera);
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
    if (['title', 'modes', 'setup', 'settings', 'editor', 'help', 'builder', 'history', 'gauntlet'].includes(S.screen)) {
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
    if (host.visible) { if (hostAnim.state === 'clap' && S.excitement[2] < 0.3) hostAnim.state = 'sit'; }
    A.crowd(0.3 + Math.max(...S.excitement) * 0.6);
    const [p, l] = matchCamera(m, dt); applyCam(p, l, dt);
    followShadow(m.ball.p);
    drawHUD(m, inputs);
  }

  S.quality = (() => { try { return localStorage.getItem('wfc.quality') || 'high'; } catch (e) { return 'high'; } })(); $('optQuality').value = S.quality; setupPost(S.quality);
  toTitle();
  requestAnimationFrame(frame);
  // 테스트 훅
  window.WFC.startMatch = startMatch; window.WFC.openBuilder = openBuilder; window.WFC.openHistory = openHistory; window.WFC.openGauntlet = openGauntlet; window.WFC.openSetup = openSetup; window.WFC.toTitle = toTitle; window.WFC.showResults = showResults; window.WFC.startDraw = startDraw;
  window.WFC.runCeremony = () => { show(null); runSequence(ceremonySequence(S.match), () => toTitle()); };
})();
