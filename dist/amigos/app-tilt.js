/* Optional device tilt for the decorative phone; sensor readings stay in memory. */
(() => {
  const section = document.querySelector('#aplikacja');
  const stage = section?.querySelector('.app-depth-stage');
  if (!stage || !window.gsap || !window.isSecureContext || !window.DeviceOrientationEvent) return;
  let media;
  const mount = () => {
    if (media) return;
    media = gsap.matchMedia();
    media.add('(pointer: coarse) and (prefers-reduced-motion: no-preference)', () => {
      const phone = stage.querySelector('.app-phone-tilt');
      const planes = [...stage.querySelectorAll('[data-app-depth]')];
      const rotateX = gsap.quickTo(phone, 'rotationX', {duration: .65, ease: 'power3.out'});
      const rotateY = gsap.quickTo(phone, 'rotationY', {duration: .65, ease: 'power3.out'});
      const movers = planes.map(el => ({depth: Number(el.dataset.appDepth), x: gsap.quickTo(el, 'x', {duration: .75, ease: 'power3.out'}), y: gsap.quickTo(el, 'y', {duration: .75, ease: 'power3.out'})}));
      const controls = document.createElement('div');
      controls.className = 'app-tilt-controls';
      controls.innerHTML = '<button type="button" class="app-tilt-button" aria-pressed="false" aria-describedby="app-tilt-status"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2M3 8l-2 4 2 4m18-8 2 4-2 4"/></svg><span>Włącz ruch telefonu</span></button><p id="app-tilt-status" role="status" aria-live="polite">Porusz telefonem, aby zobaczyć głębię.</p>';
      stage.after(controls);
      const button = controls.querySelector('button');
      const label = button.querySelector('span');
      const status = controls.querySelector('p');
      const menu = document.querySelector('#fullscreen-menu') || document.querySelector('.nav-toggle');
      let disposed = false, enabled = false, visible = false, listening = false;
      let baseline = null, frame = 0, timeout = 0, px = 0, py = 0;
      const screenAngle = () => screen.orientation?.angle ?? window.orientation ?? 0;
      const delta = (angle, reference) => ((angle - reference + 540) % 360) - 180;
      const clamp = value => Math.max(-1, Math.min(1, value));
      const reset = () => {
        cancelAnimationFrame(frame); frame = 0; baseline = null;
        rotateX.tween.pause(); rotateY.tween.pause();
        movers.forEach(m => {m.x.tween.pause(); m.y.tween.pause();});
        gsap.set(phone, {rotationX: 0, rotationY: 0});
        gsap.set(planes, {x: 0, y: 0});
      };
      const apply = () => {
        frame = 0;
        if (!listening || document.hidden || menu?.open) return;
        rotateX(-py * 5); rotateY(px * 7);
        movers.forEach(m => {m.x(px * (m.depth - 15) * .14); m.y(py * (m.depth - 15) * .1);});
      };
      const orientation = event => {
        if (!listening || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
        clearTimeout(timeout);
        if (!baseline) {
          baseline = {beta: event.beta, gamma: event.gamma, angle: screenAngle()};
          status.textContent = 'Przechyl telefon — warstwy podążą za ruchem.';
        }
        const angle = screenAngle();
        if (angle !== baseline.angle) {reset(); return;}
        const x = delta(event.gamma, baseline.gamma) / 22;
        const y = delta(event.beta, baseline.beta) / 22;
        const radians = angle * Math.PI / 180;
        px = clamp(x * Math.cos(radians) + y * Math.sin(radians));
        py = clamp(y * Math.cos(radians) - x * Math.sin(radians));
        if (!frame) frame = requestAnimationFrame(apply);
      };
      const stop = () => {
        window.removeEventListener('deviceorientation', orientation);
        listening = false; clearTimeout(timeout); reset();
      };
      const setEnabled = value => {
        enabled = value;
        button.setAttribute('aria-pressed', String(value));
        label.textContent = value ? 'Wyłącz ruch telefonu' : 'Włącz ruch telefonu';
      };
      const sync = () => {
        if (disposed) return;
        const active = enabled && visible && !document.hidden && !menu?.open;
        if (!active) {stop(); return;}
        if (listening) return;
        baseline = null; listening = true;
        window.addEventListener('deviceorientation', orientation, {passive: true});
        timeout = window.setTimeout(() => {
          stop(); setEnabled(false);
          status.textContent = 'Brak odczytu czujników. Możesz spróbować ponownie.';
        }, 4000);
      };
      const toggle = async () => {
        if (enabled) {setEnabled(false); sync(); status.textContent = 'Ruch wyłączony.'; return;}
        button.disabled = true;
        try {
          // Must be invoked directly in this click handler for Safari user activation.
          const permission = typeof DeviceOrientationEvent.requestPermission === 'function'
            ? await DeviceOrientationEvent.requestPermission() : 'granted';
          if (disposed) return;
          if (permission !== 'granted') {
            status.textContent = 'Nie udzielono dostępu do ruchu. Podgląd pozostaje nieruchomy.';
            return;
          }
          setEnabled(true); status.textContent = 'Przechyl telefon, gdy podgląd jest widoczny.'; sync();
        } catch {
          if (!disposed) status.textContent = 'Nie udało się włączyć czujników w tej przeglądarce.';
        } finally {if (!disposed) button.disabled = false;}
      };
      const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; sync();});
      observer.observe(stage);
      const menuObserver = menu ? new MutationObserver(sync) : null;
      menuObserver?.observe(menu, {attributes: true, attributeFilter: ['open']});
      button.addEventListener('click', toggle);
      document.addEventListener('visibilitychange', sync);
      window.addEventListener('orientationchange', reset);
      screen.orientation?.addEventListener('change', reset);
      return () => {
        disposed = true; stop(); observer.disconnect(); menuObserver?.disconnect();
        button.removeEventListener('click', toggle); controls.remove();
        document.removeEventListener('visibilitychange', sync);
        window.removeEventListener('orientationchange', reset);
        screen.orientation?.removeEventListener('change', reset);
      };
    });
  };
  mount();
  window.addEventListener('pagehide', () => {media?.revert(); media = null;});
  window.addEventListener('pageshow', mount);
})();
