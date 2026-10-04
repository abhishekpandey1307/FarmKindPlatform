// =============================================================================
// FARMKIND — MOTIVATION & RETURN TO CURRENT FARM STATE BAR
// Sticky top bar showing progress on the 5 recommendations with one-tap return
// =============================================================================

import { useApp } from '../../app/AppContext';
import { calcHarvestEconomics, formatINR } from '../../engine/calculation';

export function MotivationReturnBar() {
  const { state, returnToFarmState } = useApp();
  const { activeScreen, cameFromRecommendations, farmAnalyzed, farmUpgrades, solarBookings, farmState } = state;

  // Display if user is on any other screen and farm has been analyzed or navigated from recommendations
  if (activeScreen === 1 || (!cameFromRecommendations && !farmAnalyzed)) return null;

  // Compute active upgrades count
  const hasSolar = farmUpgrades.sharedSolarDrip || farmState.farm.energy.primarySource === 'SHARED_SOLAR' || solarBookings.length > 0;
  const hasBooking = farmUpgrades.sharedSolarBooking || solarBookings.length > 0;
  const hasSensor = farmUpgrades.inSituSensor || farmState.farm.soil.sensorStatus === 'LIVE';
  const hasCold = farmUpgrades.solarColdStorage;
  const hasSubsidy = farmUpgrades.govSubsidyChecked;

  const count = [hasSolar, hasBooking, hasSensor, hasCold, hasSubsidy].filter(Boolean).length;
  const remaining = 5 - count;

  const harvestLossAvoided = calcHarvestEconomics(1200, 31.25, 40, 72, 32).spoilageLoss;

  // Determine next pending action for motivation
  let nextRecommendation = 'Switch to Shared Solar Drip';
  if (hasSolar && !hasBooking) nextRecommendation = 'Book Community Solar Slot';
  else if (hasSolar && hasBooking && !hasSensor) nextRecommendation = 'Connect Smart In-Situ Soil Sensor';
  else if (hasSensor && !hasCold) nextRecommendation = `Reserve Solar Cold Storage (Protect ${formatINR(harvestLossAvoided)} crop)`;
  else if (hasCold && !hasSubsidy) nextRecommendation = 'Claim PM-KUSUM 60% Govt Subsidy';
  else if (count === 5) nextRecommendation = 'All 5 Optimizations Active! Full Savings Unlocked!';

  return (
    <div className="motivation-bar animate-in" role="navigation" aria-label="Return to Current Farm State">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          className="btn btn--xs btn--primary font-bold flex items-center gap-1.5"
          onClick={returnToFarmState}
          title="Return to Current Farm State"
        >
          <span>←</span>
          <span>Current Farm State</span>
        </button>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="text-right">
            <div className="text-xs font-bold text-green flex items-center justify-end gap-1">
              <span className="status-dot status-dot--live animate-pulse" />
              <span>{count}/5 Upgrades Active {remaining > 0 ? `(${remaining} pending)` : '✓'}</span>
            </div>
            <span className="text-xs text-muted hidden sm:inline-block">
              {count < 5 ? `Pending: ${nextRecommendation}` : '🎉 100% Farm Optimization Complete!'}
            </span>
          </div>

          <div
            className="w-16 h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}
            title={`${count * 20}% completed`}
          >
            <div
              style={{
                width: `${count * 20}%`,
                height: '100%',
                background: count === 5 ? 'var(--clr-farm-green)' : 'var(--clr-ai-cyan)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
