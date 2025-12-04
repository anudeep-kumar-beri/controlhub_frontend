// logoLoader.js — Load tiered brand logos from public/branding as base64

/**
 * Map tier to public paths. Keep filenames consistent with your branding folder.
 * Tier 1: Full Authority Crest
 * Tier 2: Simplified Shield
 * Tier 3: Minimal Icon Mark
 */
// Default filenames based on your branding folder contents
const TIER_PATHS = {
  1: '/branding/tier-1/tier1_crest_a.jpg',
  2: '/branding/tier-2/tier2_shield_a.jpg',
  3: '/branding/tier-3/tier3_mark.jpg'
};

// Optional variants map for more creative usage
const VARIANT_PATHS = {
  1: {
    default: ['/branding/tier-1/tier1_crest_a.jpg'],
    gold_on_black: ['/branding/tier-1/tier1_crest_b.jpg', '/branding/tier-1/tier1_crest_a.jpg'],
    black_on_cream: ['/branding/tier-1/tier1_crest_a.jpg', '/branding/tier-1/tier1_crest_b.jpg'],
    white: ['/branding/tier-1/tier1_crest_b.jpg', '/branding/tier-1/tier1_crest_a.jpg']
  },
  2: {
    default: ['/branding/tier-2/tier2_shield_a.jpg'],
    outline_gold: ['/branding/tier-2/tier2_shield_b.jpg', '/branding/tier-2/tier2_shield_a.jpg'],
    outline_black: ['/branding/tier-2/tier2_shield_a.jpg']
  },
  3: {
    default: ['/branding/tier-3/tier3_mark.jpg'],
    white: ['/branding/tier-3/tier3_mark_white.jpg', '/branding/tier-3/tier3_mark.jpg'],
    black: ['/branding/tier-3/tier3_mark_black.jpg', '/branding/tier-3/tier3_mark.jpg']
  }
};

/**
 * Load a logo image from public as base64 data URL for jsPDF.addImage
 * @param {number} tier - 1, 2, or 3
 * @param {object} opts - { fallbackPath?: string }
 * @returns {Promise<string|null>} base64 data URL or null on failure
 */
export async function loadTierLogo(tier = 2, opts = {}) {
  const path = TIER_PATHS[tier] || TIER_PATHS[2];
  const variantKey = (opts.theme || 'default').toLowerCase().replace(/\s+/g, '_');
  const tierVariants = VARIANT_PATHS[tier];
  const variantList = Array.isArray(tierVariants)
    ? tierVariants
    : (tierVariants?.[variantKey] || tierVariants?.default || [path]);
  const candidatePaths = [...variantList];
  if (opts.fallbackPath) candidatePaths.push(opts.fallbackPath);
  // Final fallback to existing app icon
  candidatePaths.push('/android-chrome-192x192.png');

  for (const p of candidatePaths) {
    try {
      const data = await loadImageAsBase64(p);
      if (data) return data;
    } catch (_) { /* try next */ }
  }
  return null;
}

/**
 * Generic image->base64 loader using canvas
 */
function loadImageAsBase64(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = path;
  });
}
