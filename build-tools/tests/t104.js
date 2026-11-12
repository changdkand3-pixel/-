// 104차 시험: 가짜 서버(public_config·admin_lock_check·admin_lock_set) — 새 브라우저에서 Client ID 안 묻기, 서버 비밀번호로 열기, 이 브라우저의 옛 비밀번호는 거절, 변경하면 서버에 저장
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),crypto=require('crypto');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();
const srv={clientId:'999-test.apps.googleusercontent.com',pw:'4821',calls:[]};
async function page(prep){const ctx=await b.newContext({viewport:{width:1200,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const dialogs=[];p.on('dialog',d=>{dialogs.push(d.type()+':'+d.message().slice(0,60));d.dismiss();});
 await p.route(/^https?:/,async r=>{const u=r.request().url();
  if(u.startsWith('https://script.google.com/')){let body={};try{body=JSON.parse(r.request().postData()||'{}');}catch(_){}srv.calls.push(body.action);let out={success:false,message:'x'};
   if(body.action==='public_config')out={success:true,clientId:srv.clientId,lockSet:!!srv.pw};
   else if(body.action==='admin_lock_check')out=srv.pw?{success:true,set:true,ok:body.password===srv.pw}:{success:true,set:false};
   else if(body.action==='admin_lock_set'){if(String(body.idToken).startsWith('wkadm.')){srv.pw=body.password;out={success:true};}else out={success:false,message:'구글 로그인이 필요합니다.'};}
   return r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify(out)});}
  if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
 if(prep)await p.addInitScript(prep);
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3500);await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});return {p,ctx,errs,dialogs};}
async function tryUnlock(p,pw){const pr=p.evaluate(()=>window.WonkiAdminLock36.unlock().then(v=>window.__u=v));await p.waitForSelector('#wonkiAdminLock36');const head=await p.textContent('#wonkiAdminLock36 h2');await p.fill('#wonkiAdminLock36 input[name=old]',pw).catch(async()=>{await p.fill('#wonkiAdminLock36 input[name=new]',pw);await p.fill('#wonkiAdminLock36 input[name=confirm]',pw);});await p.click('#wonkiAdminLock36 button[type=submit]');await p.waitForTimeout(800);
 const still=!!(await p.$('#wonkiAdminLock36'));const msg=still?await p.textContent('#wonkiAdminLock36 [role=status]'):'';if(still)await p.click('#wonkiAdminLock36 button[type=button]');await p.waitForTimeout(200);return {head,ok:!still&&await p.evaluate(()=>window.__u),msg};}
// A: 새 브라우저(저장된 것 없음)
let A=await page();
console.log('A) 새 브라우저: Client ID 저장됨',await A.p.evaluate(()=>localStorage.getItem('wonkiLandGoogleClientId_v1')),'| 서버 비밀번호 있음',await A.p.evaluate(()=>window.wk104LockSet));
console.log('   틀린 1111',JSON.stringify(await tryUnlock(A.p,'1111')));
console.log('   서버 비밀번호 4821',JSON.stringify(await tryUnlock(A.p,'4821')),'| 이 브라우저에도 저장',await A.p.evaluate(()=>window.WonkiAdminLock36.has()));
const cid=await A.p.evaluate(async()=>{await window.wk104Ready;return 'ok';});console.log('   대화창(Client ID 묻기 등)',JSON.stringify(A.dialogs),'| 오류',A.errs);
// B: 예전 비밀번호(1111)가 이 브라우저에 남은 경우
let B=await page(()=>{localStorage.setItem('wonkiLandGoogleClientId_v1','999-test.apps.googleusercontent.com');});
await B.p.evaluate(()=>window.WonkiAdminLock36.set('1111','1111'));
console.log('B) 옛 비밀번호 1111이 남은 브라우저: 1111',JSON.stringify(await tryUnlock(B.p,'1111')));
console.log('   4821',JSON.stringify(await tryUnlock(B.p,'4821')));
// C: 변경 → 서버 저장 (관리자 표가 이미 있는 경우)
let C=await page(()=>{const exp=Math.floor(Date.now()/1000)+3600;const mid=btoa(JSON.stringify({exp})).replace(/=+$/,'');localStorage.setItem('wk80_admin_token','wkadm.'+mid+'.'+'k'.repeat(64));});
const pr=C.p.evaluate(()=>window.WonkiAdminLock36.unlock(true).then(v=>window.__u=v));await C.p.waitForSelector('#wonkiAdminLock36');console.log('C) 변경 창 제목',await C.p.textContent('#wonkiAdminLock36 h2'),'|',await C.p.textContent('#wonkiAdminLock36 p'));
await C.p.fill('#wonkiAdminLock36 input[name=old]','4821');await C.p.fill('#wonkiAdminLock36 input[name=new]','7777');await C.p.fill('#wonkiAdminLock36 input[name=confirm]','7777');await C.p.click('#wonkiAdminLock36 button[type=submit]');await C.p.waitForTimeout(1500);
console.log('   변경 후 서버 비밀번호',srv.pw,'| 대화창',JSON.stringify(C.dialogs));
let D=await page();console.log('D) 다른 새 브라우저에서 7777',JSON.stringify(await tryUnlock(D.p,'7777')));
// 상상코칭 회원관리 비밀번호 칸도 서버 비밀번호로
await D.p.evaluate(()=>{document.getElementById('memberPasswordInput').value='7777';});
console.log('   서버 요청들',[...new Set(srv.calls)].join(','),'| 오류',D.errs);
await b.close();})();
