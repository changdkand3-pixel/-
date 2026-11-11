/**
 * 원기랜드 클라우드 연결 사전 점검
 * 회원정보를 읽거나 수정하지 않는 진단용 코드
 */
function cloudSyncCheckConfig() {
  const props = PropertiesService.getScriptProperties();

  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  const adminEmail = props.getProperty('ADMIN_EMAIL');
  const clientId = props.getProperty('GOOGLE_CLIENT_ID');

  const result = {
    spreadsheetId: !!spreadsheetId,
    adminEmail: !!adminEmail,
    googleClientId: !!clientId,
    sheetExists: false,
    headerCount: 0,
    message: ''
  };

  if (!spreadsheetId || !adminEmail || !clientId) {
    result.message = '필수 스크립트 속성이 누락되었습니다.';
    Logger.log(JSON.stringify(result));
    return;
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName('회원정보');

  if (!sheet) {
    result.message = '회원정보 시트를 찾을 수 없습니다. 시트 이름을 확인해 주세요.';
    Logger.log(JSON.stringify(result));
    return;
  }

  result.sheetExists = true;
  result.headerCount = sheet.getLastColumn();
  result.message = '설정 및 회원정보 시트 확인 완료';

  Logger.log(JSON.stringify(result));
}

/**
 * 원기랜드 회원 전체자료 저장 공간 준비
 * 기존 회원정보 시트는 수정하거나 삭제하지 않습니다.
 */
function cloudSyncPrepareStore() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID 설정을 확인해 주세요.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheetName = '회원데이터_JSON';
    let sheet = ss.getSheetByName(sheetName);

    const headers = [
      '회원ID',
      '회원명',
      '비밀번호솔트',
      '비밀번호해시',
      '회원전체자료_JSON',
      '로그인실패횟수',
      '로그인잠금시각',
      '최종수정일'
    ];

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headers.length)
        .setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold');
    } else {
      const existing = sheet.getRange(1, 1, 1, headers.length)
        .getDisplayValues()[0];

      if (existing.join('|') !== headers.join('|')) {
        throw new Error(
          '회원데이터_JSON 시트의 기존 열 제목이 다릅니다. 자동 변경하지 않았습니다.'
        );
      }
    }

    return {
      ok: true,
      sheetName: sheetName,
      columns: headers.length,
      message: '회원 전체자료 저장 공간 준비 완료'
    };

  } finally {
    lock.releaseLock();
  }
}

/* 전역 웹앱 GET: JSONP ping */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var data = { success:true, ok:true, message:'원기랜드 연결 성공' };
  var callback = String(p.callback || '');
  if (callback && /^[A-Za-z0-9_$\.]+$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(data) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return cloudSyncJson(data);
}

/* 전역 웹앱 POST: JSON과 숨김 iframe form(payload) 모두 처리 */
function doPost(e) {
  var raw = '';
  if (e && e.parameter && e.parameter.payload) raw = e.parameter.payload;
  else if (e && e.postData && e.postData.contents) raw = e.postData.contents;
  var request = {};
  var nonce = '';
  var response;
  try {
    request = raw ? JSON.parse(raw) : {};
    nonce = String(request._wonkiNonce || '');
    delete request._wonkiNonce;
    response = cloudSyncHandleRequest_(request);
  } catch (err) {
    response = { success:false, message:'서버 처리 오류: ' + String(err && err.message ? err.message : err) };
  }
  if (nonce) return cloudSyncIframeReply_(response, nonce);
  return cloudSyncJson(response);
}

