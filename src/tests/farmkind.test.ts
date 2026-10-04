// =============================================================================
// FARMKIND — UNIT TESTS
// Tests for calculation engine, decision engine, and simulation
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calcETc, calcNetWaterLitersDay, calcGrossWaterFlood, calcGrossWaterDrip,
  calcMonthlyWater, calcMonthlyDieselFlood, calcMonthlyDieselCost,
  calcHarvestEconomics,
  FARM_AREA_M2, ETo, TOMATO_KC, FLOOD_MONTHLY_L, DRIP_MONTHLY_L,
  WATER_SAVED_L, DIESEL_MONTHLY_L, DIESEL_MONTHLY_COST, COST_DIFFERENCE,
  SHARED_SOLAR_MONTHLY, DIESEL_PRICE_PER_L,
} from '../engine/calculation';
import {
  evaluateIrrigationDecision,
  evaluateHarvestDecision,
  evaluateClimateDecision,
  evaluateFarmPriority,
} from '../engine/decision';
import { createInitialFarmState, applyEventToFarmState } from '../engine/simulation';
import type { FarmState, FarmEvent } from '../domain/types';

// ─── CALCULATION ENGINE TESTS ─────────────────────────────────────────────────

describe('Calculation Engine', () => {
  describe('ETc calculation', () => {
    it('computes ETc correctly', () => {
      const ETc = calcETc(ETo, TOMATO_KC);
      expect(ETc).toBeCloseTo(6.9, 1);
    });

    it('ETo=6, Kc=1.15 → ETc=6.9', () => {
      expect(calcETc(6.0, 1.15)).toBeCloseTo(6.9, 2);
    });
  });

  describe('Net water', () => {
    it('computes net water requirement for 3.5 acres (14,164 m²)', () => {
      const ETc = calcETc(ETo, TOMATO_KC);
      const net = calcNetWaterLitersDay(ETc, FARM_AREA_M2);
      expect(net).toBeGreaterThan(90000);
      expect(net).toBeLessThan(100000);
      expect(net).toBeCloseTo(97732, 0);
    });
  });

  describe('Gross water', () => {
    it('flood gross is greater than drip gross', () => {
      const ETc = calcETc(ETo, TOMATO_KC);
      const net = calcNetWaterLitersDay(ETc, FARM_AREA_M2);
      const flood = calcGrossWaterFlood(net);
      const drip = calcGrossWaterDrip(net);
      expect(flood).toBeGreaterThan(drip);
    });

    it('flood efficiency is 60% of net', () => {
      const net = 100000;
      expect(calcGrossWaterFlood(net)).toBeCloseTo(net / 0.6, 0);
    });

    it('drip efficiency is 90% of net', () => {
      const net = 100000;
      expect(calcGrossWaterDrip(net)).toBeCloseTo(net / 0.9, 0);
    });
  });

  describe('Monthly water', () => {
    it('monthly = daily × 30', () => {
      expect(calcMonthlyWater(1000)).toBe(30000);
    });

    it('flood monthly ≈ 4.89M L on 3.5 acres', () => {
      expect(FLOOD_MONTHLY_L).toBeGreaterThan(4_500_000);
      expect(FLOOD_MONTHLY_L).toBeLessThan(5_200_000);
      expect(FLOOD_MONTHLY_L).toBeCloseTo(4_886_580, -2);
    });

    it('drip monthly ≈ 3.26M L on 3.5 acres', () => {
      expect(DRIP_MONTHLY_L).toBeGreaterThan(3_000_000);
      expect(DRIP_MONTHLY_L).toBeLessThan(3_500_000);
      expect(DRIP_MONTHLY_L).toBeCloseTo(3_257_720, -2);
    });

    it('water saved ≈ 1.63M L (33.3% reduction)', () => {
      expect(WATER_SAVED_L).toBeGreaterThan(1_500_000);
      expect(WATER_SAVED_L).toBeLessThan(1_800_000);
      expect(WATER_SAVED_L).toBeCloseTo(1_628_860, -2);
    });
  });

  describe('Diesel calculation', () => {
    it('monthly diesel ≈ 167.5 L connected to pump hours', () => {
      const diesel = calcMonthlyDieselFlood();
      expect(diesel).toBeGreaterThan(160);
      expect(diesel).toBeLessThan(175);
      expect(DIESEL_MONTHLY_L).toBe(diesel);
    });

    it('monthly cost connects fuel (₹95/L) plus explicit ₹2,500 maintenance/oil', () => {
      const cost = calcMonthlyDieselCost();
      const expectedFuel = Math.round(DIESEL_MONTHLY_L * DIESEL_PRICE_PER_L);
      expect(cost).toBe(expectedFuel + 2500);
      expect(DIESEL_MONTHLY_COST).toBe(cost);
    });

    it('monthly total diesel cost ≈ ₹18,416', () => {
      expect(DIESEL_MONTHLY_COST).toBeGreaterThan(18_000);
      expect(DIESEL_MONTHLY_COST).toBeLessThan(19_000);
      expect(DIESEL_MONTHLY_COST).toBe(18416);
    });
  });

  describe('Cost difference', () => {
    it('potential operating cost difference ≈ ₹12,416/mo vs ₹6,000 shared solar', () => {
      expect(COST_DIFFERENCE).toBeCloseTo(DIESEL_MONTHLY_COST - SHARED_SOLAR_MONTHLY, 0);
      expect(COST_DIFFERENCE).toBeGreaterThan(12_000);
      expect(COST_DIFFERENCE).toBeLessThan(13_000);
      expect(COST_DIFFERENCE).toBe(12416);
    });
  });

  describe('Harvest economics', () => {
    it('computes gross revenue correctly', () => {
      const result = calcHarvestEconomics(500, 24, 12, 0, 15, 0);
      expect(result.grossRevenue).toBe(500 * 24);
    });

    it('transport cost increases with distance', () => {
      const near = calcHarvestEconomics(500, 24, 12, 0, 0, 0);
      const far = calcHarvestEconomics(500, 24, 48, 0, 0, 0);
      expect(far.transportCost).toBeGreaterThan(near.transportCost);
    });

    it('spoilage reduces net revenue', () => {
      const noSpoilage = calcHarvestEconomics(500, 24, 0, 0, 0, 0);
      const withSpoilage = calcHarvestEconomics(500, 24, 0, 0, 30, 0);
      expect(withSpoilage.netRevenue).toBeLessThan(noSpoilage.netRevenue);
    });

    it('net revenue = gross - transport - storage - spoilage', () => {
      const r = calcHarvestEconomics(100, 24, 10, 2, 0, 0);
      const expectedNet = r.grossRevenue - r.transportCost - r.storageCost - r.spoilageLoss;
      expect(r.netRevenue).toBeCloseTo(expectedNet, 1);
    });
  });
});

