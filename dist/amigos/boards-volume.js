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
 const loader=new THREE.TextureLoader(),models=[],dimensions=[],textures=[],geometries=new Set(),materials=new Set();
 let disposed=false,lost=false,playing=false,raf=0,last=0,elapsed=0,current=0;
 const state={turn:-.24,tilt:.075,roll:-.035,sway:0,y:0,scale:1,modelWidth:1,modelLength:1};
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
   const group=new THREE.Group();scene.add(group);models.push(group);dimensions.push({length,width});
   // Smooth the photographed outline, excluding the wheels outside the bamboo deck.
   const smooth=p.samples.map((s,i,a)=>{
    const edge=[s[0],s[1]].map((value,k)=>{
     if(i<2||i>a.length-3)return value;
     let sum=0,count=0;for(let j=i-2;j<=i+2;j++){sum+=a[j][k];count++;}return sum/count;
    });
    // Keep the bevel inside the photographed bamboo, away from transparent edge pixels.
    return [edge[0]+.006,edge[1]-.006,s[2]];
   });
   const point=(x,y)=>new THREE.Vector2((x-.5)*width,(.5-y)*length);
   const first=smooth[0],lastRow=smooth.at(-1),center=(first[0]+first[1])/2;
   const shape=new THREE.Shape();
   const move=(x,y)=>{const p=point(x,y);shape.moveTo(p.x,p.y);};
   const line=(x,y)=>{const p=point(x,y);shape.lineTo(p.x,p.y);};
   const quad=(cx,cy,x,y)=>{const c=point(cx,cy),p=point(x,y);shape.quadraticCurveTo(c.x,c.y,p.x,p.y);};
   const curve=(ax,ay,bx,by,x,y)=>{const a=point(ax,ay),b=point(bx,by),p=point(x,y);shape.bezierCurveTo(a.x,a.y,b.x,b.y,p.x,p.y);};
   // Rounded nose and the photographed shallow swallow tail, rather than straight caps.
   const nose=first[2]+.002,tail=lastRow[2]-.002,notch=.973;
   move(center,nose);
   quad(center-.025,nose,smooth[1][0],smooth[1][2]);
   smooth.slice(2,-1).forEach(s=>line(s[0],s[2]));line(lastRow[0],tail);
   curve(lastRow[0]+.04,tail+.002,center-.06,notch,center,notch);
   curve(center+.06,notch,lastRow[1]-.04,tail+.002,lastRow[1],tail);
   smooth.slice(1,-1).reverse().forEach(s=>line(s[1],s[2]));
   quad(center+.025,nose,center,nose);shape.closePath();
   const uv={generateTopUV(g,v,a,b,c){return[a,b,c].map(i=>new THREE.Vector2(v[i*3]/width+.5,v[i*3+1]/length+.5));},generateSideWallUV(g,v,a,b,c,d){return[a,b,c,d].map(i=>new THREE.Vector2(v[i*3+1]/length+.5,v[i*3+2]/thickness));}};
   const geometry=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelThickness:.018,bevelSize:.006,bevelSegments:3,steps:1,UVGenerator:uv});
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
    const y=sign*length*(sign>0?.24:.31),truck=new THREE.Group();truck.position.set(0,y,-.08);group.add(truck);
    const plate=mesh(new THREE.BoxGeometry(.29,.43,.075),metal,truck);plate.position.z=-.02;
    const stem=mesh(new THREE.CylinderGeometry(.065,.09,.25,12),metal,truck);stem.rotation.x=Math.PI/2;stem.position.z=-.16;
    // Fit the complete tyre/bearing envelope under the narrowest local deck outline.
    // Extra inset keeps the wheels covered in the gently tilted resting view.
    const localRows=smooth.filter(s=>Math.abs((.5-s[2])*length-y)<=.28);
    const halfDeck=Math.min(...localRows.map(s=>Math.min(.5-s[0],s[1]-.5)*width));
    const tyreHalfWidth=.18,bearingHalfWidth=.1875;
    const wheelOffset=halfDeck-bearingHalfWidth-.13;
    const axle=mesh(new THREE.CylinderGeometry(.055,.055,wheelOffset*2,16),metal,truck);axle.rotation.z=Math.PI/2;axle.position.z=-.3;
    [-1,1].forEach(side=>{
     const wheel=new THREE.Group();wheel.position.set(side*wheelOffset,0,-.3);wheel.rotation.z=Math.PI/2;truck.add(wheel);
     // Lathed profile gives the tyre a round shoulder rather than a hard cylinder.
     const profile=[new THREE.Vector2(.105,-tyreHalfWidth),new THREE.Vector2(.19,-tyreHalfWidth),new THREE.Vector2(.215,-.155),new THREE.Vector2(.22,-.115),new THREE.Vector2(.22,.115),new THREE.Vector2(.215,.155),new THREE.Vector2(.19,tyreHalfWidth),new THREE.Vector2(.105,tyreHalfWidth)];
     mesh(new THREE.LatheGeometry(profile,24),rubber,wheel);
     mesh(new THREE.CylinderGeometry(.107,.107,tyreHalfWidth*2,20),hub,wheel);
     mesh(new THREE.CylinderGeometry(.039,.039,bearingHalfWidth*2,12),metal,wheel);
    });
   });
   group.visible=index===0;
  });
 }catch(error){cleanup();return null;}
 stage.append(canvas);
 function draw(){if(disposed||lost)return;const g=models[current];g.rotation.set(state.tilt+Math.sin(elapsed*.42)*.012,state.turn+Math.sin(elapsed*.33)*.018,state.roll+state.sway+Math.sin(elapsed*.38)*.009);g.position.y=state.y+Math.sin(elapsed*.6)*.035;g.scale.set(state.scale*state.modelWidth,state.scale*state.modelLength,state.scale);renderer.render(scene,camera);}
 function resize(){if(disposed||lost)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.position.z=Math.max(13.5,6.3/camera.aspect);camera.updateProjectionMatrix();draw();}
 function frame(now){if(!playing||disposed||lost)return;elapsed+=Math.min((now-last)/1000,.05);last=now;draw();raf=requestAnimationFrame(frame);}
 function setPlaying(value){playing=!!value&&!disposed&&!lost;cancelAnimationFrame(raf);if(playing){last=performance.now();raf=requestAnimationFrame(frame);}else draw();}
 function setModel(index,matchDimensions=false){
  state.modelLength=matchDimensions?dimensions[current].length/dimensions[index].length:1;
  state.modelWidth=matchDimensions?dimensions[current].width/dimensions[index].width:1;
  current=index;models.forEach((m,i)=>m.visible=i===index);draw();
 }
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();stage.classList.add('has-volume');
 const contextLost=e=>{e.preventDefault();lost=true;setPlaying(false);stage.classList.remove('has-volume');onLost?.();};canvas.addEventListener('webglcontextlost',contextLost);
 return {state,setModel,setPlaying,draw,dispose(){disposed=true;observer.disconnect();canvas.removeEventListener('webglcontextlost',contextLost);cleanup();}};
}
