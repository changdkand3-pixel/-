// 65차 시험: 구경하기 버튼은 관리자 기기에서만, 관리자 메뉴 방문자 통계, 공개하기 이름
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],shot=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));const calls=[];
await p.route(/^https?:/,async r=>{const u=r.request().url();
 if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
 if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const j=JSON.parse(new URLSearchParams(r.request().postData()||'').get('payload')||'{}');calls.push(j.action);let pay={success:true,items:[],members:[],showcases:[]};
  if(j.action==='admin_visitor_stats'){const days=[];for(let i=29;i>=0;i--){const d=new Date(Date.now()-i*864e5).toISOString().slice(0,10);days.push({day:d,count:(i*7)%23+1});}pay={success:true,today:32,week:287,month:368,total:368,days};}
  return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<script>top.postMessage({type:"wonki-cloud-response",nonce:'+JSON.stringify(j._wonkiNonce)+',payload:'+JSON.stringify(pay)+'},"*")<\/script>'});}
 const m=u.match(/callback=([\w]+)/);if(m){const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());return r.fulfill({status:200,contentType:'application/javascript',body:m[1]+'({success:true,today:32,total:368,day:"'+day+'"})'});}
 return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2500);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
const vis=()=>p.evaluate(()=>{const v=document.getElementById('wk64Viewer_btn');return v?!v.hidden&&v.offsetParent!==null:null;});
console.log('1) 처음 기기: 구경하기 버튼 보임?',await vis(),'| 공개 버튼',await p.evaluate(()=>document.getElementById('wk64ShowOff')?.textContent));
console.log('   페이지 방문자',await p.evaluate(()=>document.getElementById('wonkiTodayVisitorCount')?.textContent+' / '+document.getElementById('wonkiExtraVisitorCount')?.textContent));
// 관리자 메뉴 (비밀번호 통과로 가정), Google 토큰 없음
await p.evaluate(()=>{window.WonkiAdminLock36.unlock=async()=>true;document.getElementById('wonkiOwnerAnalytics').click();});await p.waitForTimeout(800);
console.log('2) 관리자 메뉴 통계(토큰 없음):',await p.$eval('#wk65Stats',e=>e.innerText.replace(/\s+/g,' ')));
console.log('   구경하기 버튼 보임?',await vis(),'| 메뉴 안 구경하기',await p.$$eval('#wonkiParkEditor36 button',a=>a.map(x=>x.textContent).filter(t=>/구경/.test(t)).join()));
// 토큰이 있는 상태로 다시 열기
await p.evaluate(()=>{const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');window.WonkiParkEditor36.close();document.getElementById('wonkiOwnerAnalytics').click();});await p.waitForTimeout(1500);
console.log('3) 토큰 있음 통계:',await p.$eval('#wk65Stats',e=>e.innerText.replace(/\s+/g,' ').slice(0,120)),'| 막대',await p.$$eval('#wk65Stats .wk65-bars span',a=>a.length),'| 요청',calls.join(','));
await (await p.$('#wonkiParkEditor36 .wk36-card')).screenshot({path:shot});
// 새로고침 후에도 관리자 기기면 버튼 보임
await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);console.log('4) 새로고침 후 구경하기 버튼 보임?',await vis());
console.log('오류',errs);await b.close();})();
