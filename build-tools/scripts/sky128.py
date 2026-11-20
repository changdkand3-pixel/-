from PIL import Image
import numpy as np, cv2, json
D='/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/c128/'
A='/home/user/-/build-tools/assets/'
im=np.array(Image.open(D+'../mm_full.png').convert('RGB'));H,W,_=im.shape
f=im.astype(float);r,g,b=f[...,0],f[...,1],f[...,2];mx=f.max(2);mn=f.min(2)
B=200
sky=(b>165)&(b-r>45)&(b-g>5)
white=(mn>180)&((mx-mn)<70)
reg=(sky|white).astype('uint8');reg[B:]=0
n,lab,st,_=cv2.connectedComponentsWithStats(reg,4)
big=np.zeros_like(reg)
for i in range(1,n):
    if st[i][4]>3000:big|=(lab==i).astype('uint8')
big=cv2.morphologyEx(big,cv2.MORPH_OPEN,np.ones((3,3),'uint8'))
m=cv2.erode(big,np.ones((5,5),'uint8'));mf=cv2.GaussianBlur(m.astype(float),(5,5),0)[:B]
# smooth sky field from pure blue sky (no clouds)
pure=(sky&~cv2.dilate(white.astype('uint8'),np.ones((15,15),'uint8')).astype(bool)).astype(float)[:B]
field=np.zeros((B,W,3))
for c in range(3):
    ch=f[:B,:,c]
    num=cv2.GaussianBlur(ch*pure,(0,0),25);den=cv2.GaussianBlur(pure,(0,0),25)+1e-6
    field[...,c]=num/den
band=np.dstack([np.clip(field,0,255),mf*255]).astype('uint8')
Image.fromarray(band,'RGBA').save(A+'sky_band_128.webp','WEBP',quality=80,method=6)
# clouds: alpha = whiteness above sky field
lum=f[:B].mean(2);fl=field.mean(2)
a=np.clip((lum-fl-10)/(255-fl-10+1e-6)*1.6,0,1)
a=a*(white[:B]|cv2.dilate(white[:B].astype('uint8'),np.ones((5,5),'uint8')).astype(bool))*mf
a[150:]=0
a8=(a*255).astype('uint8')
solid=cv2.morphologyEx((a8>40).astype('uint8'),cv2.MORPH_CLOSE,np.ones((11,11),'uint8'))
hole=(solid>0)&(a8<=40)
a8[hole]=235
a=cv2.GaussianBlur(a8.astype(float)/255,(3,3),0)
# colour for filled holes: inpaint from cloud pixels
cb=cv2.cvtColor(np.clip(f[:B],0,255).astype('uint8'),cv2.COLOR_RGB2BGR)
cb=cv2.inpaint(cb,(hole|((a8<120)&(solid>0))).astype('uint8')*255,5,cv2.INPAINT_TELEA)
fcl=cv2.cvtColor(cb,cv2.COLOR_BGR2RGB).astype(float)
cm=(a>.06).astype('uint8');n2,lab2,st2,_=cv2.connectedComponentsWithStats(cv2.dilate(cm,np.ones((7,7),'uint8')),8)
sprites=[];rgb=np.clip(fcl,0,255)
for i in range(1,n2):
    x,y,w,h,ar=st2[i]
    if ar<300 or y>135:continue
    x0,y0=max(0,x-2),max(0,y-2);x1,y1=min(W,x+w+2),min(B,y+h+2)
    al=(a[y0:y1,x0:x1]*(lab2[y0:y1,x0:x1]==i)*255).astype('uint8')
    sprites.append({'x':int(x0),'y':int(y0),'w':int(x1-x0),'h':int(y1-y0),'img':np.dstack([rgb[y0:y1,x0:x1].astype('uint8'),al])})
bad=lambda q:(q['w']<44) or (q['x']==1271) or (q['x']==143)
static=[q for q in sprites if bad(q)];sprites=[q for q in sprites if not bad(q)]
keepm=np.zeros((B,W),'uint8')
for q in static:keepm[q['y']:q['y']+q['h'],q['x']:q['x']+q['w']]|=(q['img'][...,3]>12).astype('uint8')
keepm=cv2.dilate(keepm,np.ones((3,3),'uint8'))
band[...,3]=(band[...,3]*(1-cv2.GaussianBlur(keepm.astype(float),(3,3),0))).astype('uint8')
fade=np.clip((172-np.arange(B))/12.0,0,1)[:,None];band[...,3]=(band[...,3]*fade).astype('uint8')
Image.fromarray(band,'RGBA').save(A+'sky_band_128.webp','WEBP',quality=80,method=6)
# pack sprites into one sheet
sheetw=max(s['w'] for s in sprites);sh=sum(s['h'] for s in sprites)
sheet=np.zeros((sh,sheetw,4),'uint8');yy=0;meta=[]
for s in sprites:
    sheet[yy:yy+s['h'],:s['w']]=s['img'];meta.append([s['x'],s['y'],s['w'],s['h'],yy]);yy+=s['h']
Image.fromarray(sheet,'RGBA').save(A+'sky_clouds_128.webp','WEBP',quality=82,method=6)
# water mask for the two bridge ponds
wm=np.zeros((H,W),'uint8')
for (x0,x1) in [(.085,.225),(.85,.95)]:
    X0,X1,Y0=int(W*x0),int(W*x1),int(H*.89)
    blue=(b>150)&(b-r>70)
    wm[Y0:,X0:X1]=blue[Y0:,X0:X1]
wm=cv2.morphologyEx(wm,cv2.MORPH_OPEN,np.ones((3,3),'uint8'));wm=cv2.erode(wm,np.ones((3,3),'uint8'))
Y0=int(H*.89)
pm=wm[Y0:].astype('uint8')*255;pm=cv2.GaussianBlur(pm,(3,3),0);Image.fromarray(np.dstack([np.full_like(pm,255)]*3+[pm]),'RGBA').save(A+'pond_mask_128.png',optimize=True)
json.dump({'clouds':meta,'sheet':[sheetw,sh],'pondY':Y0,'pondH':H-Y0},open(A+'sky_128.json','w'))
print(len(meta),sheetw,sh,meta)
import os;[print(p,os.path.getsize(A+p)) for p in ['sky_band_128.webp','sky_clouds_128.webp','pond_mask_128.png']]
vis=im[:B].copy().astype(float)
Image.fromarray((a*255).astype('uint8')).save(D+'calpha.png')
