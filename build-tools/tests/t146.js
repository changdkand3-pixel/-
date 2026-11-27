// 146차: 중1-1 음수 답 — '18'은 오답, '-18'·'−18'은 정답 / 중1-2 1단원 위아래 칸·영어 대결판 거울 대결 (node tests/t146.js 결과.html)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};const errs=[];
const p=await b.newPage({viewport:{width:1100,height:900}});p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2],{waitUntil:'load',timeout:120000});await p.waitForTimeout(1200);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
const start=async g=>{await p.evaluate(g=>{document.getElementById('mathChoiceStatus').textContent='레벨: 중 | 학년: '+g;window.wonkiStartDbzGame();},g);await p.waitForTimeout(500);
 const cards=await p.$$('#dbzv2Body .cd');if(cards.length&&await p.$('#dbzv2Body [data-a=start]')){await cards[0].click();await p.click('#dbzv2Body [data-a=start]');await p.waitForTimeout(500);}};
await start('중1-1');
let tested={wrong:null,right:null,unicode:null},guard=0;
while((tested.wrong===null||tested.right===null||tested.unicode===null)&&guard++<12){
 await p.evaluate(()=>{const o=document.querySelector('#dbzv2Body .wk71-op:not([aria-disabled=true])');o&&o.click();});await p.waitForTimeout(600);
 for(let k=0;k<12;k++){const q=await p.evaluate(()=>{const n=window.__dbzCur&&window.__dbzCur();const Q=window.__dbzQ;return n?{n,a:Q.answers[n-1]}:null;});if(!q)break;
  let input=q.a.replace(/,/g,' ');let mode=null;
  if(/^-/.test(q.a)){if(tested.wrong===null){input=q.a.slice(1);mode='wrong';}else if(tested.unicode===null){input='−'+q.a.slice(1);mode='unicode';}else if(tested.right===null){mode='right';}}
  const has=await p.$('#dbzIn');if(!has)break;await p.evaluate(v=>{const i=document.getElementById('dbzIn');i.value=v;document.querySelector('#dbzv2Body [data-a=submit]').click();},input);await p.waitForTimeout(350);
  const fb=await p.evaluate(()=>document.getElementById('dbzFb')?.textContent||'');
  if(mode){tested[mode]=/정답!/.test(fb);console.log(' ',q.n,'답',q.a,'입력',input,'→',fb.slice(0,20));}
  await p.evaluate(()=>{const nx=document.querySelector('#dbzv2Body [data-a=next]');nx&&nx.click();});await p.waitForTimeout(900);}
 await start('중1-1');}
ok(tested.wrong===false,"음수 답에 부호 없이 '18'처럼 쓰면 오답");ok(tested.right===true,"'-18'처럼 쓰면 정답");ok(tested.unicode===true,"'−18'(긴 빼기표)도 정답");
// 중1-2 1단원 위아래 칸
await start('중1-2');
const r=await p.evaluate(()=>{const sc=document.querySelector('#dbzv2Body .wk72-scene');return [...sc.querySelectorAll('.wk72-op')].map(o=>o.getAttribute('aria-label').split(' 수학')[0]+'@'+Math.round(parseFloat(o.style.top)));});
console.log('중1-2 1단원 칸',r.join(', '));ok(r.length===12&&r.some(x=>/확산탄\)@57/.test(x))&&r.some(x=>/마섬광\)@57/.test(x)),'중1-2 1단원 12칸(아래 줄 포함)');
// 영어 대결판에 내 전사 칸
const eb=await p.evaluate(()=>{window.WonkiEnglish.open();document.querySelector('[data-eng-action="enter-game"]')?.click();document.querySelector('[data-eng-semester="m1-1"]')?.click();
 const c=document.querySelector('#wkEnglishGame [data-eng-action="choose-character"]');c&&c.click();const st=document.querySelector('#wkEnglishGame [data-eng-action="start"]');st&&st.click();
 return [...document.querySelectorAll('#wkEnglishGame .wk71-op')].map(o=>o.getAttribute('aria-label').split(' ')[0]);});
console.log('영어 중1-1 대결판',eb.join(','));ok(eb.includes('손오공'),'영어 대결판에도 내 전사(손오공) 칸');
ok(errs.length===0,'오류 '+JSON.stringify(errs.slice(0,3)));await b.close();process.exit(bad?1:0);})();
