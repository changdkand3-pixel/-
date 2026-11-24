// 공 물리 시스템 (렌더링과 독립 - Node 테스트 가능)
// 좌표계: x = 경기장 길이(-52.5 ~ 52.5), z = 폭(-34 ~ 34), y = 높이. 단위 m, s.
(function (root) {
  'use strict';
  const PITCH = { halfLength: 52.5, halfWidth: 34, goalHalfWidth: 3.66, goalHeight: 2.44, goalDepth: 2.2, postRadius: 0.06 };
  const BALL = { radius: 0.11, gravity: 9.81, drag: 0.012, magnus: 0.00055, restitution: 0.62, rollFriction: 1.6, spinDecay: 0.6 };

  function createBall() {
    return { p: { x: 0, y: BALL.radius, z: 0 }, v: { x: 0, y: 0, z: 0 }, spin: { x: 0, y: 0, z: 0 }, lastEvent: null };
  }

  function place(ball, x, z, y) {
    ball.p.x = x; ball.p.z = z; ball.p.y = (y === undefined ? BALL.radius : y);
    ball.v.x = ball.v.y = ball.v.z = 0; ball.spin.x = ball.spin.y = ball.spin.z = 0;
  }

  // 반환: 이번 스텝에서 일어난 이벤트 목록 (post, crossbar, bounce, net, goal)
  function step(ball, dt) {
    const ev = [];
    const p = ball.p, v = ball.v, s = ball.spin;
    const speed = Math.hypot(v.x, v.y, v.z);
    const airborne = p.y > BALL.radius + 0.01 || v.y > 0.05;
    if (airborne) {
      // 공기저항 (속도 제곱에 비례)
      const d = BALL.drag * speed;
      v.x -= v.x * d * dt; v.y -= v.y * d * dt; v.z -= v.z * d * dt;
      // 마그누스 효과: a = k * (w x v)  → 감아차기
      v.x += BALL.magnus * (s.y * v.z - s.z * v.y) * dt * 60;
      v.y += BALL.magnus * (s.z * v.x - s.x * v.z) * dt * 60;
      v.z += BALL.magnus * (s.x * v.y - s.y * v.x) * dt * 60;
      v.y -= BALL.gravity * dt;
    } else {
      // 구름 마찰
      const h = Math.hypot(v.x, v.z);
      if (h > 0) {
        const nh = Math.max(0, h - BALL.rollFriction * dt);
        v.x *= nh / h; v.z *= nh / h;
      }
      v.y = 0; p.y = BALL.radius;
      // 지면에서도 약간 휘어짐
      v.x += BALL.magnus * 0.3 * (s.y * v.z) * dt * 60;
      v.z += BALL.magnus * 0.3 * (-s.y * v.x) * dt * 60;
    }
    const decay = Math.exp(-BALL.spinDecay * dt);
    s.x *= decay; s.y *= decay; s.z *= decay;

    const prevX = p.x;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;

    if (p.y < BALL.radius) {
      p.y = BALL.radius;
      if (v.y < -1.2) { v.y = -v.y * BALL.restitution; v.x *= 0.86; v.z *= 0.86; ev.push('bounce'); }
      else v.y = 0;
    }
    collideGoalFrame(ball, ev);
    // 골 판정: 공 전체가 골라인을 넘어가야 함
    for (const side of [1, -1]) {
      const line = side * (PITCH.halfLength + BALL.radius);
      const crossed = side > 0 ? (prevX <= line && p.x > line) : (prevX >= line && p.x < line);
      if (crossed && Math.abs(p.z) < PITCH.goalHalfWidth - BALL.radius && p.y < PITCH.goalHeight - BALL.radius) {
        ev.push(side > 0 ? 'goal+x' : 'goal-x');
      }
    }
    // 골망
    const behind = Math.abs(p.x) > PITCH.halfLength;
    if (behind && Math.abs(p.x) < PITCH.halfLength + PITCH.goalDepth + 0.5 && Math.abs(p.z) < PITCH.goalHalfWidth && p.y < PITCH.goalHeight) {
      const backX = Math.sign(p.x) * (PITCH.halfLength + PITCH.goalDepth - BALL.radius);
      if (Math.abs(p.x) > Math.abs(backX)) { p.x = backX; v.x *= -0.15; v.z *= 0.4; v.y *= 0.4; ev.push('net'); }
    }
    ev.forEach(e => { ball.lastEvent = e; });
    return ev;
  }

  function collideGoalFrame(ball, ev) {
    const p = ball.p, v = ball.v;
    const r = BALL.radius + PITCH.postRadius;
    for (const sx of [1, -1]) {
      const gx = sx * PITCH.halfLength;
      // 골대 기둥 (수직 실린더)
      for (const sz of [1, -1]) {
        const gz = sz * PITCH.goalHalfWidth;
        if (p.y < PITCH.goalHeight + r) {
          const dx = p.x - gx, dz = p.z - gz, d = Math.hypot(dx, dz);
          if (d < r && d > 1e-6) {
            const nx = dx / d, nz = dz / d, vn = v.x * nx + v.z * nz;
            if (vn < 0) { v.x -= 1.7 * vn * nx; v.z -= 1.7 * vn * nz; ev.push('post'); }
            p.x = gx + nx * r; p.z = gz + nz * r;
          }
        }
      }
      // 크로스바 (z 방향 수평 실린더)
      if (Math.abs(p.z) < PITCH.goalHalfWidth) {
        const dx = p.x - gx, dy = p.y - PITCH.goalHeight, d = Math.hypot(dx, dy);
        if (d < r && d > 1e-6) {
          const nx = dx / d, ny = dy / d, vn = v.x * nx + v.y * ny;
          if (vn < 0) { v.x -= 1.7 * vn * nx; v.y -= 1.7 * vn * ny; ev.push('crossbar'); }
          p.x = gx + nx * r; p.y = PITCH.goalHeight + ny * r;
        }
      }
    }
  }

  // 땅볼로 거리 dist 만큼 굴러가게 하는 초기 속도
  function groundPassSpeed(dist, arriveSpeed) {
    const a = BALL.rollFriction; const vf = (arriveSpeed === undefined ? 3 : arriveSpeed);
    return Math.sqrt(vf * vf + 2 * a * dist);
  }

  // 목표 지점까지 약 flightTime 초에 떨어지는 포물선 속도. 공기저항은 시뮬레이션으로 반복 보정.
  function loftVelocity(from, to, flightTime) {
    const t = flightTime, ty = (to.y || BALL.radius);
    const v = { x: (to.x - from.x) / t, z: (to.z - from.z) / t, y: (ty - from.y + 0.5 * BALL.gravity * t * t) / t };
    const want = Math.hypot(to.x - from.x, to.z - from.z);
    if (want < 0.01) return v;
    for (let it = 0; it < 4; it++) {
      const b = { p: { x: 0, y: from.y, z: 0 }, v: { ...v }, spin: { x: 0, y: 0, z: 0 } };
      let n = 0, prevY = b.p.y;
      // 목표 높이까지 내려오는 순간의 수평거리 측정 (골대 충돌 없는 원점 근처에서 계산)
      while (n++ < 1200) {
        stepAir(b, 1 / 120);
        if (b.v.y < 0 && b.p.y <= ty) break;
        prevY = b.p.y;
      }
      const got = Math.hypot(b.p.x, b.p.z);
      if (got < 0.01) break;
      const k = want / got; v.x *= k; v.z *= k;
      if (Math.abs(k - 1) < 0.01) break;
    }
    return v;
  }
  function stepAir(b, dt) {
    const v = b.v, sp = Math.hypot(v.x, v.y, v.z), d = BALL.drag * sp;
    v.x -= v.x * d * dt; v.y -= v.y * d * dt; v.z -= v.z * d * dt; v.y -= BALL.gravity * dt;
    b.p.x += v.x * dt; b.p.y += v.y * dt; b.p.z += v.z * dt;
  }

  // 시간 t 후 공의 위치를 시뮬레이션으로 예측 (AI/골키퍼용)
  function predict(ball, t, dtStep) {
    const dt = dtStep || 1 / 60;
    const b = { p: { ...ball.p }, v: { ...ball.v }, spin: { ...ball.spin } };
    for (let s = 0; s < t; s += dt) step(b, dt);
    return b.p;
  }

  const api = { PITCH, BALL, createBall, place, step, groundPassSpeed, loftVelocity, predict };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WFCPhysics = api;
})(typeof window !== 'undefined' ? window : globalThis);
