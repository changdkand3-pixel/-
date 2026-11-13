import json, base64, io
from PIL import Image
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'

CH = {'goku42': ['손오공', 150], 'goku110_42': ['손오공', 110], 'goku195_42': ['손오공 (에네르기파)', 195], 'yamcha42': ['야무치', 102], 'krillin42': ['크리링', 115], 'roshi42': ['무천도사', 139],
      'jackie42': ['잭키춘', 139], 'bulma42': ['부르마', 4], 'lunch42': ['런치 (변신)', 13], 'puar42': ['푸알', 2], 'oolong42': ['오룡', 2], 'announcer42': ['아나운서', 2],
      'chiaotzu42': ['차오즈', 94], 'chiaotzu125_42': ['차오즈 (도돈파)', 125], 'tien42': ['천진반', 145], 'tien210_42': ['천진반 (기공포)', 210], 'crane42': ['학도사', 120], 'pamput42': ['팜프트', 62]}
OX = 107
ROWS = [
    (275, 140, [('krillin42', 140, 200), ('yamcha42', 205, 265), ('goku42', 270, 335), ('jackie42', 345, 410), ('bulma42', 418, 480), ('lunch42', 485, 548), ('puar42', 553, 612), ('oolong42', 618, 672), ('announcer42', 678, 735), ('chiaotzu42', 790, 850), ('chiaotzu125_42', 855, 905), ('tien42', 910, 965), ('crane42', 970, 1030)]),
    (470, 140, [('goku42', 140, 200), ('krillin42', 205, 265), ('yamcha42', 272, 340), ('jackie42', 345, 410), ('bulma42', 418, 480), ('lunch42', 485, 548), ('puar42', 553, 612), ('oolong42', 618, 672), ('announcer42', 678, 735), ('pamput42', 790, 850), ('tien42', 855, 905), ('chiaotzu42', 910, 965), ('crane42', 970, 1030)]),
    (660, 145, [('jackie42', 138, 200), ('goku42', 205, 270), ('krillin42', 275, 340), ('yamcha42', 345, 410), ('bulma42', 418, 480), ('lunch42', 485, 548), ('puar42', 553, 612), ('oolong42', 618, 675), ('announcer42', 680, 738), ('tien42', 790, 855), ('chiaotzu42', 862, 945), ('crane42', 950, 1030)]),
    (855, 145, [('krillin42', 138, 200), ('goku42', 205, 270), ('roshi42', 275, 340), ('yamcha42', 345, 410), ('bulma42', 418, 480), ('lunch42', 485, 548), ('puar42', 553, 612), ('oolong42', 618, 675), ('announcer42', 680, 738), ('tien42', 790, 855), ('chiaotzu42', 862, 945), ('crane42', 950, 1030)]),
    (1045, 140, [('goku42', 138, 198), ('goku195_42', 200, 258), ('roshi42', 262, 322), ('yamcha42', 325, 382), ('krillin42', 385, 445), ('bulma42', 448, 503), ('lunch42', 507, 562), ('puar42', 567, 620), ('oolong42', 622, 680), ('announcer42', 683, 738), ('tien42', 785, 845), ('tien210_42', 848, 905), ('chiaotzu42', 908, 965), ('crane42', 968, 1030)]),
    (1230, 145, [('goku110_42', 138, 205), ('roshi42', 210, 295), ('yamcha42', 300, 380), ('krillin42', 385, 465), ('bulma42', 470, 550), ('lunch42', 555, 630), ('puar42', 637, 705), ('oolong42', 710, 785), ('announcer42', 790, 865), ('tien42', 870, 945), ('chiaotzu42', 950, 1030)]),
]
SCENES = [[15, y - 5, 950, h + 10] for y, h, _ in ROWS]
CELLS = [[[i, x0 - OX, y, x1 - x0, h] for i, x0, x1 in row] for y, h, row in ROWS]
CAST = {str(i + 1): [c[0] for c in row] for i, row in enumerate(CELLS)}
BOSSES = {k: [x for x in v if x != 'goku42'] for k, v in CAST.items()}

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# poster
im = Image.open(d + 'drive42/poster42.png').convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6)
poster = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
hd = {k: b64(d + f'g42/{k}.webp', 'image/webp') for k in CH}

