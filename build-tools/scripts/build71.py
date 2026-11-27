import json, base64, io
from PIL import Image
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'

CH = {'goku71': ['손오공', 334], 'piccolo71': ['피콜로', 322], 'gohan71': ['손오반', 1307], 'raditz71': ['라데츠', 1220],
      'goku416_71': ['손오공', 416], 'piccolo408_71': ['피콜로', 408], 'goku924_71': ['손오공 (에네르기파)', 924], 'piccolo1330_71': ['피콜로 (마관광살포)', 1330]}
OX = 0
ROWS = [
    (397, 298, [('goku71', 133, 330), ('piccolo71', 337, 530), ('gohan71', 538, 727), ('raditz71', 830, 1065)]),
    (778, 304, [('goku416_71', 133, 390), ('piccolo408_71', 403, 662), ('raditz71', 797, 1065)]),
    (1163, 340, [('goku924_71', 133, 386), ('piccolo1330_71', 400, 647), ('raditz71', 790, 1062)]),
]
SCENES = [[120, y - 5, 960, h + 10] for y, h, _ in ROWS]
CELLS = [[[c[0], c[1] - OX, (c[3] if len(c) > 3 else y), c[2] - c[1], ((c[4] - c[3]) if len(c) > 3 else h)] for c in row] for y, h, row in ROWS]
CAST = {str(i + 1): [c[0] for c in row] for i, row in enumerate(CELLS)}
BOSSES = {k: list(v) for k, v in CAST.items()}  # 143차: 손오공도 상대로 고를 수 있게

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# poster
im = Image.open(d + 'drivem11/poster.png').convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6)
poster = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
hd = {k: b64(d + f'g71/{k}.webp', 'image/webp') for k in CH}

