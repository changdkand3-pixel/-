// 73차 시험: 관리자 로그인 창이 구경하기 화면 위에 보이는지, 업데이트 안내가 방문자/주인장 기기에서 다르게 보이는지
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
async function page(init){const ctx=await b.newContext({viewport:{width:390,height:800}});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.route(/^https?:/,async r=>{const u=r.request().url();
  if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
  if(/accounts\.google\.com\/gsi/.test(u))return r.fulfill({status:200,contentType:'application/javascript',body:'window.google={accounts:{id:{initialize:function(){},renderButton:function(m){m.innerHTML="<button id=gbtn>Google로 로그인</button>";}}}};'});
  if(/script\.google\.com/.test(u)&&r.request().method()==='POST')return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({success:true,items:[],members:[]})});
  return r.abort();});
 await p.addInitScript(init);
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2500);return p;}
const items=p=>p.$$eval('#wkUpdatePoster .wkp-sec li',a=>a.map(x=>x.textContent).join(' | '));
// 방문자
const V=await page(()=>{});
console.log('A) 방문자 73차 안내:',await items(V));
await V.evaluate(()=>{document.querySelector('#wkUpdatePoster [data-wkp="prev"]').click();});console.log('   72차:',await items(V));
await V.evaluate(()=>{document.querySelector('#wkUpdatePoster [data-wkp="prev"]').click();document.querySelector('#wkUpdatePoster [data-wkp="prev"]').click();});console.log('   70차:',await items(V));
await V.evaluate(()=>{for(let i=0;i<4;i++)document.querySelector('#wkUpdatePoster [data-wkp="prev"]').click();});console.log('   66차:',(await items(V)).slice(0,80));
// 주인장 기기
const O=await page(()=>{localStorage.setItem('wk65_admin_device','1');localStorage.setItem('wonkiLandGoogleClientId_v1','test-client');});
console.log('B) 주인장 73차 안내:',await items(O),'|',await O.$eval('#wkUpdatePoster .wkp-date',e=>e.textContent));
await O.screenshot({path:out+'_poster_owner.png'});
// 로그인 창이 구경하기 화면 위에 보이는지 (저장된 관리자 토큰 없음)
await O.evaluate(()=>{document.getElementById('wkUpdatePoster').hidden=true;document.getElementById('wk64Viewer_btn').click();});
await O.waitForSelector('#wk73GoogleLogin',{timeout:10000}).catch(()=>{});await O.waitForTimeout(500);
console.log('C) 구경하기 상태:',await O.$eval('#wk64Viewer .wk72-st',e=>e.textContent).catch(()=>'-'),'| 로그인 창 보임(맨 위)?',await O.evaluate(()=>{const g=document.getElementById('wk73GoogleLogin');if(!g)return 'login창 없음';const t=document.elementFromPoint(195,400);return g.contains(t);}));
await O.screenshot({path:out+'_login.png'});
console.log('오류',[...V.errs,...O.errs]);await b.close();})();
