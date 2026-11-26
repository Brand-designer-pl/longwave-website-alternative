'use strict';

const menu = document.querySelector('.nav-toggle');
const groups = [...menu.querySelectorAll('nav > details')];
const compactMenu = matchMedia('(max-width: 900px)');
const fullscreenMenu = typeof HTMLDialogElement !== 'undefined' && !!HTMLDialogElement.prototype.showModal;
function syncMenu() {
  menu.open = !fullscreenMenu && !compactMenu.matches;
  groups.forEach(group => { group.open = false; });
}
syncMenu();
compactMenu.addEventListener('change', () => { if (!fullscreenMenu) syncMenu(); });

groups.forEach(group => {
  group.addEventListener('toggle', () => {
    if (!group.open) return;
    groups.filter(other => other !== group).forEach(other => { other.open = false; });
  });
});

document.addEventListener('click', event => {
  if (menu.contains(event.target)) return;
  if (compactMenu.matches) menu.open = false;
  groups.forEach(group => { group.open = false; });
});

menu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    const target = link.hash && link.getAttribute('href').startsWith('#')
      ? document.getElementById(link.hash.slice(1))
      : null;
    if (!target) return;
    groups.forEach(group => { group.open = false; });
    if (compactMenu.matches) menu.open = false;
    target.tabIndex = -1;
    target.focus({preventScroll: true});
  });
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || document.querySelector('.mobile-menu-dialog[open]')) return;
  const openGroup = groups.find(group => group.open);
  if (openGroup) {
    openGroup.open = false;
    openGroup.querySelector('summary').focus();
  } else if ((fullscreenMenu || compactMenu.matches) && menu.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});

