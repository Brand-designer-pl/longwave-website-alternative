/* Original visual model, reconstructed from LONGWAVE photographs. Not a manufacturing CAD model.
   Three.js 0.180.0, MIT. Photo-mapped deck, bevelled bamboo rail and separate hardware. */
import * as THREE from '../vendor/three/three.module.min.js';
export async function createBoards(stage, onLost) {
 const canvas=document.createElement('canvas');canvas.className='boards-volume';canvas.setAttribute('aria-hidden','true');
 let renderer;
 try {renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch(_){return null;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width:700px)').matches?1.25:1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.1,60);camera.position.set(0,0,13.5);
 scene.add(new THREE.HemisphereLight(0xffffff,0x777568,2.3));
 const key=new THREE.DirectionalLight(0xffffff,3.0);key.position.set(-4,6,8);scene.add(key);
 const rim=new THREE.DirectionalLight(0xf5e7cf,2);rim.position.set(5,-1,-4);scene.add(rim);
 const loader=new THREE.TextureLoader(),models=[],textures=[],geometries=new Set(),materials=new Set();
 let disposed=false,lost=false,playing=false,raf=0,last=0,elapsed=0,current=0;
 const state={turn:-.24,tilt:.075,roll:-.035,y:0,scale:1};
 const remember=m=>{materials.add(m);return m;};
 function mesh(geometry,material,parent){geometries.add(geometry);const m=new THREE.Mesh(geometry,material);parent.add(m);return m;}
 function cleanup(){cancelAnimationFrame(raf);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();canvas.remove();stage.classList.remove('has-volume');}
 try {
  const response=await fetch(new URL('boards/profiles.json',import.meta.url));if(!response.ok)throw Error('Profiles unavailable');
  const profiles=await response.json();
  const loaded=await Promise.allSettled(profiles.map(p=>loader.loadAsync(new URL(`boards/board-${p.id}.webp`,import.meta.url).href)));
  loaded.forEach(result=>{if(result.status==='fulfilled')textures.push(result.value);});
  if(loaded.some(result=>result.status==='rejected'))throw Error('Product texture unavailable');
  const maps=loaded.map(result=>result.value);
  maps.forEach(t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());});
  const backMap=maps[0].clone();backMap.offset.set(.42,.79);backMap.repeat.set(.16,.10);textures.push(backMap);
  const wood=remember(new THREE.MeshStandardMaterial({map:backMap,color:0xdac79f,roughness:.66}));
  const rubber=remember(new THREE.MeshStandardMaterial({color:0x171918,roughness:.78}));
  const metal=remember(new THREE.MeshStandardMaterial({color:0x555955,metalness:.65,roughness:.35}));
  const hub=remember(new THREE.MeshStandardMaterial({color:0x222522,metalness:.45,roughness:.42}));
  profiles.forEach((p,index)=>{
   const length=index?5.05:6.2,width=length*p.ratio,thickness=.075;
   const group=new THREE.Group();scene.add(group);models.push(group);
   // Smooth the photographed outline, excluding the wheels outside the bamboo deck.
   const smooth=p.samples.map((s,i,a)=>[s[0],s[1]].map((_,k)=>{let v=0,n=0;for(let j=Math.max(0,i-2);j<=Math.min(a.length-1,i+2);j++){v+=a[j][k];n++;}return v/n;}).concat(s[2]));
   const points=[...smooth.map(s=>new THREE.Vector2((s[0]-.5)*width,(.5-s[2])*length)),...smooth.slice().reverse().map(s=>new THREE.Vector2((s[1]-.5)*width,(.5-s[2])*length))];
   const shape=new THREE.Shape(points);
   const uv={generateTopUV(g,v,a,b,c){return[a,b,c].map(i=>new THREE.Vector2(v[i*3]/width+.5,v[i*3+1]/length+.5));},generateSideWallUV(g,v,a,b,c,d){return[a,b,c,d].map(i=>new THREE.Vector2(v[i*3+1]/length+.5,v[i*3+2]/thickness));}};
   const geometry=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelThickness:.018,bevelSize:.012,bevelSegments:3,steps:1,UVGenerator:uv});
   // Separate top from underside: the grip photograph must never appear on the back.
   const positions=geometry.attributes.position;const groups=geometry.groups.slice();geometry.clearGroups();
   groups.forEach(g=>{for(let i=g.start;i<g.start+g.count;i+=3){const back=g.materialIndex===0&&positions.getZ(i)<.001;geometry.addGroup(i,3,back?2:g.materialIndex);}});
   // Combine adjacent material runs to keep draw calls small.
   const runs=[];geometry.groups.forEach(g=>{const prev=runs.at(-1);if(prev&&prev.materialIndex===g.materialIndex&&prev.start+prev.count===g.start)prev.count+=g.count;else runs.push({...g});});geometry.groups=runs;
   for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i);positions.setZ(i,positions.getZ(i)+.045*Math.pow(y/(length*.5),4)+.028*Math.pow(x/(width*.5),2));}geometry.computeVertexNormals();
   const top=remember(new THREE.MeshStandardMaterial({map:maps[index],roughness:.58,metalness:.02}));
   const edge=remember(new THREE.MeshStandardMaterial({color:0xa7834d,roughness:.72}));
   mesh(geometry,[top,edge,wood],group);
   // Independent axle, pivot, baseplate, bearings and four rounded wheels.
   [-1,1].forEach(sign=>{
    const y=sign*length*.31,truck=new THREE.Group();truck.position.set(0,y,-.08);group.add(truck);
    const plate=mesh(new THREE.BoxGeometry(.29,.43,.075),metal,truck);plate.position.z=-.02;
    const stem=mesh(new THREE.CylinderGeometry(.065,.09,.25,12),metal,truck);stem.rotation.x=Math.PI/2;stem.position.z=-.16;
    const axle=mesh(new THREE.CylinderGeometry(.055,.055,width*.95,16),metal,truck);axle.rotation.z=Math.PI/2;axle.position.z=-.3;
    [-1,1].forEach(side=>{
     const wheel=new THREE.Group();wheel.position.set(side*width*.49,0,-.3);wheel.rotation.z=Math.PI/2;truck.add(wheel);
     // Lathed profile gives the tyre a round shoulder rather than a hard cylinder.
     const profile=[new THREE.Vector2(.105,-.135),new THREE.Vector2(.19,-.135),new THREE.Vector2(.215,-.11),new THREE.Vector2(.22,-.07),new THREE.Vector2(.22,.07),new THREE.Vector2(.215,.11),new THREE.Vector2(.19,.135),new THREE.Vector2(.105,.135)];
     mesh(new THREE.LatheGeometry(profile,24),rubber,wheel);
     mesh(new THREE.CylinderGeometry(.107,.107,.27,20),hub,wheel);
     mesh(new THREE.CylinderGeometry(.039,.039,.285,12),metal,wheel);
    });
   });
   group.visible=index===0;
  });
 }catch(error){cleanup();return null;}
 stage.append(canvas);
 function draw(){if(disposed||lost)return;const g=models[current];g.rotation.set(state.tilt+Math.sin(elapsed*.42)*.012,state.turn+Math.sin(elapsed*.33)*.018,state.roll+Math.sin(elapsed*.38)*.009);g.position.y=state.y+Math.sin(elapsed*.6)*.035;g.scale.setScalar(state.scale);renderer.render(scene,camera);}
 function resize(){if(disposed||lost)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.position.z=Math.max(13.5,6.3/camera.aspect);camera.updateProjectionMatrix();draw();}
 function frame(now){if(!playing||disposed||lost)return;elapsed+=Math.min((now-last)/1000,.05);last=now;draw();raf=requestAnimationFrame(frame);}
 function setPlaying(value){playing=!!value&&!disposed&&!lost;cancelAnimationFrame(raf);if(playing){last=performance.now();raf=requestAnimationFrame(frame);}else draw();}
 function setModel(index){current=index;models.forEach((m,i)=>m.visible=i===index);draw();}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();stage.classList.add('has-volume');
 const contextLost=e=>{e.preventDefault();lost=true;setPlaying(false);stage.classList.remove('has-volume');onLost?.();};canvas.addEventListener('webglcontextlost',contextLost);
 return {state,setModel,setPlaying,draw,dispose(){disposed=true;observer.disconnect();canvas.removeEventListener('webglcontextlost',contextLost);cleanup();}};
}
