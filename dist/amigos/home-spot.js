(() => {
  const track = document.querySelector('.spot-gallery');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (track) {
    const slides = [...track.querySelectorAll('figure')];
    const controls = document.querySelector('.spot-gallery-controls');
    const prev = controls.querySelector('[data-spot-prev]');
    const next = controls.querySelector('[data-spot-next]');
    const count = controls.querySelector('[data-spot-count]');
    let index = 0, frame;
    const positions = () => slides.map(slide => slide.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft);
    const update = () => {
      const offsets = positions();
      index = offsets.reduce((best, offset, i) => Math.abs(offset - track.scrollLeft) < Math.abs(offsets[best] - track.scrollLeft) ? i : best, 0);
      const label = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      if (count.textContent !== label) count.textContent = label;
      prev.disabled = index === 0;
      next.disabled = index === slides.length - 1;
    };
    const move = step => track.scrollTo({left: positions()[Math.max(0, Math.min(slides.length - 1, index + step))], behavior: reduced.matches ? 'auto' : 'smooth'});
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);}
    });
    const queue = () => {cancelAnimationFrame(frame); frame = requestAnimationFrame(update);};
    track.addEventListener('scroll', queue, {passive: true});
    window.addEventListener('resize', queue, {passive: true});
    controls.hidden = false;
    update();
  }
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const motion = gsap.matchMedia();
  motion.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from('[data-spot-hero]', {y: 18, opacity: .6, duration: .9, stagger: .1, ease: 'power2.out', clearProps: 'transform,opacity'});
    gsap.utils.toArray('[data-spot-reveal]').forEach(el => {
      gsap.from(el, {y: 24, opacity: .65, duration: .75, ease: 'power2.out', clearProps: 'transform,opacity', scrollTrigger: {trigger: el, start: 'top 88%', once: true}});
    });
    gsap.utils.toArray('.spot-sun circle,.spot-sun path').forEach(shape => {
      const length = shape.getTotalLength();
      gsap.fromTo(shape, {strokeDasharray: length, strokeDashoffset: length}, {strokeDashoffset: 0, duration: 1.5, ease: 'power2.out', scrollTrigger: {trigger: '.spot-premiere', start: 'top 82%', once: true}});
    });
  });
  motion.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.to('.spot-hero-picture img', {scale: 1.06, ease: 'none', scrollTrigger: {trigger: '.spot-hero', start: 'top top', end: 'bottom top', scrub: 1}});
  });
})();
