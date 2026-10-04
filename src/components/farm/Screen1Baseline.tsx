// =============================================================================
// SCREEN 1 — CURRENT FARM STATE & AI DIAGNOSIS
// Ramesh Patil's un-optimized farm state → Cool AI Analysis Animation →
// Clean, Breathable Recommendations with Direct Marketplace Links →
// Live Evolving Before/After Transformation Scorecard
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../app/AppContext';
import {
  CALCULATED_BASELINE, ETc_CALC, ETo,
  TOMATO_KC, SURFACE_EFFICIENCY, DRIP_EFFICIENCY,
  calcHarvestEconomics, formatINR
} from '../../engine/calculation';
import { calculateSolarPumpSubsidy } from '../../engine/schemesEngine';
import { ProvenanceBadge, SectionHeader } from '../shared';
import { scrollToTarget } from '../../utils/scroll';
import { TRANSLATIONS } from '../../i18n/translations';

const SCAN_STEPS = [
  { step: 1, text: 'Scanning 3.5 Acres tomato farm in Dindori, Nashik...', badge: 'FARM' },
  { step: 2, text: 'Calculating daily tomato crop water need...', badge: 'WATER' },
  { step: 3, text: 'Measuring diesel pump fuel cost & water waste...', badge: 'DIESEL' },
  { step: 4, text: 'Checking heatwave spoilage risk & mandi prices...', badge: 'MARKET' },
  { step: 5, text: 'Finding top 5 ways to save your money & water...', badge: 'SMART ENGINE' },
];

