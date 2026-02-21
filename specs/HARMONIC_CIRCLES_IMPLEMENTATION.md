# Harmonic Circles - Implementation Reference Guide

Quick reference for implementing the harmonic circle animation system across UI-DESIGN-001 and related components.

---

## Quick Start: HarmonicCircles Component

### Basic Usage

```jsx
import { HarmonicCircles } from '@/components/design/HarmonicCircles';

export function MyComponent() {
  return (
    <HarmonicCircles
      circles={[
        { radius: 120, x: 0, y: 0, color: '#7c3aed', animation: 'breathe', duration: 2 },
        { radius: 80, x: -60, y: 60, color: '#2563eb', animation: 'oscillate-x', duration: 3 },
        { radius: 100, x: 60, y: -40, color: '#10b981', animation: 'rotate-orbit', duration: 5 },
      ]}
      opacity={0.3}
      animationEnabled={true}
    />
  );
}
```

### Props

```typescript
interface HarmonicCirclesProps {
  circles: CircleConfig[];           // Array of circles to render
  opacity?: number;                  // 0.0 - 1.0 (default: 0.3)
  animationEnabled?: boolean;        // (default: true)
  containerClassName?: string;       // Custom container class
  viewBox?: string;                  // SVG viewBox (default: "0 0 400 400")
  width?: string | number;           // (default: '100%')
  height?: string | number;          // (default: '100%')
}

interface CircleConfig {
  radius: number;                    // Circle radius in pixels
  x: number;                         // X position (center = 0)
  y: number;                         // Y position (center = 0)
  color: string;                     // Hex color or CSS color
  animation: AnimationType;          // 'breathe' | 'oscillate-x' | 'oscillate-y' | 'rotate-orbit' | 'wave'
  duration: number;                  // Animation duration in seconds (2, 3, 5, 7, 11 recommended)
  delay?: number;                    // Animation delay in seconds (default: 0)
  opacity?: number;                  // Circle opacity (0.0-1.0, overrides container opacity)
}
```

---

## Animation Types & Timings

### Breathing Animation (2s cycle)

```css
@keyframes breathe {
  0%, 100% {
    r: 120px;
    opacity: 0.4;
  }
  50% {
    r: 140px;
    opacity: 0.8;
  }
}
```

**Use for:** Background patterns, subtle feedback, status badges

**Duration:** 2s (1 wave = 2 seconds)

---

### Oscillation Animations (3s & 5s cycles)

#### Horizontal (X-axis)
```css
@keyframes oscillate-x {
  0%, 100% {
    cx: -10%;
  }
  50% {
    cx: 10%;
  }
}
```

#### Vertical (Y-axis)
```css
@keyframes oscillate-y {
  0%, 100% {
    cy: -10%;
  }
  50% {
    cy: 10%;
  }
}
```

**Use for:** Motion feedback, transition indicators

**Duration:** 3s, 5s (longer cycles for subtle effect)

---

### Orbital Rotation (5s cycle)

