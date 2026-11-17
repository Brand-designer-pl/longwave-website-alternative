/* Original LONGWAVE product motion. Reference: owner-supplied recording, 17 Nov 2026.
   premium-web-agent 1.0.0: three-product / motion-accessibility / performance-budget,
   adapted to real transparent photographs, CSS perspective and a small water shader. */
(() => {
 const root=document.querySelector('.boards-showcase');if(!root)return;
 const base=new URL('.',document.currentScript.src),objects=[...root.querySelectorAll('[data-object]')],buttons=[...root.querySelectorAll('[data-board]')];
 const copy=root.querySelector('.boards-copy-motion'),pause=root.querySelector('.boards-motion-toggle'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 const models=[{name:'LONGWAVE BOARD 140',title:'Długa linia.<br>Swobodny ruch.',description:'Surferskie czucie na lądzie. Wydłużony bambusowy deck, charakterystyczny kształt i czarne pady LONGWAVE.'},{name:'LONGWAVE BOARD 100',title:'Krótsza forma.<br>Ta sama zajawka.',description:'Surferskie czucie na lądzie. Krótszy bambusowy deck z charakterystycznym czarnym padem LONGWAVE.'}];
 let current=0,requested=0,transition=null,float=null,water=null,userPaused=false,visible=true,alive=true,loading=false;
 const hasMotion=()=>!!window.gsap&&!motion.matches&&!userPaused;
 const canPlay=()=>alive&&visible&&!document.hidden&&!document.body.classList.contains('mobile-menu-open')&&hasMotion();
 function copyFor(index,announce=true){const model=models[index];root.querySelector('[data-board-name]').textContent=model.name;root.querySelector('[data-board-title]').innerHTML=model.title;root.querySelector('[data-board-description]').textContent=model.description;root.querySelector('[data-board-count]').textContent=`0${index+1} / 02`;buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));if(announce)root.querySelector('.boards-announcement').textContent='Wybrano '+model.name;}
 function stopFloat(){float?.kill();float=null;objects.forEach(o=>o.querySelector('.board-float').style.removeProperty('transform'));}
 function syncAmbient(){
  water?.setPlaying(canPlay());stopFloat();
  if(canPlay()&&!transition)float=gsap.to(objects[current].querySelector('.board-float'),{y:7,rotation:1.15,duration:3.8,ease:'sine.inOut',repeat:-1,yoyo:true});
  pause.disabled=motion.matches;pause.setAttribute('aria-pressed',String(userPaused));pause.querySelector('span').textContent=motion.matches?'Ruch ograniczony':userPaused?'Włącz ruch':'Wstrzymaj ruch';
 }
 function settle(index,announce=true){transition?.kill();transition=null;stopFloat();current=requested=index;objects.forEach((o,i)=>{o.hidden=i!==index;o.style.removeProperty('transform');o.style.removeProperty('opacity');});copy.style.removeProperty('transform');copy.style.removeProperty('opacity');copyFor(index,announce);syncAmbient();}
 async function select(index){
  index=(index+objects.length)%objects.length;requested=index;
  if(transition||index===current)return;
  if(!hasMotion()){settle(index);return;}
  // Decode before moving so even a cold-cache switch never reveals an empty product.
  if(loading)return;loading=true;
  try{await objects[index].querySelector('img').decode();}catch(_){loading=false;root.querySelector('.boards-announcement').textContent='Nie udało się wczytać zdjęcia. Spróbuj ponownie.';return;}
  loading=false;if(!alive)return;if(requested!==index){select(requested);return;}if(!hasMotion()){settle(index);return;}
  stopFloat();const outgoing=objects[current],incoming=objects[index];incoming.hidden=false;
  gsap.set(incoming,{rotationY:-88,rotationZ:7,x:25,opacity:0});
  transition=gsap.timeline({onComplete(){transition=null;current=index;outgoing.hidden=true;gsap.set([outgoing,incoming,copy],{clearProps:'transform,opacity'});syncAmbient();if(requested!==index)select(requested);}});
  transition.to(outgoing,{rotationY:88,rotationZ:-7,x:-25,opacity:0,duration:.46,ease:'power2.in'},0)
   .to(copy,{y:-10,opacity:0,duration:.2,ease:'power1.in'},0)
   .call(()=>copyFor(index),null,.3)
   .fromTo(copy,{y:12,opacity:0},{y:0,opacity:1,duration:.5,ease:'power2.out'},.33)
   .to(incoming,{rotationY:0,rotationZ:0,x:0,opacity:1,duration:.64,ease:'power3.out'},.28);
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
 async function loadWater(){if(water||waterLoading||motion.matches||!alive)return;waterLoading=true;try{const module=await import(new URL('boards-water.js',base));if(alive&&!motion.matches){water=module.createWater(root.querySelector('canvas'));syncAmbient();}}catch(_){/* The static pale-water background stays visible. */}finally{waterLoading=false;}}
 const startWater=()=>{if('requestIdleCallback'in window)requestIdleCallback(loadWater,{timeout:1500});else setTimeout(loadWater,300);};
 if(document.readyState==='complete')startWater();else window.addEventListener('load',startWater,{once:true});
 window.addEventListener('pagehide',event=>{alive=false;settle(requested,false);water?.setPlaying(false);if(!event.persisted){water?.dispose();water=null;intersection.disconnect();menuObserver.disconnect();motion.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);}});
 window.addEventListener('pageshow',e=>{if(e.persisted){alive=true;syncAmbient();loadWater();}});
 syncAmbient();
})();
