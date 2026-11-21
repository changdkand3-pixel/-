# 130차: 수도권 지하철(OSM 자료, korea-mcp 패키지 MIT·ODbL) → 게임 지도 JSON
# python3 build-tools/scripts/subway130/build.py  → build-tools/assets/subway130.json
import json, math, heapq, os, collections
H=os.path.dirname(os.path.abspath(__file__))
d=json.load(open(os.path.join(H,'subway_osm.json'),encoding='utf-8'))
# 같은 이름 다른 역 나누기: 5호선 양평(영등포) / 경의·중앙선 양평(양평군)
for s0 in d['stations']:
    if s0['ko']=='양평':s0.update({'lines':['5'],'lat':37.52584,'lon':126.88577})
d['stations'].append({'ko':'양평(경기)','lines':['gyeongui'],'lat':37.49258,'lon':127.49186})
for e in d['edges']:
    if e['line']=='gyeongui':
        if e['from']=='양평':e['from']='양평(경기)'
        if e['to']=='양평':e['to']='양평(경기)'
d['edges']=[e for e in d['edges'] if not e.get('express')]
L=[l for l in d['lines']]
lid={l['id']:i for i,l in enumerate(L)}
for l in L:
    if not l['colour']:l['colour']='#8a8f99'
st=d['stations'];idx={s['ko']:i for i,s in enumerate(st)}
C=(37.54,126.99);cos=math.cos(math.radians(C[0]))
pts=[]
for s in st:
    x=(s['lon']-C[1])*cos;y=-(s['lat']-C[0]);r=math.hypot(x,y)
    if r>0:
        k=(r**0.62)/r;x*=k;y*=k
    pts.append([x,y])
mnx=min(p[0] for p in pts);mxx=max(p[0] for p in pts);mny=min(p[1] for p in pts);mxy=max(p[1] for p in pts)
W=3200;Hh=round(W*(mxy-mny)/(mxx-mnx));pad=40
P=[[round(pad+(p[0]-mnx)/(mxx-mnx)*(W-2*pad),1),round(pad+(p[1]-mny)/(mxy-mny)*(Hh-2*pad),1)] for p in pts]
E=set();edges=[]
adj=collections.defaultdict(dict)
for e in d['edges']:
    a,b=idx.get(e['from']),idx.get(e['to'])
    if a is None or b is None or a==b:continue
    key=(min(a,b),max(a,b),lid[e['line']])
    if key in E:continue
    E.add(key);edges.append(list(key))
    dist=math.hypot(st[a]['lat']-st[b]['lat'],(st[a]['lon']-st[b]['lon'])*cos)
    adj[a][b]=min(adj[a].get(b,9),dist);adj[b][a]=adj[a][b]
F=[['서울 도심','시청','#e8413a'],['서울 동북','노원','#2f80ed'],['서울 동남','강남','#9b51e0'],['서울 서남','신도림','#27ae60'],
   ['인천','인천시청','#f2994a'],['경기 남부','수원','#d4a017'],['경기 북부','의정부','#219ebc'],['고양·파주','대화','#8e6c3a'],
   ['경기 동부','구리','#11998e'],['경기 서남','안산','#d35d9a']]
for f in F:assert f[1] in idx,f
dist=[9e9]*len(st);own=[-1]*len(st);pq=[]
for fi,f in enumerate(F):
    i=idx[f[1]];dist[i]=0;own[i]=fi;heapq.heappush(pq,(0,i,fi))
while pq:
    dd,i,fi=heapq.heappop(pq)
    if dd>dist[i]:continue
    for j,w in adj[i].items():
        if dd+w<dist[j]:dist[j]=dd+w;own[j]=fi;heapq.heappush(pq,(dist[j],j,fi))
S=[[s['ko'],P[i][0],P[i][1],sorted({lid[l] for l in s['lines'] if l in lid}),own[i]] for i,s in enumerate(st)]

def proj(lat,lon):
    x=(lon-C[1])*cos;y=-(lat-C[0]);r=math.hypot(x,y)
    if r>0:
        k=(r**0.62)/r;x*=k;y*=k
    return [round(pad+(x-mnx)/(mxx-mnx)*(W-2*pad),1),round(pad+(y-mny)/(mxy-mny)*(Hh-2*pad),1)]
def dense(pts,step=0.01):
    out=[]
    for (a1,b1),(a2,b2) in zip(pts,pts[1:]):
        n=max(1,int(max(abs(a2-a1),abs(b2-b1))/step))
        for k in range(n):out.append((a1+(a2-a1)*k/n,b1+(b2-b1)*k/n))
    out.append(pts[-1]);return [proj(a,b) for a,b in out]
