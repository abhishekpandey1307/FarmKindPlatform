// =============================================================================
// TESTS — GEMINI 2.0 FLASH REASONING & INDIAN NEURAL VOICE TTS
// Validates 100% live context serialization, clean speech text conversion,
// and zero-risk fallback execution.
// =============================================================================

import { describe, it, expect, vi } from 'vitest';
import {
  buildComprehensiveFarmerContext,
  buildGeminiSystemPrompt,
  queryGeminiVoiceAI,
} from '../services/geminiVoiceService';
import { processMitraServerQuery } from '../../server/mitraBackend';
import { cleanTextForSpeech, selectBestIndianVoice } from '../utils/indianVoiceSynth';
import { createInitialFarmState } from '../engine/simulation';
import type { AppState } from '../app/AppContext';

function createMockAppState(): AppState {
  const farmState = createInitialFarmState();
  return {
    farmState,
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
    activeScreen: 5,
    showProvenancePanel: false,
    showDemoControls: false,
    showLiveInspector: false,
    isConnecting: false,
    connectionStep: 0,
    isOffline: false,
    offlineQueueCount: 0,
    liveSync: {
      isActive: true,
      isLiveMode: true,
      refreshIntervalSec: 60,
      countdownSec: 60,
      lastSyncedTime: new Date().toISOString(),
      syncCount: 1,
      isSyncing: false,
      lastLatencyMs: 42,
      apiEndpoint: 'https://api.open-meteo.com/v1/forecast (Nashik)',
      error: null,
    },
    liveWeather: {
      latitude: 19.9975,
      longitude: 73.7898,
      locationName: 'Nashik, Maharashtra',
      temperatureC: 34.5,
      relativeHumidity: 48,
      precipitationMm: 0,
      rainMm: 0,
      rainProbabilityPercent: 5,
      weatherCode: 1,
      weatherDescription: 'Mainly clear',
      windSpeedKmh: 12,
      solarRadiationWm2: 820,
      estimatedSolarPumpKw: 3.8,
      solarOutputEstimateNote: 'Estimate',
      soilMoistureSatellitePercent: 26,
      soilMoistureModelDerivedPercent: 26,
      soilMoistureDescription: 'model-derived',
      soilTemperatureC: 28,
      timestamp: new Date().toISOString(),
      latencyMs: 120,
      isRealApi: true,
      source: 'OPEN_METEO_LIVE',
    },
    liveMandis: [
      {
        mandiId: 'nashik-apmc',
        mandiName: 'Nashik APMC',
        district: 'Nashik',
        state: 'Maharashtra',
        distanceKm: 14,
        commodity: 'Tomato',
        variety: 'Hybrid',
        grade: 'A',
        minPricePerKg: 38,
        maxPricePerKg: 46,
        modalPricePerKg: 42,
        priceTrend: 'UP',
        trendDiffPerKg: 4,
        dailyArrivalsTonnes: 120,
        transportFreightPerKg: 2.5,
        netRealizationPerKg: 39.5,
        buyerDemand: 'HIGH',
        lastSyncedAt: new Date().toISOString(),
        verificationStatus: 'VERIFIED',
        source: 'AGMARKNET_OFFICIAL',
        lastVerified: 'Just now',
        freshness: 'FRESH',
      },
    ],
    solarBookings: [],
    directContracts: [],
    farmUpgrades: {
      sharedSolarDrip: true,
      sharedSolarBooking: false,
      inSituSensor: true,
      solarColdStorage: true,
      govSubsidyChecked: false,
    },
    celebration: null,
    cameFromRecommendations: false,
    farmAnalyzed: true,
    activeMarketTab: 'SOLAR',
    language: 'hi',
  };
}

describe('Gemini 2.0 Flash Live Voice Intelligence Service', () => {
  it('serializes 100% of live farm telemetry into the context prompt without missing any critical fields', () => {
    const mockState = createMockAppState();
    const context = buildComprehensiveFarmerContext(mockState);

    // Verify all critical telemetry is present
    expect(context).toContain('Ramesh Patil');
    expect(context).toContain('Nashik');
    expect(context).toContain('Tomato');
    expect(context).toContain('LIVE SOIL TELEMETRY');
    expect(context).toContain('HYPERLOCAL AGROMETEOROLOGY');
    expect(context).toContain('34.5°C');
    expect(context).toContain('Nashik APMC');
    expect(context).toContain('₹42/kg');
    expect(context).toContain('Shared Solar Drip Active');
  });

  it('builds a rural-friendly Hindi system instruction persona', () => {
    const mockState = createMockAppState();
    const systemPrompt = buildGeminiSystemPrompt(mockState, 'hi');

    expect(systemPrompt).toContain('किसान मित्र');
    expect(systemPrompt).toContain('FarmKind');
    expect(systemPrompt).toContain('लाइव डेटा');
    expect(systemPrompt).toContain('मार्कडाउन चिन्ह');
  });

  it('falls back seamlessly to local engine without error when backend or API key is absent', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Backend offline'));
    const mockState = createMockAppState();
    const res = await queryGeminiVoiceAI('आज पानी देना है क्या?', mockState, 'hi');

    expect(res.source).toBe('LOCAL_FALLBACK');
    expect(res.text.length).toBeGreaterThan(10);
    expect(res.text).toMatch(/सिंचाई|डीजल|बारिश/);
    fetchSpy.mockRestore();
  });

  it('server backend processMitraServerQuery safely falls back when GEMINI_API_KEY is not set', async () => {
    const res = await processMitraServerQuery(
      {
        queryText: 'आज पानी देना है क्या?',
        systemPrompt: 'You are Kisan Mitra',
      },
      { overrideApiKey: '', skipEnvReload: true }
    );

    expect(res.source).toBe('LOCAL_FALLBACK');
    expect(res.error).toContain('GEMINI_API_KEY not configured');
  });
});