function cloudSyncHandleRequest_(body) {
  var action = String(body.action || '');
  if (action === 'ping') return {success:true, message:'서버 연결 성공'};
  if (action === 'visitor_register') return cloudSyncDailyVisitorRegister_(body.visitorId);
  if (action === 'visitor_count') return cloudSyncDailyVisitorCount_();
  if (action === 'guestbook_list') return cloudSyncGuestbookList_();
  if (action === 'guestbook_save') return cloudSyncGuestbookSave_(body.items);
  if (action === 'owner_message_save') return cloudSyncOwnerMessageSave_(body.name, body.message);
  if (action === 'member_login') {
    var loginResult = cloudSyncMemberLogin(body.name, body.pin).getContent();
    return JSON.parse(loginResult);
  }
  if (action === 'member_layout_save') return cloudSyncMemberLayoutSave_(body.name, body.pin, body.layout);
  if (action === 'general_member_register') return cloudSyncGeneralMemberRegister_(body.member, body.nickname, body.password);
  if (action === 'general_member_login') return cloudSyncGeneralMemberLogin_(body.nickname, body.password);
  if (action === 'general_member_layout_save') return cloudSyncGeneralMemberLayoutSave_(body.sessionToken, body.layout);
  var protectedActions = ['admin_list','admin_save','admin_friend_list','admin_friend_save','owner_message_list'];
  if (protectedActions.indexOf(action) >= 0) {
    var admin = cloudSyncVerifyAdmin(body.idToken);
    if (!admin.success) return admin;
    if (action === 'admin_list') return JSON.parse(cloudSyncAdminList().getContent());
    if (action === 'admin_save') return JSON.parse(cloudSyncAdminSave(body.members).getContent());
    if (action === 'admin_friend_list') return cloudSyncAdminFriendList_();
    if (action === 'admin_friend_save') return cloudSyncAdminFriendSave_(body.members);
    if (action === 'owner_message_list') return cloudSyncOwnerMessageList_();
  }
  return {success:false, message:'지원하지 않는 요청입니다: ' + action};
}

function cloudSyncIframeReply_(payload, nonce) {
  var safePayload = JSON.stringify(payload).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  var safeNonce = JSON.stringify(String(nonce || ''));
  var page = '<!doctype html><html><head><meta charset="utf-8"></head><body><script>' +
    'top.postMessage({type:"wonki-cloud-response",nonce:' + safeNonce + ',payload:' + safePayload + '},"*");' +
    '<\/script></body></html>';
  return HtmlService.createHtmlOutput(page).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function cloudSyncGetAuxSheet_(name, headers) {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID 설정이 없습니다.');
  var ss = SpreadsheetApp.openById(id);
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.getRange(1,1,1,headers.length).setValues([headers]); sh.setFrozenRows(1); }
  else if (sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  return sh;
}

/* 일반회원 전용 시트: 기존 상상코칭 회원 시트와 분리 */
function cloudSyncAdminFriendList_() {
  var sh = cloudSyncGetAuxSheet_('일반회원정보',['회원 ID','저장일시','일반회원 데이터']);
  var last = sh.getLastRow(), members=[];
  if (last >= 2) sh.getRange(2,1,last-1,3).getValues().forEach(function(row){
    if (!row[0]) return;
    try { var m=JSON.parse(row[2] || '{}'); m.id=String(row[0]); members.push(m); } catch (_) {}
  });
  return {success:true,members:members};
}
function cloudSyncAdminFriendSave_(members) {
  if (!Array.isArray(members) || members.length > 3000) return {success:false,message:'일반회원 자료 형식 또는 회원 수를 확인해 주세요.'};
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh=cloudSyncGetAuxSheet_('일반회원정보',['회원 ID','저장일시','일반회원 데이터']);
    var last=sh.getLastRow(), rowMap={};
    if(last>=2) sh.getRange(2,1,last-1,3).getValues().forEach(function(row,i){if(row[0])rowMap[String(row[0])]=i+2;});
    var added=0,updated=0;
    members.forEach(function(m){
      if(!m || !m.id) return;
      var id=String(m.id), values=[id,new Date(),JSON.stringify(m)];
      if(rowMap[id]) { sh.getRange(rowMap[id],1,1,3).setValues([values]); updated++; }
      else { sh.appendRow(values); added++; }
    });
    return {success:true,addedCount:added,updatedCount:updated,message:'일반회원 클라우드 저장 완료'};
  } finally { lock.releaseLock(); }
}


/* 최초 1회 편집기에서 실행하여 방명록 이메일 알림 권한을 승인합니다. */
function cloudSyncAuthorizeEmail() {
  var quota = MailApp.getRemainingDailyQuota();
  Logger.log('이메일 발송 가능 잔여 수신자 수: ' + quota);
  return quota;
}

