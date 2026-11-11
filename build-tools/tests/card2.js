const {chromium,devices}=require('playwright');
(async()=>{const [,,file,pre]=process.argv;const b=await chromium.launch();
for(const [n,o] of [['pc',{viewport:{width:1280,height:1000},deviceScaleFactor:2}],['m',devices['iPhone 13']]]){const c=await b.newContext(o);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+file,{waitUntil:'load',timeout:120000});await p.waitForTimeout(1500);
const card=await p.$('#wkUpdatePoster .wkp');
await p.evaluate(()=>{const k=document.querySelector('#wkUpdatePoster .wkp');k.style.maxHeight='none';document.getElementById('wkUpdatePoster').style.alignItems='flex-start'});
await card.screenshot({path:pre+'_poster_'+n+'.png'});
await p.click('.wkp-hide');await p.click('.wkp-ok');
console.log(n,'hidden after ok',await p.evaluate(()=>document.getElementById('wkUpdatePoster').hidden),'reopen btn',!!(await p.$('#wkUpdateReopen')),errs);
await p.reload({waitUntil:'load'});await p.waitForTimeout(800);console.log('after reload shown',await p.evaluate(()=>!!document.getElementById('wkUpdatePoster')&&!document.getElementById('wkUpdatePoster').hidden));
await p.click('#wkUpdateReopen');console.log('reopened',await p.evaluate(()=>!document.getElementById('wkUpdatePoster').hidden));
await c.close();}
await b.close();})();
