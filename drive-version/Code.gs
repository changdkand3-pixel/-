// Separate project: do not replace the existing member/sync Apps Script.
const DRIVE_FOLDER_ID = 'PASTE_DRIVE_FOLDER_ID';
const SITE_ORIGIN = 'https://hinsrolin.neocities.org';
function doGet(e) {
  const p = (e && e.parameter) || {};
  const nonce = String(p.nonce || '');
  const asset = String(p.asset || '');
  let result = {type:'wonki-drive-asset', nonce:nonce, asset:asset};
  try {
    if (!/^[a-f0-9-]{20,80}$/i.test(nonce)) throw new Error('Invalid request.');
    if (!/^[a-f0-9]{64}\.(png|jpg|webp|mp3)$/.test(asset)) throw new Error('Invalid asset.');
    if (DRIVE_FOLDER_ID === 'PASTE_DRIVE_FOLDER_ID') throw new Error('Set DRIVE_FOLDER_ID in this separate project.');
    const files = DriveApp.getFolderById(DRIVE_FOLDER_ID).getFilesByName(asset);
    if (!files.hasNext()) throw new Error('Asset not found: '+asset);
    const file = files.next();
    if (files.hasNext()) throw new Error('Duplicate asset filename.');
    if (file.getSize() > 16000000) throw new Error('Asset exceeds supported size.');
    result.base64 = Utilities.base64Encode(file.getBlob().getBytes());
  } catch (err) { result.error = String(err.message || err); }
  const json = JSON.stringify(result).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>window.top.postMessage('+json+','+JSON.stringify(SITE_ORIGIN)+');</script>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
