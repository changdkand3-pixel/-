// 71차 시험: 방문 기록 첫 요청이 느린 서버(25초)에서 두 번째 요청으로 빨리 받는지, 저장된 기록 먼저 보이기, 실패 시 다시 불러오기
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));let n=0,mode='slowfirst';
await p.route(/^https?:/,async r=>{const u=r.request().url();
 if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
 if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}
  let pay={success:true,items:[]};
  if(j.action==='admin_visit_log'){n++;const k=n;if(mode==='down'){await new Promise(z=>setTimeout(z,60000));}else if(k===1)await new Promise(z=>setTimeout(z,25000));pay={success:true,total30:3,members:[{time:new Date().toISOString(),nickname:'엄마',name:'노송희',source:'카카오톡',device:'휴대폰'}],sources:{'카카오톡':3},devices:{'휴대폰':3}};}
  return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(pay)}).catch(()=>{});}
 return r.abort();});
await p.addInitScript(()=>{localStorage.setItem('wk65_admin_device','1');const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2500);
const openMenu=()=>p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;window.WonkiParkEditor36.close();window.WonkiAdminLock36.unlock=async()=>true;document.getElementById('wonkiOwnerAnalytics').click();});
await openMenu();const t0=Date.now();
await p.waitForFunction(()=>/엄마/.test(document.getElementById('wk70Visits')?.textContent||''),null,{timeout:60000});
console.log('1) 첫 요청이 25초 걸리는 서버 →',Math.round((Date.now()-t0)/1000)+'초 만에 표시 | 요청 수',n,'|',await p.$eval('#wk70Visits .wk70-st',e=>e.textContent));
mode='down';await openMenu();await p.waitForTimeout(800);
console.log('2) 다시 열기(서버 멈춤) → 바로 보이는 것:',await p.$eval('#wk70Visits',e=>e.innerText.replace(/\s+/g,' ').slice(0,110)));
await p.waitForSelector('#wk70Visits [data-wk70r]',{timeout:70000});console.log('   실패 후:',await p.$eval('#wk70Visits .wk70-st',e=>e.textContent),'| 다시 불러오기 버튼 있음');
console.log('오류',errs);await b.close();})();
