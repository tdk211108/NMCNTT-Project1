'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';

export interface SpectrumLoaderProps {
  size?: number;
  strokeWidth?: number;
  duration?: number;
  colors?: readonly [string, string, string, string, string, string];
  glow?: boolean;
  className?: string;
}

const CORERASTER_SPECTRUM_COLORS = [
  '#D71920',
  '#FF4D58',
  '#E11D48',
  '#F59E0B',
  '#B91C1C',
  '#FB7185',
] as const;

/**
 * Lightswind Spectrum Loader recolored to CoreRaster's Crimson Matrix Signal palette
 * with simultaneous counter-clockwise gradient rotation and masked stroke draw sweep.
 */
export function SpectrumLoader({
  size = 28,
  strokeWidth = 3.2,
  duration = 1.65,
  colors = CORERASTER_SPECTRUM_COLORS,
  glow = true,
  className = '',
}: SpectrumLoaderProps) {
  const uid = useId().replace(/:/g, '');
  const maskId = `cr-mask-${uid}`;
  const glowId = `cr-glow-${uid}`;
  const prefersReduced = useReducedMotion();

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center overflow-visible ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" className="h-full w-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {glow ? (
            <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.15" result="blur" />
              <feColorMatrix type="saturate" values="2" />
              <feComposite in="SourceGraphic" operator="over" />
            </filter>
          ) : null}
          <radialGradient id={`${uid}-a`} cx="0" cy="24" r="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={colors[0]} />
            <stop offset="1" stopColor={colors[0]} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-b`} cx="24" cy="24" r="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={colors[1]} />
            <stop offset="1" stopColor={colors[1]} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-c`} cx="12" cy="0" r="12" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={colors[2]} />
            <stop offset="1" stopColor={colors[2]} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-d`} cx="12" cy="12" r="12" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={colors[3]} />
            <stop offset="1" stopColor={colors[3]} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-e`} cx="0" cy="0" r="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={colors[4]} />
            <stop offset="1" stopColor={colors[4]} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-f`} cx="24" cy="0" r="20" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={colors[5]} />
            <stop offset="1" stopColor={colors[5]} stopOpacity="0" />
          </radialGradient>

          <mask id={maskId}>
            <motion.circle
              cx="12"
              cy="12"
              r="8.5"
              fill="none"
              stroke="white"
              strokeWidth={strokeWidth}
              pathLength="1.025"
              animate={prefersReduced ? undefined : { strokeDashoffset: [1.05, 2.1, 3.15] }}
              transition={
                prefersReduced
                  ? undefined
                  : { duration, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] }
              }
              style={{ strokeDasharray: '1.05' }}
            />
          </mask>
        </defs>

        <circle
          cx="12"
          cy="12"
          r="8.5"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.14"
          strokeWidth={strokeWidth}
        />

        <motion.g
          animate={prefersReduced ? undefined : { rotate: -360 }}
          transition={
            prefersReduced
              ? undefined
              : { duration: duration * 1.5, repeat: Infinity, ease: 'linear' }
          }
          style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
          filter={glow ? `url(#${glowId})` : undefined}
        >
          <g mask={`url(#${maskId})`}>
            <rect x="0" y="0" width="24" height="24" fill={`url(#${uid}-a)`} />
            <rect x="0" y="0" width="24" height="24" fill={`url(#${uid}-b)`} />
            <rect x="0" y="0" width="24" height="24" fill={`url(#${uid}-c)`} />
            <rect x="0" y="0" width="24" height="24" fill={`url(#${uid}-d)`} />
            <rect x="0" y="0" width="24" height="24" fill={`url(#${uid}-e)`} />
            <rect x="0" y="0" width="24" height="24" fill={`url(#${uid}-f)`} />
          </g>
        </motion.g>
      </svg>
    </span>
  );
}