/* 공개 방명록 시트. 신규 글만 관리자에게 이메일 알림 */
function cloudSyncGuestbookList_() {
  var sh=cloudSyncGetAuxSheet_('방명록',['글 ID','작성일시','이름','내용','표시일자']);
  var last=sh.getLastRow(), items=[];
  if(last>=2) sh.getRange(2,1,last-1,5).getValues().forEach(function(r){
    if(!r[0])return;
    items.push({id:String(r[0]),createdAt:r[1] instanceof Date?r[1].toISOString():String(r[1]||''),name:String(r[2]||'익명'),message:String(r[3]||''),date:String(r[4]||'')});
  });
  items.sort(function(a,b){return String(a.createdAt).localeCompare(String(b.createdAt));});
  return {success:true,items:items};
}
function cloudSyncGuestbookSave_(items) {
  if(!Array.isArray(items) || items.length>500) return {success:false,message:'방명록 자료 형식을 확인해 주세요.'};
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh=cloudSyncGetAuxSheet_('방명록',['글 ID','작성일시','이름','내용','표시일자']);
    var last=sh.getLastRow(), ids={};
    if(last>=2) sh.getRange(2,1,last-1,1).getDisplayValues().forEach(function(r){if(r[0])ids[String(r[0])]=true;});
    var added=[];
    items.forEach(function(x){
      if(!x || typeof x.message!=='string')return;
      var id=String(x.id || '').trim(); if(!id || ids[id])return;
      var name=String(x.name||'익명').slice(0,80), message=String(x.message).slice(0,3000);
      if(!message.trim())return;
      var created=String(x.createdAt||x.date||new Date().toISOString());
      sh.appendRow([id,new Date(),name,message,String(x.date||created)]);
      ids[id]=true; added.push({id:id,name:name,message:message,date:String(x.date||created),createdAt:created});
    });
    if(added.length) cloudSyncNotifyGuestbook_(added);
    return {success:true,items:cloudSyncGuestbookList_().items,addedCount:added.length};
  } finally { lock.releaseLock(); }
}
function cloudSyncNotifyGuestbook_(items) {
  var props=PropertiesService.getScriptProperties();
  var recipients=String(props.getProperty('ADMIN_EMAILS')||props.getProperty('ADMIN_EMAIL')||'').split(',').map(function(x){return x.trim();}).filter(Boolean);
  if(!recipients.length)return;
  var body=items.map(function(x){return '작성자: '+x.name+'\\n작성일: '+x.date+'\\n내용: '+x.message;}).join('\\n\\n---\\n\\n');
  recipients.forEach(function(to){try{MailApp.sendEmail(to,'[원기랜드] 새 방명록 글이 등록되었습니다',body);}catch(err){Logger.log('방명록 알림 이메일 실패: '+err);}});
}


/* 방문자 집계: 브라우저별 고유 ID를 기준으로 한국시간 날짜마다 1회만 누적 */
function cloudSyncDailyVisitorSheet_(){
  return cloudSyncGetAuxSheet_('일일방문자기록',['방문자 ID','방문일(KST)','최초 방문시각']);
}
function cloudSyncDailyVisitorCount_(){
  var sh=cloudSyncDailyVisitorSheet_();
  var last=sh.getLastRow();
  return {success:true,total:Math.max(0,last-1)};
}
function cloudSyncDailyVisitorRegister_(visitorId){
  visitorId=String(visitorId||'').trim();
  if(!/^[a-zA-Z0-9_-]{16,100}$/.test(visitorId))return {success:false,message:'방문자 식별값이 올바르지 않습니다.'};
  var lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    var sh=cloudSyncDailyVisitorSheet_();
    var today=Utilities.formatDate(new Date(),'Asia/Seoul','yyyy-MM-dd');
    var last=sh.getLastRow();
    if(last>=2){
      var rows=sh.getRange(2,1,last-1,2).getDisplayValues();
      for(var i=0;i<rows.length;i++){
        if(String(rows[i][0])===visitorId && String(rows[i][1])===today){
          return {success:true, counted:false, total:last-1, date:today, message:'오늘은 이미 방문 집계되었습니다.'};
        }
      }
    }
    sh.appendRow([visitorId,today,new Date()]);
    return {success:true,counted:true,total:sh.getLastRow()-1,date:today,message:'오늘 방문이 집계되었습니다.'};
  } finally { lock.releaseLock(); }
}

