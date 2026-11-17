(() => {
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
