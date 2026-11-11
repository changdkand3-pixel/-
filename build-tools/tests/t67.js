// 67차 시험: 구경하기 목록에 가입 회원 모두 표시, 회원 누르기, ◀ 목록, ✕ 나가기, Esc, 뒤로 가기
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3],w=+(process.argv[4]||390);const dir=path.dirname(file);const b=await chromium.launch();const p=await b.newPage({viewport:{width:w,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const park={state:{buildings:[{id:'a',type:'wheel',name:'민수 관람차',x:.5,y:.5,rotation:0,scale:1.2}]}};
const rec=[];for(let i=0;i<3;i++)rec.push({id:'m'+i,nickname:'',name:'',savedAt:new Date(Date.now()-i*1e6).toISOString(),progress:JSON.stringify({v:1,keys:{['wonkiParkDraft37_m'+i]:JSON.stringify(park),wonki_dbz_math_v2:JSON.stringify({wins:i,solved:10*i})}})});
const all=[{id:'m0',nickname:'철수',name:'김철수',relationship:'가족 및 친척'},{id:'m1',nickname:'영희',name:'이영희',relationship:'초등학교 친구'},{id:'m2',nickname:'민수',name:'박민수'},{id:'f1',nickname:'홍쓰',name:'김홍서',relationship:'상상코칭 관련 지인'},{id:'f2',nickname:'',name:'장인기 야고보',relationship:'가족 및 친척'},{id:'f3',nickname:'지운회원',name:'x',deleted:true}];
await p.route(/^https?:/,async r=>{const u=r.request().url();
 if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
 if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const j=JSON.parse(new URLSearchParams(r.request().postData()||'').get('payload')||'{}');let pay={success:true,items:[]};
  if(j.action==='admin_park_list')pay={success:true,members:rec,showcases:[{time:new Date().toISOString(),name:'영희',message:'봐 주세요',count:1,park:JSON.stringify(park)}]};
  if(j.action==='admin_friend_list')pay={success:true,members:all};
  return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<script>top.postMessage({type:"wonki-cloud-response",nonce:'+JSON.stringify(j._wonkiNonce)+',payload:'+JSON.stringify(pay)+'},"*")<\/script>'});}
 return r.abort();});
await p.addInitScript(()=>{const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');localStorage.setItem('wk65_admin_device','1');});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2500);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
const open=async()=>{await p.evaluate(()=>document.getElementById('wk64Viewer_btn').click());await p.waitForSelector('#wk64Viewer .wk64-item',{timeout:10000});};
const isOpen=()=>p.evaluate(()=>!!document.getElementById('wk64Viewer'));
const title=()=>p.$eval('#wk64Viewer h2',e=>e.textContent).catch(()=>null);
await open();
console.log('1) 목록',await p.$$eval('#wk64Viewer [data-m] b',a=>a.map(x=>x.textContent.replace('보기 ▶','')).join(', ')),'|',await p.$eval('#wk64Viewer .wk67-note',e=>e.textContent));
await p.screenshot({path:out+'_list.png'});
// 아래로 스크롤해도 나가기 보이는지
await p.evaluate(()=>{const c=document.querySelector('#wk64Viewer .wk36-card');c.scrollTop=9999;});const vis=await p.evaluate(()=>{const f=document.querySelector('#wk64Viewer .wk67-head .wk67-x').getBoundingClientRect(),c=document.querySelector('#wk64Viewer .wk36-card').getBoundingClientRect();return f.top>=c.top-1&&f.bottom<=c.bottom+1;});console.log('2) 스크롤 후 위쪽 ✕ 나가기 보임',vis);
await p.click('#wk64Viewer [data-m="0"]');console.log('3) 철수 누름 →',await title(),'| 지도 건물',await p.$$eval('#wk64Viewer svg.wk64-map > g',a=>a.length));
await p.screenshot({path:out+'_one.png'});
await p.click('#wk64Viewer .wk67-foot [data-back]');console.log('4) ◀ 회원 목록으로 →',await title());
await p.click('#wk64Viewer [data-m="3"]');console.log('5) 기록 없는 회원 →',await title(),'|',await p.$eval('#wk64Viewer .wk64-empty',e=>e.textContent.slice(0,30)));
await p.keyboard.press('Escape');console.log('6) Esc →',await title(),'열림',await isOpen());if(!await isOpen())await open();
await p.click('#wk64Viewer [data-m="1"]');await p.goBack().catch(()=>{});await p.waitForTimeout(300);console.log('7) 뒤로 가기 →',await title());
await p.goBack().catch(()=>{});await p.waitForTimeout(300);console.log('8) 한 번 더 뒤로 가기 → 열림?',await isOpen(),'| 페이지 그대로',await p.evaluate(()=>location.host));
await open();await p.click('#wk64Viewer .wk67-foot [data-x]');console.log('9) ✕ 구경하기 나가기 → 열림?',await isOpen());
await open();await p.keyboard.press('Escape');console.log('10) 목록에서 Esc → 열림?',await isOpen());
await open();await p.mouse.click(5,5);console.log('11) 바깥 누르기 → 열림?',await isOpen());
console.log('오류',errs);await b.close();})();
