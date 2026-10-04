// Particle motion adapted from the supplied welcome sample; splash-only and bounded.
(function () {
  'use strict';
  const root = document.getElementById('welcome-splash');
  const canvas = document.getElementById('welcome-sparks');
  const head = root && root.querySelector('.welcome-splash__head');
  const seam = root && root.querySelector('.welcome-splash__seam');
  if (!canvas || !head || !seam || !window.requestAnimationFrame) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const particles = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let raf = 0, previous = 0, stopped = false, accumulated = 0;
  function stop() {
    if (stopped) return;
    stopped = true;
    window.cancelAnimationFrame(raf);
    window.clearTimeout(deadline);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', stop);
    root.removeEventListener('transitionstart', transition);
    particles.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  function visibility() { if (document.hidden) stop(); }
  function transition(event) { if (event.target === root && event.propertyName === 'opacity') stop(); }
  function emit(x, y, count, ember) {
    for (let i = 0; i < count && particles.length < 220; i++) {
      const angle = -Math.PI / 2 + (Math.random() - .5) * (ember ? 2.2 : 1.6);
      const speed = ember ? .7 + Math.random() * 1.5 : 1.5 + Math.random() * 4.5;
      particles.push({ x, y, vx: Math.cos(angle) * speed + (ember ? .2 : 1.2),
        vy: Math.sin(angle) * speed, life: 1, decay: .018 + Math.random() * .025,
        size: ember ? 1 + Math.random() : 1.2 + Math.random() * 1.4 });
    }
  }
  function frame(now) {
    if (stopped) return;
    if (!root.isConnected || document.hidden) { stop(); return; }
    const bounds = root.getBoundingClientRect();
    const width = Math.round(bounds.width * dpr), height = Math.round(bounds.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const dt = previous ? Math.min(40, now - previous) : 16.67;
    previous = now;
    const step = dt / 16.67;
    const tip = head.getBoundingClientRect(), track = seam.getBoundingClientRect();
    const x = tip.left + tip.width / 2 - bounds.left;
    const y = track.top + 1 - bounds.top;
    accumulated += dt;
    while (accumulated >= 16.67) {
      accumulated -= 16.67;
      emit(x, y, 3, false);
      // Random residual flickers only on the portion already passed by the beam.
      if (Math.random() < .28) emit(track.left - bounds.left + Math.random() * Math.max(0, x - (track.left - bounds.left)), y, 1, true);
    }
    ctx.clearRect(0, 0, bounds.width, bounds.height);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * step; p.y += p.vy * step; p.vy += .16 * step; p.life -= p.decay * step;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.fillStyle = 'rgba(' + Math.round(60 + p.life * 170) + ',' + Math.round(140 + p.life * 100) + ',255,' + p.life + ')';
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    raf = window.requestAnimationFrame(frame);
  }
  const deadline = window.setTimeout(stop, 3000);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', stop);
  root.addEventListener('transitionstart', transition);
  raf = window.requestAnimationFrame(frame);
})();
