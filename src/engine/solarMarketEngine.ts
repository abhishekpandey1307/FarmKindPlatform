// =============================================================================
// FARMKIND — AFFORDABLE SHARED SOLAR & MARKET CONNECT ENGINE
// Renewable + affordable shared equipment models + direct-to-buyer sales
// Solves smallholder economic barrier: pay-per-use solar instead of capital debt
// =============================================================================

import type { VerificationStatus, DataFreshness } from '../domain/types';
import {
  WATER_SAVED_L,
  FLOOD_MONTHLY_PUMP_HOURS,
  DRIP_MONTHLY_PUMP_HOURS,
  DIESEL_MONTHLY_COST,
  formatINR,
} from './calculation';

export type SolarAssetType =
  | 'SHARED_SOLAR_PUMP'
  | 'SOLAR_COLD_STORAGE'
  | 'SOLAR_SPRAYER'
  | 'SOLAR_DRYER';

export interface SolarAssetListing {
  assetId: string;
  type: SolarAssetType;
  title: string;
  ownerHub: string;
  distanceKm: number;
  capacityDescription: string;
  hourlyOrDailyRateInr: number;
  rateUnit: 'PER_HOUR' | 'PER_DAY' | 'PER_CRATE_DAY';
  equivalentDieselCostInr: number;
  carbonAvoidedKgPerUnit: number;
  currentLiveStatus: 'AVAILABLE' | 'IN_USE' | 'RESERVED' | 'MAINTENANCE' | 'UNKNOWN';
  liveSolarOutputKw: number;
  solarOutputCalculationNote?: string;
  nextAvailableSlot: string;
  ratingStars: number;
  totalSmallFarmersServed: number;
  features: string[];
  verificationStatus: VerificationStatus;
  source: string;
  sourceUrl?: string;
  lastVerified: string;
  freshness: DataFreshness;
}

export interface SolarBookingOrder {
  bookingId: string;
  assetId: string;
  farmerId: string;
  assetTitle: string;
  slotStartTime: string;
  durationUnits: number; // hours or days or crates
  unitType: 'HOURS' | 'DAYS' | 'CRATE_DAYS';
  totalPriceInr: number;
  dieselDisplacedLiters: number;
  costSavedVsDieselInr: number;
  carbonAvoidedKg: number;
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  waterDischargedLiters?: number;
  bookedAt: string;
}

export interface MarketBuyerListing {
  buyerId: string;
  organizationName: string;
  buyerType: 'FPO_COLLECTIVE' | 'RETAIL_CHAIN' | 'DIRECT_EXPORTER' | 'LOCAL_TRADER_CONSORTIUM';
  location: string;
  distanceKm: number;
  offeringPricePerKg: number;
  minimumGrade: 'A' | 'B' | 'C';
  targetCommodity: string;
  dailyDemandKg: number;
  farmgatePickupAvailable: boolean;
  paymentTerms: 'IMMEDIATE_UPI_DBT' | 'SAME_DAY_CASH' | 'T_PLUS_1';
  rating: number;
  activeContractsCount: number;
  verificationStatus: VerificationStatus;
  source: string;
  sourceUrl?: string;
  lastVerified: string;
  freshness: DataFreshness;
}

export interface DirectSaleContract {
  contractId: string;
  farmerId: string;
  buyerId: string;
  buyerName: string;
  commodity: string;
  quantityKg: number;
  lockedPricePerKg: number;
  totalPayoutInr: number;
  pickupDate: string;
  pickupLocation: string;
  status: 'PENDING_PICKUP' | 'IN_TRANSIT' | 'WEIGHED_AND_VERIFIED' | 'PAID';
  paymentMethod: string;
  savingsVsMiddlemanCommissionInr: number;
  createdAt: string;
}

// ─── SHARED SOLAR ASSET REPOSITORY ───────────────────────────────────────────

