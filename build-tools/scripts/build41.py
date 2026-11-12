import json, base64, io
from PIL import Image
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'

CH = {'goku41': ['손오공', 150], 'yamcha41': ['야무치', 102], 'yamchae41': ['야무치 (에네르기파)', 115], 'krillin41': ['크리링', 115], 'roshi41': ['무천도사', 139],
      'bulma41': ['부르마', 4], 'lunch41': ['런치 (변신)', 13], 'puar41': ['푸알', 2], 'oolong41': ['오룡', 2], 'jackie41': ['잭키춘', 139],
      'tien41': ['천진반', 145], 'chiaotzu41': ['차오즈', 94], 'crane41': ['학도사', 120], 'pamput41': ['차파왕', 91], 'announcer41': ['아나운서', 2], 'wolf41': ['사나이늑대', 19]}
OX = 108
ROWS = [  # (y, h, [(id, x0, x1)...]) in the original 1195-wide poster
    (280, 155, [('yamcha41', 135, 265), ('krillin41', 270, 395), ('roshi41', 400, 525), ('bulma41', 530, 655), ('lunch41', 660, 785), ('puar41', 790, 918), ('oolong41', 925, 1060)]),
    (485, 150, [('yamcha41', 135, 218), ('krillin41', 222, 300), ('roshi41', 305, 390), ('bulma41', 395, 470), ('lunch41', 475, 560), ('puar41', 565, 645), ('oolong41', 650, 735), ('tien41', 810, 895), ('chiaotzu41', 900, 980), ('crane41', 985, 1065)]),
    (685, 155, [('goku41', 135, 245), ('yamcha41', 250, 365), ('krillin41', 370, 478), ('roshi41', 483, 595), ('bulma41', 600, 708), ('lunch41', 713, 827), ('puar41', 832, 945), ('oolong41', 950, 1062)]),
    (892, 153, [('goku41', 135, 240), ('yamcha41', 243, 345), ('krillin41', 350, 452), ('jackie41', 457, 565), ('pamput41', 650, 745), ('tien41', 750, 848), ('chiaotzu41', 853, 955), ('crane41', 960, 1062)]),
    (1090, 145, [('yamcha41', 135, 200), ('yamchae41', 205, 262), ('goku41', 267, 322), ('krillin41', 327, 382), ('jackie41', 387, 445), ('bulma41', 448, 505), ('lunch41', 510, 568), ('puar41', 572, 630), ('oolong41', 635, 708), ('announcer41', 712, 800), ('tien41', 865, 930), ('chiaotzu41', 935, 995), ('crane41', 1000, 1062)]),
    (1290, 145, [('jackie41', 135, 200), ('yamcha41', 203, 262), ('goku41', 267, 330), ('krillin41', 335, 398), ('bulma41', 403, 465), ('lunch41', 470, 535), ('puar41', 540, 600), ('oolong41', 605, 665), ('announcer41', 668, 735), ('wolf41', 798, 858), ('tien41', 862, 930), ('chiaotzu41', 935, 995), ('crane41', 1000, 1062)]),
]
SCENES = [[15, y - 5, 950, h + 10] for y, h, _ in ROWS]
CELLS = [[[i, x0 - OX, y, x1 - x0, h] for i, x0, x1 in row] for y, h, row in ROWS]
CAST = {str(i + 1): [c[0] for c in row] for i, row in enumerate(CELLS)}
BOSSES = {k: [x for x in v if x != 'goku41'] for k, v in CAST.items()}

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# poster
im = Image.open(d + 'drive41/poster41.png').convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6)
poster = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
hd = {k: b64(d + f'g41/{k}.webp', 'image/webp') for k in CH}

