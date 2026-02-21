/**
 * useHarmonyAnimation.ts
 * Hook to manage animation lifecycle for harmonic circles
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseHarmonyAnimationOptions {
  enabled?: boolean;
  autoStart?: boolean;
  staggerMs?: number;
}

export interface AnimationControls {
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  isAnimating: boolean;
}

/**
 * Hook to manage harmony animation lifecycle
 * Handles performance optimization with requestAnimationFrame
 */
export function useHarmonyAnimation(options: UseHarmonyAnimationOptions = {}): AnimationControls {
  const { enabled = true, autoStart = true, staggerMs = 0 } = options;

  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number | null>(null);
  const staggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for prefers-reduced-motion preference
  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const start = useCallback(() => {
    if (!enabled || prefersReducedMotion()) {
      return;
    }

    if (staggerMs > 0) {
      staggerTimeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        startTimeRef.current = performance.now();
      }, staggerMs);
    } else {
      setIsAnimating(true);
      startTimeRef.current = performance.now();
    }
  }, [enabled, staggerMs, prefersReducedMotion]);

  const pause = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      pausedTimeRef.current = performance.now();
    }
  }, []);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (staggerTimeoutRef.current) {
      clearTimeout(staggerTimeoutRef.current);
    }
    setIsAnimating(false);
    startTimeRef.current = null;
    pausedTimeRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    if (autoStart) {
      start();
    }
  }, [stop, start, autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (staggerTimeoutRef.current) {
        clearTimeout(staggerTimeoutRef.current);
      }
    };
  }, []);

  // Auto-start animation if enabled
  useEffect(() => {
    if (enabled && autoStart && !isAnimating) {
      start();
    }
  }, [enabled, autoStart, start, isAnimating]);

  return {
    start,
    pause,
    stop,
    reset,
    isAnimating,
  };
}

/**
 * Hook to detect if animations should be disabled globally
 * Returns true if animations should be disabled
 */
export function useAnimationEnabled(): boolean {
  const [animationEnabled, setAnimationEnabled] = useState(true);

  useEffect(() => {
    // Check if window.matchMedia is available (not in test environment)
    if (typeof window === 'undefined' || !window.matchMedia) {
      setAnimationEnabled(true);
      return;
    }

    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setAnimationEnabled(!e.matches);
    };

    // Check initial state
    setAnimationEnabled(!mediaQuery.matches);

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return animationEnabled;
}

/**
 * Hook to calculate animation delay for staggered animations
 * @param index - Element index
 * @param staggerMs - Milliseconds between each element
 * @returns Delay in milliseconds
 */
export function useAnimationDelay(index: number, staggerMs: number = 50): number {
  return index * staggerMs;
}

/**
 * Hook to measure animation frame rate and performance
 * @returns Object with FPS and performance metrics
 */
export function useAnimationPerformance() {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const measureFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(measureFps);
    };

    animationFrameRef.current = requestAnimationFrame(measureFps);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    fps,
    isSmooth: fps >= 50,
    isPerfect: fps >= 59,
  };
}

/**
 * Hook to handle animation visibility optimization
 * Pauses animations when element is not visible (Intersection Observer)
 * @returns Object with isVisible state
 */
export function useAnimationVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { isVisible, elementRef };
}
