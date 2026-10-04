// =============================================================================
// FARMKIND — IMPACT CALCULATION ENGINE
// Pure mathematical & agronomic formulas based on FAO-56 standards.
// Every value is CALCULATED, REFERENCE, or an explicit ASSUMED component.
// =============================================================================

import type { DataPoint, SourceType } from '../domain/types';

// ─── FARM DIMENSIONS ─────────────────────────────────────────────────────────

export const FARM_AREA_ACRES = 3.5;
// 1 acre = 4046.8564224 m² → 3.5 acres = 14,164 m² (1.4164 ha)
export const FARM_AREA_HECTARES = Number((FARM_AREA_ACRES * 0.4046856).toFixed(4)); // 1.4164 ha
export const FARM_AREA_M2 = Math.round(FARM_AREA_ACRES * 4046.8564);               // 14,164 m²

// ─── REFERENCE & ASSUMED CONSTANTS ───────────────────────────────────────────

export const ETo = 6.0;          // mm/day (REFERENCE: semi-arid hot season reference ET, FAO-56)
export const TOMATO_KC = 1.15;   // REFERENCE: mid-season tomato crop coefficient (FAO-56 Table 12)
export const SURFACE_EFFICIENCY = 0.60;   // REFERENCE: unlined furrow/basin flood irrigation efficiency
export const DRIP_EFFICIENCY = 0.90;      // REFERENCE: pressurized inline drip emitter efficiency

// Diesel Pump & Hydraulic Assumptions (Typical 5 HP agricultural pump set)
export const PUMP_RATED_HP = 5.0;         // HP (REFERENCE: standard smallholder diesel pump)
export const PUMP_FLOW_L_PER_HOUR = 35000;// L/hr (REFERENCE/ASSUMED: 35 m³/hr high-discharge open-well pump)
export const DIESEL_BURN_RATE_L_HR = 1.20;// L/hr (REFERENCE: 240 g/kWh specific fuel consumption for 5 HP diesel)
export const DIESEL_PRICE_PER_L = 95.00;  // ₹/L (REFERENCE: regional agricultural retail diesel price)

// Explicit ASSUMED maintenance, oil & servicing costs (NOT buried in unexplained constants)
export const DIESEL_MAINTENANCE_OIL_MONTHLY = 2500; // ₹/month (ASSUMED: SAE 20W-40 oil top-up, filter, mechanic)
export const SHARED_SOLAR_MONTHLY = 6000;          // ₹/month (ASSUMED: pay-per-use community micro-grid fee model)

// ─── WATER EQUATIONS (FAO-56) ────────────────────────────────────────────────

/**
 * Crop Evapotranspiration: ETc = ETo × Kc (mm/day)
 */
export function calcETc(eto: number, kc: number): number {
  return Number((eto * kc).toFixed(2));
}

/**
 * Net crop water requirement in Liters/day for the given area
 * 1 mm of depth on 1 m² = 1 Liter
 */
export function calcNetWaterLitersDay(etcMmDay: number, areaM2: number): number {
  return Math.round((etcMmDay / 1000) * areaM2 * 1000);
}

/**
 * Gross water required for flood irrigation (accounting for 60% surface efficiency)
 */
export function calcGrossWaterFlood(netLitersDay: number): number {
  return Math.round(netLitersDay / SURFACE_EFFICIENCY);
}

/**
 * Gross water required for drip irrigation (accounting for 90% drip efficiency)
 */
export function calcGrossWaterDrip(netLitersDay: number): number {
  return Math.round(netLitersDay / DRIP_EFFICIENCY);
}

/**
 * Monthly water volume for 30 days
 */
export function calcMonthlyWater(dailyLiters: number): number {
  return Math.round(dailyLiters * 30);
}

// ─── DIESEL PUMPING & COST EQUATIONS ─────────────────────────────────────────

/**
 * Pumping hours required to pump a given volume of water
 * Hours = Volume (L) / Pump Flow Rate (L/hr)
 */
export function calcPumpHours(volumeLiters: number, flowLph: number = PUMP_FLOW_L_PER_HOUR): number {
  return Number((volumeLiters / flowLph).toFixed(2));
}

