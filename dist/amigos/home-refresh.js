/* 0471ef0cc78bf239. Native controls first; premium-web-agent 1.0.0 motion-accessibility. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const calendar = document.querySelector('[data-home-calendar]');
  if (calendar) {
    const months = [...calendar.querySelectorAll('details')];
    const nav = document.createElement('div'); nav.className = 'calendar-nav'; nav.setAttribute('role','group'); nav.setAttribute('aria-label','Wybierz miesiąc');
    const panels = document.createElement('div'); panels.className = 'calendar-panels';
    const buttons = new Map();
    let selected = null, animation = null;
    const clear = element => ['opacity','visibility','transform'].forEach(name => element.style.removeProperty(name));
    const resetContent = month => { clear(month.querySelector('.calendar-panel')); month.querySelectorAll('.calendar-panel h4,.calendar-term').forEach(clear); };
    const accessibility = () => months.forEach(month => {
      const active = month === selected;
      buttons.get(month).setAttribute('aria-expanded',String(active));
      month.inert = !active; month.setAttribute('aria-hidden',String(!active));
    });
    const finish = () => {
      animation?.kill(); animation = null;
      months.forEach(month => { month.open = month === selected; resetContent(month); });
      panels.classList.remove('is-animating'); panels.style.removeProperty('height'); accessibility();
    };
    const show = (month, animate = true) => {
      if (selected === month) return;
      const height = panels.getBoundingClientRect().height, previous = selected;
      animation?.kill(); animation = null; selected = month;
      if (previous?.contains(document.activeElement)) buttons.get(month || previous).focus({preventScroll:true});
      accessibility();
      if (!animate || reduced.matches || !window.gsap) { finish(); return; }
      months.forEach(item => { item.open = item === previous || item === month; if (item !== previous) resetContent(item); });
      panels.style.height = `${height}px`; panels.classList.add('is-animating');
      const nextHeight = month ? month.getBoundingClientRect().height : 0;
      animation = gsap.timeline({onComplete:finish});
      animation.to(panels,{height:nextHeight,duration:month ? .45 : .36,ease:'power2.inOut'},0);
      if (previous) animation.to(previous.querySelector('.calendar-panel'),{autoAlpha:0,duration:.15,ease:'power1.out'},0);
      if (month) {
        const panel = month.querySelector('.calendar-panel');
        animation.fromTo(panel,{autoAlpha:0},{autoAlpha:1,duration:.22,ease:'power1.out'},previous ? .13 : 0);
        animation.fromTo(panel.querySelectorAll('h4,.calendar-term'),{y:12,opacity:0},{y:0,opacity:1,duration:.32,stagger:.05,ease:'power2.out'},previous ? .16 : .08);
      }
    };
    calendar.classList.add('is-enhanced');
    calendar.style.setProperty('--months', Math.min(6, months.length));
    months.forEach((month,index) => {
      const summary = month.querySelector('summary');
      const button = document.createElement('button'); button.type='button'; button.innerHTML=summary.innerHTML;
      button.id = `${month.id}-trigger`; button.setAttribute('aria-expanded','false'); button.setAttribute('aria-controls',month.id);
      month.setAttribute('aria-labelledby',button.id);buttons.set(month,button);nav.append(button);panels.append(month);
      button.addEventListener('click', () => show(selected === month ? null : month));
      button.addEventListener('keydown', event => {
        const directions = {ArrowLeft:(index-1+months.length)%months.length,ArrowRight:(index+1)%months.length,Home:0,End:months.length-1};
        if (event.key in directions) { event.preventDefault();buttons.get(months[directions[event.key]]).focus(); }
      });
    });
    calendar.append(nav,panels);
    calendar.addEventListener('keydown',event => {if(event.key === 'Escape' && selected){event.preventDefault();show(null);}});
    if (months.length) show(months.find(m => m.querySelector('.calendar-term')) || months[0],false);
    let width = panels.clientWidth;
    const resize = new ResizeObserver(() => {if(panels.clientWidth !== width){width=panels.clientWidth;finish();}});resize.observe(panels);
    const preference = () => finish();reduced.addEventListener('change',preference);
    document.fonts?.ready.then(() => {if(animation)finish();});
    window.addEventListener('pagehide',event => {finish();if(!event.persisted){resize.disconnect();reduced.removeEventListener('change',preference);}});
  }
  document.querySelectorAll('[data-home-slider]').forEach(slider => {
    const track = slider.querySelector('.home-slides');
    const cards = [...track.children];
    const controls = slider.querySelector('.home-slider-controls');
    const previous = controls.querySelector('[data-slide-prev]');
    const next = controls.querySelector('[data-slide-next]');
    const status = controls.querySelector('[data-slide-status]');
    const current = () => cards.reduce((best, card, i) => Math.abs(card.offsetLeft-track.offsetLeft-track.scrollLeft) < Math.abs(cards[best].offsetLeft-track.offsetLeft-track.scrollLeft) ? i : best, 0);
    const go = n => track.scrollTo({left:cards[Math.max(0,Math.min(cards.length-1,n))].offsetLeft-track.offsetLeft,behavior:reduced.matches?'instant':'smooth'});
    const update = () => { const n = current(); status.textContent = `${n+1} / ${cards.length}`; previous.disabled = n === 0; next.disabled = n === cards.length-1; };
    controls.hidden = false;
    previous.addEventListener('click', () => go(current()-1));
    next.addEventListener('click', () => go(current()+1));
    track.addEventListener('keydown', event => { if (event.target !== track) return; if (['ArrowLeft','ArrowRight'].includes(event.key)) {event.preventDefault(); go(current()+(event.key==='ArrowRight'?1:-1));} });
    let tick;
    track.addEventListener('scroll', () => { cancelAnimationFrame(tick); tick=requestAnimationFrame(update); }, {passive:true});
    const resize = new ResizeObserver(update); resize.observe(track); update();
    window.addEventListener('pagehide', () => cancelAnimationFrame(tick));
  });
  const social = document.querySelector('.social-section');
  if (!social) return;
  const video = social.querySelector('video');
  const button = social.querySelector('[data-social-pause]');
  const menu = document.querySelector('#fullscreen-menu');
  let visible = false, paused = false, active = true, pending = false;
  const motionOK = () => !paused && !reduced.matches && !navigator.connection?.saveData;
  const update = () => {
    const play = motionOK() && visible && active && !document.hidden && !menu?.open;
    social.classList.toggle('social-active',play);
    social.classList.toggle('social-paused',!play);
    button.textContent = paused ? 'Wznów ruch' : 'Zatrzymaj ruch';
    button.setAttribute('aria-pressed',String(paused));
    button.hidden = reduced.matches || !!navigator.connection?.saveData;
    if (!play) { video.pause(); return; }
    if (!video.getAttribute('src')) { video.src=video.dataset.loopSrc; video.muted=true; video.load(); }
    if (!pending && video.paused) {pending=true;video.play().then(()=>{if(!(motionOK()&&visible&&active&&!document.hidden&&!menu?.open))video.pause();}).catch(()=>{}).finally(()=>pending=false);}
  };
  button.addEventListener('click',()=>{paused=!paused;update();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();}).observe(social);
  if(menu)new MutationObserver(update).observe(menu,{attributes:true,attributeFilter:['open']});
  reduced.addEventListener('change',update);
  navigator.connection?.addEventListener('change',update);
  document.addEventListener('visibilitychange',update);
  window.addEventListener('pagehide',()=>{active=false;update();});
  window.addEventListener('pageshow',()=>{active=true;update();});
  update();
})();

/* Sticky booking and touch-first gallery. No global scroll interception. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const bar = document.querySelector('.home-booking');
  const menu = document.querySelector('#fullscreen-menu');
  if (bar) {
    const footer = document.querySelector('.home-footer');
    let footerVisible = false, frame = 0;
    const update = () => { frame = 0; bar.hidden = scrollY < 90 || footerVisible || !!menu?.open; };
    const request = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener('scroll', request, {passive:true});
    addEventListener('resize', request, {passive:true});
    if (footer) new IntersectionObserver(([entry]) => {footerVisible = entry.isIntersecting; update();}).observe(footer);
    if (menu) new MutationObserver(update).observe(menu,{attributes:true,attributeFilter:['open']});
    addEventListener('pagehide',()=>cancelAnimationFrame(frame));
    update();
  }
  const gallery = document.querySelector('.social-filmstrip');
  const controls = document.querySelector('.social-gallery-controls');
  if (gallery && controls) {
    const previous=controls.querySelector('[data-gallery-prev]'), next=controls.querySelector('[data-gallery-next]'), status=controls.querySelector('[data-gallery-status]');
    const cards=[...gallery.children];
    const update=()=>{previous.disabled=gallery.scrollLeft<2;next.disabled=gallery.scrollLeft+gallery.clientWidth>=gallery.scrollWidth-2;status.textContent=`${Math.min(cards.length,Math.round(gallery.scrollLeft/cards[0].getBoundingClientRect().width)+1)} / ${cards.length}`;};
    const go=direction=>gallery.scrollBy({left:direction*cards[0].getBoundingClientRect().width,behavior:reduced.matches?'instant':'smooth'});
    previous.addEventListener('click',()=>go(-1));next.addEventListener('click',()=>go(1));
    gallery.addEventListener('keydown',event=>{if(event.target===gallery&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();go(event.key==='ArrowLeft'?-1:1);}});
    gallery.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(gallery);controls.hidden=false;update();
  }
})();
