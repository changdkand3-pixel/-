"""업데이트 카드에 '지난 업데이트 보기'(1차부터 목록, 이전·다음 차수)를 넣습니다. 한 번만 실행합니다."""
import json, re, sys
p = sys.argv[1] if len(sys.argv) > 1 else 'build-tools/final.html'
s = open(p, encoding='utf-8').read()
assert 'WONKI_HISTORY' not in s, '이미 적용됨'

H = {
 48: {'d': '날짜 기록 없음', 'p': [], 'c': ['메인 지도와 이어지는 확장 땅', '9코스 공사중 표시', '지도 스크롤·확대(휠) 개선', '건물 이동·크기 조절 수정'], 's': [], 'm': '확장 땅이 생긴 원기랜드!'},
 49: {'d': '날짜 기록 없음', 'p': [], 'c': ['메인지도 원본 보존', '지도 이미지 겹침 제거·경계 개선', '지도 확대·축소·스크롤 유지', '1~8번 코스 선택 보존', '건설 카탈로그 1,000종'], 's': [], 'm': '건설 시스템 개선!'},
 50: {'d': '2026년 11월 10일', 'p': ['처음 설치한 건물이 지도에 바로 안 보임', '노란 테두리와 흐린 부분이 남아 있음', '방명록 창이 지도를 가림'], 'c': ['건물을 누르면 축소·확대·이동·삭제', '건물 종류 1,000종 (색 테마 10가지)', '확장 지도를 원본 지도와 자연스럽게 연결', '방명록 버튼을 방문자 수 옆에 고정'], 's': ['메인 화면에서 바로 건물 편집', '9코스 주변 지도 경계 정리', '동기화 실패 단계와 이유 안내'], 'm': '건물을 놓자마자 지도에 보이고,<br>누르면 바로 편집하는 원기랜드!'},
 51: {'d': '2026년 11월 11일', 'p': ['건물을 두 번 눌러도 이름을 바꿀 수 없음', '건물 짓기에서 고른 건물이 바로 안 나옴', '수정 38 표시가 남아 있음', '영어 문제가 학기마다 73~84개뿐'], 'c': ['건물을 두 번 누르면 이름 바꾸기', '건물 위 빨간 ✕로 삭제 · 끌어서 이동', '그림을 누르면 바로 배치 · ⤡로 크기 조절', '💾 저장 후 나가기 버튼', '영어 문제 학기마다 150개 이상'], 's': ['수정 38 표시 삭제', '영어 철자 고르기 문제 새로 추가'], 'm': '건물은 누르고 끌어서 바로 고치고,<br>영어는 학기마다 150문제 이상!'},
 52: {'d': '2026년 11월 11일', 'p': ['건물을 고칠 때 효과음이 남', '지도를 확대·축소할 때 효과음이 남', '동기화 실패 안내창이 화면을 가림'], 'c': ['건물 짓기·편집 효과음 끔', '지도 확대·축소 효과음 끔', '동기화 결과는 잠깐 뜨는 작은 알림으로'], 's': ['코스·영어·수학 효과음은 그대로'], 'm': '조용하게 건물을 짓고,<br>안내창 없이 깔끔하게 동기화!'},
 53: {'d': '2026년 11월 11일', 'p': ['전체 동기화가 느려짐', '동기화 완료 메시지가 나오지 않음'], 'c': ['회원자료와 방명록을 동시에 동기화', '방명록 대기 시간을 25초로 되돌림', '동기화 완료 메시지 다시 표시'], 's': ['실패할 때는 작은 알림만 표시'], 'm': '더 빠른 동기화,<br>완료되면 완료 메시지로 알려 줘요!'},
 54: {'d': '2026년 11월 11일', 'p': ['건물을 배치한 뒤에도 ✕ 버튼이 크게 보임', '수학·영어 초3-1이 아직 없음'], 'c': ['✕ 버튼은 건물을 눌렀을 때만 작게 표시', '수학 초3-1 원본 문제 100개 · 6단원', '영어 초3-1 드래곤볼 목차 그림으로 대결', '구글 드라이브 초3-1 캐릭터 그림 적용'], 's': ['초3-1 캐릭터 12명과 대결 가능'], 'm': '수학·영어 초3-1 오픈!<br>새 친구들과 수련을 시작해요!'},
 55: {'d': '2026년 11월 11일', 'p': ['동기화하면 서버가 바쁘다는 메시지', '새 건물이 확장 지역으로 안 옮겨짐', '문제 화면에 저장·윗단계 버튼이 없음'], 'c': ['서버가 응답 없으면 자동으로 3번까지 다시 시도', '확장 지역 어디든 건물 이동', '문제 화면에 ◀ 상대 선택 · 📚 단원 목록 · 💾 저장'], 's': ['동기화 결과에 실패 이유를 짧게 표시'], 'm': '어디든 건물을 놓고,<br>문제 풀다가도 바로 저장!'},
 56: {'d': '2026년 11월 11일', 'p': ['파일이 커져 Neocities 80MB 제한이 걱정됨'], 'c': ['그림·음악을 폴더 파일로 분리', 'HTML 파일 30MB → 6MB'], 's': ['기능은 55차와 똑같음'], 'm': '가벼워진 원기랜드!'},
 57: {'d': '2026년 11월 11일', 'p': ['무료 계정에서 mp3 파일을 올릴 수 없음', 'Neocities에 폴더째 올리기가 안 됨'], 'c': ['음악은 다시 HTML 안에 포함', '그림은 폴더 없이 HTML 옆에 바로 두기'], 's': ['HTML 한 개만 새로 올리면 됨'], 'm': '무료 계정에서도 문제없이!<br>HTML 한 개만 올리면 끝!'},
}

