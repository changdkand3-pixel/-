// 84차 시험: 휴회 이동 → 동기화해도 휴회 그대로, 서버에도 반영
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();
const M=(id,name)=>({id,name,method:'방문',suspended:false,updatedAt:'2026-11-01T00:00:00.000Z'});
const DB={members:[M('a1','엄재민'),M('a2','정윤서'),M('a3','김홍서')]};
function handle(j){
 if(j.action==='admin_list')return {success:true,members:JSON.parse(JSON.stringify(DB.members)),deletedIds:[]};
 if(j.action==='admin_save'){j.members.forEach(m=>{const i=DB.members.findIndex(x=>x.id===m.id);if(i>=0)DB.members[i]=m;else DB.members.push(m);});return {success:true};}
 if(j.action==='admin_friend_list')return {success:true,members:[]};
 return {success:true,items:[]};}
const ctx=await b.newContext();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await ctx.route(/^https?:/,async r=>{const u=r.request().url();
 if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
 if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}
  return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(handle(j))});}
 return r.abort();});
await ctx.addInitScript('try{if(!sessionStorage.getItem("i")){sessionStorage.setItem("i",1);localStorage.setItem("wonkiLandMembers_v1",'+JSON.stringify(JSON.stringify(DB.members))+');localStorage.setItem("wk65_admin_device","1");localStorage.setItem("wonkiLandGoogleClientId_v1","cid");}var h=btoa(JSON.stringify({alg:"none"})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem("wk64_admin_token",h+"."+pl+".x");}catch(_){}');
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2500);
const view=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('wonkiLandMembers_v1')).map(m=>m.name+(m.suspended?'(휴회)':'')).join(', '));
await p.evaluate(()=>document.querySelector('#memberRows [data-suspend="a2"]').click());
console.log('1) 정윤서 휴회 이동 →',await view(),'| 현재회원 표:',await p.$$eval('#memberRows tr td:nth-child(2)',a=>a.map(x=>x.textContent).join(',')),'| 안내:',await p.evaluate(()=>document.getElementById('memberSaveStatus')?.textContent));
await p.evaluate(()=>window.wonkiLandRunMemberSync(true));
console.log('2) 동기화 뒤 이 기기:',await view(),'| 서버:',DB.members.map(m=>m.name+(m.suspended?'(휴회)':'')).join(', '));
await p.evaluate(()=>{document.getElementById('suspendedMembersTab')?.click();});await p.waitForTimeout(300);
console.log('3) 휴회회원 탭:',await p.$$eval('#memberRows tr td:nth-child(2)',a=>a.map(x=>x.textContent).join(',')));
await p.evaluate(()=>document.querySelector('#memberRows [data-resume="a2"]')?.click());await p.evaluate(()=>window.wonkiLandRunMemberSync(true));
console.log('4) 재원 복귀 + 동기화 →',await view(),'| 서버:',DB.members.map(m=>m.name+(m.suspended?'(휴회)':'')).join(', '));
console.log('오류',errs);await b.close();})();
