// 66차 시험: 방문자(주인장 공원 보기만) · 일반회원(자기 공원만) · 주인장 기기(올리기) · 가입 화면
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],outDir=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
const ownerPark={version:1,revision:0,courses:[],buildings:[{id:'o1',type:'wheel',name:'주인장 관람차',x:.3,y:.5,rotation:0,scale:1.2},{id:'o2',type:'wk50_carousel_3',name:'주인장 회전목마',x:.6,y:.55,rotation:0,scale:1}]};
let saved=null;
async function page(init,arg){const ctx=await b.newContext({viewport:{width:1200,height:900}});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.dialogs=[];p.on('dialog',d=>{p.dialogs.push(d.message().slice(0,40));d.accept();});
 await p.route(/^https?:/,async r=>{const u=r.request().url();
  if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
  if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const j=JSON.parse(new URLSearchParams(r.request().postData()||'').get('payload')||'{}');let pay={success:true,items:[]};
   if(j.action==='owner_park_load')pay={success:true,park:JSON.stringify(ownerPark),savedAt:new Date().toISOString()};
   if(j.action==='owner_park_save'){saved=j;pay={success:true,savedAt:new Date().toISOString()};}
   if(j.action==='general_member_progress_load')pay={success:true,progress:'',savedAt:''};
   return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<script>top.postMessage({type:"wonki-cloud-response",nonce:'+JSON.stringify(j._wonkiNonce)+',payload:'+JSON.stringify(pay)+'},"*")<\/script>'});}
  return r.abort();});
 await p.addInitScript(init,arg);
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(3500);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});return p;}
const names=p=>p.$$eval('#wonkiCustomBuildings36 .wk-built36 span:not(.wk50-x)',a=>a.map(x=>x.textContent).join(','));
const shown=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?getComputedStyle(e).display!=='none':null;},sel);
const guest=JSON.stringify({state:{version:1,courses:[],buildings:[{id:'g1',type:'wheel',name:'손님 건물',x:.5,y:.5,rotation:0,scale:1}]}});
// A 방문자
const A=await page(g=>{localStorage.setItem('wonkiParkDraft37_guest',g);},guest);
console.log('A) 방문자 모드',await A.evaluate(()=>WonkiParkRoles66.mode()),'| 지도 건물',await names(A));
console.log('   건물짓기 보임',await shown(A,'[data-park-editor36="build"]'),'| 공유하기 보임',await shown(A,'#wk64ShowOff'),'| 가입버튼 보임',await shown(A,'#wk66Join'),'| 둘러보기 보임',await shown(A,'#wk66Owner'),'| 구경하기',await shown(A,'#wk64Viewer_btn'));
console.log('   건물 클릭 가능?',await A.evaluate(()=>{const e=document.querySelector('.wk-built36');return e?getComputedStyle(e).pointerEvents:null;}));
await A.evaluate(()=>WonkiParkEditor36.open('build'));await A.waitForTimeout(300);console.log('   건물짓기 열기 →',await A.evaluate(()=>!!document.getElementById('wk66Ask')),'편집기 열림?',await A.evaluate(()=>!!document.getElementById('wonkiParkEditor36')));
await (await A.$('#wk66Ask section')).screenshot({path:outDir+'/ask.png'});
await A.click('#wk66Ask .owner');await A.waitForTimeout(500);console.log('   주인장 공원 둘러보기 그림',await A.$$eval('#wk64Viewer svg.wk64-map > g',a=>a.length),await A.$eval('#wk64Viewer .wk36-status',e=>e.textContent));
await (await A.$('#wk64Viewer .wk36-card')).screenshot({path:outDir+'/owner.png'});
await A.evaluate(()=>document.getElementById('wk64Viewer').remove());
await A.evaluate(()=>document.getElementById('wk66Join').click());await A.evaluate(()=>document.querySelector('#wk66Ask .join').click());await A.waitForTimeout(600);console.log('   가입 화면 열림',await shown(A,'#wonkiFriendRegisterModal'),'| 제목',await A.$eval('#wonkiFriendRegisterModal .member-title',e=>e.textContent));
await A.screenshot({path:outDir+'/join.png'});
// B 일반회원
const B=await page(g=>{localStorage.setItem('wonkiParkDraft37_guest',g);localStorage.setItem('wonkiParkDraft37_m1',JSON.stringify({state:{version:1,courses:[],buildings:[{id:'m',type:'wheel',name:'철수 건물',x:.4,y:.4,rotation:0,scale:1}]}}));sessionStorage.setItem('wonkiLand_general_session_v1',JSON.stringify({token:'T1',member:{id:'m1',nickname:'철수'}}));sessionStorage.setItem('wk63_applied_m1','1');},guest);
console.log('B) 회원 모드',await B.evaluate(()=>WonkiParkRoles66.mode()),'| 지도 건물',await names(B),'| 건물짓기 보임',await shown(B,'[data-park-editor36="build"]'),'| 공유하기 보임',await shown(B,'#wk64ShowOff'),'| 가입버튼',await shown(B,'#wk66Join'),'| 둘러보기',await shown(B,'#wk66Owner'));
await B.evaluate(()=>WonkiParkEditor36.open('build'));await B.waitForTimeout(300);console.log('   편집기 열림?',await B.evaluate(()=>!!document.getElementById('wonkiParkEditor36')));
// C 주인장 기기
const C=await page(g=>{localStorage.setItem('wonkiParkDraft37_guest',g);localStorage.setItem('wk65_admin_device','1');const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');},guest);
console.log('C) 주인장 모드',await C.evaluate(()=>WonkiParkRoles66.mode()),'| 지도 건물',await names(C),'| 올리기 버튼',await shown(C,'#wk66OwnerUpload'));
await C.evaluate(()=>document.getElementById('wk66OwnerUpload').click());await C.waitForTimeout(1500);console.log('   올린 자료 건물',saved&&JSON.parse(saved.park).buildings.map(x=>x.name).join(','),'| 토큰',!!(saved&&saved.idToken));
console.log('오류',[...A.errs,...B.errs,...C.errs]);await b.close();})();
