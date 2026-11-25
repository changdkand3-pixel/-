// 3D 모델 생성: 공통 인체 리그(모든 선수 공유), 개최자, 경기장, 관중, 트로피, 날씨
// 프로토타입은 절차적(코드 생성) 저폴리 모델. 실사 모델은 UE5 단계에서 교체한다.
(function () {
  'use strict';
  const T = THREE;
  const PH = WFCPhysics.PITCH;
  const mats = {};
  function mat(color, opts) {
    const key = color + JSON.stringify(opts || {});
    if (!mats[key]) mats[key] = new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0 }, opts || {}));
    return mats[key];
  }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.anisotropy = 4; t.encoding = T.sRGBEncoding; return t;
  }

  // ---------- 유니폼 텍스처 (킷 데이터 기반) ----------
  const kitTexCache = {};
  function shirtTexture(kit) {
    if (kitTexCache[kit.kit_id]) return kitTexCache[kit.kit_id];
    const cols = kit.shirt.colors;
    const tex = canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = cols[0]; g.fillRect(0, 0, w, h);
      if (kit.shirt.pattern === 'vertical_stripes' && cols[1]) {
        g.fillStyle = cols[1];
        for (let i = 0; i < 6; i++) g.fillRect(i * w / 5 + w / 20, 0, w / 10, h);
      } else if (kit.shirt.pattern === 'checkered' && cols[1]) {
        g.fillStyle = cols[1]; const n = 8;
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x + y) % 2) g.fillRect(x * w / n, y * h / n, w / n + 0.5, h / n + 0.5);
      } else if (kit.shirt.pattern === 'sash' && cols[1]) {
        g.strokeStyle = cols[1]; g.lineWidth = w * 0.18; g.beginPath(); g.moveTo(-10, -10); g.lineTo(w + 10, h + 10); g.stroke();
      }
      if ((kit.era || 2022) < 1960) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(w * 0.47, 0, w * 0.06, h * 0.18); } // 옛날식 끈 칼라
      else { g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(w * 0.38, 0); g.lineTo(w * 0.5, h * 0.14); g.lineTo(w * 0.62, 0); g.fill(); } // V넥
    });
    kitTexCache[kit.kit_id] = tex; return tex;
  }

  // ---------- 공통 인체 리그 ----------
  // 관절(pivot)만 있는 계층 구조라 모든 선수/개최자가 같은 애니메이션 코드를 공유한다.
  function limb(len, radius, material) {
    const m = new T.Mesh(new T.CylinderGeometry(radius, radius * 0.85, len, 8), material);
    m.position.y = -len / 2; m.castShadow = true; return m;
  }
  function pivot(parent, x, y, z) { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; }

  function buildHumanoid(o) {
    // o: {shirtMat, sleeveMat, shortsMat, sockMat, skin, hair, hairStyle, bootColor, build}
    const build = o.build || 1;
    const root = new T.Group();
    const body = pivot(root, 0, 0, 0); // 전체 기울임(슬라이딩/다이빙/넘어짐)
    const hips = pivot(body, 0, 0.95, 0);
    const torso = pivot(hips, 0, 0, 0);
    const skin = mat(o.skin);
    const chest = new T.Mesh(new T.BoxGeometry(0.42 * build, 0.56, 0.24 * build), o.shirtMat);
    chest.position.y = 0.3; chest.castShadow = true; torso.add(chest);
    const shorts = new T.Mesh(new T.BoxGeometry(0.40 * build, 0.24, 0.25 * build), o.shortsMat);
    shorts.position.y = -0.04; shorts.castShadow = true; hips.add(shorts);
    const neck = new T.Mesh(new T.CylinderGeometry(0.055, 0.06, 0.1, 8), skin); neck.position.y = 0.62; torso.add(neck);
    const head = pivot(torso, 0, 0.74, 0);
    const skull = new T.Mesh(new T.SphereGeometry(0.115, 16, 12), skin); skull.scale.set(1, 1.12, 1.02); skull.castShadow = true; head.add(skull);
    const hairMat = mat(o.hair);
    const hair = new T.Mesh(new T.SphereGeometry(0.122, 16, 10, 0, Math.PI * 2, 0, Math.PI * (o.hairStyle === 'long' ? 0.62 : 0.5)), hairMat);
    hair.scale.set(1, o.hairStyle === 'cropped' ? 0.9 : 1.05, 1.05); hair.position.set(0, 0.02, -0.008); hair.rotation.x = -0.25; head.add(hair);
    // 눈/코 (방향 확인용 최소 디테일)
    const eyeM = mat('#1a1a1a');
    for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.014, 6, 6), eyeM); e.position.set(s * 0.042, 0.02, 0.105); head.add(e); }
    const nose = new T.Mesh(new T.ConeGeometry(0.018, 0.04, 6), skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, -0.01, 0.12); head.add(nose);

    const J = { root, body, hips, torso, head };
    for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
      const sh = pivot(torso, s * 0.26 * build, 0.52, 0);
      sh.add(limb(0.3, 0.055 * build, o.sleeveMat || o.shirtMat));
      const el = pivot(sh, 0, -0.3, 0);
      el.add(limb(0.27, 0.045, o.forearmMat || o.sleeveMat || skin));
      const hand = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), o.gloveMat || skin); hand.position.y = -0.3; el.add(hand);
      const hp = pivot(hips, s * 0.11 * build, -0.05, 0);
      hp.add(limb(0.42, 0.075 * build, o.thighMat || skin));
      const kn = pivot(hp, 0, -0.42, 0);
      kn.add(limb(0.42, 0.06, o.sockMat));
      const boot = new T.Mesh(new T.BoxGeometry(0.1, 0.08, 0.26), mat(o.bootColor || '#1b1410'));
      boot.position.set(0, -0.44, 0.06); boot.castShadow = true; kn.add(boot);
      J['shoulder' + n] = sh; J['elbow' + n] = el; J['hip' + n] = hp; J['knee' + n] = kn;
    }
    root.userData.joints = J;
    root.userData.pose = {}; // 현재 관절 각도 (블렌딩용)
    return root;
  }

  // ---------- 애니메이션: 상태별 목표 자세 → 부드러운 블렌딩 ----------
  // 모든 상태 전환은 관절 각도를 보간하므로 동작이 툭 끊기지 않는다.
  const JOINT_KEYS = ['bodyX', 'bodyZ', 'bodyY', 'torsoX', 'headX', 'shLx', 'shLz', 'shRx', 'shRz', 'elL', 'elR', 'hipLx', 'hipRx', 'hipLz', 'hipRz', 'knL', 'knR'];
  function targetPose(a) {
    // a: {state, phase, speed, t (0..1 상태 진행도), dir(-1/1)}
    const P = {}; JOINT_KEYS.forEach(k => P[k] = 0);
    const s = Math.min(a.speed || 0, 10) / 10;
    const ph = a.phase || 0;
    switch (a.state) {
      case 'run': case 'walk': case 'idle': {
        const amp = a.state === 'idle' ? 0 : 0.25 + s * 0.85;
        P.hipLx = Math.sin(ph) * amp; P.hipRx = -Math.sin(ph) * amp;
        P.knL = Math.max(0, -Math.cos(ph)) * amp * 1.3 + 0.05; P.knR = Math.max(0, Math.cos(ph)) * amp * 1.3 + 0.05;
        P.shLx = -Math.sin(ph) * amp * 0.8; P.shRx = Math.sin(ph) * amp * 0.8;
        P.elL = P.elR = -0.3 - s * 0.9; P.torsoX = s * 0.25; P.bodyY = Math.abs(Math.sin(ph)) * 0.04 * s;
        P.shLz = 0.12; P.shRz = -0.12;
        if (a.state === 'idle') { P.shLx = P.shRx = Math.sin(ph * 0.3) * 0.04; P.elL = P.elR = -0.15; }
        break;
      }
      case 'kick': { // 슈팅/패스: 백스윙 → 임팩트 → 팔로스루
        const t = a.t, side = a.foot === 'L' ? 'L' : 'R', other = side === 'L' ? 'R' : 'L';
        const swing = t < 0.4 ? -1.1 * (t / 0.4) : -1.1 + (t - 0.4) / 0.6 * (1.1 + 1.4 * (a.power || 0.7));
        P['hip' + side + 'x'] = swing; P['kn' + side] = t < 0.45 ? 1.3 * (t / 0.45) : Math.max(0.1, 1.3 - (t - 0.45) * 4);
        P['hip' + other + 'x'] = 0.15; P['kn' + other] = 0.25;
        P['sh' + other + 'x'] = 0.9 * (a.power || 0.7); P['sh' + side + 'x'] = -0.6; P.shLz = 0.5; P.shRz = -0.5;
        P.torsoX = t > 0.4 ? -0.15 : 0.1; break;
      }
      case 'volley': {
        const t = a.t; P.bodyZ = -0.5 * Math.sin(t * Math.PI); P.hipRx = -1.6 * Math.sin(t * Math.PI); P.knR = 0.2;
        P.shLz = 1.2; P.shRz = -0.6; break;
      }
      case 'bicycle': { // 오버헤드킥
        const t = a.t; P.bodyX = -Math.PI * 0.85 * Math.sin(Math.min(1, t * 1.4) * Math.PI / 2);
        P.bodyY = 0.9 * Math.sin(t * Math.PI); P.hipRx = -2.2 * Math.sin(t * Math.PI); P.hipLx = 0.6; P.shLz = 1.3; P.shRz = -1.3; break;
      }
      case 'header': {
        const t = a.t; P.bodyY = 0.55 * Math.sin(t * Math.PI); P.torsoX = 0.5 - Math.sin(t * Math.PI) * 0.9;
        P.headX = 0.4 * Math.sin(t * Math.PI * 2); P.knL = P.knR = 0.6 * (1 - Math.sin(t * Math.PI)); P.shLx = P.shRx = -0.6; P.shLz = 0.6; P.shRz = -0.6; break;
      }
      case 'jump': { const t = a.t; P.bodyY = 0.6 * Math.sin(t * Math.PI); P.shLx = P.shRx = -2.6 * Math.sin(t * Math.PI); P.knL = P.knR = 0.5; break; }
      case 'slide': { P.bodyX = -1.25; P.bodyY = -0.55; P.hipRx = -1.3; P.knR = 0.05; P.hipLx = -0.4; P.knL = 1.2; P.shLz = 1.0; P.shRz = -0.4; P.shLx = -0.6; break; }
      case 'tackle': { const t = a.t; P.hipRx = -0.9 * Math.sin(t * Math.PI); P.torsoX = 0.3; P.knL = 0.5; break; }
      case 'shield': { P.torsoX = 0.35; P.shLz = 0.8; P.shRz = -0.8; P.knL = P.knR = 0.5; P.hipLx = P.hipRx = -0.3; break; }
      case 'fall': { const t = Math.min(1, a.t * 1.6); P.bodyX = 1.5 * t; P.bodyY = -0.85 * t; P.shLx = P.shRx = -1.4 * t; break; }
      case 'getup': { const t = a.t; P.bodyX = 1.5 * (1 - t); P.bodyY = -0.85 * (1 - t); P.knL = P.knR = 1.4 * Math.sin(t * Math.PI); P.hipLx = P.hipRx = -1.2 * Math.sin(t * Math.PI); break; }
      case 'celebrate': { P.shLz = 2.6; P.shRz = -2.6; P.bodyY = Math.abs(Math.sin(ph * 1.3)) * 0.35; P.headX = -0.4; P.knL = P.knR = 0.3; break; }
      case 'throw': { const t = a.t; P.shLx = P.shRx = t < 0.5 ? -2.9 : -2.9 + (t - 0.5) * 4; P.elL = P.elR = t < 0.5 ? -1.2 : 0; P.torsoX = t < 0.5 ? -0.3 : 0.3; break; }
      // ---- 골키퍼 ----
      case 'gk_ready': { P.knL = P.knR = 0.55; P.hipLx = P.hipRx = -0.35; P.torsoX = 0.3; P.shLx = P.shRx = -0.6; P.shLz = 0.5; P.shRz = -0.5; P.elL = P.elR = -0.5; P.hipLz = 0.12; P.hipRz = -0.12; break; }
      case 'gk_dive': { // dir: +1 = 자신의 왼쪽
        const t = Math.min(1, a.t * 2.2), d = a.dir || 1;
        P.bodyZ = d * 1.35 * t; P.bodyY = (a.high ? 0.6 : 0.25) * Math.sin(Math.min(1, a.t * 1.5) * Math.PI) ;
        P.shLz = d > 0 ? 2.8 : 1.6; P.shRz = d > 0 ? -1.6 : -2.8; P.shLx = P.shRx = -0.3; P.knL = P.knR = 0.3; break;
      }
      case 'gk_catch': { P.shLx = P.shRx = -1.2; P.elL = P.elR = -1.4; P.torsoX = 0.4; P.knL = P.knR = 0.3; break; }
      case 'gk_punch': { const t = a.t; P.shLx = P.shRx = -2.9 * Math.min(1, t * 3); P.bodyY = 0.4 * Math.sin(t * Math.PI); break; }
      case 'gk_ground': { P.bodyZ = (a.dir || 1) * 1.45; P.bodyY = -0.6; P.shLz = 1.5; P.shRz = -1.5; break; }
      case 'gk_roll_throw': { const t = a.t; P.shRx = -2.8 + t * 3.5; P.torsoX = 0.4 * t; P.knL = 0.6; break; }
      // ---- 개최자/의전 ----
      case 'wave': { P.shRz = -2.5; P.elR = -0.4 + Math.sin(ph * 4) * 0.4; break; }
      case 'clap': { P.shLx = P.shRx = -1.1; P.shLz = -0.35 - Math.abs(Math.sin(ph * 6)) * 0.3; P.shRz = 0.35 + Math.abs(Math.sin(ph * 6)) * 0.3; P.elL = P.elR = -0.9; break; }
      case 'declare': { P.shRx = -1.5; P.shRz = -0.4; P.elR = -0.2; P.shLx = -0.5; P.elL = -1.3; break; }
      case 'hold_trophy': { P.shLx = P.shRx = -2.9; P.elL = P.elR = -0.3; P.shLz = 0.35; P.shRz = -0.35; break; }
      case 'present': { P.shLx = P.shRx = -1.3; P.elL = P.elR = -0.4; P.torsoX = 0.15; break; }
      case 'sit': { P.hipLx = P.hipRx = -1.5; P.knL = P.knR = 1.5; P.bodyY = -0.45; P.elL = P.elR = -1.2; P.shLx = P.shRx = -0.4; break; }
    }
    return P;
  }
  function animate(model, a, dt) {
    const J = model.userData.joints, cur = model.userData.pose, tgt = targetPose(a);
    const k = 1 - Math.exp(-(a.blend || 14) * dt);
    for (const key of JOINT_KEYS) { const c = cur[key] || 0; cur[key] = c + (tgt[key] - c) * k; }
    J.body.rotation.x = cur.bodyX; J.body.rotation.z = cur.bodyZ; J.body.position.y = cur.bodyY;
    J.torso.rotation.x = cur.torsoX; J.head.rotation.x = cur.headX;
    J.shoulderL.rotation.x = cur.shLx; J.shoulderL.rotation.z = cur.shLz; J.shoulderR.rotation.x = cur.shRx; J.shoulderR.rotation.z = cur.shRz;
    J.elbowL.rotation.x = cur.elL; J.elbowR.rotation.x = cur.elR;
    J.hipL.rotation.x = cur.hipLx; J.hipR.rotation.x = cur.hipRx; J.hipL.rotation.z = cur.hipLz; J.hipR.rotation.z = cur.hipRz;
    J.kneeL.rotation.x = cur.knL; J.kneeR.rotation.x = cur.knR;
  }

  // ---------- 선수 모델 (데이터 → 모델) ----------
  const SKIN_VARIANTS = ['#e2b59a', '#d2a184', '#c08c6c', '#a8765a', '#8a5c42', '#5e3b2a'];
  function hashStr(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
  const GK_COLORS = ['#f5d000', '#21a35b', '#222222', '#7b3fbf', '#ff7a00', '#2bb5d8'];
  // 확인된 외형 데이터가 없으므로 결정적(항상 같은) 플레이스홀더 외형 사용 - 실제 외형 아님.
  // 국적으로 외형을 추정하지 않는다(부정확·고정관념 방지). 피부톤/머리색은 선수 ID 해시로만 결정.
  function buildPlayer(pdata, kit, isGK, gkColor) {
    const h = hashStr(pdata.person_id || pdata.version_id);
    const ap = pdata.appearance || {};
    const skin = ap.skin_tone_ref || SKIN_VARIANTS[h % SKIN_VARIANTS.length];
    const hair = ['#1a1410', '#2b1d14', '#3a2a1c', '#141414', '#5a3b22', '#8a6a3a'][(h >> 3) % 6];
    const era = pdata.tournament_year || 2022;
    const shirtTex = shirtTexture(kit);
    const gkCol = gkColor || (era < 1970 ? '#2f3b2f' : GK_COLORS[h % GK_COLORS.length]);
    const shirtMat = isGK ? mat(gkCol) : new T.MeshStandardMaterial({ map: shirtTex, roughness: 0.85 });
    const longSleeve = isGK || era < 1960;
    const skinMat = mat(skin);
    const model = buildHumanoid({
      shirtMat, sleeveMat: shirtMat, forearmMat: longSleeve ? shirtMat : skinMat,
      shortsMat: mat(isGK && era >= 1970 ? gkCol : kit.shorts.colors[0]), sockMat: mat(kit.socks.colors[0]), skin, hair,
      hairStyle: ['short', 'cropped', 'long'][(h >> 5) % (era < 1960 ? 2 : 3)], build: 0.95 + (h % 9) / 100,
      bootColor: era < 1970 ? '#1b1410' : ['#111111', '#f2f2f2', '#e0402a', '#2a7de0', '#e8c22a'][(h >> 7) % 5],
      gloveMat: isGK && era >= 1970 ? mat('#f4f4f4') : null
    });
    // 신장 미확인 → 시대 평균 근사 플레이스홀더(1930 약 173cm → 2022 약 182cm) + 개인차
    const hcm = pdata.height_cm || (173 + (Math.min(era, 2022) - 1930) * 0.1 + ((h >> 9) % 9) - 4 + (isGK ? 4 : 0));
    model.scale.setScalar(hcm / 178);
    const sh = new T.Mesh(new T.CircleGeometry(0.35, 12), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; model.add(sh);
    return model;
  }

  // ---------- 개최자 장원기 ----------
  // 단일 정의(Data/host/host_character.json)로부터 항상 같은 모델을 만든다 → 장면마다 얼굴이 바뀌지 않음.
  let hostFaceTex = null;
  function buildHost(def) {
    const ap = def.appearance, of = def.outfit;
    const suit = mat(of.suit, { roughness: 0.55 });
    const model = buildHumanoid({
      shirtMat: suit, sleeveMat: suit, forearmMat: suit, shortsMat: suit, thighMat: suit, sockMat: suit,
      skin: ap.skin_tone, hair: ap.hair.color, hairStyle: 'cropped', build: 1.22, bootColor: of.shoes
    });
    const J = model.userData.joints;
    // 셔츠 + 넥타이 + 포켓치프
    const shirt = new T.Mesh(new T.PlaneGeometry(0.16, 0.3), mat(of.shirt)); shirt.position.set(0, 0.45, 0.15); J.torso.add(shirt);
    const tie = new T.Mesh(new T.BoxGeometry(0.05, 0.28, 0.01), mat(of.tie, { roughness: 0.4 })); tie.position.set(0, 0.42, 0.157); J.torso.add(tie);
    const ps = new T.Mesh(new T.PlaneGeometry(0.06, 0.03), mat(of.pocket_square)); ps.position.set(0.13, 0.48, 0.152); J.torso.add(ps);
    // 라펠
    for (const s of [-1, 1]) { const l = new T.Mesh(new T.BoxGeometry(0.07, 0.3, 0.01), mat('#16213a')); l.position.set(s * 0.1, 0.45, 0.155); l.rotation.z = s * 0.35; J.torso.add(l); }
    // 체격: 넓은 어깨·몸통, 둥근 얼굴
    J.torso.children[0].scale.set(1.05, 1, 1.15);
    const skull = J.head.children[0]; skull.scale.set(1.12, 1.12, 1.05);
    J.head.scale.setScalar(1.08);
    // 사진 기반 얼굴 텍스처 (참조 사진에서 크롭 - 실사 3D 스캔 아님)
    if (window.WFC_HOST_FACE) {
      if (!hostFaceTex) { hostFaceTex = new T.TextureLoader().load(window.WFC_HOST_FACE); hostFaceTex.encoding = T.sRGBEncoding; }
      const face = new T.Mesh(new T.SphereGeometry(0.118, 24, 16, Math.PI * 0.14, Math.PI * 0.72, Math.PI * 0.16, Math.PI * 0.64),
        new T.MeshStandardMaterial({ map: hostFaceTex, transparent: true, roughness: 0.7 }));
      face.scale.set(1.13, 1.14, 1.08); face.position.z = 0.004;
      face.rotation.y = 0; J.head.add(face);
      // 기본 눈/코는 숨김 (사진 얼굴 사용)
      J.head.children.forEach(c => { if (c.geometry && (c.geometry.type === 'ConeGeometry' || (c.geometry.parameters && c.geometry.parameters.radius === 0.014))) c.visible = false; });
    }
    model.scale.setScalar(1.0);
    model.userData.isHost = true;
    return model;
  }

  // ---------- 트로피 (오리지널 디자인 - 실제 대회 트로피 복제 아님) ----------
  function buildTrophy() {
    const pts = [[0, 0], [0.09, 0], [0.09, 0.05], [0.05, 0.07], [0.035, 0.12], [0.03, 0.2], [0.06, 0.24], [0.1, 0.3], [0.12, 0.38], [0.115, 0.42], [0.0, 0.42]]
      .map(p => new T.Vector2(p[0], p[1]));
    const m = new T.Mesh(new T.LatheGeometry(pts, 32), new T.MeshStandardMaterial({ color: '#e2b53b', metalness: 0.95, roughness: 0.22 }));
    const base = new T.Mesh(new T.CylinderGeometry(0.1, 0.11, 0.06, 24), mat('#2b2b2b', { roughness: 0.3 })); base.position.y = -0.03;
    const g = new T.Group(); g.add(m, base);
    for (const s of [-1, 1]) { const h = new T.Mesh(new T.TorusGeometry(0.05, 0.01, 8, 16, Math.PI), m.material); h.position.set(s * 0.12, 0.33, 0); h.rotation.z = s * -Math.PI / 2; g.add(h); }
    return g;
  }

  // ---------- 경기장 ----------
  function pitchTexture() {
    const ppm = 10, mx = 6, W = (PH.halfLength * 2 + mx * 2) * ppm, H = (PH.halfWidth * 2 + mx * 2) * ppm;
    return canvasTex(W, H, (g) => {
      for (let i = 0; i < 20; i++) { g.fillStyle = i % 2 ? '#3f8a37' : '#4a9a40'; g.fillRect(i * W / 20, 0, W / 20 + 1, H); }
      // 잔디 노이즈
      for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '20,60,20' : '120,170,90'},0.06)`; g.fillRect(Math.random() * W, Math.random() * H, 3, 3); }
      g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 1.2 * ppm * 0.1 * 10 / 10 * 1.2;
      const X = x => (x + PH.halfLength + mx) * ppm, Y = z => (z + PH.halfWidth + mx) * ppm;
      const rect = (x0, z0, x1, z1) => g.strokeRect(X(x0), Y(z0), X(x1) - X(x0), Y(z1) - Y(z0));
      rect(-PH.halfLength, -PH.halfWidth, PH.halfLength, PH.halfWidth);
      g.beginPath(); g.moveTo(X(0), Y(-PH.halfWidth)); g.lineTo(X(0), Y(PH.halfWidth)); g.stroke();
      g.beginPath(); g.arc(X(0), Y(0), 9.15 * ppm, 0, Math.PI * 2); g.stroke();
      for (const s of [-1, 1]) {
        const gx = s * PH.halfLength;
        rect(Math.min(gx, gx - s * 16.5), -20.16, Math.max(gx, gx - s * 16.5), 20.16);
        rect(Math.min(gx, gx - s * 5.5), -9.16, Math.max(gx, gx - s * 5.5), 9.16);
        g.fillStyle = '#fff'; g.beginPath(); g.arc(X(gx - s * 11), Y(0), 3, 0, Math.PI * 2); g.fill();
        const a0 = s > 0 ? Math.PI - 0.93 : -0.93, a1 = s > 0 ? Math.PI + 0.93 : 0.93;
        g.beginPath(); g.arc(X(gx - s * 11), Y(0), 9.15 * ppm, a0, a1); g.stroke();
        for (const cz of [-1, 1]) { g.beginPath(); g.arc(X(gx), Y(cz * PH.halfWidth), 1 * ppm, 0, Math.PI * 2); g.stroke(); }
      }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(X(0), Y(0), 3, 0, Math.PI * 2); g.fill();
    });
  }

  function buildGoal(side) {
    const g = new T.Group(), white = mat('#f4f4f4', { roughness: 0.3 });
    const r = PH.postRadius;
    for (const s of [-1, 1]) { const p = new T.Mesh(new T.CylinderGeometry(r, r, PH.goalHeight, 12), white); p.position.set(0, PH.goalHeight / 2, s * PH.goalHalfWidth); p.castShadow = true; g.add(p); }
    const bar = new T.Mesh(new T.CylinderGeometry(r, r, PH.goalHalfWidth * 2, 12), white); bar.rotation.x = Math.PI / 2; bar.position.y = PH.goalHeight; g.add(bar);
    // 그물
    const netMat = new T.LineBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.45 });
    const pts = [], D = PH.goalDepth, W = PH.goalHalfWidth, Hh = PH.goalHeight;
    for (let z = -W; z <= W + 1e-6; z += 0.3) { pts.push(0, Hh, z, D, Hh * 0.7, z, D, Hh * 0.7, z, D, 0, z); }
    for (let y = 0; y <= Hh + 1e-6; y += 0.3) { const dx = y > Hh * 0.7 ? D * (Hh - y) / (Hh * 0.3) : D; pts.push(dx, y, -W, dx, y, W); }
    for (let x = 0; x <= D + 1e-6; x += 0.3) { const yt = x < D ? Hh - (Hh * 0.3) * x / D : Hh * 0.7; pts.push(x, yt, -W, x, yt, W); for (const s of [-1, 1]) pts.push(x, 0, s * W, x, yt, s * W); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    g.add(new T.LineSegments(geo, netMat));
    g.position.x = side * PH.halfLength; if (side < 0) g.rotation.y = Math.PI;
    return g;
  }

  function adBoardTexture() {
    return canvasTex(1024, 64, (g, w, h) => {
      g.fillStyle = '#0d1b3d'; g.fillRect(0, 0, w, h);
      g.font = 'bold 40px sans-serif'; g.fillStyle = '#ffd34d'; g.textBaseline = 'middle';
      g.fillText('WONKILAND FC 2026', 20, h / 2); g.fillStyle = '#fff'; g.fillText('원기랜드의 FC 2026', 560, h / 2);
    });
  }

  function buildStadium(scene, opts) {
    const root = new T.Group(); scene.add(root);
    const ground = new T.Mesh(new T.PlaneGeometry(400, 400), mat('#2e5e2a')); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; root.add(ground);
    const pitch = new T.Mesh(new T.PlaneGeometry(PH.halfLength * 2 + 12, PH.halfWidth * 2 + 12), new T.MeshStandardMaterial({ map: pitchTexture(), roughness: 0.95 }));
    pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; root.add(pitch);
    root.add(buildGoal(1), buildGoal(-1));
    // 코너 깃발
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const pole = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1.5, 6), mat('#eeeeee')); pole.position.set(sx * PH.halfLength, 0.75, sz * PH.halfWidth); root.add(pole);
      const flag = new T.Mesh(new T.PlaneGeometry(0.35, 0.25), new T.MeshStandardMaterial({ color: '#e63b2e', side: T.DoubleSide })); flag.position.set(sx * PH.halfLength + 0.17, 1.35, sz * PH.halfWidth); root.add(flag);
    }
    // 광고판
    const adTex = adBoardTexture(); adTex.wrapS = T.RepeatWrapping;
    const adMat = new T.MeshBasicMaterial({ map: adTex });
    const boards = [[0, PH.halfWidth + 4, PH.halfLength * 2 + 10, 0], [0, -PH.halfWidth - 4, PH.halfLength * 2 + 10, Math.PI], [PH.halfLength + 5, 0, PH.halfWidth * 2, -Math.PI / 2], [-PH.halfLength - 5, 0, PH.halfWidth * 2, Math.PI / 2]];
    for (const [x, z, len, ry] of boards) {
      const t = adTex.clone(); t.needsUpdate = true; t.repeat.set(len / 16, 1);
      const b = new T.Mesh(new T.PlaneGeometry(len, 0.9), new T.MeshBasicMaterial({ map: t })); b.position.set(x, 0.45, z); b.rotation.y = ry + Math.PI; root.add(b);
    }
    // 관중석 + 관중 (InstancedMesh, 그룹별로 다른 박자로 응원)
    const crowdGroups = [];
    const standMat = mat('#8d8a84', { roughness: 0.95 });
    const stands = [
      { cx: 0, cz: PH.halfWidth + 8, len: PH.halfLength * 2 + 14, rot: 0 },
      { cx: 0, cz: -PH.halfWidth - 8, len: PH.halfLength * 2 + 14, rot: Math.PI },
      { cx: PH.halfLength + 9, cz: 0, len: PH.halfWidth * 2 + 10, rot: -Math.PI / 2 },
      { cx: -PH.halfLength - 9, cz: 0, len: PH.halfWidth * 2 + 10, rot: Math.PI / 2 }];
    const tc = opts.teamColors || [['#7fb8e6', '#ffffff'], ['#75aadb', '#ffffff']];
    const personGeo = new T.BoxGeometry(0.45, 0.75, 0.35);
    const dummy = new T.Object3D();
    stands.forEach((st, si) => {
      const g = new T.Group(); g.position.set(st.cx, 0, st.cz); g.rotation.y = st.rot; root.add(g);
      const rows = 18;
      for (let r = 0; r < rows; r++) {
        const step = new T.Mesh(new T.BoxGeometry(st.len, 0.6, 1.0), standMat);
        step.position.set(0, 0.3 + r * 0.6, r * 1.0); step.receiveShadow = true; g.add(step);
      }
      // 지붕 없는 1930년대 스타일 콘크리트 스탠드 (프로토타입 단순화)
      const perGroup = 4, seatsPerRow = Math.floor(st.len / 0.75);
      const insts = []; for (let k = 0; k < perGroup; k++) insts.push([]);
      for (let r = 0; r < rows; r++) for (let i = 0; i < seatsPerRow; i++) {
        if (Math.random() < 0.12) continue;
        insts[(i + r) % perGroup].push([-st.len / 2 + i * 0.75 + 0.37, 0.6 + r * 0.6 + 0.38, r * 1.0]);
      }
      insts.forEach((list, k) => {
        const im = new T.InstancedMesh(personGeo, new T.MeshStandardMaterial({ roughness: 0.9 }), list.length);
        const col = new T.Color(); im.userData.teams = [];
        list.forEach((p, i) => {
          dummy.position.set(p[0], p[1], p[2]); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
          // 국가별 응원: 관중석 쪽마다 팀 색상 비율을 다르게
          const team = (si === 2 ? 0 : si === 3 ? 1 : (p[0] < 0 ? 0 : 1));
          const rnd = Math.random(); im.userData.teams.push([team, rnd, Math.floor(Math.random() * 5)]);
          col.set(rnd < 0.45 ? tc[team][0] : rnd < 0.6 ? tc[team][1] : ['#2b2b2b', '#4a3b2b', '#5c5c5c', '#ece5d8', '#7a2b2b'][Math.floor(Math.random() * 5)]);
          im.setColorAt(i, col);
        });
        const holder = new T.Group(); holder.add(im); g.add(holder);
        crowdGroups.push({ holder, phase: Math.random() * 6, team: si });
      });
    });
    // 조명탑 (야간 모드용; 1930년 센테나리오에는 조명 없음 → 역사 모드 기본은 주간)
    const lightTowers = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const tw = new T.Mesh(new T.CylinderGeometry(0.4, 0.6, 30, 8), mat('#666')); tw.position.set(sx * (PH.halfLength + 14), 15, sz * (PH.halfWidth + 20)); root.add(tw);
      const head = new T.Mesh(new T.BoxGeometry(4, 2.5, 0.6), new T.MeshStandardMaterial({ color: '#ffffff', emissive: '#000000' })); head.position.set(tw.position.x, 30.5, tw.position.z); head.lookAt(0, 0, 0); root.add(head);
      lightTowers.push({ tower: tw, head });
    }
    return { root, crowdGroups, lightTowers };
  }

  // 경기마다 양 팀 유니폼 색으로 관중 응원색 변경 (국가별 응원 연출)
  function recolorCrowd(stadium, tc) {
    const col = new T.Color(), neutral = ['#2b2b2b', '#4a3b2b', '#5c5c5c', '#ece5d8', '#7a2b2b'];
    for (const c of stadium.crowdGroups) {
      const im = c.holder.children[0];
      im.userData.teams.forEach(([team, rnd, n], i) => { col.set(rnd < 0.45 ? tc[team][0] : rnd < 0.6 ? tc[team][1] : neutral[n]); im.setColorAt(i, col); });
      im.instanceColor.needsUpdate = true;
    }
  }
  function updateCrowd(stadium, time, excitement) {
    for (const c of stadium.crowdGroups) {
      const e = excitement[c.team === 2 ? 0 : c.team === 3 ? 1 : 2] || 0;
      c.holder.position.y = Math.max(0, Math.sin(time * (3 + e * 5) + c.phase)) * (0.04 + e * 0.35);
    }
  }

  // ---------- 날씨 ----------
  function buildWeather(scene) {
    const N = 6000, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 140; pos[i * 3 + 1] = Math.random() * 40; pos[i * 3 + 2] = (Math.random() - 0.5) * 100; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ color: 0xaaccff, size: 0.12, transparent: true, opacity: 0.6 }));
    pts.visible = false; scene.add(pts);
    return { pts, kind: 'clear', update(dt) {
      if (!pts.visible) return;
      const a = geo.attributes.position.array, fall = this.kind === 'snow' ? 2.2 : 26;
      for (let i = 0; i < N; i++) {
        a[i * 3 + 1] -= fall * dt; if (this.kind === 'snow') a[i * 3] += Math.sin((a[i * 3 + 1] + i) * 0.5) * dt * 0.8;
        if (a[i * 3 + 1] < 0) a[i * 3 + 1] += 40;
      }
      geo.attributes.position.needsUpdate = true;
    }, set(kind) {
      this.kind = kind; pts.visible = kind !== 'clear';
      pts.material.color.set(kind === 'snow' ? 0xffffff : 0xaaccff); pts.material.size = kind === 'snow' ? 0.22 : 0.1;
    } };
  }

  function buildBall() {
    const tex = canvasTex(256, 128, (g, w, h) => {
      g.fillStyle = '#8b5a2b'; g.fillRect(0, 0, w, h); // 1930년대 갈색 가죽 공 (끈 있는 T형 디자인 근사)
      g.strokeStyle = '#4a2c12'; g.lineWidth = 3;
      for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(i * w / 6, 0); g.lineTo(i * w / 6, h); g.stroke(); }
      g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
      g.fillStyle = '#e8d9b5'; g.fillRect(w * 0.45, h * 0.42, w * 0.1, h * 0.16);
    });
    const m = new T.Mesh(new T.SphereGeometry(WFCPhysics.BALL.radius, 20, 14), new T.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    m.castShadow = true; return m;
  }

  window.WFCModels = { recolorCrowd, buildHumanoid, buildPlayer, buildHost, buildTrophy, buildStadium, updateCrowd, buildWeather, buildBall, animate, mat, canvasTex };
})();
