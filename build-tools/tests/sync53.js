const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [label,mem,book] of [['둘 다 성공',true,true],['회원자료만 실패',false,true]]){
 const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const dlg=[];p.on('dialog',d=>{dlg.push(d.message());d.accept();});
 await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(800);
 const t=await p.evaluate(async([mem,book])=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  window.wonkiLandRunMemberSync=async()=>{await wait(3000);if(!mem)window.__wonkiMemberSyncError={stage:'③ 클라우드 회원자료 읽기',message:'서버 응답 시간이 초과되었습니다.'};return mem;};
  window.wonkiLandRunGuestbookSync=async()=>{await wait(3000);return book;};
  const b=document.getElementById('wonkiWholeSyncButton');const s=performance.now();b.click();
  while(b.disabled)await wait(100);return Math.round(performance.now()-s);},[mem,book]);
 await p.waitForTimeout(300);
 console.log(label,'| 걸린 시간',t,'ms (각 3초씩)','| 팝업',JSON.stringify(dlg),'| 작은 알림',await p.evaluate(()=>document.getElementById('wk51SyncToast')?.textContent||null),'| errors',errs);
 await p.close();}
await b.close();})();
