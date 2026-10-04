// =============================================================================
// FARMKIND — SHARED COMPONENTS
// Reusable building blocks used across all 7 screens
// =============================================================================

import type { SourceType, DecisionResult, DataPoint } from '../../domain/types';
import { speakNaturalIndianVoice } from '../../utils/indianVoiceSynth';
import { useApp } from '../../app/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
export { LanguageSelector } from './LanguageSelector';
export { ScreenHowItWorks } from './ScreenHowItWorks';
export { QuickStartModal } from './QuickStartModal';

// ─── PROVENANCE BADGE ─────────────────────────────────────────────────────────

interface ProvenanceBadgeProps {
  source: SourceType;
  label?: string;
}

export function ProvenanceBadge({ source, label }: ProvenanceBadgeProps) {
  const map: Record<SourceType, { cls: string; text: string }> = {
    REAL:        { cls: 'badge--live',       text: 'Real' },
    REFERENCE:   { cls: 'badge--reference',  text: 'Reference' },
    CALCULATED:  { cls: 'badge--calculated', text: 'Calculated' },
    ASSUMED:     { cls: 'badge--assumed',    text: 'Assumed' },
    SIMULATED:   { cls: 'badge--simulated',  text: 'Simulated' },
    AI_DERIVED:  { cls: 'badge--ai-derived', text: 'Smart Engine' },
  };
  const { cls, text } = map[source];
  return (
    <span className={`badge ${cls}`}>
      {label ?? text}
    </span>
  );
}

// ─── DATA POINT DISPLAY ───────────────────────────────────────────────────────

interface DataPointDisplayProps<T> {
  dp: DataPoint<T>;
  format?: (v: T) => string;
  valueClass?: string;
}

export function DataPointDisplay<T>({ dp, format, valueClass }: DataPointDisplayProps<T>) {
  const val = dp.value !== null && dp.value !== undefined
    ? (format ? format(dp.value) : String(dp.value))
    : '—';
  return (
    <div className="flex flex-col gap-1">
      <span className={valueClass ?? 'text-xl font-bold text-primary'}>{val}</span>
      {dp.unit && <span className="text-xs text-muted">{dp.unit}</span>}
      <ProvenanceBadge source={dp.sourceType} />
    </div>
  );
}

// ─── SENSOR STATUS DISPLAY ────────────────────────────────────────────────────

type SensorStatus = 'NOT_CONNECTED' | 'CONNECTING' | 'CALIBRATING' | 'LIVE' | 'STALE' | 'ERROR';

interface SensorStatusProps {
  status: SensorStatus;
}

export function SensorStatusBadge({ status }: SensorStatusProps) {
  const map: Record<SensorStatus, { dot: string; text: string; cls: string }> = {
    NOT_CONNECTED: { dot: 'status-dot--off',        text: 'Not Connected', cls: 'badge--stale' },
    CONNECTING:    { dot: 'status-dot--connecting', text: 'Connecting…',   cls: 'badge--warning' },
    CALIBRATING:   { dot: 'status-dot--connecting', text: 'Calibrating…',  cls: 'badge--warning' },
    LIVE:          { dot: 'status-dot--live',       text: '● Sensor Live', cls: 'badge--live' },
    STALE:         { dot: 'status-dot--off',        text: 'Data Stale',    cls: 'badge--stale' },
    ERROR:         { dot: 'status-dot--error',      text: 'Sensor Error',  cls: 'badge--critical' },
  };
  const { dot, text, cls } = map[status];
  return (
    <span className={`badge ${cls} flex items-center gap-1`}>
      <span className={`status-dot ${dot}`} aria-hidden="true" />
      {text}
    </span>
  );
}

// ─── DECISION TRACE ───────────────────────────────────────────────────────────

interface DecisionTraceProps {
  decision: DecisionResult;
}

export function DecisionTrace({ decision }: DecisionTraceProps) {
  const stepLabels = ['Signal', 'Context', 'Analysis', 'Decision'];
  const stepKey = ['observations', 'context', 'constraints', 'selectedAction'];
  void stepKey;

  return (
    <div className="card mt-4">
      <p className="card-title mb-3">Decision Trace</p>
      <div className="flex flex-col gap-2 mb-4">
        {stepLabels.map((label) => (
          <div key={label} className="flow-step flow-step--done">
            <div className="flow-check flow-check--done">✓</div>
            <span className="text-sm text-secondary font-medium">{label}</span>
            <span className="text-xs text-muted ml-auto">Checked</span>
          </div>
        ))}
      </div>

      <p className="card-title mb-2">Observations</p>
      {decision.observations.map((obs, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-secondary mt-1">
          <span className="text-green font-bold">✓</span> {obs}
        </div>
      ))}

      {decision.rejectedActions.length > 0 && (
        <>
          <div className="divider" />
          <p className="card-title mb-2">Options Considered</p>
          {decision.candidateActions.map(action => {
            const rejected = decision.rejectedActions.find(r => r.action === action);
            const isSelected = action === decision.selectedAction;
            return (
              <div key={action} className="flex items-center justify-between text-sm py-1">
                <span className={isSelected ? 'text-green font-bold' : 'text-muted'}>
                  {isSelected ? '▶ ' : '  '}{action}
                </span>
                <span className="text-xs text-muted">
                  {isSelected ? 'Selected' : (rejected?.reason ?? 'Considered')}
                </span>
              </div>
            );
          })}
        </>
      )}

      <div className="divider" />
      <p className="text-xs text-muted">{decision.explanation}</p>
      {decision.hindiReason && (
        <p className="text-xs text-secondary mt-2">{decision.hindiReason}</p>
      )}
    </div>
  );
}

