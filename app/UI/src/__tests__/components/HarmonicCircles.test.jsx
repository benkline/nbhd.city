/**
 * HarmonicCircles.test.jsx
 * Tests for HarmonicCircles component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HarmonicCircles, generateCircleGrid, generateRandomCircles } from '../../components/design/HarmonicCircles';

describe('HarmonicCircles Component', () => {
  const mockCircles = [
    {
      id: 'circle-1',
      radius: 40,
      cx: 100,
      cy: 100,
      color: '#4361EE',
      opacity: 0.8,
    },
    {
      id: 'circle-2',
      radius: 50,
      cx: 200,
      cy: 150,
      color: '#FF6B6B',
      opacity: 0.7,
    },
  ];

  it('should render SVG element', () => {
    const { container } = render(<HarmonicCircles circles={mockCircles} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should render correct number of circles', () => {
    const { container } = render(<HarmonicCircles circles={mockCircles} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(mockCircles.length);
  });

  it('should use default width and height', () => {
    const { container } = render(<HarmonicCircles circles={mockCircles} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('800');
    expect(svg?.getAttribute('height')).toBe('600');
  });

  it('should accept custom width and height', () => {
    const { container } = render(
      <HarmonicCircles circles={mockCircles} width={1000} height={800} />
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('1000');
    expect(svg?.getAttribute('height')).toBe('800');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <HarmonicCircles circles={mockCircles} className="custom-class" />
    );
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('custom-class')).toBe(true);
  });

  it('should render gradients for circles', () => {
    const { container } = render(<HarmonicCircles circles={mockCircles} />);
    const gradients = container.querySelectorAll('radialGradient');
    expect(gradients.length).toBe(mockCircles.length);
  });

  it('should apply circle properties correctly', () => {
    const { container } = render(<HarmonicCircles circles={mockCircles} />);
    const circles = container.querySelectorAll('circle');
    const firstCircle = circles[0];

    expect(firstCircle?.getAttribute('r')).toBe('40');
    expect(firstCircle?.getAttribute('cx')).toBe('100');
    expect(firstCircle?.getAttribute('cy')).toBe('100');
  });

  it('should render with custom viewBox', () => {
    const { container } = render(
      <HarmonicCircles circles={mockCircles} viewBox="0 0 1000 1000" />
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 1000 1000');
  });

  it('should disable animations when animationEnabled is false', () => {
    const { container } = render(
      <HarmonicCircles circles={mockCircles} animationEnabled={false} />
    );
    const groups = container.querySelectorAll('g');
    groups.forEach((group) => {
      const style = group.getAttribute('style');
      expect(style?.includes('animation: none')).toBe(true);
    });
  });

  it('should apply backgroundColor', () => {
    const { container } = render(
      <HarmonicCircles circles={mockCircles} backgroundColor="#ffffff" />
    );
    const svg = container.querySelector('svg');
    const style = svg?.getAttribute('style');
    expect(style?.includes('background-color')).toBe(true);
  });

  it('should have accessibility label', () => {
    const { container } = render(<HarmonicCircles circles={mockCircles} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Harmonic circles animation');
    expect(svg?.getAttribute('role')).toBe('img');
  });
});

describe('Circle Generation Helpers', () => {
  it('should generate circle grid with correct count', () => {
    const circles = generateCircleGrid(2, 3);
    expect(circles.length).toBe(6);
  });

  it('should generate circles with valid properties', () => {
    const circles = generateCircleGrid(2, 2);
    circles.forEach((circle) => {
      expect(circle.radius).toBeGreaterThan(0);
      expect(circle.cx).toBeGreaterThanOrEqual(0);
      expect(circle.cy).toBeGreaterThanOrEqual(0);
      expect(circle.color).toBeTruthy();
      expect(circle.opacity).toBeGreaterThanOrEqual(0);
      expect(circle.opacity).toBeLessThanOrEqual(1);
    });
  });

  it('should respect custom viewport in grid', () => {
    const viewport = [400, 300];
    const circles = generateCircleGrid(2, 2, [20, 40], viewport);

    circles.forEach((circle) => {
      expect(circle.cx).toBeLessThanOrEqual(viewport[0]);
      expect(circle.cy).toBeLessThanOrEqual(viewport[1]);
    });
  });

  it('should generate random circles with correct count', () => {
    const circles = generateRandomCircles(5);
    expect(circles.length).toBe(5);
  });

  it('should generate random circles within viewport', () => {
    const viewport = [800, 600];
    const circles = generateRandomCircles(10, viewport);

    circles.forEach((circle) => {
      expect(circle.cx).toBeGreaterThanOrEqual(0);
      expect(circle.cx).toBeLessThanOrEqual(viewport[0]);
      expect(circle.cy).toBeGreaterThanOrEqual(0);
      expect(circle.cy).toBeLessThanOrEqual(viewport[1]);
    });
  });

  it('should respect radius range in random circles', () => {
    const radiusRange = [30, 50];
    const circles = generateRandomCircles(5, [800, 600], radiusRange);

    circles.forEach((circle) => {
      expect(circle.radius).toBeGreaterThanOrEqual(radiusRange[0]);
      expect(circle.radius).toBeLessThanOrEqual(radiusRange[1]);
    });
  });
});
