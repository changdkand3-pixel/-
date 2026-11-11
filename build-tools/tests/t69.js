// 69차 시험: 서버가 예전 코드(admin_park_list 미지원)일 때도 회원 명단이 보이는지 + 관리자 메뉴 서버 상태
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3],old=process.argv[4]!=='new';const dir=path.dirname(file);const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const all=[{id:'f1',nickname:'홍쓰',name:'김홍서',relationship:'상상코칭 관련 지인'},{id:'f2',nickname:'엄마',name:'노송희',relationship:'가족 및 친척'},{id:'f3',nickname:'서준마미',name:'서준맘',relationship:'기타 친구 및 지인'}];
await p.route(/^https?:/,async r=>{const u=r.request().url();
 if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
 if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}
  const NEW=['admin_park_list','owner_park_load','admin_visitor_stats','general_member_progress_load','general_member_progress_save','park_showcase_save','owner_park_save'];
  let pay={success:true,items:[]};
  if(old&&NEW.includes(j.action))pay={success:false,message:'지원하지 않는 요청입니다: '+j.action};
  else if(j.action==='admin_friend_list')pay={success:true,members:all};
  else if(j.action==='admin_park_list')pay={success:true,members:[],showcases:[]};
  return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(pay)});}
 return r.abort();});
await p.addInitScript(()=>{const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');localStorage.setItem('wk65_admin_device','1');});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2500);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('wk64Viewer_btn').click();});
await p.waitForSelector('#wk64Viewer .wk64-item',{timeout:15000}).catch(()=>{});
console.log((old?'예전':'최신')+' 서버) 목록',await p.$$eval('#wk64Viewer [data-m] b',a=>a.map(x=>x.textContent.replace('보기 ▶','')).join(', ')),'| 안내',await p.$eval('#wk64Viewer .wk68-warn b.t',e=>e.textContent).catch(()=>'없음'));
await p.screenshot({path:out+'_viewer.png'});
await p.click('#wk64Viewer [data-m="0"]');console.log('  회원 누름 →',await p.$eval('#wk64Viewer h2',e=>e.textContent),'|',await p.$eval('#wk64Viewer .wk64-empty',e=>e.textContent.slice(0,40)));
await p.click('#wk64Viewer .wk67-foot [data-x]');
await p.evaluate(()=>{window.WonkiAdminLock36.unlock=async()=>true;document.getElementById('wonkiOwnerAnalytics').click();});await p.waitForTimeout(1500);
console.log('  관리자 메뉴 서버 상태:',await p.$eval('#wk68Server',e=>e.textContent.slice(0,60)));
await (await p.$('#wonkiParkEditor36 .wk36-card')).screenshot({path:out+'_menu.png'});
console.log('  오류',errs);await b.close();})();