/**
 * Monthly diesel fuel consumption connected directly to water requirements:
 * Monthly Diesel (L) = Monthly Pumping Hours × Diesel Burn Rate (L/hr)
 */
export function calcMonthlyDieselLiters(
  monthlyWaterLiters: number,
  flowLph: number = PUMP_FLOW_L_PER_HOUR,
  burnRateLph: number = DIESEL_BURN_RATE_L_HR
): number {
  const hours = calcPumpHours(monthlyWaterLiters, flowLph);
  return Number((hours * burnRateLph).toFixed(2));
}

/**
 * Total monthly diesel operating cost = Fuel Cost + Explicit Maintenance/Oil Cost
 */
export function calcMonthlyDieselTotalCost(
  dieselLiters: number,
  fuelPricePerL: number = DIESEL_PRICE_PER_L,
  maintenanceCost: number = DIESEL_MAINTENANCE_OIL_MONTHLY
): { fuelCost: number; maintenanceCost: number; totalCost: number } {
  const fuelCost = Math.round(dieselLiters * fuelPricePerL);
  const totalCost = fuelCost + maintenanceCost;
  return { fuelCost, maintenanceCost, totalCost };
}

// Backward-compatible helpers
export function calcMonthlyDieselFlood(): number {
  return DIESEL_MONTHLY_L;
}

export function calcMonthlyDieselCost(): number {
  return DIESEL_MONTHLY_COST;
}

// ─── DERIVED BASELINE VALUES (RECALCULATED FROM FORMULAS) ─────────────────────

export const ETc_CALC = calcETc(ETo, TOMATO_KC); // 6.90 mm/day
export const NET_DAILY_L = calcNetWaterLitersDay(ETc_CALC, FARM_AREA_M2); // 97,732 L/day

export const FLOOD_DAILY_L = calcGrossWaterFlood(NET_DAILY_L); // 162,886 L/day
export const DRIP_DAILY_L = calcGrossWaterDrip(NET_DAILY_L);   // 108,591 L/day

export const FLOOD_MONTHLY_L = calcMonthlyWater(FLOOD_DAILY_L); // 4,886,580 L/month (~4.89M L)
export const DRIP_MONTHLY_L = calcMonthlyWater(DRIP_DAILY_L);   // 3,257,720 L/month (~3.26M L)
export const WATER_SAVED_L = FLOOD_MONTHLY_L - DRIP_MONTHLY_L; // 1,628,860 L/month (33.33% reduction)
export const WATER_SAVED_PERCENT = Number(((WATER_SAVED_L / FLOOD_MONTHLY_L) * 100).toFixed(1)); // 33.3%

// Monthly Pumping Hours derived from water requirement and pump capacity
export const FLOOD_MONTHLY_PUMP_HOURS = calcPumpHours(FLOOD_MONTHLY_L, PUMP_FLOW_L_PER_HOUR); // 139.62 hours
export const DRIP_MONTHLY_PUMP_HOURS = calcPumpHours(DRIP_MONTHLY_L, PUMP_FLOW_L_PER_HOUR);   // 93.08 hours
export const DIESEL_MONTHLY_L = calcMonthlyDieselLiters(FLOOD_MONTHLY_L, PUMP_FLOW_L_PER_HOUR, DIESEL_BURN_RATE_L_HR); // 167.54 L

const dieselCostBreakdown = calcMonthlyDieselTotalCost(DIESEL_MONTHLY_L, DIESEL_PRICE_PER_L, DIESEL_MAINTENANCE_OIL_MONTHLY);
export const DIESEL_FUEL_COST_MONTHLY = dieselCostBreakdown.fuelCost;       // ₹15,916
export const DIESEL_MONTHLY_COST = dieselCostBreakdown.totalCost;           // ₹18,416 (Fuel + ₹2,500 maintenance)

export const COST_DIFFERENCE = DIESEL_MONTHLY_COST - SHARED_SOLAR_MONTHLY; // ₹12,416 / month

