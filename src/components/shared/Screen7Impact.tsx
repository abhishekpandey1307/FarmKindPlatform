// =============================================================================
// SCREEN 7 — UNIFIED IMPACT & KISAN GAURAV (FARMER PRIDE & PROSPERITY)
// Celebrates Indian farmers for regenerating Mother Earth while unlocking
// life-changing household profit and financial freedom.
// =============================================================================

import { useState, useEffect } from 'react';
import { useApp } from '../../app/AppContext';
import {
  DIESEL_MONTHLY_L, DIESEL_MONTHLY_COST, SHARED_SOLAR_MONTHLY, WATER_SAVED_L, COST_DIFFERENCE,
  FLOOD_MONTHLY_PUMP_HOURS, DIESEL_PRICE_PER_L, DIESEL_MAINTENANCE_OIL_MONTHLY,
  calcHarvestEconomics, formatINR, formatLiters, formatNumber
} from '../../engine/calculation';
import { calculateSolarPumpSubsidy } from '../../engine/schemesEngine';
import { speakNaturalIndianVoice } from '../../utils/indianVoiceSynth';
import { ImpactMetric, ProvenanceBadge, SectionHeader } from '../shared';

export function Screen7Impact() {
  const { state, resetScenario, triggerCelebration, setLanguage } = useApp();
  const { simulation, farmState } = state;

  const [showProvenance, setShowProvenance] = useState(false);
  const currentLang = state.language === 'en' ? 'en' : state.language === 'hi' ? 'hi' : 'mr';
  const [certLang, setCertLang] = useState<'mr' | 'hi' | 'en'>(currentLang);
  const [isSpeakingGaurav, setIsSpeakingGaurav] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Sync with global language if changed from TopNav
  useEffect(() => {
    setCertLang(state.language === 'en' ? 'en' : state.language === 'hi' ? 'hi' : 'mr');
  }, [state.language]);

  // Dynamic values from engine
  const harvestProtectedInr = calcHarvestEconomics(1200, 31.25, 40, 72, 32).spoilageLoss;
  const waterSavedLakhs = (WATER_SAVED_L / 100000).toFixed(1);
  const annualCashSavedInr = Math.round(COST_DIFFERENCE * 12);
  const annualWaterSavedM = ((WATER_SAVED_L * 12) / 1000000).toFixed(1);
  const monthlyCo2AvoidedKg = Math.round(DIESEL_MONTHLY_L * 2.68); // 2.68 kg CO2/L diesel
  const annualCo2AvoidedTonnes = ((monthlyCo2AvoidedKg * 12) / 1000).toFixed(1);
  const subsidyQuote = calculateSolarPumpSubsidy(5);
  const totalAnnualValue = annualCashSavedInr + harvestProtectedInr + subsidyQuote.totalGovtSubsidyInr;

  // Real events from telemetry logs
  const risksDetected = simulation.eventLog.filter(e => e.type === 'CLIMATE_ALERT').length || (state.liveWeather && state.liveWeather.temperatureC > 35 ? 1 : 0);
  const decisionsGenerated = simulation.decisionLog.length + (state.currentDecision ? 1 : 0);
  const actionsRecommended = simulation.decisionLog.filter(d => d.selectedAction !== 'MONITOR').length + (state.currentDecision && state.currentDecision.selectedAction !== 'MONITOR' ? 1 : 0);
  const actionsApproved = (state.currentDecision?.status === 'APPROVED' || state.currentDecision?.status === 'EXECUTING' || state.currentDecision?.status === 'COMPLETED' || state.currentDecision?.status === 'VERIFIED') ? 1 : 0;
  const actionsAutomated = state.farmUpgrades.inSituSensor ? 1 : 0;
  const actionsVerified = (state.currentDecision?.status === 'VERIFIED' || state.farmUpgrades.sharedSolarDrip) ? 1 : 0;

  // Spoken celebratory audio text by language
  const celebratoryAudioText: Record<'mr' | 'hi' | 'en', string> = {
    mr: `अभिनंदन रमेशभाऊ! तुम्ही निसर्गाचे दरमहा १६ लाख लिटर पाणी वाचवले, डिझेलचा धूर बंद केला आणि कुटुंबासाठी दरमहा ₹१२,४१६ ची नकद बचत केली. तुम्ही महाराष्ट्राचे खरे शेतकरी रक्षक आणि स्वावलंबी आहात! आम्हास तुमचा सार्थ अभिमान आहे!`,
    hi: `बधाई हो रमेश भाई! आपने धरती माता के १६ लाख लीटर भूजल की रक्षा की है, जहरीला डीजल का धुआं बंद किया और अपने परिवार के लिए हर महीने ₹१२,४१६ की सीधी कमाई बचाई। आप सच्चे प्रकृति रक्षक और आत्मनिर्भर किसान हैं!`,
    en: `Salute to progressive farmer Ramesh Patil! By switching to solar precision drip, you saved 16.3 Lakh Liters of groundwater every month and kept ₹12,416 net profit back in your pocket. You are the pride of Indian Agriculture!`,
  };

  const handleCelebrateImpact = () => {
    triggerCelebration(
      'Kisan Gaurav: True Guardian of Nature & Family!',
      `Ramesh Patil (Nashik) has eliminated ${Math.round(DIESEL_MONTHLY_L)} L diesel/mo, saved ${waterSavedLakhs} Lakh Liters of groundwater, and unlocked ₹${annualCashSavedInr.toLocaleString('en-IN')} annual profit!`,
      `+₹${Math.round(COST_DIFFERENCE).toLocaleString('en-IN')}/mo Cash Profit · ${waterSavedLakhs} Lakh L Water Saved`
    );

    setIsSpeakingGaurav(true);
    speakNaturalIndianVoice(celebratoryAudioText[certLang], certLang, {
      onEnd: () => setIsSpeakingGaurav(false),
      onError: () => setIsSpeakingGaurav(false),
    });
  };

  const shareText = `🇮🇳 *Kisan Gaurav Honor Card — Ramesh Patil (Nashik)*\n🌱 *Nature Contribution:* Saved ${waterSavedLakhs} Lakh Liters water/mo & ${monthlyCo2AvoidedKg} kg CO₂!\n💰 *Family Profit:* +${formatINR(Math.round(COST_DIFFERENCE))}/mo cash kept (+₹${annualCashSavedInr.toLocaleString('en-IN')}/year)!\n🌾 Empowered by FarmKind Smart Engine & Shared Solar Drip.`;

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="screen-scroll">
      <SectionHeader
        eyebrow="🇮🇳 Kisan Gaurav · Farmer Pride & Scale"
        title="Impact, Earth Regeneration & Family Wealth"
        subtitle="Honoring Ramesh Patil for healing Mother Earth while keeping ₹1.49 Lakhs net cash profit in his family's hands"
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          HERO CELEBRATION BUTTON (Interactive pride moment & audio speech)
          ══════════════════════════════════════════════════════════════════════════ */}
      <button
        id="btn-celebrate-impact-hero"
        className="celebrate-hero-cta"
        onClick={handleCelebrateImpact}
      >
        <span className="text-3xl animate-bounce" aria-hidden="true">🎉</span>
        <div className="text-left flex-1">
          <div className="text-base font-black tracking-wide text-white">
            {isSpeakingGaurav ? '🔊 Listening to Kisan Gaurav Audio Salute…' : 'Celebrate My Farm Impact & Ring Prosperity Bell →'}
          </div>
          <div className="text-xs text-green-100 font-normal">
            Click for full-screen confetti burst & spoken tribute in {certLang === 'mr' ? 'मराठी' : certLang === 'hi' ? 'हिन्दी' : 'English'}!
          </div>
        </div>
        <span className="badge badge--live text-xs">HONOR SHIELD</span>
      </button>

      {/* ══════════════════════════════════════════════════════════════════════════
          KISAN GAURAV PATRA (Official Certificate of Environmental & Financial Honor)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="kisan-gaurav-certificate animate-in">
        {/* Certificate language switcher */}
        <div className="flex justify-end gap-1 mb-2">
          {(['mr', 'hi', 'en'] as const).map(lang => (
            <button
              key={lang}
              className={`btn btn--xs ${certLang === lang ? 'btn--amber font-bold' : 'btn--ghost text-muted'}`}
              onClick={() => {
                setCertLang(lang);
                setLanguage(lang);
              }}
              style={{ fontSize: 11, padding: '3px 8px' }}
            >
              {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिन्दी' : 'English'}
            </button>
          ))}
        </div>

        <div className="kisan-gaurav-header">
          <div className="kisan-gaurav-seal" aria-hidden="true">
            🌱
          </div>
          <div className="kisan-gaurav-title">
            {certLang === 'mr' ? 'किसान गौरव पत्र — हरित समृद्धी सन्मान' : certLang === 'hi' ? 'किसान गौरव पत्र — हरित समृद्धि सम्मान' : 'Kisan Gaurav Patra — Green Prosperity Honor'}
          </div>
          <div className="kisan-gaurav-recipient">
            🏅 {farmState.farmer.name} · {farmState.farm.location} (3.5 Acres Tomato)
          </div>
          <p className="text-xs text-amber-200 mt-1 max-w-xl mx-auto leading-relaxed">
            {certLang === 'mr'
              ? 'या गौरव पत्राद्वारे प्रमाणित करण्यात येते की, रमेश पाटील यांनी पारंपरिक डिझेल पूर पद्धतीचा त्याग करून आधुनिक सामायिक सौर ठिबक प्रणालीचा यशस्वी अवलंब केला आहे. यामुळे निसर्गाचे लाखो लिटर भूजल सुरक्षित राहिले असून कुटुंबाला आर्थिक स्वावलंबन लाभले आहे.'
              : certLang === 'hi'
              ? 'इस गौरव पत्र द्वारा प्रमाणित किया जाता है कि रमेश पाटिल ने अत्यधिक पानी व डीजल बहाने वाली पुरानी पद्धति को त्यागकर साझा सौर ड्रिप प्रणाली अपनाई है। इससे धरती माता का अनमोल भूजल सुरक्षित हुआ है और परिवार को आर्थिक संप्रभुता मिली है।'
              : 'This citation honors Ramesh Patil for pioneering regenerative smallholder agriculture. By replacing diesel flood irrigation with solar precision drip, this farm safeguards precious groundwater, eliminates carbon soot, and establishes permanent household prosperity.'}
          </p>
        </div>

        {/* 2-Grid Key Achievements on Certificate */}
        <div className="grid-2 gap-3 mb-4">
          <div className="card p-3" style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.35)' }}>
            <span className="text-xs font-bold text-green uppercase tracking-wider block mb-1">
              🌿 Nature & Planet Gift
            </span>
            <div className="text-xl font-black text-green font-mono">
              {waterSavedLakhs} Lakh Liters / Mo
            </div>
            <span className="text-xs text-secondary block mt-0.5">
              Groundwater Preserved in Dindori Aquifer ({annualWaterSavedM}M L/yr)
            </span>
          </div>

          <div className="card p-3" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
            <span className="text-xs font-bold text-amber uppercase tracking-wider block mb-1">
              💰 Household Net Profit
            </span>
            <div className="text-xl font-black text-amber font-mono">
              +{formatINR(Math.round(COST_DIFFERENCE))} / Month
            </div>
            <span className="text-xs text-secondary block mt-0.5">
              Direct Cash Back in Pocket (+₹{annualCashSavedInr.toLocaleString('en-IN')}/year)
            </span>
          </div>
        </div>

        {/* Official verified stamps & signatures */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-subtle text-xs text-muted">
          <div>
            <span className="font-bold text-secondary block">Verified by:</span>
            <span>FarmKind Autonomous Agro-Intelligence Network</span>
          </div>
          <div className="text-left sm:text-right">
            <span className="font-bold text-green block">✓ Official Status:</span>
            <span>Regenerative Green Smallholder (Grade A+)</span>
          </div>
        </div>

        {/* Share actions */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-subtle">
          <button
            id="btn-share-whatsapp-gaurav"
            className="btn btn--primary flex-1 btn--sm font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto"
            onClick={handleShareWhatsApp}
          >
            <span>📲</span>
            <span>{copiedShare ? '✓ Opening WhatsApp…' : 'Share Pride Card on WhatsApp'}</span>
          </button>
          <button
            className="btn btn--secondary btn--sm font-semibold w-full sm:w-auto"
            onClick={() => window.print()}
            title="Print or Save PDF of your Certificate"
          >
            🖨️ Print / Save
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          DUAL PILLARS OF PRIDE: NATURE REGENERATION + FAMILY PROSPERITY
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="kisan-dual-pillars animate-in">
        {/* PILLAR 1: CONTRIBUTION TOWARDS NATURE */}
        <div className="pillar-card pillar-card--nature">
          <div className="pillar-header">
            <span className="text-2xl" aria-hidden="true">🌿</span>
            <div>
              <h3 className="text-base font-bold text-green">My Gift to Mother Nature</h3>
              <p className="text-xs text-muted">Real environmental regeneration in Nashik</p>
            </div>
          </div>

          <div className="pillar-stat-row">
            <div className="pillar-stat-icon text-cyan">💧</div>
            <div className="flex-1">
              <div className="text-xs text-muted">Groundwater Preserved:</div>
              <div className="text-lg font-black text-cyan font-mono">
                {waterSavedLakhs} Lakh Liters / Month
              </div>
              <div className="text-xs text-secondary mt-0.5">
                Equal to <strong>3,900 water tankers</strong> per year saved from depleting the village water table.
              </div>
            </div>
          </div>

          <div className="pillar-stat-row">
            <div className="pillar-stat-icon text-green">☁️</div>
            <div className="flex-1">
              <div className="text-xs text-muted">Clean Skies & Air Quality:</div>
              <div className="text-lg font-black text-green font-mono">
                {annualCo2AvoidedTonnes} Tonnes CO₂ Slashed / Yr
              </div>
              <div className="text-xs text-secondary mt-0.5">
                Displaced <strong>{Math.round(DIESEL_MONTHLY_L * 12)} L of black diesel exhaust</strong> with clean solar energy.
              </div>
            </div>
          </div>

          <div className="pillar-stat-row">
            <div className="pillar-stat-icon text-amber">🌱</div>
            <div className="flex-1">
              <div className="text-xs text-muted">Living Soil Regeneration:</div>
              <div className="text-lg font-black text-amber font-mono">
                3.5 Acres Soil Health Protected
              </div>
              <div className="text-xs text-secondary mt-0.5">
                90% root drip stops topsoil erosion, waterlogging, and toxic salt crusting.
              </div>
            </div>
          </div>

          <div className="pillar-stat-row">
            <div className="pillar-stat-icon text-rose">🍅</div>
            <div className="flex-1">
              <div className="text-xs text-muted">Zero Food Waste:</div>
              <div className="text-lg font-black text-rose font-mono">
                1,200 kg Produce Shielded from Rot
              </div>
              <div className="text-xs text-secondary mt-0.5">
                Pre-cooled solar storage ensures nutritious food feeds people instead of rotting in heat.
              </div>
            </div>
          </div>
        </div>

        {/* PILLAR 2: FAMILY PROFIT & FINANCIAL INDEPENDENCE */}
        <div className="pillar-card pillar-card--profit">
          <div className="pillar-header">
            <span className="text-2xl" aria-hidden="true">💰</span>
            <div>
              <h3 className="text-base font-bold text-amber">My Family's Wealth & Profit</h3>
              <p className="text-xs text-muted">Real financial sovereignty & peace of mind</p>
            </div>
          </div>

          <div className="pillar-stat-row">
            <div className="pillar-stat-icon text-green">💵</div>
            <div className="flex-1">
              <div className="text-xs text-muted">Monthly Cash Kept in Pocket:</div>
              <div className="text-lg font-black text-green font-mono">
                +{formatINR(Math.round(COST_DIFFERENCE))} / Month
              </div>
              <div className="text-xs text-secondary mt-0.5">
                Direct fuel savings: <strong>+₹{annualCashSavedInr.toLocaleString('en-IN')} net cash</strong> back in Ramesh's family account every year.
              </div>
            </div>
          </div>

          <div className="pillar-stat-row">
            <div className="pillar-stat-icon text-cyan">🛡️</div>
            <div className="flex-1">
              <div className="text-xs text-muted">Harvest Spoilage Loss Kept:</div>
              <div className="text-lg font-black text-cyan font-mono">
                +{formatINR(harvestProtectedInr)} Loss Avoided
              </div>
              <div className="text-xs text-secondary mt-0.5">
                Protected against 34°C highway heat distress selling during market glut.
              </div>
            </div>
          </div>

          <div className="pillar-stat-row">
            <div className="pillar-stat-icon text-amber">🏛️</div>
            <div className="flex-1">
              <div className="text-xs text-muted">Govt PM-KUSUM Capital Grant:</div>
              <div className="text-lg font-black text-amber font-mono">
                +{formatINR(subsidyQuote.totalGovtSubsidyInr)} Free Capital
              </div>
              <div className="text-xs text-secondary mt-0.5">
                60% direct subsidy for 5 HP solar pump. Debt-free permanent ownership.
              </div>
            </div>
          </div>

          <div className="pillar-stat-row">
            <div className="pillar-stat-icon text-yellow">🏆</div>
            <div className="flex-1">
              <div className="text-xs text-muted">Total 1st-Year Economic Value:</div>
              <div className="text-xl font-black text-yellow font-mono">
                +{formatINR(totalAnnualValue)}
              </div>
              <div className="text-xs text-secondary mt-0.5">
                Permanent escape from debt cycles and village moneylenders.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          WHAT THIS ₹1.49 LAKHS MEANS FOR RAMESH'S FAMILY (Real Life Impacts)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="card card--glow-green mb-4 animate-in">
        <div className="flex items-center justify-between mb-3">
          <p className="card-title text-green">What This +₹1.49 Lakhs Means for Ramesh's Family</p>
          <span className="badge badge--simulated">Dignity & Security</span>
        </div>

        <div className="grid-2 gap-3 text-xs">
          <div className="card p-3" style={{ background: 'var(--bg-base)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🎓</span>
              <strong className="text-primary">Children's Higher Education:</strong>
            </div>
            <p className="text-muted leading-relaxed">
              Full 1-year college fees, books, and transportation for daughter Aarti paid upfront with zero education debt.
            </p>
          </div>

          <div className="card p-3" style={{ background: 'var(--bg-base)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🕊️</span>
              <strong className="text-primary">Freedom From Moneylenders:</strong>
            </div>
            <p className="text-muted leading-relaxed">
              No longer forced to borrow emergency diesel money from local lenders at 3% monthly interest (36% APR).
            </p>
          </div>

          <div className="card p-3" style={{ background: 'var(--bg-base)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🌾</span>
              <strong className="text-primary">Farm Reinvestment:</strong>
            </div>
            <p className="text-muted leading-relaxed">
              Can afford premium certified hybrid seeds, micronutrient drip packs, and neem pest sprays without credit.
            </p>
          </div>

          <div className="card p-3" style={{ background: 'var(--bg-base)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🏥</span>
              <strong className="text-primary">Family Health Emergency Shield:</strong>
            </div>
            <p className="text-muted leading-relaxed">
              Emergency medical fund of ₹50,000 kept safe in the bank. Sleep peacefully knowing the family is protected.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          VILLAGE COMMUNITY MULTIPLIER (Scale impact for 100 farmers)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="card p-4 mb-4 text-center animate-in" style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%)',
        border: '1px solid rgba(14, 165, 233, 0.3)',
      }}>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-1">
          Village Scale Multiplier · Dindori Cluster (100 Farmers)
        </p>
        <p className="text-xs text-muted mb-3 max-w-lg mx-auto">
          When 100 smallholders follow Ramesh Patil's regenerative solar model:
        </p>

        <div className="grid-3 gap-3">
          <div className="card p-2 text-center" style={{ background: 'var(--bg-card)' }}>
            <div className="text-lg font-black text-blue font-mono">16.3 Crore L</div>
            <div className="text-xs text-muted mt-0.5">Water Preserved / Mo</div>
          </div>
          <div className="card p-2 text-center" style={{ background: 'var(--bg-card)' }}>
            <div className="text-lg font-black text-green font-mono">₹1.49 Crore</div>
            <div className="text-xs text-muted mt-0.5">Village Wealth Kept / Yr</div>
          </div>
          <div className="card p-2 text-center" style={{ background: 'var(--bg-card)' }}>
            <div className="text-lg font-black text-amber font-mono">540 Tonnes</div>
            <div className="text-xs text-muted mt-0.5">CO₂ Cut from Air / Yr</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          AUTHENTIC SCIENTIFIC PROVENANCE AUDIT TABLE
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="impact-grid mb-4">
        <ImpactMetric
          icon="💧"
          value={`≈ ${formatLiters(WATER_SAVED_L)}`}
          label={`${waterSavedLakhs} Lakh L Water Saved`}
          source="CALCULATED"
          colorClass="metric-number--blue"
        />
        <ImpactMetric
          icon="⛽"
          value={`≈ ${formatNumber(Math.round(DIESEL_MONTHLY_L))} L`}
          label="Diesel Fuel Avoided"
          source="CALCULATED"
          colorClass="metric-number--amber"
        />
        <ImpactMetric
          icon="₹"
          value={`≈ ${formatINR(Math.round(COST_DIFFERENCE))}`}
          label="Monthly Cash Saved"
          source="CALCULATED"
          colorClass="metric-number--green"
        />
        <ImpactMetric
          icon="🍅"
          value={formatINR(harvestProtectedInr)}
          label="Harvest Crop Protected"
          source="CALCULATED"
          colorClass="metric-number--cyan"
        />
        <ImpactMetric
          icon="🌡️"
          value={String(risksDetected)}
          label="Heat Waves Shielded"
          source="AI_DERIVED"
          colorClass=""
        />
        <ImpactMetric
          icon="🧠"
          value={String(decisionsGenerated)}
          label="Decisions in Mother Tongue"
          source="AI_DERIVED"
          colorClass=""
        />
      </div>

      {/* Modeled cost comparison */}
      <div className="card card--glow-green mb-4 animate-in">
        <p className="card-title text-green mb-3">Monthly Operating Cost Comparison (3.5 Acres)</p>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-muted">Old Practice (Diesel + Flood)</div>
            <div className="text-2xl font-black text-orange">{formatINR(Math.round(DIESEL_MONTHLY_COST))}</div>
            <ProvenanceBadge source="CALCULATED" label="Fuel ₹15,916 + ₹2,500 Maint." />
          </div>
          <div className="text-2xl text-muted">→</div>
          <div>
            <div className="text-sm text-muted">FarmKind (Shared Solar + Drip)</div>
            <div className="text-2xl font-black text-green">{formatINR(SHARED_SOLAR_MONTHLY)}</div>
            <ProvenanceBadge source="ASSUMED" label="Pay-Per-Use" />
          </div>
        </div>
        <div className="card text-center" style={{ background: 'rgba(34,197,94,0.06)' }}>
          <div className="text-3xl font-black text-green">≈ {formatINR(Math.round(COST_DIFFERENCE))} / Month</div>
          <div className="metric-label mt-1">DIRECT CASH SAVED EVERY MONTH</div>
          <div className="text-xs text-secondary mt-2">
            🌱 {formatINR(Math.round(COST_DIFFERENCE))} stays in your bank account every month instead of burning into diesel smoke.
          </div>
        </div>
      </div>

      {/* Today's decision audit */}
      <div className="card mb-4 animate-in">
        <p className="card-title mb-3">Today With FarmKind</p>
        <div className="grid-2">
          {[
            { label: 'Risks Detected',      value: risksDetected },
            { label: 'Smart Engine Decisions', value: decisionsGenerated },
            { label: 'Actions Recommended',  value: actionsRecommended },
            { label: 'Actions Approved',     value: actionsApproved },
            { label: 'Actions Automated',    value: actionsAutomated },
            { label: 'Actions Verified',     value: actionsVerified },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2 border-b"
              style={{ borderBottomColor: 'var(--border-subtle)' }}>
              <span className="text-sm text-secondary">{row.label}</span>
              <span className="text-xl font-black text-primary">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Provenance breakdown toggle */}
      <button
        className="btn btn--ghost btn--full btn--sm mb-3"
        onClick={() => setShowProvenance(v => !v)}
        aria-expanded={showProvenance}
      >
        {showProvenance ? '▲ Hide' : '▼'} Scientific Data &amp; Mathematical Provenance Panel
      </button>

      {showProvenance && (
        <div className="provenance-panel mb-4 animate-in">
          <p className="card-title mb-3">Provenance of Key Scientific Numbers</p>
          {[
            { label: 'Farm Area: 3.5 acres (14,164 m²)', source: 'REFERENCE' as const },
            { label: 'Tomato Kc: 1.15 (FAO-56 mid-season)', source: 'REFERENCE' as const },
            { label: 'Surface irrigation efficiency: 60%', source: 'REFERENCE' as const },
            { label: 'Drip irrigation efficiency: 90%', source: 'REFERENCE' as const },
            { label: 'Reference ETo: 6.0 mm/day (Nashik summer)', source: 'REFERENCE' as const },
            { label: 'Pump flow capacity: 35,000 L/hr', source: 'REFERENCE' as const },
            { label: `Pumping hours: ${FLOOD_MONTHLY_PUMP_HOURS.toFixed(1)} hrs/mo`, source: 'CALCULATED' as const },
            { label: `Diesel price: ₹${DIESEL_PRICE_PER_L.toFixed(2)}/L`, source: 'REFERENCE' as const },
            { label: `Diesel maintenance & oil: ${formatINR(DIESEL_MAINTENANCE_OIL_MONTHLY)}/mo`, source: 'ASSUMED' as const },
            { label: `Shared solar: ${formatINR(SHARED_SOLAR_MONTHLY)}/month`, source: 'ASSUMED' as const, label2: 'COMMERCIAL MODEL' },
            { label: 'Virtual sensor readings', source: 'SIMULATED' as const },
            { label: 'Smart Engine decisions', source: 'AI_DERIVED' as const },
            { label: `Water difference (${formatLiters(WATER_SAVED_L)})`, source: 'CALCULATED' as const },
            { label: `Operating difference (${formatINR(COST_DIFFERENCE)}/mo)`, source: 'CALCULATED' as const },
          ].map(row => (
            <div key={row.label} className="provenance-row">
              <span className="text-sm text-secondary">{row.label}</span>
              <ProvenanceBadge source={row.source} label={row.label2} />
            </div>
          ))}
        </div>
      )}

      {/* Product statement */}
      <div className="card text-center mb-4" style={{ borderColor: 'rgba(34,197,94,0.3)', padding: '24px' }}>
        <p className="text-sm font-medium text-secondary leading-relaxed">
          <span className="text-green font-bold">FarmKind</span> turns scattered farm signals into one continuous
          decision-and-action loop. Every drop saved, every rupee counted, every risk detected.
        </p>
      </div>

      {/* Reset Demo button */}
      <button
        id="btn-reset-demo"
        className="btn btn--secondary btn--full mb-3"
        onClick={resetScenario}
      >
        ↺ Reset Demo
      </button>

      <div className="text-xs text-muted text-center leading-relaxed mb-6">
        All modeled figures are indicative estimates derived from FAO-56 standards, MNRE benchmarks, and Nashik APMC data.
      </div>
    </div>
  );
}
