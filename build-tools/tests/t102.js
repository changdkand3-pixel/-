// 102차 시험: 종교코스 창·세부 창 6개 — 칸이 그림 안에 있는지(그림 상자 기준 %), 랜덤 버튼이 칸에 가려지지 않는지(elementFromPoint), 랜덤 20번
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3],w=+(process.argv[4]||1200);const dir=path.dirname(file);const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:w,height:w<500?844:900},isMobile:w<500,hasTouch:w<500})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('faith').click();});await p.waitForTimeout(800);
const check=async(mid,sel)=>p.evaluate(([mid,sel])=>{const m=document.getElementById(mid);const img=m.querySelector('.wk101-stage>img').getBoundingClientRect();const spots=[...m.querySelectorAll(sel)];
 const out=spots.filter(s=>{const r=s.getBoundingClientRect();return r.bottom>img.bottom+1||r.top<img.top-1;}).map(s=>s.id);
 const btn=m.querySelector('.ai-random');const br=btn.getBoundingClientRect();const hit=document.elementFromPoint(br.left+br.width/2,br.top+br.height/2);
 return {img:Math.round(img.height),spots:spots.length,outside:out,btnFree:hit===btn||btn.contains(hit),btnVisible:br.bottom<=innerHeight};},[mid,sel]);
console.log('faithModal',JSON.stringify(await check('faithModal','.faithspot')));
const ids=['churchModal','youthModal','rosaryModal','prayerModal','quizModal','faithOtherModal'];
for(const id of ids){await p.evaluate(id=>{document.querySelectorAll('.modal.wk91-deep').forEach(m=>m.classList.remove('open'));document.getElementById(id).classList.add('open');},id);await p.waitForTimeout(300);
 const r=await check(id,'.churchspot');let ok=0;for(let i=0;i<20;i++){const before=await p.evaluate(id=>document.querySelector('#'+id+' .churchspot.selected')?.id,id);const bx=await (await p.$('#'+id+'RandomBtn')).boundingBox();await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);await p.waitForTimeout(120);const after=await p.evaluate(id=>document.querySelector('#'+id+' .churchspot.selected')?.id,id);if(after&&after!==before)ok++;}
 console.log(id,JSON.stringify(r),'| 랜덤 20번 중 바뀜',ok);if(id==='youthModal'||id==='faithOtherModal')await p.screenshot({path:out+'_'+id+'.png'});}
await p.evaluate(()=>document.querySelectorAll('.modal.wk91-deep').forEach(m=>m.classList.remove('open')));
let ok=0;for(let i=0;i<20;i++){const before=await p.evaluate(()=>document.getElementById('resultText').textContent);const bx=await (await p.$('#faithRandomBtn')).boundingBox();await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);await p.waitForTimeout(120);if(await p.evaluate(()=>document.getElementById('resultText').textContent)!==before)ok++;}
console.log('종교 창 랜덤 20번 중 바뀜',ok);await p.screenshot({path:out+'_faith.png'});
console.log('오류',errs);await b.close();})();
