// 113차 시험: 인형뽑기과(jj1·jj2) → 뽑기 그림 창, 버튼/그림 → 새 창 주소, 닫기, 다른 과는 안 열림, 짬뽕 🎲·메인 랜덤에서 인형뽑기과면 열림
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
for(const w of [1200,390]){const ctx=await b.newContext({viewport:{width:w,height:w<500?844:900},isMobile:w<500,hasTouch:w<500});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}if(u.includes('hinsrolin.neocities.org'))return r.fulfill({status:200,body:'ok',contentType:'text/html'});return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
const tap=async sel=>{const bx=await (await p.$(sel)).boundingBox();await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);await p.waitForTimeout(250);};
const open=()=>p.evaluate(()=>!document.getElementById('clawModal').hidden);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('meet').click();});await p.waitForTimeout(500);await tap('#meet1');await p.waitForTimeout(400);
await tap('#jj3');const o3=await open();await tap('#jj1');const o1=await open();await p.screenshot({path:out+'_'+w+'.png'});
const [pg]=await Promise.all([ctx.waitForEvent('page'),p.click('#clawGo')]);const url=pg.url();await pg.close();
await tap('#clawClose');const c1=!(await open());await tap('#jj2');const o2=await open();await p.keyboard.press('Escape');const c2=!(await open());
let rj=0,ro=0;for(let i=0;i<30;i++){await p.evaluate(()=>document.getElementById('clawModal').hidden=true);await p.evaluate(()=>document.getElementById('jjamModalRandomBtn').click());await p.waitForTimeout(30);const v=await p.evaluate(()=>window.wk91ChurchSub);if(v==='인형뽑기과'){rj++;if(await open())ro++;}}
const mr=await p.evaluate(()=>{let n=0,o=0;for(let i=0;i<400;i++){document.getElementById('clawModal').hidden=true;document.getElementById('randomBtn').click();if(window.wk91ChurchSub==='인형뽑기과'&&/인형뽑기과/.test(document.getElementById('resultText').textContent)){n++;if(!document.getElementById('clawModal').hidden)o++;}}return n+'번 중 '+o+'번 열림';});
console.log(w,'다른 과 누름→열림?',o3,'| 인형뽑기 그림칸→',o1,'| 지원과 목록칸→',o2,'| 버튼 새 창',decodeURIComponent(url),'| ✕',c1,'Esc',c2,'| 짬뽕🎲 인형뽑기',rj,'번 중',ro,'번 열림 | 메인 랜덤 인형뽑기과',mr,'| 오류',errs);await ctx.close();}
await b.close();})();
