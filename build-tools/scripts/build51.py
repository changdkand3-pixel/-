import json, base64, io
from PIL import Image
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'

CH = {'goku51': ['손오공', 153], 'goku110_51': ['손오공', 110], 'goku198_51': ['손오공 (에네르기파)', 198], 'tambourine51': ['템버린', 137], 'roshi51': ['무천도사', 139], 'bulma51': ['부르마', 4],
      'yajirobe51': ['야지로베', 87], 'tien51': ['천진반', 148], 'chiaotzu51': ['차오즈', 94], 'pilaf51': ['피라후', 90], 'shu51': ['슈', 80], 'mai51': ['마이', 70], 'piano51': ['피아노', 65], 'piccolo51': ['피콜로 대마왕', 210], 'cymbal51': ['심벌', 82]}
OX = 101
ROWS = [
    (235, 150, [('goku110_51', 350, 515), ('tambourine51', 607, 800)]),
    (438, 147, [('goku51', 130, 210), ('roshi51', 215, 298), ('bulma51', 302, 385), ('yajirobe51', 390, 480), ('pilaf51', 562, 640), ('shu51', 645, 722), ('mai51', 727, 805), ('piano51', 810, 895), ('piccolo51', 898, 985), ('tambourine51', 988, 1055)]),
    (632, 150, [('goku51', 128, 200), ('yajirobe51', 205, 275), ('roshi51', 280, 350), ('tien51', 353, 423), ('bulma51', 428, 495), ('cymbal51', 565, 635), ('piccolo51', 638, 705), ('pilaf51', 710, 778), ('shu51', 780, 845), ('mai51', 850, 918), ('tambourine51', 920, 988), ('piano51', 992, 1055)]),
    (830, 148, [('goku51', 128, 200), ('goku198_51', 205, 298), ('yajirobe51', 302, 378), ('roshi51', 382, 452), ('tien51', 456, 525), ('tambourine51', 592, 660), ('piccolo51', 664, 732), ('pilaf51', 736, 802), ('shu51', 806, 870), ('mai51', 875, 940), ('piano51', 946, 1012)]),
    (1025, 145, [('goku51', 128, 305), ('yajirobe51', 310, 475), ('piccolo51', 565, 650), ('pilaf51', 655, 735), ('shu51', 740, 820), ('mai51', 825, 920), ('piano51', 925, 1028)]),
    (1220, 145, [('roshi51', 158, 253), ('tien51', 258, 355), ('chiaotzu51', 362, 472), ('piccolo51', 562, 650), ('piano51', 655, 735), ('pilaf51', 738, 820), ('shu51', 822, 920), ('mai51', 925, 1028)]),
]
SCENES = [[15, y - 5, 950, h + 10] for y, h, _ in ROWS]
CELLS = [[[i, x0 - OX, y, x1 - x0, h] for i, x0, x1 in row] for y, h, row in ROWS]
CAST = {str(i + 1): [c[0] for c in row] for i, row in enumerate(CELLS)}
BOSSES = {k: [x for x in v if x != 'goku51'] for k, v in CAST.items()}

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# poster
im = Image.open(d + 'drive51/poster51.png').convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6)
poster = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
hd = {k: b64(d + f'g51/{k}.webp', 'image/webp') for k in CH}

