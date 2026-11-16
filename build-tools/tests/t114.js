// 114차 시험: 인형뽑기 창 → 🧸 내 보유창고 → 등록(사진 포함)·전시장·보유창고 필터·별·고치기·지우기·다시 열어도 남음
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3],pic=process.argv[4];const dir=path.dirname(file);const b=await chromium.launch();
for(const w of [1200,390]){const ctx=await b.newContext({viewport:{width:w,height:w<500?844:900},isMobile:w<500,hasTouch:w<500});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await ctx.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;window.wk113Claw();});await p.waitForTimeout(300);
await p.click('#clawStoreBtn');await p.waitForTimeout(300);const empty=await p.textContent('#wk114Store .s-body');
const add=async(name,kind,cost,show,photo)=>{await p.click('#wk114Store [data-tab="add"]');await p.fill('#wk114Store input[name=name]',name);await p.selectOption('#wk114Store select[name=kind]',kind);await p.fill('#wk114Store input[name=cost]',String(cost));if(photo){await p.setInputFiles('#wk114Photo',photo);await p.waitForTimeout(400);}const cb=await p.$('#wk114Store input[name=show]');if((await cb.isChecked())!==show)await cb.click();await p.click('#wk114Store .s-save');await p.waitForTimeout(200);};
await add('피카츄 인형','인형',3000,true,pic);await add('손오공 피규어','피규어',12000,true);await add('커비 키링','굿즈',4000,false);
const show=await p.$$eval('#wk114Store .shelf .item b',a=>a.map(x=>x.textContent));const sum=await p.textContent('#wk114Store .s-sum');const hasPhoto=await p.$eval('#wk114Store .shelf .item .ph',x=>/url\(/.test(x.getAttribute('style')||''));
await p.screenshot({path:out+'_'+w+'_show.png'});
await p.click('#wk114Store [data-tab="store"]');await p.click('#wk114Store [data-f="굿즈"]');const goods=await p.$$eval('#wk114Store .shelf .item b',a=>a.map(x=>x.textContent));
await p.click('#wk114Store .shelf .item .star');await p.click('#wk114Store [data-f="전체"]');await p.click('#wk114Store .shelf .item [data-a=del]');const left=await p.$$eval('#wk114Store .shelf .item b',a=>a.map(x=>x.textContent));
await p.screenshot({path:out+'_'+w+'_store.png'});
await p.click('#wk114Store [data-a=edit]');await p.fill('#wk114Store input[name=name]','손오공 피규어 (한정판)');await p.click('#wk114Store .s-save');
await p.reload();await p.waitForTimeout(3000);await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;window.wk113Claw();});await p.click('#clawStoreBtn');await p.waitForTimeout(300);
const after=await p.$$eval('#wk114Store .shelf .item b',a=>a.map(x=>x.textContent));await p.keyboard.press('Escape');const closed=await p.evaluate(()=>document.getElementById('wk114Store').hidden);
console.log(w,'| 처음:',empty.slice(0,30),'| 등록 후 전시장',JSON.stringify(show),'| 사진',hasPhoto,'|',sum.replace(/\s+/g,' '),'| 굿즈 필터',JSON.stringify(goods),'| 지운 뒤 창고',JSON.stringify(left),'| 새로고침 뒤 전시장',JSON.stringify(after),'| Esc',closed,'| 오류',errs);await ctx.close();}
await b.close();})();
