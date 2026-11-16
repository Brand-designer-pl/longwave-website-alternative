(() => {
  const section = document.querySelector('.reviews-section');
  if (!section || !window.gsap) return;
  const wall = section.querySelector('.reviews-wall');
  const rows = [...wall.querySelectorAll('.reviews-row')];
  const controls = section.querySelector('.reviews-actions');
  const pause = section.querySelector('.review-pause');
  const readAll = section.querySelector('.reviews-read-all');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let tweens = [], manualPause = false, showAll = false, hovering = false, focused = false, visible = false;
  let width = 0, resizeFrame = 0;
  const sync = () => {
    const stopped = manualPause || hovering || focused || !visible || document.hidden;
    tweens.forEach(tween => tween.paused(stopped));
    pause.setAttribute('aria-pressed', String(manualPause));
    pause.querySelector('span').textContent = manualPause ? 'Wznów przewijanie' : 'Zatrzymaj przewijanie';
    pause.querySelector('path').setAttribute('d', manualPause ? 'm8 5 11 7-11 7Z' : 'M9 5v14M15 5v14');
  };
  const clear = () => {
    tweens.forEach(tween => tween.kill()); tweens = [];
    wall.querySelectorAll('[data-review-clone]').forEach(clone => clone.remove());
    rows.forEach(row => gsap.set(row.firstElementChild, {clearProps:'transform'}));
    section.classList.remove('reviews-running');
  };
  const build = () => {
    clear();
    controls.hidden = reduced.matches;
    pause.hidden = showAll || reduced.matches;
    readAll.setAttribute('aria-pressed', String(showAll));
    readAll.textContent = showAll ? 'Wróć do karuzeli' : 'Pokaż wszystkie opinie';
    if (reduced.matches || showAll) return;
    section.classList.add('reviews-running');
    rows.forEach((row, index) => {
      const track = row.firstElementChild;
      const set = track.firstElementChild;
      const distance = set.getBoundingClientRect().width;
      if (!distance) return;
      // Enough copies to cover even ultrawide screens throughout a full cycle.
      const copies = Math.ceil(row.clientWidth / distance);
      for (let i = 0; i < copies; i++) {
        const clone = set.cloneNode(true);
        clone.dataset.reviewClone = '';
        clone.setAttribute('aria-hidden', 'true');
        track.append(clone);
      }
      tweens.push(gsap.fromTo(track, {x:index ? -distance : 0}, {
        x:index ? 0 : -distance, duration:distance/(index ? 24 : 21), repeat:-1, ease:'none', paused:true,
      }));
    });
    sync();
  };
  pause.addEventListener('click', () => {manualPause = !manualPause; sync();});
  readAll.addEventListener('click', () => {showAll = !showAll; build();});
  wall.addEventListener('pointerenter', event => {if (event.pointerType === 'mouse') {hovering = true; sync();}});
  wall.addEventListener('pointerleave', () => {hovering = false; sync();});
  wall.addEventListener('pointerdown', event => {if (event.pointerType === 'touch') {manualPause = true; sync();}}, {passive:true});
  wall.addEventListener('focusin', () => {focused = true; sync();});
  wall.addEventListener('focusout', () => {focused = false; sync();});
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(entries => {visible = entries[0].isIntersecting; sync();}).observe(wall);
  new ResizeObserver(entries => {
    const next = Math.round(entries[0].contentRect.width);
    if (next === width) return;
    width = next;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(build);
  }).observe(wall);
  reduced.addEventListener('change', build);
  // A pagehide pause also covers bfcache; pageshow resumes the same instances.
  window.addEventListener('pagehide', () => tweens.forEach(tween => tween.pause()));
  window.addEventListener('pageshow', sync);
  build();
})();
