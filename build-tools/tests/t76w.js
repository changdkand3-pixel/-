// 76차 시험: 서울 실시간 날씨(가짜 Open-Meteo 응답) → 지도 날씨, 연결 실패 시 계절 무작위, 달 모양 사진
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],out=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
async function run(label,reply){const p=await b.newPage({viewport:{width:1200,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));let hits=0;
 await p.route(/^https?:/,r=>{const u=r.request().url();if(u.startsWith('https://wonki.test/')){const f=path.join(dir,decodeURIComponent(u.slice(19).split('?')[0]));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:f.endsWith('.html')?'text/html; charset=utf-8':'image/webp'}):r.abort();}
  if(/api\.open-meteo\.com/.test(u)){hits++;return reply?r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({latitude:37.55,longitude:126.98,current:{time:'2026-11-11T21:00',interval:900,weather_code:reply[0],temperature_2m:reply[1],is_day:0}})}):r.abort();}
  return r.abort();});
 await p.goto('https://wonki.test/'+path.basename(file),{waitUntil:'domcontentloaded'});await p.waitForTimeout(3500);
 console.log(label,'| 날씨',await p.evaluate(()=>WonkiScenery76.weather()),'| 표시',await p.$eval('#wk76Badge',e=>e.textContent),'| 버튼',await p.$eval('#wk76Wx',e=>e.textContent),'| 요청',hits,errs);
 return p;}
await (await run('A) 서울 눈 1°C',[73,1.2])).close();
await (await run('B) 서울 비 9°C',[61,9.4])).close();
await (await run('C) 서울 흐림 12°C',[3,12])).close();
const p=await run('D) 날씨 서비스 연결 실패',null);
// 달 모양
await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;WonkiScenery76.setMode('night');WonkiScenery76.setWeather('clear');});await p.waitForTimeout(3000);
const moon=await p.$('#wk76Sky .moon');await moon.scrollIntoViewIfNeeded();
for(const a of [0.5,3.5,7.4,11,14.8,18.5,22.1,26]){await p.evaluate(a=>WonkiScenery76.setMoonAge(a),a);await p.waitForTimeout(150);await moon.screenshot({path:out+'_moon_'+a+'.png'});console.log('  나이',a,'→',await p.evaluate(()=>WonkiScenery76.moon().name));}
await p.evaluate(()=>WonkiScenery76.setMoonAge(null));console.log('  오늘(11/11) 달:',await p.evaluate(()=>WonkiScenery76.moon().name));
await b.close();})();
