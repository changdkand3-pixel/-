// 72차 시험: 회원 공원 목록이 느린 서버(첫 요청 25초)에서 한 번 클릭으로 명단→공원 기록 순서로 보이는지, 두 번째 열 때 지난 자료 먼저
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));let n=0,slowAll=false;const calls=[];
const park={state:{buildings:[{id:'a',type:'wheel',name:'엄마 관람차',x:.5,y:.5,rotation:0,scale:1.2}]}};
await p.route(/^https?:/,async r=>{const u=r.request().url();
 if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
 if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}calls.push(j.action);
  let pay={success:true,items:[]};
  if(j.action==='admin_friend_list'){await new Promise(z=>setTimeout(z,1500));pay={success:true,members:[{id:'f1',nickname:'엄마',name:'노송희'},{id:'f2',nickname:'홍쓰',name:'김홍서'}]};}
  if(j.action==='admin_park_list'){n++;if(slowAll||n===1)await new Promise(z=>setTimeout(z,25000));else await new Promise(z=>setTimeout(z,3000));pay={success:true,members:[{id:'f1',savedAt:new Date().toISOString(),progress:JSON.stringify({v:1,keys:{wonkiParkDraft37_f1:JSON.stringify(park)}})}],showcases:[]};}
  return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(pay)}).catch(()=>{});}
 return r.abort();});
await p.addInitScript(()=>{localStorage.setItem('wk65_admin_device','1');const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2500);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
const st=()=>p.$eval('#wk64Viewer .wk72-st',e=>e.textContent).catch(()=>'(없음)');
const names=()=>p.$$eval('#wk64Viewer [data-m]',a=>a.map(x=>x.innerText.replace(/\s+/g,' ').replace('보기 ▶','')).join(' / ')).catch(()=>'');
const t0=Date.now();await p.evaluate(()=>document.getElementById('wk64Viewer_btn').click());
await p.waitForTimeout(300);console.log('0.3초) 화면 열림?',await p.evaluate(()=>!!document.getElementById('wk64Viewer')),'|',await st());
await p.waitForTimeout(2500);console.log('2.8초)',await st(),'|',await names());
await p.evaluate(()=>document.getElementById('wk64Viewer_btn').click());await p.waitForTimeout(300);console.log('   두 번 눌러도 요청 수: 공원목록',calls.filter(c=>c==='admin_park_list').length);
await p.waitForFunction(()=>/최신 자료/.test(document.querySelector('#wk64Viewer .wk72-st')?.textContent||''),null,{timeout:60000});
console.log(Math.round((Date.now()-t0)/1000)+'초) ',await st(),'|',await names());
await p.screenshot({path:out+'_list.png'});
await p.click('#wk64Viewer .wk67-foot [data-x]');slowAll=true;n=0;
await p.evaluate(()=>document.getElementById('wk64Viewer_btn').click());await p.waitForTimeout(500);
console.log('다시 열기 0.5초)',await st(),'|',await names());
console.log('오류',errs);await b.close();})();
