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
 gsap.matchMedia().add('(prefers-reduced-motion: no-preference)',()=>{
  gsap.from('.hero-line > span',{yPercent:110,opacity:0,duration:1.1,stagger:.12,ease:'power3.out'});
  gsap.from('.hero-enter',{y:20,opacity:0,duration:.8,delay:.35,stagger:.12,clearProps:'all'});
  document.querySelectorAll('.reveal').forEach(el=>{
   gsap.fromTo(el,{y:30,opacity:0},{y:0,opacity:1,duration:.75,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 94%',toggleActions:'play none none reverse'}});
  });
  document.querySelectorAll('.section h2, .closing-content, .spot-intro').forEach(el=>{
   gsap.to(el,{y:-25,scrollTrigger:{trigger:el,start:'bottom 22%',end:'bottom top',scrub:.5}});
  });
  document.querySelectorAll('.parallax').forEach(el=>gsap.fromTo(el,{yPercent:-3},{yPercent:3,ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:.5}}));
  gsap.to('.hero-content',{y:-60,opacity:0,scrollTrigger:{trigger:'.hero',start:'bottom 45%',end:'bottom top',scrub:.5}});
 });
 document.querySelectorAll('.faq-item').forEach(el=>el.addEventListener('toggle',()=>ScrollTrigger.refresh()));
 window.addEventListener('load',()=>ScrollTrigger.refresh());
 document.fonts.ready.then(()=>ScrollTrigger.refresh());
 // Keyboard navigation must never land on a transparent entrance state.
 document.addEventListener('focusin',e=>{const el=e.target.closest('.reveal');if(el)gsap.to(el,{opacity:1,y:0,duration:0,overwrite:true});});
}
