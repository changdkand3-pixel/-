// 83차 시험: 상상코칭 회원 삭제 → 동기화해도 안 돌아옴, 다른 기기에 남은 회원도 다시 안 올라가고 그 기기에서도 빠짐
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();
const M=(id,name)=>({id,name,method:'방문',updatedAt:'2026-11-01T00:00:00.000Z'});
const DB={members:[M('a1','엄재민'),M('a2','정윤서'),M('a3','김..'),M('a4','정윤서')],deleted:[]};const calls=[];
function handle(j){calls.push(j.action);
 if(j.action==='admin_list')return {success:true,members:DB.members.filter(m=>!DB.deleted.includes(m.id)),deletedIds:DB.deleted.slice()};
 if(j.action==='admin_member_delete'){j.ids.forEach(id=>{if(!DB.deleted.includes(id))DB.deleted.push(id);});DB.members=DB.members.filter(m=>!DB.deleted.includes(m.id));return {success:true,deleted:j.ids.length};}
 if(j.action==='admin_save'){let skip=0;j.members.forEach(m=>{if(DB.deleted.includes(m.id)){skip++;return;}const i=DB.members.findIndex(x=>x.id===m.id);if(i>=0)DB.members[i]=m;else DB.members.push(m);});return {success:true,skippedDeleted:skip};}
 if(j.action==='admin_friend_list')return {success:true,members:[]};
 return {success:true,items:[]};}
async function device(init){const ctx=await b.newContext();const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('dialog',d=>d.accept());
 await ctx.route(/^https?:/,async r=>{const u=r.request().url();
  if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
  if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}
   return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(handle(j))});}
  return r.abort();});
 await ctx.addInitScript(init);
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2500);return p;}
const setup=list=>`try{if(!sessionStorage.getItem('i')){sessionStorage.setItem('i',1);localStorage.setItem('wonkiLandMembers_v1',${JSON.stringify(JSON.stringify(list))});localStorage.setItem('wk65_admin_device','1');localStorage.setItem('wonkiLandGoogleClientId_v1','cid');}const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');}catch(_){}`;
const localNames=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('wonkiLandMembers_v1')||'[]').map(m=>m.name+'('+m.id+')').join(', '));
const serverNames=()=>DB.members.map(m=>m.name+'('+m.id+')').join(', ');
const all=[M('a1','엄재민'),M('a2','정윤서'),M('a3','김..'),M('a4','정윤서')];
const A=await device(setup(all));
await A.evaluate(()=>{document.querySelector('#memberRows [data-delete="a3"]').click();document.querySelector('#memberRows [data-delete="a4"]').click();});
console.log('1) 컴퓨터에서 김..(a3)·정윤서(a4) 삭제 → 이 기기:',await localNames(A),'| 삭제 기록',await A.evaluate(()=>localStorage.getItem('wk83_deleted_members')?JSON.parse(localStorage.getItem('wk83_deleted_members')).map(x=>x.id).join(','):'없음'));
console.log('   동기화 결과:',await A.evaluate(()=>window.wonkiLandRunMemberSync(true)),'| 요청',calls.join(','));
console.log('   동기화 뒤 이 기기:',await localNames(A),'| 서버:',serverNames(),'| 서버 삭제 목록',DB.deleted.join(','));
calls.length=0;
const B=await device(setup(all));
console.log('2) 휴대폰(아직 4명) 동기화:',await B.evaluate(()=>window.wonkiLandRunMemberSync(true)),'| 요청',calls.join(','));
console.log('   휴대폰:',await localNames(B),'| 서버:',serverNames());
await A.evaluate(()=>window.wonkiLandRunMemberSync(true));console.log('3) 컴퓨터 다시 동기화 → 이 기기:',await localNames(A));
console.log('오류',[...A.errs,...B.errs]);await b.close();})();
