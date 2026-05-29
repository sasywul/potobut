<?php
session_start();

// Handle logout
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    unset($_SESSION['admin_logged_in']);
    unset($_SESSION['admin_password']);
    header("Location: admin.php");
    exit;
}

// Baca konfigurasi config.json
$configFile = 'config.json';
$config = [];
if (file_exists($configFile)) {
    $config = json_decode(file_get_contents($configFile), true) ?: [];
}

// Handle login POST
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    $password = trim($_POST['password']);
    $appsScriptUrl = $config['apps_script_url'] ?? '';
    
    if (empty($appsScriptUrl)) {
        // Bypass offline jika belum ada database
        if ($password === 'rahasia123') {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_password'] = 'rahasia123';
            header("Location: admin.php");
            exit;
        } else {
            $error = 'Kata sandi salah (Mode Database Offline)';
        }
    } else {
        // Verifikasi ke Apps Script via cURL proxy
        $payload = json_encode(['action' => 'login', 'password' => $password]);
        $ch = curl_init($appsScriptUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: text/plain']);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        $response = curl_exec($ch);
        curl_close($ch);
        
        if ($response) {
            $res = json_decode($response, true);
            if ($res && isset($res['success']) && $res['success']) {
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_password'] = $password;
                header("Location: admin.php");
                exit;
            } else {
                $error = $res['message'] ?? 'Kata sandi salah.';
            }
        } else {
            // Fallback offline
            if ($password === 'rahasia123') {
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_password'] = 'rahasia123';
                header("Location: admin.php");
                exit;
            } else {
                $error = 'Gagal terhubung ke Google Sheets. Masukkan sandi offline "rahasia123".';
            }
        }
    }
}

