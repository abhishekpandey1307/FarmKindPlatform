// =============================================================================
// FARMKIND — MULTILINGUAL LANGUAGE SELECTOR MODAL & TOPBAR BUTTON
// Enables smallholder farmers to select Hindi, Marathi, English, Kannada, Telugu
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../app/AppContext';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n/translations';
import { speakNaturalIndianVoice } from '../../utils/indianVoiceSynth';

interface LanguageSelectorProps {
  variant?: 'topbar' | 'full' | 'inline';
}

export function LanguageSelector({ variant = 'topbar' }: LanguageSelectorProps) {
  const { state, setLanguage } = useApp();
  const currentLang = state.language ?? 'hi';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeOption = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  // Close on escape or outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setIsOpen(false);

    // Speak brief natural audio confirmation
    const audioConfirmMap: Record<SupportedLanguage, string> = {
      hi: 'नमस्ते रमेश जी! भाषा अब हिंदी में सेट है।',
      mr: 'राम-राम रमेश पाटील! भाषा आता मराठी मध्ये सेट केली आहे.',
      en: 'Welcome! Platform language is now set to English.',
      kn: 'ನಮಸ್ಕಾರ! ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.',
      te: 'నమస్కారం! భాష తెలుగులోకి మార్చబడింది.',
    };

    if ('speechSynthesis' in window) {
      speakNaturalIndianVoice(audioConfirmMap[lang], lang);
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex gap-1.5 flex-wrap">
        {SUPPORTED_LANGUAGES.map(l => {
          const isSelected = l.code === currentLang;
          return (
            <button
              key={l.code}
              type="button"
              className={`btn btn--xs ${isSelected ? 'btn--primary font-bold' : 'btn--ghost'}`}
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: 12,
                border: isSelected ? '1px solid var(--clr-farm-green)' : '1px solid var(--border-subtle)',
              }}
              onClick={() => handleSelectLanguage(l.code)}
              aria-pressed={isSelected}
            >
              <span>{l.flag}</span>
              <span>{l.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* ── Top Bar Trigger Button ── */}
      <button
        id="btn-language-selector"
        type="button"
        className="btn btn--xs flex items-center gap-1.5 transition-all"
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="अपनी भाषा चुनें / Select Language / भाषा निवडा"
        style={{
          border: '1.5px solid rgba(34, 211, 238, 0.45)',
          background: 'rgba(34, 211, 238, 0.08)',
          color: 'var(--clr-ai-cyan)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 9px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 13 }}>{activeOption.flag}</span>
        <span className="font-semibold hidden sm:inline">{activeOption.nativeName}</span>
        <span className="font-semibold inline sm:hidden">{activeOption.code.toUpperCase()}</span>
        <span style={{ fontSize: 9, opacity: 0.8 }}>▼</span>
      </button>

      {/* ── High-Contrast, Farmer-Friendly Language Modal / Dropdown ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Language selection modal"
          className="animate-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 9999,
            minWidth: 240,
            maxWidth: 'calc(100vw - 20px)',
            background: 'rgba(10, 22, 40, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(34, 211, 238, 0.35)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65), 0 0 20px rgba(34, 211, 238, 0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: '12px',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-subtle">
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 16 }}>🌐</span>
              <span className="text-xs font-bold text-cyan uppercase tracking-wider">
                अपनी भाषा चुनें
              </span>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--xs"
              onClick={() => setIsOpen(false)}
              aria-label="Close language selector"
              style={{ padding: '2px 6px', fontSize: 12, color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>

          <p className="text-xxs text-secondary mb-2" style={{ fontSize: 10 }}>
            Choose your native language for all screens & voice guidance:
          </p>

          {/* Language Options List */}
          <div className="flex flex-col gap-1.5">
            {SUPPORTED_LANGUAGES.map(l => {
              const isSelected = l.code === currentLang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelectLanguage(l.code)}
                  className="flex items-center justify-between w-full p-2.5 rounded-lg text-left transition-all"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 211, 238, 0.12) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1.5px solid var(--clr-farm-green)' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ fontSize: 20 }}>{l.flag}</span>
                    <div>
                      <span className="text-sm font-bold text-primary block leading-tight">
                        {l.nativeName}
                      </span>
                      <span className="text-xxs text-muted block" style={{ fontSize: 10 }}>
                        {l.name} · {l.region}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span
                      className="badge badge--live text-xs font-bold"
                      style={{ background: 'var(--clr-farm-green)', color: '#000', padding: '2px 6px' }}
                    >
                      ✓ सक्रिय
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Notice */}
          <div className="mt-2.5 pt-2 border-t border-subtle text-center">
            <span className="text-xxs text-muted" style={{ fontSize: 9 }}>
              💡 Voice AI & Honor Certificate sync automatically
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
