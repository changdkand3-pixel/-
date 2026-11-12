// 101차 시험: 종교코스 창 아래 랜덤 버튼 30번 연속(매번 앞과 다른 메뉴, 세부 항목까지 결과 표시, 세부 창은 안 열림), 세부 창 랜덤, 효과음(오디오 노드 생성 횟수)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3],w=+(process.argv[4]||1200);const dir=path.dirname(file);const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:w,height:w<500?844:900},isMobile:w<500,hasTouch:w<500})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__osc=0;const C=window.AudioContext||window.webkitAudioContext;if(C){const o=C.prototype.createOscillator;C.prototype.createOscillator=function(){window.__osc++;return o.apply(this,arguments);};}});
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
const tap=async sel=>{const bx=await (await p.$(sel)).boundingBox();await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);await p.waitForTimeout(250);};
await p.evaluate(()=>document.getElementById('faith').click());await p.waitForTimeout(600);
const bx=await (await p.$('#faithRandomBtn')).boundingBox();console.log('랜덤 버튼 위치 y',Math.round(bx.y),'~',Math.round(bx.y+bx.height),'/ 화면',w<500?844:900);
let prev=null,same=0,ok=0,deepOpen=0;const seen={};
for(let i=0;i<30;i++){const o0=await p.evaluate(()=>window.__osc);await tap('#faithRandomBtn');
 const r=await p.evaluate(()=>({s:document.querySelector('#faithModal .faithspot.selected')?.id,t:document.getElementById('resultText').textContent,deep:document.querySelectorAll('.modal.wk91-deep.open').length,sub:window.wk91ChurchSub,osc:window.__osc}));
 if(r.s===prev)same++;prev=r.s;seen[r.s]=(seen[r.s]||0)+1;if(r.sub&&r.t.includes(r.sub))ok++;deepOpen+=r.deep;if(i<3)console.log('  ',i+1,r.t.replace(/\n/g,' / '),'| 소리 노드 +',r.osc-o0);}
console.log('30번: 메뉴별',seen,'| 앞과 같은 메뉴',same,'| 세부 항목까지 표시',ok,'| 세부 창 열림',deepOpen);
await p.screenshot({path:out+'_faith.png'});
await tap('#faith'+'Modal .faithspot.selected');await p.waitForTimeout(400);const dm=await p.evaluate(()=>document.querySelector('.modal.wk91-deep.open')?.id);
const o1=await p.evaluate(()=>window.__osc);await tap('#'+dm+'RandomBtn');await tap('#'+dm+'RandomBtn');console.log('세부 창',dm,'랜덤 2번 →',await p.evaluate(()=>document.getElementById('resultText').textContent.replace(/\n/g,' / ')),'| 소리 노드 +',await p.evaluate(()=>window.__osc)-o1);
const o2=await p.evaluate(()=>window.__osc);await tap('#'+dm+' .churchspot');console.log('세부 항목 직접 누름 소리 노드 +',await p.evaluate(()=>window.__osc)-o2);
await p.screenshot({path:out+'_deep.png'});
console.log('오류',errs);await b.close();})();
