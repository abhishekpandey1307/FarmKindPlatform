// =============================================================================
// FARMKIND — SECURE SERVER-SIDE BACKEND & API GATEWAY
// Protects secret API keys (Gemini, DB credentials) from client-side exposure.
// Houses server-side database (server/db.ts) and proxies external APIs.
// ZERO DIRECT DATABASE OR EXTERNAL CREDENTIAL ACCESS PERMITTED FROM FRONTEND.
// =============================================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import {
  getDatabaseState,
  updateFarmerProfile,
  addSolarBooking,
  recordSoilLog,
  auditAiDecision,
} from './db.ts';

/**
 * Loads environment variables from .env file into process.env if not already loaded.
 */
export function loadEnvFile(envPath?: string): void {
  const targetPath = envPath || path.resolve(process.cwd(), '.env');
  if (fs.existsSync(targetPath)) {
    try {
      const content = fs.readFileSync(targetPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key] && val) {
            process.env[key] = val;
          }
        }
      }
    } catch (err) {
      console.warn('[Backend] Could not load .env file:', err);
    }
  }
}

// Auto-load .env
loadEnvFile();

// Server-side Weather Cache (15-min TTL)
interface CachedWeather {
  data: unknown;
  cachedAt: number;
}
let weatherCache: CachedWeather | null = null;
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

export interface MitraRequestBody {
  queryText: string;
  systemPrompt: string;
  language?: string;
}

/**
 * Executes server-side call to Google Gemini 2.0 Flash using process.env.GEMINI_API_KEY.
 * The secret key NEVER leaves the server and is NEVER sent to the client browser.
 */
export async function processMitraServerQuery(
  body: MitraRequestBody,
  options?: { overrideApiKey?: string; skipEnvReload?: boolean }
): Promise<{
  text?: string;
  source: 'GEMINI_LIVE' | 'LOCAL_FALLBACK';
  latencyMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  if (!options?.skipEnvReload && process.env.NODE_ENV !== 'test') {
    loadEnvFile(); // Ensure freshest env
  }
  const apiKey = (options?.overrideApiKey !== undefined ? options.overrideApiKey : process.env.GEMINI_API_KEY)?.trim() || '';

  if (!apiKey) {
    return {
      source: 'LOCAL_FALLBACK',
      latencyMs: Date.now() - startTime,
      error: 'GEMINI_API_KEY not configured on server',
    };
  }

  // Model candidates in order of speed and stability
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];
  let lastError: string | null = null;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: body.queryText }],
            },
          ],
          systemInstruction: {
            parts: [{ text: body.systemPrompt }],
          },
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 1000,
            topP: 0.9,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = `Gemini model ${model} error ${response.status}: ${response.statusText}`;
        continue; // Try next candidate model
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const candidate = data.candidates?.[0];
      const rawText = candidate?.content?.parts?.[0]?.text;

      if (!rawText) {
        lastError = `Empty response from Gemini model ${model}`;
        continue;
      }

      // Strip markdown formatting for voice cleanliness
      const cleanText = rawText
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/^\s*[-*•]\s+/gm, '')
        .replace(/\n+/g, ' ')
        .trim();

      return {
        text: cleanText,
        source: 'GEMINI_LIVE',
        latencyMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      // Continue to next model candidate
    }
  }

  console.warn('[Backend] Gemini reasoning fallback triggered:', lastError);
  return {
    source: 'LOCAL_FALLBACK',
    latencyMs: Date.now() - startTime,
    error: lastError || 'All Gemini models unavailable',
  };
}

/**
 * Server-side proxy for weather API with 15-minute caching.
 * Protects client IP and prevents rate-limit abuse.
 */
