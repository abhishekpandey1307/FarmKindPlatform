// =============================================================================
// FARMKIND — CORE DOMAIN TYPES
// Central strongly-typed FarmState and related structures
// =============================================================================

export type SourceType =
  | 'REAL'
  | 'REFERENCE'
  | 'CALCULATED'
  | 'ASSUMED'
  | 'SIMULATED'
  | 'AI_DERIVED';

export type VerificationStatus =
  | 'VERIFIED'
  | 'ESTIMATED'
  | 'CONTACT_PROVIDER'
  | 'UNKNOWN';

export type DataFreshness =
  | 'FRESH'
  | 'AGING'
  | 'STALE'
  | 'EXPIRED'
  | 'UNKNOWN';

export interface DataPoint<T> {
  value: T | null;
  unit?: string;
  timestamp: string;
  sourceType: SourceType;
  confidence?: number;
  label?: string;
}

// ─── FARMER ──────────────────────────────────────────────────────────────────

export interface Farmer {
  farmerId: string;
  name: string;
  location: string;
  state: string;
  preferredLanguage: 'hi' | 'mr' | 'en' | 'hinglish';
  farmIds: string[];
  createdAt: string;
}

// ─── WATER STATE ─────────────────────────────────────────────────────────────

export interface WaterState {
  irrigationMethod: 'FLOOD' | 'DRIP' | 'SPRINKLER' | 'FURROW';
  irrigationFrequency: string;
  estimatedWaterPerEvent: DataPoint<number>;   // liters
  estimatedDailyWaterUse: DataPoint<number>;   // liters
  estimatedMonthlyWaterUse: DataPoint<number>; // liters
  lastIrrigation?: string;                     // ISO timestamp
  pumpStatus: 'OFF' | 'ON' | 'OFFLINE' | 'UNKNOWN';
  source: SourceType;
}

// ─── ENERGY STATE ────────────────────────────────────────────────────────────

export interface EnergyState {
  primarySource: 'DIESEL' | 'SOLAR' | 'GRID' | 'SHARED_SOLAR';
  secondarySource?: string;
  pumpType: 'DIESEL_PUMP' | 'ELECTRIC_PUMP' | 'SOLAR_PUMP';
  estimatedConsumption: DataPoint<number>;   // L/month diesel or kWh
  consumptionUnit: string;
  energyCost: DataPoint<number>;             // ₹/month
  source: SourceType;
}

// ─── SOIL STATE ──────────────────────────────────────────────────────────────

export interface SoilState {
  moisture: DataPoint<number>;         // %
  temperature: DataPoint<number>;      // °C
  sensorStatus: 'NOT_CONNECTED' | 'CONNECTING' | 'CALIBRATING' | 'LIVE' | 'STALE' | 'ERROR';
  lastUpdated?: string;
  source: SourceType;
}

// ─── WEATHER STATE ───────────────────────────────────────────────────────────

export interface WeatherState {
  temperature: DataPoint<number>;      // °C
  humidity: DataPoint<number>;         // %
  rainfall: DataPoint<number>;         // mm today
  rainProbability: DataPoint<number>;  // % 0-100
  expectedRainfall: DataPoint<number>; // mm expected
  heatRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  forecastConfidence: number;          // 0-1
  timestamp: string;
  source: SourceType;
  isStale: boolean;
}

// ─── CROP STATE ──────────────────────────────────────────────────────────────

export interface CropState {
  cropType: string;
  variety?: string;
  stage: 'SEEDLING' | 'VEGETATIVE' | 'FLOWERING' | 'MID_SEASON' | 'HARVEST' | 'POST_HARVEST';
  plantingDate?: string;
  expectedHarvestDate?: string;
  kc: DataPoint<number>;               // crop coefficient
  criticalMoistureThreshold: number;   // % below which irrigation needed
  optimalMoistureTarget: number;       // % target after irrigation
  source: SourceType;
}

// ─── PRODUCE BATCH ───────────────────────────────────────────────────────────

export interface ProduceBatch {
  batchId: string;
  cropType: string;
  quantityKg: number;
  harvestTimestamp: string;
  ageHours: DataPoint<number>;
  storageTemperature: DataPoint<number>;
  storageHumidity: DataPoint<number>;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'AT_RISK' | 'SPOILED';
  spoilageRiskPercent: DataPoint<number>;
  storageFacility?: string;
  source: SourceType;
}

// ─── MARKET STATE ────────────────────────────────────────────────────────────

export interface MarketOption {
  marketId: string;
  name: string;
  distanceKm: number;
  pricePerKg: DataPoint<number>;       // ₹/kg
  demand: 'LOW' | 'MEDIUM' | 'HIGH';
  transportCostPerKg: DataPoint<number>;
  availableTransport: boolean;
  estimatedTravelHours: number;
  isStale: boolean;
}

export interface MarketState {
  options: MarketOption[];
  lastUpdated: string;
  source: SourceType;
}

// ─── LOGISTICS STATE ─────────────────────────────────────────────────────────

export interface LogisticsState {
  transportAvailable: boolean;
  estimatedAvailabilityHours?: number;
  delayReason?: string;
  lastChecked: string;
  source: SourceType;
}

// ─── CONNECTED SYSTEMS ───────────────────────────────────────────────────────

export interface ConnectedSystems {
  solar: boolean;
  soilSensor: boolean;
  smartIrrigation: boolean;
  automation: boolean;
  voiceEnabled: boolean;
}

// ─── FARM ────────────────────────────────────────────────────────────────────

export interface Farm {
  farmId: string;
  farmerId: string;
  location: string;
  areaAcres: number;
  areaHectares: number;
  areaM2: number;
  crop: CropState;
  irrigation: WaterState;
  energy: EnergyState;
  soil: SoilState;
  weather: WeatherState;
  harvest: ProduceBatch[];
  market: MarketState;
  logistics: LogisticsState;
  connectedSystems: ConnectedSystems;
}

