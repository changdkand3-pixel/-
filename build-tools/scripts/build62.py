import json, base64, io
from PIL import Image
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'

CH = {'krillin62': ['크리링', 195], 'krillin240_62': ['크리링 (에네르기파)', 240], 'goku62': ['손오공', 221], 'chichi62': ['치치', 47], 'tien62': ['천진반', 236],
      'yamcha62': ['야무치', 164], 'kami62': ['지구의 신', 310], 'announcer62': ['아나운서', 2], 'bulma62': ['부르마', 4], 'oolong62': ['오룡', 2],
      'puar62': ['푸알', 2], 'lunch13_62': ['런치 (변신)', 13], 'roshi62': ['무천도사', 139], 'yajirobe62': ['야지로베', 87], 'piccolo62': ['피콜로', 217],
      'yamcha220_62': ['야무치 (조기탄)', 220], 'goku368_62': ['손오공', 368], 'goku768_62': ['손오공 (에네르기파)', 768], 'piccolo364_62': ['피콜로', 364],
      'boss698_62': ['피콜로 (필살기)', 698], 'chiaotzu62': ['차오즈', 122]}
OX = 110
ROWS = [
    (227, 159, [('krillin62', 136, 199), ('krillin240_62', 203, 258), ('goku62', 262, 317), ('chichi62', 321, 378), ('tien62', 382, 439), ('yamcha62', 443, 503), ('kami62', 507, 564), ('announcer62', 568, 626), ('bulma62', 630, 688), ('oolong62', 692, 747), ('puar62', 751, 809), ('lunch13_62', 813, 870), ('roshi62', 874, 931), ('yajirobe62', 935, 988), ('piccolo62', 1010, 1070)]),
    (439, 147, [('yamcha62', 136, 197), ('yamcha220_62', 201, 275), ('kami62', 279, 340), ('goku62', 344, 402), ('chichi62', 406, 463), ('tien62', 467, 527), ('krillin62', 531, 588), ('announcer62', 592, 652), ('bulma62', 656, 715), ('oolong62', 719, 779), ('puar62', 783, 843), ('lunch13_62', 847, 911), ('roshi62', 915, 985), ('yajirobe62', 989, 1070)]),
    (643, 150, [('goku62', 136, 193), ('goku368_62', 197, 275), ('tien62', 279, 340), ('chichi62', 344, 402), ('yamcha62', 406, 471), ('krillin62', 475, 538), ('kami62', 542, 605), ('announcer62', 609, 671), ('bulma62', 675, 736), ('oolong62', 740, 799), ('puar62', 803, 862), ('lunch13_62', 866, 927), ('roshi62', 931, 994), ('yajirobe62', 998, 1070)]),
    (847, 153, [('kami62', 135, 197), ('goku62', 201, 256), ('chichi62', 260, 307), ('tien62', 311, 362), ('yamcha62', 366, 420), ('krillin62', 424, 479), ('announcer62', 483, 538), ('bulma62', 542, 598), ('oolong62', 602, 658), ('puar62', 662, 717), ('lunch13_62', 721, 781), ('roshi62', 785, 844), ('yajirobe62', 848, 916), ('piccolo62', 990, 1070)]),
    (1052, 150, [('goku368_62', 135, 189), ('goku768_62', 193, 250), ('chichi62', 254, 305), ('tien62', 309, 356), ('yamcha62', 360, 409), ('krillin62', 413, 464), ('announcer62', 468, 522), ('bulma62', 526, 578), ('oolong62', 582, 635), ('puar62', 639, 688), ('lunch13_62', 692, 747), ('roshi62', 751, 806), ('yajirobe62', 810, 871), ('piccolo364_62', 931, 997), ('boss698_62', 1001, 1070)]),
    (1257, 149, [('goku368_62', 135, 193), ('chichi62', 197, 249), ('tien62', 253, 307), ('yamcha62', 311, 364), ('krillin62', 368, 423), ('kami62', 427, 481), ('announcer62', 485, 540), ('bulma62', 544, 599), ('oolong62', 603, 658), ('puar62', 662, 716), ('lunch13_62', 720, 776), ('roshi62', 780, 834), ('yajirobe62', 838, 897), ('chiaotzu62', 901, 956), ('piccolo364_62', 1007, 1070)]),
]
SCENES = [[18, y - 3, 950, h + 6] for y, h, _ in ROWS]
CELLS = [[[i, x0 - OX, y, x1 - x0, h] for i, x0, x1 in row] for y, h, row in ROWS]
CAST = {str(i + 1): [c[0] for c in row] for i, row in enumerate(CELLS)}
BOSSES = {k: list(v) for k, v in CAST.items()}  # 143차: 손오공도 상대로 고를 수 있게

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# poster
im = Image.open(d + 'drive62/poster62.png').convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6)
poster = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
hd = {k: b64(d + f'g62/{k}.webp', 'image/webp') for k in CH}