# 1) history data right after WONKI_UPDATE
m = re.search(r"var WONKI_UPDATE=\{[\s\S]*?summary:'[^']*'\n \};", s)
assert m
s = s[:m.end()] + '\n /* ===== 지난 업데이트 기록 (새 차수를 낼 때 방금 차수를 여기에 추가합니다) ===== */\n var WONKI_HISTORY=' + json.dumps(H, ensure_ascii=False) + ';\n var WONKI_FIRST_RECORD=48;' + s[m.end():]

# 2) build(): paint any 차수, with history navigation
old_start = " function build(){\n  var o=document.getElementById('wkUpdatePoster');if(o)return o;"
assert old_start in s
i = s.index(old_start); j = s.index(" function show(){")
build = r''' var SEC=[['요청·문제','📋','🏗️','#3f9cf0','#1f63c4','#e3f2ff'],['변경 사항','⚙️','🎡','#b06be6','#7b3fc4','#f6e9ff'],['지금 상태','💻','📝','#49c063','#23913f','#e6f9e8']];
 function entry(no){if(no===WONKI_UPDATE.no)return WONKI_UPDATE;var h=WONKI_HISTORY[no];if(!h)return null;return {no:no,date:h.d,summary:h.m,sections:[h.p,h.c,h.s].map(function(items,k){var z=SEC[k];return {label:z[0],icon:z[1],deco:z[2],c:z[3],d:z[4],bg:z[5],items:items};}).filter(function(x){return x.items.length;})};}
 var view=WONKI_UPDATE.no,listMode=false;
 function sectionsHTML(u){return u.sections.map(function(s){return '<section class="wkp-sec" style="--c:'+s.c+';--d:'+s.d+';--bg:'+s.bg+'"><div class="wkp-tag"><b aria-hidden="true">'+s.icon+'</b><span>'+esc(s.label)+'</span></div><ul>'+s.items.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul><div class="wkp-deco" aria-hidden="true">'+s.deco+'</div></section>';}).join('')+'<div class="wkp-sum"><b>📢 '+u.no+'차 핵심 요약</b><p>'+u.summary+'</p></div>';}
 function listHTML(){var cur=WONKI_UPDATE.no,b='<div class="wkp-list"><h3>📜 지난 업데이트 (1차 ~ '+cur+'차)</h3><div class="wkp-grid">';for(var k=1;k<=cur;k++){var ok=!!entry(k);b+='<button type="button" data-wkp-no="'+k+'" class="'+(ok?'':'none ')+(k===view?'on':'')+'"'+(ok?'':' title="기록 없음"')+'>'+k+'차</button>';}return b+'</div><p class="wkp-note">1~'+(WONKI_FIRST_RECORD-1)+'차는 예전 업데이트 내용이 파일에 남아 있지 않아 회색으로 표시됩니다. 눌러도 "기록 없음"이 나옵니다.</p></div>';}
 function paint(o){
  var u=entry(view)||{no:view,date:'기록 없음',sections:[],summary:''},n=String(view).padStart(2,'0');
  var body=listMode?listHTML():(u.sections.length?sectionsHTML(u):'<div class="wkp-empty">📭 '+view+'차 업데이트는 기록이 남아 있지 않아요.<br><small>'+WONKI_FIRST_RECORD+'차부터 내용을 볼 수 있어요.</small></div>');
  o.innerHTML='<article class="wkp" style="--sky:url('+ART.sky+');--plaza:url('+ART.plaza+')">'+
   '<button type="button" class="wkp-x" aria-label="업데이트 안내 닫기">×</button>'+
   '<header class="wkp-head"><span class="wkp-medal l" style="background-image:url('+ART.wheel+')"></span><img class="wkp-rabbit" alt="" aria-hidden="true" src="'+ART.rabbit+'">'+
   '<h2 class="wkp-brand">웰컴투 원기랜드</h2><br><span class="wkp-ribbon">WonkiLand</span>'+
   '<div class="wkp-title"><i>🌿</i><span>'+(listMode?'지난 업데이트 모아 보기':'제'+n+'차 업데이트 안내')+'</span><i style="transform:scaleX(-1)">🌿</i></div>'+
   (listMode?'':'<div class="wkp-date">📅 업데이트 일자 : '+esc(u.date)+(view!==WONKI_UPDATE.no?' · 지난 업데이트':'')+'</div>')+'</header>'+
   '<nav class="wkp-hist" aria-label="지난 업데이트 보기"><button type="button" data-wkp="prev" '+(view<=1||listMode?'disabled':'')+'>◀ 이전 차수</button><button type="button" data-wkp="list" class="'+(listMode?'on':'')+'">📜 전체 목록</button><button type="button" data-wkp="next" '+(view>=WONKI_UPDATE.no||listMode?'disabled':'')+'>다음 차수 ▶</button>'+(view!==WONKI_UPDATE.no||listMode?'<button type="button" data-wkp="latest">⭐ 최신 '+WONKI_UPDATE.no+'차</button>':'')+'</nav>'+
   '<div class="wkp-body">'+body+'</div>'+
   '<footer class="wkp-foot"><div class="wkp-act"><button type="button" class="wkp-ok">확인</button><label><input type="checkbox" class="wkp-hide"> 오늘 하루 보지 않기</label></div></footer></article>';
  function close(){try{if(o.querySelector('.wkp-hide').checked)localStorage.setItem(KEY,today());}catch(_){}o.hidden=true;}
  o.querySelector('.wkp-x').onclick=close;o.querySelector('.wkp-ok').onclick=close;o._close=close;
  o.querySelectorAll('[data-wkp]').forEach(function(b){b.onclick=function(){var a=b.dataset.wkp;if(a==='prev'){view=Math.max(1,view-1);listMode=false;}else if(a==='next'){view=Math.min(WONKI_UPDATE.no,view+1);listMode=false;}else if(a==='list'){listMode=!listMode;}else{view=WONKI_UPDATE.no;listMode=false;}paint(o);o.querySelector('.wkp').scrollTop=0;};});
  o.querySelectorAll('[data-wkp-no]').forEach(function(b){b.onclick=function(){view=+b.dataset.wkpNo;listMode=false;paint(o);o.querySelector('.wkp').scrollTop=0;};});
 }
 function build(){
  var o=document.getElementById('wkUpdatePoster');if(o)return o;
  o=document.createElement('div');o.id='wkUpdatePoster';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','원기랜드 업데이트 안내');o.hidden=true;
  paint(o);document.body.appendChild(o);
  o.addEventListener('click',function(e){if(e.target===o)o._close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!o.hidden)o._close();});
  return o;
 }
'''
s = s[:i] + build + s[j:]
s = s.replace(" function show(){var o=build();o.hidden=false;", " function show(){var o=build();view=WONKI_UPDATE.no;listMode=false;paint(o);o.hidden=false;", 1)

