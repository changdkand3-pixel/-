// 134차: 천하통일 — 기본 장수 1000명, 지인 여러 명 넣기, 9과목 문제(정답이 보기에 있는지), 내 문제, 등용, 노선 나란히 (node tests/t134.js 결과.html 사진접두어)
const {chromium}=require('playwright');
(async()=>{const [,,file,pre]=process.argv;const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};const errs=[];
const p=await b.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('wk65_admin_device','1')}catch(_){}});
await p.goto('file://'+file,{waitUntil:'load',timeout:120000});await p.waitForTimeout(1500);
await p.evaluate(()=>{document.getElementById('wkUpdatePoster').hidden=true;localStorage.setItem('wk130_save','');localStorage.setItem('wk130_generals','[]');localStorage.setItem('wk130_quiz','');localStorage.setItem('wk130_myq','');wk130Game.open();});await p.waitForTimeout(400);
const cnt=await p.evaluate(()=>document.querySelector('#wk130Game [data-ov="start"]').textContent.match(/문제 ([\d,]+)개/)[1]);ok(+cnt.replace(/,/g,'')>=10000,'문제 수 '+cnt);
await p.screenshot({path:pre+'_start.png'});
// 내 문제
await p.evaluate(()=>{document.querySelector('#wk130Game [data-ov="start"] details:last-of-type').open=true;});
await p.fill('#wk130Game [data-s="myq"]','원기랜드 마스코트는? | 토끼 | 곰 | 판다 | 공룡\n1+1은? | 2');await p.click('#wk130Game [data-s="myqsave"]');await p.waitForTimeout(200);
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('wk130_myq')).length)===2,'내 문제 2개 저장');
// 장수 여러 명
await p.click('#wk130Game [data-s="gens"]');await p.waitForTimeout(200);
await p.evaluate(()=>{document.querySelector('#wk130Game [data-ov="gens"] details').open=true;});
await p.fill('#wk130Game [data-g="bulk"]','지인하나\n지인둘, 90, 80, 70, 60\n지인셋\n동명이\n동명이\n동명이');await p.click('#wk130Game [data-g="bulkadd"]');await p.click('#wk130Game [data-g="save"]');await p.waitForTimeout(200);
const R=await p.evaluate(()=>JSON.parse(localStorage.getItem('wk130_generals')));ok(R.length===6&&R[1].war===90&&R.slice(3).map(g=>g.name).join()==='동명이A,동명이B,동명이C','지인 3명 한꺼번에 '+JSON.stringify(R.map(g=>g.name)));
await p.screenshot({path:pre+'_gens.png'});await p.click('#wk130Game [data-g="close"]');await p.waitForTimeout(200);
await p.click('#wk130Game [data-s="go"]');await p.waitForTimeout(600);
const g=await p.evaluate(()=>{const G=wk130Game.state();const lords=G.gens.filter(x=>x.lord).map(x=>x.name);return {n:G.gens.length,placed:G.gens.filter(x=>x.st>=0).length,free:G.gens.filter(x=>x.f===-1).length,mine:G.gens.filter(x=>x.mine).map(x=>[x.name,x.st]),lords,dupAt:G.at.filter(x=>x>=0).length};});
ok(g.n>=575&&g.placed>400&&g.free>50,'장수 '+g.n+'명 · 태수 '+g.placed+' · 재야 '+g.free);ok(g.mine.every(x=>x[1]>=0),'지인 장수 배치 '+JSON.stringify(g.mine));ok(g.lords.length===10,'군주 10명 '+g.lords.join(','));
// 문제 각 과목 200번씩 만들어 정답이 보기에 있는지
const qs=await p.evaluate(()=>{const res={};const cats=['kor','math','eng','soc','sci','art','gen','sub','my'];const root=document.getElementById('wk130Game');
 cats.forEach(c=>{let n=0,badq=0,ex='';localStorage.setItem('wk130_quiz',JSON.stringify({cats:[c],grade:'초3-1',lv:'e',on:true}));wk130Game.state().q={cats:[c],grade:'초3-1',lv:'e',on:true};
  for(let k=0;k<200;k++){wk130Game._quizPeek&&0;}res[c]=0;});return res;});
const check=await p.evaluate(()=>window.wk130Game.selfTest?window.wk130Game.selfTest(300):null);
ok(check&&Object.values(check).every(v=>v.bad===0&&v.n>0),'과목별 문제 확인 '+JSON.stringify(check));
// 문제 창 실제로
await p.evaluate(()=>{wk130Game.state().q={cats:['gen'],grade:'초3-1',lv:'e',on:true};});
const r=await p.evaluate(()=>{const G=wk130Game.state(),D=wk130Game.data;const adj={};D.e.forEach(e=>{(adj[e[0]]=adj[e[0]]||[]).push(e[1]);(adj[e[1]]=adj[e[1]]||[]).push(e[0]);});for(let i=0;i<G.o.length;i++){if(G.o[i]!==G.me||G.act[i])continue;const en=(adj[i]||[]).filter(j=>G.o[j]!==G.me);if(en.length){G.t[i]=900;return [i,en[0]];}}});
await p.evaluate(i=>wk130Game.tap(i),r[0]);await p.click('#wk130Game .side [data-a="atk"]');await p.evaluate(i=>wk130Game.tap(i),r[1]);await p.waitForTimeout(400);
await p.screenshot({path:pre+'_quiz.png'});const ans=await p.evaluate(()=>document.getElementById('wk130Game')._q.ans);await p.click('#wk130Game [data-q="opt"][data-v="'+ans.replace(/"/g,'\\"')+'"]');await p.waitForTimeout(1000);
ok(await p.evaluate(i=>wk130Game.state().o[i]===wk130Game.state().me,r[1]),'상식 문제 맞히고 점령');
// 등용
const h=await p.evaluate(()=>{const G=wk130Game.state();for(let i=0;i<G.o.length;i++)if(G.o[i]===G.me&&G.at[i]<0&&!G.act[i]){G.gold[G.me]=500;wk130Game.tap(i);return i;}return -1;});
if(h>=0){await p.click('#wk130Game .side [data-a="hire"]');ok(await p.evaluate(i=>wk130Game.state().at[i]>=0,h),'재야 장수 등용');}else ok(true,'등용할 빈 역 없음');
// 노선 나란히
const par=await p.evaluate(()=>{const L=[...document.querySelectorAll('#wk130Game svg.map g line')];return L.length;});ok(par>800,'노선 선 '+par+'개');
await p.evaluate(()=>{wk130Game.tap(wk130Game.data.st.findIndex(s=>s[0]==='종로3가'));});await p.waitForTimeout(200);
await p.evaluate(()=>wk130Game.focusName&&wk130Game.focusName('서울',900));await p.waitForTimeout(300);await p.screenshot({path:pre+'_lines.png'});
for(let k=0;k<3;k++)await p.click('#wk130Game [data-a="end"]');ok(await p.evaluate(()=>wk130Game.state().turn)===3,'턴 3번');
const p2=await b.newPage();await p2.route(/^https?:/,r=>r.abort());await p2.goto('file://'+file,{waitUntil:'load',timeout:120000});await p2.waitForTimeout(2500);ok(!(await p2.$('#wk130Hall')),'주인장 기기가 아니면 건물이 안 보임');
 ok(errs.length===0,'오류 '+JSON.stringify(errs));await b.close();process.exit(bad?1:0);})();
