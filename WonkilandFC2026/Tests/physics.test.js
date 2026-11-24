// node Tests/physics.test.js
'use strict';
const assert = require('assert');
const P = require('../Prototype/js/physics.js');
let pass = 0;
function t(name, fn) { fn(); pass++; console.log('  ✓ ' + name); }
const run = (b, sec) => { const ev = []; for (let i = 0; i < sec * 120; i++) ev.push(...P.step(b, 1 / 120)); return ev; };

t('정지한 공은 그대로 있다', () => { const b = P.createBall(); run(b, 1); assert(Math.abs(b.p.x) < 1e-9 && Math.abs(b.p.y - P.BALL.radius) < 1e-9); });
t('굴러가는 공은 마찰로 멈춘다', () => { const b = P.createBall(); b.v.x = 10; run(b, 10); assert(Math.hypot(b.v.x, b.v.z) < 1e-6); assert(b.p.x > 20 && b.p.x < 40); });
t('groundPassSpeed: 20m 패스가 대략 20m 지점에 도달', () => {
  const b = P.createBall(); b.v.x = P.groundPassSpeed(20, 0); run(b, 15); assert(Math.abs(b.p.x - 20) < 1.0, b.p.x); });
t('뜬공은 떨어지고 튀어오른다', () => { const b = P.createBall(); b.v.y = 10; const ev = run(b, 4); assert(ev.includes('bounce')); assert(b.p.y >= P.BALL.radius); });
t('골문 안으로 차면 골', () => { const b = P.createBall(); P.place(b, 40, 0); b.v.x = 25; b.v.y = 2; const ev = run(b, 2); assert(ev.includes('goal+x')); });
t('골문 밖으로 차면 골 아님', () => { const b = P.createBall(); P.place(b, 40, 8); b.v.x = 25; const ev = run(b, 2); assert(!ev.some(e => e.startsWith('goal'))); });
t('골대 기둥 충돌', () => { const b = P.createBall(); P.place(b, 45, P.PITCH.goalHalfWidth, 1); b.v.x = 20; b.v.y = 1; const ev = run(b, 1); assert(ev.includes('post')); });
t('크로스바 충돌', () => { const b = P.createBall(); P.place(b, 50, 0, P.PITCH.goalHeight + 0.02); b.v.x = 20; const ev = run(b, 1); assert(ev.includes('crossbar')); });
t('감아차기(스핀)는 공을 휘게 한다', () => {
  const a = P.createBall(); a.v.x = 25; a.v.y = 4; run(a, 0.8);
  const b = P.createBall(); b.v.x = 25; b.v.y = 4; b.spin.y = 30; run(b, 0.8);
  assert(Math.abs(b.p.z - a.p.z) > 0.8, 'curve ' + (b.p.z - a.p.z)); });
t('loftVelocity: 30m 롱패스가 목표 근처 착지', () => {
  const b = P.createBall(); const v = P.loftVelocity(b.p, { x: 30, z: 0 }, 1.6); Object.assign(b.v, v);
  let landed = null; for (let i = 0; i < 600 && !landed; i++) { P.step(b, 1 / 120); if (i > 20 && b.p.y <= P.BALL.radius + 1e-6) landed = { ...b.p }; }
  assert(landed && Math.abs(landed.x - 30) < 3, JSON.stringify(landed)); });
t('predict는 실제 결과와 일치', () => { const b = P.createBall(); b.v.x = 12; b.v.y = 5; const pr = P.predict(b, 1, 1 / 120); run(b, 1); assert(Math.hypot(pr.x - b.p.x, pr.y - b.p.y) < 0.2); });
console.log(`physics: ${pass} passed`);
