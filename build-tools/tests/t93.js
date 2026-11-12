// 91차 시험: 종교코스 → ① 혜화동성당 → 교리봉사회활동 창 → 6가지 선택·결과 글자·닫기, 다른 칸 고르면 세부 선택 지워짐
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3],w=+(process.argv[4]||1200);const dir=path.dirname(file);const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:w,height:w<500?844:900},isMobile:w<500,hasTouch:w<500})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
const res=()=>p.evaluate(()=>(document.getElementById('resultText')?.textContent||'').replace(/\n/g,' / '));
const tap=async sel=>{const bx=await (await p.$(sel)).boundingBox();await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);await p.waitForTimeout(200);};
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('faith').click();});await p.waitForTimeout(1200);
await tap('#rosary');await p.waitForTimeout(800);
console.log('③ 로사리오 누름 → 기도모임 창 열림?',await p.evaluate(()=>document.getElementById('rosaryModal').classList.contains('open')),'| 그림',await p.evaluate(()=>{const i=document.querySelector('#rosaryModal img');return i.complete&&i.naturalWidth+'x'+i.naturalHeight;}));
for(const id of ['rosary1','rosary2','rosary3','rosary4','rosary5','rosary6']){await tap('#'+id);console.log('  ',id,'→',await p.evaluate(id=>document.getElementById(id).classList.contains('selected'),id),'|',await res());}
await tap('#rosary3');await p.screenshot({path:out+'_rosary.png'});
await tap('#closeRosaryModal');console.log('✕ → 교리봉사 창 닫힘?',await p.evaluate(()=>!document.getElementById('rosaryModal').classList.contains('open')),'| 종교코스 창 그대로?',await p.evaluate(()=>document.getElementById('faithModal').classList.contains('open')),'|',await res());
await tap('#church');console.log('① 혜화동성당 누름 →',await res(),'| 교리봉사 창 열림?',await p.evaluate(()=>document.getElementById('rosaryModal').classList.contains('open')));
await tap('#rosary');await p.waitForTimeout(300);console.log('다시 ② → 세부 선택 지워짐?',await p.evaluate(()=>!document.querySelector('.churchspot.selected')),'|',await res());
await p.keyboard.press('Escape');console.log('Esc → 닫힘?',await p.evaluate(()=>!document.getElementById('rosaryModal').classList.contains('open')));
console.log('오류',errs);await b.close();})();
