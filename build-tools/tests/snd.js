const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));const dlg=[];p.on('dialog',d=>{dlg.push(d.message());d.dismiss();});
await p.route(/^https?:/,r=>r.abort());
await p.addInitScript(()=>{window.__osc=0;const patch=C=>{if(!C)return;const o=C.prototype.createOscillator;C.prototype.createOscillator=function(){window.__osc++;return o.apply(this,arguments)};const bs=C.prototype.createBufferSource;C.prototype.createBufferSource=function(){window.__osc++;return bs.apply(this,arguments)};};patch(window.AudioContext);patch(window.webkitAudioContext);
 try{localStorage.setItem('wonkiParkDraft37_guest',JSON.stringify({baseRevision:0,state:{version:1,revision:0,courses:[],buildings:[{id:'t1',type:'wheel',name:'관람차',x:.5,y:.5,rotation:0,scale:1,courseId:''}]},deleted:[]}));}catch(e){}});
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(1200);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
const count=async(label,fn)=>{const a=await p.evaluate(()=>window.__osc);await fn();await p.waitForTimeout(500);const c=await p.evaluate(()=>window.__osc);console.log(label,c-a);};
// warm up audio with a normal course click to prove sounds work at all

await count('지도 확대',()=>p.evaluate(()=>document.querySelector('[data-map-action="in"]').click()));
await count('지도 축소',()=>p.evaluate(()=>document.querySelector('[data-map-action="out"]').click()));
await count('건물 누르기',()=>p.evaluate(()=>document.querySelector('.wk-built36').click()));
await count('편집 도구 확대',()=>p.evaluate(()=>document.querySelector('#wk50Tools button[title="건물 확대"]').click()));
await count('건물 짓기 열기',()=>p.evaluate(()=>document.querySelector('[data-park-editor36="build"]').click()));
await count('건물 그림 누르기',()=>p.evaluate(()=>document.querySelector('.wk50-pick').click()));
await count('저장 후 나가기',()=>p.evaluate(()=>document.querySelector('.wk50-saveexit').click()));await count('기준: 랜덤 버튼(소리 나야 함)',()=>p.evaluate(()=>document.getElementById('randomBtn').click()));await p.waitForTimeout(1000);
await p.evaluate(()=>document.getElementById('wonkiWholeSyncButton').click());await p.waitForTimeout(47000);
console.log('dialogs',dlg.length,'toast',await p.evaluate(()=>document.getElementById('wk51SyncToast')?.textContent||null));
console.log('errors',errs);await b.close();})();
