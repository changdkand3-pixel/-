// 130차: 지하철 천하통일 — 건물→시작 화면→장수 등록→새 게임→개발·공격→턴 종료(컴퓨터 세력)→저장·이어하기 (node tests/t130.js 결과.html 사진접두어)
const {chromium}=require('playwright');
(async()=>{const [,,file,pre]=process.argv;const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};const errs=[];
for(const vw of [{width:1280,height:860},{width:390,height:800}]){
 const p=await b.newPage({viewport:vw});p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('wk65_admin_device','1')}catch(_){}});
 await p.goto('file://'+file,{waitUntil:'load',timeout:120000});await p.waitForTimeout(1500);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;try{localStorage.setItem('wk130_save','');localStorage.setItem('wk130_generals','[]');}catch(_){}});
 const hall=await p.$('#wk130Hall');ok(!!hall,vw.width+' 메인 지도에 건물');
 await hall.scrollIntoViewIfNeeded();const bx=await hall.boundingBox();
 const hit=await p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return !!(e&&e.closest('#wk130Hall'));},[bx.x+bx.width/2,bx.y+bx.height*.45]);ok(hit,vw.width+' 건물이 가려지지 않음');
 if(vw.width===1280)await p.screenshot({path:pre+'_map.png'});
 await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height*.45);await p.waitForTimeout(400);
 ok(await p.evaluate(()=>!document.getElementById('wk130Game').hidden&&!document.querySelector('#wk130Game [data-ov="start"]').hidden),vw.width+' 누르면 시작 화면');
 await p.screenshot({path:pre+'_'+vw.width+'_start.png'});
 await p.click('#wk130Game [data-s="gens"]');await p.waitForTimeout(200);
 for(let k=0;k<3;k++){await p.click('#wk130Game [data-g="add"]');}
 const rows=await p.$$('#wk130Game [data-ov="gens"] tbody tr');
 const names=['장수가','장수나','장수다'];for(let k=0;k<3;k++){await rows[k].$eval('input[data-f="name"]',(e,v)=>e.value=v,names[k]);}
 await rows[0].$eval('select',e=>e.value='0');await rows[0].$eval('input[data-f="lord"]',e=>e.checked=true);await rows[0].$eval('input[data-f="war"]',e=>e.value='95');
 await p.click('#wk130Game [data-g="save"]');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('wk130_generals')).length)===3,vw.width+' 장수 3명 저장');
 if(vw.width===390)await p.screenshot({path:pre+'_390_gens.png'});
 await p.click('#wk130Game [data-g="close"]');await p.waitForTimeout(200);
 await p.click('#wk130Game [data-s="fac"][data-f="0"]');await p.click('#wk130Game [data-s="go"]');await p.waitForTimeout(500);
 const st=await p.evaluate(()=>{const G=wk130Game.state();return {me:G.me,n:G.o.length,mine:G.o.filter(x=>x===0).length,gens:G.gens.slice(0,3).map(g=>[g.name,g.f,g.st]),lordAtCap:G.gens[0].st===wk130Game.data.f[0][1]};});
 ok(st.n===661&&st.mine>50,vw.width+' 새 게임: '+st.mine+'역으로 시작');ok(st.lordAtCap&&st.gens.slice(0,3).every(g=>g[2]>=0),vw.width+' 장수 배치 '+JSON.stringify(st.gens));
 const g0=await p.evaluate(()=>wk130Game.state().gold[0]);await p.click('#wk130Game .side [data-a="dev"]');
 ok(await p.evaluate(()=>wk130Game.state().gold[0])===g0-40,vw.width+' 개발하면 금 -40');
 const r=await p.evaluate(()=>{const G=wk130Game.state(),D=wk130Game.data;const adj={};D.e.forEach(e=>{(adj[e[0]]=adj[e[0]]||[]).push(e[1]);(adj[e[1]]=adj[e[1]]||[]).push(e[0]);});
  for(let i=0;i<G.o.length;i++){if(G.o[i]!==0||G.act[i])continue;const en=(adj[i]||[]).filter(j=>G.o[j]!==0);if(en.length){G.t[i]=900;return [i,en[0]];}}return null;});
 await p.evaluate(i=>wk130Game.tap(i),r[0]);await p.waitForTimeout(100);await p.click('#wk130Game .side [data-a="atk"]');await p.evaluate(i=>wk130Game.tap(i),r[1]);await p.waitForTimeout(400);
 const qq=await p.evaluate(()=>{const ov=document.querySelector('#wk130Game [data-ov="quiz"]');const Q=document.getElementById('wk130Game')._q;return {shown:!ov.hidden,t:Q&&Q.t,img:!!(Q&&Q.img),ans:Q&&Q.ans};});
 ok(qq.shown,vw.width+' 공격 전 문제 ('+qq.t+(qq.img?' 그림':'')+')');await p.screenshot({path:pre+'_'+vw.width+'_quiz.png'});
 if(qq.t==='eng'||qq.t==='mc')await p.click('#wk130Game [data-q="opt"][data-v="'+qq.ans+'"]');else{await p.fill('#wk130Game [data-ov="quiz"] input',qq.ans);await p.click('#wk130Game [data-q="ok"]');}
 await p.waitForTimeout(300);ok(await p.evaluate(()=>/정답/.test(document.querySelector('#wk130Game .qres').textContent)),vw.width+' 정답 처리');await p.waitForTimeout(900);
 ok(await p.evaluate(i=>wk130Game.state().o[i],r[1])===0,vw.width+' 공격으로 '+r[1]+'번 역 점령');
 if(vw.width===1280){await p.evaluate(i=>wk130Game.tap(i),r[1]);await p.waitForTimeout(200);await p.screenshot({path:pre+'_1280_game.png'});}
 for(let k=0;k<5;k++){await p.click('#wk130Game [data-a="end"]');await p.waitForTimeout(50);}
 const s2=await p.evaluate(()=>{const G=wk130Game.state();return {turn:G.turn,log:G.log.slice(0,3),own:new Set(G.o).size};});
 ok(s2.turn===5,vw.width+' 턴 5번 진행 '+JSON.stringify(s2));
 if(vw.width===390)await p.screenshot({path:pre+'_390_game.png'});
 await p.click('#wk130Game [data-a="close"]');await p.reload({waitUntil:'load'});await p.waitForTimeout(1500);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;wk130Game.open();});await p.waitForTimeout(300);
 ok(await p.evaluate(()=>wk130Game.state()&&wk130Game.state().turn)===5,vw.width+' 다시 열면 이어하기');
 const ms=await p.evaluate(()=>{const t=performance.now();for(let k=0;k<10;k++)wk130Game.endTurn();return (performance.now()-t)/10;});ok(ms<400,vw.width+' 턴 종료 한 번 '+ms.toFixed(0)+'ms');
 await p.close();}
ok(errs.length===0,'오류 '+JSON.stringify(errs));await b.close();process.exit(bad?1:0);})();
