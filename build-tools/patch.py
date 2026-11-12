import sys, base64, re
src, art, out = sys.argv[1], sys.argv[2], sys.argv[3]
t = open(src, 'rb').read().decode('utf-8')
L = t.split('\n')
def line(n): return L[n-1]
def setline(n, s): L[n-1] = s

# ---------- 1. new expanded-world picture (sharp original map composited into the park art)
b64 = base64.b64encode(open(art, 'rb').read()).decode()
l = line(6594); assert l.startswith('<img id="wk44WorldArt"')
setline(6594, re.sub(r'src="data:image/webp;base64,[^"]*"', 'src="data:image/webp;base64,' + b64 + '"', l, count=1))

# ---------- 2. 1,000 building types: 100 drawings x 10 colour themes
assert line(6836).startswith('/* 49차')
assert line(6845) == '}'
core = r"""/* 50차: 건물 1,000종 = 기본 그림 100종 x 색 테마 10종. 예전 49차 항목은 저장된 배치를 읽기 위해서만 남겨 둡니다. */
const TINTS=[null,{name:'노을빛',ops:[['hue',-28],['sat',1.25]]},{name:'숲속',ops:[['hue',80]]},{name:'바다빛',ops:[['hue',150]]},{name:'보랏빛',ops:[['hue',220]]},{name:'장밋빛',ops:[['hue',300]]},{name:'황금빛',ops:[['sepia'],['sat',1.7],['light',1.05,0]]},{name:'민트',ops:[['hue',120],['sat',.7],['light',.92,.1]]},{name:'밤하늘',ops:[['hue',200],['light',.78,0]]},{name:'파스텔',ops:[['sat',.45],['light',.78,.24]]}];
const wk49Bases=Object.entries(TYPES).filter(([k,v])=>v&&Number.isFinite(v.cell));
const wk49Groups=[['놀이기구','🎢','스릴','가족','어린이','야간','축제'],['조경','🌳','봄','여름','가을','겨울','꽃길'],['장식','🎀','파스텔','클래식','레트로','환상','축제'],['편의시설','🏪','휴식','간식','안내','기념품','야외'],['건물','🏰','미니','중형','대형','특별','테마'],['도로·광장','🧱','산책','광장','정원','호수','야경']];
for(let n=0;n<1000;n++){
 const base=wk49Bases[n%wk49Bases.length];if(!base)break;
 const group=wk49Groups[Math.floor(n/wk49Bases.length)%wk49Groups.length];
 const variation=group[2+(Math.floor(n/(wk49Bases.length*wk49Groups.length))%5)];
 TYPES['wk49_item_'+String(n+1).padStart(4,'0')]={...base[1],name:variation+' '+base[1].name+' '+String(n+1).padStart(3,'0'),category:group[0],icon:group[1],variantOf:base[0],legacy:true};
}
for(let k=1;k<TINTS.length;k++)for(const [baseId,base] of wk49Bases)TYPES['wk50_'+baseId+'_'+k]={...base,name:TINTS[k].name+' '+base.name,variantOf:baseId,tint:k};"""
L[6835:6845] = [core]
# fix the export so the editor can read the colour themes
idx = next(i for i, s in enumerate(L) if s.startswith('root.WonkiParkCore36={TYPES,builtins,clean'))
L[idx] = L[idx].replace('root.WonkiParkCore36={TYPES,', 'root.WonkiParkCore36={TINTS,TYPES,')
t = '\n'.join(L)

def rep(old, new, count=1):
    global t
    assert t.count(old) == count, (old[:80], t.count(old))
    t = t.replace(old, new)

# ---------- 3. editor: art with colour themes + filters
rep("""const art=type=>{const t=C.TYPES[type],x=(t.cell%5)*200,y=Math.floor(t.cell/5)*200;return '<svg x="0" y="0" width="100" height="100" viewBox="'+x+' '+y+' 200 200" overflow="hidden"><use href="#wkBuildingSheet38_'+t.sheet+'"/></svg>';};""",
"""const art=type=>{const t=C.TYPES[type]||C.TYPES.wheel,x=(t.cell%5)*200,y=Math.floor(t.cell/5)*200,use='<use href="#wkBuildingSheet38_'+t.sheet+'"/>';return '<svg x="0" y="0" width="100" height="100" viewBox="'+x+' '+y+' 200 200" overflow="hidden">'+(t.tint?'<g filter="url(#wk50Tint'+t.tint+')">'+use+'</g>':use)+'</svg>';};""")
rep("""sheets.forEach((src,i)=>svg('image',{id:'wkBuildingSheet38_'+i,href:src,width:1000,height:1000,preserveAspectRatio:'none'},symbols));""",
"""sheets.forEach((src,i)=>svg('image',{id:'wkBuildingSheet38_'+i,href:src,width:1000,height:1000,preserveAspectRatio:'none'},symbols));
 (C.TINTS||[]).forEach((tint,k)=>{if(!tint)return;const f=svg('filter',{id:'wk50Tint'+k,'color-interpolation-filters':'sRGB',x:'0',y:'0',width:'1',height:'1'},symbols);for(const op of tint.ops){if(op[0]==='hue')svg('feColorMatrix',{type:'hueRotate',values:op[1]},f);else if(op[0]==='sat')svg('feColorMatrix',{type:'saturate',values:op[1]},f);else if(op[0]==='sepia')svg('feColorMatrix',{type:'matrix',values:'.393 .769 .189 0 0 .349 .686 .168 0 0 .272 .534 .131 0 0 0 0 0 1 0'},f);else if(op[0]==='light'){const c=svg('feComponentTransfer',{},f);for(const ch of ['feFuncR','feFuncG','feFuncB'])svg(ch,{type:'linear',slope:op[1],intercept:op[2]},c);}}});""")
rep("""for(const [id,t] of Object.entries(C.TYPES)){const option=el('option',t.category+' · '+t.name,palette);option.value=id;}""",
"""for(const [id,t] of Object.entries(C.TYPES)){if(t.legacy)continue;const option=el('option',t.category+' · '+t.name,palette);option.value=id;}""")
rep("""wk49Search.placeholder='🔎 놀이기구·조경·장식·건물 검색 (1,000종 이상)';""", """wk49Search.placeholder='🔎 건물 1,000종 검색 (예: 관람차, 바다빛, 카페)';""")
rep("""for(const cat of [...new Set(Object.values(C.TYPES).map(t=>t.category))])""", """for(const cat of [...new Set(Object.values(C.TYPES).filter(t=>!t.legacy).map(t=>t.category))])""")
rep("""draft.buildings.length+'/200개""", """draft.buildings.length+'/1000개""")
# first build crashed: 'castle' is not a building type
rep("""tool='castle',previousOverflow=''""", """tool='wheel',previousOverflow=''""")
rep("""palette.value=tool;palette.onchange=""", """if(!C.TYPES[tool]||C.TYPES[tool].legacy)tool='wheel';palette.value=tool;palette.onchange=""")
# editor: remember the new building so the main map shows it right away after closing
rep("""draft.buildings.push(b);selected=b.id;lastPlaced=b.id;""", """draft.buildings.push(b);selected=b.id;lastPlaced=b.id;window.__wk50Added=b.id;window.__wk52Fresh=b.id;""")
rep("""function close(){root?.remove();renderPublic();root=null;document.body.style.overflow=previousOverflow;window.WonkiParkLife?.sync?.();}""",
"""function close(){const wasOpen=!!root;root?.remove();root=null;document.body.style.overflow=previousOverflow;renderPublic();window.WonkiParkLife?.sync?.();if(wasOpen&&window.__wk50Added){lastPlaced=window.__wk50Added;window.__wk50Added='';setTimeout(highlight,80);}}""")
# editor canvas: draw the same expanded picture as the main map, at the same position
rep("""if(wa&&wa.src)svg('image',{href:wa.src,x:-350,y:-140.75,width:1700,height:957.1,preserveAspectRatio:'none'},canvas);""",
"""if(wa&&wa.src)svg('image',{href:wa.src,x:-600,y:-225.2,width:2350,height:1154.2,preserveAspectRatio:'none'},canvas);""")

t = t.split('\n') if False else t
L = t.split('\n')
def find(prefix):
    r = [i for i, s in enumerate(L) if s.startswith(prefix)]
    assert len(r) == 1, (prefix, len(r)); return r[0]

# ---------- 4. main map: no zoom jump / no yellow highlight when coming back
i = find(" function highlight(){const target=document.querySelector('.wk-built36[data-building-id=\"'+lastPlaced+'\"]');")
L[i] = r""" function highlight(){const target=document.querySelector('.wk-built36[data-building-id="'+lastPlaced+'"]');if(!target)return;const viewport=document.getElementById('wonkiMapViewport');if(!viewport)return;const fr=viewport.getBoundingClientRect();if(fr.bottom<0||fr.top>innerHeight)viewport.scrollIntoView({block:'center'});requestAnimationFrame(()=>{const a=target.getBoundingClientRect(),v=viewport.getBoundingClientRect();viewport.scrollBy({left:a.left+a.width/2-v.left-v.width/2,top:a.top+a.height/2-v.top-v.height/2,behavior:'smooth'});});}"""

