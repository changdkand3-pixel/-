// 82차 시험: 짧은 주소 /w → 원기랜드로 바로 이동, 추적 이름(src)·처음 사이트(wkref) 넘기기, 미리보기 카드 정보
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2],wfile=process.argv[3];const dir=path.dirname(file);const b=await chromium.launch();
const MAIN='/%EB%93%9C%EB%9E%98%EA%B3%A4%EB%B3%BC%20%EC%88%98%ED%95%99%EA%B2%8C%EC%9E%84/%EC%9B%B0%EC%BB%B4%ED%88%AC%20%EC%9B%90%EA%B8%B0%EB%9E%9C%EB%93%9C';
async function run(label,ua,url,ref){const ctx=await b.newContext(ua?{userAgent:ua}:{});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));let got=null;
 await ctx.route(/^https?:/,async r=>{const u=new URL(r.request().url());
  if(u.hostname==='hinsrolin.neocities.org'){if(u.pathname==='/w')return r.fulfill({status:200,body:fs.readFileSync(wfile),contentType:'text/html; charset=utf-8'});
   if(u.pathname===MAIN)return r.fulfill({status:200,body:fs.readFileSync(file),contentType:'text/html; charset=utf-8'});
   const f=path.join(dir,decodeURIComponent(u.pathname.split('/').pop()));return fs.existsSync(f)?r.fulfill({status:200,body:fs.readFileSync(f),contentType:'image/webp'}):r.abort();}
  if(/script\.google\.com/.test(u.href)&&r.request().method()==='POST'){const pd=r.request().postData()||'';let j={};try{j=JSON.parse(pd);}catch(_){try{j=JSON.parse(new URLSearchParams(pd).get('payload')||'{}');}catch(__){}}
   if(j.action==='visit_log')got=j;return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"success":true,"items":[]}'});}
  return r.abort();});
 await p.goto(url,{waitUntil:'domcontentloaded',referer:ref,timeout:90000});await p.waitForTimeout(7000);
 console.log(label,'→ 도착',decodeURIComponent(new URL(p.url()).pathname),'| 기록:',got?[got.source,got.detail,got.browser].join(' | '):'없음',errs.length?errs:'');await ctx.close();}
await run('A) 인스타 프로필 짧은 주소','Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0','https://hinsrolin.neocities.org/w?src=%EC%9D%B8%EC%8A%A4%ED%83%80%ED%94%84%EB%A1%9C%ED%95%84');
await run('B) 네이버 블로그 글의 짧은 주소',null,'https://hinsrolin.neocities.org/w','https://blog.naver.com/someone/1234');
await run('C) 카톡 짧은 주소','Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/121 Mobile Safari/537.36 KAKAOTALK 10.8.0','https://hinsrolin.neocities.org/w');
const og=fs.readFileSync(wfile,'utf8').match(/og:(title|image)" content="([^"]+)"/g);console.log('D) 미리보기 카드:',og.join(' / '));
await b.close();})();
