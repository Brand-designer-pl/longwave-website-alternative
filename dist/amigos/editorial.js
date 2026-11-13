'use strict';

const menu = document.querySelector('.nav-toggle');
const groups = [...menu.querySelectorAll('nav > details')];
const compactMenu = matchMedia('(max-width: 900px)');
function syncMenu() {
  menu.open = !compactMenu.matches;
  groups.forEach(group => { group.open = false; });
}
syncMenu();
compactMenu.addEventListener('change', syncMenu);

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
  if (event.key !== 'Escape') return;
  const openGroup = groups.find(group => group.open);
  if (openGroup) {
    openGroup.open = false;
    openGroup.querySelector('summary').focus();
  } else if (compactMenu.matches && menu.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});

function syncFilmControl(control, enabled, failed = false) {
  control.setAttribute('aria-pressed', String(enabled));
  control.textContent = failed ? 'Ponów film w tle' : enabled ? 'Wyłącz film w tle' : 'Włącz film w tle';
}

const video = document.querySelector('.hero-film');
if (video) {
  const control = document.querySelector('.film-control');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = matchMedia('(max-width: 650px)');
  let wantsPlayback = !reducedMotion.matches;
  let visible = false;

  function updateFilm() {
    syncFilmControl(control, wantsPlayback);
    if (!wantsPlayback || !visible || document.hidden) {
      video.pause();
      return;
    }

    if (!video.src) {
      video.src = smallScreen.matches
        ? 'festival-mobile.mp4'
        : 'festival-desktop.mp4';
    }
    video.play().catch(error => {
      if (error.name === 'AbortError') return;
      wantsPlayback = false;
      syncFilmControl(control, false, true);
    });
  }

  control.hidden = false;
  control.addEventListener('click', () => {
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
  document.addEventListener('visibilitychange', updateFilm);
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
    return enabled && visible && !document.hidden && !(compactMenu.matches && menu.open);
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

  control.hidden = false;
  control.addEventListener('click', () => {
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
