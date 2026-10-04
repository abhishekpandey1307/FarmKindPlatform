// =============================================================================
// FARMKIND — REAL DATA, SCHEMES & SHARED SOLAR ENGINE TESTS
// Validates feasibility & scalability engines: Open-Meteo, APMC Mandi arbitrage,
// PM-KUSUM 60% subsidy calculations, shared solar bookings, and multilingual AI
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  fetchLiveWeather,
  fetchLiveMandiPrices,
  calculateMandiArbitrage,
  DEFAULT_FARM_LOCATION,
} from '../engine/liveDataEngine';
import {
  GOV_SCHEMES_CATALOG,
  evaluateSchemeEligibility,
  calculateSolarPumpSubsidy,
  type FarmerProfileForSchemes,
} from '../engine/schemesEngine';
import {
  SHARED_SOLAR_CATALOG,
  MARKET_BUYERS_CATALOG,
  createSolarBooking,
  createDirectSaleContract,
} from '../engine/solarMarketEngine';
import { resolveVoiceIntent } from '../engine/decision';
import { createInitialFarmState } from '../engine/simulation';

describe('Real Agrometeorology & Mandi Engine (liveDataEngine)', () => {
  it('fetches live or cached agrometeorology for Nashik', async () => {
    const report = await fetchLiveWeather(DEFAULT_FARM_LOCATION.latitude, DEFAULT_FARM_LOCATION.longitude);

    expect(report).toBeDefined();
    expect(report.locationName).toContain('Nashik');
    expect(report.temperatureC).toBeGreaterThan(10);
    expect(report.temperatureC).toBeLessThan(50);
    expect(report.relativeHumidity).toBeGreaterThanOrEqual(10);
    expect(report.relativeHumidity).toBeLessThanOrEqual(100);
    expect(report.rainProbabilityPercent).toBeGreaterThanOrEqual(0);
    expect(report.rainProbabilityPercent).toBeLessThanOrEqual(100);
    expect(report.solarRadiationWm2).toBeGreaterThanOrEqual(0);
    expect(report.estimatedSolarPumpKw).toBeGreaterThanOrEqual(0);
    expect(report.soilMoistureSatellitePercent).toBeGreaterThan(0);
    expect(report.timestamp).toBeTruthy();
  });

  it('fetches live APMC mandis around Maharashtra', async () => {
    const mandis = await fetchLiveMandiPrices();

    expect(mandis.length).toBeGreaterThanOrEqual(4);
    const nashik = mandis.find(m => m.mandiId === 'mandi-nashik');
    const pimpalgaon = mandis.find(m => m.mandiId === 'mandi-pimpalgaon');
    const vashi = mandis.find(m => m.mandiId === 'mandi-vashi');

    expect(nashik).toBeDefined();
    expect(pimpalgaon).toBeDefined();
    expect(vashi).toBeDefined();

    expect(nashik!.modalPricePerKg).toBeGreaterThan(20);
    expect(nashik!.transportFreightPerKg).toBeGreaterThan(0);
    expect(nashik!.netRealizationPerKg).toBeCloseTo(
      nashik!.modalPricePerKg - nashik!.transportFreightPerKg,
      1
    );
    expect(['UP', 'DOWN', 'STABLE']).toContain(nashik!.priceTrend);
  });

  it('calculates multi-mandi price arbitrage and cold-storage holding value', async () => {
    const mandis = await fetchLiveMandiPrices();
    const batchSizeKg = 1200;
    const arbitrage = calculateMandiArbitrage(batchSizeKg, mandis);

    expect(arbitrage).toBeDefined();
    expect(arbitrage.batchSizeKg).toBe(1200);
    expect(arbitrage.recommendedMandi).toBeDefined();
    expect(arbitrage.totalGrossValue).toBeGreaterThan(30000);
    expect(arbitrage.totalNetRealization).toBeGreaterThan(25000);
    expect(arbitrage.holdingInColdStorageAdvantage).toBeDefined();
    expect(arbitrage.holdingInColdStorageAdvantage.recommendedHoldingDays).toBe(3);
    expect(arbitrage.holdingInColdStorageAdvantage.projectedNetGain).toBeGreaterThan(0);
  });
});

