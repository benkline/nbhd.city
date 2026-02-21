/**
 * HarmonicCircles.jsx
 * Base SVG circle renderer with smooth animations
 * Generates N circles with configurable radii, positions, and colors
 */

import React, { useMemo, useEffect, useState } from 'react';
import { useHarmonyAnimation, useAnimationEnabled } from '../../hooks/useHarmonyAnimation';
import { getHarmonicColor, getRandomHarmonicColor } from '../../lib/HarmonyColors';
import '../../styles/HarmonyAnimations.css';

/**
 * Circle configuration object
 * @typedef {Object} CircleConfig
 * @property {string|number} id - Unique identifier
 * @property {number} radius - Circle radius in pixels
 * @property {number} cx - Center X coordinate
 * @property {number} cy - Center Y coordinate
 * @property {string} [color] - Hex color code
 * @property {number} [opacity] - Opacity 0-1
 * @property {number} [strokeWidth] - Stroke width
 * @property {string} [animation] - Animation name
 * @property {number} [animationDuration] - Duration in ms
 * @property {number} [animationDelay] - Delay in ms
 */

/**
 * Props for HarmonicCircles component
 * @typedef {Object} HarmonicCirclesProps
 * @property {CircleConfig[]} circles - Array of circles to render
 * @property {number} [width=800] - SVG width
 * @property {number} [height=600] - SVG height
 * @property {string} [viewBox] - SVG viewBox
 * @property {string} [className] - CSS class name
 * @property {Object} [style] - Inline styles
 * @property {boolean} [animationEnabled=true] - Enable animations
 * @property {Function} [onAnimationStart] - Callback on animation start
 * @property {Function} [onAnimationComplete] - Callback on animation complete
 * @property {string} [preserveAspectRatio] - SVG preserveAspectRatio
 * @property {string} [backgroundColor] - Background color
 */

/**
 * HarmonicCircles Component
 * Renders SVG circles with harmonic animations
 * Supports fade-in, animations, and CSS transforms
 * @component
 * @param {HarmonicCirclesProps} props
 * @returns {React.ReactElement}
 */
export const HarmonicCircles = ({
  circles,
  width = 800,
  height = 600,
  viewBox = '0 0 800 600',
  className = '',
  style = {},
  animationEnabled: enableAnimations = true,
  onAnimationStart,
  onAnimationComplete,
  preserveAspectRatio = 'xMidYMid meet',
  backgroundColor = 'transparent',
} = {}) => {
  const globalAnimationEnabled = useAnimationEnabled();
  const isAnimationEnabled = enableAnimations && globalAnimationEnabled;
  const { isAnimating } = useHarmonyAnimation({
    enabled: isAnimationEnabled,
    autoStart: true,
  });

  const [circlesToRender, setCirclesToRender] = useState([]);

  // Set up circles with defaults
  useMemo(() => {
    const processedCircles = circles.map((circle, index) => ({
      ...circle,
      color: circle.color || getHarmonicColor(index),
      opacity: circle.opacity ?? 0.8,
      strokeWidth: circle.strokeWidth ?? 0,
      animationDuration: circle.animationDuration ?? 3000,
      animationDelay: circle.animationDelay ?? index * 100,
    }));

    setCirclesToRender(processedCircles);

    // Call animation start callback
    if (onAnimationStart && isAnimating) {
      onAnimationStart();
    }
  }, [circles, isAnimating, onAnimationStart]);

  // Notify when animation completes
  useEffect(() => {
    if (onAnimationComplete && !isAnimating) {
      onAnimationComplete();
    }
  }, [isAnimating, onAnimationComplete]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      className={`harmonic-circles ${className}`}
      style={{
        backgroundColor,
        ...style,
      }}
      aria-label="Harmonic circles animation"
      role="img"
    >
      <defs>
        {/* Define gradients for visual depth */}
        {circlesToRender.map((circle, index) => (
          <radialGradient key={`gradient-${circle.id}`} id={`harmonic-gradient-${circle.id}`}>
            <stop offset="0%" stopColor={circle.color} stopOpacity={circle.opacity} />
            <stop offset="100%" stopColor={circle.color} stopOpacity={Math.max(0, (circle.opacity ?? 0.8) - 0.3)} />
          </radialGradient>
        ))}
      </defs>

      {/* Render circles */}
      {circlesToRender.map((circle) => (
        <g
          key={`circle-group-${circle.id}`}
          style={{
            animation: circle.animation && isAnimationEnabled ? `${circle.animation} ${circle.animationDuration}ms ease-in-out infinite` : 'none',
            animationDelay: circle.animationDelay ? `${circle.animationDelay}ms` : '0ms',
            transform: 'translate(0, 0)',
            transformBox: 'fill-box',
            transformOrigin: `${circle.cx}px ${circle.cy}px`,
            willChange: isAnimationEnabled ? 'transform' : 'auto',
          }}
        >
          <circle
            cx={circle.cx}
            cy={circle.cy}
            r={circle.radius}
            fill={`url(#harmonic-gradient-${circle.id})`}
            stroke={circle.color}
            strokeWidth={circle.strokeWidth}
            opacity={circle.opacity}
            className={isAnimationEnabled ? 'will-animate' : ''}
            style={{
              filter: isAnimationEnabled ? `drop-shadow(0 0 ${circle.radius * 0.1}px ${circle.color})` : 'none',
              transition: 'opacity 300ms ease-out',
            }}
          />
        </g>
      ))}
    </svg>
  );
};

/**
 * Helper function to generate circle grid pattern
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number[]} [radiusRange=[20, 60]] - [min, max] radius range
 * @param {number[]} [viewport=[800, 600]] - [width, height] viewport dimensions
 * @returns {CircleConfig[]} Array of CircleConfig
 */
export function generateCircleGrid(
  rows,
  cols,
  radiusRange = [20, 60],
  viewport = [800, 600]
) {
  const [width, height] = viewport;
  const [minRadius, maxRadius] = radiusRange;
  const circles = [];

  const cellWidth = width / (cols + 1);
  const cellHeight = height / (rows + 1);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      circles.push({
        id: `grid-${row}-${col}`,
        radius: minRadius + Math.random() * (maxRadius - minRadius),
        cx: cellWidth * (col + 1),
        cy: cellHeight * (row + 1),
        color: getHarmonicColor((row + col) % 13),
        opacity: 0.6 + Math.random() * 0.3,
      });
    }
  }

  return circles;
}

/**
 * Helper function to generate random circles
 * @param {number} count - Number of circles to generate
 * @param {number[]} [viewport=[800, 600]] - [width, height] viewport dimensions
 * @param {number[]} [radiusRange=[20, 60]] - [min, max] radius range
 * @returns {CircleConfig[]} Array of CircleConfig
 */
export function generateRandomCircles(
  count,
  viewport = [800, 600],
  radiusRange = [20, 60]
) {
  const [width, height] = viewport;
  const [minRadius, maxRadius] = radiusRange;
  const circles = [];

  for (let i = 0; i < count; i++) {
    const radius = minRadius + Math.random() * (maxRadius - minRadius);

    circles.push({
      id: `random-${i}`,
      radius,
      cx: Math.random() * (width - radius * 2) + radius,
      cy: Math.random() * (height - radius * 2) + radius,
      color: getRandomHarmonicColor(),
      opacity: 0.5 + Math.random() * 0.4,
    });
  }

  return circles;
}

export default HarmonicCircles;
