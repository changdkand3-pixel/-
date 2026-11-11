const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
let calls=[];
await p.route(/^https?:/,async r=>{const u=r.request().url();
 if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const body=decodeURIComponent((r.request().postData()||'').replace(/^payload=/,'').replace(/\+/g,' '));let j={};try{j=JSON.parse(body)}catch(_){}
  calls.push(j.action+'@'+Math.round(performance.now()/1000));
  if(j.action==='guestbook_list'&&calls.filter(c=>c.startsWith('guestbook_list')).length===1){return;} // 첫 요청: 응답 없음(멈춤)
  const payload=j.action==='guestbook_list'?{success:true,items:[]}:{success:true,items:[]};
  return r.fulfill({status:200,contentType:'text/html',body:'<script>parent.postMessage({type:"wonki-cloud-response",nonce:'+JSON.stringify(j._wonkiNonce)+',payload:'+JSON.stringify(payload)+'},"*")<\/script>'});}
 return r.abort();});
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(800);
const t0=Date.now();
const ok=await p.evaluate(async()=>{document.getElementById('wkUpdatePoster').hidden=true;return await window.wonkiLandRunGuestbookSync(true);});
console.log('방명록 동기화 결과',ok,'걸린 시간',Math.round((Date.now()-t0)/1000)+'초','요청 기록',calls.join(', '));
console.log('상태 글자',await p.textContent('#wonkiChatSaveStatus'));
console.log('오류',errs);await b.close();})();
