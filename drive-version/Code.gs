// Use this ONLY in the separate Drive-media project, not the member/sync project.
const DRIVE_FOLDER_ID = '10dbk7-IOghD-lpEfT5__ZrboHEQ87j5C';
const SITE_ORIGIN = 'https://hinsrolin.neocities.org';
const ASSET_PATTERN = /^[a-f0-9]{64}\.(png|jpg|webp|mp3)$/;
// Used by the optional diagnostic endpoint only; new assets are discovered automatically.
const CURRENT_EXPECTED_ASSETS = ["46a16a12a6d98fec13f46a26f8abc107b69068e00681da7d9f46ed5e1ac34ae4.png","cd0bfba760c53951a4fdc38684434d628f0fb4170d3d2614c39a23d48341cce7.jpg","d53f92dc6dcbe475b4fd4a6be78f332fde128a55bb693730ee05d6a4d59cabae.jpg","a35266c0a887ce45752a3ce2eaf715e260a1572d2dea6b28bd6fde049b4e2323.jpg","ee87c3f19ea5e78b06e8e85cf1fe83119de63c1b8df16e39a7f43952b624511b.jpg","310cf3143f1af8c7e4fb46099e1116ff99c3216e41ed98330a1caf10a12f792d.jpg","ba520ca008d3a3008e2992b5660cf5e4e9a4b03a73a2f5ed48c7efcf62254e4d.jpg","577dbeaff51080c4dc8599d0654137a6189462a4634a4b68b95c2d92f250861f.jpg","296c7d596ad90140e867db54a39b7d5db2a51f4f186d3ff71925d1ba1aa9d9db.jpg","a60820c98eb68083f5f13c4e023654a6327d0c815d6bd1ac713553214a968332.jpg","5634f983505f33dab0694c0785be74833c791263f894b6738dda8af0c48a132a.jpg","d64f437ca6bf4d0eecb54108df5ca66e70c5dbea22e822abc7ee879cc4fd7333.jpg","b97b25e5521369b4099aadeb1371c0d8317f12b51926bc08460a96930cbc0628.jpg","66945c0a9235f36dbfb46dd6da09336e78c6263b46924db3b4f90cbe3f2e31e1.jpg","1ba165ad8a6d37cc2197779ab1e903109cc3460c127485352ec3bff395193b23.jpg","ea82c7238b9b368267bcf7fce337c03de7e932e5016ecc876d315db7f43fa4f5.jpg","558347e7c9102e9fbf377a7e84314a4d15f1706c45636c89877bae8bc89b0a95.png","60aa8393d4f496f9b03dd58549ed6214d210a3b729db638b9c7d0bcd0af8ce08.png","ca8249e08970420b922fdd2983b311c1f4cb5761d57874cc232c535e288cbabf.webp","2e4ff46b77726eb00843dd6cf3bf085686b51daaf11ff349b944f9f0cb8e5704.webp","3a7fc48fef205ae35e9d3cb56d5b7133847a6440e85f47652dccc8e70eafbea9.webp","3b5914c5b531a655d81c4d30fb049849b03d8454fb713197dc5e43964e91217e.webp","e690538285231f6684d0cf62cedbe175ea6dd490f2ecd746e1fa7c35e52c4cfb.webp","59a14e06fb7f78d95f230c16f481e1da4f55654a1920f04815161b2455736d14.webp","a29c44ec9f3f46d8c25308497b4b6f3bd631cf65743ee66ec4c269ef90b3dfb1.jpg","11df4dd9a0aabee098148f1dc16c07a45075a9bc0f8e5858f569ebe60db3a251.png","d691a419909ade61086749bb8851c67866b535602b2574dda15fc25a1e66a245.png","3d91b80f6bd6da31a24d1245cc5a86748c043d846a8ace73d8d5a723fd673a62.png","24698147508320a548ab7b7bb7d1215cb600acf985ac36b9c417135c9a058b4d.png","8016d040020d36abf8dab071895da1784487257890e2563390429a0d76cc9ce4.webp","ad59062e310edfbe5470ebfd8c21ea0bcbe26c83d87a90298f6b57793c6e7600.webp","9ebf4d17e440a35bfbf9f14a8903a553f3c420ee0b927e6ebb6a0eaff6f6f9bb.png","f5924296dfbbff66e2d6d520437d55127dd1b981533306c953fb0ff925f47b92.jpg","c608e70a8d0a5839150192b3064c123fb3b156ccf99d82743023cb881f23f08f.png","ca7bf8da6a9aecf69b5160696c987ce3faadea6bcefa9b55a0436594c41349e4.png","0a4f5664744f211d4a63c56e11540008859e3892297c906683ef405f9a59b48f.png","b5b4dce00e64a7cab756e6060f72749cd6070dfb4f28d4e4fcdbc446bd21b3cf.jpg","fe11dde4b7997686e16800b4755743e1c832835ca5cfab59137bcda013a3bc8c.png","bfb6b98987d66ee6f7e835dfa60a385b6cdec0297f6ed1a6d8289df5229972a5.png","6e8746edcedc5a49cc6e9fb327c6f307dfcdaeda9ab67dd024ffb0c9e024507b.png","aeea76fc6da5e45d24a458d531576b80a8fdf015f0b5e50dc19bc7f5b8b94bc7.png","a7d913c31b9a9bd953082ac94d5c8121e942f42dff677ae44b4ed3a108d41b02.png","8f0336784fc04f8f6b1b5de5d0b17d56c7edd2c1cac2e9bf7930fc1e4a9f9962.png","520a07ae4c16784f60603ea2b028da6dd8196a6fdf227fe32f9ef9a4b950340d.jpg","4910e190a039fa4d955ae561890da72ceda9d44ed28cb6590c31365e4996a755.jpg","925bd6a85c5d593e485a334a4c452731cc59344c21d151ebe7d51394b3227fd3.jpg","224598537820091c9b8e572a741a893c5cbf849ecea06b51554f5497fc946ce3.png","eb4cfdf0d4934836491ce56be9a2804ef510eaaf1fcc5ab8f1c7abf1ed8f1196.png","1315920f2c5b28359a97a7ba46cf58e9c9c54f4352ba83ba49f28c005b6ffe01.jpg","627bc3201380392e816e712649e72ecb0a1da9c90a602924545bd9d8cd8495a7.png","4dd2b6099ce9e40e43630ba5ac7ef137fb7a3372857952979e82c9efa3c7d030.png","66a52507365951f30ce572e9f13fb04cc84782221f8d0605fe0d2f2c0b8306fe.jpg","a6d7a5728397ebe8172aa02fd2f611fe1c9e7320270949b2618a84a804f24fb0.mp3","6a1aa7d0605a47734231ceb09ceab025f45f0532c7f36dd1c6145c7d7e929581.mp3","9a410d5fa978988fff76af92969a4d937544a6d9dfe9e4e5872eefb0452c841e.mp3","62ae11516a22c78ba797baf049c1c1fb4456a038bf95ec4c74625f8e797fdf32.mp3","c1b50b84e7697d5a821663a801ceb1020620eead6199d1966568edef24c73e52.mp3","7bd16193a7c13f2f4a5931a309b44c32e9cdfc4c4d645976af532c0bfad8519e.mp3","cbed6f7acab8a9d46ec22cc8561cd8ca52bd7ad89c1ff1212912d9d558413245.mp3","92d48addee41e15765b7b5ec6d0f037fe125ece994f3d708ff503c69711016a9.mp3","19ee2930f732c2f3fcd56e4ba01737a626374ad16420cceeb38abbf24ba2f5c7.mp3","3b1c4dc4327b4dae5126cfa959a2f100e93bb13f7dd3c4f79bd5e641aeaaef09.mp3","db8a810bbef215846223b2f530b65d5e87d8c81575c6828e26a9452c5476435d.mp3","589e366c907a38aa37323b9bf16f3eb9ac1f3090bcba3fffaba2da9122316b2c.mp3","ed7d1984439d74ab2ba89c266da572edf809ad954e18a3ef1561a0887b304cee.mp3","1cf7f7945a5fa35440efd29e01ada7a4b7461256b6d6264fb394b3fa8e1e2443.mp3","dc239efa78d6b781adbc96226f62adb7b39a336769d5079bb44e99b84bc96a1f.mp3","372b57a42ddce7cfd94431b4e0b6da0feef6dbaf4effd0015087956c963a52bd.mp3","daa28f7a55ec754f4ace237083e177444eb504c9bcd3b0de2fe0e8c0f33f05c6.mp3","4441482a26c727fa131730232b4b701bdf06278350faf3ccf263b16605617ef1.mp3","3936c08aa2de968da24832bc7dc2da873c61ebb8dec0c9e19853997b9e172326.mp3","ccca7223689e5225dfb6d1f78192f0862de04b5af8109758711ccd9343dc91f4.mp3","5e5e3f8cc4433871572dfa5ae0f0e3a6f203fdd9150e847f9265a10400785b52.mp3","59356a6c437986a04292116d4a1296236d6b2b74f64e7c5218adf0f8b2cbadcc.mp3","72b3a80f8f1707fabe25e96edabf5f069e009d228bc67d23eaba3216a2d480d9.mp3","14b2b41838c621779d2172912ea994143cfaceffe630d04f09d8befa6d13a675.mp3","ce64395e193c830a40db985c8832ace25597803b91063e408afbd1d44f26f85b.mp3"];
function mediaCache_(){try{return CacheService.getScriptCache();}catch(_){return null;}}
function scanMedia_(){
 const queue=[DriveApp.getFolderById(DRIVE_FOLDER_ID)],seen={},files={},cacheValues={};
 let folders=0;
 while(queue.length){
  const folder=queue.shift(),id=folder.getId();if(seen[id])continue;
  seen[id]=true;if(++folders>250)throw new Error('자료 폴더가 250개를 초과했습니다. 더 좁은 자료 폴더를 설정해 주세요.');
  const it=folder.getFiles();while(it.hasNext()){
   const file=it.next(),name=file.getName();
   if(ASSET_PATTERN.test(name)&&!files[name]){files[name]=file;cacheValues[DRIVE_FOLDER_ID+':'+name]=file.getId();}
  }
  const children=folder.getFolders();while(children.hasNext())queue.push(children.next());
 }
 const cache=mediaCache_();if(cache){try{cache.putAll(cacheValues,600);}catch(_){}}
 return {files:files,folderCount:folders};
}
function findMedia_(name){
 const cache=mediaCache_(),key=DRIVE_FOLDER_ID+':'+name;
 if(cache){try{const id=cache.get(key);if(id){const file=DriveApp.getFileById(id);if(file.getName()===name)return file;cache.remove(key);}}catch(_){}}
 const scan=scanMedia_();return scan.files[name]||null;
}
function doGet(e){
 const p=(e&&e.parameter)||{};
 if(p.action==='health'){
  let result;
  try{const scan=scanMedia_(),names=Object.keys(scan.files);result={status:'ok',folderCount:scan.folderCount,assetCount:names.length,imageCount:names.filter(n=>!n.endsWith('.mp3')).length,musicCount:names.filter(n=>n.endsWith('.mp3')).length,missingAssets:CURRENT_EXPECTED_ASSETS.filter(n=>!scan.files[n])};}
  catch(err){result={status:'error',message:String(err.message||err)};}
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
 }
 const nonce=String(p.nonce||''),asset=String(p.asset||'');
 const result={type:'wonki-drive-asset',nonce:nonce,asset:asset};
 try{
  if(!/^[a-f0-9-]{20,80}$/i.test(nonce))throw new Error('Invalid request.');
  if(!ASSET_PATTERN.test(asset))throw new Error('Invalid asset.');
  const file=findMedia_(asset);
  if(!file)throw new Error('Asset not found in the configured folder or its subfolders: '+asset);
  if(file.getSize()>16000000)throw new Error('Asset exceeds supported size.');
  result.base64=Utilities.base64Encode(file.getBlob().getBytes());
 }catch(err){result.error=String(err.message||err);}
 const json=JSON.stringify(result).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>window.top.postMessage('+json+','+JSON.stringify(SITE_ORIGIN)+');</script>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
