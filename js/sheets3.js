(function () {
  const DP = window.DP;
  const { Svg, LW, DASH } = DP;
  const fmt = DP.fmt, fin = DP.fmtIn;
  const H = DP.sheetHelpers;

  /* Sheet list: blueprint drawings only, exactly three views, one per page.
     A1 overhead (plan view: framing & foundation), A2 front elevation, A3 side elevation. */
  DP.buildSheets = function (m, st, o = {}) {
    const list = [
      ['A1', 'OVERHEAD PLAN: FRAMING & FOUNDATION', DP.framingSheet, 'Overhead plan'],
      ['A2', 'FRONT ELEVATION', (m2, st2, me) => DP.elevViewSheet(m2, st2, me, 'front'), 'Front elevation'],
      ['A3', 'SIDE ELEVATION', (m2, st2, me) => DP.elevViewSheet(m2, st2, me, 'left'), 'Side elevation'],
    ];
    return list.map(([num, title, fn, short], i) => {
      const meta = { num, title, of: (i + 1) + ' OF ' + list.length, scale: 'AS NOTED', reduced: o.reduced, elevRef: 'A2' };
      let svg;
      try { svg = fn(m, st, meta).toString(DP.SHEET.W, DP.SHEET.H); }
      catch (e) { console.error(e); const sv = new Svg(); H.frame(sv, m, st, meta); sv.text(80, 120, 'COULD NOT DRAW THIS SHEET: ' + e.message, { size: 10 }); svg = sv.toString(DP.SHEET.W, DP.SHEET.H); }
      return { num, title, short, svg };
    });
  };
})();
