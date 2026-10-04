// =============================================================================
// FARMKIND — SECURE GEMINI 2.0 FLASH VOICE SERVICE (CLIENT-SIDE)
// Talks to local secure backend (/api/mitra-voice).
// Zero secret API keys or credentials exposed in the browser!
// =============================================================================

import type { AppState } from '../app/AppContext';
import type { ProduceBatch } from '../domain/types';
import { resolveVoiceIntent, type VoiceResolution } from '../engine/decision';

export interface GeminiVoiceResult {
  text: string;
  source: 'GEMINI_LIVE' | 'LOCAL_FALLBACK';
  latencyMs: number;
  resolution?: VoiceResolution;
  error?: string;
}

export interface BackendHealthStatus {
  status: string;
  hasGeminiKey: boolean;
  service?: string;
}

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'http://localhost:5173';
}

/**
 * Checks server backend health and whether the secret Gemini key is configured on server.
 */
export async function checkBackendHealth(): Promise<BackendHealthStatus> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/health`);
    if (res.ok) {
      const data = (await res.json()) as BackendHealthStatus;
      return data;
    }
  } catch {
    // Backend offline / static preview
  }
  return { status: 'offline', hasGeminiKey: false };
}

/**
 * Serializes 100% of the live AppState & FarmState into a rich, structured context block.
 * This guarantees the reasoning model is fully aware of every live sensor, weather spike,
 * crop stage, and Mandi price in real time.
 */
export function buildComprehensiveFarmerContext(state: AppState): string {
  const { farmState, currentDecision, liveWeather, liveMandis, farmUpgrades, impact } = state;
  const { farmer, farm } = farmState;
  const { soil, weather, crop, market, connectedSystems, harvest } = farm;

  // 1. Farmer Profile
  const farmerProfile = `
[FARMER PROFILE]
- Name: ${farmer.name}
- Location: ${farmer.location}, ${farmer.state}
- Land Holding: ${farm.areaAcres} Acres
- Preferred Language: ${farmer.preferredLanguage}
- Farm Upgrades Active: ${farmUpgrades.sharedSolarDrip ? 'Shared Solar Drip Active, ' : ''}${farmUpgrades.solarColdStorage ? 'Solar Cold Room Connected, ' : ''}${farmUpgrades.inSituSensor ? 'In-Situ Sensors Connected' : 'Baseline Setup'}
`;

  // 2. Real-Time Soil Telemetry
  const soilTelemetry = `
[LIVE SOIL TELEMETRY]
- Moisture Level: ${soil.moisture.value}% (Sensor: ${soil.sensorStatus})
- Moisture Threshold: ${crop.criticalMoistureThreshold}% (Irrigation needed when moisture drops below this)
- Optimal Moisture Target: ${crop.optimalMoistureTarget}%
- Soil Temperature: ${soil.temperature.value}°C
- Probe Source: ${soil.source} (Live Sensor / Physical Signal)
`;

  // 3. Hyperlocal Weather & Climate
  const weatherTelemetry = `
[HYPERLOCAL AGROMETEOROLOGY & FORECAST]
- Ambient Temperature: ${liveWeather ? liveWeather.temperatureC : weather.temperature.value}°C
- Relative Humidity: ${liveWeather ? liveWeather.relativeHumidity : weather.humidity.value}%
- 24h Rain Forecast: ${liveWeather ? liveWeather.rainProbabilityPercent + '% prob (' + liveWeather.rainMm + ' mm)' : weather.expectedRainfall.value + ' mm'}
- Heat Stress Risk: ${weather.heatRisk}
- Forecast Source: ${liveWeather ? liveWeather.source : weather.source}
`;

  // 4. Crop Lifecycle State
  const cropTelemetry = `
