import json, base64, io
from PIL import Image
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'

CH = {'goku32': ['손오공', 125], 'goku140_32': ['손오공', 140], 'yamcha32': ['야무치', 58], 'yamcha85_32': ['야무치', 85], 'krillin32': ['크리링', 70],
      'puar32': ['푸알', 2], 'roshi32': ['무천도사', 120], 'bulma32': ['부르마', 4], 'upa32': ['우파', 3], 'baba32': ['점쟁이 바바', 50],
      'mummy32': ['미이라', 75], 'akuman32': ['아크맨', 106], 'gohan123_32': ['손오반 할아버지', 123], 'gohan137_32': ['손오반 할아버지 (변신)', 137],
      'pilaf32': ['피라후', 90], 'shu32': ['슈', 80], 'mai32': ['마이', 70], 'pilafbot32': ['피라후 로봇', 108], 'shubot32': ['슈 로봇', 110], 'maibot32': ['마이 로봇', 112],
      'bora32': ['보라', 60], 'shenron32': ['신룡', 150]}
SCENES = [[20, 313, 945, 164], [20, 513, 945, 165], [20, 715, 945, 164], [20, 911, 945, 166], [20, 1116, 945, 165], [20, 1313, 945, 162]]
X9 = [30, 120, 213, 303, 395, 487, 578, 668]; W9 = [85, 85, 82, 82, 85, 83, 82, 87]
def row9(ids, y, h, last):
    return [[i, X9[k], y, W9[k], h] for k, i in enumerate(ids)] + [[last, 843, y, 107, h]]
CELLS = [
    row9(['yamcha32', 'goku32', 'krillin32', 'puar32', 'roshi32', 'bulma32', 'upa32', 'baba32'], 315, 145, 'mummy32'),
    row9(['goku32', 'yamcha32', 'krillin32', 'puar32', 'roshi32', 'bulma32', 'upa32', 'baba32'], 515, 150, 'mummy32'),
    row9(['goku32', 'yamcha85_32', 'krillin32', 'puar32', 'roshi32', 'bulma32', 'upa32', 'baba32'], 718, 152, 'akuman32'),
    [[i, x, 915, w, 150] for i, x, w in [('goku32', 30, 70), ('goku140_32', 108, 70), ('yamcha85_32', 185, 70), ('krillin32', 262, 70), ('puar32', 340, 70), ('roshi32', 415, 75), ('bulma32', 495, 75), ('upa32', 578, 82), ('baba32', 668, 87), ('gohan123_32', 800, 68), ('gohan137_32', 873, 77)]],
    [[i, x, 1120, w, 150] for i, x, w in [('goku32', 30, 105), ('pilaf32', 240, 105), ('shu32', 350, 105), ('mai32', 462, 106), ('pilafbot32', 575, 110), ('shubot32', 692, 118), ('maibot32', 820, 130)]],
    [[i, x, 1318, w, 147] for i, x, w in [('goku32', 30, 70), ('upa32', 112, 83), ('bora32', 202, 83), ('yamcha85_32', 292, 83), ('krillin32', 382, 83), ('puar32', 470, 80), ('roshi32', 558, 82), ('bulma32', 648, 87), ('baba32', 740, 85), ('shenron32', 840, 110)]],
]
CAST = {str(i + 1): [c[0] for c in row] for i, row in enumerate(CELLS)}
BOSSES = {k: [x for x in v if x != 'goku32'] for k, v in CAST.items()}

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# poster
im = Image.open(d + 'drive32/초3-2.jpg').convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6)
poster = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
hd = {k: b64(d + f'g32/{k}.webp', 'image/webp') for k in CH}