# ---------- 5. main map: tap a building -> shrink / enlarge / move / delete toolbar; drag any time
i = find(" const visible=personalState();document.getElementById('wonkiCustomBuildings36')?.remove();")
L[i] = r""" const visible=personalState();document.getElementById('wonkiCustomBuildings36')?.remove();document.querySelectorAll('.wk36-custom-course').forEach(n=>n.remove());const layer=el('div');layer.id='wonkiCustomBuildings36';(document.getElementById('wk44Origin')||stage).appendChild(layer);if(mainSel&&!visible.buildings.some(b=>b.id===mainSel))mainSel='';for(const b of visible.buildings){const button=el('button',undefined,layer);button.type='button';button.className='wk-built36';button.dataset.buildingId=b.id;button.style.setProperty('width',(Math.max(3,11.5*(b.scale||1)))+'%','important');button.style.setProperty('max-width','none','important');button.style.left=b.x*100+'%';button.style.top=b.y*100+'%';button.setAttribute('aria-label',b.name+' · 눌러서 크기·이동·삭제');button.title='눌러서 편집 · 끌어서 이동 · 두 번 눌러 코스 열기';const image=svg('svg',{viewBox:'0 0 100 100'},button);image.innerHTML=art(b.type);image.style.transform='rotate('+b.rotation+'deg)';el('span',b.name,button);const xb=el('span','✕',button);xb.className='wk50-x';xb.setAttribute('role','button');xb.setAttribute('aria-label',b.name+' 삭제');xb.title='이 건물 삭제';xb.addEventListener('pointerdown',ev=>ev.stopPropagation());xb.onclick=ev=>{ev.preventDefault();ev.stopPropagation();wk50Delete(b.id);};if(b.id===mainSel)button.classList.add('wk42-sel');enableDrag(button,b);button.onclick=e=>{e.preventDefault();e.stopPropagation();const now=Date.now();if(wk50Click.id===b.id&&now-wk50Click.t<500){wk50Click={id:'',t:0};mainSel=b.id;renameMain(b.id);return;}wk50Click={id:b.id,t:now};if(mainSel===b.id&&document.getElementById('wk50Tools'))return;selectMain(b.id);};}if(mainSel)requestAnimationFrame(()=>showTools(layer));"""

i = find("function showPanel(focus){")
j = find(" if(focus)setTimeout(()=>{name.focus();name.select();},0);}")
L[i:j+1] = [r"""function showPanel(){document.getElementById('wk42-panel')?.remove();if(!mainSel)document.getElementById('wk50Tools')?.remove();}
let wk50Click={id:'',t:0};
function renameMain(id){const c=personalState().buildings.find(x=>x.id===id);if(!c)return;const v=prompt('건물 이름 바꾸기',c.name);if(v&&v.trim())mainEdit(s=>{const t=s.buildings.find(x=>x.id===id);if(t)t.name=v.trim().slice(0,40);});else renderPublic();}
function wk50Delete(id){const before=localStorage.getItem(key()),name=personalState().buildings.find(x=>x.id===id)?.name||'건물';deleteMain(id);wk50Toast(name+' 삭제됨',()=>{try{if(before===null)localStorage.removeItem(key());else localStorage.setItem(key(),before);}catch(_){}mainSel=id;renderPublic();});}
function wk50Toast(text,undo){document.getElementById('wk50Toast')?.remove();const box=el('div',undefined,document.body);box.id='wk50Toast';box.setAttribute('role','status');el('span',text,box);if(undo){const u=el('button','↶ 되돌리기',box);u.type='button';u.onclick=()=>{undo();box.remove();};}const x=el('button','✕',box);x.type='button';x.setAttribute('aria-label','알림 닫기');x.onclick=()=>box.remove();clearTimeout(wk50Toast.t);wk50Toast.t=setTimeout(()=>box.remove(),7000);}
function showTools(layer){document.getElementById('wk50Tools')?.remove();const b=curMain(),target=layer.querySelector('.wk-built36[data-building-id="'+mainSel+'"]');if(!b||!target)return;
 const bar=el('div',undefined,layer);bar.id='wk50Tools';bar.setAttribute('role','toolbar');bar.setAttribute('aria-label',b.name+' 편집');
 const stop=e=>e.stopPropagation();['pointerdown','touchstart','mousedown','dblclick','wheel'].forEach(ev=>bar.addEventListener(ev,stop,{passive:true}));
 el('b',b.name+' · '+Math.round((b.scale||1)*100)+'%',bar).className='wk50-title';
 const row=el('div',undefined,bar);row.className='wk50-row';
 const btn=(label,title,fn,cls)=>{const x=el('button',label,row);x.type='button';x.title=title;x.setAttribute('aria-label',title);if(cls)x.className=cls;x.onclick=e=>{e.preventDefault();e.stopPropagation();fn();};return x;};
 const scaleBy=d=>mainEdit(s=>{const t=s.buildings.find(x=>x.id===mainSel);if(t)t.scale=Math.max(.2,Math.min(4,Math.round(((t.scale||1)+d)*100)/100));});
 const moveBy=(dx,dy)=>mainEdit(s=>{const t=s.buildings.find(x=>x.id===mainSel);if(t){t.x=Math.max(-.32,Math.min(1.32,Math.round((t.x+dx)*400)/400));t.y=Math.max(-.12,Math.min(1.42,Math.round((t.y+dy)*400)/400));}});
 btn('🔍−','건물 축소',()=>scaleBy(-.1));btn('🔍＋','건물 확대',()=>scaleBy(.1));
 btn('←','왼쪽으로 이동',()=>moveBy(-.01,0));btn('↑','위로 이동',()=>moveBy(0,-.015));btn('↓','아래로 이동',()=>moveBy(0,.015));btn('→','오른쪽으로 이동',()=>moveBy(.01,0));
 btn('↻','회전',()=>mainEdit(s=>{const t=s.buildings.find(x=>x.id===mainSel);if(t)t.rotation=(t.rotation+90)%360;}));
 btn('✏️','이름 바꾸기',()=>renameMain(mainSel));
 if(b.courseId)btn('🚪','연결된 코스 열기',()=>{const v=personalState();if(C.builtins.includes(b.courseId))document.getElementById(b.courseId)?.click();else showCourse(v.courses.find(c=>c.id===b.courseId)||{name:b.name,content:C.TYPES[b.type].name});});
 btn('🗑 삭제','이 건물 삭제',()=>wk50Delete(mainSel),'wk50-del');
 btn('✕','편집 닫기',()=>{mainSel='';renderPublic();},'wk50-close');
 el('small','끌어서 이동 · 두 번 누르면 이름 바꾸기 · ✕ 삭제',bar);
 const vv=document.getElementById('wonkiMapViewport');if(vv)bar.style.maxWidth=Math.max(200,vv.clientWidth-34)+'px';
 const lr=layer.getBoundingClientRect(),tr=target.getBoundingClientRect();if(lr.width&&lr.height){bar.style.left=((tr.left+tr.width/2-lr.left)/lr.width*100)+'%';bar.style.top=((tr.bottom-lr.top+6)/lr.height*100)+'%';const v=document.getElementById('wonkiMapViewport');if(v){const vr=v.getBoundingClientRect(),br=bar.getBoundingClientRect();let dx=0;if(br.left<vr.left+6)dx=vr.left+6-br.left;else if(br.right>vr.right-18)dx=vr.right-18-br.right;if(dx)bar.style.left=(parseFloat(bar.style.left)+dx/lr.width*100)+'%';}}
}
document.addEventListener('pointerdown',e=>{if(!mainSel||e.target.closest?.('.wk-built36,#wk50Tools,#wk50Toast,.wk36-modal'))return;mainSel='';renderPublic();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mainSel&&!root){mainSel='';renderPublic();}});"""]

i = find("const editBtn=el('button','✏️ 메인에서 건물 편집',tools);")
assert L[i+1].startswith("editBtn.onclick=")
del L[i:i+2]
i = find("function selectMain(id){")
L[i] = "function selectMain(id){mainSel=id;renderPublic();}"
t = '\n'.join(L)
# drag end: just re-select (toolbar follows)
rep("""if(moved){mainEdit(d=>{const t=d.buildings.find(x=>x.id===b.id);if(t){t.x=Math.round(nx*400)/400;t.y=Math.round(ny*400)/400;}});selectMain(b.id);}};""",
"""if(moved){mainSel='';mainEdit(d=>{const t=d.buildings.find(x=>x.id===b.id);if(t){t.x=Math.round(nx*400)/400;t.y=Math.round(ny*400)/400;}});}};""")
rep("""button.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('.wk42-x'))return;""","""button.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('.wk42-x,.wk50-x'))return;""")
rep("""const mv=ev=>{if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<5)return;moved=true;""", """const mv=ev=>{if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<5)return;if(!moved)document.getElementById('wk50Tools')?.remove();moved=true;""")


# ---------- 8. editor: tap a picture to place it, red X + resize handle, save & exit
rep("""function editor(){const box=modal('🏗 공원 건물 짓기');""","""function editor(){const box=modal('🏗 공원 건물 짓기');{const hd=box.querySelector('header');const sv=el('button','💾 저장 후 나가기');sv.type='button';sv.className='wk50-saveexit';sv.onclick=()=>{save();const added=!!window.__wk50Added;close();wk50Toast(added?'저장했어요 · 새 건물이 지도에 표시됩니다':'저장했어요');};hd.insertBefore(sv,hd.lastChild);}""")
rep("""wk49Search.oninput=wk49Filter;wk49Category.onchange=wk49Filter;""","""const wk50Grid=el('div');wk50Grid.className='wk50-picker';wk50Grid.setAttribute('aria-label','건물 그림 목록 · 누르면 바로 지도에 놓입니다');let wk50Limit=60;
function wk50RenderGrid(){wk50Grid.replaceChildren();const q=wk49Search.value.trim().toLowerCase(),cat=wk49Category.value;const list=Object.entries(C.TYPES).filter(([id,t])=>!t.legacy&&(!cat||t.category===cat)&&(!q||(t.category+' '+t.name).toLowerCase().includes(q)));const head=el('div',list.length?'👇 그림을 누르면 바로 지도에 놓여요 ('+list.length+'종)':'찾는 건물이 없어요',wk50Grid);head.className='wk50-picker-head';const row=el('div',undefined,wk50Grid);row.className='wk50-picker-row';for(const [id,t] of list.slice(0,wk50Limit)){const it=el('button',undefined,row);it.type='button';it.className='wk50-pick';it.title=t.name+' 놓기';it.setAttribute('aria-label',t.name+' 지도에 놓기');const g=svg('svg',{viewBox:'0 0 100 100'},it);g.innerHTML=art(id);el('span',t.name,it);it.onclick=()=>{tool=id;palette.value=id;addBuilding.onclick();};}if(list.length>wk50Limit){const more=el('button','＋ 더 보기 ('+(list.length-wk50Limit)+'종 남음)',row);more.type='button';more.className='wk50-more';more.onclick=()=>{wk50Limit+=60;wk50RenderGrid();};}}
wk49Search.oninput=()=>{wk49Filter();wk50Limit=60;wk50RenderGrid();};wk49Category.onchange=()=>{wk49Filter();wk50Limit=60;wk50RenderGrid();};""")
rep("""
 const canvas=svg('svg',{viewBox:'-350 -140.75 1700 957.1',preserveAspectRatio:'xMidYMid meet','aria-label':'공원 배치 편집 지도'},box);""","""
 box.appendChild(wk50Grid);wk50RenderGrid();palette.style.display='none';
 const canvas=svg('svg',{viewBox:'-350 -140.75 1700 957.1',preserveAspectRatio:'xMidYMid meet','aria-label':'공원 배치 편집 지도'},box);""")
