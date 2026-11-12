// 105차 시험: 영어 독해 단어(context) 문제는 지문에 그 단어가 있을 때만 / 단원마다 7스테이지(상대 체력 5→11, 이기면 다음 스테이지, 저장·불러오기 유지) / 화면 글자
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1100,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{const C=window.WonkiEnglishCore;const bad=[],per={};
 for(const q of C.BANK.filter(q=>q.kind==='context')){const w=q.word.toLowerCase().split(/\s+/)[0].replace(/(e|y)$/,'');const ok=q.passage.toLowerCase().includes(w);if(!ok)bad.push(q.word+' / '+q.passage.slice(0,40));const sem=C.UNITS[q.unit-1].semester;per[sem]=(per[sem]||0)+1;}
 return {context:C.BANK.filter(q=>q.kind==='context').length,bad:bad.slice(0,8),badN:bad.length,perE41:per['e4-1'],perE31:per['e3-1']};});
console.log('독해 단어 문제',r.context,'개 | 지문에 없는 단어',r.badN,r.bad,'| e4-1',r.perE41,'e3-1',r.perE31);
const g=await p.evaluate(()=>{const C=window.WonkiEnglishCore;const game=C.createGame(null);const sem=C.SEMESTERS.find(s=>s.key==='e4-1');game.selectSemester('e4-1');game.selectCharacter(game.unlockedCharacters()[0]);const u=sem.units[0];const log=[];
 for(let k=0;k<8;k++){const en=game.enemies(u)[k%game.enemies(u).length];game.startBattle(u,en);const b=game.state.battle;const st=b.stage,hp=b.enemyHP,qn=b.questions.length;
  while(!b.result){const q=game.currentQuestion();game.answer(q.choices.indexOf(q.answer));if(!b.result)game.next();}log.push(st+':체력'+hp+':문제'+qn+':'+b.result);}
 const saved=game.serialize();const g2=C.createGame(JSON.parse(JSON.stringify(saved)));
 // 진행 중 전투 저장/불러오기
 g2.startBattle(sem.units[1],g2.enemies(sem.units[1])[0]);const s3=C.createGame(JSON.parse(JSON.stringify(g2.serialize())));
 return {log,stage:game.stageOf(u),done:game.stageDone(u),reload:g2.stageDone(u),battleKept:!!s3.state.battle&&s3.state.battle.questions.length===15&&s3.state.battle.max===5};});
console.log('7스테이지 진행',g.log.join(' | '));console.log('끝난 뒤 스테이지',g.stage,'완료',g.done,'| 다시 불러와도',g.reload,'| 진행 중 전투 저장·불러오기',g.battleKept);
// 화면
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;window.WonkiEnglish.open();});await p.waitForTimeout(500);
const act=async sel=>{await p.evaluate(s=>document.querySelector(s)?.click(),sel);await p.waitForTimeout(350);};
await act('[data-eng-action="enter-game"]');if(!(await p.$('[data-eng-semester="e4-1"]')))await act('[data-eng-action="semesters"]');await act('[data-eng-semester="e4-1"]');
const first=await p.$('#wkEnglishGame .we-card');if(first&&!(await p.$('.wk41-board'))){await first.click();await p.waitForTimeout(300);const go=await p.$('#wkEnglishGame [data-eng-action="confirm-character"],#wkEnglishGame [data-eng-action="start"],#wkEnglishGame [data-eng-action="units"]');if(go){await go.click();await p.waitForTimeout(400);}}
console.log('대결판 단원 제목',await p.$$eval('.wk41-title small',a=>a.map(x=>x.textContent).slice(0,2).join(' | ')));
await act('#wkEnglishGame .wk41-op');console.log('전투 화면',await p.evaluate(()=>document.querySelector('#wkEnglishGame .we-question-meta span')?.textContent),'|',await p.evaluate(()=>[...document.querySelectorAll('#wkEnglishGame .we-hp-label')].map(x=>x.textContent).join(' / ')));
await p.screenshot({path:out+'_battle.png'});
console.log('오류',errs);await b.close();})();