# math problems
P = json.load(open(d + 'probs32.json'))
answers = '2,232,3,9,9,1260,1050,546,917,4900,5,5600,486,1928,3008,1917,1710,1244,1445,1722,1645,504,925,160,2100,73,7,15,99,6,16,87,4,7,52,30,4,35,17,16,4,41,11,21,2,204,4,6,28,140,42,120,6,18,4,5,9,15,66,24,18,15,48,5,2,208,2,5800,1,2,1750,1;3;4,1,3,2,3,5,70000,2,1,3,200,950,3,900,800,1,5,40,3,5'.split(',')
answers = [a.replace(';', ',') for a in answers]
assert len(answers) == 91, len(answers)
types = [P[str(n)]['type'] for n in range(1, 92)]
images = []
for n in range(1, 92):
    q = Image.open(d + f'q32/q{n:03d}.png').convert('RGB')
    if q.width > 930: q = q.resize((930, round(q.height * 930 / q.width)), Image.LANCZOS)
    buf = io.BytesIO(); q.save(buf, 'WEBP', quality=82, method=6); images.append('data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode())
POOL = {'1': list(range(2, 24)), '2': [1] + list(range(24, 45)), '3': list(range(45, 55)), '4': list(range(55, 67)), '5': list(range(67, 87)), '6': list(range(87, 92))}
assert sorted(sum(POOL.values(), [])) == list(range(1, 92))
UNITS = [['1', '곱셈'], ['2', '나눗셈'], ['3', '원'], ['4', '분수'], ['5', '들이와 무게'], ['6', '자료의 정리']]
pack = {'PT': {k: 'grade32:' + k for k in CH}, 'CH': CH, 'CAST': CAST, 'UNITS': UNITS,
        'UCOL': ['linear-gradient(#58d36f,#1f8a3a)', 'linear-gradient(#6bbcff,#1a63d4)', 'linear-gradient(#ffb454,#d86a0a)', 'linear-gradient(#b779ff,#6a2bb8)', 'linear-gradient(#ff7a6b,#c0261b)', 'linear-gradient(#65d3ca,#137d89)'],
        'POOL': POOL,
        'AREAS': [{'n': '곱셈', 'e': '✖️', 'x': 20, 'y': 84}, {'n': '나눗셈', 'e': '➗', 'x': 72, 'y': 69}, {'n': '원', 'e': '⭕', 'x': 27, 'y': 54}, {'n': '분수', 'e': '🍕', 'x': 72, 'y': 39}, {'n': '들이와 무게', 'e': '⚖️', 'x': 27, 'y': 24}, {'n': '자료의 정리', 'e': '📊', 'x': 72, 'y': 10}],
        'PICK': CAST['1'],
        'Q': {'images': images, 'answers': answers, 'types': types, 'format': 'data-url', 'source': '초3-2 원본 유형 학습지 91문항 (고등 문제 9개 제외)'},
        'BOSSES': BOSSES}
open(d + 'g32/math32.json', 'w', encoding='utf-8').write(json.dumps(pack, ensure_ascii=False).replace('</', '<\\/'))

A = {'poster': poster, 'width': 965, 'height': 1627, 'characters': CH, 'scenes': SCENES, 'cells': CELLS, 'cast': CAST, 'hd': hd}
js = json.dumps(A, ensure_ascii=False).replace('</', '<\\/')
html = '''<style id="wk32-style">
.wk32-board{border:3px solid #e6bd36;border-radius:16px;overflow:hidden;background:#0e3751}
.wk32-photo{display:block;width:100%;height:auto}
.wk32-title{display:flex!important;align-items:center!important;width:100%!important;gap:12px!important;background:linear-gradient(90deg,#ffe15a,#fff5c0)!important;color:#192330!important;border:0!important;border-radius:0!important;padding:10px!important;font:bold clamp(13px,2.5vw,22px) system-ui!important;text-align:left!important;cursor:pointer}
.wk32-title b{background:#133e67;color:#fff;padding:5px 12px;border-radius:6px}
.wk32-title small{margin-left:auto;font-size:11px!important}
.wk32-scene{position:relative}
.wk32-op{position:absolute!important;background:transparent!important;border:2px solid transparent!important;border-radius:10px!important;cursor:pointer;padding:0!important;min-height:0!important;margin:0!important}
.wk32-op:hover,.wk32-op:focus-visible{border-color:#ffe259!important;box-shadow:0 0 14px #ffee69}
.wk32-op span{position:absolute;bottom:0;left:0;right:0;background:#103458e8;color:#fff;font:800 clamp(8px,1.3vw,12px) system-ui;padding:2px;opacity:0;transition:opacity .15s}
.wk32-op:hover span,.wk32-op:focus-visible span{opacity:1}
.wk32-locked{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#08102b99;color:#fff49b;font-weight:bold;pointer-events:none}
.wk32-portrait{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
</style>
<script id="wonki-grade32-script">(()=>{const A=__A__;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
function init(){if(document.getElementById('wkGrade32Sheet'))return;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=document.createElementNS(ns,'defs'),image=document.createElementNS(ns,'image');image.id='wkGrade32Sheet';image.setAttribute('href',A.poster);image.setAttribute('width',A.width);image.setAttribute('height',A.height);defs.appendChild(image);s.appendChild(defs);document.body.appendChild(s);}
function pic(r,label){return '<svg class="wk32-photo" viewBox="'+r.join(' ')+'" role="img" aria-label="'+esc(label)+'"><use href="#wkGrade32Sheet"/></svg>';}
function render(subject,rows){init();return '<section class="wk32-board" aria-label="초3-2 '+esc(subject)+' 단원 목차">'+pic([0,0,A.width,270],'드래곤볼 초3-2 CONTENTS')+rows.map((row,i)=>{const n=row.scene??i,sc=A.scenes[n];const cells=A.cells[n].filter(c=>row.enemies.includes(c[0]));return '<article><button type="button" class="wk32-title" '+row.action+'><b>'+ROMAN[n]+'</b><span>'+esc(row.title)+'</span><small>'+esc(row.status)+'</small></button><div class="wk32-scene">'+pic(sc,row.title+' 캐릭터')+(row.locked?'<span class="wk32-locked">🔒 앞 단원 수련 후 열림</span>':'')+cells.map(([id,x,y,w,h])=>'<button type="button" class="wk32-op" '+row.enemyAction(id)+' aria-disabled="'+!!row.locked+'" aria-label="'+esc(A.characters[id][0])+' '+esc(subject)+' 대결 시작" style="left:'+((x-sc[0])/sc[2]*100)+'%;top:'+((y-sc[1])/sc[3]*100)+'%;width:'+(w/sc[2]*100)+'%;height:'+(h/sc[3]*100)+'%"><span>'+esc(A.characters[id][0])+' · 대결</span></button>').join('')+'</div></article>';}).join('')+pic([0,1475,A.width,152],'강해져라! 수학의 힘!')+'</section>';}
const prev=window.wonkiGrade21Portrait;window.wonkiGrade21Portrait=function(id,grade,name){if(grade==='초3-2'&&A.hd[id])return '<img class="wk32-portrait" src="'+A.hd[id]+'" alt="'+esc(name||A.characters[id][0])+'" decoding="async">';return prev?.(id,grade,name)||null;};
window.WonkiGrade32={render,characters:A.characters,cast:A.cast};})();</script>
'''.replace('__A__', js)
open(d + 'g32/g32.html', 'w', encoding='utf-8').write(html)
import os
print('math32.json', os.path.getsize(d + 'g32/math32.json'), 'g32.html', os.path.getsize(d + 'g32/g32.html'))
