import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArcComposer, type ArcComposerProps } from './ArcComposer';
import type { OperatorUser } from '../api';

export interface ArcHeroProps {
  composerProps: ArcComposerProps;
  currentUser?: OperatorUser | null;
}

function getGreeting(username?: string | null): string {
  const hour = new Date().getHours();
  let baseGreeting = 'Good evening';
  if (hour >= 5 && hour < 12) {
    baseGreeting = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    baseGreeting = 'Good afternoon';
  }

  if (username && username.trim()) {
    const trimmed = username.trim();
    const lower = trimmed.toLowerCase();
    if (lower !== 'arc operator' && lower !== 'operator' && !lower.startsWith('arc operator')) {
      const formattedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      return `${baseGreeting}, ${formattedName}`;
    }
  }
  return baseGreeting;
}

export const ArcHero: React.FC<ArcHeroProps> = ({
  composerProps,
  currentUser,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const greeting = getGreeting(currentUser?.username);

  // Smooth lerp coordinates for pointer-tracked ambient spotlight
  const currentPos = useRef({ x: 50, y: 50 });
  const targetPos = useRef({ x: 50, y: 50 });
  const rafId = useRef<number | null>(null);

  const startAnimation = () => {
    if (rafId.current !== null) return;

    const animate = () => {
      const container = containerRef.current;
      if (!container) {
        rafId.current = null;
        return;
      }

      // Linear interpolation with factor 0.1
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      currentPos.current.x += dx * 0.1;
      currentPos.current.y += dy * 0.1;

      container.style.setProperty('--spot-x', `${currentPos.current.x.toFixed(2)}%`);
      container.style.setProperty('--spot-y', `${currentPos.current.y.toFixed(2)}%`);

      // Continue animating while distance is perceptible, else snap and sleep
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        currentPos.current.x = targetPos.current.x;
        currentPos.current.y = targetPos.current.y;
        container.style.setProperty('--spot-x', `${targetPos.current.x.toFixed(2)}%`);
        container.style.setProperty('--spot-y', `${targetPos.current.y.toFixed(2)}%`);
        rafId.current = null;
      }
    };

    rafId.current = requestAnimationFrame(animate);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Full 0% to 100% across full rect.width and rect.height without middle-band clamping
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    targetPos.current = {
      x: Math.min(100, Math.max(0, rawX)),
      y: Math.min(100, Math.max(0, rawY)),
    };

    startAnimation();
  };

  const handlePointerLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    targetPos.current = { x: 50, y: 50 };
    startAnimation();
  };

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full min-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center relative z-10 text-center px-4 py-6 sm:py-12 overflow-x-clip"
      style={
        {
          '--spot-x': '50%',
          '--spot-y': '50%',
        } as React.CSSProperties
      }
    >
      {/* Base Subtle Neutral Dark Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] max-w-[100vw] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,rgba(79,93,255,0.05)_35%,rgba(5,6,15,0)_75%)] pointer-events-none -z-20 blur-3xl overflow-hidden"
        aria-hidden="true"
      />

      {/* Wide Full-Hero Spotlight Overlay spanning inset-0 w-full h-full */}
      <div
        className="pointer-events-none absolute inset-0 w-full h-full -z-10 transition-opacity duration-300 blur-2xl overflow-hidden"
        style={{
          background:
            'radial-gradient(1200px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255, 255, 255, 0.05) 0%, rgba(79, 93, 255, 0.04) 40%, rgba(53, 254, 228, 0.02) 68%, transparent 92%)',
        }}
        aria-hidden="true"
      />

      {/* Central Hero Block — Floating Layout */}
      <div className="w-full max-w-3xl flex flex-col items-center justify-center relative z-10 text-center">
        {/* Gemini/Claude-style Greeting + Question Stack */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.05 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-[#4F5DFF] via-[#7C88FF] to-[#35FEE4]">
            {greeting}
          </h1>
          <p className="text-xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#94A3B8] mt-2 sm:mt-3">
            Where should we start?
          </p>
        </motion.div>

        {/* Docked Composer Container */}
        <motion.div
          layoutId="arc-composer-container"
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-2xl border border-white/[0.10] hover:border-white/[0.18] focus-within:border-white/[0.25] transition-[border-color,box-shadow] duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.6)] focus-within:shadow-[0_8px_36px_rgba(0,0,0,0.7)]"
        >
          <ArcComposer {...composerProps} autoFocus />
        </motion.div>
      </div>
    </motion.div>
  );
};
