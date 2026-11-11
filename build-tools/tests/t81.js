// 81차 시험: 이 기기 관리자 비밀번호 — 4자리로 설정·열기·변경, 3자리 거절, 5번 틀리면 5분 잠금
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
async function lock(change,vals){const pr=p.evaluate(c=>window.WonkiAdminLock36.unlock(c),change);await p.waitForSelector('#wonkiAdminLock36 input');const ins=await p.$$('#wonkiAdminLock36 input');for(let i=0;i<ins.length;i++)await ins[i].fill(vals[i]||'');
 await p.click('#wonkiAdminLock36 button[type=submit]');await p.waitForTimeout(2000);const open=!!(await p.$('#wonkiAdminLock36'));let st='(열림·닫힘)';if(open){st=await p.$eval('#wonkiAdminLock36 [role=status]',e=>e.textContent);await p.click('#wonkiAdminLock36 button[type=button]');}return [await pr,st];}
console.log('1) 처음 설정 1234:',JSON.stringify(await lock(false,['1234','1234'])));
console.log('2) 1234로 열기:',JSON.stringify(await lock(false,['1234'])));
console.log('3) 3자리 123으로 바꾸기:',JSON.stringify(await lock(true,['1234','123','123'])));
console.log('4) 5678로 바꾸기:',JSON.stringify(await lock(true,['1234','5678','5678'])));
for(let i=1;i<=5;i++)console.log('5-'+i+') 틀린 0000:',JSON.stringify(await lock(false,['0000'])));
console.log('6) 잠긴 뒤 맞는 5678:',JSON.stringify(await lock(false,['5678'])));
await p.evaluate(()=>{const v=JSON.parse(localStorage.getItem('wk81_lock_fail'));v.until=Date.now()-1;localStorage.setItem('wk81_lock_fail',JSON.stringify(v));});
console.log('7) 5분 지난 뒤 5678:',JSON.stringify(await lock(false,['5678'])));
console.log('오류',errs);await b.close();})();
