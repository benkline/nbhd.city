/**
 * HarmonyPattern.jsx
 * Pattern generator that creates intersection patterns from 3-7 circles
 * Generates Chladni-plate-like standing wave patterns
 */

import React, { useMemo } from 'react';
import HarmonicCircles, { CircleConfig } from './HarmonicCircles';
import { getHarmonicGradient } from '../../lib/HarmonyColors';

/**
 * Props for HarmonyPattern component
 * @typedef {Object} HarmonyPatternProps
 * @property {number} [circleCount=5] - Number of circles (3-7)
 * @property {number} [centerX=400] - Center X coordinate
 * @property {number} [centerY=300] - Center Y coordinate
 * @property {number} [width=800] - Viewport width
 * @property {number} [height=600] - Viewport height
 * @property {number} [baseRadius=80] - Base radius for circles
 * @property {boolean} [useGradient=true] - Use harmonic gradient colors
 * @property {number} [colorStartIndex=0] - Starting color index
 * @property {boolean} [animationEnabled=true] - Enable animations
 * @property {'slow'|'medium'|'fast'} [animationVariation='medium'] - Animation speed
 * @property {number} [opacity=0.7] - Circle opacity
 * @property {string} [className] - CSS class name
 * @property {Object} [style] - Inline styles
 * @property {string} [backgroundColor='transparent'] - Background color
 * @property {Function} [onAnimationStart] - Animation start callback
 * @property {Function} [onAnimationComplete] - Animation complete callback
 */

/**
 * HarmonyPattern Component
 * Creates beautiful Chladni-plate-like patterns with intersecting circles
 * Circles animate at different frequencies (2s, 3s, 4s, 5s cycles)
 * @component
 * @param {HarmonyPatternProps} props
 * @returns {React.ReactElement}
 */
export const HarmonyPattern = ({
  circleCount = 5,
  centerX = 400,
  centerY = 300,
  width = 800,
  height = 600,
  baseRadius = 80,
  useGradient = true,
  colorStartIndex = 0,
  animationEnabled = true,
  animationVariation = 'medium',
  opacity = 0.7,
  className = '',
  style = {},
  backgroundColor = 'transparent',
  onAnimationStart,
  onAnimationComplete,
} = {}) => {
  // Validate circle count
  const validCircleCount = Math.max(3, Math.min(7, circleCount));

  // Animation durations based on variation
  const animationDurations: Record<string, number[]> = {
    slow: [5000, 6000, 7000, 8000, 9000, 10000, 11000],
    medium: [2000, 3000, 4000, 5000, 6000, 7000, 8000],
    fast: [1000, 1500, 2000, 2500, 3000, 3500, 4000],
  };

  // Animation names (harmonic oscillations)
  const animationNames = [
    'oscillate2s',
    'oscillate3s',
    'oscillate4s',
    'oscillate5s',
    'oscillate2s',
    'oscillate3s',
    'oscillate4s',
  ];

  // Get colors for circles
  const colors = useMemo(() => {
    if (useGradient) {
      return getHarmonicGradient(validCircleCount, colorStartIndex);
    }

    // Use simple harmonic colors
    return Array.from({ length: validCircleCount }, (_, i) => {
      const hue = (colorStartIndex + i * (360 / validCircleCount)) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    });
  }, [validCircleCount, useGradient, colorStartIndex]);

  // Generate circle positions in a circular arrangement
  const circles = useMemo((): CircleConfig[] => {
    const arrangementAngles = Array.from({ length: validCircleCount }, (_, i) => (i / validCircleCount) * Math.PI * 2);

    // Distance from center varies per circle for overlapping pattern
    const distances = [
      baseRadius * 0.7,
      baseRadius * 0.9,
      baseRadius * 1.1,
      baseRadius * 0.8,
      baseRadius * 1.0,
      baseRadius * 0.85,
      baseRadius * 1.05,
    ];

    return arrangementAngles.map((angle, index) => {
      const distance = distances[index % distances.length];
      const radius = baseRadius * (0.6 + Math.random() * 0.4);

      // Calculate position using polar coordinates
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      // Clamp positions to stay within viewport
      const clampedX = Math.max(radius, Math.min(width - radius, x));
      const clampedY = Math.max(radius, Math.min(height - radius, y));

      const durations = animationDurations[animationVariation];

      return {
        id: `pattern-${index}`,
        radius,
        cx: clampedX,
        cy: clampedY,
        color: colors[index],
        opacity: opacity,
        strokeWidth: 1,
        animation: animationNames[index % animationNames.length],
        animationDuration: durations[index % durations.length],
        animationDelay: index * 150, // Stagger animation starts
      };
    });
  }, [validCircleCount, centerX, centerY, baseRadius, colors, opacity, animationVariation, width, height]);

  return (
    <HarmonicCircles
      circles={circles}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`harmony-pattern ${className}`}
      style={style}
      animationEnabled={animationEnabled}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
      backgroundColor={backgroundColor}
      preserveAspectRatio="xMidYMid slice"
    />
  );
};

/**
 * Preset patterns for common use cases
 */

/**
 * Small accent pattern (2-3 circles)
 * Good for button hover states and small UI accents
 * @param {Partial<HarmonyPatternProps>} [props={}]
 * @returns {React.ReactElement}
 */
export function SmallHarmonyPattern(props = {}) {
  return (
    <HarmonyPattern
      circleCount={2}
      baseRadius={30}
      width={200}
      height={200}
      centerX={100}
      centerY={100}
      animationVariation="fast"
      opacity={0.6}
      {...props}
    />
  );
}

/**
 * Medium pattern (4-5 circles)
 * Good for component backgrounds and modal headers
 * @param {Partial<HarmonyPatternProps>} [props={}]
 * @returns {React.ReactElement}
 */
export function MediumHarmonyPattern(props = {}) {
  return (
    <HarmonyPattern
      circleCount={4}
      baseRadius={60}
      width={600}
      height={400}
      centerX={300}
      centerY={200}
      animationVariation="medium"
      opacity={0.6}
      {...props}
    />
  );
}

/**
 * Large pattern (6-7 circles)
 * Good for full-page backgrounds and hero sections
 * @param {Partial<HarmonyPatternProps>} [props={}]
 * @returns {React.ReactElement}
 */
export function LargeHarmonyPattern(props = {}) {
  return (
    <HarmonyPattern
      circleCount={6}
      baseRadius={120}
      width={1200}
      height={800}
      centerX={600}
      centerY={400}
      animationVariation="slow"
      opacity={0.5}
      {...props}
    />
  );
}

/**
 * Subtle background pattern
 * Good for faded backgrounds that don't draw attention
 * @param {Partial<HarmonyPatternProps>} [props={}]
 * @returns {React.ReactElement}
 */
export function SubtleHarmonyPattern(props = {}) {
  return (
    <HarmonyPattern
      circleCount={3}
      baseRadius={40}
      width={400}
      height={300}
      centerX={200}
      centerY={150}
      animationVariation="slow"
      opacity={0.3}
      {...props}
    />
  );
}

/**
 * Vibrant pattern
 * Good for hero sections and call-to-action areas
 * @param {Partial<HarmonyPatternProps>} [props={}]
 * @returns {React.ReactElement}
 */
export function VibrantHarmonyPattern(props = {}) {
  return (
    <HarmonyPattern
      circleCount={7}
      baseRadius={100}
      width={1000}
      height={700}
      centerX={500}
      centerY={350}
      animationVariation="medium"
      opacity={0.8}
      {...props}
    />
  );
}

export default HarmonyPattern;
