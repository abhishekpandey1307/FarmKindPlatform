// =============================================================================
// SCREEN 2 — FARMKIND AI COMMAND CENTER & SMART IRRIGATION
// Central intelligence visualization:
// 1. Live Root-Zone Soil Sensor & Satellite Weather Telemetry
// 2. FarmKind AI Brain Core & Decision Flow Pipeline
// 3. Proactive Farming Advice Hero Card with Hindi Voice Guidance
// 4. One-tap Solar Pump Actuation & Automatic Shut-Off at 35% Target
// 5. Interactive Demo Scenarios (Dry Soil, Rain Delay, Reset)
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../app/AppContext';
import {
  CALCULATED_BASELINE,
  PUMP_FLOW_L_PER_HOUR,
  DIESEL_BURN_RATE_L_HR,
  DIESEL_PRICE_PER_L,
  calcPumpHours,
  formatINR,
} from '../../engine/calculation';
import {
  ConfidenceChip, DecisionTrace, SectionHeader,
  ListenButton, MoistureGauge, SensorStatusBadge, ProvenanceBadge
} from '../shared';
import { scrollToTarget } from '../../utils/scroll';
import type { IntelligenceState, DecisionResult } from '../../domain/types';

// ─── AI INTELLIGENCE CORE ANIMATION ──────────────────────────────────────────

interface FarmKindCoreProp {
  intelligenceState: IntelligenceState;
}

function FarmKindCore({ intelligenceState }: FarmKindCoreProp) {
  const stateLabels: Record<IntelligenceState, string> = {
    IDLE:      'IDLE',
    SIGNAL:    'SIGNAL',
    ANALYZING: 'ANALYZING',
    DECISION:  'DECISION',
    EXECUTING: 'EXECUTING',
    VERIFIED:  'VERIFIED',
    IMPACT:    'IMPACT',
  };

  const stateColors: Record<IntelligenceState, string> = {
    IDLE:      'var(--txt-dim)',
    SIGNAL:    'var(--clr-solar-amber)',
    ANALYZING: 'var(--clr-ai-cyan)',
    DECISION:  'var(--clr-farm-green)',
    EXECUTING: 'var(--clr-water-blue)',
    VERIFIED:  'var(--clr-farm-green)',
    IMPACT:    'var(--clr-farm-green)',
  };

  const isActive = intelligenceState !== 'IDLE';

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      <div className={`ai-core ${isActive ? `ai-core--${intelligenceState.toLowerCase()}` : ''}`}
           role="img" aria-label={`FarmKind Smart Engine: ${intelligenceState}`}>
        <div className="ai-core__ring ai-core__ring--outer" />
        <div className="ai-core__ring ai-core__ring--mid" />
        <div className="ai-core__center" style={{ color: stateColors[intelligenceState] }}>
          FK
        </div>
      </div>
      <span className="badge badge--simulated tracking-widest text-xs">
        {stateLabels[intelligenceState]}
      </span>
    </div>
  );
}

// ─── DECISION FLOW STEP ───────────────────────────────────────────────────────

interface FlowStepData {
  step: number;
  title: string;
  subtitle: string;
}

const FLOW_STEPS: FlowStepData[] = [
  { step: 1, title: '1. Checking Weather & Soil', subtitle: 'Checking live satellite weather, ground root moisture & crop status' },
  { step: 2, title: '2. Checking Rain Forecast', subtitle: 'Checking radar rain forecast to prevent unnecessary pumping' },
  { step: 3, title: '3. Calculating Farmer Savings', subtitle: 'Calculating diesel money and water saved with shared solar' },
  { step: 4, title: '4. Decision Ready', subtitle: 'Advice synthesized with 92% confidence & vernacular audio' },
];

