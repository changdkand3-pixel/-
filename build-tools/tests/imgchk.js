const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});const fails=[];
p.on('requestfailed',r=>{const u=r.url();if(u.startsWith('file:'))fails.push(u.split('/').pop());});
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{const imgs=[...document.images].filter(i=>i.src.startsWith('file:'));return {그림:imgs.length,깨짐:imgs.filter(i=>i.complete&&i.naturalWidth===0).length,음악:[...document.querySelectorAll('audio')].length}});
console.log(JSON.stringify(r),'못 불러온 파일',fails.length,fails.slice(0,5));await b.close();})();