// ─── IRRIGATION DECISION TESTS ────────────────────────────────────────────────

describe('Irrigation Decision Engine', () => {
  let baseState: FarmState;

  beforeEach(() => {
    baseState = createInitialFarmState();
  });

  it('returns WAIT when rain probability is high (78%)', () => {
    baseState.farm.soil.sensorStatus = 'LIVE';
    baseState.farm.soil.moisture.value = 34;
    baseState.farm.weather.rainProbability.value = 78;
    baseState.farm.weather.expectedRainfall.value = 22;

    const result = evaluateIrrigationDecision(baseState);
    expect(result.selectedAction).toBe('WAIT');
    expect(result.confidence).toBe('HIGH');
  });

  it('returns IRRIGATE when moisture is low (27%) and rain is unlikely (12%)', () => {
    baseState.farm.soil.sensorStatus = 'LIVE';
    baseState.farm.soil.moisture.value = 27;
    baseState.farm.weather.rainProbability.value = 12;
    baseState.farm.weather.expectedRainfall.value = 2;

    const result = evaluateIrrigationDecision(baseState);
    expect(result.selectedAction).toBe('IRRIGATE');
  });

  it('reduces confidence when sensor is stale', () => {
    baseState.farm.soil.sensorStatus = 'STALE';
    baseState.farm.soil.moisture.value = 27;
    baseState.farm.weather.rainProbability.value = 10;

    const result = evaluateIrrigationDecision(baseState);
    expect(result.confidence).not.toBe('HIGH');
  });

  it('returns MONITOR when pump is offline', () => {
    baseState.farm.irrigation.pumpStatus = 'OFFLINE';

    const result = evaluateIrrigationDecision(baseState);
    expect(result.selectedAction).toBe('MONITOR');
  });

  it('generates hindi reason text', () => {
    baseState.farm.soil.sensorStatus = 'LIVE';
    baseState.farm.soil.moisture.value = 27;
    baseState.farm.weather.rainProbability.value = 12;
    baseState.farm.weather.expectedRainfall.value = 2;

    const result = evaluateIrrigationDecision(baseState);
    expect(result.hindiReason).toBeTruthy();
    expect(typeof result.hindiReason).toBe('string');
  });

  it('includes all required fields', () => {
    const result = evaluateIrrigationDecision(baseState);
    expect(result.decisionId).toBeTruthy();
    expect(result.timestamp).toBeTruthy();
    expect(result.farmId).toBe('farm-001');
    expect(result.observations).toBeInstanceOf(Array);
    expect(result.candidateActions).toBeInstanceOf(Array);
    expect(result.candidateActions.length).toBeGreaterThan(0);
  });
});