// Complete baseline structure consumable across UI screens
export const CALCULATED_BASELINE = {
  areaAcres: FARM_AREA_ACRES,
  areaHectares: FARM_AREA_HECTARES,
  areaM2: FARM_AREA_M2,
  cropType: 'Tomato',
  cropKc: TOMATO_KC,
  referenceEto: ETo,
  cropEtc: ETc_CALC,
  netDailyWaterL: NET_DAILY_L,
  floodGrossDailyL: FLOOD_DAILY_L,
  dripGrossDailyL: DRIP_DAILY_L,
  floodMonthlyWaterL: FLOOD_MONTHLY_L,
  dripMonthlyWaterL: DRIP_MONTHLY_L,
  monthlyWaterSavedL: WATER_SAVED_L,
  waterReductionPercent: WATER_SAVED_PERCENT,
  pumpFlowLph: PUMP_FLOW_L_PER_HOUR,
  monthlyPumpHours: FLOOD_MONTHLY_PUMP_HOURS,
  dieselBurnRateLph: DIESEL_BURN_RATE_L_HR,
  monthlyDieselLiters: DIESEL_MONTHLY_L,
  dieselRetailPricePerL: DIESEL_PRICE_PER_L,
  monthlyFuelCost: DIESEL_FUEL_COST_MONTHLY,
  monthlyMaintenanceCost: DIESEL_MAINTENANCE_OIL_MONTHLY,
  totalMonthlyDieselCost: DIESEL_MONTHLY_COST,
  sharedSolarMonthlyCost: SHARED_SOLAR_MONTHLY,
  monthlyCostDifference: COST_DIFFERENCE,
  // Annualized values
  annualWaterSavedL: WATER_SAVED_L * 12,
  annualDieselSavedL: Number((DIESEL_MONTHLY_L * 12).toFixed(1)),
  annualCostDifference: COST_DIFFERENCE * 12,
  annualDieselOperatingCost: DIESEL_MONTHLY_COST * 12,
  annualSharedSolarCost: SHARED_SOLAR_MONTHLY * 12,
};

// ─── HARVEST ECONOMICS ───────────────────────────────────────────────────────

export interface HarvestEconomics {
  quantityKg: number;
  marketPrice: number;    // ₹/kg
  transportCostPerKg: number;
  storageCostPerKg: number;
  expectedLossFraction: number; // 0-1
  grossRevenue: number;
  netRevenue: number;
  transportCost: number;
  storageCost: number;
  spoilageLoss: number;
}

export function calcHarvestEconomics(
  quantityKg: number,
  marketPricePerKg: number,
  distanceKm: number,
  storageHours: number,
  spoilageRiskPercent: number,
  delayHours: number = 0
): HarvestEconomics {
  const transportCostPerKg = distanceKm * 0.08; // ₹0.08/kg/km ASSUMED freight rate
  const storageCostPerKg = storageHours * 0.075;// ₹0.075/kg/day equivalent (₹1.5/crate/day for 20kg crate)
  const delayRisk = delayHours * 0.02;          // 2% per hour delay risk ASSUMED

  const totalRisk = Math.min(1, spoilageRiskPercent / 100 + delayRisk);
  const expectedLossFraction = totalRisk;

  const grossRevenue = marketPricePerKg * quantityKg;
  const transportCost = Math.round(transportCostPerKg * quantityKg);
  const storageCost = Math.round(storageCostPerKg * quantityKg);
  const spoilageLoss = Math.round(expectedLossFraction * marketPricePerKg * quantityKg);

  return {
    quantityKg,
    marketPrice: marketPricePerKg,
    transportCostPerKg,
    storageCostPerKg,
    expectedLossFraction,
    grossRevenue,
    netRevenue: grossRevenue - transportCost - storageCost - spoilageLoss,
    transportCost,
    storageCost,
    spoilageLoss,
  };
}

// ─── HELPER: DATA POINT ──────────────────────────────────────────────────────

export function dp<T>(
  value: T,
  unit: string,
  sourceType: SourceType,
  label?: string,
  confidence = 0.9
): DataPoint<T> {
  return {
    value,
    unit,
    timestamp: new Date().toISOString(),
    sourceType,
    confidence,
    label,
  };
}

// ─── FORMATTER ───────────────────────────────────────────────────────────────

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatLiters(liters: number): string {
  if (liters >= 1_000_000) {
    return `${(liters / 1_000_000).toFixed(2)}M L`;
  }
  if (liters >= 1000) {
    return `${(liters / 1000).toFixed(1)}K L`;
  }
  return `${Math.round(liters)} L`;
}