# math problems
P = json.load(open(d + 'probs71.json'))
answers = open(d + 'ans71.txt').read().strip().split(',')
answers = [a.replace(';', ',') for a in answers]
assert len(answers) == 100, len(answers)
types = [P[str(n)]['type'] for n in range(1, 101)]
images = []
for n in range(1, 101):
    q = Image.open(d + f'q71/q{n:03d}.png').convert('RGB')
    if q.width > 930: q = q.resize((930, round(q.height * 930 / q.width)), Image.LANCZOS)
    buf = io.BytesIO(); q.save(buf, 'WEBP', quality=82, method=6); images.append('data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode())
POOL = {'1': list(range(1, 52)), '2': list(range(52, 78)), '3': list(range(78, 101))}
assert sorted(sum(POOL.values(), [])) == list(range(1, 101))
UNITS = [['1', '수와 연산'], ['2', '문자와 식'], ['3', '좌표평면과 그래프']]
pack = {'PT': {k: 'grade71:' + k for k in CH}, 'CH': CH, 'CAST': CAST, 'UNITS': UNITS,
        'UCOL': ['linear-gradient(#58d36f,#1f8a3a)', 'linear-gradient(#6bbcff,#1a63d4)', 'linear-gradient(#ffb454,#d86a0a)', 'linear-gradient(#b779ff,#6a2bb8)', 'linear-gradient(#ff7a6b,#c0271b)', 'linear-gradient(#65d3ca,#137d89)'],
        'POOL': POOL,
        'AREAS': [{'n': '수와 연산', 'e': '🔢', 'x': 25, 'y': 80}, {'n': '문자와 식', 'e': '✏️', 'x': 70, 'y': 50}, {'n': '좌표평면·그래프', 'e': '📈', 'x': 30, 'y': 18}],
        'PICK': ['goku71', 'piccolo71', 'gohan71'],
        'Q': {'images': images, 'answers': answers, 'types': types, 'format': 'data-url', 'source': '중1-1 원본 유형 학습지 100문항'},
        'BOSSES': BOSSES}
open(d + 'g71/math71.json', 'w', encoding='utf-8').write(json.dumps(pack, ensure_ascii=False).replace('</', '<\\/'))

A = {'poster': poster, 'width': 1093, 'height': 1590, 'characters': CH, 'scenes': SCENES, 'cells': CELLS, 'cast': CAST, 'hd': hd}
js = json.dumps(A, ensure_ascii=False).replace('</', '<\\/')
html = '''<style id="wk71-style">
.wk71-board{border:3px solid #e6bd36;border-radius:16px;overflow:hidden;background:#0e3771}
.wk71-photo{display:block;width:100%;height:auto}
.wk71-title{display:flex!important;align-items:center!important;width:100%!important;gap:12px!important;background:linear-gradient(90deg,#ffe15a,#fff5c0)!important;color:#192330!important;border:0!important;border-radius:0!important;padding:10px!important;font:bold clamp(13px,2.5vw,22px) system-ui!important;text-align:left!important;cursor:pointer}
.wk71-title b{background:#133e67;color:#fff;padding:5px 12px;border-radius:6px}
.wk71-title small{margin-left:auto;font-size:11px!important}
.wk71-scene{position:relative}
.wk71-op{position:absolute!important;background:transparent!important;border:2px solid transparent!important;border-radius:10px!important;cursor:pointer;padding:0!important;min-height:0!important;margin:0!important}
.wk71-op:hover,.wk71-op:focus-visible{border-color:#ffe259!important;box-shadow:0 0 14px #ffee69}
.wk71-op span{position:absolute;bottom:0;left:0;right:0;background:#103458e8;color:#fff;font:800 clamp(8px,1.3vw,12px) system-ui;padding:2px;opacity:0;transition:opacity .15s}
.wk71-op:hover span,.wk71-op:focus-visible span{opacity:1}
.wk71-locked{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#08102b99;color:#fff49b;font-weight:bold;pointer-events:none}
.wk71-portrait{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
</style>
<script id="wonki-grade71-script">(()=>{const A=__A__;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
function init(){if(document.getElementById('wkGrade71Sheet'))return;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=document.createElementNS(ns,'defs'),image=document.createElementNS(ns,'image');image.id='wkGrade71Sheet';image.setAttribute('href',A.poster);image.setAttribute('width',A.width);image.setAttribute('height',A.height);defs.appendChild(image);s.appendChild(defs);document.body.appendChild(s);}
function pic(r,label){return '<svg class="wk71-photo" viewBox="'+r.join(' ')+'" role="img" aria-label="'+esc(label)+'"><use href="#wkGrade71Sheet"/></svg>';}
function render(subject,rows){init();return '<section class="wk71-board" aria-label="중1-1 '+esc(subject)+' 단원 목차">'+pic([0,0,A.width,335],'드래곤볼 중1-1 CONTENTS')+rows.map((row,i)=>{const n=row.scene??i,sc=A.scenes[n];const cells=A.cells[n].filter(c=>row.enemies.includes(c[0]));return '<article><button type="button" class="wk71-title" '+row.action+'><b>'+ROMAN[n]+'</b><span>'+esc(row.title)+'</span><small>'+esc(row.status)+'</small></button><div class="wk71-scene">'+pic(sc,row.title+' 캐릭터')+(row.locked?'<span class="wk71-locked">🔒 앞 단원 수련 후 열림</span>':'')+cells.map(([id,x,y,w,h])=>'<button type="button" class="wk71-op" '+row.enemyAction(id)+' aria-disabled="'+!!row.locked+'" aria-label="'+esc(A.characters[id][0])+' '+esc(subject)+' 대결 시작" style="left:'+((x-sc[0])/sc[2]*100)+'%;top:'+((y-sc[1])/sc[3]*100)+'%;width:'+(w/sc[2]*100)+'%;height:'+(h/sc[3]*100)+'%"><span>'+esc(A.characters[id][0])+' · 대결</span></button>').join('')+'</div></article>';}).join('')+pic([0,1505,A.width,85],'수학의 힘이 너의 미래를 만든다!')+'</section>';}
const prev=window.wonkiGrade21Portrait;window.wonkiGrade21Portrait=function(id,grade,name){if(grade==='중1-1'&&A.hd[id])return '<img class="wk71-portrait" src="'+A.hd[id]+'" alt="'+esc(name||A.characters[id][0])+'" decoding="async">';return prev?.(id,grade,name)||null;};
window.WonkiGrade71={render,characters:A.characters,cast:A.cast};})();</script>
'''.replace('__A__', js)
open(d + 'g71/g71.html', 'w', encoding='utf-8').write(html)
import os
print('math71.json', os.path.getsize(d + 'g71/math71.json'), 'g71.html', os.path.getsize(d + 'g71/g71.html'))
