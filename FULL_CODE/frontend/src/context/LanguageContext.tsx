import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, getTranslation } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  currentDateFormatted: string;
  currentTimeFormatted: string;
  isSunlightMode: boolean;
  toggleSunlightMode: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const TELUGU_MONTHS = [
  "జనవరి", "ఫిబ్రవరి", "మార్చి", "ఏప్రిల్", "మే", "జూన్",
  "జూలై", "ఆగస్టు", "సెప్టెంబర్", "అక్టోబర్", "నవంబర్", "డిసెంబర్"
];

const TELUGU_DAYS = [
  "ఆదివారం", "సోమవారం", "మంగళవారం", "బుధవారం", "గురువారం", "శుక్రవారం", "శనివారం"
];

const HINDI_MONTHS = [
  "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
];

const HINDI_DAYS = [
  "रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('asha_companion_lang');
    return saved === 'te' || saved === 'hi' ? saved : 'en';
  });

  const [isSunlightMode, setIsSunlightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('caresphere_sunlight_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [now, setNow] = useState<Date>(new Date());

  // Sunlight Mode class update
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isSunlightMode) {
        document.documentElement.classList.add('sunlight-mode');
      } else {
        document.documentElement.classList.remove('sunlight-mode');
      }
    }
  }, [isSunlightMode]);

  const toggleSunlightMode = () => {
    setIsSunlightMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('caresphere_sunlight_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Automatic live date and time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('asha_companion_lang', newLang);
  };

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  // Format date and time dynamically according to selected language
  const formatDate = (date: Date, lang: Language): string => {
    const day = date.getDate();
    const monthIdx = date.getMonth();
    const year = date.getFullYear();
    const dayOfWeek = date.getDay();

    if (lang === 'te') {
      return `${TELUGU_DAYS[dayOfWeek]}, ${day} ${TELUGU_MONTHS[monthIdx]} ${year}`;
    } else if (lang === 'hi') {
      return `${HINDI_DAYS[dayOfWeek]}, ${day} ${HINDI_MONTHS[monthIdx]} ${year}`;
    } else {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const dayNames = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
      ];
      return `${dayNames[dayOfWeek]}, ${day} ${monthNames[monthIdx]} ${year}`;
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const currentDateFormatted = formatDate(now, language);
  const currentTimeFormatted = formatTime(now);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      currentDateFormatted,
      currentTimeFormatted,
      isSunlightMode,
      toggleSunlightMode
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
