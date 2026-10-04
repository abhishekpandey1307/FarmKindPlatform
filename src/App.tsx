// =============================================================================
// FARMKIND — MAIN APP
// Root component assembling all 7 screens with navigation
// =============================================================================

import { Suspense, useEffect } from 'react';
import { AppProvider, useApp } from './app/AppContext';
import { prewarmBackend } from './services/geminiVoiceService';
import { TopNav, BottomNav, VoiceFAB, ScreenBreadcrumb, DemoControls } from './components/shared/Navigation';
import { Screen1Baseline } from './components/farm/Screen1Baseline';
import { Screen2CommandCenter } from './components/intelligence/Screen2CommandCenter';
import { Screen3Resources } from './components/resource-saver/Screen3Resources';
import { Screen4ConnectedFarm } from './components/farm/Screen4ConnectedFarm';
import { Screen5Voice } from './components/voice/Screen5Voice';
import { Screen6Shields } from './components/harvest-protector/Screen6Shields';
import { Screen7Impact } from './components/shared/Screen7Impact';
import { ScreenHowItWorks, QuickStartModal } from './components/shared';
import { LiveInspectorModal } from './components/shared/LiveInspectorModal';
import './styles/global.css';

// ─── SCREEN ROUTER ────────────────────────────────────────────────────────────

function ScreenRouter() {
  const { state } = useApp();
  const { activeScreen } = state;

  return (
    <>
      {activeScreen === 0 && <ScreenHowItWorks />}
      {activeScreen === 1 && <Screen1Baseline />}
      {activeScreen === 2 && <Screen2CommandCenter />}
      {activeScreen === 3 && <Screen3Resources />}
      {activeScreen === 4 && <Screen4ConnectedFarm />}
      {activeScreen === 5 && <Screen5Voice />}
      {activeScreen === 6 && <Screen6Shields />}
      {activeScreen === 7 && <Screen7Impact />}
    </>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────

function OfflineBanner() {
  const { state } = useApp();
  // Show banner if explicitly offline OR if there are pending actions queued
  if (!state.isOffline && state.offlineQueueCount === 0) return null;

  return (
    <div style={{
      background: state.isOffline ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
      borderBottom: state.isOffline ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '12px',
      color: state.isOffline ? 'var(--clr-solar-amber)' : 'var(--clr-ai-cyan)',
      fontWeight: 600,
    }} role="status" aria-live="polite">
      <span>
        {state.isOffline
          ? '📶 Low-Internet Mode: Operating on cached FarmState'
          : '🔄 Cloud Sync: Auto-uploading offline farm records...'}
      </span>
      <span className="badge badge--warning">
        {state.offlineQueueCount} {state.offlineQueueCount === 1 ? 'action queued' : 'actions queued'}
      </span>
    </div>
  );
}

import { MotivationReturnBar } from './components/shared/MotivationReturnBar';
import { CelebrationModal } from './components/shared/CelebrationModal';
import { AnimatedIntro } from './components/shared/AnimatedIntro';

function AppShell() {
  const { showIntro, setShowIntro } = useApp();

  // Pre-warm backend silently on initial app load so Render container wakes up during Intro / Screen 1
  useEffect(() => {
    prewarmBackend();
  }, []);

  return (
    <div className="app-shell">
      {/* Premium Animated Intro: Loads first before feature pages */}
      {showIntro && <AnimatedIntro onComplete={() => setShowIntro(false)} />}

      <TopNav />
      <OfflineBanner />

      <main
        className="screen-content"
        id="main-content"
        role="main"
        aria-live="polite"
        aria-atomic="false"
      >
        <ScreenBreadcrumb />
        <MotivationReturnBar />
        <Suspense fallback={
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <div className="text-sm text-muted">Loading…</div>
          </div>
        }>
          <ScreenRouter />
        </Suspense>
      </main>

      <VoiceFAB />
      <BottomNav />
      <DemoControls />
      <LiveInspectorModal />
      <CelebrationModal />
      <QuickStartModal />
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
