// 116차: 메인 지도 '9. 파이터즈 2026' 경기장 → 소개 창 (node tests/t116.js 결과.html 사진접두어)
const {chromium}=require('playwright');
(async()=>{const [,,file,pre]=process.argv;const b=await chromium.launch();const errs=[];
for(const vw of [{width:1200,height:900},{width:390,height:800}]){
 const p=await b.newPage({viewport:vw});p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+file,{waitUntil:'load',timeout:120000});await p.waitForTimeout(1500);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.querySelectorAll('[id*=UpdatePoster],.wk-update-poster').forEach(n=>n.hidden=true)});
 const a=await p.$('#wk116Arena');if(!a)throw new Error('건물 없음');
 await a.scrollIntoViewIfNeeded();await p.waitForTimeout(300);
 const bx=await a.boundingBox();
 const hit=await p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e&&e.closest('#wk116Arena')?'arena':(e&&(e.id||e.className))},[bx.x+bx.width/2,bx.y+bx.height*0.55]);
 console.log(vw.width,'건물',bx,'가운데 누르면',hit);
 await p.screenshot({path:pre+'_'+vw.width+'_map.png'});
 await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height*0.55);await p.waitForTimeout(400);
 const open=await p.evaluate(()=>{const m=document.getElementById('wk116Fighters');return m&&!m.hidden&&{href:m.querySelector('.f-go').href,target:m.querySelector('.f-go').target,course:[...document.querySelectorAll('.modal.open')].map(x=>x.id)}});
 console.log(' 창',open);await p.screenshot({path:pre+'_'+vw.width+'_modal.png'});
 await p.keyboard.press('Escape');await p.waitForTimeout(200);console.log(' Esc 닫힘',await p.evaluate(()=>document.getElementById('wk116Fighters').hidden));
 await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height*0.55);await p.waitForTimeout(200);await p.mouse.click(5,5);await p.waitForTimeout(200);
 console.log(' 바깥 닫힘',await p.evaluate(()=>document.getElementById('wk116Fighters').hidden));
 await p.evaluate(()=>document.getElementById('memory')?.click());await p.waitForTimeout(400);
 console.log(' 코스 창 열리면 숨김',await p.evaluate(()=>getComputedStyle(document.getElementById('wk116Arena')).visibility));
 await p.close();}
console.log('errors',errs);await b.close();})();
