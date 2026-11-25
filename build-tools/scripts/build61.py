import json, base64, io
from PIL import Image
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'

CH = {'goku61': ['손오공', 221], 'roshi61': ['무천도사', 139], 'bulma61': ['부르마', 4], 'krillin61': ['크리링', 195], 'puar61': ['푸알', 2],
      'oolong61': ['오룡', 2], 'lunch61': ['런치', 4], 'yamcha61': ['야무치', 164], 'tien61': ['천진반', 236], 'chiaotzu61': ['차오즈', 122],
      'chichi61': ['치치', 47], 'kami61': ['지구의 신', 310], 'announcer61': ['아나운서', 2], 'chapa61': ['차파왕', 108], 'piccolo61': ['피콜로', 217],
      'tao61': ['타오파이파이', 161], 'yajirobe61': ['야지로베', 87], 'lunch13_61': ['런치 (변신)', 13], 'lunch4b_61': ['런치 (변신)', 4]}
OX = 98
ROWS = [
    (233, 164, [('goku61', 124, 207), ('roshi61', 210, 302), ('bulma61', 305, 397), ('krillin61', 400, 492), ('puar61', 495, 582), ('oolong61', 585, 675), ('lunch61', 678, 770), ('yamcha61', 773, 865), ('tien61', 868, 960), ('chiaotzu61', 963, 1061)]),
    (454, 158, [('goku61', 124, 205), ('tien61', 208, 290), ('chichi61', 293, 367), ('krillin61', 370, 461), ('yamcha61', 455, 537), ('kami61', 540, 625), ('announcer61', 628, 707), ('chiaotzu61', 710, 794), ('chapa61', 865, 957), ('piccolo61', 960, 1061)]),
    (673, 162, [('chiaotzu61', 124, 205), ('yamcha61', 208, 290), ('tien61', 293, 372), ('goku61', 374, 457), ('krillin61', 460, 540), ('kami61', 543, 625), ('announcer61', 628, 707), ('chichi61', 710, 792), ('tao61', 865, 957), ('piccolo61', 960, 1061)]),
    (893, 167, [('yamcha61', 124, 222), ('yajirobe61', 230, 342), ('tien61', 345, 457), ('goku61', 460, 570), ('krillin61', 573, 682), ('kami61', 685, 797), ('announcer61', 800, 905), ('chichi61', 910, 1017)]),
    (1116, 146, [('tien61', 124, 180), ('goku61', 181, 245), ('yamcha61', 246, 309), ('krillin61', 310, 374), ('kami61', 375, 442), ('chichi61', 442, 505), ('announcer61', 506, 577), ('bulma61', 579, 642), ('oolong61', 644, 707), ('puar61', 709, 770), ('lunch13_61', 771, 830), ('roshi61', 831, 885), ('tao61', 935, 997), ('piccolo61', 999, 1061)]),
    (1333, 149, [('goku61', 124, 200), ('chichi61', 201, 265), ('tien61', 266, 335), ('yamcha61', 337, 410), ('krillin61', 411, 482), ('kami61', 484, 561), ('announcer61', 555, 625), ('bulma61', 627, 690), ('oolong61', 691, 750), ('puar61', 751, 812), ('lunch4b_61', 814, 897), ('roshi61', 899, 972), ('yajirobe61', 975, 1061)]),
]
SCENES = [[20, y - 5, 940, h + 10] for y, h, _ in ROWS]
CELLS = [[[i, x0 - OX, y, x1 - x0, h] for i, x0, x1 in row] for y, h, row in ROWS]
CAST = {str(i + 1): [c[0] for c in row] for i, row in enumerate(CELLS)}
BOSSES = {k: list(v) for k, v in CAST.items()}  # 143차: 손오공도 상대로 고를 수 있게

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# poster
im = Image.open(d + 'drive61/poster61.png').convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6)
poster = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
hd = {k: b64(d + f'g61/{k}.webp', 'image/webp') for k in CH}

