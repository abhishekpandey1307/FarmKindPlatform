// =============================================================================
// FARMKIND — APPLICATION STATE (React Context + Reducer)
// Central state management — supports Real Agrometeorology (Open-Meteo),
// Live APMC Mandi feeds, Shared Solar Marketplace, and Government Schemes
// =============================================================================

import React, { createContext, useContext, useReducer, useState, useEffect, useCallback, useRef } from 'react';
import type {
  FarmState, FarmEvent, DecisionResult, SimulationState,
  IntelligenceState, ScenarioId, ImpactMetrics, MarketOption,
} from '../domain/types';
import {
  createInitialFarmState,
  applyEventToFarmState,
  simulationEngine,
  buildImpactMetrics,
} from '../engine/simulation';
import {
  evaluateIrrigationDecision,
  evaluateHarvestDecision,
  evaluateClimateDecision,
  evaluateFarmPriority,
} from '../engine/decision';
import {
  WATER_SAVED_L,
  COST_DIFFERENCE,
  calcHarvestEconomics,
} from '../engine/calculation';
import {
  fetchLiveWeather,
  fetchLiveMandiPrices,
  DEFAULT_FARM_LOCATION,
  type LiveWeatherReport,
  type LiveMandiRecord,
  type LiveSyncState,
} from '../engine/liveDataEngine';
import {
  createSolarBooking,
  createDirectSaleContract,
  type SolarBookingOrder,
  type DirectSaleContract,
} from '../engine/solarMarketEngine';
import { createSensorAdapter, type SensorAdapter } from '../engine/sensorAdapter';
import type { SupportedLanguage } from '../i18n/translations';

// ─── STATE ───────────────────────────────────────────────────────────────────

export interface FarmUpgrades {
  sharedSolarDrip: boolean;       // Rec 1
  sharedSolarBooking: boolean;    // Rec 2
  inSituSensor: boolean;          // Rec 3
  solarColdStorage: boolean;      // Rec 4
  govSubsidyChecked: boolean;     // Rec 5
}

export interface CelebrationState {
  show: boolean;
  title: string;
  message: string;
  metricSaved: string;
}

export interface AppState {
  farmState: FarmState;
  simulation: SimulationState;
  intelligenceState: IntelligenceState;
  currentDecision: DecisionResult | null;
  harvestDecision: DecisionResult | null;
  climateDecision: DecisionResult | null;
  impact: ImpactMetrics | null;
  activeScreen: number; // 1-7
  showProvenancePanel: boolean;
  showDemoControls: boolean;
  showLiveInspector: boolean;
  isConnecting: boolean;
  connectionStep: number; // 0-4 for animation
  isOffline: boolean;
  offlineQueueCount: number;

  // Real data & Hybrid Live Engine state
  liveSync: LiveSyncState;
  liveWeather: LiveWeatherReport | null;
  liveMandis: LiveMandiRecord[];
  solarBookings: SolarBookingOrder[];
  directContracts: DirectSaleContract[];

  // Interactive Farm Transformation & Recommendations State
  farmUpgrades: FarmUpgrades;
  celebration: CelebrationState | null;
  cameFromRecommendations: boolean;
  farmAnalyzed: boolean;
  activeMarketTab: 'SOLAR' | 'SCHEMES' | 'GROUP';

  // Multilingual State
  language: SupportedLanguage;
}

// ─── ACTIONS ─────────────────────────────────────────────────────────────────

