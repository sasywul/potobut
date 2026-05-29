<?php
// api.php - Jembatan Proxy Aman untuk Potobut Google Sheets & Drive

// 1. PROXY EXTERNAL IMAGE GET REQUEST (Bypass CORS for Canvas)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'proxyImage') {
    $url = $_GET['url'] ?? '';
    if ($url) {
        // Hanya izinkan domain google untuk keamanan
        if (strpos($url, 'google.com') !== false || strpos($url, 'googleusercontent.com') !== false) {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            $imgData = curl_exec($ch);
            $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            curl_close($ch);
            
            if ($imgData !== false) {
                header("Content-Type: " . $contentType);
                echo $imgData;
                exit;
            }
        }
    }
    http_response_code(400);
    echo "Bad Request";
    exit;
}

header('Content-Type: application/json');

// Izinkan input JSON dari frontend
$inputRaw = file_get_contents('php://input');
$data = json_decode($inputRaw, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Payload tidak valid."]);
    exit;
}

$configFile = 'config.json';
$config = [];
if (file_exists($configFile)) {
    $config = json_decode(file_get_contents($configFile), true) ?: [];
}

// 1. FITUR SIMPAN URL API SECARA RAHASIA DI SERVER
if ($data['action'] === 'saveUrl') {
    $url = $data['url'] ?? '';
    if (empty($url)) {
        echo json_encode(["success" => false, "message" => "URL tidak boleh kosong."]);
        exit;
    }
    $config['apps_script_url'] = $url;
    file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
    echo json_encode(["success" => true, "message" => "URL Google Apps Script berhasil disimpan dengan aman di server!"]);
    exit;
}

// 2. GET API URL STATUS (Untuk Admin Panel)
if ($data['action'] === 'getUrl') {
    $url = $config['apps_script_url'] ?? '';
    if ($url) {
        $maskedUrl = substr($url, 0, 30) . "..." . substr($url, -10);
        echo json_encode(["success" => true, "url" => $maskedUrl, "has_url" => true]);
    } else {
        echo json_encode(["success" => true, "url" => "", "has_url" => false]);
    }
    exit;
}

// 4. TERUSKAN REQUEST KE GOOGLE APPS SCRIPT (PROXY)
$appsScriptUrl = $config['apps_script_url'] ?? '';

if (empty($appsScriptUrl)) {
    // Bypass login lokal dengan password bawaan jika belum terhubung database
    if ($data['action'] === 'login' && ($data['password'] ?? '') === 'rahasia123') {
        echo json_encode(["success" => true, "message" => "Masuk Mode Offline (Bypass)"]);
        exit;
    }
    echo json_encode(["success" => false, "message" => "Database belum terkonfigurasi. Silakan isi URL Apps Script di admin panel."]);
    exit;
}

// Kirim data menggunakan cURL dari PHP ke Google Apps Script (Server-to-Server)
$ch = curl_init($appsScriptUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $inputRaw);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: text/plain'
]);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Wajib diaktifkan untuk mengikuti redirect Google
curl_setopt($ch, CURLOPT_TIMEOUT, 30); // Batas waktu request 30 detik

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    echo json_encode([
        "success" => false,
        "message" => "Gagal menghubungi server database Google. Periksa koneksi internet hosting Anda.",
        "error" => $curlError
    ]);
    exit;
}

// Kembalikan hasil respon dari Google Apps Script langsung ke browser
echo $response;