# math problems
P = json.load(open(d + 'probs61.json'))
answers = open(d + 'ans61.txt').read().strip().split(',')
answers = [a.replace(';', ',') for a in answers]
assert len(answers) == 100, len(answers)
types = [P[str(n)]['type'] for n in range(1, 101)]
images = []
for n in range(1, 101):
    q = Image.open(d + f'q61/q{n:03d}.png').convert('RGB')
    if q.width > 930: q = q.resize((930, round(q.height * 930 / q.width)), Image.LANCZOS)
    buf = io.BytesIO(); q.save(buf, 'WEBP', quality=82, method=6); images.append('data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode())
POOL = {'1': list(range(1, 12)), '2': list(range(12, 34)), '3': list(range(34, 41)), '4': list(range(41, 59)), '5': list(range(59, 76)), '6': list(range(76, 101))}
assert sorted(sum(POOL.values(), [])) == list(range(1, 101))
UNITS = [['1', '분수의 나눗셈'], ['2', '각기둥과 각뿔'], ['3', '소수의 나눗셈'], ['4', '비와 비율'], ['5', '여러 가지 그래프'], ['6', '직육면체의 겉넓이와 부피']]
pack = {'PT': {k: 'grade61:' + k for k in CH}, 'CH': CH, 'CAST': CAST, 'UNITS': UNITS,
        'UCOL': ['linear-gradient(#58d36f,#1f8a3a)', 'linear-gradient(#6bbcff,#1a63d4)', 'linear-gradient(#ffb454,#d86a0a)', 'linear-gradient(#b779ff,#6a2bb8)', 'linear-gradient(#ff7a6b,#c0261b)', 'linear-gradient(#65d3ca,#137d89)'],
        'POOL': POOL,
        'AREAS': [{'n': '분수의 나눗셈', 'e': '🍰', 'x': 20, 'y': 84}, {'n': '각기둥과 각뿔', 'e': '🔺', 'x': 72, 'y': 69}, {'n': '소수의 나눗셈', 'e': '➗', 'x': 27, 'y': 54}, {'n': '비와 비율', 'e': '⚖️', 'x': 72, 'y': 39}, {'n': '여러 가지 그래프', 'e': '📊', 'x': 27, 'y': 24}, {'n': '겉넓이와 부피', 'e': '📦', 'x': 72, 'y': 10}],
        'PICK': ['goku61', 'yamcha61', 'tien61', 'krillin61', 'chichi61'],
        'Q': {'images': images, 'answers': answers, 'types': types, 'format': 'data-url', 'source': '초6-1 원본 유형 학습지 100문항'},
        'BOSSES': BOSSES}
open(d + 'g61/math61.json', 'w', encoding='utf-8').write(json.dumps(pack, ensure_ascii=False).replace('</', '<\\/'))

A = {'poster': poster, 'width': 983, 'height': 1615, 'characters': CH, 'scenes': SCENES, 'cells': CELLS, 'cast': CAST, 'hd': hd}
js = json.dumps(A, ensure_ascii=False).replace('</', '<\\/')
html = '''<style id="wk61-style">
.wk61-board{border:3px solid #e6bd36;border-radius:16px;overflow:hidden;background:#0e3761}
.wk61-photo{display:block;width:100%;height:auto}
.wk61-title{display:flex!important;align-items:center!important;width:100%!important;gap:12px!important;background:linear-gradient(90deg,#ffe15a,#fff5c0)!important;color:#192330!important;border:0!important;border-radius:0!important;padding:10px!important;font:bold clamp(13px,2.5vw,22px) system-ui!important;text-align:left!important;cursor:pointer}
.wk61-title b{background:#133e67;color:#fff;padding:5px 12px;border-radius:6px}
.wk61-title small{margin-left:auto;font-size:11px!important}
.wk61-scene{position:relative}
.wk61-op{position:absolute!important;background:transparent!important;border:2px solid transparent!important;border-radius:10px!important;cursor:pointer;padding:0!important;min-height:0!important;margin:0!important}
.wk61-op:hover,.wk61-op:focus-visible{border-color:#ffe259!important;box-shadow:0 0 14px #ffee69}
.wk61-op span{position:absolute;bottom:0;left:0;right:0;background:#103458e8;color:#fff;font:800 clamp(8px,1.3vw,12px) system-ui;padding:2px;opacity:0;transition:opacity .15s}
.wk61-op:hover span,.wk61-op:focus-visible span{opacity:1}
.wk61-locked{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#08102b99;color:#fff49b;font-weight:bold;pointer-events:none}
.wk61-portrait{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
</style>
<script id="wonki-grade61-script">(()=>{const A=__A__;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
function init(){if(document.getElementById('wkGrade61Sheet'))return;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=document.createElementNS(ns,'defs'),image=document.createElementNS(ns,'image');image.id='wkGrade61Sheet';image.setAttribute('href',A.poster);image.setAttribute('width',A.width);image.setAttribute('height',A.height);defs.appendChild(image);s.appendChild(defs);document.body.appendChild(s);}
function pic(r,label){return '<svg class="wk61-photo" viewBox="'+r.join(' ')+'" role="img" aria-label="'+esc(label)+'"><use href="#wkGrade61Sheet"/></svg>';}
function render(subject,rows){init();return '<section class="wk61-board" aria-label="초6-1 '+esc(subject)+' 단원 목차">'+pic([0,0,A.width,186],'드래곤볼 초6-1 CONTENTS')+rows.map((row,i)=>{const n=row.scene??i,sc=A.scenes[n];const cells=A.cells[n].filter(c=>row.enemies.includes(c[0]));return '<article><button type="button" class="wk61-title" '+row.action+'><b>'+ROMAN[n]+'</b><span>'+esc(row.title)+'</span><small>'+esc(row.status)+'</small></button><div class="wk61-scene">'+pic(sc,row.title+' 캐릭터')+(row.locked?'<span class="wk61-locked">🔒 앞 단원 수련 후 열림</span>':'')+cells.map(([id,x,y,w,h])=>'<button type="button" class="wk61-op" '+row.enemyAction(id)+' aria-disabled="'+!!row.locked+'" aria-label="'+esc(A.characters[id][0])+' '+esc(subject)+' 대결 시작" style="left:'+((x-sc[0])/sc[2]*100)+'%;top:'+((y-sc[1])/sc[3]*100)+'%;width:'+(w/sc[2]*100)+'%;height:'+(h/sc[3]*100)+'%"><span>'+esc(A.characters[id][0])+' · 대결</span></button>').join('')+'</div></article>';}).join('')+pic([0,1492,A.width,123],'강해져라! 수학의 힘!')+'</section>';}
const prev=window.wonkiGrade21Portrait;window.wonkiGrade21Portrait=function(id,grade,name){if(grade==='초6-1'&&A.hd[id])return '<img class="wk61-portrait" src="'+A.hd[id]+'" alt="'+esc(name||A.characters[id][0])+'" decoding="async">';return prev?.(id,grade,name)||null;};
window.WonkiGrade61={render,characters:A.characters,cast:A.cast};})();</script>
'''.replace('__A__', js)
open(d + 'g61/g61.html', 'w', encoding='utf-8').write(html)
import os
print('math61.json', os.path.getsize(d + 'g61/math61.json'), 'g61.html', os.path.getsize(d + 'g61/g61.html'))
