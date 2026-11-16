(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 650px)');
  const track = document.querySelector('[data-offers-track]');
  if (track) {
    const controls = document.querySelector('[data-offers-controls]');
    const prev = controls.querySelector('[data-prev]');
    const next = controls.querySelector('[data-next]');
    const status = controls.querySelector('[data-offers-status]');
    const cards = [...track.querySelectorAll('.trip-card')];
    const stops = () => cards.map(card => Math.min(track.scrollWidth - track.clientWidth,
      card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - parseFloat(getComputedStyle(track).paddingLeft)));
    const current = () => stops().reduce((best, x, i, all) =>
      Math.abs(x - track.scrollLeft) < Math.abs(all[best] - track.scrollLeft) ? i : best, 0);
    const update = () => {
      controls.hidden = !mobile.matches || cards.length < 2;
      prev.disabled = track.scrollLeft < 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      status.textContent = `Oferta ${current() + 1} z ${cards.length}`;
    };
    const move = direction => track.scrollTo({left: stops()[Math.max(0, Math.min(cards.length - 1, current() + direction))], behavior: reduced.matches ? 'instant' : 'smooth'});
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('focusin', event => {
      const index = cards.indexOf(event.target.closest('.trip-card'));
      if (mobile.matches && index >= 0) track.scrollTo({left:stops()[index], behavior:'instant'});
    });
    // Native touch scrolling remains owned by the browser.
    let frame = 0;
    track.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(() => {frame = 0; update();});
    }, {passive:true});
    new ResizeObserver(update).observe(track);
    mobile.addEventListener('change', update);
    update();
  }

  const marks = [...document.querySelectorAll('[data-surf-mark]')];
  if (!marks.length || !window.gsap || !window.ScrollTrigger) return;
  const base = new URL('.', document.currentScript.src);
  let player;
  const loadPlayer = () => player ||= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('../vendor/lottie_light.min.js', base);
    script.onload = () => resolve(window.lottie);
    script.onerror = reject;
    document.head.append(script);
  });
  const data = new Map();
  const loadArt = name => {
    if (!data.has(name)) data.set(name, fetch(new URL(`art/${name}.json`, base)).then(r => {
      if (!r.ok) throw new Error('Artwork unavailable');
      return r.json();
    }));
    return data.get(name);
  };
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    let active = true;
    const dispose = [];
    const observer = new IntersectionObserver(entries => entries.forEach(async entry => {
      if (!entry.isIntersecting) return;
      const mark = entry.target;
      observer.unobserve(mark);
      try {
        const [lottie, art] = await Promise.all([loadPlayer(), loadArt(mark.dataset.surfMark)]);
        if (!active) return;
        const container = mark.querySelector('.surf-mark-player');
        const animation = lottie.loadAnimation({container, renderer:'svg', autoplay:false, loop:false,
          animationData:JSON.parse(JSON.stringify(art)), rendererSettings:{progressiveLoad:false}});
        let tween;
        dispose.push(() => {tween?.scrollTrigger?.kill(); tween?.kill(); animation.destroy(); mark.classList.remove('is-drawn');});
        animation.addEventListener('DOMLoaded', () => {
          if (!active) return;
          const playhead = {frame:0};
          animation.goToAndStop(0, true);
          mark.classList.add('is-drawn');
          tween = gsap.to(playhead, {frame:animation.totalFrames-1, ease:'none',
            onUpdate:() => animation.goToAndStop(playhead.frame, true),
            scrollTrigger:{trigger:mark, start:'top 92%', end:'top 38%', scrub:true}});
        });
      } catch (_) { /* The authored static SVG stays visible if animation cannot load. */ }
    }), {rootMargin:'180px'});
    marks.forEach(mark => observer.observe(mark));
    return () => {active = false; observer.disconnect(); dispose.forEach(fn => fn());};
  });
})();
