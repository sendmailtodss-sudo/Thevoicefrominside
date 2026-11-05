/* Optional editorial reading aid. No network requests or automatic storage. */
(() => {
  'use strict';
  const KEY = 'stemmen:reader-bookmark:v1';
  let state = null;
  const copy = {
    no: { label: 'Leseguide', time: 'min lesetid', contents: 'Innhold', save: 'Husk hvor jeg er', resume: 'Gjenoppta lesingen', clear: 'Slett bokmerke', saved: 'Bokmerke lagret i denne nettleseren.', removed: 'Bokmerke slettet.', unavailable: 'Lagring er ikke tilgjengelig i denne nettleseren.' },
    en: { label: 'Reading guide', time: 'min read', contents: 'Contents', save: 'Save my place', resume: 'Resume reading', clear: 'Delete bookmark', saved: 'Bookmark saved in this browser.', removed: 'Bookmark deleted.', unavailable: 'Storage is unavailable in this browser.' }
  };
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const getBookmark = route => {
    try {
      const item = JSON.parse(localStorage.getItem(KEY) || 'null');
      return item && item.path === route && Number.isFinite(item.percent) && item.percent >= 0 && item.percent <= 100 ? item : null;
    } catch (_) { return null; }
  };
  const articleTop = article => article.getBoundingClientRect().top + window.scrollY;
  const scrollPercent = article => {
    const height = Math.max(1, article.getBoundingClientRect().height);
    return Math.round(Math.min(100, Math.max(0, (window.scrollY - articleTop(article)) / height * 100)));
  };
  function destroy() {
    if (!state) return;
    state.panel.remove();
    state.generatedIds.forEach(node => node.removeAttribute('id'));
    state.focusCleanups.forEach(cleanup => cleanup());
    state = null;
  }
  function init(root = document) {
    destroy();
    if (!root || typeof root.querySelector !== 'function') return;
    const article = root.matches?.('article.page') ? root : root.querySelector('article.page');
    if (!article) return;
    const route = root.dataset?.premiumRoute || root.closest?.('[data-premium-route]')?.dataset.premiumRoute || window.__existingPreview?.route || location.pathname;
    const lang = route ? (route.startsWith('/en/') || route === '/en' ? 'en' : 'no') : ((document.documentElement.lang || '').startsWith('en') ? 'en' : 'no');
    const t = copy[lang];
    const headings = Array.from(article.querySelectorAll('h2,h3')).filter(h => h.textContent.trim());
    const text = article.innerText || article.textContent || '';
    const words = (text.match(/\S+/g) || []).length;
    if (words < 80 && headings.length < 2) return;
    const panel = element('aside', 'premium-reader');
    panel.setAttribute('aria-label', t.label);
    const top = element('div', 'premium-reader__top');
    const eyebrow = element('span', 'premium-reader__eyebrow', t.label);
    const time = element('span', 'premium-reader__time', `${Math.max(1, Math.ceil(words / 220))} ${t.time}`);
    top.append(eyebrow, time);
    panel.append(top);
    const generatedIds = [];
    const focusCleanups = [];
    if (headings.length) {
      const details = element('details', 'premium-reader__contents');
      const summary = element('summary', '', `${t.contents} · ${headings.length}`);
      const nav = element('nav', 'premium-reader__nav');
      nav.setAttribute('aria-label', t.contents);
      const list = element('ol', 'premium-reader__list');
      headings.forEach((heading, index) => {
        if (!heading.id) {
          let id = `premium-reader-${index + 1}`;
          let suffix = 2;
          while (document.getElementById(id)) id = `premium-reader-${index + 1}-${suffix++}`;
          heading.id = id;
          generatedIds.push(heading);
        }
        const item = element('li', heading.tagName === 'H3' ? 'premium-reader__sub' : '');
        const link = element('a', '', heading.textContent.trim());
        link.href = `#${encodeURIComponent(heading.id)}`;
        link.addEventListener('click', () => {
          const hadTabindex = heading.hasAttribute('tabindex');
          const previous = heading.getAttribute('tabindex');
          if (!hadTabindex) heading.setAttribute('tabindex', '-1');
          requestAnimationFrame(() => heading.focus({ preventScroll: true }));
          const restore = () => {
            if (!hadTabindex) heading.removeAttribute('tabindex');
            else heading.setAttribute('tabindex', previous);
            heading.removeEventListener('blur', restore);
          };
          heading.addEventListener('blur', restore, { once: true });
          focusCleanups.push(restore);
        });
        item.append(link);
        list.append(item);
      });
      nav.append(list);
      details.append(summary, nav);
      panel.append(details);
    }
    const actions = element('div', 'premium-reader__actions');
    const save = element('button', '', t.save);
    save.type = 'button';
    const resume = element('button', '', t.resume);
    resume.type = 'button';
    const clear = element('button', 'premium-reader__quiet', t.clear);
    clear.type = 'button';
    const status = element('span', 'premium-reader__status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const update = () => {
      const exists = !!getBookmark(route);
      resume.hidden = !exists;
      clear.hidden = !exists;
    };
    save.addEventListener('click', () => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ path: route, percent: scrollPercent(article) }));
        status.textContent = t.saved;
      } catch (_) { status.textContent = t.unavailable; }
      update();
    });
    resume.addEventListener('click', () => {
      const item = getBookmark(route);
      if (!item) return update();
      const top = articleTop(article) + article.getBoundingClientRect().height * item.percent / 100;
      window.scrollTo({ top: Math.min(top, Math.max(0, document.documentElement.scrollHeight - window.innerHeight)), behavior: 'instant' });
    });
    clear.addEventListener('click', () => {
      try { localStorage.removeItem(KEY); status.textContent = t.removed; }
      catch (_) { status.textContent = t.unavailable; }
      update();
    });
    actions.append(save, resume, clear, status);
    panel.append(actions);
    article.prepend(panel);
    state = { panel, generatedIds, focusCleanups };
    update();
  }
  window.PremiumReader = { init, destroy };
})();
