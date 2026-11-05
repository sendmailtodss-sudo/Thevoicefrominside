/* A small, optional Canvas layer. Links and artwork remain ordinary HTML. */
(() => {
  'use strict';
  let release = () => {};
  function mount(scope = document) {
    release();
    const host = scope.querySelector('.minds-landing');
    if (!host) return;
    const hero = host.querySelector('.minds-hero');
    const canvas = host.querySelector('.minds-canvas');
    const button = host.querySelector('.minds-motion');
    const gallery = host.querySelector('.minds-gallery');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listeners = [];
    const on = (target, name, handler, options) => {
      target.addEventListener(name, handler, options);
      listeners.push(() => target.removeEventListener(name, handler, options));
    };
    let ctx;
    try { ctx = canvas.getContext('2d', { alpha: true }); } catch (_) {}
    // The CSS star field and all content remain usable if Canvas is unavailable.
    if (!ctx) { host.dataset.visual = 'static'; return; }
    host.dataset.visual = 'canvas';
    let width = 0, height = 0, frame = 0, last = 0, phase = 0;
    let paused = motionQuery.matches, visible = true, alive = true;
    let progress = 0, starCount = 0;
    let points = [], clusters = [];
    // Seeded positions avoid noisy layout changes on resize.
    let seed = 260146;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const colors = ['#ffe3a3', '#abcfd8', '#b8ead4', '#bdb5e5', '#f1c4b9'];
    for (let i = 0; i < 720; i++) points.push({
      r: Math.pow(random(), .58), arm: i % 4, offset: (random() - .5) * .55,
      size: .25 + random() * 1.3, alpha: .2 + random() * .65,
      color: colors[i % colors.length], twinkle: random() * Math.PI * 2,
    });
    for (let i = 0; i < 12; i++) clusters.push({
      angle: i / 12 * Math.PI * 2 + .3, r: .38 + random() * .55,
      color: colors[i % colors.length], size: 8 + random() * 12,
    });
    function scenePoint(r, angle, cx, cy, radius) {
      const x = Math.cos(angle) * r * radius;
      const y = Math.sin(angle) * r * radius * .42;
      const tilt = -.24;
      return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)];
    }
    function draw() {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const mobile = width < 700;
      const cx = width * (mobile ? .65 : .74);
      const cy = height * (mobile ? .68 : .46);
      const radius = Math.min(mobile ? width * .8 : width * .37, 580);
      const drift = phase;
      const collapse = 1 - progress * .18;
      ctx.globalCompositeOperation = 'screen';
      const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * .7);
      haze.addColorStop(0, '#b8dec32b'); haze.addColorStop(.12, '#bfd3e218');
      haze.addColorStop(.5, '#4e6e9911'); haze.addColorStop(1, '#153c4200');
      ctx.fillStyle = haze; ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < starCount; i++) {
        const p = points[i];
        const angle = p.arm * Math.PI / 2 + p.r * 4.8 + p.offset + drift * (.035 + (1 - p.r) * .025);
        const [x, y] = scenePoint(p.r * collapse, angle, cx, cy, radius);
        ctx.globalAlpha = p.alpha * (paused ? .9 : .82 + Math.sin(phase * .3 + p.twinkle) * .12);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(x, y, p.size * (mobile ? .82 : 1), 0, Math.PI * 2); ctx.fill();
      }
      const locations = clusters.map(c => scenePoint(c.r * collapse, c.angle + drift * .017, cx, cy, radius));
      ctx.lineWidth = .6;
      for (let i = 0; i < locations.length; i++) {
        const a = locations[i], b = locations[(i + 4) % locations.length];
        ctx.globalAlpha = .12; ctx.strokeStyle = clusters[i].color;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(cx, cy, b[0], b[1]); ctx.stroke();
        if (!paused) {
          const t = ((phase * .045 + i / 12) % 1);
          const x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * cx + t * t * b[0];
          const y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * cy + t * t * b[1];
          ctx.globalAlpha = .65; ctx.fillStyle = clusters[i].color;
          ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill();
        }
      }
      clusters.forEach((c, i) => {
        const [x, y] = locations[i];
        const size = c.size * (mobile ? .55 : 1);
        ctx.strokeStyle = c.color; ctx.fillStyle = c.color;
        ctx.globalAlpha = .34; ctx.lineWidth = .7;
        // An abstract branching idea cluster, not a medical brain model.
        ctx.beginPath();
        for (let j = 0; j <= 24; j++) {
          const a = j / 24 * Math.PI * 2;
          const ripple = size * (.7 + .13 * Math.sin(a * 5 + i));
          const px = x + Math.cos(a) * ripple, py = y + Math.sin(a) * ripple * .75;
          if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
        for (let j = 0; j < 5; j++) {
          const a = j / 5 * Math.PI * 2 + i;
          const px = x + Math.cos(a) * size * .55, py = y + Math.sin(a) * size * .4;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px, py); ctx.stroke();
          ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(px, py, 1.15, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = .34;
        }
        ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    function cancel() { if (frame) cancelAnimationFrame(frame); frame = 0; }
    function tick(time) {
      frame = 0;
      if (!alive || paused || !visible || document.hidden) return;
      if (time - last >= 1000 / 30) {
        phase += Math.min((time - last) / 1000, .05); last = time;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }
    function schedule() {
      cancel();
      if (alive && !paused && visible && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(tick); }
    }
    function updateLabel() {
      button.setAttribute('aria-pressed', String(paused));
      button.textContent = paused ? button.dataset.startLabel : button.dataset.pauseLabel;
      host.dataset.motion = paused ? 'paused' : 'playing';
    }
    function resize() {
      const rect = hero.getBoundingClientRect();
      width = Math.round(rect.width); height = Math.round(rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starCount = width < 700 ? 260 : 680;
      draw();
    }
    button.hidden = false;
    on(button, 'click', () => { paused = !paused; updateLabel(); draw(); schedule(); });
    on(motionQuery, 'change', () => { if (motionQuery.matches) paused = true; updateLabel(); draw(); schedule(); });
    on(document, 'visibilitychange', schedule);
    on(window, 'scroll', () => {
      if (paused) return;
      const rect = hero.getBoundingClientRect();
      progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)));
      hero.style.setProperty('--minds-drift', String(progress * 12));
    }, { passive: true });
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    if (resizeObserver) resizeObserver.observe(hero); else on(window, 'resize', resize);
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === hero) { visible = entry.isIntersecting; schedule(); }
        else if (entry.target === gallery && entry.isIntersecting) gallery.dataset.revealed = 'true';
      }
    }, { threshold: .01 }) : null;
    observer?.observe(hero); observer?.observe(gallery);
    // Give the skip link an explicit keyboard destination without forcing smooth scrolling.
    on(host.querySelector('.minds-skip'), 'click', event => {
      event.preventDefault();
      gallery.scrollIntoView({ behavior: 'instant', block: 'start' });
      gallery.focus({ preventScroll: true });
    });
    updateLabel(); resize(); schedule();
    release = () => {
      alive = false; cancel(); listeners.forEach(fn => fn());
      observer?.disconnect(); resizeObserver?.disconnect();
      button.hidden = true;
    };
  }
  window.MindsLanding = { mount, destroy: () => release() };
})();