export type AppAction =
  | { type: 'FARM_EVENT'; event: FarmEvent }
  | { type: 'DECISION_GENERATED'; decision: DecisionResult; kind: 'irrigation' | 'harvest' | 'climate' }
  | { type: 'SET_INTELLIGENCE_STATE'; state: IntelligenceState }
  | { type: 'SET_ACTIVE_SCREEN'; screen: number }
  | { type: 'START_SIMULATION'; scenarioId: ScenarioId }
  | { type: 'PAUSE_SIMULATION' }
  | { type: 'RESUME_SIMULATION' }
  | { type: 'RESET_SIMULATION' }
  | { type: 'STEP_NEXT_EVENT' }
  | { type: 'SET_SPEED'; speed: 1 | 10 | 60 }
  | { type: 'TOGGLE_PROVENANCE' }
  | { type: 'TOGGLE_DEMO_CONTROLS' }
  | { type: 'TOGGLE_LIVE_INSPECTOR' }
  | { type: 'TOGGLE_OFFLINE' }
  | { type: 'SET_LANGUAGE'; language: SupportedLanguage }
  | { type: 'SIMULATE_FAILURE'; failure: 'PUMP_OFFLINE' | 'SENSOR_STALE' | 'WEATHER_STALE' | 'MARKET_STALE' | 'TRANSPORT_UNAVAILABLE' }
  | { type: 'CONNECT_SENSOR' }
  | { type: 'CONNECT_SOLAR' }
  | { type: 'IMPACT_CALCULATED'; impact: ImpactMetrics }
  | { type: 'SET_DECISION_STATUS'; decisionId: string; status: DecisionResult['status'] }
  // Real data & hybrid actions
  | { type: 'LIVE_SYNC_START' }
  | { type: 'LIVE_SYNC_SUCCESS'; weather: LiveWeatherReport; mandis: LiveMandiRecord[] }
  | { type: 'LIVE_SYNC_ERROR'; error: string }
  | { type: 'SET_LIVE_COUNTDOWN'; countdownSec: number }
  | { type: 'TOGGLE_LIVE_MODE'; isLive: boolean }
  | { type: 'SET_SYNC_INTERVAL'; seconds: number }
  | { type: 'SOLAR_SLOT_BOOKED'; booking: SolarBookingOrder }
  | { type: 'DIRECT_CONTRACT_CREATED'; contract: DirectSaleContract }
  // Recommendations & Celebration actions
  | { type: 'TRIGGER_CELEBRATION'; celebration: CelebrationState }
  | { type: 'DISMISS_CELEBRATION' }
  | { type: 'SET_UPGRADE_STATUS'; key: keyof FarmUpgrades; active: boolean }
  | { type: 'SET_CAME_FROM_RECOMMENDATIONS'; value: boolean }
  | { type: 'SET_FARM_ANALYZED'; analyzed: boolean }
  | { type: 'SET_MARKET_TAB'; tab: 'SOLAR' | 'SCHEMES' | 'GROUP' };