// ─── HARVEST DECISION TESTS ───────────────────────────────────────────────────

describe('Harvest Decision Engine', () => {
  let baseState: FarmState;

  beforeEach(() => {
    baseState = createInitialFarmState();
  });

  it('recommends SELL_NOW or MOVE_TO_MARKET with transport available', () => {
    baseState.farm.logistics.transportAvailable = true;
    const result = evaluateHarvestDecision(baseState);
    expect(['SELL_NOW', 'MOVE_TO_MARKET']).toContain(result.selectedAction);
  });

  it('recommends STORE when transport is delayed and risk is low', () => {
    baseState.farm.logistics.transportAvailable = false;
    baseState.farm.logistics.estimatedAvailabilityHours = 4;
    // Low spoilage risk
    baseState.farm.harvest[0].spoilageRiskPercent.value = 10;
    const result = evaluateHarvestDecision(baseState);
    expect(result.selectedAction).toBe('STORE');
  });

  it('recommends SELL_NOW when spoilage risk is critical', () => {
    baseState.farm.harvest[0].spoilageRiskPercent.value = 40;
    const result = evaluateHarvestDecision(baseState);
    expect(result.selectedAction).toBe('SELL_NOW');
    expect(result.urgency).toBe('CRITICAL');
  });

  it('returns MONITOR when no harvest batch', () => {
    baseState.farm.harvest = [];
    const result = evaluateHarvestDecision(baseState);
    expect(result.selectedAction).toBe('MONITOR');
  });
});

// ─── CLIMATE DECISION TESTS ───────────────────────────────────────────────────

describe('Climate Decision Engine', () => {
  let baseState: FarmState;

  beforeEach(() => {
    baseState = createInitialFarmState();
  });

  it('returns MONITOR at normal temperature (36°C)', () => {
    baseState.farm.weather.temperature.value = 36;
    baseState.farm.weather.heatRisk = 'NONE';
    const result = evaluateClimateDecision(baseState);
    expect(result.selectedAction).toBe('MONITOR');
  });

  it('returns PREPARE_FOR_HEAT at HIGH temp (39°C)', () => {
    baseState.farm.weather.temperature.value = 39;
    baseState.farm.weather.heatRisk = 'HIGH';
    const result = evaluateClimateDecision(baseState);
    expect(result.selectedAction).toBe('PREPARE_FOR_HEAT');
    expect(result.urgency).toBe('HIGH');
  });

  it('returns IRRIGATE at CRITICAL heat (41°C)', () => {
    baseState.farm.weather.temperature.value = 41;
    baseState.farm.weather.heatRisk = 'CRITICAL';
    const result = evaluateClimateDecision(baseState);
    expect(result.selectedAction).toBe('IRRIGATE');
    expect(result.urgency).toBe('CRITICAL');
  });

  it('includes temperature in observations', () => {
    baseState.farm.weather.temperature.value = 41;
    const result = evaluateClimateDecision(baseState);
    const hasTemp = result.observations.some(o => o.includes('41'));
    expect(hasTemp).toBe(true);
  });
});

