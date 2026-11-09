(() => {
  const {gsap, ScrollTrigger} = window;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  const motion = gsap.matchMedia();

  motion.add('(prefers-reduced-motion: no-preference)', () => {
    const hero = document.querySelector('.hero-content');
    if (hero) {
      const stage = hero.closest('.hero');
      gsap.timeline({
        defaults: {ease: 'none'},
        scrollTrigger: {trigger: stage, start: 'top top', end: 'bottom top', scrub: true},
      })
        .fromTo(stage.querySelector('.hero-frame'), {scale: 1}, {scale: 1.2}, 0)
        .to(hero, {y: -44}, 0)
        .to(hero.querySelector('.hero-mark'), {scale: 0.91, transformOrigin: 'left bottom'}, 0);
      gsap.from(hero.querySelectorAll(':scope > .kicker, .hero-row > div:first-child'), {
        y: 24,
        opacity: 0.65,
        duration: 0.8,
        stagger: 0.11,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    }

    gsap.utils.toArray('main .section').forEach(section => {
      if (section.hidden) return;

      const heading = section.querySelector('h1, h2');
      if (heading) {
        gsap.from(heading, {
          y: 18,
          opacity: 0.72,
          duration: 0.65,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {trigger: heading, start: 'top 92%', once: true},
        });
      }

      const gallery = section.querySelector('.mosaic');
      if (gallery) {
        gsap.from(gallery.querySelectorAll('img'), {
          yPercent: 7,
          scale: 1.16,
          duration: 0.9,
          stagger: 0.09,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: {trigger: gallery, start: 'top 88%', once: true},
        });
      }

      const campaign = section.querySelector('.campaign');
      if (campaign) {
        const wave = campaign.querySelector('.wave-art');
        gsap.timeline({
          defaults: {ease: 'none'},
          scrollTrigger: {trigger: campaign, start: 'top 96%', end: 'top 20%', scrub: true},
        })
          .fromTo(wave, {yPercent: 20, scale: 1.3}, {yPercent: 0, scale: 1.05}, 0)
          .from(campaign.querySelector('.campaign-copy'), {y: 26}, 0);
        gsap.from(campaign.querySelectorAll('.wave-art path, .wave-art circle'), {
          x: 32,
          opacity: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {trigger: campaign, start: 'top 85%', once: true},
        });
      }
    });
  });

  motion.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.utils.toArray('.story-photo img').forEach(art => {
      gsap.fromTo(art, {yPercent: -4, scale: 1.1}, {
        yPercent: 4,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
          trigger: art.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
  });
})();
