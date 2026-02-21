/**
 * CircleAnimationLibrary.test.ts
 * Tests for CircleAnimationLibrary
 */

import { describe, it, expect } from 'vitest';
import {
  slideInFrom,
  fadeInCascade,
  breathe,
  rotate,
  wave,
  bounce,
  glow,
  fadeInOut,
  combineAnimationKeyframes,
  getTimingFunction,
} from '../../lib/CircleAnimationLibrary';

describe('CircleAnimationLibrary', () => {
  describe('slideInFrom', () => {
    it('should create animation config for top', () => {
      const config = slideInFrom('top', 500);
      expect(config.name).toBe('slideInTop');
      expect(config.duration).toBe(500);
      expect(config.keyframes).toContain('@keyframes');
      expect(config.timingFunction).toBeTruthy();
      expect(config.fill).toBe('forwards');
    });

    it('should create animations for all directions', () => {
      const directions = ['top', 'bottom', 'left', 'right'] as const;
      directions.forEach((dir) => {
        const config = slideInFrom(dir);
        expect(config.keyframes).toContain('translate');
      });
    });

    it('should have default duration of 500ms', () => {
      const config = slideInFrom('left');
      expect(config.duration).toBe(500);
    });

    it('should respect custom duration', () => {
      const config = slideInFrom('right', 800);
      expect(config.duration).toBe(800);
    });
  });

  describe('fadeInCascade', () => {
    it('should create cascade animation config', () => {
      const config = fadeInCascade(50);
      expect(config.name).toBe('fadeInCascade');
      expect(config.keyframes).toContain('@keyframes');
      expect(config.keyframes).toContain('opacity');
    });

    it('should respect custom duration', () => {
      const config = fadeInCascade(50, 1000);
      expect(config.duration).toBe(1000);
    });

    it('should have default duration of 800ms', () => {
      const config = fadeInCascade(30);
      expect(config.duration).toBe(800);
    });
  });

  describe('breathe', () => {
    it('should create breathe animation with default values', () => {
      const config = breathe();
      expect(config.name).toBe('breathe');
      expect(config.keyframes).toContain('scale');
      expect(config.iterationCount).toBe('infinite');
    });

    it('should respect custom intensity', () => {
      const config1 = breathe(1.3);
      const config2 = breathe(1.1);
      expect(config1.keyframes).toContain('1.3');
      expect(config2.keyframes).toContain('1.1');
    });

    it('should respect custom cycle duration', () => {
      const config = breathe(1.2, 3000);
      expect(config.duration).toBe(3000);
    });

    it('should have default cycle of 2000ms', () => {
      const config = breathe();
      expect(config.duration).toBe(2000);
    });
  });

  describe('rotate', () => {
    it('should create clockwise rotation by default', () => {
      const config = rotate();
      expect(config.name).toBe('rotateClockwise');
      expect(config.keyframes).toContain('360deg');
    });

    it('should create counterclockwise rotation when specified', () => {
      const config = rotate(1, 'counterclockwise');
      expect(config.name).toBe('rotateCounterclockwise');
      expect(config.keyframes).toContain('-360deg');
    });

    it('should convert RPM to milliseconds', () => {
      const config = rotate(2); // 2 RPM
      expect(config.duration).toBe(30000); // 60s / 2 RPM
    });

    it('should use linear timing function', () => {
      const config = rotate();
      expect(config.timingFunction).toBe('linear');
    });

    it('should iterate infinitely', () => {
      const config = rotate();
      expect(config.iterationCount).toBe('infinite');
    });
  });

  describe('wave', () => {
    it('should create wave animation', () => {
      const config = wave();
      expect(config.name).toBe('wave');
      expect(config.keyframes).toContain('translateY');
      expect(config.iterationCount).toBe('infinite');
    });

    it('should respect custom amplitude', () => {
      const config1 = wave(10);
      const config2 = wave(30);
      expect(config1.keyframes).toContain('10px');
      expect(config2.keyframes).toContain('30px');
    });

    it('should have default amplitude of 20px', () => {
      const config = wave();
      expect(config.keyframes).toContain('20px');
    });

    it('should adjust duration based on frequency', () => {
      const config1 = wave(20, 1);
      const config2 = wave(20, 2);
      expect(config2.duration).toBeLessThan(config1.duration);
    });
  });

  describe('bounce', () => {
    it('should create bounce animation', () => {
      const config = bounce();
      expect(config.name).toBe('bounce');
      expect(config.keyframes).toContain('translateY');
      expect(config.iterationCount).toBe('infinite');
    });

    it('should respect custom height', () => {
      const config1 = bounce(10);
      const config2 = bounce(40);
      expect(config1.keyframes).toContain('10px');
      expect(config2.keyframes).toContain('40px');
    });

    it('should have default height of 20px', () => {
      const config = bounce();
      expect(config.keyframes).toContain('20px');
    });

    it('should respect custom duration', () => {
      const config = bounce(20, 800);
      expect(config.duration).toBe(800);
    });
  });

  describe('glow', () => {
    it('should create glow animation', () => {
      const config = glow();
      expect(config.name).toBe('glow');
      expect(config.keyframes).toContain('drop-shadow');
      expect(config.iterationCount).toBe('infinite');
    });

    it('should use custom glow color', () => {
      const config = glow('#FF0000');
      expect(config.keyframes).toContain('#FF0000');
    });

    it('should have default color', () => {
      const config = glow();
      expect(config.keyframes).toContain('#4361EE');
    });

    it('should respect custom duration', () => {
      const config = glow('#0000FF', 3000);
      expect(config.duration).toBe(3000);
    });
  });

  describe('fadeInOut', () => {
    it('should create fade in/out animation', () => {
      const config = fadeInOut();
      expect(config.name).toBe('fadeInOut');
      expect(config.keyframes).toContain('0%');
      expect(config.keyframes).toContain('100%');
    });

    it('should respect fade-in duration', () => {
      const config = fadeInOut(200, 300, 100);
      expect(config.duration).toBe(200 + 300 + 100);
    });

    it('should have default durations', () => {
      const config = fadeInOut();
      expect(config.duration).toBe(300 + 300 + 0);
    });

    it('should respect hold duration', () => {
      const config1 = fadeInOut(300, 300, 0);
      const config2 = fadeInOut(300, 300, 500);
      expect(config2.duration).toBeGreaterThan(config1.duration);
    });
  });

  describe('combineAnimationKeyframes', () => {
    it('should combine multiple animations', () => {
      const anim1 = fadeInOut();
      const anim2 = breathe();
      const combined = combineAnimationKeyframes(anim1, anim2);

      expect(combined).toContain(anim1.keyframes);
      expect(combined).toContain(anim2.keyframes);
    });

    it('should join with newlines', () => {
      const anim1 = fadeInOut();
      const anim2 = breathe();
      const combined = combineAnimationKeyframes(anim1, anim2);

      expect(combined.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('getTimingFunction', () => {
    it('should return timing functions', () => {
      expect(getTimingFunction('ease')).toBeTruthy();
      expect(getTimingFunction('ease-in')).toBeTruthy();
      expect(getTimingFunction('ease-out')).toBeTruthy();
      expect(getTimingFunction('ease-in-out')).toBeTruthy();
      expect(getTimingFunction('linear')).toBe('linear');
    });

    it('should return cubic-bezier for timing functions', () => {
      const result = getTimingFunction('ease');
      expect(result).toContain('cubic-bezier');
    });

    it('should return elastic curve for custom', () => {
      const result = getTimingFunction('custom');
      expect(result).toContain('cubic-bezier');
    });
  });

  describe('Animation config properties', () => {
    it('should have required properties', () => {
      const config = fadeInOut();
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('keyframes');
      expect(config).toHaveProperty('duration');
      expect(config).toHaveProperty('timingFunction');
      expect(config).toHaveProperty('fill');
    });

    it('animations should have valid duration', () => {
      const animations = [
        slideInFrom('top'),
        fadeInCascade(50),
        breathe(),
        rotate(),
        wave(),
        bounce(),
        glow(),
      ];

      animations.forEach((config) => {
        expect(config.duration).toBeGreaterThan(0);
      });
    });

    it('animations should contain @keyframes', () => {
      const animations = [
        slideInFrom('top'),
        fadeInCascade(50),
        breathe(),
        rotate(),
        wave(),
        bounce(),
        glow(),
      ];

      animations.forEach((config) => {
        expect(config.keyframes).toContain('@keyframes');
      });
    });
  });
});