// ─── REDUCER ─────────────────────────────────────────────────────────────────

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'FARM_EVENT': {
      const newFarmState = applyEventToFarmState(state.farmState, action.event);
      const newEventLog = [...state.simulation.eventLog, action.event];
      const newDecisionLog = [...state.simulation.decisionLog];

      // After sensor live → run decision
      let intelligenceState = state.intelligenceState;
      if (action.event.type === 'SENSOR_STATUS_CHANGE') {
        const p = action.event.payload as { status: string };
        if (p.status === 'LIVE') intelligenceState = 'SIGNAL';
      }
      if (action.event.type === 'ACTION_VERIFIED') intelligenceState = 'VERIFIED';
      if (action.event.type === 'IMPACT_MEASURED') intelligenceState = 'IMPACT';
      if (action.event.type === 'IRRIGATION_START') intelligenceState = 'EXECUTING';

      // Build impact when measured
      let impact = state.impact;
      if (action.event.type === 'IMPACT_MEASURED') {
        impact = buildImpactMetrics(newEventLog, newDecisionLog);
      }

      return {
        ...state,
        farmState: newFarmState,
        intelligenceState,
        impact,
        simulation: {
          ...state.simulation,
          eventLog: newEventLog,
          decisionLog: newDecisionLog,
          isRunning: true,
        },
      };
    }

    case 'DECISION_GENERATED': {
      const newDecisionLog = [...state.simulation.decisionLog, action.decision];
      return {
        ...state,
        ...(action.kind === 'irrigation' ? { currentDecision: action.decision } : {}),
        ...(action.kind === 'harvest' ? { harvestDecision: action.decision } : {}),
        ...(action.kind === 'climate' ? { climateDecision: action.decision } : {}),
        intelligenceState: 'DECISION',
        simulation: {
          ...state.simulation,
          decisionLog: newDecisionLog,
        },
      };
    }

    case 'SET_INTELLIGENCE_STATE':
      return { ...state, intelligenceState: action.state };

    case 'SET_ACTIVE_SCREEN':
      return { ...state, activeScreen: action.screen };

    case 'START_SIMULATION':
      return {
        ...state,
        liveSync: {
          ...state.liveSync,
          isLiveMode: false, // pause live auto-sync when running deterministic simulation scenario
        },
        simulation: {
          ...state.simulation,
          isRunning: true,
          isPaused: false,
          currentScenario: action.scenarioId,
          eventLog: [],
          decisionLog: [],
          elapsedMs: 0,
        },
        intelligenceState: 'SIGNAL',
      };

    case 'PAUSE_SIMULATION':
      return {
        ...state,
        simulation: { ...state.simulation, isPaused: true },
      };

    case 'RESUME_SIMULATION':
      return {
        ...state,
        simulation: { ...state.simulation, isPaused: false },
      };

    case 'RESET_SIMULATION':
      return {
        ...state,
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
        farmState: createInitialFarmState(),
        currentDecision: null,
        harvestDecision: null,
        climateDecision: null,
        liveSync: {
          ...state.liveSync,
          isLiveMode: true, // re-enable live mode upon reset
        },
      };

    case 'STEP_NEXT_EVENT':
      return state;

    case 'SET_SPEED':
      return {
        ...state,
        simulation: { ...state.simulation, speed: action.speed },
      };

    case 'TOGGLE_PROVENANCE':
      return { ...state, showProvenancePanel: !state.showProvenancePanel };

    case 'TOGGLE_DEMO_CONTROLS':
      return { ...state, showDemoControls: !state.showDemoControls };

    case 'TOGGLE_LIVE_INSPECTOR':
      return { ...state, showLiveInspector: !state.showLiveInspector };

    case 'TOGGLE_OFFLINE': {
      const nextOffline = !state.isOffline;
      return {
        ...state,
        isOffline: nextOffline,
        offlineQueueCount: nextOffline ? state.offlineQueueCount + 1 : 0,
      };
    }

    case 'SIMULATE_FAILURE': {
      let updatedFarm = { ...state.farmState.farm };
      const now = new Date().toISOString();

      switch (action.failure) {
        case 'PUMP_OFFLINE':
          updatedFarm = {
            ...updatedFarm,
            irrigation: {
              ...updatedFarm.irrigation,
              pumpStatus: 'OFFLINE' as const,
              source: 'REAL',
            },
          };
          break;
        case 'SENSOR_STALE':
          updatedFarm = {
            ...updatedFarm,
            soil: {
              ...updatedFarm.soil,
              sensorStatus: 'STALE' as const,
            },
          };
          break;
        case 'WEATHER_STALE':
          updatedFarm = {
            ...updatedFarm,
            weather: {
              ...updatedFarm.weather,
              isStale: true,
              timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
            },
          };
          break;
        case 'MARKET_STALE':
          updatedFarm = {
            ...updatedFarm,
            market: {
              ...updatedFarm.market,
              options: updatedFarm.market.options.map(opt => ({ ...opt, isStale: true })),
            },
          };
          break;
        case 'TRANSPORT_UNAVAILABLE':
          updatedFarm = {
            ...updatedFarm,
            logistics: {
              ...updatedFarm.logistics,
              transportAvailable: false,
              estimatedAvailabilityHours: 5,
              delayReason: 'Vehicle breakdown / highway blockage',
            },
            market: {
              ...updatedFarm.market,
              options: updatedFarm.market.options.map(opt => ({ ...opt, availableTransport: false })),
            },
          };
          break;
      }

      return {
        ...state,
        farmState: {
          ...state.farmState,
          farm: updatedFarm,
          lastUpdated: now,
        },
        intelligenceState: 'SIGNAL',
      };
    }

    case 'CONNECT_SENSOR':
      return {
        ...state,
        isConnecting: true,
        connectionStep: 0,
        farmState: {
          ...state.farmState,
          farm: {
            ...state.farmState.farm,
            soil: {
              ...state.farmState.farm.soil,
              sensorStatus: 'CONNECTING',
            },
          },
        },
      };

    case 'CONNECT_SOLAR':
      return {
        ...state,
        farmState: {
          ...state.farmState,
          farm: {
            ...state.farmState.farm,
            energy: {
              ...state.farmState.farm.energy,
              primarySource: 'SHARED_SOLAR',
              pumpType: 'SOLAR_PUMP',
            },
            connectedSystems: {
              ...state.farmState.farm.connectedSystems,
              solar: true,
            },
          },
        },
      };

    case 'IMPACT_CALCULATED':
      return { ...state, impact: action.impact };

    case 'SET_DECISION_STATUS': {
      const updateDecision = (d: DecisionResult | null) =>
        d?.decisionId === action.decisionId ? { ...d, status: action.status } : d;
      return {
        ...state,
        currentDecision: updateDecision(state.currentDecision) as DecisionResult | null,
        harvestDecision: updateDecision(state.harvestDecision) as DecisionResult | null,
        climateDecision: updateDecision(state.climateDecision) as DecisionResult | null,
        simulation: {
          ...state.simulation,
          decisionLog: state.simulation.decisionLog.map(d =>
            d.decisionId === action.decisionId ? { ...d, status: action.status } : d
          ),
        },
      };
    }

    // ─── REAL DATA & HYBRID CASES ─────────────────────────────────────────────

    case 'LIVE_SYNC_START':
      return {
        ...state,
        liveSync: {
          ...state.liveSync,
          isSyncing: true,
          error: null,
        },
      };

    case 'LIVE_SYNC_SUCCESS': {
      const { weather, mandis } = action;

      // Map live APMC mandis to FarmState MarketOptions
      const updatedMarketOptions: MarketOption[] = mandis.map(m => ({
        marketId: m.mandiId,
        name: m.mandiName,
        distanceKm: m.distanceKm,
        pricePerKg: {
          value: m.modalPricePerKg,
          unit: '₹/kg',
          timestamp: m.lastSyncedAt,
          sourceType: 'REAL',
        },
        demand: m.buyerDemand,
        transportCostPerKg: {
          value: m.transportFreightPerKg,
          unit: '₹/kg',
          timestamp: m.lastSyncedAt,
          sourceType: 'CALCULATED',
        },
        availableTransport: true,
        estimatedTravelHours: Number((m.distanceKm / 35).toFixed(1)),
        isStale: false,
      }));

      // Update FarmState weather with live Open-Meteo values
      const updatedWeather = {
        ...state.farmState.farm.weather,
        temperature: {
          value: weather.temperatureC,
          unit: '°C',
          timestamp: weather.timestamp,
          sourceType: weather.source === 'OPEN_METEO_LIVE' ? ('REAL' as const) : ('CALCULATED' as const),
        },
        humidity: {
          value: weather.relativeHumidity,
          unit: '%',
          timestamp: weather.timestamp,
          sourceType: 'REAL' as const,
        },
        rainfall: {
          value: weather.precipitationMm,
          unit: 'mm',
          timestamp: weather.timestamp,
          sourceType: 'REAL' as const,
        },
        rainProbability: {
          value: weather.rainProbabilityPercent,
          unit: '%',
          timestamp: weather.timestamp,
          sourceType: 'REAL' as const,
        },
        heatRisk: (weather.temperatureC >= 40
          ? 'HIGH'
          : weather.temperatureC >= 36
          ? 'MEDIUM'
          : 'NONE') as 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        timestamp: weather.timestamp,
        source: 'REAL' as const,
        isStale: false,
      };

      // Also update satellite soil moisture if sensor is not connected yet
      let updatedSoil = state.farmState.farm.soil;
      if (state.farmState.farm.soil.sensorStatus === 'NOT_CONNECTED') {
        updatedSoil = {
          ...updatedSoil,
          moisture: {
            value: weather.soilMoistureSatellitePercent,
            unit: '%',
            timestamp: weather.timestamp,
            sourceType: 'AI_DERIVED' as const,
          },
          temperature: {
            value: weather.soilTemperatureC,
            unit: '°C',
            timestamp: weather.timestamp,
            sourceType: 'AI_DERIVED' as const,
          },
        };
      }

      return {
        ...state,
        liveWeather: weather,
        liveMandis: mandis,
        liveSync: {
          ...state.liveSync,
          isSyncing: false,
          syncCount: state.liveSync.syncCount + 1,
          lastSyncedTime: weather.timestamp,
          lastLatencyMs: weather.latencyMs,
          countdownSec: state.liveSync.refreshIntervalSec,
          error: null,
        },
        farmState: {
          ...state.farmState,
          farm: {
            ...state.farmState.farm,
            weather: updatedWeather,
            soil: updatedSoil,
            market: {
              ...state.farmState.farm.market,
              options: updatedMarketOptions,
              lastUpdated: weather.timestamp,
              source: 'REAL',
            },
          },
          lastUpdated: weather.timestamp,
        },
      };
    }

    case 'LIVE_SYNC_ERROR':
      return {
        ...state,
        liveSync: {
          ...state.liveSync,
          isSyncing: false,
          error: action.error,
        },
      };

    case 'SET_LIVE_COUNTDOWN':
      return {
        ...state,
        liveSync: {
          ...state.liveSync,
          countdownSec: action.countdownSec,
        },
      };

    case 'TOGGLE_LIVE_MODE':
      return {
        ...state,
        liveSync: {
          ...state.liveSync,
          isLiveMode: action.isLive,
        },
      };

    case 'SET_SYNC_INTERVAL':
      return {
        ...state,
        liveSync: {
          ...state.liveSync,
          refreshIntervalSec: action.seconds,
          countdownSec: action.seconds,
        },
      };

    case 'SOLAR_SLOT_BOOKED':
      return {
        ...state,
        solarBookings: [action.booking, ...state.solarBookings],
        farmState: {
          ...state.farmState,
          farm: {
            ...state.farmState.farm,
            energy: {
              ...state.farmState.farm.energy,
              primarySource: 'SHARED_SOLAR',
              pumpType: 'SOLAR_PUMP',
            },
            connectedSystems: {
              ...state.farmState.farm.connectedSystems,
              solar: true,
            },
          },
        },
      };

    case 'DIRECT_CONTRACT_CREATED':
      return {
        ...state,
        directContracts: [action.contract, ...state.directContracts],
      };

    case 'TRIGGER_CELEBRATION':
      return {
        ...state,
        celebration: action.celebration,
      };

    case 'DISMISS_CELEBRATION':
      return {
        ...state,
        celebration: null,
      };

    case 'SET_UPGRADE_STATUS':
      return {
        ...state,
        farmUpgrades: {
          ...state.farmUpgrades,
          [action.key]: action.active,
        },
      };

    case 'SET_CAME_FROM_RECOMMENDATIONS':
      return {
        ...state,
        cameFromRecommendations: action.value,
      };

    case 'SET_FARM_ANALYZED':
      return {
        ...state,
        farmAnalyzed: action.analyzed,
      };

    case 'SET_MARKET_TAB':
      return {
        ...state,
        activeMarketTab: action.tab,
      };

    case 'SET_LANGUAGE':
      try {
        localStorage.setItem('farmkind_language', action.language);
      } catch {
        // ignore storage errors
      }
      return {
        ...state,
        language: action.language,
        farmState: {
          ...state.farmState,
          farmer: {
            ...state.farmState.farmer,
            preferredLanguage: (action.language === 'en' || action.language === 'mr') ? action.language : 'hi',
          },
        },
      };

    default:
      return state;
  }
}

