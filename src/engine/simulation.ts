// =============================================================================
// FARMKIND — SIMULATION ENGINE
// Manages scenarios, events, FarmState updates. No direct UI manipulation.
// =============================================================================

import type {
  FarmState, FarmEvent, FarmEventType, ScenarioEvent,
  Scenario, ScenarioId
} from '../domain/types';
import { dp, CALCULATED_BASELINE } from './calculation';

// ─── EVENT BUS ───────────────────────────────────────────────────────────────

type EventHandler = (event: FarmEvent) => void;

class EventBus {
  private handlers: Map<FarmEventType | '*', EventHandler[]> = new Map();

  subscribe(type: FarmEventType | '*', handler: EventHandler): () => void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
    return () => {
      const updated = (this.handlers.get(type) ?? []).filter(h => h !== handler);
      this.handlers.set(type, updated);
    };
  }

  publish(event: FarmEvent): void {
    const handlers = [
      ...(this.handlers.get(event.type) ?? []),
      ...(this.handlers.get('*') ?? []),
    ];
    handlers.forEach(h => h(event));
  }
}

export const farmEventBus = new EventBus();

// ─── INITIAL FARM STATE ──────────────────────────────────────────────────────

export function createInitialFarmState(): FarmState {
  const now = new Date().toISOString();
  const eightHoursAgo = new Date(Date.now() - 8 * 3600 * 1000).toISOString();

  return {
    farmer: {
      farmerId: 'farmer-001',
      name: 'Ramesh Patil',
      location: 'Nashik, Maharashtra',
      state: 'Maharashtra',
      preferredLanguage: 'hi',
      farmIds: ['farm-001'],
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    farm: {
      farmId: 'farm-001',
      farmerId: 'farmer-001',
      location: 'Nashik, Maharashtra',
      areaAcres: CALCULATED_BASELINE.areaAcres,
      areaHectares: CALCULATED_BASELINE.areaHectares,
      areaM2: CALCULATED_BASELINE.areaM2,
      crop: {
        cropType: 'Tomato',
        variety: 'Hybrid',
        stage: 'MID_SEASON',
        kc: dp(CALCULATED_BASELINE.cropKc, '', 'REFERENCE', 'Tomato Kc mid-season'),
        criticalMoistureThreshold: 30,
        optimalMoistureTarget: 35,
        source: 'REFERENCE',
      },
      irrigation: {
        irrigationMethod: 'FLOOD',
        irrigationFrequency: 'Every 3 days',
        estimatedWaterPerEvent: dp(CALCULATED_BASELINE.floodGrossDailyL, 'L', 'CALCULATED', 'Per irrigation event (gross flood)'),
        estimatedDailyWaterUse: dp(CALCULATED_BASELINE.floodGrossDailyL, 'L/day', 'CALCULATED', 'Flood gross daily'),
        estimatedMonthlyWaterUse: dp(CALCULATED_BASELINE.floodMonthlyWaterL, 'L/month', 'CALCULATED', 'Flood gross monthly'),
        lastIrrigation: eightHoursAgo,
        pumpStatus: 'OFF',
        source: 'CALCULATED',
      },
      energy: {
        primarySource: 'DIESEL',
        pumpType: 'DIESEL_PUMP',
        estimatedConsumption: dp(CALCULATED_BASELINE.monthlyDieselLiters, 'L/month', 'CALCULATED', 'Diesel monthly (139.6 hrs @ 1.2 L/hr)'),
        consumptionUnit: 'L/month',
        energyCost: dp(CALCULATED_BASELINE.totalMonthlyDieselCost, '₹/month', 'CALCULATED', 'Diesel fuel (₹15,916) + maintenance/oil (₹2,500)'),
        source: 'CALCULATED',
      },
      soil: {
        moisture: dp(34, '%', 'SIMULATED', 'Soil moisture'),
        temperature: dp(28, '°C', 'SIMULATED', 'Soil temperature'),
        sensorStatus: 'NOT_CONNECTED',
        source: 'SIMULATED',
      },
      weather: {
        temperature: dp(36, '°C', 'SIMULATED', 'Air temperature'),
        humidity: dp(65, '%', 'SIMULATED', 'Humidity'),
        rainfall: dp(0, 'mm', 'SIMULATED', 'Today rainfall'),
        rainProbability: dp(78, '%', 'SIMULATED', 'Rain probability'),
        expectedRainfall: dp(22, 'mm', 'SIMULATED', 'Expected rainfall'),
        heatRisk: 'NONE',
        forecastConfidence: 0.8,
        timestamp: now,
        source: 'SIMULATED',
        isStale: false,
      },
      harvest: [
        {
          batchId: 'batch-001',
          cropType: 'Tomato',
          quantityKg: 500,
          harvestTimestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
          ageHours: dp(18, 'h', 'CALCULATED'),
          storageTemperature: dp(31, '°C', 'SIMULATED'),
          storageHumidity: dp(82, '%', 'SIMULATED'),
          condition: 'GOOD',
          spoilageRiskPercent: dp(15, '%', 'AI_DERIVED'),
          source: 'SIMULATED',
        },
      ],
      market: {
        options: [
          {
            marketId: 'market-a',
            name: 'Market A (Nashik APMC)',
            distanceKm: 12,
            pricePerKg: dp(24, '₹/kg', 'SIMULATED'),
            demand: 'MEDIUM',
            transportCostPerKg: dp(0.96, '₹/kg', 'CALCULATED'),
            availableTransport: true,
            estimatedTravelHours: 0.5,
            isStale: false,
          },
          {
            marketId: 'market-b',
            name: 'Market B (Pune Mandi)',
            distanceKm: 48,
            pricePerKg: dp(27, '₹/kg', 'SIMULATED'),
            demand: 'HIGH',
            transportCostPerKg: dp(3.84, '₹/kg', 'CALCULATED'),
            availableTransport: true,
            estimatedTravelHours: 2,
            isStale: false,
          },
        ],
        lastUpdated: now,
        source: 'SIMULATED',
      },
      logistics: {
        transportAvailable: true,
        lastChecked: now,
        source: 'SIMULATED',
      },
      connectedSystems: {
        solar: false,
        soilSensor: false,
        smartIrrigation: false,
        automation: false,
        voiceEnabled: true,
      },
    },
    lastUpdated: now,
    simulationMode: true,
  };
}

// ─── SCENARIO DEFINITIONS ────────────────────────────────────────────────────

const SCENARIO_IRRIGATION_RAIN_DELAY: Scenario = {
  id: 'irrigation-rain-delay',
  name: 'Resource Saver — Rain Delay',
  description: 'Smart Engine waits for rain, rain fails, soil drops, Smart Engine irrigates.',
  initialState: {},
  events: [
    {
      id: 'evt-1',
      delayMs: 0,
      type: 'SENSOR_STATUS_CHANGE',
      payload: { status: 'CONNECTING' },
      description: 'Soil sensor connecting...',
      sourceType: 'SIMULATED',
    },
    {
      id: 'evt-2',
      delayMs: 2500,
      type: 'SENSOR_STATUS_CHANGE',
      payload: { status: 'CALIBRATING' },
      description: 'Sensor calibrating',
      sourceType: 'SIMULATED',
    },
    {
      id: 'evt-3',
      delayMs: 5000,
      type: 'SENSOR_STATUS_CHANGE',
      payload: { status: 'LIVE' },
      description: 'Sensor live',
      sourceType: 'SIMULATED',
    },
    {
      id: 'evt-4',
      delayMs: 6500,
      type: 'SENSOR_READING',
      payload: { moisture: 34, temperature: 28 },
      description: 'Initial reading: 34% moisture',
      sourceType: 'SIMULATED',
    },
    {
      id: 'evt-5',
      delayMs: 8500,
      type: 'WEATHER_UPDATE',
      payload: { rainProbability: 78, expectedRainfall: 22, temperature: 36 },
      description: 'High rain probability detected (78%)',
      sourceType: 'SIMULATED',
    },
    // Rain probability collapses
    {
      id: 'evt-6',
      delayMs: 16500,
      type: 'WEATHER_UPDATE',
      payload: { rainProbability: 12, expectedRainfall: 2, temperature: 36 },
      description: 'Rain probability collapses to 12%',
      sourceType: 'SIMULATED',
    },
    {
      id: 'evt-7',
      delayMs: 19500,
      type: 'SENSOR_READING',
      payload: { moisture: 27, temperature: 29 },
      description: 'Soil drops to 27% (Critical threshold breached)',
      sourceType: 'SIMULATED',
    },
    // Irrigation starts
    {
      id: 'evt-8',
      delayMs: 24000,
      type: 'IRRIGATION_START',
      payload: { pumpStatus: 'ON' },
      description: 'Irrigation approved — pump ON',
      sourceType: 'SIMULATED',
    },
    {
      id: 'evt-9',
      delayMs: 28000,
      type: 'SENSOR_READING',
      payload: { moisture: 29, temperature: 29 },
      description: 'Moisture rising: 29%',
      sourceType: 'SIMULATED',
    },
    {
      id: 'evt-10',
      delayMs: 32000,
      type: 'SENSOR_READING',
      payload: { moisture: 32, temperature: 28 },
      description: 'Moisture rising: 32%',
      sourceType: 'SIMULATED',
    },
    {
      id: 'evt-11',
      delayMs: 36000,
      type: 'SENSOR_READING',
      payload: { moisture: 35, temperature: 28 },
      description: 'Target reached: 35%',
      sourceType: 'SIMULATED',
    },
    {
      id: 'evt-12',
      delayMs: 39500,
      type: 'IRRIGATION_STOP',
      payload: { pumpStatus: 'OFF', reason: 'TARGET_REACHED' },
      description: 'Pump OFF — target moisture reached',
      sourceType: 'SIMULATED',
    },
    {
      id: 'evt-13',
      delayMs: 42500,
      type: 'ACTION_VERIFIED',
      payload: { moisture: 35 },
      description: 'Irrigation verified — soil at target (35%)',
      sourceType: 'AI_DERIVED',
    },
    {
      id: 'evt-14',
      delayMs: 45500,
      type: 'IMPACT_MEASURED',
      payload: {
        waterSavedL: CALCULATED_BASELINE.monthlyWaterSavedL,
        dieselAvoided: CALCULATED_BASELINE.monthlyDieselLiters,
      },
      description: `Impact measured: ${CALCULATED_BASELINE.monthlyWaterSavedL.toLocaleString()} L water saved`,
      sourceType: 'CALCULATED',
    },
  ],
  expectedDecisions: ['WAIT', 'IRRIGATE'],
};

const SCENARIO_HARVEST_MARKET: Scenario = {
  id: 'harvest-market-shift',
  name: 'Harvest Protector — Market Shift',
  description: 'Transport delay + temperature rise forces decision re-evaluation.',
  initialState: {},
  events: [
    {
      id: 'h-1',
      delayMs: 0,
      type: 'HARVEST_CREATED',
      payload: { quantityKg: 500, ageHours: 18, temperature: 31, humidity: 82 },
      description: 'Harvest batch loaded',
      sourceType: 'SIMULATED',
    },
    {
      id: 'h-2',
      delayMs: 5000,
      type: 'TRANSPORT_UPDATE',
      payload: { available: false, delayHours: 4, reason: 'Vehicle breakdown' },
      description: 'Transport delay — vehicle breakdown',
      sourceType: 'SIMULATED',
    },
    {
      id: 'h-3',
      delayMs: 10000,
      type: 'TEMPERATURE_CHANGE',
      payload: { temperature: 34 },
      description: 'Storage temperature rising: 34°C',
      sourceType: 'SIMULATED',
    },
    {
      id: 'h-4',
      delayMs: 15000,
      type: 'HUMIDITY_CHANGE',
      payload: { humidity: 88, spoilageRisk: 32 },
      description: 'Spoilage risk rising',
      sourceType: 'AI_DERIVED',
    },
  ],
};

const SCENARIO_HEAT_RISK: Scenario = {
  id: 'heat-risk',
  name: 'Climate Defender — Heat Risk',
  description: 'Rising temperature triggers crop protection actions.',
  initialState: {},
  events: [
    {
      id: 'c-1',
      delayMs: 0,
      type: 'TEMPERATURE_CHANGE',
      payload: { temperature: 36, heatRisk: 'LOW' },
      description: 'Temperature: 36°C — monitoring',
      sourceType: 'SIMULATED',
    },
    {
      id: 'c-2',
      delayMs: 5000,
      type: 'TEMPERATURE_CHANGE',
      payload: { temperature: 39, heatRisk: 'HIGH' },
      description: 'Temperature: 39°C — HIGH heat risk',
      sourceType: 'SIMULATED',
    },
    {
      id: 'c-3',
      delayMs: 10000,
      type: 'TEMPERATURE_CHANGE',
      payload: { temperature: 41, heatRisk: 'CRITICAL' },
      description: 'Temperature: 41°C — CRITICAL',
      sourceType: 'SIMULATED',
    },
    {
      id: 'c-4',
      delayMs: 11000,
      type: 'CLIMATE_ALERT',
      payload: { risk: 'HEAT', severity: 'CRITICAL', affectedCrop: 'Tomato' },
      description: 'Climate alert issued',
      sourceType: 'AI_DERIVED',
    },
  ],
};

const SCENARIO_CROSS_SHIELD: Scenario = {
  id: 'cross-shield-day',
  name: 'Cross-Shield — Full Day',
  description: 'Multiple simultaneous threats — FarmKind prioritizes.',
  initialState: {},
  events: [
    ...SCENARIO_IRRIGATION_RAIN_DELAY.events.slice(0, 7),
    ...SCENARIO_HEAT_RISK.events,
    ...SCENARIO_HARVEST_MARKET.events,
  ],
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  'irrigation-rain-delay': SCENARIO_IRRIGATION_RAIN_DELAY,
  'harvest-market-shift': SCENARIO_HARVEST_MARKET,
  'heat-risk': SCENARIO_HEAT_RISK,
  'cross-shield-day': SCENARIO_CROSS_SHIELD,
};

// ─── FARM STATE REDUCER ──────────────────────────────────────────────────────

export function applyEventToFarmState(state: FarmState, event: FarmEvent): FarmState {
  const now = new Date().toISOString();

  switch (event.type) {
    case 'SENSOR_READING': {
      const p = event.payload as { moisture: number; temperature: number };
      const source = event.sourceType || 'SIMULATED';
      const label = source === 'REAL'
        ? 'In-situ physical soil moisture'
        : 'Model-derived surface soil-moisture signal (SIMULATED)';
      return {
        ...state,
        farm: {
          ...state.farm,
          soil: {
            ...state.farm.soil,
            moisture: dp(p.moisture, '%', source, label),
            temperature: dp(p.temperature, '°C', source),
            lastUpdated: now,
            source,
          },
        },
        lastUpdated: now,
      };
    }

    case 'SENSOR_STATUS_CHANGE': {
      const p = event.payload as { status: import('../domain/types').SoilState['sensorStatus'] };
      const isLive = p.status === 'LIVE';
      const source = event.sourceType || 'SIMULATED';
      return {
        ...state,
        farm: {
          ...state.farm,
          soil: {
            ...state.farm.soil,
            sensorStatus: p.status,
            source,
          },
          connectedSystems: {
            ...state.farm.connectedSystems,
            soilSensor: isLive,
          },
        },
        lastUpdated: now,
      };
    }

    case 'WEATHER_UPDATE': {
      const p = event.payload as Partial<{
        rainProbability: number; expectedRainfall: number; temperature: number;
        humidity: number; heatRisk: string;
      }>;
      return {
        ...state,
        farm: {
          ...state.farm,
          weather: {
            ...state.farm.weather,
            rainProbability: p.rainProbability !== undefined
              ? dp(p.rainProbability, '%', 'SIMULATED') : state.farm.weather.rainProbability,
            expectedRainfall: p.expectedRainfall !== undefined
              ? dp(p.expectedRainfall, 'mm', 'SIMULATED') : state.farm.weather.expectedRainfall,
            temperature: p.temperature !== undefined
              ? dp(p.temperature, '°C', 'SIMULATED') : state.farm.weather.temperature,
            heatRisk: (p.heatRisk as import('../domain/types').WeatherState['heatRisk']) ?? state.farm.weather.heatRisk,
            timestamp: now,
            isStale: false,
          },
        },
        lastUpdated: now,
      };
    }

    case 'TEMPERATURE_CHANGE': {
      const p = event.payload as { temperature: number; heatRisk?: string };
      return {
        ...state,
        farm: {
          ...state.farm,
          weather: {
            ...state.farm.weather,
            temperature: dp(p.temperature, '°C', 'SIMULATED'),
            heatRisk: (p.heatRisk as import('../domain/types').WeatherState['heatRisk']) ?? state.farm.weather.heatRisk,
            timestamp: now,
          },
        },
        lastUpdated: now,
      };
    }

    case 'HUMIDITY_CHANGE': {
      const p = event.payload as { humidity: number; spoilageRisk?: number };
      const updatedHarvest = state.farm.harvest.map(batch => ({
        ...batch,
        storageHumidity: dp(p.humidity, '%', 'SIMULATED'),
        spoilageRiskPercent: dp(p.spoilageRisk ?? batch.spoilageRiskPercent.value ?? 0, '%', 'AI_DERIVED'),
        condition: (p.spoilageRisk ?? 0) >= 35 ? 'AT_RISK' as const : batch.condition,
      }));
      return {
        ...state,
        farm: { ...state.farm, harvest: updatedHarvest },
        lastUpdated: now,
      };
    }

    case 'IRRIGATION_START': {
      const p = event.payload as { pumpStatus: string };
      const lastIrr = p.pumpStatus === 'ON' ? now : state.farm.irrigation.lastIrrigation;
      return {
        ...state,
        farm: {
          ...state.farm,
          irrigation: {
            ...state.farm.irrigation,
            pumpStatus: p.pumpStatus as 'ON' | 'OFF',
            lastIrrigation: lastIrr,
          },
          connectedSystems: {
            ...state.farm.connectedSystems,
            smartIrrigation: true,
          },
        },
        lastUpdated: now,
      };
    }

    case 'IRRIGATION_STOP': {
      return {
        ...state,
        farm: {
          ...state.farm,
          irrigation: {
            ...state.farm.irrigation,
            pumpStatus: 'OFF',
          },
        },
        lastUpdated: now,
      };
    }

    case 'TRANSPORT_UPDATE': {
      const p = event.payload as { available: boolean; delayHours?: number; reason?: string };
      const updatedMarket = state.farm.market.options.map(opt => ({
        ...opt,
        availableTransport: p.available,
      }));
      return {
        ...state,
        farm: {
          ...state.farm,
          logistics: {
            transportAvailable: p.available,
            estimatedAvailabilityHours: p.delayHours,
            delayReason: p.reason,
            lastChecked: now,
            source: 'SIMULATED',
          },
          market: {
            ...state.farm.market,
            options: updatedMarket,
          },
        },
        lastUpdated: now,
      };
    }

    case 'HARVEST_CREATED': {
      const p = event.payload as { quantityKg: number; ageHours: number; temperature: number; humidity: number };
      const newBatch = {
        batchId: `batch-${Date.now()}`,
        cropType: 'Tomato',
        quantityKg: p.quantityKg,
        harvestTimestamp: new Date(Date.now() - p.ageHours * 3600 * 1000).toISOString(),
        ageHours: dp(p.ageHours, 'h', 'CALCULATED'),
        storageTemperature: dp(p.temperature, '°C', 'SIMULATED'),
        storageHumidity: dp(p.humidity, '%', 'SIMULATED'),
        condition: 'GOOD' as const,
        spoilageRiskPercent: dp(15, '%', 'AI_DERIVED'),
        source: 'SIMULATED' as const,
      };
      return {
        ...state,
        farm: {
          ...state.farm,
          harvest: [newBatch, ...state.farm.harvest.slice(0, 2)],
        },
        lastUpdated: now,
      };
    }

    default:
      return { ...state, lastUpdated: now };
  }
}

// ─── SIMULATION RUNNER ───────────────────────────────────────────────────────

export class SimulationEngine {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private currentEvents: ScenarioEvent[] = [];
  private currentIndex = 0;
  private onEventHandler: ((event: FarmEvent) => void) | null = null;
  private currentSpeed = 1;
  private isPaused = false;
  private eventCounter = 0;

  runScenario(
    scenarioId: ScenarioId,
    _initialState: FarmState,
    onEvent: (event: FarmEvent) => void,
    speed: number = 1
  ): void {
    this.stop();
    const scenario = SCENARIOS[scenarioId];
    if (!scenario) return;

    this.currentEvents = [...scenario.events];
    this.currentIndex = 0;
    this.onEventHandler = onEvent;
    this.currentSpeed = speed;
    this.isPaused = false;
    this.eventCounter = 0;

    this.scheduleFrom(0);
  }

  private scheduleFrom(fromIndex: number): void {
    this.clearTimers();
    if (!this.onEventHandler || fromIndex >= this.currentEvents.length) return;

    const baseDelay = fromIndex === 0 ? 0 : this.currentEvents[fromIndex].delayMs;

    for (let i = fromIndex; i < this.currentEvents.length; i++) {
      const se = this.currentEvents[i];
      const relativeDelay = Math.max(0, (se.delayMs - baseDelay) / this.currentSpeed);

      const timer = setTimeout(() => {
        if (this.isPaused) return;
        this.currentIndex = i + 1;
        this.dispatchSingleEvent(se);
      }, relativeDelay);

      this.timers.push(timer);
    }
  }

  private dispatchSingleEvent(se: ScenarioEvent): void {
    if (!this.onEventHandler) return;
    const event: FarmEvent = {
      eventId: `sim-${Date.now()}-${++this.eventCounter}`,
      timestamp: new Date().toISOString(),
      type: se.type,
      payload: se.payload,
      sourceType: se.sourceType,
      description: se.description,
    };
    this.onEventHandler(event);
    farmEventBus.publish(event);
  }

  pause(): void {
    this.isPaused = true;
    this.clearTimers();
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.scheduleFrom(this.currentIndex);
  }

  stepNext(): boolean {
    if (this.currentIndex >= this.currentEvents.length) return false;
    const se = this.currentEvents[this.currentIndex++];
    this.dispatchSingleEvent(se);
    return true;
  }

  private clearTimers(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }

  stop(): void {
    this.clearTimers();
    this.isPaused = false;
    this.currentIndex = 0;
    this.currentEvents = [];
    this.onEventHandler = null;
  }

  reset(): void {
    this.stop();
  }
}

export const simulationEngine = new SimulationEngine();

// ─── IMPACT METRICS ──────────────────────────────────────────────────────────

export function buildImpactMetrics(
  eventLog: FarmEvent[],
  decisionLog: import('../domain/types').DecisionResult[]
): import('../domain/types').ImpactMetrics {
  const actionsApproved = decisionLog.filter(d =>
    d.status === 'APPROVED' || d.status === 'EXECUTING' ||
    d.status === 'COMPLETED' || d.status === 'VERIFIED'
  ).length;

  const actionsVerified = decisionLog.filter(d => d.status === 'VERIFIED').length;
  const actionsAutomated = eventLog.filter(e => e.type === 'IRRIGATION_START').length;

  const impactEvents = eventLog.filter(e => e.type === 'IMPACT_MEASURED');
  const impactPayload = impactEvents[0]?.payload as { waterSavedL?: number; dieselAvoided?: number } | undefined;

  return {
    waterBaseline: dp(CALCULATED_BASELINE.floodMonthlyWaterL, 'L/month', 'CALCULATED', 'Flood gross monthly (3.5 acres, FAO-56)'),
    waterScenario: dp(CALCULATED_BASELINE.dripMonthlyWaterL, 'L/month', 'CALCULATED', 'Drip gross monthly (3.5 acres, FAO-56)'),
    waterSaved: dp(impactPayload?.waterSavedL ?? CALCULATED_BASELINE.monthlyWaterSavedL, 'L/month', 'CALCULATED'),
    waterSavedPercent: dp(CALCULATED_BASELINE.waterReductionPercent, '%', 'CALCULATED'),

    dieselBaseline: dp(CALCULATED_BASELINE.monthlyDieselLiters, 'L/month', 'CALCULATED', 'Derived pumping hours × burn rate'),
    dieselAvoided: dp(impactPayload?.dieselAvoided ?? CALCULATED_BASELINE.monthlyDieselLiters, 'L/month', 'CALCULATED'),

    costBaseline: dp(CALCULATED_BASELINE.totalMonthlyDieselCost, '₹/month', 'CALCULATED', 'Diesel fuel (₹15,916) + maintenance/oil (₹2,500)'),
    costScenario: dp(CALCULATED_BASELINE.sharedSolarMonthlyCost, '₹/month', 'ASSUMED', 'Pay-per-use shared solar model'),
    costDifference: dp(CALCULATED_BASELINE.monthlyCostDifference, '₹/month', 'CALCULATED', 'Net operational savings'),

    harvestValueProtected: dp(500 * 24, '₹', 'CALCULATED', 'Scenario estimate'),
    climateRisksDetected: eventLog.filter(e => e.type === 'CLIMATE_ALERT').length,
    decisionsGenerated: decisionLog.length,
    actionsRecommended: decisionLog.filter(d => d.status !== 'DETECTED').length,
    actionsApproved,
    actionsAutomated,
    actionsVerified,
  };
}
