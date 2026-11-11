const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const C=window.WonkiEnglishCore;return C.SEMESTERS.map(s=>{const pool=C.BANK.filter(q=>s.units.includes(q.unit)&&(!s.key.startsWith('h')||!['sentence','context','translate'].includes(q.kind)));return s.label+' '+pool.length}).join(' | ')}));
await b.close();})();
