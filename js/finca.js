/* Viña Grande · interacción y movimiento con GSAP.
   La idea: todo gira de tierra a verde, como en la web de Reverso. Sin JS o con «reducir movimiento»
   la página se ve entera y quieta (los estados ocultos solo los pone este archivo). */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hay = !!(window.gsap && window.ScrollTrigger);
  const anim = hay && !reduce;
  if (hay) gsap.registerPlugin(ScrollTrigger);
  const fmt = (v, d) => v.toFixed(d).replace('.', ',');

  /* ---------- utilidades de movimiento ---------- */
  // el giro de la web de Reverso: la palabra en tierra da la vuelta y sale en verde
  // cada cara se enseña según el lado que mira (no se fía de backface-visibility, que falla en Firefox/Zen)
  const lado = (el) => el.classList.toggle('cara-tierra', Math.abs(gsap.getProperty(el, 'rotationX')) % 360 < 90);
  const girar = (el, delay = 0) => gsap.fromTo(el, { rotationX: 0 }, {
    rotationX: 180, duration: 1.4, ease: 'power3.inOut', delay, transformPerspective: 700, transformOrigin: '50% 55%',
    onStart: () => lado(el), onUpdate: () => lado(el)
  });
  // titulares: cada palabra entra girando desde abajo
  function partir(el) {
    const copia = el.cloneNode(true);
    $$('[aria-hidden="true"]', copia).forEach((n) => n.remove());
    el.setAttribute('aria-label', copia.textContent.replace(/\s+/g, ' ').trim());
    const envolver = (n) => {
      const p = document.createElement('span'); p.className = 'pal'; p.setAttribute('aria-hidden', 'true');
      const i = document.createElement('span'); i.className = 'pal__in';
      i.appendChild(n); p.appendChild(i); return p;
    };
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          frag.appendChild(/^\s+$/.test(t) ? document.createTextNode(' ') : envolver(document.createTextNode(t)));
        });
        el.replaceChild(frag, n);
      } else {
        const marca = document.createComment(''); el.replaceChild(marca, n); el.replaceChild(envolver(n), marca);
      }
    });
    return $$('.pal__in', el);
  }
  function entraTitular(el, conScroll) {
    const giro = $('[data-giro]', el);
    const ins = partir(el);
    if (giro) { gsap.set(giro, { rotationX: 0, transformPerspective: 700 }); giro.classList.add('cara-tierra'); }
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => $$('.pal', el).forEach((p) => { p.style.overflow = 'visible'; })
    });
    tl.from(ins, { yPercent: 115, rotationX: -55, transformOrigin: '50% 100%', duration: 1.1, ease: 'power4.out', stagger: 0.06 });
    if (giro) tl.add(girar(giro), '-=.25');
    if (conScroll) ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: () => tl.play() });
    else tl.play(0.15);
  }
  // cifras que cuentan hasta su valor (coma decimal)
  function contar(el, dur = 1.6) {
    const txt = el.textContent;
    const partes = txt.split(/(\d+(?:,\d+)?)/);
    const nums = partes.map((p, i) => (i % 2 ? { v: parseFloat(p.replace(',', '.')), d: (p.split(',')[1] || '').length } : null));
    el.style.display = 'inline-block'; el.style.minWidth = el.offsetWidth + 'px';
    const o = { t: 0 };
    return gsap.to(o, {
      t: 1, duration: dur, ease: 'power2.out',
      onUpdate: () => { el.textContent = partes.map((p, i) => (i % 2 ? fmt(nums[i].v * o.t, nums[i].d) : p)).join(''); },
      onComplete: () => { el.textContent = txt; el.style.minWidth = ''; }
    });
  }
  // las imágenes se abren desde dentro
  const CERRADO = 'inset(7% 5% 7% 5% round 26px)', ABIERTO = 'inset(0% 0% 0% 0% round 26px)';
  const abrir = (fig) => gsap.fromTo(fig, { clipPath: CERRADO }, { clipPath: ABIERTO, duration: 1.1, ease: 'power3.out', clearProps: 'clipPath' });
  const asomar = (els) => gsap.fromTo(els, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.55, ease: 'back.out(2.2)', stagger: 0.08, clearProps: 'opacity,visibility' });

  /* ---------- 1. comparadores con deslizador (.ba) ---------- */
  $$('.ba').forEach((fig) => {
    const rango = $('input[type="range"]', fig);
    const botones = $$('.segmento button[data-a]', fig.parentElement);
    const rots = $$('.rot', fig);
    let tween = null, rotsFuera = false;
    const pinta = (v) => { fig.style.setProperty('--pos', v + '%'); rango.value = v; };
    const marcar = (v) => botones.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.a) === Number(v))));
    const sacarRots = () => { if (rotsFuera) { rotsFuera = false; anim ? asomar(rots) : gsap.set(rots, { clearProps: 'all' }); } };
    const parar = () => { if (tween) { tween.kill(); tween = null; } fig.dataset.tocado = '1'; sacarRots(); };
    rango.addEventListener('input', () => { parar(); pinta(rango.value); marcar(rango.value); });
    botones.forEach((b) => b.addEventListener('click', () => {
      parar();
      const v = Number(b.dataset.a); marcar(v);
      if (!anim) return pinta(v);
      const o = { p: Number(rango.value) };
      tween = gsap.to(o, { p: v, duration: 0.9, ease: 'power3.inOut', onUpdate: () => pinta(o.p) });
    }));
    // barrido de «Hoy» a «Restaurada» y vuelta al medio (al aparecer y al cambiar de vista)
    fig._barrer = (delay = 0.35) => {
      if (tween) tween.kill();
      if (!anim) { pinta(50); marcar(50); return; }
      const o = { p: 100 }; pinta(100); marcar(50);
      tween = gsap.timeline({ delay, onComplete: () => { tween = null; } })
        .to(o, { p: 0, duration: 1.7, ease: 'power2.inOut', onUpdate: () => pinta(o.p) })
        .to(o, { p: 50, duration: 1, ease: 'power3.inOut', onUpdate: () => pinta(o.p) }, '+=.4')
        .add(() => sacarRots(), '-=.5');
    };
    if (!anim) return;
    // al aparecer: se abre en «Hoy», barre hasta «Restaurada» y vuelve al medio
    pinta(100); gsap.set(fig, { clipPath: CERRADO });
    if (rots.length) { gsap.set(rots, { scale: 0, autoAlpha: 0 }); rotsFuera = true; }
    ScrollTrigger.create({
      trigger: fig, start: 'top 78%', once: true,
      onEnter: () => {
        abrir(fig);
        if (fig.dataset.tocado) return sacarRots();
        fig._barrer();
      }
    });
  });

  // «Más vistas» del 3D: cambia la pareja de imágenes y vuelve a barrer
  const VISTAS = {
    vega3d: ['Vista 3D desde la vega: la gravera entre la M-307 y la vía, con los cerros detrás', 'La misma vista con la franja convertida en parcelas de cultivo',
      'Desde la vega del Jarama, mirando a la finca y a los cerros: la franja restaurada queda entre la M-307 y la vía.'],
    hueco3d: ['Vista 3D desde los cerros sobre la zona más honda de la gravera', 'La misma vista con el hueco relleno y dividido en parcelas',
      'Desde los cerros, sobre la zona más honda: donde hoy está el hueco, parcelas de cultivo a la cota del terreno original.'],
    sur3d: ['Vista 3D a poca altura desde el borde sur, mirando a lo largo de la finca hacia el norte', 'La misma vista con la finca sembrada',
      'Desde el borde sur, a poca altura y mirando hacia el norte: la finca queda como un solo campo entre la vía y la M-307.']
  };
  const bav = $('#ba-vistas');
  if (bav) {
    const [ia, ib] = $$('img', bav), pie = $('#vistas-pie');
    const sel = $$('.vistas button', bav.parentElement);
    sel.forEach((b) => b.addEventListener('click', () => {
      const v = b.dataset.vista, t = VISTAS[v];
      sel.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      const poner = () => {
        ia.src = `img/${v}-antes.jpg`; ia.alt = t[0]; ib.src = `img/${v}-despues.jpg`; ib.alt = t[1]; pie.textContent = t[2];
        bav._barrer(0.2);
      };
      if (!anim) return poner();
      gsap.timeline().to([ia, ib], { autoAlpha: 0.2, duration: 0.25 }).add(poner).to([ia, ib], { autoAlpha: 1, duration: 0.4 });
    }));
  }
  const per = $('#ver-perimetro');
  if (per) per.addEventListener('change', () => $('#ba-aerea').classList.toggle('con-perimetro', per.checked));

  /* ---------- 2. antes y después con barrido de abajo arriba (.revela) ---------- */
  $$('.revela').forEach((fig) => {
    const cont = fig.closest('.vista');
    const botones = $$('.segmento button', cont);
    const lienzo = $('.revela__lienzo', fig), linea = $('.linea-corte', fig);
    const puntos = $$('.punto', fig), lista = $$('.cambios button', cont);
    const ficha = $('.revela__ficha', fig), cerrar = $('.revela__cerrar', fig);
    const rots = $$('.rot', fig);
    const S = 1.9;
    let estado = 'b', foco = null, tl = null, tocado = false;

    const marcar = (v) => {
      botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      fig.classList.toggle('es-hoy', v === 'a'); cont.classList.toggle('es-hoy', v === 'a');
    };
    function poner(v) {
      if (v === estado) return;
      estado = v; marcar(v);
      if (v === 'a' && foco) enfocar(null);
      if (!anim) { fig.style.setProperty('--corte', v === 'a' ? '100%' : '0%'); return; }
      if (tl) tl.kill();
      tl = gsap.timeline()
        .set(linea, { opacity: 1 })
        .to(fig, { '--corte': v === 'a' ? '100%' : '0%', duration: 1.3, ease: 'power3.inOut' })
        .set(linea, { opacity: 0 });
      if (v === 'b') tl.add(asomar([...puntos, ...rots]), '-=.35');
    }
    function enfocar(n) {
      const t = anim ? 1 : 0;
      foco = n;
      lista.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.n === n)));
      puntos.forEach((p) => p.classList.toggle('activo', p.dataset.n === n));
      fig.classList.toggle('con-foco', !!n);
      if (!n) {
        gsap.to(lienzo, { scale: 1, xPercent: 0, yPercent: 0, duration: 0.9 * t, ease: 'power3.inOut' });
        gsap.to(puntos, { scale: 1, duration: 0.9 * t, ease: 'power3.inOut' });
        if (ficha) gsap.to([ficha, cerrar], { autoAlpha: 0, y: 8, duration: 0.25 * t });
        return;
      }
      if (estado === 'a') poner('b');
      const p = puntos.find((x) => x.dataset.n === n);
      const x = parseFloat(p.style.getPropertyValue('--x')), y = parseFloat(p.style.getPropertyValue('--y'));
      const lim = (S - 1) * 50, cl = gsap.utils.clamp(-lim, lim);
      gsap.to(lienzo, { scale: S, xPercent: cl(-S * (x - 50)), yPercent: cl(-S * (y - 50)), duration: t, ease: 'power3.inOut' });
      gsap.to(puntos, { scale: 1 / S, duration: t, ease: 'power3.inOut' });
      const item = lista.find((b) => b.dataset.n === n);
      $('b', ficha).textContent = n + ' · ' + $('b', item).textContent;
      $('small', ficha).textContent = $('small', item).textContent;
      gsap.fromTo([ficha, cerrar], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5 * t, delay: 0.45 * t, ease: 'power3.out' });
    }
    const alternar = (n) => { tocado = true; enfocar(foco === n ? null : n); };
    botones.forEach((b) => b.addEventListener('click', () => { tocado = true; poner(b.dataset.v); }));
    puntos.forEach((p) => p.addEventListener('click', (e) => { e.stopPropagation(); alternar(p.dataset.n); }));
    lista.forEach((b) => b.addEventListener('click', () => {
      alternar(b.dataset.n);
      if (window.innerWidth < 900) fig.scrollIntoView({ behavior: anim ? 'smooth' : 'auto', block: 'center' });
    }));
    if (cerrar) cerrar.addEventListener('click', (e) => { e.stopPropagation(); enfocar(null); });
    lienzo.addEventListener('click', () => { if (foco) enfocar(null); });
    fig.addEventListener('keydown', (e) => { if (e.key === 'Escape' && foco) enfocar(null); });

    if (!anim) return;
    // al aparecer: se ve cómo está hoy y el cierre sube desde el suelo
    estado = 'a'; marcar('a'); fig.style.setProperty('--corte', '100%');
    gsap.set(fig, { clipPath: CERRADO });
    gsap.set([...puntos, ...rots], { scale: 0, autoAlpha: 0 });
    if (ficha) gsap.set([ficha, cerrar], { autoAlpha: 0 });
    ScrollTrigger.create({
      trigger: fig, start: 'top 70%', once: true,
      onEnter: () => { abrir(fig); gsap.delayedCall(1.1, () => { if (!tocado) poner('b'); }); }
    });
  });

  if (!anim) {
    // sin movimiento: el vídeo del relleno con sus controles
    const v = $('#relleno video');
    if (v) { v.controls = true; v.loop = true; }
    return;
  }

  /* ---------- 3. portada, titulares y textos ---------- */
  const titulares = $$('[data-entra]');
  titulares.forEach((el, i) => entraTitular(el, i > 0));
  $$('.cabeza__titular:not([data-entra])').forEach((el) => entraTitular(el, true));
  const textos = '.portada .etiqueta, .portada__entrada, .cabeza__num, .cabeza__entrada, .vista > h3, .vista__texto, .vista > .pie, .fuente, .notas p, .mandos, .relleno__cabeza, .entrada__texto > *';
  gsap.set(textos, { y: 26, autoAlpha: 0 });
  ScrollTrigger.batch(textos, {
    start: 'top 92%', once: true,
    onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' })
  });

  /* ---------- 4. fichas: entran, cuentan y la del uso gira de gravera a agrícola ---------- */
  $$('.fichas, .medidas').forEach((grupo) => {
    const fichas = $$('.ficha', grupo);
    gsap.set(fichas, { y: 34, autoAlpha: 0 });
    const caras = $('.caras', grupo);
    if (caras) gsap.set(caras, { rotationY: 180 });
    ScrollTrigger.create({
      trigger: grupo, start: 'top 88%', once: true,
      onEnter: () => {
        gsap.to(fichas, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09 });
        $$('.cifra', grupo).forEach((c, i) => gsap.delayedCall(0.15 + i * 0.09, () => contar(c)));
        if (caras) gsap.to(caras, { rotationY: 360, duration: 1.5, ease: 'power3.inOut', delay: 1.3 });
      }
    });
  });

  /* ---------- 5. la página pasa de tierra a verde al bajar ---------- */
  gsap.fromTo(document.body, { backgroundColor: '#F7F2E9' }, { backgroundColor: '#EFF4EA', ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
  gsap.to('.progreso', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* ---------- 6. plano de cotas: el relleno sube con el scroll ---------- */
  const cotas = $('#cotas');
  if (cotas) {
    const linea = $('.linea-corte', cotas);
    gsap.set(cotas, { clipPath: CERRADO });
    ScrollTrigger.create({ trigger: cotas, start: 'top 85%', once: true, onEnter: () => abrir(cotas) });
    gsap.timeline({ scrollTrigger: { trigger: cotas, start: 'top 62%', end: 'top 12%', scrub: 0.6 } })
      .fromTo(cotas, { '--llena': '100%' }, { '--llena': '0%', ease: 'none', duration: 1 }, 0)
      .fromTo(linea, { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0)
      .to(linea, { opacity: 0, duration: 0.04 }, 0.96);
  }

  /* ---------- 7. el relleno: el vídeo avanza con el scroll ---------- */
  const rel = $('#relleno');
  if (rel) {
    const video = $('video', rel), pasos = $$('.paso', rel), barra = $('.relleno__barra span', rel);
    const cortes = [0, 0.1, 0.62, 0.86];
    const st = { t: 0 };
    let dur = 8;
    video.addEventListener('loadedmetadata', () => { dur = video.duration || 8; });
    const pinta = () => { if (video.readyState >= 1) { try { video.currentTime = Math.min(st.t * dur, dur - 0.04); } catch (e) { /* aún cargando */ } } };
    document.addEventListener('touchstart', () => { const p = video.play(); if (p) p.then(() => video.pause()).catch(() => {}); }, { once: true, passive: true });
    ScrollTrigger.create({
      trigger: rel, start: 'top top', end: '+=230%', pin: true, anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.to(st, { t: p, duration: 0.35, ease: 'power1.out', overwrite: true, onUpdate: pinta });
        gsap.set(barra, { scaleX: p });
        const k = cortes.filter((c) => p >= c).length - 1;
        pasos.forEach((el, i) => { el.classList.toggle('activo', i === k); el.classList.toggle('hecho', i < k); });
      }
    });
  }

  /* ---------- 8. el tramo del cierre ---------- */
  const tramo = $('#tramo');
  if (tramo) {
    const rots = $$('.rot', tramo), img = $('img', tramo);
    gsap.set(tramo, { clipPath: CERRADO }); gsap.set(rots, { scale: 0, autoAlpha: 0 });
    ScrollTrigger.create({
      trigger: tramo, start: 'top 75%', once: true,
      onEnter: () => { abrir(tramo); gsap.from(img, { scale: 1.12, duration: 1.6, ease: 'power3.out' }); gsap.delayedCall(0.7, () => asomar(rots)); }
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
