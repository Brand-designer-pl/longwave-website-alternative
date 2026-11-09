(() => {
  const {gsap, ScrollTrigger} = window;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  const motion = gsap.matchMedia();

  motion.add('(prefers-reduced-motion: no-preference)', () => {
    const hero = document.querySelector('.hero-content');
    if (hero) {
      gsap.from(hero.querySelectorAll(':scope > .kicker, .hero-mark, .hero-row > div:first-child'), {
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
    gsap.utils.toArray('.story-photo img, .campaign .wave-art').forEach(art => {
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
