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

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