/* 주인장에게 한마디: Google Sheets에 저장하여 기기 간 공유 */
function cloudSyncOwnerMessageSheet_(){return cloudSyncGetAuxSheet_('주인장메시지함',['메시지 ID','작성일시','닉네임','메시지','확인여부']);}
function cloudSyncOwnerMessageSave_(name,message){name=String(name||'').trim().slice(0,30);message=String(message||'').trim().slice(0,500);if(!name||!message)return {success:false,message:'닉네임과 메시지를 입력해 주세요.'};var lock=LockService.getScriptLock();lock.waitLock(20000);try{var sh=cloudSyncOwnerMessageSheet_(),id='msg_'+Utilities.getUuid(),created=new Date();sh.appendRow([id,created,name,message,'미확인']);return {success:true,item:{id:id,createdAt:created.toISOString(),name:name,message:message,read:false}};}finally{lock.releaseLock();}}
function cloudSyncOwnerMessageList_(){var sh=cloudSyncOwnerMessageSheet_(),last=sh.getLastRow(),items=[];if(last>=2)sh.getRange(2,1,last-1,5).getValues().forEach(function(r){if(!r[0])return;items.push({id:String(r[0]),createdAt:r[1] instanceof Date?r[1].toISOString():String(r[1]||''),name:String(r[2]||'익명'),message:String(r[3]||''),read:String(r[4]||'')==='확인'});});items.sort(function(a,b){return String(a.createdAt).localeCompare(String(b.createdAt));});return {success:true,items:items};}

/* JSON 응답 */
function cloudSyncJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


/* 저장 시트 확인 */
function cloudSyncGetStore() {
  var id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  if (!id) {
    throw new Error('SPREADSHEET_ID 설정이 없습니다.');
  }

  var ss = SpreadsheetApp.openById(id);
  var sheet = ss.getSheetByName('회원데이터_JSON');

  if (!sheet) {
    throw new Error('회원데이터_JSON 시트가 없습니다.');
  }

  return sheet;
}


/* 구글 관리자 계정 인증 */
function cloudSyncVerifyAdmin(idToken) {
  if (!idToken) return { success:false, message:'구글 로그인이 필요합니다.' };
  var props = PropertiesService.getScriptProperties();
  var clientId = props.getProperty('GOOGLE_CLIENT_ID');
  var allowed = String(props.getProperty('ADMIN_EMAILS') || props.getProperty('ADMIN_EMAIL') || '')
    .split(',').map(function(x){ return x.trim().toLowerCase(); }).filter(Boolean);
  if (!clientId || !allowed.length) return { success:false, message:'관리자 인증 설정(GOOGLE_CLIENT_ID, ADMIN_EMAIL 또는 ADMIN_EMAILS)을 확인해 주세요.' };
  var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions:true });
  if (response.getResponseCode() !== 200) return { success:false, message:'구글 로그인 인증에 실패했습니다.' };
  var info = JSON.parse(response.getContentText());
  var email = String(info.email || '').toLowerCase();
  if (info.aud !== clientId || allowed.indexOf(email) < 0 || String(info.email_verified) !== 'true' || Number(info.exp) <= Math.floor(Date.now()/1000)) {
    return { success:false, message:'관리자 계정이 확인되지 않았습니다.' };
  }
  return { success:true, email:info.email };
}

/* 회원 데이터 불러오기 */
function cloudSyncAdminList() {
  var sheet = cloudSyncGetStore();
  var lastRow = sheet.getLastRow();
  var members = [];

  if (lastRow >= 2) {
    var rows = sheet.getRange(2, 1, lastRow - 1, 8).getValues();

    rows.forEach(function(row) {
      if (!row[0]) return;

      var data = {};

      try {
        data = JSON.parse(row[4] || '{}');
      } catch (err) {
        data = {};
      }

      data.id = String(row[0]);
      data.name = String(row[1]);

      members.push(data);
    });
  }

  return cloudSyncJson({
    success: true,
    members: members
  });
}


/* 회원 데이터 저장 */

