// 74차 시험: 공원 공유 게시판 — 회원 공유, 내 공원 표시, 다른 회원·방문자 둘러보기, 공유 내리기, 주인장 내리기
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
const DB={};const who=t=>t==='T1'?'m1':t==='T2'?'m2':'';let t0=1;
function handle(j){
 if(j.action==='park_gallery_list'){const me=who(j.sessionToken);const items=Object.entries(DB).filter(([k,v])=>v.st==='공개').map(([k,v])=>({key:'k_'+k,mine:k===me,time:v.time,name:v.name,message:v.message,count:v.count,park:v.park})).sort((a,b)=>b.time.localeCompare(a.time));return {success:true,items,mine:me&&DB[me]?{status:DB[me].st}:null,member:!!me};}
 if(j.action==='park_gallery_share'){const me=who(j.sessionToken);if(!me)return {success:false,message:'로그인 만료'};const c=JSON.parse(j.park).state.buildings.length;DB[me]={time:new Date(Date.now()+(t0++)*1000).toISOString(),name:j.name,message:j.message,count:c,park:j.park,st:'공개'};return {success:true,message:'공원 공유 게시판에 올렸어요!'};}
 if(j.action==='park_gallery_unshare'){const me=who(j.sessionToken);if(DB[me])DB[me].st='내림';return {success:true,message:'내 공원을 게시판에서 내렸어요.'};}
 if(j.action==='admin_gallery_hide'){const k=String(j.key).slice(2);if(DB[k])DB[k].st='관리자 내림';return {success:true,message:'게시판에서 내렸어요.'};}
 if(j.action==='general_member_progress_load')return {success:true,progress:'',savedAt:''};
 return {success:true,items:[]};}
const park=(n,name)=>JSON.stringify({state:{version:1,courses:[],buildings:Array.from({length:n},(_,i)=>({id:name+i,type:i%2?'wheel':'wk50_carousel_3',name:name+' 건물'+(i+1),x:.2+i*.15,y:.4+(i%2)*.15,rotation:0,scale:1}))}});
async function page(init,arg){const ctx=await b.newContext({viewport:{width:390,height:800}});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.answers=[];p.on('dialog',d=>{const a=p.answers.shift();d.type()==='prompt'?d.accept(a!==undefined?a:''):d.accept();});
 await p.route(/^https?:/,async r=>{const u=r.request().url();
  if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
  if(/script\.google\.com/.test(u)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j;try{j=JSON.parse(pd);}catch(_){j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}
   return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(handle(j))});}
  return r.abort();});
 await p.addInitScript(init,arg);
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2500);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});return p;}
const member=(tok,id,nick,pk)=>([tok,id,nick,pk])=>{sessionStorage.setItem('wonkiLand_general_session_v1',JSON.stringify({token:tok,member:{id,nickname:nick}}));sessionStorage.setItem('wk63_applied_'+id,'1');localStorage.setItem('wonkiParkDraft37_'+id,pk);};
const cards=p=>p.$$eval('#wk74Gallery .g-card b',a=>a.map(x=>x.textContent).join(', ')).catch(()=>'(없음)');
const wait=p=>p.waitForFunction(()=>/✓/.test(document.querySelector('#wk74Gallery .g-st')?.textContent||''),null,{timeout:15000}).catch(()=>{});
// 철수 공유
const A=await page(([tok,id,nick,pk])=>{sessionStorage.setItem('wonkiLand_general_session_v1',JSON.stringify({token:tok,member:{id,nickname:nick}}));sessionStorage.setItem('wk63_applied_'+id,'1');localStorage.setItem('wonkiParkDraft37_'+id,pk);},['T1','m1','철수',park(3,'철수')]);
A.answers=['철수','제 놀이공원 보러 오세요!'];await A.evaluate(()=>document.getElementById('wk64ShowOff').click());await A.waitForTimeout(1500);await wait(A);
console.log('1) 철수 공유 후 게시판:',await cards(A),'| 내 공원 칸:',await A.$eval('#wk74Gallery .g-mine b',e=>e.textContent).catch(()=>'-'));
await A.screenshot({path:out+'_list.png'});
// 영희 공유
const B=await page(([tok,id,nick,pk])=>{sessionStorage.setItem('wonkiLand_general_session_v1',JSON.stringify({token:tok,member:{id,nickname:nick}}));sessionStorage.setItem('wk63_applied_'+id,'1');localStorage.setItem('wonkiParkDraft37_'+id,pk);},['T2','m2','영희',park(2,'영희')]);
B.answers=['영희',''];await B.evaluate(()=>document.getElementById('wk64ShowOff').click());await B.waitForTimeout(1500);await wait(B);
console.log('2) 영희 게시판:',await cards(B));
// 방문자
const V=await page(()=>{},null);
await V.evaluate(()=>document.getElementById('wk74Board').click());await wait(V);
console.log('3) 방문자 게시판:',await cards(V),'| 안내:',await V.$eval('#wk74Gallery .g-msg',e=>e.textContent.slice(0,30)).catch(()=>'-'),'| 공유 버튼 보임?',await V.evaluate(()=>!!document.querySelector('#wk74Gallery [data-share]')));
await V.click('#wk74Gallery [data-i="1"]');console.log('   카드 누르기 →',await V.$eval('#wk74Gallery h2',e=>e.textContent),'| 건물 그림',await V.$$eval('#wk74Gallery .g-big svg > g',a=>a.length),'| 관리자 내리기 버튼?',await V.evaluate(()=>!!document.querySelector('#wk74Gallery [data-hide]')));
await V.screenshot({path:out+'_one.png'});
await V.keyboard.press('Escape');console.log('   Esc → ',await V.$eval('#wk74Gallery h2',e=>e.textContent));
// 철수 공유 내리기
await A.evaluate(()=>document.querySelector('#wk74Gallery [data-unshare]').click());await A.waitForTimeout(1200);await wait(A);
console.log('4) 철수 내린 뒤:',await cards(A),'| 내 공원 칸:',await A.$eval('#wk74Gallery .g-mine b',e=>e.textContent).catch(()=>'-'));
// 주인장 내리기
const O=await page(()=>{localStorage.setItem('wk65_admin_device','1');const h=btoa(JSON.stringify({alg:'none'})),pl=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}));sessionStorage.setItem('wk64_admin_token',h+'.'+pl+'.x');},null);
await O.evaluate(()=>document.getElementById('wk74Board').click());await wait(O);await O.click('#wk74Gallery [data-i="0"]');
await O.evaluate(()=>document.querySelector('#wk74Gallery [data-hide]').click());await O.waitForTimeout(1500);
console.log('5) 주인장이 영희 공원 내린 뒤:',await cards(O),'| 서버 상태',DB.m2&&DB.m2.st);
console.log('오류',[...A.errs,...B.errs,...V.errs,...O.errs]);await b.close();})();
