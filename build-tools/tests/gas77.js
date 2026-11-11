// 77차 서버 시험: Code_77.gs의 방문 기록 저장·집계를 가짜 구글 환경에서 실행
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const src=fs.readFileSync(process.argv[2],'utf8');
const sheets={};function Sheet(name){this.name=name;this.rows=[];this.maxCols=26;}
Sheet.prototype={getLastRow(){return this.rows.length},getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length))},getMaxColumns(){return this.maxCols},insertColumnsAfter(a,n){this.maxCols+=n},setFrozenRows(){},
 getRange(r,c,nr,nc){const sh=this;nr=nr||1;nc=nc||1;return {getValues(){const o=[];for(let i=0;i<nr;i++){const row=sh.rows[r-1+i]||[];o.push(Array.from({length:nc},(_,j)=>row[c-1+j]===undefined?'':row[c-1+j]));}return o;},getDisplayValues(){return this.getValues().map(r=>r.map(String))},getValue(){return this.getValues()[0][0]},
  setValues(v){v.forEach((vr,i)=>{const row=sh.rows[r-1+i]||(sh.rows[r-1+i]=[]);vr.forEach((x,j)=>row[c-1+j]=x);});},setValue(x){this.setValues([[x]])}};},appendRow(v){this.rows.push(v.slice())}};
const ctx={PropertiesService:{getScriptProperties:()=>({getProperty:()=>'X'})},SpreadsheetApp:{openById:()=>({getSheetByName:n=>sheets[n]||null,insertSheet:n=>(sheets[n]=new Sheet(n))})},
 CacheService:{getScriptCache:()=>({_d:ctx._cache,get(k){return this._d[k]||null},put(k,v){this._d[k]=v},remove(k){delete this._d[k]}})},_cache:{},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 Utilities:{formatDate(d,tz,f){const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'numeric',hourCycle:'h23'}).formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});return f==='H'?String(Number(p.hour)):p.year+'-'+p.month+'-'+p.day;},
  computeDigest:(a,s)=>[...crypto.createHash('sha256').update(s).digest()],base64EncodeWebSafe:b=>Buffer.from(b.map(x=>x&255)).toString('base64url'),DigestAlgorithm:{SHA_256:1}},
 ContentService:{createTextOutput:()=>({setMimeType(){return this}}),MimeType:{}},HtmlService:{},console};
vm.createContext(ctx);vm.runInContext(src,ctx);
// 회원 시트 (닉네임 찾기용)
ctx._cache['general_session_T1']='m1';
ctx.cloudSyncGeneralMemberSheet_=()=>{const s=new Sheet('일반회원정보');s.rows=[['회원 ID','저장일시','데이터','닉네임'],['m1','',JSON.stringify({name:'노송희'}),'엄마']];return s;};
const log=b=>vm.runInContext('cloudSyncVisitLog_('+JSON.stringify(b)+')',ctx);
// 예전(70차) 방식 기록 1줄: 7칸만
sheets['방문기록']=new Sheet('방문기록');sheets['방문기록'].rows=[['방문시각','구분','회원 ID','닉네임','이름','들어온 곳','기기'],[new Date(Date.now()-3*86400e3),'방문자','','','','카카오톡','휴대폰']];
console.log('1)',JSON.stringify(log({source:'네이버',detail:'네이버 블로그',device:'휴대폰',browser:'삼성 인터넷',os:'안드로이드',visitorId:'wkvisitor_aaaaaaaaaaaaaaaa'})));
console.log('2) 같은 방문자 바로 다시',JSON.stringify(log({source:'네이버',detail:'네이버 블로그',device:'휴대폰',visitorId:'wkvisitor_aaaaaaaaaaaaaaaa'})));
console.log('3) 같은 방문자가 추적 링크로',JSON.stringify(log({source:'추적 링크',detail:'성당단톡방 (카카오톡)',device:'휴대폰',browser:'카카오톡 앱',os:'안드로이드',visitorId:'wkvisitor_aaaaaaaaaaaaaaaa'})));
console.log('4) 회원',JSON.stringify(log({sessionToken:'T1',source:'직접 입력·즐겨찾기',device:'컴퓨터',browser:'크롬',os:'윈도우',visitorId:'wkvisitor_bbbbbbbbbbbbbbbb'})));
console.log('5) 이상한 값',JSON.stringify(log({source:'<script>',detail:'=HYPERLINK("x")',device:'냉장고',browser:'?',os:'?',visitorId:'wkvisitor_cccccccccccccccc'})));
console.log('   시트 머리줄',JSON.stringify(sheets['방문기록'].rows[0]));console.log('   5번 줄',JSON.stringify(sheets['방문기록'].rows[5].slice(5)));
const r=vm.runInContext('cloudSyncAdminVisitLog_()',ctx);
console.log('6) 오늘',JSON.stringify({total:r.periods.d1.total,uniq:r.periods.d1.uniq,fresh:r.periods.d1.fresh,back:r.periods.d1.back,members:r.periods.d1.members,sources:r.periods.d1.sources,tags:r.periods.d1.tags,browsers:r.periods.d1.browsers}));
console.log('   7일',JSON.stringify({total:r.periods.d7.total,sources:r.periods.d7.sources,details:r.periods.d7.details,os:r.periods.d7.os}));
console.log('   최근 회원',JSON.stringify(r.members));
