// 78차 시험: 77·78차 업데이트 안내는 주인장 기기에서만, 방문자에게는 76차가 최신
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const dir=path.dirname(file);const b=await chromium.launch();
async function page(owner){const ctx=await b.newContext({viewport:{width:390,height:800}});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
 if(owner)await p.addInitScript(()=>{try{localStorage.setItem('wk65_admin_device','1');}catch(_){}});
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);return p;}
const info=p=>p.evaluate(()=>({title:document.querySelector('#wkUpdatePoster .wkp-title')?.textContent,open:!document.getElementById('wkUpdatePoster').hidden,btn:document.getElementById('wkUpdateReopen')?.textContent,next:document.querySelector('#wkUpdatePoster [data-wkp="next"]')?.disabled}));
const V=await page(false);console.log('방문자:',JSON.stringify(await info(V)));
await V.evaluate(()=>document.querySelector('#wkUpdatePoster [data-wkp="list"]').click());console.log('   목록 마지막:',await V.$$eval('#wkUpdatePoster [data-wkp-no]',a=>a.slice(-3).map(x=>x.textContent).join(',')));
console.log('   첫 줄:',await V.evaluate(()=>{document.querySelector('#wkUpdatePoster [data-wkp="latest"]')?.click();return document.querySelector('#wkUpdatePoster .wkp-sec li')?.textContent;}));
const O=await page(true);console.log('주인장:',JSON.stringify(await info(O)));
await O.evaluate(()=>document.querySelector('#wkUpdatePoster [data-wkp="list"]').click());console.log('   목록 마지막:',await O.$$eval('#wkUpdatePoster [data-wkp-no]',a=>a.slice(-3).map(x=>x.textContent).join(',')));
console.log('오류',[...V.errs,...O.errs]);await b.close();})();
