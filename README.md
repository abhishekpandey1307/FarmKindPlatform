# 🌾 FarmKind Platform

### **Helping Every Small Farm Do More With Less.**
**(Less water · Less energy · Less money · Less waste → More productivity · More resilience)**

---

## 🌟 Overview

**FarmKind** is an intelligent, affordable, and accessible agri-tech platform designed for small and marginal Indian farmers. It connects the entire farming journey—from understanding baseline farm practices and uncovering high diesel/water waste, to booking community solar equipment, using the **FarmKind Smart Engine** for autonomous irrigation control, shielding crops from post-harvest rot, and celebrating verified environmental and household cash savings.

FarmKind is built mobile-first for smallholder farmers in rural regions (tested from 320px budget phones to 4K widescreen displays) and supports English, हिन्दी (Hindi), and मराठी (Marathi) with vernacular voice speech.

---

## 🚀 Key Modules & Architecture

1. **📖 Screen 0: How FarmKind Works**
   - Simple 7-step visual roadmap explaining the platform workflow in plain farmer language.
   - Interactive FAQ accordion addressing solar pumps, subsidies, and crop shields.
2. **🏡 Screen 1: Current Farm State & Baseline Diagnostic**
   - Diagnostic of traditional flood irrigation and diesel engine waste.
   - 5 high-impact upgrade recommendations with direct cost and water benefit metrics.
3. **⚡ Screen 2: Command Center & Smart Irrigation Engine**
   - Live telemetry integration with ground soil moisture probes and satellite weather.
   - Autonomous closed-loop drip irrigation with auto-shutoff at the optimal 35% root moisture target.
   - Smart delay safeguards for impending rainfall to avoid wasted pumping.
4. **🛒 Screen 3: Shared Resources & Equipment Marketplace**
   - Pay-per-use community solar pumps and solar cold storage (zero capital debt).
   - PM-KUSUM 60% capital grant eligibility calculator (Central 30% + Maharashtra State 30%).
5. **🎙️ Screen 5: AI Agri-Mitra 24x7 Voice & Text Assistant**
   - Dual-engine intelligence: Server-side **Google Gemini 2.0 Flash** reasoning with client-side zero-latency offline fallback.
   - Native Indian text-to-speech voice synthesis in Hindi, Marathi, Kannada, and Telugu.
6. **🛡️ Screen 6: Post-Harvest Shield & Preservation Engine**
   - Q10 biological respiration modeling for perishable tomatoes and onions.
   - Real-time GPS highway waypoint tracking and dynamic diversion to nearby solar cold hubs before spoilage.
7. **🇮🇳 Screen 7: Impact, Earth Regeneration & Kisan Gaurav Certificate**
   - Official citation honoring farmers for groundwater preservation and carbon reduction.
   - 1-tap WhatsApp pride card sharing and printable certificate.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Responsive CSS Custom Properties (zero heavy CSS dependencies).
- **Backend & API Gateway**: Node.js HTTP server (`server/index.ts`, `server/mitraBackend.ts`, `server/db.ts`) with zero-leak Gemini API proxying, telemetry logging, and JSON persistence.
- **Testing**: Vitest (11 test suites, 130 passing automated tests).

---

## 🌐 Cloud Deployment Guide

FarmKind is configured for **split cloud deployment**:
- **Frontend** hosted on **Vercel** (Global CDN for blazing fast single-page app delivery).
- **Backend** hosted on **Render** (Secure Node.js service protecting secret keys and running SQLite/JSON DB).

```
┌─────────────────────────────────┐           ┌──────────────────────────────────┐
│   Vercel (Frontend SPA)        │           │   Render (Backend & Gateway)     │
│   https://farmkind.vercel.app   │ ────────> │   https://farmkind.onrender.com  │
│   (Vite + React 19 + PWA UI)    │  REST/CORS│   (Gemini 2.0 Flash + Node.js)   │
└─────────────────────────────────┘           └──────────────────────────────────┘
```

---

### Step 1: Upload Project to GitHub

1. Ensure Git is initialized in the project root:
   ```bash
   git init -b main
   git add .
   git commit -m "feat: complete FarmKind platform"
   ```
2. Create and push to a new GitHub repository using the GitHub CLI:
   ```bash
   gh repo create FarmKindPlatform --public --source=. --remote=origin --push
   ```
   *(Or create a new repository manually on [github.com/new](https://github.com/new) and run `git remote add origin <URL>` followed by `git push -u origin main`)*.

---

### Step 2: Deploy Backend to Render

1. Sign in to [Render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`FarmKindPlatform`).
4. Configure the Web Service settings:
   - **Name**: `farmkind-backend`
   - **Environment**: `Node`
   - **Region**: Closest to your users (e.g. `Singapore` or `Oregon`)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key from Google AI Studio)*
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**.
7. Once deployed, copy your Render service URL (e.g. `https://farmkind-backend.onrender.com`).

---

### Step 3: Deploy Frontend to Vercel

1. Sign in to [Vercel.com](https://vercel.com).
2. Click **Add New…** → **Project**.
3. Import your GitHub repository (`FarmKindPlatform`).
4. Vercel will automatically detect `Vite` as the framework.
   - **Build Command**: `npm run build` (or `tsc -b && vite build`)
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_BACKEND_URL`: Paste your Render backend URL (e.g. `https://farmkind-backend.onrender.com`).
6. Click **Deploy**.
7. Your app is now live with full SPA routing (`vercel.json` ensures zero 404s on page refresh)!

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your optional `GEMINI_API_KEY` in `.env` to enable live Gemini 2.0 Flash reasoning in the voice assistant.

### 3. Start Frontend Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Start Local Backend Server (Optional)
```bash
npm run server
```
Runs the backend API on [http://localhost:3001](http://localhost:3001).

### 5. Run Automated Tests
```bash
npm test
```
All 130 unit and integration tests run via Vitest.

---

## 🔒 Security & Data Privacy
- **API Key Protection**: External Gemini API keys remain strictly on the backend and are never bundled into client JavaScript.
- **Offline Resilience**: The platform functions seamlessly offline or without backend access using built-in deterministic agro-engineering models.
