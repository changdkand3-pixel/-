import json, base64, io
from PIL import Image
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'

CH = {'goku31': ['손오공', 125], 'yamcha31': ['야무치', 58], 'puar31': ['푸알', 2], 'krillin31': ['크리링', 70],
      'roshi31': ['무천도사', 120], 'bulma31': ['부르마', 4], 'lunch31': ['런치(변신)', 13], 'oolong31': ['오룡', 2],
      'upa31': ['우파', 3], 'baba31': ['점쟁이 바바', 50], 'dracula31': ['드라큘라맨', 67], 'invisible31': ['투명인간', 40]}
# poster 981x1625: card strip of each unit and the card of every character in it
SCENES = [[20, 326, 942, 152], [20, 526, 942, 152], [20, 730, 942, 155], [20, 928, 942, 155], [20, 1130, 942, 145], [20, 1322, 942, 148]]
X8 = [30, 147, 263, 380, 497, 613, 729, 845]; W8 = [112, 111, 111, 110, 111, 110, 111, 110]
CELLS = [
    [[i, X8[k], 332, W8[k], 140] for k, i in enumerate(['goku31', 'yamcha31', 'puar31', 'krillin31', 'roshi31', 'bulma31', 'lunch31', 'oolong31'])],
    [[i, X8[k], 532, W8[k], 143] for k, i in enumerate(['goku31', 'yamcha31', 'puar31', 'krillin31', 'upa31', 'baba31'])],
    [[i, X8[k], 735, W8[k], 145] for k, i in enumerate(['krillin31', 'puar31', 'upa31', 'goku31', 'yamcha31', 'baba31'])] + [['dracula31', 818, 735, 137, 145]],
    [[i, X8[k], 933, W8[k], 145] for k, i in enumerate(['upa31', 'puar31', 'krillin31', 'goku31', 'yamcha31', 'baba31'])] + [['dracula31', 818, 933, 137, 145]],
    [['yamcha31', 30, 1135, 98, 135], ['upa31', 133, 1135, 100, 135], ['puar31', 240, 1135, 100, 135], ['krillin31', 348, 1135, 99, 135], ['goku31', 455, 1135, 95, 135], ['baba31', 558, 1135, 162, 135], ['invisible31', 822, 1135, 133, 135]],
    [['yamcha31', 30, 1328, 82, 137], ['upa31', 118, 1328, 80, 137], ['puar31', 204, 1328, 80, 137], ['krillin31', 290, 1328, 78, 137], ['goku31', 374, 1328, 80, 137], ['roshi31', 460, 1328, 80, 137], ['bulma31', 547, 1328, 81, 137], ['baba31', 636, 1328, 114, 137], ['invisible31', 836, 1328, 119, 137]],
]
CAST = {str(i + 1): [c[0] for c in row] for i, row in enumerate(CELLS)}
BOSSES = {k: [x for x in v if x != 'goku31'] for k, v in CAST.items()}

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# poster
im = Image.open(d + 'drive31/초3-1.jpg').convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6)
poster = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
hd = {k: b64(d + f'g31/{k}.webp', 'image/webp') for k in CH}

# math problems
P = json.load(open(d + 'probs31.json'))
answers = ['1','2','441','792','747','378','5','815','818','904','925','603','833','901','431','929','263','248','388','668','258','547','248','257','2','3','156','139','88','248','5','379','593','818','5','32',
           '32','5','126','90','11','12','2,3,5','12','16','8','3','11','4','3','17','15','8','5','32','5','5','4','2','6','9','22','8','8','18','18','4,5','4','10','16','3','4','18','9','9',
           '155','72','78','315','3','3','21','245','84','2744','174','5','8','3','3','16','2','6','5','7','5','2','3','1','4']
