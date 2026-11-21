/* Vitam's — interactions de la page (WhatsApp, formats, revendeurs, menu).
   Pour changer le numéro WhatsApp : modifiez WA_NUMBER (format international, sans + ni espaces). */
(function () {
  'use strict';
  var WA_NUMBER = '22782888010';
  function waUrl(text) { return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text); }
  window.VitamsWA = waUrl;

  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = waUrl(a.getAttribute('data-wa')); a.target = '_blank'; a.rel = 'noopener';
  });

  document.querySelectorAll('.format').forEach(function (card) {
    var fmt = card.getAttribute('data-format');
    var input = card.querySelector('.qty input');
    var link = card.querySelector('[data-wa-format]');
    function sync() {
      var q = Math.max(1, parseInt(input.value, 10) || 1);
      link.href = waUrl("Bonjour Vitam's, je souhaite commander de l'eau Vitam's.\nFormat : " + fmt + '\nQuantité : ' + q + '\nMon quartier : ');
    }
    card.querySelectorAll('[data-stp]').forEach(function (b) {
      b.addEventListener('click', function () {
        input.value = Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute('data-stp'), 10)); sync();
      });
    });
    input.addEventListener('input', sync);
    input.addEventListener('blur', function () { input.value = Math.max(1, parseInt(input.value, 10) || 1); sync(); });
    link.target = '_blank'; link.rel = 'noopener';
    sync();
  });

  var form = document.getElementById('resell-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = function (id) { return (document.getElementById(id).value || '').trim(); };
    var err = document.getElementById('r-error');
    if (!v('r-name') || !v('r-city')) { err.hidden = false; document.getElementById(v('r-name') ? 'r-city' : 'r-name').focus(); return; }
    err.hidden = true;
    var f = [];
    if (document.getElementById('r-05').checked) f.push('0,5 L');
    if (document.getElementById('r-15').checked) f.push('1,5 L');
    var lines = ["Bonjour Vitam's, je souhaite devenir revendeur.", 'Nom : ' + v('r-name'),
      v('r-biz') ? 'Commerce : ' + v('r-biz') : '', 'Activité : ' + v('r-type'), 'Ville / quartier : ' + v('r-city'),
      f.length ? 'Formats : ' + f.join(' et ') : '', v('r-vol') ? 'Volume estimé : ' + v('r-vol') : ''].filter(Boolean);
    window.open(waUrl(lines.join('\n')), '_blank', 'noopener');
  });

  // Menu
  var btn = document.getElementById('menuBtn'), menu = document.getElementById('menu');
  function setMenu(open) {
    menu.hidden = !open; btn.setAttribute('aria-expanded', open); document.body.classList.toggle('menu-open', open);
  }
  btn.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.querySelectorAll('[data-close]').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Jump links into the 3D timeline (data-go = viewport heights)
  document.querySelectorAll('[data-go]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault(); window.scrollTo({ top: parseFloat(a.getAttribute('data-go')) * innerHeight, behavior: 'smooth' });
    });
  });

  // Nav background + floating WhatsApp once inside the content
  var nav = document.getElementById('nav'), fl = document.querySelector('.wa-float'), content = document.getElementById('content');
  function onScroll() {
    var inContent = content.getBoundingClientRect().top < 80;
    nav.classList.toggle('solid', inContent);
    fl.classList.toggle('show', window.scrollY > innerHeight * 0.9);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
})();
