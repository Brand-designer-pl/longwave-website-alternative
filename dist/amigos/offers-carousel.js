(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 650px)');
  document.querySelectorAll('[data-offers-track]').forEach(track => {
    const section = track.closest('section');
    const controls = section.querySelector('[data-offers-controls]');
    if (!controls) return;
    const prev = controls.querySelector('[data-prev]');
    const next = controls.querySelector('[data-next]');
    const status = controls.querySelector('[data-offers-status]');
    const cards = [...track.querySelectorAll('.trip-card')];
    const isCarousel = () => mobile.matches || section.classList.contains('destination-offers');
    const stops = () => cards.map(card => Math.min(track.scrollWidth-track.clientWidth,
      card.getBoundingClientRect().left-track.getBoundingClientRect().left+track.scrollLeft-parseFloat(getComputedStyle(track).paddingLeft)));
    const current = () => stops().reduce((best,x,i,all) => Math.abs(x-track.scrollLeft)<Math.abs(all[best]-track.scrollLeft)?i:best,0);
    const update = () => {
      controls.hidden = !isCarousel() || cards.length<2 || track.scrollWidth<=track.clientWidth+2;
      prev.disabled = track.scrollLeft<2;
      next.disabled = track.scrollLeft>=track.scrollWidth-track.clientWidth-2;
      const index = next.disabled ? cards.length-1 : current();
      status.textContent = `Termin ${index+1} z ${cards.length}`;
    };
    const move = direction => {
      const positions = stops();
      // At the desktop end, several cards may share one clamped stop.
      const target = direction>0 ? positions.find(x=>x>track.scrollLeft+2) : [...positions].reverse().find(x=>x<track.scrollLeft-2);
      if (target !== undefined) track.scrollTo({left:target,behavior:reduced.matches?'instant':'smooth'});
    };
    prev.addEventListener('click',()=>move(-1)); next.addEventListener('click',()=>move(1));
    track.addEventListener('focusin',event=>{
      const index=cards.indexOf(event.target.closest('.trip-card'));
      if (isCarousel()&&index>=0) track.scrollTo({left:stops()[index],behavior:'instant'});
    });
    let frame=0;
    track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;update();});},{passive:true});
    new ResizeObserver(update).observe(track); mobile.addEventListener('change',update); update();
  });
})();
