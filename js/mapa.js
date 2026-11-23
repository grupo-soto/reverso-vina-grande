/* 01 · En su sitio: mapa que baja de la Comunidad de Madrid a la finca con el scroll.
   Datos en mapa-datos.js (mapa/preparar.py): metros UTM con origen en la finca, y hacia abajo.
   Al final gira lo mismo que la ortofoto del capítulo 02 y la ortofoto aparece encima. */
(function () {
  'use strict';
  const M = window.MAPA, sec = document.getElementById('sitio'), svg = document.getElementById('mapa');
  if (!M || !sec || !svg) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = !!(window.gsap && window.ScrollTrigger) && !reduce;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, at, padre) => {
    const e = document.createElementNS(NS, tag);
    for (const k in at) e.setAttribute(k, at[k]);
    if (padre) padre.appendChild(e);
    return e;
  };
  const C = M.capas, O = M.orto, V = M.vistas, E = M.etiquetas, N = M.nucleos;

  /* ---------- dibujo ---------- */
  const defs = mk('defs', {}, svg);
  const rayado = mk('pattern', { id: 'rayado', patternUnits: 'userSpaceOnUse', width: 520, height: 520, patternTransform: 'rotate(45)' }, defs);
  mk('rect', { x: 0, y: 0, width: 150, height: 520, fill: 'rgba(50,82,32,.28)' }, rayado);
  const g = mk('g', {}, svg);                     // lo que gira al final
  const capa = (cls, d, padre) => mk('path', { d, class: cls, 'fill-rule': 'evenodd' }, padre);
  const gCom = mk('g', {}, g); capa('comunidad', C.comunidad, gCom);
  const gPar = mk('g', { class: 'c-parque' }, g); const pPar = capa('parque', C.parque, gPar);
  const gZepa = mk('g', { class: 'c-zepa' }, g); capa('zepa', C.zepa, gZepa);
  const gZec = mk('g', { class: 'c-zec' }, g); const pZec = capa('zec', C.zec, gZec);
  const gMuni = mk('g', {}, g); capa('muni', C.ciempozuelos, gMuni);
  const gRios = mk('g', { class: 'c-rios' }, g);
  ['tajo', 'manzanares', 'henares'].forEach((r) => capa('rio', C[r], gRios));
  capa('rio jarama', C.jarama, gRios);
  const gVias = mk('g', {}, g);
  capa('carretera-borde', C.a4 + C.m307, gVias); capa('carretera', C.a4 + C.m307, gVias);
  capa('via', C.via, gVias); capa('via-blanca', C.via, gVias);
  const gOrto = mk('g', { transform: `rotate(${-O.ang} ${O.cx} ${O.cy})` }, g);
  mk('image', { href: 'img/aerea-antes.jpg', x: O.cx - O.w / 2, y: O.cy - O.h / 2, width: O.w, height: O.h, preserveAspectRatio: 'none' }, gOrto);
  // la finca restaurada entra de punta a punta (fuera del perímetro las dos ortofotos son iguales)
  const X0 = O.cx - O.w / 2;
  const rBarr = mk('rect', { x: X0, y: O.cy - O.h / 2, width: 0, height: O.h }, mk('clipPath', { id: 'c-barrido' }, defs));
  const gDesp = mk('g', { transform: `rotate(${-O.ang} ${O.cx} ${O.cy})`, 'clip-path': 'url(#c-barrido)' }, g);
  mk('image', { href: 'img/aerea-despues.jpg', x: X0, y: O.cy - O.h / 2, width: O.w, height: O.h, preserveAspectRatio: 'none' }, gDesp);
  mk('path', { d: C.finca }, mk('clipPath', { id: 'c-finca' }, defs));
  const lFrente = mk('line', { x1: X0, y1: O.cy - O.h / 2, x2: X0, y2: O.cy + O.h / 2, class: 'frente', transform: `rotate(${-O.ang} ${O.cx} ${O.cy})` },
    mk('g', { 'clip-path': 'url(#c-finca)' }, g));
  const pFinca = capa('finca', C.finca, mk('g', {}, g));

  // rótulos: fuera del giro, siempre derechos y del mismo tamaño en pantalla
  const gEt = mk('g', { class: 'etq' }, svg);
  const etqs = [];
  function etq(p, txt, cls, opc = {}) {
    const e = mk('g', {}, gEt);
    if (opc.punto) mk('circle', { r: 3, class: 'punto' }, e);
    const t = mk('text', { x: opc.dx ?? 7, y: opc.dy ?? 4, class: cls, 'text-anchor': opc.ancla || 'start' }, e);
    t.textContent = txt;
    const o = { x: p[0], y: p[1], el: e };
    etqs.push(o);
    return e;
  }
  const L = {
    comunidad: etq([-52000, -72000], 'Comunidad de Madrid', 'grande', { dx: 0 }),
    madrid: etq(N['Madrid'], 'Madrid', 'nucleo', { punto: 1 }),
    aranjuez: etq(N['Aranjuez'], 'Aranjuez', 'nucleo', { punto: 1 }),
    ciempozuelos: etq(N['Ciempozuelos'], 'Ciempozuelos', 'nucleo', { punto: 1 }),
    sanmartin: etq(N['San Martín de la Vega'], 'San Martín de la Vega', 'nucleo', { punto: 1 }),
    valdemoro: etq(N['Valdemoro'], 'Valdemoro', 'nucleo', { punto: 1, ancla: 'end', dx: -7 }),
    jaramaL: etq(E.jarama_lejos, 'Jarama', 'rotulo'),
    tajo: etq(E.tajo, 'Tajo', 'rotulo', { dx: 4, dy: 16 }),
    manzanares: etq(E.manzanares, 'Manzanares', 'rotulo', { ancla: 'end', dx: -7 }),
    parque: etq(E.parque, 'Parque Regional del Sureste', 'grande', { dx: 0, ancla: 'middle' }),
    zepa: etq([E.zepa[0], E.zepa[1] + 9000], 'ZEPA ES0000142', 'grande', { dx: 0, ancla: 'middle' }),
    zec: etq([E.zec[0] + 2000, E.zec[1] - 9000], 'ZEC ES3110006', 'grande', { dx: 0, ancla: 'middle' }),
    jarama: etq(E.jarama, 'Río Jarama', 'rotulo'),
    via: etq(E.via, 'Vía Madrid–Valencia', 'rotulo negro'),
    m307: etq(E.m307, 'M-307', 'rotulo negro'),
    a4: etq(E.a4, 'A-4', 'rotulo negro', { ancla: 'end', dx: -7 }),
  };
  // marca de la finca: punto con onda y pastilla
  const marca = mk('g', { class: 'marca' }, gEt);
  mk('circle', { r: 9, class: 'onda' }, marca);
  mk('circle', { r: 6, class: 'centro' }, marca);
  mk('rect', { x: 14, y: -12, width: 66, height: 24, rx: 8 }, marca);
  const tm = mk('text', { x: 22, y: 4 }, marca); tm.textContent = 'La finca';
  etqs.push({ x: 0, y: 0, el: marca });

  /* ---------- estado y pintado ---------- */
  const vb = { x: V.comunidad[0], y: V.comunidad[1], w: V.comunidad[2], h: V.comunidad[3] };
  const st = { giro: 0 };
  function pintar() {
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    g.setAttribute('transform', `rotate(${st.giro} ${O.cx} ${O.cy})`);
    const r = svg.getBoundingClientRect();
    const s = Math.max(vb.w / (r.width || 1), vb.h / (r.height || 1));     // metros por píxel (meet)
    const a = st.giro * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    etqs.forEach((o) => {
      const dx = o.x - O.cx, dy = o.y - O.cy;
      const x = O.cx + dx * ca - dy * sa, y = O.cy + dx * sa + dy * ca;
      o.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
    });
  }

  // capas que se encienden y apagan
  sec.querySelectorAll('.sitio__capas input').forEach((i) => i.addEventListener('change', () => svg.classList.toggle('sin-' + i.dataset.capa, !i.checked)));

  const pasos = Array.from(sec.querySelectorAll('.sitio__paso'));
  const activar = (v) => pasos.forEach((p) => p.classList.toggle('activo', p.dataset.vista === v));

  if (!anim) {
    // quieto: la Red Natura con la finca marcada, y todos los textos
    sec.classList.add('quieto');
    Object.assign(vb, { x: V.natura[0], y: V.natura[1], w: V.natura[2], h: V.natura[3] });
    [gMuni, gVias, gOrto].forEach((e) => e.setAttribute('opacity', 0));
    [L.jarama, L.via, L.m307, L.a4, L.comunidad, L.madrid].forEach((e) => e.setAttribute('opacity', 0));
    pintar(); window.addEventListener('resize', pintar);
    return;
  }

  /* ---------- con el scroll ---------- */
  const barrido = { p: 0 };
  const fuera = [lFrente, gPar, gZepa, gZec, gMuni, gVias, gOrto, pFinca, L.parque, L.zec, L.zepa, L.jarama, L.via, L.m307, L.a4, L.ciempozuelos, L.sanmartin, L.valdemoro];
  gsap.set(fuera, { opacity: 0 });
  const ir = (v) => ({ x: V[v][0], y: V[v][1], w: V[v][2], h: V[v][3] });
  const fin = { x: O.cx - 810, y: O.cy - 506, w: 1620, h: 1012 };     // la ortofoto llena el marco 16:10
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: pintar, paused: true });
  tl.addLabel('comunidad', 0).to({}, { duration: 0.5 })
    // al Parque Regional
    .to(vb, { ...ir('parque'), duration: 1.2 })
    .to([L.comunidad, L.madrid, L.manzanares], { opacity: 0, duration: 0.4 }, '<')
    .to([gPar, L.parque], { opacity: 1, duration: 0.6 }, '<0.5')
    .to([L.sanmartin, L.valdemoro], { opacity: 1, duration: 0.4 }, '<0.2')
    .addLabel('parque').to({}, { duration: 0.7 })
    // a la Red Natura
    .to(vb, { ...ir('natura'), duration: 1.1 })
    .to(L.parque, { opacity: 0, duration: 0.3 }, '<')
    .to(pPar, { fillOpacity: 0.22, duration: 0.6 }, '<0.3')
    .to([gZepa, gZec, L.zec, L.zepa], { opacity: 1, duration: 0.6 }, '<0.2')
    .addLabel('natura').to({}, { duration: 0.7 })
    // al entorno de la finca
    .to(vb, { ...ir('entorno'), duration: 1.3, ease: 'power3.inOut' })
    .to([L.zec, L.zepa, L.jaramaL, L.tajo, L.aranjuez, L.sanmartin, L.valdemoro], { opacity: 0, duration: 0.4 }, '<')
    .to(pZec, { fillOpacity: 0, duration: 0.6 }, '<0.3')
    .to(pPar, { fillOpacity: 0.12, duration: 0.6 }, '<')
    .to([gMuni, gVias, pFinca, L.jarama, L.via, L.m307, L.a4, L.ciempozuelos], { opacity: 1, duration: 0.6 }, '<0.4')
    .addLabel('entorno').to({}, { duration: 0.7 })
    // a la finca: gira como la ortofoto y la ortofoto aparece
    .to(vb, { ...fin, duration: 1.3, ease: 'power3.inOut' })
    .to(st, { giro: O.ang, duration: 1.3, ease: 'power3.inOut' }, '<')
    .to([L.jarama, L.via, L.m307, L.a4, L.ciempozuelos, marca], { opacity: 0, duration: 0.4 }, '<')
    .to([gPar, gZec, gZepa, gMuni], { opacity: 0, duration: 0.6 }, '<0.3')
    .to(gOrto, { opacity: 1, duration: 0.7 }, '<0.4')
    .to(pFinca, { fillOpacity: 0, duration: 0.6 }, '<')
    .addLabel('finca').to({}, { duration: 0.6 })
    // de vacía a llena: la ortofoto restaurada avanza dentro del perímetro
    .set(lFrente, { opacity: 1 })
    .to(barrido, { p: 1, duration: 2, ease: 'power1.inOut', onUpdate: () => {
      const x = X0 + O.w * barrido.p;
      rBarr.setAttribute('width', (O.w * barrido.p).toFixed(1));
      lFrente.setAttribute('x1', x.toFixed(1)); lFrente.setAttribute('x2', x.toFixed(1));
    } })
    .set(lFrente, { opacity: 0 })
    .addLabel('restaurada').to({}, { duration: 0.6 });

  pintar();
  ScrollTrigger.create({
    trigger: sec, start: 'top top', end: '+=640%', pin: true, scrub: 0.6, animation: tl,
  });
  // el texto cambia a mitad del zoom hacia cada fase, no cuando ya ha llegado (se mira en cada fotograma del scrub)
  tl.eventCallback('onUpdate', () => {
    pintar();
    const t = tl.time() + 0.6;
    let v = 'comunidad';
    for (const [nombre, tt] of Object.entries(tl.labels)) if (tt <= t && tt >= tl.labels[v]) v = nombre;
    activar(v);
  });
  window.addEventListener('resize', pintar);
})();
