/* 140차: 독해 지문 — 학년 수준에 따라 6~14문장, 이야기 종류 6가지(자기소개·주말 일기·하루 일과·초대 편지·학교 안내문·잃어버린 물건), 질문은 내용·순서·이유·주제·맞는 것 고르기 */
const R140={
 PLACE:[['the zoo','동물원','saw many animals','많은 동물을 봤어요'],['the beach','바닷가','built a sandcastle','모래성을 쌓았어요'],['the science museum','과학관','watched a robot show','로봇 쇼를 봤어요'],['the farm','농장','picked strawberries','딸기를 땄어요'],['the aquarium','수족관','saw a big shark','큰 상어를 봤어요'],['the mountain','산','climbed to the top','꼭대기까지 올라갔어요'],['the lake park','호수 공원','rode bikes','자전거를 탔어요'],['the market','시장','bought fresh fruit','신선한 과일을 샀어요'],['the amusement park','놀이공원','rode a roller coaster','롤러코스터를 탔어요'],['the art museum','미술관','looked at old paintings','오래된 그림들을 봤어요']],
 WHO:[['my grandparents','할머니와 할아버지'],['my family','가족'],['my uncle','삼촌'],['my best friend','가장 친한 친구'],['my classmates','반 친구들'],['my dad','아빠'],['my mom','엄마'],['my older brother','형(오빠)']],
 TRANS:[['by bus','버스'],['by train','기차'],['by car','자동차'],['by subway','지하철'],['on foot','걸어서'],['by bike','자전거']],
 WEATHER:[['sunny','맑았어요'],['cloudy','흐렸어요'],['windy','바람이 많이 불었어요'],['warm','따뜻했어요'],['cool','선선했어요'],['hot','더웠어요']],
 LUNCH:[['sandwiches','샌드위치'],['gimbap','김밥'],['noodles','국수'],['fried chicken','치킨'],['pizza','피자'],['hamburgers','햄버거'],['fried rice','볶음밥']],
 SUBJ:[['math','수학'],['science','과학'],['music','음악'],['art','미술'],['P.E.','체육'],['English','영어'],['Korean','국어'],['social studies','사회']],
 HOBBY:[['playing soccer','축구하기'],['drawing pictures','그림 그리기'],['playing the piano','피아노 치기'],['reading comic books','만화책 읽기'],['dancing','춤추기'],['cooking','요리하기'],['taking photos','사진 찍기'],['playing badminton','배드민턴 치기']],
 DREAM:[['a doctor','의사'],['a teacher','선생님'],['a singer','가수'],['a pilot','비행기 조종사'],['a cook','요리사'],['a scientist','과학자'],['an artist','화가'],['a soccer player','축구 선수'],['a vet','수의사'],['a police officer','경찰관']],
 DREAMWHY:{'a doctor':['help sick people','아픈 사람들을 돕고'],'a teacher':['teach children','아이들을 가르치고'],'a singer':['make people happy with songs','노래로 사람들을 행복하게 하고'],'a pilot':['fly all over the world','세계 곳곳을 날아다니고'],'a cook':['make delicious food','맛있는 음식을 만들고'],'a scientist':['make useful robots','쓸모 있는 로봇을 만들고'],'an artist':['paint beautiful pictures','아름다운 그림을 그리고'],'a soccer player':['play in the World Cup','월드컵에서 뛰고'],'a vet':['take care of sick animals','아픈 동물들을 돌보고'],'a police officer':['keep people safe','사람들을 안전하게 지키고']},
 PETC:[['white','흰색'],['black','검은색'],['brown','갈색'],['gray','회색'],['yellow','노란색']],
 PETN:['Coco','Max','Luna','Toto','Bori','Dubu','Momo'],
 FAM:[[3,'세'],[4,'네'],[5,'다섯']],
 BRK:[['rice and soup','밥과 국'],['bread and milk','빵과 우유'],['cereal','시리얼'],['eggs and toast','달걀과 토스트'],['fruit and yogurt','과일과 요구르트']],
 AFTER:[['go to a taekwondo class','태권도 학원에 가요'],['play soccer with friends','친구들과 축구를 해요'],['take piano lessons','피아노 수업을 받아요'],['read books in the library','도서관에서 책을 읽어요'],['swim at the sports center','체육관에서 수영을 해요'],['walk my dog','개를 산책시켜요']],
 ACT:[['play board games','보드게임을 할'],['watch a funny movie','재미있는 영화를 볼'],['make pizza together','함께 피자를 만들'],['sing songs','노래를 부를'],['play fun quiz games','재미있는 퀴즈 게임을 할']],
 BRING:[['a hat','모자'],['a water bottle','물병'],['a lunch box','도시락'],['an umbrella','우산'],['a notebook','공책'],['sunscreen','선크림'],['a raincoat','비옷']],
 LOST:[['my blue cap','파란 모자'],['my pencil case','필통'],['my red umbrella','빨간 우산'],['my new watch','새 손목시계'],['my library card','도서관 카드'],['my soccer ball','축구공']],
 LPLACE:[['on the playground','운동장'],['in the classroom','교실'],['in the library','도서관'],['in the gym','체육관'],['in the music room','음악실']],
 FOUND:[['under the bench','벤치 아래'],['behind the door','문 뒤'],['in the lost and found box','분실물 상자 안'],['on the teacher\'s desk','선생님 책상 위'],['next to the water fountain','정수기 옆']],
 GIFT:[['some cookies','쿠키'],['a chocolate bar','초콜릿'],['a sticker','스티커'],['an apple','사과'],['a thank-you card','감사 카드']],
 PBRING:[['your favorite snack','좋아하는 간식'],['a board game','보드게임'],['your swimsuit','수영복'],['a funny hat','재미있는 모자'],['your camera','카메라']],
 MON:[['January','1월'],['March','3월'],['April','4월'],['May','5월'],['June','6월'],['July','7월'],['September','9월'],['October','10월'],['November','11월'],['December','12월']]
};
function readings(key,lvl,n){const r=rng('read140|'+key),out=[];const seen=new Set();let guard=0;const P=R140;
 const others=(arr,ans,f)=>{const o=[];for(const x of shuffle(arr,r)){const v=f?f(x):x;if(v!==ans&&!o.includes(v))o.push(v);if(o.length>=3)break;}return o;};
 const hours=()=>{const h=[7,8,9,10,11,12,1,2,3,4,5,6];return h;};
 const hrs=(h,pm)=>(pm?'오후 ':'오전 ')+h+'시';
 /* 이야기 종류: 수준이 낮으면 쉬운 것만 */
 const kinds=lvl<=1?['intro','day']:lvl===2?['intro','day','trip','lost']:['intro','day','trip','letter','notice','lost'];
 const big=lvl>=3,huge=lvl>=4;
 while(out.length<n&&guard++<n*8){const kind=pick(kinds,r),nm=pick(NAMES,r),girl=GIRL.has(nm[0]),He=girl?'She':'He',he=He.toLowerCase(),his=girl?'her':'his';
  let S=[],Q=[],id=kind,topic='';
  const F=[];/* 맞는 것 고르기용: [틀(값), 값, 다른 값들] */
  if(kind==='intro'){const age=lvl<=2?8+Math.floor(r()*3):lvl===3?11+Math.floor(r()*2):13+Math.floor(r()*4),city=pick(CITY,r),fam=pick(P.FAM,r),pet=pick(PET.slice(0,2).concat(PET.slice(2)),r),pc=pick(P.PETC,r),pn=pick(P.PETN,r),food=pick(FOOD,r),sub=pick(P.SUBJ,r),hob=pick(P.HOBBY,r),dr=pick(P.DREAM,r);
   id+=nm[0]+age+city[0]+pet[0]+food[0]+sub[0]+hob[0]+dr[0];topic='자기소개';
   S.push('Hi, my name is '+nm[0]+'.','I am '+age+' years old.','I live in '+city[0]+' with my family.');
   if(lvl>=2)S.push('There are '+['','','','three','four','five'][fam[0]]+' people in my family.');
   S.push('I have '+pet[0]+'.');if(lvl>=2)S.push('Its name is '+pn+', and it is '+pc[0]+'.');
   S.push('I like '+food[0]+' very much.');
   if(lvl>=2)S.push('My favorite subject is '+sub[0].replace(/\.$/,'')+'.');
   if(big)S.push('After school, I enjoy '+hob[0]+'.');
   if(big)S.push('I want to be '+dr[0]+' in the future.','I want to '+P.DREAMWHY[dr[0]][0]+'.');
   if(huge)S.push('I know it will not be easy, but I will do my best every day.');
   Q.push(['글쓴이의 이름은?',nm[1],others(NAMES,nm[1],x=>x[1])],['글쓴이는 몇 살인가요?',age+'살',[age-1,age+1,age+2].map(x=>x+'살')],['글쓴이가 사는 곳은?',city[1],others(CITY,city[1],x=>x[1])],['글쓴이가 기르는 동물은?',pet[1],others(PET,pet[1],x=>x[1])],['글쓴이가 아주 좋아하는 음식은?',food[1],others(FOOD,food[1],x=>x[1])]);
   F.push([v=>'글쓴이는 '+v+'에 살아요.',city[1],others(CITY,city[1],x=>x[1])],[v=>'글쓴이는 '+fill(v+'{을}')+' 길러요.',pet[1],others(PET,pet[1],x=>x[1])]);
   if(lvl>=2){Q.push(['글쓴이의 가족은 모두 몇 명인가요?',fam[0]+'명',[2,3,4,5,6].filter(x=>x!==fam[0]).slice(0,3).map(x=>x+'명')],['애완동물의 이름은?',pn,others(P.PETN,pn)],['애완동물의 색깔은?',pc[1],others(P.PETC,pc[1],x=>x[1])],['글쓴이가 가장 좋아하는 과목은?',sub[1],others(P.SUBJ,sub[1],x=>x[1])]);F.push([v=>'글쓴이가 가장 좋아하는 과목은 '+v+'예요.',sub[1],others(P.SUBJ,sub[1],x=>x[1])]);}
   if(big){Q.push(['글쓴이가 방과 후에 즐겨 하는 것은?',hob[1],others(P.HOBBY,hob[1],x=>x[1])],['글쓴이의 장래 희망은?',dr[1],others(P.DREAM,dr[1],x=>x[1])],[fill('글쓴이가 '+dr[1]+'{이}')+' 되고 싶은 까닭은?',P.DREAMWHY[dr[0]][1]+' 싶어서',others(P.DREAM.filter(x=>x!==dr),'',x=>P.DREAMWHY[x[0]][1]+' 싶어서')]);F.push([v=>'글쓴이의 꿈은 '+fill(v+'{이에요}').replace(/\.$/,'')+'.',dr[1],others(P.DREAM,dr[1],x=>x[1])]);}
  }
  else if(kind==='day'){const wake=6+Math.floor(r()*2),brk=pick(P.BRK,r),tr=pick(P.TRANS,r),sub=pick(P.SUBJ,r),aft=pick(P.AFTER,r),din=5+Math.floor(r()*3),bed=9+Math.floor(r()*2),lunch=pick(P.LUNCH,r);
   id+=nm[0]+wake+brk[0]+tr[0]+sub[0]+aft[0]+din+bed;topic='하루 일과';
   S.push('I am '+nm[0]+'.','I get up at '+wake+' o\'clock every morning.','I eat '+brk[0]+' for breakfast.');
   S.push('I go to school '+tr[0]+'.');
   if(lvl>=2)S.push('My favorite class is '+sub[0].replace(/\.$/,'')+'.','At lunch, I eat '+lunch[0]+' with my friends.');
   S.push('After school, I '+aft[0]+'.');
   if(lvl>=2)S.push('I have dinner at '+din+' o\'clock.');
   if(big)S.push('Then I do my homework and read a book for thirty minutes.','I go to bed at '+bed+' o\'clock.');
   if(huge)S.push('On weekends, I get up a little later because I don\'t have school.','My days are busy, but I like my life.');
   Q.push(['글쓴이가 아침에 일어나는 시각은?',hrs(wake),[hrs(wake+1),hrs(wake+2),hrs(wake-1)]],['글쓴이가 아침으로 먹는 것은?',brk[1],others(P.BRK,brk[1],x=>x[1])],['글쓴이가 학교에 가는 방법은?',tr[1],others(P.TRANS,tr[1],x=>x[1])],['글쓴이가 학교가 끝난 뒤 하는 일은?',aft[1],others(P.AFTER,aft[1],x=>x[1])]);
   F.push([v=>'글쓴이는 '+(v==='걸어서'?'걸어서':fill(v+'{을}')+' 타고')+' 학교에 가요.',tr[1],others(P.TRANS,tr[1],x=>x[1])],[v=>'글쓴이는 아침으로 '+fill(v+'{을}')+' 먹어요.',brk[1],others(P.BRK,brk[1],x=>x[1])]);
   if(lvl>=2){Q.push(['글쓴이가 가장 좋아하는 수업은?',sub[1],others(P.SUBJ,sub[1],x=>x[1])],['점심에 친구들과 먹는 것은?',lunch[1],others(P.LUNCH,lunch[1],x=>x[1])],['저녁을 먹는 시각은?',hrs(din,1),[hrs(din+1,1),hrs(din+2,1),hrs(din-1,1)]]);}
   if(big){Q.push(['글쓴이가 잠자리에 드는 시각은?',hrs(bed,1),[hrs(bed+1,1),hrs(bed-2,1),hrs(bed-1,1)]],['숙제를 한 뒤에 하는 일은?','30분 동안 책 읽기',['한 시간 동안 게임하기','30분 동안 텔레비전 보기','30분 동안 피아노 치기']]);F.push([v=>'글쓴이는 '+v+'에 잠자리에 들어요.',hrs(bed,1),[hrs(bed+1,1),hrs(bed-1,1)]]);}
   if(huge)Q.push(['주말에 조금 늦게 일어나는 까닭은?','학교에 가지 않아서',['몸이 아파서','늦게까지 공부해서','알람이 고장 나서']]);
  }
  else if(kind==='trip'){const pl=pick(P.PLACE,r),who=pick(P.WHO,r),tr=pick(P.TRANS.filter(x=>x[0]!=='on foot'),r),w=pick(P.WEATHER,r),lu=pick(P.LUNCH,r),home=4+Math.floor(r()*4),day=pick(DAY.slice(5),r);
   id+=nm[0]+pl[0]+who[0]+tr[0]+w[0]+lu[0]+home+day[0];topic='주말에 다녀온 곳';
   S.push('Last '+day[0]+', I went to '+pl[0]+' with '+who[0]+'.','We went there '+tr[0]+'.','The weather was '+w[0]+'.','First, we '+pl[2]+'.');
   if(lvl>=2)S.push('For lunch, we ate '+lu[0]+'.');
   if(big)S.push('After lunch, we walked around and took many pictures.','We came back home at '+home+' o\'clock.');
   S.push('I was tired, but I was very happy.');
   if(big)S.push('I want to go there again next year.');
   if(huge)S.push('Next time, I will bring my camera because my phone\'s battery ran out.');
   Q.push(['글쓴이가 다녀온 곳은?',pl[1],others(P.PLACE,pl[1],x=>x[1])],['글쓴이와 함께 간 사람은?',who[1],others(P.WHO,who[1],x=>x[1])],['그곳에 간 방법은?',tr[1],others(P.TRANS,tr[1],x=>x[1])],['그날의 날씨는?',w[1],others(P.WEATHER,w[1],x=>x[1])],['그곳에 간 요일은?',day[1],others(DAY,day[1],x=>x[1])],['그곳에서 가장 먼저 한 일은?',pl[3],others(P.PLACE,pl[3],x=>x[3])],['글쓴이의 기분은 어땠나요?','피곤했지만 아주 행복했어요',['지루하고 슬펐어요','무섭고 화가 났어요','배가 아팠어요']]);
   F.push([v=>'글쓴이는 '+v+'에 다녀왔어요.',pl[1],others(P.PLACE,pl[1],x=>x[1])],[v=>'그날 날씨는 '+v+'.',w[1],others(P.WEATHER,w[1],x=>x[1])],[v=>'글쓴이는 '+fill(v+'{과}')+' 함께 갔어요.',who[1],others(P.WHO,who[1],x=>x[1])]);
   if(lvl>=2)Q.push(['점심으로 먹은 것은?',lu[1],others(P.LUNCH,lu[1],x=>x[1])]);
   if(big)Q.push(['집에 돌아온 시각은?',hrs(home,1),[hrs(home+1,1),hrs(home+2,1),hrs(home-1,1)]],['점심을 먹은 뒤에 한 일은?','걸어 다니며 사진을 많이 찍었어요',['낮잠을 잤어요','숙제를 했어요','수영을 했어요']]);
   if(huge)Q.push(['다음에 카메라를 가져가려는 까닭은?','휴대전화 배터리가 다 닳아서',['카메라를 새로 사서','친구가 부탁해서','사진 대회에 나가려고']]);
  }
  else if(kind==='letter'){const fr=pick(NAMES.filter(x=>x!==nm),r),mon=pick(P.MON,r),dt=1+Math.floor(r()*28),t=1+Math.floor(r()*5),act=pick(P.ACT,r),br=pick(P.PBRING,r),hplace=pick([['my house','글쓴이의 집'],['the park near the school','학교 근처 공원'],['the community center','주민 센터']],r);
   id+=nm[0]+fr[0]+mon[0]+dt+t+act[0]+br[0]+hplace[0];topic='생일 파티 초대';
   S.push('Dear '+fr[0]+',','How are you?','My birthday party is on '+mon[0]+' '+dt+'.','It starts at '+t+' p.m. at '+hplace[0]+'.','We will '+act[0]+' and eat a big chocolate cake.');
   S.push('Please bring '+br[0]+'.');
   S.push('Can you come?','Please call me by Friday.');
   if(huge)S.push('My little sister will help me with the party, so it will be a lot of fun.');
   S.push('Your friend, '+nm[0]);
   Q.push(['이 글을 쓴 사람은?',nm[1],others(NAMES.filter(x=>x!==fr),nm[1],x=>x[1])],['이 글을 받는 사람은?',fr[1],others(NAMES.filter(x=>x!==nm),fr[1],x=>x[1])],['이 글을 쓴 목적은?','생일 파티에 초대하려고',['고마움을 전하려고','사과하려고','이사 간다고 알리려고']],['파티가 열리는 날짜는?',mon[1]+' '+dt+'일',[mon[1]+' '+(dt%28+1)+'일',others(P.MON,mon[1],x=>x[1])[0]+' '+dt+'일',others(P.MON,mon[1],x=>x[1])[1]+' '+(dt%28+2)+'일']],['파티가 시작하는 시각은?',hrs(t,1),[hrs(t+1,1),hrs(t+2,1),hrs(t,0)]],['파티가 열리는 곳은?',hplace[1],['글쓴이의 학교','도서관','놀이공원']],['파티에 가져와 달라고 한 것은?',br[1],others(P.PBRING,br[1],x=>x[1])],['파티에서 할 일은?',act[1]+' 거예요',others(P.ACT,act[1]+' 거예요',x=>x[1]+' 거예요')],['언제까지 전화해 달라고 했나요?','금요일까지',['월요일까지','파티 당일까지','토요일 아침까지']]);
   F.push([v=>'파티에 '+fill(v+'{을}')+' 가져와야 해요.',br[1],others(P.PBRING,br[1],x=>x[1])],[v=>'파티는 '+v+'에 시작해요.',hrs(t,1),[hrs(t+1,1),hrs(t+2,1)]]);
  }
  else if(kind==='notice'){const pl=pick(P.PLACE,r),day=pick(DAY.slice(0,5),r),meet=8+Math.floor(r()*2),gate=pick([['the main gate','정문'],['the back gate','후문'],['the playground','운동장']],r),br=shuffle(P.BRING.filter(x=>x[0]!=='a lunch box'&&x[0]!=='a raincoat'),r).slice(0,2),back=2+Math.floor(r()*3),rain=pick(DAY.slice(0,5).filter(x=>x!==day),r);
   id+=pl[0]+day[0]+meet+gate[0]+br.map(x=>x[0]).join()+back+rain[0];topic='현장 체험 학습 안내';
   S.push('Hello, students.','Our class will go on a field trip to '+pl[0]+' next '+day[0]+'.','Please come to '+gate[0]+' by '+meet+' a.m.','We will go there by bus.','Please bring a lunch box, '+br[0][0]+', and '+br[1][0]+'.','Wear comfortable shoes because we will walk a lot.');
   S.push('We will come back to school at '+back+' p.m.');
   if(huge)S.push('Do not run on the bus, and always stay with your group.');
   S.push('If it rains, we will go on '+rain[0]+' instead.','See you then!');
   Q.push(['이 글의 목적은?','현장 체험 학습을 안내하려고',['운동회를 알리려고','방학 숙제를 내려고','새 선생님을 소개하려고']],['체험 학습 장소는?',pl[1],others(P.PLACE,pl[1],x=>x[1])],['모이는 곳은?',gate[1],['교실','강당','식당'].concat([]).slice(0,3)],['모이는 시각은?',hrs(meet),[hrs(meet+1),hrs(meet-1),hrs(meet,1)]],['가져오라고 하지 않은 것은?',pick(P.BRING.filter(x=>!br.includes(x)&&x[0]!=='a lunch box'),r)[1],[br[0][1],br[1][1],'도시락']],['편한 신발을 신으라고 한 까닭은?','많이 걸을 거라서',['비가 올 거라서','운동 경기를 해서','사진을 찍어서']],['비가 오면 어떻게 하나요?',rain[1]+'에 가요',others(DAY.slice(0,5).filter(x=>x!==rain),day[1]+'에 가요',x=>x[1]+'에 가요').concat(['그냥 취소해요']).filter(x=>x!==rain[1]+'에 가요').slice(0,3)],['학교로 돌아오는 시각은?',hrs(back,1),[hrs(back+1,1),hrs(back+2,1),hrs(back-1,1)]],['체험 학습 장소까지 타고 가는 것은?','버스',['기차','지하철','자전거']]);
   F.push([v=>'체험 학습은 '+v+'에 가요.',day[1],others(DAY.slice(0,5),day[1],x=>x[1])],[v=>'학생들은 '+v+'에 모여요.',gate[1],['강당','식당']]);
  }
  else{const lo=pick(P.LOST,r),lp=pick(P.LPLACE,r),fd=pick(P.FOUND,r),fr=pick(NAMES.filter(x=>x!==nm),r),gf=pick(P.GIFT,r),fG=GIRL.has(fr[0])?'she':'he';
   id+=nm[0]+lo[0]+lp[0]+fd[0]+fr[0]+gf[0];topic='잃어버린 물건 찾기';
   const lo3=lo[0].replace('my ',his+' ');
   S.push(nm[0]+' lost '+lo3+' '+lp[0]+'.',He+' looked everywhere, but '+he+' couldn\'t find it.',He+' was very sad.');
   if(lvl>=2)S.push('Then '+his+' friend '+fr[0]+' came and said, "I will help you."');
   S.push('They looked for it together.');
   S.push('Finally, '+fr[0]+' found it '+fd[0]+'.');
   S.push(nm[0]+' was so happy.');
   if(big)S.push('"Thank you so much," '+nm[0]+' said.','The next day, '+he+' gave '+fr[0]+' '+gf[0]+'.');
   if(huge)S.push('From that day, '+nm[0]+' always checks '+his+' things before '+he+' leaves a place.');
   const nmi=fill(nm[1]+'{이}');
   Q.push([nmi+' 잃어버린 물건은?',lo[1],others(P.LOST,lo[1],x=>x[1])],[nmi+' 물건을 잃어버린 곳은?',lp[1],others(P.LPLACE,lp[1],x=>x[1])],['물건을 찾은 곳은?',fd[1],others(P.FOUND,fd[1],x=>x[1])],['물건을 찾아 준 사람은?',fr[1],others(NAMES.filter(x=>x!==nm),fr[1],x=>x[1])],['물건을 잃어버렸을 때 '+fill(nm[1]+'{은}')+' 어땠나요?','슬펐어요',['신이 났어요','졸렸어요','화가 났어요']],['물건을 찾은 뒤 '+fill(nm[1]+'{은}')+' 어땠나요?','아주 기뻤어요',['슬펐어요','지루했어요','무서웠어요']]);
   F.push([v=>nmi+' '+fill(v+'{을}')+' 잃어버렸어요.',lo[1],others(P.LOST,lo[1],x=>x[1])],[v=>'물건은 '+v+'에서 찾았어요.',fd[1],others(P.FOUND,fd[1],x=>x[1])]);
   if(big)Q.push([fill(nm[1]+'{이}')+' 다음 날 친구에게 준 것은?',gf[1],others(P.GIFT,gf[1],x=>x[1])]);
   if(huge)Q.push(['이 일이 있은 뒤 '+fill(nm[1]+'{이}')+' 늘 하는 일은?','자리를 떠나기 전에 물건 챙기기',['물건에 이름 쓰기','물건을 사물함에 두기','새 물건 사기']]);
  }
  if(seen.has(id))continue;seen.add(id);
  const passage=S.join(' ');
  /* 주제 · 맞는 것 고르기 */
  const TOP=['자기소개','하루 일과','주말에 다녀온 곳','생일 파티 초대','현장 체험 학습 안내','잃어버린 물건 찾기'];
  Q.push(['이 글은 무엇에 관한 글인가요?',topic,others(TOP,topic)]);
  if(lvl>=2&&F.length>=2){const t=pick(F,r),fs=F.filter(x=>x!==t).concat(F.filter(x=>x!==t));const wrong=[];for(const f of fs){const w=f[2].find(v=>v&&v!==f[1]&&!wrong.includes(f[0](v)));if(w)wrong.push(f[0](w));if(wrong.length>=3)break;}
   while(wrong.length<3){const w=t[2].find(v=>v!==t[1]&&!wrong.includes(t[0](v)));if(!w)break;wrong.push(t[0](w));}
   if(wrong.length>=3)Q.push(['글의 내용과 맞는 것은?',t[0](t[1]),wrong]);}
  let took=0;for(const q of shuffle(Q,r)){if(took>=6)break;const [prompt,answer,wrong]=q;const w=Array.from(new Set(wrong.map(String))).filter(x=>x&&x!==answer);if(w.length<3)continue;out.push({prompt,answer,wrong:w.slice(0,3),explanation:'지문: '+passage,passage});took++;if(out.length>=n)break;}}
 return out;}
