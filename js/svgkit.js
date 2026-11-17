/* Minimal CAD-style SVG kit: line weights, dims with architectural ticks, leaders, hatches, title text. Units: PDF points. */
(function () {
  const DP = (window.DP = window.DP || {});
  // Line weights (pt at 11x17): object lines heavy, dimension/leader lines thin so the drawing reads first.
  const LW = { xh: 1.8, h: 1.2, m: 0.75, t: 0.3, hair: 0.2 };
  // Text sizes (pt at 11x17; 1 pt = 0.353 mm). Floor 7 pt (2.5 mm) anywhere, notes 8 pt, dimensions 10 pt (3.5 mm).
  const TS = { min: 7, tbl: 7.5, note: 8, call: 8, dim: 10, head: 10.5, vtitle: 16, level: 8.5 };
  const DASH = { hidden: '3 1.8', phantom: '14 3 3 3 3 3', center: '12 3 3 3', short: '2 2' };
  // Drafting font: osifont (ISO 3098 style, LGPL-3.0 with font exception), vendored in /vendor and embedded in the PDF.
  const FONT = 'osifont';
  const esc = (s) => String(s).replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/[→]/g, '->').replace(/…/g, '...').replace(/[“”]/g, '"').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const f = (n) => (Math.round(n * 100) / 100).toString();
  // Approximate Helvetica widths (em) for layout
  const CW = { ' ': 0.278, I: 0.278, J: 0.5, '1': 0.556, '.': 0.278, ',': 0.278, "'": 0.191, '"': 0.355, '-': 0.333, '/': 0.278, '(': 0.333, ')': 0.333, ':': 0.278, M: 0.833, W: 0.944, '@': 1.015, '×': 0.584, '%': 0.889 };
  const FW = (window.DP_FONT && window.DP_FONT.widths) || null;
  function textW(s, size, bold) {
    let w = 0;
    if (FW) for (const ch of String(s)) w += FW[ch] != null ? FW[ch] : 0.6;
    else for (const ch of String(s)) w += CW[ch] != null ? CW[ch] : /[A-Z]/.test(ch) ? 0.68 : /[0-9]/.test(ch) ? 0.556 : /[a-z]/.test(ch) ? 0.52 : 0.6;
    return w * size * (bold ? 1.04 : 1);
  }
  class Svg {
    constructor() { this.p = []; this.defs = []; this.clipN = 0; }
    add(s) { this.p.push(s); return this; }
    line(x1, y1, x2, y2, w = LW.m, dash) {
      return this.add(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="#000" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="butt"/>`);
    }
    pl(pts, w = LW.m, o = {}) {
      const d = pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' ');
      return this.add(`<${o.close ? 'polygon' : 'polyline'} points="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || '#000'}" stroke-width="${w}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linejoin="miter"/>`);
    }
    rect(x, y, w, h, lw = LW.m, o = {}) {
      if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; }
      return this.add(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${o.fill || 'none'}" stroke="${o.stroke || '#000'}" stroke-width="${lw}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
    }
    circle(cx, cy, r, lw = LW.m, o = {}) {
      return this.add(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${o.fill || 'none'}" stroke="${o.stroke || '#000'}" stroke-width="${lw}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
    }
    text(x, y, s, o = {}) {
      const size = Math.max(TS.min, o.size || TS.note);
      const tr = o.rot ? ` transform="rotate(${o.rot} ${f(x)} ${f(y)})"` : '';
      return this.add(`<text x="${f(x)}" y="${f(y)}" font-family="${FONT}" font-size="${size}" font-weight="normal" text-anchor="${o.anchor || 'start'}"${o.role ? ` data-role="${o.role}"` : ''} fill="#000"${o.bold ? ` stroke="#000" stroke-width="${f(size * 0.045)}" stroke-linejoin="round"` : ''}${tr}>${esc(o.raw ? s : String(s).toUpperCase())}</text>`);
    }
    lines(x, y, arr, o = {}) { const lh = Math.max(TS.min, o.size || TS.note) * (o.lh || 1.25); arr.forEach((s, i) => this.text(x, y + i * lh, s, o)); return this; }
    xbox(x, y, w, h, lw = LW.m) { this.rect(x, y, w, h, lw); this.line(x, y, x + w, y + h, LW.t); this.line(x + w, y, x, y + h, LW.t); return this; }
    // clip-free 45° hatch of an axis-aligned rect
    hatch(x, y, w, h, sp = 4, lw = LW.hair, dir = 1) {
      if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; }
      for (let c = -h; c < w; c += sp) {
        // line: from (x+c, y+h) going up-right at 45° (dir=1) or mirrored
        let x1 = c, y1 = h, x2 = c + h, y2 = 0;
        if (x1 < 0) { y1 = h + x1; x1 = 0; }
        if (x2 > w) { y2 = x2 - w; x2 = w; }
        if (y1 <= y2) continue;
        if (dir === 1) this.line(x + x1, y + y1, x + x2, y + y2, lw);
        else this.line(x + w - x1, y + y1, x + w - x2, y + y2, lw);
      }
      return this;
    }
    concrete(x, y, w, h, seed = 7) {
      if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; }
      let s = seed;
      const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      const n = Math.max(3, Math.round((w * h) / 70));
      for (let i = 0; i < n; i++) {
        const cx = x + 1.5 + rnd() * (w - 3), cy = y + 1.5 + rnd() * (h - 3);
        if (rnd() < 0.35) {
          const r = 1.2 + rnd() * 0.8, a = rnd() * Math.PI;
          const pts = [0, 1, 2].map((k) => [cx + r * Math.cos(a + (k * 2 * Math.PI) / 3), cy + r * Math.sin(a + (k * 2 * Math.PI) / 3)]);
          this.pl(pts, LW.hair, { close: true });
        } else this.circle(cx, cy, 0.25, LW.hair, { fill: '#000' });
      }
      return this;
    }
    // earth hatch: groups of 3 short diagonal lines below a grade line from x1..x2 at y
    earth(x1, y, x2, depth = 7, skip = []) {
      for (let x = x1 + 2; x < x2 - 6; x += 11) {
        if (skip.some(([a, b]) => x + 6 > a && x < b)) continue;
        for (let k = 0; k < 3; k++) this.line(x + k * 2, y + depth, x + k * 2 + depth * 0.7, y + 0.6, LW.hair);
      }
      return this;
    }
    arrowHead(x, y, ang, size = 5, fill = true) {
      const a1 = ang + Math.PI - 0.32, a2 = ang + Math.PI + 0.32;
      return this.pl([[x, y], [x + size * Math.cos(a1), y + size * Math.sin(a1)], [x + size * Math.cos(a2), y + size * Math.sin(a2)]], LW.t, { close: true, fill: fill ? '#000' : 'none' });
    }
    tick(x, y, ux, uy) { // 45° architectural tick
      const tx = (ux - uy) * 0.7071, ty = (uy + ux) * 0.7071, k = 3.2;
      return this.line(x - tx * k, y - ty * k, x + tx * k, y + ty * k, LW.h);
    }
    /* Dimension between paper points A,B; dimension line displaced by off=[dx,dy]. */
    dim(A, B, off, label, o = {}) {
      const size = o.size || TS.dim;
      const ol = Math.hypot(off[0], off[1]) || 1, on = [off[0] / ol, off[1] / ol];
      const gap = 2, ext = 3;
      const a = [A[0] + off[0], A[1] + off[1]], b = [B[0] + off[0], B[1] + off[1]];
      if (!o.noExt) {
        this.line(A[0] + on[0] * gap, A[1] + on[1] * gap, a[0] + on[0] * ext, a[1] + on[1] * ext, LW.t);
        this.line(B[0] + on[0] * gap, B[1] + on[1] * gap, b[0] + on[0] * ext, b[1] + on[1] * ext, LW.t);
      }
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.5) return this;
      let u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
      this.line(a[0] - u[0] * 3, a[1] - u[1] * 3, b[0] + u[0] * 3, b[1] + u[1] * 3, LW.t);
      this.tick(a[0], a[1], u[0], u[1]); this.tick(b[0], b[1], u[0], u[1]);
      // reading direction
      let ur = u.slice(); if (ur[0] < -1e-6 || (Math.abs(ur[0]) < 1e-6 && ur[1] > 0)) ur = [-ur[0], -ur[1]];
      const up = [ur[1], -ur[0]];
      const ang = (Math.atan2(ur[1], ur[0]) * 180) / Math.PI;
      const tw = textW(label, size);
      const tt = o.t != null ? o.t : 0.5;
      let mx = a[0] + (b[0] - a[0]) * tt, my = a[1] + (b[1] - a[1]) * tt;
      if (tw > len - 6) { // place outside: before the start (o.out==='start') or past the far end
        const fwd = ur[0] === u[0] && ur[1] === u[1];
        const startPt = fwd ? a : b, endPt = fwd ? b : a;
        if (o.out === 'start') { mx = startPt[0] - ur[0] * (tw / 2 + 7); my = startPt[1] - ur[1] * (tw / 2 + 7); }
        else if (o.out === 'above') { mx = (a[0] + b[0]) / 2 + up[0] * 9; my = (a[1] + b[1]) / 2 + up[1] * 9; }
        else if (o.out === 'below') { const k = size * 0.74 + 6; mx = (a[0] + b[0]) / 2 - up[0] * k; my = (a[1] + b[1]) / 2 - up[1] * k; }
        else { mx = endPt[0] + ur[0] * (tw / 2 + 7); my = endPt[1] + ur[1] * (tw / 2 + 7); }
      }
      const tx = mx + up[0] * 2.8, ty = my + up[1] * 2.8;
      return this.text(tx, ty, label, { size, anchor: 'middle', rot: Math.abs(ang) > 0.01 ? ang : 0, role: 'dim' });
    }
    /* Leader with arrow to target and multi-line note. side: 1 = text to right of elbow. */
    leader(tx, ty, ex, ey, lines, o = {}) {
      const size = o.size || TS.call, side = o.side || 1;
      const hx = ex + side * 8;
      const path = [[tx, ty], ...(o.via || []), [ex, ey], [hx, ey]];
      this.pl(path, LW.t);
      const nx = path[1][0], ny = path[1][1];
      this.arrowHead(tx, ty, Math.atan2(ty - ny, tx - nx), 5.5);
      if (o.dot) this.circle(tx, ty, 0.9, LW.t, { fill: '#000' });
      const lh = size * 1.22;
      lines.forEach((s, i) => this.text(hx + side * 2, ey + size * 0.35 + i * lh, s, { size, anchor: side === 1 ? 'start' : 'end' }));
      return this;
    }
    viewTitle(x, y, num, title, scale, ref) {
      const r = 14;
      this.circle(x + r, y, r, LW.h);
      this.line(x, y, x + 2 * r, y, LW.t);
      this.text(x + r, y - 3.5, num, { size: 11, bold: true, anchor: 'middle' });
      this.text(x + r, y + 10, ref || '', { size: 8, anchor: 'middle' });
      const tw = Math.max(textW(title, TS.vtitle, true), textW(scale, TS.head)) + 10;
      this.text(x + 2 * r + 6, y - 4, title, { size: TS.vtitle, bold: true });
      this.line(x + 2 * r, y, x + 2 * r + tw, y, LW.xh);
      this.text(x + 2 * r + 6, y + 12, scale, { size: TS.head });
      return this;
    }
    level(x, y, label, side = 1) { // elevation datum marker
      const s = 5.5;
      this.pl([[x, y], [x - s, y - s], [x + s, y - s]], LW.t, { close: true });
      this.pl([[x, y], [x - s, y - s], [x, y - s]], LW.t, { close: true, fill: '#000' });
      this.line(x, y, x + side * 60, y, LW.t);
      this.text(x + side * 9, y - 3, label, { size: TS.level, anchor: side === 1 ? 'start' : 'end' });
      return this;
    }
    breakLine(x1, y1, x2, y2) { // straight break with zig
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
      return this.pl([[x1 - ux * 4, y1 - uy * 4], [mx - ux * 4, my - uy * 4], [mx - ux * 1.5 + nx * 6, my - uy * 1.5 + ny * 6], [mx + ux * 1.5 - nx * 6, my + uy * 1.5 - ny * 6], [mx + ux * 4, my + uy * 4], [x2 + ux * 4, y2 + uy * 4]], LW.t);
    }
    image(x, y, w, h, href, o = {}) {
      const op = o.opacity != null ? ` opacity="${f(o.opacity)}"` : '';
      const role = o.role ? ` data-role="${o.role}"` : '';
      return this.add(`<image x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" preserveAspectRatio="xMidYMid meet" href="${href}" xlink:href="${href}"${op}${role}/>`);
    }
    toString(W, H) {
      return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${this.p.join('')}</svg>`;
    }
  }
  DP.Svg = Svg; DP.LW = LW; DP.TS = TS; DP.DASH = DASH; DP.textW = textW;
  DP.SCALES = [
    ['1" = 1\'-0"', 72], ['3/4" = 1\'-0"', 54], ['1/2" = 1\'-0"', 36], ['3/8" = 1\'-0"', 27], ['1/4" = 1\'-0"', 18],
    ['3/16" = 1\'-0"', 13.5], ['1/8" = 1\'-0"', 9], ['3/32" = 1\'-0"', 6.75], ['1/16" = 1\'-0"', 4.5], ['1/32" = 1\'-0"', 2.25],
  ];
  DP.pickScale = (wFt, hFt, wPt, hPt, list = DP.SCALES) => list.find(([, s]) => wFt * s <= wPt && hFt * s <= hPt) || list[list.length - 1];
  // site plans may also use engineering scales (1" = 10'/20'/30'), which sit between the small architectural ones
  DP.SITE_SCALES = [['1/8" = 1\'-0"', 9], ['1" = 10\'-0"', 7.2], ['3/32" = 1\'-0"', 6.75], ['1/16" = 1\'-0"', 4.5], ['1" = 20\'-0"', 3.6], ['1" = 30\'-0"', 2.4], ['1/32" = 1\'-0"', 2.25]];
})();
(function () {
  const DP = window.DP;
  /* Ortho dimension: A,B paper points; axis 'x' measures along x with the dim line at y=at; 'y' measures along y with line at x=at. */
  DP.Svg.prototype.dimAt = function (A, B, axis, at, label, o = {}) {
    let a, b, off;
    if (axis === 'x') { a = [A[0], at]; b = [B[0], at]; }
    else { a = [at, A[1]]; b = [at, B[1]]; }
    const L = DP.LW, gap = 2, ext = 3;
    [[A, a], [B, b]].forEach(([P, Q]) => {
      const dx = Q[0] - P[0], dy = Q[1] - P[1], l = Math.hypot(dx, dy);
      if (l < 0.5) return;
      const ux = dx / l, uy = dy / l;
      if (!o.noExt) this.line(P[0] + ux * gap, P[1] + uy * gap, Q[0] + ux * ext, Q[1] + uy * ext, L.t);
    });
    return this.dim(a, b, [0, 0], label, { ...o, noExt: true });
  };
  /* Paper box of a vertical dim's text (for leader routing): {x0,x1,y0,y1} */
  DP.dimTextBoxY = function (A, B, at, label, size = DP.TS.dim) { const tw = DP.textW(label, size), cy = (A[1] + B[1]) / 2; return { x0: at - 2.8 - size * 0.8, x1: at - 1, y0: cy - tw / 2 - 1.5, y1: cy + tw / 2 + 1.5 }; };
  /* Vertical dim whose text slides along the line to avoid the given segments [[x1,y1,x2,y2],...]. */
  DP.Svg.prototype.dimYFree = function (A, B, at, label, avoid, o = {}) {
    const size = o.size || DP.TS.dim, tw = DP.textW(label, size), y0 = Math.min(A[1], B[1]), y1 = Math.max(A[1], B[1]), len = y1 - y0;
    const hits = (t) => {
      const cy = A[1] + (B[1] - A[1]) * t, bx0 = at - 2.8 - size * 0.8, bx1 = at - 1, by0 = cy - tw / 2 - 2, by1 = cy + tw / 2 + 2;
      return (avoid || []).some(([x1, yA, x2, yB]) => {
        // segment vs box (sampled)
        for (let k = 0; k <= 40; k++) { const x = x1 + ((x2 - x1) * k) / 40, y = yA + ((yB - yA) * k) / 40; if (x >= bx0 && x <= bx1 && y >= by0 && y <= by1) return true; }
        return false;
      });
    };
    let best = 0.5;
    if (len > tw + 8) { const ts = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.12, 0.88].filter((t) => len * Math.min(t, 1 - t) > tw / 2 + 3); best = ts.find((t) => !hits(t)); if (best == null) best = 0.5; }
    return this.dimAt(A, B, 'y', at, label, { ...o, t: best });
  };
  /* chain of ortho dims through a list of points */
  DP.Svg.prototype.chain = function (pts, axis, at, labels, o = {}) {
    for (let i = 0; i < pts.length - 1; i++) {
      const d = axis === 'x' ? Math.abs(pts[i + 1][0] - pts[i][0]) : Math.abs(pts[i + 1][1] - pts[i][1]);
      if (d < 0.6) continue;
      const out = pts.length === 2 || o.ends ? (o.ends || o.mid || 'below') : i === 0 ? 'start' : i === pts.length - 2 ? 'end' : (o.mid || 'below');
      this.dimAt(pts[i], pts[i + 1], axis, at, labels[i], { out, ...o });
    }
    return this;
  };
})();
