/**
 * CircleAnimationLibrary.ts
 * Reusable animation configurations for harmonic circles
 */

export interface AnimationConfig {
  name: string;
  keyframes: string;
  duration: number; // in milliseconds
  delay?: number; // in milliseconds
  iterationCount?: string | number;
  timingFunction?: string;
  fill?: 'forwards' | 'backwards' | 'both' | 'none';
}

export interface AnimationOptions {
  duration?: number;
  delay?: number;
  timingFunction?: string;
  fill?: 'forwards' | 'backwards' | 'both' | 'none';
}

/**
 * Create a slide-in animation from a specific direction
 * @param direction - 'top', 'bottom', 'left', 'right'
 * @param duration - Animation duration in milliseconds (default 500)
 * @returns AnimationConfig
 */
export function slideInFrom(direction: 'top' | 'bottom' | 'left' | 'right', duration = 500): AnimationConfig {
  let startTransform = '';

  switch (direction) {
    case 'top':
      startTransform = 'translate(0, -100px)';
      break;
    case 'bottom':
      startTransform = 'translate(0, 100px)';
      break;
    case 'left':
      startTransform = 'translate(-100px, 0)';
      break;
    case 'right':
      startTransform = 'translate(100px, 0)';
      break;
  }

  const keyframes = `
    @keyframes slideIn${direction.charAt(0).toUpperCase() + direction.slice(1)} {
      from {
        opacity: 0;
        transform: ${startTransform};
      }
      to {
        opacity: 1;
        transform: translate(0, 0);
      }
    }
  `;

  return {
    name: `slideIn${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
    keyframes,
    duration,
    timingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fill: 'forwards',
  };
}

/**
 * Create a cascade fade-in animation with stagger
 * @param staggerMs - Stagger time between elements in milliseconds
 * @param totalDuration - Total animation duration (default 800)
 * @returns AnimationConfig
 */
export function fadeInCascade(staggerMs: number, totalDuration = 800): AnimationConfig {
  const keyframes = `
    @keyframes fadeInCascade {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  return {
    name: 'fadeInCascade',
    keyframes,
    duration: totalDuration,
    timingFunction: 'ease-out',
    fill: 'forwards',
  };
}

/**
 * Create a breathing/pulsing animation
 * @param intensity - Pulse intensity (scale factor, e.g., 1.2 for 20% growth)
 * @param cycle - Cycle duration in milliseconds (default 2000)
 * @returns AnimationConfig
 */
export function breathe(intensity: number = 1.2, cycle: number = 2000): AnimationConfig {
  const keyframes = `
    @keyframes breathe {
      0% {
        opacity: 0.7;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(${intensity});
      }
      100% {
        opacity: 0.7;
        transform: scale(1);
      }
    }
  `;

  return {
    name: 'breathe',
    keyframes,
    duration: cycle,
    timingFunction: 'ease-in-out',
    iterationCount: 'infinite',
  };
}

/**
 * Create a rotation animation
 * @param speed - Rotation speed in RPM (rotations per minute, default 1)
 * @param direction - 'clockwise' or 'counterclockwise'
 * @returns AnimationConfig
 */
export function rotate(speed: number = 1, direction: 'clockwise' | 'counterclockwise' = 'clockwise'): AnimationConfig {
  const degrees = direction === 'clockwise' ? 360 : -360;
  const durationMs = (60 * 1000) / speed; // Convert RPM to ms

  const keyframes = `
    @keyframes rotate${direction.charAt(0).toUpperCase() + direction.slice(1)} {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(${degrees}deg);
      }
    }
  `;

  return {
    name: `rotate${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
    keyframes,
    duration: durationMs,
    timingFunction: 'linear',
    iterationCount: 'infinite',
  };
}

/**
 * Create a wave motion animation
 * @param amplitude - Wave amplitude in pixels
 * @param frequency - Wave frequency/cycles
 * @returns AnimationConfig
 */
export function wave(amplitude: number = 20, frequency: number = 2): AnimationConfig {
  const keyframes = `
    @keyframes wave {
      0% {
        transform: translateY(0px);
      }
      25% {
        transform: translateY(-${amplitude}px);
      }
      50% {
        transform: translateY(0px);
      }
      75% {
        transform: translateY(${amplitude}px);
      }
      100% {
        transform: translateY(0px);
      }
    }
  `;

  const duration = (1000 / frequency) * 2; // Adjust duration based on frequency

  return {
    name: 'wave',
    keyframes,
    duration,
    timingFunction: 'ease-in-out',
    iterationCount: 'infinite',
  };
}

/**
 * Create a gentle bounce animation
 * @param height - Bounce height in pixels
 * @param duration - Animation duration in milliseconds
 * @returns AnimationConfig
 */
export function bounce(height: number = 20, duration: number = 600): AnimationConfig {
  const keyframes = `
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-${height}px);
      }
    }
  `;

  return {
    name: 'bounce',
    keyframes,
    duration,
    timingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    iterationCount: 'infinite',
  };
}

/**
 * Create a glow/shadow animation
 * @param glowColor - Color for the glow effect
 * @param duration - Animation duration in milliseconds
 * @returns AnimationConfig
 */
export function glow(glowColor: string = '#4361EE', duration: number = 2000): AnimationConfig {
  const keyframes = `
    @keyframes glow {
      0%, 100% {
        filter: drop-shadow(0 0 2px ${glowColor});
      }
      50% {
        filter: drop-shadow(0 0 15px ${glowColor});
      }
    }
  `;

  return {
    name: 'glow',
    keyframes,
    duration,
    timingFunction: 'ease-in-out',
    iterationCount: 'infinite',
  };
}

/**
 * Create a fade in and out animation
 * @param fadeInDuration - Time to fade in
 * @param fadeOutDuration - Time to fade out
 * @param holdDuration - Time to stay visible (default 0)
 * @returns AnimationConfig
 */
export function fadeInOut(fadeInDuration: number = 300, fadeOutDuration: number = 300, holdDuration: number = 0): AnimationConfig {
  const total = fadeInDuration + holdDuration + fadeOutDuration;
  const inPercent = (fadeInDuration / total) * 100;
  const holdPercent = ((fadeInDuration + holdDuration) / total) * 100;

  const keyframes = `
    @keyframes fadeInOut {
      0% {
        opacity: 0;
      }
      ${inPercent}% {
        opacity: 1;
      }
      ${holdPercent}% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  `;

  return {
    name: 'fadeInOut',
    keyframes,
    duration: total,
    timingFunction: 'ease-in-out',
    fill: 'forwards',
  };
}

/**
 * Create combined keyframes string from multiple animation configs
 * @param animations - Array of animation configs
 * @returns Combined CSS keyframes string
 */
export function combineAnimationKeyframes(...animations: AnimationConfig[]): string {
  return animations.map((anim) => anim.keyframes).join('\n');
}

/**
 * Get animation timing function by name
 * @param name - Timing function name
 * @returns CSS timing function string
 */
export function getTimingFunction(name: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'custom'): string {
  const timings: Record<string, string> = {
    ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    'ease-in': 'cubic-bezier(0.42, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.58, 1)',
    'ease-in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
    linear: 'linear',
    custom: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // elastic
  };

  return timings[name] || timings.ease;
}
