// 고품질 그래픽 렌더링 검증: 주변광 차폐·빛 번짐·하늘·그림자 켠 상태로 주요 장면을 렌더링하고 오류가 없는지 확인
// node Tests/graphics.test.js [출력폴더]   (GPU 없는 환경에서는 매우 느림)
'use strict';
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.argv[2] || path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { try { localStorage.setItem('wfc.quality', 'high'); } catch (e) { } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, '..', 'Prototype', 'index.html'));
  await sleep(4000); await page.screenshot({ path: path.join(OUT, 'g1_title_high.png') });
  const scenes = [
    ['g2_1930_day', { kind: 'friendly', home: { type: 'national', key: 'URY-1930' }, away: { type: 'national', key: 'ARG-1930' }, time: 'day', wx: 'clear' }],
    ['g3_1970_dusk', { kind: 'friendly', home: { type: 'national', key: 'BRA-1970' }, away: { type: 'national', key: 'ITA-1970' }, time: 'dusk', wx: 'clear' }],
    ['g4_2022_night_rain', { kind: 'friendly', home: { type: 'national', key: 'KOR-2022' }, away: { type: 'national', key: 'PRT-2022' }, time: 'night', wx: 'rain' }],
    ['g5_2002_snow', { kind: 'friendly', home: { type: 'national', key: 'DEU-2002' }, away: { type: 'national', key: 'BRA-2002' }, time: 'day', wx: 'snow' }]
  ];
  for (const [name, cfg] of scenes) {
    await page.evaluate(c => window.WFC.startMatch(Object.assign({ side: 0, rules: 'modern', half: 300, f: [null, null], intro: false }, c)), cfg);
    await sleep(3500); await page.screenshot({ path: path.join(OUT, name + '.png') });
  }
  const q = await page.evaluate(() => ({ quality: window.WFC.S.quality }));
  await browser.close();
  if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
  if (q.quality !== 'high') { console.error('quality not high'); process.exit(1); }
  console.log('graphics: OK (high quality, 5 scenes rendered) →', OUT);
})().catch(e => { console.error(e); process.exit(1); });
