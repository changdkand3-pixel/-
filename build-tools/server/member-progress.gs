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
