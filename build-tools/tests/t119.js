// 119차: 117차 + ② 오프닝 영상 받기 주소 (node tests/t117.js 결과.html 사진접두어)
const {chromium}=require('playwright');
(async()=>{const [,,file,pre]=process.argv;const b=await chromium.launch();const errs=[];let bad=0;
const ok=(c,m)=>{console.log((c?'OK ':'FAIL ')+m);if(!c)bad++;};
for(const [role,vw] of [['visitor',{width:1200,height:900}],['member',{width:390,height:800}],['owner',{width:1200,height:900}]]){
 const p=await b.newPage({viewport:vw});p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());
 await p.addInitScript(r=>{try{if(r==='member')sessionStorage.setItem('wonkiLand_general_session_v1',JSON.stringify({token:'t',nickname:'시험'}));if(r==='owner')localStorage.setItem('wk65_admin_device','1');}catch(_){}},role);
 await p.goto('file://'+file,{waitUntil:'load',timeout:120000});await p.waitForTimeout(1200);
 await p.evaluate(()=>{const u=document.getElementById('wkUpdatePoster');if(u)u.hidden=true;});
 await p.evaluate(()=>window.wk116Fighters.open());await p.waitForTimeout(200);
 const vis=()=>p.evaluate(()=>[...document.querySelectorAll('#wk116Fighters .f-lock')].filter(n=>!n.hidden).map(n=>n.dataset.v).join(','));
 const href=()=>p.evaluate(()=>document.querySelector('#wk116Fighters .f-dl').getAttribute('href'));
 if(role==='visitor'){ok(await vis()==='visitor',role+' 로그인 안내만 보임');ok(!(await href()),role+' 받기 주소 없음');
  await p.screenshot({path:pre+'_visitor.png'});
  await p.click('#wk116Fighters .f-login');await p.waitForTimeout(400);
  ok(await p.evaluate(()=>document.getElementById('wk116Fighters').hidden),'로그인 누르면 창 닫힘');
  ok(await p.evaluate(()=>{const m=document.getElementById('wkGeneralAccountModal');return !!m&&(m.classList.contains('open')||getComputedStyle(m).display!=='none')}),'일반회원 로그인 창 열림');
 }else{ok(await vis()==='pw',role+' 비밀번호 칸');
  await p.fill('#wk116Fighters .f-pw','1234');await p.press('#wk116Fighters .f-pw','Enter');await p.waitForTimeout(150);
  ok(await vis()==='pw'&&!(await href()),role+' 틀린 비밀번호는 막힘: '+await p.textContent('#wk116Fighters .f-err'));
  await p.screenshot({path:pre+'_'+role+'_pw.png'});
  await p.fill('#wk116Fighters .f-pw','4288');await p.click('#wk116Fighters form .f-go');await p.waitForTimeout(150);
  const h=await href();const h2=await p.evaluate(()=>document.querySelector('#wk116Fighters .f-op').getAttribute('href'));ok(/11QULVDk4mCKFnTGIfdR6uJnLtxp4Sq5y/.test(h2||''),role+' 오프닝 주소 '+h2);ok(await vis()==='ok'&&/^https:\/\/drive\.google\.com\/file\/d\/1T14cUvXahPmucf3IrHwHUskoUJDMQGT9\//.test(h),role+' 4288 → 받기 주소 '+h);
  await p.screenshot({path:pre+'_'+role+'_ok.png'});
  await p.keyboard.press('Escape');await p.evaluate(()=>window.wk116Fighters.open());await p.waitForTimeout(100);
  ok(await vis()==='pw'&&!(await href())&&!(await p.evaluate(()=>document.querySelector('#wk116Fighters .f-op').getAttribute('href'))),role+' 다시 열면 비밀번호 다시 물음');}
 await p.close();}
ok(errs.length===0,'페이지 오류 '+JSON.stringify(errs));await b.close();process.exit(bad?1:0);})();
