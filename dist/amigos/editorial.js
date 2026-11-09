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
