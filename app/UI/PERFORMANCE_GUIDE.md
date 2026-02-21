# Animation Performance & Optimization Guide

## Overview

This guide explains how to use the animation performance optimization tools in the nbhd.city project. The tools help ensure smooth 60fps animations across all devices, from high-end desktops to low-end mobile devices.

## Performance Budgets

All animations must adhere to these performance budgets:

| Animation Type | Max Duration | Max Frame Time |
|---|---|---|
| Circle animations | 20ms per frame | 16.67ms (60fps) |
| Modal open/close | 300ms total | 16.67ms per frame |
| Card cascade | 500ms total | 16.67ms per frame |
| Hover effects | 300ms total | 16.67ms per frame |

## Device Profiles

The system automatically detects device capabilities and adjusts animations accordingly:

### Low-End Devices
- Device memory < 4GB
- < 4 processor cores
- Small screen (< 360px width)
- Actions: Reduce animation count to 3, disable complex effects

### Connection Speed
- **Slow (2G/3G)**: Reduce max animations to 5
- **Normal (4G)**: Allow up to 10 animations
- **Fast (5G+)**: Allow up to 10+ animations

### User Preferences
- Respects `prefers-reduced-motion` media query
- Disables all animations if user has this preference set

## Using the Performance Monitor

### Basic Monitoring

```javascript
import { PerformanceMonitor } from '../lib/performanceOptimization';

const monitor = new PerformanceMonitor();
monitor.start();

// Your animations run...

setTimeout(() => {
  const summary = monitor.getSummary();
  console.log(`Average FPS: ${summary.avgFps}`);
  console.log(`CPU Usage: ${summary.avgCpu}%`);
  monitor.stop();
}, 5000);
```

### Tracking Animation Count

```javascript
monitor.incrementAnimationCount();
// Animation runs...
monitor.decrementAnimationCount();
```

## React Hooks for Performance

### Using the Device Profile Hook

```javascript
import { getDeviceProfile } from '../lib/performanceOptimization';

function MyComponent() {
  const deviceProfile = getDeviceProfile();

  if (deviceProfile.isLowEnd) {
    // Use simplified animations or static layout
    return <SimplifiedComponent />;
  }

  return <FullAnimatedComponent />;
}
```

### Checking if Animations Should Be Enabled

```javascript
import { shouldEnableAnimations } from '../lib/performanceOptimization';

function AnimatedCard() {
  const animationsEnabled = shouldEnableAnimations();

  return (
    <div className={animationsEnabled ? 'card-animated' : 'card-static'}>
      {/* Component content */}
    </div>
  );
}
```

## CSS Performance Best Practices

### 1. Use CSS Transforms, Not Layout Properties

**Bad** - causes layout recalculation:
```css
.card:hover {
  left: 10px;
  top: 10px;
}
```

**Good** - uses GPU acceleration:
```css
.card:hover {
  transform: translate(10px, 10px);
}
```

### 2. Use will-change Sparingly

```javascript
import { setWillChange } from '../lib/performanceOptimization';

// During animation
setWillChange(element, ['transform', 'opacity']);

// After animation
setWillChange(element, []);
```

### 3. Animate Only GPU-Friendly Properties

Use these properties for best performance:
- `transform`
- `opacity`
- `filter`

Avoid these (they cause layout recalculation):
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `font-size`, `line-height`

### 4. Use Aspect Ratio for Image Containers

Prevents layout shift when images load:
```css
.image-container {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
```

## Responsive Animation Optimization

### Mobile (< 512px)
- Reduce animation duration by 20%
- Disable complex shadow effects
- Limit concurrent animations to 3
- Use active states instead of hover

### Tablet (512px - 768px)
- Normal animation duration
- Simplified shadow effects
- Limit concurrent animations to 5
- Support both hover and touch

### Desktop (> 768px)
- Full animation features
- Complex effects allowed
- Limit concurrent animations to 10
- Full hover support

## Implementation Examples

### Example 1: Optimized Card Animation

```javascript
import { performanceAwareRaf, setWillChange } from '../lib/performanceOptimization';

function AnimatedCard() {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const element = cardRef.current;
    setWillChange(element, ['transform', 'box-shadow']);

    const animation = performanceAwareRaf(() => {
      // Update animation frame
    });

    return () => {
      animation.cancel();
      setWillChange(element, []);
    };
  }, []);

  return <div ref={cardRef} className="card" />;
}
```

