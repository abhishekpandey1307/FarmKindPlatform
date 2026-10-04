// =============================================================================
// FARMKIND — DECISION ENGINE
// Deterministic FarmKind Smart Engine decision logic. No UI manipulation.
// =============================================================================

import type {
  FarmState,
  DecisionResult,
  ActionType,
  ConfidenceLevel,
  UrgencyLevel,
} from '../domain/types';
import { calcHarvestEconomics, CALCULATED_BASELINE } from './calculation';

let decisionCounter = 0;

// ─── SENSOR SAFETY CLAMPING ───────────────────────────────────────────────────
// CRITICAL: Real sensors can return NaN, -999, 0 (wire break), or 150 (short).
// All values MUST be clamped to agronomically valid ranges before any decision.

function clampSensorValue(
  raw: number | null | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  if (raw === null || raw === undefined || !isFinite(raw) || isNaN(raw)) return fallback;
  if (raw < min || raw > max) return fallback; // out-of-range = treat as missing
  return raw;
}

/** Clamp soil moisture to 0–100% — real sensors can short to 0 or overflow to 150+ */
function safeSoilMoisture(raw: number | null | undefined): { value: number; isReliable: boolean } {
  if (raw === null || raw === undefined || isNaN(raw as number) || !isFinite(raw as number)) {
    return { value: 35, isReliable: false }; // fallback to safe neutral value
  }
  const v = raw as number;
  if (v < 0 || v > 100) return { value: 35, isReliable: false };
  return { value: v, isReliable: true };
}

/** Clamp temperature to -10°C – 60°C — protects against sensor fault codes */
function safeTemperature(raw: number | null | undefined): { value: number; isReliable: boolean } {
  if (raw === null || raw === undefined || isNaN(raw as number) || !isFinite(raw as number)) {
    return { value: 30, isReliable: false };
  }
  const v = raw as number;
  if (v < -10 || v > 60) return { value: 30, isReliable: false };
  return { value: v, isReliable: true };
}

/** Clamp rainfall to 0–500mm — sensor malfunction can report negative values */
function safeRainfall(raw: number | null | undefined): number {
  return clampSensorValue(raw, 0, 500, 0);
}

/** Clamp humidity to 0–100% */
function safeHumidity(raw: number | null | undefined): number {
  return clampSensorValue(raw, 0, 100, 60);
}

/** Clamp rain probability to 0–100% */
function safeRainProb(raw: number | null | undefined): number {
  return clampSensorValue(raw, 0, 100, 30);
}

// ─── CROP-STAGE MOISTURE THRESHOLDS ───────────────────────────────────────────
// Different crop stages need different moisture levels (FAO-56 Kc stages)
function getCropStageMoistureThreshold(stage: string): { critical: number; target: number } {
  switch (stage) {
    case 'SEEDLING':     return { critical: 40, target: 55 }; // Seedlings need more moisture
    case 'VEGETATIVE':   return { critical: 35, target: 50 };
    case 'FLOWERING':    return { critical: 38, target: 55 }; // Critical — deficit at flowering = yield loss
    case 'MID_SEASON':   return { critical: 32, target: 48 };
    case 'HARVEST':      return { critical: 25, target: 35 }; // Reduce water before harvest
    case 'POST_HARVEST': return { critical: 0, target: 10 };  // No irrigation needed
    default:             return { critical: 30, target: 45 };
  }
}

// ─── THRESHOLDS ───────────────────────────────────────────────────────────────

const IRRIGATION_THRESHOLDS = {
  criticalMoisture: 30,        // % below which irrigation is urgent
  optimalTarget: 35,           // % target
  highRainProbability: 60,     // % above which we wait
  staleSensorHours: 4,         // hours before sensor is considered stale
  staleWeatherHours: 6,        // hours before weather data stale
  recentIrrigationHours: 12,   // if irrigated within this time, lower urgency
};

const HEAT_THRESHOLDS = {
  medium: 37,
  high: 39,
  critical: 41,
};