function cloudSyncAdminSave(members) {
  if (!Array.isArray(members)) {
    return cloudSyncJson({
      success: false,
      message: '회원 자료 형식이 올바르지 않습니다.'
    });
  }

  if (members.length > 500) {
    return cloudSyncJson({
      success: false,
      message: '한 번에 저장할 수 있는 회원 수를 초과했습니다.'
    });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var sheet = cloudSyncGetStore();
    var lastRow = sheet.getLastRow();
    var rowMap = {};

    // 기존 회원의 행 번호 확인
    if (lastRow >= 2) {
      var existing = sheet.getRange(
        2, 1, lastRow - 1, 8
      ).getValues();

      existing.forEach(function(row, index) {
        if (row[0]) {
          rowMap[String(row[0])] = {
            rowNumber: index + 2,
            data: row
          };
        }
      });
    }

    var savedCount = 0;
    var addedCount = 0;
    var updatedCount = 0;

    members.forEach(function(member) {
      if (!member || !member.name) return;

      var id = String(member.id || '').trim();

      if (!id) {
        throw new Error('회원 ID가 없는 자료가 있습니다.');
      }

      var old = rowMap[id];
      var oldData = old ? old.data : [];

      var pin = String(member.memberPassword || '');
      var salt = old ? String(oldData[2] || '') : '';
      var hash = old ? String(oldData[3] || '') : '';

      // 새 비밀번호가 입력된 경우에만 해시 갱신
      
if (pin) {
  if (pin.length < 4 || pin.length > 128) {
    throw new Error('회원 비밀번호는 4자리 이상 입력해 주세요.');
  }

  salt = Utilities.getUuid();
  hash = cloudSyncHash(pin, salt);
}


      var safeData = JSON.parse(JSON.stringify(member));
      delete safeData.memberPassword;

      var rowValues = [
        id,
        String(member.name),
        salt,
        hash,
        JSON.stringify(safeData),
        old ? Number(oldData[5] || 0) : 0,
        old ? oldData[6] : '',
        new Date()
      ];

      if (old) {
        sheet.getRange(old.rowNumber, 1, 1, 8)
          .setValues([rowValues]);
        updatedCount++;
      } else {
        sheet.appendRow(rowValues);
        addedCount++;
      }

      savedCount++;
    });

    return cloudSyncJson({
      success: true,
      savedCount: savedCount,
      addedCount: addedCount,
      updatedCount: updatedCount,
      message: '회원 자료 저장 완료. 기존 회원 자료는 보존되었습니다.'
    });

  } finally {
    lock.releaseLock();
  }
}

    

/* 회원 비밀번호 해시 */
function cloudSyncHash(pin, salt) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + ':' + pin,
    Utilities.Charset.UTF_8
  );

  return bytes.map(function(b) {
    var v = (b + 256) % 256;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}


/* 회원 본인 로그인 */
function cloudSyncMemberLogin(name, pin) {
  name = String(name || '').trim();
  pin = String(pin || '');

 if (!name || pin.length < 4 || pin.length > 128) {
    return cloudSyncJson({
      success: false,
      message: '이름과 회원 비밀번호를 확인해 주세요.'
    });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var sheet = cloudSyncGetStore();
    var lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      return cloudSyncJson({
        success: false,
        message: '등록된 회원 자료가 없습니다.'
      });
    }

    var rows = sheet.getRange(
      2, 1, lastRow - 1, 8
    ).getValues();

    for (var i = 0; i < rows.length; i++) {
    var row = rows[i];

      if (String(row[1]).trim() !== name) continue;

      var now = Date.now();
      var lockedUntil = row[6] ? new Date(row[6]).getTime() : 0;

      if (lockedUntil > now) {
        return cloudSyncJson({
          success: false,
          message: '로그인 시도가 잠시 제한되었습니다.'
        });
      }

      var correct = cloudSyncHash(pin, String(row[2])) ===
        String(row[3]);

      var sheetRow = i + 2;

      if (!correct) {
        var failures = Number(row[5] || 0) + 1;
        var lockUntil = '';

        if (failures >= 5) {
          failures = 0;
          lockUntil = new Date(now + 15 * 60 * 1000);
        }

        sheet.getRange(sheetRow, 6).setValue(failures);
        sheet.getRange(sheetRow, 7).setValue(lockUntil);

        return cloudSyncJson({
          success: false,
          message: '회원 비밀번호가 일치하지 않습니다.'
        });
      }

      sheet.getRange(sheetRow, 6).setValue(0);
      sheet.getRange(sheetRow, 7).clearContent();

      var data = JSON.parse(row[4] || '{}');

      return cloudSyncJson({
        success: true,
        member: data
      });
    }

    return cloudSyncJson({
      success: false,
      message: '회원 정보를 찾을 수 없습니다.'
    });

  } finally {
    lock.releaseLock();
  }
}
function cloudSyncTestGetResponse() {
  Logger.log('전역 doGet 연결 확인은 웹 앱 주소에서 ?action=ping 으로 확인하세요.');
}


