'use strict';

// Midnight on 1 December in Poland. Turn off the campaign without removing the project.
const campaignEnabled = true;
const startsAt = Date.parse('2026-12-01T00:00:00+01:00');
const preview = new URLSearchParams(location.search).get('premiera') === '1';

if (campaignEnabled && (preview || Date.now() >= startsAt)) {
  document.documentElement.classList.add('launch-active');
  document.querySelectorAll('[data-launch]').forEach(element => {
    element.hidden = false;
  });
}