export function Screen1Baseline() {
  const { state, navigateTo, setCameFromRecommendations, setFarmAnalyzed, setUpgradeStatus, setActiveMarketTab } = useApp();
  const { farmState, farmUpgrades, solarBookings, farmAnalyzed, language } = state;
  const currentLang = language ?? 'hi';

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState(farmAnalyzed ? 5 : 0);
  const [scanProgress, setScanProgress] = useState(farmAnalyzed ? 100 : 0);
  const [showOriginalBaseline, setShowOriginalBaseline] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const activeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Check which upgrades are currently active in state
  const hasSolar = farmUpgrades.sharedSolarDrip || farmState.farm.energy.primarySource === 'SHARED_SOLAR' || solarBookings.length > 0;
  const hasBooking = farmUpgrades.sharedSolarBooking || solarBookings.length > 0;
  const hasSensor = farmUpgrades.inSituSensor || farmState.farm.soil.sensorStatus === 'LIVE';
  const hasCold = farmUpgrades.solarColdStorage;
  const hasSubsidy = farmUpgrades.govSubsidyChecked;

  const activeCount = [hasSolar, hasBooking, hasSensor, hasCold, hasSubsidy].filter(Boolean).length;

  // Dynamic engine calculations — zero hardcoding!
  const harvestRiskSavings = calcHarvestEconomics(1200, 31.25, 40, 72, 32).spoilageLoss;
  const kusumSubsidy = calculateSolarPumpSubsidy(5);
  const grantTotalInr = kusumSubsidy.totalGovtSubsidyInr;
  const grantLakhStr = (grantTotalInr / 100000).toFixed(2);
  const waterSavedLakhs = (CALCULATED_BASELINE.monthlyWaterSavedL / 100000).toFixed(1);
  const waterSavedMillion = (CALCULATED_BASELINE.monthlyWaterSavedL / 1000000).toFixed(2);
  const monthlyCostDiff = CALCULATED_BASELINE.monthlyCostDifference;
  const monthlyDieselTotal = CALCULATED_BASELINE.totalMonthlyDieselCost;
  const monthlyPumpHrs = Math.round(CALCULATED_BASELINE.monthlyPumpHours);

  // Dynamic progressive savings based on active upgrades
  const currentMonthlySavings = (hasSolar || hasBooking ? monthlyCostDiff : 0) + (hasCold ? harvestRiskSavings : 0);
  const currentWaterSavedStr = hasSolar ? `${waterSavedLakhs}L L saved` : 'Solar ready';

  const clearTimers = () => {
    activeTimersRef.current.forEach(clearTimeout);
    activeTimersRef.current = [];
  };

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setScanStep(1);
    setScanProgress(15);
    clearTimers();

    scrollToTarget('ai-scan-section', { block: 'center', delay: 50, highlight: true });

    const t1 = setTimeout(() => {
      setScanStep(2);
      setScanProgress(38);
    }, 600);

    const t2 = setTimeout(() => {
      setScanStep(3);
      setScanProgress(62);
    }, 1200);

    const t3 = setTimeout(() => {
      setScanStep(4);
      setScanProgress(84);
    }, 1800);

    const t4 = setTimeout(() => {
      setScanStep(5);
      setScanProgress(100);
      setIsAnalyzing(false);
      setFarmAnalyzed(true);
      scrollToTarget('recommendations-section', { block: 'start', delay: 250, highlight: true });
    }, 2400);

    activeTimersRef.current = [t1, t2, t3, t4];
  };

  useEffect(() => {
    return clearTimers;
  }, []);

  const handleNavigateToUpgrade = (screenNum: number, upgradeKey?: keyof typeof farmUpgrades, marketTab?: 'SOLAR' | 'SCHEMES' | 'GROUP') => {
    setCameFromRecommendations(true);
    if (upgradeKey) {
      setUpgradeStatus(upgradeKey, true);
    }
    if (marketTab) {
      setActiveMarketTab(marketTab);
    }
    navigateTo(screenNum);
  };

  return (
    <div className="screen-scroll">
      {/* ── Farmer Profile Header ────────────────────────────────────────── */}
      <div
        className="animate-in"
        style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,211,238,0.04) 100%)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: '16px 20px',
          marginBottom: 'var(--sp-4)',
        }}
      >
        <div className="flex items-center gap-3 mb-2.5">
          <div className="farm-avatar" style={{ width: 46, height: 46, fontSize: 16 }}>RP</div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--txt-primary)' }}>
              Ramesh Patil
            </h1>
            <p style={{ fontSize: 11, color: 'var(--txt-secondary)', marginTop: 1 }}>
              Dindori, Nashik · 3.5 Acres Tomato Farm
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <span className={`badge ${farmAnalyzed ? 'badge--live' : 'badge--simulated'} text-xs`}>
              {farmAnalyzed ? TRANSLATIONS.screen1.diagnosed[currentLang] : TRANSLATIONS.screen1.unoptimized[currentLang]}
            </span>
          </div>
        </div>

        {/* 3 Vital Stats */}
        <div
          className="grid grid-cols-3 gap-2 pt-2.5"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {[
            { value: `${CALCULATED_BASELINE.areaAcres} Acres`, label: 'AREA', color: 'var(--clr-farm-green)' },
            { value: 'Tomato', label: 'CROP', color: 'var(--clr-farm-green)' },
            { value: 'Mid-Season', label: 'STAGE', color: 'var(--clr-solar-amber)' },
          ].map(s => (
            <div key={s.label} className="text-center min-w-0">
              <div style={{ fontSize: 'clamp(12px, 3.2vw, 15px)', fontWeight: 800, color: s.color, wordBreak: 'break-word' }}>
                {s.value}
              </div>
              <div className="metric-label text-xs tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATE 1: BEFORE ANALYSIS (Initial Gaps & Call to Action) ────── */}
      {!farmAnalyzed && (
        <div className="animate-in">
          <SectionHeader
            eyebrow="Initial Starting Conditions"
            title="Current Farm State"
            subtitle="How Ramesh operates today — heavy diesel bills, water loss, and manual guesswork."
          />

          <div className="card mb-4" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <p className="card-title text-sm">Starting Practice (Before FarmKind)</p>
              <span className="badge badge--warning text-xs self-start sm:self-auto">High Cost &amp; Waste</span>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { icon: '🌊', title: 'Flood Irrigation', desc: `${waterSavedLakhs} Lakh Liters wasted monthly (${CALCULATED_BASELINE.waterReductionPercent}% efficiency loss)`, tag: 'HIGH WASTE' },
                { icon: '⛽', title: 'Diesel Engine Pump', desc: `${monthlyPumpHrs} hrs/month runtime with smoke, noise, breakdown risk`, tag: 'EXPENSIVE' },
                { icon: '💰', title: 'Monthly Fuel Bill', desc: `${formatINR(monthlyDieselTotal)}/month drained in diesel fuel purchases & repairs`, tag: 'HEAVY DRAIN' },
                { icon: '📡', title: 'Manual Guesswork', desc: 'No soil moisture sensor — guessing water timing', tag: 'ROOT RISK' },
                { icon: '🍅', title: 'Open Shed Storage', desc: `34°C heat causes 32% rot on picked tomatoes (~${formatINR(harvestRiskSavings)} loss)`, tag: 'CROP AT RISK' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="card p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-primary">{item.title}</div>
                      <div className="text-muted text-xs leading-normal">{item.desc}</div>
                    </div>
                  </div>
                  <span className="badge badge--warning text-xs self-start sm:self-center flex-shrink-0">{item.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {!isAnalyzing && (
            <div className="card card--glow-cyan text-center p-5 mb-5 animate-in" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div className="text-3xl mb-2 animate-bounce">⚡</div>
              <h2 className="text-lg font-black text-cyan mb-1">
                {TRANSLATIONS.screen1.heroTitle[currentLang]}
              </h2>
              <p className="text-xs text-secondary mb-4 max-w-sm mx-auto leading-relaxed">
                {TRANSLATIONS.screen1.heroSubtitle[currentLang]}
              </p>
              <button
                id="btn-analyze-current-farm"
                className="btn btn--primary btn--full text-base font-bold py-3 shadow-lg"
                onClick={handleStartAnalysis}
                style={{
                  background: 'linear-gradient(135deg, var(--clr-ai-cyan) 0%, var(--clr-farm-green) 100%)',
                  color: '#000',
                  boxShadow: '0 0 30px rgba(34, 211, 238, 0.4)',
                }}
              >
                {TRANSLATIONS.screen1.btnAnalyze[currentLang]}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Cool Smart Engine Scanning Animation ──────────────────────────── */}
      {isAnalyzing && (
        <div id="ai-scan-section" className="card card--glow-cyan mb-5 p-5 text-center animate-in" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="ai-scan-radar-wrapper">
            <div className="ai-scan-radar">
              <div className="ai-scan-radar-sweep" />
              <div className="text-xs font-black text-cyan font-mono tracking-widest">
                SMART ENGINE SCAN
              </div>
            </div>

            <div className="w-full max-w-xs mb-3">
              <div className="flex justify-between text-xs font-mono text-cyan mb-1">
                <span>ANALYZING FARM...</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
                <div
                  style={{
                    width: `${scanProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--clr-ai-cyan) 0%, var(--clr-farm-green) 100%)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-sm text-left">
              {SCAN_STEPS.map((s) => {
                const isDone = scanStep > s.step;
                const isActive = scanStep === s.step;
                return (
                  <div
                    key={s.step}
                    className="card p-2 flex items-center justify-between text-xs"
                    style={{
                      background: isActive ? 'rgba(34, 211, 238, 0.08)' : 'var(--bg-base)',
                      border: isActive ? '1px solid var(--clr-ai-cyan)' : '1px solid var(--border-subtle)',
                      opacity: scanStep >= s.step ? 1 : 0.35,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs" style={{ color: isDone ? 'var(--clr-farm-green)' : 'var(--clr-ai-cyan)' }}>
                        {isDone ? '✓' : isActive ? '●' : '○'}
                      </span>
                      <span className="text-secondary leading-snug">{s.text}</span>
                    </div>
                    <span className="badge badge--simulated text-xs">{s.badge}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── STATE 2: RECOMMENDATIONS (Clean, Breathable, Essential Info Only) ─ */}
      {farmAnalyzed && (
        <div id="recommendations-section" className="animate-in">
          {/* 1. Concise Farm Diagnosis Summary */}
          <div
            className="card card--glow-amber p-4 mb-4 animate-in"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(10,22,40,0.95) 100%)',
              border: '1.5px solid rgba(239,68,68,0.4)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <h2 className="text-sm font-black text-red">{TRANSLATIONS.screen1.leaksDetected[currentLang]}</h2>
                  <p className="text-xs text-secondary mt-0.5">Heavy diesel costs, water loss, and harvest rot identified</p>
                </div>
              </div>
              <span className="badge badge--critical text-xs">Action Required</span>
            </div>

            {/* Quick 2-metric summary row */}
            <div className="grid-2 gap-2 mt-3 pt-2.5 border-t border-subtle">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <span className="text-xs text-muted block font-semibold">{TRANSLATIONS.screen1.monthlyFuelLeak[currentLang]}</span>
                <span className="text-lg font-black font-mono text-red">{formatINR(monthlyDieselTotal)} / mo</span>
              </div>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <span className="text-xs text-muted block font-semibold">{TRANSLATIONS.screen1.potentialCashKept[currentLang]}</span>
                <span className="text-lg font-black font-mono text-green">+{formatINR(monthlyCostDiff)} / mo</span>
              </div>
            </div>

            {/* Optional Collapsed Original Baseline Toggle */}
            <div className="mt-2 text-right">
              <button
                className="btn btn--ghost btn--xs text-muted"
                onClick={() => setShowOriginalBaseline(v => !v)}
              >
                {showOriginalBaseline ? '▲ Hide original practices' : '▼ Show original farm details'}
              </button>
            </div>

            {showOriginalBaseline && (
              <div className="mt-2 pt-2 border-t border-subtle text-xs text-secondary flex flex-col gap-1">
                <div>• Flood irrigation loses {waterSavedLakhs} Lakh Liters ({CALCULATED_BASELINE.waterReductionPercent}% loss)</div>
                <div>• {monthlyPumpHrs} hrs/mo diesel runtime burns {formatINR(monthlyDieselTotal)}</div>
                <div>• No soil moisture sensor installed</div>
                <div>• 34°C open shed causes {formatINR(harvestRiskSavings)} crop rot</div>
                <div>• Mandi middleman takes 8-10% cut</div>
              </div>
            )}
          </div>

          {/* 2. Top 5 Actionable Prescriptions: Clean, Unified Problem ➔ Fix Cards */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="card-title text-sm font-bold text-green">{TRANSLATIONS.screen1.prescriptionsTitle[currentLang]}</h3>
                <p className="text-xs text-muted">Tap any recommendation to enable it in the marketplace</p>
              </div>
              <span className="badge badge--live text-xs font-mono font-bold">
                {activeCount}/5 Active
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Rec 1: Water Waste -> Drip */}
              <div className={`rec-card-premium ${hasSolar ? 'rec-card-premium--solved' : ''} p-3.5`} style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-primary">1. Save {waterSavedLakhs} Lakh Liters Water</span>
                    {hasSolar && <span className="badge badge--live text-xs">✓ ACTIVATED</span>}
                  </div>
                  <span className="text-base font-black text-green font-mono flex-shrink-0">
                    +{waterSavedLakhs}L L
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 my-2 p-2.5 rounded-lg" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-red font-bold flex-shrink-0">⚠️ Problem:</span>
                    <span className="text-secondary">Flood irrigation leaks {CALCULATED_BASELINE.waterReductionPercent}% water into deep soil runoff.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs pt-1.5 border-t border-subtle">
                    <span className="text-green font-bold flex-shrink-0">💡 FarmKind Smart Engine Fix:</span>
                    <span className="text-primary font-semibold">Shared solar drip waters roots directly with 90% efficiency.</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-subtle">
                  <span className="text-xs text-muted">Solar Micro-Drip</span>
                  <button
                    className={`btn btn--sm font-bold w-full sm:w-auto ${hasSolar ? 'btn--secondary' : 'btn--primary'}`}
                    onClick={() => handleNavigateToUpgrade(3, 'sharedSolarDrip', 'SOLAR')}
                  >
                    {hasSolar ? '✓ View in Marketplace' : 'Buy Shared Solar Drip →'}
                  </button>
                </div>
              </div>

              {/* Rec 2: Diesel Bill -> Shared Solar Slot */}
              <div className={`rec-card-premium ${hasBooking ? 'rec-card-premium--solved' : ''} p-3.5`} style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-primary">2. Save {formatINR(monthlyCostDiff)} / mo Fuel Cost</span>
                    {hasBooking && <span className="badge badge--live text-xs">✓ BOOKED</span>}
                  </div>
                  <span className="text-base font-black text-green font-mono flex-shrink-0">
                    +{formatINR(monthlyCostDiff)} / mo
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 my-2 p-2.5 rounded-lg" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-red font-bold flex-shrink-0">⚠️ Problem:</span>
                    <span className="text-secondary">5 HP diesel pump drains {formatINR(monthlyDieselTotal)}/mo in diesel fuel &amp; repairs.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs pt-1.5 border-t border-subtle">
                    <span className="text-green font-bold flex-shrink-0">💡 FarmKind Smart Engine Fix:</span>
                    <span className="text-primary font-semibold">Rent community 5 HP solar pump @ ₹80/hr (zero fuel cost).</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-subtle">
                  <span className="text-xs text-muted">Pay-per-use, zero loan debt</span>
                  <button
                    className={`btn btn--sm font-bold w-full sm:w-auto ${hasBooking ? 'btn--secondary' : 'btn--primary'}`}
                    onClick={() => handleNavigateToUpgrade(3, 'sharedSolarBooking', 'SOLAR')}
                  >
                    {hasBooking ? '✓ View Booked Slot' : 'Book Solar Slot in Marketplace →'}
                  </button>
                </div>
              </div>

              {/* Rec 3: Guesswork -> Soil Sensor */}
              <div className={`rec-card-premium ${hasSensor ? 'rec-card-premium--solved' : ''} p-3.5`} style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-primary">3. Eliminate Irrigation Guesswork</span>
                    {hasSensor && <span className="badge badge--live text-xs">✓ SENSOR LIVE</span>}
                  </div>
                  <span className="text-base font-black text-cyan font-mono flex-shrink-0">
                    35% Target
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 my-2 p-2.5 rounded-lg" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-red font-bold flex-shrink-0">⚠️ Problem:</span>
                    <span className="text-secondary">No sensor installed — guessing water timing risks root stress.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs pt-1.5 border-t border-subtle">
                    <span className="text-cyan font-bold flex-shrink-0">💡 FarmKind Smart Engine Fix:</span>
                    <span className="text-primary font-semibold">Ground probe automatically shuts pump off at 35% healthy moisture.</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-subtle">
                  <span className="text-xs text-muted">Field Root Probe</span>
                  <button
                    className={`btn btn--sm font-bold w-full sm:w-auto ${hasSensor ? 'btn--secondary' : 'btn--blue'}`}
                    onClick={() => handleNavigateToUpgrade(2, 'inSituSensor')}
                  >
                    {hasSensor ? '✓ View Smart Sensor' : 'Open Smart Soil Sensor →'}
                  </button>
                </div>
              </div>

              {/* Rec 4: Heat Spoilage -> Cold Storage */}
              <div className={`rec-card-premium ${hasCold ? 'rec-card-premium--solved' : ''} p-3.5`} style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-primary">4. Prevent 32% Tomato Rot</span>
                    {hasCold && <span className="badge badge--live text-xs">✓ PROTECTED</span>}
                  </div>
                  <span className="text-base font-black text-amber font-mono flex-shrink-0">
                    +{formatINR(harvestRiskSavings)} Saved
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 my-2 p-2.5 rounded-lg" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-red font-bold flex-shrink-0">⚠️ Problem:</span>
                    <span className="text-secondary">34°C open shed storage causes 32% crop rot before market sale.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs pt-1.5 border-t border-subtle">
                    <span className="text-amber font-bold flex-shrink-0">💡 FarmKind Smart Engine Fix:</span>
                    <span className="text-primary font-semibold">Store in nearby Solar Cold Room for ₹1.5/crate; sell when prices peak.</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-subtle">
                  <span className="text-xs text-muted">Pimpalgaon Hub (4.1 km)</span>
                  <button
                    className={`btn btn--sm font-bold w-full sm:w-auto ${hasCold ? 'btn--secondary' : 'btn--amber'}`}
                    onClick={() => handleNavigateToUpgrade(3, 'solarColdStorage', 'SOLAR')}
                  >
                    {hasCold ? '✓ View Cold Storage' : 'Protect in Solar Cold Room →'}
                  </button>
                </div>
              </div>

              {/* Rec 5: Subsidy -> PM-KUSUM 60% */}
              <div className={`rec-card-premium ${hasSubsidy ? 'rec-card-premium--solved' : ''} p-3.5`} style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-primary">5. Claim 60% Government Grant</span>
                    {hasSubsidy && <span className="badge badge--live text-xs">✓ VERIFIED</span>}
                  </div>
                  <span className="text-base font-black text-green font-mono flex-shrink-0">
                    ₹{grantLakhStr} Lakh Grant
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 my-2 p-2.5 rounded-lg" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-red font-bold flex-shrink-0">⚠️ Problem:</span>
                    <span className="text-secondary">High upfront capital makes purchasing solar pump alone difficult.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs pt-1.5 border-t border-subtle">
                    <span className="text-green font-bold flex-shrink-0">💡 FarmKind Smart Engine Fix:</span>
                    <span className="text-primary font-semibold">Direct 60% PM-KUSUM grant (30% Central + 30% Maharashtra State).</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-subtle">
                  <span className="text-xs text-muted">MahaDBT / MahaUrja</span>
                  <button
                    className={`btn btn--sm font-bold w-full sm:w-auto ${hasSubsidy ? 'btn--secondary' : 'btn--primary'}`}
                    onClick={() => handleNavigateToUpgrade(3, 'govSubsidyChecked', 'SCHEMES')}
                  >
                    {hasSubsidy ? '✓ View Subsidy Quote' : 'Check PM-KUSUM 60% Subsidy →'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Compact Transformation Progress Card */}
          <div className="card card--glow-green p-4 mb-4 animate-in" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="card-title text-green text-sm font-bold">Farm Transformation Progress</h3>
                <p className="text-xs text-muted">Real-time savings as you activate upgrades</p>
              </div>
              <span className="badge badge--live text-xs font-mono font-bold">
                {activeCount === 5 ? '🌟 5/5 Fully Optimized' : `${activeCount} of 5 Upgrades Active`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden my-2" style={{ background: 'var(--bg-raised)' }}>
              <div
                style={{
                  width: `${(activeCount / 5) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--clr-ai-cyan) 0%, var(--clr-farm-green) 100%)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {/* 100% Celebration Banner */}
            {activeCount === 5 && (
              <div
                className="card p-3 my-2 text-center animate-in"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,211,238,0.1) 100%)',
                  border: '1.5px solid var(--clr-farm-green)',
                }}
              >
                <div className="text-sm font-black text-green uppercase tracking-wide">
                  🏆 100% FARM TRANSFORMATION COMPLETE!
                </div>
                <p className="text-xs text-primary mt-1">
                  All 5 leaks plugged: saving {waterSavedMillion}M L water/mo, {formatINR(monthlyCostDiff)}/mo diesel expense, in-situ sensor live, and backed by ₹{grantLakhStr}L PM-KUSUM grant!
                </p>
              </div>
            )}

            {/* Compact Before vs Current Row */}
            <div className="grid-2 gap-2 mt-2 pt-2 border-t border-subtle text-xs">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span className="text-red font-bold block mb-1">🔴 BEFORE FARMKIND</span>
                <div className="text-secondary leading-snug">
                  Flood runoff · {formatINR(monthlyDieselTotal)}/mo diesel · Guesswork · 32% rot
                </div>
              </div>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <span className="text-green font-bold block mb-1">🟢 CURRENT PROGRESS</span>
                <div className="text-primary font-semibold leading-snug">
                  {activeCount === 0
                    ? 'Tap any recommendation above to begin saving'
                    : `+${formatINR(currentMonthlySavings)}/mo kept in pocket · ${currentWaterSavedStr}`}
                </div>
              </div>
            </div>
          </div>

          {/* 4. FAO-56 Technical Calculation Details (Discreet Collapsible) */}
          <div className="text-center mb-3">
            <button
              className="btn btn--ghost btn--xs text-muted"
              onClick={() => setShowProvenance(v => !v)}
              aria-expanded={showProvenance}
            >
              {showProvenance ? '▲ Hide' : '▼'} ℹ️ View Technical Calculation Details (FAO-56 Benchmark)
            </button>
          </div>

          {showProvenance && (
            <div className="provenance-panel mb-4 animate-in">
              <p className="card-title mb-3">Audited Calculation Inputs (FAO-56 Standard)</p>
              {[
                { label: 'Farm area',                  value: `${CALCULATED_BASELINE.areaAcres} acres (${CALCULATED_BASELINE.areaM2.toLocaleString()} m²)`, source: 'REFERENCE' as const },
                { label: 'Reference ETo (Nashik)',      value: `${ETo} mm/day`,                source: 'REFERENCE' as const },
                { label: 'Tomato Kc (mid-season)',      value: String(TOMATO_KC),              source: 'REFERENCE' as const },
                { label: 'ETc (crop water need)',      value: `${ETc_CALC.toFixed(2)} mm/day`,source: 'CALCULATED' as const },
                { label: 'Surface irrigation eff.',     value: `${(SURFACE_EFFICIENCY*100).toFixed(0)}%`, source: 'REFERENCE' as const },
                { label: 'Drip efficiency',             value: `${(DRIP_EFFICIENCY*100).toFixed(0)}%`, source: 'REFERENCE' as const },
                { label: 'Pump flow capacity',          value: `${CALCULATED_BASELINE.pumpFlowLph.toLocaleString()} L/hr`, source: 'REFERENCE' as const },
                { label: 'Monthly pumping hours',       value: `${CALCULATED_BASELINE.monthlyPumpHours} hrs/mo`, source: 'CALCULATED' as const },
                { label: 'Diesel fuel price',           value: `₹${CALCULATED_BASELINE.dieselRetailPricePerL}/L`, source: 'REFERENCE' as const },
                { label: 'Maintenance & oil (assumed)', value: `₹${CALCULATED_BASELINE.monthlyMaintenanceCost}/mo`, source: 'ASSUMED' as const },
                { label: 'Shared solar monthly fee',    value: `₹${CALCULATED_BASELINE.sharedSolarMonthlyCost}/mo`, source: 'ASSUMED' as const },
              ].map(row => (
                <div key={row.label} className="provenance-row">
                  <span className="text-sm text-secondary">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-primary">{row.value}</span>
                    <ProvenanceBadge source={row.source} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. Clean Bottom CTAs */}
          <div className="flex gap-2 pb-4">
            <button
              className="btn btn--secondary flex-1 btn--sm"
              onClick={handleStartAnalysis}
            >
              {TRANSLATIONS.screen1.btnRerun[currentLang]}
            </button>
            <button
              className="btn btn--primary flex-1 btn--sm"
              onClick={() => navigateTo(2)}
            >
              {TRANSLATIONS.screen1.btnOpenCommand[currentLang]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