function cloudSyncTestSafeSave() {
  var result = cloudSyncAdminSave([]);
  Logger.log(result.getContent());
}

function cloudSyncTestAdminSecurity() {
  var result = cloudSyncVerifyAdmin('');

  Logger.log(JSON.stringify({
    test: '로그인하지 않은 사용자의 관리자 접근',
    success: result.success,
    message: result.message,
    expected: false,
    passed: result.success === false
  }));
}






/* 회원 본인 인증 후 가구 배치도만 갱신: 다른 개인정보와 비밀번호 해시는 보존 */
function cloudSyncMemberLayoutSave_(name, pin, layout) {
  name = String(name || '').trim(); pin = String(pin || '');
  if (!name || pin.length < 4 || pin.length > 128) return {success:false,message:'회원 이름과 비밀번호를 확인해 주세요.'};
  if (typeof layout !== 'string' || layout.length > 200000) return {success:false,message:'가구 배치 자료 형식 또는 크기를 확인해 주세요.'};
  var parsed;
  try { parsed = JSON.parse(layout); } catch (e) { return {success:false,message:'가구 배치 자료를 해석할 수 없습니다.'}; }
  if (!parsed || typeof parsed !== 'object' || !parsed.layouts) return {success:false,message:'가구 배치 자료에 방 정보가 없습니다.'};
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sheet = cloudSyncGetStore(), last = sheet.getLastRow();
    if (last < 2) return {success:false,message:'등록된 회원 자료가 없습니다.'};
    var rows = sheet.getRange(2,1,last-1,8).getValues();
    for (var i=0;i<rows.length;i++) {
      var row=rows[i]; if (String(row[1]).trim() !== name) continue;
      var lockedUntil = row[6] ? new Date(row[6]).getTime() : 0;
      if (lockedUntil > Date.now()) return {success:false,message:'로그인 시도가 잠시 제한되었습니다.'};
      if (cloudSyncHash(pin,String(row[2])) !== String(row[3])) {
        var failures=Number(row[5]||0)+1, lockUntil='';
        if (failures>=5) { failures=0; lockUntil=new Date(Date.now()+15*60*1000); }
        sheet.getRange(i+2,6).setValue(failures); sheet.getRange(i+2,7).setValue(lockUntil);
        return {success:false,message:'회원 비밀번호가 일치하지 않습니다.'};
      }
      var data=JSON.parse(row[4]||'{}'); data.layout=JSON.stringify(parsed); data.updatedAt=new Date().toISOString();
      sheet.getRange(i+2,5).setValue(JSON.stringify(data));
      sheet.getRange(i+2,6).setValue(0); sheet.getRange(i+2,7).clearContent(); sheet.getRange(i+2,8).setValue(new Date());
      return {success:true,member:data,message:'가구 배치가 클라우드에 저장되었습니다.'};
    }
    return {success:false,message:'회원 정보를 찾을 수 없습니다.'};
  } finally { lock.releaseLock(); }
}