// ─── SIMULATION ENGINE TESTS ──────────────────────────────────────────────────

describe('Simulation Engine — FarmState Updates', () => {
  let baseState: FarmState;

  beforeEach(() => {
    baseState = createInitialFarmState();
  });

  it('SENSOR_READING updates soil moisture in FarmState', () => {
    const event: FarmEvent = {
      eventId: 'test-1',
      timestamp: new Date().toISOString(),
      type: 'SENSOR_READING',
      payload: { moisture: 27, temperature: 29 },
      sourceType: 'SIMULATED',
    };
    const newState = applyEventToFarmState(baseState, event);
    expect(newState.farm.soil.moisture.value).toBe(27);
    expect(newState.farm.soil.temperature.value).toBe(29);
  });

  it('SENSOR_STATUS_CHANGE updates sensorStatus', () => {
    const event: FarmEvent = {
      eventId: 'test-2',
      timestamp: new Date().toISOString(),
      type: 'SENSOR_STATUS_CHANGE',
      payload: { status: 'LIVE' },
      sourceType: 'SIMULATED',
    };
    const newState = applyEventToFarmState(baseState, event);
    expect(newState.farm.soil.sensorStatus).toBe('LIVE');
    expect(newState.farm.connectedSystems.soilSensor).toBe(true);
  });

  it('WEATHER_UPDATE updates rain probability', () => {
    const event: FarmEvent = {
      eventId: 'test-3',
      timestamp: new Date().toISOString(),
      type: 'WEATHER_UPDATE',
      payload: { rainProbability: 12, expectedRainfall: 2 },
      sourceType: 'SIMULATED',
    };
    const newState = applyEventToFarmState(baseState, event);
    expect(newState.farm.weather.rainProbability.value).toBe(12);
    expect(newState.farm.weather.expectedRainfall.value).toBe(2);
  });

  it('IRRIGATION_START sets pumpStatus to ON', () => {
    const event: FarmEvent = {
      eventId: 'test-4',
      timestamp: new Date().toISOString(),
      type: 'IRRIGATION_START',
      payload: { pumpStatus: 'ON' },
      sourceType: 'SIMULATED',
    };
    const newState = applyEventToFarmState(baseState, event);
    expect(newState.farm.irrigation.pumpStatus).toBe('ON');
  });

  it('IRRIGATION_STOP sets pumpStatus to OFF', () => {
    const onState = applyEventToFarmState(baseState, {
      eventId: 'test-4a',
      timestamp: new Date().toISOString(),
      type: 'IRRIGATION_START',
      payload: { pumpStatus: 'ON' },
      sourceType: 'SIMULATED',
    });
    const offState = applyEventToFarmState(onState, {
      eventId: 'test-5',
      timestamp: new Date().toISOString(),
      type: 'IRRIGATION_STOP',
      payload: { pumpStatus: 'OFF', reason: 'TARGET_REACHED' },
      sourceType: 'SIMULATED',
    });
    expect(offState.farm.irrigation.pumpStatus).toBe('OFF');
  });

  it('TRANSPORT_UPDATE marks transport unavailable', () => {
    const event: FarmEvent = {
      eventId: 'test-6',
      timestamp: new Date().toISOString(),
      type: 'TRANSPORT_UPDATE',
      payload: { available: false, delayHours: 4, reason: 'Vehicle breakdown' },
      sourceType: 'SIMULATED',
    };
    const newState = applyEventToFarmState(baseState, event);
    expect(newState.farm.logistics.transportAvailable).toBe(false);
  });

  it('TEMPERATURE_CHANGE updates temperature', () => {
    const event: FarmEvent = {
      eventId: 'test-7',
      timestamp: new Date().toISOString(),
      type: 'TEMPERATURE_CHANGE',
      payload: { temperature: 41, heatRisk: 'CRITICAL' },
      sourceType: 'SIMULATED',
    };
    const newState = applyEventToFarmState(baseState, event);
    expect(newState.farm.weather.temperature.value).toBe(41);
    expect(newState.farm.weather.heatRisk).toBe('CRITICAL');
  });

  it('events create new FarmState (immutability)', () => {
    const event: FarmEvent = {
      eventId: 'test-8',
      timestamp: new Date().toISOString(),
      type: 'SENSOR_READING',
      payload: { moisture: 99, temperature: 99 },
      sourceType: 'SIMULATED',
    };
    const newState = applyEventToFarmState(baseState, event);
    // Original state unchanged
    expect(baseState.farm.soil.moisture.value).toBe(34); // original
    expect(newState.farm.soil.moisture.value).toBe(99);  // updated
    expect(newState).not.toBe(baseState);
  });
});

