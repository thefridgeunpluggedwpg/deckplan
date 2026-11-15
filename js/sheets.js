/* Sheet builders: A1 site plan, A2 framing/foundation plan, A3 elevations, A4 section, A5 materials, A6 photos. */
(function () {
  const DP = window.DP;
  const { Svg, LW, DASH } = DP;
  const fmt = DP.fmt, fin = DP.fmtIn;
  const SHEET = { W: 1224, H: 792 }; // 11x17 landscape in points
  const TB = 236;
  const B = { x0: 36, y0: 18, x1: SHEET.W - 18, y1: SHEET.H - 18 };
  DP.SHEET = SHEET;
  const TS = DP.TS;

  function frame(sv, m, st, meta) {
    sv.rect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, LW.xh);
    sv.rect(B.x0 + 4, B.y0 + 4, B.x1 - B.x0 - 8, B.y1 - B.y0 - 8, LW.t);
    const x = B.x1 - 4 - TB, y0 = B.y0 + 4, y1 = B.y1 - 4, w = TB;
    sv.line(x, y0, x, y1, LW.h);
    const p = st.project;
    const lbl = (tx, ty, s) => sv.text(tx, ty, s, { size: 7 });
    const tw = w - 12;
    let y = y0;
    // firm
    sv.text(x + w / 2, y + 24, p.drawnBy || 'CARPENTER JOHNNY', { size: 16, bold: true, anchor: 'middle' });
    sv.text(x + w / 2, y + 37, p.firmLine || 'CARPENTRY CONTRACTOR', { size: 8, anchor: 'middle' });
    sv.text(x + w / 2, y + 48, p.firmCity || 'WINNIPEG, MANITOBA', { size: 8, anchor: 'middle' });
    if (p.contact) sv.text(x + w / 2, y + 59, p.contact, { size: 7.5, anchor: 'middle', raw: true });
    y += 66; sv.line(x, y, x + w, y, LW.m);
    // project
    lbl(x + 6, y + 10, 'PROJECT');
    sv.text(x + 6, y + 23, (m.attached ? 'PROPOSED ATTACHED DECK' : 'PROPOSED FREESTANDING DECK'), { size: 10.5, bold: true });
    sv.text(x + 6, y + 34, (m.shape ? 'L-SHAPED ' + fmt(m.L) + ' × ' + fmt(m.Wt) : fmt(m.L) + ' × ' + fmt(m.W)) + ', ' + fmt(m.H) + ' ABOVE GRADE', { size: 8 });
    let yy = y + 47;
    lbl(x + 6, yy, 'ADDRESS'); yy += 11;
    const addr = wrapW(p.address || '—', tw, 9).slice(0, 2).concat([p.city || 'WINNIPEG, MB']);
    addr.forEach((s2) => { sv.text(x + 6, yy, s2, { size: 9 }); yy += 10.5; });
    yy += 2; lbl(x + 6, yy, 'LEGAL DESCRIPTION'); yy += 11;
    wrapW(p.legal || 'VERIFY', tw, 8.5).slice(0, 2).forEach((s2) => { sv.text(x + 6, yy, s2, { size: 8.5 }); yy += 10; });
    yy += 2; lbl(x + 6, yy, 'OWNER'); sv.text(x + 6, yy + 11, p.owner || '—', { size: 9 }); yy += 23;
    if (p.permitNo) { lbl(x + 6, yy, 'PERMIT / APPLICATION NO.'); sv.text(x + 6, yy + 11, p.permitNo, { size: 9 }); yy += 23; }
    y = yy - 4; sv.line(x, y, x + w, y, LW.m);
    // revisions (City IB 2026-010-B: issue table must read "Issued for Construction")
    lbl(x + 6, y + 10, 'ISSUES / REVISIONS');
    y += 14; sv.line(x, y, x + w, y, LW.t);
    const c1 = x + 24, c2 = x + 82;
    sv.text(x + 12, y + 9.5, 'NO.', { size: 7, anchor: 'middle', bold: true }); sv.text((c1 + c2) / 2, y + 9.5, 'DATE', { size: 7, anchor: 'middle', bold: true }); sv.text(c2 + 4, y + 9.5, 'DESCRIPTION', { size: 7, bold: true });
    y += 13; sv.line(x, y, x + w, y, LW.t);
    const revs = (p.revisions || []).slice(0, 4);
    const yRevTop = y;
    for (let i = 0; i < 4; i++) {
      const r = revs[i];
      if (r) { sv.text(x + 12, y + 10.5, r.no, { size: 8, anchor: 'middle' }); sv.text((c1 + c2) / 2, y + 10.5, r.date, { size: 8, anchor: 'middle' }); sv.text(c2 + 4, y + 10.5, fitW(r.desc, x + w - c2 - 8, 7.5), { size: 7.5 }); }
      y += 14; sv.line(x, y, x + w, y, LW.hair);
    }
    sv.line(c1, yRevTop - 13, c1, y, LW.t); sv.line(c2, yRevTop - 13, c2, y, LW.t);
    sv.line(x, y, x + w, y, LW.m);
    // general notes
    lbl(x + 6, y + 10, 'GENERAL');
    const gen = [
      'DESIGN BASIS: CITY OF WINNIPEG "DECKS" CONSTRUCTION INFORMATION (OCT. 2025) AND MANITOBA BUILDING CODE, PART 9. DESIGN LIVE LOAD 1.9 KPA (40 PSF).',
      'ALL WORK TO CONFORM TO THE MANITOBA BUILDING CODE AND WINNIPEG BUILDING BY-LAW.',
      'VERIFY ALL DIMENSIONS ON SITE. DO NOT SCALE DRAWINGS.',
      'ITEMS MARKED "VERIFY" TO BE CONFIRMED BEFORE CONSTRUCTION.',
    ];
    if (meta.reduced) gen.push('REDUCED PRINT ON 8.5×11: SCALES SHOWN ARE FOR 11×17.');
    let gy = y + 22;
    gen.forEach((g) => { wrapW(g, tw, 7.5).forEach((l) => { sv.text(x + 6, gy, l, { size: 7.5 }); gy += 9.3; }); gy += 2.5; });
    // bottom blocks
    const yb = y1 - 70, yt = yb - 50, yd = yt - 64;
    sv.line(x, yd, x + w, yd, LW.m);
    const rows = [['DRAWN BY', p.drawnBy || 'CARPENTER JOHNNY'], ['CHECKED BY', p.checkedBy || '—'], ['DATE', p.date || ''], ['SCALE', meta.scale || 'AS NOTED']];
    rows.forEach(([k, v], i) => { const ry = yd + i * 16; lbl(x + 6, ry + 11, k); sv.text(x + 70, ry + 11.5, fitW(v, w - 76, 9), { size: 9 }); if (i) sv.line(x, ry, x + w, ry, LW.hair); });
    sv.line(x + 64, yd, x + 64, yt, LW.hair);
    sv.line(x, yt, x + w, yt, LW.m);
    lbl(x + 6, yt + 10, 'SHEET TITLE');
    wrapW(meta.title, tw, 12).slice(0, 2).forEach((s2, i) => sv.text(x + 6, yt + 25 + i * 14, s2, { size: 12, bold: true }));
    sv.line(x, yb, x + w, yb, LW.h);
    lbl(x + 6, yb + 10, 'SHEET');
    sv.text(x + w / 2, yb + 50, meta.num, { size: 34, bold: true, anchor: 'middle' });
    sv.text(x + w - 6, yb + 63, meta.of, { size: 8, anchor: 'end' });
    return { x: B.x0 + 4, y: B.y0 + 4, w: x - B.x0 - 4, h: y1 - y0 };
  }
  function wrap(s, n) {
    const words = String(s).split(/\s+/); const out = []; let cur = '';
    words.forEach((w) => { if ((cur + ' ' + w).trim().length > n) { if (cur) out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) out.push(cur); return out.length ? out : [''];
  }
  /* wrap by measured width (upper-case, drafting font) */
  function wrapW(s, width, size) {
    const words = String(s).split(/\s+/); const out = []; let cur = '';
    words.forEach((w) => { const t = (cur + ' ' + w).trim(); if (DP.textW(t.toUpperCase(), size) > width && cur) { out.push(cur); cur = w; } else cur = t; });
    if (cur) out.push(cur); return out.length ? out : [''];
  }
  function fitW(s, width, size) { s = String(s); while (s.length > 3 && DP.textW(s.toUpperCase(), size) > width) s = s.slice(0, -3) + '..'; return s; }
  DP.wrapW = wrapW; DP.fitW = fitW;
  DP.joinLines = (ls) => ls.reduce((a, l) => (a ? a + (/[,;:]$/.test(a) ? ' ' : '; ') : '') + l, '');
  DP.wrap = wrap;
  function notesBlock(sv, x, y, w, title, items, o = {}) {
    const size = o.size || TS.note, lh = size * 1.28;
    sv.text(x, y, title, { size: TS.head, bold: true }); sv.line(x, y + 3, x + DP.textW(title.toUpperCase(), TS.head, true), y + 3, LW.m);
    let yy = y + 16;
    items.forEach((it, i) => {
      const ls = wrapW(it, w - 16, size);
      if (o.bullets !== false) sv.text(x, yy, (i + 1) + '.', { size });
      ls.forEach((s2, k) => sv.text(x + 14, yy + k * lh, s2, { size }));
      yy += ls.length * lh + 3;
    });
    return yy;
  }
  function northArrow(sv, cx, cy, deg) {
    const r = 18;
    sv.circle(cx, cy, r, LW.m);
    const a = ((deg - 90) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), px = -s, py = c;
    const tip = [cx + c * (r + 6), cy + s * (r + 6)], tail = [cx - c * r * 0.8, cy - s * r * 0.8];
    sv.pl([tip, [cx + px * 6, cy + py * 6], tail], LW.t, { close: true, fill: '#000' });
    sv.pl([tip, [cx - px * 6, cy - py * 6], tail], LW.t, { close: true });
    sv.text(cx + c * (r + 14), cy + s * (r + 16) + 4.5, 'N', { size: 13, bold: true, anchor: 'middle' });
  }

  /* ================= A1 SITE PLAN ================= */
  function siteSheet(m, st, meta) {
    const sv = new Svg();
    const A = frame(sv, m, st, meta);
    // two layouts: notes in a right column, or in a strip under the plan; use whichever draws the lot bigger
    const colW = 230, STRIP = 196;
    const lay = (strip) => {
      const R = strip ? { x: A.x + 20, y: A.y + 20, w: A.w - 40, h: A.h - 70 - STRIP } : { x: A.x + 20, y: A.y + 20, w: A.w - colW - 34, h: A.h - 70 };
      const s1 = DP.pickScale(m.lotD, m.lotW, R.w - 124, R.h - 150, DP.SITE_SCALES), s2 = DP.pickScale(m.lotW, m.lotD, R.w - 124, R.h - 150, DP.SITE_SCALES);
      return { R, strip, land: s1[1] >= s2[1], sc: s1[1] >= s2[1] ? s1 : s2 };
    };
    const LA = lay(false), LB = lay(true);
    const L0 = LB.sc[1] > LA.sc[1] ? LB : LA;
    const R = L0.R, land = L0.land, [scaleLbl, s] = L0.sc;
    const dw = (land ? m.lotD : m.lotW) * s, dh = (land ? m.lotW : m.lotD) * s;
    const ox = R.x + (R.w - dw) / 2 + 10, oy = R.y + (R.h - dh) / 2 + 5;
    const P = (w, d) => (land ? [ox + d * s, oy + w * s] : [ox + (m.lotW - w) * s, oy + d * s]);
    const rectS = (w0, d0, ww, dd) => { const a = P(w0, d0), b = P(w0 + ww, d0 + dd); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])]; };
    const ALONG_D = land ? 'x' : 'y', ALONG_W = land ? 'y' : 'x';
    const site = st.site;
    // property lines
    const c = [P(0, 0), P(m.lotW, 0), P(m.lotW, m.lotD), P(0, m.lotD)];
    sv.pl([...c, c[0]], LW.h, { dash: DASH.phantom });
    // street + lane labels
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const fm = mid(c[0], c[1]), rm = mid(c[2], c[3]);
    const streetOff = 46;
    if (land) {
      sv.text(fm[0] - streetOff, fm[1], (site.street || 'STREET') , { size: 12, bold: true, anchor: 'middle', rot: -90 });
      sv.text(fm[0] - streetOff + 13, fm[1], '(FRONT)', { size: 8, anchor: 'middle', rot: -90 });
      sv.text(rm[0] + streetOff + 4, rm[1], site.lane ? (site.laneName || 'REAR LANE') : 'REAR', { size: 11, bold: true, anchor: 'middle', rot: -90 });
    } else {
      sv.text(fm[0], fm[1] - streetOff, site.street || 'STREET', { size: 12, bold: true, anchor: 'middle' });
      sv.text(fm[0], fm[1] - streetOff + 12, '(FRONT)', { size: 8, anchor: 'middle' });
      sv.text(rm[0], rm[1] + streetOff + 8, site.lane ? (site.laneName || 'REAR LANE') : 'REAR', { size: 11, bold: true, anchor: 'middle' });
    }
    // house
    const hr = rectS(m.hLeft, m.hFront, m.hW, m.hD);
    sv.hatch(hr[0], hr[1], hr[2], hr[3], 5, LW.hair);
    sv.rect(hr[0], hr[1], hr[2], hr[3], LW.h);
    const hc = [hr[0] + hr[2] / 2, hr[1] + hr[3] / 2];
    const hbw = Math.max(DP.textW('EXISTING DWELLING', 9, true), DP.textW(fmt(m.hW) + ' × ' + fmt(m.hD), 8)) + 10;
    if (m.openings.length) { const room = (land ? hr[2] : hr[3]) - 34; const k = Math.max(0, Math.min(17, (land ? hr[2] : hr[3]) / 2 - hbw / 2 - 2)); if (room > hbw) { if (land) hc[0] -= k; else hc[1] += k; } }
    sv.rect(hc[0] - hbw / 2, hc[1] - 16, hbw, 31, LW.t, { fill: '#fff' });
    sv.text(hc[0], hc[1] - 4, 'EXISTING DWELLING', { size: 9, bold: true, anchor: 'middle' });
    sv.text(hc[0], hc[1] + 9, fmt(m.hW) + ' × ' + fmt(m.hD), { size: 8, anchor: 'middle' });
    // garage
    if (site.garage && site.garage.on) {
      const g = site.garage, gw = DP.parseLen(g.w), gd = DP.parseLen(g.d), gr = DP.parseLen(g.rear), gs = DP.parseLen(g.right);
      const gx = m.lotW - gs - gw, gy = m.lotD - gr - gd;
      const r = rectS(gx, gy, gw, gd);
      sv.hatch(r[0], r[1], r[2], r[3], 5, LW.hair); sv.rect(r[0], r[1], r[2], r[3], LW.m);
      const gc = [r[0] + r[2] / 2, r[1] + r[3] / 2];
      const gbw = DP.textW('EXISTING GARAGE', 8.5, true) + 10;
      sv.rect(gc[0] - gbw / 2, gc[1] - 16, gbw, 31, LW.t, { fill: '#fff' });
      sv.text(gc[0], gc[1] - 4, 'EXISTING GARAGE', { size: 8.5, bold: true, anchor: 'middle' });
      sv.text(gc[0], gc[1] + 9, fmt(gw) + ' × ' + fmt(gd), { size: 8, anchor: 'middle' });
    }
    // deck (site coords: w = x along house from house left corner; d = y away from house)
    const dx = m.deckSite.x, dy = m.deckSite.y;
    m.zones.forEach((z) => { const r = rectS(dx + z.x0, dy + z.y0, z.Lx, z.Wy); sv.rect(r[0], r[1], r[2], r[3], 0.01, { fill: '#d4d4d4', stroke: '#d4d4d4' }); sv.hatch(r[0], r[1], r[2], r[3], 3, LW.hair, -1); });
    sv.pl(m.poly.map(([x, y]) => P(dx + x, dy + y)).concat([P(dx + m.poly[0][0], dy + m.poly[0][1])]), LW.xh);
    // stairs and landing
    if (m.stair) {
      const st0 = m.stair, pr = st0.profile;
      const q = (h, a) => { const p0 = DP.stairXY(st0, h, a); return P(dx + p0.x, dy + p0.y); };
      const ra = q(0, 0), rb = q(pr.total, st0.ws);
      sv.rect(Math.min(ra[0], rb[0]), Math.min(ra[1], rb[1]), Math.abs(rb[0] - ra[0]), Math.abs(rb[1] - ra[1]), LW.m, { fill: '#fff' });
      pr.steps.forEach((x) => { if (x.h0 > 0.01) { const a = q(x.h0, 0), b = q(x.h0, st0.ws); sv.line(a[0], a[1], b[0], b[1], LW.hair); } });
      if (m.landing) { const r = m.landing.rect; const lr = rectS(dx + r.x, dy + r.y, r.w, r.h); sv.rect(lr[0], lr[1], lr[2], lr[3], LW.m, { fill: '#d4d4d4' }); }
    }
    // doors / basement windows on the dwelling's rear wall (tags inside the house)
    m.openings.forEach((o) => {
      const a = P(dx + o.at, dy - (m.attached ? 0 : DP.parseLen(st.deck.gap) || 0)), b = P(dx + o.at + o.w, dy - (m.attached ? 0 : DP.parseLen(st.deck.gap) || 0));
      sv.line(a[0], a[1], b[0], b[1], 2.2);
      const c = P(dx + o.at + o.w / 2, dy - (m.attached ? 0 : DP.parseLen(st.deck.gap) || 0) - 16 / s);
      DP.tag(sv, c[0], c[1], o.mark, 8);
    });
    // deck label: inside if it fits, else in the rear yard with a leader near the deck corner
    const dr = rectS(dx, dy, m.L, m.W);
    const dc = [dr[0] + dr[2] / 2, dr[1] + dr[3] / 2];
    const lblLines = ['PROPOSED DECK', (m.shape ? 'L-SHAPED, ' : fmt(m.L) + ' × ' + fmt(m.Wt) + ', ') + Math.round(m.area) + ' SQ.FT', fmt(m.H) + ' ABOVE GRADE'];
    if (dr[2] > 116 && dr[3] > 36 && !m.shape) {
      sv.rect(dc[0] - 54, dc[1] - 16, 108, 31, LW.t, { fill: '#fff' });
      sv.text(dc[0], dc[1] - 3.5, 'PROPOSED DECK', { size: 9, bold: true, anchor: 'middle' });
      sv.text(dc[0], dc[1] + 9, Math.round(m.area) + ' SQ.FT', { size: 8, anchor: 'middle' });
    } else {
      const off4 = 18 / s;
      const yFar = m.Wt + (m.stair && m.stair.side === 'front' ? m.stair.totalRun : 0);
      const stairLeft = m.stair && m.stair.side === 'front' && m.stair.off < m.L / 2;
      const tw0 = stairLeft ? m.L - 1.2 : 1.2;
      const edgeY = m.poly.filter((p0) => Math.abs(p0[0] - (stairLeft ? m.L : 0)) < 1e-6).reduce((a, p0) => Math.max(a, p0[1]), 0);
      const tp = P(dx + tw0, dy + Math.max(0.6, edgeY - 1.2));
      // obstacles in paper space: buildings; keep the note inside the lot
      const obs = [hr];
      if (m.stair) { const r0 = m.stair.rect; obs.push(rectS(dx + r0.x, dy + r0.y, r0.w, r0.h)); }
      if (m.landing) { const r0 = m.landing.rect; obs.push(rectS(dx + r0.x, dy + r0.y, r0.w, r0.h)); }
      if (site.garage && site.garage.on) { const g = site.garage; const gw = DP.parseLen(g.w), gd = DP.parseLen(g.d); obs.push(rectS(m.lotW - DP.parseLen(g.right) - gw, m.lotD - DP.parseLen(g.rear) - gd, gw, gd)); }
      const lot = rectS(0, 0, m.lotW, m.lotD);
      const fits = (lp, lines) => { const w = Math.max(...lines.map((l) => DP.textW(l, 8.5))) + 14; const b = [lp[0], lp[1] - 8, w, lines.length * 10.4 + 5]; const inLot = b[0] >= lot[0] && b[1] >= lot[1] && b[0] + b[2] <= lot[0] + lot[2] && b[1] + b[3] <= lot[1] + lot[3]; return inLot && obs.every((o) => b[0] > o[0] + o[2] + 2 || b[0] + b[2] < o[0] - 2 || b[1] > o[1] + o[3] + 2 || b[1] + b[3] < o[1] - 2); };
      const shortLines = ['PROPOSED DECK', Math.round(m.area) + ' SQ.FT, ' + fmt(m.H) + ' HIGH'];
      const dyL = dy + yFar + off4 + 0.2, a4 = land ? P(0, dyL)[0] : P(0, dyL)[1];
      const chainTxt = [[0, dx, 'a = ' + fmt(m.sideL)], [dx, dx + m.L, fmt(m.L)], [dx + m.L, m.lotW, 'a = ' + fmt(m.sideR)]].map(([w0, w1, t]) => {
        const c = P((w0 + w1) / 2, dyL), tw = DP.textW(t, DP.TS.dim) + 4;
        return land ? [a4 - 14, c[1] - tw / 2, 27, tw] : [c[0] - tw / 2, a4 - 14, tw, 27];
      });
      [[dx + m.L, dy], [dx + m.L, dy + m.Wt]].forEach(([w, d]) => { const p0 = P(w, d), p1 = P(m.lotW + 2, d); obs.push([Math.min(p0[0], p1[0]) - 1.5, Math.min(p0[1], p1[1]) - 1.5, Math.abs(p1[0] - p0[0]) + 3, Math.abs(p1[1] - p0[1]) + 3]); });
      [dx, dx + m.L].forEach((w) => { const p0 = P(w, dy + m.Wt), p1 = P(w, dyL); obs.push([Math.min(p0[0], p1[0]) - 1.5, Math.min(p0[1], p1[1]) - 1.5, Math.abs(p1[0] - p0[0]) + 3, Math.abs(p1[1] - p0[1]) + 3]); });
      const hit = (q, o) => q[0] > o[0] && q[0] < o[0] + o[2] && q[1] > o[1] && q[1] < o[1] + o[3];
      const boxOf = (c, lines) => [c[0] + 8, c[1] - 9, Math.max(...lines.map((l) => DP.textW(l, 8.5))) + 6, lines.length * 10.4 + 5];
      const clearSeg = (p0, p1, own) => { for (let t = 0; t <= 0.97; t += 0.02) { const q = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]; if (obs.some((o) => hit(q, o)) || chainTxt.some((o) => hit(q, o)) || hit(q, own)) return false; } return true; };
      const sep = (b, o, g = 0) => b[0] > o[0] + o[2] + g || b[0] + b[2] < o[0] - g || b[1] > o[1] + o[3] + g || b[1] + b[3] < o[1] - g;
      const ok = (c, lines) => { const bx = boxOf(c, lines); return fits(c, lines) && clearSeg(tp, c, bx) && chainTxt.every((o) => sep(bx, o)) && sep(bx, dr, 2); };
      let lp = null, use = lblLines;
      outer: for (const lines of [lblLines, shortLines]) for (const gap of [10, 22, 36]) for (const dw of [0, -2.5, -5, 2.5]) {
        const c = P(dx + tw0 + (stairLeft ? -dw : dw), dy + yFar + off4 + 0.2 + gap / s);
        if (ok(c, lines)) { lp = c; use = lines; break outer; }
      }
      if (!lp) {
        // wider search over the rear yard: nearest spot where the note fits and its leader misses buildings and the a-chain text
        let best = null;
        for (const lines of [shortLines, lblLines]) {
          for (let w = 0.5; w < m.lotW; w += 1) for (let d = dy; d < m.lotD; d += 1) {
            const c = P(w, d);
            if (!ok(c, lines)) continue;
            const dd = Math.hypot(c[0] - tp[0], c[1] - tp[1]);
            if (dd > 22 && (!best || dd < best.dd)) best = { c, lines, dd };
          }
          if (best) break;
        }
        if (best) { lp = best.c; use = best.lines; } else { lp = P(dx + tw0, dy + yFar + off4 + 0.2 + 10 / s); use = shortLines; }
      }
      lblLines.length = 0; lblLines.push(...use);
      sv.leader(tp[0], tp[1], lp[0], lp[1], lblLines, { side: 1, size: 8.5 });
    }
    // overhead lines note marker
    // DIMENSIONS
    const f2 = (v) => fmt(v);
    const pPL0 = P(m.lotW, 0), pPL1 = P(m.lotW, m.lotD);
    // (1) chain along d outside viewer-right PL
    const atR = land ? Math.max(pPL0[1], pPL1[1]) + 22 : Math.min(pPL0[0], pPL1[0]) - 26;
    const yH0 = m.hFront, yH1 = m.hFront + m.hD, yD0 = dy, yD1 = dy + m.Wt;
    const chainPts = [P(m.lotW, 0), P(m.hLeft + m.hW, yH0), P(m.hLeft + m.hW, yH1)];
    const chainLb = ['FRONT YARD ' + f2(yH0), f2(m.hD)];
    if (yD0 - yH1 > 0.05) { chainPts.push(P(dx + m.L, yD0)); chainLb.push(f2(yD0 - yH1)); }
    chainPts.push(P(dx + m.L, yD1)); chainLb.push(f2(m.Wt));
    chainPts.push(P(m.lotW, m.lotD)); chainLb.push('b = ' + f2(m.rearD));
    sv.chain(chainPts, ALONG_D, atR, chainLb);
    // overall depth further out
    sv.dimAt(P(m.lotW, 0), P(m.lotW, m.lotD), ALONG_D, land ? atR + 24 : atR - 24, f2(m.lotD) + ' LOT DEPTH');
    // (2) house rear yard c along viewer-left
    const atL = land ? Math.min(P(0, 0)[1], P(0, m.lotD)[1]) - 26 : Math.max(P(0, 0)[0], P(0, m.lotD)[0]) + 26;
    sv.dimAt(P(m.hLeft, yH1), P(0, m.lotD), ALONG_D, atL, 'c = ' + f2(m.houseRear) + ' REAR YARD');
    // (3) lot width at rear
    const pr0 = P(0, m.lotD), pr1 = P(m.lotW, m.lotD);
    const atRear = land ? pr0[0] + 26 : pr0[1] + 26;
    sv.dimAt(pr0, pr1, ALONG_W, atRear, f2(m.lotW) + ' LOT WIDTH');
    // (4) deck side setbacks chain, just past the deck's outer edge
    const off4 = 18 / s; // ft equivalent
    const dyLine = yD1 + (m.stair && m.stair.side === 'front' ? m.stair.totalRun : 0) + off4 + 0.2;
    const pA = P(0, dyLine), pB = P(dx, yD1), pC = P(dx + m.L, yD1), pD = P(m.lotW, dyLine);
    const at4 = land ? P(0, dyLine)[0] : P(0, dyLine)[1];
    sv.chain([pA, pB, pC, pD], ALONG_W, at4, ['a = ' + f2(m.sideL), f2(m.L), 'a = ' + f2(m.sideR)], { noExt: false });
    // (5) house side setbacks in front of house
    const atH = land ? P(0, m.hFront)[0] - 18 : P(0, m.hFront)[1] - 18;
    sv.chain([P(0, m.hFront), P(m.hLeft, m.hFront), P(m.hLeft + m.hW, m.hFront), P(m.lotW, m.hFront)], ALONG_W, atH, [f2(m.hLeft), f2(m.hW), f2(m.lotW - m.hLeft - m.hW)]);
    // north arrow
    const faces = { N: 0, E: 90, S: 180, W: 270 }[site.faces || 'N'];
    const frontAng = land ? 270 : 0;
    northArrow(sv, R.x + R.w - 14, R.y + 26, frontAng - faces);
    sv.viewTitle(R.x, A.y + A.h - 30, '1', 'SITE PLAN', 'SCALE: ' + scaleLbl, 'A1');
    // notes, site data, legend: right column or bottom strip
    const notes = [
      'CIVIC ADDRESS: ' + (st.project.address || '—') + ', ' + (st.project.city || 'WINNIPEG, MB') + '.',
      'LEGAL DESCRIPTION: ' + (st.project.legal || 'VERIFY') + '.',
      'LOT AND BUILDING DIMENSIONS ' + (site.dimSource || 'FROM OWNER / SITE MEASURE — VERIFY AGAINST SURVEY (BUILDING LOCATION CERTIFICATE)') + '.',
      'DECK SURFACE IS ' + fmt(m.H) + ' (' + DP.mm(m.H) + ' MM) ABOVE GRADE. DECKS HIGHER THAN 600 MM (2\'-0") MUST PROVIDE THE SAME SETBACKS AS THE DWELLING; REQUIRED REAR SETBACK 7.5 M (25\'-0"). NO DECK PERMITTED IN FRONT YARD.',
      site.overhead ? 'OVERHEAD POWER CONDUCTORS PRESENT: MAINTAIN 3.5 M (11\'-6") MIN. CLEARANCE ABOVE DECK SURFACE. ' + (site.overheadNote || 'LOCATION TO BE SHOWN (VERIFY).') : 'NO OVERHEAD POWER CONDUCTORS OVER DECK AREA (VERIFY ON SITE).',
      'a = DECK TO SIDE PROPERTY LINES, b = DECK TO REAR PROPERTY LINE, c = REAR YARD (DWELLING TO REAR PROPERTY LINE).',
      'NO HOT TUB / SPA PROPOSED ON THIS DECK.',
    ];
    const lotA = m.lotW * m.lotD, houseA = m.hW * m.hD;
    const data = [['LOT AREA', Math.round(lotA) + ' SQ.FT (' + (lotA * 0.0929).toFixed(1) + ' M²)'], ['DWELLING FOOTPRINT', Math.round(houseA) + ' SQ.FT'], ['PROPOSED DECK', Math.round(m.area) + ' SQ.FT (' + (m.area * 0.0929).toFixed(1) + ' M²)'], ...(m.landing ? [['STAIR LANDING', Math.round(m.landingArea) + ' SQ.FT AT +' + fmt(m.landing.H)]] : []), ['DECK HEIGHT', fmt(m.H) + ' (' + DP.mm(m.H) + ' MM)'], ['REAR YARD AFTER DECK', fmt(m.rearD) + ' (' + (m.rearD * 0.3048).toFixed(2) + ' M)']];
    const dataBlock = (cx, ny, w) => {
      sv.text(cx, ny, 'Site data', { size: TS.head, bold: true }); sv.line(cx, ny + 3, cx + DP.textW('SITE DATA', TS.head, true), ny + 3, LW.m); ny += 16;
      data.forEach(([k, v]) => { sv.text(cx, ny, k, { size: 8 }); sv.text(cx + w, ny, v, { size: 8, anchor: 'end' }); sv.line(cx, ny + 3.5, cx + w, ny + 3.5, LW.hair); ny += 13.5; });
      return ny;
    };
    const legend = (cx, ny) => {
      sv.text(cx, ny, 'Legend', { size: TS.head, bold: true }); sv.line(cx, ny + 3, cx + DP.textW('LEGEND', TS.head, true), ny + 3, LW.m); ny += 18;
      sv.line(cx, ny - 3, cx + 40, ny - 3, LW.h, DASH.phantom); sv.text(cx + 48, ny, 'PROPERTY LINE', { size: 8 }); ny += 17;
      sv.hatch(cx, ny - 9, 40, 11, 4, LW.hair); sv.rect(cx, ny - 9, 40, 11, LW.m); sv.text(cx + 48, ny, 'EXISTING BUILDING', { size: 8 }); ny += 17;
      sv.rect(cx, ny - 9, 40, 11, LW.h, { fill: '#d4d4d4' }); sv.hatch(cx, ny - 9, 40, 11, 3, LW.hair, -1); sv.text(cx + 48, ny, 'PROPOSED DECK', { size: 8 });
      return ny;
    };
    if (!L0.strip) {
      const cx = A.x + A.w - colW - 8;
      sv.line(cx - 10, A.y, cx - 10, A.y + A.h, LW.t);
      let ny = notesBlock(sv, cx, A.y + 22, colW, 'Site plan notes', notes) + 10;
      ny = dataBlock(cx, ny, colW - 6) + 12;
      legend(cx, ny);
    } else {
      const y0 = A.y + A.h - 62 - STRIP;
      sv.line(A.x, y0, A.x + A.w, y0, LW.t);
      const w1 = 430, w2 = 250;
      notesBlock(sv, A.x + 20, y0 + 20, w1, 'Site plan notes', notes);
      dataBlock(A.x + 20 + w1 + 24, y0 + 20, w2);
      legend(A.x + 20 + w1 + 24 + w2 + 30, y0 + 20);
    }
    return sv;
  }

  DP.sheetHelpers = { frame, wrap, wrapW, fitW, notesBlock, northArrow, B, TB };
  DP.siteSheet = siteSheet;
})();
