// =============================================================================
// SCREEN 6 — SMART AI POST-HARVEST DECISION ENGINE
// Continuous Animation Flow with Multi-Scenario Selection:
// 1. Initial State: Vehicle In-Route on highway with Produce at Risk
// 2. Select Scenario:
//    - 🍅 1,000 kg Tomatoes: Highway Heatwave (Divert to Solar Cold Room)
//    - 🫑 800 kg Capsicum: Mandi Price Surge (Prioritize High-Demand Mandi)
//    - 🍌 1,000 Bananas: Ethylene Ripening Surge (Fast-Track to Express Hub)
//    - 🧅 1,500 kg Onions: High Humidity Mold Threat (Solar Aerated Storage)
// 3. Click "🛡️ Protect My Produce" initiates CONTINUOUS automated visual flow:
//    - 📡 1. MONITOR: In-Crate Probes Telemetry (Auto-runs)
//    - 🧠 2. UNDERSTAND: Biological Risk & Shelf-Life Calculation (Auto-advances)
//    - 🎯 3. DECIDE: Scenario-Specific Winning Recommendation (Auto-reveals)
//    - ⚡ 4. ACT: 1-Tap Execution & Safe Arrival
// =============================================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../app/AppContext';
import { ProvenanceBadge, SectionHeader } from '../shared';
import { scrollIntoViewIfNotVisible } from '../../utils/scroll';
import {
  executePostHarvestPipeline,
  type HarvestTelemetry,
  type StorageConditionType,
  type TransportStatusType,
} from '../../engine/postHarvestEngine';
import { evaluateClimateDecision } from '../../engine/decision';
import type { FarmState } from '../../domain/types';

// ─── POST-HARVEST FIELD SCENARIOS ───────────────────────────────────────────

interface PostHarvestScenario {
  id: string;
  name: string;
  emoji: string;
  tag: string;
  cropType: string;
  quantityKg: number;
  tempC: number;
  humidity: number;
  location: string;
  timeSinceHarvestHours: number;
  delayHours: number;
  distanceKm: number;
  storageCondition: StorageConditionType;
  transportStatus: TransportStatusType;
  targetMarketName: string;
  driverName: string;
  truckNo: string;
  riskDescription: string;
  startWaypointName: string;
  middleWaypointName: string;
  middleWaypointIcon: string;
  targetWaypointName: string;
  actionButtonText: string;
  divertSuccessTitle: string;
  divertSuccessSubtitle: string;
}

const POST_HARVEST_SCENARIOS: PostHarvestScenario[] = [
  {
    id: 'tomatoes-heatwave',
    name: '1,000 kg Tomatoes',
    emoji: '🍅',
    tag: '🔥 Highway Heatwave',
    cropType: 'Tomatoes',
    quantityKg: 1000,
    tempC: 34.5,
    humidity: 70,
    location: 'Pune-Nashik Highway (KM 38)',
    timeSinceHarvestHours: 5,
    delayHours: 3,
    distanceKm: 80,
    storageCondition: 'OPEN_TRUCK',
    transportStatus: 'DELAYED',
    targetMarketName: 'Market B — Mumbai Vashi APMC',
    driverName: 'Santosh Shinde',
    truckNo: 'MH-15-EG-4421',
    riskDescription: 'Tarmac ambient heat climbing to 34.5°C during a 3-hour traffic delay. Respiration accelerates 2.5x, threatening skin softening and 500 kg spoilage.',
    startWaypointName: 'Farm Gate (0 km)',
    middleWaypointName: 'Cold Hub (8 km)',
    middleWaypointIcon: '❄️',
    targetWaypointName: 'APMC Mandi (80 km)',
    actionButtonText: '1-Tap Execute: Intercept & Divert Truck to Solar Cold Room',
    divertSuccessTitle: 'Truck Safely Diverted to Solar Cold Room Hub!',
    divertSuccessSubtitle: 'Pre-cooling active at 11.2°C • 0 kg Spoilage • Full Profit Realized',
  },
  {
    id: 'capsicum-arbitrage',
    name: '800 kg Capsicum',
    emoji: '🫑',
    tag: '💰 Mandi Price Surge',
    cropType: 'Capsicum',
    quantityKg: 800,
    tempC: 28.5,
    humidity: 74,
    location: 'Chakan Highway Bypass (KM 22)',
    timeSinceHarvestHours: 6,
    delayHours: 1,
    distanceKm: 85,
    storageCondition: 'OPEN_TRUCK',
    transportStatus: 'DELAYED',
    targetMarketName: 'Market B — Distant Mandi (₹22/kg)',
    driverName: 'Balasaheb Kadam',
    truckNo: 'MH-14-BT-9022',
    riskDescription: 'Distant market (85 km) offers only ₹22/kg with low demand, while nearby Pune Gultekdi APMC (25 km) has a supply deficit paying ₹38/kg.',
    startWaypointName: 'Harvest Gate (0 km)',
    middleWaypointName: 'Pune APMC (25 km, ₹38/kg)',
    middleWaypointIcon: '🏪',
    targetWaypointName: 'Distant Mandi (85 km)',
    actionButtonText: '1-Tap Execute: Reroute Truck to High-Demand Pune APMC',
    divertSuccessTitle: 'Truck Successfully Rerouted to Pune APMC!',
    divertSuccessSubtitle: 'Locked in ₹38/kg (+₹12,800 profit) • 60 km transit heat avoided',
  },
  {
    id: 'bananas-ethylene',
    name: '1,000 Bananas',
    emoji: '🍌',
    tag: '⚡ Ethylene Ripening',
    cropType: 'Bananas',
    quantityKg: 850,
    tempC: 35.8,
    humidity: 76,
    location: 'NH53 Highway Corridor (KM 52)',
    timeSinceHarvestHours: 36,
    delayHours: 4,
    distanceKm: 95,
    storageCondition: 'OPEN_TRUCK',
    transportStatus: 'DELAYED',
    targetMarketName: 'Distant Wholesale APMC',
    driverName: 'Rameshwar Pawar',
    truckNo: 'MH-19-BQ-8812',
    riskDescription: 'Harvested 36 hours ago in 35.8°C heat, triggering an autocatalytic ethylene surge. Bananas will overripen into mush within 12h if not cleared.',
    startWaypointName: 'Banana Farm (0 km)',
    middleWaypointName: 'Express Agro Hub (12 km)',
    middleWaypointIcon: '🏭',
    targetWaypointName: 'Distant APMC (95 km)',
    actionButtonText: '1-Tap Execute: Fast-Track to Express Agro Processing Hub',
    divertSuccessTitle: 'Bananas Fast-Tracked to Express Agro Hub!',
    divertSuccessSubtitle: '100% batch liquidated before softening • ₹14,400 Loss Avoided',
  },
  {
    id: 'onions-humidity',
    name: '1,500 kg Onions',
    emoji: '🧅',
    tag: '💧 High Humidity Mold',
    cropType: 'Onions',
    quantityKg: 1500,
    tempC: 31.0,
    humidity: 78,
    location: 'Lasalgaon Rural Shed (KM 5)',
    timeSinceHarvestHours: 48,
    delayHours: 0,
    distanceKm: 45,
    storageCondition: 'AMBIENT_SHED',
    transportStatus: 'STATIONARY',
    targetMarketName: 'Lasalgaon APMC Yard',
    driverName: 'Kailash Dhumal',
    truckNo: 'MH-15-FK-3310',
    riskDescription: 'Post-monsoon ambient humidity (78% RH) inside open shed induces black mold spores and premature sprouting (>35% batch rejection).',
    startWaypointName: 'Damp Shed (0 km)',
    middleWaypointName: 'Solar Aerated Storage (5 km)',
    middleWaypointIcon: '💨',
    targetWaypointName: 'APMC Yard (45 km)',
    actionButtonText: '1-Tap Execute: Transfer Batch to Solar Aerated Onion Storage',
    divertSuccessTitle: 'Onions Transferred to Solar Aerated Storage!',
    divertSuccessSubtitle: 'Solar forced-air ventilation active • RH dropped to 65% • Zero Mold',
  },
];

type ContinuousFlowState =
  | 'IDLE' // Waiting for user to click "Protect My Produce"
  | 'READING_SENSORS' // Step 1: Ingesting sensor probes & live telemetry
  | 'AI_ANALYZING' // Step 2: AI Neural scan, Q10 respiration curve & ticking shelf life
  | 'RECOMMENDATION_REVEALED' // Step 3: Winning recommendation card with 1-tap execute
  | 'DIVERTED_SAFE'; // Step 4: Vehicle docked / batch safe, produce 100% saved!

