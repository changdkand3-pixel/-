// 100차 시험: 종교코스 창의 🎲 랜덤 → 6개 메뉴 중 하나 선택·세부 창 열림, 세부 창 🎲 랜덤 → 항목 선택
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3],w=+(process.argv[4]||1200);const dir=path.dirname(file);const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:w,height:w<500?844:900},isMobile:w<500,hasTouch:w<500})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('faith').click();});await p.waitForTimeout(800);
const tap=async sel=>{const bx=await (await p.$(sel)).boundingBox();await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);await p.waitForTimeout(300);};
console.log('랜덤 버튼 수',await p.$$eval('.wk100-rand',a=>a.length));
await p.screenshot({path:out+'_faith.png'});
const seen={};
for(let i=0;i<12;i++){await p.evaluate(()=>document.querySelectorAll('.modal.wk91-deep').forEach(m=>m.classList.remove('open')));
 await tap('#faithModal .wk100-rand');
 const r=await p.evaluate(()=>{const s=document.querySelector('.faithspot.selected');const open=[...document.querySelectorAll('.modal.wk91-deep.open')].map(m=>m.id);return {s:s&&s.id,open};});
 seen[r.s]=(seen[r.s]||0)+1;
 if(i<3||i===11){const id=r.open[0];await tap('#'+id+' .wk100-rand');console.log('  종교 랜덤 →',r.s,'| 열린 세부 창',r.open.join(','),'| 세부 랜덤 후:',await p.evaluate(()=>document.getElementById('resultText').textContent.replace(/\n/g,' / ')));if(i===0)await p.screenshot({path:out+'_deep.png'});}}
console.log('12번 중 메뉴별',seen,'| 종교코스 창 열려 있음?',await p.evaluate(()=>document.getElementById('faithModal').classList.contains('open')));
console.log('오류',errs);await b.close();})();
