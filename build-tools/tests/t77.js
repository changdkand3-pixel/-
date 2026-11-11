// 77차 시험: 들어온 경로 기록(네이버 블로그 / 카톡 + 추적 링크), 공유 버튼 링크, 관리자 자세한 통계 창·추적 링크 만들기
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();const logs=[];
const P={total:57,uniq:41,fresh:29,back:12,members:9,sources:{'카카오톡':24,'추적 링크':11,'직접 입력·즐겨찾기':9,'네이버':7,'인스타그램':6},details:{'카카오톡 › 카톡 앱에서 열림':24,'추적 링크 › 성당단톡방 (카카오톡)':8,'추적 링크 › 인스타프로필 (인스타그램)':3,'네이버 › 네이버 블로그':5,'네이버 › 네이버 검색':2,'인스타그램 › 인스타 앱에서 열림':6},tags:{'성당단톡방':8,'인스타프로필':3},devices:{'휴대폰':49,'컴퓨터':8},browsers:{'카카오톡 앱':32,'인스타그램 앱':9,'삼성 인터넷':7,'크롬':6,'사파리':3},os:{'안드로이드':38,'아이폰·아이패드':11,'윈도우':8},hours:[1,0,0,0,0,0,1,2,3,2,1,2,4,3,2,1,3,5,6,7,8,4,2,1],days:{}};
for(let i=0;i<7;i++){P.days[new Date(Date.now()+9*3600e3-i*86400e3).toISOString().slice(0,10)]=[12,9,7,8,6,10,5][i];}
async function page(opt,goto,init){const ctx=await b.newContext(Object.assign({viewport:{width:390,height:820}},opt));const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.route(/^https?:/,async r=>{const u=r.request().url();
  if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
  if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}
   let pay={success:true,items:[]};if(j.action==='visit_log'){logs.push(j);pay={success:true,logged:true};}
   if(j.action==='admin_visit_log')pay={success:true,members:[{time:new Date(Date.now()-600e3).toISOString(),nickname:'엄마',name:'노송희',source:'추적 링크',detail:'성당단톡방 (카카오톡)',device:'휴대폰',browser:'카카오톡 앱'}],sources:P.sources,devices:P.devices,total30:57,periods:{d1:Object.assign({},P,{total:7}),d7:P,d30:P}};
   return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(pay)});}
  return r.abort();});
 if(init)await p.addInitScript(init);
 await p.goto('https://wonki.test/'+path.basename(file)+(goto.q||''),{waitUntil:'domcontentloaded',timeout:90000,referer:goto.ref});await p.waitForTimeout(4500);return p;}
const A=await page({userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36'},{ref:'https://m.blog.naver.com/someone/22334455'});
console.log('A) 네이버 블로그에서 삼성 인터넷 →',JSON.stringify(logs.map(l=>[l.source,l.detail,l.device,l.browser,l.os])));logs.length=0;
const B=await page({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.8.0'},{q:'?src=%EC%84%B1%EB%8B%B9%EB%8B%A8%ED%86%A1%EB%B0%A9'});
console.log('B) 카톡 + 추적 링크(성당단톡방) →',JSON.stringify(logs.map(l=>[l.source,l.detail,l.device,l.browser,l.os])));logs.length=0;
console.log('C) 공유 버튼 링크:',await B.evaluate(()=>{const s=[...document.scripts].map(x=>x.textContent).find(t=>t.includes('wkDirectShare38'));return (s.match(/const URL='([^']+)'/)||[])[1];}));
const O=await page({viewport:{width:820,height:900}},{},()=>{localStorage.setItem('wk65_admin_device','1');const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');});
await O.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;window.WonkiAdminLock36.unlock=async()=>true;document.getElementById('wonkiOwnerAnalytics').click();});
await O.waitForFunction(()=>/엄마/.test(document.getElementById('wk70Visits')?.textContent||''),null,{timeout:20000});
await O.evaluate(()=>document.querySelector('#wk70Visits [data-wk77more]').click());await O.waitForTimeout(400);
console.log('D) 자세히 보기:',await O.$eval('#wk77Detail',e=>e.innerText.replace(/\s+/g,' ').slice(0,260)));
await O.screenshot({path:out+'_detail.png',fullPage:false});
await (await O.$('#wk77Detail .wk36-card')).screenshot({path:out+'_detail_card.png'});
await O.evaluate(()=>document.querySelector('#wk77Detail [data-per="d1"]').click());console.log('   오늘 탭:',await O.$eval('#wk77Detail h2',e=>e.textContent));
await O.evaluate(()=>document.querySelector('#wk77Detail [data-link]').click());await O.fill('#wk77Detail input','성당 단톡방');
console.log('E) 추적 링크:',await O.$eval('#wk77Detail code',e=>e.textContent));
await (await O.$('#wk77Detail .wk36-card')).screenshot({path:out+'_link.png'});
await O.keyboard.press('Escape');console.log('   Esc 닫힘?',!(await O.$('#wk77Detail')),'| 관리자 메뉴 남아 있음?',!!(await O.$('#wonkiParkEditor36')));
console.log('오류',[...A.errs,...B.errs,...O.errs]);await b.close();})();
