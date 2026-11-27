(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map();
  // Native details stay fully usable without JavaScript. Rapid clicks reverse the current height.
  document.querySelectorAll('main details').forEach(detail => {
    const summary = detail.querySelector(':scope > summary');
    let expanded = detail.open;
    summary.addEventListener('click', event => {
      if (reduce.matches || !detail.animate) return;
      event.preventDefault();
      const start = detail.getBoundingClientRect().height;
      running.get(detail)?.cancel();
      expanded = !expanded;
      detail.open = true;
      const end = expanded ? detail.scrollHeight : summary.getBoundingClientRect().height;
      detail.style.overflow = 'hidden';
      const animation = detail.animate([{height: start + 'px'}, {height: end + 'px'}], {duration: 360, easing: 'cubic-bezier(.22,1,.36,1)'});
      running.set(detail, animation);
      animation.onfinish = () => { detail.open = expanded; detail.style.overflow = ''; running.delete(detail); };
      animation.oncancel = () => { detail.style.overflow = ''; };
    });
    detail.addEventListener('toggle', () => { if (!running.has(detail)) expanded = detail.open; });
  });
  reduce.addEventListener('change', () => { if (reduce.matches) { for (const animation of running.values()) animation.finish(); } });
  document.querySelectorAll('.brief-gallery').forEach(gallery => {
    const track = gallery.querySelector('.brief-photo-track');
    gallery.querySelector('.brief-gallery-controls').hidden = false;
    gallery.querySelectorAll('button').forEach(button => button.addEventListener('click', () => track.scrollBy({left: track.clientWidth * .8 * (button.hasAttribute('data-gallery-prev') ? -1 : 1), behavior: reduce.matches ? 'auto' : 'smooth'})));
  });
})();
