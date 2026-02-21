/**
 * Performance Optimization & Animation Profiling
 *
 * This module provides tools for monitoring and optimizing animation performance
 * across the application, with support for graceful degradation on low-end devices.
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  cpuUsage: number;
  memoryUsage: number;
  animationCount: number;
  timestamp: number;
}

export interface DeviceProfile {
  isLowEnd: boolean;
  prefersReducedMotion: boolean;
  connectionSpeed: 'slow' | 'normal' | 'fast';
  gpuAvailable: boolean;
  maxAnimations: number;
}

/**
 * Performance Monitor - tracks FPS and frame timing
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private frameTime = 16.67;
  private isMonitoring = false;
  private metrics: PerformanceMetrics[] = [];
  private animationCount = 0;

  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.measureFrame();
  }

  stop() {
    this.isMonitoring = false;
  }

  private measureFrame() {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.frameTime = deltaTime;
    this.fps = Math.round(1000 / deltaTime);
    this.frameCount++;

    // Record metrics every 60 frames (approximately 1 second)
    if (this.frameCount % 60 === 0) {
      const metrics: PerformanceMetrics = {
        fps: this.fps,
        frameTime: this.frameTime,
        cpuUsage: this.estimateCpuUsage(),
        memoryUsage: this.getMemoryUsage(),
        animationCount: this.animationCount,
        timestamp: now
      };
      this.metrics.push(metrics);
    }

    this.lastTime = now;
    requestAnimationFrame(() => this.measureFrame());
  }

  private estimateCpuUsage(): number {
    // Frame time / target frame time (16.67ms for 60fps)
    return Math.min(100, (this.frameTime / 16.67) * 100);
  }

  private getMemoryUsage(): number {
    if (performance.memory) {
      return (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
    }
    return 0;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getLastMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  incrementAnimationCount() {
    this.animationCount++;
  }

  decrementAnimationCount() {
    this.animationCount = Math.max(0, this.animationCount - 1);
  }

  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return null;

    const avgFps = metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length;
    const avgFrameTime = metrics.reduce((sum, m) => sum + m.frameTime, 0) / metrics.length;
    const avgCpu = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
    const minFps = Math.min(...metrics.map(m => m.fps));
    const maxFrameTime = Math.max(...metrics.map(m => m.frameTime));

    return {
      avgFps: Math.round(avgFps),
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      avgCpu: Math.round(avgCpu),
      minFps,
      maxFrameTime: Math.round(maxFrameTime * 100) / 100,
      sampleCount: metrics.length
    };
  }
}

/**
 * Device Profile - detects device capabilities
 */
export function getDeviceProfile(): DeviceProfile {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connectionSpeed = getConnectionSpeed();
  const isLowEnd = detectLowEndDevice();
  const gpuAvailable = detectGpuAvailable();

  // Determine max animations based on device capabilities
  let maxAnimations = 10;
  if (isLowEnd) {
    maxAnimations = 3;
  } else if (connectionSpeed === 'slow') {
    maxAnimations = 5;
  }

  return {
    isLowEnd,
    prefersReducedMotion,
    connectionSpeed,
    gpuAvailable,
    maxAnimations
  };
}

/**
 * Detect connection speed
 */
function getConnectionSpeed(): 'slow' | 'normal' | 'fast' {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType || '4g';
      const downlink = connection.downlink || 3;

      if (effectiveType === '4g' && downlink > 5) return 'fast';
      if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    }
  }
  return 'normal';
}

/**
 * Detect if device is low-end
 */
function detectLowEndDevice(): boolean {
  // Check for device memory if available
  if ('deviceMemory' in navigator) {
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory < 4) return true;
  }

  // Check for processor count
  if ('hardwareConcurrency' in navigator) {
    const cores = navigator.hardwareConcurrency || 1;
    if (cores < 4) return true;
  }

  // Check for screen resolution (low resolution = low-end)
  if (window.innerWidth < 360 || window.innerHeight < 640) {
    return true;
  }

  return false;
}

/**
 * Detect GPU availability
 */
function detectGpuAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null && gl !== undefined;
  } catch {
    return false;
  }
}

/**
 * Animation performance budgets
 */
