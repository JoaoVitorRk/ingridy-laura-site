/* Método RK: abertura, selo, templo e casos.
   O movimento não depende de "reduzir movimento": o Windows do dono do projeto tem isso ligado,
   e o selo anda por requestAnimationFrame. */
(function () {
  'use strict';

  var html = document.documentElement;
  var um = function (s, base) { return (base || document).querySelector(s); };
  var todos = function (s, base) { return Array.prototype.slice.call((base || document).querySelectorAll(s)); };

  /* Abertura: cerca de 2 s. Rolar, tocar ou usar o teclado termina na hora. */
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
      setTimeout(retirar, rapido ? 600 : 1300);
    };
    var cedo = setTimeout(function () { revelar(false); }, 800);
    var interagiu = function () {
      clearTimeout(cedo);
      revelar(true);
      eventos.forEach(function (ev) { window.removeEventListener(ev, interagiu); });
    };
    eventos.forEach(function (ev) { window.addEventListener(ev, interagiu, { passive: true }); });
  } else {
    retirar();
  }

  /* Selo: gira devagar */
  var selos = todos('[data-selo] .selo-texto');
  var giro = 0;
  var antes = performance.now();
  function animar(agora) {
    var dt = Math.min(agora - antes, 80) / 1000;
    antes = agora;
    giro = (giro + 11 * dt) % 360;
    selos.forEach(function (s) { s.style.transform = 'rotate(' + giro.toFixed(2) + 'deg)'; });
    requestAnimationFrame(animar);
  }
  requestAnimationFrame(animar);

  /* Surgimentos e o templo que se desenha */
  var alvos = todos('.surge, [data-templo], [data-surge-foto]');
  if ('IntersectionObserver' in window) {
    var vigia = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (it.isIntersecting) { it.target.classList.add('in'); vigia.unobserve(it.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px 12% 0px' });
    alvos.forEach(function (el) { vigia.observe(el); });
  } else {
    alvos.forEach(function (el) { el.classList.add('in'); });
  }

  /* O ciclo: a etapa em destaque avança e o ponto acompanha */
  var anel = um('[data-anel]');
  if (anel) {
    var etapas = todos('li', anel);
    var ativa = 0;
    var voltas = 0;
    etapas[0].classList.add('ativo');
    setInterval(function () {
      etapas[ativa].classList.remove('ativo');
      ativa = (ativa + 1) % etapas.length;
      voltas += 1;
      etapas[ativa].classList.add('ativo');
      anel.style.setProperty('--giro', (voltas * 60) + 'deg');
    }, 1500);
  }

  /* Casos: folhas lado a lado, com setas */
  var folhas = um('[data-folhas]');
  if (folhas) {
    var setas = todos('[data-folha]');
    var estado = function () {
      var max = folhas.scrollWidth - folhas.clientWidth - 4;
      setas.forEach(function (b) {
        var dir = parseInt(b.getAttribute('data-folha'), 10);
        b.disabled = dir < 0 ? folhas.scrollLeft <= 4 : folhas.scrollLeft >= max;
      });
    };
    setas.forEach(function (b) {
      b.addEventListener('click', function () {
        var largura = um('.folha', folhas).getBoundingClientRect().width + parseFloat(getComputedStyle(folhas).columnGap || 0);
        folhas.scrollBy({ left: largura * parseInt(b.getAttribute('data-folha'), 10), behavior: 'smooth' });
      });
    });
    folhas.addEventListener('scroll', function () { requestAnimationFrame(estado); }, { passive: true });
    window.addEventListener('resize', estado);
    estado();
  }

  /* Topo sólido e botão fixo no celular */
  var topo = um('[data-topo]');
  var capa = um('.capa');
  var fixo = um('[data-agendar-fixo]');
  var final = um('[data-final]');
  var pendente = false;
  function aoRolar() {
    pendente = false;
    var alt = window.innerHeight;
    var fimCapa = capa.getBoundingClientRect().bottom;
    topo.classList.toggle('solido', fimCapa < 80);
    if (fixo && final) fixo.classList.toggle('ligado', fimCapa < alt * 0.3 && final.getBoundingClientRect().top > alt * 0.85);
  }
  function pedir() { if (!pendente) { pendente = true; requestAnimationFrame(aoRolar); } }
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  aoRolar();
})();
