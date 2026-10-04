// =============================================================================
// FARMKIND — SECURE SERVER-SIDE DATABASE (DATABASE GATEWAY)
// Server-only persistent database. Stores farmer records, telemetry logs,
// solar bookings, and AI audit trail securely on the server.
// ZERO DIRECT DATABASE ACCESS IS PERMITTED FROM THE BROWSER.
// =============================================================================

import fs from 'fs';
import path from 'path';

export interface FarmerProfileRecord {
  farmerId: string;
  name: string;
  location: string;
  state: string;
  acres: number;
  preferredLanguage: string;
  cropType: string;
  variety: string;
  cropStage: string;
  updatedAt: string;
}

export interface SoilTelemetryLog {
  id: string;
  timestamp: string;
  moisturePercent: number;
  temperatureC: number;
  sensorStatus: string;
  source: string;
}

export interface SolarBookingRecord {
  orderId: string;
  farmerId: string;
  date: string;
  slotTime: string;
  dieselSavedLiters: number;
  financialSavedInr: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface AiDecisionAuditRecord {
  decisionId: string;
  timestamp: string;
  cropType: string;
  selectedAction: string;
  confidence: string;
  explanation: string;
  hindiReason?: string;
  savingsInr?: number;
  verified: boolean;
}

export interface DatabaseSchema {
  version: number;
  farmer: FarmerProfileRecord;
  soilLogs: SoilTelemetryLog[];
  solarBookings: SolarBookingRecord[];
  decisionAuditLogs: AiDecisionAuditRecord[];
  lastSavedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'farmkind.db.json');

const INITIAL_DB: DatabaseSchema = {
  version: 1,
  farmer: {
    farmerId: 'farmer-ramesh-patil-01',
    name: 'Ramesh Patil',
    location: 'Nashik',
    state: 'Maharashtra',
    acres: 3.5,
    preferredLanguage: 'hi',
    cropType: 'Tomato',
    variety: 'Himsona Hybrid',
    cropStage: 'FLOWERING',
    updatedAt: new Date().toISOString(),
  },
  soilLogs: [
    {
      id: 'soil-log-01',
      timestamp: new Date().toISOString(),
      moisturePercent: 18,
      temperatureC: 28.5,
      sensorStatus: 'LIVE',
      source: 'IN_SITU_PROBE',
    },
  ],
  solarBookings: [
    {
      orderId: 'SOLAR-BK-8821',
      farmerId: 'farmer-ramesh-patil-01',
      date: new Date().toISOString().split('T')[0],
      slotTime: '11:30 AM - 1:00 PM',
      dieselSavedLiters: 4.8,
      financialSavedInr: 380,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    },
  ],
  decisionAuditLogs: [
    {
      decisionId: 'DEC-01-INIT',
      timestamp: new Date().toISOString(),
      cropType: 'Tomato',
      selectedAction: 'IRRIGATE',
      confidence: 'HIGH',
      explanation: 'Soil moisture is 18%, below 25% threshold. Recommend 45 min drip irrigation via shared solar slot at 11:30 AM.',
      hindiReason: 'मिट्टी में 18% नमी बची है। सुबह 11:30 बजे मुफ्त सोलर स्लॉट से ड्रिप चलाएं और ₹380 डीजल बचाएं।',
      savingsInr: 380,
      verified: true,
    },
  ],
  lastSavedAt: new Date().toISOString(),
};

/**
 * Initializes server database file atomically if not present.
 */
export function initializeDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }

    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseSchema;
    return parsed;
  } catch (err) {
    console.warn('[Database] Initializing fallback in-memory DB:', err);
    return INITIAL_DB;
  }
}

/**
 * Atomically writes database updates to disk.
 */
export function saveDatabase(data: DatabaseSchema): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastSavedAt = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('[Database] Failed to write database file:', err);
    return false;
  }
}

// In-memory cache synced with disk
let dbMemory: DatabaseSchema = initializeDatabase();

/**
 * Reads the latest database state securely.
 */
export function getDatabaseState(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbMemory = JSON.parse(content) as DatabaseSchema;
    }
  } catch (err) {
    console.warn('[Database] Error reading from disk, using memory cache:', err);
  }
  return dbMemory;
}

/**
 * Updates farmer profile securely.
 */
export function updateFarmerProfile(updates: Partial<FarmerProfileRecord>): FarmerProfileRecord {
  const db = getDatabaseState();
  db.farmer = {
    ...db.farmer,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(db);
  return db.farmer;
}

/**
 * Adds a new verified soil telemetry log to historical records.
 */
export function recordSoilLog(moisture: number, temperature: number, source: string = 'IN_SITU_PROBE'): SoilTelemetryLog {
  const db = getDatabaseState();
  const newLog: SoilTelemetryLog = {
    id: `soil-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    moisturePercent: moisture,
    temperatureC: temperature,
    sensorStatus: 'LIVE',
    source,
  };
  db.soilLogs.unshift(newLog);
  // Keep last 100 records
  if (db.soilLogs.length > 100) db.soilLogs = db.soilLogs.slice(0, 100);
  saveDatabase(db);
  return newLog;
}

/**
 * Adds a new solar booking record.
 */
export function addSolarBooking(booking: Omit<SolarBookingRecord, 'orderId' | 'createdAt'>): SolarBookingRecord {
  const db = getDatabaseState();
  const newBooking: SolarBookingRecord = {
    orderId: `SOLAR-BK-${Date.now().toString().slice(-4)}`,
    ...booking,
    createdAt: new Date().toISOString(),
  };
  db.solarBookings.unshift(newBooking);
  saveDatabase(db);
  return newBooking;
}

/**
 * Logs an autonomous AI decision audit record.
 */
export function auditAiDecision(decision: Omit<AiDecisionAuditRecord, 'decisionId' | 'timestamp'>): AiDecisionAuditRecord {
  const db = getDatabaseState();
  const record: AiDecisionAuditRecord = {
    decisionId: `DEC-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...decision,
  };
  db.decisionAuditLogs.unshift(record);
  if (db.decisionAuditLogs.length > 100) db.decisionAuditLogs = db.decisionAuditLogs.slice(0, 100);
  saveDatabase(db);
  return record;
}
