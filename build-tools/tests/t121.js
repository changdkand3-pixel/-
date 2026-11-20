// 121차: 메인 지도 구름·새·동물·직원 (node tests/t121.js 결과.html 사진접두어)
const {chromium}=require('playwright');
(async()=>{const [,,file,pre]=process.argv;const b=await chromium.launch();const errs=[];let bad=0;const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};
for(const vw of [{width:1200,height:900},{width:390,height:800}]){
 const p=await b.newPage({viewport:vw});p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+file,{waitUntil:'load',timeout:120000});await p.waitForTimeout(1500);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
 const info=await p.evaluate(()=>({n:window.wk121Life&&window.wk121Life.count(),who:window.wk121Life&&window.wk121Life.who(),inStage:!!document.querySelector('#mainStage>#wk121Life')}));
 ok(info.inStage&&info.n>=25,vw.width+' 층 있음 · 움직이는 것 '+info.n+'개 '+JSON.stringify(info.who));
 const pos=()=>p.evaluate(()=>[...document.querySelectorAll('#wk121Life>g')].map(g=>g.getAttribute('transform')));
 const a=await pos();await p.waitForTimeout(1500);const c=await pos();
 ok(a.filter((x,i)=>x!==c[i]).length>=a.length-1,vw.width+' 1.5초 뒤 위치가 바뀜 ('+a.filter((x,i)=>x!==c[i]).length+'/'+a.length+')');
 const blk=await p.evaluate(()=>{const s=document.getElementById('mainStage').getBoundingClientRect();const e=document.elementFromPoint(s.left+s.width*.5,s.top+s.height*.6);return e&&e.closest&&e.closest('#wk121Life')?'막힘':'통과';});
 ok(blk==='통과',vw.width+' 지도 누르기를 막지 않음');
 const st=await p.$('#mainStage');await st.scrollIntoViewIfNeeded();await st.screenshot({path:pre+'_'+vw.width+'.png'});
 if(vw.width===1200){await p.click('#wonkiLifeToggle');await p.waitForTimeout(300);const x=await pos();await p.waitForTimeout(800);const y=await pos();
  ok(x.every((v,i)=>v===y[i])&&await p.evaluate(()=>document.getElementById('wk121Life').classList.contains('wk121-off')),'움직임 끄기 누르면 멈춤');
  await p.click('#wonkiLifeToggle');await p.waitForTimeout(300);const z=await pos();await p.waitForTimeout(600);const w=await pos();ok(z.some((v,i)=>v!==w[i]),'다시 켜면 움직임');}
 await p.close();}
ok(errs.length===0,'페이지 오류 '+JSON.stringify(errs));await b.close();process.exit(bad?1:0);})();