// ─── FARM STATE ──────────────────────────────────────────────────────────────

export interface FarmState {
  farmer: Farmer;
  farm: Farm;
  lastUpdated: string;
  simulationMode: boolean;
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

export type FarmEventType =
  | 'SENSOR_READING'
  | 'WEATHER_UPDATE'
  | 'RAIN_EVENT'
  | 'IRRIGATION_START'
  | 'IRRIGATION_STOP'
  | 'MARKET_UPDATE'
  | 'TRANSPORT_UPDATE'
  | 'HARVEST_CREATED'
  | 'TEMPERATURE_CHANGE'
  | 'HUMIDITY_CHANGE'
  | 'CLIMATE_ALERT'
  | 'USER_ACTION'
  | 'SYSTEM_ACTION'
  | 'PUMP_STATUS_CHANGE'
  | 'SENSOR_STATUS_CHANGE'
  | 'DECISION_MADE'
  | 'ACTION_VERIFIED'
  | 'IMPACT_MEASURED';

export interface FarmEvent {
  eventId: string;
  timestamp: string;
  type: FarmEventType;
  payload: unknown;
  sourceType: SourceType;
  description?: string;
}

// ─── DECISIONS ───────────────────────────────────────────────────────────────

export type ActionType =
  | 'IRRIGATE'
  | 'WAIT'
  | 'CHECK_SENSOR'
  | 'MONITOR'
  | 'SELL_NOW'
  | 'MOVE_TO_MARKET'
  | 'STORE'
  | 'PREPARE_FOR_HEAT'
  | 'EMERGENCY_HARVEST'
  | 'PUMP_OFF'
  | 'PUMP_ON';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DecisionStatus = 'DETECTED' | 'ANALYZING' | 'RECOMMENDED' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'VERIFIED' | 'MEASURED';

export interface DecisionResult {
  decisionId: string;
  timestamp: string;
  farmId: string;
  eventType: string;
  status: DecisionStatus;
  selectedAction: ActionType;
  confidence: ConfidenceLevel;
  urgency: UrgencyLevel;
  observations: string[];
  context: string[];
  candidateActions: ActionType[];
  rejectedActions: { action: ActionType; reason: string }[];
  constraints: string[];
  expectedImpact: Record<string, number>;
  explanation: string;
  nextCheck?: string;
  provenance: SourceType;
  humanFriendlyReason: string;
  hindiReason?: string;
}

// ─── IMPACT ──────────────────────────────────────────────────────────────────

export interface ImpactMetrics {
  waterBaseline: DataPoint<number>;     // L/month
  waterScenario: DataPoint<number>;     // L/month
  waterSaved: DataPoint<number>;        // L/month
  waterSavedPercent: DataPoint<number>; // %

  dieselBaseline: DataPoint<number>;    // L/month
  dieselAvoided: DataPoint<number>;     // L/month

  costBaseline: DataPoint<number>;      // ₹/month
  costScenario: DataPoint<number>;      // ₹/month
  costDifference: DataPoint<number>;    // ₹/month

  harvestValueProtected: DataPoint<number>; // ₹
  climateRisksDetected: number;
  decisionsGenerated: number;
  actionsRecommended: number;
  actionsApproved: number;
  actionsAutomated: number;
  actionsVerified: number;
}

// ─── VOICE ───────────────────────────────────────────────────────────────────

export type VoicePermissionMode = 'RECOMMEND_ONLY' | 'CONFIRM_BEFORE_ACTION' | 'AUTO_ACTION_ENABLED';

export type IntentType =
  | 'IRRIGATION_DECISION'
  | 'FARM_STATUS'
  | 'MARKET_QUERY'
  | 'HARVEST_STATUS'
  | 'WEATHER_QUERY'
  | 'IMPACT_SUMMARY'
  | 'UNKNOWN';

export interface VoiceIntent {
  intent: IntentType;
  language: 'hi' | 'mr' | 'en' | 'hinglish';
  confidence: number;
  rawText: string;
  normalizedText: string;
}

export interface VoiceResponse {
  text: string;
  hindiText?: string;
  marathiText?: string;
  actionSuggested?: ActionType;
  requiresConfirmation: boolean;
}

// ─── INTELLIGENCE STATE ───────────────────────────────────────────────────────

export type IntelligenceState =
  | 'IDLE'
  | 'SIGNAL'
  | 'ANALYZING'
  | 'DECISION'
  | 'EXECUTING'
  | 'VERIFIED'
  | 'IMPACT';

// ─── SIMULATION ──────────────────────────────────────────────────────────────

export type ScenarioId =
  | 'irrigation-rain-delay'
  | 'harvest-market-shift'
  | 'heat-risk'
  | 'cross-shield-day';

export interface ScenarioEvent {
  id: string;
  delayMs: number;
  type: FarmEventType;
  payload: unknown;
  description: string;
  sourceType: SourceType;
}

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  initialState: Partial<FarmState>;
  events: ScenarioEvent[];
  expectedDecisions?: ActionType[];
}

export type SimulationSpeed = 1 | 10 | 60;

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentScenario: ScenarioId | null;
  speed: SimulationSpeed;
  elapsedMs: number;
  eventLog: FarmEvent[];
  decisionLog: DecisionResult[];
}

// ─── SHIELD ──────────────────────────────────────────────────────────────────

export type ShieldType = 'RESOURCE_SAVER' | 'HARVEST_PROTECTOR' | 'CLIMATE_DEFENDER';

export interface ShieldAlert {
  shieldType: ShieldType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  action?: ActionType;
  timestamp: string;
}
