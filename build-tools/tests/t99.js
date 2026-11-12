// 99차 시험: 랜덤 뽑기 200번 → 코스별 횟수, 종교코스면 세부 항목까지 / 5. 기타코스 창과 종교 기타 메뉴 창이 따로 열림
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1200,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;const c={},ex=[];let deepOk=0,faith=0;
 for(let i=0;i<300;i++){document.getElementById('randomBtn').click();const top=document.querySelector('.hotspot.selected');c[top.dataset.name]=(c[top.dataset.name]||0)+1;
  if(top.id==='faith'){faith++;const open=[...document.querySelectorAll('.modal.wk91-deep.open')];const txt=document.getElementById('resultText').textContent;if(open.length===1&&window.wk91ChurchSub&&txt.includes(window.wk91ChurchSub))deepOk++;if(ex.length<4)ex.push(txt.replace(/\n/g,' / '));}}
 return {c,faith,deepOk,ex};});
console.log('300번 뽑기',r.c);console.log('종교코스',r.faith,'번 중 세부 항목까지',r.deepOk,'번');r.ex.forEach(x=>console.log('  예:',x));
await p.evaluate(()=>{document.querySelectorAll('.modal.open').forEach(m=>m.classList.remove('open'));document.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));});
await p.evaluate(()=>document.getElementById('other').click());await p.waitForTimeout(500);
console.log('5. 기타코스 → 기타코스 창',await p.evaluate(()=>document.getElementById('otherModal').classList.contains('open')),'| 종교 기타 창',await p.evaluate(()=>document.getElementById('faithOtherModal').classList.contains('open')));
await p.screenshot({path:process.argv[3]+'_other.png'});
await p.evaluate(()=>document.querySelectorAll('.modal.open').forEach(m=>m.classList.remove('open')));
await p.evaluate(()=>{document.getElementById('faith').click();});await p.waitForTimeout(400);await p.evaluate(()=>document.getElementById('faithother').click());await p.waitForTimeout(400);
console.log('종교 ⑥ → 종교 기타 창',await p.evaluate(()=>document.getElementById('faithOtherModal').classList.contains('open')),'| 5. 기타코스 창',await p.evaluate(()=>document.getElementById('otherModal').classList.contains('open')));
await p.screenshot({path:process.argv[3]+'_fother.png'});
console.log('오류',errs);await b.close();})();
