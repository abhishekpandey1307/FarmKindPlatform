import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from '../i18n/translations';
import { stopIndianVoice } from '../utils/indianVoiceSynth';

describe('How It Works & Quick Start Guide System', () => {
  it('1. Provides complete Screen 0 translations in Hindi, Marathi, and English', () => {
    const screen0 = TRANSLATIONS.screens[0];
    expect(screen0).toBeDefined();

    // English
    expect(screen0.name.en).toBe('How FarmKind Works');
    expect(screen0.title.en).toContain('How FarmKind Works');
    expect(screen0.subtitle.en).toContain('farming journey');

    // Hindi
    expect(screen0.name.hi).toContain('कैसे काम करता है');
    expect(screen0.title.hi).toContain('फार्मकाइंड कैसे काम करता है');
    expect(screen0.subtitle.hi).toContain('नुकसान');

    // Marathi
    expect(screen0.name.mr).toContain('कसे कार्य करते');
    expect(screen0.title.mr).toContain('फार्मकाइंड कसे कार्य करते');
    expect(screen0.subtitle.mr).toContain('गळती');
  });

  it('2. Provides 3-step summarized onboarding modal content for initial load', () => {
    const modal = TRANSLATIONS.howItWorksGuide.summaryModal;
    expect(modal).toBeDefined();

    // Check titles and descriptions across languages
    expect(modal.title.hi).toBe('फार्मकाइंड में आपका स्वागत है');
    expect(modal.title.mr).toBe('फार्मकाइंडमध्ये आपले स्वागत आहे');
    expect(modal.title.en).toBe('Welcome to FarmKind');

    // 3 core summarized steps aligned with vision
    expect(modal.step1Title.hi).toContain('खेत की समझ');
    expect(modal.step2Title.hi).toContain('स्मार्ट सिंचाई');
    expect(modal.step3Title.hi).toContain('फसल सुरक्षा');

    expect(modal.step1Title.mr).toContain('शेताची समज');
    expect(modal.step2Title.mr).toContain('स्मार्ट सिंचन');
    expect(modal.step3Title.mr).toContain('शेतमाल संरक्षण');

    // CTAs
    expect(modal.startExploring.hi).toContain('खेत देखना शुरू करें');
    expect(modal.openFullGuide.hi).toContain('विस्तृत किसान गाइड');
    expect(modal.dontShowAgain.en).toContain("Don't show this popup on startup");
  });

  it('3. Navigation items include How It Works link across languages', () => {
    expect(TRANSLATIONS.nav.howItWorks.en).toBe('📖 How It Works');
    expect(TRANSLATIONS.nav.howItWorks.hi).toBe('📖 कैसे काम करता है');
    expect(TRANSLATIONS.nav.howItWorks.mr).toBe('📖 कसे कार्य करते');
  });

  it('4. stopIndianVoice executes safely without throwing when window or speech is absent', () => {
    expect(() => stopIndianVoice()).not.toThrow();
  });
});