/* 일반회원 닉네임/비밀번호 계정 및 본인 가구배치 저장 */
function cloudSyncGeneralMemberSheet_() {
  var sh = cloudSyncGetAuxSheet_('일반회원정보',
    ['회원 ID','저장일시','일반회원 데이터','로그인 닉네임','비밀번호 솔트','비밀번호 해시','로그인 실패횟수','로그인 잠금시각']);
  var headers = ['회원 ID','저장일시','일반회원 데이터','로그인 닉네임','비밀번호 솔트','비밀번호 해시','로그인 실패횟수','로그인 잠금시각'];
  if (sh.getMaxColumns() < headers.length) sh.insertColumnsAfter(sh.getMaxColumns(), headers.length-sh.getMaxColumns());
  var current = sh.getRange(1,1,1,headers.length).getDisplayValues()[0];
  if (current[0] !== headers[0] || current[1] !== headers[1] || current[2] !== headers[2]) {
    throw new Error('일반회원정보 시트의 기존 열 제목이 달라 자동 변경하지 않았습니다.');
  }
  // 기존 3열 구조를 유지하면서 추가 인증 열만 준비
  sh.getRange(1,4,1,5).setValues([headers.slice(3)]);
  return sh;
}
function cloudSyncGeneralMemberRegister_(member, nickname, password) {
  if (!member || !member.id || !member.name) return {success:false,message:'일반회원 등록 정보가 부족합니다.'};
  nickname = String(nickname || '').trim();
  password = String(password || '');
  if (!/^[가-힣a-zA-Z0-9_]{2,20}$/.test(nickname)) return {success:false,message:'닉네임은 한글·영문·숫자·밑줄로 2~20자 입력해 주세요.'};
  if (!/^\d{4,8}$/.test(password)) return {success:false,message:'비밀번호는 숫자 4~8자리로 입력해 주세요.'};
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh=cloudSyncGeneralMemberSheet_(), last=sh.getLastRow();
    var rows=last>=2?sh.getRange(2,1,last-1,8).getValues():[];
    var id=String(member.id);
    for(var i=0;i<rows.length;i++){
      if(String(rows[i][3]||'').toLowerCase()===nickname.toLowerCase() && String(rows[i][0])!==id)
        return {success:false,message:'이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해 주세요.'};
      if(String(rows[i][0])===id && rows[i][5])
        return {success:false,message:'이미 계정이 등록된 회원입니다. 로그인해 주세요.'};
    }
    var salt=Utilities.getUuid();
    var safe=JSON.parse(JSON.stringify(member));
    delete safe.password; delete safe.memberPassword; delete safe.pin;
    sh.appendRow([id,new Date(),JSON.stringify(safe),nickname,salt,cloudSyncHash(password,salt),0,'']);
    return {success:true,message:'일반회원 계정 등록 완료',nickname:nickname};
  } finally {lock.releaseLock();}
}
function cloudSyncGeneralMemberLogin_(nickname,password) {
  nickname=String(nickname||'').trim(); password=String(password||'');
  if(!nickname || !/^\d{4,8}$/.test(password)) return {success:false,message:'닉네임과 숫자 4~8자리 비밀번호를 확인해 주세요.'};
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh=cloudSyncGeneralMemberSheet_(), last=sh.getLastRow();
    if(last<2)return {success:false,message:'등록된 일반회원 계정이 없습니다.'};
    var rows=sh.getRange(2,1,last-1,8).getValues();
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      if(String(r[3]||'').toLowerCase()!==nickname.toLowerCase())continue;
      var now=Date.now(), until=r[7]?new Date(r[7]).getTime():0;
      if(until>now)return {success:false,message:'로그인 시도가 잠시 제한되었습니다. 15분 후 다시 시도해 주세요.'};
      if(cloudSyncHash(password,String(r[4]||''))!==String(r[5]||'')){
        var fails=Number(r[6]||0)+1, lockUntil='';
        if(fails>=5){fails=0;lockUntil=new Date(now+15*60*1000);}
        sh.getRange(i+2,7,1,2).setValues([[fails,lockUntil]]);
        return {success:false,message:'닉네임 또는 비밀번호가 일치하지 않습니다.'};
      }
      sh.getRange(i+2,7,1,2).setValues([[0,'']]);
      var token=Utilities.getUuid()+Utilities.getUuid();
      CacheService.getScriptCache().put('general_session_'+token,String(r[0]),21600);
      var member=JSON.parse(r[2]||'{}'); member.id=String(r[0]); member.nickname=String(r[3]);
      return {success:true,sessionToken:token,member:member,message:'로그인되었습니다.'};
    }
    return {success:false,message:'닉네임 또는 비밀번호가 일치하지 않습니다.'};
  } finally {lock.releaseLock();}
}
function cloudSyncGeneralMemberLayoutSave_(sessionToken,layout) {
  sessionToken=String(sessionToken||'');
  var memberId=CacheService.getScriptCache().get('general_session_'+sessionToken);
  if(!memberId)return {success:false,message:'로그인이 만료되었습니다. 다시 로그인해 주세요.'};
  if(typeof layout!=='string'||layout.length>200000)return {success:false,message:'가구 배치 자료 형식 또는 크기를 확인해 주세요.'};
  var parsed; try{parsed=JSON.parse(layout);}catch(e){return {success:false,message:'가구 배치 자료를 해석할 수 없습니다.'};}
  if(!parsed||typeof parsed!=='object'||!parsed.layouts)return {success:false,message:'가구 배치 자료에 방 정보가 없습니다.'};
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    var sh=cloudSyncGeneralMemberSheet_(),last=sh.getLastRow();
    if(last<2)return {success:false,message:'일반회원 자료가 없습니다.'};
    var rows=sh.getRange(2,1,last-1,8).getValues();
    for(var i=0;i<rows.length;i++){
      if(String(rows[i][0])!==memberId)continue;
      var data=JSON.parse(rows[i][2]||'{}');
      data.layout=JSON.stringify(parsed);data.updatedAt=new Date().toISOString();
      sh.getRange(i+2,2).setValue(new Date());
      sh.getRange(i+2,3).setValue(JSON.stringify(data));
      return {success:true,member:data,message:'내 집 꾸미기 배치가 클라우드에 저장되었습니다.'};
    }
    return {success:false,message:'회원 계정을 찾을 수 없습니다.'};
  } finally {lock.releaseLock();}
}
/* 1단계: 확인만 합니다. 아무것도 바꾸지 않습니다. */
function wonkiPreviewOwnerMadeGeneralMembers() {
  var sh = cloudSyncGeneralMemberSheet_();
  var last = sh.getLastRow();
  if (last < 2) { Logger.log('일반회원 자료가 없습니다.'); return; }
  var rows = sh.getRange(2, 1, last - 1, 8).getValues();
  rows.forEach(function (r, i) {
    var data = {}; try { data = JSON.parse(r[2] || '{}'); } catch (e) {}
    var hasAccount = !!String(r[5] || '').trim();
    Logger.log('행' + (i + 2) + ' | 이름: ' + (data.name || '') +
      ' | 닉네임: ' + (r[3] || '(없음)') + ' | ' +
      (hasAccount ? '계정 있음 - 변경하지 않음' : '계정 없음 - 대상 가능'));
  });
}

