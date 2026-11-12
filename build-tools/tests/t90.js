// 90차 시험: 새 종교코스 메뉴 그림·6칸 누르기·결과 글자·그림 속 ✕로 닫기
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3],w=+(process.argv[4]||1200);const dir=path.dirname(file);const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:w,height:w<500?844:900},isMobile:w<500,hasTouch:w<500})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('faith').click();});await p.waitForTimeout(1500);
console.log('그림 불러옴?',await p.evaluate(()=>{const i=document.querySelector('#faithModal img');return i.complete&&i.naturalWidth+'x'+i.naturalHeight;}));
await p.screenshot({path:out+'_open.png'});
const ids=['church','youth','rosary','prayer','faithquiz','faithother'];
for(const id of ids){const bx=await (await p.$('#'+id)).boundingBox();await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height*0.4);await p.waitForTimeout(150);
 console.log(id,'→ 선택',await p.evaluate(id=>document.getElementById(id).classList.contains('selected'),id),'| 결과:',(await p.evaluate(()=>document.getElementById('resultText')?.textContent||'')).replace(/\s+/g,' ').slice(0,60));}
await p.screenshot({path:out+'_sel.png'});
const cb=await (await p.$('#closeFaithModal')).boundingBox();await p.mouse.click(cb.x+cb.width/2,cb.y+cb.height/2);await p.waitForTimeout(300);
console.log('그림 속 ✕ 누르기 → 닫힘?',await p.evaluate(()=>!document.getElementById('faithModal').classList.contains('open')));
console.log('오류',errs);await b.close();})();
