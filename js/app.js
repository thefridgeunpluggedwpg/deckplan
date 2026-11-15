/* DeckPlan UI: binds the form to state, renders live sheets, exports PDF via jsPDF + svg2pdf (vendored). */
(function () {
  const DP = window.DP;
  const KEY = 'deckplan.project.v1';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  let st = load();
  let model = null, sheets = [], cur = 'A1', timer = 0;

  function load() {
    try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.v === 1) return merge(DP.defaultState(), j); } catch (e) { /* ignore */ }
    return DP.defaultState();
  }
  function merge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else a[k] = b[k]; } return a; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); }
    catch (e) { const lite = { ...st, photos: [], sketch: null }; try { localStorage.setItem(KEY, JSON.stringify(lite)); toast('Photos are too big to keep after closing. Save the project file to keep them.'); } catch (_) { /* ignore */ } }
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
    $$('.garage').forEach((e) => (e.style.display = st.site.garage.on ? '' : 'none'));
    $$('.l-only').forEach((e) => (e.style.display = st.deck.shape === 'L' ? '' : 'none'));
    $$('.landing-only').forEach((e) => (e.style.display = st.stairs.on && st.stairs.landing && st.stairs.landing.on ? '' : 'none'));
    $$('.pile-only').forEach((e) => (e.style.display = st.found.type === 'screwpile' ? '' : 'none'));
    $$('.labour-only').forEach((e) => (e.style.display = st.labour && st.labour.on ? '' : 'none'));
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
    if (!sheets.find((s) => s.num === cur)) cur = 'A1';
    $('#tabs').innerHTML = sheets.map((s) => `<button role="tab" aria-selected="${s.num === cur}" data-s="${s.num}">${s.num} ${title(s.title)}</button>`).join('');
    showSheet();
    // checks chip
    const c = model.checks; const ng = c.filter((x) => x.status === 'NG').length, vf = c.filter((x) => x.status === 'VERIFY').length, ok = c.filter((x) => x.status === 'OK').length;
    $('#chkChip').innerHTML = (ng ? `<span class="ng">${ng} fail</span> · ` : '') + `<span class="vf">${vf} to verify</span> · <span class="ok">${ok} pass</span>`;
    $('#checks').innerHTML = '<table><tr><th>Check</th><th>Required</th><th>This design</th><th></th><th>Source</th></tr>' + c.map((x) => `<tr><td>${esc(x.item)}</td><td>${esc(x.req)}</td><td>${esc(x.prov)}</td><td class="st-${x.status}">${x.status}</td><td>${esc(x.src)}</td></tr>`).join('') + '</table>';
    // notes
    const bt = DP.BEAM_TABLE.find((r) => model.sjlMax * 12 <= r.max + 0.01);
    $('#beamNote').innerHTML = `Clear joist span <b>${DP.fmt(model.clear)}</b>${model.allowedIn ? ' (City max ' + DP.fmt(model.allowedIn / 12) + ')' : ''}. ${model.beamsV.length} beam line(s), ${model.nPosts} posts each at <b>${DP.fmt(model.postSp)}</b>. Beam needs ${bt ? bt.opts.map(([p, s]) => p + '-' + s).join(' or ') + ' or bigger' : 'an engineer (beyond Table 2)'}.`;
    const lab = DP.labourEstimate(model, st);
    $('#inHours').placeholder = 'estimate ' + lab.estH + ' h';
    $('#labourNote').innerHTML = `Estimate <b>${lab.estH} h</b> = ` + lab.parts.map((p) => `${Math.round(p[1] * 10) / 10} ${p[2]} × ${p[3]} h`).join(' + ') + `. This is an editable estimate from your hour factors, not a quote. ` + (lab.rate == null ? 'Enter a rate to add labour to the total.' : `Labour: ${lab.hours} h × $${lab.rate.toFixed(2)} = <b>$${lab.amount.toFixed(2)}</b>.`);
    $('#stairNote').innerHTML = model.stair && model.landing ? `<b>${model.stair.nR} risers</b> at ${DP.fmtIn(model.stair.riseIn)}: ${model.stair.n1} down to the landing at ${DP.fmt(model.landing.H)}, then ${model.stair.n2} to grade. ${model.stair.nT} treads.` : model.stair ? `<b>${model.stair.nR} risers</b> at ${DP.fmtIn(model.stair.riseIn)}, ${model.stair.nT} treads, total run ${DP.fmt(model.stair.totalRun)}.` : '';
    priceList();
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

  function priceList() {
    const box = $('#priceList'); if (!model) return;
    if (box.contains(document.activeElement)) return; // don't rebuild while typing
    box.innerHTML = model.materials.map((it) => {
      const def = defaultPrice(it.key);
      const ov = (st.prices || {})[it.key];
      return `<span>${esc(it.item)}<small>${it.qty} ${esc(it.unit)}${def != null ? ' · default $' + def.toFixed(2) : ' · no default price'}</small></span><input type="number" step="0.01" min="0" inputmode="decimal" data-price="${it.key}" placeholder="${def != null ? def.toFixed(2) : 'enter $'}" value="${ov != null && ov !== '' ? ov : ''}" aria-label="Unit price for ${esc(it.item)}">`;
    }).join('');
  }
  function defaultPrice(key) { const s2 = { ...st, prices: {} }; const it = DP.takeoff(model, s2).find((i) => i.key === key); return it ? it.price : null; }
  $('#priceList').addEventListener('input', (e) => {
    const k = e.target.dataset.price; if (!k) return;
    st.prices = st.prices || {};
    if (e.target.value === '') delete st.prices[k]; else st.prices[k] = +e.target.value;
    clearTimeout(timer); timer = setTimeout(render, 250);
  });

  /* ---------- photos ---------- */
  function shrink(file, max = 1400) {
    return new Promise((res, rej) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res({ data: c.toDataURL('image/jpeg', 0.82), w: c.width, h: c.height, name: file.name }); };
      img.onerror = () => rej(new Error('Could not read ' + file.name)); img.src = url;
    });
  }
  $('#inPhotos').addEventListener('change', async (e) => { for (const f of e.target.files) { try { st.photos.push(await shrink(f)); } catch (err) { toast(err.message); } } e.target.value = ''; thumbs(); render(); });
  $('#inSketch').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) { try { st.sketch = await shrink(f, 1800); } catch (err) { toast(err.message); } } e.target.value = ''; thumbs(); render(); });
  function thumbs() {
    const all = [...(st.sketch ? [{ ...st.sketch, sk: 1 }] : []), ...st.photos];
    $('#thumbs').innerHTML = all.map((p, i) => `<figure><img src="${p.data}" alt="${p.sk ? 'Sketch' : 'Site photo'}"><button type="button" data-rm="${p.sk ? 'sk' : i - (st.sketch ? 1 : 0)}" aria-label="Remove">✕</button></figure>`).join('');
  }
  $('#thumbs').addEventListener('click', (e) => { const r = e.target.dataset.rm; if (r == null) return; if (r === 'sk') st.sketch = null; else st.photos.splice(+r, 1); thumbs(); render(); });

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
    doc.setProperties({ title: 'Deck permit drawings — ' + (st.project.address || ''), subject: 'Residential deck, City of Winnipeg', author: st.project.drawnBy || 'Carpenter Johnny', creator: 'DeckPlan v1.2' });
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
      toast('PDF saved: ' + list.length + ' sheets.');
    } catch (e) { console.error(e); toast('PDF export failed: ' + e.message); }
    b.disabled = false; b.textContent = 'Export PDF';
  }
  async function exportSplit() {
    try {
      // City digital submission: PDF 2 = site plan, PDF 3 = building plans (plan, elevations, section, checklist)
      const list = DP.buildSheets(model, st, { reduced: st.out.paper === 'letter', permitOnly: true }).filter((s) => !/PHOTOS|MATERIAL/.test(s.title));
      await pdf(list.slice(0, 1), 'PDF2-site-plan-' + slug() + '.pdf');
      await pdf(list.slice(1), 'PDF3-building-plans-' + slug() + '.pdf');
      toast('Saved 2 files: site plan and building plans.');
    } catch (e) { console.error(e); toast('PDF export failed: ' + e.message); }
  }
  async function export3View() {
    try {
      const list = DP.buildSheets(model, st, { reduced: st.out.paper === 'letter', threeView: true });
      await pdf(list, 'city-3-view-' + slug() + '.pdf');
      toast('Saved the City 3-view set: plan, front and side elevations, one per page.');
    } catch (e) { console.error(e); toast('PDF export failed: ' + e.message); }
  }
  $('#btnPdf').addEventListener('click', exportAll);
  $('#btn3View').addEventListener('click', export3View);
  $('#btnSplit').addEventListener('click', exportSplit);
  $('#btnSave').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(st, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'deckplan-' + slug() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('#btnOpen').addEventListener('click', () => $('#fileOpen').click());
  $('#fileOpen').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (j.v !== 1) throw new Error('not a DeckPlan file'); st = merge(DP.defaultState(), j); fillForm(); thumbs(); render(); toast('Opened ' + f.name); }
    catch (err) { toast('Could not open that file: ' + err.message); }
    e.target.value = '';
  });
  $('#btnReset').addEventListener('click', () => { if (!confirm('Replace everything with the sample deck?')) return; st = DP.defaultState(); fillForm(); thumbs(); render(); });
  $$('.switch button').forEach((b) => b.addEventListener('click', () => { document.body.dataset.pane = b.dataset.pane; $$('.switch button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
  document.body.dataset.pane = 'inputs';

  let tt; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 4200); }

  window.DeckPlanApp = { get state() { return st; }, get model() { return model; }, get sheets() { return sheets; }, render, exportAll, export3View, pdf, set: (k, v) => { set(k, v); fillForm(); render(); } };
  fillForm(); thumbs(); render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
