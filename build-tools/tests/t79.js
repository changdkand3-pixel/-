// 79차 시험: 주인장 공원 올리기 전 이름 확인, 건물이 없으면 비우기, 관리자 메뉴의 지금 주인장 공원
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
let server={park:JSON.stringify({version:1,courses:[],buildings:[{id:'t',type:'park38_0_7',name:'회전찻잔',x:.75,y:1,rotation:0,scale:1}]}),savedAt:'2026-11-11T16:10:17.875Z'};const saves=[];
const p=await (await b.newContext({viewport:{width:500,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const dl=[];
p.on('dialog',d=>{dl.push(d.message());d.accept();});
await p.route(/^https?:/,async r=>{const u=r.request().url();
 if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
 if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}let pay={success:true,items:[]};
  if(j.action==='owner_park_load')pay={success:true,park:server.park,savedAt:server.savedAt};
  if(j.action==='owner_park_save'){saves.push(JSON.parse(j.park));server={park:j.park,savedAt:new Date().toISOString()};pay={success:true,savedAt:server.savedAt};}
  return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(pay)});}
 return r.abort();});
await p.addInitScript(()=>{try{if(!sessionStorage.getItem('i')){sessionStorage.setItem('i','1');localStorage.setItem('wk65_admin_device','1');localStorage.setItem('wonkiParkDraft37_guest',JSON.stringify({state:{version:1,courses:[],buildings:[{id:'t',type:'park38_0_7',name:'회전찻잔',x:.75,y:1,rotation:0,scale:1},{id:'w',type:'wheel',name:'주인장 관람차',x:.4,y:.6,rotation:0,scale:1}]}}));}const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');}catch(_){}});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(3000);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;window.WonkiAdminLock36.unlock=async()=>true;document.getElementById('wonkiOwnerAnalytics').click();});await p.waitForTimeout(1500);
console.log('1) 관리자 메뉴:',await p.$eval('#wk79Now',e=>e.innerText.replace(/\s+/g,' ')));
await (await p.$('#wk79Now')).screenshot({path:out+'_now.png'});
await p.evaluate(()=>[...document.querySelectorAll('#wonkiParkEditor36 button')].find(b=>/올리기·비우기/.test(b.textContent)).click());await p.waitForTimeout(1500);
console.log('2) 올리기 확인창:',dl.pop().replace(/\n/g,' / '),'| 서버에 올라간 건물',saves.length&&saves[saves.length-1].buildings.map(x=>x.name).join(','));
// 이 기기 건물 모두 지우고 다시
await p.evaluate(()=>localStorage.setItem('wonkiParkDraft37_guest',JSON.stringify({state:{version:1,courses:[],buildings:[]}})));
await p.evaluate(()=>window.WonkiParkRoles66.uploadOwner());await p.waitForTimeout(1500);
console.log('3) 비우기 확인창:',dl.pop().replace(/\n/g,' / '),'| 서버 건물 수',saves[saves.length-1].buildings.length,'| 메뉴:',await p.$eval('#wk79Now',e=>e.innerText.replace(/\s+/g,' ').slice(0,60)));
console.log('오류',errs);await b.close();})();