export const SHARED_SOLAR_CATALOG: SolarAssetListing[] = [
  {
    assetId: 'solar-pump-hub-01',
    type: 'SHARED_SOLAR_PUMP',
    title: '5 HP Community Solar Micro-Grid Pump',
    ownerHub: 'Patil Wasti Solar Collective (Cluster #3)',
    distanceKm: 0.8,
    capacityDescription: '5 HP AC Submersible + 4.8 kW Bifacial Array + VFD',
    hourlyOrDailyRateInr: 80,
    rateUnit: 'PER_HOUR',
    equivalentDieselCostInr: 450, // 1 hr diesel pump ~ ₹450 (fuel + engine wear)
    carbonAvoidedKgPerUnit: 3.8, // kg CO2 avoided per hour
    currentLiveStatus: 'AVAILABLE',
    liveSolarOutputKw: 4.4,
    solarOutputCalculationNote: 'Modeled output: Calculated from instantaneous solar irradiance model (ESTIMATE), not guaranteed physical pump shaft power.',
    nextAvailableSlot: 'Today, 2:00 PM – 4:00 PM',
    ratingStars: 4.9,
    totalSmallFarmersServed: 24,
    features: [
      'High-discharge inline drip compatible (12,000 L/hr)',
      'Digital automated flow-meter with SMS receipt',
      'Zero diesel fumes, zero noise, 100% clean solar energy',
      'Replaces ₹450/hr diesel burn with only ₹80/hr sharing charge',
    ],
    verificationStatus: 'ESTIMATED',
    source: 'Sahyadri Agri-Solar Pilot Registry',
    lastVerified: '2026-09-28',
    freshness: 'FRESH',
  },
  {
    assetId: 'solar-drip-system-01',
    type: 'SHARED_SOLAR_PUMP',
    title: 'Shared Solar Micro-Grid Drip Irrigation System (3.5 Acre Kit)',
    ownerHub: 'Patil Wasti Solar Collective (Cluster #3)',
    distanceKm: 0.8,
    capacityDescription: '5 HP Solar VFD + Inline Pressure Compensated Drip (90% Application Efficiency)',
    hourlyOrDailyRateInr: 90,
    rateUnit: 'PER_HOUR',
    equivalentDieselCostInr: 450,
    carbonAvoidedKgPerUnit: 4.1,
    currentLiveStatus: 'AVAILABLE',
    liveSolarOutputKw: 4.6,
    solarOutputCalculationNote: 'Solar-powered pressurized drip delivery (12,000 L/hr @ 90% water application efficiency vs 60% flood).',
    nextAvailableSlot: 'Today, 2:00 PM – 4:00 PM',
    ratingStars: 4.95,
    totalSmallFarmersServed: 28,
    features: [
      `Saves ${WATER_SAVED_L.toLocaleString('en-IN')} Liters of water / month vs surface flood (90% drip efficiency)`,
      `Directly cuts monthly pump runtime from ${FLOOD_MONTHLY_PUMP_HOURS.toFixed(1)} hrs to ${DRIP_MONTHLY_PUMP_HOURS.toFixed(1)} hrs`,
      'Pay-per-hour community shared solar microgrid — ₹0 capital loan debt',
      `Replaces ${formatINR(DIESEL_MONTHLY_COST)}/mo diesel expense with clean ₹90/hr shared solar`,
    ],
    verificationStatus: 'VERIFIED',
    source: 'Sahyadri Agri-Solar Pilot Registry',
    lastVerified: '2026-09-30',
    freshness: 'FRESH',
  },
  {
    assetId: 'solar-cold-hub-01',
    type: 'SOLAR_COLD_STORAGE',
    title: '10 MT Solar-Powered Micro Cold Room',
    ownerHub: 'Pimpalgaon Farmer Producer Co-op',
    distanceKm: 3.2,
    capacityDescription: '10 Metric Tonne (400 plastic crates) · 10°C - 12°C · 90% RH',
    hourlyOrDailyRateInr: 1.5,
    rateUnit: 'PER_CRATE_DAY',
    equivalentDieselCostInr: 8.0, // generator run cold truck
    carbonAvoidedKgPerUnit: 0.45,
    currentLiveStatus: 'AVAILABLE',
    liveSolarOutputKw: 6.8,
    solarOutputCalculationNote: 'Modeled output: Rooftop solar array estimated yield.',
    nextAvailableSlot: 'Immediate Space Available (180 crates open)',
    ratingStars: 4.8,
    totalSmallFarmersServed: 48,
    features: [
      'Stops distress selling: Extends tomato shelf-life from 2 days to 14 days',
      'Powered 100% by 12 kW rooftop solar with thermal ice-battery storage',
      'Hold produce for 3-4 days until mandi market prices rise by ₹6-₹10/kg',
      'Only ₹1.5 per crate (20 kg) per day = just ₹0.075/kg storage cost',
    ],
    verificationStatus: 'VERIFIED',
    source: 'Pimpalgaon FPO Cold Chain Portal',
    sourceUrl: 'https://sahyadrifarms.com/cold-chain',
    lastVerified: '2026-09-29',
    freshness: 'FRESH',
  },
  {
    assetId: 'solar-sprayer-01',
    type: 'SOLAR_SPRAYER',
    title: 'Lithium-Solar Backpack Sprayer Fleet (16L)',
    ownerHub: 'Krishi Vigyan Kendra Custom Hiring Centre',
    distanceKm: 1.5,
    capacityDescription: 'Dual motor 16L tank + portable foldable 40W solar charger',
    hourlyOrDailyRateInr: 120,
    rateUnit: 'PER_DAY',
    equivalentDieselCostInr: 380, // petrol 2-stroke knapsack sprayer
    carbonAvoidedKgPerUnit: 2.2,
    currentLiveStatus: 'AVAILABLE',
    liveSolarOutputKw: 0.04,
    nextAvailableSlot: 'Tomorrow morning 6:00 AM',
    ratingStars: 4.7,
    totalSmallFarmersServed: 31,
    features: [
      'Zero manual pumping effort; consistent 60 PSI micron droplet spray',
      'Cuts chemical spray waste by 30% through uniform electro-static atomization',
      'Full battery lasts 6 hours; charges in the field via portable solar blanket',
    ],
    verificationStatus: 'CONTACT_PROVIDER',
    source: 'KVK Nashik Custom Hiring Registry',
    lastVerified: '2026-09-25',
    freshness: 'AGING',
  },
  {
    assetId: 'solar-dryer-01',
    type: 'SOLAR_DRYER',
    title: 'Community Solar Tunnel Polyhouse Dryer',
    ownerHub: 'Sahyadri Women Agricoop Hub',
    distanceKm: 4.5,
    capacityDescription: '500 kg batch capacity · 55°C controlled airflow',
    hourlyOrDailyRateInr: 250,
    rateUnit: 'PER_DAY',
    equivalentDieselCostInr: 900,
    carbonAvoidedKgPerUnit: 14.5,
    currentLiveStatus: 'AVAILABLE',
    liveSolarOutputKw: 2.2,
    nextAvailableSlot: 'Available this week',
    ratingStars: 4.9,
    totalSmallFarmersServed: 19,
    features: [
      'Value addition: Convert surplus tomatoes into sun-dried tomato flakes / powder',
      'Increases realization from ₹8/kg distress price to ₹180/kg dried value',
      'Hygienic dust-free, fly-proof UV-stabilized drying chamber',
    ],
    verificationStatus: 'ESTIMATED',
    source: 'Sahyadri Women Agricoop Hub',
    lastVerified: '2026-09-27',
    freshness: 'AGING',
  },
];

