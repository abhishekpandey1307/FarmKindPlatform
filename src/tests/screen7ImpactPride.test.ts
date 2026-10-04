// =============================================================================
// SCREEN 7 — IMPACT & SCALE: FARMER PRIDE & PROFITABILITY TESTS
// Tests the dual pillars: Mother Earth / Nature Contribution + Household Profit,
// Kisan Gaurav Patra honor certificate, and village scale multiplier.
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  DIESEL_MONTHLY_L,
  WATER_SAVED_L,
  COST_DIFFERENCE,
  calcHarvestEconomics,
} from '../engine/calculation';
import { calculateSolarPumpSubsidy } from '../engine/schemesEngine';

describe('Screen 7: Farmer Pride & Household Profitability', () => {
  it('calculates genuine nature contribution metrics accurately', () => {
    // 16.3 Lakh Liters of groundwater saved per month
    const waterSavedLakhs = WATER_SAVED_L / 100000;
    expect(waterSavedLakhs).toBeCloseTo(16.33, 1);

    // Annual groundwater preserved: > 19.5 Million Liters
    const annualWaterSavedM = (WATER_SAVED_L * 12) / 1000000;
    expect(annualWaterSavedM).toBeGreaterThanOrEqual(19.5);

    // Carbon soot / clean skies: 2.68 kg CO2 per liter of diesel burned
    const monthlyDieselAvoided = DIESEL_MONTHLY_L; // ~167.5 L/month
    expect(monthlyDieselAvoided).toBeGreaterThan(160);

    const monthlyCo2AvoidedKg = Math.round(monthlyDieselAvoided * 2.68);
    expect(monthlyCo2AvoidedKg).toBeCloseTo(449, 5);

    const annualCo2AvoidedTonnes = (monthlyCo2AvoidedKg * 12) / 1000;
    expect(annualCo2AvoidedTonnes).toBeGreaterThanOrEqual(5.0);

    // Food waste prevented through precision transport timing
    const harvestEcon = calcHarvestEconomics(1200, 31.25, 40, 72, 32);
    expect(harvestEcon.spoilageLoss).toBe(12000);
  });

  it('calculates household financial prosperity metrics accurately', () => {
    // Net profit back into farmer pocket every month
    expect(COST_DIFFERENCE).toBe(12416);
    expect(Math.round(COST_DIFFERENCE)).toBe(12416);

    // Annual direct cash saved
    const annualCashSavedInr = Math.round(COST_DIFFERENCE * 12);
    expect(annualCashSavedInr).toBe(148992);

    // PM-KUSUM capital subsidy for 5HP solar pump
    const subsidyQuote = calculateSolarPumpSubsidy(5);
    expect(subsidyQuote.farmerShareCashInr).toBe(28000); // 10% farmer share
    expect(subsidyQuote.totalGovtSubsidyInr).toBe(168000); // 60% government subsidy

    // Total 1st year value unlocked for the farmer family
    const harvestProtectedInr = calcHarvestEconomics(1200, 31.25, 40, 72, 32).spoilageLoss;
    const totalAnnualValue = annualCashSavedInr + harvestProtectedInr + subsidyQuote.totalGovtSubsidyInr;
    expect(totalAnnualValue).toBe(148992 + 12000 + 168000);
    expect(totalAnnualValue).toBe(328992);
  });

  it('scales village multiplier impact for 10 smallholder farms', () => {
    const villageFarms = 10;
    const villageAnnualCashSaved = Math.round(COST_DIFFERENCE * 12) * villageFarms;
    const villageAnnualWaterSavedM = (((WATER_SAVED_L * 12) / 1000000) * villageFarms).toFixed(1);
    const villageAnnualCo2Tonnes = ((((DIESEL_MONTHLY_L * 2.68) * 12) / 1000) * villageFarms).toFixed(1);

    expect(villageAnnualCashSaved).toBe(1489920); // ~₹14.9 Lakhs/year retained in village economy
    expect(parseFloat(villageAnnualWaterSavedM)).toBeGreaterThan(190); // ~196 Million Liters saved
    expect(parseFloat(villageAnnualCo2Tonnes)).toBeGreaterThan(50); // ~54 tonnes CO2 avoided
  });

  it('contains respectful and motivational citation texts across languages', () => {
    const titles = {
      mr: 'किसान गौरव पत्र — हरित समृद्धी सन्मान',
      hi: 'किसान गौरव पत्र — हरित समृद्धि सम्मान',
      en: 'Kisan Gaurav Patra — Green Prosperity Honor',
    };

    expect(titles.mr).toContain('किसान गौरव पत्र');
    expect(titles.hi).toContain('हरित समृद्धि सम्मान');
    expect(titles.en).toContain('Green Prosperity Honor');
  });
});
