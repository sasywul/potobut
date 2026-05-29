<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Potobut — Platform photobooth web modern terinspirasi BeautyPlus. Buat strip foto aesthetic secara gratis.">
  <title>Potobut — Photo Booth Web & Strip Foto</title>
  <link rel="stylesheet" href="style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📸</text></svg>">
</head>
<body>

  <!-- Flash Effect Overlay -->
  <div class="flash-overlay" id="flashOverlay"></div>

  <div class="app-container">

    <!-- ======== HEADER / NAVIGATION ======== -->
    <header class="app-header" id="appHeader">
      <a href="#" class="logo" id="logoHome">
        <span class="logo-icon">📸</span>
        potobut
      </a>
      <!-- Nav links deleted -->
      <div class="nav-icons">
        <button class="nav-icon-btn" title="Grid View">⊞</button>
        <button class="nav-icon-btn" id="btnHeaderSettings" title="Settings">⚙</button>
        <button class="btn-upgrade">✦ Tingkatkan</button>
      </div>
    </header>

    <!-- ==========================================
         HALAMAN 1: LANDING PAGE
         ========================================== -->
    <div class="page active" id="landingPage">
      <div class="landing-content animate-in">
        <h1 class="landing-title">Photo Booth Web — Kamera Online & Strip Foto</h1>
        <p class="landing-subtitle">
          Ambil foto Life4Cuts gratis sepuasnya dengan photo booth online <strong>potobut</strong>. 
          Sempurnakan foto dengan menambahkan filter, warna frame, dan stiker stempel untuk sentuhan estetika yang cantik.
        </p>
        
        <button class="btn-landing-start" id="btnLandingStart">
          📷 Mulai
        </button>

        <!-- Decorative Mockup Strip Illustration -->
        <div class="landing-mockup">
          <div class="mockup-strip rotate-left">
            <div class="mockup-photo" style="background-image: url('https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=60');"></div>
            <div class="mockup-photo" style="background-image: url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=60');"></div>
            <div class="mockup-photo" style="background-image: url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=60');"></div>
            <div class="mockup-branding">potobut ✦</div>
          </div>
          <div class="mockup-strip rotate-right">
            <div class="mockup-photo" style="background-image: url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=60');"></div>
            <div class="mockup-photo" style="background-image: url('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=60');"></div>
            <div class="mockup-photo" style="background-image: url('https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=60');"></div>
            <div class="mockup-branding">potobut ✦</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==========================================
         HALAMAN 2: KAMERA & PENGAMBILAN FOTO
         ========================================== -->
    <div class="page" id="cameraPage">
      
      <!-- Top Bar: Timer & Upload -->
      <div class="camera-top-bar animate-in">
        <div class="timer-selector" id="timerSelector">
          <button class="timer-pill active" data-time="3">⏱️ 3s</button>
          <button class="timer-pill" data-time="5">⏱️ 5s</button>
          <button class="timer-pill" data-time="10">⏱️ 10s</button>
        </div>

        <div class="upload-container">
          <label for="imageUploadInput" class="btn-upload-photo">
            📥 Unggah Foto
          </label>
          <input type="file" id="imageUploadInput" accept="image/*" multiple style="display:none;">
        </div>
      </div>

      <!-- Main Workspace -->
      <div class="camera-workspace animate-in">
        
        <!-- Left Sidebar Controls -->
        <div class="camera-sidebar-left">
          <button class="sidebar-btn" id="btnSidebarKisi" title="Kisi Layout">
            <span class="sidebar-icon">⊞</span>
            <span class="sidebar-label">Kisi</span>
          </button>
          <button class="sidebar-btn" id="btnSidebarFilter" title="Pilih Filter">
            <span class="sidebar-icon">🎨</span>
            <span class="sidebar-label">Filter</span>
          </button>
          <button class="sidebar-btn active" id="btnSidebarMirror" title="Cermin">
            <span class="sidebar-icon">🪞</span>
            <span class="sidebar-label">Cermin</span>
          </button>
        </div>

        <!-- Center: Video Viewport -->
        <div class="camera-center-viewport">
          <div class="camera-preview-container" id="cameraPreviewContainer">
            <video id="videoFeed" autoplay playsinline muted></video>
            
            <div class="camera-placeholder" id="cameraPlaceholder">
              <div class="camera-placeholder-icon">📷</div>
              <div class="camera-placeholder-text">Kamera Siap Diaktifkan</div>
            </div>

            <!-- Countdown Overlay -->
            <div class="countdown-overlay-fullscreen" id="countdownOverlay" style="display:none;">
              <span class="countdown-digits" id="countdownDigits">3</span>
            </div>
          </div>

          <!-- Bottom Capture Button inline inside card directly under video preview -->
          <div class="camera-actions-inline">
            <button class="btn-start-capture" id="btnStartCapture">
              📸 Mulai Foto
            </button>
            <button class="btn-nav-next" id="btnCameraNext" style="display:none;">
              Berikutnya ›
            </button>
          </div>
        </div>

        <!-- Right Sidebar: Captured Previews (Slot/Retake Column) -->
        <div class="camera-sidebar-right" id="capturedThumbsContainer" style="display:none;">
          <div class="thumbs-title">Ketuk foto untuk foto ulang (retake)</div>
          <div class="captured-thumbs" id="capturedThumbs">
            <!-- Captured thumbs will be dynamically injected here -->
          </div>
        </div>

      </div>

      <!-- Floating Sidebar Submenu: Kisi Picker -->
      <div class="floating-submenu" id="submenuKisi" style="display:none;">
        <div class="submenu-title">Pilih Jumlah Frame</div>
        <div class="frame-cuts-grid">
          <button class="frame-cut-opt" data-count="2">2 Foto</button>
          <button class="frame-cut-opt active" data-count="3">3 Foto</button>
          <button class="frame-cut-opt" data-count="4">4 Foto</button>
        </div>
      </div>



      <!-- Floating Sidebar Submenu: Filter Gallery -->
      <div class="floating-submenu" id="submenuFilter" style="display:none;">
        <div class="submenu-title">Pilih Filter Foto</div>
        <div class="filter-options-stack" id="filterOptionsStack">
          <!-- Dynamic filter options with real-time video preview thumbnails -->
          <div class="filter-opt-item active" data-filter="none">
            <div class="filter-opt-preview none"></div>
            <div class="filter-opt-name">Normal</div>
          </div>
          <div class="filter-opt-item" data-filter="retro">
            <div class="filter-opt-preview retro"></div>
            <div class="filter-opt-name">Retro Film</div>
          </div>
          <div class="filter-opt-item" data-filter="bw">
            <div class="filter-opt-preview bw"></div>
            <div class="filter-opt-name">Hitam Putih</div>
          </div>
          <div class="filter-opt-item" data-filter="warm">
            <div class="filter-opt-preview warm"></div>
            <div class="filter-opt-name">Warm Glow</div>
          </div>
          <div class="filter-opt-item" data-filter="cool">
            <div class="filter-opt-preview cool"></div>
            <div class="filter-opt-name">Cool Tone</div>
          </div>
          <div class="filter-opt-item" data-filter="vintage-pink">
            <div class="filter-opt-preview vintage-pink"></div>
            <div class="filter-opt-name">Vintage Pink</div>
          </div>
        </div>
      </div>

    </div>

    <!-- ==========================================
         HALAMAN 3: KUSTOMISASI & UNDUH
         ========================================== -->
    <div class="page" id="customizationPage">
      
      <div class="customization-workspace animate-in">
        
        <!-- Left Panel: Photo Strip Workspace -->
        <div class="workspace-left-strip">
          


          <!-- The Live Custom Photo Strip -->
          <div class="photo-strip" id="photoStrip" style="background-color:#ffffff;">
            <!-- Custom transparent PNG frame overlay -->
            <img id="customFrameOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; display:none; z-index:10;" alt="Custom Frame Overlay">
            <!-- Photos dynamically injected here -->
            <div class="strip-photo" data-index="1"><div class="camera-placeholder" style="display:flex;"><span>1</span></div></div>
            <div class="strip-photo" data-index="2"><div class="camera-placeholder" style="display:flex;"><span>2</span></div></div>
            <div class="strip-photo" data-index="3"><div class="camera-placeholder" style="display:flex;"><span>3</span></div></div>
            <div class="strip-photo" data-index="4"><div class="camera-placeholder" style="display:flex;"><span>4</span></div></div>
            <div class="strip-branding">potobut ✦</div>
          </div>
        </div>

        <!-- Right Panel: Color Palette & Sticker stamp grid -->
        <div class="workspace-right-controls">
          
          <!-- Frame Color Section -->
          <div class="custom-control-section">
            <h3 class="section-title">Warna frame</h3>
            <div class="color-palette-grid" id="colorPaletteGrid">
              <!-- Grid of circular colors: gradients & solid pastels -->
              <button class="color-circle active" data-color="#ffffff" style="background-color:#ffffff;border:1px solid #e0e0e0;" title="White"></button>
              <button class="color-circle" data-color="#000000" style="background-color:#000000;" title="Black"></button>
              <button class="color-circle" data-color="#fde4ef" style="background-color:#fde4ef;" title="Pastel Pink"></button>
              <button class="color-circle" data-color="#e3f2fd" style="background-color:#e3f2fd;" title="Pastel Blue"></button>
              <button class="color-circle" data-color="#f3e5f5" style="background-color:#f3e5f5;" title="Pastel Purple"></button>
              <button class="color-circle" data-color="#fff9c4" style="background-color:#fff9c4;" title="Pastel Yellow"></button>
              <button class="color-circle" data-color="#e8f5e9" style="background-color:#e8f5e9;" title="Pastel Green"></button>
              <button class="color-circle" data-color="#efe5d9" style="background-color:#efe5d9;" title="Pastel Cream"></button>
              
              <!-- Checkered pattern and gradients -->
              <button class="color-circle color-pattern" data-color="checkered" style="background: repeating-conic-gradient(#eeeeee 0% 25%, #ffffff 0% 50%) 50% / 16px 16px;" title="Checkered"></button>
              <button class="color-circle" data-color="linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)" style="background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);" title="Pink-Blue Gradient"></button>
              <button class="color-circle" data-color="linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);" title="Mint-Blue Gradient"></button>
              <button class="color-circle" data-color="linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)" style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);" title="Soft Sky Gradient"></button>
            </div>
          </div>



          <!-- Character Theme Preset Section -->
          <div class="custom-control-section">
            <h3 class="section-title">Tema Karakter</h3>
            <div class="theme-presets-grid" id="themePresetsGrid">
              <button class="theme-preset-btn active" data-theme="classic" title="Classic White">
                <span class="preset-icon">⚪</span>
                <span class="preset-name">Classic White</span>
              </button>
              <button class="theme-preset-btn" data-theme="mario" title="Mario Bros">
                <span class="preset-icon">🍄</span>
                <span class="preset-name">Mario Bros</span>
              </button>
              <button class="theme-preset-btn" data-theme="batman" title="Batman Gotham">
                <span class="preset-icon">🦇</span>
                <span class="preset-name">Batman Gotham</span>
              </button>
              <button class="theme-preset-btn" data-theme="sakura" title="Kawaii Sakura">
                <span class="preset-icon">🌸</span>
                <span class="preset-name">Kawaii Sakura</span>
              </button>
              <button class="theme-preset-btn" data-theme="cyberpunk" title="Cyberpunk Neon">
                <span class="preset-icon">⚡</span>
                <span class="preset-name">Cyberpunk Neon</span>
              </button>
              <button class="theme-preset-btn" data-theme="vintage" title="Vintage Film">
                <span class="preset-icon">🎞️</span>
                <span class="preset-name">Vintage Film</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      <!-- Bottom Save / Overprint actions -->
      <div class="customization-bottom-actions animate-in">
        <button class="btn-custom-download" id="btnCustomDownload">
          📥 Unduh
        </button>
        <button class="btn-custom-restart" id="btnCustomRestart">
          Ambil Ulang
        </button>
      </div>

    </div>

  </div><!-- /app-container -->

  <!-- Hidden canvas for image processing -->
  <canvas id="processingCanvas" style="display:none;"></canvas>

  <!-- ==========================================
       MODAL 1: LOGIN ADMIN
       ========================================== -->
  <div class="admin-modal" id="adminLoginModal" style="display:none;">
    <div class="admin-modal-content animate-in">
      <button class="admin-modal-close" id="btnCloseLoginModal">×</button>
      <div class="admin-modal-header">
        <span class="admin-icon">🔐</span>
        <h2>Login Admin</h2>
        <p>Akses dasbor kontrol photobooth</p>
      </div>
      <div class="admin-form-group">
        <label for="adminPasswordInput">Kata Sandi</label>
        <input type="password" id="adminPasswordInput" placeholder="Masukkan password admin...">
      </div>
      <div class="admin-modal-actions">
        <button class="btn-admin-submit" id="btnSubmitLogin">Masuk</button>
      </div>
    </div>
  </div>

  <!-- ==========================================
       MODAL 2: DASHBOARD ADMIN
       ========================================== -->
  <div class="admin-modal" id="adminDashboardModal" style="display:none;">
    <div class="admin-modal-content dashboard animate-in">
      <button class="admin-modal-close" id="btnCloseDashboardModal">×</button>
      <div class="admin-modal-header">
        <span class="admin-icon">⚙️</span>
        <h2>Dashboard Admin</h2>
        <p>Kelola pengaturan dan integrasi potobut</p>
      </div>
      
      <div class="admin-tabs">
        <div class="admin-tab active" id="tabConfigBtn" data-tab="configTab">Pengaturan</div>
        <div class="admin-tab" id="tabDbBtn" data-tab="dbTab">Koneksi Database</div>
        <div class="admin-tab" id="tabFramesBtn" data-tab="framesTab">Upload Frame</div>
      </div>

      <div class="admin-tab-content active" id="configTab">
        <div class="admin-form-group">
          <label for="inputEventName">Nama Event (Tampil di frame jika didukung)</label>
          <input type="text" id="inputEventName" placeholder="Contoh: Sweet 17th Jessica">
        </div>
        <div class="admin-form-group">
          <label for="inputWatermark">Branding Watermark (Teks di bawah foto)</label>
          <input type="text" id="inputWatermark" placeholder="Contoh: potobut ✦">
        </div>
        <div class="admin-form-group">
          <label for="inputNewPassword">Sandi Admin Baru (Kosongkan jika tidak ingin diubah)</label>
          <input type="password" id="inputNewPassword" placeholder="Masukkan password baru...">
        </div>
      </div>

      <div class="admin-tab-content" id="dbTab" style="display:none;">
        <div class="admin-form-group">
          <label for="inputAppsScriptUrl">Google Apps Script Web App URL</label>
          <div class="admin-input-action-row">
            <input type="text" id="inputAppsScriptUrl" placeholder="https://script.google.com/macros/s/.../exec">
            <button class="btn-admin-action-inline" id="btnTestDbConnection">⚡ Tes Koneksi</button>
          </div>
          <small class="help-text">Masukkan URL Web App hasil deploy Apps Script Anda agar terhubung ke Google Sheets & Drive.</small>
        </div>
        <div class="db-status-card">
          <span class="status-dot disconnected" id="dbStatusDot"></span>
          <span class="status-text" id="dbStatusText">Offline (Database tidak terhubung)</span>
        </div>
      </div>

      <div class="admin-tab-content" id="framesTab" style="display:none;">
        <div class="admin-form-group">
          <label>Pilih File Frame (PNG Transparan)</label>
          <div class="admin-frame-upload-zone" id="frameDropZone">
            <input type="file" id="inputFrameFile" accept="image/png" style="display:none;">
            <label for="inputFrameFile" class="frame-upload-label" id="lblFrameFile">
              <span>📁 Klik untuk pilih file PNG</span>
            </label>
            <!-- Live Preview Box -->
            <div class="frame-preview-box" id="frameUploadPreviewBox" style="display:none;">
              <img id="imgFrameUploadPreview" src="" alt="Preview Frame">
              <button class="btn-remove-preview" id="btnRemoveFramePreview" type="button">×</button>
            </div>
          </div>
        </div>
        <div class="admin-form-group">
          <label for="inputFrameName">Nama Frame Kustom</label>
          <input type="text" id="inputFrameName" placeholder="Contoh: Frame Ulang Tahun">
        </div>
        <div class="admin-form-group" style="text-align: center;">
          <button class="btn-admin-submit" id="btnUploadFrame" style="margin-top:0; min-width: 160px; padding: 10px 24px; font-size: 0.85rem;" type="button">🚀 Upload & Aktifkan</button>
        </div>
        <hr class="admin-hr">
        <div class="admin-form-group">
          <label>Daftar Frame Kustom Aktif</label>
          <div class="active-frames-grid" id="adminActiveFramesGrid">
            <div class="no-frames-text">Memuat daftar frame...</div>
          </div>
        </div>
      </div>

      <div class="admin-modal-actions">
        <button class="btn-admin-submit" id="btnSaveAdminSettings">Simpan Perubahan</button>
      </div>
    </div>
  </div>

  <!-- JavaScript Modules -->
  <script src="filters.js"></script>
  <script src="emotes.js"></script>
  <script src="themes.js"></script>
  <script src="camera.js"></script>
  <script src="app.js"></script>

</body>
</html>
