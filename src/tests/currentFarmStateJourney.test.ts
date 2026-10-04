// =============================================================================
// CURRENT FARM STATE & RECOMMENDATION JOURNEY TESTS
// Tests the full transformation loop: Un-optimized Baseline → AI Diagnostic Scan
// → 5 Red Problems → 5 Recommendations with Marketplace Redirects → Celebration
// Bursts → Sticky Motivational Return Bar → 100% Farm Transformation Scorecard
// =============================================================================

import { describe, it, expect } from 'vitest';
import { appReducer, type AppState, type FarmUpgrades } from '../app/AppContext';
import { createInitialFarmState } from '../engine/simulation';
import { SHARED_SOLAR_CATALOG } from '../engine/solarMarketEngine';
import { calculateSolarPumpSubsidy } from '../engine/schemesEngine';
import {
  COST_DIFFERENCE,
  WATER_SAVED_L,
  DIESEL_MONTHLY_COST,
  SHARED_SOLAR_MONTHLY,
} from '../engine/calculation';

describe('Current Farm State & Recommendations Journey', () => {
  const getInitialState = (): AppState => ({
    farmState: createInitialFarmState(),
    simulation: {
      isRunning: false,
      isPaused: false,
      currentScenario: null,
      speed: 1,
      elapsedMs: 0,
      eventLog: [],
      decisionLog: [],
    },
    intelligenceState: 'IDLE',
    currentDecision: null,
    harvestDecision: null,
    climateDecision: null,
    impact: null,
    activeScreen: 1,
    showProvenancePanel: false,
    showDemoControls: false,
    showLiveInspector: false,
    isConnecting: false,
    connectionStep: 0,
    isOffline: false,
    offlineQueueCount: 0,
    liveSync: {
      isActive: true,
      isLiveMode: true,
      refreshIntervalSec: 30,
      countdownSec: 30,
      lastSyncedTime: null,
      syncCount: 0,
      isSyncing: false,
      lastLatencyMs: 0,
      apiEndpoint: 'https://api.open-meteo.com/v1/forecast (Nashik)',
      error: null,
    },
    liveWeather: null,
    liveMandis: [],
    solarBookings: [],
    directContracts: [],
    farmUpgrades: {
      sharedSolarDrip: false,
      sharedSolarBooking: false,
      inSituSensor: false,
      solarColdStorage: false,
      govSubsidyChecked: false,
    },
    celebration: null,
    cameFromRecommendations: false,
    farmAnalyzed: false,
    activeMarketTab: 'SOLAR',
    language: 'hi',
  });

  it('1. Initializes in un-analyzed state with zero active upgrades', () => {
    const state = getInitialState();
    expect(state.farmAnalyzed).toBe(false);
    expect(state.farmUpgrades.sharedSolarDrip).toBe(false);
    expect(state.farmUpgrades.sharedSolarBooking).toBe(false);
    expect(state.farmUpgrades.inSituSensor).toBe(false);
    expect(state.farmUpgrades.solarColdStorage).toBe(false);
    expect(state.farmUpgrades.govSubsidyChecked).toBe(false);
    expect(state.celebration).toBeNull();
  });

  it('2. Completes AI farm scan and sets farmAnalyzed to true', () => {
    let state = getInitialState();
    state = appReducer(state, { type: 'SET_FARM_ANALYZED', analyzed: true });
    expect(state.farmAnalyzed).toBe(true);
  });

  it('3. Catalog contains dedicated Shared Solar Drip System and 5 HP Solar Pump', () => {
    const dripKit = SHARED_SOLAR_CATALOG.find(a => a.assetId === 'solar-drip-system-01');
    expect(dripKit).toBeDefined();
    expect(dripKit?.title).toContain('Shared Solar Micro-Grid Drip Irrigation System');
    expect(dripKit?.features.some(f => f.includes(`${WATER_SAVED_L.toLocaleString('en-IN')} Liters`))).toBe(true);

    const solarPump = SHARED_SOLAR_CATALOG.find(a => a.assetId === 'solar-pump-hub-01');
    expect(solarPump).toBeDefined();
    expect(solarPump?.title).toContain('5 HP Community Solar Micro-Grid Pump');

    const coldRoom = SHARED_SOLAR_CATALOG.find(a => a.assetId === 'solar-cold-hub-01');
    expect(coldRoom).toBeDefined();
    expect(coldRoom?.title).toContain('Cold Room');
  });

  it('4. Correctly computes audited baseline losses before solution', () => {
    // 5 leaks:
    // 1. Water waste = 1,628,860 L
    expect(WATER_SAVED_L).toBeCloseTo(1628860, -2);

    // 2. Diesel monthly cost = ₹18,416
    expect(Math.round(DIESEL_MONTHLY_COST)).toBe(18416);

    // 3. Shared solar monthly cost = ₹6,000
    expect(SHARED_SOLAR_MONTHLY).toBe(6000);

    // 4. Monthly cost savings = ₹12,416
    expect(Math.round(COST_DIFFERENCE)).toBe(12416);

    // 5. PM-KUSUM 60% subsidy benchmark
    const subsidy = calculateSolarPumpSubsidy(5);
    expect(subsidy.centralSubsidyInr).toBe(84000); // 30%
    expect(subsidy.stateSubsidyInr).toBe(84000);   // 30%
    expect(subsidy.centralSubsidyInr + subsidy.stateSubsidyInr).toBe(168000); // 60% = ₹1,68,000
  });

  it('5. Switches market tab when navigating from recommendations', () => {
    let state = getInitialState();
    state = appReducer(state, { type: 'SET_MARKET_TAB', tab: 'SCHEMES' });
    expect(state.activeMarketTab).toBe('SCHEMES');

    state = appReducer(state, { type: 'SET_MARKET_TAB', tab: 'SOLAR' });
    expect(state.activeMarketTab).toBe('SOLAR');
  });

  it('6. Triggers celebration burst modal upon activating recommendations', () => {
    let state = getInitialState();

    // Trigger celebration for Drip
    state = appReducer(state, {
      type: 'TRIGGER_CELEBRATION',
      celebration: {
        show: true,
        title: 'Shared Solar Drip Activated!',
        message: '90% precision drip irrigation active.',
        metricSaved: 'Saves 1,628,860 L Water · ₹12,416/mo Saved',
      },
    });

    expect(state.celebration).not.toBeNull();
    expect(state.celebration?.show).toBe(true);
    expect(state.celebration?.metricSaved).toContain('1,628,860 L');

    // Dismiss celebration
    state = appReducer(state, { type: 'DISMISS_CELEBRATION' });
    expect(state.celebration).toBeNull();
  });

  it('7. Progresses through all 5 upgrades to unlock 100% transformation', () => {
    let state = getInitialState();
    state = appReducer(state, { type: 'SET_FARM_ANALYZED', analyzed: true });

    // Enable upgrade 1: Shared Solar Drip
    state = appReducer(state, { type: 'SET_UPGRADE_STATUS', key: 'sharedSolarDrip', active: true });
    // Enable upgrade 2: Shared Solar Booking
    state = appReducer(state, { type: 'SET_UPGRADE_STATUS', key: 'sharedSolarBooking', active: true });
    // Enable upgrade 3: In-Situ Soil Sensor
    state = appReducer(state, { type: 'SET_UPGRADE_STATUS', key: 'inSituSensor', active: true });
    // Enable upgrade 4: Solar Cold Storage
    state = appReducer(state, { type: 'SET_UPGRADE_STATUS', key: 'solarColdStorage', active: true });
    // Enable upgrade 5: Government Subsidy Verified
    state = appReducer(state, { type: 'SET_UPGRADE_STATUS', key: 'govSubsidyChecked', active: true });

    const upgrades: FarmUpgrades = state.farmUpgrades;
    const activeCount = Object.values(upgrades).filter(Boolean).length;
    expect(activeCount).toBe(5);
  });

  it('8. Smart Irrigation flow synchronizes moisture to 35%, stops pump, and updates decision state', () => {
    let state = getInitialState();

    // 1. Initial dry state: 26%
    state = appReducer(state, {
      type: 'FARM_EVENT',
      event: {
        eventId: 'evt-dry',
        timestamp: new Date().toISOString(),
        type: 'SENSOR_READING',
        payload: { moisture: 26, temperature: 29 },
        description: 'Dry 26%',
        sourceType: 'SIMULATED',
      },
    });
    expect(state.farmState.farm.soil.moisture.value).toBe(26);

    // 2. Irrigation started
    state = appReducer(state, {
      type: 'FARM_EVENT',
      event: {
        eventId: 'evt-irr-start',
        timestamp: new Date().toISOString(),
        type: 'IRRIGATION_START',
        payload: { pumpStatus: 'ON' },
        description: 'Pump started',
        sourceType: 'SIMULATED',
      },
    });
    expect(state.farmState.farm.irrigation.pumpStatus).toBe('ON');

    // 3. Reaches 35% target and stops
    state = appReducer(state, {
      type: 'FARM_EVENT',
      event: {
        eventId: 'evt-target-35',
        timestamp: new Date().toISOString(),
        type: 'SENSOR_READING',
        payload: { moisture: 35, temperature: 28 },
        description: '35% target reached',
        sourceType: 'SIMULATED',
      },
    });
    state = appReducer(state, {
      type: 'FARM_EVENT',
      event: {
        eventId: 'evt-sensor-live',
        timestamp: new Date().toISOString(),
        type: 'SENSOR_STATUS_CHANGE',
        payload: { status: 'LIVE' },
        description: 'Sensor live at 35%',
        sourceType: 'SIMULATED',
      },
    });
    state = appReducer(state, {
      type: 'FARM_EVENT',
      event: {
        eventId: 'evt-irr-stop',
        timestamp: new Date().toISOString(),
        type: 'IRRIGATION_STOP',
        payload: { pumpStatus: 'OFF' },
        description: 'Pump auto-stopped at 35%',
        sourceType: 'SIMULATED',
      },
    });

    // 4. Upgrades updated
    state = appReducer(state, { type: 'SET_UPGRADE_STATUS', key: 'sharedSolarDrip', active: true });
    state = appReducer(state, { type: 'SET_UPGRADE_STATUS', key: 'inSituSensor', active: true });

    // 5. Decision updated to MONITOR (Complete)
    state = appReducer(state, {
      type: 'DECISION_GENERATED',
      kind: 'irrigation',
      decision: {
        decisionId: 'dec-complete',
        timestamp: new Date().toISOString(),
        farmId: 'farm-001',
        eventType: 'OPTIMUM_REACHED',
        status: 'COMPLETED',
        selectedAction: 'MONITOR',
        confidence: 'HIGH',
        urgency: 'LOW',
        observations: ['Soil moisture: 35%'],
        context: ['Tomato 3.5 acres'],
        candidateActions: ['MONITOR'],
        rejectedActions: [],
        constraints: [],
        expectedImpact: { waterSavedL: 12000, dieselAvoidedL: 45 },
        explanation: '35% target reached. Pump stopped automatically.',
        provenance: 'AI_DERIVED',
        humanFriendlyReason: 'Irrigation complete.',
        hindiReason: 'सिंचाई सफलतापूर्वक पूरी हो गई!',
      },
    });

    expect(state.farmState.farm.soil.moisture.value).toBe(35);
    expect(state.farmState.farm.soil.sensorStatus).toBe('LIVE');
    expect(state.farmState.farm.irrigation.pumpStatus).toBe('OFF');
    expect(state.farmUpgrades.sharedSolarDrip).toBe(true);
    expect(state.farmUpgrades.inSituSensor).toBe(true);
    expect(state.currentDecision?.selectedAction).toBe('MONITOR');
    expect(state.currentDecision?.hindiReason).toContain('सिंचाई सफलतापूर्वक पूरी हो गई');
  });
});