// ─── DECISION → IRRIGATION → PUMP CYCLE ──────────────────────────────────────

describe('Full Irrigation Cycle', () => {
  it('rain high → WAIT, rain low + low moisture → IRRIGATE', () => {
    let state = createInitialFarmState();
    state.farm.soil.sensorStatus = 'LIVE';
    
    // High rain scenario
    state.farm.soil.moisture.value = 34;
    state.farm.weather.rainProbability.value = 78;
    state.farm.weather.expectedRainfall.value = 22;
    const dec1 = evaluateIrrigationDecision(state);
    expect(dec1.selectedAction).toBe('WAIT');

    // Rain collapses, soil drops
    state = applyEventToFarmState(state, {
      eventId: 'cycle-1',
      timestamp: new Date().toISOString(),
      type: 'WEATHER_UPDATE',
      payload: { rainProbability: 12, expectedRainfall: 2 },
      sourceType: 'SIMULATED',
    });
    state = applyEventToFarmState(state, {
      eventId: 'cycle-2',
      timestamp: new Date().toISOString(),
      type: 'SENSOR_READING',
      payload: { moisture: 27, temperature: 29 },
      sourceType: 'SIMULATED',
    });
    
    const dec2 = evaluateIrrigationDecision(state);
    expect(dec2.selectedAction).toBe('IRRIGATE');

    // Pump starts, moisture rises to target
    state = applyEventToFarmState(state, {
      eventId: 'cycle-3',
      timestamp: new Date().toISOString(),
      type: 'IRRIGATION_START',
      payload: { pumpStatus: 'ON' },
      sourceType: 'SIMULATED',
    });
    expect(state.farm.irrigation.pumpStatus).toBe('ON');

    state = applyEventToFarmState(state, {
      eventId: 'cycle-4',
      timestamp: new Date().toISOString(),
      type: 'SENSOR_READING',
      payload: { moisture: 35, temperature: 28 },
      sourceType: 'SIMULATED',
    });
    expect(state.farm.soil.moisture.value).toBe(35);

    // Pump stops
    state = applyEventToFarmState(state, {
      eventId: 'cycle-5',
      timestamp: new Date().toISOString(),
      type: 'IRRIGATION_STOP',
      payload: { pumpStatus: 'OFF', reason: 'TARGET_REACHED' },
      sourceType: 'SIMULATED',
    });
    expect(state.farm.irrigation.pumpStatus).toBe('OFF');

    // Final decision should be WAIT/MONITOR now that moisture is at target
    const dec3 = evaluateIrrigationDecision(state);
    expect(['WAIT', 'MONITOR']).toContain(dec3.selectedAction);
  });
});

// ─── FAILURE STATES TESTS (Section 35) ───────────────────────────────────────

