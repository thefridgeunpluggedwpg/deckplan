(function () {
  const DP = window.DP;
  const { Svg, LW, DASH } = DP;
  const fmt = DP.fmt, fin = DP.fmtIn;
  const H = DP.sheetHelpers;

  /* ================= A4 SECTION ================= */
  function sectionSheet(m, st, meta) {
    const sv = new Svg();
    const A = H.frame(sv, m, st, meta);
    const t = 1.5 / 12;
    const showHouse = m.perp;
    const gapH = m.attached ? 0 : DP.parseLen(st.deck.gap) || 1;
    const S = m.S;
    const gH = m.guardOn ? m.guardHIn / 12 : 0;
    const v0 = showHouse ? -gapH - 1.0 : -1.2, v1 = S + 1.6;
    const zTop = m.H + gH + 1.4, zBot = m.pierDepth + 0.6;
    const callL = showHouse ? 200 : 40, callR = 236, dimR = 30;
    const hasDet = true;
    const bandH = hasDet ? A.h * 0.6 : A.h;
    const [scaleLbl, s] = DP.pickScale(v1 - v0, zTop + zBot, A.w - callL - callR - dimR - 40, bandH - 90);
    const ox = A.x + callL + 20 + (A.w - callL - callR - dimR - 40 - (v1 - v0) * s) / 2 - v0 * s;
    const gy = A.y + 16 + zTop * s + (bandH - 90 - (zTop + zBot) * s) / 2;
    const X = (v) => ox + v * s, Z = (z) => gy - z * s;
    const R = (v, z, dv, dz, lw, o) => sv.rect(X(v), Z(z + dz), dv * s, dz * s, lw, o);
    const fo = st.found;
    const Lft = [], Rgt = [];
    // ---- piers / footings first (so grade hatch can skip)
    const skips = [];
    m.beamsV.forEach((v, i) => {
      const r = (fo.type === 'screwpile' ? 3.5 : fo.type === 'pad' ? (+fo.padSize || 24) : +fo.dia) / 24;
      skips.push([X(v - r) - 4, X(v + r) + 4]);
      if (fo.type === 'sonotube') {
        R(v - r, -m.pierDepth, 2 * r, m.pierDepth + m.pierTop, LW.h, { fill: '#fff' });
        sv.concrete(X(v - r), Z(m.pierTop), 2 * r * s, (m.pierDepth + m.pierTop) * s, 3 + i);
        if (i === m.beamsV.length - 1) Rgt.push({ x: X(v + r), y: Z(-m.pierDepth * 0.55), lines: [fo.dia + '" DIA. CONCRETE PIER IN SONOTUBE', 'FORM, ' + fmt(m.pierDepth) + ' MIN. BELOW GRADE (FROST', '1.8 M); PIER DESIGN TO BE CONFIRMED'] });
      } else if (fo.type === 'screwpile') {
        R(v - r, -m.pierDepth, 2 * r, m.pierDepth + m.pierTop, LW.h, { fill: '#fff' });
        sv.pl([[X(v - 0.6), Z(-m.pierDepth + 0.55)], [X(v + 0.6), Z(-m.pierDepth + 0.3)]], LW.h);
        if (i === m.beamsV.length - 1) Rgt.push({ x: X(v + r), y: Z(-m.pierDepth * 0.55), lines: ['STEEL SCREW PILE BELOW FROST,', fmt(m.pierDepth) + ' MIN.; TESTED CAPACITY', 'OVER ' + m.maxLoad + ' LB (VERIFY)'] });
      } else {
        R(v - r, 0, 2 * r, m.pierTop, LW.h, { fill: '#fff' }); sv.concrete(X(v - r), Z(m.pierTop), 2 * r * s, m.pierTop * s, 5);
        if (i === m.beamsV.length - 1) Rgt.push({ x: X(v + r), y: Z(m.pierTop / 2), lines: ['CONCRETE SURFACE PAD', 'PER CITY TABLE 1'] });
      }
    });
    // grade
    const gv0 = showHouse ? -gapH : v0;
    sv.line(X(gv0), Z(0), X(v1), Z(0), LW.h);
    sv.earth(X(gv0), Z(0), X(v1), 8, skips);
    Rgt.push({ x: X(v1 - 0.6), y: Z(0) + 1, lines: ['FINISHED GRADE'] });
    // ---- house
    if (showHouse) {
      const hv = -gapH;
      const rimD = 9.25 / 12;
      const hrTop = m.topJoist, hrBot = hrTop - rimD;
      const fdTop = hrBot - 1.5 / 12;
      const zFoundBot = -2.2;
      // foundation wall
      R(hv - 0.667, zFoundBot, 0.667, fdTop - zFoundBot, LW.m, { fill: '#fff' });
      sv.concrete(X(hv - 0.667), Z(fdTop), 0.667 * s, (fdTop - zFoundBot) * s, 21);
      sv.breakLine(X(hv - 0.667) - 6, Z(zFoundBot), X(hv) + 6, Z(zFoundBot));
      sv.earth(X(hv - 0.667) - 40, Z(0), X(hv - 0.667), 8);
      sv.line(X(hv - 0.667) - 40, Z(0), X(hv - 0.667), Z(0), LW.h);
      // sill + rim
      R(hv - 0.458, fdTop, 0.458, 1.5 / 12, LW.t);
      sv.xbox(X(hv - t), Z(hrTop), t * s, rimD * s, LW.m);
      // floor joist (beyond) + subfloor
      R(hv - 1.6, hrBot, 1.6 - t, rimD, LW.t, { dash: DASH.hidden });
      R(hv - 1.6, hrTop, 1.6, 0.75 / 12, LW.t);
      // wall above
      const wTop = zTop - 0.2;
      const wb = hrTop + 0.75 / 12;
      R(hv - 0.458, wb, 0.458, wTop - wb, LW.t);
      R(hv - 0.458, wb, 1.5 / 12, wTop - wb, LW.hair);
      sv.line(X(hv), Z(wb), X(hv), Z(wTop), LW.m);
      sv.line(X(hv + 0.06), Z(m.topDeck + 0.15), X(hv + 0.06), Z(wTop), LW.t); // siding face
      sv.breakLine(X(hv - 1.6) - 4, Z(wTop), X(hv + 0.06) + 6, Z(wTop));
      sv.breakLine(X(hv - 1.6), Z(hrBot) + 4, X(hv - 1.6), Z(hrTop + 0.07) - 4);
      Lft.push({ x: X(hv - 0.3), y: Z(wTop - 1.2), lines: ['EXISTING WALL, SIDING, SHEATHING', 'AND WEATHER BARRIER'] });
      Lft.push({ x: X(hv - 0.4), y: Z(-1.2), lines: ['EXISTING CONCRETE FOUNDATION WALL'] });
      if (m.useLedger) {
        // ledger
        sv.xbox(X(0), Z(m.topJoist), t * s, (m.jdIn / 12) * s, LW.h);
        // flashing
        sv.pl([[X(0.03), Z(m.topJoist + 0.45)], [X(0.03), Z(m.topJoist + 0.02)], [X(t + 0.05), Z(m.topJoist + 0.02)], [X(t + 0.05), Z(m.topJoist - 0.1)]], LW.m);
        // fasteners
        [m.topJoist - 2 / 12, m.botJoist + 2 / 12].forEach((z) => { sv.line(X(t + 0.01), Z(z), X(-0.42), Z(z), LW.m, '2.5 1.2'); sv.rect(X(t), Z(z) - 2.2, 0.04 * s, 4.4, LW.t, { fill: '#000' }); });
        // hanger
        sv.pl([[X(t + 0.01), Z(m.topJoist - 0.15)], [X(t + 0.01), Z(m.botJoist - 0.025)], [X(t + 0.22), Z(m.botJoist - 0.025)], [X(t + 0.22), Z(m.botJoist + 0.3)]], LW.m);
        Lft.push({ x: X(t / 2), y: Z(m.topJoist - m.jdIn / 24), lines: [st.framing.joist + ' P.T. LEDGER, FLASHING AND', 'FASTENING: SEE DETAIL 2'] });
      }
    }
    // ---- framing
    const jv0 = m.useLedger ? t : t, jv1 = S - t;
    R(jv0, m.botJoist, jv1 - jv0, m.jdIn / 12, LW.m, { fill: '#fff' });
    if (!m.useLedger) sv.xbox(X(0), Z(m.topJoist), t * s, (m.jdIn / 12) * s, LW.h);
    sv.xbox(X(S - t), Z(m.topJoist), t * s, (m.jdIn / 12) * s, LW.h);
    Rgt.push({ x: X(S * 0.55), y: Z(m.topJoist - m.jdIn / 24), lines: [st.framing.joist + ' SPF NO.2 P.T. JOISTS @ ' + m.spacing + '" O.C.'] });
    Rgt.push({ x: X(S - t / 2), y: Z(m.botJoist + 0.1), lines: [st.framing.joist + ' P.T. RIM JOIST'] });
    m.beamsV.forEach((v, i) => {
      const w = m.beam.wIn / 12;
      for (let k = 0; k < m.beam.plies; k++) sv.xbox(X(v - w / 2 + k * t), Z(m.beamTop), t * s, (m.beam.dIn / 12) * s, LW.h);
      // post
      const pw = m.postIn / 12;
      R(v - pw / 2, m.pierTop + 1 / 12, pw, m.beamBot - m.pierTop - 1 / 12, LW.m, { fill: '#fff' });
      // cap straps
      sv.line(X(v - pw / 2 - 0.02), Z(m.beamBot - 0.35), X(v - pw / 2 - 0.02), Z(m.beamBot + 0.45), LW.m);
      sv.line(X(v + pw / 2 + 0.02), Z(m.beamBot - 0.35), X(v + pw / 2 + 0.02), Z(m.beamBot + 0.45), LW.m);
      sv.line(X(v - pw / 2 - 0.02), Z(m.beamBot - 0.01), X(v + pw / 2 + 0.02), Z(m.beamBot - 0.01), LW.m);
      // base
      R(v - pw / 2 - 0.05, m.pierTop, pw + 0.1, 1 / 12, LW.m, { fill: '#fff' });
      sv.line(X(v), Z(m.pierTop), X(v), Z(m.pierTop - 0.5), LW.m, '2 1');
      // joist tie
      sv.pl([[X(v + w / 2 + 0.02), Z(m.botJoist + 0.35)], [X(v + w / 2 + 0.02), Z(m.botJoist - 0.3)]], LW.m);
      // knee brace up to the joists (posts over 5'-0"), toward the house side
      if (m.braced) {
        const leg = Math.min(2, m.postH * 0.4), bw = (5.5 / 12) / Math.SQRT2;
        const x0 = v - pw / 2, x1 = x0 - leg, zt = m.botJoist, zb = zt - leg - (m.beam.dIn / 12);
        sv.pl([[X(x0), Z(zb)], [X(x0 - (zt - zb)), Z(zt)], [X(x0 - (zt - zb) + 2 * bw), Z(zt)], [X(x0), Z(zb + 2 * bw)]], LW.m, { close: true, fill: '#fff' });
        sv.circle(X(x0 - 0.12), Z(zb + 0.25), 1.6, LW.t); sv.circle(X(x0 - (zt - zb) + 0.3), Z(zt - 0.12), 1.6, LW.t);
        void x1;
        if (i === 0) Lft.push({ x: X(x0 - (zt - zb) / 2), y: Z((zt + zb) / 2), lines: ['2x6 P.T. KNEE BRACE @ 45°, BOLTED TO POST', 'AND JOIST (POSTS > 5\'-0"; SIZE VERIFY)'] });
      }
      if (i === m.beamsV.length - 1) {
        Rgt.push({ x: X(v + w / 2), y: Z(m.beamTop - m.beam.dIn / 24), lines: [m.beam.label + ' SPF NO.2 P.T. BUILT-UP BEAM,', 'NAIL PLIES 2 ROWS @ 18" O.C.'] });
        Rgt.push({ x: X(v + w / 2 + 0.02), y: Z(m.botJoist - 0.2), lines: ['GALV. JOIST-TO-BEAM TIE EACH JOIST'] });
        Rgt.push({ x: X(v + pw / 2 + 0.02), y: Z(m.beamBot - 0.2), lines: ['GALV. POST CAP CONNECTOR'] });
        Rgt.push({ x: X(v + pw / 2), y: Z((m.beamBot + m.pierTop) / 2), lines: [st.framing.post + ' P.T. POST' + (m.postH > 5 ? ', BRACED (POST > 5\'-0")' : '')] });
        if (fo.type !== 'pad') Rgt.push({ x: X(v + pw / 2 + 0.05), y: Z(m.pierTop + 0.04), lines: ['GALV. ADJUSTABLE STANDOFF POST BASE', 'CAST INTO TOP OF PIER'] });
      }
    });
    // decking
    const bw = (+st.decking.boardW || 5.5) / 12, gp = (+st.decking.gap || 0.1875) / 12;
    for (let v = 0.25 / 12; v < S + 1 / 12 - 0.05; v += bw + gp) {
      const w = Math.min(bw, S + 1 / 12 - v);
      R(v, m.topJoist, w, m.deckTIn / 12, LW.t, { fill: '#fff' });
    }
    Rgt.push({ x: X(S * 0.75), y: Z(m.topDeck - m.deckTIn / 24), lines: [(st.decking.name || 'DECK BOARDS'), (+st.decking.gap ? fin(+st.decking.gap, 16) + ' GAPS, ' : '') + 'FASTENED PER MAKER'] });
    // guard
    if (m.guardOn) {
      const gt = st.guard.type;
      if (gt === 'wood') {
        const pv = S, pw = 3.5 / 12;
        R(pv, m.botJoist + 0.05, pw, m.topDeck + gH - m.botJoist - 0.05, LW.m, { fill: '#fff' });
        [m.topJoist - 1.8 / 12, m.botJoist + 1.8 / 12].forEach((z) => sv.line(X(S - t - 0.02), Z(z), X(pv + pw + 0.04), Z(z), LW.m, '2.5 1.2'));
        R(pv - 2 / 12, m.topDeck + gH, 5.5 / 12 + 0.01, 1.5 / 12, LW.h);
        R(S - 1.5 / 12 - 0.02, m.topDeck + 3.5 / 12, 1.5 / 12, 3.5 / 12, LW.m);
        R(S - 1.5 / 12 - 0.02, m.topDeck + gH - 3.5 / 12, 1.5 / 12, 3.5 / 12, LW.m);
        sv.line(X(S - 0.06), Z(m.topDeck + 7 / 12), X(S - 0.06), Z(m.topDeck + gH - 3.5 / 12), LW.t);
        Rgt.push({ x: X(pv + pw), y: Z(m.topDeck + gH * 0.55), lines: ['4x4 P.T. GUARD POST THROUGH-BOLTED', 'TO RIM, 2x2 BALUSTERS, 2x6 CAP'] });
      } else {
        const pw = 2.5 / 12, pv = S - pw - 1 / 12;
        R(pv, m.topDeck, pw, gH, LW.m, { fill: '#fff' });
        R(pv - 0.1, m.topDeck, pw + 0.2, 0.3 / 12, LW.m);
        R(pv - 0.05, m.topDeck + gH - 1.5 / 12, pw + 0.1, 1.5 / 12, LW.h);
        R(pv + 0.02, m.topDeck + 2 / 12, pw - 0.04, 1.25 / 12, LW.m);
        if (gt === 'glass') R(pv + 0.06, m.topDeck + 4 / 12, 0.06, gH - 7 / 12, LW.m);
        else sv.line(X(pv + pw / 2), Z(m.topDeck + 3.3 / 12), X(pv + pw / 2), Z(m.topDeck + gH - 1.5 / 12), LW.m);
        Rgt.push({ x: X(pv + pw + 0.05), y: Z(m.topDeck + gH * 0.55), lines: [(gt === 'glass' ? 'GLASS' : 'ALUMINUM') + ' GUARD SYSTEM, ' + fin(m.guardHIn) + ' HIGH,', 'OPENINGS < 4" (100 MM); POST BASES', 'FASTENED THROUGH DECK TO RIM/BLOCKING', 'PER MAKER (DOCS WITH PERMIT)'] });
      }
    }
    const yMin = A.y + 14, yMax = A.y + bandH - 40;
    // vertical dims kept out of the leader paths: height under the deck, guard inside the guard, pier depth beside the pier
    const vx = X(Math.min(0.75, (m.beamsV[0] - 0.6) * 0.5) + (m.useLedger ? 0 : 0.3));
    const hLbl = m.H * s > 112 ? fmt(m.H) + ' (' + DP.mm(m.H) + ' MM)' : fmt(m.H);
    sv.dimAt([vx, Z(0)], [vx, Z(m.topDeck)], 'y', vx, hLbl);
    const secObs = [DP.dimTextBoxY([vx, Z(0)], [vx, Z(m.topDeck)], vx, hLbl)];
    if (m.guardOn) { const gx = X(S) - 16; sv.dimAt([gx, Z(m.topDeck)], [gx, Z(m.topDeck + gH)], 'y', gx, fin(m.guardHIn), { out: 'above' }); }
    if (fo.type !== 'pad') { const r0 = (fo.type === 'screwpile' ? 3.5 : +fo.dia) / 24; const px = X(m.beamsV[0] - r0) - 12; sv.dimAt([px, Z(0)], [px, Z(-m.pierDepth)], 'y', px, fmt(m.pierDepth) + (m.pierDepth * s > 130 ? ' (' + DP.mm(m.pierDepth) + ' MM)' : '') + ' MIN.'); }
    DP.callouts(sv, Rgt, X(v1) + 30, 1, yMin, yMax, DP.TS.call, secObs);
    if (Lft.length) DP.callouts(sv, Lft, X(v0) - 14, -1, yMin, yMax, DP.TS.call, secObs);
    // horizontal chain below
    const yd = Z(-m.pierDepth) + 26;
    const pts = [[X(0), Z(m.botJoist)], ...m.beamsV.map((v) => [X(v), Z(-m.pierDepth)]), [X(S), Z(m.botJoist)]];
    const lb = []; for (let i = 0; i < pts.length - 1; i++) lb.push(fmt((pts[i + 1][0] - pts[i][0]) / s));
    sv.chain(pts, 'x', yd, lb);
    sv.dimAt([X(0), Z(0)], [X(S), Z(0)], 'x', yd + 26, fmt(S));
    // clear span dim above deck
    if (m.useLedger || m.beamsV.length > 1) {
      const a = m.useLedger ? t : m.beamsV[0] + m.beam.wIn / 24, b = (m.useLedger ? m.beamsV[0] : m.beamsV[1]) - m.beam.wIn / 24;
      const zz = Z(m.topDeck + gH + 0.55);
      sv.dimAt([X(a), Z(m.topJoist)], [X(b), Z(m.topJoist)], 'x', zz, 'CLEAR SPAN ' + fmt(b - a) + ' (MAX ' + (m.allowedIn ? fmt(m.allowedIn / 12) : 'VERIFY') + ')', { noExt: true });
    }
    // levels at left of dims
    const lx = X(v1) + 50;
    void lx;

    sv.viewTitle(A.x + 18, A.y + bandH - 26, '1', 'DECK SECTION', 'SCALE: ' + scaleLbl, meta.num);
    sv.line(A.x, A.y + bandH, A.x + A.w, A.y + bandH, LW.t);
    const half = A.w * 0.5;
    if (m.useLedger) ledgerDetail(sv, m, st, { x: A.x, y: A.y + bandH, w: half, h: A.h - bandH, ref: meta.num });
    else freeNote(sv, m, st, { x: A.x, y: A.y + bandH, w: half, h: A.h - bandH });
    sv.line(A.x + half, A.y + bandH, A.x + half, A.y + A.h, LW.t);
    if (m.stair) stairDetail(sv, m, st, { x: A.x + half, y: A.y + bandH, w: A.w - half, h: A.h - bandH, ref: meta.num });
    // design load note
    if (false) sv.lines(A.x + 220, A.y + A.h - 30, ['DESIGN LIVE LOAD 1.9 KPA (40 PSF). JOIST SPAN PER CITY OF WINNIPEG DECKS GUIDE TABLE 3; BEAM PER TABLE 2.', 'GUARD HEIGHT: 900 MM WHERE DECK IS 1800 MM OR LESS ABOVE GRADE, 1070 MM WHERE HIGHER. STAIRS: RISE 200 MM MAX., RUN 255 MM MIN., WIDTH 900 MM MIN.'], { size: 6 });
    return sv;
  }

  /* ---------- Detail 2: ledger connection (1" = 1'-0") ---------- */
  function ledgerDetail(sv, m, st, B) {
    const s = 72, t = 1.5 / 12, jd = m.jdIn / 12, rimD = 9.25 / 12;
    const ox = B.x + B.w * 0.5, oz = m.topJoist; // origin: house face at top of joist
    const zLow0 = Math.min(oz - 9.25 / 12, m.botJoist) - 0.55, zTop0 = oz + 0.75;
    const gy = B.y + (B.h - 44) / 2 + ((zTop0 + zLow0) / 2 - oz) * s;
    const X = (v) => ox + v * s, Z = (z) => gy - (z - oz) * s;
    const R = (v, z, dv, dz, lw, o) => sv.rect(X(v), Z(z + dz), dv * s, dz * s, lw, o);
    const hrTop = oz, hrBot = oz - rimD, fdTop = hrBot - 1.5 / 12, zLow = Math.min(hrBot, m.botJoist) - 0.55;
    const vR = 1.25, vL = -0.95, zTopW = oz + 0.75;
    // foundation (concrete)
    R(-0.667, zLow, 0.667, fdTop - zLow, LW.m, { fill: '#fff' }); sv.concrete(X(-0.667), Z(fdTop), 0.667 * s, (fdTop - zLow) * s, 31);
    sv.breakLine(X(-0.667) - 6, Z(zLow), X(0) + 6, Z(zLow));
    // sill, house rim (cut), subfloor, floor joist beyond, wall
    R(-0.458, fdTop, 0.458, 1.5 / 12, LW.m); sv.line(X(-0.458), Z(fdTop), X(0), Z(fdTop + 1.5 / 12), LW.hair);
    sv.xbox(X(-t), Z(hrTop), t * s, rimD * s, LW.h);
    R(vL, hrBot, -vL - t, rimD, LW.t, { dash: DASH.hidden });
    R(vL, hrTop, -vL, 0.75 / 12, LW.m);
    const wb = hrTop + 0.75 / 12;
    R(-0.458, wb, 1.5 / 12, zTopW - wb, LW.m); // bottom plate/stud edge
    R(-0.458 + 1.5 / 12, wb, 0.458 - 1.5 / 12 - 0.04, zTopW - wb, LW.hair);
    R(-0.04, fdTop, 0.04, zTopW - fdTop, LW.m); // sheathing
    sv.line(X(0.06), Z(m.topDeck + 0.12), X(0.06), Z(zTopW), LW.m); // siding above deck
    sv.breakLine(X(vL) - 4, Z(zTopW), X(0.1) + 6, Z(zTopW));
    sv.breakLine(X(vL), Z(hrBot) + 6, X(vL), Z(hrTop + 0.0625) - 6);
    // ledger, flashing, fasteners
    sv.xbox(X(0), Z(m.topJoist), t * s, jd * s, LW.h);
    sv.pl([[X(0.015), Z(oz + 0.42)], [X(0.015), Z(oz + 0.02)], [X(t + 0.04), Z(oz + 0.02)], [X(t + 0.04), Z(oz - 0.1)]], LW.h);
    const zf = [m.topJoist - 1.75 / 12, m.botJoist + 1.75 / 12];
    zf.forEach((z) => { sv.line(X(t), Z(z), X(-t - 0.2), Z(z), LW.m, '3 1.5'); sv.rect(X(t), Z(z) - 4, 0.035 * s, 8, LW.t, { fill: '#000' }); });
    // joist + hanger
    R(t, m.botJoist, vR - t, jd, LW.m, { fill: '#fff' });
    sv.breakLine(X(vR), Z(m.topJoist) - 8, X(vR), Z(m.botJoist) + 8);
    sv.pl([[X(t + 0.008), Z(m.topJoist - 0.12)], [X(t + 0.008), Z(m.botJoist - 0.02)], [X(t + 0.2), Z(m.botJoist - 0.02)], [X(t + 0.2), Z(m.botJoist + 0.35)]], LW.h);
    // decking boards (cut)
    const bw = (+st.decking.boardW || 5.5) / 12, gp = (+st.decking.gap || 0.1875) / 12;
    for (let v = 0.25 / 12; v < vR - 0.02; v += bw + gp) R(v, m.topJoist, Math.min(bw, vR - v), m.deckTIn / 12, LW.m, { fill: '#fff' });
    sv.breakLine(X(vR), Z(m.topDeck) - 6, X(vR), Z(m.topJoist) + 4);
    // callouts
    const L = [
      { x: X(-0.2), y: Z(zTopW - 0.2), lines: ['EXISTING WALL: SIDING, SHEATHING,', 'WEATHER BARRIER'] },
      { x: X(0.02), y: Z(oz + 0.3), lines: ['GALV. Z-FLASHING, LAP UNDER WEATHER', 'BARRIER; REMOVE SIDING AT LEDGER'] },
      { x: X(-t / 2), y: Z(hrBot + rimD * 0.3), lines: ['EXISTING HOUSE RIM JOIST: VERIFY', 'SIZE AND CONDITION ON SITE'] },
      { x: X(-0.3), y: Z(fdTop - 0.3), lines: ['EXISTING FOUNDATION WALL'] },
    ];
    const Rr = [
      { x: X(0.5), y: Z(m.topDeck - m.deckTIn / 24), lines: ['DECKING, 1/4" GAP AT HOUSE'] },
      { x: X(t / 2), y: Z(m.topJoist - jd * 0.5), lines: [st.framing.joist + ' P.T. LEDGER, FULL LENGTH'] },
      { x: X(-t - 0.12), y: Z(zf[1]), lines: [st.ledger.fastener + ',', '2 ROWS STAGGERED @ ' + st.ledger.spacing + '" O.C.', 'INTO HOUSE RIM (VERIFY)'] },
      { x: X(t + 0.15), y: Z(m.botJoist - 0.02), lines: ['GALV. FACE-MOUNT JOIST HANGER'] },
      { x: X(0.8), y: Z(m.botJoist + jd * 0.5), lines: [st.framing.joist + ' P.T. JOIST @ ' + m.spacing + '" O.C.'] },
    ];
    DP.callouts(sv, L, X(vL) - 12, -1, B.y + 12, B.y + B.h - 50, 7.5);
    DP.callouts(sv, Rr, X(vR) + 14, 1, B.y + 12, B.y + B.h - 50, 7.5);
    sv.viewTitle(B.x + 18, B.y + B.h - 26, '2', 'LEDGER CONNECTION', 'SCALE: 1" = 1\'-0"', B.ref);
  }
  function freeNote(sv, m, st, B) {
    H.notesBlock(sv, B.x + 20, B.y + 24, B.w - 40, 'Freestanding deck', ['DECK IS NOT FASTENED TO THE DWELLING. MAINTAIN ' + fmt(DP.parseLen(st.deck.gap) || 1) + ' CLEAR TO HOUSE.', 'PROVIDE BEAM AND POSTS AT BOTH ENDS OF JOIST SPAN AS SHOWN ON A2.']);
  }
  /* ---------- Detail 3: stair section (fit scale), with optional mid landing ---------- */
  function stairDetail(sv, m, st, B) {
    const S0 = m.stair, pr = S0.profile, rise = pr.rise, run = pr.run;
    const totRun = pr.total, wFt = totRun + 1.0 + 2.6, hFt = m.H + 3.6;
    const [lbl, s] = DP.pickScale(wFt, hFt, B.w - 240, B.h - 100);
    const ox = B.x + 70 + 0.8 * s, gy = B.y + 22 + (m.H + 3.3) * s;
    const X = (h) => ox + h * s, Z = (z) => gy - z * s;
    // deck edge (rim + decking)
    sv.xbox(X(-1.5 / 12), Z(m.topJoist), (1.5 / 12) * s, (m.jdIn / 12) * s, LW.h);
    sv.rect(X(-0.8), Z(m.topDeck), 0.8 * s + 1, (m.deckTIn / 12) * s, LW.m);
    sv.breakLine(X(-0.8), Z(m.topDeck) - 5, X(-0.8), Z(m.botJoist) + 5);
    // flights: [{h, z} top nosing ... bottom]
    const flights = []; let f0 = { h: 0, z: m.H };
    pr.steps.forEach((x) => { if (x.landing) { flights.push([f0, { h: x.h0, z: x.z }]); f0 = { h: x.h1, z: x.z }; } });
    flights.push([f0, { h: totRun, z: 0 }]);
    // landing platform
    const ld = pr.steps.find((x) => x.landing);
    if (ld && m.landing) {
      const L0 = m.landing;
      sv.rect(X(ld.h0), Z(L0.topJoist), (ld.h1 - ld.h0) * s, (m.jdIn / 12) * s, LW.m, { fill: '#fff' });
      sv.line(X(ld.h0 + 1.5 / 12), Z(L0.topJoist), X(ld.h0 + 1.5 / 12), Z(L0.botJoist), LW.t); sv.line(X(ld.h1 - 1.5 / 12), Z(L0.topJoist), X(ld.h1 - 1.5 / 12), Z(L0.botJoist), LW.t);
      const pw = m.postIn / 12, pc = (ld.h0 + ld.h1) / 2;
      sv.rect(X(pc - m.beam.wIn / 24), Z(L0.beamTop), (m.beam.wIn / 12) * s, (m.beam.dIn / 12) * s, LW.m, { fill: '#fff' });
      sv.rect(X(pc - pw / 2), Z(L0.beamBot), pw * s, (L0.beamBot - m.pierTop) * s, LW.m, { fill: '#fff' });
      if (st.found.type !== 'pad') { const r = (st.found.type === 'screwpile' ? 3.5 : +st.found.dia) / 24; sv.rect(X(pc - r), Z(m.pierTop), 2 * r * s, (m.pierTop + 0.5) * s, LW.m, { fill: '#fff' }); sv.breakLine(X(pc - r) - 4, Z(-0.5), X(pc + r) + 4, Z(-0.5)); }
    }
    // treads & risers
    const pts = [[X(0), Z(m.topDeck)]];
    pr.steps.forEach((x) => { pts.push([X(x.h0), Z(x.z)]); pts.push([X(x.h1), Z(x.z)]); });
    pts.push([X(totRun), Z(0)]);
    sv.pl(pts, LW.h);
    pr.steps.forEach((x) => { sv.rect(X(x.h0 - (x.landing ? 0 : 1 / 12)), Z(x.z), (x.h1 - x.h0 + (x.landing ? 0 : 1 / 12)) * s, (1 / 12) * s, LW.m, { fill: '#fff' }); });
    // stringer underside per flight, parallel to the nosing line
    const slope = rise / run, cosT = Math.cos(Math.atan(slope)), dV = (11.25 / 12) / cosT;
    flights.forEach(([A0, B0]) => {
      const zA = A0.z - dV, zBase = B0.z === 0 ? 0 : B0.z - m.jdIn / 12;
      const hB = Math.min(B0.h, A0.h + Math.max(0.2, (zA - zBase) / slope));
      sv.line(X(A0.h), Z(zA), X(hB), Z(zA - slope * (hB - A0.h)), LW.m);
      sv.line(X(A0.h), Z(A0.z), X(A0.h), Z(zA), LW.m);
      sv.line(X(A0.h), Z(A0.z), X(B0.h), Z(B0.z - (B0.z === 0 ? 0 : 0) + 0 * rise), LW.hair, '6 2');
    });
    // ground + pad at the foot
    sv.line(X(-0.8), Z(0), X(totRun + 2.6), Z(0), LW.h); sv.earth(X(-0.8), Z(0), X(totRun - 0.1), 7);
    sv.rect(X(totRun - 0.1), Z(0), 2.2 * s, (4 / 12) * s, LW.m, { fill: '#fff' }); sv.concrete(X(totRun - 0.1), Z(0), 2.2 * s, (4 / 12) * s, 41);
    // guards: 36" above each flight's nosing line, level over the landing
    const up = 3, stairObs = [];
    const lastF = flights[flights.length - 1];
    const nB = [lastF[1].h - run, rise];
    if (S0.guard || S0.handrail) {
      flights.forEach(([A0, B0], i) => {
        const a = [A0.h, A0.z], b = [B0.h - run, B0.z + rise];
        if (b[0] <= a[0]) return;
        sv.line(X(a[0]), Z(a[1] + up), X(b[0]), Z(b[1] + up), LW.h);
        sv.rect(X(b[0]) - 2, Z(b[1] + up), 4, up * s, LW.m);
        if (i < flights.length - 1 && ld) { const gl = (m.landing ? m.landing.guardHIn : 36) / 12; sv.line(X(ld.h0), Z(ld.z + gl), X(ld.h1), Z(ld.z + gl), LW.h); sv.rect(X(ld.h1) - 2, Z(ld.z + gl), 4, gl * s, LW.m); }
      });
      const dxs = X(nB[0]) + 16;
      sv.dimAt([X(nB[0]) + 2, Z(nB[1])], [X(nB[0]) + 2, Z(nB[1] + up)], 'y', dxs, '36"');
      stairObs.push(DP.dimTextBoxY([0, Z(nB[1])], [0, Z(nB[1] + up)], dxs, '36"'));
      sv.rect(X(-2.5 / 12), Z(m.topDeck + m.guardHIn / 12), (2.5 / 12) * s, (m.guardHIn / 12) * s, LW.m, { fill: '#fff' });
    }
    // dims
    sv.dimAt([X(0), Z(m.topDeck)], [X(0), Z(0)], 'y', X(-0.8) - 24, fmt(m.H));
    const chainPts = [[X(0), Z(m.H - rise)]], chainLb = [];
    flights.forEach(([A0, B0], i) => {
      const n = Math.round((B0.h - A0.h) / run);
      chainPts.push([X(B0.h), Z(rise)]); chainLb.push(fmt(B0.h - A0.h)); void n;
      if (i < flights.length - 1) { chainPts.push([X(flights[i + 1][0].h), Z(rise)]); chainLb.push(fmt(flights[i + 1][0].h - B0.h)); }
    });
    sv.chain(chainPts, 'x', Z(0) + 32, chainLb);
    stairObs.push({ x0: X(0) - 4, x1: X(totRun) + DP.textW(chainLb[chainLb.length - 1], DP.TS.dim) + 14, y0: Z(0) + 32 - 13, y1: Z(0) + 32 + 2 });
    const stairColX = Math.max(X(totRun + 2.6) + 10, X(totRun) + DP.textW(chainLb[chainLb.length - 1], DP.TS.dim) + 22);
    const lt = pr.steps.filter((x) => !x.landing).pop();
    const items = [
      { x: X(lt ? (lt.h0 + lt.h1) / 2 + 0.15 : totRun - 0.5), y: Z((lt ? lt.z : rise) + 0.5 / 12), lines: [(st.decking.material === 'composite' ? 'COMPOSITE' : 'DECK BOARD') + ' TREADS, 1" MAX. NOSING'] },
      { x: X(lastF[0].h + run * 1.2), y: Z(lastF[0].z - dV - slope * run * 1.2 + 0.25), lines: ['2x12 P.T. STRINGERS @ ' + st.assume.stringerSp + '" O.C. MAX.'] },
      { x: X(totRun + 1.0), y: Z(0.17), lines: ['CONCRETE LANDING / PAVERS AT FOOT', 'OF STAIR (VERIFY)'] },
      { x: X(nB[0]) + 2, y: Z(nB[1] + 2.2), lines: [S0.guard ? 'STAIR GUARD 900 MM (36") ABOVE NOSING' : 'HANDRAIL 865–1070 MM ABOVE NOSING', 'LINE; GRASPABLE HANDRAIL (OVER 3 RISERS)'] },
    ];
    if (ld && m.landing) items.push({ x: X(ld.h1), y: Z(m.landing.topJoist - m.jdIn / 24), lines: ['LANDING ' + fmt(S0.ws) + ' × ' + fmt(ld.h1 - ld.h0) + ' AT +' + fmt(m.landing.H) + ',', st.framing.joist + ' P.T. FRAME ON ' + st.framing.post + ' POSTS (F2)', 'LANDING LENGTH (VERIFY)'] });
    items.forEach((it) => { it.lines = DP.wrapW(DP.joinLines(it.lines), Math.min(170, B.x + B.w - stairColX - 18), 7.5); });
    DP.callouts(sv, items, stairColX, 1, B.y + 14, B.y + B.h - 84, 7.5, stairObs);
    { const ls = [S0.nR + ' RISERS @ ' + fin(S0.riseIn) + ' = ' + fmt(m.H) + '; ' + S0.nT + ' TREADS @ ' + fin(S0.runIn) + '; ' + fin(S0.ws * 12) + ' WIDE.', 'CITY: RISE 200 MM (7 7/8") MAX., RUN 255 MM (10") MIN., WIDTH 900 MM (36") MIN.'].flatMap((l) => DP.wrapW(l, B.w - 230, 7.5)); sv.lines(B.x + 215, B.y + B.h - 26 - (ls.length - 1) * 9.4, ls, { size: 7.5 }); }
    sv.viewTitle(B.x + 18, B.y + B.h - 26, '3', 'STAIR SECTION', 'SCALE: ' + lbl, B.ref);
  }

  /* ================= A5 MATERIALS & BUDGET ================= */
  function materialSheet(m, st, meta) {
    const sv = new Svg();
    const A = H.frame(sv, m, st, meta);
    const x = A.x + 18; let y = A.y + 26;
    sv.text(x, y, 'Material list and budget', { size: 12, bold: true }); y += 6;
    sv.text(x, y + 11, 'QUANTITIES COMPUTED FROM THIS DESIGN (' + fmt(m.L) + ' × ' + fmt(m.W) + ', ' + fmt(m.H) + ' ABOVE GRADE). CONFIRM BEFORE ORDERING.', { size: 8 }); y += 22;
    const items = m.materials;
    const srcs = []; const ref = (it) => { if (it.src === 'Enter price') return 'ENTER PRICE'; if (it.src === 'Entered by user') return 'ENTERED BY USER'; let k = srcs.indexOf(it.src); if (k < 0) { srcs.push(it.src); k = srcs.length - 1; } return '[' + (k + 1) + ']'; };
    const money = (v) => '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const rows = items.map((it) => [it.n, it.item, it.spec, it.qty, it.unit, it.price == null ? '—' : money(it.price), it.price == null ? '—' : money(it.price * it.qty), ref(it)]);
    const cols = [{ w: 22, label: '#' }, { w: 170, label: 'ITEM' }, { w: 352, label: 'SPECIFICATION' }, { w: 40, label: 'QTY', align: 'end' }, { w: 56, label: 'UNIT' }, { w: 72, label: 'UNIT PRICE', align: 'end' }, { w: 78, label: 'AMOUNT', align: 'end' }, { w: 90, label: 'PRICE SOURCE' }];
    y = DP.tableBlock(sv, x, y, cols, rows, { size: 7.5, rh: rows.length > 30 ? 11.5 : 12.5 });
    const LB = DP.labourEstimate(m, st);
    const T = DP.totals(items, LB);
    const tx = x + 22 + 170 + 352 + 40 + 56, tw = 72 + 78;
    const trs = [['MATERIALS SUBTOTAL (BEFORE TAX)', money(T.sub)]];
    if (LB.on) trs.push(['LABOUR, EDITABLE ESTIMATE: ' + LB.hours + ' H × ' + (LB.rate != null ? money(LB.rate) + '/H' : 'RATE NOT ENTERED'), LB.amount != null ? money(LB.amount) : 'ENTER RATE']);
    trs.push(['GST 5%' + (LB.on && LB.amount != null ? ' (MATERIALS + LABOUR)' : ''), money(T.gst)], ['PST (MB RST) 7% (MATERIALS)', money(T.pst)], ['TOTAL', money(T.total)]);
    trs.forEach(([k, v], i) => {
      const yy = y + 4 + i * 15, last = i === trs.length - 1;
      sv.rect(tx, yy, tw, 15, last ? LW.h : LW.t);
      sv.text(tx - 6, yy + 10.8, k, { size: 8, anchor: 'end', bold: last });
      sv.text(tx + tw - 4, yy + 10.8, v, { size: 8.5, anchor: 'end', bold: last });
    });
    let ny = y + 4 + trs.length * 15 + 8;
    const nx = x;
    const notes = [
      'UNIT PRICES ARE STARTING POINTS ONLY: CAD, BEFORE TAX, READ FROM RETAILER WEBSITES ON 14 NOV 2026 (STORE AND DATE IN SOURCE LIST). CHANGE THEM IN THE APP TO YOUR SUPPLIER QUOTE.',
      T.missing ? T.missing + ' ITEM(S) HAVE NO DEFAULT PRICE ("—") AND ARE NOT IN THE TOTAL. ENTER A PRICE FOR EACH IN THE APP.' : 'ALL ITEMS PRICED.',
      'LUMBER LENGTHS OTHER THAN THE SOURCE PIECE ARE ESTIMATED PRO-RATA PER FOOT FROM THAT PIECE.',
      'ASSUMPTIONS (EDITABLE): CONCRETE ' + st.assume.bagYield + ' FT³ PER 30 KG BAG, ' + st.assume.waste + '% DECKING/RAIL WASTE, ' + st.assume.boxQty + ' FASTENERS PER BOX, ' + st.assume.railSection + "' GUARD SECTIONS, STRINGERS AT " + st.assume.stringerSp + '" O.C. MAX.',
      'DELIVERY, PERMIT FEES AND EQUIPMENT RENTAL ARE NOT INCLUDED. TAX LINES: GST 5% + MANITOBA PST (RST) 7% ON MATERIALS' + (LB.on ? '; GST ON LABOUR. CONFIRM TAX TREATMENT OF LABOUR AND GST REGISTRATION (VERIFY).' : '.'),
    ];
    if (LB.on) notes.push('LABOUR IS AN EDITABLE ESTIMATE, NOT A QUOTE. ' + (LB.overridden ? 'HOURS ENTERED BY CONTRACTOR (' + LB.hours + ' H; SIZE-BASED ESTIMATE WAS ' + LB.estH + ' H).' : 'HOURS ESTIMATED FROM DECK SIZE: ' + LB.parts.map((p0) => p0[0] + ' ' + (Math.round(p0[1] * 10) / 10) + ' ' + p0[2] + ' × ' + p0[3] + ' H').join('; ') + ' = ' + LB.estH + ' H. FACTORS ARE PLACEHOLDERS TO ADJUST.') + (LB.rate == null ? ' NO HOURLY RATE ENTERED, SO LABOUR IS NOT IN THE TOTAL.' : ''));
    const ny0 = ny + 6;
    H.notesBlock(sv, nx, ny0, 470, 'Budget notes', notes, { size: 7.5 });
    const px = nx + 500; ny = ny0;
    sv.text(px, ny, 'Price sources', { size: DP.TS.head, bold: true }); sv.line(px, ny + 3, px + DP.textW('PRICE SOURCES', DP.TS.head, true), ny + 3, LW.m); ny += 16;
    srcs.forEach((sname, i) => {
      const key = Object.keys(DP.PRICE_SOURCES).find((k) => sname.indexOf(DP.PRICE_SOURCES[k].src) >= 0);
      const url = key ? DP.PRICE_SOURCES[key].url : '';
      DP.wrapW('[' + (i + 1) + '] ' + sname, 380, 7.5).forEach((l, k) => { sv.text(px + (k ? 14 : 0), ny, l, { size: 7.5 }); ny += 9.5; });
      if (url) { sv.text(px + 14, ny, DP.fitW(url, 370, 7), { size: 7, raw: true }); ny += 9; }
      ny += 3;
    });
    return sv;
  }

  /* ================= A6 PHOTOS ================= */
  function photoSheet(m, st, meta) {
    const sv = new Svg();
    const A = H.frame(sv, m, st, meta);
    const imgs = [];
    if (st.sketch) imgs.push({ src: st.sketch.data, cap: 'OWNER / CONTRACTOR SKETCH — REFERENCE ONLY, NOT TO SCALE' });
    (st.photos || []).forEach((p, i) => imgs.push({ src: p.data, cap: 'SITE PHOTO ' + (i + 1) + (p.caption ? ' — ' + p.caption : '') }));
    const n = Math.min(imgs.length, 6);
    const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3, rws = Math.ceil(n / cols);
    const gw = (A.w - 40) / cols, gh = (A.h - 70) / rws;
    imgs.slice(0, 6).forEach((im, i) => {
      const cx = A.x + 20 + (i % cols) * gw, cy = A.y + 20 + Math.floor(i / cols) * gh;
      sv.rect(cx + 4, cy + 4, gw - 8, gh - 26, LW.t);
      sv.image(cx + 6, cy + 6, gw - 12, gh - 30, im.src);
      sv.text(cx + 6, cy + gh - 12, im.cap, { size: 8, bold: true });
    });
    sv.text(A.x + 20, A.y + A.h - 12, 'PHOTOS AND SKETCHES ARE FOR REFERENCE ONLY. DIMENSIONS ON THE DRAWING SHEETS GOVERN.', { size: 8 });
    return sv;
  }

  /* ================= DESIGN CHECKS & CITY DECK CHECKLIST ================= */
  // Rows of the City of Winnipeg deck checklist (Building Permit Application Form — Decks, winnipeg.ca/media/4996, p.4), filled from this design.
  DP.cityChecklist = function (m, st) {
    const fo = st.found, f = st.framing, rows = [];
    const ck = (re) => m.checks.find((c) => re.test(c.item));
    const stOf = (c) => (c ? c.status : 'VERIFY');
    rows.push(['NEW / EXISTING', 'NEW DECK', 'OK']);
    rows.push(['FOUNDATION DESIGNED BY AN ENGINEER?', fo.engineered ? 'YES (SEAL / DESIGNER CERTIFICATE WITH PERMIT)' : 'NO', fo.engineered ? 'INPUT' : (fo.type === 'sonotube' && m.deepReq ? 'VERIFY' : 'OK')]);
    const ftype = fo.type === 'pad' ? 'CONCRETE PADS' : fo.type === 'screwpile' ? 'SCREW PILES, MAKER: ' + (fo.pileMaker || '____') + ', MODEL: ' + (fo.pileModel || '____') : 'CONCRETE PIERS, ' + fo.dia + '" DIA. × ' + fmt(m.pierDepth);
    rows.push(['FOUNDATION TYPE / MATERIAL', ftype, fo.type === 'screwpile' ? (fo.pileMaker && fo.pileModel ? 'VERIFY' : 'INPUT') : fo.type === 'pad' ? (m.botJoist * 12 <= 51 + 0.01 ? 'OK' : 'NG') : stOf(ck(/Concrete pier design/)) === 'VERIFY' ? 'VERIFY' : 'OK']);
    if (fo.type === 'pad') rows.push(['PADS: U/S OF JOISTS 1.3 M (4\'-3") MAX.', fmt(m.botJoist) + ' TO U/S OF JOISTS', m.botJoist * 12 <= 51 + 0.01 ? 'OK' : 'NG']);
    rows.push(['POSTING', (m.postSp * 12 <= 96 + 0.01 ? 'LESS THAN 2.4 M (8\'-0") O/C: ' : 'GREATER THAN 2.4 M (8\'-0") O/C — ENGINEER SEAL: ') + fmt(m.postSp), stOf(ck(/Post spacing/))]);
    const jc = ck(/Joist cantilever/);
    rows.push(['JOIST PROJECTION (' + f.joist + ')', m.cant > 0 ? fmt(m.cant) + ' — LIMIT ' + (jc ? jc.req : '') : 'NONE', m.cant > 0 ? stOf(jc) : 'OK']);
    rows.push(['BEAM PROJECTION BEYOND POST', (m.ohMax * 12 <= 24 + 0.01 ? 'LESS THAN 600 MM (2\'-0"): ' : 'GREATER THAN 600 MM — ENGINEER SEAL: ') + fmt(m.ohMax), stOf(ck(/Beam overhang/))]);
    rows.push(['DECK HEIGHT ABOVE GRADE', (m.H * 12 <= 51 + 0.01 ? 'EQUAL TO OR LESS THAN 1.3 M (4\'-3"): ' : 'GREATER THAN 1.3 M (4\'-3"): ') + fmt(m.H) + ' (' + DP.mm(m.H) + ' MM)', 'OK']);
    rows.push(['GUARDRAIL HEIGHT', !m.guardReq ? 'NOT REQUIRED (600 MM OR LESS)' + (m.guardOn ? ', ' + DP.fmtIn(m.guardHIn) + ' PROVIDED' : '') : (m.H * 12 > 72 ? 'OVER 1.8 M: 1.06 M (3\'-6") MIN.' : '600 MM–1.8 M: 914 MM (3\'-0") MIN.') + ' — ' + DP.fmtIn(m.guardHIn) + ' PROVIDED', !m.guardReq || (m.guardHIn >= (m.H * 12 > 72 ? 42 : 36)) ? 'OK' : 'NG']);
    const bc = ck(/^Beam/);
    rows.push(['SUPPORTED JOIST LENGTH (SJL) AND BEAM', 'SJL ' + fmt(m.sjlMax) + ' — ' + m.beam.label + (m.sjlMax * 12 > 120 + 0.01 ? ' (OVER 3 M: ENGINEER SEAL)' : ''), stOf(bc)]);
    const js = ck(/Joist span/);
    rows.push(['JOIST SIZE, SPACING, MAX. SPAN', f.joist + ' @ ' + m.spacing + '" O/C, SPAN ' + fmt(m.clear) + (m.allowedIn ? ' (MAX ' + fmt(m.allowedIn / 12) + ')' : ''), stOf(js)]);
    return rows;
  };
  function checksSheet(m, st, meta) {
    const sv = new Svg();
    const A = H.frame(sv, m, st, meta);
    const x = A.x + 18; let y = A.y + 26;
    const TS = DP.TS;
    sv.text(x, y, 'Design checks — City of Winnipeg Decks guide (Oct. 2025)', { size: 11, bold: true }); y += 8;
    const W = A.w - 36;
    const cols = [{ w: 230, label: 'ITEM' }, { w: 250, label: 'REQUIRED' }, { w: 190, label: 'THIS DESIGN' }, { w: 56, label: 'STATUS' }, { w: W - 726, label: 'SOURCE' }];
    const rows = [];
    m.checks.filter((c) => c.status !== 'INFO' || /Guard required|Permit needed/.test(c.item)).forEach((c) => {
      const a = DP.wrapW(c.item, cols[0].w - 6, TS.tbl), b = DP.wrapW(c.req, cols[1].w - 6, TS.tbl), d = DP.wrapW(c.prov, cols[2].w - 6, TS.tbl);
      const n = Math.max(a.length, b.length, d.length);
      for (let i = 0; i < n; i++) rows.push([a[i] || '', b[i] || '', d[i] || '', i ? '' : c.status, i ? '' : c.src]);
    });
    const rh = rows.length > 30 ? 10.5 : 11.5;
    y = DP.tableBlock(sv, x, y, cols, rows, { rh }) + 22;
    sv.text(x, y, 'City of Winnipeg deck checklist — as designed', { size: 11, bold: true });
    sv.text(x + DP.textW('CITY OF WINNIPEG DECK CHECKLIST — AS DESIGNED', 11, true) + 12, y, '(BUILDING PERMIT APPLICATION FORM — DECKS, P.4; ALSO FILL IN ON THE FORM)', { size: 7.5 }); y += 8;
    const cl = DP.cityChecklist(m, st);
    const cc = [{ w: 260, label: 'CHECKLIST ITEM' }, { w: W - 260 - 70, label: 'SELECTION FOR THIS DESIGN' }, { w: 70, label: 'STATUS' }];
    const cr = [];
    cl.forEach((r) => { const ls = DP.wrapW(r[1], cc[1].w - 6, TS.tbl); ls.forEach((l, i) => cr.push([i ? '' : r[0], l, i ? '' : r[2]])); });
    y = DP.tableBlock(sv, x, y, cc, cr, { rh }) + 18;
    const legend = ['STATUS: OK = MEETS THE CITY VALUE SHOWN. NG = DOES NOT MEET, REDESIGN BEFORE SUBMITTING. VERIFY = THE CITY SOURCES DO NOT SETTLE IT, OR A MAKER / ENGINEER DOCUMENT IS NEEDED; CONFIRM BEFORE CONSTRUCTION. INPUT = JOB INFORMATION STILL TO BE ENTERED.'];
    DP.wrapW(legend[0], W, 8).forEach((l) => { sv.text(x, y, l, { size: 8 }); y += 10.5; });
    return sv;
  }

  /* Sheet list. o.threeView: only the City's three required views (plan, front, side), numbered 1-3. */
  DP.buildSheets = function (m, st, o = {}) {
    let list;
    if (o.threeView) {
      list = [
        ['A1', 'PLAN VIEW: FRAMING & FOUNDATION', DP.framingSheet],
        ['A2', 'FRONT ELEVATION', (m2, st2, me) => DP.elevViewSheet(m2, st2, me, 'front')],
        ['A3', 'SIDE ELEVATION', (m2, st2, me) => DP.elevViewSheet(m2, st2, me, 'left')],
      ];
    } else {
      list = [
        ['SITE PLAN', DP.siteSheet],
        ['PLAN VIEW: FRAMING & FOUNDATION', DP.framingSheet],
        ['FRONT ELEVATION', (m2, st2, me) => DP.elevViewSheet(m2, st2, me, 'front')],
        ['SIDE ELEVATION', (m2, st2, me) => DP.elevViewSheet(m2, st2, me, 'left')],
        ['DECK SECTION & DETAILS', sectionSheet],
      ];
      if (st.out.checks !== false) list.push(['DESIGN CHECKS & CITY DECK CHECKLIST', checksSheet]);
      if (st.out.budget !== false && !o.permitOnly) list.push(['MATERIAL LIST & BUDGET', materialSheet]);
      if ((st.photos && st.photos.length) || st.sketch) list.push(['SITE PHOTOS & SKETCH', photoSheet]);
      list = list.map(([t, fn], i) => ['A' + (i + 1), t, fn]);
    }
    const numOf = (re) => { const r = list.find((l) => re.test(l[1])); return r ? r[0] : null; };
    const refs = { elevRef: numOf(/^FRONT ELEV/), secRef: o.threeView ? null : numOf(/^DECK SECTION/), checksRef: o.threeView ? null : numOf(/^DESIGN CHECKS/), threeView: !!o.threeView };
    return list.map(([num, title, fn], i) => {
      const meta = { num, title, of: (o.threeView ? 'CITY 3-VIEW SET, ' : '') + (i + 1) + ' OF ' + list.length, scale: 'AS NOTED', reduced: o.reduced, ...refs };
      let svg;
      try { svg = fn(m, st, meta).toString(DP.SHEET.W, DP.SHEET.H); }
      catch (e) { console.error(e); const sv = new Svg(); H.frame(sv, m, st, meta); sv.text(80, 120, 'COULD NOT DRAW THIS SHEET: ' + e.message, { size: 10 }); svg = sv.toString(DP.SHEET.W, DP.SHEET.H); }
      return { num, title, svg };
    });
  };
  DP.sectionSheet = sectionSheet; DP.materialSheet = materialSheet; DP.checksSheet = checksSheet;
})();