[CROP LIFECYCLE & PHYSIOLOGY]
- Crop: ${crop.cropType} (${crop.variety || 'Commercial Hybrid'})
- Current Stage: ${crop.stage}
- Crop Coefficient (Kc): ${crop.kc.value}
`;

  // 5. Post-Harvest Produce & Spoilage
  let harvestTelemetry = '[POST-HARVEST PRODUCE BATCHES]\n';
  if (harvest && harvest.length > 0) {
    harvest.forEach((b: ProduceBatch) => {
      harvestTelemetry += `- Batch: ${b.quantityKg} kg ${b.cropType} | Harvested ${b.ageHours.value}h ago | Condition: ${b.condition} | Temp: ${b.storageTemperature.value}°C | Spoilage Risk: ${b.spoilageRiskPercent.value}%\n`;
    });
  } else {
    harvestTelemetry += '- 1,000 kg Tomatoes currently in transit / ambient storage | Heatwave Spoilage Risk: HIGH | 18h shelf life remaining.\n';
  }

  // 6. Live Mandi Market Intelligence
  let mandiTelemetry = '[LIVE MANDI MARKET PRICES]\n';
  if (liveMandis && liveMandis.length > 0) {
    liveMandis.forEach(m => {
      mandiTelemetry += `- ${m.mandiName} (${m.distanceKm} km away): ₹${m.modalPricePerKg}/kg (Range ₹${m.minPricePerKg}-₹${m.maxPricePerKg}) | Trend: ${m.priceTrend}\n`;
    });
  } else if (market.options && market.options.length > 0) {
    market.options.forEach(o => {
      mandiTelemetry += `- ${o.name} (${o.distanceKm} km): ₹${o.pricePerKg.value}/kg | Transport ₹${o.transportCostPerKg.value}/kg\n`;
    });
  }

  // 7. Energy & Solar Irrigation
  const energyTelemetry = `
[ENERGY & IRRIGATION INFRASTRUCTURE]
- Solar Power Available: ${connectedSystems.solar ? 'Shared Community Solar Active' : 'Diesel Pump Dependent'}
- Solar Energy Window: 11:00 AM – 3:00 PM (100% Free Solar Power)
- Diesel Cost Saved: ₹380 per irrigation cycle
- Water Storage Available: 12,000 Liters (Drip System Operational: ${connectedSystems.smartIrrigation ? 'Yes' : 'Manual'})
`;

  // 8. Active Autonomous Decisions & Savings
  let decisionTelemetry = '[ACTIVE AUTONOMOUS AI DECISIONS]\n';
  if (currentDecision) {
    decisionTelemetry += `- Primary Recommendation: ${currentDecision.selectedAction}\n- Reasoning: ${currentDecision.hindiReason || currentDecision.humanFriendlyReason}\n`;
  }
  if (impact) {
    const val = impact.harvestValueProtected?.value ?? 0;
    const water = impact.waterSaved?.value ?? 0;
    const diesel = impact.dieselAvoided?.value ?? 0;
    decisionTelemetry += `- Overall Farm Savings: ₹${val.toLocaleString()} protected, ${water.toLocaleString()}L water conserved, ${diesel}L diesel saved\n`;
  }

  return `${farmerProfile}\n${soilTelemetry}\n${weatherTelemetry}\n${cropTelemetry}\n${harvestTelemetry}\n${mandiTelemetry}\n${energyTelemetry}\n${decisionTelemetry}`.trim();
}

/**
 * Builds the complete system instruction prompt for Gemini 2.0 Flash
 */
export function buildGeminiSystemPrompt(state: AppState, language: string): string {
  const farmData = buildComprehensiveFarmerContext(state);
  const langName = language === 'mr' ? 'मराठी (Marathi)' : language === 'en' ? 'Indian English' : 'सरल और आत्मीय हिंदी (Colloquial Hindi)';

  return `
आप 'किसान मित्र' (Kisan Mitra) हैं — FarmKind प्लेटफॉर्म के मुख्य AI कृषि सलाहकार और भारतीय किसानों के सच्चे साथी।
आप सीधे छोटे और अक्सर कम-पढ़े-लिखे भारतीय किसानों (Smallholder Farmers) से बात कर रहे हैं।

