// =============================================================================
// FARMKIND — CELEBRATION MODAL (Burst Animation & Motivational Feedback)
// Displays celebratory reward when farmer activates/books recommendations
// =============================================================================

import { useApp } from '../../app/AppContext';

export function CelebrationModal() {
  const { state, dismissCelebration, returnToFarmState } = useApp();
  const celebration = state.celebration;

  if (!celebration || !celebration.show) return null;

  return (
    <div className="celebration-overlay" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      {/* Animated confetti particle shower */}
      <div className="confetti-container" aria-hidden="true">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className={`confetti-particle confetti-particle--${i % 6}`}
            style={{
              left: `${(i * 3.7) % 100}%`,
              animationDelay: `${(i * 0.08) % 1.5}s`,
              animationDuration: `${1.8 + ((i * 0.12) % 1.2)}s`,
              transform: `scale(${0.7 + ((i * 0.05) % 0.6)})`,
            }}
          />
        ))}
      </div>

      <div className="celebration-card animate-spring">
        <div className="celebration-badge-glow">
          <span className="text-4xl animate-bounce">🎉</span>
        </div>

        <h3 id="celebration-title" className="text-xl font-black text-green tracking-tight mt-2 mb-1">
          {celebration.title}
        </h3>

        <p className="text-xs text-secondary mb-3 leading-relaxed">
          {celebration.message}
        </p>

        <div className="card p-3 mb-4 text-center" style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,211,238,0.06) 100%)',
          border: '1px solid rgba(34,197,94,0.3)',
          boxShadow: '0 0 24px rgba(34,197,94,0.15)',
        }}>
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-0.5">
            YOUR PROJECTED IMPACT
          </span>
          <span className="text-lg font-black text-green font-mono">
            {celebration.metricSaved}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            className="btn btn--primary btn--full font-bold flex items-center justify-center gap-2"
            onClick={() => {
              dismissCelebration();
              returnToFarmState();
            }}
          >
            <span>🏡</span>
            <span>Back to Current Farm State</span>
          </button>

          <button
            className="btn btn--ghost btn--full btn--sm text-muted"
            onClick={dismissCelebration}
          >
            Stay on This Screen →
          </button>
        </div>
      </div>
    </div>
  );
}
