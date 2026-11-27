/* premium-web-agent 1.0.0: scroll-reveal + motion-accessibility,
   adapted to vanilla GSAP with one IntersectionObserver and bounded stagger. */
(() => {
  if (!document.body.classList.contains('home-refresh') || !window.gsap ||
      !window.IntersectionObserver || !CSS.supports('translate', '0 1px')) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width:700px)');
  const seen = new WeakSet();
  const selectors = [
    'main > section > .kicker', 'main .section-heading > *',
    '.brand-card', '.brand-story > *', '.launch-section .campaign-copy > *',
    '.journey-intro > div:first-child > *', '.sketch-link', '.calendar-heading > *',
    '.home-calendar', '.taped-trip', '.home-slide', '.home-slider-controls',
    '.social-gallery', '.vibe-marquee', '#home-spot .photo-card',
    '.reviews-actions', '.reviews-row', '.community-title',
    '.app-copy > :not(ul)', '.app-copy > ul > li', '.instagram-grid > a',
    '#kontakt > div:first-child > :not(br)', '#kontakt .faq-item',
    '.footer-brand', '.home-footer-grid > *'
  ].join(',');
  // Animate visual blocks, never both a block and its descendants. The phone owns its own entrance.
  const candidates = [...document.querySelectorAll(selectors)];
  const targets = candidates.filter(el => !candidates.some(parent => parent !== el && parent.contains(el)));
  let observer, active = false;
  const pending = new Map();
  function restore(el, state) {
    for (const [name, value, priority] of state.styles) {
      if (value) el.style.setProperty(name, value, priority);
      else el.style.removeProperty(name);
    }
  }
  function finish(el) {
    const state = pending.get(el);
    if (!state) return;
    state.tween?.kill(); observer?.unobserve(el);
    restore(el, state); pending.delete(el); seen.add(el);
    el.dataset.homeEnter = 'done';
  }
  function visible(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top < innerHeight * .93 && r.bottom > 0 && r.left < innerWidth && r.right > 0;
  }
  function reveal(entries) {
    if (!active || document.hidden) return;
    try {
    const groups = new Map();
    entries.filter(entry => entry.isIntersecting && pending.has(entry.target))
      .map(entry => entry.target)
      .sort((a,b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
      .forEach(el => {
        const state = pending.get(el);
        if (state.tween) return;
        observer.unobserve(el);
        const group = el.closest('.brand-grid,.destination-sketches,.instagram-grid,.faq,section,footer');
        const index = groups.get(group) || 0; groups.set(group, index + 1);
        el.dataset.homeEnter = 'playing';
        state.tween = gsap.to(el, {
          '--enter-y': '0px', opacity: state.opacity,
          duration: mobile.matches ? .65 : .8,
          delay: Math.min(index * (mobile.matches ? .075 : .11), .44),
          ease: 'power3.out', onComplete: () => finish(el)
        });
      });
    } catch (_) {stop();} // A runtime failure must also restore every pending block.
  }
  function focus(event) {
    for (const el of pending.keys()) if (el === event.target || el.contains(event.target)) finish(el);
  }
  function visibility() {
    if (document.hidden) {
      for (const [el,state] of pending) if (state.tween) finish(el);
    } else reveal([...pending.keys()].filter(visible).map(target => ({target,isIntersecting:true})));
  }
  function stop() {
    active = false; observer?.disconnect(); observer = null;
    for (const [el,state] of pending) {
      if (state.tween) seen.add(el);
      state.tween?.kill(); restore(el,state); el.removeAttribute('data-home-enter');
    }
    pending.clear();
    document.removeEventListener('focusin',focus);
    document.removeEventListener('visibilitychange',visibility);
  }
  function mount() {
    stop();
    if (reduced.matches) return;
    active = true;
    try {
      observer = new IntersectionObserver(reveal,{rootMargin:'0px 0px -7% 0px',threshold:0});
      targets.forEach(el => {
        if (seen.has(el) || el.closest('[hidden]')) return;
        const r = el.getBoundingClientRect();
        // Deep links / scroll restoration stay immediately readable. Do not replay earlier content.
        if (r.bottom <= 0 || visible(el)) {seen.add(el);return;}
        const state = {
          opacity: getComputedStyle(el).opacity,
          styles: ['opacity','--enter-y'].map(name => [name,el.style.getPropertyValue(name),el.style.getPropertyPriority(name)])
        };
        pending.set(el,state); el.dataset.homeEnter = 'pending';
        // Individual translate leaves CSS rotations, hover transforms and slider tracks intact.
        gsap.set(el,{'--enter-y':(mobile.matches ? 26 : el.matches('.brand-card,.sketch-link,.taped-trip') ? 48 : 28)+'px',opacity:0});
        observer.observe(el);
      });
      document.addEventListener('focusin',focus);
      document.addEventListener('visibilitychange',visibility);
    } catch (_) {stop();} // Optional motion can never be required to read the page.
  }
  mount();
  reduced.addEventListener('change',mount);
  window.addEventListener('pagehide',stop);
  window.addEventListener('pageshow',event => {if(event.persisted) mount();});
})();
