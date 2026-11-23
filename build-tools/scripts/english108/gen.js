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
