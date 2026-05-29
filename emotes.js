/* ============================================================
   EMOTES.JS — Emote/Sticker System for Potobut
   Selection, placement, and canvas rendering
   ============================================================ */

const PhotoEmotes = (() => {

  // Available emotes
  const EMOTE_LIST = [
    '😎', '🤪', '😍', '🥳',
    '❤️', '⭐', '🔥', '✨',
    '🎉', '💖', '🌟', '😘',
    '🤩', '💕', '🎀', '🦋',
    '🌈', '💫', '🍭', '🎵'
  ];

  // Emote selections per frame: { frameIndex: { emote, x, y } }
  let selections = {};

  /**
   * Get list of all emotes
   */
  function getAll() {
    return EMOTE_LIST;
  }

  /**
   * Set emote for a frame
   */
  function setEmote(frameIndex, emote) {
    if (!selections[frameIndex]) {
      selections[frameIndex] = {};
    }
    selections[frameIndex].emote = emote;
    // Default position: top-right corner
    selections[frameIndex].x = 0.8;
    selections[frameIndex].y = 0.15;
  }

  /**
   * Remove emote from a frame
   */
  function removeEmote(frameIndex) {
    delete selections[frameIndex];
  }

  /**
   * Get emote for a frame
   */
  function getEmote(frameIndex) {
    return selections[frameIndex] || null;
  }

  /**
   * Get all selections
   */
  function getSelections() {
    return { ...selections };
  }

  /**
   * Clear all selections
   */
  function clearAll() {
    selections = {};
  }

  /**
   * Render emote onto a canvas context at the specified frame area
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} frameIndex
   * @param {number} x - Frame x position on canvas
   * @param {number} y - Frame y position on canvas
   * @param {number} w - Frame width on canvas
   * @param {number} h - Frame height on canvas
   */
  function renderOnCanvas(ctx, frameIndex, x, y, w, h) {
    const sel = selections[frameIndex];
    if (!sel || !sel.emote) return;

    const fontSize = Math.min(w, h) * 0.2;
    const emoteX = x + w * sel.x;
    const emoteY = y + h * sel.y;

    ctx.save();
    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add subtle shadow behind emote
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.fillText(sel.emote, emoteX, emoteY);
    ctx.restore();
  }

  return {
    getAll,
    setEmote,
    removeEmote,
    getEmote,
    getSelections,
    clearAll,
    renderOnCanvas
  };

})();
