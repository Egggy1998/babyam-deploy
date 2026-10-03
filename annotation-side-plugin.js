/**
 * BABY A&M - VISUAL ANNOTATION & LIVE SIDE-TAB EDITOR PLUGIN
 * Hỗ trợ:
 * 1. Side Tab trượt từ cạnh phải màn hình (Docked Side Panel)
 * 2. Chế độ sửa text trực tiếp trên web (Live ContentEditable)
 * 3. Chế độ ghim chú thích (Pin Visual Annotation) lên từng phần tử UI
 * 4. Quản lý danh sách ghi chú & xuất prompt cho AI Agent tự động sửa code
 */

(function() {
  if (window.__BabyAmAnnotationPluginLoaded) return;
  window.__BabyAmAnnotationPluginLoaded = true;

  // State store
  const state = {
    isOpen: false,
    isLiveEdit: false,
    isPinMode: false,
    annotations: [], // { id, selector, text, originalContent, x, y, tagName }
    edits: new Map(), // element -> { selector, original, current }
    hoveredEl: null
  };

  // Load Phosphor Icons if not present
  if (!document.querySelector('script[src*="phosphor-icons"]')) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@phosphor-icons/web';
    script.defer = true;
    document.head.appendChild(script);
  }

  // Inject Styles
  const style = document.createElement('style');
  style.id = 'babyam-annotation-styles';
  style.textContent = `
    /* Side Tab Trigger */
    #bam-side-trigger {
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      z-index: 99998;
      background: #335f49;
      color: #ffffff;
      padding: 12px 7px;
      border-radius: 12px 0 0 12px;
      box-shadow: -4px 0 20px rgba(0,0,0,0.18);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      font-family: 'Be Vietnam Pro', system-ui, sans-serif;
      transition: all 0.25s ease;
      user-select: none;
    }
    #bam-side-trigger:hover {
      background: #234534;
      padding-left: 10px;
    }
    #bam-side-trigger span {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    #bam-side-trigger .trigger-badge {
      background: #ba1a1a;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Side Tab Panel (Drawer) */
    #bam-side-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 380px;
      max-width: 90vw;
      height: 100vh;
      background: #ffffff;
      z-index: 99999;
      box-shadow: -10px 0 40px rgba(0,0,0,0.15);
      border-left: 1px solid #E5EBE5;
      font-family: 'Be Vietnam Pro', system-ui, sans-serif;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    #bam-side-panel.open {
      transform: translateX(0);
    }

    /* Panel Sections */
    .bam-panel-header {
      padding: 18px 20px;
      border-bottom: 1px solid #E5EBE5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #FAF8F5;
    }
    .bam-panel-title {
      font-size: 14px;
      font-weight: 700;
      color: #161d18;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .bam-panel-close {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #5C6B61;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .bam-panel-close:hover {
      background: #E8F0EA;
      color: #335f49;
    }

    .bam-panel-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      space-y: 18px;
    }

    /* Toggles Control Box */
    .bam-control-card {
      background: #F8FAF8;
      border: 1px solid #E5EBE5;
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 14px;
    }
    .bam-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
    }
    .bam-toggle-label {
      font-size: 13px;
      font-weight: 600;
      color: #161d18;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .bam-toggle-desc {
      font-size: 11px;
      color: #5C6B61;
      margin-top: 2px;
    }

    /* iOS Style Switch */
    .bam-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      shrink-0;
    }
    .bam-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .bam-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: #c0c9c1;
      border-radius: 24px;
      transition: .25s;
    }
    .bam-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: .25s;
    }
    input:checked + .bam-slider {
      background-color: #335f49;
    }
    input:checked + .bam-slider:before {
      transform: translateX(20px);
    }

    /* Annotation List */
    .bam-list-header {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #5C6B61;
      margin: 16px 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .bam-item-card {
      background: #ffffff;
      border: 1px solid #E5EBE5;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 10px;
      transition: all 0.2s;
      position: relative;
    }
    .bam-item-card:hover {
      border-color: #335f49;
      box-shadow: 0 4px 12px rgba(51,95,73,0.08);
    }
    .bam-item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .bam-item-badge {
      background: #335f49;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .bam-item-elem {
      font-family: monospace;
      font-size: 11px;
      color: #5C6B61;
      background: #F3F5F1;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .bam-item-note {
      font-size: 13px;
      color: #161d18;
      line-height: 1.5;
    }
    .bam-item-del {
      color: #ba1a1a;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 2px;
    }

    /* Panel Footer Actions */
    .bam-panel-footer {
      padding: 16px 20px;
      border-top: 1px solid #E5EBE5;
      background: #FAF8F5;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .bam-btn-primary {
      width: 100%;
      background: #335f49;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
      padding: 12px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .bam-btn-primary:hover {
      background: #254736;
    }
    .bam-btn-secondary {
      width: 100%;
      background: #ffffff;
      color: #161d18;
      border: 1px solid #E5EBE5;
      font-weight: 600;
      font-size: 12px;
      padding: 9px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .bam-btn-secondary:hover {
      background: #F3F5F1;
      border-color: #c0c9c1;
    }

    /* Visual Hover & Selected Outline in Pin Mode */
    .bam-hover-highlight {
      outline: 2px dashed #2563EB !important;
      outline-offset: 3px !important;
      cursor: crosshair !important;
      position: relative;
    }
    .bam-pin-marker {
      position: absolute;
      top: -12px;
      left: -12px;
      width: 24px;
      height: 24px;
      background: #ba1a1a;
      color: #ffffff;
      border-radius: 50%;
      font-size: 11px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 99997;
      border: 2px solid #ffffff;
      pointer-events: none;
    }

    /* Live Editing Active Halo */
    [contenteditable="true"]:focus {
      outline: 2px solid #335f49 !important;
      background: rgba(127, 173, 143, 0.08) !important;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);

  // Create Side Tab Trigger
  const trigger = document.createElement('div');
  trigger.id = 'bam-side-trigger';
  trigger.innerHTML = `
    <i class="ph-bold ph-pencil-simple-line text-lg"></i>
    <span>Chỉnh sửa &amp; Chú thích</span>
    <div class="trigger-badge" id="bam-badge-count" style="display:none;">0</div>
  `;
  document.body.appendChild(trigger);

  // Create Side Panel Container
  const panel = document.createElement('aside');
  panel.id = 'bam-side-panel';
  panel.innerHTML = `
    <!-- Header -->
    <div class="bam-panel-header">
      <div class="bam-panel-title">
        <i class="ph-bold ph-sliders text-primary text-lg"></i>
        <span>Side Tab Chỉnh Sửa UI/UX</span>
      </div>
      <button class="bam-panel-close" id="bam-close-btn" title="Đóng panel">
        <i class="ph-bold ph-x text-lg"></i>
      </button>
    </div>

    <!-- Body -->
    <div class="bam-panel-body">
      <!-- Live Edit Toggle Card -->
      <div class="bam-control-card">
        <div class="bam-toggle-row">
          <div>
            <div class="bam-toggle-label">
              <i class="ph-bold ph-text-t text-primary"></i>
              <span>Sửa trực tiếp trên trang</span>
            </div>
            <div class="bam-toggle-desc">Click thẳng vào văn bản trên web để gõ sửa</div>
          </div>
          <label class="bam-switch">
            <input type="checkbox" id="bam-toggle-edit">
            <span class="bam-slider"></span>
          </label>
        </div>
      </div>

      <!-- Pin Annotation Toggle Card -->
      <div class="bam-control-card">
        <div class="bam-toggle-row">
          <div>
            <div class="bam-toggle-label">
              <i class="ph-bold ph-push-pin text-primary"></i>
              <span>Ghim chú thích UI</span>
            </div>
            <div class="bam-toggle-desc">Click chọn bất kỳ ảnh, nút hay khối để ghi chú</div>
          </div>
          <label class="bam-switch">
            <input type="checkbox" id="bam-toggle-pin">
            <span class="bam-slider"></span>
          </label>
        </div>
      </div>

      <!-- Status Info Banner -->
      <div id="bam-mode-hint" style="display:none; background:#E8F0EA; color:#335f49; padding:10px 12px; border-radius:10px; font-size:12px; line-height:1.4; font-weight:500;">
        💡 Đang bật chế độ ghim: Hãy bấm vào phần tử bất kỳ trên trang để thêm chú thích.
      </div>

      <!-- Annotation List -->
      <div class="bam-list-header">
        <span>Ghi chú đã tạo (<span id="bam-count-label">0</span>)</span>
        <button id="bam-clear-all" style="background:transparent;border:none;color:#ba1a1a;font-size:11px;font-weight:600;cursor:pointer;">Xóa tất cả</button>
      </div>

      <div id="bam-annotations-container">
        <p style="text-align:center; color:#5C6B61; font-size:12px; padding:30px 10px;">
          Chưa có ghi chú nào.<br>Bật "Ghim chú thích" hoặc "Sửa trực tiếp" để bắt đầu chỉnh sửa.
        </p>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="bam-panel-footer">
      <button class="bam-btn-primary" id="bam-copy-prompt">
        <i class="ph-bold ph-copy text-base"></i>
        <span>Sao chép yêu cầu cho AI sửa</span>
      </button>
      <button class="bam-btn-secondary" id="bam-download-json">
        <i class="ph-bold ph-download-simple"></i>
        <span>Tải file ghi chú (.json)</span>
      </button>
    </div>
  `;
  document.body.appendChild(panel);

  // DOM Elements
  const closeBtn = document.getElementById('bam-close-btn');
  const toggleEdit = document.getElementById('bam-toggle-edit');
  const togglePin = document.getElementById('bam-toggle-pin');
  const modeHint = document.getElementById('bam-mode-hint');
  const container = document.getElementById('bam-annotations-container');
  const countLabel = document.getElementById('bam-count-label');
  const badgeCount = document.getElementById('bam-badge-count');
  const copyBtn = document.getElementById('bam-copy-prompt');
  const downloadBtn = document.getElementById('bam-download-json');
  const clearAllBtn = document.getElementById('bam-clear-all');

  // Toggle Panel Open/Close
  trigger.addEventListener('click', () => {
    state.isOpen = !state.isOpen;
    panel.classList.toggle('open', state.isOpen);
  });
  closeBtn.addEventListener('click', () => {
    state.isOpen = false;
    panel.classList.remove('open');
  });

  // 1. Live Text Editing Mode
  toggleEdit.addEventListener('change', (e) => {
    state.isLiveEdit = e.target.checked;
    if (state.isLiveEdit) {
      // Disable pin mode
      togglePin.checked = false;
      state.isPinMode = false;
      modeHint.style.display = 'none';
      enableContentEditable();
    } else {
      disableContentEditable();
    }
  });

  function enableContentEditable() {
    const editables = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, li');
    editables.forEach(el => {
      // Skip panel elements
      if (el.closest('#bam-side-panel') || el.closest('#bam-side-trigger')) return;
      el.dataset.bamOriginal = el.innerText;
      el.contentEditable = 'true';
      el.addEventListener('blur', onElementBlur);
    });
  }

  function disableContentEditable() {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    editables.forEach(el => {
      el.contentEditable = 'false';
      el.removeEventListener('blur', onElementBlur);
    });
  }

  function onElementBlur(e) {
    const el = e.target;
    const original = el.dataset.bamOriginal;
    const current = el.innerText;
    if (original !== current) {
      const selector = getSelector(el);
      state.edits.set(el, { selector, original, current });
      updateListUI();
    }
  }

  // 2. Pin Annotation Mode
  togglePin.addEventListener('change', (e) => {
    state.isPinMode = e.target.checked;
    if (state.isPinMode) {
      // Disable edit mode
      toggleEdit.checked = false;
      state.isLiveEdit = false;
      disableContentEditable();
      modeHint.style.display = 'block';
    } else {
      modeHint.style.display = 'none';
      clearHover();
    }
  });

  document.addEventListener('mouseover', (e) => {
    if (!state.isPinMode) return;
    const target = e.target;
    if (target.closest('#bam-side-panel') || target.closest('#bam-side-trigger')) return;
    clearHover();
    state.hoveredEl = target;
    target.classList.add('bam-hover-highlight');
  });

  document.addEventListener('mouseout', (e) => {
    if (!state.isPinMode) return;
    if (e.target.classList.contains('bam-hover-highlight')) {
      e.target.classList.remove('bam-hover-highlight');
    }
  });

  document.addEventListener('click', (e) => {
    if (!state.isPinMode) return;
    const target = e.target;
    if (target.closest('#bam-side-panel') || target.closest('#bam-side-trigger')) return;

    e.preventDefault();
    e.stopPropagation();

    const note = prompt('Nhập ghi chú / yêu cầu chỉnh sửa cho phần tử này:', '');
    if (note && note.trim()) {
      addAnnotation(target, note.trim());
    }
    clearHover();
  }, true);

  function clearHover() {
    if (state.hoveredEl) {
      state.hoveredEl.classList.remove('bam-hover-highlight');
      state.hoveredEl = null;
    }
  }

  function addAnnotation(el, note) {
    const id = state.annotations.length + 1;
    const selector = getSelector(el);
    const tagName = el.tagName.toLowerCase();

    // Create Pin Badge on Element
    const marker = document.createElement('div');
    marker.className = 'bam-pin-marker';
    marker.id = 'bam-pin-' + id;
    marker.innerText = id;
    
    // Position relative to target
    if (window.getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
    el.appendChild(marker);

    state.annotations.push({
      id,
      selector,
      tagName,
      text: note,
      previewText: (el.innerText || '').slice(0, 40),
      marker
    });

    updateListUI();
  }

  function getSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.tagName.toLowerCase() === 'body') return 'body';
    let path = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
      const firstClass = el.className.split(' ').filter(c => c && !c.startsWith('bam-'))[0];
      if (firstClass) path += '.' + firstClass;
    }
    return path;
  }

  function updateListUI() {
    const totalCount = state.annotations.length + state.edits.size;
    countLabel.innerText = totalCount;
    if (totalCount > 0) {
      badgeCount.style.display = 'flex';
      badgeCount.innerText = totalCount;
    } else {
      badgeCount.style.display = 'none';
    }

    if (totalCount === 0) {
      container.innerHTML = `
        <p style="text-align:center; color:#5C6B61; font-size:12px; padding:30px 10px;">
          Chưa có ghi chú nào.<br>Bật "Ghim chú thích" hoặc "Sửa trực tiếp" để bắt đầu chỉnh sửa.
        </p>
      `;
      return;
    }

    let html = '';

    // Render Live Edits
    if (state.edits.size > 0) {
      html += '<div style="font-size:11px;font-weight:700;color:#335f49;margin:8px 0;">CHỈNH SỬA VĂN BẢN TRỰC TIẾP:</div>';
      state.edits.forEach((val, el) => {
        html += `
          <div class="bam-item-card" style="border-left: 3px solid #335f49;">
            <div class="bam-item-top">
              <span class="bam-item-badge" style="background:#335f49;">Đã sửa</span>
              <span class="bam-item-elem">${val.selector}</span>
            </div>
            <div style="font-size:11px;color:#5C6B61;text-decoration:line-through;margin-bottom:3px;">"${val.original.slice(0, 50)}"</div>
            <div class="bam-item-note" style="color:#335f49;font-weight:600;">➔ "${val.current.slice(0, 50)}"</div>
          </div>
        `;
      });
    }

    // Render Pinned Annotations
    if (state.annotations.length > 0) {
      html += '<div style="font-size:11px;font-weight:700;color:#ba1a1a;margin:12px 0 8px;">GHIM CHÚ THÍCH PHẦN TỬ:</div>';
      state.annotations.forEach(a => {
        html += `
          <div class="bam-item-card" style="border-left: 3px solid #ba1a1a;">
            <div class="bam-item-top">
              <span class="bam-item-badge" style="background:#ba1a1a;">#${a.id}</span>
              <span class="bam-item-elem">&lt;${a.tagName}&gt; ${a.selector}</span>
              <button class="bam-item-del" data-del-id="${a.id}" title="Xóa chú thích">
                <i class="ph-bold ph-trash"></i>
              </button>
            </div>
            <div class="bam-item-note">${a.text}</div>
          </div>
        `;
      });
    }

    container.innerHTML = html;

    // Attach delete listeners
    container.querySelectorAll('.bam-item-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-del-id'));
        const itemIdx = state.annotations.findIndex(a => a.id === id);
        if (itemIdx !== -1) {
          if (state.annotations[itemIdx].marker) {
            state.annotations[itemIdx].marker.remove();
          }
          state.annotations.splice(itemIdx, 1);
          updateListUI();
        }
      });
    });
  }

  // Clear All
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Xóa toàn bộ ghi chú và hoàn tác chỉnh sửa?')) {
      state.annotations.forEach(a => { if (a.marker) a.marker.remove(); });
      state.annotations = [];
      state.edits.forEach((val, el) => { el.innerText = val.original; });
      state.edits.clear();
      updateListUI();
    }
  });

  // Copy Prompt for AI
  copyBtn.addEventListener('click', () => {
    let summary = `[YÊU CẦU CHỈNH SỬA UI/UX TỪ SIDE TAB - BABY A&M]\\n`;
    summary += `Trang hiện tại: ${window.location.pathname}\\n\\n`;

    if (state.edits.size > 0) {
      summary += `--- VĂN BẢN ĐÃ SỬA TRỰC TIẾP ---\\n`;
      state.edits.forEach(v => {
        summary += `• Vị trí: ${v.selector}\\n  Cũ: "${v.original}"\\n  Mới: "${v.current}"\\n\\n`;
      });
    }

    if (state.annotations.length > 0) {
      summary += `--- CHÚ THÍCH & YÊU CẦU ĐÃ GHIM ---\\n`;
      state.annotations.forEach(a => {
        summary += `#${a.id} [${a.tagName} | ${a.selector}]: ${a.text}\\n`;
      });
    }

    if (state.edits.size === 0 && state.annotations.length === 0) {
      alert('Chưa có nội dung chỉnh sửa hay chú thích nào để sao chép.');
      return;
    }

    navigator.clipboard.writeText(summary).then(() => {
      copyBtn.innerHTML = '<i class="ph-bold ph-check"></i> Đã sao chép vào Clipboard!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="ph-bold ph-copy text-base"></i> Sao chép yêu cầu cho AI sửa';
      }, 2500);
    });
  });

  // Download JSON
  downloadBtn.addEventListener('click', () => {
    const data = {
      url: window.location.href,
      path: window.location.pathname,
      date: new Date().toISOString(),
      edits: Array.from(state.edits.values()),
      annotations: state.annotations.map(a => ({ id: a.id, selector: a.selector, tagName: a.tagName, text: a.text }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `babyam-annotations-${Date.now()}.json`;
    a.click();
  });

})();
