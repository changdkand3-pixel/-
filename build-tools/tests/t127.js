// 127차: 분수 물방울·물결, 물 위의 오리, 꽃잎 (node tests/t127.js 결과.html)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:900}});await p.route(/^https?:/,r=>r.abort());const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(1500);let bad=0;const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};
const r=await p.evaluate(()=>{const L=document.getElementById('wk121Life');const W=L.querySelector('#wk126Water');
 const ducks=[...L.querySelectorAll('[data-who="duck"],[data-who="duckling"]')].map(g=>{const m=g.getAttribute('transform').match(/translate\(([\d.-]+) ([\d.-]+)\)/);return [m[1]/1672,m[2]/941];});
 return {drops:W.querySelectorAll('g').length,rips:W.querySelectorAll('.rip').length,petals:L.querySelectorAll('.spin').length,ducks};});
ok(r.drops>=30&&r.rips>=10,'분수 물방울 '+r.drops+'개 · 물결 '+r.rips+'개');
ok(r.petals>=30,'꽃잎 '+r.petals+'개');
ok(r.ducks.length>=7&&r.ducks.every(d=>d[0]>.41&&d[0]<.59&&d[1]>.49&&d[1]<.52),'오리가 모두 분수 물 안 '+JSON.stringify(r.ducks.map(d=>d.map(v=>v.toFixed(3)))));
const a=await p.evaluate(()=>[...document.querySelectorAll('#wk126Water>g')].slice(0,5).map(g=>g.getAttribute('transform')));await p.waitForTimeout(400);
const c=await p.evaluate(()=>[...document.querySelectorAll('#wk126Water>g')].slice(0,5).map(g=>g.getAttribute('transform')));ok(a.some((x,i)=>x!==c[i]),'물방울이 움직임');
ok(errs.length===0,'오류 '+JSON.stringify(errs));await b.close();process.exit(bad?1:0);})();
