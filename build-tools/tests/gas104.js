// 104차 서버 시험: public_config(Client ID), admin_lock_check/set(해시 저장, 5번 틀리면 잠금), admin_lock_set은 관리자 표 필요
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const src=fs.readFileSync(process.argv[2],'utf8');const props={GOOGLE_CLIENT_ID:'123-abc.apps.googleusercontent.com'};const cache={};
const ctx={PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>{props[k]=v;}})},
 CacheService:{getScriptCache:()=>({get:k=>cache[k]||null,put:(k,v)=>{cache[k]=v;},remove:k=>{delete cache[k];}})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 ContentService:{createTextOutput:t=>({_t:t,setMimeType(){return this},getContent(){return this._t}}),MimeType:{JSON:1}},
 Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1},computeDigest:(a,s)=>[...crypto.createHash('sha256').update(s,'utf8').digest()].map(b=>b>127?b-256:b),formatDate:()=>''},console};
vm.createContext(ctx);vm.runInContext(src,ctx);const H=b=>vm.runInContext('cloudSyncHandleRequest_('+JSON.stringify(b)+')',ctx);
console.log('1) public_config',JSON.stringify(H({action:'public_config'})));
console.log('2) 설정 전 확인',JSON.stringify(H({action:'admin_lock_check',password:'1234'})));
console.log('3) 관리자 표 없이 저장',JSON.stringify(H({action:'admin_lock_set',password:'1234'})).slice(0,80));
cache['wk80adm_'+'k'.repeat(64)]=String(Math.floor(Date.now()/1000)+3600);
console.log('4) 관리자 표로 저장',JSON.stringify(H({action:'admin_lock_set',idToken:'wkadm.x.'+'k'.repeat(64),password:'4821'})),'| 저장값에 비밀번호 없음',!String(props.ADMIN_LOCK_104).includes('4821'));
console.log('5) 맞는 비밀번호',JSON.stringify(H({action:'admin_lock_check',password:'4821'})),'| public_config',JSON.stringify(H({action:'public_config'})));
for(let i=1;i<=5;i++)console.log('6.'+i+') 틀림',JSON.stringify(H({action:'admin_lock_check',password:'0000'})));
console.log('7) 잠긴 뒤 맞는 비밀번호',JSON.stringify(H({action:'admin_lock_check',password:'4821'})));
delete cache.wk104lock_until;console.log('8) 5분 뒤',JSON.stringify(H({action:'admin_lock_check',password:'4821'})));
