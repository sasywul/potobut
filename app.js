/* ============================================================
   APP.JS — Core Controller for BeautyPlus-Style Potobut
   State, WebRTC integration, uploaded fallbacks, slot retakes,
   custom frame colors, sticker stamp placements.
   ============================================================ */

(function() {
  'use strict';

  // ---- Application State ----
  const state = {
    currentPage: 'landingPage', // 'landingPage', 'cameraPage', 'customizationPage'
    timer: 3,                 // 3, 5, 10 seconds
    frameCount: 3,            // Grid cuts (2, 3, 4, 5, 6)
    mirror: true,             // Camera mirror mode
    selectedFilter: 'none',   // Active color filter
    capturedFrames: [],       // Array of Canvas elements or loaded Image objects
    selectedTheme: 'classic', // Active character frame preset theme
    selectedThemeColor: '#ffffff', // Solid, gradient or pattern background
    isCapturing: false,       // In capture burst block
    currentCaptureIndex: 0,   // Active capture slot index
    retakeIndex: -1,          // Set when re-shooting an individual slot specifically
    selectedTransformIndex: -1, // Indeks slot foto yang sedang disesuaikan (-1 = tidak ada)
    photoTransforms: [],      // Parameter transformasi tiap slot: { zoom: 1.0, panX: 0, panY: 0 }

    // ---- Admin & Backend State ----
    adminLoggedIn: false,
    settings: {
      event_name: 'Sweet 17th Jessica',
      active_watermark: 'potobut ✦'
    },
    appsScriptUrl: '/api',
    hasDatabaseUrl: false,
    maskedAppsScriptUrl: '',
    customFrames: [],
    loadedFrames: {}
  };

  // ---- DOM Elements Cache ----
  let elements = {};

  // ---- Helper & Static State ----
  let uploadedFrameBase64 = '';
  const staticThemes = [
    { id: 'classic', name: 'Classic White', icon: '⚪' },
    { id: 'mario', name: 'Mario Bros', icon: '🍄' },
    { id: 'batman', name: 'Batman Gotham', icon: '🦇' },
    { id: 'sakura', name: 'Kawaii Sakura', icon: '🌸' },
    { id: 'cyberpunk', name: 'Cyberpunk Neon', icon: '⚡' },
    { id: 'vintage', name: 'Vintage Film', icon: '🎞️' }
  ];

  // ---- Initialize ----
  function init() {
    cacheElements();
    bindEvents();
    PhotoCamera.init();
    updateUI();
    showPlaceholderCamera();
    
    // Sync settings on startup if API is configured
    syncSettingsFromSheets();
  }

  function cacheElements() {
    elements = {
      // Pages
      landingPage: document.getElementById('landingPage'),
      cameraPage: document.getElementById('cameraPage'),
      customizationPage: document.getElementById('customizationPage'),

      // Navigation & Branding
      logoHome: document.getElementById('logoHome'),
      btnLandingStart: document.getElementById('btnLandingStart'),

      // Top Actions Halaman 2
      timerSelector: document.getElementById('timerSelector'),
      imageUploadInput: document.getElementById('imageUploadInput'),

      // Left Sidebar Halaman 2
      btnSidebarKisi: document.getElementById('btnSidebarKisi'),
      btnSidebarFilter: document.getElementById('btnSidebarFilter'),
      btnSidebarMirror: document.getElementById('btnSidebarMirror'),
      submenuKisi: document.getElementById('submenuKisi'),
      submenuFilter: document.getElementById('submenuFilter'),
      filterOptionsStack: document.getElementById('filterOptionsStack'),

      // Viewport & overlay Halaman 2
      cameraPlaceholder: document.getElementById('cameraPlaceholder'),
      videoFeed: document.getElementById('videoFeed'),
      countdownOverlay: document.getElementById('countdownOverlay'),
      countdownDigits: document.getElementById('countdownDigits'),

      // Right Captured Stacks Halaman 2
      capturedThumbsContainer: document.getElementById('capturedThumbsContainer'),
      capturedThumbs: document.getElementById('capturedThumbs'),

      // Bottom Actions Halaman 2
      btnStartCapture: document.getElementById('btnStartCapture'),
      btnCameraNext: document.getElementById('btnCameraNext'),

      // Halaman 3 Workspace
      cutsDropdown: document.getElementById('cutsDropdown'),
      photoStrip: document.getElementById('photoStrip'),
      colorPaletteGrid: document.getElementById('colorPaletteGrid'),
      themePresetsGrid: document.getElementById('themePresetsGrid'),
      adjustPhotoPanel: document.getElementById('adjustPhotoPanel'),
      adjustPanelTitle: document.getElementById('adjustPanelTitle'),
      sliderZoom: document.getElementById('sliderZoom'),
      sliderPanX: document.getElementById('sliderPanX'),
      sliderPanY: document.getElementById('sliderPanY'),
      valZoom: document.getElementById('valZoom'),
      valPanX: document.getElementById('valPanX'),
      valPanY: document.getElementById('valPanY'),
      btnResetTransform: document.getElementById('btnResetTransform'),

      // Bottom Actions Halaman 3
      btnCustomDownload: document.getElementById('btnCustomDownload'),
      btnCustomRestart: document.getElementById('btnCustomRestart'),

      // Flash
      flashOverlay: document.getElementById('flashOverlay'),

      // Admin Panel Elements
      btnHeaderSettings: document.getElementById('btnHeaderSettings'),
      adminLoginModal: document.getElementById('adminLoginModal'),
      adminDashboardModal: document.getElementById('adminDashboardModal'),
      btnCloseLoginModal: document.getElementById('btnCloseLoginModal'),
      btnCloseDashboardModal: document.getElementById('btnCloseDashboardModal'),
      adminPasswordInput: document.getElementById('adminPasswordInput'),
      btnSubmitLogin: document.getElementById('btnSubmitLogin'),
      
      tabConfigBtn: document.getElementById('tabConfigBtn'),
      tabDbBtn: document.getElementById('tabDbBtn'),
      configTab: document.getElementById('configTab'),
      dbTab: document.getElementById('dbTab'),
      
      inputEventName: document.getElementById('inputEventName'),
      inputWatermark: document.getElementById('inputWatermark'),
      inputNewPassword: document.getElementById('inputNewPassword'),
      inputAppsScriptUrl: document.getElementById('inputAppsScriptUrl'),
      dbStatusDot: document.getElementById('dbStatusDot'),
      dbStatusText: document.getElementById('dbStatusText'),
      btnTestDbConnection: document.getElementById('btnTestDbConnection'),
      btnSaveAdminSettings: document.getElementById('btnSaveAdminSettings'),

      // Custom Frame Upload Elements
      tabFramesBtn: document.getElementById('tabFramesBtn'),
      framesTab: document.getElementById('framesTab'),
      frameDropZone: document.getElementById('frameDropZone'),
      inputFrameFile: document.getElementById('inputFrameFile'),
      frameUploadPreviewBox: document.getElementById('frameUploadPreviewBox'),
      imgFrameUploadPreview: document.getElementById('imgFrameUploadPreview'),
      btnRemoveFramePreview: document.getElementById('btnRemoveFramePreview'),
      inputFrameName: document.getElementById('inputFrameName'),
      btnUploadFrame: document.getElementById('btnUploadFrame'),
      adminActiveFramesGrid: document.getElementById('adminActiveFramesGrid'),
      customFrameOverlay: document.getElementById('customFrameOverlay')
    };
  }

  // ---- Event Bindings ----
  function bindEvents() {
    // Page Transitions
    elements.logoHome.addEventListener('click', (e) => { e.preventDefault(); navigateToPage('landingPage'); });
    elements.btnLandingStart.addEventListener('click', () => navigateToPage('cameraPage'));

    // Timer Selector pills
    elements.timerSelector.addEventListener('click', (e) => {
      const pill = e.target.closest('.timer-pill');
      if (pill) {
        elements.timerSelector.querySelectorAll('.timer-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.timer = parseInt(pill.dataset.time);
      }
    });

    // Image Upload fallback
    elements.imageUploadInput.addEventListener('change', handleImageUpload);

    // Left Sidebar Toggles Halaman 2
    elements.btnSidebarKisi.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSubmenu('submenuKisi');
    });
    elements.btnSidebarFilter.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSubmenu('submenuFilter');
    });
    elements.btnSidebarMirror.addEventListener('click', () => {
      state.mirror = !state.mirror;
      elements.btnSidebarMirror.classList.toggle('active', state.mirror);
      PhotoCamera.updateMirror(state.mirror);
    });

    // Submenu click events
    elements.submenuKisi.addEventListener('click', (e) => {
      const opt = e.target.closest('.frame-cut-opt');
      if (opt) {
        elements.submenuKisi.querySelectorAll('.frame-cut-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        state.frameCount = parseInt(opt.dataset.count);
        if (elements.cutsDropdown) { elements.cutsDropdown.value = state.frameCount; }
        
        // Clear excess photos if switching frame count down
        if (state.capturedFrames.length > state.frameCount) {
          state.capturedFrames = state.capturedFrames.slice(0, state.frameCount);
        }
        updateCapturedThumbnailsStack();
        elements.submenuKisi.style.display = 'none';
      }
    });

    elements.submenuFilter.addEventListener('click', (e) => {
      const item = e.target.closest('.filter-opt-item');
      if (item) {
        elements.submenuFilter.querySelectorAll('.filter-opt-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        state.selectedFilter = item.dataset.filter;
        PhotoCamera.setFilter(state.selectedFilter);
        elements.submenuFilter.style.display = 'none';
      }
    });

    // Close popups on click outside
    document.addEventListener('click', () => {
      elements.submenuKisi.style.display = 'none';
      elements.submenuFilter.style.display = 'none';
    });

    // Capture Trigger Actions
    elements.btnStartCapture.addEventListener('click', handleMulaiFoto);
    elements.btnCameraNext.addEventListener('click', () => navigateToPage('customizationPage'));

    // Click right thumbnails to retake individual shot
    elements.capturedThumbs.addEventListener('click', (e) => {
      const slot = e.target.closest('.captured-thumb-slot');
      if (slot && slot.classList.contains('captured')) {
        const index = parseInt(slot.dataset.index);
        handleRetakeSlot(index);
      }
    });

    // Halaman 3 Workspace Controls
    if (elements.cutsDropdown) {
      elements.cutsDropdown.addEventListener('change', (e) => {
        state.frameCount = parseInt(e.target.value);
        // Sync with page 2 kisi
        elements.submenuKisi.querySelectorAll('.frame-cut-opt').forEach(opt => {
          opt.classList.toggle('active', parseInt(opt.dataset.count) === state.frameCount);
        });
        updatePhotoStrip();
      });
    }


    // Custom background color circles selection
    elements.colorPaletteGrid.addEventListener('click', (e) => {
      const circle = e.target.closest('.color-circle');
      if (circle) {
        elements.colorPaletteGrid.querySelectorAll('.color-circle').forEach(c => c.classList.remove('active'));
        circle.classList.add('active');
        state.selectedThemeColor = circle.dataset.color;
        
        // Dynamically apply background color or checkered pattern onto customization strip
        if (state.selectedThemeColor === 'checkered') {
          elements.photoStrip.style.background = 'repeating-conic-gradient(#eeeeee 0% 25%, #ffffff 0% 50%) 50% / 16px 16px';
        } else {
          elements.photoStrip.style.background = state.selectedThemeColor;
        }
      }
    });

    // Character Theme Presets Grid selection
    elements.themePresetsGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-preset-btn');
      if (btn) {
        elements.themePresetsGrid.querySelectorAll('.theme-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedTheme = btn.dataset.theme;
        
        // Fail-safe auto-detect slots count and adjust state.frameCount if custom frame selected
        if (state.selectedTheme.startsWith('FRM_') || state.selectedTheme.startsWith('FRM-')) {
          const frameImg = state.loadedFrames[state.selectedTheme];
          if (frameImg && frameImg !== 'loading') {
            const detected = PhotoThemes.detectTransparentWindows(frameImg);
            if (detected && detected.length !== state.frameCount) {
              state.frameCount = detected.length;
              if (elements.cutsDropdown) { elements.cutsDropdown.value = state.frameCount; }
              // Sync with Halaman 2 cuts selectors
              elements.submenuKisi.querySelectorAll('.frame-cut-opt').forEach(opt => {
                opt.classList.toggle('active', parseInt(opt.dataset.count) === state.frameCount);
              });
              showStatusMessage(`Layout diubah otomatis ke ${state.frameCount} Foto sesuai bingkai kustom! 📸`, "success");
            }
          }
        }
        
        updatePhotoStrip();
      }
    });

    // Unduh (Download PNG) and Mulai Ulang (Restart)
    elements.btnCustomDownload.addEventListener('click', handleSaveExport);
    elements.btnCustomRestart.addEventListener('click', handleRestartAll);

    // ---- Admin Bindings ----
    let settingsClickCount = 0;
    let settingsClickTimer;
    
    if (elements.btnHeaderSettings) {
      elements.btnHeaderSettings.addEventListener('click', (e) => {
        e.preventDefault();
        settingsClickCount++;
        clearTimeout(settingsClickTimer);
        settingsClickTimer = setTimeout(() => { settingsClickCount = 0; }, 2000);
        
        if (settingsClickCount >= 5) {
          settingsClickCount = 0;
          window.location.href = 'admin.html';
        }
      });
    }

    elements.btnCloseLoginModal.addEventListener('click', () => {
      elements.adminLoginModal.style.display = 'none';
    });

    elements.btnCloseDashboardModal.addEventListener('click', () => {
      elements.adminDashboardModal.style.display = 'none';
    });

    elements.tabConfigBtn.addEventListener('click', () => {
      elements.tabConfigBtn.classList.add('active');
      elements.tabDbBtn.classList.remove('active');
      elements.tabFramesBtn.classList.remove('active');
      elements.configTab.style.display = 'block';
      elements.dbTab.style.display = 'none';
      elements.framesTab.style.display = 'none';
    });

    elements.tabDbBtn.addEventListener('click', () => {
      elements.tabDbBtn.classList.add('active');
      elements.tabConfigBtn.classList.remove('active');
      elements.tabFramesBtn.classList.remove('active');
      elements.dbTab.style.display = 'block';
      elements.configTab.style.display = 'none';
      elements.framesTab.style.display = 'none';
    });

    elements.tabFramesBtn.addEventListener('click', () => {
      elements.tabFramesBtn.classList.add('active');
      elements.tabConfigBtn.classList.remove('active');
      elements.tabDbBtn.classList.remove('active');
      elements.framesTab.style.display = 'block';
      elements.configTab.style.display = 'none';
      elements.dbTab.style.display = 'none';
      
      // Render the active frames grid inside dashboard
      renderActiveFramesGrid();
    });

    // Custom Frame Upload drag-and-drop
    elements.frameDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      elements.frameDropZone.classList.add('dragover');
    });

    elements.frameDropZone.addEventListener('dragleave', () => {
      elements.frameDropZone.classList.remove('dragover');
    });

    elements.frameDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      elements.frameDropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        elements.inputFrameFile.files = e.dataTransfer.files;
        handleFrameFileSelected(e.dataTransfer.files[0]);
      }
    });

    elements.inputFrameFile.addEventListener('change', (e) => {
      if (e.target.files.length) {
        handleFrameFileSelected(e.target.files[0]);
      }
    });

    elements.btnRemoveFramePreview.addEventListener('click', (e) => {
      e.stopPropagation();
      resetFrameUploadPreview();
    });

    elements.btnUploadFrame.addEventListener('click', handleUploadFrame);

    elements.btnSubmitLogin.addEventListener('click', handleAdminLogin);
    elements.adminPasswordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAdminLogin();
    });

    elements.btnTestDbConnection.addEventListener('click', handleTestConnection);
    elements.btnSaveAdminSettings.addEventListener('click', handleSaveAdminSettings);

    // Dynamic slider adjustments
    elements.sliderZoom.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      elements.valZoom.textContent = val.toFixed(1) + 'x';
      const idx = state.selectedTransformIndex;
      if (idx !== -1 && state.photoTransforms[idx]) {
        state.photoTransforms[idx].zoom = val;
        updateLivePhotoTransform(idx);
      }
    });

    elements.sliderPanX.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      elements.valPanX.textContent = val + '%';
      const idx = state.selectedTransformIndex;
      if (idx !== -1 && state.photoTransforms[idx]) {
        state.photoTransforms[idx].panX = val;
        updateLivePhotoTransform(idx);
      }
    });

    elements.sliderPanY.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      elements.valPanY.textContent = val + '%';
      const idx = state.selectedTransformIndex;
      if (idx !== -1 && state.photoTransforms[idx]) {
        state.photoTransforms[idx].panY = val;
        updateLivePhotoTransform(idx);
      }
    });

    elements.btnResetTransform.addEventListener('click', () => {
      const idx = state.selectedTransformIndex;
      if (idx !== -1 && state.photoTransforms[idx]) {
        state.photoTransforms[idx] = { zoom: 1.0, panX: 0, panY: 0 };
        
        // Reset slider UI
        elements.sliderZoom.value = 1.0;
        elements.sliderPanX.value = 0;
        elements.sliderPanY.value = 0;
        
        elements.valZoom.textContent = '1.0x';
        elements.valPanX.textContent = '0%';
        elements.valPanY.textContent = '0%';
        
        updateLivePhotoTransform(idx);
        showStatusMessage('Posisi foto slot #' + (idx + 1) + ' berhasil direset! 🔄', 'success');
      }
    });
  }

  // ---- Page Switching & Routing ----
  async function navigateToPage(pageId) {
    state.currentPage = pageId;

    // Show only current page wrapper
    elements.landingPage.classList.toggle('active', pageId === 'landingPage');
    elements.cameraPage.classList.toggle('active', pageId === 'cameraPage');
    elements.customizationPage.classList.toggle('active', pageId === 'customizationPage');

    // Camera power state logic per page
    if (pageId === 'cameraPage') {
      const success = await PhotoCamera.startCamera();
      if (success) {
        elements.cameraPlaceholder.style.display = 'none';
        elements.videoFeed.style.display = 'block';
        PhotoCamera.updateMirror(state.mirror);
        PhotoCamera.setFilter(state.selectedFilter);
      } else {
        showPlaceholderCamera();
      }
      updateCapturedThumbnailsStack();
    } else {
      PhotoCamera.stopCamera();
      showPlaceholderCamera();
    }

    if (pageId === 'customizationPage') {
      // Reset selected slot transformations focus on page entry
      state.selectedTransformIndex = -1;
      if (elements.adjustPhotoPanel) {
        elements.adjustPhotoPanel.style.display = 'none';
      }
      updatePhotoStrip();

      // Auto-upload ke Google Drive & Spreadsheet begitu masuk halaman hasil
      if (state.capturedFrames.length > 0 && state.appsScriptUrl) {
        setTimeout(() => {
          const finalCanvas = generateFinalCanvas();
          const base64Data = finalCanvas.toDataURL('image/png');
          uploadToGoogleDriveBackground(base64Data);
        }, 500);
      }
    }
  }

  // ---- Halaman 2: Camera & Capture Actions ----
  function toggleSubmenu(id) {
    const Kisi = elements.submenuKisi;
    const Filter = elements.submenuFilter;
    const Ratio = elements.submenuRatio;

    if (id === 'submenuKisi') {
      Kisi.style.display = Kisi.style.display === 'none' ? 'block' : 'none';
      Filter.style.display = 'none';
      Ratio.style.display = 'none';
    } else if (id === 'submenuFilter') {
      Filter.style.display = Filter.style.display === 'none' ? 'block' : 'none';
      Kisi.style.display = 'none';
      Ratio.style.display = 'none';
    } else if (id === 'submenuRatio') {
      Ratio.style.display = Ratio.style.display === 'none' ? 'block' : 'none';
      Kisi.style.display = 'none';
      Filter.style.display = 'none';
    }
  }

  async function handleMulaiFoto() {
    if (state.isCapturing) return;
    if (!PhotoCamera.isActive()) {
      alert('Aktifkan kamera terlebih dahulu!');
      return;
    }

    state.isCapturing = true;
    state.capturedFrames = [];
    state.retakeIndex = -1;
    elements.btnStartCapture.style.display = 'none';
    elements.btnCameraNext.style.display = 'none';
    elements.capturedThumbsContainer.style.display = 'block';
    
    updateCapturedThumbnailsStack();

    await PhotoCamera.runCaptureSequence(
      state.frameCount,
      state.timer,
      // onCountdown tick
      (sec, index) => {
        elements.countdownOverlay.style.display = 'flex';
        elements.countdownDigits.textContent = sec;
      },
      // onCapture snapshot
      (canvas, index) => {
        state.capturedFrames[index] = canvas;
        elements.countdownOverlay.style.display = 'none';
        
        // Update vertical thumbnails list
        updateCapturedThumbnailsStack();
      },
      // onComplete sequence
      () => {
        state.isCapturing = false;
        elements.btnStartCapture.style.display = 'inline-block';
        elements.btnStartCapture.textContent = '📸 Foto Ulang';
        elements.btnCameraNext.style.display = 'inline-block';
      }
    );
  }

  // Single-slot individual photo retaking
  async function handleRetakeSlot(slotIndex) {
    if (state.isCapturing) return;
    if (!PhotoCamera.isActive()) {
      alert('Aktifkan kamera terlebih dahulu!');
      return;
    }

    state.isCapturing = true;
    state.retakeIndex = slotIndex;
    elements.btnStartCapture.style.display = 'none';
    elements.btnCameraNext.style.display = 'none';

    // Start a single countdown for the specified slot index
    for (let sec = state.timer; sec > 0; sec--) {
      elements.countdownOverlay.style.display = 'flex';
      elements.countdownDigits.textContent = sec;
      await new Promise(r => setTimeout(r, 1000));
    }

    // Trigger flash snapshot
    PhotoCamera.triggerFlash();
    await new Promise(r => setTimeout(r, 200));

    // Swap photo in capture frames
    const newCanvas = PhotoCamera.captureFrame();
    if (newCanvas) {
      state.capturedFrames[slotIndex] = newCanvas;
    }

    elements.countdownOverlay.style.display = 'none';
    state.isCapturing = false;
    state.retakeIndex = -1;

    elements.btnStartCapture.style.display = 'inline-block';
    elements.btnCameraNext.style.display = 'inline-block';

    updateCapturedThumbnailsStack();
  }

  // Dynamic file upload
  function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let loadedCount = 0;
    const maxToLoad = Math.min(files.length, state.frameCount);
    
    // Clear previous frames
    state.capturedFrames = [];

    files.slice(0, maxToLoad).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Render image onto a scaling canvas to fit photobooth aspect ratios
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          
          // Center draw image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          state.capturedFrames[idx] = canvas;
          loadedCount++;

          if (loadedCount === maxToLoad) {
            updateCapturedThumbnailsStack();
            elements.capturedThumbsContainer.style.display = 'block';
            elements.btnStartCapture.style.display = 'inline-block';
            elements.btnStartCapture.textContent = '📸 Ambil Ulang Kamera';
            elements.btnCameraNext.style.display = 'inline-block';
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function updateCapturedThumbnailsStack() {
    const thumbs = elements.capturedThumbs;
    thumbs.innerHTML = '';

    for (let i = 0; i < state.frameCount; i++) {
      const slot = document.createElement('div');
      slot.className = 'captured-thumb-slot';
      slot.dataset.index = i;

      const num = document.createElement('span');
      num.className = 'slot-number';
      num.textContent = i + 1;
      slot.appendChild(num);

      if (state.capturedFrames[i]) {
        slot.classList.add('captured');
        const img = document.createElement('img');
        img.src = state.capturedFrames[i].toDataURL('image/jpeg', 0.8);
        slot.appendChild(img);
      } else {
        const placeholderText = document.createElement('div');
        placeholderText.style.width = '100%';
        placeholderText.style.height = '100%';
        placeholderText.style.display = 'flex';
        placeholderText.style.alignItems = 'center';
        placeholderText.style.justifyContent = 'center';
        placeholderText.style.fontSize = '0.7rem';
        placeholderText.style.color = '#bbb';
        placeholderText.textContent = `Pending ${i + 1}`;
        slot.appendChild(placeholderText);
      }

      thumbs.appendChild(slot);
    }
  }

  function updatePhotoStrip() {
    const strip = elements.photoStrip;
    
    // Clear and rebuild photo strip
    strip.innerHTML = '';

    // Fail-safe inline styles to force relative positioning, containment, and perfect canvas proportions
    // This guarantees the custom frame stays perfectly bound to the strip, bypassing browser/CDN stylesheet cache issues.
    strip.style.position = 'relative';
    strip.style.overflow = 'hidden';
    strip.style.width = '150px';
    strip.style.padding = '9px'; // Exact 6% padding (same as canvas)
    strip.style.gap = '3px';      // Exact 2% gap (same as canvas)
    strip.style.display = 'flex';
    strip.style.flexDirection = 'column';

    // Create custom transparent PNG frame overlay dynamically
    const overlay = document.createElement('img');
    overlay.id = 'customFrameOverlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10';
    
    if (state.selectedTheme.startsWith('FRM_') || state.selectedTheme.startsWith('FRM-')) {
      const frame = state.customFrames.find(f => f.id === state.selectedTheme);
      if (frame) {
        overlay.src = '/api?action=proxyImage&url=' + encodeURIComponent(frame.url);
        overlay.style.display = 'block';
      } else {
        overlay.style.display = 'none';
      }
    } else {
      overlay.style.display = 'none';
    }
    strip.appendChild(overlay);

    const themeBackgrounds = {
      classic: state.selectedThemeColor, // respects custom color selection
      mario: '#E52521',
      batman: '#1A1A1A',
      sakura: '#FFEBEF',
      cyberpunk: '#0A0515',
      vintage: '#F4ECD8'
    };

    const isCustomFrame = state.selectedTheme.startsWith('FRM_') || state.selectedTheme.startsWith('FRM-');
    const themeBg = isCustomFrame ? state.selectedThemeColor : (themeBackgrounds[state.selectedTheme] || '#ffffff');
    
    if (state.selectedTheme === 'classic' || isCustomFrame) {
      if (themeBg === 'checkered') {
        strip.style.background = 'repeating-conic-gradient(#eeeeee 0% 25%, #ffffff 0% 50%) 50% / 16px 16px';
      } else if (themeBg.includes('gradient')) {
        strip.style.background = themeBg;
      } else {
        strip.style.background = themeBg;
      }
    } else {
      strip.style.background = themeBg;
    }

    const borders = {
      classic: '1px solid rgba(0,0,0,0.06)',
      mario: '4px solid #000000',
      batman: '3px solid #FDE100',
      sakura: '1px solid rgba(0,0,0,0.06)',
      cyberpunk: '4px solid #FF007A',
      vintage: '1.5px solid #4A3E3D'
    };
    const photoBorder = borders[state.selectedTheme || 'classic'] || '1px solid rgba(0,0,0,0.06)';

    // Ensure state.photoTransforms is fully initialized
    if (!state.photoTransforms || state.photoTransforms.length !== state.frameCount) {
      state.photoTransforms = [];
      for (let i = 0; i < state.frameCount; i++) {
        state.photoTransforms.push({ zoom: 1.0, panX: 0, panY: 0 });
      }
    }

    const isCustom = state.selectedTheme.startsWith('FRM_') || state.selectedTheme.startsWith('FRM-');
    const frameImg = isCustom && state.loadedFrames[state.selectedTheme] && state.loadedFrames[state.selectedTheme] !== 'loading' ? state.loadedFrames[state.selectedTheme] : null;
    const detectedSlots = frameImg ? PhotoThemes.detectTransparentWindows(frameImg) : null;
    const slotsCount = detectedSlots ? detectedSlots.length : state.frameCount;

    if (detectedSlots && frameImg) {
      const frameW = frameImg.width || 600;
      const frameH = frameImg.height || 1800;
      strip.style.height = (150 * (frameH / frameW)) + 'px';
      strip.style.padding = '0px';
      strip.style.gap = '0px';
    } else {
      strip.style.height = 'auto';
      strip.style.padding = '9px'; // Exact 6% padding (same as canvas)
      strip.style.gap = '3px';      // Exact 2% gap (same as canvas)
    }

    for (let i = 0; i < slotsCount; i++) {
      const photoDiv = document.createElement('div');
      photoDiv.className = 'strip-photo';
      photoDiv.dataset.index = i;

      if (detectedSlots && frameImg) {
        const slot = detectedSlots[i];
        const pctLeft = (slot.left / frameImg.width) * 100;
        const pctTop = (slot.top / frameImg.height) * 100;
        const pctWidth = (slot.width / frameImg.width) * 100;
        const pctHeight = (slot.height / frameImg.height) * 100;
        
        photoDiv.style.position = 'absolute';
        // Add 1px overflow bleed so there are absolutely no subpixel line gaps around edges
        photoDiv.style.left = `calc(${pctLeft}% - 1px)`;
        photoDiv.style.top = `calc(${pctTop}% - 1px)`;
        photoDiv.style.width = `calc(${pctWidth}% + 2px)`;
        photoDiv.style.height = `calc(${pctHeight}% + 2px)`;
        
        photoDiv.style.borderRadius = '0px';
        photoDiv.style.border = 'none';
        photoDiv.style.margin = '0px';
      } else {
        photoDiv.style.position = 'relative';
        photoDiv.style.left = 'auto';
        photoDiv.style.top = 'auto';
        photoDiv.style.width = '100%';
        photoDiv.style.height = 'auto';
        photoDiv.style.aspectRatio = '4/3';
        photoDiv.style.border = photoBorder;
        photoDiv.style.borderRadius = '8px';
      }
      
      // Auto highlight active selected slot
      if (state.selectedTransformIndex === i) {
        photoDiv.classList.add('selected');
      }

      if (state.capturedFrames[i]) {
        const img = document.createElement('img');
        img.src = state.capturedFrames[i].toDataURL('image/jpeg', 0.9);
        
        // Apply individual slot CSS GPU-accelerated transforms
        const t = state.photoTransforms[i] || { zoom: 1.0, panX: 0, panY: 0 };
        img.style.transform = `scale(${t.zoom}) translate(${t.panX}%, ${t.panY}%)`;
        
        photoDiv.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'camera-placeholder';
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `<span>${i + 1}</span>`;
        photoDiv.appendChild(placeholder);
      }

      // Click to select slot for adjustment
      photoDiv.addEventListener('click', () => {
        state.selectedTransformIndex = i;
        document.querySelectorAll('.photo-strip .strip-photo').forEach((el, idx) => {
          el.classList.toggle('selected', idx === i);
        });
        showTransformControls(i);
      });

      strip.appendChild(photoDiv);
    }

    // Append branding signature
    const branding = document.createElement('div');
    branding.className = 'strip-branding';
    branding.style.display = 'flex';
    branding.style.flexDirection = 'column';
    branding.style.alignItems = 'center';
    branding.style.gap = '2px';
    
    const themeTitles = {
      classic: state.settings.active_watermark || 'potobut ✦',
      mario: 'SUPER MARIO 🍄',
      batman: 'GOTHAM KNIGHT 🦇',
      sakura: 'SWEET SAKURA 🌸',
      cyberpunk: 'NEON CITY ⚡',
      vintage: (state.settings.active_watermark || 'POTOBUT FILM 🎞️').toUpperCase()
    };
    
    const mainBrandingText = document.createElement('div');
    mainBrandingText.textContent = themeTitles[state.selectedTheme || 'classic'] || 'potobut ✦';
    
    if ((state.selectedTheme || 'classic') === 'mario') {
      mainBrandingText.style.color = '#FDE100';
      mainBrandingText.style.textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';
    } else if ((state.selectedTheme || 'classic') === 'batman') {
      mainBrandingText.style.color = '#FDE100';
      mainBrandingText.style.textShadow = 'none';
    } else if ((state.selectedTheme || 'classic') === 'cyberpunk') {
      mainBrandingText.style.color = '#00F0FF';
      mainBrandingText.style.textShadow = '0 0 6px #00F0FF';
    } else if ((state.selectedTheme || 'classic') === 'vintage') {
      mainBrandingText.style.color = '#4A3E3D';
      mainBrandingText.style.textShadow = 'none';
      mainBrandingText.style.fontFamily = '"Courier New", monospace';
      mainBrandingText.style.fontWeight = 'bold';
    } else {
      mainBrandingText.style.color = '#FF5A87';
      mainBrandingText.style.textShadow = 'none';
      mainBrandingText.style.fontFamily = 'inherit';
    }

    branding.appendChild(mainBrandingText);

    // Dynamic subtitle for event name
    if (state.settings.event_name) {
      const eventSubtitle = document.createElement('div');
      eventSubtitle.className = 'strip-event-subtitle';
      eventSubtitle.textContent = state.settings.event_name;
      eventSubtitle.style.fontSize = '0.6rem';
      
      if ((state.selectedTheme || 'classic') === 'mario') {
        eventSubtitle.style.color = '#ffffff';
        eventSubtitle.style.fontWeight = 'bold';
        eventSubtitle.style.textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';
      } else if ((state.selectedTheme || 'classic') === 'batman') {
        eventSubtitle.style.color = '#ffffff';
        eventSubtitle.style.fontWeight = 'bold';
      } else if ((state.selectedTheme || 'classic') === 'cyberpunk') {
        eventSubtitle.style.color = '#FF007A';
        eventSubtitle.style.fontWeight = 'bold';
        eventSubtitle.style.textShadow = '0 0 4px #FF007A';
      } else if ((state.selectedTheme || 'classic') === 'vintage') {
        eventSubtitle.style.color = '#4A3E3D';
        eventSubtitle.style.fontFamily = '"Courier New", monospace';
        eventSubtitle.style.fontWeight = 'bold';
      } else {
        eventSubtitle.style.color = '#888888';
        eventSubtitle.style.fontFamily = 'inherit';
      }
      branding.appendChild(eventSubtitle);
    }
    
    if (detectedSlots && frameImg) {
      branding.style.position = 'absolute';
      branding.style.bottom = '8px';
      branding.style.width = '100%';
      branding.style.left = '0';
      branding.style.zIndex = '15';
      branding.style.pointerEvents = 'none';
    } else {
      branding.style.position = 'static';
      branding.style.bottom = 'auto';
      branding.style.width = 'auto';
      branding.style.left = 'auto';
      branding.style.zIndex = 'auto';
      branding.style.pointerEvents = 'auto';
    }
    
    strip.appendChild(branding);
  }

  // ---- Composite Canvas Export ----
  function generateFinalCanvas() {
    const stripW = 600;
    const padding = stripW * 0.06;
    const photoW = stripW - padding * 2;
    const photoH = photoW * 0.75; // Strict 4:3 Aspect Ratio (528w * 396h = 396px)
    const gap = 12;
    const footerH = stripW * 0.12;
    const stripH = padding * 2 + state.frameCount * photoH + (state.frameCount - 1) * gap + footerH;

    const canvas = document.createElement('canvas');
    canvas.width = stripW;
    canvas.height = stripH;
    
    // Call the PhotoThemes render engine with local settings, preloaded custom frames, and slot transformations
    PhotoThemes.renderTheme(
      state.selectedTheme || 'classic', 
      canvas, 
      state.capturedFrames, 
      state.selectedThemeColor, 
      state.settings,
      state.loadedFrames,
      state.photoTransforms
    );

    return canvas;
  }

  function handleSaveExport() {
    if (state.capturedFrames.length === 0) {
      alert('Belum ada foto yang diambil/diunggah!');
      return;
    }

    const finalCanvas = generateFinalCanvas();
    const base64Data = finalCanvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = `potobut_${Date.now()}.png`;
    link.href = base64Data;
    link.click();

    // Show local success toast
    showStatusMessage('Foto berhasil diunduh! 📸', 'success');

    // Trigger silent background upload to Google Drive
    if (state.appsScriptUrl) {
      uploadToGoogleDriveBackground(base64Data);
    }
  }

  function handleRestartAll() {
    state.capturedFrames = [];
    state.selectedTheme = 'classic';
    state.selectedFilter = 'none';
    state.selectedThemeColor = '#ffffff';
    state.selectedTransformIndex = -1;
    state.photoTransforms = [];
    if (elements.adjustPhotoPanel) {
      elements.adjustPhotoPanel.style.display = 'none';
    }
    
    // Reset inputs & lists
    elements.imageUploadInput.value = '';
    elements.btnStartCapture.textContent = '📸 Mulai Foto';
    elements.btnCameraNext.style.display = 'none';
    elements.capturedThumbsContainer.style.display = 'none';

    // Reset default selections
    elements.colorPaletteGrid.querySelectorAll('.color-circle').forEach(c => {
      c.classList.toggle('active', c.dataset.color === '#ffffff');
    });

    if (elements.themePresetsGrid) {
      elements.themePresetsGrid.querySelectorAll('.theme-preset-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === 'classic');
      });
    }

    updateUI();
    navigateToPage('cameraPage');
  }

  // ---- UI Refresher Utilities ----
  function showPlaceholderCamera() {
    elements.cameraPlaceholder.style.display = 'flex';
    elements.videoFeed.style.display = 'none';
  }

  function showStatusMessage(text, type = 'success') {
    const existing = document.querySelector('.status-message');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className = `status-message ${type}`;
    msg.textContent = text;
    document.body.appendChild(msg);

    setTimeout(() => msg.remove(), 3000);
  }

  function updateUI() {
    PhotoCamera.updateMirror(state.mirror);
    PhotoCamera.setFilter(state.selectedFilter);
    updateCapturedThumbnailsStack();
    updatePhotoStrip();
  }

  function showTransformControls(index) {
    const t = state.photoTransforms[index] || { zoom: 1.0, panX: 0, panY: 0 };
    
    // Set panel title
    elements.adjustPanelTitle.textContent = `🛠️ Sesuaikan Foto #${index + 1}`;
    
    // Bind slider values
    elements.sliderZoom.value = t.zoom;
    elements.sliderPanX.value = t.panX;
    elements.sliderPanY.value = t.panY;
    
    elements.valZoom.textContent = t.zoom.toFixed(1) + 'x';
    elements.valPanX.textContent = t.panX + '%';
    elements.valPanY.textContent = t.panY + '%';
    
    // Show premium sliders card
    elements.adjustPhotoPanel.style.display = 'block';
  }

  function updateLivePhotoTransform(index) {
    const slot = document.querySelector(`.photo-strip .strip-photo[data-index="${index}"]`);
    if (slot) {
      const img = slot.querySelector('img');
      if (img) {
        const t = state.photoTransforms[index];
        img.style.transform = `scale(${t.zoom}) translate(${t.panX}%, ${t.panY}%)`;
      }
    }
  }

  // ---- Admin Panel Handlers & API ----
  function openAdminLogin() {
    elements.adminPasswordInput.value = '';
    elements.adminLoginModal.style.display = 'flex';
    elements.adminPasswordInput.focus();
  }

  async function handleAdminLogin() {
    const password = elements.adminPasswordInput.value.trim();
    if (!password) {
      alert('Masukkan sandi admin!');
      return;
    }

    elements.btnSubmitLogin.disabled = true;
    elements.btnSubmitLogin.textContent = 'Memverifikasi...';

    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password: password })
      });
      const res = await response.json();
      
      if (res.success) {
        state.adminLoggedIn = true;
        elements.adminLoginModal.style.display = 'none';
        openAdminDashboard(password);
      } else {
        alert('Sandi salah: ' + (res.message || 'Silakan cek kembali database Anda.'));
      }
    } catch (err) {
      console.error('API Error, falling back to local password check', err);
      // Fallback offline
      if (password === 'rahasia123') {
        state.adminLoggedIn = true;
        elements.adminLoginModal.style.display = 'none';
        openAdminDashboard(password);
        showStatusMessage('Koneksi Gagal. Masuk mode offline.', 'error');
      } else {
        alert('Gagal menghubungi server backend. Coba sandi offline "rahasia123".');
      }
    }

    elements.btnSubmitLogin.disabled = false;
    elements.btnSubmitLogin.textContent = 'Masuk';
  }

  function openAdminDashboard(currentPassword) {
    // Fill values
    elements.inputEventName.value = state.settings.event_name;
    elements.inputWatermark.value = state.settings.active_watermark;
    elements.inputNewPassword.value = '';
    elements.inputAppsScriptUrl.value = state.maskedAppsScriptUrl;
    
    // Reset tab views
    elements.tabConfigBtn.click();
    
    // Check connection status instantly
    updateDbStatusUI();

    elements.adminDashboardModal.style.display = 'flex';
  }

  async function handleTestConnection() {
    const url = elements.inputAppsScriptUrl.value.trim();
    if (!url) {
      alert('Masukkan URL Apps Script terlebih dahulu!');
      return;
    }

    elements.btnTestDbConnection.disabled = true;
    elements.btnTestDbConnection.textContent = 'Menghubungkan...';

    try {
      // 1. Simpan URL baru ke server secara rahasia (hanya jika diketik manual/bukan masked)
      if (!url.includes('...')) {
        const saveResponse = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'saveUrl', url: url })
        });
        const saveRes = await saveResponse.json();
        if (!saveRes.success) throw new Error(saveRes.message);
        state.maskedAppsScriptUrl = url;
      }

      // 2. Uji coba fetch getSettings untuk memverifikasi fungsionalitas URL via Proxy
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSettings' })
      });
      const res = await response.json();
      if (res.success) {
        state.hasDatabaseUrl = true;
        elements.dbStatusDot.className = 'status-dot connected';
        elements.dbStatusText.textContent = 'Connected (Google Sheets terhubung!)';
        showStatusMessage('Database sukses terhubung!', 'success');
      } else {
        state.hasDatabaseUrl = false;
        elements.dbStatusDot.className = 'status-dot disconnected';
        elements.dbStatusText.textContent = 'Error: ' + (res.message || 'Gagal membaca settings');
      }
    } catch(err) {
      console.error(err);
      state.hasDatabaseUrl = false;
      elements.dbStatusDot.className = 'status-dot disconnected';
      elements.dbStatusText.textContent = 'Disconnected (Gagal menghubungkan)';
      alert('Koneksi Gagal: ' + err.message);
    }

    elements.btnTestDbConnection.disabled = false;
    elements.btnTestDbConnection.textContent = 'Tes Koneksi Database';
  }

  async function handleSaveAdminSettings() {
    const eventName = elements.inputEventName.value.trim();
    const watermark = elements.inputWatermark.value.trim();
    const newPassword = elements.inputNewPassword.value.trim();
    const newApiUrl = elements.inputAppsScriptUrl.value.trim();
    
    const currentPassword = elements.adminPasswordInput.value.trim();

    elements.btnSaveAdminSettings.disabled = true;
    elements.btnSaveAdminSettings.textContent = 'Menyimpan...';

    try {
      // 1. Simpan URL baru ke server secara rahasia (jika diubah)
      if (newApiUrl && !newApiUrl.includes('...')) {
        const saveResponse = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'saveUrl', url: newApiUrl })
        });
        const saveRes = await saveResponse.json();
        if (!saveRes.success) throw new Error(saveRes.message);
        state.maskedAppsScriptUrl = newApiUrl;
      }

      // 2. Simpan pengaturan (watermark & event name) ke spreadsheet via Proxy
      const payload = {
        action: 'updateSettings',
        adminPassword: currentPassword,
        settings: {
          event_name: eventName,
          active_watermark: watermark
        }
      };
      
      if (newPassword) {
        payload.settings.admin_password = newPassword;
      }

      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const res = await response.json();
      
      if (!res.success) {
        throw new Error(res.message || 'Gagal menyimpan ke spreadsheet.');
      }

      // Save locally
      state.settings.event_name = eventName;
      state.settings.active_watermark = watermark;

      // Update on-screen UI
      updateUI();

      elements.adminDashboardModal.style.display = 'none';
      showStatusMessage('Pengaturan berhasil diperbarui!', 'success');

    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengaturan: ' + err.message + '\nPengaturan disimpan secara lokal saja.');
      
      // Save locally as fallback
      state.settings.event_name = eventName;
      state.settings.active_watermark = watermark;
      updateUI();
      elements.adminDashboardModal.style.display = 'none';
    }

    elements.btnSaveAdminSettings.disabled = false;
    elements.btnSaveAdminSettings.textContent = 'Simpan Perubahan';
  }

  function renderThemePresets() {
    const grid = elements.themePresetsGrid;
    if (!grid) return;

    // 1. Remove all existing dynamic theme buttons (custom frames)
    const dynamicButtons = grid.querySelectorAll('.theme-preset-btn[data-theme*="FRM"]');
    dynamicButtons.forEach(btn => btn.remove());

    // 2. Append new dynamic custom frames from state
    state.customFrames.forEach(frame => {
      const btn = document.createElement('button');
      btn.className = `theme-preset-btn${state.selectedTheme === frame.id ? ' active' : ''}`;
      btn.dataset.theme = frame.id;
      btn.title = frame.name;
      btn.innerHTML = `
        <span class="preset-icon">🖼️</span>
        <span class="preset-name">${frame.name}</span>
      `;
      grid.appendChild(btn);
    });
  }

  function preloadFrameImage(frame) {
    if (state.loadedFrames[frame.id]) return; // already loaded or loading
    
    // Set a placeholder to prevent duplicate loading
    state.loadedFrames[frame.id] = 'loading';

    const img = new Image();
    img.onload = () => {
      state.loadedFrames[frame.id] = img;
      console.log(`Frame image preloaded: ${frame.id}`);
      // Refresh UI and auto-detect slots count in case we are on customization screen
      if (state.selectedTheme === frame.id) {
        const detected = PhotoThemes.detectTransparentWindows(img);
        if (detected && detected.length !== state.frameCount) {
          state.frameCount = detected.length;
          if (elements.cutsDropdown) { elements.cutsDropdown.value = state.frameCount; }
          // Sync with Halaman 2 cuts selectors
          elements.submenuKisi.querySelectorAll('.frame-cut-opt').forEach(opt => {
            opt.classList.toggle('active', parseInt(opt.dataset.count) === state.frameCount);
          });
          showStatusMessage(`Layout diubah otomatis ke ${state.frameCount} Foto sesuai bingkai kustom! 📸`, "success");
        }
        updatePhotoStrip();
      }
    };
    img.onerror = (err) => {
      console.error(`Failed to preload frame ${frame.id}:`, err);
      // Remove loading status to allow retry
      delete state.loadedFrames[frame.id];
    };
    // Use GET proxyImage handler to avoid all CORS/tainting canvas blocks!
    img.src = '/api?action=proxyImage&url=' + encodeURIComponent(frame.url);
  }

  function handleFrameFileSelected(file) {
    if (!file) return;
    if (file.type !== 'image/png') {
      alert('Hanya diperbolehkan mengunggah file PNG transparan!');
      elements.inputFrameFile.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedFrameBase64 = e.target.result;
      
      // Update UI elements
      elements.lblFrameFile.style.display = 'none';
      elements.frameUploadPreviewBox.style.display = 'flex';
      elements.imgFrameUploadPreview.src = uploadedFrameBase64;
      
      // Automatically fill the name of the frame with the file name (without extension)
      const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      elements.inputFrameName.value = fileNameWithoutExt;
    };
    reader.readAsDataURL(file);
  }

  function resetFrameUploadPreview() {
    uploadedFrameBase64 = '';
    elements.inputFrameFile.value = '';
    elements.lblFrameFile.style.display = 'block';
    elements.frameUploadPreviewBox.style.display = 'none';
    elements.imgFrameUploadPreview.src = '';
    elements.inputFrameName.value = '';
  }

  async function handleUploadFrame() {
    if (!uploadedFrameBase64) {
      alert('Pilih file frame (PNG) terlebih dahulu!');
      return;
    }
    const name = elements.inputFrameName.value.trim();
    if (!name) {
      alert('Silakan isi nama frame kustom terlebih dahulu!');
      elements.inputFrameName.focus();
      return;
    }

    // Check if database is connected
    if (!state.hasDatabaseUrl) {
      alert('Database tidak terhubung! Silakan hubungkan database terlebih dahulu di tab Koneksi Database.');
      return;
    }

    elements.btnUploadFrame.disabled = true;
    elements.btnUploadFrame.textContent = 'Mengunggah...';

    try {
      const payload = {
        action: 'uploadCustomFrame',
        image: uploadedFrameBase64,
        frameName: name
      };

      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const res = await response.json();

      if (res.success && res.data) {
        showStatusMessage('Frame berhasil diunggah dan diaktifkan!', 'success');
        
        // Add to state
        const newFrame = {
          id: res.data.id,
          name: res.data.name,
          url: res.data.url
        };
        state.customFrames.push(newFrame);
        
        // Preload and refresh
        preloadFrameImage(newFrame);
        renderThemePresets();
        
        // Reset preview
        resetFrameUploadPreview();
        
        // Refresh active list in dashboard
        renderActiveFramesGrid();
      } else {
        alert('Gagal mengunggah: ' + (res.message || 'Error tidak diketahui'));
      }
    } catch(err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengunggah frame: ' + err.message);
    } finally {
      elements.btnUploadFrame.disabled = false;
      elements.btnUploadFrame.textContent = '🚀 Upload & Aktifkan';
    }
  }

  function renderActiveFramesGrid() {
    const grid = elements.adminActiveFramesGrid;
    if (!grid) return;
    grid.innerHTML = '';

    if (state.customFrames.length === 0) {
      grid.innerHTML = '<div class="no-frames-text">Belum ada frame kustom aktif.</div>';
      return;
    }

    state.customFrames.forEach(frame => {
      const card = document.createElement('div');
      card.className = 'active-frame-card';
      
      card.innerHTML = `
        <div class="frame-thumb">
          <img src="/api?action=proxyImage&url=${encodeURIComponent(frame.url)}" alt="${frame.name}">
        </div>
        <div class="frame-title" title="${frame.name}">${frame.name}</div>
      `;
      grid.appendChild(card);
    });
  }

  async function syncSettingsFromSheets() {
    try {
      // 1. Ambil status URL database dari server
      const urlResponse = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getUrl' })
      });
      const urlRes = await urlResponse.json();
      
      if (urlRes.success && urlRes.has_url) {
        state.hasDatabaseUrl = true;
        state.maskedAppsScriptUrl = urlRes.url;
        
        // 2. Ambil data settings terbaru dari spreadsheet via Proxy
        const response = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getSettings' })
        });
        const res = await response.json();
        if (res.success) {
          if (res.data) {
            state.settings.event_name = res.data.event_name || state.settings.event_name;
            state.settings.active_watermark = res.data.active_watermark || state.settings.active_watermark;
          }
          
          if (res.customFrames) {
            state.customFrames = res.customFrames;
            state.customFrames.forEach(frame => {
              preloadFrameImage(frame);
            });
            renderThemePresets();
          }
          
          updateUI();
        }
      } else {
        state.hasDatabaseUrl = false;
        state.maskedAppsScriptUrl = '';
      }
    } catch(e) {
      console.warn('Startup Proxy Sync failed. Running offline cache mode.', e);
    }
  }

  async function uploadToGoogleDriveBackground(base64Image) {
    try {
      const payload = {
        action: 'uploadPhoto',
        image: base64Image,
        filter: state.selectedFilter,
        cuts: state.frameCount,
        frameColor: state.selectedThemeColor,
        theme: state.selectedTheme
      };

      await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch(err) {
      console.error('Background Drive Upload Error:', err);
    }
  }

  function updateDbStatusUI() {
    if (state.hasDatabaseUrl) {
      elements.dbStatusDot.className = 'status-dot connected';
      elements.dbStatusText.textContent = 'Database terhubung secara rahasia (Proxy)';
    } else {
      elements.dbStatusDot.className = 'status-dot disconnected';
      elements.dbStatusText.textContent = 'Offline (Database tidak terhubung)';
    }
  }

  // ---- Boot Strap ----
  document.addEventListener('DOMContentLoaded', init);

})();
