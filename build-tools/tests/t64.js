// 64차 시험: 전체 동기화 요청 순서·시간(서버 응답 각 1.5초), 공원 자랑하기, 회원 공원 구경하기
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],shot=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));const calls=[];let received=null;
const park={state:{buildings:[{id:'a',type:'wheel',name:'민수 관람차',x:.5,y:.5,rotation:0,scale:1.2},{id:'b',type:'wk50_carousel_3',name:'바다 회전목마',x:1.3,y:.9,rotation:0,scale:1}]}};
await p.route(/^https?:/,async r=>{const u=r.request().url();
 if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
 if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const j=JSON.parse(new URLSearchParams(r.request().postData()||'').get('payload')||'{}');calls.push(j.action);
  await new Promise(z=>setTimeout(z,1500));let pay={success:true,members:[],items:[]};
  if(j.action==='park_showcase_save'){received=j;pay={success:true,message:'공원을 원기랜드 관리자에게 보냈어요!'};}
  if(j.action==='admin_park_list')pay={success:true,members:[{id:'m1',nickname:'철수',name:'김철수',savedAt:new Date().toISOString(),progress:JSON.stringify({v:1,keys:{wonkiParkDraft37_m1:JSON.stringify(park),wonki_dbz_math_v2:JSON.stringify({wins:5,solved:42,friends:['a','b'],activeGrade:'초3-1'}),wonkiland_dbz_english_v1:JSON.stringify({wins:2,solved:20,friends:['x']})}})}],showcases:[{time:new Date().toISOString(),name:'영희',message:'제 공원 예쁘죠?',count:2,park:JSON.stringify(park)}]};
  return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<script>top.postMessage({type:"wonki-cloud-response",nonce:'+JSON.stringify(j._wonkiNonce)+',payload:'+JSON.stringify(pay)+'},"*")<\/script>'});}
 if(/callback=/.test(u))return; // 연결 확인은 막힌 상태(사용자 휴대폰과 같음)
 return r.abort();});
await p.addInitScript(()=>{const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');localStorage.setItem('wonkiLandGoogleClientId_v1','test-client');localStorage.setItem('wonkiParkDraft37_guest',JSON.stringify({state:{buildings:[{id:'g',type:'wheel',name:'손님 관람차',x:.4,y:.4,rotation:0,scale:1}]}}));});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2000);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
// 1) 전체 동기화
calls.length=0;const dlg=[];p.on('dialog',d=>{dlg.push(d.message().slice(0,30));d.type()==='prompt'?d.accept(d.message().includes('이름')?'민수':'안녕'):d.accept();});
let t0=Date.now();await p.evaluate(()=>document.getElementById('wonkiWholeSyncButton').click());
await p.waitForFunction(()=>!document.getElementById('wonkiWholeSyncButton').disabled,null,{timeout:180000});
console.log('1) 전체 동기화',Math.round((Date.now()-t0)/1000)+'초','| 요청',calls.join(', '),'| 알림',dlg.join(' / '));
// 2) 공원 자랑하기
dlg.length=0;await p.evaluate(()=>document.getElementById('wk64ShowOff').click());await p.waitForTimeout(2500);
console.log('2) 자랑하기 받은 자료',received&&received.name,received&&received.message,'건물',received&&JSON.parse(received.park).state.buildings.length);
// 3) 구경하기
await p.evaluate(()=>document.getElementById('wk64Viewer_btn').click());await p.waitForTimeout(2500);
console.log('3) 목록',await p.$$eval('#wk64Viewer .wk64-item b',a=>a.map(x=>x.textContent).join(',')),'|',await p.$$eval('#wk64Viewer .wk64-item small',a=>a.map(x=>x.textContent).join(' / ')));
await p.click('#wk64Viewer [data-m="0"]');await p.waitForTimeout(800);
console.log('   철수 공원 건물 그림',await p.$$eval('#wk64Viewer svg.wk64-map > g',a=>a.length),'| 통계',await p.$$eval('#wk64Viewer .wk64-stats span',a=>a.map(x=>x.textContent).join(' / ')));
await (await p.$('#wk64Viewer .wk36-card')).screenshot({path:shot});
await p.click('#wk64Viewer [data-back]');await p.click('#wk64Viewer [data-tab="show"]');console.log('   자랑 탭',await p.$$eval('#wk64Viewer .wk64-item b',a=>a.map(x=>x.textContent).join(',')));
console.log('오류',errs);await b.close();})();