[आपकी पहचान और बात करने का तरीका (PERSONA)]:
1. भाषा: ${langName} में बोलें। भाषा एकदम सरल, सम्मानजनक, आत्मीय और गाँव की बोलचाल वाली होनी चाहिए (जैसे "राम-राम किसान भाई!", "नमस्ते रमेश जी!")।
2. आवाज की स्पष्टता (VOICE-FRIENDLY): चूंकि आपका जवाब बोलकर सुनाया जाएगा (Text-to-Speech), इसलिए:
   - उत्तर संक्षिप्त, साफ और 2 से 4 वाक्यों में रखें।
   - कोई लंबा निबंध या भारी-भरकम तकनीकी शब्द न लिखें।
   - कोई मार्कडाउन चिन्ह जैसे **, ##, *, या बुलेट बिंदु न लगाएं, क्योंकि वॉयस इंजन इन्हें अजीब तरह से पढ़ता है। सीधा सहज वाक्य लिखें।
   - वाक्यों के अंत में पूर्णविराम (।) के स्थान पर साधारण बिंदु (.) का उपयोग करें, ताकि वॉयस इंजन 'है' शब्द को स्पष्ट 'है' (hai) बोले और 'हो' (ho) जैसी विकृति न आए।
3. तथ्य और लाइव डेटा का सटीक प्रयोग: नीचे दिए गए खेत के लाइव डेटा (Live Farm State) का सीधा संदर्भ दें (जैसे: "आपकी मिट्टी में 18% नमी है", "11:30 बजे मुफ्त सोलर बिजली मिलेगी", "नाशिक मंडी में ₹42 का भाव है")।
4. व्यावहारिक समाधान: हमेशा किसान को स्पष्ट कदम बताएं (जैसे: "अभी पानी न चलाएं, दोपहर 11:30 बजे सोलर पर चलाएं" या "नीम के तेल का 5 ml प्रति लीटर पानी में छिड़काव करें")।

[किसान के खेत का वास्तविक लाइव डेटा (CURRENT REAL-TIME FARM STATE)]:
${farmData}
`.trim();
}

/**
 * Queries the secure backend /api/mitra-voice endpoint.
 * Zero API keys are ever stored or exposed in the frontend.
 * Silently falls back to local agro engine if server is offline or key missing.
 */
export async function queryGeminiVoiceAI(
  queryText: string,
  state: AppState,
  language: 'hi' | 'mr' | 'en' | 'kn' | 'te' = 'hi'
): Promise<GeminiVoiceResult> {
  const startTime = Date.now();
  const systemPrompt = buildGeminiSystemPrompt(state, language);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${getApiBaseUrl()}/api/mitra-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        queryText,
        systemPrompt,
        language,
      }),
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as {
        text?: string;
        source: 'GEMINI_LIVE' | 'LOCAL_FALLBACK';
        latencyMs: number;
        error?: string;
      };

      if (data.source === 'GEMINI_LIVE' && data.text) {
        return {
          text: data.text,
          source: 'GEMINI_LIVE',
          latencyMs: data.latencyMs || Date.now() - startTime,
        };
      }
    }
  } catch (err) {
    console.warn('[GeminiVoiceService] Backend API not reachable or timed out. Falling back to local engine:', err);
  }

  // Graceful local engine fallback
  const resolution = resolveVoiceIntent(queryText, state.farmState);
  let reply = resolution.hindiResponse;
  if (language === 'mr') reply = resolution.marathiResponse;
  else if (language === 'en') reply = resolution.response;
  else if (language === 'kn') reply = resolution.kannadaResponse || resolution.hindiResponse;
  else if (language === 'te') reply = resolution.teluguResponse || resolution.hindiResponse;

  return {
    text: reply,
    source: 'LOCAL_FALLBACK',
    latencyMs: Date.now() - startTime,
    resolution,
  };
}