// Native top layer avoids clipping by hero transforms and glass navigation.
if (fullscreenMenu) {
  const shell = menu.closest('.nav-shell');
  const dialog = document.createElement('dialog');
  dialog.className = 'mobile-menu-dialog';
  dialog.setAttribute('aria-label', 'Menu główne LONGWAVE');
  const header = document.createElement('div');
  header.className = 'mobile-menu-header';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'pill menu-close';
  close.innerHTML = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6"/></svg><span>Zamknij</span>';
  const logo = shell.querySelector('.wordmark').cloneNode(true);
  const account = shell.querySelector('.account-link').cloneNode(true);
  header.append(close, logo, account);
  const navigation = menu.querySelector('nav').cloneNode(true);
  const layout = document.createElement('div');
  layout.className = 'menu-layout';
  const preview = document.createElement('figure');
  preview.className = 'menu-preview';
  const photoStage = document.createElement('div');
  photoStage.className = 'menu-preview-photos';
  photoStage.setAttribute('aria-hidden', 'true');
  const caption = document.createElement('figcaption');
  caption.className = 'menu-preview-caption';
  caption.textContent = 'LONGWAVE';
  preview.append(photoStage, caption);
  layout.append(navigation, preview);
  dialog.append(header, layout);
  document.body.append(dialog);
  document.documentElement.classList.add('has-fullscreen-menu');
  let locked = false;
  let savedScroll = 0;
  let savedStyle;
  let animations = [];
  let generation = 0;
  let closeTask = null;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const trigger = menu.querySelector('summary');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', 'fullscreen-menu');
  trigger.setAttribute('aria-expanded', 'false');
  dialog.id = 'fullscreen-menu';

  const assetsBase = new URL('.', logo.querySelector('img').src);
  const categoryPhotos = [
    {file: 'wybor-rodzina.webp', position: '50% 50%'},
    {file: 'home-spot-taras.webp', position: '50% 50%'},
    {file: 'world-eventy.webp', position: '50% 50%'},
    {file: 'world-collection.webp', position: '50% 40%'},
    {file: 'team.webp', position: '50% 50%'}
  ];
  const menuGroups = [...navigation.querySelectorAll(':scope > details')];
  let previewRequest = 0;
  let previewKey = '';
  let pendingPreviewKey = '';
  let activeImage = null;
  let previewAnimations = [];

  function photoFor(element, index) {
    const label = element.textContent.replace(/Nowość/g, '').trim();
    let photo = categoryPhotos[index];
    if (/Obozy/.test(label)) photo = {file: 'wybor-oboz.webp', position: '50% 50%'};
    else if (/zagraniczne/.test(label)) photo = {file: 'surf.webp', position: '50% 50%'};
    else if (/Deski LONGWAVE/.test(label)) photo = {file: 'world-boards.webp', position: '50% 60%'};
    return {...photo, label};
  }
  function clearPreviewMotion() {
    previewAnimations.forEach(animation => animation.cancel());
    previewAnimations = [];
    [...photoStage.children].filter(image => image !== activeImage).forEach(image => image.remove());
  }
  async function showPreview(photo) {
    if (!dialog.open || closeTask) return;
    const key = photo.file + photo.label;
    if (key === pendingPreviewKey || (key === previewKey && !pendingPreviewKey)) return;
    const request = ++previewRequest;
    pendingPreviewKey = '';
    // A pending, slower image must not replace a newer hover or focus selection.
    if (key === previewKey) return;
    pendingPreviewKey = key;
    const next = new Image();
    next.alt = '';
    next.decoding = 'async';
    next.style.objectPosition = photo.position;
    next.src = new URL(photo.file, assetsBase).href;
    try { await next.decode(); } catch {
      if (request === previewRequest) pendingPreviewKey = '';
      return;
    }
    if (request !== previewRequest || !dialog.open || closeTask) return;
    pendingPreviewKey = '';
    previewKey = key;
    clearPreviewMotion();
    const previous = activeImage;
    activeImage = next;
    photoStage.append(next);
    caption.textContent = photo.label;
    preview.dataset.selection = photo.label;
    if (motionPreference.matches || !next.animate) {
      if (previous) previous.remove();
      return;
    }
    const incoming = next.animate([
      {opacity: 0, transform: 'translateX(28px) scale(1.05)'},
      {opacity: 1, transform: 'translateX(0) scale(1)'}
    ], {duration: 520, easing: 'cubic-bezier(.22,1,.36,1)'});
    previewAnimations.push(incoming, caption.animate([
      {opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}
    ], {duration: 320, easing: 'ease-out'}));
    if (previous) {
      const outgoing = previous.animate([
        {opacity: 1, transform: 'translateX(0) scale(1)'},
        {opacity: 0, transform: 'translateX(-20px) scale(1.025)'}
      ], {duration: 320, easing: 'ease-in', fill: 'forwards'});
      previewAnimations.push(outgoing);
      outgoing.finished.then(() => previous.remove(), () => {});
    }
  }
  menuGroups.forEach((group, index) => {
    group.querySelectorAll('summary, a').forEach(element => {
      const update = () => showPreview(photoFor(element, index));
      // React to deliberate pointer movement, not items shifting under a still cursor.
      element.addEventListener('pointermove', event => {
        if (event.pointerType !== 'touch') update();
      }, {passive: true});
      element.addEventListener('focus', update);
      if (element.tagName === 'SUMMARY') element.addEventListener('click', update);
    });

  });

  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations = [];
  }

  function unlockPage() {
    if (!locked) return;
    locked = false;
    document.body.classList.remove('mobile-menu-open');
    for (const [key, value] of Object.entries(savedStyle)) document.body.style[key] = value;
    window.scrollTo(0, savedScroll);
  }
  function finishClose() {
    previewRequest++;
    pendingPreviewKey = '';
    clearPreviewMotion();
    cancelAnimations();
    if (dialog.open) dialog.close();
    unlockPage();
    menu.open = false;
    trigger.setAttribute('aria-expanded', 'false');
    closeTask = null;
  }
  function closeMenu(immediate = false) {
    if (immediate || motionPreference.matches || !dialog.animate) {
      generation++;
      finishClose();
      return Promise.resolve();
    }
    if (!dialog.open) return Promise.resolve();
    if (closeTask) return closeTask;
    const token = ++generation;
    previewRequest++;
    pendingPreviewKey = '';
    clearPreviewMotion();
    const current = getComputedStyle(dialog);
    const from = {opacity: current.opacity, transform: current.transform};
    cancelAnimations();
    const animation = dialog.animate([from, {opacity: 0, transform: 'translateY(-24px)'}],
      {duration: 220, easing: 'cubic-bezier(.4,0,1,1)', fill: 'both'});
    animations.push(animation, preview.animate([
      {opacity: 1, transform: 'translateX(0) scale(1)'},
      {opacity: 0, transform: 'translateX(32px) scale(.97)'}
    ], {duration: 220, easing: 'ease-in', fill: 'both'}));
    closeTask = animation.finished.catch(() => {}).then(() => {
      if (token === generation) finishClose();
    });
    return closeTask;
  }
  function syncFullscreenMenu() {
    if (!menu.open) {
      if (dialog.open) closeMenu();
      return;
    }
    if (dialog.open) return;
    generation++;
    savedScroll = window.scrollY;
    savedStyle = Object.fromEntries(['position', 'top', 'width'].map(key => [key, document.body.style[key]]));
    locked = true;
    document.body.classList.add('mobile-menu-open');
    Object.assign(document.body.style, {position: 'fixed', top: `-${savedScroll}px`, width: '100%'});
    navigation.querySelectorAll('details').forEach(group => { group.open = false; });
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    close.focus({preventScroll: true});
    layout.scrollTop = 0;
    navigation.scrollTop = 0;
    showPreview(photoFor(menuGroups[0].querySelector('summary'), 0));
    if (!motionPreference.matches && dialog.animate) {
      animations.push(dialog.animate([
        {opacity: 0, transform: 'translateY(-28px)'},
        {opacity: 1, transform: 'translateY(0)'}
      ], {duration: 360, easing: 'cubic-bezier(.22,1,.36,1)'}));
      animations.push(preview.animate([
        {opacity: 0, transform: 'translateX(32px) scale(.97)'},
        {opacity: 1, transform: 'translateX(0) scale(1)'}
      ], {duration: 520, delay: 70, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'}));
      [...navigation.children].forEach((group, index) => {
        animations.push(group.animate([
          {opacity: 0, transform: 'translateY(18px)'},
          {opacity: 1, transform: 'translateY(0)'}
        ], {duration: 380, delay: 70 + index * 35, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'}));
      });
    }
  }
  close.addEventListener('click', () => closeMenu());
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
  dialog.querySelectorAll('a').forEach(link => link.addEventListener('click', async event => {
    const sameTab = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey &&
      (!link.target || link.target === '_self') && !link.hasAttribute('download');
    if (!sameTab) { closeMenu(); return; }
    event.preventDefault();
    await closeMenu();
    const url = new URL(link.href);
    if (url.origin === location.origin && url.pathname === location.pathname && url.hash) {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target) { target.tabIndex = -1; target.focus({preventScroll: true}); }
    }
    location.assign(url.href);
  }));
  const dialogGroups = [...navigation.querySelectorAll(':scope > details')];
  dialogGroups.forEach(group => group.addEventListener('toggle', () => {
    if (group.open) dialogGroups.filter(other => other !== group).forEach(other => { other.open = false; });
  }));
  // Header links and category toggles belong to the modal, not an outside click.
  dialog.addEventListener('click', event => event.stopPropagation());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), summary')]
      .filter(element => element.getClientRects().length &&
        (element.tagName === 'SUMMARY' || !element.closest('details:not([open])')));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  menu.addEventListener('toggle', syncFullscreenMenu);
  motionPreference.addEventListener('change', () => {
    if (!motionPreference.matches) return;
    if (closeTask) closeMenu(true);
    else { cancelAnimations(); clearPreviewMotion(); }
  });
  window.addEventListener('pagehide', () => closeMenu(true));
}

function syncFilmControl(control, enabled, failed = false) {
  if (!control) return; // Hero controls may intentionally be omitted by the design.
  control.setAttribute('aria-pressed', String(enabled));
  control.textContent = failed ? 'Ponów film w tle' : enabled ? 'Wyłącz film w tle' : 'Włącz film w tle';
}

const video = document.querySelector('.hero-film');
if (video) {
  const control = document.querySelector('.film-control');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = matchMedia('(max-width: 650px)');
  let wantsPlayback = !reducedMotion.matches && !navigator.connection?.saveData;
  let visible = false;
  const filmStart = Math.max(0, Number(video.dataset.start) || 0);
  if (filmStart > 0) {
    // Repeat the selected opening too, without replaying the skipped intro.
    video.loop = false;
    const seekOpening = () => {
      video.currentTime = Math.min(filmStart, Math.max(0, video.duration - 0.1));
    };
    video.addEventListener('loadedmetadata', seekOpening);
    video.addEventListener('ended', () => {
      seekOpening();
      updateFilm();
    });
  }

  function updateFilm() {
    syncFilmControl(control, wantsPlayback);
    if (!wantsPlayback || navigator.connection?.saveData || !visible || document.hidden || ((fullscreenMenu || compactMenu.matches) && menu.open)) {
      video.pause();
      return;
    }

    if (!video.src) {
      const mobile = smallScreen.matches;
      const mp4 = mobile
        ? (video.dataset.mobileSrc || 'festival-mobile.mp4')
        : (video.dataset.desktopSrc || 'festival-desktop.mp4');
      const webm = mobile ? video.dataset.mobileWebm : video.dataset.desktopWebm;
      const useWebm = webm && video.canPlayType('video/webm; codecs="vp9"');
      // Load one rendition only; keep native H.264 for unsupported/failed VP9.
      if (useWebm) video.addEventListener('error', () => {
        video.src = mp4;
        updateFilm();
      }, {once: true});
      video.src = useWebm ? webm : mp4;
    }
    const requestedSource = video.src;
    video.play().catch(error => {
      if (error.name === 'AbortError' || video.src !== requestedSource) return;
      wantsPlayback = false;
      syncFilmControl(control, false, true);
    });
  }

  if (control) control.hidden = false;
  control?.addEventListener('click', () => {
    wantsPlayback = !wantsPlayback;
    updateFilm();
  });
  video.addEventListener('playing', () => {
    video.classList.add('is-playing');
    syncFilmControl(control, wantsPlayback);
  });
  video.addEventListener('pause', () => {
    syncFilmControl(control, wantsPlayback);
  });
  reducedMotion.addEventListener('change', () => {
    wantsPlayback = !reducedMotion.matches;
    if (reducedMotion.matches) video.classList.remove('is-playing');
    updateFilm();
  });
  navigator.connection?.addEventListener('change', updateFilm);
  document.addEventListener('visibilitychange', updateFilm);
  menu.addEventListener('toggle', updateFilm);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateFilm();
  }).observe(video);
}

document.querySelectorAll('[data-youtube]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', () => {
    const player = document.createElement('iframe');
    player.className = 'trip-video-player';
    player.title = button.parentElement.querySelector('h2, h3').textContent;
    player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    player.allowFullscreen = true;
    player.src = 'https://www.youtube-nocookie.com/embed/' + button.dataset.youtube + '?autoplay=1';
    button.replaceWith(player);
    player.focus();
  }, {once: true});
});

