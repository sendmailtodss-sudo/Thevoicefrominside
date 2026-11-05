/* Stable workshop entry points; no network calls or automatic publication. */
(() => {
  'use strict';
  const allowed = new Set(['sources', 'policy', 'forum', 'studio', 'art', 'ai', 'log', 'roadmap']);
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-workshop-tab]');
    if (!trigger) return;
    const tab = trigger.dataset.workshopTab;
    if (allowed.has(tab) && window.UnifiedWorkshop) window.UnifiedWorkshop.open(tab);
  });
  const tab = location.hash.slice(1);
  if (allowed.has(tab) && window.UnifiedWorkshop) window.UnifiedWorkshop.open(tab);
})();