// ─── INITIAL STATE ────────────────────────────────────────────────────────────

const initialAppState: AppState = {
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

  // Real data initial state
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

  // Recommendations and Upgrades
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
  language: (typeof window !== 'undefined' && (localStorage.getItem('farmkind_language') as SupportedLanguage)) || 'hi',
};

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  startScenario: (id: ScenarioId) => void;
  pauseScenario: () => void;
  resumeScenario: () => void;
  stepNextEvent: () => void;
  resetScenario: () => void;
  navigateTo: (screen: number) => void;
  connectSensor: (mode?: 'SIMULATED' | 'REAL_HARDWARE') => void;
  connectSolar: () => void;
  evaluateDecisions: () => void;
  approveAction: (decisionId: string) => void;
  getPriorityAction: () => ReturnType<typeof evaluateFarmPriority>;
  simulateFailure: (failure: 'PUMP_OFFLINE' | 'SENSOR_STALE' | 'WEATHER_STALE' | 'MARKET_STALE' | 'TRANSPORT_UNAVAILABLE') => void;
  toggleOffline: () => void;

  // Recommendations & Celebration
  triggerCelebration: (title: string, message: string, metricSaved: string) => void;
  dismissCelebration: () => void;
  setUpgradeStatus: (key: keyof FarmUpgrades, active: boolean) => void;
  setCameFromRecommendations: (value: boolean) => void;
  setFarmAnalyzed: (analyzed: boolean) => void;
  setLanguage: (language: SupportedLanguage) => void;
  returnToFarmState: () => void;
  setActiveMarketTab: (tab: 'SOLAR' | 'SCHEMES' | 'GROUP') => void;

  // Real data & Hybrid operations
  toggleLiveMode: (enable: boolean) => void;
  triggerLiveSync: () => Promise<void>;
  setSyncInterval: (seconds: number) => void;
  toggleLiveInspector: () => void;
  bookSolarSlot: (assetId: string, hours?: number, slotTime?: string) => SolarBookingOrder;
  lockMarketContract: (buyerId: string, quantityKg?: number) => DirectSaleContract;

  // Animated Brand Intro
  showIntro: boolean;
  setShowIntro: (show: boolean) => void;
  replayIntro: () => void;

  // Quick Start / How It Works Guide
  showQuickGuide: boolean;
  setShowQuickGuide: (show: boolean) => void;
  openQuickGuide: () => void;
}