### Example 2: Viewport-Based Animation

```javascript
import { createIntersectionObserver } from '../lib/performanceOptimization';

function CardGallery() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = Array.from(containerRef.current.querySelectorAll('.card'));

    const observer = createIntersectionObserver(cards, (element, isVisible) => {
      if (isVisible) {
        element.classList.add('animate-in');
      } else {
        element.classList.remove('animate-in');
      }
    });

    return () => observer.disconnect();
  }, []);

  return <div ref={containerRef} className="gallery" />;
}
```

### Example 3: Conditional Animation Based on Device

```javascript
import { getDeviceProfile, shouldEnableAnimations } from '../lib/performanceOptimization';

function ResponsiveComponent() {
  const deviceProfile = getDeviceProfile();
  const animationsEnabled = shouldEnableAnimations();

  return (
    <div className={`
      component
      ${animationsEnabled ? 'with-animations' : 'static'}
      ${deviceProfile.isLowEnd ? 'low-end' : 'normal'}
    `}>
      {/* Content */}
    </div>
  );
}
```

## Profiling and Debugging

### Chrome DevTools Performance Tab

1. Open Chrome DevTools → Performance tab
2. Click Record
3. Interact with animations
4. Click Stop
5. Analyze the timeline:
   - Look for frame time (should be < 16.67ms)
   - Check for layout thrashing (red marks)
   - Monitor CPU usage

### Measure Real Performance

```javascript
const start = performance.now();
// Animation code
const end = performance.now();
console.log(`Animation took ${end - start}ms`);
```

### Check for Memory Leaks

```javascript
import { PerformanceMonitor } from '../lib/performanceOptimization';

const monitor = new PerformanceMonitor();
monitor.start();

// Run animation multiple times
for (let i = 0; i < 100; i++) {
  // Trigger animation
}

const metrics = monitor.getMetrics();
const memoryUsages = metrics.map(m => m.memoryUsage);
const isLeaking = memoryUsages[memoryUsages.length - 1] > memoryUsages[0];
```

## Testing Checklist

- [ ] 60fps on modern devices (iPhone 12+, Pixel 4+)
- [ ] 30fps minimum on older devices (doesn't break)
- [ ] No layout shifts during animations
- [ ] No memory leaks over time
- [ ] Respects `prefers-reduced-motion` setting
- [ ] Touch interactions are responsive
- [ ] Hover effects work on pointer devices only
- [ ] Button click feedback is immediate
- [ ] Modal animations are smooth
- [ ] Card cascade animations are staggered properly

## Common Performance Issues & Solutions

### Issue: Animations are janky (stuttering)

**Cause**: JavaScript blocking the main thread

**Solution**:
- Move heavy computations to Web Workers
- Use CSS animations instead of JS
- Reduce animation complexity
- Profile with DevTools to find bottlenecks

### Issue: High CPU usage during animation

**Cause**: Animating layout properties or too many elements

**Solution**:
- Use `transform` and `opacity` instead of positional properties
- Reduce number of concurrent animations
- Enable GPU acceleration with `transform3d`
- Consider reducing animation duration

### Issue: Memory grows over time

**Cause**: Event listeners not being cleaned up

**Solution**:
- Always remove event listeners in cleanup functions
- Cancel animations when components unmount
- Use AbortController for fetch requests
- Profile memory with DevTools

### Issue: Low FPS on mobile

**Cause**: Device is low-end or animations are too complex

**Solution**:
- Detect device capabilities with `getDeviceProfile()`
- Use simpler animations on low-end devices
- Reduce animation count and complexity
- Use will-change carefully (only when animating)

## Performance Metrics to Monitor

1. **FPS (Frames Per Second)**: Target 60fps, minimum 30fps
2. **Frame Time**: Should be < 16.67ms for 60fps
3. **CPU Usage**: Keep below 70% during animations
4. **Memory**: Should not increase over time
5. **Animation Count**: Limit to device capability
6. **Jank**: Monitor for red bars in DevTools

## Resources

- [MDN: Using the Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [CSS Triggers - What Forces Layout](https://csstriggers.com/)
- [RAIL Performance Model](https://web.dev/rail/)
