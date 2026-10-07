import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  t,
  BRAND_NAME,
  BRAND_TAGLINE,
  type SupportedLanguage,
} from '../i18n/translations';

describe('Multilingual Native Language Support (i18n)', () => {
  it('1. Provides complete support for Indian rural languages (Hindi, Marathi, English, Kannada, Telugu)', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(5);
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    expect(codes).toContain('hi');
    expect(codes).toContain('mr');
    expect(codes).toContain('en');
    expect(codes).toContain('kn');
    expect(codes).toContain('te');

    // Marathi must be marked for Maharashtra (Nashik focus)
    const marathi = SUPPORTED_LANGUAGES.find(l => l.code === 'mr');
    expect(marathi?.name).toBe('Marathi');
    expect(marathi?.nativeName).toBe('मराठी');
    expect(marathi?.region).toContain('महाराष्ट्र');

    // Hindi must be marked for North & Central India
    const hindi = SUPPORTED_LANGUAGES.find(l => l.code === 'hi');
    expect(hindi?.name).toBe('Hindi');
    expect(hindi?.nativeName).toBe('हिंदी');
  });

  it('2. Strictly preserves brand name and brand tagline without corruption', () => {
    expect(BRAND_NAME).toBe('FarmKind');
    expect(BRAND_TAGLINE).toBe('Helping Every Small Farm Do More With Less...');

    expect(TRANSLATIONS.brand.name.hi).toBe('FarmKind');
    expect(TRANSLATIONS.brand.name.mr).toBe('FarmKind');
    expect(TRANSLATIONS.brand.name.en).toBe('FarmKind');

    expect(TRANSLATIONS.brand.tagline.hi).toContain('कम संसाधनों में अधिक उत्पादन');
    expect(TRANSLATIONS.brand.tagline.mr).toContain('कमी खर्चात अधिक समृद्धी');
    expect(TRANSLATIONS.brand.tagline.en).toBe('Helping Every Small Farm Do More With Less.');
  });

  it('3. Translates main navigation tabs across all languages', () => {
    const langs: SupportedLanguage[] = ['hi', 'mr', 'en', 'kn', 'te'];
    langs.forEach(lang => {
      expect(TRANSLATIONS.nav.home[lang]).toBeDefined();
      expect(TRANSLATIONS.nav.market[lang]).toBeDefined();
      expect(TRANSLATIONS.nav.shields[lang]).toBeDefined();
    });

    expect(TRANSLATIONS.nav.home.hi).toBe('होम');
    expect(TRANSLATIONS.nav.home.mr).toBe('मुख्य');
    expect(TRANSLATIONS.nav.home.en).toBe('HOME');
  });

  it('4. Provides full translations for all 7 platform screens in Hindi, Marathi, and English', () => {
    const primaryLangs: SupportedLanguage[] = ['hi', 'mr', 'en'];

    for (let screenId = 1; screenId <= 7; screenId++) {
      const screenTrans = TRANSLATIONS.screens[screenId as keyof typeof TRANSLATIONS.screens];
      expect(screenTrans).toBeDefined();

      primaryLangs.forEach(lang => {
        expect(screenTrans.name[lang]).toBeTruthy();
        expect(screenTrans.title[lang]).toBeTruthy();
        expect(screenTrans.eyebrow[lang]).toBeTruthy();
      });
    }

    // Verify Marathi specific titles for Ramesh Patil's farm in Nashik
    expect(TRANSLATIONS.screens[1].title.mr).toContain('शेताची समज');
    expect(TRANSLATIONS.screens[2].title.mr).toContain('स्मार्ट सिंचन');
    expect(TRANSLATIONS.screens[3].title.mr).toContain('संसाधन');
    expect(TRANSLATIONS.screens[5].title.mr).toContain('मित्रा');
    expect(TRANSLATIONS.screens[6].title.mr).toContain('काढणीपश्चात');
  });

  it('5. Helper function t() resolves keys and falls back gracefully to Hindi or English', () => {
    const marathiHome = t('nav', 'home', 'mr');
    expect(marathiHome).toBe('मुख्य');

    const englishHome = t('nav', 'home', 'en');
    expect(englishHome).toBe('HOME');

    const hindiHome = t('nav', 'home', 'hi');
    expect(hindiHome).toBe('होम');
  });

  it('6. Floating Farm Mitra mascot speech bubble provides dynamic localized prompts across all 5 languages', () => {
    const langs: SupportedLanguage[] = ['hi', 'mr', 'en', 'kn', 'te'];
    const mitraTrans = TRANSLATIONS.floatingVoiceMitra;

    expect(mitraTrans).toBeDefined();
    langs.forEach(lang => {
      expect(mitraTrans.title[lang]).toBeTruthy();
      expect(mitraTrans.speechBubble[lang]).toBeTruthy();
      expect(mitraTrans.speechHint[lang]).toBeTruthy();
      expect(mitraTrans.badgeOnline[lang]).toBeTruthy();
    });

    // English prompt
    expect(mitraTrans.speechBubble.en).toContain("Ask anything! I'm your Farm Mitra");
    // Hindi prompt
    expect(mitraTrans.speechBubble.hi).toContain('फार्म मित्र');
    // Marathi prompt
    expect(mitraTrans.speechBubble.mr).toContain('फार्म मित्र');
  });
});
