// 125차: 그라데이션 id가 두 층(직원 #wk121Life·방문객 #wonkiParkLife)에서 겹치지 않는지, 흰 탈인형이 흰색 계열인지 (node tests/t125.js 결과.html)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:900}});await p.route(/^https?:/,r=>r.abort());const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(1000);
await p.evaluate(()=>{const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());document.dispatchEvent(new CustomEvent('wonki-visitor-summary31',{detail:{today:30,day}}));});
await p.waitForTimeout(2600);
const r=await p.evaluate(()=>{const ids=[...document.querySelectorAll('linearGradient[id^="wk125"],radialGradient[id^="wk125"]')].map(g=>g.id);const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
 const head=document.querySelector('#wk121Life [data-who="rabbit"] circle[r="10"]');const g=head&&document.getElementById(head.getAttribute('fill').slice(5,-1));const mid=g&&g.querySelectorAll('stop')[1].getAttribute('stop-color');
 return {n:ids.length,dup:dup.length,rabbitMid:mid};});
let bad=0;const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};
ok(r.n>10&&r.dup===0,'그라데이션 '+r.n+'개, 겹치는 id '+r.dup);
const c=r.rabbitMid&&r.rabbitMid.match(/[0-9a-f]{2}/gi).map(h=>parseInt(h,16));ok(c&&Math.min(...c)>215,'토끼 탈인형 머리 색 '+r.rabbitMid+' (흰색 계열)');
ok(errs.length===0,'오류 '+JSON.stringify(errs));await b.close();process.exit(bad?1:0);})();
