import json,re
from PIL import Image, ImageOps, ImageDraw
d='/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'
P=json.load(open(d+'probs31.json'));S=220/72
s=open(d+'bbox31.html',encoding='utf-8').read()
pages=re.findall(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>',s,re.S)
bycol={}
for n,v in P.items():bycol.setdefault((v['page'],v['col']),[]).append((v['y'],int(n),v['x']))
cache={}
def page(pg):
    if pg in cache:return cache[pg]
    im=Image.open(d+f'q31/pg-{pg:02d}.png').convert('RGB');dr=ImageDraw.Draw(im)
    for a,b,c,e,t in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>',pages[pg-1][2]):
        a,b,c,e=map(float,(a,b,c,e));dr.rectangle((int((a-2)*S),int((b-2)*S),int((c+2)*S),int((e+2)*S)),fill='white')
    cache[pg]=im;return im
for (pg,col),lst in bycol.items():
    lst.sort();im=page(pg)
    for i,(y,n,x) in enumerate(lst):
        y1=(lst[i+1][0]-4) if i+1<len(lst) else 805
        x0=x+20;x1=(294 if col==0 else 584)
        c=im.crop((int(x0*S),int((y-4)*S),int(x1*S),int(y1*S)))
        g=ImageOps.invert(c.convert('L')).point(lambda p:255 if p>18 else 0);bb=g.getbbox()
        if bb:
            pad=14;c=c.crop((max(0,bb[0]-pad),max(0,bb[1]-pad),min(c.width,bb[2]+pad),min(c.height,bb[3]+pad)))
        c.save(d+f'q31/q{n:03d}.png')
print('ok')