/* 2단계: 목록에 적은 이름 중 "계정이 없는" 회원에게만 닉네임(=이름)과 비밀번호 0000을 설정합니다. */
function wonkiCreateAccountsForOwnerMade() {
  var TARGET_NAMES = ['노송희'];   // 직접 만드신 회원 이름을 여기에 추가하세요
  var INITIAL_PASSWORD = '0000';

  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = cloudSyncGeneralMemberSheet_();
    var last = sh.getLastRow();
    if (last < 2) { Logger.log('일반회원 자료가 없습니다.'); return; }
    var rows = sh.getRange(2, 1, last - 1, 8).getValues();

    var used = {};
    rows.forEach(function (r) {
      var n = String(r[3] || '').trim().toLowerCase();
      if (n) used[n] = true;
    });

    rows.forEach(function (r, i) {
      var data = {}; try { data = JSON.parse(r[2] || '{}'); } catch (e) {}
      var name = String(data.name || '').trim();
      if (TARGET_NAMES.indexOf(name) < 0) return;

      if (String(r[5] || '').trim() || String(r[3] || '').trim()) {
        Logger.log('건너뜀(이미 계정 있음): 행' + (i + 2) + ' ' + name);
        return;
      }
      if (!/^[가-힣a-zA-Z0-9_]{2,20}$/.test(name) || used[name.toLowerCase()]) {
        Logger.log('건너뜀(닉네임 사용 불가 또는 중복): 행' + (i + 2) + ' ' + name);
        return;
      }
      var salt = Utilities.getUuid();
      sh.getRange(i + 2, 4, 1, 5).setValues([[
        name, salt, cloudSyncHash(INITIAL_PASSWORD, salt), 0, ''
      ]]);
      used[name.toLowerCase()] = true;
      Logger.log('설정 완료: 행' + (i + 2) + ' 닉네임 ' + name + ' / 비밀번호 ' + INITIAL_PASSWORD);
    });
  } finally { lock.releaseLock(); }
}
