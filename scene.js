/* UGN Media real-time 3D room. All artwork and geometry here is procedural and original. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rand=(x)=>{const v=Math.sin(x*127.1+19.19)*43758.5453;return v-Math.floor(v)};
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,...extra});
const wood=mat('#442338',{roughness:.79,metalness:.08});
const beige=mat('#bcb3ab',{roughness:.75});
const cream=mat('#dbd3c2',{roughness:.82});
const frameDark=mat('#201a2b',{roughness:.7,metalness:.18});
const black=mat('#080d20',{roughness:.85});
const metallic=mat('#6c6b83',{roughness:.36,metalness:.75});
const cyan=mat('#65efff',{emissive:'#36dbff',emissiveIntensity:1.6});
const violet=mat('#a475ff',{emissive:'#6849c9',emissiveIntensity:.8});
function box(parent,size,pos,material,options={}){const obj=new THREE.Mesh(new THREE.BoxGeometry(...size),material);obj.position.set(...pos);obj.castShadow=options.castShadow??true;obj.receiveShadow=true;parent.add(obj);return obj}
function plane(parent,size,pos,material){const o=new THREE.Mesh(new THREE.PlaneGeometry(...size),material);o.position.set(...pos);parent.add(o);return o}
function cylinder(parent,rTop,rBottom,height,pos,material,segments=24){const o=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,height,segments),material);o.position.set(...pos);o.castShadow=true;parent.add(o);return o}
function canvasTexture(canvas){const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex}
function createCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')]}
function skylineTexture(){
  const [c,x]=createCanvas(1536,800);const g=x.createLinearGradient(0,0,0,800);g.addColorStop(0,'#060c2c');g.addColorStop(.48,'#171a48');g.addColorStop(.84,'#643776');g.addColorStop(1,'#cc5d8a');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
  // Cosmic skyline, stars, aurora and subtle planet.
  const glow=x.createRadialGradient(1050,250,40,1050,240,650);glow.addColorStop(0,'rgba(64,180,251,.30)');glow.addColorStop(1,'rgba(78,49,142,0)');x.fillStyle=glow;x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<340;i++){const px=rand(i+8)*c.width,py=rand(i+78)*520,r=rand(i+188)*1.35+.25;x.fillStyle=`rgba(209,226,255,${.16+rand(i+34)*.6})`;x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill()}
  x.save();x.globalAlpha=.35;x.fillStyle='#c7bafe';x.beginPath();x.arc(1210,160,77,0,7);x.fill();x.globalAlpha=.5;x.strokeStyle='#87eafc';x.lineWidth=9;x.beginPath();x.ellipse(1210,160,115,25,-.2,0,7);x.stroke();x.restore();
  // Front and distant buildings; deterministic lit-window patterns.
  for(let depth=0;depth<3;depth++){
    for(let i=0;i<28;i++){const bx=(i*68+depth*24)%1550;const height=140+rand(i*7+depth*10)*310+depth*72;const w=42+rand(i*5+depth)*30;const y=730-height;
      x.fillStyle=depth===0?'#222344':depth===1?'#141834':'#0a132b';x.fillRect(bx,y,w,height);
      x.fillStyle=depth===0?'#39366b':depth===1?'#283255':'#22264f';x.fillRect(bx,y,w,5);
      for(let wx=bx+8;wx<bx+w-5;wx+=11){for(let wy=y+14;wy<760;wy+=17){const n=rand(wx*.9+wy*2+depth*11);if(n>.53){x.fillStyle=n>.9?'#77e6ff':n>.72?'#fdadbd':'#bd8cff';x.globalAlpha=.25+(n*.5);x.fillRect(wx,wy,4,7)}}}x.globalAlpha=1;
    }
  }
  x.fillStyle='#070f24';x.fillRect(0,743,c.width,57);
  for(let i=0;i<110;i++){const px=rand(i+778)*1536,py=rand(i+900)*140+640;x.strokeStyle=i%3?'rgba(85,213,249,.18)':'rgba(235,129,210,.23)';x.lineWidth=1; x.beginPath();x.moveTo(px,py);x.lineTo(px+18,800);x.stroke()}
  return canvasTexture(c);
}
function woodTexture(){const [c,x]=createCanvas(1024,512);x.fillStyle='#472c39';x.fillRect(0,0,1024,512);for(let i=0;i<300;i++){const y=rand(i+4)*512;x.beginPath();x.strokeStyle=i%2?'rgba(249,192,153,.032)':'rgba(4,8,18,.12)';x.lineWidth=rand(i+24)*4+.5;x.moveTo(0,y);x.bezierCurveTo(290,y+rand(i+65)*7-3,690,y+rand(i+77)*12-6,1024,y+rand(i+31)*10-5);x.stroke()}return canvasTexture(c)}
function labelTexture(title,index,live=false){const [c,x]=createCanvas(500,96);const colors=['#8c54ea','#2faac5','#db6d9e','#6e7fea','#cc8c5b','#8b87b8','#6fa9a4','#d9688d'];const color=live?'#e35395':colors[index%colors.length];x.fillStyle='#0b112b';x.fillRect(0,0,500,96);x.fillStyle=color;x.fillRect(0,0,43,96);x.fillStyle='#e7eaff';x.font='bold 24px sans-serif';x.fillText(live?'UGN ● LIVE':'UGN',55,33);x.fillStyle='#d2d5ec';x.font='bold 17px sans-serif';let s=String(title).toUpperCase();if(s.length>32)s=s.slice(0,29)+'…';x.fillText(s,55,63);x.fillStyle='#61e1f1';x.font='12px monospace';x.fillText(String(index+1).padStart(3,'0'),446,31);return canvasTexture(c)}
function coverTexture(title,index,live=false){const [c,x]=createCanvas(512,360);const g=x.createLinearGradient(0,0,512,360);const palettes=[['#2b0b55','#155273'],['#092c4d','#5931a1'],['#57336b','#163866'],['#153d54','#824066']];g.addColorStop(0,palettes[index%4][0]);g.addColorStop(1,palettes[index%4][1]);x.fillStyle=g;x.fillRect(0,0,512,360);for(let i=0;i<130;i++){x.fillStyle=`rgba(235,235,255,${rand(i+700)*.65})`;x.fillRect(rand(i+13)*512,rand(i+21)*360,1.5,1.5)}x.beginPath();x.arc(400,104,75,0,7);x.strokeStyle='#72eaff';x.lineWidth=2;x.stroke();x.beginPath();x.ellipse(400,104,110,18,-.2,0,7);x.stroke();x.fillStyle='#a1e8fd';x.font='bold 24px monospace';x.fillText(live?'UGN LIVE ARCHIVE':'UGN MEDIA',26,45);x.fillStyle='white';x.font='bold 33px sans-serif';const words=String(title).split(' ');let line='',lines=[];for(const word of words){if((line+word).length>20){lines.push(line);line=''}line+=word+' '}lines.push(line);lines.slice(0,3).forEach((l,i)=>x.fillText(l,27,220+i*38));x.fillStyle='#79ebff';x.fillRect(28,328,250,3);return canvasTexture(c)}
function screenTexture(){const [c,x]=createCanvas(640,440);const tex=canvasTexture(c);return {canvas:c,ctx:x,tex}}
export function createScene({container,onDisc,onScreen,onLamp,onWindow}){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#080d20');scene.fog=new THREE.FogExp2('#0d102b',.018);
  const w=()=>Math.max(1,container.clientWidth),h=()=>Math.max(1,container.clientHeight);
  const camera=new THREE.PerspectiveCamera(49,w()/h(),.08,200);camera.position.set(.2,3.05,9.1);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:2));renderer.setSize(w(),h());renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.style.cursor='default';container.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#91a0fe','#332239',1.65));const ambient=new THREE.AmbientLight('#6f78bb',.9);scene.add(ambient);
  const overhead=new THREE.DirectionalLight('#e8b9ff',1.15);overhead.position.set(1,10,5);overhead.castShadow=true;overhead.shadow.mapSize.set(1024,1024);overhead.shadow.camera.left=-12;overhead.shadow.camera.right=12;overhead.shadow.camera.top=12;overhead.shadow.camera.bottom=-12;scene.add(overhead);
  const cyanFill=new THREE.PointLight('#33d8ff',30,17,2);cyanFill.position.set(4,4,-1.8);scene.add(cyanFill);
  const violetFill=new THREE.PointLight('#935af7',18,16,2);violetFill.position.set(-4.8,4,0);scene.add(violetFill);
  const lampLight=new THREE.PointLight('#a8ffc8',37,7,1.7);lampLight.position.set(-4.7,3.25,1);lampLight.castShadow=true;lampLight.shadow.mapSize.set(512,512);scene.add(lampLight);
  // Back wall, architectural panels and neon rainy window.
  box(scene,[19,8,.25],[0,4,-4.8],mat('#16132d',{roughness:.9}));
  const outside=plane(scene,[14.5,6.1],[0,3.8,-4.52],new THREE.MeshBasicMaterial({map:skylineTexture(),toneMapped:false}));outside.material.color.set('#c1bddb');
  // slightly reflective window glass tint; glass/sill/frames.
  plane(scene,[14.5,6.1],[0,3.8,-4.43],new THREE.MeshBasicMaterial({color:'#7a86f5',transparent:true,opacity:.09,depthWrite:false}));
  const walnut=mat('#332039',{roughness:.55,metalness:.2});box(scene,[15.2,.25,.48],[0,.72,-4.22],walnut);box(scene,[15.2,.20,.48],[0,6.99,-4.2],walnut);
  for(const px of [-7.55,0,7.55])box(scene,[.23,6.45,.45],[px,3.8,-4.22],walnut);
  for(const py of [1.3,6.58])box(scene,[15.25,.22,.45],[0,py,-4.22],walnut);
  const slats=[];const blindMat=mat('#472c42',{roughness:.49,metalness:.17});for(let i=0;i<25;i++){const o=box(scene,[15.05,.11,.27],[0,6.82-i*.126,-4.03],blindMat,{castShadow:false});slats.push(o)}
  // rain streaks are physically placed over window, dynamically animated.
  const rainCount=260,positions=new Float32Array(rainCount*2*3);const velocity=[];for(let i=0;i<rainCount;i++){const x=rand(i+15)*14.5-7.25,y=rand(i+350)*6.2+.9,z=-3.94+rand(i+31)*.03,k=i*6;positions[k]=x;positions[k+1]=y;positions[k+2]=z;positions[k+3]=x-.012;positions[k+4]=y-.10-rand(i+81)*.22;positions[k+5]=z;velocity.push(.6+rand(i+320)*2.4)}const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.BufferAttribute(positions,3));const rain=new THREE.LineSegments(geom,new THREE.LineBasicMaterial({color:'#c3b9f8',transparent:true,opacity:.35}));scene.add(rain);
  // Desk, carved lip, legs, inlaid neon accent.
  const topWood=new THREE.MeshStandardMaterial({map:woodTexture(),color:'#c09b99',roughness:.72});box(scene,[14.8,.35,6.2],[0,.76,.42],topWood);box(scene,[14.9,.16,.36],[0,.58,3.56],walnut);box(scene,[14.8,.08,.03],[0,.65,3.74],mat('#70547c',{emissive:'#7154a1',emissiveIntensity:.24}));
  for(const x of [-6.5,6.5]){box(scene,[.65,1.2,.65],[x,-.06,2.7],walnut);box(scene,[.62,1.2,.65],[x,-.06,-1.5],walnut)}
  // Central computer unit with beige late-90s CRT, floppy bay and patterned vents.
  const pc=new THREE.Group();scene.add(pc);const px=-1.05;
  box(pc,[3.75,.63,2.75],[px,1.28,.37],beige);box(pc,[3.73,.075,2.77],[px,1.61,.37],cream);box(pc,[3.75,.2,.13],[px,1.15,1.76],cream);
  box(pc,[1.45,.045,.016],[px+.35,1.23,1.842],frameDark);box(pc,[1.03,.025,.02],[px-.65,1.47,1.844],mat('#55505f'));
  box(pc,[.23,.028,.018],[px+1.55,1.20,1.848],black);const ledPC=box(pc,[.065,.055,.022],[px+1.47,1.44,1.853],cyan);ledPC.castShadow=false;
  // ventilator slots on tower top.
  for(let i=0;i<22;i++)box(pc,[.018,.015,.92],[px-1.57+i*.14,1.66,-.11],mat('#716b71'),{castShadow:false});
  cylinder(pc,.32,.42,.18,[px,1.77,.2],beige);box(pc,[.72,.18,.65],[px,1.85,.16],beige);
  const monitor=box(pc,[3.55,2.65,1.09],[px,3.12,.05],beige);box(pc,[3.07,2.14,.055],[px,3.2,.613],frameDark);
  box(pc,[2.89,1.96,.04],[px,3.2,.654],mat('#111b35',{emissive:'#102446',emissiveIntensity:.8}));
  const display=screenTexture();const screen=plane(pc,[2.86,1.93],[px,3.2,.688],new THREE.MeshBasicMaterial({map:display.tex}));
  const glass=plane(pc,[2.86,1.93],[px,3.2,.695],new THREE.MeshBasicMaterial({color:'#c9e9ff',transparent:true,opacity:.04,depthWrite:false}));glass.material.blending=THREE.AdditiveBlending;
  box(pc,[.2,.16,.045],[px+1.52,2,.67],mat('#aaa69c'));const ledMonitor=box(pc,[.04,.04,.02],[px+1.27,1.99,.687],cyan);ledMonitor.castShadow=false;
  box(pc,[1.1,.06,.11],[px,1.87,.71],mat('#968d85'));
  // Speaker and keyboard complete the desktop.
  box(scene,[.58,1.24,.78],[-3.45,1.67,1.22],cream);box(scene,[.4,.74,.065],[-3.45,1.75,1.63],mat('#343242'));for(let i=0;i<5;i++)box(scene,[.31,.018,.07],[-3.45,1.45+i*.108,1.67],metallic);
  const kb=box(scene,[4.25,.17,1.19],[-1.15,1.02,2.68],cream);kb.rotation.x=-.045;
  const keyMat=mat('#dcdad2');const keyGeo=new THREE.BoxGeometry(.212,.045,.16);const count=89;const keys=new THREE.InstancedMesh(keyGeo,keyMat,count);let ki=0;const dummy=new THREE.Object3D();for(let row=0;row<6;row++){for(let col=0;col<(row===5?14:15);col++){if(ki>=count)break;dummy.position.set(-3.1+col*.26+(row%2)*.05,1.13,2.21+row*.17);dummy.rotation.set(-.04,0,0);dummy.updateMatrix();keys.setMatrixAt(ki++,dummy.matrix)}}keys.instanceMatrix.needsUpdate=true;keys.castShadow=true;scene.add(keys);
  const mousepad=box(scene,[1.42,.018,1.25],[1.75,1.01,2.77],mat('#151c3b'));mousepad.castShadow=false;const mouse=box(scene,[.40,.12,.67],[1.74,1.12,2.7],cream);mouse.rotation.z=-.12;box(scene,[.02,.015,.14],[1.74,1.19,2.52],mat('#686576'));
  // Brass and green-glass banker's lamp on left.
  const brass=mat('#bd9562',{metalness:.78,roughness:.2});cylinder(scene,.6,.68,.10,[-5.28,1.0,.18],brass);cylinder(scene,.2,.3,.17,[-5.28,1.14,.18],brass);cylinder(scene,.045,.055,2.2,[-5.28,2.35,.18],brass);cylinder(scene,.12,.12,.08,[-5.28,3.48,.18],brass);
  const lampShade=new THREE.Mesh(new THREE.CylinderGeometry(.65,.81,.36,32,1,false),mat('#1d8c70',{metalness:.36,roughness:.27,emissive:'#26a786',emissiveIntensity:.55}));lampShade.scale.z=.70;lampShade.position.set(-5.15,3.63,.23);lampShade.castShadow=true;scene.add(lampShade);
  cylinder(scene,.53,.53,.045,[-5.15,3.44,.23],mat('#d5ffdc',{emissive:'#c0ffd1',emissiveIntensity:1.3}));
  // One small console and desk ephemera, ambient LEDs.
  box(scene,[1.26,.46,.73],[-5.27,1.17,2.05],black);cylinder(scene,.22,.22,.05,[-5.65,1.43,2.27],metallic);box(scene,[.4,.05,.03],[-4.91,1.3,2.43],mat('#e891a9',{emissive:'#c14e87',emissiveIntensity:.4}));
  box(scene,[1.42,.02,1.92],[5.48,1.03,2.08],mat('#f3e4e2',{roughness:.92}));box(scene,[1.37,.02,1.87],[5.54,1.045,2.13],mat('#dfd3e3',{roughness:.91}));
  // DVD stacks — each spine is a dedicated, pickable Three.js mesh.
  const dvdGroup=new THREE.Group();scene.add(dvdGroup);let videoMeshes=[],videoEntries=[],selected=null;let discAnim=null;let now=0;
  function setVideos(videos){videoEntries=videos;dvdGroup.clear();videoMeshes=[];for(let index=0;index<Math.min(18,videos.length);index++){
    const stack=index<9?0:1;const rank=index%9;const x=stack===0?2.68:4.64,y=1.05+rank*.143,z=stack===0?-.20:-.31;
    const spineMat=new THREE.MeshStandardMaterial({map:labelTexture(videos[index].title,index,['LIVE REPLAY','PERSONAL LIVE'].includes(videos[index].kind)),roughness:.47,metalness:.08});const caseBody=box(dvdGroup,[1.75,.128,1.07],[x,y,z],mat(index%2?'#121a34':'#16152b',{roughness:.4}));
    const edge=plane(dvdGroup,[1.68,.121],[x,y,z+.537],spineMat);edge.castShadow=false;edge.userData.discIndex=index;caseBody.userData.discIndex=index;const top=plane(dvdGroup,[1.62,.96],[x,y+.066,z],new THREE.MeshStandardMaterial({map:coverTexture(videos[index].title,index,['LIVE REPLAY','PERSONAL LIVE'].includes(videos[index].kind)),roughness:.42}));top.rotation.x=-Math.PI/2;top.userData.discIndex=index;
    const item={caseBody,edge,top,index,ox:x,oy:y,oz:z};videoMeshes.push(item);
  }}
  function discReset(){for(const item of videoMeshes){item.caseBody.visible=true;item.edge.visible=true;item.top.visible=true;for(const mesh of [item.caseBody,item.edge,item.top])mesh.position.set(mesh===item.edge?item.ox:item.ox,mesh===item.top?item.oy+.066:item.oy,mesh===item.edge?item.oz+.537:item.oz);item.caseBody.rotation.set(0,0,0);item.edge.rotation.set(0,0,0);item.top.rotation.set(-Math.PI/2,0,0)}}
  const state={power:true,lamp:true,blinds:false,selected:-1,zoom:false,library:false};
  function selectDisc(index){state.selected=index;selected=videoMeshes.find(x=>x.index===index)||null;discAnim=selected?{type:'lift',start:now}:null}
  function unselectDisc(){discAnim=selected?{type:'return',start:now}:null;state.selected=-1}
  function insertDisc(){discAnim=selected?{type:'insert',start:now}:null;state.selected=-1}
  function ejectDisc(){discReset();selected=null;discAnim=null;state.selected=-1}
  function setPower(value){state.power=value;ledPC.visible=value;ledMonitor.visible=value;screen.material.color.set(value?'#ffffff':'#050915');screen.material.needsUpdate=true}
  function setLamp(value){state.lamp=value;lampLight.intensity=value?37:0;lampShade.material.emissiveIntensity=value?.55:0}
  function setBlinds(value){state.blinds=value}
  function zoomScreen(value){state.zoom=value}
  function setLibraryOpen(value){state.library=value}
  // Raycasting on DVD cases, lamp and screen.
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let hovered=-1,down=null;
  function hit(evt){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((evt.clientX-rect.left)/rect.width)*2-1;pointer.y=-((evt.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...dvdGroup.children,monitor,screen,lampShade],false);return hits[0]?.object||null}
  renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>12)return;down=null;const obj=hit(e);if(!obj)return;if(Number.isInteger(obj.userData.discIndex)){onDisc(obj.userData.discIndex);return}if(obj===monitor||obj===screen){onScreen();return}if(obj===lampShade){onLamp();return}});
  renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const obj=hit(e);hovered=obj?.userData?.discIndex??-1;renderer.domElement.style.cursor=(hovered>=0||obj===monitor||obj===screen||obj===lampShade)?'pointer':'default'});
  // CRT boot and standby render. Real YouTube video plays in a legal, native iframe when enlarged.
  function drawScreen(t){const x=display.ctx,c=display.canvas;const w=c.width,h=c.height;x.fillStyle=state.power?'#09142c':'#020409';x.fillRect(0,0,w,h);if(!state.power){display.tex.needsUpdate=true;return}
    const g=x.createRadialGradient(w*.5,h*.5,30,w*.5,h*.5,390);g.addColorStop(0,'rgba(63,93,166,.44)');g.addColorStop(1,'rgba(6,8,25,.05)');x.fillStyle=g;x.fillRect(0,0,w,h);
    x.strokeStyle='rgba(117,213,248,.13)';x.lineWidth=1;for(let i=0;i<30;i++){x.beginPath();x.moveTo(i*25,0);x.lineTo(i*25,h);x.stroke()}for(let j=0;j<30;j++){x.beginPath();x.moveTo(0,j*20);x.lineTo(w,j*20);x.stroke()}
    x.fillStyle='#8fe8ff';x.font='bold 16px monospace';x.fillText('✦ UGN MEDIA OS',26,39);x.fillStyle='#6975bd';x.fillText('SYSTEM READY / REV 1.0',26,65);
    x.textAlign='center';x.shadowBlur=20;x.shadowColor='#68dfff';x.fillStyle='#edf7ff';x.font='bold 115px monospace';x.fillText('UGN',320,225);x.shadowBlur=0;x.fillStyle='#a57fff';x.font='bold 23px monospace';x.fillText('M E D I A',320,268);x.fillStyle='#79b9d1';x.font='13px monospace';x.fillText(state.selected>=0?'DISC READY — PRESS PLAY':'SELECT A DVD TO BEGIN',320,309);
    x.textAlign='left';x.fillStyle='#5ca9c2';x.font='12px monospace';x.fillText('> ARCHIVE ONLINE',27,408);x.fillText('DISC DRIVE [READY]',447,408);
    x.fillStyle='rgba(0,0,0,.2)';for(let y=0;y<h;y+=4)x.fillRect(0,y,w,1);x.fillStyle='rgba(101,242,255,.11)';x.fillRect(0,Math.floor((t*23)%h),w,5);display.tex.needsUpdate=true;
  }
  const clock=new THREE.Clock();let lookAt=new THREE.Vector3(-.15,2.68,-.6);let screenTimer=0;let lastFrame=0;
  function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.06);now+=dt;const aspect=w()/h();if(camera.aspect!==aspect){camera.aspect=aspect;camera.updateProjectionMatrix();renderer.setSize(w(),h())}
    // Slight, optional mouse parallax gives the desk depth without hijacking touch scrolling.
    let pos,look;
    if(state.zoom){pos=new THREE.Vector3(-1.05,3.18,4.3);look=new THREE.Vector3(-1.05,3.19,.4)}
    else if(state.blinds){pos=new THREE.Vector3(.45,3.65,8.8);look=new THREE.Vector3(0,4.0,-4.5)}
    else if(state.library){pos=new THREE.Vector3(-.3,3.05,9.5);look=new THREE.Vector3(.2,2.5,.1)}
    else{const mobile=aspect<.95;pos=new THREE.Vector3(mobile?-.45:.15,mobile?3.65:3.03,mobile?11.6:9.15);look=new THREE.Vector3(mobile?-.5:-.10,mobile?2.72:2.66,-.45)}
    const factor=1-Math.exp(-dt*2.0);camera.position.lerp(pos,factor);lookAt.lerp(look,factor);camera.lookAt(lookAt);
    for(let i=0;i<slats.length;i++){const y=state.blinds?6.87-i*.022:6.82-i*.126;slats[i].position.y=lerp(slats[i].position.y,y,1-Math.exp(-dt*2.5));slats[i].scale.y=lerp(slats[i].scale.y,state.blinds?.22:1,1-Math.exp(-dt*2))}
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){for(let i=0;i<rainCount;i++){const k=i*6;positions[k+1]-=velocity[i]*dt;positions[k+4]-=velocity[i]*dt;if(positions[k+4]<.8){positions[k+1]=7.02;positions[k+4]=6.87-(rand(i+33)*.2)}}geom.attributes.position.needsUpdate=true}
    if(selected&&discAnim){const elapsed=now-discAnim.start,p=clamp(elapsed/(discAnim.type==='return'?.48:.73),0,1),ease=p*p*(3-2*p);const item=selected;
      if(discAnim.type==='lift'){const x=lerp(item.ox,.60,ease),y=lerp(item.oy,3.45,ease),z=lerp(item.oz,4.12,ease);item.caseBody.position.set(x,y,z);item.edge.position.set(x,y,z+.537);item.top.position.set(x,y+.066,z)}
      else if(discAnim.type==='return'){for(const mesh of [item.caseBody,item.edge,item.top]){const ox=item.ox,oy=item.oy+(mesh===item.top?.066:0),oz=item.oz+(mesh===item.edge?.537:0);mesh.position.lerp(new THREE.Vector3(ox,oy,oz),ease)}if(p>=1){selected=null;discAnim=null}}
      else if(discAnim.type==='insert'){const x=lerp(item.caseBody.position.x,-1.08,ease),y=lerp(item.caseBody.position.y,1.28,ease),z=lerp(item.caseBody.position.z,1.95,ease);item.caseBody.position.set(x,y,z);item.edge.position.set(x,y,z+.537);item.top.position.set(x,y+.066,z);if(p>=1){item.caseBody.visible=false;item.edge.visible=false;item.top.visible=false;selected=null;discAnim=null}}
    }
    if(now-screenTimer>.08){drawScreen(now);screenTimer=now}
    if(!document.hidden){renderer.render(scene,camera);lastFrame=now}
  }
  animate();
  return {setVideos,selectDisc,unselectDisc,insertDisc,ejectDisc,setPower,setLamp,setBlinds,zoomScreen,setLibraryOpen};
}
