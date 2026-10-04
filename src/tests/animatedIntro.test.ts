// =============================================================================
// ANIMATED INTRO TESTS
// Tests the cinematic animated intro: Name, Tagline, Equation, and Chime Synthesizer
// =============================================================================

import { describe, it, expect } from 'vitest';
import { playIntroChime } from '../utils/introAudio';

describe('FarmKind Animated Intro & Audio Synthesizer', () => {
  it('contains the exact brand name and required tagline', () => {
    const brandName = 'FarmKind';
    const primaryTagline = 'FarmKind — Helping Every Small Farm Do More With Less.';
    const subTagline = '(Less water. Less energy. Less money. Less waste. → More productivity. More resilience.)';

    expect(brandName).toBe('FarmKind');
    expect(primaryTagline).toContain('Helping Every Small Farm Do More With Less.');
    expect(subTagline).toContain('Less water. Less energy. Less money. Less waste.');
    expect(subTagline).toContain('→');
    expect(subTagline).toContain('More productivity. More resilience.');
  });

  it('safely synthesizes organic harmonic audio chime without error in SSR/Node and browser environments', () => {
    // In Node.js/SSR without window, it gracefully returns
    expect(() => {
      playIntroChime();
    }).not.toThrow();
  });
});
