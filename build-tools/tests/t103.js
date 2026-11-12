// 103차 시험: 휴대폰(390·360)에서 일반회원 로그인 창 너비·안내 문구 위치
const {chromium,devices}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
for(const w of [360,390,1200]){const p=await (await b.newContext({viewport:{width:w,height:w<500?800:900},isMobile:w<500,hasTouch:w<500,deviceScaleFactor:w<500?2:1})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3500);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('wkGeneralAccountModal').classList.add('open');});await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const c=document.querySelector('#wkGeneralAccountModal .wkga-card').getBoundingClientRect();const n=document.getElementById('wk70LoginNote');const h=document.querySelector('#wkGeneralAccountModal .wkga-card h2').getBoundingClientRect();return {w:innerWidth,card:Math.round(c.width),noteInCard:!!(n&&n.closest('.wkga-card')),titleH:Math.round(h.height)};});
console.log(w,JSON.stringify(r),'오류',errs.length);await p.screenshot({path:out+'_'+w+'.png'});}
await b.close();})();