rep("""const label=svg('text',{x:0,y:Math.max(28,65*(b.scale||1)),""","""if(b.id===selected&&window.__wk52Fresh!==b.id){const k=1.15*(b.scale||1),hb=svg('g',{'class':'wk50-handles'},group);svg('rect',{x:-50*k,y:-80*k,width:100*k,height:100*k,fill:'none',stroke:'#3b8fe0','stroke-width':3,'stroke-dasharray':'10 6',rx:8},hb);const dx=svg('g',{'data-wk50-del':'1',transform:'translate('+(50*k)+' '+(-80*k)+')',style:'cursor:pointer'},hb);svg('circle',{r:19,fill:'#e53935',stroke:'#fff','stroke-width':4},dx);const xt=svg('text',{'text-anchor':'middle',y:8,'font-size':24,'font-weight':'bold',fill:'#fff'},dx);xt.textContent='✕';const rz=svg('g',{'data-wk50-resize':'1',transform:'translate('+(50*k)+' '+(20*k)+')',style:'cursor:nwse-resize'},hb);svg('rect',{x:-17,y:-17,width:34,height:34,rx:8,fill:'#3b8fe0',stroke:'#fff','stroke-width':4},rz);const rt=svg('text',{'text-anchor':'middle',y:8,'font-size':22,'font-weight':'bold',fill:'#fff'},rz);rt.textContent='⤡';}const label=svg('text',{x:0,y:Math.max(28,65*(b.scale||1)),""")
rep("""const ptrs=new Map();let gesture=false,pan=null,pinchD=0;""","""canvas.addEventListener('pointerdown',e=>{const del=e.target.closest?.('[data-wk50-del]'),rs=e.target.closest?.('[data-wk50-resize]');if(!del&&!rs)return;e.preventDefault();e.stopPropagation();const b=draft.buildings.find(x=>x.id===selected);if(!b)return;if(del){removeSelected();return;}remember();const cx=b.x*1000,cy=b.y*563-30*1.15*(b.scale||1),p0=svgPt(e.clientX,e.clientY),d0=Math.max(10,Math.hypot(p0.x-cx,p0.y-cy)),s0=b.scale||1;const mv=ev=>{const p=svgPt(ev.clientX,ev.clientY),d=Math.hypot(p.x-cx,p.y-cy);b.scale=Math.max(.2,Math.min(4,Math.round(s0*d/d0*100)/100));paint();},up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);save();paint();status('크기를 '+Math.round((b.scale||1)*100)+'%로 바꿨어요.');};window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);},true);
  const ptrs=new Map();let gesture=false,pan=null,pinchD=0;""")
rep("""status('내 기기 초안 · 건물을 눌러 선택하고 끌어서 이동 · 새 건물은 위의 ➕ 버튼으로만 추가 · '+draft.buildings.length+'/1000개""","""status('내 기기 초안 · 위 그림을 누르면 바로 놓여요 · 끌어서 이동 · 파란 ⤡ 손잡이로 크기 · 빨간 ✕로 삭제 · '+draft.buildings.length+'/1000개""")

# ---------- 7. sync: keep the real failure reason, never skip the guestbook
rep("""  if(busy)return;
  if(location.protocol!=='https:'){alert('Neocities의 https:// 홈페이지에서 실행해 주세요.');return;}""",
"""  if(busy){window.__wonkiMemberSyncError={stage:'진행 중',message:'회원 동기화가 이미 진행 중입니다. 끝난 뒤 다시 눌러 주세요.'};return false;}
  if(location.protocol!=='https:'){window.__wonkiMemberSyncError={stage:'주소 확인',message:'Neocities의 https:// 주소에서 열어야 동기화할 수 있습니다.'};if(!silent)alert('Neocities의 https:// 홈페이지에서 실행해 주세요.');return false;}
  window.__wonkiMemberSyncError=null;""")
rep("""window.__wonkiMemberSyncResult=false;""","""window.__wonkiMemberSyncResult=false;window.__wonkiMemberSyncError={stage:currentStage,message:err?.message||String(err)};""")
import re as _re
m=_re.search(r'<script id="wonki-whole-sync-controller">[\s\S]*?</script>',t);assert m
t=t[:m.start()]+r"""<script id="wonki-whole-sync-controller">
(()=>{
 const b=document.getElementById('wonkiWholeSyncButton');
 if(!b||b.dataset.bound==='1')return;
 b.dataset.bound='1';
 const original='☁ 전체 동기화';
 function say51(text){document.getElementById('wk51SyncToast')?.remove();const t=document.createElement('div');t.id='wk51SyncToast';t.setAttribute('role','status');t.textContent=text;t.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483300;max-width:calc(100vw - 32px);background:#173b5c;color:#fff;border-radius:12px;padding:10px 16px;font:700 14px system-ui,sans-serif;box-shadow:0 6px 20px #0006;text-align:center';document.body.appendChild(t);setTimeout(()=>t.remove(),6000);}
 function hint(e){const m=String(e&&e.message||''),st=String(e&&e.stage||'');
  if(/취소/.test(m))return '→ Google 로그인 창에서 관리자 계정을 직접 눌러 선택해 주세요.';
  if(/Client ID/i.test(m))return '→ Google 로그인용 Client ID가 이 기기에 저장되어 있지 않습니다. 처음 설정할 때 쓴 Client ID를 입력해 주세요.';
  if(/구글 로그인 인증에 실패|인증/.test(m))return '→ 관리자로 등록된 Google 계정으로 로그인했는지 확인해 주세요. 다른 계정이면 서버가 거절합니다.';
  if(/모듈|버튼을 표시/.test(m))return '→ Google 로그인 화면을 불러오지 못했습니다. 인터넷 연결과 브라우저의 팝업·쿠키 차단을 확인해 주세요.';
  if(/시간/.test(m))return '→ 응답이 늦었습니다. 인터넷 연결을 확인하고 잠시 뒤 다시 눌러 주세요.';
  if(/①/.test(st))return '→ 동기화 서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.';
  return '';}
 b.addEventListener('click',async()=>{
  if(b.disabled)return;
  b.disabled=true;b.textContent='⏳ 전체 동기화 중…';
  const lines=[];let allOK=true;
  try{
   const memberJob=(async()=>{if(typeof window.wonkiLandRunMemberSync!=='function'){window.__wonkiMemberSyncError={stage:'준비',message:'회원 동기화 기능을 찾을 수 없습니다. 페이지를 새로고침해 주세요.'};return false;}try{return await window.wonkiLandRunMemberSync(true)===true;}catch(err){window.__wonkiMemberSyncError={stage:'회원자료',message:err?.message||String(err)};return false;}})();
   const bookJob=(async()=>{if(typeof window.wonkiLandRunGuestbookSync!=='function')return false;try{return await window.wonkiLandRunGuestbookSync(true)===true;}catch(_){return false;}})();
   const [memberOK,bookOK]=await Promise.all([memberJob,bookJob]);
   if(memberOK)lines.push('✅ 회원자료(상상코칭·일반회원·가구 배치): 완료');
   else{allOK=false;const e=window.__wonkiMemberSyncError||{};lines.push('❌ 회원자료: 실패\n   실패 단계: '+(e.stage||'알 수 없음')+'\n   이유: '+(e.message||'알 수 없음')+(hint(e)?'\n   '+hint(e):''));}
   if(bookOK)lines.push('✅ 방명록: 완료');
   else{allOK=false;const st=document.getElementById('wonkiChatSaveStatus')?.textContent||'';lines.push('❌ 방명록: 실패'+(st?'\n   이유: '+st:''));}
   b.textContent=allOK?'✓ 전체 동기화 완료':'⚠ 동기화 확인 필요';
   console.info('WonkiLand whole sync\n'+lines.join('\n'));b.title=lines.join('\n');
   if(allOK){say51('☁ 전체 동기화 완료');alert('전체 동기화가 완료되었습니다.\n상상코칭 회원·일반회원·회원별 가구 배치·방명록을 확인했습니다.');}else say51((bookOK?'☁ 방명록 동기화 완료 · 회원자료는 서버가 바빠 다음에 다시 시도해요':(memberOK?'☁ 회원자료 동기화 완료 · 방명록은 다음에 다시 시도해요':'☁ 지금은 서버가 바빠요 · 잠시 뒤 다시 눌러 주세요')));
  }catch(e){
   console.error('WonkiLand whole sync error',e);b.textContent='⚠ 동기화 확인 필요';
   say51('☁ 지금은 동기화하지 못했어요 · 잠시 뒤 다시 눌러 주세요');
  }finally{b.disabled=false;setTimeout(()=>{b.textContent=original},5000);}
 });
})();
</script>"""+t[m.end():]


# ---------- 9. English: 150+ questions per grade/semester (extra words, patterns, passages + spelling questions)
import json as _json
_eng=_json.load(open(sys.argv[2].replace('world_final.webp','eng51.json'),encoding='utf-8'))
_engjs=_json.dumps(_eng,ensure_ascii=False).replace('</','<\\/')
rep("""c.listening.push(...x.listening);}})();</script>""","""c.listening.push(...x.listening);}})();</script>
<script id="wonki-english-extra51">(function(){const E="""+_engjs+""";const d=window.WonkiEnglishCurriculum;if(!Array.isArray(d))return;for(const c of d){const x=E[c.key];if(!x)continue;const en=new Set(c.vocab.map(v=>v[0].toLowerCase())),ko=new Set(c.vocab.map(v=>v[1]));for(const v of x.v)if(!en.has(v[0].toLowerCase())&&!ko.has(v[1])){c.vocab.push(v);en.add(v[0].toLowerCase());ko.add(v[1]);}const pe=new Set(c.patterns.map(p=>p.en)),pk=new Set(c.patterns.map(p=>p.ko));for(const [s,k,t,w,rule] of x.p)if(!pe.has(s)&&!pk.has(k)){c.patterns.push({en:s,ko:k,target:t,wrong:w,rule});pe.add(s);pk.add(k);}for(const [prompt,answer,wrong,explanation] of x.r)c.reading.push({prompt,answer,wrong,explanation,passage:x.passage});}})();</script>""")
rep("""add(vocab,'word',ko,en,en,course.vocab.map(x=>x[0]),{prompt:'뜻에 맞는 영어 단어를 고르세요.',voice:en,explanation:ko+' → '+en});""","""add(vocab,'word',ko,en,en,course.vocab.map(x=>x[0]),{prompt:'뜻에 맞는 영어 단어를 고르세요.',voice:en,explanation:ko+' → '+en});
  {const miss=wk51Misspell(en);if(miss)add(vocab,'spell',ko,en,en,[en,...miss],{prompt:'뜻에 맞는 영어 단어의 철자를 바르게 고르세요.',voice:en,explanation:ko+' → '+en+' (철자: '+en.split('').join('-')+')'});}""")
