import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isSunlightMode: boolean;
  toggleSunlightMode: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const TRANSLATIONS: Record<string, Record<Language, string>> = {
  appTitle: {
    en: 'CareSphere',
    te: 'కేర్‌స్పియర్',
    hi: 'केयरस्फेयर'
  },
  subcentreBadge: {
    en: 'Chandrapuri Block • Sub-Centre Active',
    te: 'చంద్రపురి బ్లాక్ • సబ్-సెంటర్ యాక్టివ్',
    hi: 'चंद्रापुरी ब्लॉक • उप-केंद्र सक्रिय'
  },
  offlineActive: {
    en: 'Offline Active',
    te: 'ఆఫ్‌లైన్ క్రియాశీలం',
    hi: 'ऑफलाइन सक्रिय'
  },
  tabAssistant: {
    en: 'Protocol Assistant',
    te: 'ప్రోటోకాల్ అసిస్టెంట్',
    hi: 'प्रोटोकॉल सहायक'
  },
  tabVisits: {
    en: 'Visit Planner',
    te: 'గృహ సందర్శనలు',
    hi: 'भ्रमण योजना'
  },
  tabProtocols: {
    en: 'Protocol Explorer',
    te: 'ప్రోటోకాల్ గైడ్‌లైన్స్',
    hi: 'प्रोटोकॉल निर्देशिका'
  },
  searchPlaceholder: {
    en: 'Ask a clinical question or tap a shortcut...',
    te: 'ప్రశ్న అడగండి లేదా షార్ట్‌కట్ తాకండి...',
    hi: 'प्रश्न पूछें या शॉर्टकट चुनें...'
  },
  voiceListening: {
    en: 'Listening... speak clearly',
    te: 'వింటున్నాము... మాట్లాడండి',
    hi: 'सुन रहे हैं... कृपया बोलें'
  },
  call108Btn: {
    en: 'Call 108 Ambulance',
    te: '108 అంబులెన్స్ కాల్',
    hi: '108 एम्बुलेंस कॉल'
  },
  smsReferralBtn: {
    en: '2G SMS Referral',
    te: '2G ఎస్ఎంఎస్ రిఫరల్',
    hi: '2G एसएमएस रेफरल'
  },
  sirenAlertBtn: {
    en: 'Sound Siren Alert',
    te: 'సౌండ్ సైరన్ అలారం',
    hi: 'सायरन अलार्म'
  },
  stopSirenBtn: {
    en: 'Stop Siren',
    te: 'సైరన్ ఆపండి',
    hi: 'सायरन बंद करें'
  },
  registerPatientBtn: {
    en: '+ Register Patient',
    te: '+ కొత్త రోగి నమోదు',
    hi: '+ नया रोगी जोड़ें'
  },
  markDoneBtn: {
    en: 'Mark Done',
    te: 'పూర్తయింది',
    hi: 'पूर्ण करें'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isSunlightMode, setIsSunlightMode] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem('caresphere_lang').then((saved) => {
      if (saved === 'te' || saved === 'hi' || saved === 'en') {
        setLanguageState(saved);
      }
    });
    AsyncStorage.getItem('caresphere_sunlight').then((saved) => {
      if (saved === 'true') setIsSunlightMode(true);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem('caresphere_lang', lang);
  };

  const toggleSunlightMode = () => {
    setIsSunlightMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem('caresphere_sunlight', String(next));
      return next;
    });
  };

  const t = (key: string): string => {
    return TRANSLATIONS[key]?.[language] || TRANSLATIONS[key]?.['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isSunlightMode, toggleSunlightMode, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