# math problems
P = json.load(open(d + 'probs51.json'))
answers = open(d + 'ans51.txt').read().strip().split(',')
answers = [a.replace(';', ',') for a in answers]
assert len(answers) == 100, len(answers)
types = [P[str(n)]['type'] for n in range(1, 101)]
images = []
for n in range(1, 101):
    q = Image.open(d + f'q51/q{n:03d}.png').convert('RGB')
    if q.width > 930: q = q.resize((930, round(q.height * 930 / q.width)), Image.LANCZOS)
    buf = io.BytesIO(); q.save(buf, 'WEBP', quality=82, method=6); images.append('data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode())
POOL = {'1': list(range(1, 15)), '2': list(range(15, 37)), '3': list(range(37, 43)), '4': list(range(43, 60)), '5': list(range(60, 65)), '6': list(range(65, 101))}
assert sorted(sum(POOL.values(), [])) == list(range(1, 101))
UNITS = [['1', '자연수의 혼합 계산'], ['2', '약수와 배수'], ['3', '규칙과 대응'], ['4', '약분과 통분'], ['5', '분수의 덧셈과 뺄셈'], ['6', '다각형의 둘레와 넓이']]
pack = {'PT': {k: 'grade51:' + k for k in CH}, 'CH': CH, 'CAST': CAST, 'UNITS': UNITS,
        'UCOL': ['linear-gradient(#58d36f,#1f8a3a)', 'linear-gradient(#6bbcff,#1a63d4)', 'linear-gradient(#ffb454,#d86a0a)', 'linear-gradient(#b779ff,#6a2bb8)', 'linear-gradient(#ff7a6b,#c0261b)', 'linear-gradient(#65d3ca,#137d89)'],
        'POOL': POOL,
        'AREAS': [{'n': '혼합 계산', 'e': '🧮', 'x': 20, 'y': 84}, {'n': '약수와 배수', 'e': '🔢', 'x': 72, 'y': 69}, {'n': '규칙과 대응', 'e': '🔁', 'x': 27, 'y': 54}, {'n': '약분과 통분', 'e': '🍕', 'x': 72, 'y': 39}, {'n': '분수 덧셈·뺄셈', 'e': '➕', 'x': 27, 'y': 24}, {'n': '둘레와 넓이', 'e': '📐', 'x': 72, 'y': 10}],
        'PICK': ['goku51', 'goku110_51', 'roshi51', 'bulma51', 'yajirobe51'],
        'Q': {'images': images, 'answers': answers, 'types': types, 'format': 'data-url', 'source': '초5-1 원본 유형 학습지 100문항'},
        'BOSSES': BOSSES}
open(d + 'g51/math51.json', 'w', encoding='utf-8').write(json.dumps(pack, ensure_ascii=False).replace('</', '<\\/'))

A = {'poster': poster, 'width': 982, 'height': 1510, 'characters': CH, 'scenes': SCENES, 'cells': CELLS, 'cast': CAST, 'hd': hd}
js = json.dumps(A, ensure_ascii=False).replace('</', '<\\/')
html = '''<style id="wk51-style">
.wk51-board{border:3px solid #e6bd36;border-radius:16px;overflow:hidden;background:#0e3751}
.wk51-photo{display:block;width:100%;height:auto}
.wk51-title{display:flex!important;align-items:center!important;width:100%!important;gap:12px!important;background:linear-gradient(90deg,#ffe15a,#fff5c0)!important;color:#192330!important;border:0!important;border-radius:0!important;padding:10px!important;font:bold clamp(13px,2.5vw,22px) system-ui!important;text-align:left!important;cursor:pointer}
.wk51-title b{background:#133e67;color:#fff;padding:5px 12px;border-radius:6px}
.wk51-title small{margin-left:auto;font-size:11px!important}
.wk51-scene{position:relative}
.wk51-op{position:absolute!important;background:transparent!important;border:2px solid transparent!important;border-radius:10px!important;cursor:pointer;padding:0!important;min-height:0!important;margin:0!important}
.wk51-op:hover,.wk51-op:focus-visible{border-color:#ffe259!important;box-shadow:0 0 14px #ffee69}
.wk51-op span{position:absolute;bottom:0;left:0;right:0;background:#103458e8;color:#fff;font:800 clamp(8px,1.3vw,12px) system-ui;padding:2px;opacity:0;transition:opacity .15s}
.wk51-op:hover span,.wk51-op:focus-visible span{opacity:1}
.wk51-locked{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#08102b99;color:#fff49b;font-weight:bold;pointer-events:none}
.wk51-portrait{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
</style>
<script id="wonki-grade51-script">(()=>{const A=__A__;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
function init(){if(document.getElementById('wkGrade51Sheet'))return;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=document.createElementNS(ns,'defs'),image=document.createElementNS(ns,'image');image.id='wkGrade51Sheet';image.setAttribute('href',A.poster);image.setAttribute('width',A.width);image.setAttribute('height',A.height);defs.appendChild(image);s.appendChild(defs);document.body.appendChild(s);}
function pic(r,label){return '<svg class="wk51-photo" viewBox="'+r.join(' ')+'" role="img" aria-label="'+esc(label)+'"><use href="#wkGrade51Sheet"/></svg>';}
function render(subject,rows){init();return '<section class="wk51-board" aria-label="초5-1 '+esc(subject)+' 단원 목차">'+pic([0,0,A.width,185],'드래곤볼 초5-1 CONTENTS')+rows.map((row,i)=>{const n=row.scene??i,sc=A.scenes[n];const cells=A.cells[n].filter(c=>row.enemies.includes(c[0]));return '<article><button type="button" class="wk51-title" '+row.action+'><b>'+ROMAN[n]+'</b><span>'+esc(row.title)+'</span><small>'+esc(row.status)+'</small></button><div class="wk51-scene">'+pic(sc,row.title+' 캐릭터')+(row.locked?'<span class="wk51-locked">🔒 앞 단원 수련 후 열림</span>':'')+cells.map(([id,x,y,w,h])=>'<button type="button" class="wk51-op" '+row.enemyAction(id)+' aria-disabled="'+!!row.locked+'" aria-label="'+esc(A.characters[id][0])+' '+esc(subject)+' 대결 시작" style="left:'+((x-sc[0])/sc[2]*100)+'%;top:'+((y-sc[1])/sc[3]*100)+'%;width:'+(w/sc[2]*100)+'%;height:'+(h/sc[3]*100)+'%"><span>'+esc(A.characters[id][0])+' · 대결</span></button>').join('')+'</div></article>';}).join('')+pic([0,1378,A.width,132],'강해져라! 수학의 힘!')+'</section>';}
const prev=window.wonkiGrade21Portrait;window.wonkiGrade21Portrait=function(id,grade,name){if(grade==='초5-1'&&A.hd[id])return '<img class="wk51-portrait" src="'+A.hd[id]+'" alt="'+esc(name||A.characters[id][0])+'" decoding="async">';return prev?.(id,grade,name)||null;};
window.WonkiGrade51={render,characters:A.characters,cast:A.cast};})();</script>
'''.replace('__A__', js)
open(d + 'g51/g51.html', 'w', encoding='utf-8').write(html)
import os
print('math51.json', os.path.getsize(d + 'g51/math51.json'), 'g51.html', os.path.getsize(d + 'g51/g51.html'))
