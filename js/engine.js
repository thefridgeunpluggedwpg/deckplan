/* DeckPlan engine: units, code checks (City of Winnipeg "Decks" guide, Oct 2025), framing geometry (drawings only; no material list).
   Geometry is in feet unless a name ends in In (inches). Plan axes: X along the house wall, Y away from the house. */
(function () {
  const DP = (window.DP = window.DP || {});

  // Actual (dressed) lumber sizes, inches [thickness, depth]
  const LUMBER = { '2x4': [1.5, 3.5], '2x6': [1.5, 5.5], '2x8': [1.5, 7.25], '2x10': [1.5, 9.25], '2x12': [1.5, 11.25], '4x4': [3.5, 3.5], '6x6': [5.5, 5.5] };
  const RANK = { '2x6': 1, '2x8': 2, '2x10': 3, '2x12': 4 };
  // City of Winnipeg Decks guide (Oct 2025) Table 3, SPF No.1/No.2 pressure treated (not incised), 1.9 kPa live load.
  // Max span, inches, face of support to face of support.
  const JOIST_SPAN = { '2x6': { 12: 121, 16: 110, 24: 94 }, '2x8': { 12: 158, 16: 145, 24: 122 }, '2x10': { 12: 202, 16: 169, 24: 150 } };
  // Table 2: beam sizes by max supported joist length (in), beams supported at 2.44 m (8'-0") or less.
  const BEAM_TABLE = [
    { max: 72, opts: [[3, '2x6'], [2, '2x8']], label: "6'-0\"" },
    { max: 96, opts: [[4, '2x6'], [2, '2x8']], label: "8'-0\"" },
    { max: 120, opts: [[3, '2x8'], [2, '2x10']], label: "10'-0\"" },
  ];
  const MM = 1 / 25.4; // inches per mm
  DP.CODE = {
    guardReqIn: 600 * MM, guardHiTriggerIn: 1800 * MM, guardLowIn: 36, guardHighIn: 42,
    riserMaxIn: 200 * MM, runMinIn: 255 * MM, runMaxIn: 355 * MM, stairWidthMinIn: 900 * MM,
    handrailMinIn: 865 * MM, handrailMaxIn: 1070 * MM, frostDepthFt: 1800 * MM / 12, padMaxUndersideIn: 1300 * MM,
    postMaxSpacingIn: 96, beamOverhangMaxIn: 24, joistCantMaxIn: 24, rearYardFt: 25, overheadClearFt: 3500 * MM / 12,
  };
  DP.LUMBER = LUMBER; DP.JOIST_SPAN = JOIST_SPAN; DP.BEAM_TABLE = BEAM_TABLE;

  /* ---------- units ---------- */
  DP.parseLen = function (s) {
    if (typeof s === 'number') return s;
    s = String(s || '').trim().toLowerCase().replace(/[’′]/g, "'").replace(/[”″]/g, '"');
    if (!s) return NaN;
    let m;
    if ((m = s.match(/^(-?\d+(?:\.\d+)?)\s*mm$/))) return +m[1] / 304.8;
    if ((m = s.match(/^(-?\d+(?:\.\d+)?)\s*m$/))) return +m[1] / 0.3048;
    if (/^-?\d+(?:\.\d+)?$/.test(s)) return +s;
    let ft = 0, inch = 0, ok = false;
    if ((m = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft)\s*-?\s*/))) { ft = +m[1]; s = s.slice(m[0].length); ok = true; }
    if (s) {
      m = s.match(/^(\d+(?:\.\d+)?)?(?:\s*(\d+)\/(\d+))?\s*(?:"|in)?$/);
      if (!m) return NaN;
      if (m[1]) inch += +m[1];
      if (m[2]) inch += +m[2] / +m[3];
      ok = ok || m[1] || m[2];
    }
    return ok ? ft + inch / 12 : NaN;
  };
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  DP.fmtIn = function (inches, den = 8) {
    let n = Math.round(inches * den), neg = n < 0; n = Math.abs(n);
    const w = Math.floor(n / den), r = n % den;
    let t = w ? String(w) : (r ? '' : '0');
    if (r) { const g = gcd(r, den); t += (w ? ' ' : '') + r / g + '/' + den / g; }
    return (neg ? '-' : '') + t + '"';
  };
  DP.fmt = function (ft, den = 4) {
    if (!isFinite(ft)) return '?';
    let n = Math.round(ft * 12 * den), neg = n < 0; n = Math.abs(n);
    const f = Math.floor(n / (12 * den)), rem = (n - f * 12 * den) / den;
    const inch = DP.fmtIn(rem, den);
    return (neg ? '-' : '') + (f ? f + "'-" + inch : inch);
  };
  DP.mm = (ft) => Math.round(ft * 304.8);

  function parseBeam(s) {
    const m = String(s).match(/^(\d)-(2x\d+)$/);
    const plies = m ? +m[1] : 3, size = m ? m[2] : '2x8';
    return { plies, size, wIn: plies * 1.5, dIn: LUMBER[size][1], label: plies + '-' + size };
  }
  DP.parseBeam = parseBeam;
  const stock = (len, list = [8, 10, 12, 14, 16, 20]) => list.find((x) => x >= len - 1e-6) || null;

  /* Johnny's foundation rule (15 Nov 2026): permit decks over 2'-0" use Gary Taylor helical piles (certified installer). Pylex only on decks 2'-0" or lower. */
  DP.pileKind = function (fo) {
    const maker = String((fo && fo.pileMaker) || '').trim();
    const pylex = /pylex/i.test(maker), gary = /gary\s*taylor/i.test(maker);
    let short = 'SCREW PILE', long = 'SCREW PILE';
    if (fo && fo.type === 'sonotube') { short = (fo.dia || 10) + '" DIA. CONC. PIER'; long = (fo.dia || 10) + '" DIA. CONCRETE PIER (SONOTUBE)'; }
    else if (fo && fo.type === 'pad') { short = 'CONC. SURFACE PAD'; long = 'CONCRETE SURFACE PAD'; }
    else if (gary) { short = 'GARY TAYLOR HELICAL PILE'; long = 'GARY TAYLOR HELICAL PILE, CERTIFIED INSTALLER'; }
    else if (pylex) { short = 'PYLEX SCREW PILE'; long = 'PYLEX SCREW PILE'; }
    else if (maker) { short = 'SCREW PILE, ' + maker.toUpperCase(); long = 'SCREW PILE, ' + maker.toUpperCase(); }
    if (fo && fo.type === 'screwpile' && fo.pileModel && !new RegExp(fo.pileModel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(long)) long += ' ' + fo.pileModel;
    return { maker, pylex, gary, short, long };
  };

  /* ---------- stair profile: treads and landing along the run (h from the deck edge) ---------- */
  DP.stairProfile = function (stair, H) {
    const rise = stair.riseIn / 12, run = stair.runIn / 12, steps = [];
    let h = 0, z = H;
    const flight = (n) => { for (let i = 1; i < n; i++) { z -= rise; steps.push({ h0: h, h1: h + run, z }); h += run; } };
    if (stair.landing) {
      flight(stair.n1); z -= rise; steps.push({ h0: h, h1: h + stair.landing.depth, z, landing: true }); h += stair.landing.depth; flight(stair.n2);
    } else flight(stair.nR);
    return { steps, total: h, rise, run };
  };

  /* ---------- deck outline (rectangle or L) in deck coords: x along house, y away from house ---------- */
  function outline(L, W, sh) {
    if (!sh) return [[0, 0], [L, 0], [L, W], [0, W]];
    const Wt = W + sh.d;
    if (sh.side === 'right') { const wx = L - sh.w; return [[0, 0], [L, 0], [L, Wt], [wx, Wt], [wx, W], [0, W]]; }
    return [[0, 0], [L, 0], [L, W], [sh.w, W], [sh.w, Wt], [0, Wt]];
  }
  function inPoly(x, y, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function edgesOf(poly) {
    return poly.map((a, i) => {
      const b = poly[(i + 1) % poly.length];
      const horiz = Math.abs(a[1] - b[1]) < 1e-9;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, e = 0.01;
      let side;
      if (horiz) side = inPoly(mx, my + e, poly) ? 'back' : 'front';
      else side = inPoly(mx + e, my, poly) ? 'left' : 'right';
      const pos = horiz ? a[1] : a[0];
      const from = horiz ? Math.min(a[0], b[0]) : Math.min(a[1], b[1]), to = horiz ? Math.max(a[0], b[0]) : Math.max(a[1], b[1]);
      return { side, horiz, pos, from, to, len: to - from };
    });
  }
  DP.edgesOf = edgesOf;

  /* ---------- frame one rectangular zone (City Tables 2 and 3) ---------- */
  function frameZone(z, c) {
    const perp = c.perp;
    const R = perp ? z.Lx : z.Wy, S = perp ? z.Wy : z.Lx;
    const useLedger = !!z.ledger;
    const t = 1.5 / 12, halfB = c.beam.wIn / 24;
    const pFirst = useLedger ? t : c.cant, pLast = S - c.cant;
    const clearFor = (k) => (pLast - pFirst) / k - (useLedger ? halfB : 2 * halfB);
    // add beam lines until the joist span meets Table 3 and every beam's supported joist length fits Table 2 (max 10'-0")
    const sjlFor = (k) => { const bay = (pLast - pFirst) / k, end = bay / 2 + c.cant; return k >= 2 ? Math.max(bay, end) : end; };
    let n = 1, clear = clearFor(1);
    while (n < 8 && ((c.allowedIn && clear * 12 > c.allowedIn) || sjlFor(n) * 12 > c.beamMaxSJL)) { n++; clear = clearFor(n); }
    if (!useLedger && pLast - pFirst < 0.5) { n = 0; }
    const beamsV = [];
    if (n === 0) beamsV.push(S / 2);
    else for (let i = useLedger ? 1 : 0; i <= n; i++) beamsV.push(pFirst + ((pLast - pFirst) * i) / n);
    const nB = beamsV.length;
    const sjl = beamsV.map((v, i) => {
      const prev = i === 0 ? (useLedger ? t : 0) : beamsV[i - 1], next = i === nB - 1 ? S : beamsV[i + 1];
      const a = i === 0 && !useLedger ? v : (v - prev) / 2, b = i === nB - 1 ? S - v : (next - v) / 2;
      return a + b;
    });
    const oh = Math.min(c.beamOH, Math.max(0, (R - 0.5) / 2));
    const nPosts = Math.max(2, Math.ceil((R - 2 * oh) / c.postMax - 1e-9) + 1);
    const postSp = (R - 2 * oh) / (nPosts - 1);
    const postsU = []; for (let i = 0; i < nPosts; i++) postsU.push(oh + i * postSp);
    const sbl = postsU.map((u, i) => (i === 0 || i === nPosts - 1 ? oh + postSp / 2 : postSp));
    const joistsU = [], sp = c.spacing / 12;
    for (let u = c.jt / 24; u < R - c.jt / 24 - 0.05; u += sp) joistsU.push(u);
    joistsU.push(R - c.jt / 24);
    // local (u along beam lines, v along joists) -> deck coords
    const toXY = (u, v) => (perp ? { x: z.x0 + u, y: z.y0 + v } : { x: z.x0 + v, y: z.y0 + u });
    const footings = [];
    beamsV.forEach((v, bi) => postsU.forEach((u, pi) => footings.push({ ...toXY(u, v), bi, pi, zone: z.id, load: Math.round(sjl[bi] * sbl[pi] * 50) })));
    return { ...z, perp, R, S, useLedger, clear, nSpans: Math.max(1, n), beamsV, sjl, sjlMax: Math.max(...sjl), nPosts, postSp, postsU, sbl, joistsU, nJ: joistsU.length, joistLen: S - 2 * t, footings, toXY, beamOH: oh };
  }

  /* ---------- main compute ---------- */
  DP.compute = function (st) {
    const d = st.deck, f = st.framing, fo = st.found, g = st.guard, sr = st.stairs, dk = st.decking;
    const C = DP.CODE;
    const L = DP.parseLen(d.L), W = DP.parseLen(d.W), H = DP.parseLen(d.H);
    const attached = d.attach === 'attached';
    const perp = f.dir !== 'parallel';
    const [jt, jdIn] = LUMBER[f.joist];
    const beam = parseBeam(f.beam);
    const postIn = LUMBER[f.post][0];
    const deckTIn = +dk.thk || 1;
    const spacing = +f.spacing;
    const cant = DP.parseLen(f.cant) || 0;
    const beamOH = DP.parseLen(f.beamOH) || 0;
    const postMax = DP.parseLen(f.postMax) || 8;
    const heights = (Hz) => { const topDeck = Hz, topJoist = Hz - deckTIn / 12, botJoist = topJoist - jdIn / 12, beamTop = botJoist, beamBot = beamTop - beam.dIn / 12; return { topDeck, topJoist, botJoist, beamTop, beamBot }; };
    const hz = heights(H);
    const { topDeck, topJoist, botJoist, beamTop, beamBot } = hz;
    const allowedIn = (JOIST_SPAN[f.joist] || {})[spacing] || null;
    const t = 1.5 / 12;
    const ctx = { perp, beam, cant, beamOH, postMax, spacing, jt, allowedIn, beamMaxSJL: BEAM_TABLE[BEAM_TABLE.length - 1].max };

    // shape
    let shape = null;
    if (d.shape === 'L') {
      const ew = Math.min(L, Math.max(1, DP.parseLen(d.extW) || 0)), ed = Math.max(1, DP.parseLen(d.extD) || 0);
      if (isFinite(ew) && isFinite(ed)) shape = { side: d.extSide === 'left' ? 'left' : 'right', w: ew, d: ed, x: d.extSide === 'left' ? 0 : L - ew };
    }
    const Wt = W + (shape ? shape.d : 0);
    const poly = outline(L, W, shape);
    const edges = edgesOf(poly);
    // zones: strips across the house when joists run out from it, strips along it when parallel
    const zr = [];
    if (!shape || shape.w >= L - 0.01) zr.push({ id: 'Z1', x0: 0, y0: 0, Lx: L, Wy: Wt });
    else if (perp) {
      const main = shape.side === 'right' ? { x0: 0, Lx: L - shape.w } : { x0: shape.w, Lx: L - shape.w };
      const wing = { x0: shape.x, Lx: shape.w };
      const zs = [{ id: 'Z1', ...main, y0: 0, Wy: W }, { id: 'Z2', ...wing, y0: 0, Wy: Wt }];
      zs.sort((a, b) => a.x0 - b.x0); zr.push(...zs);
    } else {
      zr.push({ id: 'Z1', x0: 0, y0: 0, Lx: L, Wy: W }, { id: 'Z2', x0: shape.x, y0: W, Lx: shape.w, Wy: shape.d });
    }
    const zones = zr.map((z) => frameZone({ ...z, ledger: attached && perp && z.y0 === 0, ...hz }, ctx));
    const useLedger = zones.some((z) => z.useLedger);
    // section zone: the longest joist run
    const sec = zones.reduce((a, b) => (b.S > a.S + 1e-6 ? b : a), zones[0]);
    const clear = Math.max(...zones.map((z) => z.clear));
    const sjlMax = Math.max(...zones.map((z) => z.sjlMax));
    const postSp = Math.max(...zones.map((z) => z.postSp));
    const nJ = zones.reduce((a, z) => a + z.nJ, 0);

    // foundation
    const undersideIn = botJoist * 12;
    const deepReq = attached || undersideIn > C.padMaxUndersideIn;
    const pierAbove = DP.parseLen(fo.above) || 0;
    const pierDepth = DP.parseLen(fo.depth) || 6;
    const pierTop = fo.type === 'pad' ? (+fo.padT || 6) / 12 : pierAbove;
    const postHOf = (bb) => bb - pierTop - (fo.type === 'pad' ? 0 : 1 / 12); // 1" standoff base
    const postH = postHOf(beamBot);
    const braceAt = 5; // City guide: posts over 1.5 m (5'-0") should be braced
    const footings = [];
    zones.forEach((z) => footings.push(...z.footings));

    // guards
    const HIn = H * 12;
    const guardReq = HIn > C.guardReqIn;
    const guardOn = guardReq || g.always;
    const guardHIn = HIn > C.guardHiTriggerIn ? C.guardHighIn : C.guardLowIn;

    // stairs
    let stair = null, landing = null;
    if (sr.on) {
      const nR = Math.max(1, Math.ceil(HIn / (+sr.targetRise || 7.5) - 1e-9));
      const riseIn = HIn / nR, runIn = +sr.run || 10.5;
      const ws = DP.parseLen(sr.width) || 3.5, off = DP.parseLen(sr.offset) || 0;
      const side = sr.side;
      // edge that holds the stair
      const cand = edges.filter((e) => e.side === side && !(attached && e.side === 'back'));
      let edge = cand.find((e) => off >= e.from - 1e-6 && off + ws <= e.to + 1e-6) || cand.find((e) => off >= e.from - 1e-6 && off < e.to) || cand[0];
      const o2 = edge ? Math.min(Math.max(off, edge.from), Math.max(edge.from, edge.to - ws)) : off;
      stair = { side, nR, riseIn, runIn, ws, off: o2, edge, guard: HIn > C.guardReqIn, handrail: nR > 3 };
      let wantLanding = !!(sr.landing && sr.landing.on) && nR >= 4;
      if (wantLanding) {
        const n2 = Math.max(2, Math.min(nR - 2, Math.round(nR * (+sr.landing.frac || 0.5))));
        const ld = Math.max(ws, DP.parseLen(sr.landing.depth) || 4);
        stair.n1 = nR - n2; stair.n2 = n2; stair.landing = { depth: ld, H: (n2 * riseIn) / 12 };
      }
      const prof = DP.stairProfile(stair, H);
      stair.nT = prof.steps.filter((x) => !x.landing).length;
      stair.totalRun = prof.total; stair.profile = prof;
      const ep = edge ? edge.pos : side === 'front' ? Wt : side === 'left' ? 0 : L;
      stair.edgePos = ep;
      if (side === 'front') stair.rect = { x: o2, y: ep, w: ws, h: prof.total };
      else if (side === 'left') stair.rect = { x: ep - prof.total, y: o2, w: prof.total, h: ws };
      else stair.rect = { x: ep, y: o2, w: prof.total, h: ws };
      // flights for checks: [risers, treads, top height]
      stair.flights = stair.landing ? [{ nR: stair.n1, nT: stair.n1 - 1, top: H, bottom: stair.landing.H }, { nR: stair.n2, nT: stair.n2 - 1, top: stair.landing.H, bottom: 0 }] : [{ nR, nT: nR - 1, top: H, bottom: 0 }];
      if (stair.landing) {
        const lst = prof.steps.find((x) => x.landing);
        const a = lst.h0, b = lst.h1;
        let r;
        if (side === 'front') r = { x0: o2, y0: ep + a, Lx: ws, Wy: b - a };
        else if (side === 'left') r = { x0: ep - b, y0: o2, Lx: b - a, Wy: ws };
        else r = { x0: ep + a, y0: o2, Lx: b - a, Wy: ws };
        const lH = stair.landing.H, lhz = heights(lH);
        // landing frame: joists run with the stair, beams under both ends of the landing
        const lperp = side === 'front';
        const lz = frameZone({ id: 'LD', ...r, ledger: false, ...lhz }, { ...ctx, perp: lperp, cant: Math.min(cant, 0.5), beamOH: Math.min(beamOH, 0.5) });
        landing = { ...lz, ...lhz, H: lH, rect: { x: r.x0, y: r.y0, w: r.Lx, h: r.Wy }, guardReq: lH * 12 > C.guardReqIn, guardHIn: lH * 12 > C.guardHiTriggerIn ? C.guardHighIn : C.guardLowIn, postH: postHOf(lhz.beamBot), stairSide: side };
        stair.landing.zone = landing;
        footings.push(...lz.footings);
      }
      // Stair foot piles (Johnny 15 Nov 2026): a stair about 4'-0" wide sits on 2 piles; a larger stair gets 3. The exact cutoff for 3 is TBD, so 3-pile stairs are VERIFY.
      const nSP = ws > 4 + 1e-6 ? 3 : 2;
      const inset = Math.min(0.5, Math.max(0.2, ws / 6));
      stair.footings = [];
      for (let i = 0; i < nSP; i++) {
        const across = inset + (nSP === 1 ? 0 : (i / (nSP - 1)) * (ws - 2 * inset));
        let x, y;
        if (side === 'front') { x = o2 + across; y = ep + prof.total; }
        else if (side === 'left') { x = ep - prof.total; y = o2 + across; }
        else { x = ep + prof.total; y = o2 + across; }
        stair.footings.push({ x, y, zone: 'ST', load: Math.round((ws * Math.min(3, prof.total) * 50) / nSP) });
      }
      stair.nPiles = nSP;
      footings.push(...stair.footings);
    }
    const maxLoad = Math.max(...footings.map((x) => x.load));

    // guard runs on free edges, minus the stair opening
    const guardRuns = [];
    edges.forEach((e) => {
      if (attached && e.side === 'back') return;
      if (stair && stair.edge === e) {
        const s0 = stair.off, s1 = stair.off + stair.ws;
        if (s0 - e.from > 0.05) guardRuns.push({ side: e.side, pos: e.pos, horiz: e.horiz, from: e.from, to: s0 });
        if (e.to - s1 > 0.05) guardRuns.push({ side: e.side, pos: e.pos, horiz: e.horiz, from: s1, to: e.to });
      } else guardRuns.push({ side: e.side, pos: e.pos, horiz: e.horiz, from: e.from, to: e.to });
    });
    // landing guards: the two sides parallel to the stair run
    const landingRuns = [];
    if (landing && (landing.guardReq || g.always)) {
      const r = landing.rect;
      if (landing.stairSide === 'front') { landingRuns.push({ side: 'left', pos: r.x, horiz: false, from: r.y, to: r.y + r.h }, { side: 'right', pos: r.x + r.w, horiz: false, from: r.y, to: r.y + r.h }); }
      else { landingRuns.push({ side: 'back', pos: r.y, horiz: true, from: r.x, to: r.x + r.w }, { side: 'front', pos: r.y + r.h, horiz: true, from: r.x, to: r.x + r.w }); }
    }
    const guardLF = (guardOn ? guardRuns.reduce((a, r) => a + (r.to - r.from), 0) : 0) + landingRuns.reduce((a, r) => a + (r.to - r.from), 0);

    // openings on the house wall (door / basement window), x from the deck's left end
    const openings = (st.openings || []).map((o, i) => ({ i, type: o.type === 'window' ? 'window' : 'door', at: DP.parseLen(o.at), w: DP.parseLen(o.w), h: DP.parseLen(o.h), bedroom: !!o.bedroom, label: o.label || '' }))
      .filter((o) => isFinite(o.at) && isFinite(o.w) && o.w > 0);
    openings.forEach((o) => { o.mark = (o.type === 'door' ? 'D' : 'W') + (openings.filter((p) => p.type === o.type).indexOf(o) + 1); if (!isFinite(o.h) || o.h <= 0) o.h = o.type === 'door' ? 80 / 12 : 2; });

    const area = zones.reduce((a, z) => a + z.Lx * z.Wy, 0);
    const landingArea = landing ? landing.rect.w * landing.rect.h : 0;

    // site plan geometry (City addition form: lot, existing buildings, distances to all property lines)
    const site = st.site || {};
    const lotW = DP.parseLen(site.lotW), lotD = DP.parseLen(site.lotD);
    const hW = DP.parseLen(site.houseW), hD = DP.parseLen(site.houseD);
    const hFront = DP.parseLen(site.frontSB), hLeft = DP.parseLen(site.leftSB);
    const dOff = DP.parseLen(d.offset) || 0;
    const siteOk = [lotW, lotD, hW, hD, hFront, hLeft].every(isFinite);
    const deckSite = { x: (isFinite(hLeft) ? hLeft : 0) + dOff, y: (isFinite(hFront) ? hFront : 0) + (isFinite(hD) ? hD : 0) + (attached ? 0 : DP.parseLen(d.gap) || 1) };
    const sideL = deckSite.x, sideR = (isFinite(lotW) ? lotW : 0) - deckSite.x - L, rearD = (isFinite(lotD) ? lotD : 0) - deckSite.y - Wt;
    const houseRear = (isFinite(lotD) && isFinite(hFront) && isFinite(hD)) ? lotD - hFront - hD : NaN;

    /* ---------- checks ---------- */
    const checks = [];
    const add = (item, req, prov, status, src) => checks.push({ item, req, prov, status, src });
    const SRC_W = 'CoW Decks guide';
    add('Permit needed', "Area > 36 sq.ft or height > 2'-0\"", Math.round(area) + ' sq.ft, ' + DP.fmt(H) + ' high', 'INFO', SRC_W + ' p.1');
    const zTag = (z) => (zones.length > 1 ? ' [' + z.id + ']' : '');
    zones.forEach((z) => {
      if (allowedIn) add('Joist span (' + f.joist + ' @ ' + spacing + '" o.c.)' + zTag(z), DP.fmt(allowedIn / 12) + ' max.', DP.fmt(z.clear) + (z.nSpans > 1 ? ' (' + z.nSpans + ' spans)' : ''), z.clear * 12 <= allowedIn + 0.01 ? 'OK' : 'NG', SRC_W + ' Table 3');
      else add('Joist span (' + f.joist + ')' + zTag(z), 'Not in City Table 3', DP.fmt(z.clear), 'VERIFY', SRC_W + ' Table 3');
    });
    if (cant > 0) {
      // City deck checklist (permit form p.4): 2x6 projection needs a P.Eng. seal; 2x8 400 mm (1'-4") max.; 2x10+ 600 mm (2'-0") max.
      // The Decks guide (p.7) allows 2x8 up to 600 mm when no future roofed structure; that case is left as VERIFY.
      const rk = RANK[f.joist];
      const lim = rk >= 3 ? 24 : 16;
      const req = rk < 2 ? '2x6: P.Eng. seal required' : rk >= 3 ? "2'-0\" (600 mm) max." : "1'-4\" (400 mm) max. (2'-0\" if no future roof, guide)";
      const stc = rk < 2 ? 'VERIFY' : cant * 12 <= lim + 0.01 ? 'OK' : rk === 2 && cant * 12 <= C.joistCantMaxIn + 0.01 ? 'VERIFY' : 'NG';
      add('Joist cantilever past beam', req, DP.fmt(cant), stc, SRC_W + ' p.7 / CoW deck checklist');
    }
    const row = BEAM_TABLE.find((r) => sjlMax * 12 <= r.max + 0.01);
    if (!row) add('Beam size', 'SJL beyond Table 2', beam.label + ', SJL ' + DP.fmt(sjlMax), 'VERIFY', SRC_W + ' Table 2');
    else {
      const ok = row.opts.some(([p, s]) => beam.plies >= p && RANK[beam.size] >= RANK[s]);
      add('Beam (supp. joist length ' + DP.fmt(sjlMax) + ')', row.opts.map(([p, s]) => p + '-' + s).join(' or '), beam.label, ok ? 'OK' : 'NG', SRC_W + ' Table 2');
    }
    add('Post spacing along beam', "8'-0\" (2.44 m) max.", DP.fmt(postSp), postSp * 12 <= C.postMaxSpacingIn + 0.01 ? 'OK' : 'NG', SRC_W + ' p.5');
    const ohMax = Math.max(...zones.map((z) => z.beamOH));
    add('Beam overhang past end post', "2'-0\" (600 mm) max.", DP.fmt(ohMax), ohMax * 12 <= C.beamOverhangMaxIn + 0.01 ? 'OK' : 'NG', SRC_W + ' p.7');
    add('Post width vs beam width', DP.fmtIn(beam.wIn) + ' min.', f.post + ' (' + DP.fmtIn(postIn) + ')', postIn >= beam.wIn ? 'OK' : 'NG', SRC_W + ' p.5');
    if (postH > braceAt) add('Post height over 5\'-0" (1.5 m)', 'Braced or anchored', 'knee braces, size VERIFY', 'VERIFY', SRC_W + ' p.5');
    if (fo.type === 'pad') add('Surface pads', 'Freestanding, 592 sq.ft max., joists 4\'-3" max. above grade', (attached ? 'attached' : 'freestanding') + ', ' + DP.fmt(botJoist), !deepReq && area <= 592 ? 'OK' : 'NG', SRC_W + ' p.4');
    else add('Footing depth (frost)', "6'-0\" (1.8 m) min. below grade", DP.fmt(pierDepth), pierDepth >= C.frostDepthFt - 0.01 ? 'OK' : 'NG', SRC_W + ' p.4');
    if (fo.type === 'sonotube' && deepReq) add('Concrete pier design', 'Engineered pier or screw piles', fo.dia + '" dia. pier', 'VERIFY', SRC_W + ' p.4');
    if (fo.type === 'screwpile') add('Screw pile capacity', 'Tested capacity > footing load', 'max ' + maxLoad + ' lb per pile', 'VERIFY', SRC_W + ' p.5');
    // Stricter of Johnny's SOP and the City guide: permit decks over 2'-0" must use Gary Taylor helical piles; Pylex only on decks 2'-0" or lower.
    const SRC_J = "Johnny's SOP (15 Nov 2026)";
    const pk = DP.pileKind(fo);
    if (H > 2 + 1e-9) {
      const prov = fo.type === 'screwpile' ? (pk.maker || 'screw pile, maker not entered') : fo.type;
      const okGary = fo.type === 'screwpile' && pk.gary && !pk.pylex;
      const ng = fo.type !== 'screwpile' || pk.pylex;
      add('Foundation (permit deck over 2\'-0")', 'Gary Taylor helical piles, certified installer', prov, okGary ? 'OK' : ng ? 'NG' : 'VERIFY', SRC_J);
    } else if (fo.type === 'screwpile' && pk.pylex) {
      add('Foundation (deck 2\'-0" or lower)', 'Pylex piles permitted at this height', 'Pylex', 'OK', SRC_J);
    } else if (fo.type === 'screwpile' && pk.gary) {
      add('Foundation (deck 2\'-0" or lower)', 'Pylex or helical piles', 'Gary Taylor helical', 'OK', SRC_J);
    }
    if (stair && stair.footings && stair.footings.length) {
      add('Stair foot piles', "2 piles when stair is about 4'-0\" wide; 3 when larger (cutoff TBD)", stair.nPiles + ' piles, stair ' + DP.fmt(stair.ws) + ' wide', stair.nPiles === 2 ? 'OK' : 'VERIFY', SRC_J);
    }
    add('Guard required', 'Deck > 600 mm (2\'-0") above grade', guardReq ? 'Yes' : 'No', 'INFO', SRC_W + ' p.8');
    if (guardOn) {
      add('Guard height', HIn > C.guardHiTriggerIn ? '1070 mm (42") min.' : '900 mm (36") min.', DP.fmtIn(guardHIn), 'OK', SRC_W + ' p.8');
      add('Guard openings', '< 100 mm (4") sphere', g.type === 'glass' ? 'glass infill' : '3 3/4" clear', 'OK', SRC_W + ' p.8');
      if (g.type !== 'wood') add('Pre-made guard system', 'Maker documents with plans', g.type === 'alum' ? 'aluminum system' : 'glass system', 'VERIFY', 'MB ITS Guide 06 s.2.2');
    }
    if (stair) {
      add('Stair riser height', '200 mm (7 7/8") max.', DP.fmtIn(stair.riseIn) + ' × ' + stair.nR, stair.riseIn <= C.riserMaxIn + 0.001 ? 'OK' : 'NG', SRC_W + ' p.9');
      add('Stair tread run', '255–355 mm (10"–14")', DP.fmtIn(stair.runIn), stair.runIn >= C.runMinIn - 0.01 && stair.runIn <= C.runMaxIn ? 'OK' : 'NG', SRC_W + ' p.9 / MB ITS');
      add('Stair width', '900 mm (36") min.', DP.fmtIn(stair.ws * 12), stair.ws * 12 >= C.stairWidthMinIn - 0.01 ? 'OK' : 'NG', SRC_W + ' p.9');
      add('Stair handrail', stair.handrail ? 'Over 3 risers: 865–1070 mm' : '3 risers or less: none', stair.handrail ? 'guard/handrail 36"' : 'n/a', 'OK', SRC_W + ' p.9');
      if (stair.guard) add('Stair guards', '900 mm (36") above nosing line', 'both sides', 'OK', SRC_W + ' p.9');
      if (stair.landing) {
        add('Stair landing length', 'Not in City deck guide', DP.fmt(stair.landing.depth) + ' (stair ' + DP.fmt(stair.ws) + ' wide)', 'VERIFY', 'MBC Part 9 (stairs)');
        add('Landing guard', landing.guardReq ? 'Landing > 600 mm: ' + (landing.guardHIn === 42 ? '1070' : '900') + ' mm' : 'Not required', landing.guardReq ? DP.fmtIn(landing.guardHIn) + ', both sides' : 'none', 'OK', SRC_W + ' p.8');
      }
      if (sr.landing && sr.landing.on && !stair.landing) add('Stair landing', 'Needs 4 or more risers', stair.nR + ' risers: landing skipped', 'INFO', 'DeckPlan');
    }
    if (shape) add('L-shaped deck', 'Each zone framed per Tables 2/3', zones.length + ' framing zones, rims bolted at joint', 'VERIFY', SRC_W + ' Tables 2–3');
    if (attached) add('Ledger attachment', 'Not in City guide', st.ledger.spacing + '" o.c. staggered', 'VERIFY', 'MBC Part 9');
    const doors = openings.filter((o) => o.type === 'door'), wins = openings.filter((o) => o.type === 'window');
    add('Doors to deck shown', 'Location of doors accessing deck', doors.length ? doors.map((o) => o.mark).join(', ') : 'none entered', doors.length ? 'OK' : 'VERIFY', 'MB ITS Guide 06 s.2');
    add('Basement windows in deck area', 'Location; note if bedroom', wins.length ? wins.map((o) => o.mark + (o.bedroom ? ' (bedroom)' : '')).join(', ') : 'none entered', wins.length ? 'OK' : 'INFO', 'MB ITS Guide 06 s.2');
    wins.filter((o) => o.bedroom).forEach((o) => add('Bedroom window ' + o.mark + ' under deck', 'Egress clearance per MBC', 'see elevations', 'VERIFY', 'MB ITS Guide 06 s.2 / MBC'));
    if (dk.material === 'composite') add('Decking vs joist spacing', 'Per decking maker', spacing + '" o.c.', 'VERIFY', SRC_W + ' p.7');
    if (!siteOk) add('Site dimensions', 'Lot, house size and house setbacks entered', 'missing or not readable', 'VERIFY', 'CoW addition form');
    else {
      if (HIn > 24) add('Rear yard setback', "7.5 m (25'-0\") min.", DP.fmt(rearD), rearD >= C.rearYardFt - 0.01 ? 'OK' : 'NG', SRC_W + ' Fig.1');
      const sideReq = DP.parseLen(site.sideReq);
      add('Side yard setbacks', isFinite(sideReq) ? DP.fmt(sideReq) + ' min. (zoning)' : 'Same as dwelling (zoning)', DP.fmt(Math.min(sideL, sideR)), isFinite(sideReq) ? (Math.min(sideL, sideR) >= sideReq ? 'OK' : 'NG') : 'VERIFY', SRC_W + ' Fig.1');
    }
    if (site.overhead) add('Overhead power lines', '3.5 m (11\'-6") min. above deck', 'see site plan', 'VERIFY', SRC_W + ' p.10');
    if (!(st.project.legal || '').trim() || /VERIFY/i.test(st.project.legal || '')) add('Legal description', 'Lot / block / plan on the site plan', st.project.legal || 'not entered', 'VERIFY', 'CoW addition form');

    const model = {
      L, W, Wt, H, R: sec.R, S: sec.S, attached, perp, jt, jdIn, beam, postIn, deckTIn, spacing, cant, beamOH, postMax,
      topDeck, topJoist, botJoist, beamTop, beamBot, useLedger: sec.useLedger, anyLedger: useLedger, allowedIn, clear, nSpans: sec.nSpans, beamsV: sec.beamsV, sjl: sec.sjl, sjlMax,
      postsU: sec.postsU, postSp, nPosts: sec.nPosts, joistsU: sec.joistsU, nJ, joistLen: sec.joistLen, footings, maxLoad, deepReq, pierAbove, pierDepth, pierTop, postH, braceAt, braced: postH > braceAt,
      guardReq, guardOn, guardHIn, guardRuns, landingRuns, guardLF, stair, landing, stairFootings: (stair && stair.footings) || [], area, landingArea, shape, poly, edges, zones, sec, openings, heights,
      lotW, lotD, hW, hD, hFront, hLeft, deckSite, sideL, sideR, rearD, houseRear, siteOk,
      checks, st, ohMax,
    };
    return model;
  };

})();