// ─── DIRECT BUYER MARKET NETWORK ─────────────────────────────────────────────

export const MARKET_BUYERS_CATALOG: MarketBuyerListing[] = [
  {
    buyerId: 'buyer-sahyadri',
    organizationName: 'Sahyadri Farmers Producer Co. (Direct Sourcing)',
    buyerType: 'FPO_COLLECTIVE',
    location: 'Mohadi, Nashik Hub',
    distanceKm: 14,
    offeringPricePerKg: 35.5,
    minimumGrade: 'A',
    targetCommodity: 'Tomato (Hybrid Shivam / Abhinav)',
    dailyDemandKg: 15000,
    farmgatePickupAvailable: true,
    paymentTerms: 'IMMEDIATE_UPI_DBT',
    rating: 4.9,
    activeContractsCount: 142,
    verificationStatus: 'VERIFIED',
    source: 'Sahyadri Farmer Producer Co. Daily Procurement',
    sourceUrl: 'https://sahyadrifarms.com',
    lastVerified: '2026-09-30',
    freshness: 'FRESH',
  },
  {
    buyerId: 'buyer-bigbasket',
    organizationName: 'BigBasket Farmer Connect Sourcing Hub',
    buyerType: 'RETAIL_CHAIN',
    location: 'Pimpalgaon Baswant',
    distanceKm: 26,
    offeringPricePerKg: 36.0,
    minimumGrade: 'A',
    targetCommodity: 'Tomato',
    dailyDemandKg: 22000,
    farmgatePickupAvailable: true,
    paymentTerms: 'T_PLUS_1',
    rating: 4.8,
    activeContractsCount: 88,
    verificationStatus: 'ESTIMATED',
    source: 'BigBasket Farmer Connect Sourcing Desk',
    lastVerified: '2026-09-29',
    freshness: 'FRESH',
  },
  {
    buyerId: 'buyer-vashi-metro',
    organizationName: 'Vashi Direct Wholesale Aggregator (Mumbai)',
    buyerType: 'DIRECT_EXPORTER',
    location: 'Turbhe / Vashi Terminal',
    distanceKm: 165,
    offeringPricePerKg: 42.0,
    minimumGrade: 'A',
    targetCommodity: 'Tomato (Export / Premium Table)',
    dailyDemandKg: 35000,
    farmgatePickupAvailable: false, // farmer delivers or arranges shared truck
    paymentTerms: 'SAME_DAY_CASH',
    rating: 4.6,
    activeContractsCount: 64,
    verificationStatus: 'CONTACT_PROVIDER',
    source: 'Vashi Wholesale Trade Aggregator Terminal',
    lastVerified: '2026-09-28',
    freshness: 'AGING',
  },
];

