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
  water?.setPlaying(canPlay());volume?.setPlaying(canPlay());stopFloat();
  if(canPlay()&&!transition&&!volume)float=gsap.to(objects[current].querySelector('.board-float'),{y:7,rotation:1.15,duration:3.8,ease:'sine.inOut',repeat:-1,yoyo:true});
  pause.disabled=motion.matches;pause.setAttribute('aria-pressed',String(userPaused));pause.querySelector('span').textContent=motion.matches?'Ruch ograniczony':userPaused?'Włącz ruch':'Wstrzymaj ruch';
 }
 function settle(index,announce=true){transition?.kill();transition=null;stopFloat();current=requested=index;objects.forEach((o,i)=>{o.hidden=i!==index;o.style.removeProperty('transform');o.style.removeProperty('opacity');});copy.style.removeProperty('transform');copy.style.removeProperty('opacity');copyFor(index,announce);if(volume){Object.assign(volume.state,{turn:-.24,tilt:.075,roll:-.035,y:0,scale:1});volume.setModel(index);}syncAmbient();}
 async function select(index){
  index=(index+objects.length)%objects.length;requested=index;
  if(transition||index===current)return;
  if(!hasMotion()){settle(index);return;}
  // Decode before moving so even a cold-cache switch never reveals an empty product.
  if(loading)return;loading=true;
  try{await objects[index].querySelector('img').decode();}catch(_){loading=false;root.querySelector('.boards-announcement').textContent='Nie udało się wczytać zdjęcia. Spróbuj ponownie.';return;}
  loading=false;if(!alive)return;if(requested!==index){select(requested);return;}if(!hasMotion()){settle(index);return;}
  stopFloat();const outgoing=objects[current],incoming=objects[index];incoming.hidden=false;
  const finish=()=>{transition=null;current=index;outgoing.hidden=true;gsap.set([outgoing,incoming,copy],{clearProps:'transform,opacity'});if(volume){volume.state.turn=-.24;volume.setModel(index);}syncAmbient();if(requested!==index)select(requested);};
  transition=gsap.timeline({onComplete:finish});
  if(volume){
   // One uninterrupted revolution. Swap meshes edge-on so their silhouettes don't jump.
   let swapped=false;const turn=volume.state;
   transition.to(turn,{turn:Math.PI*2-.24,duration:2.05,ease:'power1.inOut',onUpdate(){if(!swapped&&turn.turn>=Math.PI*1.5){swapped=true;volume.setModel(index);}volume.draw();}},0)
    .to(turn,{tilt:-.12,roll:.045,duration:1,ease:'sine.inOut'},0)
    .to(turn,{tilt:.075,roll:-.035,duration:1.05,ease:'sine.inOut'},1);
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
 const stage=root.querySelector('.boards-stage');let touch=null;
 stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touch={x:e.clientX,y:e.clientY};});
 stage.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)select(requested+(dx<0?1:-1));});stage.addEventListener('pointercancel',()=>touch=null);
 pause.addEventListener('click',()=>{userPaused=!userPaused;if(userPaused)settle(requested,false);else syncAmbient();});
 const preference=()=>{settle(requested,false);if(!motion.matches)loadWater();};motion.addEventListener('change',preference);
 const visibility=()=>{if(document.hidden&&transition)settle(requested,false);syncAmbient();};document.addEventListener('visibilitychange',visibility);
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&transition)settle(requested,false);syncAmbient();},{threshold:0});intersection.observe(root);
 const menuObserver=new MutationObserver(()=>{if(document.body.classList.contains('mobile-menu-open')&&transition)settle(requested,false);syncAmbient();});menuObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
 let waterLoading=false;
 async function loadWater(){if(water||waterLoading||motion.matches||!alive)return;waterLoading=true;try{const module=await import(new URL('boards-water.js?v=volume-20261118',base));if(alive&&!motion.matches){water=module.createWater(root.querySelector('canvas'));syncAmbient();}}catch(_){/* The static pale-water background stays visible. */}finally{waterLoading=false;}}
 async function loadVolume(){
  if(volume||volumeLoading||!alive)return;volumeLoading=true;
  try{const module=await import(new URL('boards-volume.js?v=inset-wheels-20261118',base));
   const created=await module.createBoards(stage,()=>{const failed=volume;volume=null;settle(requested,false);failed?.dispose();});
   if(!created)return;if(!alive){created.dispose();return;}
   volume=created;settle(requested,false);
  }catch(_){/* Keep the original, accessible product photograph. */}finally{volumeLoading=false;}
 }
 const startWater=()=>{loadVolume();if('requestIdleCallback'in window)requestIdleCallback(loadWater,{timeout:1500});else setTimeout(loadWater,300);};
 if(document.readyState==='complete')startWater();else window.addEventListener('load',startWater,{once:true});
 window.addEventListener('pagehide',event=>{alive=false;settle(requested,false);water?.setPlaying(false);volume?.setPlaying(false);if(!event.persisted){volume?.dispose();volume=null;water?.dispose();water=null;intersection.disconnect();menuObserver.disconnect();motion.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);}});
 window.addEventListener('pageshow',e=>{if(e.persisted){alive=true;syncAmbient();loadWater();loadVolume();}});
 syncAmbient();
})();
