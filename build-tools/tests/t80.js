// 80차 시험: 관리자 로그인 → 6시간 표 교환·기억, 주인장 공원 기기끼리 공유(불러오기·자동 저장·서로 다를 때 고르기)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();
const B=(n,id,x)=>({id,type:'wheel',name:n,x:x||.4,y:.6,rotation:0,scale:1});
let server={park:JSON.stringify({version:1,revision:0,courses:[],buildings:[B('주인장 관람차','w')]}),savedAt:'2026-11-12T01:00:00.000Z'};let saves=0,sessions=0;
const exp6=Math.floor(Date.now()/1000)+21600,SESSION='wkadm.'+Buffer.from(JSON.stringify({exp:exp6,k:'wkadm'})).toString('base64url')+'.'+'a'.repeat(64);
async function device(name,init,arg){const ctx=await b.newContext({viewport:{width:900,height:900}});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.dlg=[];p.answer=true;
 p.on('dialog',d=>{p.dlg.push(d.message().replace(/\n+/g,' / '));d.type()==='confirm'?(p.answer?d.accept():d.dismiss()):d.accept();});
 await ctx.route(/^https?:/,async r=>{const u=r.request().url();
  if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
  if(/accounts\.google\.com\/gsi/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'window.google={accounts:{id:{initialize:function(o){window.__cb=o.callback;},renderButton:function(m){var b=document.createElement("button");b.id="gbtn";b.textContent="Google";b.onclick=function(){window.__cb({credential:"h."+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}))+".s"});};m.appendChild(b);}}}};'});
  if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}let pay={success:true,items:[]};
   if(j.action==='admin_session_start'){sessions++;pay={success:true,token:SESSION,exp:exp6};}
   if(j.action==='owner_park_load')pay={success:true,park:server.park,savedAt:server.savedAt};
   if(j.action==='owner_park_save'){if(j.idToken!==SESSION)pay={success:false,message:'관리자 로그인이 만료되었습니다. 다시 로그인해 주세요.'};else{saves++;server={park:j.park,savedAt:new Date().toISOString()};pay={success:true,savedAt:server.savedAt};}}
   return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(pay)});}
  return r.abort();});
 await ctx.addInitScript(init,arg);
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(4000);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});p.name=name;return p;}
const local=p=>p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('wonkiParkDraft37_guest')).state.buildings.map(x=>x.name).join(',');}catch(_){return '(없음)';}});
const srv=()=>JSON.parse(server.park).buildings.map(x=>x.name).join(',');
const btn=p=>p.$eval('#wk66OwnerUpload',e=>e.textContent);
// 휴대폰: 주인장 기기, 건물 없음 → 서버 것을 불러옴
const P=await device('휴대폰',()=>{try{if(!sessionStorage.getItem('i')){sessionStorage.setItem('i',1);localStorage.setItem('wk65_admin_device','1');localStorage.setItem('wonkiLandGoogleClientId_v1','cid');}}catch(_){}});
console.log('1) 휴대폰 열기 → 이 기기 건물:',await local(P),'| 버튼:',await btn(P),'| 알림',P.dlg);
// 관리자 로그인 (구글 → 6시간 표)
const lg=P.evaluate(()=>window.wonkiLandAdminLogin());await P.waitForSelector('#gbtn',{timeout:10000});await P.click('#gbtn');const tok=await lg;
console.log('2) 로그인 → 받은 표:',tok.slice(0,6),'| 기기에 기억(6시간):',await P.evaluate(()=>{const t=localStorage.getItem('wk80_admin_token');return t?Math.round((JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).exp*1000-Date.now())/3600e3)+'시간':'없음';}),'| 교환',sessions);
// 휴대폰에서 건물 하나 더 → 자동 저장
await P.evaluate(()=>{const d=JSON.parse(localStorage.getItem('wonkiParkDraft37_guest'));d.state.buildings.push({id:'c',type:'wk50_carousel_3',name:'휴대폰 회전목마',x:.6,y:.6,rotation:0,scale:1});localStorage.setItem('wonkiParkDraft37_guest',JSON.stringify(d));});
await P.waitForTimeout(6500);console.log('3) 휴대폰에서 추가 → 서버:',srv(),'| 저장 횟수',saves,'| 버튼:',await btn(P));
// 새 창(탭)을 열어도 로그인 기억?
const P2=await P.context().newPage();await P2.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await P2.waitForTimeout(2500);
console.log('4) 새 창에서 관리자 표:',await P2.evaluate(()=>(sessionStorage.getItem('wk64_admin_token')||'').slice(0,6)),'| 로그인 다시 안 물음:',(await P2.evaluate(()=>window.wonkiLandAdminLogin()).catch(e=>'오류 '+e.message)).slice(0,6));await P2.close();
// 컴퓨터: 예전에 회전찻잔만 있던 주인장 기기
const Q=await device('컴퓨터',()=>{try{if(!sessionStorage.getItem('i')){sessionStorage.setItem('i',1);localStorage.setItem('wk65_admin_device','1');localStorage.setItem('wonkiParkDraft37_guest',JSON.stringify({state:{version:1,courses:[],buildings:[{id:'t',type:'park38_0_7',name:'회전찻잔',x:.75,y:1,rotation:0,scale:1}]}}));}}catch(_){}});
console.log('5) 컴퓨터 열기 → 물어본 내용:',(Q.dlg[0]||'(없음)').slice(0,150),'…');
console.log('   확인(서버 것으로) → 이 기기 건물:',await local(Q),'| 서버:',srv());
// 휴대폰에서 또 바꾸면 컴퓨터가 불러오는지 (컴퓨터는 안 고친 상태)
await P.evaluate(()=>{const d=JSON.parse(localStorage.getItem('wonkiParkDraft37_guest'));d.state.buildings=d.state.buildings.filter(x=>x.id!=='w');localStorage.setItem('wonkiParkDraft37_guest',JSON.stringify(d));});await P.waitForTimeout(6500);
console.log('6) 휴대폰에서 관람차 삭제 → 서버:',srv());
await Q.evaluate(()=>window.WonkiParkRoles66.ownerSync());await Q.waitForTimeout(1500);console.log('   컴퓨터 다시 보기 → 이 기기:',await local(Q),'| 알림 수',Q.dlg.length);
// 방문자에게도 보이는지
const V=await device('방문자',()=>{});console.log('7) 방문자 지도 건물:',await V.$$eval('#wonkiCustomBuildings36 .wk-built36 span:not(.wk50-x)',a=>a.map(x=>x.textContent).join(',')));
console.log('오류',[...P.errs,...Q.errs,...V.errs]);await b.close();})();
