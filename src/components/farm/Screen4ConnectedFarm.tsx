// =============================================================================
// SCREEN 4 — MANDI CONNECT & MARKET INTELLIGENCE
// Dedicated market intelligence page:
// 1. Live APMC wholesale tomato prices across Nashik & regional markets
// 2. Net realization calculator (deducting transport freight)
// 3. Direct FPO & institutional buyer contracts (zero middleman commission)
// 4. AI Market Timing Arbitrage (Sell today vs Cold store for peak price)
// =============================================================================

import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { SectionHeader, ProvenanceBadge } from '../shared';

export function Screen4ConnectedFarm() {
  const { state, lockMarketContract, triggerLiveSync, toggleLiveInspector, navigateTo } = useApp();
  const { liveMandis, directContracts } = state;
  const [contractSuccessMsg, setContractSuccessMsg] = useState<string | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<'sahyadri' | 'bigbasket' | 'reliance'>('sahyadri');

  const handleDirectContractLock = (buyerId: string, buyerName: string, pricePerKg: number) => {
    const c = lockMarketContract(buyerId, 1200);
    setContractSuccessMsg(`✓ Direct Contract #${c.contractId.slice(-6)} Locked with ${buyerName}! 1,200 kg @ ₹${pricePerKg}/kg (Total: ₹${c.totalPayoutInr.toLocaleString()}). Farmgate pickup confirmed!`);
    setTimeout(() => setContractSuccessMsg(null), 6000);
  };

  const buyers = [
    {
      id: 'buyer-sahyadri',
      key: 'sahyadri' as const,
      name: 'Sahyadri Farms FPO (Nashik)',
      price: 35.5,
      delivery: 'Farmgate Pickup (Zero Freight)',
      payment: 'Direct Bank Transfer in 48 hrs',
      rating: '4.9 ★ (1,240 Farmers)',
      badge: 'RECOMMENDED FPO',
    },
    {
      id: 'buyer-bigbasket',
      key: 'bigbasket' as const,
      name: 'BigBasket Direct Sourcing',
      price: 34.0,
      delivery: 'Crates collected at village hub',
      payment: 'T+2 Days Bank Settlement',
      rating: '4.7 ★ (850 Farmers)',
      badge: 'RELIABLE BUYER',
    },
    {
      id: 'buyer-reliance',
      key: 'reliance' as const,
      name: 'Reliance Retail Agri-Hub',
      price: 36.0,
      delivery: 'Nashik DC delivery (Grade A)',
      payment: 'Weekly Payment Cycle',
      rating: '4.6 ★ (620 Farmers)',
      badge: 'TOP PRICE',
    },
  ];

  return (
    <div className="screen-scroll">
      {/* ── Screen Header ── */}
      <SectionHeader
        eyebrow="Market Intelligence · Nashik District"
        title="Mandi Connect & Best Market Prices"
        subtitle="Compare wholesale mandi rates, calculate net realization after freight, and lock direct FPO contracts with zero middleman commissions."
      />

      {/* ── CARD 1: LIVE APMC MANDI PRICE BOARD ── */}
      <div className="card card--glow-cyan mb-4 animate-in p-4" style={{ borderRadius: 'var(--radius-xl)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="status-dot status-dot--live animate-pulse" />
            <h2 className="card-title text-cyan text-sm font-bold">Today's APMC Mandi Wholesale Rates</h2>
            <ProvenanceBadge source="REAL" label="Live APMC Telemetry" />
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn--xs btn--ghost" onClick={() => triggerLiveSync()}>
              🔄 Sync
            </button>
            <button className="btn btn--xs btn--secondary" onClick={toggleLiveInspector}>
              📊 Full Feed ↗
            </button>
          </div>
        </div>

        <p className="text-xs text-secondary mb-3">
          Wholesale tomato rates today across nearby trading floors. "Net" shows actual cash in hand after deducting truck freight:
        </p>

        <div className="flex flex-col gap-2 mb-2">
          {liveMandis.map(m => (
            <div
              key={m.mandiId}
              className="card p-3 flex items-center justify-between text-xs"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-primary">{m.mandiName}</span>
                  <span className="text-xs text-muted">({m.distanceKm} km away)</span>
                  {m.mandiName.includes('Pimpalgaon') && (
                    <span className="badge badge--live text-xs">BEST NEARBY</span>
                  )}
                </div>
                <div className="text-muted text-xs mt-1">
                  Truck Freight: ₹{m.transportFreightPerKg.toFixed(2)}/kg · Demand: <strong className="text-secondary">{m.buyerDemand}</strong>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-lg font-black text-green font-mono">
                  ₹{m.modalPricePerKg.toFixed(1)} <span className="text-xs font-normal text-muted">/ kg</span>
                </div>
                <span className="text-xs text-secondary font-semibold block">
                  Net: <strong className="text-primary font-mono">₹{m.netRealizationPerKg.toFixed(1)}</strong>/kg
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARD 2: DIRECT FPO & INSTITUTIONAL CONTRACTS (ZERO BROKER FEE) ── */}
      <div className="card card--glow-green mb-4 animate-in p-4" style={{ borderRadius: 'var(--radius-xl)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤝</span>
            <div>
              <h2 className="card-title text-green text-sm font-bold">Direct Institutional Buyers (No Middlemen)</h2>
              <span className="text-xs text-muted block mt-0.5">Saves 8%–10% traditional mandi commission fees</span>
            </div>
          </div>
          <span className="badge badge--live text-xs font-mono font-bold">
            {directContracts.length > 0 ? `${directContracts.length} Active` : 'Available'}
          </span>
        </div>

        {contractSuccessMsg && (
          <div className="card p-3 mb-3 text-xs text-green font-bold animate-in" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid var(--clr-farm-green)' }}>
            {contractSuccessMsg}
          </div>
        )}

        <div className="flex flex-col gap-2.5 my-3">
          {buyers.map(b => (
            <div
              key={b.id}
              className="card p-3"
              style={{
                background: selectedBuyer === b.key ? 'rgba(34,197,94,0.06)' : 'var(--bg-base)',
                border: selectedBuyer === b.key ? '1.5px solid var(--clr-farm-green)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary">{b.name}</span>
                    <span className="badge badge--live text-xs">{b.badge}</span>
                  </div>
                  <span className="text-xs text-muted block mt-0.5">{b.delivery} · {b.rating}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-lg font-black text-green font-mono">₹{b.price.toFixed(1)}</span>
                  <span className="text-xs text-muted block">/ kg Fixed</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-subtle mt-2 text-xs">
                <span className="text-secondary">{b.payment}</span>
                <button
                  className="btn btn--sm btn--primary font-bold"
                  onClick={() => {
                    setSelectedBuyer(b.key);
                    handleDirectContractLock(b.id, b.name, b.price);
                  }}
                >
                  Lock 1,200 kg Batch →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Active Direct Contracts list */}
        {directContracts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-subtle">
            <span className="text-xs font-bold text-cyan block mb-2">Your Active Direct Contracts:</span>
            <div className="flex flex-col gap-2">
              {directContracts.map(c => (
                <div key={c.contractId} className="card p-2.5 text-xs" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex justify-between font-bold text-primary">
                    <span>{c.buyerName}</span>
                    <span className="text-green font-mono font-black text-sm">₹{c.totalPayoutInr.toLocaleString()}</span>
                  </div>
                  <div className="text-secondary flex justify-between mt-1">
                    <span>{c.quantityKg} kg @ ₹{c.lockedPricePerKg}/kg</span>
                    <span className="badge badge--live text-xs">✓ FARM-GATE CONFIRMED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CARD 3: SMART ENGINE MARKET TIMING & COLD STORAGE ARBITRAGE ── */}
      <div className="card card--glow-amber mb-4 animate-in p-4" style={{ borderRadius: 'var(--radius-xl)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">💡</span>
          <div>
            <h2 className="card-title text-amber text-sm font-bold">FarmKind Smart Engine Price Arbitrage Advisory</h2>
            <span className="text-xs text-muted block mt-0.5">Maximize payout for your 1,200 kg tomato harvest</span>
          </div>
        </div>

        <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <p className="text-xs text-secondary leading-relaxed">
            Market prices are trending upward due to rain in southern Maharashtra.
            Storing your 1,200 kg tomatoes in the <strong>Pimpalgaon Solar Cold Room for 3 days</strong> (cost: ₹180) allows you to sell when modal price reaches ₹39.00/kg — generating <strong>+₹7,620 extra net profit</strong>!
          </p>
        </div>

        <div className="grid-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
            <span className="text-muted block font-semibold mb-0.5">OPTION A: SELL TODAY</span>
            <span className="text-sm font-black text-secondary font-mono">₹39,000</span>
            <span className="text-xs text-muted block mt-0.5">Pimpalgaon APMC @ ₹32.5/kg net</span>
          </div>
          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <span className="text-green block font-bold mb-0.5">OPTION B: COLD STORE 3 DAYS</span>
            <span className="text-sm font-black text-green font-mono">₹46,620 Net</span>
            <span className="text-xs text-green block mt-0.5">Gain +₹7,620 extra cash profit</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-subtle">
          <button
            className="btn btn--amber btn--full btn--sm font-bold"
            onClick={() => navigateTo(3)}
          >
            ❄️ Reserve Solar Cold Room Slot in Marketplace (Screen 3) →
          </button>
        </div>
      </div>
    </div>
  );
}
