// 141차: 휴대폰 지도 가볍게 — 휴대폰은 움직이는 그림 줄임(lite), 지도를 만지는 동안·게임 창이 열리면 멈춤, 두 손가락 확대가 손을 떼면 반영됨, 천하통일 두 손가락 확대
// node tests/t141.js 결과.html
const {chromium,devices}=require('playwright');
(async()=>{const file=process.argv[2];const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};
const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem('wk65_admin_device','1')}catch(_){}});
await p.route(/^https?:/,r=>r.abort());const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+file,{waitUntil:'load',timeout:120000});await p.waitForTimeout(2500);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
ok(await p.evaluate(()=>wk121Life.lite()&&wk121Life.count()<120),'휴대폰은 가볍게 · 움직이는 것 '+await p.evaluate(()=>wk121Life.count())+'개');
ok(await p.evaluate(()=>wk121Life.running()),'평소에는 움직임');
const r=await p.evaluate(()=>new Promise(res=>{document.querySelector('button[data-map-action="in"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.querySelector('button[data-map-action="in"]').click();requestAnimationFrame(()=>res(wk121Life.running()));}));
ok(r===false,'확대 버튼 누르는 동안 멈춤');await p.waitForTimeout(1300);ok(await p.evaluate(()=>wk121Life.running()),'손을 떼면 다시 움직임');
// 두 손가락 확대
const cdp=await ctx.newCDPSession(p);const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
const vp=await p.evaluate(()=>{const v=document.getElementById('wonkiMapViewport');v.scrollIntoView({block:'start'});const r=v.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round((Math.max(r.top,0)+Math.min(r.bottom,innerHeight))/2)};});await p.waitForTimeout(400);
const s0=await p.evaluate(()=>document.getElementById('wonkiMapScale').textContent);
await T('touchStart',[[vp.x-40,vp.y],[vp.x+40,vp.y]]);for(let k=1;k<=12;k++){const d=40+k*8;await T('touchMove',[[vp.x-d,vp.y],[vp.x+d,vp.y]]);}
const mid=await p.evaluate(()=>document.getElementById('wk44World').style.transform);await T('touchEnd',[]);await p.waitForTimeout(300);
const s1=await p.evaluate(()=>document.getElementById('wonkiMapScale').textContent),after=await p.evaluate(()=>document.getElementById('wk44World').style.transform);
ok(/scale/.test(mid),'두 손가락 움직이는 동안은 늘이기만 ('+mid.slice(0,40)+')');ok(parseInt(s1)>parseInt(s0)*1.8&&!after,'손을 떼면 확대 반영 '+s0+' → '+s1);
// 수학 창 열면 멈춤
await p.evaluate(()=>{document.getElementById('mathChoiceStatus').textContent='레벨: 중 | 학년: 초5-1';window.wonkiStartDbzGame();});await p.waitForTimeout(1300);
ok(await p.evaluate(()=>!wk121Life.running()),'수학 창이 열려 있으면 지도 움직임 멈춤');
// 천하통일 두 손가락
await p.evaluate(()=>{document.getElementById('dbzv2')&&document.querySelector('#dbzv2 [data-a="close"],#dbzv2 .dbz-close')?.click();wk130Game.open();});await p.waitForTimeout(600);
await p.evaluate(()=>{document.querySelector('#wk130Game [data-s="fac"][data-f="0"]').click();document.querySelector('#wk130Game [data-s="go"]').click();});await p.waitForTimeout(1200);
const bx=await p.evaluate(()=>{const s=document.querySelector('#wk130Game svg.map');const r=s.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),vb:s.getAttribute('viewBox')};});
await T('touchStart',[[bx.x-30,bx.y],[bx.x+30,bx.y]]);for(let k=1;k<=8;k++){const d=30+k*6;await T('touchMove',[[bx.x-d,bx.y],[bx.x+d,bx.y]]);}
const hid=await p.evaluate(()=>document.querySelector('#wk130Game .wk141L').style.visibility);await T('touchEnd',[]);await p.waitForTimeout(400);
const vb1=await p.evaluate(()=>document.querySelector('#wk130Game svg.map').getAttribute('viewBox')),shown=await p.evaluate(()=>document.querySelector('#wk130Game .wk141L').style.visibility);
ok(+vb1.split(' ')[2]<+bx.vb.split(' ')[2]*.8,'천하통일 두 손가락 확대 '+bx.vb.split(' ')[2]+' → '+vb1.split(' ')[2]);ok(hid==='hidden'&&shown==='','움직이는 동안만 역 이름 숨김');
ok(errs.length===0,'오류 '+JSON.stringify(errs));await b.close();process.exit(bad?1:0);})();
