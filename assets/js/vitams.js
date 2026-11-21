/* Vitam's — interactions et animations
   Pour changer le numéro WhatsApp : modifiez WA_NUMBER ci-dessous (format international, sans + ni espaces). */
(function () {
  'use strict';
  var WA_NUMBER = '22782888010';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDesktop = window.matchMedia('(min-width: 901px)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------- WhatsApp links ---------------- */
  function waUrl(text) { return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text); }
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = waUrl(a.getAttribute('data-wa'));
    a.target = '_blank'; a.rel = 'noopener';
  });

  // Format cards: quantity stepper + pre-filled order message
  document.querySelectorAll('.format').forEach(function (card) {
    var fmt = card.getAttribute('data-format');
    var input = card.querySelector('.qty input');
    var link = card.querySelector('[data-wa-format]');
    function sync() {
      var q = Math.max(1, parseInt(input.value, 10) || 1);
      link.href = waUrl('Bonjour Vitam\'s, je souhaite commander de l\'eau Vitam\'s.\nFormat : ' + fmt + '\nQuantité : ' + q + '\nMon quartier : ');
    }
    card.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        input.value = Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute('data-step'), 10));
        sync();
      });
    });
    input.addEventListener('input', sync);
    input.addEventListener('blur', function () { input.value = Math.max(1, parseInt(input.value, 10) || 1); sync(); });
    link.target = '_blank'; link.rel = 'noopener';
    sync();
  });

  // Reseller form -> WhatsApp
  var form = document.getElementById('resell-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return (document.getElementById(id).value || '').trim(); };
      var err = document.getElementById('r-error');
      if (!v('r-name') || !v('r-city')) { err.hidden = false; (v('r-name') ? document.getElementById('r-city') : document.getElementById('r-name')).focus(); return; }
      err.hidden = true;
      var fmts = [];
      if (document.getElementById('r-05').checked) fmts.push('0,5 L');
      if (document.getElementById('r-15').checked) fmts.push('1,5 L');
      var lines = [
        'Bonjour Vitam\'s, je souhaite devenir revendeur.',
        'Nom : ' + v('r-name'),
        v('r-biz') ? 'Commerce : ' + v('r-biz') : '',
        'Activité : ' + v('r-type'),
        'Ville / quartier : ' + v('r-city'),
        fmts.length ? 'Formats : ' + fmts.join(' et ') : '',
        v('r-vol') ? 'Volume estimé : ' + v('r-vol') : ''
      ].filter(Boolean);
      window.open(waUrl(lines.join('\n')), '_blank', 'noopener');
    });
  }

  /* ---------------- Points de vente (show list when filled) ---------------- */
  var pos = document.getElementById('pos-list');
  if (pos && pos.children.length) { pos.hidden = false; var empty = document.getElementById('pos-empty'); if (empty) empty.hidden = true; }

  /* ---------------- Nav ---------------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var lastY = window.scrollY;
  var waFloat = document.querySelector('.wa-float');
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    var hide = y > lastY && y > 600 && !document.body.classList.contains('nav-open');
    nav.classList.toggle('is-hidden', hide);
    // desktop: the nav already shows "Commander" over the hero, so the floating button waits; on mobile it is always visible
    if (waFloat) waFloat.classList.toggle('is-off', isDesktop && y < window.innerHeight * 0.6);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeMenu() { document.body.classList.remove('nav-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.querySelectorAll('#nav-links a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function fmtNum(n, d) { return n.toFixed(d).replace('.', ','); }

  /* ---------------- No animation path ---------------- */
  function noAnim() {
    root.classList.add('no-anim');
    document.querySelectorAll('.statement .sw').forEach(function (s) { s.classList.add('on'); });
  }

  // split statement words (needed for both paths)
  document.querySelectorAll('[data-words]').forEach(function (el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) { return '<span class="sw">' + w + '</span>'; }).join(' ');
  });

  function boot() {
    if (reduce || !window.gsap || !window.ScrollTrigger) { noAnim(); return; }
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    ST.config({ ignoreMobileResize: true });

    /* Smooth scroll (desktop only, like rougatech.com/academy) */
    var lenis = null;
    if (isDesktop && finePointer && window.Lenis) {
      lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var el = document.querySelector(id); if (!el) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(el, { offset: -10 }); else el.scrollIntoView({ behavior: 'smooth' });
      });
    });

    /* ---------- HERO ---------- */
    var bottle = document.getElementById('bottle');
    var sheen = document.getElementById('bottle-sheen');
    var heroState = { boost: 0, progress: 0 };

    var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro.from('.ht-in', { yPercent: 110, duration: 1.3, stagger: 0.12 })
      .from('#bottle-wrap', { y: 160, opacity: 0, rotate: -10, scale: 0.9, duration: 1.6 }, 0.15)
      .from('.ht-waves', { scaleY: 0, transformOrigin: '50% 100%', duration: 1.4 }, 0.3)
      .from('[data-hero-in]', { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, 0.55)
      .fromTo(sheen, { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.6, ease: 'power2.inOut' }, 0.9);

    var heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: isDesktop ? '+=120%' : 'bottom top',
        pin: isDesktop ? '#hero-stage' : false,
        scrub: 0.8,
        onUpdate: function (self) { heroState.progress = self.progress; heroState.boost = Math.min(6, Math.abs(self.getVelocity()) / 400); }
      }
    });
    heroTl
      .to(bottle, { rotation: -14, rotationY: 28, scale: 1.04, ease: 'none', duration: 0.45 }, 0)
      .to(sheen, { backgroundPosition: '100% 0', ease: 'none', duration: 0.45 }, 0)
      .to(bottle, { rotation: 10, rotationY: -22, scale: isDesktop ? 0.86 : 0.95, y: isDesktop ? -30 : 20, ease: 'none', duration: 0.55 }, 0.45)
      .to(sheen, { backgroundPosition: '0% 0', ease: 'none', duration: 0.55 }, 0.45)
      .to('.ht-1', { xPercent: isDesktop ? -38 : -6, ease: 'none', duration: 1 }, 0)
      .to('.ht-2', { xPercent: isDesktop ? 38 : 10, ease: 'none', duration: 1 }, 0)
      .to('.ht-waves', { yPercent: -60, scaleY: 1.6, ease: 'none', duration: 1 }, 0)
      .to('.hero-caustics', { yPercent: -12, ease: 'none', duration: 1 }, 0);
    if (isDesktop) {
      heroTl.to('.hero-foot, .hero-kicker', { y: -40, opacity: 0, ease: 'none', duration: 0.35 }, 0.62)
        .to('.hero-title', { opacity: 0.25, ease: 'none', duration: 0.3 }, 0.7);
    }

    /* Bubbles + droplets canvas */
    var cv = document.getElementById('bubbles');
    if (cv && cv.getContext) {
      var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, parts = [], running = true;
      var count = isDesktop ? 70 : 34;
      function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      function make(randomY) {
        var drop = Math.random() < 0.22;
        return { x: Math.random() * W, y: randomY ? Math.random() * H : H + 20, r: drop ? 3 + Math.random() * 4 : 1.5 + Math.random() * 7, v: 0.25 + Math.random() * 0.9, w: Math.random() * Math.PI * 2, drop: drop, a: 0.25 + Math.random() * 0.55 };
      }
      size(); for (var i = 0; i < count; i++) parts.push(make(true));
      window.addEventListener('resize', size);
      ST.create({ trigger: '#hero', start: 'top bottom', end: 'bottom top', onToggle: function (s) { running = s.isActive; } });
      gsap.ticker.add(function () {
        if (!running || document.hidden) return;
        ctx.clearRect(0, 0, W, H);
        var speed = 1 + heroState.progress * 3 + heroState.boost;
        heroState.boost *= 0.92;
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y -= p.v * speed; p.w += 0.03; p.x += Math.sin(p.w) * 0.35;
          if (p.y < -20) parts[i] = p = make(false);
          ctx.globalAlpha = p.a;
          if (p.drop) {
            ctx.fillStyle = 'rgba(220,240,255,.9)';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.r * 1.8);
            ctx.bezierCurveTo(p.x + p.r, p.y - p.r * 0.4, p.x + p.r, p.y + p.r, p.x, p.y + p.r);
            ctx.bezierCurveTo(p.x - p.r, p.y + p.r, p.x - p.r, p.y - p.r * 0.4, p.x, p.y - p.r * 1.8);
            ctx.fill();
          } else {
            ctx.strokeStyle = 'rgba(200,232,255,.8)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,.55)';
            ctx.beginPath(); ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.28, 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      });
    }

    /* ---------- split headings ---------- */
    document.querySelectorAll('[data-split]').forEach(function (el) {
      // keep <em> groups intact, split plain words
      var html = el.innerHTML.replace(/(<em>.*?<\/em>)|([^\s<]+)/g, function (m, em, word) {
        return '<span class="w-wrap"><span class="w-in">' + (em || word) + '</span></span>';
      });
      el.innerHTML = html;
      gsap.from(el.querySelectorAll('.w-in'), {
        yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    /* ---------- statement: words light up while scrolling ---------- */
    document.querySelectorAll('.statement').forEach(function (el) {
      var words = el.querySelectorAll('.sw');
      ST.create({
        trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true,
        onUpdate: function (s) {
          var n = Math.round(s.progress * words.length);
          words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
        }
      });
    });

    /* ---------- rise-in ---------- */
    ST.batch('[data-rise]', {
      start: 'top 88%',
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.09, overwrite: true }); }
    });

    /* ---------- counters ---------- */
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count'));
      if (!to) return;
      var d = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var o = { v: 0 };
      el.textContent = fmtNum(0, d);
      gsap.to(o, {
        v: to, duration: 1.6, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: function () { el.textContent = fmtNum(o.v, d); }
      });
    });

    /* ---------- formats: bottle floats on scroll ---------- */
    document.querySelectorAll('.format-bottle').forEach(function (b, i) {
      gsap.fromTo(b, { yPercent: 12, rotation: i ? 6 : -6 }, { yPercent: -6, rotation: 0, ease: 'none', scrollTrigger: { trigger: b.closest('.format'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* ---------- journey: horizontal scroll while pinned ---------- */
    var track = document.getElementById('journey-track');
    var bar = document.getElementById('journey-bar');
    if (track) {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      gsap.to(track, {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: '#source', pin: '#journey-pin', start: 'top top',
          end: function () { return '+=' + dist(); },
          scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (s) { bar.style.transform = 'scaleX(' + s.progress + ')'; }
        }
      });
      gsap.utils.toArray('.step-visual img').forEach(function (img) { gsap.set(img, { scale: 1.12 }); });
    }

    /* ---------- reel: endless gallery, faster when scrolling ---------- */
    document.querySelectorAll('.reel-row').forEach(function (row) {
      Array.prototype.slice.call(row.children).forEach(function (c) { var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); row.appendChild(k); });
      var dir = parseFloat(row.getAttribute('data-dir') || '-1'), x = 0, hover = false, vel = 0, half = 0, live = false;
      function measure() { half = row.scrollWidth / 2; }
      measure(); window.addEventListener('resize', measure); window.addEventListener('load', measure);
      row.addEventListener('mouseenter', function () { hover = true; });
      row.addEventListener('mouseleave', function () { hover = false; });
      ST.create({ trigger: row, start: 'top bottom', end: 'bottom top', onToggle: function (s) { live = s.isActive; }, onUpdate: function (s) { vel = Math.min(12, Math.abs(s.getVelocity()) / 250); } });
      gsap.ticker.add(function () {
        if (!live || !half) return;
        var sp = (hover ? 0.15 : 0.7) + vel; vel *= 0.94;
        x += dir * sp;
        if (x <= -half) x += half; if (x > 0) x -= half;
        row.style.transform = 'translate3d(' + x + 'px,0,0)';
      });
    });

    /* ---------- final ---------- */
    gsap.from('.final-bottle', { y: 120, rotation: -24, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.final', start: 'top 75%' } });

    window.addEventListener('load', function () { ST.refresh(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  // Safety net: if the animation libraries never arrive, show everything.
  setTimeout(function () { if (!window.gsap) noAnim(); }, 4000);
})();
