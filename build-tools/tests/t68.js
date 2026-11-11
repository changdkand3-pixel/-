// 68차 시험(실제 서버): 방문자 전체 동기화 시간, 방명록 바로 주고받기, 바로 주고받기가 막힌 경우 예전 방식으로 전환
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();
async function run(label,blockFetch,blockIframe){const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const dl=[];p.on('dialog',d=>{dl.push(d.message().replace(/\n/g,' / '));d.accept();});
 await p.route(/^https?:/,async r=>{const u=r.request().url(),t=r.request().resourceType();
  if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
  if(/script\.google(usercontent)?\.com/.test(u)){if(blockFetch&&t==='fetch')return r.abort();if(blockIframe&&t==='document')return r.abort();return r.continue();}
  return r.abort();});
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(1500);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
 const t0=Date.now();await p.evaluate(()=>document.getElementById('wonkiWholeSyncButton').click());
 await p.waitForFunction(()=>!document.getElementById('wonkiWholeSyncButton').disabled,null,{timeout:200000});
 console.log(label,'전체 동기화',Math.round((Date.now()-t0)/100)/10+'초','| 알림',dl.join(' | ').slice(0,160),'| 방식',JSON.stringify(await p.evaluate(()=>WonkiFastCloud68.stats)),'| 방명록 글',await p.evaluate(()=>JSON.parse(localStorage.getItem('wonkiLand_extra_guestbook_v1')||'[]').length),'| 오류',errs);
 await p.close();}
await run('A) 보통 브라우저:',false,false);
await run('B) 바로 주고받기가 막힌 브라우저:',true,false);
await run('C) 숨은 창이 막힌 브라우저(사용자 휴대폰 추정):',false,true);
await b.close();})();
