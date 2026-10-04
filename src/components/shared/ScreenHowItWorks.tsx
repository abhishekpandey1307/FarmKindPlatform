// =============================================================================
// SCREEN 0 — HOW IT WORKS (COMPLETE PLATFORM GUIDE)
// Simple, transparent, step-by-step walkthrough for smallholder farmers & evaluators
// =============================================================================

import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { SectionHeader } from './index';
import { speakNaturalIndianVoice, stopIndianVoice } from '../../utils/indianVoiceSynth';

interface StepInfo {
  screenId: number;
  badge: string;
  icon: string;
  title: { en: string; hi: string; mr: string };
  summary: { en: string; hi: string; mr: string };
  details: { en: string; hi: string; mr: string };
  keyResult: { en: string; hi: string; mr: string };
  actionLabel: { en: string; hi: string; mr: string };
}

const STEPS: StepInfo[] = [
  {
    screenId: 1,
    badge: 'Step 1 · चरण १',
    icon: '🌾',
    title: {
      en: 'Farm Understanding & Problem Audit',
      hi: 'खेत की समझ और समस्या ऑडिट',
      mr: 'शेताची समज व समस्यांची तपासणी',
    },
    summary: {
      en: 'Identify your real diesel, water, and money leaks before spending a single rupee.',
      hi: 'बिना कोई पैसा खर्च किए जानें कि आपकी जमीन पर डीजल, पानी और नकदी का कितना नुकसान हो रहा है।',
      mr: 'एकही रुपया खर्च करण्यापूर्वी शेतात डिझेल, पाणी आणि पैशांचा नेमका किती अपव्यय होतो ते ओळखा.',
    },
    details: {
      en: 'FarmKind puts financial benefits first. Before asking you to buy anything, we audit your 3.5-acre baseline: exposing 54L/month diesel burn (₹5,143) and 4.8L liters flood water waste, showing exactly how much cash you can keep in your household.',
      hi: 'फार्मकाइंड किसान के वित्तीय लाभ को सबसे पहले रखता है। बिना कोई सामान बेचे, यह 54 लीटर डीजल (₹5,143) और 4.8 लाख लीटर पानी के रिसाव को उजागर करता है ताकि आप जान सकें कि कितना पैसा बचाया जा सकता है।',
      mr: 'फार्मकाइंड शेतकऱ्याचा आर्थिक फायदा सर्वप्रथम पाहते. कोणतेही उपकरण न विकता, हे ५४ लिटर डिझेल (₹५,१४३) आणि ४.८ लाख लिटर पाण्याचा अपव्यय समोर आणते जेणेकरून कुटुंबाचा नफा वाढेल.',
    },
    keyResult: {
      en: '₹5,143/mo diesel leak detected',
      hi: '₹5,143/महीना डीजल का नुकसान पकड़ा गया',
      mr: 'दरमहा ₹५,१४३ डिझेल गळती निष्पन्न',
    },
    actionLabel: {
      en: 'Go to Screen 1: Problem Audit →',
      hi: 'स्क्रीन 1 देखें: समस्या ऑडिट →',
      mr: 'स्क्रीन १ पहा: समस्या तपासणी →',
    },
  },
  {
    screenId: 2,
    badge: 'Step 2 · चरण २',
    icon: '💧',
    title: {
      en: 'Smart Irrigation Decision & Automation',
      hi: 'स्मार्ट सिंचाई निर्णय व स्वचालन',
      mr: 'स्मार्ट सिंचन निर्णय व ऑटोमेशन',
    },
    summary: {
      en: 'Smart Engine understands soil water needs, automates drip pumping, and auto-stops at 35% moisture.',
      hi: 'स्मार्ट इंजन मिट्टी की जरूरत समझता है, तेज धूप में ड्रिप चलाता है और 35% नमी पर मोटर खुद बंद करता है।',
      mr: 'स्मार्ट इंजिन मातीतील गरज ओळखून सिंचन करते आणि ३५% ओलावा गाठताच मोटर आपोआप बंद करते.',
    },
    details: {
      en: 'Replaces guessing and flood over-irrigation. Using live root moisture and weather predictions, the Smart Engine schedules pumping during peak solar hours and shuts off the moment 35% root aeration is satisfied—measuring water, energy, and cash saved.',
      hi: 'अंदाजे से पानी देना बंद करें। जमीन की नमी और मौसम के आधार पर स्मार्ट इंजन धूप के समय सिंचाई करता है और 35% नमी होते ही मोटर बंद करके बचा हुआ पानी, ऊर्जा और पैसा तुरंत दिखाता है।',
      mr: 'अंदाजाने पाणी देणे थांबवा. मातीतील ओलावा आणि हवामानानुसार स्मार्ट इंजिन सिंचन करते आणि ३५% ओलावा होताच मोटर बंद करून वाचलेले पाणी, वीज आणि पैसे दाखवते.',
    },
    keyResult: {
      en: '3.2 Lakh L water saved/month',
      hi: '3.2 लाख लीटर पानी की मासिक बचत',
      mr: 'दरमहा ३.२ लाख लिटर पाण्याची बचत',
    },
    actionLabel: {
      en: 'Go to Screen 2: Smart Irrigation →',
      hi: 'स्क्रीन 2 देखें: स्मार्ट सिंचाई →',
      mr: 'स्क्रीन २ पहा: स्मार्ट सिंचन →',
    },
  },
  {
    screenId: 3,
    badge: 'Step 3 · चरण ३',
    icon: '☀️',
    title: {
      en: 'Affordable Resources Marketplace & Farmer Groups',
      hi: 'किफायती संसाधन बाजार व किसान समूह',
      mr: 'परवडणारे संसाधन बाजार व शेतकरी गट',
    },
    summary: {
      en: 'Access pay-per-use shared solar @ ₹20/hr, subsidies, or form informal Farmer Groups to pool demand.',
      hi: 'मात्र ₹20/घंटे में साझा सोलर पंप पाएं, सरकारी अनुदान लें या आसपास के किसानों के साथ मिलकर समूह बनाएं।',
      mr: 'फक्त ₹२०/तास दराने सामायिक सौर पंप वापरा, अनुदान मिळवा किंवा शेजारील शेतकऱ्यांसह शेतकरी गट स्थापन करा.',
    },
    details: {
      en: 'No money for a ₹2.5 Lakh solar pump? Connect with shared solar hubs, verified providers, and FPOs. If an individual smallholder cannot find a provider alone, nearby farmers form an informal Farmer Group, combine their acreage and pumping demand, and attract providers together.',
      hi: 'महंगे सोलर पंप का खर्च नहीं उठा सकते? साझा सोलर ग्रिड और एफपीओ से जुड़ें। यदि कोई छोटा किसान अकेला सेवा नहीं पा रहा है, तो आसपास के किसान मिलकर एक अनौपचारिक किसान समूह बनाते हैं और सामूहिक मांग से सेवा प्रदाताओं को आकर्षित करते हैं।',
      mr: 'वैयक्तिक सौर पंपासाठी भांडवल नाही? सामायिक सौर ग्रीड आणि एफपीओशी जोडा. जर एखाद्या छोट्या शेतकऱ्याला एकट्याने सेवा मिळत नसेल, तर शेजारील शेतकरी एकत्र येऊन शेतकरी गट तयार करतात आणि सामूहिक मागणी नोंदवून सेवा मिळवतात.',
    },
    keyResult: {
      en: '92% cut in monthly pumping cost',
      hi: 'सिंचाई खर्च में 92% की सीधी कमी',
      mr: 'सिंचन खर्चात ९२% थेट बचत',
    },
    actionLabel: {
      en: 'Go to Screen 3: Marketplace & Groups →',
      hi: 'स्क्रीन 3 देखें: संसाधन बाजार व समूह →',
      mr: 'स्क्रीन ३ पहा: संसाधन बाजार व गट →',
    },
  },
  {
    screenId: 4,
    badge: 'Step 4 · चरण ४',
    icon: '📡',
    title: {
      en: 'Sensor Telemetry & Ground Connectivity',
      hi: 'सेंसर टेलीमेट्री व ग्राउंड डेटा',
      mr: 'सेन्सर टेलीमेट्री व जमिनीची माहिती',
    },
    summary: {
      en: 'Supplies the Smart Engine with soil moisture, temp, humidity, time, and location—from satellite to probes.',
      hi: 'स्मार्ट इंजन को मिट्टी की नमी, तापमान, आर्द्रता और स्थान का डेटा देता है — उपग्रह से लेकर सस्ते सेंसर तक।',
      mr: 'स्मार्ट इंजिनला मातीचा ओलावा, तापमान, आर्द्रता आणि स्थानाचा डेटा पुरवते — उपग्रहापासून स्वस्त सेन्सर्सपर्यंत.',
    },
    details: {
      en: 'FarmKind connects the physical field to digital intelligence. It operates with zero hardware out of the box using calibrated Open-Meteo satellite agrometeorology models, and seamlessly integrates low-cost ₹350 IoT sensors whenever the farmer chooses.',
      hi: 'फार्मकाइंड खेत की जमीनी हकीकत को डिजिटल बुद्धि से जोड़ता है। शुरुआत में बिना किसी उपकरण के उपग्रह मौसम डेटा से काम करता है, और जब किसान चाहे तब ₹350 का सस्ता सेंसर आसानी से जुड़ जाता है।',
      mr: 'फार्मकाइंड शेताच्या प्रत्यक्ष स्थितीला डिजिटल बुद्धिमत्तेशी जोडते. सुरुवातीला कोणत्याही उपकरणाविना उपग्रह डेटावरून कार्य करते आणि नंतर हवे तेव्हा ₹३५० चा स्वस्त सेन्सर जोडता येतो.',
    },
    keyResult: {
      en: 'Zero hardware barrier to start',
      hi: 'शुरुआत के लिए किसी उपकरण की बाध्यता नहीं',
      mr: 'सुरुवातीसाठी उपकरणांची कोणतीही सक्ती नाही',
    },
    actionLabel: {
      en: 'Go to Screen 4: Ground Telemetry →',
      hi: 'स्क्रीन 4 देखें: ग्राउंड टेलीमेट्री →',
      mr: 'स्क्रीन ४ पहा: जमिनीची माहिती →',
    },
  },
  {
    screenId: 5,
    badge: 'Step 5 · चरण ५',
    icon: '🎤',
    title: {
      en: 'Mitra 24x7 Conversational Voice AI',
      hi: 'मित्रा — आपका 24x7 बोलता कृषि साथी',
      mr: 'मित्रा — तुमचा २४x७ बोलणारा कृषी मित्र',
    },
    summary: {
      en: 'Speak naturally in Hindi or Marathi. Voice accessibility across the entire farming lifecycle.',
      hi: 'अपनी मातृभाषा में बोलें — पूरी कृषि यात्रा में बिना लिखे केवल बोलकर तुरंत सटीक सलाह पाएं।',
      mr: 'आपल्या हक्काच्या भाषेत बोला — संपूर्ण शेती चक्रात टायपिंगविना केवळ बोलून सल्ला मिळवा.',
    },
    details: {
      en: 'Empowers farmers with limited literacy. Powered by Google Gemini 2.0 Flash, farmers simply speak: "Should I irrigate today?", "What is the tomato price in Nashik APMC?", or "Will the heatwave spoil my harvest?". Mitra answers verbally using live ground context.',
      hi: 'कम पढ़े-लिखे किसानों के लिए अत्यंत सुलभ। गूगल जेमिनी 2.0 फ्लैश से संचालित, किसान केवल बोलकर पूछ सकते हैं: "क्या आज पानी देना है?", "मंडी में टमाटर का भाव क्या है?", या "क्या धूप से फसल खराब होगी?". मित्रा बोलकर जवाब देता है।',
      mr: 'अशिक्षित शेतकऱ्यांसाठी अत्यंत सोपे. गुगल जेमिनी २.० फ्लॅश आधारित, शेतकरी फक्त बोलून विचारू शकतात: "आज पाणी देऊ का?", "बाजारात काय भाव आहे?". मित्रा थेट शेताच्या डेटासह बोलून मार्गदर्शन करतो.',
    },
    keyResult: {
      en: 'Universal voice accessibility',
      hi: 'हर किसान के लिए सहज आवाज सुविधा',
      mr: 'प्रत्येक शेतकऱ्यासाठी सोपी व्हॉइस सुविधा',
    },
    actionLabel: {
      en: 'Go to Screen 5: Talk with Mitra →',
      hi: 'स्क्रीन 5 देखें: मित्रा से बात करें →',
      mr: 'स्क्रीन ५ पहा: मित्राशी बोला →',
    },
  },
  {
    screenId: 6,
    badge: 'Step 6 · चरण ६',
    icon: '🛡️',
    title: {
      en: 'Post-Harvest Decision System (Field-to-Market)',
      hi: 'पोस्ट-हार्वेस्ट डिसीजन सिस्टम (खेत से मंडी तक फसल सुरक्षा)',
      mr: 'काढणीपश्चात निर्णय प्रणाली (शेतापासून बाजारापर्यंत शेतमाल संरक्षण)',
    },
    summary: {
      en: 'Protects produce from loss across storage and transit: Store, Move, Prioritize Market, or Sell Sooner.',
      hi: 'भंडारण और ढुलाई में फसल का नुकसान रोकें: कोल्ड स्टोरेज (STORE), परिवहन (MOVE), सही मंडी (PRIORITIZE), या तुरंत बिक्री (SELL SOONER)।',
      mr: 'साठवणूक व वाहतुकीदरम्यान शेतमालाचे नुकसान टाळा: शीतगृह (STORE), वाहतूक (MOVE), योग्य बाजार (PRIORITIZE), किंवा त्वरित विक्री (SELL SOONER).',
    },
    details: {
      en: 'Produce protection is not just cold storage. Using MONITOR → UNDERSTAND → DECIDE → ACT, the Smart Engine tracks crop condition, temperature, and transit: deciding whether to STORE in solar cold rooms (+21 days shelf-life), MOVE with refrigerated logistics, PRIORITIZE high-margin APMC buyers, or SELL SOONER before heat causes distress dumping at ₹8/kg.',
      hi: 'फसल सुरक्षा केवल कोल्ड स्टोरेज तक सीमित नहीं है। मॉनिटर → अंडरस्टैंड → डिसाइड → एक्ट मॉडल के जरिए स्मार्ट इंजन फसल के तापमान और शेल्फ लाइफ की निगरानी करता है: यह तय करता है कि फसल को कोल्ड स्टोरेज में रखें (STORE), गाड़ी भेजें (MOVE), अच्छे भाव वाली मंडी चुनें (PRIORITIZE), या सड़ने से पहले तुरंत बेचें (SELL SOONER)।',
      mr: 'शेतमाल संरक्षण म्हणजे केवळ शीतगृह नव्हे. मॉनिटर → अंडरस्टैंड → डिसाइड → एक्ट मॉडेलद्वारे स्मार्ट इंजिन शेतमालाचे निरीक्षण करते: माल शीतगृहात ठेवायचा (STORE), वाहतूक करायची (MOVE), जास्त भावाचा बाजार निवडायचा (PRIORITIZE), किंवा माल खराब होण्यापूर्वी त्वरित विकायचा (SELL SOONER) हे अचूक ठरवते.',
    },
    keyResult: {
      en: 'Zero distress selling · ₹37,500 protected',
      hi: 'लाचारी में औने-पौने बिक्री बंद · ₹37,500 की सुरक्षा',
      mr: 'कवडीमोल भावात विक्री बंद · ₹३७,५०० चे संरक्षण',
    },
    actionLabel: {
      en: 'Go to Screen 6: Post-Harvest System →',
      hi: 'स्क्रीन 6 देखें: फसल रक्षा प्रणाली →',
      mr: 'स्क्रीन ६ पहा: काढणीपश्चात प्रणाली →',
    },
  },
  {
    screenId: 7,
    badge: 'Step 7 · चरण ७',
    icon: '🏆',
    title: {
      en: 'Measured Savings & Farmer Prosperity',
      hi: 'प्रमाणित बचत और किसान समृद्धि',
      mr: 'प्रत्यक्ष बचत व शेतकरी समृद्धी',
    },
    summary: {
      en: 'Verifiable diesel, water, and money kept in the farmer’s pocket, with soil health alongside.',
      hi: 'किसान के बैंक खाते में शुद्ध बचत (₹61,720/वर्ष) और भूजल संरक्षण का आधिकारिक प्रमाण पत्र।',
      mr: 'शेतकऱ्याच्या खात्यात दरवर्षी ₹६१,७२० ची थेट शिल्लक आणि अधिकृत किसान गौरव सन्मानपत्र.',
    },
    details: {
      en: 'FarmKind puts the farmer’s financial benefit first—helping reduce diesel, water, and waste. The environmental benefits come alongside these savings. Provides a cryptographic Kisan Gaurav certificate to secure low-interest bank loans and celebrate rural resilience.',
      hi: 'फार्मकाइंड किसान के आर्थिक लाभ को पहले रखता है। जब किसान का डीजल, पानी और नुकसान बचता है, तो पर्यावरण संरक्षण अपने आप होता है। बैंक से सस्ते कर्ज के लिए सत्यापित किसान गौरव प्रमाण पत्र प्रदान करता है।',
      mr: 'फार्मकाइंड शेतकऱ्याचा आर्थिक फायदा सर्वप्रथम पाहते. जेव्हा डिझेल, पाणी आणि नुकसान वाचते, तेव्हा निसर्गाचे संवर्धन आपोआप घडते. कमी व्याजाच्या बँक कर्जासाठी अधिकृत किसान गौरव प्रमाणपत्र देते.',
    },
    keyResult: {
      en: '₹61,720/year net cash retained in family',
      hi: 'परिवार के खाते में हर साल ₹61,720 की अतिरिक्त बचत',
      mr: 'कुटुंबाच्या हातात दरवर्षी ₹६१,७२० ची थेट शिल्लक',
    },
    actionLabel: {
      en: 'Go to Screen 7: Measured Prosperity →',
      hi: 'स्क्रीन 7 देखें: प्रमाणित समृद्धि →',
      mr: 'स्क्रीन ७ पहा: शेतकरी समृद्धी →',
    },
  },
];

