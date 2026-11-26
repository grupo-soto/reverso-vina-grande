/* 01 · En su sitio: hoja de proyecto a pantalla completa (26-11).
   El plano baja de la Comunidad de Madrid a la finca con el scroll, con cuadrícula UTM real, coordenadas en el marco,
   escala gráfica, norte y coordenadas del centro que cambian con el zoom. Al final gira como la ortofoto del capítulo 02,
   la finca se llena y la última hoja dibuja la propuesta: pistachar, caminos, valla con parra y rótulos.
   Datos: mapa-datos.js (mapa/preparar.py; metros UTM con origen en la finca, y hacia abajo) y propuesta-datos.js
   (pistachos/propuesta_datos.py; px del encuadre de aerea/, 0,3 m/px). */
(function () {
  'use strict';
  const M = window.MAPA, P = window.PROPUESTA, sec = document.getElementById('sitio'), svg = document.getElementById('mapa');
  const ret = document.getElementById('reticula');
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
  const [E0, N0] = M.origen;
  const fmt = (n) => Math.round(n).toLocaleString('es-ES');

  /* ---------- dibujo ---------- */
  const defs = mk('defs', {}, svg);
  const rayado = mk('pattern', { id: 'rayado', patternUnits: 'userSpaceOnUse', width: 520, height: 520, patternTransform: 'rotate(45)' }, defs);
  mk('rect', { x: 0, y: 0, width: 150, height: 520, fill: 'rgba(50,82,32,.28)' }, rayado);
  const trama = mk('pattern', { id: 'trama-pistachar', patternUnits: 'userSpaceOnUse', width: 24, height: 24, patternTransform: 'rotate(-45)' }, defs);
  mk('rect', { x: 0, y: 0, width: 24, height: 24, fill: 'rgba(176,208,122,.22)' }, trama);
  mk('rect', { x: 0, y: 0, width: 5, height: 24, fill: 'rgba(71,120,44,.75)' }, trama);
  const g = mk('g', {}, svg);                     // lo que gira al final
  const pRet = mk('path', { class: 'reticula', d: '' }, g);    // cuadrícula UTM, gira con el plano
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
  const giroOrto = `rotate(${-O.ang} ${O.cx} ${O.cy})`;
  const gOrto = mk('g', { transform: giroOrto }, g);
  // ortofoto más alta que la del capítulo 02 (aerea/encuadre_alto.py: 6000 × 4800 px, la franja de 3375 px empieza en
  // la fila 713), para que en las hojas de la foto la finca vaya arriba y la imagen llene la pantalla
  const X0 = O.cx - O.w / 2, Y0 = O.cy - O.h / 2;
  const kpx = O.w / 6000, OH = 4800 * kpx, OY = Y0 - 713 * kpx;
  mk('image', { href: 'img/mapa-antes.jpg', x: X0, y: OY, width: O.w, height: OH, preserveAspectRatio: 'none' }, gOrto);
  // la finca restaurada entra de punta a punta (fuera del perímetro las dos ortofotos son iguales)
  const rBarr = mk('rect', { x: X0, y: OY, width: 0, height: OH }, mk('clipPath', { id: 'c-barrido' }, defs));
  const gDesp = mk('g', { transform: giroOrto, 'clip-path': 'url(#c-barrido)' }, g);
  mk('image', { href: 'img/mapa-despues.jpg', x: X0, y: OY, width: O.w, height: OH, preserveAspectRatio: 'none' }, gDesp);
  mk('path', { d: C.finca }, mk('clipPath', { id: 'c-finca' }, defs));
  const lFrente = mk('line', { x1: X0, y1: Y0, x2: X0, y2: Y0 + O.h, class: 'frente', transform: giroOrto },
    mk('g', { 'clip-path': 'url(#c-finca)' }, g));
  const pFinca = capa('finca', C.finca, mk('g', {}, g));
  // la propuesta, en px del encuadre de aerea/ con la misma transformación que la ortofoto
  const gProp = mk('g', { transform: `${giroOrto} translate(${X0} ${Y0}) scale(${kpx})` }, g);
  const pPist = P ? mk('path', { d: P.pistachar, class: 'pistachar' }, gProp) : null;
  const pCam = P ? mk('path', { d: P.caminos, class: 'caminos' }, gProp) : null;
  const gValla = mk('g', {}, g);
  const pValla = mk('path', { d: C.finca, class: 'valla-parra', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, gValla);
  const pVallaL = mk('path', { d: C.finca, class: 'valla-parra-luz', pathLength: 1, 'stroke-dasharray': '0.004 0.006', 'stroke-dashoffset': 0 }, gValla);

  // px del encuadre de aerea/ → coordenadas del mapa (antes del giro del plano)
  const a0 = -O.ang * Math.PI / 180, ca0 = Math.cos(a0), sa0 = Math.sin(a0);
  const deOrto = (px, py) => {
    const x = X0 + px * kpx - O.cx, y = Y0 + py * kpx - O.cy;
    return [O.cx + x * ca0 - y * sa0, O.cy + x * sa0 + y * ca0];
  };

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
  // rótulo de la propuesta: punto, guía corta y dos líneas
  function etqProp(px, txt, sub, dx = 16, dy = -26, cls = '') {
    const p = deOrto(px[0], px[1]);
    const e = mk('g', { class: cls }, gEt);
    mk('line', { x1: 0, y1: 0, x2: dx, y2: dy, class: 'guia' }, e);
    mk('circle', { r: 3.5, class: 'punto-prop' }, e);
    const an = dx < 0 ? 'end' : 'start';
    mk('text', { x: dx + (dx < 0 ? -4 : 4), y: dy - 2, class: 'prop', 'text-anchor': an }, e).textContent = txt;
    if (sub) mk('text', { x: dx + (dx < 0 ? -4 : 4), y: dy + 12, class: 'prop-sub', 'text-anchor': an }, e).textContent = sub;
    etqs.push({ x: p[0], y: p[1], el: e });
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
  const LP = P ? [
    etqProp(P.puntos.pistachar, 'Pistachar', `${String(P.ha).replace('.', ',')} ha junto a la vía`, -18, -34),
    etqProp(P.puntos.cereal, 'Cereal', 'parcelas orientativas', -18, -30),
    etqProp(P.puntos.cacera, 'Cacera de riego', 'se conserva', 18, 30, 'solo-ancho'),
    etqProp(P.puntos.entrada, 'Entrada', 'puerta de 8 m', -18, 30, 'solo-ancho'),
    etqProp([3167, 2322], 'Valla con parra', '3,0 km de perímetro', -18, 34),
  ] : [];
  // marca de la finca: punto con onda y pastilla
  const marca = mk('g', { class: 'marca' }, gEt);
  mk('circle', { r: 9, class: 'onda' }, marca);
  mk('circle', { r: 6, class: 'centro' }, marca);
  mk('rect', { x: 14, y: -12, width: 66, height: 24, rx: 8 }, marca);
  const tm = mk('text', { x: 22, y: 4 }, marca); tm.textContent = 'La finca';
  etqs.push({ x: 0, y: 0, el: marca });

  /* ---------- cuadrícula, marco, escala, norte y coordenadas ---------- */
  const cajetin = sec.querySelector('.plano__cajetin');
  const escB = document.getElementById('escala-barra'), escT = document.getElementById('escala-txt');
  const norte = document.getElementById('norte'), coords = document.getElementById('coords');
  const redondo = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
  const dist = (m) => (m >= 1000 ? `${String(m / 1000).replace('.', ',')} km` : `${m} m`);

  // hueco libre del plano: el que no tapa el cajetín (en móvil va abajo; en escritorio, a la derecha)
  // en las hojas de la foto (st.foto = 1) la finca va arriba, encima del cajetín, y la ortofoto llena la pantalla
  function libre(Wp, Hp) {
    const r = cajetin.getBoundingClientRect(), s = sec.getBoundingClientRect();
    const abajo = { l: 28, r: 28, t: 44, b: Math.max(60, s.bottom - r.top + 18) };
    if (Wp < 900) return abajo;
    const lado = { l: 70, r: Math.max(60, s.right - r.left + 28), t: 50, b: 50 };
    const k = st.foto;
    return { l: lado.l + (abajo.l - lado.l) * k, r: lado.r + (abajo.r - lado.r) * k, t: lado.t + (abajo.t - lado.t) * k, b: lado.b + (abajo.b - lado.b) * k };
  }

  // la franja de la finca en la ortofoto girada (px 300-5520 × 1200-2350 del encuadre de aerea/)
  const banda = { x: X0 + 280 * kpx, y: Y0 + 1180 * kpx, w: 5260 * kpx, h: 1190 * kpx };

  /* ---------- estado y pintado ---------- */
  const obj = { x: V.comunidad[0], y: V.comunidad[1], w: V.comunidad[2], h: V.comunidad[3] };    // lo que hay que ver
  const vb = { x: 0, y: 0, w: 1, h: 1 };
  const st = { giro: 0, etqRet: 1, foto: 0 };
  function pintar() {
    const r = svg.getBoundingClientRect(); const Wp = r.width || 1, Hp = r.height || 1;
    const f = libre(Wp, Hp);
    const s = Math.max(obj.w / Math.max(80, Wp - f.l - f.r), obj.h / Math.max(80, Hp - f.t - f.b));      // metros por píxel
    vb.w = Wp * s; vb.h = Hp * s;
    vb.x = obj.x + obj.w / 2 - (f.l + (Wp - f.l - f.r) / 2) * s;
    vb.y = obj.y + obj.h / 2 - (f.t + (Hp - f.t - f.b) / 2) * s;
    // en las hojas de la foto, la vista no se sale de la ortofoto (nada de papel en blanco debajo); en móvil (vertical)
    // no se puede sin recortar la finca, así que ahí manda la finca y asoma el papel del plano
    if (st.foto > 0 && Wp >= 900) {
      let s2 = s;
      if (Wp * s2 > O.w) s2 = O.w / Wp;
      if (Hp * s2 > OH) s2 = OH / Hp;
      const w2 = Wp * s2, h2 = Hp * s2;
      let x2 = obj.x + obj.w / 2 - (f.l + (Wp - f.l - f.r) / 2) * s2, y2 = obj.y + obj.h / 2 - (f.t + (Hp - f.t - f.b) / 2) * s2;
      x2 = Math.min(Math.max(x2, X0), X0 + O.w - w2); y2 = Math.min(Math.max(y2, OY), OY + OH - h2);
      const k = st.foto * st.foto;
      vb.x += (x2 - vb.x) * k; vb.y += (y2 - vb.y) * k; vb.w += (w2 - vb.w) * k; vb.h += (h2 - vb.h) * k;
    }
    const sReal = vb.w / Wp;
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    g.setAttribute('transform', `rotate(${st.giro} ${O.cx} ${O.cy})`);
    const a = st.giro * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    etqs.forEach((o) => {
      const dx = o.x - O.cx, dy = o.y - O.cy;
      const x = O.cx + dx * ca - dy * sa, y = O.cy + dx * sa + dy * ca;
      o.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sReal.toFixed(3)})`);
    });
    // cuadrícula UTM (en coordenadas del mapa, gira con él): ~9 líneas a lo ancho
    const paso = redondo(Math.max(vb.w, vb.h) / 9);
    const cx0 = vb.x + vb.w / 2 - O.cx, cy0 = vb.y + vb.h / 2 - O.cy;
    const cx = O.cx + cx0 * ca + cy0 * sa, cy = O.cy - cx0 * sa + cy0 * ca;      // centro de la vista, sin girar
    const R = Math.hypot(vb.w, vb.h) / 2;
    let d = '';
    for (let e = Math.ceil((cx - R + E0) / paso) * paso; e <= cx + R + E0; e += paso) { const x = e - E0; d += `M${x.toFixed(1)} ${(cy - R).toFixed(1)}V${(cy + R).toFixed(1)}`; }
    for (let n = Math.ceil((N0 - (cy + R)) / paso) * paso; n <= N0 - (cy - R); n += paso) { const y = N0 - n; d += `M${(cx - R).toFixed(1)} ${y.toFixed(1)}H${(cx + R).toFixed(1)}`; }
    pRet.setAttribute('d', d);
    // coordenadas en el marco: solo mientras el plano no ha girado (luego la cuadrícula ya no va paralela al marco)
    if (ret) {
      ret.setAttribute('viewBox', `0 0 ${Wp} ${Hp}`);
      let h = '';
      const op = Math.max(0, 1 - Math.abs(st.giro) / 6) * st.etqRet;
      if (op > 0.01) {
        const m = Wp < 900 ? 8 : 14;
        for (let e = Math.ceil((vb.x + E0) / paso) * paso; e <= vb.x + vb.w + E0; e += paso) {
          const X = (e - E0 - vb.x) / sReal;
          if (X < m + 30 || X > Wp - m - 30) continue;
          h += `<line x1="${X}" y1="${m}" x2="${X}" y2="${m + 9}"/><text x="${X + 4}" y="${m + 20}">X ${fmt(e)}</text>`;
        }
        for (let n = Math.ceil((N0 - vb.y - vb.h) / paso) * paso; n <= N0 - vb.y; n += paso) {
          const Y = (N0 - n - vb.y) / sReal;
          if (Y < m + 90 || Y > Hp - m - 20) continue;
          h += `<line x1="${m}" y1="${Y}" x2="${m + 9}" y2="${Y}"/><text transform="translate(${m + 20} ${Y - 4}) rotate(-90)">Y ${fmt(n)}</text>`;
        }
      }
      ret.innerHTML = `<g opacity="${op.toFixed(2)}">${h}</g>`;
    }
    // escala gráfica: una distancia redonda de 70-140 px
    let dm = redondo(110 * sReal);
    if (dm / sReal > 150) dm /= 2;
    if (escB) { escB.style.width = `${(dm / sReal).toFixed(1)}px`; escT.textContent = dist(dm); }
    if (norte) norte.style.transform = `rotate(${st.giro.toFixed(2)}deg)`;
    if (coords) coords.innerHTML = `X ${fmt(cx + E0)}<br>Y ${fmt(N0 - cy)}`;
  }

  // capas que se encienden y apagan
  sec.querySelectorAll('.sitio__capas input').forEach((i) => i.addEventListener('change', () => svg.classList.toggle('sin-' + i.dataset.capa, !i.checked)));

  const pasos = Array.from(sec.querySelectorAll('.sitio__paso'));
  const estratos = Array.from(sec.querySelectorAll('.estrato'));
  const hojaN = document.getElementById('hoja-n'), hojaNombre = document.getElementById('hoja-nombre');
  const orden = pasos.map((p) => p.dataset.vista);
  let actual = '';
  // cada hoja es una tongada: las de debajo quedan llenas, la actual se marca y en la última brota la hierba
  const activar = (v) => {
    if (v === actual) return; actual = v;
    const i = orden.indexOf(v);
    pasos.forEach((p) => p.classList.toggle('activo', p.dataset.vista === v));
    estratos.forEach((e, k) => { e.classList.toggle('hecho', k < i); e.classList.toggle('actual', k === i); e.setAttribute('aria-current', k === i ? 'step' : 'false'); });
    if (hojaN) hojaN.textContent = String(i + 1).padStart(2, '0');
    if (hojaNombre) hojaNombre.textContent = estratos[i] ? estratos[i].querySelector('.estrato__nombre').textContent : '';
    sec.classList.toggle('brota', v === 'propuesta');
  };
  activar('comunidad');

  if (!anim) {
    // quieto: la propuesta sobre la finca restaurada, y todas las hojas en el cajetín
    sec.classList.add('quieto', 'foto');
    st.giro = O.ang; st.foto = 1; Object.assign(obj, banda);
    [gPar, gZec, gZepa, gMuni, pFinca, marca, L.comunidad, L.madrid, L.aranjuez, L.ciempozuelos, L.sanmartin, L.valdemoro, L.jaramaL, L.tajo, L.manzanares, L.parque, L.zepa, L.zec, L.jarama, L.via, L.m307, L.a4].forEach((e) => e.setAttribute('opacity', 0));
    rBarr.setAttribute('width', O.w); pValla.setAttribute('stroke-dashoffset', 0);
    activar('propuesta');
    pintar(); window.addEventListener('resize', pintar);
    return;
  }

  /* ---------- con el scroll ---------- */
  const barrido = { p: 0 }, valla = { p: 0 };
  const fuera = [lFrente, gPar, gZepa, gZec, gMuni, gVias, gOrto, pFinca, gProp, gValla, pVallaL, ...LP, L.parque, L.zec, L.zepa, L.jarama, L.via, L.m307, L.a4, L.ciempozuelos, L.sanmartin, L.valdemoro];
  gsap.set(fuera, { opacity: 0 });
  const ir = (v) => ({ x: V[v][0], y: V[v][1], w: V[v][2], h: V[v][3] });
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, paused: true });
  tl.addLabel('comunidad', 0).to({}, { duration: 0.5 })
    // al Parque Regional
    .to(obj, { ...ir('parque'), duration: 1.2 })
    .to([L.comunidad, L.madrid, L.manzanares], { opacity: 0, duration: 0.4 }, '<')
    .to([gPar, L.parque], { opacity: 1, duration: 0.6 }, '<0.5')
    .to([L.sanmartin, L.valdemoro], { opacity: 1, duration: 0.4 }, '<0.2')
    .addLabel('parque').to({}, { duration: 0.7 })
    // a la Red Natura
    .to(obj, { ...ir('natura'), duration: 1.1 })
    .to(L.parque, { opacity: 0, duration: 0.3 }, '<')
    .to(pPar, { fillOpacity: 0.22, duration: 0.6 }, '<0.3')
    .to([gZepa, gZec, L.zec, L.zepa], { opacity: 1, duration: 0.6 }, '<0.2')
    .addLabel('natura').to({}, { duration: 0.7 })
    // al entorno de la finca
    .to(obj, { ...ir('entorno'), duration: 1.3, ease: 'power3.inOut' })
    .to([L.zec, L.zepa, L.jaramaL, L.tajo, L.aranjuez, L.sanmartin, L.valdemoro], { opacity: 0, duration: 0.4 }, '<')
    .to(pZec, { fillOpacity: 0, duration: 0.6 }, '<0.3')
    .to(pPar, { fillOpacity: 0.12, duration: 0.6 }, '<')
    .to([gMuni, gVias, pFinca, L.jarama, L.via, L.m307, L.a4, L.ciempozuelos], { opacity: 1, duration: 0.6 }, '<0.4')
    .addLabel('entorno').to({}, { duration: 0.7 })
    // a la finca: gira como la ortofoto, la ortofoto aparece y la hoja pasa a «foto» (marco y textos en blanco)
    .to(obj, { ...banda, duration: 1.3, ease: 'power3.inOut' })
    .to(st, { giro: O.ang, foto: 1, duration: 1.3, ease: 'power3.inOut' }, '<')
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
    .addLabel('restaurada').to({}, { duration: 0.6 })
    // la propuesta: la valla con parra se dibuja por el perímetro, aparece el pistachar y los rótulos
    .to(gValla, { opacity: 1, duration: 0.2 })
    .to(valla, { p: 1, duration: 1.6, ease: 'power1.inOut', onUpdate: () => pValla.setAttribute('stroke-dashoffset', (1 - valla.p).toFixed(4)) }, '<')
    .to(gProp, { opacity: 1, duration: 0.8 }, '<0.5')
    .to(pVallaL, { opacity: 1, duration: 0.5 }, '<')
    .to(LP, { opacity: 1, duration: 0.5, stagger: 0.15 }, '<0.3')
    .addLabel('propuesta').to({}, { duration: 0.8 });

  pintar();
  const disparo = ScrollTrigger.create({
    trigger: sec, start: 'top top', end: '+=760%', pin: true, scrub: 0.6, animation: tl,
  });
  // pulsar una tongada lleva a esa hoja (se baja hasta su etiqueta en la línea de tiempo)
  estratos.forEach((e) => e.addEventListener('click', () => {
    const lb = tl.labels[e.dataset.vista] ?? 0;
    const y = disparo.start + (disparo.end - disparo.start) * Math.min(1, (lb + 0.05) / tl.duration());
    window.scrollTo({ top: y, behavior: 'smooth' });
  }));
  // el texto cambia a mitad del zoom hacia cada fase, no cuando ya ha llegado (se mira en cada fotograma del scrub)
  tl.eventCallback('onUpdate', () => {
    pintar();
    sec.classList.toggle('foto', tl.time() > tl.labels.entorno + 1.0);
    const t = tl.time() + 0.6;
    let v = 'comunidad';
    for (const [nombre, tt] of Object.entries(tl.labels)) if (tt <= t && tt >= tl.labels[v]) v = nombre;
    activar(v);
  });
  window.addEventListener('resize', pintar);
})();