rep("""for(const course of CURRICULUM){""","""const WK51_KNOWN=new Set([...CURRICULUM.flatMap(c=>c.vocab.flatMap(v=>v[0].toLowerCase().split(/[^a-z]+/))),...'from form trial trail plant plane planet stop spot post pots tops dear read dare bear bare hear here ear are tea eat ate sit its tie the then than them they there their three tree free feel fell fill full pull fall tall all ball call wall well tell sell shell spell smell small mall make made mad man men mean meat meet met net ten tan ant and end bed bad bat bit but bus buy boy toy try dry day dye die did dad add odd old cold hold told gold god dog dig big bag beg leg log lot not nut now how who why way say may many any one on no so to do go too two own won new now knew know known show shoe she he me we be see sea set sat hat cat cut cup cap map mop top pot pet pen pin pan fan fun sun son run ran rat rot red rid ride side site bite kite like lime time tide wide wise wife life lift left felt melt meal deal real seal sale tale take tame came come home hole pole role rule mile file fine line mine nine wine wire fire hire here hare care core more mole mold model modern form forms farm harm warm worm word work wore wear year near pear peer deer beer seer star start stare scare score store stone tone stove stay stray tray pray play plan plain plate place price prize rice nice mice ice'.split(' ')]);
function wk51Misspell(w){if(!/^[a-z]{4,}$/i.test(w))return null;const low=w.toLowerCase(),out=[];const push=x=>{if(x.toLowerCase()!==low&&!WK51_KNOWN.has(x.toLowerCase())&&!out.includes(x))out.push(x);};
 for(let i=1;i<w.length-2;i++)if(w[i]!==w[i+1])push(w.slice(0,i)+w[i+1]+w[i]+w.slice(i+2));
 for(let i=1;i<w.length;i++)if(!/[aeiou]/i.test(w[i])&&w[i]!==w[i-1]&&w[i]!==w[i+1])push(w.slice(0,i+1)+w[i]+w.slice(i+1));
 if(w.length>=6)for(let i=1;i<w.length-1;i++)if(!/[aeiou]/i.test(w[i])&&w[i]!==w[i-1]&&w[i]!==w[i+1])push(w.slice(0,i)+w.slice(i+1));
 for(let i=1;i<w.length;i++){const v=w[i].toLowerCase();if('aeiou'.includes(v)){const sw={a:'e',e:'a',i:'e',o:'u',u:'o'}[v];push(w.slice(0,i)+(w[i]===v?sw:sw.toUpperCase())+w.slice(i+1));}}
 if(out.length<3)return null;let h=0;for(const c of low)h=(h*31+c.charCodeAt(0))>>>0;const pick=[];let guard=0;while(pick.length<3&&guard++<50){const x=out[h%out.length];h=(h*1103515245+12345)>>>0;if(!pick.includes(x))pick.push(x);}return pick.length===3?pick:null;}
for(const course of CURRICULUM){""")


# ---------- 10. quiet: no sound for buildings / map zoom, no sync popup
rep("""el.closest('#soundDock,#dbzv2,#wkEnglishGame,#wkEffectsDialog,#wkRewardNotice')""","""el.closest('#soundDock,#dbzv2,#wkEnglishGame,#wkEffectsDialog,#wkRewardNotice,#wonkiParkEditor36,#wonkiCustomBuildings36,#wk50Tools,#wk50Toast,#wk51SyncToast,#wonkiWholeSyncButton,[data-map-action="in"],[data-map-action="out"],[data-map-action="fit"],[data-park-editor36]')""")
rep("""else if(b.closest('#wonkiParkEditor36'))sequence(sounds.click);""","""""")
rep("""function save(){window.WonkiEffects?.play('build');""","""function save(){""")
rep("""save();renderPublic();window.WonkiEffects?.play('save');""","""save();renderPublic();""")

rep("""selected=id||'';drag={id""","""selected=id||'';if(id)window.__wk52Fresh='';drag={id""")

# ---------- 11. 초3-1: math pack (100 original problems) + board/portraits from Drive + English e3-1 board
_g31dir=sys.argv[2].replace('world_final.webp','g31/')
_math31=open(_g31dir+'math31.json',encoding='utf-8').read()
_g31html=open(_g31dir+'g31.html',encoding='utf-8').read()
rep("""const savedMathGrade=['초1-1','초1-2','초2-1','초2-2'].includes(S.activeGrade)""","""const savedMathGrade=['초1-1','초1-2','초2-1','초2-2','초3-1'].includes(S.activeGrade)""")
rep("""if(S.g22){SS['초2-2']=S.g22;delete S.g22}""","""if(S.g22){SS['초2-2']=S.g22;delete S.g22}if(S.g31){SS['초3-1']=S.g31;delete S.g31}""")
rep("""delete o.g12;delete o.g21;delete o.g22;o.activeGrade=GR;""","""delete o.g12;delete o.g21;delete o.g22;delete o.g31;o.activeGrade=GR;""")
rep("""if(SS['초2-2'])o.g22=SS['초2-2'];""","""if(SS['초2-2'])o.g22=SS['초2-2'];if(SS['초3-1'])o.g31=SS['초3-1'];""")
rep("""const g12=data.g12,g21=data.g21,g22=data.g22,""","""const g12=data.g12,g21=data.g21,g22=data.g22,g31=data.g31,""")
rep("""delete d2.g22;delete d2.activeGrade;""","""delete d2.g22;delete d2.g31;delete d2.activeGrade;""")
rep("""else delete SS['초2-2'];applyPack(target);""","""else delete SS['초2-2'];if(g31)SS['초3-1']=Object.assign(newState(),g31);else delete SS['초3-1'];applyPack(target);""")
rep("""(GR==='초2-1'||GR==='초2-2')""","""(GR==='초2-1'||GR==='초2-2'||GR==='초3-1')""",10)
rep("""function roster(){if(GR==='초2-2'&&!privateSession)""","""function roster(){if(GR==='초3-1'&&!privateSession)return Array.from(new Set([...PICK,...S.friends])).filter(id=>CH[id]);if(GR==='초2-2'&&!privateSession)""")
rep("""if(GR==='초2-2'){body.innerHTML=head('🐉 초2-2 수학 전투')""","""if(GR==='초3-1'&&window.WonkiGrade31){body.innerHTML=head('🐉 초3-1 수학 전투')+'<div class="row wk23-profile">'+card(p,'전투력 '+fmt(pw(p)))+'</div><button class="sm g" data-a="change">🔄 전사 바꾸기</button>'+window.WonkiGrade31.render('수학',rows.map(r=>({...r,enemies:r.enemies.filter(id=>id!==p)})))+'<p class="sub">초3-1 원본 100문항 · 짧은 단원은 문제가 반복됩니다.</p>';return;}
 if(GR==='초2-2'){body.innerHTML=head('🐉 초2-2 수학 전투')""")
rep("""if(savedMathGrade!==GR)setGrade(savedMathGrade);""","""PACKS['초3-1']="""+_math31+""";
if(savedMathGrade!==GR)setGrade(savedMathGrade);""")
rep("""if(!S.player||!CH[S.player]){S.player='goku';save()}units()}""","""if(!S.player||!CH[S.player]){S.player=CH.goku?'goku':(PICK[0]||Object.keys(CH)[0]);save()}units()}""")
rep("""return ['초2-2','초2-1','초1-2','초1-1'].find(x=>st.includes(x))||GR}""","""return ['초3-1','초2-2','초2-1','초1-2','초1-1'].find(x=>st.includes(x))||GR}""")
rep("""st.includes('초2-1')||st.includes('초2-2'))){alert('현재 연결된 문제 자료는 초1-1, 초1-2, 초2-1, 초2-2입니다.""","""st.includes('초2-1')||st.includes('초2-2')||st.includes('초3-1'))){alert('현재 연결된 문제 자료는 초1-1, 초1-2, 초2-1, 초2-2, 초3-1입니다.""")
rep("""if(!grade||!['초1-1','초1-2','초2-1','초2-2'].includes(grade.dataset.grade))return;""","""if(!grade||!['초1-1','초1-2','초2-1','초2-2','초3-1'].includes(grade.dataset.grade))return;""")
# English e3-1
import json as _j
_cast31=_j.loads(_math31)['CAST'];_ch31=_j.loads(_math31)['CH']
_eng31="Object.assign(CHARACTERS,"+_j.dumps({k:{'name':v[0],'power':v[1]} for k,v in _ch31.items()},ensure_ascii=False)+");const GRADE31_CAST="+_j.dumps(_cast31,ensure_ascii=False)+";const GRADE31_STARTERS=GRADE31_CAST['1'].slice();const GRADE31_ENEMIES={};{const s31=SEMESTERS.find(s=>s.key==='e3-1');if(s31)s31.units.forEach((id,i)=>{const ids=Array.from(new Set([...(GRADE31_CAST[String(i*2+1)]||[]),...(GRADE31_CAST[String(i*2+2)]||[])])).filter(x=>x!=='goku31');GRADE31_ENEMIES[id]=ids;const u=UNITS.find(x=>x.id===id);if(u)u.enemies=ids;});}\n"
rep("""const GRADE21_ENEMIES={};const grade21=SEMESTERS.find(s=>s.key==='e2-1');""",_eng31+"""const GRADE21_ENEMIES={};const grade21=SEMESTERS.find(s=>s.key==='e2-1');""")
rep("""function enemies(u){return(GRADE22_ENEMIES[u]||""","""function enemies(u){return(GRADE31_ENEMIES[u]||GRADE22_ENEMIES[u]||""")
rep("""state.semester==='e2-2'?[...GRADE22_STARTERS,...state.friends]:""","""state.semester==='e3-1'?[...GRADE31_STARTERS,...state.friends]:state.semester==='e2-2'?[...GRADE22_STARTERS,...state.friends]:""")
rep("""||(out.semester==='e2-1'&&GRADE21_STARTERS.includes(saved.player))))out.player=saved.player;""","""||(out.semester==='e2-1'&&GRADE21_STARTERS.includes(saved.player))||(out.semester==='e3-1'&&GRADE31_STARTERS.includes(saved.player))))out.player=saved.player;""")
rep("""if(state.player&&!unlockedCharacters().includes(state.player))state.player='goku';""","""if(state.player&&!unlockedCharacters().includes(state.player))state.player=unlockedCharacters().includes('goku')?'goku':unlockedCharacters()[0];""")
rep("""  if(s.semester==='e2-2'){const rows=currentUnits()""","""  if(s.semester==='e3-1'&&window.WonkiGrade31){const rows=currentUnits().flatMap((unit,i)=>[0,1].map(part=>{const scene=i*2+part;return{scene,title:unit.name+' · '+(part+1),action:'data-eng-action="unit" data-eng-unit="'+unit.id+'"',enemyAction:id=>'data-eng-action="fight-unit" data-eng-unit="'+unit.id+'" data-eng-id="'+id+'"',status:game.canEnter(unit.id)?'상대 캐릭터를 누르세요':'앞 단원 2승 후 열림',locked:!game.canEnter(unit.id),enemies:(window.WonkiGrade31.cast[String(scene+1)]||[]).filter(id=>id!=='goku31'&&id!==s.player)};}));return '<div class="we-profile">'+portraitFor(p)+'<strong>'+escape(characterInfo(p).name)+'</strong>'+button('전사 바꾸기','characters')+'</div>'+window.WonkiGrade31.render('영어',rows)+'<p class="we-help">초3-1 영어 단어·문장·독해 문제로 수련합니다. 그림 속 상대를 누르면 영어 문제가 시작됩니다.</p>';}
  if(s.semester==='e2-2'){const rows=currentUnits()""")