export function ScreenHowItWorks() {
  const { state, navigateTo, openQuickGuide } = useApp();
  const lang = state.language === 'en' ? 'en' : state.language === 'hi' ? 'hi' : 'mr';
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleToggleAudio = () => {
    if (isAudioPlaying) {
      stopIndianVoice();
      setIsAudioPlaying(false);
      return;
    }

    setIsAudioPlaying(true);

    const speechText =
      lang === 'mr'
        ? 'फार्मकाइंड हे छोट्या आणि अल्पभूधारक शेतकऱ्यांचे बुद्धिमान व्यासपीठ आहे. आमचे पहिले उद्दिष्ट शेतकऱ्याचा आर्थिक फायदा करणे हे आहे. कमी पाणी, कमी वीज, कमी खर्च आणि कमी नुकसान म्हणजे जास्त उत्पादन आणि अधिक सक्षमता. पहिल्या टप्प्यात, शेतातील डिझेल आणि पाण्याचा अपव्यय ओळखला जातो. दुसऱ्या टप्प्यात, स्मार्ट इंजिन योग्य वेळी ठिबक सिंचन चालवून ३५ टक्के ओलावा होताच मोटर बंद करते. तिसऱ्या टप्प्यात, परवडणाऱ्या संसाधन बाजारातून सामायिक सौर पंप मिळतो आणि शेतकरी गट स्थापन करून एकत्रित मागणी नोंदवता येते. चौथ्या टप्प्यात, सेन्सर्स थेट माहिती पुरवतात. पाचव्या टप्प्यात, मित्रा व्हॉइसशी आपल्या मराठी भाषेत बोलता येते. सहाव्या टप्प्यात, काढणीपश्चात शेतमाल संरक्षण प्रणाली शेतापासून बाजारापर्यंत टोमॅटोचे नुकसान टाळते—शीतगृहात ठेवणे, वाहतूक करणे, योग्य बाजार निवडणे किंवा त्वरित विक्री करणे ठरवते. आणि सातव्या टप्प्यात, वर्षाला ६१ हजार रुपयांहून अधिक बचत मोजली जाते. चला, सुरुवात करूया.'
        : lang === 'hi'
        ? 'फार्मकाइंड छोटे और सीमांत किसानों का एक बुद्धिमान कृषि मंच है। हमारा सबसे पहला लक्ष्य किसान को सीधा वित्तीय लाभ पहुंचाना है। कम पानी, कम ऊर्जा, कम खर्च और कम बर्बादी यानी अधिक उत्पादकता और अधिक मजबूती। पहले चरण में, खेत के डीजल और पानी का रिसाव पहचाना जाता है। दूसरे चरण में, स्मार्ट इंजन 35% नमी पर मोटर खुद बंद करके पानी और बिजली बचाता है। तीसरे चरण में, किफायती संसाधन बाजार से साझा सोलर मिलता है और किसान समूह बनाकर सामूहिक मांग पूरी की जा सकती है। चौथे चरण में, सेंसर जमीनी डेटा देते हैं। पांचवें चरण में, मित्रा वॉइस से अपनी हिंदी में बात की जा सकती है। छठे चरण में, पोस्ट-हार्वेस्ट डिसीजन सिस्टम खेत से मंडी तक फसल की रक्षा करता है—यह तय करता है कि फसल को कोल्ड स्टोरेज में रखें, गाड़ी भेजें, सही मंडी चुनें, या तुरंत बेचें। और सातवें चरण में, हर साल 61 हजार रुपये से अधिक की बचत बैंक में दर्ज होती है।'
        : 'FarmKind is an intelligent agri-tech platform designed for smallholder farmers, putting financial benefits first. Less water, less energy, less money, less waste leads to more productivity and resilience. Step 1 identifies diesel and water leaks on your land. Step 2 automates smart irrigation and stops at 35% moisture. Step 3 provides an Affordable Resources Marketplace with shared solar and Farmer Group collective demand pooling. Step 4 feeds real sensor ground telemetry. Step 5 enables native conversational Voice AI with Mitra. Step 6 is the Post-Harvest Decision System protecting produce from field to market by deciding whether to Store, Move, Prioritize Market, or Sell Sooner. And Step 7 measures real financial savings kept in your family. Let us get started.';

    speakNaturalIndianVoice(speechText, lang, {
      onEnd: () => setIsAudioPlaying(false),
      onError: () => setIsAudioPlaying(false),
    });
  };

  const faqs = [
    {
      q: {
        en: 'Do I need expensive sensors or internet in the field?',
        hi: 'क्या खेत में महंगे सेंसर या 4G/5G इंटरनेट जरूरी है?',
        mr: 'शेतात महागडे सेन्सर्स किंवा सतत इंटरनेट आवश्यक आहे का?',
      },
      a: {
        en: 'No! FarmKind works with zero hardware using calibrated satellite agrometeorology. If your phone loses connection, Offline Mode queues all pump and booking actions locally, syncing smoothly when you return home.',
        hi: 'बिल्कुल नहीं! फार्मकाइंड उपग्रह मौसम डेटा से बिना किसी सेंसर के तुरंत काम करता है। खेत में इंटरनेट न होने पर ऑफलाइन मोड अपने आप चालू हो जाता है और घर लौटते ही डेटा सिंक होता है।',
        mr: 'नाही! फार्मकाइंड कोणत्याही सेन्सरशिवाय उपग्रह डेटावरून लगेच कार्य करते. शेतात रेंज नसल्यास ऑफलाइन मोड चालू होतो आणि नंतर डेटा आपोआप सिंक होतो.',
      },
    },
    {
      q: {
        en: 'How does Shared Solar work if I do not own solar panels?',
        hi: 'अगर मेरे पास सोलर पैनल नहीं हैं, तो साझा सोलर कैसे मिलेगा?',
        mr: 'माझ्याकडे स्वतःचे सोलर पॅनेल नसतील तर सामायिक सोलर कसे मिळेल?',
      },
      a: {
        en: 'Under community micro-grids, a central solar pump hub is installed by the village or FPO. Smallholder farmers book 1-2 hour pumping slots via FarmKind at ₹20/hr, paying only for the water pumped without spending ₹2.5 Lakhs.',
        hi: 'गाँव या एफपीओ द्वारा एक मुख्य सोलर पंप लगाया जाता है। छोटे किसान फार्मकाइंड से ₹20/घंटे में 1-2 घंटे का स्लॉट बुक करते हैं। आपको लाखों रुपये खर्च किए बिना केवल इस्तेमाल का भुगतान करना होता है।',
        mr: 'गाव किंवा शेतकरी उत्पादक कंपनीद्वारे एक मुख्य सौर पंप बसवला जातो. शेतकरी फार्मकाइंडवरून ₹२० प्रति तास दराने स्लॉट बुक करतात आणि गरजेपुरतेच पाणी वापरतात.',
      },
    },
    {
      q: {
        en: 'What if heatwaves ruin my tomatoes during transport?',
        hi: 'अगर रास्ते में भीषण गर्मी या जाम से टमाटर खराब होने लगें?',
        mr: 'वाहतुकीदरम्यान उष्णतेने टोमॅटो खराब होऊ लागले तर काय होते?',
      },
      a: {
        en: 'FarmKind Post-Harvest Shields continuously monitor heatwave warnings and truck transit temps. If spoilage risk exceeds safe limits, you are immediately routed to a verified solar cold room, boosting shelf life by +21 days and securing fair price contracts.',
        hi: 'फार्मकाइंड स्मार्ट इंजन रास्ते के तापमान की निगरानी करता है। खराबी का खतरा बढ़ते ही यह नजदीकी सोलर कोल्ड स्टोरेज का रास्ता दिखाता है, जिससे माल 21 दिन सुरक्षित रहता है और सही दाम मिलता है।',
        mr: 'फार्मकाइंड हवामान आणि वाहतुकीच्या तापमानावर सतत लक्ष ठेवते. धोका वाढल्यास माल जवळच्या सौर शीतगृहात हलवण्याचा सल्ला मिळतो आणि हमीभाव मिळतो.',
      },
    },
  ];

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      {/* Screen Header */}
      <SectionHeader
        screenId={0}
        eyebrow={TRANSLATIONS.screens[0].eyebrow[lang] || TRANSLATIONS.screens[0].eyebrow.en}
        title={TRANSLATIONS.screens[0].title[lang] || TRANSLATIONS.screens[0].title.en}
        subtitle={TRANSLATIONS.screens[0].subtitle[lang] || TRANSLATIONS.screens[0].subtitle.en}
      />

      {/* Audio Explainer Banner */}
      <div
        className="card card--solar mb-4 animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, rgba(13, 29, 52, 0.95) 0%, rgba(6, 14, 24, 0.95) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          padding: '18px 20px',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: isAudioPlaying ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                border: isAudioPlaying ? '1px solid var(--clr-farm-green)' : '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              {isAudioPlaying ? '🔊' : '🎙️'}
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: '#f0f9ff' }}>
                {isAudioPlaying
                  ? (lang === 'mr' ? 'ऑडिओ मार्गदर्शिका ऐकत आहात...' : lang === 'hi' ? 'ऑडियो गाइड चल रहा है...' : 'Playing Complete Audio Walkthrough...')
                  : (lang === 'mr' ? 'संपूर्ण मार्गदर्शिका मराठीत ऐका' : lang === 'hi' ? 'पूरी गाइड हिंदी में बोलकर सुनें' : 'Listen to Complete Spoken Walkthrough')}
              </h3>
              <p className="text-xs text-muted">
                {lang === 'mr' ? 'नैसर्गिक भारतीय आवाज · २ मिनिटांचे सोपे स्पष्टीकरण' : lang === 'hi' ? 'सहज भारतीय आवाज · 2 मिनट का सरल विवरण' : 'Natural Indian Voice Synth · Clear & Accessible'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              className={`btn ${isAudioPlaying ? 'btn--primary animate-pulse' : 'btn--solar'} flex-1 sm:flex-none`}
              onClick={handleToggleAudio}
              style={{ minWidth: '140px' }}
            >
              {isAudioPlaying ? '⏹ Stop Audio' : '▶ Play Voice Guide'}
            </button>
            <button
              className="btn btn--secondary btn--sm"
              onClick={openQuickGuide}
              title="Open Quick 1-Minute Summary Modal"
            >
              ⚡ Quick 1-Min Summary
            </button>
          </div>
        </div>
      </div>

      {/* Before vs After Comparison Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#f0f9ff' }}>
          <span>⚖️</span>
          <span>
            {lang === 'mr' ? 'पारंपरिक शेती विरुद्ध फार्मकाइंड पद्धत' : lang === 'hi' ? 'पारंपरिक खेती बनाम फार्मकाइंड पद्धति' : 'Traditional Flood-Diesel Farming vs FarmKind'}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1 */}
          <div className="card" style={{ background: 'rgba(10, 22, 40, 0.7)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="badge badge--danger">
                {lang === 'mr' ? 'पूर्वी: डिझेल पंप' : lang === 'hi' ? 'पहले: डीजल पंप' : 'Before: 5 HP Diesel'}
              </span>
              <span className="text-xs text-danger font-bold">₹5,143/mo</span>
            </div>
            <p className="text-xs text-muted mb-3" style={{ lineHeight: 1.4 }}>
              {lang === 'mr' ? '५४ लिटर डिझेलचा धूर आणि दरमहा ऑइलचा खर्च.' : lang === 'hi' ? 'हर महीने 54 लीटर डीजल और इंजन मेंटेनेंस का भारी खर्च।' : 'Burns 54 liters of diesel monthly with recurring engine oil wear.'}
            </p>
            <div className="pt-2 border-t border-glass flex items-center justify-between">
              <span className="badge badge--farm">
                {lang === 'mr' ? 'आता: सामायिक सोलर' : lang === 'hi' ? 'अब: साझा सोलर' : 'With FarmKind'}
              </span>
              <span className="text-xs text-farm-green font-bold">₹400/mo (92% बचत)</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ background: 'rgba(10, 22, 40, 0.7)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="badge badge--warning">
                {lang === 'mr' ? 'पूर्वी: मोकाट पाणी' : lang === 'hi' ? 'पहले: बाढ़ सिंचाई' : 'Before: Flood Irrigation'}
              </span>
              <span className="text-xs text-warning font-bold">4.8L Liters</span>
            </div>
            <p className="text-xs text-muted mb-3" style={{ lineHeight: 1.4 }}>
              {lang === 'mr' ? 'अंदाजाने सिंचन केल्याने मुळे सडतात आणि पाणी वाया जाते.' : lang === 'hi' ? 'अंदाजे से ज्यादा पानी देने से जड़ें घुटती हैं और भूजल खाली होता है।' : 'Pumping without telemetry drowns roots and wastes groundwater.'}
            </p>
            <div className="pt-2 border-t border-glass flex items-center justify-between">
              <span className="badge badge--farm">
                {lang === 'mr' ? 'आता: ३५% ऑटो-कट' : lang === 'hi' ? 'अब: 35% ऑटो-कट' : 'With FarmKind'}
              </span>
              <span className="text-xs text-farm-green font-bold">3.2L L saved/mo</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ background: 'rgba(10, 22, 40, 0.7)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="badge badge--danger">
                {lang === 'mr' ? 'पूर्वी: लाचारीने विक्री' : lang === 'hi' ? 'पहले: औने-पौने बिक्री' : 'Before: Distress Sale'}
              </span>
              <span className="text-xs text-danger font-bold">₹8/kg</span>
            </div>
            <p className="text-xs text-muted mb-3" style={{ lineHeight: 1.4 }}>
              {lang === 'mr' ? 'उष्णतेने माल खराब होण्याची भीती, दलालांना स्वस्तात विक्री.' : lang === 'hi' ? 'गर्मी में टमाटर खराब होने के डर से दलालों को औने-पौने बेचना।' : 'Produce spoils in heat, forcing fire-sales to middlemen at ₹8/kg.'}
            </p>
            <div className="pt-2 border-t border-glass flex items-center justify-between">
              <span className="badge badge--farm">
                {lang === 'mr' ? 'आता: शीतगृह व थेट करार' : lang === 'hi' ? 'अब: कोल्ड स्टोरेज व गारंटी' : 'With FarmKind'}
              </span>
              <span className="text-xs text-farm-green font-bold">₹31.25/kg direct</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Step Interactive Platform Journey */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-1 flex items-center gap-2" style={{ color: '#f0f9ff' }}>
          <span>🗺️</span>
          <span>
            {lang === 'mr' ? '७ पायऱ्यांमध्ये फार्मकाइंडचा सोपा प्रवास' : lang === 'hi' ? '7 चरणों में फार्मकाइंड का आसान सफर' : 'Your 7-Step Journey Across FarmKind'}
          </span>
        </h3>
        <p className="text-xs text-muted mb-4">
          {lang === 'mr'
            ? 'खालील कोणत्याही पायरीवर क्लिक करून तुम्ही थेट त्या स्क्रीनवर जाऊन प्रत्यक्षात काम करू शकता.'
            : lang === 'hi'
            ? 'नीचे दिए गए किसी भी चरण पर क्लिक करके आप सीधे उस स्क्रीन पर जाकर अभ्यास कर सकते हैं।'
            : 'Click any step below to jump directly into the live interactive screen.'}
        </p>

        <div className="flex flex-col gap-3">
          {STEPS.map(step => (
            <div
              key={step.screenId}
              className="card card--interactive"
              style={{
                background: 'rgba(10, 22, 40, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                padding: '16px 18px',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0,
                    }}
                  >
                    {step.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge--farm" style={{ fontSize: '10px' }}>
                        {step.badge}
                      </span>
                      <span className="badge badge--solar" style={{ fontSize: '10px' }}>
                        {step.keyResult[lang] || step.keyResult.en}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold" style={{ color: '#f0f9ff', marginBottom: '4px' }}>
                      {step.title[lang] || step.title.en}
                    </h4>

                    <p className="text-xs text-muted mb-1" style={{ color: '#bae6fd', fontWeight: 500 }}>
                      {step.summary[lang] || step.summary.en}
                    </p>

                    <p className="text-xs text-dim" style={{ color: '#94a3b8', lineHeight: 1.4, maxWidth: '780px' }}>
                      {step.details[lang] || step.details.en}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-glass">
                  <button
                    className="btn btn--primary btn--sm font-bold w-full sm:w-auto"
                    onClick={() => navigateTo(step.screenId)}
                    style={{ minWidth: 'min(170px, 100%)' }}
                  >
                    {step.actionLabel[lang] || step.actionLabel.en}
                  </button>
                  <span className="text-xs text-muted text-center sm:text-right" style={{ fontSize: '10px' }}>
                    Screen {step.screenId} of 7
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#f0f9ff' }}>
          <span>❓</span>
          <span>
            {lang === 'mr' ? 'शेतकऱ्यांचे नेहमीचे प्रश्न व उत्तरे' : lang === 'hi' ? 'किसानों के अक्सर पूछे जाने वाले सवाल' : 'Frequently Asked Questions'}
          </span>
        </h3>

        <div className="flex flex-col gap-2">
          {faqs.map((faq, i) => {
            const isOpen = expandedFaq === i;
            return (
              <div
                key={i}
                className="card"
                style={{
                  background: 'rgba(10, 22, 40, 0.7)',
                  border: isOpen ? '1px solid var(--clr-water-blue)' : '1px solid rgba(56, 189, 248, 0.15)',
                  cursor: 'pointer',
                  padding: '14px 16px',
                }}
                onClick={() => setExpandedFaq(isOpen ? null : i)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold" style={{ color: '#f0f9ff' }}>
                    {faq.q[lang] || faq.q.en}
                  </h4>
                  <span style={{ color: 'var(--clr-water-blue)', fontSize: '16px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </div>
                {isOpen && (
                  <p className="text-xs text-muted mt-2 pt-2 border-t border-glass" style={{ lineHeight: 1.5, color: '#94a3b8' }}>
                    {faq.a[lang] || faq.a.en}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Bar */}
      <div
        className="card card--farm text-center p-5"
        style={{
          background: 'linear-gradient(180deg, rgba(5, 46, 22, 0.8) 0%, rgba(2, 6, 23, 0.95) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
        }}
      >
        <h3 className="text-base font-bold mb-1" style={{ color: '#f0f9ff' }}>
          {lang === 'mr' ? 'आपल्या शेताची तपासणी सुरू करण्यास तयार आहात?' : lang === 'hi' ? 'क्या आप अपने खेत की जांच शुरू करने के लिए तैयार हैं?' : 'Ready to Start Exploring Your Farm?'}
        </h3>
        <p className="text-xs text-muted mb-3" style={{ maxWidth: '550px', margin: '0 auto 12px' }}>
          {lang === 'mr'
            ? 'पहिल्या स्क्रीनवरून सुरुवात करा आणि शेतातील डिझेल आणि पाण्याचा अपव्यय त्वरित शोधा.'
            : lang === 'hi'
            ? 'स्क्रीन 1 से शुरुआत करें और तुरंत जानें कि आपकी जमीन पर कितना पैसा बच सकता है।'
            : 'Begin with Screen 1 baseline diagnostic and immediately see your water, fuel, and cost savings.'}
        </p>
        <button
          className="btn btn--primary py-2.5 px-6 font-bold w-full sm:w-auto"
          onClick={() => navigateTo(1)}
        >
          {lang === 'mr' ? '🌱 स्क्रीन १: शेताची सद्यस्थिती पहा →' : lang === 'hi' ? '🌱 स्क्रीन 1: खेत की स्थिति देखें →' : '🌱 Go to Screen 1: Farm State →'}
        </button>
      </div>
    </div>
  );
}
