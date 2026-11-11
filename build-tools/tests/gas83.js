// 83차 서버 시험: 상상코칭 회원 삭제 → 삭제된회원 시트로 옮김, 목록에서 빠짐, 다시 저장해도 안 들어감
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync(process.argv[2],'utf8');
const sheets={};function Sheet(n){this.name=n;this.rows=[];}
Sheet.prototype={getLastRow(){return this.rows.length},getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length))},getMaxColumns(){return 26},insertColumnsAfter(){},setFrozenRows(){},
 getRange(r,c,nr,nc){const sh=this;nr=nr||1;nc=nc||1;return {getValues(){const o=[];for(let i=0;i<nr;i++){const row=sh.rows[r-1+i]||[];o.push(Array.from({length:nc},(_,j)=>row[c-1+j]===undefined?'':row[c-1+j]));}return o;},getValue(){return this.getValues()[0][0]},getDisplayValues(){return this.getValues().map(x=>x.map(String))},
  setValues(v){v.forEach((vr,i)=>{const row=sh.rows[r-1+i]||(sh.rows[r-1+i]=[]);vr.forEach((x,j)=>row[c-1+j]=x);});},setValue(x){this.setValues([[x]])},setNumberFormat(){return this},setNumberFormats(){return this}};},
 appendRow(v){this.rows.push(v.slice())},deleteRow(n){this.rows.splice(n-1,1)}};
const ss={getSheetByName:n=>sheets[n]||null,insertSheet:n=>(sheets[n]=new Sheet(n))};
const ctx={PropertiesService:{getScriptProperties:()=>({getProperty:()=>'X'})},SpreadsheetApp:{openById:()=>ss,getActiveSpreadsheet:()=>ss},
 CacheService:{getScriptCache:()=>({get:()=>null,put(){},remove(){}})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 ContentService:{createTextOutput:t=>({_t:t,setMimeType(){return this},getContent(){return this._t}}),MimeType:{JSON:1}},Utilities:{formatDate:()=>''},console};
vm.createContext(ctx);vm.runInContext(src,ctx);
const st=new Sheet('회원데이터_JSON');st.rows=[['회원ID','회원명','비밀번호솔트','비밀번호해시','회원전체자료_JSON','로그인실패횟수','로그인잠금시각','최종수정일']];
[['a1','엄재민'],['a2','정윤서'],['a3','김..'],['a4','정윤서']].forEach(([id,n])=>st.rows.push([id,n,'','',JSON.stringify({id,name:n,method:'방문'}),0,'','']));sheets['회원데이터_JSON']=st;
const run=c=>vm.runInContext(c,ctx);
const names=()=>JSON.stringify(run('cloudSyncAdminListLive83_()').members.map(m=>m.name));
console.log('1) 처음 목록',names());
console.log('2) a3·a4 삭제',JSON.stringify(run('cloudSyncAdminMemberDelete83_(["a3","a4"])')));
console.log('   목록',names(),'| deletedIds',JSON.stringify(run('cloudSyncAdminListLive83_()').deletedIds));
console.log('   삭제된회원 시트',JSON.stringify(sheets['삭제된회원'].rows.slice(1).map(r=>[r[0],r[1],r[3].slice(0,20)])));
const sv=run('cloudSyncAdminSaveLive83_([{id:"a4",name:"정윤서",method:"방문"},{id:"a5",name:"새회원",method:"방문"}])');
console.log('3) 다른 기기가 a4(삭제된 회원)+a5 저장 →',JSON.stringify({success:sv.success,skippedDeleted:sv.skippedDeleted}),'| 목록',names());
console.log('4) 같은 회원 다시 삭제',JSON.stringify(run('cloudSyncAdminMemberDelete83_(["a3"])')),'| 삭제된회원 줄 수',sheets['삭제된회원'].rows.length-1);