# ---------- 12. 55차: sync retries, buildings anywhere on the expanded map, save / up-one-level bar on problem screens
# sync: each request waits 20 s and is retried up to 3 times (the Apps Script server sometimes stops answering one request)
rep("""async function post(body){
  // Apps Script POST 응답을 fetch로 읽지 않고 숨겨진 iframe의 postMessage로 받습니다.""","""async function post(body){for(let i=0;i<3;i++){try{return await post1(body);}catch(e){if(i===2||!/시간/.test(String(e&&e.message)))throw e;}}}
 async function post1(body){
  // Apps Script POST 응답을 fetch로 읽지 않고 숨겨진 iframe의 postMessage로 받습니다.""")
rep("""const timer=setTimeout(()=>finish(reject,new Error('서버 응답 시간이 초과되었습니다. Apps Script 배포 버전과 iframe 응답 설정을 확인해 주세요.')),30000);""","""const timer=setTimeout(()=>finish(reject,new Error('서버 응답 시간이 초과되었습니다. (3번 다시 시도했습니다)')),20000);""")
rep("""function post(action,extra={}){const nonce='wkgb_'""","""async function post(action,extra={}){for(let i=0;i<3;i++){try{return await post1(action,extra);}catch(e){if(i===2||!/시간/.test(String(e&&e.message)))throw e;}}}
 function post1(action,extra={}){const nonce='wkgb_'""")
rep("""finish(reject,new Error('서버 응답 시간 초과')),25000)""","""finish(reject,new Error('서버 응답 시간 초과 (3번 다시 시도)')),20000)""")
rep("""say51((bookOK?'☁ 방명록 동기화 완료 · 회원자료는 서버가 바빠 다음에 다시 시도해요':(memberOK?'☁ 회원자료 동기화 완료 · 방명록은 다음에 다시 시도해요':'☁ 지금은 서버가 바빠요 · 잠시 뒤 다시 눌러 주세요')));""",
"""{const me=window.__wonkiMemberSyncError||{},short=m=>{m=String(m||'');return /취소/.test(m)?'로그인 취소':/시간/.test(m)?'서버 응답 없음':/인증/.test(m)?'로그인 계정 확인 필요':/https/.test(m)?'https 주소에서 열어 주세요':m.slice(0,30)||'알 수 없음';};const bs=String(document.getElementById('wonkiChatSaveStatus')?.textContent||'');say51('☁ 회원자료 '+(memberOK?'완료':'실패('+short(me.message)+')')+' · 방명록 '+(bookOK?'완료':'실패('+short(bs)+')')+' · 3번까지 다시 시도했어요');}""")
# buildings: allow the whole expanded park (stage units: x -0.6..1.75, y -0.4..1.65)
rep("""x:Math.max(-.32,Math.min(1.32,b.x)),y:Math.max(-.12,Math.min(1.42,b.y))""","""x:Math.max(-.58,Math.min(1.73,b.x)),y:Math.max(-.38,Math.min(1.62,b.y))""")
rep("""nx=Math.max(-.32,Math.min(1.32,ox+(ev.clientX-sx)/r.width));ny=Math.max(-.12,Math.min(1.42,oy+(ev.clientY-sy)/r.height))""","""nx=Math.max(-.58,Math.min(1.73,ox+(ev.clientX-sx)/r.width));ny=Math.max(-.38,Math.min(1.62,oy+(ev.clientY-sy)/r.height))""")
rep("""t.x=Math.max(-.32,Math.min(1.32,Math.round((t.x+dx)*400)/400));t.y=Math.max(-.12,Math.min(1.42,Math.round((t.y+dy)*400)/400));""","""t.x=Math.max(-.58,Math.min(1.73,Math.round((t.x+dx)*400)/400));t.y=Math.max(-.38,Math.min(1.62,Math.round((t.y+dy)*400)/400));""")
rep("""return{x:Math.max(-.3,Math.min(1.3,p.x/1000)),y:Math.max(-.1,Math.min(1.4,p.y/563))}""","""return{x:Math.max(-.58,Math.min(1.73,p.x/1000)),y:Math.max(-.38,Math.min(1.62,p.y/563))}""")
rep("""return{x:Math.max(-.3,Math.min(1.3,(e.clientX-r.left-ox)/drawnW)),y:Math.max(-.1,Math.min(1.4,(e.clientY-r.top-oy)/drawnH))}""","""return{x:Math.max(-.58,Math.min(1.73,(e.clientX-r.left-ox)/drawnW)),y:Math.max(-.38,Math.min(1.62,(e.clientY-r.top-oy)/drawnH))}""")
rep("""x:Math.max(-.3,Math.min(1.3,(vb.x+vb.w/2)/1000+((n%5)-2)*.04)),y:Math.max(-.1,Math.min(1.4,(vb.y+vb.h/2)/563+((Math.floor(n/5)%4)-1)*.05))""","""x:Math.max(-.58,Math.min(1.73,(vb.x+vb.w/2)/1000+((n%5)-2)*.04)),y:Math.max(-.38,Math.min(1.62,(vb.y+vb.h/2)/563+((Math.floor(n/5)%4)-1)*.05))""")
rep("""let vb={x:-350,y:-140.75,w:1700,h:957.1};function applyVB(){vb.w=Math.max(300,Math.min(1700,vb.w));vb.h=vb.w*563/1000;vb.x=Math.max(-350,Math.min(1350-vb.w,vb.x));vb.y=Math.max(-140.75,Math.min(816.35-vb.h,vb.y));""","""let vb={x:-450,y:-225.2,w:2050,h:1154.15};function applyVB(){vb.w=Math.max(300,Math.min(2050,vb.w));vb.h=vb.w*563/1000;vb.x=Math.max(-600,Math.min(1750-vb.w,vb.x));vb.y=Math.max(-225.2,Math.min(929-vb.h,vb.y));""")
rep("""const nw=Math.max(300,Math.min(1700,vb.w/f))""","""const nw=Math.max(300,Math.min(2050,vb.w/f))""")
rep("""mapReset.onclick=()=>{vb={x:-350,y:-140.75,w:1700,h:957.1};applyVB();};""","""mapReset.onclick=()=>{vb={x:-450,y:-225.2,w:2050,h:1154.15};applyVB();};""")
rep("""viewBox:'-350 -140.75 1700 957.1'""","""viewBox:'-450 -225.2 2050 1154.15'""")
rep("""for(let i=-14;i<=54;i++)svg('path',{d:'M'+i*25+' -150V825',fill:'none'},grid);for(let i=-6;i<=33;i++)svg('path',{d:'M-360 '+i*25+'H1360',fill:'none'},grid);""","""for(let i=-24;i<=70;i++)svg('path',{d:'M'+i*25+' -230V935',fill:'none'},grid);for(let i=-9;i<=37;i++)svg('path',{d:'M-610 '+i*25+'H1760',fill:'none'},grid);""")
# math problem screen: save + up-one-level bar
rep("""body.innerHTML=head(UNITS[unit-1][0]+'. '+UNITS[unit-1][1])+'<div class="row arena" id="arena">""","""body.innerHTML=head(UNITS[unit-1][0]+'. '+UNITS[unit-1][1])+'<div class="wk55-bar"><button type="button" class="wk55-up" data-a="villains">◀ 상대 선택으로</button><button type="button" data-a="units">📚 단원 목록</button><button type="button" class="wk55-save" data-wonki-save>💾 저장</button></div><div class="row arena" id="arena">""")
# English problem screen: the same bar
rep("""return '<div class="we-arena"><div class="we-fighter">'+portraitFor(s.player)""","""return '<div class="wk55-bar">'+button('◀ 상대 선택으로','enemies','','wk55-up')+button('📚 단원 목록','units')+button('💾 저장','save-menu',game.privateMode?'disabled':'','wk55-save')+'</div><div class="we-arena"><div class="we-fighter">'+portraitFor(s.player)""")


