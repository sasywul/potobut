// api/index.js — Vercel Serverless Function (pengganti api.php)
// URL Apps Script disimpan AMAN di Environment Variable Vercel (server-side only)

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ============================================================
  // GET: Proxy Image (Bypass CORS untuk Canvas rendering)
  // ============================================================
  if (req.method === 'GET' && req.query.action === 'proxyImage') {
    const url = req.query.url || '';
    if (url && (url.includes('google.com') || url.includes('googleusercontent.com'))) {
      try {
        const response = await fetch(url, { redirect: 'follow' });
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/png';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(Buffer.from(buffer));
      } catch (err) {
        return res.status(500).json({ error: 'Gagal proxy gambar: ' + err.message });
      }
    }
    return res.status(400).send('Bad Request: URL tidak valid atau bukan domain Google.');
  }

  // ============================================================
  // POST: Semua aksi API (login, getSettings, uploadPhoto, dll)
  // ============================================================
  if (req.method === 'POST') {
    const data = req.body;

    if (!data || !data.action) {
      return res.status(400).json({ success: false, message: 'Payload tidak valid.' });
    }

    // Baca URL Apps Script dari Environment Variable (RAHASIA, server-side only)
    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';

    // --- Aksi: Simpan URL (di Vercel, harus set via Dashboard) ---
    if (data.action === 'saveUrl') {
      if (APPS_SCRIPT_URL) {
        return res.json({
          success: true,
          message: 'URL Apps Script sudah dikonfigurasi via Environment Variable Vercel.'
        });
      }
      return res.json({
        success: false,
        message: 'Pada Vercel, set variable APPS_SCRIPT_URL di Settings → Environment Variables pada dashboard Vercel Anda.'
      });
    }

    // --- Aksi: Cek status URL (masked untuk keamanan) ---
    if (data.action === 'getUrl') {
      if (APPS_SCRIPT_URL) {
        const masked = APPS_SCRIPT_URL.substring(0, 30) + '...' + APPS_SCRIPT_URL.slice(-10);
        return res.json({ success: true, url: masked, has_url: true });
      }
      return res.json({ success: true, url: '', has_url: false });
    }

    // --- Jika belum ada URL Apps Script ---
    if (!APPS_SCRIPT_URL) {
      // Bypass login offline dengan password bawaan
      if (data.action === 'login' && (data.password || '') === 'rahasia123') {
        return res.json({ success: true, message: 'Masuk Mode Offline (Bypass)' });
      }
      return res.json({
        success: false,
        message: 'Database belum terkonfigurasi. Set APPS_SCRIPT_URL di Vercel Environment Variables.'
      });
    }

    // ============================================================
    // PROXY: Teruskan semua request ke Google Apps Script
    // (Server-to-Server, URL tidak pernah terekspos ke browser)
    // ============================================================
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(data),
        redirect: 'follow'
      });

      const responseText = await response.text();

      res.setHeader('Content-Type', 'application/json');
      return res.send(responseText);
    } catch (err) {
      return res.json({
        success: false,
        message: 'Gagal menghubungi server Google Apps Script.',
        error: err.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