# 3) styles
css = '''#wkUpdatePoster .wkp-hist{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:8px 10px 2px}
#wkUpdatePoster .wkp-hist button{min-height:36px;padding:6px 12px;border:2px solid #b694ea;border-radius:999px;background:#fff;color:#4b2a91;font:800 13px system-ui,sans-serif;cursor:pointer}
#wkUpdatePoster .wkp-hist button.on{background:#6c3fcf;color:#fff}
#wkUpdatePoster .wkp-hist button:disabled{opacity:.4;cursor:default}
#wkUpdatePoster .wkp-list{padding:8px 4px}
#wkUpdatePoster .wkp-list h3{margin:6px 0 10px;text-align:center;color:#4b2a91;font:900 18px system-ui,sans-serif}
#wkUpdatePoster .wkp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(58px,1fr));gap:6px}
#wkUpdatePoster .wkp-grid button{min-height:38px;border:2px solid #7c5bd6;border-radius:10px;background:#f3ecff;color:#3c2280;font:800 14px system-ui,sans-serif;cursor:pointer}
#wkUpdatePoster .wkp-grid button.none{border-color:#d0d4dc;background:#eef0f3;color:#9aa2ae}
#wkUpdatePoster .wkp-grid button.on{background:#6c3fcf;color:#fff;border-color:#6c3fcf}
#wkUpdatePoster .wkp-note{margin:10px 2px 4px;font:600 12px/1.5 system-ui,sans-serif;color:#5b6577}
#wkUpdatePoster .wkp-empty{margin:18px 6px;padding:26px 12px;border-radius:18px;border:3px dashed #c9cfd9;background:#fff;text-align:center;font:800 17px/1.6 system-ui,sans-serif;color:#4b5567}
#wkUpdatePoster .wkp-empty small{font-weight:600;color:#7b8494}
'''
k = s.index('#wkUpdateReopen{')
s = s[:k] + css + s[k:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
