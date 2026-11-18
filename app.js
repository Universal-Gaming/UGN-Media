/* UGN Media — static GitHub Pages application. No API keys or backend required. */
const CHANNEL = 'https://www.youtube.com/@_UniversalGaming';
const CHANNEL_ID = 'UCSZKqTk0dxDgN_krIsSa16Q';
const UPLOADS_ID = 'UU' + CHANNEL_ID.slice(2);
const $ = id => document.getElementById(id);
const state = {videos: [], filter:'all', current: null, library:false, caseOpen:false, screenOpen:false, addOpen:false, power:true, lamp:true, blinds:false, sound:false, scene:null};
const defaultDisc = {id:'uploads', title:'The Universal Gaming Video Archive', description:'All the latest adventures from the official Universal Gaming YouTube channel. Pick a title and press play.', published:'CHANNEL UPLOADS', playlistId:UPLOADS_ID, kind:'CHANNEL COLLECTION'};
let previousFocus = null;
let toastTimer = null;
const safeText = value => String(value ?? '').slice(0,500);
const isRealId = id => /^[\w-]{11}$/.test(id || '');
const isLive = v => ['LIVE REPLAY','PERSONAL LIVE'].includes(v?.kind);
const MAX_LIVES = 10;
const safeStorage = {get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2700)}
function setAria(id,open){const el=$(id);el.classList.toggle('is-open',open);el.setAttribute('aria-hidden',String(!open))}
function focusWithin(open, selector){ if(open){previousFocus=document.activeElement;setTimeout(() => document.querySelector(selector)?.focus(),120)}else{previousFocus?.focus?.()} }
function publishedLabel(v){if(!v.published)return 'UNIVERSAL GAMING';if(v.published==='CHANNEL UPLOADS')return v.published;const d=new Date(v.published);return Number.isNaN(d.getTime())?safeText(v.published):d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}).toUpperCase()}
function parseURL(source){
  try{const u=new URL(source.trim());const host=u.hostname.toLowerCase(); if(host==='youtu.be'||host==='www.youtu.be')return u.pathname.split('/')[1];
    if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(host)){if(u.pathname==='/watch')return u.searchParams.get('v');if(u.pathname.startsWith('/shorts/')||u.pathname.startsWith('/live/')||u.pathname.startsWith('/embed/'))return u.pathname.split('/')[2]}
    return null;
  }catch{return null}
}
function sanitizeVideo(x){if(!x || !isRealId(x.id))return null;return {id:x.id,title:safeText(x.title||'UGN Video'),description:safeText(x.description||'Official Universal Gaming video.'),published:safeText(x.published||''),kind:safeText(x.kind||'YOUTUBE VIDEO'),thumbnail:`https://i.ytimg.com/vi/${x.id}/hqdefault.jpg`}}
async function loadVideos(){
  let feed=[], featured=[];
  await Promise.all([
    fetch('./videos.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Video feed unavailable');return r.json()}).then(json=>{feed=(Array.isArray(json.videos)?json.videos:[]).map(sanitizeVideo).filter(Boolean)}).catch(e=>console.info('Video sync has not run:',e.message)),
    fetch('./lives.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Live archive unavailable');return r.json()}).then(json=>{featured=(Array.isArray(json.lives)?json.lives:[]).map(sanitizeVideo).filter(Boolean).slice(0,MAX_LIVES).map(v=>({...v,kind:'LIVE REPLAY'}))}).catch(e=>console.info('Livestream sync has not run:',e.message))
  ]);
  let personal=[];
  try{const stored=JSON.parse(safeStorage.get('ugn.media.personal')||'[]');personal=(Array.isArray(stored)?stored:[]).map(sanitizeVideo).filter(Boolean)}catch{}
  personal=[...state.videos.filter(v=>v.kind==='PERSONAL DISC'||v.kind==='PERSONAL LIVE'),...personal];
  const seen=new Set();
  // The livestream replays take priority and are shown among the physical desk DVDs.
  const discs=[...featured,...personal,...feed].filter(v=>{if(seen.has(v.id))return false;seen.add(v.id);return true}).slice(0,80);
  state.videos=[defaultDisc,...discs];
  $('disc-count').textContent=String(state.videos.length).padStart(2,'0');
  renderLibrary();state.scene?.setVideos(state.videos);
}
function renderLibrary(){
  const q=$('video-search').value.toLowerCase().trim();
  const featuredCount=state.videos.filter(v=>v.kind==='LIVE REPLAY').length;
  const personalCount=state.videos.filter(v=>v.kind==='PERSONAL LIVE').length;
  $('filter-live-count').textContent=`${featuredCount}/${MAX_LIVES}${personalCount?` +${personalCount}`:''}`;
  $('filter-all-count').textContent=String(state.videos.length).padStart(2,'0');
  const filtered=state.videos.map((v,index)=>({...v,index})).filter(v=>
    (state.filter==='all'||(state.filter==='live'&&isLive(v))||(state.filter==='video'&&!isLive(v)))&&
    (v.title.toLowerCase().includes(q)||v.kind.toLowerCase().includes(q)));
  const list=$('video-list');list.replaceChildren();
  $('library-count').textContent=`${filtered.length} DISCS`;
  if(!filtered.length){
    const p=document.createElement('p');p.className='library-empty';
    p.textContent=state.filter==='live'?'NO SAVED LIVESTREAMS YET. RUN “SYNC UGN YOUTUBE DVDS” IN GITHUB ACTIONS TO AUTO-FILL UP TO 10 PERMANENT LIVE DISCS, OR ADD A LIVE REPLAY LINK LOCALLY.':'NO MATCHING DISCS';
    list.append(p);
  }
  for(const v of filtered){
    const button=document.createElement('button');button.className='video-row'+(isLive(v)?' is-live':'');
    button.type='button';button.setAttribute('aria-label',`Select ${v.title}`);
    let thumb;
    if(v.id==='uploads'){thumb=document.createElement('div');thumb.className='video-thumb placeholder-thumb';thumb.textContent='UGN ✦'}
    else{thumb=document.createElement('img');thumb.className='video-thumb';thumb.src=v.thumbnail;thumb.alt='';thumb.loading='lazy';thumb.referrerPolicy='no-referrer';thumb.addEventListener('error',()=>{thumb.src='./assets/video-fallback.svg';thumb.onerror=null})}
    const meta=document.createElement('div');meta.className='video-row-body';
    const strong=document.createElement('strong');strong.textContent=v.title;
    const caption=document.createElement('span');caption.textContent=(isLive(v)?'● LIVE REPLAY  ·  ':'')+publishedLabel(v);
    meta.append(strong,caption);
    const arrow=document.createElement('span');arrow.className='row-arrow';arrow.textContent='↗';
    button.append(thumb,meta,arrow);button.addEventListener('click',()=>chooseVideo(v.index));list.append(button);
  }
}
function setLibraryFilter(value){
  if(!['all','live','video'].includes(value))return;
  state.filter=value;
  document.querySelectorAll('.filter-chip').forEach(button=>{const active=button.dataset.filter===value;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active))});
  renderLibrary();
}
function openLibrary(open=true){if(open){closeCase(false);closeScreen(false);closeAdd(false)}state.library=open;setAria('library',open);if(open){renderLibrary();$('video-search').focus()}state.scene?.setLibraryOpen(open)}
function chooseVideo(index){const v=state.videos[index];if(!v)return;if(!state.power){toast('POWER ON THE COMPUTER FIRST (P)');return;}openLibrary(false);closeScreen(false);state.current=v;state.caseOpen=true;
  $('case-title').textContent=v.title;$('case-description').textContent=v.description||'Official Universal Gaming video.';$('case-date').textContent=publishedLabel(v);$('case-type').textContent=v.kind||'YOUTUBE VIDEO';$('disc-number').textContent=String(index+1).padStart(3,'0');
  setAria('case-overlay',true);state.scene?.selectDisc(index);setTimeout(()=>$('insert-disc').focus(),180);tone(490,.055,'sine',.04);$('scene-hint').style.opacity='0';
}
function closeCase(restore=true){if(!state.caseOpen)return;state.caseOpen=false;setAria('case-overlay',false);state.scene?.unselectDisc();if(restore)$('discover-button')?.focus()}
function insert(){
  if(!state.current||!state.power)return;
  const v=state.current;
  // Fly the printed disc into the drive while the physical case moves in 3D.
  if(!reduceMotion){
    const source=$('disc-visual'),r=source.getBoundingClientRect(),root=$('app').getBoundingClientRect();
    const flying=source.cloneNode(true);flying.removeAttribute('id');flying.classList.add('disc-flight');
    flying.style.left=(r.left-root.left)+'px';flying.style.top=(r.top-root.top)+'px';flying.style.width=r.width+'px';flying.style.height=r.height+'px';
    $('app').append(flying);
    const dx=root.width*.42-(r.left-root.left+r.width/2),dy=root.height*.72-(r.top-root.top+r.height/2);
    const anim=flying.animate([{transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.12) rotate(900deg)`,opacity:0}],{duration:680,easing:'cubic-bezier(.36,.02,.84,.41)',fill:'forwards'});
    anim.finished.finally(()=>flying.remove()).catch(()=>flying.remove());
  }
  closeCase(false);state.scene?.insertDisc();setTimeout(()=>openScreen(v),reduceMotion?50:700);
}
function videoUrl(v){if(isRealId(v?.id))return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0&playsinline=1`;return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(v?.playlistId||UPLOADS_ID)}&playsinline=1`}
function directUrl(v){return isRealId(v?.id)?`https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`:CHANNEL+'/videos'}
function openScreen(video=null){if(!state.power){toast('THE COMPUTER IS POWERED OFF');return}openLibrary(false);closeCase(false);state.screenOpen=true;setAria('screen-modal',true);state.scene?.zoomScreen(true);const frame=$('youtube-frame');if(video){state.current=video;frame.src=videoUrl(video);frame.classList.add('is-visible');$('screen-standby').style.display='none';$('crt-video-title').textContent=video.title.toUpperCase().slice(0,65)}else if(state.current){frame.src=videoUrl(state.current);frame.classList.add('is-visible');$('screen-standby').style.display='none';$('crt-video-title').textContent=state.current.title.toUpperCase().slice(0,65)}else{frame.removeAttribute('src');frame.classList.remove('is-visible');$('screen-standby').style.display='flex';$('crt-video-title').textContent='UGN SYSTEM READY'}setTimeout(()=>$('close-screen').focus(),120)}
function closeScreen(restore=true){if(!state.screenOpen)return;state.screenOpen=false;setAria('screen-modal',false);const frame=$('youtube-frame');frame.removeAttribute('src');frame.classList.remove('is-visible');state.scene?.zoomScreen(false);if(restore)$('control-zoom').focus()}
function eject(){const had=Boolean(state.current);closeScreen(false);closeCase(false);state.current=null;state.scene?.ejectDisc();if(had)toast('DISC EJECTED — DRIVE READY');else toast('NO DISC IN DRIVE');tone(320,.1)}
function power(){state.power=!state.power;if(!state.power){eject();closeLibrarySilently();toast('UGN COMPUTER / POWER OFF')}else{toast('UGN MEDIA SYSTEM / BOOTING');tone(410,.18)}state.scene?.setPower(state.power);$('control-power').classList.toggle('is-active',state.power)}
function closeLibrarySilently(){state.library=false;setAria('library',false)}
function toggleLamp(){state.lamp=!state.lamp;state.scene?.setLamp(state.lamp);$('control-lamp').classList.toggle('is-active',state.lamp);toast(state.lamp?'BANKER LAMP / ON':'BANKER LAMP / OFF')}
function toggleWindow(){state.blinds=!state.blinds;state.scene?.setBlinds(state.blinds);$('control-window').classList.toggle('is-active',state.blinds);toast(state.blinds?'CITY VIEW / BLINDS OPEN':'CITY VIEW / BLINDS LOWERED')}
let audio=null;
async function toggleSound(){state.sound=!state.sound;if(state.sound&&!audio)audio=makeAmbience();if(state.sound&&!audio){state.sound=false;toast('WEB AUDIO NOT AVAILABLE ON THIS DEVICE');return} $('control-sound').classList.toggle('is-active',state.sound);$('sound-state').textContent=state.sound?'ON':'OFF';if(state.sound){try{await audio.ctx.resume()}catch{}audio.gain.gain.setTargetAtTime(.16,audio.ctx.currentTime,.15)}else if(audio){audio.gain.gain.setTargetAtTime(0,audio.ctx.currentTime,.15)}toast(state.sound?'SYNTHESIZED SPACE AMBIENCE / ON':'AMBIENCE / OFF')}
function makeAmbience(){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return null;const ctx=new AudioContext();const gain=ctx.createGain();gain.gain.value=0;gain.connect(ctx.destination);for(const hz of [55,82.4,110]){const osc=ctx.createOscillator(),g=ctx.createGain();osc.type='sine';osc.frequency.value=hz;g.gain.value=hz===55?.07:.025;osc.connect(g);g.connect(gain);osc.start()}const len=ctx.sampleRate*2;const buffer=ctx.createBuffer(1,len,ctx.sampleRate);const data=buffer.getChannelData(0);let last=0;for(let i=0;i<len;i++){last=(last+Math.random()*2-1)*.99;data[i]=last*.2}const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;const ng=ctx.createGain();ng.gain.value=.06;noise.connect(ng);ng.connect(gain);noise.start();return {ctx,gain}}
function tone(freq=500,dur=.08,wave='sine',volume=.025){if(!state.sound||!audio)return;const ctx=audio.ctx;if(ctx.state!=='running')return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;o.frequency.value=freq;g.gain.setValueAtTime(volume,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);o.connect(g);g.connect(audio.gain);o.start();o.stop(ctx.currentTime+dur)}
function openAdd(){openLibrary(false);closeCase(false);state.addOpen=true;setAria('add-modal',true);$('form-error').textContent='';setTimeout(()=>$('video-url').focus(),120)}
function closeAdd(restore=true){if(!state.addOpen)return;state.addOpen=false;setAria('add-modal',false);if(restore)$('control-library').focus()}
function onAdd(e){e.preventDefault();const id=parseURL($('video-url').value);if(!isRealId(id)){$('form-error').textContent='Please enter a valid YouTube video URL.';return}const title=$('video-title').value.trim();if(!title){$('form-error').textContent='Please enter a title.';return}let personal=[];try{personal=JSON.parse(safeStorage.get('ugn.media.personal')||'[]')}catch{}const newVideo=sanitizeVideo({id,title,published:new Date().toISOString(),kind:$('disc-kind').value==='PERSONAL LIVE'?'PERSONAL LIVE':'PERSONAL DISC'});personal=[newVideo,...personal.filter(v=>v.id!==id)].slice(0,60);safeStorage.set('ugn.media.personal',JSON.stringify(personal));state.videos=[defaultDisc,newVideo,...state.videos.filter(v=>v.id!=='uploads'&&v.id!==id)].slice(0,81);$('disc-count').textContent=String(state.videos.length).padStart(2,'0');state.scene?.setVideos(state.videos);$('add-form').reset();renderLibrary();closeAdd(false);openLibrary();toast('NEW DVD ADDED TO YOUR COLLECTION')}
function bind(){
  $('discover-button').addEventListener('click',()=>openLibrary());$('menu-toggle').addEventListener('click',()=>openLibrary());$('control-library').addEventListener('click',()=>openLibrary());$('close-library').addEventListener('click',()=>openLibrary(false));$('video-search').addEventListener('input',renderLibrary);document.querySelectorAll('.filter-chip').forEach(b=>b.addEventListener('click',()=>setLibraryFilter(b.dataset.filter)));
  $('close-case').addEventListener('click',()=>closeCase());$('case-back').addEventListener('click',()=>closeCase());document.querySelectorAll('[data-close-case]').forEach(e=>e.addEventListener('click',()=>closeCase()));$('insert-disc').addEventListener('click',insert);
  $('control-zoom').addEventListener('click',()=>openScreen());$('close-screen').addEventListener('click',()=>closeScreen());document.querySelectorAll('[data-close-screen]').forEach(e=>e.addEventListener('click',()=>closeScreen()));$('standby-open').addEventListener('click',()=>openLibrary());$('screen-eject').addEventListener('click',eject);$('control-eject').addEventListener('click',eject);$('screen-library').addEventListener('click',()=>openLibrary());$('open-youtube').addEventListener('click',()=>window.open(directUrl(state.current),'_blank','noopener,noreferrer'));
  $('control-lamp').addEventListener('click',toggleLamp);$('control-window').addEventListener('click',toggleWindow);$('control-power').addEventListener('click',power);$('control-sound').addEventListener('click',toggleSound);
  $('add-video').addEventListener('click',openAdd);$('close-add').addEventListener('click',()=>closeAdd());document.querySelectorAll('[data-close-add]').forEach(e=>e.addEventListener('click',()=>closeAdd()));$('add-form').addEventListener('submit',onAdd);$('fallback-open').addEventListener('click',()=>openLibrary());
  $('control-power').classList.add('is-active');$('control-lamp').classList.add('is-active');
  window.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey)return;if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(e.key==='Escape'){if(state.addOpen)closeAdd();else if(state.screenOpen)closeScreen();else if(state.caseOpen)closeCase();else if(state.library)openLibrary(false);return}
    if(state.addOpen)return;const k=e.key.toLowerCase();if(k==='z')openScreen();else if(k==='e')eject();else if(k==='l')toggleLamp();else if(k==='w')toggleWindow();else if(k==='s')toggleSound();else if(k==='p')power();else if(k==='b')openLibrary(!state.library);else if(k==='arrowright'||k==='arrowleft'){e.preventDefault();const index=state.videos.indexOf(state.current);chooseVideo((index+(k==='arrowright'?1:-1)+state.videos.length)%state.videos.length)}})
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&audio)audio.gain.gain.setTargetAtTime(0,audio.ctx.currentTime,.1);else if(!document.hidden&&state.sound&&audio)audio.gain.gain.setTargetAtTime(.16,audio.ctx.currentTime,.1)});
}
function showFallback(err){console.warn('3D renderer unavailable; the HTML media library remains usable.',err);$('scene-fallback').hidden=false;$('scene-hint').textContent='OPEN THE DVD LIBRARY TO WATCH';}
function bootComplete(){const intro=$('intro');intro.querySelector('.boot-bar i').style.width='100%';$('boot-percent').textContent='100%';setTimeout(()=>intro.classList.add('out'),200)}
async function start(){bind();$('time-label').textContent=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}).toUpperCase();$('intro').querySelector('.boot-bar i').style.width='45%';$('boot-percent').textContent='45%';
  const loading=loadVideos();let sceneLoaded=false;
  try{const {createScene}=await import('./scene.js');state.scene=createScene({container:$('world'),onDisc:chooseVideo,onScreen:()=>openScreen(),onLamp:toggleLamp,onWindow:toggleWindow});state.scene.setVideos(state.videos);sceneLoaded=true;}
  catch(error){showFallback(error)}
  await loading;if(sceneLoaded)state.scene?.setVideos(state.videos);bootComplete();
}
start();