assert len(answers) == 100
types = [P[str(n)]['type'] for n in range(1, 101)]
for n in (15, 16): types[n - 1] = '받아올림이 두(세) 번 있는 (세 자리 수)＋(세 자리 수)의 실생활 문제 해결하기'
for n in (79, 80): types[n - 1] = '곱셈의 실생활 문제 해결하기'
images = []
for n in range(1, 101):
    q = Image.open(d + f'q31/q{n:03d}.png').convert('RGB')
    if q.width > 930: q = q.resize((930, round(q.height * 930 / q.width)), Image.LANCZOS)
    buf = io.BytesIO(); q.save(buf, 'WEBP', quality=82, method=6); images.append('data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode())
POOL = {'1': [1] + list(range(3, 35)), '2': list(range(35, 56)), '3': list(range(56, 76)), '4': [2] + list(range(76, 85)), '5': list(range(85, 92)), '6': list(range(92, 101))}
assert sorted(sum(POOL.values(), [])) == list(range(1, 101))
UNITS = [['1', '덧셈과 뺄셈'], ['2', '평면도형'], ['3', '나눗셈'], ['4', '곱셈'], ['5', '길이와 시간'], ['6', '분수와 소수']]
pack = {'PT': {k: 'grade31:' + k for k in CH}, 'CH': CH, 'CAST': CAST, 'UNITS': UNITS,
        'UCOL': ['linear-gradient(#58d36f,#1f8a3a)', 'linear-gradient(#6bbcff,#1a63d4)', 'linear-gradient(#ffb454,#d86a0a)', 'linear-gradient(#b779ff,#6a2bb8)', 'linear-gradient(#ff7a6b,#c0261b)', 'linear-gradient(#65d3ca,#137d89)'],
        'POOL': POOL,
        'AREAS': [{'n': '덧셈과 뺄셈', 'e': '➕', 'x': 20, 'y': 84}, {'n': '평면도형', 'e': '🔺', 'x': 72, 'y': 69}, {'n': '나눗셈', 'e': '➗', 'x': 27, 'y': 54}, {'n': '곱셈', 'e': '✖️', 'x': 72, 'y': 39}, {'n': '길이와 시간', 'e': '⏱️', 'x': 27, 'y': 24}, {'n': '분수와 소수', 'e': '🍕', 'x': 72, 'y': 10}],
        'PICK': CAST['1'],
        'Q': {'images': images, 'answers': answers, 'types': types, 'format': 'data-url', 'source': '초3-1 원본 유형 학습지 100문항'},
        'BOSSES': BOSSES}
open(d + 'g31/math31.json', 'w', encoding='utf-8').write(json.dumps(pack, ensure_ascii=False).replace('</', '<\\/'))

A = {'poster': poster, 'width': 981, 'height': 1625, 'characters': CH, 'scenes': SCENES, 'cells': CELLS, 'cast': CAST, 'hd': hd}
js = json.dumps(A, ensure_ascii=False).replace('</', '<\\/')
html = '''<style id="wk31-style">
.wk31-board{border:3px solid #e6bd36;border-radius:16px;overflow:hidden;background:#0e3751}
.wk31-photo{display:block;width:100%;height:auto}
.wk31-title{display:flex!important;align-items:center!important;width:100%!important;gap:12px!important;background:linear-gradient(90deg,#ffe15a,#fff5c0)!important;color:#192330!important;border:0!important;border-radius:0!important;padding:10px!important;font:bold clamp(13px,2.5vw,22px) system-ui!important;text-align:left!important;cursor:pointer}
.wk31-title b{background:#133e67;color:#fff;padding:5px 12px;border-radius:6px}
.wk31-title small{margin-left:auto;font-size:11px!important}
.wk31-scene{position:relative}
.wk31-op{position:absolute!important;background:transparent!important;border:2px solid transparent!important;border-radius:10px!important;cursor:pointer;padding:0!important;min-height:0!important;margin:0!important}
.wk31-op:hover,.wk31-op:focus-visible{border-color:#ffe259!important;box-shadow:0 0 14px #ffee69}
.wk31-op span{position:absolute;bottom:0;left:0;right:0;background:#103458e8;color:#fff;font:800 clamp(8px,1.3vw,12px) system-ui;padding:2px;opacity:0;transition:opacity .15s}
.wk31-op:hover span,.wk31-op:focus-visible span{opacity:1}
.wk31-locked{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#08102b99;color:#fff49b;font-weight:bold;pointer-events:none}
.wk31-portrait{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
</style>
<script id="wonki-grade31-script">(()=>{const A=__A__;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
function init(){if(document.getElementById('wkGrade31Sheet'))return;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=document.createElementNS(ns,'defs'),image=document.createElementNS(ns,'image');image.id='wkGrade31Sheet';image.setAttribute('href',A.poster);image.setAttribute('width',A.width);image.setAttribute('height',A.height);defs.appendChild(image);s.appendChild(defs);document.body.appendChild(s);}
function pic(r,label){return '<svg class="wk31-photo" viewBox="'+r.join(' ')+'" role="img" aria-label="'+esc(label)+'"><use href="#wkGrade31Sheet"/></svg>';}
function render(subject,rows){init();return '<section class="wk31-board" aria-label="초3-1 '+esc(subject)+' 단원 목차">'+pic([0,0,A.width,272],'드래곤볼 초3-1 CONTENTS')+rows.map((row,i)=>{const n=row.scene??i,sc=A.scenes[n];const cells=A.cells[n].filter(c=>row.enemies.includes(c[0]));return '<article><button type="button" class="wk31-title" '+row.action+'><b>'+ROMAN[n]+'</b><span>'+esc(row.title)+'</span><small>'+esc(row.status)+'</small></button><div class="wk31-scene">'+pic(sc,row.title+' 캐릭터')+(row.locked?'<span class="wk31-locked">🔒 앞 단원 수련 후 열림</span>':'')+cells.map(([id,x,y,w,h])=>'<button type="button" class="wk31-op" '+row.enemyAction(id)+' aria-disabled="'+!!row.locked+'" aria-label="'+esc(A.characters[id][0])+' '+esc(subject)+' 대결 시작" style="left:'+((x-sc[0])/sc[2]*100)+'%;top:'+((y-sc[1])/sc[3]*100)+'%;width:'+(w/sc[2]*100)+'%;height:'+(h/sc[3]*100)+'%"><span>'+esc(A.characters[id][0])+' · 대결</span></button>').join('')+'</div></article>';}).join('')+pic([0,1478,A.width,147],'강해져라! 수학의 힘!')+'</section>';}
const prev=window.wonkiGrade21Portrait;window.wonkiGrade21Portrait=function(id,grade,name){if(grade==='초3-1'&&A.hd[id])return '<img class="wk31-portrait" src="'+A.hd[id]+'" alt="'+esc(name||A.characters[id][0])+'" decoding="async">';return prev?.(id,grade,name)||null;};
window.WonkiGrade31={render,characters:A.characters,cast:A.cast};})();</script>
'''.replace('__A__', js)
open(d + 'g31/g31.html', 'w', encoding='utf-8').write(html)
import os
print('math31.json', os.path.getsize(d + 'g31/math31.json'), 'g31.html', os.path.getsize(d + 'g31/g31.html'))