// ─── IMPACT METRIC ────────────────────────────────────────────────────────────

interface ImpactMetricProps {
  icon: string;
  value: string;
  label: string;
  source: SourceType;
  colorClass?: string;
}

export function ImpactMetric({ icon, value, label, source, colorClass }: ImpactMetricProps) {
  return (
    <div className="impact-card">
      <div className="text-2xl mb-2" aria-hidden="true">{icon}</div>
      <div className={`metric-number text-2xl ${colorClass ?? ''}`}>{value}</div>
      <div className="metric-label mt-1">{label}</div>
      <div className="mt-2">
        <ProvenanceBadge source={source} />
      </div>
    </div>
  );
}

// ─── MOISTURE GAUGE ───────────────────────────────────────────────────────────

interface MoistureGaugeProps {
  value: number;
  target?: number;
  critical?: number;
}

export function MoistureGauge({ value, target = 35, critical = 30 }: MoistureGaugeProps) {
  const pct = Math.min(100, Math.max(0, value));
  const color = value >= target ? '#22c55e' : value >= critical ? '#38bdf8' : '#f97316';
  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>0%</span>
        <span className="text-primary font-bold">{value}%</span>
        <span>100%</span>
      </div>
      <div className="moisture-gauge">
        <div
          className="moisture-gauge__fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Soil moisture ${value}%`}
        />
      </div>
      <div style={{ position: 'relative', height: 18, marginTop: 4, width: '100%', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', left: `${critical}%`, transform: 'translateX(-50%)', color: '#f97316', fontSize: 10, whiteSpace: 'nowrap' }}>▲ Critical</span>
        <span style={{ position: 'absolute', left: `${target}%`, transform: 'translateX(-50%)', color: '#22c55e', fontSize: 10, whiteSpace: 'nowrap' }}>Target ▲</span>
      </div>
    </div>
  );
}

// ─── ACTION BUTTON ────────────────────────────────────────────────────────────

interface ActionButtonProps {
  label: string;
  sublabel?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'blue' | 'amber' | 'danger' | 'ghost';
  disabled?: boolean;
  fullWidth?: boolean;
  id?: string;
  icon?: React.ReactNode;
}

export function ActionButton({
  label, sublabel, onClick, variant = 'primary', disabled, fullWidth, id, icon
}: ActionButtonProps) {
  return (
    <button
      id={id}
      className={`btn btn--${variant} ${fullWidth ? 'btn--full' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={sublabel ? `${label}: ${sublabel}` : label}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>
        {label}
        {sublabel && <span className="block text-xs font-normal opacity-75">{sublabel}</span>}
      </span>
    </button>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  screenId?: number;
}

export function SectionHeader({ eyebrow, title, subtitle, screenId }: SectionHeaderProps) {
  const { state } = useApp();
  const lang = state.language ?? 'hi';

  // Find matching screen config if screenId passed or by matching title
  let matchedScreenId = screenId;
  if (!matchedScreenId) {
    for (let id = 0; id <= 7; id++) {
      const scr = TRANSLATIONS.screens[id as keyof typeof TRANSLATIONS.screens];
      if (
        scr &&
        (scr.title.en === title ||
         title.includes(scr.name.en) ||
         scr.name.en === title ||
         title.toLowerCase().includes(scr.name.en.toLowerCase().slice(0, 8)))
      ) {
        matchedScreenId = id;
        break;
      }
    }
  }

  const screenConfig = matchedScreenId ? TRANSLATIONS.screens[matchedScreenId as keyof typeof TRANSLATIONS.screens] : null;

  const displayEyebrow = (lang !== 'en' && screenConfig?.eyebrow[lang]) ? screenConfig.eyebrow[lang] : eyebrow;
  const displayTitle = (lang !== 'en' && screenConfig?.title[lang]) ? screenConfig.title[lang] : title;
  const displaySubtitle = (lang !== 'en' && screenConfig?.subtitle[lang]) ? screenConfig.subtitle[lang] : subtitle;

  return (
    <div className="section-header">
      {displayEyebrow && <p className="section-header__eyebrow">{displayEyebrow}</p>}
      <h1 className="section-header__title">{displayTitle}</h1>
      {displaySubtitle && <p className="section-header__subtitle">{displaySubtitle}</p>}
    </div>
  );
}

// ─── FARM STATE CARD ──────────────────────────────────────────────────────────

interface FarmStateCardProps {
  label: string;
  value: string;
  icon: string;
  colorClass?: string;
  badge?: React.ReactNode;
  source?: SourceType;
}

export function FarmStateCard({ label, value, icon, colorClass, badge, source }: FarmStateCardProps) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <span className="card-title">{label}</span>
      <span className={`text-xl font-bold ${colorClass ?? 'text-primary'}`}>{value}</span>
      <div className="flex items-center gap-1 flex-wrap mt-1">
        {badge}
        {source && <ProvenanceBadge source={source} />}
      </div>
    </div>
  );
}

// ─── SHIELD CARD ──────────────────────────────────────────────────────────────

interface ShieldCardProps {
  title: string;
  icon: string;
  status: string;
  severity: 'nominal' | 'warning' | 'critical';
  onClick?: () => void;
  children?: React.ReactNode;
}

export function ShieldCard({ title, icon, status, severity, onClick, children }: ShieldCardProps) {
  const glowMap = { nominal: 'card--glow-green', warning: 'card--glow-amber', critical: 'card--glow-red' };
  const colorMap = { nominal: 'text-green', warning: 'text-amber', critical: 'text-red' };
  return (
    <button
      className={`card ${glowMap[severity]} w-full text-left cursor-pointer`}
      onClick={onClick}
      aria-label={`${title}: ${status}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{icon}</span>
          <span className="text-sm font-bold tracking-wider uppercase text-primary">{title}</span>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${colorMap[severity]}`}>{status}</span>
      </div>
      {children}
    </button>
  );
}

// ─── CONFIDENCE CHIP ──────────────────────────────────────────────────────────

interface ConfidenceChipProps {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function ConfidenceChip({ level }: ConfidenceChipProps) {
  return (
    <span className={`decision-confidence decision-confidence--${level.toLowerCase()}`}>
      {level} CONFIDENCE
    </span>
  );
}

// ─── WEATHER SIGNAL ───────────────────────────────────────────────────────────

interface WeatherSignalProps {
  temperature: number;
  humidity: number;
  rainProbability: number;
  heatRisk: string;
}

export function WeatherSignal({ temperature, humidity, rainProbability, heatRisk }: WeatherSignalProps) {
  return (
    <div className="card flex gap-4 flex-wrap">
      <div className="metric-block flex-1">
        <div className="metric-number text-3xl text-amber">{temperature}°</div>
        <div className="metric-label">TEMP</div>
      </div>
      <div className="metric-block flex-1">
        <div className="metric-number text-3xl text-blue">{humidity}%</div>
        <div className="metric-label">HUMIDITY</div>
      </div>
      <div className="metric-block flex-1">
        <div className="metric-number text-3xl text-blue">{rainProbability}%</div>
        <div className="metric-label">RAIN PROB.</div>
      </div>
      {heatRisk !== 'NONE' && (
        <div className="metric-block flex-1">
          <div className={`risk-badge risk-badge--${heatRisk.toLowerCase()}`}>
            🌡️ {heatRisk} HEAT
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LISTEN BUTTON ────────────────────────────────────────────────────────────

interface ListenButtonProps {
  text: string;
}

export function ListenButton({ text }: ListenButtonProps) {
  const speak = () => {
    speakNaturalIndianVoice(text, 'hi');
  };
  return (
    <button
      className="btn btn--ghost btn--sm"
      onClick={speak}
      aria-label={`Listen: ${text}`}
      title="Listen to decision"
    >
      🔊 LISTEN
    </button>
  );
}

// ─── INLINE ALERT ─────────────────────────────────────────────────────────────

interface InlineAlertProps {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  action?: React.ReactNode;
}

export function InlineAlert({ type, message, action }: InlineAlertProps) {
  const map = {
    info:    { bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.3)',  icon: 'ℹ️' },
    warning: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)', icon: '⚠️' },
    error:   { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',  icon: '🚨' },
    success: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)',  icon: '✅' },
  };
  const { bg, border, icon } = map[type];
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 16px' }}
      className="flex items-center gap-3" role="alert">
      <span aria-hidden="true">{icon}</span>
      <span className="text-sm text-primary flex-1">{message}</span>
      {action}
    </div>
  );
}
