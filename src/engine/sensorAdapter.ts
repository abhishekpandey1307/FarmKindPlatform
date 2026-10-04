// =============================================================================
// FARMKIND — SENSOR ADAPTER ARCHITECTURE
// Clean abstraction layer decouples sensor input from Decision Engine and UI.
// Supports both SimulatedSensorAdapter and RealSensorAdapter.
// Contract: SensorAdapter → SensorEvent → FarmState
// =============================================================================

import type { FarmEvent, SourceType } from '../domain/types';

export interface SoilSensorReading {
  moisturePercent: number;
  temperatureC: number;
  timestamp: string;
  sourceType: SourceType;
  batteryPercent?: number;
  signalRssi?: number;
  deviceUuid: string;
}

export type SensorConnectionState =
  | 'NOT_CONNECTED'
  | 'CONNECTING'
  | 'CALIBRATING'
  | 'READING'
  | 'LIVE'
  | 'STALE'
  | 'ERROR';

export interface SensorAdapter {
  readonly adapterType: 'SIMULATED' | 'REAL_HARDWARE';
  getConnectionState(): SensorConnectionState;
  connect(onEvent: (event: FarmEvent) => void): () => void;
  disconnect(): void;
  readSample(): Promise<SoilSensorReading>;
}

// ─── SIMULATED SENSOR ADAPTER ────────────────────────────────────────────────

export class SimulatedSensorAdapter implements SensorAdapter {
  readonly adapterType = 'SIMULATED' as const;
  private state: SensorConnectionState = 'NOT_CONNECTED';
  private timerIds: ReturnType<typeof setTimeout>[] = [];

  getConnectionState(): SensorConnectionState {
    return this.state;
  }

