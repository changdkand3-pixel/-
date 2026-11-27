// 144차: 초1~초6 수학·영어 — 기본 전사로 같은 캐릭터(거울 대결)를 상대로 고를 수 있는지 (node tests/t144.js 결과.html)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};const errs=[];
const p=await b.newPage({viewport:{width:1100,height:900}});p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2],{waitUntil:'load',timeout:120000});await p.waitForTimeout(1200);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
const GR=['초1-1','초1-2','초2-1','초2-2','초3-1','초3-2','초4-1','초4-2','초5-1','초5-2','초6-1','초6-2','중1-1','중1-2'];
for(const g of GR){
 await p.evaluate(g=>{document.getElementById('mathChoiceStatus').textContent='레벨: 중 | 학년: '+g;window.wonkiStartDbzGame();},g);await p.waitForTimeout(500);
 const cards=await p.$$('#dbzv2Body .cd');if(cards.length&&await p.$('#dbzv2Body [data-a=start]')){await cards[0].click();await p.click('#dbzv2Body [data-a=start]');await p.waitForTimeout(500);}
 const me=(await p.evaluate(()=>{const c=document.querySelector('#dbzv2Body .wk23-profile b, #dbzv2Body .row .cd b, #dbzv2Body .cd b');return c&&c.textContent.trim();}))||'손오공';
 // 대결 버튼들: aria-label "이름 … 대결 시작" 또는 data-a=fight
 const r=await p.evaluate(me=>{const bs=[...document.querySelectorAll('#dbzv2Body button')].filter(x=>x.getAttribute('aria-disabled')!=='true'&&!x.disabled);
  const lab=x=>(x.getAttribute('aria-label')||x.textContent||'').trim();
  const fights=bs.filter(x=>/대결|문제 시작/.test(lab(x))||x.dataset.a==='fight'||x.dataset.a==='boss');
  const mine=fights.find(x=>lab(x).startsWith(me+' ')||lab(x).startsWith(me+'·')||lab(x).includes(me));
  return {n:fights.length,mine:!!mine,sample:fights.slice(0,4).map(lab)};},me);
 if(!r.mine){const any=await p.evaluate(me=>[...document.querySelectorAll('#dbzv2Body article button')].some(x=>(x.getAttribute('aria-label')||'').startsWith(me+' ')),me);ok(any,g+' 수학: 1단원 그림엔 '+me+' 없음 · 다른 단원에 '+me+' 칸 '+(any?'있음':'없음'));continue;}
 const before=await p.evaluate(()=>document.querySelector('#dbzv2Body .hd h2')?.textContent);
 await p.evaluate(me=>{const lab=x=>(x.getAttribute('aria-label')||x.textContent||'').trim();const x=[...document.querySelectorAll('#dbzv2Body button')].filter(x=>x.getAttribute('aria-disabled')!=='true'&&!x.disabled&&(/대결|문제 시작/.test(lab(x))||x.dataset.a==='fight'||x.dataset.a==='boss')).find(x=>lab(x).includes(me));x.click();},me);await p.waitForTimeout(600);
 const st=await p.evaluate(()=>({h:document.querySelector('#dbzv2Body .hd h2')?.textContent,q:!!document.getElementById('dbzQi')?.src||!!document.getElementById('dbzIn')}));
 ok(st.q,g+' 수학: '+me+' vs '+me+' 대결 시작 ('+st.h+')');
}
// 영어: 학기마다 첫 단원 상대에 내 전사가 있는지
const er=await p.evaluate(()=>{const C=window.WonkiEnglishCore;const out=[];for(const k of ['e1-1','e1-2','e2-1','e2-2','e3-1','e3-2','e4-1','e4-2','e5-1','e5-2','e6-1','e6-2','m1-1','m1-2']){const g=C.createGame(null);if(!g.selectSemester(k)&&!g.state)continue;g.selectSemester(k);const me=g.unlockedCharacters()[0];g.selectCharacter(me);const sem=C.SEMESTERS.find(s=>s.key===k);const u=sem.units[0];const en=g.enemies(u);const okb=g.startBattle(u,me);out.push([k,me,en.includes(me),!!okb]);}return out;});
for(const [k,me,has,st] of er)ok(has&&st,'영어 '+k+': '+me+' 거울 대결 '+(st?'시작':'안 됨'));
ok(errs.length===0,'오류 '+JSON.stringify(errs.slice(0,3)));await b.close();process.exit(bad?1:0);})();