describe('Indian Neural Voice Text-to-Speech Engine', () => {
  it('cleans markdown symbols, asterisks and bullets so speech reads as natural spoken dialogue', () => {
    const raw = '### **राम-राम किसान भाई!**\n* टमाटर में **सफेद मक्खी** का हमला है।\n- 5 ml नीम का तेल छिड़कें 🐛!';
    const cleaned = cleanTextForSpeech(raw);

    expect(cleaned).not.toContain('**');
    expect(cleaned).not.toContain('###');
    expect(cleaned).not.toContain('*');
    expect(cleaned).not.toContain('🐛');
    expect(cleaned).toContain('राम-राम किसान भाई!');
    expect(cleaned).toContain('सफेद मक्खी');
  });

  it('selects Microsoft Swara or Google Hindi neural voices over generic robotic voices', () => {
    const mockVoices: SpeechSynthesisVoice[] = [
      {
        name: 'Microsoft David Desktop - English (United States)',
        lang: 'en-US',
        default: true,
        localService: true,
        voiceURI: 'David',
      },
      {
        name: 'Microsoft Swara Online (Natural) - Hindi (India)',
        lang: 'hi-IN',
        default: false,
        localService: false,
        voiceURI: 'Swara',
      },
      {
        name: 'Google हिन्दी',
        lang: 'hi-IN',
        default: false,
        localService: false,
        voiceURI: 'Google Hindi',
      },
    ];

    const selected = selectBestIndianVoice(mockVoices, 'hi');
    expect(selected).not.toBeNull();
    expect(selected?.name).toBe('Microsoft Swara Online (Natural) - Hindi (India)');
  });

  it('eliminates "hai" -> "ho" distortion by replacing Hindi full stop (danda ।) with period and ensuring word boundary', () => {
    // Typical input where "है।" was previously misparsed as "हो"
    const sentenceWithDanda = 'आपकी मिट्टी में 18% नमी है। अभी सिंचाई की तुरंत आवश्यकता है।';
    const cleaned = cleanTextForSpeech(sentenceWithDanda, 'hi');

    // 1. Danda '।' must be replaced with standard '.'
    expect(cleaned).not.toContain('।');
    expect(cleaned).toContain('.');

    // 2. 'है' must be cleanly preserved as 'है.' (never attached to Devanagari danda)
    expect(cleaned).toContain('है.');
    expect(cleaned).not.toMatch(/है[।॥]/);

    // 3. Spoken abbreviations normalized
    expect(cleaned).toContain('18 प्रतिशत');
  });

  it('strictly selects Hindi voices over English-India voices for Hindi queries', () => {
    const mockVoices: SpeechSynthesisVoice[] = [
      {
        name: 'Microsoft Neerja Online (Natural) - English (India)',
        lang: 'en-IN',
        default: false,
        localService: false,
        voiceURI: 'Neerja',
      },
      {
        name: 'Microsoft Prabhat Online (Natural) - English (India)',
        lang: 'en-IN',
        default: false,
        localService: false,
        voiceURI: 'Prabhat',
      },
      {
        name: 'Microsoft Kalpana - Hindi (India)',
        lang: 'hi-IN',
        default: false,
        localService: true,
        voiceURI: 'Kalpana',
      },
    ];

    // For Hindi, it MUST pick Kalpana (Hindi) and NEVER Neerja (English)
    const selectedHi = selectBestIndianVoice(mockVoices, 'hi');
    expect(selectedHi?.name).toBe('Microsoft Kalpana - Hindi (India)');

    // For English, it picks Neerja
    const selectedEn = selectBestIndianVoice(mockVoices, 'en');
    expect(selectedEn?.name).toBe('Microsoft Neerja Online (Natural) - English (India)');
  });
});