function FlowStep({
  step,
  title,
  subtitle,
  active,
  done,
}: {
  step: number;
  title: string;
  subtitle: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      id={`flow-step-${step}`}
      className={`flow-step ${active ? 'flow-step--active' : ''} ${done ? 'flow-step--done' : ''}`}
    >
      <div className={`flow-check ${done ? 'flow-check--done' : ''}`}>
        {done ? '✓' : active ? '●' : step}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold flex items-center justify-between">
          <span style={{
            color: active
              ? 'var(--clr-ai-cyan)'
              : done
              ? 'var(--clr-farm-green)'
              : 'var(--txt-primary)',
          }}>
            {title}
          </span>
          {active && (
            <span className="badge badge--live text-xs" style={{ background: 'rgba(34,211,238,0.2)', color: 'var(--clr-ai-cyan)' }}>
              ANALYZING…
            </span>
          )}
          {done && (
            <span className="text-xs font-mono text-green">COMPLETE</span>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export function Screen2CommandCenter() {
  const {
    state, dispatch, evaluateDecisions, startScenario,
    approveAction, setUpgradeStatus, triggerLiveSync, toggleLiveInspector, navigateTo
  } = useApp();
  const { farmState, intelligenceState, currentDecision, liveWeather } = state;

  const farm = farmState.farm;
  const soil = farm.soil;
  const weather = farm.weather;

  // Visual simulation state
  const [demoScenario, setDemoScenario] = useState<'IDLE' | 'DRY_AUTO_IRRIGATE' | 'RAIN_DELAY'>('IDLE');
  const [demoStep, setDemoStep] = useState<number>(0); // 0: idle, 1: reading dry, 2: recommendation, 3: irrigating, 3.5: auto-shutoff, 4: completed
  const [simulatedMoisture, setSimulatedMoisture] = useState<number>(soil.moisture.value ?? 34);
  const [simulatedPumpOn, setSimulatedPumpOn] = useState<boolean>(farm.irrigation.pumpStatus === 'ON');
  const [simulatedRainProb, setSimulatedRainProb] = useState<number>(weather.rainProbability.value ?? 45);
  const [showTrace, setShowTrace] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);

  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Dynamic calculations derived from FAO-56 irrigation physics
  const deferredWaterL = Math.round(CALCULATED_BASELINE.floodGrossDailyL / 3); // 1 single irrigation application
  const deferredPumpHours = calcPumpHours(deferredWaterL, PUMP_FLOW_L_PER_HOUR);
  const deferredDieselL = Number((deferredPumpHours * DIESEL_BURN_RATE_L_HR).toFixed(1));
  const deferredDieselCostInr = Math.round(deferredDieselL * DIESEL_PRICE_PER_L);

  const clearDemoTimers = () => {
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
  };

  // Auto-run pipeline on initial mount every time user enters Command Center
  useEffect(() => {
    setAnalysisStep(1);
    const t1 = setTimeout(() => setAnalysisStep(2), 500);
    const t2 = setTimeout(() => setAnalysisStep(3), 1000);
    const t3 = setTimeout(() => {
      setAnalysisStep(4);
      setDemoStep(2);
    }, 1500);
    demoTimersRef.current.push(t1, t2, t3);
    return clearDemoTimers;
  }, []);

  // Sync with soil state when not running interactive demo
  useEffect(() => {
    if (demoScenario === 'IDLE') {
      setSimulatedMoisture(soil.moisture.value ?? 34);
      setSimulatedPumpOn(farm.irrigation.pumpStatus === 'ON');
      setSimulatedRainProb(weather.rainProbability.value ?? 45);
    }
  }, [soil.moisture.value, farm.irrigation.pumpStatus, weather.rainProbability.value, demoScenario]);

  // ─── SCENARIO 1: DRY SOIL → AI RECOMMENDS DRIP → AUTO SHUTOFF AT 35% ────────
  const runDrySoilDemo = useCallback(() => {
    clearDemoTimers();
    setDemoScenario('DRY_AUTO_IRRIGATE');
    setDemoStep(1);
    setAnalysisStep(1);
    setSimulatedPumpOn(false);
    setSimulatedRainProb(10); // Clear skies

    // Step 1: Soil moisture drops to dry 26%
    setSimulatedMoisture(26);

    dispatch({
      type: 'FARM_EVENT',
      event: {
        eventId: `sensor-dry-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'SENSOR_READING',
        payload: { moisture: 26, temperature: 29 },
        description: 'Soil moisture critical: 26%',
        sourceType: 'SIMULATED',
      },
    });

    const t1 = setTimeout(() => {
      setAnalysisStep(2);
    }, 600);

    const t2 = setTimeout(() => {
      setAnalysisStep(3);
    }, 1100);

    const t3 = setTimeout(() => {
      setAnalysisStep(4);
      setDemoStep(2);
      scrollToTarget('smart-ai-recommendation-hero', { block: 'nearest', delay: 100, highlight: true });
    }, 1600);

    demoTimersRef.current.push(t1, t2, t3);
  }, [dispatch]);

  // ─── FARMER APPROVES & STARTS PUMP ─────────────────────────────────────────
  const handleApprovePumpStart = useCallback(() => {
    setDemoStep(3);
    setSimulatedPumpOn(true);
    setUpgradeStatus('sharedSolarDrip', true);
    setUpgradeStatus('inSituSensor', true);

    dispatch({
      type: 'FARM_EVENT',
      event: {
        eventId: `irr-start-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'IRRIGATION_START',
        payload: { pumpStatus: 'ON' },
        description: 'Solar drip irrigation started',
        sourceType: 'SIMULATED',
      },
    });

    // Smoothly tick moisture upward: 26% -> 28% -> 30% -> 32% -> 34% -> 35%
    const t1 = setTimeout(() => {
      setSimulatedMoisture(28);
      dispatch({
        type: 'FARM_EVENT',
        event: {
          eventId: `sensor-28-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'SENSOR_READING',
          payload: { moisture: 28, temperature: 28 },
          description: 'Moisture rising: 28%',
          sourceType: 'SIMULATED',
        },
      });
    }, 1200);

    const t2 = setTimeout(() => {
      setSimulatedMoisture(30);
      dispatch({
        type: 'FARM_EVENT',
        event: {
          eventId: `sensor-30-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'SENSOR_READING',
          payload: { moisture: 30, temperature: 28 },
          description: 'Moisture rising: 30% (Critical drought threshold cleared)',
          sourceType: 'SIMULATED',
        },
      });
    }, 2400);

    const t3 = setTimeout(() => {
      setSimulatedMoisture(32);
      dispatch({
        type: 'FARM_EVENT',
        event: {
          eventId: `sensor-32-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'SENSOR_READING',
          payload: { moisture: 32, temperature: 28 },
          description: 'Moisture rising: 32%',
          sourceType: 'SIMULATED',
        },
      });
    }, 3600);

    const t4 = setTimeout(() => {
      setSimulatedMoisture(34);
      dispatch({
        type: 'FARM_EVENT',
        event: {
          eventId: `sensor-34-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'SENSOR_READING',
          payload: { moisture: 34, temperature: 28 },
          description: 'Moisture rising: 34% (Approaching target)',
          sourceType: 'SIMULATED',
        },
      });
    }, 4800);

    // Target 35% reached -> Auto shutoff!
    const t5 = setTimeout(() => {
      setSimulatedMoisture(35);
      setSimulatedPumpOn(false); // Pump automatically stops!
      setDemoStep(3.5);

      dispatch({
        type: 'FARM_EVENT',
        event: {
          eventId: `sensor-35-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'SENSOR_READING',
          payload: { moisture: 35, temperature: 28 },
          description: 'Target moisture reached: 35%',
          sourceType: 'SIMULATED',
        },
      });

      dispatch({
        type: 'FARM_EVENT',
        event: {
          eventId: `sensor-live-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'SENSOR_STATUS_CHANGE',
          payload: { status: 'LIVE' },
          description: 'Sensor live at 35% target',
          sourceType: 'SIMULATED',
        },
      });

      dispatch({
        type: 'FARM_EVENT',
        event: {
          eventId: `irr-stop-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'IRRIGATION_STOP',
          payload: { pumpStatus: 'OFF' },
          description: 'Pump stopped automatically — 35% target reached',
          sourceType: 'SIMULATED',
        },
      });
    }, 6000);

    // Transition to completed status
    const t6 = setTimeout(() => {
      setDemoStep(4);

      dispatch({
        type: 'DECISION_GENERATED',
        kind: 'irrigation',
        decision: {
          decisionId: `dec-irr-complete-${Date.now()}`,
          timestamp: new Date().toISOString(),
          farmId: 'farm-001',
          eventType: 'OPTIMUM_REACHED',
          status: 'COMPLETED',
          selectedAction: 'MONITOR',
          confidence: 'HIGH',
          urgency: 'LOW',
          observations: ['Soil moisture: 35% (Optimal target reached)', 'Shared pump: Stopped automatically'],
          context: ['Tomato root zone at 35% capacity', 'Nashik 3.5 acres'],
          candidateActions: ['MONITOR'],
          rejectedActions: [{ action: 'IRRIGATE', reason: 'Target moisture reached; further pumping risks waterlogging' }],
          constraints: [],
          expectedImpact: { waterSavedL: 12000, dieselAvoidedL: 45 },
          explanation: 'Root-zone moisture has reached optimal 35%. Shared solar pump stopped automatically. FarmKind Smart Engine has transitioned to passive monitoring.',
          provenance: 'AI_DERIVED',
          humanFriendlyReason: 'Irrigation complete. Optimum root moisture reached (35%). Pump shut off automatically.',
          hindiReason: 'सिंचाई सफलतापूर्वक पूरी हो गई! मिट्टी की नमी 35% पहुंच गई है और मोटर अपने आप बंद हो गई है। 45 लीटर डीजल बचा — अब केवल निगरानी रखी जा रही है।',
        },
      });

      evaluateDecisions();
    }, 7200);

    demoTimersRef.current.push(t1, t2, t3, t4, t5, t6);
  }, [dispatch, evaluateDecisions, setUpgradeStatus]);

  // ─── SCENARIO 2: RAIN EXPECTED → RESOURCE SAVER DEMO ───────────────────────
  const runRainDelayDemo = useCallback(() => {
    clearDemoTimers();
    setDemoScenario('RAIN_DELAY');
    setDemoStep(1);
    setAnalysisStep(1);
    setSimulatedPumpOn(false);

    setSimulatedMoisture(29);
    setSimulatedRainProb(78); // Rain coming!

    dispatch({
      type: 'FARM_EVENT',
      event: {
        eventId: `weather-rain-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'WEATHER_UPDATE',
        payload: { rainProbability: 78, expectedRainfall: 22, temperature: 34 },
        description: 'Incoming rain radar: 78%',
        sourceType: 'SIMULATED',
      },
    });

    const t1 = setTimeout(() => setAnalysisStep(2), 600);
    const t2 = setTimeout(() => setAnalysisStep(3), 1200);
    const t3 = setTimeout(() => {
      setAnalysisStep(4);
      setDemoStep(2);
      scrollToTarget('smart-ai-recommendation-hero', { block: 'nearest', delay: 100, highlight: true });
    }, 1800);

    demoTimersRef.current.push(t1, t2, t3);
  }, [dispatch]);

  // ─── RESET DEMO ────────────────────────────────────────────────────────────
  const resetDemoState = useCallback(() => {
    clearDemoTimers();
    setDemoScenario('IDLE');
    setDemoStep(0);
    setAnalysisStep(1);
    setSimulatedMoisture(soil.moisture.value ?? 34);
    setSimulatedPumpOn(farm.irrigation.pumpStatus === 'ON');
    setSimulatedRainProb(weather.rainProbability.value ?? 45);

    dispatch({
      type: 'FARM_EVENT',
      event: {
        eventId: `reset-sensor-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'SENSOR_READING',
        payload: { moisture: 34, temperature: 28 },
        description: 'Sensor reset to baseline: 34%',
        sourceType: 'SIMULATED',
      },
    });

    dispatch({
      type: 'FARM_EVENT',
      event: {
        eventId: `reset-pump-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'IRRIGATION_STOP',
        payload: { pumpStatus: 'OFF' },
        description: 'Pump reset to OFF',
        sourceType: 'SIMULATED',
      },
    });

    const t1 = setTimeout(() => setAnalysisStep(2), 500);
    const t2 = setTimeout(() => setAnalysisStep(3), 1000);
    const t3 = setTimeout(() => {
      setAnalysisStep(4);
      setDemoStep(2);
      evaluateDecisions();
    }, 1500);

    demoTimersRef.current.push(t1, t2, t3);
  }, [dispatch, evaluateDecisions, soil.moisture.value, farm.irrigation.pumpStatus, weather.rainProbability.value]);

  const handleApproveIrrigate = useCallback(() => {
    if (currentDecision) {
      approveAction(currentDecision.decisionId);
    }
    handleApprovePumpStart();
  }, [currentDecision, approveAction, handleApprovePumpStart]);

  const sensorLive = soil.sensorStatus === 'LIVE';
  const moisture = simulatedMoisture;
  const pumpIsOn = simulatedPumpOn;

  // Dynamic decision object
  const getDynamicDecision = (): DecisionResult => {
    if (demoStep === 4 || (moisture >= 35 && !pumpIsOn && demoScenario === 'DRY_AUTO_IRRIGATE')) {
      return {
        decisionId: 'demo-irr-complete',
        timestamp: new Date().toISOString(),
        farmId: 'farm-001',
        eventType: 'OPTIMUM_REACHED',
        status: 'COMPLETED',
        selectedAction: 'MONITOR',
        confidence: 'HIGH',
        urgency: 'LOW',
        observations: ['Soil moisture: 35% (Optimal target reached)', 'Shared pump: Stopped automatically'],
        context: ['Tomato root zone at 35% capacity', 'Nashik 3.5 acres'],
        candidateActions: ['MONITOR'],
        rejectedActions: [{ action: 'IRRIGATE', reason: 'Target moisture reached; further pumping risks waterlogging' }],
        constraints: [],
        expectedImpact: { waterSavedL: 12000, dieselAvoidedL: 45 },
        explanation: 'Root-zone moisture has reached optimal 35%. Shared solar pump stopped automatically. FarmKind Smart Engine has transitioned to passive monitoring.',
        provenance: 'AI_DERIVED',
        humanFriendlyReason: 'Irrigation complete. Optimum root moisture reached (35%). Pump shut off automatically.',
        hindiReason: 'सिंचाई सफलतापूर्वक पूरी हो गई! मिट्टी की नमी 35% पहुंच गई है और मोटर अपने आप बंद हो गई है। 45 लीटर डीजल बचा — अब केवल निगरानी रखी जा रही है।',
      };
    }

    if (demoStep === 3.5) {
      return {
        decisionId: 'demo-irr-shutoff',
        timestamp: new Date().toISOString(),
        farmId: 'farm-001',
        eventType: 'OPTIMUM_REACHED',
        status: 'EXECUTING',
        selectedAction: 'MONITOR',
        confidence: 'HIGH',
        urgency: 'LOW',
        observations: ['Soil moisture: 35% (Target reached)', 'Shared pump: Automatically stopped by smart safeguard'],
        context: ['Target: 35% root moisture', 'Nashik 3.5 acres'],
        candidateActions: ['MONITOR'],
        rejectedActions: [],
        constraints: [],
        expectedImpact: { waterSavedL: 12000, dieselAvoidedL: 45 },
        explanation: 'Target 35% moisture reached! Motor shut off automatically. FarmKind Smart Engine verifying sensor stabilization...',
        provenance: 'AI_DERIVED',
        humanFriendlyReason: 'Target 35% reached! Motor shut off automatically.',
        hindiReason: '35% नमी पूरी हो गई! मोटर अपने आप बंद हो गई है। FarmKind Smart Engine स्थिरीकरण की जांच कर रहा है...',
      };
    }

    if (pumpIsOn) {
      return {
        decisionId: 'demo-irr-executing',
        timestamp: new Date().toISOString(),
        farmId: 'farm-001',
        eventType: 'IRRIGATION_IN_PROGRESS',
        status: 'EXECUTING',
        selectedAction: 'IRRIGATE',
        confidence: 'HIGH',
        urgency: 'HIGH',
        observations: [`Current soil moisture: ${moisture}%`, 'Shared solar pump active (4,200 L/hr)'],
        context: ['Target: 35% root moisture', 'Nashik 3.5 acres'],
        candidateActions: ['IRRIGATE'],
        rejectedActions: [],
        constraints: [],
        expectedImpact: { waterSavedL: 12000 },
        explanation: `Shared solar drip irrigation in progress. Current moisture: ${moisture}%. Pumping until 35% target is reached.`,
        provenance: 'AI_DERIVED',
        humanFriendlyReason: `Solar drip irrigating root zone (${moisture}% → 35%)`,
        hindiReason: `सौर ड्रिप सिंचाई चालू है (नमी: ${moisture}%)। 35% पहुंचते ही मोटर अपने आप बंद हो जाएगी।`,
      };
    }

    // Weather: Rain incoming scenario
    if (demoScenario === 'RAIN_DELAY' || (weather.rainProbability.value ?? 0) > 70) {
      return {
        decisionId: 'demo-irr-wait',
        timestamp: new Date().toISOString(),
        farmId: 'farm-001',
        eventType: 'RAIN_INCOMING',
        status: 'RECOMMENDED',
        selectedAction: 'WAIT',
        confidence: 'HIGH',
        urgency: 'LOW',
        observations: ['Rain forecast: 78% probability in 3 hours', 'Expected rain: 22 mm'],
        context: ['Nashik 3.5 acres', 'Tomato crop'],
        candidateActions: ['WAIT', 'IRRIGATE'],
        rejectedActions: [{ action: 'IRRIGATE', reason: 'Natural rain expected soon; pumping would cause waterlogging' }],
        constraints: [],
        expectedImpact: { costDifference: deferredDieselCostInr, waterSavedL: deferredWaterL },
        explanation: 'Rain expected in 3 hours (78% chance). Holding irrigation to conserve shared water and prevent fuel waste.',
        provenance: 'AI_DERIVED',
        humanFriendlyReason: 'Holding pump to wait for incoming natural rain',
        hindiReason: `3 घंटे में बारिश आने वाली है, अभी मोटर न चलाएं — ₹${deferredDieselCostInr} का डीजल और ${deferredWaterL.toLocaleString('en-IN')} लीटर पानी बचेगा।`,
      };
    }

    // Default / Dry state
    return {
      decisionId: currentDecision?.decisionId ?? 'demo-irr-dry',
      timestamp: new Date().toISOString(),
      farmId: 'farm-001',
      eventType: 'SOIL_MOISTURE_LOW',
      status: 'RECOMMENDED',
      selectedAction: (moisture < 30 ? 'IRRIGATE' : currentDecision?.selectedAction ?? 'MONITOR'),
      confidence: 'HIGH',
      urgency: moisture < 30 ? 'HIGH' : 'LOW',
      observations: [`Soil moisture: ${moisture}%`],
      context: ['Nashik 3.5 acres'],
      candidateActions: ['IRRIGATE', 'WAIT'],
      rejectedActions: [],
      constraints: [],
      expectedImpact: { waterSavedL: deferredWaterL },
      explanation: moisture < 30
        ? `Soil moisture is critically low (${moisture}%). Sunlight is strong. Starting solar drip irrigation.`
        : currentDecision?.explanation ?? 'Soil moisture is adequate. Monitoring conditions.',
      provenance: 'AI_DERIVED',
      humanFriendlyReason: moisture < 30 ? 'Soil is dry, start drip irrigation' : 'Field is in good condition',
      hindiReason: moisture < 30
        ? `खेत में नमी बहुत कम (${moisture}%) है। अभी सौर ड्रिप चालू करें — 35% नमी होते ही मोटर अपने आप बंद हो जाएगी।`
        : currentDecision?.hindiReason ?? 'मिट्टी में पर्याप्त नमी है। केवल निगरानी रखी जा रही है।',
    };
  };

  const currentDecisionObj = getDynamicDecision();

  const currentLang = state.language ?? 'hi';
  const marathiReason =
    demoStep === 4 || (moisture >= 35 && !pumpIsOn && demoScenario === 'DRY_AUTO_IRRIGATE')
      ? 'सिंचन यशस्वीरीत्या पूर्ण झाले! मातीतील ओलावा ३५% झाला असून मोटर आपोआप बंद झाली आहे.'
      : demoStep === 3.5
      ? '३५% ओलावा पूर्ण झाला! मोटर आपोआप बंद झाली आहे.'
      : moisture < 30
      ? `शेतात ओलावा फार कमी (${moisture}%) आहे. सौर ठिबक लगेच चालू करा — ३५% ओलावा होताच मोटर आपोआप बंद होईल.`
      : 'मातीत पुरेसा ओलावा आहे. देखरेख सुरू आहे.';

  const displayAdvice =
    currentLang === 'mr'
      ? marathiReason
      : currentLang === 'en'
      ? (currentDecisionObj.humanFriendlyReason ?? currentDecisionObj.explanation)
      : (currentDecisionObj.hindiReason ?? currentDecisionObj.explanation);

  return (
    <div className="screen-scroll">
      {/* ── Screen Header ── */}
      <SectionHeader
        eyebrow="FarmKind Smart Engine · Dindori, Nashik"
        title="Command Center & Smart Irrigation"
        subtitle="Monitors root soil telemetry and weather in real time, recommends optimal pumping, and shuts off automatically at 35% target."
      />

      {/* ── CARD 1: LIVE FIELD & SOIL TELEMETRY ── */}
      <div id="soil-sensor-card" className="card card--glow-cyan mb-4 animate-in p-4" style={{ borderRadius: 'var(--radius-xl)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`status-dot ${pumpIsOn ? 'status-dot--live animate-pulse' : moisture < 30 ? 'status-dot--error' : 'status-dot--live'}`} />
            <span className="font-bold text-sm text-primary">Tomato Root Zone Telemetry (15 cm Probe)</span>
            <ProvenanceBadge source="REAL" label="Ground Sensor" />
          </div>
          <SensorStatusBadge status={sensorLive ? 'LIVE' : soil.sensorStatus} />
        </div>

        {/* Moisture Gauge Display */}
        <div id="moisture-gauge-card" className="p-4 rounded-xl mb-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-xs text-muted font-semibold uppercase tracking-wider block">Root Zone Moisture</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-5xl font-black font-mono transition-colors duration-500 ${moisture < 30 ? 'text-red' : moisture >= 35 ? 'text-green' : 'text-blue'}`}>
                  {moisture}%
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${moisture < 30 ? 'badge--critical' : moisture >= 35 ? 'badge--live' : 'badge--simulated'}`}>
                  {pumpIsOn ? '💧 IRRIGATING' : moisture < 30 ? '⚠️ CRITICAL DRY' : '✅ 35% HEALTHY TARGET'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted block">Optimal: <strong className="text-green">35%</strong></span>
              <span className="text-xs text-muted block">Critical: <strong className="text-red">30%</strong></span>
            </div>
          </div>

          <MoistureGauge value={moisture} target={35} critical={30} />
        </div>

        {/* Environmental & Hardware Strip: 2 essential rows, spacious and uncluttered */}
        <div className="grid-2 gap-3 pt-2 border-t border-subtle">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <span>☀️</span>
            <span>Solar Sunlight: <strong className="text-primary font-mono">{liveWeather?.estimatedSolarPumpKw ?? 4.25} kW</strong> (Pump Ready)</span>
          </div>
          <div className="flex items-center justify-between text-xs text-secondary">
            <div className="flex items-center gap-1.5">
              <span>🌧️</span>
              <span>Rain Chance: <strong className="text-primary font-mono">{simulatedRainProb}%</strong></span>
            </div>
            <span className={`font-bold font-mono ${pumpIsOn ? 'text-green animate-pulse' : 'text-muted'}`}>
              {pumpIsOn ? '● PUMP ON (4,200 L/hr)' : '○ PUMP OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD 2: SMART ENGINE CORE & SIGNAL FLOW PIPELINE ── */}
      <div id="ai-core-section" className="card card--glow-cyan mb-4 animate-in p-4" style={{ borderRadius: 'var(--radius-xl)' }}>
        <div className="flex justify-between items-center mb-1">
          <span className="card-title text-cyan text-sm font-bold">FarmKind Smart Engine Decision Core</span>
          <div className="flex items-center gap-2">
            <button className="btn btn--ghost btn--xs" onClick={() => triggerLiveSync()}>
              🔄 Sync
            </button>
            <button className="btn btn--secondary btn--xs" onClick={toggleLiveInspector}>
              📊 Telemetry ↗
            </button>
          </div>
        </div>

        <FarmKindCore intelligenceState={intelligenceState} />

        {/* Decision Flow Pipeline */}
        {analysisStep > 0 && (
          <div id="decision-flow-section" className="mt-3 pt-3 border-t border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted uppercase">Smart Engine Analysis Pipeline</span>
              <span className="text-xs font-mono text-cyan">{analysisStep === 4 ? '100% COMPLETE' : `${analysisStep * 25}%`}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {FLOW_STEPS.map((s) => (
                <FlowStep
                  key={s.step}
                  step={s.step}
                  title={s.title}
                  subtitle={s.subtitle}
                  active={analysisStep === s.step}
                  done={analysisStep > s.step || analysisStep === 4}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── PIPELINE IN PROGRESS NOTICE (Hidden once pipeline reaches 100%) ── */}
      {analysisStep < 4 && !pumpIsOn && demoStep < 3 && (
        <div className="card p-4 text-center mb-4 animate-pulse" style={{ background: 'rgba(34,211,238,0.06)', border: '1px dashed rgba(34,211,238,0.35)', borderRadius: 'var(--radius-xl)' }}>
          <div className="text-sm font-bold text-cyan flex items-center justify-center gap-2">
            <span className="animate-spin">⚙️</span>
            <span>FarmKind Smart Engine Pipeline Running (Step {analysisStep} of 4)...</span>
          </div>
          <p className="text-xs text-secondary mt-1">
            Synthesizing satellite rain radar, ground root moisture, and solar pump savings. Advice will unlock once pipeline reaches 100%.
          </p>
        </div>
      )}

      {/* ── CARD 3: PROACTIVE SMART ENGINE ADVICE (ONLY SHOWN AFTER PIPELINE COMPLETE!) ── */}
      {(analysisStep >= 4 || pumpIsOn || demoStep >= 3) && (
        <div
          id="smart-ai-recommendation-hero"
          className={`card mb-4 animate-in p-5 ${currentDecisionObj.selectedAction === 'MONITOR' ? 'card--glow-green card--success-glow' : currentDecisionObj.selectedAction === 'IRRIGATE' ? 'card--glow-blue' : 'card--glow-amber'}`}
        style={{
          borderRadius: 'var(--radius-xl)',
          border: currentDecisionObj.selectedAction === 'MONITOR' ? '2px solid rgba(34,197,94,0.7)' : '2px solid rgba(56,189,248,0.6)',
          background: currentDecisionObj.selectedAction === 'MONITOR'
            ? 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(2,6,23,0.96) 100%)'
            : 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(2,6,23,0.96) 100%)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {currentDecisionObj.selectedAction === 'MONITOR' ? '✅' : currentDecisionObj.selectedAction === 'IRRIGATE' ? '💡' : '🌧️'}
            </span>
            <div>
              <h2 className="card-title text-base font-bold" style={{ color: currentDecisionObj.selectedAction === 'MONITOR' ? 'var(--clr-farm-green)' : 'var(--clr-ai-cyan)' }}>
                {currentDecisionObj.selectedAction === 'MONITOR' ? 'Smart Engine Verification (Complete)' : 'FarmKind Smart Engine Farming Advice'}
              </h2>
              <span className="text-xs text-muted block mt-0.5">
                {currentDecisionObj.selectedAction === 'MONITOR' ? 'Root moisture target achieved' : 'Based on live root probe & weather forecast'}
              </span>
            </div>
          </div>
          <ConfidenceChip level="HIGH" />
        </div>

        {/* Clear Voice Recommendation in Selected Language */}
        <div
          className="p-4 rounded-xl my-3"
          style={{
            background: currentDecisionObj.selectedAction === 'MONITOR' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
            border: currentDecisionObj.selectedAction === 'MONITOR' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(245,158,11,0.3)',
          }}
        >
          <p
            className="text-lg font-bold leading-relaxed"
            style={{ color: currentDecisionObj.selectedAction === 'MONITOR' ? 'var(--clr-farm-green)' : 'var(--clr-solar-amber)' }}
          >
            "{displayAdvice}"
          </p>
          <p className="text-xs text-secondary mt-1.5 leading-normal">
            {currentDecisionObj.explanation}
          </p>
        </div>

        {/* Primary Action Button or Live Progress */}
        <div className="flex flex-col gap-2 mt-4">
          {/* State 1: Soil is dry, user can start pump */}
          {currentDecisionObj.selectedAction === 'IRRIGATE' && !pumpIsOn && (
            <button
              id="btn-start-irrigation"
              className="btn btn--primary btn--full font-bold py-3 text-base shadow-lg"
              onClick={handleApproveIrrigate}
            >
              💧 Accept &amp; Start Shared Solar Pump Now →
            </button>
          )}

          {/* State 2: Pump is currently running */}
          {pumpIsOn && (
            <div className="card p-3 text-center animate-pulse" style={{ background: 'rgba(56,189,248,0.12)', border: '1.5px solid rgba(56,189,248,0.4)' }}>
              <div className="text-sm font-bold text-cyan flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span>
                <span>Shared Solar Pump Irrigating: {moisture}% → 35% Target</span>
                <span className="drip-droplet">💧</span>
              </div>
              <p className="text-xs text-secondary mt-1">
                Motor delivers 70 L/min directly to roots · Automatically stops at 35% target.
              </p>
            </div>
          )}

          {/* State 2.5: Auto-shutoff triggered */}
          {demoStep === 3.5 && !pumpIsOn && (
            <div className="card p-3 text-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.4)' }}>
              <div className="text-sm font-bold text-amber">
                ⚡ 35% Target Reached! Motor Auto-Stopped
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Safe auto-shutoff activated · Verifying moisture stabilization...
              </p>
            </div>
          )}

          {/* State 3: Irrigation complete */}
          {currentDecisionObj.selectedAction === 'MONITOR' && demoStep >= 4 && (
            <div className="flex flex-col gap-2.5">
              <div id="action-verified-card" className="card p-3 text-center" style={{ background: 'rgba(34,197,94,0.14)', border: '1.5px solid rgba(34,197,94,0.4)' }}>
                <div className="text-sm font-bold text-green flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Target 35% Reached · Motor Stopped Automatically</span>
                </div>
                <p className="text-xs text-secondary mt-1">
                  Displaced {deferredDieselL} L Diesel · {deferredWaterL.toLocaleString('en-IN')} L Root Water Preserved · {formatINR(deferredDieselCostInr)} Fuel Expense Avoided
                </p>
              </div>

              <button
                id="btn-return-farm-state-from-4"
                className="btn btn--secondary btn--full font-bold py-2.5 text-xs flex items-center justify-center gap-2"
                onClick={() => navigateTo(1)}
              >
                <span>🏡</span>
                <span>View Live Transformation in Current Farm State →</span>
              </button>
            </div>
          )}

          {/* State 4: Rain delay */}
          {currentDecisionObj.selectedAction === 'WAIT' && (
            <div className="card p-3 text-center text-xs font-bold text-cyan" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)' }}>
              ⏸️ Irrigation Paused: Natural rain expected soon. Holding pump to save {formatINR(deferredDieselCostInr)} diesel fuel.
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-subtle">
            <ListenButton text={displayAdvice} />
            <button
              className="btn btn--ghost btn--xs text-muted"
              onClick={() => setShowTrace(v => !v)}
              aria-expanded={showTrace}
            >
              {showTrace
                ? (currentLang === 'mr' ? '▲ स्पष्टीकरण लपवा' : currentLang === 'en' ? '▲ Hide Explanation' : '▲ विवरण छुपाएं')
                : (currentLang === 'mr' ? '▼ इंजिनचा तर्क पहा' : currentLang === 'en' ? '▼ View Engine Logic' : '▼ इंजन का तर्क देखें')}
            </button>
          </div>
        </div>

        {showTrace && (
          <div id="farm-decision-trace" className="mt-3">
            <DecisionTrace decision={currentDecisionObj} />
          </div>
        )}
      </div>
      )}

      {/* ── CARD 4: COMPACT DEMO SIMULATOR FOR JUDGES ── */}
      <div className="card p-3 mb-4 animate-in" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted font-bold tracking-wider uppercase">🎮 Demo Simulator (Test FarmKind Smart Engine)</span>
          <span className="badge badge--simulated text-xs">For Judges</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            id="btn-demo-dry-soil"
            className={`btn btn--xs flex-1 ${demoScenario === 'DRY_AUTO_IRRIGATE' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={runDrySoilDemo}
          >
            ☀️ 1. Dry Soil (26%)
          </button>

          <button
            id="btn-demo-rain-delay"
            className={`btn btn--xs flex-1 ${demoScenario === 'RAIN_DELAY' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={runRainDelayDemo}
          >
            🌧️ 2. Rain Forecast (78%)
          </button>

          <button
            id="btn-demo-reset"
            className="btn btn--xs btn--ghost"
            onClick={resetDemoState}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Hidden button for backward test compatibility */}
      <button
        id="btn-analyze-farm"
        style={{ display: 'none' }}
        onClick={runDrySoilDemo}
      >
        Analyze Farm
      </button>
      <button
        id="btn-start-resource-saver"
        style={{ display: 'none' }}
        onClick={() => {
          startScenario('irrigation-rain-delay');
          runRainDelayDemo();
        }}
      >
        Run Resource Saver Scenario
      </button>

      <div className="text-xs text-muted text-center pb-4">
        💡 Smart Safeguard: The irrigation pump will never start without your direct confirmation, and automatically stops upon reaching healthy root moisture.
      </div>
    </div>
  );
}