# math problems
P = json.load(open(d + 'probs42.json'))
answers = open(d + 'ans42.txt').read().strip().split(',')
answers = [a.replace(';', ',') for a in answers]
assert len(answers) == 100, len(answers)
types = [P[str(n)]['type'] for n in range(1, 101)]
images = []
for n in range(1, 101):
    q = Image.open(d + f'q42/q{n:03d}.png').convert('RGB')
    if q.width > 930: q = q.resize((930, round(q.height * 930 / q.width)), Image.LANCZOS)
    buf = io.BytesIO(); q.save(buf, 'WEBP', quality=82, method=6); images.append('data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode())
POOL = {'1': list(range(1, 9)), '2': list(range(9, 40)), '3': list(range(40, 50)), '4': list(range(50, 66)), '5': list(range(66, 78)), '6': list(range(78, 101))}
assert sorted(sum(POOL.values(), [])) == list(range(1, 101))
UNITS = [['1', '분수의 덧셈과 뺄셈'], ['2', '삼각형'], ['3', '소수의 덧셈과 뺄셈'], ['4', '사각형'], ['5', '꺾은선그래프'], ['6', '다각형']]
pack = {'PT': {k: 'grade42:' + k for k in CH}, 'CH': CH, 'CAST': CAST, 'UNITS': UNITS,
        'UCOL': ['linear-gradient(#58d36f,#1f8a3a)', 'linear-gradient(#6bbcff,#1a63d4)', 'linear-gradient(#ffb454,#d86a0a)', 'linear-gradient(#b779ff,#6a2bb8)', 'linear-gradient(#ff7a6b,#c0261b)', 'linear-gradient(#65d3ca,#137d89)'],
        'POOL': POOL,
        'AREAS': [{'n': '분수', 'e': '🍕', 'x': 20, 'y': 84}, {'n': '삼각형', 'e': '🔺', 'x': 72, 'y': 69}, {'n': '소수', 'e': '🔢', 'x': 27, 'y': 54}, {'n': '사각형', 'e': '🟦', 'x': 72, 'y': 39}, {'n': '꺾은선그래프', 'e': '📈', 'x': 27, 'y': 24}, {'n': '다각형', 'e': '⬡', 'x': 72, 'y': 10}],
        'PICK': ['goku42'] + CAST['1'],
        'Q': {'images': images, 'answers': answers, 'types': types, 'format': 'data-url', 'source': '초4-2 원본 유형 학습지 100문항'},
        'BOSSES': BOSSES}
open(d + 'g42/math42.json', 'w', encoding='utf-8').write(json.dumps(pack, ensure_ascii=False).replace('</', '<\\/'))

A = {'poster': poster, 'width': 981, 'height': 1540, 'characters': CH, 'scenes': SCENES, 'cells': CELLS, 'cast': CAST, 'hd': hd}
js = json.dumps(A, ensure_ascii=False).replace('</', '<\\/')
html = '''<style id="wk42-style">
.wk42-board{border:3px solid #e6bd36;border-radius:16px;overflow:hidden;background:#0e3751}
.wk42-photo{display:block;width:100%;height:auto}
.wk42-title{display:flex!important;align-items:center!important;width:100%!important;gap:12px!important;background:linear-gradient(90deg,#ffe15a,#fff5c0)!important;color:#192330!important;border:0!important;border-radius:0!important;padding:10px!important;font:bold clamp(13px,2.5vw,22px) system-ui!important;text-align:left!important;cursor:pointer}
.wk42-title b{background:#133e67;color:#fff;padding:5px 12px;border-radius:6px}
.wk42-title small{margin-left:auto;font-size:11px!important}
.wk42-scene{position:relative}
.wk42-op{position:absolute!important;background:transparent!important;border:2px solid transparent!important;border-radius:10px!important;cursor:pointer;padding:0!important;min-height:0!important;margin:0!important}
.wk42-op:hover,.wk42-op:focus-visible{border-color:#ffe259!important;box-shadow:0 0 14px #ffee69}
.wk42-op span{position:absolute;bottom:0;left:0;right:0;background:#103458e8;color:#fff;font:800 clamp(8px,1.3vw,12px) system-ui;padding:2px;opacity:0;transition:opacity .15s}
.wk42-op:hover span,.wk42-op:focus-visible span{opacity:1}
.wk42-locked{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#08102b99;color:#fff49b;font-weight:bold;pointer-events:none}
.wk42-portrait{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
</style>
<script id="wonki-grade42-script">(()=>{const A=__A__;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
function init(){if(document.getElementById('wkGrade42Sheet'))return;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=document.createElementNS(ns,'defs'),image=document.createElementNS(ns,'image');image.id='wkGrade42Sheet';image.setAttribute('href',A.poster);image.setAttribute('width',A.width);image.setAttribute('height',A.height);defs.appendChild(image);s.appendChild(defs);document.body.appendChild(s);}
function pic(r,label){return '<svg class="wk42-photo" viewBox="'+r.join(' ')+'" role="img" aria-label="'+esc(label)+'"><use href="#wkGrade42Sheet"/></svg>';}
function render(subject,rows){init();return '<section class="wk42-board" aria-label="초4-2 '+esc(subject)+' 단원 목차">'+pic([0,0,A.width,226],'드래곤볼 초4-2 CONTENTS')+rows.map((row,i)=>{const n=row.scene??i,sc=A.scenes[n];const cells=A.cells[n].filter(c=>row.enemies.includes(c[0]));return '<article><button type="button" class="wk42-title" '+row.action+'><b>'+ROMAN[n]+'</b><span>'+esc(row.title)+'</span><small>'+esc(row.status)+'</small></button><div class="wk42-scene">'+pic(sc,row.title+' 캐릭터')+(row.locked?'<span class="wk42-locked">🔒 앞 단원 수련 후 열림</span>':'')+cells.map(([id,x,y,w,h])=>'<button type="button" class="wk42-op" '+row.enemyAction(id)+' aria-disabled="'+!!row.locked+'" aria-label="'+esc(A.characters[id][0])+' '+esc(subject)+' 대결 시작" style="left:'+((x-sc[0])/sc[2]*100)+'%;top:'+((y-sc[1])/sc[3]*100)+'%;width:'+(w/sc[2]*100)+'%;height:'+(h/sc[3]*100)+'%"><span>'+esc(A.characters[id][0])+' · 대결</span></button>').join('')+'</div></article>';}).join('')+pic([0,1388,A.width,152],'강해져라! 수학의 힘!')+'</section>';}
const prev=window.wonkiGrade21Portrait;window.wonkiGrade21Portrait=function(id,grade,name){if(grade==='초4-2'&&A.hd[id])return '<img class="wk42-portrait" src="'+A.hd[id]+'" alt="'+esc(name||A.characters[id][0])+'" decoding="async">';return prev?.(id,grade,name)||null;};
window.WonkiGrade42={render,characters:A.characters,cast:A.cast};})();</script>
'''.replace('__A__', js)
open(d + 'g42/g42.html', 'w', encoding='utf-8').write(html)
import os
print('math42.json', os.path.getsize(d + 'g42/math42.json'), 'g42.html', os.path.getsize(d + 'g42/g42.html'))
