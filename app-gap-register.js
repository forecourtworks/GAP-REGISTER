/**
 * FSW × Ainushamsi — Combined Gap Register App
 * Multi-NC per asset · A1 landscape PDF · Draft save · Dual signatures
 */
(function () {
  'use strict';

  const STATIONS = [
    'Pumwani', 'Garissa', 'Eldoret', 'Kisumu',
    'Mariakani Weighbridge', 'Old Mariakani', 'Kaloleni'
  ];

  const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
  const RISKS = ['Safety', 'Environmental', 'Metrology/Legal', 'Operational', 'Cosmetic'];
  const STATUSES = ['Open', 'In Progress', 'Closed', 'Deferred'];
  const RESP = ['FSW', 'Client', 'Shared', 'Third Party'];
  const CATEGORIES = [
    'Dispenser', 'STP', 'UST', 'Generator', 'Air Compressor',
    'Canopy', 'Piping', 'CCTV/Electrical', 'Price Board', 'Other'
  ];

  const DRAFT_KEY = 'fsw_gap_register_draft_v1';

  /** @type {{ assets: Array, meta: object, signatures: object }} */
  let state = {
    assets: [],
    meta: {},
    signatures: {
      clientDraw: null,
      clientFile: null,
      fswDraw: null,
      fswFile: null
    }
  };

  let sigClient = null;
  let sigFsw = null;
  let assetSeq = 0;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function toast(msg, type = '') {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(() => { el.className = 'toast'; }, 2800);
  }

  function showOverlay(t) {
    $('#overlay-text').textContent = t || 'Working…';
    $('#overlay').classList.add('show');
  }
  function hideOverlay() {
    $('#overlay').classList.remove('show');
  }

  function uid() {
    return 'a' + (++assetSeq) + '_' + Date.now().toString(36);
  }

  function emptyNC() {
    return {
      id: 'nc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      finding: '',
      priority: 'Medium',
      risk: 'Operational',
      regulatory: '',
      action: '',
      woYes: 'No',
      woNo: '',
      target: '',
      responsibility: 'FSW',
      status: 'Open'
    };
  }

  function emptyAsset() {
    return {
      id: uid(),
      name: '',
      assetId: '',
      manufacturer: '',
      model: '',
      serial: '',
      location: '',
      category: 'Dispenser',
      ncs: [emptyNC()]
    };
  }

  function countNCs() {
    return state.assets.reduce((n, a) => n + (a.ncs || []).length, 0);
  }

  function updateBadges() {
    $('#badge-station').textContent = $('#station-name').value || '—';
    $('#badge-assets').textContent = state.assets.length + ' asset' + (state.assets.length === 1 ? '' : 's');
    const n = countNCs();
    $('#badge-ncs').textContent = n + ' NC' + (n === 1 ? '' : 's');
  }

  function readMeta() {
    return {
      docRef: $('#doc-ref').value.trim(),
      inspDate: $('#insp-date').value,
      stationName: $('#station-name').value.trim(),
      stationCode: $('#station-code').value.trim(),
      fswInspector: $('#fsw-inspector').value.trim(),
      clientRep: $('#client-rep').value.trim()
    };
  }

  function syncAssetFromDOM(assetId) {
    const card = document.querySelector(`[data-asset-id="${assetId}"]`);
    if (!card) return;
    const asset = state.assets.find(a => a.id === assetId);
    if (!asset) return;
    asset.name = $('[data-f="name"]', card).value;
    asset.assetId = $('[data-f="assetId"]', card).value;
    asset.manufacturer = $('[data-f="manufacturer"]', card).value;
    asset.model = $('[data-f="model"]', card).value;
    asset.serial = $('[data-f="serial"]', card).value;
    asset.location = $('[data-f="location"]', card).value;
    asset.category = $('[data-f="category"]', card).value;

    $$('.nc-block', card).forEach((block, i) => {
      const nc = asset.ncs[i];
      if (!nc) return;
      nc.finding = $('[data-f="finding"]', block).value;
      nc.priority = $('[data-f="priority"]', block).value;
      nc.risk = $('[data-f="risk"]', block).value;
      nc.regulatory = $('[data-f="regulatory"]', block).value;
      nc.action = $('[data-f="action"]', block).value;
      nc.woYes = $('[data-f="woYes"]', block).value;
      nc.woNo = $('[data-f="woNo"]', block).value;
      nc.target = $('[data-f="target"]', block).value;
      nc.responsibility = $('[data-f="responsibility"]', block).value;
      nc.status = $('[data-f="status"]', block).value;
    });
  }

  function syncAllFromDOM() {
    state.assets.forEach(a => syncAssetFromDOM(a.id));
    state.meta = readMeta();
  }

  function renderAssets() {
    const box = $('#assets-container');
    const empty = $('#assets-empty');
    box.innerHTML = '';
    if (!state.assets.length) {
      empty.classList.remove('hidden');
      updateBadges();
      return;
    }
    empty.classList.add('hidden');

    state.assets.forEach((asset, ai) => {
      const card = document.createElement('div');
      card.className = 'card asset-card';
      card.dataset.assetId = asset.id;
      card.style.marginBottom = '14px';

      const catOpts = CATEGORIES.map(c =>
        `<option value="${c}" ${asset.category === c ? 'selected' : ''}>${c}</option>`
      ).join('');

      let ncHtml = asset.ncs.map((nc, ni) => {
        const pOpts = PRIORITIES.map(p => `<option ${nc.priority === p ? 'selected' : ''}>${p}</option>`).join('');
        const rOpts = RISKS.map(p => `<option ${nc.risk === p ? 'selected' : ''}>${p}</option>`).join('');
        const sOpts = STATUSES.map(p => `<option ${nc.status === p ? 'selected' : ''}>${p}</option>`).join('');
        const respOpts = RESP.map(p => `<option ${nc.responsibility === p ? 'selected' : ''}>${p}</option>`).join('');
        return `
          <div class="nc-block" data-nc-index="${ni}">
            <h4>
              <span>Non-Conformance ${ni + 1}</span>
              <button type="button" class="btn btn-danger btn-sm" data-remove-nc="${ni}">Remove NC</button>
            </h4>
            <div class="form-group">
              <label>Finding / Gap Description</label>
              <textarea data-f="finding" rows="2" placeholder="Describe the non-conformance">${esc(nc.finding)}</textarea>
            </div>
            <div class="row-3">
              <div class="form-group">
                <label>Priority</label>
                <select data-f="priority">${pOpts}</select>
              </div>
              <div class="form-group">
                <label>Risk Category</label>
                <select data-f="risk">${rOpts}</select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select data-f="status">${sOpts}</select>
              </div>
            </div>
            <div class="form-group">
              <label>Regulatory Link (if any)</label>
              <input type="text" data-f="regulatory" value="${esc(nc.regulatory)}" placeholder="EPRA / W&amp;M / NEMA / DOSHS / None" />
            </div>
            <div class="form-group">
              <label>Required / Recommended Action</label>
              <textarea data-f="action" rows="2" placeholder="Specific corrective action">${esc(nc.action)}</textarea>
            </div>
            <div class="row-3">
              <div class="form-group">
                <label>WO Raised?</label>
                <select data-f="woYes">
                  <option ${nc.woYes === 'Yes' ? 'selected' : ''}>Yes</option>
                  <option ${nc.woYes === 'No' ? 'selected' : ''}>No</option>
                </select>
              </div>
              <div class="form-group">
                <label>WO Number</label>
                <input type="text" data-f="woNo" value="${esc(nc.woNo)}" placeholder="WO-…" />
              </div>
              <div class="form-group">
                <label>Target Window</label>
                <input type="text" data-f="target" value="${esc(nc.target)}" placeholder="Immediate / 7 days / Next PM" />
              </div>
            </div>
            <div class="form-group">
              <label>Responsibility</label>
              <select data-f="responsibility">${respOpts}</select>
            </div>
          </div>`;
      }).join('');

      card.innerHTML = `
        <div class="card-head">
          <span>Asset ${ai + 1}${asset.name ? ' — ' + esc(asset.name) : ''}</span>
          <button type="button" class="btn btn-danger btn-sm" data-remove-asset>Remove asset</button>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="form-group">
              <label>Equipment Name</label>
              <input type="text" data-f="name" value="${esc(asset.name)}" placeholder="e.g. Remote FDU – Island 1" />
            </div>
            <div class="form-group">
              <label>Asset ID / Tag</label>
              <input type="text" data-f="assetId" value="${esc(asset.assetId)}" placeholder="Physical tag number" />
            </div>
          </div>
          <div class="row-3">
            <div class="form-group">
              <label>Manufacturer</label>
              <input type="text" data-f="manufacturer" value="${esc(asset.manufacturer)}" />
            </div>
            <div class="form-group">
              <label>Model No.</label>
              <input type="text" data-f="model" value="${esc(asset.model)}" />
            </div>
            <div class="form-group">
              <label>Serial No.</label>
              <input type="text" data-f="serial" value="${esc(asset.serial)}" />
            </div>
          </div>
          <div class="row">
            <div class="form-group">
              <label>Location on Site</label>
              <input type="text" data-f="location" value="${esc(asset.location)}" placeholder="Island 1 / Tank farm / …" />
            </div>
            <div class="form-group">
              <label>Category</label>
              <select data-f="category">${catOpts}</select>
            </div>
          </div>
          ${ncHtml}
          <div class="nc-actions">
            <button type="button" class="btn btn-primary btn-sm" data-add-nc>+ NC</button>
          </div>
        </div>`;

      box.appendChild(card);

      card.querySelector('[data-remove-asset]').addEventListener('click', () => {
        syncAllFromDOM();
        state.assets = state.assets.filter(a => a.id !== asset.id);
        renderAssets();
        toast('Asset removed');
      });

      card.querySelector('[data-add-nc]').addEventListener('click', () => {
        syncAssetFromDOM(asset.id);
        asset.ncs.push(emptyNC());
        renderAssets();
        toast('NC added');
      });

      $$('[data-remove-nc]', card).forEach(btn => {
        btn.addEventListener('click', () => {
          syncAssetFromDOM(asset.id);
          const idx = parseInt(btn.getAttribute('data-remove-nc'), 10);
          if (asset.ncs.length <= 1) {
            toast('Keep at least one NC or remove the asset', 'err');
            return;
          }
          asset.ncs.splice(idx, 1);
          renderAssets();
        });
      });

      // live badge on name change
      const nameInput = $('[data-f="name"]', card);
      nameInput.addEventListener('input', () => {
        asset.name = nameInput.value;
        updateBadges();
      });
    });

    updateBadges();
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function saveDraft() {
    syncAllFromDOM();
    const payload = {
      savedAt: new Date().toISOString(),
      meta: state.meta,
      assets: state.assets,
      signNames: {
        clientName: $('#client-sign-name').value,
        clientDesig: $('#client-sign-desig').value,
        clientDate: $('#client-sign-date').value,
        fswName: $('#fsw-sign-name').value,
        fswDesig: $('#fsw-sign-desig').value,
        fswDate: $('#fsw-sign-date').value
      }
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch (e) { /* quota */ }

    // Also download JSON for device transfer
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (state.meta.stationCode || 'GAP') + '_draft_' + todayISO() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Draft saved locally & downloaded', 'ok');
    $('#badge-doc').textContent = 'DRAFT SAVED';
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.meta) {
        $('#doc-ref').value = data.meta.docRef || '';
        $('#insp-date').value = data.meta.inspDate || '';
        $('#station-name').value = data.meta.stationName || '';
        $('#station-code').value = data.meta.stationCode || '';
        $('#fsw-inspector').value = data.meta.fswInspector || '';
        $('#client-rep').value = data.meta.clientRep || '';
      }
      if (Array.isArray(data.assets)) state.assets = data.assets;
      if (data.signNames) {
        $('#client-sign-name').value = data.signNames.clientName || '';
        $('#client-sign-desig').value = data.signNames.clientDesig || '';
        $('#client-sign-date').value = data.signNames.clientDate || '';
        $('#fsw-sign-name').value = data.signNames.fswName || '';
        $('#fsw-sign-desig').value = data.signNames.fswDesig || '';
        $('#fsw-sign-date').value = data.signNames.fswDate || '';
      }
      renderAssets();
      toast('Draft restored', 'ok');
      return true;
    } catch (e) {
      return false;
    }
  }

  function initSignatures() {
    const c1 = $('#sig-client');
    const c2 = $('#sig-fsw');
    if (!c1 || !window.SignaturePad) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    [c1, c2].forEach(canvas => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = 140 * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
    });
    sigClient = new SignaturePad(c1, { backgroundColor: 'rgb(255,255,255)', penColor: 'rgb(10,49,97)' });
    sigFsw = new SignaturePad(c2, { backgroundColor: 'rgb(255,255,255)', penColor: 'rgb(10,49,97)' });
  }

  function getSigData(which) {
    // Prefer file attachment if present, else drawn signature
    if (which === 'client') {
      if (state.signatures.clientFile) return state.signatures.clientFile;
      if (sigClient && !sigClient.isEmpty()) return sigClient.toDataURL('image/png');
    } else {
      if (state.signatures.fswFile) return state.signatures.fswFile;
      if (sigFsw && !sigFsw.isEmpty()) return sigFsw.toDataURL('image/png');
    }
    return null;
  }

  function computeSummary() {
    syncAllFromDOM();
    let total = 0, crit = 0, high = 0, med = 0, low = 0, wo = 0;
    state.assets.forEach(a => {
      (a.ncs || []).forEach(nc => {
        total++;
        if (nc.priority === 'Critical') crit++;
        else if (nc.priority === 'High') high++;
        else if (nc.priority === 'Medium') med++;
        else low++;
        if (nc.woYes === 'Yes') wo++;
      });
    });
    $('#sum-total').value = total;
    $('#sum-crit').value = crit;
    $('#sum-high').value = high;
    $('#sum-med').value = med;
    $('#sum-low').value = low;
    $('#sum-wo').value = wo;
  }

  function openSignoff() {
    syncAllFromDOM();
    if (!state.assets.length) {
      toast('Add at least one asset before finishing', 'err');
      return;
    }
    $('#signoff-card').classList.remove('hidden');
    computeSummary();
    setTimeout(initSignatures, 100);
    $('#signoff-card').scrollIntoView({ behavior: 'smooth' });
    $('#badge-doc').textContent = 'SIGN-OFF';
  }

  // ═══════════════════════════════════════════════════════════
  // PDF GENERATION — A1 landscape, grouped assets, wide NC/Action
  // ═══════════════════════════════════════════════════════════
  async function generatePDF() {
    syncAllFromDOM();
    computeSummary();
    showOverlay('Generating A1 PDF…');

    try {
      const { jsPDF } = window.jspdf;
      // A1 landscape in mm
      const W = 841;
      const H = 594;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [W, H] });

      const NAVY = [10, 49, 97];
      const GOLD = [212, 175, 55];
      const GOLD_L = [245, 230, 200];
      const DARK = [26, 35, 50];
      const GREY = [90, 101, 119];
      const WHITE = [255, 255, 255];
      const ROW_ALT = [242, 245, 249];

      const logos = window.FSW_LOGOS || {};

      function dualBorder(d) {
        d.setDrawColor(...NAVY);
        d.setLineWidth(0.7);
        d.rect(8, 8, W - 16, H - 16);
        d.setLineWidth(0.25);
        d.rect(11, 11, W - 22, H - 22);
      }

      function addLogo(d, key, x, y, w, h) {
        try {
          if (logos[key]) d.addImage(logos[key], 'PNG', x, y, w, h);
        } catch (e) { /* skip */ }
      }

      // ── Page 1: Cover ──────────────────────────────────────
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, W, H, 'F');
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.6);
      doc.rect(15, 15, W - 30, H - 30);
      doc.setLineWidth(0.25);
      doc.rect(18, 18, W - 36, H - 36);

      addLogo(doc, 'as', 40, 40, 55, 26);
      addLogo(doc, 'fswGold', W - 120, 48, 75, 13);

      doc.setTextColor(...GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('AINUSHAMSI ENERGY LIMITED', 40, 75);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...GOLD_L);
      doc.text('3rd Floor, 97 Place Suites, Opp. Astrol Petrol Station', 40, 81);
      doc.text('Lenana Road, Nairobi', 40, 86);

      doc.setTextColor(...GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('FORECOURT WORKS LIMITED', W - 40, 70, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...GOLD_L);
      doc.text('Ramco Court, Gate 3B, South C', W - 40, 76, { align: 'right' });
      doc.text('Tel: +254 729 002 087', W - 40, 81, { align: 'right' });
      doc.text('dispatcher@forecourtworks.co.ke', W - 40, 86, { align: 'right' });

      doc.setTextColor(...GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      const cy = H / 2 - 10;
      doc.text('COMBINED EQUIPMENT CONDITION', W / 2, cy, { align: 'center' });
      doc.text('& REGULATORY COMPLIANCE', W / 2, cy + 12, { align: 'center' });
      doc.text('GAP REGISTER', W / 2, cy + 24, { align: 'center' });
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.5);
      doc.line(W / 2 - 80, cy + 30, W / 2 + 80, cy + 30);

      doc.setTextColor(...WHITE);
      doc.setFontSize(16);
      doc.text('BASELINE CONDITION INSPECTION', W / 2, cy + 44, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(...GOLD_L);
      doc.text(state.meta.stationName || 'STATION', W / 2, cy + 54, { align: 'center' });

      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Jointly prepared and agreed by', W / 2, cy + 70, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GOLD);
      doc.text('Forecourt Works Limited  ·  Ainushamsi Energy Limited', W / 2, cy + 78, { align: 'center' });

      // meta box
      doc.setFillColor(10, 41, 82);
      doc.setDrawColor(...GOLD);
      doc.roundedRect(W / 2 - 95, H - 95, 190, 42, 3, 3, 'FD');
      doc.setTextColor(...GOLD_L);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Document Ref:  ' + (state.meta.docRef || ''), W / 2 - 85, H - 82);
      doc.text('Inspection Date:  ' + (state.meta.inspDate || ''), W / 2 - 85, H - 73);
      doc.text('Station Code:  ' + (state.meta.stationCode || ''), W / 2 - 85, H - 64);
      doc.setTextColor(...GOLD);
      doc.setFont('helvetica', 'bold');
      doc.text('CONFIDENTIAL', W / 2 + 55, H - 78);

      doc.setTextColor(...GOLD_L);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Critical & High items drive the first 90-day work plan under the Preventive Maintenance Contract.', W / 2, H - 28, { align: 'center' });

      // ── Register pages ─────────────────────────────────────
      // Layout: each asset = identity band + NC blocks
      // Wider NC + Action columns; text wraps; height grows with content

      const M = 20;
      const contentW = W - 2 * M;
      const headerH = 38;
      let pageNum = 1;
      const totalEstimate = 2; // updated later

      function newRegisterPage() {
        doc.addPage([W, H], 'landscape');
        pageNum++;
        doc.setFillColor(...WHITE);
        doc.rect(0, 0, W, H, 'F');
        dualBorder(doc);

        // header bar
        doc.setFillColor(...NAVY);
        doc.rect(M, M - 2, contentW, headerH, 'F');
        addLogo(doc, 'as', M + 3, M + 4, 32, 15);
        addLogo(doc, 'fswGold', W - M - 60, M + 6, 55, 10);
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('AINUSHAMSI ENERGY LIMITED', M + 38, M + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GOLD_L);
        doc.text('Lenana Road, Nairobi  |  Client joint sign-off', M + 38, M + 14);
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('FORECOURT WORKS LIMITED', W - M - 3, M + 22, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GOLD_L);
        doc.text('+254 729 002 087  |  dispatcher@forecourtworks.co.ke', W - M - 3, M + 28, { align: 'right' });

        let y = M + headerH + 4;
        doc.setTextColor(...NAVY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('COMBINED EQUIPMENT CONDITION & REGULATORY COMPLIANCE GAP REGISTER', W / 2, y, { align: 'center' });
        y += 6;
        doc.setFontSize(9);
        doc.text('Baseline Inspection — ' + (state.meta.stationName || '') + '  |  ' + (state.meta.docRef || ''), W / 2, y, { align: 'center' });
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...DARK);
        doc.text(
          'Date: ' + (state.meta.inspDate || '—') +
          '   |   FSW: ' + (state.meta.fswInspector || '—') +
          '   |   Client Rep: ' + (state.meta.clientRep || '—'),
          M, y
        );
        y += 6;
        return y;
      }

      function ensureSpace(y, need) {
        if (y + need > H - 22) {
          // footer
          doc.setFontSize(7);
          doc.setTextColor(...NAVY);
          doc.text('FSW × Ainushamsi  |  Combined Gap Register  |  CONFIDENTIAL', M, H - 12);
          doc.text('Page ' + pageNum, W - M, H - 12, { align: 'right' });
          return newRegisterPage();
        }
        return y;
      }

      function wrapText(d, text, maxW, fontSize) {
        d.setFontSize(fontSize);
        const lines = d.splitTextToSize(String(text || '—'), maxW);
        return lines;
      }

      let y = newRegisterPage();

      // Column plan for NC table under each asset (wider finding + action)
      // Priority | Risk | Regulatory | Finding (wide) | Action (wide) | WO | Target | Resp | Status
      const ncCols = [
        { key: 'priority', label: 'Priority', w: 22 },
        { key: 'risk', label: 'Risk', w: 28 },
        { key: 'regulatory', label: 'Regulatory', w: 32 },
        { key: 'finding', label: 'Finding / Gap Description', w: 95 },
        { key: 'action', label: 'Required Action', w: 90 },
        { key: 'wo', label: 'WO', w: 28 },
        { key: 'target', label: 'Target', w: 28 },
        { key: 'responsibility', label: 'Resp.', w: 24 },
        { key: 'status', label: 'Status', w: 24 }
      ];
      // scale to contentW
      const ncSum = ncCols.reduce((s, c) => s + c.w, 0);
      const ncScale = contentW / ncSum;
      ncCols.forEach(c => { c.w = c.w * ncScale; });

      state.assets.forEach((asset, ai) => {
        // Identity band height
        const idH = 18;
        y = ensureSpace(y, idH + 20);

        // Asset identity header
        doc.setFillColor(...NAVY);
        doc.rect(M, y, contentW, idH, 'F');
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const idLine1 = `Asset ${ai + 1}:  ${asset.name || '—'}   |   Tag: ${asset.assetId || '—'}   |   ${asset.category || ''}`;
        doc.text(idLine1, M + 3, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GOLD_L);
        const idLine2 = `Mfr: ${asset.manufacturer || '—'}   Model: ${asset.model || '—'}   Serial: ${asset.serial || '—'}   Location: ${asset.location || '—'}`;
        doc.text(idLine2, M + 3, y + 13);
        y += idH + 1;

        // NC column headers
        doc.setFillColor(20, 70, 120);
        doc.rect(M, y, contentW, 7, 'F');
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        let x = M;
        ncCols.forEach(c => {
          doc.text(c.label, x + c.w / 2, y + 4.5, { align: 'center' });
          x += c.w;
        });
        y += 7;

        (asset.ncs || []).forEach((nc, ni) => {
          const findingLines = wrapText(doc, nc.finding, ncCols[3].w - 2, 7.5);
          const actionLines = wrapText(doc, nc.action, ncCols[4].w - 2, 7.5);
          const regLines = wrapText(doc, nc.regulatory, ncCols[2].w - 2, 7);
          const maxLines = Math.max(findingLines.length, actionLines.length, regLines.length, 1);
          const rowH = Math.max(10, maxLines * 3.6 + 3);

          y = ensureSpace(y, rowH + 2);

          if (ni % 2 === 0) {
            doc.setFillColor(...ROW_ALT);
            doc.rect(M, y, contentW, rowH, 'F');
          }
          doc.setDrawColor(180, 190, 205);
          doc.setLineWidth(0.15);
          doc.rect(M, y, contentW, rowH, 'S');

          x = M;
          const cells = [
            nc.priority || '',
            nc.risk || '',
            regLines,
            findingLines,
            actionLines,
            (nc.woYes === 'Yes' ? (nc.woNo || 'Yes') : 'No'),
            nc.target || '',
            nc.responsibility || '',
            nc.status || ''
          ];

          doc.setTextColor(...DARK);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);

          cells.forEach((cell, ci) => {
            const cw = ncCols[ci].w;
            doc.setDrawColor(200, 208, 220);
            doc.line(x, y, x, y + rowH);
            if (Array.isArray(cell)) {
              cell.forEach((ln, li) => {
                doc.text(ln, x + 1, y + 3.5 + li * 3.6);
              });
            } else {
              // priority colour
              if (ci === 0) {
                if (cell === 'Critical') doc.setTextColor(185, 28, 28);
                else if (cell === 'High') doc.setTextColor(194, 65, 12);
                else doc.setTextColor(...DARK);
                doc.setFont('helvetica', 'bold');
              } else {
                doc.setTextColor(...DARK);
                doc.setFont('helvetica', 'normal');
              }
              const t = String(cell);
              const clipped = doc.splitTextToSize(t, cw - 2);
              doc.text(clipped[0] || '', x + 1, y + rowH / 2 + 1);
            }
            x += cw;
          });

          y += rowH;
        });

        y += 4; // gap between assets
      });

      // footer last register page
      doc.setFontSize(7);
      doc.setTextColor(...NAVY);
      doc.text('FSW × Ainushamsi  |  Combined Gap Register  |  CONFIDENTIAL', M, H - 12);
      doc.text('Page ' + pageNum, W - M, H - 12, { align: 'right' });

      // ── Sign-off page ──────────────────────────────────────
      doc.addPage([W, H], 'landscape');
      pageNum++;
      doc.setFillColor(...WHITE);
      doc.rect(0, 0, W, H, 'F');
      dualBorder(doc);

      doc.setFillColor(...NAVY);
      doc.rect(M, M, contentW, 18, 'F');
      doc.setTextColor(...GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('JOINT AGREEMENT & SIGN-OFF', W / 2, M + 8, { align: 'center' });
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Combined Gap Register — ' + (state.meta.stationName || ''), W / 2, M + 14, { align: 'center' });

      let sy = M + 28;
      doc.setTextColor(...DARK);
      doc.setFontSize(9);
      const affirm = 'We jointly confirm that the baseline equipment condition inspection and preliminary regulatory compliance inspection at the station named above have been completed. Findings have been reviewed and prioritised together. Critical and High items form the basis of the first 90-day work plan. Asset tags match the Asset ID entries.';
      const affirmLines = doc.splitTextToSize(affirm, contentW - 10);
      affirmLines.forEach(ln => {
        doc.text(ln, M + 5, sy);
        sy += 5;
      });
      sy += 6;

      const panelW = (contentW - 12) / 2;
      const panelH = 95;

      // Client panel
      doc.setFillColor(238, 244, 251);
      doc.setDrawColor(...NAVY);
      doc.setLineWidth(0.4);
      doc.roundedRect(M, sy, panelW, panelH, 3, 3, 'FD');
      addLogo(doc, 'as', M + 6, sy + 4, 28, 13);
      doc.setTextColor(...NAVY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('AINUSHAMSI ENERGY LIMITED', M + 38, sy + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.text('Client Site Representative', M + 38, sy + 15);

      doc.setFontSize(8);
      doc.setTextColor(...NAVY);
      doc.text('Name:  ' + ($('#client-sign-name').value || ''), M + 6, sy + 26);
      doc.text('Designation:  ' + ($('#client-sign-desig').value || ''), M + 6, sy + 33);
      doc.text('Date:  ' + ($('#client-sign-date').value || ''), M + 6, sy + 40);

      doc.setDrawColor(...NAVY);
      doc.setFillColor(...WHITE);
      doc.rect(M + 6, sy + 48, panelW - 12, 38, 'FD');
      const clientSig = getSigData('client');
      if (clientSig) {
        try { doc.addImage(clientSig, 'PNG', M + 8, sy + 50, panelW - 16, 34); } catch (e) {}
      } else {
        doc.setTextColor(...GREY);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('Signature / stamp', M + panelW / 2, sy + 68, { align: 'center' });
      }

      // FSW panel
      const rx = M + panelW + 12;
      doc.setFillColor(238, 244, 251);
      doc.setDrawColor(...NAVY);
      doc.roundedRect(rx, sy, panelW, panelH, 3, 3, 'FD');
      addLogo(doc, 'fsw', rx + 6, sy + 6, 45, 8);
      doc.setTextColor(...NAVY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('FORECOURT WORKS LIMITED', rx + 6, sy + 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.text('FSW Lead Inspector / Authorised Signatory', rx + 6, sy + 26);

      doc.setTextColor(...NAVY);
      doc.text('Name:  ' + ($('#fsw-sign-name').value || ''), rx + 6, sy + 36);
      doc.text('Designation:  ' + ($('#fsw-sign-desig').value || ''), rx + 6, sy + 43);
      doc.text('Date:  ' + ($('#fsw-sign-date').value || ''), rx + 6, sy + 50);

      doc.setDrawColor(...NAVY);
      doc.setFillColor(...WHITE);
      doc.rect(rx + 6, sy + 56, panelW - 12, 32, 'FD');
      const fswSig = getSigData('fsw');
      if (fswSig) {
        try { doc.addImage(fswSig, 'PNG', rx + 8, sy + 57, panelW - 16, 28); } catch (e) {}
      } else {
        doc.setTextColor(...GREY);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('Signature / stamp', rx + panelW / 2, sy + 74, { align: 'center' });
      }

      // Summary
      let sy2 = sy + panelH + 12;
      doc.setTextColor(...NAVY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('GAP SUMMARY', M, sy2);
      sy2 += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(
        `Total: ${$('#sum-total').value}    Critical: ${$('#sum-crit').value}    High: ${$('#sum-high').value}    Medium: ${$('#sum-med').value}    Low: ${$('#sum-low').value}    WOs raised: ${$('#sum-wo').value}`,
        M, sy2
      );
      sy2 += 10;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text('DOCUMENT CONTROL', M, sy2);
      sy2 += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.text('Retain original on station file. Scan and archive in FSW and Ainushamsi records within 48 hours of joint sign-off.', M, sy2);

      doc.setFontSize(7);
      doc.setTextColor(...NAVY);
      doc.text('FSW × Ainushamsi  |  Combined Gap Register  |  CONFIDENTIAL', M, H - 12);
      doc.text('Page ' + pageNum, W - M, H - 12, { align: 'right' });

      // ── Back cover ─────────────────────────────────────────
      doc.addPage([W, H], 'landscape');
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, W, H, 'F');
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.6);
      doc.rect(15, 15, W - 30, H - 30);
      addLogo(doc, 'as', W / 2 - 70, H / 2 - 20, 48, 22);
      addLogo(doc, 'fswGold', W / 2 + 5, H / 2 - 12, 65, 11);
      doc.setTextColor(...GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('AINUSHAMSI ENERGY LIMITED', W / 2, H / 2 + 20, { align: 'center' });
      doc.setTextColor(...WHITE);
      doc.setFontSize(12);
      doc.text('×', W / 2, H / 2 + 30, { align: 'center' });
      doc.setTextColor(...GOLD);
      doc.setFontSize(16);
      doc.text('FORECOURT WORKS LIMITED', W / 2, H / 2 + 40, { align: 'center' });
      doc.setTextColor(...GOLD_L);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Combined Equipment Condition & Regulatory Compliance Gap Register', W / 2, H / 2 + 55, { align: 'center' });
      doc.setTextColor(...WHITE);
      doc.setFontSize(12);
      doc.text(state.meta.stationName || '', W / 2, H / 2 + 66, { align: 'center' });
      doc.setTextColor(...GOLD_L);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('Engineering Reliability into Every Forecourt', W / 2, H / 2 + 80, { align: 'center' });
      doc.setTextColor(...GOLD);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('CONFIDENTIAL — Controlled Document — Joint Property of Ainushamsi Energy Ltd & Forecourt Works Limited', W / 2, H - 35, { align: 'center' });

      const fileName = (state.meta.stationCode || 'GAP') + '_Gap_Register_' + todayISO() + '.pdf';
      doc.save(fileName);

      // Web Share if available
      try {
        const blob = doc.output('blob');
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
        }
      } catch (e) { /* user cancelled or unsupported */ }

      toast('PDF generated', 'ok');
      $('#badge-doc').textContent = 'PDF READY';
    } catch (err) {
      console.error(err);
      toast('PDF error: ' + (err.message || err), 'err');
    } finally {
      hideOverlay();
    }
  }

  // ── Events ────────────────────────────────────────────────
  function bind() {
    $('#insp-date').value = todayISO();
    $('#client-sign-date').value = todayISO();
    $('#fsw-sign-date').value = todayISO();

    $('#station-select').addEventListener('change', () => {
      const v = $('#station-select').value;
      if (v !== 'Other') {
        $('#station-name').value = v.toUpperCase() + ' STATION';
        $('#station-code').value = v.toUpperCase().replace(/\s+/g, '_').slice(0, 16);
      }
      updateBadges();
    });
    $('#station-name').addEventListener('input', updateBadges);

    $('#btn-add-asset').addEventListener('click', () => {
      syncAllFromDOM();
      state.assets.push(emptyAsset());
      renderAssets();
      toast('Asset added');
    });

    $('#btn-save-draft').addEventListener('click', saveDraft);
    $('#btn-finish').addEventListener('click', openSignoff);
    $('#btn-generate-pdf').addEventListener('click', generatePDF);

    $$('[data-clear-sig]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-clear-sig');
        if (id === 'sig-client') {
          if (sigClient) sigClient.clear();
          state.signatures.clientFile = null;
          $('#client-sig-preview').classList.add('hidden');
        } else {
          if (sigFsw) sigFsw.clear();
          state.signatures.fswFile = null;
          $('#fsw-sig-preview').classList.add('hidden');
        }
      });
    });

    function wireFile(inputId, which, previewId) {
      $(inputId).addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (which === 'client') {
            state.signatures.clientFile = reader.result;
            if (sigClient) sigClient.clear();
          } else {
            state.signatures.fswFile = reader.result;
            if (sigFsw) sigFsw.clear();
          }
          const img = $(previewId);
          img.src = reader.result;
          img.classList.remove('hidden');
          toast('Signature image attached', 'ok');
        };
        reader.readAsDataURL(file);
      });
    }
    wireFile('#client-sig-file', 'client', '#client-sig-preview');
    wireFile('#fsw-sig-file', 'fsw', '#fsw-sig-preview');
  }

  function init() {
    bind();
    loadDraft();
    if (!state.assets.length) {
      // start empty; user presses + Asset
      renderAssets();
    }
    updateBadges();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
