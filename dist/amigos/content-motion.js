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
      document.querySelectorAll('.content-intro h2, .content-gallery-band h2, .content-related h2, .event-format').forEach(el => {
        gsap.fromTo(el, {y:20}, {y:0, ease:'none', scrollTrigger:{trigger:el, start:'top 96%', end:'top 70%', scrub:true}});
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
          const art=JSON.parse(JSON.stringify(data));
          // Start from a blank line; do not change the shared homepage artwork.
          art.layers.forEach(layer=>layer.shapes?.filter(shape=>shape.ty==='tm').forEach(trim=>{trim.e.k[0].s=[0];}));
          const animation=lottie.loadAnimation({container:mark.querySelector('.surf-mark-player'),renderer:'svg',autoplay:false,loop:false,
            animationData:art,rendererSettings:{progressiveLoad:false}});
          let trigger, exit;
          cleanup.push(() => {trigger?.kill();exit?.kill();mark.style.removeProperty("opacity");animation.destroy();mark.classList.remove('is-drawn');});
          animation.addEventListener('DOMLoaded', () => {
            if (!active) return;
            mark.classList.add('is-drawn');
            const draw = progress => animation.goToAndStop(progress*(animation.totalFrames-1),true);
            trigger=ScrollTrigger.create({trigger:mark,start:'top 95%',end:'top 45%',
              onUpdate:self => {if (!document.hidden && active) draw(self.progress);}});
            draw(trigger.progress);
            // Keep the completed drawing visible; fade only when its section leaves.
            const opacity=parseFloat(getComputedStyle(mark).opacity);
            exit=ScrollTrigger.create({trigger:mark.parentElement,start:'bottom 25%',end:'bottom top',
              onUpdate:self => {if(active) mark.style.opacity=opacity*(1-self.progress);}});
            mark.style.opacity=opacity*(1-exit.progress);
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