function PostHarvestDecisionSystem() {
  const { setUpgradeStatus, triggerCelebration, returnToFarmState } = useApp();

  const [selectedPresetId, setSelectedPresetId] = useState<string>('tomatoes-heatwave');
  const [flowState, setFlowState] = useState<ContinuousFlowState>('IDLE');
  const [truckProgressPct, setTruckProgressPct] = useState<number>(25);
  const [simulatedTemp, setSimulatedTemp] = useState<number>(34.5);
  const [shelfLifeCountdown, setShelfLifeCountdown] = useState<number>(72);
  const [expandedDetails, setExpandedDetails] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepContainerRef = useRef<HTMLDivElement>(null);

  const activePreset = POST_HARVEST_SCENARIOS.find(p => p.id === selectedPresetId) || POST_HARVEST_SCENARIOS[0];
  const isDiverted = flowState === 'DIVERTED_SAFE';

  // Pipeline computation
  const pipeline = useMemo(() => {
    const isControlled = isDiverted && activePreset.id === 'tomatoes-heatwave';
    const input: Partial<HarvestTelemetry> = {
      cropType: activePreset.cropType,
      quantityKg: activePreset.quantityKg,
      temperatureC: isControlled ? 11.2 : simulatedTemp,
      humidityPercent: isDiverted && activePreset.id === 'onions-humidity' ? 65 : activePreset.humidity,
      location: isDiverted ? activePreset.middleWaypointName : activePreset.location,
      timeSinceHarvestHours: activePreset.timeSinceHarvestHours,
      storageCondition: isControlled
        ? 'CONTROLLED_STORAGE'
        : (activePreset.storageCondition as StorageConditionType),
      transportStatus: isDiverted ? 'ON_TIME' : activePreset.transportStatus,
      delayHours: isDiverted ? 0 : activePreset.delayHours,
      distanceToTargetKm: isDiverted ? 0 : activePreset.distanceKm,
      targetMarketName: activePreset.targetMarketName,
    };
    return executePostHarvestPipeline(input);
  }, [activePreset, simulatedTemp, isDiverted]);

  const { telemetry, understand, decision, act } = pipeline;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // When switching scenario, reset to IDLE and load scenario parameters
  const handlePresetChange = (presetId: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setSelectedPresetId(presetId);
    const chosen = POST_HARVEST_SCENARIOS.find(p => p.id === presetId) || POST_HARVEST_SCENARIOS[0];
    setFlowState('IDLE');
    setTruckProgressPct(25);
    setSimulatedTemp(chosen.tempC);
    setShelfLifeCountdown(chosen.timeSinceHarvestHours > 20 ? 36 : 72);
  };

  // ─── CONTINUOUS ANIMATION FLOW ─────────────────────────────────────────────
  // Initiated after a single click on "Protect My Produce"
  const startContinuousProtectionFlow = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // 1. Move to Step 1: READING_SENSORS
    setFlowState('READING_SENSORS');
    setTruckProgressPct(38);
    setSimulatedTemp(activePreset.tempC);
    const initialCountdown = activePreset.timeSinceHarvestHours > 20 ? 36 : 72;
    setShelfLifeCountdown(initialCountdown);

    // Auto-advance to Step 2: AI_ANALYZING after 2.2 seconds
    stepTimerRef.current = setTimeout(() => {
      setFlowState('AI_ANALYZING');
      setTruckProgressPct(45);

      // Smoothly animate ticking shelf-life countdown clock
      let currentVal = initialCountdown;
      const targetVal = Math.max(12, understand.safeShelfLifeRemainingHours);
      intervalRef.current = setInterval(() => {
        currentVal -= 10;
        if (currentVal <= targetVal) {
          currentVal = targetVal;
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
        setShelfLifeCountdown(currentVal);
      }, 350);

      // Auto-advance to Step 3: RECOMMENDATION_REVEALED after 2.4 seconds
      timerRef.current = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setShelfLifeCountdown(Math.max(12, understand.safeShelfLifeRemainingHours));
        setFlowState('RECOMMENDATION_REVEALED');
        setTruckProgressPct(48);
      }, 2400);
    }, 2200);
  };

  // 1-Tap Execution of the Decision
  const handleExecuteDivert = () => {
    setFlowState('DIVERTED_SAFE');
    setTruckProgressPct(50); // Docked at middle waypoint!
    setSimulatedTemp(activePreset.id === 'tomatoes-heatwave' ? 11.2 : activePreset.tempC - 8);
    setUpgradeStatus('solarColdStorage', true);
    triggerCelebration(
      activePreset.divertSuccessTitle,
      `Vehicle ${activePreset.truckNo} (${activePreset.driverName}) executed FarmKind Smart Engine directive.`,
      activePreset.divertSuccessSubtitle
    );
  };

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setFlowState('IDLE');
    setTruckProgressPct(25);
    setSimulatedTemp(activePreset.tempC);
    setShelfLifeCountdown(activePreset.timeSinceHarvestHours > 20 ? 36 : 72);
  };

  const isStep1Done = flowState === 'AI_ANALYZING' || flowState === 'RECOMMENDATION_REVEALED' || flowState === 'DIVERTED_SAFE';
  const isStep2Done = flowState === 'RECOMMENDATION_REVEALED' || flowState === 'DIVERTED_SAFE';
  const isStep3Done = flowState === 'DIVERTED_SAFE';

  // ─── AUTO-SCROLL TO ACTIVE/LIVE CARD IF NOT PRESENT IN VIEW ───────────────
  useEffect(() => {
    if (flowState === 'READING_SENSORS') {
      scrollIntoViewIfNotVisible('post-harvest-step-1', {
        block: 'center',
        delay: 100,
        highlight: true,
        minVisibleRatio: 0.6,
      });
    } else if (flowState === 'AI_ANALYZING') {
      scrollIntoViewIfNotVisible('post-harvest-step-2', {
        block: 'center',
        delay: 100,
        highlight: true,
        minVisibleRatio: 0.6,
      });
    } else if (flowState === 'RECOMMENDATION_REVEALED') {
      scrollIntoViewIfNotVisible('post-harvest-step-3', {
        block: 'center',
        delay: 100,
        highlight: true,
        minVisibleRatio: 0.55,
      });
    } else if (flowState === 'DIVERTED_SAFE') {
      scrollIntoViewIfNotVisible('post-harvest-step-4', {
        block: 'center',
        delay: 100,
        highlight: true,
        minVisibleRatio: 0.6,
      });
    } else if (flowState === 'IDLE') {
      scrollIntoViewIfNotVisible('post-harvest-initial-card', {
        block: 'center',
        delay: 100,
        highlight: false,
        minVisibleRatio: 0.7,
      });
    }
  }, [flowState]);

  return (
    <div className="animate-in" ref={stepContainerRef}>
      {/* ─── HERO HEADER & MULTI-SCENARIO SELECTOR ──────────────────────────── */}
      <div className="card card--glow-amber mb-3 p-3.5" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍅</span>
            <div>
              <span className="text-xs font-bold text-amber uppercase tracking-wider block">
                Autonomous Post-Harvest Smart Engine
              </span>
              <h2 className="text-sm font-black text-primary">
                FarmKind Smart Engine Post-Harvest Decision System
              </h2>
            </div>
          </div>
          <ProvenanceBadge source="AI_DERIVED" label="Autonomous Decision Engine" />
        </div>

        <p className="text-xs text-secondary leading-relaxed mb-2.5">
          Continuously monitors produce condition, evaluates physiological degradation, and calculates the Next Best Action to eliminate waste and maximize farmer profit.
        </p>

        {/* 4 Distinct Real-World Scenarios */}
        <div className="pt-2.5 border-t border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xxs font-bold text-amber uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> SELECT LIVE FIELD SCENARIO (विभिन्न परिस्थितियां):
            </span>
            <span className="text-xxs text-secondary">
              Switch real-time conditions
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {POST_HARVEST_SCENARIOS.map(s => {
              const isSelected = selectedPresetId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`scenario-card-btn p-2.5 rounded-xl text-left transition-all ${
                    isSelected ? 'scenario-card-btn--active' : 'scenario-card-btn--inactive'
                  }`}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(10, 22, 40, 0.95) 100%)'
                      : 'rgba(10, 22, 40, 0.85)',
                    border: isSelected
                      ? '1.5px solid var(--clr-solar-amber, #f59e0b)'
                      : '1px solid rgba(56, 189, 248, 0.2)',
                    boxShadow: isSelected
                      ? '0 0 16px rgba(245, 158, 11, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                      : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => handlePresetChange(s.id)}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-lg leading-none filter drop-shadow">{s.emoji}</span>
                    <span
                      className="text-xs font-bold truncate leading-tight"
                      style={{ color: '#ffffff' }}
                    >
                      {s.name}
                    </span>
                  </div>
                  <span
                    className="badge text-xxs font-semibold uppercase tracking-wider block truncate"
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '5px',
                      background: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(17, 31, 58, 0.9)',
                      color: isSelected ? '#fde68a' : '#7dd3fc',
                      border: isSelected ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(56, 189, 248, 0.12)',
                    }}
                  >
                    {s.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── LIVE VEHICLE ON HIGHWAY ROAD TRACK ─────────────────────────────── */}
      <div className="live-transit-console mb-3 p-3.5 flex flex-col justify-between">
        {/* Top Fleet Telemetry Header */}
        <div className="flex items-center justify-between text-xs text-muted mb-1 px-1 flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span className="badge badge--live text-xxs font-mono" style={{ padding: '2px 6px' }}>
              ● LIVE GPS
            </span>
            <span className="text-primary font-bold">{activePreset.truckNo}</span>
            <span className="text-secondary text-xxs">({activePreset.driverName})</span>
          </div>
          <div className="flex items-center gap-3 text-xxs">
            <span>Speed: <strong className="text-primary">{isDiverted ? '0 km/h (Docked)' : '52 km/h'}</strong></span>
            <span>Cargo: <strong className="text-amber">{activePreset.quantityKg} kg {activePreset.cropType}</strong></span>
          </div>
        </div>

        {/* Highway Road Track with Dedicated Waypoints and Smooth Vehicle Marker */}
        <div className="highway-track-wrapper my-2">
          {/* Asphalt Base Road */}
          <div className="highway-asphalt" />

          {/* Animated Center Dashed Divider Line */}
          <div className={`highway-lane-divider ${isDiverted ? '' : 'highway-lane-divider--active'}`} />

          {/* Waypoint 1: Farm Gate (Left 8%) */}
          <div className="highway-waypoint-pin" style={{ left: '8%' }}>
            <div className="highway-waypoint-dot">🏡</div>
            <span className="highway-waypoint-label">{activePreset.startWaypointName}</span>
          </div>

          {/* Waypoint 2: Middle Recommended Waypoint (Middle 50%) */}
          <div className="highway-waypoint-pin" style={{ left: '50%' }}>
            <div className={`highway-waypoint-dot ${isDiverted ? 'highway-waypoint-dot--docked' : 'highway-waypoint-dot--hub'}`}>
              {activePreset.middleWaypointIcon}
            </div>
            <span className={`highway-waypoint-label ${isDiverted ? 'text-green font-bold' : 'text-cyan font-bold'}`}>
              {activePreset.middleWaypointName}
            </span>
          </div>

          {/* Waypoint 3: Target Mandi (Right 92%) */}
          <div className="highway-waypoint-pin" style={{ left: '92%' }}>
            <div className="highway-waypoint-dot">🏪</div>
            <span className="highway-waypoint-label">{activePreset.targetWaypointName}</span>
          </div>

          {/* Gliding Vehicle Marker */}
          <div
            className="truck-fleet-marker"
            style={{
              left: `${isDiverted ? 50 : truckProgressPct}%`,
            }}
          >
            <div className={`truck-fleet-badge ${isDiverted ? 'truck-fleet-badge--docked' : ''}`}>
              <span>{isDiverted ? '🚛' : '🚚'}</span>
              <span className="text-xxs font-bold text-primary" style={{ fontSize: 10 }}>
                {isDiverted ? 'Docked' : 'In-Transit'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Route Status Bar */}
        <div className="flex items-center justify-between text-xxs text-secondary px-1 pt-2.5 border-t border-subtle mt-2 flex-wrap gap-1">
          <span>📍 <strong>Location:</strong> {telemetry.location}</span>
          <span style={{ color: isDiverted ? 'var(--clr-farm-green)' : 'var(--clr-solar-gold)' }} className="font-semibold">
            {isDiverted
              ? `● Safely arrived at ${activePreset.middleWaypointName}`
              : `● In-transit toward ${activePreset.targetMarketName} (${activePreset.distanceKm} km)`}
          </span>
        </div>
      </div>

      {/* ─── 4-STAGE PIPELINE STEPPER ───────────────────────────────────────── */}
      <div className="pipeline-stepper-container mb-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          {/* Step 1 Pill */}
          <div
            className={`pipeline-step-pill ${
              flowState === 'READING_SENSORS'
                ? 'pipeline-step-pill--active'
                : isStep1Done
                ? 'pipeline-step-pill--done'
                : ''
            }`}
          >
            <div
              className={`pipeline-step-dot ${
                flowState === 'READING_SENSORS'
                  ? 'pipeline-step-dot--active'
                  : isStep1Done
                  ? 'pipeline-step-dot--done'
                  : ''
              }`}
            >
              {isStep1Done ? '✓' : '1'}
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">1. Monitor</span>
              <span className="text-xxs text-muted" style={{ fontSize: 9 }}>In-Crate Probes</span>
            </div>
          </div>

          {/* Step 2 Pill */}
          <div
            className={`pipeline-step-pill ${
              flowState === 'AI_ANALYZING'
                ? 'pipeline-step-pill--active'
                : isStep2Done
                ? 'pipeline-step-pill--done'
                : ''
            }`}
          >
            <div
              className={`pipeline-step-dot ${
                flowState === 'AI_ANALYZING'
                  ? 'pipeline-step-dot--active'
                  : isStep2Done
                  ? 'pipeline-step-dot--done'
                  : ''
              }`}
            >
              {isStep2Done ? '✓' : '2'}
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">2. Understand</span>
              <span className="text-xxs text-muted" style={{ fontSize: 9 }}>Risk & Shelf Life</span>
            </div>
          </div>

          {/* Step 3 Pill */}
          <div
            className={`pipeline-step-pill ${
              flowState === 'RECOMMENDATION_REVEALED'
                ? 'pipeline-step-pill--active'
                : isStep3Done
                ? 'pipeline-step-pill--done'
                : ''
            }`}
          >
            <div
              className={`pipeline-step-dot ${
                flowState === 'RECOMMENDATION_REVEALED'
                  ? 'pipeline-step-dot--active'
                  : isStep3Done
                  ? 'pipeline-step-dot--done'
                  : ''
              }`}
            >
              {isStep3Done ? '✓' : '3'}
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">3. Decide</span>
              <span className="text-xxs text-muted" style={{ fontSize: 9 }}>Smart Engine Solution</span>
            </div>
          </div>

          {/* Step 4 Pill */}
          <div
            className={`pipeline-step-pill ${
              flowState === 'DIVERTED_SAFE'
                ? 'pipeline-step-pill--done pipeline-step-pill--active'
                : ''
            }`}
          >
            <div
              className={`pipeline-step-dot ${
                flowState === 'DIVERTED_SAFE' ? 'pipeline-step-dot--done' : ''
              }`}
            >
              {flowState === 'DIVERTED_SAFE' ? '✓' : '4'}
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">4. Act</span>
              <span className="text-xxs text-muted" style={{ fontSize: 9 }}>Safe Arrival</span>
            </div>
          </div>
        </div>

        {/* Continuous Flow Progress Bar */}
        <div className="w-full bg-raised h-1 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width:
                flowState === 'IDLE'
                  ? '5%'
                  : flowState === 'READING_SENSORS'
                  ? '30%'
                  : flowState === 'AI_ANALYZING'
                  ? '65%'
                  : flowState === 'RECOMMENDATION_REVEALED'
                  ? '90%'
                  : '100%',
              background:
                flowState === 'DIVERTED_SAFE' || flowState === 'RECOMMENDATION_REVEALED'
                  ? 'var(--clr-farm-green)'
                  : flowState === 'AI_ANALYZING'
                  ? 'var(--clr-risk-red)'
                  : 'var(--clr-solar-gold)',
            }}
          />
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 0. INITIAL STATE: WAITING FOR "PROTECT MY PRODUCE" CLICK             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {flowState === 'IDLE' && (
        <div id="post-harvest-initial-card" className="card p-4 animate-in text-center card--glow-amber mb-3">
          <span className="text-3xl mb-1 block">{activePreset.emoji}</span>
          <h3 className="text-base font-bold text-primary mb-1">
            {activePreset.name} — {activePreset.tag}
          </h3>
          <p className="text-xs text-secondary leading-relaxed max-w-md mx-auto mb-3">
            {activePreset.riskDescription}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs max-w-lg mx-auto mb-4">
            <div className="p-2 rounded bg-surface border border-subtle">
              <span className="text-xxs text-muted block">Cargo</span>
              <strong className="text-primary">{activePreset.quantityKg} kg {activePreset.cropType}</strong>
            </div>
            <div className="p-2 rounded bg-surface border border-subtle">
              <span className="text-xxs text-muted block">Ambient Temp</span>
              <strong className="text-red">{simulatedTemp}°C</strong>
            </div>
            <div className="p-2 rounded bg-surface border border-subtle">
              <span className="text-xxs text-muted block">Delay/Storage</span>
              <strong className="text-orange">+{activePreset.delayHours}h / {activePreset.storageCondition}</strong>
            </div>
            <div className="p-2 rounded bg-surface border border-subtle">
              <span className="text-xxs text-muted block">Remaining</span>
              <strong className="text-primary">{activePreset.distanceKm} km</strong>
            </div>
          </div>

          <button
            id="btn-protect-my-produce"
            className="btn btn--primary font-bold text-sm px-6 py-3 w-full max-w-md mx-auto flex items-center justify-center gap-2 shadow-lg"
            onClick={startContinuousProtectionFlow}
            style={{ fontSize: 15, padding: '14px 24px', borderRadius: 'var(--radius-lg)' }}
          >
            <span>🛡️</span>
            <span>Protect My Produce (मेरी फसल सुरक्षित करें)</span>
            <span>➔</span>
          </button>
          <span className="text-xxs text-muted block mt-2">
            Click once to run autonomous step-by-step Smart Engine monitoring, risk analysis, and solution calculation.
          </span>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* CONTINUOUS STEP-BY-STEP AI PIPELINE                                  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {flowState !== 'IDLE' && (
        <div className="flex flex-col gap-3">

          {/* ─── STAGE 1: 👁️ MONITOR — READING IN-CRATE SENSORS ─────────────── */}
          <div
            id="post-harvest-step-1"
            className={`card p-3 transition-all duration-500 border-l-4 ${
              flowState === 'READING_SENSORS' ? 'card--glow-amber' : ''
            }`}
            style={{
              borderLeftColor: isStep1Done ? 'var(--clr-farm-green)' : 'var(--clr-solar-gold)',
              background: 'var(--bg-card)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{isStep1Done ? '✅' : '📡'}</span>
                <h3 className="text-xs font-bold uppercase tracking-wide text-primary">
                  1. 👁️ Monitor: Live Field & Transit Telemetry
                </h3>
              </div>
              <span className={`badge ${isStep1Done ? 'badge--live' : 'badge--simulated'} text-xxs`}>
                {isStep1Done ? '✓ Verified' : 'Reading Probes...'}
              </span>
            </div>

            {/* In-Crate Sensor Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              <div className="p-2 rounded bg-surface border border-subtle text-center">
                <span className="text-xxs text-muted uppercase block">🌡️ Cargo Temp</span>
                <span className="text-base font-black text-red mt-0.5 block">{simulatedTemp}°C</span>
                <span className="text-xxs text-red font-semibold">{simulatedTemp >= 32 ? 'High Heat' : 'Moderate'}</span>
              </div>

              <div className="p-2 rounded bg-surface border border-subtle text-center">
                <span className="text-xxs text-muted uppercase block">💧 Humidity</span>
                <span className="text-base font-black text-blue mt-0.5 block">{telemetry.humidityPercent}%</span>
                <span className="text-xxs text-muted">Relative RH</span>
              </div>

              <div className="p-2 rounded bg-surface border border-subtle text-center">
                <span className="text-xxs text-muted uppercase block">⏱️ Harvest Age</span>
                <span className="text-base font-black text-amber mt-0.5 block">{telemetry.timeSinceHarvestHours}h</span>
                <span className="text-xxs text-muted">Post-Harvest</span>
              </div>

              <div className="p-2 rounded bg-surface border border-subtle text-center">
                <span className="text-xxs text-muted uppercase block">🚚 Delay</span>
                <span className="text-base font-black text-orange mt-0.5 block">+{telemetry.delayHours}h</span>
                <span className="text-xxs text-muted">{telemetry.storageCondition}</span>
              </div>
            </div>

            <div className="text-xxs text-secondary">
              ⚠️ <strong className="text-primary">Live Diagnosis:</strong> {activePreset.riskDescription}
            </div>
          </div>

          {/* ─── STAGE 2: 🧠 UNDERSTAND — AI RISK & SHELF-LIFE COUNTDOWN ──────── */}
          {(flowState === 'AI_ANALYZING' || flowState === 'RECOMMENDATION_REVEALED' || flowState === 'DIVERTED_SAFE') && (
            <div
              id="post-harvest-step-2"
              className={`card p-3 transition-all duration-500 border-l-4 ${
                flowState === 'AI_ANALYZING' ? 'card--glow-red' : ''
              }`}
              style={{
                borderLeftColor: isStep2Done ? 'var(--clr-farm-green)' : 'var(--clr-risk-red)',
                background: 'var(--bg-card)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{isStep2Done ? '✅' : '🧠'}</span>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-primary">
                    2. 🧠 Understand: Smart Engine Biological Risk Diagnosis
                  </h3>
                </div>
                <span className={`badge ${isStep2Done ? 'badge--live' : 'badge--danger'} text-xxs`}>
                  {isStep2Done ? '✓ Risk Assessed' : '⚠️ Risk Detected'}
                </span>
              </div>

              {/* Punchy Diagnosis */}
              <div className="p-2.5 rounded bg-surface border border-subtle mb-2 text-xs text-primary leading-relaxed">
                {understand.meaningForProduce}
              </div>

              {/* 2 Big Impact Counters */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-surface border border-subtle">
                  <span className="text-muted block text-xxs">Safe Shelf Life Remaining</span>
                  <span className="text-lg font-black text-red mt-0.5 block animate-pulse">
                    ⏳ {shelfLifeCountdown} Hours!
                  </span>
                  <span className="text-xxs text-muted">Ticking down</span>
                </div>
                <div className="p-2 rounded bg-surface border border-subtle">
                  <span className="text-muted block text-xxs">Imminent Spoilage Risk</span>
                  <span className="text-lg font-black text-red mt-0.5 block">
                    📉 ~{decision.projectedOutcome.wastePreventedKg} kg
                  </span>
                  <span className="text-xxs text-muted">Without Smart Engine action</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── STAGE 3: 🎯 DECIDE — WINNING ACTION REVEALED ────────────────── */}
          {(flowState === 'RECOMMENDATION_REVEALED' || flowState === 'DIVERTED_SAFE') && (
            <div
              id="post-harvest-step-3"
              className={`card p-3.5 transition-all duration-500 border-l-4 ${
                flowState === 'RECOMMENDATION_REVEALED' ? 'card--glow-green' : ''
              }`}
              style={{
                borderLeftColor: 'var(--clr-farm-green)',
                background: 'var(--bg-card)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-primary">
                    3. 🎯 Decide: Tailored Spoilage Prevention Solution
                  </h3>
                </div>
                <span className="badge badge--live text-xxs">Winning Action</span>
              </div>

              {/* Action Banner */}
              <div
                className="p-3 rounded-lg border mb-2.5"
                style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  borderColor: 'rgba(34, 197, 94, 0.45)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activePreset.middleWaypointIcon}</span>
                    <div>
                      <span className="text-xxs uppercase tracking-wider text-green font-bold block">
                        Recommended Action ({decision.selectedAction.replace(/_/g, ' ')})
                      </span>
                      <span className="text-sm font-black text-primary">
                        {activePreset.middleWaypointName}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-secondary leading-relaxed mb-2">
                  {decision.explanation}
                </p>

                <div className="p-2 rounded bg-surface border border-subtle text-xs text-primary mb-2">
                  <strong>🇮🇳 किसान सलाह:</strong> {decision.hindiReason}
                </div>

                {/* 3 Clean Impact Chips */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-subtle text-center text-xs mb-3">
                  <div>
                    <span className="text-muted block text-xxs">Waste Prevented</span>
                    <span className="text-sm font-black text-green mt-0.5 block">
                      +{decision.projectedOutcome.wastePreventedKg} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-xxs">Loss Saved</span>
                    <span className="text-sm font-black text-amber mt-0.5 block">
                      ₹{decision.projectedOutcome.financialLossAvoidedInr.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-xxs">Shelf Life Added</span>
                    <span className="text-sm font-black text-cyan mt-0.5 block">
                      +{decision.projectedOutcome.shelfLifeExtendedHours}h
                    </span>
                  </div>
                </div>

                {/* 1-Tap Action Execution Button OR Celebration Victory Card */}
                {flowState === 'RECOMMENDATION_REVEALED' ? (
                  <div>
                    <div className="flex gap-2 mb-2">
                      <button
                        id="btn-execute-cold-storage"
                        className="btn btn--primary flex-1 font-bold flex items-center justify-center gap-2 shadow-lg"
                        style={{ fontSize: 13, padding: '11px 18px', borderRadius: 'var(--radius-md)' }}
                        onClick={handleExecuteDivert}
                      >
                        <span>{activePreset.middleWaypointIcon}</span>
                        <span>{activePreset.actionButtonText}</span>
                        <span>➔</span>
                      </button>

                      <button
                        className="btn btn--ghost text-xs px-3"
                        onClick={handleReset}
                        title="Reset and replay flow"
                      >
                        🔄 Reset
                      </button>
                    </div>

                    {/* Minimal Driver SMS Preview */}
                    <div className="text-xxs font-mono text-muted bg-surface p-2 rounded border border-subtle">
                      📱 <strong>Driver Dispatch:</strong> "{act.smsDispatchPreview}"
                    </div>
                  </div>
                ) : (
                  /* ─── STEP 4: 🏆 VICTORY CELEBRATION CARD — PRODUCE SAVED FROM LOSS ─── */
                  <div
                    id="post-harvest-step-4"
                    className="card card--glow-green p-3.5 border border-green relative overflow-hidden animate-spring text-center mb-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.14) 0%, rgba(10, 22, 40, 0.95) 100%)',
                      boxShadow: '0 0 28px rgba(34, 197, 94, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {/* Embedded Confetti Particle Burst */}
                    <div className="confetti-container" aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                      {Array.from({ length: 22 }).map((_, i) => (
                        <div
                          key={i}
                          className={`confetti-particle confetti-particle--${i % 6}`}
                          style={{
                            left: `${(i * 4.6) % 100}%`,
                            animationDelay: `${(i * 0.07) % 1.2}s`,
                            animationDuration: `${1.6 + ((i * 0.1) % 1.0)}s`,
                            transform: `scale(${0.7 + ((i * 0.05) % 0.5)})`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="relative z-10">
                      {/* Bouncing Celebration Trophy Badge */}
                      <div
                        className="inline-flex items-center justify-center p-2.5 rounded-full mb-2"
                        style={{
                          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.35) 0%, rgba(245, 158, 11, 0.15) 70%, transparent 100%)',
                          border: '2px solid rgba(34, 197, 94, 0.5)',
                          boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)',
                        }}
                      >
                        <span className="text-3xl animate-bounce">🎉</span>
                      </div>

                      <div className="badge badge--live text-xxs font-bold uppercase tracking-wider mb-1 inline-block">
                        🏆 ZERO LOSS HARVEST DEFENDED
                      </div>

                      <h3 className="text-sm font-black text-green tracking-tight mb-1">
                        {activePreset.divertSuccessTitle} (फसल सुरक्षित!)
                      </h3>

                      <p className="text-xs text-secondary max-w-md mx-auto leading-relaxed mb-3">
                        {activePreset.divertSuccessSubtitle}. The autonomous FarmKind Smart Engine decision prevented spoilage and safeguarded farmer profit!
                      </p>

                      {/* Big Victory Scoreboard */}
                      <div
                        className="grid grid-cols-3 gap-2 p-2.5 rounded-xl mb-3 text-center"
                        style={{
                          background: 'rgba(6, 14, 24, 0.85)',
                          border: '1px solid rgba(34, 197, 94, 0.35)',
                        }}
                      >
                        <div>
                          <span className="text-xxs text-muted uppercase font-bold block">🛡️ Produce Saved</span>
                          <span className="text-sm font-black text-green mt-0.5 block">
                            +{decision.projectedOutcome.wastePreventedKg} kg
                          </span>
                          <span className="text-xxs text-secondary">100% Zero Loss</span>
                        </div>
                        <div>
                          <span className="text-xxs text-muted uppercase font-bold block">💰 Income Saved</span>
                          <span className="text-sm font-black text-amber mt-0.5 block">
                            ₹{decision.projectedOutcome.financialLossAvoidedInr.toLocaleString()}
                          </span>
                          <span className="text-xxs text-amber font-semibold">Loss Prevented</span>
                        </div>
                        <div>
                          <span className="text-xxs text-muted uppercase font-bold block">⏱️ Quality Extended</span>
                          <span className="text-sm font-black text-cyan mt-0.5 block">
                            +{decision.projectedOutcome.shelfLifeExtendedHours}h
                          </span>
                          <span className="text-xxs text-cyan">Cold Chain Active</span>
                        </div>
                      </div>

                      {/* Driver SMS Dispatch Confirmation */}
                      <div className="p-2 rounded bg-surface border border-subtle text-xxs font-mono text-muted mb-3 flex items-center justify-center gap-1.5 flex-wrap">
                        <span>📱</span>
                        <span><strong>Driver Dispatch:</strong> "{act.smsDispatchPreview}"</span>
                        <span className="text-green font-bold">✓ Confirmed</span>
                      </div>

                      {/* Action Controls */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          className="btn btn--primary font-bold text-xs px-4 py-2 flex items-center gap-1.5 shadow-md"
                          onClick={handleReset}
                        >
                          <span>🔄</span>
                          <span>Test Another Field Scenario</span>
                        </button>

                        <button
                          className="btn btn--ghost font-bold text-xs px-4 py-2 flex items-center gap-1.5"
                          style={{ border: '1px solid var(--border-medium)' }}
                          onClick={returnToFarmState}
                        >
                          <span>🏡</span>
                          <span>View Farm Dashboard</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toggle Raw Diagnostics */}
          <div className="text-center pt-1">
            <button
              className="btn btn--ghost text-xxs text-muted"
              onClick={() => setExpandedDetails(v => !v)}
            >
              {expandedDetails ? 'Hide Technical Diagnostics ▲' : 'Show Full Technical Diagnostics ▼'}
            </button>
          </div>

          {expandedDetails && (
            <div className="card p-3 bg-surface border-subtle text-xxs font-mono text-secondary animate-in">
              <div className="text-xs font-bold text-primary mb-1">Pipeline Internal Telemetry State:</div>
              <div>• Scenario: {activePreset.tag} | Crop: {telemetry.cropType} ({telemetry.quantityKg} kg)</div>
              <div>• Storage Condition: {telemetry.storageCondition} | Delay: +{telemetry.delayHours}h</div>
              <div>• Respiration Rate Multiplier: {understand.respirationRateMultiplier}x</div>
              <div>• Safe Shelf Life Remaining: {understand.safeShelfLifeRemainingHours}h</div>
              <div>• Selected Decision: {decision.selectedAction}</div>
              <div>• Destination: {decision.targetDestination?.name}</div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── CLIMATE DEFENDER COMPONENT ──────────────────────────────────────────────

interface ClimateScenario {
  id: string;
  emoji: string;
  name: string;
  tag: string;
  tagColor: string;
  description: string;
  /** Human-readable field situation shown in IDLE card */
  situation: string;
  /** The action a farmer should take after AI decides */
  actionTitle: string;
  actionSubtitle: string;
  overrides: {
    temperature?: number;
    rainfall?: number;
    rainProbability?: number;
    humidity?: number;
    heatRisk?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    soilMoisture?: number;
  };
}

const CLIMATE_SCENARIOS: ClimateScenario[] = [
  {
    id: 'heatwave',
    emoji: '🔥',
    name: 'Critical Heatwave',
    tag: '🔥 CRITICAL HEAT',
    tagColor: 'var(--clr-risk-red, #ef4444)',
    description: 'Temperature spikes to 43°C. Crops face severe heat stress & wilting.',
    situation: 'Field temperature has hit 43°C. Tomato plants are wilting. No rain in 5 days. Soil moisture dropping fast. Risk of permanent crop damage within 4 hours.',
    actionTitle: '🛡️ Crop Protected — Cooling Activated',
    actionSubtitle: 'Drip irrigation triggered • Canopy net deployed • 0% crop loss projected',
    overrides: { temperature: 43, rainfall: 0, rainProbability: 5, humidity: 28, heatRisk: 'CRITICAL', soilMoisture: 27 },
  },
  {
    id: 'flash-flood',
    emoji: '🌊',
    name: 'Flash Flood / Storm',
    tag: '🌊 FLASH FLOOD',
    tagColor: '#3b82f6',
    description: '62mm sudden rainfall. Field waterlogged. Root rot & fungal disease threat.',
    situation: '62mm of rain fell in 3 hours. Entire field is waterlogged. Drainage channels blocked. Root asphyxiation and black fungus outbreak imminent.',
    actionTitle: '🛡️ Field Draining — Harvest Secured',
    actionSubtitle: 'Emergency drainage opened • Mature crop harvested • Fungicide applied',
    overrides: { temperature: 26, rainfall: 62, rainProbability: 95, humidity: 97, heatRisk: 'NONE', soilMoisture: 92 },
  },
  {
    id: 'drought',
    emoji: '🏜️',
    name: 'Drought Stress',
    tag: '🏜️ DROUGHT',
    tagColor: '#f97316',
    description: 'Soil moisture at 14%. No rain expected. 38°C heat accelerating water loss.',
    situation: 'Soil moisture critically low at 14%. No rain for 12 days. Probability of rain: 5%. At 38°C, crops will reach permanent wilting point by evening.',
    actionTitle: '🛡️ Deep Irrigation Running — Crop Saved',
    actionSubtitle: 'Drip irrigation at root zone • Solar pump running • Soil moisture rising',
    overrides: { temperature: 38, rainfall: 0, rainProbability: 5, humidity: 22, heatRisk: 'HIGH', soilMoisture: 14 },
  },
  {
    id: 'frost',
    emoji: '❄️',
    name: 'Cold Snap / Frost',
    tag: '❄️ FROST ALERT',
    tagColor: '#38bdf8',
    description: 'Temperature dropped to 6°C overnight. Frost injury to flowering tissue.',
    situation: 'Overnight temperature has dropped to 6°C. Frost forming on leaves. Young shoots and flower buds are at risk of complete freeze damage.',
    actionTitle: '🛡️ Frost Protection Active — Crops Safe',
    actionSubtitle: 'Overhead irrigation triggered (latent heat) • Frost cloth deployed',
    overrides: { temperature: 6, rainfall: 0, rainProbability: 15, humidity: 72, heatRisk: 'NONE', soilMoisture: 38 },
  },
  {
    id: 'pest-heat',
    emoji: '🪲',
    name: 'Pest + Heat Stress',
    tag: '🪲 PEST + HEAT',
    tagColor: '#f59e0b',
    description: '37°C heat + dry soil creates perfect conditions for spider mites & thrips.',
    situation: '37°C temperature with only 24% soil moisture. Conditions are ideal for spider mite and thrips outbreaks. Dual stress will weaken immunity and amplify infestation.',
    actionTitle: '🛡️ Stress Relieved — Pest Threat Contained',
    actionSubtitle: 'Irrigation cooling soil • Pest pressure reduced • Neem spray recommended',
    overrides: { temperature: 37, rainfall: 0, rainProbability: 10, humidity: 41, heatRisk: 'MEDIUM', soilMoisture: 24 },
  },
  {
    id: 'normal',
    emoji: '🌤️',
    name: 'Calm Day (Baseline)',
    tag: '🌤️ SAFE',
    tagColor: 'var(--clr-success, #22c55e)',
    description: 'All parameters normal. 29°C, 38% soil moisture. No threats detected.',
    situation: 'Temperature is 29°C. Soil moisture is healthy at 38%. Light rain expected (30%). All sensors show green. Farm conditions are optimal for growth.',
    actionTitle: '✅ All Clear — Farm is Healthy',
    actionSubtitle: 'No action needed • All systems nominal • Monitoring continues',
    overrides: { temperature: 29, rainfall: 3, rainProbability: 30, humidity: 62, heatRisk: 'LOW', soilMoisture: 38 },
  },
];

const ACTION_LABELS: Record<string, string> = {
  IRRIGATE: '💧 IRRIGATE — Cool Root Zone Now',
  PREPARE_FOR_HEAT: '🔥 PREPARE — Activate Canopy Cooling',
  EMERGENCY_HARVEST: '⚡ EMERGENCY HARVEST — Save Produce Now',
  MONITOR: '👁️ MONITOR — All Systems Normal',
  WAIT: '⏳ WAIT — Hold Current Action',
  STORE: '🏠 STORE — Protect In Storage',
};

const URGENCY_STYLES: Record<string, { border: string; bg: string; badge: string; glow: string }> = {
  CRITICAL: { border: '#ef4444', bg: 'rgba(239,68,68,0.06)', badge: 'risk-badge--high', glow: '0 0 18px rgba(239,68,68,0.25)' },
  HIGH:     { border: '#f97316', bg: 'rgba(249,115,22,0.06)', badge: 'risk-badge--high', glow: '0 0 18px rgba(249,115,22,0.2)' },
  MEDIUM:   { border: '#f59e0b', bg: 'rgba(245,158,11,0.06)', badge: 'risk-badge--medium', glow: '0 0 14px rgba(245,158,11,0.15)' },
  LOW:      { border: '#22c55e', bg: 'rgba(34,197,94,0.06)', badge: 'risk-badge--low', glow: '0 0 12px rgba(34,197,94,0.12)' },
};

type ClimateFlowState =
  | 'IDLE'              // waiting for user to click "Defend My Farm"
  | 'READING_SENSORS'   // Step 1: reading field sensors
  | 'AI_THINKING'       // Step 2: AI analyzing risk patterns
  | 'DECISION_REVEALED' // Step 3: AI decision revealed
  | 'PROTECTED';        // Step 4: Action taken, farm protected

function ClimateDefender({ farmState }: { farmState: FarmState }) {
  const { triggerCelebration } = useApp();
  const [activeId, setActiveId] = useState<string>('heatwave');
  const [flowState, setFlowState] = useState<ClimateFlowState>('IDLE');
  const [scanIndex, setScanIndex] = useState(0); // which sensor reading is being "scanned"
  const [thinkProgress, setThinkProgress] = useState(0); // 0–100 for AI thinking bar

  const timer1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeScenario = CLIMATE_SCENARIOS.find(s => s.id === activeId)!;

  const scenarioState = useMemo((): FarmState => {
    const ov = activeScenario.overrides;
    return {
      ...farmState,
      farm: {
        ...farmState.farm,
        weather: {
          ...farmState.farm.weather,
          temperature: { ...farmState.farm.weather.temperature, value: ov.temperature ?? farmState.farm.weather.temperature.value },
          rainfall: { ...farmState.farm.weather.rainfall, value: ov.rainfall ?? farmState.farm.weather.rainfall.value },
          rainProbability: { ...farmState.farm.weather.rainProbability, value: ov.rainProbability ?? farmState.farm.weather.rainProbability.value },
          humidity: { ...farmState.farm.weather.humidity, value: ov.humidity ?? farmState.farm.weather.humidity.value },
          heatRisk: ov.heatRisk ?? farmState.farm.weather.heatRisk,
        },
        soil: {
          ...farmState.farm.soil,
          moisture: { ...farmState.farm.soil.moisture, value: ov.soilMoisture ?? farmState.farm.soil.moisture.value },
        },
      },
    };
  }, [farmState, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const decision = useMemo(() => evaluateClimateDecision(scenarioState), [scenarioState]);
  const style = URGENCY_STYLES[decision.urgency] ?? URGENCY_STYLES.LOW;

  const ov = activeScenario.overrides;
  const sensorReadings = [
    { label: 'TEMP', value: `${ov.temperature}°C`, icon: '🌡️', danger: (ov.temperature ?? 30) >= 39 || (ov.temperature ?? 30) <= 8 },
    { label: 'RAINFALL', value: `${ov.rainfall}mm`, icon: '🌧️', danger: (ov.rainfall ?? 0) >= 20 },
    { label: 'HUMIDITY', value: `${ov.humidity}%`, icon: '💧', danger: (ov.humidity ?? 60) >= 88 },
    { label: 'SOIL MOISTURE', value: `${ov.soilMoisture}%`, icon: '🌱', danger: (ov.soilMoisture ?? 35) < 20 },
    { label: 'RAIN PROB', value: `${ov.rainProbability}%`, icon: '☁️', danger: false },
    { label: 'HEAT RISK', value: ov.heatRisk ?? 'LOW', icon: '⚠️', danger: ov.heatRisk === 'HIGH' || ov.heatRisk === 'CRITICAL' },
  ];

  const clearAllTimers = () => {
    if (timer1.current) clearTimeout(timer1.current);
    if (timer2.current) clearTimeout(timer2.current);
    if (scanInterval.current) clearInterval(scanInterval.current);
    if (thinkInterval.current) clearInterval(thinkInterval.current);
  };

  useEffect(() => () => clearAllTimers(), []);

  // ─── Reset flow when scenario changes ────────────────────────────────────
  const handleScenarioSelect = (id: string) => {
    if (id === activeId) return;
    clearAllTimers();
    setFlowState('IDLE');
    setScanIndex(0);
    setThinkProgress(0);
    setActiveId(id);
  };

  // ─── Start the 4-stage animation pipeline ────────────────────────────────
  const startDefendFlow = () => {
    clearAllTimers();
    setScanIndex(0);
    setThinkProgress(0);

    // ── STAGE 1: READING_SENSORS — scan each metric one by one
    setFlowState('READING_SENSORS');
    scrollIntoViewIfNotVisible('climate-step-1', { block: 'center', delay: 150, highlight: true, minVisibleRatio: 0.5 });

    let si = 0;
    scanInterval.current = setInterval(() => {
      si++;
      setScanIndex(si);
      if (si >= sensorReadings.length) {
        if (scanInterval.current) clearInterval(scanInterval.current);
      }
    }, 300);

    // ── STAGE 2: AI_THINKING after sensors done (2.2s)
    timer1.current = setTimeout(() => {
      setFlowState('AI_THINKING');
      scrollIntoViewIfNotVisible('climate-step-2', { block: 'center', delay: 100, highlight: true, minVisibleRatio: 0.5 });

      let progress = 0;
      thinkInterval.current = setInterval(() => {
        progress += Math.random() * 12 + 5;
        if (progress >= 100) {
          progress = 100;
          if (thinkInterval.current) clearInterval(thinkInterval.current);
        }
        setThinkProgress(Math.min(100, Math.round(progress)));
      }, 120);

      // ── STAGE 3: DECISION_REVEALED after thinking done (2.5s)
      timer2.current = setTimeout(() => {
        if (thinkInterval.current) clearInterval(thinkInterval.current);
        setThinkProgress(100);
        setFlowState('DECISION_REVEALED');
        scrollIntoViewIfNotVisible('climate-step-3', { block: 'center', delay: 100, highlight: true, minVisibleRatio: 0.5 });
      }, 2500);
    }, 2200);
  };

  // ─── Farmer taps: Apply the AI decision → PROTECTED
  const handleApplyDecision = () => {
    setFlowState('PROTECTED');
    scrollIntoViewIfNotVisible('climate-step-4', { block: 'center', delay: 100, highlight: true, minVisibleRatio: 0.5 });
    triggerCelebration(
      activeScenario.actionTitle,
      `Smart Engine Decision: ${decision.selectedAction} • Confidence: ${decision.confidence}`,
      activeScenario.actionSubtitle
    );
  };

  const handleReset = () => {
    clearAllTimers();
    setFlowState('IDLE');
    setScanIndex(0);
    setThinkProgress(0);
  };

  const isStep1Done = flowState === 'AI_THINKING' || flowState === 'DECISION_REVEALED' || flowState === 'PROTECTED';
  const isStep2Done = flowState === 'DECISION_REVEALED' || flowState === 'PROTECTED';
  const isStep3Done = flowState === 'PROTECTED';

  return (
    <div className="animate-in">

      {/* ── SCENARIO PICKER ── */}
      <div className="card card--glow-amber mb-3 p-3.5" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌤️</span>
            <div>
              <span className="text-xs font-bold text-amber uppercase tracking-wider block">FarmKind Smart Engine Climate Defender</span>
              <h2 className="text-sm font-black text-primary">Smart Climate Risk & Defense System</h2>
            </div>
          </div>
          <ProvenanceBadge source="AI_DERIVED" label="Autonomous Decision Engine" />
        </div>
        <p className="text-xs text-secondary leading-relaxed mb-2.5">
          Reads field sensors in real-time, recognizes climate threat patterns, and decides the exact protective action to save your crop.
        </p>
        <div className="pt-2.5 border-t border-subtle">
          <span className="text-xxs font-bold text-amber uppercase tracking-wider block mb-2">⚡ SELECT FIELD SCENARIO (खेत की स्थिति चुनें):</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CLIMATE_SCENARIOS.map(sc => {
              const isSelected = activeId === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleScenarioSelect(sc.id)}
                  className="p-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected ? 'rgba(245,158,11,0.1)' : 'rgba(10,22,40,0.85)',
                    border: isSelected ? `1.5px solid ${sc.tagColor}` : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isSelected ? `0 0 14px ${sc.tagColor}33` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-lg leading-none">{sc.emoji}</span>
                    <span className="text-xs font-bold text-primary leading-tight truncate">{sc.name}</span>
                  </div>
                  <span
                    className="text-xxs font-bold uppercase tracking-wider block"
                    style={{ fontSize: 9, color: isSelected ? sc.tagColor : '#7dd3fc' }}
                  >
                    {sc.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PIPELINE STEP PILLS ── */}
      <div className="pipeline-stepper-container mb-3">
        <div className="grid grid-cols-4 gap-2 mb-2">
          {[
            { num: 1, label: 'Read', sub: 'Field Sensors', activeState: 'READING_SENSORS', done: isStep1Done },
            { num: 2, label: 'Analyze', sub: 'Risk Patterns', activeState: 'AI_THINKING', done: isStep2Done },
            { num: 3, label: 'Decide', sub: 'Smart Engine Solution', activeState: 'DECISION_REVEALED', done: isStep3Done },
            { num: 4, label: 'Protect', sub: 'Farm Safe', activeState: 'PROTECTED', done: flowState === 'PROTECTED' },
          ].map(({ num, label, sub, activeState, done }) => (
            <div
              key={num}
              className={`pipeline-step-pill ${
                flowState === activeState
                  ? 'pipeline-step-pill--active'
                  : done
                  ? 'pipeline-step-pill--done'
                  : ''
              }`}
            >
              <div
                className={`pipeline-step-dot ${
                  flowState === activeState
                    ? 'pipeline-step-dot--active'
                    : done
                    ? 'pipeline-step-dot--done'
                    : ''
                }`}
              >
                {done ? '✓' : num}
              </div>
              <div className="flex flex-col">
                <span className="leading-tight">{label}</span>
                <span className="text-xxs text-muted" style={{ fontSize: 9 }}>{sub}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-raised h-1 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: flowState === 'IDLE' ? '3%'
                : flowState === 'READING_SENSORS' ? '28%'
                : flowState === 'AI_THINKING' ? '62%'
                : flowState === 'DECISION_REVEALED' ? '88%'
                : '100%',
              background: flowState === 'PROTECTED'
                ? 'var(--clr-farm-green)'
                : flowState === 'AI_THINKING'
                ? 'var(--clr-risk-orange)'
                : 'var(--clr-solar-gold)',
            }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* IDLE — waiting for "Defend My Farm" click                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {flowState === 'IDLE' && (
        <div id="climate-idle-card" className="card p-4 animate-in text-center card--glow-amber mb-3"
          style={{ borderColor: activeScenario.tagColor }}>
          <span className="text-4xl mb-2 block">{activeScenario.emoji}</span>
          <h3 className="text-base font-bold text-primary mb-1">{activeScenario.name}</h3>
          <p className="text-xs text-secondary leading-relaxed max-w-md mx-auto mb-3">
            {activeScenario.situation}
          </p>

          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4">
            {sensorReadings.slice(0, 3).map(({ label, value, icon }) => (
              <div key={label} className="p-2 rounded bg-surface border border-subtle text-center">
                <span className="text-xs block">{icon}</span>
                <strong className="text-xs text-primary block">{value}</strong>
                <span className="text-xxs text-muted">{label}</span>
              </div>
            ))}
          </div>

          <button
            id="btn-defend-my-farm"
            className="btn btn--primary font-bold text-sm w-full max-w-md mx-auto flex items-center justify-center gap-2 shadow-lg"
            style={{ fontSize: 15, padding: '14px 24px', borderRadius: 'var(--radius-lg)' }}
            onClick={startDefendFlow}
          >
            <span>🌤️</span>
            <span>Defend My Farm (खेत की रक्षा करें)</span>
            <span>→</span>
          </button>
          <span className="text-xxs text-muted block mt-2">
            Click once — Smart Engine reads sensors, evaluates risk, and defends your farm step by step.
          </span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ANIMATED PIPELINE                                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {flowState !== 'IDLE' && (
        <div className="flex flex-col gap-3">

          {/* ─── STEP 1: 📡 READING FIELD SENSORS ──────────────────── */}
          <div
            id="climate-step-1"
            className={`card p-3 transition-all duration-500 border-l-4 ${
              flowState === 'READING_SENSORS' ? 'card--glow-amber' : ''
            }`}
            style={{
              borderLeftColor: isStep1Done ? 'var(--clr-farm-green)' : 'var(--clr-solar-gold)',
              background: 'var(--bg-card)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{isStep1Done ? '✅' : '📡'}</span>
                <h3 className="text-xs font-bold uppercase tracking-wide text-primary">
                  1. 📡 Reading — Live Field Sensor Data
                </h3>
              </div>
              <span className={`badge ${isStep1Done ? 'badge--live' : 'badge--simulated'} text-xxs`}>
                {isStep1Done ? '✓ Captured' : 'Scanning...'}
              </span>
            </div>

            {/* Animated sensor row — each metric lights up one by one */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {sensorReadings.map((sr, i) => {
                const isLit = i < scanIndex || isStep1Done;
                return (
                  <div
                    key={sr.label}
                    className="p-2 rounded text-center transition-all duration-300"
                    style={{
                      background: isLit
                        ? sr.danger ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.08)'
                        : 'var(--bg-raised)',
                      border: isLit
                        ? `1px solid ${sr.danger ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.3)'}`
                        : '1px solid rgba(255,255,255,0.05)',
                      opacity: isLit ? 1 : 0.3,
                      transform: isLit ? 'scale(1)' : 'scale(0.94)',
                    }}
                  >
                    <div style={{ fontSize: '0.9rem' }}>{sr.icon}</div>
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isLit && sr.danger ? '#ff6666' : 'var(--text-primary)',
                    }}>
                      {isLit ? sr.value : '—'}
                    </div>
                    <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{sr.label}</div>
                  </div>
                );
              })}
            </div>

            {isStep1Done && (
              <div className="text-xxs text-secondary">
                ⚠️ <strong className="text-primary">Field Situation:</strong> {activeScenario.situation}
              </div>
            )}
          </div>

          {/* ─── STEP 2: 🧠 AI THINKING ─────────────────────────────── */}
          {(flowState === 'AI_THINKING' || isStep2Done) && (
            <div
              id="climate-step-2"
              className={`card p-3 transition-all duration-500 border-l-4 ${
                flowState === 'AI_THINKING' ? 'card--glow-amber' : ''
              }`}
              style={{
                borderLeftColor: isStep2Done ? 'var(--clr-farm-green)' : 'var(--clr-risk-orange)',
                background: 'var(--bg-card)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{isStep2Done ? '✅' : '🧠'}</span>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-primary">
                    2. 🧠 Smart Engine Analyzing — Threat Pattern Recognition
                  </h3>
                </div>
                <span className={`badge ${isStep2Done ? 'badge--live' : 'badge--simulated'} text-xxs`}>
                  {isStep2Done ? `✓ ${decision.confidence} Confidence` : 'Thinking...'}
                </span>
              </div>

              {/* Thinking progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xxs text-muted mb-1">
                  <span>Pattern matching climate signals...</span>
                  <span className="font-bold text-primary">{thinkProgress}%</span>
                </div>
                <div className="w-full bg-raised h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${thinkProgress}%`,
                      background: isStep2Done
                        ? 'linear-gradient(90deg, var(--clr-farm-green), #86efac)'
                        : 'linear-gradient(90deg, var(--clr-risk-orange), var(--clr-amber))',
                    }}
                  />
                </div>
              </div>

              {/* What the AI is "checking" — shows progressively */}
              <div className="flex flex-col gap-1.5">
                {[
                  { pct: 15, text: `🌡️ Temperature threshold check... ${ov.temperature}°C` },
                  { pct: 35, text: `💧 Soil moisture critical level... ${ov.soilMoisture}%` },
                  { pct: 55, text: `🌧️ Rainfall & flood risk... ${ov.rainfall}mm today` },
                  { pct: 72, text: `📊 Cross-matching ${decision.candidateActions.length} possible actions...` },
                  { pct: 88, text: `⚡ Urgency classification: ${decision.urgency}` },
                  { pct: 98, text: `✅ Decision locked: ${decision.selectedAction}` },
                ].map(({ pct, text }) => (
                  <div
                    key={pct}
                    className="text-xxs transition-all duration-400"
                    style={{
                      opacity: thinkProgress >= pct || isStep2Done ? 1 : 0,
                      transform: thinkProgress >= pct || isStep2Done ? 'translateX(0)' : 'translateX(-6px)',
                      color: pct === 98 && (thinkProgress >= 98 || isStep2Done) ? 'var(--clr-farm-green)' : 'var(--text-secondary)',
                      fontWeight: pct === 98 ? 700 : 400,
                    }}
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 3: 🎯 DECISION REVEALED ───────────────────────── */}
          {(flowState === 'DECISION_REVEALED' || isStep3Done) && (
            <div
              id="climate-step-3"
              className="card p-3.5 animate-in border-l-4"
              style={{
                borderLeftColor: isStep3Done ? 'var(--clr-farm-green)' : style.border,
                background: style.bg,
                boxShadow: style.glow,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{isStep3Done ? '✅' : '🎯'}</span>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-primary">
                    3. 🎯 Smart Engine Decision — Recommended Action
                  </h3>
                </div>
                <span className="badge badge--live text-xxs">SMART ENGINE</span>
              </div>

              {/* Big decision label */}
              <div
                className="font-black mb-2"
                style={{ fontSize: '1.05rem', color: style.border, lineHeight: 1.3 }}
              >
                {ACTION_LABELS[decision.selectedAction] ?? decision.selectedAction}
              </div>

              <p className="text-xs text-secondary leading-relaxed mb-2">
                {decision.explanation}
              </p>

              {decision.hindiReason && (
                <p className="text-xs text-amber font-semibold p-2 rounded mb-2"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  🗣️ "{decision.hindiReason}"
                </p>
              )}

              {/* Rejected actions */}
              {decision.rejectedActions.length > 0 && (
                <div className="mb-3">
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
                    WHY NOT OTHER OPTIONS
                  </p>
                  {decision.rejectedActions.map(ra => (
                    <div key={ra.action}
                      className="text-xxs text-muted flex gap-1.5 items-center py-0.5">
                      <span style={{ color: '#f87171', fontWeight: 700 }}>✗ {ra.action}</span>
                      <span>— {ra.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 1-tap apply button */}
              {!isStep3Done && (
                <button
                  id="btn-apply-climate-decision"
                  className="btn btn--primary font-bold w-full flex items-center justify-center gap-2"
                  style={{ fontSize: 14, padding: '12px 20px', borderRadius: 'var(--radius-lg)' }}
                  onClick={handleApplyDecision}
                >
                  <span>🛡️</span>
                  <span>Apply Smart Engine Decision — Protect Farm Now (1-Tap)</span>
                  <span>→</span>
                </button>
              )}
            </div>
          )}

          {/* ─── STEP 4: ✅ FARM PROTECTED ──────────────────────────── */}
          {flowState === 'PROTECTED' && (
            <div
              id="climate-step-4"
              className="card p-4 animate-in text-center border-l-4"
              style={{
                borderLeftColor: 'var(--clr-farm-green)',
                background: 'rgba(34,197,94,0.07)',
                boxShadow: '0 0 20px rgba(34,197,94,0.18)',
              }}
            >
              <div className="text-4xl mb-2">🛡️✅</div>
              <h3 className="text-base font-bold text-green mb-1">{activeScenario.actionTitle}</h3>
              <p className="text-xs text-secondary leading-relaxed mb-3">{activeScenario.actionSubtitle}</p>

              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4 text-center">
                <div className="p-2 rounded bg-surface border border-subtle">
                  <div className="text-base">🧠</div>
                  <div className="text-xs font-bold text-green">Engine Decided</div>
                  <div className="text-xxs text-muted">{decision.selectedAction}</div>
                </div>
                <div className="p-2 rounded bg-surface border border-subtle">
                  <div className="text-base">⚡</div>
                  <div className="text-xs font-bold text-amber">Urgency</div>
                  <div className="text-xxs text-muted">{decision.urgency}</div>
                </div>
                <div className="p-2 rounded bg-surface border border-subtle">
                  <div className="text-base">📊</div>
                  <div className="text-xs font-bold text-primary">Confidence</div>
                  <div className="text-xxs text-muted">{decision.confidence}</div>
                </div>
              </div>

              <button
                className="btn btn--ghost btn--sm font-bold"
                onClick={handleReset}
              >
                ↺ Try Another Scenario
              </button>
            </div>
          )}

          {/* Reset link (shown during pipeline except PROTECTED) */}
          {flowState !== 'PROTECTED' && (
            <button
              className="text-xxs text-muted text-center w-full py-1 hover:text-primary transition-colors"
              onClick={handleReset}
            >
              ↺ Reset & Choose Another Scenario
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN SCREEN 6 CONTAINER ──────────────────────────────────────────────────

export function Screen6Shields() {
  const { state, navigateTo } = useApp();
  const [activeShield, setActiveShield] = useState<'harvest' | 'climate'>('harvest');

  return (
    <div className="screen-scroll">
      <SectionHeader
        eyebrow="Smart Harvest Protection · फसल रक्षा"
        title="Post-Harvest Decision System (Field-to-Market Protection)"
        subtitle="Protects produce along the field-to-market journey. Decides whether to: Store in cold room, Move via transit logistics, Prioritize high-demand market, or Sell sooner before spoilage."
      />

      {/* Cross-shield intelligence banner */}
      <div
        className="card mb-3 p-3"
        style={{ borderColor: 'rgba(34,211,238,0.3)', background: 'rgba(10, 22, 40, 0.8)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="card-title text-cyan text-xs">Unified FarmKind Smart Engine</p>
          <span className="badge badge--live text-xs">CROSS-SHIELD SYNC</span>
        </div>
        <div className="text-xs text-muted leading-relaxed">
          Integrated protection: <span className="text-amber font-bold">Post-Harvest Smart Engine</span> (storage, transit & mandi arbitrage) synced with <span className="text-orange font-bold">Climate Defender</span> (heatwave mitigation).
        </div>
      </div>

      {/* Shield Switcher Tabs */}
      <div className="shield-tabs mb-3 flex gap-2">
        <button
          className={`shield-tab flex-1 btn ${activeShield === 'harvest' ? 'btn--primary font-bold' : 'btn--ghost'}`}
          onClick={() => setActiveShield('harvest')}
          aria-pressed={activeShield === 'harvest'}
        >
          <span>🍅</span>
          <span className="hidden sm:inline"> FarmKind Smart Engine Post-Harvest</span>
          <span className="inline sm:hidden"> Post-Harvest</span>
        </button>
        <button
          className={`shield-tab flex-1 btn ${activeShield === 'climate' ? 'btn--primary font-bold' : 'btn--ghost'}`}
          onClick={() => setActiveShield('climate')}
          aria-pressed={activeShield === 'climate'}
        >
          <span>🌤️</span>
          <span className="hidden sm:inline"> Climate Defender</span>
          <span className="inline sm:hidden"> Climate</span>
        </button>
      </div>

      {/* Active Tab Screen */}
      {activeShield === 'harvest' && <PostHarvestDecisionSystem />}
      {activeShield === 'climate' && <ClimateDefender farmState={state.farmState} />}

      {/* Return to Current Farm State */}
      <div
        className="card p-3 text-center my-4"
        style={{ background: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.25)' }}
      >
        <div className="text-xs text-secondary mb-2">
          Check updated farm savings scorecard, diesel offsets & active upgrades:
        </div>
        <button
          id="btn-return-farm-state-from-6"
          className="btn btn--secondary btn--full btn--sm font-bold"
          onClick={() => navigateTo(1)}
        >
          ← Return to Current Farm State
        </button>
      </div>
    </div>
  );
}
