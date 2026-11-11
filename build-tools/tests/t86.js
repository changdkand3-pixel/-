// 86차 시험: 예전 버전의 삭제 표시(deletedAt)가 남은 회원 → 목록에서 숨김, 동기화 때 서버에서도 지우고 다시 안 올림
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();
const M=(id,name,x)=>Object.assign({id,name,method:'방문',suspended:false,updatedAt:'2026-11-02T00:00:00.000Z'},x||{});
const DB={members:[M('nt60g','정윤서'),M('7on3o','엄재민'),M('bj12v','허윤',{suspended:true})],deleted:[]};const calls=[];
function handle(j){calls.push(j.action+(j.ids?'('+j.ids.join(',')+')':'')+(j.members?'('+j.members.map(m=>m.id).join(',')+')':''));
 if(j.action==='admin_list')return {success:true,members:DB.members.filter(m=>!DB.deleted.includes(m.id)),deletedIds:DB.deleted.slice()};
 if(j.action==='admin_member_delete'){j.ids.forEach(id=>{if(!DB.deleted.includes(id))DB.deleted.push(id);});DB.members=DB.members.filter(m=>!DB.deleted.includes(m.id));return {success:true};}
 if(j.action==='admin_save'){j.members.forEach(m=>{if(DB.deleted.includes(m.id))return;const i=DB.members.findIndex(x=>x.id===m.id);if(i>=0)DB.members[i]=m;else DB.members.push(m);});return {success:true};}
 if(j.action==='admin_friend_list')return {success:true,members:[]};
 return {success:true,items:[]};}
const local=[M('nt60g','정윤서'),M('8iyrq','정윤서',{deletedAt:'2026-11-03T20:14:55.248Z',updatedAt:'2026-11-03T20:14:55.248Z'}),M('7on3o','엄재민'),M('bj12v','허윤',{suspended:true})];
const ctx=await b.newContext();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route(/^https?:/,async r=>{const u=r.request().url();
 if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
 if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}
  return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(handle(j))});}
 return r.abort();});
await ctx.addInitScript('try{if(!sessionStorage.getItem("i")){sessionStorage.setItem("i",1);localStorage.setItem("wonkiLandMembers_v1",'+JSON.stringify(JSON.stringify(local))+');localStorage.setItem("wk65_admin_device","1");localStorage.setItem("wonkiLandGoogleClientId_v1","cid");}var h=btoa(JSON.stringify({alg:"none"})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem("wk64_admin_token",h+"."+pl+".x");}catch(_){}');
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2500);
console.log('1) 현재회원 표:',await p.$$eval('#memberRows tr td:nth-child(2)',a=>a.map(x=>x.textContent).join(',')));
await p.evaluate(()=>window.wonkiLandRunMemberSync(true));
console.log('2) 동기화 표시:',await p.evaluate(()=>document.getElementById('firebaseSyncButton')?.textContent),'| 요청',calls.filter(c=>/admin_(member_delete|save)/.test(c)).join(' '));
console.log('   이 기기:',await p.evaluate(()=>JSON.parse(localStorage.getItem('wonkiLandMembers_v1')).map(m=>m.name+'('+m.id+')').join(', ')),'| 서버:',DB.members.map(m=>m.name+'('+m.id+')').join(', '),'| 서버 삭제',DB.deleted.join(','));
console.log('오류',errs);await b.close();})();
