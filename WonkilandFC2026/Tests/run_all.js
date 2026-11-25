// 모든 테스트 실행: node Tests/run_all.js  (E2E는 playwright 설치 시에만)
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const run = f => execFileSync(process.execPath, [path.join(__dirname, f)], { stdio: 'inherit' });
run('physics.test.js');
run('match_sim.test.js');
let hasPw = true; try { require.resolve('playwright'); } catch (e) { hasPw = false; }
if (hasPw) { run('e2e.test.js'); run('graphics.test.js'); } else console.log('(playwright 미설치: E2E 테스트 건너뜀)');
console.log('ALL TESTS PASSED');