# ---------- 13. 58차: 초3-2 (수학 원본 91문항 + 드라이브 목차·캐릭터 그림, 영어 e3-2 대결판)
_g32dir=sys.argv[2].replace('world_final.webp','g32/')
_math32=open(_g32dir+'math32.json',encoding='utf-8').read()
_g32html=open(_g32dir+'g32.html',encoding='utf-8').read()
rep("""'초2-2','초3-1'].includes(S.activeGrade)""","""'초2-2','초3-1','초3-2'].includes(S.activeGrade)""")
rep("""if(S.g31){SS['초3-1']=S.g31;delete S.g31}""","""if(S.g31){SS['초3-1']=S.g31;delete S.g31}if(S.g32){SS['초3-2']=S.g32;delete S.g32}""")
rep("""delete o.g31;o.activeGrade=GR;""","""delete o.g31;delete o.g32;o.activeGrade=GR;""")
rep("""if(SS['초3-1'])o.g31=SS['초3-1'];""","""if(SS['초3-1'])o.g31=SS['초3-1'];if(SS['초3-2'])o.g32=SS['초3-2'];""")
rep("""g31=data.g31,""","""g31=data.g31,g32=data.g32,""")
rep("""delete d2.g31;""","""delete d2.g31;delete d2.g32;""")
rep("""else delete SS['초3-1'];applyPack(target);""","""else delete SS['초3-1'];if(g32)SS['초3-2']=Object.assign(newState(),g32);else delete SS['초3-2'];applyPack(target);""")
rep("""(GR==='초2-1'||GR==='초2-2'||GR==='초3-1')""","""(GR==='초2-1'||GR==='초2-2'||GR==='초3-1'||GR==='초3-2')""",10)
rep("""function roster(){if(GR==='초3-1'&&!privateSession)""","""function roster(){if((GR==='초3-1'||GR==='초3-2')&&!privateSession)""")
_a=t.index("if(GR==='초3-1'&&window.WonkiGrade31){body.innerHTML=head(");_b=t.index("\n if(GR==='초2-2'){body.innerHTML=head(",_a)
_board32=t[_a:_b].replace('WonkiGrade31','WonkiGrade32').replace('초3-1','초3-2').replace('원본 100문항','원본 91문항')
t=t[:_a]+_board32+'\n '+t[_a:]
rep("""PACKS['초3-1']=""","""PACKS['초3-2']="""+_math32+""";
PACKS['초3-1']=""")
rep("""return ['초3-1','초2-2',""","""return ['초3-2','초3-1','초2-2',""")
rep("""||st.includes('초3-1'))){alert('현재 연결된 문제 자료는 초1-1, 초1-2, 초2-1, 초2-2, 초3-1입니다.""","""||st.includes('초3-1')||st.includes('초3-2'))){alert('현재 연결된 문제 자료는 초1-1, 초1-2, 초2-1, 초2-2, 초3-1, 초3-2입니다.""")
rep("""'초2-2','초3-1'].includes(grade.dataset.grade))return;""","""'초2-2','초3-1','초3-2'].includes(grade.dataset.grade))return;""")
_m32=_j.loads(_math32)
_eng32="Object.assign(CHARACTERS,"+_j.dumps({k:{'name':v[0],'power':v[1]} for k,v in _m32['CH'].items()},ensure_ascii=False)+");const GRADE32_CAST="+_j.dumps(_m32['CAST'],ensure_ascii=False)+";const GRADE32_STARTERS="+_j.dumps(_m32['PICK'])+";const GRADE32_ENEMIES={};{const s32=SEMESTERS.find(s=>s.key==='e3-2');if(s32)s32.units.forEach((id,i)=>{const ids=Array.from(new Set([...(GRADE32_CAST[String(i*2+1)]||[]),...(GRADE32_CAST[String(i*2+2)]||[])])).filter(x=>x!=='goku32');GRADE32_ENEMIES[id]=ids;const u=UNITS.find(x=>x.id===id);if(u)u.enemies=ids;});}\n"
rep("""const GRADE21_ENEMIES={};const grade21=SEMESTERS.find(s=>s.key==='e2-1');""",_eng32+"""const GRADE21_ENEMIES={};const grade21=SEMESTERS.find(s=>s.key==='e2-1');""")
rep("""function enemies(u){return(GRADE31_ENEMIES[u]||""","""function enemies(u){return(GRADE32_ENEMIES[u]||GRADE31_ENEMIES[u]||""")
rep("""state.semester==='e3-1'?[...GRADE31_STARTERS,...state.friends]:""","""state.semester==='e3-2'?[...GRADE32_STARTERS,...state.friends]:state.semester==='e3-1'?[...GRADE31_STARTERS,...state.friends]:""")
rep("""||(out.semester==='e3-1'&&GRADE31_STARTERS.includes(saved.player))""","""||(out.semester==='e3-1'&&GRADE31_STARTERS.includes(saved.player))||(out.semester==='e3-2'&&GRADE32_STARTERS.includes(saved.player))""")
_a=t.index("  if(s.semester==='e3-1'&&window.WonkiGrade31){");_b=t.index("\n  if(s.semester==='e2-2'){const rows=currentUnits()",_a)
_eb32=t[_a:_b].replace('WonkiGrade31','WonkiGrade32').replace("'e3-1'","'e3-2'").replace("goku31","goku32").replace('초3-1','초3-2')
t=t[:_a]+_eb32+'\n'+t[_a:]


# ---------- 14. 60차: 회원 동기화의 ① 서버 연결 확인(JSONP)이 막혀도 멈추지 않기 (실패하면 건너뛰고 로그인으로)
rep("""currentStage='① 서버 연결 확인';setStatus(currentStage+' 중…');await ping();""","""currentStage='① 서버 연결 확인';setStatus(currentStage+' 중…');try{await ping();}catch(_e1){console.warn('WonkiLand: 연결 확인 건너뜀',_e1);}""")


# ---------- 15. 62차: 링크 미리보기(페이스북·카톡·인스타) + 탭 제목 "웰컴투 원기랜드"
_site='https://hinsrolin.neocities.org'
_share=_site+'/%EB%93%9C%EB%9E%98%EA%B3%A4%EB%B3%BC%20%EC%88%98%ED%95%99%EA%B2%8C%EC%9E%84/%EC%9B%B0%EC%BB%B4%ED%88%AC%20%EC%9B%90%EA%B8%B0%EB%9E%9C%EB%93%9C'
_ogimg=_site+'/%EC%9E%91%EC%97%85%EC%9E%A5/wonkiland-share.jpg'
_desc='웃음과 행복이 가득한 원기랜드! 드래곤볼 수학·영어 코스로 대결하고, 나만의 놀이공원을 지어 보세요.'
_og=('<meta name="description" content="'+_desc+'">'
 '<meta property="og:type" content="website"><meta property="og:site_name" content="웰컴투 원기랜드">'
 '<meta property="og:title" content="웰컴투 원기랜드 🎡"><meta property="og:description" content="'+_desc+'">'
 '<meta property="og:url" content="'+_share+'"><meta property="og:image" content="'+_ogimg+'">'
 '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="원기랜드 놀이공원 지도">'
 '<meta property="og:locale" content="ko_KR"><meta name="twitter:card" content="summary_large_image">'
 '<meta name="twitter:title" content="웰컴투 원기랜드 🎡"><meta name="twitter:description" content="'+_desc+'"><meta name="twitter:image" content="'+_ogimg+'">')
rep("""<html lang="ko"><head><meta charset="utf-8">""","""<html lang="ko"><head><meta charset="utf-8">"""+_og)
rep("""<title>원기랜드 50차 · 연결지도 적용 | 웰컴투 원기랜드 · 수정 38</title>""","""<title>웰컴투 원기랜드</title>""")


# ---------- 16. 64차: 휴대폰 동기화 빠르게 + 관리자 로그인 1시간 기억 + 건물 그림 함수 공개(구경하기용)
rep("""try{await ping();}catch(_e1){console.warn('WonkiLand: 연결 확인 건너뜀',_e1);}""","""/* 64차: 연결 확인 생략(실제 요청이 확인 역할) */""")
rep("""currentStage='② 관리자 Google 로그인';setStatus(currentStage+' 중…');adminToken=await googleCredential(clientId);window.wonkiLandAdminToken=adminToken;""","""currentStage='② 관리자 Google 로그인';setStatus(currentStage+' 중…');adminToken=wk64Cached()||await googleCredential(clientId);wk64Store(adminToken);window.wonkiLandAdminToken=adminToken;""")
rep("""const remote=await post({action:'admin_list',idToken:adminToken});""","""const wk64Friends=post({action:'admin_friend_list',idToken:adminToken});wk64Friends.catch(()=>{});
   const remote=await post({action:'admin_list',idToken:adminToken});""")
rep("""const remoteFriendsResult=await post({action:'admin_friend_list',idToken:adminToken});""","""const remoteFriendsResult=await wk64Friends;let wk64Changed=false;""")
rep("""if(!r || (Date.parse(l.updatedAt||l.date||0)||0)>(Date.parse(r.updatedAt||r.date||0)||0))friendMap.set(id,{...(r||{}),...l,id});""","""if(!r || (Date.parse(l.updatedAt||l.date||0)||0)>(Date.parse(r.updatedAt||r.date||0)||0)){friendMap.set(id,{...(r||{}),...l,id});wk64Changed=true;}""")
rep("""const friendSaved=await post({action:'admin_friend_save',idToken:adminToken,members:mergedFriends});""","""const friendSaved=wk64Changed?await post({action:'admin_friend_save',idToken:adminToken,members:mergedFriends}):{success:true};""")
rep("""window.wonkiLandRunMemberSync=sync;""","""window.wonkiLandRunMemberSync=sync;
 window.wonkiLandAdminLogin=async function(){const c=wk64Cached();if(c)return c;const id=getClientId();if(!id)throw new Error('Google Client ID 입력이 취소되었습니다.');const t=await googleCredential(id);wk64Store(t);window.wonkiLandAdminToken=t;return t;};""")
rep(""" function getClientId(){""","""function wk64Exp(t){try{return JSON.parse(atob(String(t).split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).exp*1000||0;}catch(_){return 0;}}
 function wk64Cached(){try{const t=sessionStorage.getItem('wk64_admin_token');return t&&wk64Exp(t)-Date.now()>5*60*1000?t:'';}catch(_){return '';}}
 function wk64Store(t){try{if(t&&wk64Exp(t))sessionStorage.setItem('wk64_admin_token',t);}catch(_){}}
 function getClientId(){""")
