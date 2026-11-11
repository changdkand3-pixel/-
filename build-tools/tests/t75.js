// 75차 시험: 구글 오류 페이지(JSON 아님)·연결 끊김이 한 번 있어도 계속 바로 주고받기, 게시판 기다린 시간·다시 불러오기
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();
async function run(label,plan){const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));let n=0;
 await p.route(/^https?:/,async r=>{const u=r.request().url(),t=r.request().resourceType();
  if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
  if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}
   if(j.action==='park_gallery_list'){n++;const act=plan[n-1]||'ok';
    if(act==='html')return r.fulfill({status:200,contentType:'text/html',headers:{'access-control-allow-origin':'*'},body:'<!DOCTYPE html><html>Google 오류</html>'});
    if(act==='neterr')return r.abort('failed');
    if(act==='slow')await new Promise(z=>setTimeout(z,60000));
    if(t==='document')return r.fulfill({status:200,contentType:'text/html',body:'<script>top.postMessage({type:"wonki-cloud-response",nonce:'+JSON.stringify(j._wonkiNonce)+',payload:{success:true,items:[]}},"*")<\/script>'});
    return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({success:true,items:[{key:'k',name:'철수',message:'',count:1,time:new Date().toISOString(),park:JSON.stringify({state:{buildings:[{id:'a',type:'wheel',name:'관람차',x:.5,y:.5,rotation:0,scale:1}]}})}]})}).catch(()=>{});}
   return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"success":true,"items":[]}'});}
  return r.abort();});
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2000);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
 const t0=Date.now();await p.evaluate(()=>document.getElementById('wk74Board').click());
 if(plan[0]==='slow'){await p.waitForTimeout(16500);console.log(label,'16초 상태:',await p.$eval('#wk74Gallery .g-st',e=>e.textContent),'| 다시 불러오기 버튼',await p.evaluate(()=>!!document.querySelector('#wk74Gallery [data-reload]')));
  await p.click('#wk74Gallery [data-reload]');}
 await p.waitForFunction(()=>/✓|⚠/.test(document.querySelector('#wk74Gallery .g-st')?.textContent||''),null,{timeout:60000}).catch(()=>{});
 console.log(label,((Date.now()-t0)/1000).toFixed(1)+'초',await p.$eval('#wk74Gallery .g-st',e=>e.textContent.slice(0,40)),'| 방식',JSON.stringify(await p.evaluate(()=>WonkiFastCloud68.stats)));
 // 같은 화면에서 한 번 더 (바로 주고받기 유지되는지)
 await p.evaluate(()=>window.WonkiParkGallery74.load(true));await p.waitForTimeout(1500);console.log('   다음 요청 방식',JSON.stringify(await p.evaluate(()=>WonkiFastCloud68.stats)),'오류',errs);
 await p.close();}
await run('A) 구글 오류 페이지 1번:',['html','ok']);
await run('B) 연결 끊김 1번:',['neterr','ok']);
await run('C) 서버 멈춤 → 다시 불러오기:',['slow','slow','ok']);
await b.close();})();