const locationHero = document.querySelector('[data-hero-youtube]');
if (locationHero) {
  const screen = locationHero.querySelector('.location-screen');
  const control = document.querySelector('.film-control');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileView = matchMedia('(max-width: 650px), (hover: none) and (pointer: coarse)');
  const nativeVideo = locationHero.querySelector('.location-mobile-film');
  const usesNativeFilm = () => Boolean(nativeVideo && mobileView.matches);
  let enabled = !preference.matches;
  let visible = false;
  let ready = false;
  let loading = false;
  let failed = false;
  let player;
  let startupTimer;
  let apiPromise;

  function loadAPI() {
    if (window.YT?.Player) return Promise.resolve();
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const previousCallback = window.onYouTubeIframeAPIReady;
      const timer = setTimeout(fail, 15000);
      function fail() {
        clearTimeout(timer);
        script.remove();
        window.onYouTubeIframeAPIReady = previousCallback;
        reject(new Error('YouTube API unavailable'));
      }
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timer);
        window.onYouTubeIframeAPIReady = previousCallback;
        previousCallback?.();
        resolve();
      };
      script.onerror = fail;
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.append(script);
    }).catch(error => {
      apiPromise = undefined;
      throw error;
    });
    return apiPromise;
  }

  function shouldPlay() {
    return enabled && visible && !document.hidden && !((fullscreenMenu || compactMenu.matches) && menu.open);
  }

  function showPoster() {
    screen.classList.remove('is-playing');
  }

  function unavailable() {
    clearTimeout(startupTimer);
    enabled = false;
    failed = true;
    if (ready) player.pauseVideo();
    nativeVideo?.pause();
    showPoster();
    syncFilmControl(control, enabled, failed);
  }

  function startTimer() {
    clearTimeout(startupTimer);
    startupTimer = setTimeout(unavailable, 15000);
  }

  async function createPlayer() {
    loading = true;
    syncFilmControl(control, enabled, failed);
    try {
      await loadAPI();
      if (!shouldPlay() || usesNativeFilm()) return;
      const id = locationHero.dataset.heroYoutube;
      const frame = document.createElement('iframe');
      const parameters = new URLSearchParams({
        autoplay: '0', mute: '1', controls: '0', playsinline: '1',
        loop: '1', playlist: id, rel: '0', enablejsapi: '1', origin: location.origin,
      });
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?${parameters}`;
      frame.title = 'Film w tle';
      frame.tabIndex = -1;
      frame.allow = 'autoplay; encrypted-media';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      screen.append(frame);
      player = new YT.Player(frame, {events: {
        onReady: () => {
          ready = true;
          player.mute();
          updateLocationFilm();
        },
        onStateChange: event => {
          if (event.data === YT.PlayerState.PLAYING) {
            if (!shouldPlay() || usesNativeFilm()) {
              player.pauseVideo();
              return;
            }
            clearTimeout(startupTimer);
            screen.classList.add('is-playing');
            syncFilmControl(control, enabled, failed);
          } else if (event.data === YT.PlayerState.PAUSED && !usesNativeFilm()) {
            if (shouldPlay()) enabled = false;
            showPoster();
            syncFilmControl(control, enabled, failed);
          }
        },
        onError: () => { if (!usesNativeFilm()) unavailable(); },
        onAutoplayBlocked: () => { if (!usesNativeFilm()) unavailable(); },
      }});
      startTimer();
    } catch {
      if (!usesNativeFilm()) unavailable();
    } finally {
      loading = false;
    }
  }

  function updateLocationFilm() {
    syncFilmControl(control, enabled, failed);
    const native = usesNativeFilm();
    screen.classList.toggle('is-native', native);
    if (native && ready) player.pauseVideo();
    if (!native) nativeVideo?.pause();
    if (!shouldPlay()) {
      clearTimeout(startupTimer);
      if (ready) player.pauseVideo();
      nativeVideo?.pause();
      showPoster();
      syncFilmControl(control, enabled, failed);
      return;
    }
    if (native) {
      if (!nativeVideo.paused) return;
      if (!nativeVideo.getAttribute('src')) nativeVideo.src = nativeVideo.dataset.src;
      nativeVideo.muted = true;
      syncFilmControl(control, enabled, failed);
      startTimer();
      nativeVideo.play().catch(error => {
        if (error.name !== 'AbortError' && usesNativeFilm() && shouldPlay()) unavailable();
      });
      return;
    }
    if (loading) return;
    if (!player) {
      createPlayer();
    } else if (ready && player.getPlayerState() !== YT.PlayerState.PLAYING) {
      syncFilmControl(control, enabled, failed);
      player.mute();
      player.playVideo();
      startTimer();
    } else if (!ready) {
      syncFilmControl(control, enabled, failed);
      startTimer();
    }
  }

  nativeVideo?.addEventListener('playing', () => {
    if (!usesNativeFilm() || !shouldPlay()) {
      nativeVideo.pause();
      return;
    }
    clearTimeout(startupTimer);
    screen.classList.add('is-playing');
    syncFilmControl(control, enabled, failed);
  });
  nativeVideo?.addEventListener('pause', () => {
    if (!usesNativeFilm()) return;
    if (shouldPlay()) enabled = false;
    showPoster();
    syncFilmControl(control, enabled, failed);
  });
  nativeVideo?.addEventListener('error', () => {
    if (usesNativeFilm()) unavailable();
  });
  mobileView.addEventListener('change', () => {
    clearTimeout(startupTimer);
    showPoster();
    updateLocationFilm();
  });

  if (control) control.hidden = false;
  control?.addEventListener('click', () => {
    enabled = !enabled;
    if (enabled && failed) {
      if (usesNativeFilm()) nativeVideo.load();
      player?.destroy();
      player = undefined;
      ready = false;
      failed = false;
    }
    updateLocationFilm();
  });
  preference.addEventListener('change', () => {
    enabled = !preference.matches;
    updateLocationFilm();
  });
  menu.addEventListener('toggle', updateLocationFilm);
  document.addEventListener('visibilitychange', updateLocationFilm);
  window.addEventListener('pagehide', () => {
    clearTimeout(startupTimer);
    if (ready) player.pauseVideo();
    nativeVideo?.pause();
  });
  window.addEventListener('pageshow', updateLocationFilm);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateLocationFilm();
  }).observe(locationHero);
  updateLocationFilm();
}

// Keep the destination CTA out of the initial hero view.
const destinationDock = document.querySelector('.destination-dock');
if (destinationDock) {
  const syncDestinationDock = () => {
    const hide = window.scrollY <= 0;
    if (destinationDock.hidden !== hide) destinationDock.hidden = hide;
  };
  window.addEventListener('scroll', syncDestinationDock, {passive: true});
  window.addEventListener('pageshow', syncDestinationDock);
  syncDestinationDock();
}