describe('Failure States Handling', () => {
  it('Pump offline blocks irrigation even when moisture is critical', () => {
    let state = createInitialFarmState();
    state = {
      ...state,
      farm: {
        ...state.farm,
        soil: { ...state.farm.soil, moisture: { ...state.farm.soil.moisture, value: 20 }, sensorStatus: 'LIVE' },
        weather: { ...state.farm.weather, rainProbability: { ...state.farm.weather.rainProbability, value: 5 } },
        irrigation: { ...state.farm.irrigation, pumpStatus: 'OFFLINE' },
      },
    };
    const decision = evaluateIrrigationDecision(state);
    expect(decision.selectedAction).toBe('MONITOR');
    expect(decision.rejectedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: 'IRRIGATE', reason: 'Pump offline' })
    ]));
    expect(decision.constraints).toContain('Pump is OFFLINE — irrigation blocked');
  });

  it('Stale or uncalibrated soil sensor reduces confidence to LOW', () => {
    let state = createInitialFarmState();
    state = {
      ...state,
      farm: {
        ...state.farm,
        soil: { ...state.farm.soil, sensorStatus: 'STALE' },
      },
    };
    const decision = evaluateIrrigationDecision(state);
    expect(decision.confidence).toBe('LOW');
    expect(decision.constraints).toContain('Soil sensor unavailable or stale — reducing confidence');
  });

  it('Stale weather forecast lowers decision confidence', () => {
    let state = createInitialFarmState();
    const tenHoursAgo = new Date(Date.now() - 10 * 3600 * 1000).toISOString();
    state = {
      ...state,
      farm: {
        ...state.farm,
        soil: { ...state.farm.soil, sensorStatus: 'LIVE' },
        weather: { ...state.farm.weather, timestamp: tenHoursAgo, isStale: true },
      },
    };
    const decision = evaluateIrrigationDecision(state);
    expect(decision.constraints).toContain('Weather data may be stale');
    expect(decision.confidence).not.toBe('HIGH');
  });

  it('Transport delay triggers TEMPORARY STORAGE recommendation', () => {
    let state = createInitialFarmState();
    state = {
      ...state,
      farm: {
        ...state.farm,
        logistics: {
          ...state.farm.logistics,
          transportAvailable: false,
          delayReason: 'Vehicle breakdown',
        },
      },
    };
    const decision = evaluateHarvestDecision(state);
    expect(decision.selectedAction).toBe('STORE');
    expect(decision.rejectedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: 'MOVE_TO_MARKET', reason: 'Transport unavailable' })
    ]));
  });

  it('Critical spoilage risk forces SELL_NOW immediately', () => {
    let state = createInitialFarmState();
    state = {
      ...state,
      farm: {
        ...state.farm,
        harvest: [{
          ...state.farm.harvest[0],
          spoilageRiskPercent: { ...state.farm.harvest[0].spoilageRiskPercent, value: 45 },
        }],
      },
    };
    const decision = evaluateHarvestDecision(state);
    expect(decision.selectedAction).toBe('SELL_NOW');
    expect(decision.urgency).toBe('CRITICAL');
  });
});

// ─── E2E SCENARIO JOURNEY TESTS (§58 Demo Journey) ──────────────────────────

