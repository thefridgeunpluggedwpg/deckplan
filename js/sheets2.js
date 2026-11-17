(function () {
  const DP = window.DP;
  const { Svg, LW, DASH } = DP;
  const fmt = DP.fmt, fin = DP.fmtIn;
  const H = DP.sheetHelpers;

  /* Callout column: items [{x,y,lines}] -> stacked notes at column x with leaders. */
  function callouts(sv, items, colX, side, yMin, yMax, size = DP.TS.call, obstacles = [], gap = 8) {
    const lh = size * 1.22;
    items = items.filter(Boolean).map((it) => ({ ...it, lines: it.lines.map((s) => s.toUpperCase()) })).sort((a, b) => a.y - b.y);
    let y = yMin;
    const pos = items.map((it) => { const h = it.lines.length * lh; const yy = Math.max(it.y - 2, y); y = yy + h + gap; return yy; });
    // push up if overflow
    let over = y - gap - yMax;
    for (let i = items.length - 1; i >= 0 && over > 0; i--) {
      const room = i ? pos[i] - (pos[i - 1] + items[i - 1].lines.length * lh + gap) : pos[i] - yMin;
      const sh = Math.min(over, Math.max(0, room));
      for (let k = i; k < items.length; k++) pos[k] -= sh;
      over -= sh;
      if (i < items.length - 1) { /* keep order */ }
    }
    // route around obstacle boxes (e.g. dimension text): go over/under the box, then on to the note
    const crosses = (x1, y1, x2, y2, b) => { for (let k = 0; k <= 60; k++) { const x = x1 + ((x2 - x1) * k) / 60, y = y1 + ((y2 - y1) * k) / 60; if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return true; } return false; };
    const segs = [];
    items.forEach((it, i) => {
      let via = [];
      const ob = obstacles.find((b) => crosses(it.x, it.y, colX, pos[i], b));
      if (ob) {
        const yb = Math.abs(it.y - (ob.y0 - 3)) < Math.abs(it.y - (ob.y1 + 3)) ? ob.y0 - 3 : ob.y1 + 3;
        const near = side > 0 ? ob.x0 - 3 : ob.x1 + 3, far = side > 0 ? ob.x1 + 3 : ob.x0 - 3;
        via = [[near, yb], [far, yb]];
      }
      sv.leader(it.x, it.y, colX, pos[i], it.lines, { side, size, via });
      const pts = [[it.x, it.y], ...via, [colX, pos[i]]];
      for (let k = 0; k < pts.length - 1; k++) segs.push([pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]]);
    });
    return segs;
  }

  function tableBlock(sv, x, y, cols, rows, o = {}) { // cols [{w, label, align}]
    const size = o.size || DP.TS.tbl, rh = o.rh || 12;
    const W = cols.reduce((a, c) => a + c.w, 0);
    sv.rect(x, y, W, rh * (rows.length + 1), LW.m);
    let cx = x;
    cols.forEach((c, i) => { sv.text(c.align === 'end' ? cx + c.w - 3 : cx + 3, y + rh - 3.5, c.label, { size, bold: true, anchor: c.align === 'end' ? 'end' : 'start' }); if (i) sv.line(cx, y, cx, y + rh * (rows.length + 1), LW.t); cx += c.w; });
    sv.line(x, y + rh, x + W, y + rh, LW.m);
    rows.forEach((r, ri) => {
      const yy = y + rh * (ri + 2) - 3.5;
      let cx2 = x;
      r.forEach((v, ci) => {
        const c = cols[ci];
        let s = String(v == null ? '' : v);
        const max = c.w - 5; while (s.length > 2 && DP.textW(s.toUpperCase(), size, c.bold) > max) s = s.slice(0, -3) + '..';
        sv.text(c.align === 'end' ? cx2 + c.w - 3 : cx2 + 3, yy, s, { size, bold: c.boldCol && ci === c.boldCol, anchor: c.align === 'end' ? 'end' : 'start' });
        cx2 += c.w;
      });
      if (ri < rows.length - 1) sv.line(x, y + rh * (ri + 2), x + W, y + rh * (ri + 2), LW.hair);
    });
    return y + rh * (rows.length + 1);
  }
  DP.tableBlock = tableBlock;

  /* ---------- shared helpers ---------- */
  // stair run (h along the stair, from the deck edge) -> deck plan coords
  function stairXY(st0, h, a) { // a: across the stair, 0..ws
    const e = st0.edgePos;
    if (st0.side === 'front') return { x: st0.off + a, y: e + h };
    if (st0.side === 'left') return { x: e - h, y: st0.off + a };
    return { x: e + h, y: st0.off + a };
  }
  DP.stairXY = stairXY;
  function extentsPlan(m) {
    let x0 = 0, x1 = m.L, y1 = m.Wt;
    if (m.stair) { const r = m.stair.rect; x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
    return { x0, x1, y1 };
  }
  DP.extentsPlan = extentsPlan;
  function tag(sv, x, y, txt, r = 8.5) { sv.circle(x, y, r, LW.m, { fill: '#fff' }); sv.text(x, y + 2.9, txt, { size: 8, bold: true, anchor: 'middle' }); }
  DP.tag = tag;

  /* ================= A2 FRAMING & FOUNDATION PLAN ================= */
  function framingSheet(m, st, meta) {
    const sv = new Svg();
    const A = H.frame(sv, m, st, meta);
    const colW = 256;
    const R = { x: A.x + 14, y: A.y + 14, w: A.w - colW - 30, h: A.h - 64 };
    const st0 = m.stair;
    const E = extentsPlan(m);
    const gapH = m.attached ? 0 : DP.parseLen(st.deck.gap) || 1;
    const multi = m.zones.length > 1;
    const leftChain = multi && m.perp && m.zones[0].Wy !== m.zones[m.zones.length - 1].Wy;
    const ext = { x0: E.x0 - 1.5, x1: E.x1 + 1.5, y0: -gapH - 3.2, y1: E.y1 + 1 };
    const LEFT = 196 + (leftChain ? 55 : 0), RIGHT = 74;
    const nRowsBelow = 2 + (st0 && st0.side === 'front' ? 1 : 0) + (multi ? 1 : 0);
    const [scaleLbl, s] = DP.pickScale(ext.x1 - ext.x0, ext.y1 - ext.y0, R.w - LEFT - RIGHT, R.h - 80 - nRowsBelow * 24);
    const ox = R.x + LEFT + (R.w - LEFT - RIGHT - (ext.x1 - ext.x0) * s) / 2 - ext.x0 * s;
    const oy = R.y + 34 + (R.h - 80 - nRowsBelow * 24 - (ext.y1 - ext.y0) * s) / 2 - ext.y0 * s;
    const P = (x, y) => [ox + x * s, oy + y * s];
    const PX = (q) => P(q.x, q.y);
    const t = 1.5 / 12;
    const rectXY = (x0, y0, x1, y1, lw, o) => { const a = P(Math.min(x0, x1), Math.min(y0, y1)), b = P(Math.max(x0, x1), Math.max(y0, y1)); sv.rect(a[0], a[1], b[0] - a[0], b[1] - a[1], lw, o); };
    const zRect = (z, u0, v0, du, dv, lw, o) => { const a = z.toXY(u0, v0), b = z.toXY(u0 + du, v0 + dv); rectXY(a.x, a.y, b.x, b.y, lw, o); };
    // house wall with openings
    const wallT = 0.75;
    const hw0 = P(-1.2, -gapH - wallT), hw1 = P(m.L + 1.2, -gapH);
    sv.hatch(hw0[0], hw0[1], hw1[0] - hw0[0], hw1[1] - hw0[1], 3.5, LW.hair);
    sv.line(hw0[0], hw1[1], hw1[0], hw1[1], LW.xh); sv.line(hw0[0], hw0[1], hw1[0], hw0[1], LW.h);
    sv.breakLine(hw0[0], hw0[1] - 4, hw0[0], hw1[1] + 4); sv.breakLine(hw1[0], hw0[1] - 4, hw1[0], hw1[1] + 4);
    const tags = [];
    m.openings.forEach((o) => {
      const a = P(o.at, -gapH - wallT), b = P(o.at + o.w, -gapH);
      if (o.type === 'door') {
        sv.rect(a[0], a[1], b[0] - a[0], b[1] - a[1], 0.01, { fill: '#fff', stroke: '#fff' });
        sv.line(a[0], a[1], a[0], b[1], LW.h); sv.line(b[0], a[1], b[0], b[1], LW.h);
        // sliding patio door: two staggered panels
        const ym = (a[1] + b[1]) / 2, xm = (a[0] + b[0]) / 2;
        sv.line(a[0], ym - 1.6, xm + 3, ym - 1.6, LW.m); sv.line(xm - 3, ym + 1.6, b[0], ym + 1.6, LW.m);
      } else {
        // basement window: below the floor, shown hidden
        sv.rect(a[0], a[1] + (b[1] - a[1]) * 0.25, b[0] - a[0], (b[1] - a[1]) * 0.5, LW.m, { dash: DASH.hidden, fill: '#fff' });
      }
      const tx = (a[0] + b[0]) / 2; tags.push(tx);
      tag(sv, tx, a[1] - 12, o.mark);
    });
    const houseTxt = 'EXISTING HOUSE';
    const tw0 = DP.textW(houseTxt, 10, true);
    const cands = [0.2, 0.5, 0.8, 0.05, 0.95].map((k) => hw0[0] + 10 + (hw1[0] - hw0[0] - 20 - tw0) * k);
    const hx = cands.find((x) => tags.every((t2) => t2 < x - 12 || t2 > x + tw0 + 12)) || cands[0];
    sv.text(hx, hw0[1] - 7, houseTxt, { size: 10, bold: true });
    // zones (deck + landing): joists, rims / ledger, beams
    const allZ = m.zones.concat(m.landing ? [m.landing] : []);
    allZ.forEach((z) => {
      const v0 = t, v1 = z.S - t;
      z.joistsU.forEach((u) => {
        const a = PX(z.toXY(u - 0.75 / 12, v0)), b = PX(z.toXY(u - 0.75 / 12, v1)), c = PX(z.toXY(u + 0.75 / 12, v0)), d = PX(z.toXY(u + 0.75 / 12, v1));
        sv.line(a[0], a[1], b[0], b[1], LW.t); sv.line(c[0], c[1], d[0], d[1], LW.t);
      });
      zRect(z, 0, z.S - t, z.R, t, LW.m);
      zRect(z, 0, 0, z.R, t, z.useLedger ? LW.h : LW.m);
      z.beamsV.forEach((v) => zRect(z, 0, v - m.beam.wIn / 24, z.R, m.beam.wIn / 12, LW.m, { dash: DASH.hidden }));
    });
    // deck outline (heavy)
    sv.pl(m.poly.map(([x, y]) => P(x, y)).concat([P(m.poly[0][0], m.poly[0][1])]), LW.h);
    // zone joint note
    if (multi) {
      const zj = m.perp ? m.zones[1].x0 : m.W;
      const a = m.perp ? P(zj, m.W * 0.5) : P(m.L * 0.5, zj);
      void a;
    }
    // posts + footings
    const fo = st.found;
    m.footings.forEach((f) => {
      const c = P(f.x, f.y);
      const ps = (m.postIn / 12) * s;
      sv.rect(c[0] - ps / 2, c[1] - ps / 2, ps, ps, LW.m, { dash: DASH.hidden });
      sv.line(c[0] - ps / 2, c[1] - ps / 2, c[0] + ps / 2, c[1] + ps / 2, LW.hair); sv.line(c[0] + ps / 2, c[1] - ps / 2, c[0] - ps / 2, c[1] + ps / 2, LW.hair);
      if (fo.type === 'pad') { const r = ((+fo.padSize || 24) / 24) * s; sv.rect(c[0] - r, c[1] - r, 2 * r, 2 * r, LW.m, { dash: DASH.hidden }); }
      else sv.circle(c[0], c[1], ((fo.type === 'screwpile' ? 10 : +fo.dia) / 24) * s, LW.m, { dash: DASH.hidden });
      sv.line(c[0] - 9, c[1], c[0] + 9, c[1], LW.hair, DASH.short); sv.line(c[0], c[1] - 9, c[0], c[1] + 9, LW.hair, DASH.short);
    });
    // guards (deck + landing), 2" inside the edge
    const guardLine = (r) => {
      const g = 2 / 12; let a, b;
      if (r.horiz) { const y = r.pos + (r.side === 'front' ? -g : g); a = P(r.from, y); b = P(r.to, y); }
      else { const x = r.pos + (r.side === 'left' ? g : -g); a = P(x, r.from); b = P(x, r.to); }
      sv.line(a[0], a[1], b[0], b[1], LW.m, '6 2 1.5 2');
    };
    if (m.guardOn) m.guardRuns.forEach(guardLine);
    (m.landingRuns || []).forEach(guardLine);
    // stairs: flights (landing drawn as a zone above)
    if (st0) {
      const pr = st0.profile;
      let fStart = 0;
      const flights = [];
      pr.steps.forEach((x) => { if (x.landing) { flights.push([fStart, x.h0]); fStart = x.h1; } });
      flights.push([fStart, pr.total]);
      flights.forEach(([h0, h1]) => {
        if (h1 - h0 < 0.05) return;
        const a = PX(stairXY(st0, h0, 0)), b = PX(stairXY(st0, h1, st0.ws));
        sv.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), LW.m);
        pr.steps.filter((x) => !x.landing && x.h0 > h0 + 0.01 && x.h0 < h1 - 0.01).concat(pr.steps.filter((x) => !x.landing && Math.abs(x.h1 - h1) > 0.01 && x.h1 > h0 && x.h1 < h1)).forEach((x) => {
          [x.h0].forEach((hh) => { const p1 = PX(stairXY(st0, hh, 0)), p2 = PX(stairXY(st0, hh, st0.ws)); sv.line(p1[0], p1[1], p2[0], p2[1], LW.t); });
        });
        // DN arrow
        const p0 = PX(stairXY(st0, h0 + 0.25, st0.ws / 2)), p1 = PX(stairXY(st0, h1 - 0.25, st0.ws / 2));
        sv.line(p0[0], p0[1], p1[0], p1[1], LW.t); sv.arrowHead(p1[0], p1[1], Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 5);
        const cm = PX(stairXY(st0, (h0 + h1) / 2, st0.ws / 2));
        sv.rect(cm[0] - 12, cm[1] - 8, 24, 13, 0.01, { fill: '#fff', stroke: '#fff' });
        sv.text(cm[0], cm[1] + 3, 'DN', { size: 9, bold: true, anchor: 'middle' });
      });
    }
    // joist span arrow + label in the section zone
    const zs = m.sec;
    const ju = zs.joistsU;
    const uLab = ju[Math.max(1, Math.floor(ju.length * 0.3))] + m.spacing / 24;
    const va = 0.25 + t, vb = (zs.useLedger ? zs.beamsV[0] : zs.beamsV[Math.min(1, zs.beamsV.length - 1)]) - m.beam.wIn / 24 - 0.25;
    let jbox = null;
    if (vb - va > 1) {
      const ja = PX(zs.toXY(uLab, va)), jb = PX(zs.toXY(uLab, vb));
      sv.line(ja[0], ja[1], jb[0], jb[1], LW.t);
      sv.arrowHead(ja[0], ja[1], Math.atan2(ja[1] - jb[1], ja[0] - jb[0]), 5); sv.arrowHead(jb[0], jb[1], Math.atan2(jb[1] - ja[1], jb[0] - ja[0]), 5);
      const jm = [(ja[0] + jb[0]) / 2, (ja[1] + jb[1]) / 2];
      const jt = (st.framing.joist + ' SPF NO.2 P.T. @ ' + m.spacing + '" O.C.').toUpperCase();
      const jtw = DP.textW(jt, 8.5) + 8;
      jbox = m.perp ? { x0: jm[0] - 8, x1: jm[0] + 8, y0: jm[1] - jtw / 2, y1: jm[1] + jtw / 2 } : { x0: jm[0] - jtw / 2, x1: jm[0] + jtw / 2, y0: jm[1] - 8, y1: jm[1] + 7 };
      if (m.perp) { sv.rect(jm[0] - 7.5, jm[1] - jtw / 2, 15, jtw, 0.01, { fill: '#fff', stroke: '#fff' }); sv.text(jm[0] + 3, jm[1], jt, { size: 8.5, anchor: 'middle', rot: -90 }); }
      else { sv.rect(jm[0] - jtw / 2, jm[1] - 7.5, jtw, 14, 0.01, { fill: '#fff', stroke: '#fff' }); sv.text(jm[0], jm[1] + 3, jt, { size: 8.5, anchor: 'middle' }); }
    }
    // zone labels when more than one
    if (multi) m.zones.forEach((z) => {
      const uz = z === zs ? Math.max(0.6, Math.min(z.R - 0.6, (z.R * 0.5 > 2 ? z.R * 0.25 : z.R * 0.75))) : z.R * 0.5 + (z.joistsU.length > 2 ? m.spacing / 24 : 0);
      const c = PX(z.toXY(uz, z.S * 0.5 + (z === zs ? 2.5 : 0)));
      sv.rect(c[0] - 22, c[1] - 8.5, 44, 14, LW.t, { fill: '#fff' });
      sv.text(c[0], c[1] + 2.8, 'ZONE ' + z.id.slice(1), { size: 8, bold: true, anchor: 'middle' });
    });
    if (m.landing) {
      const r = m.landing.rect; const c = P(r.x + r.w / 2, r.y + r.h / 2);
      const lt = 'LANDING +' + fmt(m.landing.H);
      const w0 = DP.textW(lt, 8) + 8;
      sv.rect(c[0] - w0 / 2, c[1] - 8.5, w0, 14, LW.t, { fill: '#fff' });
      sv.text(c[0], c[1] + 2.8, lt, { size: 8, bold: true, anchor: 'middle' });
    }
    // DIMENSIONS
    const yb = P(0, E.y1)[1];
    const uniq = (arr) => arr.sort((a, b) => a - b).filter((v, i, a) => !i || v - a[i - 1] > 0.05);
    let row = yb + 28;
    const xr = P(E.x1, 0)[0];
    if (m.perp) {
      // posts along x (outer beam line of each zone)
      const xs = uniq([0, m.L, ...m.zones.flatMap((z) => z.postsU.map((u) => z.x0 + u))]);
      const pts = xs.map((x) => P(x, m.Wt));
      sv.chain(pts, 'x', row, xs.slice(1).map((x, i) => fmt(x - xs[i])));
      const below = (x) => [P(x, 0)[0], row + 3];
      if (st0 && st0.side === 'front') { const r0 = row; row += 24; sv.chain([0, st0.off, st0.off + st0.ws, m.L].map((x) => [P(x, 0)[0], r0 + 3]), 'x', row, [fmt(st0.off), fmt(st0.ws) + ' STAIR', fmt(m.L - st0.off - st0.ws)]); }
      if (multi) { const xz = uniq([0, m.L, ...m.zones.map((z) => z.x0)]); const pz = xz.map(below); row += 24; sv.chain(pz, 'x', row, xz.slice(1).map((x, i) => fmt(x - xz[i]))); }
      { const pa = below(0), pb = below(m.L); row += 24; sv.dimAt(pa, pb, 'x', row, fmt(m.L)); }
      // beam lines across: zone at the right edge on the right, zone at the left edge on the left (if different)
      const zR = m.zones[m.zones.length - 1];
      const vchain = (z, at, side) => { void 0;
        const xEdge = side > 0 ? z.x0 + z.Lx : z.x0;
        const vp = [P(xEdge, 0), ...z.beamsV.map((v) => P(xEdge, v)), P(xEdge, z.Wy)];
        sv.chain(vp, 'y', at, vp.slice(1).map((q, i) => fmt((q[1] - vp[i][1]) / s)));
        sv.dimAt(P(xEdge, 0), P(xEdge, z.Wy), 'y', at + side * 26, fmt(z.Wy));
      };
      vchain(zR, xr + 28, 1);
      if (leftChain) vchain(m.zones[0], P(E.x0, 0)[0] - 28, -1);
    } else {
      const zR = m.zones.reduce((a, z) => (z.x0 + z.Lx > a.x0 + a.Lx - 0.01 && z.Wy >= a.Wy ? z : a), m.zones[0]);
      const pts = [P(m.L, 0), ...zR.postsU.map((u) => P(m.L, zR.y0 + u)), P(m.L, zR.y0 + zR.R)];
      sv.chain(pts, 'y', xr + 28, pts.slice(1).map((q, i) => fmt((q[1] - pts[i][1]) / s)));
      sv.dimAt(P(m.L, 0), P(m.L, m.Wt), 'y', xr + 54, fmt(m.Wt));
      const xs = uniq([0, m.L, ...m.zones.flatMap((z) => z.beamsV.map((v) => z.x0 + v))]);
      sv.chain(xs.map((x) => P(x, m.Wt)), 'x', row, xs.slice(1).map((x, i) => fmt(x - xs[i])));
      const below = (x) => [P(x, 0)[0], row + 3];
      if (multi) { const xz = uniq([0, m.L, m.shape.x, m.shape.x + m.shape.w]); const pz = xz.map(below); row += 24; sv.chain(pz, 'x', row, xz.slice(1).map((x, i) => fmt(x - xz[i]))); }
      { const pa = below(0), pb = below(m.L); row += 24; sv.dimAt(pa, pb, 'x', row, fmt(m.L)); }
    }
    // CALLOUTS (left column)
    const left = [];
    const z0 = m.zones[0];
    const beamV = z0.beamsV[z0.beamsV.length - 1];
    const bp = PX(z0.toXY(Math.min(z0.R * 0.15 + 0.3, z0.R - 0.3), beamV));
    left.push({ x: bp[0], y: bp[1], lines: [m.beam.label + ' SPF NO.2 P.T. BUILT-UP', 'BEAM BELOW JOISTS (TYP.)'] });
    if (m.anyLedger) { const lz = m.zones.find((z) => z.useLedger); const lp = PX(lz.toXY(0.4, t / 2)); left.push({ x: lp[0], y: lp[1], lines: [st.framing.joist + ' P.T. LEDGER W/ ' + st.ledger.fastener, '2 ROWS STAGGERED @ ' + st.ledger.spacing + '" O.C. (VERIFY)'] }); }
    const ff = z0.footings[0]; const fp = P(ff.x, ff.y);
    const pk = DP.pileKind(fo);
    const nDeckF0 = m.zones.reduce((a, z) => a + z.footings.length, 0);
    left.push({ x: fp[0] - 3, y: fp[1] + 3, lines: [st.framing.post + ' P.T. POST ON ' + pk.short, 'F1 — SEE FOOTING SCHEDULE (TYP. ' + nDeckF0 + ')'] });
    const rp = PX(z0.toXY(Math.min(z0.R * 0.08 + 0.2, z0.R - 0.2), z0.S - t / 2));
    left.push({ x: rp[0], y: rp[1], lines: [st.framing.joist + ' P.T. RIM JOIST'] });
    if (m.guardOn) { const gr0 = m.guardRuns.find((r) => r.side === 'left') || m.guardRuns[0]; const gp = gr0.horiz ? P(gr0.from + 0.4, gr0.pos) : P(gr0.pos + 2 / 12, gr0.from + (gr0.to - gr0.from) * 0.6); left.push({ x: gp[0], y: gp[1], lines: [fin(m.guardHIn) + ' GUARD (' + (m.guardHIn === 42 ? '1070' : '900') + ' MM)', 'SEE ' + (meta.elevRef || 'A3')] }); }
    if (st0) {
      const c = PX(stairXY(st0, st0.profile.total * (st0.landing ? 0.12 : 0.7), st0.ws * 0.25));
      const ls = ['STAIR: ' + st0.nR + ' RISERS @ ' + fin(st0.riseIn), st0.nT + ' TREADS @ ' + fin(st0.runIn) + ', ' + fin(st0.ws * 12) + ' WIDE'];
      if (st0.landing) ls.push('LANDING ' + fmt(st0.ws) + ' × ' + fmt(st0.landing.depth) + ' AT +' + fmt(st0.landing.H));
      left.push({ x: c[0], y: c[1], lines: ls });
      if (st0.footings && st0.footings.length) {
        const sf = st0.footings[Math.floor(st0.footings.length / 2)];
        const mark = m.landing ? 'F3' : 'F2';
        left.push({ x: P(sf.x, sf.y)[0], y: P(sf.x, sf.y)[1], lines: [mark + ' STAIR FOOT PILES (' + st0.footings.length + ')'] });
      }
    }
    if (multi) { const zj = m.perp ? P(m.zones[1].x0, m.W * 0.35) : P(m.L * 0.3, m.W); left.push({ x: zj[0], y: zj[1], lines: ['DOUBLE JOIST / RIM AT ZONE JOINT,', 'THROUGH-BOLTED (VERIFY)'] }); }
    m.openings.forEach((o, i) => { if (i < 3) { const q = P(o.at + o.w * 0.3, -gapH - wallT / 2); left.push({ x: q[0], y: q[1], lines: [o.mark + ' ' + (o.type === 'door' ? 'EXISTING DOOR ' : 'BASEMENT WINDOW ') + fmt(o.w) + ' WIDE' + (o.bedroom ? ' (BEDROOM)' : '')] }); } });
    const maxW = Math.max(...left.map((it) => Math.max(...it.lines.map((l) => DP.textW(l.toUpperCase(), DP.TS.call))))) + 14;
    const xL = Math.max(Math.min(P(ext.x0, 0)[0] - 16 - (leftChain ? 60 : 0), R.x + LEFT + 40), A.x + 12 + maxW);
    callouts(sv, left, xL, -1, R.y + 30, R.y + R.h - 40, DP.TS.call, jbox ? [jbox] : []);
    sv.viewTitle(R.x, A.y + A.h - 30, '1', 'OVERHEAD PLAN: FRAMING & FOUNDATION', 'SCALE: ' + scaleLbl, meta.num);
    // RIGHT COLUMN
    const cx = A.x + A.w - colW - 6;
    sv.line(cx - 10, A.y, cx - 10, A.y + A.h, LW.t);
    let y = A.y + 24;
    sv.text(cx, y, 'Footing schedule', { size: DP.TS.head, bold: true }); y += 7;
    const fdesc = (fo.type === 'pad' ? pk.long : pk.long + ', ' + fmt(m.pierDepth) + ' MIN. BELOW GRADE');
    const nDeckF = m.zones.reduce((a, z) => a + z.footings.length, 0);
    const ftRows = [['F1', nDeckF, fdesc, Math.max(...m.zones.flatMap((z) => z.footings.map((f) => f.load))) + ' LB']];
    if (m.landing) ftRows.push(['F2', m.landing.footings.length, 'AS F1, UNDER STAIR LANDING', Math.max(...m.landing.footings.map((f) => f.load)) + ' LB']);
    if (st0 && st0.footings && st0.footings.length) {
      const mark = m.landing ? 'F3' : 'F2';
      ftRows.push([mark, st0.footings.length, 'AS F1, UNDER STAIR FOOT (2 PILES WHEN STAIR ABOUT 4\' WIDE, 3 WHEN LARGER; CUTOFF VERIFY)', Math.max(...st0.footings.map((f) => f.load)) + ' LB']);
    }
    const fW = colW - 4 - 32 - 28 - 62;
    const ftRows2 = []; ftRows.forEach((r) => { const ls = DP.wrapW(r[2], fW - 6, DP.TS.tbl); ls.forEach((l, k) => ftRows2.push(k ? ['', '', l, ''] : [r[0], r[1], l, r[3]])); });
    y = tableBlock(sv, cx, y, [{ w: 32, label: 'MARK' }, { w: 28, label: 'QTY' }, { w: fW, label: 'DESCRIPTION' }, { w: 62, label: 'MAX LOAD', align: 'end' }], ftRows2) + 4;
    DP.wrapW('LOAD = SUPPORTED JOIST LENGTH × SUPPORTED BEAM LENGTH × 50 PSF (CITY OF WINNIPEG DECKS GUIDE).', colW - 4, 7.5).forEach((l) => { y += 10; sv.text(cx, y, l, { size: 7.5 }); });
    y += 20;
    if (m.openings.length) {
      sv.text(cx, y, 'Openings in house wall at deck', { size: DP.TS.head, bold: true }); y += 7;
      const oNoteW = colW - 4 - 30 - 62 - 44 - 70;
      const oRows = [];
      m.openings.forEach((o) => {
        const note = o.type === 'window' ? (o.bedroom ? 'BEDROOM: EGRESS (VERIFY)' : 'NOT A BEDROOM') : (o.label || 'EXISTING');
        const ls = DP.wrapW(note, oNoteW - 6, DP.TS.tbl);
        ls.forEach((l, k) => oRows.push(k ? ['', '', '', '', l] : [o.mark, o.type === 'door' ? 'DOOR' : 'BSMT WINDOW', fmt(o.at), fmt(o.w) + ' × ' + fmt(o.h), l]));
      });
      y = tableBlock(sv, cx, y, [{ w: 30, label: 'MARK' }, { w: 62, label: 'TYPE' }, { w: 44, label: 'AT' }, { w: 70, label: 'W × H' }, { w: oNoteW, label: 'NOTE' }], oRows) + 6;
      sv.text(cx, y + 8, 'AT = DISTANCE FROM DECK LEFT END (MB ITS GUIDE 06).', { size: 7 }); y += 26;
    }
    const notes = [
      'ALL FRAMING LUMBER SPF NO.1/NO.2, PRESSURE TREATED. WOOD WITHIN 150 MM (6") OF GRADE OR EXPOSED TO WEATHER TO BE P.T.',
      'JOIST SPANS PER CITY TABLE 3 (1.9 KPA LIVE LOAD). JOISTS ' + st.framing.joist + ' @ ' + m.spacing + '" O.C., MAX CLEAR SPAN ' + fmt(m.clear) + '.',
      'BEAM ' + m.beam.label + ' PER CITY TABLE 2. NAIL PLIES WITH DOUBLE ROW OF 89 MM (3 1/2") NAILS @ 450 MM (18") O.C. MAX; BEAM JOINTS OVER SUPPORTS ONLY.',
      'POSTS ' + st.framing.post + ' P.T., CENTRED ON FOOTINGS, FASTENED TO BEAM WITH GALV. POST CAP.' + (m.braced ? ' POSTS OVER 1.5 M (5\'-0"): KNEE BRACES SHOWN ON ELEVATIONS (A2, A3), SIZE AND BOLTING TO BE CONFIRMED (VERIFY).' : ' POSTS OVER 1.5 M (5\'-0") TO BE BRACED.'),
      m.H > 2 + 1e-9 ? 'PERMIT DECK OVER 2\'-0": GARY TAYLOR HELICAL PILES, CERTIFIED INSTALLER, EXTENDING MIN. 1.8 M (6\'-0") BELOW GRADE. PILE CAPACITY TO BE CONFIRMED (VERIFY). PYLEX PILES ARE FOR DECKS 2\'-0" OR LOWER ONLY.' : (m.deepReq ? 'FOOTINGS TO EXTEND MIN. 1.8 M (6\'-0") BELOW GRADE (FROST). CONCRETE PIER DESIGN / SCREW PILE CAPACITY TO BE CONFIRMED (VERIFY).' : 'SURFACE PADS PER CITY TABLE 1; PROVIDE ACCESS FOR RE-LEVELLING (SCREWED DECKING).'),
      m.attached ? 'LEDGER: REMOVE SIDING AT LEDGER, INSTALL OVER HOUSE RIM JOIST WITH Z-FLASHING. FASTENER TYPE/SPACING TO BE CONFIRMED (VERIFY).' : 'FREESTANDING DECK: NOT FASTENED TO DWELLING.',
    ];
    if (multi) notes.push('L-SHAPED DECK FRAMED AS ' + m.zones.length + ' ZONES, EACH SIZED TO CITY TABLES 2 AND 3; DOUBLE JOIST/RIM AT THE JOINT, THROUGH-BOLTED (VERIFY).');
    if (m.landing) notes.push('STAIR LANDING FRAMED AS A SEPARATE PLATFORM ON ITS OWN POSTS AND FOOTINGS (F2); LANDING LENGTH TO BE CONFIRMED (VERIFY).');
    if (st0 && st0.footings && st0.footings.length) notes.push('STAIR FOOT PILES (' + (m.landing ? 'F3' : 'F2') + '): ' + st0.footings.length + ' PILES UNDER THE STAIR FOOT. TWO PILES WHEN THE STAIR IS ABOUT 4\'-0" WIDE; THREE WHEN LARGER (CUTOFF TO BE CONFIRMED, VERIFY).');
    notes.push('DECKING: ' + (st.decking.name || 'DECK BOARDS') + ', RUNS PERPENDICULAR TO JOISTS, FASTENED PER MANUFACTURER.', 'ALL CONNECTORS AND FASTENERS HOT-DIP GALVANIZED OR STAINLESS, RATED FOR P.T. LUMBER.', 'SCHEDULE CITY INSPECTION BEFORE COVERING ANY WORK.');
    if (st.found.engineered) notes.push('FOUNDATION DESIGNED BY AN ENGINEER: SEALED DESIGN TO BE SUBMITTED WITH THE PERMIT APPLICATION.');
    if (st.project.notes) notes.push(st.project.notes);
    H.notesBlock(sv, cx, y, colW - 4, 'Framing notes', notes, { size: 7.5 });
    return sv;
  }

  /* ================= ELEVATION (one view) ================= */
  // h axis: 'front' view -> x (along house); 'left' view -> y (away from house)
  function elevRange(m, st, view) {
    const gapH = m.attached ? 0 : DP.parseLen(st.deck.gap) || 1;
    const st0 = m.stair;
    let hMin = view === 'left' ? -gapH - 1.6 : -1.5, hMax = (view === 'front' ? m.L : m.Wt) + 1.5;
    if (st0) {
      const r = st0.rect;
      const a = view === 'front' ? r.x : r.y, b = view === 'front' ? r.x + r.w : r.y + r.h;
      const profile = (view === 'front' && st0.side !== 'front') || (view === 'left' && st0.side === 'front');
      hMin = Math.min(hMin, a - (profile ? 1.2 : 0)); hMax = Math.max(hMax, b + (profile ? 3.6 : 0));
    }
    return [hMin, hMax];
  }
  DP.elevRange = elevRange;
  function elevation(sv, m, st, view, ox, gy, s, zTop) {
    const X = (h) => ox + h * s, Z = (z) => gy - z * s;
    const front = view === 'front';
    const hOf = (q) => (front ? q.x : q.y);
    const len = front ? m.L : m.Wt;
    const t = 1.5 / 12;
    const gapH = m.attached ? 0 : DP.parseLen(st.deck.gap) || 1;
    const st0 = m.stair;
    const fo = st.found;
    const [hMin, hMax] = elevRange(m, st, view);
    const out = { callouts: [], hMin, hMax };
    // house
    const hTop = (zTop || m.H + 8.5) - 0.6;
    if (front) {
      sv.rect(X(-1.5), Z(hTop), (len + 3) * s, (hTop) * s, LW.t);
      sv.breakLine(X(-1.5) - 2, Z(hTop), X(len + 1.5) + 2, Z(hTop));
      sv.text(X(len / 2), Z(hTop) - 7, 'EXISTING HOUSE (BEYOND)', { size: 9, anchor: 'middle' });
      // openings on the house wall (seen beyond the deck)
      const zRimBot = m.topJoist - 9.25 / 12 - 1.5 / 12;
      m.openings.forEach((o, i) => {
        let z0, z1;
        if (o.type === 'door') { z0 = m.topDeck + 0.5 / 12; z1 = Math.min(hTop - 0.3, z0 + o.h); }
        else { z1 = zRimBot - 2 / 12; z0 = z1 - o.h; }
        const a = X(o.at), b = X(o.at + o.w);
        sv.rect(a, Z(z1), b - a, (z1 - z0) * s, LW.m, { fill: '#fff' });
        if (o.type === 'door') { const mid = (a + b) / 2; sv.line(mid, Z(z1), mid, Z(z0), LW.t); sv.rect(a + 3, Z(z1) + 3, mid - a - 6, (z1 - z0) * s - 6, LW.hair); sv.rect(mid + 3, Z(z1) + 3, b - mid - 6, (z1 - z0) * s - 6, LW.hair); }
        else { sv.line(a, Z((z0 + z1) / 2), b, Z((z0 + z1) / 2), LW.hair); if (z0 < 0) sv.text((a + b) / 2, Z(0) + 11, 'WELL', { size: 7, anchor: 'middle' }); }
        out.tags = out.tags || []; out.tags.push([(a + b) / 2, o.type === 'door' ? Z(z1) + 13 : Z((z0 + z1) / 2), o.mark]);
        out.callouts.push({ x: b, y: Z(z1 - (z1 - z0) * 0.3), lines: [o.mark + ' ' + (o.type === 'door' ? 'EXISTING DOOR TO DECK' : 'EXISTING BASEMENT WINDOW'), fmt(o.w) + ' × ' + fmt(o.h) + (o.type === 'window' ? (o.bedroom ? ', BEDROOM: EGRESS (VERIFY)' : ', NOT A BEDROOM') : '')] });
        void i;
      });
    } else {
      const hx0 = X(-gapH - 0.75), hx1 = X(-gapH);
      sv.rect(hx0, Z(hTop), hx1 - hx0, hTop * s, LW.m);
      sv.hatch(hx0, Z(hTop), hx1 - hx0, hTop * s, 4, LW.hair);
      sv.breakLine(hx0 - 8, Z(hTop), hx1 + 8, Z(hTop));
      sv.text(hx1 + 6, Z(hTop) + 14, 'EXISTING HOUSE', { size: 9 });
    }
    // grade + earth
    sv.line(X(hMin), Z(0), X(hMax), Z(0), LW.h);
    sv.earth(X(hMin), Z(0), X(hMax), 7);
    const allZ = m.zones.concat(m.landing ? [m.landing] : []);
    const zH = (z) => (z.id === 'LD' ? m.landing : m);
    // footings, posts, braces
    const seen = {};
    const pw = m.postIn / 12;
    const leg = 2; // knee brace leg (ft)
    allZ.forEach((z) => {
      const hz = zH(z);
      const beamsLong = front === z.perp;
      const pH = z.id === 'LD' ? m.landing.postH : m.postH;
      const midH = hOf(z.toXY(z.R / 2, z.S / 2));
      z.footings.forEach((f) => {
        const h = hOf(f), key = Math.round(h * 20) + ':' + z.id;
        if (seen[key]) return; seen[key] = 1;
        const r = ((fo.type === 'screwpile' ? 3.5 : fo.type === 'pad' ? 24 : +fo.dia) / 24);
        if (fo.type === 'pad') { sv.rect(X(h - r), Z(m.pierTop), 2 * r * s, m.pierTop * s, LW.m); }
        else {
          sv.rect(X(h - r), Z(0), 2 * r * s, m.pierDepth * s, LW.m, { dash: DASH.hidden });
          if (m.pierTop > 0) sv.rect(X(h - r), Z(m.pierTop), 2 * r * s, m.pierTop * s, LW.m, { fill: '#fff' });
          if (fo.type === 'screwpile') sv.pl([[X(h - 0.6), Z(-m.pierDepth + 0.3)], [X(h + 0.6), Z(-m.pierDepth + 0.1)]], LW.m, { dash: DASH.hidden });
        }
        sv.rect(X(h - pw / 2), Z(hz.beamBot), pw * s, (hz.beamBot - m.pierTop - 1 / 12) * s, LW.m, { fill: '#fff' });
        sv.rect(X(h - pw / 2 - 0.04), Z(m.pierTop + 1 / 12), (pw + 0.08) * s, (1 / 12) * s, LW.t, { fill: '#fff' });
        if (pH > m.braceAt) {
          // knee brace: in the beam line (to the beam) or across it (up to the joists)
          const zTopB = beamsLong ? hz.beamBot : hz.botJoist;
          const dir = beamsLong ? (h < midH ? 1 : -1) : (h < midH ? 1 : -1);
          const x0 = h + dir * pw / 2, x1 = h + dir * (pw / 2 + leg);
          const zb = zTopB - leg;
          const bw = (5.5 / 12) / Math.SQRT2;
          sv.pl([[X(x0), Z(zb)], [X(x1), Z(zTopB)], [X(x1 - dir * bw * 2), Z(zTopB)], [X(x0), Z(zb + bw * 2)]], LW.m, { close: true, fill: '#fff' });
          if (!out.brace) out.brace = [X((x0 + x1) / 2), Z(zb + leg / 2)];
        }
        if (!out.post && z.id !== 'LD') { out.post = [X(h + pw / 2), Z((hz.beamBot + m.pierTop) / 2 - (pH > m.braceAt ? 1 : 0))]; out.pier = [X(h + r), Z(-m.pierDepth * 0.6)]; }
      });
      // beams
      if (beamsLong) z.beamsV.forEach((v) => { const a = hOf(z.toXY(0, v)), b = hOf(z.toXY(z.R, v)); sv.rect(X(Math.min(a, b)), Z(hz.beamTop), Math.abs(b - a) * s, (m.beam.dIn / 12) * s, LW.m, { fill: '#fff' }); if (!out.beam && z.id !== 'LD') out.beam = [X(Math.min(a, b) + Math.abs(b - a) * 0.35), Z((hz.beamTop + hz.beamBot) / 2)]; });
      else z.beamsV.forEach((v) => { const h = hOf(z.toXY(0, v)); sv.rect(X(h - m.beam.wIn / 24), Z(hz.beamTop), (m.beam.wIn / 12) * s, (m.beam.dIn / 12) * s, LW.m, { fill: '#fff' }); if (!out.beam && z.id !== 'LD') out.beam = [X(h + m.beam.wIn / 24), Z((hz.beamTop + hz.beamBot) / 2)]; });
    });
    // rim / end joist band + decking for the deck (projection of the outline)
    sv.rect(X(0), Z(m.topJoist), len * s, (m.jdIn / 12) * s, LW.m, { fill: '#fff' });
    out.rim = [X(len * 0.6), Z((m.topJoist + m.botJoist) / 2)];
    if (!front && m.anyLedger) sv.rect(X(0), Z(m.topJoist), t * s, (m.jdIn / 12) * s, LW.m);
    sv.rect(X(-1 / 12), Z(m.topDeck), (len + 2 / 12) * s, (m.deckTIn / 12) * s, LW.m, { fill: '#fff' });
    out.deck = [X(len * 0.8), Z(m.topDeck - m.deckTIn / 24)];
    // L-shape: inside corner seen as a vertical line
    if (m.shape) {
      const hc = front ? (m.shape.side === 'right' ? m.L - m.shape.w : m.shape.w) : m.W;
      if (hc > 0.05 && hc < len - 0.05) sv.line(X(hc), Z(m.topDeck), X(hc), Z(m.botJoist), LW.m);
    }
    // landing platform
    if (m.landing) {
      const L0 = m.landing, r = L0.rect;
      const a = front ? r.x : r.y, b = front ? r.x + r.w : r.y + r.h;
      sv.rect(X(a), Z(L0.topJoist), (b - a) * s, (m.jdIn / 12) * s, LW.m, { fill: '#fff' });
      sv.rect(X(a - 1 / 12), Z(L0.topDeck), (b - a + 2 / 12) * s, (m.deckTIn / 12) * s, LW.m, { fill: '#fff' });
      out.landing = [X(b), Z(L0.topJoist - m.jdIn / 24)];
    }
    // guards
    const g = st.guard;
    const sec = 6; // typical pre-made guard section length (ft)
    const postW = g.type === 'wood' ? 3.5 / 12 : 2.5 / 12;
    function guardRun(h0, h1, zD, gH) {
      const n = Math.max(1, Math.ceil((h1 - h0) / sec - 1e-9));
      const step = (h1 - h0) / n;
      for (let i = 0; i <= n; i++) { const h = h0 + i * step; const hh = Math.min(Math.max(h - postW / 2, h0), h1 - postW); sv.rect(X(hh), Z(zD + gH), postW * s, gH * s, LW.m, { fill: '#fff' }); }
      sv.rect(X(h0), Z(zD + gH), (h1 - h0) * s, (1.5 / 12) * s, LW.m, { fill: '#fff' });
      sv.rect(X(h0), Z(zD + 3.5 / 12), (h1 - h0) * s, (1.5 / 12) * s, LW.m, { fill: '#fff' });
      for (let i = 0; i < n; i++) {
        const a = h0 + i * step + postW / 2, b = h0 + (i + 1) * step - postW / 2;
        if (g.type === 'glass') {
          sv.rect(X(a + 0.08), Z(zD + gH - 3 / 12), (b - a - 0.16) * s, (gH - 6.5 / 12) * s, LW.t);
          sv.line(X(a + 0.4), Z(zD + gH - 0.6), X(a + 0.9), Z(zD + gH - 0.3), LW.hair); sv.line(X(a + 0.4), Z(zD + gH - 0.9), X(a + 1.2), Z(zD + gH - 0.45), LW.hair);
        } else {
          const bs = g.type === 'wood' ? 5.25 / 12 : 4.5 / 12;
          for (let h = a + bs; h < b - 0.05; h += bs) sv.line(X(h), Z(zD + 5 / 12), X(h), Z(zD + gH - 1.5 / 12), LW.t);
        }
      }
    }
    const facing = front ? 'front' : 'left';
    const endOn = front ? ['left', 'right'] : ['front', 'back'];
    const drawRuns = (runs, zD, gH) => {
      runs.filter((r) => r.side === facing).forEach((r) => guardRun(r.from, r.to, zD, gH));
      runs.filter((r) => endOn.includes(r.side)).forEach((r) => { const h = r.side === 'right' || r.side === 'front' ? r.pos - postW : r.pos; sv.rect(X(Math.max(0, Math.min(h, len - postW))), Z(zD + gH), postW * s, gH * s, LW.m, { fill: '#fff' }); });
    };
    if (m.guardOn) {
      drawRuns(m.guardRuns, m.topDeck, m.guardHIn / 12);
      out.guard = [X(len * 0.42), Z(m.topDeck + (m.guardHIn / 12) * 0.6)];
    }
    if (m.landing && m.landingRuns.length) drawRuns(m.landingRuns, m.landing.topDeck, m.landing.guardHIn / 12);
    // stairs
    if (st0) {
      const faceOn = (front && st0.side === 'front') || (!front && st0.side === 'left');
      const profile = (front && st0.side !== 'front') || (!front && st0.side === 'front');
      const pr = st0.profile, rise = pr.rise;
      if (faceOn) {
        const a = st0.off, b = st0.off + st0.ws;
        sv.rect(X(a), Z(m.topDeck), (b - a) * s, m.topDeck * s, LW.t, { fill: '#fff' });
        pr.steps.forEach((x) => { if (x.landing) return; sv.rect(X(a), Z(x.z), (b - a) * s, (1 / 12) * s, LW.m, { fill: '#fff' }); sv.line(X(a), Z(x.z - 1 / 12), X(b), Z(x.z - 1 / 12), LW.t); });
        if (st0.landing) { const L0 = m.landing; sv.rect(X(a), Z(L0.topDeck), (b - a) * s, (m.deckTIn / 12 + m.jdIn / 12) * s, LW.m, { fill: '#fff' }); }
        sv.line(X(a + 0.12), Z(m.topDeck), X(a + 0.12), Z(0), LW.t); sv.line(X(b - 0.12), Z(m.topDeck), X(b - 0.12), Z(0), LW.t);
        if (m.guardOn && st0.guard) {
          [a, b - postW].forEach((h) => sv.rect(X(h), Z(rise + 3), postW * s, (rise + 3) * s, LW.m, { fill: '#fff' }));
          [a, b - postW].forEach((h) => sv.line(X(h + postW / 2), Z(rise + 3), X(h + postW / 2), Z(m.topDeck + 3), LW.m));
        }
        out.stair = [X(b), Z(m.H / 2)];
      } else if (profile) {
        const dir = st0.side === 'left' ? -1 : 1;
        const h0 = st0.edgePos;
        const pts = [[X(h0), Z(m.topDeck)]];
        pr.steps.forEach((x) => { pts.push([X(h0 + dir * x.h0), Z(x.z)]); pts.push([X(h0 + dir * x.h1), Z(x.z)]); });
        const hEnd = h0 + dir * pr.total;
        pts.push([X(hEnd), Z(0)]);
        sv.pl(pts, LW.m);
        pr.steps.forEach((x) => { if (!x.landing) sv.rect(X(h0 + dir * (dir > 0 ? x.h0 : x.h1)), Z(x.z), (x.h1 - x.h0) * s, (1 / 12) * s, LW.t); });
        // stringer undersides, per flight, parallel to the nosing line
        const slope = rise / pr.run, cosT = Math.cos(Math.atan(slope)), dV = (11.25 / 12) / cosT;
        const flights = []; let fs0 = { h: 0, z: m.H };
        pr.steps.forEach((x) => { if (x.landing) { flights.push([fs0, { h: x.h0, z: x.z }]); fs0 = { h: x.h1, z: x.z }; } });
        flights.push([fs0, { h: pr.total, z: 0 }]);
        flights.forEach(([A0, B0]) => {
          const zA = A0.z - dV; const zEndBase = B0.z === 0 ? 0 : B0.z - m.jdIn / 12;
          const hB = A0.h + Math.max(0.2, (zA - zEndBase) / slope);
          sv.line(X(h0 + dir * A0.h), Z(zA), X(h0 + dir * Math.min(hB, B0.h + (B0.z === 0 ? 0 : 0))), Z(Math.max(zEndBase, zA - slope * (Math.min(hB, B0.h) - A0.h))), LW.m);
          // guard over the flight
          if ((m.guardOn && st0.guard) || st0.handrail) {
            const up = 3;
            const nA = [A0.h, A0.z], nB = [B0.h - pr.run, B0.z + rise];
            if (nB[0] > nA[0] + 0.1) {
              const pA = [X(h0 + dir * nA[0]), Z(nA[1] + up)], pB = [X(h0 + dir * nB[0]), Z(nB[1] + up)];
              sv.line(pA[0], pA[1], pB[0], pB[1], LW.m); sv.line(pA[0], pA[1] + (1.5 / 12) * s, pB[0], pB[1] + (1.5 / 12) * s, LW.m);
              sv.rect(pB[0] - (dir < 0 ? postW * s : 0), pB[1], postW * s, (up) * s, LW.m);
              sv.line(X(h0 + dir * nA[0]), Z(nA[1] + 4 / 12), X(h0 + dir * nB[0]), Z(nB[1] + 4 / 12), LW.t);
              const bs = (g.type === 'wood' ? 5.25 : 4.5) / 12, Lr = nB[0] - nA[0];
              if (g.type !== 'glass') for (let hh = bs; hh < Lr - 0.05; hh += bs) { const zz = nA[1] + (nB[1] - nA[1]) * (hh / Lr); sv.line(X(h0 + dir * (nA[0] + hh)), Z(zz + 5.5 / 12), X(h0 + dir * (nA[0] + hh)), Z(zz + up - 0.02), LW.t); }
              if (!out.stairGuard) out.stairGuard = [(pA[0] + pB[0]) / 2, (pA[1] + pB[1]) / 2];
            }
          }
        });
        // stair foot piles (drawn below); no grade pad
        out.stair = [X(h0 + dir * 1.5 * pr.run), Z(m.H - 2 * rise)];
      }
    }
    // stair foot piles (stringers bear on pile caps at grade)
    const pierR = ((fo.type === 'screwpile' ? 3.5 : fo.type === 'pad' ? 24 : +fo.dia) / 24);
    const seenST = {};
    (m.stairFootings || []).forEach((f) => {
      const h = hOf(f), key = Math.round(h * 20) + ':ST';
      if (seenST[key]) return; seenST[key] = 1;
      if (fo.type === 'pad') { sv.rect(X(h - pierR), Z(m.pierTop), 2 * pierR * s, m.pierTop * s, LW.m); }
      else {
        sv.rect(X(h - pierR), Z(0), 2 * pierR * s, m.pierDepth * s, LW.m, { dash: DASH.hidden });
        if (m.pierTop > 0) sv.rect(X(h - pierR), Z(m.pierTop), 2 * pierR * s, m.pierTop * s, LW.m, { fill: '#fff' });
        if (fo.type === 'screwpile') sv.pl([[X(h - 0.6), Z(-m.pierDepth + 0.3)], [X(h + 0.6), Z(-m.pierDepth + 0.1)]], LW.m, { dash: DASH.hidden });
      }
      if (!out.stairPile) out.stairPile = [X(h + pierR), Z(-m.pierDepth * 0.35)];
    });
    // dims (left vertical)
    const dx = X(hMin) - 18;
    sv.dimAt([X(hMin), Z(0)], [X(hMin), Z(m.topDeck)], 'y', dx, fmt(m.H) + ' (' + DP.mm(m.H) + ')');
    if (m.guardOn) sv.dimAt([X(0), Z(m.topDeck)], [X(0), Z(m.topDeck + m.guardHIn / 12)], 'y', dx, fin(m.guardHIn) + ' (' + (m.guardHIn === 42 ? 1070 : 900) + ')');
    const hp = [...new Set(m.zones.flatMap((z) => z.footings.map((f) => Math.round(hOf(f) * 48) / 48)))].sort((a, b) => a - b);
    if (st.found.type !== 'pad') sv.dimAt([X(hp[0] - 0.5), Z(0)], [X(hp[0] - 0.5), Z(-m.pierDepth)], 'y', dx, fmt(m.pierDepth) + ' MIN.');
    // overall horizontal under footings
    const yDim = Z(-m.pierDepth) + 28;
    const pts = [[X(0), Z(0)], ...hp.map((h) => [X(h), Z(-m.pierDepth)]), [X(len), Z(0)]];
    sv.chain(pts, 'x', yDim, pts.slice(1).map((q, i) => fmt((q[0] - pts[i][0]) / s)));
    sv.dimAt([X(0), yDim + 3], [X(len), yDim + 3], 'x', yDim + 28, fmt(len));
    // opening tags last, so framing never covers them
    (out.tags || []).forEach(([x, y, txt]) => tag(sv, x, y, txt));
    // levels on the left, outside the height dimensions
    const lx = X(hMin) - 54;
    sv.level(lx, Z(m.topDeck), 'T/O DECK +' + fmt(m.H), -1);
    if (m.landing) sv.level(lx, Z(m.landing.topDeck), 'T/O LANDING +' + fmt(m.landing.H), -1);
    sv.level(lx, Z(0), 'GRADE ±0\'-0"', -1);
    if (fo.type !== 'pad') sv.level(lx, Z(-m.pierDepth), 'U/S FOOTING -' + fmt(m.pierDepth), -1);
    out.lx = X(hMax) + 12;
    return out;
  }

  /* ================= ELEVATION SHEETS (one view per sheet: front, side) ================= */
  function elevViewSheet(m, st, meta, v) {
    const sv = new Svg();
    const A = H.frame(sv, m, st, meta);
    const st0 = m.stair;
    const rg = elevRange(m, st, v);
    const doorH = Math.max(0, ...m.openings.filter((o) => o.type === 'door').map((o) => o.h));
    const zTop = Math.max(m.H + m.guardHIn / 12 + 2.6, m.H + doorH + 1.4), zBot = m.pierDepth + 0.3;
    const callW = 172, padL = 156, levW = 20;
    const avail = A.w - callW - padL - levW - 30;
    const availH = A.h - 40 - 120; // top margin, dims under footings and the view title
    const [scaleLbl, s] = DP.pickScale(rg[1] - rg[0], zTop + zBot, avail, availH);
    const ox = A.x + padL + (avail - (rg[1] - rg[0]) * s) / 2 - rg[0] * s;
    const top = A.y + 24 + Math.max(0, (availH - (zTop + zBot) * s) / 2);
    const gy = top + zTop * s;
    const o = elevation(sv, m, st, v, ox, gy, s, zTop);
    const colX = Math.max(o.lx + levW, A.x + A.w - callW - 6);
    const fo = st.found;
    const items = [];
    if (o.guard) items.push({ x: o.guard[0], y: o.guard[1], lines: [(st.guard.type === 'alum' ? 'ALUMINUM' : st.guard.type === 'glass' ? 'GLASS' : 'WOOD') + ' GUARD, ' + fin(m.guardHIn) + ' HIGH,', 'OPENINGS < 4" (100 MM)' + (st.guard.type !== 'wood' ? ', PER MAKER' : '')] });
    items.push({ x: o.deck[0], y: o.deck[1], lines: [st.decking.material === 'composite' ? 'COMPOSITE DECKING' : 'DECKING'] });
    items.push({ x: o.rim[0], y: o.rim[1], lines: [st.framing.joist + ' P.T. ' + ((v === 'front') === m.perp ? 'RIM' : 'END') + ' JOIST'] });
    if (o.beam) items.push({ x: o.beam[0], y: o.beam[1], lines: [m.beam.label + ' P.T. BEAM'] });
    if (o.post) items.push({ x: o.post[0], y: o.post[1], lines: [st.framing.post + ' P.T. POST ON GALV.', 'POST BASE'] });
    if (o.brace) items.push({ x: o.brace[0], y: o.brace[1], lines: ['2x6 P.T. KNEE BRACE @ 45°,', 'BOLTED, EACH POST OVER', '5\'-0" (SIZE VERIFY)'] });
    if (o.pier) items.push({ x: o.pier[0], y: o.pier[1], lines: [DP.pileKind(fo).short, fmt(m.pierDepth) + ' MIN. BELOW GRADE'] });
    if (o.landing && m.landing) items.push({ x: o.landing[0], y: o.landing[1], lines: ['STAIR LANDING ' + fmt(m.landing.rect.w) + ' × ' + fmt(m.landing.rect.h) + ',', 'OWN POSTS AND FOOTINGS (F2)'] });
    if (o.stairPile && m.stair && m.stair.footings && m.stair.footings.length) items.push({ x: o.stairPile[0], y: o.stairPile[1], lines: [(m.landing ? 'F3' : 'F2') + ' STAIR FOOT PILES (' + m.stair.footings.length + ')', DP.pileKind(fo).short] });
    if (o.stair && st0) {
      const lines = ['STAIR: ' + st0.nR + ' RISERS @ ' + fin(st0.riseIn), st0.nT + ' TREADS @ ' + fin(st0.runIn) + ', ' + fin(st0.ws * 12) + ' WIDE'];
      if (st0.guard) lines.push('STAIR GUARD 36" ABOVE NOSINGS');
      else if (st0.handrail) lines.push('HANDRAIL 865–1070 MM');
      items.push({ x: o.stair[0], y: o.stair[1], lines });
    }
    o.callouts.forEach((c) => items.push(c));
    items.forEach((it) => { it.lines = DP.wrapW(DP.joinLines(it.lines), A.x + A.w - colX - 22, DP.TS.call); });
    callouts(sv, items, colX, 1, A.y + 24, gy + m.pierDepth * s + 10, DP.TS.call, (o.tags || []).map(([tx, ty]) => ({ x0: tx - 10, x1: tx + 10, y0: ty - 10, y1: ty + 10 })), 10);
    const title = v === 'front' ? 'FRONT ELEVATION' : 'SIDE ELEVATION (LEFT)';
    sv.viewTitle(A.x + 18, A.y + A.h - 30, '1', title, 'SCALE: ' + scaleLbl, meta.num);
    // key notes for this view (heights the City asks for on elevations)
    const kn = ['DECK HEIGHT ' + fmt(m.H) + ' (' + DP.mm(m.H) + ' MM) ABOVE GRADE.', m.guardOn ? 'GUARD ' + fin(m.guardHIn) + ' HIGH ABOVE DECK SURFACE, ' + (st.guard.type === 'alum' ? 'ALUMINUM' : st.guard.type === 'glass' ? 'GLASS' : 'WOOD') + ' SYSTEM.' : 'NO GUARD REQUIRED (DECK 600 MM OR LESS ABOVE GRADE).'];
    if (st0) kn.push(st0.handrail || st0.guard ? 'STAIR ' + (st0.guard ? 'GUARD 36" ABOVE NOSINGS, GRASPABLE HANDRAIL 865–1070 MM.' : 'HANDRAIL 865–1070 MM ABOVE NOSINGS.') : 'STAIR 3 RISERS OR LESS: NO HANDRAIL REQUIRED.');
    if (v !== 'front' && m.openings.length) kn.push('DOORS / BASEMENT WINDOWS IN THE HOUSE WALL: SEE THE OPENINGS TABLE ON A1 AND THE VIEW ON A2.');
    const kx = A.x + 360; let ky = A.y + A.h - 44;
    kn.forEach((l) => { sv.text(kx, ky, l, { size: 8 }); ky += 11; });
    return sv;
  }

  DP.framingSheet = framingSheet; DP.elevViewSheet = elevViewSheet; DP.callouts = callouts;
})();
