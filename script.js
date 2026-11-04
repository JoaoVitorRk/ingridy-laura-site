/* Método RK: abertura, abas dos casos e detalhes de navegação. */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var um = function (s, base) { return (base || document).querySelector(s); };
  var todos = function (s, base) { return Array.prototype.slice.call((base || document).querySelectorAll(s)); };

  /* Abertura: roda sozinha em cerca de 2 s. Rolar, tocar ou usar o teclado termina na hora. */
  var abertura = um('.abertura');
  var eventos = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  function retirar() {
    if (abertura && abertura.parentNode) abertura.parentNode.removeChild(abertura);
    abertura = null;
  }
  if (abertura && !html.classList.contains('sem-abertura')) {
    var feito = false;
    var revelar = function (rapido) {
      if (rapido) html.classList.add('rapido');
      if (feito) return;
      feito = true;
      html.classList.add('revelar');
      try { sessionStorage.setItem('abertura-vista', '1'); } catch (e) { /* navegação privada */ }
      setTimeout(retirar, rapido ? 550 : 1250);
    };
    var cedo = setTimeout(function () { revelar(false); }, 850);
    var interagiu = function () {
      clearTimeout(cedo);
      revelar(true);
      eventos.forEach(function (ev) { window.removeEventListener(ev, interagiu); });
    };
    eventos.forEach(function (ev) { window.addEventListener(ev, interagiu, { passive: true }); });
  } else {
    retirar();
  }

  /* Surgimento discreto */
  var surgir = todos('.surge');
  if ('IntersectionObserver' in window) {
    var vigia = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (it.isIntersecting) { it.target.classList.add('in'); vigia.unobserve(it.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
    surgir.forEach(function (el) { vigia.observe(el); });
  } else {
    surgir.forEach(function (el) { el.classList.add('in'); });
  }

  /* O ciclo: a etapa em destaque avança sozinha */
  var etapas = todos('[data-anel] li');
  if (etapas.length) {
    var ativa = 0;
    etapas[0].classList.add('ativo');
    if (!reduz) {
      setInterval(function () {
        etapas[ativa].classList.remove('ativo');
        ativa = (ativa + 1) % etapas.length;
        etapas[ativa].classList.add('ativo');
      }, 1500);
    }
  }

  /* Casos: abas com teclado */
  var abasBox = um('[data-abas]');
  if (abasBox) {
    var abas = todos('[role="tab"]', abasBox);
    var selecionar = function (aba, foco) {
      abas.forEach(function (a) {
        var sim = a === aba;
        a.setAttribute('aria-selected', sim ? 'true' : 'false');
        a.tabIndex = sim ? 0 : -1;
        document.getElementById(a.getAttribute('aria-controls')).hidden = !sim;
      });
      if (foco) aba.focus();
    };
    abas.forEach(function (aba, i) {
      aba.addEventListener('click', function () { selecionar(aba); });
      aba.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); selecionar(abas[(i + 1) % abas.length], true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); selecionar(abas[(i - 1 + abas.length) % abas.length], true); }
      });
    });
    selecionar(abas[0]);
  }

  /* Botão fixo no celular: aparece depois da capa e some perto do fim */
  var fixo = um('[data-agendar-fixo]');
  var capa = um('.capa');
  var final = um('.final');
  function aoRolar() {
    if (!fixo || !capa || !final) return;
    var alt = window.innerHeight;
    fixo.classList.toggle('ligado', capa.getBoundingClientRect().bottom < alt * 0.3 && final.getBoundingClientRect().top > alt * 0.85);
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', aoRolar);
  aoRolar();
})();
