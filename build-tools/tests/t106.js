// 106차 시험: 시간대·날씨 색이 지도 위쪽 하늘에만(밤 제외) — 장면별 지도 사진, 코스 그림 영역 색 변화량
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
for(const [sc,wx] of [['off','off'],['eve','clear'],['am','cloudy'],['pm','rain'],['night','clear']]){
 const p=await (await b.newContext({viewport:{width:1200,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(([sc,wx])=>{localStorage.setItem('wk76_scene_mode',sc);localStorage.setItem('wk76_weather_mode',wx);},[sc,wx]);
 await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}return r.abort();});
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(5500);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;document.getElementById('wk44World').scrollIntoView();});await p.waitForTimeout(300);
 const el=await p.$('#wk44World');await el.screenshot({path:out+'_'+sc+'_'+wx+'.png'});console.log(sc,wx,'오류',JSON.stringify(errs));await p.close();}
await b.close();})();
