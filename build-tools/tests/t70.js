// 70차 시험: 방문 기록 보내기(카톡 방문자·회원·주인장 기기 제외), 관리자 메뉴 최근 방문 회원, 로그인 안내
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
const logs=[];
async function page(ctxOpt,init,arg){const ctx=await b.newContext(Object.assign({viewport:{width:390,height:800}},ctxOpt||{}));const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.route(/^https?:/,async r=>{const u=r.request().url();
  if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
  if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}
   let pay={success:true,items:[]};
   if(j.action==='visit_log'){logs.push(j);pay={success:true,logged:true};}
   if(j.action==='admin_visit_log')pay={success:true,total30:57,members:[{time:new Date(Date.now()-120000).toISOString(),nickname:'엄마',name:'노송희',source:'카카오톡',device:'휴대폰'},{time:new Date(Date.now()-3*3600e3).toISOString(),nickname:'홍쓰',name:'김홍서',source:'인스타그램',device:'휴대폰'},{time:new Date(Date.now()-26*3600e3).toISOString(),nickname:'서준마미',name:'서준맘',source:'직접 입력·즐겨찾기',device:'컴퓨터'}],sources:{'카카오톡':31,'인스타그램':14,'페이스북':5,'직접 입력·즐겨찾기':7},devices:{'휴대폰':49,'컴퓨터':8}};
   if(j.action==='general_member_progress_load')pay={success:true,progress:'',savedAt:''};
   return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(pay)});}
  return r.abort();});
 if(init)await p.addInitScript(init,arg);
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(4500);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});return p;}
const kakao='Mozilla/5.0 (Linux; Android 13; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 KAKAOTALK 10.4.0';
const A=await page({userAgent:kakao});
console.log('A) 카톡 방문자 →',logs.map(l=>l.source+'/'+l.device+'/토큰:'+(l.sessionToken?'있음':'없음')).join(', '));
await A.reload({waitUntil:'domcontentloaded'});await A.waitForTimeout(4000);console.log('   새로 고침 후 다시 보냈나?',logs.length>1?'예(문제)':'아니오');
console.log('   로그인 창 안내',await A.evaluate(()=>document.getElementById('wk70LoginNote')?.textContent),'| 가입 화면 안내',await A.evaluate(()=>!!document.getElementById('wk70JoinNote')));
logs.length=0;
const B=await page({},()=>{sessionStorage.setItem('wonkiLand_general_session_v1',JSON.stringify({token:'T1',member:{id:'m1',nickname:'철수'}}));sessionStorage.setItem('wk63_applied_m1','1');});
console.log('B) 회원 →',logs.map(l=>l.source+'/'+l.device+'/토큰:'+l.sessionToken).join(', '));
logs.length=0;
const C=await page({},()=>{localStorage.setItem('wk65_admin_device','1');const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');});
console.log('C) 주인장 기기 → 보낸 방문 기록',logs.length,'개');
await C.evaluate(()=>{window.WonkiAdminLock36.unlock=async()=>true;document.getElementById('wonkiOwnerAnalytics').click();});await C.waitForTimeout(1500);
console.log('   관리자 메뉴:',await C.$eval('#wk70Visits',e=>e.innerText.replace(/\s+/g,' ').slice(0,200)));
await (await C.$('#wk70Visits')).screenshot({path:out+'_visits.png'});
await A.evaluate(()=>document.getElementById('wonkiGeneralAccountButton').click());await A.waitForTimeout(400);await A.screenshot({path:out+'_login.png'});
console.log('오류',[...A.errs,...B.errs,...C.errs]);await b.close();})();
