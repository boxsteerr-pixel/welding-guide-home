(function () {
  'use strict';
  const splash = document.getElementById('welcome-splash');
  if (!splash) return;
  if (document.documentElement.classList.contains('skip-welcome')) { splash.remove(); return; }
  const number = document.getElementById('welcome-splash-number');
  const timers = new Set();
  let removed = false;
  function later(fn, delay) {
    const id = window.setTimeout(function () { timers.delete(id); if (!removed) fn(); }, delay);
    timers.add(id);
  }
  function remove() {
    if (removed) return;
    removed = true;
    timers.forEach(function (id) { window.clearTimeout(id); });
    timers.clear();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', remove);
    splash.removeEventListener('wheel', preventScroll);
    splash.removeEventListener('touchmove', preventScroll);
    splash.removeEventListener('transitionend', onTransition);
    splash.remove();
  }
  function onVisibility() { if (document.hidden) remove(); }
  function preventScroll(event) { event.preventDefault(); }
  function onTransition(event) { if (event.target === splash && event.propertyName === 'opacity') remove(); }
  // No homepage styles, route state, storage or existing event handlers are changed.
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', remove);
  splash.addEventListener('wheel', preventScroll, {passive:false});
  splash.addEventListener('touchmove', preventScroll, {passive:false});
  splash.addEventListener('transitionend', onTransition);
  // Fail-open if a node is missing or the page starts in the background.
  const navigation = window.performance && window.performance.getEntriesByType
    ? window.performance.getEntriesByType('navigation')[0] : null;
  if (!number || document.hidden || (navigation && navigation.type === 'back_forward')) { remove(); return; }
  later(function () { number.textContent = '2'; }, 1000);
  later(function () { number.textContent = '1'; }, 2000);
  later(function () {
    splash.classList.add('welcome-splash--leaving');
    later(remove, 500);
  }, 3000);
  later(remove, 4500);
})();