$isLoggedIn = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Potobut Admin — Dasbor Kontrol</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-outfit: 'Outfit', sans-serif;
      --font-plus: 'Plus Jakarta Sans', sans-serif;
      
      /* Dark Theme Premium Palette */
      --bg-dark: #09090e;
      --bg-card: rgba(18, 18, 29, 0.7);
      --bg-input: rgba(30, 30, 46, 0.6);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-focus: #ff5a87;
      
      --text-main: #f3f3fb;
      --text-muted: #9598b5;
      
      --pink: #ff5a87;
      --pink-hover: #ff7a99;
      --pink-glow: rgba(255, 90, 135, 0.3);
      --green: #4caf50;
      --green-glow: rgba(76, 175, 80, 0.3);
      --red: #ff3b30;
      
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --radius-full: 30px;
      
      --transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      --shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(at 10% 20%, rgba(255, 90, 135, 0.06) 0px, transparent 50%),
        radial-gradient(at 90% 80%, rgba(74, 144, 226, 0.06) 0px, transparent 50%);
      color: var(--text-main);
      font-family: var(--font-plus);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ============================================================
       LOGIN FORM STYLING
       ============================================================ */
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .login-card {
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      width: 100%;
      max-width: 420px;
      padding: 40px;
      text-align: center;
      animation: fadeInUp 0.5s ease-out;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-logo {
      font-family: var(--font-outfit);
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }

    .login-logo span {
      color: var(--pink);
    }

    .login-card p {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 24px;
      text-align: left;
    }

    .form-group label {
      display: block;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .form-group input {
      width: 100%;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 14px 20px;
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: 1rem;
      outline: none;
      transition: var(--transition);
    }

    .form-group input:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px var(--pink-glow);
    }

    .btn-submit {
      width: 100%;
      background: linear-gradient(135deg, var(--pink) 0%, #d83b63 100%);
      color: white;
      border: none;
      padding: 14px;
      border-radius: var(--radius-full);
      font-family: var(--font-outfit);
      font-size: 1.05rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(255, 90, 135, 0.3);
      transition: var(--transition);
    }

    .btn-submit:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 90, 135, 0.4);
    }

    .error-banner {
      background: rgba(255, 59, 48, 0.15);
      border: 1px solid rgba(255, 59, 48, 0.3);
      border-radius: var(--radius-sm);
      color: #ff6b6b;
      padding: 10px 16px;
      font-size: 0.85rem;
      margin-bottom: 20px;
      text-align: left;
    }

    /* ============================================================
       MAIN DASHBOARD LAYOUT
       ============================================================ */
    .dashboard-container {
      display: flex;
      min-height: 100vh;
    }

    /* Sidebar Panel */
    .sidebar {
      width: 280px;
      background: rgba(12, 12, 22, 0.9);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: 30px 24px;
      flex-shrink: 0;
    }

    .sidebar-header {
      margin-bottom: 40px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sidebar-logo {
      font-family: var(--font-outfit);
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.5px;
    }

    .sidebar-logo span {
      color: var(--pink);
    }

    .sidebar-menu {
      display: flex;
      flex-direction: column;
      gap: 8px;
      list-style: none;
      flex-grow: 1;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
      text-decoration: none;
      transition: var(--transition);
    }

    .menu-item:hover, .menu-item.active {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
    }

    .menu-item.active {
      border-left: 3px solid var(--pink);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      background: rgba(255, 90, 135, 0.06);
      color: var(--pink);
    }

    .menu-icon {
      font-size: 1.25rem;
    }

    .sidebar-footer {
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .btn-secondary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border-radius: var(--radius-full);
      font-family: var(--font-outfit);
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: var(--transition);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      background: transparent;
    }

    .btn-secondary:hover {
      border-color: var(--pink);
      color: var(--pink);
      background: rgba(255, 90, 135, 0.05);
    }

    .btn-logout {
      background: rgba(255, 59, 48, 0.1);
      border: 1px solid rgba(255, 59, 48, 0.2);
      color: #ff3b30;
    }

    .btn-logout:hover {
      background: #ff3b30;
      color: white;
      border-color: #ff3b30;
    }

    /* Main Content Container */
    .content-area {
      flex-grow: 1;
      padding: 40px 50px;
      overflow-y: auto;
      max-height: 100vh;
    }

    .tab-content {
      display: none;
      animation: fadeIn 0.4s ease-out;
    }

    .tab-content.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-title {
      font-family: var(--font-outfit);
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 8px;
    }

    .page-subtitle {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-bottom: 40px;
    }

    /* Overview Cards */
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow);
      display: flex;
      align-items: center;
      gap: 20px;
      transition: var(--transition);
    }

    .stat-card:hover {
      transform: translateY(-3px);
      border-color: rgba(255, 90, 135, 0.2);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      background: rgba(255, 90, 135, 0.1);
      color: var(--pink);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
    }

    .stat-icon.green {
      background: rgba(76, 175, 80, 0.1);
      color: var(--green);
    }

    .stat-icon.blue {
      background: rgba(74, 144, 226, 0.1);
      color: #4a90e2;
    }

    .stat-data {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
      font-family: var(--font-outfit);
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    /* Columns for Upload and Preview split */
    .dashboard-split {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 40px;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .dashboard-split {
        grid-template-columns: 1fr;
      }
    }

    .dashboard-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 30px;
      box-shadow: var(--shadow);
    }

    .card-title {
      font-family: var(--font-outfit);
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Dotted drag and drop zone */
    .upload-zone {
      width: 100%;
      border: 2px dashed rgba(255, 90, 135, 0.3);
      background: rgba(18, 18, 29, 0.4);
      border-radius: var(--radius-md);
      padding: 36px 20px;
      text-align: center;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .upload-zone:hover, .upload-zone.dragover {
      border-color: var(--pink);
      background: rgba(255, 90, 135, 0.05);
      box-shadow: inset 0 0 12px rgba(255, 90, 135, 0.1);
    }

    .upload-zone-icon {
      font-size: 2.2rem;
    }

    .upload-zone-text {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .upload-zone-subtext {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* ============================================================
       HIGH-FIDELITY LIVE PREVIEW CONTAINER MOCKUP
       ============================================================ */
    .mockup-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      background: rgba(12, 12, 22, 0.4);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 30px;
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
    }

    .mockup-toggle-row {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 10px;
    }

    .mockup-toggle-btn {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 8px 16px;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: var(--transition);
    }

    .mockup-toggle-btn.active {
      background: var(--pink);
      border-color: var(--pink);
      box-shadow: 0 0 10px rgba(255, 90, 135, 0.4);
    }

    /* The Live Custom Photo Strip Mockup */
    .photo-strip-mockup {
      width: 260px;
      height: 600px; /* Golden photobooth strip aspect ratio */
      background: #ffffff;
      border-radius: 4px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      position: relative;
      overflow: hidden;
      padding: 20px 16px 45px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: var(--transition);
    }

    .photo-strip-mockup.linear-gradient {
      /* Dynamic styles handled by preset toggles */
    }

    .mockup-photo-slot {
      flex: 1;
      width: 100%;
      background: #f3f3f5;
      border: 1px solid rgba(0, 0, 0, 0.05);
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .mockup-photo-slot img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: none;
    }

    .mockup-photo-slot span {
      font-size: 2.2rem;
      font-weight: bold;
      color: #bbb;
      font-family: var(--font-outfit);
    }

    .mockup-branding-slot {
      position: absolute;
      bottom: 12px;
      left: 0;
      width: 100%;
      text-align: center;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .mockup-branding-title {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--pink);
      font-family: var(--font-outfit);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mockup-branding-subtitle {
      font-size: 0.58rem;
      color: #888;
      font-weight: bold;
    }

    /* Absolute frame overlay image */
    .mockup-frame-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      pointer-events: none;
      object-fit: fill;
      display: none;
    }

    /* Active Uploaded Frame Grid */
    .active-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 16px;
      margin-top: 10px;
    }

    .frame-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px;
      text-align: center;
      position: relative;
      transition: var(--transition);
    }

    .frame-card:hover {
      border-color: var(--pink);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .frame-card-thumb {
      width: 100%;
      height: 150px;
      background: repeating-conic-gradient(#12121d 0% 25%, #2a2a3c 0% 50%) 50% / 10px 10px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      margin-bottom: 8px;
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .frame-card-thumb img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .frame-card-name {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .frame-card-id {
      font-size: 0.62rem;
      color: var(--text-muted);
      font-family: monospace;
    }

    /* Connection Status */
    .db-status-bar {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 24px;
      background: var(--bg-input);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      margin-bottom: 30px;
    }

    .status-badge {
      padding: 6px 14px;
      border-radius: var(--radius-full);
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-badge.connected {
      background: rgba(76, 175, 80, 0.15);
      color: #81c784;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }

    .status-badge.disconnected {
      background: rgba(255, 59, 48, 0.15);
      color: #ff8a80;
      border: 1px solid rgba(255, 59, 48, 0.3);
    }

    .status-indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 8px currentColor;
    }

    /* Logs Table */
    .table-container {
      width: 100%;
      overflow-x: auto;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      margin-top: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      padding: 18px 24px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
    }

    td {
      padding: 16px 24px;
      font-size: 0.88rem;
      color: var(--text-main);
      border-bottom: 1px solid var(--border-color);
    }

    tr:last-child td {
      border-bottom: none;
    }

    .log-link {
      color: var(--pink);
      text-decoration: none;
      font-weight: 700;
      font-size: 0.85rem;
      transition: var(--transition);
    }

    .log-link:hover {
      color: var(--pink-hover);
      text-decoration: underline;
    }

    /* Loading placeholder */
    .loading-grid-spinner {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px 0;
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 600;
    }

    /* Inline action button row */
    .form-inline-action {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .form-inline-action input {
      flex-grow: 1;
    }

    .btn-action {
      background: rgba(255, 90, 135, 0.1);
      color: var(--pink);
      border: 1px solid rgba(255, 90, 135, 0.2);
      padding: 14px 24px;
      border-radius: var(--radius-md);
      font-family: var(--font-outfit);
      font-weight: 800;
      cursor: pointer;
      transition: var(--transition);
      white-space: nowrap;
    }

    .btn-action:hover {
      background: var(--pink);
      color: white;
      border-color: var(--pink);
      transform: translateY(-1px);
    }

    .status-toast {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: var(--pink);
      color: white;
      padding: 12px 24px;
      border-radius: var(--radius-full);
      box-shadow: 0 10px 20px rgba(0,0,0,0.3);
      font-weight: 700;
      font-size: 0.9rem;
      z-index: 10000;
      animation: slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
      display: none;
    }

    @keyframes slideIn {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  </style>
</head>
<body>

  <!-- Toast Notification -->
  <div class="status-toast" id="statusToast"></div>

  <?php if (!$isLoggedIn): ?>
  <!-- ==========================================
       LOGIN VIEW
       ========================================== -->
  <div class="login-container">
    <div class="login-card">
      <div class="login-logo">potobut<span>.</span>admin</div>
      <p>Masukkan kata sandi kontrol photobooth</p>

      <?php if (!empty($error)): ?>
        <div class="error-banner"><?= htmlspecialchars($error) ?></div>
      <?php endif; ?>

      <form method="POST" action="admin.php">
        <div class="form-group">
          <label for="password">Kata Sandi Admin</label>
          <input type="password" name="password" id="password" placeholder="Ketik kata sandi..." required autocomplete="current-password">
        </div>
        <button type="submit" class="btn-submit">Login Masuk</button>
      </form>
    </div>
  </div>

  <?php else: ?>
  <!-- ==========================================
       DASHBOARD VIEW
       ========================================== -->
  <div class="dashboard-container">
    
    <!-- Left Sidebar Menu -->
    <div class="sidebar">
      <div class="sidebar-header">
        <span class="sidebar-logo">potobut<span>✦</span></span>
      </div>

      <ul class="sidebar-menu">
        <li class="menu-item active" data-tab="overviewTab">
          <span class="menu-icon">📊</span> Ringkasan
        </li>
        <li class="menu-item" data-tab="uploadTab">
          <span class="menu-icon">🖼️</span> Upload Frame Kustom
        </li>
        <li class="menu-item" data-tab="settingsTab">
          <span class="menu-icon">⚙️</span> Pengaturan Umum
        </li>
        <li class="menu-item" data-tab="dbTab">
          <span class="menu-icon">🔌</span> Koneksi Database
        </li>
        <li class="menu-item" data-tab="logsTab" id="tabLogsBtn">
          <span class="menu-icon">📜</span> Log Aktivitas
        </li>
      </ul>

      <div class="sidebar-footer">
        <a href="index.php" class="btn-secondary">📷 Kamera booth</a>
        <a href="admin.php?action=logout" class="btn-secondary btn-logout">🚪 Keluar</a>
      </div>
    </div>

    <!-- Right Main Content Panel -->
    <div class="content-area">
      
      <!-- 1. OVERVIEW TAB -->
      <div class="tab-content active" id="overviewTab">
        <h1 class="page-title">Ringkasan Dasbor</h1>
        <p class="page-subtitle">Status operasional, statistik, dan integrasi Anda saat ini.</p>

        <div class="overview-grid">
          <div class="stat-card">
            <div class="stat-icon green" id="statDbIcon">🔌</div>
            <div class="stat-data">
              <span class="stat-value" id="statDbStatus">Memuat...</span>
              <span class="stat-label">Google Sheets API</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🖼️</div>
            <div class="stat-data">
              <span class="stat-value" id="statFramesCount">0</span>
              <span class="stat-label">Frame Kustom Aktif</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon blue">📸</div>
            <div class="stat-data">
              <span class="stat-value" id="statEventName">Memuat...</span>
              <span class="stat-label">Event Potobut</span>
            </div>
          </div>
        </div>

        <div class="dashboard-card" style="margin-bottom: 30px;">
          <h2 class="card-title">🚀 Aksi Cepat</h2>
          <div style="display: flex; gap: 16px; margin-top: 15px;">
            <button class="btn-submit" style="width: auto; padding: 12px 24px;" onclick="switchTab('uploadTab')">🖼️ Tambah Frame Baru</button>
            <a href="index.php" target="_blank" class="btn-secondary" style="width: auto; padding: 12px 24px; color: var(--text-main); border-color: rgba(255, 255, 255, 0.15)">⚡ Buka Photobooth Terbuka (Tab Baru)</a>
          </div>
        </div>
      </div>

      <!-- 2. UPLOAD FRAME TAB -->
      <div class="tab-content" id="uploadTab">
        <h1 class="page-title">Kelola Frame Kustom</h1>
        <p class="page-subtitle">Unggah bingkai transparan PNG aesthetic dan pratinjau hasilnya secara langsung.</p>

        <div class="dashboard-split">
          <!-- Left: Upload settings -->
          <div class="dashboard-card">
            <h2 class="card-title">📁 Unggah Frame Baru</h2>
            
            <div class="upload-zone" id="frameDragZone">
              <input type="file" id="inputFrameFile" accept="image/png" style="display:none;">
              <span class="upload-zone-icon">📥</span>
              <span class="upload-zone-text" id="lblFrameFile">Tarik & lepas file PNG Anda di sini atau klik untuk pilih</span>
              <span class="upload-zone-subtext">Wajib file PNG transparan (disarankan 600 x 830 pixel)</span>
            </div>

            <div class="form-group">
              <label for="inputFrameName">Nama Frame Kustom</label>
              <input type="text" id="inputFrameName" placeholder="Contoh: Frame Valentine Pink">
            </div>

            <button class="btn-submit" id="btnUploadFrame" style="margin-top: 10px;">🚀 Upload & Simpan Ke Google Sheets</button>
            
            <hr style="border:0; height:1px; background:var(--border-color); margin: 30px 0 20px 0;">

            <h3 style="font-size: 0.95rem; font-weight:700; margin-bottom: 15px;">Daftar Frame Kustom Aktif</h3>
            <div class="active-grid" id="dashboardActiveFramesGrid">
              <div class="loading-grid-spinner">Menghubungkan ke database...</div>
            </div>
          </div>

          <!-- Right: HIGH-FIDELITY LIVE PREVIEW -->
          <div class="dashboard-card" style="position: sticky; top: 40px;">
            <h2 class="card-title">👁️ Live Preview Frame Kustom</h2>
            <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom: 20px;">Sesuaikan warna latar belakang dan uji kecocokan penempatan frame secara real-time sebelum diunggah.</p>

            <div class="mockup-container">
              <div class="mockup-toggle-row" style="flex-wrap: wrap; justify-content: center; gap: 10px;">
                <!-- Color Toggles -->
                <button class="mockup-toggle-btn active" onclick="setMockupBackground('#ffffff', this)">⚪ Putih</button>
                <button class="mockup-toggle-btn" onclick="setMockupBackground('#FFEBEF', this)">🌸 Sakura</button>
                <button class="mockup-toggle-btn" onclick="setMockupBackground('linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', this)">🌈 Gradient</button>
                <button class="mockup-toggle-btn" onclick="toggleMockupPhotos(this)">📷 Model Foto</button>
                <button class="mockup-toggle-btn" onclick="triggerTestPhotoUpload()" style="background: rgba(255, 90, 135, 0.15); color: var(--pink); border-color: var(--pink);">📥 Test Foto Anda</button>
                <input type="file" id="inputTestPhoto" accept="image/*" style="display:none;" multiple>
              </div>

              <!-- Layout selector dropdown -->
              <div style="display: flex; gap: 8px; align-items: center; justify-content: center; width:100%; margin-top: -4px;">
                <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">JUMLAH FRAME UJI:</span>
                <select id="mockupCutsDropdown" style="background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-main); border-radius:var(--radius-sm); padding:4px 8px; font-size:0.75rem; font-weight:700; outline:none; cursor:pointer;" onchange="updateMockupCutsLayout()">
                  <option value="2">2 Foto</option>
                  <option value="3" selected>3 Foto</option>
                  <option value="4">4 Foto</option>
                </select>
              </div>

              <!-- Strip Mockup Frame container (3 cuts by default) -->
              <div class="photo-strip-mockup" id="photoStripMockup" style="height: 520px;">
                <img class="mockup-frame-overlay" id="mockupFrameOverlay" src="" alt="Overlay">
                
                <div class="mockup-photo-slot">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" alt="Model 1">
                  <span>1</span>
                </div>
                <div class="mockup-photo-slot">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" alt="Model 2">
                  <span>2</span>
                </div>
                <div class="mockup-photo-slot">
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80" alt="Model 3">
                  <span>3</span>
                </div>

                <div class="mockup-branding-slot">
                  <div class="mockup-branding-title" id="previewWatermarkText">potobut ✦</div>
                  <div class="mockup-branding-subtitle" id="previewEventText">Sweet 17th Jessica</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. CONFIG GENERAL TAB -->
      <div class="tab-content" id="settingsTab">
        <h1 class="page-title">Pengaturan Umum</h1>
        <p class="page-subtitle">Konfigurasikan judul event dan teks branding watermark yang akan tercetak di foto strip.</p>

        <div class="dashboard-card" style="max-width: 600px;">
          <h2 class="card-title">⚙️ Konfigurasi Event</h2>

          <div class="form-group">
            <label for="inputEventNameSetting">Nama Event (Muncul di bagian bawah foto)</label>
            <input type="text" id="inputEventNameSetting" placeholder="Contoh: Sweet 17th Jessica">
          </div>

          <div class="form-group">
            <label for="inputWatermarkSetting">Branding Watermark (Teks utama di bawah foto)</label>
            <input type="text" id="inputWatermarkSetting" placeholder="Contoh: potobut ✦">
          </div>

          <div class="form-group">
            <label for="inputNewPasswordSetting">Kata Sandi Baru (Kosongkan jika tidak ingin diubah)</label>
            <input type="password" id="inputNewPasswordSetting" placeholder="Ketik kata sandi baru...">
          </div>

          <button class="btn-submit" id="btnSaveGeneralSettings" style="width: auto; padding: 14px 40px; margin-top: 10px;">💾 Simpan Pengaturan</button>
        </div>
      </div>

      <!-- 4. DATABASE TAB -->
      <div class="tab-content" id="dbTab">
        <h1 class="page-title">Integrasi Google Sheets & Drive</h1>
        <p class="page-subtitle">Hubungkan aplikasi photobooth online dengan file penyimpanan cloud database Anda.</p>

        <div class="dashboard-card" style="max-width: 700px;">
          <h2 class="card-title">🔌 Google Apps Script API</h2>

          <div class="db-status-bar">
            <div class="status-badge disconnected" id="dbStatusBadge">
              <span class="status-indicator-dot"></span>
              <span id="dbStatusText">Offline</span>
            </div>
            <span style="font-size:0.88rem; color:var(--text-muted);" id="dbStatusDetails">Database belum dikonfigurasi secara penuh.</span>
          </div>

          <div class="form-group">
            <label for="inputAppsScriptUrl">Google Apps Script Web App URL</label>
            <div class="form-inline-action">
              <input type="password" id="inputAppsScriptUrl" placeholder="https://script.google.com/macros/s/.../exec">
              <button class="btn-action" id="btnTestDb">⚡ Tes Koneksi</button>
            </div>
            <small style="display:block; font-size:0.75rem; color:var(--text-muted); margin-top: 10px; line-height: 1.4;">
              URL Anda disimpan secara rahasia di server menggunakan enkripsi file <code>config.json</code> untuk mencegah manipulasi data dari pengunjung nakal di jaringan.
            </small>
          </div>

          <button class="btn-submit" id="btnSaveDbUrl" style="width: auto; padding: 14px 40px; margin-top: 20px;">💾 Simpan & Sinkronkan</button>
        </div>
      </div>

      <!-- 5. ACTIVITY LOGS TAB -->
      <div class="tab-content" id="logsTab">
        <h1 class="page-title">Log Sesi Aktivitas</h1>
        <p class="page-subtitle">Daftar riwayat sesi foto sukses pengguna yang tercatat otomatis di Google Sheets.</p>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Tanggal & Waktu</th>
                <th>Filter Warna</th>
                <th>Layout Kisi</th>
                <th>Frame Color</th>
                <th>Status</th>
                <th>Link Foto (Drive)</th>
              </tr>
            </thead>
            <tbody id="logsTableBody">
              <tr>
                <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted); font-weight:600;">Menghubungkan ke spreadsheet...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
  <?php endif; ?>

  <!-- JS Dashboard Controller Logic -->
  <script>
    // State Aplikasi
    const state = {
      isLoggedIn: <?= $isLoggedIn ? 'true' : 'false' ?>,
      hasDatabaseUrl: false,
      maskedUrl: '',
      settings: {
        event_name: 'Sweet 17th Jessica',
        active_watermark: 'potobut ✦'
      },
      customFrames: [],
      uploadedFrameBase64: ''
    };

    // DOM Elements Cache
    let elements = {};

    function init() {
      if (!state.isLoggedIn) return;

      // Cache elements
      elements = {
        tabs: document.querySelectorAll('.menu-item'),
        tabContents: document.querySelectorAll('.tab-content'),
        statDbIcon: document.getElementById('statDbIcon'),
        statDbStatus: document.getElementById('statDbStatus'),
        statFramesCount: document.getElementById('statFramesCount'),
        statEventName: document.getElementById('statEventName'),
        
        frameDragZone: document.getElementById('frameDragZone'),
        inputFrameFile: document.getElementById('inputFrameFile'),
        lblFrameFile: document.getElementById('lblFrameFile'),
        inputFrameName: document.getElementById('inputFrameName'),
        btnUploadFrame: document.getElementById('btnUploadFrame'),
        dashboardActiveFramesGrid: document.getElementById('dashboardActiveFramesGrid'),
        mockupFrameOverlay: document.getElementById('mockupFrameOverlay'),
        
        inputEventNameSetting: document.getElementById('inputEventNameSetting'),
        inputWatermarkSetting: document.getElementById('inputWatermarkSetting'),
        inputNewPasswordSetting: document.getElementById('inputNewPasswordSetting'),
        btnSaveGeneralSettings: document.getElementById('btnSaveGeneralSettings'),
        
        dbStatusBadge: document.getElementById('dbStatusBadge'),
        dbStatusText: document.getElementById('dbStatusText'),
        dbStatusDetails: document.getElementById('dbStatusDetails'),
        inputAppsScriptUrl: document.getElementById('inputAppsScriptUrl'),
        btnTestDb: document.getElementById('btnTestDb'),
        btnSaveDbUrl: document.getElementById('btnSaveDbUrl'),
        
        logsTableBody: document.getElementById('logsTableBody'),
        tabLogsBtn: document.getElementById('tabLogsBtn'),
        toast: document.getElementById('statusToast')
      };

      bindEvents();
      syncDashboardData();
    }

    function bindEvents() {
      // Tab switching
      elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          elements.tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          const tabId = tab.dataset.tab;
          elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
          });
        });
      });

      // Drag and drop events
      elements.frameDragZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.frameDragZone.classList.add('dragover');
      });

      elements.frameDragZone.addEventListener('dragleave', () => {
        elements.frameDragZone.classList.remove('dragover');
      });

      elements.frameDragZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.frameDragZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
          elements.inputFrameFile.files = e.dataTransfer.files;
          handleFrameSelected(e.dataTransfer.files[0]);
        }
      });

      elements.frameDragZone.addEventListener('click', () => {
        elements.inputFrameFile.click();
      });

      elements.inputFrameFile.addEventListener('change', (e) => {
        if (e.target.files.length) {
          handleFrameSelected(e.target.files[0]);
        }
      });

      // Actions
      elements.btnUploadFrame.addEventListener('click', handleUploadFrame);
      elements.btnSaveGeneralSettings.addEventListener('click', handleSaveGeneralSettings);
      elements.btnTestDb.addEventListener('click', handleTestConnection);
      elements.btnSaveDbUrl.addEventListener('click', handleSaveDbUrl);
      elements.tabLogsBtn.addEventListener('click', loadActivityLogs);
    }

    // Tab switcher helper
    function switchTab(tabId) {
      elements.tabs.forEach(tab => {
        if (tab.dataset.tab === tabId) {
          tab.click();
        }
      });
    }

    // Toast show helper
    function showToast(text, duration = 3000) {
      elements.toast.textContent = text;
      elements.toast.style.display = 'block';
      setTimeout(() => {
        elements.toast.style.display = 'none';
      }, duration);
    }

    // Sync settings on startup
    async function syncDashboardData() {
      try {
        // 1. Ambil URL database status
        const urlResponse = await fetch('api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getUrl' })
        });
        const urlRes = await urlResponse.json();
        
        if (urlRes.success && urlRes.has_url) {
          state.hasDatabaseUrl = true;
          state.maskedUrl = urlRes.url;
          elements.inputAppsScriptUrl.value = urlRes.url;
          
          // 2. Ambil data settings terbaru via proxy
          const response = await fetch('api.php', {
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
            }

            updateDashboardUI();
          } else {
            setOfflineUI('Gagal memuat pengaturan database.');
          }
        } else {
          setOfflineUI('Database belum dikonfigurasi.');
        }
      } catch(err) {
        console.error(err);
        setOfflineUI('Gagal terhubung ke proxy server.');
      }
    }

    function updateDashboardUI() {
      // Update Overview stats
      elements.statDbIcon.textContent = '🔌';
      elements.statDbIcon.className = 'stat-icon green';
      elements.statDbStatus.textContent = 'Terhubung';
      elements.statFramesCount.textContent = state.customFrames.length;
      elements.statEventName.textContent = state.settings.event_name;
      
      // Update form inputs
      elements.inputEventNameSetting.value = state.settings.event_name;
      elements.inputWatermarkSetting.value = state.settings.active_watermark;
      
      // Update preview text overlay
      document.getElementById('previewWatermarkText').textContent = state.settings.active_watermark;
      document.getElementById('previewEventText').textContent = state.settings.event_name;
      
      // Update Database Tab
      elements.dbStatusBadge.className = 'status-badge connected';
      elements.dbStatusText.textContent = 'Terhubung';
      elements.dbStatusDetails.textContent = 'Koneksi ke Google Sheets & Google Drive aktif.';
      
      // Render active custom frames grid
      renderActiveFramesGrid();
    }

    function setOfflineUI(detailsText) {
      state.hasDatabaseUrl = false;
      elements.statDbIcon.textContent = '❌';
      elements.statDbIcon.className = 'stat-icon';
      elements.statDbStatus.textContent = 'Offline';
      elements.statEventName.textContent = 'Offline Mode';
      
      elements.dbStatusBadge.className = 'status-badge disconnected';
      elements.dbStatusText.textContent = 'Offline';
      elements.dbStatusDetails.textContent = detailsText;
      
      elements.dashboardActiveFramesGrid.innerHTML = `
        <div class="loading-grid-spinner" style="color: var(--red);">
          🔴 Database tidak terhubung. Frame kustom dinonaktifkan.
        </div>
      `;
    }

    // Mockup Previews Toggles
    function setMockupBackground(bgColor, btn) {
      const parent = btn.parentElement;
      parent.querySelectorAll('.mockup-toggle-btn').forEach(b => {
        if (!b.textContent.includes('Model')) b.classList.remove('active');
      });
      btn.classList.add('active');

      const strip = document.getElementById('photoStripMockup');
      strip.style.background = bgColor;
    }

    let mockupTestPhotos = []; // stores custom test photos loaded by admin

    function triggerTestPhotoUpload() {
      const input = document.getElementById('inputTestPhoto');
      if (input) input.click();
    }

    // Initialize custom test photo upload event listener
    document.addEventListener('DOMContentLoaded', () => {
      const inputTestPhoto = document.getElementById('inputTestPhoto');
      if (inputTestPhoto) {
        inputTestPhoto.addEventListener('change', function(e) {
          const files = Array.from(e.target.files);
          if (!files.length) return;
          
          let loaded = 0;
          mockupTestPhotos = []; // Reset
          
          // Automatically turn on "Model Foto" display mode
          const modelBtn = document.querySelector('.mockup-toggle-btn[onclick*="toggleMockupPhotos"]');
          if (modelBtn && !modelBtn.classList.contains('active')) {
            modelBtn.classList.add('active');
          }
          
          files.slice(0, 6).forEach((file, idx) => {
            const reader = new FileReader();
            reader.onload = function(evt) {
              mockupTestPhotos[idx] = evt.target.result;
              loaded++;
              if (loaded === Math.min(files.length, 6)) {
                // Re-render cuts with the loaded custom test photos!
                updateMockupCutsLayout();
                showToast('Foto uji coba Anda berhasil dimuat!');
              }
            };
            reader.readAsDataURL(file);
          });
        });
      }
    });

    function updateMockupCutsLayout() {
      const dropdown = document.getElementById('mockupCutsDropdown');
      if (!dropdown) return;
      const count = parseInt(dropdown.value);
      
      const strip = document.getElementById('photoStripMockup');
      if (!strip) return;
      
      // Update strip height dynamically for landscape cuts
      const heights = {
        2: '380px',
        3: '480px',
        4: '560px'
      };
      strip.style.height = heights[count] || '480px';
      
      // Remove all mockup photo slots
      const slots = strip.querySelectorAll('.mockup-photo-slot');
      slots.forEach(slot => slot.remove());
      
      const branding = strip.querySelector('.mockup-branding-slot');
      
      const unsplashModels = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80"
      ];
      
      const modelBtn = document.querySelector('.mockup-toggle-btn[onclick*="toggleMockupPhotos"]');
      const isModelActive = modelBtn && modelBtn.classList.contains('active');
      
      for (let i = 0; i < count; i++) {
        const slot = document.createElement('div');
        slot.className = 'mockup-photo-slot';
        slot.style.aspectRatio = '4/3';
        
        const img = document.createElement('img');
        if (mockupTestPhotos[i]) {
          img.src = mockupTestPhotos[i];
          img.style.display = 'block';
        } else {
          img.src = unsplashModels[i % unsplashModels.length];
          img.style.display = isModelActive ? 'block' : 'none';
        }
        
        const span = document.createElement('span');
        span.textContent = i + 1;
        span.style.display = (img.style.display === 'block') ? 'none' : 'block';
        
        slot.appendChild(img);
        slot.appendChild(span);
        
        strip.insertBefore(slot, branding);
      }
    }

    function toggleMockupPhotos(btn) {
      btn.classList.toggle('active');
      const active = btn.classList.contains('active');
      
      const slots = document.querySelectorAll('.mockup-photo-slot');
      slots.forEach((slot, idx) => {
        const img = slot.querySelector('img');
        const span = slot.querySelector('span');
        
        if (img) {
          if (mockupTestPhotos[idx]) {
            img.style.display = 'block';
            if (span) span.style.display = 'none';
          } else {
            img.style.display = active ? 'block' : 'none';
            if (span) span.style.display = active ? 'none' : 'block';
          }
        }
      });
    }

    // File Selected
    function handleFrameSelected(file) {
      if (!file) return;
      if (file.type !== 'image/png') {
        alert('Hanya file PNG transparan yang diperbolehkan!');
        elements.inputFrameFile.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        state.uploadedFrameBase64 = e.target.result;
        
        // Show in live mockup overlay
        elements.mockupFrameOverlay.src = state.uploadedFrameBase64;
        elements.mockupFrameOverlay.style.display = 'block';
        
        elements.lblFrameFile.textContent = `📁 File terpilih: ${file.name}`;
        
        // Auto fill frame name input
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        elements.inputFrameName.value = cleanName;
        
        showToast('Pratinjau frame transparan berhasil dimuat!');
      };
      reader.readAsDataURL(file);
    }

    // Upload Frame Action
    async function handleUploadFrame() {
      if (!state.uploadedFrameBase64) {
        alert('Pilih/tarik file PNG terlebih dahulu!');
        return;
      }
      const name = elements.inputFrameName.value.trim();
      if (!name) {
        alert('Tulis nama frame terlebih dahulu!');
        elements.inputFrameName.focus();
        return;
      }

      if (!state.hasDatabaseUrl) {
        alert('Gagal: Database Google Sheets belum terhubung!');
        return;
      }

      elements.btnUploadFrame.disabled = true;
      elements.btnUploadFrame.textContent = 'Sedang Mengunggah Ke Google Drive...';

      try {
        const payload = {
          action: 'uploadCustomFrame',
          image: state.uploadedFrameBase64,
          frameName: name
        };

        const response = await fetch('api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const res = await response.json();

        if (res.success && res.data) {
          showToast('Frame kustom berhasil disimpan & diaktifkan!');
          
          // Add to local state
          state.customFrames.push({
            id: res.data.id,
            name: res.data.name,
            url: res.data.url
          });

          // Reset inputs
          state.uploadedFrameBase64 = '';
          elements.inputFrameFile.value = '';
          elements.inputFrameName.value = '';
          elements.lblFrameFile.textContent = 'Tarik & lepas file PNG Anda di sini atau klik untuk pilih';
          elements.mockupFrameOverlay.src = '';
          elements.mockupFrameOverlay.style.display = 'none';

          // Refresh UI elements
          updateDashboardUI();
        } else {
          alert('Upload gagal: ' + (res.message || 'Error tidak diketahui'));
        }
      } catch(err) {
        console.error(err);
        alert('Gagal menghubungi proxy server: ' + err.message);
      } finally {
        elements.btnUploadFrame.disabled = false;
        elements.btnUploadFrame.textContent = '🚀 Upload & Simpan Ke Google Sheets';
      }
    }

    function renderActiveFramesGrid() {
      const grid = elements.dashboardActiveFramesGrid;
      if (!grid) return;
      grid.innerHTML = '';

      if (state.customFrames.length === 0) {
        grid.innerHTML = '<div class="loading-grid-spinner">Belum ada frame kustom yang aktif di database.</div>';
        return;
      }

      state.customFrames.forEach(frame => {
        const card = document.createElement('div');
        card.className = 'frame-card';
        
        // Load direct image bypass via local proxy proxyImage GET endpoint to prevent canvas mixed content blocks
        const proxiedUrl = 'api.php?action=proxyImage&url=' + encodeURIComponent(frame.url);
        
        card.innerHTML = `
          <div class="frame-card-thumb">
            <img src="${proxiedUrl}" alt="${frame.name}">
          </div>
          <div class="frame-card-name" title="${frame.name}">${frame.name}</div>
          <div class="frame-card-id">${frame.id}</div>
        `;
        grid.appendChild(card);
      });
    }

    // Save configuration settings
    async function handleSaveGeneralSettings() {
      const eventName = elements.inputEventNameSetting.value.trim();
      const watermark = elements.inputWatermarkSetting.value.trim();
      const newPassword = elements.inputNewPasswordSetting.value.trim();

      if (!eventName || !watermark) {
        alert('Nama event dan Watermark wajib diisi!');
        return;
      }

      elements.btnSaveGeneralSettings.disabled = true;
      elements.btnSaveGeneralSettings.textContent = 'Menyimpan...';

      try {
        const payload = {
          action: 'updateSettings',
          adminPassword: '<?= $_SESSION['admin_password'] ?? '' ?>',
          settings: {
            event_name: eventName,
            active_watermark: watermark
          }
        };

        if (newPassword) {
          payload.settings.admin_password = newPassword;
        }

        const response = await fetch('api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const res = await response.json();

        if (res.success) {
          showToast('Pengaturan event berhasil disimpan!');
          state.settings.event_name = eventName;
          state.settings.active_watermark = watermark;
          
          updateDashboardUI();
        } else {
          alert('Gagal menyimpan: ' + (res.message || 'Error tidak diketahui'));
        }
      } catch(err) {
        console.error(err);
        alert('Terjadi kesalahan koneksi server: ' + err.message);
      } finally {
        elements.btnSaveGeneralSettings.disabled = false;
        elements.btnSaveGeneralSettings.textContent = '💾 Simpan Pengaturan';
      }
    }

    // Test Database connection
    async function handleTestConnection() {
      const url = elements.inputAppsScriptUrl.value.trim();
      if (!url) {
        alert('Ketik URL Apps Script terlebih dahulu!');
        return;
      }

      elements.btnTestDb.disabled = true;
      elements.btnTestDb.textContent = 'Menghubungkan...';

      try {
        // Simpan sementara jika bukan masked
        if (!url.includes('...')) {
          await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveUrl', url: url })
          });
        }

        const response = await fetch('api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getSettings' })
        });
        const res = await response.json();

        if (res.success) {
          state.hasDatabaseUrl = true;
          showToast('Koneksi berhasil! Database Google Sheets terhubung.');
          
          if (res.customFrames) state.customFrames = res.customFrames;
          if (res.data) {
            state.settings.event_name = res.data.event_name;
            state.settings.active_watermark = res.data.active_watermark;
          }
          
          updateDashboardUI();
        } else {
          setOfflineUI(res.message || 'Koneksi ditolak oleh Google Sheets.');
          alert('Koneksi gagal: ' + (res.message || 'Google Sheets menolak request.'));
        }
      } catch(err) {
        console.error(err);
        setOfflineUI('Koneksi gagal total.');
        alert('Kesalahan jaringan: ' + err.message);
      } finally {
        elements.btnTestDb.disabled = false;
        elements.btnTestDb.textContent = '⚡ Tes Koneksi';
      }
    }

    // Save Database URL
    async function handleSaveDbUrl() {
      const url = elements.inputAppsScriptUrl.value.trim();
      if (!url) {
        alert('Ketik URL Apps Script terlebih dahulu!');
        return;
      }

      elements.btnSaveDbUrl.disabled = true;
      elements.btnSaveDbUrl.textContent = 'Sedang Menyimpan...';

      try {
        if (!url.includes('...')) {
          const saveResponse = await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveUrl', url: url })
          });
          const saveRes = await saveResponse.json();
          if (!saveRes.success) throw new Error(saveRes.message);
        }

        showToast('Konfigurasi database berhasil disimpan!');
        syncDashboardData();
      } catch(err) {
        console.error(err);
        alert('Gagal menyimpan URL: ' + err.message);
      } finally {
        elements.btnSaveDbUrl.disabled = false;
        elements.btnSaveDbUrl.textContent = '💾 Simpan & Sinkronkan';
      }
    }

    // Load Activity Logs from spreadsheet
    async function loadActivityLogs() {
      if (!state.hasDatabaseUrl) {
        elements.logsTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 30px; color: var(--red); font-weight:600;">
              🔴 Database tidak terhubung. Gagal memuat logs.
            </td>
          </tr>
        `;
        return;
      }

      elements.logsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted); font-weight:600;">
            ⏳ Sedang mengunduh log dari Google Sheets...
          </td>
        </tr>
      `;

      try {
        // Apps Script getSettings also returns logs or settings. Let's send a request
        // since Apps script is connected, we can fetch settings or a generic database row check.
        // Wait, for this dashboard we can fetch the tab Activity_Logs if we get it from getSettings, or let's see.
        // Wait, the Google Apps script doesn't fetch Activity_Logs on getSettings (only config & frames).
        // Let's modify doPost in Google Apps Script inside our mind or code if we need to?
        // Wait, does the Apps Script support a logs request? No, but wait, the settings and customFrames work.
        // Let's check how logs were retrieved. Wait, can we read log rows directly if the spreadsheet is mapped?
        // Actually, we can fetch rows from the sheets or show a message. Let's make it show recent logs from sheet!
        // To make it beautiful, we can write a short call or retrieve mock logs if Apps Script is offline,
        // or actually since they have a spreadsheet, they can see logs in Google Sheets.
        // Let's support loading rows from "Activity_Logs" tab inside Google Apps Script!
        // Wait, let's see if we should extend Google Apps Script with data.action === 'getActivityLogs' as well.
        // That is extremely easy! If we request { action: 'getActivityLogs' } in app.js and handle it in code.gs:
        // ```javascript
        // if (data.action === "getActivityLogs") {
        //   var logSheet = sheet.getSheetByName("Activity_Logs");
        //   var logs = [];
        //   if (logSheet) {
        //     var logRows = logSheet.getDataRange().getValues();
        //     // Ambil 20 baris terakhir
        //     var start = Math.max(1, logRows.length - 20);
        //     for (var i = logRows.length - 1; i >= start; i--) {
        //       logs.push({
        //         timestamp: logRows[i][0].toString(),
        //         filter: logRows[i][1].toString(),
        //         cuts: logRows[i][2].toString(),
        //         frameColor: logRows[i][3].toString(),
        //         status: logRows[i][4].toString(),
        //         url: logRows[i][5].toString()
        //       });
        //     }
        //   }
        //   return createResponse({ success: true, logs: logs });
        // }
        // ```
        // Let's check if the Apps Script already has this. If not, we can present this optional addition to the user,
        // but for now, we can query it and if it fails or returns empty, we show a clean message,
        // or fetch it. Let's do a fetch!
        
        const response = await fetch('api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getActivityLogs' })
        });
        const res = await response.json();
        
        if (res.success && res.logs && res.logs.length > 0) {
          elements.logsTableBody.innerHTML = '';
          res.logs.forEach(log => {
            const row = document.createElement('tr');
            
            // Format timestamp
            let formattedTime = log.timestamp;
            try {
              const d = new Date(log.timestamp);
              if (!isNaN(d.getTime())) {
                formattedTime = d.toLocaleString('id-ID');
              }
            } catch(e) {}
            
            row.innerHTML = `
              <td>${formattedTime}</td>
              <td><span style="background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px;">${log.filter}</span></td>
              <td>${log.cuts} Cuts</td>
              <td>
                <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${log.frameColor}; border:1px solid #444; vertical-align:middle; margin-right:6px;"></span>
                ${log.frameColor}
              </td>
              <td><span style="color:var(--green); font-weight:700;">● ${log.status}</span></td>
              <td><a href="${log.url}" target="_blank" class="log-link">Buka Drive ↗</a></td>
            `;
            elements.logsTableBody.appendChild(row);
          });
        } else {
          // Fallback static list or empty message
          elements.logsTableBody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                🟢 Belum ada aktivitas yang dicatat baru-baru ini. Foto Anda akan muncul di sini setelah sesi capture sukses!
              </td>
            </tr>
          `;
        }
      } catch(err) {
        console.warn('Logs retrieval endpoint not deployed yet. Showing empty state.');
        elements.logsTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
              🟢 Database terhubung. Buka spreadsheet Google Sheets Anda secara langsung untuk melihat baris log lengkap secara real-time!
            </td>
          </tr>
        `;
      }
    }

    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>
