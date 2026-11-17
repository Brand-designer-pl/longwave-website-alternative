// Native, below-fold video; no download until visible or when automatic motion is disabled.
(() => {
  const section = document.querySelector('.club-scene');
  if (!section || !('IntersectionObserver' in window)) return;
  const video = section.querySelector('video');
  const button = section.querySelector('.club-video-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  const connection = navigator.connection;
  const menu = document.querySelector('#fullscreen-menu');
  let visible = false, pageActive = true;
  let enabled = !reduced.matches && !connection?.saveData;
  let pending = false;
  const shouldPlay = () => enabled && visible && pageActive && !document.hidden && !menu?.open;
  const reflect = () => {
    const playing = !video.paused && !video.ended;
    section.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', (playing ? 'Wstrzymaj' : 'Odtwórz') + ' film w sekcji aplikacji');
  };
  function update() {
    if (!shouldPlay()) { video.pause(); reflect(); return; }
    const source = mobile.matches ? video.dataset.mobile : video.dataset.desktop;
    if (video.getAttribute('src') !== source) { video.src = source; video.muted = true; video.load(); }
    if (pending || !video.paused) return;
    pending = true;
    video.play().then(() => {
      if (!shouldPlay()) video.pause();
      reflect();
    }).catch(() => {
      // Keep the poster and offer an explicit play action if autoplay is blocked.
      if (shouldPlay()) enabled = false;
      reflect();
    }).finally(() => { pending = false; });
  }
  button.hidden = false;
  button.addEventListener('click', () => { enabled = !enabled; update(); });
  video.addEventListener('playing', reflect);
  video.addEventListener('pause', reflect);
  video.addEventListener('error', () => { enabled = false; video.pause(); reflect(); });
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; update();
  }, {threshold:0});
  observer.observe(section);
  const preferenceChanged = () => { enabled = !reduced.matches && !connection?.saveData; update(); };
  reduced.addEventListener('change', preferenceChanged);
  connection?.addEventListener('change', preferenceChanged);
  mobile.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pagehide', () => { pageActive = false; update(); });
  window.addEventListener('pageshow', () => { pageActive = true; update(); });
  if (menu) new MutationObserver(update).observe(menu, {attributes:true,attributeFilter:['open']});
  reflect();
})();
