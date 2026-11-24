// 브라우저 E2E 테스트 (Playwright + Chromium). node Tests/e2e.test.js [출력폴더]
'use strict';
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.argv[2] || path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'file://' + path.join(__dirname, '..', 'Prototype', 'index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(URL);
  await page.waitForFunction(() => window.WFC && window.WFC.S, null, { timeout: 30000 });
  await sleep(2500);
  await page.screenshot({ path: path.join(OUT, '01_title.png') });

  // 1930 결승: 오프닝 연출 포함
  await page.click('[data-act=final1930]');
  await page.selectOption('#optHalf', '120');
  await page.click('#btnStart');
  await sleep(1500); await page.screenshot({ path: path.join(OUT, '02_opening.png') });
  await page.keyboard.press('Enter'); await sleep(2200); await page.screenshot({ path: path.join(OUT, '03_host_declaration.png') });
  await page.keyboard.press('Enter'); await sleep(300); await page.keyboard.press('Enter'); await sleep(1500); await page.screenshot({ path: path.join(OUT, '04_lineup.png') });
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Enter'); await sleep(300); }
  const phase0 = await page.evaluate(() => window.WFC.S.match && window.WFC.S.match.phase);
  await sleep(2500);
  // 사람 조작: 킥오프 패스 후 드리블/슈팅
  await page.keyboard.press('KeyJ'); await sleep(800);
  await page.keyboard.down('KeyD'); await page.keyboard.down('ShiftLeft'); await sleep(1500);
  await page.screenshot({ path: path.join(OUT, '05_match_broadcast.png') });
  await page.keyboard.up('ShiftLeft'); await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyK'); await sleep(500); await page.keyboard.up('KeyK');
  await page.keyboard.press('Digit3'); await sleep(1500); await page.screenshot({ path: path.join(OUT, '06_match_behind_cam.png') });
  await page.keyboard.press('Digit1');
  const st = await page.evaluate(() => { const m = window.WFC.S.match; return { phase: m.phase, minute: m.minute(), passes: m.teams[0].stats.passes + m.teams[1].stats.passes, ctrl: m.teams[0].controlled && m.teams[0].controlled.name, ball: m.ball.p }; });
  // 일시정지 메뉴
  await page.keyboard.press('Escape'); await sleep(500); await page.screenshot({ path: path.join(OUT, '07_pause.png') });
  await page.selectOption('#pF', '4-4-2'); await page.click('#btnResume');
  // 시간 빨리 진행: 경기 종료까지 시뮬레이션 (프레임 루프 외부에서 강제 업데이트)
  const done = await page.evaluate(() => { const m = window.WFC.S.match; let n = 0; while (m.phase !== 'fulltime' && n < 60000) { m.update(1 / 60, null); n++; } return { phase: m.phase, result: m.result, goals: m.goals || [] }; });
  await sleep(3500);
  await page.screenshot({ path: path.join(OUT, '08_results.png') });
  // 시상식
  await page.evaluate(() => window.WFC.runCeremony());
  await sleep(4000); await page.screenshot({ path: path.join(OUT, '09_ceremony.png') });
  await page.keyboard.press('Enter'); await sleep(3000); await page.screenshot({ path: path.join(OUT, '10_trophy.png') });
  await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await sleep(800);
  // 야간 + 비, 2인 대전
  await page.evaluate(() => window.WFC.startMatch({ kind: 'versus', side: 0, rules: 'modern', half: 60, time: 'night', wx: 'rain', f: ['4-4-2', '2-3-5'], intro: false }));
  await sleep(3000); await page.keyboard.down('ArrowLeft'); await page.keyboard.down('KeyD'); await sleep(1200); await page.keyboard.up('ArrowLeft'); await page.keyboard.up('KeyD');
  await page.screenshot({ path: path.join(OUT, '11_night_rain_2p.png') });
  // 눈 + 승부차기
  await page.evaluate(() => window.WFC.startMatch({ kind: 'shootout', side: 0, rules: 'modern', half: 60, time: 'day', wx: 'snow', f: ['2-3-5', '2-3-5'], intro: false }));
  await sleep(2500); await page.screenshot({ path: path.join(OUT, '12_snow_penalty.png') });
  // 조 추첨식
  await page.evaluate(() => { window.WFC.toTitle(); window.WFC.startDraw(); });
  await sleep(7000); await page.screenshot({ path: path.join(OUT, '13_group_draw.png') });
  // 편집 모드
  await page.evaluate(() => window.WFC.toTitle()); await page.click('[data-act=editor]'); await sleep(500);
  await page.screenshot({ path: path.join(OUT, '14_editor.png') });
  await browser.close();

  console.log('phase after intro:', phase0);
  console.log('live match state:', JSON.stringify(st));
  console.log('fast-forward result:', JSON.stringify(done.result), 'goals:', done.goals.map(g => `${g.minute}' ${g.scorer}`).join(', '));
  const real = errors.filter(e => !/GPU stall|WebGL|Automatic fallback/i.test(e));
  if (real.length) { console.error('ERRORS:\n' + real.join('\n')); process.exit(1); }
  if (done.phase !== 'fulltime') { console.error('match did not finish'); process.exit(1); }
  console.log('e2e: OK, screenshots in', OUT);
})().catch(e => { console.error(e); process.exit(1); });
