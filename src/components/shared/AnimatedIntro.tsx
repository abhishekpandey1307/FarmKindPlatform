// =============================================================================
// FARMKIND — PREMIUM ANIMATED INTRO
// Cinematic, ultra-high-end product reveal showcasing the brand and core promise:
// "FarmKind — Helping Every Small Farm Do More With Less.
// (Less water. Less energy. Less money. Less waste. → More productivity. More resilience.)"
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { playIntroChime } from '../../utils/introAudio';

interface AnimatedIntroProps {
  onComplete: () => void;
  autoDismissMs?: number;
}

export function AnimatedIntro({ onComplete, autoDismissMs = 6000 }: AnimatedIntroProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const hasExitedRef = useRef(false);

  const handleExit = useCallback(() => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 650);
  }, [onComplete]);

  // Attempt ambient audio chime on mount (or first interaction)
  useEffect(() => {
    if (!soundPlayed) {
      try {
        playIntroChime();
        setSoundPlayed(true);
      } catch {
        // Autoplay may be blocked by browser policy
      }
    }
  }, [soundPlayed]);

  // Keyboard navigation: Space, Enter, or Escape dismisses intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExit]);

  // Smooth progress bar counter towards auto-dismiss
  useEffect(() => {
    const intervalTime = 50;
    const increment = (intervalTime / autoDismissMs) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleExit();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [autoDismissMs, handleExit]);

  // Ambient floating background particles (24 particles)
  const particles = useRef(
    Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${(i * 4.2 + (i % 5) * 3) % 96 + 2}%`,
      top: `${(i * 7.1 + (i % 7) * 4) % 92 + 4}%`,
      size: `${(i % 3) * 2 + 3}px`,
      duration: `${6 + (i % 5) * 2}s`,
      delay: `${(i % 4) * 0.8}s`,
      opacity: 0.2 + (i % 4) * 0.15,
      color: i % 3 === 0 ? 'rgba(34, 197, 94, 0.7)' : i % 3 === 1 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(56, 189, 248, 0.5)',
    }))
  ).current;

  return (
    <div
      className={`intro-portal ${isExiting ? 'intro-portal--exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="FarmKind Brand Introduction"
      onClick={handleExit}
    >
      {/* Ambient Radial Auroras */}
      <div className="intro-aurora intro-aurora--top" aria-hidden="true" />
      <div className="intro-aurora intro-aurora--bottom" aria-hidden="true" />
      <div className="intro-grid-pattern" aria-hidden="true" />

      {/* Floating Organic Stardust Particles */}
      <div className="intro-particles-container" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="intro-particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
              backgroundColor: p.color,
              boxShadow: `0 0 10px ${p.color}`,
            }}
          />
        ))}
      </div>

      {/* Top Controls: Sound & Skip */}
      <div className="intro-topbar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="intro-skip-btn"
          onClick={handleExit}
          aria-label="Skip introduction and open platform"
        >
          <span>Skip to Platform</span>
          <span className="intro-skip-arrow">→</span>
        </button>
      </div>

      {/* Main Centerpiece Stage */}
      <div className="intro-stage" onClick={(e) => e.stopPropagation()}>
        {/* Glowing Brand Emblem */}
        <div className="intro-emblem-wrap">
          <div className="intro-emblem-glow" aria-hidden="true" />
          <svg
            className="intro-emblem-svg"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Outer Solar Arc */}
            <circle
              cx="36"
              cy="36"
              r="30"
              stroke="url(#intro-sun-grad)"
              strokeWidth="2.5"
              strokeDasharray="4 8"
              className="intro-spin-slow"
            />
            {/* Inner Organic Drop & Sprout */}
            <path
              d="M36 12C36 12 20 30 20 42C20 50.8366 27.1634 58 36 58C44.8366 58 52 50.8366 52 42C52 30 36 12 36 12Z"
              stroke="url(#intro-leaf-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Central Sprout Leaf */}
            <path
              d="M36 48V32M36 38C38.5 35 44 34.5 45 31M36 43C33 40.5 28 41 27 38"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Center Sun Spark */}
            <circle cx="36" cy="24" r="3" fill="#f59e0b" filter="drop-shadow(0 0 6px #f59e0b)" />

            <defs>
              <linearGradient id="intro-sun-grad" x1="6" y1="6" x2="66" y2="66" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" />
                <stop offset="0.5" stopColor="#22c55e" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="intro-leaf-grad" x1="20" y1="12" x2="52" y2="58" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22c55e" />
                <stop offset="0.7" stopColor="#10b981" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Brand Name Title */}
        <h1 className="intro-title">
          <span className="intro-title-farm">Farm</span>
          <span className="intro-title-kind">Kind</span>
          <span className="intro-title-sheen" aria-hidden="true" />
        </h1>

        {/* Luminous Horizon Beam */}
        <div className="intro-horizon-beam" aria-hidden="true" />

        {/* Primary Tagline */}
        <p className="intro-tagline">
          Helping Every Small Farm Do More With Less.
        </p>

        {/* Contrast Equation / Subsentence in single line, small, no card, no height */}
        <p className="intro-subsentence" aria-label="Less water. Less energy. Less money. Less waste. Leading to more productivity and resilience.">
          <span className="intro-subsentence-paren">(</span>
          <span className="intro-subsentence-less">Less water. Less energy. Less money. Less waste.</span>
          <span className="intro-subsentence-arrow">→</span>
          <span className="intro-subsentence-more">More productivity. More resilience.</span>
          <span className="intro-subsentence-paren">)</span>
        </p>

        {/* Enter CTA & Interactive Action */}
        <div className="intro-actions">
          <button
            type="button"
            className="intro-enter-btn"
            onClick={handleExit}
            aria-label="Enter FarmKind platform"
          >
            <span className="intro-btn-shimmer" aria-hidden="true" />
            <span className="intro-btn-label">Enter FarmKind</span>
            <span className="intro-btn-icon">→</span>
          </button>
          <div className="intro-sub-hint">
            <span>Press</span> <kbd className="intro-kbd">Space</kbd> <span>or click anywhere to enter</span>
          </div>
        </div>
      </div>

      {/* Bottom Sleek Ambient Progress Bar */}
      <div className="intro-progress-bar-track" aria-hidden="true">
        <div
          className="intro-progress-bar-fill"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}
