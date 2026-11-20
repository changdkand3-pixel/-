// 123차: 원래 방문객(#wonkiParkLife)도 명암·테두리·얼굴 그림체 — 다시 그려져도 그라데이션이 깨지지 않는지 (node tests/t123.js 결과.html 사진.png)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:1000},deviceScaleFactor:2});await p.route(/^https?:/,r=>r.abort());
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(1200);
await p.evaluate(()=>{document.getElementById('wkUpdatePoster').hidden=true;const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());document.dispatchEvent(new CustomEvent('wonki-visitor-summary31',{detail:{today:40,day}}));});
await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{const L=document.getElementById('wonkiParkLife');return {n:L.querySelectorAll('.wk-park-person').length,styled:L.querySelectorAll('.wk-park-person[data-wk122]').length,grads:L.querySelectorAll('defs[data-wk122] linearGradient').length,broken:[...L.querySelectorAll('[fill^="url("]')].filter(n=>!document.querySelector(n.getAttribute('fill').slice(4,-1))).length};});
console.log(JSON.stringify(r));
// re-render (count changes) and check again
await p.evaluate(()=>{const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());document.dispatchEvent(new CustomEvent('wonki-visitor-summary31',{detail:{today:55,day}}));});
await p.waitForTimeout(2500);
const r2=await p.evaluate(()=>{const L=document.getElementById('wonkiParkLife');return {n:L.querySelectorAll('.wk-park-person').length,styled:L.querySelectorAll('.wk-park-person[data-wk122]').length,broken:[...L.querySelectorAll('[fill^="url("]')].filter(n=>!document.querySelector(n.getAttribute('fill').slice(4,-1))).length};});
console.log(JSON.stringify(r2),'errors',JSON.stringify(errs));
const st=await p.$('#mainStage');await st.scrollIntoViewIfNeeded();await st.screenshot({path:process.argv[3]});await b.close();})();
