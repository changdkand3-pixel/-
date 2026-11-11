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
  if (action === 'general_member_progress_load') return cloudSyncGeneralMemberProgressLoad_(body.sessionToken);
  if (action === 'general_member_progress_save') return cloudSyncGeneralMemberProgressSave_(body.sessionToken, body.progress);
  if (action === 'owner_park_load') return cloudSyncOwnerParkLoad_();
  if (action === 'visit_log') return cloudSyncVisitLog_(body);
  if (action === 'park_showcase_save') return cloudSyncParkShowcaseSave_(body.name, body.message, body.park, body.visitorId);
  var protectedActions = ['admin_list','admin_save','admin_friend_list','admin_friend_save','owner_message_list','admin_park_list','admin_visitor_stats','owner_park_save','admin_visit_log'];
  if (protectedActions.indexOf(action) >= 0) {
    var admin = cloudSyncVerifyAdmin(body.idToken);
    if (!admin.success) return admin;
    if (action === 'admin_list') return JSON.parse(cloudSyncAdminList().getContent());
    if (action === 'admin_save') return JSON.parse(cloudSyncAdminSave(body.members).getContent());
    if (action === 'admin_friend_list') return cloudSyncAdminFriendList_();
    if (action === 'admin_friend_save') return cloudSyncAdminFriendSave_(body.members);
    if (action === 'owner_message_list') return cloudSyncOwnerMessageList_();
    if (action === 'admin_park_list') return cloudSyncAdminParkList_();
    if (action === 'admin_visitor_stats') return cloudSyncAdminVisitorStats_();
    if (action === 'owner_park_save') return cloudSyncOwnerParkSave_(body.park);
    if (action === 'admin_visit_log') return cloudSyncAdminVisitLog_();
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

/* ===== 63차: 일반회원 진행 기록(공원 건물·수학·영어) 클라우드 저장 =====
 * 회원 서버 Apps Script 프로젝트(Code.gs가 있는 프로젝트)에 이 파일을 새 스크립트 파일로 추가합니다.
 * 그리고 Code.gs의 cloudSyncHandleRequest_ 안,
 *   if (action === 'general_member_layout_save') ...
 * 줄 바로 아래에 다음 두 줄을 넣습니다.
 *   if (action === 'general_member_progress_load') return cloudSyncGeneralMemberProgressLoad_(body.sessionToken);
 *   if (action === 'general_member_progress_save') return cloudSyncGeneralMemberProgressSave_(body.sessionToken, body.progress);
 * 저장 장소: 같은 스프레드시트의 새 시트 '일반회원진행기록' (회원 ID 한 줄에 자료를 4만 자씩 나눠 저장)
 */
var WONKI_PROGRESS_SHEET_ = '일반회원진행기록';
var WONKI_PROGRESS_CHUNK_ = 40000;
var WONKI_PROGRESS_MAX_ = 1600000;

function cloudSyncProgressSheet_() {
  return cloudSyncGetAuxSheet_(WONKI_PROGRESS_SHEET_, ['회원 ID', '저장일시', '조각 수', '진행 기록']);
}

function cloudSyncProgressMember_(sessionToken) {
  var memberId = CacheService.getScriptCache().get('general_session_' + String(sessionToken || ''));
  return memberId ? String(memberId) : '';
}

function cloudSyncGeneralMemberProgressLoad_(sessionToken) {
  var memberId = cloudSyncProgressMember_(sessionToken);
  if (!memberId) return {success: false, message: '로그인이 만료되었습니다. 다시 로그인해 주세요.'};
  var sh = cloudSyncProgressSheet_(), last = sh.getLastRow();
  if (last < 2) return {success: true, progress: '', savedAt: ''};
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) !== memberId) continue;
    var head = sh.getRange(i + 2, 2, 1, 2).getValues()[0];
    var n = Number(head[1] || 0), text = '';
    if (n > 0) text = sh.getRange(i + 2, 4, 1, n).getValues()[0].map(function (c) { c = String(c); return c.charAt(0) === '~' ? c.slice(1) : c; }).join('');
    var savedAt = head[0] instanceof Date ? head[0].toISOString() : String(head[0] || '');
    return {success: true, progress: text, savedAt: savedAt};
  }
  return {success: true, progress: '', savedAt: ''};
}