# math problems
P = json.load(open(d + 'probs41.json'))
P['3']['type'] = '몫이 한 자리 수이고 나머지가 있는 (세 자리 수)÷(두 자리 수)의 실생활 문제 해결하기'
P['4']['type'] = '몫이 두 자리 수이고 나머지가 있는 (세 자리 수)÷(두 자리 수)의 실생활 문제 해결하기'
P['81']['type'] = '몫이 두 자리 수이고 나누어떨어지는 (세 자리 수)÷(두 자리 수)의 실생활 문제 해결하기'
answers = open(d + 'ans41.txt').read().strip().split(',')
answers = [a.replace(';', ',') for a in answers]
assert len(answers) == 100, len(answers)
types = [P[str(n)]['type'] for n in range(1, 101)]
images = []
for n in range(1, 101):
    q = Image.open(d + f'q41/q{n:03d}.png').convert('RGB')
    if q.width > 930: q = q.resize((930, round(q.height * 930 / q.width)), Image.LANCZOS)
    buf = io.BytesIO(); q.save(buf, 'WEBP', quality=82, method=6); images.append('data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode())
POOL = {'1': list(range(7, 36)), '2': [1] + list(range(36, 64)), '3': [2, 3, 4, 6] + list(range(64, 82)), '4': list(range(82, 90)), '5': list(range(90, 95)), '6': [5] + list(range(95, 101))}
assert sorted(sum(POOL.values(), [])) == list(range(1, 101))
UNITS = [['1', '큰 수'], ['2', '각도'], ['3', '곱셈과 나눗셈'], ['4', '평면도형의 이동'], ['5', '막대그래프'], ['6', '규칙 찾기']]
pack = {'PT': {k: 'grade41:' + k for k in CH}, 'CH': CH, 'CAST': CAST, 'UNITS': UNITS,
        'UCOL': ['linear-gradient(#58d36f,#1f8a3a)', 'linear-gradient(#6bbcff,#1a63d4)', 'linear-gradient(#ffb454,#d86a0a)', 'linear-gradient(#b779ff,#6a2bb8)', 'linear-gradient(#ff7a6b,#c0261b)', 'linear-gradient(#65d3ca,#137d89)'],
        'POOL': POOL,
        'AREAS': [{'n': '큰 수', 'e': '🔢', 'x': 20, 'y': 84}, {'n': '각도', 'e': '📐', 'x': 72, 'y': 69}, {'n': '곱셈과 나눗셈', 'e': '✖️', 'x': 27, 'y': 54}, {'n': '평면도형의 이동', 'e': '🔄', 'x': 72, 'y': 39}, {'n': '막대그래프', 'e': '📊', 'x': 27, 'y': 24}, {'n': '규칙 찾기', 'e': '🧩', 'x': 72, 'y': 10}],
        'PICK': ['goku41'] + CAST['1'],
        'Q': {'images': images, 'answers': answers, 'types': types, 'format': 'data-url', 'source': '초4-1 원본 유형 학습지 100문항'},
        'BOSSES': BOSSES}
open(d + 'g41/math41.json', 'w', encoding='utf-8').write(json.dumps(pack, ensure_ascii=False).replace('</', '<\\/'))

A = {'poster': poster, 'width': 980, 'height': 1625, 'characters': CH, 'scenes': SCENES, 'cells': CELLS, 'cast': CAST, 'hd': hd}
js = json.dumps(A, ensure_ascii=False).replace('</', '<\\/')
html = '''<style id="wk41-style">
.wk41-board{border:3px solid #e6bd36;border-radius:16px;overflow:hidden;background:#0e3751}
.wk41-photo{display:block;width:100%;height:auto}
.wk41-title{display:flex!important;align-items:center!important;width:100%!important;gap:12px!important;background:linear-gradient(90deg,#ffe15a,#fff5c0)!important;color:#192330!important;border:0!important;border-radius:0!important;padding:10px!important;font:bold clamp(13px,2.5vw,22px) system-ui!important;text-align:left!important;cursor:pointer}
.wk41-title b{background:#133e67;color:#fff;padding:5px 12px;border-radius:6px}
.wk41-title small{margin-left:auto;font-size:11px!important}
.wk41-scene{position:relative}
.wk41-op{position:absolute!important;background:transparent!important;border:2px solid transparent!important;border-radius:10px!important;cursor:pointer;padding:0!important;min-height:0!important;margin:0!important}
.wk41-op:hover,.wk41-op:focus-visible{border-color:#ffe259!important;box-shadow:0 0 14px #ffee69}
.wk41-op span{position:absolute;bottom:0;left:0;right:0;background:#103458e8;color:#fff;font:800 clamp(8px,1.3vw,12px) system-ui;padding:2px;opacity:0;transition:opacity .15s}
.wk41-op:hover span,.wk41-op:focus-visible span{opacity:1}
.wk41-locked{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#08102b99;color:#fff49b;font-weight:bold;pointer-events:none}
.wk41-portrait{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
</style>
<script id="wonki-grade41-script">(()=>{const A=__A__;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
function init(){if(document.getElementById('wkGrade41Sheet'))return;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=document.createElementNS(ns,'defs'),image=document.createElementNS(ns,'image');image.id='wkGrade41Sheet';image.setAttribute('href',A.poster);image.setAttribute('width',A.width);image.setAttribute('height',A.height);defs.appendChild(image);s.appendChild(defs);document.body.appendChild(s);}
function pic(r,label){return '<svg class="wk41-photo" viewBox="'+r.join(' ')+'" role="img" aria-label="'+esc(label)+'"><use href="#wkGrade41Sheet"/></svg>';}
function render(subject,rows){init();return '<section class="wk41-board" aria-label="초4-1 '+esc(subject)+' 단원 목차">'+pic([0,0,A.width,232],'드래곤볼 초4-1 CONTENTS')+rows.map((row,i)=>{const n=row.scene??i,sc=A.scenes[n];const cells=A.cells[n].filter(c=>row.enemies.includes(c[0]));return '<article><button type="button" class="wk41-title" '+row.action+'><b>'+ROMAN[n]+'</b><span>'+esc(row.title)+'</span><small>'+esc(row.status)+'</small></button><div class="wk41-scene">'+pic(sc,row.title+' 캐릭터')+(row.locked?'<span class="wk41-locked">🔒 앞 단원 수련 후 열림</span>':'')+cells.map(([id,x,y,w,h])=>'<button type="button" class="wk41-op" '+row.enemyAction(id)+' aria-disabled="'+!!row.locked+'" aria-label="'+esc(A.characters[id][0])+' '+esc(subject)+' 대결 시작" style="left:'+((x-sc[0])/sc[2]*100)+'%;top:'+((y-sc[1])/sc[3]*100)+'%;width:'+(w/sc[2]*100)+'%;height:'+(h/sc[3]*100)+'%"><span>'+esc(A.characters[id][0])+' · 대결</span></button>').join('')+'</div></article>';}).join('')+pic([0,1445,A.width,180],'강해져라! 수학의 힘!')+'</section>';}
const prev=window.wonkiGrade21Portrait;window.wonkiGrade21Portrait=function(id,grade,name){if(grade==='초4-1'&&A.hd[id])return '<img class="wk41-portrait" src="'+A.hd[id]+'" alt="'+esc(name||A.characters[id][0])+'" decoding="async">';return prev?.(id,grade,name)||null;};
window.WonkiGrade41={render,characters:A.characters,cast:A.cast};})();</script>
'''.replace('__A__', js)
open(d + 'g41/g41.html', 'w', encoding='utf-8').write(html)
import os
print('math41.json', os.path.getsize(d + 'g41/math41.json'), 'g41.html', os.path.getsize(d + 'g41/g41.html'))
