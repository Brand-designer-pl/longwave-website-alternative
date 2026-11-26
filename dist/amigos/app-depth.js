/* Decorative preview only: no session, API calls or embedded application. */
(() => {
  const section = document.querySelector('#aplikacja');
  const stage = section?.querySelector('.app-depth-stage');
  if (!stage || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  let media, entered = false;
  const mount = () => {
    if (media) return;
    media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (entered) return;
      const entries = stage.querySelectorAll('.app-ui-enter');
      const entrance = gsap.timeline({scrollTrigger: {trigger: stage, start: 'top 80%', once: true, onEnter: () => {entered = true;}}});
      entrance.from(stage, {y: 30, opacity: .7, duration: .95, ease: 'power3.out', clearProps: 'transform,opacity'}, 0)
        .from(entries, {y: 28, opacity: 0, duration: .85, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity'}, .12);
    });
    media.add('(min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const phone = stage.querySelector('.app-phone-tilt');
      const planes = [...stage.querySelectorAll('[data-app-depth]')];
      const rotationX = gsap.quickTo(phone, 'rotationX', {duration: .65, ease: 'power3.out'});
      const rotationY = gsap.quickTo(phone, 'rotationY', {duration: .65, ease: 'power3.out'});
      const movers = planes.map(el => ({depth: Number(el.dataset.appDepth), x: gsap.quickTo(el, 'x', {duration: .75, ease: 'power3.out'}), y: gsap.quickTo(el, 'y', {duration: .75, ease: 'power3.out'})}));
      const menu = document.querySelector('#fullscreen-menu') || document.querySelector('.nav-toggle');
      let visible = false, rect, frame = 0, px = 0, py = 0;
      const reset = () => {
        cancelAnimationFrame(frame); frame = 0; rect = null;
        rotationX.tween.pause(); rotationY.tween.pause();
        movers.forEach(m => {m.x.tween.pause();m.y.tween.pause();});
        gsap.set(phone, {rotationX: 0, rotationY: 0});
        gsap.set(planes, {x: 0, y: 0});
      };
      const apply = () => {
        frame = 0;
        if (!visible || document.hidden || menu?.open) return;
        rotationX(-py * 7); rotationY(px * 10);
        movers.forEach(m => {m.x(px * (m.depth - 15) * .2);m.y(py * (m.depth - 15) * .14);});
      };
      const enter = () => {rect = stage.getBoundingClientRect();};
      const move = event => {
        if (event.pointerType !== 'mouse' || !visible || document.hidden || menu?.open) return;
        if (!rect) enter();
        px = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
        py = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
        if (!frame) frame = requestAnimationFrame(apply);
      };
      const leave = () => {cancelAnimationFrame(frame); frame = 0; rect = null;rotationX(0);rotationY(0);movers.forEach(m => {m.x(0);m.y(0);});};
      const visibility = () => {if (document.hidden) reset();};
      const invalidate = () => {rect = null;};
      const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting;if (!visible) reset();});
      observer.observe(stage);
      const menuObserver = menu ? new MutationObserver(() => {if (menu.open) reset();}) : null;
      menuObserver?.observe(menu, {attributes: true, attributeFilter: ['open']});
      stage.addEventListener('pointerenter', enter);
      stage.addEventListener('pointermove', move, {passive: true});
      stage.addEventListener('pointerleave', leave);
      window.addEventListener('resize', invalidate, {passive: true});
      window.addEventListener('scroll', invalidate, {passive: true});
      document.addEventListener('visibilitychange', visibility);
      return () => {
        cancelAnimationFrame(frame); observer.disconnect(); menuObserver?.disconnect();
        stage.removeEventListener('pointerenter', enter); stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', leave);
        window.removeEventListener('resize', invalidate); window.removeEventListener('scroll', invalidate); document.removeEventListener('visibilitychange', visibility);
      };
    });
  };
  mount();
  window.addEventListener('pagehide', () => {media?.revert(); media = null;});
  window.addEventListener('pageshow', mount);
})();
