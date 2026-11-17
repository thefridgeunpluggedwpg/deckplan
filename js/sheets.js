/* Shared sheet pieces: border, title block, text wrapping, notes block. The three sheets live in sheets2.js (overhead plan, front and side elevations). */
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
  DP.sheetHelpers = { frame, wrap, wrapW, fitW, notesBlock, B, TB };
})();