const defaultContextValue: AppContextValue = {
  state: initialAppState,
  dispatch: () => {},
  startScenario: () => {},
  pauseScenario: () => {},
  resumeScenario: () => {},
  stepNextEvent: () => {},
  resetScenario: () => {},
  navigateTo: () => {},
  connectSensor: () => {},
  connectSolar: () => {},
  evaluateDecisions: () => {},
  approveAction: () => {},
  getPriorityAction: () => evaluateFarmPriority(initialAppState.farmState),
  simulateFailure: () => {},
  toggleOffline: () => {},
  toggleLiveMode: () => {},
  triggerLiveSync: async () => {},
  setSyncInterval: () => {},
  toggleLiveInspector: () => {},
  bookSolarSlot: () => createSolarBooking('solar-pump-hub-01', 'FARMER-001', 2),
  lockMarketContract: () => createDirectSaleContract('FARMER-001', 'buyer-sahyadri', 1200),
  triggerCelebration: () => {},
  dismissCelebration: () => {},
  setUpgradeStatus: () => {},
  setCameFromRecommendations: () => {},
  setFarmAnalyzed: () => {},
  setLanguage: () => {},
  returnToFarmState: () => {},
  setActiveMarketTab: () => {},
  showIntro: true,
  setShowIntro: () => {},
  replayIntro: () => {},
  showQuickGuide: false,
  setShowQuickGuide: () => {},
  openQuickGuide: () => {},
};