// ─── BOOKING & CONTRACT CREATORS ─────────────────────────────────────────────

export function createSolarBooking(
  assetId: string,
  farmerId: string,
  durationUnits: number = 2,
  slotStartTime: string = 'Today, 2:00 PM'
): SolarBookingOrder {
  const asset = SHARED_SOLAR_CATALOG.find(a => a.assetId === assetId) || SHARED_SOLAR_CATALOG[0];

  const totalPrice = Math.round(asset.hourlyOrDailyRateInr * durationUnits);
  const equivDieselCost = Math.round(asset.equivalentDieselCostInr * durationUnits);
  const costSaved = Math.max(0, equivDieselCost - totalPrice);

  // Diesel displaced (approx 1.2 L / hour for a 5HP pump)
  const dieselDisplaced = Number((durationUnits * 1.25).toFixed(1));
  const carbonAvoided = Number((asset.carbonAvoidedKgPerUnit * durationUnits).toFixed(1));

  let unitType: SolarBookingOrder['unitType'] = 'HOURS';
  if (asset.rateUnit === 'PER_DAY') unitType = 'DAYS';
  if (asset.rateUnit === 'PER_CRATE_DAY') unitType = 'CRATE_DAYS';

  return {
    bookingId: `SB-${Date.now().toString(36).toUpperCase()}`,
    assetId: asset.assetId,
    farmerId,
    assetTitle: asset.title,
    slotStartTime,
    durationUnits,
    unitType,
    totalPriceInr: totalPrice,
    dieselDisplacedLiters: dieselDisplaced,
    costSavedVsDieselInr: costSaved,
    carbonAvoidedKg: carbonAvoided,
    status: 'CONFIRMED',
    waterDischargedLiters: asset.type === 'SHARED_SOLAR_PUMP' ? durationUnits * 12000 : undefined,
    bookedAt: new Date().toISOString(),
  };
}

export function createDirectSaleContract(
  farmerId: string,
  buyerId: string,
  quantityKg: number = 1200
): DirectSaleContract {
  const buyer = MARKET_BUYERS_CATALOG.find(b => b.buyerId === buyerId) || MARKET_BUYERS_CATALOG[0];

  const totalPayout = Math.round(quantityKg * buyer.offeringPricePerKg);
  // Traditional middleman cuts: 6% APMC commission + ₹1.5/kg handling + transport leakage ≈ ₹3.5/kg
  const savingsVsMiddleman = Math.round(quantityKg * 3.5);

  return {
    contractId: `MC-${Date.now().toString(36).toUpperCase()}`,
    farmerId,
    buyerId: buyer.buyerId,
    buyerName: buyer.organizationName,
    commodity: buyer.targetCommodity,
    quantityKg,
    lockedPricePerKg: buyer.offeringPricePerKg,
    totalPayoutInr: totalPayout,
    pickupDate: 'Tomorrow, 7:30 AM (Farmgate)',
    pickupLocation: 'Ramesh Patil Farm, Gat No. 42, Dindori Road, Nashik',
    status: 'PENDING_PICKUP',
    paymentMethod: buyer.paymentTerms === 'IMMEDIATE_UPI_DBT' ? 'Instant DBT / UPI' : 'Direct Bank Transfer',
    savingsVsMiddlemanCommissionInr: savingsVsMiddleman,
    createdAt: new Date().toISOString(),
  };
}
