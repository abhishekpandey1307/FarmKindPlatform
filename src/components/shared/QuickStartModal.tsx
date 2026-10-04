// =============================================================================
// FARMKIND — QUICK START & HOW IT WORKS WELCOME MODAL
// 60-Second high-impact summarized onboarding for farmers & evaluators
// =============================================================================

import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { speakNaturalIndianVoice, stopIndianVoice } from '../../utils/indianVoiceSynth';

export function QuickStartModal() {
  const { showQuickGuide, setShowQuickGuide, navigateTo, state, showIntro } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // If animated intro is currently playing, wait until it finishes
  if (!showQuickGuide || showIntro) return null;

  const lang = state.language ?? 'hi';
  const t = TRANSLATIONS.howItWorksGuide.summaryModal;

  const handleClose = () => {
    stopIndianVoice();
    setIsPlayingAudio(false);
    if (dontShowAgain) {
      try {
        localStorage.setItem('farmkind_seen_welcome_guide', 'true');
      } catch {
        // ignore
      }
    }
    setShowQuickGuide(false);
  };

  const handleStartExploring = () => {
    handleClose();
    navigateTo(1);
  };

  const handleOpenFullGuide = () => {
    handleClose();
    navigateTo(0);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopIndianVoice();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    const speechText =
      lang === 'mr'
        ? 'फार्मकाइंडमध्ये आपले स्वागत आहे - प्रत्येक छोट्या शेतकऱ्याला कमी खर्चात अधिक समृद्ध करणे. पहिले: शेतातील डिझेल आणि पाण्याचा अपव्यय व आर्थिक नुकसान शोधा. दुसरे: स्मार्ट इरिगेशन इंजिन ३५ टक्के ओलाव्यावर पाणी बंद करते, आणि शेतकरी गटाद्वारे परवडणाऱ्या सौर संसाधनांचा लाभ मिळवा. तिसरे: शेतातून बाजारापर्यंत शेतमालाचे रक्षण करा — शीतगृह साठवणूक, वाहतूक किंवा योग्य वेळी विक्रीचे निर्णय घेऊन नफा वाढवा. चला, सुरुवात करूया.'
        : lang === 'hi'
        ? 'फार्मकाइंड में आपका स्वागत है — हर छोटे किसान को कम लागत में अधिक समृद्ध बनाना। पहला: खेत में डीजल और पानी की बर्बादी तथा आर्थिक नुकसान को पहले पहचानें। दूसरा: स्मार्ट इरीगेशन इंजन 35% नमी पर मोटर बंद करता है, और किसान समूहों के साथ किफायती सौर व कृषि संसाधन पाएं। तीसरा: खेत से मंडी तक फसल सुरक्षा — कोल्ड स्टोरेज, परिवहन या तुरंत बिक्री का सही निर्णय लेकर मुनाफा बढ़ाएं। आइए, शुरुआत करें।'
        : lang === 'te'
        ? 'ఫార్మ్‌కైండ్‌కు స్వాగతం — ప్రతి చిన్న రైతు తక్కువ ఖర్చుతో ఎక్కువ లాభం పొందడానికి సహాయం చేస్తుంది. మొదటిది: వ్యవసాయ సమస్య ఆడిట్ ద్వారా డీజిల్, నీటి వృథా మరియు ఆర్థిక నష్టాన్ని గుర్తించండి. రెండవది: స్మార్ట్ ఇరిగేషన్ మరియు రైతు బృందాల ద్వారా చవకైన వనరుల మార్కెట్‌ప్లేస్. మూడవది: కోత అనంతర నిర్ణయ వ్యవస్థతో పంటను పొలం నుండి మార్కెట్ వరకు రక్షించండి. ప్రారంభిద్దాం.'
        : lang === 'kn'
        ? 'ಫಾರ್ಮ್‌ಕೈಂಡ್‌ಗೆ ಸ್ವಾಗತ — ಪ್ರತಿಯೊಬ್ಬ ಸಣ್ಣ ರೈತರಿಗೆ ಕಡಿಮೆ ವೆಚ್ಚದಲ್ಲಿ ಹೆಚ್ಚಿನ ಲಾಭ. ಮೊದಲನೆಯದು: ಹೊಲದ ಸಮಸ್ಯೆಗಳ ಆಡಿಟ್ ಮೂಲಕ ಡೀಸೆಲ್ ಮತ್ತು ನೀರಿನ ನಷ್ಟವನ್ನು ಗುರುತಿಸಿ. ಎರಡನೆಯದು: ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ ಮತ್ತು ರೈತ ಗುಂಪುಗಳ ಮೂಲಕ ಕೈಗೆಟುಕುವ ಸಂಪನ್ಮೂಲಗಳ ಮಾರುಕಟ್ಟೆ. ಮೂರನೆಯದು: ಕೊಯ್ಲಿನ ನಂತರದ ನಿರ್ಧಾರ ವ್ಯವಸ್ಥೆಯ ಮೂಲಕ ಬೆಳೆಯನ್ನು ಹೊಲದಿಂದ ಮಾರುಕಟ್ಟೆಯವರೆಗೆ ರಕ್ಷಿಸಿ. ಪ್ರಾರಂಭಿಸೋಣ.'
        : 'Welcome to FarmKind — helping every small farm do more with less. First: Farm Understanding and Problem Audit spots where money, diesel, and water are leaking first. Second: Smart Irrigation Decision Engine cuts water automatically at 35% soil moisture, while Affordable Resources Marketplace connects you with shared solar and Farmer Groups. Third: Post-Harvest Decision System protects your produce all the way from field to market — deciding whether to Store, Move, Prioritize Market, or Sell Sooner to protect your profits. Let us get started.';

    speakNaturalIndianVoice(speechText, lang, {
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-start-title"
    >
      <div
        className="card card--solar animate-scale-in"
        style={{
          maxWidth: '560px',
          width: 'min(560px, calc(100vw - 20px))',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: 'clamp(14px, 3.5vw, 24px)',
          position: 'relative',
          background: 'linear-gradient(180deg, #0d1d34 0%, #060e18 100%)',
          border: '1px solid rgba(56, 189, 248, 0.28)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(34, 197, 94, 0.15)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            cursor: 'pointer',
          }}
          aria-label="Close Quick Guide"
        >
          ✕
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge--solar">
            {t.badge[lang] || t.badge.en}
          </span>
          <span className="badge badge--farm" style={{ fontSize: '10px' }}>
            Ramesh Patil · Nashik
          </span>
        </div>

        <h2
          id="quick-start-title"
          className="text-xl font-black mb-1"
          style={{
            color: '#f0f9ff',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🌱</span>
          <span>{t.title[lang] || t.title.en}</span>
        </h2>

        <p className="text-xs text-muted mb-4 font-medium" style={{ color: '#7dd3fc', lineHeight: 1.5 }}>
          {t.subtitle[lang] || t.subtitle.en}
        </p>

        {/* Audio Explainer Button */}
        <div
          style={{
            background: isPlayingAudio ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.08)',
            border: isPlayingAudio ? '1px solid var(--clr-farm-green)' : '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '20px' }}>{isPlayingAudio ? '🔊' : '🎙️'}</span>
            <div>
              <p className="text-xs font-bold" style={{ color: '#f0f9ff' }}>
                {isPlayingAudio ? (t.playingBtn[lang] || t.playingBtn.en) : (t.listenBtn[lang] || t.listenBtn.en)}
              </p>
              <p className="text-xs text-muted" style={{ fontSize: '10px' }}>
                {lang === 'mr' ? 'मराठीमध्ये ऐका' : lang === 'hi' ? 'हिंदी में सुनें' : 'Natural Indian Voice'}
              </p>
            </div>
          </div>
          <button
            className={`btn btn--xs ${isPlayingAudio ? 'btn--primary animate-pulse' : 'btn--secondary'}`}
            onClick={handleToggleAudio}
            style={{ minWidth: '85px' }}
          >
            {isPlayingAudio ? '⏹ Stop' : '▶ Play'}
          </button>
        </div>

        {/* 3 Step Summarized Cards */}
        <div className="flex flex-col gap-2.5 mb-5">
          {/* Step 1 */}
          <div
            style={{
              background: 'rgba(10, 22, 40, 0.65)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              🔍
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: '#f0f9ff', marginBottom: '2px' }}>
                {t.step1Title[lang] || t.step1Title.en}
              </h4>
              <p className="text-xs text-muted" style={{ lineHeight: 1.4 }}>
                {t.step1Desc[lang] || t.step1Desc.en}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              background: 'rgba(10, 22, 40, 0.65)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              ☀️
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: '#f0f9ff', marginBottom: '2px' }}>
                {t.step2Title[lang] || t.step2Title.en}
              </h4>
              <p className="text-xs text-muted" style={{ lineHeight: 1.4 }}>
                {t.step2Desc[lang] || t.step2Desc.en}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              background: 'rgba(10, 22, 40, 0.65)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              🛡️
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: '#f0f9ff', marginBottom: '2px' }}>
                {t.step3Title[lang] || t.step3Title.en}
              </h4>
              <p className="text-xs text-muted" style={{ lineHeight: 1.4 }}>
                {t.step3Desc[lang] || t.step3Desc.en}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <button
            className="btn btn--primary flex-1 py-2.5 font-bold text-sm"
            onClick={handleStartExploring}
            id="btn-quick-start-explore"
          >
            {t.startExploring[lang] || t.startExploring.en}
          </button>
          <button
            className="btn btn--secondary flex-1 py-2.5 font-bold text-xs"
            onClick={handleOpenFullGuide}
            id="btn-quick-start-full-guide"
          >
            {t.openFullGuide[lang] || t.openFullGuide.en}
          </button>
        </div>

        {/* Don't show again checkbox */}
        <div className="flex items-center justify-between pt-2 border-t border-glass">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-muted select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              style={{ accentColor: 'var(--clr-farm-green)' }}
            />
            <span>{t.dontShowAgain[lang] || t.dontShowAgain.en}</span>
          </label>
          <span className="text-xs text-dim" style={{ fontSize: '10px' }}>
            FarmKind v2.4
          </span>
        </div>
      </div>
    </div>
  );
}
