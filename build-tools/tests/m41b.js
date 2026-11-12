const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900}});await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(800);
await p.evaluate(()=>{document.getElementById('wkUpdatePoster').hidden=true;document.getElementById('mathChoiceStatus').textContent='레벨: 중 | 학년: 초4-1';window.wonkiStartDbzGame();});await p.waitForTimeout(500);
await p.evaluate(()=>{const s=document.createElement('style');s.textContent='.wk41-op{outline:2px solid #0f0!important}';document.head.appendChild(s)});
await (await p.$('.wk41-board')).screenshot({path:process.argv[3]});await b.close();})();
