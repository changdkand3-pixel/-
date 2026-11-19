import json, base64, io
from PIL import Image
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'

CH = {'goku52': ['손오공', 153], 'goku260_52': ['손오공', 260], 'goku292_52': ['손오공 (에네르기파)', 292], 'goku330_52': ['손오공 (용권)', 330],
      'yajirobe52': ['야지로베', 87], 'karin52': ['카린', 135], 'upa52': ['우파', 3], 'bora52': ['보라', 60], 'king52': ['국왕', 20], 'tien52': ['천진반', 148],
      'yamcha52': ['야무치', 102], 'puar52': ['푸알', 2], 'oolong52': ['오룡', 2], 'bulma52': ['부르마', 4], 'shenron52': ['신룡', 150],
      'piccolo52': ['피콜로 대마왕', 260], 'piccolo300_52': ['피콜로 대마왕 (변신)', 300], 'piano52': ['피아노', 65], 'drum52': ['드럼', 178],
      'lunch52': ['런치', 4], 'lunch13_52': ['런치 (금발)', 13], 'piccolo30_52': ['꼬마 피콜로', 30], 'popo52': ['미스터 포포', 288], 'kami52': ['지구의 신', 310],
      'krillin52': ['크리링', 115], 'chiaotzu52': ['차오즈', 94], 'roshi52': ['무천도사', 139]}
OX = 110
ROWS = [
    (237, 163, [('goku52', 140, 199), ('yajirobe52', 201, 261), ('karin52', 263, 322), ('upa52', 324, 376), ('bora52', 378, 442), ('king52', 444, 501), ('tien52', 503, 561), ('yamcha52', 563, 620), ('puar52', 622, 676), ('oolong52', 678, 734), ('bulma52', 736, 792), ('shenron52', 794, 848), ('piccolo52', 908, 983), ('piano52', 985, 1064)]),
    (449, 160, [('tien52', 138, 275), ('goku52', 280, 444), ('drum52', 557, 708), ('piccolo52', 710, 884), ('piano52', 886, 1073)]),
    (658, 162, [('goku260_52', 139, 223), ('tien52', 226, 304), ('yamcha52', 306, 389), ('lunch52', 392, 474), ('bulma52', 477, 555), ('drum52', 648, 766), ('piccolo52', 770, 918), ('piano52', 920, 1074)]),
    (866, 156, [('goku260_52', 140, 214), ('goku292_52', 216, 295), ('goku330_52', 297, 370), ('tien52', 372, 432), ('yajirobe52', 434, 502), ('yamcha52', 504, 575), ('lunch52', 577, 649), ('bulma52', 651, 718), ('piccolo52', 779, 864), ('piccolo300_52', 866, 970), ('piano52', 972, 1064)]),
    (1068, 142, [('goku260_52', 140, 226), ('yajirobe52', 229, 324), ('karin52', 327, 424), ('bulma52', 427, 512), ('oolong52', 515, 606), ('puar52', 609, 697), ('yamcha52', 699, 795), ('tien52', 797, 882), ('lunch52', 885, 974), ('piccolo30_52', 976, 1065)]),
    (1263, 145, [('goku260_52', 140, 208), ('popo52', 211, 278), ('kami52', 281, 358), ('shenron52', 361, 440), ('bulma52', 443, 509), ('yamcha52', 511, 579), ('puar52', 581, 646), ('oolong52', 648, 712), ('tien52', 714, 781), ('lunch13_52', 783, 848), ('krillin52', 850, 918), ('chiaotzu52', 920, 988), ('roshi52', 991, 1066)]),
]
SCENES = [[20, y - 5, 950, h + 10] for y, h, _ in ROWS]
CELLS = [[[i, x0 - OX, y, x1 - x0, h] for i, x0, x1 in row] for y, h, row in ROWS]
CAST = {str(i + 1): [c[0] for c in row] for i, row in enumerate(CELLS)}
BOSSES = {k: [x for x in v if x not in ('goku52', 'goku260_52')] for k, v in CAST.items()}

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# poster
im = Image.open(d + 'drive52/poster52.png').convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6)
poster = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
hd = {k: b64(d + f'g52/{k}.webp', 'image/webp') for k in CH}