const HARVEST_THRESHOLDS = {
  spoilageWarning: 20,         // % spoilage risk → warning
  spoilageCritical: 35,        // % spoilage risk → critical
  ageWarningHours: 24,
  ageCriticalHours: 36,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function hoursAgo(timestamp?: string): number {
  if (!timestamp) return 999;
  const diff = Date.now() - new Date(timestamp).getTime();
  return diff / (1000 * 3600);
}

function makeDecisionId(): string {
  return `DEC-${Date.now()}-${++decisionCounter}`;
}

// ─── IRRIGATION DECISION ─────────────────────────────────────────────────────

export function evaluateIrrigationDecision(state: FarmState): DecisionResult {
  const { farm } = state;
  const soil = farm.soil;
  const weather = farm.weather;
  const irrigation = farm.irrigation;

  // ─── SENSOR SAFETY CLAMPING ─────────────────────────────────────────────
  // Real sensors can return 0 (wire break), 150 (short circuit), NaN, -999.
  // All values are clamped and tagged reliable/unreliable before any decision.
  const rawMoisture = soil.moisture.value;
  const { value: soilMoisture, isReliable: moistureSensorReliable } = safeSoilMoisture(rawMoisture);
  const rawTemp = weather.temperature.value;
  const { value: tempC, isReliable: tempSensorReliable } = safeTemperature(rawTemp);
  const rainProb = safeRainProb(weather.rainProbability.value);
  const expectedRain = safeRainfall(weather.expectedRainfall.value);

  const lastIrrigationHours = hoursAgo(irrigation.lastIrrigation);
  const sensorStatus = soil.sensorStatus;
  const weatherAge = hoursAgo(weather.timestamp);

  // ─── CROP-STAGE MOISTURE THRESHOLDS (FAO-56 Kc stage-based) ─────────────
  const stageThresholds = getCropStageMoistureThreshold(farm.crop.stage);
  // Use the more conservative of engine default vs crop stage threshold
  const effectiveCriticalMoisture = Math.max(
    IRRIGATION_THRESHOLDS.criticalMoisture,
    stageThresholds.critical
  );

  const observations: string[] = [];
  const context: string[] = [];
  const constraints: string[] = [];
  const candidateActions: ActionType[] = ['IRRIGATE', 'WAIT', 'MONITOR'];
  const rejectedActions: { action: ActionType; reason: string }[] = [];

  // Collect observations
  observations.push(`Soil moisture: ${soilMoisture}% (${moistureSensorReliable ? 'sensor reliable' : '⚠ sensor fault — using safe fallback'})`);
  observations.push(`Temperature: ${tempC}°C (${tempSensorReliable ? 'sensor reliable' : '⚠ sensor fault — using safe fallback'})`);
  observations.push(`Rain probability: ${rainProb}%`);
  observations.push(`Expected rainfall: ${expectedRain}mm`);
  observations.push(`Last irrigation: ${Math.round(lastIrrigationHours)}h ago`);
  observations.push(`Crop stage: ${farm.crop.stage} (critical moisture: ${effectiveCriticalMoisture}%)`);
  observations.push(`Sensor: ${sensorStatus}`);

  // Collect context
  context.push(`Crop: ${farm.crop.cropType}`);
  context.push(`Critical moisture threshold (stage-adjusted): ${effectiveCriticalMoisture}%`);
  context.push(`Irrigation target: ${farm.crop.optimalMoistureTarget}%`);

  let selectedAction: ActionType = 'WAIT';
  let confidence: ConfidenceLevel = 'HIGH';
  let urgency: UrgencyLevel = 'LOW';
  let explanation = '';
  let hindiReason = '';

  // ─── CONSTRAINT: Stale sensor ───────────────────────────────────────────
  if (sensorStatus === 'STALE' || sensorStatus === 'ERROR' || sensorStatus === 'NOT_CONNECTED') {
    constraints.push('Soil sensor unavailable or stale — reducing confidence');
    confidence = 'LOW';
  }

  // ─── CONSTRAINT: Stale weather ──────────────────────────────────────────
  if (weatherAge > IRRIGATION_THRESHOLDS.staleWeatherHours) {
    constraints.push('Weather data may be stale');
    confidence = confidence === 'HIGH' ? 'MEDIUM' : 'LOW';
  }

  // ─── CONSTRAINT: Pump status ────────────────────────────────────────────
  if (irrigation.pumpStatus === 'OFFLINE') {
    constraints.push('Pump is OFFLINE — irrigation blocked');
    selectedAction = 'MONITOR';
    rejectedActions.push({ action: 'IRRIGATE', reason: 'Pump offline' });
    urgency = 'HIGH';
    explanation = 'Irrigation is blocked because the pump is offline. Immediate check required.';
    hindiReason = 'पम्प बंद है। सिंचाई नहीं हो सकती। पम्प की जाँच करें।';

    return buildResult(makeDecisionId(), farm.farmId, 'PUMP_OFFLINE', selectedAction,
      confidence, urgency, observations, context, candidateActions, rejectedActions,
      constraints, {}, explanation, hindiReason, 'SIMULATED');
  }

  // ─── DECISION LOGIC ─────────────────────────────────────────────────────

  const moistureIsLow = soilMoisture < effectiveCriticalMoisture;
  // SATURATION GUARD: > 75% soil moisture = waterlogged, NEVER irrigate regardless of other signals
  const soilIsSaturated = soilMoisture > 75;
  const rainIsLikely = rainProb >= IRRIGATION_THRESHOLDS.highRainProbability;
  const rainWillSatisfy = expectedRain >= 10; // mm
  const irrigatedRecently = lastIrrigationHours < IRRIGATION_THRESHOLDS.recentIrrigationHours;

  // ─── SATURATION GUARD: Soil is waterlogged, block irrigation ────────────
  if (soilIsSaturated) {
    selectedAction = 'MONITOR';
    rejectedActions.push({ action: 'IRRIGATE', reason: `Soil is already saturated at ${soilMoisture}% — adding water causes waterlogging and root asphyxiation` });
    urgency = soilMoisture > 90 ? 'HIGH' : 'MEDIUM';
    confidence = moistureSensorReliable ? 'HIGH' : 'MEDIUM';
    explanation = `Soil moisture is ${soilMoisture}% — already at or above saturation threshold (75%). Irrigating would cause waterlogging, root asphyxiation, and fungal disease. Open drainage channels instead.`;
    hindiReason = `मिट्टी की नमी ${soilMoisture}% है जो पानी भरने की सीमा से ऊपर है। अभी सिंचाई न करें। जल निकासी करें।`;

    return buildResult(makeDecisionId(), farm.farmId, 'SOIL_SATURATED', selectedAction,
      confidence, urgency, observations, context, candidateActions, rejectedActions,
      constraints, {}, explanation, hindiReason, soil.moisture.sourceType || 'AI_DERIVED');
  }

  if (rainIsLikely && rainWillSatisfy) {
    // High rain probability — wait
    selectedAction = 'WAIT';
    rejectedActions.push({ action: 'IRRIGATE', reason: 'High rain probability would waste water' });
    if (!moistureIsLow) {
      urgency = 'LOW';
      confidence = 'HIGH';
    } else {
      urgency = 'MEDIUM';
      confidence = 'MEDIUM';
      constraints.push('Soil moisture is low but rain expected soon');
    }
    explanation = `Rain expected soon (${rainProb}% probability, ${expectedRain}mm). Irrigating now would waste water and energy.`;
    hindiReason = `बारिश होने की संभावना ${rainProb}% है और ${expectedRain}mm वर्षा अपेक्षित है। अभी सिंचाई करने से पानी की बर्बादी होगी।`;

  } else if (moistureIsLow && !rainIsLikely) {
    // Low moisture, no rain — irrigate
    selectedAction = 'IRRIGATE';
    rejectedActions.push({ action: 'WAIT', reason: `Soil moisture (${soilMoisture}%) is below ${effectiveCriticalMoisture}% critical threshold for ${farm.crop.stage} stage` });
    urgency = soilMoisture < 25 ? 'HIGH' : 'MEDIUM';
    // Confidence drops if sensor was unreliable — don't irrigate blindly on bad sensor data
    confidence = (sensorStatus === 'LIVE' && moistureSensorReliable) ? 'HIGH' : 'MEDIUM';
    if (!moistureSensorReliable) {
      constraints.push(`⚠ Soil sensor reading was out-of-range (${rawMoisture}) — using safe fallback value. Verify sensor before irrigating.`);
    }
    explanation = `Soil moisture (${soilMoisture}%) is below the ${farm.crop.stage}-stage critical threshold (${effectiveCriticalMoisture}%). Rain unlikely (${rainProb}%). Irrigation required to protect crop.`;
    hindiReason = `मिट्टी की नमी ${soilMoisture}% है जो ${farm.crop.stage} अवस्था में ${effectiveCriticalMoisture}% की ज़रूरी सीमा से कम है। बारिश की संभावना कम (${rainProb}%) है। सिंचाई करना जरूरी है।`;

  } else if (irrigatedRecently && !moistureIsLow) {
    // Recently irrigated, moisture okay
    selectedAction = 'WAIT';
    rejectedActions.push({ action: 'IRRIGATE', reason: 'Recently irrigated and moisture is adequate' });
    urgency = 'LOW';
    explanation = `Irrigated ${Math.round(lastIrrigationHours)}h ago. Soil moisture (${soilMoisture}%) is adequate. Monitoring continues.`;
    hindiReason = `${Math.round(lastIrrigationHours)} घंटे पहले सिंचाई हुई थी। मिट्टी की नमी (${soilMoisture}%) ठीक है।`;

  } else {
    // Default: monitor
    selectedAction = 'MONITOR';
    urgency = 'LOW';
    confidence = 'MEDIUM';
    explanation = `Monitoring farm conditions. Soil moisture (${soilMoisture}%) is acceptable.`;
    hindiReason = `खेत की स्थिति निगरानी में है। मिट्टी की नमी (${soilMoisture}%) ठीक है।`;
  }

  // ─── HARD CONSTRAINT CONFIDENCE CAPS ─────────────────────────────────────
  if (sensorStatus === 'STALE' || sensorStatus === 'ERROR' || sensorStatus === 'NOT_CONNECTED') {
    confidence = 'LOW';
  } else if (weatherAge > IRRIGATION_THRESHOLDS.staleWeatherHours || weather.isStale) {
    if (confidence === 'HIGH') confidence = 'MEDIUM';
    if (!constraints.includes('Weather data may be stale')) {
      constraints.push('Weather data may be stale');
    }
  }

  const deferredWaterSaved = farm.irrigation.estimatedWaterPerEvent.value ?? CALCULATED_BASELINE.floodGrossDailyL;

  return buildResult(
    makeDecisionId(), farm.farmId, 'IRRIGATION_CHECK',
    selectedAction, confidence, urgency,
    observations, context, candidateActions, rejectedActions, constraints,
    { waterSavedLiters: selectedAction === 'WAIT' ? deferredWaterSaved : 0 },
    explanation, hindiReason, 'AI_DERIVED'
  );
}

// ─── HARVEST DECISION ────────────────────────────────────────────────────────

export function evaluateHarvestDecision(state: FarmState): DecisionResult {
  const { farm } = state;
  const batches = farm.harvest;

  if (!batches.length) {
    return buildResult(makeDecisionId(), farm.farmId, 'HARVEST_CHECK', 'MONITOR',
      'LOW', 'LOW', ['No harvest batch found'], [], [], [], [], {},
      'No produce to evaluate.', 'कोई उपज उपलब्ध नहीं है।', 'SIMULATED');
  }

  const batch = batches[0];
  const ageHours = batch.ageHours.value ?? 0;
  const tempC = batch.storageTemperature.value ?? 30;
  const humidity = batch.storageHumidity.value ?? 80;
  const spoilageRisk = batch.spoilageRiskPercent.value ?? 0;
  const marketOptions = farm.market.options;
  const transportAvailable = farm.logistics.transportAvailable;

  const observations: string[] = [
    `Batch: ${batch.quantityKg}kg ${batch.cropType}`,
    `Age: ${ageHours}h`,
    `Storage temp: ${tempC}°C`,
    `Humidity: ${humidity}%`,
    `Spoilage risk: ${spoilageRisk}%`,
    `Transport: ${transportAvailable ? 'available' : 'delayed/unavailable'}`,
  ];

  const candidateActions: ActionType[] = ['SELL_NOW', 'MOVE_TO_MARKET', 'STORE', 'WAIT'];
  const rejectedActions: { action: ActionType; reason: string }[] = [];
  const constraints: string[] = [];
  const context: string[] = [];

  // Score each market option
  const scores = marketOptions.map((opt) => {
    const delayHours = transportAvailable ? 0 : (farm.logistics.estimatedAvailabilityHours ?? 4);
    const econ = calcHarvestEconomics(
      batch.quantityKg,
      opt.pricePerKg.value ?? 0,
      opt.distanceKm,
      0,
      spoilageRisk,
      delayHours
    );
    return { market: opt, econ, score: econ.netRevenue };
  });

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  let selectedAction: ActionType;
  let confidence: ConfidenceLevel = 'HIGH';
  let urgency: UrgencyLevel = 'MEDIUM';
  let explanation: string;
  let hindiReason: string;

  if (spoilageRisk >= HARVEST_THRESHOLDS.spoilageCritical) {
    // Critical spoilage risk
    selectedAction = 'SELL_NOW';
    urgency = 'CRITICAL';
    rejectedActions.push({ action: 'WAIT', reason: 'Critical spoilage risk' });
    rejectedActions.push({ action: 'STORE', reason: 'Storage would worsen condition' });
    explanation = `Spoilage risk is critical (${spoilageRisk}%). Sell immediately to minimize losses.`;
    hindiReason = `खराब होने का खतरा बहुत ज्यादा है (${spoilageRisk}%)। तुरंत बेचें।`;
  } else if (!transportAvailable && spoilageRisk < HARVEST_THRESHOLDS.spoilageWarning) {
    // Transport delay, but produce is still okay
    selectedAction = 'STORE';
    urgency = 'MEDIUM';
    rejectedActions.push({ action: 'MOVE_TO_MARKET', reason: 'Transport unavailable' });
    explanation = `Transport is delayed. Produce is still in good condition. Store temporarily and monitor temperature.`;
    hindiReason = `परिवहन उपलब्ध नहीं है। उपज अभी ठीक है। अस्थायी भंडारण करें।`;
  } else if (best && best.market.distanceKm <= 20) {
    selectedAction = 'SELL_NOW';
    urgency = 'MEDIUM';
    explanation = `Best option: ${best.market.name} at ₹${best.market.pricePerKg.value}/kg (${best.market.distanceKm}km). Transport available.`;
    hindiReason = `सबसे अच्छा विकल्प: ${best.market.name} में ₹${best.market.pricePerKg.value}/किग्रा। यहाँ बेचें।`;
  } else if (best) {
    selectedAction = 'MOVE_TO_MARKET';
    urgency = 'MEDIUM';
    explanation = `Best net value at ${best.market.name} (₹${best.market.pricePerKg.value}/kg, ${best.market.distanceKm}km). Plan transport.`;
    hindiReason = `${best.market.name} में सबसे ज्यादा लाभ मिलेगा (₹${best.market.pricePerKg.value}/किग्रा)।`;
  } else {
    selectedAction = 'MONITOR';
    urgency = 'LOW';
    explanation = 'Monitoring harvest conditions.';
    hindiReason = 'उपज की स्थिति देख रहे हैं।';
  }

  context.push(`Best market: ${best?.market.name ?? 'N/A'}`);
  context.push(`Best net value: ₹${Math.round(best?.econ.netRevenue ?? 0)}`);

  return buildResult(
    makeDecisionId(), farm.farmId, 'HARVEST_CHECK',
    selectedAction, confidence, urgency,
    observations, context, candidateActions, rejectedActions, constraints,
    { expectedRevenue: best?.econ.netRevenue ?? 0 },
    explanation, hindiReason, 'AI_DERIVED'
  );
}

// ─── CLIMATE DECISION ────────────────────────────────────────────────────────

// Additional thresholds for extended climate scenarios
const FLOOD_THRESHOLDS = {
  highRainfallMm: 40,          // mm/day — severe flash flood risk
  veryHighRainfallMm: 20,      // mm/day — moderate waterlogging risk
  highHumidityPercent: 88,     // % — fungal/mold risk alongside rain
};

const DROUGHT_THRESHOLDS = {
  criticalMoisturePercent: 18, // % — emergency irrigation needed
  lowRainProbability: 10,      // % — no rain expected
  highTempC: 35,               // °C — evapotranspiration accelerated
};

const FROST_THRESHOLDS = {
  frostRiskC: 8,               // °C — active frost injury risk
  chillingRiskC: 14,           // °C — chilling injury to tropical/sub-tropical crops
};

export function evaluateClimateDecision(state: FarmState): DecisionResult {
  const { farm } = state;
  const weather = farm.weather;
  const soil = farm.soil;

  // ─── SENSOR SAFETY CLAMPING ────────────────────────────────────────────
  // Clamp all sensor inputs before any decision — bad data = bad decisions
  const { value: tempC, isReliable: tempReliable } = safeTemperature(weather.temperature.value);
  const rainfallMm = safeRainfall(weather.rainfall.value);
  const rainProb = safeRainProb(weather.rainProbability.value);
  const humidityPct = safeHumidity(weather.humidity.value);
  const { value: soilMoisture, isReliable: soilReliable } = safeSoilMoisture(soil.moisture.value);
  // Wind speed: loo (hot dry wind) above 30 km/h dramatically increases evapotranspiration
  const windSpeedKmh = clampSensorValue((weather as { windSpeed?: { value?: number } }).windSpeed?.value, 0, 150, 10);
  const isLooCondition = tempC >= 38 && windSpeedKmh >= 30 && humidityPct < 35; // Hot dry wind = loo

  const observations: string[] = [
    `Temperature: ${tempC}°C${!tempReliable ? ' ⚠ (sensor fallback)' : ''}`,
    `Rainfall today: ${rainfallMm}mm`,
    `Rain probability: ${rainProb}%`,
    `Humidity: ${humidityPct}%`,
    `Soil moisture: ${soilMoisture}%${!soilReliable ? ' ⚠ (sensor fallback)' : ''}`,
    `Heat risk: ${weather.heatRisk}`,
    ...(isLooCondition ? [`Wind speed: ${windSpeedKmh} km/h — LOO WIND DETECTED`] : []),
  ];

  const candidateActions: ActionType[] = ['PREPARE_FOR_HEAT', 'IRRIGATE', 'MONITOR', 'WAIT', 'EMERGENCY_HARVEST'];
  const rejectedActions: { action: ActionType; reason: string }[] = [];

  let selectedAction: ActionType = 'MONITOR';
  let confidence: ConfidenceLevel = tempReliable && soilReliable ? 'HIGH' : 'MEDIUM';
  let urgency: UrgencyLevel = 'LOW';
  let explanation = '';
  let hindiReason = '';

  // ─── PRIORITY 1: Flash Flood / Sudden Storm ─────────────────────────────
  if (rainfallMm >= FLOOD_THRESHOLDS.highRainfallMm) {
    selectedAction = 'EMERGENCY_HARVEST';
    urgency = 'CRITICAL';
    // Soil sensor confirms saturation → boost confidence
    if (soilMoisture > 75 && soilReliable) confidence = 'HIGH';
    rejectedActions.push({ action: 'WAIT', reason: 'Flash flood — roots will rot within hours' });
    rejectedActions.push({ action: 'IRRIGATE', reason: 'Excess water already present' });
    explanation = `FLASH FLOOD ALERT: ${rainfallMm}mm of rainfall today. Soil saturation at ${soilMoisture}% — root asphyxiation and fungal disease imminent. Open drainage channels immediately and harvest mature produce before it is lost.`;
    hindiReason = `बाढ़ की चेतावनी. आज ${rainfallMm}mm बारिश हुई है. मिट्टी ${soilMoisture}% भरी है. जल निकासी तुरंत खोलें और पकी फसल काटें.`;

  // ─── PRIORITY 2: Waterlogging Risk (moderate rain + high humidity) ───────
  } else if (rainfallMm >= FLOOD_THRESHOLDS.veryHighRainfallMm && humidityPct >= FLOOD_THRESHOLDS.highHumidityPercent) {
    selectedAction = 'MONITOR';
    urgency = 'HIGH';
    confidence = soilReliable ? 'HIGH' : 'MEDIUM';
    rejectedActions.push({ action: 'IRRIGATE', reason: 'Soil already near saturation' });
    explanation = `Heavy rain (${rainfallMm}mm) + high humidity (${humidityPct}%) detected. Risk of waterlogging and fungal disease. Open drainage channels, hold all irrigation and apply preventive fungicide spray.`;
    hindiReason = `भारी बारिश (${rainfallMm}mm) और अधिक नमी (${humidityPct}%) है. जड़ सड़न का खतरा है. नालियाँ खोलें और सिंचाई रोकें.`;

  // ─── PRIORITY 3: Critical Heatwave ───────────────────────────────────────
  } else if (tempC >= HEAT_THRESHOLDS.critical) {
    selectedAction = 'IRRIGATE'; // Mist/cooling irrigation
    urgency = 'CRITICAL';
    rejectedActions.push({ action: 'WAIT', reason: 'Critical heat — immediate crop stress' });
    explanation = `CRITICAL HEAT: ${tempC}°C detected. Crop experiencing severe heat stress. Emergency micro-irrigation and mulching to cool root zone required immediately.`;
    hindiReason = `तापमान ${tempC}°C है — बहुत खतरनाक. फसल को तुरंत पानी दें और मल्चिंग करें.`;

  // ─── PRIORITY 3.5: LOO WIND (Hot Dry Wind — most missed Indian scenario) ──
  // Loo = dry hot wind ≥30 km/h at ≥38°C with humidity <35% → 2-3× evapotranspiration
  } else if (isLooCondition) {
    selectedAction = 'IRRIGATE';
    urgency = 'HIGH';
    rejectedActions.push({ action: 'WAIT', reason: `Loo wind at ${windSpeedKmh} km/h accelerates evapotranspiration by 2-3x — crops will wilt within hours` });
    explanation = `LOO WIND DETECTED: Temperature ${tempC}°C, wind speed ${windSpeedKmh} km/h, humidity ${humidityPct}%. This hot dry wind dramatically accelerates plant water loss via transpiration. Irrigate root zone immediately. Avoid foliar sprays. Consider temporary shade nets.`;
    hindiReason = `लू हवा चल रही है (${windSpeedKmh} किमी/घंटा, ${tempC}°C). फसल तेजी से सूख रही है. तुरंत जड़ को पानी दें और छाया करें.`;

  // ─── PRIORITY 4: High Heatwave ───────────────────────────────────────────
  } else if (tempC >= HEAT_THRESHOLDS.high) {
    selectedAction = 'PREPARE_FOR_HEAT';
    urgency = 'HIGH';
    rejectedActions.push({ action: 'WAIT', reason: 'High heat forecast — proactive action prevents loss' });
    explanation = `High heat (${tempC}°C) forecast. Schedule irrigation for before 7 AM and after 6 PM. Apply mulch around root zone to retain moisture and reduce ground temperature.`;
    hindiReason = `तापमान ${tempC}°C है। सुबह 7 बजे से पहले या शाम 6 बजे के बाद सिंचाई करें। मल्चिंग लगाएं।`;

  // ─── PRIORITY 5: Frost / Cold Snap ───────────────────────────────────────
  } else if (tempC <= FROST_THRESHOLDS.frostRiskC) {
    selectedAction = 'IRRIGATE'; // Light irrigation to release latent heat (frost protection technique)
    urgency = 'CRITICAL';
    rejectedActions.push({ action: 'WAIT', reason: 'Frost will kill exposed tissue — act immediately' });
    explanation = `FROST ALERT: Temperature has dropped to ${tempC}°C. Chilling/frost injury will damage young growth and flowering tissue. Apply light overhead irrigation (releases latent heat) to protect plants. Cover sensitive plants with frost cloth.`;
    hindiReason = `पाला पड़ने का खतरा. तापमान ${tempC}°C तक गिर गया है। हल्का पानी दें और फसल को ढकें, पाले से बचाव करें।`;

  // ─── PRIORITY 6: Chilling Injury Risk ────────────────────────────────────
  } else if (tempC <= FROST_THRESHOLDS.chillingRiskC) {
    selectedAction = 'MONITOR';
    urgency = 'HIGH';
    confidence = 'MEDIUM';
    explanation = `Cold stress risk: temperature dropped to ${tempC}°C. Tropical/sub-tropical crops (tomato, capsicum, banana) are susceptible to chilling injury below 12°C. Monitor overnight and prepare protective covers if temperature drops further.`;
    hindiReason = `ठंड का खतरा: तापमान ${tempC}°C है। टमाटर और मिर्च जैसी फसलें ठंड से नुकसान में आ सकती हैं। रात को ध्यान रखें।`;

  // ─── PRIORITY 7: Drought Stress ──────────────────────────────────────────
  } else if (soilMoisture <= DROUGHT_THRESHOLDS.criticalMoisturePercent && rainProb <= DROUGHT_THRESHOLDS.lowRainProbability && tempC >= DROUGHT_THRESHOLDS.highTempC) {
    selectedAction = 'IRRIGATE';
    urgency = 'CRITICAL';
    rejectedActions.push({ action: 'WAIT', reason: 'Soil critically dry, no rain expected — crop will wilt' });
    explanation = `DROUGHT STRESS: Soil moisture critically low at ${soilMoisture}% with only ${rainProb}% rain probability. At ${tempC}°C, evapotranspiration is accelerated. Deep drip irrigation required urgently to prevent permanent wilting point.`;
    hindiReason = `सूखे की स्थिति: मिट्टी की नमी ${soilMoisture}% है और बारिश की संभावना केवल ${rainProb}% है। तुरंत ड्रिप सिंचाई करें।`;

  // ─── PRIORITY 8: Combined Pest-Heat Stress (moderate heat + dry conditions) ─
  } else if (tempC >= HEAT_THRESHOLDS.medium && soilMoisture < 30) {
    selectedAction = 'IRRIGATE';
    urgency = 'MEDIUM';
    confidence = 'MEDIUM';
    rejectedActions.push({ action: 'WAIT', reason: 'Heat and drought stress together amplify pest susceptibility' });
    explanation = `Moderate heat (${tempC}°C) combined with low soil moisture (${soilMoisture}%) creates dual stress — increasing susceptibility to spider mites and thrips. Irrigate to relieve moisture stress and reduce pest pressure.`;
    hindiReason = `मध्यम गर्मी (${tempC}°C) और कम नमी (${soilMoisture}%) से माइट्स और थ्रिप्स का खतरा बढ़ता है। सिंचाई करें।`;

  // ─── DEFAULT: Normal Conditions ──────────────────────────────────────────
  } else {
    selectedAction = 'MONITOR';
    urgency = 'LOW';
    explanation = `All climate indicators within acceptable range. Temperature: ${tempC}°C, Soil moisture: ${soilMoisture}%, Rain probability: ${rainProb}%. Monitoring continues.`;
    hindiReason = `सभी जलवायु संकेतक सामान्य हैं। तापमान ${tempC}°C, नमी ${soilMoisture}% — निगरानी जारी है।`;
  }

  return buildResult(
    makeDecisionId(), farm.farmId, 'CLIMATE_CHECK',
    selectedAction, confidence, urgency,
    observations, [], candidateActions, rejectedActions, [],
    {},
    explanation, hindiReason, 'AI_DERIVED'
  );
}

// ─── CROSS-SHIELD PRIORITY ────────────────────────────────────────────────────

export interface PriorityResult {
  nextBestAction: ActionType;
  urgency: UrgencyLevel;
  shieldType: 'RESOURCE_SAVER' | 'HARVEST_PROTECTOR' | 'CLIMATE_DEFENDER';
  explanation: string;
  hindiReason: string;
  allDecisions: DecisionResult[];
}

export function evaluateFarmPriority(state: FarmState): PriorityResult {
  const irrigationDecision = evaluateIrrigationDecision(state);
  const harvestDecision = evaluateHarvestDecision(state);
  const climateDecision = evaluateClimateDecision(state);

  const urgencyScore = (u: UrgencyLevel): number => {
    const map: Record<UrgencyLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
    return map[u];
  };

  const candidates = [
    { decision: climateDecision, shield: 'CLIMATE_DEFENDER' as const },
    { decision: harvestDecision, shield: 'HARVEST_PROTECTOR' as const },
    { decision: irrigationDecision, shield: 'RESOURCE_SAVER' as const },
  ];

  candidates.sort((a, b) =>
    urgencyScore(b.decision.urgency) - urgencyScore(a.decision.urgency)
  );

  const top = candidates[0];

  return {
    nextBestAction: top.decision.selectedAction,
    urgency: top.decision.urgency,
    shieldType: top.shield,
    explanation: top.decision.explanation,
    hindiReason: top.decision.hindiReason ?? '',
    allDecisions: [irrigationDecision, harvestDecision, climateDecision],
  };
}

// ─── POST-HARVEST SMART ENGINE (MONITOR → UNDERSTAND → DECIDE → ACT) ────────
export * from './postHarvestEngine';

// ─── VOICE INTENT → DECISION (DELEGATED TO AGRO INTELLIGENCE ENGINE) ─────────
export type { VoiceResolution } from './agroIntelligenceEngine';
export { resolveVoiceIntent } from './agroIntelligenceEngine';

// ─── BUILDER ─────────────────────────────────────────────────────────────────

function buildResult(
  decisionId: string,
  farmId: string,
  eventType: string,
  selectedAction: ActionType,
  confidence: ConfidenceLevel,
  urgency: UrgencyLevel,
  observations: string[],
  context: string[],
  candidateActions: ActionType[],
  rejectedActions: { action: ActionType; reason: string }[],
  constraints: string[],
  expectedImpact: Record<string, number>,
  explanation: string,
  hindiReason: string,
  provenance: import('../domain/types').SourceType
): DecisionResult {
  return {
    decisionId,
    timestamp: new Date().toISOString(),
    farmId,
    eventType,
    status: 'RECOMMENDED',
    selectedAction,
    confidence,
    urgency,
    observations,
    context,
    candidateActions,
    rejectedActions,
    constraints,
    expectedImpact,
    explanation,
    nextCheck: 'After next sensor/weather update',
    provenance,
    humanFriendlyReason: explanation,
    hindiReason,
  };
}
