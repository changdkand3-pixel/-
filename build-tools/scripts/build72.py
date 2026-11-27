import json, base64, io
from PIL import Image
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'

CH = {'yamcha72': ['야무치', 1300], 'tien72': ['천진반', 1830], 'krillin72': ['크리링', 1770], 'chiaotzu72': ['차오즈', 610], 'piccolo72': ['피콜로', 3500],
      'gohan72': ['손오반', 1080], 'gohan2800_72': ['손오반 (마섬광)', 2800], 'saibaman72': ['재배맨', 1200], 'nappa72': ['네퍼', 4000],
      'yamcha1480_72': ['야무치 (에네르기파)', 1480], 'tien2600_72': ['천진반 (기공포)', 2600], 'krillin1770_72': ['크리링 (확산탄)', 1770],
      'goku72': ['손오공', 5000], 'goku8100_72': ['손오공', 8100], 'goku12150_72': ['손오공 (계왕권)', 12150], 'nappa7500_72': ['네퍼', 7500],
      'goku16200_72': ['손오공 (계왕권 2배)', 16200], 'goku24300_72': ['손오공 (계왕권 3배)', 24300], 'goku26000_72': ['손오공 (계왕권 3배 에네르기파)', 26000], 'goku35000_72': ['손오공 (계왕권 4배 에네르기파)', 35000],
      'vegeta72': ['베지터', 16500], 'vegeta18000_72': ['베지터', 18000], 'vegeta27000_72': ['베지터', 27000],
      'goku200000_72': ['손오공 (원기옥)', 200000], 'gohan5200_72': ['손오반', 5200], 'gohan4500_72': ['손오반 (괴물원숭이)', 4500], 'krillin1770b_72': ['크리링 (기원참)', 1770],
      'krillin20000_72': ['크리링 (손오공의 원기옥)', 20000], 'yajirobe72': ['야지로베', 430], 'vegeta7200_72': ['베지터 (파워볼)', 7200], 'vegeta72000_72': ['베지터 (괴물원숭이)', 72000]}
OX = 0
ROWS = [
    (387, 343, [('yamcha72', 100, 222, 387, 583), ('tien72', 228, 338, 387, 583), ('krillin72', 344, 452, 387, 583), ('chiaotzu72', 457, 555, 387, 598), ('piccolo72', 560, 670, 387, 600), ('gohan72', 675, 798, 387, 582), ('saibaman72', 850, 967, 387, 695), ('nappa72', 972, 1083, 387, 683),
                ('yamcha1480_72', 100, 222, 583, 730), ('tien2600_72', 228, 338, 583, 730), ('krillin1770_72', 344, 452, 583, 730), ('gohan2800_72', 675, 798, 582, 730)]),
    (798, 192, [('goku72', 130, 292), ('goku8100_72', 295, 455), ('goku12150_72', 458, 625), ('nappa72', 723, 898), ('nappa7500_72', 902, 1078)]),
    (1060, 202, [('goku8100_72', 128, 222), ('goku12150_72', 225, 318), ('goku16200_72', 320, 415), ('goku24300_72', 417, 515), ('goku26000_72', 517, 617), ('goku35000_72', 620, 720), ('vegeta72', 787, 882), ('vegeta18000_72', 885, 980), ('vegeta27000_72', 983, 1083)]),
    (1330, 202, [('goku200000_72', 130, 238), ('gohan72', 242, 323), ('gohan5200_72', 327, 408), ('gohan4500_72', 412, 508), ('krillin1770b_72', 512, 597), ('krillin20000_72', 600, 692), ('yajirobe72', 697, 790), ('vegeta7200_72', 855, 960), ('vegeta72000_72', 962, 1083)]),
]
SCENES = [[92, y - 5, 1000, h + 10] for y, h, _ in ROWS]
CELLS = [[[c[0], c[1] - OX, (c[3] if len(c) > 3 else y), c[2] - c[1], ((c[4] - c[3]) if len(c) > 3 else h)] for c in row] for y, h, row in ROWS]
CAST = {str(i + 1): [c[0] for c in row] for i, row in enumerate(CELLS)}
BOSSES = {k: list(v) for k, v in CAST.items()}  # 143차: 손오공도 상대로 고를 수 있게

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# poster
im = Image.open(d + 'drivem12/poster.png').convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6)
poster = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
hd = {k: b64(d + f'g72/{k}.webp', 'image/webp') for k in CH}

