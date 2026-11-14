// 110차 시험: 모임코스 창 — 칸 3개(수학문제 푸는|김가영|기타영역 없음), 각 칸 선택·결과, 랜덤 뽑기에 김가영 안 나옴
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
for(const w of [1200,390]){const p=await (await b.newContext({viewport:{width:w,height:w<500?844:900},isMobile:w<500,hasTouch:w<500})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('meet').click();});await p.waitForTimeout(800);
const spots=await p.$$eval('#meetModal .meetspot',a=>a.map(x=>x.dataset.meet));const img=await p.evaluate(()=>{const i=document.querySelector('#meetModal img');return i.complete&&i.naturalWidth+'x'+i.naturalHeight;});
const res=[];for(const id of ['meet1']){const bx=await (await p.$('#'+id)).boundingBox();await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);await p.waitForTimeout(200);res.push(await p.evaluate(()=>document.getElementById('resultText').textContent.replace(/\n/g,' / ')));}
await p.screenshot({path:out+'_'+w+'.png'});
const rnd=await p.evaluate(()=>{let k=0;for(let i=0;i<300;i++){document.getElementById('randomBtn').click();if(/수학문제 푸는|김가영|기타영역/.test(document.getElementById('resultText').textContent))k++;}return k;});
console.log(w,'칸',JSON.stringify(spots),'| 그림',img,'|',res.join(' | '),'| 랜덤 300번 중 수학문제 푸는|김가영|기타영역',rnd,'| 오류',errs);await p.close();}
await b.close();})();
