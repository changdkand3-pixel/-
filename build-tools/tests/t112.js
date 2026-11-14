// 112차 시험: 모임코스 ① → 취미짬뽕 창, 14칸(7과) 선택·결과·같은 과 함께 표시, 🎲 랜덤, 메인 랜덤 뽑기, 닫기
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
for(const w of [1200,390]){const p=await (await b.newContext({viewport:{width:w,height:w<500?844:900},isMobile:w<500,hasTouch:w<500})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
const tap=async sel=>{const bx=await (await p.$(sel)).boundingBox();await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);await p.waitForTimeout(200);};
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('meet').click();});await p.waitForTimeout(600);
await tap('#meet1');await p.waitForTimeout(500);
console.log(w,'짬뽕 창 열림',await p.evaluate(()=>document.getElementById('jjamModal').classList.contains('open')),'| 그림',await p.evaluate(()=>{const i=document.querySelector('#jjamModal img');return i.naturalWidth+'x'+i.naturalHeight;}));
const r=[];for(let n=1;n<=14;n++){await tap('#jj'+n);r.push(await p.evaluate(()=>{const t=document.getElementById('resultText').textContent.split('\n').pop().replace(/[└ ]/g,'');return t+'('+document.querySelectorAll('#jjamModal .jjspot.selected').length+')';}));}
console.log('  칸별:',r.join(' '));
await tap('#jj3');await p.screenshot({path:out+'_'+w+'.png'});
let ch=0;for(let i=0;i<10;i++){const a=await p.evaluate(()=>window.wk91ChurchSub);await tap('#jjamModalRandomBtn');if(await p.evaluate(()=>window.wk91ChurchSub)!==a)ch++;}
console.log('  🎲 10번 중 바뀜',ch,'| 결과',await p.evaluate(()=>document.getElementById('resultText').textContent.replace(/\n/g,' / ')));
await tap('#closeJjamModal');console.log('  닫힘',await p.evaluate(()=>!document.getElementById('jjamModal').classList.contains('open')),'| 모임 창 그대로',await p.evaluate(()=>document.getElementById('meetModal').classList.contains('open')));
const rnd=await p.evaluate(()=>{const c={};for(let i=0;i<200;i++){document.getElementById('randomBtn').click();const t=document.getElementById('resultText').textContent;if(t.startsWith('3.'))c[t.split('\n').pop()]=(c[t.split('\n').pop()]||0)+1;}return c;});
console.log('  메인 랜덤 200번 중 모임코스',JSON.stringify(rnd),'| 오류',errs);await p.close();}
await b.close();})();
