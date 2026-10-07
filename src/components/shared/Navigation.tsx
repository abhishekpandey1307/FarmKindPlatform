// =============================================================================
// FARMKIND — NAVIGATION (Top bar + Bottom nav + Voice FAB)
// =============================================================================

import { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../app/AppContext';
import { LanguageSelector } from './LanguageSelector';
import { TRANSLATIONS } from '../../i18n/translations';
import { FarmMitraMascot } from './FarmMitraMascot';

const SCREENS = [
  { id: 0, label: 'How FarmKind Works', icon: '📖', navGroup: 'GUIDE' },
  { id: 1, label: 'Farm Understanding & Problem Audit', icon: '🌾', navGroup: 'HOME' },
  { id: 2, label: 'Smart Irrigation & Automation', icon: '💧', navGroup: 'HOME' },
  { id: 3, label: 'Affordable Resources Marketplace', icon: '☀️', navGroup: 'FARM' },
  { id: 4, label: 'Sensor Telemetry & Ground Data', icon: '📡', navGroup: 'MARKET' },
  { id: 5, label: 'Mitra Conversational Voice AI', icon: '🎤', navGroup: 'VOICE' },
  { id: 6, label: 'Post-Harvest Decision System', icon: '🛡️', navGroup: 'SHIELDS' },
  { id: 7, label: 'Measured Savings & Prosperity', icon: '🏆', navGroup: 'SHIELDS' },
];




function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

// ─── TOP NAV ─────────────────────────────────────────────────────────────────

export function TopNav() {
  const { state, dispatch, toggleLiveInspector, replayIntro, navigateTo } = useApp();
  const { farmState, simulation, liveSync } = state;
  const sensorLive = farmState.farm.soil.sensorStatus === 'LIVE';

  return (
    <header className="top-nav" role="banner">
      <div
        className="top-nav__brand"
        onClick={replayIntro}
        style={{ cursor: 'pointer' }}
        title="Replay FarmKind Animated Intro"
      >
        <div className="top-nav__logo" aria-hidden="true">FK</div>
        <span className="top-nav__name">
          Farm<span>Kind</span>
        </span>
      </div>

      <div className="top-nav__actions">
        {/* Global Multilingual Selector */}
        <LanguageSelector variant="topbar" />

        {/* How It Works Full Guide Button */}
        <button
          className="btn btn--xs btn--ghost flex items-center gap-1"
          onClick={() => navigateTo(0)}
          style={{
            border: state.activeScreen === 0 ? '1px solid var(--clr-water-blue)' : '1px solid rgba(56, 189, 248, 0.25)',
            background: state.activeScreen === 0 ? 'rgba(56, 189, 248, 0.18)' : 'rgba(56, 189, 248, 0.06)',
            color: state.activeScreen === 0 ? '#f0f9ff' : '#7dd3fc',
            borderRadius: 'var(--radius-full)',
            padding: '4px 9px',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
          title="Open How FarmKind Works Guide"
          id="btn-topnav-how-it-works"
        >
          <span className="hidden sm:inline">{TRANSLATIONS.nav.howItWorks[state.language ?? 'hi'] || '📖 How It Works'}</span>
          <span className="inline sm:hidden">📖</span>
        </button>

        {/* Replay Brand Intro Button */}
        <button
          className="btn btn--xs btn--ghost flex items-center gap-1"
          onClick={replayIntro}
          style={{
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#cbd5e1',
            borderRadius: 'var(--radius-full)',
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
          title="Watch FarmKind Animated Intro & Core Promise"
        >
          <span className="hidden sm:inline">✨ INTRO</span>
          <span className="inline sm:hidden">✨</span>
        </button>
        {/* Live Data Telemetry Indicator */}
        {liveSync.isLiveMode && !state.isOffline ? (
          <button
            className="btn btn--xs btn--ghost flex items-center gap-1.5"
            style={{
              border: '1px solid rgba(34, 197, 94, 0.4)',
              background: 'rgba(34, 197, 94, 0.08)',
              color: 'var(--clr-farm-green)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 9px',
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
            onClick={toggleLiveInspector}
            title="Open Real Agrometeorology & Mandi Telemetry Inspector"
          >
            <span className="status-dot status-dot--live animate-pulse" />
            <span className="hidden md:inline">LIVE · Nashik ({liveSync.countdownSec}s)</span>
            <span className="inline md:hidden">LIVE</span>
          </button>
        ) : (
          <button
            className="btn btn--xs btn--ghost flex items-center gap-1"
            style={{
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: 'var(--clr-solar-amber)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 8px',
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}
            onClick={toggleLiveInspector}
            title="Open Hybrid Engine Controller"
          >
            <span className="hidden md:inline">🧪 SCENARIO MODE</span>
            <span className="inline md:hidden">🧪 SCENARIO</span>
          </button>
        )}

        {state.isOffline && (
          <span className="badge badge--warning flex items-center gap-1" title="Offline Mode: Actions queued locally">
            <span className="hidden sm:inline">📶 OFFLINE</span>
            <span className="inline sm:hidden">📶</span>
          </span>
        )}
        {simulation.isRunning && !state.isOffline && (
          <span className="badge badge--live hidden sm:inline-flex items-center gap-1">
            <span className="status-dot status-dot--live" aria-hidden="true" />
            <span>{simulation.isPaused ? 'PAUSED' : 'SIMULATING'}</span>
          </span>
        )}
        {sensorLive && (
          <span className="badge badge--simulated hidden sm:inline-flex">SENSOR</span>
        )}
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => dispatch({ type: 'TOGGLE_DEMO_CONTROLS' })}
          aria-label="Toggle demo controls"
          title="Demo Controls"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}

// ─── BOTTOM NAV ──────────────────────────────────────────────────────────────

export function BottomNav() {
  return null;
}

// ─── VOICE FAB (FARM MITRA MASCOT & MULTILINGUAL SPEECH BUBBLE) ─────────────
export function VoiceFAB() {
  const { navigateTo, state } = useApp();
  const isVoiceScreen = state.activeScreen === 5;
  const currentLang = state.language ?? 'hi';
  const t = TRANSLATIONS.floatingVoiceMitra;
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  // On Voice AI screen, do not show floating FAB so it never blocks chat messages or mic controls
  if (isVoiceScreen) return null;

  const title = t.title[currentLang] || t.title.en;
  const bubbleText = t.speechBubble[currentLang] || t.speechBubble.en;
  const speechHint = t.speechHint[currentLang] || t.speechHint.en;
  const badgeOnline = t.badgeOnline[currentLang] || t.badgeOnline.en;
  const closeLabel = t.closeTooltip[currentLang] || t.closeTooltip.en;

  const handleOpenVoice = () => {
    navigateTo(5);
  };

  const handleDismissBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBubbleDismissed(true);
  };

  return (
    <div className="voice-fab-widget" role="region" aria-label="Farm Mitra Voice Assistant">
      {/* Friendly Speech Bubble Prompt (Like Top Websites) */}
      {!bubbleDismissed && (
        <div
          className="voice-fab-bubble animate-in"
          onClick={handleOpenVoice}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenVoice();
            }
          }}
          title={speechHint}
          aria-label={`${title}: ${bubbleText}`}
        >
          {/* Header Row with Mini Avatar, Status & Dismiss */}
          <div className="voice-fab-bubble__header">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="voice-fab-bubble__avatar-mini" aria-hidden="true">🌱</span>
              <span className="voice-fab-bubble__name font-bold">{title}</span>
              <span className="voice-fab-bubble__live-pill">
                <span className="status-dot status-dot--live animate-pulse" aria-hidden="true" />
                <span>{badgeOnline}</span>
              </span>
            </div>
            <button
              type="button"
              className="voice-fab-bubble__close"
              onClick={handleDismissBubble}
              aria-label={closeLabel}
              title={closeLabel}
            >
              ×
            </button>
          </div>

          {/* Localized Friendly Prompt Line */}
          <p className="voice-fab-bubble__text">
            {bubbleText}
          </p>

          {/* Action Callout */}
          <div className="voice-fab-bubble__action">
            <span className="voice-fab-bubble__action-icon" aria-hidden="true">🎙️</span>
            <span>{speechHint}</span>
          </div>

          {/* Speech Bubble Pointer Arrow */}
          <div className="voice-fab-bubble__arrow" aria-hidden="true" />
        </div>
      )}

      {/* Floating Mascot Avatar + Glowing Mic Action Button */}
      <button
        className="voice-fab"
        onClick={handleOpenVoice}
        aria-label={`${title} - ${speechHint}`}
        title={`${title}: ${bubbleText}`}
        id="btn-voice-fab"
      >
        <div className="voice-fab__mascot-wrap">
          <FarmMitraMascot size={50} />
        </div>
        <div className="voice-fab__mic-badge" aria-hidden="true">
          <MicIcon />
        </div>
        <span className="voice-fab__ping-ring" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── SCREEN BREADCRUMB ────────────────────────────────────────────────────────

export function ScreenBreadcrumb() {
  const { state, navigateTo } = useApp();
  const { activeScreen, language } = state;
  const currentLang = language ?? 'hi';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to update arrow disabled states
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  // Automatically scroll active screen tab smoothly into view whenever activeScreen changes
  useEffect(() => {
    const activeEl = document.getElementById(`screen-tab-${activeScreen}`);
    if (activeEl && containerRef.current) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      // Re-check scroll state after animation
      setTimeout(updateScrollState, 350);
    }
  }, [activeScreen, updateScrollState]);

  // Smooth scroll by delta on arrow click
  const handleScroll = (delta: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
      setTimeout(updateScrollState, 350);
    }
  };

  // Convert vertical mouse wheel into horizontal scroll on desktop!
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (containerRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      containerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Keyboard navigation across tabs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, screenId: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = Math.min(7, screenId + 1);
      navigateTo(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = Math.max(0, screenId - 1);
      navigateTo(prev);
    } else if (e.key === 'Home') {
      e.preventDefault();
      navigateTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      navigateTo(7);
    }
  };

  return (
    <nav className="screen-nav-wrapper" aria-label="Screen Navigation tabs">
      <button
        type="button"
        className="screen-nav-arrow screen-nav-arrow--left"
        onClick={() => handleScroll(-220)}
        disabled={!canScrollLeft}
        aria-label="Scroll left to previous screens"
        title="Previous screens"
      >
        ‹
      </button>

      <div
        ref={containerRef}
        className="screen-tabs-container"
        onWheel={handleWheel}
        role="tablist"
        aria-label="FarmKind 7-step journey screens"
      >
        <div className="screen-tabs">
          {SCREENS.map(s => {
            const scrConfig = TRANSLATIONS.screens[s.id as keyof typeof TRANSLATIONS.screens];
            const localizedName = scrConfig?.name[currentLang] || scrConfig?.name.en || s.label;

            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={activeScreen === s.id}
                className={`screen-tab ${activeScreen === s.id ? 'screen-tab--active' : ''}`}
                onClick={() => navigateTo(s.id)}
                onKeyDown={e => handleKeyDown(e, s.id)}
                id={`screen-tab-${s.id}`}
                tabIndex={activeScreen === s.id ? 0 : -1}
              >
                <span aria-hidden="true">{s.icon}</span>
                <span>{s.id === 0 ? localizedName : `${s.id}. ${localizedName}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="screen-nav-arrow screen-nav-arrow--right"
        onClick={() => handleScroll(220)}
        disabled={!canScrollRight}
        aria-label="Scroll right to screens 6 and 7 (Impact & Scale)"
        title="Next screens (Reach 7. Impact)"
      >
        ›
      </button>
    </nav>
  );
}

// ─── DEMO CONTROLS ────────────────────────────────────────────────────────────

export function DemoControls() {
  const {
    state,
    startScenario,
    pauseScenario,
    resumeScenario,
    stepNextEvent,
    resetScenario,
    simulateFailure,
    toggleOffline,
    dispatch
  } = useApp();
  const { simulation, isOffline } = state;

  if (!state.showDemoControls) return null;

  const scenarios = [
    { id: 'irrigation-rain-delay' as const, label: 'Resource Saver' },
    { id: 'harvest-market-shift' as const, label: 'Harvest' },
    { id: 'heat-risk' as const, label: 'Climate' },
    { id: 'cross-shield-day' as const, label: 'Cross-Shield' },
  ];

  const speeds = [1, 10, 60] as const;

  return (
    <div className="demo-controls" role="complementary" aria-label="Demo controls" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-muted uppercase tracking-wider">Demo Controller</p>
        <span className="badge badge--simulated">JURY MODE</span>
      </div>

      {/* Scenarios */}
      <p className="text-xs text-muted mb-2 font-semibold">Preset Scenarios</p>
      <div className="flex flex-col gap-1 mb-3">
        {scenarios.map(s => (
          <button
            key={s.id}
            className={`btn btn--sm ${simulation.currentScenario === s.id ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => startScenario(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Playback Controls: Section 30 & 57 */}
      <p className="text-xs text-muted mb-1 font-semibold">Simulation Clock</p>
      <div className="flex gap-1 mb-2">
        {simulation.isPaused ? (
          <button className="btn btn--green btn--sm flex-1" onClick={resumeScenario}>
            ▶ PLAY
          </button>
        ) : (
          <button className="btn btn--amber btn--sm flex-1" onClick={pauseScenario}>
            ⏸ PAUSE
          </button>
        )}
        <button className="btn btn--secondary btn--sm flex-1" onClick={stepNextEvent}>
          ⏭ NEXT EVENT
        </button>
      </div>

      {/* Speed Controls: Section 30 & 57 */}
      <div className="flex gap-1 mb-3">
        {speeds.map(s => (
          <button
            key={s}
            className={`btn btn--sm flex-1 ${simulation.speed === s ? 'btn--amber' : 'btn--ghost'}`}
            onClick={() => dispatch({ type: 'SET_SPEED', speed: s })}
            aria-pressed={simulation.speed === s}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Failure States: Section 35 */}
      <p className="text-xs text-muted mb-1 font-semibold">Simulate Failure States</p>
      <div className="flex flex-col gap-1 mb-3">
        <button className="btn btn--ghost btn--sm text-left" onClick={() => simulateFailure('PUMP_OFFLINE')}>
          ⚡ Pump Offline (Action Blocked)
        </button>
        <button className="btn btn--ghost btn--sm text-left" onClick={() => simulateFailure('SENSOR_STALE')}>
          📡 Sensor Stale (Confidence Low)
        </button>
        <button className="btn btn--ghost btn--sm text-left" onClick={() => simulateFailure('WEATHER_STALE')}>
          🌦 Weather Stale
        </button>
        <button className="btn btn--ghost btn--sm text-left" onClick={() => simulateFailure('MARKET_STALE')}>
          🏪 Market Stale
        </button>
        <button className="btn btn--ghost btn--sm text-left" onClick={() => simulateFailure('TRANSPORT_UNAVAILABLE')}>
          🚚 Transport Unavailable
        </button>
      </div>

      {/* Low-Internet / Offline Mode: Section 47 */}
      <p className="text-xs text-muted mb-1 font-semibold">Connectivity</p>
      <button
        className={`btn btn--sm btn--full mb-3 ${isOffline ? 'btn--amber' : 'btn--ghost'}`}
        onClick={toggleOffline}
      >
        {isOffline ? '📶 Offline Mode: ON (Queued)' : '📶 Simulate Low Internet / Offline'}
      </button>

      <button className="btn btn--danger btn--sm btn--full" onClick={resetScenario}>
        ↺ Reset Simulation
      </button>
    </div>
  );
}
