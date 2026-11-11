from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
wa=Image.open('worldart.webp').convert('RGB')
mmfull=Image.open('mainmap.webp').convert('RGB')
mm=mmfull.resize((1000,563),Image.LANCZOS)
def ss(d):d=np.clip(d,0,1);return d*d*(3-2*d)
def feather(w,h,f,right=True,left=True,top=True,bottom=True):
    y,x=np.mgrid[0:h,0:w].astype(float);big=1e9
    d=np.minimum.reduce([x if left else x*0+big,(w-1-x) if right else x*0+big,y if top else y*0+big,(h-1-y) if bottom else y*0+big])/f
    return Image.fromarray((ss(d)*255).astype('uint8'))
c=wa.copy()
src=wa.crop((1785,265,1985,485)).transpose(Image.FLIP_LEFT_RIGHT);c.paste(src,(1560,265),feather(200,220,28))
# mirror-extend the map's right edge so there is no hard line
S=150
strip=mm.crop((1000-S,0,1000,563)).transpose(Image.FLIP_LEFT_RIGHT)
y,x=np.mgrid[0:563,0:S].astype(float)
a=(1-ss(x/S))*ss(np.minimum(y,562-y)/42)
c.paste(strip,(1600,225),Image.fromarray((a*255).astype('uint8')))
# map itself: soft on left/top/bottom, solid to the right edge
c.paste(mm,(600,225),feather(1000,563,42,right=False))
# right side of map: thin soft edge only where strip is weak (top/bottom corners handled by feather)
# 9-course sign, drawn in the park's cartoon style
K='/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
f1=ImageFont.truetype(K,30);f2=ImageFont.truetype(K,38)
W,H=230,215
L=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(L)
# shadow
sh=Image.new('RGBA',(W,H),(0,0,0,0));sd=ImageDraw.Draw(sh);sd.ellipse((40,190,190,212),fill=(60,40,10,110));sd.rounded_rectangle((18,62,218,170),20,fill=(60,30,5,120));sh=sh.filter(ImageFilter.GaussianBlur(4));L.alpha_composite(sh)
for px in (70,160):d.rounded_rectangle((px-8,150,px+8,204),4,fill=(150,88,36),outline=(90,48,14),width=3)
d.rounded_rectangle((12,56,214,166),22,fill=(110,58,18))
d.rounded_rectangle((18,62,208,160),18,fill=(255,236,176))
d.rounded_rectangle((26,70,200,152),13,outline=(232,180,90),width=3)
d.text((113,92),'9. 코스',font=f1,fill=(108,52,14),anchor='mm',stroke_width=1,stroke_fill=(108,52,14))
d.text((113,131),'공사중',font=f2,fill=(220,38,38),anchor='mm',stroke_width=4,stroke_fill=(255,255,255))
# hard hat
d.pieslice((70,6,160,96),180,360,fill=(255,200,30),outline=(150,95,0),width=4)
d.rounded_rectangle((58,46,172,60),7,fill=(255,214,60),outline=(150,95,0),width=3)
d.line((115,10,115,48),fill=(230,165,10),width=6);d.arc((80,14,150,84),200,250,fill=(255,240,170),width=5)
c=c.convert('RGBA');c.alpha_composite(L,(1566,470));c=c.convert('RGB')
c.save('world_final.png');c.save('world_final.webp',quality=86,method=6)
c.crop((1350,150,1950,900)).save('wf_r.png')