# math problems
P = json.load(open(d + 'probs52.json'))
answers = open(d + 'ans52.txt').read().strip().split(',')
answers = [a.replace(';', ',') for a in answers]
assert len(answers) == 100, len(answers)
types = [P[str(n)]['type'] for n in range(1, 101)]
images = []
for n in range(1, 101):
    q = Image.open(d + f'q52/q{n:03d}.png').convert('RGB')
    if q.width > 930: q = q.resize((930, round(q.height * 930 / q.width)), Image.LANCZOS)
    buf = io.BytesIO(); q.save(buf, 'WEBP', quality=82, method=6); images.append('data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode())
POOL = {'1': list(range(1, 13)) + [96, 97, 98], '2': list(range(13, 32)) + [99, 100], '3': list(range(32, 49)), '4': [49, 50], '5': list(range(51, 82)), '6': list(range(82, 96))}
assert sorted(sum(POOL.values(), [])) == list(range(1, 101))
UNITS = [['1', '수의 범위와 어림하기'], ['2', '분수의 곱셈'], ['3', '합동과 대칭'], ['4', '소수의 곱셈'], ['5', '직육면체'], ['6', '평균과 가능성']]
pack = {'PT': {k: 'grade52:' + k for k in CH}, 'CH': CH, 'CAST': CAST, 'UNITS': UNITS,
        'UCOL': ['linear-gradient(#58d36f,#1f8a3a)', 'linear-gradient(#6bbcff,#1a63d4)', 'linear-gradient(#ffb454,#d86a0a)', 'linear-gradient(#b779ff,#6a2bb8)', 'linear-gradient(#ff7a6b,#c0261b)', 'linear-gradient(#65d3ca,#137d89)'],
        'POOL': POOL,
        'AREAS': [{'n': '수의 범위·어림', 'e': '🎯', 'x': 20, 'y': 84}, {'n': '분수의 곱셈', 'e': '🍰', 'x': 72, 'y': 69}, {'n': '합동과 대칭', 'e': '🦋', 'x': 27, 'y': 54}, {'n': '소수의 곱셈', 'e': '✖️', 'x': 72, 'y': 39}, {'n': '직육면체', 'e': '📦', 'x': 27, 'y': 24}, {'n': '평균과 가능성', 'e': '🎲', 'x': 72, 'y': 10}],
        'PICK': ['goku52', 'goku260_52', 'yamcha52', 'tien52', 'bulma52'],
        'Q': {'images': images, 'answers': answers, 'types': types, 'format': 'data-url', 'source': '초5-2 원본 유형 학습지 100문항'},
        'BOSSES': BOSSES}
open(d + 'g52/math52.json', 'w', encoding='utf-8').write(json.dumps(pack, ensure_ascii=False).replace('</', '<\\/'))

A = {'poster': poster, 'width': 982, 'height': 1590, 'characters': CH, 'scenes': SCENES, 'cells': CELLS, 'cast': CAST, 'hd': hd}
js = json.dumps(A, ensure_ascii=False).replace('</', '<\\/')
html = '''<style id="wk52-style">
.wk52-board{border:3px solid #e6bd36;border-radius:16px;overflow:hidden;background:#0e3752}
.wk52-photo{display:block;width:100%;height:auto}
.wk52-title{display:flex!important;align-items:center!important;width:100%!important;gap:12px!important;background:linear-gradient(90deg,#ffe15a,#fff5c0)!important;color:#192330!important;border:0!important;border-radius:0!important;padding:10px!important;font:bold clamp(13px,2.5vw,22px) system-ui!important;text-align:left!important;cursor:pointer}
.wk52-title b{background:#133e67;color:#fff;padding:5px 12px;border-radius:6px}
.wk52-title small{margin-left:auto;font-size:11px!important}
.wk52-scene{position:relative}
.wk52-op{position:absolute!important;background:transparent!important;border:2px solid transparent!important;border-radius:10px!important;cursor:pointer;padding:0!important;min-height:0!important;margin:0!important}
.wk52-op:hover,.wk52-op:focus-visible{border-color:#ffe259!important;box-shadow:0 0 14px #ffee69}
.wk52-op span{position:absolute;bottom:0;left:0;right:0;background:#103458e8;color:#fff;font:800 clamp(8px,1.3vw,12px) system-ui;padding:2px;opacity:0;transition:opacity .15s}
.wk52-op:hover span,.wk52-op:focus-visible span{opacity:1}
.wk52-locked{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#08102b99;color:#fff49b;font-weight:bold;pointer-events:none}
.wk52-portrait{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
</style>
<script id="wonki-grade52-script">(()=>{const A=__A__;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
function init(){if(document.getElementById('wkGrade52Sheet'))return;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=document.createElementNS(ns,'defs'),image=document.createElementNS(ns,'image');image.id='wkGrade52Sheet';image.setAttribute('href',A.poster);image.setAttribute('width',A.width);image.setAttribute('height',A.height);defs.appendChild(image);s.appendChild(defs);document.body.appendChild(s);}
function pic(r,label){return '<svg class="wk52-photo" viewBox="'+r.join(' ')+'" role="img" aria-label="'+esc(label)+'"><use href="#wkGrade52Sheet"/></svg>';}
function render(subject,rows){init();return '<section class="wk52-board" aria-label="초5-2 '+esc(subject)+' 단원 목차">'+pic([0,0,A.width,188],'드래곤볼 초5-2 CONTENTS')+rows.map((row,i)=>{const n=row.scene??i,sc=A.scenes[n];const cells=A.cells[n].filter(c=>row.enemies.includes(c[0]));return '<article><button type="button" class="wk52-title" '+row.action+'><b>'+ROMAN[n]+'</b><span>'+esc(row.title)+'</span><small>'+esc(row.status)+'</small></button><div class="wk52-scene">'+pic(sc,row.title+' 캐릭터')+(row.locked?'<span class="wk52-locked">🔒 앞 단원 수련 후 열림</span>':'')+cells.map(([id,x,y,w,h])=>'<button type="button" class="wk52-op" '+row.enemyAction(id)+' aria-disabled="'+!!row.locked+'" aria-label="'+esc(A.characters[id][0])+' '+esc(subject)+' 대결 시작" style="left:'+((x-sc[0])/sc[2]*100)+'%;top:'+((y-sc[1])/sc[3]*100)+'%;width:'+(w/sc[2]*100)+'%;height:'+(h/sc[3]*100)+'%"><span>'+esc(A.characters[id][0])+' · 대결</span></button>').join('')+'</div></article>';}).join('')+pic([0,1412,A.width,178],'강해져라! 수학의 힘!')+'</section>';}
const prev=window.wonkiGrade21Portrait;window.wonkiGrade21Portrait=function(id,grade,name){if(grade==='초5-2'&&A.hd[id])return '<img class="wk52-portrait" src="'+A.hd[id]+'" alt="'+esc(name||A.characters[id][0])+'" decoding="async">';return prev?.(id,grade,name)||null;};
window.WonkiGrade52={render,characters:A.characters,cast:A.cast};})();</script>
'''.replace('__A__', js)
open(d + 'g52/g52.html', 'w', encoding='utf-8').write(html)
import os
print('math52.json', os.path.getsize(d + 'g52/math52.json'), 'g52.html', os.path.getsize(d + 'g52/g52.html'))
