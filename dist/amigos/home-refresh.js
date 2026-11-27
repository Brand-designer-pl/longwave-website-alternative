/* 0471ef0cc78bf239. Native controls first; premium-web-agent 1.0.0 motion-accessibility. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const catalog = document.querySelector('[data-home-catalog]');
  if (catalog) {
    const filters = catalog.querySelector('.home-trip-filters');
    const cards = [...catalog.querySelectorAll('.home-trip-card')];
    const dates = new Map(cards.map(card => [card, JSON.parse(card.dataset.tripDates)]));
    const animations = new Set();
    const stop = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
    if (filters) {
      filters.hidden = false;
      filters.addEventListener('click', event => {
        const button = event.target.closest('button[data-trip-month]');
        if (!button || button.getAttribute('aria-pressed') === 'true') return;
        stop();
        const month = button.dataset.tripMonth;
        filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        let count = 0;
        cards.forEach(card => {
          const label = dates.get(card)[month];
          card.hidden = !label;
          if (!label) return;
          card.querySelector('.home-trip-dates').textContent = label;
          if (!reduced.matches && card.animate) {
            const animation = card.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],
              {duration:360,delay:Math.min(count*55,220),easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'});
            animations.add(animation);
            animation.onfinish = () => {animation.cancel();animations.delete(animation);};
          }
          count++;
        });
        catalog.querySelector('.home-trip-count').textContent = `Wyjazdy: ${count} · ${button.textContent}`;
        window.ScrollTrigger?.refresh();
      });
    }
    catalog.addEventListener('focusin',stop);
    reduced.addEventListener('change',stop);
    window.addEventListener('pagehide',event => {stop();if(!event.persisted)reduced.removeEventListener('change',stop);});
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
