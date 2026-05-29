/* ============================================================
   THEMES.JS — Themed Frame Presets Engine for Potobut
   Draws premium frames: Mario, Batman, Sakura, Cyberpunk, Film
   ============================================================ */

const PhotoThemes = (() => {

  const THEMES = [
    { id: 'classic', name: 'Classic White 🎞️', desc: 'Minimalist clean white border' },
    { id: 'mario', name: 'Mario Bros 🍄', desc: 'Retro brick tiles & question blocks' },
    { id: 'batman', name: 'Batman Gotham 🦇', desc: 'Matte black & Bat logo oval' },
    { id: 'sakura', name: 'Kawaii Sakura 🌸', desc: 'Pastel pink with cherry blossoms' },
    { id: 'cyberpunk', name: 'Cyberpunk Neon ⚡', desc: 'Glowing magenta and cyan grid' },
    { id: 'vintage', name: 'Vintage Film 🎞️', desc: 'Aged paper with sprocket holes' }
  ];

  function getAll() {
    return THEMES;
  }

  /**
   * Helper: Draw image preserving aspect ratio (object-fit: cover) inside destination box
   */
  function drawCoverImage(ctx, img, dx, dy, dw, dh, transform) {
    const imgW = img.width || 640;
    const imgH = img.height || 480;

    const imgRatio = imgW / imgH;
    const destRatio = dw / dh;

    let sx, sy, sw, sh;

    if (imgRatio > destRatio) {
      // Image is wider than destination box -> Crop horizontal sides
      sw = imgH * destRatio;
      sh = imgH;
      sx = (imgW - sw) / 2;
      sy = 0;
    } else {
      // Image is taller than destination box -> Crop vertical sides (top/bottom)
      sw = imgW;
      sh = imgW / destRatio;
      sx = 0;
      sy = (imgH - sh) / 2;
    }

    // Apply Zoom & Pan adjustments to the cropping coordinates
    if (transform) {
      const zoom = transform.zoom || 1.0;
      const panX = transform.panX || 0; // percentage (-50 to 50)
      const panY = transform.panY || 0; // percentage (-50 to 50)

      // Calculate zoomed source width and height
      const swZoomed = sw / zoom;
      const shZoomed = sh / zoom;

      // Calculate maximum shift allowed to prevent cropping outside the original image bounds
      const maxShiftX = (sw - swZoomed) / 2;
      const maxShiftY = (sh - shZoomed) / 2;

      // Map panX and panY (-50 to 50) to actual pixel offset shift
      // Shifting source crop by opposite direction perfectly matches camera viewfinder pan direction
      const shiftX = (panX / 50) * maxShiftX;
      const shiftY = (panY / 50) * maxShiftY;

      const finalSx = sx + (sw - swZoomed) / 2 - shiftX;
      const finalSy = sy + (sh - shZoomed) / 2 - shiftY;

      ctx.drawImage(img, finalSx, finalSy, swZoomed, shZoomed, dx, dy, dw, dh);
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    }
  }

  /**
   * Helper: Create rounded rectangle path for canvas clipping/drawing
   */
  function roundRect(ctx, x, y, width, height, radius) {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Main theme canvas renderer
   * @param {string} themeId - Active theme id
   * @param {HTMLCanvasElement} canvas - Target strip canvas
   * @param {Array} photos - Array of captured photo canvases/images
   * @param {string} baseColor - Current selected background color
   * @param {Object} adminConfig - Settings config object
   * @param {Object} loadedFrames - Preloaded custom frame images
   */
  /**
   * Helper: Analyze custom frame transparent slots dynamically
   */
  function detectTransparentWindows(frameImg) {
    try {
      const W = frameImg.width;
      const H = frameImg.height;
      if (!W || !H) return null;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(frameImg, 0, 0);

      const imgData = ctx.getImageData(0, 0, W, H);
      const data = imgData.data;

      // 1. Analyze transparency per row
      const rowTransparentCount = new Array(H).fill(0);
      for (let y = 0; y < H; y++) {
        let transCount = 0;
        const rowOffset = y * W * 4;
        for (let x = 0; x < W; x++) {
          const alpha = data[rowOffset + x * 4 + 3];
          if (alpha < 120) { // transparent threshold
            transCount++;
          }
        }
        rowTransparentCount[y] = transCount;
      }

      // 2. Identify vertical spans of transparent slots
      let spans = [];
      let inSpan = false;
      let spanStart = 0;
      const minSpanHeight = H * 0.05; // at least 5% of frame height
      const rowThreshold = W * 0.15;  // at least 15% of width must be transparent

      for (let y = 0; y < H; y++) {
        const isTrans = rowTransparentCount[y] > rowThreshold;
        if (isTrans && !inSpan) {
          inSpan = true;
          spanStart = y;
        } else if (!isTrans && inSpan) {
          inSpan = false;
          const spanHeight = y - spanStart;
          if (spanHeight >= minSpanHeight) {
            spans.push({ top: spanStart, bottom: y, height: spanHeight });
          }
        }
      }
      if (inSpan) {
        const spanHeight = H - spanStart;
        if (spanHeight >= minSpanHeight) {
          spans.push({ top: spanStart, bottom: H, height: spanHeight });
        }
      }

      // Filter out narrow noise spans (e.g. transparent divider lines)
      if (spans.length > 0) {
        const maxSpanH = Math.max(...spans.map(s => s.height));
        spans = spans.filter(s => s.height >= maxSpanH * 0.8); // Must be at least 80% of the largest slot height
      }

      // We accept any number of slots between 2 and 8!
      if (spans.length < 2 || spans.length > 8) {
        console.warn(`Detected non-standard number of transparent slots: ${spans.length}`);
        return null;
      }

      // 3. Find horizontal bounds for each slot
      const windows = [];
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        let minX = W;
        let maxX = 0;

        for (let y = span.top; y < span.bottom; y++) {
          const rowOffset = y * W * 4;
          for (let x = 0; x < W; x++) {
            const alpha = data[rowOffset + x * 4 + 3];
            if (alpha < 120) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
            }
          }
        }

        if (minX < maxX) {
          windows.push({
            left: minX,
            top: span.top,
            width: maxX - minX,
            height: span.height
          });
        } else {
          return null;
        }
      }

      return windows;
    } catch (e) {
      console.error("Error in slot transparency detection:", e);
      return null;
    }
  }

  /**
   * Main theme canvas renderer
   * @param {string} themeId - Active theme id
   * @param {HTMLCanvasElement} canvas - Target strip canvas
   * @param {Array} photos - Array of captured photo canvases/images
   * @param {string} baseColor - Current selected background color
   * @param {Object} adminConfig - Settings config object
   * @param {Object} loadedFrames - Preloaded custom frame images
   * @param {Array} photoTransforms - Array of custom photo transforms {zoom, panX, panY}
   */
  function renderTheme(themeId, canvas, photos, baseColor, adminConfig, loadedFrames, photoTransforms) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const frameCount = photos.length || 4;

    const padding = w * 0.06;
    const gap = 12;
    const footerH = w * 0.12;
    const photoW = w - padding * 2;
    const photoH = (h - padding * 2 - footerH - gap * (frameCount - 1)) / frameCount;

    // --- 1. Draw Base Theme Background ---
    ctx.save();
    applyBackground(ctx, themeId, w, h, baseColor);
    ctx.restore();

    // --- 2. Draw Decorative Theme Background Elements (Drawn BEFORE photos) ---
    ctx.save();
    drawBackgroundDecorations(ctx, themeId, w, h, padding, photoH, gap, frameCount, footerH);
    ctx.restore();

    // --- 3. Run Dynamic Transparent Slot Detection for Custom Frames ---
    const isCustom = themeId.startsWith('FRM_') || themeId.startsWith('FRM-');
    const frameImg = isCustom && loadedFrames && loadedFrames[themeId] && loadedFrames[themeId] !== 'loading' ? loadedFrames[themeId] : null;
    const detectedSlots = frameImg ? detectTransparentWindows(frameImg) : null;

    // Use detected slots count if available, otherwise fallback to frameCount
    const slotsCount = detectedSlots ? detectedSlots.length : frameCount;

    // --- 4. Draw Captured Photos ---
    for (let i = 0; i < slotsCount; i++) {
      ctx.save();

      let drawX, drawY, drawW, drawH;
      let useClipping = true;

      if (detectedSlots && detectedSlots[i]) {
        // Perfect auto-aligning to transparent holes: Scale detected coordinates to canvas w/h
        const slot = detectedSlots[i];
        const scaleX = w / frameImg.width;
        const scaleY = h / frameImg.height;

        const slotLeft = slot.left * scaleX;
        const slotTop = slot.top * scaleY;
        const slotW = slot.width * scaleX;
        const slotH = slot.height * scaleY;

        // Add 3px bleed overlap on all sides so there are absolutely no subpixel gaps around borders
        drawX = slotLeft - 3;
        drawY = slotTop - 3;
        drawW = slotW + 6;
        drawH = slotH + 6;
        useClipping = false; // The custom frame itself is layered on top and clips automatically!
      } else {
        // Math fallback
        const py = padding + i * (photoH + gap);
        drawX = padding;
        drawY = py;
        drawW = photoW;
        drawH = photoH;
        
        drawPhotoBorder(ctx, themeId, padding, py, photoW, photoH);
      }

      if (useClipping) {
        ctx.beginPath();
        roundRect(ctx, drawX, drawY, drawW, drawH, 16);
        ctx.clip();
      }

      if (photos[i]) {
        const t = (photoTransforms && photoTransforms[i]) ? photoTransforms[i] : null;
        drawCoverImage(ctx, photos[i], drawX, drawY, drawW, drawH, t);
      } else {
        // Draw elegant default placeholder
        ctx.fillStyle = '#f3f3f5';
        ctx.fillRect(drawX, drawY, drawW, drawH);
        ctx.fillStyle = '#b0b0bb';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i + 1, drawX + drawW / 2, drawY + drawH / 2);
      }
      ctx.restore();
    }

    // --- 4. Draw Foreground Theme Decorations (Drawn OVER photos & footer) ---
    ctx.save();
    drawForegroundDecorations(ctx, themeId, w, h, padding, photoH, gap, frameCount, footerH, adminConfig);
    ctx.restore();

    // --- 5. Draw Custom Google Drive PNG Frame Overlay (If active & loaded) ---
    if (themeId.startsWith('FRM_') || themeId.startsWith('FRM-')) {
      if (loadedFrames && loadedFrames[themeId] && loadedFrames[themeId] !== 'loading') {
        ctx.drawImage(loadedFrames[themeId], 0, 0, w, h);
      }
    }
  }

  // --- Theme Background Painters ---
  function applyBackground(ctx, themeId, w, h, baseColor) {
    if (themeId === 'mario') {
      // Mario Red background
      ctx.fillStyle = '#E52521';
      ctx.fillRect(0, 0, w, h);
    } else if (themeId === 'batman') {
      // Sleek Gotham Matte Black
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(0, 0, w, h);
    } else if (themeId === 'sakura') {
      // Warm Sakura Pastel Pink
      ctx.fillStyle = '#FFEBEF';
      ctx.fillRect(0, 0, w, h);
    } else if (themeId === 'cyberpunk') {
      // Deep Void Purple
      ctx.fillStyle = '#0A0515';
      ctx.fillRect(0, 0, w, h);
    } else if (themeId === 'vintage') {
      // Aged Sepia/Parchment
      ctx.fillStyle = '#F4ECD8';
      ctx.fillRect(0, 0, w, h);
    } else {
      // Classic Theme: Respects color circle selection
      if (baseColor === 'checkered') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#f0f0f5';
        const size = 16;
        for (let x = 0; x < w; x += size * 2) {
          for (let y = 0; y < h; y += size * 2) {
            ctx.fillRect(x, y, size, size);
            ctx.fillRect(x + size, y + size, size, size);
          }
        }
      } else if (baseColor.includes('gradient')) {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        if (baseColor.includes('#fbc2eb')) {
          grad.addColorStop(0, '#fbc2eb');
          grad.addColorStop(1, '#a6c1ee');
        } else if (baseColor.includes('#84fab0')) {
          grad.addColorStop(0, '#84fab0');
          grad.addColorStop(1, '#8fd3f4');
        } else {
          grad.addColorStop(0, '#a1c4fd');
          grad.addColorStop(1, '#c2e9fb');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  // --- Background decorations (sprocket holes, grids, gridlines) ---
  function drawBackgroundDecorations(ctx, themeId, w, h, padding, photoH, gap, frameCount, footerH) {
    if (themeId === 'vintage') {
      // Draw Film sprocket holes along left/right borders
      ctx.fillStyle = '#111111';
      const holeW = 12;
      const holeH = 16;
      const holeSpacing = 28;
      
      for (let y = 15; y < h - 15; y += holeSpacing) {
        // Left holes
        ctx.fillRect(10, y, holeW, holeH);
        // Right holes
        ctx.fillRect(w - 10 - holeW, y, holeW, holeH);
      }
    } else if (themeId === 'cyberpunk') {
      // Draw neon grid lines at margins
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      
      // Vertical grid lines
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // Horizontal grid lines
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
  }

  // --- Borders around individual picture slots ---
  function drawPhotoBorder(ctx, themeId, x, y, w, h) {
    if (themeId === 'mario') {
      // Bold black retro outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);
    } else if (themeId === 'batman') {
      // Sleek Gotham Yellow borders
      ctx.strokeStyle = '#FDE100';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    } else if (themeId === 'cyberpunk') {
      // Dual neon borders
      ctx.strokeStyle = '#FF007A';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);
      
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    } else {
      // Clean borders
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }
  }

  // --- Foreground decorations (Bat-logo, Mario pipes, Sakura blossoms, glowing titles) ---
  function drawForegroundDecorations(ctx, themeId, w, h, padding, photoH, gap, frameCount, footerH, adminConfig) {
    const footerY = h - footerH / 2;

    if (themeId === 'mario') {
      // --- MARIO BROS Presets ---
      // 1. Draw Brick Block under header
      drawMarioBrick(ctx, 35, 12, 40, 20);
      drawMarioBrick(ctx, 35 + 44, 12, 40, 20);
      
      // 2. Draw Pixel Question Block at top right
      drawMarioQuestionBlock(ctx, w - 80, 10, 36, 36);

      // 3. Draw Green Warp Pipe at bottom left
      drawMarioPipe(ctx, 30, h - footerH - 12, 48, 55);

      // 4. Draw Cute Green Shell at bottom right
      drawMarioShell(ctx, w - 75, h - footerH - 2, 32);

      // 5. Retro Mario Footer Text
      ctx.fillStyle = '#F4B300';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const marioText = 'SUPER MARIO 🍄';
      if (adminConfig && adminConfig.event_name) {
        ctx.font = '900 18px "Poppins", sans-serif';
        ctx.strokeText(marioText, w / 2, footerY - 10);
        ctx.fillText(marioText, w / 2, footerY - 10);
        
        ctx.font = 'bold 12px "Poppins", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeText(adminConfig.event_name, w / 2, footerY + 12);
        ctx.fillText(adminConfig.event_name, w / 2, footerY + 12);
      } else {
        ctx.font = '900 22px "Poppins", sans-serif';
        ctx.strokeText(marioText, w / 2, footerY);
        ctx.fillText(marioText, w / 2, footerY);
      }

    } else if (themeId === 'batman') {
      // --- BATMAN Presets ---
      // 1. Gotham City silhouette in header
      drawGothamCity(ctx, w);

      // 2. Draw Bat Oval logo at footer
      const logoW = 100;
      const logoH = 50;
      const logoX = w / 2;
      const logoY = h - footerH / 2 - 10;

      // Yellow Oval
      ctx.fillStyle = '#FDE100';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(logoX, logoY, logoW / 2, logoH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Vector Bat Silhouette inside oval
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      // Head and ears
      ctx.moveTo(logoX - 4, logoY - 14);
      ctx.lineTo(logoX - 8, logoY - 7);
      ctx.lineTo(logoX - 18, logoY - 8);
      // Left Wing top
      ctx.bezierCurveTo(logoX - 34, logoY - 15, logoX - 44, logoY - 2, logoX - 45, logoY + 4);
      // Left Wing bottom curves
      ctx.bezierCurveTo(logoX - 35, logoY - 1, logoX - 25, logoY + 8, logoX - 16, logoY + 4);
      ctx.bezierCurveTo(logoX - 12, logoY + 11, logoX - 6, logoY + 13, logoX, logoY + 8);
      // Right Wing bottom curves
      ctx.bezierCurveTo(logoX + 6, logoY + 13, logoX + 12, logoY + 11, logoX + 16, logoY + 4);
      ctx.bezierCurveTo(logoX + 25, logoY + 8, logoX + 35, logoY - 1, logoX + 45, logoY + 4);
      // Right Wing top
      ctx.bezierCurveTo(logoX + 44, logoY - 2, logoX + 34, logoY - 15, logoX + 18, logoY - 8);
      ctx.lineTo(logoX + 8, logoY - 7);
      ctx.lineTo(logoX + 4, logoY - 14);
      ctx.closePath();
      ctx.fill();

      // Footer Text
      ctx.fillStyle = '#FDE100';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (adminConfig && adminConfig.event_name) {
        ctx.font = 'bold 13px "Poppins", sans-serif';
        ctx.fillText('GOTHAM KNIGHT 🦇', w / 2, h - 26);
        ctx.font = 'bold 10px "Poppins", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(adminConfig.event_name.toUpperCase(), w / 2, h - 10);
      } else {
        ctx.font = 'bold 15px "Poppins", sans-serif';
        ctx.fillText('GOTHAM KNIGHT 🦇', w / 2, h - 18);
      }

    } else if (themeId === 'sakura') {
      // --- KAWAII SAKURA Presets ---
      // 1. Draw scattered Sakura blossoms & falling petals
      ctx.fillStyle = '#FFB7C5';
      drawSakuraFlower(ctx, 35, 20, 16);
      drawSakuraFlower(ctx, w - 40, 30, 20);
      drawSakuraFlower(ctx, w - 80, h - 40, 14);
      drawSakuraFlower(ctx, 50, h - footerH - 10, 18);

      // Cute hearts
      drawSakuraHeart(ctx, 80, 50, 8);
      drawSakuraHeart(ctx, w - 120, h - footerH - 2, 10);

      // 2. Sakura Text
      ctx.fillStyle = '#FF5A87';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const sakuraText = 'SWEET SAKURA 🌸';
      if (adminConfig && adminConfig.event_name) {
        ctx.font = 'bold 17px "Poppins", sans-serif';
        ctx.fillText(sakuraText, w / 2, footerY - 10);
        ctx.font = '600 12px "Poppins", sans-serif';
        ctx.fillStyle = '#FF7A99';
        ctx.fillText(adminConfig.event_name, w / 2, footerY + 12);
      } else {
        ctx.font = 'bold 20px "Poppins", sans-serif';
        ctx.fillText(sakuraText, w / 2, footerY);
      }

    } else if (themeId === 'cyberpunk') {
      // --- CYBERPUNK NEON Presets ---
      // Neon Glowing title
      ctx.fillStyle = '#00F0FF';
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const neonText = 'NEON CITY ⚡';
      if (adminConfig && adminConfig.event_name) {
        ctx.font = 'bold 18px "Poppins", sans-serif';
        ctx.fillText(neonText, w / 2, footerY - 10);
        ctx.font = 'bold 11px "Poppins", sans-serif';
        ctx.fillStyle = '#FF007A';
        ctx.shadowColor = '#FF007A';
        ctx.shadowBlur = 6;
        ctx.fillText(adminConfig.event_name.toUpperCase(), w / 2, footerY + 12);
      } else {
        ctx.font = 'bold 22px "Poppins", sans-serif';
        ctx.fillText(neonText, w / 2, footerY);
      }
      ctx.shadowBlur = 0; // Reset glow

      // Draw futuristic arrows at margins
      ctx.strokeStyle = '#FF007A';
      ctx.shadowColor = '#FF007A';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 2.5;

      // Draw bottom-right arrows
      ctx.beginPath();
      ctx.moveTo(w - 50, h - 35);
      ctx.lineTo(w - 35, h - 35);
      ctx.lineTo(w - 35, h - 50);
      ctx.stroke();

      // Draw top-left arrows
      ctx.beginPath();
      ctx.moveTo(35, 50);
      ctx.lineTo(35, 35);
      ctx.lineTo(50, 35);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset glow

    } else if (themeId === 'vintage') {
      // --- VINTAGE FILM Presets ---
      ctx.fillStyle = '#4A3E3D';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const vintageText = adminConfig && adminConfig.active_watermark ? adminConfig.active_watermark.toUpperCase() : 'POTOBUT FILM 🎞️';
      if (adminConfig && adminConfig.event_name) {
        ctx.font = 'bold 15px "Courier New", monospace';
        ctx.fillText(vintageText, w / 2, footerY - 10);
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillText(adminConfig.event_name.toUpperCase(), w / 2, footerY + 12);
      } else {
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText(vintageText, w / 2, footerY);
      }
      
      // Vintage frame corner details
      ctx.strokeStyle = '#4A3E3D';
      ctx.lineWidth = 1.5;
      const size = 12;

      for (let i = 0; i < frameCount; i++) {
        const py = padding + i * (photoH + gap);
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(padding - 4, py - 4 + size);
        ctx.lineTo(padding - 4, py - 4);
        ctx.lineTo(padding - 4 + size, py - 4);
        ctx.stroke();

        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(w - padding + 4, py + photoH + 4 - size);
        ctx.lineTo(w - padding + 4, py + photoH + 4);
        ctx.lineTo(w - padding + 4 - size, py + photoH + 4);
        ctx.stroke();
      }

    } else {
      // --- CLASSIC THEME Presets ---
      ctx.fillStyle = '#FF5A87';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const classicText = adminConfig && adminConfig.active_watermark ? adminConfig.active_watermark : 'POTOBUT ✦';
      if (adminConfig && adminConfig.event_name) {
        ctx.font = '900 18px "Poppins", sans-serif';
        ctx.fillText(classicText, w / 2, footerY - 10);
        ctx.font = '700 12px "Poppins", sans-serif';
        ctx.fillStyle = '#888888';
        ctx.fillText(adminConfig.event_name, w / 2, footerY + 12);
      } else {
        ctx.font = '900 20px "Poppins", sans-serif';
        ctx.fillText(classicText, w / 2, footerY);
      }
    }
  }

  // --- Mario Asset Painters ---
  function drawMarioBrick(ctx, x, y, w, h) {
    ctx.fillStyle = '#d45e14';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Brick mortar lines
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.moveTo(x + w / 4, y + h / 2);
    ctx.lineTo(x + w / 4, y + h);
    ctx.moveTo(x + (3 * w) / 4, y + h / 2);
    ctx.lineTo(x + (3 * w) / 4, y + h);
    ctx.stroke();
  }

  function drawMarioQuestionBlock(ctx, x, y, w, h) {
    ctx.fillStyle = '#fcc100';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Question Mark text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x + w / 2, x + h / 2 - 2);

    // Corner pixel dots
    ctx.fillRect(x + 3, y + 3, 2, 2);
    ctx.fillRect(x + w - 5, y + 3, 2, 2);
    ctx.fillRect(x + 3, y + h - 5, 2, 2);
    ctx.fillRect(x + w - 5, y + h - 5, 2, 2);
  }

  function drawMarioPipe(ctx, x, y, w, h) {
    ctx.fillStyle = '#00a300';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#00c400';
    ctx.fillRect(x + 4, y, w - 8, h);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Pipe top Lip
    const lipH = 14;
    ctx.fillStyle = '#00a300';
    ctx.fillRect(x - 4, y, w + 8, lipH);
    ctx.fillStyle = '#00c400';
    ctx.fillRect(x - 2, y, w + 4, lipH);
    ctx.strokeRect(x - 4, y, w + 8, lipH);
  }

  function drawMarioShell(ctx, x, y, r) {
    ctx.fillStyle = '#00c400';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI, true);
    ctx.lineTo(x + r, y);
    ctx.fill();
    ctx.stroke();

    // Shell bottom lip
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - r - 2, y, r * 2 + 4, 6);
    ctx.strokeRect(x - r - 2, y, r * 2 + 4, 6);
  }

  // --- Batman Asset Painters ---
  function drawGothamCity(ctx, w) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    // Render gothic building outlines
    ctx.beginPath();
    ctx.moveTo(10, 50);
    ctx.lineTo(30, 25);
    ctx.lineTo(35, 25);
    ctx.lineTo(40, 50);
    ctx.lineTo(55, 15);
    ctx.lineTo(60, 50);
    ctx.lineTo(w - 70, 50);
    ctx.lineTo(w - 55, 20);
    ctx.lineTo(w - 45, 50);
    ctx.lineTo(w - 30, 30);
    ctx.lineTo(w - 10, 50);
    ctx.lineTo(w, 50);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
  }

  // --- Sakura Asset Painters ---
  function drawSakuraFlower(ctx, x, y, r) {
    ctx.fillStyle = '#FFA6C9';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      ctx.arc(px, py, r * 0.55, 0, Math.PI * 2);
    }
    ctx.fill();

    // Center pistil yellow dots
    ctx.fillStyle = '#FFF275';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSakuraHeart(ctx, x, y, size) {
    ctx.fillStyle = '#FF7A99';
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size);
    ctx.bezierCurveTo(x + size, y + size / 3, x + size / 2, y - size / 2, x, y + size * 0.3);
    ctx.fill();
  }

  return {
    getAll,
    renderTheme,
    detectTransparentWindows
  };

})();