function cloudSyncGeneralMemberProgressSave_(sessionToken, progress) {
  var memberId = cloudSyncProgressMember_(sessionToken);
  if (!memberId) return {success: false, message: '로그인이 만료되었습니다. 다시 로그인해 주세요.'};
  if (typeof progress !== 'string' || progress.length > WONKI_PROGRESS_MAX_) return {success: false, message: '진행 기록 형식 또는 크기를 확인해 주세요.'};
  try { var parsed = JSON.parse(progress); if (!parsed || typeof parsed !== 'object' || !parsed.keys) throw new Error(); }
  catch (e) { return {success: false, message: '진행 기록을 해석할 수 없습니다.'}; }
  var chunks = [];
  for (var p = 0; p < progress.length; p += WONKI_PROGRESS_CHUNK_) chunks.push('~' + progress.slice(p, p + WONKI_PROGRESS_CHUNK_)); /* ~ : 칸이 수식으로 바뀌지 않게 */
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = cloudSyncProgressSheet_(), last = sh.getLastRow(), row = 0;
    if (last >= 2) {
      var ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === memberId) { row = i + 2; break; }
    }
    if (!row) { row = sh.getLastRow() + 1; }
    var need = 3 + chunks.length;
    if (sh.getMaxColumns() < need) sh.insertColumnsAfter(sh.getMaxColumns(), need - sh.getMaxColumns());
    var width = Math.max(sh.getLastColumn(), need);
    var values = [memberId, new Date(), chunks.length].concat(chunks);
    while (values.length < width) values.push('');
    sh.getRange(row, 1, 1, width).setValues([values]);
    return {success: true, savedAt: new Date().toISOString(), message: '진행 기록이 클라우드에 저장되었습니다.'};
  } finally { lock.releaseLock(); }
}

/* ===== 64차: 방문자 "내 공원 자랑하기" + 관리자 "회원 공원 구경하기" ===== */
var WONKI_SHOWCASE_SHEET_ = '공원자랑';
function cloudSyncShowcaseSheet_() {
  return cloudSyncGetAuxSheet_(WONKI_SHOWCASE_SHEET_, ['보낸 시각', '이름', '한마디', '방문자 ID', '건물 수', '조각 수', '공원 자료']);
}
function cloudSyncParkShowcaseSave_(name, message, park, visitorId) {
  name = String(name || '').trim().slice(0, 20); message = String(message || '').trim().slice(0, 100);
  visitorId = String(visitorId || '').slice(0, 80);
  if (!name) return {success: false, message: '이름을 적어 주세요.'};
  if (typeof park !== 'string' || park.length > 200000) return {success: false, message: '공원 자료 형식 또는 크기를 확인해 주세요.'};
  var count = 0;
  try { var p = JSON.parse(park); var list = p && p.state && p.state.buildings; if (!Array.isArray(list) || !list.length || list.length > 1000) throw new Error(); count = list.length; }
  catch (e) { return {success: false, message: '보낼 건물이 없습니다.'}; }
  var cache = CacheService.getScriptCache(), ck = 'showcase_' + (visitorId || name);
  if (cache.get(ck)) return {success: false, message: '조금 전에 보냈어요. 1분 뒤에 다시 보내 주세요.'};
  var chunks = [];
  for (var i = 0; i < park.length; i += 40000) chunks.push('~' + park.slice(i, i + 40000));
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = cloudSyncShowcaseSheet_(), need = 6 + chunks.length;
    if (sh.getMaxColumns() < need) sh.insertColumnsAfter(sh.getMaxColumns(), need - sh.getMaxColumns());
    var row = [new Date(), name, message, visitorId, count, chunks.length].concat(chunks);
    sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  } finally { lock.releaseLock(); }
  cache.put(ck, '1', 60);
  return {success: true, message: '공원을 원기랜드 관리자에게 보냈어요!'};
}
function cloudSyncJoinChunks_(cells) {
  return cells.map(function (c) { c = String(c); return c.charAt(0) === '~' ? c.slice(1) : c; }).join('');
}
function cloudSyncAdminParkList_() {
  var nick = {};
  try {
    var ms = cloudSyncGeneralMemberSheet_(), ml = ms.getLastRow();
    if (ml >= 2) ms.getRange(2, 1, ml - 1, 4).getValues().forEach(function (r) {
      var d = {}; try { d = JSON.parse(r[2] || '{}'); } catch (_) {}
      nick[String(r[0])] = {nickname: String(r[3] || ''), name: String(d.name || '')};
    });
  } catch (_) {}
  var members = [], ps = cloudSyncProgressSheet_(), pl = ps.getLastRow();
  if (pl >= 2) {
    var width = Math.max(4, ps.getLastColumn());
    ps.getRange(2, 1, pl - 1, width).getValues().forEach(function (r) {
      if (!r[0]) return; var n = Number(r[2] || 0);
      var info = nick[String(r[0])] || {};
      members.push({id: String(r[0]), nickname: info.nickname || '', name: info.name || '', savedAt: r[1] instanceof Date ? r[1].toISOString() : String(r[1] || ''), progress: cloudSyncJoinChunks_(r.slice(3, 3 + n))});
    });
  }
  var showcases = [], ss = cloudSyncShowcaseSheet_(), sl = ss.getLastRow();
  if (sl >= 2) {
    var from = Math.max(2, sl - 99), w2 = Math.max(7, ss.getLastColumn());
    ss.getRange(from, 1, sl - from + 1, w2).getValues().forEach(function (r) {
      if (!r[1]) return; var n = Number(r[5] || 0);
      showcases.push({time: r[0] instanceof Date ? r[0].toISOString() : String(r[0] || ''), name: String(r[1]), message: String(r[2] || ''), count: Number(r[4] || 0), park: cloudSyncJoinChunks_(r.slice(6, 6 + n))});
    });
    showcases.reverse();
  }
  return {success: true, members: members, showcases: showcases};
}

