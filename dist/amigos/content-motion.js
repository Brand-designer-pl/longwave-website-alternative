/* Adapted from premium-web-agent 1.0.0: scroll-reveal, parallax, motion-accessibility.
   Essential content is never hidden; decorative Lottie is scroll-driven, not looped. */
(() => {
  const base = new URL('.', document.currentScript.src);
  let media, loadPromise;
  // Optional decoration must not compete with the hero photograph and fonts.
  const pageReady = new Promise(resolve => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, {once:true});
  });
  const idle = () => new Promise(resolve => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(resolve,{timeout:1200});
    else setTimeout(resolve,120);
  });
  const artwork = new Map();
  const loadPlayer = () => loadPromise ||= new Promise((resolve, reject) => {
    if (window.lottie) return resolve(window.lottie);
    const script = document.createElement('script');
    script.src = new URL('../vendor/lottie_light.min.js', base);
    script.onload = () => resolve(window.lottie);
    script.onerror = reject;
    document.head.append(script);
  });
  const loadArt = name => {
    if (!artwork.has(name)) artwork.set(name, fetch(new URL(`art/${name}.json`, base)).then(r => {
      if (!r.ok) throw new Error('Artwork unavailable');
      return r.json();
    }));
    return artwork.get(name);
  };
  function start() {
    media?.revert();
    media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      let active = true;
      const cleanup = [];
      document.querySelectorAll('.content-intro h2, .content-gallery-band h2, .content-related h2, .event-format-image').forEach(el => {
        gsap.fromTo(el, {y:20}, {y:0, ease:'none', scrollTrigger:{trigger:el, start:'top 96%', end:'top 70%', scrub:true}});
      });
      // Only decorative art travels out again; headings, links and reading content stay legible.
      document.querySelectorAll('[data-content-mark]').forEach(mark => {
        const opacity = parseFloat(getComputedStyle(mark).opacity);
        gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:mark.parentElement,start:'top bottom',end:'bottom top',scrub:true}})
          .fromTo(mark,{y:-18,rotation:-4,opacity:.025},{y:0,rotation:0,opacity,duration:.35})
          .to(mark,{y:12,rotation:2,opacity,duration:.4})
          .to(mark,{y:18,rotation:4,opacity:.025,duration:.25});
      });
      const observer = new IntersectionObserver(entries => entries.forEach(async entry => {
        if (!entry.isIntersecting) return;
        const mark=entry.target;
        observer.unobserve(mark);
        try {
          await pageReady;
          await idle();
          if (!active) return;
          const [lottie, data] = await Promise.all([loadPlayer(),loadArt(mark.dataset.contentMark)]);
          if (!active) return;
          const animation=lottie.loadAnimation({container:mark.querySelector('.surf-mark-player'),renderer:'svg',autoplay:false,loop:false,
            animationData:JSON.parse(JSON.stringify(data)),rendererSettings:{progressiveLoad:false}});
          let trigger;
          cleanup.push(() => {trigger?.kill();animation.destroy();mark.classList.remove('is-drawn');});
          animation.addEventListener('DOMLoaded', () => {
            if (!active) return;
            mark.classList.add('is-drawn');
            trigger=ScrollTrigger.create({trigger:mark.parentElement,start:'top bottom',end:'bottom top',
              onUpdate:self => {
                if (document.hidden || !active) return;
                const progress=Math.min(1,self.progress/.3,(1-self.progress)/.22);
                animation.goToAndStop(Math.max(0,progress)*(animation.totalFrames-1),true);
              }});
            const progress=Math.min(1,trigger.progress/.3,(1-trigger.progress)/.22);
            animation.goToAndStop(Math.max(0,progress)*(animation.totalFrames-1),true);
          });
        } catch (_) { /* Keep the authored static SVG if the optional renderer or JSON fails. */ }
      }), {rootMargin:'150px'});
      document.querySelectorAll('[data-content-mark]').forEach(mark => observer.observe(mark));
      return () => {active=false;observer.disconnect();cleanup.forEach(fn=>fn());};
    });
  }
  const libraries = new Map();
  const loadLibrary = (name, available) => {
    if (available()) return Promise.resolve();
    if (!libraries.has(name)) libraries.set(name,new Promise((resolve,reject) => {
      const script=document.createElement('script');
      script.src=new URL('../vendor/'+name,base);
      script.onload=resolve;script.onerror=reject;document.head.append(script);
    }));
    return libraries.get(name);
  };
  let live=true, generation=0;
  async function boot() {
    const request=++generation;
    await pageReady;await idle();
    if (!live || request!==generation) return;
    await loadLibrary('gsap.min.js',()=>!!window.gsap);
    if (!live || request!==generation) return;
    await loadLibrary('ScrollTrigger.min.js',()=>!!window.ScrollTrigger);
    if (!live || request!==generation) return;
    gsap.registerPlugin(ScrollTrigger);start();
  }
  const initialize=()=>boot().catch(()=>{}); // Static page remains complete if optional libraries fail.
  initialize();
  window.addEventListener('pagehide', () => {live=false;++generation;media?.revert();});
  window.addEventListener('pageshow', event => {if (event.persisted) {live=true;initialize();}});
})();
