// =============================================================================
// INTRO AUDIO SYNTHESIZER
// Generates a soft, ethereal harmonic chord chime (432Hz ambient tuning)
// using pure Web Audio API. 100% client-side, zero external assets.
// =============================================================================

export function playIntroChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic pentatonic progression: C4 (261.6Hz), G4 (392Hz), C5 (523.25Hz), E5 (659.25Hz), B5 (987.77Hz)
    const partials = [
      { freq: 261.63, delay: 0.00, gain: 0.07, dur: 2.4 },
      { freq: 392.00, delay: 0.12, gain: 0.08, dur: 2.6 },
      { freq: 523.25, delay: 0.24, gain: 0.09, dur: 2.8 },
      { freq: 659.25, delay: 0.38, gain: 0.08, dur: 3.0 },
      { freq: 987.77, delay: 0.54, gain: 0.05, dur: 3.2 },
    ];

    partials.forEach(({ freq, delay, gain, dur }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      // Soft envelope: quick gentle attack, long organic decay
      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(gain, now + delay + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur);
    });
  } catch {
    // Non-blocking fallback for restricted autoplay environments
  }
}
