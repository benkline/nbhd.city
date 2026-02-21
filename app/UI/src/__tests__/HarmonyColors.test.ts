/**
 * HarmonyColors.test.ts
 * Tests for HarmonyColors library
 */

import { describe, it, expect } from 'vitest';
import {
  HARMONIC_SPECTRUM,
  STATUS_COLORS,
  BASE_COLORS,
  getHarmonicColor,
  getRandomHarmonicColor,
  getHarmonicGradient,
  getComplementaryColor,
  withOpacity,
  hasAccessibleContrast,
} from '../../lib/HarmonyColors';

describe('HarmonyColors Library', () => {
  describe('Constants', () => {
    it('should have harmonic spectrum with 13 colors', () => {
      expect(HARMONIC_SPECTRUM.length).toBe(13);
    });

    it('should have status colors', () => {
      expect(STATUS_COLORS).toHaveProperty('analyzing');
      expect(STATUS_COLORS).toHaveProperty('ready');
      expect(STATUS_COLORS).toHaveProperty('failed');
      expect(STATUS_COLORS).toHaveProperty('warning');
      expect(STATUS_COLORS).toHaveProperty('success');
    });

    it('should have base colors', () => {
      expect(BASE_COLORS).toHaveProperty('primary');
      expect(BASE_COLORS).toHaveProperty('secondary');
      expect(BASE_COLORS).toHaveProperty('accent');
      expect(BASE_COLORS).toHaveProperty('success');
      expect(BASE_COLORS).toHaveProperty('warning');
      expect(BASE_COLORS).toHaveProperty('info');
    });

    it('should all colors be valid hex strings', () => {
      const allColors = [...HARMONIC_SPECTRUM];
      allColors.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('getHarmonicColor', () => {
    it('should return color at valid index', () => {
      expect(getHarmonicColor(0)).toBe(HARMONIC_SPECTRUM[0]);
      expect(getHarmonicColor(5)).toBe(HARMONIC_SPECTRUM[5]);
      expect(getHarmonicColor(12)).toBe(HARMONIC_SPECTRUM[12]);
    });

    it('should wrap around for indices beyond spectrum length', () => {
      expect(getHarmonicColor(13)).toBe(HARMONIC_SPECTRUM[0]);
      expect(getHarmonicColor(14)).toBe(HARMONIC_SPECTRUM[1]);
      expect(getHarmonicColor(26)).toBe(HARMONIC_SPECTRUM[0]);
    });

    it('should handle negative indices', () => {
      expect(getHarmonicColor(-1)).toBe(HARMONIC_SPECTRUM[12]);
    });
  });

  describe('getRandomHarmonicColor', () => {
    it('should return a valid hex color', () => {
      const color = getRandomHarmonicColor();
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should return color from spectrum', () => {
      const color = getRandomHarmonicColor();
      expect(HARMONIC_SPECTRUM).toContain(color);
    });

    it('should return different colors on multiple calls (with high probability)', () => {
      const colors = new Set();
      for (let i = 0; i < 20; i++) {
        colors.add(getRandomHarmonicColor());
      }
      expect(colors.size).toBeGreaterThan(1);
    });
  });

  describe('getHarmonicGradient', () => {
    it('should return correct number of colors', () => {
      expect(getHarmonicGradient(5).length).toBe(5);
      expect(getHarmonicGradient(1).length).toBe(1);
      expect(getHarmonicGradient(13).length).toBe(13);
    });

    it('should return colors from spectrum', () => {
      const gradient = getHarmonicGradient(5);
      gradient.forEach((color) => {
        expect(HARMONIC_SPECTRUM).toContain(color);
      });
    });

    it('should respect start index', () => {
      const gradient1 = getHarmonicGradient(3, 0);
      const gradient2 = getHarmonicGradient(3, 5);
      expect(gradient1[0]).not.toBe(gradient2[0]);
    });

    it('should distribute colors evenly', () => {
      const gradient = getHarmonicGradient(13);
      expect(new Set(gradient).size).toBe(13);
    });
  });

  describe('getComplementaryColor', () => {
    it('should return a valid hex color', () => {
      const color = getComplementaryColor(HARMONIC_SPECTRUM[0]);
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should return color from spectrum', () => {
      const color = getComplementaryColor(HARMONIC_SPECTRUM[3]);
      expect(HARMONIC_SPECTRUM).toContain(color);
    });

    it('should return different color from input', () => {
      const baseColor = HARMONIC_SPECTRUM[0];
      const complement = getComplementaryColor(baseColor);
      expect(complement).not.toBe(baseColor);
    });

    it('should return default for invalid color', () => {
      const color = getComplementaryColor('#INVALID');
      expect(HARMONIC_SPECTRUM).toContain(color);
    });
  });

  describe('withOpacity', () => {
    it('should return rgba format', () => {
      const result = withOpacity('#4361EE', 0.5);
      expect(result).toMatch(/^rgba\(/);
      expect(result).toContain('0.5)');
    });

    it('should handle full opacity', () => {
      const result = withOpacity('#4361EE', 1);
      expect(result).toContain('1)');
    });

    it('should handle zero opacity', () => {
      const result = withOpacity('#4361EE', 0);
      expect(result).toContain('0)');
    });

    it('should clamp opacity to 0-1 range', () => {
      const result1 = withOpacity('#4361EE', 2);
      expect(result1).toContain('1)');

      const result2 = withOpacity('#4361EE', -1);
      expect(result2).toContain('0)');
    });

    it('should preserve color values', () => {
      const result = withOpacity('#FF6B6B', 0.5);
      expect(result).toContain('255'); // Red value
      expect(result).toContain('107'); // Green and Blue values
    });
  });

  describe('hasAccessibleContrast', () => {
    it('should return true for dark colors', () => {
      expect(hasAccessibleContrast('#000000')).toBe(true);
      expect(hasAccessibleContrast('#333333')).toBe(true);
      expect(hasAccessibleContrast('#3A0CA3')).toBe(true); // Dark blue from spectrum
    });

    it('should return false for light colors', () => {
      expect(hasAccessibleContrast('#FFFFFF')).toBe(false);
      expect(hasAccessibleContrast('#CCCCCC')).toBe(false);
      expect(hasAccessibleContrast('#F1C40F')).toBe(false); // Light yellow
    });

    it('should handle colors from spectrum appropriately', () => {
      const darkColors = ['#9D4EDD', '#5A189A', '#3A0CA3'];
      darkColors.forEach((color) => {
        expect(hasAccessibleContrast(color)).toBe(true);
      });
    });
  });
});
