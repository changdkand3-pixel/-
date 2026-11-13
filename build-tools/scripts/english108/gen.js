/* 108차: 영어 학기마다 단원당 약 300문제 — 단어 은행(초·중·고) + 문장 틀(문법·문장 뜻·영작) + 지문 만들기(독해) + 대화 만들기(듣기) */
(function(){
'use strict';
const D=window.WonkiEnglishCurriculum;if(!Array.isArray(D))return;
const WB=__WORDS__;
const TARGET=300;
function rng(seed){let s=0;for(const c of seed)s=(s*31+c.charCodeAt(0))>>>0;s=s||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pick(a,r){return a[Math.floor(r()*a.length)];}
function bat(w){const c=String(w).trim().slice(-1).charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3)return (c-0xAC00)%28;return /[0-9]$/.test(w)?({0:1,1:8,3:1,6:1,7:8,8:1}[w.slice(-1)]||0):/[lmnr]$/i.test(w)?4:/[bkpt]$/i.test(w)?1:0;}
function josa(w,p){const [a,b]=p.split('/');const k=bat(w);if(p==='으러/러'||p==='으로/로')return w+(k&&k!==8?a:b);return w+(k?a:b);}
function fill(s){return s.replace(/([^\s{}]+)\{(을|이|은|이에요|이라면|과)\}/g,(m,w,j)=>josa(w,{'을':'을/를','이':'이/가','은':'은/는','이에요':'이에요/예요','이라면':'이라면/라면','과':'과/와'}[j]));}
function dropL(st){const c=st.slice(-1).charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28===8)return st.slice(0,-1)+String.fromCharCode(c-8);return st;}
/* 동사: [원형, 과거, 과거분사, 목적어(영), 목적어(우리말, {을}는 조사 자리), 해요, 했어요, 줄기, ㄹ꼴] */
const V=[['play','played','played','soccer','축구{을}','해요','했어요','하','할'],['play','played','played','the piano','피아노{을}','쳐요','쳤어요','치','칠'],['read','read','read','a book','책{을}','읽어요','읽었어요','읽','읽을'],['eat','ate','eaten','lunch','점심{을}','먹어요','먹었어요','먹','먹을'],['drink','drank','drunk','milk','우유{을}','마셔요','마셨어요','마시','마실'],['watch','watched','watched','TV','TV를','봐요','봤어요','보','볼'],['go','went','gone','to school','학교에','가요','갔어요','가','갈'],['swim','swam','swum','in the pool','수영장에서','수영해요','수영했어요','수영하','수영할'],['ride','rode','ridden','a bike','자전거{을}','타요','탔어요','타','탈'],['draw','drew','drawn','a picture','그림{을}','그려요','그렸어요','그리','그릴'],['sing','sang','sung','a song','노래{을}','불러요','불렀어요','부르','부를'],['clean','cleaned','cleaned','the room','방{을}','청소해요','청소했어요','청소하','청소할'],['help','helped','helped','Mom','엄마{을}','도와요','도왔어요','돕','도울'],['write','wrote','written','a letter','편지{을}','써요','썼어요','쓰','쓸'],['listen','listened','listened','to music','음악{을}','들어요','들었어요','듣','들을'],['make','made','made','a cake','케이크{을}','만들어요','만들었어요','만들','만들'],['cook','cooked','cooked','dinner','저녁{을}','요리해요','요리했어요','요리하','요리할'],['study','studied','studied','English','영어{을}','공부해요','공부했어요','공부하','공부할'],['visit','visited','visited','Grandma','할머니 댁{을}','방문해요','방문했어요','방문하','방문할'],['wash','washed','washed','the dishes','설거지{을}','해요','했어요','하','할'],['take','took','taken','a photo','사진{을}','찍어요','찍었어요','찍','찍을'],['fly','flew','flown','a kite','연{을}','날려요','날렸어요','날리','날릴'],['buy','bought','bought','a gift','선물{을}','사요','샀어요','사','살'],['meet','met','met','a friend','친구{을}','만나요','만났어요','만나','만날'],['walk','walked','walked','the dog','개{을}','산책시켜요','산책시켰어요','산책시키','산책시킬'],['plant','planted','planted','a tree','나무{을}','심어요','심었어요','심','심을'],['open','opened','opened','the window','창문{을}','열어요','열었어요','열','열'],['close','closed','closed','the door','문{을}','닫아요','닫았어요','닫','닫을'],['do','did','done','homework','숙제{을}','해요','했어요','하','할'],['learn','learned','learned','Korean','한국어{을}','배워요','배웠어요','배우','배울'],['play','played','played','badminton','배드민턴{을}','쳐요','쳤어요','치','칠'],['bake','baked','baked','cookies','쿠키{을}','구워요','구웠어요','굽','구울'],['catch','caught','caught','a ball','공{을}','잡아요','잡았어요','잡','잡을'],['climb','climbed','climbed','the mountain','산에','올라요','올랐어요','오르','오를'],['send','sent','sent','an email','이메일{을}','보내요','보냈어요','보내','보낼'],['feed','fed','fed','the cat','고양이에게 먹이{을}','줘요','줬어요','주','줄'],['grow','grew','grown','tomatoes','토마토{을}','길러요','길렀어요','기르','기를'],['find','found','found','the key','열쇠{을}','찾아요','찾았어요','찾','찾을'],['build','built','built','a sandcastle','모래성{을}','쌓아요','쌓았어요','쌓','쌓을'],['practice','practiced','practiced','the violin','바이올린 연습{을}','해요','했어요','하','할']];
const DOUBLE=new Set(['swim','run','sit','stop','plan','shop','get','put','begin','plant_no']);
function s3(b){if(b==='have')return 'has';if(b==='do')return 'does';if(b==='go')return 'goes';if(/(s|sh|ch|x|o)$/.test(b))return b+'es';if(/[^aeiou]y$/.test(b))return b.slice(0,-1)+'ies';return b+'s';}
function ing(b){if(DOUBLE.has(b))return b+b.slice(-1)+'ing';if(b==='lie')return 'lying';if(/[^e]e$/.test(b))return b.slice(0,-1)+'ing';return b+'ing';}
const SUBJ=[['I','나는','1'],['You','너는','2'],['We','우리는','p'],['They','그들은','p'],['He','그는','3'],['She','그녀는','3'],['Minsu','민수{은}','3'],['Jina','지나{은}','3'],['Tom','톰{은}','3'],['Amy','에이미{은}','3'],['Junho','준호{은}','3'],['Sora','소라{은}','3'],['My sister','내 여동생{은}','3'],['My friends','내 친구들{은}','p']];
const be=p=>p==='1'?'am':p==='3'?'is':'are';const have=p=>p==='3'?'has':'have';
const ADJ=[['happy','행복해요'],['hungry','배고파요'],['tired','피곤해요'],['sad','슬퍼요'],['busy','바빠요'],['sleepy','졸려요'],['thirsty','목말라요'],['kind','친절해요'],['sick','아파요'],['hot','더워요'],['cold','추워요'],['excited','신이 나요'],['bored','지루해요'],['nervous','긴장돼요'],['ready','준비됐어요'],['late','늦었어요'],['angry','화가 났어요'],['brave','용감해요'],['quiet','조용해요'],['healthy','건강해요']];
const FOOD=[['apples','사과'],['bananas','바나나'],['pizza','피자'],['milk','우유'],['ice cream','아이스크림'],['carrots','당근'],['cookies','쿠키'],['grapes','포도'],['oranges','오렌지'],['chicken','치킨'],['noodles','국수'],['eggs','달걀'],['tomatoes','토마토'],['cheese','치즈'],['bread','빵'],['strawberries','딸기'],['juice','주스'],['fish','생선'],['salad','샐러드'],['hamburgers','햄버거']];
const NOUN=[['apple','사과','개'],['egg','달걀','개'],['orange','오렌지','개'],['umbrella','우산','개'],['eraser','지우개','개'],['onion','양파','개'],['elephant','코끼리','마리'],['owl','부엉이','마리'],['ant','개미','마리'],['octopus','문어','마리'],['book','책','권'],['pencil','연필','자루'],['bag','가방','개'],['ball','공','개'],['cat','고양이','마리'],['dog','개','마리'],['rabbit','토끼','마리'],['bird','새','마리'],['robot','로봇','개'],['doll','인형','개'],['cup','컵','개'],['box','상자','개'],['hat','모자','개'],['watch','손목시계','개'],['kite','연','개'],['desk','책상','개'],['chair','의자','개'],['bike','자전거','대'],['car','자동차','대'],['flower','꽃','송이']];
function plural(n){if(n==='box'||n==='watch'||n==='bus')return n+'es';if(n==='octopus')return 'octopuses';return n+'s';}
const NUMS=[['two','두'],['three','세'],['four','네'],['five','다섯'],['six','여섯']];
const THING=[['ball','공'],['cat','고양이'],['book','책'],['bag','가방'],['dog','개'],['pencil','연필'],['doll','인형'],['cup','컵'],['phone','전화기'],['key','열쇠']];
const SPOT=[['box','상자'],['table','식탁'],['bed','침대'],['chair','의자'],['desk','책상'],['sofa','소파'],['tree','나무']];
const PREP=[['in','안에'],['on','위에'],['under','아래에'],['next to','옆에']];
const ROOM=[['the kitchen','부엌'],['the classroom','교실'],['the park','공원'],['my room','내 방'],['the garden','정원'],['the library','도서관']];
const CMP=[['tall','taller','tallest','키가 더 커요','키가 가장 커요'],['fast','faster','fastest','더 빨라요','가장 빨라요'],['strong','stronger','strongest','더 힘이 세요','가장 힘이 세요'],['old','older','oldest','나이가 더 많아요','나이가 가장 많아요'],['young','younger','youngest','더 어려요','가장 어려요'],['short','shorter','shortest','키가 더 작아요','키가 가장 작아요'],['smart','smarter','smartest','더 똑똑해요','가장 똑똑해요'],['busy','busier','busiest','더 바빠요','가장 바빠요'],['funny','funnier','funniest','더 재미있어요','가장 재미있어요'],['kind','kinder','kindest','더 친절해요','가장 친절해요']];
const NAMES=[['Minsu','민수'],['Jina','지나'],['Tom','톰'],['Amy','에이미'],['Junho','준호'],['Sora','소라'],['Ben','벤'],['Lily','릴리'],['Hana','하나'],['Kevin','케빈'],['Yuna','유나'],['Mike','마이크']];
const PERSON=[['boy','소년'],['girl','소녀'],['man','남자'],['woman','여자'],['student','학생'],['child','아이']];
const PASSIVE=[[15,'The cake','그 케이크{은}'],[13,'The letter','그 편지{은}'],[9,'The picture','그 그림{은}'],[11,'The room','그 방{은}'],[38,'The sandcastle','그 모래성{은}'],[26,'The window','그 창문{은}'],[27,'The door','그 문{은}'],[25,'The tree','그 나무{은}'],[20,'The photo','그 사진{은}'],[37,'The key','그 열쇠{은}']];
const JOB=[['a bird','새'],['a doctor','의사'],['a teacher','선생님'],['a singer','가수'],['a pilot','조종사'],['a king','왕'],['a cook','요리사'],['a scientist','과학자'],['an artist','화가'],['a fish','물고기']];
const SO=[['tired','피곤해서'],['sick','아파서'],['busy','바빠서'],['sleepy','졸려서'],['hungry','배가 고파서'],['nervous','긴장해서']];
const ITIS=[['easy','쉬워요'],['hard','어려워요'],['fun','재미있어요'],['important','중요해요'],['exciting','신나요']];
function koObj(v){return fill(v[4]);}
function wrongSet(target,cands){const out=[];for(const c of cands)if(c&&c!==target&&!out.includes(c))out.push(c);return out.length>=3?out.slice(0,3):null;}
/* 문장 틀 */
function families(){const F=[];const P=(lvl,rule,en,ko,target,wrong)=>{const w=wrongSet(target,wrong);if(w&&en.includes(target))F.push({lvl,en,ko:fill(ko),target,wrong:w,rule});};
 for(const s of SUBJ)for(const a of ADJ){const b=be(s[2]);P(1,(s[0]==='I'?'I':s[2]==='3'?'3인칭 단수 주어':'You·We·They 같은 주어')+' 뒤 be동사는 '+b+'예요.',s[0]+' '+b+' '+a[0]+'.',s[1]+' '+a[1]+'.',b,['am','is','are','be'].filter(x=>x!==b));}
 for(const s of SUBJ)for(const f of FOOD){const v=s[2]==='3'?'likes':'like';P(1,s[2]==='3'?'3인칭 단수 주어 뒤에는 likes를 써요.':'주어가 3인칭 단수가 아니면 like를 써요.',s[0]+' '+v+' '+f[0]+'.',s[1]+' '+f[1]+'{을} 좋아해요.',v,v==='likes'?['like','liking','to like']:['likes','liking','to like']);}
 for(const n of NOUN){const a=/^[aeiou]/.test(n[0])?'an':'a';P(1,'모음 소리로 시작하는 낱말 앞에는 an, 나머지는 a를 써요.','This is '+a+' '+n[0]+'.','이것은 '+n[1]+'{이에요}.',a,[a==='a'?'an':'a','two','some']);}
 for(const s of SUBJ)for(const n of NOUN)for(const k of NUMS){const pl=plural(n[0]);P(1,'둘 이상일 때는 낱말 끝에 -s/-es를 붙여 복수형으로 써요.',s[0]+' '+have(s[2])+' '+k[0]+' '+pl+'.',s[1]+' '+n[1]+' '+k[1]+' '+n[2]+'{을} 가지고 있어요.',pl,[n[0],'a '+n[0],'one '+n[0]]);}
 for(const s of SUBJ)for(const v of V){P(2,'can 뒤에는 동사원형을 써요.',s[0]+' can '+v[0]+' '+v[3]+'.',s[1]+' '+koObj(v)+' '+v[8]+' 수 있어요.',v[0],[s3(v[0]),ing(v[0]),v[1]]);P(2,'지금 하고 있는 일은 be동사 + -ing로 나타내요.',s[0]+' '+be(s[2])+' '+ing(v[0])+' '+v[3]+' now.',s[1]+' 지금 '+koObj(v)+' '+v[7]+'고 있어요.',ing(v[0]),[v[0],s3(v[0]),v[1]]);}
 for(const t of THING)for(const sp of SPOT)for(const p of PREP){if(t[0]===sp[0])continue;P(2,p[0]+'는 \''+p[1].replace('에','')+'\'의 뜻이에요.','The '+t[0]+' is '+p[0]+' the '+sp[0]+'.',t[1]+'{이} '+sp[1]+' '+p[1]+' 있어요.',p[0],PREP.map(x=>x[0]).filter(x=>x!==p[0]));}
 for(const s of SUBJ.filter(x=>x[0]!=='I'))for(const f of FOOD){const d=s[2]==='3'?'Does':'Do';const subj=s[0]==='My sister'||s[0]==='My friends'?s[0].replace('My','your'):s[0];P(2,'3인칭 단수 주어의 일반동사 의문문은 Does, 나머지는 Do로 시작해요.',d+' '+subj+' like '+f[0]+'?',(s[0]==='My sister'?'네 여동생{은}':s[0]==='My friends'?'네 친구들{은}':s[1])+' '+f[1]+'{을} 좋아하나요?',d,[d==='Do'?'Does':'Do','Is','Are']);}
 for(const n of NOUN)for(const r of ROOM){P(2,'하나일 때는 There is, 둘 이상일 때는 There are를 써요.','There is '+(/^[aeiou]/.test(n[0])?'an':'a')+' '+n[0]+' in '+r[0]+'.',r[1]+'에 '+n[1]+'{이} 있어요.','is',['are','am','be']);for(const k of NUMS.slice(0,3))P(2,'하나일 때는 There is, 둘 이상일 때는 There are를 써요.','There are '+k[0]+' '+plural(n[0])+' in '+r[0]+'.',r[1]+'에 '+n[1]+'{이} '+k[1]+' '+n[2]+' 있어요.','are',['is','am','be']);}
 for(const s of SUBJ)for(const v of V){if(v[1]!==v[0])P(3,'지난 일(yesterday)은 동사의 과거형으로 써요.',s[0]+' '+v[1]+' '+v[3]+' yesterday.',s[1]+' 어제 '+koObj(v)+' '+v[6]+'.',v[1],[v[0],s3(v[0]),ing(v[0])]);P(3,'will 뒤에는 동사원형을 써요.',s[0]+' will '+v[0]+' '+v[3]+' tomorrow.',s[1]+' 내일 '+koObj(v)+' '+v[8]+' 거예요.',v[0],[s3(v[0]),ing(v[0]),v[1]]);P(3,'want to 뒤에는 동사원형을 써요.',s[0]+' '+(s[2]==='3'?'wants':'want')+' to '+v[0]+' '+v[3]+'.',s[1]+' '+koObj(v)+' '+v[7]+'고 싶어요.',v[0],[s3(v[0]),ing(v[0]),v[1]]);}
 for(const a of NAMES)for(const b2 of NAMES)for(const c of CMP){if(a===b2)continue;P(3,'두 사람을 비교할 때는 비교급(-er) + than을 써요.',a[0]+' is '+c[1]+' than '+b2[0]+'.',fill(a[1]+'{은} '+b2[1]+'보다 '+c[3]+'.'),c[1],[c[0],c[2],'more '+c[0]]);}
 for(const a of NAMES)for(const c of CMP)P(4,'셋 이상 중 가장 ~할 때는 the + 최상급(-est)을 써요.',a[0]+' is the '+c[2]+' in my class.',fill(a[1]+'{은} 우리 반에서 '+c[4]+'.'),c[2],[c[0],c[1],'most '+c[0]]);
 for(const s of SUBJ)for(const v of V){if(v[2]!==v[0])P(4,'have/has + 과거분사로 이미 한 일을 나타내요.',s[0]+' '+have(s[2])+' already '+v[2]+' '+v[3]+'.',s[1]+' 벌써 '+koObj(v)+' '+v[6]+'.',v[2],[v[0],ing(v[0]),s3(v[0])]);P(4,'enjoy 뒤에는 동명사(-ing)를 써요.',s[0]+' '+(s[2]==='3'?'enjoys':'enjoy')+' '+ing(v[0])+' '+v[3]+'.',s[1]+' '+koObj(v)+' '+dropL(v[7])+'는 것을 즐겨요.',ing(v[0]),[v[0],'to '+v[0],v[1]]);}
 for(const p of PERSON)for(const v of V)P(5,'사람을 꾸며 줄 때는 관계대명사 who를 써요.','I know a '+p[0]+' who '+s3(v[0])+' '+v[3]+' every day.','나는 매일 '+koObj(v)+' '+dropL(v[7])+'는 '+p[1]+'{을} 알아요.','who',['which','what','where']);
 for(const x of PASSIVE)for(const n of NAMES){const v=V[x[0]];P(5,'수동태는 be동사 + 과거분사(+ by 행위자)로 써요.',x[1]+' was '+v[2]+' by '+n[0]+'.',x[2]+' '+n[1]+'{이} '+v[6]+'.',v[2],[v[0],ing(v[0]),s3(v[0])]);}
 for(const j of JOB)for(const v of V)P(6,'현재 사실과 반대되는 가정은 If + 주어 + were, 주어 + would + 동사원형으로 써요.','If I were '+j[0]+', I would '+v[0]+' '+v[3]+'.','내가 '+j[1]+'{이라면} '+koObj(v)+' '+v[8]+' 텐데요.','were',['am','is','be']);
 for(const s of SUBJ)for(const a of SO)for(const v of V.slice(0,14)){const pr={'1':'I','2':'you','p':'they','3':'he'}[s[2]];if(s[2]==='3'&&/She|Jina|Amy|Sora|sister/.test(s[0]))continue;P(6,'so + 형용사 + that 주어 can\'t ~는 \'너무 ~해서 …할 수 없다\'는 뜻이에요.',s[0]+' '+(s[2]==='1'?'was':s[2]==='3'?'was':'were')+' so '+a[0]+' that '+(pr)+' couldn\'t '+v[0]+' '+v[3]+'.',s[1]+' 너무 '+a[1]+' '+koObj(v)+' '+v[8]+' 수 없었어요.','so',['such','too','very']);}
 for(const t of ITIS)for(const v of V)P(6,'It is + 형용사 + to + 동사원형은 \'~하는 것은 …하다\'는 뜻이에요(가주어 It).','It is '+t[0]+' to '+v[0]+' '+v[3]+'.',koObj(v)+' '+dropL(v[7])+'는 것은 '+t[1]+'.','to',['for','of','at']);
 for(const s of SUBJ)for(const v of V)P(6,'과거부터 지금까지 계속하고 있는 일은 have/has been + -ing로 써요.',s[0]+' '+have(s[2])+' been '+ing(v[0])+' '+v[3]+' for two hours.',s[1]+' 두 시간째 '+koObj(v)+' '+v[7]+'고 있어요.','been',['being','be','was']);
 return F;}
function levelOf(key){const m=key.match(/^([emh])(\d)-(\d)$/);const g=+m[2];return m[1]==='e'?(g<=2?1:g<=4?2:3):m[1]==='m'?(g===1?4:5):6;}
/* 지문 만들기 */
const CITY=[['Seoul','서울'],['Busan','부산'],['Jeju','제주'],['Daegu','대구'],['Incheon','인천'],['Gwangju','광주'],['London','런던'],['Sydney','시드니'],['Toronto','토론토'],['Paris','파리']];
const PET=[['a cat','고양이'],['a dog','개'],['a rabbit','토끼'],['a bird','새'],['a turtle','거북'],['a hamster','햄스터']];
const DAY=[['Monday','월요일'],['Tuesday','화요일'],['Wednesday','수요일'],['Thursday','목요일'],['Friday','금요일'],['Saturday','토요일'],['Sunday','일요일']];
const GIRL=new Set(['Jina','Amy','Sora','Lily','Hana','Yuna']);
function readings(key,lvl,n){const r=rng('read|'+key),out=[];let guard=0;const seen=new Set();
 while(out.length<n&&guard++<n*5){const nm=pick(NAMES,r),age=8+Math.floor(r()*8),city=pick(CITY,r),food=pick(FOOD,r),pet=pick(PET,r),day=pick(DAY,r),fr=pick(NAMES.filter(x=>x!==nm),r);const vs=shuffle(V,r).slice(0,3);const he=GIRL.has(nm[0])?'She':'He',he2=he.toLowerCase();
  const id=nm[0]+age+city[0]+food[0]+pet[0]+day[0]+fr[0]+vs.map(v=>v[3]).join();if(seen.has(id))continue;seen.add(id);
  const W=(arr,ans,f)=>{const o=shuffle(arr.map(f).filter(x=>x!==ans),r);return Array.from(new Set(o)).slice(0,3);};
  let passage,qs=[];
  if(lvl<=2){passage='Hi, I am '+nm[0]+'. I am '+age+' years old. I live in '+city[0]+'. I like '+food[0]+'. I have '+pet[0]+'. I can '+vs[0][0]+' '+vs[0][3]+'.';
   qs=[['글쓴이의 이름은?',nm[1],W(NAMES,nm[1],x=>x[1])],['글쓴이는 몇 살인가요?',age+'살',[age-1,age+1,age+2].map(x=>x+'살')],['글쓴이가 사는 곳은?',city[1],W(CITY,city[1],x=>x[1])],['글쓴이가 좋아하는 음식은?',food[1],W(FOOD,food[1],x=>x[1])],['글쓴이가 기르는 동물은?',pet[1],W(PET,pet[1],x=>x[1])],['글쓴이가 할 수 있는 것은?',koObj(vs[0])+' '+vs[0][5],W(V,koObj(vs[0])+' '+vs[0][5],v=>koObj(v)+' '+v[5])]];}
  else{passage=nm[0]+' lives in '+city[0]+'. '+he+' likes '+food[0]+'. Every '+day[0]+', '+he2+' '+s3(vs[0][0])+' '+vs[0][3]+'. Yesterday, '+he2+' '+vs[1][1]+' '+vs[1][3]+' with '+fr[0]+'. Tomorrow, '+he2+' will '+vs[2][0]+' '+vs[2][3]+'.';
   const a0=koObj(vs[0])+' '+vs[0][5],a1=koObj(vs[1])+' '+vs[1][6],a2=koObj(vs[2])+' '+vs[2][8]+' 거예요';
   qs=[[fill(nm[1]+'{이}')+' 사는 곳은?',city[1],W(CITY,city[1],x=>x[1])],[fill(nm[1]+'{이}')+' 좋아하는 음식은?',food[1],W(FOOD,food[1],x=>x[1])],['매주 '+day[1]+'마다 '+fill(nm[1]+'{이}')+' 하는 일은?',a0,W(V,a0,v=>koObj(v)+' '+v[5])],['어제 '+fill(nm[1]+'{이}')+' 한 일은?',a1,W(V,a1,v=>koObj(v)+' '+v[6])],['어제 '+fill(nm[1]+'{이}')+' 함께한 사람은?',fr[1],W(NAMES.filter(x=>x!==nm),fr[1],x=>x[1])],['내일 '+fill(nm[1]+'{이}')+' 할 일은?',a2,W(V,a2,v=>koObj(v)+' '+v[8]+' 거예요')],[fill(nm[1]+'{이}')+' 무엇을 하는 요일은?',day[1],W(DAY,day[1],x=>x[1])]];
   if(lvl>=5){passage+=' '+(GIRL.has(fr[0])?'She':'He')+' is '+nm[0]+'\'s best friend, and they have known each other since they were '+(age-3)+'.';qs.push([fill(nm[1]+'{과}')+' '+fill(fr[1]+'{이}')+' 서로 알게 된 나이는?',(age-3)+'살',[age-2,age-4,age].map(x=>x+'살')]);}}
  for(const [prompt,answer,wrong] of qs){if(wrong.length<3)continue;out.push({prompt,answer,wrong:wrong.slice(0,3),explanation:'지문: '+passage,passage});if(out.length>=n)break;}}
 return out;}
function listenings(key,n){const r=rng('listen|'+key),out=[];const seen=new Set();let g=0;
 while(out.length<n&&g++<n*6){const t=Math.floor(r()*3),nm=pick(NAMES,r);let script,prompt,answer,wrong;
  if(t===0){const v=pick(V,r),d=pick(DAY,r);script=[{speaker:'A',text:'Hi '+nm[0]+', what are you going to do this '+d[0]+'?'},{speaker:'B',text:'I am going to '+v[0]+' '+v[3]+'.'}];prompt='B가 이번 '+d[1]+'에 할 일은?';answer=koObj(v)+' '+v[8]+' 거예요';wrong=shuffle(V.filter(x=>x!==v),r).slice(0,3).map(x=>koObj(x)+' '+x[8]+' 거예요');}
  else if(t===1){const th=pick(THING,r),sp=pick(SPOT,r),p=pick(PREP,r);script=[{speaker:'A',text:'Mom, where is my '+th[0]+'?'},{speaker:'B',text:'It is '+p[0]+' the '+sp[0]+'.'}];prompt=fill(th[1]+'{은}')+' 어디에 있나요?';answer=sp[1]+' '+p[1];wrong=shuffle(PREP.filter(x=>x!==p),r).map(x=>sp[1]+' '+x[1]).slice(0,2).concat([pick(SPOT.filter(x=>x!==sp),r)[1]+' '+p[1]]);}
  else{const v=pick(V,r),h=1+Math.floor(r()*11);script=[{speaker:'A',text:'What time do you '+v[0]+' '+v[3]+'?'},{speaker:'B',text:'I usually '+v[0]+' '+v[3]+' at '+h+' o\'clock.'}];prompt='B가 '+koObj(v)+' '+v[7].replace(/하$/,'하')+'는 시각은?';prompt='B가 보통 '+koObj(v)+' '+dropL(v[7])+'는 시각은?';answer=h+'시';wrong=[h+1,h+2,h===1?12:h-1].map(x=>x+'시');}
  const id=JSON.stringify(script);if(seen.has(id))continue;seen.add(id);out.push({script,prompt,answer,wrong,explanation:script.map(x=>x.speaker+': '+x.text).join(' / ')});}
 return out;}
const FAM=families();
D.forEach((c,ci)=>{if(!c||!/^[emh]\d-\d$/.test(c.key)||!Array.isArray(c.vocab))return;const lvl=levelOf(c.key),r=rng('v|'+c.key);
 /* 단어 300개 */
 const bank=WB[c.key[0]]||WB.e,lower=c.key[0]==='h'?WB.m:c.key[0]==='m'?WB.e:[];const off=(ci*37)%bank.length;const order=bank.slice(off).concat(bank.slice(0,off)).concat(lower);
 const en=new Set(c.vocab.map(v=>v[0].toLowerCase())),ko=new Set(c.vocab.map(v=>v[1]));
 for(const v of order){if(c.vocab.length>=TARGET)break;const e=v[0].toLowerCase(),k=v[1].replace(/\(.*\)/,'').trim();if(en.has(e)||ko.has(v[1])||ko.has(k))continue;c.vocab.push([v[0],v[1]]);en.add(e);ko.add(v[1]);ko.add(k);}
 /* 문장 300개: 이 학기 수준과 그 아래 수준, 지금 수준을 먼저 */
 const pe=new Set(c.patterns.map(p=>p.en)),pk=new Set(c.patterns.map(p=>p.ko));
 const mine=shuffle(FAM.filter(f=>f.lvl===lvl),r),low=shuffle(FAM.filter(f=>f.lvl<lvl),r);
 const take=[];const quota=Math.round(TARGET*(lvl===1?1:.65));
 for(const f of mine){if(take.length>=quota)break;take.push(f);}for(const f of low.concat(mine)){if(take.length>=TARGET)break;if(!take.includes(f))take.push(f);}
 for(const f of shuffle(take,r)){if(c.patterns.length>=TARGET)break;if(pe.has(f.en)||pk.has(f.ko))continue;c.patterns.push({en:f.en,ko:f.ko,target:f.target,wrong:f.wrong,rule:f.rule});pe.add(f.en);pk.add(f.ko);}
 /* 독해 300개 */
 if(c.reading.length<TARGET)c.reading.push(...readings(c.key,lvl,TARGET-c.reading.length));
 if(Array.isArray(c.listening)&&c.listening.length<TARGET)c.listening.push(...listenings(c.key,TARGET-c.listening.length));
});
window.WonkiEnglish108={families:FAM.length};
})();
