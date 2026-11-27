/* Original LONGWAVE product motion. Reference: owner-supplied recording, 17 Nov 2026.
   premium-web-agent 1.0.0: three-product / motion-accessibility / performance-budget,
   adapted to photo-mapped 3D geometry and a lightweight reflective water surface. */
(() => {
 const root=document.querySelector('.boards-showcase');if(!root)return;
 const base=new URL('.',document.currentScript.src),objects=[...root.querySelectorAll('[data-object]')],buttons=[...root.querySelectorAll('[data-board]')];
 const copy=root.querySelector('.boards-copy-motion'),pause=root.querySelector('.boards-motion-toggle'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 const models=[{name:'LONGWAVE BOARD 140',title:'Długa linia.<br>Swobodny ruch.',description:'Surferskie czucie na lądzie. Wydłużony bambusowy deck, charakterystyczny kształt i czarne pady LONGWAVE.'},{name:'LONGWAVE BOARD 100',title:'Krótsza forma.<br>Ta sama zajawka.',description:'Surferskie czucie na lądzie. Krótszy bambusowy deck z charakterystycznym czarnym padem LONGWAVE.'}];
 let current=0,requested=0,transition=null,float=null,water=null,volume=null,volumeLoading=false,userPaused=false,visible=true,alive=true,loading=false;
 const hasMotion=()=>!!window.gsap&&!motion.matches&&!userPaused;
 const canPlay=()=>alive&&visible&&!document.hidden&&!document.body.classList.contains('mobile-menu-open')&&hasMotion();
 function copyFor(index,announce=true){const model=models[index];root.querySelector('[data-board-name]').textContent=model.name;root.querySelector('[data-board-title]').innerHTML=model.title;root.querySelector('[data-board-description]').textContent=model.description;root.querySelector('[data-board-count]').textContent=`0${index+1} / 02`;buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));if(announce)root.querySelector('.boards-announcement').textContent='Wybrano '+model.name;}
 function stopFloat(){float?.kill();float=null;objects.forEach(o=>o.querySelector('.board-float').style.removeProperty('transform'));}
 function syncAmbient(){
  if(!canInspect())stopDrag();
  water?.setPlaying(canPlay());volume?.setPlaying(canPlay()&&!drag);stopFloat();
  if(canPlay()&&!transition&&!volume)float=gsap.to(objects[current].querySelector('.board-float'),{y:7,rotation:1.15,duration:3.8,ease:'sine.inOut',repeat:-1,yoyo:true});
  pause.disabled=motion.matches;pause.setAttribute('aria-pressed',String(userPaused));pause.querySelector('span').textContent=motion.matches?'Ruch ograniczony':userPaused?'Włącz ruch':'Wstrzymaj ruch';
 }
 function settle(index,announce=true){stopDrag();transition?.kill();transition=null;stopFloat();current=requested=index;objects.forEach((o,i)=>{o.hidden=i!==index;o.style.removeProperty('transform');o.style.removeProperty('opacity');});copy.style.removeProperty('transform');copy.style.removeProperty('opacity');copyFor(index,announce);if(volume){Object.assign(volume.state,{turn:-.24,tilt:.075,roll:-.035,y:0,scale:1});volume.setModel(index);}syncAmbient();}
 async function select(index){
  index=(index+objects.length)%objects.length;requested=index;
  if(transition||index===current)return;
  stopDrag();
  if(!hasMotion()){settle(index);return;}
  // Decode before moving so even a cold-cache switch never reveals an empty product.
  if(loading)return;loading=true;
  try{await objects[index].querySelector('img').decode();}catch(_){loading=false;root.querySelector('.boards-announcement').textContent='Nie udało się wczytać zdjęcia. Spróbuj ponownie.';return;}
  loading=false;if(!alive)return;stopDrag();if(requested!==index){select(requested);return;}if(!hasMotion()){settle(index);return;}
  stopFloat();const wake=boardWakePoint();if(canPlay())water?.disturb(wake.x,wake.y,.7);const outgoing=objects[current],incoming=objects[index];incoming.hidden=false;
  const finish=()=>{transition=null;current=index;outgoing.hidden=true;gsap.set([outgoing,incoming,copy],{clearProps:'transform,opacity'});if(volume){volume.state.turn=-.24;volume.setModel(index);}syncAmbient();if(requested!==index)select(requested);};
  transition=gsap.timeline({onComplete:finish});
  if(volume){
   // Brisk continuous spin; match dimensions at the edge-on swap, then ease to the new shape.
   let swapped=false,swapAngle=0,fromWidth=1,fromLength=1;const turn=volume.state;
   const start=turn.turn,cycle=Math.PI*2;
   let end=-.24+(Math.floor((start+.24)/cycle)+1)*cycle;if(end-start<Math.PI)end+=cycle;
   const edge=Math.PI/2+(Math.floor((start-Math.PI/2)/Math.PI)+1)*Math.PI;
   transition.to(turn,{turn:end,duration:1.25,ease:'power2.inOut',onUpdate(){
    if(!swapped&&turn.turn>=edge){
     swapped=true;swapAngle=turn.turn;volume.setModel(index,true);
     fromWidth=turn.modelWidth;fromLength=turn.modelLength;
    }
    if(swapped){const p=Math.min(1,Math.max(0,(turn.turn-swapAngle)/(end-swapAngle))),blend=p*p*(3-2*p);
     turn.modelWidth=fromWidth+(1-fromWidth)*blend;turn.modelLength=fromLength+(1-fromLength)*blend;
    }
    if(canPlay())water?.stir(wake.x,wake.y,turn.turn,Math.min(1,(turn.turn-start)/(end-start)));
    volume.draw();
   }},0)
    .to(turn,{tilt:-.16,roll:.065,y:.08,duration:.44,ease:'sine.inOut'},0)
    .to(turn,{tilt:.075,roll:-.035,y:0,duration:.81,ease:'power2.out'},.44);
  }else{
   // A graceful photographic fallback, never a flat photograph pretending to be a 3D spin.
   gsap.set(incoming,{opacity:0});
   transition.to(outgoing,{opacity:0,duration:.35},0).to(incoming,{opacity:1,duration:.5},.25);
  }
  transition.to(copy,{y:-8,opacity:0,duration:.2,ease:'power1.in'},0)
   .call(()=>copyFor(index),null,.35)
   .fromTo(copy,{y:10,opacity:0},{y:0,opacity:1,duration:.5,ease:'power2.out'},.38);
 }
 root.classList.add('boards-enhanced');root.querySelectorAll('.boards-controls').forEach(e=>e.hidden=false);
 buttons.forEach((button,index)=>button.addEventListener('click',()=>select(index)));
 root.querySelector('[data-board-prev]').addEventListener('click',()=>select(requested-1));root.querySelector('[data-board-next]').addEventListener('click',()=>select(requested+1));
 root.querySelector('.boards-models').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const index=(requested+(event.key==='ArrowRight'?1:-1)+2)%2;buttons[index].focus();select(index);}});
 const stage=root.querySelector('.boards-stage');let touch=null,drag=null,poseTween=null,suppressClickUntil=0;
 const canInspect=()=>alive&&visible&&!document.hidden&&!document.body.classList.contains('mobile-menu-open');
 function stopDrag(){
  poseTween?.kill();poseTween=null;
  const held=drag;drag=null;stage.classList.remove('is-dragging');
  if(held&&stage.hasPointerCapture(held.id))stage.releasePointerCapture(held.id);
  if(held)volume?.setPlaying(canPlay());
 }
 function pose(turn,tilt){
  if(!volume)return;poseTween?.kill();
  const draw=()=>{volume?.draw();if(canPlay()){const p=boardWakePoint();water?.stir(p.x,p.y,volume.state.turn,.5);}};
  if(hasMotion())poseTween=gsap.to(volume.state,{turn,tilt,duration:.16,ease:'power2.out',onUpdate:draw,onComplete(){poseTween=null;}});
  else{Object.assign(volume.state,{turn,tilt});volume.draw();}
 }
 const dragStart=e=>{
  if(e.pointerType!=='mouse'||e.button!==0||!e.isPrimary||!volume||transition||loading||!canInspect()||e.target.closest('button,a'))return;
  stopDrag();e.preventDefault();stage.focus({preventScroll:true});
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,turn:volume.state.turn,tilt:volume.state.tilt,width:stage.clientWidth,moved:false};
  stage.setPointerCapture(e.pointerId);stage.classList.add('is-dragging');volume.setPlaying(false);
 };
 const dragMove=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!(e.buttons&1)){dragEnd(e);return;}
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.hypot(dx,dy)>3)drag.moved=true;
  if(drag.moved)pose(drag.turn+dx/drag.width*Math.PI*2,Math.max(-.65,Math.min(.65,drag.tilt+dy/drag.width*1.6)));
 };
 const dragEnd=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(drag.moved)suppressClickUntil=performance.now()+400;
  const id=drag.id;drag=null;stage.classList.remove('is-dragging');
  if(stage.hasPointerCapture(id))stage.releasePointerCapture(id);
  volume?.setPlaying(canPlay());
 };
 const dragCancel=()=>{stopDrag();volume?.setPlaying(canPlay());};
 const rotateKey=e=>{
  if(e.target!==stage||!volume||transition||loading||!canInspect())return;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;
  e.preventDefault();stopDrag();
  const turn=volume.state.turn+(e.key==='ArrowLeft'?-.3:e.key==='ArrowRight'?.3:0);
  const tilt=Math.max(-.65,Math.min(.65,volume.state.tilt+(e.key==='ArrowUp'?-.15:e.key==='ArrowDown'?.15:0)));
  pose(e.key==='Home'?-.24:turn,e.key==='Home'?.075:tilt);
 };
 stage.addEventListener('pointerdown',dragStart);stage.addEventListener('pointermove',dragMove);
 stage.addEventListener('pointerup',dragEnd);stage.addEventListener('pointercancel',dragCancel);
 const captureLost=e=>{if(drag&&e.pointerId===drag.id)dragCancel();};
 stage.addEventListener('lostpointercapture',captureLost);
 stage.addEventListener('keydown',rotateKey);window.addEventListener('blur',dragCancel);
 function waterPoint(x,y){const r=root.getBoundingClientRect();return {x:(x-r.left)/r.width,y:(y-r.top)/r.height};}
 function boardWakePoint(){const r=stage.getBoundingClientRect();return waterPoint(r.left+r.width*.5,r.top+r.height*.46);}
 let lastPointer=0,previousPointer=null;
 const pointerMove=e=>{
  if(e.pointerType==='touch'||!canPlay()||!water)return;
  const now=performance.now();if(now-lastPointer<65)return;
  if(previousPointer&&Math.hypot(e.clientX-previousPointer.x,e.clientY-previousPointer.y)<5)return;
  lastPointer=now;previousPointer={x:e.clientX,y:e.clientY};const p=waterPoint(e.clientX,e.clientY);water.disturb(p.x,p.y,.22);
 };
 const waterClick=e=>{if(stage.contains(e.target)&&performance.now()<suppressClickUntil)return;if(!canPlay()||!water||e.button!==0||e.target.closest('[data-board],[data-board-prev],[data-board-next],.boards-motion-toggle'))return;const p=waterPoint(e.clientX,e.clientY);water.disturb(p.x,p.y,.85);};
 const pointerLeave=()=>{previousPointer=null;};
 root.addEventListener('pointermove',pointerMove,{passive:true});root.addEventListener('click',waterClick,{passive:true});root.addEventListener('pointerleave',pointerLeave);

 stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touch={x:e.clientX,y:e.clientY};});
 stage.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)select(requested+(dx<0?1:-1));});stage.addEventListener('pointercancel',()=>touch=null);
 pause.addEventListener('click',()=>{userPaused=!userPaused;if(userPaused)settle(requested,false);else syncAmbient();});
 const preference=()=>{settle(requested,false);if(!motion.matches)loadWater();};motion.addEventListener('change',preference);
 const visibility=()=>{if(document.hidden&&transition)settle(requested,false);syncAmbient();};document.addEventListener('visibilitychange',visibility);
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&transition)settle(requested,false);syncAmbient();},{threshold:0});intersection.observe(root);
 const menuObserver=new MutationObserver(()=>{if(document.body.classList.contains('mobile-menu-open')&&transition)settle(requested,false);syncAmbient();});menuObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
 let waterLoading=false;
 async function loadWater(){if(water||waterLoading||motion.matches||!alive)return;waterLoading=true;try{const module=await import(new URL('boards-water.js?v=interactive-water-20261127',base));if(alive&&!motion.matches){water=module.createWater(root.querySelector('canvas'),()=>{const old=water;water=null;old?.dispose();loadWater();});syncAmbient();}}catch(_){/* The static pale-water background stays visible. */}finally{waterLoading=false;}}
 async function loadVolume(){
  if(volume||volumeLoading||!alive)return;volumeLoading=true;
  try{const module=await import(new URL('boards-volume.js?v=deck-finish-20261127',base));
   const created=await module.createBoards(stage,()=>{const failed=volume;volume=null;stage.removeAttribute('tabindex');stage.removeAttribute('aria-label');stage.removeAttribute('role');settle(requested,false);failed?.dispose();});
   if(!created)return;if(!alive){created.dispose();return;}
   volume=created;stage.tabIndex=0;stage.setAttribute('role','group');stage.setAttribute('aria-label','Model deski 3D. Przeciągnij myszką, aby obrócić. Klawiatura: strzałki obracają, Home przywraca widok.');settle(requested,false);
  }catch(_){/* Keep the original, accessible product photograph. */}finally{volumeLoading=false;}
 }
 const startWater=()=>{loadVolume();if('requestIdleCallback'in window)requestIdleCallback(loadWater,{timeout:1500});else setTimeout(loadWater,300);};
 if(document.readyState==='complete')startWater();else window.addEventListener('load',startWater,{once:true});
 window.addEventListener('pagehide',event=>{alive=false;settle(requested,false);water?.setPlaying(false);volume?.setPlaying(false);if(!event.persisted){volume?.dispose();volume=null;water?.dispose();water=null;stage.removeEventListener('pointerdown',dragStart);stage.removeEventListener('pointermove',dragMove);stage.removeEventListener('pointerup',dragEnd);stage.removeEventListener('pointercancel',dragCancel);stage.removeEventListener('keydown',rotateKey);stage.removeEventListener('lostpointercapture',captureLost);window.removeEventListener('blur',dragCancel);root.removeEventListener('pointermove',pointerMove);root.removeEventListener('click',waterClick);root.removeEventListener('pointerleave',pointerLeave);intersection.disconnect();menuObserver.disconnect();motion.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);}});
 window.addEventListener('pageshow',e=>{if(e.persisted){alive=true;syncAmbient();loadWater();loadVolume();}});
 syncAmbient();
})();
