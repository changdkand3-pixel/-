// 107차 시험: 영어 학기마다 7단원(문제·상대 있음), 대결판 그리기(초2-1·2-2·3-1·3-2·4-1·일반), 드래곤볼 1~7성구, 첫 보기 자동 초점 없음, 상위메뉴 한 단계 위, 아이템 수, 예전 저장 불러오기, 획득 창 닫기
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1100,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{const C=window.WonkiEnglishCore;const bad=[];let n=0;
 for(const s of C.SEMESTERS){if(s.key!=='e1-1'&&s.units.length!==7)bad.push(s.key+':단원'+s.units.length);for(const u of s.units){const q=C.BANK.filter(x=>x.unit===u).length;const g=C.createGame(null);g.selectSemester(s.key);const en=g.enemies(u);if(q<4||!en.length)bad.push(s.key+'/'+u+':문제'+q+':상대'+en.length);n++;}}
 return {sem:C.SEMESTERS.length,units:n,bad,items:Object.keys(C.ITEMS).length,names:C.SEMESTERS.find(s=>s.key==='e4-1').units.map(u=>C.UNITS[u-1].name).join(', '),hnames:C.SEMESTERS.find(s=>s.key==='h3-2')?.units.map(u=>C.UNITS[u-1].name).join(', ')};});
console.log('학기',r.sem,'단원',r.units,'| 문제·상대 없는 단원',JSON.stringify(r.bad),'| 아이템',r.items);console.log('초4-1:',r.names);console.log('고3-2:',r.hnames);
// 예전 저장(3단원 시절)
const mig=await p.evaluate(()=>{const C=window.WonkiEnglishCore;const old={kind:'wonkiland-english',version:1,semester:'e4-1',player:'goku',friends:['bulma'],cleared:{1:{oolong:true},20:{yamcha:true}},balls:2,wishes:1,wins:9,solved:84,items:{heal:3},stages:{20:3}};const g=C.createGame(old);return {balls:g.state.balls,wins:g.state.wins,solved:g.state.solved,friends:g.state.friends.length,heal:g.state.items.heal,u1:!!g.state.cleared[1].oolong,u20:Object.keys(g.state.cleared[20]||{}).length,st20:g.stageDone(20),layout:g.state.layout};});
console.log('예전 저장 불러오기',JSON.stringify(mig));
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;window.WonkiEnglish.open();});await p.waitForTimeout(500);
const act=async sel=>{await p.evaluate(s=>document.querySelector(s)?.click(),sel);await p.waitForTimeout(350);};
const h=()=>p.evaluate(()=>document.querySelector('#wkEnglishGame .we-header h2')?.textContent);
await act('[data-eng-action="enter-game"]');
for(const key of ['e2-1','e2-2','e3-1','e3-2','e4-1','e5-1','h1-1']){if(!(await p.$('[data-eng-semester="'+key+'"]')))await act('[data-eng-action="semesters"]');await act('[data-eng-semester="'+key+'"]');
 const first=await p.$('#wkEnglishGame .we-card');if(first&&(await h())?.includes('전사')){await first.click();await p.waitForTimeout(250);const go=await p.$('#wkEnglishGame [data-eng-action="confirm-character"],#wkEnglishGame [data-eng-action="start"],#wkEnglishGame [data-eng-action="units"]');if(go){await go.click();await p.waitForTimeout(350);}}
 const info=await p.evaluate(()=>{const t=document.querySelector('#wkEnglishGame .we-content');return {titles:[...t.querySelectorAll('.wk21-title,.wk38-title,.wk31-title,.wk32-title,.wk41-title,.we-unit-main b')].length,undef:t.innerHTML.includes('undefined'),ops:t.querySelectorAll('[data-eng-action="fight-unit"],[data-eng-action="unit"]').length};});
 console.log(key,'단원 줄',info.titles,'| undefined 글자',info.undef,'| 누를 곳',info.ops,'|',await h());
 if(key==='e4-1')await p.screenshot({path:out+'_e41.png',fullPage:false});if(key==='e5-1')await (await p.$('#wkEnglishGame .we-panel')).screenshot({path:out+'_e51.png'});}
// 전투: 첫 보기 초점 없음, 상위메뉴 → 상대 고르기
await act('#wkEnglishGame [data-eng-action="unit"]');const fu=await p.$('#wkEnglishGame [data-eng-action="fight"]');if(fu){await fu.click();await p.waitForTimeout(400);}
console.log('전투 화면?',await h(),'| 초점이 보기에?',await p.evaluate(()=>!!document.activeElement?.closest?.('.we-choice')));
await p.evaluate(()=>{document.querySelector('#wkEnglishGame').querySelectorAll('.we-balls span')[0]?.classList.add('on')});
await (await p.$('#wkEnglishGame .we-balls')).screenshot({path:out+'_balls.png'});
await act('#wkEnglishGame .we-toolbar [data-eng-action="title"]');console.log('상위메뉴 누른 뒤',await h());
await act('#wkEnglishGame .we-toolbar [data-eng-action="title"]');console.log('한 번 더',await h());
// 획득 창
const closed=await p.evaluate(async()=>{const n=document.getElementById('wkRewardNotice');if(!n)return 'no notice';n.hidden=false;n.innerHTML=n.innerHTML||'';const c=n.querySelector('.wk-reward-card');if(!c)return 'no card';c.click();return n.hidden;});console.log('획득 창 누르면 닫힘',closed);
console.log('오류',errs);await b.close();})();
