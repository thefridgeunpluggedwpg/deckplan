/* Anti-theft estimate-copy watermark: large centered logo plus a diagonal tiled
   stamp across the whole sheet, drawn on top of the linework (multiply). */
(function () {
  const DP = (window.DP = window.DP || {});
  DP.ESTIMATE = {
    angle: 32,           // degrees, diagonal tiles
    bigFrac: 0.85,       // logo width as a fraction of sheet width
    bigOpacity: 0.12,
    tileOpMin: 0.08,
    tileOpMax: 0.20,
    tileLogoW: 88,       // pt, before per-tile size jitter
    sizeJitter: 0.16,
    rotJitter: 6,        // extra degrees around the 32° field
    pitchX: 380,
    pitchY: 165,
    dpi: 175,            // flattened estimate PDF
    jpegQuality: 0.82,
  };
  DP.isEstimateCopy = function (st) { return !st || !st.out || st.out.copy !== 'final'; };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function seedRng(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return function () { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return h / 4294967296; };
  }
  function jobLine(st) {
    const p = (st && st.project) || {};
    const addr = String(p.address || 'NO ADDRESS').toUpperCase();
    const date = p.date ? String(p.date) : '';
    return (addr + (date ? '  ·  ' + date : '')).trim();
  }

  DP.drawEstimateWatermark = function (sv, st) {
    const href = DP.WATERMARK_DATA;
    if (!href) return;
    const E = DP.ESTIMATE, W = (DP.SHEET && DP.SHEET.W) || 1224, H = (DP.SHEET && DP.SHEET.H) || 792;
    const aspect = DP.WATERMARK_ASPECT || 1.37014925;
    const cx = W / 2, cy = H / 2, f = (n) => (Math.round(n * 1000) / 1000).toString();
    const p = (st && st.project) || {};
    const rnd = seedRng(String(p.address || '') + '|' + String(p.date || '') + '|v1.3.5');
    const headline = 'PROPRIETARY INFORMATION - ESTIMATE COPY - NOT FOR CONSTRUCTION - CARPENTER JOHNNY';
    const job = jobLine(st);
    sv.add('<g data-role="estimate-watermark" pointer-events="none" style="mix-blend-mode:multiply">');
    sv.add('<defs><image id="dp-cj-logo" width="100" height="' + f(100 / aspect) + '" href="' + href + '" xlink:href="' + href + '" preserveAspectRatio="xMidYMid meet"/></defs>');
    const useLogo = (x, y, width, opacity, rot) => {
      const s = width / 100;
      sv.add('<use href="#dp-cj-logo" xlink:href="#dp-cj-logo" transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(rot) + ') scale(' + f(s) + ') translate(-50 ' + f(-50 / aspect) + ')" opacity="' + f(opacity) + '"/>');
    };
    useLogo(cx, cy, W * E.bigFrac, E.bigOpacity, 0);
    sv.add('<g data-role="estimate-tiles" transform="rotate(-' + E.angle + ' ' + f(cx) + ' ' + f(cy) + ')">');
    const span = Math.hypot(W, H) + 400;
    const cols = Math.ceil(span / E.pitchX), rows = Math.ceil(span / E.pitchY);
    for (let r = -rows; r <= rows; r++) {
      for (let c = -cols; c <= cols; c++) {
        const x = cx + c * E.pitchX, y = cy + r * E.pitchY;
        const op = E.tileOpMin + rnd() * (E.tileOpMax - E.tileOpMin);
        const w = E.tileLogoW * (1 - E.sizeJitter + rnd() * E.sizeJitter * 2);
        const rot = (rnd() - 0.5) * 2 * E.rotJitter;
        useLogo(x, y - 22, w, op, rot);
        const top = E.tileOpMin + rnd() * (E.tileOpMax - E.tileOpMin);
        const sz = 7.5 + rnd() * 2;
        const trot = (rnd() - 0.5) * E.rotJitter;
        sv.add('<text x="' + f(x) + '" y="' + f(y + 24) + '" font-family="osifont" font-size="' + f(sz) + '" text-anchor="middle" fill="#000" opacity="' + f(top) + '" transform="rotate(' + f(trot) + ' ' + f(x) + ' ' + f(y + 24) + ')">' + esc(headline) + '</text>');
        sv.add('<text x="' + f(x) + '" y="' + f(y + 36) + '" font-family="osifont" font-size="' + f(sz * 0.92) + '" text-anchor="middle" fill="#000" opacity="' + f(top) + '" transform="rotate(' + f(trot) + ' ' + f(x) + ' ' + f(y + 36) + ')">' + esc(job) + '</text>');
      }
    }
    sv.add('</g>');
    // Large faded band through the big logo, on top of the tiles and the linework.
    const bannerY = cy + 118, bannerSize = 64, bannerOp = 0.15;
    sv.add('<g data-role="estimate-proprietary">');
    sv.add('<rect x="36" y="' + f(bannerY - 40) + '" width="' + f(W - 72) + '" height="58" fill="#000" opacity="0.05"/>');
    sv.add('<text x="' + f(cx) + '" y="' + f(bannerY) + '" font-family="osifont" font-size="' + bannerSize + '" text-anchor="middle" fill="#000" opacity="' + bannerOp + '" stroke="#000" stroke-width="' + f(bannerSize * 0.045) + '" stroke-linejoin="round">PROPRIETARY INFORMATION</text>');
    sv.add('</g></g>');
  };
})();
