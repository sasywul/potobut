/* ============================================================
   CAMERA.JS — Camera/WebRTC System for Potobut (BeautyPlus style)
   Handles camera stream, mirror toggles, capture frames, and
   graceful error placeholders.
   ============================================================ */

const PhotoCamera = (() => {

  let stream = null;
  let videoElement = null;
  let isMirrored = true;
  let currentFilter = 'none';
  let isCapturing = false;

  /**
   * Initialize camera system elements
   */
  function init() {
    videoElement = document.getElementById('videoFeed');
  }

  /**
   * Start camera stream
   */
  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      // Connect stream to video element
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        
        const placeholder = document.getElementById('cameraPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
      }

      // Sync active mirror state
      updateMirror(isMirrored);

      return true;
    } catch (err) {
      console.error('Camera access failed:', err);
      showCameraError();
      return false;
    }
  }

  /**
   * Stop camera stream
   */
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
      videoElement.style.display = 'none';
    }
  }

  /**
   * Show camera error fallback UI
   */
  function showCameraError() {
    if (videoElement) videoElement.style.display = 'none';
    
    const placeholder = document.getElementById('cameraPlaceholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
      placeholder.querySelector('.camera-placeholder-text').innerHTML = 
        'Tidak dapat mengakses kamera.<br><span style="font-size:0.75rem;font-weight:normal;opacity:0.8;">Jika menggunakan berkas lokal (file://), silakan gunakan tombol "Unggah Foto" di atas untuk memasukkan foto.</span>';
    }
  }

  /**
   * Toggle or set mirror mode
   */
  function updateMirror(mirrored) {
    isMirrored = mirrored;
    const container = document.getElementById('cameraPreviewContainer');
    if (container) {
      if (mirrored) {
        container.classList.add('mirrored');
      } else {
        container.classList.remove('mirrored');
      }
    }
  }

  /**
   * Set CSS live filter on video feed
   */
  function setFilter(filterId) {
    currentFilter = filterId;
    const cssFilter = PhotoFilters.getCSSFilter(filterId);
    if (videoElement) {
      videoElement.style.filter = cssFilter;
    }
  }

  /**
   * Get mirror state
   */
  function getMirrored() {
    return isMirrored;
  }

  /**
   * Get active filter
   */
  function getFilter() {
    return currentFilter;
  }

  /**
   * Check if camera stream is running
   */
  function isActive() {
    return stream !== null && stream.active;
  }

  /**
   * Take a single snapshot from the video feed
   */
  function captureFrame() {
    if (!videoElement || !stream) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');

    // Draw video flipped if mirrored
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Apply color filter to static image
    if (currentFilter !== 'none') {
      PhotoFilters.applyToCanvas(currentFilter, ctx, canvas);
    }

    return canvas;
  }

  /**
   * Run the full capture sequence loop
   */
  async function runCaptureSequence(frameCount, countdownSec, onCountdown, onCapture, onComplete) {
    if (isCapturing) return;
    isCapturing = true;

    for (let i = 0; i < frameCount; i++) {
      // Countdown
      for (let sec = countdownSec; sec > 0; sec--) {
        if (onCountdown) onCountdown(sec, i);
        await sleep(1000);
      }

      // Flash
      triggerFlash();
      await sleep(200);

      // Snapshot
      const canvas = captureFrame();
      if (onCapture) onCapture(canvas, i);

      // Brief gap between frames
      if (i < frameCount - 1) {
        await sleep(800);
      }
    }

    isCapturing = false;
    if (onComplete) onComplete();
  }

  /**
   * Trigger screen flash effect
   */
  function triggerFlash() {
    const flash = document.getElementById('flashOverlay');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 250);
    }
  }

  // Safe mock for interval previews (no-op since we styled thumbnails with premium static gradients)
  function generateFilterPreviews() {
    // Performant no-op
  }

  // Helper sleep
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return {
    init,
    startCamera,
    stopCamera,
    updateMirror,
    setFilter,
    getMirrored,
    getFilter,
    isActive,
    captureFrame,
    runCaptureSequence,
    triggerFlash,
    generateFilterPreviews
  };

})();