/* ===== 65차: 관리자 메뉴 방문자 통계 (오늘·7일·30일·전체, 최근 30일 날짜별) ===== */
function cloudSyncAdminVisitorStats_() {
  var sh = cloudSyncDailyVisitorSheet_(), last = sh.getLastRow(), byDay = {};
  if (last >= 2) sh.getRange(2, 2, last - 1, 1).getDisplayValues().forEach(function (r) {
    var d = String(r[0] || '').trim(); if (d) byDay[d] = (byDay[d] || 0) + 1;
  });
  var days = [], week = 0, month = 0, now = Date.now();
  for (var i = 29; i >= 0; i--) {
    var d = Utilities.formatDate(new Date(now - i * 86400000), 'Asia/Seoul', 'yyyy-MM-dd'), c = byDay[d] || 0;
    days.push({day: d, count: c}); month += c; if (i < 7) week += c;
  }
  return {success: true, today: days[29].count, week: week, month: month, total: Math.max(0, last - 1), days: days};
}

/* ===== 66차: 주인장 공원 (주인장만 올리기, 누구나 둘러보기) ===== */
var WONKI_OWNER_PARK_SHEET_ = '주인장공원';
function cloudSyncOwnerParkSheet_() {
  return cloudSyncGetAuxSheet_(WONKI_OWNER_PARK_SHEET_, ['저장일시', '조각 수', '공원']);
}
function cloudSyncOwnerParkLoad_() {
  var cache = CacheService.getScriptCache(), hit = cache.get('wk66_owner_park');
  if (hit) { try { return JSON.parse(hit); } catch (_) {} }
  var sh = cloudSyncOwnerParkSheet_(), result = {success: true, park: '', savedAt: ''};
  if (sh.getLastRow() >= 2) {
    var head = sh.getRange(2, 1, 1, 2).getValues()[0], n = Number(head[1] || 0);
    if (n > 0) result.park = cloudSyncJoinChunks_(sh.getRange(2, 3, 1, n).getValues()[0]);
    result.savedAt = head[0] instanceof Date ? head[0].toISOString() : String(head[0] || '');
  }
  var text = JSON.stringify(result);
  if (text.length < 90000) cache.put('wk66_owner_park', text, 600);
  return result;
}
function cloudSyncOwnerParkSave_(park) {
  if (typeof park !== 'string' || park.length > 1000000) return {success: false, message: '주인장 공원 형식 또는 크기를 확인해 주세요.'};
  try { var d = JSON.parse(park); if (!d || !Array.isArray(d.buildings)) throw new Error(); }
  catch (e) { return {success: false, message: '주인장 공원 자료를 해석할 수 없습니다.'}; }
  var chunks = [];
  for (var p = 0; p < park.length; p += 40000) chunks.push('~' + park.slice(p, p + 40000));
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = cloudSyncOwnerParkSheet_(), need = 2 + chunks.length;
    if (sh.getMaxColumns() < need) sh.insertColumnsAfter(sh.getMaxColumns(), need - sh.getMaxColumns());
    var width = Math.max(sh.getLastColumn(), need), now = new Date();
    var values = [now, chunks.length].concat(chunks);
    while (values.length < width) values.push('');
    sh.getRange(2, 1, 1, width).setValues([values]);
    CacheService.getScriptCache().remove('wk66_owner_park');
    return {success: true, savedAt: now.toISOString(), message: '주인장 공원을 올렸습니다.'};
  } finally { lock.releaseLock(); }
}