```css
@keyframes rotate-orbit {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

**Use for:** Loading spinners, active states

**Duration:** 3s (fast), 5s-7s (slow)

---

### Wave Motion (7s cycle)

```css
@keyframes wave {
  0%, 100% {
    cy: 0%;
    opacity: 0.4;
  }
  25% {
    cy: -5%;
    opacity: 0.6;
  }
  50% {
    cy: -10%;
    opacity: 0.8;
  }
  75% {
    cy: -5%;
    opacity: 0.6;
  }
}
```

**Use for:** Flowing content, temporal progression

**Duration:** 5s-7s (smooth wave effect)

---

## Recommended Circle Configurations

### Pattern 1: Header Background (3 circles)

```jsx
const headerPattern = [
  { radius: 150, x: -80, y: -100, color: '#7c3aed', animation: 'breathe', duration: 2 },
  { radius: 120, x: 100, y: 120, color: '#06b6d4', animation: 'oscillate-x', duration: 3 },
  { radius: 100, x: 20, y: -50, color: '#10b981', animation: 'wave', duration: 5 },
];
```

### Pattern 2: Card Hover (2 circles, high opacity)

```jsx
const cardHoverPattern = [
  { radius: 200, x: -100, y: 0, color: '#f97316', animation: 'breathe', duration: 2, opacity: 0.8 },
  { radius: 150, x: 80, y: 100, color: '#ef4444', animation: 'rotate-orbit', duration: 3, opacity: 0.6 },
];
```

### Pattern 3: Modal Background (4 circles, subtle)

```jsx
const modalPattern = [
  { radius: 180, x: -120, y: -80, color: '#7c3aed', animation: 'breathe', duration: 2 },
  { radius: 140, x: 100, y: -100, color: '#4f46e5', animation: 'oscillate-x', duration: 3 },
  { radius: 160, x: -60, y: 120, color: '#2563eb', animation: 'wave', duration: 5 },
  { radius: 120, x: 120, y: 100, color: '#06b6d4', animation: 'oscillate-y', duration: 7 },
];
```

### Pattern 4: Full Page Background (5-7 circles)

```jsx
const pageBackgroundPattern = [
  { radius: 200, x: -150, y: -150, color: '#7c3aed', animation: 'breathe', duration: 2 },
  { radius: 180, x: 150, y: -100, color: '#4f46e5', animation: 'oscillate-x', duration: 3 },
  { radius: 160, x: -80, y: 150, color: '#2563eb', animation: 'wave', duration: 5 },
  { radius: 140, x: 140, y: 120, color: '#06b6d4', animation: 'rotate-orbit', duration: 7 },
  { radius: 120, x: -120, y: -60, color: '#10b981', animation: 'oscillate-y', duration: 11 },
];
```

---

## CSS Keyframes Reference

Add these to `src/styles/HarmonyAnimations.css`:

```css
/* Breathing (2s) */
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Oscillate X (3s) */
@keyframes oscillate-x {
  0%, 100% {
    transform: translateX(-10px);
  }
  50% {
    transform: translateX(10px);
  }
}

/* Oscillate Y (5s) */
@keyframes oscillate-y {
  0%, 100% {
    transform: translateY(-10px);
  }
  50% {
    transform: translateY(10px);
  }
}

/* Rotate Orbit (for parent container) */
@keyframes rotate-orbit {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Wave (7s) */
@keyframes wave {
  0%, 100% {
    transform: translateY(0px);
    opacity: 0.4;
  }
  25% {
    transform: translateY(-5px);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-10px);
    opacity: 0.8;
  }
  75% {
    transform: translateY(-5px);
    opacity: 0.6;
  }
}

/* Cascade fade-in */
@keyframes cascade-fade {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Spinner (combined rotate + pulse) */
@keyframes spinner-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spinner-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Glow effect for inputs */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(124, 58, 237, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(124, 58, 237, 0.6);
  }
}
```

---

## Color Harmony Palette

```typescript
// src/lib/HarmonyColors.ts

export const harmonyColors = {
  violet: '#7c3aed',      // Primary - warm
  indigo: '#4f46e5',      // Primary
  blue: '#2563eb',        // Primary - cool
  cyan: '#06b6d4',        // Secondary - cool
  green: '#10b981',       // Secondary
  yellow: '#eab308',      // Accent - warm
  orange: '#f97316',      // Accent - hot
  red: '#ef4444',         // Status - error
};

export const harmonyAccents = {
  success: '#10b981',     // Green
  warning: '#eab308',     // Yellow
  error: '#ef4444',       // Red
  info: '#2563eb',        // Blue
  loading: '#06b6d4',     // Cyan
};
```

---

## Hook: useHarmonyAnimation

For managing animation lifecycle in components:

```typescript
// src/hooks/useHarmonyAnimation.ts

import { useReducedMotion } from './useReducedMotion';

export function useHarmonyAnimation({
  enabled = true,
  staggerMs = 50,
}: {
  enabled?: boolean;
  staggerMs?: number;
} = {}) {
  const prefersReducedMotion = useReducedMotion();

  return {
    isAnimating: enabled && !prefersReducedMotion,
    staggerDelay: (index: number) => index * staggerMs,
    animationDuration: prefersReducedMotion ? '0.01ms' : undefined,
  };
}

// Custom hook for detecting prefers-reduced-motion
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
```

---

## Component Template: Using Harmonic Circles

```jsx
// src/components/MyComponent.jsx

import { HarmonicCircles } from '@/components/design/HarmonicCircles';
import { useHarmonyAnimation } from '@/hooks/useHarmonyAnimation';
import { harmonyColors } from '@/lib/HarmonyColors';
import styles from './MyComponent.module.css';