export const PERFORMANCE_BUDGETS = {
  // Maximum time per frame for smooth 60fps
  MAX_FRAME_TIME_MS: 16.67,

  // Animation time budgets
  CIRCLE_ANIMATION_MAX_MS: 20,
  MODAL_OPEN_CLOSE_MAX_MS: 300,
  CARD_CASCADE_MAX_MS: 500,

  // Should-change hints for critical animations
  WILL_CHANGE_PROPERTIES: ['transform', 'opacity'],

  // Maximum number of concurrent animations
  MAX_CONCURRENT_ANIMATIONS: 10
};

/**
 * Optimized animation wrapper with performance tracking
 */
export function createOptimizedAnimation(
  element: HTMLElement,
  animationName: string,
  duration: number,
  onComplete?: () => void
): {
  start: () => void;
  cancel: () => void;
} {
  const monitor = new PerformanceMonitor();
  monitor.start();
  monitor.incrementAnimationCount();

  const animationEndHandler = () => {
    monitor.stop();
    monitor.decrementAnimationCount();
    element.removeEventListener('animationend', animationEndHandler);
    onComplete?.();
  };

  return {
    start: () => {
      element.style.animation = `${animationName} ${duration}ms ease forwards`;
      element.addEventListener('animationend', animationEndHandler);
    },
    cancel: () => {
      element.style.animation = 'none';
      element.removeEventListener('animationend', animationEndHandler);
      monitor.stop();
      monitor.decrementAnimationCount();
    }
  };
}

/**
 * Request animation frame with performance awareness
 * Gracefully handles low-end devices by skipping frames if needed
 */
export function performanceAwareRaf(callback: (deltaTime: number) => void): {
  cancel: () => void;
} {
  let frameId: number | null = null;
  let lastTime = performance.now();
  const deviceProfile = getDeviceProfile();

  // On low-end devices, reduce animation frequency
  const frameSkip = deviceProfile.isLowEnd ? 2 : 1;
  let frameCount = 0;

  const raf = () => {
    frameCount++;
    const now = performance.now();
    const deltaTime = now - lastTime;

    if (frameCount % frameSkip === 0) {
      callback(deltaTime);
    }

    lastTime = now;
    frameId = requestAnimationFrame(raf);
  };

  frameId = requestAnimationFrame(raf);

  return {
    cancel: () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    }
  };
}

/**
 * Check if animations should be enabled
 */
export function shouldEnableAnimations(): boolean {
  const deviceProfile = getDeviceProfile();

  // Respect user preference for reduced motion
  if (deviceProfile.prefersReducedMotion) {
    return false;
  }

  // Disable animations on very low-end devices
  if (deviceProfile.isLowEnd && deviceProfile.connectionSpeed === 'slow') {
    return false;
  }

  return true;
}

/**
 * Debounce resize events for responsive animations
 */
export function debounceResize(callback: () => void, delay: number = 250): () => void {
  let timeoutId: NodeJS.Timeout | null = null;

  const handleResize = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };

  window.addEventListener('resize', handleResize);

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Lazy load animations - only animate when element is in viewport
 */
export function createIntersectionObserver(
  elements: HTMLElement[],
  callback: (element: HTMLElement, isVisible: boolean) => void
): IntersectionObserver {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        callback(entry.target as HTMLElement, entry.isIntersecting);
      });
    },
    {
      threshold: 0.1,
      rootMargin: '50px'
    }
  );

  elements.forEach((el) => observer.observe(el));

  return observer;
}

/**
 * CSS will-change helper - use sparingly!
 */
export function setWillChange(element: HTMLElement, properties: string[] = []) {
  if (properties.length > 0) {
    element.style.willChange = properties.join(', ');
  } else {
    element.style.willChange = 'auto';
  }
}

/**
 * Create a performance report
 */
export function generatePerformanceReport(metrics: PerformanceMetrics[]): string {
  if (metrics.length === 0) {
    return 'No metrics collected';
  }

  const avgFps = metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length;
  const avgCpu = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
  const avgMem = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;

  return `
Performance Report
==================
Average FPS: ${Math.round(avgFps)}
Average CPU: ${Math.round(avgCpu)}%
Average Memory: ${Math.round(avgMem)}%
Samples: ${metrics.length}
  `.trim();
}