describe('E2E Demo Journey — Spec §58', () => {
  let baseState: FarmState;

  beforeEach(() => {
    baseState = createInitialFarmState();
  });

  // ── Scenario 1: irrigation-rain-delay ──────────────────────────────────────

  describe('Scenario 1: Resource Saver (irrigation-rain-delay)', () => {
    it('Phase A: High rain probability → engine decides WAIT', () => {
      // Initial state: soil=34%, rain=78%
      const state: FarmState = {
        ...baseState,
        farm: {
          ...baseState.farm,
          soil: {
            ...baseState.farm.soil,
            moisture: { value: 34, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
            sensorStatus: 'LIVE',
          },
          weather: {
            ...baseState.farm.weather,
            rainProbability: { value: 78, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
            expectedRainfall: { value: 22, unit: 'mm', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
          },
          connectedSystems: { ...baseState.farm.connectedSystems, soilSensor: true },
        },
      };
      const decision = evaluateIrrigationDecision(state);
      expect(decision.selectedAction).toBe('WAIT');
      expect(decision.confidence).toBe('HIGH');
      // observations contains string like "Rain probability: 78%"
      expect(decision.observations.some(o => o.toLowerCase().includes('rain probability'))).toBe(true);
    });

    it('Phase B: FarmState event sets soil moisture correctly', () => {
      const event: FarmEvent = {
        eventId: 'e-test-001',
        timestamp: new Date().toISOString(),
        type: 'SENSOR_READING',
        payload: { moisture: 27, temperature: 36 },
        sourceType: 'SIMULATED',
      };
      const newState = applyEventToFarmState(baseState, event);
      expect(newState.farm.soil.moisture.value).toBe(27);
    });

    it('Phase C: Low rain + low soil → engine decides IRRIGATE', () => {
      const state: FarmState = {
        ...baseState,
        farm: {
          ...baseState.farm,
          soil: {
            ...baseState.farm.soil,
            moisture: { value: 27, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
            sensorStatus: 'LIVE',
          },
          weather: {
            ...baseState.farm.weather,
            rainProbability: { value: 12, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
            expectedRainfall: { value: 2, unit: 'mm', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
          },
          connectedSystems: { ...baseState.farm.connectedSystems, soilSensor: true },
        },
      };
      const decision = evaluateIrrigationDecision(state);
      expect(decision.selectedAction).toBe('IRRIGATE');
    });

    it('Phase D: Pump ON event sets irrigation pumpStatus', () => {
      const event: FarmEvent = {
        eventId: 'e-test-pump-on',
        timestamp: new Date().toISOString(),
        type: 'IRRIGATION_START',
        payload: { method: 'drip', pumpStatus: 'ON' },
        sourceType: 'SIMULATED',
      };
      const newState = applyEventToFarmState(baseState, event);
      expect(newState.farm.irrigation.pumpStatus).toBe('ON');
    });

    it('Phase E: Sensor rising sequence — moisture increments applied via events', () => {
      let state = baseState;
      const moistureReadings = [29, 32, 35];
      for (const reading of moistureReadings) {
        const event: FarmEvent = {
          eventId: `e-moisture-${reading}`,
          timestamp: new Date().toISOString(),
          type: 'SENSOR_READING',
          payload: { moisture: reading, temperature: 36 },
          sourceType: 'SIMULATED',
        };
        state = applyEventToFarmState(state, event);
      }
      expect(state.farm.soil.moisture.value).toBe(35);
    });

    it('Phase F: Pump OFF event when moisture target reached', () => {
      const event: FarmEvent = {
        eventId: 'e-test-pump-off',
        timestamp: new Date().toISOString(),
        type: 'IRRIGATION_STOP',
        payload: { reason: 'TARGET_REACHED', finalMoisture: 35 },
        sourceType: 'SIMULATED',
      };
      const newState = applyEventToFarmState(baseState, event);
      expect(newState.farm.irrigation.pumpStatus).toBe('OFF');
    });
  });

  // ── Scenario 2: harvest-market-shift ──────────────────────────────────────

  describe('Scenario 2: Harvest Protector (harvest-market-shift)', () => {
    it('Initial: Move to Market B for higher net value', () => {
      // Transport available, Market B higher price
      const state: FarmState = {
        ...baseState,
        farm: {
          ...baseState.farm,
          logistics: { ...baseState.farm.logistics, transportAvailable: true },
        },
      };
      const decision = evaluateHarvestDecision(state);
      // Should not immediately force storage if transport is available
      expect(['MOVE_TO_MARKET', 'SELL_NOW', 'WAIT']).toContain(decision.selectedAction);
    });

    it('Transport delay → engine re-evaluates to STORE', () => {
      const state: FarmState = {
        ...baseState,
        farm: {
          ...baseState.farm,
          logistics: {
            ...baseState.farm.logistics,
            transportAvailable: false,
            delayReason: 'Road blockage',
          },
        },
      };
      const decision = evaluateHarvestDecision(state);
      expect(decision.selectedAction).toBe('STORE');
    });
  });

  // ── Scenario 3: heat-risk ─────────────────────────────────────────────────

  describe('Scenario 3: Climate Defender (heat-risk)', () => {
    it('36°C with 8% rain → detects rising heat risk', () => {
      const state: FarmState = {
        ...baseState,
        farm: {
          ...baseState.farm,
          soil: {
            ...baseState.farm.soil,
            moisture: { value: 28, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
          },
          weather: {
            ...baseState.farm.weather,
            temperature: { value: 36, unit: '°C', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
            rainProbability: { value: 8, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
          },
        },
      };
      const decision = evaluateClimateDecision(state);
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(decision.urgency);
      expect(decision.selectedAction).not.toBe('WAIT');
    });

    it('41°C with low soil moisture → CRITICAL heat risk response', () => {
      const state: FarmState = {
        ...baseState,
        farm: {
          ...baseState.farm,
          soil: {
            ...baseState.farm.soil,
            moisture: { value: 22, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
          },
          weather: {
            ...baseState.farm.weather,
            temperature: { value: 41, unit: '°C', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
            rainProbability: { value: 5, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
          },
        },
      };
      const decision = evaluateClimateDecision(state);
      expect(['HIGH', 'CRITICAL']).toContain(decision.urgency);
    });
  });

  // ── Scenario 4: cross-shield-day ─────────────────────────────────────────

  describe('Scenario 4: Cross-Shield Day — one brain, not three apps', () => {
    it('Heat wave event updates FarmState weather correctly', () => {
      const event: FarmEvent = {
        eventId: 'e-heat-wave',
        timestamp: new Date().toISOString(),
        type: 'TEMPERATURE_CHANGE',
        payload: { temperature: 41 },
        sourceType: 'SIMULATED',
      };
      const newState = applyEventToFarmState(baseState, event);
      expect(newState.farm.weather.temperature.value).toBe(41);
    });

    it('Climate alert event is applied to FarmState', () => {
      const event: FarmEvent = {
        eventId: 'e-climate-alert',
        timestamp: new Date().toISOString(),
        type: 'CLIMATE_ALERT',
        payload: { alertType: 'HEAT_STRESS', severity: 'HIGH', crop: 'tomato' },
        sourceType: 'SIMULATED',
      };
      const newState = applyEventToFarmState(baseState, event);
      // CLIMATE_ALERT events are handled by AppContext for side effects;
      // applyEventToFarmState returns the state unchanged (immutably) — state is still valid
      expect(newState.farmer.farmerId).toBe(baseState.farmer.farmerId);
      expect(newState.farm.crop.cropType).toBe(baseState.farm.crop.cropType);
    });

    it('Low moisture + heat wave → BOTH irrigation AND climate decisions are urgent', () => {
      const state: FarmState = {
        ...baseState,
        farm: {
          ...baseState.farm,
          soil: {
            ...baseState.farm.soil,
            moisture: { value: 24, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
            sensorStatus: 'LIVE',
          },
          weather: {
            ...baseState.farm.weather,
            temperature: { value: 41, unit: '°C', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
            rainProbability: { value: 5, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
          },
          connectedSystems: { ...baseState.farm.connectedSystems, soilSensor: true },
        },
      };
      const irrigDecision = evaluateIrrigationDecision(state);
      const climateDecision = evaluateClimateDecision(state);
      // Both should be urgent — the cross-shield scenario
      expect(irrigDecision.selectedAction).toBe('IRRIGATE');
      expect(['HIGH', 'CRITICAL']).toContain(climateDecision.urgency);
    });

    it('FarmPriorityEngine (§20) handles multiple concurrent risks', () => {
      const state: FarmState = {
        ...baseState,
        farm: {
          ...baseState.farm,
          soil: {
            ...baseState.farm.soil,
            moisture: { value: 23, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
            sensorStatus: 'LIVE',
          },
          weather: {
            ...baseState.farm.weather,
            temperature: { value: 40, unit: '°C', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
            rainProbability: { value: 6, unit: '%', timestamp: new Date().toISOString(), sourceType: 'SIMULATED' },
          },
          connectedSystems: { ...baseState.farm.connectedSystems, soilSensor: true },
        },
      };
      const priority = evaluateFarmPriority(state);
      expect(priority).toBeDefined();
      // PriorityResult has nextBestAction field
      expect(priority.nextBestAction).toBeTruthy();
      expect(['IRRIGATE', 'PREPARE', 'PREPARE_FOR_HEAT', 'MONITOR', 'WAIT']).toContain(priority.nextBestAction);
      expect(priority.urgency).toBeTruthy();
      expect(priority.shieldType).toBeTruthy();
    });
  });
});
