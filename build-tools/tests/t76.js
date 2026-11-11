// 76차 시험: 시간대 판정, 계절 무작위 날씨(같은 시간 같은 날씨), 버튼 순환, 장면 사진
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
console.log('지금 자동:',await p.evaluate(()=>[WonkiScenery76.period(),WonkiScenery76.weather(),document.getElementById('wk76Btn').textContent,document.getElementById('wk76Wx').textContent,document.getElementById('wk76Badge').textContent]));
// 계절별 날씨 분포 (가짜 날짜로 3시간 단위 1000번)
console.log('11월 분포:',await p.evaluate(()=>{const real=Date.now;const c={};for(let i=0;i<1000;i++){const t=Date.UTC(2026,10,1)+i*3*3600e3%(30*86400e3)+Math.floor(i/240)*3600e3*0;Date.now=()=>Date.UTC(2026,10,1)+(i%240)*3*3600e3-9*3600e3;const w=WonkiScenery76.auto();c[w]=(c[w]||0)+1;}Date.now=real;return JSON.stringify(c);}));
console.log('1월 분포:',await p.evaluate(()=>{const real=Date.now;const c={};for(let i=0;i<240;i++){Date.now=()=>Date.UTC(2027,0,1)+i*3*3600e3-9*3600e3;const w=WonkiScenery76.auto();c[w]=(c[w]||0)+1;}Date.now=real;return JSON.stringify(c);}));
console.log('같은 시간 같은 날씨:',await p.evaluate(()=>{const a=WonkiScenery76.auto(),b2=WonkiScenery76.auto();return a===b2;}));
const map=await p.$('#wonkiMapViewport');await map.scrollIntoViewIfNeeded();
for(const [s,w] of [['am','clear'],['eve','leaves'],['night','snow'],['night','rain']]){await p.evaluate(([s,w])=>{WonkiScenery76.setMode(s);WonkiScenery76.setWeather(w);},[s,w]);await p.waitForTimeout(3200);await map.screenshot({path:out+'_'+s+'_'+w+'.png'});}
await p.evaluate(()=>{for(let i=0;i<6;i++)document.getElementById('wk76Btn').click();});console.log('버튼 6번 → 처음으로:',await p.evaluate(()=>WonkiScenery76.mode()));
await p.evaluate(()=>{WonkiScenery76.setWeather('auto');});
console.log('지도 버튼 여전히 눌림?',await p.evaluate(()=>{const h=document.getElementById('job');const r=h.getBoundingClientRect();const t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===t||h.contains(t);}));
console.log('오류',errs);await b.close();})();
