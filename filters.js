/* ============================================================
   FILTERS.JS — Filter Engine for Potobut
   5 filters + canvas-based application
   ============================================================ */

const PhotoFilters = (() => {

  /**
   * Filter definitions
   * Each filter has:
   *  - name: display name
   *  - id: identifier
   *  - css: CSS filter string for live preview
   *  - apply: function(imageData) for canvas pixel manipulation
   */
  const FILTERS = {
    none: {
      name: 'Normal',
      id: 'none',
      css: 'none',
      apply: (ctx, canvas) => { /* no-op */ }
    },
    retro: {
      name: 'Retro Film',
      id: 'retro',
      css: 'sepia(0.6) contrast(1.1) brightness(0.95) saturate(1.2)',
      apply: (ctx, canvas) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          // Sepia tone
          data[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
          // Slightly increase contrast
          data[i]     = clampContrast(data[i], 1.1);
          data[i + 1] = clampContrast(data[i + 1], 1.1);
          data[i + 2] = clampContrast(data[i + 2], 1.1);
        }
        ctx.putImageData(imageData, 0, 0);
        // Add subtle vignette
        addVignette(ctx, canvas);
      }
    },
    bw: {
      name: 'Hitam Putih',
      id: 'bw',
      css: 'grayscale(1) contrast(1.1)',
      apply: (ctx, canvas) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const val = clampContrast(gray, 1.1);
          data[i] = data[i + 1] = data[i + 2] = val;
        }
        ctx.putImageData(imageData, 0, 0);
      }
    },
    warm: {
      name: 'Warm Glow',
      id: 'warm',
      css: 'brightness(1.05) saturate(1.3) hue-rotate(-10deg)',
      apply: (ctx, canvas) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i]     = Math.min(255, data[i] * 1.12);      // boost red
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);  // slight green boost
          data[i + 2] = Math.max(0, data[i + 2] * 0.88);    // reduce blue
          // Brightness
          data[i]     = Math.min(255, data[i] * 1.05);
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);
          data[i + 2] = Math.min(255, data[i + 2] * 1.05);
        }
        ctx.putImageData(imageData, 0, 0);
      }
    },
    cool: {
      name: 'Cool Tone',
      id: 'cool',
      css: 'brightness(1.05) saturate(0.85) hue-rotate(15deg)',
      apply: (ctx, canvas) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i]     = Math.max(0, data[i] * 0.9);         // reduce red
          data[i + 1] = Math.min(255, data[i + 1] * 1.02);  // slight green
          data[i + 2] = Math.min(255, data[i + 2] * 1.15);  // boost blue
          // Slight desaturate
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i]     = data[i]     * 0.85 + avg * 0.15;
          data[i + 1] = data[i + 1] * 0.85 + avg * 0.15;
          data[i + 2] = data[i + 2] * 0.85 + avg * 0.15;
        }
        ctx.putImageData(imageData, 0, 0);
      }
    },
    'vintage-pink': {
      name: 'Vintage Pink',
      id: 'vintage-pink',
      css: 'sepia(0.3) saturate(1.4) hue-rotate(-20deg) brightness(1.05)',
      apply: (ctx, canvas) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Soft sepia base
          const r = data[i], g = data[i + 1], b = data[i + 2];
          let sr = r * 0.393 + g * 0.769 + b * 0.189;
          let sg = r * 0.349 + g * 0.686 + b * 0.168;
          let sb = r * 0.272 + g * 0.534 + b * 0.131;
          // Blend with original (30% sepia)
          data[i]     = Math.min(255, r * 0.7 + sr * 0.3 + 15); // pink tint
          data[i + 1] = Math.min(255, g * 0.7 + sg * 0.3);
          data[i + 2] = Math.min(255, b * 0.7 + sb * 0.3 + 8);
          // Brightness
          data[i]     = Math.min(255, data[i] * 1.05);
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);
          data[i + 2] = Math.min(255, data[i + 2] * 1.05);
        }
        ctx.putImageData(imageData, 0, 0);
        addVignette(ctx, canvas, 'rgba(200, 100, 150, 0.15)');
      }
    }
  };

  // Utility: clamp contrast
  function clampContrast(val, factor) {
    return Math.min(255, Math.max(0, ((val / 255 - 0.5) * factor + 0.5) * 255));
  }

  // Utility: add vignette effect
  function addVignette(ctx, canvas, color = 'rgba(0,0,0,0.3)') {
    const w = canvas.width, h = canvas.height;
    const gradient = ctx.createRadialGradient(w/2, h/2, w*0.3, w/2, h/2, w*0.75);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Get CSS filter string for live preview
   */
  function getCSSFilter(filterId) {
    const filter = FILTERS[filterId];
    return filter ? filter.css : 'none';
  }

  /**
   * Apply filter to a canvas context (pixel manipulation)
   */
  function applyToCanvas(filterId, ctx, canvas) {
    const filter = FILTERS[filterId];
    if (filter && filter.apply) {
      filter.apply(ctx, canvas);
    }
  }

  /**
   * Get all filter definitions
   */
  function getAll() {
    return Object.values(FILTERS);
  }

  /**
   * Get a single filter definition
   */
  function get(filterId) {
    return FILTERS[filterId] || FILTERS.none;
  }

  // Map filter IDs to their canvas element IDs
  const PREVIEW_ID_MAP = {
    'none': 'filterPreviewNone',
    'retro': 'filterPreviewRetro',
    'bw': 'filterPreviewBw',
    'warm': 'filterPreviewWarm',
    'cool': 'filterPreviewCool',
    'vintage-pink': 'filterPreviewVintage'
  };

  /**
   * Generate filter preview thumbnails on canvases
   */
  function generatePreviews(sourceCanvas) {
    if (!sourceCanvas || sourceCanvas.width === 0) return;

    Object.keys(FILTERS).forEach(filterId => {
      const filter = FILTERS[filterId];
      const canvasId = PREVIEW_ID_MAP[filterId];
      const previewCanvas = canvasId ? document.getElementById(canvasId) : null;
      if (!previewCanvas) return;

      const ctx = previewCanvas.getContext('2d');
      const size = 64;
      previewCanvas.width = size;
      previewCanvas.height = size;

      // Draw source scaled down
      ctx.drawImage(sourceCanvas, 0, 0, size, size);

      // Apply filter
      if (filterId !== 'none') {
        applyToCanvas(filterId, ctx, previewCanvas);
      }
    });
  }

  return {
    getCSSFilter,
    applyToCanvas,
    generatePreviews,
    getAll,
    get
  };

})();
