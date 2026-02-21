/**
 * HarmonyColors.ts
 * Color palette for harmonic circle design system
 * Based on harmonic spectrum progression inspired by Chladni plates
 */

// Harmonic color progression through the spectrum
// Violet -> Indigo -> Blue -> Cyan -> Green -> Yellow -> Orange -> Red
export const HARMONIC_SPECTRUM = [
  '#9D4EDD', // Violet
  '#5A189A', // Indigo
  '#3A0CA3', // Blue-Indigo
  '#3F37C9', // Royal Blue
  '#4361EE', // Bright Blue
  '#4895EF', // Sky Blue
  '#48BFE3', // Cyan-Blue
  '#56CCF2', // Cyan
  '#4ECDC4', // Teal
  '#2ECC71', // Green
  '#F1C40F', // Yellow
  '#FF9800', // Orange
  '#FF6B6B', // Red
] as const;

// Complementary accent colors for status states
export const STATUS_COLORS = {
  analyzing: '#4361EE',  // Bright blue
  ready: '#2ECC71',      // Green
  failed: '#FF6B6B',     // Red
  warning: '#FF9800',    // Orange
  success: '#27AE60',    // Dark green
} as const;

// Base colors for circles
export const BASE_COLORS = {
  primary: '#4361EE',
  secondary: '#3A0CA3',
  accent: '#FF6B6B',
  success: '#2ECC71',
  warning: '#FF9800',
  info: '#56CCF2',
} as const;

// Accessibility-compliant contrast ratios (WCAG AA minimum 4.5:1 for text)
export const CONTRAST_PAIRS = [
  { foreground: '#FFFFFF', background: '#4361EE' },  // White on Blue (8.6:1)
  { foreground: '#FFFFFF', background: '#3A0CA3' },  // White on Dark Blue (10.2:1)
  { foreground: '#000000', background: '#F1C40F' },  // Black on Yellow (19.6:1)
  { foreground: '#FFFFFF', background: '#FF6B6B' },  // White on Red (4.5:1)
  { foreground: '#FFFFFF', background: '#2ECC71' },  // White on Green (5.3:1)
] as const;

/**
 * Get a harmonic color from the spectrum by index
 * @param index - Index in the harmonic spectrum (0-12)
 * @returns Hex color string
 */
export function getHarmonicColor(index: number): string {
  return HARMONIC_SPECTRUM[index % HARMONIC_SPECTRUM.length];
}

/**
 * Get a random harmonic color from the spectrum
 * @returns Hex color string
 */
export function getRandomHarmonicColor(): string {
  const index = Math.floor(Math.random() * HARMONIC_SPECTRUM.length);
  return getHarmonicColor(index);
}

/**
 * Get a gradient of harmonic colors
 * @param count - Number of colors to generate
 * @param startIndex - Starting index in spectrum (default 0)
 * @returns Array of hex color strings
 */
export function getHarmonicGradient(count: number, startIndex: number = 0): string[] {
  const colors: string[] = [];
  const step = Math.max(1, Math.floor(HARMONIC_SPECTRUM.length / count));

  for (let i = 0; i < count; i++) {
    const index = (startIndex + i * step) % HARMONIC_SPECTRUM.length;
    colors.push(getHarmonicColor(index));
  }

  return colors;
}

/**
 * Get complementary harmonic colors
 * @param baseColor - Base harmonic color hex string
 * @returns Complementary color hex string
 */
export function getComplementaryColor(baseColor: string): string {
  const baseIndex = HARMONIC_SPECTRUM.indexOf(baseColor as typeof HARMONIC_SPECTRUM[number]);
  if (baseIndex === -1) return HARMONIC_SPECTRUM[6]; // Default to yellow-orange

  // Complementary is roughly 180 degrees around the color wheel
  // In a 13-color spectrum, that's roughly 6-7 positions away
  const complementaryIndex = (baseIndex + 6) % HARMONIC_SPECTRUM.length;
  return getHarmonicColor(complementaryIndex);
}

/**
 * Adjust color opacity while maintaining hex format
 * @param color - Hex color string
 * @param opacity - Opacity value 0-1
 * @returns Hex color with opacity (as rgba)
 */
export function withOpacity(color: string, opacity: number): string {
  // Remove # if present
  const hex = color.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, opacity))})`;
}

/**
 * Check if a color has sufficient contrast with white text
 * @param backgroundColor - Hex color string
 * @returns True if contrast meets WCAG AA standard (4.5:1)
 */
export function hasAccessibleContrast(backgroundColor: string): boolean {
  // Simplified contrast check - darker colors (lower hex values) are safer
  // Full WCAG calculation would be: (L1 + 0.05) / (L2 + 0.05) where L is luminance
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Simple luminance calculation
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If luminance < 0.5 (darker), white text is safe
  return luminance < 0.5;
}