# math problems
P = json.load(open(d + 'probs62.json'))
answers = open(d + 'ans62.txt').read().strip().split(',')
answers = [a.replace(';', ',') for a in answers]
assert len(answers) == 100, len(answers)
types = [P[str(n)]['type'] for n in range(1, 101)]
images = []
for n in range(1, 101):
    q = Image.open(d + f'q62/q{n:03d}.png').convert('RGB')
    if q.width > 930: q = q.resize((930, round(q.height * 930 / q.width)), Image.LANCZOS)
    buf = io.BytesIO(); q.save(buf, 'WEBP', quality=82, method=6); images.append('data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode())
POOL = {'1': list(range(1, 22)), '2': list(range(22, 45)) + [100], '3': list(range(45, 65)), '4': list(range(65, 83)), '5': list(range(83, 90)), '6': list(range(90, 100))}
assert sorted(sum(POOL.values(), [])) == list(range(1, 101))
UNITS = [['1', '분수의 나눗셈'], ['2', '소수의 나눗셈'], ['3', '공간과 입체'], ['4', '비례식과 비례배분'], ['5', '원의 넓이'], ['6', '원기둥, 원뿔, 구']]
pack = {'PT': {k: 'grade62:' + k for k in CH}, 'CH': CH, 'CAST': CAST, 'UNITS': UNITS,
        'UCOL': ['linear-gradient(#58d36f,#1f8a3a)', 'linear-gradient(#6bbcff,#1a63d4)', 'linear-gradient(#ffb454,#d86a0a)', 'linear-gradient(#b779ff,#6a2bb8)', 'linear-gradient(#ff7a6b,#c0262b)', 'linear-gradient(#65d3ca,#137d89)'],
        'POOL': POOL,
        'AREAS': [{'n': '분수의 나눗셈', 'e': '🍰', 'x': 20, 'y': 84}, {'n': '소수의 나눗셈', 'e': '➗', 'x': 72, 'y': 69}, {'n': '공간과 입체', 'e': '🧊', 'x': 27, 'y': 54}, {'n': '비례식·비례배분', 'e': '⚖️', 'x': 72, 'y': 39}, {'n': '원의 넓이', 'e': '⭕', 'x': 27, 'y': 24}, {'n': '원기둥·원뿔·구', 'e': '🥫', 'x': 72, 'y': 10}],
        'PICK': ['goku62', 'yamcha62', 'tien62', 'krillin62', 'chichi62'],
        'Q': {'images': images, 'answers': answers, 'types': types, 'format': 'data-url', 'source': '초6-2 원본 유형 학습지 100문항'},
        'BOSSES': BOSSES}
open(d + 'g62/math62.json', 'w', encoding='utf-8').write(json.dumps(pack, ensure_ascii=False).replace('</', '<\\/'))

A = {'poster': poster, 'width': 983, 'height': 1590, 'characters': CH, 'scenes': SCENES, 'cells': CELLS, 'cast': CAST, 'hd': hd}
js = json.dumps(A, ensure_ascii=False).replace('</', '<\\/')
html = '''<style id="wk62-style">
.wk62-board{border:3px solid #e6bd36;border-radius:16px;overflow:hidden;background:#0e3762}
.wk62-photo{display:block;width:100%;height:auto}
.wk62-title{display:flex!important;align-items:center!important;width:100%!important;gap:12px!important;background:linear-gradient(90deg,#ffe15a,#fff5c0)!important;color:#192330!important;border:0!important;border-radius:0!important;padding:10px!important;font:bold clamp(13px,2.5vw,22px) system-ui!important;text-align:left!important;cursor:pointer}
.wk62-title b{background:#133e67;color:#fff;padding:5px 12px;border-radius:6px}
.wk62-title small{margin-left:auto;font-size:11px!important}
.wk62-scene{position:relative}
.wk62-op{position:absolute!important;background:transparent!important;border:2px solid transparent!important;border-radius:10px!important;cursor:pointer;padding:0!important;min-height:0!important;margin:0!important}
.wk62-op:hover,.wk62-op:focus-visible{border-color:#ffe259!important;box-shadow:0 0 14px #ffee69}
.wk62-op span{position:absolute;bottom:0;left:0;right:0;background:#103458e8;color:#fff;font:800 clamp(8px,1.3vw,12px) system-ui;padding:2px;opacity:0;transition:opacity .15s}
.wk62-op:hover span,.wk62-op:focus-visible span{opacity:1}
.wk62-locked{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#08102b99;color:#fff49b;font-weight:bold;pointer-events:none}
.wk62-portrait{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
</style>
<script id="wonki-grade62-script">(()=>{const A=__A__;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
function init(){if(document.getElementById('wkGrade62Sheet'))return;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=document.createElementNS(ns,'defs'),image=document.createElementNS(ns,'image');image.id='wkGrade62Sheet';image.setAttribute('href',A.poster);image.setAttribute('width',A.width);image.setAttribute('height',A.height);defs.appendChild(image);s.appendChild(defs);document.body.appendChild(s);}
function pic(r,label){return '<svg class="wk62-photo" viewBox="'+r.join(' ')+'" role="img" aria-label="'+esc(label)+'"><use href="#wkGrade62Sheet"/></svg>';}
function render(subject,rows){init();return '<section class="wk62-board" aria-label="초6-2 '+esc(subject)+' 단원 목차">'+pic([0,0,A.width,180],'드래곤볼 초6-2 CONTENTS')+rows.map((row,i)=>{const n=row.scene??i,sc=A.scenes[n];const cells=A.cells[n].filter(c=>row.enemies.includes(c[0]));return '<article><button type="button" class="wk62-title" '+row.action+'><b>'+ROMAN[n]+'</b><span>'+esc(row.title)+'</span><small>'+esc(row.status)+'</small></button><div class="wk62-scene">'+pic(sc,row.title+' 캐릭터')+(row.locked?'<span class="wk62-locked">🔒 앞 단원 수련 후 열림</span>':'')+cells.map(([id,x,y,w,h])=>'<button type="button" class="wk62-op" '+row.enemyAction(id)+' aria-disabled="'+!!row.locked+'" aria-label="'+esc(A.characters[id][0])+' '+esc(subject)+' 대결 시작" style="left:'+((x-sc[0])/sc[2]*100)+'%;top:'+((y-sc[1])/sc[3]*100)+'%;width:'+(w/sc[2]*100)+'%;height:'+(h/sc[3]*100)+'%"><span>'+esc(A.characters[id][0])+' · 대결</span></button>').join('')+'</div></article>';}).join('')+pic([0,1408,A.width,182],'강해져라! 수학의 힘!')+'</section>';}
const prev=window.wonkiGrade21Portrait;window.wonkiGrade21Portrait=function(id,grade,name){if(grade==='초6-2'&&A.hd[id])return '<img class="wk62-portrait" src="'+A.hd[id]+'" alt="'+esc(name||A.characters[id][0])+'" decoding="async">';return prev?.(id,grade,name)||null;};
window.WonkiGrade62={render,characters:A.characters,cast:A.cast};})();</script>
'''.replace('__A__', js)
open(d + 'g62/g62.html', 'w', encoding='utf-8').write(html)
import os
print('math62.json', os.path.getsize(d + 'g62/math62.json'), 'g62.html', os.path.getsize(d + 'g62/g62.html'))