const AppContext = createContext<AppContextValue>(defaultContextValue);

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [showIntro, setShowIntro] = useState(true);
  const replayIntro = useCallback(() => setShowIntro(true), []);
  const [showQuickGuide, setShowQuickGuide] = useState(() => {
    try {
      return localStorage.getItem('farmkind_seen_welcome_guide') !== 'true';
    } catch {
      return true;
    }
  });
  const openQuickGuide = useCallback(() => setShowQuickGuide(true), []);
  const isSyncingRef = useRef(false);

  const handleEvent = useCallback((event: FarmEvent) => {
    dispatch({ type: 'FARM_EVENT', event });
  }, []);

  const triggerCelebration = useCallback((title: string, message: string, metricSaved: string) => {
    dispatch({
      type: 'TRIGGER_CELEBRATION',
      celebration: { show: true, title, message, metricSaved },
    });
  }, []);

  const dismissCelebration = useCallback(() => {
    dispatch({ type: 'DISMISS_CELEBRATION' });
  }, []);

  const setUpgradeStatus = useCallback((key: keyof FarmUpgrades, active: boolean) => {
    dispatch({ type: 'SET_UPGRADE_STATUS', key, active });
  }, []);

  const setCameFromRecommendations = useCallback((value: boolean) => {
    dispatch({ type: 'SET_CAME_FROM_RECOMMENDATIONS', value });
  }, []);

  const setFarmAnalyzed = useCallback((analyzed: boolean) => {
    dispatch({ type: 'SET_FARM_ANALYZED', analyzed });
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    dispatch({ type: 'SET_LANGUAGE', language: lang });
  }, []);

  const returnToFarmState = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_SCREEN', screen: 1 });
  }, []);

  const setActiveMarketTab = useCallback((tab: 'SOLAR' | 'SCHEMES' | 'GROUP') => {
    dispatch({ type: 'SET_MARKET_TAB', tab });
  }, []);

  const triggerLiveSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    dispatch({ type: 'LIVE_SYNC_START' });

    try {
      // Parallel fetch: Open-Meteo real weather + APMC mandi feeds
      const [weather, mandis] = await Promise.all([
        fetchLiveWeather(DEFAULT_FARM_LOCATION.latitude, DEFAULT_FARM_LOCATION.longitude),
        fetchLiveMandiPrices(),
      ]);

      dispatch({ type: 'LIVE_SYNC_SUCCESS', weather, mandis });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Live sync failed';
      dispatch({ type: 'LIVE_SYNC_ERROR', error: msg });
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const toggleLiveMode = useCallback((enable: boolean) => {
    dispatch({ type: 'TOGGLE_LIVE_MODE', isLive: enable });
    if (enable) {
      triggerLiveSync();
    }
  }, [triggerLiveSync]);

  const setSyncInterval = useCallback((seconds: number) => {
    dispatch({ type: 'SET_SYNC_INTERVAL', seconds });
  }, []);

  const toggleLiveInspector = useCallback(() => {
    dispatch({ type: 'TOGGLE_LIVE_INSPECTOR' });
  }, []);

  const bookSolarSlot = useCallback((assetId: string, hours: number = 2, slotTime?: string): SolarBookingOrder => {
    const booking = createSolarBooking(assetId, state.farmState.farmer.farmerId, hours, slotTime);
    dispatch({ type: 'SOLAR_SLOT_BOOKED', booking });

    const titleLower = booking.assetTitle.toLowerCase();
    if (assetId === 'solar-drip-system-01' || titleLower.includes('drip')) {
      dispatch({ type: 'SET_UPGRADE_STATUS', key: 'sharedSolarDrip', active: true });
      dispatch({ type: 'CONNECT_SOLAR' });
      triggerCelebration(
        'Shared Solar Drip Activated!',
        `Booked ${booking.assetTitle} for ${booking.durationUnits} ${booking.unitType.toLowerCase()}. Switched from 60% flood to 90% precision drip irrigation!`,
        `Saves ${WATER_SAVED_L.toLocaleString('en-IN')} L Water · ₹${COST_DIFFERENCE.toLocaleString('en-IN')}/mo Diesel Expense Avoided`
      );
    } else if (assetId === 'solar-cold-hub-01' || titleLower.includes('cold room') || titleLower.includes('cold storage')) {
      dispatch({ type: 'SET_UPGRADE_STATUS', key: 'solarColdStorage', active: true });
      const economics = calcHarvestEconomics(1200, 31.25, 40, 72, 32);
      triggerCelebration(
        'Solar Cold Storage Reserved!',
        `Reserved ${booking.assetTitle} for ${booking.durationUnits} ${booking.unitType.toLowerCase()}. Protecting 1,200 kg tomato produce from 34°C ambient heat spoilage!`,
        `Saved 1,200 kg Produce · ₹${economics.spoilageLoss.toLocaleString('en-IN')} Spoilage Loss Avoided`
      );
    } else {
      dispatch({ type: 'SET_UPGRADE_STATUS', key: 'sharedSolarBooking', active: true });
      dispatch({ type: 'SET_UPGRADE_STATUS', key: 'sharedSolarDrip', active: true });
      triggerCelebration(
        'Community Solar Slot Confirmed!',
        `Booked ${booking.assetTitle} for ${booking.durationUnits} ${booking.unitType.toLowerCase()}. Clean renewable energy active!`,
        `Avoided ${booking.dieselDisplacedLiters} L Diesel · Saved ₹${booking.costSavedVsDieselInr.toLocaleString('en-IN')}`
      );
    }
    // Persist to secure backend database (server/db.ts)
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL
        ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
        : (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '');
      fetch(`${apiBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: booking.bookingId,
          farmerId: booking.farmerId,
          date: new Date().toISOString().split('T')[0],
          slotTime: booking.slotStartTime || `${booking.durationUnits} ${booking.unitType}`,
          dieselSavedLiters: booking.dieselDisplacedLiters,
          financialSavedInr: booking.costSavedVsDieselInr,
          status: 'CONFIRMED',
        }),
      }).catch(() => {
        // Safe offline fallback
      });
    } catch {
      // Ignore if fetch not supported or offline
    }

    return booking;
  }, [state.farmState.farmer.farmerId, triggerCelebration]);

  const lockMarketContract = useCallback((buyerId: string, quantityKg: number = 1200): DirectSaleContract => {
    const contract = createDirectSaleContract(state.farmState.farmer.farmerId, buyerId, quantityKg);
    dispatch({ type: 'DIRECT_CONTRACT_CREATED', contract });
    triggerCelebration(
      'Direct Farmgate Contract Locked!',
      `Locked contract with ${contract.buyerName} for ${contract.quantityKg} kg @ ₹${contract.lockedPricePerKg}/kg.`,
      `Saved ₹${contract.savingsVsMiddlemanCommissionInr.toLocaleString()} Middleman Commission`
    );
    return contract;
  }, [state.farmState.farmer.farmerId, triggerCelebration]);

  const startScenario = useCallback((id: ScenarioId) => {
    dispatch({ type: 'START_SIMULATION', scenarioId: id });

    const handleEventWithDecision = (event: FarmEvent) => {
      dispatch({ type: 'FARM_EVENT', event });
    };

    simulationEngine.runScenario(
      id,
      state.farmState,
      handleEventWithDecision,
      state.simulation.speed
    );
  }, [state.farmState, state.simulation.speed]);

  const pauseScenario = useCallback(() => {
    simulationEngine.pause();
    dispatch({ type: 'PAUSE_SIMULATION' });
  }, []);

  const resumeScenario = useCallback(() => {
    simulationEngine.resume();
    dispatch({ type: 'RESUME_SIMULATION' });
  }, []);

  const stepNextEvent = useCallback(() => {
    const hasNext = simulationEngine.stepNext();
    if (hasNext) {
      dispatch({ type: 'STEP_NEXT_EVENT' });
    }
  }, []);

  const resetScenario = useCallback(() => {
    simulationEngine.reset();
    dispatch({ type: 'RESET_SIMULATION' });
  }, []);

  const simulateFailure = useCallback((failure: 'PUMP_OFFLINE' | 'SENSOR_STALE' | 'WEATHER_STALE' | 'MARKET_STALE' | 'TRANSPORT_UNAVAILABLE') => {
    dispatch({ type: 'SIMULATE_FAILURE', failure });
  }, []);

  const toggleOffline = useCallback(() => {
    dispatch({ type: 'TOGGLE_OFFLINE' });
  }, []);

  const navigateTo = useCallback((screen: number) => {
    dispatch({ type: 'SET_ACTIVE_SCREEN', screen });
  }, []);

  const sensorAdapterRef = useRef<SensorAdapter | null>(null);

  const connectSensor = useCallback((mode: 'SIMULATED' | 'REAL_HARDWARE' = 'SIMULATED') => {
    dispatch({ type: 'CONNECT_SENSOR' });
    if (sensorAdapterRef.current) {
      sensorAdapterRef.current.disconnect();
    }
    const adapter = createSensorAdapter(mode);
    sensorAdapterRef.current = adapter;
    adapter.connect((event: FarmEvent) => {
      handleEvent(event);
      if (event.type === 'SENSOR_STATUS_CHANGE' && (event.payload as { status: string })?.status === 'LIVE') {
        dispatch({ type: 'SET_UPGRADE_STATUS', key: 'inSituSensor', active: true });
        triggerCelebration(
          'In-Situ Ground Sensor Connected!',
          'Dual-depth soil moisture telemetry is now streaming live into FarmKind Smart Engine.',
          'Zero Guesswork · Continuous Root-Zone Protection'
        );
      }
    });
  }, [handleEvent, triggerCelebration]);

  const connectSolar = useCallback(() => {
    dispatch({ type: 'CONNECT_SOLAR' });
    dispatch({ type: 'SET_UPGRADE_STATUS', key: 'sharedSolarDrip', active: true });
    triggerCelebration(
      'Shared Solar Drip Activated!',
      'Switched from flood irrigation to shared solar drip! 100% diesel emissions eliminated.',
      `Saving ${WATER_SAVED_L.toLocaleString('en-IN')} L Water & ₹${COST_DIFFERENCE.toLocaleString('en-IN')}/mo`
    );
  }, [triggerCelebration]);

  const evaluateDecisions = useCallback(() => {
    const irrigation = evaluateIrrigationDecision(state.farmState);
    const harvest = evaluateHarvestDecision(state.farmState);
    const climate = evaluateClimateDecision(state.farmState);
    dispatch({ type: 'DECISION_GENERATED', decision: irrigation, kind: 'irrigation' });
    dispatch({ type: 'DECISION_GENERATED', decision: harvest, kind: 'harvest' });
    dispatch({ type: 'DECISION_GENERATED', decision: climate, kind: 'climate' });
  }, [state.farmState]);

  const approveAction = useCallback((decisionId: string) => {
    dispatch({ type: 'SET_DECISION_STATUS', decisionId, status: 'APPROVED' });
    setTimeout(() => {
      dispatch({ type: 'SET_DECISION_STATUS', decisionId, status: 'EXECUTING' });
    }, 1000);
    setTimeout(() => {
      dispatch({ type: 'SET_DECISION_STATUS', decisionId, status: 'VERIFIED' });
    }, 3000);
  }, []);

  const getPriorityAction = useCallback(() => {
    return evaluateFarmPriority(state.farmState);
  }, [state.farmState]);

  // Initial fetch on mount
  useEffect(() => {
    triggerLiveSync();
  }, [triggerLiveSync]);

  // Background auto-refresh timer for live data
  useEffect(() => {
    if (!state.liveSync.isLiveMode || state.isOffline || state.simulation.isRunning) {
      return;
    }

    const timer = setInterval(() => {
      const nextSec = state.liveSync.countdownSec - 1;
      if (nextSec <= 0) {
        triggerLiveSync();
      } else {
        dispatch({ type: 'SET_LIVE_COUNTDOWN', countdownSec: nextSec });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    state.liveSync.isLiveMode,
    state.liveSync.countdownSec,
    state.isOffline,
    state.simulation.isRunning,
    triggerLiveSync,
  ]);

  // Run decision engine when farmState changes
  useEffect(() => {
    if (state.simulation.isRunning || state.farmState.farm.soil.sensorStatus === 'LIVE' || state.liveSync.isLiveMode) {
      const irrigation = evaluateIrrigationDecision(state.farmState);
      dispatch({ type: 'DECISION_GENERATED', decision: irrigation, kind: 'irrigation' });
    }
  }, [
    state.farmState.farm.soil.moisture.value,
    state.farmState.farm.soil.sensorStatus,
    state.farmState.farm.weather.rainProbability.value,
    state.farmState.farm.weather.expectedRainfall.value,
    state.farmState.farm.weather.temperature.value,
    state.farmState.farm.weather.isStale,
    state.farmState.farm.irrigation.pumpStatus,
    state.farmState.farm.logistics.transportAvailable,
    state.liveSync.isLiveMode,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('farmkind_screen', String(state.activeScreen));
      localStorage.setItem('farmkind_soil', JSON.stringify(state.farmState.farm.soil));
    } catch {
      // ignore storage errors
    }
  }, [state.activeScreen, state.farmState.farm.soil]);

  const value: AppContextValue = {
    state,
    dispatch,
    startScenario,
    pauseScenario,
    resumeScenario,
    stepNextEvent,
    resetScenario,
    navigateTo,
    connectSensor,
    connectSolar,
    evaluateDecisions,
    approveAction,
    getPriorityAction,
    simulateFailure,
    toggleOffline,
    toggleLiveMode,
    triggerLiveSync,
    setSyncInterval,
    toggleLiveInspector,
    bookSolarSlot,
    lockMarketContract,
    triggerCelebration,
    dismissCelebration,
    setUpgradeStatus,
    setCameFromRecommendations,
    setFarmAnalyzed,
    returnToFarmState,
    setActiveMarketTab,
    setLanguage,
    showIntro,
    setShowIntro,
    replayIntro,
    showQuickGuide,
    setShowQuickGuide,
    openQuickGuide,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  return ctx ?? defaultContextValue;
}
