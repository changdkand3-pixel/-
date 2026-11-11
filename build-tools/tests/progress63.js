// 63차 일반회원 진행 기록 시험: 가짜 서버로 첫 로그인 저장 → 다른 기기 복원 → 로그아웃 복구, 그리고 서버 미지원 안내
const {chromium}=require('playwright');
(async()=>{const file=process.argv[2];const b=await chromium.launch();
const DB={};let supported=true;const calls=[];
async function page(ctx){const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.route(/^https?:/,async r=>{const req=r.request();if(/script\.google\.com/.test(req.url())&&req.method()==='POST'){
  const body=new URLSearchParams(req.postData()||'');const j=JSON.parse(body.get('payload')||'{}');calls.push(j.action);let pay;
  const id=j.sessionToken==='T1'?'m1':j.sessionToken==='T2'?'m2':'';
  if(/^general_member_progress/.test(j.action)&&!supported)pay={success:false,message:'지원하지 않는 요청입니다: '+j.action};
  else if(j.action==='general_member_progress_load')pay={success:true,progress:DB[id]?.p||'',savedAt:DB[id]?.t||''};
  else if(j.action==='general_member_progress_save'){DB[id]={p:j.progress,t:new Date().toISOString()};pay={success:true,savedAt:DB[id].t};}
  else pay={success:true,items:[]};
  return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<script>top.postMessage({type:"wonki-cloud-response",nonce:'+JSON.stringify(j._wonkiNonce)+',payload:'+JSON.stringify(pay)+'},"*")<\/script>'});}
  return r.abort();});
 p.errs=errs;return p;}
async function open(p){await p.goto('file://'+file,{waitUntil:'load',timeout:120000});await p.waitForTimeout(800);await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});}
const login=(p,tok,id,nick)=>p.evaluate(([tok,id,nick])=>{sessionStorage.setItem('wonkiLand_general_session_v1',JSON.stringify({token:tok,member:{id,nickname:nick}}));window.dispatchEvent(new Event('wonki-member-changed37'));},[tok,id,nick]);
const logout=p=>p.evaluate(()=>{sessionStorage.removeItem('wonkiLand_general_session_v1');window.dispatchEvent(new Event('wonki-member-changed37'));});
const math=p=>p.evaluate(()=>localStorage.getItem('wonki_dbz_math_v2'));
const park=(p,id)=>p.evaluate(id=>localStorage.getItem('wonkiParkDraft37_'+id),id);
// 기기 A: 손님 기록이 있는 상태에서 철수 첫 로그인 → 계정에 저장
const A=await b.newContext();const pa=await page(A);await pa.addInitScript(()=>{if(!localStorage.getItem('wonki_dbz_math_v2'))localStorage.setItem('wonki_dbz_math_v2','{"who":"A손님"}');});await open(pa);
await login(pa,'T1','m1','철수');await pa.waitForTimeout(1500);
console.log('1) A 첫 로그인 → 서버 저장됨?',!!DB.m1,'| 저장된 수학',DB.m1&&JSON.parse(DB.m1.p).keys.wonki_dbz_math_v2);
// 철수가 A에서 공원 건물을 만들고 저장
await pa.evaluate(()=>localStorage.setItem('wonkiParkDraft37_m1','{"state":{"buildings":["철수집"]}}'));await pa.evaluate(()=>window.WonkiMemberProgress.upload());await pa.waitForTimeout(500);
console.log('2) A 건물 저장 → 서버 건물',DB.m1&&JSON.parse(DB.m1.p).keys.wonkiParkDraft37_m1);
// 기기 B: 다른 손님 기록, 철수 로그인 → 철수 기록 복원
const B=await b.newContext();const pb=await page(B);await pb.addInitScript(()=>{if(!sessionStorage.getItem('b_init')){sessionStorage.setItem('b_init','1');localStorage.setItem('wonki_dbz_math_v2','{"who":"B손님"}');}});await open(pb);
await login(pb,'T1','m1','철수');await pb.waitForTimeout(2500);
console.log('3) B 로그인 후 수학',await math(pb),'| 건물',await park(pb,'m1'));
// B에서 로그아웃 → B손님 기록으로 돌아감
await logout(pb);await pb.waitForTimeout(2500);
console.log('4) B 로그아웃 후 수학',await math(pb),'| 철수 기록 남아 있음(서버)',!!DB.m1);
// B에서 영희 로그인(새 회원) → 영희는 B손님 기록으로 시작, 철수 것과 섞이지 않음
await login(pb,'T2','m2','영희');await pb.waitForTimeout(1500);
console.log('5) 영희 첫 로그인 저장 수학',DB.m2&&JSON.parse(DB.m2.p).keys.wonki_dbz_math_v2,'| 철수 건물이 영희 쪽에?',!!(DB.m2&&JSON.parse(DB.m2.p).keys.wonkiParkDraft37_m1));
// 서버가 아직 업데이트 안 된 경우
supported=false;const C=await b.newContext();const pc=await page(C);await open(pc);await login(pc,'T1','m1','철수');await pc.waitForTimeout(1500);
console.log('6) 서버 미지원 안내',await pc.evaluate(()=>document.getElementById('wk63Note')?.textContent),'| 수학 그대로',await math(pc));
console.log('오류',[...pa.errs,...pb.errs,...pc.errs]);await b.close();})();
