// 80차 서버 시험: 관리자 6시간 표 발급·확인 (가짜 구글 환경)
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const src=fs.readFileSync(process.argv[2],'utf8');const cache={};let now=Date.now();
const ctx={PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='GOOGLE_CLIENT_ID'?'cid':k==='ADMIN_EMAIL'?'owner@example.com':''})},
 UrlFetchApp:{fetch:u=>{const ok=/id_token=good/.test(u);return {getResponseCode:()=>ok?200:400,getContentText:()=>JSON.stringify({aud:'cid',email:'owner@example.com',email_verified:'true',exp:Math.floor(now/1000)+3600})};}},
 CacheService:{getScriptCache:()=>({get:k=>{const v=cache[k];return v&&v.t>now?v.v:null;},put:(k,v,s)=>{cache[k]={v,t:now+s*1000};},remove:k=>{delete cache[k];}})},
 Utilities:{base64EncodeWebSafe:s=>Buffer.from(typeof s==='string'?s:Buffer.from(s.map(x=>x&255))).toString('base64url')+'==',getUuid:()=>crypto.randomUUID(),computeDigest:(a,s)=>[...crypto.createHash('sha256').update(s).digest()],DigestAlgorithm:{SHA_256:1}},
 Date:class extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}},Math,JSON,String,Number,console};
vm.createContext(ctx);vm.runInContext(src,ctx);
const start=t=>vm.runInContext('cloudSyncAdminSessionStart80_('+JSON.stringify(t)+')',ctx),check=t=>vm.runInContext('cloudSyncAdminCheck80_('+JSON.stringify(t)+')',ctx);
console.log('1) 잘못된 구글 표 →',JSON.stringify(start('bad')));
const r=start('good');const pay=JSON.parse(Buffer.from(r.token.split('.')[1],'base64url').toString());console.log('2) 발급:',r.success,r.token.slice(0,6),'| 유효',Math.round((pay.exp*1000-now)/3600e3)+'시간');
console.log('3) 바로 확인 →',JSON.stringify(check(r.token)));
console.log('4) 위조 표 →',JSON.stringify(check('wkadm.'+r.token.split('.')[1]+'.'+'b'.repeat(64))));
now+=5.9*3600e3;console.log('5) 5.9시간 뒤 →',JSON.stringify(check(r.token)));
now+=0.2*3600e3;console.log('6) 6.1시간 뒤 →',JSON.stringify(check(r.token)));
console.log('7) 구글 표 그대로도 됨 →',JSON.stringify(check('good')));
