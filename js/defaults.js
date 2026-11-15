/* Default project: the demo deck (12' x 16' attached, 4'-0" above grade, 2x8 @ 16" o.c., 3 sonotube piers, composite, one stair). */
(function () {
  const DP = (window.DP = window.DP || {});
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  DP.defaultState = function () {
    return {
      v: 1,
      project: {
        owner: 'Sample Owner', address: '123 Sample Street', city: 'Winnipeg, MB', legal: 'LOT __ BLOCK __ PLAN ____ (VERIFY)', permitNo: '',
        drawnBy: 'CARPENTER JOHNNY', firmLine: 'CARPENTRY CONTRACTOR', firmCity: 'WINNIPEG, MANITOBA', contact: '', checkedBy: '',
        date: today(), revisions: [{ no: '0', date: today(), desc: 'ISSUED FOR CONSTRUCTION' }], notes: '',
      },
      site: {
        street: 'SAMPLE STREET', lane: true, laneName: 'REAR LANE', faces: 'N', lotW: "50'", lotD: "120'",
        houseW: "36'", houseD: "30'", frontSB: "25'", leftSB: "7'", sideReq: '', overhead: false, overheadNote: '',
        garage: { on: true, w: "22'", d: "22'", rear: "3'", right: "3'" }, dimSource: '',
      },
      deck: { attach: 'attached', L: "16'", W: "12'", H: "4'", offset: "10'", gap: "1'", shape: 'rect', extSide: 'right', extW: "8'", extD: "6'" },
      // doors / basement windows on the house wall behind the deck; "at" = from the deck's left end to the opening's left edge
      openings: [
        { type: 'door', at: "5'", w: "6'", h: '6\'-8"', bedroom: false, label: 'PATIO DOOR' },
        { type: 'window', at: "12'", w: "3'", h: "2'", bedroom: false, label: 'BASEMENT WINDOW' },
      ],
      framing: { joist: '2x8', spacing: 16, dir: 'perp', cant: "1'", beam: '3-2x8', post: '6x6', postMax: "8'", beamOH: "1'" },
      found: { type: 'sonotube', dia: 10, depth: "6'", above: '6"', padT: 6, engineered: false, pileMaker: '', pileModel: '' },
      ledger: { fastener: 'FastenMaster LedgerLOK 5"', spacing: 16 },
      decking: { material: 'composite', thk: 1, boardW: 5.5, gap: 0.1875, name: 'Composite deck boards 1" x 5 1/2"' },
      guard: { type: 'alum', always: false },
      stairs: { on: true, side: 'front', offset: "2'", width: '3\'-6"', run: 10.5, targetRise: 7.5, landing: { on: false, depth: "4'", frac: 0.5 } },
      assume: { bagYield: 0.5, waste: 10, boxQty: 350, railSection: 6, stringerSp: 16 },
      prices: {},
      // Labour is an editable estimate, not a quote. Hour factors are placeholder rules of thumb for Johnny to tune; no rate is assumed.
      labour: { on: true, rate: '', hours: '', factors: { area: 0.2, footing: 2, guard: 0.4, riser: 1.5, landing: 6 } },
      photos: [], sketch: null,
      out: { paper: 'tabloid', budget: true, checks: true },
    };
  };
})();
