const {chromium}=require('playwright');
(async()=>{const [,,file,pre]=process.argv;const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.route(/^https?:/,r=>r.abort());
await p.addInitScript(()=>{try{localStorage.setItem('wonkiParkDraft37_guest',JSON.stringify({baseRevision:0,state:{version:1,revision:0,courses:[],buildings:[{id:'t1',type:'wheel',name:'관람차',x:.6,y:.5,rotation:0,scale:1,courseId:''}]},deleted:[]}));}catch(e){}});
await p.goto('file://'+file,{waitUntil:'load',timeout:120000});await p.waitForTimeout(1200);
await p.evaluate(()=>{document.getElementById('wkUpdatePoster').hidden=true;});
await p.click('[data-map-action="fit"]');await p.waitForTimeout(400);
const st=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('wonkiParkDraft37_guest')).state.buildings);
// 건물 짓기 화면: 오른쪽 확장 지역(9코스 공사장)으로 끌기
await p.evaluate(()=>window.WonkiParkEditor36.open('build'));await p.waitForTimeout(400);
const vb=await p.evaluate(()=>document.querySelector('.wk36-canvas').getAttribute('viewBox'));console.log('편집 지도 보이는 범위',vb);
const pt=await p.evaluate(()=>{const c=document.querySelector('.wk36-canvas');c.scrollIntoView({block:'center'});const d=window.WonkiParkEditor36.draft.buildings[0];const m=c.getScreenCTM();const P=new DOMPoint(d.x*1000,d.y*563-35).matrixTransform(m);const Q=new DOMPoint(1600,450).matrixTransform(m);return {x:P.x,y:P.y,tx:Q.x,ty:Q.y}});
await p.mouse.move(pt.x,pt.y);await p.mouse.down();await p.mouse.move(pt.tx,pt.ty,{steps:14});await p.mouse.up();await p.waitForTimeout(300);
console.log('편집 화면 끌기 후 위치',(await st())[0].x,(await st())[0].y,'(예전 한계 x≤1.3)');
await p.screenshot({path:pre+'_editor.png'});
await p.click('.wk50-saveexit');await p.waitForTimeout(500);
// 메인 지도: 왼쪽 확장 지역(폭포 쪽)으로 끌기
let bb=await (await p.$('.wk-built36')).boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/3);await p.mouse.down();await p.mouse.move(bb.x-230,bb.y+120,{steps:12});await p.mouse.up();await p.waitForTimeout(400);
console.log('메인 지도 끌기 후 위치',JSON.stringify((await st())[0].x),JSON.stringify((await st())[0].y),'(예전 한계 x≥-0.32)');
await (await p.$('#wonkiMapViewport')).screenshot({path:pre+'_main.png'});

// 수학 문제 화면 버튼
await p.evaluate(()=>{document.getElementById('mathChoiceStatus').textContent='레벨: 중 | 학년: 초3-1';window.wonkiStartDbzGame();});await p.waitForTimeout(500);
await p.evaluate(()=>document.querySelector('#dbzv2Body .wk31-op').click());await p.waitForTimeout(600);
console.log('수학 문제 화면 버튼',await p.$$eval('#dbzv2Body .wk55-bar button',a=>a.map(x=>x.textContent).join(' | ')));
await p.screenshot({path:pre+'_math.png'});
await p.evaluate(()=>document.querySelector('#dbzv2Body .wk55-save').click());await p.waitForTimeout(300);
console.log('수학 저장 버튼 → 저장 창 열림?',await p.evaluate(()=>document.getElementById('wonkiSlotModal').classList.contains('show')));
await p.evaluate(()=>{document.getElementById('wonkiSlotModal').classList.remove('show');document.querySelector('#dbzv2Body .wk55-up').click();});await p.waitForTimeout(300);
console.log('수학 윗단계 버튼 →',await p.evaluate(()=>document.querySelector('#dbzv2Body .hd h2').textContent));
await p.evaluate(()=>document.querySelector('#dbzv2 [data-a="close"]')?.click());await p.waitForTimeout(300);
// 영어 문제 화면 버튼
await p.evaluate(()=>window.WonkiEnglish.open());await p.waitForTimeout(300);
await p.evaluate(()=>{const e=document.querySelector('[data-eng-action="enter-game"]');if(e)e.click();});await p.waitForTimeout(300);await p.evaluate(()=>{if(!document.querySelector('[data-eng-semester="e3-1"]'))document.querySelector('#wkEnglishGame [data-eng-action="semesters"]')?.click();});await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('[data-eng-semester="e3-1"]').click());await p.waitForTimeout(300);
const c1=await p.$('#wkEnglishGame .we-card');if(c1&&!(await p.$('#wkEnglishGame .wk31-board'))){await p.evaluate(()=>document.querySelector('#wkEnglishGame .we-card').click());await p.waitForTimeout(300);}
await p.evaluate(()=>document.querySelector('#wkEnglishGame .wk31-op').click());await p.waitForTimeout(500);
console.log('영어 문제 화면 버튼',await p.$$eval('#wkEnglishGame .wk55-bar button',a=>a.map(x=>x.textContent).join(' | ')));
await p.screenshot({path:pre+'_eng.png'});
await p.evaluate(()=>document.querySelector('#wkEnglishGame .wk55-up').click());await p.waitForTimeout(300);
console.log('영어 윗단계 버튼 →',await p.evaluate(()=>document.querySelector('#wkEnglishGame .we-header h2').textContent));
await p.evaluate(()=>document.querySelector('#wkEnglishGame .wk31-op').click());await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelector('#wkEnglishGame .wk55-save').click());await p.waitForTimeout(300);
console.log('영어 저장 버튼 →',await p.evaluate(()=>document.querySelector('#wkEnglishGame .we-header h2').textContent));
console.log('오류',errs);await b.close();})();
