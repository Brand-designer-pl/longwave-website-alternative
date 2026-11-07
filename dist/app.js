'use strict';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const dialog=document.querySelector('#mobile-menu'), toggle=document.querySelector('.menu-toggle');
function closeMenu(){dialog.close(); toggle.setAttribute('aria-expanded','false');document.body.style.overflow='';toggle.focus();}
toggle.addEventListener('click',()=>{dialog.showModal();toggle.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';if(window.gsap&&!reduced.matches)gsap.fromTo(dialog.querySelectorAll('.menu-top, nav > details, .menu-bottom'),{opacity:0,y:16},{opacity:1,y:0,duration:.45,stagger:.06,clearProps:'all'});});
document.querySelector('.menu-close').addEventListener('click',closeMenu);
dialog.addEventListener('cancel',e=>{e.preventDefault();closeMenu();});
dialog.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.querySelectorAll('nav').forEach(nav=>nav.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)nav.querySelectorAll('details').forEach(other=>{if(other!==d)other.open=false;});})));
document.addEventListener('click',e=>{if(!e.target.closest('.desktop-nav'))document.querySelectorAll('.desktop-nav details').forEach(d=>d.open=false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.desktop-nav details').forEach(d=>d.open=false);});
const escapeHTML=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalog=null;
function renderOffers(filter='all'){
 if(!catalog)return;
 const stale=Date.now()-Date.parse(catalog.updatedAt)>86400000;
 const items=catalog.items.filter(t=>t.end>=new Date().toISOString().slice(0,10)&&(filter==='all'||t.category===filter)).slice(0,3);
 document.querySelector('#offers').innerHTML=items.map(t=>`<a class="trip-card" href="https://app.longwaveboards.com/"><div class="trip-image"><img src="${escapeHTML(t.image)}" alt="${escapeHTML(t.title)}" loading="lazy" width="720" height="480"><span class="trip-category">${escapeHTML(t.category)}</span></div><div class="trip-body"><p class="trip-place">${escapeHTML(t.place)}</p><h3>${escapeHTML(t.title)}</h3><p class="trip-date">${escapeHTML(t.dates)}</p><p class="trip-age">${escapeHTML(t.age)}</p><div class="trip-foot"><strong class="trip-price">${stale?'Sprawdź cenę':escapeHTML(t.priceLabel)}</strong><span class="trip-status">${stale?'W aplikacji':escapeHTML(t.status)}</span><svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></div></div></a>`).join('')||'<p>Sprawdź kolejne terminy w aplikacji LONGWAVE.</p>';
 window.ScrollTrigger?.refresh();
}
fetch('offers.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('catalog');return r.json();}).then(data=>{catalog=data;renderOffers();}).catch(()=>{document.querySelectorAll('.trip-status').forEach(el=>el.textContent='Potwierdź w aplikacji');});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b===button?'true':'false'));renderOffers(button.dataset.filter);}));
if(window.gsap&&window.ScrollTrigger){
 gsap.registerPlugin(ScrollTrigger);
 gsap.matchMedia().add({motion:'(prefers-reduced-motion: no-preference)',mobile:'(max-width: 767px)'},context=>{
  if(!context.conditions.motion)return;
  const mobile=context.conditions.mobile;
  gsap.from('.hero-line > span',{yPercent:110,opacity:0,duration:1.1,stagger:.12,ease:'power3.out'});
  gsap.from('.hero-enter',{y:20,opacity:0,duration:.8,delay:.35,stagger:.12,clearProps:'all'});
  document.querySelector('#offers').classList.add('reveal');
  if(mobile){
   document.querySelectorAll('.reveal').forEach(el=>{
    const below=el.getBoundingClientRect().top>innerHeight*.94;
    if(below)gsap.set(el,{opacity:0,y:20});
    // Stable scroll boundaries do not move with the animated element.
    // Reuse the same tweens; no continuous scrubbing or observer feedback.
    const opacity=gsap.quickTo(el,'opacity',{duration:.75,ease:'power2.inOut'});
    const move=gsap.quickTo(el,'y',{duration:.75,ease:'power2.inOut'});
    const show=()=>{opacity(1);move(0);};
    ScrollTrigger.create({trigger:el,start:'top 94%',end:'bottom 8%',
     onEnter:show,onEnterBack:show,
     onLeave:()=>{opacity(0);move(-16);},
     onLeaveBack:()=>{opacity(0);move(20);}
    });
   });
  }else{
  document.querySelectorAll('.reveal').forEach(el=>{
   const siblings=[...el.parentElement.children].filter(node=>node.classList.contains('reveal'));
   const stagger=Math.min(siblings.indexOf(el),3)*2;
   const distance=32;
   // One timeline owns both entrance and exit: no competing transforms.
   const tl=gsap.timeline({scrollTrigger:{trigger:el,start:()=>`top ${97-stagger}%`,end:'bottom 3%',scrub:.65,invalidateOnRefresh:true}});
   tl.fromTo(el,{y:distance,opacity:0},{y:0,opacity:1,duration:.26,ease:'power2.out'})
     .to(el,{y:0,opacity:1,duration:.56})
     .to(el,{y:-distance*.7,opacity:0,duration:.18,ease:'power1.in'});
  });
  }
  if(!mobile){
  document.querySelectorAll('.parallax').forEach(el=>gsap.fromTo(el,{yPercent:-3},{yPercent:3,ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:.5}}));
  document.querySelectorAll('.scene-panel, .closing').forEach(el=>{
   gsap.fromTo(el,{scale:.94,borderRadius:48},{scale:1,borderRadius:24,ease:'power1.out',scrollTrigger:{trigger:el,start:'top 95%',end:'top 25%',scrub:.4}});
  });
  }
  gsap.to('.hero-content',{y:-60,opacity:0,scrollTrigger:{trigger:'.hero',start:'bottom 45%',end:'bottom top',scrub:.5}});

 });
 document.querySelectorAll('.faq-item').forEach(el=>el.addEventListener('toggle',()=>ScrollTrigger.refresh()));
 window.addEventListener('load',()=>ScrollTrigger.refresh());
 document.fonts.ready.then(()=>ScrollTrigger.refresh());
 // Keyboard navigation must never land on a transparent entrance state.
 // CSS :focus-within reveals controls without killing their scroll timeline.
}

// Muted inline video progressively replaces the poster; playback never gates scrolling.
const heroVideo=document.querySelector('.hero-video');
let heroVisible=true;
function playHero(){
 if(reduced.matches||document.hidden||!heroVisible||dialog.open||!heroVideo.paused)return;
 if(!heroVideo.src){heroVideo.src=matchMedia('(max-width: 700px)').matches?'assets/hero-mobile-portrait.mp4':'assets/hero-desktop.mp4';heroVideo.muted=true;heroVideo.defaultMuted=true;heroVideo.load();}
 heroVideo.play().catch(()=>{ /* Keep the poster when the OS blocks autoplay. */ });
}
heroVideo.addEventListener('playing',()=>{heroVideo.classList.add('is-playing');});
new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible)playHero();else heroVideo.pause();},{threshold:0}).observe(document.querySelector('.hero'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)heroVideo.pause();else playHero();});
reduced.addEventListener('change',()=>{if(reduced.matches){heroVideo.pause();heroVideo.classList.remove('is-playing');}else playHero();});
// A first normal touch retries blocked playback without a dedicated start overlay.
function retryHero(){if(heroVideo.paused)playHero();}
document.addEventListener('touchstart',retryHero,{passive:true});
heroVideo.addEventListener('playing',()=>document.removeEventListener('touchstart',retryHero));
new MutationObserver(()=>{if(dialog.open)heroVideo.pause();else playHero();}).observe(dialog,{attributes:true,attributeFilter:['open']});
playHero();