export function MyComponent() {
  const animation = useHarmonyAnimation({ staggerMs: 50 });

  const circlePattern = [
    {
      radius: 150,
      x: -80,
      y: -100,
      color: harmonyColors.violet,
      animation: 'breathe',
      duration: 2,
    },
    {
      radius: 120,
      x: 100,
      y: 120,
      color: harmonyColors.cyan,
      animation: 'oscillate-x',
      duration: 3,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <HarmonicCircles
          circles={circlePattern}
          opacity={0.2}
          animationEnabled={animation.isAnimating}
        />
      </div>

      <div className={styles.content}>
        {/* Your content here */}
      </div>
    </div>
  );
}
```

---

## CSS Module Template

```css
/* src/components/MyComponent.module.css */

.container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 10;
  padding: 2rem;
}

/* Cascade animation for children */
.cardItem {
  animation: cascade-fade 0.3s ease-out forwards;
  opacity: 0;
}

.cardItem:nth-child(1) { animation-delay: 0ms; }
.cardItem:nth-child(2) { animation-delay: 50ms; }
.cardItem:nth-child(3) { animation-delay: 100ms; }
.cardItem:nth-child(4) { animation-delay: 150ms; }
.cardItem:nth-child(5) { animation-delay: 200ms; }
.cardItem:nth-child(6) { animation-delay: 250ms; }
```

---

## Performance Tips

### Do's ✓
- Use CSS transforms (translate, scale, rotate)
- Use requestAnimationFrame for custom animations
- Lazy-load circles (don't render off-screen)
- Memoize circle configuration arrays
- Use `will-change` sparingly

### Don'ts ✗
- Don't animate `width`, `height`, `left`, `top` (causes reflow)
- Don't animate `opacity` heavily in old browsers
- Don't render thousands of circles
- Don't use setTimeout for animations (use CSS or rAF)
- Don't animate on scroll without debouncing

### Example: Optimized Component

```jsx
const CirclePatternMemo = React.memo(HarmonicCircles);

export function OptimizedComponent() {
  // Memoize circle config
  const circleConfig = React.useMemo(() => [
    { radius: 150, x: -80, y: -100, color: '#7c3aed', animation: 'breathe', duration: 2 },
    // ... more circles
  ], []);

  return (
    <CirclePatternMemo
      circles={circleConfig}
      opacity={0.2}
      animationEnabled={true}
    />
  );
}
```

---

## Testing Harmonic Circles

```javascript
// src/__tests__/components/HarmonicCircles.test.jsx

import { render } from '@testing-library/react';
import { HarmonicCircles } from '@/components/design/HarmonicCircles';

describe('HarmonicCircles', () => {
  it('renders SVG element', () => {
    const { container } = render(
      <HarmonicCircles circles={[]} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders correct number of circles', () => {
    const circles = [
      { radius: 100, x: 0, y: 0, color: '#7c3aed', animation: 'breathe', duration: 2 },
      { radius: 80, x: 50, y: 50, color: '#2563eb', animation: 'wave', duration: 3 },
    ];
    const { container } = render(<HarmonicCircles circles={circles} />);
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  it('respects prefers-reduced-motion', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { container } = render(
      <HarmonicCircles circles={[]} animationEnabled={true} />
    );
    // Animations should be instant or disabled
  });
});
```

---

## Debugging Animations

### Chrome DevTools

1. Open DevTools → Animations panel
2. Trigger animation
3. See timeline of all active animations
4. Can slow down (25%, 10%, 5%)
5. Can pause and scrub

### Performance Profiling

```javascript
// In DevTools console:
performance.mark('animation-start');
// ... trigger animation ...
performance.mark('animation-end');
performance.measure('animation', 'animation-start', 'animation-end');
console.log(performance.getEntriesByName('animation')[0].duration);
```

### FPS Monitoring

```javascript
// Add to component temporarily:
const fpsCounter = setInterval(() => {
  console.log('FPS:', Math.round(1000 / 16.67)); // 60fps baseline
}, 1000);

return () => clearInterval(fpsCounter);
```

---

## References

- **Chladni Plates:** https://en.wikipedia.org/wiki/Chladni%27s_law
- **Harmonic Frequencies:** https://en.wikipedia.org/wiki/Harmonic_series_(music)
- **CSS Animations:** https://developer.mozilla.org/en-US/docs/Web/CSS/animation
- **Bezier Curves:** https://cubic-bezier.com/
- **Design System:** See `TEMPLATE_GALLERY_DESIGN.md`

---
