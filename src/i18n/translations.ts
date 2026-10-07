// =============================================================================
// FARMKIND — MULTILINGUAL I18N DICTIONARY & REGIONAL LANGUAGE ENGINE
// Supports: Hindi (हिंदी), Marathi (मराठी), English, Kannada (ಕನ್ನಡ), Telugu (తెలుగు)
// =============================================================================

export type SupportedLanguage = 'hi' | 'mr' | 'en' | 'kn' | 'te';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', region: 'राष्ट्रीय / North & Central' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🚩', region: 'महाराष्ट्र / Maharashtra' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🌐', region: 'Global / Evaluation' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🌾', region: 'ಕರ್ನಾಟಕ / Karnataka' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🌱', region: 'తెలుగు రాష్ట్రాలు / AP & TS' },
];

export const BRAND_NAME = 'FarmKind';
export const BRAND_TAGLINE = 'Helping Every Small Farm Do More With Less...';

export const TRANSLATIONS = {
  // ─── BRAND & HEADER ────────────────────────────────────────────────────────
  brand: {
    name: {
      en: 'FarmKind',
      hi: 'FarmKind',
      mr: 'FarmKind',
      kn: 'FarmKind',
      te: 'FarmKind',
    },
    tagline: {
      en: 'Helping Every Small Farm Do More With Less.',
      hi: 'हर छोटे किसान की मदद — कम संसाधनों में अधिक उत्पादन।',
      mr: 'प्रत्येक छोट्या शेतकऱ्याची साथ — कमी खर्चात अधिक समृद्धी.',
      kn: 'ಪ್ರತಿಯೊಬ್ಬ ಸಣ್ಣ ರೈತರಿಗೆ ನೆರವು — ಕಡಿಮೆ ಸಂಪನ್ಮೂಲ, ಹೆಚ್ಚು ಇಳುವರಿ.',
      te: 'ప్రతి చిన్న రైతుకు అండ — తక్కువ ఖర్చుతో ఎక్కువ దిగుబడి.',
    },
    taglineSub: {
      en: '(Less water. Less energy. Less money. Less waste. → More productivity. More resilience.)',
      hi: '(कम पानी। कम ऊर्जा। कम खर्च। कम बर्बादी। → अधिक उत्पादकता। अधिक मजबूती।)',
      mr: '(कमी पाणी. कमी वीज. कमी खर्च. कमी नुकसान. → जास्त उत्पादन. अधिक सक्षमता.)',
      kn: '(ಕಡಿಮೆ ನೀರು. ಕಡಿಮೆ ವಿದ್ಯುತ್. ಕಡಿಮೆ ವೆಚ್ಚ. ಕಡಿಮೆ ನಷ್ಟ. → ಹೆಚ್ಚು ಉತ್ಪಾದಕತೆ.)',
      te: '(తక్కువ నీరు. తక్కువ విద్యుత్. తక్కువ ఖర్చు. తక్కువ నష్టం. → ఎక్కువ దిగుబడి.)',
    },
  },

  // ─── NAVIGATION ────────────────────────────────────────────────────────────
  nav: {
    home: { en: 'HOME', hi: 'होम', mr: 'मुख्य', kn: 'ಮುಖಪುಟ', te: 'హోమ్' },
    market: { en: 'MARKET', hi: 'बाजार व योजना', mr: 'बाजार व योजना', kn: 'ಮಾರುಕಟ್ಟೆ', te: 'మార్కెట్' },
    shields: { en: 'SHIELDS', hi: 'सुरक्षा कवच', mr: 'सुरक्षा कवच', kn: 'ರಕ್ಷಣೆ', te: 'రక్షణ' },
    language: { en: 'Language', hi: 'भाषा चुनें', mr: 'भाषा निवडा', kn: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ', te: 'భాష ఎంచుకోండి' },
    intro: { en: '✨ INTRO', hi: '✨ परिचय', mr: '✨ ओळख', kn: '✨ ಪರಿಚಯ', te: '✨ పరిచయం' },
    live: { en: 'LIVE · Nashik', hi: 'लाइव · नाशिक', mr: 'थेट · नाशिक', kn: 'ಲೈವ್ · ನಾಸಿಕ್', te: 'లైవ్ · నాసిక్' },
    scenario: { en: '🧪 SCENARIO', hi: '🧪 टेस्ट मोड', mr: '🧪 चाचणी मोड', kn: '🧪 ಪರೀಕ್ಷೆ', te: '🧪 పరీక్ష' },
    offline: { en: '📶 OFFLINE', hi: '📶 ऑफलाइन', mr: '📶 ऑफलाइन', kn: '📶 ಆಫ್‌ಲೈನ್', te: '📶 ఆఫ్‌లైన్' },
    howItWorks: { en: '📖 How It Works', hi: '📖 कैसे काम करता है', mr: '📖 कसे कार्य करते', kn: '📖 ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ', te: '📖 ఎలా పనిచేస్తుంది' },
    quickGuide: { en: '⚡ Quick Guide', hi: '⚡ त्वरित गाइड', mr: '⚡ जलद मार्गदर्शिका', kn: '⚡ ತ್ವರಿತ ಮಾರ್ಗದರ್ಶಿ', te: '⚡ త్వరిత గైడ్' },
  },

  // ─── SCREEN TABS ───────────────────────────────────────────────────────────
  screens: {
    0: {
      name: {
        en: 'How FarmKind Works',
        hi: 'फार्मकाइंड कैसे काम करता है',
        mr: 'फार्मकाइंड कसे कार्य करते',
        kn: 'ಫಾರ್ಮ್‌ಕೈಂಡ್ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
        te: 'ఫార్మ్‌కైండ్ ఎలా పనిచేస్తుంది',
      },
      eyebrow: {
        en: 'Connected Intelligence Lifecycle · संपूर्ण शेती चक्र',
        hi: 'स्मार्ट इंजन कृषि चक्र · खेत से बाजार तक',
        mr: 'स्मार्ट इंजिन कृषी चक्र · शेतापासून बाजारापर्यंत',
        kn: 'ಸಂಪೂರ್ಣ ಕೃಷಿ ಚಕ್ರ',
        te: 'పూర్తి వ్యవసాయ చక్రం',
      },
      title: {
        en: 'How FarmKind Works — Connected Intelligence for Small Farms',
        hi: 'फार्मकाइंड कैसे काम करता है — छोटे किसानों के लिए कनेक्टेड इंटेलिजेंस',
        mr: 'फार्मकाइंड कसे कार्य करते — अल्पभूधारक शेतकऱ्यांसाठी कनेक्टेड इंटेलिजेंस',
        kn: 'ಫಾರ್ಮ್‌ಕೈಂಡ್ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
        te: 'ఫಾರ್మ్‌కైండ్ ఎలా పనిచేస్తుంది',
      },
      subtitle: {
        en: 'Connecting the entire farming journey: understanding leaks, affordable resources, sensor ground truth, smart decisions, and measured savings.',
        hi: 'पूरी कृषि यात्रा को जोड़ता है: नुकसान की पहचान, किफायती संसाधन, सेंसर ग्राउंड ट्रुथ, स्मार्ट निर्णय और प्रमाणित बचत।',
        mr: 'संपूर्ण शेती प्रवास जोडणारी यंत्रणा: गळती शोधणे, परवडणारे संसाधन, सेन्सर माहिती, स्मार्ट निर्णय आणि प्रत्यक्ष बचत.',
        kn: 'ಸಂಪೂರ್ಣ ಕೃಷಿ ಹಂತಗಳನ್ನು ಜೋಡಿಸುವ ವ್ಯವಸ್ಥೆ.',
        te: 'మొత్తం వ్యవసాయ ప్రయాణాన్ని అనుసంధానించే వ్యవస్థ.',
      },
    },
    1: {
      name: {
        en: 'Farm Understanding & Problem Audit',
        hi: 'खेत की समझ और समस्या ऑडिट',
        mr: 'शेताची समज व समस्यांची तपासणी',
        kn: 'ಜಮೀನಿನ ಸಮಸ್ಯೆಗಳ ತನಿಖೆ',
        te: 'పొలం సమస్యల ఆడిట్',
      },
      eyebrow: {
        en: 'Financial Leaks Identified First · आर्थिक गळती शोध',
        hi: 'वित्तीय नुकसान की पहले पहचान · डिंडोरी, नाशिक',
        mr: 'आर्थिक नुकसान आधी ओळखा · दिंडोरी, नाशिक',
        kn: 'ಹಣಕಾಸು ನಷ್ಟ ತನಿಖೆ',
        te: 'ಆರ್ಥಿಕ నష్టాల విశ్లేషణ',
      },
      title: {
        en: 'Farm Understanding & Problem Diagnostic Audit',
        hi: 'खेत की समझ और समस्या पहचान ऑडिट',
        mr: 'शेताची समज आणि आर्थिक गळती परीक्षण',
        kn: 'ಕೃಷಿ ಸ್ಥಿತಿ ಮತ್ತು ನಷ್ಟ ಪರಿಶೀಲನೆ',
        te: 'పొలం స్థితి మరియు నష్టాల తనిఖీ',
      },
      subtitle: {
        en: 'Uncover hidden diesel, water, and operational cash leaks before spending a single rupee.',
        hi: 'बिना कोई पैसा खर्च किए जानें कि आपकी जमीन पर डीजल, पानी और मेहनत का कितना नुकसान हो रहा है।',
        mr: 'एकही रुपया खर्च करण्यापूर्वी शेतात डिझेल, पाणी आणि पैशांचा नेमका किती अपव्यय होतो ते जाणून घ्या.',
        kn: 'ಫಾರ್ಮ್‌ಕೈಂಡ್ ಮುನ್ನ 3.5 ಎಕರೆ ಟೊಮೆಟೊ ಜಮೀನಿನ ನಷ್ಟ ಮತ್ತು ವೆಚ್ಚದ ಲೆಕ್ಕಾಚಾರ.',
        te: 'ఫార్మ్‌కైండ్‌కు ముందు 3.5 ఎకరాల టమోటా పొలం నష్టాలు మరియు వ్యయాల ఆడిట్.',
      },
    },
    2: {
      name: {
        en: 'Smart Irrigation & Automation',
        hi: 'स्मार्ट सिंचाई निर्णय व स्वचालन',
        mr: 'स्मार्ट सिंचन निर्णय व ऑटोमेशन',
        kn: 'ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ ನಿರ್ಧಾರ & ಆಟೊಮೇಷನ್',
        te: 'స్మార్ట్ నీటిపారుదల & ఆటోమేషన్',
      },
      eyebrow: {
        en: 'Smart Engine · Decide & Automate Irrigation',
        hi: 'स्मार्ट इंजन · सही समय पर सिंचाई और ऑटो-कट',
        mr: 'स्मार्ट इंजिन · योग्य वेळी सिंचन आणि ऑटो-कट',
        kn: 'ಸ್ಮಾರ್ಟ್ ಎಂಜಿನ್ ನೀರಾವರಿ',
        te: 'స్మార్ట్ ఇంజిన్ నీటిపారుదల',
      },
      title: {
        en: 'Smart Irrigation Decision & Automation Engine',
        hi: 'स्मार्ट सिंचाई निर्णय व ऑटोमेशन इंजन',
        mr: 'स्मार्ट सिंचन निर्णय आणि स्वयंचलित नियंत्रण',
        kn: 'ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ ನಿರ್ಧಾರ ವ್ಯವಸ್ಥೆ',
        te: 'స్మార్ట్ ఇరిగేషన్ డెసిషన్ ఇంజిన్',
      },
      subtitle: {
        en: 'Understands when soil needs water, automates drip pumping, stops at target moisture (35%), and shows water, energy, and money saved.',
        hi: 'मिट्टी की जरूरत को समझकर ड्रिप चलाता है, 35% नमी पर अपने आप बंद करता है और पानी, बिजली व पैसे की बचत दिखाता है।',
        mr: 'मातीतील गरज ओळखून ठिबक चालवते, ३५% ओलावा होताच मोटर आपोआप बंद करते आणि पाणी, वीज व पैशांची बचत दाखवते.',
        kn: 'ಮಣ್ಣಿನ ತೇವಾಂಶ 35% ತಲುಪಿದಾಗ ಪಂಪ್ ತಾನಾಗಿಯೇ ಬಂದ್ ಆಗಿ ಹಣ ಉಳಿತಾಯ ತೋರಿಸುತ್ತದೆ.',
        te: 'నేల తేమ 35% రాగానే మోటారు ఆటోమేటిక్ ఆఫ్ చేసి ఖర్చులు ఆదా చేస్తుంది.',
      },
    },
    3: {
      name: {
        en: 'Affordable Resources Marketplace',
        hi: 'किफायती संसाधन बाजार',
        mr: 'परवडणारे संसाधन बाजार',
        kn: 'ಕೈಗೆಟುಕುವ ಸಂಪನ್ಮೂಲ ಮಾರುಕಟ್ಟೆ',
        te: 'అందుబాటులోని వనరుల మార్కెట్',
      },
      eyebrow: {
        en: 'Shared Infrastructure, Subsidies & Farmer Groups',
        hi: 'साझा सोलर, सरकारी अनुदान व किसान समूह',
        mr: 'सामायिक सौर ऊर्जा, अनुदान व शेतकरी गट',
        kn: 'ಹಂಚಿಕೆಯ ಸೌರ ಶಕ್ತಿ & ರೈತ ಗುಂಪುಗಳು',
        te: 'ఉమ్మడి సోలార్ & రైతు గ్రూపులు',
      },
      title: {
        en: 'Affordable Resources Marketplace & Farmer Groups',
        hi: 'किफायती संसाधन बाजार — साझा सोलर व किसान समूह',
        mr: 'परवडणारे संसाधन बाजार — सामायिक सौर ऊर्जा व शेतकरी गट',
        kn: 'ಕೈಗೆಟುಕುವ ಸಂಪನ್ಮೂಲ ಮಾರುಕಟ್ಟೆ ಮತ್ತು ರೈತ ಸಂಘ',
        te: 'అందుబాటులోని వనరుల మార్కెట్ & రైతు సమూహాలు',
      },
      subtitle: {
        en: 'Access affordable shared solar, providers, and FPOs. Form informal Farmer Groups to combine demand and attract providers when needed.',
        hi: 'साझा सोलर पंप, उपकरण व एफपीओ से जुड़ें। जरूरत पड़ने पर आसपास के किसानों के साथ समूह बनाकर सामूहिक मांग से सुविधा पाएं।',
        mr: 'परवडणारा सामायिक सौर पंप, उपकरणे व एफपीओशी जोडा. गरज भासल्यास शेजारील शेतकऱ्यांसह शेतकरी गट स्थापन करून एकत्रित मागणी नोंदवा.',
        kn: 'ಹಂಚಿಕೆಯ ಸೌರ ಪಂಪ್ ಬಳಸಿ. ಅಗತ್ಯವಿದ್ದಾಗ ರೈತ ಗುಂಪು ರಚಿಸಿ ಸೇವೆ ಪಡೆಯಿರಿ.',
        te: 'ఉమ్మడి సోలార్ పంపు పొందండి. అవసరమైతే రైతు గ్రూపుగా ఏర్పడి సేవలు పొందండి.',
      },
    },
    4: {
      name: {
        en: 'Sensor Telemetry & Ground Data',
        hi: 'सेंसर व ग्राउंड डेटा',
        mr: 'सेन्सर्स व जमिनीची माहिती',
        kn: 'ಸೆನ್ಸರ್ ಮತ್ತು ಮಣ್ಣಿನ ಮಾಹಿತಿ',
        te: 'సెన్సార్ & క్షేత్ర స్థాయి డేటా',
      },
      eyebrow: {
        en: 'Ground Truth Layer · Zero-Hardware to Probes',
        hi: 'ग्राउंड ट्रुथ · उपग्रह मॉडल से लेकर सस्ते सेंसर तक',
        mr: 'ग्राउंड ट्रुथ · उपग्रह डेटापासून स्वस्त सेन्सर्सपर्यंत',
        kn: 'ಗ್ರೌಂಡ್ ಟ್ರುತ್ ಮಾಹಿತಿ',
        te: 'క్షేత్ర స్థాయి సమాచారం',
      },
      title: {
        en: 'Sensor Telemetry & Ground Connectivity',
        hi: 'सेंसर टेलीमेट्री और ग्राउंड कनेक्टिविटी',
        mr: 'सेन्सर टेलीमेट्री आणि जमिनीशी थेट जोडणी',
        kn: 'ಸೆನ್ಸರ್ ಸಂಪರ್ಕ ಮತ್ತು ಜಮೀನಿನ ಮಾಹಿತಿ',
        te: 'సెన్సార్ టెಲಿమెట్రీ & ఫీಲ್ಡ್ కనెక్టివిటీ',
      },
      subtitle: {
        en: 'Feeds the Smart Engine with soil moisture, temp, humidity, time, and location—starting zero-hardware via satellite to plug-in probes.',
        hi: 'स्मार्ट इंजन को मिट्टी की नमी, तापमान, आर्द्रता और स्थान का डेटा देता है — बिना उपकरण उपग्रह मॉडल से लेकर प्लग-इन सेंसर तक।',
        mr: 'स्मार्ट इंजिनला मातीचा ओलावा, तापमान आणि हवेतील आर्द्रतेचा डेटा पुरवते — कोणत्याही उपकरणाविना उपग्रहापासून थेट सेन्सर्सपर्यंत.',
        kn: 'ಸ್ಮಾರ್ಟ್ ಎಂಜಿನ್‌ಗೆ ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ಹವಾಮಾನ ಮಾಹಿತಿ ನೀಡುತ್ತದೆ.',
        te: 'స్మార్ట్ ఇంజిన్‌కు నేల తేమ మరియు వాతావరణ సమాచారాన్ని అందిస్తుంది.',
      },
    },
    5: {
      name: {
        en: 'Mitra Conversational Voice AI',
        hi: 'मित्रा बोलता वॉइस AI',
        mr: 'मित्रा बोलणारा व्हॉइस AI',
        kn: 'ಮಿತ್ರ ಧ್ವನಿ ಸಹಾಯಕ',
        te: 'మిత్ర వాయిస్ అసిస్టెంట్',
      },
      eyebrow: {
        en: 'Universal Voice Accessibility · बोलता कृषी मित्र',
        hi: 'हर किसान के लिए बोलता साथी · बिना किसी भाषा रुकावट के',
        mr: 'अशिक्षित शेतकऱ्यांसाठी बोलणारा सोबती · कोणत्याही भाषेची अडचण नाही',
        kn: 'ಸರಳ ಧ್ವನಿ ಸಹಾಯಕ',
        te: 'సులభమైన వాయిస్ అసిస్టెంట్',
      },
      title: {
        en: 'Mitra 24x7 Conversational Voice AI',
        hi: 'मित्रा — आपका 24x7 बोलता कृषि साथी',
        mr: 'मित्रा — तुमचा २४x७ बोलणारा हक्काचा कृषी मित्र',
        kn: 'ಮಿತ್ರ — ನಿಮ್ಮ 24x7 ಮಾತನಾಡುವ ಕೃಷಿ ಗೆಳೆಯ',
        te: 'మిత్ర — మీ 24x7 మాట్లాడే రైతు నేస్తం',
      },
      subtitle: {
        en: 'Speak naturally in Hindi, Marathi, or English. Ask about irrigation, crop condition, savings, or harvest decisions without typing.',
        hi: 'अपनी मातृभाषा में बोलें और सिंचाई, फसल की स्थिति, बचत या कटाई के निर्णयों पर तुरंत सटीक सलाह पाएं।',
        mr: 'आपल्या हक्काच्या भाषेत बोला आणि सिंचन, पिकाची स्थिती, बचत किंवा काढणीच्या निर्णयांवर थेट शेताच्या डेटासह उत्तर मिळवा.',
        kn: 'ಟೈಪ್ ಮಾಡದೆ ನೇರವಾಗಿ ಮಾತನಾಡಿ ಮಾಹಿತಿ ಪಡೆಯಿರಿ.',
        te: 'టైప్ చేయకుండా నేరుగా మాట్లాడి సలహాలు పొందండి.',
      },
    },
    6: {
      name: {
        en: 'Post-Harvest Decision System',
        hi: 'फसल सुरक्षा व बाजार निर्णय',
        mr: 'काढणीपश्चात शेतमाल व बाजार निर्णय',
        kn: 'ಬೆಳೆ ರಕ್ಷಣೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ನಿರ್ಧಾರ',
        te: 'పంట రక్షణ & మార్కెట్ నిర్ణయాలు',
      },
      eyebrow: {
        en: 'Protect Produce from Loss: Field to Market',
        hi: 'खेत से मंडी तक फसल सुरक्षा · जीरो बर्बादी',
        mr: 'शेतापासून बाजारापर्यंत शेतमाल संरक्षण · शून्य नासाडी',
        kn: 'ಜಮೀನಿನಿಂದ ಮಾರುಕಟ್ಟೆಯವರೆಗೆ ಬೆಳೆ ರಕ್ಷಣೆ',
        te: 'పొలం నుండి మార్కెట్ వరకు పంట రక్షణ',
      },
      title: {
        en: 'Post-Harvest Decision System (Field-to-Market Protection)',
        hi: 'पोस्ट-हार्वेस्ट डिसीजन सिस्टम (खेत से मंडी तक फसल सुरक्षा)',
        mr: 'काढणीपश्चात निर्णय प्रणाली (शेतापासून बाजारापर्यंत शेतमाल संरक्षण)',
        kn: 'ಕೊಯ್ಲಿನ ನಂತರದ ನಿರ್ಧಾರ ವ್ಯವಸ್ಥೆ',
        te: 'పంట కోత అనంతర నిర్ణయ వ్యవస్థ',
      },
      subtitle: {
        en: 'Follows produce through storage and transit using MONITOR → UNDERSTAND → DECIDE → ACT to Store, Move, Prioritize Market, or Sell Sooner.',
        hi: 'स्टोरेज व ढुलाई के दौरान फसल की निगरानी कर तय करता है: कोल्ड स्टोरेज में रखें (STORE), गाड़ी भेजें (MOVE), सही मंडी चुनें (PRIORITIZE), या जल्दी बेचें (SELL SOONER)।',
        mr: 'साठवणूक व वाहतुकीदरम्यान शेतमालाचे निरीक्षण करून निर्णय घेते: शीतगृहात ठेवा (STORE), वाहतूक करा (MOVE), योग्य बाजार निवडा (PRIORITIZE), किंवा त्वरित विक्री करा (SELL SOONER).',
        kn: 'ಶೇಖರಣೆ ಮತ್ತು ಸಾಗಾಣಿಕೆಯಲ್ಲಿ ಬೆಳೆ ರಕ್ಷಿಸಲು ಸೂಕ್ತ ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ.',
        te: 'నిల్వ మరియు రవాణాలో పంటను కాపాడేందుకు సరైన నిర్ణయాలు తీసుకుంటుంది.',
      },
    },
    7: {
      name: {
        en: 'Measured Savings & Prosperity',
        hi: 'प्रमाणित बचत और किसान समृद्धि',
        mr: 'प्रत्यक्ष बचत व शेतकरी समृद्धी',
        kn: 'ಪ್ರಮಾಣಿತ ಉಳಿತಾಯ ಮತ್ತು ಸಮೃದ್ಧಿ',
        te: 'నికర పొదుపు & రైతు సమృద్ధి',
      },
      eyebrow: {
        en: 'Financial Benefits First · आर्थिक फायदा आधी',
        hi: 'किसान की सीधी जेब में बचत · पर्यावरण लाभ साथ-साथ',
        mr: 'शेतकऱ्याच्या खिशात थेट रोख बचत · निसर्ग संवर्धन सोबतच',
        kn: 'ರೈತರ ಜೇಬಿನಲ್ಲಿ ನೇರ ಉಳಿತಾಯ',
        te: 'రైతు జೇబులో నేరుగా పొదుపు',
      },
      title: {
        en: 'Measured Savings, Prosperity & Kisan Gaurav',
        hi: 'प्रमाणित बचत, पारिवारिक समृद्धि और किसान गौरव',
        mr: 'प्रत्यक्ष बचत, कौटुंबिक समृद्धी आणि शेतकरी गौरव',
        kn: 'ಪ್ರಮಾಣಿತ ಉಳಿತಾಯ ಮತ್ತು ಕಿಸಾನ್ ಗೌರವ',
        te: 'నికర పొదుపు మరియు కిసాన్ గౌరవం',
      },
      subtitle: {
        en: 'Verifiable diesel, water, and money kept in the farmer’s pocket, accompanied by soil regeneration and your official Kisan Gaurav Certificate.',
        hi: 'परिवार के बैंक खाते में बची शुद्ध रकम (₹61,720/वर्ष) और भूजल संरक्षण का प्रमाण — आधिकारिक किसान गौरव प्रमाण पत्र के साथ।',
        mr: 'कुटुंबाच्या बँक खात्यात थेट शिल्लक राहिलेली रोकड (दरवर्षी ₹६१,७२०) आणि माती संवर्धनाचा पुरावा — अधिकृत शेतकरी गौरव प्रमाणपत्रासह.',
        kn: 'ವರ್ಷಕ್ಕೆ ₹61,720 ನೇರ ಉಳಿತಾಯ ಮತ್ತು ಕಿಸಾನ್ ಗೌರವ ಪ್ರಮಾಣಪತ್ರ.',
        te: 'సంవత్సరానికి ₹61,720 నికర పొదుపు మరియు కిసాన్ గౌరవ ధ్రువీకరణ పత్రం.',
      },
    },
  },

  // ─── SCREEN 1: BASELINE & AUDIT SPECIFIC ────────────────────────────────────
  screen1: {
    heroTitle: {
      en: 'Discover Your Money & Water Savings',
      hi: 'अपनी नकदी और पानी की बचत जानें',
      mr: 'तुमची बचत आणि पाण्याची बचत जाणून घ्या',
      kn: 'ನಿಮ್ಮ ಹಣ ಮತ್ತು ನೀರಿನ ಉಳಿತಾಯ ತಿಳಿಯಿರಿ',
      te: 'మీ డబ్బు మరియు నీటి పొదుపును తెలుసుకోండి',
    },
    heroSubtitle: {
      en: 'FarmKind Smart Engine will scan your 3.5 acres, crop water needs, and energy bills to calculate exact money and water savings.',
      hi: 'फार्मकाइंड स्मार्ट इंजन आपके 3.5 एकड़ खेत, फसल की जरूरत और डीजल बिल की जांच कर सटीक बचत बताएगा।',
      mr: 'फार्मकाइंड स्मार्ट इंजिन तुमच्या ३.५ एकर शेताचा, पाण्याच्या गरजेचा आणि डिझेल खर्चाचा ताळेबंद मांडेल.',
      kn: 'ಫಾರ್ಮ್‌ಕೈಂಡ್ ಸ್ಮಾರ್ಟ್ ಎಂಜಿನ್ ನಿಮ್ಮ 3.5 ಎಕರೆ ಜಮೀನಿನ ನೀರು ಮತ್ತು ಹಣದ ಉಳಿತಾಯ ಲೆಕ್ಕಾಚಾರ ಮಾಡುತ್ತದೆ.',
      te: 'ఫార్మ్‌కైండ్ స్మార్ట్ ఇంజిన్ మీ 3.5 ఎకరాల పొలంలో ఖచ్చితమైన డబ్బు మరియు నీటి పొదుపును లెక్కిస్తుంది.',
    },
    btnAnalyze: {
      en: '🔍 Analyze My Current Farm',
      hi: '🔍 मेरे खेत की जांच करें (ऑडिट शुरू करें)',
      mr: '🔍 माझ्या शेताची तपासणी करा (ऑडिट सुरू करा)',
      kn: '🔍 ನನ್ನ ಜಮೀನನ್ನು ಪರಿಶೀಲಿಸಿ',
      te: '🔍 నా పొలాన్ని విశ్లేషించండి',
    },
    btnRerun: {
      en: '🔄 Re-run Smart Engine Scan',
      hi: '🔄 पुनः जांच करें (स्कैन री-रन)',
      mr: '🔄 पुन्हा तपासणी करा',
      kn: '🔄 ಮರು-ಪರಿಶೀಲಿಸಿ',
      te: '🔄 మళ్లీ స్కాన్ చేయండి',
    },
    btnOpenCommand: {
      en: '⚡ Open Command Center & Irrigation →',
      hi: '⚡ कमांड सेंटर व सिंचाई खोलें →',
      mr: '⚡ नियंत्रण कक्ष आणि सिंचन उघडा →',
      kn: '⚡ ಕಮಾಂಡ್ ಸೆಂಟರ್ ತೆರೆಯಿರಿ →',
      te: '⚡ కమాండ్ సెంటర్ తెరవండి →',
    },
    diagnosed: {
      en: 'SMART ENGINE DIAGNOSED',
      hi: 'स्मार्ट इंजन द्वारा जांच पूर्ण',
      mr: 'स्मार्ट इंजिन तपासणी पूर्ण',
      kn: 'ಸ್ಮಾರ್ಟ್ ಎಂಜಿನ್ ಪರಿಶೀಲನೆ ಪೂರ್ಣ',
      te: 'స్మార్ట్ ఇంజిన్ విశ్లేషణ పూర్తయింది',
    },
    unoptimized: {
      en: 'UN-OPTIMIZED',
      hi: 'पारंपरिक (अधिक खर्च)',
      mr: 'पारंपरिक (जास्त खर्च)',
      kn: 'ಸಾಂಪ್ರದಾಯಿಕ',
      te: 'సాంప్రదాయ పద్ధతి',
    },
    monthlyFuelLeak: {
      en: 'MONTHLY FUEL LEAK',
      hi: 'मासिक डीजल का नुकसान',
      mr: 'दरमहा डिझेलचा भुर्दंड',
      kn: 'ತಿಂಗಳ ಡೀಸೆಲ್ ನಷ್ಟ',
      te: 'నెలవారీ డీజిల్ ఖర్చు',
    },
    potentialCashKept: {
      en: 'POTENTIAL CASH KEPT',
      hi: 'संभावित नकद बचत',
      mr: 'संभाव्य रोकड बचत',
      kn: 'ಉಳಿಸಬಹುದಾದ ಹಣ',
      te: 'మిగిలే డబ్బు',
    },
    leaksDetected: {
      en: 'FarmKind Smart Engine Diagnosis: 5 Leaks Detected',
      hi: 'स्मार्ट इंजन जांच: खेत में 5 बड़े रिसाव (नुकसान) मिले',
      mr: 'स्मार्ट इंजिन निष्कर्ष: शेतात ५ मोठ्या गळती (नुकसान) आढळल्या',
      kn: 'ಸ್ಮಾರ್ಟ್ ಎಂಜಿನ್ ವರದಿ: 5 ನಷ್ಟಗಳು ಪತ್ತೆಯಾಗಿವೆ',
      te: 'స్మార్ట్ ఇంజిన్ నివేదిక: 5 నష్టాలు గుర్తించబడ్డాయి',
    },
    prescriptionsTitle: {
      en: 'FarmKind Smart Engine Solutions to Plug Leaks',
      hi: 'रिसाव रोकने के 5 पक्के समाधान',
      mr: 'नुकसान रोखण्यासाठी ५ ठोस उपाय',
      kn: 'ನಷ್ಟ ತಡೆಯಲು 5 ಪರಿಹಾರಗಳು',
      te: 'నష్టాలను ఆపడానికి 5 పరిష్కారాలు',
    },
  },

  // ─── COMMON LABELS & ACTIONS ───────────────────────────────────────────────
  common: {
    active: { en: 'Active', hi: 'सक्रिय', mr: 'सक्रिय', kn: 'ಸಕ್ರಿಯ', te: 'యాక్టివ్' },
    verified: { en: 'Verified', hi: 'सत्यापित', mr: 'प्रमाणित', kn: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ', te: 'ధృవీకరించబడింది' },
    protectNow: {
      en: 'Protect Now (1-Tap)',
      hi: 'तुरंत सुरक्षित करें (1-टैप)',
      mr: 'तातडीने सुरक्षित करा (१-टॅप)',
      kn: 'ಈಗಲೇ ರಕ್ಷಿಸಿ (1-ಟ್ಯಾಪ್)',
      te: 'వెంటనే రక్షించండి (1-ట్యాప్)',
    },
    listenAudio: {
      en: '🔊 Listen to Advice',
      hi: '🔊 सलाह सुनें',
      mr: '🔊 सल्ला ऐका',
      kn: '🔊 ಸಲಹೆ ಆಲಿಸಿ',
      te: '🔊 సలహా వినండి',
    },
    waterSaved: { en: 'Water Saved', hi: 'पानी की बचत', mr: 'पाण्याची बचत', kn: 'ಉಳಿಸಿದ ನೀರು', te: 'పొదుపు చేసిన నీరు' },
    moneySaved: { en: 'Money Saved', hi: 'रुपयों की बचत', mr: 'पैशांची बचत', kn: 'ಉಳಿಸಿದ ಹಣ', te: 'మిగిలిన డబ్బు' },
    co2Avoided: { en: 'CO₂ Avoided', hi: 'कार्बन धुआं रोका', mr: 'कार्बन धूर रोखला', kn: 'ಇಂಗಾಲ ನಿಯಂತ್ರಣ', te: 'కార్బన్ తగ్గింపు' },
    targetMoisture: { en: 'Target: 35%', hi: 'लक्ष्य: 35% नमी', mr: 'ध्येय: ३५% ओलावा', kn: 'ಗುರಿ: 35%', te: 'లక్ష్యం: 35%' },
    pumpOn: { en: '● PUMP ON', hi: '● मोटर चालू', mr: '● मोटर चालू', kn: '● ಪಂಪ್ ಆನ್', te: '● మోటార్ ಆನ್' },
    pumpOff: { en: '○ PUMP OFF', hi: '○ मोटर बंद', mr: '○ मोटर बंद', kn: '○ ಪಂಪ್ ಆಫ್', te: '○ మోటార్ ఆఫ్' },
    viewLogic: {
      en: '▼ View Engine Logic',
      hi: '▼ इंजन का गणित और तर्क देखें',
      mr: '▼ इंजिनचा तर्क आणि गणित पहा',
      kn: '▼ ಲೆಕ್ಕಾಚಾರ ನೋಡಿ',
      te: '▼ లాజిక్ చూడండి',
    },
    hideLogic: {
      en: '▲ Hide Explanation',
      hi: '▲ तर्क छुपाएं',
      mr: '▲ स्पष्टीकरण लपवा',
      kn: '▲ ವಿವರ ಮರೆಮಾಡಿ',
      te: '▲ వివరణ దాచండి',
    },
    changeLanguageNotice: {
      en: 'Language changed to English',
      hi: 'भाषा बदलकर हिंदी कर दी गई है',
      mr: 'भाषा बदलून मराठी करण्यात आली आहे',
      kn: 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ',
      te: 'భాష తెలుగులోకి మార్చబడింది',
    },
  },

  // ─── HOW IT WORKS GUIDE & POPUP ─────────────────────────────────────────────
  howItWorksGuide: {
    summaryModal: {
      badge: {
        en: '⚡ 1-Minute Quick Guide',
        hi: '⚡ 1 मिनट की किसान मार्गदर्शिका',
        mr: '⚡ १ मिनिटांची शेतकरी मार्गदर्शिका',
        kn: '⚡ 1 ನಿಮಿಷದ ರೈತ ಮಾರ್ಗದರ್ಶಿ',
        te: '⚡ 1 నిమిషం రైతు గైడ్',
      },
      title: {
        en: 'Welcome to FarmKind',
        hi: 'फार्मकाइंड में आपका स्वागत है',
        mr: 'फार्मकाइंडमध्ये आपले स्वागत आहे',
        kn: 'ಫಾರ್ಮ್‌ಕೈಂಡ್‌ಗೆ ಸುಸ್ವಾಗತ',
        te: 'ఫార్మ్‌ಕೈಂಡ್‌కు స్వాగతం',
      },
      subtitle: {
        en: 'Helping Every Small Farm Do More With Less.',
        hi: 'हर छोटे किसान की मदद — कम संसाधनों में अधिक उत्पादन।',
        mr: 'प्रत्येक छोट्या शेतकऱ्याची साथ — कमी खर्चात अधिक समृद्धी.',
        kn: 'ಪ್ರತಿಯೊಬ್ಬ ಸಣ್ಣ ರೈತರಿಗೆ ನೆರವು — ಕಡಿಮೆ ಸಂಪನ್ಮೂಲ, ಹೆಚ್ಚು ಇಳುವರಿ.',
        te: 'ప్రతి చిన్న రైతుకు అండ — తక్కువ ఖర్చుతో ఎక్కువ దిగుబడి.',
      },
      listenBtn: {
        en: '🔊 Listen to Audio Guide',
        hi: '🔊 बोलकर सुनें (ऑडियो गाइड)',
        mr: '🔊 ऑडिओ मार्गदर्शिका ऐका',
        kn: '🔊 ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ ಆಲಿಸಿ',
        te: '🔊 ఆడియో గైడ్ వినండి',
      },
      playingBtn: {
        en: '🔊 Playing Audio...',
        hi: '🔊 ऑडियो चल रहा है...',
        mr: '🔊 ऑडिओ चालू आहे...',
        kn: '🔊 ಪ್ಲೇ ಆಗುತ್ತಿದೆ...',
        te: '🔊 ప్లే అవుతోంది...',
      },
      step1Title: {
        en: '1. Farm Understanding & Problem Audit',
        hi: '1. खेत की समझ और समस्या पहचान',
        mr: '१. शेताची समज व समस्या तपासणी',
        kn: '1. ಜಮೀನಿನ ಸಮಸ್ಯೆಗಳ ತನಿಖೆ',
        te: '1. పొలం సమస్యల ఆడిట్',
      },
      step1Desc: {
        en: 'Identify diesel, water, and operational cash leaks on your land before spending any money.',
        hi: 'बिना कोई पैसा खर्च किए जानें कि आपकी जमीन पर डीजल, पानी और नकदी का कितना नुकसान हो रहा है।',
        mr: 'एकही रुपया खर्च करण्यापूर्वी शेतात डिझेल, पाणी आणि पैशांचा नेमका किती अपव्यय होतो ते ओळखा.',
        kn: 'ಹಣ ಖರ್ಚು ಮಾಡುವ ಮುನ್ನ ಡೀಸೆಲ್ ಮತ್ತು ನೀರಿನ ನಷ್ಟ ತಿಳಿಯಿರಿ.',
        te: 'ఒక్క రూపాయి ఖర్చు చేయకముందే డీజిల్ మరియు నీటి నష్టాలను గుర్తించండి.',
      },
      step2Title: {
        en: '2. Smart Irrigation & Affordable Marketplace',
        hi: '2. स्मार्ट सिंचाई व किफायती संसाधन बाजार',
        mr: '२. स्मार्ट सिंचन व परवडणारे संसाधन बाजार',
        kn: '2. ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ & ಕೈಗೆಟುಕುವ ಮಾರುಕಟ್ಟೆ',
        te: '2. స్మార్ట్ ఇరిగేషన్ & మార్కెట్',
      },
      step2Desc: {
        en: 'Auto-stop drip pumping at 35% moisture. Access shared solar or form informal Farmer Groups to combine demand.',
        hi: '35% नमी पर ऑटो-कट के साथ सही समय पर सिंचाई करें, साझा सोलर अपनाएं या आसपास के किसानों के साथ मिलकर समूह बनाएं।',
        mr: '३५% ओलावा ऑटो-कटसह अचूक सिंचन करा, सामायिक सोलर वापरा किंवा शेतकरी गट स्थापन करून एकत्रित मागणी नोंदवा.',
        kn: '35% ತೇವಾಂಶದಲ್ಲಿ ಆಟೊ-ಕಟ್ ಸಿಂಚನ, ಸೌರ ಪಂಪ್ ಅಥವಾ ರೈತ ಗುಂಪು ರಚಿಸಿ.',
        te: '35% తేమ వద్ద ఆటో-కట్ నీటిపారుదల, సోలార్ పంప్ లేదా రైతు గ్రూప్ సేవలు.',
      },
      step3Title: {
        en: '3. Post-Harvest Protection (Field-to-Market)',
        hi: '3. फसल सुरक्षा (खेत से मंडी तक)',
        mr: '३. काढणीपश्चात शेतमाल संरक्षण (शेतापासून बाजारापर्यंत)',
        kn: '3. ಬೆಳೆ ರಕ್ಷಣೆ (ಜಮೀನಿನಿಂದ ಮಾರುಕಟ್ಟೆ)',
        te: '3. పంట రక్షణ (పొలం నుండి మార్కెట్)',
      },
      step3Desc: {
        en: 'Protects produce from loss across storage and transit: Store, Move, Prioritize Market, or Sell Sooner to stop distress selling.',
        hi: 'स्टोरेज व ढुलाई में फसल का नुकसान रोकें: कोल्ड स्टोरेज (STORE), परिवहन (MOVE), सही मंडी (PRIORITIZE), या तुरंत बिक्री (SELL SOONER)।',
        mr: 'साठवणूक व वाहतुकीदरम्यान शेतमालाचे नुकसान टाळा: शीतगृह (STORE), वाहतूक (MOVE), योग्य बाजार (PRIORITIZE), किंवा त्वरित विक्री (SELL SOONER).',
        kn: 'ಶೇಖರಣೆ ಮತ್ತು ಸಾಗಾಣಿಕೆಯಲ್ಲಿ ಬೆಳೆ ರಕ್ಷಿಸಲು ಸೂಕ್ತ ನಿರ್ಧಾರ: ಶೇಖರಣೆ, ಸಾಗಾಣಿಕೆ, ಮಾರುಕಟ್ಟೆ ಆದ್ಯತೆ.',
        te: 'నిల్వ మరియు రవాణాలో పంటను కాపాడేందుకు సరైన నిర్ణయాలు.',
      },
      startExploring: {
        en: '🌱 Start Exploring Farm',
        hi: '🌱 खेत देखना शुरू करें (स्क्रीन 1)',
        mr: '🌱 शेत पाहणे सुरू करा (स्क्रीन १)',
        kn: '🌱 ಜಮೀನು ವೀಕ್ಷಿಸಿ',
        te: '🌱 పొలం చూడండి',
      },
      openFullGuide: {
        en: '📖 Read Full Step-by-Step Guide',
        hi: '📖 पूरी विस्तृत किसान गाइड देखें',
        mr: '📖 संपूर्ण सविस्तर मार्गदर्शिका पहा',
        kn: '📖 ಸಂಪೂರ್ಣ ಮಾರ್ಗದರ್ಶಿ ಓದಿ',
        te: '📖 పూర్తి గైడ్ చదవండి',
      },
      dontShowAgain: {
        en: "Don't show this popup on startup",
        hi: 'शुरुआत में यह पॉपअप दोबारा न दिखाएं',
        mr: 'सुरुवातीला हा पॉपअप पुन्हा दाखवू नका',
        kn: 'ಮುಂದೆ ಈ ಪಾಪ್‌ಅಪ್ ತೋರಿಸಬೇಡಿ',
        te: 'మళ్లీ ఈ పాపప్ చూపించవద్దు',
      },
    },
  },

  // Floating Farm Mitra Voice Mascot & Speech Bubble
  floatingVoiceMitra: {
    title: {
      en: 'Farm Mitra',
      hi: 'फार्म मित्र (Farm Mitra)',
      mr: 'फार्म मित्र (Farm Mitra)',
      kn: 'ಫಾರ್ಮ್ ಮಿತ್ರ (Farm Mitra)',
      te: 'ఫార్మ్ మిత్ర (Farm Mitra)',
    },
    speechBubble: {
      en: "Ask anything! I'm your Farm Mitra, here to help.",
      hi: "कुछ भी पूछें! मैं आपका फार्म मित्र हूँ, आपकी सहायता के लिए तैयार।",
      mr: "काहीही विचारा! मी तुमचा फार्म मित्र, मदतीसाठी सोबत आहे.",
      kn: "ಏನನ್ನಾದರೂ ಕೇಳಿ! ನಾನು ನಿಮ್ಮ ಫಾರ್ಮ್ ಮಿತ್ರ, ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ.",
      te: "ఏదైనా అడగండి! నేను మీ ఫార్మ్ మిత్రను, మీకు సహాయం చేయడానికి సిద్ధంగా ఉన్నాను.",
    },
    speechHint: {
      en: 'Tap mic or talk in your language',
      hi: 'बोलकर बात करने के लिए माइक दबाएं',
      mr: 'आपल्या भाषेत बोलण्यासाठी माइक दाबा',
      kn: 'ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿ',
      te: 'మాట్లాడటానికి మైక్ నొక్కండి',
    },
    badgeOnline: {
      en: 'AI ONLINE',
      hi: 'मित्र सक्रिय',
      mr: 'मित्र सक्रिय',
      kn: 'ಆನ್‌ಲೈನ್',
      te: 'ఆన్‌లైన్',
    },
    closeTooltip: {
      en: 'Dismiss tooltip',
      hi: 'संदेश बंद करें',
      mr: 'संदेश बंद करा',
      kn: 'ಮುಚ್ಚಿ',
      te: 'మూసివేయి',
    },
  },
} as const;

/**
 * Helper to get a translation string safely with fallback to English
 */
export function getTranslation(
  path: (t: typeof TRANSLATIONS) => any,
  lang: SupportedLanguage = 'hi'
): string {
  try {
    const node = path(TRANSLATIONS);
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (node[lang]) return node[lang];
    if (node['hi']) return node['hi'];
    if (node['en']) return node['en'];
    return '';
  } catch {
    return '';
  }
}

/**
 * Quick key lookup helper
 */
export function t(category: keyof typeof TRANSLATIONS, key: string, lang: SupportedLanguage = 'hi'): string {
  try {
    const cat = (TRANSLATIONS as any)[category];
    if (!cat) return '';
    const item = cat[key];
    if (!item) return '';
    return item[lang] || item['hi'] || item['en'] || '';
  } catch {
    return '';
  }
}
