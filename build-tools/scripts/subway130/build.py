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
W=2000;Hh=round(W*(mxy-mny)/(mxx-mnx));pad=40
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
out={'v':130,'w':W,'h':Hh,'lines':[[l['ko'],l['colour']] for l in L],'st':S,'e':edges,'f':[[f[0],idx[f[1]],f[2]] for f in F],
     'src':'지하철 자료: © OpenStreetMap contributors (ODbL), korea-mcp'}
p=os.path.join(H,'..','..','assets','subway130.json')
json.dump(out,open(p,'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(S),'역',len(edges),'구간',W,'x',Hh,os.path.getsize(p),'bytes')
print(collections.Counter(F[o][0] for o in own))
