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

const video = document.querySelector('.hero-film');
if (video) {
  const control = document.querySelector('.film-control');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = matchMedia('(max-width: 650px)');
  let wantsPlayback = !reducedMotion.matches;
  let visible = false;

  function updateFilm() {
    if (!wantsPlayback || !visible || document.hidden) {
      video.pause();
      return;
    }

    if (!video.src) {
      video.src = smallScreen.matches
        ? 'festival-mobile.mp4'
        : 'festival-desktop.mp4';
    }
    video.play().catch(() => {
      control.textContent = 'Włącz film w tle';
    });
  }

  control.hidden = false;
  control.addEventListener('click', () => {
    wantsPlayback = video.paused;
    updateFilm();
  });
  video.addEventListener('playing', () => {
    video.classList.add('is-playing');
    control.textContent = 'Wstrzymaj film w tle';
  });
  video.addEventListener('pause', () => {
    control.textContent = 'Włącz film w tle';
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
  const control = locationHero.querySelector('.film-control');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const youtubeOrigin = 'https://www.youtube-nocookie.com';
  let enabled = !preference.matches;
  let visible = false;
  let frame;

  function updateLocationFilm() {
    control.textContent = enabled ? 'Wstrzymaj film w tle' : 'Włącz film w tle';
    if (!enabled || !visible || document.hidden) {
      frame?.remove();
      frame = undefined;
      return;
    }
    if (frame) return;

    const id = locationHero.dataset.heroYoutube;
    const parameters = new URLSearchParams({
      autoplay: '1', mute: '1', controls: '0', playsinline: '1',
      loop: '1', playlist: id, rel: '0',
    });
    frame = document.createElement('iframe');
    frame.src = `${youtubeOrigin}/embed/${id}?${parameters}`;
    frame.title = 'Film w tle';
    frame.tabIndex = -1;
    frame.allow = 'autoplay; encrypted-media';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    screen.append(frame);
  }

  control.hidden = false;
  control.addEventListener('click', () => {
    enabled = !enabled;
    updateLocationFilm();
  });
  preference.addEventListener('change', () => {
    enabled = !preference.matches;
    updateLocationFilm();
  });
  document.addEventListener('visibilitychange', updateLocationFilm);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateLocationFilm();
  }).observe(locationHero);
  updateLocationFilm();
}
