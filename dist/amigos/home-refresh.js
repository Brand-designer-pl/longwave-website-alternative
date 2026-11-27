/* 0471ef0cc78bf239. Native controls first; premium-web-agent 1.0.0 motion-accessibility. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Shared liquid selection, adapted from the owner's 27 Nov video reference.
  // Only this small SVG path animates; no blur filter or permanent animation loop.
  function monthPanel(panel) {
    const buttons = [...panel.querySelectorAll('[data-trip-month]')];
    const strip = document.createElement('div'); strip.className = 'home-trip-months';
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('month-selection'); svg.setAttribute('aria-hidden','true');
    svg.innerHTML = '<defs><linearGradient id="month-ink" x2="0" y2="1"><stop stop-color="#292929"/><stop offset="1" stop-color="#080808"/></linearGradient></defs><path fill="url(#month-ink)"/>';
    const selectionPath = svg.querySelector('path');
    strip.append(svg); buttons.forEach(button => strip.append(button));
    const arrow = (direction,label) => {
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'month-step'; button.setAttribute('aria-label',label);
      button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction < 0 ? 'M14 5l-7 7 7 7' : 'M10 5l7 7-7 7'}"/></svg>`;
      button.addEventListener('click',() => buttons[Math.max(0,Math.min(buttons.length-1,selected+direction))].click());
      return button;
    };
    let selected = 0, frame = 0, last = 0;
    const previous = arrow(-1,'Poprzedni miesiąc'), next = arrow(1,'Następny miesiąc');
    panel.replaceChildren(previous,strip,next); panel.classList.add('has-liquid-selection');
    const state = {x:0,y:0,w:0,h:0}, velocity = {x:0,y:0,w:0,h:0};
    let target = {...state};
    const draw = () => {
      const speed = Math.hypot(velocity.x,velocity.y);
      const stretch = Math.min(18,speed*.018), tail = Math.min(26,Math.abs(velocity.x)*.035);
      const x = state.x-stretch/2, y = state.y+Math.min(3,speed*.003);
      const w = state.w+stretch, h = state.h-Math.min(6,speed*.006), r = Math.min(15,h/2), mid=y+h/2;
      const left = velocity.x>0 ? tail : 0, right = velocity.x<0 ? tail : 0;
      selectionPath.setAttribute('d',
        `M${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${mid-10}`+
        `C${x+w} ${mid-3} ${x+w+right} ${mid-7} ${x+w+right} ${mid}C${x+w+right} ${mid+7} ${x+w} ${mid+3} ${x+w} ${mid+10}`+
        `V${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}H${x+r}Q${x} ${y+h} ${x} ${y+h-r}V${mid+10}`+
        `C${x} ${mid+3} ${x-left} ${mid+7} ${x-left} ${mid}C${x-left} ${mid-7} ${x} ${mid-3} ${x} ${mid-10}V${y+r}Q${x} ${y} ${x+r} ${y}Z`);
    };
    const snap = () => {
      cancelAnimationFrame(frame); frame=0; last=0;
      Object.assign(state,target); Object.keys(velocity).forEach(key => velocity[key]=0); draw();
    };
    const tick = time => {
      const dt = Math.min((time-(last||time-16.67))/1000,.032); last=time;
      let moving=false;
      for (const key of Object.keys(state)) {
        velocity[key] += ((target[key]-state[key])*330-velocity[key]*25)*dt;
        state[key] += velocity[key]*dt;
        if (Math.abs(target[key]-state[key])>.08 || Math.abs(velocity[key])>.3) moving=true;
      }
      draw();
      if (moving) frame=requestAnimationFrame(tick); else snap();
    };
    const move = (animate=true) => {
      const rect=buttons[selected].getBoundingClientRect(), base=strip.getBoundingClientRect();
      target={x:rect.left-base.left,y:rect.top-base.top,w:rect.width,h:rect.height};
      svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
      previous.disabled=selected===0; next.disabled=selected===buttons.length-1;
      if (!animate || reduced.matches || document.hidden) snap();
      else if (!frame) {last=0;frame=requestAnimationFrame(tick);}
    };
    panel.addEventListener('click',event => {
      const index=buttons.indexOf(event.target.closest('[data-trip-month]'));
      if(index<0)return; selected=index; move();
    });
    strip.addEventListener('keydown',event => {
      const index=buttons.indexOf(event.target.closest('[data-trip-month]')); if(index<0)return;
      const indices={ArrowLeft:Math.max(0,index-1),ArrowRight:Math.min(buttons.length-1,index+1),Home:0,End:buttons.length-1};
      if(event.key in indices){event.preventDefault();buttons[indices[event.key]].focus();buttons[indices[event.key]].click();}
    });
    const resize = new ResizeObserver(() => move(false)); resize.observe(strip);
    const settle = () => move(false);
    const visibility = () => {if(document.hidden)snap();else move(false);};
    reduced.addEventListener('change',settle); document.addEventListener('visibilitychange',visibility);
    document.fonts?.ready.then(settle); move(false);
    window.addEventListener('pagehide',event => {
      snap(); if(!event.persisted){resize.disconnect();reduced.removeEventListener('change',settle);document.removeEventListener('visibilitychange',visibility);}
    });
  }
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
        filters.querySelectorAll('[data-trip-month]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
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
      monthPanel(filters);
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