rep("""const saved=await post('guestbook_save',{items:merged});const finalItems=merge(merged,saved.items||[]);""","""const saved=merged.length>(cloud.items||[]).length?await post('guestbook_save',{items:merged}):{items:[]};const finalItems=merge(merged,saved.items||[]);""")
rep("""window.WonkiParkEditor36={open,close,""","""window.WonkiParkEditor36={open,close,art,""")

# ---------- 17. 65차: 관리자 메뉴에 방문자 통계·회원 공원 구경하기 넣기
rep("""const analysis=el('a','📊 Google 관리자 분석 열기',box);analysis.className='wk36-link';analysis.href=analysisURL;analysis.target='_blank';analysis.rel='noopener noreferrer';}""","""const analysis=el('a','📊 Google 관리자 분석 열기',box);analysis.className='wk36-link';analysis.href=analysisURL;analysis.target='_blank';analysis.rel='noopener noreferrer';try{window.WonkiParkViewer?.adminMenu?.(box,close);}catch(e65){console.warn(e65);}}""")

# ---------- 18. 66차: 방문자는 주인장 공원 둘러보기만, 일반회원은 자기 공원만 짓고 보기
rep(""" function personalState(){try{const saved=JSON.parse(localStorage.getItem(key())||'null');""",""" function personalState(){const r66=window.WonkiParkRoles66;if(r66&&r66.mode()==='visitor'){try{return C.clean(r66.ownerPark()||published);}catch(_){return published;}}try{const saved=JSON.parse(localStorage.getItem(key())||'null');""")
rep(""" async function open(view){if(view==='menu'&&!await window.WonkiAdminLock36.unlock())return;""",""" async function open(view){if(view!=='menu'&&window.WonkiParkRoles66&&!window.WonkiParkRoles66.canBuild()){window.WonkiParkRoles66.askJoin();return;}if(view==='menu'&&!await window.WonkiAdminLock36.unlock())return;""")

# ---------- 19. 68차: 서버 요청 바로 주고받기 + 관리자 기기가 아니면 전체 동기화에서 관리자 회원자료 건너뛰기
rep("""const memberJob=(async()=>{if(typeof window.wonkiLandRunMemberSync!=='function')""","""const wk68Admin=(()=>{try{return localStorage.getItem('wk65_admin_device')==='1';}catch(_){return false;}})();let wk68Note='';
   const memberJob=!wk68Admin?(async()=>{let s=null;try{s=JSON.parse(sessionStorage.getItem('wonkiLand_general_session_v1')||'null');}catch(_){}if(s&&s.token&&window.WonkiMemberProgress){const ok=await window.WonkiMemberProgress.upload();wk68Note=ok?'✅ 내 기록(공원·수학·영어): 클라우드 저장 완료':'';if(!ok)window.__wonkiMemberSyncError={stage:'내 기록 저장',message:'내 기록을 클라우드에 저장하지 못했습니다.'};return ok;}wk68Note='ℹ 회원자료: 관리자 기기에서만 동기화합니다 (건너뜀)';return true;})():(async()=>{if(typeof window.wonkiLandRunMemberSync!=='function')""")
rep("""if(memberOK)lines.push('✅ 회원자료(상상코칭·일반회원·가구 배치): 완료');""","""if(memberOK)lines.push(wk68Note||'✅ 회원자료(상상코칭·일반회원·가구 배치): 완료');""")
rep("""alert('전체 동기화가 완료되었습니다.\\n상상코칭 회원·일반회원·회원별 가구 배치·방명록을 확인했습니다.');""","""alert(wk68Admin?'전체 동기화가 완료되었습니다.\\n상상코칭 회원·일반회원·회원별 가구 배치·방명록을 확인했습니다.':'전체 동기화가 완료되었습니다.\\n'+lines.join('\\n'));""")
_fc68=open(sys.argv[2].replace('world_final.webp','fast-cloud.html'),encoding='utf-8').read()
_h=t.find('<head>')+len('<head>')
t=t[:_h]+'\n'+_fc68+t[_h:]

# ---------- 20. 73차: 관리자 Google 로그인 창을 맨 위로 (구경하기·관리자 메뉴 화면 뒤에 가려지던 문제)
rep("""overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.68)""","""overlay.id='wk73GoogleLogin';overlay.style.cssText='position:fixed;inset:0;z-index:2147483640;background:rgba(0,0,0,.68)""")

# ---------- 21. 77차: 원기랜드 카톡·링크 공유 버튼 링크에 추적 이름(src=공유버튼) 붙이기
rep("""const URL='https://hinsrolin.neocities.org/%EB%93%9C%EB%9E%98%EA%B3%A4%EB%B3%BC%20%EC%88%98%ED%95%99%EA%B2%8C%EC%9E%84/%EC%9B%B0%EC%BB%B4%ED%88%AC%20%EC%9B%90%EA%B8%B0%EB%9E%9C%EB%93%9C';function install(){""","""const URL='https://hinsrolin.neocities.org/%EB%93%9C%EB%9E%98%EA%B3%A4%EB%B3%BC%20%EC%88%98%ED%95%99%EA%B2%8C%EC%9E%84/%EC%9B%B0%EC%BB%B4%ED%88%AC%20%EC%9B%90%EA%B8%B0%EB%9E%9C%EB%93%9C?src=%EA%B3%B5%EC%9C%A0%EB%B2%84%ED%8A%BC';function install(){""")

# ---------- 22. 80차: 관리자 로그인 6시간 기억 (Google 로그인 → 서버가 6시간짜리 관리자 표 발급, 기기에 기억)
rep("""adminToken=wk64Cached()||await googleCredential(clientId);wk64Store(adminToken);""","""adminToken=wk64Cached()||await wk80Exchange(await googleCredential(clientId));wk64Store(adminToken);""")
rep("""const t=await googleCredential(id);wk64Store(t);""","""const t=await wk80Exchange(await googleCredential(id));wk64Store(t);""")
rep(""" function wk64Cached(){try{const t=sessionStorage.getItem('wk64_admin_token');return t&&wk64Exp(t)-Date.now()>5*60*1000?t:'';}catch(_){return '';}}""",""" function wk64Cached(){try{const a=localStorage.getItem('wk80_admin_token'),b=sessionStorage.getItem('wk64_admin_token');const t=[a,b].filter(x=>x&&wk64Exp(x)-Date.now()>5*60*1000).sort((x,y)=>wk64Exp(y)-wk64Exp(x))[0];return t||'';}catch(_){return '';}}
 async function wk80Exchange(jwt){try{const r=await fetch('https://script.google.com/macros/s/AKfycbyIWLNPDMsJjpZqJv_GxctUHtInNss9xs9ZT7SWMCE--uxVu4JcDupuiXp89XwEGAHY/exec',{method:'POST',body:JSON.stringify({action:'admin_session_start',idToken:jwt}),credentials:'omit',cache:'no-store'});const j=JSON.parse(await r.text());if(j&&j.success&&j.token)return j.token;}catch(_){}return jwt;}""")
rep(""" function wk64Store(t){try{if(t&&wk64Exp(t))sessionStorage.setItem('wk64_admin_token',t);}catch(_){}}""",""" function wk64Store(t){try{if(t&&wk64Exp(t)){sessionStorage.setItem('wk64_admin_token',t);if(/^wkadm[.]/.test(t))localStorage.setItem('wk80_admin_token',t);}}catch(_){}}""")

# ---------- 23. 81차: 이 기기 관리자 비밀번호 4자리부터 가능 + 5번 틀리면 5분 잠금
rep("""if(password.length<8||password.length>128)throw Error('비밀번호는8~128자로 적어 주세요.');""","""if(password.length<4||password.length>128)throw Error('비밀번호는 4~128자로 적어 주세요. (숫자 4자리도 돼요)');""")
rep("""newPw=(!existing||change)?field('새 비밀번호 ·8자 이상','new'):null""","""newPw=(!existing||change)?field('새 비밀번호 · 4자 이상 (숫자 4자리도 돼요)','new'):null""")
rep("""try{if(existing&&!await verify(old.value))throw Error('비밀번호가 올바르지 않습니다.');""","""try{if(existing){let lf={};try{lf=JSON.parse(localStorage.getItem('wk81_lock_fail')||'{}')||{};}catch(_){}if(lf.until&&lf.until>Date.now())throw Error('비밀번호를 여러 번 틀렸어요. '+Math.ceil((lf.until-Date.now())/60000)+'분 뒤에 다시 해 주세요.');if(!await verify(old.value)){lf.n=(lf.n||0)+1;if(lf.n>=5){lf={until:Date.now()+5*60000};}try{localStorage.setItem('wk81_lock_fail',JSON.stringify(lf));}catch(_){}throw Error(lf.until?'비밀번호를 5번 틀렸어요. 5분 뒤에 다시 해 주세요.':'비밀번호가 올바르지 않습니다. ('+lf.n+'/5)');}try{localStorage.removeItem('wk81_lock_fail');}catch(_){}}""")