describe('Real Government Schemes & PM-KUSUM Engine (schemesEngine)', () => {
  const rameshProfile: FarmerProfileForSchemes = {
    farmerName: 'Ramesh Patil',
    landholdingAcres: 3.5, // Smallholder category
    cropType: 'Tomato',
    district: 'Nashik',
    state: 'Maharashtra',
    irrigationType: 'FLOOD',
    energySource: 'DIESEL',
    hasAadhaar: true,
    hasLandExtract712: true,
    hasBankPassbook: true,
    fpoMember: true,
  };

  it('evaluates Ramesh Patil as highly eligible for PM-KUSUM 60% solar pump subsidy', () => {
    const evaluations = evaluateSchemeEligibility(rameshProfile, GOV_SCHEMES_CATALOG);
    expect(evaluations.length).toBe(GOV_SCHEMES_CATALOG.length);

    const kusum = evaluations.find(e => e.scheme.id === 'pm-kusum');
    expect(kusum).toBeDefined();
    expect(kusum!.isEligible).toBe(true);
    expect(kusum!.matchScorePercent).toBeGreaterThanOrEqual(90);
    expect(kusum!.status).toBe('HIGHLY_ELIGIBLE');
    expect(kusum!.estimatedSubsidyInr).toBe(168000); // 60% of benchmark
    expect(kusum!.whyEligible).toContain('60% subsidy tier');
    expect(kusum!.hindiSummary).toContain('पीएम-कुसुम');
    expect(kusum!.marathiSummary).toContain('महाऊर्जा');
  });

  it('correctly calculates PM-KUSUM benchmark financing split for 5 HP pump', () => {
    const quote = calculateSolarPumpSubsidy(5);

    expect(quote.benchmarkCostInr).toBe(280000);
    expect(quote.centralSubsidyInr).toBe(84000);   // 30%
    expect(quote.stateSubsidyInr).toBe(84000);     // 30%
    expect(quote.totalGovtSubsidyInr).toBe(168000); // 60%
    expect(quote.farmerShareCashInr).toBe(28000);  // 10%
    expect(quote.bankLoanFinancedInr).toBe(84000); // 30%
    expect(quote.estimatedMonthlyDieselSavedInr).toBeGreaterThan(12000);
    expect(quote.breakEvenPeriodMonths).toBeLessThanOrEqual(3);
  });

  it('generates verified document requirements and official portal links', () => {
    const kusum = GOV_SCHEMES_CATALOG.find(s => s.id === 'pm-kusum');
    expect(kusum).toBeDefined();
    expect(kusum!.documentsRequired).toContain('Aadhaar Card copy');
    expect(kusum!.documentsRequired).toContain('Land Ownership Record (7/12 & 8A extract in Maharashtra)');
    expect(kusum!.officialPortalUrl).toBe('https://pmkusum.mnre.gov.in');
  });
});

describe('Affordable Shared Solar & Market Connect Engine (solarMarketEngine)', () => {
  it('creates shared solar pump slot booking with displaced diesel calculations', () => {
    const asset = SHARED_SOLAR_CATALOG[0]; // 5 HP pump @ ₹80/hr
    const booking = createSolarBooking(asset.assetId, 'FARMER-RAMESH-01', 2, 'Today 2:00 PM');

    expect(booking.bookingId).toContain('SB-');
    expect(booking.assetId).toBe(asset.assetId);
    expect(booking.totalPriceInr).toBe(160); // 2 hrs @ ₹80
    expect(booking.dieselDisplacedLiters).toBe(2.5); // 2 * 1.25 L
    expect(booking.costSavedVsDieselInr).toBe(740); // ₹900 diesel - ₹160 solar
    expect(booking.carbonAvoidedKg).toBe(7.6);
    expect(booking.waterDischargedLiters).toBe(24000);
    expect(booking.status).toBe('CONFIRMED');
  });

  it('creates direct farmgate sale contracts saving middleman commissions', () => {
    const buyer = MARKET_BUYERS_CATALOG[0]; // Sahyadri FPO
    const contract = createDirectSaleContract('FARMER-RAMESH-01', buyer.buyerId, 1200);

    expect(contract.contractId).toContain('MC-');
    expect(contract.buyerId).toBe(buyer.buyerId);
    expect(contract.quantityKg).toBe(1200);
    expect(contract.lockedPricePerKg).toBe(buyer.offeringPricePerKg);
    expect(contract.totalPayoutInr).toBe(1200 * buyer.offeringPricePerKg);
    expect(contract.savingsVsMiddlemanCommissionInr).toBe(1200 * 3.5);
    expect(contract.status).toBe('PENDING_PICKUP');
  });
});

