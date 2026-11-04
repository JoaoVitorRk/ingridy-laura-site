/* Ingridy Laura R.K.: abertura, letreiros e as peças em movimento do site. */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var porId = function (s, base) { return (base || document).querySelector(s); };
  var todos = function (s, base) { return Array.prototype.slice.call((base || document).querySelectorAll(s)); };

  /* Abertura: roda sozinha em cerca de 2,6 s. Rolar, tocar ou usar o teclado termina na hora. */
  var abertura = porId('.abertura');
  function guardarVisita() {
    try { sessionStorage.setItem('abertura-vista', '1'); } catch (e) { /* navegação privada */ }
  }
  function retirarAbertura() {
    if (abertura && abertura.parentNode) abertura.parentNode.removeChild(abertura);
    abertura = null;
  }
  if (abertura && !html.classList.contains('sem-abertura')) {
    var revelada = false;
    var revelar = function (rapido) {
      if (rapido) html.classList.add('rapido');
      if (revelada) return;
      revelada = true;
      html.classList.add('revelar');
      guardarVisita();
      setTimeout(retirarAbertura, rapido ? 650 : 1500);
    };
    var cedo = setTimeout(function () { revelar(false); }, 1050);
    var interagiu = function () {
      clearTimeout(cedo);
      revelar(true);
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
        window.removeEventListener(ev, interagiu);
      });
    };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
      window.addEventListener(ev, interagiu, { passive: true });
    });
  } else {
    retirarAbertura();
  }

  /* Letreiros: movidos por tempo, não por quadro, para não travar nem pular na emenda. */
  var faixas = todos('[data-corre]').map(function (el) {
    var originais = Array.prototype.slice.call(el.children);
    var clonar = function () {
      originais.forEach(function (o) {
        var c = o.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        el.appendChild(c);
      });
    };
    clonar();
    while (el.scrollWidth < window.innerWidth * 2 + 200 && el.children.length < 80) { clonar(); clonar(); }
    return { el: el, vel: parseFloat(el.getAttribute('data-vel')) || 40, x: 0, passo: 0, parado: false };
  });
  function medirFaixas() {
    faixas.forEach(function (f) {
      var n = f.el.children.length;
      var quantos = 0;
      for (var i = 0; i < n; i++) { if (!f.el.children[i].hasAttribute('aria-hidden')) quantos++; }
      var alvo = f.el.children[quantos];
      f.passo = alvo ? alvo.offsetLeft - f.el.children[0].offsetLeft : f.el.scrollWidth / 2;
    });
  }
  medirFaixas();
  window.addEventListener('resize', medirFaixas);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medirFaixas);
  todos('.vozes-rio .corre').forEach(function (el, i) {
    var f = faixas.filter(function (x) { return x.el === el; })[0];
    if (!f) return;
    el.addEventListener('pointerenter', function () { f.parado = true; });
    el.addEventListener('pointerleave', function () { f.parado = false; });
  });
  var antes = performance.now();
  function animar(agora) {
    var dt = Math.min(agora - antes, 80) / 1000;
    antes = agora;
    faixas.forEach(function (f) {
      if (!f.passo || f.parado) return;
      f.x -= f.vel * dt;
      if (f.x <= -f.passo) f.x += f.passo;
      if (f.x > 0) f.x -= f.passo;
      f.el.style.transform = 'translate3d(' + f.x.toFixed(2) + 'px,0,0)';
    });
    requestAnimationFrame(animar);
  }
  requestAnimationFrame(animar);

  /* Surgimentos */
  var vigia = 'IntersectionObserver' in window ? new IntersectionObserver(function (itens) {
    itens.forEach(function (it) {
      if (it.isIntersecting) { it.target.classList.add('in'); vigia.unobserve(it.target); }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' }) : null;
  var surgir = todos('.quem-texto > h2, .quem-numeros, .metodo-topo, .como-titulo h2, .horta-frase, .replantar-texto, .casos-topo, .vozes-destaque, .perguntas-lado h2, .final-texto');
  surgir.forEach(function (el) { el.classList.add('surge'); });
  var cortinar = todos('.quem-a, .quem-b, .replantar-foto, .metodo-foto, .final-foto');
  cortinar.forEach(function (el) { el.classList.add('cortina'); });
  surgir.concat(cortinar, todos('[data-tiras], [data-pilares]')).forEach(function (el) {
    if (vigia) vigia.observe(el); else el.classList.add('in');
  });

  /* O ciclo: gira sozinho; na rolagem, o anel abre e vira broto. */
  var anel = porId('[data-anel]');
  var rotulos = anel ? todos('.anel-rotulos li', anel) : [];
  var ativo = 0;
  var passosAnel = 0;
  if (anel) {
    var marcar = function () {
      rotulos.forEach(function (li, i) { li.classList.toggle('ativo', i === ativo); });
      anel.style.setProperty('--giro', (passosAnel * 60) + 'deg');
    };
    marcar();
    if (!reduz) {
      setInterval(function () {
        if (anel.classList.contains('aberto')) return;
        ativo = (ativo + 1) % rotulos.length;
        passosAnel += 1;
        marcar();
      }, 1250);
    }
  }

  /* Caule do "como funciona": cresce com a rolagem e solta uma folha por etapa. */
  var como = porId('[data-como]');
  var passos = como ? todos('.passo', como) : [];
  var lista = como ? porId('.como-lista', como) : null;

  /* Parallax leve, só no computador */
  var pesados = window.matchMedia('(min-width: 861px)').matches && !reduz ? todos('[data-parallax]') : [];

  /* Topo sólido e botão fixo */
  var topo = porId('[data-topo]');
  var capa = porId('.capa');
  var fixo = porId('[data-agendar-fixo]');
  var final = porId('[data-final]');

  var pendente = false;
  function aoRolar() {
    pendente = false;
    var alt = window.innerHeight;
    if (topo && capa) {
      var fimCapa = capa.getBoundingClientRect().bottom;
      topo.classList.toggle('solido', fimCapa < 80);
      if (fixo && final) {
        var perto = final.getBoundingClientRect().top < alt * 0.8;
        fixo.classList.toggle('ligado', fimCapa < alt * 0.35 && !perto);
      }
    }
    if (anel) {
      var r = anel.getBoundingClientRect();
      var p = (alt * 0.62 - (r.top + r.height * 0.5)) / (alt * 0.34);
      p = Math.max(0, Math.min(1, p));
      anel.style.setProperty('--abre', reduz ? (p > 0 ? 1 : 0) : p.toFixed(3));
      anel.classList.toggle('aberto', p > 0.45);
    }
    if (lista) {
      var l = lista.getBoundingClientRect();
      var q = (alt * 0.72 - l.top) / l.height;
      q = Math.max(0, Math.min(1, q));
      como.style.setProperty('--p', q.toFixed(3));
      passos.forEach(function (ps) {
        var y = ps.getBoundingClientRect().top - l.top;
        ps.classList.toggle('vivo', y / l.height < q);
      });
    }
    pesados.forEach(function (el) {
      var b = el.getBoundingClientRect();
      if (b.bottom < -100 || b.top > alt + 100) return;
      var d = (b.top + b.height / 2 - alt / 2) * parseFloat(el.getAttribute('data-parallax'));
      el.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0)';
    });
  }
  function pedirRolagem() {
    if (!pendente) { pendente = true; requestAnimationFrame(aoRolar); }
  }
  window.addEventListener('scroll', pedirRolagem, { passive: true });
  window.addEventListener('resize', pedirRolagem);
  aoRolar();

  /* Três pilares: um aberto por vez; troca sozinho até a pessoa mexer. */
  var pilaresBox = porId('[data-pilares]');
  if (pilaresBox) {
    var pilares = todos('.pilar', pilaresBox);
    var abrir = function (alvo) {
      pilares.forEach(function (pl) {
        var sim = pl === alvo;
        pl.classList.toggle('aberto', sim);
        porId('.pilar-gatilho', pl).setAttribute('aria-expanded', sim ? 'true' : 'false');
      });
    };
    var mexeu = false;
    pilares.forEach(function (pl) {
      var gat = porId('.pilar-gatilho', pl);
      gat.addEventListener('click', function () { mexeu = true; abrir(pl); });
      pl.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse') { mexeu = true; abrir(pl); }
      });
      gat.addEventListener('focus', function () { mexeu = true; abrir(pl); });
    });
    if (!reduz && window.matchMedia('(min-width: 761px)').matches) {
      setInterval(function () {
        if (mexeu) return;
        var r = pilaresBox.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var i = pilares.findIndex(function (pl) { return pl.classList.contains('aberto'); });
        abrir(pilares[(i + 1) % pilares.length]);
      }, 5200);
    }
  }

  /* Casos: folhas lado a lado, com setas */
  var folhas = porId('[data-folhas]');
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
        var folha = porId('.folha', folhas);
        var passo = folha.getBoundingClientRect().width + parseFloat(getComputedStyle(folhas).columnGap || 0);
        folhas.scrollBy({ left: passo * parseInt(b.getAttribute('data-folha'), 10), behavior: reduz ? 'auto' : 'smooth' });
      });
    });
    folhas.addEventListener('scroll', function () { requestAnimationFrame(estado); }, { passive: true });
    window.addEventListener('resize', estado);
    estado();
  }

  /* Vídeos: tocam mudos quando aparecem; o único botão é ligar e desligar o som. */
  var videos = todos('[data-video]').map(function (box) {
    return { box: box, v: porId('video', box), b: porId('.video-som', box), r: porId('.video-som span', box) };
  });
  function definirSom(item, ligado) {
    item.v.muted = !ligado;
    item.b.setAttribute('aria-pressed', ligado ? 'true' : 'false');
    item.r.textContent = ligado ? 'Desativar som' : 'Ativar som';
  }
  videos.forEach(function (item) {
    item.b.addEventListener('click', function () {
      var ligar = item.v.muted;
      videos.forEach(function (o) { definirSom(o, false); });
      definirSom(item, ligar);
      var tentativa = item.v.play();
      if (tentativa && tentativa.catch) tentativa.catch(function () {});
    });
  });
  if ('IntersectionObserver' in window) {
    var vigiaVideo = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        var v = it.target.querySelector('video');
        if (it.isIntersecting) {
          if (v.preload === 'none') v.preload = 'auto';
          if (!reduz) {
            var t = v.play();
            if (t && t.catch) t.catch(function () {});
          }
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.35 });
    videos.forEach(function (item) { vigiaVideo.observe(item.box); });
  }
})();