# ---------- 24. 83차: 상상코칭 회원 삭제가 동기화 뒤 되살아나지 않게 (삭제 기록 → 동기화 때 서버에서도 삭제, 서버의 삭제 목록은 다른 기기에서도 빼기)
rep("""if(b.dataset.delete&&confirm('이 회원 정보를 삭제할까요?')){members=members.filter(x=>x.id!==id);persist();render()}""","""if(b.dataset.delete&&confirm('이 회원 정보를 삭제할까요?')){const wk83g=members.find(x=>x.id===id);members=members.filter(x=>x.id!==id);persist();try{const t=JSON.parse(localStorage.getItem('wk83_deleted_members')||'[]');if(!t.some(x=>String(x.id)===String(id)))t.push({id:String(id),name:(wk83g&&wk83g.name)||'',at:new Date().toISOString()});localStorage.setItem('wk83_deleted_members',JSON.stringify(t));}catch(_){}render();const wk83s=document.getElementById('memberSaveStatus');if(wk83s){wk83s.textContent='🗑 삭제됨 · 다음 동기화 때 클라우드에서도 지워져요';wk83s.style.color='#c62828';}}""")
rep("""const remoteById=new Map(remote.members.map(m=>[String(m.id),m]));""","""const wk83T=(()=>{try{const a=JSON.parse(localStorage.getItem('wk83_deleted_members')||'[]');return Array.isArray(a)?a:[];}catch(_){return [];}})();
   const wk83Del=new Set([...(Array.isArray(remote.deletedIds)?remote.deletedIds:[]).map(String),...wk83T.map(x=>String(x.id))]);
   if(wk83T.length){currentStage='③-1 삭제한 회원 클라우드에서 지우기';setStatus(currentStage+' 중…');
    try{const dr=await post({action:'admin_member_delete',idToken:adminToken,ids:wk83T.map(x=>String(x.id))});if(dr&&dr.success!==false)localStorage.removeItem('wk83_deleted_members');}
    catch(e83){if(!/지원하지 않는/.test(String(e83&&e83.message)))throw e83;console.warn('WonkiLand: 서버가 아직 회원 삭제를 지원하지 않아요 (Code_83 필요)');}}
   remote.members=remote.members.filter(m=>!wk83Del.has(String(m&&m.id)));
   for(let wi=local.length-1;wi>=0;wi--)if(local[wi]&&wk83Del.has(String(local[wi].id)))local.splice(wi,1);
   const remoteById=new Map(remote.members.map(m=>[String(m.id),m]));""")

# ---------- 25. 84차: 휴회 이동·재원 복귀가 동기화 뒤 되돌아가지 않게 (수정 시각 남기기)
rep("""if(b.dataset.suspend){m.suspended=true;persist();render()}""","""if(b.dataset.suspend){m.suspended=true;m.updatedAt=new Date().toISOString();persist();render();const wk84s=document.getElementById('memberSaveStatus');if(wk84s){wk84s.textContent='💤 '+(m.name||'회원')+' 휴회 이동 · 다음 동기화 때 클라우드에도 반영돼요';wk84s.style.color='#b26a00';}}""")
rep("""if(b.dataset.resume){m.suspended=false;persist();render()}""","""if(b.dataset.resume){m.suspended=false;m.updatedAt=new Date().toISOString();persist();render();const wk84s=document.getElementById('memberSaveStatus');if(wk84s){wk84s.textContent='✅ '+(m.name||'회원')+' 재원 복귀 · 다음 동기화 때 클라우드에도 반영돼요';wk84s.style.color='#16834a';}}""")

# ---------- 26. 85차: 동기화 완료 표시의 상상코칭 회원 수를 현재회원(휴회 제외)과 휴회회원으로 나눠 보여 주기
rep("""setStatus('✓ 동기화 완료 (상상코칭 '+merged.length+'명 · 일반회원 '+mergedFriends.filter(x=>!x.deletedAt).length+'명)');""","""const wk85Now=merged.filter(x=>x&&!x.deletedAt&&!x.suspended).length,wk85Rest=merged.filter(x=>x&&!x.deletedAt&&x.suspended).length;setStatus('✓ 동기화 완료 (상상코칭 현재 '+wk85Now+'명'+(wk85Rest?' · 휴회 '+wk85Rest+'명':'')+' · 일반회원 '+mergedFriends.filter(x=>!x.deletedAt).length+'명)');""")
rep("""alert('회원자료 동기화가 완료되었습니다.\\n상상코칭 회원 '+merged.length+'명\\n일반회원 '""","""alert('회원자료 동기화가 완료되었습니다.\\n상상코칭 현재회원 '+wk85Now+'명'+(wk85Rest?' (휴회 '+wk85Rest+'명 따로)':'')+'\\n일반회원 '""")

# ---------- 27. 86차: 예전 버전이 남긴 삭제 표시(deletedAt)가 있는 상상코칭 회원도 삭제한 것으로 처리 (목록에서 숨기고, 동기화 때 서버에서도 지움)
rep("""const wk83T=(()=>{try{const a=JSON.parse(localStorage.getItem('wk83_deleted_members')||'[]');return Array.isArray(a)?a:[];}catch(_){return [];}})();""","""const wk83T=(()=>{try{const a=JSON.parse(localStorage.getItem('wk83_deleted_members')||'[]');return Array.isArray(a)?a:[];}catch(_){return [];}})();
   [...local,...remote.members].forEach(m=>{if(m&&m.id&&m.deletedAt&&!wk83T.some(x=>String(x.id)===String(m.id)))wk83T.push({id:String(m.id),name:m.name||'',at:String(m.deletedAt)});});""")
rep("""const list=members.filter(m=>!!m.suspended===(view==='suspended'));""","""const list=members.filter(m=>!m.deletedAt&&!!m.suspended===(view==='suspended'));""")

# ---------- 28. 90차: 종교코스 메뉴 그림 바꾸기 (6칸: 혜화동성당·청년 성서모임·로사리오·개인 영적활동·가톨릭 퀴즈·기타)
_faith90='data:image/webp;base64,'+__import__('base64').b64encode(open(sys.argv[2].replace('world_final.webp','faith_course_90.webp'),'rb').read()).decode()
rep('<img alt="가톨릭 십자가가 포함된 종교코스 세부 선택 화면" src="https://lh3.googleusercontent.com/d/1L4C4ZtEnzUE9nyinaTawToP6ZFqF9DQP">','<img alt="2. 종교코스 세부 선택 화면 (6가지)" src="'+_faith90+'">')
rep('data-faith="해화동성당 교리봉사·사회활동" aria-label="해화동성당 교리봉사·사회활동 선택" title="해화동성당 교리봉사·사회활동"','data-faith="혜화동성당 교리봉사·사회활동" aria-label="혜화동성당 교리봉사·사회활동 선택" title="혜화동성당 교리봉사·사회활동"')
rep('<button class="faithspot" id="faithother" data-faith="종교코스 기타" aria-label="종교코스 기타 선택" title="종교코스 기타"></button>','<button class="faithspot" id="faithquiz" data-faith="가톨릭 퀴즈" aria-label="가톨릭 퀴즈 선택" title="가톨릭 퀴즈"></button>\n    <button class="faithspot" id="faithother" data-faith="종교코스 기타 메뉴" aria-label="종교코스 기타 메뉴 선택" title="기타 메뉴"></button>')

# ---------- 29. 91차: 혜화동성당 교리봉사회활동을 누르면 세부 메뉴(6가지) 창이 열림
_church91='data:image/webp;base64,'+__import__('base64').b64encode(open(sys.argv[2].replace('world_final.webp','church_course_91.webp'),'rb').read()).decode()
rep('<div class="modal" id="meetModal" role="dialog" aria-modal="true" aria-label="모임코스 세부 선택">','<div class="modal" id="churchModal" role="dialog" aria-modal="true" aria-label="혜화동성당 교리봉사회활동 세부 선택"><div class="modal-inner"><img alt="혜화동성당 1. 교리봉사회활동 세부 선택 화면" src="'+_church91+'"><button class="close" id="closeChurchModal" aria-label="교리봉사회활동 메뉴 닫기">×</button><button class="churchspot" id="church1" data-church="교리교육 지원" aria-label="교리교육 지원 선택" title="교리교육 지원"></button><button class="churchspot" id="church2" data-church="교리반 운영지원" aria-label="교리반 운영지원 선택" title="교리반 운영지원"></button><button class="churchspot" id="church3" data-church="교리자료 준비" aria-label="교리자료 준비 선택" title="교리자료 준비"></button><button class="churchspot" id="church4" data-church="교리봉사자 모임" aria-label="교리봉사자 모임 선택" title="교리봉사자 모임"></button><button class="churchspot" id="church5" data-church="영적나눔 및 기도" aria-label="영적나눔 및 기도 선택" title="영적나눔 및 기도"></button><button class="churchspot" id="church6" data-church="행사 및 일정지원" aria-label="행사 및 일정지원 선택" title="행사 및 일정지원"></button></div></div>\n<div class="modal" id="meetModal" role="dialog" aria-modal="true" aria-label="모임코스 세부 선택">')
rep("""if(top.id==='faith'&&faithSub)sub='\\n└ '+faithSub;""","""if(top.id==='faith'&&faithSub)sub='\\n└ '+faithSub;if(top.id==='faith'&&faithSub&&/^혜화동성당/.test(faithSub)&&window.wk91ChurchSub)sub+='\\n   └ '+window.wk91ChurchSub;""")
rep("""faithSpots.forEach(s=>s.addEventListener('click',()=>{\n faithSpots.forEach(x=>x.classList.toggle('selected',x===s));faithSub=s.dataset.faith;update();\n}));""","""faithSpots.forEach(s=>s.addEventListener('click',()=>{\n faithSpots.forEach(x=>x.classList.toggle('selected',x===s));faithSub=s.dataset.faith;window.wk91ChurchSub=null;document.querySelectorAll('.churchspot').forEach(x=>x.classList.remove('selected'));if(s.id==='church')document.getElementById('churchModal')?.classList.add('open');update();\n}));window.wk91Update=update;""")

# ---------- 6. final overrides (map, yellow borders, guestbook next to visitor count)
final = open(sys.argv[4], encoding='utf-8').read()
_mp63=open(sys.argv[2].replace('world_final.webp','member-progress.html'),encoding='utf-8').read()
final = _g32html + '\n' + _g31html + '\n' + final
final = final + '\n' + _mp63
_pv64=open(sys.argv[2].replace('world_final.webp','park-viewer.html'),encoding='utf-8').read()
final = final + '\n' + _pv64
_pr66=open(sys.argv[2].replace('world_final.webp','park-roles.html'),encoding='utf-8').read()
final = final + '\n' + _pr66
_vl70=open(sys.argv[2].replace('world_final.webp','visit-log.html'),encoding='utf-8').read()
final = final + '\n' + _vl70
_pg74=open(sys.argv[2].replace('world_final.webp','park-gallery.html'),encoding='utf-8').read()
final = final + '\n' + _pg74
_sc76=open(sys.argv[2].replace('world_final.webp','scenery.html'),encoding='utf-8').read()
final = final + '\n' + _sc76
t = t.rstrip('\n') + '\n' + final + '\n'
open(out, 'wb').write(t.encode('utf-8'))
print('ok', len(t))
