/* DeckPlan UI: binds the form to state, renders live sheets, exports PDF via jsPDF + svg2pdf (vendored). */
(function () {
  const DP = window.DP;
  const KEY = 'deckplan.project.v1';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  let st = load();
  let model = null, sheets = [], cur = 'A0', timer = 0;

  function load() {
    try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.v === 1) return merge(DP.defaultState(), j); } catch (e) { /* ignore */ }
    return DP.defaultState();
  }
  function merge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else a[k] = b[k]; } return a; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); }
    catch (e) { /* storage full or blocked: the Save button still works */ }
  }
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), st);
  function set(path, val) { const ks = path.split('.'); let o = st; ks.slice(0, -1).forEach((k) => { if (o[k] == null) o[k] = /^\d+$/.test(k) ? [] : {}; o = o[k]; }); o[ks[ks.length - 1]] = val; }

  function openList() {
    const ops = st.openings || (st.openings = []);
    $('#openList').innerHTML = ops.map((o, i) => `<fieldset class="opening"><legend>${o.type === 'door' ? 'Door' : 'Window'} ${i + 1}</legend>
      <div class="row2">
        <label>Type<select data-k="openings.${i}.type"><option value="door">Door to deck</option><option value="window">Basement window</option></select></label>
        <label>Name on drawings<input data-k="openings.${i}.label"></label>
        <label>From deck's left end<input data-k="openings.${i}.at" data-len></label>
        <label>Width<input data-k="openings.${i}.w" data-len></label>
        <label>Height<input data-k="openings.${i}.h" data-len></label>
        ${o.type === 'window' ? `<label class="check"><input type="checkbox" data-k="openings.${i}.bedroom" data-type="check"> Bedroom window</label>` : '<span></span>'}
      </div>
      <button type="button" class="ghost danger small" data-rmop="${i}">Remove</button></fieldset>`).join('') || '<p class="note">No doors or windows entered.</p>';
  }
  $('#btnAddDoor').addEventListener('click', () => { st.openings.push({ type: 'door', at: "2'", w: "3'", h: '6\'-8"', bedroom: false, label: 'DOOR' }); openList(); fillForm(); render(); });
  $('#btnAddWin').addEventListener('click', () => { st.openings.push({ type: 'window', at: "2'", w: "3'", h: "2'", bedroom: false, label: 'BASEMENT WINDOW' }); openList(); fillForm(); render(); });
  $('#openList').addEventListener('click', (e) => { const r = e.target.dataset.rmop; if (r == null) return; st.openings.splice(+r, 1); openList(); fillForm(); render(); });

  function fillForm() {
    if (!$('#openList').children.length || $$('#openList fieldset').length !== (st.openings || []).length) openList();
    $$('[data-k]').forEach((el) => {
      const v = get(el.dataset.k);
      if (el.dataset.type === 'check') el.checked = !!v;
      else el.value = v == null ? '' : String(v);
      if (el.hasAttribute('data-len')) showParsed(el);
    });
    syncVisibility();
  }
  function showParsed(el) {
    let s = el.nextElementSibling;
    if (!s || !s.classList.contains('parsed')) { s = document.createElement('span'); s.className = 'parsed'; el.after(s); }
    const raw = el.value.trim();
    if (!raw) { s.textContent = ''; el.classList.remove('bad'); return; }
    const ft = DP.parseLen(raw);
    if (!isFinite(ft)) { s.textContent = 'Not a length. Try 12\' or 12\'-6" or 3800mm'; el.classList.add('bad'); }
    else { s.textContent = '= ' + DP.fmt(ft) + '  ·  ' + DP.mm(ft) + ' mm'; el.classList.remove('bad'); }
  }
  function syncVisibility() {
    $$('.free-only').forEach((e) => (e.style.display = st.deck.attach === 'free' ? '' : 'none'));
    $$('.l-only').forEach((e) => (e.style.display = st.deck.shape === 'L' ? '' : 'none'));
    $$('.landing-only').forEach((e) => (e.style.display = st.stairs.on && st.stairs.landing && st.stairs.landing.on ? '' : 'none'));
    $$('.pile-only').forEach((e) => (e.style.display = st.found.type === 'screwpile' ? '' : 'none'));
    $$('.garage-only').forEach((e) => (e.style.display = st.site && st.site.garage && st.site.garage.on ? '' : 'none'));
    $$('.overhead-only').forEach((e) => (e.style.display = st.site && st.site.overhead ? '' : 'none'));
  }

  $('#form').addEventListener('input', onEdit);
  $('#form').addEventListener('change', onEdit);
  function onEdit(e) {
    const el = e.target; if (!el.dataset || !el.dataset.k) return;
    let v = el.value;
    if (el.dataset.type === 'check') v = el.checked;
    else if (el.dataset.type === 'bool') v = v === 'true';
    else if (el.dataset.type === 'num') v = v === '' ? '' : +v;
    set(el.dataset.k, v);
    if (el.hasAttribute('data-len')) showParsed(el);
    if (/^openings\.\d+\.type$/.test(el.dataset.k)) { openList(); fillForm(); }
    syncVisibility();
    clearTimeout(timer); timer = setTimeout(render, 140);
  }

  function valid() {
    const req = ['deck.L', 'deck.W', 'deck.H', 'site.lotW', 'site.lotD', 'site.houseW', 'site.houseD', 'site.frontSB', 'site.leftSB'];
    if (st.deck.shape === 'L') req.push('deck.extW', 'deck.extD');
    if (st.stairs.on && st.stairs.landing && st.stairs.landing.on) req.push('stairs.landing.depth');
    (st.openings || []).forEach((o, i) => req.push('openings.' + i + '.at', 'openings.' + i + '.w', 'openings.' + i + '.h'));
    return req.every((k) => { const v = DP.parseLen(get(k)); return isFinite(v) && (v > 0 || /\.at$/.test(k) && v === 0); });
  }

  function render() {
    save();
    if (!valid()) { toast('Some lengths are missing or not readable. Fix the red fields.'); return; }
    try { model = DP.compute(st); sheets = DP.buildSheets(model, st); }
    catch (e) { console.error(e); toast('Could not draw with these numbers: ' + e.message); return; }
    $('#hdrAddr').textContent = (st.project.address || 'No address') + ' · ' + (model.shape ? 'L ' : '') + DP.fmt(model.L) + ' × ' + DP.fmt(model.Wt);
    if (!sheets.find((s) => s.num === cur)) cur = 'A0';
    $('#tabs').innerHTML = sheets.map((s) => `<button role="tab" aria-selected="${s.num === cur}" data-s="${s.num}">${s.num} ${esc(s.short || title(s.title))}</button>`).join('');
    showSheet();
    // checks chip
    const c = model.checks; const ng = c.filter((x) => x.status === 'NG').length, vf = c.filter((x) => x.status === 'VERIFY').length, ok = c.filter((x) => x.status === 'OK').length;
    $('#chkChip').innerHTML = (ng ? `<span class="ng">${ng} fail</span> · ` : '') + `<span class="vf">${vf} to verify</span> · <span class="ok">${ok} pass</span>`;
    $('#checks').innerHTML = '<table><tr><th>Check</th><th>Required</th><th>This design</th><th></th><th>Source</th></tr>' + c.map((x) => `<tr><td>${esc(x.item)}</td><td>${esc(x.req)}</td><td>${esc(x.prov)}</td><td class="st-${x.status}">${x.status}</td><td>${esc(x.src)}</td></tr>`).join('') + '</table>';
    // notes
    const bt = DP.BEAM_TABLE.find((r) => model.sjlMax * 12 <= r.max + 0.01);
    $('#beamNote').innerHTML = `Clear joist span <b>${DP.fmt(model.clear)}</b>${model.allowedIn ? ' (City max ' + DP.fmt(model.allowedIn / 12) + ')' : ''}. ${model.beamsV.length} beam line(s), ${model.nPosts} posts each at <b>${DP.fmt(model.postSp)}</b>. Beam needs ${bt ? bt.opts.map(([p, s]) => p + '-' + s).join(' or ') + ' or bigger' : 'an engineer (beyond Table 2)'}.`;
    $('#stairNote').innerHTML = model.stair && model.landing ? `<b>${model.stair.nR} risers</b> at ${DP.fmtIn(model.stair.riseIn)}: ${model.stair.n1} down to the landing at ${DP.fmt(model.landing.H)}, then ${model.stair.n2} to grade. ${model.stair.nT} treads.` : model.stair ? `<b>${model.stair.nR} risers</b> at ${DP.fmtIn(model.stair.riseIn)}, ${model.stair.nT} treads, total run ${DP.fmt(model.stair.totalRun)}.` : '';
  }
  const title = (t) => t.charAt(0) + t.slice(1).toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function showSheet() {
    const s = sheets.find((x) => x.num === cur) || sheets[0];
    $('#paper').innerHTML = s.svg;
    $$('#tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.s === s.num));
  }
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; cur = b.dataset.s; showSheet(); });
  $('#paper').addEventListener('dblclick', () => $('#paper').classList.toggle('zoom'));
  $('#chkChip').addEventListener('click', () => { const c = $('#checks'); c.hidden = !c.hidden; });

  /* ---------- PDF ---------- */
  async function pdf(list, filename) {
    const { jsPDF } = window.jspdf;
    const letter = st.out.paper === 'letter';
    const fmtA = letter ? [792, 612] : [1224, 792];
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: fmtA, compress: true });
    // embed the drafting font (osifont) so the PDF looks the same everywhere
    if (window.DP_FONT) {
      const F = window.DP_FONT;
      doc.addFileToVFS(F.file, F.b64);
      doc.addFont(F.file, F.name, 'normal'); // one weight; bold text is drawn with a thin outline
      doc.setFont(F.name, 'normal');
    }
    const stage = $('#pdfStage');
    for (let i = 0; i < list.length; i++) {
      if (i) doc.addPage(fmtA, 'landscape');
      stage.innerHTML = list[i].svg;
      const el = stage.querySelector('svg');
      const k = letter ? Math.min(792 / 1224, 612 / 792) : 1;
      const w = 1224 * k, h = 792 * k;
      await doc.svg(el, { x: (fmtA[0] - w) / 2, y: (fmtA[1] - h) / 2, width: w, height: h });
    }
    stage.innerHTML = '';
    doc.setProperties({ title: 'Deck permit drawings — ' + (st.project.address || ''), subject: 'Residential deck, City of Winnipeg', author: st.project.drawnBy || 'Carpenter Johnny', creator: 'DeckPlan v1.3.1' });
    doc.save(filename);
    return doc;
  }
  const slug = () => ((st.project.address || 'deck').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'deck') + '-' + (st.project.date || '');
  async function exportAll() {
    const b = $('#btnPdf'); b.disabled = true; b.textContent = 'Building PDF…';
    try {
      const reduced = st.out.paper === 'letter';
      const list = DP.buildSheets(model, st, { reduced });
      await pdf(list, 'deck-permit-' + slug() + '.pdf');
      toast('PDF saved: ' + list.length + ' sheets (site plan, overhead plan, front and side elevations, section).');
    } catch (e) { console.error(e); toast('PDF export failed: ' + e.message); }
    b.disabled = false; b.textContent = 'Export PDF';
  }
  $('#btnPdf').addEventListener('click', exportAll);
  $('#btnSave').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(st, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'deckplan-' + slug() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('#btnOpen').addEventListener('click', () => $('#fileOpen').click());
  $('#fileOpen').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (j.v !== 1) throw new Error('not a DeckPlan file'); st = merge(DP.defaultState(), j); fillForm(); render(); toast('Opened ' + f.name); }
    catch (err) { toast('Could not open that file: ' + err.message); }
    e.target.value = '';
  });
  $('#btnReset').addEventListener('click', () => { if (!confirm('Replace everything with the sample deck?')) return; st = DP.defaultState(); fillForm(); render(); });
  $$('.switch button').forEach((b) => b.addEventListener('click', () => { document.body.dataset.pane = b.dataset.pane; $$('.switch button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
  document.body.dataset.pane = 'inputs';

  let tt; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 4200); }

  window.DeckPlanApp = { get state() { return st; }, get model() { return model; }, get sheets() { return sheets; }, render, exportAll, pdf, set: (k, v) => { set(k, v); fillForm(); render(); } };
  fillForm(); render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
