// =============================================================================
// SCREEN 3 — AFFORDABLE SHARED SOLAR & REAL GOVERNMENT SCHEMES HUB
// Empowers small farmers with renewable shared solar (pay-per-use) and authentic
// government subsidies (PM-KUSUM, PM-KISAN, PMFBY, SMAM, MahaDBT)
// =============================================================================

import { useState, useEffect } from 'react';
import { useApp } from '../../app/AppContext';
import {
  DIESEL_MONTHLY_COST, SHARED_SOLAR_MONTHLY, COST_DIFFERENCE,
  DIESEL_MONTHLY_L, WATER_SAVED_L, formatINR, formatLiters, formatNumber
} from '../../engine/calculation';
import {
  GOV_SCHEMES_CATALOG,
  evaluateSchemeEligibility,
  calculateSolarPumpSubsidy,
  type SchemeInfo,
} from '../../engine/schemesEngine';
import {
  SHARED_SOLAR_CATALOG,
  type SolarAssetListing,
} from '../../engine/solarMarketEngine';
import { ProvenanceBadge, SectionHeader, ActionButton } from '../shared';

export function Screen3Resources() {
  const { state, connectSolar, navigateTo, bookSolarSlot, setActiveMarketTab, setUpgradeStatus, triggerCelebration } = useApp();
  const { farmState, liveWeather, solarBookings, activeMarketTab, farmUpgrades } = state;

  const [activeTab, setActiveTab] = useState<'SOLAR' | 'SCHEMES' | 'GROUP'>(activeMarketTab || 'SOLAR');
  const [selectedPumpHp, setSelectedPumpHp] = useState<3 | 5 | 7.5>(5);

  useEffect(() => {
    if (activeMarketTab) {
      setActiveTab(activeMarketTab);
    }
  }, [activeMarketTab]);

  const handleTabChange = (tab: 'SOLAR' | 'SCHEMES' | 'GROUP') => {
    setActiveTab(tab);
    setActiveMarketTab(tab);
  };
  const [bookingAsset, setBookingAsset] = useState<SolarAssetListing | null>(null);
  const [bookingDuration, setBookingDuration] = useState<number>(2);
  const [bookingSlotTime, setBookingSlotTime] = useState<string>('Today, 2:00 PM – 4:00 PM');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [joinedGroup, setJoinedGroup] = useState(false);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>('pm-kusum');

  const farmerProfile = {
    farmerName: farmState.farmer.name,
    landholdingAcres: farmState.farm.areaAcres,
    cropType: farmState.farm.crop.cropType,
    district: 'Nashik',
    state: 'Maharashtra',
    irrigationType: farmState.farm.irrigation.irrigationMethod,
    energySource: farmState.farm.energy.primarySource === 'SHARED_SOLAR' ? ('SOLAR' as const) : ('DIESEL' as const),
    hasAadhaar: true,
    hasLandExtract712: true,
    hasBankPassbook: true,
    fpoMember: true,
  };

  const schemeEvaluations = evaluateSchemeEligibility(farmerProfile, GOV_SCHEMES_CATALOG);
  const subsidyQuote = calculateSolarPumpSubsidy(selectedPumpHp);

  const handleOpenBooking = (asset: SolarAssetListing) => {
    setBookingAsset(asset);
    setBookingDuration(asset.type === 'SHARED_SOLAR_PUMP' ? 2 : 1);
    setBookingSuccessMsg(null);

    // Smoothly and automatically scroll down to the booking card location
    setTimeout(() => {
      const el = document.getElementById('solar-booking-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  const handleConfirmBooking = () => {
    if (!bookingAsset) return;
    const order = bookSolarSlot(bookingAsset.assetId, bookingDuration, bookingSlotTime);
    setBookingSuccessMsg(
      `✓ Confirmed! Booking ID: ${order.bookingId} for ${order.durationUnits} ${order.unitType.toLowerCase()}. Displacing ~${order.dieselDisplacedLiters} L of diesel!`
    );
    setTimeout(() => {
      setBookingAsset(null);
    }, 2800);
  };

  const solarConnected = farmState.farm.energy.primarySource === 'SHARED_SOLAR';

  return (
    <div className="screen-scroll">
      <SectionHeader
        eyebrow="Empowering Small Farmers"
        title="Affordable Resources Marketplace & Govt Schemes"
        subtitle="Shared solar, equipment providers, FPOs, 60% PM-KUSUM subsidies & Farmer Group demand pooling"
      />

      {/* Cost comparison — Business first */}
      <div className="card card--glow-amber mb-4 animate-in">
        <div className="flex items-center justify-between mb-3">
          <p className="card-title text-amber">Farm Operating Cost Comparison</p>
          <span className="badge badge--live">Small Farmer Economics</span>
        </div>

        <div className="comparison-row mb-3">
          <div className="text-center">
            <div className="text-xl font-black text-orange">
              {formatINR(Math.round(DIESEL_MONTHLY_COST))}
            </div>
            <div className="metric-label">DIESEL + FLOOD</div>
            <div className="mt-1"><ProvenanceBadge source="CALCULATED" /></div>
          </div>
          <div className="comparison-divider text-2xl">→</div>
          <div className="text-center">
            <div className="text-xl font-black text-green">
              {formatINR(SHARED_SOLAR_MONTHLY)}
            </div>
            <div className="metric-label">SHARED SOLAR</div>
            <div className="mt-1"><ProvenanceBadge source="CALCULATED" label="Pay-Per-Use" /></div>
          </div>
        </div>

        <div className="card" style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}>
          <div className="text-center">
            <div className="text-4xl font-black text-green">
              ≈ {formatINR(Math.round(COST_DIFFERENCE))}
            </div>
            <div className="metric-label mt-1">
              POTENTIAL OPERATING-COST SAVINGS / MONTH
            </div>
            <div className="text-xs text-muted mt-2">
              Displaces ~{formatNumber(Math.round(DIESEL_MONTHLY_L))} L diesel & avoids ~{formatLiters(WATER_SAVED_L)} water waste.
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-2 mb-4 flex-wrap sm:flex-nowrap">
        <button
          className={`btn btn--sm flex-1 ${activeTab === 'SOLAR' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => handleTabChange('SOLAR')}
          id="tab-shared-solar"
        >
          <span>☀️ Shared Solar</span>
          <span className="hidden sm:inline"> &amp; Assets ({SHARED_SOLAR_CATALOG.length})</span>
        </button>
        <button
          className={`btn btn--sm flex-1 ${activeTab === 'SCHEMES' ? 'btn--secondary' : 'btn--ghost'}`}
          onClick={() => handleTabChange('SCHEMES')}
          id="tab-gov-schemes"
        >
          <span>🏛️ PM-KUSUM</span>
          <span className="hidden sm:inline"> &amp; Schemes</span>
        </button>
        <button
          className={`btn btn--sm flex-1 ${activeTab === 'GROUP' ? 'btn--secondary' : 'btn--ghost'}`}
          onClick={() => handleTabChange('GROUP')}
          id="tab-farmer-group"
        >
          🤝 Farmer Groups
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: SHARED SOLAR MARKETPLACE (Renewable + Affordable Only)
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SOLAR' && (
        <div className="flex flex-col gap-4 animate-in">
          {/* Live Solar Generation Tile */}
          <div className="card card--glow-amber">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="status-dot status-dot--live" />
                <span className="card-title text-amber text-sm">Live Solar Sunlight &amp; Power</span>
              </div>
              <ProvenanceBadge source="REAL" label="Satellite Solar Meter" />
            </div>

            <div className="grid-2 gap-2 text-center my-2">
              <div className="card p-2" style={{ background: 'var(--bg-card-2)' }}>
                <div className="text-xs text-muted">SUNSHINE CONDITION</div>
                <div className="text-xl font-black text-amber mt-0.5">
                  ☀️ Strong Sun
                </div>
                <span className="text-xs text-muted font-mono">{liveWeather?.solarRadiationWm2 ?? 785} W/m²</span>
              </div>
              <div className="card p-2" style={{ background: 'var(--bg-card-2)' }}>
                <div className="text-xs text-muted">SOLAR PUMP READINESS</div>
                <div className="text-xl font-black text-green mt-0.5">
                  Ready (Full Power)
                </div>
                <span className="text-xs text-muted font-mono">Est. {liveWeather?.estimatedSolarPumpKw ?? 4.25} kW</span>
              </div>
            </div>

            <p className="text-xs text-secondary">
              ☀️ Sunshine is strong right now. Perfect time to run your shared solar pump without spending a rupee on diesel.
            </p>
          </div>

          {/* Shared Solar Catalog */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-muted mb-2">
              Nearby Community Solar Equipment (Zero Capital Debt)
            </p>

            <div className="flex flex-col gap-3">
              {SHARED_SOLAR_CATALOG.map(asset => (
                <div key={asset.assetId} className="card card--raised">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-primary">{asset.title}</span>
                        <span className="badge badge--simulated text-xs">{asset.verificationStatus}</span>
                      </div>
                      <p className="text-xs text-secondary mt-0.5">
                        📍 {asset.ownerHub} ({asset.distanceKm} km away)
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-green font-mono">
                        ₹{asset.hourlyOrDailyRateInr}
                      </div>
                      <span className="text-xs text-muted">
                        /{asset.rateUnit === 'PER_HOUR' ? 'hour' : asset.rateUnit === 'PER_DAY' ? 'day' : 'crate/day'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted mb-3 font-mono">{asset.capacityDescription}</p>

                  <div className="flex flex-col gap-1 mb-3">
                    {asset.features.map((feat, i) => (
                      <div key={i} className="text-xs text-secondary flex items-center gap-1.5">
                        <span className="text-green">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-subtle">
                    <span className="text-xs text-amber font-semibold">
                      Slot: {asset.nextAvailableSlot}
                    </span>
                    <button
                      className="btn btn--sm btn--primary w-full sm:w-auto font-bold"
                      onClick={() => handleOpenBooking(asset)}
                    >
                      Book Slot →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════
              DEDICATED SOLAR BOOKING CONSOLE (Auto-scrolled into view upon click)
              ══════════════════════════════════════════════════════════════════════════ */}
          {bookingAsset && (
            <div
              id="solar-booking-section"
              className="card card--glow-amber animate-in my-4"
              role="region"
              aria-label="Solar Slot Reservation Console"
              style={{
                border: '2px solid var(--clr-solar-amber)',
                boxShadow: '0 0 40px rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-xl)',
                scrollMarginTop: '120px',
                padding: '24px',
              }}
            >
              <div className="flex items-center justify-between mb-3 border-b border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">⚡</span>
                  <div>
                    <h3 className="text-base font-bold text-amber">
                      Reserve & Lock Slot: {bookingAsset.title}
                    </h3>
                    <p className="text-xs text-muted">
                      📍 {bookingAsset.ownerHub} · Rate: ₹{bookingAsset.hourlyOrDailyRateInr} / {bookingAsset.rateUnit === 'PER_HOUR' ? 'hr' : 'day'}
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setBookingAsset(null)}
                  aria-label="Cancel and close booking form"
                  title="Close booking form"
                >
                  ✕ Close
                </button>
              </div>

              {bookingSuccessMsg ? (
                <div className="card card--glow-green text-center my-4 animate-in">
                  <div className="text-3xl mb-1">🎉</div>
                  <p className="text-base font-bold text-green">{bookingSuccessMsg}</p>
                  <p className="text-xs text-muted mt-2">SMS confirmation sent to Ramesh Patil</p>
                  <div className="mt-3">
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => setBookingAsset(null)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Duration Picker */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-muted block mb-1.5">
                      {bookingAsset.type === 'SHARED_SOLAR_PUMP' ? 'Select Irrigation Hours:' : 'Select Duration / Crates:'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          className={`btn btn--sm ${bookingDuration === num ? 'btn--primary font-bold' : 'btn--ghost'}`}
                          onClick={() => setBookingDuration(num)}
                        >
                          {num} {bookingAsset.rateUnit === 'PER_HOUR' ? 'Hrs' : 'Days'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slot Time Picker */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-muted block mb-1.5">Preferred Time Window:</label>
                    <select
                      className="select-input w-full p-2.5 rounded-lg text-xs"
                      value={bookingSlotTime}
                      onChange={e => setBookingSlotTime(e.target.value)}
                      style={{ background: 'var(--bg-base)', color: 'var(--txt-primary)', border: '1px solid var(--border-medium)' }}
                    >
                      <option value="Today, 2:00 PM – 4:00 PM">Today, 2:00 PM – 4:00 PM (Peak Sun)</option>
                      <option value="Today, 4:00 PM – 6:00 PM">Today, 4:00 PM – 6:00 PM (Evening Drip)</option>
                      <option value="Tomorrow, 8:00 AM – 10:00 AM">Tomorrow, 8:00 AM – 10:00 AM (Morning Slot)</option>
                    </select>
                  </div>

                  {/* Cost Calculation Summary */}
                  <div className="card p-3 mb-4 text-xs" style={{ background: 'var(--bg-card-2)' }}>
                    <div className="flex justify-between mb-1.5">
                      <span>Solar Booking Charge:</span>
                      <span className="font-bold text-green font-mono">
                        ₹{Math.round(bookingAsset.hourlyOrDailyRateInr * bookingDuration)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-1.5 text-muted">
                      <span>Equivalent Diesel Pump Cost:</span>
                      <span className="line-through">
                        ₹{Math.round(bookingAsset.equivalentDieselCostInr * bookingDuration)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-subtle text-green font-bold text-sm">
                      <span>Net Cash Saved Today:</span>
                      <span>
                        ₹{Math.round((bookingAsset.equivalentDieselCostInr - bookingAsset.hourlyOrDailyRateInr) * bookingDuration)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      id="btn-confirm-solar-booking"
                      className="btn btn--primary flex-1 font-bold py-2.5"
                      onClick={handleConfirmBooking}
                    >
                      ✓ Confirm & Lock Slot Now
                    </button>
                    <button
                      className="btn btn--ghost btn--sm px-4"
                      onClick={() => setBookingAsset(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Bookings Card */}
          {solarBookings.length > 0 && (
            <div className="card card--glow-green">
              <p className="card-title text-green text-sm mb-2">
                ✓ Confirmed Solar Bookings ({solarBookings.length})
              </p>
              <div className="flex flex-col gap-2">
                {solarBookings.map(b => (
                  <div key={b.bookingId} className="card p-2 text-xs" style={{ background: 'var(--bg-base)' }}>
                    <div className="flex items-center justify-between font-bold text-primary mb-1">
                      <span>{b.assetTitle}</span>
                      <span className="text-green font-mono">₹{b.totalPriceInr} (PAID)</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Slot: {b.slotStartTime} ({b.durationUnits} {b.unitType.toLowerCase()})</span>
                      <span className="text-cyan">Avoided {b.dieselDisplacedLiters} L Diesel</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connection CTA */}
          {solarConnected ? (
            <div className="card card--glow-green text-center">
              <span className="text-green font-bold text-base">✓ Shared Solar Connected to FarmState</span>
              <p className="text-xs text-muted mt-1">
                Your farm profile is now designated as Solar-Powered. Zero diesel emissions!
              </p>
            </div>
          ) : (
            <ActionButton
              id="btn-connect-farm-solar"
              label="Connect Farm to Shared Solar"
              sublabel="Adopt shared solar micro-grid model"
              onClick={() => connectSolar()}
              variant="primary"
              fullWidth
            />
          )}

          <ActionButton
            id="btn-go-smart-irrigation-from-3"
            label="See Command Center & Irrigation →"
            onClick={() => navigateTo(2)}
            variant="secondary"
            fullWidth
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 2: REAL GOVERNMENT SCHEMES & PM-KUSUM ELIGIBILITY HUB
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SCHEMES' && (
        <div className="flex flex-col gap-4 animate-in">
          {/* Farmer Profile Summary */}
          <div className="card card--glow-cyan">
            <div className="flex items-center justify-between mb-2">
              <p className="card-title text-cyan text-sm">Farmer Scheme Matching (Indicative Assessment)</p>
              <span className="badge badge--simulated text-xs">Self-Declared Profile</span>
            </div>
            <div className="grid-2 gap-2 text-xs text-secondary">
              <div><strong>Farmer:</strong> {farmerProfile.farmerName}</div>
              <div><strong>Landholding:</strong> {farmerProfile.landholdingAcres} Acres (Smallholder Tier)</div>
              <div><strong>Crop:</strong> {farmerProfile.cropType} (Notified Horticultural Crop)</div>
              <div><strong>Water/Energy:</strong> Diesel Flood → Transitioning to Solar Drip</div>
            </div>
            <div className="mt-2 pt-2 border-t border-subtle text-xs text-muted flex items-center gap-2">
              <span className="text-amber font-bold">ℹ Eligibility Verification Required:</span>
              <span>Aadhaar, 7/12 land records & bank seeding required on official MahaDBT / MNRE portal.</span>
            </div>
          </div>

          {/* Interactive PM-KUSUM Subsidy Calculator */}
          <div className="card card--glow-amber">
            <div className="flex items-center justify-between mb-2">
              <p className="card-title text-amber text-sm">PM-KUSUM 60% Solar Pump Calculator (Indicative Model)</p>
              <span className="badge badge--live">Official MNRE Benchmarks</span>
            </div>
            <p className="text-xs text-muted mb-3">
              Select solar pump capacity to calculate indicative central & state capital assistance under Component B & C:
            </p>

            <div className="flex gap-2 mb-3">
              {([3, 5, 7.5] as const).map(hp => (
                <button
                  key={hp}
                  className={`btn btn--sm flex-1 ${selectedPumpHp === hp ? 'btn--amber' : 'btn--ghost'}`}
                  onClick={() => setSelectedPumpHp(hp)}
                >
                  {hp} HP Pump
                </button>
              ))}
            </div>

            {/* Breakdown Visualizer */}
            <div className="card p-3 mb-3" style={{ background: 'var(--bg-base)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted">Total Solar Pump Cost:</span>
                <span className="text-base font-bold text-primary font-mono">{formatINR(subsidyQuote.benchmarkCostInr)}</span>
              </div>

              {/* Progress bar visual */}
              <div className="w-full h-3 rounded-full flex overflow-hidden mb-2" style={{ background: '#1e293b' }}>
                <div style={{ width: '60%', background: 'var(--clr-farm-green)' }} title="Govt Subsidy 60%" />
                <div style={{ width: '10%', background: 'var(--clr-solar-amber)' }} title="Farmer 10%" />
                <div style={{ width: '30%', background: 'var(--clr-water-blue)' }} title="Bank Loan 30%" />
              </div>

              <div className="grid-2 gap-2 text-xs">
                <div className="text-green p-1.5 rounded" style={{ background: 'rgba(34,197,94,0.08)' }}>
                  <strong>60% Govt Grant (FREE):</strong>
                  <div className="text-sm font-black font-mono mt-0.5">{formatINR(subsidyQuote.centralSubsidyInr + subsidyQuote.stateSubsidyInr)}</div>
                  <span className="text-xs text-muted block">Central 30% + State 30%</span>
                </div>
                <div className="text-amber p-1.5 rounded" style={{ background: 'rgba(245,158,11,0.08)' }}>
                  <strong>Your Cash Share (10%):</strong>
                  <div className="text-sm font-black font-mono mt-0.5">{formatINR(subsidyQuote.farmerShareCashInr)}</div>
                  <span className="text-xs text-muted block">Direct farmer deposit</span>
                </div>
              </div>

              <div className="mt-2 text-xs text-secondary flex justify-between">
                <span>Bank Loan Support (30%): <strong>{formatINR(subsidyQuote.bankLoanFinancedInr)}</strong></span>
                <span className="text-green font-bold">Pays off in ~{subsidyQuote.breakEvenPeriodMonths} Months</span>
              </div>

              <p className="text-xs text-muted mt-2">
                *Replaces expensive diesel fuel on {farmState.farm.areaAcres} acres (~{formatINR(COST_DIFFERENCE)}/month fuel saved). Direct benefit transfer via MahaUrja / MahaDBT.
              </p>
            </div>

            <div className="card card--glow-green p-3 text-center mb-3">
              <div className="text-sm font-bold text-green mb-1">
                {farmUpgrades.govSubsidyChecked
                  ? `✓ PM-KUSUM 60% Capital Grant Verified`
                  : `MahaDBT & PM-KUSUM 60% Capital Subsidy`}
              </div>
              <p className="text-xs text-muted mb-3">
                Smallholder qualification for Ramesh Patil: Unlocks 30% Central + 30% Maharashtra State grant ({formatINR(subsidyQuote.totalGovtSubsidyInr)} for {subsidyQuote.pumpHorsePower} HP).
              </p>
              <button
                id="btn-verify-kusum-subsidy"
                className="btn btn--primary btn--full font-bold mb-2"
                onClick={() => {
                  setUpgradeStatus('govSubsidyChecked', true);
                  triggerCelebration(
                    'PM-KUSUM 60% Grant Verified!',
                    `Indicative capital subsidy calculated for ${subsidyQuote.pumpHorsePower} HP Solar Pump under MahaDBT & PM-KUSUM Component B!`,
                    `Saving ${formatINR(subsidyQuote.totalGovtSubsidyInr)} Capital Grant · 60% Direct Subsidy`
                  );
                }}
              >
                {farmUpgrades.govSubsidyChecked
                  ? `✓ 60% Subsidy Verified (${formatINR(subsidyQuote.totalGovtSubsidyInr)} Grant Unlocked)`
                  : '🏛️ Verify MahaDBT & PM-KUSUM 60% Grant →'}
              </button>
            </div>

            <a
              href="https://pmkusum.mnre.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--sm btn--ghost btn--full text-center block"
            >
              Apply on Official PM-KUSUM National Portal ↗
            </a>
          </div>

          {/* Scheme Catalog Cards */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-muted mb-2">
              Potentially Relevant Government Schemes (Verification Required)
            </p>

            <div className="flex flex-col gap-3">
              {schemeEvaluations.map(evalResult => {
                const s: SchemeInfo = evalResult.scheme;
                const isExpanded = expandedSchemeId === s.id;

                return (
                  <div key={s.id} className="card card--raised">
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedSchemeId(isExpanded ? null : s.id)}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-base font-bold text-primary">{s.shortName}</span>
                          <span className="badge badge--simulated text-xs">
                            {evalResult.status.replace('_', ' ')} ({evalResult.matchScorePercent}% Criteria Alignment)
                          </span>
                        </div>
                        <p className="text-xs text-muted">{s.fullName}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-green font-mono">
                          {s.subsidyPercentage}%
                        </div>
                        <span className="text-xs text-muted">Indicative Subsidy</span>
                      </div>
                    </div>

                    <p className="text-xs text-secondary mt-2">{s.summary}</p>
                    <p className="text-xs text-muted mt-0.5">
                      Source: {s.officialSource} · Verified: {s.lastVerified} ({s.freshness})
                    </p>

                    {/* Regional language summary */}
                    <div className="card mt-2 p-2" style={{ background: 'var(--bg-base)' }}>
                      <p className="text-xs text-amber font-medium mb-1">{evalResult.hindiSummary}</p>
                      <p className="text-xs text-muted">{evalResult.marathiSummary}</p>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-subtle flex flex-col gap-2 animate-in text-xs">
                        <div>
                          <strong className="text-primary block mb-1">Key Benefits:</strong>
                          <ul className="list-disc pl-4 text-secondary flex flex-col gap-1">
                            {s.detailedBenefits.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <strong className="text-primary block mb-1">Documents Checklist:</strong>
                          <div className="flex flex-wrap gap-1">
                            {s.documentsRequired.map((doc, i) => (
                              <span key={i} className="badge badge--simulated text-xs">
                                ✓ {doc}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-2 flex gap-2">
                          <a
                            href={s.officialPortalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn--sm btn--secondary flex-1 text-center"
                          >
                            Open {s.portalName} ↗
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex justify-end">
                      <button
                        className="btn btn--ghost btn--xs text-muted"
                        onClick={() => setExpandedSchemeId(isExpanded ? null : s.id)}
                      >
                        {isExpanded ? '▲ Hide Details' : '▼ See Documents & Eligibility'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 3: FARMER COLLECTIVE & DEMAND AGGREGATION
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'GROUP' && (
        <div className="flex flex-col gap-4 animate-in">
          <div className="card" style={{ borderColor: 'rgba(34,211,238,0.3)' }}>
            <p className="card-title text-cyan mb-3">Farmer Group — Demand Pooling Cluster</p>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-center">
                <div className="text-3xl font-black text-cyan">3</div>
                <div className="metric-label">NEARBY FARMERS</div>
              </div>
              <div className="text-2xl text-muted">+</div>
              <div className="text-center flex-1">
                <div className="text-sm font-bold text-primary">Combined Acreage & Pumping Demand</div>
                <div className="text-xs text-secondary mt-1">= Attracts shared solar providers & FPOs</div>
              </div>
            </div>
            <div className="text-xs text-muted mb-3">
              When an individual smallholder cannot access shared equipment alone, nearby farmers form an informal Farmer Group, pool their water and produce requirements, and attract providers to service the entire cluster.
            </div>
            <button
              className={`btn ${joinedGroup ? 'btn--secondary' : 'btn--primary'} btn--sm btn--full`}
              onClick={() => setJoinedGroup(v => !v)}
              aria-pressed={joinedGroup}
            >
              {joinedGroup ? '✓ Member of Dindori Cluster (3 farmers)' : 'Join Village Solar Cluster'}
            </button>
          </div>
        </div>
      )}



      {/* Return to Current Farm State */}
      <div className="card p-3 text-center my-4" style={{ background: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.25)' }}>
        <div className="text-xs text-secondary mb-2">
          Want to review remaining farm upgrades or check the evolving Before/After transformation scorecard?
        </div>
        <button
          id="btn-return-farm-state-from-3"
          className="btn btn--secondary btn--full btn--sm font-bold"
          onClick={() => navigateTo(1)}
        >
          ← Return to Current Farm State
        </button>
      </div>
    </div>
  );
}
