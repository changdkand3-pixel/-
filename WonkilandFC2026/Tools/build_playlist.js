#!/usr/bin/env node
// Assets/Music/{menu,entrance,ceremony,user_added} 폴더를 스캔해 Assets/Music/playlist.js 생성.
// 사용 권리가 확보된 음악만 넣고, docs/RIGHTS_REGISTER.md 에 출처/라이선스를 기록할 것.
'use strict';
const fs = require('fs'), path = require('path');
const MUSIC = path.join(__dirname, '..', 'Assets', 'Music');
const EXT = /\.(mp3|ogg|wav|m4a|flac)$/i;
const out = {};
for (const cat of ['menu', 'entrance', 'ceremony', 'user_added']) {
  const dir = path.join(MUSIC, cat);
  out[cat] = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => EXT.test(f)).sort().map(f => `../Assets/Music/${cat}/${f}`) : [];
}
// user_added 곡은 메뉴 재생목록에도 포함
out.menu = out.menu.concat(out.user_added);
fs.writeFileSync(path.join(MUSIC, 'playlist.js'), '// 자동 생성: node Tools/build_playlist.js\nwindow.WFC_PLAYLIST = ' + JSON.stringify(out, null, 1) + ';\n');
console.log('playlist:', Object.entries(out).map(([k, v]) => `${k} ${v.length}`).join(', '));
