const {chromium}=require('playwright');
(async()=>{const [,,file,pre]=process.argv;const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{console.log('DIALOG',d.message());d.accept();});
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+file,{waitUntil:'load',timeout:120000});await p.waitForTimeout(1200);
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('mathChoiceStatus').textContent='레벨: 중 | 학년: 초4-2';window.wonkiStartDbzGame();});
await p.waitForTimeout(600);
const title=async()=>p.evaluate(()=>document.querySelector('#dbzv2Body .hd h2')?.textContent);
console.log('screen1',await title());
// pick screen → choose first character and start
const cards=await p.$$('#dbzv2Body .cd');console.log('roster',await p.$$eval('#dbzv2Body .cd b',a=>a.map(x=>x.textContent).join(',')));
if(cards.length&&await p.$('#dbzv2Body [data-a=start]')){await cards[0].click();await p.click('#dbzv2Body [data-a=start]');await p.waitForTimeout(500);}
console.log('screen2',await title(),'ops',await p.$$eval('#dbzv2Body .wk42-op',a=>a.length));
await p.screenshot({path:pre+'_units.png',fullPage:false});
await (await p.$('#dbzv2')).screenshot({path:pre+'_board.png'}).catch(()=>{});
// fight first enemy of unit 1
const op=await p.$('#dbzv2Body .wk42-op');const lab=await op.getAttribute('aria-label');await op.click();await p.waitForTimeout(800);
console.log('fight',lab,'screen3',await title());
const q=await p.evaluate(()=>{const n=window.__dbzCur();const Q=window.__dbzQ;return {n,answer:Q.answers[n-1],img:!!document.getElementById('dbzQi')?.src}});console.log('question',q);
await p.screenshot({path:pre+'_battle.png'});
await p.fill('#dbzIn',q.answer.replace(/,/g,' '));await p.click('#dbzv2Body [data-a=submit]');await p.waitForTimeout(400);
console.log('feedback',await p.textContent('#dbzFb'));
console.log('errors',errs);await b.close();})();