describe('Multilingual AI Agri-Friend (Mitra) Intent Engine', () => {
  const baseState = createInitialFarmState();

  it('answers solar pump booking query in Hindi, Marathi, and English', () => {
    const res = resolveVoiceIntent('सोलर पंप स्लॉट बुक करो', baseState);

    expect(res.response).toContain('Patil Wasti 5 HP Shared Solar Pump');
    expect(res.hindiResponse).toContain('सोलर पंप');
    expect(res.marathiResponse).toContain('सौर पंप');
    expect(res.suggestedAction).toBe('BOOK_SOLAR_PUMP');
    expect(res.suggestedScreen).toBe(3);
  });

  it('answers PM-KUSUM government schemes query across regional languages', () => {
    const res = resolveVoiceIntent('पीएम कुसुम योजना में कितनी सब्सिडी मिलेगी?', baseState);

    expect(res.response).toContain('60% subsidy');
    expect(res.hindiResponse).toContain('60% सरकारी सब्सिडी');
    expect(res.marathiResponse).toContain('60% शासकीय अनुदान');
    expect(res.kannadaResponse).toBeDefined();
    expect(res.teluguResponse).toBeDefined();
    expect(res.suggestedAction).toBe('CHECK_GOV_SCHEMES');
    expect(res.suggestedScreen).toBe(3);
  });

  it('answers cold storage preservation query', () => {
    const res = resolveVoiceIntent('कोल्ड स्टोरेज का किराया क्या है?', baseState);

    expect(res.response).toContain('Solar Micro Cold Room');
    expect(res.hindiResponse).toContain('सौर कोल्ड रूम');
    expect(res.suggestedAction).toBe('BOOK_COLD_STORAGE');
    expect(res.suggestedScreen).toBe(3);
  });

  it('answers mandi market queries with net realization advice', () => {
    const res = resolveVoiceIntent('आज मंडी में क्या भाव है?', baseState);

    expect(res.response).toContain('Best market price today');
    expect(res.hindiResponse).toContain('सबसे अच्छी कीमत');
    expect(res.marathiResponse).toContain('सर्वाधिक दर');
  });

  it('answers pest and leaf curl virus disease queries with treatment dosage', () => {
    const res = resolveVoiceIntent('टमाटर के पत्ते मुड़ रहे हैं और सफेद मक्खी है', baseState);

    expect(res.category).toBe('PESTS');
    expect(res.response).toContain('Leaf Curl');
    expect(res.hindiResponse).toContain('सफेद मक्खी');
    expect(res.hindiResponse).toContain('एसिटामिप्रिड');
    expect(res.actionButton).toBeDefined();
  });

  it('answers yellow leaves and fertilizer nutrition queries with 19:19:19 guidance', () => {
    const res = resolveVoiceIntent('पत्ते पीले हो रहे हैं कौन सी खाद दें?', baseState);

    expect(res.category).toBe('FERTILIZER');
    expect(res.response).toContain('19:19:19');
    expect(res.hindiResponse).toContain('19:19:19');
    expect(res.hindiResponse).toContain('कैल्शियम नाइट्रेट');
  });

  it('answers diesel pump cost reduction query with concrete rupee savings', () => {
    const res = resolveVoiceIntent('डीजल पंप का खर्चा कैसे बचेगा?', baseState);

    expect(res.category).toBe('SOLAR');
    expect(res.response).toContain('₹270/hr');
    expect(res.hindiResponse).toContain('₹270/घंटे');
  });

  it('answers weather and rain forecast query considering Nashik sensor data', () => {
    const res = resolveVoiceIntent('आज बारिश होगी क्या?', baseState);

    expect(res.category).toBe('WEATHER');
    expect(res.hindiResponse).toContain('बारिश');
  });

  it('answers drip clogging maintenance query with acid wash ratio', () => {
    const res = resolveVoiceIntent('ड्रिप पाइप चोक हो गई है कैसे साफ करें?', baseState);

    expect(res.category).toBe('SOIL');
    expect(res.hindiResponse).toContain('एसिड');
  });

  it('provides intelligent context-aware fallback for any unstructured farmer question', () => {
    const res = resolveVoiceIntent('मैं अपनी फसल कैसे बेचूं और अच्छा मुनाफा कमाऊं?', baseState);

    expect(res.category).toBeDefined();
    expect(res.hindiResponse).toContain('रमेश जी');
    expect(res.actionButton).toBeDefined();
  });
});