export async function fetchServerWeather(lat: number = 19.9975, lon: number = 73.7898): Promise<unknown> {
  const now = Date.now();
  if (weatherCache && now - weatherCache.cachedAt < WEATHER_CACHE_TTL_MS) {
    return weatherCache.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability,shortwave_radiation_instant,soil_temperature_0cm,soil_moisture_0_to_1cm&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=1`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`Open-Meteo HTTP ${res.status}`);
  }

  const json = await res.json();
  weatherCache = {
    data: json,
    cachedAt: now,
  };
  return json;
}

/**
 * Handles incoming Node HTTP requests for all /api/* gateway routes.
 */
export async function handleBackendApiRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<boolean> {
  const url = req.url || '';
  const parsedUrl = url.split('?')[0];

  if (!parsedUrl.startsWith('/api/')) {
    return false;
  }

  // Handle CORS for all API routes (essential when frontend is on Vercel and backend is on Render)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Idempotency-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  // 1. Health Check Endpoint
  if (parsedUrl === '/api/health' && req.method === 'GET') {
    loadEnvFile();
    const db = getDatabaseState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'FarmKind Secure Backend & DB Gateway',
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
        databaseReady: Boolean(db && db.version),
        timestamp: new Date().toISOString(),
      })
    );
    return true;
  }

  // 2. Voice AI Query Endpoint (Gemini 2.0 Flash)
  if (parsedUrl === '/api/mitra-voice' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', (chunk: Buffer | string) => {
      bodyData += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(bodyData) as MitraRequestBody;
        if (!parsed.queryText || !parsed.systemPrompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing queryText or systemPrompt' }));
          return;
        }

        const result = await processMitraServerQuery(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err: unknown) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Invalid request' }));
      }
    });

    return true;
  }

  // 3. Database: Read Farm State (Farmer profile, soil logs, bookings)
  if (parsedUrl === '/api/farm-state' && req.method === 'GET') {
    try {
      const db = getDatabaseState();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read database state' }));
    }
    return true;
  }

  // 4. Database: Update Farmer Profile
  if (parsedUrl === '/api/farm-state' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', (chunk: Buffer | string) => {
      bodyData += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(bodyData);
        const updated = updateFarmerProfile(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', farmer: updated }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid update body' }));
      }
    });
    return true;
  }

  // 5. Database: Get All Bookings
  if (parsedUrl === '/api/bookings' && req.method === 'GET') {
    const db = getDatabaseState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.solarBookings));
    return true;
  }

  // 6. Database: Create Solar Booking
  if (parsedUrl === '/api/bookings' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', (chunk: Buffer | string) => {
      bodyData += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(bodyData);
        if (!parsed.orderId && req.headers['x-idempotency-key']) {
          parsed.orderId = req.headers['x-idempotency-key'] as string;
        }
        const created = addSolarBooking(parsed);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', booking: created }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid booking data' }));
      }
    });
    return true;
  }

  // 7. Database: Record Soil Telemetry Log
  if (parsedUrl === '/api/soil-log' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', (chunk: Buffer | string) => {
      bodyData += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(bodyData);
        const logId = (req.headers['x-idempotency-key'] as string) || parsed.id || undefined;
        const log = recordSoilLog(parsed.moisture, parsed.temperature, parsed.source, logId);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', log }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid soil telemetry data' }));
      }
    });
    return true;
  }

  // 8. Database: Log AI Decision Audit
  if (parsedUrl === '/api/audit-decision' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', (chunk: Buffer | string) => {
      bodyData += chunk.toString();
    });
    req.on('end', () => {
      try {
        const decisionData = JSON.parse(bodyData);
        if (!decisionData.decisionId && req.headers['x-idempotency-key']) {
          decisionData.decisionId = req.headers['x-idempotency-key'] as string;
        }
        const log = auditAiDecision(decisionData);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', audit: log }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid decision audit data' }));
      }
    });
    return true;
  }

  // 9. Weather API Proxy with Server-Side Caching
  if (parsedUrl === '/api/weather' && req.method === 'GET') {
    try {
      const data = await fetchServerWeather();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err: unknown) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Weather provider unavailable', message: err instanceof Error ? err.message : String(err) }));
    }
    return true;
  }

  return false;
}
