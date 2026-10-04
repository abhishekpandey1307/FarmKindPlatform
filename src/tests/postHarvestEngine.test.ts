// =============================================================================
// FARMKIND — SMART AI POST-HARVEST DECISION ENGINE TESTS
// Tests for MONITOR → UNDERSTAND → DECIDE → ACT
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  monitorProduceCondition,
  understandProduceRisk,
  decideNextBestAction,
  actuateDecision,
  executePostHarvestPipeline,
  DEFAULT_MARKET_OPTIONS,
} from '../engine/postHarvestEngine';

describe('Smart AI Post-Harvest Decision Engine (MONITOR → UNDERSTAND → DECIDE → ACT)', () => {
  // ─── 1. MONITOR STAGE TESTS ───────────────────────────────────────────────
  describe('1. 👁️ Monitor — Produce & In-Transit Telemetry', () => {
    it('captures raw sensor telemetry for 1,000 kg tomatoes at Pune', () => {
      const telemetry = monitorProduceCondition({
        cropType: 'Tomatoes',
        quantityKg: 1000,
        temperatureC: 32,
        humidityPercent: 70,
        location: 'Pune Field Gate',
        timeSinceHarvestHours: 5,
        storageCondition: 'OPEN_TRUCK',
        transportStatus: 'DELAYED',
        delayHours: 3,
        distanceToTargetKm: 80,
      });

      expect(telemetry.cropType).toBe('Tomatoes');
      expect(telemetry.quantityKg).toBe(1000);
      expect(telemetry.temperatureC).toBe(32);
      expect(telemetry.humidityPercent).toBe(70);
      expect(telemetry.location).toBe('Pune Field Gate');
      expect(telemetry.timeSinceHarvestHours).toBe(5);
      expect(telemetry.transportStatus).toBe('DELAYED');
      expect(telemetry.delayHours).toBe(3);
      expect(telemetry.distanceToTargetKm).toBe(80);
    });
  });

  // ─── 2. UNDERSTAND STAGE TESTS ─────────────────────────────────────────────
  describe('2. 🧠 Understand — Risk & Physiology Interpretation', () => {
    it('interprets heat stress on 1,000 kg tomatoes with delay as HIGH risk', () => {
      const telemetry = monitorProduceCondition({
        cropType: 'Tomatoes',
        quantityKg: 1000,
        temperatureC: 32,
        humidityPercent: 70,
        location: 'Pune',
        timeSinceHarvestHours: 5,
        delayHours: 3,
        distanceToTargetKm: 80,
      });

      const understand = understandProduceRisk(telemetry);

      expect(understand.isAtRisk).toBe(true);
      expect(understand.respirationRateMultiplier).toBeGreaterThan(1.5);
      expect(understand.meaningForProduce).toContain('softening');
      expect(understand.meaningForProduce).toContain('threshold');
      expect(understand.journeySummary).toContain('1000 kg Tomatoes');
    });

    it('identifies safe conditions under controlled pre-cooling', () => {
      const telemetry = monitorProduceCondition({
        cropType: 'Tomatoes',
        quantityKg: 1000,
        temperatureC: 14,
        humidityPercent: 88,
        location: 'Pimpalgaon Hub',
        timeSinceHarvestHours: 8,
        storageCondition: 'CONTROLLED_STORAGE',
        transportStatus: 'ON_TIME',
        delayHours: 0,
        distanceToTargetKm: 25,
      });

      const understand = understandProduceRisk(telemetry);

      expect(understand.riskLevel).toBe('LOW');
      expect(understand.isAtRisk).toBe(false);
      expect(understand.deteriorationVelocityPercent).toBeLessThan(15);
      expect(understand.safeShelfLifeRemainingHours).toBeGreaterThan(60);
    });
  });

  // ─── 3. DECIDE STAGE TESTS ─────────────────────────────────────────────────
  describe('3. ❄️ Decide — Next Best Action Determination', () => {
    it('decides MOVE_TO_CONTROLLED_STORAGE when temperature hits critical 35.8°C', () => {
      const telemetry = monitorProduceCondition({
        cropType: 'Bananas',
        quantityKg: 850,
        temperatureC: 35.8,
        humidityPercent: 76,
        location: 'Highway NH53',
        timeSinceHarvestHours: 36,
        storageCondition: 'OPEN_TRUCK',
        transportStatus: 'DELAYED',
        delayHours: 4,
      });

      const decision = decideNextBestAction(telemetry);

      expect(decision.selectedAction).toBe('MOVE_TO_CONTROLLED_STORAGE');
      expect(decision.urgency).toBe('CRITICAL');
      expect(decision.targetDestination?.type).toBe('CONTROLLED_STORAGE');
      expect(decision.projectedOutcome.wastePreventedKg).toBeGreaterThan(350);
      expect(decision.rejectedActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'CONTINUE_TRANSPORTATION' }),
        ])
      );
    });

    it('decides PRIORITIZE_CLOSER_HIGH_DEMAND_MARKET when Market A is 30km High Demand vs target 100km Low Demand', () => {
      const telemetry = monitorProduceCondition({
        cropType: 'Tomatoes',
        quantityKg: 1000,
        temperatureC: 28,
        humidityPercent: 72,
        location: 'Rural Outskirts',
        timeSinceHarvestHours: 4,
        storageCondition: 'OPEN_TRUCK',
        transportStatus: 'ON_TIME',
        delayHours: 0,
        distanceToTargetKm: 100,
        targetMarketName: 'Market B — Mumbai Vashi',
      });

      const decision = decideNextBestAction(telemetry, DEFAULT_MARKET_OPTIONS);

      expect(decision.selectedAction).toBe('PRIORITIZE_CLOSER_HIGH_DEMAND_MARKET');
      expect(decision.targetDestination?.name).toContain('Market A');
      expect(decision.targetDestination?.distanceKm).toBe(30);
      expect(decision.explanation).toContain('Prioritize closer high-demand market');
      expect(decision.hindiReason).toContain('नजदीकी अधिक मांग वाली मंडी');
    });

    it('decides CONTINUE_TRANSPORTATION when temperature and transit conditions are acceptable', () => {
      const telemetry = monitorProduceCondition({
        cropType: 'Tomatoes',
        quantityKg: 1000,
        temperatureC: 22,
        humidityPercent: 80,
        location: 'Highway Waypoint',
        timeSinceHarvestHours: 3,
        storageCondition: 'REEFER',
        transportStatus: 'ON_TIME',
        delayHours: 0,
        distanceToTargetKm: 40,
        targetMarketName: 'Pimpalgaon APMC',
      });

      const decision = decideNextBestAction(telemetry);

      expect(decision.selectedAction).toBe('CONTINUE_TRANSPORTATION');
      expect(decision.urgency).toBe('LOW');
      expect(decision.explanation).toContain('Continue transportation as planned');
    });
  });

  // ─── 4. ACT STAGE TESTS ───────────────────────────────────────────────────
  describe('4. 🚚 Act — Execute Decisions & Alert Logistics', () => {
    it('generates dispatch alert, driver SMS, and GPS waypoint for controlled storage', () => {
      const telemetry = monitorProduceCondition({
        cropType: 'Bananas',
        quantityKg: 850,
        temperatureC: 35.8,
        location: 'Highway NH53',
      });

      const decision = decideNextBestAction(telemetry);
      const actionResult = actuateDecision(decision, telemetry);

      expect(actionResult.actionType).toBe('MOVE_TO_CONTROLLED_STORAGE');
      expect(actionResult.status).toBe('TRIGGERED');
      expect(actionResult.alertTitle).toContain('CRITICAL INTERCEPT');
      expect(actionResult.smsDispatchPreview).toContain('[FarmKind Smart Engine Alert]');
      expect(actionResult.navigationTarget).toContain('GPS://');
      expect(actionResult.logisticsExecutionPlan).toContain('Solar Cold Room');
    });
  });

  // ─── 5. FULL PIPELINE & 1,000 BANANAS STORYLINE ────────────────────────────
  describe('5. Full Pipeline & 1,000 Bananas Scenario', () => {
    it('executes full MONITOR → UNDERSTAND → DECIDE → ACT pipeline seamlessly', () => {
      const result = executePostHarvestPipeline({
        cropType: '1,000 Bananas',
        quantityKg: 850,
        temperatureC: 36,
        humidityPercent: 78,
        location: 'Jalgaon Transit Corridor',
        timeSinceHarvestHours: 36,
        delayHours: 4,
        distanceToTargetKm: 95,
      });

      expect(result.telemetry.quantityKg).toBe(850);
      expect(result.understand.isAtRisk).toBe(true);
      expect(result.understand.respirationRateMultiplier).toBeGreaterThan(2.0);
      expect(result.decision.selectedAction).toBe('MOVE_TO_CONTROLLED_STORAGE');
      expect(result.decision.projectedOutcome.wastePreventedKg).toBeGreaterThan(400);
      expect(result.act.alertTitle).toContain('CRITICAL INTERCEPT');
      expect(result.act.smsDispatchPreview).toBeDefined();
    });
  });
});