COAST=[(38.15,126.52),(37.78,126.55),(37.65,126.58),(37.58,126.60),(37.53,126.60),(37.48,126.60),(37.44,126.61),(37.40,126.615),(37.37,126.635),(37.35,126.69),(37.33,126.74),(37.28,126.77),(37.2,126.79),(37.1,126.82),(37.0,126.85),(36.92,126.9),(36.85,126.93),(36.70,126.90)]
ISLE=[(37.535,126.38),(37.535,126.565),(37.49,126.585),(37.44,126.555),(37.415,126.44),(37.445,126.36),(37.535,126.38)]
HAN=[(37.53,127.31),(37.555,127.24),(37.56,127.19),(37.555,127.14),(37.54,127.11),(37.525,127.085),(37.52,127.06),(37.525,127.03),(37.528,127.005),(37.515,126.985),(37.515,126.965),(37.525,126.94),(37.535,126.91),(37.545,126.89),(37.56,126.865),(37.575,126.84),(37.59,126.815),(37.61,126.79),(37.63,126.76),(37.66,126.72),(37.69,126.68),(37.72,126.62),(37.76,126.55)]
NHAN=[(37.53,127.31),(37.56,127.33),(37.62,127.35),(37.70,127.42),(37.78,127.50),(37.86,127.62),(37.88,127.72)]
SHAN=[(37.53,127.31),(37.49,127.40),(37.49,127.49),(37.47,127.60),(37.40,127.70)]
MTS=[('북한산',37.66,126.98),('도봉산',37.69,127.015),('수락산',37.70,127.08),('관악산',37.44,126.96),('청계산',37.42,127.05),('남한산성',37.48,127.18),('광교산',37.36,127.02),('계양산',37.55,126.71),('소요산',37.94,127.08),('감악산',37.94,126.97),('용문산',37.55,127.53),('축령산',37.75,127.33),('수리산',37.36,126.89),('불암산',37.66,127.09),('검단산',37.50,127.24)]
CITY=[('서울',37.575,126.99,1),('인천',37.455,126.69,1),('수원',37.27,127.01,1),('성남',37.42,127.13,0),('고양',37.665,126.81,0),('의정부',37.745,127.05,0),('부천',37.50,126.78,0),('안산',37.32,126.83,0),('남양주',37.65,127.22,0),('파주',37.77,126.78,0),('용인',37.235,127.18,0),('평택',36.99,127.09,0),('춘천',37.88,127.73,0),('양평',37.49,127.49,0),('김포',37.625,126.70,0),('화성',37.20,126.93,0),('동두천',37.90,127.06,0),('가평',37.83,127.51,0),('천안·아산',36.81,127.08,0),('광명',37.47,126.87,0),('하남',37.54,127.21,0),('안양',37.39,126.93,0),('시흥',37.38,126.80,0),('오산',37.15,127.07,0),('이천',37.27,127.44,0),('여주',37.29,127.64,0)]
coast=dense(COAST)
sea=coast+[[-600,coast[-1][1]+800],[-600,-600],[coast[0][0],-600]]
deco={'sea':sea,'coast':coast,'isle':dense(ISLE),'rivers':[dense(HAN),dense(NHAN),dense(SHAN)],
      'mts':[[n]+proj(a,b) for n,a,b in MTS],'city':[[n]+proj(a,b)+[big] for n,a,b,big in CITY]}
# trees where empty land
import random
random.seed(130)
def inpoly(x,y,poly):
    c=False;n=len(poly)
    for i in range(n):
        x1,y1=poly[i];x2,y2=poly[(i+1)%n]
        if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1+1e-9)+x1:c=not c
    return c
seg=[(P[a],P[b]) for a,b,l in edges]
def dseg(px,py,a,b):
    ax,ay=a;bx,by=b;dx,dy=bx-ax,by-ay;t=max(0,min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy+1e-9)));return math.hypot(px-ax-t*dx,py-ay-t*dy)
riv=[pt for r in deco['rivers'] for pt in r]
trees=[]
tries=0
while len(trees)<320 and tries<20000:
    tries+=1;x=random.uniform(60,W-60);y=random.uniform(60,Hh-60)
    if inpoly(x,y,sea) and not inpoly(x,y,deco['isle']):continue
    if min(math.hypot(x-p[0],y-p[1]) for p in P)<70:continue
    if min(dseg(x,y,a,b) for a,b in seg)<45:continue
    if min(math.hypot(x-r[0],y-r[1]) for r in riv)<40:continue
    if any(math.hypot(x-m[1],y-m[2])<90 for m in deco['mts']):continue
    if any(math.hypot(x-t[0],y-t[1])<38 for t in trees):continue
    trees.append([round(x),round(y)])
deco['trees']=trees
wet=[s0['ko'] for i,s0 in enumerate(st) if inpoly(P[i][0],P[i][1],sea) and not inpoly(P[i][0],P[i][1],deco['isle'])]
print('바다에 빠진 역',wet)
out={'v':130,'w':W,'h':Hh,'lines':[[l['ko'],l['colour']] for l in L],'st':S,'e':edges,'f':[[f[0],idx[f[1]],f[2]] for f in F],
     'src':'지하철 자료: © OpenStreetMap contributors (ODbL), korea-mcp','deco':deco}
p=os.path.join(H,'..','..','assets','subway130.json')
json.dump(out,open(p,'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(S),'역',len(edges),'구간',W,'x',Hh,os.path.getsize(p),'bytes')
print(collections.Counter(F[o][0] for o in own))