/* ===== 70차: 방문 기록 (일반회원은 닉네임·시각, 방문자는 들어온 곳·기기만) ===== */
var WONKI_VISIT_SHEET_ = '방문기록';
var WONKI_VISIT_SOURCES_ = ['카카오톡','인스타그램','페이스북','네이버','밴드','구글','다음','기타 링크','직접 입력·즐겨찾기'];
var WONKI_VISIT_DEVICES_ = ['휴대폰','태블릿','컴퓨터'];
function cloudSyncVisitSheet_() {
  return cloudSyncGetAuxSheet_(WONKI_VISIT_SHEET_, ['방문시각', '구분', '회원 ID', '닉네임', '이름', '들어온 곳', '기기']);
}
function cloudSyncVisitLog_(body) {
  var source = WONKI_VISIT_SOURCES_.indexOf(String(body.source || '')) >= 0 ? String(body.source) : '기타 링크';
  var device = WONKI_VISIT_DEVICES_.indexOf(String(body.device || '')) >= 0 ? String(body.device) : '컴퓨터';
  var cache = CacheService.getScriptCache(), memberId = '';
  if (body.sessionToken) memberId = String(cache.get('general_session_' + String(body.sessionToken)) || '');
  var visitor = String(body.visitorId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100);
  /* 같은 회원은 30분, 같은 방문자는 6시간에 한 번만 기록 */
  var dedupe = memberId ? 'wk70_m_' + memberId : (visitor ? 'wk70_v_' + visitor : '');
  if (dedupe && cache.get(dedupe)) return {success: true, logged: false};
  var nickname = '', name = '';
  if (memberId) {
    try {
      var ms = cloudSyncGeneralMemberSheet_(), ml = ms.getLastRow();
      if (ml >= 2) {
        var rows = ms.getRange(2, 1, ml - 1, 4).getValues();
        for (var i = 0; i < rows.length; i++) if (String(rows[i][0]) === memberId) {
          var d = {}; try { d = JSON.parse(rows[i][2] || '{}'); } catch (_) {}
          nickname = String(rows[i][3] || d.nickname || ''); name = String(d.name || ''); break;
        }
      }
    } catch (_) {}
  }
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    cloudSyncVisitSheet_().appendRow([new Date(), memberId ? '회원' : '방문자', memberId, nickname, name, source, device]);
  } finally { lock.releaseLock(); }
  if (dedupe) cache.put(dedupe, '1', memberId ? 1800 : 21600);
  return {success: true, logged: true};
}
function cloudSyncAdminVisitLog_() {
  var sh = cloudSyncVisitSheet_(), last = sh.getLastRow(), now = Date.now();
  var members = [], src = {}, dev = {}, total = 0;
  if (last >= 2) {
    var from = Math.max(2, last - 4999);
    var rows = sh.getRange(from, 1, last - from + 1, 7).getValues();
    for (var i = rows.length - 1; i >= 0; i--) {
      var r = rows[i], t = r[0] instanceof Date ? r[0].getTime() : Date.parse(r[0]);
      if (!t) continue;
      if (r[1] === '회원' && members.length < 200) members.push({time: new Date(t).toISOString(), id: String(r[2]), nickname: String(r[3] || ''), name: String(r[4] || ''), source: String(r[5] || ''), device: String(r[6] || '')});
      if (now - t <= 30 * 86400000) {
        total++;
        var s = String(r[5] || '기타 링크'), d = String(r[6] || '컴퓨터');
        src[s] = (src[s] || 0) + 1; dev[d] = (dev[d] || 0) + 1;
      }
    }
  }
  return {success: true, members: members, sources: src, devices: dev, total30: total};
}