# math problems
P = json.load(open(d + 'probs72.json'))
answers = open(d + 'ans72.txt').read().strip().split(',')
answers = [a.replace(';', ',') for a in answers]
assert len(answers) == 100, len(answers)
types = [P[str(n)]['type'] for n in range(1, 101)]
images = []
for n in range(1, 101):
    q = Image.open(d + f'q72/q{n:03d}.png').convert('RGB')
    if q.width > 930: q = q.resize((930, round(q.height * 930 / q.width)), Image.LANCZOS)
    buf = io.BytesIO(); q.save(buf, 'WEBP', quality=82, method=6); images.append('data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode())
POOL = {'1': list(range(1, 41)), '2': list(range(41, 66)), '3': list(range(66, 91)), '4': list(range(91, 101))}
assert sorted(sum(POOL.values(), [])) == list(range(1, 101))
UNITS = [['1', '기본 도형'], ['2', '평면도형'], ['3', '입체도형'], ['4', '통계']]
pack = {'PT': {k: 'grade72:' + k for k in CH}, 'CH': CH, 'CAST': CAST, 'UNITS': UNITS,
        'UCOL': ['linear-gradient(#58d36f,#1f8a3a)', 'linear-gradient(#6bbcff,#1a63d4)', 'linear-gradient(#ffb454,#d86a0a)', 'linear-gradient(#b779ff,#6a2bb8)', 'linear-gradient(#ff7a6b,#c0272b)', 'linear-gradient(#65d3ca,#137d89)'],
        'POOL': POOL,
        'AREAS': [{'n': '기본 도형', 'e': '📐', 'x': 25, 'y': 82}, {'n': '평면도형', 'e': '🔷', 'x': 70, 'y': 60}, {'n': '입체도형', 'e': '🧊', 'x': 30, 'y': 38}, {'n': '통계', 'e': '📊', 'x': 70, 'y': 15}],
        'PICK': ['yamcha72', 'tien72', 'krillin72', 'goku72'],
        'Q': {'images': images, 'answers': answers, 'types': types, 'format': 'data-url', 'source': '중1-2 원본 유형 학습지 100문항'},
        'BOSSES': BOSSES}
open(d + 'g72/math72.json', 'w', encoding='utf-8').write(json.dumps(pack, ensure_ascii=False).replace('</', '<\\/'))

A = {'poster': poster, 'width': 1104, 'height': 1590, 'characters': CH, 'scenes': SCENES, 'cells': CELLS, 'cast': CAST, 'hd': hd}
js = json.dumps(A, ensure_ascii=False).replace('</', '<\\/')
html = '''<style id="wk72-style">
.wk72-board{border:3px solid #e6bd36;border-radius:16px;overflow:hidden;background:#0e3772}
.wk72-photo{display:block;width:100%;height:auto}
.wk72-title{display:flex!important;align-items:center!important;width:100%!important;gap:12px!important;background:linear-gradient(90deg,#ffe15a,#fff5c0)!important;color:#192330!important;border:0!important;border-radius:0!important;padding:10px!important;font:bold clamp(13px,2.5vw,22px) system-ui!important;text-align:left!important;cursor:pointer}
.wk72-title b{background:#133e67;color:#fff;padding:5px 12px;border-radius:6px}
.wk72-title small{margin-left:auto;font-size:11px!important}
.wk72-scene{position:relative}
.wk72-op{position:absolute!important;background:transparent!important;border:2px solid transparent!important;border-radius:10px!important;cursor:pointer;padding:0!important;min-height:0!important;margin:0!important}
.wk72-op:hover,.wk72-op:focus-visible{border-color:#ffe259!important;box-shadow:0 0 14px #ffee69}
.wk72-op span{position:absolute;bottom:0;left:0;right:0;background:#103458e8;color:#fff;font:800 clamp(8px,1.3vw,12px) system-ui;padding:2px;opacity:0;transition:opacity .15s}
.wk72-op:hover span,.wk72-op:focus-visible span{opacity:1}
.wk72-locked{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#08102b99;color:#fff49b;font-weight:bold;pointer-events:none}
.wk72-portrait{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
</style>
<script id="wonki-grade72-script">(()=>{const A=__A__;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
function init(){if(document.getElementById('wkGrade72Sheet'))return;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=document.createElementNS(ns,'defs'),image=document.createElementNS(ns,'image');image.id='wkGrade72Sheet';image.setAttribute('href',A.poster);image.setAttribute('width',A.width);image.setAttribute('height',A.height);defs.appendChild(image);s.appendChild(defs);document.body.appendChild(s);}
function pic(r,label){return '<svg class="wk72-photo" viewBox="'+r.join(' ')+'" role="img" aria-label="'+esc(label)+'"><use href="#wkGrade72Sheet"/></svg>';}
function render(subject,rows){init();return '<section class="wk72-board" aria-label="중1-2 '+esc(subject)+' 단원 목차">'+pic([0,0,A.width,330],'드래곤볼 중1-2 CONTENTS')+rows.map((row,i)=>{const n=row.scene??i,sc=A.scenes[n];const cells=A.cells[n].filter(c=>row.enemies.includes(c[0]));return '<article><button type="button" class="wk72-title" '+row.action+'><b>'+ROMAN[n]+'</b><span>'+esc(row.title)+'</span><small>'+esc(row.status)+'</small></button><div class="wk72-scene">'+pic(sc,row.title+' 캐릭터')+(row.locked?'<span class="wk72-locked">🔒 앞 단원 수련 후 열림</span>':'')+cells.map(([id,x,y,w,h])=>'<button type="button" class="wk72-op" '+row.enemyAction(id)+' aria-disabled="'+!!row.locked+'" aria-label="'+esc(A.characters[id][0])+' '+esc(subject)+' 대결 시작" style="left:'+((x-sc[0])/sc[2]*100)+'%;top:'+((y-sc[1])/sc[3]*100)+'%;width:'+(w/sc[2]*100)+'%;height:'+(h/sc[3]*100)+'%"><span>'+esc(A.characters[id][0])+' · 대결</span></button>').join('')+'</div></article>';}).join('')+pic([0,1535,A.width,55],'수학의 힘이 너의 미래를 만든다!')+'</section>';}
const prev=window.wonkiGrade21Portrait;window.wonkiGrade21Portrait=function(id,grade,name){if(grade==='중1-2'&&A.hd[id])return '<img class="wk72-portrait" src="'+A.hd[id]+'" alt="'+esc(name||A.characters[id][0])+'" decoding="async">';return prev?.(id,grade,name)||null;};
window.WonkiGrade72={render,characters:A.characters,cast:A.cast};})();</script>
'''.replace('__A__', js)
open(d + 'g72/g72.html', 'w', encoding='utf-8').write(html)
import os
print('math72.json', os.path.getsize(d + 'g72/math72.json'), 'g72.html', os.path.getsize(d + 'g72/g72.html'))
