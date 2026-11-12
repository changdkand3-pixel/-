const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(800);
const h=()=>p.evaluate(()=>document.querySelector('#wkEnglishGame .we-header h2')?.textContent);
await p.evaluate(()=>{document.getElementById('wkUpdatePoster').hidden=true;window.WonkiEnglish.open();});await p.waitForTimeout(300);console.log('1',await h());
await p.evaluate(()=>document.querySelector('[data-eng-action="enter-game"]')?.click());await p.waitForTimeout(300);console.log('2',await h());
await p.evaluate(()=>document.querySelector('[data-eng-semester="e4-1"]')?.click());await p.waitForTimeout(300);console.log('3',await h());
if(!(await p.$('#wkEnglishGame .wk41-board'))){await p.evaluate(()=>document.querySelector('#wkEnglishGame [data-eng-action="choose-character"]')?.click());await p.waitForTimeout(200);await p.evaluate(()=>document.querySelector('#wkEnglishGame [data-eng-action="start"]')?.click());await p.waitForTimeout(300);console.log('3b',await h(),await p.$$eval('#wkEnglishGame button',a=>a.slice(0,30).map(x=>x.dataset.engAction).join(',')));}
await p.evaluate(()=>document.querySelector('#wkEnglishGame .wk41-op')?.click());await p.waitForTimeout(500);console.log('4',await h());
console.log('버튼',await p.$$eval('#wkEnglishGame .wk55-bar button',a=>a.map(x=>x.textContent).join(' | ')));
await p.screenshot({path:process.argv[3]+'_eng.png'});

await p.evaluate(()=>document.querySelector('#wkEnglishGame .wk41-op')?.click());await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelector('#wkEnglishGame .wk55-save')?.click());await p.waitForTimeout(300);console.log('저장 →',await h());
console.log('오류',errs);await b.close();})();