  connect(onEvent: (event: FarmEvent) => void): () => void {
    this.disconnect();
    this.state = 'CONNECTING';

    const steps: { status: SensorConnectionState; delay: number; desc: string }[] = [
      { status: 'CONNECTING', delay: 1000, desc: 'Simulated BLE/Zigbee probe handshake' },
      { status: 'CALIBRATING', delay: 2500, desc: 'Calibrating capacitive frequency' },
      { status: 'LIVE', delay: 4000, desc: 'Virtual sensor online and broadcasting' },
    ];

    steps.forEach(({ status, delay, desc }) => {
      const id = setTimeout(() => {
        this.state = status;
        const statusEvent: FarmEvent = {
          eventId: `evt-sensor-${Date.now()}-${status}`,
          timestamp: new Date().toISOString(),
          type: 'SENSOR_STATUS_CHANGE',
          payload: { status },
          sourceType: 'SIMULATED',
          description: desc,
        };
        onEvent(statusEvent);

        if (status === 'LIVE') {
          // Dispatch initial baseline sample
          const readEvent: FarmEvent = {
            eventId: `evt-read-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'SENSOR_READING',
            payload: { moisture: 27, temperature: 28 },
            sourceType: 'SIMULATED',
            description: 'Simulated initial soil moisture reading',
          };
          onEvent(readEvent);
        }
      }, delay);
      this.timerIds.push(id);
    });

    return () => this.disconnect();
  }

  disconnect(): void {
    this.timerIds.forEach(clearTimeout);
    this.timerIds = [];
    this.state = 'NOT_CONNECTED';
  }

  async readSample(): Promise<SoilSensorReading> {
    return {
      moisturePercent: 27,
      temperatureC: 28,
      timestamp: new Date().toISOString(),
      sourceType: 'SIMULATED',
      deviceUuid: 'SIM-PROBE-001',
    };
  }
}

// ─── REAL HARDWARE SENSOR ADAPTER ────────────────────────────────────────────

export class RealHardwareSensorAdapter implements SensorAdapter {
  readonly adapterType = 'REAL_HARDWARE' as const;
  private state: SensorConnectionState = 'NOT_CONNECTED';
  private endpointUrl: string;
  private pollTimerId: ReturnType<typeof setInterval> | null = null;
  private lastReadingAt: number | null = null;
  private readonly STALE_THRESHOLD_MS = 90_000; // 90s without data = STALE

  constructor(endpointUrl: string = 'http://192.168.4.1/sensor/telemetry') {
    this.endpointUrl = endpointUrl;
  }

  getConnectionState(): SensorConnectionState {
    // Auto-detect stale readings: sensor may be connected but not sending data
    if (this.state === 'LIVE' && this.lastReadingAt) {
      if (Date.now() - this.lastReadingAt > this.STALE_THRESHOLD_MS) {
        this.state = 'STALE';
      }
    }
    return this.state;
  }

  connect(onEvent: (event: FarmEvent) => void): () => void {
    this.state = 'CONNECTING';

    onEvent({
      eventId: `evt-real-conn-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'SENSOR_STATUS_CHANGE',
      payload: { status: 'CONNECTING' },
      sourceType: 'REAL',
      description: `Attempting physical connection to IoT probe at ${this.endpointUrl}`,
    });

    // Initial read + then start periodic polling every 30s
    const doRead = () => {
      this.readSample()
        .then(reading => {
          this.state = 'LIVE';
          this.lastReadingAt = Date.now();
          onEvent({
            eventId: `evt-real-live-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'SENSOR_STATUS_CHANGE',
            payload: { status: 'LIVE' },
            sourceType: 'REAL',
            description: `Physical probe live: ${reading.deviceUuid}${reading.batteryPercent !== undefined ? ` | Battery: ${reading.batteryPercent}%` : ''}`,
          });
          onEvent({
            eventId: `evt-real-read-${Date.now()}`,
            timestamp: reading.timestamp,
            type: 'SENSOR_READING',
            payload: {
              moisture: reading.moisturePercent,
              temperature: reading.temperatureC,
              battery: reading.batteryPercent,
              rssi: reading.signalRssi,
            },
            sourceType: 'REAL',
            description: 'Physical in-situ sensor measurement',
          });
        })
        .catch(err => {
          const errMsg = err instanceof Error ? err.message : String(err);
          if (this.state !== 'ERROR') {
            this.state = 'ERROR';
            onEvent({
              eventId: `evt-real-err-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: 'SENSOR_STATUS_CHANGE',
              payload: { status: 'ERROR' },
              sourceType: 'REAL',
              description: `Sensor error: ${errMsg}`,
            });
          }
        });
    };

    doRead(); // immediate first read
    this.pollTimerId = setInterval(doRead, 30_000); // re-read every 30 seconds

    return () => this.disconnect();
  }

  disconnect(): void {
    if (this.pollTimerId) {
      clearInterval(this.pollTimerId);
      this.pollTimerId = null;
    }
    this.state = 'NOT_CONNECTED';
    this.lastReadingAt = null;
  }

  async readSample(): Promise<SoilSensorReading> {
    const res = await fetch(this.endpointUrl, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`Sensor HTTP ${res.status}`);
    const data = await res.json();

    // ─── SENSOR DATA VALIDATION ───────────────────────────────────────────
    // Real sensors can return null, NaN, string "N/A", or out-of-range fault codes.
    // All values MUST be validated before they enter the decision engine.

    const rawMoisture = Number(data.moisture);
    const rawTemp = Number(data.temperature);

    if (!isFinite(rawMoisture) || isNaN(rawMoisture)) {
      throw new Error(`Invalid moisture reading from sensor: "${data.moisture}" (device: ${data.uuid})`);
    }
    if (!isFinite(rawTemp) || isNaN(rawTemp)) {
      throw new Error(`Invalid temperature reading from sensor: "${data.temperature}" (device: ${data.uuid})`);
    }
    // Range validation — these physically cannot be real readings
    if (rawMoisture < 0 || rawMoisture > 100) {
      throw new Error(`Moisture ${rawMoisture}% is out of valid range [0-100]. Check capacitive probe wiring.`);
    }
    if (rawTemp < -10 || rawTemp > 60) {
      throw new Error(`Temperature ${rawTemp}°C is out of valid range [-10, 60]. Check thermistor connection.`);
    }

    const batteryPercent = data.battery !== undefined ? Number(data.battery) : undefined;

    // Battery < 15% degrades capacitive moisture sensor accuracy — flag as STALE
    if (batteryPercent !== undefined && isFinite(batteryPercent) && batteryPercent < 15) {
      this.state = 'STALE';
    }

    return {
      moisturePercent: rawMoisture,
      temperatureC: rawTemp,
      timestamp: new Date().toISOString(),
      sourceType: 'REAL',
      batteryPercent: (batteryPercent !== undefined && isFinite(batteryPercent)) ? batteryPercent : undefined,
      signalRssi: data.rssi !== undefined ? Number(data.rssi) : undefined,
      deviceUuid: data.uuid || 'HARDWARE-PROBE-RS485',
    };
  }
}

// ─── FACTORY ─────────────────────────────────────────────────────────────────

export function createSensorAdapter(mode: 'SIMULATED' | 'REAL_HARDWARE' = 'SIMULATED'): SensorAdapter {
  if (mode === 'REAL_HARDWARE') {
    return new RealHardwareSensorAdapter();
  }
  return new SimulatedSensorAdapter();
}
