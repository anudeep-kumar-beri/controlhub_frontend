// pdfBranding.js — Shared branding primitives for jsPDF exports
import { loadTierLogo } from './logoLoader';

export const THEMES = {
  authorityGoldBlack: {
    bg: [12, 15, 20],
    fg: [255, 255, 255],
    gold: [207, 175, 89],
    cream: [243, 237, 227],
    divider: [80, 80, 80]
  },
  authorityCreamBlack: {
    bg: [243, 237, 227],
    fg: [12, 15, 20],
    gold: [207, 175, 89],
    cream: [243, 237, 227],
    divider: [180, 180, 180]
  },
  uiDark: {
    bg: [14, 14, 14],
    fg: [255, 255, 255],
    accent: [102, 126, 234],
    divider: [60, 60, 60]
  },
  uiLight: {
    bg: [255, 255, 255],
    fg: [38, 38, 38],
    accent: [52, 73, 94],
    divider: [200, 200, 200]
  }
};

export function getThemeColors(themeName) {
  return THEMES[themeName] || THEMES.uiLight;
}

export function applyHeader(doc, { brandTier = 2, title = '', subtitle = '', theme = 'uiLight' }) {
  const t = THEMES[theme] || THEMES.uiLight;
  const margin = 14;
  const y = 18;
  return loadTierLogo(brandTier).then(logo => {
    if (logo) doc.addImage(logo, 'PNG', margin, y - 6, 18, 18);
    doc.setFontSize(18); doc.setFont(undefined, 'bold'); doc.setTextColor(...(t.fg));
    doc.text(title, margin + 22, y);
    if (subtitle) { doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(120,120,120); doc.text(subtitle, margin + 22, y + 6); }
    // Functional single-line divider by default
    doc.setDrawColor(...(t.divider)); doc.setLineWidth(0.4); doc.line(margin, y + 10, doc.internal.pageSize.getWidth() - margin, y + 10);
    return y + 16; // next content Y
  });
}

export function applyFooter(doc, { brandTier = 3, text = 'ControlHub — Confidential', theme = 'default' }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  return loadTierLogo(brandTier, { theme }).then(logo => {
    if (logo) doc.addImage(logo, 'PNG', margin, pageHeight - 12, 8, 8);
    doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(150,150,150);
    const pageCount = doc.internal.getNumberOfPages();
    const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
    doc.text(text, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text(`Page ${pageNum} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  });
}

export function applyWatermark(doc, { brandTier = 1, opacity = 0.06, scale = 0.6 }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2; const centerY = pageHeight / 2;
  return loadTierLogo(brandTier).then(logo => {
    if (!logo) return; 
    const size = Math.min(pageWidth, pageHeight) * scale;
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity }));
    doc.addImage(logo, 'PNG', centerX - size/2, centerY - size/2, size, size);
    doc.restoreGraphicsState();
  });
}

// Divider helpers
export function drawDivider(doc, { theme = 'uiLight', type = 'single' }) {
  const t = THEMES[theme] || THEMES.uiLight;
  const margin = 14; const y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 6 : undefined;
  const yLine = y || (doc.internal.pageSize.getHeight() * 0.25);
  doc.setDrawColor(...(t.divider));
  if (type === 'double') {
    doc.setLineWidth(0.4); doc.line(margin, yLine, doc.internal.pageSize.getWidth() - margin, yLine);
    doc.setLineWidth(0.2); doc.line(margin, yLine + 2.5, doc.internal.pageSize.getWidth() - margin, yLine + 2.5);
  } else {
    doc.setLineWidth(0.4); doc.line(margin, yLine, doc.internal.pageSize.getWidth() - margin, yLine);
  }
}

// Baseline spacing helper: returns next y based on rows of baseline units
export function nextY(currentY, rows = 1, baseline = 6) {
  return currentY + rows * baseline;
}
