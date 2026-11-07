(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // Header state on scroll
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var burger = document.getElementById('burger');
  var nav = document.getElementById('main-nav');
  function closeMenu() { document.body.classList.remove('nav-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  // Hero slider
  var slides = document.querySelectorAll('.arch .slide');
  var dots = document.querySelectorAll('.slide-dots button');
  var current = 0, timer;
  function show(i) {
    slides[current].classList.remove('is-active'); dots[current].classList.remove('is-active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('is-active'); dots[current].classList.add('is-active');
  }
  function start() { timer = setInterval(function () { show(current + 1); }, 4500); }
  dots.forEach(function (d, i) { d.addEventListener('click', function () { clearInterval(timer); show(i); start(); }); });
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();

  // Reveal on scroll (content is visible at rest; this only slides it in)
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add('in'); else io.observe(el);
    });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  // Order recap
  var form = document.getElementById('order-form');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = form.name.value.trim();
    var q05 = parseInt(form.q05.value, 10) || 0;
    var q15 = parseInt(form.q15.value, 10) || 0;
    var addr = form.addr.value.trim();
    var text = document.getElementById('recap-text');
    if (q05 + q15 === 0) {
      text.textContent = 'Indiquez au moins un pack de 0,5 L ou de 1,5 L.';
    } else {
      var parts = [];
      if (q05) parts.push(q05 + ' pack' + (q05 > 1 ? 's' : '') + ' de 0,5 L');
      if (q15) parts.push(q15 + ' pack' + (q15 > 1 ? 's' : '') + ' de 1,5 L');
      text.textContent = (name ? name + ' : ' : 'Votre commande : ') + parts.join(' et ') + (addr ? ', livraison à ' + addr : '') + '.';
    }
    document.getElementById('recap').hidden = false;
  });

  // Moments carousel: auto-scroll, loops, pauses on hover/touch
  var track = document.getElementById('m-track');
  if (track) {
    var mSlides = track.querySelectorAll('.m-slide');
    var dotsBox = document.getElementById('m-dots');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function perView() { return Math.max(1, Math.round(track.clientWidth / mSlides[0].getBoundingClientRect().width)); }
    function pages() { return Math.max(1, mSlides.length - perView() + 1); }
    function idx() { var w = mSlides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0); return Math.round(track.scrollLeft / w); }
    function go(i) {
      var n = pages(); i = ((i % n) + n) % n;
      track.scrollTo({ left: mSlides[i].offsetLeft - track.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    }
    function buildDots() {
      dotsBox.innerHTML = '';
      for (var k = 0; k < pages(); k++) {
        var b = document.createElement('button');
        b.setAttribute('aria-label', 'Photo ' + (k + 1));
        (function (k) { b.addEventListener('click', function () { go(k); restart(); }); })(k);
        dotsBox.appendChild(b);
      }
      syncDots();
    }
    function syncDots() { var i = Math.min(idx(), pages() - 1); dotsBox.querySelectorAll('button').forEach(function (d, k) { d.classList.toggle('is-active', k === i); }); }
    var auto, paused = false;
    function restart() { clearInterval(auto); auto = setInterval(function () { if (!paused && !document.hidden) go(idx() + 1); }, 3500); }
    document.getElementById('m-next').addEventListener('click', function () { go(idx() + 1); restart(); });
    document.getElementById('m-prev').addEventListener('click', function () { go(idx() - 1); restart(); });
    track.addEventListener('mouseenter', function () { paused = true; });
    track.addEventListener('mouseleave', function () { paused = false; });
    track.addEventListener('touchstart', function () { paused = true; }, { passive: true });
    track.addEventListener('touchend', function () { setTimeout(function () { paused = false; }, 2500); }, { passive: true });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(syncDots); }, { passive: true });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(buildDots, 200); });
    buildDots(); restart();
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
