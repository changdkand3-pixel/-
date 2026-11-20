// 128차: 원래 그림 구름(#wk128Sky .pc)이 흘러가고, 다리 밑 연못(#wk128Pond) 물결·오리, 움직임 끄면 멈춤 (node tests/t128.js 결과.html)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:900}});await p.route(/^https?:/,r=>r.abort());const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(1500);let bad=0;const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};
const t=()=>p.evaluate(()=>[...document.querySelectorAll('#wk128Sky .pc')].map(e=>e.style.transform));
const a=await t();await p.waitForTimeout(1500);const c=await t();
ok(a.length>=8&&a.every((x,i)=>x!==c[i]),'그림 구름 '+a.length+'조각이 움직임');
const r=await p.evaluate(()=>{const s=document.getElementById('wk128Sky'),q=document.getElementById('wk128Pond');const cs=getComputedStyle(s);return {mask:(cs.maskImage||cs.webkitMaskImage||'').slice(0,20),pond:!!q&&getComputedStyle(q.querySelector('i')).animationName,ducks:[...document.querySelectorAll('#wk121Life [data-who^="duck"]')].length,hit:(()=>{const st=document.getElementById('mainStage').getBoundingClientRect();const e=document.elementFromPoint(st.left+st.width*.3,st.top+st.height*.06);return e&&e.closest&&e.closest('#wk128Sky')?'막힘':'통과';})()};});
ok(/url/.test(r.mask),'하늘 층은 하늘 모양 마스크 '+r.mask);ok(r.pond==='wk128flow','연못 물결 애니메이션 '+r.pond);ok(r.ducks>=12,'오리 '+r.ducks+'마리');ok(r.hit==='통과','지도 누르기를 막지 않음');
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});await p.click('#wonkiLifeToggle');await p.waitForTimeout(300);const x=await t();await p.waitForTimeout(700);const y=await t();
ok(x.every((v,i)=>v===y[i])&&await p.evaluate(()=>document.getElementById('wk128Pond').classList.contains('wk121-off')),'움직임 끄기 누르면 구름·연못도 멈춤');
ok(errs.length===0,'오류 '+JSON.stringify(errs));await b.close();process.exit(bad?1:0);})();
