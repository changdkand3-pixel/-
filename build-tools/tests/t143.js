// 143차: 초6-1 수학 — 손오공을 전사로 골라도 1단원에서 손오공·야무치(거울 대결)를 고를 수 있는지, 영어 e6-1 상대에 손오공 (node tests/t143.js 결과.html)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};const errs=[];
const p=await b.newPage({viewport:{width:1100,height:900}});p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{console.log('DIALOG',d.message());d.accept();});await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2],{waitUntil:'load',timeout:120000});await p.waitForTimeout(1200);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('mathChoiceStatus').textContent='레벨: 중 | 학년: 초6-1';window.wonkiStartDbzGame();});await p.waitForTimeout(600);
const names=await p.$$eval('#dbzv2Body .cd b',a=>a.map(x=>x.textContent));console.log('고를 수 있는 전사',names.join(','));
const yi=names.indexOf('손오공');ok(yi>=0,'전사 목록에 손오공');
const cards=await p.$$('#dbzv2Body .cd');await cards[yi].click();await p.waitForTimeout(300);if(await p.$('#dbzv2Body [data-a=start]'))await p.click('#dbzv2Body [data-a=start]');await p.waitForTimeout(700);
const row1=await p.$$eval('#dbzv2Body .wk61-scene',s=>[...s[0].querySelectorAll('.wk61-op')].map(o=>o.getAttribute('aria-label').split(' ')[0]));
console.log('1단원 상대',row1.join(','));ok(row1.includes('손오공')&&row1.includes('야무치'),'1단원에서 손오공·야무치를 고를 수 있음');
for(const who of ['야무치','손오공']){
 await p.evaluate(w=>{const o=[...document.querySelectorAll('#dbzv2Body .wk61-scene')[0].querySelectorAll('.wk61-op')].find(x=>x.getAttribute('aria-label').startsWith(w+' '));o.click();},who);await p.waitForTimeout(700);
 const st=await p.evaluate(()=>({h:document.querySelector('#dbzv2Body .hd h2')?.textContent,img:!!document.getElementById('dbzQi')?.src,txt:document.getElementById('dbzv2Body').innerText.slice(0,300)}));
 ok(/분수의 나눗셈/.test(st.h)&&st.img,who+'와 대결 시작 ('+st.h+')');
 await p.evaluate(()=>{const b=[...document.querySelectorAll('#dbzv2Body button')].find(x=>/상대 선택/.test(x.textContent));b&&b.click();});await p.waitForTimeout(500);
 if(!(await p.$('#dbzv2Body .wk61-scene'))){await p.evaluate(()=>window.wonkiStartDbzGame());await p.waitForTimeout(600);if(await p.$('#dbzv2Body [data-a=start]')){await (await p.$$('#dbzv2Body .cd'))[0].click();await p.click('#dbzv2Body [data-a=start]');await p.waitForTimeout(600);}}
}
// 영어 e6-1
const en=await p.evaluate(()=>{const C=window.WonkiEnglishCore;const g=C.createGame(null);g.selectSemester('e6-1');const sem=C.SEMESTERS.find(s=>s.key==='e6-1');return g.enemies(sem.units[0]);});
console.log('영어 e6-1 1단원 상대',JSON.stringify(en));ok(en.includes('goku61'),'영어 초6-1 상대에 손오공');
ok(errs.length===0,'오류 '+JSON.stringify(errs));await b.close();process.exit(bad?1:0);})();
