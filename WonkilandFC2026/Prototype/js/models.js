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

  // ---------- 공통 인체 리그 v2 (실사풍 해부학 형태) ----------
  // 관절(pivot) 계층은 v1과 동일 → 모든 선수/개최자가 같은 애니메이션 코드를 공유한다.
  // 부드러운 캡슐·회전체(lathe) 형태 + 얼굴 디테일 + 피부/원단 재질.
  function pivot(parent, x, y, z) { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; }
  const geoCache = {};
  const G = (key, make) => geoCache[key] || (geoCache[key] = make());
  function capsule(r, len, seg) { return G(`cap${r}_${len}`, () => new T.CapsuleGeometry(r, len, 6, seg || 12)); }
  function addMesh(parent, geo, material, x, y, z, sx, sy, sz) {
    const m = new T.Mesh(geo, material); m.position.set(x || 0, y || 0, z || 0);
    if (sx) m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m;
  }
  // 몸통 단면 프로파일 (허리 → 가슴 → 어깨 → 목)
  function torsoGeo(kind) {
    return G('torso_' + kind, () => {
      const prof = kind === 'host'
        ? [[0.001, -0.02], [0.18, -0.02], [0.2, 0.08], [0.215, 0.22], [0.215, 0.36], [0.2, 0.47], [0.16, 0.53], [0.075, 0.57], [0.001, 0.58]]
        : [[0.001, -0.02], [0.15, -0.02], [0.152, 0.08], [0.172, 0.2], [0.19, 0.33], [0.19, 0.44], [0.165, 0.51], [0.075, 0.565], [0.001, 0.575]];
      const g = new T.LatheGeometry(prof.map(p => new T.Vector2(p[0], p[1])), 28);
      g.scale(1, 1, kind === 'host' ? 0.78 : 0.62); g.computeVertexNormals(); return g;
    });
  }
  // 원단 질감 (미세한 직조 요철)
  let fabricBump = null;
  function fabric() {
    if (fabricBump) return fabricBump;
    fabricBump = canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { const v = 110 + ((x + y) % 4 ? 30 : 0) + Math.random() * 30; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 2, 2); }
    });
    fabricBump.encoding = T.LinearEncoding; fabricBump.wrapS = fabricBump.wrapT = T.RepeatWrapping;
    return fabricBump;
  }
  const skinCache = {};
  function skinMaterial(color) {
    return skinCache[color] || (skinCache[color] = new T.MeshPhysicalMaterial({ color, roughness: 0.58, metalness: 0, sheen: 0.25, sheenRoughness: 0.8, sheenColor: new T.Color('#ffd9c8'), clearcoat: 0, clearcoatRoughness: 0.5 }));
  }
  // 비 오는 날: 땀·젖은 피부 광택
  function setWet(w) { Object.values(skinCache).forEach(m => { m.clearcoat = w ? 0.45 : 0; m.needsUpdate = true; }); }

  function buildHumanoid(o) {
    const build = o.build || 1, host = o.kind === 'host';
    const skin = o.skinMat || skinMaterial(o.skin);
    const root = new T.Group();
    const body = pivot(root, 0, 0, 0);
    const hips = pivot(body, 0, 0.95, 0);
    const torso = pivot(hips, 0, 0.02, 0);
    // 몸통(상의) + 반바지(또는 정장 바지 상단)
    const chest = addMesh(torso, torsoGeo(host ? 'host' : 'player'), o.shirtMat); chest.scale.x = build;
    addMesh(hips, G('pelvis', () => { const g = new T.CapsuleGeometry(0.15, 0.08, 6, 16); g.scale(1.12, 1, 0.72); return g; }), o.shortsMat, 0, -0.03, 0).scale.x = build;
    // 목 + 머리
    addMesh(torso, G('neck', () => new T.CylinderGeometry(0.052, 0.06, 0.12, 12)), skin, 0, 0.6, 0.005);
    const head = pivot(torso, 0, 0.74, 0.01);
    buildHead(head, o, skin);
    const J = { root, body, hips, torso, head };
    for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
      // 팔
      const sh = pivot(torso, s * (host ? 0.235 : 0.205) * build, 0.47, 0);
      addMesh(sh, G('delt', () => new T.SphereGeometry(0.07, 14, 10)), o.sleeveMat || o.shirtMat, 0, -0.02, 0, 1, 1.1, 0.95);
      addMesh(sh, capsule(0.047, 0.2), o.upperArmMat || o.sleeveMat || o.shirtMat, 0, -0.15, 0);
      if (o.sleeve === 'short') addMesh(sh, G('sleeve', () => new T.CylinderGeometry(0.066, 0.062, 0.15, 14, 1, true)), o.shirtMat, 0, -0.08, 0);
      const el = pivot(sh, 0, -0.29, 0);
      addMesh(el, capsule(0.04, 0.19), o.forearmMat || skin, 0, -0.12, 0);
      // 손 (손바닥 + 엄지)
      const hand = o.gloveMat || skin;
      addMesh(el, G('palm', () => { const g = new T.CapsuleGeometry(0.035, 0.05, 4, 10); g.scale(1, 1, 0.55); return g; }), hand, 0, -0.29, 0);
      addMesh(el, capsule(0.012, 0.03, 6), hand, s * -0.03, -0.27, 0.015).rotation.z = s * 0.5;
      // 다리
      const hp = pivot(hips, s * 0.095 * build, -0.06, 0);
      addMesh(hp, capsule(0.072, 0.28), o.thighMat || skin, 0, -0.2, 0, build, 1, 1);
      if (!o.trousers) addMesh(hp, G('shortsLeg', () => new T.CylinderGeometry(0.098, 0.088, 0.2, 16, 1, true)), o.shortsMat, 0, -0.07, 0);
      const kn = pivot(hp, 0, -0.42, 0);
      addMesh(kn, capsule(0.05, 0.3), o.shinMat || o.sockMat, 0, -0.2, 0);
      addMesh(kn, G('calf', () => new T.SphereGeometry(0.058, 12, 10)), o.shinMat || o.sockMat, 0, -0.12, -0.02, 1, 1.6, 1.1);
      // 축구화 / 구두
      const bootM = mat(o.bootColor || '#1b1410', { roughness: o.trousers ? 0.25 : 0.45 });
      addMesh(kn, G('boot', () => { const g = new T.CapsuleGeometry(0.045, 0.16, 4, 12); g.rotateX(Math.PI / 2); g.scale(1.05, 0.85, 1); return g; }), bootM, 0, -0.43, 0.05);
      addMesh(kn, G('sole', () => new T.BoxGeometry(0.095, 0.018, 0.26)), mat('#2a2a2a'), 0, -0.468, 0.05);
      J['shoulder' + n] = sh; J['elbow' + n] = el; J['hip' + n] = hp; J['knee' + n] = kn;
    }
    // 등번호·이름 (1950년 이후 대회)
    if (o.number) {
      const tex = numberTexture(o.number, o.backName, o.numberColor);
      const back = new T.Mesh(G('numPlane', () => new T.PlaneGeometry(0.26, 0.3)), new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      back.position.set(0, 0.3, -0.122); back.rotation.y = Math.PI; torso.add(back);
      const front = new T.Mesh(G('numPlaneS', () => new T.PlaneGeometry(0.08, 0.08)), new T.MeshStandardMaterial({ map: numberTexture(o.number, null, o.numberColor), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      front.position.set(-0.08, 0.36, 0.118); torso.add(front);
    }
    root.userData.joints = J;
    root.userData.pose = {};
    return root;
  }
  const numCache = {};
  function numberTexture(num, name, color) {
    const key = `${num}|${name}|${color}`;
    if (numCache[key]) return numCache[key];
    return (numCache[key] = canvasTex(128, 148, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = color; g.textAlign = 'center';
      if (name) { g.font = 'bold 17px Arial, sans-serif'; g.fillText(name.toUpperCase().slice(0, 12), w / 2, 22); }
      g.font = 'bold 96px Arial, sans-serif'; g.fillText(String(num), w / 2, name ? 128 : 112);
    }));
  }
  // 머리: 두개골 + 턱 + 귀 + 눈(흰자·홍채) + 눈썹 + 코 + 입 + 헤어스타일
  function buildHead(head, o, skin) {
    addMesh(head, G('skull', () => new T.SphereGeometry(0.105, 24, 18)), skin, 0, 0.012, -0.004, 1, 1.13, 1.07);
    addMesh(head, G('jaw', () => new T.SphereGeometry(0.078, 18, 12)), skin, 0, -0.052, 0.022, 1, 0.82, 1);
    for (const s of [-1, 1]) addMesh(head, G('ear', () => new T.SphereGeometry(0.024, 10, 8)), skin, s * 0.104, 0.002, -0.006, 0.45, 1.05, 0.8);
    if (o.photoFace) return; // 개최자: 사진 얼굴 텍스처 사용
    const white = mat('#f2efe9', { roughness: 0.25 }), iris = mat(o.eyeColor || '#3b2a1e', { roughness: 0.2 }), brow = mat(o.hair, { roughness: 0.9 });
    for (const s of [-1, 1]) {
      addMesh(head, G('eyeW', () => new T.SphereGeometry(0.0145, 12, 10)), white, s * 0.036, 0.018, 0.088, 1, 0.75, 0.6);
      addMesh(head, G('iris', () => new T.SphereGeometry(0.0072, 10, 8)), iris, s * 0.036, 0.018, 0.0965);
      addMesh(head, G('brow', () => { const g = new T.CapsuleGeometry(0.0055, 0.026, 3, 6); g.rotateZ(Math.PI / 2); return g; }), brow, s * 0.037, 0.039, 0.093).rotation.z = s * -0.12;
    }
    addMesh(head, G('nose', () => { const g = new T.ConeGeometry(0.016, 0.045, 10); g.rotateX(Math.PI / 2 + 0.35); return g; }), skin, 0, -0.004, 0.105);
    addMesh(head, G('nostril', () => new T.SphereGeometry(0.014, 10, 8)), skin, 0, -0.018, 0.108, 1.25, 0.7, 0.8);
    addMesh(head, G('lip', () => { const g = new T.CapsuleGeometry(0.0055, 0.028, 3, 8); g.rotateZ(Math.PI / 2); return g; }), mat('#9a5a50', { roughness: 0.5 }), 0, -0.048, 0.092);
    buildHair(head, o.hair, o.hairStyle, o.beard);
  }
  function buildHair(head, color, style, beard) {
    const m = new T.MeshStandardMaterial({ color, roughness: 0.75, bumpMap: fabric(), bumpScale: 0.004 });
    if (style !== 'bald') {
      const cap = style === 'long' ? 0.62 : style === 'cropped' ? 0.42 : 0.5;
      const g = G('hair_' + style, () => {
        const h = new T.SphereGeometry(0.112, 24, 14, 0, Math.PI * 2, 0, Math.PI * cap);
        if (style === 'curly') { const p = h.attributes.position; for (let i = 0; i < p.count; i++) { const f = 1 + 0.07 * Math.sin(p.getX(i) * 140) * Math.cos(p.getZ(i) * 140); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f); } h.computeVertexNormals(); }
        return h;
      });
      const hm = addMesh(head, g, m, 0, style === 'cropped' ? 0.024 : 0.02, -0.012, 1.02, style === 'curly' ? 1.18 : 1.08, 1.08); hm.rotation.x = -0.32;
      if (style === 'long') addMesh(head, G('hairBack', () => new T.CapsuleGeometry(0.075, 0.08, 4, 12)), m, 0, -0.06, -0.06, 1.25, 1, 0.6);
    }
    if (beard) addMesh(head, G('beard', () => new T.SphereGeometry(0.081, 18, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55)), m, 0, -0.045, 0.024, 1.02, 0.9, 1.04);
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
  const SKIN_VARIANTS = ['#e8bfa5', '#d9a688', '#c38b6a', '#a8735a', '#8a5a40', '#6a4030', '#4f3024'];
  function hashStr(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
  const GK_COLORS = ['#f5d000', '#21a35b', '#222222', '#7b3fbf', '#ff7a00', '#2bb5d8'];
  function luminance(hex) { const c = new T.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }
  // 확인된 외형 데이터가 없으므로 결정적(항상 같은) 플레이스홀더 외형 사용 - 실제 외형 아님.
  // 국적으로 외형을 추정하지 않는다(부정확·고정관념 방지). 피부톤/머리 등은 선수 ID 해시로만 결정.
  function buildPlayer(pdata, kit, isGK, gkColor) {
    const h = hashStr(pdata.person_id || pdata.version_id);
    const ap = pdata.appearance || {};
    const skin = ap.skin_tone_ref || SKIN_VARIANTS[h % SKIN_VARIANTS.length];
    const hair = ['#1a1410', '#2b1d14', '#3a2a1c', '#141414', '#5a3b22', '#8a6a3a', '#b8945a', '#6b6b6b'][(h >> 3) % 8];
    const era = pdata.tournament_year || 2022;
    const gkCol = gkColor || (era < 1970 ? '#2f3b2f' : GK_COLORS[h % GK_COLORS.length]);
    const shirtMat = isGK ? new T.MeshStandardMaterial({ color: gkCol, roughness: 0.85, bumpMap: fabric(), bumpScale: 0.002 })
      : new T.MeshStandardMaterial({ map: shirtTexture(kit), roughness: 0.82, bumpMap: fabric(), bumpScale: 0.002 });
    const longSleeve = isGK || era < 1960;
    const shortsCol = isGK && era >= 1970 ? gkCol : kit.shorts.colors[0];
    const sockMat = new T.MeshStandardMaterial({ color: kit.socks.colors[0], roughness: 0.9, bumpMap: fabric(), bumpScale: 0.002 });
    const styles = era < 1960 ? ['short', 'cropped', 'short'] : era < 1990 ? ['short', 'long', 'curly', 'cropped'] : ['cropped', 'short', 'curly', 'bald', 'long'];
    const shirtMain = isGK ? gkCol : kit.shirt.colors[0];
    const model = buildHumanoid({
      kind: 'player', shirtMat, sleeveMat: shirtMat, upperArmMat: longSleeve ? shirtMat : null, forearmMat: longSleeve ? shirtMat : null, sleeve: longSleeve ? 'long' : 'short',
      shortsMat: new T.MeshStandardMaterial({ color: shortsCol, roughness: 0.75 }), sockMat, skin, hair,
      hairStyle: styles[(h >> 5) % styles.length], beard: era >= 1970 && (h >> 11) % 6 === 0, eyeColor: ['#3b2a1e', '#2a1d14', '#4a5a3a', '#3a5a7a'][(h >> 13) % 4],
      build: 0.95 + (h % 9) / 100,
      bootColor: era < 1970 ? '#1b1410' : ['#111111', '#f2f2f2', '#e0402a', '#2a7de0', '#e8c22a'][(h >> 7) % 5],
      gloveMat: isGK && era >= 1970 ? mat('#f4f4f4') : null,
      number: era >= 1950 && pdata.shirt_number ? pdata.shirt_number : null,
      backName: era >= 1994 ? (pdata.family_name || pdata.name_en || '').split(' ').pop().normalize('NFD').replace(/[̀-ͯ]/g, '') : null,
      numberColor: luminance(shirtMain) > 0.45 ? '#111111' : '#ffffff'
    });
    // 신장 미확인 → 시대 평균 근사 플레이스홀더(1930 약 173cm → 2022 약 182cm) + 개인차
    const hcm = pdata.height_cm || (173 + (Math.min(era, 2022) - 1930) * 0.1 + ((h >> 9) % 9) - 4 + (isGK ? 4 : 0));
    model.scale.setScalar(hcm / 178);
    const sh = new T.Mesh(G('shadowDisc', () => new T.CircleGeometry(0.35, 16)), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; model.add(sh);
    return model;
  }

  // ---------- 개최자 장원기 ----------
  // 단일 정의(Data/host/host_character.json)로부터 항상 같은 모델을 만든다 → 장면마다 얼굴이 바뀌지 않음.
  let hostFaceTex = null;
  function buildHost(def) {
    const ap = def.appearance, of = def.outfit;
    const suit = new T.MeshStandardMaterial({ color: of.suit, roughness: 0.6, bumpMap: fabric(), bumpScale: 0.0015 });
    const model = buildHumanoid({
      kind: 'host', shirtMat: suit, sleeveMat: suit, upperArmMat: suit, forearmMat: suit, shortsMat: suit, thighMat: suit, shinMat: suit, sockMat: suit, trousers: true,
      skin: ap.skin_tone, hair: ap.hair.color, hairStyle: 'cropped', build: 1.18, bootColor: of.shoes, photoFace: !!window.WFC_HOST_FACE
    });
    const J = model.userData.joints;
    // 셔츠 V존 + 넥타이 + 라펠 + 포켓치프 + 소매 끝 셔츠
    addMesh(J.torso, G('shirtV', () => { const g = new T.PlaneGeometry(0.15, 0.28); return g; }), mat(of.shirt, { roughness: 0.5 }), 0, 0.42, 0.137);
    addMesh(J.torso, G('tie', () => { const g = new T.CylinderGeometry(0.03, 0.018, 0.27, 4); g.rotateY(Math.PI / 4); g.scale(1, 1, 0.25); return g; }), mat(of.tie, { roughness: 0.35 }), 0, 0.41, 0.142);
    addMesh(J.torso, G('knot', () => new T.SphereGeometry(0.02, 8, 6)), mat(of.tie, { roughness: 0.35 }), 0, 0.535, 0.13);
    for (const s of [-1, 1]) { const l = addMesh(J.torso, G('lapel', () => new T.BoxGeometry(0.06, 0.3, 0.012)), mat('#16213a', { roughness: 0.5 }), s * 0.085, 0.42, 0.14); l.rotation.z = s * 0.38; }
    addMesh(J.torso, G('psq', () => new T.PlaneGeometry(0.05, 0.025)), mat(of.pocket_square), 0.12, 0.47, 0.142);
    for (const n of ['L', 'R']) addMesh(J['elbow' + n], G('cuff', () => new T.CylinderGeometry(0.043, 0.043, 0.03, 12)), mat(of.shirt), 0, -0.24, 0);
    // 사진 기반 얼굴 텍스처 (참조 사진 크롭 - 실사 3D 스캔 아님)
    if (window.WFC_HOST_FACE) {
      if (!hostFaceTex) { hostFaceTex = new T.TextureLoader().load(window.WFC_HOST_FACE); hostFaceTex.encoding = T.sRGBEncoding; }
      const face = new T.Mesh(new T.SphereGeometry(0.108, 32, 24, Math.PI * 0.14, Math.PI * 0.72, Math.PI * 0.14, Math.PI * 0.68),
        new T.MeshPhysicalMaterial({ map: hostFaceTex, transparent: true, roughness: 0.6, sheen: 0.2 }));
      face.scale.set(1.04, 1.16, 1.1); face.position.set(0, 0.0, 0.004);
      J.head.add(face);
      buildHair(J.head, ap.hair.color, 'cropped', false);
    }
    J.head.scale.setScalar(1.06);
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
  // 고해상도 잔디: 잔디깎기 줄무늬 + 픽셀 단위 잔디 결 + 골문 앞 마모 + 라인
  function pitchTexture() {
    const ppm = 24, mx = 6, W = (PH.halfLength * 2 + mx * 2) * ppm, H = (PH.halfWidth * 2 + mx * 2) * ppm;
    const tex = canvasTex(W, H, (g) => {
      const X = x => (x + PH.halfLength + mx) * ppm, Y = z => (z + PH.halfWidth + mx) * ppm;
      const img = g.createImageData(W, H), d = img.data;
      const stripe = W / 22;
      let seed = 1234567; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const st = Math.floor(x / stripe) % 2 ? 1 : 0;
        const n = rnd(), blade = (Math.sin(x * 1.7 + y * 0.3) * 0.5 + 0.5) * 0.08;
        let r = 52 + st * 10, gg = 112 + st * 16, b = 44 + st * 6;
        const k = 0.85 + n * 0.3 + blade;
        // 골문 앞·센터서클 마모(흙빛)
        const wx = Math.min(Math.abs(x - X(-PH.halfLength + 6)), Math.abs(x - X(PH.halfLength - 6))) / ppm, wy = Math.abs(y - Y(0)) / ppm;
        const wear = Math.max(0, 1 - Math.hypot(wx / 6, wy / 4)) * 0.45 + Math.max(0, 1 - Math.hypot((x - X(0)) / ppm / 3, wy / 3)) * 0.2;
        r = r * k * (1 - wear) + 120 * wear * (0.8 + n * 0.4); gg = gg * k * (1 - wear) + 100 * wear * (0.8 + n * 0.4); b = b * k * (1 - wear) + 60 * wear;
        d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      g.strokeStyle = 'rgba(245,245,240,0.9)'; g.lineWidth = 0.12 * ppm; g.lineCap = 'round';
      const rect = (x0, z0, x1, z1) => g.strokeRect(X(x0), Y(z0), X(x1) - X(x0), Y(z1) - Y(z0));
      rect(-PH.halfLength, -PH.halfWidth, PH.halfLength, PH.halfWidth);
      g.beginPath(); g.moveTo(X(0), Y(-PH.halfWidth)); g.lineTo(X(0), Y(PH.halfWidth)); g.stroke();
      g.beginPath(); g.arc(X(0), Y(0), 9.15 * ppm, 0, Math.PI * 2); g.stroke();
      for (const s of [-1, 1]) {
        const gx = s * PH.halfLength;
        rect(Math.min(gx, gx - s * 16.5), -20.16, Math.max(gx, gx - s * 16.5), 20.16);
        rect(Math.min(gx, gx - s * 5.5), -9.16, Math.max(gx, gx - s * 5.5), 9.16);
        g.fillStyle = 'rgba(245,245,240,0.95)'; g.beginPath(); g.arc(X(gx - s * 11), Y(0), 0.15 * ppm, 0, Math.PI * 2); g.fill();
        const a0 = s > 0 ? Math.PI - 0.93 : -0.93, a1 = s > 0 ? Math.PI + 0.93 : 0.93;
        g.beginPath(); g.arc(X(gx - s * 11), Y(0), 9.15 * ppm, a0, a1); g.stroke();
        for (const cz of [-1, 1]) { g.beginPath(); g.arc(X(gx), Y(cz * PH.halfWidth), 1 * ppm, cz > 0 ? (s > 0 ? Math.PI : 1.5 * Math.PI) : (s > 0 ? 0.5 * Math.PI : 0), cz > 0 ? (s > 0 ? 1.5 * Math.PI : 2 * Math.PI) : (s > 0 ? Math.PI : 0.5 * Math.PI)); g.stroke(); }
      }
      g.fillStyle = 'rgba(245,245,240,0.95)'; g.beginPath(); g.arc(X(0), Y(0), 0.15 * ppm, 0, Math.PI * 2); g.fill();
      // 라인 위 미세한 잔디 얼룩
      for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(60,110,50,${0.08 + Math.random() * 0.1})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    });
    tex.anisotropy = 8;
    return tex;
  }

  function buildGoal(side) {
    const g = new T.Group(), white = new T.MeshPhysicalMaterial({ color: '#f6f6f6', roughness: 0.25, clearcoat: 0.6 });
    const r = PH.postRadius;
    for (const s of [-1, 1]) { const p = new T.Mesh(new T.CylinderGeometry(r, r, PH.goalHeight, 16), white); p.position.set(0, PH.goalHeight / 2, s * PH.goalHalfWidth); p.castShadow = true; g.add(p); }
    const bar = new T.Mesh(new T.CylinderGeometry(r, r, PH.goalHalfWidth * 2 + 2 * r, 16), white); bar.rotation.x = Math.PI / 2; bar.position.y = PH.goalHeight; bar.castShadow = true; g.add(bar);
    // 그물 지지대
    const sup = mat('#cccccc', { roughness: 0.4 }), D = PH.goalDepth, W = PH.goalHalfWidth, Hh = PH.goalHeight;
    for (const s of [-1, 1]) { const b = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, Math.hypot(D, Hh * 0.3), 6), sup); b.position.set(D / 2, Hh * 0.85, s * W); b.rotation.z = Math.atan2(D, Hh * 0.3) + Math.PI / 2; g.add(b); }
    // 그물 (그물 무늬 텍스처를 입힌 반투명 면 → 실제 그물처럼 보이게)
    const netTex = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h); c.stroke(); });
    netTex.wrapS = netTex.wrapT = T.RepeatWrapping;
    const netMat = r2 => { const t = netTex.clone(); t.needsUpdate = true; t.repeat.set(r2[0], r2[1]); return new T.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.3, side: T.DoubleSide, roughness: 0.9 }); };
    const back = new T.Mesh(new T.PlaneGeometry(W * 2, Hh * 0.7), netMat([W * 2 / 0.12, Hh * 0.7 / 0.12])); back.position.set(D, Hh * 0.35, 0); back.rotation.y = Math.PI / 2; g.add(back);
    const roofLen = Math.hypot(D, Hh * 0.3);
    const top = new T.Mesh(new T.PlaneGeometry(roofLen, W * 2), netMat([roofLen / 0.12, W * 2 / 0.12])); top.position.set(D / 2, Hh * 0.85, 0); top.rotation.x = -Math.PI / 2; top.rotation.y = -Math.atan2(Hh * 0.3, D); g.add(top);
    for (const s of [-1, 1]) {
      const sh = new T.Shape([new T.Vector2(0, 0), new T.Vector2(D, 0), new T.Vector2(D, Hh * 0.7), new T.Vector2(0, Hh)]);
      const geo = new T.ShapeGeometry(sh); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.12, uv.getY(i) / 0.12);
      const t2 = netTex.clone(); t2.needsUpdate = true; t2.repeat.set(1, 1);
      const side = new T.Mesh(geo, new T.MeshStandardMaterial({ map: t2, transparent: true, alphaTest: 0.3, side: T.DoubleSide })); side.position.z = s * W; g.add(side);
    }
    g.position.x = side * PH.halfLength; if (side < 0) g.rotation.y = Math.PI;
    return g;
  }

  function adBoardTexture() {
    return canvasTex(1024, 64, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#13285a'); gr.addColorStop(1, '#0a1634'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.font = 'bold 40px sans-serif'; g.fillStyle = '#ffd34d'; g.textBaseline = 'middle';
      g.fillText('WONKILAND FC 2026', 20, h / 2); g.fillStyle = '#fff'; g.fillText('원기랜드의 FC 2026', 560, h / 2);
    });
  }

  function buildStadium(scene, opts) {
    const root = new T.Group(); scene.add(root);
    const ground = new T.Mesh(new T.PlaneGeometry(500, 500), mat('#2a4d26', { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; root.add(ground);
    const pitch = new T.Mesh(new T.PlaneGeometry(PH.halfLength * 2 + 12, PH.halfWidth * 2 + 12), new T.MeshStandardMaterial({ map: pitchTexture(), roughness: 0.92 }));
    pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; root.add(pitch);
    // 경기장 둘레 트랙/콘크리트
    const apron = new T.Mesh(new T.RingGeometry(1, 2, 4, 1), mat('#3d5a35')); apron.visible = false; root.add(apron);
    root.add(buildGoal(1), buildGoal(-1));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const pole = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1.5, 8), mat('#f2f2f2', { roughness: 0.3 })); pole.position.set(sx * PH.halfLength, 0.75, sz * PH.halfWidth); pole.castShadow = true; root.add(pole);
      const flag = new T.Mesh(new T.PlaneGeometry(0.35, 0.25, 6, 1), new T.MeshStandardMaterial({ color: '#e63b2e', side: T.DoubleSide })); flag.position.set(sx * PH.halfLength + 0.17, 1.35, sz * PH.halfWidth); root.add(flag);
    }
    // 광고판 (약간 기울어진 실제 형태)
    const adTex = adBoardTexture(); adTex.wrapS = T.RepeatWrapping;
    const boards = [[0, PH.halfWidth + 4, PH.halfLength * 2 + 10, 0], [0, -PH.halfWidth - 4, PH.halfLength * 2 + 10, Math.PI], [PH.halfLength + 5, 0, PH.halfWidth * 2, -Math.PI / 2], [-PH.halfLength - 5, 0, PH.halfWidth * 2, Math.PI / 2]];
    for (const [x, z, len, ry] of boards) {
      const t = adTex.clone(); t.needsUpdate = true; t.repeat.set(len / 16, 1);
      const b = new T.Mesh(new T.PlaneGeometry(len, 0.9), new T.MeshStandardMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.35, roughness: 0.4 }));
      b.position.set(x, 0.45, z); b.rotation.y = ry + Math.PI; root.add(b);
    }
    // 관중석: 좌석 줄무늬 계단 + 뒤 벽 + (장변) 캔틸레버 지붕
    const crowdGroups = [];
    const seatTex = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#6f6c66'; g.fillRect(0, 0, w, h); g.fillStyle = '#7d2630'; g.fillRect(0, h * 0.35, w, h * 0.4); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = 0; x < w; x += 8) g.fillRect(x, h * 0.35, 1, h * 0.4); });
    seatTex.wrapS = seatTex.wrapT = T.RepeatWrapping;
    const stands = [
      { cx: 0, cz: PH.halfWidth + 8, len: PH.halfLength * 2 + 14, rot: 0, roof: true },
      { cx: 0, cz: -PH.halfWidth - 8, len: PH.halfLength * 2 + 14, rot: Math.PI, roof: true },
      { cx: PH.halfLength + 9, cz: 0, len: PH.halfWidth * 2 + 10, rot: Math.PI / 2 },   // 로컬 +z(뒷줄)가 경기장 바깥(+x)을 향하도록
      { cx: -PH.halfLength - 9, cz: 0, len: PH.halfWidth * 2 + 10, rot: -Math.PI / 2 }];
    const tc = opts.teamColors || [['#7fb8e6', '#ffffff'], ['#75aadb', '#ffffff']];
    // 관중 1명 = 상체(사다리꼴) + 팔 / 머리는 별도 인스턴스(피부색)
    const BGU = T.Addons && T.Addons.BufferGeometryUtils;
    const torsoG = new T.CylinderGeometry(0.17, 0.22, 0.55, 6); torsoG.translate(0, 0.27, 0);
    const legsG = new T.BoxGeometry(0.36, 0.3, 0.42); legsG.translate(0, -0.05, 0.12);
    const armsG = new T.BoxGeometry(0.52, 0.12, 0.14); armsG.translate(0, 0.42, 0.04);
    const personGeo = BGU ? BGU.mergeBufferGeometries([torsoG, legsG, armsG]) : torsoG;
    const headGeo = new T.SphereGeometry(0.11, 10, 8); headGeo.translate(0, 0.66, 0);
    const dummy = new T.Object3D();
    const SKINS = ['#e2b59a', '#c99a7c', '#a8765a', '#7a5038', '#5a3a28', '#eac4ad'];
    stands.forEach((st, si) => {
      const g = new T.Group(); g.position.set(st.cx, 0, st.cz); g.rotation.y = st.rot; root.add(g);
      const rows = 22;
      const stepGeo = new T.BoxGeometry(st.len, 0.6, 1.0);
      const sTex = seatTex.clone(); sTex.needsUpdate = true; sTex.repeat.set(st.len / 0.75, 1);
      const stepMat = new T.MeshStandardMaterial({ map: sTex, roughness: 0.9 });
      for (let r = 0; r < rows; r++) { const step = new T.Mesh(stepGeo, stepMat); step.position.set(0, 0.3 + r * 0.6, r * 1.0); step.receiveShadow = true; g.add(step); }
      const wall = new T.Mesh(new T.BoxGeometry(st.len + 2, 18, 1.2), mat('#8a8780', { roughness: 0.95 })); wall.position.set(0, 9, rows + 0.6); wall.receiveShadow = true; g.add(wall);
      // 앞쪽 펜스
      const fence = new T.Mesh(new T.BoxGeometry(st.len, 1.1, 0.15), mat('#d9d9d9', { roughness: 0.5 })); fence.position.set(0, 0.55, -0.6); g.add(fence);
      if (st.roof) {
        const roof = new T.Mesh(new T.BoxGeometry(st.len + 4, 0.35, 16), new T.MeshStandardMaterial({ color: '#d8dce2', roughness: 0.45, metalness: 0.4 }));
        roof.position.set(0, 19.5, rows - 6); roof.rotation.x = -0.08; roof.castShadow = true; g.add(roof);
        for (let x = -st.len / 2; x <= st.len / 2 + 0.1; x += st.len / 8) {
          const col = new T.Mesh(new T.CylinderGeometry(0.25, 0.3, 19.5, 8), mat('#b9bec6', { metalness: 0.5, roughness: 0.4 })); col.position.set(x, 9.75, rows + 0.2); g.add(col);
          const truss = new T.Mesh(new T.BoxGeometry(0.3, 0.9, 16), mat('#b9bec6', { metalness: 0.5, roughness: 0.4 })); truss.position.set(x, 20.1, rows - 6); truss.rotation.x = -0.08; g.add(truss);
        }
      }
      const perGroup = 4, seatsPerRow = Math.floor(st.len / 0.62);
      const insts = []; for (let k = 0; k < perGroup; k++) insts.push([]);
      for (let r = 0; r < rows; r++) for (let i = 0; i < seatsPerRow; i++) {
        if (Math.random() < 0.08) continue;
        insts[(i + r) % perGroup].push([-st.len / 2 + i * 0.62 + 0.31 + (Math.random() - 0.5) * 0.1, 0.6 + r * 0.6 + 0.2, r * 1.0 + 0.1, (Math.random() - 0.5) * 0.5, 0.9 + Math.random() * 0.2]);
      }
      insts.forEach(list => {
        const im = new T.InstancedMesh(personGeo, new T.MeshStandardMaterial({ roughness: 0.85 }), list.length);
        const hm = new T.InstancedMesh(headGeo, new T.MeshStandardMaterial({ roughness: 0.7 }), list.length);
        const col = new T.Color(); im.userData.teams = [];
        list.forEach((p, i) => {
          dummy.position.set(p[0], p[1], p[2]); dummy.rotation.set(0, Math.PI + p[3], 0); dummy.scale.setScalar(p[4]); dummy.updateMatrix();
          im.setMatrixAt(i, dummy.matrix); hm.setMatrixAt(i, dummy.matrix);
          const team = (si === 2 ? 0 : si === 3 ? 1 : (p[0] < 0 ? 0 : 1));
          const rnd = Math.random(); im.userData.teams.push([team, rnd, Math.floor(Math.random() * 5)]);
          col.set(rnd < 0.45 ? tc[team][0] : rnd < 0.6 ? tc[team][1] : ['#2b2b2b', '#4a3b2b', '#5c5c5c', '#ece5d8', '#7a2b2b'][Math.floor(Math.random() * 5)]);
          im.setColorAt(i, col); hm.setColorAt(i, col.set(SKINS[Math.floor(Math.random() * SKINS.length)]));
        });
        const holder = new T.Group(); holder.add(im); holder.add(hm); g.add(holder);
        crowdGroups.push({ holder, phase: Math.random() * 6, team: si });
      });
    });
    // 조명탑 (야간 모드용; 1930년 센테나리오에는 조명 없음)
    const lightTowers = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const tw = new T.Mesh(new T.CylinderGeometry(0.4, 0.7, 34, 10), mat('#8c9096', { metalness: 0.5, roughness: 0.5 })); tw.position.set(sx * (PH.halfLength + 16), 17, sz * (PH.halfWidth + 24)); root.add(tw);
      const head = new T.Mesh(new T.BoxGeometry(6, 3.5, 0.6), new T.MeshStandardMaterial({ color: '#ffffff', emissive: '#000000' })); head.position.set(tw.position.x, 34.5, tw.position.z); head.lookAt(0, 0, 0); root.add(head);
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

  // ---------- 공: 시대별 디자인 (상표·로고 없는 일반적 형태 재현) ----------
  const ballTexCache = {};
  function ballTexture(era) {
    const kind = era < 1962 ? 'leather' : era < 1970 ? 'panel' : era < 2006 ? 'classic' : 'modern';
    if (ballTexCache[kind]) return ballTexCache[kind];
    const tex = canvasTex(512, 256, (g, w, h) => {
      if (kind === 'leather') { // 갈색 가죽 + 끈
        g.fillStyle = '#8b5a2b'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '60,35,15' : '150,100,60'},0.12)`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
        g.strokeStyle = '#4a2c12'; g.lineWidth = 3;
        for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(i * w / 6, 0); g.lineTo(i * w / 6, h); g.stroke(); }
        for (const y of [h / 3, 2 * h / 3]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
        g.fillStyle = '#e8d9b5'; for (let k = 0; k < 6; k++) g.fillRect(w * 0.47, h * 0.42 + k * 6, w * 0.06, 2);
      } else if (kind === 'panel') { // 밝은 가죽 패널
        g.fillStyle = '#efe6cf'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8a888'; g.lineWidth = 2;
        for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(i * w / 12, 0); g.lineTo(i * w / 12 + 20, h); g.stroke(); }
        for (const y of [h / 4, h / 2, 3 * h / 4]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      } else if (kind === 'classic') { // 흰 육각형 + 검은 오각형 (깎은 정이십면체 근사)
        g.fillStyle = '#f7f7f7'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#151515';
        const pent = (cx, cy, r) => { g.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * 2 * Math.PI / 5; g.lineTo(cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r); } g.fill(); };
        for (let k = 0; k < 5; k++) { pent(k * w / 5 + w / 10, h * 0.28, 22); pent(k * w / 5, h * 0.72, 22); }
        pent(w / 2, 8, 30); pent(w / 2, h - 8, 30);
        g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.5;
        for (let i = 0; i < 20; i++) { g.beginPath(); g.moveTo(i * w / 20, 0); g.lineTo(i * w / 20 + 12, h); g.stroke(); }
      } else { // 현대식: 흰 바탕 + 곡선 그래픽 (특정 상표 디자인 아님)
        g.fillStyle = '#fbfbfb'; g.fillRect(0, 0, w, h);
        const cols = ['#d62828', '#1d4ed8', '#f4b400'];
        for (let k = 0; k < 6; k++) { g.strokeStyle = cols[k % 3]; g.lineWidth = 9; g.beginPath(); g.arc(k * w / 6 + 40, h / 2, 46, -1.2, 1.2); g.stroke(); }
        g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 1.5; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.bezierCurveTo(i * w / 8 + 40, h / 3, i * w / 8 - 40, 2 * h / 3, i * w / 8, h); g.stroke(); }
      }
    });
    return (ballTexCache[kind] = tex);
  }
  function buildBall(era) {
    const m = new T.Mesh(new T.SphereGeometry(WFCPhysics.BALL.radius, 32, 24), new T.MeshPhysicalMaterial({ map: ballTexture(era || 1930), roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3 }));
    m.castShadow = true;
    m.userData.setEra = y => { m.material.map = ballTexture(y); m.material.needsUpdate = true; };
    return m;
  }

  window.WFCModels = { setWet, recolorCrowd, buildHumanoid, buildPlayer, buildHost, buildTrophy, buildStadium, updateCrowd, buildWeather, buildBall, animate, mat, canvasTex };
})();
